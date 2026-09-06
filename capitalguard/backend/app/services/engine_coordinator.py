import asyncio
import random
import pandas as pd
from typing import Dict
import numpy as np

from datetime import datetime, timezone
from concurrent.futures import ProcessPoolExecutor

from app.services.market_data.feeder import feeder
from app.services.scenario_lab.stress_test import scenario_lab
from app.schemas.portfolio import AssetPosition
from app.services.optimizer.solver import OptimizationConstraints
from app.db.database import SessionLocal
from app.db.models import AuditLogEvent


def _run_risk(portfolio, history):
    from app.services.risk_engine.calculator import risk_calculator
    return risk_calculator.generate_full_risk_report(portfolio, history)


def _run_opt(portfolio, history, constraints):
    from app.services.optimizer.solver import PortfolioOptimizer
    if history.empty:
        return {"status": "failed"}
    returns_df = history.pct_change().dropna()
    total_val = sum(p.quantity * p.cost_basis for p in portfolio)
    if total_val == 0:
        return {"status": "failed"}
    asset_ids = [p.asset_id for p in portfolio if p.asset_id in returns_df.columns]
    if not asset_ids:
        return {"status": "failed"}
    
    returns_df = returns_df[asset_ids]
    current_weights = np.array([(p.quantity * p.cost_basis)/total_val for p in portfolio if p.asset_id in asset_ids])
    liquidity_tiers = np.array([p.liquidity_tier for p in portfolio if p.asset_id in asset_ids])
    
    optimizer = PortfolioOptimizer()
    try:
        res = optimizer.solve(returns_df, current_weights, liquidity_tiers, constraints)
        exp_vol = res.get("expected_volatility", 0)
        sharpe = res.get("expected_return", 0) / exp_vol if exp_vol > 0 else 0
        return {
            "status": "optimal",
            "expected_return": res.get("expected_return", 0),
            "volatility": exp_vol,
            "sharpe_ratio": sharpe
        }
    except Exception as e:
        return {"status": "failed"}


