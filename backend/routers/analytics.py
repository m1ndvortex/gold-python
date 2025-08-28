from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func, text
from datetime import datetime, timedelta, date
from database import get_db
import models
import schemas
from oauth2_middleware import get_current_user, require_permission
from decimal import Decimal
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/dashboard", response_model=schemas.DashboardAnalytics)
async def get_dashboard_analytics(
    start_date: Optional[datetime] = Query(None, description="Start date for analysis"),
    end_date: Optional[datetime] = Query(None, description="End date for analysis"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("view_reports"))
):
    """Get comprehensive dashboard analytics with time-based analysis"""
    
    # Default to last 30 days if no date range provided
    if not end_date:
        end_date = datetime.now()
    if not start_date:
        start_date = end_date - timedelta(days=30)
    
    try:
        # Time-based patterns analysis
        time_based = await _get_time_based_analytics(db, start_date, end_date)
        
        # Sales analytics
        sales = await _get_sales_analytics(db, start_date, end_date)
        
        # Inventory analytics  
        inventory = await _get_inventory_analytics(db, start_date, end_date)
        
        # Customer analytics
        customers = await _get_customer_analytics(db, start_date, end_date)
        
        return schemas.DashboardAnalytics(
            time_based=time_based,
            sales=sales,
            inventory=inventory,
            customers=customers,
            last_updated=datetime.now()
        )
        
    except Exception as e:
        logger.error(f"Error getting dashboard analytics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve dashboard analytics: {str(e)}"
        )

async def _get_time_based_analytics(db: Session, start_date: datetime, end_date: datetime) -> schemas.TimeBasedAnalytics:
    """Generate time-based analytics patterns"""
    
    # Daily patterns - sales by hour of day
    daily_sales_query = text("""
        SELECT 
            EXTRACT(hour FROM created_at) as hour,
            COUNT(*) as invoice_count,
            SUM(total_amount) as total_sales
        FROM invoices 
        WHERE created_at >= :start_date AND created_at <= :end_date
        GROUP BY EXTRACT(hour FROM created_at)
        ORDER BY hour
    """)
    
    daily_results = db.execute(daily_sales_query, {
        "start_date": start_date,
        "end_date": end_date
    }).fetchall()
    
    daily_patterns = {
        "hourly_sales": {str(int(row.hour)): float(row.total_sales or 0) for row in daily_results},
        "peak_hours": _identify_peak_hours(daily_results),
        "total_invoices_by_hour": {str(int(row.hour)): row.invoice_count for row in daily_results}
    }
    
    # Weekly patterns - sales by day of week
    weekly_sales_query = text("""
        SELECT 
            EXTRACT(dow FROM created_at) as day_of_week,
            COUNT(*) as invoice_count,
            SUM(total_amount) as total_sales
        FROM invoices 
        WHERE created_at >= :start_date AND created_at <= :end_date
        GROUP BY EXTRACT(dow FROM created_at)
        ORDER BY day_of_week
    """)
    
    weekly_results = db.execute(weekly_sales_query, {
        "start_date": start_date,
        "end_date": end_date
    }).fetchall()
    
    day_names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    weekly_patterns = {
        "daily_sales": {day_names[int(row.day_of_week)]: float(row.total_sales or 0) for row in weekly_results},
        "best_day": _identify_best_day(weekly_results, day_names),
        "total_invoices_by_day": {day_names[int(row.day_of_week)]: row.invoice_count for row in weekly_results}
    }
    
    # Monthly trends - sales by month
    monthly_sales_query = text("""
        SELECT 
            DATE_TRUNC('month', created_at) as month,
            COUNT(*) as invoice_count,
            SUM(total_amount) as total_sales
        FROM invoices 
        WHERE created_at >= :start_date AND created_at <= :end_date
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month
    """)
    
    monthly_results = db.execute(monthly_sales_query, {
        "start_date": start_date,
        "end_date": end_date
    }).fetchall()
    
    monthly_trends = {
        "monthly_sales": {row.month.strftime("%Y-%m"): float(row.total_sales or 0) for row in monthly_results},
        "growth_trend": _calculate_growth_trend(monthly_results),
        "total_invoices_by_month": {row.month.strftime("%Y-%m"): row.invoice_count for row in monthly_results}
    }
    
    # Year-over-year comparison
    last_year_start = start_date.replace(year=start_date.year - 1)
    last_year_end = end_date.replace(year=end_date.year - 1)
    
    current_period_sales = db.execute(text("""
        SELECT SUM(total_amount) as total 
        FROM invoices 
        WHERE created_at >= :start_date AND created_at <= :end_date
    """), {"start_date": start_date, "end_date": end_date}).scalar() or 0
    
    last_year_sales = db.execute(text("""
        SELECT SUM(total_amount) as total 
        FROM invoices 
        WHERE created_at >= :start_date AND created_at <= :end_date
    """), {"start_date": last_year_start, "end_date": last_year_end}).scalar() or 0
    
    yoy_growth = ((current_period_sales - last_year_sales) / last_year_sales * 100) if last_year_sales > 0 else 0
    
    year_over_year = {
        "current_period_sales": float(current_period_sales),
        "last_year_sales": float(last_year_sales),
        "growth_percentage": float(yoy_growth),
        "comparison_period": f"{start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}"
    }
    
    return schemas.TimeBasedAnalytics(
        daily_patterns=daily_patterns,
        weekly_patterns=weekly_patterns,
        monthly_trends=monthly_trends,
        year_over_year=year_over_year
    )

