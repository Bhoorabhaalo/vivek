from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime


class DecisionRecordBase(BaseModel):
    triggering_metric: str
    metric_value: float
    threshold_breached: float
    tier: int
    action_type: str
    status: str = "PENDING"
    rationale: Optional[str] = None
    raw_context: Optional[Dict[str, Any]] = None


class DecisionRecordCreate(DecisionRecordBase):
    pass


class DecisionRecordResponse(DecisionRecordBase):
    id: int
    timestamp: datetime

    class Config:
        from_attributes = True


class RuleConfigBase(BaseModel):
    metric: str
    threshold: float
    tier: int
    action_type: str
    active: bool = True


class RuleConfigCreate(RuleConfigBase):
    pass


class RuleConfigResponse(RuleConfigBase):
    id: int

    class Config:
        from_attributes = True
