from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import (
    User, StudentProfile, AcademicDocument, SubjectMark, CorrectionRequest, AuditEvent, Institution
)
from backend.app.schemas import (
    StudentProfileResponse, AcademicDocumentResponse, SubjectMarkResponse,
    CorrectionRequestCreate, CorrectionRequestResponse, AuditEventResponse
)
from backend.app.security import get_current_user, require_student

router = APIRouter(prefix="/students", tags=["Student Portal"])

@router.get("/me/profile", response_model=StudentProfileResponse)
def get_my_student_profile(
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    """Fetches authenticated student's profile details."""
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found for this account.")
    
    inst = db.query(Institution).filter(Institution.id == profile.institution_id).first()
    inst_name = inst.name if inst else "Unknown Institution"
    
    res = StudentProfileResponse.from_orm(profile)
    res.institution_name = inst_name
    return res

@router.get("/me/documents", response_model=List[AcademicDocumentResponse])
def get_my_documents(
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    """Fetches all academic documents and marksheets issued to the student."""
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        return []

    docs = db.query(AcademicDocument).filter(AcademicDocument.student_id == profile.id).order_by(AcademicDocument.semester.desc()).all()
    
    inst = db.query(Institution).filter(Institution.id == profile.institution_id).first()
    inst_name = inst.name if inst else "Unknown"

    result = []
    for d in docs:
        item = AcademicDocumentResponse.from_orm(d)
        item.student_name = profile.full_name
        item.student_identifier = profile.student_identifier
        item.roll_number = profile.roll_number
        item.institution_name = inst_name
        result.append(item)
    return result

@router.get("/me/documents/{document_id}/subjects", response_model=List[SubjectMarkResponse])
def get_document_subjects(
    document_id: str,
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    """Fetches subject breakdown for a specific marksheet owned by the student."""
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found.")

    doc = db.query(AcademicDocument).filter(
        AcademicDocument.id == document_id,
        AcademicDocument.student_id == profile.id
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found or unauthorized.")

    subjects = db.query(SubjectMark).filter(SubjectMark.document_id == doc.id).all()
    return subjects

@router.post("/me/corrections", response_model=CorrectionRequestResponse)
def submit_correction_request(
    req: CorrectionRequestCreate,
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    """Submit a correction request for an academic document."""
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found.")

    doc = db.query(AcademicDocument).filter(
        AcademicDocument.id == req.document_id,
        AcademicDocument.student_id == profile.id
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Academic document does not exist or does not belong to you.")

    # Create correction request
    correction = CorrectionRequest(
        student_id=profile.id,
        document_id=doc.id,
        field_to_correct=req.field_to_correct,
        current_value=req.current_value,
        requested_value=req.requested_value,
        reason=req.reason,
        supporting_doc_ref=req.supporting_doc_ref,
        status="pending"
    )
    db.add(correction)

    # Log audit event
    audit = AuditEvent(
        actor_email=current_user.email,
        actor_role="student",
        action="CORRECTION_REQUESTED",
        resource_type="DOCUMENT",
        resource_id=doc.document_id,
        outcome="SUCCESS",
        details=f"Correction requested on field '{req.field_to_correct}': {req.reason}"
    )
    db.add(audit)
    db.commit()
    db.refresh(correction)

    resp = CorrectionRequestResponse.from_orm(correction)
    resp.document_title = doc.title
    resp.student_name = profile.full_name
    return resp

@router.get("/me/corrections", response_model=List[CorrectionRequestResponse])
def get_my_correction_requests(
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    """List all correction requests filed by the student."""
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        return []

    requests = db.query(CorrectionRequest).filter(CorrectionRequest.student_id == profile.id).order_by(CorrectionRequest.created_at.desc()).all()
    out = []
    for r in requests:
        item = CorrectionRequestResponse.from_orm(r)
        if r.document:
            item.document_title = r.document.title
        item.student_name = profile.full_name
        out.append(item)
    return out

@router.get("/me/activity", response_model=List[AuditEventResponse])
def get_student_activity(
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    """Recent audit logs relevant to the student."""
    logs = db.query(AuditEvent).filter(
        AuditEvent.actor_email == current_user.email
    ).order_by(AuditEvent.created_at.desc()).limit(15).all()
    return logs
