"""
KPI Background Tasks

Celery tasks for heavy KPI calculations, automated snapshot generation,
and cache management for analytics data.

Requirements covered: 1.4
"""

import asyncio
from datetime import datetime, date, timedelta
from typing import Dict, List, Optional, Any
from decimal import Decimal
import logging

from celery import Task
from celery.exceptions import Retry
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
import os

from celery_app import celery_app
from database import get_db
from models import KPISnapshot, InventoryItem, Invoice, Customer
from services.kpi_calculator_service import (
    FinancialKPICalculator, 
    OperationalKPICalculator, 
    CustomerKPICalculator
)
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

@celery_app.task(bind=True, name="analytics_tasks.kpi_tasks.calculate_financial_kpis")
def calculate_financial_kpis_task(self, start_date: str, end_date: str, targets: Optional[Dict] = None) -> Dict[str, Any]:
    """
    Background task for heavy financial KPI calculations
    
    Args:
        start_date: Start date in ISO format
        end_date: End date in ISO format  
        targets: Optional targets for achievement calculation
        
    Returns:
        Dict containing calculated financial KPIs
    """
    try:
        logger.info(f"Starting financial KPI calculation for period {start_date} to {end_date}")
        
        # Create database session
        with SessionLocal() as db:
            # Parse dates
            start_dt = datetime.fromisoformat(start_date).date()
            end_dt = datetime.fromisoformat(end_date).date()
            
            # Initialize calculator
            calculator = FinancialKPICalculator(db)
            
            # Calculate KPIs
            revenue_kpis = asyncio.run(calculator.calculate_revenue_kpis(start_dt, end_dt, targets))
            profit_kpis = asyncio.run(calculator.calculate_profit_margin_kpis(start_dt, end_dt, targets))
            
            if targets:
                achievement_kpis = asyncio.run(calculator.calculate_achievement_rate_kpis(start_dt, end_dt, targets))
            else:
                achievement_kpis = {}
            
            # Combine results
            result = {
                "calculation_id": f"financial_kpis_{start_date}_{end_date}_{datetime.utcnow().isoformat()}",
                "period_start": start_date,
                "period_end": end_date,
                "calculated_at": datetime.utcnow().isoformat(),
                "revenue_kpis": revenue_kpis,
                "profit_kpis": profit_kpis,
                "achievement_kpis": achievement_kpis,
                "status": "completed"
            }
            
            logger.info(f"Financial KPI calculation completed successfully")
            return result
        
    except Exception as e:
        logger.error(f"Error in financial KPI calculation: {str(e)}")
        raise self.retry(countdown=60, max_retries=3, exc=e)

@celery_app.task(bind=True, base=DatabaseTask, name="analytics_tasks.kpi_tasks.calculate_operational_kpis")
def calculate_operational_kpis_task(self, db, start_date: str, end_date: str) -> Dict[str, Any]:
    """
    Background task for operational KPI calculations
    
    Args:
        start_date: Start date in ISO format
        end_date: End date in ISO format
        
    Returns:
        Dict containing calculated operational KPIs
    """
    try:
        logger.info(f"Starting operational KPI calculation for period {start_date} to {end_date}")
        
        # Parse dates
        start_dt = datetime.fromisoformat(start_date).date()
        end_dt = datetime.fromisoformat(end_date).date()
        
        # Initialize calculator
        calculator = OperationalKPICalculator(db)
        
        # Calculate KPIs
        inventory_kpis = asyncio.run(calculator.calculate_inventory_turnover_kpis(start_dt, end_dt))
        stockout_kpis = asyncio.run(calculator.calculate_stockout_frequency_kpis(start_dt, end_dt))
        carrying_cost_kpis = asyncio.run(calculator.calculate_carrying_cost_kpis(start_dt, end_dt))
        
        # Combine results
        result = {
            "calculation_id": f"operational_kpis_{start_date}_{end_date}_{datetime.utcnow().isoformat()}",
            "period_start": start_date,
            "period_end": end_date,
            "calculated_at": datetime.utcnow().isoformat(),
            "inventory_kpis": inventory_kpis,
            "stockout_kpis": stockout_kpis,
            "carrying_cost_kpis": carrying_cost_kpis,
            "status": "completed"
        }
        
        logger.info(f"Operational KPI calculation completed successfully")
        return result
        
    except Exception as e:
        logger.error(f"Error in operational KPI calculation: {str(e)}")
        raise self.retry(countdown=60, max_retries=3, exc=e)

