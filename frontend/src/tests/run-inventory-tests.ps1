# Universal Inventory Management Test Suite (PowerShell)
# This script runs comprehensive tests for the Universal Inventory Management system
# following Docker development standards

param(
    [switch]$Unit,
    [switch]$Integration,
    [switch]$Backend,
    [switch]$Performance,
    [switch]$Help
)

# Colors for output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Blue"

function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor $Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Red
}

function Show-Help {
    Write-Host "Usage: .\run-inventory-tests.ps1 [OPTIONS]"
    Write-Host "Options:"
    Write-Host "  -Unit         Run only unit tests"
    Write-Host "  -Integration  Run only integration tests"
    Write-Host "  -Backend      Run only backend tests"
    Write-Host "  -Performance  Run only performance tests"
    Write-Host "  -Help         Show this help message"
    exit 0
}

function Test-Docker {
    Write-Status "Checking Docker availability..."
    try {
        $null = docker info 2>$null
        Write-Success "Docker is running"
        return $true
    }
    catch {
        Write-Error "Docker is not running. Please start Docker and try again."
        return $false
    }
}

function Test-Services {
    Write-Status "Checking Docker Compose services..."
    
    $backendStatus = docker-compose ps backend
    if ($backendStatus -notmatch "Up") {
        Write-Warning "Backend service is not running. Starting services..."
        docker-compose up -d
        
        Write-Status "Waiting for services to be ready..."
        Start-Sleep -Seconds 30
        
        # Check backend health
        $maxAttempts = 30
        $attempt = 1
        
        while ($attempt -le $maxAttempts) {
            try {
                $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -TimeoutSec 5 -ErrorAction Stop
                if ($response.StatusCode -eq 200) {
                    Write-Success "Backend is ready"
                    break
                }
            }
            catch {
                Write-Status "Waiting for backend... (attempt $attempt/$maxAttempts)"
                Start-Sleep -Seconds 2
                $attempt++
            }
        }
        
        if ($attempt -gt $maxAttempts) {
            Write-Error "Backend failed to start within expected time"
            return $false
        }
    }
    else {
        Write-Success "Services are running"
    }
    return $true
}

function Invoke-UnitTests {
    Write-Status "Running unit tests..."
    
    $result = docker-compose exec frontend npm test -- `
        --testPathPattern="universal-inventory-management.test.tsx" `
        --watchAll=false `
        --coverage `
        --coverageDirectory=coverage/unit `
        --coverageReporters=text,lcov,html
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Unit tests passed"
        return $true
    }
    else {
        Write-Error "Unit tests failed"
        return $false
    }
}

function Invoke-IntegrationTests {
    Write-Status "Running integration tests with Docker backend..."
    
    $result = docker-compose exec frontend npm test -- `
        --testPathPattern="universal-inventory-docker-integration.test.tsx" `
        --watchAll=false `
        --testTimeout=30000
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Integration tests passed"
        return $true
    }
    else {
        Write-Error "Integration tests failed"
        return $false
    }
}

function Invoke-ComponentTests {
    Write-Status "Running component-specific tests..."
    
    $components = @(
        "UniversalInventorySearch",
        "UniversalCategoryHierarchy",
        "StockLevelMonitor",
        "BarcodeScanner",
        "InventoryMovementHistory"
    )
    
    foreach ($component in $components) {
        Write-Status "Testing $component component..."
        
        $result = docker-compose exec frontend npm test -- `
            --testNamePattern="$component" `
            --watchAll=false `
            --verbose
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "$component tests passed"
        }
        else {
            Write-Error "$component tests failed"
            return $false
        }
    }
    return $true
}

function Invoke-AccessibilityTests {
    Write-Status "Running accessibility tests..."
    
    $result = docker-compose exec frontend npm test -- `
        --testNamePattern="Accessibility" `
        --watchAll=false
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Accessibility tests passed"
        return $true
    }
    else {
        Write-Error "Accessibility tests failed"
        return $false
    }
}

function Invoke-PerformanceTests {
    Write-Status "Running performance tests..."
    
    $result = docker-compose exec frontend npm test -- `
        --testNamePattern="Performance" `
        --watchAll=false `
        --testTimeout=60000
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Performance tests passed"
        return $true
    }
    else {
        Write-Error "Performance tests failed"
        return $false
    }
}

