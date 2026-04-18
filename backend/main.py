from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio
import json
import hashlib
import uuid


from config import FRONTEND_URL

# Import routes
from routes.auth_routes import router as auth_router
from routes.task_routes import router as task_router
from routes.user_routes import router as user_router
from routes.sprint_routes import router as sprint_router

# Mock Docker functions for websocket arena
def mock_provision_pod():
    """Mock function to provision a container (returns mock ID)"""
    container_id = f"mock_container_{uuid.uuid4().hex[:16]}"
    print(f"Mock container provisioned: {container_id}")
    return container_id

def mock_cleanup_pod(container_id):
    """Mock function to cleanup a container"""
    if container_id.startswith("mock_container"):
        print(f"Mock container cleaned up: {container_id}")
    else:
        print(f"Cleaning up container: {container_id}")

def mock_generate_pow_receipt(container_id, code_snippet, output=""):
    """Mock function to generate PoW receipt"""
    import time
    telemetry = {
        "compile_count": 1,
        "error_count": 0,
        "peak_memory_mb": 14.5,
        "algo_hint": "O(N) operations detected",
        "execution_time_ms": 1500,
        "container_id": container_id
    }
    
    payload = json.dumps({
        "container": container_id,
        "code": code_snippet,
        "telemetry": telemetry,
        "timestamp": time.time()
    }, sort_keys=True)
    
    receipt_hash = hashlib.sha256(payload.encode('utf-8')).hexdigest()
    
    return {
        "hash": receipt_hash,
        "telemetry": telemetry
    }

# Lifespan event handler for startup/shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    # No database connection needed; Supabase client will be used in routes.
    yield

app = FastAPI(
    title="Kramic.sh API", 
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:3000", "http://localhost:3001", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(task_router)
app.include_router(user_router)
app.include_router(sprint_router)

@app.get("/")
async def root():
    return {
        "message": "Kramic.sh API",
        "version": "1.0.0",
        "database": "Supabase",
        "docs": "/docs"
    }

@app.websocket("/ws/arena/{bounty_id}")
async def arena_websocket(websocket: WebSocket, bounty_id: str):
    await websocket.accept()
    
    # 1. Provision Ephemeral Pod (mock version)
    container_id = mock_provision_pod()
    await websocket.send_text(f"\r\n\033[1;32m[Karmic.sh Arena] Ephemeral Pod {container_id[:8]} provisioned.\033[0m\r\n")
    await websocket.send_text(f"\r\nWrite your Python code below. Press ENTER twice to submit.\r\n$ ")
    
    code_buffer = ""
    try:
        while True:
            data = await websocket.receive_text()
            
            # Simple simulation of terminal logic for hackathon demo
            if data == "\r":
                if code_buffer.endswith("\r"):
                    # Double enter = submit
                    await websocket.send_text("\r\n\r\n\033[1;34mRunning code and generating telemetry...\033[0m\r\n")
                    await asyncio.sleep(1.5)
                    
                    receipt = mock_generate_pow_receipt(container_id, code_buffer)
                    await websocket.send_text(f"\033[1;32mProof-of-Work Minted!\033[0m\r\n")
                    await websocket.send_text(f"SHA-256 Hash: {receipt['hash']}\r\n")
                    await websocket.send_text(f"Algorithms Hint: {receipt['telemetry']['algo_hint']}\r\n")
                    await websocket.send_text(f"\r\nPod Destroyed. Please return to dashboard.")
                    
                    mock_cleanup_pod(container_id)
                    await websocket.close()
                    break
                else:
                    code_buffer += "\r"
                    await websocket.send_text("\r\n")
            else:
                code_buffer += data
                await websocket.send_text(data) # Echo
                
    except WebSocketDisconnect:
        mock_cleanup_pod(container_id)
        print("Arena disconnect")