@celery_app.task(bind=True, base=DatabaseTask, name="analytics_tasks.kpi_tasks.calculate_customer_kpis")
def calculate_customer_kpis_task(self, db, start_date: str, end_date: str) -> Dict[str, Any]:
    """
    Background task for customer KPI calculations
    
    Args:
        start_date: Start date in ISO format
        end_date: End date in ISO format
        
    Returns:
        Dict containing calculated customer KPIs
    """
    try:
        logger.info(f"Starting customer KPI calculation for period {start_date} to {end_date}")
        
        # Parse dates
        start_dt = datetime.fromisoformat(start_date).date()
        end_dt = datetime.fromisoformat(end_date).date()
        
        # Initialize calculator
        calculator = CustomerKPICalculator(db)
        
        # Calculate KPIs
        acquisition_kpis = asyncio.run(calculator.calculate_acquisition_rate_kpis(start_dt, end_dt))
        retention_kpis = asyncio.run(calculator.calculate_retention_rate_kpis(start_dt, end_dt))
        transaction_kpis = asyncio.run(calculator.calculate_transaction_value_kpis(start_dt, end_dt))
        lifetime_value_kpis = asyncio.run(calculator.calculate_lifetime_value_kpis(start_dt, end_dt))
        
        # Combine results
        result = {
            "calculation_id": f"customer_kpis_{start_date}_{end_date}_{datetime.utcnow().isoformat()}",
            "period_start": start_date,
            "period_end": end_date,
            "calculated_at": datetime.utcnow().isoformat(),
            "acquisition_kpis": acquisition_kpis,
            "retention_kpis": retention_kpis,
            "transaction_kpis": transaction_kpis,
            "lifetime_value_kpis": lifetime_value_kpis,
            "status": "completed"
        }
        
        logger.info(f"Customer KPI calculation completed successfully")
        return result
        
    except Exception as e:
        logger.error(f"Error in customer KPI calculation: {str(e)}")
        raise self.retry(countdown=60, max_retries=3, exc=e)

@celery_app.task(bind=True, name="analytics_tasks.kpi_tasks.generate_kpi_snapshots")
def generate_kpi_snapshots(self, interval: str = "daily") -> Dict[str, Any]:
    """
    Generate automated KPI snapshots with configurable intervals
    
    Args:
        interval: Snapshot interval ('hourly', 'daily', 'weekly', 'monthly')
        
    Returns:
        Dict containing snapshot generation results
    """
    try:
        logger.info(f"Starting {interval} KPI snapshot generation")
        
        with SessionLocal() as db:
            # Determine date range based on interval
            end_date = date.today()
            
            if interval == "hourly":
                start_date = end_date
            elif interval == "daily":
                start_date = end_date - timedelta(days=1)
            elif interval == "weekly":
                start_date = end_date - timedelta(days=7)
            elif interval == "monthly":
                start_date = end_date - timedelta(days=30)
            else:
                raise ValueError(f"Invalid interval: {interval}")
        
            # Calculate all KPI types
            financial_task = calculate_financial_kpis_task.delay(
                start_date.isoformat(), 
                end_date.isoformat()
            )
            operational_task = calculate_operational_kpis_task.delay(
                start_date.isoformat(), 
                end_date.isoformat()
            )
            customer_task = calculate_customer_kpis_task.delay(
                start_date.isoformat(), 
                end_date.isoformat()
            )
            
            # Wait for all tasks to complete
            financial_result = financial_task.get(timeout=1800)  # 30 minutes timeout
            operational_result = operational_task.get(timeout=1800)
            customer_result = customer_task.get(timeout=1800)
            
            # Store snapshots in database
            snapshots_created = []
            
            # Financial KPI snapshots
            for kpi_name, kpi_data in financial_result.get("revenue_kpis", {}).items():
                if isinstance(kpi_data, (int, float, Decimal)):
                    snapshot = KPISnapshot(
                        kpi_type="financial",
                        kpi_name=f"revenue_{kpi_name}",
                        value=Decimal(str(kpi_data)),
                        period_start=datetime.combine(start_date, datetime.min.time()),
                        period_end=datetime.combine(end_date, datetime.min.time()),
                        kpi_metadata={"source": "automated_snapshot", "interval": interval}
                    )
                    db.add(snapshot)
                    snapshots_created.append(f"revenue_{kpi_name}")
            
            # Operational KPI snapshots
            for kpi_name, kpi_data in operational_result.get("inventory_kpis", {}).items():
                if isinstance(kpi_data, (int, float, Decimal)):
                    snapshot = KPISnapshot(
                        kpi_type="operational",
                        kpi_name=f"inventory_{kpi_name}",
                        value=Decimal(str(kpi_data)),
                        period_start=datetime.combine(start_date, datetime.min.time()),
                        period_end=datetime.combine(end_date, datetime.min.time()),
                        kpi_metadata={"source": "automated_snapshot", "interval": interval}
                    )
                    db.add(snapshot)
                    snapshots_created.append(f"inventory_{kpi_name}")
            
            # Customer KPI snapshots
            for kpi_name, kpi_data in customer_result.get("acquisition_kpis", {}).items():
                if isinstance(kpi_data, (int, float, Decimal)):
                    snapshot = KPISnapshot(
                        kpi_type="customer",
                        kpi_name=f"acquisition_{kpi_name}",
                        value=Decimal(str(kpi_data)),
                        period_start=datetime.combine(start_date, datetime.min.time()),
                        period_end=datetime.combine(end_date, datetime.min.time()),
                        kpi_metadata={"source": "automated_snapshot", "interval": interval}
                    )
                    db.add(snapshot)
                    snapshots_created.append(f"acquisition_{kpi_name}")
            
            # Commit all snapshots
            db.commit()
            
            result = {
                "snapshot_id": f"kpi_snapshots_{interval}_{datetime.utcnow().isoformat()}",
                "interval": interval,
                "period_start": start_date.isoformat(),
                "period_end": end_date.isoformat(),
                "snapshots_created": len(snapshots_created),
                "snapshot_names": snapshots_created,
                "generated_at": datetime.utcnow().isoformat(),
                "status": "completed"
            }
            
            logger.info(f"KPI snapshot generation completed: {len(snapshots_created)} snapshots created")
            return result
        
    except Exception as e:
        logger.error(f"Error in KPI snapshot generation: {str(e)}")
        raise self.retry(countdown=300, max_retries=3, exc=e)  # 5 minute retry delay

