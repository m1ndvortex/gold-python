from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, desc, asc, text, case
from typing import Optional, List, Dict, Any
from datetime import datetime, date, timedelta
from database import get_db
from auth import get_current_user
import models
from schemas import User

router = APIRouter(
    prefix="/reports",
    tags=["reports"],
    dependencies=[Depends(get_current_user)]
)

# Sales Trend Analysis Endpoints

@router.get("/sales/trends")
async def get_sales_trends(
    start_date: Optional[date] = Query(None, description="Start date for analysis"),
    end_date: Optional[date] = Query(None, description="End date for analysis"),
    period: str = Query("daily", description="Period: daily, weekly, monthly"),
    category_id: Optional[str] = Query(None, description="Filter by category"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get sales trend analysis with date filtering"""
    try:
        # Set default date range if not provided
        if not end_date:
            end_date = date.today()
        if not start_date:
            start_date = end_date - timedelta(days=30)
        
        # Base query for sales data
        query = db.query(
            models.Invoice.created_at,
            models.Invoice.total_amount,
            models.Invoice.paid_amount,
            models.InvoiceItem.quantity,
            models.InventoryItem.category_id,
            models.Category.name.label('category_name')
        ).join(
            models.InvoiceItem, models.Invoice.id == models.InvoiceItem.invoice_id
        ).join(
            models.InventoryItem, models.InvoiceItem.inventory_item_id == models.InventoryItem.id
        ).join(
            models.Category, models.InventoryItem.category_id == models.Category.id
        ).filter(
            and_(
                models.Invoice.created_at >= start_date,
                models.Invoice.created_at <= end_date,
                models.Invoice.status != 'cancelled'
            )
        )
        
        # Apply category filter if provided
        if category_id:
            query = query.filter(models.InventoryItem.category_id == category_id)
        
        sales_data = query.all()
        
        # Group data by period
        grouped_data = {}
        total_sales = 0
        total_paid = 0
        total_items_sold = 0
        
        for sale in sales_data:
            # Determine period key based on grouping
            if period == "daily":
                period_key = sale.created_at.date().isoformat()
            elif period == "weekly":
                # Get start of week (Monday)
                week_start = sale.created_at.date() - timedelta(days=sale.created_at.weekday())
                period_key = week_start.isoformat()
            elif period == "monthly":
                period_key = sale.created_at.strftime("%Y-%m")
            else:
                period_key = sale.created_at.date().isoformat()
            
            if period_key not in grouped_data:
                grouped_data[period_key] = {
                    "period": period_key,
                    "total_amount": 0,
                    "paid_amount": 0,
                    "items_sold": 0,
                    "categories": {}
                }
            
            grouped_data[period_key]["total_amount"] += float(sale.total_amount)
            grouped_data[period_key]["paid_amount"] += float(sale.paid_amount)
            grouped_data[period_key]["items_sold"] += sale.quantity
            
            # Track category sales
            if sale.category_name not in grouped_data[period_key]["categories"]:
                grouped_data[period_key]["categories"][sale.category_name] = 0
            grouped_data[period_key]["categories"][sale.category_name] += float(sale.total_amount)
            
            total_sales += float(sale.total_amount)
            total_paid += float(sale.paid_amount)
            total_items_sold += sale.quantity
        
        # Convert to list and sort by period
        trends = list(grouped_data.values())
        trends.sort(key=lambda x: x["period"])
        
        return {
            "period": period,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "summary": {
                "total_sales": total_sales,
                "total_paid": total_paid,
                "total_outstanding": total_sales - total_paid,
                "total_items_sold": total_items_sold,
                "average_daily_sales": total_sales / max(1, (end_date - start_date).days + 1)
            },
            "trends": trends
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating sales trends: {str(e)}")

@router.get("/sales/top-products")
async def get_top_selling_products(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    limit: int = Query(10, description="Number of top products to return"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get top selling products by quantity and revenue"""
    try:
        if not end_date:
            end_date = date.today()
        if not start_date:
            start_date = end_date - timedelta(days=30)
        
        # Query for top products by quantity
        top_by_quantity = db.query(
            models.InventoryItem.id,
            models.InventoryItem.name,
            models.Category.name.label('category_name'),
            func.sum(models.InvoiceItem.quantity).label('total_quantity'),
            func.sum(models.InvoiceItem.total_price).label('total_revenue'),
            func.count(models.InvoiceItem.id).label('transaction_count')
        ).join(
            models.InvoiceItem, models.InventoryItem.id == models.InvoiceItem.inventory_item_id
        ).join(
            models.Invoice, models.InvoiceItem.invoice_id == models.Invoice.id
        ).join(
            models.Category, models.InventoryItem.category_id == models.Category.id
        ).filter(
            and_(
                models.Invoice.created_at >= start_date,
                models.Invoice.created_at <= end_date,
                models.Invoice.status != 'cancelled'
            )
        ).group_by(
            models.InventoryItem.id,
            models.InventoryItem.name,
            models.Category.name
        ).order_by(
            desc(func.sum(models.InvoiceItem.quantity))
        ).limit(limit).all()
        
        # Query for top products by revenue
        top_by_revenue = db.query(
            models.InventoryItem.id,
            models.InventoryItem.name,
            models.Category.name.label('category_name'),
            func.sum(models.InvoiceItem.quantity).label('total_quantity'),
            func.sum(models.InvoiceItem.total_price).label('total_revenue'),
            func.count(models.InvoiceItem.id).label('transaction_count')
        ).join(
            models.InvoiceItem, models.InventoryItem.id == models.InvoiceItem.inventory_item_id
        ).join(
            models.Invoice, models.InvoiceItem.invoice_id == models.Invoice.id
        ).join(
            models.Category, models.InventoryItem.category_id == models.Category.id
        ).filter(
            and_(
                models.Invoice.created_at >= start_date,
                models.Invoice.created_at <= end_date,
                models.Invoice.status != 'cancelled'
            )
        ).group_by(
            models.InventoryItem.id,
            models.InventoryItem.name,
            models.Category.name
        ).order_by(
            desc(func.sum(models.InvoiceItem.total_price))
        ).limit(limit).all()
        
        return {
            "period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat()
            },
            "top_by_quantity": [
                {
                    "item_id": str(item.id),
                    "item_name": item.name,
                    "category_name": item.category_name,
                    "total_quantity": int(item.total_quantity),
                    "total_revenue": float(item.total_revenue),
                    "transaction_count": int(item.transaction_count),
                    "average_price": float(item.total_revenue) / int(item.total_quantity)
                }
                for item in top_by_quantity
            ],
            "top_by_revenue": [
                {
                    "item_id": str(item.id),
                    "item_name": item.name,
                    "category_name": item.category_name,
                    "total_quantity": int(item.total_quantity),
                    "total_revenue": float(item.total_revenue),
                    "transaction_count": int(item.transaction_count),
                    "average_price": float(item.total_revenue) / int(item.total_quantity)
                }
                for item in top_by_revenue
            ]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting top products: {str(e)}")

# Inventory Valuation and Low-Stock Reporting

@router.get("/inventory/valuation")
async def get_inventory_valuation(
    category_id: Optional[str] = Query(None, description="Filter by category"),
    include_inactive: bool = Query(False, description="Include inactive items"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get inventory valuation report"""
    try:
        # Base query for inventory valuation
        query = db.query(
            models.InventoryItem.id,
            models.InventoryItem.name,
            models.InventoryItem.stock_quantity,
            models.InventoryItem.purchase_price,
            models.InventoryItem.sell_price,
            models.InventoryItem.weight_grams,
            models.Category.name.label('category_name'),
            models.InventoryItem.is_active
        ).join(
            models.Category, models.InventoryItem.category_id == models.Category.id
        )
        
        # Apply filters
        if not include_inactive:
            query = query.filter(models.InventoryItem.is_active == True)
        
        if category_id:
            query = query.filter(models.InventoryItem.category_id == category_id)
        
        items = query.all()
        
        # Calculate valuations
        total_purchase_value = 0
        total_sell_value = 0
        total_weight = 0
        total_items = 0
        category_breakdown = {}
        
        item_valuations = []
        
        for item in items:
            purchase_value = float(item.purchase_price) * item.stock_quantity
            sell_value = float(item.sell_price) * item.stock_quantity
            item_weight = float(item.weight_grams) * item.stock_quantity
            
            item_valuations.append({
                "item_id": str(item.id),
                "item_name": item.name,
                "category_name": item.category_name,
                "stock_quantity": item.stock_quantity,
                "unit_purchase_price": float(item.purchase_price),
                "unit_sell_price": float(item.sell_price),
                "unit_weight_grams": float(item.weight_grams),
                "total_purchase_value": purchase_value,
                "total_sell_value": sell_value,
                "total_weight_grams": item_weight,
                "potential_profit": sell_value - purchase_value,
                "profit_margin": ((sell_value - purchase_value) / purchase_value * 100) if purchase_value > 0 else 0,
                "is_active": item.is_active
            })
            
            total_purchase_value += purchase_value
            total_sell_value += sell_value
            total_weight += item_weight
            total_items += item.stock_quantity
            
            # Category breakdown
            if item.category_name not in category_breakdown:
                category_breakdown[item.category_name] = {
                    "purchase_value": 0,
                    "sell_value": 0,
                    "weight_grams": 0,
                    "item_count": 0
                }
            
            category_breakdown[item.category_name]["purchase_value"] += purchase_value
            category_breakdown[item.category_name]["sell_value"] += sell_value
            category_breakdown[item.category_name]["weight_grams"] += item_weight
            category_breakdown[item.category_name]["item_count"] += item.stock_quantity
        
        return {
            "summary": {
                "total_purchase_value": total_purchase_value,
                "total_sell_value": total_sell_value,
                "total_potential_profit": total_sell_value - total_purchase_value,
                "overall_profit_margin": ((total_sell_value - total_purchase_value) / total_purchase_value * 100) if total_purchase_value > 0 else 0,
                "total_weight_grams": total_weight,
                "total_items": total_items,
                "unique_products": len(items)
            },
            "category_breakdown": [
                {
                    "category_name": category,
                    "purchase_value": data["purchase_value"],
                    "sell_value": data["sell_value"],
                    "potential_profit": data["sell_value"] - data["purchase_value"],
                    "profit_margin": ((data["sell_value"] - data["purchase_value"]) / data["purchase_value"] * 100) if data["purchase_value"] > 0 else 0,
                    "weight_grams": data["weight_grams"],
                    "item_count": data["item_count"]
                }
                for category, data in category_breakdown.items()
            ],
            "items": item_valuations
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating inventory valuation: {str(e)}")

@router.get("/inventory/low-stock")
async def get_low_stock_report(
    category_id: Optional[str] = Query(None, description="Filter by category"),
    threshold_multiplier: float = Query(1.0, description="Multiplier for min_stock_level threshold"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get low stock items report"""
    try:
        # Query for low stock items
        query = db.query(
            models.InventoryItem.id,
            models.InventoryItem.name,
            models.InventoryItem.stock_quantity,
            models.InventoryItem.min_stock_level,
            models.InventoryItem.sell_price,
            models.InventoryItem.weight_grams,
            models.Category.name.label('category_name')
        ).join(
            models.Category, models.InventoryItem.category_id == models.Category.id
        ).filter(
            and_(
                models.InventoryItem.is_active == True,
                models.InventoryItem.stock_quantity <= (models.InventoryItem.min_stock_level * threshold_multiplier)
            )
        )
        
        if category_id:
            query = query.filter(models.InventoryItem.category_id == category_id)
        
        low_stock_items = query.order_by(
            asc(models.InventoryItem.stock_quantity)
        ).all()
        
        # Calculate potential lost sales
        total_potential_lost_sales = 0
        critical_items = 0  # Items with 0 stock
        warning_items = 0   # Items below min level but not 0
        
        items_report = []
        
        for item in low_stock_items:
            shortage = max(0, item.min_stock_level - item.stock_quantity)
            potential_lost_sales = shortage * float(item.sell_price)
            
            if item.stock_quantity == 0:
                critical_items += 1
                status = "critical"
            else:
                warning_items += 1
                status = "warning"
            
            items_report.append({
                "item_id": str(item.id),
                "item_name": item.name,
                "category_name": item.category_name,
                "current_stock": item.stock_quantity,
                "min_stock_level": item.min_stock_level,
                "shortage": shortage,
                "unit_price": float(item.sell_price),
                "unit_weight_grams": float(item.weight_grams),
                "potential_lost_sales": potential_lost_sales,
                "status": status,
                "urgency_score": (item.min_stock_level - item.stock_quantity) / max(1, item.min_stock_level) * 100
            })
            
            total_potential_lost_sales += potential_lost_sales
        
        # Sort by urgency score (highest first)
        items_report.sort(key=lambda x: x["urgency_score"], reverse=True)
        
        return {
            "summary": {
                "total_low_stock_items": len(low_stock_items),
                "critical_items": critical_items,
                "warning_items": warning_items,
                "total_potential_lost_sales": total_potential_lost_sales,
                "threshold_multiplier": threshold_multiplier
            },
            "items": items_report
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating low stock report: {str(e)}")

# Customer Analysis and Debt Reporting

@router.get("/customers/analysis")
async def get_customer_analysis(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    min_purchases: int = Query(1, description="Minimum number of purchases"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get customer purchase analysis and trends"""
    try:
        if not end_date:
            end_date = date.today()
        if not start_date:
            start_date = end_date - timedelta(days=90)
        
        # Customer purchase analysis
        customer_stats = db.query(
            models.Customer.id,
            models.Customer.name,
            models.Customer.phone,
            models.Customer.current_debt,
            models.Customer.total_purchases,
            models.Customer.last_purchase_date,
            func.count(models.Invoice.id).label('invoice_count'),
            func.sum(models.Invoice.total_amount).label('period_purchases'),
            func.sum(models.Invoice.paid_amount).label('period_payments'),
            func.avg(models.Invoice.total_amount).label('average_invoice'),
            func.max(models.Invoice.created_at).label('last_invoice_date')
        ).outerjoin(
            models.Invoice, and_(
                models.Customer.id == models.Invoice.customer_id,
                models.Invoice.created_at >= start_date,
                models.Invoice.created_at <= end_date,
                models.Invoice.status != 'cancelled'
            )
        ).group_by(
            models.Customer.id,
            models.Customer.name,
            models.Customer.phone,
            models.Customer.current_debt,
            models.Customer.total_purchases,
            models.Customer.last_purchase_date
        ).having(
            func.count(models.Invoice.id) >= min_purchases
        ).order_by(
            desc(func.sum(models.Invoice.total_amount))
        ).all()
        
        # Calculate customer segments
        total_customers = len(customer_stats)
        total_revenue = sum(float(c.period_purchases or 0) for c in customer_stats)
        
        customer_analysis = []
        high_value_customers = 0
        customers_with_debt = 0
        
        for customer in customer_stats:
            period_purchases = float(customer.period_purchases or 0)
            period_payments = float(customer.period_payments or 0)
            current_debt = float(customer.current_debt or 0)
            
            # Customer value segment
            if period_purchases > (total_revenue / total_customers * 2):
                segment = "high_value"
                high_value_customers += 1
            elif period_purchases > (total_revenue / total_customers):
                segment = "medium_value"
            else:
                segment = "low_value"
            
            if current_debt > 0:
                customers_with_debt += 1
            
            customer_analysis.append({
                "customer_id": str(customer.id),
                "customer_name": customer.name,
                "phone": customer.phone,
                "current_debt": current_debt,
                "total_lifetime_purchases": float(customer.total_purchases or 0),
                "period_purchases": period_purchases,
                "period_payments": period_payments,
                "invoice_count": int(customer.invoice_count or 0),
                "average_invoice": float(customer.average_invoice or 0),
                "last_purchase_date": customer.last_purchase_date.isoformat() if customer.last_purchase_date else None,
                "last_invoice_date": customer.last_invoice_date.isoformat() if customer.last_invoice_date else None,
                "segment": segment,
                "payment_ratio": (period_payments / period_purchases * 100) if period_purchases > 0 else 0
            })
        
        return {
            "period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat()
            },
            "summary": {
                "total_active_customers": total_customers,
                "total_revenue": total_revenue,
                "average_revenue_per_customer": total_revenue / max(1, total_customers),
                "high_value_customers": high_value_customers,
                "customers_with_debt": customers_with_debt,
                "debt_percentage": (customers_with_debt / max(1, total_customers)) * 100
            },
            "customers": customer_analysis
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating customer analysis: {str(e)}")

@router.get("/customers/debt-report")
async def get_debt_report(
    min_debt: float = Query(0, description="Minimum debt amount to include"),
    sort_by: str = Query("debt_desc", description="Sort by: debt_desc, debt_asc, name, last_payment"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get detailed customer debt report"""
    try:
        # Query customers with debt details
        debt_query = db.query(
            models.Customer.id,
            models.Customer.name,
            models.Customer.phone,
            models.Customer.email,
            models.Customer.current_debt,
            models.Customer.total_purchases,
            func.count(models.Payment.id).label('payment_count'),
            func.sum(models.Payment.amount).label('total_payments'),
            func.max(models.Payment.payment_date).label('last_payment_date'),
            func.count(models.Invoice.id).label('unpaid_invoice_count'),
            func.sum(models.Invoice.remaining_amount).label('total_outstanding')
        ).outerjoin(
            models.Payment, models.Customer.id == models.Payment.customer_id
        ).outerjoin(
            models.Invoice, and_(
                models.Customer.id == models.Invoice.customer_id,
                models.Invoice.remaining_amount > 0,
                models.Invoice.status != 'cancelled'
            )
        ).filter(
            models.Customer.current_debt >= min_debt
        ).group_by(
            models.Customer.id,
            models.Customer.name,
            models.Customer.phone,
            models.Customer.email,
            models.Customer.current_debt,
            models.Customer.total_purchases
        )
        
        # Apply sorting
        if sort_by == "debt_desc":
            debt_query = debt_query.order_by(desc(models.Customer.current_debt))
        elif sort_by == "debt_asc":
            debt_query = debt_query.order_by(asc(models.Customer.current_debt))
        elif sort_by == "name":
            debt_query = debt_query.order_by(asc(models.Customer.name))
        elif sort_by == "last_payment":
            debt_query = debt_query.order_by(desc(func.max(models.Payment.payment_date)))
        
        customers_with_debt = debt_query.all()
        
        # Calculate summary statistics
        total_debt = sum(float(c.current_debt) for c in customers_with_debt)
        total_customers_with_debt = len(customers_with_debt)
        
        # Age analysis of debts
        debt_aging = {
            "current": 0,        # 0-30 days
            "thirty_days": 0,    # 31-60 days
            "sixty_days": 0,     # 61-90 days
            "ninety_days_plus": 0  # 90+ days
        }
        
        debt_details = []
        
        for customer in customers_with_debt:
            current_debt = float(customer.current_debt)
            total_payments = float(customer.total_payments or 0)
            
            # Calculate days since last payment
            days_since_payment = None
            if customer.last_payment_date:
                days_since_payment = (datetime.now().date() - customer.last_payment_date.date()).days
                
                # Categorize debt by age
                if days_since_payment <= 30:
                    debt_aging["current"] += current_debt
                elif days_since_payment <= 60:
                    debt_aging["thirty_days"] += current_debt
                elif days_since_payment <= 90:
                    debt_aging["sixty_days"] += current_debt
                else:
                    debt_aging["ninety_days_plus"] += current_debt
            else:
                debt_aging["ninety_days_plus"] += current_debt
            
            total_lifetime_purchases = float(customer.total_purchases or 0)
            
            debt_details.append({
                "customer_id": str(customer.id),
                "customer_name": customer.name,
                "phone": customer.phone,
                "email": customer.email,
                "current_debt": current_debt,
                "total_lifetime_purchases": total_lifetime_purchases,
                "total_payments": total_payments,
                "payment_count": int(customer.payment_count or 0),
                "last_payment_date": customer.last_payment_date.isoformat() if customer.last_payment_date else None,
                "days_since_last_payment": days_since_payment,
                "unpaid_invoice_count": int(customer.unpaid_invoice_count or 0),
                "debt_to_purchases_ratio": (current_debt / total_lifetime_purchases * 100) if total_lifetime_purchases > 0 else 0,
                "payment_history_score": min(100, (total_payments / max(1, current_debt + total_payments)) * 100)
            })
        
        return {
            "summary": {
                "total_customers_with_debt": total_customers_with_debt,
                "total_outstanding_debt": total_debt,
                "average_debt_per_customer": total_debt / max(1, total_customers_with_debt),
                "min_debt_filter": min_debt
            },
            "debt_aging": debt_aging,
            "customers": debt_details
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating debt report: {str(e)}")

# Chart Data Endpoints for Dashboard Integration

@router.get("/charts/sales-overview")
async def get_sales_overview_chart_data(
    days: int = Query(30, description="Number of days to include"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get chart data for sales overview dashboard"""
    try:
        end_date = date.today()
        start_date = end_date - timedelta(days=days)
        
        # Daily sales data
        daily_sales = db.query(
            func.date(models.Invoice.created_at).label('sale_date'),
            func.sum(models.Invoice.total_amount).label('total_sales'),
            func.sum(models.Invoice.paid_amount).label('total_paid'),
            func.count(models.Invoice.id).label('invoice_count')
        ).filter(
            and_(
                models.Invoice.created_at >= start_date,
                models.Invoice.created_at <= end_date,
                models.Invoice.status != 'cancelled'
            )
        ).group_by(
            func.date(models.Invoice.created_at)
        ).order_by(
            func.date(models.Invoice.created_at)
        ).all()
        
        # Sales by category
        category_sales = db.query(
            models.Category.name.label('category_name'),
            func.sum(models.InvoiceItem.total_price).label('total_sales'),
            func.sum(models.InvoiceItem.quantity).label('total_quantity')
        ).join(
            models.InventoryItem, models.InventoryItem.id == models.InvoiceItem.inventory_item_id
        ).join(
            models.Invoice, models.InvoiceItem.invoice_id == models.Invoice.id
        ).join(
            models.Category, models.InventoryItem.category_id == models.Category.id
        ).filter(
            and_(
                models.Invoice.created_at >= start_date,
                models.Invoice.created_at <= end_date,
                models.Invoice.status != 'cancelled'
            )
        ).group_by(
            models.Category.name
        ).order_by(
            desc(func.sum(models.InvoiceItem.total_price))
        ).all()
        
        return {
            "period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "days": days
            },
            "daily_sales": [
                {
                    "date": sale.sale_date.isoformat(),
                    "total_sales": float(sale.total_sales),
                    "total_paid": float(sale.total_paid),
                    "invoice_count": int(sale.invoice_count)
                }
                for sale in daily_sales
            ],
            "category_sales": [
                {
                    "category": category.category_name,
                    "total_sales": float(category.total_sales),
                    "total_quantity": int(category.total_quantity),
                    "percentage": (float(category.total_sales) / sum(float(c.total_sales) for c in category_sales) * 100) if category_sales else 0
                }
                for category in category_sales
            ]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating sales overview chart data: {str(e)}")

@router.get("/charts/inventory-overview")
async def get_inventory_overview_chart_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get chart data for inventory overview dashboard"""
    try:
        # Inventory by category
        category_inventory = db.query(
            models.Category.name.label('category_name'),
            func.count(models.InventoryItem.id).label('item_count'),
            func.sum(models.InventoryItem.stock_quantity).label('total_stock'),
            func.sum(models.InventoryItem.stock_quantity * models.InventoryItem.purchase_price).label('total_value'),
            func.sum(
                case(
                    (models.InventoryItem.stock_quantity <= models.InventoryItem.min_stock_level, 1),
                    else_=0
                )
            ).label('low_stock_count')
        ).join(
            models.Category, models.InventoryItem.category_id == models.Category.id
        ).filter(
            models.InventoryItem.is_active == True
        ).group_by(
            models.Category.name
        ).order_by(
            desc(func.sum(models.InventoryItem.stock_quantity * models.InventoryItem.purchase_price))
        ).all()
        
        # Stock status distribution
        stock_status = db.query(
            func.sum(
                case(
                    (models.InventoryItem.stock_quantity == 0, 1),
                    else_=0
                )
            ).label('out_of_stock'),
            func.sum(
                case(
                    (and_(
                        models.InventoryItem.stock_quantity > 0,
                        models.InventoryItem.stock_quantity <= models.InventoryItem.min_stock_level
                    ), 1),
                    else_=0
                )
            ).label('low_stock'),
            func.sum(
                case(
                    (models.InventoryItem.stock_quantity > models.InventoryItem.min_stock_level, 1),
                    else_=0
                )
            ).label('in_stock')
        ).filter(
            models.InventoryItem.is_active == True
        ).first()
        
        return {
            "category_breakdown": [
                {
                    "category": category.category_name,
                    "item_count": int(category.item_count),
                    "total_stock": int(category.total_stock),
                    "total_value": float(category.total_value),
                    "low_stock_items": int(category.low_stock_count)
                }
                for category in category_inventory
            ],
            "stock_status": {
                "out_of_stock": int(stock_status.out_of_stock or 0),
                "low_stock": int(stock_status.low_stock or 0),
                "in_stock": int(stock_status.in_stock or 0)
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating inventory overview chart data: {str(e)}")

@router.get("/charts/customer-overview")
async def get_customer_overview_chart_data(
    days: int = Query(30, description="Number of days for recent activity"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get chart data for customer overview dashboard"""
    try:
        end_date = date.today()
        start_date = end_date - timedelta(days=days)
        
        # Customer debt distribution
        debt_distribution = db.query(
            func.sum(
                case(
                    (models.Customer.current_debt == 0, 1),
                    else_=0
                )
            ).label('no_debt'),
            func.sum(
                case(
                    (and_(
                        models.Customer.current_debt > 0,
                        models.Customer.current_debt <= 1000
                    ), 1),
                    else_=0
                )
            ).label('low_debt'),
            func.sum(
                case(
                    (and_(
                        models.Customer.current_debt > 1000,
                        models.Customer.current_debt <= 5000
                    ), 1),
                    else_=0
                )
            ).label('medium_debt'),
            func.sum(
                case(
                    (models.Customer.current_debt > 5000, 1),
                    else_=0
                )
            ).label('high_debt')
        ).first()
        
        # Recent customer activity
        recent_activity = db.query(
            func.date(models.Invoice.created_at).label('activity_date'),
            func.count(func.distinct(models.Customer.id)).label('active_customers'),
            func.sum(models.Invoice.total_amount).label('total_sales')
        ).join(
            models.Customer, models.Invoice.customer_id == models.Customer.id
        ).filter(
            and_(
                models.Invoice.created_at >= start_date,
                models.Invoice.created_at <= end_date,
                models.Invoice.status != 'cancelled'
            )
        ).group_by(
            func.date(models.Invoice.created_at)
        ).order_by(
            func.date(models.Invoice.created_at)
        ).all()
        
        # Top customers by recent purchases
        top_customers = db.query(
            models.Customer.name,
            func.sum(models.Invoice.total_amount).label('recent_purchases'),
            func.count(models.Invoice.id).label('recent_invoices')
        ).join(
            models.Invoice, models.Customer.id == models.Invoice.customer_id
        ).filter(
            and_(
                models.Invoice.created_at >= start_date,
                models.Invoice.created_at <= end_date,
                models.Invoice.status != 'cancelled'
            )
        ).group_by(
            models.Customer.id,
            models.Customer.name
        ).order_by(
            desc(func.sum(models.Invoice.total_amount))
        ).limit(10).all()
        
        return {
            "period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "days": days
            },
            "debt_distribution": {
                "no_debt": int(debt_distribution.no_debt or 0),
                "low_debt": int(debt_distribution.low_debt or 0),
                "medium_debt": int(debt_distribution.medium_debt or 0),
                "high_debt": int(debt_distribution.high_debt or 0)
            },
            "recent_activity": [
                {
                    "date": activity.activity_date.isoformat(),
                    "active_customers": int(activity.active_customers),
                    "total_sales": float(activity.total_sales)
                }
                for activity in recent_activity
            ],
            "top_customers": [
                {
                    "customer_name": customer.name,
                    "recent_purchases": float(customer.recent_purchases),
                    "recent_invoices": int(customer.recent_invoices)
                }
                for customer in top_customers
            ]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating customer overview chart data: {str(e)}")

@router.get("/charts/category-sales")
async def get_category_sales_chart(
    days: int = Query(30, description="Number of days to analyze"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get category sales breakdown for charts"""
    try:
        # Calculate date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        # Query category sales data
        category_sales = db.query(
            models.Category.name.label('category_name'),
            func.sum(models.Invoice.total_amount).label('total_sales'),
            func.sum(models.InvoiceItem.quantity).label('total_quantity')
        ).join(
            models.InvoiceItem, models.Invoice.id == models.InvoiceItem.invoice_id
        ).join(
            models.InventoryItem, models.InvoiceItem.inventory_item_id == models.InventoryItem.id
        ).join(
            models.Category, models.InventoryItem.category_id == models.Category.id
        ).filter(
            models.Invoice.created_at >= start_date,
            models.Invoice.created_at <= end_date,
            models.Invoice.status.in_(['paid', 'partially_paid'])
        ).group_by(
            models.Category.id, models.Category.name
        ).all()
        
        # Calculate total sales for percentage calculation
        total_sales = sum(float(item.total_sales or 0) for item in category_sales)
        
        # Format response data
        formatted_data = []
        for item in category_sales:
            sales_amount = float(item.total_sales or 0)
            percentage = (sales_amount / total_sales * 100) if total_sales > 0 else 0
            
            formatted_data.append({
                "category_name": item.category_name,
                "total_sales": sales_amount,
                "total_quantity": int(item.total_quantity or 0),
                "percentage": round(percentage, 2)
            })
        
        # Sort by total sales descending
        formatted_data.sort(key=lambda x: x['total_sales'], reverse=True)
        
        return formatted_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating category sales chart data: {str(e)}")

@router.get("/summary/daily")
async def get_daily_sales_summary(
    target_date: Optional[date] = Query(None, description="Target date (defaults to today)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get sales summary for a specific day"""
    try:
        if not target_date:
            target_date = date.today()
        
        # Get start and end of the target date
        start_datetime = datetime.combine(target_date, datetime.min.time())
        end_datetime = datetime.combine(target_date, datetime.max.time())
        
        # Get today's sales data
        today_sales = db.query(
            func.sum(models.Invoice.total_amount).label('total_sales'),
            func.sum(models.Invoice.paid_amount).label('total_paid'),
            func.count(models.Invoice.id).label('invoice_count')
        ).filter(
            and_(
                models.Invoice.created_at >= start_datetime,
                models.Invoice.created_at <= end_datetime,
                models.Invoice.status != 'cancelled'
            )
        ).first()
        
        # Get week's sales (last 7 days including today)
        week_start = target_date - timedelta(days=6)
        week_start_datetime = datetime.combine(week_start, datetime.min.time())
        
        week_sales = db.query(
            func.sum(models.Invoice.total_amount).label('total_sales'),
            func.sum(models.Invoice.paid_amount).label('total_paid'),
            func.count(models.Invoice.id).label('invoice_count')
        ).filter(
            and_(
                models.Invoice.created_at >= week_start_datetime,
                models.Invoice.created_at <= end_datetime,
                models.Invoice.status != 'cancelled'
            )
        ).first()
        
        # Get month's sales (last 30 days including today)
        month_start = target_date - timedelta(days=29)
        month_start_datetime = datetime.combine(month_start, datetime.min.time())
        
        month_sales = db.query(
            func.sum(models.Invoice.total_amount).label('total_sales'),
            func.sum(models.Invoice.paid_amount).label('total_paid'),
            func.count(models.Invoice.id).label('invoice_count')
        ).filter(
            and_(
                models.Invoice.created_at >= month_start_datetime,
                models.Invoice.created_at <= end_datetime,
                models.Invoice.status != 'cancelled'
            )
        ).first()
        
        return {
            "date": target_date.isoformat(),
            "today": {
                "total_sales": float(today_sales.total_sales or 0),
                "total_paid": float(today_sales.total_paid or 0),
                "invoice_count": int(today_sales.invoice_count or 0)
            },
            "week": {
                "total_sales": float(week_sales.total_sales or 0),
                "total_paid": float(week_sales.total_paid or 0),
                "invoice_count": int(week_sales.invoice_count or 0)
            },
            "month": {
                "total_sales": float(month_sales.total_sales or 0),
                "total_paid": float(month_sales.total_paid or 0),
                "invoice_count": int(month_sales.invoice_count or 0)
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating daily sales summary: {str(e)}")