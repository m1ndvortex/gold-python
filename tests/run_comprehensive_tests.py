#!/usr/bin/env python3
"""
Comprehensive Test Runner

Main entry point for running all comprehensive tests including:
- End-to-end workflow tests
- Load testing
- Regression tests
- Image processing tests
- QR code tests
- Accounting validation tests
- Performance tests
- Coverage reporting
"""

import argparse
import json
import os
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path

# Add the tests directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

from comprehensive_test_framework import ComprehensiveTestFramework


def run_command(command, cwd=None, timeout=None):
    """Run a command and return the result"""
    try:
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            cwd=cwd,
            timeout=timeout
        )
        return {
            'success': result.returncode == 0,
            'returncode': result.returncode,
            'stdout': result.stdout,
            'stderr': result.stderr
        }
    except subprocess.TimeoutExpired:
        return {
            'success': False,
            'returncode': -1,
            'stdout': '',
            'stderr': f'Command timed out after {timeout} seconds'
        }
    except Exception as e:
        return {
            'success': False,
            'returncode': -1,
            'stdout': '',
            'stderr': str(e)
        }


def check_docker_environment():
    """Check if Docker environment is ready"""
    print("Checking Docker environment...")
    
    # Check if Docker is running
    result = run_command("docker ps", timeout=10)
    if not result['success']:
        print("❌ Docker is not running or not accessible")
        return False
    
    # Check if required services are running
    required_services = [
        'goldshop_db',
        'goldshop_backend',
        'goldshop_frontend'
    ]
    
    for service in required_services:
        result = run_command(f"docker ps --filter name={service} --format '{{{{.Names}}}}'", timeout=10)
        if not result['success'] or service not in result['stdout']:
            print(f"❌ Service {service} is not running")
            return False
    
    print("✅ Docker environment is ready")
    return True


def wait_for_services():
    """Wait for services to be healthy"""
    print("Waiting for services to be healthy...")
    
    max_attempts = 30
    attempt = 0
    
    while attempt < max_attempts:
        try:
            import requests
            response = requests.get('http://localhost:8000/health', timeout=5)
            if response.status_code == 200:
                print("✅ Services are healthy")
                return True
        except:
            pass
        
        attempt += 1
        print(f"Waiting for services... ({attempt}/{max_attempts})")
        time.sleep(5)
    
    print("❌ Services did not become healthy within timeout")
    return False


def run_pytest_tests(test_pattern, test_name, timeout=1800):
    """Run pytest tests with coverage"""
    print(f"\n{'='*60}")
    print(f"Running {test_name}")
    print(f"{'='*60}")
    
    # Run tests in Docker backend container
    command = f"""
    docker-compose exec -T backend python -m pytest {test_pattern} \
        -v --tb=short \
        --cov=. --cov-report=json:coverage_{test_name.lower().replace(' ', '_')}.json \
        --junitxml=test_results_{test_name.lower().replace(' ', '_')}.xml \
        --timeout=300
    """
    
    result = run_command(command, timeout=timeout)
    
    if result['success']:
        print(f"✅ {test_name} PASSED")
    else:
        print(f"❌ {test_name} FAILED")
        print(f"Error: {result['stderr']}")
    
    return result


def run_frontend_tests(timeout=900):
    """Run frontend tests"""
    print(f"\n{'='*60}")
    print("Running Frontend Tests")
    print(f"{'='*60}")
    
    command = """
    docker-compose exec -T frontend npm test -- \
        --watchAll=false --coverage \
        --coverageReporters=json --coverageDirectory=coverage \
        --testTimeout=120000
    """
    
    result = run_command(command, timeout=timeout)
    
    if result['success']:
        print("✅ Frontend Tests PASSED")
    else:
        print("❌ Frontend Tests FAILED")
        print(f"Error: {result['stderr']}")
    
    return result


def run_load_tests(timeout=1800):
    """Run load tests"""
    print(f"\n{'='*60}")
    print("Running Load Tests")
    print(f"{'='*60}")
    
    command = "docker-compose exec -T backend python tests/test_load_performance.py"
    result = run_command(command, timeout=timeout)
    
    if result['success']:
        print("✅ Load Tests PASSED")
    else:
        print("❌ Load Tests FAILED")
        print(f"Error: {result['stderr']}")
    
    return result


def run_performance_tests(timeout=1800):
    """Run performance tests"""
    print(f"\n{'='*60}")
    print("Running Performance Tests")
    print(f"{'='*60}")
    
    command = "docker-compose exec -T backend python tests/test_performance_comprehensive.py"
    result = run_command(command, timeout=timeout)
    
    if result['success']:
        print("✅ Performance Tests PASSED")
    else:
        print("❌ Performance Tests FAILED")
        print(f"Error: {result['stderr']}")
    
    return result


