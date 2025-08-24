"""
Celery tasks for automated backup operations

This module provides scheduled backup tasks that can be run automatically
using Celery beat scheduler for regular backup operations.
"""

import os
import logging
from datetime import datetime
from typing import List, Dict, Any
from celery import Celery
from celery.utils.log import get_task_logger

from services.backup_service import BackupService, BackupResult

# Configure logging
logger = get_task_logger(__name__)

# Initialize Celery app (will be configured by main celery_app.py)
celery_app = Celery('backup_tasks')

@celery_app.task(bind=True, name='backup_tasks.create_scheduled_database_backup')
def create_scheduled_database_backup(self, 
                                   database_name: str = "goldshop",
                                   compress: bool = True,
                                   encrypt: bool = True) -> Dict[str, Any]:
    """
    Scheduled task to create database backup
    
    Args:
        database_name: Name of database to backup
        compress: Whether to compress the backup
        encrypt: Whether to encrypt the backup
        
    Returns:
        Dict containing backup result information
    """
    try:
        logger.info(f"Starting scheduled database backup for: {database_name}")
        
        # Initialize backup service
        database_url = os.getenv("DATABASE_URL", "postgresql://goldshop_user:goldshop_password@db:5432/goldshop")
        backup_service = BackupService(
            database_url=database_url,
            backup_directory=os.getenv("BACKUP_DIRECTORY", "/app/backups"),
            encryption_password=os.getenv("BACKUP_ENCRYPTION_PASSWORD")
        )
        
        # Create database backup
        result = backup_service.create_database_backup(
            database_name=database_name,
            compress=compress,
            encrypt=encrypt
        )
        
        if result.success:
            logger.info(f"Database backup completed successfully: {result.backup_id}")
            
            # Verify backup integrity
            verification_result = backup_service.verify_backup(result.backup_id)
            
            return {
                "success": True,
                "backup_id": result.backup_id,
                "file_path": result.file_path,
                "size_bytes": result.size_bytes,
                "duration_seconds": result.duration_seconds,
                "verification_passed": verification_result.integrity_check_passed,
                "checksum_verified": verification_result.checksum_verified,
                "created_at": datetime.now().isoformat()
            }
        else:
            logger.error(f"Database backup failed: {result.error_message}")
            return {
                "success": False,
                "error_message": result.error_message,
                "duration_seconds": result.duration_seconds,
                "created_at": datetime.now().isoformat()
            }
            
    except Exception as e:
        logger.error(f"Scheduled database backup task failed: {e}")
        return {
            "success": False,
            "error_message": str(e),
            "created_at": datetime.now().isoformat()
        }

@celery_app.task(bind=True, name='backup_tasks.create_scheduled_file_backup')
def create_scheduled_file_backup(self,
                                file_paths: List[str] = None,
                                compress: bool = True,
                                encrypt: bool = True) -> Dict[str, Any]:
    """
    Scheduled task to create file system backup
    
    Args:
        file_paths: List of file paths to backup
        compress: Whether to compress the backup
        encrypt: Whether to encrypt the backup
        
    Returns:
        Dict containing backup results information
    """
    try:
        logger.info("Starting scheduled file system backup")
        
        # Default file paths if none provided
        if file_paths is None:
            file_paths = [
                "/app/uploads",
                "/app/.env",
                "/app/backend/alembic",
                "/app/backend/analytics_tasks"
            ]
        
        # Initialize backup service
        database_url = os.getenv("DATABASE_URL", "postgresql://goldshop_user:goldshop_password@db:5432/goldshop")
        backup_service = BackupService(
            database_url=database_url,
            backup_directory=os.getenv("BACKUP_DIRECTORY", "/app/backups"),
            encryption_password=os.getenv("BACKUP_ENCRYPTION_PASSWORD")
        )
        
        results = []
        total_size = 0
        successful_backups = 0
        
        # Create backup for each file path
        for file_path in file_paths:
            if os.path.exists(file_path):
                logger.info(f"Creating backup for: {file_path}")
                
                result = backup_service.create_file_backup(
                    source_path=file_path,
                    compress=compress,
                    encrypt=encrypt
                )
                
                if result.success:
                    # Verify backup
                    verification_result = backup_service.verify_backup(result.backup_id)
                    
                    results.append({
                        "success": True,
                        "backup_id": result.backup_id,
                        "source_path": file_path,
                        "file_path": result.file_path,
                        "size_bytes": result.size_bytes,
                        "duration_seconds": result.duration_seconds,
                        "verification_passed": verification_result.integrity_check_passed,
                        "checksum_verified": verification_result.checksum_verified
                    })
                    
                    total_size += result.size_bytes
                    successful_backups += 1
                    logger.info(f"File backup completed: {result.backup_id}")
                    
                else:
                    results.append({
                        "success": False,
                        "source_path": file_path,
                        "error_message": result.error_message,
                        "duration_seconds": result.duration_seconds
                    })
                    logger.error(f"File backup failed for {file_path}: {result.error_message}")
            else:
                logger.warning(f"File path does not exist, skipping: {file_path}")
                results.append({
                    "success": False,
                    "source_path": file_path,
                    "error_message": "Path does not exist",
                    "duration_seconds": 0
                })
        
        return {
            "success": successful_backups > 0,
            "total_backups": len(file_paths),
            "successful_backups": successful_backups,
            "failed_backups": len(file_paths) - successful_backups,
            "total_size_bytes": total_size,
            "results": results,
            "created_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Scheduled file backup task failed: {e}")
        return {
            "success": False,
            "error_message": str(e),
            "created_at": datetime.now().isoformat()
        }

