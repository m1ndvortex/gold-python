"""
Cost Analysis API Endpoints

Provides REST API endpoints for cost optimization analysis including:
- Cost breakdown analysis
- Optimization recommendations
- Cost trend analysis
- ROI calculations
"""

from typing import List, Optional
from datetime import datetime, timedelta
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from services.cost_analysis_service import (
    CostAnalysisService, 
    CostBreakdown, 
    OptimizationRecommendation,
    CostTrend
)


# Pydantic models for API responses
class CostBreakdownResponse(BaseModel):
    carrying_costs: float
    ordering_costs: float
    stockout_costs: float
    total_costs: float
    cost_per_unit: float
    cost_percentage: float
    
    class Config:
        from_attributes = True


class OptimizationRecommendationResponse(BaseModel):
    category: str
    current_cost: float
    potential_savings: float
    savings_percentage: float
    recommendation: str
    implementation_effort: str
    expected_roi: float
    timeline: str
    
    class Config:
        from_attributes = True


class CostTrendResponse(BaseModel):
    period: str
    total_cost: float
    carrying_cost: float
    ordering_cost: float
    stockout_cost: float
    trend_direction: str
    variance_percentage: float
    
    class Config:
        from_attributes = True


class ROIAnalysisResponse(BaseModel):
    investment_amount: float
    monthly_savings: float
    total_savings: float
    roi_percentage: float
    payback_months: float
    net_present_value: float
    recommendations_count: int
    high_impact_recommendations: List[OptimizationRecommendationResponse]


router = APIRouter(prefix="/api/cost-analysis", tags=["cost-analysis"])


