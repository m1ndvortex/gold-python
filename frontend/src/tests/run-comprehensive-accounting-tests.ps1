# Comprehensive Double-Entry Accounting Tests Runner (Windows PowerShell)
# This script runs comprehensive tests for the double-entry accounting system using real backend APIs in Docker

Write-Host "🧮 Starting Comprehensive Double-Entry Accounting Tests..." -ForegroundColor Blue
Write-Host "🐳 Using Docker environment for real database testing" -ForegroundColor Blue

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Status "Docker is running ✅"
} catch {
    Write-Error "Docker is not running. Please start Docker Desktop and try again."
    exit 1
}

# Check if docker-compose is available
try {
    docker-compose --version | Out-Null
    Write-Status "docker-compose is available ✅"
} catch {
    Write-Error "docker-compose is not installed. Please install Docker Desktop with docker-compose and try again."
    exit 1
}

# Navigate to project root (assuming script is in frontend/src/tests/)
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Resolve-Path "$scriptPath/../../.."
Set-Location $projectRoot

# Check if docker-compose.yml exists
if (-not (Test-Path "docker-compose.yml")) {
    Write-Error "docker-compose.yml not found. Please run this script from the project root."
    exit 1
}

Write-Status "Found docker-compose.yml ✅"

# Start the services
Write-Status "Starting Docker services..."
docker-compose up -d --build

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to start Docker services"
    exit 1
}

# Wait for services to be ready
Write-Status "Waiting for services to be ready..."
Start-Sleep -Seconds 10

# Check if backend is responding
Write-Status "Checking backend health..."
$backendReady = $false
for ($i = 1; $i -le 30; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Success "Backend is ready!"
            $backendReady = $true
            break
        }
    } catch {
        # Backend not ready yet
    }
    
    if ($i -eq 30) {
        Write-Error "Backend failed to start within timeout"
        docker-compose logs backend
        exit 1
    }
    
    Write-Status "Waiting for backend... ($i/30)"
    Start-Sleep -Seconds 2
}

# Check if frontend is ready
Write-Status "Checking frontend availability..."
$frontendReady = $false
for ($i = 1; $i -le 15; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Success "Frontend is ready!"
            $frontendReady = $true
            break
        }
    } catch {
        # Frontend not ready yet
    }
    
    if ($i -eq 15) {
        Write-Warning "Frontend might not be ready, but continuing with tests..."
        break
    }
    
    Write-Status "Waiting for frontend... ($i/15)"
    Start-Sleep -Seconds 2
}

# Run the comprehensive accounting tests
Write-Status "Running comprehensive double-entry accounting tests..."

# Set environment variables for testing
$env:REACT_APP_API_URL = "http://localhost:8000"
$env:REACT_APP_FRONTEND_URL = "http://localhost:3000"
$env:NODE_ENV = "test"

# Run the specific test file
Write-Status "Executing test command..."
docker-compose exec frontend npm test -- --testPathPattern=comprehensive-double-entry-accounting.test.tsx --watchAll=false --verbose --coverage

$testExitCode = $LASTEXITCODE

# Display test results
if ($testExitCode -eq 0) {
    Write-Success "🎉 All comprehensive accounting tests passed!"
    Write-Success "✅ Double-entry accounting system is working correctly"
    Write-Success "✅ All components integrate properly with real database"
    Write-Success "✅ Financial calculations are accurate"
    Write-Success "✅ Data integrity is maintained"
} else {
    Write-Error "❌ Some tests failed. Check the output above for details."
}

# Show service logs if tests failed
if ($testExitCode -ne 0) {
    Write-Status "Showing recent service logs for debugging..."
    Write-Host "=== Backend Logs ===" -ForegroundColor Yellow
    docker-compose logs --tail=50 backend
    Write-Host "=== Database Logs ===" -ForegroundColor Yellow
    docker-compose logs --tail=20 db
}

# Optional: Keep services running for manual testing
$keepRunning = Read-Host "Keep Docker services running for manual testing? (y/N)"
if ($keepRunning -eq "y" -or $keepRunning -eq "Y") {
    Write-Status "Services are still running. You can:"
    Write-Status "- Access frontend at: http://localhost:3000"
    Write-Status "- Access backend API at: http://localhost:8000"
    Write-Status "- View API docs at: http://localhost:8000/docs"
    Write-Status "Run 'docker-compose down' to stop services when done."
} else {
    Write-Status "Stopping Docker services..."
    docker-compose down
    Write-Success "Services stopped."
}

exit $testExitCode