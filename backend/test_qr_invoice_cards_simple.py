"""
Simple QR Invoice Cards Test
Quick verification that the QR card system works end-to-end
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from uuid import uuid4
from decimal import Decimal

from main import app
from database import get_db, engine
from auth import create_access_token
import models
import models_universal as universal_models
from services.qr_invoice_card_service import QRInvoiceCardService

client = TestClient(app)

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

def test_qr_card_end_to_end(db_session):
    """Test complete QR card workflow from creation to access"""
    
    # Create test user
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
    
    # Create test category
    category = universal_models.UniversalCategory(
        id=uuid4(),
        name=f"Test Category {unique_id}",
        path=f"test_category_{unique_id}",
        level=0,
        created_by=user.id
    )
    db_session.add(category)
    db_session.commit()
    
    # Create test inventory item
    item = universal_models.UniversalInventoryItem(
        id=uuid4(),
        sku=f"TEST-{unique_id}",
        name=f"Test Item {unique_id}",
        category_id=category.id,
        cost_price=Decimal("50.00"),
        sale_price=Decimal("100.00"),
        stock_quantity=Decimal("10"),
        created_by=user.id
    )
    db_session.add(item)
    db_session.commit()
    
    # Override database dependency
    app.dependency_overrides[get_db] = lambda: db_session
    
    # Create auth headers
    token = create_access_token(data={"sub": str(user.id)})
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Create invoice via API (should automatically create QR card)
    invoice_data = {
        "type": "general",
        "customer_name": "Test Customer",
        "items": [
            {
                "inventory_item_id": str(item.id),
                "item_name": item.name,
                "quantity": 1,
                "unit_price": 100.00
            }
        ],
        "card_theme": "glass"
    }
    
    response = client.post("/universal-invoices/", json=invoice_data, headers=headers)
    assert response.status_code == 200
    invoice_response = response.json()
    
    # Verify QR card was created
    assert invoice_response["qr_code"] is not None
    assert invoice_response["card_url"] is not None
    
    # 2. Get QR card details via API
    service = QRInvoiceCardService(db_session)
    qr_card = service.get_qr_card_by_invoice(invoice_response["id"])
    assert qr_card is not None
    assert qr_card.theme == "glass"
    
    # 3. Test QR card access
    access_granted, error = service.verify_card_access(qr_card.id)
    assert access_granted is True
    assert error is None
    
    # 4. Test QR card analytics
    analytics = service.get_card_analytics(qr_card.id)
    assert analytics["total_views"] >= 1
    assert analytics["card_id"] == str(qr_card.id)
    
    # 5. Test public card access (HTML)
    response = client.get(f"/qr-cards/card/{qr_card.id}")
    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]
    assert invoice_response["invoice_number"] in response.text
    assert "Test Customer" in response.text
    
    # 6. Test QR code image generation
    response = client.get(f"/qr-cards/{qr_card.id}/qr-image", headers=headers)
    assert response.status_code == 200
    assert response.headers["content-type"] == "image/png"
    
    # 7. Test card themes endpoint
    response = client.get("/qr-cards/themes/available", headers=headers)
    assert response.status_code == 200
    themes_data = response.json()
    assert "themes" in themes_data
    assert len(themes_data["themes"]) > 0
    
    print("✅ QR Invoice Cards system working correctly!")
    print(f"✅ Created QR card for invoice {invoice_response['invoice_number']}")
    print(f"✅ Card URL: {qr_card.card_url}")
    print(f"✅ Theme: {qr_card.theme}")
    print(f"✅ Total views: {analytics['total_views']}")

def test_gold_invoice_qr_card(db_session):
    """Test QR card creation for gold invoice with specialized fields"""
    
    # Create test user
    unique_id = str(uuid4())[:8]
    user = models.User(
        id=uuid4(),
        username=f"golduser_{unique_id}",
        email=f"gold_{unique_id}@example.com",
        password_hash="hashed_password",
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    
    # Create test category
    category = universal_models.UniversalCategory(
        id=uuid4(),
        name=f"Gold Category {unique_id}",
        path=f"gold_category_{unique_id}",
        level=0,
        created_by=user.id
    )
    db_session.add(category)
    db_session.commit()
    
    # Create test gold item
    item = universal_models.UniversalInventoryItem(
        id=uuid4(),
        sku=f"GOLD-{unique_id}",
        name=f"Gold Ring {unique_id}",
        category_id=category.id,
        cost_price=Decimal("400.00"),
        sale_price=Decimal("600.00"),
        stock_quantity=Decimal("5"),
        weight_grams=Decimal("10.000"),
        created_by=user.id
    )
    db_session.add(item)
    db_session.commit()
    
    # Override database dependency
    app.dependency_overrides[get_db] = lambda: db_session
    
    # Create auth headers
    token = create_access_token(data={"sub": str(user.id)})
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create gold invoice
    invoice_data = {
        "type": "gold",
        "customer_name": "Gold Customer",
        "items": [
            {
                "inventory_item_id": str(item.id),
                "item_name": item.name,
                "quantity": 1,
                "unit_price": 650.00,
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
    
    response = client.post("/universal-invoices/", json=invoice_data, headers=headers)
    assert response.status_code == 200
    invoice_response = response.json()
    
    # Get QR card and verify gold fields
    service = QRInvoiceCardService(db_session)
    qr_card = service.get_qr_card_by_invoice(invoice_response["id"])
    assert qr_card is not None
    assert qr_card.theme == "gold"
    
    # Verify gold-specific fields in card data
    card_data = qr_card.card_data
    assert card_data["invoice_type"] == "gold"
    assert "gold_fields" in card_data
    
    gold_fields = card_data["gold_fields"]
    assert gold_fields["gold_price_per_gram"] == 50.00
    assert "gold_sood" in gold_fields
    assert "gold_ojrat" in gold_fields
    assert "gold_maliyat" in gold_fields
    
    # Test public card access shows gold fields
    response = client.get(f"/qr-cards/card/{qr_card.id}")
    assert response.status_code == 200
    assert "سود" in response.text  # Arabic/Persian text for profit
    assert "اجرت" in response.text  # Arabic/Persian text for labor
    assert "مالیات" in response.text  # Arabic/Persian text for tax
    
    print("✅ Gold Invoice QR Cards working correctly!")
    print(f"✅ Created gold QR card for invoice {invoice_response['invoice_number']}")
    print(f"✅ Gold fields included: سود, اجرت, مالیات")
    print(f"✅ Total weight: {gold_fields.get('gold_total_weight', 0):.3f}g")

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])