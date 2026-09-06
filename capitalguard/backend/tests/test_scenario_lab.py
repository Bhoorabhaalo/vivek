import pandas as pd
from app.services.scenario_lab.stress_test import ScenarioLab
from app.schemas.portfolio import AssetPosition


def test_equity_crash_scenario():
    lab = ScenarioLab()
    positions = [
        AssetPosition(
            asset_id="EQ1",
            quantity=100,
            cost_basis=100,
            asset_class="Equity",
            liquidity_tier=1),
        AssetPosition(
            asset_id="BD1",
            quantity=100,
            cost_basis=100,
            asset_class="Bond",
            liquidity_tier=2)
    ]

    history = pd.DataFrame({"EQ1": [100.0, 100.0], "BD1": [100.0, 100.0]})

    res = lab.run_scenario("equity_crash", positions, history)

    # EQ1 drops 20%, BD1 unchanged
    # Initial value: 100*100 + 100*100 = 20000
    # Shocked EQ1 value: 100*80 = 8000
    # Total shocked: 8000 + 10000 = 18000
    assert res['baseline_value'] == 20000
    assert res['shocked_value'] == 18000
    assert res['impact_pct'] == -0.10

    # Verify live portfolio untouched
    assert positions[0].cost_basis == 100
