# Kramic.sh Backend API

FastAPI backend for the Kramic.sh work-verification and referral protocol.

## 🚀 Features

- **JWT Authentication** with email/password and Google OAuth
- **Task Management** - Create, claim, submit, and review tasks
- **Karma System** - Automated reputation tracking with blockchain attestations
- **Squad Sprints** - Real-time collaboration with Liveblocks integration
- **WebSocket Arena** - Live coding environment with Docker containers
- **EAS Attestations** - On-chain proof of work on Base L2
- **RESTful API** - Comprehensive API with automatic documentation

## 📁 Project Structure

```
backend/
├── main.py                 # FastAPI app entry point
├── config.py               # Configuration management
├── auth.py                 # JWT authentication logic
├── blockchain.py           # EAS attestation service
├── liveblocks.py          # Liveblocks integration
├── docker_manager.py       # Container orchestration
├── agent.py                # AI task parsing (legacy)
├── schemas.py              # Pydantic models (legacy)
├── requirements.txt        # Python dependencies
├── .env                    # Environment variables
├── database/
│   ├── database.py        # SQLAlchemy setup
│   ├── models.py          # Database models
│   └── mock_db.py         # Legacy mock data
└── routes/
    ├── auth_routes.py     # Authentication endpoints
    ├── task_routes.py     # Task management endpoints
    ├── user_routes.py     # User profile endpoints
    └── sprint_routes.py   # Squad sprint endpoints
```

## 🛠 Installation

### Prerequisites
- Python 3.9+
- PostgreSQL (optional, SQLite works for dev)

### Setup

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Initialize database
python -c "from database.database import init_db; init_db()"
```

### Running the Server

**Option 1: Using the run script (Recommended)**
```bash
# From the backend directory
python run.py
```

**Option 2: Using the batch file (Windows)**
```bash
# From the backend directory
start.bat
```

**Option 3: Using uvicorn directly**
```bash
# From the backend directory
uvicorn main:app --reload --port 8000
```

The server will be available at:
- API: `http://127.0.0.1:8000`
- Swagger Docs: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`

## 🔐 Environment Variables

Create a `.env` file:

```env
# JWT
SECRET_KEY=your-secret-key-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# Database
DATABASE_URL=sqlite:///./kramic.db
# Or PostgreSQL: postgresql://user:password@localhost/kramic

# Blockchain (EAS on Base)
EAS_CONTRACT_ADDRESS=0x4200000000000000000000000000000000000021
BASE_RPC_URL=https://mainnet.base.org
PRIVATE_KEY=  # Optional: for signing attestations

# Liveblocks
LIVEBLOCKS_SECRET_KEY=sk_prod_your_secret_key

# Frontend
FRONTEND_URL=http://localhost:3000
```

## 📚 API Documentation

Once running, visit:
- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`

## 🔗 API Endpoints

### Authentication
```
POST   /api/auth/register      # Register with email/password
POST   /api/auth/login         # Login with email/password
POST   /api/auth/google        # Login with Google OAuth
GET    /api/auth/me            # Get current user
```

### Tasks
```
GET    /api/tasks              # Get all tasks (with filters)
GET    /api/tasks/{id}         # Get task by ID
POST   /api/tasks              # Create task (senior only)
POST   /api/tasks/{id}/claim   # Claim task (student only)
POST   /api/tasks/{id}/submit  # Submit work
POST   /api/tasks/{id}/review  # Review submission (senior only)
```

### Users
```
GET    /api/users/{id}         # Get user profile
GET    /api/users/{id}/karma   # Get karma events
GET    /api/users              # Get leaderboard
```

### Squad Sprints
```
POST   /api/sprints            # Create sprint session
POST   /api/sprints/join       # Join sprint
GET    /api/sprints/{id}/auth  # Get Liveblocks auth token
POST   /api/sprints/complete   # Complete sprint
GET    /api/sprints            # Get active sprints
```

### WebSocket
```
WS     /ws/arena/{bounty_id}   # Live coding arena
```

## 🗄️ The platform allows Clients to post micro-tasks that are completed by Students.
Identity is built through a Karma score.
- **Client**: Posts tasks, reviews work, earns referral bonuses.
- **Student**: Completes tasks, earns Karma, unlocks referrals.
- **KarmaEvent** - Reputation change log
- **ReferralRequest** - Referral requests from students
- **SprintSession** - Squad sprint collaboration sessions

## ⛓️ Blockchain Integration

### EAS Attestations

When a task is approved, an attestation is minted on Base L2:

```python
attestation_uid = blockchain_service.mint_task_attestation(
    student_address="0x...",
    task_id="task-123",
    karma_earned=10,
    github_link="https://github.com/..."
)
```

Schema: `address student, string taskId, uint8 karmaEarned, string githubLink`

## 🔄 Liveblocks Integration

Squad sprints use Liveblocks for real-time collaboration:

```python
# Create room
room = await liveblocks_service.create_room(
    room_id="sprint-123",
    metadata={"title": "Fix Bug #42"}
)

# Generate auth token for user
token = liveblocks_service.generate_auth_token(
    user_id="student-1",
    room_id="sprint-123",
    user_info={"name": "Alice", "avatar": "..."}
)
```

## 🎮 WebSocket Arena

The Arena feature provides a live coding environment with mock container provisioning:

```python
# Provision mock container
container_id = mock_provision_pod()  # Returns mock_container_xxxxx

# Execute code (via WebSocket)
# ...

# Generate proof-of-work receipt
receipt = mock_generate_pow_receipt(container_id, code_snippet)

# Cleanup
mock_cleanup_pod(container_id)
```

**Note:** The Arena currently uses mock functions for container provisioning. Docker integration is available in `docker_manager.py` if needed.

## 🧪 Testing

```bash
# Run tests (TODO: Add tests)
pytest

# Test API manually
curl http://localhost:8000/api/tasks

# Test with authentication
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:8000/api/auth/me
```

## 🚢 Deployment

### Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway up
```

### Render

1. Connect GitHub repo
2. Set environment variables
3. Deploy

### Docker

```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 🔒 Security

- Passwords hashed with bcrypt
- JWT tokens with expiration
- CORS configured for frontend domain
- SQL injection protection via SQLAlchemy
- Input validation with Pydantic

## 📊 Performance

- Async/await for I/O operations
- Database connection pooling
- Redis caching (optional)
- WebSocket for real-time features

## 🐛 Troubleshooting

### Database connection fails
```bash
# Check DATABASE_URL
echo $DATABASE_URL

# Test connection
python -c "from database.database import engine; print(engine.connect())"
```

### Docker containers not starting
```bash
# Check Docker daemon
docker info

# Test container creation
docker run --rm python:3.9-slim echo "Hello"
```

### Google OAuth errors
- Verify client ID and secret
- Check redirect URIs in Google Console
- Ensure OAuth consent screen is configured

## 📞 Support

- **API Docs:** `http://localhost:8000/docs`
- **Setup Guide:** See `../SETUP_GUIDE.md`
- **Issues:** Check logs with `--log-level debug`

---

**Built with FastAPI, SQLAlchemy, and Web3.py**
