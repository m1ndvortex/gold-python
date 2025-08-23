"""
Category Intelligence API Router

Provides endpoints for category performance analysis, seasonal patterns,
and cross-selling opportunities.
"""

from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from services.category_intelligence_service import (
    CategoryIntelligenceService,
    CategoryPerformance,
    SeasonalPattern,
    CrossSellingOpportunity
)

router = APIRouter(prefix="/api/category-intelligence", tags=["category-intelligence"])


class CategoryPerformanceResponse(BaseModel):
    """Response model for category performance"""
    category_id: str
    category_name: str
    total_revenue: float
    total_quantity_sold: int
    avg_transaction_value: float
    profit_margin: float
    velocity_score: float
    performance_tier: str
    contribution_percentage: float
    trend_direction: str
    trend_percentage: float


class SeasonalPatternResponse(BaseModel):
    """Response model for seasonal patterns"""
    category_id: str
    category_name: str
    seasonal_index: dict
    peak_months: List[str]
    low_months: List[str]
    seasonality_strength: float
    forecast_next_month: float
    confidence_interval: List[float]


class CrossSellingOpportunityResponse(BaseModel):
    """Response model for cross-selling opportunities"""
    primary_category_id: str
    primary_category_name: str
    recommended_category_id: str
    recommended_category_name: str
    confidence_score: float
    lift_ratio: float
    support: float
    expected_revenue_increase: float


@router.get("/performance", response_model=List[CategoryPerformanceResponse])
async def get_category_performance(
    start_date: Optional[datetime] = Query(None, description="Analysis start date"),
    end_date: Optional[datetime] = Query(None, description="Analysis end date"),
    min_transactions: int = Query(5, description="Minimum transactions to include category"),
    db: Session = Depends(get_db)
):
    """
    Get category performance analysis with fast/slow mover identification
    
    Returns comprehensive performance metrics for all categories including:
    - Revenue and quantity metrics
    - Velocity scores and performance tiers
    - Profit margins and contribution percentages
    - Trend analysis
    """
    try:
        # Default to last 3 months if no dates provided
        if not end_date:
            end_date = datetime.now()
        if not start_date:
            start_date = end_date - timedelta(days=90)
        
        service = CategoryIntelligenceService(db)
        performances = await service.analyze_category_performance(
            start_date=start_date,
            end_date=end_date,
            min_transactions=min_transactions
        )
        
        # Convert to response models
        response = []
        for perf in performances:
            response.append(CategoryPerformanceResponse(
                category_id=perf.category_id,
                category_name=perf.category_name,
                total_revenue=float(perf.total_revenue),
                total_quantity_sold=perf.total_quantity_sold,
                avg_transaction_value=float(perf.avg_transaction_value),
                profit_margin=float(perf.profit_margin),
                velocity_score=perf.velocity_score,
                performance_tier=perf.performance_tier,
                contribution_percentage=perf.contribution_percentage,
                trend_direction=perf.trend_direction,
                trend_percentage=perf.trend_percentage
            ))
        
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing category performance: {str(e)}")


@router.get("/seasonal-patterns", response_model=List[SeasonalPatternResponse])
async def get_seasonal_patterns(
    category_id: Optional[str] = Query(None, description="Specific category ID to analyze"),
    months_back: int = Query(24, description="Number of months of historical data to analyze"),
    db: Session = Depends(get_db)
):
    """
    Get seasonal pattern analysis for categories
    
    Returns seasonal analysis including:
    - Monthly seasonal indices
    - Peak and low months identification
    - Seasonality strength scores
    - Next month forecasts with confidence intervals
    """
    try:
        service = CategoryIntelligenceService(db)
        patterns = await service.analyze_seasonal_patterns(
            category_id=category_id,
            months_back=months_back
        )
        
        # Convert to response models
        response = []
        for pattern in patterns:
            response.append(SeasonalPatternResponse(
                category_id=pattern.category_id,
                category_name=pattern.category_name,
                seasonal_index=pattern.seasonal_index,
                peak_months=pattern.peak_months,
                low_months=pattern.low_months,
                seasonality_strength=pattern.seasonality_strength,
                forecast_next_month=pattern.forecast_next_month,
                confidence_interval=list(pattern.confidence_interval)
            ))
        
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing seasonal patterns: {str(e)}")


