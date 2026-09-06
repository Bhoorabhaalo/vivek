import numpy as np
import pandas as pd
from app.services.optimizer.solver import PortfolioOptimizer, OptimizationConstraints


def test_optimizer_constraints_long_only():
    optimizer = PortfolioOptimizer(risk_aversion=2.0)

    # 3 assets
    returns = pd.DataFrame(np.random.normal(0.0005, 0.01, (100, 3)))
    current_weights = np.array([0.3, 0.3, 0.4])
    liquidity_tiers = np.array([1, 2, 3])

    # Constraint: max weight 0.5, liquidity buffer 0.1
    cons = OptimizationConstraints(
        long_only=True,
        max_weight_per_asset=0.5,
        min_liquidity_buffer=0.1,
        turnover_cap=1.0  # Allow free movement for test
    )

    res = optimizer.solve(returns, current_weights, liquidity_tiers, cons)
    weights = res['weights']

    assert np.isclose(np.sum(weights), 1.0)
    assert np.all(weights >= -1e-6)
    assert np.all(weights <= 0.5 + 1e-6)

    # Liquidity buffer check (tier 1 is index 0)
    assert weights[0] >= 0.1 - 1e-6


def test_turnover_cap():
    optimizer = PortfolioOptimizer(risk_aversion=2.0)
    returns = pd.DataFrame(np.random.normal(0.0005, 0.01, (100, 3)))
    # Ensure optimal weights would normally move far away
    # Give asset 0 huge return
    returns.iloc[:, 0] += 0.05

    current_weights = np.array([0.0, 0.5, 0.5])
    liquidity_tiers = np.array([1, 2, 3])

    cons = OptimizationConstraints(turnover_cap=0.1)  # Max 10% turnover total

    res = optimizer.solve(returns, current_weights, liquidity_tiers, cons)
    weights = res['weights']

    turnover = np.sum(np.abs(weights - current_weights))
    assert turnover <= 0.1 + 1e-6
