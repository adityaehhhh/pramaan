import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, Enum
)
from sqlalchemy.orm import relationship
from backend.app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="student")  # 'student', 'institution_admin', 'super_admin', 'verifier'
    institution_id = Column(String(36), ForeignKey("institutions.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    institution = relationship("Institution", back_populates="users")
    student_profile = relationship("StudentProfile", back_populates="user", uselist=False)

class Institution(Base):
    __tablename__ = "institutions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    code = Column(String(50), unique=True, index=True, nullable=False)  # e.g., 'IITD', 'MU', 'AU'
    name = Column(String(255), nullable=False)
    type = Column(String(100), default="Central Institute of Technology")
    state = Column(String(100), default="Delhi")
    aicte_ugc_code = Column(String(100), nullable=True)
    onboarding_status = Column(String(50), default="approved")  # 'approved', 'pending', 'suspended'
    contact_email = Column(String(255), nullable=False)
    website = Column(String(255), nullable=True)
    address = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    users = relationship("User", back_populates="institution")
    students = relationship("StudentProfile", back_populates="institution")
    documents = relationship("AcademicDocument", back_populates="institution")
    import_jobs = relationship("ImportJob", back_populates="institution")

class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), unique=True, nullable=False)
    student_identifier = Column(String(50), unique=True, index=True, nullable=False)  # e.g., 'PRM-2024-ND-849201'
    roll_number = Column(String(50), index=True, nullable=False)
    registration_number = Column(String(50), nullable=True)
    full_name = Column(String(255), nullable=False)
    date_of_birth = Column(String(20), nullable=False)
    gender = Column(String(20), default="Prefer not to say")
    institution_id = Column(String(36), ForeignKey("institutions.id"), nullable=False)
    program_name = Column(String(255), default="B.Tech Computer Science & Engineering")
    department = Column(String(255), default="Computer Science & Engineering")
    batch_year = Column(String(20), default="2021-2025")
    current_semester = Column(Integer, default=6)
    status = Column(String(50), default="active")  # 'active', 'graduated', 'withdrawn'
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="student_profile")
    institution = relationship("Institution", back_populates="students")
    documents = relationship("AcademicDocument", back_populates="student")
    discrepancies = relationship("DiscrepancyFlag", back_populates="student")
    correction_requests = relationship("CorrectionRequest", back_populates="student")

class AcademicDocument(Base):
    __tablename__ = "academic_documents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_id = Column(String(100), unique=True, index=True, nullable=False)  # e.g., 'PRM-DOC-2024-918274'
    student_id = Column(String(36), ForeignKey("student_profiles.id"), nullable=False)
    institution_id = Column(String(36), ForeignKey("institutions.id"), nullable=False)
    doc_type = Column(String(50), default="marksheet")  # 'marksheet', 'provisional_certificate', 'degree', 'transcript'
    title = Column(String(255), nullable=False)
    academic_year = Column(String(50), default="2023-2024")
    semester = Column(Integer, default=6)
    sgpa = Column(Float, nullable=True)
    cgpa = Column(Float, nullable=True)
    total_marks = Column(Float, nullable=True)
    max_marks = Column(Float, nullable=True)
    result_status = Column(String(50), default="PASS")  # 'PASS', 'FAIL', 'DISTINCTION'
    status = Column(String(50), default="verified")  # 'verified', 'pending_review', 'correction_required', 'revoked'
    verification_token = Column(String(255), unique=True, index=True, nullable=False)
    sha256_hash = Column(String(64), nullable=True)
    issued_at = Column(DateTime, default=datetime.utcnow)
    revoked_at = Column(DateTime, nullable=True)
    revocation_reason = Column(Text, nullable=True)

    # Relationships
    student = relationship("StudentProfile", back_populates="documents")
    institution = relationship("Institution", back_populates="documents")
    subjects = relationship("SubjectMark", back_populates="document", cascade="all, delete-orphan")
    discrepancies = relationship("DiscrepancyFlag", back_populates="document")
    correction_requests = relationship("CorrectionRequest", back_populates="document")

class SubjectMark(Base):
    __tablename__ = "subject_marks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_id = Column(String(36), ForeignKey("academic_documents.id"), nullable=False)
    subject_code = Column(String(50), nullable=False)
    subject_name = Column(String(255), nullable=False)
    credits = Column(Float, default=4.0)
    internal_marks = Column(Float, default=25.0)
    external_marks = Column(Float, default=70.0)
    total_marks = Column(Float, default=95.0)
    max_marks = Column(Float, default=100.0)
    grade = Column(String(10), default="A+")
    grade_points = Column(Float, default=9.0)
    result = Column(String(20), default="P")

    # Relationship
    document = relationship("AcademicDocument", back_populates="subjects")

