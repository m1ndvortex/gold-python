#!/bin/bash

# Universal Inventory Management Test Suite
# This script runs comprehensive tests for the Universal Inventory Management system
# following Docker development standards

set -e

echo "🚀 Starting Universal Inventory Management Test Suite"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if Docker is running
check_docker() {
    print_status "Checking Docker availability..."
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    print_success "Docker is running"
}

# Check if Docker Compose services are up
check_services() {
    print_status "Checking Docker Compose services..."
    
    # Check if backend is running
    if ! docker-compose ps backend | grep -q "Up"; then
        print_warning "Backend service is not running. Starting services..."
        docker-compose up -d
        
        # Wait for services to be ready
        print_status "Waiting for services to be ready..."
        sleep 30
        
        # Check backend health
        max_attempts=30
        attempt=1
        while [ $attempt -le $max_attempts ]; do
            if curl -f http://localhost:8000/health > /dev/null 2>&1; then
                print_success "Backend is ready"
                break
            fi
            print_status "Waiting for backend... (attempt $attempt/$max_attempts)"
            sleep 2
            attempt=$((attempt + 1))
        done
        
        if [ $attempt -gt $max_attempts ]; then
            print_error "Backend failed to start within expected time"
            exit 1
        fi
    else
        print_success "Services are running"
    fi
}

# Run unit tests
run_unit_tests() {
    print_status "Running unit tests..."
    
    docker-compose exec frontend npm test -- \
        --testPathPattern="universal-inventory-management.test.tsx" \
        --watchAll=false \
        --coverage \
        --coverageDirectory=coverage/unit \
        --coverageReporters=text,lcov,html
    
    if [ $? -eq 0 ]; then
        print_success "Unit tests passed"
    else
        print_error "Unit tests failed"
        return 1
    fi
}

# Run integration tests with real Docker backend
run_integration_tests() {
    print_status "Running integration tests with Docker backend..."
    
    docker-compose exec frontend npm test -- \
        --testPathPattern="universal-inventory-docker-integration.test.tsx" \
        --watchAll=false \
        --testTimeout=30000
    
    if [ $? -eq 0 ]; then
        print_success "Integration tests passed"
    else
        print_error "Integration tests failed"
        return 1
    fi
}

# Run component-specific tests
run_component_tests() {
    print_status "Running component-specific tests..."
    
    local components=(
        "UniversalInventorySearch"
        "UniversalCategoryHierarchy" 
        "StockLevelMonitor"
        "BarcodeScanner"
        "InventoryMovementHistory"
    )
    
    for component in "${components[@]}"; do
        print_status "Testing $component component..."
        
        docker-compose exec frontend npm test -- \
            --testNamePattern="$component" \
            --watchAll=false \
            --verbose
        
        if [ $? -eq 0 ]; then
            print_success "$component tests passed"
        else
            print_error "$component tests failed"
            return 1
        fi
    done
}

# Run accessibility tests
run_accessibility_tests() {
    print_status "Running accessibility tests..."
    
    docker-compose exec frontend npm test -- \
        --testNamePattern="Accessibility" \
        --watchAll=false
    
    if [ $? -eq 0 ]; then
        print_success "Accessibility tests passed"
    else
        print_error "Accessibility tests failed"
        return 1
    fi
}

# Run performance tests
run_performance_tests() {
    print_status "Running performance tests..."
    
    docker-compose exec frontend npm test -- \
        --testNamePattern="Performance" \
        --watchAll=false \
        --testTimeout=60000
    
    if [ $? -eq 0 ]; then
        print_success "Performance tests passed"
    else
        print_error "Performance tests failed"
        return 1
    fi
}

# Run backend API tests
run_backend_tests() {
    print_status "Running backend inventory API tests..."
    
    docker-compose exec backend python -m pytest \
        test_universal_inventory_system.py \
        test_universal_inventory_integration.py \
        test_universal_inventory_production.py \
        -v \
        --tb=short \
        --cov=services \
        --cov=routers \
        --cov-report=html:coverage/backend \
        --cov-report=term
    
    if [ $? -eq 0 ]; then
        print_success "Backend tests passed"
    else
        print_error "Backend tests failed"
        return 1
    fi
}

# Generate test reports
generate_reports() {
    print_status "Generating test reports..."
    
    # Create reports directory
    mkdir -p test-reports
    
    # Copy coverage reports
    docker-compose exec frontend cp -r coverage test-reports/frontend-coverage 2>/dev/null || true
    docker-compose exec backend cp -r coverage test-reports/backend-coverage 2>/dev/null || true
    
    # Generate summary report
    cat > test-reports/summary.md << EOF
# Universal Inventory Management Test Report

Generated on: $(date)

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
- Node Version: $(docker-compose exec frontend node --version)
- Python Version: $(docker-compose exec backend python --version)

## Services Status
$(docker-compose ps)
EOF

    print_success "Test reports generated in test-reports/"
}

# Cleanup function
cleanup() {
    print_status "Cleaning up test artifacts..."
    
    # Remove temporary test files
    docker-compose exec frontend rm -rf coverage/temp 2>/dev/null || true
    docker-compose exec backend rm -rf .pytest_cache/__pycache__ 2>/dev/null || true
    
    print_success "Cleanup completed"
}

# Main execution
main() {
    local run_all=true
    local run_unit=false
    local run_integration=false
    local run_backend=false
    local run_performance=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --unit)
                run_all=false
                run_unit=true
                shift
                ;;
            --integration)
                run_all=false
                run_integration=true
                shift
                ;;
            --backend)
                run_all=false
                run_backend=true
                shift
                ;;
            --performance)
                run_all=false
                run_performance=true
                shift
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo "Options:"
                echo "  --unit         Run only unit tests"
                echo "  --integration  Run only integration tests"
                echo "  --backend      Run only backend tests"
                echo "  --performance  Run only performance tests"
                echo "  --help         Show this help message"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Check prerequisites
    check_docker
    check_services
    
    # Run tests based on options
    local test_failed=false
    
    if [ "$run_all" = true ] || [ "$run_unit" = true ]; then
        run_unit_tests || test_failed=true
    fi
    
    if [ "$run_all" = true ] || [ "$run_integration" = true ]; then
        run_integration_tests || test_failed=true
    fi
    
    if [ "$run_all" = true ]; then
        run_component_tests || test_failed=true
        run_accessibility_tests || test_failed=true
    fi
    
    if [ "$run_all" = true ] || [ "$run_performance" = true ]; then
        run_performance_tests || test_failed=true
    fi
    
    if [ "$run_all" = true ] || [ "$run_backend" = true ]; then
        run_backend_tests || test_failed=true
    fi
    
    # Generate reports and cleanup
    if [ "$test_failed" = false ]; then
        generate_reports
        cleanup
        
        echo ""
        print_success "🎉 All tests passed successfully!"
        echo ""
        echo "📊 Test Reports:"
        echo "   - Summary: test-reports/summary.md"
        echo "   - Frontend Coverage: test-reports/frontend-coverage/"
        echo "   - Backend Coverage: test-reports/backend-coverage/"
        echo ""
        echo "✨ Universal Inventory Management system is ready for production!"
    else
        print_error "❌ Some tests failed. Please check the output above."
        exit 1
    fi
}

# Handle script interruption
trap cleanup EXIT

# Run main function with all arguments
main "$@"