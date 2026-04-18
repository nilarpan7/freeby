# 🔐 Complete Authentication Flow

## Overview

The Kramic.sh platform has a complete authentication system with:
- **Google OAuth** (One-click sign-in)
- **Email/Password** (Traditional registration)
- **Profile Setup** (For new users)
- **Role-based Access** (Students vs Clients)
- **Karma-based Identity** (No resume/experience needed)

## User Roles

### 👨‍💻 Students
- Build karma by completing tasks
- No resume or experience required
- Identity based purely on karma score
- Can apply for tasks if karma ≥ required minimum

### 🏢 Clients
- Post tasks via Telegram bot
- Set minimum karma requirements
- Pay for completed work
- Review student submissions

## Authentication Methods

### 1. Google OAuth (Recommended)
**Flow**:
```
User clicks "Continue with Google"
    ↓
Google Sign-In popup
    ↓
User selects account
    ↓
Backend verifies token with Google
    ↓
Check if new user (profile_completed = false)
    ↓
If new → Redirect to /auth/setup
If existing → Redirect to dashboard
```

**Implementation**:
- Frontend: `frontend/src/lib/google-auth.ts`
- Backend: `backend/routes/auth_routes.py` → `/api/auth/google`
- Uses Google Identity Services
- Automatic profile picture from Google

### 2. Email/Password Registration
**Flow**:
```
User fills registration form
    ↓
Backend creates user (profile_completed = false)
    ↓
Returns JWT access token
    ↓
Redirect to /auth/setup
    ↓
User completes profile
    ↓
Redirect to dashboard
```

**Implementation**:
- Frontend: `frontend/src/app/auth/page.tsx`
- Backend: `backend/routes/auth_routes.py` → `/api/auth/register`
- Password hashed with bcrypt
- JWT token for session management

### 3. Quick Demo Login
**Flow**:
```
User clicks "⚡ Quick Demo Login"
    ↓
Selects pre-made account
    ↓
Mock token stored in localStorage
    ↓
Instant dashboard access
```

**Purpose**: Testing and demos without real authentication

## Profile Setup Flow

### When Profile Setup is Required
- ✅ New Google OAuth user
- ✅ New email/password registration
- ❌ Existing users (profile_completed = true)
- ❌ Quick demo login users

### Profile Setup Fields

#### For Students
```typescript
{
  domain: 'Frontend' | 'Backend' | 'Data' | 'DevOps',
  skills: string[],  // Tags like "React", "Python", "AWS"
  bio?: string,      // Optional short bio
  github_url?: string,  // Optional GitHub profile
  avatar_url: string,   // Selected from presets or Google
}
```

#### For Clients
```typescript
{
  domain: 'Frontend' | 'Backend' | 'Data' | 'DevOps',
  skills: string[],  // Technologies they need
  bio?: string,      // Company description
  company: string,   // Company name (required)
  avatar_url: string,
}
```

### What's NOT Included (By Design)
- ❌ Resume upload
- ❌ Work experience
- ❌ Education details
- ❌ Certifications
- ❌ Portfolio links (except GitHub)

**Why?** Identity is based purely on **karma score** earned by completing tasks.

## Karma System

### Initial Karma
- New students start with: **0 karma**
- Karma is earned by completing tasks
- Karma determines which tasks you can apply for

### Karma Requirements
- Each task has a minimum karma requirement
- Students can only apply if: `student.karma_score >= task.min_karma`
- Higher karma = access to better/higher-paying tasks

### Earning Karma
1. Complete a task successfully
2. Client approves the work
3. Karma points awarded based on task difficulty
4. Karma score increases permanently

## Task Assignment Flow (Telegram Bot)

### Client Side (Telegram Bot)
```
Client: "I need a website for my shop"
    ↓
Bot: "What features do you need?"
Client: "Product catalog, shopping cart, payment"
    ↓
Bot: "Do you have a design/Figma file?"
Client: "No" or [uploads design]
    ↓
Bot: "What's your budget?"
Client: "$500"
    ↓
Bot: "What minimum karma score required?"
Client: "50"
    ↓
Task created in database
    ↓
Task appears on website for students
```

### Student Side (Website)
```
Student browses available tasks
    ↓
Finds task: "Build shop website - $500 - Min Karma: 50"
    ↓
Checks own karma: 75 (✅ eligible)
    ↓
Clicks "Apply for Task"
    ↓
Submits application
    ↓
Works on task
    ↓
Submits completed work
    ↓
Client reviews and approves
    ↓
Student receives payment + karma points
```

## Database Schema

### User Model
```python
class User:
    id: str  # "student-uuid" or "client-uuid"
    email: str
    name: str
    role: UserRole  # 'student' or 'client'
    
    # Authentication
    hashed_password: Optional[str]  # For email/password
    google_id: Optional[str]  # For Google OAuth
    
    # Profile
    profile_completed: bool  # False for new users
    domain: Optional[Domain]
    skills: List[str]
    bio: Optional[str]
    github_url: Optional[str]
    avatar_url: Optional[str]
    company: Optional[str]  # Clients only
    
    # Karma & Stats
    karma_score: int  # Default: 0
    tasks_completed: int  # Default: 0
    tasks_posted: int  # Default: 0 (clients only)
    
    created_at: datetime
```

