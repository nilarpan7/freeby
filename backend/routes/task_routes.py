from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid

from database.database import get_db
from database.models import Task, User, TaskSubmission, KarmaEvent, TaskStatus, Difficulty
from auth import get_current_user, get_current_client, get_current_student


router = APIRouter(prefix="/api/tasks", tags=["Tasks"])

class CreateTaskRequest(BaseModel):
    title: str
    description: str
    stack: List[str]
    difficulty: Difficulty
    time_estimate_min: int

class SubmitTaskRequest(BaseModel):
    github_link: str
    submission_text: str

class ReviewTaskRequest(BaseModel):
    action: str  # "approve", "flag", "revision"
    feedback: Optional[str] = None

@router.get("")
async def get_tasks(
    status: Optional[str] = None,
    difficulty: Optional[str] = None,
    domain: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all tasks with optional filters"""
    query = db.query(Task)
    
    if status:
        query = query.filter(Task.status == status)
    if difficulty:
        query = query.filter(Task.difficulty == difficulty)
    
    tasks = query.all()
    
    result = []
    for task in tasks:
        client = db.query(User).filter(User.id == task.client_id).first()
        submission = None
        if task.submission:
            submission = {
                "id": task.submission.id,
                "student_id": task.submission.student_id,
                "student_name": db.query(User).filter(User.id == task.submission.student_id).first().name,
                "github_link": task.submission.github_link,
                "submission_text": task.submission.submission_text,
                "status": task.submission.status,
                "client_feedback": task.submission.client_feedback,
                "submitted_at": task.submission.submitted_at.isoformat(),
                "reviewed_at": task.submission.reviewed_at.isoformat() if task.submission.reviewed_at else None
            }
        
        result.append({
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "stack": task.stack,
            "difficulty": task.difficulty,
            "time_estimate_min": task.time_estimate_min,
            "client_id": task.client_id,
            "client_name": client.name if client else "Unknown",
            "client_company": client.company if client else "Unknown",
            "status": task.status,
            "claimed_by": task.claimed_by,
            "submission": submission,
            "match_score": task.match_score,
            "created_at": task.created_at.isoformat()
        })
    
    return result

@router.get("/{task_id}")
async def get_task(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific task by ID"""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    client = db.query(User).filter(User.id == task.client_id).first()
    submission = None
    if task.submission:
        submission = {
            "id": task.submission.id,
            "student_id": task.submission.student_id,
            "student_name": db.query(User).filter(User.id == task.submission.student_id).first().name,
            "github_link": task.submission.github_link,
            "submission_text": task.submission.submission_text,
            "status": task.submission.status,
            "client_feedback": task.submission.client_feedback,
            "submitted_at": task.submission.submitted_at.isoformat(),
            "reviewed_at": task.submission.reviewed_at.isoformat() if task.submission.reviewed_at else None
        }
    
    return {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "stack": task.stack,
        "difficulty": task.difficulty,
        "time_estimate_min": task.time_estimate_min,
        "client_id": task.client_id,
        "client_name": client.name if client else "Unknown",
        "client_company": client.company if client else "Unknown",
        "status": task.status,
        "claimed_by": task.claimed_by,
        "submission": submission,
        "match_score": task.match_score,
        "created_at": task.created_at.isoformat()
    }

@router.post("")
async def create_task(
    request: CreateTaskRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_client)
):
    """Create a new task (clients only)"""
    task = Task(
        id=f"task-{uuid.uuid4()}",
        title=request.title,
        description=request.description,
        stack=request.stack,
        difficulty=request.difficulty,
        time_estimate_min=request.time_estimate_min,
        client_id=current_user.id,
        status=TaskStatus.OPEN,
        match_score=85  # TODO: Implement AI matching
    )
    
    db.add(task)
    current_user.tasks_posted += 1
    db.commit()
    db.refresh(task)
    
    return {"id": task.id, "message": "Task created successfully"}

@router.post("/{task_id}/claim")
async def claim_task(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_student)
):
    """Claim a task (students only)"""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if task.status != TaskStatus.OPEN:
        raise HTTPException(status_code=400, detail="Task is not available")
    
    task.status = TaskStatus.CLAIMED
    task.claimed_by = current_user.id
    db.commit()
    
    return {"message": "Task claimed successfully"}

@router.post("/{task_id}/submit")
async def submit_task(
    task_id: str,
    request: SubmitTaskRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_student)
):
    """Submit work for a claimed task"""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if task.claimed_by != current_user.id:
        raise HTTPException(status_code=403, detail="You haven't claimed this task")
    
    if task.status != TaskStatus.CLAIMED:
        raise HTTPException(status_code=400, detail="Task cannot be submitted")
    
    # Create submission
    submission = TaskSubmission(
        id=f"sub-{uuid.uuid4()}",
        task_id=task.id,
        student_id=current_user.id,
        github_link=request.github_link,
        submission_text=request.submission_text,
        status="pending"
    )
    
    db.add(submission)
    task.status = TaskStatus.SUBMITTED
    db.commit()
    
    return {"message": "Submission received successfully"}

@router.post("/{task_id}/review")
async def review_task(
    task_id: str,
    request: ReviewTaskRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_client)
):
    """Review a submitted task (clients only)"""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if task.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="You didn't create this task")
    
    if not task.submission:
        raise HTTPException(status_code=400, detail="No submission found")
    
    submission = task.submission
    student = db.query(User).filter(User.id == submission.student_id).first()
    
    if request.action == "approve":
        # Approve task
        submission.status = "approved"
        submission.client_feedback = request.feedback
        submission.reviewed_at = datetime.utcnow()
        task.status = TaskStatus.APPROVED
        
        # Award karma
        karma_delta = 10
        student.karma_score += karma_delta
        student.tasks_completed += 1
        
        # Create karma event
        karma_event = KarmaEvent(
            id=f"ke-{uuid.uuid4()}",
            user_id=student.id,
            event_type="task_approved",
            karma_delta=karma_delta,
            task_id=task.id,
            task_title=task.title,
            description=f"Task approved by {current_user.name} ({current_user.company})"
        )
        db.add(karma_event)
        

        
        # Update mentor score
        current_user.mentor_score += 1
        
    elif request.action == "flag":
        # Flag task
        submission.status = "flagged"
        submission.client_feedback = request.feedback
        submission.reviewed_at = datetime.utcnow()
        task.status = TaskStatus.FLAGGED
        
        # Deduct karma
        karma_delta = -5
        student.karma_score = max(0, student.karma_score + karma_delta)
        
        karma_event = KarmaEvent(
            id=f"ke-{uuid.uuid4()}",
            user_id=student.id,
            event_type="task_flagged",
            karma_delta=karma_delta,
            task_id=task.id,
            task_title=task.title,
            description=f"Task flagged: {request.feedback or 'No feedback provided'}"
        )
        db.add(karma_event)
        
    elif request.action == "revision":
        # Request revision
        submission.status = "revision"
        submission.client_feedback = request.feedback
        task.status = TaskStatus.REVISION
    
    db.commit()
    
    return {"message": f"Task {request.action}d successfully"}
