"""
Redis Configuration for Analytics Caching
Provides Redis connection and caching utilities for the analytics system
"""

import redis
import json
import os
from typing import Optional, Any, Dict
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
    """Analytics-specific caching utilities"""
    
    def __init__(self, redis_config: RedisConfig):
        self.redis = redis_config.get_client()
        self.default_ttl = 300  # 5 minutes default TTL
        
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
        """Get cached KPI data"""
        if not self.redis:
            return None
            
        try:
            cache_key = self._generate_key("kpi", kpi_type, kpi_name, period=period)
            cached_data = self.redis.get(cache_key)
            
            if cached_data:
                return json.loads(cached_data)
        except Exception as e:
            print(f"Error retrieving KPI cache: {e}")
        
        return None
    
    async def set_kpi_data(self, kpi_type: str, kpi_name: str, data: Dict, ttl: int = None, period: str = None):
        """Cache KPI data"""
        if not self.redis:
            return
            
        try:
            cache_key = self._generate_key("kpi", kpi_type, kpi_name, period=period)
            ttl = ttl or self.default_ttl
            
            # Add metadata
            cache_data = {
                "data": data,
                "cached_at": datetime.utcnow().isoformat(),
                "ttl": ttl
            }
            
            self.redis.setex(cache_key, ttl, json.dumps(cache_data, default=str))
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
            cache_key = self._generate_key("chart", chart_type, entity_type, entity_id, **params)
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
            cache_key = self._generate_key("chart", chart_type, entity_type, entity_id, **params)
            
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
        """Get cache statistics"""
        if not self.redis:
            return {"status": "disconnected"}
            
        try:
            info = self.redis.info()
            analytics_keys = len(self.redis.keys("analytics:*"))
            
            return {
                "status": "connected",
                "total_keys": info.get("db0", {}).get("keys", 0),
                "analytics_keys": analytics_keys,
                "memory_used": info.get("used_memory_human", "0B"),
                "memory_peak": info.get("used_memory_peak_human", "0B"),
                "connected_clients": info.get("connected_clients", 0),
                "uptime_seconds": info.get("uptime_in_seconds", 0)
            }
        except Exception as e:
            return {"status": "error", "error": str(e)}

# Global instances
redis_config = RedisConfig()
analytics_cache = AnalyticsCache(redis_config)

def get_redis_client():
    """Dependency to get Redis client"""
    return redis_config.get_client()

def get_analytics_cache():
    """Dependency to get analytics cache"""
    return analytics_cache