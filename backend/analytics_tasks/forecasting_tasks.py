"""
Forecasting Background Tasks

Celery tasks for demand forecasting, model training and validation,
and automated forecast updates.

Requirements covered: 3.4
"""

import asyncio
from datetime import datetime, date, timedelta
from typing import Dict, List, Optional, Any, Tuple
import logging
import json

from celery import Task
from celery.exceptions import Retry
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine, text
import os
import numpy as np
from decimal import Decimal

from celery_app import celery_app
from models import InventoryItem, DemandForecast, ForecastModel
from services.forecasting_service import ForecastingService
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

@celery_app.task(bind=True, name="analytics_tasks.forecasting_tasks.generate_demand_forecast")
def generate_demand_forecast_task(
    self, 
    item_id: str, 
    periods: int = 30, 
    model_type: str = "arima"
) -> Dict[str, Any]:
    """
    Generate demand forecast for a specific inventory item
    
    Args:
        item_id: UUID of the inventory item
        periods: Number of periods to forecast
        model_type: Forecasting model type
        
    Returns:
        Dict containing forecast results
    """
    try:
        logger.info(f"Starting demand forecast for item {item_id} using {model_type} model")
        
        with SessionLocal() as db:
            # Initialize forecasting service
            forecasting_service = ForecastingService(db)
        
            # Generate forecast
            forecast_result = asyncio.run(forecasting_service.forecast_demand(
                item_id=item_id,
                periods=periods,
                model_type=model_type
            ))
            
            # Store forecast in database
            for prediction in forecast_result.predictions:
                demand_forecast = DemandForecast(
                    item_id=item_id,
                    forecast_date=datetime.fromisoformat(prediction['date']).date(),
                    forecast_period="daily",
                    predicted_demand=Decimal(str(prediction['predicted_demand'])),
                    confidence_interval_lower=Decimal(str(prediction['confidence_lower'])),
                    confidence_interval_upper=Decimal(str(prediction['confidence_upper'])),
                    confidence_score=Decimal(str(forecast_result.confidence_score)),
                    model_used=model_type,
                    accuracy_score=Decimal(str(forecast_result.confidence_score)),
                    historical_data={
                        "day_of_week": prediction['day_of_week'],
                        "month": prediction['month'],
                        "seasonal_patterns": forecast_result.seasonal_patterns
                    }
                )
                db.add(demand_forecast)
            
            db.commit()
            
            # Cache forecast results
            cache = get_analytics_cache()
            forecast_period = f"{forecast_result.forecast_period_start}_{forecast_result.forecast_period_end}"
            asyncio.run(cache.set_forecast_data(
                item_id=item_id,
                forecast_period=forecast_period,
                data={
                    "predictions": forecast_result.predictions,
                    "confidence_score": forecast_result.confidence_score,
                    "model_used": forecast_result.model_used,
                    "accuracy_metrics": forecast_result.accuracy_metrics
                },
                ttl=3600  # 1 hour cache
            ))
            
            result = {
                "forecast_id": f"forecast_{item_id}_{datetime.utcnow().isoformat()}",
                "item_id": item_id,
                "model_type": model_type,
                "periods": periods,
                "predictions_count": len(forecast_result.predictions),
                "confidence_score": forecast_result.confidence_score,
                "forecast_period_start": forecast_result.forecast_period_start.isoformat(),
                "forecast_period_end": forecast_result.forecast_period_end.isoformat(),
                "accuracy_metrics": forecast_result.accuracy_metrics,
                "generated_at": datetime.utcnow().isoformat(),
                "status": "completed"
            }
            
            logger.info(f"Demand forecast completed for item {item_id}")
            return result
        
    except Exception as e:
        logger.error(f"Error generating demand forecast for item {item_id}: {str(e)}")
        raise self.retry(countdown=120, max_retries=3, exc=e)

