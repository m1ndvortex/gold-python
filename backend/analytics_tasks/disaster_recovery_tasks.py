"""
Celery tasks for automated disaster recovery operations

This module provides scheduled disaster recovery tasks including:
- Automated retention policy application
- Off-site storage synchronization
- Recovery procedure testing
- System health monitoring for disaster recovery
"""

import os
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from celery import Celery
from celery.utils.log import get_task_logger

from services.backup_service import BackupService
from services.disaster_recovery_service import (
    DisasterRecoveryService,
    OffSiteStorageService,
    OffSiteStorageConfig,
    RetentionPolicy,
    StorageProvider
)

# Configure logging
logger = get_task_logger(__name__)

# Initialize Celery app (will be configured by main celery_app.py)
celery_app = Celery('disaster_recovery_tasks')

def get_disaster_recovery_service() -> DisasterRecoveryService:
    """Get disaster recovery service instance"""
    # Initialize backup service
    database_url = os.getenv("DATABASE_URL", "postgresql://goldshop_user:goldshop_password@db:5432/goldshop")
    backup_service = BackupService(
        database_url=database_url,
        backup_directory=os.getenv("BACKUP_DIRECTORY", "/app/backups"),
        encryption_password=os.getenv("BACKUP_ENCRYPTION_PASSWORD")
    )
    
    # Initialize off-site storage if configured
    off_site_storage = None
    if os.getenv("OFFSITE_STORAGE_PROVIDER"):
        try:
            config = OffSiteStorageConfig(
                provider=StorageProvider(os.getenv("OFFSITE_STORAGE_PROVIDER")),
                bucket_name=os.getenv("OFFSITE_STORAGE_BUCKET", ""),
                region=os.getenv("OFFSITE_STORAGE_REGION", ""),
                access_key=os.getenv("OFFSITE_STORAGE_ACCESS_KEY"),
                secret_key=os.getenv("OFFSITE_STORAGE_SECRET_KEY"),
                endpoint_url=os.getenv("OFFSITE_STORAGE_ENDPOINT"),
                encryption_enabled=os.getenv("OFFSITE_STORAGE_ENCRYPTION", "true").lower() == "true"
            )
            off_site_storage = OffSiteStorageService(config)
        except Exception as e:
            logger.warning(f"Failed to initialize off-site storage: {e}")
    
    # Initialize retention policy
    retention_policy = RetentionPolicy(
        daily_retention_days=int(os.getenv("RETENTION_DAILY_DAYS", "7")),
        weekly_retention_weeks=int(os.getenv("RETENTION_WEEKLY_WEEKS", "4")),
        monthly_retention_months=int(os.getenv("RETENTION_MONTHLY_MONTHS", "12")),
        yearly_retention_years=int(os.getenv("RETENTION_YEARLY_YEARS", "3")),
        critical_backup_retention_days=int(os.getenv("RETENTION_CRITICAL_DAYS", "90"))
    )
    
    return DisasterRecoveryService(
        backup_service=backup_service,
        off_site_storage=off_site_storage,
        retention_policy=retention_policy
    )

@celery_app.task(bind=True, name='disaster_recovery_tasks.apply_retention_policy')
def apply_retention_policy(self) -> Dict[str, Any]:
    """
    Scheduled task to apply backup retention policy
    
    Returns:
        Dict containing retention policy application results
    """
    try:
        logger.info("Starting automated retention policy application")
        
        dr_service = get_disaster_recovery_service()
        result = dr_service.apply_retention_policy()
        
        if result["success"]:
            logger.info(f"Retention policy applied successfully: "
                       f"{result['backups_deleted']} backups deleted, "
                       f"{result['backups_archived']} backups archived")
        else:
            logger.error(f"Retention policy application failed: {result.get('error_message')}")
        
        return result
        
    except Exception as e:
        logger.error(f"Retention policy task failed: {e}")
        return {
            "success": False,
            "error_message": str(e),
            "applied_at": datetime.now().isoformat()
        }

