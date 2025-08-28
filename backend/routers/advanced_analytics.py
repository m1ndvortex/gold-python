"""
Advanced Analytics and Business Intelligence API Endpoints

Provides comprehensive analytics capabilities including:
- Advanced KPI calculation engine with customizable metrics per business type
- Predictive analytics for sales, inventory, and cash flow forecasting
- Customer segmentation and behavior analysis algorithms
- Trend analysis with seasonal patterns and growth projections
- Comparative analysis capabilities across time periods and business segments
- Intelligent alerting system based on business rules and anomaly detection
- Data export capabilities for external analysis tools

Requirements covered: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8
"""

import logging
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime, date, timedelta
from pydantic import BaseModel, Field

from database import get_db
from oauth2_middleware import get_current_user, require_permission
from models import User
from services.advanced_analytics_service import AdvancedAnalyticsService
from analytics_tasks.analytics_intelligence_tasks import (
    calculate_advanced_kpis_task,
    perform_customer_segmentation_task,
    analyze_trends_seasonality_task,
    detect_anomalies_task,
    export_analytics_data_task
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/advanced-analytics", tags=["advanced-analytics"])

# Pydantic models for request/response
class AdvancedKPIRequest(BaseModel):
    business_type: str = Field(..., description="Type of business (gold_shop, retail_store, service_business, manufacturing)")
    start_date: date = Field(..., description="Analysis period start date")
    end_date: date = Field(..., description="Analysis period end date")
    custom_metrics: Optional[Dict[str, Any]] = Field(default=None, description="Additional custom metrics to calculate")
    include_trends: bool = Field(default=True, description="Include trend analysis")
    include_forecasts: bool = Field(default=True, description="Include forecasting")

class CustomerSegmentationRequest(BaseModel):
    segmentation_method: str = Field(default="rfm", description="Segmentation method (rfm, behavioral, value_based, predictive)")
    num_segments: int = Field(default=5, ge=3, le=10, description="Number of segments to create")
    analysis_period_days: int = Field(default=365, ge=90, le=1095, description="Analysis period in days")
    include_recommendations: bool = Field(default=True, description="Include segment recommendations")

class TrendAnalysisRequest(BaseModel):
    metric_name: str = Field(..., description="Name of metric to analyze")
    entity_type: str = Field(default="overall", description="Type of entity (overall, category, customer_segment)")
    entity_id: Optional[str] = Field(default=None, description="Specific entity ID")
    analysis_period_days: int = Field(default=730, ge=90, le=1095, description="Historical analysis period")
    forecast_periods: int = Field(default=30, ge=7, le=90, description="Number of periods to forecast")
    include_seasonality: bool = Field(default=True, description="Include seasonal analysis")

class ComparativeAnalysisRequest(BaseModel):
    comparison_type: str = Field(..., description="Type of comparison (time_period, business_segment, category)")
    baseline_config: Dict[str, Any] = Field(..., description="Baseline configuration")
    comparison_configs: List[Dict[str, Any]] = Field(..., description="Comparison configurations")
    metrics: List[str] = Field(..., description="Metrics to compare")
    include_significance_tests: bool = Field(default=True, description="Include statistical significance tests")

class AnomalyDetectionRequest(BaseModel):
    metric_name: str = Field(..., description="Metric to analyze for anomalies")
    detection_method: str = Field(default="isolation_forest", description="Detection method (isolation_forest, statistical, seasonal)")
    sensitivity: float = Field(default=0.1, ge=0.01, le=1.0, description="Detection sensitivity")
    lookback_days: int = Field(default=90, ge=30, le=365, description="Historical period for analysis")
    include_context: bool = Field(default=True, description="Include anomaly context and recommendations")

class DataExportRequest(BaseModel):
    export_format: str = Field(..., description="Export format (csv, json, excel, parquet)")
    data_type: str = Field(..., description="Data type (kpis, transactions, customers, inventory)")
    filters: Dict[str, Any] = Field(default_factory=dict, description="Filters to apply")
    include_metadata: bool = Field(default=True, description="Include metadata in export")
    date_range: Optional[Dict[str, str]] = Field(default=None, description="Date range filter")

@router.post("/kpis/calculate")
async def calculate_advanced_kpis(
    request: AdvancedKPIRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("view_reports"))
):
    """
    Calculate advanced KPIs customized for specific business types
    
    Provides comprehensive KPI analysis including:
    - Business-type specific metrics
    - Trend analysis and forecasting
    - Comparative analysis with previous periods
    - Performance scoring and insights
    """
    try:
        analytics_service = AdvancedAnalyticsService(db)
        
        # For immediate response, calculate basic KPIs synchronously
        if (request.end_date - request.start_date).days <= 30:
            result = await analytics_service.calculate_advanced_kpis(
                business_type=request.business_type,
                start_date=request.start_date,
                end_date=request.end_date,
                custom_metrics=request.custom_metrics
            )
            
            return {
                "calculation_id": f"kpis_{request.business_type}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
                "status": "completed",
                "data": result,
                "processing_time": "immediate"
            }
        else:
            # For longer periods, use background task
            task = calculate_advanced_kpis_task.delay(
                business_type=request.business_type,
                start_date=request.start_date.isoformat(),
                end_date=request.end_date.isoformat(),
                custom_metrics=request.custom_metrics,
                user_id=str(current_user.id)
            )
            
            return {
                "calculation_id": task.id,
                "status": "processing",
                "message": "KPI calculation started in background",
                "estimated_completion": "5-10 minutes"
            }
        
    except Exception as e:
        logger.error(f"Error calculating advanced KPIs: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error calculating advanced KPIs: {str(e)}"
        )

