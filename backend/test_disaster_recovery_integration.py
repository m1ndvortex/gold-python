"""
Integration tests for disaster recovery system

This test suite validates the complete disaster recovery functionality including:
- Recovery procedure execution
- Backup retention policy application
- Off-site storage integration
- System restoration validation
- End-to-end disaster recovery scenarios
"""

import os
import pytest
import tempfile
import shutil
import json
import asyncio
from datetime import datetime, timedelta
from pathlib import Path
from unittest.mock import Mock, patch, AsyncMock

from services.backup_service import BackupService, BackupMetadata
from services.disaster_recovery_service import (
    DisasterRecoveryService,
    OffSiteStorageService,
    OffSiteStorageConfig,
    RetentionPolicy,
    StorageProvider,
    RecoveryStatus
)
from analytics_tasks.disaster_recovery_tasks import (
    apply_retention_policy,
    sync_to_offsite_storage,
    test_recovery_procedures,
    monitor_system_health,
    cleanup_recovery_logs
)

# Test configuration
TEST_DATABASE_URL = "postgresql://goldshop_user:goldshop_password@db:5432/goldshop_test"
TEST_BACKUP_DIR = "/tmp/test_backups"
TEST_RECOVERY_DIR = "/tmp/test_recovery"

@pytest.fixture
def temp_directories():
    """Create temporary directories for testing"""
    backup_dir = Path(TEST_BACKUP_DIR)
    recovery_dir = Path(TEST_RECOVERY_DIR)
    
    # Clean up and create directories
    if backup_dir.exists():
        shutil.rmtree(backup_dir)
    if recovery_dir.exists():
        shutil.rmtree(recovery_dir)
    
    backup_dir.mkdir(parents=True, exist_ok=True)
    recovery_dir.mkdir(parents=True, exist_ok=True)
    
    yield backup_dir, recovery_dir
    
    # Cleanup after tests
    if backup_dir.exists():
        shutil.rmtree(backup_dir)
    if recovery_dir.exists():
        shutil.rmtree(recovery_dir)

@pytest.fixture
def backup_service(temp_directories):
    """Create backup service for testing"""
    backup_dir, _ = temp_directories
    return BackupService(
        database_url=TEST_DATABASE_URL,
        backup_directory=str(backup_dir),
        encryption_password="test_password_123"
    )

@pytest.fixture
def mock_off_site_storage():
    """Create mock off-site storage service"""
    config = OffSiteStorageConfig(
        provider=StorageProvider.AWS_S3,
        bucket_name="test-backup-bucket",
        region="us-east-1",
        access_key="test_access_key",
        secret_key="test_secret_key",
        encryption_enabled=True
    )
    
    # Mock the storage service
    storage = Mock(spec=OffSiteStorageService)
    storage.config = config
    storage.upload_backup = AsyncMock(return_value=True)
    storage.download_backup = AsyncMock(return_value=True)
    storage.list_backups = AsyncMock(return_value=[])
    storage.delete_backup = AsyncMock(return_value=True)
    
    return storage

@pytest.fixture
def retention_policy():
    """Create test retention policy"""
    return RetentionPolicy(
        daily_retention_days=3,
        weekly_retention_weeks=2,
        monthly_retention_months=6,
        yearly_retention_years=2,
        critical_backup_retention_days=30
    )

@pytest.fixture
def disaster_recovery_service(backup_service, mock_off_site_storage, retention_policy):
    """Create disaster recovery service for testing"""
    return DisasterRecoveryService(
        backup_service=backup_service,
        off_site_storage=mock_off_site_storage,
        retention_policy=retention_policy
    )

