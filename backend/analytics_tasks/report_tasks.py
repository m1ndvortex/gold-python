"""
Report Background Tasks

Celery tasks for automated report generation, scheduling,
and delivery of custom reports.

Requirements covered: 4.4
"""

import asyncio
from datetime import datetime, date, timedelta
from typing import Dict, List, Optional, Any
import logging
import json
import os
from pathlib import Path

from celery import Task
from celery.exceptions import Retry
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine, text
from decimal import Decimal

from celery_app import celery_app
from models import CustomReport, ScheduledReport, ReportExecution
from services.report_engine_service import ReportEngineService
from services.report_scheduler_service import ReportSchedulerService
from redis_config import get_analytics_cache

logger = logging.getLogger(__name__)

# Database setup for background tasks
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@db:5432/goldshop")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class DatabaseTask(Task):
    """Base task class with database session management"""
    
    def __call__(self, *args, **kwargs):
        with SessionLocal() as db:
            return self.run_with_db(db, *args, **kwargs)
    
    def run_with_db(self, db, *args, **kwargs):
        raise NotImplementedError

@celery_app.task(bind=True, base=DatabaseTask, name="analytics_tasks.report_tasks.generate_custom_report")
def generate_custom_report_task(
    self, 
    db, 
    report_id: str, 
    export_format: str = "pdf",
    parameters: Optional[Dict] = None
) -> Dict[str, Any]:
    """
    Generate a custom report based on report configuration
    
    Args:
        report_id: UUID of the custom report
        export_format: Export format ('pdf', 'excel', 'csv')
        parameters: Optional parameters for report generation
        
    Returns:
        Dict containing report generation results
    """
    try:
        logger.info(f"Starting custom report generation for report {report_id}")
        
        # Get report configuration
        report = db.query(CustomReport).filter(CustomReport.id == report_id).first()
        if not report:
            raise ValueError(f"Report {report_id} not found")
        
        # Initialize report engine
        report_engine = ReportEngineService(db)
        
        # Parse report configuration
        report_config = report.configuration
        if parameters:
            # Merge parameters into configuration
            report_config.update(parameters)
        
        # Generate report data
        report_result = asyncio.run(report_engine.build_custom_report(report_config))
        
        # Export report in requested format
        export_result = asyncio.run(report_engine.export_report(
            report_data=report_result,
            format=export_format
        ))
        
        # Create report execution record
        execution = ReportExecution(
            report_id=report_id,
            execution_type="manual",
            status="completed",
            export_format=export_format,
            file_path=export_result.get("file_path"),
            file_size=export_result.get("file_size", 0),
            generation_time_seconds=export_result.get("generation_time", 0),
            parameters=parameters or {},
            task_metadata={
                "rows_generated": report_result.get("total_rows", 0),
                "columns_count": len(report_result.get("columns", [])),
                "data_sources": report_config.get("data_sources", [])
            }
        )
        db.add(execution)
        db.commit()
        
        # Cache report results
        cache = get_analytics_cache()
        asyncio.run(cache.set_report_data(
            report_id=report_id,
            data={
                "report_data": report_result,
                "export_result": export_result,
                "generated_at": datetime.utcnow().isoformat()
            },
            ttl=1800  # 30 minutes cache
        ))
        
        result = {
            "generation_id": f"report_gen_{report_id}_{datetime.utcnow().isoformat()}",
            "report_id": report_id,
            "report_name": report.name,
            "export_format": export_format,
            "file_path": export_result.get("file_path"),
            "file_size": export_result.get("file_size", 0),
            "total_rows": report_result.get("total_rows", 0),
            "generation_time": export_result.get("generation_time", 0),
            "generated_at": datetime.utcnow().isoformat(),
            "status": "completed"
        }
        
        logger.info(f"Custom report generation completed for report {report_id}")
        return result
        
    except Exception as e:
        logger.error(f"Error generating custom report {report_id}: {str(e)}")
        
        # Record failed execution
        try:
            execution = ReportExecution(
                report_id=report_id,
                execution_type="manual",
                status="failed",
                export_format=export_format,
                error_message=str(e),
                parameters=parameters or {},
                task_metadata={}
            )
            db.add(execution)
            db.commit()
        except:
            pass
        
        db.rollback()
        raise self.retry(countdown=120, max_retries=3, exc=e)

