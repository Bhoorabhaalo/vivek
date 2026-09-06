from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import AuditLogEvent

from app.api.auth import get_current_user

router = APIRouter()


@router.get("/")
def get_audit_logs(db: Session = Depends(get_db),
                   current_user: dict = Depends(get_current_user)):
    logs = db.query(AuditLogEvent).order_by(
        AuditLogEvent.timestamp.desc()).limit(100).all()
    # Serialize to match frontend expectation
    return [
        {
            "id": log.id,
            "time": log.timestamp.strftime("%H:%M:%S.%f")[:-3],
            "inst": log.instrument,
            "side": log.side,
            "notional": log.notional,
            "algo": log.algo,
            "price": log.price,
            "latency": log.latency,
            "status": log.status,
            "isHedge": log.is_hedge
        }
        for log in logs
    ]
