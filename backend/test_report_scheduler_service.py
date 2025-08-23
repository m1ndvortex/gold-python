"""
Unit tests for Report Scheduler Service

Tests cover:
- Automated report scheduling with cron-like configuration
- Multi-format export service (PDF, Excel, CSV)
- Email delivery system for scheduled reports
- Report template management and versioning
"""

import pytest
import asyncio
import tempfile
import os
from datetime import datetime, date, timedelta
from decimal import Decimal
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import uuid
from pathlib import Path
import json

from database import Base
from services.report_scheduler_service import ReportSchedulerService
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
def temp_export_dir():
    """Create a temporary directory for exports"""
    with tempfile.TemporaryDirectory() as temp_dir:
        yield Path(temp_dir)

@pytest.fixture
def sample_data(db_session):
    """Create sample data for testing"""
    # Create user
    user1 = models.User(
        id=uuid.uuid4(),
        username="testuser1",
        email="test1@example.com",
        password_hash="hashed_password",
        is_active=True
    )
    db_session.add(user1)
    
    # Create category
    category1 = models.Category(
        id=uuid.uuid4(),
        name="Gold Jewelry",
        description="Gold jewelry items",
        is_active=True
    )
    db_session.add(category1)
    
    # Create inventory item
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
    db_session.add(item1)
    
    # Create customer
    customer1 = models.Customer(
        id=uuid.uuid4(),
        name="John Doe",
        phone="123-456-7890",
        email="john@example.com",
        total_purchases=Decimal('500.00'),
        current_debt=Decimal('100.00'),
        is_active=True
    )
    db_session.add(customer1)
    
    # Create invoice
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
    db_session.add(invoice1)
    
    db_session.commit()
    
    return {
        'user1': user1,
        'category1': category1,
        'item1': item1,
        'customer1': customer1,
        'invoice1': invoice1
    }

@pytest.fixture
def scheduler_service(db_session, temp_export_dir):
    """Create a ReportSchedulerService instance"""
    service = ReportSchedulerService(db_session)
    service.export_dir = temp_export_dir
    return service

@pytest.fixture
def sample_report_data():
    """Sample report data for testing exports"""
    return {
        'report_id': str(uuid.uuid4()),
        'name': 'Test Report',
        'description': 'A test report for unit testing',
        'generated_at': datetime.now().isoformat(),
        'total_records': 3,
        'data': [
            {
                'invoice_number': 'INV-001',
                'customer_name': 'John Doe',
                'total_amount': 300.00,
                'status': 'pending',
                'created_at': '2024-01-15T10:30:00'
            },
            {
                'invoice_number': 'INV-002',
                'customer_name': 'Jane Smith',
                'total_amount': 450.00,
                'status': 'paid',
                'created_at': '2024-01-16T14:20:00'
            },
            {
                'invoice_number': 'INV-003',
                'customer_name': 'Bob Johnson',
                'total_amount': 275.50,
                'status': 'pending',
                'created_at': '2024-01-17T09:15:00'
            }
        ],
        'summary': {
            'total_records': 3,
            'total_amount_sum': 1025.50,
            'total_amount_avg': 341.83,
            'total_amount_min': 275.50,
            'total_amount_max': 450.00
        }
    }

