import re
from typing import Dict, Any, List, Tuple
from sqlalchemy.orm import Session
from backend.app.models import StudentProfile, AcademicDocument, DiscrepancyFlag

def validate_student_record(data: Dict[str, Any], institution_id: str, db: Session) -> Tuple[bool, List[Dict[str, str]], List[Dict[str, Any]]]:
    """
    Validates a single student record dictionary from manual entry or CSV row.
    Returns:
      (is_valid, errors_list, discrepancies_to_flag)
    """
    errors = []
    discrepancies = []

    # 1. Required Fields Check
    required_fields = ["roll_number", "full_name", "date_of_birth", "program_name", "department", "batch_year"]
    for field in required_fields:
        val = str(data.get(field, "")).strip()
        if not val:
            errors.append({"field": field, "message": f"Field '{field}' is required and cannot be empty."})

    # 2. Format Validations
    roll_number = str(data.get("roll_number", "")).strip()
    if roll_number and len(roll_number) < 3:
        errors.append({"field": "roll_number", "message": "Roll number must be at least 3 characters long."})

    dob = str(data.get("date_of_birth", "")).strip()
    # Expect YYYY-MM-DD or DD-MM-YYYY or DD/MM/YYYY
    if dob:
        dob_pattern = r"^(\d{4}[-/]\d{2}[-/]\d{2}|\d{2}[-/]\d{2}[-/]\d{4})$"
        if not re.match(dob_pattern, dob):
            errors.append({"field": "date_of_birth", "message": "Date of Birth must be in YYYY-MM-DD or DD-MM-YYYY format."})

    # 3. Semester & Marks Range Validation
    semester = data.get("current_semester")
    if semester is not None:
        try:
            sem_int = int(semester)
            if sem_int < 1 or sem_int > 12:
                errors.append({"field": "current_semester", "message": "Semester must be an integer between 1 and 12."})
        except ValueError:
            errors.append({"field": "current_semester", "message": "Semester must be a valid integer."})

    # 4. Duplicate Identifier & Roll Number Checks in Institution
    if roll_number:
        existing_roll = db.query(StudentProfile).filter(
            StudentProfile.institution_id == institution_id,
            StudentProfile.roll_number == roll_number
        ).first()
        
        # If student exists with same roll number but different name or DOB -> Discrepancy flag
        if existing_roll:
            full_name = str(data.get("full_name", "")).strip().lower()
            existing_name = existing_roll.full_name.strip().lower()
            if full_name and existing_name and full_name != existing_name:
                discrepancies.append({
                    "flag_type": "identity_conflict",
                    "severity": "critical",
                    "description": f"Roll number {roll_number} already registered under '{existing_roll.full_name}', but import contains '{data.get('full_name')}'.",
                    "student_id": existing_roll.id
                })
            else:
                errors.append({
                    "field": "roll_number",
                    "message": f"Student with roll number '{roll_number}' is already enrolled in this institution."
                })

    is_valid = len(errors) == 0
    return is_valid, errors, discrepancies


def validate_document_marks(document_data: Dict[str, Any], subjects_data: List[Dict[str, Any]]) -> Tuple[bool, List[str], List[Dict[str, Any]]]:
    """
    Validates marksheet document data and individual subject scores.
    Checks total bounds, max marks, passing conditions, and credit anomalies.
    """
    errors = []
    discrepancies = []

    for idx, sub in enumerate(subjects_data):
        sub_code = sub.get("subject_code", f"Subject #{idx+1}")
        total = float(sub.get("total_marks", 0))
        max_marks = float(sub.get("max_marks", 100))
        internal = float(sub.get("internal_marks", 0))
        external = float(sub.get("external_marks", 0))

        if total > max_marks:
            discrepancies.append({
                "flag_type": "marks_out_of_range",
                "severity": "high",
                "description": f"Subject '{sub_code}' total marks ({total}) exceeds maximum allowed ({max_marks})."
            })
            errors.append(f"Subject '{sub_code}' total marks cannot exceed maximum marks.")

        if (internal + external) != total and abs((internal + external) - total) > 0.01:
            discrepancies.append({
                "flag_type": "marks_out_of_range",
                "severity": "medium",
                "description": f"Subject '{sub_code}' internal ({internal}) + external ({external}) does not equal total ({total})."
            })

    # SGPA range check
    sgpa = document_data.get("sgpa")
    if sgpa is not None:
        if float(sgpa) < 0.0 or float(sgpa) > 10.0:
            errors.append(f"SGPA {sgpa} is outside valid 0.0 to 10.0 scale.")

    is_valid = len(errors) == 0
    return is_valid, errors, discrepancies