@celery_app.task(bind=True, base=DatabaseTask, name="analytics_tasks.forecasting_tasks.update_all_forecasts")
def update_all_forecasts_task(self, db) -> Dict[str, Any]:
    """
    Update demand forecasts for all active inventory items
    
    Returns:
        Dict containing update results
    """
    try:
        logger.info("Starting forecast update for all active inventory items")
        
        # Get all active inventory items
        active_items = db.query(InventoryItem).filter(
            InventoryItem.is_active == True,
            InventoryItem.stock_quantity > 0
        ).all()
        
        successful_forecasts = []
        failed_forecasts = []
        
        for item in active_items:
            try:
                # Generate forecast for each item
                forecast_task = generate_demand_forecast_task.apply_async(
                    args=[str(item.id), 30, "arima"]
                )
                
                # Wait for completion with timeout
                forecast_result = forecast_task.get(timeout=300)  # 5 minute timeout
                successful_forecasts.append({
                    "item_id": str(item.id),
                    "item_name": item.name,
                    "forecast_result": forecast_result
                })
                
            except Exception as item_error:
                logger.error(f"Failed to forecast for item {item.id}: {str(item_error)}")
                failed_forecasts.append({
                    "item_id": str(item.id),
                    "item_name": item.name,
                    "error": str(item_error)
                })
        
        result = {
            "update_id": f"forecast_update_{datetime.utcnow().isoformat()}",
            "total_items": len(active_items),
            "successful_forecasts": len(successful_forecasts),
            "failed_forecasts": len(failed_forecasts),
            "success_details": successful_forecasts,
            "failure_details": failed_forecasts,
            "updated_at": datetime.utcnow().isoformat(),
            "status": "completed"
        }
        
        logger.info(f"Forecast update completed: {len(successful_forecasts)}/{len(active_items)} successful")
        return result
        
    except Exception as e:
        logger.error(f"Error updating all forecasts: {str(e)}")
        raise self.retry(countdown=300, max_retries=2, exc=e)

