"""
Analytics Intelligence Background Tasks

Celery tasks for heavy analytics processing including:
- Advanced KPI calculations
- Customer segmentation analysis
- Trend analysis and forecasting
- Anomaly detection
- Data export processing

Requirements covered: 9.8
"""

import asyncio
import logging
from datetime import datetime, date, timedelta
from typing import Dict, List, Optional, Any
from decimal import Decimal
import pandas as pd
import numpy as np
import json
import io
import base64

from celery import Task
from celery.exceptions import Retry
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
import os

from celery_app import celery_app
from database import get_db
from models import User, KPISnapshot, Customer, Invoice, InventoryItem
from services.advanced_analytics_service import AdvancedAnalyticsService
from redis_config import get_analytics_cache

logger = logging.getLogger(__name__)

# Database setup for background tasks
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@db:5432/goldshop")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class AnalyticsTask(Task):
    """Base task class with database session management for analytics"""
    
    def __call__(self, *args, **kwargs):
        with SessionLocal() as db:
            return self.run_with_db(db, *args, **kwargs)
    
    def run_with_db(self, db, *args, **kwargs):
        raise NotImplementedError

@celery_app.task(bind=True, name="analytics_tasks.analytics_intelligence_tasks.calculate_advanced_kpis_task")
def calculate_advanced_kpis_task(
    self, 
    business_type: str, 
    start_date: str, 
    end_date: str,
    custom_metrics: Optional[Dict[str, Any]] = None,
    user_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Background task for advanced KPI calculations
    
    Args:
        business_type: Type of business for KPI customization
        start_date: Start date in ISO format
        end_date: End date in ISO format
        custom_metrics: Additional custom metrics to calculate
        user_id: ID of user who requested the calculation
        
    Returns:
        Dict containing comprehensive KPI analysis results
    """
    try:
        logger.info(f"Starting advanced KPI calculation for {business_type} from {start_date} to {end_date}")
        
        # Update task progress
        self.update_state(
            state='PROGRESS',
            meta={'progress': 10, 'message': 'Initializing KPI calculation...'}
        )
        
        with SessionLocal() as db:
            # Parse dates
            start_dt = datetime.fromisoformat(start_date).date()
            end_dt = datetime.fromisoformat(end_date).date()
            
            # Initialize analytics service
            analytics_service = AdvancedAnalyticsService(db)
            
            # Update progress
            self.update_state(
                state='PROGRESS',
                meta={'progress': 30, 'message': 'Calculating primary KPIs...'}
            )
            
            # Calculate advanced KPIs
            kpi_results = asyncio.run(analytics_service.calculate_advanced_kpis(
                business_type=business_type,
                start_date=start_dt,
                end_date=end_dt,
                custom_metrics=custom_metrics
            ))
            
            # Update progress
            self.update_state(
                state='PROGRESS',
                meta={'progress': 70, 'message': 'Performing trend analysis...'}
            )
            
            # Add additional analytics if requested
            if kpi_results.get('primary_kpis'):
                # Perform anomaly detection on key metrics
                anomalies = []
                for kpi_name in ['revenue', 'profit_margin']:
                    if kpi_name in kpi_results['primary_kpis']:
                        try:
                            kpi_anomalies = asyncio.run(analytics_service.detect_anomalies(
                                metric_name=kpi_name,
                                detection_method='statistical',
                                sensitivity=0.1,
                                lookback_days=90
                            ))
                            anomalies.extend([
                                {
                                    'metric': kpi_name,
                                    'anomaly_score': anomaly.anomaly_score,
                                    'severity': anomaly.severity,
                                    'detected_at': anomaly.detected_at.isoformat()
                                }
                                for anomaly in kpi_anomalies
                            ])
                        except Exception as e:
                            logger.warning(f"Could not detect anomalies for {kpi_name}: {str(e)}")
                
                kpi_results['anomalies_detected'] = anomalies
            
            # Update progress
            self.update_state(
                state='PROGRESS',
                meta={'progress': 90, 'message': 'Finalizing results...'}
            )
            
            # Store results in cache for quick retrieval
            cache = get_analytics_cache()
            cache_key = f"advanced_kpis_{business_type}_{start_date}_{end_date}_{user_id}"
            asyncio.run(cache.set_kpi_data("advanced", business_type, kpi_results, ttl=3600, period=cache_key))
            
            # Create final result
            result = {
                "task_id": self.request.id,
                "business_type": business_type,
                "period": {
                    "start_date": start_date,
                    "end_date": end_date
                },
                "kpi_results": kpi_results,
                "user_id": user_id,
                "calculated_at": datetime.utcnow().isoformat(),
                "status": "completed"
            }
            
            logger.info(f"Advanced KPI calculation completed successfully for {business_type}")
            return result
        
    except Exception as e:
        logger.error(f"Error in advanced KPI calculation task: {str(e)}")
        raise self.retry(countdown=60, max_retries=3, exc=e)

@celery_app.task(bind=True, name="analytics_tasks.analytics_intelligence_tasks.perform_customer_segmentation_task")
def perform_customer_segmentation_task(
    self,
    segmentation_method: str = 'rfm',
    num_segments: int = 5,
    analysis_period_days: int = 365,
    include_recommendations: bool = True,
    user_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Background task for customer segmentation analysis
    
    Args:
        segmentation_method: Method to use for segmentation
        num_segments: Number of segments to create
        analysis_period_days: Period for analysis in days
        include_recommendations: Whether to include recommendations
        user_id: ID of user who requested the segmentation
        
    Returns:
        Dict containing segmentation results
    """
    try:
        logger.info(f"Starting customer segmentation using {segmentation_method} method")
        
        # Update task progress
        self.update_state(
            state='PROGRESS',
            meta={'progress': 10, 'message': 'Initializing customer segmentation...'}
        )
        
        with SessionLocal() as db:
            # Initialize analytics service
            analytics_service = AdvancedAnalyticsService(db)
            
            # Update progress
            self.update_state(
                state='PROGRESS',
                meta={'progress': 30, 'message': 'Gathering customer transaction data...'}
            )
            
            # Perform segmentation
            segments = asyncio.run(analytics_service.perform_customer_segmentation(
                segmentation_method=segmentation_method,
                num_segments=num_segments,
                analysis_period_days=analysis_period_days
            ))
            
            # Update progress
            self.update_state(
                state='PROGRESS',
                meta={'progress': 70, 'message': 'Analyzing segment characteristics...'}
            )
            
            # Convert segments to serializable format
            segments_data = []
            for segment in segments:
                segment_dict = {
                    'segment_id': segment.segment_id,
                    'segment_name': segment.segment_name,
                    'customer_count': segment.customer_count,
                    'characteristics': segment.characteristics,
                    'avg_transaction_value': float(segment.avg_transaction_value),
                    'avg_frequency': segment.avg_frequency,
                    'lifetime_value': float(segment.lifetime_value),
                    'churn_risk': segment.churn_risk,
                    'recommended_actions': segment.recommended_actions
                }
                segments_data.append(segment_dict)
            
            # Update progress
            self.update_state(
                state='PROGRESS',
                meta={'progress': 90, 'message': 'Finalizing segmentation results...'}
            )
            
            # Calculate summary statistics
            total_customers = sum(segment['customer_count'] for segment in segments_data)
            avg_lifetime_value = sum(segment['lifetime_value'] for segment in segments_data) / len(segments_data)
            high_value_segments = [s for s in segments_data if s['lifetime_value'] > avg_lifetime_value]
            
            result = {
                "task_id": self.request.id,
                "segmentation_method": segmentation_method,
                "num_segments": num_segments,
                "analysis_period_days": analysis_period_days,
                "segments": segments_data,
                "summary": {
                    "total_customers": total_customers,
                    "avg_lifetime_value": avg_lifetime_value,
                    "high_value_segments": len(high_value_segments),
                    "segmentation_quality": "good" if len(segments_data) == num_segments else "partial"
                },
                "user_id": user_id,
                "calculated_at": datetime.utcnow().isoformat(),
                "status": "completed"
            }
            
            logger.info(f"Customer segmentation completed successfully with {len(segments_data)} segments")
            return result
        
    except Exception as e:
        logger.error(f"Error in customer segmentation task: {str(e)}")
        raise self.retry(countdown=60, max_retries=3, exc=e)

@celery_app.task(bind=True, name="analytics_tasks.analytics_intelligence_tasks.analyze_trends_seasonality_task")
def analyze_trends_seasonality_task(
    self,
    metric_name: str,
    entity_type: str = 'overall',
    entity_id: Optional[str] = None,
    analysis_period_days: int = 730,
    forecast_periods: int = 30,
    user_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Background task for trend analysis and seasonality detection
    
    Args:
        metric_name: Name of metric to analyze
        entity_type: Type of entity to analyze
        entity_id: Specific entity ID
        analysis_period_days: Historical period for analysis
        forecast_periods: Number of periods to forecast
        user_id: ID of user who requested the analysis
        
    Returns:
        Dict containing trend analysis results
    """
    try:
        logger.info(f"Starting trend analysis for {metric_name}")
        
        # Update task progress
        self.update_state(
            state='PROGRESS',
            meta={'progress': 10, 'message': 'Initializing trend analysis...'}
        )
        
        with SessionLocal() as db:
            # Initialize analytics service
            analytics_service = AdvancedAnalyticsService(db)
            
            # Update progress
            self.update_state(
                state='PROGRESS',
                meta={'progress': 30, 'message': 'Gathering time series data...'}
            )
            
            # Perform trend analysis
            trend_analysis = asyncio.run(analytics_service.analyze_trends_and_seasonality(
                metric_name=metric_name,
                entity_type=entity_type,
                entity_id=entity_id,
                analysis_period_days=analysis_period_days,
                forecast_periods=forecast_periods
            ))
            
            # Update progress
            self.update_state(
                state='PROGRESS',
                meta={'progress': 70, 'message': 'Detecting seasonal patterns...'}
            )
            
            # Convert to serializable format
            result_data = {
                'metric_name': trend_analysis.metric_name,
                'trend_direction': trend_analysis.trend_direction,
                'trend_strength': trend_analysis.trend_strength,
                'seasonal_component': trend_analysis.seasonal_component,
                'growth_rate': trend_analysis.growth_rate,
                'volatility': trend_analysis.volatility,
                'forecast_next_period': trend_analysis.forecast_next_period,
                'confidence_interval': trend_analysis.confidence_interval,
                'anomalies_detected': trend_analysis.anomalies_detected
            }
            
            # Update progress
            self.update_state(
                state='PROGRESS',
                meta={'progress': 90, 'message': 'Finalizing trend analysis...'}
            )
            
            result = {
                "task_id": self.request.id,
                "metric_name": metric_name,
                "entity_type": entity_type,
                "entity_id": entity_id,
                "analysis_period_days": analysis_period_days,
                "forecast_periods": forecast_periods,
                "trend_analysis": result_data,
                "user_id": user_id,
                "calculated_at": datetime.utcnow().isoformat(),
                "status": "completed"
            }
            
            logger.info(f"Trend analysis completed successfully for {metric_name}")
            return result
        
    except Exception as e:
        logger.error(f"Error in trend analysis task: {str(e)}")
        raise self.retry(countdown=60, max_retries=3, exc=e)

@celery_app.task(bind=True, name="analytics_tasks.analytics_intelligence_tasks.detect_anomalies_task")
def detect_anomalies_task(
    self,
    metric_name: str,
    detection_method: str = 'isolation_forest',
    sensitivity: float = 0.1,
    lookback_days: int = 90,
    user_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Background task for anomaly detection in business metrics
    
    Args:
        metric_name: Name of metric to analyze for anomalies
        detection_method: Method to use for detection
        sensitivity: Detection sensitivity level
        lookback_days: Number of days to look back
        user_id: ID of user who requested the detection
        
    Returns:
        Dict containing anomaly detection results
    """
    try:
        logger.info(f"Starting anomaly detection for {metric_name} using {detection_method}")
        
        # Update task progress
        self.update_state(
            state='PROGRESS',
            meta={'progress': 10, 'message': 'Initializing anomaly detection...'}
        )
        
        with SessionLocal() as db:
            # Initialize analytics service
            analytics_service = AdvancedAnalyticsService(db)
            
            # Update progress
            self.update_state(
                state='PROGRESS',
                meta={'progress': 30, 'message': 'Gathering metric data...'}
            )
            
            # Perform anomaly detection
            anomalies = asyncio.run(analytics_service.detect_anomalies(
                metric_name=metric_name,
                detection_method=detection_method,
                sensitivity=sensitivity,
                lookback_days=lookback_days
            ))
            
            # Update progress
            self.update_state(
                state='PROGRESS',
                meta={'progress': 70, 'message': 'Analyzing detected anomalies...'}
            )
            
            # Convert anomalies to serializable format
            anomalies_data = []
            for anomaly in anomalies:
                anomaly_dict = {
                    'metric_name': anomaly.metric_name,
                    'anomaly_score': anomaly.anomaly_score,
                    'is_anomaly': anomaly.is_anomaly,
                    'anomaly_type': anomaly.anomaly_type,
                    'detected_at': anomaly.detected_at.isoformat(),
                    'context': anomaly.context,
                    'severity': anomaly.severity,
                    'recommended_action': anomaly.recommended_action
                }
                anomalies_data.append(anomaly_dict)
            
            # Update progress
            self.update_state(
                state='PROGRESS',
                meta={'progress': 90, 'message': 'Finalizing anomaly detection results...'}
            )
            
            # Calculate summary statistics
            high_severity_count = len([a for a in anomalies_data if a['severity'] in ['high', 'critical']])
            anomaly_types = list(set(a['anomaly_type'] for a in anomalies_data))
            
            result = {
                "task_id": self.request.id,
                "metric_name": metric_name,
                "detection_method": detection_method,
                "sensitivity": sensitivity,
                "lookback_days": lookback_days,
                "anomalies": anomalies_data,
                "summary": {
                    "total_anomalies": len(anomalies_data),
                    "high_severity_count": high_severity_count,
                    "anomaly_types": anomaly_types,
                    "detection_quality": "good" if len(anomalies_data) > 0 else "no_anomalies"
                },
                "user_id": user_id,
                "calculated_at": datetime.utcnow().isoformat(),
                "status": "completed"
            }
            
            logger.info(f"Anomaly detection completed successfully with {len(anomalies_data)} anomalies found")
            return result
        
    except Exception as e:
        logger.error(f"Error in anomaly detection task: {str(e)}")
        raise self.retry(countdown=60, max_retries=3, exc=e)

@celery_app.task(bind=True, name="analytics_tasks.analytics_intelligence_tasks.export_analytics_data_task")
def export_analytics_data_task(
    self,
    export_format: str,
    data_type: str,
    filters: Dict[str, Any],
    include_metadata: bool = True,
    date_range: Optional[Dict[str, str]] = None,
    user_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Background task for exporting analytics data
    
    Args:
        export_format: Format for export (csv, json, excel, parquet)
        data_type: Type of data to export
        filters: Filters to apply to the data
        include_metadata: Whether to include metadata
        date_range: Date range filter
        user_id: ID of user who requested the export
        
    Returns:
        Dict containing export results and download information
    """
    try:
        logger.info(f"Starting data export for {data_type} in {export_format} format")
        
        # Update task progress
        self.update_state(
            state='PROGRESS',
            meta={'progress': 10, 'message': 'Initializing data export...'}
        )
        
        with SessionLocal() as db:
            # Initialize analytics service
            analytics_service = AdvancedAnalyticsService(db)
            
            # Update progress
            self.update_state(
                state='PROGRESS',
                meta={'progress': 30, 'message': 'Gathering export data...'}
            )
            
            # Perform data export
            export_result = asyncio.run(analytics_service.export_analytics_data(
                export_format=export_format,
                data_type=data_type,
                filters=filters,
                include_metadata=include_metadata
            ))
            
            # Update progress
            self.update_state(
                state='PROGRESS',
                meta={'progress': 70, 'message': 'Formatting export data...'}
            )
            
            # Handle different export formats
            if export_format == 'csv':
                # Convert data to CSV format
                if isinstance(export_result['data'], list):
                    df = pd.DataFrame(export_result['data'])
                    csv_buffer = io.StringIO()
                    df.to_csv(csv_buffer, index=False)
                    export_content = csv_buffer.getvalue()
                else:
                    export_content = str(export_result['data'])
                
                content_type = 'text/csv'
                
            elif export_format == 'json':
                export_content = json.dumps(export_result['data'], indent=2, default=str)
                content_type = 'application/json'
                
            elif export_format == 'excel':
                # Convert data to Excel format
                if isinstance(export_result['data'], list):
                    df = pd.DataFrame(export_result['data'])
                    excel_buffer = io.BytesIO()
                    df.to_excel(excel_buffer, index=False, engine='openpyxl')
                    export_content = base64.b64encode(excel_buffer.getvalue()).decode()
                else:
                    export_content = str(export_result['data'])
                
                content_type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                
            else:
                # Default to JSON
                export_content = json.dumps(export_result['data'], indent=2, default=str)
                content_type = 'application/json'
            
            # Update progress
            self.update_state(
                state='PROGRESS',
                meta={'progress': 90, 'message': 'Finalizing export...'}
            )
            
            # Generate filename
            timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
            filename = f"{data_type}_export_{timestamp}.{export_format}"
            
            result = {
                "task_id": self.request.id,
                "export_id": export_result['export_id'],
                "export_format": export_format,
                "data_type": data_type,
                "filename": filename,
                "content_type": content_type,
                "content": export_content,
                "metadata": export_result['metadata'],
                "filters_applied": filters,
                "date_range": date_range,
                "user_id": user_id,
                "exported_at": datetime.utcnow().isoformat(),
                "status": "completed"
            }
            
            logger.info(f"Data export completed successfully: {filename}")
            return result
        
    except Exception as e:
        logger.error(f"Error in data export task: {str(e)}")
        raise self.retry(countdown=60, max_retries=3, exc=e)

@celery_app.task(bind=True, name="analytics_tasks.analytics_intelligence_tasks.generate_business_insights_task")
def generate_business_insights_task(
    self,
    business_type: str,
    analysis_period_days: int = 90,
    include_predictions: bool = True,
    user_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Background task for generating comprehensive business insights
    
    Args:
        business_type: Type of business for customized insights
        analysis_period_days: Period for analysis
        include_predictions: Whether to include predictive insights
        user_id: ID of user who requested the insights
        
    Returns:
        Dict containing comprehensive business insights
    """
    try:
        logger.info(f"Starting business insights generation for {business_type}")
        
        # Update task progress
        self.update_state(
            state='PROGRESS',
            meta={'progress': 10, 'message': 'Initializing insights generation...'}
        )
        
        with SessionLocal() as db:
            # Initialize analytics service
            analytics_service = AdvancedAnalyticsService(db)
            
            # Calculate date range
            end_date = datetime.now().date()
            start_date = end_date - timedelta(days=analysis_period_days)
            
            # Update progress
            self.update_state(
                state='PROGRESS',
                meta={'progress': 20, 'message': 'Calculating KPIs...'}
            )
            
            # Calculate advanced KPIs
            kpi_results = asyncio.run(analytics_service.calculate_advanced_kpis(
                business_type=business_type,
                start_date=start_date,
                end_date=end_date
            ))
            
            # Update progress
            self.update_state(
                state='PROGRESS',
                meta={'progress': 40, 'message': 'Performing customer segmentation...'}
            )
            
            # Perform customer segmentation
            segments = asyncio.run(analytics_service.perform_customer_segmentation(
                segmentation_method='rfm',
                num_segments=5,
                analysis_period_days=analysis_period_days
            ))
            
            # Update progress
            self.update_state(
                state='PROGRESS',
                meta={'progress': 60, 'message': 'Analyzing trends...'}
            )
            
            # Analyze key metric trends
            revenue_trends = asyncio.run(analytics_service.analyze_trends_and_seasonality(
                metric_name='revenue',
                entity_type='overall',
                analysis_period_days=analysis_period_days * 2,  # Longer period for trends
                forecast_periods=30
            ))
            
            # Update progress
            self.update_state(
                state='PROGRESS',
                meta={'progress': 80, 'message': 'Detecting anomalies...'}
            )
            
            # Detect anomalies in key metrics
            revenue_anomalies = asyncio.run(analytics_service.detect_anomalies(
                metric_name='revenue',
                detection_method='statistical',
                sensitivity=0.1,
                lookback_days=analysis_period_days
            ))
            
            # Update progress
            self.update_state(
                state='PROGRESS',
                meta={'progress': 90, 'message': 'Generating insights...'}
            )
            
            # Generate comprehensive insights
            insights = {
                'performance_summary': {
                    'overall_score': kpi_results.get('composite_score', {}),
                    'key_strengths': [],
                    'areas_for_improvement': [],
                    'critical_issues': []
                },
                'customer_insights': {
                    'total_segments': len(segments),
                    'high_value_customers': len([s for s in segments if s.lifetime_value > 1000]),
                    'at_risk_customers': len([s for s in segments if s.churn_risk > 0.7]),
                    'segment_recommendations': [s.recommended_actions for s in segments[:3]]  # Top 3 segments
                },
                'trend_insights': {
                    'revenue_trend': revenue_trends.trend_direction,
                    'growth_rate': revenue_trends.growth_rate,
                    'seasonality_detected': len(revenue_trends.seasonal_component) > 0,
                    'forecast_next_month': revenue_trends.forecast_next_period
                },
                'risk_alerts': {
                    'anomalies_detected': len(revenue_anomalies),
                    'high_risk_anomalies': len([a for a in revenue_anomalies if a.severity in ['high', 'critical']]),
                    'recent_anomalies': [a for a in revenue_anomalies if a.detected_at > datetime.now() - timedelta(days=7)]
                }
            }
            
            # Add business-specific insights
            if business_type == 'gold_shop':
                insights['business_specific'] = {
                    'gold_price_sensitivity': 'Monitor gold price fluctuations impact on margins',
                    'seasonal_patterns': 'Wedding season and festivals drive higher sales',
                    'inventory_focus': 'Focus on high-turnover jewelry items'
                }
            elif business_type == 'retail_store':
                insights['business_specific'] = {
                    'inventory_optimization': 'Optimize stock levels based on demand patterns',
                    'customer_experience': 'Focus on improving customer retention',
                    'seasonal_planning': 'Plan inventory for seasonal demand variations'
                }
            
            result = {
                "task_id": self.request.id,
                "business_type": business_type,
                "analysis_period_days": analysis_period_days,
                "insights": insights,
                "kpi_summary": kpi_results,
                "user_id": user_id,
                "generated_at": datetime.utcnow().isoformat(),
                "status": "completed"
            }
            
            logger.info(f"Business insights generation completed successfully for {business_type}")
            return result
        
    except Exception as e:
        logger.error(f"Error in business insights generation task: {str(e)}")
        raise self.retry(countdown=60, max_retries=3, exc=e)

@celery_app.task(bind=True, name="analytics_tasks.analytics_intelligence_tasks.cleanup_analytics_cache_task")
def cleanup_analytics_cache_task(self) -> Dict[str, Any]:
    """
    Background task for cleaning up expired analytics cache entries
    
    Returns:
        Dict containing cleanup results
    """
    try:
        logger.info("Starting analytics cache cleanup")
        
        cache = get_analytics_cache()
        
        # Perform cache cleanup
        cleanup_result = asyncio.run(cache.cleanup_expired_cache())
        
        # Get cache statistics
        cache_stats = cache.get_cache_stats()
        
        result = {
            "task_id": self.request.id,
            "cleanup_result": cleanup_result,
            "cache_stats": cache_stats,
            "cleaned_at": datetime.utcnow().isoformat(),
            "status": "completed"
        }
        
        logger.info("Analytics cache cleanup completed successfully")
        return result
        
    except Exception as e:
        logger.error(f"Error in analytics cache cleanup task: {str(e)}")
        raise self.retry(countdown=60, max_retries=3, exc=e)