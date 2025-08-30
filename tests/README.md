# Comprehensive Testing Framework

This directory contains the comprehensive testing framework for the Universal Inventory and Invoice Management System. The framework implements all testing requirements from task 14, providing thorough validation of system functionality, performance, and reliability.

## Overview

The testing framework includes:

- **End-to-end workflow tests** covering all inventory, invoice, accounting, and image management workflows
- **Load testing framework** simulating 100+ concurrent users for invoice creation and accounting operations
- **Regression test suite** for inventory movements, pricing overrides, and Gold-specific invoice logic
- **Image processing and display testing** validating upload, processing, and display workflows
- **QR code generation and card access testing** ensuring proper functionality across devices
- **Accounting validation testing** verifying double-entry balance and financial report accuracy
- **Cross-browser compatibility testing** for all new features and interfaces
- **Automated test coverage reporting** with minimum 80% coverage requirement
- **Performance testing suite** for database queries, API response times, and image processing
- **All tests use real PostgreSQL database** in Docker environment with no mocking

## Test Structure

```
tests/
├── README.md                                    # This file
├── run_comprehensive_tests.py                  # Main Python test runner
├── comprehensive_test_framework.py             # Core test framework
├── run_tests.sh                                # Bash test runner (Linux/Mac)
├── run_tests.ps1                               # PowerShell test runner (Windows)
│
├── End-to-End Tests/
│   ├── test_inventory_workflow_e2e.py          # Complete inventory workflows
│   └── test_invoice_workflow_e2e.py            # Complete invoice workflows
│
├── Load & Performance Tests/
│   ├── test_load_performance.py                # Load testing (100+ users)
│   └── test_performance_comprehensive.py       # Performance benchmarking
│
├── Regression Tests/
│   ├── test_inventory_regression.py            # Inventory stability tests
│   ├── test_pricing_regression.py              # Pricing logic tests
│   └── test_gold_invoice_regression.py         # Gold invoice tests
│
├── Feature Tests/
│   ├── test_image_processing_comprehensive.py  # Image management tests
│   ├── test_qr_code_comprehensive.py           # QR card tests
│   └── test_accounting_validation.py           # Accounting system tests
│
└── Results/
    ├── comprehensive_test_results.json         # Detailed results
    ├── test_summary.txt                        # Summary report
    └── coverage_html/                          # HTML coverage report
```

## Quick Start

### Prerequisites

1. **Docker and Docker Compose** must be installed and running
2. **All services** must be healthy (database, backend, frontend)
3. **Python 3.8+** for running test scripts directly

### Running All Tests

**Linux/Mac:**
```bash
./run_tests.sh
```

**Windows:**
```powershell
.\run_tests.ps1
```

**Python (Cross-platform):**
```bash
python tests/run_comprehensive_tests.py
```

### Running Specific Test Types

**Unit Tests Only:**
```bash
./run_tests.sh --type unit
```

**Load Tests Only:**
```bash
./run_tests.sh --type load
```

**Performance Tests Only:**
```bash
./run_tests.sh --type performance
```

### Available Test Types

- `all` - Run all test suites (default)
- `unit` - Unit and regression tests
- `integration` - Integration tests (image processing, QR codes)
- `e2e` - End-to-end workflow tests
- `load` - Load testing with concurrent users
- `performance` - Performance benchmarking

## Test Categories

### 1. End-to-End Workflow Tests

**File:** `test_inventory_workflow_e2e.py`, `test_invoice_workflow_e2e.py`

Tests complete business workflows:
- Inventory management from category creation to item management
- Unlimited nested categories with LTREE
- Custom attributes and validation
- Image upload and management
- Invoice creation (Gold vs General types)
- Workflow management (draft → approved)
- QR card generation and access
- Accounting integration

**Key Features Tested:**
- ✅ Unlimited nested category hierarchy
- ✅ Custom attributes with schema validation
- ✅ Advanced search and filtering
- ✅ SKU/Barcode uniqueness
- ✅ Image management integration
- ✅ Dual invoice system (Gold/General)
- ✅ Manual price overrides
- ✅ Automatic inventory deduction
- ✅ QR card generation and public access
- ✅ Gold-specific field handling

### 2. Load Testing Framework

**File:** `test_load_performance.py`

Simulates realistic load conditions:
- **100+ concurrent users** performing various operations
- **Invoice creation and processing** under load
- **Inventory management operations** with concurrent access
- **Search and filtering** performance under load
- **Accounting operations** with multiple users
- **Database connection pooling** validation
- **System resource monitoring** during load

