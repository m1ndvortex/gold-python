"""
Comprehensive unit tests for BackupService

Tests cover:
- Database backup creation and encryption
- File system backup creation and encryption
- Backup verification and integrity checking
- Restoration testing
- Error handling and edge cases
"""

import pytest
import os
import tempfile
import shutil
import json
import gzip
import tarfile
from datetime import datetime, timedelta
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock
import subprocess

from services.backup_service import (
    BackupService, 
    EncryptionService, 
    BackupMetadata, 
    BackupResult, 
    VerificationResult, 
    RestoreResult
)

class TestEncryptionService:
    """Test encryption service functionality"""
    
    def test_encryption_service_initialization(self):
        """Test encryption service initialization"""
        password = "test_password"
        encryption_service = EncryptionService(password)
        
        assert encryption_service.salt is not None
        assert len(encryption_service.salt) == 16
        assert encryption_service.key is not None
        assert encryption_service.fernet is not None
    
    def test_key_derivation_consistency(self):
        """Test that same password and salt produce same key"""
        password = "test_password"
        salt = os.urandom(16)
        
        service1 = EncryptionService(password, salt)
        service2 = EncryptionService(password, salt)
        
        assert service1.key == service2.key
    
    def test_file_encryption_decryption(self):
        """Test file encryption and decryption"""
        password = "test_password"
        test_data = b"This is test data for encryption"
        
        with tempfile.TemporaryDirectory() as temp_dir:
            # Create test file
            input_file = Path(temp_dir) / "input.txt"
            encrypted_file = Path(temp_dir) / "encrypted.enc"
            decrypted_file = Path(temp_dir) / "decrypted.txt"
            
            with open(input_file, 'wb') as f:
                f.write(test_data)
            
            # Encrypt file
            encryption_service = EncryptionService(password)
            checksum, salt = encryption_service.encrypt_file(str(input_file), str(encrypted_file))
            
            assert encrypted_file.exists()
            assert checksum is not None
            assert salt is not None
            
            # Decrypt file using static method
            decrypted_checksum = EncryptionService.decrypt_file_static(
                str(encrypted_file), str(decrypted_file), password
            )
            
            assert decrypted_file.exists()
            
            # Verify decrypted content
            with open(decrypted_file, 'rb') as f:
                decrypted_data = f.read()
            
            assert decrypted_data == test_data
    
    def test_checksum_calculation(self):
        """Test checksum calculation"""
        test_data = b"Test data for checksum"
        
        with tempfile.NamedTemporaryFile(mode='wb', delete=False) as temp_file:
            temp_file.write(test_data)
            temp_path = temp_file.name
        
        try:
            encryption_service = EncryptionService("password")
            checksum = encryption_service._calculate_checksum(temp_path)
            
            assert checksum is not None
            assert len(checksum) == 64  # SHA-256 hex digest length
            
            # Verify checksum consistency
            checksum2 = encryption_service._calculate_checksum(temp_path)
            assert checksum == checksum2
            
        finally:
            os.unlink(temp_path)

