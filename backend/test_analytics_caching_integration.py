"""
Integration Tests for Analytics Caching Strategy

Tests the complete caching system integration including KPI calculations,
cache invalidation, and performance monitoring.
"""

import pytest
import asyncio
import time
from datetime import datetime, timedelta, date
from decimal import Decimal

from database import get_db
from redis_config import get_analytics_cache
from services.kpi_calculator_service import FinancialKPICalculator
from services.cache_invalidation_service import CacheInvalidationService
from services.cache_performance_service import CachePerformanceService
from models import Invoice, Customer, InventoryItem, Category

class TestAnalyticsCachingIntegration:
    """Integration test suite for analytics caching"""
    
    @pytest.fixture(autouse=True)
    def setup_and_teardown(self):
        """Setup and teardown for each test"""
        # Get services
        self.db = next(get_db())
        self.cache = get_analytics_cache()
        self.kpi_calculator = FinancialKPICalculator(self.db)
        self.invalidation_service = CacheInvalidationService(self.db)
        self.performance_service = CachePerformanceService(self.db)
        
        # Reset cache for clean testing
        asyncio.run(self.cache.reset_cache_stats())
        
        yield
        
        # Cleanup
        self.db.close()
    
    @pytest.mark.asyncio
    async def test_kpi_calculation_with_caching(self):
        """Test KPI calculation with caching integration"""
        
        # Test parameters
        start_date = date.today() - timedelta(days=30)
        end_date = date.today()
        targets = {"revenue": 100000, "profit_margin": 0.25}
        
        print("Testing KPI calculation with caching...")
        
        # First calculation - should cache the result
        start_time = time.time()
        result1 = await self.kpi_calculator.calculate_revenue_kpis(start_date, end_date, targets)
        first_call_time = (time.time() - start_time) * 1000
        
        # Verify result structure
        assert "current_revenue" in result1
        assert "growth_rate" in result1
        assert "trend_direction" in result1
        
        # Second calculation - should use cache
        start_time = time.time()
        result2 = await self.kpi_calculator.calculate_revenue_kpis(start_date, end_date, targets)
        second_call_time = (time.time() - start_time) * 1000
        
        # Verify results are identical
        assert result1["current_revenue"] == result2["current_revenue"]
        assert result1["growth_rate"] == result2["growth_rate"]
        
        # Verify cache improved performance
        performance_improvement = ((first_call_time - second_call_time) / first_call_time) * 100
        assert performance_improvement > 0, "Cache should improve performance"
        
        # Get cache statistics
        cache_stats = self.cache.get_cache_stats()
        assert cache_stats["cache_performance"]["cache_hits"] > 0
        
        print(f"✓ First call: {first_call_time:.2f}ms")
        print(f"✓ Second call: {second_call_time:.2f}ms")
        print(f"✓ Performance improvement: {performance_improvement:.1f}%")
        print(f"✓ Cache hit rate: {cache_stats['cache_performance']['hit_rate_percent']:.1f}%")
    
    @pytest.mark.asyncio
    async def test_cache_invalidation_on_data_change(self):
        """Test cache invalidation when data changes"""
        
        print("Testing cache invalidation on data change...")
        
        # Cache some KPI data
        start_date = date.today() - timedelta(days=30)
        end_date = date.today()
        
        result1 = await self.kpi_calculator.calculate_revenue_kpis(start_date, end_date)
        
        # Verify data is cached
        cache_key = f"revenue_kpis_{start_date}_{end_date}_{hash(str(None))}"
        cached_data = await self.cache.get_kpi_data("financial", "revenue", period=cache_key)
        assert cached_data is not None, "Data should be cached"
        
        # Simulate data change (new invoice)
        await self.invalidation_service.invalidate_on_data_change(
            table_name="invoices",
            operation="INSERT",
            record_id="test-invoice-id"
        )
        
        # Verify cache was invalidated
        cached_data_after = await self.cache.get_kpi_data("financial", "revenue", period=cache_key)
        assert cached_data_after is None, "Cache should be invalidated"
        
        # Verify new calculation works
        result2 = await self.kpi_calculator.calculate_revenue_kpis(start_date, end_date)
        assert result2 is not None
        
        # Get invalidation statistics
        invalidation_stats = await self.invalidation_service.get_invalidation_stats()
        assert invalidation_stats["total_events"] > 0
        assert "invoices" in invalidation_stats["events_by_table"]
        
        print("✓ Cache invalidation working correctly")
        print(f"✓ Invalidation events: {invalidation_stats['total_events']}")
    
    @pytest.mark.asyncio
    async def test_multiple_cache_types(self):
        """Test different types of cache data"""
        
        print("Testing multiple cache types...")
        
        # Test KPI caching
        kpi_data = {"revenue": 50000, "growth": 5.2}
        await self.cache.set_kpi_data("financial", "revenue", kpi_data)
        
        # Test forecast caching
        forecast_data = {"predictions": [1, 2, 3, 4, 5], "confidence": 0.85}
        await self.cache.set_forecast_data("item-123", "30_days", forecast_data)
        
        # Test chart caching
        chart_data = {"data": [{"month": "Jan", "value": 10000}]}
        await self.cache.set_chart_data("revenue", "monthly", chart_data)
        
        # Test aggregation caching
        agg_data = {"total_sales": 75000, "categories": 5}
        await self.cache.set_aggregation_cache("sales", "category", "monthly", agg_data)
        
        # Verify all data can be retrieved
        cached_kpi = await self.cache.get_kpi_data("financial", "revenue")
        cached_forecast = await self.cache.get_forecast_data("item-123", "30_days")
        cached_chart = await self.cache.get_chart_data("revenue", "monthly")
        cached_agg = await self.cache.get_aggregation_cache("sales", "category", "monthly")
        
        assert cached_kpi is not None
        assert cached_forecast is not None
        assert cached_chart is not None
        assert cached_agg is not None
        
        # Verify data integrity
        assert cached_kpi["data"]["revenue"] == 50000
        assert cached_forecast["data"]["confidence"] == 0.85
        assert len(cached_chart["data"]["data"]) == 1
        assert cached_agg["data"]["total_sales"] == 75000
        
        print("✓ All cache types working correctly")
    
    @pytest.mark.asyncio
    async def test_cache_ttl_strategies(self):
        """Test different TTL strategies for cache types"""
        
        print("Testing TTL strategies...")
        
        # Verify TTL strategies are configured
        ttl_strategies = self.cache.ttl_strategies
        
        # Test that different cache types have appropriate TTLs
        assert ttl_strategies["kpi"] < ttl_strategies["forecast"]  # KPIs change more frequently
        assert ttl_strategies["chart"] < ttl_strategies["report"]  # Charts update more often
        assert ttl_strategies["raw_query"] < ttl_strategies["aggregation"]  # Raw queries are more volatile
        
        # Test cache with custom TTL
        short_ttl_data = {"test": "data"}
        await self.cache.set_kpi_data("test", "short_ttl", short_ttl_data, ttl=1)  # 1 second TTL
        
        # Verify data is cached
        cached_data = await self.cache.get_kpi_data("test", "short_ttl")
        assert cached_data is not None
        
        # Wait for TTL expiration
        await asyncio.sleep(2)
        
        # Verify data is no longer cached
        expired_data = await self.cache.get_kpi_data("test", "short_ttl")
        assert expired_data is None
        
        print("✓ TTL strategies working correctly")
        print(f"✓ KPI TTL: {ttl_strategies['kpi']}s")
        print(f"✓ Forecast TTL: {ttl_strategies['forecast']}s")
        print(f"✓ Chart TTL: {ttl_strategies['chart']}s")
    
    @pytest.mark.asyncio
    async def test_cache_performance_monitoring(self):
        """Test cache performance monitoring"""
        
        print("Testing cache performance monitoring...")
        
        # Generate some cache activity
        for i in range(3):
            await self.kpi_calculator.calculate_revenue_kpis(
                date.today() - timedelta(days=30),
                date.today()
            )
        
        # Get cache statistics
        cache_stats = self.cache.get_cache_stats()
        
        # Verify statistics structure
        assert "cache_performance" in cache_stats
        assert "cache_type_breakdown" in cache_stats
        assert "ttl_strategies" in cache_stats
        
        performance = cache_stats["cache_performance"]
        assert "total_requests" in performance
        assert "cache_hits" in performance
        assert "cache_misses" in performance
        assert "hit_rate_percent" in performance
        
        # Test cache health
        health = await self.cache.get_cache_health()
        assert health["status"] in ["healthy", "warning", "critical", "unhealthy"]
        
        print(f"✓ Total requests: {performance['total_requests']}")
        print(f"✓ Hit rate: {performance['hit_rate_percent']:.1f}%")
        print(f"✓ Cache health: {health['status']}")
    
    @pytest.mark.asyncio
    async def test_cache_efficiency_analysis(self):
        """Test cache efficiency analysis"""
        
        print("Testing cache efficiency analysis...")
        
        # Generate cache activity and invalidations
        await self.kpi_calculator.calculate_revenue_kpis(
            date.today() - timedelta(days=30),
            date.today()
        )
        
        # Simulate data changes
        await self.invalidation_service.invalidate_on_data_change("invoices", "INSERT", "test-1")
        await self.invalidation_service.invalidate_on_data_change("invoices", "UPDATE", "test-2")
        
        # Run efficiency analysis
        analysis = await self.invalidation_service.analyze_cache_efficiency()
        
        # Verify analysis structure
        assert "cache_stats" in analysis
        assert "invalidation_stats" in analysis
        assert "efficiency_metrics" in analysis
        assert "recommendations" in analysis
        
        efficiency_metrics = analysis["efficiency_metrics"]
        assert "hit_rate" in efficiency_metrics
        assert "invalidation_frequency" in efficiency_metrics
        
        print(f"✓ Hit rate: {efficiency_metrics['hit_rate']:.1f}%")
        print(f"✓ Invalidation events: {efficiency_metrics['invalidation_frequency']}")
        print(f"✓ Recommendations: {len(analysis['recommendations'])}")
    
    @pytest.mark.asyncio
    async def test_concurrent_cache_access(self):
        """Test cache behavior under concurrent access"""
        
        print("Testing concurrent cache access...")
        
        async def calculate_kpis(iteration: int):
            """Calculate KPIs for concurrent test"""
            start_date = date.today() - timedelta(days=30)
            end_date = date.today()
            
            start_time = time.time()
            result = await self.kpi_calculator.calculate_revenue_kpis(start_date, end_date)
            response_time = (time.time() - start_time) * 1000
            
            return {
                "iteration": iteration,
                "response_time_ms": response_time,
                "revenue": result["current_revenue"]
            }
        
        # Run concurrent requests
        concurrent_requests = 5
        tasks = [calculate_kpis(i) for i in range(concurrent_requests)]
        results = await asyncio.gather(*tasks)
        
        # Analyze results
        response_times = [r["response_time_ms"] for r in results]
        revenues = [r["revenue"] for r in results]
        
        # Verify all requests returned same data (cache consistency)
        assert len(set(revenues)) == 1, "Cache inconsistency detected"
        
        # Verify performance improved after first request
        first_request_time = results[0]["response_time_ms"]
        subsequent_times = response_times[1:]
        
        if subsequent_times:
            avg_subsequent_time = sum(subsequent_times) / len(subsequent_times)
            improvement = ((first_request_time - avg_subsequent_time) / first_request_time) * 100
            assert improvement > 0, "Cache should improve performance"
            
            print(f"✓ First request: {first_request_time:.2f}ms")
            print(f"✓ Average subsequent: {avg_subsequent_time:.2f}ms")
            print(f"✓ Performance improvement: {improvement:.1f}%")
        
        print("✓ Concurrent access working correctly")
    
    @pytest.mark.asyncio
    async def test_cache_memory_efficiency(self):
        """Test cache memory usage"""
        
        print("Testing cache memory efficiency...")
        
        # Get initial memory usage
        initial_stats = self.cache.get_cache_stats()
        initial_keys = initial_stats.get("analytics_keys", 0)
        
        # Cache various data types
        test_datasets = [
            ("kpi", "financial", "revenue", {"revenue": 50000}),
            ("kpi", "operational", "inventory", {"turnover": 12.5}),
            ("forecast", "item-1", "30_days", {"predictions": list(range(30))}),
            ("chart", "revenue", "monthly", {"data": [{"month": f"Month{i}", "value": i*1000} for i in range(12)]}),
            ("aggregation", "sales", "category", {"categories": [{"name": f"Cat{i}", "total": i*5000} for i in range(10)]})
        ]
        
        for cache_type, entity_type, entity_id, data in test_datasets:
            if cache_type == "kpi":
                await self.cache.set_kpi_data(entity_type, entity_id, data)
            elif cache_type == "forecast":
                await self.cache.set_forecast_data(entity_id, "30_days", data)
            elif cache_type == "chart":
                await self.cache.set_chart_data(entity_type, entity_id, data)
            elif cache_type == "aggregation":
                await self.cache.set_aggregation_cache(entity_type, entity_id, "monthly", data)
        
        # Get final memory usage
        final_stats = self.cache.get_cache_stats()
        final_keys = final_stats.get("analytics_keys", 0)
        
        # Verify cache keys were created
        keys_created = final_keys - initial_keys
        assert keys_created > 0, "Cache keys should be created"
        
        print(f"✓ Cache keys created: {keys_created}")
        print(f"✓ Memory usage: {final_stats.get('memory_used', 'N/A')}")
        print("✓ Memory efficiency test completed")

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])