@celery_app.task(bind=True, name='backup_tasks.create_scheduled_full_backup')
def create_scheduled_full_backup(self,
                                database_name: str = "goldshop",
                                file_paths: List[str] = None,
                                compress: bool = True,
                                encrypt: bool = True) -> Dict[str, Any]:
    """
    Scheduled task to create full system backup (database + files)
    
    Args:
        database_name: Name of database to backup
        file_paths: List of file paths to backup
        compress: Whether to compress backups
        encrypt: Whether to encrypt backups
        
    Returns:
        Dict containing full backup results
    """
    try:
        logger.info("Starting scheduled full system backup")
        
        # Initialize backup service
        database_url = os.getenv("DATABASE_URL", "postgresql://goldshop_user:goldshop_password@db:5432/goldshop")
        backup_service = BackupService(
            database_url=database_url,
            backup_directory=os.getenv("BACKUP_DIRECTORY", "/app/backups"),
            encryption_password=os.getenv("BACKUP_ENCRYPTION_PASSWORD")
        )
        
        # Default file paths if none provided
        if file_paths is None:
            file_paths = [
                "/app/uploads",
                "/app/.env",
                "/app/backend/alembic"
            ]
        
        # Create full backup
        results = backup_service.create_full_backup(
            database_name=database_name,
            file_paths=file_paths
        )
        
        # Process results
        successful_backups = 0
        total_size = 0
        backup_details = []
        
        for result in results:
            if result.success:
                # Verify each backup
                verification_result = backup_service.verify_backup(result.backup_id)
                
                backup_details.append({
                    "success": True,
                    "backup_id": result.backup_id,
                    "backup_type": result.metadata.backup_type,
                    "file_path": result.file_path,
                    "size_bytes": result.size_bytes,
                    "duration_seconds": result.duration_seconds,
                    "verification_passed": verification_result.integrity_check_passed,
                    "checksum_verified": verification_result.checksum_verified
                })
                
                successful_backups += 1
                total_size += result.size_bytes
                logger.info(f"Backup completed: {result.backup_id} ({result.metadata.backup_type})")
                
            else:
                backup_details.append({
                    "success": False,
                    "backup_type": "unknown",
                    "error_message": result.error_message,
                    "duration_seconds": result.duration_seconds
                })
                logger.error(f"Backup failed: {result.error_message}")
        
        return {
            "success": successful_backups > 0,
            "total_backups": len(results),
            "successful_backups": successful_backups,
            "failed_backups": len(results) - successful_backups,
            "total_size_bytes": total_size,
            "backup_details": backup_details,
            "created_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Scheduled full backup task failed: {e}")
        return {
            "success": False,
            "error_message": str(e),
            "created_at": datetime.now().isoformat()
        }

