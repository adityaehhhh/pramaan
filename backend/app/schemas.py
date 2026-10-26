from typing import Optional, List, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field

# --- Auth Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    user_id: str
    email: str
    full_name: str
    institution_id: Optional[str] = None
    institution_name: Optional[str] = None
    student_identifier: Optional[str] = None

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None
    institution_id: Optional[str] = None
    exp: Optional[int] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    role_hint: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    institution_id: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# --- Institution Schemas ---
class InstitutionBase(BaseModel):
    code: str
    name: str
    type: str = "Central Institute of Technology"
    state: str = "Delhi"
    aicte_ugc_code: Optional[str] = None
    contact_email: EmailStr
    website: Optional[str] = None
    address: Optional[str] = None

class InstitutionCreate(InstitutionBase):
    pass

class InstitutionResponse(InstitutionBase):
    id: str
    onboarding_status: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Student Profile Schemas ---
class StudentProfileBase(BaseModel):
    roll_number: str
    registration_number: Optional[str] = None
    full_name: str
    date_of_birth: str
    gender: str = "Prefer not to say"
    program_name: str
    department: str
    batch_year: str
    current_semester: int = 1

class StudentProfileCreate(StudentProfileBase):
    institution_id: str
    email: EmailStr

class StudentProfileResponse(StudentProfileBase):
    id: str
    user_id: str
    student_identifier: str
    institution_id: str
    status: str
    created_at: datetime
    institution_name: Optional[str] = None

    class Config:
        from_attributes = True

# --- Subject Mark Schemas ---
class SubjectMarkBase(BaseModel):
    subject_code: str
    subject_name: str
    credits: float = 4.0
    internal_marks: float
    external_marks: float
    total_marks: float
    max_marks: float = 100.0
    grade: str
    grade_points: float
    result: str = "P"

class SubjectMarkCreate(SubjectMarkBase):
    pass

class SubjectMarkResponse(SubjectMarkBase):
    id: str
    document_id: str

    class Config:
        from_attributes = True

# --- Academic Document Schemas ---
class AcademicDocumentBase(BaseModel):
    doc_type: str = "marksheet"
    title: str
    academic_year: str
    semester: int
    sgpa: Optional[float] = None
    cgpa: Optional[float] = None
    total_marks: Optional[float] = None
    max_marks: Optional[float] = None
    result_status: str = "PASS"

class AcademicDocumentResponse(AcademicDocumentBase):
    id: str
    document_id: str
    student_id: str
    institution_id: str
    status: str
    verification_token: str
    sha256_hash: Optional[str] = None
    issued_at: datetime
    revoked_at: Optional[datetime] = None
    revocation_reason: Optional[str] = None
    student_name: Optional[str] = None
    student_identifier: Optional[str] = None
    roll_number: Optional[str] = None
    institution_name: Optional[str] = None
    subjects: List[SubjectMarkResponse] = []

    class Config:
        from_attributes = True

# --- Document Verification Schemas ---
class VerificationRequest(BaseModel):
    document_id: Optional[str] = None
    token: Optional[str] = None

class VerificationResponse(BaseModel):
    is_valid: bool
    status: str  # 'VALID', 'REVOKED', 'EXPIRED', 'NOT_FOUND'
    document_id: Optional[str] = None
    doc_type: Optional[str] = None
    title: Optional[str] = None
    institution_name: Optional[str] = None
    masked_student_name: Optional[str] = None
    program_name: Optional[str] = None
    semester: Optional[int] = None
    academic_year: Optional[str] = None
    sgpa: Optional[float] = None
    result_status: Optional[str] = None
    issued_at: Optional[datetime] = None
    revoked_at: Optional[datetime] = None
    revocation_reason: Optional[str] = None
    tamper_status: str = "CRYPTOGRAPHICALLY_VERIFIED"
    disclaimer: str = "PRAMAAN is a proposed academic credential platform. This verifies a demonstration document."

# --- Discrepancy & Review Schemas ---
class DiscrepancyResponse(BaseModel):
    id: str
    student_id: Optional[str] = None
    document_id: Optional[str] = None
    institution_id: str
    flag_type: str
    severity: str
    description: str
    status: str
    review_notes: Optional[str] = None
    created_at: datetime
    student_name: Optional[str] = None
    student_identifier: Optional[str] = None
    institution_name: Optional[str] = None

    class Config:
        from_attributes = True

class DiscrepancyResolveRequest(BaseModel):
    status: str = "resolved"  # 'resolved' or 'dismissed'
    review_notes: str

class DocumentReviewAction(BaseModel):
    action: str  # 'approve', 'reject', 'request_correction', 'revoke'
    notes: Optional[str] = None
    revocation_reason: Optional[str] = None

# --- Correction Request Schemas ---
class CorrectionRequestCreate(BaseModel):
    document_id: str
    field_to_correct: str
    current_value: Optional[str] = None
    requested_value: str
    reason: str
    supporting_doc_ref: Optional[str] = None

class CorrectionRequestResponse(BaseModel):
    id: str
    student_id: str
    document_id: str
    field_to_correct: str
    current_value: Optional[str] = None
    requested_value: str
    reason: str
    status: str
    resolution_notes: Optional[str] = None
    created_at: datetime
    document_title: Optional[str] = None
    student_name: Optional[str] = None

    class Config:
        from_attributes = True

class CorrectionRequestResolve(BaseModel):
    status: str  # 'approved', 'rejected'
    resolution_notes: str

# --- Announcement Schemas ---
class AnnouncementBase(BaseModel):
    title: str
    category: str = "ANNOUNCEMENT"  # 'HACKATHON', 'SCHOLARSHIP', 'ADMISSIONS', 'EXAM', 'ANNOUNCEMENT'
    summary: str
    content: Optional[str] = None
    link: Optional[str] = None
    is_published: bool = True
    priority: int = 1
    expires_at: Optional[datetime] = None

class AnnouncementCreate(AnnouncementBase):
    pass

class AnnouncementUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    summary: Optional[str] = None
    content: Optional[str] = None
    link: Optional[str] = None
    is_published: Optional[bool] = None
    priority: Optional[int] = None
    expires_at: Optional[datetime] = None

class AnnouncementResponse(AnnouncementBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Audit & Analytics Schemas ---
class AuditEventResponse(BaseModel):
    id: str
    actor_email: str
    actor_role: str
    action: str
    resource_type: str
    resource_id: Optional[str] = None
    outcome: str
    details: Optional[str] = None
    ip_address: str
    created_at: datetime

    class Config:
        from_attributes = True

class DashboardMetricsResponse(BaseModel):
    total_students: int
    total_institutions: int
    total_documents: int
    pending_reviews: int
    open_discrepancies: int
    total_verifications: int
    recent_activity: List[AuditEventResponse] = []