@celery_app.task(bind=True, name='disaster_recovery_tasks.sync_to_offsite_storage')
def sync_to_offsite_storage(self) -> Dict[str, Any]:
    """
    Scheduled task to sync backups to off-site storage
    
    Returns:
        Dict containing synchronization results
    """
    try:
        logger.info("Starting off-site storage synchronization")
        
        dr_service = get_disaster_recovery_service()
        
        if not dr_service.off_site_storage:
            logger.warning("Off-site storage not configured, skipping sync")
            return {
                "success": False,
                "error_message": "Off-site storage not configured",
                "synced_at": datetime.now().isoformat()
            }
        
        result = dr_service.sync_to_off_site_storage()
        
        if result["success"]:
            logger.info(f"Off-site sync completed: "
                       f"{result['uploaded_count']} backups uploaded, "
                       f"{result['failed_count']} failed")
        else:
            logger.error(f"Off-site sync failed: {result.get('error_message')}")
        
        return result
        
    except Exception as e:
        logger.error(f"Off-site storage sync task failed: {e}")
        return {
            "success": False,
            "error_message": str(e),
            "synced_at": datetime.now().isoformat()
        }

@celery_app.task(bind=True, name='disaster_recovery_tasks.test_recovery_procedures')
def test_recovery_procedures(self, procedure_ids: Optional[List[str]] = None) -> Dict[str, Any]:
    """
    Scheduled task to test disaster recovery procedures
    
    Args:
        procedure_ids: List of procedure IDs to test (all if None)
        
    Returns:
        Dict containing test results
    """
    try:
        logger.info("Starting recovery procedures testing")
        
        dr_service = get_disaster_recovery_service()
        
        if procedure_ids is None:
            procedures = dr_service.list_recovery_procedures()
            procedure_ids = [p.procedure_id for p in procedures]
        
        test_results = {}
        successful_tests = 0
        failed_tests = 0
        
        for procedure_id in procedure_ids:
            logger.info(f"Testing recovery procedure: {procedure_id}")
            
            try:
                procedure = dr_service._load_recovery_procedure(procedure_id)
                if not procedure:
                    test_results[procedure_id] = {
                        "test_status": "failed",
                        "error": "Procedure not found",
                        "tested_at": datetime.now().isoformat()
                    }
                    failed_tests += 1
                    continue
                
                # Perform basic validation tests
                validation_results = {
                    "procedure_exists": True,
                    "steps_defined": len(procedure.steps) > 0,
                    "validation_steps_defined": len(procedure.validation_steps) > 0,
                    "prerequisites_defined": len(procedure.prerequisites) > 0
                }
                
                # Test backup availability for procedures that need it
                backup_available = True
                if "database" in procedure_id:
                    db_backups = dr_service.backup_service.list_backups(backup_type="database")
                    backup_available = len(db_backups) > 0
                elif "file" in procedure_id:
                    file_backups = dr_service.backup_service.list_backups(backup_type="files")
                    backup_available = len(file_backups) > 0
                elif "full" in procedure_id:
                    all_backups = dr_service.backup_service.list_backups()
                    backup_available = len(all_backups) > 0
                
                validation_results["backup_available"] = backup_available
                
                # Overall test status
                all_checks_passed = all(validation_results.values())
                
                test_results[procedure_id] = {
                    "procedure_name": procedure.name,
                    "test_status": "passed" if all_checks_passed else "warning",
                    "validation_results": validation_results,
                    "estimated_duration_minutes": procedure.estimated_duration_minutes,
                    "total_steps": len(procedure.steps),
                    "tested_at": datetime.now().isoformat()
                }
                
                if all_checks_passed:
                    successful_tests += 1
                    logger.info(f"Recovery procedure test passed: {procedure_id}")
                else:
                    failed_tests += 1
                    logger.warning(f"Recovery procedure test had warnings: {procedure_id}")
                
            except Exception as e:
                test_results[procedure_id] = {
                    "test_status": "failed",
                    "error": str(e),
                    "tested_at": datetime.now().isoformat()
                }
                failed_tests += 1
                logger.error(f"Recovery procedure test failed for {procedure_id}: {e}")
        
        overall_success = failed_tests == 0
        
        logger.info(f"Recovery procedures testing completed: "
                   f"{successful_tests} passed, {failed_tests} failed")
        
        return {
            "success": overall_success,
            "total_procedures_tested": len(procedure_ids),
            "successful_tests": successful_tests,
            "failed_tests": failed_tests,
            "test_results": test_results,
            "tested_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Recovery procedures testing task failed: {e}")
        return {
            "success": False,
            "error_message": str(e),
            "tested_at": datetime.now().isoformat()
        }

