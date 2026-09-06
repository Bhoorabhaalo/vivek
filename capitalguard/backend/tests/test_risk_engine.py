import numpy as np
import pandas as pd
from app.services.risk_engine.calculator import risk_calculator
from app.schemas.portfolio import AssetPosition


def test_var_calculation():
    # Simple normal distribution of returns
    np.random.seed(42)
    returns = pd.Series(np.random.normal(0.001, 0.02, 1000))

    var_95_hist = risk_calculator.calculate_var_historical(returns, 0.95)
    var_95_param = risk_calculator.calculate_var_parametric(returns, 0.95)

    assert var_95_hist < 0  # VaR should be a loss
    assert var_95_param < 0
    # Should be relatively close
    assert abs(var_95_hist - var_95_param) < 0.01


def test_cvar_calculation():
    np.random.seed(42)
    returns = pd.Series(np.random.normal(0, 0.02, 1000))

    var_95 = risk_calculator.calculate_var_historical(returns, 0.95)
    cvar_95 = risk_calculator.calculate_cvar(returns, 0.95)

    # CVaR is the average loss beyond VaR, so it should be a larger negative
    # number (worse loss)
    assert cvar_95 < var_95


def test_liquidity_score():
    pos1 = AssetPosition(
        asset_id="CASH",
        quantity=100,
        cost_basis=1,
        asset_class="Cash",
        liquidity_tier=1)
    pos2 = AssetPosition(
        asset_id="PE",
        quantity=10,
        cost_basis=10,
        asset_class="Private",
        liquidity_tier=5)

    # Equal value in Tier 1 and Tier 5
    # Score for T1 = 5, T5 = 1. Weighted score = 0.5*5 + 0.5*1 = 3
    # Normalized: (3 / 5) * 100 = 60
    score = risk_calculator.calculate_liquidity_score([pos1, pos2])
    assert score == 60.0
