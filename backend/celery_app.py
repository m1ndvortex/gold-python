"""
Celery Application Configuration for Analytics Background Tasks

This module configures Celery for handling heavy KPI calculations, 
demand forecasting, and automated analytics processing.

Requirements covered: 1.4, 3.4, 4.4
"""

import os
from celery import Celery
from dotenv import load_dotenv

load_dotenv()

# Create Celery instance
celery_app = Celery(
    "analytics_tasks",
    broker=os.getenv("CELERY_BROKER_URL", "redis://redis:6379/1"),
    backend=os.getenv("CELERY_RESULT_BACKEND", "redis://redis:6379/1"),
    include=[
        "analytics_tasks.kpi_tasks",
        "analytics_tasks.forecasting_tasks", 
        "analytics_tasks.report_tasks",
        "analytics_tasks.backup_tasks",
        "analytics_tasks.alert_tasks",
        "analytics_tasks.disaster_recovery_tasks",
        "analytics_tasks.analytics_intelligence_tasks"
    ]
)

# Celery configuration
celery_app.conf.update(
    # Task routing
    task_routes={
        "analytics_tasks.kpi_tasks.*": {"queue": "kpi_queue"},
        "analytics_tasks.forecasting_tasks.*": {"queue": "forecasting_queue"},
        "analytics_tasks.report_tasks.*": {"queue": "reports_queue"},
        "analytics_tasks.backup_tasks.*": {"queue": "backup_queue"},
        "analytics_tasks.alert_tasks.*": {"queue": "alerts_queue"},
        "analytics_tasks.disaster_recovery_tasks.*": {"queue": "disaster_recovery_queue"},
        "analytics_tasks.analytics_intelligence_tasks.*": {"queue": "analytics_intelligence_queue"},
    },
    
    # Task execution settings
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    
    # Task time limits
    task_time_limit=30 * 60,  # 30 minutes hard limit
    task_soft_time_limit=25 * 60,  # 25 minutes soft limit
    
    # Worker settings
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    worker_max_tasks_per_child=1000,
    
    # Result backend settings
    result_expires=3600,  # 1 hour
    result_persistent=True,
    
    # Task retry settings
    task_default_retry_delay=60,  # 1 minute
    task_max_retries=3,
    
    # Beat schedule for periodic tasks
    beat_schedule={
        # KPI snapshot generation
        "generate-hourly-kpi-snapshots": {
            "task": "analytics_tasks.kpi_tasks.generate_kpi_snapshots",
            "schedule": 3600.0,  # Every hour
            "args": ("hourly",),
        },
        "generate-daily-kpi-snapshots": {
            "task": "analytics_tasks.kpi_tasks.generate_kpi_snapshots", 
            "schedule": 86400.0,  # Every day
            "args": ("daily",),
        },
        
        # Demand forecasting updates
        "update-demand-forecasts": {
            "task": "analytics_tasks.forecasting_tasks.update_all_forecasts",
            "schedule": 21600.0,  # Every 6 hours
        },
        
        # Model training and validation
        "train-forecasting-models": {
            "task": "analytics_tasks.forecasting_tasks.train_forecasting_models",
            "schedule": 604800.0,  # Weekly
        },
        
        # Cache cleanup
        "cleanup-analytics-cache": {
            "task": "analytics_tasks.kpi_tasks.cleanup_expired_cache",
            "schedule": 1800.0,  # Every 30 minutes
        },
        
        # Scheduled report generation
        "process-scheduled-reports": {
            "task": "analytics_tasks.report_tasks.process_scheduled_reports",
            "schedule": 300.0,  # Every 5 minutes
        },
        
        # Backup tasks
        "daily-full-backup": {
            "task": "analytics_tasks.backup_tasks.create_scheduled_full_backup",
            "schedule": 86400.0,  # Daily at midnight
            "options": {"expires": 7200},  # Expire after 2 hours
        },
        "hourly-database-backup": {
            "task": "analytics_tasks.backup_tasks.create_scheduled_database_backup", 
            "schedule": 3600.0,  # Every hour
            "options": {"expires": 1800},  # Expire after 30 minutes
        },
        "daily-backup-verification": {
            "task": "analytics_tasks.backup_tasks.verify_all_backups",
            "schedule": 86400.0,  # Daily
            "options": {"expires": 3600},  # Expire after 1 hour
        },
        "weekly-backup-cleanup": {
            "task": "analytics_tasks.backup_tasks.cleanup_old_backups",
            "schedule": 604800.0,  # Weekly
            "kwargs": {"retention_days": 30},
            "options": {"expires": 3600},  # Expire after 1 hour
        },
        
        # Disaster recovery tasks
        "daily-retention-policy": {
            "task": "analytics_tasks.disaster_recovery_tasks.apply_retention_policy",
            "schedule": 86400.0,  # Daily at 3 AM
            "options": {"expires": 7200},  # Expire after 2 hours
        },
        "hourly-offsite-sync": {
            "task": "analytics_tasks.disaster_recovery_tasks.sync_to_offsite_storage",
            "schedule": 3600.0,  # Every hour
            "options": {"expires": 1800},  # Expire after 30 minutes
        },
        "daily-recovery-test": {
            "task": "analytics_tasks.disaster_recovery_tasks.test_recovery_procedures",
            "schedule": 86400.0,  # Daily at 4 AM
            "options": {"expires": 3600},  # Expire after 1 hour
        },
        "system-health-monitoring": {
            "task": "analytics_tasks.disaster_recovery_tasks.monitor_system_health",
            "schedule": 14400.0,  # Every 4 hours
            "options": {"expires": 1800},  # Expire after 30 minutes
        },
        "weekly-logs-cleanup": {
            "task": "analytics_tasks.disaster_recovery_tasks.cleanup_recovery_logs",
            "schedule": 604800.0,  # Weekly
            "kwargs": {"retention_days": 90},
            "options": {"expires": 3600},  # Expire after 1 hour
        },
        
        # Advanced analytics tasks
        "daily-business-insights": {
            "task": "analytics_tasks.analytics_intelligence_tasks.generate_business_insights_task",
            "schedule": 86400.0,  # Daily
            "kwargs": {"business_type": "gold_shop", "analysis_period_days": 30},
            "options": {"expires": 7200},  # Expire after 2 hours
        },
        "weekly-customer-segmentation": {
            "task": "analytics_tasks.analytics_intelligence_tasks.perform_customer_segmentation_task",
            "schedule": 604800.0,  # Weekly
            "kwargs": {"segmentation_method": "rfm", "num_segments": 5},
            "options": {"expires": 3600},  # Expire after 1 hour
        },
        "daily-anomaly-detection": {
            "task": "analytics_tasks.analytics_intelligence_tasks.detect_anomalies_task",
            "schedule": 86400.0,  # Daily
            "kwargs": {"metric_name": "revenue", "detection_method": "statistical"},
            "options": {"expires": 1800},  # Expire after 30 minutes
        },
        "analytics-cache-cleanup": {
            "task": "analytics_tasks.analytics_intelligence_tasks.cleanup_analytics_cache_task",
            "schedule": 3600.0,  # Every hour
            "options": {"expires": 900},  # Expire after 15 minutes
        },
    },
)

# Task discovery
celery_app.autodiscover_tasks()

if __name__ == "__main__":
    celery_app.start()