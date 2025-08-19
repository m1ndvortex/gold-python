from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func, text, desc
from datetime import datetime, timedelta, date
from database import get_db
import models
import schemas
from auth import get_current_active_user, require_permission
from decimal import Decimal
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/profitability", tags=["profitability"])

@router.get("/dashboard", response_model=schemas.ProfitabilityDashboard)
async def get_profitability_dashboard(
    start_date: Optional[datetime] = Query(None, description="Start date for analysis"),
    end_date: Optional[datetime] = Query(None, description="End date for analysis"),
    include_trends: bool = Query(True, description="Include margin trends"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("view_reports"))
):
    """Get comprehensive profitability dashboard"""
    
    # Default to last 30 days if no date range provided
    if not end_date:
        end_date = datetime.now()
    if not start_date:
        start_date = end_date - timedelta(days=30)
    
    try:
        # Overall metrics
        overall_metrics = await _calculate_overall_metrics(db, start_date, end_date)
        
        # Top performing items
        top_performing_items = await _get_top_performing_items(db, start_date, end_date, limit=10)
        
        # Category breakdown
        category_breakdown = await _get_category_profitability(db, start_date, end_date)
        
        # Margin trends
        margin_trends = []
        if include_trends:
            margin_trends = await _get_margin_trends(db, start_date, end_date)
        
        # Profitability alerts
        profitability_alerts = await _generate_profitability_alerts(db, start_date, end_date)
        
        # Cost and revenue breakdown
        cost_breakdown = await _get_cost_breakdown(db, start_date, end_date)
        revenue_breakdown = await _get_revenue_breakdown(db, start_date, end_date)
        
        return schemas.ProfitabilityDashboard(
            overall_metrics=overall_metrics,
            top_performing_items=top_performing_items,
            category_breakdown=category_breakdown,
            margin_trends=margin_trends,
            profitability_alerts=profitability_alerts,
            cost_breakdown=cost_breakdown,
            revenue_breakdown=revenue_breakdown,
            last_updated=datetime.now()
        )
        
    except Exception as e:
        logger.error(f"Error getting profitability dashboard: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve profitability dashboard: {str(e)}"
        )

async def _calculate_overall_metrics(db: Session, start_date: datetime, end_date: datetime) -> Dict[str, float]:
    """Calculate overall profitability metrics"""
    
    # Total revenue and cost from invoices
    revenue_query = text("""
        SELECT 
            SUM(total_amount) as total_revenue,
            COUNT(*) as total_transactions,
            AVG(total_amount) as average_order_value
        FROM invoices 
        WHERE created_at >= :start_date AND created_at <= :end_date
    """)
    
    revenue_result = db.execute(revenue_query, {
        "start_date": start_date,
        "end_date": end_date
    }).fetchone()
    
    # Calculate cost from invoice items using purchase prices
    cost_query = text("""
        SELECT 
            SUM(ii.purchase_price * inv_items.quantity) as total_cost,
            SUM(inv_items.total_price) as total_selling_price,
            SUM(inv_items.quantity) as total_units_sold
        FROM invoice_items inv_items
        JOIN inventory_items ii ON inv_items.inventory_item_id = ii.id
        JOIN invoices inv ON inv_items.invoice_id = inv.id
        WHERE inv.created_at >= :start_date AND inv.created_at <= :end_date
    """)
    
    cost_result = db.execute(cost_query, {
        "start_date": start_date,
        "end_date": end_date
    }).fetchone()
    
    total_revenue = float(revenue_result.total_revenue or 0)
    total_cost = float(cost_result.total_cost or 0)
    gross_profit = total_revenue - total_cost
    profit_margin = (gross_profit / total_revenue * 100) if total_revenue > 0 else 0
    markup_percentage = (gross_profit / total_cost * 100) if total_cost > 0 else 0
    
    return {
        "total_revenue": total_revenue,
        "total_cost": total_cost,
        "gross_profit": gross_profit,
        "profit_margin": profit_margin,
        "markup_percentage": markup_percentage,
        "total_transactions": revenue_result.total_transactions or 0,
        "average_order_value": float(revenue_result.average_order_value or 0),
        "total_units_sold": cost_result.total_units_sold or 0,
        "profit_per_unit": (gross_profit / cost_result.total_units_sold) if cost_result.total_units_sold else 0
    }