### Task Model
```python
class Task:
    id: str
    title: str
    description: str
    domain: Domain
    difficulty: Difficulty
    min_karma: int  # Minimum karma to apply
    reward_amount: float  # Payment in USD
    reward_karma: int  # Karma points on completion
    
    # Optional design files
    figma_url: Optional[str]
    design_files: Optional[List[str]]
    
    # Status
    status: TaskStatus  # 'open', 'in_progress', 'completed'
    
    # Relations
    client_id: str
    assigned_student_id: Optional[str]
    
    created_at: datetime
    deadline: Optional[datetime]
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Email/password registration
- `POST /api/auth/login` - Email/password login
- `POST /api/auth/google` - Google OAuth
- `POST /api/auth/profile-setup` - Complete profile setup
- `GET /api/auth/me` - Get current user

### Tasks (To be implemented)
- `GET /api/tasks` - List available tasks
- `GET /api/tasks/{id}` - Get task details
- `POST /api/tasks/{id}/apply` - Apply for task
- `POST /api/tasks/{id}/submit` - Submit completed work
- `POST /api/tasks/{id}/approve` - Client approves work

### Users
- `GET /api/users/{id}` - Get user profile
- `GET /api/leaderboard` - Get top students by karma

## Frontend Routes

### Public Routes
- `/` - Landing page
- `/auth` - Login/Register page
- `/auth/setup` - Profile setup (requires auth)

### Protected Routes (Students)
- `/dashboard` - Student dashboard
- `/task/{id}` - Task details
- `/profile/{id}` - User profile
- `/leaderboard` - Karma leaderboard
- `/arena/{id}` - Real-time collaboration

### Protected Routes (Clients)
- `/dashboard/client` - Client dashboard
- `/task/{id}` - Task details (client view)

## Security Features

### Password Security
- Bcrypt hashing with salt
- Minimum password length enforced
- No plain text storage

### Token Security
- JWT tokens with expiration
- Tokens stored in localStorage
- Automatic token refresh
- Token validation on each request

### Google OAuth Security
- Token verification with Google servers
- Client ID validation
- Secure credential exchange
- No password storage for OAuth users

### API Security
- CORS configuration
- Rate limiting (to be implemented)
- Input validation with Pydantic
- SQL injection prevention (SQLAlchemy ORM)

## Environment Variables

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

### Backend (.env)
```env
# JWT
SECRET_KEY=your-secret-key-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Database
DATABASE_URL=sqlite:///./kramic.db

# Telegram Bot
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
```

## Testing the Flow

### Test Google OAuth
1. Start servers: `backend: python run.py`, `frontend: npm run dev`
2. Navigate to: http://localhost:3000/auth
3. Click "Continue with Google"
4. Select Google account
5. ✅ Redirected to /auth/setup (new user)
6. Fill profile: domain, skills, bio, avatar
7. Click "Complete Setup"
8. ✅ Redirected to dashboard

### Test Email/Password
1. Navigate to: http://localhost:3000/auth
2. Fill form: name, email, password, domain
3. Click "Start Building Karma" (student) or "Start Posting Tasks" (client)
4. ✅ Redirected to /auth/setup
5. Complete profile setup
6. ✅ Redirected to dashboard

### Test Quick Demo
1. Navigate to: http://localhost:3000/auth
2. Click "⚡ Quick Demo Login"
3. Select "Alex Chen" (Backend student)
4. ✅ Instant dashboard access (no setup needed)

## Current Status

### ✅ Implemented
- Google OAuth integration
- Email/password registration
- Profile setup flow
- Role-based routing
- JWT authentication
- User database models
- Profile completion check
- Dashboard access

### 🚧 To Be Implemented
- Telegram bot integration
- Task creation via bot
- Task listing on website
- Task application system
- Work submission
- Payment processing
- Karma point distribution
- Real-time notifications

## Next Steps

1. **Telegram Bot**: Implement task creation flow
2. **Task API**: Create endpoints for task management
3. **Task UI**: Build task listing and detail pages
4. **Application System**: Allow students to apply for tasks
5. **Submission System**: Allow students to submit work
6. **Review System**: Allow clients to approve/reject work
7. **Payment Integration**: Process payments on approval
8. **Karma Distribution**: Award karma points on completion

## Summary

The authentication system is **fully functional** with:
- ✅ Google OAuth (one-click sign-in)
- ✅ Email/password registration
- ✅ Profile setup for new users
- ✅ Role-based access (students/clients)
- ✅ Karma-based identity (no resume needed)
- ✅ Secure token management
- ✅ Complete user flow from signup to dashboard

**Test it now**: http://localhost:3000/auth
