# PRAMAAN (प्रमाण) — Premium Digital Academic Records Platform

> **Notice:** PRAMAAN is an architectural demonstration platform designed to showcase high-trust academic credential verification for Indian educational institutions. It does not falsely claim official Government of India endorsement, APAAR replacement, or active DigiLocker integration.

---

## 1. System Overview

**PRAMAAN** is an academic identity and credential integrity platform engineered with the visual and operational rigor of a top-tier fintech platform and the usability of DigiLocker.

### Key Pillars
- **Student Experience**: Access verified semester grade sheets, download cryptographically verifiable PDF marksheets with QR codes, file correction requests, and monitor audit events.
- **Institution Portal**: Manage student records, upload bulk student batches via CSV with live row-by-row error validation, catch duplicates, and resolve discrepancies.
- **Platform Super Administrator**: Oversee nationwide telemetry, inspect documents awaiting approval, resolve flagged anomalies, manage public announcements on the live homepage ticker, and audit security events.
- **Public Verification**: Query document identifiers or scan QR codes to confirm credential authenticity, validity, and tamper status with strict DPDP-compliant privacy masking.

---

## 2. Technology Stack

- **Frontend**: Next.js App Router (TypeScript), Tailwind CSS v4, Lucide React icons.
- **Backend**: FastAPI (Python 3.14), SQLAlchemy ORM (SQLite with WAL mode by default, PostgreSQL ready via `DATABASE_URL`), Pydantic v2 validation.
- **Credential Integrity**: SHA-256 tamper-evident document hashing, ReportLab PDF marksheet generator with DEMO watermarks, embedded QR codes pointing to real verification routes.
- **Security**: JWT bearer token authentication, bcrypt password hashing, multi-institution tenant isolation.

---

## 3. Seeded Demo Accounts & Credentials

| Role | Name / Title | Institutional Email | Password | Affiliation |
| :--- | :--- | :--- | :--- | :--- |
| **Student** | Aarav Sharma | `aarav.sharma@demo.ac.in` | `Student@123` | IIT Delhi (B.Tech CSE, Sem 6) |
| **Student** | Diya Patel | `diya.patel@demo.ac.in` | `Student@123` | IIT Delhi (Batch #24 Review) |
| **Student** | Rohan Verma | `rohan.verma@demo.ac.in` | `Student@123` | University of Mumbai |
| **Institution Admin** | Dr. Sunita Kulkarni | `admin@iitdelhi.demo.ac.in` | `InstAdmin@123` | Dean of Academics, IIT Delhi |
| **Institution Admin** | Prof. Anand Deshmukh | `admin@mu.demo.ac.in` | `InstAdmin@123` | Controller of Exams, Mumbai Univ |
| **Super Administrator** | Rajesh Verma | `superadmin@pramaan.demo.gov` | `SuperAdmin@123` | PRAMAAN Core Operations |

*(Note: The login page and homepage also provide 1-click credential buttons for immediate sandbox evaluation without manual typing.)*

### Pre-Configured Verification Test Identifiers
- **Valid Credential**: `PRM-DOC-2024-918274` (Aarav Sharma — Semester VI Marksheet, IIT Delhi)
- **Revoked Credential**: `PRM-DOC-2023-REVOKED-001` (Provisional Certificate superseded by degree issue)
- **Pending Review**: `PRM-DOC-2024-382910` (Diya Patel — awaiting super admin approval)

---

## 4. Setup & Running Locally

### Prerequisites
- Node.js v18+ and npm
- Python 3.10+

### Step 1: Backend Setup
```bash
# Navigate to repository root
python -m venv backend/venv

# Activate venv (Windows PowerShell)
.\backend\venv\Scripts\Activate.ps1

# Install dependencies
pip install fastapi uvicorn sqlalchemy pydantic pydantic-settings python-jose bcrypt reportlab qrcode pillow pytest httpx python-multipart email-validator

# Seed synthetic demo data
python -m backend.app.seed_data

# Start FastAPI server on port 8000
uvicorn backend.app.main:app --port 8000 --reload
```

### Step 2: Frontend Setup
```bash
# In a separate terminal, navigate to frontend directory
cd frontend

# Install dependencies (if not already installed)
npm install

# Start Next.js development server
npm run dev
```

Visit **http://localhost:3000** in your web browser.

---

## 5. Automated Tests

Run the backend test suite:
```bash
backend\venv\Scripts\python -m pytest backend/tests/test_api.py
```
This executes automated tests covering:
- Authentication, token issuance, and login failure throttling.
- Multi-institution tenant isolation (prohibiting cross-institution student record access).
- Student marksheet queries and ReportLab PDF binary generation.
- Public document verification (valid, revoked, and unknown document flows).
- Anomaly and discrepancy rule checks.
- Super admin metrics derivation from live database records.

---

## 6. Security Architecture & DPDP Alignment

1. **Tenant Isolation**: Institution queries strictly filter by `institution_id` in database queries; institution admins cannot inspect records outside their domain.
2. **Minimal PII Exposure**: The public verification endpoint masks student names (`A**** S*****`) and suppresses internal identifiers to prevent scraping.
3. **Audit Ledger**: All security-critical actions (logins, PDF downloads, status changes, CSV imports) generate immutable `AuditEvent` records.
