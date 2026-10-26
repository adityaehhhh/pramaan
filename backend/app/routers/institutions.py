import io
import csv
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Response, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from backend.app.database import get_db
from backend.app.models import (
    User, Institution, StudentProfile, AcademicDocument, ImportJob, ImportRowError, DiscrepancyFlag, AuditEvent
)
from backend.app.schemas import (
    InstitutionResponse, StudentProfileResponse, StudentProfileCreate, DiscrepancyResponse, AuditEventResponse
)
from backend.app.security import get_current_user, require_admin_or_super, enforce_institution_access, get_password_hash
from backend.app.validation import validate_student_record

router = APIRouter(prefix="/institutions", tags=["Institution Portal"])

@router.get("/profile", response_model=InstitutionResponse)
def get_institution_profile(
    current_user: User = Depends(require_admin_or_super),
    db: Session = Depends(get_db)
):
    """Get active institution profile."""
    inst_id = current_user.institution_id
    if current_user.role == "super_admin" and not inst_id:
        inst = db.query(Institution).first()
    else:
        inst = db.query(Institution).filter(Institution.id == inst_id).first()

    if not inst:
        raise HTTPException(status_code=404, detail="Institution profile not found.")
    return inst

@router.get("/students", response_model=List[StudentProfileResponse])
def get_institution_students(
    search: Optional[str] = None,
    department: Optional[str] = None,
    semester: Optional[int] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(require_admin_or_super),
    db: Session = Depends(get_db)
):
    """List students in the institution with search, filter, and tenant isolation."""
    inst_id = current_user.institution_id
    query = db.query(StudentProfile)

    if current_user.role != "super_admin":
        if not inst_id:
            raise HTTPException(status_code=403, detail="No institution associated with this admin account.")
        query = query.filter(StudentProfile.institution_id == inst_id)
    elif inst_id:
        query = query.filter(StudentProfile.institution_id == inst_id)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                StudentProfile.full_name.ilike(s),
                StudentProfile.roll_number.ilike(s),
                StudentProfile.student_identifier.ilike(s)
            )
        )

    if department:
        query = query.filter(StudentProfile.department == department)

    if semester:
        query = query.filter(StudentProfile.current_semester == semester)

    students = query.order_by(StudentProfile.roll_number.asc()).offset(skip).limit(limit).all()

    inst_map = {i.id: i.name for i in db.query(Institution).all()}
    out = []
    for st in students:
        item = StudentProfileResponse.from_orm(st)
        item.institution_name = inst_map.get(st.institution_id, "Unknown")
        out.append(item)
    return out

