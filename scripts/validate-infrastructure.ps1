# Infrastructure Validation Script (PowerShell)
# Validates that all infrastructure components are properly configured

$ValidationsPassed = 0
$ValidationsFailed = 0

function Test-Component {
    param(
        [string]$Component,
        [string]$Path,
        [string]$Description
    )
    
    Write-Host "Validating: $Component - $Description" -ForegroundColor Cyan
    
    if (Test-Path $Path) {
        Write-Host "SUCCESS: $Component validation passed" -ForegroundColor Green
        $script:ValidationsPassed++
        return $true
    } else {
        Write-Host "ERROR: $Component validation failed" -ForegroundColor Red
        $script:ValidationsFailed++
        return $false
    }
}

Write-Host "Starting infrastructure validation..." -ForegroundColor Cyan
Write-Host ""

# Validate Docker Compose files
Write-Host "=== Docker Compose Configuration ===" -ForegroundColor Yellow
Test-Component "Development Compose" "docker-compose.yml" "Development compose file exists"
Test-Component "Production Compose" "docker-compose.prod.yml" "Production compose file exists"
Test-Component "Test Compose" "docker-compose.test.yml" "Test compose file exists"
Write-Host ""

# Validate Nginx configuration
Write-Host "=== Nginx Configuration ===" -ForegroundColor Yellow
Test-Component "Nginx Config" "nginx/nginx.conf" "Nginx configuration file exists"
Test-Component "Nginx Dockerfile" "nginx/Dockerfile" "Nginx Dockerfile exists"
Test-Component "SSL Script" "nginx/generate-ssl.sh" "SSL generation script exists"
Write-Host ""

# Validate database schema
Write-Host "=== Database Configuration ===" -ForegroundColor Yellow
Test-Component "Schema Extension" "backend/database_schema_extension.sql" "Database schema extension exists"
Test-Component "Init Script" "backend/init.sql" "Database initialization script exists"
Write-Host ""

# Validate Redis configuration
Write-Host "=== Redis Configuration ===" -ForegroundColor Yellow
Test-Component "Redis Config" "redis/redis.conf" "Redis configuration file exists"
Write-Host ""

# Validate backup system
Write-Host "=== Backup System ===" -ForegroundColor Yellow
Test-Component "Backup Script" "scripts/backup.sh" "Backup script exists"
Test-Component "Backup Directory" "backups" "Backup directory exists"
Test-Component "Backup Cron" "scripts/backup-cron" "Backup cron configuration exists"
Write-Host ""

# Validate monitoring
Write-Host "=== Monitoring Configuration ===" -ForegroundColor Yellow
Test-Component "Prometheus Config" "monitoring/prometheus.yml" "Prometheus configuration exists"
Test-Component "Alert Rules" "monitoring/alert_rules.yml" "Alert rules configuration exists"
Write-Host ""

# Validate logging
Write-Host "=== Logging Configuration ===" -ForegroundColor Yellow
Test-Component "Fluentd Config" "logging/fluentd.conf" "Fluentd configuration exists"
Test-Component "Log Directories" "logs" "Log directories exist"
Write-Host ""

# Validate secrets
Write-Host "=== Secrets Management ===" -ForegroundColor Yellow
Test-Component "Secrets Directory" "secrets" "Secrets directory exists"
Test-Component "Secrets README" "secrets/README.md" "Secrets documentation exists"
Test-Component "Secrets Gitignore" "secrets/.gitignore" "Secrets gitignore exists"
Write-Host ""

# Validate scripts
Write-Host "=== Deployment Scripts ===" -ForegroundColor Yellow
Test-Component "Deploy Script" "scripts/deploy.sh" "Deployment script exists"
Test-Component "Test Script" "scripts/test-infrastructure.sh" "Infrastructure test script exists"
Test-Component "Validation Script" "scripts/validate-infrastructure.ps1" "PowerShell validation script exists"
Write-Host ""

# Validate backend health checks
Write-Host "=== Backend Health Checks ===" -ForegroundColor Yellow
Test-Component "Health Checks Module" "backend/health_checks.py" "Health checks module exists"
Write-Host ""

# Validate infrastructure tests
Write-Host "=== Infrastructure Tests ===" -ForegroundColor Yellow
Test-Component "Infrastructure Tests" "tests/test_infrastructure.py" "Infrastructure test suite exists"
Write-Host ""

# Validate documentation
Write-Host "=== Documentation ===" -ForegroundColor Yellow
Test-Component "Infrastructure Docs" "INFRASTRUCTURE.md" "Infrastructure documentation exists"
Write-Host ""

# Summary
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Infrastructure Validation Summary" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

Write-Host "Validations Passed: $ValidationsPassed" -ForegroundColor Green

if ($ValidationsFailed -gt 0) {
    Write-Host "Validations Failed: $ValidationsFailed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Some infrastructure components are not properly configured." -ForegroundColor Red
    Write-Host "Please review the failed validations above and fix the issues." -ForegroundColor Red
    exit 1
} else {
    Write-Host ""
    Write-Host "All infrastructure validations passed!" -ForegroundColor Green
    Write-Host "Infrastructure is properly configured and ready for deployment." -ForegroundColor Green
}