#!/usr/bin/env python3
"""
Comprehensive Testing Framework for Universal Inventory and Invoice Management System

This framework implements all testing requirements from task 14:
- End-to-end test suite covering all workflows
- Load testing framework for 100+ concurrent users
- Regression test suite for inventory movements and pricing
- Image processing and display testing
- QR code generation and card access testing
- Accounting validation testing
- Cross-browser compatibility testing
- Automated test coverage reporting (80% minimum)
- Performance testing suite
- All tests use real PostgreSQL database in Docker environment
"""

import asyncio
import json
import logging
import os
import subprocess
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import psutil
import pytest
import requests
from selenium import webdriver
from selenium.webdriver.chrome.options import Options as ChromeOptions
from selenium.webdriver.firefox.options import Options as FirefoxOptions

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('tests/comprehensive_test_results.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

class ComprehensiveTestFramework:
    """Main test framework orchestrator"""
    
    def __init__(self):
        self.test_results = {
            'start_time': datetime.now().isoformat(),
            'end_time': None,
            'total_tests': 0,
            'passed_tests': 0,
            'failed_tests': 0,
            'test_suites': {},
            'coverage_report': {},
            'performance_metrics': {},
            'load_test_results': {},
            'browser_compatibility': {},
            'errors': []
        }
        self.docker_services = [
            'goldshop_db', 'goldshop_redis', 'goldshop_backend', 
            'goldshop_frontend', 'goldshop_nginx'
        ]
        
    def run_all_tests(self) -> Dict:
        """Run all test suites in the comprehensive framework"""
        logger.info("Starting Comprehensive Testing Framework")
        
        try:
            # 1. Verify Docker environment
            self._verify_docker_environment()
            
            # 2. Run backend unit and integration tests
            self._run_backend_tests()
            
            # 3. Run frontend unit and integration tests
            self._run_frontend_tests()
            
            # 4. Run end-to-end workflow tests
            self._run_end_to_end_tests()
            
            # 5. Run load testing
            self._run_load_tests()
            
            # 6. Run regression tests
            self._run_regression_tests()
            
            # 7. Run image processing tests
            self._run_image_processing_tests()
            
            # 8. Run QR code tests
            self._run_qr_code_tests()
            
            # 9. Run accounting validation tests
            self._run_accounting_tests()
            
            # 10. Run cross-browser compatibility tests
            self._run_browser_compatibility_tests()
            
            # 11. Run performance tests
            self._run_performance_tests()
            
            # 12. Generate coverage reports
            self._generate_coverage_reports()
            
            # 13. Generate final report
            self._generate_final_report()
            
        except Exception as e:
            logger.error(f"Critical error in test framework: {str(e)}")
            self.test_results['errors'].append({
                'type': 'framework_error',
                'message': str(e),
                'timestamp': datetime.now().isoformat()
            })
        
        finally:
            self.test_results['end_time'] = datetime.now().isoformat()
            
        return self.test_results
    
    def _verify_docker_environment(self):
        """Verify all Docker services are running"""
        logger.info("Verifying Docker environment...")
        
        try:
            # Check if Docker is running
            result = subprocess.run(['docker', 'ps'], capture_output=True, text=True)
            if result.returncode != 0:
                raise Exception("Docker is not running")
            
            # Check if all required services are running
            for service in self.docker_services:
                result = subprocess.run(
                    ['docker', 'ps', '--filter', f'name={service}', '--format', '{{.Names}}'],
                    capture_output=True, text=True
                )
                if service not in result.stdout:
                    logger.warning(f"Service {service} is not running, attempting to start...")
                    subprocess.run(['docker-compose', 'up', '-d', service.replace('goldshop_', '')])
            
            # Wait for services to be healthy
            self._wait_for_services_health()
            
            logger.info("Docker environment verified successfully")
            
        except Exception as e:
            raise Exception(f"Docker environment verification failed: {str(e)}")
    
    def _wait_for_services_health(self, timeout: int = 120):
        """Wait for all services to be healthy"""
        logger.info("Waiting for services to be healthy...")
        
        start_time = time.time()
        while time.time() - start_time < timeout:
            try:
                # Check database
                response = requests.get('http://localhost:8000/health', timeout=5)
                if response.status_code == 200:
                    logger.info("All services are healthy")
                    return
            except requests.RequestException:
                pass
            
            time.sleep(5)
        
        raise Exception("Services did not become healthy within timeout")
    
    def _run_backend_tests(self):
        """Run all backend tests using pytest"""
        logger.info("Running backend tests...")
        
        try:
            # Run backend tests in Docker container
            cmd = [
                'docker-compose', 'exec', '-T', 'backend',
                'python', '-m', 'pytest', '-v', '--tb=short',
                '--cov=.', '--cov-report=json:coverage_backend.json',
                '--junitxml=test_results_backend.xml'
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, cwd='.')
            
            self.test_results['test_suites']['backend'] = {
                'exit_code': result.returncode,
                'stdout': result.stdout,
                'stderr': result.stderr,
                'passed': result.returncode == 0
            }
            
            if result.returncode == 0:
                self.test_results['passed_tests'] += 1
                logger.info("Backend tests passed")
            else:
                self.test_results['failed_tests'] += 1
                logger.error(f"Backend tests failed: {result.stderr}")
            
            self.test_results['total_tests'] += 1
            
        except Exception as e:
            logger.error(f"Error running backend tests: {str(e)}")
            self.test_results['errors'].append({
                'type': 'backend_test_error',
                'message': str(e),
                'timestamp': datetime.now().isoformat()
            })
    
    def _run_frontend_tests(self):
        """Run all frontend tests using Jest"""
        logger.info("Running frontend tests...")
        
        try:
            # Run frontend tests in Docker container
            cmd = [
                'docker-compose', 'exec', '-T', 'frontend',
                'npm', 'test', '--', '--watchAll=false', '--coverage',
                '--coverageReporters=json', '--coverageDirectory=coverage'
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, cwd='.')
            
            self.test_results['test_suites']['frontend'] = {
                'exit_code': result.returncode,
                'stdout': result.stdout,
                'stderr': result.stderr,
                'passed': result.returncode == 0
            }
            
            if result.returncode == 0:
                self.test_results['passed_tests'] += 1
                logger.info("Frontend tests passed")
            else:
                self.test_results['failed_tests'] += 1
                logger.error(f"Frontend tests failed: {result.stderr}")
            
            self.test_results['total_tests'] += 1
            
        except Exception as e:
            logger.error(f"Error running frontend tests: {str(e)}")
            self.test_results['errors'].append({
                'type': 'frontend_test_error',
                'message': str(e),
                'timestamp': datetime.now().isoformat()
            })
    
    def _run_end_to_end_tests(self):
        """Run end-to-end workflow tests"""
        logger.info("Running end-to-end tests...")
        
        try:
            # Run specific E2E test files
            e2e_tests = [
                'test_inventory_workflow_e2e.py',
                'test_invoice_workflow_e2e.py',
                'test_accounting_workflow_e2e.py',
                'test_image_management_workflow_e2e.py',
                'test_qr_cards_workflow_e2e.py'
            ]
            
            for test_file in e2e_tests:
                cmd = [
                    'docker-compose', 'exec', '-T', 'backend',
                    'python', '-m', 'pytest', f'tests/{test_file}', '-v'
                ]
                
                result = subprocess.run(cmd, capture_output=True, text=True, cwd='.')
                
                self.test_results['test_suites'][f'e2e_{test_file}'] = {
                    'exit_code': result.returncode,
                    'passed': result.returncode == 0
                }
                
                if result.returncode == 0:
                    self.test_results['passed_tests'] += 1
                else:
                    self.test_results['failed_tests'] += 1
                
                self.test_results['total_tests'] += 1
            
            logger.info("End-to-end tests completed")
            
        except Exception as e:
            logger.error(f"Error running end-to-end tests: {str(e)}")
            self.test_results['errors'].append({
                'type': 'e2e_test_error',
                'message': str(e),
                'timestamp': datetime.now().isoformat()
            })
    
    def _run_load_tests(self):
        """Run load tests simulating 100+ concurrent users"""
        logger.info("Running load tests...")
        
        try:
            # Run load test script
            cmd = [
                'docker-compose', 'exec', '-T', 'backend',
                'python', 'tests/test_load_performance.py'
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, cwd='.')
            
            self.test_results['load_test_results'] = {
                'exit_code': result.returncode,
                'stdout': result.stdout,
                'stderr': result.stderr,
                'passed': result.returncode == 0
            }
            
            if result.returncode == 0:
                self.test_results['passed_tests'] += 1
                logger.info("Load tests passed")
            else:
                self.test_results['failed_tests'] += 1
                logger.error(f"Load tests failed: {result.stderr}")
            
            self.test_results['total_tests'] += 1
            
        except Exception as e:
            logger.error(f"Error running load tests: {str(e)}")
            self.test_results['errors'].append({
                'type': 'load_test_error',
                'message': str(e),
                'timestamp': datetime.now().isoformat()
            })
    
    def _run_regression_tests(self):
        """Run regression tests for inventory movements and pricing"""
        logger.info("Running regression tests...")
        
        try:
            regression_tests = [
                'test_inventory_regression.py',
                'test_pricing_regression.py',
                'test_gold_invoice_regression.py'
            ]
            
            for test_file in regression_tests:
                cmd = [
                    'docker-compose', 'exec', '-T', 'backend',
                    'python', '-m', 'pytest', f'tests/{test_file}', '-v'
                ]
                
                result = subprocess.run(cmd, capture_output=True, text=True, cwd='.')
                
                self.test_results['test_suites'][f'regression_{test_file}'] = {
                    'exit_code': result.returncode,
                    'passed': result.returncode == 0
                }
                
                if result.returncode == 0:
                    self.test_results['passed_tests'] += 1
                else:
                    self.test_results['failed_tests'] += 1
                
                self.test_results['total_tests'] += 1
            
            logger.info("Regression tests completed")
            
        except Exception as e:
            logger.error(f"Error running regression tests: {str(e)}")
            self.test_results['errors'].append({
                'type': 'regression_test_error',
                'message': str(e),
                'timestamp': datetime.now().isoformat()
            })
    
    def _run_image_processing_tests(self):
        """Run image processing and display tests"""
        logger.info("Running image processing tests...")
        
        try:
            cmd = [
                'docker-compose', 'exec', '-T', 'backend',
                'python', '-m', 'pytest', 'tests/test_image_processing_comprehensive.py', '-v'
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, cwd='.')
            
            self.test_results['test_suites']['image_processing'] = {
                'exit_code': result.returncode,
                'passed': result.returncode == 0
            }
            
            if result.returncode == 0:
                self.test_results['passed_tests'] += 1
                logger.info("Image processing tests passed")
            else:
                self.test_results['failed_tests'] += 1
                logger.error("Image processing tests failed")
            
            self.test_results['total_tests'] += 1
            
        except Exception as e:
            logger.error(f"Error running image processing tests: {str(e)}")
            self.test_results['errors'].append({
                'type': 'image_test_error',
                'message': str(e),
                'timestamp': datetime.now().isoformat()
            })
    
    def _run_qr_code_tests(self):
        """Run QR code generation and card access tests"""
        logger.info("Running QR code tests...")
        
        try:
            cmd = [
                'docker-compose', 'exec', '-T', 'backend',
                'python', '-m', 'pytest', 'tests/test_qr_code_comprehensive.py', '-v'
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, cwd='.')
            
            self.test_results['test_suites']['qr_codes'] = {
                'exit_code': result.returncode,
                'passed': result.returncode == 0
            }
            
            if result.returncode == 0:
                self.test_results['passed_tests'] += 1
                logger.info("QR code tests passed")
            else:
                self.test_results['failed_tests'] += 1
                logger.error("QR code tests failed")
            
            self.test_results['total_tests'] += 1
            
        except Exception as e:
            logger.error(f"Error running QR code tests: {str(e)}")
            self.test_results['errors'].append({
                'type': 'qr_test_error',
                'message': str(e),
                'timestamp': datetime.now().isoformat()
            })
    
    def _run_accounting_tests(self):
        """Run accounting validation tests"""
        logger.info("Running accounting validation tests...")
        
        try:
            cmd = [
                'docker-compose', 'exec', '-T', 'backend',
                'python', '-m', 'pytest', 'tests/test_accounting_validation.py', '-v'
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, cwd='.')
            
            self.test_results['test_suites']['accounting_validation'] = {
                'exit_code': result.returncode,
                'passed': result.returncode == 0
            }
            
            if result.returncode == 0:
                self.test_results['passed_tests'] += 1
                logger.info("Accounting validation tests passed")
            else:
                self.test_results['failed_tests'] += 1
                logger.error("Accounting validation tests failed")
            
            self.test_results['total_tests'] += 1
            
        except Exception as e:
            logger.error(f"Error running accounting tests: {str(e)}")
            self.test_results['errors'].append({
                'type': 'accounting_test_error',
                'message': str(e),
                'timestamp': datetime.now().isoformat()
            })
    
    def _run_browser_compatibility_tests(self):
        """Run cross-browser compatibility tests"""
        logger.info("Running browser compatibility tests...")
        
        browsers = ['chrome', 'firefox']
        
        for browser in browsers:
            try:
                # Run browser-specific tests
                result = self._run_browser_tests(browser)
                
                self.test_results['browser_compatibility'][browser] = {
                    'passed': result,
                    'timestamp': datetime.now().isoformat()
                }
                
                if result:
                    self.test_results['passed_tests'] += 1
                    logger.info(f"{browser} compatibility tests passed")
                else:
                    self.test_results['failed_tests'] += 1
                    logger.error(f"{browser} compatibility tests failed")
                
                self.test_results['total_tests'] += 1
                
            except Exception as e:
                logger.error(f"Error running {browser} tests: {str(e)}")
                self.test_results['errors'].append({
                    'type': f'{browser}_test_error',
                    'message': str(e),
                    'timestamp': datetime.now().isoformat()
                })
    
    def _run_browser_tests(self, browser: str) -> bool:
        """Run tests for a specific browser"""
        try:
            if browser == 'chrome':
                options = ChromeOptions()
                options.add_argument('--headless')
                options.add_argument('--no-sandbox')
                options.add_argument('--disable-dev-shm-usage')
                driver = webdriver.Chrome(options=options)
            elif browser == 'firefox':
                options = FirefoxOptions()
                options.add_argument('--headless')
                driver = webdriver.Firefox(options=options)
            else:
                return False
            
            # Test basic functionality
            driver.get('http://localhost')
            
            # Wait for page to load
            time.sleep(5)
            
            # Check if page loaded successfully
            success = "goldshop" in driver.title.lower() or len(driver.page_source) > 1000
            
            driver.quit()
            return success
            
        except Exception as e:
            logger.error(f"Browser test error for {browser}: {str(e)}")
            return False
    
    def _run_performance_tests(self):
        """Run performance tests for database queries and API responses"""
        logger.info("Running performance tests...")
        
        try:
            cmd = [
                'docker-compose', 'exec', '-T', 'backend',
                'python', 'tests/test_performance_comprehensive.py'
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, cwd='.')
            
            self.test_results['performance_metrics'] = {
                'exit_code': result.returncode,
                'stdout': result.stdout,
                'passed': result.returncode == 0
            }
            
            if result.returncode == 0:
                self.test_results['passed_tests'] += 1
                logger.info("Performance tests passed")
            else:
                self.test_results['failed_tests'] += 1
                logger.error("Performance tests failed")
            
            self.test_results['total_tests'] += 1
            
        except Exception as e:
            logger.error(f"Error running performance tests: {str(e)}")
            self.test_results['errors'].append({
                'type': 'performance_test_error',
                'message': str(e),
                'timestamp': datetime.now().isoformat()
            })
    
    def _generate_coverage_reports(self):
        """Generate test coverage reports"""
        logger.info("Generating coverage reports...")
        
        try:
            # Backend coverage
            backend_coverage = self._get_backend_coverage()
            frontend_coverage = self._get_frontend_coverage()
            
            self.test_results['coverage_report'] = {
                'backend': backend_coverage,
                'frontend': frontend_coverage,
                'overall': (backend_coverage + frontend_coverage) / 2 if backend_coverage and frontend_coverage else 0
            }
            
            # Check if coverage meets minimum requirement (80%)
            if self.test_results['coverage_report']['overall'] < 80:
                logger.warning(f"Coverage {self.test_results['coverage_report']['overall']:.1f}% is below minimum requirement of 80%")
            else:
                logger.info(f"Coverage {self.test_results['coverage_report']['overall']:.1f}% meets minimum requirement")
            
        except Exception as e:
            logger.error(f"Error generating coverage reports: {str(e)}")
            self.test_results['errors'].append({
                'type': 'coverage_error',
                'message': str(e),
                'timestamp': datetime.now().isoformat()
            })
    
    def _get_backend_coverage(self) -> float:
        """Get backend test coverage percentage"""
        try:
            # Try to read coverage report
            coverage_file = Path('backend/coverage_backend.json')
            if coverage_file.exists():
                with open(coverage_file, 'r') as f:
                    coverage_data = json.load(f)
                    return coverage_data.get('totals', {}).get('percent_covered', 0)
            return 0
        except Exception:
            return 0
    
    def _get_frontend_coverage(self) -> float:
        """Get frontend test coverage percentage"""
        try:
            # Try to read coverage report
            coverage_file = Path('frontend/coverage/coverage-summary.json')
            if coverage_file.exists():
                with open(coverage_file, 'r') as f:
                    coverage_data = json.load(f)
                    return coverage_data.get('total', {}).get('lines', {}).get('pct', 0)
            return 0
        except Exception:
            return 0
    
    def _generate_final_report(self):
        """Generate final comprehensive test report"""
        logger.info("Generating final test report...")
        
        # Calculate success rate
        if self.test_results['total_tests'] > 0:
            success_rate = (self.test_results['passed_tests'] / self.test_results['total_tests']) * 100
        else:
            success_rate = 0
        
        self.test_results['success_rate'] = success_rate
        
        # Save detailed report
        report_file = Path('tests/comprehensive_test_report.json')
        with open(report_file, 'w') as f:
            json.dump(self.test_results, f, indent=2)
        
        # Generate summary
        summary = f"""
=== COMPREHENSIVE TEST FRAMEWORK RESULTS ===

Total Tests: {self.test_results['total_tests']}
Passed: {self.test_results['passed_tests']}
Failed: {self.test_results['failed_tests']}
Success Rate: {success_rate:.1f}%

Coverage:
- Backend: {self.test_results['coverage_report'].get('backend', 0):.1f}%
- Frontend: {self.test_results['coverage_report'].get('frontend', 0):.1f}%
- Overall: {self.test_results['coverage_report'].get('overall', 0):.1f}%

Test Suites:
"""
        
        for suite_name, suite_result in self.test_results['test_suites'].items():
            status = "PASSED" if suite_result.get('passed', False) else "FAILED"
            summary += f"- {suite_name}: {status}\n"
        
        if self.test_results['errors']:
            summary += f"\nErrors: {len(self.test_results['errors'])}\n"
        
        summary += f"\nDetailed report saved to: {report_file.absolute()}\n"
        summary += "=" * 50
        
        logger.info(summary)
        
        # Save summary
        with open('tests/test_summary.txt', 'w') as f:
            f.write(summary)


def main():
    """Main entry point for comprehensive testing framework"""
    framework = ComprehensiveTestFramework()
    results = framework.run_all_tests()
    
    # Exit with appropriate code
    if results['success_rate'] == 100 and results['coverage_report'].get('overall', 0) >= 80:
        sys.exit(0)  # Success
    else:
        sys.exit(1)  # Failure


if __name__ == "__main__":
    main()