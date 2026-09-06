from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, JSON
from datetime import datetime
from .base import Base


class DecisionRecord(Base):
    """
    Immutable audit trail for automated decisions, alerts, and overrides.
    """
    __tablename__ = "decisions"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Context
    triggering_metric = Column(String, nullable=False)  # e.g. "VaR_99"
    metric_value = Column(Float, nullable=False)
    threshold_breached = Column(Float, nullable=False)
    tier = Column(Integer, nullable=False)  # 1, 2, 3, 4

    # Action taken or proposed
    # e.g. "HEDGE", "REBALANCE", "ALERT_ONLY", "HALT"
    action_type = Column(String, nullable=False)
    # PENDING, APPROVED, REJECTED, EXECUTED
    status = Column(String, nullable=False, default="PENDING")

    # Narrative
    rationale = Column(String, nullable=True)  # LLM generated explanation
    # Full snapshot of metrics at the time
    raw_context = Column(JSON, nullable=True)


class RuleConfig(Base):
    """
    Configurable rules for the 4-tier engine.
    """
    __tablename__ = "rules"

    id = Column(Integer, primary_key=True, index=True)
    metric = Column(String, nullable=False)  # e.g. "VaR_99"
    threshold = Column(Float, nullable=False)
    tier = Column(Integer, nullable=False)
    action_type = Column(String, nullable=False)
    active = Column(Boolean, default=True)
