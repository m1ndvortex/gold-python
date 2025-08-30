#!/usr/bin/env python3
"""
Load Testing Framework for Universal Inventory and Invoice Management System

Tests system performance under load with 100+ concurrent users simulating:
- Invoice creation and processing
- Inventory management operations
- Accounting operations
- Image upload and processing
- QR card generation
- Database query performance
"""

import asyncio
import json
import random
import statistics
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from typing import Dict, List, Tuple

import aiohttp
import psutil
import requests
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker


class LoadTestFramework:
    """Load testing framework for the system"""
    
    def __init__(self):
        self.base_url = "http://localhost:8000"
        self.db_url = "postgresql://goldshop_user:goldshop_password@localhost:5432/goldshop"
        self.engine = create_engine(self.db_url)
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        
        self.results = {
            'start_time': None,
            'end_time': None,
            'total_requests': 0,
            'successful_requests': 0,
            'failed_requests': 0,
            'response_times': [],
            'error_rates': {},
            'throughput': 0,
            'concurrent_users': 0,
            'test_scenarios': {},
            'system_metrics': {},
            'database_performance': {}
        }
        
        # Test data
        self.test_customers = []
        self.test_items = []
        self.test_categories = []
    
    def run_load_tests(self, concurrent_users: int = 100, duration_minutes: int = 5) -> Dict:
        """Run comprehensive load tests"""
        print(f"Starting load tests with {concurrent_users} concurrent users for {duration_minutes} minutes")
        
        self.results['start_time'] = datetime.now()
        self.results['concurrent_users'] = concurrent_users
        
        try:
            # Setup test data
            self._setup_test_data()
            
            # Start system monitoring
            monitor_task = self._start_system_monitoring()
            
            # Run load test scenarios
            self._run_concurrent_scenarios(concurrent_users, duration_minutes)
            
            # Stop monitoring
            monitor_task.cancel()
            
            # Analyze results
            self._analyze_results()
            
        except Exception as e:
            print(f"Load test error: {str(e)}")
            self.results['error'] = str(e)
        
        finally:
            self.results['end_time'] = datetime.now()
            self._cleanup_test_data()
        
        return self.results
    
    def _setup_test_data(self):
        """Setup test data for load testing"""
        print("Setting up test data...")
        
        # Create test categories
        for i in range(10):
            category_data = {
                "name": f"Load Test Category {i}",
                "name_persian": f"دسته تست {i}"
            }
            
            response = requests.post(f"{self.base_url}/api/categories", json=category_data)
            if response.status_code == 201:
                self.test_categories.append(response.json()['id'])
        
        # Create test customers
        for i in range(50):
            customer_data = {
                "name": f"Load Test Customer {i}",
                "phone": f"+123456789{i:02d}",
                "email": f"loadtest{i}@example.com"
            }
            
            response = requests.post(f"{self.base_url}/api/customers", json=customer_data)
            if response.status_code == 201:
                self.test_customers.append(response.json()['id'])
        
        # Create test inventory items
        for i in range(100):
            item_data = {
                "name": f"Load Test Item {i}",
                "sku": f"LOAD{i:03d}",
                "category_id": random.choice(self.test_categories),
                "cost_price": random.uniform(10.0, 100.0),
                "sale_price": random.uniform(15.0, 150.0),
                "stock_quantity": random.randint(50, 500),
                "unit_of_measure": "piece"
            }
            
            response = requests.post(f"{self.base_url}/api/inventory/items", json=item_data)
            if response.status_code == 201:
                self.test_items.append(response.json()['id'])
        
        print(f"Created {len(self.test_categories)} categories, {len(self.test_customers)} customers, {len(self.test_items)} items")
    
    def _run_concurrent_scenarios(self, concurrent_users: int, duration_minutes: int):
        """Run concurrent load test scenarios"""
        print(f"Running concurrent scenarios...")
        
        scenarios = [
            ('invoice_creation', self._invoice_creation_scenario, 0.4),  # 40% of load
            ('inventory_operations', self._inventory_operations_scenario, 0.3),  # 30% of load
            ('search_operations', self._search_operations_scenario, 0.2),  # 20% of load
            ('accounting_operations', self._accounting_operations_scenario, 0.1)  # 10% of load
        ]
        
        # Calculate users per scenario
        scenario_users = []
        for name, func, percentage in scenarios:
            users = int(concurrent_users * percentage)
            scenario_users.append((name, func, users))
        
        # Run scenarios concurrently
        with ThreadPoolExecutor(max_workers=concurrent_users) as executor:
            futures = []
            
            for scenario_name, scenario_func, users in scenario_users:
                for user_id in range(users):
                    future = executor.submit(
                        self._run_user_scenario,
                        scenario_name,
                        scenario_func,
                        user_id,
                        duration_minutes * 60  # Convert to seconds
                    )
                    futures.append(future)
            
            # Wait for all scenarios to complete
            for future in as_completed(futures):
                try:
                    result = future.result()
                    self._record_scenario_result(result)
                except Exception as e:
                    print(f"Scenario error: {str(e)}")
                    self.results['failed_requests'] += 1
    
    def _run_user_scenario(self, scenario_name: str, scenario_func, user_id: int, duration_seconds: int) -> Dict:
        """Run a single user scenario"""
        start_time = time.time()
        end_time = start_time + duration_seconds
        
        scenario_results = {
            'scenario_name': scenario_name,
            'user_id': user_id,
            'requests': 0,
            'successful_requests': 0,
            'failed_requests': 0,
            'response_times': [],
            'errors': []
        }
        
        while time.time() < end_time:
            try:
                request_start = time.time()
                success = scenario_func(user_id)
                request_end = time.time()
                
                response_time = (request_end - request_start) * 1000  # Convert to milliseconds
                scenario_results['response_times'].append(response_time)
                scenario_results['requests'] += 1
                
                if success:
                    scenario_results['successful_requests'] += 1
                else:
                    scenario_results['failed_requests'] += 1
                
                # Small delay to prevent overwhelming the system
                time.sleep(random.uniform(0.1, 0.5))
                
            except Exception as e:
                scenario_results['failed_requests'] += 1
                scenario_results['errors'].append(str(e))
        
        return scenario_results
    
    def _invoice_creation_scenario(self, user_id: int) -> bool:
        """Invoice creation load test scenario"""
        try:
            # Randomly choose invoice type
            invoice_type = random.choice(['general', 'gold'])
            
            # Select random customer and items
            customer_id = random.choice(self.test_customers)
            num_items = random.randint(1, 5)
            selected_items = random.sample(self.test_items, min(num_items, len(self.test_items)))
            
            # Build invoice data
            items = []
            subtotal = 0
            
            for item_id in selected_items:
                quantity = random.randint(1, 3)
                unit_price = random.uniform(20.0, 200.0)
                total_price = quantity * unit_price
                
                item_data = {
                    "inventory_item_id": item_id,
                    "quantity": quantity,
                    "unit_price": unit_price,
                    "total_price": total_price
                }
                
                if invoice_type == 'gold':
                    item_data["gold_specific"] = {
                        "weight": random.uniform(1.0, 10.0),
                        "purity": random.choice([14, 18, 22, 24]),
                        "labor_cost": random.uniform(50.0, 200.0),
                        "profit_margin": random.uniform(20.0, 100.0)
                    }
                
                items.append(item_data)
                subtotal += total_price
            
            tax_amount = subtotal * 0.1
            total = subtotal + tax_amount
            
            invoice_data = {
                "type": invoice_type,
                "customer_id": customer_id,
                "items": items,
                "subtotal": subtotal,
                "tax_amount": tax_amount,
                "total": total
            }
            
            # Add Gold-specific fields if needed
            if invoice_type == 'gold':
                invoice_data.update({
                    "gold_sood": random.uniform(50.0, 200.0),
                    "gold_ojrat": random.uniform(100.0, 300.0),
                    "gold_maliyat": tax_amount,
                    "gold_price": random.uniform(50.0, 70.0),
                    "gold_total_weight": sum(item.get("gold_specific", {}).get("weight", 0) for item in items)
                })
            
            # Create invoice
            response = requests.post(f"{self.base_url}/api/invoices", json=invoice_data, timeout=30)
            
            if response.status_code == 201:
                invoice = response.json()
                
                # Randomly approve some invoices
                if random.random() < 0.7:  # 70% approval rate
                    approval_data = {"status": "approved"}
                    requests.patch(f"{self.base_url}/api/invoices/{invoice['id']}/status", json=approval_data, timeout=10)
                
                return True
            
            return False
            
        except Exception as e:
            print(f"Invoice creation error: {str(e)}")
            return False
    
    def _inventory_operations_scenario(self, user_id: int) -> bool:
        """Inventory operations load test scenario"""
        try:
            operations = [
                'search_items',
                'get_item_details',
                'update_stock',
                'create_item',
                'get_low_stock'
            ]
            
            operation = random.choice(operations)
            
            if operation == 'search_items':
                params = {
                    'q': random.choice(['test', 'load', 'item', 'product']),
                    'limit': random.randint(10, 50)
                }
                response = requests.get(f"{self.base_url}/api/inventory/search", params=params, timeout=10)
                return response.status_code == 200
            
            elif operation == 'get_item_details':
                item_id = random.choice(self.test_items)
                response = requests.get(f"{self.base_url}/api/inventory/items/{item_id}", timeout=10)
                return response.status_code == 200
            
            elif operation == 'update_stock':
                item_id = random.choice(self.test_items)
                movement_data = {
                    "item_id": item_id,
                    "movement_type": "adjustment",
                    "quantity": random.randint(-10, 10),
                    "reason": f"Load test adjustment {user_id}"
                }
                response = requests.post(f"{self.base_url}/api/inventory/movements", json=movement_data, timeout=10)
                return response.status_code == 201
            
            elif operation == 'create_item':
                item_data = {
                    "name": f"Load Test Item {user_id}_{int(time.time())}",
                    "sku": f"LOAD{user_id}_{int(time.time())}",
                    "category_id": random.choice(self.test_categories),
                    "cost_price": random.uniform(10.0, 100.0),
                    "sale_price": random.uniform(15.0, 150.0),
                    "stock_quantity": random.randint(10, 100)
                }
                response = requests.post(f"{self.base_url}/api/inventory/items", json=item_data, timeout=10)
                return response.status_code == 201
            
            elif operation == 'get_low_stock':
                response = requests.get(f"{self.base_url}/api/inventory/low-stock-alerts", timeout=10)
                return response.status_code == 200
            
            return False
            
        except Exception as e:
            print(f"Inventory operation error: {str(e)}")
            return False
    
    def _search_operations_scenario(self, user_id: int) -> bool:
        """Search operations load test scenario"""
        try:
            search_types = [
                'inventory_search',
                'invoice_search',
                'customer_search',
                'category_search'
            ]
            
            search_type = random.choice(search_types)
            
            if search_type == 'inventory_search':
                params = {
                    'q': random.choice(['load', 'test', 'item', 'product']),
                    'category_id': random.choice(self.test_categories) if random.random() < 0.3 else None,
                    'tags': 'test,load' if random.random() < 0.2 else None,
                    'limit': random.randint(10, 100)
                }
                # Remove None values
                params = {k: v for k, v in params.items() if v is not None}
                response = requests.get(f"{self.base_url}/api/inventory/search", params=params, timeout=10)
                return response.status_code == 200
            
            elif search_type == 'invoice_search':
                params = {
                    'type': random.choice(['general', 'gold']) if random.random() < 0.5 else None,
                    'customer_id': random.choice(self.test_customers) if random.random() < 0.3 else None,
                    'limit': random.randint(10, 50)
                }
                params = {k: v for k, v in params.items() if v is not None}
                response = requests.get(f"{self.base_url}/api/invoices/search", params=params, timeout=10)
                return response.status_code == 200
            
            elif search_type == 'customer_search':
                params = {
                    'q': 'load test',
                    'limit': random.randint(10, 50)
                }
                response = requests.get(f"{self.base_url}/api/customers/search", params=params, timeout=10)
                return response.status_code == 200
            
            elif search_type == 'category_search':
                response = requests.get(f"{self.base_url}/api/categories", timeout=10)
                return response.status_code == 200
            
            return False
            
        except Exception as e:
            print(f"Search operation error: {str(e)}")
            return False
    
    def _accounting_operations_scenario(self, user_id: int) -> bool:
        """Accounting operations load test scenario"""
        try:
            operations = [
                'get_journal_entries',
                'get_chart_of_accounts',
                'get_financial_reports',
                'get_account_balance'
            ]
            
            operation = random.choice(operations)
            
            if operation == 'get_journal_entries':
                params = {
                    'limit': random.randint(10, 100),
                    'source': random.choice(['invoice', 'payment', 'adjustment']) if random.random() < 0.3 else None
                }
                params = {k: v for k, v in params.items() if v is not None}
                response = requests.get(f"{self.base_url}/api/accounting/journal-entries", params=params, timeout=10)
                return response.status_code == 200
            
            elif operation == 'get_chart_of_accounts':
                response = requests.get(f"{self.base_url}/api/accounting/chart-of-accounts", timeout=10)
                return response.status_code == 200
            
            elif operation == 'get_financial_reports':
                report_type = random.choice(['balance_sheet', 'income_statement', 'cash_flow'])
                response = requests.get(f"{self.base_url}/api/accounting/reports/{report_type}", timeout=15)
                return response.status_code == 200
            
            elif operation == 'get_account_balance':
                response = requests.get(f"{self.base_url}/api/accounting/accounts/balance", timeout=10)
                return response.status_code == 200
            
            return False
            
        except Exception as e:
            print(f"Accounting operation error: {str(e)}")
            return False
    
    def _start_system_monitoring(self):
        """Start system resource monitoring"""
        async def monitor():
            while True:
                try:
                    # CPU and Memory usage
                    cpu_percent = psutil.cpu_percent(interval=1)
                    memory = psutil.virtual_memory()
                    
                    # Database connections
                    db_connections = self._get_database_connections()
                    
                    # Store metrics
                    timestamp = datetime.now().isoformat()
                    if 'samples' not in self.results['system_metrics']:
                        self.results['system_metrics']['samples'] = []
                    
                    self.results['system_metrics']['samples'].append({
                        'timestamp': timestamp,
                        'cpu_percent': cpu_percent,
                        'memory_percent': memory.percent,
                        'memory_used_gb': memory.used / (1024**3),
                        'db_connections': db_connections
                    })
                    
                    await asyncio.sleep(5)  # Sample every 5 seconds
                    
                except Exception as e:
                    print(f"Monitoring error: {str(e)}")
                    break
        
        return asyncio.create_task(monitor())
    
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
    
    def _record_scenario_result(self, result: Dict):
        """Record results from a scenario"""
        scenario_name = result['scenario_name']
        
        if scenario_name not in self.results['test_scenarios']:
            self.results['test_scenarios'][scenario_name] = {
                'total_requests': 0,
                'successful_requests': 0,
                'failed_requests': 0,
                'response_times': [],
                'users': 0
            }
        
        scenario_stats = self.results['test_scenarios'][scenario_name]
        scenario_stats['total_requests'] += result['requests']
        scenario_stats['successful_requests'] += result['successful_requests']
        scenario_stats['failed_requests'] += result['failed_requests']
        scenario_stats['response_times'].extend(result['response_times'])
        scenario_stats['users'] += 1
        
        # Update overall results
        self.results['total_requests'] += result['requests']
        self.results['successful_requests'] += result['successful_requests']
        self.results['failed_requests'] += result['failed_requests']
        self.results['response_times'].extend(result['response_times'])
    
    def _analyze_results(self):
        """Analyze load test results"""
        print("Analyzing results...")
        
        if self.results['start_time'] and self.results['end_time']:
            duration = (self.results['end_time'] - self.results['start_time']).total_seconds()
            self.results['duration_seconds'] = duration
            self.results['throughput'] = self.results['total_requests'] / duration if duration > 0 else 0
        
        # Calculate response time statistics
        if self.results['response_times']:
            response_times = self.results['response_times']
            self.results['response_time_stats'] = {
                'min': min(response_times),
                'max': max(response_times),
                'mean': statistics.mean(response_times),
                'median': statistics.median(response_times),
                'p95': self._percentile(response_times, 95),
                'p99': self._percentile(response_times, 99)
            }
        
        # Calculate error rates
        if self.results['total_requests'] > 0:
            self.results['error_rate'] = (self.results['failed_requests'] / self.results['total_requests']) * 100
            self.results['success_rate'] = (self.results['successful_requests'] / self.results['total_requests']) * 100
        
        # Analyze scenario performance
        for scenario_name, scenario_stats in self.results['test_scenarios'].items():
            if scenario_stats['response_times']:
                response_times = scenario_stats['response_times']
                scenario_stats['response_time_stats'] = {
                    'min': min(response_times),
                    'max': max(response_times),
                    'mean': statistics.mean(response_times),
                    'median': statistics.median(response_times),
                    'p95': self._percentile(response_times, 95),
                    'p99': self._percentile(response_times, 99)
                }
            
            if scenario_stats['total_requests'] > 0:
                scenario_stats['error_rate'] = (scenario_stats['failed_requests'] / scenario_stats['total_requests']) * 100
                scenario_stats['success_rate'] = (scenario_stats['successful_requests'] / scenario_stats['total_requests']) * 100
        
        # Analyze system metrics
        if 'samples' in self.results['system_metrics'] and self.results['system_metrics']['samples']:
            samples = self.results['system_metrics']['samples']
            
            cpu_values = [s['cpu_percent'] for s in samples]
            memory_values = [s['memory_percent'] for s in samples]
            db_conn_values = [s['db_connections'] for s in samples]
            
            self.results['system_metrics']['summary'] = {
                'cpu': {
                    'min': min(cpu_values),
                    'max': max(cpu_values),
                    'mean': statistics.mean(cpu_values)
                },
                'memory': {
                    'min': min(memory_values),
                    'max': max(memory_values),
                    'mean': statistics.mean(memory_values)
                },
                'db_connections': {
                    'min': min(db_conn_values),
                    'max': max(db_conn_values),
                    'mean': statistics.mean(db_conn_values)
                }
            }
        
        # Database performance analysis
        self._analyze_database_performance()
    
    def _percentile(self, data: List[float], percentile: int) -> float:
        """Calculate percentile of data"""
        sorted_data = sorted(data)
        index = int((percentile / 100) * len(sorted_data))
        return sorted_data[min(index, len(sorted_data) - 1)]
    
    def _analyze_database_performance(self):
        """Analyze database performance during load test"""
        try:
            with self.SessionLocal() as db:
                # Get slow queries
                slow_queries = db.execute(
                    text("""
                        SELECT query, calls, total_time, mean_time
                        FROM pg_stat_statements
                        WHERE mean_time > 100
                        ORDER BY mean_time DESC
                        LIMIT 10
                    """)
                ).fetchall()
                
                self.results['database_performance']['slow_queries'] = [
                    {
                        'query': row.query[:200] + '...' if len(row.query) > 200 else row.query,
                        'calls': row.calls,
                        'total_time': row.total_time,
                        'mean_time': row.mean_time
                    }
                    for row in slow_queries
                ]
                
                # Get database statistics
                db_stats = db.execute(
                    text("""
                        SELECT 
                            numbackends,
                            xact_commit,
                            xact_rollback,
                            blks_read,
                            blks_hit,
                            tup_returned,
                            tup_fetched,
                            tup_inserted,
                            tup_updated,
                            tup_deleted
                        FROM pg_stat_database 
                        WHERE datname = 'goldshop'
                    """)
                ).fetchone()
                
                if db_stats:
                    self.results['database_performance']['stats'] = {
                        'active_connections': db_stats.numbackends,
                        'transactions_committed': db_stats.xact_commit,
                        'transactions_rolled_back': db_stats.xact_rollback,
                        'blocks_read': db_stats.blks_read,
                        'blocks_hit': db_stats.blks_hit,
                        'cache_hit_ratio': (db_stats.blks_hit / (db_stats.blks_hit + db_stats.blks_read)) * 100 if (db_stats.blks_hit + db_stats.blks_read) > 0 else 0,
                        'tuples_returned': db_stats.tup_returned,
                        'tuples_fetched': db_stats.tup_fetched,
                        'tuples_inserted': db_stats.tup_inserted,
                        'tuples_updated': db_stats.tup_updated,
                        'tuples_deleted': db_stats.tup_deleted
                    }
                
        except Exception as e:
            print(f"Database performance analysis error: {str(e)}")
            self.results['database_performance']['error'] = str(e)
    
    def _cleanup_test_data(self):
        """Clean up test data"""
        print("Cleaning up test data...")
        
        try:
            with self.SessionLocal() as db:
                # Delete test items
                for item_id in self.test_items:
                    db.execute(text("DELETE FROM inventory_items WHERE id = :id"), {"id": item_id})
                
                # Delete test categories
                for category_id in self.test_categories:
                    db.execute(text("DELETE FROM categories WHERE id = :id"), {"id": category_id})
                
                # Delete test customers
                for customer_id in self.test_customers:
                    db.execute(text("DELETE FROM customers WHERE id = :id"), {"id": customer_id})
                
                db.commit()
                
        except Exception as e:
            print(f"Cleanup error: {str(e)}")
    
    def print_results(self):
        """Print load test results"""
        print("\n" + "="*80)
        print("LOAD TEST RESULTS")
        print("="*80)
        
        print(f"Duration: {self.results.get('duration_seconds', 0):.2f} seconds")
        print(f"Concurrent Users: {self.results['concurrent_users']}")
        print(f"Total Requests: {self.results['total_requests']}")
        print(f"Successful Requests: {self.results['successful_requests']}")
        print(f"Failed Requests: {self.results['failed_requests']}")
        print(f"Success Rate: {self.results.get('success_rate', 0):.2f}%")
        print(f"Error Rate: {self.results.get('error_rate', 0):.2f}%")
        print(f"Throughput: {self.results.get('throughput', 0):.2f} requests/second")
        
        if 'response_time_stats' in self.results:
            stats = self.results['response_time_stats']
            print(f"\nResponse Time Statistics (ms):")
            print(f"  Min: {stats['min']:.2f}")
            print(f"  Max: {stats['max']:.2f}")
            print(f"  Mean: {stats['mean']:.2f}")
            print(f"  Median: {stats['median']:.2f}")
            print(f"  95th Percentile: {stats['p95']:.2f}")
            print(f"  99th Percentile: {stats['p99']:.2f}")
        
        print(f"\nScenario Performance:")
        for scenario_name, scenario_stats in self.results['test_scenarios'].items():
            print(f"  {scenario_name}:")
            print(f"    Users: {scenario_stats['users']}")
            print(f"    Requests: {scenario_stats['total_requests']}")
            print(f"    Success Rate: {scenario_stats.get('success_rate', 0):.2f}%")
            if 'response_time_stats' in scenario_stats:
                print(f"    Avg Response Time: {scenario_stats['response_time_stats']['mean']:.2f}ms")
        
        if 'summary' in self.results['system_metrics']:
            summary = self.results['system_metrics']['summary']
            print(f"\nSystem Resource Usage:")
            print(f"  CPU: {summary['cpu']['mean']:.2f}% (max: {summary['cpu']['max']:.2f}%)")
            print(f"  Memory: {summary['memory']['mean']:.2f}% (max: {summary['memory']['max']:.2f}%)")
            print(f"  DB Connections: {summary['db_connections']['mean']:.1f} (max: {summary['db_connections']['max']})")
        
        if 'stats' in self.results['database_performance']:
            db_stats = self.results['database_performance']['stats']
            print(f"\nDatabase Performance:")
            print(f"  Cache Hit Ratio: {db_stats['cache_hit_ratio']:.2f}%")
            print(f"  Active Connections: {db_stats['active_connections']}")
            print(f"  Transactions Committed: {db_stats['transactions_committed']}")
            print(f"  Transactions Rolled Back: {db_stats['transactions_rolled_back']}")
        
        print("="*80)


