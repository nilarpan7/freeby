from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import json

from database.mock_db import get_all_bounties
from database.database import init_db
from docker_manager import provision_pod, cleanup_pod, generate_pow_receipt
from config import FRONTEND_URL

# Import routes
from routes.auth_routes import router as auth_router
from routes.task_routes import router as task_router
from routes.user_routes import router as user_router
from routes.sprint_routes import router as sprint_router

app = FastAPI(title="Kramic.sh API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    init_db()
    print("✅ Database initialized")

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
        "docs": "/docs"
    }

@app.get("/api/bounties")
def fetch_bounties():
    return {"bounties": get_all_bounties()}

@app.websocket("/ws/arena/{bounty_id}")
async def arena_websocket(websocket: WebSocket, bounty_id: str):
    await websocket.accept()
    
    # 1. Provision Ephemeral Pod
    container_id = provision_pod()
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
                    
                    receipt = generate_pow_receipt(container_id, code_buffer)
                    await websocket.send_text(f"\033[1;32mProof-of-Work Minted!\033[0m\r\n")
                    await websocket.send_text(f"SHA-256 Hash: {receipt['hash']}\r\n")
                    await websocket.send_text(f"Algorithms Hint: {receipt['telemetry']['algo_hint']}\r\n")
                    await websocket.send_text(f"\r\nPod Destroyed. Please return to dashboard.")
                    
                    cleanup_pod(container_id)
                    await websocket.close()
                    break
                else:
                    code_buffer += "\r"
                    await websocket.send_text("\r\n")
            else:
                code_buffer += data
                await websocket.send_text(data) # Echo
                
    except WebSocketDisconnect:
        cleanup_pod(container_id)
        print("Arena disconnect")