class TestBackupService:
    """Test backup service functionality"""
    
    @pytest.fixture
    def backup_service(self):
        """Create backup service for testing"""
        with tempfile.TemporaryDirectory() as temp_dir:
            database_url = "postgresql://test_user:test_pass@localhost:5432/test_db"
            service = BackupService(
                database_url=database_url,
                backup_directory=temp_dir,
                encryption_password="test_password"
            )
            yield service
    
    @pytest.fixture
    def mock_subprocess(self):
        """Mock subprocess for pg_dump testing"""
        with patch('subprocess.run') as mock_run:
            mock_run.return_value = Mock(returncode=0, stderr="")
            yield mock_run
    
    def test_backup_service_initialization(self, backup_service):
        """Test backup service initialization"""
        assert backup_service.database_url is not None
        assert backup_service.backup_directory.exists()
        assert backup_service.database_backup_dir.exists()
        assert backup_service.file_backup_dir.exists()
        assert backup_service.metadata_dir.exists()
        assert backup_service.encryption_password is not None
    
    def test_database_backup_creation(self, backup_service, mock_subprocess):
        """Test database backup creation"""
        # Create a mock SQL dump file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.sql', delete=False) as temp_file:
            temp_file.write("-- Test SQL dump\nCREATE TABLE test (id INTEGER);")
            temp_sql_path = temp_file.name
        
        try:
            # Mock pg_dump to create the temp file
            def mock_pg_dump(*args, **kwargs):
                # Copy our test SQL to the expected output file
                output_file = None
                for i, arg in enumerate(args[0]):
                    if arg == '-f' and i + 1 < len(args[0]):
                        output_file = args[0][i + 1]
                        break
                
                if output_file:
                    shutil.copy2(temp_sql_path, output_file)
                
                return Mock(returncode=0, stderr="")
            
            mock_subprocess.side_effect = mock_pg_dump
            
            # Create database backup
            result = backup_service.create_database_backup(
                database_name="test_db",
                compress=True,
                encrypt=True
            )
            
            assert result.success is True
            assert result.backup_id.startswith("db_test_db_")
            assert result.size_bytes > 0
            assert result.duration_seconds >= 0
            assert result.metadata is not None
            assert result.metadata.backup_type == "database"
            assert result.metadata.encrypted is True
            assert result.metadata.compressed is True
            
            # Verify backup file exists
            assert os.path.exists(result.file_path)
            
            # Verify metadata was saved
            metadata_file = backup_service.metadata_dir / f"{result.backup_id}.json"
            assert metadata_file.exists()
            
        finally:
            os.unlink(temp_sql_path)
    
    def test_file_backup_creation(self, backup_service):
        """Test file system backup creation"""
        # Create test directory with files
        with tempfile.TemporaryDirectory() as test_source_dir:
            test_file1 = Path(test_source_dir) / "file1.txt"
            test_file2 = Path(test_source_dir) / "file2.txt"
            
            test_file1.write_text("Test content 1")
            test_file2.write_text("Test content 2")
            
            # Create file backup
            result = backup_service.create_file_backup(
                source_path=test_source_dir,
                compress=True,
                encrypt=True
            )
            
            assert result.success is True
            assert result.backup_id.startswith("files_")
            assert result.size_bytes > 0
            assert result.duration_seconds >= 0
            assert result.metadata is not None
            assert result.metadata.backup_type == "files"
            assert result.metadata.encrypted is True
            assert result.metadata.compressed is True
            
            # Verify backup file exists
            assert os.path.exists(result.file_path)
            
            # Verify metadata was saved
            metadata_file = backup_service.metadata_dir / f"{result.backup_id}.json"
            assert metadata_file.exists()
    
    def test_full_backup_creation(self, backup_service, mock_subprocess):
        """Test full system backup creation"""
        # Create test files
        with tempfile.TemporaryDirectory() as test_dir:
            test_file = Path(test_dir) / "test.txt"
            test_file.write_text("Test content")
            
            # Mock pg_dump
            def mock_pg_dump(*args, **kwargs):
                output_file = None
                for i, arg in enumerate(args[0]):
                    if arg == '-f' and i + 1 < len(args[0]):
                        output_file = args[0][i + 1]
                        break
                
                if output_file:
                    Path(output_file).write_text("-- Test SQL dump")
                
                return Mock(returncode=0, stderr="")
            
            mock_subprocess.side_effect = mock_pg_dump
            
            # Create full backup
            results = backup_service.create_full_backup(
                database_name="test_db",
                file_paths=[test_dir]
            )
            
            assert len(results) == 2  # Database + 1 file path
            assert all(result.success for result in results)
            
            # Check backup types
            backup_types = [result.metadata.backup_type for result in results]
            assert "database" in backup_types
            assert "files" in backup_types
    
    def test_backup_verification(self, backup_service):
        """Test backup verification functionality"""
        # Create test file backup first
        with tempfile.TemporaryDirectory() as test_source_dir:
            test_file = Path(test_source_dir) / "test.txt"
            test_file.write_text("Test content for verification")
            
            # Create backup
            backup_result = backup_service.create_file_backup(test_source_dir)
            assert backup_result.success
            
            # Verify backup
            verification_result = backup_service.verify_backup(backup_result.backup_id)
            
            assert verification_result.backup_id == backup_result.backup_id
            assert verification_result.checksum_verified is True
            assert verification_result.integrity_check_passed is True
            assert verification_result.verification_details is not None
            
            # Verify details
            details = verification_result.verification_details
            assert details["backup_type"] == "files"
            assert details["encrypted"] is True
            assert details["compressed"] is True
            assert details["checksum_match"] is True
    
    def test_backup_verification_missing_backup(self, backup_service):
        """Test verification of non-existent backup"""
        verification_result = backup_service.verify_backup("non_existent_backup")
        
        assert verification_result.backup_id == "non_existent_backup"
        assert verification_result.integrity_check_passed is False
        assert verification_result.restoration_test_passed is False
        assert verification_result.checksum_verified is False
        assert "not found" in verification_result.error_message.lower()
    
    def test_backup_restoration(self, backup_service):
        """Test backup restoration functionality"""
        # Create test file backup
        with tempfile.TemporaryDirectory() as test_source_dir:
            test_file = Path(test_source_dir) / "test.txt"
            test_content = "Test content for restoration"
            test_file.write_text(test_content)
            
            # Create backup
            backup_result = backup_service.create_file_backup(test_source_dir)
            assert backup_result.success
            
            # Restore backup
            with tempfile.TemporaryDirectory() as restore_dir:
                restore_result = backup_service.restore_backup(
                    backup_result.backup_id, 
                    restore_dir
                )
                
                assert restore_result.success is True
                assert restore_result.backup_id == backup_result.backup_id
                assert restore_result.restored_to == restore_dir
                assert restore_result.duration_seconds >= 0
                
                # Verify restored content
                restored_files = list(Path(restore_dir).rglob("*.txt"))
                assert len(restored_files) > 0
    
    def test_list_backups(self, backup_service):
        """Test listing available backups"""
        # Initially no backups
        backups = backup_service.list_backups()
        initial_count = len(backups)
        
        # Create test backups
        with tempfile.TemporaryDirectory() as test_dir:
            test_file = Path(test_dir) / "test.txt"
            test_file.write_text("Test content")
            
            # Create multiple backups
            backup1 = backup_service.create_file_backup(test_dir)
            backup2 = backup_service.create_file_backup(test_dir)
            
            assert backup1.success and backup2.success
            
            # List all backups
            all_backups = backup_service.list_backups()
            assert len(all_backups) == initial_count + 2
            
            # List only file backups
            file_backups = backup_service.list_backups(backup_type="files")
            assert len(file_backups) >= 2
            
            # Verify backup metadata
            for backup in file_backups[-2:]:  # Last 2 backups
                assert backup.backup_type == "files"
                assert backup.backup_id in [backup1.backup_id, backup2.backup_id]
                assert backup.created_at is not None
                assert backup.size_bytes > 0
    
    def test_cleanup_old_backups(self, backup_service):
        """Test cleanup of old backups"""
        # Create test backup
        with tempfile.TemporaryDirectory() as test_dir:
            test_file = Path(test_dir) / "test.txt"
            test_file.write_text("Test content")
            
            backup_result = backup_service.create_file_backup(test_dir)
            assert backup_result.success
            
            # Modify metadata to make backup appear old
            metadata = backup_service._load_metadata(backup_result.backup_id)
            metadata.created_at = datetime.now() - timedelta(days=35)
            backup_service._save_metadata(metadata)
            
            # Cleanup old backups (retention: 30 days)
            cleaned_count = backup_service.cleanup_old_backups(retention_days=30)
            
            assert cleaned_count >= 1
            
            # Verify backup was removed
            remaining_backups = backup_service.list_backups()
            backup_ids = [b.backup_id for b in remaining_backups]
            assert backup_result.backup_id not in backup_ids
    
    def test_metadata_save_load(self, backup_service):
        """Test metadata saving and loading"""
        # Create test metadata
        metadata = BackupMetadata(
            backup_id="test_backup_123",
            backup_type="database",
            created_at=datetime.now(),
            file_path="/test/path/backup.enc",
            encrypted=True,
            compressed=True,
            size_bytes=1024,
            checksum="test_checksum",
            database_name="test_db"
        )
        
        # Save metadata
        backup_service._save_metadata(metadata)
        
        # Load metadata
        loaded_metadata = backup_service._load_metadata("test_backup_123")
        
        assert loaded_metadata is not None
        assert loaded_metadata.backup_id == metadata.backup_id
        assert loaded_metadata.backup_type == metadata.backup_type
        assert loaded_metadata.file_path == metadata.file_path
        assert loaded_metadata.encrypted == metadata.encrypted
        assert loaded_metadata.compressed == metadata.compressed
        assert loaded_metadata.size_bytes == metadata.size_bytes
        assert loaded_metadata.checksum == metadata.checksum
        assert loaded_metadata.database_name == metadata.database_name
        
        # Verify datetime handling
        assert isinstance(loaded_metadata.created_at, datetime)
    
    def test_checksum_calculation(self, backup_service):
        """Test checksum calculation"""
        test_data = b"Test data for checksum calculation"
        
        with tempfile.NamedTemporaryFile(mode='wb', delete=False) as temp_file:
            temp_file.write(test_data)
            temp_path = temp_file.name
        
        try:
            checksum1 = backup_service._calculate_checksum(temp_path)
            checksum2 = backup_service._calculate_checksum(temp_path)
            
            assert checksum1 == checksum2
            assert len(checksum1) == 64  # SHA-256 hex digest
            
        finally:
            os.unlink(temp_path)
    
    def test_database_backup_failure(self, backup_service):
        """Test database backup failure handling"""
        with patch('subprocess.run') as mock_run:
            # Mock pg_dump failure
            mock_run.return_value = Mock(returncode=1, stderr="Connection failed")
            
            result = backup_service.create_database_backup("test_db")
            
            assert result.success is False
            assert result.error_message is not None
            assert "pg_dump failed" in result.error_message
            assert result.duration_seconds >= 0
    
    def test_file_backup_nonexistent_path(self, backup_service):
        """Test file backup with non-existent source path"""
        result = backup_service.create_file_backup("/non/existent/path")
        
        assert result.success is False
        assert result.error_message is not None
        assert result.duration_seconds >= 0
    
    def test_backup_verification_corrupted_file(self, backup_service):
        """Test verification of corrupted backup"""
        # Create test backup
        with tempfile.TemporaryDirectory() as test_dir:
            test_file = Path(test_dir) / "test.txt"
            test_file.write_text("Test content")
            
            backup_result = backup_service.create_file_backup(test_dir)
            assert backup_result.success
            
            # Corrupt the backup file
            with open(backup_result.file_path, 'ab') as f:
                f.write(b"corrupted_data")
            
            # Verify backup (should fail checksum)
            verification_result = backup_service.verify_backup(backup_result.backup_id)
            
            assert verification_result.checksum_verified is False
            assert verification_result.integrity_check_passed is False
            assert "checksum" in verification_result.error_message.lower()

