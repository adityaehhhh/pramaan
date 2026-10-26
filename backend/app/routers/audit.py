from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import AuditEvent, User
from backend.app.schemas import AuditEventResponse
from backend.app.security import require_super_admin

router = APIRouter(prefix="/audit", tags=["Audit & Security Logs"])

@router.get("", response_model=List[AuditEventResponse])
def get_audit_logs(
    action: Optional[str] = None,
    actor_email: Optional[str] = None,
    resource_type: Optional[str] = None,
    limit: int = 50,
    skip: int = 0,
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """
    Search and inspect system security and operational audit logs.
    Restricted strictly to Platform Super Administrators.
    """
    query = db.query(AuditEvent)

    if action:
        query = query.filter(AuditEvent.action == action)
    if actor_email:
        query = query.filter(AuditEvent.actor_email.ilike(f"%{actor_email}%"))
    if resource_type:
        query = query.filter(AuditEvent.resource_type == resource_type)

    logs = query.order_by(AuditEvent.created_at.desc()).offset(skip).limit(limit).all()
    return logs
