#!/bin/bash

# Comprehensive Double-Entry Accounting Tests Runner (Linux/macOS)
# This script runs comprehensive tests for the double-entry accounting system using real backend APIs in Docker

echo "🧮 Starting Comprehensive Double-Entry Accounting Tests..."
echo "🐳 Using Docker environment for real database testing"

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
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

print_status "Docker is running ✅"

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    print_error "docker-compose is not installed. Please install docker-compose and try again."
    exit 1
fi

print_status "docker-compose is available ✅"

# Navigate to project root (assuming script is in frontend/src/tests/)
cd "$(dirname "$0")/../../.."

# Check if docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    print_error "docker-compose.yml not found. Please run this script from the project root."
    exit 1
fi

print_status "Found docker-compose.yml ✅"

# Start the services
print_status "Starting Docker services..."
docker-compose up -d --build

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 10

# Check if backend is responding
print_status "Checking backend health..."
for i in {1..30}; do
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        print_success "Backend is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        print_error "Backend failed to start within timeout"
        docker-compose logs backend
        exit 1
    fi
    print_status "Waiting for backend... ($i/30)"
    sleep 2
done

# Check if frontend is ready
print_status "Checking frontend availability..."
for i in {1..15}; do
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        print_success "Frontend is ready!"
        break
    fi
    if [ $i -eq 15 ]; then
        print_warning "Frontend might not be ready, but continuing with tests..."
        break
    fi
    print_status "Waiting for frontend... ($i/15)"
    sleep 2
done

# Run the comprehensive accounting tests
print_status "Running comprehensive double-entry accounting tests..."

# Set environment variables for testing
export REACT_APP_API_URL="http://localhost:8000"
export REACT_APP_FRONTEND_URL="http://localhost:3000"
export NODE_ENV="test"

# Run the specific test file
docker-compose exec frontend npm test -- --testPathPattern=comprehensive-double-entry-accounting.test.tsx --watchAll=false --verbose --coverage

TEST_EXIT_CODE=$?

# Display test results
if [ $TEST_EXIT_CODE -eq 0 ]; then
    print_success "🎉 All comprehensive accounting tests passed!"
    print_success "✅ Double-entry accounting system is working correctly"
    print_success "✅ All components integrate properly with real database"
    print_success "✅ Financial calculations are accurate"
    print_success "✅ Data integrity is maintained"
else
    print_error "❌ Some tests failed. Check the output above for details."
fi

# Show service logs if tests failed
if [ $TEST_EXIT_CODE -ne 0 ]; then
    print_status "Showing recent service logs for debugging..."
    echo "=== Backend Logs ==="
    docker-compose logs --tail=50 backend
    echo "=== Database Logs ==="
    docker-compose logs --tail=20 db
fi

# Optional: Keep services running for manual testing
read -p "Keep Docker services running for manual testing? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Services are still running. You can:"
    print_status "- Access frontend at: http://localhost:3000"
    print_status "- Access backend API at: http://localhost:8000"
    print_status "- View API docs at: http://localhost:8000/docs"
    print_status "Run 'docker-compose down' to stop services when done."
else
    print_status "Stopping Docker services..."
    docker-compose down
    print_success "Services stopped."
fi

exit $TEST_EXIT_CODE