def main():
    """Main entry point for load testing"""
    framework = LoadTestFramework()
    
    # Run load tests with different configurations
    test_configs = [
        (50, 2),   # 50 users for 2 minutes (warm-up)
        (100, 5),  # 100 users for 5 minutes (main test)
        (150, 3),  # 150 users for 3 minutes (stress test)
    ]
    
    all_results = []
    
    for concurrent_users, duration_minutes in test_configs:
        print(f"\n{'='*60}")
        print(f"Running load test: {concurrent_users} users for {duration_minutes} minutes")
        print(f"{'='*60}")
        
        results = framework.run_load_tests(concurrent_users, duration_minutes)
        all_results.append(results)
        
        framework.print_results()
        
        # Save individual results
        with open(f'tests/load_test_results_{concurrent_users}users_{duration_minutes}min.json', 'w') as f:
            json.dump(results, f, indent=2, default=str)
        
        # Wait between tests
        if test_configs.index((concurrent_users, duration_minutes)) < len(test_configs) - 1:
            print("\nWaiting 30 seconds before next test...")
            time.sleep(30)
    
    # Save combined results
    combined_results = {
        'test_configurations': test_configs,
        'results': all_results,
        'summary': {
            'total_tests': len(all_results),
            'max_concurrent_users': max(r['concurrent_users'] for r in all_results),
            'total_requests': sum(r['total_requests'] for r in all_results),
            'overall_success_rate': sum(r.get('success_rate', 0) for r in all_results) / len(all_results),
            'best_throughput': max(r.get('throughput', 0) for r in all_results)
        }
    }
    
    with open('tests/load_test_comprehensive_results.json', 'w') as f:
        json.dump(combined_results, f, indent=2, default=str)
    
    print(f"\n{'='*80}")
    print("COMPREHENSIVE LOAD TEST SUMMARY")
    print(f"{'='*80}")
    print(f"Total Tests: {combined_results['summary']['total_tests']}")
    print(f"Max Concurrent Users: {combined_results['summary']['max_concurrent_users']}")
    print(f"Total Requests: {combined_results['summary']['total_requests']}")
    print(f"Overall Success Rate: {combined_results['summary']['overall_success_rate']:.2f}%")
    print(f"Best Throughput: {combined_results['summary']['best_throughput']:.2f} requests/second")
    print(f"{'='*80}")
    
    # Determine if load tests passed
    min_success_rate = 95.0  # 95% minimum success rate
    max_error_rate = 5.0     # 5% maximum error rate
    min_throughput = 10.0    # 10 requests/second minimum
    
    passed = all(
        r.get('success_rate', 0) >= min_success_rate and
        r.get('error_rate', 100) <= max_error_rate and
        r.get('throughput', 0) >= min_throughput
        for r in all_results
    )
    
    if passed:
        print("✅ Load tests PASSED - System meets performance requirements")
        return 0
    else:
        print("❌ Load tests FAILED - System does not meet performance requirements")
        return 1


if __name__ == "__main__":
    exit(main())