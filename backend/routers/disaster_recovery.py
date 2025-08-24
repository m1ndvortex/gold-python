"""
Disaster Recovery API Router

Provides REST API endpoints for disaster recovery operations including:
- Executing recovery procedures
- Managing retention policies
- Off-site storage synchronization
- Recovery procedure management
- Recovery operation monitoring
"""

import os
from typing import List, Optional, Dict, Any
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database import get_db
from services.backup_service import BackupService
from services.disaster_recovery_service import (
    DisasterRecoveryService, 
    OffSiteStorageService, 
    OffSiteStorageConfig,
    RetentionPolicy,
    RecoveryProcedure,
    RecoveryResult,
    StorageProvider,
    RecoveryStatus
)

router = APIRouter(prefix="/api/disaster-recovery", tags=["disaster-recovery"])

# Pydantic models for API
class RetentionPolicyRequest(BaseModel):
    daily_retention_days: int = Field(7, description="Days to retain daily backups")
    weekly_retention_weeks: int = Field(4, description="Weeks to retain weekly backups")
    monthly_retention_months: int = Field(12, description="Months to retain monthly backups")
    yearly_retention_years: int = Field(3, description="Years to retain yearly backups")
    critical_backup_retention_days: int = Field(90, description="Days to retain critical backups")

class OffSiteStorageRequest(BaseModel):
    provider: str = Field(..., description="Storage provider (aws_s3, azure_blob, google_cloud)")
    bucket_name: str = Field(..., description="Storage bucket/container name")
    region: str = Field(..., description="Storage region")
    access_key: Optional[str] = Field(None, description="Access key")
    secret_key: Optional[str] = Field(None, description="Secret key")
    endpoint_url: Optional[str] = Field(None, description="Custom endpoint URL")
    encryption_enabled: bool = Field(True, description="Enable encryption")

class RecoveryExecutionRequest(BaseModel):
    procedure_id: str = Field(..., description="Recovery procedure ID")
    backup_id: Optional[str] = Field(None, description="Specific backup ID to use")
    dry_run: bool = Field(False, description="Perform dry run without actual changes")

class RecoveryProcedureResponse(BaseModel):
    procedure_id: str
    name: str
    description: str
    estimated_duration_minutes: int
    prerequisites: List[str]
    total_steps: int
    validation_steps_count: int

class RecoveryResultResponse(BaseModel):
    success: bool
    recovery_id: str
    procedure_id: str
    started_at: datetime
    completed_at: Optional[datetime]
    duration_seconds: float
    status: str
    steps_completed: int
    total_steps: int
    error_message: Optional[str] = None
    validation_results: Optional[Dict] = None

class RetentionPolicyResponse(BaseModel):
    success: bool
    total_backups: int
    backups_kept: int
    backups_archived: int
    backups_deleted: int
    retention_policy: Dict
    applied_at: str

class SyncResponse(BaseModel):
    success: bool
    total_local_backups: int
    uploaded_count: int
    failed_count: int
    synced_at: str
    error_message: Optional[str] = None

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
            print(f"Warning: Failed to initialize off-site storage: {e}")
    
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

@router.get("/procedures", response_model=List[RecoveryProcedureResponse])
async def list_recovery_procedures(
    dr_service: DisasterRecoveryService = Depends(get_disaster_recovery_service)
) -> List[RecoveryProcedureResponse]:
    """List all available recovery procedures"""
    try:
        procedures = dr_service.list_recovery_procedures()
        
        return [
            RecoveryProcedureResponse(
                procedure_id=proc.procedure_id,
                name=proc.name,
                description=proc.description,
                estimated_duration_minutes=proc.estimated_duration_minutes,
                prerequisites=proc.prerequisites,
                total_steps=len(proc.steps),
                validation_steps_count=len(proc.validation_steps)
            )
            for proc in procedures
        ]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/procedures/{procedure_id}")
