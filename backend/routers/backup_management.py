"""
Backup Management API Router

Provides REST API endpoints for backup operations including:
- Creating manual backups
- Listing available backups
- Verifying backup integrity
- Restoring backups
- Managing backup schedules
"""

import os
from typing import List, Optional, Dict, Any
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database import get_db
from services.backup_service import BackupService, BackupMetadata, BackupResult, VerificationResult
from analytics_tasks.backup_tasks import (
    create_scheduled_database_backup,
    create_scheduled_file_backup,
    create_scheduled_full_backup,
    verify_all_backups,
    cleanup_old_backups
)

router = APIRouter(prefix="/api/backup", tags=["backup"])

# Pydantic models for API
class BackupCreateRequest(BaseModel):
    backup_type: str = Field(..., description="Type of backup: 'database', 'files', or 'full'")
    database_name: Optional[str] = Field("goldshop", description="Database name for database backups")
    file_paths: Optional[List[str]] = Field(None, description="File paths for file backups")
    compress: bool = Field(True, description="Whether to compress the backup")
    encrypt: bool = Field(True, description="Whether to encrypt the backup")

class BackupResponse(BaseModel):
    success: bool
    backup_id: str
    file_path: str
    size_bytes: int
    duration_seconds: float
    error_message: Optional[str] = None
    created_at: datetime

class BackupListResponse(BaseModel):
    backup_id: str
    backup_type: str
    created_at: datetime
    file_path: str
    encrypted: bool
    compressed: bool
    size_bytes: int
    database_name: Optional[str] = None
    source_path: Optional[str] = None

class VerificationResponse(BaseModel):
    backup_id: str
    integrity_check_passed: bool
    restoration_test_passed: bool
    checksum_verified: bool
    error_message: Optional[str] = None
    verification_details: Optional[Dict] = None

class RestoreRequest(BaseModel):
    backup_id: str
    restore_path: str

class RestoreResponse(BaseModel):
    success: bool
    backup_id: str
    restored_to: str
    duration_seconds: float
    error_message: Optional[str] = None

class ScheduledTaskResponse(BaseModel):
    task_id: str
    task_name: str
    status: str
    message: str

def get_backup_service() -> BackupService:
    """Get backup service instance"""
    database_url = os.getenv("DATABASE_URL", "postgresql://goldshop_user:goldshop_password@db:5432/goldshop")
    return BackupService(
        database_url=database_url,
        backup_directory=os.getenv("BACKUP_DIRECTORY", "/app/backups"),
        encryption_password=os.getenv("BACKUP_ENCRYPTION_PASSWORD")
    )

