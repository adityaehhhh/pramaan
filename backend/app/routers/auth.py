from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import User, StudentProfile, Institution, AuditEvent
from backend.app.schemas import Token, LoginRequest, UserResponse
from backend.app.security import verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
def login_with_json(login_req: LoginRequest, db: Session = Depends(get_db)):
    """JSON-based login endpoint supporting all roles with institutional metadata."""
    user = db.query(User).filter(User.email == login_req.email).first()
    if not user or not verify_password(login_req.password, user.hashed_password):
        # Record failed audit event
        audit = AuditEvent(
            actor_email=login_req.email,
            actor_role="unknown",
            action="LOGIN_ATTEMPT",
            resource_type="USER",
            resource_id=login_req.email,
            outcome="FAILURE",
            details="Invalid email or password"
        )
        db.add(audit)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive. Please contact support."
        )

    # Resolve institution name and student identifier if applicable
    institution_name = None
    student_identifier = None
    if user.institution_id:
        inst = db.query(Institution).filter(Institution.id == user.institution_id).first()
        if inst:
            institution_name = inst.name

    if user.role == "student" and user.student_profile:
        student_identifier = user.student_profile.student_identifier

    # Record successful login audit
    audit = AuditEvent(
        actor_email=user.email,
        actor_role=user.role,
        action="LOGIN_SUCCESS",
        resource_type="USER",
        resource_id=user.id,
        outcome="SUCCESS",
        details=f"User logged in as {user.role}"
    )
    db.add(audit)
    db.commit()

    token_data = {
        "sub": user.id,
        "role": user.role,
        "email": user.email,
        "institution_id": user.institution_id
    }
    access_token = create_access_token(data=token_data)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "user_id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "institution_id": user.institution_id,
        "institution_name": institution_name,
        "student_identifier": student_identifier
    }

@router.post("/token", response_model=Token)
def login_for_oauth2_form(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """OAuth2 compatible token login."""
    req = LoginRequest(email=form_data.username, password=form_data.password)
    return login_with_json(req, db)

@router.get("/me", response_model=UserResponse)
def read_current_user_info(current_user: User = Depends(get_current_user)):
    """Get authenticated user profile."""
    return current_user
