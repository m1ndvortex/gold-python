# Enhanced Invoice Interface Test Runner Script (PowerShell)
# This script runs comprehensive tests for the enhanced invoice management interface

param(
    [switch]$SkipIntegration,
    [switch]$SkipUnit,
    [switch]$SkipAccessibility,
    [switch]$SkipPerformance,
    [switch]$GenerateReport = $true,
    [string]$TestPattern = "*enhanced-invoice*"
)

# Configuration
$DOCKER_COMPOSE_FILE = "docker-compose.yml"
$BACKEND_HEALTH_URL = "http://localhost:8000/health"
$FRONTEND_URL = "http://localhost:3000"
$MAX_WAIT_TIME = 300 # 5 minutes
$WAIT_INTERVAL = 5

# Colors for output
$Colors = @{
    Red = "Red"
    Green = "Green"
    Yellow = "Yellow"
    Blue = "Blue"
    White = "White"
}

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $Colors.Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor $Colors.Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $Colors.Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Colors.Red
}

# Function to check if backend is healthy
function Test-BackendHealth {
    $attempt = 1
    $maxAttempts = [math]::Floor($MAX_WAIT_TIME / $WAIT_INTERVAL)
    
    Write-Status "Checking backend health..."
    
    while ($attempt -le $maxAttempts) {
        try {
            $response = Invoke-WebRequest -Uri $BACKEND_HEALTH_URL -Method Get -TimeoutSec 5 -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                Write-Success "Backend is healthy!"
                return $true
            }
        }
        catch {
            # Continue trying
        }
        
        Write-Status "Backend not ready yet (attempt $attempt/$maxAttempts). Waiting $WAIT_INTERVAL seconds..."
        Start-Sleep -Seconds $WAIT_INTERVAL
        $attempt++
    }
    
    Write-Error "Backend failed to become healthy within $MAX_WAIT_TIME seconds"
    return $false
}

# Function to check if frontend is ready
function Test-FrontendReady {
    $attempt = 1
    $maxAttempts = [math]::Floor($MAX_WAIT_TIME / $WAIT_INTERVAL)
    
    Write-Status "Checking frontend readiness..."
    
    while ($attempt -le $maxAttempts) {
        try {
            $response = Invoke-WebRequest -Uri $FRONTEND_URL -Method Get -TimeoutSec 5 -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                Write-Success "Frontend is ready!"
                return $true
            }
        }
        catch {
            # Continue trying
        }
        
        Write-Status "Frontend not ready yet (attempt $attempt/$maxAttempts). Waiting $WAIT_INTERVAL seconds..."
        Start-Sleep -Seconds $WAIT_INTERVAL
        $attempt++
    }
    
    Write-Error "Frontend failed to become ready within $MAX_WAIT_TIME seconds"
    return $false
}

# Function to run unit tests
function Invoke-UnitTests {
    Write-Status "Running Enhanced Invoice Interface Unit Tests..."
    
    $result = docker-compose exec -T frontend npm test -- `
        --testPathPattern="enhanced-invoice-interface.test.tsx" `
        --watchAll=false `
        --coverage `
        --coverageReporters=text-lcov `
        --coverageReporters=html `
        --coverageDirectory=coverage/enhanced-invoice
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Unit tests passed!"
        return $true
    } else {
        Write-Error "Unit tests failed!"
        return $false
    }
}

# Function to run integration tests
function Invoke-IntegrationTests {
    Write-Status "Running Enhanced Invoice Interface Integration Tests..."
    
    $result = docker-compose exec -T frontend npm test -- `
        --testPathPattern="enhanced-invoice-docker-integration.test.tsx" `
        --watchAll=false `
        --testTimeout=60000 `
        --verbose
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Integration tests passed!"
        return $true
    } else {
        Write-Error "Integration tests failed!"
        return $false
    }
}

