"""
Redis Configuration for Analytics Caching
Provides Redis connection and caching utilities for the analytics system
"""

import redis
import json
import os
from typing import Optional, Any, Dict, List
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

class RedisConfig:
    """Redis configuration and connection management"""
    
    def __init__(self):
        self.redis_url = os.getenv("REDIS_URL", "redis://redis:6379/0")
        self.redis_client = None
        self._connect()
    
    def _connect(self):
        """Establish Redis connection"""
        try:
            self.redis_client = redis.from_url(
                self.redis_url,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5,
                retry_on_timeout=True,
                health_check_interval=30
            )
            # Test connection
            self.redis_client.ping()
            print("✅ Redis connection established successfully")
        except Exception as e:
            print(f"❌ Redis connection failed: {e}")
            self.redis_client = None
    
    def get_client(self) -> Optional[redis.Redis]:
        """Get Redis client instance"""
        if self.redis_client is None:
            self._connect()
        return self.redis_client
    
    def is_connected(self) -> bool:
        """Check if Redis is connected"""
        try:
            if self.redis_client:
                self.redis_client.ping()
                return True
        except:
            pass
        return False

class AnalyticsCache:
    """Analytics-specific caching utilities with advanced strategies"""
    
    def __init__(self, redis_config: RedisConfig):
        self.redis = redis_config.get_client()
        self.default_ttl = 300  # 5 minutes default TTL
        self.cache_hit_stats = {}
        self.cache_miss_stats = {}
        
        # Cache TTL strategies by data type
        self.ttl_strategies = {
            "kpi": 300,           # 5 minutes - frequently updated
            "forecast": 3600,     # 1 hour - computationally expensive
            "report": 1800,       # 30 minutes - medium complexity
            "chart": 600,         # 10 minutes - visualization data
            "aggregation": 900,   # 15 minutes - aggregated data
            "raw_query": 180,     # 3 minutes - raw database queries
            "dashboard": 240,     # 4 minutes - dashboard data
            "trend": 1200,        # 20 minutes - trend analysis
            "comparison": 600,    # 10 minutes - comparative data
            "optimization": 7200  # 2 hours - optimization calculations
        }
        
    def _generate_key(self, cache_type: str, entity_type: str = None, entity_id: str = None, **kwargs) -> str:
        """Generate standardized cache key"""
        key_parts = ["analytics", cache_type]
        
        if entity_type:
            key_parts.append(entity_type)
        if entity_id:
            key_parts.append(str(entity_id))
            
        # Add additional parameters
        for k, v in sorted(kwargs.items()):
            if v is not None:
                key_parts.append(f"{k}:{v}")
                
        return ":".join(key_parts)
    
    async def get_kpi_data(self, kpi_type: str, kpi_name: str, period: str = None) -> Optional[Dict]:
        """Get cached KPI data with hit/miss tracking"""
        if not self.redis:
            self._record_cache_miss("kpi", f"{kpi_type}:{kpi_name}")
            return None
            
        try:
            cache_key = self._generate_key("kpi", kpi_type, kpi_name, period=period)
            cached_data = self.redis.get(cache_key)
            
            if cached_data:
                self._record_cache_hit("kpi", f"{kpi_type}:{kpi_name}")
                data = json.loads(cached_data)
                
                # Check if data is still fresh based on timestamp
                if self._is_cache_fresh(data, self.ttl_strategies["kpi"]):
                    return data
                else:
                    # Data is stale, remove it
                    await self.invalidate_cache_key(cache_key)
                    self._record_cache_miss("kpi", f"{kpi_type}:{kpi_name}")
                    return None
            else:
                self._record_cache_miss("kpi", f"{kpi_type}:{kpi_name}")
                
        except Exception as e:
            print(f"Error retrieving KPI cache: {e}")
            self._record_cache_miss("kpi", f"{kpi_type}:{kpi_name}")
        
        return None
    
    async def set_kpi_data(self, kpi_type: str, kpi_name: str, data: Dict, ttl: int = None, period: str = None):
        """Cache KPI data with intelligent TTL and metadata"""
        if not self.redis:
            return
            
        try:
            cache_key = self._generate_key("kpi", kpi_type, kpi_name, period=period)
            ttl = ttl or self.ttl_strategies["kpi"]
            
            # Add comprehensive metadata
            cache_data = {
                "data": data,
                "cached_at": datetime.utcnow().isoformat(),
                "ttl": ttl,
                "cache_type": "kpi",
                "kpi_type": kpi_type,
                "kpi_name": kpi_name,
                "period": period,
                "data_size": len(json.dumps(data, default=str)),
                "version": "1.0"
            }
            
            # Set cache with TTL
            self.redis.setex(cache_key, ttl, json.dumps(cache_data, default=str))
            
            # Add to cache index for efficient invalidation
            await self._add_to_cache_index("kpi", cache_key, kpi_type, kpi_name)
            
        except Exception as e:
            print(f"Error caching KPI data: {e}")
    
    async def get_forecast_data(self, item_id: str, forecast_period: str) -> Optional[Dict]:
        """Get cached forecast data"""
        if not self.redis:
            return None
            
        try:
            cache_key = self._generate_key("forecast", "item", item_id, period=forecast_period)
            cached_data = self.redis.get(cache_key)
            
            if cached_data:
                return json.loads(cached_data)
        except Exception as e:
            print(f"Error retrieving forecast cache: {e}")
        
        return None
    
    async def set_forecast_data(self, item_id: str, forecast_period: str, data: Dict, ttl: int = 3600):
        """Cache forecast data (1 hour default TTL)"""
        if not self.redis:
            return
            
        try:
            cache_key = self._generate_key("forecast", "item", item_id, period=forecast_period)
            
            cache_data = {
                "data": data,
                "cached_at": datetime.utcnow().isoformat(),
                "ttl": ttl
            }
            
            self.redis.setex(cache_key, ttl, json.dumps(cache_data, default=str))
        except Exception as e:
            print(f"Error caching forecast data: {e}")
    
    async def get_report_data(self, report_id: str) -> Optional[Dict]:
        """Get cached report data"""
        if not self.redis:
            return None
            
        try:
            cache_key = self._generate_key("report", "custom", report_id)
            cached_data = self.redis.get(cache_key)
            
            if cached_data:
                return json.loads(cached_data)
        except Exception as e:
            print(f"Error retrieving report cache: {e}")
        
        return None
    
    async def set_report_data(self, report_id: str, data: Dict, ttl: int = 1800):
        """Cache report data (30 minutes default TTL)"""
        if not self.redis:
            return
            
        try:
            cache_key = self._generate_key("report", "custom", report_id)
            
            cache_data = {
                "data": data,
                "cached_at": datetime.utcnow().isoformat(),
                "ttl": ttl
            }
            
            self.redis.setex(cache_key, ttl, json.dumps(cache_data, default=str))
        except Exception as e:
            print(f"Error caching report data: {e}")
    
    async def get_chart_data(self, chart_type: str, entity_type: str, entity_id: str = None, **params) -> Optional[Dict]:
        """Get cached chart data"""
        if not self.redis:
            return None
            
        try:
            # Build cache key manually to avoid parameter conflicts
            key_parts = ["analytics", "chart", chart_type, entity_type]
            if entity_id:
                key_parts.append(entity_id)
            for k, v in sorted(params.items()):
                if v is not None:
                    key_parts.append(f"{k}:{v}")
            cache_key = ":".join(key_parts)
            
            cached_data = self.redis.get(cache_key)
            
            if cached_data:
                return json.loads(cached_data)
        except Exception as e:
            print(f"Error retrieving chart cache: {e}")
        
        return None
    
    async def set_chart_data(self, chart_type: str, entity_type: str, data: Dict, entity_id: str = None, ttl: int = 600, **params):
        """Cache chart data (10 minutes default TTL)"""
        if not self.redis:
            return
            
        try:
            # Build cache key manually to avoid parameter conflicts
            key_parts = ["analytics", "chart", chart_type, entity_type]
            if entity_id:
                key_parts.append(entity_id)
            for k, v in sorted(params.items()):
                if v is not None:
                    key_parts.append(f"{k}:{v}")
            cache_key = ":".join(key_parts)
            
            cache_data = {
                "data": data,
                "cached_at": datetime.utcnow().isoformat(),
                "ttl": ttl
            }
            
            self.redis.setex(cache_key, ttl, json.dumps(cache_data, default=str))
        except Exception as e:
            print(f"Error caching chart data: {e}")
    
    async def invalidate_cache(self, pattern: str):
        """Invalidate cache entries matching pattern"""
        if not self.redis:
            return
            
        try:
            keys = self.redis.keys(f"analytics:{pattern}*")
            if keys:
                self.redis.delete(*keys)
                print(f"Invalidated {len(keys)} cache entries matching pattern: {pattern}")
        except Exception as e:
            print(f"Error invalidating cache: {e}")
    
    async def cleanup_expired_cache(self):
        """Clean up expired cache entries (called periodically)"""
        if not self.redis:
            return
            
        try:
            # Redis automatically handles TTL expiration, but we can clean up any manual entries
            expired_keys = []
            
            # Get all analytics cache keys
            keys = self.redis.keys("analytics:*")
            
            for key in keys:
                ttl = self.redis.ttl(key)
                if ttl == -2:  # Key doesn't exist
                    expired_keys.append(key)
            
            if expired_keys:
                self.redis.delete(*expired_keys)
                print(f"Cleaned up {len(expired_keys)} expired cache entries")
                
        except Exception as e:
            print(f"Error during cache cleanup: {e}")
    
    def get_cache_stats(self) -> Dict:
        """Get comprehensive cache statistics"""
        if not self.redis:
            return {"status": "disconnected"}
            
        try:
            info = self.redis.info()
            analytics_keys = len(self.redis.keys("analytics:*"))
            
            # Calculate hit rates
            total_hits = sum(self.cache_hit_stats.values())
            total_misses = sum(self.cache_miss_stats.values())
            total_requests = total_hits + total_misses
            hit_rate = (total_hits / total_requests * 100) if total_requests > 0 else 0
            
            # Get cache type breakdown
            cache_type_stats = {}
            for cache_type in self.ttl_strategies.keys():
                type_keys = len(self.redis.keys(f"analytics:{cache_type}:*"))
                cache_type_stats[cache_type] = {
                    "keys": type_keys,
                    "hits": self.cache_hit_stats.get(cache_type, 0),
                    "misses": self.cache_miss_stats.get(cache_type, 0)
                }
            
            return {
                "status": "connected",
                "total_keys": info.get("db0", {}).get("keys", 0),
                "analytics_keys": analytics_keys,
                "memory_used": info.get("used_memory_human", "0B"),
                "memory_peak": info.get("used_memory_peak_human", "0B"),
                "connected_clients": info.get("connected_clients", 0),
                "uptime_seconds": info.get("uptime_in_seconds", 0),
                "cache_performance": {
                    "total_requests": total_requests,
                    "cache_hits": total_hits,
                    "cache_misses": total_misses,
                    "hit_rate_percent": round(hit_rate, 2),
                    "miss_rate_percent": round(100 - hit_rate, 2)
                },
                "cache_type_breakdown": cache_type_stats,
                "ttl_strategies": self.ttl_strategies
            }
        except Exception as e:
            return {"status": "error", "error": str(e)}
    
    def _record_cache_hit(self, cache_type: str, key: str):
        """Record cache hit for statistics"""
        self.cache_hit_stats[cache_type] = self.cache_hit_stats.get(cache_type, 0) + 1
    
    def _record_cache_miss(self, cache_type: str, key: str):
        """Record cache miss for statistics"""
        self.cache_miss_stats[cache_type] = self.cache_miss_stats.get(cache_type, 0) + 1
    
    def _is_cache_fresh(self, cached_data: Dict, max_age_seconds: int) -> bool:
        """Check if cached data is still fresh"""
        try:
            cached_at = datetime.fromisoformat(cached_data.get("cached_at", ""))
            age_seconds = (datetime.utcnow() - cached_at).total_seconds()
            return age_seconds < max_age_seconds
        except:
            return False
    
    async def _add_to_cache_index(self, cache_type: str, cache_key: str, *identifiers):
        """Add cache key to index for efficient invalidation"""
        if not self.redis:
            return
            
        try:
            # Create index key
            index_key = f"analytics:index:{cache_type}"
            
            # Add cache key to set with identifiers
            index_data = {
                "key": cache_key,
                "identifiers": list(identifiers),
                "created_at": datetime.utcnow().isoformat()
            }
            
            self.redis.sadd(index_key, json.dumps(index_data))
            
        except Exception as e:
            print(f"Error adding to cache index: {e}")
    
    async def invalidate_cache_key(self, cache_key: str):
        """Invalidate a specific cache key"""
        if not self.redis:
            return
            
        try:
            self.redis.delete(cache_key)
        except Exception as e:
            print(f"Error invalidating cache key {cache_key}: {e}")
    
    async def invalidate_by_pattern(self, pattern: str):
        """Invalidate cache entries matching pattern with pipeline for efficiency"""
        if not self.redis:
            return
            
        try:
            keys = self.redis.keys(f"analytics:{pattern}*")
            if keys:
                # Use pipeline for batch deletion
                pipe = self.redis.pipeline()
                for key in keys:
                    pipe.delete(key)
                pipe.execute()
                print(f"Invalidated {len(keys)} cache entries matching pattern: {pattern}")
        except Exception as e:
            print(f"Error invalidating cache by pattern: {e}")
    
    async def invalidate_related_caches(self, entity_type: str, entity_id: str = None):
        """Invalidate all caches related to a specific entity"""
        if not self.redis:
            return
            
        try:
            patterns_to_invalidate = []
            
            if entity_type == "invoice":
                patterns_to_invalidate.extend([
                    "kpi:financial:*",
                    "kpi:operational:*",
                    "chart:revenue:*",
                    "chart:profit:*",
                    "dashboard:*",
                    "aggregation:sales:*"
                ])
            elif entity_type == "inventory":
                patterns_to_invalidate.extend([
                    "kpi:operational:*",
                    "forecast:*",
                    "optimization:*",
                    "chart:inventory:*"
                ])
            elif entity_type == "customer":
                patterns_to_invalidate.extend([
                    "kpi:customer:*",
                    "chart:customer:*",
                    "aggregation:customer:*"
                ])
            
            # Invalidate all related patterns
            for pattern in patterns_to_invalidate:
                await self.invalidate_by_pattern(pattern)
                
        except Exception as e:
            print(f"Error invalidating related caches: {e}")
    
    async def warm_cache(self, cache_type: str, data_generator_func, *args, **kwargs):
        """Warm cache with pre-calculated data"""
        if not self.redis:
            return
            
        try:
            # Generate data using provided function
            data = await data_generator_func(*args, **kwargs)
            
            # Cache the data with appropriate TTL
            ttl = self.ttl_strategies.get(cache_type, self.default_ttl)
            cache_key = self._generate_key(cache_type, *args, **kwargs)
            
            cache_data = {
                "data": data,
                "cached_at": datetime.utcnow().isoformat(),
                "ttl": ttl,
                "cache_type": cache_type,
                "warmed": True
            }
            
            self.redis.setex(cache_key, ttl, json.dumps(cache_data, default=str))
            print(f"Cache warmed for {cache_type}: {cache_key}")
            
        except Exception as e:
            print(f"Error warming cache: {e}")
    
    async def get_expensive_query_cache(self, query_hash: str, query_params: Dict = None) -> Optional[Dict]:
        """Get cached results for expensive database queries"""
        if not self.redis:
            return None
            
        try:
            cache_key = self._generate_key("raw_query", query_hash)
            cached_data = self.redis.get(cache_key)
            
            if cached_data:
                self._record_cache_hit("raw_query", query_hash)
                data = json.loads(cached_data)
                
                if self._is_cache_fresh(data, self.ttl_strategies["raw_query"]):
                    return data
                else:
                    await self.invalidate_cache_key(cache_key)
                    self._record_cache_miss("raw_query", query_hash)
                    return None
            else:
                self._record_cache_miss("raw_query", query_hash)
                
        except Exception as e:
            print(f"Error retrieving query cache: {e}")
            self._record_cache_miss("raw_query", query_hash)
        
        return None
    
    async def set_expensive_query_cache(self, query_hash: str, results: List[Dict], query_params: Dict = None):
        """Cache results of expensive database queries"""
        if not self.redis:
            return
            
        try:
            cache_key = self._generate_key("raw_query", query_hash)
            ttl = self.ttl_strategies["raw_query"]
            
            cache_data = {
                "data": results,
                "cached_at": datetime.utcnow().isoformat(),
                "ttl": ttl,
                "cache_type": "raw_query",
                "query_hash": query_hash,
                "query_params": query_params,
                "result_count": len(results)
            }
            
            self.redis.setex(cache_key, ttl, json.dumps(cache_data, default=str))
            
        except Exception as e:
            print(f"Error caching query results: {e}")
    
    async def get_aggregation_cache(self, agg_type: str, entity_type: str, time_period: str, filters: Dict = None) -> Optional[Dict]:
        """Get cached aggregation results"""
        if not self.redis:
            return None
            
        try:
            filter_hash = hash(str(sorted(filters.items()))) if filters else "no_filters"
            cache_key = self._generate_key("aggregation", agg_type, entity_type, period=time_period, filters=filter_hash)
            cached_data = self.redis.get(cache_key)
            
            if cached_data:
                self._record_cache_hit("aggregation", f"{agg_type}:{entity_type}")
                data = json.loads(cached_data)
                
                if self._is_cache_fresh(data, self.ttl_strategies["aggregation"]):
                    return data
                else:
                    await self.invalidate_cache_key(cache_key)
                    self._record_cache_miss("aggregation", f"{agg_type}:{entity_type}")
                    return None
            else:
                self._record_cache_miss("aggregation", f"{agg_type}:{entity_type}")
                
        except Exception as e:
            print(f"Error retrieving aggregation cache: {e}")
            self._record_cache_miss("aggregation", f"{agg_type}:{entity_type}")
        
        return None
    
    async def set_aggregation_cache(self, agg_type: str, entity_type: str, time_period: str, results: Dict, filters: Dict = None):
        """Cache aggregation results"""
        if not self.redis:
            return
            
        try:
            filter_hash = hash(str(sorted(filters.items()))) if filters else "no_filters"
            cache_key = self._generate_key("aggregation", agg_type, entity_type, period=time_period, filters=filter_hash)
            ttl = self.ttl_strategies["aggregation"]
            
            cache_data = {
                "data": results,
                "cached_at": datetime.utcnow().isoformat(),
                "ttl": ttl,
                "cache_type": "aggregation",
                "agg_type": agg_type,
                "entity_type": entity_type,
                "time_period": time_period,
                "filters": filters
            }
            
            self.redis.setex(cache_key, ttl, json.dumps(cache_data, default=str))
            
        except Exception as e:
            print(f"Error caching aggregation results: {e}")
    
    async def reset_cache_stats(self):
        """Reset cache hit/miss statistics"""
        self.cache_hit_stats.clear()
        self.cache_miss_stats.clear()
        print("Cache statistics reset")
    
    async def get_cache_health(self) -> Dict:
        """Get cache health metrics"""
        if not self.redis:
            return {"status": "unhealthy", "reason": "Redis not connected"}
        
        try:
            # Test basic operations
            test_key = "analytics:health_check"
            test_value = {"timestamp": datetime.utcnow().isoformat()}
            
            # Test write
            self.redis.setex(test_key, 10, json.dumps(test_value))
            
            # Test read
            retrieved = self.redis.get(test_key)
            if not retrieved:
                return {"status": "unhealthy", "reason": "Failed to retrieve test data"}
            
            # Test delete
            self.redis.delete(test_key)
            
            # Get memory usage
            info = self.redis.info()
            memory_used_mb = info.get("used_memory", 0) / (1024 * 1024)
            memory_limit_mb = 256  # From docker-compose.yml
            memory_usage_percent = (memory_used_mb / memory_limit_mb) * 100
            
            health_status = "healthy"
            if memory_usage_percent > 90:
                health_status = "critical"
            elif memory_usage_percent > 75:
                health_status = "warning"
            
            return {
                "status": health_status,
                "memory_used_mb": round(memory_used_mb, 2),
                "memory_usage_percent": round(memory_usage_percent, 2),
                "connected_clients": info.get("connected_clients", 0),
                "operations_per_second": info.get("instantaneous_ops_per_sec", 0),
                "keyspace_hits": info.get("keyspace_hits", 0),
                "keyspace_misses": info.get("keyspace_misses", 0)
            }
            
        except Exception as e:
            return {"status": "unhealthy", "reason": str(e)}

# Global instances
redis_config = RedisConfig()
analytics_cache = AnalyticsCache(redis_config)

def get_redis_client():
    """Dependency to get Redis client"""
    return redis_config.get_client()

def get_analytics_cache():
    """Dependency to get analytics cache"""
    return analytics_cache