@router.post("/customers/segmentation")
async def perform_customer_segmentation(
    request: CustomerSegmentationRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("view_reports"))
):
    """
    Perform advanced customer segmentation using multiple algorithms
    
    Supports various segmentation methods:
    - RFM (Recency, Frequency, Monetary) analysis
    - Behavioral segmentation
    - Value-based segmentation
    - Predictive segmentation using machine learning
    """
    try:
        analytics_service = AdvancedAnalyticsService(db)
        
        # Start segmentation as background task
        task = perform_customer_segmentation_task.delay(
            segmentation_method=request.segmentation_method,
            num_segments=request.num_segments,
            analysis_period_days=request.analysis_period_days,
            include_recommendations=request.include_recommendations,
            user_id=str(current_user.id)
        )
        
        return {
            "segmentation_id": task.id,
            "status": "processing",
            "method": request.segmentation_method,
            "num_segments": request.num_segments,
            "message": "Customer segmentation started in background",
            "estimated_completion": "3-5 minutes"
        }
        
    except Exception as e:
        logger.error(f"Error performing customer segmentation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error performing customer segmentation: {str(e)}"
        )

@router.post("/trends/analyze")
async def analyze_trends_and_seasonality(
    request: TrendAnalysisRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("view_reports"))
):
    """
    Perform comprehensive trend analysis with seasonal pattern detection
    
    Provides:
    - Trend direction and strength analysis
    - Seasonal pattern identification
    - Growth rate calculations
    - Volatility analysis
    - Forecasting with confidence intervals
    - Anomaly detection in trends
    """
    try:
        analytics_service = AdvancedAnalyticsService(db)
        
        result = await analytics_service.analyze_trends_and_seasonality(
            metric_name=request.metric_name,
            entity_type=request.entity_type,
            entity_id=request.entity_id,
            analysis_period_days=request.analysis_period_days,
            forecast_periods=request.forecast_periods
        )
        
        return {
            "analysis_id": f"trends_{request.metric_name}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
            "status": "completed",
            "metric_name": request.metric_name,
            "entity_type": request.entity_type,
            "data": {
                "trend_direction": result.trend_direction,
                "trend_strength": result.trend_strength,
                "seasonal_component": result.seasonal_component,
                "growth_rate": result.growth_rate,
                "volatility": result.volatility,
                "forecast_next_period": result.forecast_next_period,
                "confidence_interval": result.confidence_interval,
                "anomalies_detected": result.anomalies_detected
            },
            "analyzed_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error analyzing trends and seasonality: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error analyzing trends and seasonality: {str(e)}"
        )