async def _get_top_performing_items(db: Session, start_date: datetime, end_date: datetime, limit: int = 10) -> List[schemas.ItemProfitabilityReport]:
    """Get top performing items by profitability"""
    
    query = text("""
        WITH item_profitability AS (
            SELECT 
                ii.id as item_id,
                ii.name as item_name,
                c.name as category_name,
                SUM(inv_items.total_price) as total_revenue,
                SUM(ii.purchase_price * inv_items.quantity) as total_cost,
                SUM(inv_items.total_price) - SUM(ii.purchase_price * inv_items.quantity) as gross_profit,
                CASE 
                    WHEN SUM(inv_items.total_price) > 0 
                    THEN ((SUM(inv_items.total_price) - SUM(ii.purchase_price * inv_items.quantity)) / SUM(inv_items.total_price) * 100)
                    ELSE 0 
                END as profit_margin,
                SUM(inv_items.quantity) as units_sold,
                CASE 
                    WHEN SUM(inv_items.quantity) > 0 
                    THEN (SUM(inv_items.total_price) - SUM(ii.purchase_price * inv_items.quantity)) / SUM(inv_items.quantity)
                    ELSE 0 
                END as profit_per_unit,
                CASE 
                    WHEN SUM(ii.purchase_price * inv_items.quantity) > 0 
                    THEN ((SUM(inv_items.total_price) - SUM(ii.purchase_price * inv_items.quantity)) / SUM(ii.purchase_price * inv_items.quantity) * 100)
                    ELSE 0 
                END as markup_percentage
            FROM invoice_items inv_items
            JOIN inventory_items ii ON inv_items.inventory_item_id = ii.id
            JOIN categories c ON ii.category_id = c.id
            JOIN invoices inv ON inv_items.invoice_id = inv.id
            WHERE inv.created_at >= :start_date AND inv.created_at <= :end_date
            GROUP BY ii.id, ii.name, c.name
            HAVING SUM(inv_items.quantity) > 0
        )
        SELECT 
            *,
            ROW_NUMBER() OVER (ORDER BY gross_profit DESC) as profitability_rank
        FROM item_profitability
        ORDER BY gross_profit DESC
        LIMIT :limit
    """)
    
    results = db.execute(query, {
        "start_date": start_date,
        "end_date": end_date,
        "limit": limit
    }).fetchall()
    
    items = []
    for row in results:
        # Determine trend (simplified - in real implementation, compare with previous period)
        trend = "stable"  # This would be calculated based on historical data
        
        items.append(schemas.ItemProfitabilityReport(
            item_id=row.item_id,
            item_name=row.item_name,
            category_name=row.category_name,
            total_revenue=float(row.total_revenue),
            total_cost=float(row.total_cost),
            gross_profit=float(row.gross_profit),
            profit_margin=float(row.profit_margin),
            units_sold=row.units_sold,
            profit_per_unit=float(row.profit_per_unit),
            markup_percentage=float(row.markup_percentage),
            profitability_rank=row.profitability_rank,
            profitability_trend=trend
        ))
    
    return items

