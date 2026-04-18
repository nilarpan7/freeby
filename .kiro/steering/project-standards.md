---
inclusion: always
---

# Project Standards & Norms

## Project Overview
This is a full-stack application with:
- **Backend**: Python/Flask with SQLite database
- **Frontend**: Next.js 14 with TypeScript
- **Authentication**: Google OAuth
- **Real-time**: Liveblocks integration
- **Blockchain**: Smart contract integration

## Coding Standards

### Backend (Python)
- Use type hints for all function signatures
- Follow PEP 8 style guide
- Use SQLAlchemy ORM for database operations
- Environment variables in `.env` file (never commit secrets)
- Error handling with proper HTTP status codes
- Use async/await for I/O operations when possible

### Frontend (TypeScript/Next.js)
- Use TypeScript strict mode
- Functional components with React hooks
- Tailwind CSS for styling
- Next.js App Router structure
- API calls through `src/lib/api.ts`
- Context for global state (auth, etc.)

## File Structure Conventions
- Backend routes in `backend/routes/`
- Database models in `backend/database/models.py`
- Frontend pages in `frontend/src/app/`
- Shared types in `frontend/src/lib/types.ts`
- Components in `frontend/src/components/`

## Development Workflow
1. Backend: `cd backend && python run.py`
2. Frontend: `cd frontend && npm run dev`
3. Database migrations handled via SQLAlchemy
4. Environment setup: Copy `.env.example` to `.env`

## Testing & Quality
- Backend: pytest (to be implemented)
- Frontend: Jest/React Testing Library (to be implemented)
- Linting: ESLint for frontend, flake8 for backend
- Pre-commit hooks recommended

## Security Guidelines
- Never commit `.env` files
- Validate all user input
- Use prepared statements for SQL
- Implement rate limiting
- Secure session management
- CORS configuration for API