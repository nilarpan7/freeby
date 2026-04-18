from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON, Enum, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

Base = declarative_base()

class UserRole(str, enum.Enum):
    STUDENT = "student"
    CLIENT = "client"

class Domain(str, enum.Enum):
    FRONTEND = "Frontend"
    BACKEND = "Backend"
    DATA = "Data"
    DEVOPS = "DevOps"

class TaskStatus(str, enum.Enum):
    OPEN = "open"
    CLAIMED = "claimed"
    SUBMITTED = "submitted"
    APPROVED = "approved"
    FLAGGED = "flagged"
    REVISION = "revision"

class Difficulty(str, enum.Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    
    # Profile fields (set during profile setup)
    domain = Column(Enum(Domain), nullable=True)  # Can be null until profile setup
    skills = Column(JSON, default=[])
    avatar_url = Column(String, default="")
    github_url = Column(String, default="")
    bio = Column(String, default="")
    
    # Karma-based identity (no resume/experience)
    karma_score = Column(Integer, default=0)
    tasks_completed = Column(Integer, default=0)
    tasks_posted = Column(Integer, default=0)
    
    # Profile setup status
    profile_completed = Column(Boolean, default=False)
    
    # Authentication
    google_id = Column(String, unique=True, nullable=True)
    hashed_password = Column(String, nullable=True)
    
    # Client-specific fields
    company = Column(String, nullable=True)  # Only for clients
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    tasks_created = relationship("Task", back_populates="client", foreign_keys="Task.client_id")
    tasks_claimed = relationship("Task", back_populates="student", foreign_keys="Task.claimed_by")
    karma_events = relationship("KarmaEvent", back_populates="user")
    submissions = relationship("TaskSubmission", back_populates="student")

class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    stack = Column(JSON, default=[])
    difficulty = Column(Enum(Difficulty), nullable=False)
    time_estimate_min = Column(Integer, nullable=False)
    
    # Karma and Rewards
    min_karma = Column(Integer, default=0)  # Minimum karma required to apply
    reward_amount = Column(Float, default=0.0)  # Payment amount in USD/INR
    reward_karma = Column(Integer, default=10)  # Karma points awarded on completion
    
    # Design files
    figma_url = Column(String, nullable=True)  # Figma design link
    design_files = Column(JSON, default=[])  # Other design file URLs
    
    # Task metadata
    client_id = Column(String, ForeignKey("users.id"), nullable=False)
    status = Column(Enum(TaskStatus), default=TaskStatus.OPEN)
    claimed_by = Column(String, ForeignKey("users.id"), nullable=True)
    match_score = Column(Integer, nullable=True)
    deadline = Column(DateTime, nullable=True)  # Optional deadline
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    client = relationship("User", back_populates="tasks_created", foreign_keys=[client_id])
    student = relationship("User", back_populates="tasks_claimed", foreign_keys=[claimed_by])
    submission = relationship("TaskSubmission", back_populates="task", uselist=False)
    applications = relationship("TaskApplication", back_populates="task")

class TaskSubmission(Base):
    __tablename__ = "task_submissions"
    
    id = Column(String, primary_key=True)
    task_id = Column(String, ForeignKey("tasks.id"), nullable=False)
    student_id = Column(String, ForeignKey("users.id"), nullable=False)
    github_link = Column(String, nullable=False)
    submission_text = Column(String, nullable=False)
    status = Column(String, default="pending")
    client_feedback = Column(String, nullable=True)
    submitted_at = Column(DateTime, default=datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)
    attestation_uid = Column(String, nullable=True)  # EAS attestation UID
    
    # Relationships
    task = relationship("Task", back_populates="submission")
    student = relationship("User", back_populates="submissions")

class KarmaEvent(Base):
    __tablename__ = "karma_events"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    event_type = Column(String, nullable=False)
    karma_delta = Column(Integer, nullable=False)
    task_id = Column(String, nullable=True)
    task_title = Column(String, nullable=True)
    description = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="karma_events")

class ReferralRequest(Base):
    __tablename__ = "referral_requests"
    
    id = Column(String, primary_key=True)
    student_id = Column(String, ForeignKey("users.id"), nullable=False)
    client_id = Column(String, ForeignKey("users.id"), nullable=False)
    status = Column(String, default="pending")
    message = Column(String, nullable=False)
    karma_at_request = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class SprintSession(Base):
    __tablename__ = "sprint_sessions"
    
    id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    participants = Column(JSON, default=[])  # List of user IDs
    liveblocks_room_id = Column(String, nullable=False)
    status = Column(String, default="active")  # active, completed
    base_karma = Column(Integer, default=20)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

class TaskApplication(Base):
    __tablename__ = "task_applications"
    
    id = Column(String, primary_key=True)
    task_id = Column(String, ForeignKey("tasks.id"), nullable=False)
    student_id = Column(String, ForeignKey("users.id"), nullable=False)
    application_text = Column(String, nullable=False)  # Why they're a good fit
    status = Column(String, default="pending")  # pending, accepted, rejected
    applied_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    task = relationship("Task", back_populates="applications")
    student = relationship("User")
