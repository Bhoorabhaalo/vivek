import numpy as np
import pandas as pd
from typing import Dict, List
from app.schemas.portfolio import AssetPosition


class RiskCalculator:
    def __init__(self, risk_free_rate: float = 0.02):
        self.risk_free_rate = risk_free_rate

    def _get_portfolio_returns(
            self, weights: np.ndarray, asset_returns: pd.DataFrame) -> pd.Series:
        return asset_returns.dot(weights)

    def calculate_var_historical(
            self, returns: pd.Series, confidence_level: float = 0.95) -> float:
        """Historical Simulation VaR"""
        if returns.empty:
            return 0.0
        return float(np.percentile(returns, (1 - confidence_level) * 100))

    def calculate_var_parametric(
            self, returns: pd.Series, confidence_level: float = 0.95) -> float:
        """Parametric Variance-Covariance VaR"""
        from scipy.stats import norm
        if returns.empty:
            return 0.0
        mu = returns.mean()
        sigma = returns.std()
        return float(norm.ppf(1 - confidence_level, mu, sigma))

    def calculate_cvar(self, returns: pd.Series,
                       confidence_level: float = 0.95) -> float:
        """Expected Shortfall (CVaR)"""
        if returns.empty:
            return 0.0
        var = self.calculate_var_historical(returns, confidence_level)
        losses_beyond_var = returns[returns <= var]
        if losses_beyond_var.empty:
            return var
        return float(losses_beyond_var.mean())

    def calculate_volatility(self, returns: pd.Series,
                             window: int = 30) -> float:
        """Rolling volatility (annualized assuming daily returns)"""
        if len(returns) < window:
            return float(returns.std() * np.sqrt(252))
        return float(returns.tail(window).std() * np.sqrt(252))

    def calculate_max_drawdown(self, returns: pd.Series) -> float:
        """Peak-to-trough max drawdown"""
        if returns.empty:
            return 0.0
        cumulative = (1 + returns).cumprod()
        peak = cumulative.expanding(min_periods=1).max()
        drawdown = (cumulative - peak) / peak
        return float(drawdown.min())

    def calculate_liquidity_score(
            self, positions: List[AssetPosition]) -> float:
        """Tiered weighting: Cash(1) > T-Bills(2) > LargeCap(3) > Corp(4) > Alt(5)"""
        if not positions:
            return 0.0
        total_value = sum(p.quantity * p.cost_basis for p in positions)
        if total_value == 0:
            return 0.0

        # Invert tier so tier 1 gets highest score (e.g., 5), tier 5 gets 1.
        weighted_score = 0.0
        for p in positions:
            weight = (p.quantity * p.cost_basis) / total_value
            score = 6 - p.liquidity_tier  # 1->5, 2->4, 3->3, 4->2, 5->1
            weighted_score += weight * score

        # Normalize to 0-100 scale (where tier 1 = 100, tier 5 = 20)
        return (weighted_score / 5) * 100

    def calculate_hhi(self, positions: List[AssetPosition]) -> float:
        """Herfindahl-Hirschman Index for concentration"""
        if not positions:
            return 0.0
        total_value = sum(p.quantity * p.cost_basis for p in positions)
        if total_value == 0:
            return 0.0

        hhi = 0.0
        for p in positions:
            weight = (p.quantity * p.cost_basis) / total_value
            hhi += (weight * 100) ** 2
        return hhi

    def calculate_sharpe_ratio(self, returns: pd.Series) -> float:
        """Annualized Sharpe Ratio"""
        if returns.empty:
            return 0.0
        mu = returns.mean() * 252
        sigma = returns.std() * np.sqrt(252)
        if sigma == 0:
            return 0.0
        return float((mu - self.risk_free_rate) / sigma)

    def calculate_sortino_ratio(self, returns: pd.Series) -> float:
        """Annualized Sortino Ratio"""
        if returns.empty:
            return 0.0
        mu = returns.mean() * 252
        downside_returns = returns[returns < 0]
        downside_sigma = downside_returns.std() * np.sqrt(252)
        if downside_sigma == 0 or pd.isna(downside_sigma):
            return 0.0
        return float((mu - self.risk_free_rate) / downside_sigma)

    def calculate_beta(self, asset_returns: pd.Series,
                       benchmark_returns: pd.Series) -> float:
        """Beta relative to benchmark"""
        if len(asset_returns) < 2 or len(benchmark_returns) < 2:
            return 1.0
        cov = np.cov(asset_returns, benchmark_returns)[0][1]
        var = np.var(benchmark_returns)
        if var == 0:
            return 1.0
        return float(cov / var)

    def calculate_lcr(
            self, positions: List[AssetPosition], projected_outflows: float = 100000.0) -> float:
        """Simplified Liquidity Coverage Ratio (LCR)"""
        liquid_assets = sum(
            p.quantity *
            p.cost_basis for p in positions if p.liquidity_tier in [
                1,
                2])
        if projected_outflows <= 0:
            return float('inf')
        return float(liquid_assets / projected_outflows)

    def generate_full_risk_report(
            self, positions: List[AssetPosition], history: pd.DataFrame, benchmark_history: pd.Series = None) -> Dict[str, float]:
        """Runs all risk metrics based on current positions and history"""
        if history.empty or not positions:
            return {}

        # Align assets
        asset_ids = [p.asset_id for p in positions]
        available_assets = [a for a in asset_ids if a in history.columns]

        if not available_assets:
            return {}

        returns = history[available_assets].pct_change().dropna()

        total_value = sum(
            p.quantity *
            p.cost_basis for p in positions if p.asset_id in available_assets)
        weights = np.array([(p.quantity * p.cost_basis) /
                           total_value for p in positions if p.asset_id in available_assets])

        port_returns = self._get_portfolio_returns(weights, returns)

        report = {
            "var_95_hist": self.calculate_var_historical(port_returns, 0.95),
            "var_99_hist": self.calculate_var_historical(port_returns, 0.99),
            "var_95_param": self.calculate_var_parametric(port_returns, 0.95),
            "cvar_95": self.calculate_cvar(port_returns, 0.95),
            "vol_30d": self.calculate_volatility(port_returns, 30),
            "vol_90d": self.calculate_volatility(port_returns, 90),
            "max_drawdown": self.calculate_max_drawdown(port_returns),
            "liquidity_score": self.calculate_liquidity_score(positions),
            "hhi": self.calculate_hhi(positions),
            "sharpe_ratio": self.calculate_sharpe_ratio(port_returns),
            "sortino_ratio": self.calculate_sortino_ratio(port_returns),
            "lcr": self.calculate_lcr(positions)
        }

        if benchmark_history is not None and not benchmark_history.empty:
            bench_returns = benchmark_history.pct_change().dropna()
            # Align dates
            aligned_port, aligned_bench = port_returns.align(
                bench_returns, join='inner')
            report["beta"] = self.calculate_beta(aligned_port, aligned_bench)

        from app.services.risk_engine.backtest import kupiec_backtester
        report["var_backtest"] = kupiec_backtester.evaluate_portfolio(positions, history, window=250)

        return report

    def backtest_var_kupiec(
            self, positions: List[AssetPosition], history: pd.DataFrame, window: int = 250) -> Dict[str, Any]:
        from app.services.risk_engine.backtest import kupiec_backtester
        return kupiec_backtester.evaluate_portfolio(positions, history, window=window)


risk_calculator = RiskCalculator()