@router.post("/students", response_model=StudentProfileResponse)
def create_student_record(
    req: StudentProfileCreate,
    current_user: User = Depends(require_admin_or_super),
    db: Session = Depends(get_db)
):
    """Manually add a student record with server-side validation and tenant scope."""
    inst_id = req.institution_id if current_user.role == "super_admin" else current_user.institution_id
    enforce_institution_access(current_user, inst_id)

    # Validate student record
    data_dict = req.dict()
    is_valid, errors, discrepancies = validate_student_record(data_dict, inst_id, db)

    if not is_valid:
        raise HTTPException(
            status_code=400,
            detail={"message": "Validation errors found in student record", "errors": errors}
        )

    # Check email uniqueness
    existing_user = db.query(User).filter(User.email == req.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this email already exists.")

    # Create User account for student
    new_user = User(
        email=req.email,
        hashed_password=get_password_hash("Student@123"),
        full_name=req.full_name,
        role="student",
        institution_id=inst_id,
        is_active=True
    )
    db.add(new_user)
    db.flush()

    # Generate PRAMAAN identifier: PRM-{year}-{state}-{hash}
    inst = db.query(Institution).filter(Institution.id == inst_id).first()
    state_code = inst.code[:2].upper() if inst else "ND"
    random_code = uuid.uuid4().hex[:6].upper()
    student_id_str = f"PRM-2024-{state_code}-{random_code}"

    student_profile = StudentProfile(
        user_id=new_user.id,
        student_identifier=student_id_str,
        roll_number=req.roll_number,
        registration_number=req.registration_number,
        full_name=req.full_name,
        date_of_birth=req.date_of_birth,
        gender=req.gender,
        institution_id=inst_id,
        program_name=req.program_name,
        department=req.department,
        batch_year=req.batch_year,
        current_semester=req.current_semester,
        status="active"
    )
    db.add(student_profile)
    db.flush()

    # If any discrepancies were flagged during validation, record them for human review
    for disc in discrepancies:
        flag = DiscrepancyFlag(
            student_id=student_profile.id,
            institution_id=inst_id,
            flag_type=disc["flag_type"],
            severity=disc["severity"],
            description=disc["description"],
            status="open"
        )
        db.add(flag)

    audit = AuditEvent(
        actor_email=current_user.email,
        actor_role=current_user.role,
        action="STUDENT_CREATED",
        resource_type="STUDENT",
        resource_id=student_profile.student_identifier,
        outcome="SUCCESS",
        details=f"Created record for {req.full_name} ({req.roll_number})"
    )
    db.add(audit)
    db.commit()
    db.refresh(student_profile)

    res = StudentProfileResponse.from_orm(student_profile)
    res.institution_name = inst.name if inst else "Unknown"
    return res

@router.post("/import/preview")
async def preview_csv_import(
    file: UploadFile = File(...),
    current_user: User = Depends(require_admin_or_super),
    db: Session = Depends(get_db)
):
    """
    Parses and pre-validates uploaded CSV file without committing to DB.
    Returns preview rows, validation errors per row, and anomaly flags.
    """
    inst_id = current_user.institution_id
    if not inst_id and current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="No institution assigned.")

    content = await file.read()
    decoded = content.decode("utf-8-sig", errors="ignore")
    reader = csv.DictReader(io.StringIO(decoded))

    required_columns = ["roll_number", "full_name", "date_of_birth", "email", "program_name", "department", "batch_year", "current_semester"]
    if not reader.fieldnames:
        raise HTTPException(status_code=400, detail="Empty CSV file.")

    missing_cols = [c for c in required_columns if c not in reader.fieldnames]
    if missing_cols:
        raise HTTPException(
            status_code=400,
            detail=f"Missing required CSV columns: {', '.join(missing_cols)}"
        )

    rows = []
    total_rows = 0
    valid_count = 0
    error_count = 0
    row_errors = []
    seen_rolls = set()

    for idx, row in enumerate(reader):
        total_rows += 1
        row_idx = idx + 2  # 1-indexed, accounting for header
        is_valid, errors, discrepancies = validate_student_record(row, inst_id, db)

        # Check intra-CSV duplicates
        roll = str(row.get("roll_number", "")).strip()
        if roll in seen_rolls:
            is_valid = False
            errors.append({"field": "roll_number", "message": f"Duplicate roll number '{roll}' found within this CSV."})
        elif roll:
            seen_rolls.add(roll)

        if is_valid:
            valid_count += 1
        else:
            error_count += 1
            for err in errors:
                row_errors.append({
                    "row_index": row_idx,
                    "roll_number": roll,
                    "field": err["field"],
                    "error_message": err["message"]
                })

        rows.append({
            "row_index": row_idx,
            "data": row,
            "is_valid": is_valid,
            "errors": errors,
            "discrepancies": discrepancies
        })

    return {
        "filename": file.filename,
        "total_rows": total_rows,
        "valid_count": valid_count,
        "error_count": error_count,
        "preview_rows": rows[:10],
        "all_errors": row_errors
    }

