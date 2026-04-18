from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List
from datetime import datetime
import uuid

from database.mongodb_models import User, SprintSession, KarmaEvent
from auth import get_current_user, get_current_student
from liveblocks import liveblocks_service

router = APIRouter(prefix="/api/sprints", tags=["Squad Sprints"])

class CreateSprintRequest(BaseModel):
    title: str
    description: str
    max_participants: int = 4

class JoinSprintRequest(BaseModel):
    sprint_id: str

class CompleteSprintRequest(BaseModel):
    sprint_id: str
    peer_upvotes: List[str]  # List of user IDs to upvote

@router.post("")
async def create_sprint(
    request: CreateSprintRequest,
    current_user: User = Depends(get_current_student)
):
    """Create a new squad sprint session"""
    
    # Generate unique room ID
    room_id = f"sprint-{uuid.uuid4()}"
    
    # Create Liveblocks room
    try:
        await liveblocks_service.create_room(
            room_id=room_id,
            metadata={
                "title": request.title,
                "description": request.description,
                "creator": current_user.id
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create Liveblocks room: {str(e)}")
    
    # Create sprint session in DB
    sprint = SprintSession(
        id=f"sprint-{uuid.uuid4()}",
        title=request.title,
        description=request.description,
        participants=[current_user.id],
        liveblocks_room_id=room_id,
        status="active"
    )
    
    await sprint.insert()
    
    return {
        "id": sprint.id,
        "room_id": room_id,
        "title": sprint.title,
        "description": sprint.description,
        "participants": sprint.participants,
        "message": "Sprint created successfully"
    }

@router.post("/join")
async def join_sprint(
    request: JoinSprintRequest,
    current_user: User = Depends(get_current_student)
):
    """Join an existing sprint session"""
    
    sprint = await SprintSession.find_one(SprintSession.id == request.sprint_id)
    if not sprint:
        raise HTTPException(status_code=404, detail="Sprint not found")
    
    if sprint.status != "active":
        raise HTTPException(status_code=400, detail="Sprint is not active")
    
    if current_user.id in sprint.participants:
        raise HTTPException(status_code=400, detail="Already joined this sprint")
    
    if len(sprint.participants) >= 4:
        raise HTTPException(status_code=400, detail="Sprint is full")
    
    # Add participant
    sprint.participants.append(current_user.id)
    await sprint.save()
    
    return {
        "message": "Joined sprint successfully",
        "room_id": sprint.liveblocks_room_id
    }

@router.get("/{sprint_id}/auth")
async def get_sprint_auth(
    sprint_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get Liveblocks authentication token for a sprint"""
    
    sprint = await SprintSession.find_one(SprintSession.id == sprint_id)
    if not sprint:
        raise HTTPException(status_code=404, detail="Sprint not found")
    
    if current_user.id not in sprint.participants:
        raise HTTPException(status_code=403, detail="Not a participant in this sprint")
    
    # Generate Liveblocks auth token
    token = liveblocks_service.generate_auth_token(
        user_id=current_user.id,
        room_id=sprint.liveblocks_room_id,
        user_info={
            "name": current_user.name,
            "avatar": current_user.avatar_url,
            "domain": current_user.domain
        }
    )
    
    return {
        "token": token,
        "room_id": sprint.liveblocks_room_id
    }

@router.post("/complete")
async def complete_sprint(
    request: CompleteSprintRequest,
    current_user: User = Depends(get_current_student)
):
    """Complete a sprint and award karma"""
    
    sprint = await SprintSession.find_one(SprintSession.id == request.sprint_id)
    if not sprint:
        raise HTTPException(status_code=404, detail="Sprint not found")
    
    if current_user.id not in sprint.participants:
        raise HTTPException(status_code=403, detail="Not a participant in this sprint")
    
    if sprint.status != "active":
        raise HTTPException(status_code=400, detail="Sprint already completed")
    
    # Mark sprint as completed
    sprint.status = "completed"
    sprint.completed_at = datetime.utcnow()
    await sprint.save()
    
    # Award base karma to all participants
    for participant_id in sprint.participants:
        participant = await User.find_one(User.id == participant_id)
        if participant:
            participant.karma_score += sprint.base_karma
            await participant.save()
            
            karma_event = KarmaEvent(
                id=f"ke-{uuid.uuid4()}",
                user_id=participant.id,
                event_type="sprint_complete",
                karma_delta=sprint.base_karma,
                description=f"Completed squad sprint: {sprint.title}"
            )
            await karma_event.insert()
    
    # Award peer upvote karma
    for upvoted_id in request.peer_upvotes:
        if upvoted_id in sprint.participants and upvoted_id != current_user.id:
            upvoted_user = await User.find_one(User.id == upvoted_id)
            if upvoted_user:
                upvote_karma = 4
                upvoted_user.karma_score += upvote_karma
                await upvoted_user.save()
                
                karma_event = KarmaEvent(
                    id=f"ke-{uuid.uuid4()}",
                    user_id=upvoted_id,
                    event_type="peer_upvote",
                    karma_delta=upvote_karma,
                    description=f"Peer upvote from {current_user.name} in sprint: {sprint.title}"
                )
                await karma_event.insert()
    
    # Clean up Liveblocks room
    try:
        await liveblocks_service.delete_room(sprint.liveblocks_room_id)
    except:
        pass  # Room cleanup is not critical
    
    return {"message": "Sprint completed successfully"}

@router.get("")
async def get_active_sprints(current_user: User = Depends(get_current_user)):
    """Get all active sprint sessions"""
    
    sprints = await SprintSession.find(SprintSession.status == "active").to_list()
    
    result = []
    for sprint in sprints:
        participants = []
        for participant_id in sprint.participants:
            user = await User.find_one(User.id == participant_id)
            if user:
                participants.append({
                    "id": user.id,
                    "name": user.name,
                    "avatar_url": user.avatar_url
                })
        
        result.append({
            "id": sprint.id,
            "title": sprint.title,
            "description": sprint.description,
            "participants": participants,
            "participant_count": len(sprint.participants),
            "max_participants": 4,
            "created_at": sprint.created_at.isoformat()
        })
    
    return result
