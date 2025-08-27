#!/bin/bash

# OAuth2 Real Integration Test Runner
# This script runs comprehensive OAuth2 tests against real backend and database

echo "🚀 Starting OAuth2 Real Integration Tests"
echo "=========================================="

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
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

print_status "Docker is running ✓"

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    print_error "docker-compose is not installed or not in PATH"
    exit 1
fi

print_status "docker-compose is available ✓"

# Start the services if not already running
print_status "Starting Docker services..."
docker-compose up -d

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 10

# Check if backend is responding
print_status "Checking backend health..."
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        print_success "Backend is ready!"
        break
    elif curl -f http://localhost:8000/ > /dev/null 2>&1; then
        print_success "Backend is responding!"
        break
    else
        print_status "Backend not ready yet (attempt $attempt/$max_attempts)..."
        sleep 2
        ((attempt++))
    fi
done

if [ $attempt -gt $max_attempts ]; then
    print_error "Backend failed to start within timeout period"
    print_status "Checking backend logs..."
    docker-compose logs backend
    exit 1
fi

# Check if database is ready
print_status "Checking database connection..."
if docker-compose exec -T db pg_isready -U postgres > /dev/null 2>&1; then
    print_success "Database is ready!"
else
    print_warning "Database check failed, but continuing with tests..."
fi

# Check if frontend is ready
print_status "Checking frontend availability..."
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    print_success "Frontend is ready!"
else
    print_warning "Frontend not responding, but continuing with tests..."
fi

# Run the OAuth2 integration tests
print_status "Running OAuth2 Real Integration Tests..."
echo "=========================================="

# Set test environment variables
export NODE_ENV=test
export REACT_APP_API_URL=http://localhost:8000

# Run the tests with verbose output
docker-compose exec frontend npm test -- \
    --testPathPattern=oauth2-real-integration.test.tsx \
    --watchAll=false \
    --verbose \
    --runInBand \
    --detectOpenHandles \
    --forceExit \
    --testTimeout=60000

test_exit_code=$?

# Print test results
echo "=========================================="
if [ $test_exit_code -eq 0 ]; then
    print_success "All OAuth2 integration tests passed! 🎉"
else
    print_error "Some OAuth2 integration tests failed! ❌"
fi

# Show service logs if tests failed
if [ $test_exit_code -ne 0 ]; then
    print_status "Showing recent backend logs for debugging..."
    echo "----------------------------------------"
    docker-compose logs --tail=50 backend
    echo "----------------------------------------"
    
    print_status "Showing recent database logs for debugging..."
    echo "----------------------------------------"
    docker-compose logs --tail=20 db
    echo "----------------------------------------"
fi

# Optional: Keep services running for manual testing
read -p "Keep services running for manual testing? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Services are still running. You can:"
    echo "  - Frontend: http://localhost:3000"
    echo "  - Backend API: http://localhost:8000"
    echo "  - Backend Docs: http://localhost:8000/docs"
    echo ""
    echo "To stop services later, run: docker-compose down"
else
    print_status "Stopping Docker services..."
    docker-compose down
    print_success "Services stopped."
fi

exit $test_exit_code