async def _get_category_profitability(db: Session, start_date: datetime, end_date: datetime) -> List[schemas.CategoryProfitabilityReport]:
    """Get profitability breakdown by category"""
    
    query = text("""
        WITH category_profitability AS (
            SELECT 
                c.id as category_id,
                c.name as category_name,
                SUM(inv_items.total_price) as total_revenue,
                SUM(ii.purchase_price * inv_items.quantity) as total_cost,
                SUM(inv_items.total_price) - SUM(ii.purchase_price * inv_items.quantity) as gross_profit,
                CASE 
                    WHEN SUM(inv_items.total_price) > 0 
                    THEN ((SUM(inv_items.total_price) - SUM(ii.purchase_price * inv_items.quantity)) / SUM(inv_items.total_price) * 100)
                    ELSE 0 
                END as profit_margin,
                SUM(inv_items.quantity) as units_sold,
                COUNT(DISTINCT ii.id) as item_count,
                CASE 
                    WHEN SUM(inv_items.quantity) > 0 
                    THEN (SUM(inv_items.total_price) - SUM(ii.purchase_price * inv_items.quantity)) / SUM(inv_items.quantity)
                    ELSE 0 
                END as average_profit_per_unit
            FROM invoice_items inv_items
            JOIN inventory_items ii ON inv_items.inventory_item_id = ii.id
            JOIN categories c ON ii.category_id = c.id
            JOIN invoices inv ON inv_items.invoice_id = inv.id
            WHERE inv.created_at >= :start_date AND inv.created_at <= :end_date
            GROUP BY c.id, c.name
            HAVING SUM(inv_items.quantity) > 0
        )
        SELECT * FROM category_profitability
        ORDER BY gross_profit DESC
    """)
    
    results = db.execute(query, {
        "start_date": start_date,
        "end_date": end_date
    }).fetchall()
    
    categories = []
    for row in results:
        # Get top performing items for this category
        top_items = await _get_top_performing_items_for_category(
            db, row.category_id, start_date, end_date, limit=3
        )
        
        categories.append(schemas.CategoryProfitabilityReport(
            category_id=row.category_id,
            category_name=row.category_name,
            total_revenue=float(row.total_revenue),
            total_cost=float(row.total_cost),
            gross_profit=float(row.gross_profit),
            profit_margin=float(row.profit_margin),
            units_sold=row.units_sold,
            average_profit_per_unit=float(row.average_profit_per_unit),
            item_count=row.item_count,
            top_performing_items=top_items
        ))
    
    return categories

async def _get_top_performing_items_for_category(db: Session, category_id: str, start_date: datetime, end_date: datetime, limit: int = 3) -> List[schemas.ItemProfitabilityReport]:
    """Get top performing items for a specific category"""
    
    query = text("""
        SELECT 
            ii.id as item_id,
            ii.name as item_name,
            c.name as category_name,
            SUM(inv_items.total_price) as total_revenue,
            SUM(ii.purchase_price * inv_items.quantity) as total_cost,
            SUM(inv_items.total_price) - SUM(ii.purchase_price * inv_items.quantity) as gross_profit,
            CASE 
                WHEN SUM(inv_items.total_price) > 0 
                THEN ((SUM(inv_items.total_price) - SUM(ii.purchase_price * inv_items.quantity)) / SUM(inv_items.total_price) * 100)
                ELSE 0 
            END as profit_margin,
            SUM(inv_items.quantity) as units_sold,
            CASE 
                WHEN SUM(inv_items.quantity) > 0 
                THEN (SUM(inv_items.total_price) - SUM(ii.purchase_price * inv_items.quantity)) / SUM(inv_items.quantity)
                ELSE 0 
            END as profit_per_unit,
            CASE 
                WHEN SUM(ii.purchase_price * inv_items.quantity) > 0 
                THEN ((SUM(inv_items.total_price) - SUM(ii.purchase_price * inv_items.quantity)) / SUM(ii.purchase_price * inv_items.quantity) * 100)
                ELSE 0 
            END as markup_percentage,
            ROW_NUMBER() OVER (ORDER BY (SUM(inv_items.total_price) - SUM(ii.purchase_price * inv_items.quantity)) DESC) as profitability_rank
        FROM invoice_items inv_items
        JOIN inventory_items ii ON inv_items.inventory_item_id = ii.id
        JOIN categories c ON ii.category_id = c.id
        JOIN invoices inv ON inv_items.invoice_id = inv.id
        WHERE inv.created_at >= :start_date 
        AND inv.created_at <= :end_date
        AND c.id = :category_id
        GROUP BY ii.id, ii.name, c.name
        HAVING SUM(inv_items.quantity) > 0
        ORDER BY gross_profit DESC
        LIMIT :limit
    """)
    
    results = db.execute(query, {
        "start_date": start_date,
        "end_date": end_date,
        "category_id": category_id,
        "limit": limit
    }).fetchall()
    
    items = []
    for row in results:
        items.append(schemas.ItemProfitabilityReport(
            item_id=row.item_id,
            item_name=row.item_name,
            category_name=row.category_name,
            total_revenue=float(row.total_revenue),
            total_cost=float(row.total_cost),
            gross_profit=float(row.gross_profit),
            profit_margin=float(row.profit_margin),
            units_sold=row.units_sold,
            profit_per_unit=float(row.profit_per_unit),
            markup_percentage=float(row.markup_percentage),
            profitability_rank=row.profitability_rank,
            profitability_trend="stable"  # Simplified
        ))
    
    return items

