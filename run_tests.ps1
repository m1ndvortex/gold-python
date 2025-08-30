# Comprehensive Test Execution Script for Universal Inventory and Invoice Management System
# PowerShell version for Windows

param(
    [string]$Type = "all",
    [switch]$SkipBuild,
    [int]$Timeout = 3600,
    [switch]$Help
)

# Show help if requested
if ($Help) {
    Write-Host "Usage: .\run_tests.ps1 [OPTIONS]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -Type TYPE        Test type to run (all, unit, integration, e2e, load, performance)"
    Write-Host "  -SkipBuild        Skip Docker image building"
    Write-Host "  -Timeout SECONDS  Test timeout in seconds (default: 3600)"
    Write-Host "  -Help             Show this help message"
    exit 0
}

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
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

Write-Host "🚀 Starting Comprehensive Testing Framework" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

# Check if Docker is running
Write-Status "Checking Docker environment..."
try {
    $dockerCheck = docker ps 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "Docker command failed"
    }
    Write-Success "Docker is running"
} catch {
    Write-Error "Docker is not running. Please start Docker and try again."
    exit 1
}

# Check if docker-compose is available
try {
    $composeCheck = docker-compose --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "docker-compose not found"
    }
} catch {
    Write-Error "docker-compose is not installed. Please install docker-compose and try again."
    exit 1
}

Write-Status "Test configuration:"
Write-Host "  Test Type: $Type"
Write-Host "  Skip Build: $SkipBuild"
Write-Host "  Timeout: $Timeout seconds"

# Create test results directory
if (!(Test-Path "test_results")) {
    New-Item -ItemType Directory -Path "test_results" | Out-Null
}

# Build Docker images if not skipping
if (!$SkipBuild) {
    Write-Status "Building Docker images..."
    docker-compose build --no-cache
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to build Docker images"
        exit 1
    }
    Write-Success "Docker images built successfully"
} else {
    Write-Warning "Skipping Docker image build"
}

# Start test environment
Write-Status "Starting test environment..."
docker-compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to start test environment"
    exit 1
}

# Wait for services to be healthy
Write-Status "Waiting for services to be healthy..."
$healthCheckTimeout = 300
$healthCheckStart = Get-Date

do {
    Start-Sleep -Seconds 5
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Success "All services are healthy"
            break
        }
    } catch {
        Write-Host "Waiting for backend..." -ForegroundColor Gray
    }
    
    $elapsed = (Get-Date) - $healthCheckStart
    if ($elapsed.TotalSeconds -gt $healthCheckTimeout) {
        Write-Error "Services failed to become healthy within timeout"
        docker-compose logs
        docker-compose down
        exit 1
    }
} while ($true)

# Function to run tests and capture results
function Run-TestSuite {
    param(
        [string]$TestName,
        [string]$TestCommand,
        [int]$TestTimeout
    )
    
    Write-Status "Running $TestName..."
    
    $job = Start-Job -ScriptBlock {
        param($cmd)
        Invoke-Expression $cmd
    } -ArgumentList $TestCommand
    
    $completed = Wait-Job -Job $job -Timeout $TestTimeout
    
    if ($completed) {
        $result = Receive-Job -Job $job
        Remove-Job -Job $job
        
        if ($job.State -eq "Completed") {
            Write-Success "$TestName completed successfully"
            return $true
        } else {
            Write-Error "$TestName failed"
            return $false
        }
    } else {
        Stop-Job -Job $job
        Remove-Job -Job $job
        Write-Error "$TestName timed out"
        return $false
    }
}

# Initialize test results
$TotalTests = 0
$PassedTests = 0
$FailedTests = 0

# Run tests based on type
switch ($Type) {
    { $_ -in @("all", "unit") } {
        # Unit Tests
        $TotalTests++
        $cmd = "docker-compose exec -T backend python -m pytest tests/test_inventory_regression.py tests/test_accounting_validation.py -v --tb=short --timeout=300"
        if (Run-TestSuite "Unit Tests" $cmd 900) {
            $PassedTests++
        } else {
            $FailedTests++
        }
        
        if ($Type -eq "unit") { break }
    }
    
    { $_ -in @("all", "integration") } {
        # Integration Tests
        $TotalTests++
        $cmd = "docker-compose exec -T backend python -m pytest tests/test_image_processing_comprehensive.py tests/test_qr_code_comprehensive.py -v --tb=short --timeout=300"
        if (Run-TestSuite "Integration Tests" $cmd 1200) {
            $PassedTests++
        } else {
            $FailedTests++
        }
        
        if ($Type -eq "integration") { break }
    }
    
    { $_ -in @("all", "e2e") } {
        # End-to-End Tests
        $TotalTests++
        $cmd = "docker-compose exec -T backend python -m pytest tests/test_inventory_workflow_e2e.py tests/test_invoice_workflow_e2e.py -v --tb=short --timeout=300"
        if (Run-TestSuite "End-to-End Tests" $cmd 1800) {
            $PassedTests++
        } else {
            $FailedTests++
        }
        
        # Frontend Tests
        $TotalTests++
        $cmd = "docker-compose exec -T frontend npm test -- --watchAll=false --testTimeout=120000"
        if (Run-TestSuite "Frontend Tests" $cmd 900) {
            $PassedTests++
        } else {
            $FailedTests++
        }
        
        if ($Type -eq "e2e") { break }
    }
    
    { $_ -in @("all", "load") } {
        # Load Tests
        $TotalTests++
        $cmd = "docker-compose exec -T backend python tests/test_load_performance.py"
        if (Run-TestSuite "Load Tests" $cmd 1800) {
            $PassedTests++
        } else {
            $FailedTests++
        }
        
        if ($Type -eq "load") { break }
    }
    
    { $_ -in @("all", "performance") } {
        # Performance Tests
        $TotalTests++
        $cmd = "docker-compose exec -T backend python tests/test_performance_comprehensive.py"
        if (Run-TestSuite "Performance Tests" $cmd 1800) {
            $PassedTests++
        } else {
            $FailedTests++
        }
        
        if ($Type -eq "performance") { break }
    }
}

# Generate coverage report
Write-Status "Generating coverage report..."
docker-compose exec -T backend python -m coverage combine 2>$null
docker-compose exec -T backend python -m coverage report --format=json > test_results/backend_coverage.json 2>$null
docker-compose exec -T backend python -m coverage html -d test_results/coverage_html 2>$null

# Get frontend coverage if available
docker-compose exec -T frontend cat coverage/coverage-summary.json > test_results/frontend_coverage.json 2>$null

# Calculate success rate
if ($TotalTests -gt 0) {
    $SuccessRate = [math]::Round(($PassedTests * 100) / $TotalTests)
} else {
    $SuccessRate = 0
}

# Print final results
Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "🏁 COMPREHENSIVE TEST RESULTS" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "Total Test Suites: $TotalTests"
Write-Host "Passed: $PassedTests"
Write-Host "Failed: $FailedTests"
Write-Host "Success Rate: $SuccessRate%"
Write-Host ""

# Cleanup
Write-Status "Cleaning up test environment..."
docker-compose down

# Determine exit code
if ($SuccessRate -ge 80) {
    Write-Success "🎉 COMPREHENSIVE TESTS PASSED (Success Rate: $SuccessRate%)"
    Write-Host "Test results saved to test_results/ directory"
    exit 0
} else {
    Write-Error "💥 COMPREHENSIVE TESTS FAILED (Success Rate: $SuccessRate%)"
    Write-Host "Test results saved to test_results/ directory"
    Write-Host "Check the logs above for details on failed tests"
    exit 1
}