"""
Analytics Service for Advanced Analytics & Business Intelligence
Provides core analytics functionality including KPI calculations, caching, and data processing
"""

from sqlalchemy.orm import Session
from sqlalchemy import text, func
from typing import Dict, List, Optional, Any
from datetime import datetime, date, timedelta
from decimal import Decimal
import json

from ..models import (
    KPISnapshot, DemandForecast, CustomReport, AnalyticsCache,
    StockOptimizationRecommendation, CostAnalysis, CategoryPerformance,
    PerformanceMetric, Invoice, InventoryItem, Customer, Category
)
from ..redis_config import get_analytics_cache

class AnalyticsService:
    """Core analytics service for KPI calculations and data processing"""
    
    def __init__(self, db: Session):
        self.db = db
        self.cache = get_analytics_cache()
    
    async def calculate_financial_kpis(self, period_start: date, period_end: date) -> Dict[str, Any]:
        """Calculate financial KPIs for the specified period"""
        
        # Check cache first
        cache_key = f"financial_kpis_{period_start}_{period_end}"
        cached_data = await self.cache.get_kpi_data("financial", "summary", period=cache_key)
        
        if cached_data:
            return cached_data["data"]
        
        try:
            # Calculate revenue metrics
            revenue_query = text("""
                SELECT 
                    COALESCE(SUM(total_amount), 0) as total_revenue,
                    COALESCE(SUM(paid_amount), 0) as total_paid,
                    COALESCE(SUM(remaining_amount), 0) as total_outstanding,
                    COUNT(*) as transaction_count,
                    COALESCE(AVG(total_amount), 0) as avg_transaction_value
                FROM invoices 
                WHERE DATE(created_at) BETWEEN :start_date AND :end_date
                AND status != 'cancelled'
            """)
            
            revenue_result = self.db.execute(revenue_query, {
                "start_date": period_start,
                "end_date": period_end
            }).fetchone()
            
            # Calculate profit margins (simplified calculation)
            profit_query = text("""
                SELECT 
                    COALESCE(SUM(ii.total_price), 0) as total_sales,
                    COALESCE(SUM(ii.quantity * item.purchase_price), 0) as total_cost
                FROM invoice_items ii
                JOIN invoices i ON ii.invoice_id = i.id
                JOIN inventory_items item ON ii.inventory_item_id = item.id
                WHERE DATE(i.created_at) BETWEEN :start_date AND :end_date
                AND i.status != 'cancelled'
            """)
            
            profit_result = self.db.execute(profit_query, {
                "start_date": period_start,
                "end_date": period_end
            }).fetchone()
            
            # Calculate KPIs
            total_revenue = float(revenue_result.total_revenue or 0)
            total_cost = float(profit_result.total_cost or 0)
            gross_profit = total_revenue - total_cost
            profit_margin = (gross_profit / total_revenue * 100) if total_revenue > 0 else 0
            
            kpis = {
                "total_revenue": total_revenue,
                "total_paid": float(revenue_result.total_paid or 0),
                "total_outstanding": float(revenue_result.total_outstanding or 0),
                "transaction_count": revenue_result.transaction_count or 0,
                "avg_transaction_value": float(revenue_result.avg_transaction_value or 0),
                "gross_profit": gross_profit,
                "profit_margin": round(profit_margin, 2),
                "period_start": period_start.isoformat(),
                "period_end": period_end.isoformat(),
                "calculated_at": datetime.utcnow().isoformat()
            }
            
            # Cache the results
            await self.cache.set_kpi_data("financial", "summary", kpis, ttl=300, period=cache_key)
            
            return kpis
            
        except Exception as e:
            print(f"Error calculating financial KPIs: {e}")
            return {}
    
    async def calculate_operational_kpis(self, period_start: date, period_end: date) -> Dict[str, Any]:
        """Calculate operational KPIs for inventory and operations"""
        
        cache_key = f"operational_kpis_{period_start}_{period_end}"
        cached_data = await self.cache.get_kpi_data("operational", "summary", period=cache_key)
        
        if cached_data:
            return cached_data["data"]
        
        try:
            # Inventory turnover calculation
            turnover_query = text("""
                SELECT 
                    COUNT(DISTINCT ii.inventory_item_id) as active_items,
                    COALESCE(SUM(ii.quantity), 0) as total_units_sold,
                    COALESCE(AVG(item.stock_quantity), 0) as avg_stock_level
                FROM invoice_items ii
                JOIN invoices i ON ii.invoice_id = i.id
                JOIN inventory_items item ON ii.inventory_item_id = item.id
                WHERE DATE(i.created_at) BETWEEN :start_date AND :end_date
                AND i.status != 'cancelled'
                AND item.is_active = true
            """)
            
            turnover_result = self.db.execute(turnover_query, {
                "start_date": period_start,
                "end_date": period_end
            }).fetchone()
            
            # Stock levels and alerts
            stock_query = text("""
                SELECT 
                    COUNT(*) as total_items,
                    COUNT(CASE WHEN stock_quantity <= min_stock_level THEN 1 END) as low_stock_items,
                    COUNT(CASE WHEN stock_quantity = 0 THEN 1 END) as out_of_stock_items,
                    COALESCE(SUM(stock_quantity * purchase_price), 0) as total_inventory_value
                FROM inventory_items 
                WHERE is_active = true
            """)
            
            stock_result = self.db.execute(stock_query).fetchone()
            
            # Calculate metrics
            total_units_sold = turnover_result.total_units_sold or 0
            avg_stock_level = float(turnover_result.avg_stock_level or 0)
            inventory_turnover = (total_units_sold / avg_stock_level) if avg_stock_level > 0 else 0
            
            total_items = stock_result.total_items or 0
            stockout_frequency = ((stock_result.out_of_stock_items or 0) / total_items * 100) if total_items > 0 else 0
            low_stock_percentage = ((stock_result.low_stock_items or 0) / total_items * 100) if total_items > 0 else 0
            
            kpis = {
                "inventory_turnover": round(inventory_turnover, 2),
                "stockout_frequency": round(stockout_frequency, 2),
                "low_stock_percentage": round(low_stock_percentage, 2),
                "total_inventory_value": float(stock_result.total_inventory_value or 0),
                "active_items": turnover_result.active_items or 0,
                "total_units_sold": total_units_sold,
                "out_of_stock_items": stock_result.out_of_stock_items or 0,
                "low_stock_items": stock_result.low_stock_items or 0,
                "period_start": period_start.isoformat(),
                "period_end": period_end.isoformat(),
                "calculated_at": datetime.utcnow().isoformat()
            }
            
            # Cache the results
            await self.cache.set_kpi_data("operational", "summary", kpis, ttl=300, period=cache_key)
            
            return kpis
            
        except Exception as e:
            print(f"Error calculating operational KPIs: {e}")
            return {}
    
    async def calculate_customer_kpis(self, period_start: date, period_end: date) -> Dict[str, Any]:
        """Calculate customer-related KPIs"""
        
        cache_key = f"customer_kpis_{period_start}_{period_end}"
        cached_data = await self.cache.get_kpi_data("customer", "summary", period=cache_key)
        
        if cached_data:
            return cached_data["data"]
        
        try:
            # Customer acquisition and retention
            customer_query = text("""
                SELECT 
                    COUNT(DISTINCT c.id) as total_customers,
                    COUNT(DISTINCT CASE WHEN DATE(c.created_at) BETWEEN :start_date AND :end_date THEN c.id END) as new_customers,
                    COUNT(DISTINCT CASE WHEN i.customer_id IS NOT NULL THEN i.customer_id END) as active_customers,
                    COALESCE(AVG(c.total_purchases), 0) as avg_customer_value,
                    COALESCE(SUM(c.current_debt), 0) as total_customer_debt
                FROM customers c
                LEFT JOIN invoices i ON c.id = i.customer_id 
                    AND DATE(i.created_at) BETWEEN :start_date AND :end_date
                    AND i.status != 'cancelled'
                WHERE c.is_active = true
            """)
            
            customer_result = self.db.execute(customer_query, {
                "start_date": period_start,
                "end_date": period_end
            }).fetchone()
            
            # Transaction analysis
            transaction_query = text("""
                SELECT 
                    COUNT(*) as total_transactions,
                    COUNT(DISTINCT customer_id) as unique_customers,
                    COALESCE(AVG(total_amount), 0) as avg_transaction_value
                FROM invoices 
                WHERE DATE(created_at) BETWEEN :start_date AND :end_date
                AND status != 'cancelled'
                AND customer_id IS NOT NULL
            """)
            
            transaction_result = self.db.execute(transaction_query, {
                "start_date": period_start,
                "end_date": period_end
            }).fetchone()
            
            # Calculate metrics
            total_customers = customer_result.total_customers or 0
            new_customers = customer_result.new_customers or 0
            active_customers = customer_result.active_customers or 0
            
            acquisition_rate = (new_customers / total_customers * 100) if total_customers > 0 else 0
            retention_rate = (active_customers / total_customers * 100) if total_customers > 0 else 0
            
            unique_customers = transaction_result.unique_customers or 0
            total_transactions = transaction_result.total_transactions or 0
            avg_transactions_per_customer = (total_transactions / unique_customers) if unique_customers > 0 else 0
            
            kpis = {
                "total_customers": total_customers,
                "new_customers": new_customers,
                "active_customers": active_customers,
                "acquisition_rate": round(acquisition_rate, 2),
                "retention_rate": round(retention_rate, 2),
                "avg_customer_value": float(customer_result.avg_customer_value or 0),
                "total_customer_debt": float(customer_result.total_customer_debt or 0),
                "avg_transaction_value": float(transaction_result.avg_transaction_value or 0),
                "avg_transactions_per_customer": round(avg_transactions_per_customer, 2),
                "period_start": period_start.isoformat(),
                "period_end": period_end.isoformat(),
                "calculated_at": datetime.utcnow().isoformat()
            }
            
            # Cache the results
            await self.cache.set_kpi_data("customer", "summary", kpis, ttl=300, period=cache_key)
            
            return kpis
            
        except Exception as e:
            print(f"Error calculating customer KPIs: {e}")
            return {}
    
    async def save_kpi_snapshot(self, kpi_type: str, kpi_name: str, value: float, 
                               target_value: float = None, period_start: date = None, 
                               period_end: date = None, metadata: Dict = None):
        """Save KPI snapshot to database for historical tracking"""
        
        try:
            # Calculate trend and achievement rate
            achievement_rate = None
            if target_value and target_value > 0:
                achievement_rate = (value / target_value) * 100
            
            # Determine trend direction (simplified - compare with previous period)
            trend_direction = "stable"  # Default, would need historical comparison
            
            kpi_snapshot = KPISnapshot(
                kpi_type=kpi_type,
                kpi_name=kpi_name,
                value=Decimal(str(value)),
                target_value=Decimal(str(target_value)) if target_value else None,
                achievement_rate=Decimal(str(achievement_rate)) if achievement_rate else None,
                trend_direction=trend_direction,
                period_start=period_start or date.today(),
                period_end=period_end or date.today(),
                metadata=metadata
            )
            
            self.db.add(kpi_snapshot)
            self.db.commit()
            
            return kpi_snapshot.id
            
        except Exception as e:
            print(f"Error saving KPI snapshot: {e}")
            self.db.rollback()
            return None
    
    async def get_kpi_history(self, kpi_type: str, kpi_name: str, days: int = 30) -> List[Dict]:
        """Get historical KPI data"""
        
        try:
            start_date = date.today() - timedelta(days=days)
            
            snapshots = self.db.query(KPISnapshot).filter(
                KPISnapshot.kpi_type == kpi_type,
                KPISnapshot.kpi_name == kpi_name,
                KPISnapshot.created_at >= start_date
            ).order_by(KPISnapshot.created_at.desc()).all()
            
            return [
                {
                    "id": str(snapshot.id),
                    "value": float(snapshot.value),
                    "target_value": float(snapshot.target_value) if snapshot.target_value else None,
                    "achievement_rate": float(snapshot.achievement_rate) if snapshot.achievement_rate else None,
                    "trend_direction": snapshot.trend_direction,
                    "period_start": snapshot.period_start.isoformat(),
                    "period_end": snapshot.period_end.isoformat(),
                    "created_at": snapshot.created_at.isoformat(),
                    "metadata": snapshot.metadata
                }
                for snapshot in snapshots
            ]
            
        except Exception as e:
            print(f"Error retrieving KPI history: {e}")
            return []
    
    async def get_cache_statistics(self) -> Dict[str, Any]:
        """Get analytics cache statistics"""
        
        try:
            # Redis cache stats
            redis_stats = self.cache.get_cache_stats()
            
            # Database cache stats
            db_cache_query = text("""
                SELECT 
                    cache_type,
                    COUNT(*) as count,
                    COUNT(CASE WHEN expires_at > CURRENT_TIMESTAMP THEN 1 END) as active_count
                FROM analytics.analytics_cache
                GROUP BY cache_type
            """)
            
            db_cache_result = self.db.execute(db_cache_query).fetchall()
            
            db_cache_stats = {
                row.cache_type: {
                    "total": row.count,
                    "active": row.active_count
                }
                for row in db_cache_result
            }
            
            return {
                "redis": redis_stats,
                "database_cache": db_cache_stats,
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            print(f"Error getting cache statistics: {e}")
            return {"error": str(e)}
    
    async def cleanup_expired_data(self):
        """Clean up expired cache and old data"""
        
        try:
            # Clean up Redis cache
            await self.cache.cleanup_expired_cache()
            
            # Clean up database cache
            expired_count = self.db.execute(text("""
                DELETE FROM analytics.analytics_cache 
                WHERE expires_at < CURRENT_TIMESTAMP
            """)).rowcount
            
            self.db.commit()
            
            print(f"Cleaned up {expired_count} expired database cache entries")
            
            return {"expired_db_entries": expired_count}
            
        except Exception as e:
            print(f"Error during cleanup: {e}")
            self.db.rollback()
            return {"error": str(e)}