@celery_app.task(bind=True, base=DatabaseTask, name="analytics_tasks.report_tasks.process_scheduled_reports")
def process_scheduled_reports_task(self, db) -> Dict[str, Any]:
    """
    Process all scheduled reports that are due for execution
    
    Returns:
        Dict containing processing results
    """
    try:
        logger.info("Starting scheduled reports processing")
        
        # Initialize scheduler service
        scheduler_service = ReportSchedulerService(db)
        
        # Get due scheduled reports
        due_reports = asyncio.run(scheduler_service.get_due_reports())
        
        if not due_reports:
            return {
                "processing_id": f"scheduled_reports_{datetime.utcnow().isoformat()}",
                "due_reports": 0,
                "processed_reports": 0,
                "status": "no_reports_due"
            }
        
        processed_reports = []
        failed_reports = []
        
        for scheduled_report in due_reports:
            try:
                logger.info(f"Processing scheduled report: {scheduled_report.report_name}")
                
                # Generate the report
                generation_result = generate_custom_report_task.apply_async(
                    args=[
                        str(scheduled_report.report_id),
                        scheduled_report.export_format,
                        scheduled_report.parameters
                    ]
                ).get(timeout=600)  # 10 minute timeout
                
                # Send report if recipients are configured
                if scheduled_report.recipients:
                    delivery_result = asyncio.run(scheduler_service.deliver_report(
                        scheduled_report=scheduled_report,
                        report_file_path=generation_result.get("file_path"),
                        generation_result=generation_result
                    ))
                    
                    generation_result["delivery_result"] = delivery_result
                
                # Update next execution time
                asyncio.run(scheduler_service.update_next_execution(scheduled_report.id))
                
                processed_reports.append({
                    "scheduled_report_id": str(scheduled_report.id),
                    "report_name": scheduled_report.report_name,
                    "generation_result": generation_result,
                    "recipients_count": len(scheduled_report.recipients) if scheduled_report.recipients else 0
                })
                
            except Exception as report_error:
                logger.error(f"Failed to process scheduled report {scheduled_report.id}: {str(report_error)}")
                
                # Record failed execution
                execution = ReportExecution(
                    report_id=scheduled_report.report_id,
                    execution_type="scheduled",
                    status="failed",
                    export_format=scheduled_report.export_format,
                    error_message=str(report_error),
                    parameters=scheduled_report.parameters or {},
                    task_metadata={}
                )
                db.add(execution)
                
                failed_reports.append({
                    "scheduled_report_id": str(scheduled_report.id),
                    "report_name": scheduled_report.report_name,
                    "error": str(report_error)
                })
        
        db.commit()
        
        result = {
            "processing_id": f"scheduled_reports_{datetime.utcnow().isoformat()}",
            "due_reports": len(due_reports),
            "processed_reports": len(processed_reports),
            "failed_reports": len(failed_reports),
            "success_details": processed_reports,
            "failure_details": failed_reports,
            "processed_at": datetime.utcnow().isoformat(),
            "status": "completed"
        }
        
        logger.info(f"Scheduled reports processing completed: {len(processed_reports)}/{len(due_reports)} successful")
        return result
        
    except Exception as e:
        logger.error(f"Error processing scheduled reports: {str(e)}")
        db.rollback()
        raise self.retry(countdown=300, max_retries=2, exc=e)

