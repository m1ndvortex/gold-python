"""
Performance Tests for Database Query Optimization
Task 12.2: Test query execution times and database load after optimization

This test suite validates the performance improvements from database optimizations:
- Tests query execution times for common analytics queries
- Validates materialized view performance
- Tests index effectiveness
- Measures database load under concurrent queries
"""

import pytest
import asyncio
import time
import statistics
from datetime import datetime, timedelta, date
from decimal import Decimal
from typing import List, Dict, Any
from sqlalchemy import text, create_engine
from sqlalchemy.orm import sessionmaker
import concurrent.futures
import psutil
import logging

from database import get_db, engine
from models import Invoice, InvoiceItem, InventoryItem, Customer, Category

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DatabasePerformanceTest:
    """Test suite for database optimization performance validation"""
    
    def __init__(self):
        self.db_session = next(get_db())
        self.test_results = []
        
    def measure_query_time(self, query_name: str, query_func, *args, **kwargs):
        """Measure query execution time and log results"""
        start_time = time.time()
        try:
            result = query_func(*args, **kwargs)
            execution_time = (time.time() - start_time) * 1000  # Convert to milliseconds
            
            # Count rows if result is iterable
            row_count = 0
            if hasattr(result, '__iter__'):
                try:
                    row_count = len(list(result))
                except:
                    row_count = 1
            elif result is not None:
                row_count = 1
                
            self.test_results.append({
                'query_name': query_name,
                'execution_time_ms': execution_time,
                'row_count': row_count,
                'timestamp': datetime.now()
            })
            
            logger.info(f"{query_name}: {execution_time:.2f}ms, {row_count} rows")
            return result, execution_time
            
        except Exception as e:
            execution_time = (time.time() - start_time) * 1000
            logger.error(f"{query_name} failed: {str(e)} (took {execution_time:.2f}ms)")
            raise

    def test_basic_analytics_queries(self):
        """Test basic analytics queries performance"""
        logger.info("Testing basic analytics queries...")
        
        # Test 1: Daily sales summary query
        def daily_sales_query():
            return self.db_session.execute(text("""
                SELECT 
                    DATE(created_at) as sale_date,
                    COUNT(*) as transaction_count,
                    SUM(total_amount) as total_revenue,
                    AVG(total_amount) as avg_transaction_value
                FROM invoices 
                WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
                    AND status = 'completed'
                GROUP BY DATE(created_at)
                ORDER BY sale_date DESC
            """)).fetchall()
        
        self.measure_query_time("daily_sales_raw_query", daily_sales_query)
        
        # Test 2: Daily sales from materialized view
        def daily_sales_materialized():
            return self.db_session.execute(text("""
                SELECT sale_date, transaction_count, total_revenue, avg_transaction_value
                FROM analytics.daily_sales_summary
                WHERE sale_date >= CURRENT_DATE - INTERVAL '30 days'
                ORDER BY sale_date DESC
            """)).fetchall()
        
        self.measure_query_time("daily_sales_materialized_view", daily_sales_materialized)
        
        # Test 3: Monthly revenue trend
        def monthly_revenue_query():
            return self.db_session.execute(text("""
                SELECT 
                    EXTRACT(YEAR FROM created_at) as year,
                    EXTRACT(MONTH FROM created_at) as month,
                    SUM(total_amount) as total_revenue,
                    COUNT(*) as transaction_count
                FROM invoices 
                WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
                    AND status = 'completed'
                GROUP BY EXTRACT(YEAR FROM created_at), EXTRACT(MONTH FROM created_at)
                ORDER BY year DESC, month DESC
            """)).fetchall()
        
        self.measure_query_time("monthly_revenue_raw_query", monthly_revenue_query)
        
        # Test 4: Monthly revenue from materialized view
        def monthly_revenue_materialized():
            return self.db_session.execute(text("""
                SELECT year, month, total_revenue, transaction_count
                FROM analytics.monthly_sales_summary
                WHERE month_start >= CURRENT_DATE - INTERVAL '12 months'
                ORDER BY year DESC, month DESC
            """)).fetchall()
        
        self.measure_query_time("monthly_revenue_materialized_view", monthly_revenue_materialized)

    def test_inventory_analytics_queries(self):
        """Test inventory analytics queries performance"""
        logger.info("Testing inventory analytics queries...")
        
        # Test 1: Inventory turnover raw query
        def inventory_turnover_raw():
            return self.db_session.execute(text("""
                SELECT 
                    inv.id,
                    inv.name,
                    cat.name as category_name,
                    inv.stock_quantity,
                    COALESCE(SUM(ii.quantity), 0) as units_sold_30d,
                    CASE 
                        WHEN inv.stock_quantity > 0 
                        THEN COALESCE(SUM(ii.quantity), 0)::DECIMAL / inv.stock_quantity
                        ELSE 0 
                    END as turnover_ratio
                FROM inventory_items inv
                LEFT JOIN categories cat ON inv.category_id = cat.id
                LEFT JOIN invoice_items ii ON inv.id = ii.inventory_item_id
                LEFT JOIN invoices i ON ii.invoice_id = i.id 
                    AND i.created_at >= CURRENT_DATE - INTERVAL '30 days'
                    AND i.status = 'completed'
                WHERE inv.is_active = true
                GROUP BY inv.id, inv.name, cat.name, inv.stock_quantity
                ORDER BY turnover_ratio DESC
                LIMIT 100
            """)).fetchall()
        
        self.measure_query_time("inventory_turnover_raw_query", inventory_turnover_raw)
        
        # Test 2: Inventory turnover from materialized view
        def inventory_turnover_materialized():
            return self.db_session.execute(text("""
                SELECT 
                    item_id, item_name, category_name, current_stock,
                    units_sold_30d, turnover_ratio_30d, movement_classification
                FROM analytics.inventory_turnover_summary
                ORDER BY turnover_ratio_30d DESC
                LIMIT 100
            """)).fetchall()
        
        self.measure_query_time("inventory_turnover_materialized_view", inventory_turnover_materialized)
        
        # Test 3: Dead stock analysis
        def dead_stock_query():
            return self.db_session.execute(text("""
                SELECT item_id, item_name, category_name, current_stock, inventory_value
                FROM analytics.inventory_turnover_summary
                WHERE movement_classification = 'dead'
                ORDER BY inventory_value DESC
            """)).fetchall()
        
        self.measure_query_time("dead_stock_analysis", dead_stock_query)
        
        # Test 4: Fast moving items
        def fast_moving_query():
            return self.db_session.execute(text("""
                SELECT item_id, item_name, category_name, velocity_score, turnover_ratio_30d
                FROM analytics.inventory_turnover_summary
                WHERE movement_classification = 'fast'
                ORDER BY velocity_score DESC
                LIMIT 50
            """)).fetchall()
        
        self.measure_query_time("fast_moving_items", fast_moving_query)

    def test_customer_analytics_queries(self):
        """Test customer analytics queries performance"""
        logger.info("Testing customer analytics queries...")
        
        # Test 1: Customer segmentation raw query
        def customer_segmentation_raw():
            return self.db_session.execute(text("""
                SELECT 
                    c.id,
                    c.name,
                    c.total_purchases,
                    c.current_debt,
                    COUNT(i.id) as total_transactions,
                    CASE 
                        WHEN c.total_purchases > 50000 THEN 'high_value'
                        WHEN c.total_purchases > 20000 THEN 'medium_value'
                        WHEN c.total_purchases > 5000 THEN 'regular'
                        ELSE 'new'
                    END as value_segment
                FROM customers c
                LEFT JOIN invoices i ON c.id = i.customer_id AND i.status = 'completed'
                WHERE c.is_active = true
                GROUP BY c.id, c.name, c.total_purchases, c.current_debt
                ORDER BY c.total_purchases DESC
                LIMIT 100
            """)).fetchall()
        
        self.measure_query_time("customer_segmentation_raw_query", customer_segmentation_raw)
        
        # Test 2: Customer segmentation from materialized view
        def customer_segmentation_materialized():
            return self.db_session.execute(text("""
                SELECT 
                    customer_id, customer_name, total_purchases, current_debt,
                    total_transactions, value_segment, activity_segment, estimated_clv
                FROM analytics.customer_analytics_summary
                ORDER BY total_purchases DESC
                LIMIT 100
            """)).fetchall()
        
        self.measure_query_time("customer_segmentation_materialized_view", customer_segmentation_materialized)
        
        # Test 3: High-value customers
        def high_value_customers():
            return self.db_session.execute(text("""
                SELECT customer_id, customer_name, total_purchases, estimated_clv
                FROM analytics.customer_analytics_summary
                WHERE value_segment = 'high_value'
                ORDER BY estimated_clv DESC
            """)).fetchall()
        
        self.measure_query_time("high_value_customers", high_value_customers)
        
        # Test 4: At-risk customers
        def at_risk_customers():
            return self.db_session.execute(text("""
                SELECT customer_id, customer_name, days_since_last_purchase, total_purchases
                FROM analytics.customer_analytics_summary
                WHERE activity_segment = 'at_risk'
                ORDER BY total_purchases DESC
            """)).fetchall()
        
        self.measure_query_time("at_risk_customers", at_risk_customers)

    def test_category_performance_queries(self):
        """Test category performance queries performance"""
        logger.info("Testing category performance queries...")
        
        # Test 1: Category performance raw query
        def category_performance_raw():
            return self.db_session.execute(text("""
                SELECT 
                    cat.id,
                    cat.name,
                    COUNT(inv.id) as total_items,
                    SUM(inv.stock_quantity * inv.purchase_price) as inventory_value,
                    COALESCE(SUM(ii.total_price), 0) as revenue_30d
                FROM categories cat
                LEFT JOIN inventory_items inv ON cat.id = inv.category_id AND inv.is_active = true
                LEFT JOIN invoice_items ii ON inv.id = ii.inventory_item_id
                LEFT JOIN invoices i ON ii.invoice_id = i.id 
                    AND i.created_at >= CURRENT_DATE - INTERVAL '30 days'
                    AND i.status = 'completed'
                WHERE cat.is_active = true
                GROUP BY cat.id, cat.name
                ORDER BY revenue_30d DESC
            """)).fetchall()
        
        self.measure_query_time("category_performance_raw_query", category_performance_raw)
        
        # Test 2: Category performance from materialized view
        def category_performance_materialized():
            return self.db_session.execute(text("""
                SELECT 
                    category_id, category_name, total_items, total_inventory_value,
                    revenue_30d, profit_30d, performance_category
                FROM analytics.category_performance_summary
                ORDER BY revenue_30d DESC
            """)).fetchall()
        
        self.measure_query_time("category_performance_materialized_view", category_performance_materialized)

    def test_complex_analytics_queries(self):
        """Test complex analytics queries that combine multiple tables"""
        logger.info("Testing complex analytics queries...")
        
        # Test 1: Comprehensive KPI calculation
        def comprehensive_kpi_query():
            return self.db_session.execute(text("""
                WITH revenue_data AS (
                    SELECT 
                        SUM(total_revenue) as total_revenue,
                        SUM(transaction_count) as total_transactions,
                        AVG(avg_transaction_value) as avg_transaction_value
                    FROM analytics.daily_sales_summary
                    WHERE sale_date >= CURRENT_DATE - INTERVAL '30 days'
                ),
                inventory_data AS (
                    SELECT 
                        COUNT(*) as total_items,
                        SUM(inventory_value) as total_inventory_value,
                        AVG(velocity_score) as avg_velocity_score
                    FROM analytics.inventory_turnover_summary
                ),
                customer_data AS (
                    SELECT 
                        COUNT(*) as total_customers,
                        AVG(estimated_clv) as avg_clv,
                        COUNT(CASE WHEN activity_segment = 'active' THEN 1 END) as active_customers
                    FROM analytics.customer_analytics_summary
                )
                SELECT 
                    rd.total_revenue,
                    rd.total_transactions,
                    rd.avg_transaction_value,
                    id.total_items,
                    id.total_inventory_value,
                    id.avg_velocity_score,
                    cd.total_customers,
                    cd.avg_clv,
                    cd.active_customers
                FROM revenue_data rd
                CROSS JOIN inventory_data id
                CROSS JOIN customer_data cd
            """)).fetchone()
        
        self.measure_query_time("comprehensive_kpi_calculation", comprehensive_kpi_query)
        
        # Test 2: Profit analysis by category and time
        def profit_analysis_query():
            return self.db_session.execute(text("""
                SELECT 
                    cps.category_name,
                    cps.revenue_30d,
                    cps.profit_30d,
                    cps.profit_margin_30d,
                    cps.inventory_turnover_30d,
                    cps.performance_category
                FROM analytics.category_performance_summary cps
                WHERE cps.revenue_30d > 0
                ORDER BY cps.profit_margin_30d DESC
                LIMIT 20
            """)).fetchall()
        
        self.measure_query_time("profit_analysis_by_category", profit_analysis_query)

    def test_concurrent_query_performance(self):
        """Test database performance under concurrent load"""
        logger.info("Testing concurrent query performance...")
        
        def run_concurrent_query(query_name: str, query_sql: str):
            """Run a single query and measure its performance"""
            session = sessionmaker(bind=engine)()
            start_time = time.time()
            try:
                result = session.execute(text(query_sql)).fetchall()
                execution_time = (time.time() - start_time) * 1000
                return {
                    'query_name': query_name,
                    'execution_time_ms': execution_time,
                    'row_count': len(result),
                    'success': True
                }
            except Exception as e:
                execution_time = (time.time() - start_time) * 1000
                return {
                    'query_name': query_name,
                    'execution_time_ms': execution_time,
                    'error': str(e),
                    'success': False
                }
            finally:
                session.close()
        
        # Define concurrent test queries
        test_queries = [
            ("daily_sales_mv", "SELECT * FROM analytics.daily_sales_summary WHERE sale_date >= CURRENT_DATE - INTERVAL '7 days'"),
            ("inventory_turnover_mv", "SELECT * FROM analytics.inventory_turnover_summary WHERE movement_classification != 'dead' LIMIT 50"),
            ("customer_analytics_mv", "SELECT * FROM analytics.customer_analytics_summary WHERE value_segment = 'high_value' LIMIT 30"),
            ("category_performance_mv", "SELECT * FROM analytics.category_performance_summary WHERE performance_category != 'inactive'"),
            ("revenue_trend", "SELECT * FROM analytics.monthly_sales_summary WHERE year >= EXTRACT(YEAR FROM CURRENT_DATE) - 1")
        ]
        
        # Run queries concurrently
        concurrent_results = []
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            # Submit multiple instances of each query
            futures = []
            for _ in range(3):  # Run each query 3 times concurrently
                for query_name, query_sql in test_queries:
                    future = executor.submit(run_concurrent_query, query_name, query_sql)
                    futures.append(future)
            
            # Collect results
            for future in concurrent.futures.as_completed(futures):
                result = future.result()
                concurrent_results.append(result)
                if result['success']:
                    logger.info(f"Concurrent {result['query_name']}: {result['execution_time_ms']:.2f}ms")
                else:
                    logger.error(f"Concurrent {result['query_name']} failed: {result.get('error', 'Unknown error')}")
        
        # Analyze concurrent performance
        successful_queries = [r for r in concurrent_results if r['success']]
        if successful_queries:
            avg_time = statistics.mean([r['execution_time_ms'] for r in successful_queries])
            max_time = max([r['execution_time_ms'] for r in successful_queries])
            min_time = min([r['execution_time_ms'] for r in successful_queries])
            
            logger.info(f"Concurrent query performance - Avg: {avg_time:.2f}ms, Min: {min_time:.2f}ms, Max: {max_time:.2f}ms")
            
            self.test_results.append({
                'query_name': 'concurrent_performance_summary',
                'execution_time_ms': avg_time,
                'row_count': len(successful_queries),
                'timestamp': datetime.now(),
                'details': {
                    'avg_time': avg_time,
                    'min_time': min_time,
                    'max_time': max_time,
                    'success_rate': len(successful_queries) / len(concurrent_results) * 100
                }
            })

    def test_index_effectiveness(self):
        """Test the effectiveness of created indexes"""
        logger.info("Testing index effectiveness...")
        
        # Test 1: Invoice date range query (should use idx_invoices_date)
        def invoice_date_range_query():
            return self.db_session.execute(text("""
                EXPLAIN (ANALYZE, BUFFERS) 
                SELECT * FROM invoices 
                WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
                    AND status = 'completed'
                ORDER BY created_at DESC
                LIMIT 100
            """)).fetchall()
        
        self.measure_query_time("invoice_date_range_with_explain", invoice_date_range_query)
        
        # Test 2: Customer debt query (should use idx_customers_debt)
        def customer_debt_query():
            return self.db_session.execute(text("""
                EXPLAIN (ANALYZE, BUFFERS)
                SELECT * FROM customers 
                WHERE current_debt > 1000 
                    AND is_active = true
                ORDER BY current_debt DESC
                LIMIT 50
            """)).fetchall()
        
        self.measure_query_time("customer_debt_with_explain", customer_debt_query)
        
        # Test 3: Inventory category query (should use idx_inventory_items_category)
        def inventory_category_query():
            return self.db_session.execute(text("""
                EXPLAIN (ANALYZE, BUFFERS)
                SELECT * FROM inventory_items 
                WHERE category_id = (SELECT id FROM categories LIMIT 1)
                    AND is_active = true
                    AND stock_quantity > 0
            """)).fetchall()
        
        self.measure_query_time("inventory_category_with_explain", inventory_category_query)

    def test_materialized_view_refresh_performance(self):
        """Test materialized view refresh performance"""
        logger.info("Testing materialized view refresh performance...")
        
        def refresh_daily_sales():
            return self.db_session.execute(text("""
                REFRESH MATERIALIZED VIEW CONCURRENTLY analytics.daily_sales_summary
            """))
        
        self.measure_query_time("refresh_daily_sales_mv", refresh_daily_sales)
        
        def refresh_inventory_turnover():
            return self.db_session.execute(text("""
                REFRESH MATERIALIZED VIEW CONCURRENTLY analytics.inventory_turnover_summary
            """))
        
        self.measure_query_time("refresh_inventory_turnover_mv", refresh_inventory_turnover)
        
        def refresh_all_views():
            return self.db_session.execute(text("""
                SELECT analytics.refresh_all_materialized_views()
            """))
        
        self.measure_query_time("refresh_all_materialized_views", refresh_all_views)

    def test_optimization_functions_performance(self):
        """Test performance of optimization functions"""
        logger.info("Testing optimization functions performance...")
        
        # Test financial KPI calculation function
        def test_financial_kpis():
            return self.db_session.execute(text("""
                SELECT * FROM analytics.calculate_financial_kpis(
                    CURRENT_DATE - INTERVAL '30 days',
                    CURRENT_DATE
                )
            """)).fetchone()
        
        self.measure_query_time("financial_kpis_function", test_financial_kpis)
        
        # Test inventory insights function
        def test_inventory_insights():
            return self.db_session.execute(text("""
                SELECT * FROM analytics.get_inventory_insights()
            """)).fetchone()
        
        self.measure_query_time("inventory_insights_function", test_inventory_insights)
        
        # Test index usage analysis
        def test_index_analysis():
            return self.db_session.execute(text("""
                SELECT * FROM analytics.analyze_index_usage()
                LIMIT 20
            """)).fetchall()
        
        self.measure_query_time("index_usage_analysis", test_index_analysis)

    def generate_performance_report(self):
        """Generate a comprehensive performance report"""
        logger.info("Generating performance report...")
        
        if not self.test_results:
            logger.warning("No test results to report")
            return
        
        # Calculate statistics
        execution_times = [r['execution_time_ms'] for r in self.test_results]
        avg_time = statistics.mean(execution_times)
        median_time = statistics.median(execution_times)
        max_time = max(execution_times)
        min_time = min(execution_times)
        
        # Categorize queries by performance
        fast_queries = [r for r in self.test_results if r['execution_time_ms'] < 100]
        medium_queries = [r for r in self.test_results if 100 <= r['execution_time_ms'] < 1000]
        slow_queries = [r for r in self.test_results if r['execution_time_ms'] >= 1000]
        
        report = f"""
=== DATABASE OPTIMIZATION PERFORMANCE REPORT ===
Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

OVERALL STATISTICS:
- Total queries tested: {len(self.test_results)}
- Average execution time: {avg_time:.2f}ms
- Median execution time: {median_time:.2f}ms
- Fastest query: {min_time:.2f}ms
- Slowest query: {max_time:.2f}ms

PERFORMANCE CATEGORIES:
- Fast queries (<100ms): {len(fast_queries)} ({len(fast_queries)/len(self.test_results)*100:.1f}%)
- Medium queries (100-1000ms): {len(medium_queries)} ({len(medium_queries)/len(self.test_results)*100:.1f}%)
- Slow queries (>1000ms): {len(slow_queries)} ({len(slow_queries)/len(self.test_results)*100:.1f}%)

TOP 10 FASTEST QUERIES:
"""
        
        # Add fastest queries
        sorted_results = sorted(self.test_results, key=lambda x: x['execution_time_ms'])
        for i, result in enumerate(sorted_results[:10]):
            report += f"{i+1:2d}. {result['query_name']}: {result['execution_time_ms']:.2f}ms ({result.get('row_count', 0)} rows)\n"
        
        report += "\nTOP 10 SLOWEST QUERIES:\n"
        
        # Add slowest queries
        for i, result in enumerate(sorted_results[-10:]):
            report += f"{i+1:2d}. {result['query_name']}: {result['execution_time_ms']:.2f}ms ({result.get('row_count', 0)} rows)\n"
        
        # Add materialized view performance comparison
        mv_queries = [r for r in self.test_results if 'materialized' in r['query_name']]
        raw_queries = [r for r in self.test_results if 'raw_query' in r['query_name']]
        
        if mv_queries and raw_queries:
            mv_avg = statistics.mean([r['execution_time_ms'] for r in mv_queries])
            raw_avg = statistics.mean([r['execution_time_ms'] for r in raw_queries])
            improvement = ((raw_avg - mv_avg) / raw_avg * 100) if raw_avg > 0 else 0
            
            report += f"""
MATERIALIZED VIEW PERFORMANCE:
- Average materialized view query time: {mv_avg:.2f}ms
- Average raw query time: {raw_avg:.2f}ms
- Performance improvement: {improvement:.1f}%
"""
        
        report += "\n=== END REPORT ===\n"
        
        logger.info(report)
        return report

    def run_all_tests(self):
        """Run all performance tests"""
        logger.info("Starting comprehensive database optimization performance tests...")
        
        try:
            self.test_basic_analytics_queries()
            self.test_inventory_analytics_queries()
            self.test_customer_analytics_queries()
            self.test_category_performance_queries()
            self.test_complex_analytics_queries()
            self.test_concurrent_query_performance()
            self.test_index_effectiveness()
            self.test_materialized_view_refresh_performance()
            self.test_optimization_functions_performance()
            
            # Generate final report
            report = self.generate_performance_report()
            
            # Save results to database for future analysis
            self.save_test_results()
            
            logger.info("All performance tests completed successfully!")
            return report
            
        except Exception as e:
            logger.error(f"Performance test failed: {str(e)}")
            raise
        finally:
            self.db_session.close()

    def save_test_results(self):
        """Save test results to database for analysis"""
        try:
            for result in self.test_results:
                self.db_session.execute(text("""
                    INSERT INTO analytics.query_performance_log 
                    (query_name, execution_time_ms, rows_returned, parameters)
                    VALUES (:query_name, :execution_time_ms, :row_count, :details)
                """), {
                    'query_name': result['query_name'],
                    'execution_time_ms': result['execution_time_ms'],
                    'row_count': result.get('row_count', 0),
                    'details': result.get('details', {})
                })
            
            self.db_session.commit()
            logger.info(f"Saved {len(self.test_results)} test results to database")
            
        except Exception as e:
            logger.error(f"Failed to save test results: {str(e)}")
            self.db_session.rollback()