@celery_app.task(bind=True, name='disaster_recovery_tasks.monitor_system_health')
def monitor_system_health(self) -> Dict[str, Any]:
    """
    Scheduled task to monitor system health for disaster recovery readiness
    
    Returns:
        Dict containing system health monitoring results
    """
    try:
        logger.info("Starting system health monitoring for disaster recovery")
        
        dr_service = get_disaster_recovery_service()
        
        health_checks = {}
        overall_health = True
        
        # Check backup system health
        try:
            backups = dr_service.backup_service.list_backups()
            recent_backups = [b for b in backups if (datetime.now() - b.created_at).days <= 1]
            
            health_checks["backup_system"] = {
                "status": "healthy" if len(recent_backups) > 0 else "warning",
                "total_backups": len(backups),
                "recent_backups": len(recent_backups),
                "latest_backup": backups[0].created_at.isoformat() if backups else None,
                "message": "Recent backups available" if recent_backups else "No recent backups found"
            }
            
            if len(recent_backups) == 0:
                overall_health = False
                
        except Exception as e:
            health_checks["backup_system"] = {
                "status": "error",
                "error": str(e)
            }
            overall_health = False
        
        # Check off-site storage health
        try:
            if dr_service.off_site_storage:
                remote_backups = dr_service.off_site_storage.list_backups("backups/")
                
                health_checks["offsite_storage"] = {
                    "status": "healthy",
                    "configured": True,
                    "remote_backups_count": len(remote_backups),
                    "provider": dr_service.off_site_storage.config.provider.value,
                    "message": f"Off-site storage operational with {len(remote_backups)} backups"
                }
            else:
                health_checks["offsite_storage"] = {
                    "status": "warning",
                    "configured": False,
                    "message": "Off-site storage not configured"
                }
                
        except Exception as e:
            health_checks["offsite_storage"] = {
                "status": "error",
                "configured": True,
                "error": str(e)
            }
            overall_health = False
        
        # Check recovery procedures availability
        try:
            procedures = dr_service.list_recovery_procedures()
            
            health_checks["recovery_procedures"] = {
                "status": "healthy" if len(procedures) > 0 else "error",
                "total_procedures": len(procedures),
                "available_procedures": [p.procedure_id for p in procedures],
                "message": f"{len(procedures)} recovery procedures available"
            }
            
            if len(procedures) == 0:
                overall_health = False
                
        except Exception as e:
            health_checks["recovery_procedures"] = {
                "status": "error",
                "error": str(e)
            }
            overall_health = False
        
        # Check disk space
        try:
            import shutil
            backup_dir = dr_service.backup_service.backup_directory
            total, used, free = shutil.disk_usage(backup_dir)
            
            free_percentage = (free / total) * 100
            
            health_checks["disk_space"] = {
                "status": "healthy" if free_percentage > 20 else "warning" if free_percentage > 10 else "error",
                "total_bytes": total,
                "used_bytes": used,
                "free_bytes": free,
                "free_percentage": free_percentage,
                "message": f"{free_percentage:.1f}% disk space available"
            }
            
            if free_percentage <= 10:
                overall_health = False
                
        except Exception as e:
            health_checks["disk_space"] = {
                "status": "error",
                "error": str(e)
            }
            overall_health = False
        
        # Check database connectivity
        try:
            # Test database connection
            import psycopg2
            database_url = os.getenv("DATABASE_URL", "postgresql://goldshop_user:goldshop_password@db:5432/goldshop")
            conn = psycopg2.connect(database_url)
            cursor = conn.cursor()
            cursor.execute("SELECT 1")
            result = cursor.fetchone()
            cursor.close()
            conn.close()
            
            health_checks["database_connectivity"] = {
                "status": "healthy",
                "connection_test": "passed",
                "message": "Database connection successful"
            }
            
        except Exception as e:
            health_checks["database_connectivity"] = {
                "status": "error",
                "connection_test": "failed",
                "error": str(e)
            }
            overall_health = False
        
        # Generate overall health summary
        healthy_checks = sum(1 for check in health_checks.values() if check.get("status") == "healthy")
        warning_checks = sum(1 for check in health_checks.values() if check.get("status") == "warning")
        error_checks = sum(1 for check in health_checks.values() if check.get("status") == "error")
        
        result = {
            "success": True,
            "overall_health": "healthy" if overall_health else "degraded",
            "health_score": (healthy_checks / len(health_checks)) * 100,
            "total_checks": len(health_checks),
            "healthy_checks": healthy_checks,
            "warning_checks": warning_checks,
            "error_checks": error_checks,
            "health_checks": health_checks,
            "monitored_at": datetime.now().isoformat(),
            "recommendations": []
        }
        
        # Add recommendations based on health checks
        if not overall_health:
            if health_checks.get("backup_system", {}).get("status") != "healthy":
                result["recommendations"].append("Create recent backups to ensure recovery readiness")
            
            if health_checks.get("offsite_storage", {}).get("status") == "error":
                result["recommendations"].append("Fix off-site storage connectivity issues")
            
            if health_checks.get("disk_space", {}).get("free_percentage", 100) <= 20:
                result["recommendations"].append("Free up disk space or expand storage capacity")
            
            if health_checks.get("database_connectivity", {}).get("status") != "healthy":
                result["recommendations"].append("Investigate database connectivity issues")
        
        if not dr_service.off_site_storage:
            result["recommendations"].append("Configure off-site storage for enhanced disaster recovery")
        
        logger.info(f"System health monitoring completed: {result['overall_health']} "
                   f"({result['health_score']:.1f}% health score)")
        
        return result
        
    except Exception as e:
        logger.error(f"System health monitoring task failed: {e}")
        return {
            "success": False,
            "overall_health": "unknown",
            "error_message": str(e),
            "monitored_at": datetime.now().isoformat()
        }

