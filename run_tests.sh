#!/bin/bash

# Comprehensive Test Execution Script for Universal Inventory and Invoice Management System

set -e  # Exit on any error

echo "🚀 Starting Comprehensive Testing Framework"
echo "=============================================="

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
print_status "Checking Docker environment..."
if ! docker ps >/dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

print_success "Docker is running"

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    print_error "docker-compose is not installed. Please install docker-compose and try again."
    exit 1
fi

# Parse command line arguments
TEST_TYPE="all"
SKIP_BUILD=false
TIMEOUT=3600

while [[ $# -gt 0 ]]; do
    case $1 in
        --type)
            TEST_TYPE="$2"
            shift 2
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --timeout)
            TIMEOUT="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --type TYPE        Test type to run (all, unit, integration, e2e, load, performance)"
            echo "  --skip-build       Skip Docker image building"
            echo "  --timeout SECONDS  Test timeout in seconds (default: 3600)"
            echo "  --help             Show this help message"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

print_status "Test configuration:"
echo "  Test Type: $TEST_TYPE"
echo "  Skip Build: $SKIP_BUILD"
echo "  Timeout: $TIMEOUT seconds"

# Create test results directory
mkdir -p test_results

# Build Docker images if not skipping
if [ "$SKIP_BUILD" = false ]; then
    print_status "Building Docker images..."
    docker-compose build --no-cache
    print_success "Docker images built successfully"
else
    print_warning "Skipping Docker image build"
fi

# Start test environment
print_status "Starting test environment..."
docker-compose up -d

# Wait for services to be healthy
print_status "Waiting for services to be healthy..."
timeout 300 bash -c '
    while true; do
        if curl -f http://localhost:8000/health >/dev/null 2>&1; then
            echo "Backend is healthy"
            break
        fi
        echo "Waiting for backend..."
        sleep 5
    done
'

if [ $? -ne 0 ]; then
    print_error "Services failed to become healthy within timeout"
    docker-compose logs
    docker-compose down
    exit 1
fi

print_success "All services are healthy"

# Function to run tests and capture results
run_test_suite() {
    local test_name="$1"
    local test_command="$2"
    local test_timeout="$3"
    
    print_status "Running $test_name..."
    
    if timeout "$test_timeout" bash -c "$test_command"; then
        print_success "$test_name completed successfully"
        return 0
    else
        print_error "$test_name failed or timed out"
        return 1
    fi
}

