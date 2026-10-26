import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "PRAMAAN" in data["service"]

def test_login_student_success():
    response = client.post("/api/v1/auth/login", json={
        "email": "aarav.sharma@demo.ac.in",
        "password": "Student@123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["role"] == "student"
    assert data["full_name"] == "Aarav Sharma"
    assert data["student_identifier"] == "PRM-2024-ND-849201"

def test_login_invalid_password():
    response = client.post("/api/v1/auth/login", json={
        "email": "aarav.sharma@demo.ac.in",
        "password": "WrongPassword123"
    })
    assert response.status_code == 401
    assert "Incorrect email or password" in response.json()["detail"]

def test_login_super_admin():
    response = client.post("/api/v1/auth/login", json={
        "email": "superadmin@pramaan.demo.gov",
        "password": "SuperAdmin@123"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "super_admin"

def test_public_announcements():
    response = client.get("/api/v1/announcements")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 3
    # Check that hackathon, scholarship, etc. exist
    categories = [item["category"] for item in data]
    assert "HACKATHON" in categories or "SCHOLARSHIP" in categories

def test_public_verification_valid_document():
    response = client.get("/api/v1/verify?id=PRM-DOC-2024-918274")
    assert response.status_code == 200
    data = response.json()
    assert data["is_valid"] is True
    assert data["status"] == "VALID"
    assert data["document_id"] == "PRM-DOC-2024-918274"
    # Ensure student name is masked (privacy preserved)
    assert "*" in data["masked_student_name"]
    assert data["masked_student_name"] != "Aarav Sharma"

def test_public_verification_revoked_document():
    response = client.get("/api/v1/verify?id=PRM-DOC-2023-REVOKED-001")
    assert response.status_code == 200
    data = response.json()
    assert data["is_valid"] is False
    assert data["status"] == "REVOKED"
    assert "superseded" in (data["revocation_reason"] or "").lower()

def test_public_verification_unknown_document():
    response = client.get("/api/v1/verify?id=DOES_NOT_EXIST_XYZ")
    assert response.status_code == 200
    data = response.json()
    assert data["is_valid"] is False
    assert data["status"] == "NOT_FOUND"

def test_student_documents_and_pdf_download():
    # Login as student
    login_res = client.post("/api/v1/auth/login", json={
        "email": "aarav.sharma@demo.ac.in",
        "password": "Student@123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch documents
    docs_res = client.get("/api/v1/students/me/documents", headers=headers)
    assert docs_res.status_code == 200
    docs = docs_res.json()
    assert len(docs) >= 1
    doc_id = docs[0]["document_id"]

    # Download PDF
    pdf_res = client.get(f"/api/v1/documents/{doc_id}/pdf", headers=headers)
    assert pdf_res.status_code == 200
    assert pdf_res.headers["content-type"] == "application/pdf"
    assert pdf_res.content.startswith(b"%PDF")

def test_cross_institution_access_denial():
    # Login as Mumbai University admin
    login_res = client.post("/api/v1/auth/login", json={
        "email": "admin@mu.demo.ac.in",
        "password": "InstAdmin@123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Attempt to access IIT Delhi student's document (doc_id = PRM-DOC-2024-918274)
    res = client.get("/api/v1/documents/PRM-DOC-2024-918274", headers=headers)
    assert res.status_code == 403
    assert "tenant violation" in res.json()["detail"].lower()

def test_super_admin_metrics():
    login_res = client.post("/api/v1/auth/login", json={
        "email": "superadmin@pramaan.demo.gov",
        "password": "SuperAdmin@123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    metrics_res = client.get("/api/v1/admin/metrics", headers=headers)
    assert metrics_res.status_code == 200
    metrics = metrics_res.json()
    assert metrics["total_students"] >= 3
    assert metrics["total_institutions"] >= 3
