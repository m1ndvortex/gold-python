# Gold Shop Development Scripts

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("start", "stop", "test", "test-backend", "test-frontend", "logs", "clean")]
    [string]$Command
)

switch ($Command) {
    "start" {
        Write-Host "🚀 Starting Gold Shop development environment..." -ForegroundColor Green
        docker-compose up -d
        Write-Host "Services started!" -ForegroundColor Green
        Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
        Write-Host "Backend API: http://localhost:8000" -ForegroundColor Cyan
        Write-Host "API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
    }
    "stop" {
        Write-Host "🛑 Stopping Gold Shop development environment..." -ForegroundColor Yellow
        docker-compose down
        Write-Host "Services stopped!" -ForegroundColor Green
    }
    "test" {
        Write-Host "🧪 Running all tests in Docker environment..." -ForegroundColor Blue
        docker-compose -f docker-compose.test.yml up --build --abort-on-container-exit
        Write-Host "Tests completed!" -ForegroundColor Green
    }
    "test-backend" {
        Write-Host "🧪 Running backend tests with main PostgreSQL database..." -ForegroundColor Blue
        docker-compose up -d db backend
        docker-compose -f docker-compose.test.yml run --rm test-backend
        Write-Host "Backend tests completed!" -ForegroundColor Green
    }
    "test-frontend" {
        Write-Host "🧪 Running frontend tests with main backend..." -ForegroundColor Blue
        docker-compose up -d db backend
        docker-compose -f docker-compose.test.yml run --rm test-frontend
        Write-Host "Frontend tests completed!" -ForegroundColor Green
    }
    "logs" {
        Write-Host "📋 Showing logs for all services..." -ForegroundColor Cyan
        docker-compose logs -f
    }
    "clean" {
        Write-Host "🧹 Cleaning up Docker environment..." -ForegroundColor Yellow
        docker-compose down -v
        docker-compose -f docker-compose.test.yml down -v
        docker system prune -f
        Write-Host "Cleanup completed!" -ForegroundColor Green
    }
}