@celery_app.task(bind=True, base=DatabaseTask, name="analytics_tasks.forecasting_tasks.train_forecasting_models")
def train_forecasting_models_task(self, db) -> Dict[str, Any]:
    """
    Train and validate forecasting models with historical data
    
    Returns:
        Dict containing training results
    """
    try:
        logger.info("Starting forecasting model training and validation")
        
        # Get items with sufficient historical data
        items_query = text("""
            SELECT DISTINCT ii.inventory_item_id, item.name
            FROM invoice_items ii
            JOIN invoices i ON ii.invoice_id = i.id
            JOIN inventory_items item ON ii.inventory_item_id = item.id
            WHERE i.status = 'completed'
                AND i.created_at >= CURRENT_DATE - INTERVAL '365 days'
            GROUP BY ii.inventory_item_id, item.name
            HAVING COUNT(*) >= 30  -- At least 30 data points
            ORDER BY COUNT(*) DESC
            LIMIT 50  -- Train on top 50 items
        """)
        
        items_result = db.execute(items_query)
        items_to_train = [{"item_id": str(row.inventory_item_id), "name": row.name} for row in items_result]
        
        if not items_to_train:
            return {
                "training_id": f"model_training_{datetime.utcnow().isoformat()}",
                "status": "no_data",
                "message": "No items with sufficient historical data for training"
            }
        
        # Initialize forecasting service
        forecasting_service = ForecastingService(db)
        
        model_performance = {}
        training_results = []
        
        # Test different models on each item
        models_to_test = ["arima", "linear_regression", "seasonal_decompose"]
        
        for item_info in items_to_train[:10]:  # Limit to 10 items for training
            item_id = item_info["item_id"]
            item_name = item_info["name"]
            
            logger.info(f"Training models for item: {item_name}")
            
            item_performance = {}
            
            for model_type in models_to_test:
                try:
                    # Generate forecast with this model
                    forecast_result = asyncio.run(forecasting_service.forecast_demand(
                        item_id=item_id,
                        periods=7,  # Short-term forecast for validation
                        model_type=model_type
                    ))
                    
                    # Store model performance
                    item_performance[model_type] = {
                        "confidence_score": forecast_result.confidence_score,
                        "accuracy_metrics": forecast_result.accuracy_metrics,
                        "model_used": forecast_result.model_used
                    }
                    
                except Exception as model_error:
                    logger.warning(f"Model {model_type} failed for item {item_id}: {str(model_error)}")
                    item_performance[model_type] = {
                        "error": str(model_error),
                        "confidence_score": 0.0
                    }
            
            # Determine best model for this item
            best_model = max(
                item_performance.keys(),
                key=lambda m: item_performance[m].get("confidence_score", 0)
            )
            
            model_performance[item_id] = {
                "item_name": item_name,
                "best_model": best_model,
                "model_performance": item_performance,
                "best_confidence": item_performance[best_model].get("confidence_score", 0)
            }
            
            # Store model recommendation in database
            forecast_model = ForecastModel(
                item_id=item_id,
                model_type=best_model,
                confidence_score=Decimal(str(item_performance[best_model].get("confidence_score", 0))),
                accuracy_metrics=item_performance[best_model].get("accuracy_metrics", {}),
                training_date=datetime.utcnow().date(),
                is_active=True
            )
            db.add(forecast_model)
            
            training_results.append({
                "item_id": item_id,
                "item_name": item_name,
                "recommended_model": best_model,
                "confidence_score": item_performance[best_model].get("confidence_score", 0)
            })
        
        db.commit()
        
        # Calculate overall model performance statistics
        model_stats = {}
        for model_type in models_to_test:
            scores = [
                perf["model_performance"][model_type].get("confidence_score", 0)
                for perf in model_performance.values()
                if model_type in perf["model_performance"]
            ]
            
            if scores:
                model_stats[model_type] = {
                    "avg_confidence": round(np.mean(scores), 3),
                    "max_confidence": round(np.max(scores), 3),
                    "min_confidence": round(np.min(scores), 3),
                    "items_tested": len(scores)
                }
        
        result = {
            "training_id": f"model_training_{datetime.utcnow().isoformat()}",
            "items_trained": len(training_results),
            "models_tested": models_to_test,
            "model_statistics": model_stats,
            "training_results": training_results,
            "best_overall_model": max(model_stats.keys(), key=lambda m: model_stats[m]["avg_confidence"]) if model_stats else None,
            "trained_at": datetime.utcnow().isoformat(),
            "status": "completed"
        }
        
        logger.info(f"Model training completed for {len(training_results)} items")
        return result
        
    except Exception as e:
        logger.error(f"Error in model training: {str(e)}")
        db.rollback()
        raise self.retry(countdown=600, max_retries=2, exc=e)  # 10 minute retry delay