# Test functions for pytest
@pytest.mark.asyncio
async def test_database_optimization_performance():
    """Main test function for database optimization performance"""
    test_suite = DatabasePerformanceTest()
    report = test_suite.run_all_tests()
    
    # Assert that most queries are reasonably fast
    fast_queries = [r for r in test_suite.test_results if r['execution_time_ms'] < 1000]
    total_queries = len(test_suite.test_results)
    
    assert len(fast_queries) / total_queries >= 0.8, f"Only {len(fast_queries)}/{total_queries} queries were fast (<1000ms)"
    
    # Assert that materialized views are faster than raw queries
    mv_queries = [r for r in test_suite.test_results if 'materialized' in r['query_name']]
    raw_queries = [r for r in test_suite.test_results if 'raw_query' in r['query_name']]
    
    if mv_queries and raw_queries:
        mv_avg = statistics.mean([r['execution_time_ms'] for r in mv_queries])
        raw_avg = statistics.mean([r['execution_time_ms'] for r in raw_queries])
        
        assert mv_avg < raw_avg, f"Materialized views ({mv_avg:.2f}ms) should be faster than raw queries ({raw_avg:.2f}ms)"

@pytest.mark.asyncio
async def test_concurrent_query_performance():
    """Test database performance under concurrent load"""
    test_suite = DatabasePerformanceTest()
    test_suite.test_concurrent_query_performance()
    
    # Check that concurrent queries completed successfully
    concurrent_results = [r for r in test_suite.test_results if 'concurrent' in r['query_name']]
    assert len(concurrent_results) > 0, "No concurrent query results found"
    
    # Check average performance under load
    if concurrent_results:
        summary = concurrent_results[0]  # Should be the summary result
        assert summary['details']['success_rate'] >= 90, f"Success rate too low: {summary['details']['success_rate']:.1f}%"
        assert summary['execution_time_ms'] < 2000, f"Average concurrent query time too high: {summary['execution_time_ms']:.2f}ms"

@pytest.mark.asyncio
async def test_materialized_view_refresh_performance():
    """Test materialized view refresh performance"""
    test_suite = DatabasePerformanceTest()
    test_suite.test_materialized_view_refresh_performance()
    
    # Check that refresh operations completed in reasonable time
    refresh_results = [r for r in test_suite.test_results if 'refresh' in r['query_name']]
    
    for result in refresh_results:
        assert result['execution_time_ms'] < 30000, f"Materialized view refresh too slow: {result['query_name']} took {result['execution_time_ms']:.2f}ms"

if __name__ == "__main__":
    # Run performance tests directly
    test_suite = DatabasePerformanceTest()
    test_suite.run_all_tests()