def generate_coverage_report():
    """Generate comprehensive coverage report"""
    print(f"\n{'='*60}")
    print("Generating Coverage Report")
    print(f"{'='*60}")
    
    # Combine backend coverage
    backend_command = """
    docker-compose exec -T backend python -m coverage combine && \
    docker-compose exec -T backend python -m coverage report --format=json > backend_coverage_final.json && \
    docker-compose exec -T backend python -m coverage html -d coverage_html
    """
    
    backend_result = run_command(backend_command, timeout=300)
    
    # Get frontend coverage
    frontend_command = "docker-compose exec -T frontend cat coverage/coverage-summary.json"
    frontend_result = run_command(frontend_command, timeout=60)
    
    coverage_summary = {
        'backend': {
            'success': backend_result['success'],
            'coverage': 0
        },
        'frontend': {
            'success': frontend_result['success'],
            'coverage': 0
        },
        'overall': 0
    }
    
    # Parse backend coverage
    if backend_result['success']:
        try:
            # Try to extract coverage from output
            lines = backend_result['stdout'].split('\n')
            for line in lines:
                if 'TOTAL' in line and '%' in line:
                    # Extract percentage
                    parts = line.split()
                    for part in parts:
                        if '%' in part:
                            coverage_summary['backend']['coverage'] = float(part.replace('%', ''))
                            break
        except:
            pass
    
    # Parse frontend coverage
    if frontend_result['success']:
        try:
            frontend_data = json.loads(frontend_result['stdout'])
            coverage_summary['frontend']['coverage'] = frontend_data.get('total', {}).get('lines', {}).get('pct', 0)
        except:
            pass
    
    # Calculate overall coverage
    if coverage_summary['backend']['success'] and coverage_summary['frontend']['success']:
        coverage_summary['overall'] = (coverage_summary['backend']['coverage'] + coverage_summary['frontend']['coverage']) / 2
    elif coverage_summary['backend']['success']:
        coverage_summary['overall'] = coverage_summary['backend']['coverage']
    elif coverage_summary['frontend']['success']:
        coverage_summary['overall'] = coverage_summary['frontend']['coverage']
    
    print(f"Backend Coverage: {coverage_summary['backend']['coverage']:.1f}%")
    print(f"Frontend Coverage: {coverage_summary['frontend']['coverage']:.1f}%")
    print(f"Overall Coverage: {coverage_summary['overall']:.1f}%")
    
    # Check if coverage meets minimum requirement
    min_coverage = 80.0
    if coverage_summary['overall'] >= min_coverage:
        print(f"✅ Coverage meets minimum requirement ({min_coverage}%)")
        coverage_passed = True
    else:
        print(f"❌ Coverage below minimum requirement ({min_coverage}%)")
        coverage_passed = False
    
    return coverage_passed, coverage_summary


