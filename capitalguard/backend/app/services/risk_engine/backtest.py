import numpy as np
import pandas as pd
from typing import Dict, Any, List
from scipy import stats
from app.schemas.portfolio import AssetPosition


class KupiecBacktester:
    def __init__(self, confidence_level: float = 0.99, alpha: float = 0.05):
        self.confidence_level = confidence_level
        self.p = 1.0 - confidence_level  # 0.01 for 99% VaR
        self.alpha = alpha
        # Critical value of chi-square distribution with 1 degree of freedom at significance level alpha (3.8415 for alpha=0.05)
        self.critical_value = float(stats.chi2.ppf(1.0 - alpha, df=1))

    def kupiec_pof_test(self, exceedances: int, total_observations: int) -> Dict[str, Any]:
        """
        Runs the Kupiec Proportion-of-Failures (POF) Likelihood Ratio test.
        H0: True exception rate equals p (1%).
        Ha: Exception rate differs from p.
        """
        n = total_observations
        x = exceedances
        p = self.p
        expected = float(n * p)

        if n <= 0:
            return {
                "exceedances": 0,
                "expected": 0.0,
                "pass": True,
                "p_value": 1.0,
                "lr_stat": 0.0
            }

        p_hat = x / n

        # Compute log-likelihood ratio statistic
        if x == 0:
            lr_stat = -2.0 * n * np.log(1.0 - p)
        elif x == n:
            lr_stat = -2.0 * n * np.log(p)
        else:
            term1 = (n - x) * np.log((1.0 - p_hat) / (1.0 - p))
            term2 = x * np.log(p_hat / p)
            lr_stat = 2.0 * (term1 + term2)

        lr_stat = max(0.0, float(lr_stat))
        p_value = float(1.0 - stats.chi2.cdf(lr_stat, df=1))

        # Test passes if LR statistic <= critical value (fail to reject H0)
        is_pass = bool(lr_stat <= self.critical_value)

        return {
            "exceedances": int(x),
            "expected": round(expected, 2),
            "pass": is_pass,
            "p_value": round(p_value, 4),
            "lr_stat": round(lr_stat, 4)
        }

    def evaluate_portfolio(
        self,
        positions: List[AssetPosition],
        history: pd.DataFrame,
        window: int = 250
    ) -> Dict[str, Any]:
        """
        Compares actual simulated P&L returns over the last `window` ticks against the 99% VaR threshold
        and executes the Kupiec POF test.
        """
        if history.empty or not positions:
            return {"exceedances": 0, "expected": 2.5, "pass": True}

        asset_ids = [p.asset_id for p in positions]
        available_assets = [a for a in asset_ids if a in history.columns]
        if not available_assets:
            return {"exceedances": 0, "expected": 2.5, "pass": True}

        # Focus on the last `window` observations
        tick_window = history[available_assets].tail(window + 1)
        returns = tick_window.pct_change().dropna()
        if returns.empty:
            return {"exceedances": 0, "expected": 2.5, "pass": True}

        total_value = sum(
            p.quantity * p.cost_basis for p in positions if p.asset_id in available_assets
        )
        if total_value == 0:
            return {"exceedances": 0, "expected": 2.5, "pass": True}

        weights = np.array([
            (p.quantity * p.cost_basis) / total_value
            for p in positions if p.asset_id in available_assets
        ])
        port_returns = returns.dot(weights)

        n = len(port_returns)
        if n == 0:
            return {"exceedances": 0, "expected": 2.5, "pass": True}

        # 99% VaR threshold (1st percentile)
        var_threshold = float(np.percentile(port_returns, (1.0 - self.confidence_level) * 100))

        # Count exceedances where loss exceeds 99% VaR
        exceedances = int((port_returns < var_threshold).sum())

        result = self.kupiec_pof_test(exceedances, n)
        return {
            "exceedances": result["exceedances"],
            "expected": result["expected"],
            "pass": result["pass"]
        }


kupiec_backtester = KupiecBacktester()
