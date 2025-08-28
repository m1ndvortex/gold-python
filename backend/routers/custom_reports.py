"""
Custom Reports API Router for Advanced Analytics & Business Intelligence

This router provides endpoints for:
- Dynamic report generation
- Report configuration management
- Report scheduling and automation
- Multi-format export capabilities
"""

from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import or_, case
from typing import Optional, List, Dict, Any
from datetime import datetime, date
import uuid
import logging

from database import get_db
from auth import get_current_user
from schemas import User
from services.report_engine_service import ReportEngineService
from services.report_scheduler_service import ReportSchedulerService
import models

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/custom-reports",
    tags=["custom-reports"],
    dependencies=[Depends(get_current_user)]
)

# Report Generation Endpoints

@router.post("/generate")
async def generate_custom_report(
    report_config: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate a custom report based on configuration"""
    try:
        report_service = ReportEngineService(db)
        report_data = await report_service.build_custom_report(report_config)
        
        # Track report generation
        if report_config.get('save_as_template'):
            custom_report = models.CustomReport(
                name=report_config.get('name', 'Custom Report'),
                description=report_config.get('description', ''),
                report_config=report_config,
                is_template=True,
                created_by=current_user.id,
                last_generated_at=datetime.now(),
                generation_count=1
            )
            db.add(custom_report)
            db.commit()
            
            report_data['template_id'] = str(custom_report.id)
        
        return report_data
        
    except Exception as e:
        logger.error(f"Error generating custom report: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate report: {str(e)}")

@router.post("/validate-config")
async def validate_report_config(
    report_config: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Validate a report configuration"""
    try:
        report_service = ReportEngineService(db)
        validation_result = await report_service.validate_report_config(report_config)
        return validation_result
        
    except Exception as e:
        logger.error(f"Error validating report config: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to validate config: {str(e)}")

@router.get("/data-sources")
async def get_available_data_sources(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get available data sources and their fields"""
    try:
        report_service = ReportEngineService(db)
        data_sources = await report_service.get_available_data_sources()
        return data_sources
        
    except Exception as e:
        logger.error(f"Error getting data sources: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get data sources: {str(e)}")

# Report Export Endpoints

@router.post("/export")
async def export_report(
    report_data: Dict[str, Any],
    export_format: str = Query(..., description="Export format: pdf, excel, csv, json"),
    filename: Optional[str] = Query(None, description="Custom filename"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Export report data to specified format"""
    try:
        scheduler_service = ReportSchedulerService(db)
        export_result = await scheduler_service.export_report(
            report_data, export_format, filename
        )
        return export_result
        
    except Exception as e:
        logger.error(f"Error exporting report: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to export report: {str(e)}")

@router.post("/export-and-email")
async def export_and_email_report(
    report_data: Dict[str, Any],
    recipients: List[str],
    export_formats: List[str] = Query(default=['pdf'], description="Export formats"),
    custom_message: Optional[str] = None,
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Export report and send via email"""
    try:
        scheduler_service = ReportSchedulerService(db)
        
        # Export in requested formats
        export_files = []
        for export_format in export_formats:
            export_result = await scheduler_service.export_report(
                report_data, 
                export_format,
                f"{report_data.get('name', 'report')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{export_format}"
            )
            export_files.append(export_result)
        
        # Send email in background
        background_tasks.add_task(
            scheduler_service.send_report_email,
            recipients,
            report_data.get('name', 'Custom Report'),
            export_files,
            custom_message
        )
        
        return {
            'message': 'Report export initiated and will be sent via email',
            'recipients': recipients,
            'export_formats': export_formats,
            'files_generated': len(export_files)
        }
        
    except Exception as e:
        logger.error(f"Error exporting and emailing report: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to export and email report: {str(e)}")

# Report Scheduling Endpoints

@router.post("/schedule")
async def schedule_report(
    report_config: Dict[str, Any],
    schedule_config: Dict[str, Any],
    recipients: List[str],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Schedule a report for automated generation and delivery"""
    try:
        scheduler_service = ReportSchedulerService(db)
        schedule_result = await scheduler_service.schedule_report(
            report_config, schedule_config, recipients, str(current_user.id)
        )
        return schedule_result
        
    except Exception as e:
        logger.error(f"Error scheduling report: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to schedule report: {str(e)}")

@router.get("/scheduled")
async def get_scheduled_reports(
    user_only: bool = Query(False, description="Show only current user's reports"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get list of scheduled reports"""
    try:
        scheduler_service = ReportSchedulerService(db)
        user_id = str(current_user.id) if user_only else None
        scheduled_reports = await scheduler_service.get_scheduled_reports(user_id)
        return scheduled_reports
        
    except Exception as e:
        logger.error(f"Error getting scheduled reports: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get scheduled reports: {str(e)}")

@router.put("/scheduled/{schedule_id}")
async def update_scheduled_report(
    schedule_id: str,
    updates: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a scheduled report"""
    try:
        scheduled_report = db.query(models.ScheduledReport).filter(
            models.ScheduledReport.id == uuid.UUID(schedule_id),
            models.ScheduledReport.created_by == current_user.id
        ).first()
        
        if not scheduled_report:
            raise HTTPException(status_code=404, detail="Scheduled report not found")
        
        # Update allowed fields
        allowed_updates = ['name', 'description', 'is_active', 'recipients', 'export_formats']
        for field, value in updates.items():
            if field in allowed_updates:
                setattr(scheduled_report, field, value)
        
        scheduled_report.updated_at = datetime.now()
        db.commit()
        
        return {
            'message': 'Scheduled report updated successfully',
            'schedule_id': schedule_id,
            'updated_fields': list(updates.keys())
        }
        
    except Exception as e:
        logger.error(f"Error updating scheduled report: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update scheduled report: {str(e)}")

@router.delete("/scheduled/{schedule_id}")
async def delete_scheduled_report(
    schedule_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a scheduled report"""
    try:
        scheduled_report = db.query(models.ScheduledReport).filter(
            models.ScheduledReport.id == uuid.UUID(schedule_id),
            models.ScheduledReport.created_by == current_user.id
        ).first()
        
        if not scheduled_report:
            raise HTTPException(status_code=404, detail="Scheduled report not found")
        
        db.delete(scheduled_report)
        db.commit()
        
        return {
            'message': 'Scheduled report deleted successfully',
            'schedule_id': schedule_id
        }
        
    except Exception as e:
        logger.error(f"Error deleting scheduled report: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete scheduled report: {str(e)}")

@router.post("/scheduled/{schedule_id}/run-now")
async def run_scheduled_report_now(
    schedule_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Run a scheduled report immediately"""
    try:
        scheduled_report = db.query(models.ScheduledReport).filter(
            models.ScheduledReport.id == uuid.UUID(schedule_id),
            models.ScheduledReport.created_by == current_user.id
        ).first()
        
        if not scheduled_report:
            raise HTTPException(status_code=404, detail="Scheduled report not found")
        
        scheduler_service = ReportSchedulerService(db)
        
        # Run report in background
        background_tasks.add_task(
            scheduler_service._execute_scheduled_report,
            uuid.UUID(schedule_id)
        )
        
        return {
            'message': 'Scheduled report execution initiated',
            'schedule_id': schedule_id,
            'report_name': scheduled_report.name
        }
        
    except Exception as e:
        logger.error(f"Error running scheduled report: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to run scheduled report: {str(e)}")

# Report Template Management

@router.get("/templates")
async def get_report_templates(
    public_only: bool = Query(False, description="Show only public templates"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get list of report templates"""
    try:
        query = db.query(models.CustomReport).filter(
            models.CustomReport.is_template == True
        )
        
        if public_only:
            query = query.filter(models.CustomReport.is_public == True)
        else:
            query = query.filter(
                or_(
                    models.CustomReport.is_public == True,
                    models.CustomReport.created_by == current_user.id
                )
            )
        
        templates = query.order_by(models.CustomReport.created_at.desc()).all()
        
        return [
            {
                'id': str(template.id),
                'name': template.name,
                'description': template.description,
                'is_public': template.is_public,
                'generation_count': template.generation_count,
                'last_generated_at': template.last_generated_at.isoformat() if template.last_generated_at else None,
                'created_at': template.created_at.isoformat(),
                'created_by_current_user': template.created_by == current_user.id
            }
            for template in templates
        ]
        
    except Exception as e:
        logger.error(f"Error getting report templates: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get report templates: {str(e)}")

@router.get("/templates/{template_id}")
async def get_report_template(
    template_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific report template"""
    try:
        template = db.query(models.CustomReport).filter(
            models.CustomReport.id == uuid.UUID(template_id),
            models.CustomReport.is_template == True,
            or_(
                models.CustomReport.is_public == True,
                models.CustomReport.created_by == current_user.id
            )
        ).first()
        
        if not template:
            raise HTTPException(status_code=404, detail="Report template not found")
        
        return {
            'id': str(template.id),
            'name': template.name,
            'description': template.description,
            'report_config': template.report_config,
            'is_public': template.is_public,
            'generation_count': template.generation_count,
            'last_generated_at': template.last_generated_at.isoformat() if template.last_generated_at else None,
            'created_at': template.created_at.isoformat(),
            'created_by_current_user': template.created_by == current_user.id
        }
        
    except Exception as e:
        logger.error(f"Error getting report template: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get report template: {str(e)}")

@router.post("/templates/{template_id}/generate")
async def generate_from_template(
    template_id: str,
    config_overrides: Optional[Dict[str, Any]] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate a report from a template"""
    try:
        template = db.query(models.CustomReport).filter(
            models.CustomReport.id == uuid.UUID(template_id),
            models.CustomReport.is_template == True,
            or_(
                models.CustomReport.is_public == True,
                models.CustomReport.created_by == current_user.id
            )
        ).first()
        
        if not template:
            raise HTTPException(status_code=404, detail="Report template not found")
        
        # Merge template config with overrides
        report_config = template.report_config.copy()
        if config_overrides:
            report_config.update(config_overrides)
        
        # Generate report
        report_service = ReportEngineService(db)
        report_data = await report_service.build_custom_report(report_config)
        
        # Update template usage
        template.generation_count = (template.generation_count or 0) + 1
        template.last_generated_at = datetime.now()
        db.commit()
        
        report_data['template_id'] = template_id
        report_data['template_name'] = template.name
        
        return report_data
        
    except Exception as e:
        logger.error(f"Error generating from template: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate from template: {str(e)}")

@router.delete("/templates/{template_id}")
async def delete_report_template(
    template_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a report template"""
    try:
        template = db.query(models.CustomReport).filter(
            models.CustomReport.id == uuid.UUID(template_id),
            models.CustomReport.created_by == current_user.id
        ).first()
        
        if not template:
            raise HTTPException(status_code=404, detail="Report template not found")
        
        db.delete(template)
        db.commit()
        
        return {
            'message': 'Report template deleted successfully',
            'template_id': template_id
        }
        
    except Exception as e:
        logger.error(f"Error deleting report template: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete report template: {str(e)}")

# Report Analytics

@router.get("/analytics/usage")
async def get_report_usage_analytics(
    days: int = Query(30, description="Number of days to analyze"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get report usage analytics"""
    try:
        from sqlalchemy import func
        from datetime import timedelta
        
        start_date = datetime.now() - timedelta(days=days)
        
        # Most used templates
        template_usage = db.query(
            models.CustomReport.name,
            models.CustomReport.generation_count,
            models.CustomReport.last_generated_at
        ).filter(
            models.CustomReport.is_template == True,
            models.CustomReport.last_generated_at >= start_date
        ).order_by(models.CustomReport.generation_count.desc()).limit(10).all()
        
        # Scheduled report statistics
        scheduled_stats = db.query(
            func.count(models.ScheduledReport.id).label('total_scheduled'),
            func.count(case([(models.ScheduledReport.is_active == True, 1)])).label('active_scheduled'),
            func.sum(models.ScheduledReport.run_count).label('total_runs'),
            func.sum(models.ScheduledReport.error_count).label('total_errors')
        ).first()
        
        return {
            'period_days': days,
            'template_usage': [
                {
                    'name': template.name,
                    'generation_count': template.generation_count or 0,
                    'last_generated_at': template.last_generated_at.isoformat() if template.last_generated_at else None
                }
                for template in template_usage
            ],
            'scheduled_reports': {
                'total_scheduled': scheduled_stats.total_scheduled or 0,
                'active_scheduled': scheduled_stats.active_scheduled or 0,
                'total_runs': scheduled_stats.total_runs or 0,
                'total_errors': scheduled_stats.total_errors or 0,
                'success_rate': (
                    ((scheduled_stats.total_runs or 0) - (scheduled_stats.total_errors or 0)) / 
                    max(1, scheduled_stats.total_runs or 1) * 100
                )
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting report analytics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get report analytics: {str(e)}")