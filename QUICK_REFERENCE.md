# Kramic.sh — Quick Reference Card

## 🚀 Start Commands

```bash
# Backend
cd backend && uvicorn main:app --reload --port 8000

# Frontend
cd frontend && npm run dev

# Both (in separate terminals)
```

## 🔗 URLs

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

## 🔑 Environment Files

### Backend `.env`
```env
SECRET_KEY=your-secret-key-32-chars-min
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
DATABASE_URL=sqlite:///./kramic.db
LIVEBLOCKS_SECRET_KEY=sk_prod_xxx
PRIVATE_KEY=  # Optional
```

### Frontend `.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY=pk_prod_xxx
```

## 📡 API Endpoints

### Auth
```
POST /api/auth/register    # Register
POST /api/auth/login       # Login
POST /api/auth/google      # Google OAuth
GET  /api/auth/me          # Current user
```

### Tasks
```
GET  /api/tasks            # List tasks
POST /api/tasks            # Create (senior)
POST /api/tasks/{id}/claim    # Claim (student)
POST /api/tasks/{id}/submit   # Submit work
POST /api/tasks/{id}/review   # Review (senior)
```

### Users
```
GET /api/users/{id}        # Profile
GET /api/users/{id}/karma  # Karma events
GET /api/users             # Leaderboard
```

### Sprints
```
POST /api/sprints          # Create
POST /api/sprints/join     # Join
GET  /api/sprints/{id}/auth    # Get token
POST /api/sprints/complete     # Complete
```

## 🧪 Test Requests

### Register
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"pass123","name":"Test","role":"student","domain":"Backend","skills":["Python"]}'
```

### Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -d "username=test@test.com&password=pass123"
```

### Get Tasks (with auth)
```bash
curl http://localhost:8000/api/tasks \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🗄️ Database

### Initialize
```bash
python -c "from database.database import init_db; init_db()"
```

### Reset (SQLite)
```bash
rm kramic.db
python -c "from database.database import init_db; init_db()"
```

### Check Connection
```bash
python -c "from database.database import engine; print(engine.connect())"
```

## 🐛 Troubleshooting

### Backend won't start
```bash
pip install --upgrade -r requirements.txt
python --version  # Check 3.9+
```

### Frontend build fails
```bash
rm -rf .next node_modules
npm install
```

### Database errors
```bash
# Check DATABASE_URL
echo $DATABASE_URL

# Reinitialize
python -c "from database.database import init_db; init_db()"
```

### Docker not working
```bash
docker ps  # Check Docker running
docker info  # Check daemon
```

## 📦 Dependencies

### Backend
```bash
pip install -r requirements.txt
```

### Frontend
```bash
npm install
```

## 🔐 Get API Keys

### Google OAuth
1. https://console.cloud.google.com/
2. Create OAuth 2.0 Client ID
3. Add redirect: `http://localhost:3000/auth/callback`

### Liveblocks
1. https://liveblocks.io/
2. Create project
3. Copy Secret Key (backend) + Public Key (frontend)

### Base/EAS (Optional)
1. Create wallet (MetaMask)
2. Get testnet ETH
3. Register schema at https://base.easscan.org/

## 📊 Karma Values

| Event | Karma | Notes |
|-------|-------|-------|
| Task Approved | +10 | Standard |
| Task Flagged | -5 | Penalty |
| Sprint Complete | +20 | Base |
| Peer Upvote | +4 | Per upvote |
| Production Deploy | +50 | Bonus |
| Code Review | +3 | Meaningful review |

## 🎯 User Roles

### Student
- Browse tasks
- Claim tasks
- Submit work
- Join sprints
- Earn karma
- Request referrals (500+ karma)

### Senior
- Post tasks
- Review submissions
- Approve/Flag work
- Earn mentor score
- Receive referral bonuses

## 📁 Key Files

### Backend
```
main.py              # Entry point
config.py            # Configuration
auth.py              # JWT logic
blockchain.py        # EAS service
liveblocks.py        # Liveblocks
routes/              # API endpoints
database/models.py   # DB models
```

### Frontend
```
src/lib/api.ts           # API client
src/lib/auth-context.tsx # Auth state
src/lib/types.ts         # TypeScript types
src/app/                 # Pages
src/components/          # UI components
```

## 🚢 Deploy

### Backend (Railway)
```bash
railway login
railway up
```

### Frontend (Vercel)
```bash
vercel
```

## 📞 Help

- **Setup:** `SETUP_GUIDE.md`
- **API Docs:** http://localhost:8000/docs
- **Integration:** `INTEGRATION_COMPLETE.md`
- **Backend:** `backend/README.md`
- **Frontend:** `frontend/README.md`

---

**Quick Start:** `cd backend && uvicorn main:app --reload` + `cd frontend && npm run dev`
