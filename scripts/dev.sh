#!/bin/bash
# Gold Shop Development Scripts

set -e

case "$1" in
    start)
        echo "🚀 Starting Gold Shop development environment..."
        docker-compose up -d
        echo "✅ Services started!"
        echo "Frontend: http://localhost:3000"
        echo "Backend API: http://localhost:8000"
        echo "API Docs: http://localhost:8000/docs"
        ;;
    stop)
        echo "🛑 Stopping Gold Shop development environment..."
        docker-compose down
        echo "✅ Services stopped!"
        ;;
    test)
        echo "🧪 Running all tests in Docker environment..."
        docker-compose -f docker-compose.test.yml up --build --abort-on-container-exit
        echo "✅ Tests completed!"
        ;;
    test-backend)
        echo "🧪 Running backend tests with main PostgreSQL database..."
        docker-compose up -d db backend
        docker-compose -f docker-compose.test.yml run --rm test-backend
        echo "✅ Backend tests completed!"
        ;;
    test-frontend)
        echo "🧪 Running frontend tests with main backend..."
        docker-compose up -d db backend
        docker-compose -f docker-compose.test.yml run --rm test-frontend
        echo "✅ Frontend tests completed!"
        ;;
    logs)
        echo "📋 Showing logs for all services..."
        docker-compose logs -f
        ;;
    clean)
        echo "🧹 Cleaning up Docker environment..."
        docker-compose down -v
        docker-compose -f docker-compose.test.yml down -v
        docker system prune -f
        echo "✅ Cleanup completed!"
        ;;
    *)
        echo "Usage: $0 {start|stop|test|test-backend|test-frontend|logs|clean}"
        echo ""
        echo "Commands:"
        echo "  start         - Start development environment"
        echo "  stop          - Stop development environment"
        echo "  test          - Run all tests"
        echo "  test-backend  - Run backend tests only"
        echo "  test-frontend - Run frontend tests only"
        echo "  logs          - Show service logs"
        echo "  clean         - Clean up Docker environment"
        exit 1
        ;;
esac