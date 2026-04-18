# Quick Start Guide

## Running the Backend Server

### Method 1: Using the run script (Easiest)

```bash
cd backend
python run.py
```

### Method 2: Using the batch file (Windows only)

```bash
cd backend
start.bat
```

### Method 3: Using uvicorn directly

```bash
cd backend
uvicorn main:app --reload
```

## What to expect

When the server starts successfully, you should see:

```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [xxxxx] using WatchFiles
✅ Database initialized
INFO:     Application startup complete.
```

## Access the API

- **API Root**: http://127.0.0.1:8000
- **Interactive Docs (Swagger)**: http://127.0.0.1:8000/docs
- **Alternative Docs (ReDoc)**: http://127.0.0.1:8000/redoc

## Common Issues

### "No module named 'database'"

**Solution**: Make sure you're running the command from the `backend` directory:
```bash
cd backend
python run.py
```

### "ModuleNotFoundError: No module named 'fastapi'"

**Solution**: Install dependencies:
```bash
pip install -r requirements.txt
```

### Port 8000 already in use

**Solution**: Either:
1. Stop the other process using port 8000
2. Or change the port in `run.py`:
```python
uvicorn.run("main:app", port=8001, ...)  # Use port 8001 instead
```

## Testing the API

Once the server is running, test it:

```bash
# Test root endpoint
curl http://127.0.0.1:8000

# Test bounties endpoint
curl http://127.0.0.1:8000/api/bounties
```

Or open http://127.0.0.1:8000/docs in your browser for interactive testing.

## Stopping the Server

Press `CTRL+C` in the terminal where the server is running.
