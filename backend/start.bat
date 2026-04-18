@echo off
echo Starting Kramic.sh Backend Server...
echo.
echo Server will be available at: http://127.0.0.1:8000
echo API documentation at: http://127.0.0.1:8000/docs
echo.
echo Press CTRL+C to stop the server
echo.

cd /d "%~dp0"
python run.py