class EngineCoordinator:
    def __init__(self):
        self.executor = ProcessPoolExecutor(max_workers=2)
        self.portfolio = [
            AssetPosition(
                asset_id="AAPL",
                quantity=100000,
                cost_basis=150.0,
                asset_class="Equity",
                liquidity_tier=1),
            AssetPosition(
                asset_id="MSFT",
                quantity=80000,
                cost_basis=350.0,
                asset_class="Equity",
                liquidity_tier=1),
            AssetPosition(
                asset_id="US-T 10Y",
                quantity=200000,
                cost_basis=98.0,
                asset_class="Fixed Income",
                liquidity_tier=1),
            AssetPosition(
                asset_id="CORP-B",
                quantity=50000,
                cost_basis=102.0,
                asset_class="Corporate_Bond",
                liquidity_tier=3),
        ]
        self.state = {
            "aum": 0.0,
            "var_99": -12100000.0,
            "sharpe": 1.84,
            "utilization": 82.4,
            "beta": 0.85,
            "drawdown": -0.5,
            "drift": {
                "US Equities": {"target": 40, "actual": 40.5, "status": "Near"},
                "Treasuries": {"target": 30, "actual": 29.5, "status": "Near"},
                "Corp Bonds": {"target": 20, "actual": 20.0, "status": "Near"},
                "Cash/Alts": {"target": 10, "actual": 10.0, "status": "Near"},
            },
            "leverage": {"gross": 1.2, "lcr": 118},
            "frontier": {"expected_return": 8.5, "volatility": 12.0},
            "logs": [],
            "automated_action": None,
            "demo_state": "calm",
            "scenario_result": None,
            "component_var": {},
            "var_backtest": {
                "exceedances": 2,
                "expected": 2.5,
                "pass": True
            }
        }
        self.clients = set()
        self.history = pd.DataFrame()

    def start(self):
        assets = [p.asset_id for p in self.portfolio]
        self.history = feeder.generate_synthetic_history(assets, days=250)
        feeder.add_subscriber(self.on_tick)
        asyncio.create_task(
            feeder.run_replay(
                speed_factor=1.0,
                interval_seconds=2.0))

    async def on_tick(self, prices: Dict[str, float]):
        aum = 0.0
        for p in self.portfolio:
            if p.asset_id in prices:
                p.cost_basis = prices[p.asset_id]
            aum += p.quantity * p.cost_basis
        self.state["aum"] = aum

        try:
            new_row = pd.DataFrame([prices])
            self.history = pd.concat(
                [self.history, new_row], ignore_index=True)
            if len(self.history) > 250:
                self.history = self.history.iloc[-250:]

            loop = asyncio.get_running_loop()

            # Offload heavy compute to process pool
            risk_task = loop.run_in_executor(
                self.executor, _run_risk, self.portfolio, self.history)

            constraints = OptimizationConstraints(
                long_only=True,
                max_weight_per_asset=0.15,
                min_liquidity_buffer=0.05
            )
            opt_task = loop.run_in_executor(
                self.executor, _run_opt, self.portfolio, self.history, constraints)

            risk_report, opt_res = await asyncio.gather(risk_task, opt_task)

            self.state["var_99"] = risk_report.get("var_99_hist", 0) * aum
            self.state["component_var"] = {}
            if "var_backtest" in risk_report:
                self.state["var_backtest"] = risk_report["var_backtest"]

            asset_values = {}
            for p in self.portfolio:
                cls = p.asset_class
                asset_values[cls] = asset_values.get(
                    cls, 0) + (p.quantity * p.cost_basis)

            us_eq = asset_values.get("Equity", 0)
            tsy = asset_values.get("Fixed Income", 0)
            corp = asset_values.get("Corporate_Bond", 0)

            self.state["drift"]["US Equities"]["actual"] = (
                us_eq / aum) * 100 if aum else 0
            self.state["drift"]["Treasuries"]["actual"] = (
                tsy / aum) * 100 if aum else 0
            self.state["drift"]["Corp Bonds"]["actual"] = (
                corp / aum) * 100 if aum else 0

            if opt_res["status"] == "optimal":
                self.state["frontier"]["expected_return"] = opt_res["expected_return"] * 100
                self.state["frontier"]["volatility"] = opt_res["volatility"] * 100
                self.state["sharpe"] = opt_res["sharpe_ratio"]
        except Exception as e:
            print(f"Engine calculation error: {e}")

        if self.state["demo_state"] == "shock":
            self.state["drawdown"] = -2.5
            self.state["automated_action"] = {
                "rationale": "Tier 3 trigger: Daily VaR (99%) breached the $15M threshold with a 12% rate of change in 15 minutes. Automatically staged a defensive hedge in 10Y Treasuries.",
                "metricsSnapshot": {
                    "VaR_99": f"${self.state['var_99'] / 1e6:.1f}M",
                    "ROC_15m": "+12.4%",
                    "Liq_Score": "82",
                    "Status": "HEDGED"
                }
            }
            if not any(log_entry.get("isHedge") for log_entry in self.state["logs"]):
                new_log = {
                    "time": datetime.now(timezone.utc).strftime("%H:%M:%S.%f")[:-3],
                    "inst": "US-T 10Y",
                    "side": "BUY",
                    "notional": "$15.0M",
                    "algo": "VWAP",
                    "price": f"{prices.get('US-T 10Y', 100):.2f}",
                    "latency": f"{random.randint(20, 50)}ms",
                    "status": "FILLED",
                    "isHedge": True
                }
                self.state["logs"].insert(0, new_log)
                self._persist_log(new_log)
        else:
            self.state["drawdown"] = -0.5 + random.uniform(-0.1, 0.1)
            self.state["automated_action"] = None
            self.state["logs"] = [log_entry for log_entry in self.state["logs"] if not log_entry.get("isHedge")]

        if random.random() < 0.3:
            new_log = {
                "time": datetime.now(timezone.utc).strftime("%H:%M:%S.%f")[:-3],
                "inst": random.choice(list(prices.keys())),
                "side": random.choice(["BUY", "SELL"]),
                "notional": f"${random.uniform(0.1, 5.0):.1f}M",
                "algo": random.choice(["TWAP", "VWAP", "SMART"]),
                "price": f"{list(prices.values())[0]:.2f}",
                "latency": f"{random.randint(15, 60)}ms",
                "status": "FILLED",
                "isHedge": False
            }
            self.state["logs"].insert(0, new_log)
            self._persist_log(new_log)
            if len(self.state["logs"]) > 10:
                self.state["logs"] = self.state["logs"][:10]

        await self.broadcast()

    def _persist_log(self, log_dict):
        db = SessionLocal()
        try:
            event = AuditLogEvent(
                instrument=log_dict["inst"],
                side=log_dict["side"],
                notional=log_dict["notional"],
                algo=log_dict["algo"],
                price=log_dict["price"],
                latency=log_dict["latency"],
                status=log_dict["status"],
                is_hedge=log_dict["isHedge"]
            )
            db.add(event)
            db.commit()
        except Exception as e:
            print(f"DB Error: {e}")
        finally:
            db.close()

    def set_demo_state(self, state: str):
        self.state["demo_state"] = state

    async def run_scenario(self, scenario_id: str, params: dict = None):
        try:
            if scenario_id == "custom" and params:
                from app.services.scenario_lab.stress_test import (
                    EquityCrashScenario,
                    InterestRateShockScenario,
                    CreditSpreadWideningScenario,
                )
                import copy

                equity_pct = float(params.get("equity_pct", 0)) / 100.0
                rate_bps = float(params.get("rate_bps", 0))
                credit_bps = float(params.get("credit_bps", 0))

                # Apply all three shocks sequentially using existing scenario math
                shocked_positions = copy.deepcopy(self.portfolio)
                shocked_history = self.history.copy()

                if equity_pct != 0:
                    eq_scenario = EquityCrashScenario(shock_pct=equity_pct)
                    shocked_positions, shocked_history = eq_scenario.apply(
                        shocked_positions, shocked_history
                    )
                if rate_bps != 0:
                    rate_scenario = InterestRateShockScenario(bps_shift=rate_bps)
                    shocked_positions, shocked_history = rate_scenario.apply(
                        shocked_positions, shocked_history
                    )
                if credit_bps != 0:
                    credit_scenario = CreditSpreadWideningScenario(spread_bps=credit_bps)
                    shocked_positions, shocked_history = credit_scenario.apply(
                        shocked_positions, shocked_history
                    )

                from app.services.risk_engine.calculator import risk_calculator
                baseline_value = sum(p.quantity * p.cost_basis for p in self.portfolio)
                shocked_value = sum(p.quantity * p.cost_basis for p in shocked_positions)
                shocked_metrics = risk_calculator.generate_full_risk_report(
                    shocked_positions, shocked_history
                )
                impact_pct = (
                    (shocked_value - baseline_value) / baseline_value
                    if baseline_value > 0 else 0
                )
                dollar_var = shocked_value * shocked_metrics.get("var_99_hist", 0)
                res_id = "custom"
            else:
                scenario_mapping = {
                    "2008_crash": "equity_crash",
                    "covid_shock": "liquidity_freeze",
                    "inflation_spike": "rate_shock",
                }
                backend_id = scenario_mapping.get(scenario_id, scenario_id)
                res = scenario_lab.run_scenario(backend_id, self.portfolio, self.history)
                impact_pct = res["impact_pct"]
                shocked_value = res["shocked_value"]
                dollar_var = shocked_value * res["shocked_metrics"].get("var_99_hist", 0)
                res_id = scenario_id

            self.state["scenario_result"] = {
                "id": res_id,
                "impactVaR": f"${dollar_var / 1e6:.2f}M",
                "impactDrawdown": f"{impact_pct * 100:.2f}%",
            }
            await self.broadcast()
        except Exception as e:
            print(f"Scenario error: {e}")

    async def broadcast(self):
        if not self.clients:
            return
        dead_clients = set()
        for client in self.clients:
            try:
                await client.send_json(self.state)
            except Exception:
                dead_clients.add(client)
        self.clients -= dead_clients


coordinator = EngineCoordinator()
