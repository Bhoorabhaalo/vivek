import numpy as np
import pandas as pd
from app.services.risk_engine.backtest import KupiecBacktester, kupiec_backtester
from app.schemas.portfolio import AssetPosition


def test_kupiec_pof_passing():
    tester = KupiecBacktester(confidence_level=0.99, alpha=0.05)
    # With 250 observations at 99% VaR, expected exceedances = 2.5
    # 2 or 3 exceedances should easily pass the Kupiec test
    res2 = tester.kupiec_pof_test(exceedances=2, total_observations=250)
    assert res2["pass"] is True
    assert res2["expected"] == 2.5
    assert res2["exceedances"] == 2

    res3 = tester.kupiec_pof_test(exceedances=3, total_observations=250)
    assert res3["pass"] is True


def test_kupiec_pof_failing():
    tester = KupiecBacktester(confidence_level=0.99, alpha=0.05)
    # Severe clustering or underestimation (e.g. 10 exceedances out of 250) should fail
    res_fail = tester.kupiec_pof_test(exceedances=10, total_observations=250)
    assert res_fail["pass"] is False
    assert res_fail["exceedances"] == 10
    assert res_fail["expected"] == 2.5


def test_kupiec_portfolio_evaluation():
    # 250 ticks of correlated walk
    np.random.seed(42)
    ticks = 260
    prices_a = 100 * np.exp(np.cumsum(np.random.normal(0.0001, 0.01, ticks)))
    prices_b = 100 * np.exp(np.cumsum(np.random.normal(0.0001, 0.008, ticks)))
    history = pd.DataFrame({"AAPL": prices_a, "MSFT": prices_b})

    portfolio = [
        AssetPosition(asset_id="AAPL", quantity=100, cost_basis=150.0, asset_class="Equity", liquidity_tier=1),
        AssetPosition(asset_id="MSFT", quantity=50, cost_basis=300.0, asset_class="Equity", liquidity_tier=1),
    ]

    result = kupiec_backtester.evaluate_portfolio(portfolio, history, window=250)
    assert "exceedances" in result
    assert "expected" in result
    assert "pass" in result
    assert isinstance(result["pass"], bool)
    assert result["expected"] == 2.5