@router.get("/breakdown", response_model=CostBreakdownResponse)
async def get_cost_breakdown(
    category_id: Optional[str] = Query(None, description="Filter by category ID"),
    start_date: Optional[datetime] = Query(None, description="Start date for analysis"),
    end_date: Optional[datetime] = Query(None, description="End date for analysis"),
    db: Session = Depends(get_db)
):
    """
    Get detailed cost breakdown analysis
    
    Returns comprehensive cost analysis including carrying costs, ordering costs,
    and stockout costs with detailed breakdowns and percentages.
    """
    try:
        service = CostAnalysisService(db)
        
        time_range = None
        if start_date and end_date:
            time_range = (start_date, end_date)
        
        breakdown = await service.calculate_cost_breakdown(category_id, time_range)
        
        return CostBreakdownResponse(
            carrying_costs=float(breakdown.carrying_costs),
            ordering_costs=float(breakdown.ordering_costs),
            stockout_costs=float(breakdown.stockout_costs),
            total_costs=float(breakdown.total_costs),
            cost_per_unit=float(breakdown.cost_per_unit),
            cost_percentage=breakdown.cost_percentage
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating cost breakdown: {str(e)}")


@router.get("/recommendations", response_model=List[OptimizationRecommendationResponse])
async def get_optimization_recommendations(
    category_id: Optional[str] = Query(None, description="Filter by category ID"),
    db: Session = Depends(get_db)
):
    """
    Get cost optimization recommendations
    
    Returns actionable recommendations for cost reduction with quantified
    savings potential and implementation guidance.
    """
    try:
        service = CostAnalysisService(db)
        recommendations = await service.generate_optimization_recommendations(category_id)
        
        return [
            OptimizationRecommendationResponse(
                category=rec.category,
                current_cost=float(rec.current_cost),
                potential_savings=float(rec.potential_savings),
                savings_percentage=rec.savings_percentage,
                recommendation=rec.recommendation,
                implementation_effort=rec.implementation_effort,
                expected_roi=rec.expected_roi,
                timeline=rec.timeline
            )
            for rec in recommendations
        ]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating recommendations: {str(e)}")


@router.get("/trends", response_model=List[CostTrendResponse])
async def get_cost_trends(
    periods: int = Query(12, description="Number of periods to analyze", ge=1, le=24),
    category_id: Optional[str] = Query(None, description="Filter by category ID"),
    db: Session = Depends(get_db)
):
    """
    Get cost trend analysis
    
    Returns historical cost trends to identify cost drivers and patterns
    over the specified number of periods.
    """
    try:
        service = CostAnalysisService(db)
        trends = await service.analyze_cost_trends(periods, category_id)
        
        return [
            CostTrendResponse(
                period=trend.period,
                total_cost=float(trend.total_cost),
                carrying_cost=float(trend.carrying_cost),
                ordering_cost=float(trend.ordering_cost),
                stockout_cost=float(trend.stockout_cost),
                trend_direction=trend.trend_direction,
                variance_percentage=trend.variance_percentage
            )
            for trend in trends
        ]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing cost trends: {str(e)}")


@router.get("/roi-analysis", response_model=ROIAnalysisResponse)
async def get_roi_analysis(
    investment_amount: float = Query(..., description="Investment amount to analyze", gt=0),
    category_id: Optional[str] = Query(None, description="Filter by category ID"),
    time_horizon_months: int = Query(12, description="Analysis time horizon in months", ge=1, le=60),
    db: Session = Depends(get_db)
):
    """
    Get ROI analysis for business decisions
    
    Returns comprehensive ROI analysis including payback period, net present value,
    and impact assessment for the specified investment amount.
    """
    try:
        service = CostAnalysisService(db)
        roi_analysis = await service.calculate_roi_analysis(
            Decimal(str(investment_amount)), 
            category_id, 
            time_horizon_months
        )
        
        return ROIAnalysisResponse(
            investment_amount=float(roi_analysis["investment_amount"]),
            monthly_savings=float(roi_analysis["monthly_savings"]),
            total_savings=float(roi_analysis["total_savings"]),
            roi_percentage=roi_analysis["roi_percentage"],
            payback_months=roi_analysis["payback_months"],
            net_present_value=float(roi_analysis["net_present_value"]),
            recommendations_count=roi_analysis["recommendations_count"],
            high_impact_recommendations=[
                OptimizationRecommendationResponse(
                    category=rec.category,
                    current_cost=float(rec.current_cost),
                    potential_savings=float(rec.potential_savings),
                    savings_percentage=rec.savings_percentage,
                    recommendation=rec.recommendation,
                    implementation_effort=rec.implementation_effort,
                    expected_roi=rec.expected_roi,
                    timeline=rec.timeline
                )
                for rec in roi_analysis["high_impact_recommendations"]
            ]
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating ROI analysis: {str(e)}")


@router.get("/summary")
async def get_cost_analysis_summary(
    category_id: Optional[str] = Query(None, description="Filter by category ID"),
    db: Session = Depends(get_db)
):
    """
    Get comprehensive cost analysis summary
    
    Returns a summary combining cost breakdown, top recommendations,
    and key trends for dashboard display.
    """
    try:
        service = CostAnalysisService(db)
        
        # Get cost breakdown
        breakdown = await service.calculate_cost_breakdown(category_id)
        
        # Get top 3 recommendations
        recommendations = await service.generate_optimization_recommendations(category_id)
        top_recommendations = recommendations[:3]
        
        # Get recent trends (last 6 months)
        trends = await service.analyze_cost_trends(6, category_id)
        
        # Calculate total potential savings
        total_potential_savings = sum(rec.potential_savings for rec in recommendations)
        
        return {
            "cost_breakdown": {
                "total_costs": float(breakdown.total_costs),
                "carrying_costs": float(breakdown.carrying_costs),
                "ordering_costs": float(breakdown.ordering_costs),
                "stockout_costs": float(breakdown.stockout_costs),
                "cost_percentage": breakdown.cost_percentage
            },
            "top_recommendations": [
                {
                    "category": rec.category,
                    "potential_savings": float(rec.potential_savings),
                    "savings_percentage": rec.savings_percentage,
                    "recommendation": rec.recommendation,
                    "timeline": rec.timeline
                }
                for rec in top_recommendations
            ],
            "trend_summary": {
                "current_month_cost": float(trends[0].total_cost) if trends else 0,
                "previous_month_cost": float(trends[1].total_cost) if len(trends) > 1 else 0,
                "trend_direction": trends[0].trend_direction if trends else "stable",
                "variance_percentage": trends[0].variance_percentage if trends else 0
            },
            "optimization_potential": {
                "total_potential_savings": float(total_potential_savings),
                "recommendations_count": len(recommendations),
                "high_impact_count": len([r for r in recommendations if r.potential_savings > total_potential_savings * Decimal('0.2')])
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating cost analysis summary: {str(e)}")