@router.post("/import/commit")
async def commit_csv_import(
    file: UploadFile = File(...),
    current_user: User = Depends(require_admin_or_super),
    db: Session = Depends(get_db)
):
    """
    Safely commits verified valid rows from CSV to database within transaction.
    Logs error rows into ImportRowError table and discrepancy flags for anomalies.
    """
    inst_id = current_user.institution_id
    if not inst_id:
        inst = db.query(Institution).first()
        inst_id = inst.id if inst else None

    if not inst_id:
        raise HTTPException(status_code=400, detail="Institution ID required.")

    content = await file.read()
    decoded = content.decode("utf-8-sig", errors="ignore")
    reader = csv.DictReader(io.StringIO(decoded))

    import_job = ImportJob(
        institution_id=inst_id,
        filename=file.filename,
        status="processing"
    )
    db.add(import_job)
    db.flush()

    total_rows = 0
    valid_rows = 0
    error_rows = 0
    seen_rolls = set()

    for idx, row in enumerate(reader):
        total_rows += 1
        row_idx = idx + 2
        is_valid, errors, discrepancies = validate_student_record(row, inst_id, db)
        roll = str(row.get("roll_number", "")).strip()

        if roll in seen_rolls:
            is_valid = False
            errors.append({"field": "roll_number", "message": f"Duplicate roll number '{roll}' within CSV."})
        elif roll:
            seen_rolls.add(roll)

        if not is_valid:
            error_rows += 1
            for err in errors:
                row_err = ImportRowError(
                    import_job_id=import_job.id,
                    row_index=row_idx,
                    raw_data=str(row),
                    field_name=err["field"],
                    error_message=err["message"]
                )
                db.add(row_err)
        else:
            # Create user & student profile
            valid_rows += 1
            email = row.get("email") or f"{roll.lower()}@demo.ac.in"
            
            # Check if user already exists
            user = db.query(User).filter(User.email == email).first()
            if not user:
                user = User(
                    email=email,
                    hashed_password=get_password_hash("Student@123"),
                    full_name=row.get("full_name"),
                    role="student",
                    institution_id=inst_id,
                    is_active=True
                )
                db.add(user)
                db.flush()

            random_code = uuid.uuid4().hex[:6].upper()
            student_profile = StudentProfile(
                user_id=user.id,
                student_identifier=f"PRM-2024-ND-{random_code}",
                roll_number=roll,
                registration_number=row.get("registration_number", f"REG-{random_code}"),
                full_name=row.get("full_name"),
                date_of_birth=row.get("date_of_birth"),
                gender=row.get("gender", "Prefer not to say"),
                institution_id=inst_id,
                program_name=row.get("program_name", "B.Tech Computer Science"),
                department=row.get("department", "Computer Science"),
                batch_year=row.get("batch_year", "2021-2025"),
                current_semester=int(row.get("current_semester", 1)),
                status="active"
            )
            db.add(student_profile)
            db.flush()

            for disc in discrepancies:
                flag = DiscrepancyFlag(
                    student_id=student_profile.id,
                    institution_id=inst_id,
                    flag_type=disc["flag_type"],
                    severity=disc["severity"],
                    description=disc["description"],
                    status="open"
                )
                db.add(flag)

    import_job.total_rows = total_rows
    import_job.valid_rows = valid_rows
    import_job.error_rows = error_rows
    import_job.status = "completed"
    import_job.error_summary = f"{valid_rows} rows imported successfully. {error_rows} rows had errors."

    audit = AuditEvent(
        actor_email=current_user.email,
        actor_role=current_user.role,
        action="BULK_IMPORT_COMPLETED",
        resource_type="IMPORT_JOB",
        resource_id=import_job.id,
        outcome="SUCCESS" if error_rows == 0 else "PARTIAL",
        details=f"File: {file.filename}, Total: {total_rows}, Valid: {valid_rows}, Errors: {error_rows}"
    )
    db.add(audit)
    db.commit()

    return {
        "import_job_id": import_job.id,
        "total_rows": total_rows,
        "valid_rows": valid_rows,
        "error_rows": error_rows,
        "status": import_job.status,
        "message": f"Successfully processed {valid_rows} valid records out of {total_rows} rows."
    }

@router.get("/import/{job_id}/errors.csv")
def download_import_errors_csv(
    job_id: str,
    current_user: User = Depends(require_admin_or_super),
    db: Session = Depends(get_db)
):
    """Generates downloadable error CSV for a specific import job."""
    job = db.query(ImportJob).filter(ImportJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Import job not found.")

    errors = db.query(ImportRowError).filter(ImportRowError.import_job_id == job.id).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Row Number", "Field", "Error Message", "Raw Data"])

    for err in errors:
        writer.writerow([err.row_index, err.field_name, err.error_message, err.raw_data])

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=errors_job_{job_id[:8]}.csv"}
    )

@router.get("/discrepancies", response_model=List[DiscrepancyResponse])
def get_institution_discrepancies(
    current_user: User = Depends(require_admin_or_super),
    db: Session = Depends(get_db)
):
    """View flagged discrepancies and potential identity duplicates for the institution."""
    inst_id = current_user.institution_id
    query = db.query(DiscrepancyFlag)
    if current_user.role != "super_admin":
        query = query.filter(DiscrepancyFlag.institution_id == inst_id)

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
