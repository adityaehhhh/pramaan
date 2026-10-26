from fastapi import FastAPI, Request, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time
from sqlalchemy.orm import Session

from backend.app.config import settings
from backend.app.database import engine, Base, get_db
from backend.app.routers import (
    auth, students, institutions, documents, announcements, verification, admin, audit
)

# Initialize database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Proposed Digital Academic Identity and Student Records Platform for Indian Educational Institutions (Demonstration Platform)",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For demo flexibility
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security and request latency middleware
@app.middleware("http")
async def add_process_time_and_security_headers(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = f"{process_time:.4f}s"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["X-Pramaan-Platform"] = "Prototype-Demo-Mode"
    return response

@app.on_event("startup")
def startup_event():
    """Auto-seed demo data if the database is newly initialized."""
    try:
        from backend.app.seed_data import seed_all
        seed_all()
    except Exception as e:
        print(f"Startup seed notice: {e}")

# Include Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(students.router, prefix=settings.API_V1_STR)
app.include_router(institutions.router, prefix=settings.API_V1_STR)
app.include_router(documents.router, prefix=settings.API_V1_STR)
app.include_router(verification.router, prefix=settings.API_V1_STR)
app.include_router(announcements.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)
app.include_router(audit.router, prefix=settings.API_V1_STR)

@app.get("/api/v1/health")
def health_check():
    """Health and status endpoint for system monitoring."""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "database": "connected",
        "timestamp": time.time()
    }

@app.get("/api/v1/public-stats")
def get_public_stats(db: Session = Depends(get_db)):
    """
    Public platform statistics derived directly from the database.
    Used for the homepage metrics strip without exposing sensitive data.
    """
    from sqlalchemy import func
    from backend.app.models import StudentProfile, Institution, AcademicDocument, VerificationLog
    total_students = db.query(func.count(StudentProfile.id)).scalar() or 0
    total_institutions = db.query(func.count(Institution.id)).scalar() or 0
    total_documents = db.query(func.count(AcademicDocument.id)).scalar() or 0
    total_verifications = db.query(func.count(VerificationLog.id)).scalar() or 0
    return {
        "student_records": total_students,
        "participating_institutions": total_institutions,
        "documents_issued": total_documents,
        "verification_requests": total_verifications,
        "is_demo_seed": True
    }

@app.post("/api/v1/system/seed")
def seed_database_endpoint():
    """Endpoint to trigger or reset synthetic demo data."""
    from backend.app.seed_data import seed_all
    result = seed_all()
    return {"message": "Demo data populated successfully", "details": result}
