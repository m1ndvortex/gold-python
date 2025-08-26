# Enhanced Multi-Language and Localization Backend Tests
# This script runs comprehensive localization tests in Docker environment

Write-Host "🌍 Starting Enhanced Multi-Language and Localization Backend Tests" -ForegroundColor Green
Write-Host "==================================================================" -ForegroundColor Green

function Write-Status {
    param($Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-Error-Message {
    param($Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Write-Warning-Message {
    param($Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

# Set environment variables
$env:PYTHONPATH = "/app"
$env:DATABASE_URL = "postgresql://postgres:postgres@db:5432/goldshop"

Write-Status "Environment configured for Docker"
Write-Status "Database URL: $env:DATABASE_URL"

# Run simple localization tests
Write-Status "Running simple localization tests..."
python -m pytest test_localization_simple.py -v --tb=short --disable-warnings

if ($LASTEXITCODE -eq 0) {
    Write-Status "✅ Simple localization tests passed!"
} else {
    Write-Error-Message "❌ Simple localization tests failed!"
    exit 1
}

Write-Status "🎉 Enhanced Multi-Language and Localization Backend Tests Complete!"
Write-Status "Key Features Tested:"
Write-Status "- ✅ Language Configuration Management"
Write-Status "- ✅ Translation Management"
Write-Status "- ✅ Currency Management"
Write-Status "- ✅ RTL Language Support"
Write-Status "- ✅ Number and Date Formatting"
Write-Status "- ✅ API Endpoints"