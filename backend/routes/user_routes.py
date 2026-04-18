from fastapi import APIRouter, Depends, HTTPException

from database.mongodb_models import User, KarmaEvent
from auth import get_current_user

router = APIRouter(prefix="/api/users", tags=["Users"])

@router.get("/{user_id}")
async def get_user(
    user_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get user profile by ID"""
    user = await User.find_one(User.id == user_id)
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
        "bio": user.bio,
        "company": user.company,
        "tasks_completed": user.tasks_completed,
        "tasks_posted": user.tasks_posted,
        "created_at": user.created_at.isoformat()
    }

@router.get("/{user_id}/karma")
async def get_user_karma(
    user_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get karma events for a user"""
    events = await KarmaEvent.find(
        KarmaEvent.user_id == user_id
    ).sort(-KarmaEvent.created_at).limit(50).to_list()
    
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
    current_user: User = Depends(get_current_user)
):
    """Get leaderboard of students by karma"""
    students = await User.find(
        User.role == "student"
    ).sort(-User.karma_score).limit(limit).to_list()
    
    return [{
        "rank": idx + 1,
        "user": {
            "id": student.id,
            "name": student.name,
            "domain": student.domain,
            "karma_score": student.karma_score,
            "tasks_completed": student.tasks_completed,
            "avatar_url": student.avatar_url
        },
        "trend": "stable",  # TODO: Calculate trend based on recent karma
        "tasks_this_week": 0  # TODO: Calculate from recent tasks
    } for idx, student in enumerate(students)]