# Function to run component-specific tests
function Invoke-ComponentTests {
    Write-Status "Running Individual Component Tests..."
    
    $components = @(
        "WorkflowIndicator",
        "ApprovalSystem", 
        "StockValidation",
        "PricingAnalytics",
        "PaymentMethodManager",
        "AuditTrail",
        "EnhancedInvoiceForm"
    )
    
    foreach ($component in $components) {
        Write-Status "Testing $component component..."
        
        $result = docker-compose exec -T frontend npm test -- `
            --testNamePattern="$component" `
            --watchAll=false `
            --verbose
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "$component tests passed!"
        } else {
            Write-Error "$component tests failed!"
            return $false
        }
    }
    
    return $true
}

# Function to run accessibility tests
function Invoke-AccessibilityTests {
    Write-Status "Running Accessibility Tests..."
    
    $result = docker-compose exec -T frontend npm test -- `
        --testNamePattern="Accessibility" `
        --watchAll=false `
        --verbose
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Accessibility tests passed!"
        return $true
    } else {
        Write-Error "Accessibility tests failed!"
        return $false
    }
}

# Function to run performance tests
function Invoke-PerformanceTests {
    Write-Status "Running Performance Tests..."
    
    $result = docker-compose exec -T frontend npm test -- `
        --testNamePattern="Performance" `
        --watchAll=false `
        --verbose
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Performance tests passed!"
        return $true
    } else {
        Write-Error "Performance tests failed!"
        return $false
    }
}

# Function to generate test report
function New-TestReport {
    Write-Status "Generating Test Report..."
    
    $reportDir = "test-reports/enhanced-invoice"
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $reportFile = "$reportDir/test-report-$timestamp.html"
    
    # Create report directory
    docker-compose exec -T frontend mkdir -p $reportDir
    
    # Generate HTML report
    $reportContent = @"
<!DOCTYPE html>
<html>
<head>
    <title>Enhanced Invoice Interface Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f0f0; padding: 20px; border-radius: 5px; }
        .section { margin: 20px 0; padding: 15px; border-left: 4px solid #007cba; }
        .success { border-left-color: #28a745; }
        .error { border-left-color: #dc3545; }
        .warning { border-left-color: #ffc107; }
        .timestamp { color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Enhanced Invoice Interface Test Report</h1>
        <p class="timestamp">Generated: $(Get-Date)</p>
        <p>Comprehensive test results for the enhanced invoice management interface</p>
    </div>
    
    <div class="section success">
        <h2>✅ Test Categories Completed</h2>
        <ul>
            <li>Unit Tests - Component functionality and logic</li>
            <li>Integration Tests - Real backend API integration</li>
            <li>Component Tests - Individual component validation</li>
            <li>Accessibility Tests - WCAG compliance</li>
            <li>Performance Tests - Load time and responsiveness</li>
        </ul>
    </div>
    
    <div class="section">
        <h2>📊 Test Coverage</h2>
        <p>Coverage reports available in: <code>coverage/enhanced-invoice/</code></p>
        <p>View detailed coverage: <code>start coverage/enhanced-invoice/index.html</code></p>
    </div>
    
    <div class="section">
        <h2>🔧 Components Tested</h2>
        <ul>
            <li><strong>WorkflowIndicator</strong> - Visual workflow stage display</li>
            <li><strong>ApprovalSystem</strong> - Role-based approval workflow</li>
            <li><strong>StockValidation</strong> - Real-time inventory validation</li>
            <li><strong>PricingAnalytics</strong> - Cost vs sale price analysis</li>
            <li><strong>PaymentMethodManager</strong> - Multiple payment methods</li>
            <li><strong>AuditTrail</strong> - Comprehensive change history</li>
            <li><strong>EnhancedInvoiceForm</strong> - Complete invoice interface</li>
        </ul>
    </div>
    
    <div class="section">
        <h2>🚀 Features Validated</h2>
        <ul>
            <li>Flexible invoice workflow (draft → approval → stock impact)</li>
            <li>Configurable approval system with role-based routing</li>
            <li>Automatic inventory deduction with real-time validation</li>
            <li>Cost vs sale price tracking for margin analysis</li>
            <li>Multiple tax rates, discounts, and pricing formulas</li>
            <li>Multiple payment methods with partial payment tracking</li>
            <li>Gold shop specific fields (سود and اجرت) with conditional display</li>
            <li>Comprehensive audit trail with change history visualization</li>
        </ul>
    </div>
    
    <div class="section">
        <h2>💻 System Information</h2>
        <ul>
            <li><strong>OS:</strong> $($env:OS)</li>
            <li><strong>PowerShell Version:</strong> $($PSVersionTable.PSVersion)</li>
            <li><strong>Test Runner:</strong> PowerShell Script</li>
            <li><strong>Docker Compose:</strong> $(docker-compose --version)</li>
        </ul>
    </div>
</body>
</html>
"@
    
    # Save report to temp file
    $tempFile = [System.IO.Path]::GetTempFileName() + ".html"
    $reportContent | Out-File -FilePath $tempFile -Encoding UTF8
    
    # Copy report to container
    $containerId = docker-compose ps -q frontend
    docker cp $tempFile "${containerId}:/$reportFile"
    
    # Clean up temp file
    Remove-Item $tempFile
    
    Write-Success "Test report generated: $reportFile"
}

# Function to cleanup
function Invoke-Cleanup {
    Write-Status "Cleaning up test environment..."
    
    # Remove any test data that might have been created
    $cleanupScript = @"
import sys
sys.path.append('/app')
from database import get_db
from models import Customer, InventoryItem, Category
from sqlalchemy.orm import Session

db = next(get_db())
try:
    # Clean up test data
    db.query(Customer).filter(Customer.name.like('%Test%Enhanced%')).delete()
    db.query(InventoryItem).filter(InventoryItem.name.like('%Test%Enhanced%')).delete()
    db.query(Category).filter(Category.name.like('%Test%Enhanced%')).delete()
    db.commit()
    print('Test data cleaned up successfully')
except Exception as e:
    print(f'Cleanup error: {e}')
    db.rollback()
finally:
    db.close()
"@
    
    try {
        docker-compose exec -T backend python -c $cleanupScript 2>$null
    }
    catch {
        Write-Warning "Could not clean up test data"
    }
    
    Write-Success "Cleanup completed"
}

# Main execution
function Main {
    $exitCode = 0
    
    Write-Status "Enhanced Invoice Interface Test Suite"
    Write-Status "======================================"
    
    # Check if Docker Compose is available
    if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
        Write-Error "docker-compose is not installed or not in PATH"
        exit 1
    }
    
    # Check if services are running
    $runningServices = docker-compose ps
    if (-not ($runningServices -match "Up")) {
        Write-Warning "Services are not running. Starting them..."
        docker-compose up -d
        Start-Sleep -Seconds 10
    }
    
    # Wait for services to be ready
    if (-not (Test-BackendHealth)) {
        Write-Error "Backend is not healthy. Cannot proceed with tests."
        exit 1
    }
    
    if (-not (Test-FrontendReady)) {
        Write-Error "Frontend is not ready. Cannot proceed with tests."
        exit 1
    }
    
    # Run test suites
    Write-Status "Starting test execution..."
    
    # Unit Tests
    if (-not $SkipUnit) {
        if (-not (Invoke-UnitTests)) {
            $exitCode = 1
        }
    }
    
    # Integration Tests
    if (-not $SkipIntegration) {
        if (-not (Invoke-IntegrationTests)) {
            $exitCode = 1
        }
    }
    
    # Component Tests
    if (-not (Invoke-ComponentTests)) {
        $exitCode = 1
    }
    
    # Accessibility Tests
    if (-not $SkipAccessibility) {
        if (-not (Invoke-AccessibilityTests)) {
            $exitCode = 1
        }
    }
    
    # Performance Tests
    if (-not $SkipPerformance) {
        if (-not (Invoke-PerformanceTests)) {
            $exitCode = 1
        }
    }
    
    # Generate report
    if ($GenerateReport) {
        New-TestReport
    }
    
    # Cleanup
    Invoke-Cleanup
    
    # Final status
    if ($exitCode -eq 0) {
        Write-Success "🎉 All Enhanced Invoice Interface tests passed!"
        Write-Status "View test coverage: docker-compose exec frontend start coverage/enhanced-invoice/index.html"
    } else {
        Write-Error "❌ Some tests failed. Check the output above for details."
    }
    
    exit $exitCode
}

# Handle script interruption
try {
    Main
}
finally {
    Invoke-Cleanup
}