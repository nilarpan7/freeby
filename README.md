# Kramic.sh — Work Verification Protocol

> **The Resume is Dead. Your Work Graph is Your Identity.**

A work-verification and referral protocol designed to eliminate the Tier-2/3 opportunity gap in tech hiring. Students build portable, verifiable Karma Graphs by completing real micro-tasks and collaborating on open-source sprints.

[![Next.js](https://img.shields.io/badge/Next.js-16.2.4-black)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111.0-009688)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.9+-blue)](https://www.python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)

## 🎯 Overview

Kramic.sh shifts the unit of trust from "Where did you study?" to "What have you shipped, and who vouches for you?" by creating a reputation layer for the developer workforce.

### Core Features

- **🔐 JWT Authentication** with Google OAuth
- **⚡ Karma System** - Reputation-weighted, time-decaying score
- **🎨 Hand-Drawn UI** - Unique "2B pencil sketch" aesthetic
- **🤝 Squad Sprints** - Real-time collaboration with Liveblocks
- **⛓️ EAS Attestations** - On-chain proof of work on Base L2
- **🐳 Live Coding Arena** - WebSocket terminal with Docker containers
- **📊 Leaderboard** - Rank by karma, not college name

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.9+
- Docker Desktop (for Arena)

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/freeby.git
cd freeby
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -c "from database.database import init_db; init_db()"
uvicorn main:app --reload --port 8000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000` 🎉

## 📁 Project Structure

```
freeby/
├── backend/              # FastAPI backend
│   ├── routes/          # API endpoints
│   ├── database/        # SQLAlchemy models
│   ├── auth.py          # JWT authentication
│   ├── blockchain.py    # EAS attestations
│   └── liveblocks.py    # Squad sprints
├── frontend/            # Next.js 14 frontend
│   └── src/
│       ├── app/         # Pages (App Router)
│       ├── components/  # UI components
│       └── lib/         # API client, types
└── docs/                # Documentation
```

## 🔑 Environment Setup

### Backend `.env`
```env
SECRET_KEY=your-secret-key
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
DATABASE_URL=sqlite:///./kramic.db
LIVEBLOCKS_SECRET_KEY=sk_prod_xxx
```

### Frontend `.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY=pk_prod_xxx
```

See `.env.example` files for complete configuration.

## 📚 Documentation

- **[Setup Guide](SETUP_GUIDE.md)** - Complete installation instructions
- **[Quick Reference](QUICK_REFERENCE.md)** - Commands and API endpoints
- **[Integration Guide](INTEGRATION_COMPLETE.md)** - Feature status and next steps
- **[Backend README](backend/README.md)** - API documentation

## 🎨 Tech Stack

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS 4
- Framer Motion
- Liveblocks (real-time)

### Backend
- FastAPI
- SQLAlchemy
- PostgreSQL/SQLite
- Web3.py (EAS)
- Docker SDK

### Blockchain
- Ethereum Attestation Service (EAS)
- Base L2
- Soulbound tokens

## 🔗 API Endpoints

### Authentication
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/google
GET  /api/auth/me
```

### Tasks
```
GET  /api/tasks
POST /api/tasks
POST /api/tasks/{id}/claim
POST /api/tasks/{id}/submit
POST /api/tasks/{id}/review
```

### Users
```
GET /api/users/{id}
GET /api/users/{id}/karma
GET /api/users (leaderboard)
```

### Squad Sprints
```
POST /api/sprints
POST /api/sprints/join
GET  /api/sprints/{id}/auth
POST /api/sprints/complete
```

Full API docs: `http://localhost:8000/docs`

## 🎯 Karma System

| Event | Karma | Notes |
|-------|-------|-------|
| Task Approved | +10 | Standard approval |
| Task Flagged | -5 | Penalty |
| Sprint Complete | +20 | Base karma |
| Peer Upvote | +4 | Per upvote |
| Production Deploy | +50 | Bonus |
| Code Review | +3 | Meaningful review |

**Referral Unlock:** 500 Karma

## 🚢 Deployment

### Frontend (Vercel)
```bash
cd frontend
vercel
```

### Backend (Railway)
```bash
cd backend
railway up
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

## 📄 License

MIT License - See LICENSE file for details

## 🔗 Links

- **Live Demo:** Coming Soon
- **API Docs:** `http://localhost:8000/docs`
- **Discord:** Coming Soon

## 👥 Team

Built with conviction. Designed with a 2B Pencil.

---

**The Resume is Dead. Long Live Karma. 🎯**