async def _get_margin_trends(db: Session, start_date: datetime, end_date: datetime) -> List[schemas.MarginAnalysis]:
    """Get margin trends over time"""
    
    # For simplicity, we'll create synthetic margin analysis data
    # In a real implementation, this would come from stored margin_analysis table
    margin_trends = []
    
    # Calculate daily margins for the period
    current_date = start_date.date()
    end_date_only = end_date.date()
    
    while current_date <= end_date_only:
        daily_start = datetime.combine(current_date, datetime.min.time())
        daily_end = datetime.combine(current_date, datetime.max.time())
        
        # Calculate daily metrics
        daily_query = text("""
            SELECT 
                COALESCE(SUM(inv_items.total_price), 0) as daily_revenue,
                COALESCE(SUM(ii.purchase_price * inv_items.quantity), 0) as daily_cost
            FROM invoice_items inv_items
            JOIN inventory_items ii ON inv_items.inventory_item_id = ii.id
            JOIN invoices inv ON inv_items.invoice_id = inv.id
            WHERE inv.created_at >= :daily_start AND inv.created_at <= :daily_end
        """)
        
        result = db.execute(daily_query, {
            "daily_start": daily_start,
            "daily_end": daily_end
        }).fetchone()
        
        daily_revenue = float(result.daily_revenue or 0)
        daily_cost = float(result.daily_cost or 0)
        actual_margin = ((daily_revenue - daily_cost) / daily_revenue * 100) if daily_revenue > 0 else 0
        target_margin = 25.0  # Target 25% margin
        
        if daily_revenue > 0:  # Only include days with sales
            margin_trends.append(schemas.MarginAnalysis(
                id=f"daily_{current_date}",  # Temporary ID
                entity_type="global",
                entity_id=None,
                analysis_date=daily_start,
                target_margin=target_margin,
                actual_margin=actual_margin,
                margin_variance=actual_margin - target_margin,
                revenue_impact=daily_revenue * (actual_margin - target_margin) / 100,
                cost_factors={"material_cost": daily_cost},
                margin_trend="stable",
                recommendations={},
                created_at=datetime.now()
            ))
        
        current_date += timedelta(days=1)
    
    return margin_trends[-30:]  # Return last 30 days with data