@celery_app.task(bind=True, name='disaster_recovery_tasks.cleanup_recovery_logs')
def cleanup_recovery_logs(self, retention_days: int = 90) -> Dict[str, Any]:
    """
    Scheduled task to clean up old recovery operation logs
    
    Args:
        retention_days: Number of days to retain recovery logs
        
    Returns:
        Dict containing cleanup results
    """
    try:
        logger.info(f"Starting recovery logs cleanup (retention: {retention_days} days)")
        
        dr_service = get_disaster_recovery_service()
        
        # Get all log files
        log_files = list(dr_service.logs_dir.glob("*.json"))
        
        # Calculate cutoff date
        from datetime import timedelta
        cutoff_date = datetime.now() - timedelta(days=retention_days)
        
        cleaned_count = 0
        total_size_freed = 0
        
        for log_file in log_files:
            try:
                # Check file modification time
                file_mtime = datetime.fromtimestamp(log_file.stat().st_mtime)
                
                if file_mtime < cutoff_date:
                    file_size = log_file.stat().st_size
                    log_file.unlink()
                    
                    cleaned_count += 1
                    total_size_freed += file_size
                    
                    logger.debug(f"Cleaned up old recovery log: {log_file.name}")
                    
            except Exception as e:
                logger.error(f"Failed to clean up log file {log_file}: {e}")
        
        logger.info(f"Recovery logs cleanup completed: {cleaned_count} logs removed, "
                   f"{total_size_freed} bytes freed")
        
        return {
            "success": True,
            "retention_days": retention_days,
            "total_log_files": len(log_files),
            "cleaned_count": cleaned_count,
            "remaining_count": len(log_files) - cleaned_count,
            "size_freed_bytes": total_size_freed,
            "cleaned_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Recovery logs cleanup task failed: {e}")
        return {
            "success": False,
            "error_message": str(e),
            "cleaned_at": datetime.now().isoformat()
        }

# Periodic task configuration for Celery Beat
DISASTER_RECOVERY_SCHEDULE = {
    # Daily retention policy application at 3 AM
    'daily-retention-policy': {
        'task': 'disaster_recovery_tasks.apply_retention_policy',
        'schedule': 60 * 60 * 24,  # 24 hours
        'options': {
            'expires': 60 * 60 * 2,  # Expire after 2 hours if not executed
        }
    },
    
    # Hourly off-site storage sync
    'hourly-offsite-sync': {
        'task': 'disaster_recovery_tasks.sync_to_offsite_storage',
        'schedule': 60 * 60,  # 1 hour
        'options': {
            'expires': 60 * 30,  # Expire after 30 minutes if not executed
        }
    },
    
    # Daily recovery procedures testing at 4 AM
    'daily-recovery-test': {
        'task': 'disaster_recovery_tasks.test_recovery_procedures',
        'schedule': 60 * 60 * 24,  # 24 hours
        'options': {
            'expires': 60 * 60,  # Expire after 1 hour if not executed
        }
    },
    
    # Every 4 hours system health monitoring
    'system-health-monitoring': {
        'task': 'disaster_recovery_tasks.monitor_system_health',
        'schedule': 60 * 60 * 4,  # 4 hours
        'options': {
            'expires': 60 * 30,  # Expire after 30 minutes if not executed
        }
    },
    
    # Weekly recovery logs cleanup (Sundays at 5 AM)
    'weekly-logs-cleanup': {
        'task': 'disaster_recovery_tasks.cleanup_recovery_logs',
        'schedule': 60 * 60 * 24 * 7,  # 7 days
        'kwargs': {'retention_days': 90},
        'options': {
            'expires': 60 * 60,  # Expire after 1 hour if not executed
        }
    }
}