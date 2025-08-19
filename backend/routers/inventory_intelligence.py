"""
Inventory Intelligence API Router

This module provides API endpoints for advanced inventory intelligence features including:
- Turnover analysis (fast/slow moving items)
- Stock optimization algorithms
- Demand forecasting
- Seasonal analysis
- Performance metrics and dashboards
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime, timedelta
import uuid

from database import get_db
from auth import get_current_user
from models import (
    User, InventoryItem, Category,
    InventoryTurnoverAnalysis, StockOptimizationRecommendation,
    DemandForecasting, SeasonalAnalysis, InventoryPerformanceMetrics
)
from schemas import (
    InventoryIntelligenceDashboard, InventoryIntelligenceRequest, InventoryIntelligenceResponse,
    TurnoverAnalysisReport, StockOptimizationReport, DemandForecastReport,
    SeasonalInsightsReport, InventoryPerformanceMetrics as InventoryPerformanceMetricsSchema,
    InventoryTurnoverAnalysis as InventoryTurnoverAnalysisSchema,
    InventoryTurnoverAnalysisCreate,
    StockOptimizationRecommendation as StockOptimizationRecommendationSchema,
    StockOptimizationRecommendationCreate, StockOptimizationRecommendationUpdate,
    DemandForecasting as DemandForecastingSchema, DemandForecastingCreate,
    SeasonalAnalysis as SeasonalAnalysisSchema, SeasonalAnalysisCreate
)

router = APIRouter(prefix="/inventory-intelligence", tags=["inventory-intelligence"])

# ========== Main Dashboard Endpoint ==========

@router.get("/dashboard", response_model=InventoryIntelligenceResponse)
async def get_inventory_intelligence_dashboard(
    start_date: Optional[date] = Query(None, description="Analysis start date"),
    end_date: Optional[date] = Query(None, description="Analysis end date"),
    item_ids: Optional[str] = Query(None, description="Comma-separated item IDs"),
    category_ids: Optional[str] = Query(None, description="Comma-separated category IDs"),
    include_forecasting: bool = Query(True, description="Include demand forecasting"),
    include_seasonal: bool = Query(True, description="Include seasonal analysis"),
    include_optimization: bool = Query(True, description="Include optimization recommendations"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get comprehensive inventory intelligence dashboard with turnover analysis,
    stock optimization, demand forecasting, and seasonal insights.
    """
    try:
        # Set default date range if not provided
        if not end_date:
            end_date = date.today()
        if not start_date:
            start_date = end_date - timedelta(days=90)

        # Parse item and category IDs
        parsed_item_ids = item_ids.split(',') if item_ids else None
        parsed_category_ids = category_ids.split(',') if category_ids else None

        # Generate sample dashboard data (in production, this would query real data)
        dashboard_data = await _generate_inventory_intelligence_dashboard(
            db=db,
            start_date=start_date,
            end_date=end_date,
            item_ids=parsed_item_ids,
            category_ids=parsed_category_ids,
            include_forecasting=include_forecasting,
            include_seasonal=include_seasonal,
            include_optimization=include_optimization
        )

        response = InventoryIntelligenceResponse(
            dashboard_data=dashboard_data,
            request_metadata={
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "item_count": len(parsed_item_ids) if parsed_item_ids else 0,
                "category_count": len(parsed_category_ids) if parsed_category_ids else 0,
                "generated_at": datetime.now().isoformat(),
                "user_id": str(current_user.id)
            }
        )

        return response

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating inventory intelligence dashboard: {str(e)}")

# ========== Turnover Analysis Endpoints ==========