async def _get_sales_analytics(db: Session, start_date: datetime, end_date: datetime) -> schemas.SalesAnalytics:
    """Generate sales analytics"""
    
    # Total sales in period
    total_sales = db.execute(text("""
        SELECT SUM(total_amount) as total 
        FROM invoices 
        WHERE created_at >= :start_date AND created_at <= :end_date
    """), {"start_date": start_date, "end_date": end_date}).scalar() or 0
    
    # Sales by period (daily breakdown)
    daily_sales_query = text("""
        SELECT 
            DATE(created_at) as sale_date,
            SUM(total_amount) as daily_total
        FROM invoices 
        WHERE created_at >= :start_date AND created_at <= :end_date
        GROUP BY DATE(created_at)
        ORDER BY sale_date
    """)
    
    daily_sales_results = db.execute(daily_sales_query, {
        "start_date": start_date,
        "end_date": end_date
    }).fetchall()
    
    sales_by_period = {row.sale_date.strftime("%Y-%m-%d"): float(row.daily_total) for row in daily_sales_results}
    
    # Top selling items
    top_items_query = text("""
        SELECT 
            ii.name as item_name,
            SUM(invoice_items.quantity) as total_quantity,
            SUM(invoice_items.total_price) as total_revenue
        FROM invoice_items
        JOIN inventory_items ii ON invoice_items.inventory_item_id = ii.id
        JOIN invoices i ON invoice_items.invoice_id = i.id
        WHERE i.created_at >= :start_date AND i.created_at <= :end_date
        GROUP BY ii.id, ii.name
        ORDER BY total_revenue DESC
        LIMIT 10
    """)
    
    top_items_results = db.execute(top_items_query, {
        "start_date": start_date,
        "end_date": end_date
    }).fetchall()
    
    top_selling_items = [
        {
            "name": row.item_name,
            "quantity_sold": row.total_quantity,
            "revenue": float(row.total_revenue)
        }
        for row in top_items_results
    ]
    
    # Sales by category
    category_sales_query = text("""
        SELECT 
            c.name as category_name,
            SUM(invoice_items.total_price) as category_revenue
        FROM invoice_items
        JOIN inventory_items ii ON invoice_items.inventory_item_id = ii.id
        JOIN categories c ON ii.category_id = c.id
        JOIN invoices i ON invoice_items.invoice_id = i.id
        WHERE i.created_at >= :start_date AND i.created_at <= :end_date
        GROUP BY c.id, c.name
        ORDER BY category_revenue DESC
    """)
    
    category_results = db.execute(category_sales_query, {
        "start_date": start_date,
        "end_date": end_date
    }).fetchall()
    
    sales_by_category = {row.category_name: float(row.category_revenue) for row in category_results}
    
    # Calculate growth rate and trend
    previous_period_start = start_date - (end_date - start_date)
    previous_period_sales = db.execute(text("""
        SELECT SUM(total_amount) as total 
        FROM invoices 
        WHERE created_at >= :start_date AND created_at < :end_date
    """), {"start_date": previous_period_start, "end_date": start_date}).scalar() or 0
    
    growth_rate = ((total_sales - previous_period_sales) / previous_period_sales * 100) if previous_period_sales > 0 else 0
    trend_direction = "up" if growth_rate > 5 else "down" if growth_rate < -5 else "stable"
    
    return schemas.SalesAnalytics(
        total_sales=float(total_sales),
        sales_by_period=sales_by_period,
        top_selling_items=top_selling_items,
        sales_by_category=sales_by_category,
        growth_rate=float(growth_rate),
        trend_direction=trend_direction
    )

