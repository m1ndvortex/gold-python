"""
Integration tests for Category Intelligence System

Tests the complete category intelligence functionality including:
- Category performance analysis with real data
- Seasonal pattern recognition
- Cross-selling opportunity identification
"""

import pytest
import asyncio
from datetime import datetime, timedelta
from decimal import Decimal
from sqlalchemy.orm import Session
from fastapi.testclient import TestClient

from main import app
from database import get_db, engine
from models import Base, Category, InventoryItem, Customer, Invoice, InvoiceItem
from services.category_intelligence_service import CategoryIntelligenceService
import uuid


@pytest.fixture(scope="module")
def test_db():
    """Create test database session"""
    Base.metadata.create_all(bind=engine)
    db = next(get_db())
    yield db
    db.close()


@pytest.fixture(scope="module")
def client():
    """Create test client"""
    return TestClient(app)


@pytest.fixture(scope="module")
def test_data(test_db: Session):
    """Create comprehensive test data for category intelligence testing"""
    
    # Create categories
    categories = []
    category_names = [
        "Gold Rings", "Gold Necklaces", "Gold Bracelets", 
        "Silver Rings", "Silver Necklaces", "Diamonds",
        "Watches", "Earrings"
    ]
    
    for name in category_names:
        category = Category(
            id=uuid.uuid4(),
            name=name,
            description=f"Category for {name}",
            is_active=True
        )
        test_db.add(category)
        categories.append(category)
    
    test_db.commit()
    
    # Create inventory items for each category
    inventory_items = []
    for i, category in enumerate(categories):
        for j in range(5):  # 5 items per category
            item = InventoryItem(
                id=uuid.uuid4(),
                name=f"{category.name} Item {j+1}",
                category_id=category.id,
                weight_grams=Decimal(f"{10 + j * 2}.5"),
                purchase_price=Decimal(f"{100 + i * 50 + j * 10}"),
                sell_price=Decimal(f"{150 + i * 75 + j * 15}"),
                stock_quantity=50 + j * 10,
                is_active=True
            )
            test_db.add(item)
            inventory_items.append(item)
    
    test_db.commit()
    
    # Create customers
    customers = []
    for i in range(20):
        customer = Customer(
            id=uuid.uuid4(),
            name=f"Customer {i+1}",
            phone=f"555-{1000 + i}",
            email=f"customer{i+1}@test.com",
            is_active=True
        )
        test_db.add(customer)
        customers.append(customer)
    
    test_db.commit()
    
    # Create invoices with seasonal patterns and cross-selling data
    invoices = []
    base_date = datetime.now() - timedelta(days=730)  # 2 years of data
    
    for day_offset in range(0, 730, 7):  # Weekly invoices
        current_date = base_date + timedelta(days=day_offset)
        month = current_date.month
        
        # Create 3-5 invoices per week
        for invoice_num in range(3 + (day_offset % 3)):
            customer = customers[invoice_num % len(customers)]
            
            invoice = Invoice(
                id=uuid.uuid4(),
                invoice_number=f"INV-{day_offset}-{invoice_num}",
                customer_id=customer.id,
                total_amount=Decimal('0'),
                paid_amount=Decimal('0'),
                remaining_amount=Decimal('0'),
                gold_price_per_gram=Decimal('60.00'),
                status='completed',
                created_at=current_date
            )
            test_db.add(invoice)
            test_db.flush()  # Get the invoice ID
            
            # Add seasonal bias to certain categories
            seasonal_multipliers = {
                1: {"Diamonds": 2.0, "Gold Rings": 1.5},  # January - engagement season
                2: {"Diamonds": 2.5, "Gold Rings": 2.0},  # February - Valentine's
                5: {"Gold Necklaces": 1.8, "Earrings": 1.5},  # May - Mother's Day
                12: {"Watches": 2.0, "Gold Bracelets": 1.7}  # December - Christmas
            }
            
            # Select categories for this invoice (with cross-selling patterns)
            selected_categories = []
            
            # Primary category selection with seasonal bias
            primary_category = categories[invoice_num % len(categories)]
            multiplier = seasonal_multipliers.get(month, {}).get(primary_category.name, 1.0)
            
            if (invoice_num % 10) < (multiplier * 3):  # Higher chance during peak season
                selected_categories.append(primary_category)
            
            # Cross-selling patterns
            cross_sell_patterns = {
                "Gold Rings": ["Diamonds", "Gold Necklaces"],
                "Gold Necklaces": ["Earrings", "Gold Bracelets"],
                "Diamonds": ["Gold Rings", "Earrings"],
                "Watches": ["Gold Bracelets"],
                "Silver Rings": ["Silver Necklaces"]
            }
            
            # Add cross-sell items
            if selected_categories:
                primary_cat_name = selected_categories[0].name
                if primary_cat_name in cross_sell_patterns:
                    for cross_sell_name in cross_sell_patterns[primary_cat_name]:
                        if (invoice_num % 5) < 2:  # 40% chance of cross-sell
                            cross_sell_cat = next((c for c in categories if c.name == cross_sell_name), None)
                            if cross_sell_cat and cross_sell_cat not in selected_categories:
                                selected_categories.append(cross_sell_cat)
            
            # If no categories selected, select at least one
            if not selected_categories:
                selected_categories.append(categories[invoice_num % len(categories)])
            
            # Create invoice items
            total_amount = Decimal('0')
            for category in selected_categories:
                # Get items from this category
                cat_items = [item for item in inventory_items if item.category_id == category.id]
                if cat_items:
                    item = cat_items[invoice_num % len(cat_items)]
                    quantity = 1 + (invoice_num % 3)
                    
                    # Add seasonal price variation
                    base_price = item.sell_price
                    seasonal_mult = seasonal_multipliers.get(month, {}).get(category.name, 1.0)
                    unit_price = base_price * Decimal(str(seasonal_mult))
                    total_price = unit_price * quantity
                    
                    invoice_item = InvoiceItem(
                        id=uuid.uuid4(),
                        invoice_id=invoice.id,
                        inventory_item_id=item.id,
                        quantity=quantity,
                        unit_price=unit_price,
                        total_price=total_price,
                        weight_grams=item.weight_grams * quantity
                    )
                    test_db.add(invoice_item)
                    total_amount += total_price
            
            # Update invoice totals
            invoice.total_amount = total_amount
            invoice.paid_amount = total_amount
            invoice.remaining_amount = Decimal('0')
            
            invoices.append(invoice)
    
    test_db.commit()
    
    return {
        'categories': categories,
        'inventory_items': inventory_items,
        'customers': customers,
        'invoices': invoices
    }