class TestDisasterRecoveryService:
    """Test disaster recovery service functionality"""
    
    @pytest.mark.asyncio
    async def test_recovery_procedure_initialization(self, disaster_recovery_service):
        """Test that recovery procedures are properly initialized"""
        procedures = disaster_recovery_service.list_recovery_procedures()
        
        assert len(procedures) >= 3
        procedure_ids = [p.procedure_id for p in procedures]
        
        assert "database_recovery" in procedure_ids
        assert "full_system_recovery" in procedure_ids
        assert "file_system_recovery" in procedure_ids
        
        # Test procedure details
        db_procedure = next(p for p in procedures if p.procedure_id == "database_recovery")
        assert db_procedure.name == "Database Recovery"
        assert len(db_procedure.steps) > 0
        assert len(db_procedure.validation_steps) > 0
        assert len(db_procedure.prerequisites) > 0
    
    @pytest.mark.asyncio
    async def test_recovery_procedure_execution(self, disaster_recovery_service, backup_service):
        """Test recovery procedure execution"""
        # Create a test database backup first
        backup_result = backup_service.create_database_backup(
            database_name="goldshop_test",
            compress=True,
            encrypt=True
        )
        assert backup_result.success
        
        # Execute database recovery procedure
        with patch.object(disaster_recovery_service, '_execute_verification_command', 
                         return_value=True) as mock_verify:
            recovery_result = await disaster_recovery_service.execute_recovery_procedure(
                procedure_id="database_recovery",
                backup_id=backup_result.backup_id
            )
        
        assert recovery_result.success
        assert recovery_result.status in [RecoveryStatus.COMPLETED, RecoveryStatus.VALIDATED]
        assert recovery_result.steps_completed > 0
        assert recovery_result.duration_seconds > 0
        
        # Verify that verification commands were called
        assert mock_verify.call_count > 0
    
    @pytest.mark.asyncio
    async def test_database_recovery_procedure(self, disaster_recovery_service, backup_service):
        """Test database recovery procedure execution"""
        # Create a test database backup first
        backup_result = backup_service.create_database_backup(
            database_name="goldshop_test",
            compress=True,
            encrypt=True
        )
        assert backup_result.success
        
        # Execute database recovery procedure
        with patch.object(disaster_recovery_service, '_execute_verification_command', 
                         return_value=True) as mock_verify:
            recovery_result = await disaster_recovery_service.execute_recovery_procedure(
                procedure_id="database_recovery",
                backup_id=backup_result.backup_id
            )
        
        assert recovery_result.success
        assert recovery_result.status in [RecoveryStatus.COMPLETED, RecoveryStatus.VALIDATED]
        assert recovery_result.steps_completed > 0
        assert recovery_result.duration_seconds > 0
        
        # Verify that verification commands were called
        assert mock_verify.call_count > 0
    
    @pytest.mark.asyncio
    async def test_full_system_recovery_procedure(self, disaster_recovery_service, backup_service):
        """Test full system recovery procedure execution"""
        # Create test backups
        db_backup = backup_service.create_database_backup("goldshop_test")
        file_backup = backup_service.create_file_backup("/tmp/test_files")
        
        assert db_backup.success
        assert file_backup.success
        
        # Execute full system recovery procedure
        with patch.object(disaster_recovery_service, '_execute_verification_command', 
                         return_value=True):
            recovery_result = await disaster_recovery_service.execute_recovery_procedure(
                procedure_id="full_system_recovery"
            )
        
        assert recovery_result.success
        assert recovery_result.procedure_id == "full_system_recovery"
        assert recovery_result.steps_completed > 0
    
    @pytest.mark.asyncio
    async def test_recovery_procedure_failure_handling(self, disaster_recovery_service):
        """Test recovery procedure failure handling"""
        # Test with non-existent procedure
        recovery_result = await disaster_recovery_service.execute_recovery_procedure(
            procedure_id="non_existent_procedure"
        )
        
        assert not recovery_result.success
        assert recovery_result.status == RecoveryStatus.FAILED
        assert "not found" in recovery_result.error_message.lower()
    
    @pytest.mark.asyncio
    async def test_retention_policy_application(self, disaster_recovery_service, backup_service):
        """Test backup retention policy application"""
        # Create test backups with different ages
        now = datetime.now()
        
        # Create old backup (should be deleted)
        old_backup = backup_service.create_database_backup("test_old")
        if old_backup.success:
            # Modify creation time to make it old
            metadata = backup_service._load_metadata(old_backup.backup_id)
            metadata.created_at = now - timedelta(days=100)
            backup_service._save_metadata(metadata)
        
        # Create recent backup (should be kept)
        recent_backup = backup_service.create_database_backup("test_recent")
        
        # Apply retention policy
        result = await disaster_recovery_service.apply_retention_policy()
        
        assert result["success"]
        assert result["total_backups"] >= 2
        assert result["backups_deleted"] >= 0
        assert result["backups_kept"] >= 1
    
    @pytest.mark.asyncio
    async def test_off_site_storage_sync(self, disaster_recovery_service, backup_service):
        """Test off-site storage synchronization"""
        # Create test backup
        backup_result = backup_service.create_database_backup("test_sync")
        assert backup_result.success
        
        # Test sync to off-site storage
        sync_result = await disaster_recovery_service.sync_to_off_site_storage()
        
        assert sync_result["success"]
        assert sync_result["total_local_backups"] >= 1
        assert sync_result["uploaded_count"] >= 0
        
        # Verify upload was called
        disaster_recovery_service.off_site_storage.upload_backup.assert_called()

