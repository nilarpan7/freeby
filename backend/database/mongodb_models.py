from beanie import Document, Indexed
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum
import uuid

# Enums
class UserRole(str, Enum):
    STUDENT = "student"
    CLIENT = "client"

class Domain(str, Enum):
    FRONTEND = "Frontend"
    BACKEND = "Backend"
    DATA = "Data"
    DEVOPS = "DevOps"
    FULLSTACK = "FullStack"
    MOBILE = "Mobile"
    DESIGN = "Design"

class TaskStatus(str, Enum):
    OPEN = "open"
    CLAIMED = "claimed"
    SUBMITTED = "submitted"
    APPROVED = "approved"
    FLAGGED = "flagged"
    REVISION = "revision"

class Difficulty(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"

# MongoDB Documents (Collections)

class User(Document):
    """User collection - Students and Clients"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: Indexed(str, unique=True)
    name: str
    role: UserRole
    
    # Profile fields (set during profile setup)
    domain: Optional[Domain] = None
    skills: List[str] = Field(default_factory=list)
    avatar_url: str = ""
    github_url: str = ""
    bio: str = ""
    
    # Karma-based identity (no resume/experience)
    karma_score: int = 0
    tasks_completed: int = 0
    tasks_posted: int = 0
    
    # Profile setup status
    profile_completed: bool = False
    
    # Authentication
    google_id: Optional[Indexed(str, unique=True)] = None
    hashed_password: Optional[str] = None
    
    # Client-specific fields
    company: Optional[str] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "users"
        indexes = [
            "email",
            "google_id",
            "role",
            "karma_score",
        ]

class Task(Document):
    """Task collection - Work posted by clients"""
    id: str = Field(default_factory=lambda: f"task-{uuid.uuid4()}")
    title: str
    description: str
    stack: List[str] = Field(default_factory=list)
    difficulty: Difficulty
    time_estimate_min: int
    
    # Karma and Rewards
    min_karma: int = 0
    reward_amount: float = 0.0
    reward_karma: int = 10
    
    # Design files
    figma_url: Optional[str] = None
    design_files: List[str] = Field(default_factory=list)
    
    # Task metadata
    client_id: str
    status: TaskStatus = TaskStatus.OPEN
    claimed_by: Optional[str] = None
    match_score: Optional[int] = None
    deadline: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "tasks"
        indexes = [
            "client_id",
            "claimed_by",
            "status",
            "difficulty",
            "created_at",
        ]

class TaskSubmission(Document):
    """Task submission collection"""
    id: str = Field(default_factory=lambda: f"sub-{uuid.uuid4()}")
    task_id: str
    student_id: str
    github_link: str
    submission_text: str
    status: str = "pending"  # pending, approved, flagged, revision
    client_feedback: Optional[str] = None
    submitted_at: datetime = Field(default_factory=datetime.utcnow)
    reviewed_at: Optional[datetime] = None
    attestation_uid: Optional[str] = None  # EAS attestation UID
    
    class Settings:
        name = "task_submissions"
        indexes = [
            "task_id",
            "student_id",
            "status",
        ]

class KarmaEvent(Document):
    """Karma event collection - Track all karma changes"""
    id: str = Field(default_factory=lambda: f"ke-{uuid.uuid4()}")
    user_id: str
    event_type: str
    karma_delta: int
    task_id: Optional[str] = None
    task_title: Optional[str] = None
    description: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "karma_events"
        indexes = [
            "user_id",
            "created_at",
            "event_type",
        ]

class TaskApplication(Document):
    """Task application collection - Students apply for tasks"""
    id: str = Field(default_factory=lambda: f"app-{uuid.uuid4()}")
    task_id: str
    student_id: str
    application_text: str
    status: str = "pending"  # pending, accepted, rejected
    applied_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "task_applications"
        indexes = [
            "task_id",
            "student_id",
            "status",
        ]

class SprintSession(Document):
    """Sprint session collection - Squad sprints"""
    id: str = Field(default_factory=lambda: f"sprint-{uuid.uuid4()}")
    title: str
    description: str
    participants: List[str] = Field(default_factory=list)  # List of user IDs
    liveblocks_room_id: str
    status: str = "active"  # active, completed
    base_karma: int = 20
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    
    class Settings:
        name = "sprint_sessions"
        indexes = [
            "status",
            "created_at",
        ]

class ReferralRequest(Document):
    """Referral request collection"""
    id: str = Field(default_factory=lambda: f"ref-{uuid.uuid4()}")
    student_id: str
    client_id: str
    status: str = "pending"  # pending, accepted, rejected
    message: str
    karma_at_request: int
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "referral_requests"
        indexes = [
            "student_id",
            "client_id",
            "status",
        ]