@router.get("/cross-selling", response_model=List[CrossSellingOpportunityResponse])
async def get_cross_selling_opportunities(
    start_date: Optional[datetime] = Query(None, description="Analysis start date"),
    end_date: Optional[datetime] = Query(None, description="Analysis end date"),
    min_support: float = Query(0.01, description="Minimum support threshold"),
    min_confidence: float = Query(0.1, description="Minimum confidence threshold"),
    db: Session = Depends(get_db)
):
    """
    Get cross-selling opportunities using market basket analysis
    
    Returns cross-selling recommendations including:
    - Category pairs with high association
    - Confidence scores and lift ratios
    - Support metrics and expected revenue increases
    """
    try:
        # Default to last 6 months if no dates provided
        if not end_date:
            end_date = datetime.now()
        if not start_date:
            start_date = end_date - timedelta(days=180)
        
        service = CategoryIntelligenceService(db)
        opportunities = await service.identify_cross_selling_opportunities(
            start_date=start_date,
            end_date=end_date,
            min_support=min_support,
            min_confidence=min_confidence
        )
        
        # Convert to response models
        response = []
        for opp in opportunities:
            response.append(CrossSellingOpportunityResponse(
                primary_category_id=opp.primary_category_id,
                primary_category_name=opp.primary_category_name,
                recommended_category_id=opp.recommended_category_id,
                recommended_category_name=opp.recommended_category_name,
                confidence_score=opp.confidence_score,
                lift_ratio=opp.lift_ratio,
                support=opp.support,
                expected_revenue_increase=float(opp.expected_revenue_increase)
            ))
        
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error identifying cross-selling opportunities: {str(e)}")


@router.get("/performance/{category_id}", response_model=CategoryPerformanceResponse)
async def get_single_category_performance(
    category_id: str,
    start_date: Optional[datetime] = Query(None, description="Analysis start date"),
    end_date: Optional[datetime] = Query(None, description="Analysis end date"),
    db: Session = Depends(get_db)
):
    """
    Get performance analysis for a specific category
    """
    try:
        # Default to last 3 months if no dates provided
        if not end_date:
            end_date = datetime.now()
        if not start_date:
            start_date = end_date - timedelta(days=90)
        
        service = CategoryIntelligenceService(db)
        performances = await service.analyze_category_performance(
            start_date=start_date,
            end_date=end_date,
            min_transactions=1  # Allow single category even with few transactions
        )
        
        # Find the specific category
        for perf in performances:
            if perf.category_id == category_id:
                return CategoryPerformanceResponse(
                    category_id=perf.category_id,
                    category_name=perf.category_name,
                    total_revenue=float(perf.total_revenue),
                    total_quantity_sold=perf.total_quantity_sold,
                    avg_transaction_value=float(perf.avg_transaction_value),
                    profit_margin=float(perf.profit_margin),
                    velocity_score=perf.velocity_score,
                    performance_tier=perf.performance_tier,
                    contribution_percentage=perf.contribution_percentage,
                    trend_direction=perf.trend_direction,
                    trend_percentage=perf.trend_percentage
                )
        
        raise HTTPException(status_code=404, detail="Category not found or has insufficient data")
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing category performance: {str(e)}")


@router.get("/insights/summary")
async def get_category_insights_summary(
    start_date: Optional[datetime] = Query(None, description="Analysis start date"),
    end_date: Optional[datetime] = Query(None, description="Analysis end date"),
    db: Session = Depends(get_db)
):
    """
    Get a summary of category intelligence insights
    
    Returns key insights including:
    - Top performing categories
    - Seasonal trends summary
    - Top cross-selling opportunities
    """
    try:
        # Default to last 3 months if no dates provided
        if not end_date:
            end_date = datetime.now()
        if not start_date:
            start_date = end_date - timedelta(days=90)
        
        service = CategoryIntelligenceService(db)
        
        # Get performance data
        performances = await service.analyze_category_performance(
            start_date=start_date,
            end_date=end_date
        )
        
        # Get seasonal patterns
        seasonal_patterns = await service.analyze_seasonal_patterns(months_back=12)
        
        # Get cross-selling opportunities
        cross_selling = await service.identify_cross_selling_opportunities(
            start_date=start_date,
            end_date=end_date
        )
        
        # Create summary
        summary = {
            "performance_summary": {
                "total_categories_analyzed": len(performances),
                "fast_movers": len([p for p in performances if p.performance_tier == 'fast']),
                "slow_movers": len([p for p in performances if p.performance_tier == 'slow']),
                "dead_stock_categories": len([p for p in performances if p.performance_tier == 'dead']),
                "top_performers": [
                    {
                        "category_name": p.category_name,
                        "revenue": float(p.total_revenue),
                        "tier": p.performance_tier
                    }
                    for p in performances[:5]
                ]
            },
            "seasonal_insights": {
                "highly_seasonal_categories": len([p for p in seasonal_patterns if p.seasonality_strength > 0.7]),
                "categories_with_patterns": len(seasonal_patterns),
                "upcoming_peak_categories": [
                    {
                        "category_name": p.category_name,
                        "forecast": p.forecast_next_month,
                        "seasonality": p.seasonality_strength
                    }
                    for p in seasonal_patterns if p.seasonality_strength > 0.5
                ][:5]
            },
            "cross_selling_insights": {
                "total_opportunities": len(cross_selling),
                "high_confidence_opportunities": len([o for o in cross_selling if o.confidence_score > 0.3]),
                "top_opportunities": [
                    {
                        "primary_category": o.primary_category_name,
                        "recommended_category": o.recommended_category_name,
                        "confidence": o.confidence_score,
                        "expected_revenue": float(o.expected_revenue_increase)
                    }
                    for o in cross_selling[:5]
                ]
            }
        }
        
        return summary
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating category insights summary: {str(e)}")