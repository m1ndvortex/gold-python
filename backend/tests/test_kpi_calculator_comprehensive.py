"""
Comprehensive test for KPI Calculator Service using real PostgreSQL data
"""

import pytest
import asyncio
from datetime import date, datetime, timedelta
from decimal import Decimal
from sqlalchemy.orm import Session

from services.kpi_calculator_service import KPICalculatorService, FinancialKPICalculator
from models import (
    Invoice, InvoiceItem, InventoryItem, Customer, Category, 
    KPISnapshot, Payment, User, Role
)


@pytest.mark.asyncio
async def test_kpi_calculator_with_real_data(db_session):
    """Test KPI calculator with real database data"""
    
    # Create test data
    await create_test_data(db_session)
    
    # Create KPI service
    kpi_service = KPICalculatorService(db_session)
    
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
    
    print("✅ Comprehensive KPI calculator test passed!")
    print(f"Total Revenue: ${result['total_revenue']:,.2f}")
    print(f"Gross Profit: ${result['gross_profit']:,.2f}")
    print(f"Gross Margin: {result['gross_margin']:.2f}%")
    print(f"Transaction Count: {result['transaction_count']}")


@pytest.mark.asyncio
async def test_kpi_calculator_with_targets(db_session):
    """Test KPI calculator with targets and achievement rates"""
    
    # Create test data
    await create_test_data(db_session)
    
    # Create KPI service
    kpi_service = KPICalculatorService(db_session)
    
    # Define test period and targets
    start_date = date.today() - timedelta(days=30)
    end_date = date.today()
    
    targets = {
        "revenue": 10000.0,
        "profit_margin": 30.0,
        "transaction_count": 15
    }
    
    # Calculate KPIs with targets
    result = await kpi_service.calculate_financial_kpis(
        time_range=(start_date, end_date),
        targets=targets
    )
    
    # Verify achievement data is included
    assert "targets" in result
    assert result["targets"] == targets
    
    # Check if achievement data exists (may not be present if no achievements calculated)
    if "achievements" in result:
        achievements = result["achievements"]
        assert isinstance(achievements, dict)
        
        if "revenue" in achievements:
            revenue_achievement = achievements["revenue"]
            assert "target" in revenue_achievement
            assert "actual" in revenue_achievement
            assert "achievement_rate" in revenue_achievement
            assert "status" in revenue_achievement
    
    print("✅ KPI calculator with targets test passed!")


@pytest.mark.asyncio
async def test_financial_kpi_calculator_revenue_methods(db_session):
    """Test individual methods of FinancialKPICalculator"""
    
    # Create test data
    await create_test_data(db_session)
    
    # Create financial calculator
    calculator = FinancialKPICalculator(db_session)
    
    # Test period revenue calculation
    start_date = date.today() - timedelta(days=30)
    end_date = date.today()
    
    revenue = await calculator._calculate_period_revenue(start_date, end_date)
    assert isinstance(revenue, (int, float))
    assert revenue >= 0
    
    # Test profit metrics calculation
    profit_metrics = await calculator._calculate_period_profit_metrics(start_date, end_date)
    assert isinstance(profit_metrics, dict)
    assert "total_sales" in profit_metrics
    assert "total_cost" in profit_metrics
    assert "gross_profit" in profit_metrics
    assert "gross_margin" in profit_metrics
    
    # Test transaction metrics calculation
    transaction_metrics = await calculator._calculate_transaction_metrics(start_date, end_date)
    assert isinstance(transaction_metrics, dict)
    assert "transaction_count" in transaction_metrics
    assert "unique_customers" in transaction_metrics
    assert "avg_transaction_value" in transaction_metrics
    
    print("✅ Individual calculator methods test passed!")


async def create_test_data(db_session: Session):
    """Create comprehensive test data"""
    
    try:
        # Create role and user
        role = Role(
            name="test_admin",
            description="Test Administrator role",
            permissions={"all": True}
        )
        db_session.add(role)
        db_session.flush()
        
        user = User(
            username="testuser_kpi",
            email="testkpi@example.com",
            password_hash="hashed_password",
            role_id=role.id
        )
        db_session.add(user)
        db_session.flush()
        
        # Create category
        category = Category(
            name="Test Gold Jewelry"
        )
        db_session.add(category)
        db_session.flush()
        
        # Create inventory items
        items = []
        for i in range(3):
            item = InventoryItem(
                name=f"Test Gold Ring {i+1}",
                category_id=category.id,
                purchase_price=Decimal("500.00"),
                stock_quantity=20
            )
            items.append(item)
            db_session.add(item)
        
        db_session.flush()
        
        # Create customers
        customers = []
        for i in range(2):
            customer = Customer(
                name=f"Test Customer {i+1}",
                phone=f"555000{i+1}",
                total_purchases=Decimal("0.00")
            )
            customers.append(customer)
            db_session.add(customer)
        
        db_session.flush()
        
        # Create invoices with different dates
        base_date = date.today() - timedelta(days=20)
        
        for i in range(5):
            invoice_date = base_date + timedelta(days=i * 4)
            customer = customers[i % len(customers)]
            
            invoice = Invoice(
                customer_id=customer.id,
                total_amount=Decimal("1500.00"),
                paid_amount=Decimal("1500.00"),
                remaining_amount=Decimal("0.00"),
                status="completed",
                created_at=datetime.combine(invoice_date, datetime.min.time())
            )
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
                    total_price=Decimal("750.00")
                )
                db_session.add(invoice_item)
            
            # Create payment
            payment = Payment(
                customer_id=customer.id,
                invoice_id=invoice.id,
                amount=invoice.paid_amount,
                payment_method="cash",
                description=f"Test payment for invoice {invoice.id}"
            )
            db_session.add(payment)
        
        db_session.commit()
        print("✅ Test data created successfully")
        
    except Exception as e:
        print(f"❌ Error creating test data: {e}")
        db_session.rollback()
        raise


if __name__ == "__main__":
    # Run tests directly
    import sys
    sys.exit(pytest.main([__file__, "-v"]))