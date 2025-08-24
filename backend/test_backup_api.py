"""
Tests for Backup Management API endpoints

Tests the REST API functionality for backup operations including:
- Creating backups via API
- Listing backups
- Verifying backups
- Scheduling backup tasks
"""

import pytest
import os
import tempfile
from fastapi.testclient import TestClient
from unittest.mock import patch, Mock

from main import app
from services.backup_service import BackupService, BackupMetadata, BackupResult, VerificationResult

client = TestClient(app)

class TestBackupAPI:
    """Test backup API endpoints"""
    
    def test_backup_system_status(self):
        """Test backup system status endpoint"""
        with patch('routers.backup_management.get_backup_service') as mock_service:
            # Mock backup service
            mock_backup_service = Mock()
            mock_backup_service.list_backups.return_value = []
            mock_backup_service.backup_directory = "/app/backups"
            mock_backup_service.encryption_password = "test_password"
            mock_service.return_value = mock_backup_service
            
            response = client.get("/api/backup/status")
            
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "operational"
            assert data["total_backups"] == 0
            assert data["backup_directory"] == "/app/backups"
            assert data["encryption_enabled"] is True
    
    def test_list_backups_empty(self):
        """Test listing backups when none exist"""
        with patch('routers.backup_management.get_backup_service') as mock_service:
            mock_backup_service = Mock()
            mock_backup_service.list_backups.return_value = []
            mock_service.return_value = mock_backup_service
            
            response = client.get("/api/backup/list")
            
            assert response.status_code == 200
            data = response.json()
            assert data == []
    
    def test_list_backups_with_data(self):
        """Test listing backups with existing backups"""
        from datetime import datetime
        
        with patch('routers.backup_management.get_backup_service') as mock_service:
            # Create mock backup metadata
            mock_backup = BackupMetadata(
                backup_id="test_backup_123",
                backup_type="database",
                created_at=datetime.now(),
                file_path="/app/backups/test_backup_123.backup.enc",
                encrypted=True,
                compressed=True,
                size_bytes=1024,
                checksum="test_checksum",
                database_name="goldshop"
            )
            
            mock_backup_service = Mock()
            mock_backup_service.list_backups.return_value = [mock_backup]
            mock_service.return_value = mock_backup_service
            
            response = client.get("/api/backup/list")
            
            assert response.status_code == 200
            data = response.json()
            assert len(data) == 1
            assert data[0]["backup_id"] == "test_backup_123"
            assert data[0]["backup_type"] == "database"
            assert data[0]["encrypted"] is True
            assert data[0]["size_bytes"] == 1024
    
    def test_create_database_backup(self):
        """Test creating database backup via API"""
        from datetime import datetime
        
        with patch('routers.backup_management.get_backup_service') as mock_service:
            # Mock successful backup result
            mock_metadata = BackupMetadata(
                backup_id="db_test_123",
                backup_type="database",
                created_at=datetime.now(),
                file_path="/app/backups/db_test_123.backup.enc",
                encrypted=True,
                compressed=True,
                size_bytes=2048,
                checksum="test_checksum",
                database_name="goldshop"
            )
            
            mock_result = BackupResult(
                success=True,
                backup_id="db_test_123",
                file_path="/app/backups/db_test_123.backup.enc",
                size_bytes=2048,
                duration_seconds=5.5,
                metadata=mock_metadata
            )
            
            mock_backup_service = Mock()
            mock_backup_service.create_database_backup.return_value = mock_result
            mock_service.return_value = mock_backup_service
            
            # Make API request
            response = client.post("/api/backup/create", json={
                "backup_type": "database",
                "database_name": "goldshop",
                "compress": True,
                "encrypt": True
            })
            
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert data["backup_id"] == "db_test_123"
            assert data["size_bytes"] == 2048
            assert data["duration_seconds"] == 5.5
    
    def test_create_file_backup(self):
        """Test creating file backup via API"""
        from datetime import datetime
        
        with patch('routers.backup_management.get_backup_service') as mock_service:
            # Mock successful backup result
            mock_metadata = BackupMetadata(
                backup_id="files_test_123",
                backup_type="files",
                created_at=datetime.now(),
                file_path="/app/backups/files_test_123.backup.enc",
                encrypted=True,
                compressed=True,
                size_bytes=1024,
                checksum="test_checksum",
                source_path="/app/uploads"
            )
            
            mock_result = BackupResult(
                success=True,
                backup_id="files_test_123",
                file_path="/app/backups/files_test_123.backup.enc",
                size_bytes=1024,
                duration_seconds=3.2,
                metadata=mock_metadata
            )
            
            mock_backup_service = Mock()
            mock_backup_service.create_file_backup.return_value = mock_result
            mock_service.return_value = mock_backup_service
            
            # Make API request
            response = client.post("/api/backup/create", json={
                "backup_type": "files",
                "file_paths": ["/app/uploads"],
                "compress": True,
                "encrypt": True
            })
            
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert data["backup_id"] == "files_test_123"
            assert data["size_bytes"] == 1024
    
    def test_verify_backup(self):
        """Test backup verification via API"""
        with patch('routers.backup_management.get_backup_service') as mock_service:
            # Mock verification result
            mock_verification = VerificationResult(
                backup_id="test_backup_123",
                integrity_check_passed=True,
                restoration_test_passed=True,
                checksum_verified=True,
                verification_details={
                    "file_size": 1024,
                    "backup_type": "database",
                    "encrypted": True
                }
            )
            
            mock_backup_service = Mock()
            mock_backup_service.verify_backup.return_value = mock_verification
            mock_service.return_value = mock_backup_service
            
            response = client.post("/api/backup/verify/test_backup_123")
            
            assert response.status_code == 200
            data = response.json()
            assert data["backup_id"] == "test_backup_123"
            assert data["integrity_check_passed"] is True
            assert data["restoration_test_passed"] is True
            assert data["checksum_verified"] is True
            assert data["verification_details"]["file_size"] == 1024
    
    def test_cleanup_old_backups(self):
        """Test cleanup old backups via API"""
        with patch('routers.backup_management.get_backup_service') as mock_service:
            mock_backup_service = Mock()
            mock_backup_service.cleanup_old_backups.return_value = 3
            mock_service.return_value = mock_backup_service
            
            response = client.delete("/api/backup/cleanup?retention_days=30")
            
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert data["cleaned_count"] == 3
            assert data["retention_days"] == 30
    
    def test_schedule_database_backup(self):
        """Test scheduling database backup task"""
        with patch('analytics_tasks.backup_tasks.create_scheduled_database_backup') as mock_task:
            # Mock Celery task
            mock_task_result = Mock()
            mock_task_result.id = "task_123"
            mock_task.delay.return_value = mock_task_result
            
            response = client.post("/api/backup/schedule/database", params={
                "database_name": "goldshop",
                "compress": True,
                "encrypt": True
            })
            
            assert response.status_code == 200
            data = response.json()
            assert data["task_id"] == "task_123"
            assert data["task_name"] == "create_scheduled_database_backup"
            assert data["status"] == "scheduled"
    
    def test_schedule_file_backup(self):
        """Test scheduling file backup task"""
        with patch('analytics_tasks.backup_tasks.create_scheduled_file_backup') as mock_task:
            # Mock Celery task
            mock_task_result = Mock()
            mock_task_result.id = "task_456"
            mock_task.delay.return_value = mock_task_result
            
            response = client.post("/api/backup/schedule/files", json={
                "file_paths": ["/app/uploads"],
                "compress": True,
                "encrypt": True
            })
            
            assert response.status_code == 200
            data = response.json()
            assert data["task_id"] == "task_456"
            assert data["task_name"] == "create_scheduled_file_backup"
            assert data["status"] == "scheduled"
    
    def test_create_backup_invalid_type(self):
        """Test creating backup with invalid type"""
        with patch('routers.backup_management.get_backup_service') as mock_service:
            mock_service.return_value = Mock()
            
            response = client.post("/api/backup/create", json={
                "backup_type": "invalid_type",
                "compress": True,
                "encrypt": True
            })
            
            assert response.status_code == 400
            assert "Invalid backup type" in response.json()["detail"]
    
    def test_create_backup_failure(self):
        """Test backup creation failure handling"""
        from datetime import datetime
        
        with patch('routers.backup_management.get_backup_service') as mock_service:
            # Mock failed backup result
            mock_result = BackupResult(
                success=False,
                backup_id="failed_backup",
                file_path="",
                size_bytes=0,
                duration_seconds=1.0,
                error_message="Database connection failed"
            )
            
            mock_backup_service = Mock()
            mock_backup_service.create_database_backup.return_value = mock_result
            mock_service.return_value = mock_backup_service
            
            response = client.post("/api/backup/create", json={
                "backup_type": "database",
                "database_name": "goldshop"
            })
            
            assert response.status_code == 500
            assert "Database connection failed" in response.json()["detail"]
    
    def test_verify_nonexistent_backup(self):
        """Test verifying non-existent backup"""
        with patch('routers.backup_management.get_backup_service') as mock_service:
            # Mock verification failure
            mock_verification = VerificationResult(
                backup_id="nonexistent_backup",
                integrity_check_passed=False,
                restoration_test_passed=False,
                checksum_verified=False,
                error_message="Backup metadata not found"
            )
            
            mock_backup_service = Mock()
            mock_backup_service.verify_backup.return_value = mock_verification
            mock_service.return_value = mock_backup_service
            
            response = client.post("/api/backup/verify/nonexistent_backup")
            
            assert response.status_code == 200
            data = response.json()
            assert data["backup_id"] == "nonexistent_backup"
            assert data["integrity_check_passed"] is False
            assert data["error_message"] == "Backup metadata not found"

if __name__ == "__main__":
    pytest.main([__file__, "-v"])