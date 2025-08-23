"""
Cache Invalidation Service for Analytics Caching Strategy

This service handles intelligent cache invalidation based on data changes,
ensuring cache consistency while maintaining performance.

Requirements covered: 1.4, 1.5
"""

from typing import Dict, List, Any, Optional, Set
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import event, text
import asyncio
import logging
from redis_config import get_analytics_cache, AnalyticsCache

logger = logging.getLogger(__name__)

class CacheInvalidationService:
    """
    Intelligent cache invalidation service that monitors data changes
    and invalidates related caches automatically
    """
    
    def __init__(self, db_session: Session):
        self.db = db_session
        self.cache = get_analytics_cache()
        
        # Define cache dependencies - what caches to invalidate when data changes
        self.cache_dependencies = {
            "invoices": {
                "patterns": [
                    "kpi:financial:*",
                    "kpi:customer:*", 
                    "chart:revenue:*",
                    "chart:profit:*",
                    "dashboard:*",
                    "aggregation:sales:*",
                    "aggregation:revenue:*",
                    "trend:financial:*",
                    "comparison:period:*"
                ],
                "related_entities": ["customers", "invoice_items"]
            },
            "invoice_items": {
                "patterns": [
                    "kpi:financial:*",
                    "kpi:operational:*",
                    "chart:inventory:*",
                    "chart:category:*",
                    "aggregation:product:*",
                    "forecast:*",
                    "optimization:*"
                ],
                "related_entities": ["inventory_items", "invoices"]
            },
            "inventory_items": {
                "patterns": [
                    "kpi:operational:*",
                    "chart:inventory:*",
                    "forecast:*",
                    "optimization:*",
                    "aggregation:inventory:*",
                    "trend:inventory:*"
                ],
                "related_entities": ["categories", "invoice_items"]
            },
            "customers": {
                "patterns": [
                    "kpi:customer:*",
                    "chart:customer:*",
                    "aggregation:customer:*",
                    "trend:customer:*"
                ],
                "related_entities": ["invoices"]
            },
            "payments": {
                "patterns": [
                    "kpi:financial:*",
                    "chart:payment:*",
                    "aggregation:payment:*",
                    "dashboard:*"
                ],
                "related_entities": ["invoices", "customers"]
            },
            "categories": {
                "patterns": [
                    "chart:category:*",
                    "aggregation:category:*",
                    "optimization:category:*"
                ],
                "related_entities": ["inventory_items"]
            }
        }
        
        # Track invalidation events for analysis
        self.invalidation_log = []
        self.max_log_size = 1000
    
    async def invalidate_on_data_change(
        self, 
        table_name: str, 
        operation: str, 
        record_id: str = None,
        changed_fields: List[str] = None
    ):
        """
        Invalidate caches based on data changes
        
        Args:
            table_name: Name of the table that changed
            operation: Type of operation (INSERT, UPDATE, DELETE)
            record_id: ID of the changed record
            changed_fields: List of fields that were changed (for UPDATE operations)
        """
        try:
            logger.info(f"Processing cache invalidation for {table_name} {operation}")
            
            # Get cache patterns to invalidate
            dependencies = self.cache_dependencies.get(table_name, {})
            patterns = dependencies.get("patterns", [])
            related_entities = dependencies.get("related_entities", [])
            
            # Track invalidation event
            invalidation_event = {
                "timestamp": datetime.utcnow().isoformat(),
                "table_name": table_name,
                "operation": operation,
                "record_id": record_id,
                "changed_fields": changed_fields,
                "patterns_invalidated": patterns,
                "related_entities": related_entities
            }
            
            # Invalidate direct cache patterns
            invalidated_count = 0
            for pattern in patterns:
                await self.cache.invalidate_by_pattern(pattern)
                invalidated_count += 1
            
            # Handle specific invalidation logic based on operation type
            if operation == "INSERT":
                await self._handle_insert_invalidation(table_name, record_id)
            elif operation == "UPDATE":
                await self._handle_update_invalidation(table_name, record_id, changed_fields)
            elif operation == "DELETE":
                await self._handle_delete_invalidation(table_name, record_id)
            
            # Invalidate related entity caches
            for related_entity in related_entities:
                await self._invalidate_related_entity_caches(related_entity, table_name, record_id)
            
            # Log the invalidation event
            invalidation_event["invalidated_count"] = invalidated_count
            invalidation_event["status"] = "completed"
            self._log_invalidation_event(invalidation_event)
            
            logger.info(f"Cache invalidation completed: {invalidated_count} patterns invalidated")
            
        except Exception as e:
            logger.error(f"Error in cache invalidation: {str(e)}")
            invalidation_event["status"] = "failed"
            invalidation_event["error"] = str(e)
            self._log_invalidation_event(invalidation_event)
    
    async def _handle_insert_invalidation(self, table_name: str, record_id: str):
        """Handle cache invalidation for INSERT operations"""
        
        # For new records, we typically need to invalidate aggregation caches
        # and dashboard data that might include the new record
        
        if table_name == "invoices":
            # New invoice affects financial KPIs and customer metrics
            await self.cache.invalidate_by_pattern("dashboard:*")
            await self.cache.invalidate_by_pattern("aggregation:*")
            
        elif table_name == "inventory_items":
            # New inventory item affects operational KPIs
            await self.cache.invalidate_by_pattern("kpi:operational:*")
            await self.cache.invalidate_by_pattern("chart:inventory:*")
            
        elif table_name == "customers":
            # New customer affects customer acquisition metrics
            await self.cache.invalidate_by_pattern("kpi:customer:acquisition:*")
    
    async def _handle_update_invalidation(self, table_name: str, record_id: str, changed_fields: List[str]):
        """Handle cache invalidation for UPDATE operations"""
        
        if not changed_fields:
            # If we don't know what changed, invalidate everything related
            await self.invalidate_on_data_change(table_name, "INSERT", record_id)
            return
        
        # Smart invalidation based on which fields changed
        if table_name == "invoices":
            financial_fields = ["total_amount", "paid_amount", "status", "vat_percentage"]
            if any(field in changed_fields for field in financial_fields):
                await self.cache.invalidate_by_pattern("kpi:financial:*")
                await self.cache.invalidate_by_pattern("chart:revenue:*")
                await self.cache.invalidate_by_pattern("chart:profit:*")
            
            if "status" in changed_fields:
                # Status changes affect many metrics
                await self.cache.invalidate_by_pattern("dashboard:*")
                await self.cache.invalidate_by_pattern("aggregation:*")
        
        elif table_name == "inventory_items":
            stock_fields = ["stock_quantity", "min_stock_level", "purchase_price", "sell_price"]
            if any(field in changed_fields for field in stock_fields):
                await self.cache.invalidate_by_pattern("kpi:operational:*")
                await self.cache.invalidate_by_pattern("forecast:*")
                await self.cache.invalidate_by_pattern("optimization:*")
        
        elif table_name == "customers":
            if "status" in changed_fields or "customer_type" in changed_fields:
                await self.cache.invalidate_by_pattern("kpi:customer:*")
                await self.cache.invalidate_by_pattern("aggregation:customer:*")
    
    async def _handle_delete_invalidation(self, table_name: str, record_id: str):
        """Handle cache invalidation for DELETE operations"""
        
        # Deletions typically require broad invalidation since we're removing data
        # that might have been included in various aggregations
        
        if table_name == "invoices":
            # Deleted invoice affects all financial metrics
            await self.cache.invalidate_by_pattern("kpi:financial:*")
            await self.cache.invalidate_by_pattern("kpi:customer:*")
            await self.cache.invalidate_by_pattern("dashboard:*")
            await self.cache.invalidate_by_pattern("aggregation:*")
            await self.cache.invalidate_by_pattern("trend:*")
        
        elif table_name == "inventory_items":
            # Deleted inventory item affects operational metrics and forecasts
            await self.cache.invalidate_by_pattern("kpi:operational:*")
            await self.cache.invalidate_by_pattern("forecast:*")
            await self.cache.invalidate_by_pattern("optimization:*")
        
        # For any deletion, invalidate comparison caches since historical data changed
        await self.cache.invalidate_by_pattern("comparison:*")
    
    async def _invalidate_related_entity_caches(self, related_entity: str, source_table: str, record_id: str):
        """Invalidate caches for related entities"""
        
        try:
            # Get the dependency patterns for the related entity
            related_dependencies = self.cache_dependencies.get(related_entity, {})
            related_patterns = related_dependencies.get("patterns", [])
            
            # Invalidate related patterns
            for pattern in related_patterns:
                await self.cache.invalidate_by_pattern(pattern)
            
            logger.debug(f"Invalidated {len(related_patterns)} patterns for related entity {related_entity}")
            
        except Exception as e:
            logger.error(f"Error invalidating related entity caches: {str(e)}")
    
    def _log_invalidation_event(self, event: Dict[str, Any]):
        """Log invalidation event for analysis"""
        
        self.invalidation_log.append(event)
        
        # Keep log size manageable
        if len(self.invalidation_log) > self.max_log_size:
            self.invalidation_log = self.invalidation_log[-self.max_log_size:]
    
    async def get_invalidation_stats(self) -> Dict[str, Any]:
        """Get statistics about cache invalidation events"""
        
        if not self.invalidation_log:
            return {
                "total_events": 0,
                "events_by_table": {},
                "events_by_operation": {},
                "recent_events": []
            }
        
        # Analyze invalidation events
        events_by_table = {}
        events_by_operation = {}
        
        for event in self.invalidation_log:
            table = event.get("table_name", "unknown")
            operation = event.get("operation", "unknown")
            
            events_by_table[table] = events_by_table.get(table, 0) + 1
            events_by_operation[operation] = events_by_operation.get(operation, 0) + 1
        
        # Get recent events (last 10)
        recent_events = self.invalidation_log[-10:] if len(self.invalidation_log) >= 10 else self.invalidation_log
        
        return {
            "total_events": len(self.invalidation_log),
            "events_by_table": events_by_table,
            "events_by_operation": events_by_operation,
            "recent_events": recent_events,
            "log_size": len(self.invalidation_log),
            "max_log_size": self.max_log_size
        }
    
    async def schedule_cache_cleanup(self):
        """Schedule periodic cache cleanup tasks"""
        
        try:
            # Clean up expired cache entries
            await self.cache.cleanup_expired_cache()
            
            # Clean up old invalidation logs
            cutoff_time = datetime.utcnow() - timedelta(hours=24)
            self.invalidation_log = [
                event for event in self.invalidation_log
                if datetime.fromisoformat(event["timestamp"]) > cutoff_time
            ]
            
            logger.info("Cache cleanup completed")
            
        except Exception as e:
            logger.error(f"Error in cache cleanup: {str(e)}")
    
    async def warm_critical_caches(self):
        """Warm up critical caches with frequently accessed data"""
        
        try:
            logger.info("Starting cache warming process")
            
            # Warm up dashboard KPIs (most frequently accessed)
            from services.kpi_calculator_service import FinancialKPICalculator
            
            kpi_calculator = FinancialKPICalculator(self.db)
            
            # Warm current month financial KPIs
            current_date = datetime.now().date()
            month_start = current_date.replace(day=1)
            
            await self.cache.warm_cache(
                "kpi",
                kpi_calculator.calculate_revenue_kpis,
                month_start,
                current_date
            )
            
            await self.cache.warm_cache(
                "kpi", 
                kpi_calculator.calculate_profit_margin_kpis,
                month_start,
                current_date
            )
            
            logger.info("Cache warming completed")
            
        except Exception as e:
            logger.error(f"Error in cache warming: {str(e)}")
    
    async def analyze_cache_efficiency(self) -> Dict[str, Any]:
        """Analyze cache efficiency and provide optimization recommendations"""
        
        try:
            # Get cache statistics
            cache_stats = self.cache.get_cache_stats()
            invalidation_stats = await self.get_invalidation_stats()
            
            # Calculate efficiency metrics
            hit_rate = cache_stats.get("cache_performance", {}).get("hit_rate_percent", 0)
            
            # Analyze invalidation patterns
            most_invalidated_tables = sorted(
                invalidation_stats["events_by_table"].items(),
                key=lambda x: x[1],
                reverse=True
            )[:5]
            
            # Generate recommendations
            recommendations = []
            
            if hit_rate < 70:
                recommendations.append({
                    "type": "performance",
                    "message": f"Cache hit rate is {hit_rate}%. Consider increasing TTL for stable data.",
                    "priority": "high"
                })
            
            if invalidation_stats["total_events"] > 100:
                recommendations.append({
                    "type": "invalidation",
                    "message": "High invalidation frequency detected. Consider optimizing invalidation patterns.",
                    "priority": "medium"
                })
            
            for table, count in most_invalidated_tables:
                if count > 20:
                    recommendations.append({
                        "type": "data_pattern",
                        "message": f"Table '{table}' has high invalidation frequency ({count} events). Consider caching strategy optimization.",
                        "priority": "medium"
                    })
            
            return {
                "cache_stats": cache_stats,
                "invalidation_stats": invalidation_stats,
                "efficiency_metrics": {
                    "hit_rate": hit_rate,
                    "most_invalidated_tables": most_invalidated_tables,
                    "invalidation_frequency": invalidation_stats["total_events"]
                },
                "recommendations": recommendations,
                "analysis_timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error analyzing cache efficiency: {str(e)}")
            return {"error": str(e)}

# Global instance
cache_invalidation_service = None

def get_cache_invalidation_service(db: Session) -> CacheInvalidationService:
    """Get cache invalidation service instance"""
    global cache_invalidation_service
    if cache_invalidation_service is None:
        cache_invalidation_service = CacheInvalidationService(db)
    return cache_invalidation_service