**Load Test Scenarios:**
- 40% Invoice creation (Gold and General)
- 30% Inventory operations (search, update, create)
- 20% Search operations (inventory, invoices, customers)
- 10% Accounting operations (reports, journal entries)

### 3. Regression Test Suite

**File:** `test_inventory_regression.py`

Ensures system stability across changes:
- **Stock movement accuracy** - Verifies inventory calculations
- **Category hierarchy operations** - Tests LTREE functionality
- **Custom attributes validation** - Schema-driven validation
- **Search and filtering accuracy** - Complex query validation
- **SKU/Barcode uniqueness** - Constraint validation
- **Low stock alerts** - Threshold monitoring
- **Data integrity** - Cross-table relationships

### 4. Image Processing Tests

**File:** `test_image_processing_comprehensive.py`

Validates image management system:
- **Multiple format support** (JPEG, PNG, WebP, BMP)
- **Size validation and limits** - File size constraints
- **Thumbnail generation** - Automatic thumbnail creation
- **Image optimization** - Compression and quality
- **Metadata extraction** - EXIF and file information
- **Category integration** - Category image management
- **Inventory item integration** - Multiple item images
- **Bulk operations** - Batch image processing
- **Security validation** - Malicious file detection
- **Storage cleanup** - Orphan detection and cleanup

### 5. QR Code and Card Tests

**File:** `test_qr_code_comprehensive.py`

Tests QR card system:
- **QR code generation** for invoices
- **Beautiful glass-style cards** with responsive design
- **Public access without authentication**
- **Gold-specific field display** (سود, اجرت, مالیات)
- **Image integration** in cards
- **Theme and styling options**
- **Cross-device compatibility**
- **Security and access control**
- **Performance and caching**
- **Bulk operations**

### 6. Accounting Validation Tests

**File:** `test_accounting_validation.py`

Validates double-entry accounting:
- **Double-entry balance validation** - All entries balanced
- **Invoice accounting integration** - Automatic journal entries
- **Gold invoice accounting** - Specialized field handling
- **Subsidiary accounts management** (حساب‌های تفصیلی)
- **General ledger functionality** (دفتر معین)
- **Trial balance accuracy** - Balanced calculations
- **Financial reports accuracy** - P&L, Balance Sheet, Cash Flow
- **Persian terminology support** - Multilingual accounting
- **Period management** - Closing and locking
- **Audit trail functionality** - Complete change tracking

### 7. Performance Testing Suite

**File:** `test_performance_comprehensive.py`

Benchmarks system performance:
- **Database query performance** - Complex query optimization
- **API endpoint response times** - All endpoints tested
- **Image processing speed** - Upload and processing times
- **Search performance** - Complex filtering operations
- **Report generation speed** - Financial report performance
- **Concurrent performance** - Multiple user simulation
- **System resource monitoring** - CPU, memory, disk usage
- **Performance analysis** - Bottleneck identification

## Coverage Requirements

The framework enforces minimum coverage requirements:

- **Overall Coverage:** 80% minimum
- **Critical Business Logic:** 100% coverage required
- **Backend Coverage:** Measured with pytest-cov
- **Frontend Coverage:** Measured with Jest coverage
- **Real Database Testing:** No mocking allowed

### Coverage Reports

Coverage reports are generated in multiple formats:
- **JSON:** `backend_coverage.json`, `frontend_coverage.json`
- **HTML:** `coverage_html/index.html`
- **Console:** Displayed during test execution

## Docker Integration

All tests run in Docker containers using real services:

### Test Environment

```yaml
# docker-compose.test.yml
services:
  db:                    # Real PostgreSQL with TimescaleDB
  redis:                 # Real Redis cache
  backend:               # FastAPI backend
  frontend:              # React frontend
  test-runner:           # Comprehensive test executor
```

### Database Testing

- **Real PostgreSQL database** - No SQLite or mocking
- **TimescaleDB extension** - For analytics and time-series data
- **LTREE extension** - For hierarchical categories
- **Full schema** - All tables and relationships
- **Test data isolation** - Proper cleanup after tests

## Performance Benchmarks

The framework establishes performance benchmarks:

| Metric | Threshold | Description |
|--------|-----------|-------------|
| API Response Time | < 1000ms | Standard API endpoints |
| Database Query Time | < 500ms | Complex database queries |
| Image Processing | < 5000ms | Image upload and processing |
| Search Response | < 2000ms | Advanced search operations |
| Report Generation | < 10000ms | Financial report creation |
| Load Test Success | > 95% | Success rate under load |
| Concurrent Users | 100+ | Simultaneous user support |

