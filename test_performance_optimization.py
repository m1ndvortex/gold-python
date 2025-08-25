#!/usr/bin/env python3
"""
Performance Optimization Test

This script tests the performance improvements for:
1. Category tree loading
2. SMS dashboard statistics
"""

import time
import requests
import json
from datetime import datetime

# Configuration
API_BASE_URL = "http://localhost:8000"
TEST_TOKEN = None  # Will be set after login

def login_and_get_token():
    """Login and get authentication token"""
    global TEST_TOKEN
    
    login_data = {
        "username": "admin",
        "password": "admin123"
    }
    
    response = requests.post(f"{API_BASE_URL}/auth/login", data=login_data)
    if response.status_code == 200:
        TEST_TOKEN = response.json()["access_token"]
        print("✅ Successfully logged in")
        return True
    else:
        print(f"❌ Login failed: {response.status_code}")
        return False

def get_headers():
    """Get headers with authentication"""
    return {
        "Authorization": f"Bearer {TEST_TOKEN}",
        "Content-Type": "application/json"
    }

def test_category_tree_performance():
    """Test category tree loading performance"""
    print("\n=== CATEGORY TREE PERFORMANCE TEST ===")
    
    # Test multiple requests to measure consistency
    times = []
    for i in range(5):
        start_time = time.time()
        response = requests.get(
            f"{API_BASE_URL}/inventory/categories/tree",
            headers=get_headers()
        )
        end_time = time.time()
        
        if response.status_code == 200:
            request_time = (end_time - start_time) * 1000
            times.append(request_time)
            categories = response.json()
            print(f"Request {i+1}: {request_time:.2f}ms ({len(categories)} root categories)")
        else:
            print(f"Request {i+1}: Failed with status {response.status_code}")
    
    if times:
        avg_time = sum(times) / len(times)
        min_time = min(times)
        max_time = max(times)
        
        print(f"\nCategory Tree Performance Summary:")
        print(f"  Average: {avg_time:.2f}ms")
        print(f"  Min: {min_time:.2f}ms")
        print(f"  Max: {max_time:.2f}ms")
        
        # Performance threshold (should be under 500ms)
        if avg_time < 500:
            print("✅ Category tree performance is GOOD")
        elif avg_time < 1000:
            print("⚠️  Category tree performance is ACCEPTABLE")
        else:
            print("❌ Category tree performance is POOR")

def test_sms_statistics_performance():
    """Test SMS statistics loading performance"""
    print("\n=== SMS STATISTICS PERFORMANCE TEST ===")
    
    # Test multiple requests to measure consistency
    times = []
    for i in range(5):
        start_time = time.time()
        response = requests.get(
            f"{API_BASE_URL}/sms/statistics",
            headers=get_headers()
        )
        end_time = time.time()
        
        if response.status_code == 200:
            request_time = (end_time - start_time) * 1000
            times.append(request_time)
            stats = response.json()
            print(f"Request {i+1}: {request_time:.2f}ms (campaigns: {stats.get('total_campaigns', 0)})")
        else:
            print(f"Request {i+1}: Failed with status {response.status_code}")
    
    if times:
        avg_time = sum(times) / len(times)
        min_time = min(times)
        max_time = max(times)
        
        print(f"\nSMS Statistics Performance Summary:")
        print(f"  Average: {avg_time:.2f}ms")
        print(f"  Min: {min_time:.2f}ms")
        print(f"  Max: {max_time:.2f}ms")
        
        # Performance threshold (should be under 300ms)
        if avg_time < 300:
            print("✅ SMS statistics performance is GOOD")
        elif avg_time < 600:
            print("⚠️  SMS statistics performance is ACCEPTABLE")
        else:
            print("❌ SMS statistics performance is POOR")

def test_concurrent_requests():
    """Test concurrent request handling"""
    print("\n=== CONCURRENT REQUEST TEST ===")
    
    import threading
    import queue
    
    results = queue.Queue()
    
    def make_request(endpoint, request_id):
        start_time = time.time()
        response = requests.get(f"{API_BASE_URL}{endpoint}", headers=get_headers())
        end_time = time.time()
        
        results.put({
            'id': request_id,
            'endpoint': endpoint,
            'time': (end_time - start_time) * 1000,
            'status': response.status_code
        })
    
    # Create concurrent threads
    threads = []
    endpoints = [
        "/inventory/categories/tree",
        "/sms/statistics",
        "/inventory/categories/tree",
        "/sms/statistics",
        "/inventory/categories/tree"
    ]
    
    start_time = time.time()
    for i, endpoint in enumerate(endpoints):
        thread = threading.Thread(target=make_request, args=(endpoint, i))
        threads.append(thread)
        thread.start()
    
    # Wait for all threads to complete
    for thread in threads:
        thread.join()
    
    total_time = (time.time() - start_time) * 1000
    
    # Collect results
    all_results = []
    while not results.empty():
        all_results.append(results.get())
    
    print(f"Concurrent requests completed in {total_time:.2f}ms")
    for result in sorted(all_results, key=lambda x: x['id']):
        print(f"  Request {result['id']} ({result['endpoint']}): {result['time']:.2f}ms")
    
    avg_concurrent_time = sum(r['time'] for r in all_results) / len(all_results)
    print(f"Average concurrent request time: {avg_concurrent_time:.2f}ms")

def main():
    """Run all performance tests"""
    print("🚀 Starting Performance Optimization Tests")
    print(f"Testing API at: {API_BASE_URL}")
    print(f"Test started at: {datetime.now()}")
    
    # Login first
    if not login_and_get_token():
        print("❌ Cannot proceed without authentication")
        return
    
    # Run performance tests
    test_category_tree_performance()
    test_sms_statistics_performance()
    test_concurrent_requests()
    
    print(f"\n🏁 Performance tests completed at: {datetime.now()}")
    print("\nRecommendations:")
    print("- Category tree should load in < 500ms")
    print("- SMS statistics should load in < 300ms")
    print("- Both should handle concurrent requests well")

if __name__ == "__main__":
    main()