# Initialize test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Run tests based on type
case $TEST_TYPE in
    "all"|"unit")
        if [ "$TEST_TYPE" = "all" ] || [ "$TEST_TYPE" = "unit" ]; then
            # Unit Tests
            TOTAL_TESTS=$((TOTAL_TESTS + 1))
            if run_test_suite "Unit Tests" \
                "docker-compose exec -T backend python -m pytest tests/test_inventory_regression.py tests/test_accounting_validation.py -v --tb=short --timeout=300" \
                900; then
                PASSED_TESTS=$((PASSED_TESTS + 1))
            else
                FAILED_TESTS=$((FAILED_TESTS + 1))
            fi
        fi
        ;&  # Fall through to next case
    
    "integration")
        if [ "$TEST_TYPE" = "all" ] || [ "$TEST_TYPE" = "integration" ]; then
            # Integration Tests
            TOTAL_TESTS=$((TOTAL_TESTS + 1))
            if run_test_suite "Integration Tests" \
                "docker-compose exec -T backend python -m pytest tests/test_image_processing_comprehensive.py tests/test_qr_code_comprehensive.py -v --tb=short --timeout=300" \
                1200; then
                PASSED_TESTS=$((PASSED_TESTS + 1))
            else
                FAILED_TESTS=$((FAILED_TESTS + 1))
            fi
        fi
        ;&  # Fall through to next case
    
    "e2e")
        if [ "$TEST_TYPE" = "all" ] || [ "$TEST_TYPE" = "e2e" ]; then
            # End-to-End Tests
            TOTAL_TESTS=$((TOTAL_TESTS + 1))
            if run_test_suite "End-to-End Tests" \
                "docker-compose exec -T backend python -m pytest tests/test_inventory_workflow_e2e.py tests/test_invoice_workflow_e2e.py -v --tb=short --timeout=300" \
                1800; then
                PASSED_TESTS=$((PASSED_TESTS + 1))
            else
                FAILED_TESTS=$((FAILED_TESTS + 1))
            fi
            
            # Frontend Tests
            TOTAL_TESTS=$((TOTAL_TESTS + 1))
            if run_test_suite "Frontend Tests" \
                "docker-compose -f docker-compose.test.yml exec -T frontend npm test -- --watchAll=false --testTimeout=120000" \
                900; then
                PASSED_TESTS=$((PASSED_TESTS + 1))
            else
                FAILED_TESTS=$((FAILED_TESTS + 1))
            fi
        fi
        ;&  # Fall through to next case
    
    "load")
        if [ "$TEST_TYPE" = "all" ] || [ "$TEST_TYPE" = "load" ]; then
            # Load Tests
            TOTAL_TESTS=$((TOTAL_TESTS + 1))
            if run_test_suite "Load Tests" \
                "docker-compose -f docker-compose.test.yml exec -T backend python tests/test_load_performance.py" \
                1800; then
                PASSED_TESTS=$((PASSED_TESTS + 1))
            else
                FAILED_TESTS=$((FAILED_TESTS + 1))
            fi
        fi
        ;&  # Fall through to next case
    
    "performance")
        if [ "$TEST_TYPE" = "all" ] || [ "$TEST_TYPE" = "performance" ]; then
            # Performance Tests
            TOTAL_TESTS=$((TOTAL_TESTS + 1))
            if run_test_suite "Performance Tests" \
                "docker-compose -f docker-compose.test.yml exec -T backend python tests/test_performance_comprehensive.py" \
                1800; then
                PASSED_TESTS=$((PASSED_TESTS + 1))
            else
                FAILED_TESTS=$((FAILED_TESTS + 1))
            fi
        fi
        ;;
esac

# Generate coverage report
print_status "Generating coverage report..."
docker-compose -f docker-compose.test.yml exec -T backend python -m coverage combine 2>/dev/null || true
docker-compose -f docker-compose.test.yml exec -T backend python -m coverage report --format=json > test_results/backend_coverage.json 2>/dev/null || true
docker-compose -f docker-compose.test.yml exec -T backend python -m coverage html -d test_results/coverage_html 2>/dev/null || true

# Get frontend coverage if available
docker-compose -f docker-compose.test.yml exec -T frontend cat coverage/coverage-summary.json > test_results/frontend_coverage.json 2>/dev/null || true

# Copy test results from containers
docker-compose -f docker-compose.test.yml exec -T backend find . -name "*.xml" -exec cp {} test_results/ \; 2>/dev/null || true
docker-compose -f docker-compose.test.yml exec -T backend find . -name "*coverage*.json" -exec cp {} test_results/ \; 2>/dev/null || true

# Calculate success rate
if [ $TOTAL_TESTS -gt 0 ]; then
    SUCCESS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
else
    SUCCESS_RATE=0
fi

# Print final results
echo ""
echo "=============================================="
echo "🏁 COMPREHENSIVE TEST RESULTS"
echo "=============================================="
echo "Total Test Suites: $TOTAL_TESTS"
echo "Passed: $PASSED_TESTS"
echo "Failed: $FAILED_TESTS"
echo "Success Rate: $SUCCESS_RATE%"
echo ""

# Cleanup
print_status "Cleaning up test environment..."
docker-compose -f docker-compose.test.yml down

# Determine exit code
if [ $SUCCESS_RATE -ge 80 ]; then
    print_success "🎉 COMPREHENSIVE TESTS PASSED (Success Rate: $SUCCESS_RATE%)"
    echo "Test results saved to test_results/ directory"
    exit 0
else
    print_error "💥 COMPREHENSIVE TESTS FAILED (Success Rate: $SUCCESS_RATE%)"
    echo "Test results saved to test_results/ directory"
    echo "Check the logs above for details on failed tests"
    exit 1
fi