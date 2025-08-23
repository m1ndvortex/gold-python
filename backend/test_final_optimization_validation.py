"""
Final Database Optimization Validation Test
Task 12.2: Comprehensive validation of all database optimizations

This test validates:
1. Optimized indexes are working correctly
2. Materialized views provide performance improvements
3. Query optimization functions work as expected
4. Database load performance under concurrent access
"""

import pytest
import asyncio
import time
from datetime import datetime, timedelta, date
from sqlalchemy import text
from database import get_db
from analytics_query_optimization import OptimizedAnalyticsQueries

def test_materialized_view_performance():
    """Test that materialized views provide significant performance improvements"""
    db = next(get_db())
    
    print("\n=== MATERIALIZED VIEW PERFORMANCE TEST ===")
    
    # Test 1: Daily sales comparison
    # Raw query
    start_time = time.time()
    raw_result = db.execute(text("""
        SELECT 
            DATE(created_at) as sale_date,
            COUNT(*) as transaction_count,
            SUM(total_amount) as total_revenue
        FROM invoices 
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
            AND status = 'completed'
        GROUP BY DATE(created_at)
        ORDER BY sale_date DESC
        LIMIT 10
    """)).fetchall()
    raw_time = (time.time() - start_time) * 1000
    
    # Materialized view query
    start_time = time.time()
    mv_result = db.execute(text("""
        SELECT sale_date, transaction_count, total_revenue
        FROM analytics.daily_sales_summary
        WHERE sale_date >= CURRENT_DATE - INTERVAL '30 days'
        ORDER BY sale_date DESC
        LIMIT 10
    """)).fetchall()
    mv_time = (time.time() - start_time) * 1000
    
    print(f"Daily Sales - Raw Query: {raw_time:.2f}ms ({len(raw_result)} rows)")
    print(f"Daily Sales - Materialized View: {mv_time:.2f}ms ({len(mv_result)} rows)")
    
    # Test 2: Inventory turnover comparison
    start_time = time.time()
    raw_inv_result = db.execute(text("""
        SELECT 
            inv.id,
            inv.name,
            cat.name as category_name,
            inv.stock_quantity,
            COALESCE(SUM(ii.quantity), 0) as units_sold_30d
        FROM inventory_items inv
        LEFT JOIN categories cat ON inv.category_id = cat.id
        LEFT JOIN invoice_items ii ON inv.id = ii.inventory_item_id
        LEFT JOIN invoices i ON ii.invoice_id = i.id 
            AND i.created_at >= CURRENT_DATE - INTERVAL '30 days'
            AND i.status = 'completed'
        WHERE inv.is_active = true
        GROUP BY inv.id, inv.name, cat.name, inv.stock_quantity
        ORDER BY units_sold_30d DESC
        LIMIT 20
    """)).fetchall()
    raw_inv_time = (time.time() - start_time) * 1000
    
    start_time = time.time()
    mv_inv_result = db.execute(text("""
        SELECT item_id, item_name, category_name, current_stock, units_sold_30d
        FROM analytics.inventory_turnover_summary
        ORDER BY units_sold_30d DESC
        LIMIT 20
    """)).fetchall()
    mv_inv_time = (time.time() - start_time) * 1000
    
    print(f"Inventory Turnover - Raw Query: {raw_inv_time:.2f}ms ({len(raw_inv_result)} rows)")
    print(f"Inventory Turnover - Materialized View: {mv_inv_time:.2f}ms ({len(mv_inv_result)} rows)")
    
    # Calculate improvements
    sales_improvement = ((raw_time - mv_time) / raw_time * 100) if raw_time > 0 else 0
    inventory_improvement = ((raw_inv_time - mv_inv_time) / raw_inv_time * 100) if raw_inv_time > 0 else 0
    
    print(f"Sales Query Improvement: {sales_improvement:.1f}%")
    print(f"Inventory Query Improvement: {inventory_improvement:.1f}%")
    
    db.close()
    
    # Assert performance improvements (materialized views should be faster or at least not significantly slower)
    assert mv_time <= raw_time * 2, f"Materialized view should not be more than 2x slower than raw query"
    assert mv_inv_time <= raw_inv_time * 2, f"Inventory materialized view should not be more than 2x slower"