class ImportJob(Base):
    __tablename__ = "import_jobs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    institution_id = Column(String(36), ForeignKey("institutions.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    total_rows = Column(Integer, default=0)
    valid_rows = Column(Integer, default=0)
    error_rows = Column(Integer, default=0)
    status = Column(String(50), default="completed")  # 'processing', 'completed', 'failed'
    error_summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    institution = relationship("Institution", back_populates="import_jobs")
    row_errors = relationship("ImportRowError", back_populates="import_job", cascade="all, delete-orphan")

class ImportRowError(Base):
    __tablename__ = "import_row_errors"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    import_job_id = Column(String(36), ForeignKey("import_jobs.id"), nullable=False)
    row_index = Column(Integer, nullable=False)
    raw_data = Column(Text, nullable=True)
    field_name = Column(String(100), nullable=True)
    error_message = Column(Text, nullable=False)

    import_job = relationship("ImportJob", back_populates="row_errors")

class DiscrepancyFlag(Base):
    __tablename__ = "discrepancy_flags"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(36), ForeignKey("student_profiles.id"), nullable=True)
    document_id = Column(String(36), ForeignKey("academic_documents.id"), nullable=True)
    institution_id = Column(String(36), ForeignKey("institutions.id"), nullable=False)
    flag_type = Column(String(100), nullable=False)  # 'duplicate_identifier', 'marks_out_of_range', 'credit_mismatch', 'identity_conflict'
    severity = Column(String(50), default="medium")  # 'low', 'medium', 'high', 'critical'
    description = Column(Text, nullable=False)
    status = Column(String(50), default="open")  # 'open', 'resolved', 'dismissed'
    review_notes = Column(Text, nullable=True)
    reviewed_by_user_id = Column(String(36), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    student = relationship("StudentProfile", back_populates="discrepancies")
    document = relationship("AcademicDocument", back_populates="discrepancies")

class CorrectionRequest(Base):
    __tablename__ = "correction_requests"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(36), ForeignKey("student_profiles.id"), nullable=False)
    document_id = Column(String(36), ForeignKey("academic_documents.id"), nullable=False)
    field_to_correct = Column(String(100), default="Name / Marks")
    current_value = Column(String(255), nullable=True)
    requested_value = Column(String(255), nullable=False)
    reason = Column(Text, nullable=False)
    supporting_doc_ref = Column(String(255), nullable=True)
    status = Column(String(50), default="pending")  # 'pending', 'approved', 'rejected'
    resolution_notes = Column(Text, nullable=True)
    resolved_by_user_id = Column(String(36), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    student = relationship("StudentProfile", back_populates="correction_requests")
    document = relationship("AcademicDocument", back_populates="correction_requests")

class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(255), nullable=False)
    category = Column(String(50), default="ANNOUNCEMENT")  # 'HACKATHON', 'SCHOLARSHIP', 'ADMISSIONS', 'EXAM', 'ANNOUNCEMENT'
    summary = Column(Text, nullable=False)
    content = Column(Text, nullable=True)
    link = Column(String(255), nullable=True)
    is_published = Column(Boolean, default=True)
    priority = Column(Integer, default=1)  # 1: normal, 2: high, 3: urgent
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    actor_email = Column(String(255), nullable=False)
    actor_role = Column(String(50), nullable=False)
    action = Column(String(100), nullable=False)  # 'LOGIN', 'RECORD_CREATE', 'STATUS_CHANGE', 'DISCREPANCY_FLAG', 'PDF_DOWNLOAD', 'VERIFY'
    resource_type = Column(String(100), nullable=False)  # 'USER', 'STUDENT', 'DOCUMENT', 'ANNOUNCEMENT', 'IMPORT_JOB'
    resource_id = Column(String(100), nullable=True)
    outcome = Column(String(50), default="SUCCESS")  # 'SUCCESS', 'FAILURE', 'DENIED'
    details = Column(Text, nullable=True)
    ip_address = Column(String(100), default="127.0.0.1")
    created_at = Column(DateTime, default=datetime.utcnow)

class VerificationLog(Base):
    __tablename__ = "verification_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_id = Column(String(100), nullable=False)
    verification_method = Column(String(50), default="QR_SCAN")  # 'QR_SCAN', 'MANUAL_CODE', 'API'
    verifier_ip = Column(String(100), default="127.0.0.1")
    outcome = Column(String(50), default="VALID")  # 'VALID', 'REVOKED', 'NOT_FOUND'
    verified_at = Column(DateTime, default=datetime.utcnow)