async def _generate_profitability_alerts(db: Session, start_date: datetime, end_date: datetime) -> List[Dict[str, Any]]:
    """Generate profitability alerts and recommendations"""
    
    alerts = []
    
    # Low margin items alert
    low_margin_query = text("""
        SELECT 
            ii.name as item_name,
            c.name as category_name,
            CASE 
                WHEN SUM(inv_items.total_price) > 0 
                THEN ((SUM(inv_items.total_price) - SUM(ii.purchase_price * inv_items.quantity)) / SUM(inv_items.total_price) * 100)
                ELSE 0 
            END as profit_margin,
            SUM(inv_items.quantity) as units_sold
        FROM invoice_items inv_items
        JOIN inventory_items ii ON inv_items.inventory_item_id = ii.id
        JOIN categories c ON ii.category_id = c.id
        JOIN invoices inv ON inv_items.invoice_id = inv.id
        WHERE inv.created_at >= :start_date AND inv.created_at <= :end_date
        GROUP BY ii.id, ii.name, c.name
        HAVING SUM(inv_items.quantity) > 0 
        AND ((SUM(inv_items.total_price) - SUM(ii.purchase_price * inv_items.quantity)) / SUM(inv_items.total_price) * 100) < 15
        ORDER BY profit_margin ASC
        LIMIT 5
    """)
    
    low_margin_results = db.execute(low_margin_query, {
        "start_date": start_date,
        "end_date": end_date
    }).fetchall()
    
    if low_margin_results:
        alerts.append({
            "type": "low_margin_items",
            "severity": "warning",
            "title": "Low Margin Items Detected",
            "description": f"Found {len(low_margin_results)} items with margins below 15%",
            "items": [{"name": row.item_name, "margin": float(row.profit_margin)} for row in low_margin_results],
            "recommendation": "Consider reviewing pricing strategy or finding lower cost suppliers"
        })
    
    # High performing category alert
    high_performing_query = text("""
        SELECT 
            c.name as category_name,
            CASE 
                WHEN SUM(inv_items.total_price) > 0 
                THEN ((SUM(inv_items.total_price) - SUM(ii.purchase_price * inv_items.quantity)) / SUM(inv_items.total_price) * 100)
                ELSE 0 
            END as profit_margin,
            SUM(inv_items.total_price) - SUM(ii.purchase_price * inv_items.quantity) as gross_profit
        FROM invoice_items inv_items
        JOIN inventory_items ii ON inv_items.inventory_item_id = ii.id
        JOIN categories c ON ii.category_id = c.id
        JOIN invoices inv ON inv_items.invoice_id = inv.id
        WHERE inv.created_at >= :start_date AND inv.created_at <= :end_date
        GROUP BY c.id, c.name
        HAVING SUM(inv_items.quantity) > 0 
        AND ((SUM(inv_items.total_price) - SUM(ii.purchase_price * inv_items.quantity)) / SUM(inv_items.total_price) * 100) > 30
        ORDER BY gross_profit DESC
        LIMIT 3
    """)
    
    high_performing_results = db.execute(high_performing_query, {
        "start_date": start_date,
        "end_date": end_date
    }).fetchall()
    
    if high_performing_results:
        alerts.append({
            "type": "high_performing_categories",
            "severity": "success",
            "title": "High Performing Categories",
            "description": f"Found {len(high_performing_results)} categories with excellent margins (>30%)",
            "items": [{"name": row.category_name, "margin": float(row.profit_margin)} for row in high_performing_results],
            "recommendation": "Consider expanding inventory in these high-margin categories"
        })
    
    return alerts

async def _get_cost_breakdown(db: Session, start_date: datetime, end_date: datetime) -> Dict[str, float]:
    """Get breakdown of costs"""
    
    cost_query = text("""
        SELECT 
            SUM(ii.purchase_price * inv_items.quantity) as material_cost,
            SUM(inv_items.total_price * (inv.labor_cost_percentage / 100)) as labor_cost,
            SUM(inv_items.total_price * (inv.vat_percentage / 100)) as tax_cost,
            COUNT(DISTINCT inv.id) as transaction_count
        FROM invoice_items inv_items
        JOIN inventory_items ii ON inv_items.inventory_item_id = ii.id
        JOIN invoices inv ON inv_items.invoice_id = inv.id
        WHERE inv.created_at >= :start_date AND inv.created_at <= :end_date
    """)
    
    result = db.execute(cost_query, {
        "start_date": start_date,
        "end_date": end_date
    }).fetchone()
    
    material_cost = float(result.material_cost or 0)
    labor_cost = float(result.labor_cost or 0)
    tax_cost = float(result.tax_cost or 0)
    
    # Estimate overhead as 5% of material cost
    overhead_cost = material_cost * 0.05
    
    return {
        "material_cost": material_cost,
        "labor_cost": labor_cost,
        "overhead_cost": overhead_cost,
        "tax_cost": tax_cost,
        "total_cost": material_cost + labor_cost + overhead_cost + tax_cost
    }

