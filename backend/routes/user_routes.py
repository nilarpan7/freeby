from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc

from database.database import get_db
from database.models import User, KarmaEvent
from auth import get_current_user

router = APIRouter(prefix="/api/users", tags=["Users"])

@router.get("/{user_id}")
async def get_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user profile by ID"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "domain": user.domain,
        "skills": user.skills,
        "karma_score": user.karma_score,
        "avatar_url": user.avatar_url,
        "github_url": user.github_url,
        "company": user.company,
        "mentor_score": user.mentor_score,
        "tasks_completed": user.tasks_completed,
        "tasks_posted": user.tasks_posted,
        "endorsements_received": user.endorsements_received,
        "created_at": user.created_at.isoformat()
    }

@router.get("/{user_id}/karma")
async def get_user_karma(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get karma events for a user"""
    events = db.query(KarmaEvent).filter(
        KarmaEvent.user_id == user_id
    ).order_by(desc(KarmaEvent.created_at)).limit(50).all()
    
    return [{
        "id": event.id,
        "user_id": event.user_id,
        "event_type": event.event_type,
        "karma_delta": event.karma_delta,
        "task_id": event.task_id,
        "task_title": event.task_title,
        "description": event.description,
        "created_at": event.created_at.isoformat()
    } for event in events]

@router.get("")
async def get_leaderboard(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get leaderboard of students by karma"""
    students = db.query(User).filter(
        User.role == "student"
    ).order_by(desc(User.karma_score)).limit(limit).all()
    
    return [{
        "rank": idx + 1,
        "user": {
            "id": student.id,
            "name": student.name,
            "domain": student.domain,
            "karma_score": student.karma_score,
            "tasks_completed": student.tasks_completed,
            "endorsements_received": student.endorsements_received,
            "avatar_url": student.avatar_url
        },
        "trend": "stable",  # TODO: Calculate trend based on recent karma
        "tasks_this_week": 0  # TODO: Calculate from recent tasks
    } for idx, student in enumerate(students)]