async def _get_inventory_analytics(db: Session, start_date: datetime, end_date: datetime) -> schemas.InventoryAnalytics:
    """Generate inventory analytics"""
    
    # Total inventory value
    total_value_query = text("""
        SELECT SUM(sell_price * stock_quantity) as total_value
        FROM inventory_items
        WHERE is_active = true
    """)
    
    total_value = db.execute(total_value_query).scalar() or 0
    
    # Inventory turnover rate
    avg_inventory_query = text("""
        SELECT AVG(sell_price * stock_quantity) as avg_inventory
        FROM inventory_items
        WHERE is_active = true
    """)
    
    avg_inventory = db.execute(avg_inventory_query).scalar() or 1
    
    cogs_query = text("""
        SELECT SUM(invoice_items.total_price) as cogs
        FROM invoice_items
        JOIN invoices i ON invoice_items.invoice_id = i.id
        WHERE i.created_at >= :start_date AND i.created_at <= :end_date
    """)
    
    cogs = db.execute(cogs_query, {
        "start_date": start_date,
        "end_date": end_date
    }).scalar() or 0
    
    turnover_rate = float(cogs / avg_inventory) if avg_inventory > 0 else 0
    
    # Fast moving items (high turnover)
    fast_moving_query = text("""
        SELECT 
            ii.name,
            SUM(invoice_items.quantity) as total_sold,
            ii.stock_quantity,
            (SUM(invoice_items.quantity)::float / NULLIF(ii.stock_quantity, 0)) as turnover_ratio
        FROM inventory_items ii
        LEFT JOIN invoice_items ON ii.id = invoice_items.inventory_item_id
        LEFT JOIN invoices i ON invoice_items.invoice_id = i.id
        WHERE ii.is_active = true 
        AND (i.created_at IS NULL OR (i.created_at >= :start_date AND i.created_at <= :end_date))
        GROUP BY ii.id, ii.name, ii.stock_quantity
        HAVING SUM(invoice_items.quantity) > 0
        ORDER BY turnover_ratio DESC NULLS LAST
        LIMIT 10
    """)
    
    fast_moving_results = db.execute(fast_moving_query, {
        "start_date": start_date,
        "end_date": end_date
    }).fetchall()
    
    fast_moving_items = [
        {
            "name": row.name,
            "total_sold": row.total_sold or 0,
            "current_stock": row.stock_quantity,
            "turnover_ratio": float(row.turnover_ratio or 0)
        }
        for row in fast_moving_results
    ]
    
    # Slow moving items (low turnover)
    slow_moving_query = text("""
        SELECT 
            ii.name,
            COALESCE(SUM(invoice_items.quantity), 0) as total_sold,
            ii.stock_quantity,
            ii.sell_price * ii.stock_quantity as stock_value
        FROM inventory_items ii
        LEFT JOIN invoice_items ON ii.id = invoice_items.inventory_item_id
        LEFT JOIN invoices i ON invoice_items.invoice_id = i.id
        WHERE ii.is_active = true 
        AND (i.created_at IS NULL OR (i.created_at >= :start_date AND i.created_at <= :end_date))
        GROUP BY ii.id, ii.name, ii.stock_quantity, ii.sell_price
        HAVING COALESCE(SUM(invoice_items.quantity), 0) <= 1
        ORDER BY stock_value DESC
        LIMIT 10
    """)
    
    slow_moving_results = db.execute(slow_moving_query, {
        "start_date": start_date,
        "end_date": end_date
    }).fetchall()
    
    slow_moving_items = [
        {
            "name": row.name,
            "total_sold": row.total_sold,
            "current_stock": row.stock_quantity,
            "stock_value": float(row.stock_value or 0)
        }
        for row in slow_moving_results
    ]
    
    # Dead stock count (no sales in period)
    dead_stock_count = db.execute(text("""
        SELECT COUNT(*) as dead_stock
        FROM inventory_items ii
        WHERE ii.is_active = true 
        AND ii.id NOT IN (
            SELECT DISTINCT invoice_items.inventory_item_id
            FROM invoice_items
            JOIN invoices i ON invoice_items.invoice_id = i.id
            WHERE i.created_at >= :start_date AND i.created_at <= :end_date
        )
    """), {"start_date": start_date, "end_date": end_date}).scalar() or 0
    
    # Stock optimization suggestions
    stock_optimization_suggestions = []
    
    # Low stock items
    low_stock_items = db.execute(text("""
        SELECT name, stock_quantity, min_stock_level
        FROM inventory_items
        WHERE is_active = true AND stock_quantity <= min_stock_level
        ORDER BY stock_quantity ASC
        LIMIT 5
    """)).fetchall()
    
    for item in low_stock_items:
        stock_optimization_suggestions.append({
            "type": "reorder",
            "item_name": item.name,
            "current_stock": item.stock_quantity,
            "recommended_action": f"Reorder - below minimum level of {item.min_stock_level}",
            "priority": "high"
        })
    
    return schemas.InventoryAnalytics(
        total_value=float(total_value),
        turnover_rate=turnover_rate,
        fast_moving_items=fast_moving_items,
        slow_moving_items=slow_moving_items,
        dead_stock_count=dead_stock_count,
        stock_optimization_suggestions=stock_optimization_suggestions
    )

