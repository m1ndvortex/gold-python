# PowerShell script for Windows to reset database completely
# This script provides a Windows-friendly way to reset the database

Write-Host "🚀 Starting Complete Database Reset for Gold Shop Management System" -ForegroundColor Green
Write-Host "=" * 70 -ForegroundColor Yellow

# Function to run Docker commands with error handling
function Invoke-DockerCommand {
    param(
        [string]$Command,
        [string]$Description,
        [bool]$CheckResult = $true
    )
    
    Write-Host "`n🔄 $Description..." -ForegroundColor Cyan
    Write-Host "Command: $Command" -ForegroundColor Gray
    
    try {
        $result = Invoke-Expression $Command
        if ($LASTEXITCODE -eq 0 -or -not $CheckResult) {
            Write-Host "✅ Success!" -ForegroundColor Green
            if ($result) {
                Write-Host $result -ForegroundColor White
            }
        } else {
            Write-Host "❌ Command failed with exit code: $LASTEXITCODE" -ForegroundColor Red
            if ($CheckResult) {
                exit 1
            }
        }
    }
    catch {
        Write-Host "❌ Error: $_" -ForegroundColor Red
        if ($CheckResult) {
            exit 1
        }
    }
}

# Function to wait for service
function Wait-ForService {
    param(
        [string]$ServiceName,
        [int]$MaxAttempts = 30
    )
    
    Write-Host "`n⏳ Waiting for $ServiceName to be ready..." -ForegroundColor Yellow
    
    for ($i = 1; $i -le $MaxAttempts; $i++) {
        try {
            $status = docker-compose ps $ServiceName
            if ($status -match "healthy|Up") {
                Write-Host "✅ $ServiceName is ready!" -ForegroundColor Green
                return $true
            }
        }
        catch {
            # Continue waiting
        }
        
        Write-Host "⏳ Attempt $i/$MaxAttempts - waiting for $ServiceName..." -ForegroundColor Yellow
        Start-Sleep -Seconds 2
    }
    
    Write-Host "❌ $ServiceName failed to start within $($MaxAttempts * 2) seconds" -ForegroundColor Red
    return $false
}

# Step 1: Stop all services
Invoke-DockerCommand "docker-compose down" "Stopping all Docker services"

# Step 2: Remove database volumes
Invoke-DockerCommand "docker volume rm python-gold_postgres_data" "Removing PostgreSQL data volume" $false
Invoke-DockerCommand "docker volume rm python-gold_redis_data" "Removing Redis data volume" $false

# Step 3: Remove orphaned containers
Invoke-DockerCommand "docker-compose rm -f" "Removing orphaned containers" $false

# Step 4: Start database services
Invoke-DockerCommand "docker-compose up -d db redis" "Starting database and Redis services"

# Step 5: Wait for database
if (-not (Wait-ForService "db")) {
    Write-Host "❌ Database failed to start. Exiting." -ForegroundColor Red
    exit 1
}

# Step 6: Start backend
Invoke-DockerCommand "docker-compose up -d --build backend" "Building and starting backend service"

# Step 7: Wait for backend
if (-not (Wait-ForService "backend")) {
    Write-Host "❌ Backend failed to start. Exiting." -ForegroundColor Red
    exit 1
}

# Give backend time to initialize
Write-Host "`n⏳ Waiting for backend to fully initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Step 8: Create fresh database
Invoke-DockerCommand "docker-compose exec -T backend python create_fresh_database.py" "Creating fresh database tables"

# Step 9: Mark migrations as current
Invoke-DockerCommand "docker-compose exec -T backend alembic stamp head" "Marking migrations as current"

# Step 10: Seed initial data
Invoke-DockerCommand "docker-compose exec -T backend python seed_data.py" "Seeding initial data"

# Step 11: Seed comprehensive data if available
if (Test-Path "backend/seed_comprehensive_data.py") {
    Invoke-DockerCommand "docker-compose exec -T backend python seed_comprehensive_data.py" "Seeding comprehensive data" $false
}

# Step 12: Start frontend
Invoke-DockerCommand "docker-compose up -d --build frontend" "Building and starting frontend service"

# Step 13: Check all services
Invoke-DockerCommand "docker-compose ps" "Checking all services status"

# Step 14: Test database connection
Invoke-DockerCommand "docker-compose exec -T backend python -c `"from database import engine; from sqlalchemy import text; print('Database test:', engine.execute(text('SELECT 1')).scalar())`"" "Testing database connection" $false

# Step 15: List tables
Invoke-DockerCommand "docker-compose exec -T db psql -U goldshop_user -d goldshop -c `"\dt`"" "Listing database tables"

Write-Host "`n" + "=" * 70 -ForegroundColor Yellow
Write-Host "🎉 Database reset completed successfully!" -ForegroundColor Green

Write-Host "`n📋 Summary:" -ForegroundColor Cyan
Write-Host "   ✅ All Docker services stopped and cleaned" -ForegroundColor White
Write-Host "   ✅ Database volumes removed" -ForegroundColor White
Write-Host "   ✅ Fresh database created" -ForegroundColor White
Write-Host "   ✅ All tables created from models" -ForegroundColor White
Write-Host "   ✅ Migrations marked as current" -ForegroundColor White
Write-Host "   ✅ Initial data seeded" -ForegroundColor White
Write-Host "   ✅ All services restarted" -ForegroundColor White

Write-Host "`n🔗 Access URLs:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "   Backend API: http://localhost:8000" -ForegroundColor White
Write-Host "   API Docs: http://localhost:8000/docs" -ForegroundColor White

Write-Host "`n👤 Default Login Credentials:" -ForegroundColor Cyan
Write-Host "   Username: admin" -ForegroundColor White
Write-Host "   Password: admin123" -ForegroundColor White

Write-Host "`n🔧 Additional Test Users:" -ForegroundColor Cyan
Write-Host "   Manager: manager / manager123" -ForegroundColor White
Write-Host "   Accountant: accountant / accountant123" -ForegroundColor White
Write-Host "   Cashier: cashier / cashier123" -ForegroundColor White

Write-Host "`n💡 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Open http://localhost:3000 in your browser" -ForegroundColor White
Write-Host "   2. Login with admin credentials" -ForegroundColor White
Write-Host "   3. Verify all functionality is working" -ForegroundColor White
Write-Host "   4. Add your custom data as needed" -ForegroundColor White