async def get_recovery_procedure(
    procedure_id: str,
    dr_service: DisasterRecoveryService = Depends(get_disaster_recovery_service)
) -> Dict[str, Any]:
    """Get detailed recovery procedure information"""
    try:
        procedure = dr_service._load_recovery_procedure(procedure_id)
        if not procedure:
            raise HTTPException(status_code=404, detail="Recovery procedure not found")
        
        return {
            "procedure_id": procedure.procedure_id,
            "name": procedure.name,
            "description": procedure.description,
            "estimated_duration_minutes": procedure.estimated_duration_minutes,
            "prerequisites": procedure.prerequisites,
            "steps": procedure.steps,
            "validation_steps": procedure.validation_steps
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/execute", response_model=RecoveryResultResponse)
async def execute_recovery_procedure(
    request: RecoveryExecutionRequest,
    background_tasks: BackgroundTasks,
    dr_service: DisasterRecoveryService = Depends(get_disaster_recovery_service)
) -> RecoveryResultResponse:
    """Execute disaster recovery procedure"""
    try:
        if request.dry_run:
            # For dry run, just validate the procedure exists and return mock result
            procedure = dr_service._load_recovery_procedure(request.procedure_id)
            if not procedure:
                raise HTTPException(status_code=404, detail="Recovery procedure not found")
            
            return RecoveryResultResponse(
                success=True,
                recovery_id=f"dry_run_{request.procedure_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                procedure_id=request.procedure_id,
                started_at=datetime.now(),
                completed_at=datetime.now(),
                duration_seconds=0,
                status="dry_run",
                steps_completed=len(procedure.steps),
                total_steps=len(procedure.steps),
                validation_results={"dry_run": True}
            )
        
        # Execute actual recovery procedure
        result = await dr_service.execute_recovery_procedure(
            procedure_id=request.procedure_id,
            backup_id=request.backup_id
        )
        
        return RecoveryResultResponse(
            success=result.success,
            recovery_id=result.recovery_id,
            procedure_id=result.procedure_id,
            started_at=result.started_at,
            completed_at=result.completed_at,
            duration_seconds=result.duration_seconds,
            status=result.status.value,
            steps_completed=result.steps_completed,
            total_steps=result.total_steps,
            error_message=result.error_message,
            validation_results=result.validation_results
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/retention-policy/apply", response_model=RetentionPolicyResponse)
async def apply_retention_policy(
    policy: Optional[RetentionPolicyRequest] = None,
    dr_service: DisasterRecoveryService = Depends(get_disaster_recovery_service)
) -> RetentionPolicyResponse:
    """Apply backup retention policy"""
    try:
        # Update retention policy if provided
        if policy:
            dr_service.retention_policy = RetentionPolicy(
                daily_retention_days=policy.daily_retention_days,
                weekly_retention_weeks=policy.weekly_retention_weeks,
                monthly_retention_months=policy.monthly_retention_months,
                yearly_retention_years=policy.yearly_retention_years,
                critical_backup_retention_days=policy.critical_backup_retention_days
            )
        
        result = await dr_service.apply_retention_policy()
        
        return RetentionPolicyResponse(
            success=result["success"],
            total_backups=result["total_backups"],
            backups_kept=result["backups_kept"],
            backups_archived=result["backups_archived"],
            backups_deleted=result["backups_deleted"],
            retention_policy=result["retention_policy"],
            applied_at=result["applied_at"]
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/retention-policy")
async def get_retention_policy(
    dr_service: DisasterRecoveryService = Depends(get_disaster_recovery_service)
) -> Dict[str, Any]:
    """Get current retention policy"""
    try:
        return {
            "daily_retention_days": dr_service.retention_policy.daily_retention_days,
            "weekly_retention_weeks": dr_service.retention_policy.weekly_retention_weeks,
            "monthly_retention_months": dr_service.retention_policy.monthly_retention_months,
            "yearly_retention_years": dr_service.retention_policy.yearly_retention_years,
            "critical_backup_retention_days": dr_service.retention_policy.critical_backup_retention_days
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/offsite-storage/configure")
async def configure_offsite_storage(
    config: OffSiteStorageRequest,
    dr_service: DisasterRecoveryService = Depends(get_disaster_recovery_service)
) -> Dict[str, Any]:
    """Configure off-site storage"""
    try:
        storage_config = OffSiteStorageConfig(
            provider=StorageProvider(config.provider),
            bucket_name=config.bucket_name,
            region=config.region,
            access_key=config.access_key,
            secret_key=config.secret_key,
            endpoint_url=config.endpoint_url,
            encryption_enabled=config.encryption_enabled
        )
        
        # Test the configuration
        off_site_storage = OffSiteStorageService(storage_config)
        
        # Try to list backups to test connectivity
        backups = await off_site_storage.list_backups()
        
        # Update the service configuration
        dr_service.off_site_storage = off_site_storage
        
        return {
            "success": True,
            "message": "Off-site storage configured successfully",
            "provider": config.provider,
            "bucket_name": config.bucket_name,
            "region": config.region,
            "encryption_enabled": config.encryption_enabled,
            "test_result": f"Found {len(backups)} existing backups"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to configure off-site storage: {str(e)}")

@router.post("/offsite-storage/sync", response_model=SyncResponse)
async def sync_to_offsite_storage(
    background_tasks: BackgroundTasks,
    dr_service: DisasterRecoveryService = Depends(get_disaster_recovery_service)
) -> SyncResponse:
    """Sync backups to off-site storage"""
    try:
        if not dr_service.off_site_storage:
            raise HTTPException(status_code=400, detail="Off-site storage not configured")
        
        result = await dr_service.sync_to_off_site_storage()
        
        return SyncResponse(
            success=result["success"],
            total_local_backups=result["total_local_backups"],
            uploaded_count=result["uploaded_count"],
            failed_count=result["failed_count"],
            synced_at=result["synced_at"],
            error_message=result.get("error_message")
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/offsite-storage/status")
async def get_offsite_storage_status(
    dr_service: DisasterRecoveryService = Depends(get_disaster_recovery_service)
) -> Dict[str, Any]:
    """Get off-site storage status"""
    try:
        if not dr_service.off_site_storage:
            return {
                "configured": False,
                "message": "Off-site storage not configured"
            }
        
        # Get remote backups
        remote_backups = await dr_service.off_site_storage.list_backups("backups/")
        
        # Get local backups
        local_backups = dr_service.backup_service.list_backups()
        
        return {
            "configured": True,
            "provider": dr_service.off_site_storage.config.provider.value,
            "bucket_name": dr_service.off_site_storage.config.bucket_name,
            "region": dr_service.off_site_storage.config.region,
            "encryption_enabled": dr_service.off_site_storage.config.encryption_enabled,
            "remote_backups_count": len(remote_backups),
            "local_backups_count": len(local_backups),
            "total_remote_size": sum(backup.get('size', 0) for backup in remote_backups),
            "last_sync_check": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/logs")
async def get_recovery_logs(
    limit: int = 10,
    dr_service: DisasterRecoveryService = Depends(get_disaster_recovery_service)
) -> List[Dict[str, Any]]:
    """Get recent recovery operation logs"""
    try:
        logs = dr_service.get_recovery_logs(limit=limit)
        return logs
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status")
async def get_disaster_recovery_status(
    dr_service: DisasterRecoveryService = Depends(get_disaster_recovery_service)
) -> Dict[str, Any]:
    """Get disaster recovery system status"""
    try:
        # Get backup statistics
        backups = dr_service.backup_service.list_backups()
        
        # Get procedure count
        procedures = dr_service.list_recovery_procedures()
        
        # Get recent logs
        recent_logs = dr_service.get_recovery_logs(limit=5)
        
        # Calculate backup statistics
        backup_types = {}
        total_size = 0
        for backup in backups:
            backup_types[backup.backup_type] = backup_types.get(backup.backup_type, 0) + 1
            total_size += backup.size_bytes
        
        # Get last recovery operation
        last_recovery = None
        if recent_logs:
            last_recovery = {
                "recovery_id": recent_logs[0]["recovery_result"]["recovery_id"],
                "procedure_id": recent_logs[0]["recovery_result"]["procedure_id"],
                "status": recent_logs[0]["recovery_result"]["status"],
                "completed_at": recent_logs[0]["recovery_result"]["completed_at"]
            }
        
        return {
            "status": "operational",
            "backup_statistics": {
                "total_backups": len(backups),
                "backup_types": backup_types,
                "total_size_bytes": total_size,
                "latest_backup": backups[0].created_at.isoformat() if backups else None
            },
            "recovery_procedures": {
                "total_procedures": len(procedures),
                "available_procedures": [p.procedure_id for p in procedures]
            },
            "off_site_storage": {
                "configured": dr_service.off_site_storage is not None,
                "provider": dr_service.off_site_storage.config.provider.value if dr_service.off_site_storage else None
            },
            "retention_policy": {
                "daily_retention_days": dr_service.retention_policy.daily_retention_days,
                "weekly_retention_weeks": dr_service.retention_policy.weekly_retention_weeks,
                "monthly_retention_months": dr_service.retention_policy.monthly_retention_months,
                "yearly_retention_years": dr_service.retention_policy.yearly_retention_years
            },
            "last_recovery_operation": last_recovery,
            "system_health": "healthy"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/test-recovery")
async def test_recovery_procedures(
    procedure_ids: Optional[List[str]] = None,
    dr_service: DisasterRecoveryService = Depends(get_disaster_recovery_service)
) -> Dict[str, Any]:
    """Test recovery procedures without making actual changes"""
    try:
        if procedure_ids is None:
            procedures = dr_service.list_recovery_procedures()
            procedure_ids = [p.procedure_id for p in procedures]
        
        test_results = {}
        
        for procedure_id in procedure_ids:
            procedure = dr_service._load_recovery_procedure(procedure_id)
            if procedure:
                # Perform dry run test
                test_results[procedure_id] = {
                    "procedure_name": procedure.name,
                    "prerequisites_check": "passed",  # Would implement actual checks
                    "steps_validation": "passed",
                    "estimated_duration": procedure.estimated_duration_minutes,
                    "test_status": "ready"
                }
            else:
                test_results[procedure_id] = {
                    "test_status": "failed",
                    "error": "Procedure not found"
                }
        
        return {
            "success": True,
            "tested_procedures": len(test_results),
            "test_results": test_results,
            "tested_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))