async def _get_customer_analytics(db: Session, start_date: datetime, end_date: datetime) -> schemas.CustomerAnalytics:
    """Generate customer analytics"""
    
    # Total customers
    total_customers = db.query(models.Customer).count()
    
    # New customers in period
    new_customers = db.query(models.Customer).filter(
        models.Customer.created_at >= start_date,
        models.Customer.created_at <= end_date
    ).count()
    
    # Customer retention rate (customers who made repeat purchases)
    retention_query = text("""
        SELECT 
            COUNT(DISTINCT customer_id) as repeat_customers
        FROM invoices
        WHERE customer_id IN (
            SELECT customer_id
            FROM invoices
            GROUP BY customer_id
            HAVING COUNT(*) > 1
        )
        AND created_at >= :start_date AND created_at <= :end_date
    """)
    
    repeat_customers = db.execute(retention_query, {
        "start_date": start_date,
        "end_date": end_date
    }).scalar() or 0
    
    active_customers = db.execute(text("""
        SELECT COUNT(DISTINCT customer_id) as active
        FROM invoices
        WHERE created_at >= :start_date AND created_at <= :end_date
    """), {"start_date": start_date, "end_date": end_date}).scalar() or 1
    
    retention_rate = (repeat_customers / active_customers * 100) if active_customers > 0 else 0
    
    # Average order value
    avg_order_value = db.execute(text("""
        SELECT AVG(total_amount) as avg_value
        FROM invoices
        WHERE created_at >= :start_date AND created_at <= :end_date
    """), {"start_date": start_date, "end_date": end_date}).scalar() or 0
    
    # Customer lifetime value (total purchases per customer)
    customer_ltv = db.execute(text("""
        SELECT AVG(total_purchases) as avg_ltv
        FROM customers
        WHERE total_purchases > 0
    """)).scalar() or 0
    
    # Top customers by revenue
    top_customers_query = text("""
        SELECT 
            c.name as customer_name,
            SUM(i.total_amount) as total_revenue,
            COUNT(i.id) as order_count
        FROM customers c
        JOIN invoices i ON c.id = i.customer_id
        WHERE i.created_at >= :start_date AND i.created_at <= :end_date
        GROUP BY c.id, c.name
        ORDER BY total_revenue DESC
        LIMIT 10
    """)
    
    top_customers_results = db.execute(top_customers_query, {
        "start_date": start_date,
        "end_date": end_date
    }).fetchall()
    
    top_customers = [
        {
            "name": row.customer_name,
            "total_revenue": float(row.total_revenue),
            "order_count": row.order_count
        }
        for row in top_customers_results
    ]
    
    return schemas.CustomerAnalytics(
        total_customers=total_customers,
        new_customers=new_customers,
        retention_rate=float(retention_rate),
        average_order_value=float(avg_order_value),
        customer_lifetime_value=float(customer_ltv),
        top_customers=top_customers
    )

