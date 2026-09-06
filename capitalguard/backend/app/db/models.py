from sqlalchemy import Column, Integer, String, Boolean, DateTime
from app.db.database import Base
from datetime import datetime, timezone


class AuditLogEvent(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    instrument = Column(String, index=True)
    side = Column(String)
    notional = Column(String)
    algo = Column(String)
    price = Column(String)
    latency = Column(String)
    status = Column(String)
    is_hedge = Column(Boolean, default=False)
