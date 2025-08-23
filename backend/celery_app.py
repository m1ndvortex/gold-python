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
        "analytics_tasks.report_tasks"
    ]
)

# Celery configuration
celery_app.conf.update(
    # Task routing
    task_routes={
        "analytics_tasks.kpi_tasks.*": {"queue": "kpi_queue"},
        "analytics_tasks.forecasting_tasks.*": {"queue": "forecasting_queue"},
        "analytics_tasks.report_tasks.*": {"queue": "reports_queue"},
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
    },
)

# Task discovery
celery_app.autodiscover_tasks()

if __name__ == "__main__":
    celery_app.start()