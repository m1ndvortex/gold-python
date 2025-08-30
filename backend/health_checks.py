"""
Health Check Endpoints for Universal Inventory Management System
Provides comprehensive health monitoring for all system components
"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
import redis
import psutil
import time
from datetime import datetime
from typing import Dict, Any
import logging

from database import get_db
from redis_config import get_redis_client

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/health")
async def health_check():
    """Basic health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "goldshop-backend"
    }

@router.get("/health/detailed")
async def detailed_health_check(db: Session = Depends(get_db)):
    """Detailed health check with all system components"""
    health_status = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "goldshop-backend",
        "components": {}
    }
    
    overall_healthy = True
    
    # Database Health Check
    try:
        start_time = time.time()
        db.execute(text("SELECT 1"))
        db_response_time = (time.time() - start_time) * 1000
        
        health_status["components"]["database"] = {
            "status": "healthy",
            "response_time_ms": round(db_response_time, 2),
            "connection": "active"
        }
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        health_status["components"]["database"] = {
            "status": "unhealthy",
            "error": str(e)
        }
        overall_healthy = False
    
    # Redis Health Check
    try:
        redis_client = get_redis_client()
        start_time = time.time()
        redis_client.ping()
        redis_response_time = (time.time() - start_time) * 1000
        
        redis_info = redis_client.info()
        health_status["components"]["redis"] = {
            "status": "healthy",
            "response_time_ms": round(redis_response_time, 2),
            "memory_usage": redis_info.get("used_memory_human"),
            "connected_clients": redis_info.get("connected_clients"),
            "uptime_seconds": redis_info.get("uptime_in_seconds")
        }
    except Exception as e:
        logger.error(f"Redis health check failed: {e}")
        health_status["components"]["redis"] = {
            "status": "unhealthy",
            "error": str(e)
        }
        overall_healthy = False
    
    # System Resources Check
    try:
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        health_status["components"]["system"] = {
            "status": "healthy",
            "cpu_percent": cpu_percent,
            "memory_percent": memory.percent,
            "memory_available_gb": round(memory.available / (1024**3), 2),
            "disk_percent": round((disk.used / disk.total) * 100, 2),
            "disk_free_gb": round(disk.free / (1024**3), 2)
        }
        
        # Mark as unhealthy if resources are critically low
        if cpu_percent > 90 or memory.percent > 90 or (disk.used / disk.total) > 0.95:
            health_status["components"]["system"]["status"] = "warning"
            if cpu_percent > 95 or memory.percent > 95 or (disk.used / disk.total) > 0.98:
                health_status["components"]["system"]["status"] = "unhealthy"
                overall_healthy = False
                
    except Exception as e:
        logger.error(f"System health check failed: {e}")
        health_status["components"]["system"] = {
            "status": "unhealthy",
            "error": str(e)
        }
        overall_healthy = False
    
    # Application-specific checks
    try:
        # Check if critical tables exist
        critical_tables = [
            "users", "categories", "inventory_items", "invoices", 
            "customers", "chart_of_accounts", "journal_entries"
        ]
        
        table_status = {}
        for table in critical_tables:
            try:
                result = db.execute(text(f"SELECT COUNT(*) FROM {table}"))
                count = result.scalar()
                table_status[table] = {"status": "healthy", "record_count": count}
            except Exception as table_error:
                table_status[table] = {"status": "unhealthy", "error": str(table_error)}
                overall_healthy = False
        
        health_status["components"]["database_tables"] = {
            "status": "healthy" if overall_healthy else "unhealthy",
            "tables": table_status
        }
        
    except Exception as e:
        logger.error(f"Database tables health check failed: {e}")
        health_status["components"]["database_tables"] = {
            "status": "unhealthy",
            "error": str(e)
        }
        overall_healthy = False
    
    # Update overall status
    health_status["status"] = "healthy" if overall_healthy else "unhealthy"
    
    if not overall_healthy:
        raise HTTPException(status_code=503, detail=health_status)
    
    return health_status

