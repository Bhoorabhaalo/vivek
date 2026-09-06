from app.services.control_engine.evaluator import ControlEngine


def test_tier_evaluation():
    engine = ControlEngine()

    # Let's use positive VaR for the test
    metrics_pos = {"var_95_hist": 0.05}
    rules_pos = [
        {"metric": "var_95_hist", "threshold": 0.04,
            "tier": 1, "action_type": "ALERT"},  # Watch
        {"metric": "var_95_hist", "threshold": 0.06,
            "tier": 2, "action_type": "REBALANCE"}  # Warn
    ]

    alerts = engine.evaluate(metrics_pos, rules_pos)
    assert len(alerts) == 1
    assert alerts[0].tier == 1


def test_circuit_breaker():
    engine = ControlEngine()

    metrics = {"m1": 10, "m2": 10, "m3": 10}
    rules = [
        {"metric": "m1", "threshold": 5, "tier": 1, "action_type": "A"},
        {"metric": "m2", "threshold": 5, "tier": 2, "action_type": "B"},
        {"metric": "m3", "threshold": 5, "tier": 3, "action_type": "C"}
    ]

    # 3 metrics breached -> triggers multi-metric CB
    alerts = engine.evaluate(metrics, rules)
    assert len(alerts) == 1
    assert alerts[0].tier == 4
    assert alerts[0].action == "HALT"
    assert engine.halted is True

    # Next eval should just return no auto-acts since halted
    alerts2 = engine.evaluate(
        {"m3": 10}, [{"metric": "m3", "threshold": 5, "tier": 3, "action_type": "C"}])
    assert len(alerts2) == 0  # Tier 3 downgraded/ignored if halted
