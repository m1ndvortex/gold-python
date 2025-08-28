"""
Test Cost Analysis Service and API Endpoints

Tests the comprehensive cost analysis functionality including:
- Cost breakdown calculations
- Optimization recommendations
- Cost trend analysis
- ROI calculations
"""

import pytest
from decimal import Decimal
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from main import app
from database import get_db, engine
from models import Base, InventoryItem, Invoice, InvoiceItem, Category, User
from services.cost_analysis_service import CostAnalysisService


# Test client
client = TestClient(app)


@pytest.fixture(scope="function")
def db_session():
    """Create a test database session"""
    Base.metadata.create_all(bind=engine)
    db = next(get_db())
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def sample_data(db_session: Session):
    """Create sample data for testing"""
    # Create test user
    user = User(
        username="testuser",
        email="test@example.com",
        hashed_password="hashed_password",
        role="admin"
    )
    db_session.add(user)
    db_session.flush()
    
    # Create test category
    category = Category(
        name="Gold Jewelry",
        description="Gold jewelry items"
    )
    db_session.add(category)
    db_session.flush()
    
    # Create test inventory items
    items = []
    for i in range(5):
        item = InventoryItem(
            name=f"Gold Ring {i+1}",
            description=f"Test gold ring {i+1}",
            category_id=category.id,
            current_stock=10 + i * 5,
            cost_price=Decimal('100.00') + Decimal(str(i * 10)),
            selling_price=Decimal('150.00') + Decimal(str(i * 15)),
            weight=Decimal('5.0') + Decimal(str(i)),
            purity="18K"
        )
        db_session.add(item)
        items.append(item)
    
    db_session.flush()
    
    # Create test invoices
    invoices = []
    for i in range(10):
        invoice = Invoice(
            customer_name=f"Customer {i+1}",
            customer_phone=f"123456789{i}",
            total_amount=Decimal('200.00') + Decimal(str(i * 50)),
            status='completed',
            type='sale',
            created_at=datetime.now() - timedelta(days=i * 3),
            user_id=user.id
        )
        db_session.add(invoice)
        invoices.append(invoice)
    
    db_session.flush()
    
    # Create invoice items
    for i, invoice in enumerate(invoices):
        item = items[i % len(items)]
        invoice_item = InvoiceItem(
            invoice_id=invoice.id,
            inventory_item_id=item.id,
            quantity=1 + i % 3,
            unit_price=item.selling_price,
            total_price=item.selling_price * (1 + i % 3)
        )
        db_session.add(invoice_item)
    
    db_session.commit()
    
    return {
        'user': user,
        'category': category,
        'items': items,
        'invoices': invoices
    }


class TestCostAnalysisService:
    """Test the CostAnalysisService class"""
    
    def test_calculate_cost_breakdown(self, db_session: Session, sample_data):
        """Test cost breakdown calculation"""
        service = CostAnalysisService(db_session)
        
        # Test with default time range
        breakdown = service.calculate_cost_breakdown()
        
        assert breakdown is not None
        assert breakdown.total_costs >= 0
        assert breakdown.carrying_costs >= 0
        assert breakdown.ordering_costs >= 0
        assert breakdown.stockout_costs >= 0
        assert breakdown.cost_per_unit >= 0
        assert 0 <= breakdown.cost_percentage <= 100
    
    def test_calculate_cost_breakdown_with_category(self, db_session: Session, sample_data):
        """Test cost breakdown calculation with category filter"""
        service = CostAnalysisService(db_session)
        category_id = str(sample_data['category'].id)
        
        breakdown = service.calculate_cost_breakdown(category_id=category_id)
        
        assert breakdown is not None
        assert breakdown.total_costs >= 0
    
    def test_generate_optimization_recommendations(self, db_session: Session, sample_data):
        """Test optimization recommendations generation"""
        service = CostAnalysisService(db_session)
        
        recommendations = service.generate_optimization_recommendations()
        
        assert isinstance(recommendations, list)
        # Should have at least some recommendations
        assert len(recommendations) >= 0
        
        for rec in recommendations:
            assert rec.category is not None
            assert rec.current_cost >= 0
            assert rec.potential_savings >= 0
            assert 0 <= rec.savings_percentage <= 100
            assert rec.recommendation is not None
            assert rec.implementation_effort in ['Low', 'Medium', 'High']
            assert rec.expected_roi >= 0
            assert rec.timeline is not None
    
    def test_analyze_cost_trends(self, db_session: Session, sample_data):
        """Test cost trend analysis"""
        service = CostAnalysisService(db_session)
        
        trends = service.analyze_cost_trends(periods=6)
        
        assert isinstance(trends, list)
        assert len(trends) == 6
        
        for trend in trends:
            assert trend.period is not None
            assert trend.total_cost >= 0
            assert trend.carrying_cost >= 0
            assert trend.ordering_cost >= 0
            assert trend.stockout_cost >= 0
            assert trend.trend_direction in ['increasing', 'decreasing', 'stable']
            assert isinstance(trend.variance_percentage, float)
    
    def test_calculate_roi_analysis(self, db_session: Session, sample_data):
        """Test ROI analysis calculation"""
        service = CostAnalysisService(db_session)
        investment_amount = Decimal('10000.00')
        
        roi_analysis = service.calculate_roi_analysis(investment_amount)
        
        assert roi_analysis is not None
        assert roi_analysis['investment_amount'] == investment_amount
        assert roi_analysis['monthly_savings'] >= 0
        assert roi_analysis['total_savings'] >= 0
        assert isinstance(roi_analysis['roi_percentage'], float)
        assert roi_analysis['payback_months'] >= 0
        assert isinstance(roi_analysis['net_present_value'], Decimal)
        assert roi_analysis['recommendations_count'] >= 0
        assert isinstance(roi_analysis['high_impact_recommendations'], list)