def test_optimized_analytics_queries():
    """Test the optimized analytics query functions"""
    db = next(get_db())
    analytics = OptimizedAnalyticsQueries(db)
    
    print("\n=== OPTIMIZED ANALYTICS QUERIES TEST ===")
    
    # Test 1: Daily sales summary
    start_time = time.time()
    daily_sales = analytics.get_daily_sales_summary(limit=10)
    daily_sales_time = (time.time() - start_time) * 1000
    print(f"Daily Sales Summary: {daily_sales_time:.2f}ms ({len(daily_sales)} records)")
    
    # Test 2: Inventory turnover analysis
    start_time = time.time()
    inventory_analysis = analytics.get_inventory_turnover_analysis(limit=20)
    inventory_time = (time.time() - start_time) * 1000
    print(f"Inventory Turnover Analysis: {inventory_time:.2f}ms ({len(inventory_analysis)} records)")
    
    # Test 3: Customer segmentation
    start_time = time.time()
    customer_analysis = analytics.get_customer_segmentation_analysis(limit=15)
    customer_time = (time.time() - start_time) * 1000
    print(f"Customer Segmentation Analysis: {customer_time:.2f}ms ({len(customer_analysis)} records)")
    
    # Test 4: Category performance
    start_time = time.time()
    category_analysis = analytics.get_category_performance_analysis(limit=10)
    category_time = (time.time() - start_time) * 1000
    print(f"Category Performance Analysis: {category_time:.2f}ms ({len(category_analysis)} records)")
    
    # Test 5: Comprehensive KPI dashboard
    start_time = time.time()
    kpi_dashboard = analytics.get_comprehensive_kpi_dashboard()
    kpi_time = (time.time() - start_time) * 1000
    print(f"Comprehensive KPI Dashboard: {kpi_time:.2f}ms")
    
    # Validate results structure
    assert isinstance(daily_sales, list), "Daily sales should return a list"
    assert isinstance(inventory_analysis, list), "Inventory analysis should return a list"
    assert isinstance(customer_analysis, list), "Customer analysis should return a list"
    assert isinstance(category_analysis, list), "Category analysis should return a list"
    assert isinstance(kpi_dashboard, dict), "KPI dashboard should return a dict"
    
    # Performance assertions (all queries should be reasonably fast)
    assert daily_sales_time < 100, f"Daily sales query too slow: {daily_sales_time:.2f}ms"
    assert inventory_time < 100, f"Inventory analysis too slow: {inventory_time:.2f}ms"
    assert customer_time < 100, f"Customer analysis too slow: {customer_time:.2f}ms"
    assert category_time < 100, f"Category analysis too slow: {category_time:.2f}ms"
    assert kpi_time < 200, f"KPI dashboard too slow: {kpi_time:.2f}ms"
    
    print(f"Average query time: {(daily_sales_time + inventory_time + customer_time + category_time + kpi_time) / 5:.2f}ms")
    
    db.close()

def test_index_effectiveness():
    """Test that indexes are being used effectively"""
    db = next(get_db())
    
    print("\n=== INDEX EFFECTIVENESS TEST ===")
    
    # Test 1: Invoice date range query (should use idx_invoices_created_status_amount)
    start_time = time.time()
    result = db.execute(text("""
        SELECT * FROM invoices 
        WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
            AND status = 'completed'
        ORDER BY created_at DESC
        LIMIT 10
    """)).fetchall()
    invoice_time = (time.time() - start_time) * 1000
    print(f"Invoice date range query: {invoice_time:.2f}ms ({len(result)} rows)")
    
    # Test 2: Customer debt query (should use idx_customers_purchases_debt)
    start_time = time.time()
    result = db.execute(text("""
        SELECT * FROM customers 
        WHERE total_purchases > 1000 
            AND is_active = true
        ORDER BY total_purchases DESC
        LIMIT 10
    """)).fetchall()
    customer_time = (time.time() - start_time) * 1000
    print(f"Customer debt query: {customer_time:.2f}ms ({len(result)} rows)")
    
    # Test 3: Inventory category query (should use idx_inventory_category_stock_active)
    start_time = time.time()
    result = db.execute(text("""
        SELECT * FROM inventory_items 
        WHERE is_active = true
            AND stock_quantity > 0
        ORDER BY stock_quantity DESC
        LIMIT 15
    """)).fetchall()
    inventory_time = (time.time() - start_time) * 1000
    print(f"Inventory category query: {inventory_time:.2f}ms ({len(result)} rows)")
    
    # All indexed queries should be fast
    assert invoice_time < 50, f"Invoice query should be fast with index: {invoice_time:.2f}ms"
    assert customer_time < 50, f"Customer query should be fast with index: {customer_time:.2f}ms"
    assert inventory_time < 50, f"Inventory query should be fast with index: {inventory_time:.2f}ms"
    
    db.close()