@router.get("/turnover-analysis", response_model=List[InventoryTurnoverAnalysisSchema])
async def get_turnover_analysis(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    classification: Optional[str] = Query(None, description="Movement classification filter"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get inventory turnover analysis data with optional filtering."""
    try:
        query = db.query(InventoryTurnoverAnalysis)
        
        if start_date:
            query = query.filter(InventoryTurnoverAnalysis.analysis_period_start >= start_date)
        if end_date:
            query = query.filter(InventoryTurnoverAnalysis.analysis_period_end <= end_date)
        if classification:
            query = query.filter(InventoryTurnoverAnalysis.movement_classification == classification)
        
        results = query.offset(skip).limit(limit).all()
        return results

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching turnover analysis: {str(e)}")

@router.post("/turnover-analysis", response_model=InventoryTurnoverAnalysisSchema)
async def create_turnover_analysis(
    analysis: InventoryTurnoverAnalysisCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create new inventory turnover analysis."""
    try:
        db_analysis = InventoryTurnoverAnalysis(**analysis.dict())
        db.add(db_analysis)
        db.commit()
        db.refresh(db_analysis)
        return db_analysis

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating turnover analysis: {str(e)}")

# ========== Stock Optimization Endpoints ==========

@router.get("/stock-optimization", response_model=List[StockOptimizationRecommendationSchema])
async def get_stock_optimization_recommendations(
    recommendation_type: Optional[str] = Query(None),
    priority_level: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get stock optimization recommendations with optional filtering."""
    try:
        query = db.query(StockOptimizationRecommendation)
        
        if recommendation_type:
            query = query.filter(StockOptimizationRecommendation.recommendation_type == recommendation_type)
        if priority_level:
            query = query.filter(StockOptimizationRecommendation.priority_level == priority_level)
        if status:
            query = query.filter(StockOptimizationRecommendation.status == status)
        
        results = query.offset(skip).limit(limit).all()
        return results

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching optimization recommendations: {str(e)}")

@router.post("/stock-optimization", response_model=StockOptimizationRecommendationSchema)
async def create_stock_optimization_recommendation(
    recommendation: StockOptimizationRecommendationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create new stock optimization recommendation."""
    try:
        db_recommendation = StockOptimizationRecommendation(**recommendation.dict())
        db.add(db_recommendation)
        db.commit()
        db.refresh(db_recommendation)
        return db_recommendation

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating optimization recommendation: {str(e)}")

@router.put("/stock-optimization/{recommendation_id}", response_model=StockOptimizationRecommendationSchema)
async def update_stock_optimization_recommendation(
    recommendation_id: str,
    updates: StockOptimizationRecommendationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update stock optimization recommendation status."""
    try:
        db_recommendation = db.query(StockOptimizationRecommendation).filter(
            StockOptimizationRecommendation.id == recommendation_id
        ).first()
        
        if not db_recommendation:
            raise HTTPException(status_code=404, detail="Recommendation not found")
        
        for field, value in updates.dict(exclude_unset=True).items():
            setattr(db_recommendation, field, value)
        
        db.commit()
        db.refresh(db_recommendation)
        return db_recommendation

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating recommendation: {str(e)}")

# ========== Demand Forecasting Endpoints ==========

@router.get("/demand-forecasting", response_model=List[DemandForecastingSchema])
async def get_demand_forecasts(
    item_id: Optional[str] = Query(None),
    forecast_type: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get demand forecasting data with optional filtering."""
    try:
        query = db.query(DemandForecasting)
        
        if item_id:
            query = query.filter(DemandForecasting.item_id == item_id)
        if forecast_type:
            query = query.filter(DemandForecasting.forecast_type == forecast_type)
        
        results = query.offset(skip).limit(limit).all()
        return results

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching demand forecasts: {str(e)}")

@router.post("/demand-forecasting", response_model=DemandForecastingSchema)
async def create_demand_forecast(
    forecast: DemandForecastingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create new demand forecast."""
    try:
        db_forecast = DemandForecasting(**forecast.dict())
        db.add(db_forecast)
        db.commit()
        db.refresh(db_forecast)
        return db_forecast

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating demand forecast: {str(e)}")

# ========== Seasonal Analysis Endpoints ==========

@router.get("/seasonal-analysis", response_model=List[SeasonalAnalysisSchema])
async def get_seasonal_analysis(
    season: Optional[str] = Query(None),
    year: Optional[int] = Query(None),
    analysis_type: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get seasonal analysis data with optional filtering."""
    try:
        query = db.query(SeasonalAnalysis)
        
        if season:
            query = query.filter(SeasonalAnalysis.season == season)
        if year:
            query = query.filter(SeasonalAnalysis.year == year)
        if analysis_type:
            query = query.filter(SeasonalAnalysis.analysis_type == analysis_type)
        
        results = query.offset(skip).limit(limit).all()
        return results

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching seasonal analysis: {str(e)}")

@router.post("/seasonal-analysis", response_model=SeasonalAnalysisSchema)
async def create_seasonal_analysis(
    analysis: SeasonalAnalysisCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create new seasonal analysis."""
    try:
        db_analysis = SeasonalAnalysis(**analysis.dict())
        db.add(db_analysis)
        db.commit()
        db.refresh(db_analysis)
        return db_analysis

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating seasonal analysis: {str(e)}")

# ========== Performance Metrics Endpoints ==========

@router.get("/performance-metrics", response_model=List[InventoryPerformanceMetricsSchema])
async def get_performance_metrics(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get inventory performance metrics with optional date filtering."""
    try:
        query = db.query(InventoryPerformanceMetrics)
        
        if start_date:
            query = query.filter(InventoryPerformanceMetrics.metric_date >= start_date)
        if end_date:
            query = query.filter(InventoryPerformanceMetrics.metric_date <= end_date)
        
        results = query.order_by(InventoryPerformanceMetrics.metric_date.desc()).offset(skip).limit(limit).all()
        return results

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching performance metrics: {str(e)}")

# ========== Helper Functions ==========

async def _generate_inventory_intelligence_dashboard(
    db: Session,
    start_date: date,
    end_date: date,
    item_ids: Optional[List[str]] = None,
    category_ids: Optional[List[str]] = None,
    include_forecasting: bool = True,
    include_seasonal: bool = True,
    include_optimization: bool = True
) -> InventoryIntelligenceDashboard:
    """Generate comprehensive inventory intelligence dashboard data."""
    
    # Sample data - in production this would query actual database
    overview_metrics = InventoryPerformanceMetricsSchema(
        id=str(uuid.uuid4()),
        metric_date=date.today(),
        total_inventory_value=125000.0,
        total_items_count=245,
        fast_moving_items_count=78,
        slow_moving_items_count=92,
        dead_stock_items_count=15,
        average_turnover_ratio=4.2,
        inventory_to_sales_ratio=0.65,
        carrying_cost_percentage=12.5,
        stockout_incidents=8,
        overstock_incidents=12,
        optimization_score=0.78,
        total_holding_cost=8750.0,
        total_ordering_cost=2100.0,
        total_stockout_cost=3200.0,
        efficiency_rating="good",
        calculated_at=datetime.now(),
        created_at=datetime.now()
    )

    # Sample turnover analysis
    turnover_analysis = [
        TurnoverAnalysisReport(
            item_id=str(uuid.uuid4()),
            item_name="Gold Ring 18K",
            category_name="Rings",
            current_stock=15,
            turnover_ratio=8.5,
            velocity_score=0.92,
            movement_classification="fast",
            trend_direction="increasing",
            days_to_stockout=12,
            last_sale_date=datetime.now() - timedelta(days=2)
        ),
        TurnoverAnalysisReport(
            item_id=str(uuid.uuid4()),
            item_name="Silver Bracelet",
            category_name="Bracelets",
            current_stock=45,
            turnover_ratio=1.2,
            velocity_score=0.25,
            movement_classification="slow",
            trend_direction="decreasing",
            days_to_stockout=180,
            last_sale_date=datetime.now() - timedelta(days=30)
        )
    ]

    # Sample optimization recommendations
    stock_optimization = [
        StockOptimizationReport(
            item_id=str(uuid.uuid4()),
            item_name="Gold Necklace 22K",
            recommendation_type="reorder",
            current_stock=5,
            recommended_stock=25,
            estimated_savings=1200.0,
            priority_level="high",
            reasoning="High demand item with low current stock. Potential stockout risk within 7 days."
        )
    ]

    # Sample demand forecasts
    demand_forecasts = [
        DemandForecastReport(
            item_id=str(uuid.uuid4()),
            item_name="Gold Ring 18K",
            current_stock=15,
            predicted_demand_7_days=8.5,
            predicted_demand_30_days=32.0,
            recommended_action="Reorder 20 units",
            confidence_score=0.87
        )
    ]

    # Sample seasonal insights
    seasonal_insights = [
        SeasonalInsightsReport(
            season="winter",
            year=2024,
            items_affected=45,
            total_impact=15000.0,
            peak_month="December",
            seasonal_recommendations=[
                "Increase stock levels for engagement rings",
                "Prepare for holiday gift demand",
                "Consider promotional pricing for slow movers"
            ]
        )
    ]

    return InventoryIntelligenceDashboard(
        overview_metrics=overview_metrics,
        turnover_analysis=turnover_analysis,
        stock_optimization=stock_optimization,
        demand_forecasts=demand_forecasts,
        seasonal_insights=seasonal_insights,
        fast_moving_items=turnover_analysis[:1],  # Fast movers only
        slow_moving_items=turnover_analysis[1:],  # Slow movers only
        dead_stock_items=[],  # Would be populated with dead stock items
        optimization_opportunities={
            "potential_savings": 25000.0,
            "actionable_recommendations": 15,
            "high_priority_actions": 5,
            "automation_opportunities": 8
        },
        alerts_and_warnings=[
            {
                "type": "stockout_risk",
                "severity": "high",
                "item_name": "Gold Ring 18K",
                "message": "Stock will run out in 12 days at current sales rate",
                "action_required": "Immediate reorder recommended"
            },
            {
                "type": "overstock",
                "severity": "medium", 
                "item_name": "Silver Bracelet",
                "message": "Current stock level exceeds 6-month demand forecast",
                "action_required": "Consider reducing order quantities"
            }
        ],
        last_updated=datetime.now()
    )