class TestCategoryPerformanceAnalysis:
    """Test category performance analysis functionality"""
    
    @pytest.mark.asyncio
    async def test_analyze_category_performance(self, test_db: Session, test_data):
        """Test category performance analysis with real data"""
        service = CategoryIntelligenceService(test_db)
        
        end_date = datetime.now()
        start_date = end_date - timedelta(days=90)
        
        performances = await service.analyze_category_performance(
            start_date=start_date,
            end_date=end_date,
            min_transactions=1
        )
        
        # Verify results
        assert len(performances) > 0, "Should find category performances"
        
        for perf in performances:
            assert perf.category_id is not None
            assert perf.category_name is not None
            assert perf.total_revenue >= 0
            assert perf.total_quantity_sold >= 0
            assert perf.velocity_score >= 0
            assert perf.performance_tier in ['fast', 'medium', 'slow', 'dead']
            assert perf.contribution_percentage >= 0
            assert perf.trend_direction in ['up', 'down', 'stable']
            assert perf.trend_percentage >= 0
        
        # Verify sorting by velocity score
        for i in range(len(performances) - 1):
            assert performances[i].velocity_score >= performances[i + 1].velocity_score
        
        # Verify contribution percentages sum to ~100%
        total_contribution = sum(p.contribution_percentage for p in performances)
        assert 99 <= total_contribution <= 101, f"Contributions should sum to ~100%, got {total_contribution}"
    
    @pytest.mark.asyncio
    async def test_performance_tiers(self, test_db: Session, test_data):
        """Test that performance tiers are correctly assigned"""
        service = CategoryIntelligenceService(test_db)
        
        end_date = datetime.now()
        start_date = end_date - timedelta(days=180)
        
        performances = await service.analyze_category_performance(
            start_date=start_date,
            end_date=end_date
        )
        
        # Should have different performance tiers
        tiers = set(p.performance_tier for p in performances)
        assert len(tiers) > 1, "Should have multiple performance tiers"
        
        # Fast movers should have higher velocity scores than slow movers
        fast_movers = [p for p in performances if p.performance_tier == 'fast']
        slow_movers = [p for p in performances if p.performance_tier == 'slow']
        
        if fast_movers and slow_movers:
            min_fast_velocity = min(p.velocity_score for p in fast_movers)
            max_slow_velocity = max(p.velocity_score for p in slow_movers)
            assert min_fast_velocity > max_slow_velocity, "Fast movers should have higher velocity than slow movers"