class TestDisasterRecoveryTasks:
    """Test disaster recovery Celery tasks"""
    
    @pytest.mark.asyncio
    async def test_apply_retention_policy_task(self, temp_directories):
        """Test retention policy application task"""
        with patch('analytics_tasks.disaster_recovery_tasks.get_disaster_recovery_service') as mock_service:
            # Mock the service
            mock_dr_service = Mock()
            mock_dr_service.apply_retention_policy = AsyncMock(return_value={
                "success": True,
                "total_backups": 10,
                "backups_kept": 8,
                "backups_archived": 1,
                "backups_deleted": 1,
                "retention_policy": {},
                "applied_at": datetime.now().isoformat()
            })
            mock_service.return_value = mock_dr_service
            
            # Execute task
            result = apply_retention_policy()
            
            assert result["success"]
            assert result["total_backups"] == 10
            assert result["backups_deleted"] == 1
    
    @pytest.mark.asyncio
    async def test_sync_to_offsite_storage_task(self):
        """Test off-site storage sync task"""
        with patch('analytics_tasks.disaster_recovery_tasks.get_disaster_recovery_service') as mock_service:
            # Mock the service
            mock_dr_service = Mock()
            mock_dr_service.off_site_storage = Mock()
            mock_dr_service.sync_to_off_site_storage = AsyncMock(return_value={
                "success": True,
                "total_local_backups": 5,
                "uploaded_count": 2,
                "failed_count": 0,
                "synced_at": datetime.now().isoformat()
            })
            mock_service.return_value = mock_dr_service
            
            # Execute task
            result = sync_to_offsite_storage()
            
            assert result["success"]
            assert result["uploaded_count"] == 2
            assert result["failed_count"] == 0
    
    @pytest.mark.asyncio
    async def test_test_recovery_procedures_task(self):
        """Test recovery procedures testing task"""
        with patch('analytics_tasks.disaster_recovery_tasks.get_disaster_recovery_service') as mock_service:
            # Mock the service
            mock_dr_service = Mock()
            mock_procedure = Mock()
            mock_procedure.procedure_id = "test_procedure"
            mock_procedure.name = "Test Procedure"
            mock_procedure.steps = [{"step": "test"}]
            mock_procedure.validation_steps = [{"validation": "test"}]
            mock_procedure.prerequisites = ["test_prereq"]
            mock_procedure.estimated_duration_minutes = 30
            
            mock_dr_service.list_recovery_procedures.return_value = [mock_procedure]
            mock_dr_service._load_recovery_procedure.return_value = mock_procedure
            mock_dr_service.backup_service.list_backups.return_value = [Mock()]
            mock_service.return_value = mock_dr_service
            
            # Execute task
            result = test_recovery_procedures()
            
            assert result["success"]
            assert result["total_procedures_tested"] == 1
            assert result["successful_tests"] >= 0
    
    @pytest.mark.asyncio
    async def test_monitor_system_health_task(self):
        """Test system health monitoring task"""
        with patch('analytics_tasks.disaster_recovery_tasks.get_disaster_recovery_service') as mock_service:
            # Mock the service
            mock_dr_service = Mock()
            mock_backup = Mock()
            mock_backup.created_at = datetime.now()
            mock_dr_service.backup_service.list_backups.return_value = [mock_backup]
            mock_dr_service.off_site_storage = None
            mock_dr_service.list_recovery_procedures.return_value = [Mock(), Mock()]
            mock_service.return_value = mock_dr_service
            
            with patch('shutil.disk_usage', return_value=(1000000, 500000, 500000)):
                with patch('psycopg2.connect') as mock_connect:
                    mock_conn = Mock()
                    mock_cursor = Mock()
                    mock_cursor.fetchone.return_value = [1]
                    mock_conn.cursor.return_value = mock_cursor
                    mock_connect.return_value = mock_conn
                    
                    # Execute task
                    result = monitor_system_health()
            
            assert result["success"]
            assert "overall_health" in result
            assert "health_checks" in result
            assert len(result["health_checks"]) > 0
    
    @pytest.mark.asyncio
    async def test_cleanup_recovery_logs_task(self, temp_directories):
        """Test recovery logs cleanup task"""
        backup_dir, _ = temp_directories
        logs_dir = backup_dir / "disaster_recovery" / "logs"
        logs_dir.mkdir(parents=True, exist_ok=True)
        
        # Create test log files
        old_log = logs_dir / "old_recovery.json"
        recent_log = logs_dir / "recent_recovery.json"
        
        old_log.write_text('{"test": "old"}')
        recent_log.write_text('{"test": "recent"}')
        
        # Set old modification time
        old_time = datetime.now() - timedelta(days=100)
        os.utime(old_log, (old_time.timestamp(), old_time.timestamp()))
        
        with patch('analytics_tasks.disaster_recovery_tasks.get_disaster_recovery_service') as mock_service:
            mock_dr_service = Mock()
            mock_dr_service.logs_dir = logs_dir
            mock_service.return_value = mock_dr_service
            
            # Execute task
            result = cleanup_recovery_logs(retention_days=30)
        
        assert result["success"]
        assert result["cleaned_count"] >= 1
        assert not old_log.exists()  # Old log should be deleted
        assert recent_log.exists()   # Recent log should remain

