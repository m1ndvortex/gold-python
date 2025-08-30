#!/bin/bash
# Infrastructure Validation Script
# Validates that all infrastructure components are properly configured

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Validation results
VALIDATIONS_PASSED=0
VALIDATIONS_FAILED=0

# Function to validate a component
validate() {
    local component="$1"
    local check_command="$2"
    local description="$3"
    
    log "Validating: $component - $description"
    
    if eval "$check_command"; then
        success "✓ $component validation passed"
        ((VALIDATIONS_PASSED++))
        return 0
    else
        error "✗ $component validation failed"
        ((VALIDATIONS_FAILED++))
        return 1
    fi
}

log "Starting infrastructure validation..."
echo

# Validate Docker Compose files
log "=== Docker Compose Configuration ==="
validate "Development Compose" "[[ -f 'docker-compose.yml' ]]" "Development compose file exists"
validate "Production Compose" "[[ -f 'docker-compose.prod.yml' ]]" "Production compose file exists"
validate "Test Compose" "[[ -f 'docker-compose.test.yml' ]]" "Test compose file exists"
echo

# Validate Nginx configuration
log "=== Nginx Configuration ==="
validate "Nginx Config" "[[ -f 'nginx/nginx.conf' ]]" "Nginx configuration file exists"
validate "Nginx Dockerfile" "[[ -f 'nginx/Dockerfile' ]]" "Nginx Dockerfile exists"
validate "SSL Script" "[[ -f 'nginx/generate-ssl.sh' && -x 'nginx/generate-ssl.sh' ]]" "SSL generation script exists and is executable"
echo

# Validate database schema
log "=== Database Configuration ==="
validate "Schema Extension" "[[ -f 'backend/database_schema_extension.sql' ]]" "Database schema extension exists"
validate "Init Script" "[[ -f 'backend/init.sql' ]]" "Database initialization script exists"
echo

# Validate Redis configuration
log "=== Redis Configuration ==="
validate "Redis Config" "[[ -f 'redis/redis.conf' ]]" "Redis configuration file exists"
echo

# Validate backup system
log "=== Backup System ==="
validate "Backup Script" "[[ -f 'scripts/backup.sh' && -x 'scripts/backup.sh' ]]" "Backup script exists and is executable"
validate "Backup Directory" "[[ -d 'backups' ]]" "Backup directory exists"
validate "Backup Cron" "[[ -f 'scripts/backup-cron' ]]" "Backup cron configuration exists"
echo

# Validate monitoring
log "=== Monitoring Configuration ==="
validate "Prometheus Config" "[[ -f 'monitoring/prometheus.yml' ]]" "Prometheus configuration exists"
validate "Alert Rules" "[[ -f 'monitoring/alert_rules.yml' ]]" "Alert rules configuration exists"
echo

# Validate logging
log "=== Logging Configuration ==="
validate "Fluentd Config" "[[ -f 'logging/fluentd.conf' ]]" "Fluentd configuration exists"
validate "Log Directories" "[[ -d 'logs' ]]" "Log directories exist"
echo

# Validate secrets
log "=== Secrets Management ==="
validate "Secrets Directory" "[[ -d 'secrets' ]]" "Secrets directory exists"
validate "Secrets README" "[[ -f 'secrets/README.md' ]]" "Secrets documentation exists"
validate "Secrets Gitignore" "[[ -f 'secrets/.gitignore' ]]" "Secrets gitignore exists"
echo

# Validate scripts
log "=== Deployment Scripts ==="
validate "Deploy Script" "[[ -f 'scripts/deploy.sh' && -x 'scripts/deploy.sh' ]]" "Deployment script exists and is executable"
validate "Test Script" "[[ -f 'scripts/test-infrastructure.sh' && -x 'scripts/test-infrastructure.sh' ]]" "Infrastructure test script exists and is executable"
echo

# Validate backend health checks
log "=== Backend Health Checks ==="
validate "Health Checks Module" "[[ -f 'backend/health_checks.py' ]]" "Health checks module exists"
echo

# Validate infrastructure tests
log "=== Infrastructure Tests ==="
validate "Infrastructure Tests" "[[ -f 'tests/test_infrastructure.py' ]]" "Infrastructure test suite exists"
echo

# Validate documentation
log "=== Documentation ==="
validate "Infrastructure Docs" "[[ -f 'INFRASTRUCTURE.md' ]]" "Infrastructure documentation exists"
echo

# Check Docker Compose syntax
log "=== Docker Compose Syntax Validation ==="
if command -v docker-compose &> /dev/null; then
    validate "Dev Compose Syntax" "docker-compose -f docker-compose.yml config > /dev/null" "Development compose syntax is valid"
    validate "Prod Compose Syntax" "docker-compose -f docker-compose.prod.yml config > /dev/null" "Production compose syntax is valid"
else
    warning "Docker Compose not available, skipping syntax validation"
fi
echo

# Check file permissions
log "=== File Permissions ==="
if [[ -d "secrets" ]]; then
    secrets_perms=$(stat -c '%a' secrets 2>/dev/null || echo "755")
    validate "Secrets Permissions" "[[ '$secrets_perms' == '700' ]]" "Secrets directory has correct permissions (700)"
fi
echo

# Summary
echo "=================================="
log "Infrastructure Validation Summary"
echo "=================================="

success "Validations Passed: $VALIDATIONS_PASSED"

if [ $VALIDATIONS_FAILED -gt 0 ]; then
    error "Validations Failed: $VALIDATIONS_FAILED"
    echo
    error "Some infrastructure components are not properly configured."
    error "Please review the failed validations above and fix the issues."
    exit 1
else
    echo
    success "All infrastructure validations passed!"
    success "Infrastructure is properly configured and ready for deployment."
fi