class TestSeasonalAnalysis:
    """Test seasonal pattern analysis functionality"""
    
    @pytest.mark.asyncio
    async def test_analyze_seasonal_patterns(self, test_db: Session, test_data):
        """Test seasonal pattern analysis"""
        service = CategoryIntelligenceService(test_db)
        
        patterns = await service.analyze_seasonal_patterns(months_back=24)
        
        # Verify results
        assert len(patterns) > 0, "Should find seasonal patterns"
        
        for pattern in patterns:
            assert pattern.category_id is not None
            assert pattern.category_name is not None
            assert len(pattern.seasonal_index) == 12, "Should have index for all 12 months"
            assert 0 <= pattern.seasonality_strength <= 1, "Seasonality strength should be 0-1"
            assert pattern.forecast_next_month >= 0, "Forecast should be non-negative"
            assert len(pattern.confidence_interval) == 2, "Should have confidence interval bounds"
            assert pattern.confidence_interval[0] <= pattern.confidence_interval[1], "CI bounds should be ordered"
            
            # Verify seasonal indices are reasonable
            for month, index in pattern.seasonal_index.items():
                assert index > 0, f"Seasonal index should be positive for month {month}"
                assert index < 10, f"Seasonal index should be reasonable for month {month}"
    
    @pytest.mark.asyncio
    async def test_seasonal_peak_detection(self, test_db: Session, test_data):
        """Test that seasonal peaks are correctly identified"""
        service = CategoryIntelligenceService(test_db)
        
        patterns = await service.analyze_seasonal_patterns(months_back=24)
        
        # Find patterns with high seasonality
        seasonal_patterns = [p for p in patterns if p.seasonality_strength > 0.3]
        
        for pattern in seasonal_patterns:
            # Should have identified some peak or low months
            assert len(pattern.peak_months) > 0 or len(pattern.low_months) > 0, \
                f"Seasonal category {pattern.category_name} should have peaks or lows"
            
            # Peak months should have higher seasonal indices
            for peak_month in pattern.peak_months:
                peak_index = pattern.seasonal_index[peak_month]
                assert peak_index > 1.2, f"Peak month {peak_month} should have high seasonal index"
            
            # Low months should have lower seasonal indices
            for low_month in pattern.low_months:
                low_index = pattern.seasonal_index[low_month]
                assert low_index < 0.8, f"Low month {low_month} should have low seasonal index"


class TestCrossSellingAnalysis:
    """Test cross-selling opportunity identification"""
    
    @pytest.mark.asyncio
    async def test_identify_cross_selling_opportunities(self, test_db: Session, test_data):
        """Test cross-selling opportunity identification"""
        service = CategoryIntelligenceService(test_db)
        
        end_date = datetime.now()
        start_date = end_date - timedelta(days=180)
        
        opportunities = await service.identify_cross_selling_opportunities(
            start_date=start_date,
            end_date=end_date,
            min_support=0.01,
            min_confidence=0.1
        )
        
        # Verify results
        assert len(opportunities) > 0, "Should find cross-selling opportunities"
        
        for opp in opportunities:
            assert opp.primary_category_id is not None
            assert opp.primary_category_name is not None
            assert opp.recommended_category_id is not None
            assert opp.recommended_category_name is not None
            assert opp.primary_category_id != opp.recommended_category_id, "Should recommend different category"
            assert 0 <= opp.confidence_score <= 1, "Confidence should be 0-1"
            assert opp.lift_ratio > 0, "Lift ratio should be positive"
            assert 0 <= opp.support <= 1, "Support should be 0-1"
            assert opp.expected_revenue_increase >= 0, "Expected revenue should be non-negative"
        
        # Verify sorting by confidence * lift
        for i in range(len(opportunities) - 1):
            current_score = opportunities[i].confidence_score * opportunities[i].lift_ratio
            next_score = opportunities[i + 1].confidence_score * opportunities[i + 1].lift_ratio
            assert current_score >= next_score, "Should be sorted by confidence * lift"
    
    @pytest.mark.asyncio
    async def test_cross_selling_patterns(self, test_db: Session, test_data):
        """Test that known cross-selling patterns are detected"""
        service = CategoryIntelligenceService(test_db)
        
        end_date = datetime.now()
        start_date = end_date - timedelta(days=365)
        
        opportunities = await service.identify_cross_selling_opportunities(
            start_date=start_date,
            end_date=end_date,
            min_support=0.005,
            min_confidence=0.05
        )
        
        # Look for expected patterns (based on test data creation)
        expected_patterns = [
            ("Gold Rings", "Diamonds"),
            ("Gold Rings", "Gold Necklaces"),
            ("Gold Necklaces", "Earrings"),
            ("Diamonds", "Gold Rings")
        ]
        
        found_patterns = set()
        for opp in opportunities:
            pattern = (opp.primary_category_name, opp.recommended_category_name)
            found_patterns.add(pattern)
        
        # Should find at least some expected patterns
        expected_found = [pattern for pattern in expected_patterns if pattern in found_patterns]
        assert len(expected_found) > 0, f"Should find some expected patterns. Found: {found_patterns}"