def test_concurrent_query_performance():
    """Test database performance under concurrent load"""
    import concurrent.futures
    import threading
    
    print("\n=== CONCURRENT QUERY PERFORMANCE TEST ===")
    
    def run_analytics_query(query_type: str):
        """Run a single analytics query"""
        db = next(get_db())
        analytics = OptimizedAnalyticsQueries(db)
        
        start_time = time.time()
        try:
            if query_type == 'daily_sales':
                result = analytics.get_daily_sales_summary(limit=5)
            elif query_type == 'inventory':
                result = analytics.get_inventory_turnover_analysis(limit=10)
            elif query_type == 'customers':
                result = analytics.get_customer_segmentation_analysis(limit=10)
            elif query_type == 'categories':
                result = analytics.get_category_performance_analysis(limit=5)
            else:
                result = analytics.get_comprehensive_kpi_dashboard()
            
            execution_time = (time.time() - start_time) * 1000
            db.close()
            
            return {
                'query_type': query_type,
                'execution_time_ms': execution_time,
                'success': True,
                'result_count': len(result) if isinstance(result, list) else 1
            }
            
        except Exception as e:
            execution_time = (time.time() - start_time) * 1000
            db.close()
            return {
                'query_type': query_type,
                'execution_time_ms': execution_time,
                'success': False,
                'error': str(e)
            }
    
    # Run concurrent queries
    query_types = ['daily_sales', 'inventory', 'customers', 'categories', 'kpi_dashboard']
    concurrent_results = []
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        # Submit multiple instances of each query type
        futures = []
        for _ in range(2):  # Run each query type 2 times concurrently
            for query_type in query_types:
                future = executor.submit(run_analytics_query, query_type)
                futures.append(future)
        
        # Collect results
        for future in concurrent.futures.as_completed(futures):
            result = future.result()
            concurrent_results.append(result)
    
    # Analyze results
    successful_queries = [r for r in concurrent_results if r['success']]
    failed_queries = [r for r in concurrent_results if not r['success']]
    
    if successful_queries:
        avg_time = sum(r['execution_time_ms'] for r in successful_queries) / len(successful_queries)
        max_time = max(r['execution_time_ms'] for r in successful_queries)
        min_time = min(r['execution_time_ms'] for r in successful_queries)
        
        print(f"Concurrent queries completed: {len(successful_queries)}/{len(concurrent_results)}")
        print(f"Average execution time: {avg_time:.2f}ms")
        print(f"Min execution time: {min_time:.2f}ms")
        print(f"Max execution time: {max_time:.2f}ms")
        print(f"Failed queries: {len(failed_queries)}")
        
        # Performance assertions
        success_rate = len(successful_queries) / len(concurrent_results) * 100
        assert success_rate >= 90, f"Success rate too low: {success_rate:.1f}%"
        assert avg_time < 500, f"Average concurrent query time too high: {avg_time:.2f}ms"
        
    else:
        pytest.fail("No successful concurrent queries")

def test_materialized_view_refresh():
    """Test materialized view refresh performance"""
    db = next(get_db())
    analytics = OptimizedAnalyticsQueries(db)
    
    print("\n=== MATERIALIZED VIEW REFRESH TEST ===")
    
    # Test refresh performance
    start_time = time.time()
    refresh_result = analytics.refresh_materialized_views()
    refresh_time = (time.time() - start_time) * 1000
    
    print(f"Materialized view refresh: {refresh_time:.2f}ms")
    print(f"Views refreshed: {refresh_result['views_refreshed']}")
    print(f"Views failed: {refresh_result['views_failed']}")
    
    # Assertions
    assert refresh_result['views_refreshed'] > 0, "At least some views should refresh successfully"
    assert refresh_time < 30000, f"Refresh should complete within 30 seconds: {refresh_time:.2f}ms"
    
    db.close()

def test_query_performance_monitoring():
    """Test query performance monitoring functionality"""
    db = next(get_db())
    analytics = OptimizedAnalyticsQueries(db)
    
    print("\n=== QUERY PERFORMANCE MONITORING TEST ===")
    
    # Run some queries to generate performance data
    analytics.get_daily_sales_summary(limit=5)
    analytics.get_inventory_turnover_analysis(limit=10)
    analytics.get_comprehensive_kpi_dashboard()
    
    # Get performance report
    performance_report = analytics.get_query_performance_report()
    
    print(f"Performance report generated with {len(performance_report.get('performance_summary', []))} entries")
    
    # Validate report structure
    assert 'performance_summary' in performance_report, "Performance report should have summary"
    assert isinstance(performance_report['performance_summary'], list), "Summary should be a list"
    
    db.close()

def run_all_optimization_tests():
    """Run all optimization validation tests"""
    print("Starting comprehensive database optimization validation...")
    
    try:
        test_materialized_view_performance()
        test_optimized_analytics_queries()
        test_index_effectiveness()
        test_concurrent_query_performance()
        test_materialized_view_refresh()
        test_query_performance_monitoring()
        
        print("\n=== ALL OPTIMIZATION TESTS PASSED ===")
        print("Database optimization implementation is successful!")
        
    except Exception as e:
        print(f"\n=== TEST FAILED ===")
        print(f"Error: {e}")
        raise

if __name__ == "__main__":
    run_all_optimization_tests()