@celery_app.task(bind=True, base=DatabaseTask, name="analytics_tasks.forecasting_tasks.validate_forecast_accuracy")
def validate_forecast_accuracy_task(self, db, days_back: int = 30) -> Dict[str, Any]:
    """
    Validate forecast accuracy by comparing predictions with actual sales
    
    Args:
        days_back: Number of days back to validate
        
    Returns:
        Dict containing validation results
    """
    try:
        logger.info(f"Starting forecast accuracy validation for last {days_back} days")
        
        # Get forecasts from the validation period
        validation_start = date.today() - timedelta(days=days_back)
        validation_end = date.today()
        
        forecasts = db.query(DemandForecast).filter(
            DemandForecast.forecast_date >= validation_start,
            DemandForecast.forecast_date <= validation_end,
            DemandForecast.created_at <= datetime.combine(validation_start, datetime.min.time())
        ).all()
        
        if not forecasts:
            return {
                "validation_id": f"forecast_validation_{datetime.utcnow().isoformat()}",
                "status": "no_data",
                "message": f"No forecasts found for validation period"
            }
        
        # Get actual sales data for comparison
        actual_sales_query = text("""
            SELECT 
                ii.inventory_item_id,
                DATE(i.created_at) as sale_date,
                SUM(ii.quantity) as actual_demand
            FROM invoice_items ii
            JOIN invoices i ON ii.invoice_id = i.id
            WHERE DATE(i.created_at) BETWEEN :start_date AND :end_date
                AND i.status = 'completed'
            GROUP BY ii.inventory_item_id, DATE(i.created_at)
        """)
        
        actual_sales = db.execute(actual_sales_query, {
            "start_date": validation_start,
            "end_date": validation_end
        }).fetchall()
        
        # Create lookup for actual sales
        actual_sales_lookup = {}
        for sale in actual_sales:
            key = (str(sale.inventory_item_id), sale.sale_date)
            actual_sales_lookup[key] = float(sale.actual_demand)
        
        # Calculate accuracy metrics
        validation_results = []
        total_absolute_error = 0
        total_squared_error = 0
        total_predictions = 0
        
        for forecast in forecasts:
            key = (str(forecast.item_id), forecast.forecast_date)
            actual_demand = actual_sales_lookup.get(key, 0.0)
            predicted_demand = float(forecast.predicted_demand)
            
            # Calculate errors
            absolute_error = abs(predicted_demand - actual_demand)
            squared_error = (predicted_demand - actual_demand) ** 2
            percentage_error = (absolute_error / max(actual_demand, 1)) * 100  # Avoid division by zero
            
            # Check if actual falls within confidence interval
            within_confidence = (
                float(forecast.confidence_interval_lower) <= actual_demand <= 
                float(forecast.confidence_interval_upper)
            )
            
            validation_results.append({
                "item_id": str(forecast.item_id),
                "forecast_date": forecast.forecast_date.isoformat(),
                "predicted_demand": predicted_demand,
                "actual_demand": actual_demand,
                "absolute_error": round(absolute_error, 2),
                "percentage_error": round(percentage_error, 2),
                "within_confidence_interval": within_confidence,
                "model_used": forecast.model_used
            })
            
            total_absolute_error += absolute_error
            total_squared_error += squared_error
            total_predictions += 1
        
        # Calculate overall accuracy metrics
        if total_predictions > 0:
            mae = total_absolute_error / total_predictions
            rmse = (total_squared_error / total_predictions) ** 0.5
            
            # Calculate confidence interval accuracy
            within_ci_count = sum(1 for r in validation_results if r["within_confidence_interval"])
            ci_accuracy = (within_ci_count / total_predictions) * 100
            
            # Calculate model-specific accuracy
            model_accuracy = {}
            for model_type in set(r["model_used"] for r in validation_results):
                model_results = [r for r in validation_results if r["model_used"] == model_type]
                if model_results:
                    model_mae = np.mean([r["absolute_error"] for r in model_results])
                    model_ci_accuracy = (
                        sum(1 for r in model_results if r["within_confidence_interval"]) / 
                        len(model_results) * 100
                    )
                    model_accuracy[model_type] = {
                        "mae": round(model_mae, 2),
                        "ci_accuracy": round(model_ci_accuracy, 2),
                        "predictions_count": len(model_results)
                    }
        else:
            mae = rmse = ci_accuracy = 0
            model_accuracy = {}
        
        result = {
            "validation_id": f"forecast_validation_{datetime.utcnow().isoformat()}",
            "validation_period_start": validation_start.isoformat(),
            "validation_period_end": validation_end.isoformat(),
            "total_predictions": total_predictions,
            "overall_accuracy": {
                "mae": round(mae, 2),
                "rmse": round(rmse, 2),
                "confidence_interval_accuracy": round(ci_accuracy, 2)
            },
            "model_accuracy": model_accuracy,
            "detailed_results": validation_results[:100],  # Limit detailed results
            "validated_at": datetime.utcnow().isoformat(),
            "status": "completed"
        }
        
        logger.info(f"Forecast validation completed: MAE={mae:.2f}, CI Accuracy={ci_accuracy:.1f}%")
        return result
        
    except Exception as e:
        logger.error(f"Error in forecast validation: {str(e)}")
        raise self.retry(countdown=120, max_retries=3, exc=e)