class TestCategoryIntelligenceAPI:
    """Test Category Intelligence API endpoints"""
    
    def test_get_category_performance_endpoint(self, client: TestClient, test_data):
        """Test category performance API endpoint"""
        response = client.get("/api/category-intelligence/performance")
        
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        assert len(data) > 0
        
        for item in data:
            assert "category_id" in item
            assert "category_name" in item
            assert "total_revenue" in item
            assert "performance_tier" in item
            assert "velocity_score" in item
            assert item["performance_tier"] in ["fast", "medium", "slow", "dead"]
    
    def test_get_seasonal_patterns_endpoint(self, client: TestClient, test_data):
        """Test seasonal patterns API endpoint"""
        response = client.get("/api/category-intelligence/seasonal-patterns")
        
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        
        for item in data:
            assert "category_id" in item
            assert "category_name" in item
            assert "seasonal_index" in item
            assert "seasonality_strength" in item
            assert "forecast_next_month" in item
            assert len(item["seasonal_index"]) == 12
    
    def test_get_cross_selling_opportunities_endpoint(self, client: TestClient, test_data):
        """Test cross-selling opportunities API endpoint"""
        response = client.get("/api/category-intelligence/cross-selling")
        
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        
        for item in data:
            assert "primary_category_id" in item
            assert "primary_category_name" in item
            assert "recommended_category_id" in item
            assert "recommended_category_name" in item
            assert "confidence_score" in item
            assert "lift_ratio" in item
            assert "support" in item
            assert "expected_revenue_increase" in item
    
    def test_get_category_insights_summary_endpoint(self, client: TestClient, test_data):
        """Test category insights summary API endpoint"""
        response = client.get("/api/category-intelligence/insights/summary")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "performance_summary" in data
        assert "seasonal_insights" in data
        assert "cross_selling_insights" in data
        
        perf_summary = data["performance_summary"]
        assert "total_categories_analyzed" in perf_summary
        assert "fast_movers" in perf_summary
        assert "slow_movers" in perf_summary
        assert "top_performers" in perf_summary
        
        seasonal_insights = data["seasonal_insights"]
        assert "highly_seasonal_categories" in seasonal_insights
        assert "categories_with_patterns" in seasonal_insights
        
        cross_selling_insights = data["cross_selling_insights"]
        assert "total_opportunities" in cross_selling_insights
        assert "high_confidence_opportunities" in cross_selling_insights
    
    def test_api_error_handling(self, client: TestClient):
        """Test API error handling"""
        # Test with invalid date format
        response = client.get("/api/category-intelligence/performance?start_date=invalid-date")
        assert response.status_code == 422  # Validation error
        
        # Test with non-existent category
        response = client.get("/api/category-intelligence/performance/non-existent-id")
        assert response.status_code == 404


class TestCategoryIntelligencePerformance:
    """Test performance characteristics of category intelligence"""
    
    @pytest.mark.asyncio
    async def test_performance_with_large_dataset(self, test_db: Session, test_data):
        """Test performance with realistic data volumes"""
        service = CategoryIntelligenceService(test_db)
        
        import time
        
        # Test category performance analysis
        start_time = time.time()
        performances = await service.analyze_category_performance(
            start_date=datetime.now() - timedelta(days=90),
            end_date=datetime.now()
        )
        perf_time = time.time() - start_time
        
        assert perf_time < 5.0, f"Performance analysis took too long: {perf_time}s"
        assert len(performances) > 0
        
        # Test seasonal analysis
        start_time = time.time()
        patterns = await service.analyze_seasonal_patterns(months_back=24)
        seasonal_time = time.time() - start_time
        
        assert seasonal_time < 10.0, f"Seasonal analysis took too long: {seasonal_time}s"
        
        # Test cross-selling analysis
        start_time = time.time()
        opportunities = await service.identify_cross_selling_opportunities(
            start_date=datetime.now() - timedelta(days=180),
            end_date=datetime.now()
        )
        cross_sell_time = time.time() - start_time
        
        assert cross_sell_time < 15.0, f"Cross-selling analysis took too long: {cross_sell_time}s"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])