@celery_app.task(bind=True, base=DatabaseTask, name="analytics_tasks.report_tasks.bulk_report_generation")
def bulk_report_generation_task(
    self, 
    db, 
    report_configs: List[Dict], 
    export_format: str = "pdf"
) -> Dict[str, Any]:
    """
    Generate multiple reports in bulk
    
    Args:
        report_configs: List of report configuration dicts
        export_format: Export format for all reports
        
    Returns:
        Dict containing bulk generation results
    """
    try:
        logger.info(f"Starting bulk report generation for {len(report_configs)} reports")
        
        successful_reports = []
        failed_reports = []
        
        for i, config in enumerate(report_configs):
            try:
                report_id = config.get("report_id")
                parameters = config.get("parameters", {})
                
                if not report_id:
                    raise ValueError(f"Report ID missing in config {i}")
                
                # Generate report
                generation_result = generate_custom_report_task.apply_async(
                    args=[report_id, export_format, parameters]
                ).get(timeout=600)  # 10 minute timeout per report
                
                successful_reports.append({
                    "config_index": i,
                    "report_id": report_id,
                    "generation_result": generation_result
                })
                
            except Exception as report_error:
                logger.error(f"Failed to generate report {i}: {str(report_error)}")
                failed_reports.append({
                    "config_index": i,
                    "config": config,
                    "error": str(report_error)
                })
        
        result = {
            "bulk_generation_id": f"bulk_reports_{datetime.utcnow().isoformat()}",
            "total_reports": len(report_configs),
            "successful_reports": len(successful_reports),
            "failed_reports": len(failed_reports),
            "export_format": export_format,
            "success_details": successful_reports,
            "failure_details": failed_reports,
            "generated_at": datetime.utcnow().isoformat(),
            "status": "completed"
        }
        
        logger.info(f"Bulk report generation completed: {len(successful_reports)}/{len(report_configs)} successful")
        return result
        
    except Exception as e:
        logger.error(f"Error in bulk report generation: {str(e)}")
        raise self.retry(countdown=180, max_retries=2, exc=e)

@celery_app.task(bind=True, base=DatabaseTask, name="analytics_tasks.report_tasks.cleanup_old_reports")
def cleanup_old_reports_task(self, db, days_to_keep: int = 30) -> Dict[str, Any]:
    """
    Clean up old report files and execution records
    
    Args:
        days_to_keep: Number of days to keep report files
        
    Returns:
        Dict containing cleanup results
    """
    try:
        logger.info(f"Starting cleanup of reports older than {days_to_keep} days")
        
        cutoff_date = datetime.utcnow() - timedelta(days=days_to_keep)
        
        # Get old report executions
        old_executions = db.query(ReportExecution).filter(
            ReportExecution.created_at < cutoff_date,
            ReportExecution.file_path.isnot(None)
        ).all()
        
        files_deleted = 0
        files_failed = 0
        total_size_freed = 0
        
        for execution in old_executions:
            try:
                if execution.file_path and os.path.exists(execution.file_path):
                    file_size = os.path.getsize(execution.file_path)
                    os.remove(execution.file_path)
                    files_deleted += 1
                    total_size_freed += file_size
                    
                    # Clear file path from database
                    execution.file_path = None
                    
            except Exception as file_error:
                logger.warning(f"Failed to delete file {execution.file_path}: {str(file_error)}")
                files_failed += 1
        
        # Delete old execution records (keep metadata)
        very_old_date = datetime.utcnow() - timedelta(days=days_to_keep * 2)
        old_records_count = db.query(ReportExecution).filter(
            ReportExecution.created_at < very_old_date
        ).count()
        
        db.query(ReportExecution).filter(
            ReportExecution.created_at < very_old_date
        ).delete()
        
        db.commit()
        
        result = {
            "cleanup_id": f"report_cleanup_{datetime.utcnow().isoformat()}",
            "cutoff_date": cutoff_date.isoformat(),
            "files_deleted": files_deleted,
            "files_failed": files_failed,
            "total_size_freed_bytes": total_size_freed,
            "total_size_freed_mb": round(total_size_freed / (1024 * 1024), 2),
            "old_records_deleted": old_records_count,
            "cleaned_at": datetime.utcnow().isoformat(),
            "status": "completed"
        }
        
        logger.info(f"Report cleanup completed: {files_deleted} files deleted, {result['total_size_freed_mb']} MB freed")
        return result
        
    except Exception as e:
        logger.error(f"Error in report cleanup: {str(e)}")
        db.rollback()
        raise self.retry(countdown=120, max_retries=3, exc=e)

