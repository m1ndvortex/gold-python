#!/usr/bin/env python3
"""
Complete Database Reset Script for Gold Shop Management System
This script will:
1. Stop all Docker services
2. Remove database volumes
3. Recreate fresh database
4. Run all migrations
5. Seed initial data
6. Restart services

Usage: python reset_database_complete.py
"""

import subprocess
import sys
import time
import os
from pathlib import Path

def run_command(command, description, check=True, shell=True):
    """Run a command and handle errors"""
    print(f"\n🔄 {description}...")
    print(f"Command: {command}")
    
    try:
        if shell:
            result = subprocess.run(command, shell=True, capture_output=True, text=True, check=check)
        else:
            result = subprocess.run(command.split(), capture_output=True, text=True, check=check)
        
        if result.stdout:
            print(f"✅ Output: {result.stdout.strip()}")
        if result.stderr and result.returncode == 0:
            print(f"ℹ️  Info: {result.stderr.strip()}")
        
        return result
    except subprocess.CalledProcessError as e:
        print(f"❌ Error: {e}")
        if e.stdout:
            print(f"Stdout: {e.stdout}")
        if e.stderr:
            print(f"Stderr: {e.stderr}")
        if check:
            sys.exit(1)
        return e

def wait_for_service(service_name, max_attempts=30):
    """Wait for a Docker service to be healthy"""
    print(f"\n⏳ Waiting for {service_name} to be ready...")
    
    for attempt in range(max_attempts):
        try:
            result = subprocess.run(
                f"docker-compose ps {service_name}",
                shell=True, capture_output=True, text=True
            )
            
            if "healthy" in result.stdout or "Up" in result.stdout:
                print(f"✅ {service_name} is ready!")
                return True
                
        except Exception as e:
            pass
        
        print(f"⏳ Attempt {attempt + 1}/{max_attempts} - waiting for {service_name}...")
        time.sleep(2)
    
    print(f"❌ {service_name} failed to start within {max_attempts * 2} seconds")
    return False

def main():
    """Main function to reset database completely"""
    print("🚀 Starting Complete Database Reset for Gold Shop Management System")
    print("=" * 70)
    
    # Step 1: Stop all services
    run_command(
        "docker-compose down",
        "Stopping all Docker services"
    )
    
    # Step 2: Remove database volumes to ensure clean slate
    run_command(
        "docker volume rm python-gold_postgres_data",
        "Removing PostgreSQL data volume",
        check=False  # Don't fail if volume doesn't exist
    )
    
    run_command(
        "docker volume rm python-gold_redis_data",
        "Removing Redis data volume", 
        check=False  # Don't fail if volume doesn't exist
    )
    
    # Step 3: Remove any orphaned containers
    run_command(
        "docker-compose rm -f",
        "Removing any orphaned containers",
        check=False
    )
    
    # Step 4: Start database service first
    run_command(
        "docker-compose up -d db redis",
        "Starting database and Redis services"
    )
    
    # Step 5: Wait for database to be ready
    if not wait_for_service("db"):
        print("❌ Database failed to start. Exiting.")
        sys.exit(1)
    
    # Step 6: Build and start backend service
    run_command(
        "docker-compose up -d --build backend",
        "Building and starting backend service"
    )
    
    # Step 7: Wait for backend to be ready
    if not wait_for_service("backend"):
        print("❌ Backend failed to start. Exiting.")
        sys.exit(1)
    
    # Give backend a moment to fully initialize
    print("\n⏳ Waiting for backend to fully initialize...")
    time.sleep(10)
    
    # Step 8: Create fresh database tables
    run_command(
        "docker-compose exec -T backend python create_fresh_database.py",
        "Creating fresh database tables from models"
    )
    
    # Step 9: Initialize Alembic (mark current state as migrated)
    run_command(
        "docker-compose exec -T backend alembic stamp head",
        "Marking current database state as up-to-date with migrations"
    )
    
    # Step 10: Seed initial data
    run_command(
        "docker-compose exec -T backend python seed_data.py",
        "Seeding database with initial data"
    )
    
    # Step 11: Run comprehensive seed data if available
    if Path("backend/seed_comprehensive_data.py").exists():
        run_command(
            "docker-compose exec -T backend python seed_comprehensive_data.py",
            "Seeding comprehensive test data",
            check=False  # Don't fail if this doesn't exist
        )
    
    # Step 12: Start frontend service
    run_command(
        "docker-compose up -d --build frontend",
        "Building and starting frontend service"
    )
    
    # Step 13: Verify all services are running
    run_command(
        "docker-compose ps",
        "Checking status of all services"
    )
    
    # Step 14: Test database connection
    run_command(
        "docker-compose exec -T backend python -c \"from database import engine; print('Database connection test:', engine.execute('SELECT 1').scalar())\"",
        "Testing database connection",
        check=False
    )
    
    # Step 15: Show database tables
    run_command(
        "docker-compose exec -T db psql -U goldshop_user -d goldshop -c \"\\dt\"",
        "Listing all database tables"
    )
    
    print("\n" + "=" * 70)
    print("🎉 Database reset completed successfully!")
    print("\n📋 Summary:")
    print("   ✅ All Docker services stopped and cleaned")
    print("   ✅ Database volumes removed")
    print("   ✅ Fresh database created")
    print("   ✅ All tables created from models")
    print("   ✅ Migrations marked as current")
    print("   ✅ Initial data seeded")
    print("   ✅ All services restarted")
    
    print("\n🔗 Access URLs:")
    print("   Frontend: http://localhost:3000")
    print("   Backend API: http://localhost:8000")
    print("   API Docs: http://localhost:8000/docs")
    
    print("\n👤 Default Login Credentials:")
    print("   Username: admin")
    print("   Password: admin123")
    
    print("\n🔧 Additional Test Users:")
    print("   Manager: manager / manager123")
    print("   Accountant: accountant / accountant123") 
    print("   Cashier: cashier / cashier123")
    
    print("\n💡 Next Steps:")
    print("   1. Open http://localhost:3000 in your browser")
    print("   2. Login with admin credentials")
    print("   3. Verify all functionality is working")
    print("   4. Add your custom data as needed")

if __name__ == "__main__":
    main()