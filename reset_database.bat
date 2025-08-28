@echo off
echo Starting Database Reset...
echo.

REM Check if Docker is running
docker --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not installed or not running
    echo Please start Docker Desktop and try again
    pause
    exit /b 1
)

REM Check if docker-compose is available
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: docker-compose is not available
    echo Please ensure Docker Desktop is properly installed
    pause
    exit /b 1
)

echo Docker is available, proceeding with database reset...
echo.

REM Run the Python reset script
python reset_database_complete.py

if errorlevel 1 (
    echo.
    echo ERROR: Database reset failed
    echo Please check the error messages above
    pause
    exit /b 1
)

echo.
echo Database reset completed successfully!
echo You can now access the application at http://localhost:3000
echo.
pause