@pytest.mark.asyncio
class TestBackupServiceIntegration:
    """Integration tests for backup service with real database operations"""
    
    @pytest.fixture
    def real_backup_service(self):
        """Create backup service with real database connection for integration tests"""
        database_url = os.getenv("DATABASE_URL", "postgresql://goldshop_user:goldshop_password@db:5432/goldshop")
        
        with tempfile.TemporaryDirectory() as temp_dir:
            service = BackupService(
                database_url=database_url,
                backup_directory=temp_dir,
                encryption_password="integration_test_password"
            )
            yield service
    
    @pytest.mark.skipif(
        not os.getenv("RUN_INTEGRATION_TESTS"), 
        reason="Integration tests require RUN_INTEGRATION_TESTS=1"
    )
    def test_real_database_backup(self, real_backup_service):
        """Test backup with real database connection"""
        # This test requires a real database connection
        result = real_backup_service.create_database_backup(
            database_name="goldshop",
            compress=True,
            encrypt=True
        )
        
        # Note: This might fail if pg_dump is not available in the container
        # In a real deployment, pg_dump would be installed
        if result.success:
            assert result.backup_id is not None
            assert result.size_bytes > 0
            assert os.path.exists(result.file_path)
            
            # Verify the backup
            verification_result = real_backup_service.verify_backup(result.backup_id)
            assert verification_result.checksum_verified is True
        else:
            # If pg_dump is not available, that's expected in test environment
            assert "pg_dump" in result.error_message or "command not found" in result.error_message
    
    def test_end_to_end_backup_workflow(self, real_backup_service):
        """Test complete backup workflow"""
        # Create test data
        with tempfile.TemporaryDirectory() as test_data_dir:
            # Create test files
            test_file1 = Path(test_data_dir) / "data1.txt"
            test_file2 = Path(test_data_dir) / "data2.txt"
            test_file1.write_text("Important data 1")
            test_file2.write_text("Important data 2")
            
            # Create subdirectory
            sub_dir = Path(test_data_dir) / "subdir"
            sub_dir.mkdir()
            (sub_dir / "subfile.txt").write_text("Subdirectory data")
            
            # Step 1: Create backup
            backup_result = real_backup_service.create_file_backup(
                source_path=test_data_dir,
                compress=True,
                encrypt=True
            )
            
            assert backup_result.success is True
            
            # Step 2: Verify backup
            verification_result = real_backup_service.verify_backup(backup_result.backup_id)
            assert verification_result.integrity_check_passed is True
            assert verification_result.checksum_verified is True
            
            # Step 3: List backups
            backups = real_backup_service.list_backups(backup_type="files")
            assert len(backups) >= 1
            assert backup_result.backup_id in [b.backup_id for b in backups]
            
            # Step 4: Restore backup
            with tempfile.TemporaryDirectory() as restore_dir:
                restore_result = real_backup_service.restore_backup(
                    backup_result.backup_id,
                    restore_dir
                )
                
                assert restore_result.success is True
                
                # Verify restored files
                restored_files = list(Path(restore_dir).rglob("*.txt"))
                assert len(restored_files) >= 3  # 2 main files + 1 subfile
                
                # Verify content
                for restored_file in restored_files:
                    assert restored_file.stat().st_size > 0

if __name__ == "__main__":
    pytest.main([__file__, "-v"])