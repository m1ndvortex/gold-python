"""
Simple Analytics Caching Tests

Basic tests to verify caching functionality works correctly.
"""

import pytest
import asyncio
import time
import json
from datetime import datetime, timedelta, date
from unittest.mock import patch, MagicMock

from redis_config import AnalyticsCache, RedisConfig
from services.cache_invalidation_service import CacheInvalidationService
from services.cache_performance_service import CachePerformanceService

class TestAnalyticsCachingSimple:
    """Simple test suite for analytics caching"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup for each test"""
        # Mock Redis for testing
        self.mock_redis = MagicMock()
        self.redis_config = RedisConfig()
        self.redis_config.redis_client = self.mock_redis
        
        self.cache = AnalyticsCache(self.redis_config)
        self.cache.redis = self.mock_redis
        
        yield
    
    @pytest.mark.asyncio
    async def test_kpi_data_caching(self):
        """Test basic KPI data caching"""
        
        # Mock Redis get to return None (cache miss)
        self.mock_redis.get.return_value = None
        
        # Test cache miss
        result = await self.cache.get_kpi_data("financial", "revenue", "monthly")
        assert result is None
        
        # Test cache set
        test_data = {"revenue": 50000, "growth": 5.2}
        await self.cache.set_kpi_data("financial", "revenue", test_data, period="monthly")
        
        # Verify setex was called
        self.mock_redis.setex.assert_called()
        
        # Mock Redis get to return cached data (cache hit)
        cached_response = {
            "data": test_data,
            "cached_at": datetime.utcnow().isoformat(),
            "ttl": 300,
            "cache_type": "kpi"
        }
        self.mock_redis.get.return_value = json.dumps(cached_response, default=str)
        
        # Test cache hit
        result = await self.cache.get_kpi_data("financial", "revenue", "monthly")
        assert result is not None
        assert result["data"]["revenue"] == 50000
    
    @pytest.mark.asyncio
    async def test_forecast_data_caching(self):
        """Test forecast data caching"""
        
        # Mock cache miss
        self.mock_redis.get.return_value = None
        
        result = await self.cache.get_forecast_data("item-123", "30_days")
        assert result is None
        
        # Test cache set
        forecast_data = {"predictions": [1, 2, 3, 4, 5], "confidence": 0.85}
        await self.cache.set_forecast_data("item-123", "30_days", forecast_data)
        
        # Verify setex was called with correct TTL
        self.mock_redis.setex.assert_called()
        call_args = self.mock_redis.setex.call_args
        assert call_args[0][1] == 3600  # 1 hour TTL for forecasts
    
    @pytest.mark.asyncio
    async def test_cache_invalidation_by_pattern(self):
        """Test cache invalidation by pattern"""
        
        # Mock keys method
        self.mock_redis.keys.return_value = [
            "analytics:kpi:financial:revenue",
            "analytics:kpi:financial:profit",
            "analytics:chart:revenue:monthly"
        ]
        
        # Mock pipeline for batch deletion
        mock_pipeline = MagicMock()
        self.mock_redis.pipeline.return_value = mock_pipeline
        
        # Test pattern invalidation
        await self.cache.invalidate_by_pattern("kpi:financial:*")
        
        # Verify keys was called with correct pattern
        self.mock_redis.keys.assert_called_with("analytics:kpi:financial:**")
        
        # Verify pipeline was used for batch deletion
        self.mock_redis.pipeline.assert_called()
    
    def test_cache_key_generation(self):
        """Test cache key generation"""
        
        # Test basic key generation
        key = self.cache._generate_key("kpi", "financial", "revenue")
        assert key == "analytics:kpi:financial:revenue"
        
        # Test key with additional parameters
        key = self.cache._generate_key("kpi", "financial", "revenue", period="monthly", filters="active")
        assert "analytics:kpi:financial:revenue" in key
        assert "period:monthly" in key
        assert "filters:active" in key
    
    def test_cache_statistics(self):
        """Test cache statistics collection"""
        
        # Mock Redis info
        self.mock_redis.info.return_value = {
            "used_memory": 1024000,
            "used_memory_human": "1MB",
            "connected_clients": 5,
            "uptime_in_seconds": 3600
        }
        
        # Mock keys count
        self.mock_redis.keys.return_value = ["key1", "key2", "key3"]
        
        # Get cache stats
        stats = self.cache.get_cache_stats()
        
        # Verify stats structure
        assert stats["status"] == "connected"
        assert stats["analytics_keys"] == 3
        assert stats["memory_used"] == "1MB"
        assert "cache_performance" in stats
    
    @pytest.mark.asyncio
    async def test_cache_health_check(self):
        """Test cache health check"""
        
        # Mock successful operations
        self.mock_redis.setex.return_value = True
        self.mock_redis.get.return_value = '{"timestamp": "2023-01-01T00:00:00"}'
        self.mock_redis.delete.return_value = 1
        self.mock_redis.info.return_value = {
            "used_memory": 50000000,  # 50MB
            "connected_clients": 3,
            "instantaneous_ops_per_sec": 100
        }
        
        # Test health check
        health = await self.cache.get_cache_health()
        
        # Verify health status
        assert health["status"] in ["healthy", "warning", "critical"]
        assert "memory_used_mb" in health
        assert "memory_usage_percent" in health
    
    def test_ttl_strategies(self):
        """Test TTL strategies for different cache types"""
        
        # Verify TTL strategies are defined
        assert "kpi" in self.cache.ttl_strategies
        assert "forecast" in self.cache.ttl_strategies
        assert "report" in self.cache.ttl_strategies
        assert "chart" in self.cache.ttl_strategies
        
        # Verify reasonable TTL values
        assert self.cache.ttl_strategies["kpi"] > 0
        assert self.cache.ttl_strategies["forecast"] > self.cache.ttl_strategies["kpi"]  # Forecasts should cache longer
        assert self.cache.ttl_strategies["chart"] > 0
    
    @pytest.mark.asyncio
    async def test_cache_hit_miss_tracking(self):
        """Test cache hit/miss statistics tracking"""
        
        # Reset stats
        await self.cache.reset_cache_stats()
        
        # Simulate cache miss
        self.mock_redis.get.return_value = None
        await self.cache.get_kpi_data("financial", "revenue")
        
        # Simulate cache hit
        cached_data = {
            "data": {"revenue": 100},
            "cached_at": datetime.utcnow().isoformat(),
            "ttl": 300
        }
        self.mock_redis.get.return_value = json.dumps(cached_data)
        await self.cache.get_kpi_data("financial", "revenue")
        
        # Verify stats were tracked
        assert "kpi" in self.cache.cache_hit_stats or "kpi" in self.cache.cache_miss_stats
    
    @pytest.mark.asyncio
    async def test_expensive_query_caching(self):
        """Test expensive query result caching"""
        
        # Test cache miss
        self.mock_redis.get.return_value = None
        result = await self.cache.get_expensive_query_cache("query_hash_123")
        assert result is None
        
        # Test cache set
        query_results = [{"id": 1, "value": 100}, {"id": 2, "value": 200}]
        await self.cache.set_expensive_query_cache("query_hash_123", query_results)
        
        # Verify setex was called with raw_query TTL
        self.mock_redis.setex.assert_called()
        call_args = self.mock_redis.setex.call_args
        assert call_args[0][1] == self.cache.ttl_strategies["raw_query"]
    
    @pytest.mark.asyncio
    async def test_aggregation_caching(self):
        """Test aggregation result caching"""
        
        # Test cache miss
        self.mock_redis.get.return_value = None
        result = await self.cache.get_aggregation_cache("sales", "category", "monthly")
        assert result is None
        
        # Test cache set
        agg_results = {"total_sales": 50000, "categories": 5}
        await self.cache.set_aggregation_cache("sales", "category", "monthly", agg_results)
        
        # Verify setex was called
        self.mock_redis.setex.assert_called()
    
    def test_cache_freshness_check(self):
        """Test cache freshness validation"""
        
        # Test fresh data
        fresh_data = {
            "cached_at": datetime.utcnow().isoformat(),
            "ttl": 300
        }
        assert self.cache._is_cache_fresh(fresh_data, 600)  # Within TTL
        
        # Test stale data
        stale_data = {
            "cached_at": (datetime.utcnow() - timedelta(hours=1)).isoformat(),
            "ttl": 300
        }
        assert not self.cache._is_cache_fresh(stale_data, 300)  # Beyond TTL

@pytest.mark.asyncio
async def test_cache_invalidation_service():
    """Test cache invalidation service functionality"""
    
    # Mock database session
    mock_db = MagicMock()
    
    # Create invalidation service
    invalidation_service = CacheInvalidationService(mock_db)
    
    # Mock cache
    invalidation_service.cache = MagicMock()
    invalidation_service.cache.invalidate_by_pattern = MagicMock()
    
    # Test data change invalidation
    await invalidation_service.invalidate_on_data_change(
        table_name="invoices",
        operation="INSERT",
        record_id="test-invoice-123"
    )
    
    # Verify invalidation was called
    invalidation_service.cache.invalidate_by_pattern.assert_called()
    
    # Verify invalidation event was logged
    assert len(invalidation_service.invalidation_log) > 0
    
    # Get invalidation stats
    stats = await invalidation_service.get_invalidation_stats()
    assert "total_events" in stats
    assert "events_by_table" in stats
    assert stats["total_events"] > 0

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])