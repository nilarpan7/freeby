from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional, List
import uuid

from database.database import get_db
from database.models import User, UserRole, Domain
from auth import (
    create_access_token,
    get_password_hash,
    verify_password,
    verify_google_token,
    get_current_user
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# Request/Response Models
class GoogleAuthRequest(BaseModel):
    token: str
    role: UserRole  # Student or Client

class ProfileSetupRequest(BaseModel):
    domain: Domain
    skills: List[str]
    bio: Optional[str] = ""
    github_url: Optional[str] = ""
    avatar_url: Optional[str] = ""
    company: Optional[str] = None  # Only for clients

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: UserRole

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict
    needs_profile_setup: bool

@router.post("/google", response_model=TokenResponse)
async def google_auth(request: GoogleAuthRequest, db: Session = Depends(get_db)):
    """Authenticate with Google OAuth - Step 1"""
    
    # Verify Google token
    google_user = await verify_google_token(request.token)
    
    # Check if user exists by Google ID
    user = db.query(User).filter(User.google_id == google_user["google_id"]).first()
    
    if not user:
        # Check by email
        user = db.query(User).filter(User.email == google_user["email"]).first()
        
        if user:
            # Link Google account to existing user
            user.google_id = google_user["google_id"]
            if not user.avatar_url:
                user.avatar_url = google_user["avatar_url"]
        else:
            # Create new user (profile incomplete)
            user = User(
                id=f"{request.role.value}-{uuid.uuid4()}",
                email=google_user["email"],
                name=google_user["name"],
                role=request.role,
                google_id=google_user["google_id"],
                avatar_url=google_user["avatar_url"],
                profile_completed=False,
                karma_score=0
            )
            db.add(user)
        
        db.commit()
        db.refresh(user)
    
    access_token = create_access_token(data={"sub": user.id})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "needs_profile_setup": not user.profile_completed,
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "profile_completed": user.profile_completed,
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
    }

@router.post("/register", response_model=TokenResponse)
async def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new user with email/password"""
    
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user (profile incomplete)
    user = User(
        id=f"{request.role.value}-{uuid.uuid4()}",
        email=request.email,
        name=request.name,
        role=request.role,
        hashed_password=get_password_hash(request.password),
        profile_completed=False,
        karma_score=0
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Create access token
    access_token = create_access_token(data={"sub": user.id})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "needs_profile_setup": True,
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "profile_completed": user.profile_completed,
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
    }

@router.post("/login", response_model=TokenResponse)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Login with email/password"""
    
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    access_token = create_access_token(data={"sub": user.id})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "needs_profile_setup": not user.profile_completed,
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "profile_completed": user.profile_completed,
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
    }

@router.post("/profile-setup")
async def setup_profile(
    request: ProfileSetupRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Complete user profile setup after registration/Google auth"""
    
    if current_user.profile_completed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Profile already completed"
        )
    
    # Update user profile
    current_user.domain = request.domain
    current_user.skills = request.skills
    current_user.bio = request.bio
    current_user.github_url = request.github_url
    
    if request.avatar_url:
        current_user.avatar_url = request.avatar_url
    
    # Only clients can set company
    if current_user.role == UserRole.CLIENT and request.company:
        current_user.company = request.company
    
    current_user.profile_completed = True
    
    db.commit()
    db.refresh(current_user)
    
    return {
        "message": "Profile setup completed successfully",
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "name": current_user.name,
            "role": current_user.role,
            "profile_completed": current_user.profile_completed,
            "domain": current_user.domain,
            "skills": current_user.skills,
            "karma_score": current_user.karma_score,
            "avatar_url": current_user.avatar_url,
            "github_url": current_user.github_url,
            "bio": current_user.bio,
            "company": current_user.company,
            "tasks_completed": current_user.tasks_completed,
            "tasks_posted": current_user.tasks_posted,
            "created_at": current_user.created_at.isoformat()
        }
    }

@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user info"""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "role": current_user.role,
        "profile_completed": current_user.profile_completed,
        "domain": current_user.domain,
        "skills": current_user.skills,
        "karma_score": current_user.karma_score,
        "avatar_url": current_user.avatar_url,
        "github_url": current_user.github_url,
        "bio": current_user.bio,
        "company": current_user.company,
        "tasks_completed": current_user.tasks_completed,
        "tasks_posted": current_user.tasks_posted,
        "created_at": current_user.created_at.isoformat()
    }