@celery_app.task(bind=True, name="analytics_tasks.kpi_tasks.cleanup_expired_cache")
def cleanup_expired_cache(self) -> Dict[str, Any]:
    """
    Clean up expired analytics cache entries
    
    Returns:
        Dict containing cleanup results
    """
    try:
        logger.info("Starting analytics cache cleanup")
        
        cache = get_analytics_cache()
        
        # Perform cache cleanup
        asyncio.run(cache.cleanup_expired_cache())
        
        # Get cache statistics
        cache_stats = cache.get_cache_stats()
        
        result = {
            "cleanup_id": f"cache_cleanup_{datetime.utcnow().isoformat()}",
            "cleaned_at": datetime.utcnow().isoformat(),
            "cache_stats": cache_stats,
            "status": "completed"
        }
        
        logger.info("Analytics cache cleanup completed")
        return result
        
    except Exception as e:
        logger.error(f"Error in cache cleanup: {str(e)}")
        raise self.retry(countdown=60, max_retries=3, exc=e)

@celery_app.task(bind=True, base=DatabaseTask, name="analytics_tasks.kpi_tasks.calculate_kpi_trends")
def calculate_kpi_trends_task(self, db, kpi_type: str, kpi_name: str, periods: int = 30) -> Dict[str, Any]:
    """
    Calculate KPI trends over specified periods
    
    Args:
        kpi_type: Type of KPI ('financial', 'operational', 'customer')
        kpi_name: Name of the specific KPI
        periods: Number of periods to analyze
        
    Returns:
        Dict containing trend analysis results
    """
    try:
        logger.info(f"Starting trend calculation for {kpi_type}.{kpi_name} over {periods} periods")
        
        # Get historical KPI snapshots
        snapshots = db.query(KPISnapshot).filter(
            KPISnapshot.kpi_type == kpi_type,
            KPISnapshot.kpi_name == kpi_name,
            KPISnapshot.created_at >= datetime.utcnow() - timedelta(days=periods)
        ).order_by(KPISnapshot.created_at.asc()).all()
        
        if len(snapshots) < 3:
            return {
                "trend_id": f"trend_{kpi_type}_{kpi_name}_{datetime.utcnow().isoformat()}",
                "kpi_type": kpi_type,
                "kpi_name": kpi_name,
                "trend": "insufficient_data",
                "data_points": len(snapshots),
                "status": "completed"
            }
        
        # Extract values and calculate trend
        values = [float(snapshot.value) for snapshot in snapshots]
        dates = [snapshot.created_at for snapshot in snapshots]
        
        # Simple linear trend calculation
        from scipy import stats
        import numpy as np
        
        x = np.arange(len(values))
        slope, intercept, r_value, p_value, std_err = stats.linregress(x, values)
        
        # Determine trend direction
        if slope > 0 and p_value < 0.05:
            trend_direction = "increasing"
        elif slope < 0 and p_value < 0.05:
            trend_direction = "decreasing"
        else:
            trend_direction = "stable"
        
        # Calculate percentage change
        if len(values) >= 2:
            pct_change = ((values[-1] - values[0]) / values[0] * 100) if values[0] != 0 else 0
        else:
            pct_change = 0
        
        result = {
            "trend_id": f"trend_{kpi_type}_{kpi_name}_{datetime.utcnow().isoformat()}",
            "kpi_type": kpi_type,
            "kpi_name": kpi_name,
            "trend": trend_direction,
            "slope": round(slope, 4),
            "r_squared": round(r_value ** 2, 4),
            "p_value": round(p_value, 4),
            "percentage_change": round(pct_change, 2),
            "data_points": len(snapshots),
            "period_start": dates[0].isoformat() if dates else None,
            "period_end": dates[-1].isoformat() if dates else None,
            "calculated_at": datetime.utcnow().isoformat(),
            "status": "completed"
        }
        
        logger.info(f"Trend calculation completed for {kpi_type}.{kpi_name}")
        return result
        
    except Exception as e:
        logger.error(f"Error in trend calculation: {str(e)}")
        raise self.retry(countdown=60, max_retries=3, exc=e)

