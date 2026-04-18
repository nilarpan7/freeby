from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid

from database.mongodb_models import Task, User, TaskSubmission, KarmaEvent, TaskStatus, Difficulty, TaskApplication
from auth import get_current_user, get_current_client, get_current_student

router = APIRouter(prefix="/api/tasks", tags=["Tasks"])

class CreateTaskRequest(BaseModel):
    title: str
    description: str
    stack: List[str]
    difficulty: Difficulty
    time_estimate_min: int
    min_karma: int = 0
    reward_amount: float = 0.0
    reward_karma: int = 10
    figma_url: Optional[str] = None
    design_files: Optional[List[str]] = None

class SubmitTaskRequest(BaseModel):
    github_link: str
    submission_text: str

class ReviewTaskRequest(BaseModel):
    action: str  # "approve", "flag", "revision"
    feedback: Optional[str] = None

class ApplyTaskRequest(BaseModel):
    application_text: str

@router.get("")
async def get_tasks(
    status: Optional[str] = None,
    difficulty: Optional[str] = None,
    domain: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get all tasks with optional filters"""
    query = {}
    
    if status:
        query["status"] = status
    if difficulty:
        query["difficulty"] = difficulty
    
    tasks = await Task.find(query).to_list()
    
    result = []
    for task in tasks:
        client = await User.find_one(User.id == task.client_id)
        submission = None
        
        if task.status in [TaskStatus.SUBMITTED, TaskStatus.APPROVED, TaskStatus.FLAGGED, TaskStatus.REVISION]:
            task_submission = await TaskSubmission.find_one(TaskSubmission.task_id == task.id)
            if task_submission:
                student = await User.find_one(User.id == task_submission.student_id)
                submission = {
                    "id": task_submission.id,
                    "student_id": task_submission.student_id,
                    "student_name": student.name if student else "Unknown",
                    "github_link": task_submission.github_link,
                    "submission_text": task_submission.submission_text,
                    "status": task_submission.status,
                    "client_feedback": task_submission.client_feedback,
                    "submitted_at": task_submission.submitted_at.isoformat(),
                    "reviewed_at": task_submission.reviewed_at.isoformat() if task_submission.reviewed_at else None
                }
        
        result.append({
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "stack": task.stack,
            "difficulty": task.difficulty,
            "time_estimate_min": task.time_estimate_min,
            "min_karma": task.min_karma,
            "reward_amount": task.reward_amount,
            "reward_karma": task.reward_karma,
            "figma_url": task.figma_url,
            "design_files": task.design_files,
            "client_id": task.client_id,
            "client_name": client.name if client else "Unknown",
            "client_company": client.company if client else "Unknown",
            "status": task.status,
            "claimed_by": task.claimed_by,
            "submission": submission,
            "match_score": task.match_score,
            "deadline": task.deadline.isoformat() if task.deadline else None,
            "created_at": task.created_at.isoformat()
        })
    
    return result

@router.get("/{task_id}")
async def get_task(
    task_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a specific task by ID"""
    task = await Task.find_one(Task.id == task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    client = await User.find_one(User.id == task.client_id)
    submission = None
    
    if task.status in [TaskStatus.SUBMITTED, TaskStatus.APPROVED, TaskStatus.FLAGGED, TaskStatus.REVISION]:
        task_submission = await TaskSubmission.find_one(TaskSubmission.task_id == task.id)
        if task_submission:
            student = await User.find_one(User.id == task_submission.student_id)
            submission = {
                "id": task_submission.id,
                "student_id": task_submission.student_id,
                "student_name": student.name if student else "Unknown",
                "github_link": task_submission.github_link,
                "submission_text": task_submission.submission_text,
                "status": task_submission.status,
                "client_feedback": task_submission.client_feedback,
                "submitted_at": task_submission.submitted_at.isoformat(),
                "reviewed_at": task_submission.reviewed_at.isoformat() if task_submission.reviewed_at else None
            }
    
    return {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "stack": task.stack,
        "difficulty": task.difficulty,
        "time_estimate_min": task.time_estimate_min,
        "min_karma": task.min_karma,
        "reward_amount": task.reward_amount,
        "reward_karma": task.reward_karma,
        "figma_url": task.figma_url,
        "design_files": task.design_files,
        "client_id": task.client_id,
        "client_name": client.name if client else "Unknown",
        "client_company": client.company if client else "Unknown",
        "status": task.status,
        "claimed_by": task.claimed_by,
        "submission": submission,
        "match_score": task.match_score,
        "deadline": task.deadline.isoformat() if task.deadline else None,
        "created_at": task.created_at.isoformat()
    }

@router.post("")
async def create_task(
    request: CreateTaskRequest,
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
        min_karma=request.min_karma,
        reward_amount=request.reward_amount,
        reward_karma=request.reward_karma,
        figma_url=request.figma_url,
        design_files=request.design_files or [],
        client_id=current_user.id,
        status=TaskStatus.OPEN,
        match_score=85  # TODO: Implement AI matching
    )
    
    await task.insert()
    
    current_user.tasks_posted += 1
    await current_user.save()
    
    return {"id": task.id, "message": "Task created successfully"}

@router.post("/{task_id}/claim")
async def claim_task(
    task_id: str,
    current_user: User = Depends(get_current_student)
):
    """Claim a task (students only)"""
    task = await Task.find_one(Task.id == task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if task.status != TaskStatus.OPEN:
        raise HTTPException(status_code=400, detail="Task is not available")
    
    # Check if student has enough karma
    if current_user.karma_score < task.min_karma:
        raise HTTPException(
            status_code=403,
            detail=f"Insufficient karma. Required: {task.min_karma}, You have: {current_user.karma_score}"
        )
    
    task.status = TaskStatus.CLAIMED
    task.claimed_by = current_user.id
    await task.save()
    
    return {"message": "Task claimed successfully"}

@router.post("/{task_id}/submit")
async def submit_task(
    task_id: str,
    request: SubmitTaskRequest,
    current_user: User = Depends(get_current_student)
):
    """Submit work for a claimed task"""
    task = await Task.find_one(Task.id == task_id)
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
    
    await submission.insert()
    
    task.status = TaskStatus.SUBMITTED
    await task.save()
    
    return {"message": "Submission received successfully"}

@router.post("/{task_id}/review")
async def review_task(
    task_id: str,
    request: ReviewTaskRequest,
    current_user: User = Depends(get_current_client)
):
    """Review a submitted task (clients only)"""
    task = await Task.find_one(Task.id == task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if task.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="You didn't create this task")
    
    submission = await TaskSubmission.find_one(TaskSubmission.task_id == task_id)
    if not submission:
        raise HTTPException(status_code=400, detail="No submission found")
    
    student = await User.find_one(User.id == submission.student_id)
    
    if request.action == "approve":
        # Approve task
        submission.status = "approved"
        submission.client_feedback = request.feedback
        submission.reviewed_at = datetime.utcnow()
        task.status = TaskStatus.APPROVED
        
        # Award karma
        karma_delta = task.reward_karma
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
            description=f"Task approved by {current_user.name} ({current_user.company}). Earned {karma_delta} karma + ${task.reward_amount}"
        )
        await karma_event.insert()
        await student.save()
        
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
        await karma_event.insert()
        await student.save()
        
    elif request.action == "revision":
        # Request revision
        submission.status = "revision"
        submission.client_feedback = request.feedback
        task.status = TaskStatus.REVISION
    
    await submission.save()
    await task.save()
    
    return {"message": f"Task {request.action}d successfully"}

@router.post("/{task_id}/apply")
async def apply_for_task(
    task_id: str,
    request: ApplyTaskRequest,
    current_user: User = Depends(get_current_student)
):
    """Apply for a task (students only)"""
    task = await Task.find_one(Task.id == task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if task.status != TaskStatus.OPEN:
        raise HTTPException(status_code=400, detail="Task is not available for applications")
    
    # Check if student has enough karma
    if current_user.karma_score < task.min_karma:
        raise HTTPException(
            status_code=403,
            detail=f"Insufficient karma. Required: {task.min_karma}, You have: {current_user.karma_score}"
        )
    
    # Check if already applied
    existing_application = await TaskApplication.find_one(
        TaskApplication.task_id == task_id,
        TaskApplication.student_id == current_user.id
    )
    
    if existing_application:
        raise HTTPException(status_code=400, detail="You have already applied for this task")
    
    # Create application
    application = TaskApplication(
        id=f"app-{uuid.uuid4()}",
        task_id=task_id,
        student_id=current_user.id,
        application_text=request.application_text
    )
    
    await application.insert()
    
    return {"message": "Application submitted successfully", "application_id": application.id}

@router.get("/{task_id}/applications")
async def get_task_applications(
    task_id: str,
    current_user: User = Depends(get_current_client)
):
    """Get all applications for a task (clients only)"""
    task = await Task.find_one(Task.id == task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if task.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="You didn't create this task")
    
    applications = await TaskApplication.find(TaskApplication.task_id == task_id).to_list()
    
    result = []
    for app in applications:
        student = await User.find_one(User.id == app.student_id)
        result.append({
            "id": app.id,
            "student_id": app.student_id,
            "student_name": student.name if student else "Unknown",
            "student_karma": student.karma_score if student else 0,
            "student_domain": student.domain if student else "Unknown",
            "student_skills": student.skills if student else [],
            "student_tasks_completed": student.tasks_completed if student else 0,
            "application_text": app.application_text,
            "status": app.status,
            "applied_at": app.applied_at.isoformat()
        })
    
    return result

@router.post("/{task_id}/select-applicant")
async def select_applicant(
    task_id: str,
    application_id: str,
    current_user: User = Depends(get_current_client)
):
    """Select an applicant for the task (clients only)"""
    task = await Task.find_one(Task.id == task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if task.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="You didn't create this task")
    
    application = await TaskApplication.find_one(TaskApplication.id == application_id)
    if not application or application.task_id != task_id:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Accept this application
    application.status = "accepted"
    await application.save()
    
    # Reject all other applications
    other_applications = await TaskApplication.find(
        TaskApplication.task_id == task_id,
        TaskApplication.id != application_id
    ).to_list()
    
    for other_app in other_applications:
        other_app.status = "rejected"
        await other_app.save()
    
    # Assign task to student
    task.status = TaskStatus.CLAIMED
    task.claimed_by = application.student_id
    await task.save()
    
    return {"message": "Applicant selected successfully"}
