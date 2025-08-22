"""
Comprehensive unit tests for KPI Calculator Service
Tests all financial KPI calculations using real PostgreSQL data
"""

import pytest
import asyncio
from datetime import date, datetime, timedelta
from decimal import Decimal
from sqlalchemy.orm import Session
from unittest.mock import AsyncMock, MagicMock, patch

from services.kpi_calculator_service import KPICalculatorService, FinancialKPICalculator
from models import (
    Invoice, InvoiceItem, InventoryItem, Customer, Category, 
    KPISnapshot, Payment, User, Role
)
from database import get_db
from redis_config import get_analytics_cache

class TestKPICalculatorService:
    """Test suite for KPI Calculator Service"""
    
    # Use the db_session fixture from conftest.py
    
    @pytest.fixture
    def mock_cache(self):
        """Mock analytics cache for testing"""
        cache = AsyncMock()
        cache.get_kpi_data.return_value = None  # No cached data by default
        cache.set_kpi_data.return_value = None
        cache.invalidate_cache.return_value = None
        cache.get_cache_stats.return_value = {
            "status": "connected",
            "total_keys": 100,
            "analytics_keys": 25
        }
        return cache
    
    @pytest.fixture
    def kpi_service(self, db_session, mock_cache):
        """Create KPI calculator service with mocked cache"""
        service = KPICalculatorService(db_session)
        service.cache = mock_cache
        return service
    
    @pytest.fixture
    async def sample_data(self, db_session):
        """Create comprehensive sample data for testing"""
        
        # Create role and user
        role = Role(
            name="admin",
            description="Administrator role",
            permissions={"all": True}
        )
        db_session.add(role)
        db_session.flush()
        
        user = User(
            username="testuser",
            email="test@example.com",
            password_hash="hashed_password",
            role_id=role.id
        )
        db_session.add(user)
        db_session.flush()
        
        # Create category
        category = Category(
            name="Gold Jewelry",
            description="Gold jewelry items"
        )
        db_session.add(category)
        db_session.flush()
        
        # Create inventory items
        items = []
        for i in range(5):
            item = InventoryItem(
                name=f"Gold Ring {i+1}",
                category_id=category.id,
                weight_grams=Decimal("10.5"),
                purchase_price=Decimal("500.00"),
                sell_price=Decimal("750.00"),
                stock_quantity=20,
                min_stock_level=5
            )
            items.append(item)
            db_session.add(item)
        
        db_session.flush()
        
        # Create customers
        customers = []
        for i in range(3):
            customer = Customer(
                name=f"Customer {i+1}",
                phone=f"123456789{i}",
                email=f"customer{i+1}@example.com",
                total_purchases=Decimal("0.00"),
                current_debt=Decimal("0.00")
            )
            customers.append(customer)
            db_session.add(customer)
        
        db_session.flush()
        
        # Create invoices with different dates and statuses
        invoices = []
        base_date = date.today() - timedelta(days=30)
        
        for i in range(10):
            invoice_date = base_date + timedelta(days=i * 3)
            customer = customers[i % len(customers)]
            
            invoice = Invoice(
                invoice_number=f"INV-{1000 + i}",
                customer_id=customer.id,
                total_amount=Decimal("1500.00"),
                paid_amount=Decimal("1000.00") if i % 2 == 0 else Decimal("1500.00"),
                remaining_amount=Decimal("500.00") if i % 2 == 0 else Decimal("0.00"),
                gold_price_per_gram=Decimal("60.00"),
                labor_cost_percentage=Decimal("15.00"),
                profit_percentage=Decimal("25.00"),
                vat_percentage=Decimal("5.00"),
                status="completed" if i < 8 else "pending" if i < 9 else "cancelled",
                created_at=datetime.combine(invoice_date, datetime.min.time())
            )
            invoices.append(invoice)
            db_session.add(invoice)
            db_session.flush()
            
            # Create invoice items
            for j in range(2):
                item = items[j % len(items)]
                invoice_item = InvoiceItem(
                    invoice_id=invoice.id,
                    inventory_item_id=item.id,
                    quantity=1,
                    unit_price=Decimal("750.00"),
                    total_price=Decimal("750.00"),
                    weight_grams=Decimal("10.5")
                )
                db_session.add(invoice_item)
            
            # Create payments for completed invoices
            if invoice.status == "completed":
                payment = Payment(
                    customer_id=customer.id,
                    invoice_id=invoice.id,
                    amount=invoice.paid_amount,
                    payment_method="cash",
                    description=f"Payment for {invoice.invoice_number}"
                )
                db_session.add(payment)
        
        db_session.commit()
        
        return {
            "invoices": invoices,
            "customers": customers,
            "items": items,
            "category": category,
            "user": user,
            "role": role
        }
    
    @pytest.mark.asyncio
    async def test_calculate_financial_kpis_basic(self, kpi_service, sample_data):
        """Test basic financial KPI calculation"""
        
        # Define test period
        start_date = date.today() - timedelta(days=30)
        end_date = date.today()
        
        # Calculate KPIs
        result = await kpi_service.calculate_financial_kpis(
            time_range=(start_date, end_date)
        )
        
        # Verify basic structure
        assert isinstance(result, dict)
        assert "total_revenue" in result
        assert "gross_profit" in result
        assert "gross_margin" in result
        assert "transaction_count" in result
        assert "period_start" in result
        assert "period_end" in result
        assert "calculated_at" in result
        
        # Verify data types and ranges
        assert isinstance(result["total_revenue"], (int, float))
        assert isinstance(result["gross_profit"], (int, float))
        assert isinstance(result["gross_margin"], (int, float))
        assert isinstance(result["transaction_count"], int)
        assert result["total_revenue"] >= 0
        assert result["transaction_count"] >= 0
        
        # Verify period information
        assert result["period_start"] == start_date.isoformat()
        assert result["period_end"] == end_date.isoformat()
    
    @pytest.mark.asyncio
    async def test_calculate_financial_kpis_with_targets(self, kpi_service, sample_data):
        """Test financial KPI calculation with targets and achievement rates"""
        
        start_date = date.today() - timedelta(days=30)
        end_date = date.today()
        
        targets = {
            "revenue": 10000.0,
            "profit_margin": 30.0,
            "transaction_count": 15
        }
        
        result = await kpi_service.calculate_financial_kpis(
            time_range=(start_date, end_date),
            targets=targets
        )
        
        # Verify achievement rate calculations
        assert "revenue_achievement_rate" in result
        assert "margin_achievement_rate" in result
        assert "transaction_achievement_rate" in result
        
        # Verify target values are stored
        assert result["targets"] == targets
        assert "revenue_target" in result
        assert "margin_target" in result
        assert "transaction_target" in result
        
        # Verify variance calculations
        assert "revenue_variance" in result
        assert "margin_variance" in result
        assert "transaction_variance" in result
        
        # Verify achievement rates are percentages
        assert isinstance(result["revenue_achievement_rate"], (int, float))
        assert isinstance(result["margin_achievement_rate"], (int, float))
        assert isinstance(result["transaction_achievement_rate"], (int, float))
    
    @pytest.mark.asyncio
    async def test_revenue_metrics_calculation(self, kpi_service, sample_data):
        """Test detailed revenue metrics calculation"""
        
        start_date = date.today() - timedelta(days=30)
        end_date = date.today()
        
        result = await kpi_service.calculate_financial_kpis(
            time_range=(start_date, end_date)
        )
        
        # Verify revenue metrics
        assert "total_revenue" in result
        assert "total_paid" in result
        assert "total_outstanding" in result
        assert "collection_rate" in result
        assert "outstanding_ratio" in result
        assert "avg_transaction_value" in result
        assert "unique_customers" in result
        assert "completion_rate" in result
        
        # Verify calculations are logical
        assert result["total_revenue"] >= result["total_paid"]
        assert result["collection_rate"] <= 100.0
        assert result["outstanding_ratio"] >= 0.0
        
        # Verify collection rate calculation
        if result["total_revenue"] > 0:
            expected_collection_rate = (result["total_paid"] / result["total_revenue"]) * 100
            assert abs(result["collection_rate"] - expected_collection_rate) < 0.01
    
    @pytest.mark.asyncio
    async def test_profit_metrics_calculation(self, kpi_service, sample_data):
        """Test detailed profit and margin metrics calculation"""
        
        start_date = date.today() - timedelta(days=30)
        end_date = date.today()
        
        result = await kpi_service.calculate_financial_kpis(
            time_range=(start_date, end_date)
        )
        
        # Verify profit metrics
        assert "total_sales" in result
        assert "total_cost" in result
        assert "gross_profit" in result
        assert "net_profit" in result
        assert "gross_margin" in result
        assert "net_margin" in result
        assert "markup_percentage" in result
        assert "cost_ratio" in result
        assert "profit_per_unit" in result
        
        # Verify profit calculations
        expected_gross_profit = result["total_sales"] - result["total_cost"]
        assert abs(result["gross_profit"] - expected_gross_profit) < 0.01
        
        # Verify margin calculations
        if result["total_sales"] > 0:
            expected_gross_margin = (result["gross_profit"] / result["total_sales"]) * 100
            assert abs(result["gross_margin"] - expected_gross_margin) < 0.01
        
        # Verify markup calculation
        if result["total_cost"] > 0:
            expected_markup = (result["gross_profit"] / result["total_cost"]) * 100
            assert abs(result["markup_percentage"] - expected_markup) < 0.01
    
    @pytest.mark.asyncio
    async def test_trend_analysis_calculation(self, kpi_service, sample_data):
        """Test trend analysis with statistical significance"""
        
        start_date = date.today() - timedelta(days=15)
        end_date = date.today()
        
        result = await kpi_service.calculate_financial_kpis(
            time_range=(start_date, end_date)
        )
        
        # Verify trend analysis structure
        assert "revenue_trend" in result
        assert "transaction_trend" in result
        assert "avg_transaction_trend" in result
        
        # Verify trend data structure
        revenue_trend = result["revenue_trend"]
        assert "direction" in revenue_trend
        assert "percentage_change" in revenue_trend
        assert "current_value" in revenue_trend
        assert "previous_value" in revenue_trend
        assert "significance" in revenue_trend
        
        # Verify trend direction values
        assert revenue_trend["direction"] in ["up", "down", "stable"]
        assert isinstance(revenue_trend["percentage_change"], (int, float))
        assert isinstance(revenue_trend["current_value"], (int, float))
        assert isinstance(revenue_trend["previous_value"], (int, float))
        
        # Verify significance levels
        valid_significance = [
            "highly_significant", "significant", "marginally_significant", 
            "not_significant", "insufficient_data", "calculation_error"
        ]
        assert revenue_trend["significance"] in valid_significance
    
    @pytest.mark.asyncio
    async def test_kpi_caching_mechanism(self, kpi_service, sample_data, mock_cache):
        """Test KPI caching functionality"""
        
        start_date = date.today() - timedelta(days=30)
        end_date = date.today()
        
        # First call - should calculate and cache
        result1 = await kpi_service.calculate_financial_kpis(
            time_range=(start_date, end_date)
        )
        
        # Verify cache was called for get and set
        mock_cache.get_kpi_data.assert_called()
        mock_cache.set_kpi_data.assert_called()
        
        # Mock cache to return data for second call
        mock_cache.get_kpi_data.return_value = {"data": result1}
        
        # Second call - should use cache
        result2 = await kpi_service.calculate_financial_kpis(
            time_range=(start_date, end_date)
        )
        
        # Verify results are identical
        assert result1 == result2
        
        # Verify cache was accessed
        assert mock_cache.get_kpi_data.call_count >= 2
    
    @pytest.mark.asyncio
    async def test_kpi_snapshots_saving(self, kpi_service, sample_data, db_session):
        """Test KPI snapshot saving for historical tracking"""
        
        start_date = date.today() - timedelta(days=30)
        end_date = date.today()
        
        # Calculate KPIs (which should save snapshots)
        await kpi_service.calculate_financial_kpis(
            time_range=(start_date, end_date),
            targets={"revenue": 10000.0, "profit_margin": 25.0}
        )
        
        # Verify snapshots were saved
        snapshots = db_session.query(KPISnapshot).filter(
            KPISnapshot.kpi_type == "financial",
            KPISnapshot.period_start == start_date,
            KPISnapshot.period_end == end_date
        ).all()
        
        assert len(snapshots) > 0
        
        # Verify snapshot data
        revenue_snapshot = next(
            (s for s in snapshots if s.kpi_name == "revenue"), None
        )
        assert revenue_snapshot is not None
        assert revenue_snapshot.value > 0
        assert revenue_snapshot.target_value == Decimal("10000.0")
        assert revenue_snapshot.achievement_rate is not None
        assert revenue_snapshot.trend_direction in ["up", "down", "stable"]
    
    @pytest.mark.asyncio
    async def test_get_kpi_trends(self, kpi_service, sample_data, db_session):
        """Test KPI trend analysis functionality"""
        
        # Create historical KPI snapshots
        base_date = date.today() - timedelta(days=90)
        
        for i in range(6):
            period_start = base_date + timedelta(days=i * 15)
            period_end = period_start + timedelta(days=14)
            
            snapshot = KPISnapshot(
                kpi_type="financial",
                kpi_name="revenue",
                value=Decimal(str(10000 + i * 1000)),  # Increasing trend
                target_value=Decimal("12000"),
                achievement_rate=Decimal(str(80 + i * 5)),
                trend_direction="up",
                period_start=period_start,
                period_end=period_end
            )
            db_session.add(snapshot)
        
        db_session.commit()
        
        # Get trend analysis
        result = await kpi_service.get_kpi_trends("financial", "revenue", periods=6)
        
        # Verify trend analysis structure
        assert "kpi_type" in result
        assert "kpi_name" in result
        assert "periods_analyzed" in result
        assert "trend_data" in result
        assert "trend_analysis" in result
        assert "summary_statistics" in result
        
        # Verify trend data
        assert result["kpi_type"] == "financial"
        assert result["kpi_name"] == "revenue"
        assert result["periods_analyzed"] == 6
        assert len(result["trend_data"]) == 6
        
        # Verify trend analysis
        trend_analysis = result["trend_analysis"]
        assert "slope" in trend_analysis
        assert "r_squared" in trend_analysis
        assert "trend_strength" in trend_analysis
        assert "overall_direction" in trend_analysis
        
        # Verify increasing trend is detected
        assert trend_analysis["overall_direction"] == "increasing"
        assert trend_analysis["slope"] > 0
        
        # Verify summary statistics
        stats = result["summary_statistics"]
        assert "mean" in stats
        assert "median" in stats
        assert "std_dev" in stats
        assert "min_value" in stats
        assert "max_value" in stats
    
    @pytest.mark.asyncio
    async def test_statistical_significance_calculation(self, kpi_service):
        """Test statistical significance calculation"""
        
        # Test with significantly different data
        current_data = [100, 110, 105, 115, 120]
        previous_data = [50, 55, 52, 58, 60]
        
        significance = await kpi_service._calculate_statistical_significance(
            current_data, previous_data
        )
        
        assert significance in [
            "highly_significant", "significant", "marginally_significant", 
            "not_significant", "insufficient_data", "calculation_error"
        ]
        
        # Test with similar data
        similar_current = [100, 102, 98, 101, 99]
        similar_previous = [99, 101, 97, 103, 100]
        
        similarity_significance = await kpi_service._calculate_statistical_significance(
            similar_current, similar_previous
        )
        
        # Should be not significant for similar data
        assert similarity_significance in ["not_significant", "marginally_significant"]
        
        # Test with insufficient data
        insufficient_significance = await kpi_service._calculate_statistical_significance(
            [100], [99]
        )
        
        assert insufficient_significance == "insufficient_data"
    
    @pytest.mark.asyncio
    async def test_cache_invalidation(self, kpi_service, mock_cache):
        """Test cache invalidation functionality"""
        
        start_date = date.today() - timedelta(days=30)
        end_date = date.today()
        
        # Test specific date range invalidation
        await kpi_service.invalidate_financial_cache((start_date, end_date))
        
        expected_pattern = f"financial_kpis_{start_date}_{end_date}"
        mock_cache.invalidate_cache.assert_called_with(expected_pattern)
        
        # Test general invalidation
        await kpi_service.invalidate_financial_cache()
        
        mock_cache.invalidate_cache.assert_called_with("kpi:financial")
    
    @pytest.mark.asyncio
    async def test_cache_statistics(self, kpi_service, sample_data, db_session):
        """Test cache statistics functionality"""
        
        # Create some KPI snapshots for statistics
        snapshot = KPISnapshot(
            kpi_type="financial",
            kpi_name="test_kpi",
            value=Decimal("1000"),
            period_start=date.today() - timedelta(days=7),
            period_end=date.today()
        )
        db_session.add(snapshot)
        db_session.commit()
        
        # Get cache statistics
        result = await kpi_service.get_cache_statistics()
        
        # Verify structure
        assert "cache_stats" in result
        assert "kpi_statistics" in result
        assert "service_info" in result
        
        # Verify cache stats
        cache_stats = result["cache_stats"]
        assert "status" in cache_stats
        assert "total_keys" in cache_stats
        
        # Verify KPI statistics
        kpi_stats = result["kpi_statistics"]
        if "financial" in kpi_stats:
            financial_stats = kpi_stats["financial"]
            assert "total_snapshots" in financial_stats
            assert "unique_kpis" in financial_stats
            assert financial_stats["total_snapshots"] >= 1
        
        # Verify service info
        service_info = result["service_info"]
        assert "cache_ttl" in service_info
        assert "statistical_methods" in service_info
        assert "supported_kpi_types" in service_info
    
    @pytest.mark.asyncio
    async def test_error_handling(self, kpi_service, mock_cache):
        """Test error handling in KPI calculations"""
        
        # Test with invalid date range
        invalid_start = date.today()
        invalid_end = date.today() - timedelta(days=30)  # End before start
        
        result = await kpi_service.calculate_financial_kpis(
            time_range=(invalid_start, invalid_end)
        )
        
        # Should handle gracefully
        assert isinstance(result, dict)
        
        # Test with cache error
        mock_cache.get_kpi_data.side_effect = Exception("Cache error")
        
        start_date = date.today() - timedelta(days=30)
        end_date = date.today()
        
        result = await kpi_service.calculate_financial_kpis(
            time_range=(start_date, end_date)
        )
        
        # Should still work without cache
        assert isinstance(result, dict)
        
        # Reset mock
        mock_cache.get_kpi_data.side_effect = None
        mock_cache.get_kpi_data.return_value = None
    
    @pytest.mark.asyncio
    async def test_empty_data_handling(self, kpi_service, db_session):
        """Test handling of empty data scenarios"""
        
        # Test with date range that has no data
        future_start = date.today() + timedelta(days=30)
        future_end = date.today() + timedelta(days=60)
        
        result = await kpi_service.calculate_financial_kpis(
            time_range=(future_start, future_end)
        )
        
        # Should return zero values, not errors
        assert isinstance(result, dict)
        assert result["total_revenue"] == 0
        assert result["transaction_count"] == 0
        assert result["gross_profit"] == 0
        
        # Verify no division by zero errors
        assert isinstance(result["gross_margin"], (int, float))
        assert isinstance(result["collection_rate"], (int, float))
    
    def test_service_initialization(self, db_session):
        """Test KPI calculator service initialization"""
        
        service = KPICalculatorService(db_session)
        
        assert service.db == db_session
        assert service.cache_ttl == 300
        assert hasattr(service, 'cache')
    
    @pytest.mark.asyncio
    async def test_daily_financial_data_retrieval(self, kpi_service, sample_data):
        """Test daily financial data retrieval for trend analysis"""
        
        start_date = date.today() - timedelta(days=30)
        end_date = date.today()
        
        daily_data = await kpi_service._get_daily_financial_data(start_date, end_date)
        
        # Verify data structure
        assert isinstance(daily_data, list)
        
        if daily_data:  # If there's data
            for day_data in daily_data:
                assert "date" in day_data
                assert "revenue" in day_data
                assert "transaction_count" in day_data
                assert "avg_transaction" in day_data
                
                # Verify data types
                assert isinstance(day_data["revenue"], (int, float))
                assert isinstance(day_data["transaction_count"], int)
                assert isinstance(day_data["avg_transaction"], (int, float))
                
                # Verify date format
                assert isinstance(day_data["date"], str)
                datetime.fromisoformat(day_data["date"])  # Should not raise exception