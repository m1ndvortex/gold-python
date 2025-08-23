"""
Unit tests for Report Engine Service

Tests cover:
- Dynamic query generation capabilities
- Data source configuration and field mapping
- Filter and aggregation processing with SQL optimization
- Complex data relationships and joins
"""

import pytest
import asyncio
from datetime import datetime, date, timedelta
from decimal import Decimal
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import uuid

from database import Base
from services.report_engine_service import ReportEngineService
import models

# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture
def db_session():
    """Create a test database session"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture
def sample_data(db_session):
    """Create sample data for testing"""
    # Create users
    user1 = models.User(
        id=uuid.uuid4(),
        username="testuser1",
        email="test1@example.com",
        password_hash="hashed_password",
        is_active=True
    )
    db_session.add(user1)
    
    # Create categories
    category1 = models.Category(
        id=uuid.uuid4(),
        name="Gold Jewelry",
        description="Gold jewelry items",
        is_active=True
    )
    category2 = models.Category(
        id=uuid.uuid4(),
        name="Silver Jewelry",
        description="Silver jewelry items",
        is_active=True
    )
    db_session.add_all([category1, category2])
    
    # Create inventory items
    item1 = models.InventoryItem(
        id=uuid.uuid4(),
        name="Gold Ring",
        category_id=category1.id,
        weight_grams=Decimal('5.5'),
        purchase_price=Decimal('200.00'),
        sell_price=Decimal('300.00'),
        stock_quantity=10,
        min_stock_level=2,
        is_active=True
    )
    item2 = models.InventoryItem(
        id=uuid.uuid4(),
        name="Silver Necklace",
        category_id=category2.id,
        weight_grams=Decimal('15.0'),
        purchase_price=Decimal('100.00'),
        sell_price=Decimal('150.00'),
        stock_quantity=5,
        min_stock_level=1,
        is_active=True
    )
    db_session.add_all([item1, item2])
    
    # Create customers
    customer1 = models.Customer(
        id=uuid.uuid4(),
        name="John Doe",
        phone="123-456-7890",
        email="john@example.com",
        total_purchases=Decimal('500.00'),
        current_debt=Decimal('100.00'),
        is_active=True
    )
    customer2 = models.Customer(
        id=uuid.uuid4(),
        name="Jane Smith",
        phone="098-765-4321",
        email="jane@example.com",
        total_purchases=Decimal('800.00'),
        current_debt=Decimal('0.00'),
        is_active=True
    )
    db_session.add_all([customer1, customer2])
    
    # Create invoices
    invoice1 = models.Invoice(
        id=uuid.uuid4(),
        invoice_number="INV-001",
        customer_id=customer1.id,
        total_amount=Decimal('300.00'),
        paid_amount=Decimal('200.00'),
        remaining_amount=Decimal('100.00'),
        gold_price_per_gram=Decimal('50.00'),
        status='pending',
        created_at=datetime.now() - timedelta(days=5)
    )
    invoice2 = models.Invoice(
        id=uuid.uuid4(),
        invoice_number="INV-002",
        customer_id=customer2.id,
        total_amount=Decimal('450.00'),
        paid_amount=Decimal('450.00'),
        remaining_amount=Decimal('0.00'),
        gold_price_per_gram=Decimal('52.00'),
        status='paid',
        created_at=datetime.now() - timedelta(days=2)
    )
    db_session.add_all([invoice1, invoice2])
    
    # Create invoice items
    invoice_item1 = models.InvoiceItem(
        id=uuid.uuid4(),
        invoice_id=invoice1.id,
        inventory_item_id=item1.id,
        quantity=1,
        unit_price=Decimal('300.00'),
        total_price=Decimal('300.00'),
        weight_grams=Decimal('5.5')
    )
    invoice_item2 = models.InvoiceItem(
        id=uuid.uuid4(),
        invoice_id=invoice2.id,
        inventory_item_id=item1.id,
        quantity=1,
        unit_price=Decimal('300.00'),
        total_price=Decimal('300.00'),
        weight_grams=Decimal('5.5')
    )
    invoice_item3 = models.InvoiceItem(
        id=uuid.uuid4(),
        invoice_id=invoice2.id,
        inventory_item_id=item2.id,
        quantity=1,
        unit_price=Decimal('150.00'),
        total_price=Decimal('150.00'),
        weight_grams=Decimal('15.0')
    )
    db_session.add_all([invoice_item1, invoice_item2, invoice_item3])
    
    # Create payments
    payment1 = models.Payment(
        id=uuid.uuid4(),
        customer_id=customer1.id,
        invoice_id=invoice1.id,
        amount=Decimal('200.00'),
        payment_method='cash',
        payment_date=datetime.now() - timedelta(days=3)
    )
    payment2 = models.Payment(
        id=uuid.uuid4(),
        customer_id=customer2.id,
        invoice_id=invoice2.id,
        amount=Decimal('450.00'),
        payment_method='card',
        payment_date=datetime.now() - timedelta(days=1)
    )
    db_session.add_all([payment1, payment2])
    
    db_session.commit()
    
    return {
        'user1': user1,
        'category1': category1,
        'category2': category2,
        'item1': item1,
        'item2': item2,
        'customer1': customer1,
        'customer2': customer2,
        'invoice1': invoice1,
        'invoice2': invoice2,
        'invoice_item1': invoice_item1,
        'invoice_item2': invoice_item2,
        'invoice_item3': invoice_item3,
        'payment1': payment1,
        'payment2': payment2
    }

@pytest.fixture
def report_service(db_session):
    """Create a ReportEngineService instance"""
    return ReportEngineService(db_session)

class TestReportEngineService:
    """Test cases for ReportEngineService"""
    
    @pytest.mark.asyncio
    async def test_simple_report_generation(self, report_service, sample_data):
        """Test basic report generation with single data source"""
        report_config = {
            'name': 'Simple Invoice Report',
            'description': 'Basic invoice listing',
            'data_sources': [
                {
                    'name': 'invoices'
                }
            ],
            'fields': [
                'invoices.invoice_number',
                'invoices.total_amount',
                'invoices.status'
            ]
        }
        
        result = await report_service.build_custom_report(report_config)
        
        assert result['name'] == 'Simple Invoice Report'
        assert result['total_records'] == 2
        assert len(result['data']) == 2
        
        # Check data structure
        first_record = result['data'][0]
        assert 'invoice_number' in first_record
        assert 'total_amount' in first_record
        assert 'status' in first_record

    @pytest.mark.asyncio
    async def test_report_with_joins(self, report_service, sample_data):
        """Test report generation with multiple data sources and joins"""
        report_config = {
            'name': 'Invoice with Customer Report',
            'description': 'Invoices with customer information',
            'data_sources': [
                {
                    'name': 'invoices'
                },
                {
                    'name': 'customers',
                    'join': {
                        'type': 'inner',
                        'primary_field': 'customer_id',
                        'secondary_field': 'id'
                    }
                }
            ],
            'fields': [
                'invoices.invoice_number',
                'invoices.total_amount',
                'customers.name',
                'customers.phone'
            ]
        }
        
        result = await report_service.build_custom_report(report_config)
        
        assert result['total_records'] == 2
        
        # Check that customer data is included
        first_record = result['data'][0]
        assert 'name' in first_record
        assert 'phone' in first_record
        assert first_record['name'] in ['John Doe', 'Jane Smith']

    @pytest.mark.asyncio
    async def test_report_with_filters(self, report_service, sample_data):
        """Test report generation with various filters"""
        report_config = {
            'name': 'Filtered Invoice Report',
            'description': 'Invoices with filters applied',
            'data_sources': [
                {
                    'name': 'invoices'
                }
            ],
            'fields': [
                'invoices.invoice_number',
                'invoices.total_amount',
                'invoices.status'
            ],
            'filters': [
                {
                    'field': 'invoices.status',
                    'operator': 'equals',
                    'value': 'paid'
                }
            ]
        }
        
        result = await report_service.build_custom_report(report_config)
        
        assert result['total_records'] == 1
        assert result['data'][0]['status'] == 'paid'

    @pytest.mark.asyncio
    async def test_report_with_aggregations(self, report_service, sample_data):
        """Test report generation with aggregations"""
        report_config = {
            'name': 'Sales Summary Report',
            'description': 'Aggregated sales data',
            'data_sources': [
                {
                    'name': 'invoices'
                }
            ],
            'fields': [
                'invoices.status'
            ],
            'aggregations': [
                {
                    'field': 'invoices.total_amount',
                    'type': 'sum',
                    'alias': 'total_sales'
                },
                {
                    'field': 'invoices.id',
                    'type': 'count',
                    'alias': 'invoice_count'
                },
                {
                    'field': 'invoices.total_amount',
                    'type': 'avg',
                    'alias': 'average_sale'
                }
            ],
            'group_by': ['invoices.status']
        }
        
        result = await report_service.build_custom_report(report_config)
        
        assert result['total_records'] == 2  # Two statuses: pending, paid
        
        # Check aggregation results
        for record in result['data']:
            assert 'total_sales' in record
            assert 'invoice_count' in record
            assert 'average_sale' in record
            assert record['invoice_count'] > 0

    @pytest.mark.asyncio
    async def test_report_with_complex_filters(self, report_service, sample_data):
        """Test report with complex filter conditions"""
        report_config = {
            'name': 'Complex Filter Report',
            'description': 'Report with multiple filter types',
            'data_sources': [
                {
                    'name': 'invoices'
                }
            ],
            'fields': [
                'invoices.invoice_number',
                'invoices.total_amount',
                'invoices.created_at'
            ],
            'filters': [
                {
                    'field': 'invoices.total_amount',
                    'operator': 'greater_than',
                    'value': 250.00
                },
                {
                    'field': 'invoices.invoice_number',
                    'operator': 'contains',
                    'value': 'INV'
                }
            ]
        }
        
        result = await report_service.build_custom_report(report_config)
        
        # Should return invoices with amount > 250 and containing 'INV'
        assert result['total_records'] >= 1
        for record in result['data']:
            assert float(record['total_amount']) > 250.00
            assert 'INV' in record['invoice_number']

    @pytest.mark.asyncio
    async def test_report_with_sorting(self, report_service, sample_data):
        """Test report generation with sorting"""
        report_config = {
            'name': 'Sorted Invoice Report',
            'description': 'Invoices sorted by amount',
            'data_sources': [
                {
                    'name': 'invoices'
                }
            ],
            'fields': [
                'invoices.invoice_number',
                'invoices.total_amount'
            ],
            'sorting': [
                {
                    'field': 'invoices.total_amount',
                    'direction': 'desc'
                }
            ]
        }
        
        result = await report_service.build_custom_report(report_config)
        
        assert result['total_records'] == 2
        
        # Check sorting - first record should have higher amount
        amounts = [float(record['total_amount']) for record in result['data']]
        assert amounts == sorted(amounts, reverse=True)

    @pytest.mark.asyncio
    async def test_report_with_date_filters(self, report_service, sample_data):
        """Test report with date-based filters"""
        cutoff_date = datetime.now() - timedelta(days=3)
        
        report_config = {
            'name': 'Recent Invoice Report',
            'description': 'Recent invoices only',
            'data_sources': [
                {
                    'name': 'invoices'
                }
            ],
            'fields': [
                'invoices.invoice_number',
                'invoices.created_at'
            ],
            'filters': [
                {
                    'field': 'invoices.created_at',
                    'operator': 'greater_than',
                    'value': cutoff_date.isoformat()
                }
            ]
        }
        
        result = await report_service.build_custom_report(report_config)
        
        # Should return only recent invoices
        assert result['total_records'] >= 1
        for record in result['data']:
            record_date = datetime.fromisoformat(record['created_at'].replace('Z', '+00:00'))
            assert record_date > cutoff_date

    @pytest.mark.asyncio
    async def test_multi_table_complex_report(self, report_service, sample_data):
        """Test complex report with multiple tables and relationships"""
        report_config = {
            'name': 'Comprehensive Sales Report',
            'description': 'Sales data with all related information',
            'data_sources': [
                {
                    'name': 'invoices'
                },
                {
                    'name': 'customers',
                    'join': {
                        'type': 'inner',
                        'primary_field': 'customer_id',
                        'secondary_field': 'id'
                    }
                },
                {
                    'name': 'invoice_items',
                    'join': {
                        'type': 'inner',
                        'primary_field': 'id',
                        'secondary_field': 'invoice_id'
                    }
                },
                {
                    'name': 'inventory_items',
                    'join': {
                        'type': 'inner',
                        'primary_field': 'inventory_item_id',
                        'secondary_field': 'id'
                    }
                }
            ],
            'fields': [
                'invoices.invoice_number',
                'customers.name',
                'inventory_items.name',
                'invoice_items.quantity',
                'invoice_items.total_price'
            ],
            'aggregations': [
                {
                    'field': 'invoice_items.total_price',
                    'type': 'sum',
                    'alias': 'total_item_sales'
                }
            ],
            'group_by': [
                'invoices.invoice_number',
                'customers.name',
                'inventory_items.name',
                'invoice_items.quantity',
                'invoice_items.total_price'
            ]
        }
        
        result = await report_service.build_custom_report(report_config)
        
        assert result['total_records'] >= 3  # Should have multiple invoice items
        
        # Check that all required fields are present
        first_record = result['data'][0]
        required_fields = ['invoice_number', 'name', 'quantity', 'total_price', 'total_item_sales']
        for field in required_fields:
            assert field in first_record

    @pytest.mark.asyncio
    async def test_get_available_data_sources(self, report_service):
        """Test getting available data sources"""
        data_sources = await report_service.get_available_data_sources()
        
        assert isinstance(data_sources, dict)
        assert 'invoices' in data_sources
        assert 'customers' in data_sources
        assert 'inventory_items' in data_sources
        
        # Check invoice data source structure
        invoice_source = data_sources['invoices']
        assert 'name' in invoice_source
        assert 'fields' in invoice_source
        assert 'relationships' in invoice_source
        
        # Check that fields have proper structure
        fields = invoice_source['fields']
        assert len(fields) > 0
        for field in fields:
            assert 'name' in field
            assert 'type' in field

    @pytest.mark.asyncio
    async def test_validate_report_config(self, report_service):
        """Test report configuration validation"""
        # Valid configuration
        valid_config = {
            'name': 'Test Report',
            'data_sources': [{'name': 'invoices'}],
            'fields': ['invoices.invoice_number']
        }
        
        validation_result = await report_service.validate_report_config(valid_config)
        assert validation_result['valid'] is True
        assert len(validation_result['errors']) == 0
        
        # Invalid configuration - missing data sources
        invalid_config = {
            'name': 'Test Report',
            'fields': ['invoices.invoice_number']
        }
        
        validation_result = await report_service.validate_report_config(invalid_config)
        assert validation_result['valid'] is False
        assert len(validation_result['errors']) > 0

    @pytest.mark.asyncio
    async def test_report_summary_generation(self, report_service, sample_data):
        """Test that report summaries are generated correctly"""
        report_config = {
            'name': 'Summary Test Report',
            'data_sources': [{'name': 'invoices'}],
            'fields': ['invoices.total_amount', 'invoices.paid_amount']
        }
        
        result = await report_service.build_custom_report(report_config)
        
        assert 'summary' in result
        summary = result['summary']
        
        # Check that numeric field summaries are generated
        assert 'total_amount_sum' in summary
        assert 'total_amount_avg' in summary
        assert 'total_amount_min' in summary
        assert 'total_amount_max' in summary
        
        # Verify summary calculations
        total_amounts = [float(record['total_amount']) for record in result['data']]
        assert summary['total_amount_sum'] == sum(total_amounts)
        assert summary['total_amount_avg'] == sum(total_amounts) / len(total_amounts)

    @pytest.mark.asyncio
    async def test_error_handling_invalid_field(self, report_service, sample_data):
        """Test error handling for invalid field references"""
        report_config = {
            'name': 'Invalid Field Report',
            'data_sources': [{'name': 'invoices'}],
            'fields': ['invoices.nonexistent_field']
        }
        
        with pytest.raises(Exception):
            await report_service.build_custom_report(report_config)

    @pytest.mark.asyncio
    async def test_error_handling_invalid_data_source(self, report_service, sample_data):
        """Test error handling for invalid data sources"""
        report_config = {
            'name': 'Invalid Source Report',
            'data_sources': [{'name': 'nonexistent_table'}],
            'fields': ['nonexistent_table.field']
        }
        
        with pytest.raises(Exception):
            await report_service.build_custom_report(report_config)

    @pytest.mark.asyncio
    async def test_empty_result_handling(self, report_service, sample_data):
        """Test handling of reports that return no data"""
        report_config = {
            'name': 'Empty Result Report',
            'data_sources': [{'name': 'invoices'}],
            'fields': ['invoices.invoice_number'],
            'filters': [
                {
                    'field': 'invoices.status',
                    'operator': 'equals',
                    'value': 'nonexistent_status'
                }
            ]
        }
        
        result = await report_service.build_custom_report(report_config)
        
        assert result['total_records'] == 0
        assert len(result['data']) == 0
        assert 'summary' in result

if __name__ == "__main__":
    pytest.main([__file__])