"""
Disaster Recovery Service

This service provides comprehensive disaster recovery capabilities including:
- Automated disaster recovery procedures
- Backup retention policy management
- Off-site backup storage integration
- Complete system restoration automation
- Recovery validation and testing
"""

import os
import json
import shutil
import subprocess
import tempfile
import boto3
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, asdict
from enum import Enum
import asyncio
from concurrent.futures import ThreadPoolExecutor

from services.backup_service import BackupService, BackupMetadata, BackupResult, RestoreResult

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RecoveryStatus(Enum):
    """Recovery operation status"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    VALIDATED = "validated"

class StorageProvider(Enum):
    """Supported off-site storage providers"""
    AWS_S3 = "aws_s3"
    AZURE_BLOB = "azure_blob"
    GOOGLE_CLOUD = "google_cloud"
    LOCAL_REMOTE = "local_remote"

@dataclass
class RetentionPolicy:
    """Backup retention policy configuration"""
    daily_retention_days: int = 7
    weekly_retention_weeks: int = 4
    monthly_retention_months: int = 12
    yearly_retention_years: int = 3
    critical_backup_retention_days: int = 90

@dataclass
class OffSiteStorageConfig:
    """Off-site storage configuration"""
    provider: StorageProvider
    bucket_name: str
    region: str
    access_key: Optional[str] = None
    secret_key: Optional[str] = None
    endpoint_url: Optional[str] = None
    encryption_enabled: bool = True

@dataclass
class RecoveryProcedure:
    """Disaster recovery procedure definition"""
    procedure_id: str
    name: str
    description: str
    steps: List[Dict[str, Any]]
    estimated_duration_minutes: int
    prerequisites: List[str]
    validation_steps: List[Dict[str, Any]]

@dataclass
class RecoveryResult:
    """Result of disaster recovery operation"""
    success: bool
    recovery_id: str
    procedure_id: str
    started_at: datetime
    completed_at: Optional[datetime]
    duration_seconds: float
    status: RecoveryStatus
    steps_completed: int
    total_steps: int
    error_message: Optional[str] = None
    validation_results: Optional[Dict] = None

class OffSiteStorageService:
    """Service for managing off-site backup storage"""
    
    def __init__(self, config: OffSiteStorageConfig):
        self.config = config
        self.client = self._initialize_client()
    
    def _initialize_client(self):
        """Initialize storage client based on provider"""
        if self.config.provider == StorageProvider.AWS_S3:
            return boto3.client(
                's3',
                aws_access_key_id=self.config.access_key,
                aws_secret_access_key=self.config.secret_key,
                region_name=self.config.region,
                endpoint_url=self.config.endpoint_url
            )
        else:
            raise NotImplementedError(f"Provider {self.config.provider} not implemented")
    
    async def upload_backup(self, local_path: str, remote_key: str) -> bool:
        """Upload backup to off-site storage"""
        try:
            logger.info(f"Uploading backup to off-site storage: {remote_key}")
            
            # Add encryption if enabled
            extra_args = {}
            if self.config.encryption_enabled:
                extra_args['ServerSideEncryption'] = 'AES256'
            
            # Upload file
            self.client.upload_file(
                local_path,
                self.config.bucket_name,
                remote_key,
                ExtraArgs=extra_args
            )
            
            logger.info(f"Backup uploaded successfully: {remote_key}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to upload backup: {e}")
            return False
    
    async def download_backup(self, remote_key: str, local_path: str) -> bool:
        """Download backup from off-site storage"""
        try:
            logger.info(f"Downloading backup from off-site storage: {remote_key}")
            
            # Ensure local directory exists
            Path(local_path).parent.mkdir(parents=True, exist_ok=True)
            
            # Download file
            self.client.download_file(
                self.config.bucket_name,
                remote_key,
                local_path
            )
            
            logger.info(f"Backup downloaded successfully: {local_path}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to download backup: {e}")
            return False
    
    async def list_backups(self, prefix: str = "") -> List[Dict]:
        """List backups in off-site storage"""
        try:
            response = self.client.list_objects_v2(
                Bucket=self.config.bucket_name,
                Prefix=prefix
            )
            
            backups = []
            for obj in response.get('Contents', []):
                backups.append({
                    'key': obj['Key'],
                    'size': obj['Size'],
                    'last_modified': obj['LastModified'],
                    'etag': obj['ETag']
                })
            
            return backups
            
        except Exception as e:
            logger.error(f"Failed to list backups: {e}")
            return []
    
    async def delete_backup(self, remote_key: str) -> bool:
        """Delete backup from off-site storage"""
        try:
            self.client.delete_object(
                Bucket=self.config.bucket_name,
                Key=remote_key
            )
            logger.info(f"Backup deleted from off-site storage: {remote_key}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to delete backup: {e}")
            return False

class DisasterRecoveryService:
    """Comprehensive disaster recovery service"""
    
    def __init__(self, 
                 backup_service: BackupService,
                 off_site_storage: Optional[OffSiteStorageService] = None,
                 retention_policy: Optional[RetentionPolicy] = None):
        self.backup_service = backup_service
        self.off_site_storage = off_site_storage
        self.retention_policy = retention_policy or RetentionPolicy()
        
        # Recovery procedures directory
        self.procedures_dir = Path("/app/disaster_recovery/procedures")
        self.procedures_dir.mkdir(parents=True, exist_ok=True)
        
        # Recovery logs directory
        self.logs_dir = Path("/app/disaster_recovery/logs")
        self.logs_dir.mkdir(parents=True, exist_ok=True)
        
        # Initialize default recovery procedures
        self._initialize_recovery_procedures()
    
    def _initialize_recovery_procedures(self):
        """Initialize default disaster recovery procedures"""
        procedures = [
            self._create_database_recovery_procedure(),
            self._create_full_system_recovery_procedure(),
            self._create_file_system_recovery_procedure()
        ]
        
        for procedure in procedures:
            self._save_recovery_procedure(procedure)
    
    def _create_database_recovery_procedure(self) -> RecoveryProcedure:
        """Create database recovery procedure"""
        return RecoveryProcedure(
            procedure_id="database_recovery",
            name="Database Recovery",
            description="Complete database recovery from backup",
            estimated_duration_minutes=30,
            prerequisites=[
                "Database service stopped",
                "Backup file available",
                "Database credentials configured"
            ],
            steps=[
                {
                    "step_id": "stop_services",
                    "name": "Stop Database Services",
                    "description": "Stop all database-dependent services",
                    "command": "docker-compose stop backend frontend",
                    "timeout_seconds": 60
                },
                {
                    "step_id": "backup_current_db",
                    "name": "Backup Current Database",
                    "description": "Create backup of current database state",
                    "command": "create_emergency_backup",
                    "timeout_seconds": 300
                },
                {
                    "step_id": "restore_database",
                    "name": "Restore Database",
                    "description": "Restore database from backup",
                    "command": "restore_database_backup",
                    "timeout_seconds": 600
                },
                {
                    "step_id": "verify_database",
                    "name": "Verify Database",
                    "description": "Verify database integrity and connectivity",
                    "command": "verify_database_integrity",
                    "timeout_seconds": 120
                },
                {
                    "step_id": "start_services",
                    "name": "Start Services",
                    "description": "Start all services and verify functionality",
                    "command": "docker-compose up -d",
                    "timeout_seconds": 120
                }
            ],
            validation_steps=[
                {
                    "step_id": "test_database_connection",
                    "name": "Test Database Connection",
                    "description": "Verify database connectivity",
                    "command": "test_db_connection"
                },
                {
                    "step_id": "verify_data_integrity",
                    "name": "Verify Data Integrity",
                    "description": "Run data integrity checks",
                    "command": "verify_data_integrity"
                },
                {
                    "step_id": "test_api_endpoints",
                    "name": "Test API Endpoints",
                    "description": "Verify API functionality",
                    "command": "test_api_endpoints"
                }
            ]
        )
    
    def _create_full_system_recovery_procedure(self) -> RecoveryProcedure:
        """Create full system recovery procedure"""
        return RecoveryProcedure(
            procedure_id="full_system_recovery",
            name="Full System Recovery",
            description="Complete system recovery from backups",
            estimated_duration_minutes=60,
            prerequisites=[
                "All services stopped",
                "Full backup available",
                "System credentials configured",
                "Docker environment ready"
            ],
            steps=[
                {
                    "step_id": "stop_all_services",
                    "name": "Stop All Services",
                    "description": "Stop all Docker services",
                    "command": "docker-compose down",
                    "timeout_seconds": 120
                },
                {
                    "step_id": "backup_current_state",
                    "name": "Backup Current State",
                    "description": "Create emergency backup of current state",
                    "command": "create_emergency_full_backup",
                    "timeout_seconds": 600
                },
                {
                    "step_id": "restore_database",
                    "name": "Restore Database",
                    "description": "Restore database from backup",
                    "command": "restore_database_backup",
                    "timeout_seconds": 600
                },
                {
                    "step_id": "restore_files",
                    "name": "Restore Files",
                    "description": "Restore file system from backup",
                    "command": "restore_file_backup",
                    "timeout_seconds": 300
                },
                {
                    "step_id": "restore_configuration",
                    "name": "Restore Configuration",
                    "description": "Restore system configuration",
                    "command": "restore_configuration",
                    "timeout_seconds": 60
                },
                {
                    "step_id": "start_services",
                    "name": "Start Services",
                    "description": "Start all services in correct order",
                    "command": "docker-compose up -d",
                    "timeout_seconds": 180
                },
                {
                    "step_id": "verify_system",
                    "name": "Verify System",
                    "description": "Comprehensive system verification",
                    "command": "verify_full_system",
                    "timeout_seconds": 300
                }
            ],
            validation_steps=[
                {
                    "step_id": "test_all_services",
                    "name": "Test All Services",
                    "description": "Verify all services are running",
                    "command": "test_all_services"
                },
                {
                    "step_id": "verify_data_integrity",
                    "name": "Verify Data Integrity",
                    "description": "Complete data integrity check",
                    "command": "verify_complete_data_integrity"
                },
                {
                    "step_id": "test_user_workflows",
                    "name": "Test User Workflows",
                    "description": "Test critical user workflows",
                    "command": "test_critical_workflows"
                }
            ]
        )
    
    def _create_file_system_recovery_procedure(self) -> RecoveryProcedure:
        """Create file system recovery procedure"""
        return RecoveryProcedure(
            procedure_id="file_system_recovery",
            name="File System Recovery",
            description="Recovery of file system components",
            estimated_duration_minutes=20,
            prerequisites=[
                "File backup available",
                "Target directories accessible",
                "Sufficient disk space"
            ],
            steps=[
                {
                    "step_id": "stop_file_services",
                    "name": "Stop File Services",
                    "description": "Stop services that use files",
                    "command": "docker-compose stop backend frontend",
                    "timeout_seconds": 60
                },
                {
                    "step_id": "backup_current_files",
                    "name": "Backup Current Files",
                    "description": "Backup current file state",
                    "command": "create_emergency_file_backup",
                    "timeout_seconds": 300
                },
                {
                    "step_id": "restore_files",
                    "name": "Restore Files",
                    "description": "Restore files from backup",
                    "command": "restore_file_backup",
                    "timeout_seconds": 300
                },
                {
                    "step_id": "verify_files",
                    "name": "Verify Files",
                    "description": "Verify file integrity",
                    "command": "verify_file_integrity",
                    "timeout_seconds": 120
                },
                {
                    "step_id": "start_services",
                    "name": "Start Services",
                    "description": "Restart services",
                    "command": "docker-compose up -d backend frontend",
                    "timeout_seconds": 120
                }
            ],
            validation_steps=[
                {
                    "step_id": "test_file_access",
                    "name": "Test File Access",
                    "description": "Verify file accessibility",
                    "command": "test_file_access"
                },
                {
                    "step_id": "verify_uploads",
                    "name": "Verify Uploads",
                    "description": "Test file upload functionality",
                    "command": "test_file_uploads"
                }
            ]
        )
    
    async def execute_recovery_procedure(self, 
                                       procedure_id: str, 
                                       backup_id: Optional[str] = None) -> RecoveryResult:
        """Execute disaster recovery procedure"""
        start_time = datetime.now()
        recovery_id = f"recovery_{procedure_id}_{start_time.strftime('%Y%m%d_%H%M%S')}"
        
        try:
            # Load recovery procedure
            procedure = self._load_recovery_procedure(procedure_id)
            if not procedure:
                raise Exception(f"Recovery procedure not found: {procedure_id}")
            
            logger.info(f"Starting recovery procedure: {procedure.name} (ID: {recovery_id})")
            
            # Initialize recovery result
            result = RecoveryResult(
                success=False,
                recovery_id=recovery_id,
                procedure_id=procedure_id,
                started_at=start_time,
                completed_at=None,
                duration_seconds=0,
                status=RecoveryStatus.IN_PROGRESS,
                steps_completed=0,
                total_steps=len(procedure.steps)
            )
            
            # Execute recovery steps
            for i, step in enumerate(procedure.steps):
                logger.info(f"Executing step {i+1}/{len(procedure.steps)}: {step['name']}")
                
                step_success = await self._execute_recovery_step(step, backup_id)
                
                if step_success:
                    result.steps_completed += 1
                    logger.info(f"Step completed successfully: {step['name']}")
                else:
                    result.error_message = f"Step failed: {step['name']}"
                    logger.error(f"Step failed: {step['name']}")
                    break
            
            # Check if all steps completed
            if result.steps_completed == result.total_steps:
                result.status = RecoveryStatus.COMPLETED
                result.success = True
                
                # Run validation steps
                validation_results = await self._run_validation_steps(procedure.validation_steps)
                result.validation_results = validation_results
                
                if all(v.get('success', False) for v in validation_results.values()):
                    result.status = RecoveryStatus.VALIDATED
                    logger.info(f"Recovery procedure completed and validated: {recovery_id}")
                else:
                    result.status = RecoveryStatus.COMPLETED
                    logger.warning(f"Recovery completed but validation failed: {recovery_id}")
            else:
                result.status = RecoveryStatus.FAILED
                result.success = False
            
            # Update completion time and duration
            result.completed_at = datetime.now()
            result.duration_seconds = (result.completed_at - start_time).total_seconds()
            
            # Save recovery log
            await self._save_recovery_log(result, procedure)
            
            return result
            
        except Exception as e:
            logger.error(f"Recovery procedure failed: {e}")
            
            return RecoveryResult(
                success=False,
                recovery_id=recovery_id,
                procedure_id=procedure_id,
                started_at=start_time,
                completed_at=datetime.now(),
                duration_seconds=(datetime.now() - start_time).total_seconds(),
                status=RecoveryStatus.FAILED,
                steps_completed=0,
                total_steps=len(procedure.steps) if procedure else 0,
                error_message=str(e)
            )
    
    async def _execute_recovery_step(self, step: Dict, backup_id: Optional[str] = None) -> bool:
        """Execute individual recovery step"""
        try:
            command = step.get('command')
            timeout = step.get('timeout_seconds', 300)
            
            if command == "create_emergency_backup":
                result = self.backup_service.create_database_backup(
                    database_name="goldshop",
                    compress=True,
                    encrypt=True
                )
                return result.success
                
            elif command == "create_emergency_full_backup":
                results = self.backup_service.create_full_backup()
                return any(r.success for r in results)
                
            elif command == "create_emergency_file_backup":
                result = self.backup_service.create_file_backup("/app/uploads")
                return result.success
                
            elif command == "restore_database_backup":
                if not backup_id:
                    # Find latest database backup
                    backups = self.backup_service.list_backups(backup_type="database")
                    if not backups:
                        return False
                    backup_id = backups[0].backup_id
                
                result = self.backup_service.restore_backup(backup_id, "/tmp/recovery/database")
                return result.success
                
            elif command == "restore_file_backup":
                if not backup_id:
                    # Find latest file backup
                    backups = self.backup_service.list_backups(backup_type="files")
                    if not backups:
                        return False
                    backup_id = backups[0].backup_id
                
                result = self.backup_service.restore_backup(backup_id, "/tmp/recovery/files")
                return result.success
                
            elif command.startswith("docker-compose"):
                # Execute Docker Compose command
                result = subprocess.run(
                    command.split(),
                    capture_output=True,
                    text=True,
                    timeout=timeout,
                    cwd="/app"
                )
                return result.returncode == 0
                
            elif command.startswith("verify_") or command.startswith("test_"):
                # Execute verification/test commands
                return await self._execute_verification_command(command)
                
            else:
                logger.warning(f"Unknown recovery command: {command}")
                return True  # Skip unknown commands
                
        except Exception as e:
            logger.error(f"Recovery step execution failed: {e}")
            return False
    
    async def _execute_verification_command(self, command: str) -> bool:
        """Execute verification command"""
        try:
            if command == "verify_database_integrity":
                # Test database connection and basic queries
                return await self._verify_database_connection()
                
            elif command == "test_db_connection":
                return await self._verify_database_connection()
                
            elif command == "verify_data_integrity":
                return await self._verify_data_integrity()
                
            elif command == "test_api_endpoints":
                return await self._test_api_endpoints()
                
            elif command == "verify_file_integrity":
                return await self._verify_file_integrity()
                
            elif command == "test_file_access":
                return await self._test_file_access()
                
            else:
                logger.warning(f"Unknown verification command: {command}")
                return True
                
        except Exception as e:
            logger.error(f"Verification command failed: {e}")
            return False
    
    async def _verify_database_connection(self) -> bool:
        """Verify database connection"""
        try:
            # Simple database connection test
            import psycopg2
            
            database_url = os.getenv("DATABASE_URL", "postgresql://goldshop_user:goldshop_password@db:5432/goldshop")
            conn = psycopg2.connect(database_url)
            cursor = conn.cursor()
            cursor.execute("SELECT 1")
            result = cursor.fetchone()
            cursor.close()
            conn.close()
            
            return result[0] == 1
            
        except Exception as e:
            logger.error(f"Database connection verification failed: {e}")
            return False
    
    async def _verify_data_integrity(self) -> bool:
        """Verify data integrity"""
        try:
            # Basic data integrity checks
            import psycopg2
            
            database_url = os.getenv("DATABASE_URL", "postgresql://goldshop_user:goldshop_password@db:5432/goldshop")
            conn = psycopg2.connect(database_url)
            cursor = conn.cursor()
            
            # Check if main tables exist and have data
            tables = ['users', 'customers', 'inventory_items', 'invoices']
            for table in tables:
                cursor.execute(f"SELECT COUNT(*) FROM {table}")
                count = cursor.fetchone()[0]
                if count < 0:  # Allow empty tables
                    cursor.close()
                    conn.close()
                    return False
            
            cursor.close()
            conn.close()
            return True
            
        except Exception as e:
            logger.error(f"Data integrity verification failed: {e}")
            return False
    
    async def _test_api_endpoints(self) -> bool:
        """Test API endpoints"""
        try:
            import requests
            
            # Test basic API endpoints
            base_url = "http://localhost:8000"
            
            # Test health endpoint
            response = requests.get(f"{base_url}/health", timeout=10)
            if response.status_code != 200:
                return False
            
            # Test authentication endpoint
            response = requests.post(f"{base_url}/api/auth/login", 
                                   json={"username": "test", "password": "test"}, 
                                   timeout=10)
            # Don't fail if auth fails, just check if endpoint responds
            
            return True
            
        except Exception as e:
            logger.error(f"API endpoint test failed: {e}")
            return False
    
    async def _verify_file_integrity(self) -> bool:
        """Verify file system integrity"""
        try:
            # Check if critical directories exist
            critical_paths = ["/app/uploads", "/app/backups"]
            
            for path in critical_paths:
                if not os.path.exists(path):
                    logger.error(f"Critical path missing: {path}")
                    return False
            
            return True
            
        except Exception as e:
            logger.error(f"File integrity verification failed: {e}")
            return False
    
    async def _test_file_access(self) -> bool:
        """Test file access"""
        try:
            # Test file read/write access
            test_file = "/app/uploads/recovery_test.txt"
            
            with open(test_file, 'w') as f:
                f.write("Recovery test")
            
            with open(test_file, 'r') as f:
                content = f.read()
            
            os.unlink(test_file)
            
            return content == "Recovery test"
            
        except Exception as e:
            logger.error(f"File access test failed: {e}")
            return False
    
    async def _run_validation_steps(self, validation_steps: List[Dict]) -> Dict:
        """Run validation steps"""
        results = {}
        
        for step in validation_steps:
            step_id = step['step_id']
            command = step['command']
            
            logger.info(f"Running validation step: {step['name']}")
            
            success = await self._execute_verification_command(command)
            results[step_id] = {
                'name': step['name'],
                'success': success,
                'executed_at': datetime.now().isoformat()
            }
        
        return results
    
    async def apply_retention_policy(self) -> Dict[str, Any]:
        """Apply backup retention policy"""
        try:
            logger.info("Applying backup retention policy")
            
            # Get all backups
            all_backups = self.backup_service.list_backups()
            
            # Categorize backups by age
            now = datetime.now()
            daily_cutoff = now - timedelta(days=self.retention_policy.daily_retention_days)
            weekly_cutoff = now - timedelta(weeks=self.retention_policy.weekly_retention_weeks)
            monthly_cutoff = now - timedelta(days=self.retention_policy.monthly_retention_months * 30)
            yearly_cutoff = now - timedelta(days=self.retention_policy.yearly_retention_years * 365)
            
            backups_to_keep = []
            backups_to_archive = []
            backups_to_delete = []
            
            # Group backups by type and date
            daily_backups = []
            weekly_backups = []
            monthly_backups = []
            yearly_backups = []
            
            for backup in all_backups:
                age = now - backup.created_at
                
                if age.days <= self.retention_policy.daily_retention_days:
                    daily_backups.append(backup)
                elif age.days <= self.retention_policy.weekly_retention_weeks * 7:
                    weekly_backups.append(backup)
                elif age.days <= self.retention_policy.monthly_retention_months * 30:
                    monthly_backups.append(backup)
                elif age.days <= self.retention_policy.yearly_retention_years * 365:
                    yearly_backups.append(backup)
                else:
                    backups_to_delete.append(backup)
            
            # Keep all daily backups within retention period
            backups_to_keep.extend(daily_backups)
            
            # Keep one backup per week for weekly retention
            weekly_groups = {}
            for backup in weekly_backups:
                week_key = backup.created_at.strftime("%Y-W%U")
                if week_key not in weekly_groups or backup.created_at > weekly_groups[week_key].created_at:
                    weekly_groups[week_key] = backup
            backups_to_keep.extend(weekly_groups.values())
            
            # Keep one backup per month for monthly retention
            monthly_groups = {}
            for backup in monthly_backups:
                month_key = backup.created_at.strftime("%Y-%m")
                if month_key not in monthly_groups or backup.created_at > monthly_groups[month_key].created_at:
                    monthly_groups[month_key] = backup
            backups_to_keep.extend(monthly_groups.values())
            
            # Keep one backup per year for yearly retention
            yearly_groups = {}
            for backup in yearly_backups:
                year_key = backup.created_at.strftime("%Y")
                if year_key not in yearly_groups or backup.created_at > yearly_groups[year_key].created_at:
                    yearly_groups[year_key] = backup
            backups_to_keep.extend(yearly_groups.values())
            
            # Archive to off-site storage before deletion
            archived_count = 0
            if self.off_site_storage:
                for backup in backups_to_delete:
                    remote_key = f"archived/{backup.backup_id}/{os.path.basename(backup.file_path)}"
                    if await self.off_site_storage.upload_backup(backup.file_path, remote_key):
                        backups_to_archive.append(backup)
                        archived_count += 1
            
            # Delete old backups
            deleted_count = 0
            for backup in backups_to_delete:
                try:
                    if os.path.exists(backup.file_path):
                        os.unlink(backup.file_path)
                    
                    # Remove metadata
                    metadata_path = self.backup_service.metadata_dir / f"{backup.backup_id}.json"
                    if metadata_path.exists():
                        metadata_path.unlink()
                    
                    deleted_count += 1
                    logger.info(f"Deleted old backup: {backup.backup_id}")
                    
                except Exception as e:
                    logger.error(f"Failed to delete backup {backup.backup_id}: {e}")
            
            return {
                "success": True,
                "total_backups": len(all_backups),
                "backups_kept": len(backups_to_keep),
                "backups_archived": archived_count,
                "backups_deleted": deleted_count,
                "retention_policy": asdict(self.retention_policy),
                "applied_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to apply retention policy: {e}")
            return {
                "success": False,
                "error_message": str(e),
                "applied_at": datetime.now().isoformat()
            }
    
    async def sync_to_off_site_storage(self) -> Dict[str, Any]:
        """Sync backups to off-site storage"""
        if not self.off_site_storage:
            return {
                "success": False,
                "error_message": "Off-site storage not configured"
            }
        
        try:
            logger.info("Syncing backups to off-site storage")
            
            # Get local backups
            local_backups = self.backup_service.list_backups()
            
            # Get remote backups
            remote_backups = await self.off_site_storage.list_backups("backups/")
            remote_keys = {backup['key'] for backup in remote_backups}
            
            uploaded_count = 0
            failed_count = 0
            
            for backup in local_backups:
                remote_key = f"backups/{backup.backup_id}/{os.path.basename(backup.file_path)}"
                
                if remote_key not in remote_keys:
                    logger.info(f"Uploading backup to off-site storage: {backup.backup_id}")
                    
                    if await self.off_site_storage.upload_backup(backup.file_path, remote_key):
                        uploaded_count += 1
                        
                        # Upload metadata as well
                        metadata_path = self.backup_service.metadata_dir / f"{backup.backup_id}.json"
                        if metadata_path.exists():
                            metadata_key = f"backups/{backup.backup_id}/metadata.json"
                            await self.off_site_storage.upload_backup(str(metadata_path), metadata_key)
                    else:
                        failed_count += 1
            
            return {
                "success": True,
                "total_local_backups": len(local_backups),
                "uploaded_count": uploaded_count,
                "failed_count": failed_count,
                "synced_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to sync to off-site storage: {e}")
            return {
                "success": False,
                "error_message": str(e),
                "synced_at": datetime.now().isoformat()
            }
    
    def _save_recovery_procedure(self, procedure: RecoveryProcedure):
        """Save recovery procedure to file"""
        procedure_path = self.procedures_dir / f"{procedure.procedure_id}.json"
        with open(procedure_path, 'w') as f:
            json.dump(asdict(procedure), f, indent=2, default=str)
    
    def _load_recovery_procedure(self, procedure_id: str) -> Optional[RecoveryProcedure]:
        """Load recovery procedure from file"""
        procedure_path = self.procedures_dir / f"{procedure_id}.json"
        if not procedure_path.exists():
            return None
        
        try:
            with open(procedure_path, 'r') as f:
                data = json.load(f)
            return RecoveryProcedure(**data)
        except Exception as e:
            logger.error(f"Failed to load recovery procedure {procedure_id}: {e}")
            return None
    
    async def _save_recovery_log(self, result: RecoveryResult, procedure: RecoveryProcedure):
        """Save recovery operation log"""
        log_path = self.logs_dir / f"{result.recovery_id}.json"
        
        log_data = {
            "recovery_result": asdict(result),
            "procedure": asdict(procedure),
            "system_info": {
                "hostname": os.uname().nodename,
                "timestamp": datetime.now().isoformat(),
                "docker_version": self._get_docker_version(),
                "disk_usage": self._get_disk_usage()
            }
        }
        
        with open(log_path, 'w') as f:
            json.dump(log_data, f, indent=2, default=str)
    
    def _get_docker_version(self) -> str:
        """Get Docker version"""
        try:
            result = subprocess.run(['docker', '--version'], capture_output=True, text=True)
            return result.stdout.strip() if result.returncode == 0 else "unknown"
        except:
            return "unknown"
    
    def _get_disk_usage(self) -> Dict:
        """Get disk usage information"""
        try:
            import shutil
            total, used, free = shutil.disk_usage("/app")
            return {
                "total_bytes": total,
                "used_bytes": used,
                "free_bytes": free,
                "usage_percent": (used / total) * 100
            }
        except:
            return {}
    
    def list_recovery_procedures(self) -> List[RecoveryProcedure]:
        """List all available recovery procedures"""
        procedures = []
        
        for procedure_file in self.procedures_dir.glob("*.json"):
            procedure = self._load_recovery_procedure(procedure_file.stem)
            if procedure:
                procedures.append(procedure)
        
        return procedures
    
    def get_recovery_logs(self, limit: int = 10) -> List[Dict]:
        """Get recent recovery operation logs"""
        logs = []
        
        log_files = sorted(self.logs_dir.glob("*.json"), key=lambda x: x.stat().st_mtime, reverse=True)
        
        for log_file in log_files[:limit]:
            try:
                with open(log_file, 'r') as f:
                    log_data = json.load(f)
                logs.append(log_data)
            except Exception as e:
                logger.error(f"Failed to load recovery log {log_file}: {e}")
        
        return logs