def main():
    """Main test runner"""
    parser = argparse.ArgumentParser(description='Run comprehensive tests')
    parser.add_argument('--skip-docker-check', action='store_true', help='Skip Docker environment check')
    parser.add_argument('--tests', choices=['all', 'unit', 'integration', 'e2e', 'load', 'performance'], 
                       default='all', help='Which tests to run')
    parser.add_argument('--timeout', type=int, default=3600, help='Overall timeout in seconds')
    parser.add_argument('--coverage-only', action='store_true', help='Only generate coverage report')
    
    args = parser.parse_args()
    
    start_time = datetime.now()
    
    print("🚀 Starting Comprehensive Test Suite")
    print(f"Start time: {start_time.isoformat()}")
    print(f"Tests to run: {args.tests}")
    print(f"Timeout: {args.timeout} seconds")
    
    # Check Docker environment
    if not args.skip_docker_check:
        if not check_docker_environment():
            print("❌ Docker environment check failed")
            return 1
        
        if not wait_for_services():
            print("❌ Services health check failed")
            return 1
    
    # If only generating coverage report
    if args.coverage_only:
        coverage_passed, coverage_summary = generate_coverage_report()
        return 0 if coverage_passed else 1
    
    # Test results tracking
    test_results = {
        'start_time': start_time.isoformat(),
        'end_time': None,
        'tests_run': [],
        'passed_tests': 0,
        'failed_tests': 0,
        'coverage': {},
        'summary': {}
    }
    
    try:
        # Run different test suites based on selection
        if args.tests in ['all', 'unit']:
            # Unit tests
            result = run_pytest_tests(
                "tests/test_inventory_regression.py tests/test_accounting_validation.py",
                "Unit Tests",
                timeout=900
            )
            test_results['tests_run'].append(('Unit Tests', result['success']))
            if result['success']:
                test_results['passed_tests'] += 1
            else:
                test_results['failed_tests'] += 1
        
        if args.tests in ['all', 'integration']:
            # Integration tests
            result = run_pytest_tests(
                "tests/test_image_processing_comprehensive.py tests/test_qr_code_comprehensive.py",
                "Integration Tests",
                timeout=1200
            )
            test_results['tests_run'].append(('Integration Tests', result['success']))
            if result['success']:
                test_results['passed_tests'] += 1
            else:
                test_results['failed_tests'] += 1
        
        if args.tests in ['all', 'e2e']:
            # End-to-end tests
            result = run_pytest_tests(
                "tests/test_inventory_workflow_e2e.py tests/test_invoice_workflow_e2e.py",
                "End-to-End Tests",
                timeout=1800
            )
            test_results['tests_run'].append(('End-to-End Tests', result['success']))
            if result['success']:
                test_results['passed_tests'] += 1
            else:
                test_results['failed_tests'] += 1
            
            # Frontend tests
            result = run_frontend_tests(timeout=900)
            test_results['tests_run'].append(('Frontend Tests', result['success']))
            if result['success']:
                test_results['passed_tests'] += 1
            else:
                test_results['failed_tests'] += 1
        
        if args.tests in ['all', 'load']:
            # Load tests
            result = run_load_tests(timeout=1800)
            test_results['tests_run'].append(('Load Tests', result['success']))
            if result['success']:
                test_results['passed_tests'] += 1
            else:
                test_results['failed_tests'] += 1
        
        if args.tests in ['all', 'performance']:
            # Performance tests
            result = run_performance_tests(timeout=1800)
            test_results['tests_run'].append(('Performance Tests', result['success']))
            if result['success']:
                test_results['passed_tests'] += 1
            else:
                test_results['failed_tests'] += 1
        
        # Generate coverage report
        coverage_passed, coverage_summary = generate_coverage_report()
        test_results['coverage'] = coverage_summary
        
        if not coverage_passed:
            test_results['failed_tests'] += 1
        else:
            test_results['passed_tests'] += 1
        
    except KeyboardInterrupt:
        print("\n⚠️ Tests interrupted by user")
        return 1
    
    except Exception as e:
        print(f"\n❌ Unexpected error: {str(e)}")
        return 1
    
    finally:
        end_time = datetime.now()
        test_results['end_time'] = end_time.isoformat()
        duration = end_time - start_time
        
        # Generate final summary
        total_tests = test_results['passed_tests'] + test_results['failed_tests']
        success_rate = (test_results['passed_tests'] / total_tests * 100) if total_tests > 0 else 0
        
        test_results['summary'] = {
            'total_tests': total_tests,
            'passed_tests': test_results['passed_tests'],
            'failed_tests': test_results['failed_tests'],
            'success_rate': success_rate,
            'duration_seconds': duration.total_seconds(),
            'coverage_overall': test_results['coverage'].get('overall', 0)
        }
        
        # Save results
        with open('tests/comprehensive_test_results.json', 'w') as f:
            json.dump(test_results, f, indent=2, default=str)
        
        # Print final summary
        print(f"\n{'='*80}")
        print("COMPREHENSIVE TEST RESULTS SUMMARY")
        print(f"{'='*80}")
        print(f"Duration: {duration}")
        print(f"Total Test Suites: {total_tests}")
        print(f"Passed: {test_results['passed_tests']}")
        print(f"Failed: {test_results['failed_tests']}")
        print(f"Success Rate: {success_rate:.1f}%")
        print(f"Overall Coverage: {test_results['coverage'].get('overall', 0):.1f}%")
        
        print(f"\nTest Suite Results:")
        for test_name, passed in test_results['tests_run']:
            status = "✅ PASSED" if passed else "❌ FAILED"
            print(f"  {test_name}: {status}")
        
        # Determine overall result
        min_success_rate = 80.0  # 80% minimum success rate
        min_coverage = 80.0      # 80% minimum coverage
        
        overall_passed = (
            success_rate >= min_success_rate and
            test_results['coverage'].get('overall', 0) >= min_coverage
        )
        
        if overall_passed:
            print(f"\n🎉 COMPREHENSIVE TESTS PASSED")
            print(f"   Success Rate: {success_rate:.1f}% (≥{min_success_rate}%)")
            print(f"   Coverage: {test_results['coverage'].get('overall', 0):.1f}% (≥{min_coverage}%)")
            return 0
        else:
            print(f"\n💥 COMPREHENSIVE TESTS FAILED")
            if success_rate < min_success_rate:
                print(f"   Success Rate: {success_rate:.1f}% (<{min_success_rate}%)")
            if test_results['coverage'].get('overall', 0) < min_coverage:
                print(f"   Coverage: {test_results['coverage'].get('overall', 0):.1f}% (<{min_coverage}%)")
            return 1


if __name__ == "__main__":
    exit(main())