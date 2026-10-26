from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import (
    User, AcademicDocument, StudentProfile, Institution, SubjectMark, AuditEvent
)
from backend.app.schemas import (
    AcademicDocumentResponse, SubjectMarkResponse, DocumentReviewAction
)
from backend.app.security import get_current_user, require_admin_or_super, enforce_institution_access
from backend.app.pdf_generator import generate_marksheet_pdf

router = APIRouter(prefix="/documents", tags=["Academic Documents"])

@router.get("/{document_id}", response_model=AcademicDocumentResponse)
def get_document_by_id(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve full details for an academic document with authorization checks."""
    doc = db.query(AcademicDocument).filter(
        (AcademicDocument.id == document_id) | (AcademicDocument.document_id == document_id)
    ).first()

    if not doc:
        raise HTTPException(status_code=404, detail="Academic document not found.")

    student = doc.student
    inst = doc.institution

    # Check authorization
    if current_user.role == "student":
        if student.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Unauthorized to access this student record.")
    elif current_user.role == "institution_admin":
        enforce_institution_access(current_user, doc.institution_id)

    res = AcademicDocumentResponse.from_orm(doc)
    res.student_name = student.full_name
    res.student_identifier = student.student_identifier
    res.roll_number = student.roll_number
    res.institution_name = inst.name
    res.subjects = [SubjectMarkResponse.from_orm(s) for s in doc.subjects]
    return res

@router.get("/{document_id}/pdf")
def download_document_pdf(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generates and returns print-ready PDF marksheet with DEMO watermark and verification QR code.
    Validates document status before generation.
    """
    doc = db.query(AcademicDocument).filter(
        (AcademicDocument.id == document_id) | (AcademicDocument.document_id == document_id)
    ).first()

    if not doc:
        raise HTTPException(status_code=404, detail="Academic document not found.")

    student = doc.student
    institution = doc.institution

    # Security role check
    if current_user.role == "student":
        if student.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Unauthorized access to this student's marksheet.")
    elif current_user.role == "institution_admin":
        enforce_institution_access(current_user, doc.institution_id)

    subjects = db.query(SubjectMark).filter(SubjectMark.document_id == doc.id).all()

    # Generate PDF bytes
    pdf_bytes = generate_marksheet_pdf(doc, student, institution, subjects)

    # Log PDF download event in Audit log
    audit = AuditEvent(
        actor_email=current_user.email,
        actor_role=current_user.role,
        action="PDF_DOWNLOAD",
        resource_type="DOCUMENT",
        resource_id=doc.document_id,
        outcome="SUCCESS",
        details=f"Downloaded marksheet for {student.full_name} ({doc.title})"
    )
    db.add(audit)
    db.commit()

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"inline; filename={doc.document_id}.pdf",
            "Cache-Control": "no-cache"
        }
    )

@router.post("/{document_id}/review")
def review_document(
    document_id: str,
    action_req: DocumentReviewAction,
    current_user: User = Depends(require_admin_or_super),
    db: Session = Depends(get_db)
):
    """Admin review endpoint to verify, reject, revoke, or request correction."""
    doc = db.query(AcademicDocument).filter(
        (AcademicDocument.id == document_id) | (AcademicDocument.document_id == document_id)
    ).first()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    enforce_institution_access(current_user, doc.institution_id)

    old_status = doc.status
    if action_req.action == "approve":
        doc.status = "verified"
    elif action_req.action == "reject":
        doc.status = "rejected"
    elif action_req.action == "request_correction":
        doc.status = "correction_required"
    elif action_req.action == "revoke":
        doc.status = "revoked"
        doc.revoked_at = datetime.utcnow()
        doc.revocation_reason = action_req.revocation_reason or "Revoked by institutional administration."
    else:
        raise HTTPException(status_code=400, detail="Invalid action.")

    audit = AuditEvent(
        actor_email=current_user.email,
        actor_role=current_user.role,
        action="DOCUMENT_REVIEW",
        resource_type="DOCUMENT",
        resource_id=doc.document_id,
        outcome="SUCCESS",
        details=f"Status changed from {old_status} to {doc.status}. Notes: {action_req.notes or ''}"
    )
    db.add(audit)
    db.commit()
    db.refresh(doc)

    return {"message": f"Document status updated to {doc.status}", "status": doc.status}