@celery_app.task(bind=True, name='backup_tasks.verify_all_backups')
def verify_all_backups(self) -> Dict[str, Any]:
    """
    Scheduled task to verify integrity of all existing backups
    
    Returns:
        Dict containing verification results for all backups
    """
    try:
        logger.info("Starting backup verification task")
        
        # Initialize backup service
        database_url = os.getenv("DATABASE_URL", "postgresql://goldshop_user:goldshop_password@db:5432/goldshop")
        backup_service = BackupService(
            database_url=database_url,
            backup_directory=os.getenv("BACKUP_DIRECTORY", "/app/backups"),
            encryption_password=os.getenv("BACKUP_ENCRYPTION_PASSWORD")
        )
        
        # Get all backups
        all_backups = backup_service.list_backups()
        
        verification_results = []
        passed_verifications = 0
        failed_verifications = 0
        
        for backup in all_backups:
            logger.info(f"Verifying backup: {backup.backup_id}")
            
            verification_result = backup_service.verify_backup(backup.backup_id)
            
            result_data = {
                "backup_id": backup.backup_id,
                "backup_type": backup.backup_type,
                "created_at": backup.created_at.isoformat(),
                "integrity_check_passed": verification_result.integrity_check_passed,
                "restoration_test_passed": verification_result.restoration_test_passed,
                "checksum_verified": verification_result.checksum_verified,
                "file_size_bytes": backup.size_bytes
            }
            
            if verification_result.error_message:
                result_data["error_message"] = verification_result.error_message
            
            if verification_result.verification_details:
                result_data["verification_details"] = verification_result.verification_details
            
            verification_results.append(result_data)
            
            if (verification_result.integrity_check_passed and 
                verification_result.checksum_verified):
                passed_verifications += 1
                logger.info(f"Backup verification passed: {backup.backup_id}")
            else:
                failed_verifications += 1
                logger.warning(f"Backup verification failed: {backup.backup_id}")
        
        return {
            "success": True,
            "total_backups": len(all_backups),
            "passed_verifications": passed_verifications,
            "failed_verifications": failed_verifications,
            "verification_results": verification_results,
            "verified_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Backup verification task failed: {e}")
        return {
            "success": False,
            "error_message": str(e),
            "verified_at": datetime.now().isoformat()
        }

@celery_app.task(bind=True, name='backup_tasks.cleanup_old_backups')
def cleanup_old_backups(self, retention_days: int = 30) -> Dict[str, Any]:
    """
    Scheduled task to clean up old backups based on retention policy
    
    Args:
        retention_days: Number of days to retain backups
        
    Returns:
        Dict containing cleanup results
    """
    try:
        logger.info(f"Starting backup cleanup task (retention: {retention_days} days)")
        
        # Initialize backup service
        database_url = os.getenv("DATABASE_URL", "postgresql://goldshop_user:goldshop_password@db:5432/goldshop")
        backup_service = BackupService(
            database_url=database_url,
            backup_directory=os.getenv("BACKUP_DIRECTORY", "/app/backups"),
            encryption_password=os.getenv("BACKUP_ENCRYPTION_PASSWORD")
        )
        
        # Get backups before cleanup
        backups_before = backup_service.list_backups()
        total_size_before = sum(backup.size_bytes for backup in backups_before)
        
        # Perform cleanup
        cleaned_count = backup_service.cleanup_old_backups(retention_days=retention_days)
        
        # Get backups after cleanup
        backups_after = backup_service.list_backups()
        total_size_after = sum(backup.size_bytes for backup in backups_after)
        
        space_freed = total_size_before - total_size_after
        
        logger.info(f"Backup cleanup completed: {cleaned_count} backups removed, {space_freed} bytes freed")
        
        return {
            "success": True,
            "retention_days": retention_days,
            "backups_before_cleanup": len(backups_before),
            "backups_after_cleanup": len(backups_after),
            "backups_cleaned": cleaned_count,
            "space_freed_bytes": space_freed,
            "total_size_before": total_size_before,
            "total_size_after": total_size_after,
            "cleaned_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Backup cleanup task failed: {e}")
        return {
            "success": False,
            "error_message": str(e),
            "cleaned_at": datetime.now().isoformat()
        }

# Periodic task configuration for Celery Beat
# This would be configured in the main celery configuration
BACKUP_SCHEDULE = {
    # Daily full backup at 2 AM
    'daily-full-backup': {
        'task': 'backup_tasks.create_scheduled_full_backup',
        'schedule': 60 * 60 * 24,  # 24 hours
        'options': {
            'expires': 60 * 60 * 2,  # Expire after 2 hours if not executed
        }
    },
    
    # Hourly database backup
    'hourly-database-backup': {
        'task': 'backup_tasks.create_scheduled_database_backup',
        'schedule': 60 * 60,  # 1 hour
        'options': {
            'expires': 60 * 30,  # Expire after 30 minutes if not executed
        }
    },
    
    # Daily backup verification at 3 AM
    'daily-backup-verification': {
        'task': 'backup_tasks.verify_all_backups',
        'schedule': 60 * 60 * 24,  # 24 hours
        'options': {
            'expires': 60 * 60,  # Expire after 1 hour if not executed
        }
    },
    
    # Weekly cleanup of old backups (Sundays at 4 AM)
    'weekly-backup-cleanup': {
        'task': 'backup_tasks.cleanup_old_backups',
        'schedule': 60 * 60 * 24 * 7,  # 7 days
        'kwargs': {'retention_days': 30},
        'options': {
            'expires': 60 * 60,  # Expire after 1 hour if not executed
        }
    }
}