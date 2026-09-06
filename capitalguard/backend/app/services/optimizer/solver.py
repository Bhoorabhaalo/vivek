import numpy as np
import pandas as pd
import cvxpy as cp
from scipy.optimize import minimize
from typing import Dict, Optional, Tuple
import logging

logger = logging.getLogger(__name__)


class OptimizationConstraints:
    def __init__(self,
                 long_only: bool = True,
                 max_weight_per_asset: float = 0.15,
                 min_liquidity_buffer: float = 0.05,
                 max_leverage: float = 1.0,
                 turnover_cap: float = 0.20,
                 turnover_penalty_kappa: float = 0.01):
        self.long_only = long_only
        self.max_weight_per_asset = max_weight_per_asset
        self.min_liquidity_buffer = min_liquidity_buffer
        self.max_leverage = max_leverage
        self.turnover_cap = turnover_cap
        self.turnover_penalty_kappa = turnover_penalty_kappa


class PortfolioOptimizer:
    def __init__(self, risk_aversion: float = 2.0):
        self.risk_aversion = risk_aversion

    def _shrink_covariance(self, returns: pd.DataFrame) -> np.ndarray:
        """
        Implements Ledoit-Wolf covariance shrinkage.
        Uses a basic constant correlation target shrinkage if sklearn is not available,
        but assumes standard implementation for this demo.
        """
        try:
            from sklearn.covariance import LedoitWolf
            lw = LedoitWolf()
            return lw.fit(returns).covariance_
        except ImportError:
            logger.warning(
                "sklearn not found. Using simple sample covariance.")
            return returns.cov().values

    def optimize_cvxpy(self,
                       expected_returns: np.ndarray,
                       cov_matrix: np.ndarray,
                       current_weights: np.ndarray,
                       liquidity_tiers: np.ndarray,
                       constraints: OptimizationConstraints) -> Tuple[np.ndarray, str]:
        """
        Solves Markowitz mean-variance with turnover penalty using cvxpy.
        Objective: Maximize w^T * mu - lambda * w^T * Cov * w - kappa * sum(|w - w_old|)
        """
        n_assets = len(expected_returns)
        w = cp.Variable(n_assets)

        # Objective components
        portfolio_return = w.T @ expected_returns
        portfolio_variance = cp.quad_form(w, cov_matrix)
        turnover_penalty = constraints.turnover_penalty_kappa * \
            cp.norm(w - current_weights, 1)

        objective = cp.Maximize(portfolio_return -
                                (self.risk_aversion /
                                 2) *
                                portfolio_variance -
                                turnover_penalty)

        # Constraints
        cons = []

        # Fully invested
        if constraints.long_only:
            cons.append(cp.sum(w) == 1)
            cons.append(w >= 0)
            cons.append(w <= constraints.max_weight_per_asset)
        else:
            cons.append(cp.sum(w) == 1)
            cons.append(cp.sum(cp.abs(w)) <= constraints.max_leverage)
            cons.append(w <= constraints.max_weight_per_asset)
            cons.append(w >= -constraints.max_weight_per_asset)

        # Liquidity buffer (assuming tier 1 is cash-like)
        # liquidity_tiers is array of tiers (1 to 5)
        is_tier_1 = (liquidity_tiers == 1).astype(float)
        cons.append(w.T @ is_tier_1 >= constraints.min_liquidity_buffer)

        # Turnover cap
        cons.append(
            cp.norm(
                w - current_weights,
                1) <= constraints.turnover_cap)

        problem = cp.Problem(objective, cons)

        try:
            problem.solve(solver=cp.ECOS)
            if problem.status not in ["optimal", "optimal_inaccurate"]:
                raise Exception(
                    f"cvxpy solver failed with status: {
                        problem.status}")
            return w.value, "cvxpy"
        except Exception as e:
            logger.error(f"cvxpy failed: {e}")
            raise

    def optimize_scipy(self,
                       expected_returns: np.ndarray,
                       cov_matrix: np.ndarray,
                       current_weights: np.ndarray,
                       liquidity_tiers: np.ndarray,
                       constraints: OptimizationConstraints) -> Tuple[np.ndarray, str]:
        """
        Fallback SLSQP solver using scipy.optimize.
        """
        n_assets = len(expected_returns)

        def objective(w):
            port_ret = np.dot(w, expected_returns)
            port_var = np.dot(w.T, np.dot(cov_matrix, w))
            turnover = np.sum(np.abs(w - current_weights))
            # Minimize negative utility
            return -(port_ret - (self.risk_aversion / 2) * port_var -
                     constraints.turnover_penalty_kappa * turnover)

        cons = []
        # Sum of weights = 1
        cons.append({'type': 'eq', 'fun': lambda w: np.sum(w) - 1})

        # Turnover cap
        cons.append({'type': 'ineq', 'fun': lambda w: constraints.turnover_cap -
                    np.sum(np.abs(w - current_weights))})

        # Liquidity buffer
        is_tier_1 = (liquidity_tiers == 1).astype(float)
        cons.append({'type': 'ineq', 'fun': lambda w: np.dot(
            w, is_tier_1) - constraints.min_liquidity_buffer})

        if constraints.long_only:
            bounds = tuple((0, constraints.max_weight_per_asset)
                           for _ in range(n_assets))
            # No leverage constraint needed as weights sum to 1 and are
            # positive
        else:
            bounds = tuple(
                (-constraints.max_weight_per_asset,
                 constraints.max_weight_per_asset) for _ in range(n_assets))
            cons.append(
                {'type': 'ineq', 'fun': lambda w: constraints.max_leverage - np.sum(np.abs(w))})

        # Initial guess = current weights
        w0 = current_weights

        res = minimize(
            objective,
            w0,
            method='SLSQP',
            bounds=bounds,
            constraints=cons)
        if not res.success:
            logger.error(f"SLSQP failed: {res.message}")
            # Return current weights as ultimate fallback
            return current_weights, "fallback_no_change"

        return res.x, "scipy_slsqp"

    def solve(self,
              returns_df: pd.DataFrame,
              current_weights: np.ndarray,
              liquidity_tiers: np.ndarray,
              constraints: OptimizationConstraints,
              views: Optional[np.ndarray] = None) -> Dict:
        """
        Main entry point for optimization.
        Calculates expected returns and shrunk covariance, then attempts cvxpy -> scipy.
        """
        # Annualize expected returns (historical mean as baseline)
        mu = returns_df.mean().values * 252

        # Apply Black-Litterman views if provided
        if views is not None:
            # Simplified BL: blend historical mu with views
            mu = 0.5 * mu + 0.5 * views

        # Annualized Shrunk Covariance
        cov = self._shrink_covariance(returns_df) * 252

        solver_used = ""
        try:
            optimal_weights, solver_used = self.optimize_cvxpy(
                mu, cov, current_weights, liquidity_tiers, constraints)
        except Exception:
            logger.warning("Falling back to scipy SLSQP")
            optimal_weights, solver_used = self.optimize_scipy(
                mu, cov, current_weights, liquidity_tiers, constraints)

        return {
            "weights": optimal_weights,
            "solver": solver_used,
            "expected_return": float(np.dot(optimal_weights, mu)),
            "expected_volatility": float(np.sqrt(np.dot(optimal_weights.T, np.dot(cov, optimal_weights)))),
            "turnover": float(np.sum(np.abs(optimal_weights - current_weights)))
        }


optimizer = PortfolioOptimizer()
