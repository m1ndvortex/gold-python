"""
Cache Management API Endpoints

Provides API endpoints for managing and monitoring the analytics caching system.

Requirements covered: 1.4, 1.5
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import logging

from database import get_db
from redis_config import get_analytics_cache
from services.cache_invalidation_service import get_cache_invalidation_service
from services.cache_performance_service import get_cache_performance_service
from auth import get_current_user
from schemas import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/cache", tags=["Cache Management"])

@router.get("/stats")
async def get_cache_statistics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get comprehensive cache statistics and performance metrics
    """
    try:
        cache = get_analytics_cache()
        cache_stats = cache.get_cache_stats()
        
        invalidation_service = get_cache_invalidation_service(db)
        invalidation_stats = await invalidation_service.get_invalidation_stats()
        
        return {
            "cache_statistics": cache_stats,
            "invalidation_statistics": invalidation_stats,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting cache statistics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get cache statistics: {str(e)}")

@router.get("/health")
async def get_cache_health(
    current_user: User = Depends(get_current_user)
):
    """
    Get cache health status and diagnostics
    """
    try:
        cache = get_analytics_cache()
        health_status = await cache.get_cache_health()
        
        return {
            "health_status": health_status,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting cache health: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get cache health: {str(e)}")

@router.post("/invalidate")
async def invalidate_cache(
    pattern: str,
    current_user: User = Depends(get_current_user)
):
    """
    Manually invalidate cache entries matching a pattern
    """
    try:
        cache = get_analytics_cache()
        await cache.invalidate_by_pattern(pattern)
        
        return {
            "message": f"Cache invalidated for pattern: {pattern}",
            "pattern": pattern,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error invalidating cache: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to invalidate cache: {str(e)}")

@router.post("/invalidate/entity")
async def invalidate_entity_cache(
    entity_type: str,
    entity_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Invalidate all caches related to a specific entity
    """
    try:
        invalidation_service = get_cache_invalidation_service(db)
        await invalidation_service.invalidate_on_data_change(
            table_name=entity_type,
            operation="UPDATE",
            record_id=entity_id
        )
        
        return {
            "message": f"Entity cache invalidated for {entity_type}",
            "entity_type": entity_type,
            "entity_id": entity_id,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error invalidating entity cache: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to invalidate entity cache: {str(e)}")

@router.post("/warm")
async def warm_cache(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Warm up critical caches with frequently accessed data
    """
    try:
        invalidation_service = get_cache_invalidation_service(db)
        
        # Run cache warming in background
        background_tasks.add_task(invalidation_service.warm_critical_caches)
        
        return {
            "message": "Cache warming started in background",
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error starting cache warming: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to start cache warming: {str(e)}")

@router.post("/cleanup")
async def cleanup_cache(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Clean up expired cache entries and optimize cache storage
    """
    try:
        invalidation_service = get_cache_invalidation_service(db)
        
        # Run cleanup in background
        background_tasks.add_task(invalidation_service.schedule_cache_cleanup)
        
        return {
            "message": "Cache cleanup started in background",
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error starting cache cleanup: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to start cache cleanup: {str(e)}")

@router.get("/performance/test")
async def run_performance_test(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Run comprehensive cache performance test
    """
    try:
        performance_service = get_cache_performance_service(db)
        
        # Run performance test
        test_results = await performance_service.run_comprehensive_performance_test()
        
        return {
            "message": "Performance test completed",
            "test_results": test_results,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error running performance test: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to run performance test: {str(e)}")

@router.get("/performance/history")
async def get_performance_history(
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get cache performance test history
    """
    try:
        performance_service = get_cache_performance_service(db)
        history = await performance_service.get_performance_history(limit)
        
        return {
            "performance_history": history,
            "count": len(history),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting performance history: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get performance history: {str(e)}")

@router.post("/performance/stress-test")
async def run_stress_test(
    duration_seconds: int = 60,
    concurrent_users: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Run cache stress test to evaluate performance under load
    """
    try:
        if duration_seconds > 300:  # Limit to 5 minutes
            raise HTTPException(status_code=400, detail="Duration cannot exceed 300 seconds")
        
        if concurrent_users > 50:  # Limit concurrent users
            raise HTTPException(status_code=400, detail="Concurrent users cannot exceed 50")
        
        performance_service = get_cache_performance_service(db)
        stress_test_results = await performance_service.run_cache_stress_test(
            duration_seconds, concurrent_users
        )
        
        return {
            "message": "Stress test completed",
            "stress_test_results": stress_test_results,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error running stress test: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to run stress test: {str(e)}")

@router.get("/analysis")
async def analyze_cache_efficiency(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Analyze cache efficiency and provide optimization recommendations
    """
    try:
        invalidation_service = get_cache_invalidation_service(db)
        analysis = await invalidation_service.analyze_cache_efficiency()
        
        return {
            "cache_analysis": analysis,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error analyzing cache efficiency: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze cache efficiency: {str(e)}")

@router.post("/reset-stats")
async def reset_cache_statistics(
    current_user: User = Depends(get_current_user)
):
    """
    Reset cache hit/miss statistics for fresh measurement
    """
    try:
        cache = get_analytics_cache()
        await cache.reset_cache_stats()
        
        return {
            "message": "Cache statistics reset successfully",
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error resetting cache statistics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to reset cache statistics: {str(e)}")

@router.get("/configuration")
async def get_cache_configuration(
    current_user: User = Depends(get_current_user)
):
    """
    Get current cache configuration and TTL strategies
    """
    try:
        cache = get_analytics_cache()
        
        return {
            "ttl_strategies": cache.ttl_strategies,
            "default_ttl": cache.default_ttl,
            "cache_types": list(cache.ttl_strategies.keys()),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting cache configuration: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get cache configuration: {str(e)}")

@router.put("/configuration/ttl")
async def update_ttl_strategy(
    cache_type: str,
    ttl_seconds: int,
    current_user: User = Depends(get_current_user)
):
    """
    Update TTL strategy for a specific cache type
    """
    try:
        if ttl_seconds < 60 or ttl_seconds > 86400:  # 1 minute to 24 hours
            raise HTTPException(status_code=400, detail="TTL must be between 60 and 86400 seconds")
        
        cache = get_analytics_cache()
        
        if cache_type not in cache.ttl_strategies:
            raise HTTPException(status_code=404, detail=f"Cache type '{cache_type}' not found")
        
        old_ttl = cache.ttl_strategies[cache_type]
        cache.ttl_strategies[cache_type] = ttl_seconds
        
        return {
            "message": f"TTL strategy updated for {cache_type}",
            "cache_type": cache_type,
            "old_ttl_seconds": old_ttl,
            "new_ttl_seconds": ttl_seconds,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating TTL strategy: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update TTL strategy: {str(e)}")

@router.get("/keys")
async def get_cache_keys(
    pattern: str = "analytics:*",
    limit: int = 100,
    current_user: User = Depends(get_current_user)
):
    """
    Get cache keys matching a pattern (for debugging)
    """
    try:
        if limit > 1000:  # Prevent excessive memory usage
            raise HTTPException(status_code=400, detail="Limit cannot exceed 1000")
        
        cache = get_analytics_cache()
        
        if not cache.redis:
            raise HTTPException(status_code=503, detail="Redis not available")
        
        keys = cache.redis.keys(pattern)[:limit]
        
        # Get key details
        key_details = []
        for key in keys:
            try:
                ttl = cache.redis.ttl(key)
                key_type = cache.redis.type(key)
                
                key_details.append({
                    "key": key,
                    "ttl_seconds": ttl,
                    "type": key_type,
                    "expires_at": (datetime.utcnow() + timedelta(seconds=ttl)).isoformat() if ttl > 0 else None
                })
            except:
                key_details.append({
                    "key": key,
                    "error": "Failed to get key details"
                })
        
        return {
            "pattern": pattern,
            "total_keys": len(keys),
            "keys": key_details,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting cache keys: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get cache keys: {str(e)}")

@router.delete("/keys/{key_name}")
async def delete_cache_key(
    key_name: str,
    current_user: User = Depends(get_current_user)
):
    """
    Delete a specific cache key
    """
    try:
        cache = get_analytics_cache()
        await cache.invalidate_cache_key(key_name)
        
        return {
            "message": f"Cache key deleted: {key_name}",
            "key": key_name,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error deleting cache key: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete cache key: {str(e)}")