@router.get("/health/readiness")
async def readiness_check(db: Session = Depends(get_db)):
    """Readiness check - determines if the service is ready to accept traffic"""
    try:
        # Check database connection
        db.execute(text("SELECT 1"))
        
        # Check Redis connection
        redis_client = get_redis_client()
        redis_client.ping()
        
        # Check if essential tables exist
        essential_tables = ["users", "categories", "inventory_items"]
        for table in essential_tables:
            db.execute(text(f"SELECT 1 FROM {table} LIMIT 1"))
        
        return {
            "status": "ready",
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Readiness check failed: {e}")
        raise HTTPException(
            status_code=503, 
            detail={
                "status": "not_ready",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
        )

@router.get("/health/liveness")
async def liveness_check():
    """Liveness check - determines if the service is alive"""
    return {
        "status": "alive",
        "timestamp": datetime.utcnow().isoformat(),
        "uptime_seconds": time.time() - psutil.boot_time()
    }

@router.get("/metrics")
async def metrics_endpoint(db: Session = Depends(get_db)):
    """Prometheus-compatible metrics endpoint"""
    try:
        # Database metrics
        db_metrics = {}
        
        # Get table row counts
        tables = ["users", "customers", "inventory_items", "invoices", "categories"]
        for table in tables:
            try:
                result = db.execute(text(f"SELECT COUNT(*) FROM {table}"))
                db_metrics[f"{table}_count"] = result.scalar()
            except:
                db_metrics[f"{table}_count"] = 0
        
        # Redis metrics
        redis_client = get_redis_client()
        redis_info = redis_client.info()
        
        # System metrics
        cpu_percent = psutil.cpu_percent()
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        # Format as Prometheus metrics
        metrics_output = []
        
        # Database metrics
        for table, count in db_metrics.items():
            metrics_output.append(f'goldshop_db_{table} {count}')
        
        # Redis metrics
        metrics_output.append(f'goldshop_redis_connected_clients {redis_info.get("connected_clients", 0)}')
        metrics_output.append(f'goldshop_redis_used_memory_bytes {redis_info.get("used_memory", 0)}')
        metrics_output.append(f'goldshop_redis_uptime_seconds {redis_info.get("uptime_in_seconds", 0)}')
        
        # System metrics
        metrics_output.append(f'goldshop_system_cpu_percent {cpu_percent}')
        metrics_output.append(f'goldshop_system_memory_percent {memory.percent}')
        metrics_output.append(f'goldshop_system_disk_percent {round((disk.used / disk.total) * 100, 2)}')
        
        return "\n".join(metrics_output)
        
    except Exception as e:
        logger.error(f"Metrics endpoint failed: {e}")
        raise HTTPException(status_code=500, detail=f"Metrics collection failed: {str(e)}")

@router.get("/health/dependencies")
async def dependencies_check():
    """Check external dependencies status"""
    dependencies = {
        "database": {"status": "unknown"},
        "redis": {"status": "unknown"},
        "file_system": {"status": "unknown"}
    }
    
    # Database check
    try:
        from database import engine
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        dependencies["database"] = {"status": "healthy"}
    except Exception as e:
        dependencies["database"] = {"status": "unhealthy", "error": str(e)}
    
    # Redis check
    try:
        redis_client = get_redis_client()
        redis_client.ping()
        dependencies["redis"] = {"status": "healthy"}
    except Exception as e:
        dependencies["redis"] = {"status": "unhealthy", "error": str(e)}
    
    # File system check
    try:
        import os
        uploads_dir = "/app/uploads"
        if os.path.exists(uploads_dir) and os.access(uploads_dir, os.W_OK):
            dependencies["file_system"] = {"status": "healthy"}
        else:
            dependencies["file_system"] = {"status": "unhealthy", "error": "Uploads directory not writable"}
    except Exception as e:
        dependencies["file_system"] = {"status": "unhealthy", "error": str(e)}
    
    # Overall status
    all_healthy = all(dep["status"] == "healthy" for dep in dependencies.values())
    
    return {
        "status": "healthy" if all_healthy else "unhealthy",
        "dependencies": dependencies,
        "timestamp": datetime.utcnow().isoformat()
    }