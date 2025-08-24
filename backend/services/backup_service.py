"""
Automated Backup Service with AES-256 Encryption and Verification

This service provides comprehensive backup functionality including:
- Scheduled database backups
- File system backups
- AES-256 encryption for backup security
- Backup integrity verification
- Restoration testing capabilities
"""

import os
import json
import gzip
import hashlib
import subprocess
import tempfile
import shutil
import base64
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, asdict
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class BackupMetadata:
    """Metadata for backup files"""
    backup_id: str
    backup_type: str  # 'database', 'files', 'full'
    created_at: datetime
    file_path: str
    encrypted: bool
    compressed: bool
    size_bytes: int
    checksum: str
    database_name: Optional[str] = None
    source_path: Optional[str] = None
    encryption_salt: Optional[str] = None  # Base64 encoded salt

@dataclass
class BackupResult:
    """Result of backup operation"""
    success: bool
    backup_id: str
    file_path: str
    size_bytes: int
    duration_seconds: float
    error_message: Optional[str] = None
    metadata: Optional[BackupMetadata] = None

@dataclass
class VerificationResult:
    """Result of backup verification"""
    backup_id: str
    integrity_check_passed: bool
    restoration_test_passed: bool
    checksum_verified: bool
    error_message: Optional[str] = None
    verification_details: Optional[Dict] = None

@dataclass
class RestoreResult:
    """Result of restore operation"""
    success: bool
    backup_id: str
    restored_to: str
    duration_seconds: float
    error_message: Optional[str] = None

class EncryptionService:
    """AES-256 encryption service for backup data"""
    
    def __init__(self, password: str, salt: Optional[bytes] = None):
        """Initialize encryption service with password and optional salt"""
        self.password = password
        self.salt = salt or os.urandom(16)
        self.key = self._derive_key(password, self.salt)
        self.fernet = Fernet(self.key)
    
    def _derive_key(self, password: str, salt: bytes) -> bytes:
        """Derive encryption key from password using PBKDF2"""
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
        return key
    
    def encrypt_file(self, input_path: str, output_path: str) -> Tuple[str, bytes]:
        """Encrypt file and return checksum and salt"""
        try:
            with open(input_path, 'rb') as infile:
                data = infile.read()
            
            encrypted_data = self.fernet.encrypt(data)
            
            with open(output_path, 'wb') as outfile:
                # Write salt first, then encrypted data
                outfile.write(self.salt)
                outfile.write(encrypted_data)
            
            # Calculate checksum of encrypted file
            checksum = self._calculate_checksum(output_path)
            return checksum, self.salt
            
        except Exception as e:
            logger.error(f"Encryption failed: {e}")
            raise
    
    def decrypt_file(self, input_path: str, output_path: str, salt: bytes = None) -> str:
        """Decrypt file and return checksum"""
        try:
            with open(input_path, 'rb') as infile:
                # Read salt (first 16 bytes) and encrypted data
                file_salt = infile.read(16)
                encrypted_data = infile.read()
            
            # Use the salt from the file (which was used for encryption)
            decryption_salt = file_salt
            
            # Recreate fernet with the salt that was used for encryption
            key = self._derive_key(self._get_password(), decryption_salt)
            fernet = Fernet(key)
            
            decrypted_data = fernet.decrypt(encrypted_data)
            
            with open(output_path, 'wb') as outfile:
                outfile.write(decrypted_data)
            
            return self._calculate_checksum(output_path)
            
        except Exception as e:
            logger.error(f"Decryption failed: {e}")
            raise
    
    def _calculate_checksum(self, file_path: str) -> str:
        """Calculate SHA-256 checksum of file"""
        sha256_hash = hashlib.sha256()
        with open(file_path, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()
    
    def _get_password(self) -> str:
        """Get encryption password from environment or default"""
        return self.password
    
    @staticmethod
    def decrypt_file_static(input_path: str, output_path: str, password: str) -> str:
        """Static method to decrypt file without needing instance"""
        try:
            with open(input_path, 'rb') as infile:
                # Read salt (first 16 bytes) and encrypted data
                file_salt = infile.read(16)
                encrypted_data = infile.read()
            
            # Derive key using the salt from the file
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=file_salt,
                iterations=100000,
            )
            key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
            fernet = Fernet(key)
            
            decrypted_data = fernet.decrypt(encrypted_data)
            
            with open(output_path, 'wb') as outfile:
                outfile.write(decrypted_data)
            
            # Calculate checksum
            sha256_hash = hashlib.sha256()
            with open(output_path, "rb") as f:
                for byte_block in iter(lambda: f.read(4096), b""):
                    sha256_hash.update(byte_block)
            return sha256_hash.hexdigest()
            
        except Exception as e:
            logger.error(f"Static decryption failed: {e}")
            raise

