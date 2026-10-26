import uuid
import hashlib
from datetime import datetime
from backend.app.database import SessionLocal, Base, engine
from backend.app.models import (
    User, Institution, StudentProfile, AcademicDocument, SubjectMark,
    DiscrepancyFlag, Announcement, AuditEvent
)
from backend.app.security import get_password_hash

def compute_hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()

def seed_all():
    # Ensure all tables exist
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Check if already seeded
        existing_super = db.query(User).filter(User.email == "superadmin@pramaan.demo.gov").first()
        if existing_super:
            return {"status": "already_seeded", "message": "Database already contains seed records."}

        print("Seeding PRAMAAN synthetic demo data...")

        # 1. Institutions
        inst_iitd = Institution(
            id=str(uuid.uuid4()),
            code="IITD",
            name="Indian Institute of Technology Delhi",
            type="Institute of National Importance",
            state="Delhi",
            aicte_ugc_code="IIT-DELHI-001",
            onboarding_status="approved",
            contact_email="registrar@iitdelhi.demo.ac.in",
            website="https://iitd.ac.in",
            address="Hauz Khas, New Delhi 110016"
        )
        inst_mu = Institution(
            id=str(uuid.uuid4()),
            code="MU",
            name="University of Mumbai",
            type="State University",
            state="Maharashtra",
            aicte_ugc_code="MU-MUMBAI-042",
            onboarding_status="approved",
            contact_email="records@mu.demo.ac.in",
            website="https://mu.ac.in",
            address="Fort Campus, Mumbai 400032"
        )
        inst_au = Institution(
            id=str(uuid.uuid4()),
            code="AU",
            name="Anna University",
            type="State Technical University",
            state="Tamil Nadu",
            aicte_ugc_code="AU-CHENNAI-019",
            onboarding_status="approved",
            contact_email="coe@annauniv.demo.ac.in",
            website="https://annauniv.edu",
            address="Guindy, Chennai 600025"
        )
        db.add_all([inst_iitd, inst_mu, inst_au])
        db.flush()

        # 2. Users
        # Super Admin
        super_admin = User(
            id=str(uuid.uuid4()),
            email="superadmin@pramaan.demo.gov",
            hashed_password=get_password_hash("SuperAdmin@123"),
            full_name="Rajesh Verma (Super Administrator)",
            role="super_admin",
            institution_id=None,
            is_active=True
        )

        # Institution Admins
        iitd_admin = User(
            id=str(uuid.uuid4()),
            email="admin@iitdelhi.demo.ac.in",
            hashed_password=get_password_hash("InstAdmin@123"),
            full_name="Dr. Sunita Kulkarni (Dean of Academics, IITD)",
            role="institution_admin",
            institution_id=inst_iitd.id,
            is_active=True
        )
        mu_admin = User(
            id=str(uuid.uuid4()),
            email="admin@mu.demo.ac.in",
            hashed_password=get_password_hash("InstAdmin@123"),
            full_name="Prof. Anand Deshmukh (Controller of Exams, MU)",
            role="institution_admin",
            institution_id=inst_mu.id,
            is_active=True
        )

        # Student Users
        student_user_1 = User(
            id=str(uuid.uuid4()),
            email="aarav.sharma@demo.ac.in",
            hashed_password=get_password_hash("Student@123"),
            full_name="Aarav Sharma",
            role="student",
            institution_id=inst_iitd.id,
            is_active=True
        )
        student_user_2 = User(
            id=str(uuid.uuid4()),
            email="diya.patel@demo.ac.in",
            hashed_password=get_password_hash("Student@123"),
            full_name="Diya Patel",
            role="student",
            institution_id=inst_iitd.id,
            is_active=True
        )
        student_user_3 = User(
            id=str(uuid.uuid4()),
            email="rohan.verma@demo.ac.in",
            hashed_password=get_password_hash("Student@123"),
            full_name="Rohan Verma",
            role="student",
            institution_id=inst_mu.id,
            is_active=True
        )

        db.add_all([super_admin, iitd_admin, mu_admin, student_user_1, student_user_2, student_user_3])
        db.flush()

        # 3. Student Profiles
        profile_aarav = StudentProfile(
            id=str(uuid.uuid4()),
            user_id=student_user_1.id,
            student_identifier="PRM-2024-ND-849201",
            roll_number="2021CSB1084",
            registration_number="IITD/2021/CS/084",
            full_name="Aarav Sharma",
            date_of_birth="2003-04-14",
            gender="Male",
            institution_id=inst_iitd.id,
            program_name="Bachelor of Technology in Computer Science & Engineering",
            department="Department of Computer Science & Engineering",
            batch_year="2021-2025",
            current_semester=6,
            status="active"
        )
        profile_diya = StudentProfile(
            id=str(uuid.uuid4()),
            user_id=student_user_2.id,
            student_identifier="PRM-2024-ND-849202",
            roll_number="2021CSB1095",
            registration_number="IITD/2021/CS/095",
            full_name="Diya Patel",
            date_of_birth="2003-08-22",
            gender="Female",
            institution_id=inst_iitd.id,
            program_name="Bachelor of Technology in Computer Science & Engineering",
            department="Department of Computer Science & Engineering",
            batch_year="2021-2025",
            current_semester=6,
            status="active"
        )
        profile_rohan = StudentProfile(
            id=str(uuid.uuid4()),
            user_id=student_user_3.id,
            student_identifier="PRM-2024-MH-738192",
            roll_number="2022EXTC042",
            registration_number="MU/2022/TC/042",
            full_name="Rohan Verma",
            date_of_birth="2002-11-30",
            gender="Male",
            institution_id=inst_mu.id,
            program_name="Bachelor of Engineering in Electronics & Telecommunication",
            department="Electronics & Telecommunication",
            batch_year="2022-2026",
            current_semester=4,
            status="active"
        )
        db.add_all([profile_aarav, profile_diya, profile_rohan])
        db.flush()

        # 4. Academic Documents & Marksheets for Aarav
        doc_sem6 = AcademicDocument(
            id=str(uuid.uuid4()),
            document_id="PRM-DOC-2024-918274",
            student_id=profile_aarav.id,
            institution_id=inst_iitd.id,
            doc_type="marksheet",
            title="Semester VI Academic Grade Sheet",
            academic_year="2023-2024",
            semester=6,
            sgpa=9.40,
            cgpa=9.18,
            total_marks=472.0,
            max_marks=500.0,
            result_status="PASS",
            status="verified",
            verification_token="VRF-918274-IITD-SECURE-DEMO-TOKEN",
            sha256_hash=compute_hash("PRM-DOC-2024-918274-AARAV-SEM6-9.40"),
            issued_at=datetime(2024, 6, 15, 10, 30)
        )
        doc_sem5 = AcademicDocument(
            id=str(uuid.uuid4()),
            document_id="PRM-DOC-2023-817291",
            student_id=profile_aarav.id,
            institution_id=inst_iitd.id,
            doc_type="marksheet",
            title="Semester V Academic Grade Sheet",
            academic_year="2023-2024",
            semester=5,
            sgpa=9.15,
            cgpa=9.12,
            total_marks=460.0,
            max_marks=500.0,
            result_status="PASS",
            status="verified",
            verification_token="VRF-817291-IITD-SECURE-DEMO-TOKEN",
            sha256_hash=compute_hash("PRM-DOC-2023-817291-AARAV-SEM5-9.15"),
            issued_at=datetime(2023, 12, 20, 11, 0)
        )
        doc_sem4 = AcademicDocument(
            id=str(uuid.uuid4()),
            document_id="PRM-DOC-2023-728192",
            student_id=profile_aarav.id,
            institution_id=inst_iitd.id,
            doc_type="marksheet",
            title="Semester IV Academic Grade Sheet",
            academic_year="2022-2023",
            semester=4,
            sgpa=8.95,
            cgpa=9.10,
            total_marks=451.0,
            max_marks=500.0,
            result_status="PASS",
            status="verified",
            verification_token="VRF-728192-IITD-SECURE-DEMO-TOKEN",
            sha256_hash=compute_hash("PRM-DOC-2023-728192-AARAV-SEM4-8.95"),
            issued_at=datetime(2023, 6, 18, 14, 15)
        )
        doc_sem3 = AcademicDocument(
            id=str(uuid.uuid4()),
            document_id="PRM-DOC-2022-639102",
            student_id=profile_aarav.id,
            institution_id=inst_iitd.id,
            doc_type="marksheet",
            title="Semester III Academic Grade Sheet",
            academic_year="2022-2023",
            semester=3,
            sgpa=9.20,
            cgpa=9.15,
            total_marks=464.0,
            max_marks=500.0,
            result_status="PASS",
            status="verified",
            verification_token="VRF-639102-IITD-SECURE-DEMO-TOKEN",
            sha256_hash=compute_hash("PRM-DOC-2022-639102-AARAV-SEM3-9.20"),
            issued_at=datetime(2022, 12, 22, 10, 0)
        )

        # Document for Diya (Awaiting admin review)
        doc_diya_pending = AcademicDocument(
            id=str(uuid.uuid4()),
            document_id="PRM-DOC-2024-382910",
            student_id=profile_diya.id,
            institution_id=inst_iitd.id,
            doc_type="marksheet",
            title="Semester VI Academic Grade Sheet (Submission Batch #24)",
            academic_year="2023-2024",
            semester=6,
            sgpa=8.85,
            cgpa=8.70,
            total_marks=445.0,
            max_marks=500.0,
            result_status="PASS",
            status="pending_review",
            verification_token="VRF-382910-PENDING-REVIEW-TOKEN",
            sha256_hash=compute_hash("PRM-DOC-2024-382910-DIYA-PENDING"),
            issued_at=datetime(2024, 7, 2, 9, 30)
        )

        # Document for Rohan (Correction required)
        doc_rohan_correction = AcademicDocument(
            id=str(uuid.uuid4()),
            document_id="PRM-DOC-2024-491028",
            student_id=profile_rohan.id,
            institution_id=inst_mu.id,
            doc_type="marksheet",
            title="Semester IV Electronics Result Sheet",
            academic_year="2023-2024",
            semester=4,
            sgpa=7.40,
            cgpa=7.65,
            total_marks=380.0,
            max_marks=500.0,
            result_status="PASS",
            status="correction_required",
            verification_token="VRF-491028-CORRECTION-REQUIRED-TOKEN",
            sha256_hash=compute_hash("PRM-DOC-2024-491028-ROHAN-CORRECTION"),
            issued_at=datetime(2024, 6, 25, 12, 0)
        )

        # Revoked demo document for testing verifier
        doc_revoked_demo = AcademicDocument(
            id=str(uuid.uuid4()),
            document_id="PRM-DOC-2023-REVOKED-001",
            student_id=profile_aarav.id,
            institution_id=inst_iitd.id,
            doc_type="provisional_certificate",
            title="Provisional Degree Certificate (Superseded by Official Issue)",
            academic_year="2023-2024",
            semester=6,
            sgpa=9.10,
            cgpa=9.10,
            total_marks=450.0,
            max_marks=500.0,
            result_status="PASS",
            status="revoked",
            verification_token="VRF-REVOKED-001-DEMO-TOKEN",
            sha256_hash=compute_hash("PRM-DOC-REVOKED-001"),
            issued_at=datetime(2023, 7, 10, 10, 0),
            revoked_at=datetime(2023, 8, 1, 16, 30),
            revocation_reason="Document superseded by finalized university degree roll."
        )

        db.add_all([doc_sem6, doc_sem5, doc_sem4, doc_sem3, doc_diya_pending, doc_rohan_correction, doc_revoked_demo])
        db.flush()

        # 5. Subject Marks for Aarav's Sem 6 Marksheet
        subjects_sem6 = [
            SubjectMark(
                document_id=doc_sem6.id,
                subject_code="COL380",
                subject_name="Introduction to Parallel & Distributed Computing",
                credits=4.0,
                internal_marks=28.0,
                external_marks=68.0,
                total_marks=96.0,
                max_marks=100.0,
                grade="A",
                grade_points=10.0,
                result="P"
            ),
            SubjectMark(
                document_id=doc_sem6.id,
                subject_code="COL774",
                subject_name="Machine Learning & Deep Neural Architectures",
                credits=4.0,
                internal_marks=27.0,
                external_marks=66.0,
                total_marks=93.0,
                max_marks=100.0,
                grade="A",
                grade_points=10.0,
                result="P"
            ),
            SubjectMark(
                document_id=doc_sem6.id,
                subject_code="COL730",
                subject_name="Parallel Programming & GPU Systems",
                credits=4.0,
                internal_marks=26.0,
                external_marks=68.0,
                total_marks=94.0,
                max_marks=100.0,
                grade="A",
                grade_points=10.0,
                result="P"
            ),
            SubjectMark(
                document_id=doc_sem6.id,
                subject_code="COL758",
                subject_name="Advanced Computer Algorithms",
                credits=4.0,
                internal_marks=29.0,
                external_marks=68.0,
                total_marks=97.0,
                max_marks=100.0,
                grade="A+",
                grade_points=10.0,
                result="P"
            ),
            SubjectMark(
                document_id=doc_sem6.id,
                subject_code="COP315",
                subject_name="Embedded System Design Project",
                credits=4.0,
                internal_marks=26.0,
                external_marks=66.0,
                total_marks=92.0,
                max_marks=100.0,
                grade="A-",
                grade_points=9.0,
                result="P"
            ),
        ]
        db.add_all(subjects_sem6)

        # 6. Discrepancies
        disc_1 = DiscrepancyFlag(
            student_id=profile_diya.id,
            document_id=doc_diya_pending.id,
            institution_id=inst_iitd.id,
            flag_type="credit_mismatch",
            severity="medium",
            description="Submitted batch credits (18.0) slightly mismatch program baseline (20.0). Awaiting institutional review.",
            status="open"
        )
        disc_2 = DiscrepancyFlag(
            student_id=profile_rohan.id,
            document_id=doc_rohan_correction.id,
            institution_id=inst_mu.id,
            flag_type="marks_out_of_range",
            severity="high",
            description="Row item #42 detected internal marks exceeding course max allowance (32/30). Manual audit recommended.",
            status="open"
        )
        db.add_all([disc_1, disc_2])

        # 7. Announcements for Ticker
        announcements = [
            Announcement(
                title="Smart India Hackathon 2026: Institutional Grand Finale Registrations Now Open for PRAMAAN Verified Students",
                category="HACKATHON",
                summary="Students with verified digital academic profiles can pre-fill SIH 2026 team submissions directly via unified credential validation.",
                content="The Ministry of Education's Innovation Cell announces the 2026 Grand Finale. Teams can verify their active semester enrollments and CGPA instantaneously without physical attestation.",
                link="https://sih.gov.in",
                is_published=True,
                priority=3
            ),
            Announcement(
                title="National Merit Fellowship 2026-27: Automated Eligibility Verification via Academic Records Enabled",
                category="SCHOLARSHIP",
                summary="Top 2% rank holders across accredited Indian universities can apply with 1-click marksheet verification.",
                content="The National Fellowship program has enabled direct API verification for participating institutions, eliminating manual attestation delays.",
                link="https://scholarships.gov.in",
                is_published=True,
                priority=2
            ),
            Announcement(
                title="Centralized M.Tech & Ph.D. Admissions Window Closes on November 15, 2026",
                category="ADMISSIONS",
                summary="Eligible undergraduate seniors are requested to ensure their Semester 6 digital transcripts are verified.",
                content="Participating technical institutions will draw grade sheets directly from institutional registries for provisional shortlists.",
                link="#",
                is_published=True,
                priority=2
            ),
            Announcement(
                title="Winter 2026 End-Semester Examination Schedules Released for Autonomous Technical Institutes",
                category="EXAM",
                summary="Timetables for Autumn/Winter 2026 sessions are published. Download official hall tickets through your institution portal.",
                content="Autonomous colleges are reminded to complete internal mark submissions 10 business days prior to the commencement of practical examinations.",
                link="#",
                is_published=True,
                priority=1
            ),
            Announcement(
                title="Proposed PRAMAAN Architecture Sandbox v1.0 Operational — Demonstrating High-Trust Credential Integrity",
                category="ANNOUNCEMENT",
                summary="Notice: PRAMAAN is a demonstration platform prototype. Does not claim official GoI or DigiLocker endorsement.",
                content="This platform showcases how tamper-evident SHA-256 document hashing, QR verification, and multi-tenant institutional isolation can streamline academic record trust across India.",
                link="#",
                is_published=True,
                priority=3
            )
        ]
        db.add_all(announcements)

        # 8. Audit Events
        audit_events = [
            AuditEvent(
                actor_email="superadmin@pramaan.demo.gov",
                actor_role="super_admin",
                action="SYSTEM_INIT",
                resource_type="SYSTEM",
                resource_id="PRAMAAN_CORE",
                outcome="SUCCESS",
                details="Initialized cryptographic keypairs, schema definitions, and institutional seeds"
            ),
            AuditEvent(
                actor_email="admin@iitdelhi.demo.ac.in",
                actor_role="institution_admin",
                action="BULK_IMPORT_COMPLETED",
                resource_type="IMPORT_JOB",
                resource_id="JOB_BATCH_2024_06",
                outcome="SUCCESS",
                details="Uploaded Semester VI B.Tech CSE marksheet registry (148 students)"
            ),
            AuditEvent(
                actor_email="aarav.sharma@demo.ac.in",
                actor_role="student",
                action="PDF_DOWNLOAD",
                resource_type="DOCUMENT",
                resource_id="PRM-DOC-2024-918274",
                outcome="SUCCESS",
                details="Downloaded Semester VI verified marksheet with QR reference"
            )
        ]
        db.add_all(audit_events)

        db.commit()
        print("Demo data seeded successfully!")
        return {"status": "success", "message": "Demo data populated."}
    except Exception as e:
        db.rollback()
        print(f"Error seeding data: {e}")
        return {"status": "error", "message": str(e)}
    finally:
        db.close()

if __name__ == "__main__":
    seed_all()