class TestReportSchedulerService:
    """Test cases for ReportSchedulerService"""
    
    @pytest.mark.asyncio
    async def test_csv_export(self, scheduler_service, sample_report_data):
        """Test CSV export functionality"""
        export_result = await scheduler_service.export_report(
            sample_report_data, 'csv', 'test_report.csv'
        )
        
        assert export_result['format'] == 'csv'
        assert export_result['filename'] == 'test_report.csv'
        assert export_result['rows_exported'] == 3
        assert export_result['columns_exported'] == 5
        
        # Check that file was created
        filepath = Path(export_result['filepath'])
        assert filepath.exists()
        
        # Check file content
        with open(filepath, 'r') as f:
            content = f.read()
            assert 'invoice_number' in content
            assert 'INV-001' in content
            assert 'John Doe' in content

    @pytest.mark.asyncio
    async def test_json_export(self, scheduler_service, sample_report_data):
        """Test JSON export functionality"""
        export_result = await scheduler_service.export_report(
            sample_report_data, 'json', 'test_report.json'
        )
        
        assert export_result['format'] == 'json'
        assert export_result['filename'] == 'test_report.json'
        assert export_result['rows_exported'] == 3
        
        # Check that file was created and contains valid JSON
        filepath = Path(export_result['filepath'])
        assert filepath.exists()
        
        with open(filepath, 'r') as f:
            loaded_data = json.load(f)
            assert loaded_data['name'] == 'Test Report'
            assert len(loaded_data['data']) == 3

    @pytest.mark.asyncio
    async def test_excel_export(self, scheduler_service, sample_report_data):
        """Test Excel export functionality"""
        try:
            export_result = await scheduler_service.export_report(
                sample_report_data, 'excel', 'test_report.xlsx'
            )
            
            assert export_result['format'] == 'excel'
            assert export_result['filename'] == 'test_report.xlsx'
            assert export_result['rows_exported'] == 3
            assert export_result['columns_exported'] == 5
            assert export_result['sheets_created'] == 2  # Data + Summary
            
            # Check that file was created
            filepath = Path(export_result['filepath'])
            assert filepath.exists()
            
        except Exception as e:
            if "openpyxl library not available" in str(e):
                pytest.skip("openpyxl not available for Excel export testing")
            else:
                raise

    @pytest.mark.asyncio
    async def test_pdf_export(self, scheduler_service, sample_report_data):
        """Test PDF export functionality"""
        try:
            export_result = await scheduler_service.export_report(
                sample_report_data, 'pdf', 'test_report.pdf'
            )
            
            assert export_result['format'] == 'pdf'
            assert export_result['filename'] == 'test_report.pdf'
            assert export_result['rows_exported'] == 3
            assert export_result['total_rows'] == 3
            
            # Check that file was created
            filepath = Path(export_result['filepath'])
            assert filepath.exists()
            
        except Exception as e:
            if "reportlab library not available" in str(e):
                pytest.skip("reportlab not available for PDF export testing")
            else:
                raise

    @pytest.mark.asyncio
    async def test_export_with_empty_data(self, scheduler_service):
        """Test export functionality with empty data"""
        empty_report_data = {
            'name': 'Empty Report',
            'data': [],
            'summary': {'total_records': 0}
        }
        
        export_result = await scheduler_service.export_report(
            empty_report_data, 'csv', 'empty_report.csv'
        )
        
        assert export_result['rows_exported'] == 0
        assert export_result['columns_exported'] == 0
        
        # Check that file was still created
        filepath = Path(export_result['filepath'])
        assert filepath.exists()

    @pytest.mark.asyncio
    async def test_schedule_daily_report(self, scheduler_service, sample_data):
        """Test scheduling a daily report"""
        report_config = {
            'name': 'Daily Sales Report',
            'description': 'Daily sales summary',
            'data_sources': [{'name': 'invoices'}],
            'fields': ['invoices.invoice_number', 'invoices.total_amount']
        }
        
        schedule_config = {
            'frequency': 'daily',
            'time': '09:00',
            'export_formats': ['csv', 'pdf']
        }
        
        recipients = ['test@example.com']
        
        result = await scheduler_service.schedule_report(
            report_config, schedule_config, recipients, str(sample_data['user1'].id)
        )
        
        assert result['status'] == 'scheduled'
        assert result['name'] == 'Daily Sales Report'
        assert result['recipients'] == recipients
        assert result['export_formats'] == ['csv', 'pdf']
        assert 'next_run_at' in result

    @pytest.mark.asyncio
    async def test_schedule_weekly_report(self, scheduler_service, sample_data):
        """Test scheduling a weekly report"""
        report_config = {
            'name': 'Weekly Inventory Report',
            'data_sources': [{'name': 'inventory_items'}],
            'fields': ['inventory_items.name', 'inventory_items.stock_quantity']
        }
        
        schedule_config = {
            'frequency': 'weekly',
            'day_of_week': 1,  # Monday
            'time': '08:00',
            'export_formats': ['excel']
        }
        
        recipients = ['manager@example.com']
        
        result = await scheduler_service.schedule_report(
            report_config, schedule_config, recipients, str(sample_data['user1'].id)
        )
        
        assert result['status'] == 'scheduled'
        assert result['export_formats'] == ['excel']

    @pytest.mark.asyncio
    async def test_schedule_monthly_report(self, scheduler_service, sample_data):
        """Test scheduling a monthly report"""
        report_config = {
            'name': 'Monthly Customer Report',
            'data_sources': [{'name': 'customers'}],
            'fields': ['customers.name', 'customers.total_purchases']
        }
        
        schedule_config = {
            'frequency': 'monthly',
            'day_of_month': 1,
            'time': '07:00',
            'export_formats': ['pdf', 'excel']
        }
        
        recipients = ['owner@example.com', 'accountant@example.com']
        
        result = await scheduler_service.schedule_report(
            report_config, schedule_config, recipients, str(sample_data['user1'].id)
        )
        
        assert result['status'] == 'scheduled'
        assert len(result['recipients']) == 2

    def test_calculate_next_run_daily(self, scheduler_service):
        """Test next run calculation for daily frequency"""
        schedule_config = {
            'frequency': 'daily',
            'time': '09:00'
        }
        
        next_run = scheduler_service._calculate_next_run(schedule_config)
        
        assert isinstance(next_run, datetime)
        assert next_run.hour == 9
        assert next_run.minute == 0
        assert next_run > datetime.now()

    def test_calculate_next_run_weekly(self, scheduler_service):
        """Test next run calculation for weekly frequency"""
        schedule_config = {
            'frequency': 'weekly',
            'day_of_week': 1,  # Monday
            'time': '10:30'
        }
        
        next_run = scheduler_service._calculate_next_run(schedule_config)
        
        assert isinstance(next_run, datetime)
        assert next_run.hour == 10
        assert next_run.minute == 30
        assert next_run.weekday() == 0  # Monday is 0 in Python

    def test_calculate_next_run_monthly(self, scheduler_service):
        """Test next run calculation for monthly frequency"""
        schedule_config = {
            'frequency': 'monthly',
            'day_of_month': 15,
            'time': '14:00'
        }
        
        next_run = scheduler_service._calculate_next_run(schedule_config)
        
        assert isinstance(next_run, datetime)
        assert next_run.day == 15
        assert next_run.hour == 14
        assert next_run.minute == 0

    def test_validate_schedule_config_valid(self, scheduler_service):
        """Test validation of valid schedule configuration"""
        valid_config = {
            'frequency': 'daily',
            'time': '09:00'
        }
        
        # Should not raise an exception
        scheduler_service._validate_schedule_config(valid_config)

    def test_validate_schedule_config_invalid_frequency(self, scheduler_service):
        """Test validation of invalid frequency"""
        invalid_config = {
            'frequency': 'invalid_frequency',
            'time': '09:00'
        }
        
        with pytest.raises(ValueError, match="Invalid frequency"):
            scheduler_service._validate_schedule_config(invalid_config)

    def test_validate_schedule_config_missing_frequency(self, scheduler_service):
        """Test validation with missing frequency"""
        invalid_config = {
            'time': '09:00'
        }
        
        with pytest.raises(ValueError, match="Missing required schedule field"):
            scheduler_service._validate_schedule_config(invalid_config)

    def test_validate_schedule_config_custom_without_cron(self, scheduler_service):
        """Test validation of custom frequency without cron expression"""
        invalid_config = {
            'frequency': 'custom',
            'time': '09:00'
        }
        
        with pytest.raises(ValueError, match="Custom frequency requires cron_expression"):
            scheduler_service._validate_schedule_config(invalid_config)

    @pytest.mark.asyncio
    async def test_get_scheduled_reports_empty(self, scheduler_service):
        """Test getting scheduled reports when none exist"""
        reports = await scheduler_service.get_scheduled_reports()
        assert isinstance(reports, list)
        assert len(reports) == 0

    @pytest.mark.asyncio
    async def test_get_scheduled_reports_with_data(self, scheduler_service, sample_data, db_session):
        """Test getting scheduled reports with existing data"""
        # Create a scheduled report
        scheduled_report = models.ScheduledReport(
            id=uuid.uuid4(),
            name="Test Scheduled Report",
            description="Test description",
            report_config={'name': 'Test'},
            schedule_config={'frequency': 'daily'},
            recipients=['test@example.com'],
            export_formats=['pdf'],
            is_active=True,
            created_by=sample_data['user1'].id,
            next_run_at=datetime.now() + timedelta(hours=1),
            run_count=5,
            error_count=1
        )
        db_session.add(scheduled_report)
        db_session.commit()
        
        reports = await scheduler_service.get_scheduled_reports()
        
        assert len(reports) == 1
        report = reports[0]
        assert report['name'] == "Test Scheduled Report"
        assert report['is_active'] is True
        assert report['run_count'] == 5
        assert report['error_count'] == 1
        assert 'next_run_at' in report

    @pytest.mark.asyncio
    async def test_get_scheduled_reports_user_filter(self, scheduler_service, sample_data, db_session):
        """Test getting scheduled reports filtered by user"""
        # Create another user
        user2 = models.User(
            id=uuid.uuid4(),
            username="testuser2",
            email="test2@example.com",
            password_hash="hashed_password",
            is_active=True
        )
        db_session.add(user2)
        
        # Create scheduled reports for both users
        report1 = models.ScheduledReport(
            id=uuid.uuid4(),
            name="User 1 Report",
            report_config={'name': 'Test'},
            schedule_config={'frequency': 'daily'},
            recipients=['test1@example.com'],
            export_formats=['pdf'],
            created_by=sample_data['user1'].id
        )
        
        report2 = models.ScheduledReport(
            id=uuid.uuid4(),
            name="User 2 Report",
            report_config={'name': 'Test'},
            schedule_config={'frequency': 'daily'},
            recipients=['test2@example.com'],
            export_formats=['pdf'],
            created_by=user2.id
        )
        
        db_session.add_all([report1, report2])
        db_session.commit()
        
        # Get reports for user 1 only
        user1_reports = await scheduler_service.get_scheduled_reports(str(sample_data['user1'].id))
        assert len(user1_reports) == 1
        assert user1_reports[0]['name'] == "User 1 Report"
        
        # Get all reports
        all_reports = await scheduler_service.get_scheduled_reports()
        assert len(all_reports) == 2

    @pytest.mark.asyncio
    async def test_export_unsupported_format(self, scheduler_service, sample_report_data):
        """Test export with unsupported format"""
        with pytest.raises(ValueError, match="Unsupported export format"):
            await scheduler_service.export_report(
                sample_report_data, 'unsupported_format'
            )

    @pytest.mark.asyncio
    async def test_export_filename_generation(self, scheduler_service, sample_report_data):
        """Test automatic filename generation"""
        export_result = await scheduler_service.export_report(
            sample_report_data, 'csv'
        )
        
        filename = export_result['filename']
        assert filename.startswith('Test_Report_')
        assert filename.endswith('.csv')
        assert len(filename.split('_')) >= 4  # Name + timestamp parts

    def test_scheduler_start_stop(self, scheduler_service):
        """Test scheduler start and stop functionality"""
        assert not scheduler_service.scheduler_running
        
        scheduler_service.start_scheduler()
        assert scheduler_service.scheduler_running
        
        scheduler_service.stop_scheduler()
        assert not scheduler_service.scheduler_running

if __name__ == "__main__":
    pytest.main([__file__])