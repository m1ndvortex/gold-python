#!/usr/bin/env python3
"""
Comprehensive Performance Testing Suite

Tests database query performance, API response times, image processing speed,
and system resource utilization under various load conditions.
"""

import asyncio
import json
import statistics
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime

import psutil
import requests
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker


class PerformanceTestSuite:
    """Comprehensive performance testing suite"""
    
    def __init__(self):
        self.base_url = "http://localhost:8000"
        self.db_url = "postgresql://goldshop_user:goldshop_password@localhost:5432/goldshop"
        self.engine = create_engine(self.db_url)
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        
        self.results = {
            'start_time': datetime.now().isoformat(),
            'end_time': None,
            'database_performance': {},
            'api_performance': {},
            'image_processing_performance': {},
            'system_resource_usage': {},
            'performance_benchmarks': {},
            'recommendations': []
        }
        
        # Performance thresholds (in milliseconds unless specified)
        self.thresholds = {
            'api_response_time': 1000,      # 1 second
            'database_query_time': 500,     # 500ms
            'image_processing_time': 5000,  # 5 seconds
            'search_response_time': 2000,   # 2 seconds
            'report_generation_time': 10000 # 10 seconds
        }
    
    def run_performance_tests(self) -> dict:
        """Run all performance tests"""
        print("Starting comprehensive performance tests...")
        
        try:
            # 1. Database performance tests
            self._test_database_performance()
            
            # 2. API endpoint performance tests
            self._test_api_performance()
            
            # 3. Image processing performance tests
            self._test_image_processing_performance()
            
            # 4. Search and filtering performance tests
            self._test_search_performance()
            
            # 5. Report generation performance tests
            self._test_report_performance()
            
            # 6. Concurrent user simulation
            self._test_concurrent_performance()
            
            # 7. System resource monitoring
            self._monitor_system_resources()
            
            # 8. Generate performance analysis
            self._analyze_performance_results()
            
        except Exception as e:
            print(f"Performance test error: {str(e)}")
            self.results['error'] = str(e)
        
        finally:
            self.results['end_time'] = datetime.now().isoformat()
        
        return self.results
    
    def _test_database_performance(self):
        """Test database query performance"""
        print("Testing database performance...")
        
        db_tests = {
            'simple_select': "SELECT COUNT(*) FROM inventory_items",
            'complex_join': """
                SELECT i.name, c.name as category_name, COUNT(ii.id) as image_count
                FROM inventory_items i
                LEFT JOIN categories c ON i.category_id = c.id
                LEFT JOIN item_images ii ON i.id = ii.item_id
                GROUP BY i.id, i.name, c.name
                LIMIT 100
            """,
            'inventory_search': """
                SELECT * FROM inventory_items 
                WHERE name ILIKE '%test%' 
                OR sku ILIKE '%test%'
                ORDER BY created_at DESC
                LIMIT 50
            """,
            'accounting_balance': """
                SELECT account_code, 
                       SUM(debit_amount) as total_debits,
                       SUM(credit_amount) as total_credits
                FROM journal_entry_lines jel
                JOIN journal_entries je ON jel.journal_entry_id = je.id
                WHERE je.date >= '2024-01-01'
                GROUP BY account_code
            """,
            'category_hierarchy': """
                SELECT id, name, path, level
                FROM categories
                WHERE path ~ '*.Electronics.*'
                ORDER BY path
            """
        }
        
        db_performance = {}
        
        with self.SessionLocal() as db:
            for test_name, query in db_tests.items():
                times = []
                
                # Run each query multiple times
                for _ in range(5):
                    start_time = time.time()
                    try:
                        result = db.execute(text(query))
                        result.fetchall()  # Ensure all data is fetched
                        execution_time = (time.time() - start_time) * 1000  # Convert to ms
                        times.append(execution_time)
                    except Exception as e:
                        print(f"Database query error for {test_name}: {str(e)}")
                        times.append(float('inf'))
                
                if times and all(t != float('inf') for t in times):
                    db_performance[test_name] = {
                        'min_time': min(times),
                        'max_time': max(times),
                        'avg_time': statistics.mean(times),
                        'median_time': statistics.median(times),
                        'passes_threshold': statistics.mean(times) < self.thresholds['database_query_time']
                    }
                else:
                    db_performance[test_name] = {
                        'error': 'Query failed or timed out',
                        'passes_threshold': False
                    }
        
        self.results['database_performance'] = db_performance
    
    def _test_api_performance(self):
        """Test API endpoint performance"""
        print("Testing API performance...")
        
        api_endpoints = [
            ('GET', '/api/inventory/items', {}),
            ('GET', '/api/categories', {}),
            ('GET', '/api/customers', {}),
            ('GET', '/api/invoices', {}),
            ('GET', '/api/accounting/accounts', {}),
            ('GET', '/api/inventory/search', {'q': 'test'}),
            ('GET', '/api/invoices/search', {'type': 'general'}),
            ('GET', '/health', {}),
        ]
        
        api_performance = {}
        
        for method, endpoint, params in api_endpoints:
            times = []
            
            # Test each endpoint multiple times
            for _ in range(10):
                start_time = time.time()
                try:
                    if method == 'GET':
                        response = requests.get(f"{self.base_url}{endpoint}", params=params, timeout=30)
                    else:
                        response = requests.request(method, f"{self.base_url}{endpoint}", json=params, timeout=30)
                    
                    response_time = (time.time() - start_time) * 1000  # Convert to ms
                    
                    if response.status_code < 400:
                        times.append(response_time)
                    else:
                        times.append(float('inf'))
                        
                except Exception as e:
                    print(f"API request error for {endpoint}: {str(e)}")
                    times.append(float('inf'))
            
            if times and any(t != float('inf') for t in times):
                valid_times = [t for t in times if t != float('inf')]
                api_performance[f"{method} {endpoint}"] = {
                    'min_time': min(valid_times),
                    'max_time': max(valid_times),
                    'avg_time': statistics.mean(valid_times),
                    'median_time': statistics.median(valid_times),
                    'success_rate': len(valid_times) / len(times) * 100,
                    'passes_threshold': statistics.mean(valid_times) < self.thresholds['api_response_time']
                }
            else:
                api_performance[f"{method} {endpoint}"] = {
                    'error': 'All requests failed',
                    'success_rate': 0,
                    'passes_threshold': False
                }
        
        self.results['api_performance'] = api_performance
    
    def _test_image_processing_performance(self):
        """Test image processing performance"""
        print("Testing image processing performance...")
        
        from io import BytesIO
        from PIL import Image
        
        # Create test images of different sizes
        test_images = [
            (400, 300, 'small'),
            (800, 600, 'medium'),
            (1600, 1200, 'large'),
            (3200, 2400, 'xlarge')
        ]
        
        image_performance = {}
        
        for width, height, size_name in test_images:
            # Create test image
            test_image = Image.new('RGB', (width, height), color='red')
            image_buffer = BytesIO()
            test_image.save(image_buffer, format='JPEG', quality=90)
            image_buffer.seek(0)
            
            times = []
            
            # Test image upload and processing multiple times
            for i in range(3):  # Fewer iterations for image tests
                start_time = time.time()
                try:
                    files = {'file': (f'perf_test_{size_name}_{i}.jpg', image_buffer, 'image/jpeg')}
                    response = requests.post(f"{self.base_url}/api/images/upload", files=files, timeout=60)
                    
                    processing_time = (time.time() - start_time) * 1000  # Convert to ms
                    
                    if response.status_code == 201:
                        times.append(processing_time)
                        
                        # Clean up uploaded image
                        image_data = response.json()
                        requests.delete(f"{self.base_url}/api/images/{image_data['id']}")
                    else:
                        times.append(float('inf'))
                        
                except Exception as e:
                    print(f"Image processing error for {size_name}: {str(e)}")
                    times.append(float('inf'))
                
                # Reset buffer for next iteration
                image_buffer.seek(0)
            
            if times and any(t != float('inf') for t in times):
                valid_times = [t for t in times if t != float('inf')]
                image_performance[f"{size_name}_{width}x{height}"] = {
                    'min_time': min(valid_times),
                    'max_time': max(valid_times),
                    'avg_time': statistics.mean(valid_times),
                    'success_rate': len(valid_times) / len(times) * 100,
                    'passes_threshold': statistics.mean(valid_times) < self.thresholds['image_processing_time']
                }
            else:
                image_performance[f"{size_name}_{width}x{height}"] = {
                    'error': 'All image processing failed',
                    'success_rate': 0,
                    'passes_threshold': False
                }
        
        self.results['image_processing_performance'] = image_performance
    
    def _test_search_performance(self):
        """Test search and filtering performance"""
        print("Testing search performance...")
        
        search_tests = [
            ('inventory_simple', '/api/inventory/search', {'q': 'test'}),
            ('inventory_complex', '/api/inventory/search', {
                'q': 'test',
                'tags': 'electronics',
                'min_price': 100,
                'max_price': 1000
            }),
            ('invoice_search', '/api/invoices/search', {'type': 'general'}),
            ('customer_search', '/api/customers/search', {'q': 'test'}),
            ('category_search', '/api/categories/search', {'q': 'electronics'})
        ]
        
        search_performance = {}
        
        for test_name, endpoint, params in search_tests:
            times = []
            
            # Test each search multiple times
            for _ in range(5):
                start_time = time.time()
                try:
                    response = requests.get(f"{self.base_url}{endpoint}", params=params, timeout=30)
                    search_time = (time.time() - start_time) * 1000  # Convert to ms
                    
                    if response.status_code == 200:
                        times.append(search_time)
                    else:
                        times.append(float('inf'))
                        
                except Exception as e:
                    print(f"Search error for {test_name}: {str(e)}")
                    times.append(float('inf'))
            
            if times and any(t != float('inf') for t in times):
                valid_times = [t for t in times if t != float('inf')]
                search_performance[test_name] = {
                    'min_time': min(valid_times),
                    'max_time': max(valid_times),
                    'avg_time': statistics.mean(valid_times),
                    'median_time': statistics.median(valid_times),
                    'success_rate': len(valid_times) / len(times) * 100,
                    'passes_threshold': statistics.mean(valid_times) < self.thresholds['search_response_time']
                }
            else:
                search_performance[test_name] = {
                    'error': 'All searches failed',
                    'success_rate': 0,
                    'passes_threshold': False
                }
        
        self.results['search_performance'] = search_performance
    
    def _test_report_performance(self):
        """Test report generation performance"""
        print("Testing report generation performance...")
        
        report_tests = [
            ('trial_balance', '/api/accounting/reports/trial-balance'),
            ('balance_sheet', '/api/accounting/reports/balance-sheet'),
            ('income_statement', '/api/accounting/reports/income-statement'),
            ('cash_flow', '/api/accounting/reports/cash-flow'),
            ('inventory_report', '/api/inventory/reports/stock-levels'),
            ('sales_report', '/api/invoices/reports/sales-summary')
        ]
        
        report_performance = {}
        
        for test_name, endpoint in report_tests:
            times = []
            
            # Test each report multiple times
            for _ in range(3):  # Fewer iterations for reports
                start_time = time.time()
                try:
                    response = requests.get(f"{self.base_url}{endpoint}", timeout=60)
                    report_time = (time.time() - start_time) * 1000  # Convert to ms
                    
                    if response.status_code == 200:
                        times.append(report_time)
                    else:
                        times.append(float('inf'))
                        
                except Exception as e:
                    print(f"Report error for {test_name}: {str(e)}")
                    times.append(float('inf'))
            
            if times and any(t != float('inf') for t in times):
                valid_times = [t for t in times if t != float('inf')]
                report_performance[test_name] = {
                    'min_time': min(valid_times),
                    'max_time': max(valid_times),
                    'avg_time': statistics.mean(valid_times),
                    'success_rate': len(valid_times) / len(times) * 100,
                    'passes_threshold': statistics.mean(valid_times) < self.thresholds['report_generation_time']
                }
            else:
                report_performance[test_name] = {
                    'error': 'All report generation failed',
                    'success_rate': 0,
                    'passes_threshold': False
                }
        
        self.results['report_performance'] = report_performance
    
    def _test_concurrent_performance(self):
        """Test performance under concurrent load"""
        print("Testing concurrent performance...")
        
        def make_concurrent_request(endpoint_data):
            endpoint, params = endpoint_data
            start_time = time.time()
            try:
                response = requests.get(f"{self.base_url}{endpoint}", params=params, timeout=30)
                response_time = (time.time() - start_time) * 1000
                return {
                    'endpoint': endpoint,
                    'response_time': response_time,
                    'status_code': response.status_code,
                    'success': response.status_code < 400
                }
            except Exception as e:
                return {
                    'endpoint': endpoint,
                    'response_time': float('inf'),
                    'status_code': 0,
                    'success': False,
                    'error': str(e)
                }
        
        # Define concurrent test scenarios
        concurrent_endpoints = [
            ('/api/inventory/items', {}),
            ('/api/categories', {}),
            ('/api/customers', {}),
            ('/api/invoices', {}),
            ('/api/inventory/search', {'q': 'test'}),
            ('/health', {}),
        ] * 10  # Multiply to create more concurrent requests
        
        concurrent_performance = {}
        
        # Test with different concurrency levels
        concurrency_levels = [5, 10, 20]
        
        for concurrency in concurrency_levels:
            print(f"Testing with {concurrency} concurrent requests...")
            
            with ThreadPoolExecutor(max_workers=concurrency) as executor:
                start_time = time.time()
                
                # Submit all requests
                futures = [
                    executor.submit(make_concurrent_request, endpoint_data)
                    for endpoint_data in concurrent_endpoints[:concurrency * 2]
                ]
                
                # Collect results
                results = []
                for future in as_completed(futures):
                    try:
                        result = future.result()
                        results.append(result)
                    except Exception as e:
                        results.append({
                            'endpoint': 'unknown',
                            'response_time': float('inf'),
                            'status_code': 0,
                            'success': False,
                            'error': str(e)
                        })
                
                total_time = (time.time() - start_time) * 1000
                
                # Analyze results
                successful_requests = [r for r in results if r['success']]
                failed_requests = [r for r in results if not r['success']]
                
                if successful_requests:
                    response_times = [r['response_time'] for r in successful_requests]
                    concurrent_performance[f"concurrency_{concurrency}"] = {
                        'total_requests': len(results),
                        'successful_requests': len(successful_requests),
                        'failed_requests': len(failed_requests),
                        'success_rate': len(successful_requests) / len(results) * 100,
                        'total_time': total_time,
                        'avg_response_time': statistics.mean(response_times),
                        'min_response_time': min(response_times),
                        'max_response_time': max(response_times),
                        'median_response_time': statistics.median(response_times),
                        'throughput': len(successful_requests) / (total_time / 1000),  # requests per second
                        'passes_threshold': statistics.mean(response_times) < self.thresholds['api_response_time'] * 2  # Allow 2x threshold for concurrent
                    }
                else:
                    concurrent_performance[f"concurrency_{concurrency}"] = {
                        'total_requests': len(results),
                        'successful_requests': 0,
                        'failed_requests': len(failed_requests),
                        'success_rate': 0,
                        'error': 'All concurrent requests failed',
                        'passes_threshold': False
                    }
        
        self.results['concurrent_performance'] = concurrent_performance
    
    def _monitor_system_resources(self):
        """Monitor system resource usage during tests"""
        print("Monitoring system resources...")
        
        # Get current system metrics
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        # Get database connections
        db_connections = self._get_database_connections()
        
        system_metrics = {
            'cpu_usage_percent': cpu_percent,
            'memory_usage_percent': memory.percent,
            'memory_used_gb': memory.used / (1024**3),
            'memory_available_gb': memory.available / (1024**3),
            'disk_usage_percent': disk.percent,
            'disk_used_gb': disk.used / (1024**3),
            'disk_free_gb': disk.free / (1024**3),
            'database_connections': db_connections,
            'timestamp': datetime.now().isoformat()
        }
        
        # Check if resources are within acceptable limits
        resource_warnings = []
        
        if cpu_percent > 80:
            resource_warnings.append(f"High CPU usage: {cpu_percent:.1f}%")
        
        if memory.percent > 85:
            resource_warnings.append(f"High memory usage: {memory.percent:.1f}%")
        
        if disk.percent > 90:
            resource_warnings.append(f"High disk usage: {disk.percent:.1f}%")
        
        if db_connections > 50:
            resource_warnings.append(f"High database connections: {db_connections}")
        
        system_metrics['warnings'] = resource_warnings
        system_metrics['healthy'] = len(resource_warnings) == 0
        
        self.results['system_resource_usage'] = system_metrics
    
    def _get_database_connections(self) -> int:
        """Get current database connection count"""
        try:
            with self.SessionLocal() as db:
                result = db.execute(
                    text("SELECT count(*) FROM pg_stat_activity WHERE state = 'active'")
                ).fetchone()
                return result[0] if result else 0
        except Exception:
            return 0
    
    def _analyze_performance_results(self):
        """Analyze performance results and generate recommendations"""
        print("Analyzing performance results...")
        
        benchmarks = {}
        recommendations = []
        
        # Analyze database performance
        if 'database_performance' in self.results:
            db_perf = self.results['database_performance']
            slow_queries = [name for name, data in db_perf.items() 
                          if isinstance(data, dict) and not data.get('passes_threshold', True)]
            
            if slow_queries:
                recommendations.append(f"Optimize slow database queries: {', '.join(slow_queries)}")
            
            avg_db_time = statistics.mean([
                data['avg_time'] for data in db_perf.values() 
                if isinstance(data, dict) and 'avg_time' in data
            ]) if db_perf else 0
            
            benchmarks['average_database_query_time'] = avg_db_time
        
        # Analyze API performance
        if 'api_performance' in self.results:
            api_perf = self.results['api_performance']
            slow_apis = [name for name, data in api_perf.items() 
                        if isinstance(data, dict) and not data.get('passes_threshold', True)]
            
            if slow_apis:
                recommendations.append(f"Optimize slow API endpoints: {', '.join(slow_apis)}")
            
            avg_api_time = statistics.mean([
                data['avg_time'] for data in api_perf.values() 
                if isinstance(data, dict) and 'avg_time' in data
            ]) if api_perf else 0
            
            benchmarks['average_api_response_time'] = avg_api_time
        
        # Analyze image processing performance
        if 'image_processing_performance' in self.results:
            img_perf = self.results['image_processing_performance']
            slow_processing = [name for name, data in img_perf.items() 
                             if isinstance(data, dict) and not data.get('passes_threshold', True)]
            
            if slow_processing:
                recommendations.append("Consider image processing optimization or async processing")
        
        # Analyze concurrent performance
        if 'concurrent_performance' in self.results:
            conc_perf = self.results['concurrent_performance']
            
            for level, data in conc_perf.items():
                if isinstance(data, dict) and data.get('success_rate', 0) < 95:
                    recommendations.append(f"Poor performance under {level}: {data.get('success_rate', 0):.1f}% success rate")
        
        # System resource analysis
        if 'system_resource_usage' in self.results:
            sys_usage = self.results['system_resource_usage']
            
            if sys_usage.get('warnings'):
                recommendations.extend([f"System resource warning: {warning}" for warning in sys_usage['warnings']])
        
        # Overall performance grade
        passing_tests = 0
        total_tests = 0
        
        for category in ['database_performance', 'api_performance', 'image_processing_performance']:
            if category in self.results:
                for test_data in self.results[category].values():
                    if isinstance(test_data, dict) and 'passes_threshold' in test_data:
                        total_tests += 1
                        if test_data['passes_threshold']:
                            passing_tests += 1
        
        if total_tests > 0:
            performance_score = (passing_tests / total_tests) * 100
            benchmarks['overall_performance_score'] = performance_score
            
            if performance_score >= 90:
                benchmarks['performance_grade'] = 'A'
            elif performance_score >= 80:
                benchmarks['performance_grade'] = 'B'
            elif performance_score >= 70:
                benchmarks['performance_grade'] = 'C'
            elif performance_score >= 60:
                benchmarks['performance_grade'] = 'D'
            else:
                benchmarks['performance_grade'] = 'F'
        
        # General recommendations
        if not recommendations:
            recommendations.append("Performance is within acceptable thresholds")
        else:
            recommendations.insert(0, "Performance optimization recommendations:")
        
        self.results['performance_benchmarks'] = benchmarks
        self.results['recommendations'] = recommendations
    
    def print_results(self):
        """Print performance test results"""
        print("\n" + "="*80)
        print("PERFORMANCE TEST RESULTS")
        print("="*80)
        
        # Overall performance
        if 'performance_benchmarks' in self.results:
            benchmarks = self.results['performance_benchmarks']
            print(f"Overall Performance Score: {benchmarks.get('overall_performance_score', 0):.1f}%")
            print(f"Performance Grade: {benchmarks.get('performance_grade', 'N/A')}")
            
            if 'average_database_query_time' in benchmarks:
                print(f"Average Database Query Time: {benchmarks['average_database_query_time']:.2f}ms")
            
            if 'average_api_response_time' in benchmarks:
                print(f"Average API Response Time: {benchmarks['average_api_response_time']:.2f}ms")
        
        # Database performance
        if 'database_performance' in self.results:
            print(f"\nDatabase Performance:")
            for test_name, data in self.results['database_performance'].items():
                if isinstance(data, dict) and 'avg_time' in data:
                    status = "✅ PASS" if data.get('passes_threshold', False) else "❌ FAIL"
                    print(f"  {test_name}: {data['avg_time']:.2f}ms {status}")
        
        # API performance
        if 'api_performance' in self.results:
            print(f"\nAPI Performance:")
            for endpoint, data in self.results['api_performance'].items():
                if isinstance(data, dict) and 'avg_time' in data:
                    status = "✅ PASS" if data.get('passes_threshold', False) else "❌ FAIL"
                    print(f"  {endpoint}: {data['avg_time']:.2f}ms ({data.get('success_rate', 0):.1f}% success) {status}")
        
        # Concurrent performance
        if 'concurrent_performance' in self.results:
            print(f"\nConcurrent Performance:")
            for level, data in self.results['concurrent_performance'].items():
                if isinstance(data, dict) and 'throughput' in data:
                    status = "✅ PASS" if data.get('passes_threshold', False) else "❌ FAIL"
                    print(f"  {level}: {data['throughput']:.2f} req/sec ({data.get('success_rate', 0):.1f}% success) {status}")
        
        # System resources
        if 'system_resource_usage' in self.results:
            sys_usage = self.results['system_resource_usage']
            print(f"\nSystem Resource Usage:")
            print(f"  CPU: {sys_usage.get('cpu_usage_percent', 0):.1f}%")
            print(f"  Memory: {sys_usage.get('memory_usage_percent', 0):.1f}%")
            print(f"  Disk: {sys_usage.get('disk_usage_percent', 0):.1f}%")
            print(f"  DB Connections: {sys_usage.get('database_connections', 0)}")
            
            if sys_usage.get('warnings'):
                print(f"  Warnings: {', '.join(sys_usage['warnings'])}")
        
        # Recommendations
        if 'recommendations' in self.results:
            print(f"\nRecommendations:")
            for rec in self.results['recommendations']:
                print(f"  • {rec}")
        
        print("="*80)


def main():
    """Main entry point for performance testing"""
    suite = PerformanceTestSuite()
    results = suite.run_performance_tests()
    
    suite.print_results()
    
    # Save detailed results
    with open('tests/performance_test_results.json', 'w') as f:
        json.dump(results, f, indent=2, default=str)
    
    # Determine if performance tests passed
    benchmarks = results.get('performance_benchmarks', {})
    performance_score = benchmarks.get('overall_performance_score', 0)
    
    if performance_score >= 70:  # 70% threshold for passing
        print("✅ Performance tests PASSED")
        return 0
    else:
        print("❌ Performance tests FAILED")
        return 1


if __name__ == "__main__":
    exit(main())