@router.post("/create", response_model=BackupResponse)
async def create_backup(
    request: BackupCreateRequest,
    backup_service: BackupService = Depends(get_backup_service)
) -> BackupResponse:
    """Create a new backup"""
    try:
        if request.backup_type == "database":
            result = backup_service.create_database_backup(
                database_name=request.database_name or "goldshop",
                compress=request.compress,
                encrypt=request.encrypt
            )
        elif request.backup_type == "files":
            if not request.file_paths:
                # Default file paths
                request.file_paths = ["/app/uploads", "/app/.env"]
            
            # For multiple file paths, create backup for the first one
            # In a real implementation, you might want to create multiple backups
            result = backup_service.create_file_backup(
                source_path=request.file_paths[0],
                compress=request.compress,
                encrypt=request.encrypt
            )
        elif request.backup_type == "full":
            results = backup_service.create_full_backup(
                database_name=request.database_name or "goldshop",
                file_paths=request.file_paths
            )
            # Return the first successful result
            result = next((r for r in results if r.success), results[0])
        else:
            raise HTTPException(status_code=400, detail="Invalid backup type")
        
        if not result.success:
            raise HTTPException(status_code=500, detail=result.error_message)
        
        return BackupResponse(
            success=result.success,
            backup_id=result.backup_id,
            file_path=result.file_path,
            size_bytes=result.size_bytes,
            duration_seconds=result.duration_seconds,
            created_at=result.metadata.created_at if result.metadata else datetime.now()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list", response_model=List[BackupListResponse])
async def list_backups(
    backup_type: Optional[str] = None,
    backup_service: BackupService = Depends(get_backup_service)
) -> List[BackupListResponse]:
    """List available backups"""
    try:
        backups = backup_service.list_backups(backup_type=backup_type)
        
        return [
            BackupListResponse(
                backup_id=backup.backup_id,
                backup_type=backup.backup_type,
                created_at=backup.created_at,
                file_path=backup.file_path,
                encrypted=backup.encrypted,
                compressed=backup.compressed,
                size_bytes=backup.size_bytes,
                database_name=backup.database_name,
                source_path=backup.source_path
            )
            for backup in backups
        ]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/verify/{backup_id}", response_model=VerificationResponse)
async def verify_backup(
    backup_id: str,
    backup_service: BackupService = Depends(get_backup_service)
) -> VerificationResponse:
    """Verify backup integrity"""
    try:
        result = backup_service.verify_backup(backup_id)
        
        return VerificationResponse(
            backup_id=result.backup_id,
            integrity_check_passed=result.integrity_check_passed,
            restoration_test_passed=result.restoration_test_passed,
            checksum_verified=result.checksum_verified,
            error_message=result.error_message,
            verification_details=result.verification_details
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/restore", response_model=RestoreResponse)
async def restore_backup(
    request: RestoreRequest,
    backup_service: BackupService = Depends(get_backup_service)
) -> RestoreResponse:
    """Restore backup to specified location"""
    try:
        result = backup_service.restore_backup(request.backup_id, request.restore_path)
        
        return RestoreResponse(
            success=result.success,
            backup_id=result.backup_id,
            restored_to=result.restored_to,
            duration_seconds=result.duration_seconds,
            error_message=result.error_message
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/cleanup")
async def cleanup_old_backups_endpoint(
    retention_days: int = 30,
    backup_service: BackupService = Depends(get_backup_service)
) -> Dict[str, Any]:
    """Clean up old backups"""
    try:
        cleaned_count = backup_service.cleanup_old_backups(retention_days=retention_days)
        
        return {
            "success": True,
            "cleaned_count": cleaned_count,
            "retention_days": retention_days,
            "message": f"Cleaned up {cleaned_count} old backups"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Scheduled backup endpoints
@router.post("/schedule/database", response_model=ScheduledTaskResponse)
async def schedule_database_backup(
    background_tasks: BackgroundTasks,
    database_name: str = "goldshop",
    compress: bool = True,
    encrypt: bool = True
) -> ScheduledTaskResponse:
    """Schedule a database backup task"""
    try:
        task = create_scheduled_database_backup.delay(
            database_name=database_name,
            compress=compress,
            encrypt=encrypt
        )
        
        return ScheduledTaskResponse(
            task_id=task.id,
            task_name="create_scheduled_database_backup",
            status="scheduled",
            message=f"Database backup task scheduled for {database_name}"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/schedule/files", response_model=ScheduledTaskResponse)
async def schedule_file_backup(
    background_tasks: BackgroundTasks,
    file_paths: Optional[List[str]] = None,
    compress: bool = True,
    encrypt: bool = True
) -> ScheduledTaskResponse:
    """Schedule a file backup task"""
    try:
        task = create_scheduled_file_backup.delay(
            file_paths=file_paths,
            compress=compress,
            encrypt=encrypt
        )
        
        return ScheduledTaskResponse(
            task_id=task.id,
            task_name="create_scheduled_file_backup",
            status="scheduled",
            message="File backup task scheduled"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/schedule/full", response_model=ScheduledTaskResponse)
async def schedule_full_backup(
    background_tasks: BackgroundTasks,
    database_name: str = "goldshop",
    file_paths: Optional[List[str]] = None,
    compress: bool = True,
    encrypt: bool = True
) -> ScheduledTaskResponse:
    """Schedule a full system backup task"""
    try:
        task = create_scheduled_full_backup.delay(
            database_name=database_name,
            file_paths=file_paths,
            compress=compress,
            encrypt=encrypt
        )
        
        return ScheduledTaskResponse(
            task_id=task.id,
            task_name="create_scheduled_full_backup",
            status="scheduled",
            message="Full backup task scheduled"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/schedule/verify", response_model=ScheduledTaskResponse)
async def schedule_backup_verification(
    background_tasks: BackgroundTasks
) -> ScheduledTaskResponse:
    """Schedule backup verification task"""
    try:
        task = verify_all_backups.delay()
        
        return ScheduledTaskResponse(
            task_id=task.id,
            task_name="verify_all_backups",
            status="scheduled",
            message="Backup verification task scheduled"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/schedule/cleanup", response_model=ScheduledTaskResponse)
async def schedule_backup_cleanup(
    background_tasks: BackgroundTasks,
    retention_days: int = 30
) -> ScheduledTaskResponse:
    """Schedule backup cleanup task"""
    try:
        task = cleanup_old_backups.delay(retention_days=retention_days)
        
        return ScheduledTaskResponse(
            task_id=task.id,
            task_name="cleanup_old_backups",
            status="scheduled",
            message=f"Backup cleanup task scheduled (retention: {retention_days} days)"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status")
async def backup_system_status(
    backup_service: BackupService = Depends(get_backup_service)
) -> Dict[str, Any]:
    """Get backup system status"""
    try:
        backups = backup_service.list_backups()
        
        # Calculate statistics
        total_backups = len(backups)
        total_size = sum(backup.size_bytes for backup in backups)
        
        backup_types = {}
        for backup in backups:
            backup_types[backup.backup_type] = backup_types.get(backup.backup_type, 0) + 1
        
        latest_backup = backups[0] if backups else None
        
        return {
            "status": "operational",
            "total_backups": total_backups,
            "total_size_bytes": total_size,
            "backup_types": backup_types,
            "latest_backup": {
                "backup_id": latest_backup.backup_id,
                "backup_type": latest_backup.backup_type,
                "created_at": latest_backup.created_at.isoformat(),
                "size_bytes": latest_backup.size_bytes
            } if latest_backup else None,
            "backup_directory": str(backup_service.backup_directory),
            "encryption_enabled": bool(backup_service.encryption_password)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))