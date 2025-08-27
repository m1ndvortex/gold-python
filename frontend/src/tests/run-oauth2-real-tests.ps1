# OAuth2 Real Integration Test Runner (PowerShell)
# This script runs comprehensive OAuth2 tests against real backend and database

Write-Host "🚀 Starting OAuth2 Real Integration Tests" -ForegroundColor Blue
Write-Host "==========================================" -ForegroundColor Blue

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
    Write-Status "Docker is running ✓"
} catch {
    Write-Error "Docker is not running. Please start Docker first."
    exit 1
}

# Check if docker-compose is available
try {
    docker-compose --version | Out-Null
    Write-Status "docker-compose is available ✓"
} catch {
    Write-Error "docker-compose is not installed or not in PATH"
    exit 1
}

# Start the services if not already running
Write-Status "Starting Docker services..."
docker-compose up -d

# Wait for services to be ready
Write-Status "Waiting for services to be ready..."
Start-Sleep -Seconds 10

# Check if backend is responding
Write-Status "Checking backend health..."
$maxAttempts = 30
$attempt = 1
$backendReady = $false

while ($attempt -le $maxAttempts) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Success "Backend is ready!"
            $backendReady = $true
            break
        }
    } catch {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:8000/" -TimeoutSec 5 -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                Write-Success "Backend is responding!"
                $backendReady = $true
                break
            }
        } catch {
            Write-Status "Backend not ready yet (attempt $attempt/$maxAttempts)..."
            Start-Sleep -Seconds 2
            $attempt++
        }
    }
}

if (-not $backendReady) {
    Write-Error "Backend failed to start within timeout period"
    Write-Status "Checking backend logs..."
    docker-compose logs backend
    exit 1
}

# Check if database is ready
Write-Status "Checking database connection..."
try {
    $dbCheck = docker-compose exec -T db pg_isready -U postgres 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Database is ready!"
    } else {
        Write-Warning "Database check failed, but continuing with tests..."
    }
} catch {
    Write-Warning "Database check failed, but continuing with tests..."
}

# Check if frontend is ready
Write-Status "Checking frontend availability..."
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 10 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Success "Frontend is ready!"
    }
} catch {
    Write-Warning "Frontend not responding, but continuing with tests..."
}

# Run the OAuth2 integration tests
Write-Status "Running OAuth2 Real Integration Tests..."
Write-Host "==========================================" -ForegroundColor Blue

# Set test environment variables
$env:NODE_ENV = "test"
$env:REACT_APP_API_URL = "http://localhost:8000"

# Run the tests with verbose output
Write-Status "Executing tests in Docker container..."
$testCommand = @"
npm test -- --testPathPattern=oauth2-real-integration.test.tsx --watchAll=false --verbose --runInBand --detectOpenHandles --forceExit --testTimeout=60000
"@

$testResult = docker-compose exec frontend powershell -Command $testCommand
$testExitCode = $LASTEXITCODE

# Print test results
Write-Host "==========================================" -ForegroundColor Blue
if ($testExitCode -eq 0) {
    Write-Success "All OAuth2 integration tests passed! 🎉"
} else {
    Write-Error "Some OAuth2 integration tests failed! ❌"
}

# Show service logs if tests failed
if ($testExitCode -ne 0) {
    Write-Status "Showing recent backend logs for debugging..."
    Write-Host "----------------------------------------" -ForegroundColor Gray
    docker-compose logs --tail=50 backend
    Write-Host "----------------------------------------" -ForegroundColor Gray
    
    Write-Status "Showing recent database logs for debugging..."
    Write-Host "----------------------------------------" -ForegroundColor Gray
    docker-compose logs --tail=20 db
    Write-Host "----------------------------------------" -ForegroundColor Gray
}

# Optional: Keep services running for manual testing
$keepRunning = Read-Host "Keep services running for manual testing? (y/N)"
if ($keepRunning -eq "y" -or $keepRunning -eq "Y") {
    Write-Status "Services are still running. You can access:"
    Write-Host "  - Frontend: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "  - Backend API: http://localhost:8000" -ForegroundColor Cyan
    Write-Host "  - Backend Docs: http://localhost:8000/docs" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "To stop services later, run: docker-compose down" -ForegroundColor Yellow
} else {
    Write-Status "Stopping Docker services..."
    docker-compose down
    Write-Success "Services stopped."
}

exit $testExitCode