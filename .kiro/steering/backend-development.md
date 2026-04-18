---
inclusion: fileMatch
fileMatchPattern: "backend/**/*.py"
---

# Backend Development Guide

## Environment Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
```

## Running the Backend
```bash
cd backend
python run.py
# or
python main.py
```

## Database Operations
- Use SQLAlchemy models from `backend/database/models.py`
- Database session management via `backend/database/database.py`
- For testing: `backend/database/mock_db.py` provides mock data

## API Structure
- Routes defined in `backend/routes/` directory
- Use FastAPI/Flask style route decorators
- Request validation with Pydantic schemas in `backend/schemas.py`
- Authentication via `backend/auth.py`

## Key Components
- `backend/agent.py`: AI agent integration
- `backend/blockchain.py`: Smart contract interactions
- `backend/liveblocks.py`: Real-time collaboration
- `backend/telegram_bot.py`: Telegram bot integration
- `backend/docker_manager.py`: Docker container management

## Testing
```bash
# Install test dependencies
pip install pytest pytest-asyncio

# Run tests
pytest backend/tests/
```

## Common Patterns
1. Use dependency injection for database sessions
2. Implement proper error handling with HTTP exceptions
3. Use environment variables for configuration
4. Implement logging for debugging
5. Use async/await for external API calls