from typing import List, Dict, Tuple
from datetime import datetime, timedelta, timezone
import collections


class EngineAlert:
    def __init__(self, metric: str, value: float,
                 tier: int, action: str, rationale: str):
        self.metric = metric
        self.value = value
        self.tier = tier
        self.action = action
        self.rationale = rationale
        self.timestamp = datetime.now(timezone.utc)


class ControlEngine:
    def __init__(self, max_auto_actions_per_hour: int = 5):
        self.max_auto_actions_per_hour = max_auto_actions_per_hour
        self.auto_action_log = collections.deque()  # stores timestamps

        # In-memory history for rate-of-change (ROC) tracking
        # Dict[metric_name, List[Tuple[timestamp, value]]]
        self.metric_history: Dict[str,
                                  List[Tuple[datetime,
                                             float]]] = collections.defaultdict(list)

        # Halt flag (Circuit Breaker)
        self.halted = False

    def check_rate_limit(self) -> bool:
        """Returns True if under limit, False if limit exceeded."""
        now = datetime.now(timezone.utc)
        # Clean old actions from log
        while self.auto_action_log and self.auto_action_log[0] < now - timedelta(
                hours=1):
            self.auto_action_log.popleft()

        return len(self.auto_action_log) < self.max_auto_actions_per_hour

    def record_auto_action(self):
        self.auto_action_log.append(datetime.now(timezone.utc))

    def update_metric_history(self, metric: str, value: float):
        now = datetime.now(timezone.utc)
        self.metric_history[metric].append((now, value))
        # Keep last 1 hour of history for ROC
        self.metric_history[metric] = [
            (t, v) for t, v in self.metric_history[metric] if t > now - timedelta(hours=1)]

    def _calculate_roc(self, metric: str, window_minutes: int = 15) -> float:
        """Calculates percentage rate of change over the specified window"""
        history = self.metric_history[metric]
        if not history:
            return 0.0

        now = datetime.now(timezone.utc)
        window_start = now - timedelta(minutes=window_minutes)

        # Find oldest value in window
        old_val = None
        for t, v in history:
            if t >= window_start:
                old_val = v
                break

        if old_val is None or old_val == 0:
            return 0.0

        current_val = history[-1][1]
        return (current_val - old_val) / abs(old_val)

    def evaluate(self, current_metrics: Dict[str, float],
                 active_rules: List[Dict]) -> List[EngineAlert]:
        """
        Evaluates current metrics against configured rules.
        active_rules is a list of dicts with: metric, threshold, tier, action_type
        """
        alerts = []

        if self.halted:
            # If circuit breaker tripped, downgrade any Tier 3 to Tier 1 alerts
            pass

        # 1. Update history
        for k, v in current_metrics.items():
            self.update_metric_history(k, v)

        # Group breaches by tier
        tier_breaches = collections.defaultdict(list)

        for rule in active_rules:
            metric = rule['metric']
            if metric not in current_metrics:
                continue

            value = current_metrics[metric]
            threshold = rule['threshold']

            # Simple threshold check (assuming greater-than for risk metrics)
            # In a real system, you'd specify condition direction (< or >)
            is_breached = False

            if metric in ['liquidity_score', 'lcr']:
                # For liquidity, lower is worse
                is_breached = value < threshold
            else:
                is_breached = value > threshold

            if is_breached:
                tier_breaches[rule['tier']].append({
                    'rule': rule,
                    'value': value
                })

        # Evaluate Circuit Breaker (Tier 4)
        if len(tier_breaches) > 0:
            # Circuit breaker: Simultaneous multi-metric breach (e.g. >= 3
            # metrics breached across any tiers)
            total_breaches = sum(len(b) for b in tier_breaches.values())
            if total_breaches >= 3 or 4 in tier_breaches:
                self.halted = True
                alerts.append(EngineAlert(
                    metric="MULTI_METRIC",
                    value=total_breaches,
                    tier=4,
                    action="HALT",
                    rationale=f"Circuit Breaker tripped: {total_breaches} simultaneous metric breaches."
                ))
                return alerts  # Halt further processing

        # Evaluate Tier 3 (Auto-Act)
        if 3 in tier_breaches and not self.halted:
            for breach in tier_breaches[3]:
                metric = breach['rule']['metric']
                value = breach['value']

                # Check Rate of Change (ROC) for Tier 3: fast shock velocity
                roc = self._calculate_roc(metric, window_minutes=15)
                # If ROC > 10% in 15 mins
                if abs(roc) > 0.10:
                    if self.check_rate_limit():
                        self.record_auto_action()
                        alerts.append(EngineAlert(
                            metric=metric,
                            value=value,
                            tier=3,
                            action=breach['rule']['action_type'],
                            rationale=f"Tier 3 trigger: {metric} breached threshold {
                                breach['rule']['threshold']} with high velocity ({
                                roc * 100:.1f}% ROC in 15m). Auto-acting."
                        ))
                    else:
                        # Downgrade to Tier 2 due to rate limit
                        alerts.append(EngineAlert(
                            metric=metric,
                            value=value,
                            tier=2,
                            action="ALERT_ONLY",
                            rationale=f"Tier 3 trigger hit but rate limit exceeded ({
                                self.max_auto_actions_per_hour}/hr). Downgraded to manual approval."
                        ))
                else:
                    # Not fast enough for auto-act, treat as Tier 2
                    alerts.append(EngineAlert(
                        metric=metric,
                        value=value,
                        tier=2,
                        action="ALERT_ONLY",
                        rationale=f"{metric} breached Tier 3 threshold but rate of change ({
                            roc * 100:.1f}%) was below auto-act velocity. Recommend manual review."
                    ))

        # Evaluate Tier 2 (Warn)
        if 2 in tier_breaches:
            for breach in tier_breaches[2]:
                alerts.append(EngineAlert(
                    metric=breach['rule']['metric'],
                    value=breach['value'],
                    tier=2,
                    action=breach['rule']['action_type'],
                    rationale=f"Tier 2 trigger: {
                        breach['rule']['metric']} breached threshold {
                        breach['rule']['threshold']} ({
                        breach['value']}). Proposing rebalance plan."
                ))

        # Evaluate Tier 1 (Watch)
        if 1 in tier_breaches:
            for breach in tier_breaches[1]:
                alerts.append(EngineAlert(
                    metric=breach['rule']['metric'],
                    value=breach['value'],
                    tier=1,
                    action=breach['rule']['action_type'],
                    rationale=f"Tier 1 trigger: {
                        breach['rule']['metric']} reached {
                        breach['value']} (threshold: {
                        breach['rule']['threshold']})."
                ))

        return alerts


control_engine = ControlEngine()
