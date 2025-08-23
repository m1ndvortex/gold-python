"""
Analytics Data API Endpoints
Provides demand forecasting, cost optimization, and category performance analysis
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import datetime, date, timedelta
from database import get_db
import models
import schemas
from auth import get_current_active_user, require_permission
from services.forecasting_service import ForecastingService
from services.stock_optimization_service import StockOptimizationService
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/analytics-data", tags=["analytics-data"])

@router.get("/demand-forecast", response_model=Dict[str, Any])
async def get_demand_forecast_data(
    item_id: Optional[str] = Query(None, description="Specific item ID for forecast"),
    category_id: Optional[str] = Query(None, description="Category ID for category-wide forecast"),
    periods: int = Query(30, ge=1, le=365, description="Number of periods to forecast"),
    model_type: str = Query("arima", description="Forecasting model type (arima, linear_regression, seasonal)"),
    confidence_level: float = Query(0.95, ge=0.5, le=0.99, description="Confidence level for intervals"),
    include_historical: bool = Query(True, description="Include historical data in response"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("view_reports"))
):
    """Get demand forecasting data with analysis"""
    
    try:
        forecasting_service = ForecastingService(db)
        
        if item_id:
            # Single item forecast
            forecast_result = await forecasting_service.forecast_demand(
                item_id=item_id,
                periods=periods,
                model_type=model_type,
                confidence_level=confidence_level
            )
            
            # Get item details
            item = db.query(models.InventoryItem).filter(models.InventoryItem.id == item_id).first()
            if not item:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Item not found"
                )
            
            result = {
                "forecast_type": "single_item",
                "item": {
                    "id": item.id,
                    "name": item.name,
                    "category": item.category.name if item.category else None,
                    "current_stock": item.stock_quantity,
                    "min_stock_level": item.min_stock_level
                },
                "forecast": forecast_result,
                "generated_at": datetime.utcnow().isoformat()
            }
            
        elif category_id:
            # Category-wide forecast
            category_forecast = await forecasting_service.forecast_category_demand(
                category_id=category_id,
                periods=periods,
                model_type=model_type,
                confidence_level=confidence_level
            )
            
            # Get category details
            category = db.query(models.Category).filter(models.Category.id == category_id).first()
            if not category:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Category not found"
                )
            
            result = {
                "forecast_type": "category",
                "category": {
                    "id": category.id,
                    "name": category.name,
                    "item_count": len(category.inventory_items)
                },
                "forecast": category_forecast,
                "generated_at": datetime.utcnow().isoformat()
            }
            
        else:
            # Overall demand forecast
            overall_forecast = await forecasting_service.forecast_overall_demand(
                periods=periods,
                model_type=model_type,
                confidence_level=confidence_level
            )
            
            result = {
                "forecast_type": "overall",
                "forecast": overall_forecast,
                "generated_at": datetime.utcnow().isoformat()
            }
        
        # Add historical data if requested
        if include_historical:
            historical_data = await forecasting_service.get_historical_demand_data(
                item_id=item_id,
                category_id=category_id,
                days=periods * 2  # Get twice the forecast period for context
            )
            result["historical_data"] = historical_data
        
        return result
        
    except Exception as e:
        logger.error(f"Error getting demand forecast data: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get demand forecast data: {str(e)}"
        )

@router.get("/seasonality-analysis", response_model=Dict[str, Any])
async def get_seasonality_analysis(
    item_id: Optional[str] = Query(None, description="Specific item ID for analysis"),
    category_id: Optional[str] = Query(None, description="Category ID for analysis"),
    analysis_period_days: int = Query(365, ge=90, le=1095, description="Analysis period in days"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("view_reports"))
):
    """Get seasonality analysis for demand patterns"""
    
    try:
        forecasting_service = ForecastingService(db)
        
        # Get seasonality analysis
        seasonality_result = await forecasting_service.analyze_seasonality(
            item_id=item_id,
            category_id=category_id,
            analysis_period_days=analysis_period_days
        )
        
        # Get entity details
        entity_info = {}
        if item_id:
            item = db.query(models.InventoryItem).filter(models.InventoryItem.id == item_id).first()
            if item:
                entity_info = {
                    "type": "item",
                    "id": item.id,
                    "name": item.name,
                    "category": item.category.name if item.category else None
                }
        elif category_id:
            category = db.query(models.Category).filter(models.Category.id == category_id).first()
            if category:
                entity_info = {
                    "type": "category",
                    "id": category.id,
                    "name": category.name,
                    "item_count": len(category.inventory_items)
                }
        else:
            entity_info = {"type": "overall", "name": "All Items"}
        
        result = {
            "entity": entity_info,
            "seasonality": seasonality_result,
            "analysis_period_days": analysis_period_days,
            "analyzed_at": datetime.utcnow().isoformat()
        }
        
        return result
        
    except Exception as e:
        logger.error(f"Error getting seasonality analysis: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get seasonality analysis: {str(e)}"
        )

@router.get("/cost-optimization", response_model=Dict[str, Any])
async def get_cost_optimization_analysis(
    item_id: Optional[str] = Query(None, description="Specific item ID for optimization"),
    category_id: Optional[str] = Query(None, description="Category ID for optimization"),
    optimization_type: str = Query("all", description="Type of optimization (all, carrying_cost, ordering_cost, stockout_cost)"),
    service_level: float = Query(0.95, ge=0.8, le=0.99, description="Target service level"),
    include_recommendations: bool = Query(True, description="Include optimization recommendations"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("view_reports"))
):
    """Get cost optimization analysis with detailed breakdowns"""
    
    try:
        optimization_service = StockOptimizationService(db)
        
        if item_id:
            # Single item optimization
            optimization_result = await optimization_service.optimize_single_item(
                item_id=item_id,
                service_level=service_level,
                optimization_type=optimization_type
            )
            
            # Get item details
            item = db.query(models.InventoryItem).filter(models.InventoryItem.id == item_id).first()
            if not item:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Item not found"
                )
            
            result = {
                "optimization_type": "single_item",
                "item": {
                    "id": item.id,
                    "name": item.name,
                    "category": item.category.name if item.category else None,
                    "current_stock": item.stock_quantity,
                    "purchase_price": float(item.purchase_price),
                    "sell_price": float(item.sell_price)
                },
                "optimization": optimization_result
            }
            
        elif category_id:
            # Category optimization
            category_optimization = await optimization_service.optimize_category(
                category_id=category_id,
                service_level=service_level,
                optimization_type=optimization_type
            )
            
            # Get category details
            category = db.query(models.Category).filter(models.Category.id == category_id).first()
            if not category:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Category not found"
                )
            
            result = {
                "optimization_type": "category",
                "category": {
                    "id": category.id,
                    "name": category.name,
                    "item_count": len(category.inventory_items)
                },
                "optimization": category_optimization
            }
            
        else:
            # Overall optimization
            overall_optimization = await optimization_service.optimize_overall_inventory(
                service_level=service_level,
                optimization_type=optimization_type
            )
            
            result = {
                "optimization_type": "overall",
                "optimization": overall_optimization
            }
        
        # Add recommendations if requested
        if include_recommendations:
            recommendations = await optimization_service.generate_optimization_recommendations(
                optimization_result if item_id else category_optimization if category_id else overall_optimization
            )
            result["recommendations"] = recommendations
        
        result.update({
            "service_level": service_level,
            "optimization_scope": optimization_type,
            "generated_at": datetime.utcnow().isoformat()
        })
        
        return result
        
    except Exception as e:
        logger.error(f"Error getting cost optimization analysis: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get cost optimization analysis: {str(e)}"
        )

@router.get("/category-performance", response_model=Dict[str, Any])
async def get_category_performance_analysis(
    start_date: Optional[date] = Query(None, description="Start date for analysis"),
    end_date: Optional[date] = Query(None, description="End date for analysis"),
    category_id: Optional[str] = Query(None, description="Specific category ID"),
    include_trends: bool = Query(True, description="Include trend analysis"),
    include_comparisons: bool = Query(True, description="Include category comparisons"),
    performance_metrics: str = Query("all", description="Metrics to include (all, sales, profit, turnover, growth)"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("view_reports"))
):
    """Get category performance analysis with trend data"""
    
    # Default to last 90 days if no date range provided
    if not end_date:
        end_date = date.today()
    if not start_date:
        start_date = end_date - timedelta(days=90)
    
    try:
        # Parse performance metrics
        metric_list = [m.strip() for m in performance_metrics.split(",")]
        
        if category_id:
            # Single category analysis
            category = db.query(models.Category).filter(models.Category.id == category_id).first()
            if not category:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Category not found"
                )
            
            performance_data = await analyze_single_category_performance(
                db, category, start_date, end_date, metric_list, include_trends
            )
            
            result = {
                "analysis_type": "single_category",
                "category": {
                    "id": category.id,
                    "name": category.name,
                    "item_count": len(category.inventory_items)
                },
                "performance": performance_data
            }
            
        else:
            # All categories analysis
            categories = db.query(models.Category).all()
            
            category_performances = []
            for category in categories:
                performance_data = await analyze_single_category_performance(
                    db, category, start_date, end_date, metric_list, include_trends
                )
                
                category_performances.append({
                    "category": {
                        "id": category.id,
                        "name": category.name,
                        "item_count": len(category.inventory_items)
                    },
                    "performance": performance_data
                })
            
            # Sort by total revenue
            category_performances.sort(
                key=lambda x: x["performance"].get("sales_metrics", {}).get("total_revenue", 0),
                reverse=True
            )
            
            result = {
                "analysis_type": "all_categories",
                "categories": category_performances
            }
            
            # Add category comparisons if requested
            if include_comparisons:
                comparisons = generate_category_comparisons(category_performances)
                result["comparisons"] = comparisons
        
        result.update({
            "period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "days": (end_date - start_date).days + 1
            },
            "metrics_included": metric_list,
            "include_trends": include_trends,
            "analyzed_at": datetime.utcnow().isoformat()
        })
        
        return result
        
    except Exception as e:
        logger.error(f"Error getting category performance analysis: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get category performance analysis: {str(e)}"
        )

@router.get("/fast-slow-movers", response_model=Dict[str, Any])
async def get_fast_slow_movers_analysis(
    start_date: Optional[date] = Query(None, description="Start date for analysis"),
    end_date: Optional[date] = Query(None, description="End date for analysis"),
    category_id: Optional[str] = Query(None, description="Filter by category"),
    limit: int = Query(20, ge=5, le=100, description="Number of items to return per category"),
    velocity_threshold: float = Query(2.0, ge=0.1, le=10.0, description="Velocity threshold for classification"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("view_reports"))
):
    """Identify fast-moving and slow-moving items with detailed analysis"""
    
    # Default to last 90 days if no date range provided
    if not end_date:
        end_date = date.today()
    if not start_date:
        start_date = end_date - timedelta(days=90)
    
    try:
        # Get item velocity analysis
        velocity_analysis = await analyze_item_velocities(
            db, start_date, end_date, category_id, velocity_threshold
        )
        
        # Classify items
        fast_movers = [item for item in velocity_analysis if item["velocity"] >= velocity_threshold]
        slow_movers = [item for item in velocity_analysis if item["velocity"] < velocity_threshold]
        dead_stock = [item for item in velocity_analysis if item["velocity"] == 0]
        
        # Sort and limit results
        fast_movers.sort(key=lambda x: x["velocity"], reverse=True)
        slow_movers.sort(key=lambda x: x["velocity"])
        dead_stock.sort(key=lambda x: x["stock_value"], reverse=True)
        
        result = {
            "fast_movers": fast_movers[:limit],
            "slow_movers": slow_movers[:limit],
            "dead_stock": dead_stock[:limit],
            "summary": {
                "total_items_analyzed": len(velocity_analysis),
                "fast_movers_count": len(fast_movers),
                "slow_movers_count": len(slow_movers),
                "dead_stock_count": len(dead_stock),
                "velocity_threshold": velocity_threshold
            },
            "period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "days": (end_date - start_date).days + 1
            },
            "category_filter": category_id,
            "analyzed_at": datetime.utcnow().isoformat()
        }
        
        return result
        
    except Exception as e:
        logger.error(f"Error getting fast/slow movers analysis: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get fast/slow movers analysis: {str(e)}"
        )

@router.get("/cross-selling-opportunities", response_model=Dict[str, Any])
async def get_cross_selling_opportunities(
    start_date: Optional[date] = Query(None, description="Start date for analysis"),
    end_date: Optional[date] = Query(None, description="End date for analysis"),
    min_support: float = Query(0.01, ge=0.001, le=0.1, description="Minimum support for association rules"),
    min_confidence: float = Query(0.3, ge=0.1, le=0.9, description="Minimum confidence for association rules"),
    max_recommendations: int = Query(10, ge=5, le=50, description="Maximum recommendations to return"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("view_reports"))
):
    """Analyze cross-selling opportunities using market basket analysis"""
    
    # Default to last 180 days if no date range provided
    if not end_date:
        end_date = date.today()
    if not start_date:
        start_date = end_date - timedelta(days=180)
    
    try:
        # Perform market basket analysis
        cross_selling_analysis = await perform_market_basket_analysis(
            db, start_date, end_date, min_support, min_confidence
        )
        
        # Generate product bundle recommendations
        bundle_recommendations = await generate_bundle_recommendations(
            db, cross_selling_analysis, max_recommendations
        )
        
        # Calculate potential revenue impact
        revenue_impact = await calculate_cross_selling_revenue_impact(
            db, bundle_recommendations, start_date, end_date
        )
        
        result = {
            "cross_selling_rules": cross_selling_analysis[:max_recommendations],
            "bundle_recommendations": bundle_recommendations,
            "revenue_impact": revenue_impact,
            "analysis_parameters": {
                "min_support": min_support,
                "min_confidence": min_confidence,
                "max_recommendations": max_recommendations
            },
            "period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "days": (end_date - start_date).days + 1
            },
            "analyzed_at": datetime.utcnow().isoformat()
        }
        
        return result
        
    except Exception as e:
        logger.error(f"Error getting cross-selling opportunities: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get cross-selling opportunities: {str(e)}"
        )

# Helper functions
async def analyze_single_category_performance(
    db: Session, 
    category: models.Category, 
    start_date: date, 
    end_date: date, 
    metrics: List[str],
    include_trends: bool
) -> Dict[str, Any]:
    """Analyze performance for a single category"""
    
    from sqlalchemy import text
    
    performance_data = {}
    
    if "all" in metrics or "sales" in metrics:
        # Sales metrics
        sales_query = text("""
            SELECT 
                COUNT(DISTINCT i.id) as transaction_count,
                SUM(ii.quantity) as total_units_sold,
                SUM(ii.total_price) as total_revenue,
                AVG(ii.total_price) as avg_transaction_value
            FROM invoice_items ii
            JOIN invoices i ON ii.invoice_id = i.id
            JOIN inventory_items item ON ii.inventory_item_id = item.id
            WHERE item.category_id = :category_id
            AND DATE(i.created_at) BETWEEN :start_date AND :end_date
            AND i.status IN ('completed', 'paid', 'partially_paid')
        """)
        
        sales_result = db.execute(sales_query, {
            "category_id": category.id,
            "start_date": start_date,
            "end_date": end_date
        }).fetchone()
        
        performance_data["sales_metrics"] = {
            "transaction_count": sales_result.transaction_count or 0,
            "total_units_sold": sales_result.total_units_sold or 0,
            "total_revenue": float(sales_result.total_revenue or 0),
            "avg_transaction_value": float(sales_result.avg_transaction_value or 0)
        }
    
    if "all" in metrics or "profit" in metrics:
        # Profit metrics
        profit_query = text("""
            SELECT 
                SUM(ii.total_price) as total_revenue,
                SUM(ii.quantity * item.purchase_price) as total_cost,
                SUM(ii.total_price - (ii.quantity * item.purchase_price)) as total_profit
            FROM invoice_items ii
            JOIN invoices i ON ii.invoice_id = i.id
            JOIN inventory_items item ON ii.inventory_item_id = item.id
            WHERE item.category_id = :category_id
            AND DATE(i.created_at) BETWEEN :start_date AND :end_date
            AND i.status IN ('completed', 'paid', 'partially_paid')
        """)
        
        profit_result = db.execute(profit_query, {
            "category_id": category.id,
            "start_date": start_date,
            "end_date": end_date
        }).fetchone()
        
        total_revenue = float(profit_result.total_revenue or 0)
        total_cost = float(profit_result.total_cost or 0)
        total_profit = float(profit_result.total_profit or 0)
        
        profit_margin = (total_profit / total_revenue * 100) if total_revenue > 0 else 0
        markup = (total_profit / total_cost * 100) if total_cost > 0 else 0
        
        performance_data["profit_metrics"] = {
            "total_revenue": total_revenue,
            "total_cost": total_cost,
            "total_profit": total_profit,
            "profit_margin": round(profit_margin, 2),
            "markup_percentage": round(markup, 2)
        }
    
    if "all" in metrics or "turnover" in metrics:
        # Inventory turnover
        avg_inventory_query = text("""
            SELECT AVG(stock_quantity * purchase_price) as avg_inventory_value
            FROM inventory_items
            WHERE category_id = :category_id AND is_active = true
        """)
        
        avg_inventory_result = db.execute(avg_inventory_query, {
            "category_id": category.id
        }).fetchone()
        
        avg_inventory_value = float(avg_inventory_result.avg_inventory_value or 1)
        cogs = total_cost if "profit" in performance_data else 0
        
        turnover_rate = (cogs / avg_inventory_value) if avg_inventory_value > 0 else 0
        
        performance_data["turnover_metrics"] = {
            "avg_inventory_value": avg_inventory_value,
            "turnover_rate": round(turnover_rate, 2),
            "days_in_inventory": round(365 / turnover_rate, 1) if turnover_rate > 0 else 0
        }
    
    if include_trends and ("all" in metrics or "growth" in metrics):
        # Growth trends (compare with previous period)
        period_days = (end_date - start_date).days + 1
        prev_start = start_date - timedelta(days=period_days)
        prev_end = start_date - timedelta(days=1)
        
        prev_performance = await analyze_single_category_performance(
            db, category, prev_start, prev_end, ["sales", "profit"], False
        )
        
        # Calculate growth rates
        current_revenue = performance_data.get("sales_metrics", {}).get("total_revenue", 0)
        prev_revenue = prev_performance.get("sales_metrics", {}).get("total_revenue", 0)
        
        revenue_growth = ((current_revenue - prev_revenue) / prev_revenue * 100) if prev_revenue > 0 else 0
        
        performance_data["growth_metrics"] = {
            "revenue_growth_percent": round(revenue_growth, 2),
            "trend_direction": "up" if revenue_growth > 5 else "down" if revenue_growth < -5 else "stable",
            "comparison_period": f"{prev_start.isoformat()} to {prev_end.isoformat()}"
        }
    
    return performance_data

def generate_category_comparisons(category_performances: List[Dict]) -> Dict[str, Any]:
    """Generate comparisons between categories"""
    
    if len(category_performances) < 2:
        return {"message": "Insufficient categories for comparison"}
    
    # Find top performers
    top_revenue = max(category_performances, key=lambda x: x["performance"].get("sales_metrics", {}).get("total_revenue", 0))
    top_profit_margin = max(category_performances, key=lambda x: x["performance"].get("profit_metrics", {}).get("profit_margin", 0))
    top_turnover = max(category_performances, key=lambda x: x["performance"].get("turnover_metrics", {}).get("turnover_rate", 0))
    
    # Calculate averages
    total_revenue = sum(cat["performance"].get("sales_metrics", {}).get("total_revenue", 0) for cat in category_performances)
    avg_profit_margin = sum(cat["performance"].get("profit_metrics", {}).get("profit_margin", 0) for cat in category_performances) / len(category_performances)
    avg_turnover = sum(cat["performance"].get("turnover_metrics", {}).get("turnover_rate", 0) for cat in category_performances) / len(category_performances)
    
    return {
        "top_performers": {
            "highest_revenue": {
                "category": top_revenue["category"]["name"],
                "revenue": top_revenue["performance"].get("sales_metrics", {}).get("total_revenue", 0)
            },
            "highest_profit_margin": {
                "category": top_profit_margin["category"]["name"],
                "profit_margin": top_profit_margin["performance"].get("profit_metrics", {}).get("profit_margin", 0)
            },
            "highest_turnover": {
                "category": top_turnover["category"]["name"],
                "turnover_rate": top_turnover["performance"].get("turnover_metrics", {}).get("turnover_rate", 0)
            }
        },
        "averages": {
            "total_revenue": round(total_revenue, 2),
            "avg_profit_margin": round(avg_profit_margin, 2),
            "avg_turnover_rate": round(avg_turnover, 2)
        },
        "category_count": len(category_performances)
    }

async def analyze_item_velocities(
    db: Session, 
    start_date: date, 
    end_date: date, 
    category_id: Optional[str],
    velocity_threshold: float
) -> List[Dict[str, Any]]:
    """Analyze item velocities for fast/slow mover classification"""
    
    from sqlalchemy import text
    
    # Build query with optional category filter
    category_filter = "AND item.category_id = :category_id" if category_id else ""
    
    velocity_query = text(f"""
        SELECT 
            item.id,
            item.name,
            item.stock_quantity,
            item.purchase_price,
            item.sell_price,
            cat.name as category_name,
            COALESCE(SUM(ii.quantity), 0) as total_sold,
            COALESCE(SUM(ii.total_price), 0) as total_revenue,
            (item.stock_quantity * item.sell_price) as stock_value,
            CASE 
                WHEN item.stock_quantity > 0 THEN 
                    COALESCE(SUM(ii.quantity), 0)::float / item.stock_quantity
                ELSE 0 
            END as velocity
        FROM inventory_items item
        LEFT JOIN categories cat ON item.category_id = cat.id
        LEFT JOIN invoice_items ii ON item.id = ii.inventory_item_id
        LEFT JOIN invoices i ON ii.invoice_id = i.id 
            AND DATE(i.created_at) BETWEEN :start_date AND :end_date
            AND i.status IN ('completed', 'paid', 'partially_paid')
        WHERE item.is_active = true {category_filter}
        GROUP BY item.id, item.name, item.stock_quantity, item.purchase_price, 
                 item.sell_price, cat.name
        ORDER BY velocity DESC
    """)
    
    params = {
        "start_date": start_date,
        "end_date": end_date
    }
    if category_id:
        params["category_id"] = category_id
    
    results = db.execute(velocity_query, params).fetchall()
    
    velocity_analysis = []
    for row in results:
        velocity_analysis.append({
            "item_id": row.id,
            "item_name": row.name,
            "category": row.category_name,
            "current_stock": row.stock_quantity,
            "purchase_price": float(row.purchase_price),
            "sell_price": float(row.sell_price),
            "total_sold": row.total_sold,
            "total_revenue": float(row.total_revenue),
            "stock_value": float(row.stock_value),
            "velocity": round(float(row.velocity), 3),
            "classification": "fast" if row.velocity >= velocity_threshold else "slow" if row.velocity > 0 else "dead"
        })
    
    return velocity_analysis

async def perform_market_basket_analysis(
    db: Session,
    start_date: date,
    end_date: date,
    min_support: float,
    min_confidence: float
) -> List[Dict[str, Any]]:
    """Perform market basket analysis for cross-selling opportunities"""
    
    from sqlalchemy import text
    from collections import defaultdict
    
    # Get transaction data
    transaction_query = text("""
        SELECT 
            i.id as invoice_id,
            item.id as item_id,
            item.name as item_name,
            ii.quantity
        FROM invoices i
        JOIN invoice_items ii ON i.id = ii.invoice_id
        JOIN inventory_items item ON ii.inventory_item_id = item.id
        WHERE DATE(i.created_at) BETWEEN :start_date AND :end_date
        AND i.status IN ('completed', 'paid', 'partially_paid')
        ORDER BY i.id, item.name
    """)
    
    results = db.execute(transaction_query, {
        "start_date": start_date,
        "end_date": end_date
    }).fetchall()
    
    # Group by transaction
    transactions = defaultdict(list)
    for row in results:
        transactions[row.invoice_id].append({
            "item_id": row.item_id,
            "item_name": row.item_name,
            "quantity": row.quantity
        })
    
    # Calculate item frequencies
    item_counts = defaultdict(int)
    total_transactions = len(transactions)
    
    for transaction_items in transactions.values():
        unique_items = set(item["item_id"] for item in transaction_items)
        for item_id in unique_items:
            item_counts[item_id] += 1
    
    # Find frequent items (meet minimum support)
    frequent_items = {
        item_id: count for item_id, count in item_counts.items()
        if count / total_transactions >= min_support
    }
    
    # Generate association rules
    association_rules = []
    
    for transaction_items in transactions.values():
        transaction_item_ids = set(item["item_id"] for item in transaction_items)
        frequent_transaction_items = transaction_item_ids.intersection(frequent_items.keys())
        
        # Generate pairs
        frequent_list = list(frequent_transaction_items)
        for i in range(len(frequent_list)):
            for j in range(i + 1, len(frequent_list)):
                item_a = frequent_list[i]
                item_b = frequent_list[j]
                
                # Count co-occurrences
                if (item_a, item_b) not in [(rule["antecedent_id"], rule["consequent_id"]) for rule in association_rules]:
                    # Calculate support and confidence
                    cooccurrence_count = sum(
                        1 for trans_items in transactions.values()
                        if item_a in [item["item_id"] for item in trans_items] and 
                           item_b in [item["item_id"] for item in trans_items]
                    )
                    
                    support = cooccurrence_count / total_transactions
                    confidence_a_to_b = cooccurrence_count / item_counts[item_a]
                    confidence_b_to_a = cooccurrence_count / item_counts[item_b]
                    
                    # Get item names
                    item_a_name = next(item["item_name"] for trans in transactions.values() 
                                     for item in trans if item["item_id"] == item_a)
                    item_b_name = next(item["item_name"] for trans in transactions.values() 
                                     for item in trans if item["item_id"] == item_b)
                    
                    if confidence_a_to_b >= min_confidence:
                        association_rules.append({
                            "antecedent_id": item_a,
                            "antecedent_name": item_a_name,
                            "consequent_id": item_b,
                            "consequent_name": item_b_name,
                            "support": round(support, 4),
                            "confidence": round(confidence_a_to_b, 4),
                            "lift": round((cooccurrence_count / total_transactions) / 
                                        ((item_counts[item_a] / total_transactions) * 
                                         (item_counts[item_b] / total_transactions)), 4)
                        })
                    
                    if confidence_b_to_a >= min_confidence:
                        association_rules.append({
                            "antecedent_id": item_b,
                            "antecedent_name": item_b_name,
                            "consequent_id": item_a,
                            "consequent_name": item_a_name,
                            "support": round(support, 4),
                            "confidence": round(confidence_b_to_a, 4),
                            "lift": round((cooccurrence_count / total_transactions) / 
                                        ((item_counts[item_b] / total_transactions) * 
                                         (item_counts[item_a] / total_transactions)), 4)
                        })
    
    # Sort by confidence and lift
    association_rules.sort(key=lambda x: (x["confidence"], x["lift"]), reverse=True)
    
    return association_rules

async def generate_bundle_recommendations(
    db: Session,
    association_rules: List[Dict[str, Any]],
    max_recommendations: int
) -> List[Dict[str, Any]]:
    """Generate product bundle recommendations based on association rules"""
    
    bundle_recommendations = []
    
    # Group rules by antecedent to create bundles
    antecedent_groups = defaultdict(list)
    for rule in association_rules:
        antecedent_groups[rule["antecedent_id"]].append(rule)
    
    for antecedent_id, rules in antecedent_groups.items():
        if len(rules) >= 1:  # At least one strong association
            # Get antecedent item details
            antecedent_item = db.query(models.InventoryItem).filter(
                models.InventoryItem.id == antecedent_id
            ).first()
            
            if antecedent_item:
                # Create bundle recommendation
                bundle_items = [rules[0]["consequent_id"]]  # Start with strongest association
                bundle_names = [rules[0]["consequent_name"]]
                total_confidence = rules[0]["confidence"]
                
                # Add more items if they have good associations
                for rule in rules[1:3]:  # Max 3 additional items
                    if rule["confidence"] >= 0.3:  # Minimum confidence threshold
                        bundle_items.append(rule["consequent_id"])
                        bundle_names.append(rule["consequent_name"])
                        total_confidence += rule["confidence"]
                
                # Calculate bundle metrics
                bundle_price = float(antecedent_item.sell_price)
                for item_id in bundle_items:
                    item = db.query(models.InventoryItem).filter(
                        models.InventoryItem.id == item_id
                    ).first()
                    if item:
                        bundle_price += float(item.sell_price)
                
                # Suggest discount
                suggested_discount = min(0.15, total_confidence / len(bundle_items) * 0.2)  # Max 15% discount
                discounted_price = bundle_price * (1 - suggested_discount)
                
                bundle_recommendations.append({
                    "anchor_item": {
                        "id": antecedent_item.id,
                        "name": antecedent_item.name,
                        "price": float(antecedent_item.sell_price)
                    },
                    "bundle_items": [
                        {"id": item_id, "name": name} 
                        for item_id, name in zip(bundle_items, bundle_names)
                    ],
                    "bundle_metrics": {
                        "total_items": len(bundle_items) + 1,
                        "original_price": round(bundle_price, 2),
                        "suggested_discount_percent": round(suggested_discount * 100, 1),
                        "discounted_price": round(discounted_price, 2),
                        "avg_confidence": round(total_confidence / len(bundle_items), 3)
                    }
                })
    
    # Sort by average confidence and return top recommendations
    bundle_recommendations.sort(
        key=lambda x: x["bundle_metrics"]["avg_confidence"], 
        reverse=True
    )
    
    return bundle_recommendations[:max_recommendations]

async def calculate_cross_selling_revenue_impact(
    db: Session,
    bundle_recommendations: List[Dict[str, Any]],
    start_date: date,
    end_date: date
) -> Dict[str, Any]:
    """Calculate potential revenue impact of cross-selling recommendations"""
    
    from sqlalchemy import text
    
    total_potential_revenue = 0
    total_additional_revenue = 0
    
    for bundle in bundle_recommendations:
        anchor_item_id = bundle["anchor_item"]["id"]
        
        # Get historical sales of anchor item
        anchor_sales_query = text("""
            SELECT COUNT(*) as sales_count
            FROM invoice_items ii
            JOIN invoices i ON ii.invoice_id = i.id
            WHERE ii.inventory_item_id = :item_id
            AND DATE(i.created_at) BETWEEN :start_date AND :end_date
            AND i.status IN ('completed', 'paid', 'partially_paid')
        """)
        
        anchor_sales = db.execute(anchor_sales_query, {
            "item_id": anchor_item_id,
            "start_date": start_date,
            "end_date": end_date
        }).scalar() or 0
        
        if anchor_sales > 0:
            # Estimate bundle adoption rate (conservative estimate)
            estimated_adoption_rate = min(0.3, bundle["bundle_metrics"]["avg_confidence"])
            estimated_bundle_sales = anchor_sales * estimated_adoption_rate
            
            # Calculate revenue impact
            bundle_revenue = bundle["bundle_metrics"]["discounted_price"] * estimated_bundle_sales
            anchor_only_revenue = bundle["anchor_item"]["price"] * estimated_bundle_sales
            additional_revenue = bundle_revenue - anchor_only_revenue
            
            total_potential_revenue += bundle_revenue
            total_additional_revenue += additional_revenue
    
    return {
        "total_potential_revenue": round(total_potential_revenue, 2),
        "total_additional_revenue": round(total_additional_revenue, 2),
        "revenue_uplift_percent": round(
            (total_additional_revenue / (total_potential_revenue - total_additional_revenue) * 100)
            if total_potential_revenue > total_additional_revenue else 0, 2
        ),
        "bundle_count": len(bundle_recommendations),
        "analysis_period_days": (end_date - start_date).days + 1
    }