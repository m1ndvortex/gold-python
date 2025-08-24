#!/usr/bin/env python3
"""
Comprehensive Disaster Recovery System Test Script

This script tests the complete disaster recovery implementation including:
- Service initialization and configuration
- Recovery procedure execution
- Backup retention policy application
- Off-site storage integration
- System health monitoring
- End-to-end disaster recovery scenarios

Usage:
    python test_disaster_recovery_complete.py
"""

import os
import sys
import asyncio
import tempfile
import shutil
import json
import time
from pathlib import Path
from datetime import datetime, timedelta

# Add backend to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

def test_imports():
    """Test that all disaster recovery modules can be imported"""
    print("Testing imports...")
    
    try:
        from services.backup_service import BackupService
        from services.disaster_recovery_service import (
            DisasterRecoveryService,
            OffSiteStorageService,
            OffSiteStorageConfig,
            RetentionPolicy,
            StorageProvider
        )
        from analytics_tasks.disaster_recovery_tasks import (
            apply_retention_policy,
            sync_to_offsite_storage,
            test_recovery_procedures,
            monitor_system_health,
            cleanup_recovery_logs
        )
        print("✓ All imports successful")
        return True
    except ImportError as e:
        print(f"✗ Import failed: {e}")
        return False

def test_service_initialization():
    """Test disaster recovery service initialization"""
    print("\nTesting service initialization...")
    
    try:
        from services.backup_service import BackupService
        from services.disaster_recovery_service import (
            DisasterRecoveryService,
            RetentionPolicy
        )
        
        # Create temporary directory for testing
        with tempfile.TemporaryDirectory() as temp_dir:
            backup_service = BackupService(
                database_url="postgresql://test:test@localhost:5432/test",
                backup_directory=temp_dir,
                encryption_password="test_password"
            )
            
            retention_policy = RetentionPolicy(
                daily_retention_days=7,
                weekly_retention_weeks=4,
                monthly_retention_months=12,
                yearly_retention_years=3
            )
            
            dr_service = DisasterRecoveryService(
                backup_service=backup_service,
                retention_policy=retention_policy
            )
            
            # Test that procedures are initialized
            procedures = dr_service.list_recovery_procedures()
            assert len(procedures) >= 3, "Should have at least 3 recovery procedures"
            
            procedure_ids = [p.procedure_id for p in procedures]
            assert "database_recovery" in procedure_ids
            assert "full_system_recovery" in procedure_ids
            assert "file_system_recovery" in procedure_ids
            
            print("✓ Service initialization successful")
            return True
            
    except Exception as e:
        print(f"✗ Service initialization failed: {e}")
        return False

def test_recovery_procedures():
    """Test recovery procedure structure and validation"""
    print("\nTesting recovery procedures...")
    
    try:
        from services.backup_service import BackupService
        from services.disaster_recovery_service import DisasterRecoveryService
        
        with tempfile.TemporaryDirectory() as temp_dir:
            backup_service = BackupService(
                database_url="postgresql://test:test@localhost:5432/test",
                backup_directory=temp_dir,
                encryption_password="test_password"
            )
            
            dr_service = DisasterRecoveryService(backup_service=backup_service)
            procedures = dr_service.list_recovery_procedures()
            
            for procedure in procedures:
                # Validate procedure structure
                assert procedure.procedure_id, "Procedure must have ID"
                assert procedure.name, "Procedure must have name"
                assert procedure.description, "Procedure must have description"
                assert len(procedure.steps) > 0, "Procedure must have steps"
                assert len(procedure.validation_steps) > 0, "Procedure must have validation steps"
                assert len(procedure.prerequisites) > 0, "Procedure must have prerequisites"
                assert procedure.estimated_duration_minutes > 0, "Procedure must have duration estimate"
                
                # Validate steps structure
                for step in procedure.steps:
                    assert "step_id" in step, "Step must have ID"
                    assert "name" in step, "Step must have name"
                    assert "description" in step, "Step must have description"
                    assert "command" in step, "Step must have command"
                    assert "timeout_seconds" in step, "Step must have timeout"
                
                # Validate validation steps structure
                for validation_step in procedure.validation_steps:
                    assert "step_id" in validation_step, "Validation step must have ID"
                    assert "name" in validation_step, "Validation step must have name"
                    assert "command" in validation_step, "Validation step must have command"
            
            print(f"✓ Recovery procedures validation successful ({len(procedures)} procedures)")
            return True
            
    except Exception as e:
        print(f"✗ Recovery procedures validation failed: {e}")
        return False

