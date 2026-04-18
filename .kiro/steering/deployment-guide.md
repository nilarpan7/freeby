---
inclusion: manual
---

# Deployment Guide

## Prerequisites
- Docker installed
- Python 3.11+
- Node.js 18+
- PostgreSQL (for production)

## Backend Deployment

### Local Development
```bash
cd backend
python run.py
```

### Docker Deployment
```bash
# Build image
docker build -t kramic-backend -f backend/Dockerfile .

# Run container
docker run -p 8000:8000 --env-file backend/.env kramic-backend
```

### Production Considerations
1. Use PostgreSQL instead of SQLite
2. Implement proper logging
3. Set up monitoring (Prometheus, Grafana)
4. Configure reverse proxy (Nginx)
5. Implement SSL/TLS certificates

## Frontend Deployment

### Local Development
```bash
cd frontend
npm run dev
```

### Production Build
```bash
cd frontend
npm run build
npm start
```

### Vercel Deployment
1. Connect GitHub repository to Vercel
2. Configure environment variables
3. Set build command: `npm run build`
4. Set output directory: `.next`

## Database Migration
1. Update `backend/database/models.py` with schema changes
2. Generate migration: `alembic revision --autogenerate -m "description"`
3. Apply migration: `alembic upgrade head`

## Environment Variables
Copy `.env.example` to `.env` and configure:
- Database connection strings
- API keys
- Secret keys
- OAuth credentials

## Monitoring & Logging
- Backend: Implement structured logging
- Frontend: Error tracking (Sentry)
- Performance monitoring
- Health check endpoints

## Security Checklist
- [ ] Environment variables secured
- [ ] Database credentials encrypted
- [ ] API rate limiting implemented
- [ ] CORS properly configured
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF tokens implemented