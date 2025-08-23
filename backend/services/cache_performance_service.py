"""
Cache Performance Testing Service

This service provides comprehensive performance testing for the analytics caching system,
measuring cache hit rates, response times, and overall effectiveness.

Requirements covered: 1.4, 1.5
"""

import time
import asyncio
import statistics
from typing import Dict, List, Any, Optional, Callable
from datetime import datetime, timedelta, date
from sqlalchemy.orm import Session
from sqlalchemy import text
import logging
import json
import uuid
from concurrent.futures import ThreadPoolExecutor
import threading

from redis_config import get_analytics_cache
from services.kpi_calculator_service import FinancialKPICalculator
from services.forecasting_service import ForecastingService
from services.report_engine_service import ReportEngineService

logger = logging.getLogger(__name__)

class CachePerformanceService:
    """
    Service for testing and monitoring cache performance
    """
    
    def __init__(self, db_session: Session):
        self.db = db_session
        self.cache = get_analytics_cache()
        self.performance_results = []
        self.max_results = 1000
        
        # Test scenarios for different cache types
        self.test_scenarios = {
            "kpi_financial": {
                "description": "Financial KPI calculations",
                "cache_type": "kpi",
                "test_function": self._test_financial_kpis,
                "expected_response_time_ms": 500,
                "target_hit_rate": 80
            },
            "kpi_operational": {
                "description": "Operational KPI calculations", 
                "cache_type": "kpi",
                "test_function": self._test_operational_kpis,
                "expected_response_time_ms": 300,
                "target_hit_rate": 75
            },
            "forecasting": {
                "description": "Demand forecasting calculations",
                "cache_type": "forecast",
                "test_function": self._test_forecasting,
                "expected_response_time_ms": 2000,
                "target_hit_rate": 90
            },
            "report_generation": {
                "description": "Custom report generation",
                "cache_type": "report",
                "test_function": self._test_report_generation,
                "expected_response_time_ms": 1000,
                "target_hit_rate": 70
            },
            "chart_data": {
                "description": "Chart data retrieval",
                "cache_type": "chart",
                "test_function": self._test_chart_data,
                "expected_response_time_ms": 200,
                "target_hit_rate": 85
            },
            "aggregations": {
                "description": "Data aggregation queries",
                "cache_type": "aggregation",
                "test_function": self._test_aggregations,
                "expected_response_time_ms": 800,
                "target_hit_rate": 75
            }
        }
    
    async def run_comprehensive_performance_test(self) -> Dict[str, Any]:
        """
        Run comprehensive performance tests for all cache types
        """
        logger.info("Starting comprehensive cache performance test")
        
        test_results = {
            "test_id": str(uuid.uuid4()),
            "started_at": datetime.utcnow().isoformat(),
            "scenarios": {},
            "overall_metrics": {},
            "recommendations": []
        }
        
        try:
            # Reset cache stats for clean measurement
            await self.cache.reset_cache_stats()
            
            # Run tests for each scenario
            for scenario_name, scenario_config in self.test_scenarios.items():
                logger.info(f"Testing scenario: {scenario_name}")
                
                scenario_result = await self._run_scenario_test(scenario_name, scenario_config)
                test_results["scenarios"][scenario_name] = scenario_result
            
            # Calculate overall metrics
            test_results["overall_metrics"] = self._calculate_overall_metrics(test_results["scenarios"])
            
            # Generate recommendations
            test_results["recommendations"] = self._generate_performance_recommendations(test_results)
            
            test_results["completed_at"] = datetime.utcnow().isoformat()
            test_results["duration_seconds"] = (
                datetime.fromisoformat(test_results["completed_at"]) - 
                datetime.fromisoformat(test_results["started_at"])
            ).total_seconds()
            
            # Store results
            self._store_performance_result(test_results)
            
            logger.info("Comprehensive performance test completed")
            return test_results
            
        except Exception as e:
            logger.error(f"Error in comprehensive performance test: {str(e)}")
            test_results["error"] = str(e)
            test_results["status"] = "failed"
            return test_results
    
    async def _run_scenario_test(self, scenario_name: str, scenario_config: Dict[str, Any]) -> Dict[str, Any]:
        """Run performance test for a specific scenario"""
        
        test_function = scenario_config["test_function"]
        expected_response_time = scenario_config["expected_response_time_ms"]
        target_hit_rate = scenario_config["target_hit_rate"]
        
        # Test parameters
        num_iterations = 20
        concurrent_requests = 5
        
        scenario_result = {
            "description": scenario_config["description"],
            "cache_type": scenario_config["cache_type"],
            "num_iterations": num_iterations,
            "concurrent_requests": concurrent_requests,
            "response_times": [],
            "cache_hits": 0,
            "cache_misses": 0,
            "errors": 0,
            "started_at": datetime.utcnow().isoformat()
        }
        
        try:
            # Run multiple iterations to test cache effectiveness
            for iteration in range(num_iterations):
                # Run concurrent requests to simulate real load
                tasks = []
                for _ in range(concurrent_requests):
                    tasks.append(self._run_single_test(test_function, scenario_name))
                
                # Execute concurrent requests
                results = await asyncio.gather(*tasks, return_exceptions=True)
                
                # Process results
                for result in results:
                    if isinstance(result, Exception):
                        scenario_result["errors"] += 1
                        logger.error(f"Test error in {scenario_name}: {str(result)}")
                    else:
                        scenario_result["response_times"].append(result["response_time_ms"])
                        if result["cache_hit"]:
                            scenario_result["cache_hits"] += 1
                        else:
                            scenario_result["cache_misses"] += 1
                
                # Small delay between iterations
                await asyncio.sleep(0.1)
            
            # Calculate metrics
            if scenario_result["response_times"]:
                scenario_result["avg_response_time_ms"] = statistics.mean(scenario_result["response_times"])
                scenario_result["median_response_time_ms"] = statistics.median(scenario_result["response_times"])
                scenario_result["min_response_time_ms"] = min(scenario_result["response_times"])
                scenario_result["max_response_time_ms"] = max(scenario_result["response_times"])
                scenario_result["p95_response_time_ms"] = self._calculate_percentile(scenario_result["response_times"], 95)
                scenario_result["p99_response_time_ms"] = self._calculate_percentile(scenario_result["response_times"], 99)
            
            total_requests = scenario_result["cache_hits"] + scenario_result["cache_misses"]
            scenario_result["hit_rate_percent"] = (scenario_result["cache_hits"] / total_requests * 100) if total_requests > 0 else 0
            scenario_result["total_requests"] = total_requests
            
            # Performance assessment
            scenario_result["performance_assessment"] = self._assess_scenario_performance(
                scenario_result, expected_response_time, target_hit_rate
            )
            
            scenario_result["completed_at"] = datetime.utcnow().isoformat()
            
        except Exception as e:
            logger.error(f"Error in scenario test {scenario_name}: {str(e)}")
            scenario_result["error"] = str(e)
            scenario_result["status"] = "failed"
        
        return scenario_result
    
    async def _run_single_test(self, test_function: Callable, scenario_name: str) -> Dict[str, Any]:
        """Run a single test iteration"""
        
        start_time = time.time()
        cache_hit = False
        
        try:
            # Check if data is in cache before test
            cache_key_before = await self._get_cache_key_count()
            
            # Run the test function
            result = await test_function()
            
            # Check if cache was used
            cache_key_after = await self._get_cache_key_count()
            cache_hit = cache_key_after >= cache_key_before  # Simplified cache hit detection
            
            end_time = time.time()
            response_time_ms = (end_time - start_time) * 1000
            
            return {
                "response_time_ms": response_time_ms,
                "cache_hit": cache_hit,
                "success": True,
                "result_size": len(str(result)) if result else 0
            }
            
        except Exception as e:
            end_time = time.time()
            response_time_ms = (end_time - start_time) * 1000
            
            return {
                "response_time_ms": response_time_ms,
                "cache_hit": False,
                "success": False,
                "error": str(e)
            }
    
    async def _get_cache_key_count(self) -> int:
        """Get current number of cache keys (simplified cache hit detection)"""
        try:
            if self.cache.redis:
                return len(self.cache.redis.keys("analytics:*"))
        except:
            pass
        return 0
    
    async def _test_financial_kpis(self) -> Dict[str, Any]:
        """Test financial KPI calculations"""
        calculator = FinancialKPICalculator(self.db)
        
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=30)
        
        targets = {"revenue": 100000, "profit_margin": 0.25}
        
        return await calculator.calculate_revenue_kpis(start_date, end_date, targets)
    
    async def _test_operational_kpis(self) -> Dict[str, Any]:
        """Test operational KPI calculations"""
        # Simplified operational KPI test
        query = text("""
            SELECT 
                COUNT(*) as total_items,
                SUM(stock_quantity) as total_stock,
                AVG(stock_quantity) as avg_stock
            FROM inventory_items
            WHERE stock_quantity > 0
        """)
        
        result = self.db.execute(query).fetchone()
        
        return {
            "total_items": result.total_items,
            "total_stock": float(result.total_stock or 0),
            "avg_stock": float(result.avg_stock or 0)
        }
    
    async def _test_forecasting(self) -> Dict[str, Any]:
        """Test demand forecasting"""
        # Get a sample inventory item for forecasting
        item_query = text("SELECT id FROM inventory_items LIMIT 1")
        item_result = self.db.execute(item_query).fetchone()
        
        if not item_result:
            return {"error": "No inventory items found for forecasting test"}
        
        forecasting_service = ForecastingService(self.db)
        
        try:
            forecast = await forecasting_service.forecast_demand(
                str(item_result.id), 
                periods=30, 
                model_type='linear_regression'
            )
            
            return {
                "item_id": forecast.item_id,
                "predictions_count": len(forecast.predictions),
                "confidence_score": forecast.confidence_score,
                "model_used": forecast.model_used
            }
        except Exception as e:
            return {"error": str(e)}
    
    async def _test_report_generation(self) -> Dict[str, Any]:
        """Test custom report generation"""
        report_engine = ReportEngineService(self.db)
        
        # Simple report configuration
        report_config = {
            "name": "Performance Test Report",
            "data_sources": [{"name": "invoices"}],
            "fields": ["id", "total_amount", "status", "created_at"],
            "filters": [
                {
                    "field": "created_at",
                    "operator": "greater_than",
                    "value": (datetime.now() - timedelta(days=30)).isoformat()
                }
            ]
        }
        
        try:
            report = await report_engine.build_custom_report(report_config)
            return {
                "report_id": report["report_id"],
                "total_records": report["total_records"],
                "data_sources": len(report["data_sources"])
            }
        except Exception as e:
            return {"error": str(e)}
    
    async def _test_chart_data(self) -> Dict[str, Any]:
        """Test chart data retrieval"""
        # Simulate chart data query
        query = text("""
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as transaction_count,
                SUM(total_amount) as total_revenue
            FROM invoices 
            WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY DATE(created_at)
            ORDER BY date
        """)
        
        result = self.db.execute(query).fetchall()
        
        chart_data = [
            {
                "date": row.date.isoformat(),
                "transaction_count": row.transaction_count,
                "total_revenue": float(row.total_revenue or 0)
            }
            for row in result
        ]
        
        return {
            "data_points": len(chart_data),
            "date_range": "30_days",
            "chart_type": "revenue_trend"
        }
    
    async def _test_aggregations(self) -> Dict[str, Any]:
        """Test data aggregation queries"""
        # Complex aggregation query
        query = text("""
            SELECT 
                c.name as category_name,
                COUNT(DISTINCT ii.id) as item_count,
                SUM(ii.stock_quantity) as total_stock,
                AVG(ii.purchase_price) as avg_purchase_price,
                SUM(CASE WHEN ii.stock_quantity < ii.min_stock_level THEN 1 ELSE 0 END) as low_stock_items
            FROM inventory_items ii
            JOIN categories c ON ii.category_id = c.id
            GROUP BY c.id, c.name
            ORDER BY total_stock DESC
        """)
        
        result = self.db.execute(query).fetchall()
        
        aggregation_data = [
            {
                "category_name": row.category_name,
                "item_count": row.item_count,
                "total_stock": row.total_stock,
                "avg_purchase_price": float(row.avg_purchase_price or 0),
                "low_stock_items": row.low_stock_items
            }
            for row in result
        ]
        
        return {
            "categories": len(aggregation_data),
            "aggregation_type": "category_summary"
        }
    
    def _calculate_percentile(self, values: List[float], percentile: int) -> float:
        """Calculate percentile value"""
        if not values:
            return 0.0
        
        sorted_values = sorted(values)
        index = (percentile / 100) * (len(sorted_values) - 1)
        
        if index.is_integer():
            return sorted_values[int(index)]
        else:
            lower_index = int(index)
            upper_index = lower_index + 1
            weight = index - lower_index
            return sorted_values[lower_index] * (1 - weight) + sorted_values[upper_index] * weight
    
    def _assess_scenario_performance(
        self, 
        scenario_result: Dict[str, Any], 
        expected_response_time: float, 
        target_hit_rate: float
    ) -> Dict[str, Any]:
        """Assess performance of a scenario"""
        
        assessment = {
            "overall_score": 0,
            "response_time_score": 0,
            "hit_rate_score": 0,
            "reliability_score": 0,
            "status": "unknown"
        }
        
        try:
            # Response time assessment
            avg_response_time = scenario_result.get("avg_response_time_ms", float('inf'))
            if avg_response_time <= expected_response_time:
                assessment["response_time_score"] = 100
            elif avg_response_time <= expected_response_time * 1.5:
                assessment["response_time_score"] = 75
            elif avg_response_time <= expected_response_time * 2:
                assessment["response_time_score"] = 50
            else:
                assessment["response_time_score"] = 25
            
            # Hit rate assessment
            hit_rate = scenario_result.get("hit_rate_percent", 0)
            if hit_rate >= target_hit_rate:
                assessment["hit_rate_score"] = 100
            elif hit_rate >= target_hit_rate * 0.8:
                assessment["hit_rate_score"] = 75
            elif hit_rate >= target_hit_rate * 0.6:
                assessment["hit_rate_score"] = 50
            else:
                assessment["hit_rate_score"] = 25
            
            # Reliability assessment
            total_requests = scenario_result.get("total_requests", 0)
            errors = scenario_result.get("errors", 0)
            error_rate = (errors / total_requests * 100) if total_requests > 0 else 0
            
            if error_rate == 0:
                assessment["reliability_score"] = 100
            elif error_rate <= 1:
                assessment["reliability_score"] = 90
            elif error_rate <= 5:
                assessment["reliability_score"] = 70
            else:
                assessment["reliability_score"] = 50
            
            # Overall score
            assessment["overall_score"] = (
                assessment["response_time_score"] * 0.4 +
                assessment["hit_rate_score"] * 0.4 +
                assessment["reliability_score"] * 0.2
            )
            
            # Status determination
            if assessment["overall_score"] >= 90:
                assessment["status"] = "excellent"
            elif assessment["overall_score"] >= 75:
                assessment["status"] = "good"
            elif assessment["overall_score"] >= 60:
                assessment["status"] = "acceptable"
            else:
                assessment["status"] = "needs_improvement"
            
        except Exception as e:
            logger.error(f"Error assessing scenario performance: {str(e)}")
            assessment["error"] = str(e)
        
        return assessment
    
    def _calculate_overall_metrics(self, scenarios: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate overall performance metrics across all scenarios"""
        
        overall_metrics = {
            "total_scenarios": len(scenarios),
            "successful_scenarios": 0,
            "failed_scenarios": 0,
            "avg_response_time_ms": 0,
            "avg_hit_rate_percent": 0,
            "total_requests": 0,
            "total_errors": 0,
            "overall_score": 0
        }
        
        response_times = []
        hit_rates = []
        scores = []
        
        for scenario_name, scenario_result in scenarios.items():
            if scenario_result.get("error"):
                overall_metrics["failed_scenarios"] += 1
                continue
            
            overall_metrics["successful_scenarios"] += 1
            overall_metrics["total_requests"] += scenario_result.get("total_requests", 0)
            overall_metrics["total_errors"] += scenario_result.get("errors", 0)
            
            if "avg_response_time_ms" in scenario_result:
                response_times.append(scenario_result["avg_response_time_ms"])
            
            if "hit_rate_percent" in scenario_result:
                hit_rates.append(scenario_result["hit_rate_percent"])
            
            performance_assessment = scenario_result.get("performance_assessment", {})
            if "overall_score" in performance_assessment:
                scores.append(performance_assessment["overall_score"])
        
        # Calculate averages
        if response_times:
            overall_metrics["avg_response_time_ms"] = statistics.mean(response_times)
        
        if hit_rates:
            overall_metrics["avg_hit_rate_percent"] = statistics.mean(hit_rates)
        
        if scores:
            overall_metrics["overall_score"] = statistics.mean(scores)
        
        # Error rate
        overall_metrics["error_rate_percent"] = (
            overall_metrics["total_errors"] / overall_metrics["total_requests"] * 100
        ) if overall_metrics["total_requests"] > 0 else 0
        
        return overall_metrics
    
    def _generate_performance_recommendations(self, test_results: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate performance optimization recommendations"""
        
        recommendations = []
        overall_metrics = test_results.get("overall_metrics", {})
        scenarios = test_results.get("scenarios", {})
        
        # Overall performance recommendations
        overall_score = overall_metrics.get("overall_score", 0)
        if overall_score < 70:
            recommendations.append({
                "type": "critical",
                "category": "overall_performance",
                "message": f"Overall cache performance score is {overall_score:.1f}%. Immediate optimization required.",
                "suggestions": [
                    "Review TTL strategies for frequently accessed data",
                    "Implement cache warming for critical data",
                    "Optimize cache invalidation patterns"
                ]
            })
        
        # Hit rate recommendations
        avg_hit_rate = overall_metrics.get("avg_hit_rate_percent", 0)
        if avg_hit_rate < 70:
            recommendations.append({
                "type": "warning",
                "category": "hit_rate",
                "message": f"Average cache hit rate is {avg_hit_rate:.1f}%. Consider increasing TTL values.",
                "suggestions": [
                    "Increase TTL for stable data types",
                    "Implement predictive cache warming",
                    "Review cache invalidation frequency"
                ]
            })
        
        # Response time recommendations
        avg_response_time = overall_metrics.get("avg_response_time_ms", 0)
        if avg_response_time > 1000:
            recommendations.append({
                "type": "warning",
                "category": "response_time",
                "message": f"Average response time is {avg_response_time:.1f}ms. Performance optimization needed.",
                "suggestions": [
                    "Optimize database queries",
                    "Implement more aggressive caching",
                    "Consider data pre-aggregation"
                ]
            })
        
        # Scenario-specific recommendations
        for scenario_name, scenario_result in scenarios.items():
            performance_assessment = scenario_result.get("performance_assessment", {})
            status = performance_assessment.get("status", "unknown")
            
            if status == "needs_improvement":
                recommendations.append({
                    "type": "info",
                    "category": "scenario_specific",
                    "message": f"Scenario '{scenario_name}' needs performance improvement.",
                    "scenario": scenario_name,
                    "suggestions": [
                        f"Optimize {scenario_result.get('cache_type', 'unknown')} cache strategy",
                        "Review query complexity and indexing",
                        "Consider increasing cache TTL"
                    ]
                })
        
        return recommendations
    
    def _store_performance_result(self, result: Dict[str, Any]):
        """Store performance test result"""
        self.performance_results.append(result)
        
        # Keep results manageable
        if len(self.performance_results) > self.max_results:
            self.performance_results = self.performance_results[-self.max_results:]
    
    async def get_performance_history(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get performance test history"""
        return self.performance_results[-limit:] if self.performance_results else []
    
    async def run_cache_stress_test(self, duration_seconds: int = 60, concurrent_users: int = 10) -> Dict[str, Any]:
        """Run stress test to evaluate cache performance under load"""
        
        logger.info(f"Starting cache stress test: {duration_seconds}s with {concurrent_users} concurrent users")
        
        stress_test_result = {
            "test_id": str(uuid.uuid4()),
            "started_at": datetime.utcnow().isoformat(),
            "duration_seconds": duration_seconds,
            "concurrent_users": concurrent_users,
            "total_requests": 0,
            "successful_requests": 0,
            "failed_requests": 0,
            "response_times": [],
            "cache_hits": 0,
            "cache_misses": 0
        }
        
        try:
            # Reset cache stats
            await self.cache.reset_cache_stats()
            
            # Run stress test
            end_time = time.time() + duration_seconds
            tasks = []
            
            # Create concurrent user tasks
            for user_id in range(concurrent_users):
                task = asyncio.create_task(
                    self._run_stress_test_user(user_id, end_time, stress_test_result)
                )
                tasks.append(task)
            
            # Wait for all tasks to complete
            await asyncio.gather(*tasks)
            
            # Calculate final metrics
            if stress_test_result["response_times"]:
                stress_test_result["avg_response_time_ms"] = statistics.mean(stress_test_result["response_times"])
                stress_test_result["median_response_time_ms"] = statistics.median(stress_test_result["response_times"])
                stress_test_result["p95_response_time_ms"] = self._calculate_percentile(stress_test_result["response_times"], 95)
                stress_test_result["p99_response_time_ms"] = self._calculate_percentile(stress_test_result["response_times"], 99)
            
            total_cache_requests = stress_test_result["cache_hits"] + stress_test_result["cache_misses"]
            stress_test_result["hit_rate_percent"] = (
                stress_test_result["cache_hits"] / total_cache_requests * 100
            ) if total_cache_requests > 0 else 0
            
            stress_test_result["requests_per_second"] = (
                stress_test_result["total_requests"] / duration_seconds
            ) if duration_seconds > 0 else 0
            
            stress_test_result["completed_at"] = datetime.utcnow().isoformat()
            stress_test_result["status"] = "completed"
            
            logger.info("Cache stress test completed successfully")
            
        except Exception as e:
            logger.error(f"Error in cache stress test: {str(e)}")
            stress_test_result["error"] = str(e)
            stress_test_result["status"] = "failed"
        
        return stress_test_result
    
    async def _run_stress_test_user(self, user_id: int, end_time: float, result: Dict[str, Any]):
        """Run stress test for a single simulated user"""
        
        test_functions = [
            self._test_financial_kpis,
            self._test_operational_kpis,
            self._test_chart_data,
            self._test_aggregations
        ]
        
        while time.time() < end_time:
            try:
                # Randomly select a test function
                import random
                test_function = random.choice(test_functions)
                
                # Execute test
                start_time = time.time()
                await test_function()
                end_time_req = time.time()
                
                response_time_ms = (end_time_req - start_time) * 1000
                
                # Update results (thread-safe)
                result["total_requests"] += 1
                result["successful_requests"] += 1
                result["response_times"].append(response_time_ms)
                
                # Simulate cache hit/miss (simplified)
                if response_time_ms < 100:  # Fast response likely indicates cache hit
                    result["cache_hits"] += 1
                else:
                    result["cache_misses"] += 1
                
                # Small delay to simulate realistic user behavior
                await asyncio.sleep(0.1)
                
            except Exception as e:
                result["failed_requests"] += 1
                logger.debug(f"Stress test user {user_id} error: {str(e)}")

# Global instance
cache_performance_service = None

def get_cache_performance_service(db: Session) -> CachePerformanceService:
    """Get cache performance service instance"""
    global cache_performance_service
    if cache_performance_service is None:
        cache_performance_service = CachePerformanceService(db)
    return cache_performance_service