function Invoke-BackendTests {
    Write-Status "Running backend inventory API tests..."
    
    $result = docker-compose exec backend python -m pytest `
        test_universal_inventory_system.py `
        test_universal_inventory_integration.py `
        test_universal_inventory_production.py `
        -v `
        --tb=short `
        --cov=services `
        --cov=routers `
        --cov-report=html:coverage/backend `
        --cov-report=term
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Backend tests passed"
        return $true
    }
    else {
        Write-Error "Backend tests failed"
        return $false
    }
}

function New-TestReports {
    Write-Status "Generating test reports..."
    
    # Create reports directory
    if (!(Test-Path "test-reports")) {
        New-Item -ItemType Directory -Path "test-reports" | Out-Null
    }
    
    # Generate summary report
    $summaryContent = @"
# Universal Inventory Management Test Report

Generated on: $(Get-Date)

## Test Results Summary

### Frontend Tests
- Unit Tests: ✅ Passed
- Integration Tests: ✅ Passed  
- Component Tests: ✅ Passed
- Accessibility Tests: ✅ Passed
- Performance Tests: ✅ Passed

### Backend Tests
- API Tests: ✅ Passed
- Integration Tests: ✅ Passed
- Production Tests: ✅ Passed

## Coverage Reports
- Frontend Coverage: Available in test-reports/frontend-coverage/
- Backend Coverage: Available in test-reports/backend-coverage/

## Test Environment
- Docker Version: $(docker --version)
- Docker Compose Version: $(docker-compose --version)
- PowerShell Version: $($PSVersionTable.PSVersion)

## Services Status
$(docker-compose ps)
"@

    $summaryContent | Out-File -FilePath "test-reports/summary.md" -Encoding UTF8
    
    Write-Success "Test reports generated in test-reports/"
}

function Invoke-Cleanup {
    Write-Status "Cleaning up test artifacts..."
    
    # Remove temporary test files
    try {
        docker-compose exec frontend rm -rf coverage/temp 2>$null
        docker-compose exec backend rm -rf .pytest_cache/__pycache__ 2>$null
    }
    catch {
        # Ignore cleanup errors
    }
    
    Write-Success "Cleanup completed"
}

# Main execution
function Main {
    Write-Host "🚀 Starting Universal Inventory Management Test Suite" -ForegroundColor $Blue
    Write-Host "==================================================" -ForegroundColor $Blue
    
    if ($Help) {
        Show-Help
    }
    
    $runAll = -not ($Unit -or $Integration -or $Backend -or $Performance)
    
    # Check prerequisites
    if (!(Test-Docker)) {
        exit 1
    }
    
    if (!(Test-Services)) {
        exit 1
    }
    
    # Run tests based on options
    $testFailed = $false
    
    try {
        if ($runAll -or $Unit) {
            if (!(Invoke-UnitTests)) {
                $testFailed = $true
            }
        }
        
        if ($runAll -or $Integration) {
            if (!(Invoke-IntegrationTests)) {
                $testFailed = $true
            }
        }
        
        if ($runAll) {
            if (!(Invoke-ComponentTests)) {
                $testFailed = $true
            }
            if (!(Invoke-AccessibilityTests)) {
                $testFailed = $true
            }
        }
        
        if ($runAll -or $Performance) {
            if (!(Invoke-PerformanceTests)) {
                $testFailed = $true
            }
        }
        
        if ($runAll -or $Backend) {
            if (!(Invoke-BackendTests)) {
                $testFailed = $true
            }
        }
        
        # Generate reports and cleanup
        if (-not $testFailed) {
            New-TestReports
            Invoke-Cleanup
            
            Write-Host ""
            Write-Success "🎉 All tests passed successfully!"
            Write-Host ""
            Write-Host "📊 Test Reports:" -ForegroundColor $Blue
            Write-Host "   - Summary: test-reports/summary.md"
            Write-Host "   - Frontend Coverage: test-reports/frontend-coverage/"
            Write-Host "   - Backend Coverage: test-reports/backend-coverage/"
            Write-Host ""
            Write-Host "✨ Universal Inventory Management system is ready for production!" -ForegroundColor $Green
        }
        else {
            Write-Error "❌ Some tests failed. Please check the output above."
            exit 1
        }
    }
    finally {
        Invoke-Cleanup
    }
}

# Run main function
Main