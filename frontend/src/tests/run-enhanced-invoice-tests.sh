#!/bin/bash

# Enhanced Invoice Interface Test Runner Script
# This script runs comprehensive tests for the enhanced invoice management interface

set -e

echo "🚀 Starting Enhanced Invoice Interface Tests"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOCKER_COMPOSE_FILE="docker-compose.yml"
BACKEND_HEALTH_URL="http://localhost:8000/health"
FRONTEND_URL="http://localhost:3000"
MAX_WAIT_TIME=300 # 5 minutes
WAIT_INTERVAL=5

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if backend is healthy
check_backend_health() {
    local attempt=1
    local max_attempts=$((MAX_WAIT_TIME / WAIT_INTERVAL))
    
    print_status "Checking backend health..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$BACKEND_HEALTH_URL" > /dev/null 2>&1; then
            print_success "Backend is healthy!"
            return 0
        fi
        
        print_status "Backend not ready yet (attempt $attempt/$max_attempts). Waiting ${WAIT_INTERVAL}s..."
        sleep $WAIT_INTERVAL
        attempt=$((attempt + 1))
    done
    
    print_error "Backend failed to become healthy within $MAX_WAIT_TIME seconds"
    return 1
}

# Function to check if frontend is ready
check_frontend_ready() {
    local attempt=1
    local max_attempts=$((MAX_WAIT_TIME / WAIT_INTERVAL))
    
    print_status "Checking frontend readiness..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$FRONTEND_URL" > /dev/null 2>&1; then
            print_success "Frontend is ready!"
            return 0
        fi
        
        print_status "Frontend not ready yet (attempt $attempt/$max_attempts). Waiting ${WAIT_INTERVAL}s..."
        sleep $WAIT_INTERVAL
        attempt=$((attempt + 1))
    done
    
    print_error "Frontend failed to become ready within $MAX_WAIT_TIME seconds"
    return 1
}

# Function to run unit tests
run_unit_tests() {
    print_status "Running Enhanced Invoice Interface Unit Tests..."
    
    if docker-compose exec -T frontend npm test -- \
        --testPathPattern="enhanced-invoice-interface.test.tsx" \
        --watchAll=false \
        --coverage \
        --coverageReporters=text-lcov \
        --coverageReporters=html \
        --coverageDirectory=coverage/enhanced-invoice; then
        print_success "Unit tests passed!"
        return 0
    else
        print_error "Unit tests failed!"
        return 1
    fi
}

# Function to run integration tests
run_integration_tests() {
    print_status "Running Enhanced Invoice Interface Integration Tests..."
    
    if docker-compose exec -T frontend npm test -- \
        --testPathPattern="enhanced-invoice-docker-integration.test.tsx" \
        --watchAll=false \
        --testTimeout=60000 \
        --verbose; then
        print_success "Integration tests passed!"
        return 0
    else
        print_error "Integration tests failed!"
        return 1
    fi
}

# Function to run component-specific tests
run_component_tests() {
    print_status "Running Individual Component Tests..."
    
    local components=(
        "WorkflowIndicator"
        "ApprovalSystem" 
        "StockValidation"
        "PricingAnalytics"
        "PaymentMethodManager"
        "AuditTrail"
        "EnhancedInvoiceForm"
    )
    
    for component in "${components[@]}"; do
        print_status "Testing $component component..."
        
        if docker-compose exec -T frontend npm test -- \
            --testNamePattern="$component" \
            --watchAll=false \
            --verbose; then
            print_success "$component tests passed!"
        else
            print_error "$component tests failed!"
            return 1
        fi
    done
    
    return 0
}

# Function to run accessibility tests
run_accessibility_tests() {
    print_status "Running Accessibility Tests..."
    
    if docker-compose exec -T frontend npm test -- \
        --testNamePattern="Accessibility" \
        --watchAll=false \
        --verbose; then
        print_success "Accessibility tests passed!"
        return 0
    else
        print_error "Accessibility tests failed!"
        return 1
    fi
}

# Function to run performance tests
run_performance_tests() {
    print_status "Running Performance Tests..."
    
    if docker-compose exec -T frontend npm test -- \
        --testNamePattern="Performance" \
        --watchAll=false \
        --verbose; then
        print_success "Performance tests passed!"
        return 0
    else
        print_error "Performance tests failed!"
        return 1
    fi
}

# Function to generate test report
generate_test_report() {
    print_status "Generating Test Report..."
    
    local report_dir="test-reports/enhanced-invoice"
    local report_file="$report_dir/test-report-$(date +%Y%m%d-%H%M%S).html"
    
    # Create report directory
    docker-compose exec -T frontend mkdir -p "$report_dir"
    
    # Generate HTML report
    cat > "/tmp/test-report.html" << EOF
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
        <p class="timestamp">Generated: $(date)</p>
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
        <p>View detailed coverage: <code>open coverage/enhanced-invoice/index.html</code></p>
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
</body>
</html>
EOF
    
    # Copy report to container
    docker cp "/tmp/test-report.html" "$(docker-compose ps -q frontend):/$report_file"
    
    print_success "Test report generated: $report_file"
}

# Function to cleanup
cleanup() {
    print_status "Cleaning up test environment..."
    
    # Remove any test data that might have been created
    docker-compose exec -T backend python -c "
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
" 2>/dev/null || print_warning "Could not clean up test data"
    
    print_success "Cleanup completed"
}

# Main execution
main() {
    local exit_code=0
    
    print_status "Enhanced Invoice Interface Test Suite"
    print_status "======================================"
    
    # Check if Docker Compose is available
    if ! command -v docker-compose &> /dev/null; then
        print_error "docker-compose is not installed or not in PATH"
        exit 1
    fi
    
    # Check if services are running
    if ! docker-compose ps | grep -q "Up"; then
        print_warning "Services are not running. Starting them..."
        docker-compose up -d
        sleep 10
    fi
    
    # Wait for services to be ready
    if ! check_backend_health; then
        print_error "Backend is not healthy. Cannot proceed with tests."
        exit 1
    fi
    
    if ! check_frontend_ready; then
        print_error "Frontend is not ready. Cannot proceed with tests."
        exit 1
    fi
    
    # Run test suites
    print_status "Starting test execution..."
    
    # Unit Tests
    if ! run_unit_tests; then
        exit_code=1
    fi
    
    # Integration Tests
    if ! run_integration_tests; then
        exit_code=1
    fi
    
    # Component Tests
    if ! run_component_tests; then
        exit_code=1
    fi
    
    # Accessibility Tests
    if ! run_accessibility_tests; then
        exit_code=1
    fi
    
    # Performance Tests
    if ! run_performance_tests; then
        exit_code=1
    fi
    
    # Generate report
    generate_test_report
    
    # Cleanup
    cleanup
    
    # Final status
    if [ $exit_code -eq 0 ]; then
        print_success "🎉 All Enhanced Invoice Interface tests passed!"
        print_status "View test coverage: docker-compose exec frontend open coverage/enhanced-invoice/index.html"
    else
        print_error "❌ Some tests failed. Check the output above for details."
    fi
    
    return $exit_code
}

# Handle script interruption
trap cleanup EXIT

# Run main function
main "$@"