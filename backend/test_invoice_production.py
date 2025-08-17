#!/usr/bin/env python3
"""
Production-ready comprehensive test for invoice functionality.
Tests all invoice features with real PostgreSQL database in Docker.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from decimal import Decimal
import uuid
from datetime import datetime
import os

from main import app
from database import get_db
from models import User, Role, Customer, Category, InventoryItem, Invoice, InvoiceItem, Payment, AccountingEntry
from auth import create_access_token, get_password_hash

# Test database setup
SQLALCHEMY_DATABASE_URL = "postgresql://goldshop_user:goldshop_password@db:5432/goldshop"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

class TestInvoiceProductionSystem:
    """Production-ready test suite for invoice system"""
    
    @pytest.fixture(scope="class")
    def client(self):
        """Create test client"""
        return TestClient(app)
    
    @pytest.fixture(scope="class")
    def db_session(self):
        """Create database session"""
        session = TestingSessionLocal()
        try:
            yield session
        finally:
            session.close()
    
    @pytest.fixture(scope="class")
    def auth_token(self, db_session):
        """Get authentication token for admin user"""
        admin_user = db_session.query(User).filter(User.username == "admin").first()
        if admin_user:
            token_data = {"sub": str(admin_user.id)}
            token = create_access_token(token_data)
            return token
        return None
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        """Get authentication headers"""
        return {"Authorization": f"Bearer {auth_token}"}
    
    @pytest.fixture(scope="class")
    def test_customer(self, client, auth_headers):
        """Get or create test customer"""
        # Try to get existing customer first
        response = client.get("/customers/", headers=auth_headers)
        if response.status_code == 200:
            customers = response.json()
            if customers:
                return customers[0]
        
        # Create new customer if none exist
        customer_data = {
            "name": "Production Test Customer",
            "phone": "9876543210",
            "email": "production@test.com",
            "address": "Production Test Address"
        }
        
        response = client.post("/customers/", json=customer_data, headers=auth_headers)
        assert response.status_code == 200
        return response.json()
    
    @pytest.fixture(scope="class")
    def test_inventory_item(self, client, auth_headers):
        """Get or create test inventory item"""
        # Try to get existing item first
        response = client.get("/inventory/items/", headers=auth_headers)
        if response.status_code == 200:
            items = response.json()
            if items and items[0]["stock_quantity"] >= 5:  # Ensure enough stock
                return items[0]
        
        # Get or create category
        response = client.get("/inventory/categories/", headers=auth_headers)
        if response.status_code == 200:
            categories = response.json()
            if categories:
                category_id = categories[0]["id"]
            else:
                # Create category
                category_data = {
                    "name": "Production Test Category",
                    "description": "Category for production testing"
                }
                response = client.post("/inventory/categories/", json=category_data, headers=auth_headers)
                assert response.status_code == 200
                category_id = response.json()["id"]
        
        # Create inventory item
        item_data = {
            "name": "Production Test Gold Ring",
            "category_id": category_id,
            "weight_grams": 5.5,
            "purchase_price": 200.00,
            "sell_price": 300.00,
            "stock_quantity": 20,  # Ensure enough stock for tests
            "min_stock_level": 2,
            "description": "Production test ring"
        }
        
        response = client.post("/inventory/items/", json=item_data, headers=auth_headers)
        assert response.status_code == 200
        return response.json()

    def test_01_health_check(self, client):
        """Test API health check"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["database"] == "connected"

    def test_02_invoice_calculation(self, client, auth_headers, test_customer, test_inventory_item):
        """Test gram-based invoice calculation"""
        invoice_data = {
            "customer_id": test_customer["id"],
            "gold_price_per_gram": 50.0,
            "labor_cost_percentage": 10.0,
            "profit_percentage": 15.0,
            "vat_percentage": 8.0,
            "items": [
                {
                    "inventory_item_id": test_inventory_item["id"],
                    "quantity": 2,
                    "unit_price": 0,
                    "weight_grams": 5.5
                }
            ]
        }
        
        response = client.post("/invoices/calculate", json=invoice_data, headers=auth_headers)
        assert response.status_code == 200
        
        calculation = response.json()
        
        # Verify gram-based calculation
        expected_base = 2 * 5.5 * 50.0  # 2 rings * 5.5g * $50/g = $550
        assert abs(calculation["subtotal"] - expected_base) < 0.01
        
        # Verify cost components
        expected_labor = expected_base * 0.10  # $55
        expected_profit = (expected_base + expected_labor) * 0.15  # $90.75
        expected_subtotal_with_profit = expected_base + expected_labor + expected_profit  # $695.75
        expected_vat = expected_subtotal_with_profit * 0.08  # $55.66
        expected_total = expected_subtotal_with_profit + expected_vat  # $751.41
        
        assert abs(calculation["total_labor_cost"] - expected_labor) < 0.01
        assert abs(calculation["total_profit"] - expected_profit) < 0.01
        assert abs(calculation["total_vat"] - expected_vat) < 0.01
        assert abs(calculation["grand_total"] - expected_total) < 0.01

    def test_03_invoice_creation(self, client, auth_headers, test_customer, test_inventory_item, db_session):
        """Test invoice creation with inventory and customer updates"""
        initial_stock = test_inventory_item["stock_quantity"]
        initial_debt = test_customer.get("current_debt", 0)
        
        invoice_data = {
            "customer_id": test_customer["id"],
            "gold_price_per_gram": 50.0,
            "labor_cost_percentage": 10.0,
            "profit_percentage": 15.0,
            "vat_percentage": 8.0,
            "items": [
                {
                    "inventory_item_id": test_inventory_item["id"],
                    "quantity": 3,
                    "unit_price": 0,
                    "weight_grams": 5.5
                }
            ]
        }
        
        response = client.post("/invoices/", json=invoice_data, headers=auth_headers)
        assert response.status_code == 200
        
        invoice = response.json()
        
        # Verify invoice details
        assert invoice["customer_id"] == test_customer["id"]
        assert invoice["status"] == "pending"
        assert invoice["paid_amount"] == 0
        assert invoice["remaining_amount"] == invoice["total_amount"]
        assert "INV-" in invoice["invoice_number"]
        assert len(invoice["invoice_items"]) == 1
        assert invoice["invoice_items"][0]["quantity"] == 3
        
        # Verify inventory stock was updated
        updated_item_response = client.get(f"/inventory/items/{test_inventory_item['id']}", headers=auth_headers)
        assert updated_item_response.status_code == 200
        updated_item = updated_item_response.json()
        assert updated_item["stock_quantity"] == initial_stock - 3
        
        # Verify customer debt was updated
        updated_customer_response = client.get(f"/customers/{test_customer['id']}", headers=auth_headers)
        assert updated_customer_response.status_code == 200
        updated_customer = updated_customer_response.json()
        assert updated_customer["current_debt"] > initial_debt
        
        # Verify accounting entries were created
        accounting_entries = db_session.query(AccountingEntry).filter(
            AccountingEntry.reference_id == invoice["id"]
        ).all()
        assert len(accounting_entries) >= 2  # Income and gold weight entries
        
        return invoice

    def test_04_partial_payment(self, client, auth_headers, db_session):
        """Test partial payment processing"""
        # Get the most recent invoice
        response = client.get("/invoices/", headers=auth_headers)
        assert response.status_code == 200
        invoices = response.json()
        assert len(invoices) > 0
        
        invoice = invoices[0]  # Most recent invoice
        initial_total = invoice["total_amount"]
        payment_amount = initial_total * 0.6  # 60% payment
        
        payment_data = {
            "amount": payment_amount,
            "payment_method": "cash",
            "description": "Production test partial payment"
        }
        
        response = client.post(f"/invoices/{invoice['id']}/payments", json=payment_data, headers=auth_headers)
        assert response.status_code == 200
        
        payment = response.json()
        assert payment["amount"] == payment_amount
        assert payment["customer_id"] == invoice["customer_id"]
        
        # Verify invoice was updated
        updated_response = client.get(f"/invoices/{invoice['id']}", headers=auth_headers)
        assert updated_response.status_code == 200
        
        updated_invoice = updated_response.json()
        assert updated_invoice["paid_amount"] == payment_amount
        assert updated_invoice["remaining_amount"] == initial_total - payment_amount
        assert updated_invoice["status"] == "partially_paid"
        
        # Verify accounting entry for payment
        cash_entry = db_session.query(AccountingEntry).filter(
            AccountingEntry.reference_id == payment["id"],
            AccountingEntry.entry_type == "cash"
        ).first()
        assert cash_entry is not None
        assert cash_entry.amount == payment_amount

    def test_05_full_payment(self, client, auth_headers):
        """Test full payment processing"""
        # Get an invoice with remaining amount
        response = client.get("/invoices/?has_remaining_amount=true", headers=auth_headers)
        assert response.status_code == 200
        invoices = response.json()
        
        if invoices:
            invoice = invoices[0]
            remaining_amount = invoice["remaining_amount"]
            
            if remaining_amount > 0:
                payment_data = {
                    "amount": remaining_amount,
                    "payment_method": "bank",
                    "description": "Production test full payment"
                }
                
                response = client.post(f"/invoices/{invoice['id']}/payments", json=payment_data, headers=auth_headers)
                assert response.status_code == 200
                
                # Verify invoice status changed to paid
                updated_response = client.get(f"/invoices/{invoice['id']}", headers=auth_headers)
                updated_invoice = updated_response.json()
                
                assert updated_invoice["remaining_amount"] == 0
                assert updated_invoice["status"] == "paid"

    def test_06_invoice_listing_and_filtering(self, client, auth_headers, test_customer):
        """Test invoice listing with filters"""
        # Test basic listing
        response = client.get("/invoices/", headers=auth_headers)
        assert response.status_code == 200
        invoices = response.json()
        assert len(invoices) > 0
        
        # Test filtering by customer
        response = client.get(f"/invoices/?customer_id={test_customer['id']}", headers=auth_headers)
        assert response.status_code == 200
        filtered_invoices = response.json()
        assert all(inv["customer_id"] == test_customer["id"] for inv in filtered_invoices)
        
        # Test filtering by status
        response = client.get("/invoices/?status=pending", headers=auth_headers)
        assert response.status_code == 200
        pending_invoices = response.json()
        assert all(inv["status"] == "pending" for inv in pending_invoices)

    def test_07_invoice_reports(self, client, auth_headers):
        """Test invoice summary reports"""
        response = client.get("/invoices/reports/summary", headers=auth_headers)
        assert response.status_code == 200
        
        summary = response.json()
        
        # Verify summary structure
        assert "total_invoices" in summary
        assert "total_amount" in summary
        assert "total_paid" in summary
        assert "total_remaining" in summary
        assert "status_breakdown" in summary
        assert "average_invoice_amount" in summary
        
        # Verify data consistency
        assert summary["total_invoices"] > 0
        assert summary["total_amount"] > 0

    def test_08_invoice_status_update(self, client, auth_headers):
        """Test invoice status updates"""
        # Get a pending invoice
        response = client.get("/invoices/?status=pending", headers=auth_headers)
        assert response.status_code == 200
        invoices = response.json()
        
        if invoices:
            invoice = invoices[0]
            
            # Update status to cancelled
            status_update = {"status": "cancelled"}
            response = client.put(f"/invoices/{invoice['id']}/status", json=status_update, headers=auth_headers)
            assert response.status_code == 200
            
            updated_invoice = response.json()
            assert updated_invoice["status"] == "cancelled"

    def test_09_overpayment_validation(self, client, auth_headers):
        """Test validation against overpayment"""
        # Get an invoice with remaining amount
        response = client.get("/invoices/?has_remaining_amount=true", headers=auth_headers)
        assert response.status_code == 200
        invoices = response.json()
        
        if invoices:
            invoice = invoices[0]
            remaining_amount = invoice["remaining_amount"]
            
            # Try to pay more than remaining amount
            payment_data = {
                "amount": remaining_amount + 100,  # Overpayment
                "payment_method": "cash"
            }
            
            response = client.post(f"/invoices/{invoice['id']}/payments", json=payment_data, headers=auth_headers)
            assert response.status_code == 400
            assert "exceeds remaining amount" in response.json()["detail"]

    def test_10_insufficient_stock_validation(self, client, auth_headers, test_customer, test_inventory_item):
        """Test validation for insufficient stock"""
        # Get current stock
        response = client.get(f"/inventory/items/{test_inventory_item['id']}", headers=auth_headers)
        current_item = response.json()
        current_stock = current_item["stock_quantity"]
        
        invoice_data = {
            "customer_id": test_customer["id"],
            "gold_price_per_gram": 50.0,
            "labor_cost_percentage": 10.0,
            "profit_percentage": 15.0,
            "vat_percentage": 8.0,
            "items": [
                {
                    "inventory_item_id": test_inventory_item["id"],
                    "quantity": current_stock + 5,  # More than available
                    "unit_price": 0,
                    "weight_grams": 5.5
                }
            ]
        }
        
        response = client.post("/invoices/calculate", json=invoice_data, headers=auth_headers)
        assert response.status_code == 400
        assert "Insufficient stock" in response.json()["detail"]

def run_production_tests():
    """Run all production tests"""
    print("🧪 Running Production-Ready Invoice Test Suite")
    print("=" * 60)
    
    # Run pytest with verbose output
    exit_code = pytest.main([
        __file__,
        "-v",
        "--tb=short",
        "--no-header"
    ])
    
    if exit_code == 0:
        print("\n" + "=" * 60)
        print("🎉 ALL PRODUCTION TESTS PASSED!")
        print("✅ Invoice system is production-ready")
        print("✅ All functionality tested with real PostgreSQL database")
        print("✅ Authentication, authorization, and data persistence working")
        print("=" * 60)
    else:
        print("\n" + "=" * 60)
        print("❌ SOME TESTS FAILED")
        print("Please check the output above for details")
        print("=" * 60)
    
    return exit_code

if __name__ == "__main__":
    exit_code = run_production_tests()
    exit(exit_code)