async def _get_revenue_breakdown(db: Session, start_date: datetime, end_date: datetime) -> Dict[str, float]:
    """Get breakdown of revenue by category"""
    
    revenue_query = text("""
        SELECT 
            c.name as category_name,
            SUM(inv_items.total_price) as category_revenue
        FROM invoice_items inv_items
        JOIN inventory_items ii ON inv_items.inventory_item_id = ii.id
        JOIN categories c ON ii.category_id = c.id
        JOIN invoices inv ON inv_items.invoice_id = inv.id
        WHERE inv.created_at >= :start_date AND inv.created_at <= :end_date
        GROUP BY c.id, c.name
        ORDER BY category_revenue DESC
    """)
    
    results = db.execute(revenue_query, {
        "start_date": start_date,
        "end_date": end_date
    }).fetchall()
    
    revenue_breakdown = {}
    for row in results:
        revenue_breakdown[row.category_name] = float(row.category_revenue)
    
    return revenue_breakdown

# Additional profitability endpoints
@router.get("/items", response_model=List[schemas.ItemProfitabilityReport])
async def get_item_profitability(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    category_id: Optional[str] = Query(None, description="Filter by category"),
    sort_by: str = Query("gross_profit", description="Sort by: gross_profit, profit_margin, units_sold"),
    limit: int = Query(50, description="Maximum number of items to return"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("view_reports"))
):
    """Get detailed profitability analysis for individual items"""
    
    if not end_date:
        end_date = datetime.now()
    if not start_date:
        start_date = end_date - timedelta(days=30)
    
    return await _get_top_performing_items(db, start_date, end_date, limit)

@router.get("/categories", response_model=List[schemas.CategoryProfitabilityReport])
async def get_category_profitability(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    include_items: bool = Query(True, description="Include top items for each category"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("view_reports"))
):
    """Get profitability analysis by category"""
    
    if not end_date:
        end_date = datetime.now()
    if not start_date:
        start_date = end_date - timedelta(days=30)
    
    return await _get_category_profitability(db, start_date, end_date)

@router.get("/margins/trends", response_model=List[schemas.MarginAnalysis])
async def get_margin_trends(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    entity_type: str = Query("global", description="Entity type: global, category, item"),
    entity_id: Optional[str] = Query(None, description="Entity ID for specific analysis"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("view_reports"))
):
    """Get margin trends over time"""
    
    if not end_date:
        end_date = datetime.now()
    if not start_date:
        start_date = end_date - timedelta(days=30)
    
    return await _get_margin_trends(db, start_date, end_date)

@router.post("/analysis/generate", response_model=schemas.ProfitabilityAnalysisResponse)
async def generate_profitability_analysis(
    request: schemas.ProfitabilityAnalysisRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("view_reports"))
):
    """Generate comprehensive profitability analysis"""
    
    try:
        # Calculate analysis for specified entities
        analysis_results = []
        
        # Get overall metrics
        summary_metrics = await _calculate_overall_metrics(db, request.start_date, request.end_date)
        
        # Get margin trends if requested
        margin_trends = []
        if request.include_margin_trends:
            margin_trends = await _get_margin_trends(db, request.start_date, request.end_date)
        
        # Generate recommendations
        recommendations = []
        if request.include_recommendations:
            recommendations = await _generate_profitability_alerts(db, request.start_date, request.end_date)
        
        # Get cost breakdown
        cost_breakdown = {}
        if request.include_cost_breakdown:
            cost_breakdown = await _get_cost_breakdown(db, request.start_date, request.end_date)
        
        return schemas.ProfitabilityAnalysisResponse(
            analysis_results=analysis_results,
            summary_metrics=summary_metrics,
            margin_trends=margin_trends,
            recommendations=recommendations,
            cost_breakdown=cost_breakdown
        )
        
    except Exception as e:
        logger.error(f"Error generating profitability analysis: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate profitability analysis: {str(e)}"
        )