## Error Handling and Reporting

### Test Failure Analysis

When tests fail, the framework provides:
- **Detailed error messages** with context
- **Stack traces** for debugging
- **Database state** at time of failure
- **System resource usage** during failure
- **Recommendations** for fixing issues

### Continuous Integration

The framework is designed for CI/CD integration:
- **Exit codes** indicate success/failure
- **JUnit XML** output for CI systems
- **JSON results** for automated processing
- **Timeout handling** prevents hanging builds
- **Resource cleanup** ensures clean state

## Troubleshooting

### Common Issues

**Docker Services Not Healthy:**
```bash
# Check service status
docker-compose -f docker-compose.test.yml ps

# View service logs
docker-compose -f docker-compose.test.yml logs backend

# Restart services
docker-compose -f docker-compose.test.yml restart
```

**Database Connection Issues:**
```bash
# Check database connectivity
docker-compose -f docker-compose.test.yml exec backend python -c "
from sqlalchemy import create_engine
engine = create_engine('postgresql://goldshop_user:goldshop_password@db:5432/goldshop')
print('Database connection:', engine.execute('SELECT 1').scalar())
"
```

**Test Timeouts:**
```bash
# Increase timeout for slow systems
./run_tests.sh --timeout 7200  # 2 hours
```

**Coverage Issues:**
```bash
# Generate coverage report only
python tests/run_comprehensive_tests.py --coverage-only
```

### Debug Mode

For detailed debugging, run tests with verbose output:

```bash
# Python runner with debug
python tests/run_comprehensive_tests.py --tests unit --timeout 3600

# Direct pytest execution
docker-compose -f docker-compose.test.yml exec backend python -m pytest tests/test_inventory_workflow_e2e.py -v -s --tb=long
```

## Contributing

When adding new tests:

1. **Follow naming convention:** `test_<feature>_<type>.py`
2. **Use real database:** No mocking of database operations
3. **Include cleanup:** Proper test data cleanup
4. **Add documentation:** Document test purpose and coverage
5. **Update benchmarks:** Add performance expectations
6. **Test in Docker:** Ensure Docker compatibility

### Test Template

```python
"""
Test Description

Brief description of what this test validates.
"""

import pytest
import requests
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker


class TestFeatureName:
    """Test class description"""
    
    @pytest.fixture(autouse=True)
    def setup_test_environment(self):
        """Setup test environment with real database"""
        self.base_url = "http://localhost:8000"
        self.db_url = "postgresql://goldshop_user:goldshop_password@localhost:5432/goldshop"
        
        # Test data tracking for cleanup
        self.test_data = []
        
        yield
        
        # Cleanup test data
        self._cleanup_test_data()
    
    def _cleanup_test_data(self):
        """Clean up test data from database"""
        # Implementation here
        pass
    
    def test_feature_functionality(self):
        """Test specific feature functionality"""
        # Test implementation here
        assert True  # Replace with actual assertions


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
```

## Results and Reporting

### Test Results Structure

```json
{
  "start_time": "2024-01-15T10:00:00",
  "end_time": "2024-01-15T11:30:00",
  "total_tests": 15,
  "passed_tests": 14,
  "failed_tests": 1,
  "success_rate": 93.3,
  "coverage": {
    "backend": 85.2,
    "frontend": 82.1,
    "overall": 83.7
  },
  "performance_benchmarks": {
    "api_response_time": 245.6,
    "database_query_time": 123.4,
    "load_test_throughput": 156.7
  },
  "test_suites": {
    "unit_tests": "passed",
    "integration_tests": "passed",
    "e2e_tests": "failed",
    "load_tests": "passed",
    "performance_tests": "passed"
  }
}
```

### Success Criteria

Tests are considered successful when:
- ✅ **Success Rate ≥ 80%** - At least 80% of test suites pass
- ✅ **Coverage ≥ 80%** - Minimum 80% code coverage
- ✅ **Performance Benchmarks Met** - All performance thresholds satisfied
- ✅ **Load Tests Pass** - System handles 100+ concurrent users
- ✅ **No Critical Failures** - No failures in critical business logic

## Support

For issues with the testing framework:

1. **Check logs** in `test_results/` directory
2. **Review Docker service status** with `docker-compose ps`
3. **Verify database connectivity** and schema
4. **Check system resources** (CPU, memory, disk)
5. **Review test documentation** for specific test requirements

The comprehensive testing framework ensures the Universal Inventory and Invoice Management System meets all quality, performance, and reliability requirements before deployment.