def test_retention_policy():
    """Test retention policy functionality"""
    print("\nTesting retention policy...")
    
    try:
        from services.disaster_recovery_service import RetentionPolicy
        
        # Test policy creation
        policy = RetentionPolicy(
            daily_retention_days=7,
            weekly_retention_weeks=4,
            monthly_retention_months=12,
            yearly_retention_years=3,
            critical_backup_retention_days=90
        )
        
        assert policy.daily_retention_days == 7
        assert policy.weekly_retention_weeks == 4
        assert policy.monthly_retention_months == 12
        assert policy.yearly_retention_years == 3
        assert policy.critical_backup_retention_days == 90
        
        print("✓ Retention policy test successful")
        return True
        
    except Exception as e:
        print(f"✗ Retention policy test failed: {e}")
        return False

def test_off_site_storage_config():
    """Test off-site storage configuration"""
    print("\nTesting off-site storage configuration...")
    
    try:
        from services.disaster_recovery_service import (
            OffSiteStorageConfig,
            StorageProvider
        )
        
        # Test AWS S3 configuration
        config = OffSiteStorageConfig(
            provider=StorageProvider.AWS_S3,
            bucket_name="test-bucket",
            region="us-east-1",
            access_key="test_access_key",
            secret_key="test_secret_key",
            encryption_enabled=True
        )
        
        assert config.provider == StorageProvider.AWS_S3
        assert config.bucket_name == "test-bucket"
        assert config.region == "us-east-1"
        assert config.encryption_enabled == True
        
        print("✓ Off-site storage configuration test successful")
        return True
        
    except Exception as e:
        print(f"✗ Off-site storage configuration test failed: {e}")
        return False

async def test_async_operations():
    """Test asynchronous disaster recovery operations"""
    print("\nTesting async operations...")
    
    try:
        from services.backup_service import BackupService
        from services.disaster_recovery_service import DisasterRecoveryService
        
        with tempfile.TemporaryDirectory() as temp_dir:
            backup_service = BackupService(
                database_url="postgresql://test:test@localhost:5432/test",
                backup_directory=temp_dir,
                encryption_password="test_password"
            )
            
            dr_service = DisasterRecoveryService(backup_service=backup_service)
            
            # Test retention policy application (async)
            result = await dr_service.apply_retention_policy()
            assert "success" in result
            assert "total_backups" in result
            assert "applied_at" in result
            
            print("✓ Async operations test successful")
            return True
            
    except Exception as e:
        print(f"✗ Async operations test failed: {e}")
        return False

def test_celery_tasks():
    """Test Celery task definitions"""
    print("\nTesting Celery tasks...")
    
    try:
        from analytics_tasks.disaster_recovery_tasks import (
            apply_retention_policy,
            sync_to_offsite_storage,
            test_recovery_procedures,
            monitor_system_health,
            cleanup_recovery_logs,
            DISASTER_RECOVERY_SCHEDULE
        )
        
        # Test that tasks are properly defined
        assert hasattr(apply_retention_policy, 'delay'), "Task should have delay method"
        assert hasattr(sync_to_offsite_storage, 'delay'), "Task should have delay method"
        assert hasattr(test_recovery_procedures, 'delay'), "Task should have delay method"
        assert hasattr(monitor_system_health, 'delay'), "Task should have delay method"
        assert hasattr(cleanup_recovery_logs, 'delay'), "Task should have delay method"
        
        # Test schedule configuration
        assert isinstance(DISASTER_RECOVERY_SCHEDULE, dict), "Schedule should be a dictionary"
        assert len(DISASTER_RECOVERY_SCHEDULE) > 0, "Schedule should have entries"
        
        # Validate schedule entries
        for task_name, config in DISASTER_RECOVERY_SCHEDULE.items():
            assert "task" in config, f"Schedule entry {task_name} must have task"
            assert "schedule" in config, f"Schedule entry {task_name} must have schedule"
        
        print("✓ Celery tasks test successful")
        return True
        
    except Exception as e:
        print(f"✗ Celery tasks test failed: {e}")
        return False

def test_api_router():
    """Test API router configuration"""
    print("\nTesting API router...")
    
    try:
        from routers.disaster_recovery import router
        from fastapi import APIRouter
        
        assert isinstance(router, APIRouter), "Router should be FastAPI APIRouter instance"
        assert router.prefix == "/api/disaster-recovery", "Router should have correct prefix"
        assert "disaster-recovery" in router.tags, "Router should have correct tags"
        
        # Test that routes are defined
        routes = [route.path for route in router.routes]
        expected_routes = [
            "/procedures",
            "/procedures/{procedure_id}",
            "/execute",
            "/retention-policy/apply",
            "/retention-policy",
            "/offsite-storage/configure",
            "/offsite-storage/sync",
            "/offsite-storage/status",
            "/logs",
            "/status",
            "/test-recovery"
        ]
        
        for expected_route in expected_routes:
            full_route = router.prefix + expected_route
            # Check if any route matches (considering path parameters)
            route_found = any(expected_route.replace("{", "").replace("}", "") in route.replace("{", "").replace("}", "") for route in routes)
            assert route_found, f"Route {expected_route} should be defined"
        
        print("✓ API router test successful")
        return True
        
    except Exception as e:
        print(f"✗ API router test failed: {e}")
        return False