class TestDisasterRecoveryIntegration:
    """Integration tests for complete disaster recovery scenarios"""
    
    @pytest.mark.asyncio
    async def test_complete_disaster_recovery_scenario(self, disaster_recovery_service, backup_service):
        """Test complete disaster recovery scenario"""
        # Step 1: Create initial backups
        db_backup = backup_service.create_database_backup("goldshop_test")
        file_backup = backup_service.create_file_backup("/tmp/test_data")
        
        assert db_backup.success
        assert file_backup.success
        
        # Step 2: Simulate disaster by "corrupting" data
        # (In real scenario, this would be actual data corruption)
        
        # Step 3: Execute recovery procedure
        with patch.object(disaster_recovery_service, '_execute_verification_command', 
                         return_value=True):
            recovery_result = await disaster_recovery_service.execute_recovery_procedure(
                procedure_id="full_system_recovery"
            )
        
        assert recovery_result.success
        assert recovery_result.status in [RecoveryStatus.COMPLETED, RecoveryStatus.VALIDATED]
        
        # Step 4: Verify system is operational
        assert recovery_result.validation_results is not None
        
        # Step 5: Apply retention policy
        retention_result = await disaster_recovery_service.apply_retention_policy()
        assert retention_result["success"]
        
        # Step 6: Sync to off-site storage
        sync_result = await disaster_recovery_service.sync_to_off_site_storage()
        assert sync_result["success"]
    
    @pytest.mark.asyncio
    async def test_backup_verification_and_restoration(self, disaster_recovery_service, backup_service):
        """Test backup verification and restoration process"""
        # Create test backup
        backup_result = backup_service.create_database_backup("test_verification")
        assert backup_result.success
        
        # Verify backup integrity
        verification_result = backup_service.verify_backup(backup_result.backup_id)
        assert verification_result.integrity_check_passed
        assert verification_result.checksum_verified
        
        # Test restoration
        restore_result = backup_service.restore_backup(
            backup_result.backup_id, 
            "/tmp/test_restore"
        )
        assert restore_result.success
        
        # Verify restored files exist
        restore_path = Path("/tmp/test_restore")
        assert restore_path.exists()
    
    @pytest.mark.asyncio
    async def test_off_site_storage_integration(self, disaster_recovery_service):
        """Test off-site storage integration"""
        # Test storage configuration
        assert disaster_recovery_service.off_site_storage is not None
        assert disaster_recovery_service.off_site_storage.config.provider == StorageProvider.AWS_S3
        
        # Test backup listing
        backups = await disaster_recovery_service.off_site_storage.list_backups()
        assert isinstance(backups, list)
        
        # Test upload functionality (mocked)
        upload_result = await disaster_recovery_service.off_site_storage.upload_backup(
            "/tmp/test_file", "test_key"
        )
        assert upload_result
    
    @pytest.mark.asyncio
    async def test_recovery_procedure_validation(self, disaster_recovery_service):
        """Test recovery procedure validation"""
        procedures = disaster_recovery_service.list_recovery_procedures()
        
        for procedure in procedures:
            # Validate procedure structure
            assert procedure.procedure_id
            assert procedure.name
            assert procedure.description
            assert len(procedure.steps) > 0
            assert len(procedure.validation_steps) > 0
            assert len(procedure.prerequisites) > 0
            assert procedure.estimated_duration_minutes > 0
            
            # Validate steps structure
            for step in procedure.steps:
                assert "step_id" in step
                assert "name" in step
                assert "description" in step
                assert "command" in step
                assert "timeout_seconds" in step
            
            # Validate validation steps structure
            for validation_step in procedure.validation_steps:
                assert "step_id" in validation_step
                assert "name" in validation_step
                assert "description" in validation_step
                assert "command" in validation_step
    
    @pytest.mark.asyncio
    async def test_disaster_recovery_logging(self, disaster_recovery_service, backup_service):
        """Test disaster recovery operation logging"""
        # Create test backup
        backup_result = backup_service.create_database_backup("test_logging")
        assert backup_result.success
        
        # Execute recovery procedure
        with patch.object(disaster_recovery_service, '_execute_verification_command', 
                         return_value=True):
            recovery_result = await disaster_recovery_service.execute_recovery_procedure(
                procedure_id="database_recovery",
                backup_id=backup_result.backup_id
            )
        
        assert recovery_result.success
        
        # Verify log was created
        logs = disaster_recovery_service.get_recovery_logs(limit=1)
        assert len(logs) > 0
        
        log_entry = logs[0]
        assert "recovery_result" in log_entry
        assert "procedure" in log_entry
        assert "system_info" in log_entry
        
        # Verify log content
        assert log_entry["recovery_result"]["recovery_id"] == recovery_result.recovery_id
        assert log_entry["recovery_result"]["success"] == recovery_result.success

