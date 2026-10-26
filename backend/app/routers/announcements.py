from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import Announcement, User, AuditEvent
from backend.app.schemas import (
    AnnouncementResponse, AnnouncementCreate, AnnouncementUpdate
)
from backend.app.security import require_super_admin, get_current_user

router = APIRouter(prefix="/announcements", tags=["Announcements & Education Ticker"])

@router.get("", response_model=List[AnnouncementResponse])
def get_public_announcements(
    category: Optional[str] = None,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """
    Public endpoint fetching active announcements for the education ticker and news section.
    """
    query = db.query(Announcement).filter(Announcement.is_published == True)
    if category:
        query = query.filter(Announcement.category == category.upper())

    # Order by priority descending (high priority first), then newest
    items = query.order_by(Announcement.priority.desc(), Announcement.created_at.desc()).limit(limit).all()
    return items

@router.get("/all", response_model=List[AnnouncementResponse])
def get_all_announcements_for_admin(
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """Admin endpoint to see all announcements including drafts/unpublished."""
    items = db.query(Announcement).order_by(Announcement.created_at.desc()).all()
    return items

@router.post("", response_model=AnnouncementResponse)
def create_announcement(
    req: AnnouncementCreate,
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """Create announcement that immediately reflects in the live ticker."""
    announcement = Announcement(
        title=req.title,
        category=req.category.upper(),
        summary=req.summary,
        content=req.content,
        link=req.link,
        is_published=req.is_published,
        priority=req.priority,
        expires_at=req.expires_at
    )
    db.add(announcement)
    
    audit = AuditEvent(
        actor_email=current_user.email,
        actor_role=current_user.role,
        action="ANNOUNCEMENT_CREATED",
        resource_type="ANNOUNCEMENT",
        outcome="SUCCESS",
        details=f"Created [{req.category}] {req.title}"
    )
    db.add(audit)
    db.commit()
    db.refresh(announcement)
    return announcement

@router.put("/{announcement_id}", response_model=AnnouncementResponse)
def update_announcement(
    announcement_id: str,
    req: AnnouncementUpdate,
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """Update an announcement's content or visibility."""
    item = db.query(Announcement).filter(Announcement.id == announcement_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Announcement not found.")

    update_data = req.dict(exclude_unset=True)
    for key, val in update_data.items():
        if key == "category" and val:
            setattr(item, key, val.upper())
        else:
            setattr(item, key, val)

    audit = AuditEvent(
        actor_email=current_user.email,
        actor_role=current_user.role,
        action="ANNOUNCEMENT_UPDATED",
        resource_type="ANNOUNCEMENT",
        resource_id=item.id,
        outcome="SUCCESS",
        details=f"Updated announcement '{item.title}'"
    )
    db.add(audit)
    db.commit()
    db.refresh(item)
    return item

@router.delete("/{announcement_id}")
def delete_announcement(
    announcement_id: str,
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """Delete an announcement from the ticker."""
    item = db.query(Announcement).filter(Announcement.id == announcement_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Announcement not found.")

    title = item.title
    db.delete(item)

    audit = AuditEvent(
        actor_email=current_user.email,
        actor_role=current_user.role,
        action="ANNOUNCEMENT_DELETED",
        resource_type="ANNOUNCEMENT",
        resource_id=announcement_id,
        outcome="SUCCESS",
        details=f"Deleted announcement '{title}'"
    )
    db.add(audit)
    db.commit()
    return {"message": "Announcement deleted successfully."}
