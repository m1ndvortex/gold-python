"""
Comprehensive Tests for QR Invoice Cards Backend Service
Tests all QR card functionality using real PostgreSQL database in Docker
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from uuid import uuid4
from decimal import Decimal
import json

from main import app
from database import get_db, engine
from auth import create_access_token
import models
import models_universal as universal_models
import schemas_universal as schemas
from services.qr_invoice_card_service import QRInvoiceCardService

client = TestClient(app)

# Test fixtures
@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database session for each test"""
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection)
    
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()

@pytest.fixture
def test_user(db_session):
    """Create a test user"""
    unique_id = str(uuid4())[:8]
    user = models.User(
        id=uuid4(),
        username=f"testuser_{unique_id}",
        email=f"test_{unique_id}@example.com",
        password_hash="hashed_password",
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    return user

@pytest.fixture
def auth_headers(test_user):
    """Create authentication headers"""
    token = create_access_token(data={"sub": str(test_user.id)})
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def test_category(db_session, test_user):
    """Create a test category"""
    unique_id = str(uuid4())[:8]
    category = universal_models.UniversalCategory(
        id=uuid4(),
        name=f"Test Category {unique_id}",
        path=f"test_category_{unique_id}",
        level=0,
        created_by=test_user.id
    )
    db_session.add(category)
    db_session.commit()
    return category

@pytest.fixture
def test_inventory_item(db_session, test_user, test_category):
    """Create a test inventory item"""
    unique_id = str(uuid4())[:8]
    item = universal_models.UniversalInventoryItem(
        id=uuid4(),
        sku=f"TEST-{unique_id}",
        name=f"Test Item {unique_id}",
        category_id=test_category.id,
        cost_price=Decimal("50.00"),
        sale_price=Decimal("100.00"),
        stock_quantity=Decimal("10"),
        created_by=test_user.id
    )
    db_session.add(item)
    db_session.commit()
    return item

@pytest.fixture
def test_invoice(db_session, test_user, test_inventory_item):
    """Create a test invoice"""
    unique_id = str(uuid4())[:8]
    invoice = universal_models.UniversalInvoice(
        id=uuid4(),
        invoice_number=f"INV-TEST-{unique_id}",
        type="general",
        status="approved",
        workflow_stage="approved",
        customer_name="Test Customer",
        customer_phone="123-456-7890",
        subtotal=Decimal("100.00"),
        total_amount=Decimal("100.00"),
        remaining_amount=Decimal("100.00"),
        created_by=test_user.id
    )
    db_session.add(invoice)
    db_session.flush()
    
    # Add invoice item
    invoice_item = universal_models.UniversalInvoiceItem(
        id=uuid4(),
        invoice_id=invoice.id,
        inventory_item_id=test_inventory_item.id,
        item_name=test_inventory_item.name,
        item_sku=test_inventory_item.sku,
        quantity=Decimal("1"),
        unit_price=Decimal("100.00"),
        total_price=Decimal("100.00")
    )
    db_session.add(invoice_item)
    db_session.commit()
    return invoice

@pytest.fixture
def test_gold_invoice(db_session, test_user, test_inventory_item):
    """Create a test gold invoice"""
    unique_id = str(uuid4())[:8]
    invoice = universal_models.UniversalInvoice(
        id=uuid4(),
        invoice_number=f"GOLD-TEST-{unique_id}",
        type="gold",
        status="approved",
        workflow_stage="approved",
        customer_name="Gold Customer",
        customer_phone="123-456-7890",
        subtotal=Decimal("500.00"),
        total_amount=Decimal("650.00"),
        remaining_amount=Decimal("650.00"),
        gold_price_per_gram=Decimal("50.00"),
        labor_cost_percentage=Decimal("10.00"),
        profit_percentage=Decimal("15.00"),
        vat_percentage=Decimal("5.00"),
        gold_sood=Decimal("75.00"),
        gold_ojrat=Decimal("50.00"),
        gold_maliyat=Decimal("25.00"),
        gold_total_weight=Decimal("10.000"),
        created_by=test_user.id
    )
    db_session.add(invoice)
    db_session.flush()
    
    # Add gold invoice item
    invoice_item = universal_models.UniversalInvoiceItem(
        id=uuid4(),
        invoice_id=invoice.id,
        inventory_item_id=test_inventory_item.id,
        item_name="Gold Ring",
        item_sku=f"GOLD-{unique_id}",
        quantity=Decimal("1"),
        unit_price=Decimal("650.00"),
        total_price=Decimal("650.00"),
        weight_grams=Decimal("10.000"),
        gold_specific={"purity": "18K", "design": "Classic"}
    )
    db_session.add(invoice_item)
    db_session.commit()
    return invoice

class TestQRInvoiceCardService:
    """Test QR Invoice Card Service functionality"""
    
    def test_create_qr_card_general_invoice(self, db_session, test_invoice, test_user):
        """Test creating QR card for general invoice"""
        service = QRInvoiceCardService(db_session)
        
        qr_card = service.create_qr_card(
            invoice_id=test_invoice.id,
            theme="glass",
            created_by=test_user.id
        )
        
        assert qr_card is not None
        assert qr_card.invoice_id == test_invoice.id
        assert qr_card.theme == "glass"
        assert qr_card.is_public is True
        assert qr_card.is_active is True
        assert qr_card.qr_code is not None
        assert qr_card.card_url is not None
        assert qr_card.short_url is not None
        
        # Verify card data
        card_data = qr_card.card_data
        assert card_data["invoice_number"] == test_invoice.invoice_number
        assert card_data["invoice_type"] == "general"
        assert card_data["customer_info"]["name"] == test_invoice.customer_name
        assert len(card_data["items"]) == 1
        assert card_data["amounts"]["total_amount"] == float(test_invoice.total_amount)
    
    def test_create_qr_card_gold_invoice(self, db_session, test_gold_invoice, test_user):
        """Test creating QR card for gold invoice with specialized fields"""
        service = QRInvoiceCardService(db_session)
        
        qr_card = service.create_qr_card(
            invoice_id=test_gold_invoice.id,
            theme="gold",
            created_by=test_user.id
        )
        
        assert qr_card is not None
        assert qr_card.theme == "gold"
        
        # Verify gold-specific fields in card data
        card_data = qr_card.card_data
        assert card_data["invoice_type"] == "gold"
        assert "gold_fields" in card_data
        
        gold_fields = card_data["gold_fields"]
        assert gold_fields["gold_sood"] == float(test_gold_invoice.gold_sood)
        assert gold_fields["gold_ojrat"] == float(test_gold_invoice.gold_ojrat)
        assert gold_fields["gold_maliyat"] == float(test_gold_invoice.gold_maliyat)
        assert gold_fields["gold_total_weight"] == float(test_gold_invoice.gold_total_weight)
    
    def test_create_qr_card_with_password(self, db_session, test_invoice, test_user):
        """Test creating password-protected QR card"""
        service = QRInvoiceCardService(db_session)
        
        qr_card = service.create_qr_card(
            invoice_id=test_invoice.id,
            requires_password=True,
            access_password="secret123",
            created_by=test_user.id
        )
        
        assert qr_card.requires_password is True
        assert qr_card.access_password is not None
        assert qr_card.access_password != "secret123"  # Should be hashed
    
    def test_create_qr_card_with_expiration(self, db_session, test_invoice, test_user):
        """Test creating QR card with expiration date"""
        service = QRInvoiceCardService(db_session)
        expires_at = datetime.now() + timedelta(days=30)
        
        qr_card = service.create_qr_card(
            invoice_id=test_invoice.id,
            expires_at=expires_at,
            created_by=test_user.id
        )
        
        assert qr_card.expires_at is not None
        assert qr_card.expires_at.date() == expires_at.date()
    
    def test_verify_card_access_success(self, db_session, test_invoice, test_user):
        """Test successful card access verification"""
        service = QRInvoiceCardService(db_session)
        
        qr_card = service.create_qr_card(
            invoice_id=test_invoice.id,
            created_by=test_user.id
        )
        
        access_granted, error_message = service.verify_card_access(
            qr_card.id,
            ip_address="192.168.1.1",
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        )
        
        assert access_granted is True
        assert error_message is None
        
        # Verify view count increased
        db_session.refresh(qr_card)
        assert qr_card.view_count == 1
        assert qr_card.last_viewed_at is not None
    
    def test_verify_card_access_with_password(self, db_session, test_invoice, test_user):
        """Test card access with password verification"""
        service = QRInvoiceCardService(db_session)
        
        qr_card = service.create_qr_card(
            invoice_id=test_invoice.id,
            requires_password=True,
            access_password="secret123",
            created_by=test_user.id
        )
        
        # Test with correct password
        access_granted, error_message = service.verify_card_access(
            qr_card.id,
            password="secret123"
        )
        assert access_granted is True
        assert error_message is None
        
        # Test with incorrect password
        access_granted, error_message = service.verify_card_access(
            qr_card.id,
            password="wrong_password"
        )
        assert access_granted is False
        assert "Invalid password" in error_message
    
    def test_verify_card_access_expired(self, db_session, test_invoice, test_user):
        """Test access to expired card"""
        service = QRInvoiceCardService(db_session)
        
        # Create card that expires in the past
        expires_at = datetime.now() - timedelta(days=1)
        qr_card = service.create_qr_card(
            invoice_id=test_invoice.id,
            expires_at=expires_at,
            created_by=test_user.id
        )
        
        access_granted, error_message = service.verify_card_access(qr_card.id)
        assert access_granted is False
        assert "expired" in error_message.lower()
    
    def test_get_card_analytics(self, db_session, test_invoice, test_user):
        """Test getting card analytics"""
        service = QRInvoiceCardService(db_session)
        
        qr_card = service.create_qr_card(
            invoice_id=test_invoice.id,
            created_by=test_user.id
        )
        
        # Simulate some access
        service.verify_card_access(qr_card.id, ip_address="192.168.1.1")
        service.verify_card_access(qr_card.id, ip_address="192.168.1.2")
        service.verify_card_access(qr_card.id, ip_address="192.168.1.1")  # Same IP
        
        analytics = service.get_card_analytics(qr_card.id)
        
        assert analytics["total_views"] == 3
        assert analytics["unique_visitors"] == 2
        assert analytics["card_id"] == str(qr_card.id)
        assert analytics["is_active"] is True
        assert "device_breakdown" in analytics
        assert "browser_breakdown" in analytics
    
    def test_list_qr_cards_with_filters(self, db_session, test_invoice, test_gold_invoice, test_user):
        """Test listing QR cards with various filters"""
        service = QRInvoiceCardService(db_session)
        
        # Create cards for both invoices
        general_card = service.create_qr_card(
            invoice_id=test_invoice.id,
            theme="modern",
            created_by=test_user.id
        )
        
        gold_card = service.create_qr_card(
            invoice_id=test_gold_invoice.id,
            theme="gold",
            created_by=test_user.id
        )
        
        # Test filtering by invoice type
        cards, total = service.list_qr_cards(invoice_type="gold")
        assert total == 1
        assert cards[0].id == gold_card.id
        
        # Test filtering by theme
        cards, total = service.list_qr_cards(theme="modern")
        assert total == 1
        assert cards[0].id == general_card.id
        
        # Test no filters (should return all)
        cards, total = service.list_qr_cards()
        assert total == 2
    
    def test_update_qr_card(self, db_session, test_invoice, test_user):
        """Test updating QR card configuration"""
        service = QRInvoiceCardService(db_session)
        
        qr_card = service.create_qr_card(
            invoice_id=test_invoice.id,
            theme="glass",
            created_by=test_user.id
        )
        
        # Update card
        updates = schemas.QRInvoiceCardUpdate(
            theme="modern",
            background_color="#f0f0f0",
            accent_color="#ff6b6b"
        )
        
        updated_card = service.update_qr_card(qr_card.id, updates)
        
        assert updated_card.theme == "modern"
        assert updated_card.background_color == "#f0f0f0"
        assert updated_card.accent_color == "#ff6b6b"
    
    def test_regenerate_qr_card(self, db_session, test_invoice, test_user):
        """Test regenerating QR card with new identifiers"""
        service = QRInvoiceCardService(db_session)
        
        original_card = service.create_qr_card(
            invoice_id=test_invoice.id,
            created_by=test_user.id
        )
        
        original_qr_code = original_card.qr_code
        original_card_url = original_card.card_url
        
        # Regenerate card
        regenerated_card = service.regenerate_qr_card(original_card.id)
        
        assert regenerated_card.qr_code != original_qr_code
        assert regenerated_card.card_url != original_card_url
        assert regenerated_card.view_count == 0
        assert regenerated_card.last_viewed_at is None
    
    def test_delete_qr_card(self, db_session, test_invoice, test_user):
        """Test deleting QR card"""
        service = QRInvoiceCardService(db_session)
        
        qr_card = service.create_qr_card(
            invoice_id=test_invoice.id,
            created_by=test_user.id
        )
        
        # Add some access logs
        service.verify_card_access(qr_card.id)
        
        # Delete card
        success = service.delete_qr_card(qr_card.id)
        assert success is True
        
        # Verify card is deleted
        deleted_card = service.get_qr_card_by_id(qr_card.id)
        assert deleted_card is None
        
        # Verify access logs are deleted
        access_logs = db_session.query(universal_models.QRCardAccessLog).filter(
            universal_models.QRCardAccessLog.card_id == qr_card.id
        ).all()
        assert len(access_logs) == 0
    
    def test_get_card_themes(self, db_session):
        """Test getting available card themes"""
        service = QRInvoiceCardService(db_session)
        themes = service.get_card_themes()
        
        assert len(themes) > 0
        assert any(theme["name"] == "glass" for theme in themes)
        assert any(theme["name"] == "gold" for theme in themes)
        
        # Verify theme structure
        for theme in themes:
            assert "name" in theme
            assert "display_name" in theme
            assert "description" in theme
            assert "preview_colors" in theme

class TestQRInvoiceCardsAPI:
    """Test QR Invoice Cards API endpoints"""
    
    def test_create_qr_card_endpoint(self, db_session, test_invoice, auth_headers):
        """Test creating QR card via API"""
        app.dependency_overrides[get_db] = lambda: db_session
        
        card_data = {
            "theme": "glass",
            "background_color": "#ffffff",
            "text_color": "#000000",
            "accent_color": "#3B82F6",
            "is_public": True
        }
        
        response = client.post(
            f"/qr-cards/?invoice_id={test_invoice.id}",
            json=card_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["theme"] == "glass"
        assert data["invoice_id"] == str(test_invoice.id)
        assert data["is_public"] is True
    
    def test_get_qr_card_endpoint(self, db_session, test_invoice, auth_headers):
        """Test getting QR card via API"""
        app.dependency_overrides[get_db] = lambda: db_session
        
        # Create card first
        service = QRInvoiceCardService(db_session)
        qr_card = service.create_qr_card(invoice_id=test_invoice.id)
        
        response = client.get(
            f"/qr-cards/{qr_card.id}",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(qr_card.id)
        assert data["invoice_id"] == str(test_invoice.id)
    
    def test_list_qr_cards_endpoint(self, db_session, test_invoice, auth_headers):
        """Test listing QR cards via API"""
        app.dependency_overrides[get_db] = lambda: db_session
        
        # Create some cards
        service = QRInvoiceCardService(db_session)
        service.create_qr_card(invoice_id=test_invoice.id, theme="glass")
        service.create_qr_card(invoice_id=test_invoice.id, theme="modern")
        
        response = client.get("/qr-cards/", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 2
        assert len(data["items"]) >= 2
    
    def test_get_qr_code_image_endpoint(self, db_session, test_invoice, auth_headers):
        """Test getting QR code image via API"""
        app.dependency_overrides[get_db] = lambda: db_session
        
        # Create card first
        service = QRInvoiceCardService(db_session)
        qr_card = service.create_qr_card(invoice_id=test_invoice.id)
        
        response = client.get(
            f"/qr-cards/{qr_card.id}/qr-image?size=200",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        assert response.headers["content-type"] == "image/png"
    
    def test_get_card_analytics_endpoint(self, db_session, test_invoice, auth_headers):
        """Test getting card analytics via API"""
        app.dependency_overrides[get_db] = lambda: db_session
        
        # Create card and simulate access
        service = QRInvoiceCardService(db_session)
        qr_card = service.create_qr_card(invoice_id=test_invoice.id)
        service.verify_card_access(qr_card.id)
        
        response = client.get(
            f"/qr-cards/{qr_card.id}/analytics",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["total_views"] >= 1
        assert "device_breakdown" in data
    
    def test_get_available_themes_endpoint(self, db_session, auth_headers):
        """Test getting available themes via API"""
        app.dependency_overrides[get_db] = lambda: db_session
        
        response = client.get("/qr-cards/themes/available", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "themes" in data
        assert len(data["themes"]) > 0
    
    def test_public_card_access_endpoint(self, db_session, test_invoice):
        """Test public card access without authentication"""
        app.dependency_overrides[get_db] = lambda: db_session
        
        # Create public card
        service = QRInvoiceCardService(db_session)
        qr_card = service.create_qr_card(
            invoice_id=test_invoice.id,
            is_public=True
        )
        
        response = client.get(f"/qr-cards/card/{qr_card.id}")
        
        assert response.status_code == 200
        assert "text/html" in response.headers["content-type"]
        assert test_invoice.invoice_number in response.text
    
    def test_public_card_access_with_password(self, db_session, test_invoice):
        """Test public card access with password protection"""
        app.dependency_overrides[get_db] = lambda: db_session
        
        # Create password-protected card
        service = QRInvoiceCardService(db_session)
        qr_card = service.create_qr_card(
            invoice_id=test_invoice.id,
            is_public=True,
            requires_password=True,
            access_password="secret123"
        )
        
        # Test without password (should show password prompt)
        response = client.get(f"/qr-cards/card/{qr_card.id}")
        assert response.status_code == 200
        assert "password" in response.text.lower()
        
        # Test with correct password
        response = client.get(f"/qr-cards/card/{qr_card.id}?password=secret123")
        assert response.status_code == 200
        assert test_invoice.invoice_number in response.text
        
        # Test with incorrect password
        response = client.get(f"/qr-cards/card/{qr_card.id}?password=wrong")
        assert response.status_code == 403

class TestQRCardIntegration:
    """Test QR card integration with invoice system"""
    
    def test_qr_card_created_with_invoice(self, db_session, test_user, test_inventory_item, auth_headers):
        """Test that QR card is automatically created when invoice is created"""
        app.dependency_overrides[get_db] = lambda: db_session
        
        invoice_data = {
            "type": "general",
            "customer_name": "Test Customer",
            "items": [
                {
                    "inventory_item_id": str(test_inventory_item.id),
                    "item_name": test_inventory_item.name,
                    "quantity": 1,
                    "unit_price": 100.00
                }
            ],
            "card_theme": "modern"
        }
        
        response = client.post(
            "/universal-invoices/",
            json=invoice_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        invoice_data = response.json()
        
        # Verify QR card was created
        assert invoice_data["qr_code"] is not None
        assert invoice_data["card_url"] is not None
        
        # Verify card exists in database
        service = QRInvoiceCardService(db_session)
        qr_card = service.get_qr_card_by_invoice(invoice_data["id"])
        assert qr_card is not None
        assert qr_card.theme == "modern"
    
    def test_gold_invoice_qr_card_fields(self, db_session, test_user, test_inventory_item, auth_headers):
        """Test that gold invoice QR cards include gold-specific fields"""
        app.dependency_overrides[get_db] = lambda: db_session
        
        invoice_data = {
            "type": "gold",
            "customer_name": "Gold Customer",
            "items": [
                {
                    "inventory_item_id": str(test_inventory_item.id),
                    "item_name": "Gold Ring",
                    "quantity": 1,
                    "unit_price": 500.00,
                    "weight_grams": 10.0
                }
            ],
            "gold_fields": {
                "gold_price_per_gram": 50.00,
                "labor_cost_percentage": 10.00,
                "profit_percentage": 15.00,
                "vat_percentage": 5.00
            },
            "card_theme": "gold"
        }
        
        response = client.post(
            "/universal-invoices/",
            json=invoice_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        invoice_response = response.json()
        
        # Get QR card and verify gold fields
        service = QRInvoiceCardService(db_session)
        qr_card = service.get_qr_card_by_invoice(invoice_response["id"])
        
        assert qr_card is not None
        card_data = qr_card.card_data
        assert card_data["invoice_type"] == "gold"
        assert "gold_fields" in card_data
        
        gold_fields = card_data["gold_fields"]
        assert gold_fields["gold_price_per_gram"] == 50.00
        assert "gold_sood" in gold_fields
        assert "gold_ojrat" in gold_fields
        assert "gold_maliyat" in gold_fields

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])