class BackupService:
    """Comprehensive backup service with encryption and verification"""
    
    def __init__(self, 
                 database_url: str,
                 backup_directory: str = "/app/backups",
                 encryption_password: Optional[str] = None):
        """Initialize backup service"""
        self.database_url = database_url
        self.backup_directory = Path(backup_directory)
        self.backup_directory.mkdir(parents=True, exist_ok=True)
        
        # Initialize encryption service
        self.encryption_password = encryption_password or os.getenv(
            "BACKUP_ENCRYPTION_PASSWORD", 
            "default_backup_password_change_in_production"
        )
        
        # Create subdirectories
        self.database_backup_dir = self.backup_directory / "database"
        self.file_backup_dir = self.backup_directory / "files"
        self.metadata_dir = self.backup_directory / "metadata"
        
        for directory in [self.database_backup_dir, self.file_backup_dir, self.metadata_dir]:
            directory.mkdir(parents=True, exist_ok=True)
        
        logger.info(f"BackupService initialized with backup directory: {self.backup_directory}")
    
    def create_database_backup(self, 
                             database_name: str = "goldshop",
                             compress: bool = True,
                             encrypt: bool = True) -> BackupResult:
        """Create encrypted database backup"""
        start_time = datetime.now()
        backup_id = f"db_{database_name}_{start_time.strftime('%Y%m%d_%H%M%S')}"
        
        try:
            # Create temporary file for pg_dump
            with tempfile.NamedTemporaryFile(mode='w+b', delete=False, suffix='.sql') as temp_file:
                temp_path = temp_file.name
            
            # Extract database connection details
            db_parts = self.database_url.replace('postgresql://', '').split('@')
            user_pass = db_parts[0].split(':')
            host_db = db_parts[1].split('/')
            
            username = user_pass[0]
            password = user_pass[1] if len(user_pass) > 1 else ''
            host_port = host_db[0].split(':')
            host = host_port[0]
            port = host_port[1] if len(host_port) > 1 else '5432'
            
            # Set environment variables for pg_dump
            env = os.environ.copy()
            env['PGPASSWORD'] = password
            
            # Run pg_dump
            cmd = [
                'pg_dump',
                '-h', host,
                '-p', port,
                '-U', username,
                '-d', database_name,
                '--no-password',
                '--verbose',
                '--clean',
                '--if-exists',
                '--create',
                '-f', temp_path
            ]
            
            logger.info(f"Running pg_dump for database: {database_name}")
            result = subprocess.run(cmd, env=env, capture_output=True, text=True)
            
            if result.returncode != 0:
                raise Exception(f"pg_dump failed: {result.stderr}")
            
            # Compress if requested
            if compress:
                compressed_path = temp_path + '.gz'
                with open(temp_path, 'rb') as f_in:
                    with gzip.open(compressed_path, 'wb') as f_out:
                        shutil.copyfileobj(f_in, f_out)
                os.unlink(temp_path)
                temp_path = compressed_path
            
            # Encrypt if requested
            final_path = self.database_backup_dir / f"{backup_id}.backup"
            salt = None
            if encrypt:
                final_path = final_path.with_suffix('.backup.enc')
                encryption_service = EncryptionService(self.encryption_password)
                checksum, salt = encryption_service.encrypt_file(temp_path, str(final_path))
            else:
                shutil.move(temp_path, str(final_path))
                checksum = self._calculate_checksum(str(final_path))
            
            # Clean up temp file
            if os.path.exists(temp_path):
                os.unlink(temp_path)
            
            # Get file size
            size_bytes = final_path.stat().st_size
            duration = (datetime.now() - start_time).total_seconds()
            
            # Create metadata
            metadata = BackupMetadata(
                backup_id=backup_id,
                backup_type='database',
                created_at=start_time,
                file_path=str(final_path),
                encrypted=encrypt,
                compressed=compress,
                size_bytes=size_bytes,
                checksum=checksum,
                database_name=database_name,
                encryption_salt=base64.b64encode(salt).decode() if salt else None
            )
            
            # Save metadata
            self._save_metadata(metadata)
            
            logger.info(f"Database backup completed: {backup_id} ({size_bytes} bytes)")
            
            return BackupResult(
                success=True,
                backup_id=backup_id,
                file_path=str(final_path),
                size_bytes=size_bytes,
                duration_seconds=duration,
                metadata=metadata
            )
            
        except Exception as e:
            duration = (datetime.now() - start_time).total_seconds()
            logger.error(f"Database backup failed: {e}")
            return BackupResult(
                success=False,
                backup_id=backup_id,
                file_path="",
                size_bytes=0,
                duration_seconds=duration,
                error_message=str(e)
            )
    
    def create_file_backup(self, 
                          source_path: str,
                          compress: bool = True,
                          encrypt: bool = True) -> BackupResult:
        """Create encrypted file system backup"""
        start_time = datetime.now()
        source_path_obj = Path(source_path)
        backup_id = f"files_{source_path_obj.name}_{start_time.strftime('%Y%m%d_%H%M%S')}"
        
        try:
            # Create temporary archive
            with tempfile.NamedTemporaryFile(mode='w+b', delete=False, suffix='.tar') as temp_file:
                temp_path = temp_file.name
            
            # Create tar archive
            import tarfile
            with tarfile.open(temp_path, 'w') as tar:
                tar.add(source_path, arcname=source_path_obj.name)
            
            # Compress if requested
            if compress:
                compressed_path = temp_path + '.gz'
                with open(temp_path, 'rb') as f_in:
                    with gzip.open(compressed_path, 'wb') as f_out:
                        shutil.copyfileobj(f_in, f_out)
                os.unlink(temp_path)
                temp_path = compressed_path
            
            # Encrypt if requested
            final_path = self.file_backup_dir / f"{backup_id}.backup"
            salt = None
            if encrypt:
                final_path = final_path.with_suffix('.backup.enc')
                encryption_service = EncryptionService(self.encryption_password)
                checksum, salt = encryption_service.encrypt_file(temp_path, str(final_path))
            else:
                shutil.move(temp_path, str(final_path))
                checksum = self._calculate_checksum(str(final_path))
            
            # Clean up temp file
            if os.path.exists(temp_path):
                os.unlink(temp_path)
            
            # Get file size
            size_bytes = final_path.stat().st_size
            duration = (datetime.now() - start_time).total_seconds()
            
            # Create metadata
            metadata = BackupMetadata(
                backup_id=backup_id,
                backup_type='files',
                created_at=start_time,
                file_path=str(final_path),
                encrypted=encrypt,
                compressed=compress,
                size_bytes=size_bytes,
                checksum=checksum,
                source_path=source_path,
                encryption_salt=base64.b64encode(salt).decode() if salt else None
            )
            
            # Save metadata
            self._save_metadata(metadata)
            
            logger.info(f"File backup completed: {backup_id} ({size_bytes} bytes)")
            
            return BackupResult(
                success=True,
                backup_id=backup_id,
                file_path=str(final_path),
                size_bytes=size_bytes,
                duration_seconds=duration,
                metadata=metadata
            )
            
        except Exception as e:
            duration = (datetime.now() - start_time).total_seconds()
            logger.error(f"File backup failed: {e}")
            return BackupResult(
                success=False,
                backup_id=backup_id,
                file_path="",
                size_bytes=0,
                duration_seconds=duration,
                error_message=str(e)
            )
    
    def create_full_backup(self, 
                          database_name: str = "goldshop",
                          file_paths: List[str] = None) -> List[BackupResult]:
        """Create full system backup (database + files)"""
        results = []
        
        # Default file paths to backup
        if file_paths is None:
            file_paths = ["/app/uploads", "/app/.env"]
        
        # Create database backup
        db_result = self.create_database_backup(database_name)
        results.append(db_result)
        
        # Create file backups
        for file_path in file_paths:
            if os.path.exists(file_path):
                file_result = self.create_file_backup(file_path)
                results.append(file_result)
            else:
                logger.warning(f"File path does not exist, skipping: {file_path}")
        
        return results
    
    def verify_backup(self, backup_id: str) -> VerificationResult:
        """Verify backup integrity and test restoration"""
        try:
            # Load metadata
            metadata = self._load_metadata(backup_id)
            if not metadata:
                return VerificationResult(
                    backup_id=backup_id,
                    integrity_check_passed=False,
                    restoration_test_passed=False,
                    checksum_verified=False,
                    error_message="Backup metadata not found"
                )
            
            # Verify file exists
            if not os.path.exists(metadata.file_path):
                return VerificationResult(
                    backup_id=backup_id,
                    integrity_check_passed=False,
                    restoration_test_passed=False,
                    checksum_verified=False,
                    error_message="Backup file not found"
                )
            
            # Verify checksum
            current_checksum = self._calculate_checksum(metadata.file_path)
            checksum_verified = current_checksum == metadata.checksum
            
            if not checksum_verified:
                return VerificationResult(
                    backup_id=backup_id,
                    integrity_check_passed=False,
                    restoration_test_passed=False,
                    checksum_verified=False,
                    error_message="Checksum verification failed"
                )
            
            # Test restoration
            restoration_test_passed = self._test_restoration(metadata)
            
            verification_details = {
                "file_size": os.path.getsize(metadata.file_path),
                "expected_size": metadata.size_bytes,
                "checksum_match": checksum_verified,
                "backup_type": metadata.backup_type,
                "encrypted": metadata.encrypted,
                "compressed": metadata.compressed
            }
            
            return VerificationResult(
                backup_id=backup_id,
                integrity_check_passed=True,
                restoration_test_passed=restoration_test_passed,
                checksum_verified=checksum_verified,
                verification_details=verification_details
            )
            
        except Exception as e:
            logger.error(f"Backup verification failed: {e}")
            return VerificationResult(
                backup_id=backup_id,
                integrity_check_passed=False,
                restoration_test_passed=False,
                checksum_verified=False,
                error_message=str(e)
            )
    
    def restore_backup(self, backup_id: str, restore_path: str) -> RestoreResult:
        """Restore backup to specified location"""
        start_time = datetime.now()
        
        try:
            # Load metadata
            metadata = self._load_metadata(backup_id)
            if not metadata:
                raise Exception("Backup metadata not found")
            
            # Create restore directory
            restore_path_obj = Path(restore_path)
            restore_path_obj.mkdir(parents=True, exist_ok=True)
            
            # Decrypt if encrypted
            if metadata.encrypted:
                with tempfile.NamedTemporaryFile(mode='w+b', delete=False) as temp_file:
                    temp_path = temp_file.name
                
                # Use static decryption method
                EncryptionService.decrypt_file_static(metadata.file_path, temp_path, self.encryption_password)
                working_file = temp_path
            else:
                working_file = metadata.file_path
            
            # Decompress if compressed
            if metadata.compressed:
                with tempfile.NamedTemporaryFile(mode='w+b', delete=False) as temp_file:
                    decompressed_path = temp_file.name
                
                with gzip.open(working_file, 'rb') as f_in:
                    with open(decompressed_path, 'wb') as f_out:
                        shutil.copyfileobj(f_in, f_out)
                
                if metadata.encrypted:
                    os.unlink(working_file)
                working_file = decompressed_path
            
            # Restore based on backup type
            if metadata.backup_type == 'database':
                self._restore_database(working_file, metadata.database_name, restore_path)
            elif metadata.backup_type == 'files':
                self._restore_files(working_file, restore_path)
            
            # Clean up temporary files
            if working_file != metadata.file_path:
                os.unlink(working_file)
            
            duration = (datetime.now() - start_time).total_seconds()
            
            logger.info(f"Backup restored successfully: {backup_id}")
            
            return RestoreResult(
                success=True,
                backup_id=backup_id,
                restored_to=restore_path,
                duration_seconds=duration
            )
            
        except Exception as e:
            duration = (datetime.now() - start_time).total_seconds()
            logger.error(f"Backup restoration failed: {e}")
            return RestoreResult(
                success=False,
                backup_id=backup_id,
                restored_to=restore_path,
                duration_seconds=duration,
                error_message=str(e)
            )
    
    def list_backups(self, backup_type: Optional[str] = None) -> List[BackupMetadata]:
        """List all available backups"""
        backups = []
        
        for metadata_file in self.metadata_dir.glob("*.json"):
            try:
                metadata = self._load_metadata(metadata_file.stem)
                if metadata and (backup_type is None or metadata.backup_type == backup_type):
                    backups.append(metadata)
            except Exception as e:
                logger.warning(f"Failed to load metadata for {metadata_file}: {e}")
        
        # Sort by creation date (newest first)
        backups.sort(key=lambda x: x.created_at, reverse=True)
        return backups
    
    def cleanup_old_backups(self, retention_days: int = 30) -> int:
        """Clean up backups older than retention period"""
        cutoff_date = datetime.now() - timedelta(days=retention_days)
        cleaned_count = 0
        
        for backup in self.list_backups():
            if backup.created_at < cutoff_date:
                try:
                    # Remove backup file
                    if os.path.exists(backup.file_path):
                        os.unlink(backup.file_path)
                    
                    # Remove metadata
                    metadata_path = self.metadata_dir / f"{backup.backup_id}.json"
                    if metadata_path.exists():
                        metadata_path.unlink()
                    
                    cleaned_count += 1
                    logger.info(f"Cleaned up old backup: {backup.backup_id}")
                    
                except Exception as e:
                    logger.error(f"Failed to clean up backup {backup.backup_id}: {e}")
        
        return cleaned_count
    
    def _save_metadata(self, metadata: BackupMetadata):
        """Save backup metadata to JSON file"""
        metadata_path = self.metadata_dir / f"{metadata.backup_id}.json"
        with open(metadata_path, 'w') as f:
            # Convert datetime to string for JSON serialization
            metadata_dict = asdict(metadata)
            metadata_dict['created_at'] = metadata.created_at.isoformat()
            json.dump(metadata_dict, f, indent=2)
    
    def _load_metadata(self, backup_id: str) -> Optional[BackupMetadata]:
        """Load backup metadata from JSON file"""
        metadata_path = self.metadata_dir / f"{backup_id}.json"
        if not metadata_path.exists():
            return None
        
        try:
            with open(metadata_path, 'r') as f:
                data = json.load(f)
            
            # Convert string back to datetime
            data['created_at'] = datetime.fromisoformat(data['created_at'])
            
            return BackupMetadata(**data)
        except Exception as e:
            logger.error(f"Failed to load metadata for {backup_id}: {e}")
            return None
    
    def _calculate_checksum(self, file_path: str) -> str:
        """Calculate SHA-256 checksum of file"""
        sha256_hash = hashlib.sha256()
        with open(file_path, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()
    
    def _test_restoration(self, metadata: BackupMetadata) -> bool:
        """Test backup restoration in temporary location"""
        try:
            with tempfile.TemporaryDirectory() as temp_dir:
                restore_result = self.restore_backup(metadata.backup_id, temp_dir)
                return restore_result.success
        except Exception as e:
            logger.error(f"Restoration test failed: {e}")
            return False
    
    def _restore_database(self, sql_file: str, database_name: str, restore_path: str):
        """Restore database from SQL file"""
        # In a real implementation, this would restore to a test database
        # For now, we'll just copy the SQL file to the restore path
        restore_file = Path(restore_path) / f"{database_name}_restored.sql"
        shutil.copy2(sql_file, restore_file)
        logger.info(f"Database backup copied to: {restore_file}")
    
    def _restore_files(self, tar_file: str, restore_path: str):
        """Restore files from tar archive"""
        import tarfile
        with tarfile.open(tar_file, 'r') as tar:
            tar.extractall(path=restore_path)
        logger.info(f"Files restored to: {restore_path}")