@celery_app.task(bind=True, base=DatabaseTask, name="analytics_tasks.kpi_tasks.bulk_kpi_calculation")
def bulk_kpi_calculation_task(self, db, date_ranges: List[Dict], targets: Optional[Dict] = None) -> Dict[str, Any]:
    """
    Perform bulk KPI calculations for multiple date ranges
    
    Args:
        date_ranges: List of date range dicts with 'start_date' and 'end_date'
        targets: Optional targets for achievement calculations
        
    Returns:
        Dict containing bulk calculation results
    """
    try:
        logger.info(f"Starting bulk KPI calculation for {len(date_ranges)} date ranges")
        
        results = []
        failed_calculations = []
        
        for i, date_range in enumerate(date_ranges):
            try:
                start_date = date_range["start_date"]
                end_date = date_range["end_date"]
                
                # Calculate all KPI types for this date range
                financial_result = calculate_financial_kpis_task.apply_async(
                    args=[start_date, end_date, targets]
                ).get(timeout=600)  # 10 minute timeout per calculation
                
                operational_result = calculate_operational_kpis_task.apply_async(
                    args=[start_date, end_date]
                ).get(timeout=600)
                
                customer_result = calculate_customer_kpis_task.apply_async(
                    args=[start_date, end_date]
                ).get(timeout=600)
                
                # Combine results for this date range
                range_result = {
                    "range_index": i,
                    "start_date": start_date,
                    "end_date": end_date,
                    "financial_kpis": financial_result,
                    "operational_kpis": operational_result,
                    "customer_kpis": customer_result,
                    "status": "completed"
                }
                
                results.append(range_result)
                
            except Exception as range_error:
                logger.error(f"Error calculating KPIs for range {i}: {str(range_error)}")
                failed_calculations.append({
                    "range_index": i,
                    "date_range": date_range,
                    "error": str(range_error)
                })
        
        result = {
            "bulk_calculation_id": f"bulk_kpis_{datetime.utcnow().isoformat()}",
            "total_ranges": len(date_ranges),
            "successful_calculations": len(results),
            "failed_calculations": len(failed_calculations),
            "results": results,
            "failures": failed_calculations,
            "calculated_at": datetime.utcnow().isoformat(),
            "status": "completed"
        }
        
        logger.info(f"Bulk KPI calculation completed: {len(results)}/{len(date_ranges)} successful")
        return result
        
    except Exception as e:
        logger.error(f"Error in bulk KPI calculation: {str(e)}")
        raise self.retry(countdown=120, max_retries=2, exc=e)  # 2 minute retry delay