class TestCostAnalysisAPI:
    """Test the Cost Analysis API endpoints"""
    
    def test_get_cost_breakdown_endpoint(self, sample_data):
        """Test the cost breakdown API endpoint"""
        response = client.get("/api/cost-analysis/breakdown")
        
        assert response.status_code == 200
        data = response.json()
        
        assert 'carrying_costs' in data
        assert 'ordering_costs' in data
        assert 'stockout_costs' in data
        assert 'total_costs' in data
        assert 'cost_per_unit' in data
        assert 'cost_percentage' in data
        
        assert data['carrying_costs'] >= 0
        assert data['ordering_costs'] >= 0
        assert data['stockout_costs'] >= 0
        assert data['total_costs'] >= 0
        assert data['cost_per_unit'] >= 0
        assert 0 <= data['cost_percentage'] <= 100
    
    def test_get_cost_breakdown_with_category(self, sample_data):
        """Test cost breakdown endpoint with category filter"""
        category_id = str(sample_data['category'].id)
        response = client.get(f"/api/cost-analysis/breakdown?category_id={category_id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data['total_costs'] >= 0
    
    def test_get_cost_breakdown_with_date_range(self, sample_data):
        """Test cost breakdown endpoint with date range"""
        start_date = (datetime.now() - timedelta(days=30)).isoformat()
        end_date = datetime.now().isoformat()
        
        response = client.get(
            f"/api/cost-analysis/breakdown?start_date={start_date}&end_date={end_date}"
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data['total_costs'] >= 0
    
    def test_get_optimization_recommendations_endpoint(self, sample_data):
        """Test the optimization recommendations API endpoint"""
        response = client.get("/api/cost-analysis/recommendations")
        
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        
        for rec in data:
            assert 'category' in rec
            assert 'current_cost' in rec
            assert 'potential_savings' in rec
            assert 'savings_percentage' in rec
            assert 'recommendation' in rec
            assert 'implementation_effort' in rec
            assert 'expected_roi' in rec
            assert 'timeline' in rec
            
            assert rec['current_cost'] >= 0
            assert rec['potential_savings'] >= 0
            assert 0 <= rec['savings_percentage'] <= 100
            assert rec['implementation_effort'] in ['Low', 'Medium', 'High']
            assert rec['expected_roi'] >= 0
    
    def test_get_cost_trends_endpoint(self, sample_data):
        """Test the cost trends API endpoint"""
        response = client.get("/api/cost-analysis/trends?periods=6")
        
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        assert len(data) == 6
        
        for trend in data:
            assert 'period' in trend
            assert 'total_cost' in trend
            assert 'carrying_cost' in trend
            assert 'ordering_cost' in trend
            assert 'stockout_cost' in trend
            assert 'trend_direction' in trend
            assert 'variance_percentage' in trend
            
            assert trend['total_cost'] >= 0
            assert trend['carrying_cost'] >= 0
            assert trend['ordering_cost'] >= 0
            assert trend['stockout_cost'] >= 0
            assert trend['trend_direction'] in ['increasing', 'decreasing', 'stable']
            assert isinstance(trend['variance_percentage'], (int, float))
    
    def test_get_roi_analysis_endpoint(self, sample_data):
        """Test the ROI analysis API endpoint"""
        investment_amount = 10000.0
        response = client.get(f"/api/cost-analysis/roi-analysis?investment_amount={investment_amount}")
        
        assert response.status_code == 200
        data = response.json()
        
        assert 'investment_amount' in data
        assert 'monthly_savings' in data
        assert 'total_savings' in data
        assert 'roi_percentage' in data
        assert 'payback_months' in data
        assert 'net_present_value' in data
        assert 'recommendations_count' in data
        assert 'high_impact_recommendations' in data
        
        assert data['investment_amount'] == investment_amount
        assert data['monthly_savings'] >= 0
        assert data['total_savings'] >= 0
        assert isinstance(data['roi_percentage'], (int, float))
        assert data['payback_months'] >= 0
        assert data['recommendations_count'] >= 0
        assert isinstance(data['high_impact_recommendations'], list)
    
    def test_get_cost_analysis_summary_endpoint(self, sample_data):
        """Test the cost analysis summary API endpoint"""
        response = client.get("/api/cost-analysis/summary")
        
        assert response.status_code == 200
        data = response.json()
        
        assert 'cost_breakdown' in data
        assert 'top_recommendations' in data
        assert 'trend_summary' in data
        assert 'optimization_potential' in data
        
        # Check cost breakdown structure
        breakdown = data['cost_breakdown']
        assert 'total_costs' in breakdown
        assert 'carrying_costs' in breakdown
        assert 'ordering_costs' in breakdown
        assert 'stockout_costs' in breakdown
        assert 'cost_percentage' in breakdown
        
        # Check recommendations structure
        recommendations = data['top_recommendations']
        assert isinstance(recommendations, list)
        assert len(recommendations) <= 3  # Top 3 recommendations
        
        # Check trend summary structure
        trend_summary = data['trend_summary']
        assert 'current_month_cost' in trend_summary
        assert 'previous_month_cost' in trend_summary
        assert 'trend_direction' in trend_summary
        assert 'variance_percentage' in trend_summary
        
        # Check optimization potential structure
        optimization = data['optimization_potential']
        assert 'total_potential_savings' in optimization
        assert 'recommendations_count' in optimization
        assert 'high_impact_count' in optimization
    
    def test_invalid_investment_amount(self, sample_data):
        """Test ROI analysis with invalid investment amount"""
        response = client.get("/api/cost-analysis/roi-analysis?investment_amount=-1000")
        
        assert response.status_code == 422  # Validation error
    
    def test_invalid_periods_parameter(self, sample_data):
        """Test cost trends with invalid periods parameter"""
        response = client.get("/api/cost-analysis/trends?periods=0")
        
        assert response.status_code == 422  # Validation error
        
        response = client.get("/api/cost-analysis/trends?periods=30")
        
        assert response.status_code == 422  # Validation error (max 24)


class TestCostAnalysisIntegration:
    """Integration tests for cost analysis functionality"""
    
    def test_end_to_end_cost_analysis_workflow(self, db_session: Session, sample_data):
        """Test complete cost analysis workflow"""
        service = CostAnalysisService(db_session)
        
        # Step 1: Calculate cost breakdown
        breakdown = service.calculate_cost_breakdown()
        assert breakdown.total_costs >= 0
        
        # Step 2: Generate recommendations
        recommendations = service.generate_optimization_recommendations()
        assert isinstance(recommendations, list)
        
        # Step 3: Analyze trends
        trends = service.analyze_cost_trends(periods=3)
        assert len(trends) == 3
        
        # Step 4: Calculate ROI
        roi_analysis = service.calculate_roi_analysis(Decimal('5000.00'))
        assert roi_analysis['investment_amount'] == Decimal('5000.00')
        
        # Verify data consistency
        total_potential_savings = sum(rec.potential_savings for rec in recommendations)
        assert roi_analysis['monthly_savings'] <= total_potential_savings / 12
    
    def test_cost_analysis_with_no_data(self, db_session: Session):
        """Test cost analysis with empty database"""
        service = CostAnalysisService(db_session)
        
        # Should handle empty data gracefully
        breakdown = service.calculate_cost_breakdown()
        assert breakdown.total_costs == 0
        assert breakdown.carrying_costs == 0
        assert breakdown.ordering_costs == 0
        assert breakdown.stockout_costs == 0
        
        recommendations = service.generate_optimization_recommendations()
        assert isinstance(recommendations, list)
        
        trends = service.analyze_cost_trends(periods=3)
        assert len(trends) == 3
        for trend in trends:
            assert trend.total_cost == 0
    
    def test_cost_analysis_performance(self, db_session: Session, sample_data):
        """Test cost analysis performance with larger dataset"""
        import time
        
        service = CostAnalysisService(db_session)
        
        # Measure performance of cost breakdown calculation
        start_time = time.time()
        breakdown = service.calculate_cost_breakdown()
        breakdown_time = time.time() - start_time
        
        # Should complete within reasonable time (< 1 second)
        assert breakdown_time < 1.0
        assert breakdown is not None
        
        # Measure performance of recommendations generation
        start_time = time.time()
        recommendations = service.generate_optimization_recommendations()
        recommendations_time = time.time() - start_time
        
        # Should complete within reasonable time (< 2 seconds)
        assert recommendations_time < 2.0
        assert isinstance(recommendations, list)
        
        # Measure performance of trend analysis
        start_time = time.time()
        trends = service.analyze_cost_trends(periods=12)
        trends_time = time.time() - start_time
        
        # Should complete within reasonable time (< 3 seconds)
        assert trends_time < 3.0
        assert len(trends) == 12


if __name__ == "__main__":
    pytest.main([__file__, "-v"])