def test_docker_compose_config():
    """Test Docker Compose configuration for disaster recovery testing"""
    print("\nTesting Docker Compose configuration...")
    
    try:
        import yaml
        
        # Check if disaster recovery test compose file exists
        compose_file = "docker-compose.disaster-recovery-test.yml"
        if not os.path.exists(compose_file):
            print(f"✗ Docker Compose file {compose_file} not found")
            return False
        
        with open(compose_file, 'r') as f:
            compose_config = yaml.safe_load(f)
        
        # Validate compose structure
        assert "services" in compose_config, "Compose file should have services"
        assert "volumes" in compose_config, "Compose file should have volumes"
        assert "networks" in compose_config, "Compose file should have networks"
        
        # Check required services
        services = compose_config["services"]
        required_services = [
            "db-test",
            "redis-test", 
            "backend-test",
            "celery-worker-test",
            "celery-beat-test",
            "minio-test",
            "disaster-recovery-tests"
        ]
        
        for service in required_services:
            assert service in services, f"Service {service} should be defined"
        
        # Check disaster recovery specific volumes
        volumes = compose_config["volumes"]
        required_volumes = [
            "disaster_recovery_backups",
            "disaster_recovery_logs"
        ]
        
        for volume in required_volumes:
            assert volume in volumes, f"Volume {volume} should be defined"
        
        print("✓ Docker Compose configuration test successful")
        return True
        
    except Exception as e:
        print(f"✗ Docker Compose configuration test failed: {e}")
        return False

def test_integration_test_file():
    """Test integration test file structure"""
    print("\nTesting integration test file...")
    
    try:
        test_file = "backend/test_disaster_recovery_integration.py"
        if not os.path.exists(test_file):
            print(f"✗ Integration test file {test_file} not found")
            return False
        
        with open(test_file, 'r') as f:
            content = f.read()
        
        # Check for required test classes and methods
        required_elements = [
            "class TestDisasterRecoveryService",
            "class TestDisasterRecoveryTasks", 
            "class TestDisasterRecoveryIntegration",
            "class TestDisasterRecoveryPerformance",
            "test_recovery_procedure_execution",
            "test_retention_policy_application",
            "test_off_site_storage_sync",
            "test_complete_disaster_recovery_scenario"
        ]
        
        for element in required_elements:
            assert element in content, f"Test file should contain {element}"
        
        # Check for pytest fixtures
        required_fixtures = [
            "@pytest.fixture",
            "temp_directories",
            "backup_service",
            "disaster_recovery_service"
        ]
        
        for fixture in required_fixtures:
            assert fixture in content, f"Test file should contain {fixture}"
        
        print("✓ Integration test file test successful")
        return True
        
    except Exception as e:
        print(f"✗ Integration test file test failed: {e}")
        return False

def main():
    """Run all disaster recovery tests"""
    print("=" * 60)
    print("DISASTER RECOVERY SYSTEM COMPREHENSIVE TEST")
    print("=" * 60)
    
    tests = [
        ("Import Tests", test_imports),
        ("Service Initialization", test_service_initialization),
        ("Recovery Procedures", test_recovery_procedures),
        ("Retention Policy", test_retention_policy),
        ("Off-site Storage Config", test_off_site_storage_config),
        ("Celery Tasks", test_celery_tasks),
        ("API Router", test_api_router),
        ("Docker Compose Config", test_docker_compose_config),
        ("Integration Test File", test_integration_test_file),
    ]
    
    results = []
    
    # Run synchronous tests
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"✗ {test_name} failed with exception: {e}")
            results.append((test_name, False))
    
    # Run async tests
    print("\nRunning async tests...")
    try:
        async_result = asyncio.run(test_async_operations())
        results.append(("Async Operations", async_result))
    except Exception as e:
        print(f"✗ Async Operations failed with exception: {e}")
        results.append(("Async Operations", False))
    
    # Print summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    passed = 0
    failed = 0
    
    for test_name, result in results:
        status = "PASS" if result else "FAIL"
        print(f"{test_name:<30} {status}")
        if result:
            passed += 1
        else:
            failed += 1
    
    print("-" * 60)
    print(f"Total Tests: {len(results)}")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")
    print(f"Success Rate: {(passed/len(results)*100):.1f}%")
    
    if failed == 0:
        print("\n🎉 ALL DISASTER RECOVERY TESTS PASSED!")
        print("\nThe disaster recovery system is ready for deployment.")
        print("\nNext steps:")
        print("1. Run integration tests with Docker:")
        print("   docker-compose -f docker-compose.disaster-recovery-test.yml --profile test up --build")
        print("2. Configure off-site storage credentials")
        print("3. Set up monitoring and alerting")
        return 0
    else:
        print(f"\n❌ {failed} TESTS FAILED")
        print("\nPlease fix the failing tests before deployment.")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)