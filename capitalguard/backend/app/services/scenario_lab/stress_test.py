import pandas as pd
from typing import Dict, List, Optional, Tuple
import copy
from app.schemas.portfolio import AssetPosition
from app.services.risk_engine.calculator import risk_calculator


class Scenario:
    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description

    def apply(self, positions: List[AssetPosition],
              history: pd.DataFrame) -> Tuple[List[AssetPosition], pd.DataFrame]:
        """Returns shocked positions and shocked history (for correlation changes etc.)"""
        raise NotImplementedError


class EquityCrashScenario(Scenario):
    def __init__(self, shock_pct: float = -0.20):
        super().__init__(
            "Equity Crash",
            f"Broad equities drop by {
                abs(shock_pct) *
                100}% and correlations tend toward 1")
        self.shock_pct = shock_pct

    def apply(self, positions: List[AssetPosition], history: pd.DataFrame):
        shocked_positions = copy.deepcopy(positions)
        for p in shocked_positions:
            if p.asset_class.lower() == 'equity':
                p.cost_basis = p.cost_basis * (1 + self.shock_pct)

        # Simulate correlation breakdown in history by blending with a single
        # market factor
        shocked_history = history.copy()
        if not shocked_history.empty:
            market_factor = shocked_history.mean(axis=1)
            for col in shocked_history.columns:
                # Blend 50% towards market factor to increase correlation
                shocked_history[col] = 0.5 * \
                    shocked_history[col] + 0.5 * market_factor

        return shocked_positions, shocked_history


class InterestRateShockScenario(Scenario):
    def __init__(self, bps_shift: float = 200):
        super().__init__("Interest Rate Shock",
                         f"+{bps_shift} bps parallel shift in yield curve")
        self.bps_shift = bps_shift

    def apply(self, positions: List[AssetPosition], history: pd.DataFrame):
        shocked_positions = copy.deepcopy(positions)
        for p in shocked_positions:
            if p.asset_class.lower() in ['bond', 'fixed_income']:
                # Simplified duration assumption (e.g. average duration 5)
                assumed_duration = 5.0
                price_drop = -(self.bps_shift / 10000.0) * assumed_duration
                p.cost_basis = p.cost_basis * (1 + price_drop)
        return shocked_positions, history


class LiquidityFreezeScenario(Scenario):
    def __init__(self):
        super().__init__(
            "Liquidity Freeze",
            "Bid-ask spreads widen, liquidity tiers downgrade")

    def apply(self, positions: List[AssetPosition], history: pd.DataFrame):
        shocked_positions = copy.deepcopy(positions)
        for p in shocked_positions:
            if p.liquidity_tier > 1:
                # Downgrade liquidity
                p.liquidity_tier = min(5, p.liquidity_tier + 1)
            # Price penalty for illiquidity
            penalty = (p.liquidity_tier - 1) * 0.02  # 2% drop per tier
            p.cost_basis = p.cost_basis * (1 - penalty)
        return shocked_positions, history


class CreditSpreadWideningScenario(Scenario):
    def __init__(self, spread_bps: float = 300):
        super().__init__("Credit Spread Widening",
                         f"Corporate bond spreads widen by {spread_bps} bps")
        self.spread_bps = spread_bps

    def apply(self, positions: List[AssetPosition], history: pd.DataFrame):
        shocked_positions = copy.deepcopy(positions)
        for p in shocked_positions:
            if p.asset_class.lower() == 'corporate_bond':
                assumed_duration = 4.0
                price_drop = -(self.spread_bps / 10000.0) * assumed_duration
                p.cost_basis = p.cost_basis * (1 + price_drop)
        return shocked_positions, history


class FXShockScenario(Scenario):
    def __init__(self, fx_drop_pct: float = -0.15):
        super().__init__(
            "FX Shock",
            f"Base currency strengthens, foreign assets drop {
                abs(fx_drop_pct) * 100}%")
        self.fx_drop_pct = fx_drop_pct

    def apply(self, positions: List[AssetPosition], history: pd.DataFrame):
        shocked_positions = copy.deepcopy(positions)
        # Simplified: assuming anything not explicitly domestic is foreign
        for p in shocked_positions:
            if getattr(p, 'currency', 'USD') != 'USD':
                p.cost_basis = p.cost_basis * (1 + self.fx_drop_pct)
        return shocked_positions, history


class CustomFactorScenario(Scenario):
    def __init__(self, target_asset_class: str, shock_pct: float):
        super().__init__(
            "Custom Shock",
            f"{target_asset_class} changes by {
                shock_pct * 100}%")
        self.target_asset_class = target_asset_class
        self.shock_pct = shock_pct

    def apply(self, positions: List[AssetPosition], history: pd.DataFrame):
        shocked_positions = copy.deepcopy(positions)
        for p in shocked_positions:
            if p.asset_class.lower() == self.target_asset_class.lower():
                p.cost_basis = p.cost_basis * (1 + self.shock_pct)
        return shocked_positions, history


class ScenarioLab:
    def __init__(self):
        self.canned_scenarios = {
            "equity_crash": EquityCrashScenario(),
            "rate_shock": InterestRateShockScenario(),
            "liquidity_freeze": LiquidityFreezeScenario(),
            "credit_spread": CreditSpreadWideningScenario(),
            "fx_shock": FXShockScenario()
        }

    def run_scenario(self, scenario_id: str, positions: List[AssetPosition],
                     history: pd.DataFrame, custom_scenario: Optional[Scenario] = None) -> Dict:
        if custom_scenario:
            scenario = custom_scenario
        else:
            if scenario_id not in self.canned_scenarios:
                raise ValueError(f"Unknown scenario ID: {scenario_id}")
            scenario = self.canned_scenarios[scenario_id]

        # 1. Baseline risk calculation
        baseline_metrics = risk_calculator.generate_full_risk_report(
            positions, history)
        baseline_value = sum(p.quantity * p.cost_basis for p in positions)

        # 2. Apply shock (creates deep copies)
        shocked_positions, shocked_history = scenario.apply(positions, history)

        # 3. Shocked risk calculation
        shocked_metrics = risk_calculator.generate_full_risk_report(
            shocked_positions, shocked_history)
        shocked_value = sum(
            p.quantity *
            p.cost_basis for p in shocked_positions)

        return {
            "scenario_name": scenario.name,
            "description": scenario.description,
            "baseline_value": baseline_value,
            "shocked_value": shocked_value,
            "impact_pct": (shocked_value - baseline_value) / baseline_value if baseline_value > 0 else 0,
            "baseline_metrics": baseline_metrics,
            "shocked_metrics": shocked_metrics
        }


scenario_lab = ScenarioLab()
