from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import AcademicDocument, VerificationLog, AuditEvent
from backend.app.schemas import VerificationResponse

router = APIRouter(prefix="/verify", tags=["Document Verification"])

def mask_name(name: str) -> str:
    """Masks a name for privacy (e.g. 'Aarav Sharma' -> 'A**** S*****')"""
    if not name:
        return "Unknown"
    parts = name.split()
    masked = []
    for p in parts:
        if len(p) <= 2:
            masked.append(p[0] + "*")
        else:
            masked.append(p[0] + ("*" * (len(p) - 1)))
    return " ".join(masked)

@router.get("", response_model=VerificationResponse)
def verify_document(
    id: Optional[str] = Query(None, description="Document ID or token to verify"),
    token: Optional[str] = Query(None, description="Verification token"),
    request: Request = None,
    db: Session = Depends(get_db)
):
    """
    Public verification endpoint.
    Checks cryptographic integrity and status of PRAMAAN documents.
    Returns masked data to preserve student privacy.
    """
    search_query = id or token
    if not search_query:
        return VerificationResponse(
            is_valid=False,
            status="NOT_FOUND",
            tamper_status="INVALID_INPUT",
            disclaimer="Please provide a valid document identifier or QR verification code."
        )

    search_query = search_query.strip()
    doc = db.query(AcademicDocument).filter(
        (AcademicDocument.document_id == search_query) |
        (AcademicDocument.verification_token == search_query) |
        (AcademicDocument.id == search_query)
    ).first()

    client_ip = request.client.host if request and request.client else "127.0.0.1"

    if not doc:
        # Record failed verification log
        log = VerificationLog(
            document_id=search_query[:50],
            verification_method="QR_SCAN" if token else "MANUAL_CODE",
            verifier_ip=client_ip,
            outcome="NOT_FOUND"
        )
        db.add(log)
        db.commit()

        return VerificationResponse(
            is_valid=False,
            status="NOT_FOUND",
            document_id=search_query,
            tamper_status="RECORD_NOT_LOCATED",
            disclaimer="No authentic record matching this identifier was found in the PRAMAAN demonstration registry."
        )

    student = doc.student
    inst = doc.institution

    # Determine status
    if doc.status == "revoked":
        outcome = "REVOKED"
        is_valid = False
        tamper_status = "REVOKED_BY_INSTITUTION"
    elif doc.status == "verified":
        outcome = "VALID"
        is_valid = True
        tamper_status = "CRYPTOGRAPHICALLY_VERIFIED"
    elif doc.status == "pending_review":
        outcome = "PENDING_REVIEW"
        is_valid = False
        tamper_status = "AWAITING_ADMIN_APPROVAL"
    else:
        outcome = doc.status.upper()
        is_valid = False
        tamper_status = "UNVERIFIED"

    # Record log
    log = VerificationLog(
        document_id=doc.document_id,
        verification_method="QR_SCAN" if token else "MANUAL_CODE",
        verifier_ip=client_ip,
        outcome=outcome
    )
    db.add(log)
    db.commit()

    return VerificationResponse(
        is_valid=is_valid,
        status=outcome,
        document_id=doc.document_id,
        doc_type=doc.doc_type,
        title=doc.title,
        institution_name=inst.name if inst else "Unknown",
        masked_student_name=mask_name(student.full_name) if student else "N/A",
        program_name=student.program_name if student else "N/A",
        semester=doc.semester,
        academic_year=doc.academic_year,
        sgpa=doc.sgpa,
        result_status=doc.result_status,
        issued_at=doc.issued_at,
        revoked_at=doc.revoked_at,
        revocation_reason=doc.revocation_reason,
        tamper_status=tamper_status,
        disclaimer="Verified via PRAMAAN prototype platform. Demonstrates tamper-evident digital credential verification."
    )