@celery_app.task(bind=True, base=DatabaseTask, name="analytics_tasks.report_tasks.generate_analytics_summary_report")
def generate_analytics_summary_report_task(
    self, 
    db, 
    period_start: str, 
    period_end: str,
    include_forecasts: bool = True
) -> Dict[str, Any]:
    """
    Generate comprehensive analytics summary report
    
    Args:
        period_start: Start date in ISO format
        period_end: End date in ISO format
        include_forecasts: Whether to include forecast data
        
    Returns:
        Dict containing summary report results
    """
    try:
        logger.info(f"Starting analytics summary report for period {period_start} to {period_end}")
        
        # Import KPI tasks to get calculated data
        from analytics_tasks.kpi_tasks import (
            calculate_financial_kpis_task,
            calculate_operational_kpis_task,
            calculate_customer_kpis_task
        )
        
        # Calculate all KPI types for the period
        financial_task = calculate_financial_kpis_task.apply_async(
            args=[period_start, period_end]
        )
        operational_task = calculate_operational_kpis_task.apply_async(
            args=[period_start, period_end]
        )
        customer_task = calculate_customer_kpis_task.apply_async(
            args=[period_start, period_end]
        )
        
        # Wait for all KPI calculations
        financial_kpis = financial_task.get(timeout=600)
        operational_kpis = operational_task.get(timeout=600)
        customer_kpis = customer_task.get(timeout=600)
        
        # Get top performing items
        top_items_query = text("""
            SELECT 
                item.name,
                item.category,
                SUM(ii.quantity) as total_sold,
                SUM(ii.total_price) as total_revenue,
                AVG(ii.unit_price) as avg_price
            FROM invoice_items ii
            JOIN invoices i ON ii.invoice_id = i.id
            JOIN inventory_items item ON ii.inventory_item_id = item.id
            WHERE DATE(i.created_at) BETWEEN :start_date AND :end_date
                AND i.status = 'completed'
            GROUP BY item.id, item.name, item.category
            ORDER BY total_revenue DESC
            LIMIT 10
        """)
        
        top_items = db.execute(top_items_query, {
            "start_date": period_start,
            "end_date": period_end
        }).fetchall()
        
        top_items_data = [
            {
                "name": item.name,
                "category": item.category,
                "total_sold": float(item.total_sold),
                "total_revenue": float(item.total_revenue),
                "avg_price": float(item.avg_price)
            }
            for item in top_items
        ]
        
        # Get forecast data if requested
        forecast_data = {}
        if include_forecasts:
            try:
                from analytics_tasks.forecasting_tasks import update_all_forecasts_task
                forecast_result = update_all_forecasts_task.apply_async().get(timeout=1800)
                forecast_data = {
                    "forecast_summary": {
                        "total_items_forecasted": forecast_result.get("successful_forecasts", 0),
                        "forecast_period": "30 days",
                        "last_updated": forecast_result.get("updated_at")
                    }
                }
            except Exception as forecast_error:
                logger.warning(f"Failed to include forecast data: {str(forecast_error)}")
                forecast_data = {"forecast_error": str(forecast_error)}
        
        # Compile summary report
        summary_report = {
            "report_id": f"analytics_summary_{datetime.utcnow().isoformat()}",
            "period_start": period_start,
            "period_end": period_end,
            "generated_at": datetime.utcnow().isoformat(),
            "financial_kpis": financial_kpis,
            "operational_kpis": operational_kpis,
            "customer_kpis": customer_kpis,
            "top_performing_items": top_items_data,
            **forecast_data,
            "summary_metrics": {
                "total_revenue": financial_kpis.get("revenue_kpis", {}).get("current_revenue", 0),
                "total_transactions": customer_kpis.get("transaction_kpis", {}).get("transaction_count", 0),
                "avg_transaction_value": customer_kpis.get("transaction_kpis", {}).get("avg_transaction_value", 0),
                "inventory_turnover": operational_kpis.get("inventory_kpis", {}).get("turnover_rate", 0)
            }
        }
        
        # Export as PDF report
        report_engine = ReportEngineService(db)
        export_result = asyncio.run(report_engine.export_analytics_summary(
            summary_data=summary_report,
            format="pdf"
        ))
        
        result = {
            "summary_report_id": summary_report["report_id"],
            "period_start": period_start,
            "period_end": period_end,
            "file_path": export_result.get("file_path"),
            "file_size": export_result.get("file_size", 0),
            "total_kpis": len(financial_kpis) + len(operational_kpis) + len(customer_kpis),
            "top_items_count": len(top_items_data),
            "includes_forecasts": include_forecasts,
            "generated_at": datetime.utcnow().isoformat(),
            "status": "completed"
        }
        
        logger.info(f"Analytics summary report generated successfully")
        return result
        
    except Exception as e:
        logger.error(f"Error generating analytics summary report: {str(e)}")
        raise self.retry(countdown=300, max_retries=2, exc=e)