@router.post("/comparative/analyze")
async def perform_comparative_analysis(
    request: ComparativeAnalysisRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("view_reports"))
):
    """
    Perform comparative analysis across time periods or business segments
    
    Supports comparison of:
    - Time periods (year-over-year, month-over-month, etc.)
    - Business segments or categories
    - Customer segments
    - Geographic regions
    
    Includes statistical significance testing and insights generation.
    """
    try:
        analytics_service = AdvancedAnalyticsService(db)
        
        result = await analytics_service.perform_comparative_analysis(
            comparison_type=request.comparison_type,
            baseline_config=request.baseline_config,
            comparison_configs=request.comparison_configs,
            metrics=request.metrics
        )
        
        return {
            "analysis_id": f"comparative_{request.comparison_type}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
            "status": "completed",
            "comparison_type": request.comparison_type,
            "data": {
                "baseline_period": result.baseline_period,
                "comparison_periods": result.comparison_periods,
                "metrics_comparison": result.metrics_comparison,
                "statistical_significance": result.statistical_significance,
                "insights": result.insights,
                "recommendations": result.recommendations
            },
            "analyzed_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error performing comparative analysis: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error performing comparative analysis: {str(e)}"
        )

@router.post("/anomalies/detect")
async def detect_anomalies(
    request: AnomalyDetectionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("view_reports"))
):
    """
    Detect anomalies in business metrics using advanced algorithms
    
    Supports multiple detection methods:
    - Isolation Forest (machine learning approach)
    - Statistical methods (Z-score, modified Z-score)
    - Seasonal decomposition anomaly detection
    
    Provides context and recommended actions for each anomaly.
    """
    try:
        analytics_service = AdvancedAnalyticsService(db)
        
        anomalies = await analytics_service.detect_anomalies(
            metric_name=request.metric_name,
            detection_method=request.detection_method,
            sensitivity=request.sensitivity,
            lookback_days=request.lookback_days
        )
        
        return {
            "detection_id": f"anomalies_{request.metric_name}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
            "status": "completed",
            "metric_name": request.metric_name,
            "detection_method": request.detection_method,
            "sensitivity": request.sensitivity,
            "anomalies_found": len(anomalies),
            "data": [
                {
                    "metric_name": anomaly.metric_name,
                    "anomaly_score": anomaly.anomaly_score,
                    "is_anomaly": anomaly.is_anomaly,
                    "anomaly_type": anomaly.anomaly_type,
                    "detected_at": anomaly.detected_at.isoformat(),
                    "context": anomaly.context,
                    "severity": anomaly.severity,
                    "recommended_action": anomaly.recommended_action
                }
                for anomaly in anomalies
            ],
            "analyzed_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error detecting anomalies: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error detecting anomalies: {str(e)}"
        )

@router.post("/data/export")
async def export_analytics_data(
    request: DataExportRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("export_data"))
):
    """
    Export analytics data for external analysis tools
    
    Supports multiple export formats:
    - CSV for spreadsheet analysis
    - JSON for API integration
    - Excel for business reporting
    - Parquet for big data analytics
    
    Includes comprehensive metadata and data schema information.
    """
    try:
        # Start export as background task
        task = export_analytics_data_task.delay(
            export_format=request.export_format,
            data_type=request.data_type,
            filters=request.filters,
            include_metadata=request.include_metadata,
            date_range=request.date_range,
            user_id=str(current_user.id)
        )
        
        return {
            "export_id": task.id,
            "status": "processing",
            "export_format": request.export_format,
            "data_type": request.data_type,
            "message": "Data export started in background",
            "estimated_completion": "2-10 minutes depending on data size"
        }
        
    except Exception as e:
        logger.error(f"Error exporting analytics data: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error exporting analytics data: {str(e)}"
        )

