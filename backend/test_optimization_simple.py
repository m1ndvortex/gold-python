"""
Simple Database Optimization Performance Test
Task 12.2: Validate query performance improvements
"""

import time
from sqlalchemy import text
from database import get_db

def test_query_performance():
    """Test basic query performance with optimizations"""
    db = next(get_db())
    
    print("Testing database optimization performance...")
    
    # Test 1: Daily sales from materialized view
    start_time = time.time()
    result = db.execute(text("""
        SELECT sale_date, transaction_count, total_revenue, avg_transaction_value
        FROM analytics.daily_sales_summary
        WHERE sale_date >= CURRENT_DATE - INTERVAL '30 days'
        ORDER BY sale_date DESC
        LIMIT 10
    """)).fetchall()
    mv_time = (time.time() - start_time) * 1000
    print(f"Daily sales (materialized view): {mv_time:.2f}ms, {len(result)} rows")
    
    # Test 2: Daily sales raw query
    start_time = time.time()
    result = db.execute(text("""
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
        LIMIT 10
    """)).fetchall()
    raw_time = (time.time() - start_time) * 1000
    print(f"Daily sales (raw query): {raw_time:.2f}ms, {len(result)} rows")
    
    # Test 3: Inventory turnover from materialized view
    start_time = time.time()
    result = db.execute(text("""
        SELECT item_id, item_name, category_name, turnover_ratio_30d, movement_classification
        FROM analytics.inventory_turnover_summary
        ORDER BY turnover_ratio_30d DESC
        LIMIT 20
    """)).fetchall()
    inv_mv_time = (time.time() - start_time) * 1000
    print(f"Inventory turnover (materialized view): {inv_mv_time:.2f}ms, {len(result)} rows")
    
    # Test 4: Customer analytics from materialized view
    start_time = time.time()
    result = db.execute(text("""
        SELECT customer_id, customer_name, value_segment, activity_segment, total_purchases
        FROM analytics.customer_analytics_summary
        WHERE value_segment = 'high_value'
        ORDER BY total_purchases DESC
        LIMIT 10
    """)).fetchall()
    cust_time = (time.time() - start_time) * 1000
    print(f"Customer analytics (materialized view): {cust_time:.2f}ms, {len(result)} rows")
    
    # Test 5: Category performance from materialized view
    start_time = time.time()
    result = db.execute(text("""
        SELECT category_id, category_name, total_items, revenue_30d, performance_category
        FROM analytics.category_performance_summary
        WHERE performance_category != 'inactive'
        ORDER BY revenue_30d DESC
        LIMIT 15
    """)).fetchall()
    cat_time = (time.time() - start_time) * 1000
    print(f"Category performance (materialized view): {cat_time:.2f}ms, {len(result)} rows")
    
    # Test 6: Complex KPI query
    start_time = time.time()
    result = db.execute(text("""
        WITH revenue_data AS (
            SELECT 
                SUM(total_revenue) as total_revenue,
                SUM(transaction_count) as total_transactions
            FROM analytics.daily_sales_summary
            WHERE sale_date >= CURRENT_DATE - INTERVAL '30 days'
        ),
        inventory_data AS (
            SELECT 
                COUNT(*) as total_items,
                SUM(inventory_value) as total_inventory_value
            FROM analytics.inventory_turnover_summary
        )
        SELECT 
            rd.total_revenue,
            rd.total_transactions,
            id.total_items,
            id.total_inventory_value
        FROM revenue_data rd
        CROSS JOIN inventory_data id
    """)).fetchone()
    kpi_time = (time.time() - start_time) * 1000
    print(f"Complex KPI calculation: {kpi_time:.2f}ms")
    
    # Performance summary
    print(f"\n=== PERFORMANCE SUMMARY ===")
    print(f"Materialized view improvement: {((raw_time - mv_time) / raw_time * 100):.1f}%")
    print(f"Average query time: {(mv_time + inv_mv_time + cust_time + cat_time + kpi_time) / 5:.2f}ms")
    
    # Test index usage
    print(f"\n=== INDEX USAGE TEST ===")
    start_time = time.time()
    result = db.execute(text("""
        SELECT * FROM invoices 
        WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
            AND status = 'completed'
        ORDER BY created_at DESC
        LIMIT 5
    """)).fetchall()
    index_time = (time.time() - start_time) * 1000
    print(f"Invoice date range query (with index): {index_time:.2f}ms, {len(result)} rows")
    
    db.close()
    print("Performance test completed successfully!")

if __name__ == "__main__":
    test_query_performance()