# Performance and stress tests
class TestDisasterRecoveryPerformance:
    """Performance tests for disaster recovery system"""
    
    @pytest.mark.asyncio
    async def test_multiple_concurrent_recoveries(self, disaster_recovery_service, backup_service):
        """Test handling multiple concurrent recovery operations"""
        # Create multiple backups
        backup_results = []
        for i in range(3):
            backup_result = backup_service.create_database_backup(f"test_concurrent_{i}")
            if backup_result.success:
                backup_results.append(backup_result)
        
        # Execute multiple recovery procedures concurrently
        with patch.object(disaster_recovery_service, '_execute_verification_command', 
                         return_value=True):
            recovery_tasks = [
                disaster_recovery_service.execute_recovery_procedure(
                    procedure_id="database_recovery",
                    backup_id=backup.backup_id
                )
                for backup in backup_results[:2]  # Limit to 2 concurrent recoveries
            ]
            
            recovery_results = await asyncio.gather(*recovery_tasks, return_exceptions=True)
        
        # Verify results
        successful_recoveries = [r for r in recovery_results if not isinstance(r, Exception) and r.success]
        assert len(successful_recoveries) >= 1  # At least one should succeed
    
    @pytest.mark.asyncio
    async def test_large_backup_handling(self, disaster_recovery_service, backup_service):
        """Test handling of large backup files"""
        # Create a larger test file
        large_file_path = "/tmp/large_test_file"
        with open(large_file_path, 'wb') as f:
            f.write(b'0' * (10 * 1024 * 1024))  # 10MB file
        
        try:
            # Create backup of large file
            backup_result = backup_service.create_file_backup(large_file_path)
            assert backup_result.success
            assert backup_result.size_bytes > 1024 * 1024  # Should be > 1MB after compression/encryption
            
            # Verify backup
            verification_result = backup_service.verify_backup(backup_result.backup_id)
            assert verification_result.integrity_check_passed
            
        finally:
            # Cleanup
            if os.path.exists(large_file_path):
                os.unlink(large_file_path)

if __name__ == "__main__":
    # Run tests with pytest
    pytest.main([__file__, "-v", "--tb=short"])