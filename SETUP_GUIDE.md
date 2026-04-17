# Kramic.sh — Complete Setup Guide

This guide will help you set up the full Kramic.sh platform with all features enabled.

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.9+
- **Docker Desktop** (for Arena feature)
- **PostgreSQL** (optional, SQLite works for development)
- **Redis** (optional, for session management)

## 🚀 Quick Start (Development)

### 1. Backend Setup

```bash
cd backend

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

# Run backend server
uvicorn main:app --reload --port 8000
```

Backend will be available at `http://localhost:8000`
API docs at `http://localhost:8000/docs`

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

Frontend will be available at `http://localhost:3000`

## 🔐 Google OAuth Setup

### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure OAuth consent screen
6. Add authorized redirect URIs:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000` (for development)
7. Copy **Client ID** and **Client Secret**

### 2. Configure Backend

Update `backend/.env`:
```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

### 3. Configure Frontend

Update `frontend/.env.local`:
```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

## 🔗 Liveblocks Setup (Squad Sprints)

### 1. Create Liveblocks Account

1. Go to [Liveblocks.io](https://liveblocks.io/)
2. Sign up for free account
3. Create a new project
4. Copy **Secret Key** and **Public Key**

### 2. Configure Backend

Update `backend/.env`:
```env
LIVEBLOCKS_SECRET_KEY=sk_prod_your_secret_key
```

### 3. Configure Frontend

Update `frontend/.env.local`:
```env
NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY=pk_prod_your_public_key
```

### 4. Install Liveblocks in Frontend

```bash
cd frontend
npm install @liveblocks/client @liveblocks/react
```

## ⛓️ Blockchain Setup (EAS Attestations)

### 1. Get Base Network Access

1. Create account on [Base](https://base.org/)
2. Get testnet ETH from [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet)
3. Create a wallet (MetaMask recommended)
4. Export private key (⚠️ Never commit this!)

### 2. Register EAS Schema

1. Go to [EAS Schema Registry](https://base.easscan.org/)
2. Register schema for task completion:
   ```
   address student, string taskId, uint8 karmaEarned, string githubLink
   ```
3. Copy schema UID

### 3. Configure Backend

Update `backend/.env`:
```env
EAS_CONTRACT_ADDRESS=0x4200000000000000000000000000000000000021
BASE_RPC_URL=https://sepolia.base.org  # For testnet
PRIVATE_KEY=your_wallet_private_key_here
```

Update `backend/blockchain.py`:
```python
TASK_COMPLETION_SCHEMA = "0x..." # Your schema UID
```

## 🗄️ Database Setup

### Option 1: SQLite (Default - No Setup Required)

SQLite is configured by default and works out of the box.

### Option 2: PostgreSQL (Recommended for Production)

1. Install PostgreSQL
2. Create database:
   ```sql
   CREATE DATABASE kramic;
   ```
3. Update `backend/.env`:
   ```env
   DATABASE_URL=postgresql://user:password@localhost/kramic
   ```

### Option 3: Neon (Serverless PostgreSQL)

1. Sign up at [Neon.tech](https://neon.tech/)
2. Create a new project
3. Copy connection string
4. Update `backend/.env`:
   ```env
   DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/kramic
   ```

## 🔴 Redis Setup (Optional)

### Local Redis

```bash
# Install Redis
# Windows: Use WSL or download from https://redis.io/download
# Mac: brew install redis
# Linux: sudo apt-get install redis-server

# Start Redis
redis-server
```

### Redis Cloud (Free Tier)

1. Sign up at [Redis Cloud](https://redis.com/try-free/)
2. Create a new database
3. Copy connection string
4. Update `backend/.env`:
   ```env
   REDIS_URL=redis://default:password@redis-xxxxx.cloud.redislabs.com:12345
   ```

## 🐳 Docker Setup (Arena Feature)

### 1. Install Docker Desktop

Download from [Docker.com](https://www.docker.com/products/docker-desktop/)

### 2. Verify Installation

```bash
docker --version
docker ps
```

### 3. Pull Required Images

```bash
docker pull python:3.9-slim
```

## 🔑 JWT Secret Key

Generate a secure secret key:

```bash
# Python
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Or use online generator
# https://generate-secret.vercel.app/32
```

Update `backend/.env`:
```env
SECRET_KEY=your-generated-secret-key-min-32-characters
```

## 📦 Install All Dependencies

### Backend

```bash
cd backend
pip install -r requirements.txt
```

### Frontend

```bash
cd frontend
npm install
```

## 🧪 Testing the Setup

### 1. Start Backend

```bash
cd backend
uvicorn main:app --reload
```

Visit `http://localhost:8000/docs` to see API documentation

### 2. Start Frontend

```bash
cd frontend
npm run dev
```

Visit `http://localhost:3000`

### 3. Test Features

1. **Authentication**
   - Register with email/password
   - Login with Google OAuth

2. **Tasks**
   - Create task (as senior)
   - Claim task (as student)
   - Submit work
   - Review submission

3. **Karma System**
   - Check karma updates after task approval
   - View karma events timeline

4. **Squad Sprints** (if Liveblocks configured)
   - Create sprint session
   - Join with multiple users
   - Real-time collaboration

5. **Arena** (if Docker running)
   - Start coding session
   - WebSocket terminal connection

## 🚢 Production Deployment

### Backend (Railway/Render)

1. Push code to GitHub
2. Connect to Railway/Render
3. Set environment variables
4. Deploy

### Frontend (Vercel)

```bash
cd frontend
vercel
```

Or connect GitHub repo to Vercel dashboard

### Database (Neon/Supabase)

Use managed PostgreSQL service for production

### Environment Variables Checklist

**Backend (.env):**
- ✅ SECRET_KEY
- ✅ GOOGLE_CLIENT_ID
- ✅ GOOGLE_CLIENT_SECRET
- ✅ DATABASE_URL
- ✅ LIVEBLOCKS_SECRET_KEY
- ⚠️ PRIVATE_KEY (optional, for attestations)
- ⚠️ REDIS_URL (optional)

**Frontend (.env.local):**
- ✅ NEXT_PUBLIC_API_URL
- ✅ NEXT_PUBLIC_GOOGLE_CLIENT_ID
- ✅ NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY

## 🐛 Troubleshooting

### Backend won't start

```bash
# Check Python version
python --version  # Should be 3.9+

# Reinstall dependencies
pip install --upgrade -r requirements.txt

# Check database connection
python -c "from database.database import engine; print(engine.connect())"
```

### Frontend build errors

```bash
# Clear cache
rm -rf .next node_modules
npm install
npm run build
```

### Google OAuth not working

- Check redirect URIs match exactly
- Verify client ID in both backend and frontend
- Check OAuth consent screen is configured

### Liveblocks connection fails

- Verify API keys are correct
- Check network connectivity
- Review Liveblocks dashboard for errors

### Docker containers not starting

```bash
# Check Docker is running
docker ps

# Check Docker daemon
docker info

# Restart Docker Desktop
```

## 📞 Support

- **Documentation:** See `IMPLEMENTATION_SUMMARY.md`
- **API Docs:** `http://localhost:8000/docs`
- **Frontend README:** `frontend/README.md`
- **Backend Issues:** Check logs with `uvicorn main:app --log-level debug`

## 🎯 Next Steps

1. ✅ Complete basic setup
2. ✅ Test authentication
3. ✅ Configure Google OAuth
4. ✅ Set up Liveblocks
5. ⚠️ Configure blockchain (optional)
6. 🚀 Deploy to production

---

**Happy Building! 🎯**

The Resume is Dead. Long Live Karma.
