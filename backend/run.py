"""
Simple script to run the FastAPI application
Usage: python run.py
"""
import uvicorn

if __name__ == "__main__":
    print("Starting Kramic.sh API server...")
    print("Server will be available at: http://127.0.0.1:8000")
    print("API documentation at: http://127.0.0.1:8000/docs")
    print("\nPress CTRL+C to stop the server\n")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