# Helper functions
def _identify_peak_hours(daily_results):
    """Identify peak sales hours"""
    if not daily_results:
        return []
    
    max_sales = max(row.total_sales or 0 for row in daily_results)
    peak_hours = [int(row.hour) for row in daily_results if (row.total_sales or 0) >= max_sales * 0.8]
    return peak_hours

def _identify_best_day(weekly_results, day_names):
    """Identify best performing day of week"""
    if not weekly_results:
        return "Unknown"
    
    best_day_row = max(weekly_results, key=lambda x: x.total_sales or 0)
    return day_names[int(best_day_row.day_of_week)]

def _calculate_growth_trend(monthly_results):
    """Calculate overall growth trend"""
    if len(monthly_results) < 2:
        return "insufficient_data"
    
    results_list = list(monthly_results)
    first_month = results_list[0].total_sales or 0
    last_month = results_list[-1].total_sales or 0
    
    if first_month == 0:
        return "growing" if last_month > 0 else "stable"
    
    growth = (last_month - first_month) / first_month * 100
    
    if growth > 10:
        return "growing"
    elif growth < -10:
        return "declining"
    else:
        return "stable"

# KPI Targets Management
@router.post("/kpi-targets", response_model=schemas.KPITarget)
async def create_kpi_target(
    kpi_target: schemas.KPITargetCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("manage_settings"))
):
    """Create a new KPI target"""
    
    db_kpi_target = models.KPITarget(
        **kpi_target.dict(),
        created_by=current_user.id
    )
    
    db.add(db_kpi_target)
    db.commit()
    db.refresh(db_kpi_target)
    
    return db_kpi_target

@router.get("/kpi-targets", response_model=List[schemas.KPITargetWithCreator])
async def get_kpi_targets(
    kpi_type: Optional[str] = Query(None, description="Filter by KPI type"),
    target_period: Optional[str] = Query(None, description="Filter by target period"),
    is_active: bool = Query(True, description="Filter by active status"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("view_reports"))
):
    """Get KPI targets with optional filtering"""
    
    query = db.query(models.KPITarget).options(joinedload(models.KPITarget.creator))
    
    if kpi_type:
        query = query.filter(models.KPITarget.kpi_type == kpi_type)
    if target_period:
        query = query.filter(models.KPITarget.target_period == target_period)
    if is_active is not None:
        query = query.filter(models.KPITarget.is_active == is_active)
    
    return query.all()

@router.put("/kpi-targets/{kpi_target_id}", response_model=schemas.KPITarget)
async def update_kpi_target(
    kpi_target_id: str,
    kpi_target_update: schemas.KPITargetUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("manage_settings"))
):
    """Update a KPI target"""
    
    db_kpi_target = db.query(models.KPITarget).filter(
        models.KPITarget.id == kpi_target_id
    ).first()
    
    if not db_kpi_target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="KPI target not found"
        )
    
    update_data = kpi_target_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_kpi_target, field, value)
    
    db.commit()
    db.refresh(db_kpi_target)
    
    return db_kpi_target

@router.get("/analytics-data", response_model=schemas.AnalyticsResponse)
async def get_analytics_data(
    request: schemas.AnalyticsRequest = Depends(),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("view_reports"))
):
    """Get stored analytics data with filtering"""
    
    query = db.query(models.AnalyticsData)
    
    if request.start_date:
        query = query.filter(models.AnalyticsData.calculation_date >= request.start_date.date())
    if request.end_date:
        query = query.filter(models.AnalyticsData.calculation_date <= request.end_date.date())
    if request.data_types:
        query = query.filter(models.AnalyticsData.data_type.in_(request.data_types))
    if request.entity_types:
        query = query.filter(models.AnalyticsData.entity_type.in_(request.entity_types))
    if request.entity_ids:
        query = query.filter(models.AnalyticsData.entity_id.in_(request.entity_ids))
    
    total_records = query.count()
    data = query.offset(skip).limit(limit).all()
    
    # Generate summary statistics
    summary = {
        "total_records": total_records,
        "date_range": {
            "start": request.start_date.isoformat() if request.start_date else None,
            "end": request.end_date.isoformat() if request.end_date else None
        },
        "data_types": list(set([item.data_type for item in data])),
        "entity_types": list(set([item.entity_type for item in data if item.entity_type]))
    }
    
    return schemas.AnalyticsResponse(
        data=data,
        summary=summary,
        total_records=total_records
    )