@celery_app.task(bind=True, base=DatabaseTask, name="analytics_tasks.forecasting_tasks.generate_seasonal_analysis")
def generate_seasonal_analysis_task(self, db, item_id: str) -> Dict[str, Any]:
    """
    Generate seasonal analysis for a specific inventory item
    
    Args:
        item_id: UUID of the inventory item
        
    Returns:
        Dict containing seasonal analysis results
    """
    try:
        logger.info(f"Starting seasonal analysis for item {item_id}")
        
        # Initialize forecasting service
        forecasting_service = ForecastingService(db)
        
        # Get historical sales data
        historical_data = forecasting_service._get_historical_sales_data(item_id)
        
        if len(historical_data) < 24:  # Need at least 2 years of data
            return {
                "analysis_id": f"seasonal_analysis_{item_id}_{datetime.utcnow().isoformat()}",
                "item_id": item_id,
                "status": "insufficient_data",
                "message": "Need at least 24 months of data for seasonal analysis"
            }
        
        # Perform seasonal analysis
        seasonality_analysis = asyncio.run(forecasting_service.analyze_seasonality(historical_data))
        
        result = {
            "analysis_id": f"seasonal_analysis_{item_id}_{datetime.utcnow().isoformat()}",
            "item_id": item_id,
            "has_seasonality": seasonality_analysis.has_seasonality,
            "seasonal_strength": seasonality_analysis.seasonal_strength,
            "seasonal_periods": seasonality_analysis.seasonal_periods,
            "seasonal_factors": seasonality_analysis.seasonal_factors,
            "trend_component": seasonality_analysis.trend_component,
            "residual_variance": seasonality_analysis.residual_variance,
            "data_points": len(historical_data),
            "analyzed_at": datetime.utcnow().isoformat(),
            "status": "completed"
        }
        
        logger.info(f"Seasonal analysis completed for item {item_id}")
        return result
        
    except Exception as e:
        logger.error(f"Error in seasonal analysis for item {item_id}: {str(e)}")
        raise self.retry(countdown=60, max_retries=3, exc=e)

@celery_app.task(bind=True, base=DatabaseTask, name="analytics_tasks.forecasting_tasks.bulk_forecast_generation")
def bulk_forecast_generation_task(
    self, 
    db, 
    item_ids: List[str], 
    periods: int = 30, 
    model_type: str = "arima"
) -> Dict[str, Any]:
    """
    Generate forecasts for multiple items in bulk
    
    Args:
        item_ids: List of inventory item UUIDs
        periods: Number of periods to forecast
        model_type: Forecasting model type
        
    Returns:
        Dict containing bulk forecast results
    """
    try:
        logger.info(f"Starting bulk forecast generation for {len(item_ids)} items")
        
        successful_forecasts = []
        failed_forecasts = []
        
        for item_id in item_ids:
            try:
                # Generate forecast for each item
                forecast_result = generate_demand_forecast_task.apply_async(
                    args=[item_id, periods, model_type]
                ).get(timeout=300)  # 5 minute timeout per item
                
                successful_forecasts.append({
                    "item_id": item_id,
                    "forecast_result": forecast_result
                })
                
            except Exception as item_error:
                logger.error(f"Failed to generate forecast for item {item_id}: {str(item_error)}")
                failed_forecasts.append({
                    "item_id": item_id,
                    "error": str(item_error)
                })
        
        result = {
            "bulk_forecast_id": f"bulk_forecast_{datetime.utcnow().isoformat()}",
            "total_items": len(item_ids),
            "successful_forecasts": len(successful_forecasts),
            "failed_forecasts": len(failed_forecasts),
            "model_type": model_type,
            "periods": periods,
            "success_details": successful_forecasts,
            "failure_details": failed_forecasts,
            "generated_at": datetime.utcnow().isoformat(),
            "status": "completed"
        }
        
        logger.info(f"Bulk forecast generation completed: {len(successful_forecasts)}/{len(item_ids)} successful")
        return result
        
    except Exception as e:
        logger.error(f"Error in bulk forecast generation: {str(e)}")
        raise self.retry(countdown=180, max_retries=2, exc=e)