import time
import pandas as pd
import numpy as np
from app.schemas.portfolio import AssetPosition
from app.services.risk_engine.calculator import risk_calculator
from app.services.control_engine.evaluator import ControlEngine


def test_performance_500_positions():
    """Verify risk recompute + rule eval completes in < 2s for 500 positions."""
    # Generate 500 positions
    positions = []
    asset_ids = []
    for i in range(500):
        aid = f"AST_{i}"
        asset_ids.append(aid)
        positions.append(
            AssetPosition(
                asset_id=aid,
                quantity=100,
                cost_basis=10,
                asset_class="Equity",
                liquidity_tier=2
            )
        )

    # Generate history (252 days)
    np.random.seed(42)
    hist_data = np.random.normal(0, 0.01, (252, 500))
    # Cumulative returns to form prices
    hist_prices = np.exp(hist_data.cumsum(axis=0)) * 10
    history = pd.DataFrame(hist_prices, columns=asset_ids)

    engine = ControlEngine()
    rules = [
        {"metric": "var_99_hist", "threshold": -
            0.05, "tier": 2, "action_type": "WARN"}
    ]

    start = time.time()

    # 1. Risk Compute
    metrics = risk_calculator.generate_full_risk_report(positions, history)

    # 2. Control eval
    engine.evaluate(metrics, rules)

    end = time.time()
    duration = end - start

    # Must be < 2 seconds
    assert duration < 2.0
    print(f"\n500 Position Risk Compute & Eval took {duration:.3f} seconds")