@router.get("/tasks/{task_id}/status")
async def get_task_status(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get the status of a background analytics task
    
    Returns current status, progress information, and results when completed.
    """
    try:
        from celery_app import celery_app
        
        # Get task result
        task_result = celery_app.AsyncResult(task_id)
        
        if task_result.state == 'PENDING':
            response = {
                "task_id": task_id,
                "status": "pending",
                "message": "Task is waiting to be processed"
            }
        elif task_result.state == 'PROGRESS':
            response = {
                "task_id": task_id,
                "status": "processing",
                "progress": task_result.info.get('progress', 0),
                "message": task_result.info.get('message', 'Processing...')
            }
        elif task_result.state == 'SUCCESS':
            response = {
                "task_id": task_id,
                "status": "completed",
                "result": task_result.result,
                "completed_at": datetime.utcnow().isoformat()
            }
        else:
            # Task failed
            response = {
                "task_id": task_id,
                "status": "failed",
                "error": str(task_result.info),
                "failed_at": datetime.utcnow().isoformat()
            }
        
        return response
        
    except Exception as e:
        logger.error(f"Error getting task status: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting task status: {str(e)}"
        )

@router.get("/business-types/configs")
async def get_business_type_configs(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("view_reports"))
):
    """
    Get available business type configurations for KPI calculation
    
    Returns supported business types and their KPI configurations.
    """
    try:
        analytics_service = AdvancedAnalyticsService(db)
        
        configs = {}
        for business_type, config in analytics_service.business_type_configs.items():
            configs[business_type] = {
                "business_type": config.business_type,
                "primary_kpis": config.primary_kpis,
                "secondary_kpis": config.secondary_kpis,
                "custom_metrics": config.custom_metrics,
                "thresholds": config.thresholds,
                "weights": config.weights
            }
        
        return {
            "business_type_configs": configs,
            "total_business_types": len(configs),
            "retrieved_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting business type configs: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting business type configs: {str(e)}"
        )

@router.get("/metrics/available")
async def get_available_metrics(
    business_type: Optional[str] = Query(None, description="Filter by business type"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("view_reports"))
):
    """
    Get list of available metrics for analysis
    
    Returns all metrics that can be analyzed, optionally filtered by business type.
    """
    try:
        # Define available metrics
        base_metrics = [
            "revenue", "profit_margin", "inventory_turnover", "customer_retention",
            "customer_acquisition", "transaction_count", "avg_transaction_value",
            "customer_lifetime_value", "churn_rate", "conversion_rate"
        ]
        
        business_specific_metrics = {
            "gold_shop": ["gold_price_impact", "weight_sold", "labor_cost_ratio", "sood_percentage", "ojrat_percentage"],
            "retail_store": ["basket_size", "foot_traffic", "seasonal_factor", "promotion_impact"],
            "service_business": ["utilization_rate", "service_delivery_time", "resource_efficiency", "billing_accuracy"],
            "manufacturing": ["production_efficiency", "quality_rate", "cost_per_unit", "on_time_delivery", "machine_utilization"]
        }
        
        if business_type and business_type in business_specific_metrics:
            available_metrics = base_metrics + business_specific_metrics[business_type]
        else:
            available_metrics = base_metrics
            if not business_type:
                # Include all business-specific metrics if no filter
                for metrics in business_specific_metrics.values():
                    available_metrics.extend(metrics)
                available_metrics = list(set(available_metrics))  # Remove duplicates
        
        return {
            "available_metrics": sorted(available_metrics),
            "business_type_filter": business_type,
            "total_metrics": len(available_metrics),
            "retrieved_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting available metrics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting available metrics: {str(e)}"
        )

@router.get("/health")
async def analytics_health_check():
    """
    Health check endpoint for analytics service
    
    Returns service status and basic system information.
    """
    try:
        from celery_app import celery_app
        
        # Check Celery connection
        celery_status = "healthy"
        try:
            inspect = celery_app.control.inspect()
            stats = inspect.stats()
            if not stats:
                celery_status = "no_workers"
        except Exception:
            celery_status = "connection_error"
        
        return {
            "service": "advanced_analytics",
            "status": "healthy",
            "celery_status": celery_status,
            "timestamp": datetime.utcnow().isoformat(),
            "version": "1.0.0"
        }
        
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return {
            "service": "advanced_analytics",
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }