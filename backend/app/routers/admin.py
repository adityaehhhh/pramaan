from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.database import get_db
from backend.app.models import (
    User, Institution, StudentProfile, AcademicDocument, DiscrepancyFlag,
    VerificationLog, AuditEvent, CorrectionRequest, SubjectMark
)
from backend.app.schemas import (
    DashboardMetricsResponse, InstitutionResponse, InstitutionCreate,
    StudentProfileResponse, AcademicDocumentResponse, DiscrepancyResponse,
    DiscrepancyResolveRequest, CorrectionRequestResponse, CorrectionRequestResolve,
    UserResponse, AuditEventResponse
)
from backend.app.security import require_super_admin, get_password_hash

router = APIRouter(prefix="/admin", tags=["Super Admin Portal"])

@router.get("/metrics", response_model=DashboardMetricsResponse)
def get_dashboard_metrics(
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """
    Computes real-time platform metrics dynamically from PostgreSQL / SQLite.
    Never returns hardcoded or fabricated numbers.
    """
    total_students = db.query(func.count(StudentProfile.id)).scalar() or 0
    total_institutions = db.query(func.count(Institution.id)).scalar() or 0
    total_documents = db.query(func.count(AcademicDocument.id)).scalar() or 0
    pending_reviews = db.query(func.count(AcademicDocument.id)).filter(AcademicDocument.status == "pending_review").scalar() or 0
    open_discrepancies = db.query(func.count(DiscrepancyFlag.id)).filter(DiscrepancyFlag.status == "open").scalar() or 0
    total_verifications = db.query(func.count(VerificationLog.id)).scalar() or 0

    recent_audits = db.query(AuditEvent).order_by(AuditEvent.created_at.desc()).limit(8).all()

    return DashboardMetricsResponse(
        total_students=total_students,
        total_institutions=total_institutions,
        total_documents=total_documents,
        pending_reviews=pending_reviews,
        open_discrepancies=open_discrepancies,
        total_verifications=total_verifications,
        recent_activity=[AuditEventResponse.from_orm(a) for a in recent_audits]
    )

# --- Institution Management ---
@router.get("/institutions", response_model=List[InstitutionResponse])
def list_institutions(
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """List all onboarding institutions."""
    return db.query(Institution).order_by(Institution.name.asc()).all()

@router.post("/institutions", response_model=InstitutionResponse)
def onboard_institution(
    req: InstitutionCreate,
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """Onboard a new educational institution to PRAMAAN."""
    existing = db.query(Institution).filter(Institution.code == req.code.upper()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Institution with this code already exists.")

    inst = Institution(
        code=req.code.upper(),
        name=req.name,
        type=req.type,
        state=req.state,
        aicte_ugc_code=req.aicte_ugc_code,
        onboarding_status="approved",
        contact_email=req.contact_email,
        website=req.website,
        address=req.address
    )
    db.add(inst)
    db.flush()

    audit = AuditEvent(
        actor_email=current_user.email,
        actor_role=current_user.role,
        action="INSTITUTION_ONBOARDED",
        resource_type="INSTITUTION",
        resource_id=inst.id,
        outcome="SUCCESS",
        details=f"Onboarded institution {inst.name} ({inst.code})"
    )
    db.add(audit)
    db.commit()
    db.refresh(inst)
    return inst

@router.patch("/institutions/{institution_id}/status")
def toggle_institution_status(
    institution_id: str,
    status: str,
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """Approve, suspend, or set pending status for an institution."""
    inst = db.query(Institution).filter(Institution.id == institution_id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found.")

    if status not in ["approved", "pending", "suspended"]:
        raise HTTPException(status_code=400, detail="Invalid status.")

    old = inst.onboarding_status
    inst.onboarding_status = status

    audit = AuditEvent(
        actor_email=current_user.email,
        actor_role=current_user.role,
        action="INSTITUTION_STATUS_CHANGE",
        resource_type="INSTITUTION",
        resource_id=inst.id,
        outcome="SUCCESS",
        details=f"Changed status of {inst.name} from {old} to {status}"
    )
    db.add(audit)
    db.commit()
    return {"message": f"Institution status updated to {status}", "status": status}

# --- Document Review Queue ---
@router.get("/documents/review-queue", response_model=List[AcademicDocumentResponse])
def get_document_review_queue(
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """List documents requiring platform review."""
    docs = db.query(AcademicDocument).filter(
        AcademicDocument.status.in_(["pending_review", "correction_required"])
    ).order_by(AcademicDocument.issued_at.desc()).all()

    inst_map = {i.id: i.name for i in db.query(Institution).all()}
    out = []
    for d in docs:
        item = AcademicDocumentResponse.from_orm(d)
        if d.student:
            item.student_name = d.student.full_name
            item.student_identifier = d.student.student_identifier
            item.roll_number = d.student.roll_number
        item.institution_name = inst_map.get(d.institution_id, "Unknown")
        out.append(item)
    return out

# --- Discrepancy & Anomaly Investigation ---
@router.get("/discrepancies", response_model=List[DiscrepancyResponse])
def list_all_discrepancies(
    status_filter: Optional[str] = None,
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """List all flagged discrepancies across institutions."""
    query = db.query(DiscrepancyFlag)
    if status_filter:
        query = query.filter(DiscrepancyFlag.status == status_filter)

    flags = query.order_by(DiscrepancyFlag.created_at.desc()).all()
    inst_map = {i.id: i.name for i in db.query(Institution).all()}
    out = []
    for f in flags:
        item = DiscrepancyResponse.from_orm(f)
        item.institution_name = inst_map.get(f.institution_id, "Unknown")
        if f.student:
            item.student_name = f.student.full_name
            item.student_identifier = f.student.student_identifier
        out.append(item)
    return out

@router.post("/discrepancies/{flag_id}/resolve")
def resolve_discrepancy(
    flag_id: str,
    req: DiscrepancyResolveRequest,
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """Resolve or dismiss a flagged discrepancy with audit trail."""
    flag = db.query(DiscrepancyFlag).filter(DiscrepancyFlag.id == flag_id).first()
    if not flag:
        raise HTTPException(status_code=404, detail="Discrepancy flag not found.")

    flag.status = req.status
    flag.review_notes = req.review_notes
    flag.reviewed_by_user_id = current_user.id

    audit = AuditEvent(
        actor_email=current_user.email,
        actor_role=current_user.role,
        action="DISCREPANCY_RESOLVED",
        resource_type="DISCREPANCY",
        resource_id=flag.id,
        outcome="SUCCESS",
        details=f"Marked as {req.status}. Notes: {req.review_notes}"
    )
    db.add(audit)
    db.commit()
    return {"message": f"Discrepancy successfully marked as {req.status}."}

# --- Correction Requests Review ---
@router.get("/corrections", response_model=List[CorrectionRequestResponse])
def list_correction_requests(
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """List student-filed correction requests for administrative review."""
    items = db.query(CorrectionRequest).order_by(CorrectionRequest.created_at.desc()).all()
    out = []
    for r in items:
        item = CorrectionRequestResponse.from_orm(r)
        if r.document:
            item.document_title = r.document.title
        if r.student:
            item.student_name = r.student.full_name
        out.append(item)
    return out

@router.post("/corrections/{request_id}/resolve")
def resolve_correction_request(
    request_id: str,
    req: CorrectionRequestResolve,
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """Approve or reject a student correction request."""
    item = db.query(CorrectionRequest).filter(CorrectionRequest.id == request_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Correction request not found.")

    item.status = req.status
    item.resolution_notes = req.resolution_notes
    item.resolved_by_user_id = current_user.id

    audit = AuditEvent(
        actor_email=current_user.email,
        actor_role=current_user.role,
        action="CORRECTION_RESOLVED",
        resource_type="CORRECTION_REQUEST",
        resource_id=item.id,
        outcome="SUCCESS",
        details=f"Correction request {req.status}. Notes: {req.resolution_notes}"
    )
    db.add(audit)
    db.commit()
    return {"message": f"Correction request marked as {req.status}."}

# --- Users list ---
@router.get("/users", response_model=List[UserResponse])
def list_all_users(
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """List system users."""
    return db.query(User).order_by(User.created_at.desc()).limit(100).all()
