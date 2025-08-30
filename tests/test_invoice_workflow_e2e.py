"""
End-to-End Invoice Management Workflow Tests

Tests complete dual invoice workflows (Gold vs General) including:
- Invoice type selection and conditional fields
- Workflow management (draft → approved)
- Automatic inventory integration
- Manual price overrides
- QR card generation and access
- Gold-specific field handling
"""

import json
import time
from datetime import datetime, timedelta
from io import BytesIO

import pytest
import requests
from PIL import Image
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker


class TestInvoiceWorkflowE2E:
    """End-to-end invoice workflow tests"""
    
    @pytest.fixture(autouse=True)
    def setup_test_environment(self):
        """Setup test environment with real database"""
        self.base_url = "http://localhost:8000"
        self.db_url = "postgresql://goldshop_user:goldshop_password@localhost:5432/goldshop"
        
        # Create database engine for direct queries
        self.engine = create_engine(self.db_url)
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        
        # Test data tracking
        self.test_invoices = []
        self.test_customers = []
        self.test_items = []
        self.test_categories = []
        self.test_images = []
        
        # Setup test data
        self._setup_test_data()
        
        yield
        
        # Cleanup
        self._cleanup_test_data()
    
    def _setup_test_data(self):
        """Setup required test data"""
        
        # Create test customer
        customer_data = {
            "name": "Test Customer",
            "phone": "+1234567890",
            "email": "test@example.com",
            "address": "123 Test Street"
        }
        
        response = requests.post(f"{self.base_url}/api/customers", json=customer_data)
        if response.status_code == 201:
            self.test_customer = response.json()
            self.test_customers.append(self.test_customer['id'])
        
        # Create test category
        category_data = {
            "name": "Test Category",
            "name_persian": "دسته تست"
        }
        
        response = requests.post(f"{self.base_url}/api/categories", json=category_data)
        if response.status_code == 201:
            self.test_category = response.json()
            self.test_categories.append(self.test_category['id'])
        
        # Create test inventory items
        self._create_test_inventory_items()
    
    def _create_test_inventory_items(self):
        """Create test inventory items for invoices"""
        
        # General item
        general_item_data = {
            "name": "General Test Item",
            "sku": "GEN001",
            "category_id": self.test_category['id'],
            "cost_price": 50.00,
            "sale_price": 75.00,
            "stock_quantity": 100,
            "unit_of_measure": "piece"
        }
        
        response = requests.post(f"{self.base_url}/api/inventory/items", json=general_item_data)
        if response.status_code == 201:
            self.general_item = response.json()
            self.test_items.append(self.general_item['id'])
        
        # Gold item with specific attributes
        gold_item_data = {
            "name": "Gold Ring",
            "sku": "GOLD001",
            "category_id": self.test_category['id'],
            "cost_price": 800.00,
            "sale_price": 1200.00,
            "stock_quantity": 10,
            "unit_of_measure": "piece",
            "custom_attributes": {
                "weight": 5.5,
                "purity": "18K",
                "stone": "Diamond"
            },
            "gold_specific": {
                "weight": 5.5,
                "purity": 18,
                "labor_cost": 200.00,
                "gold_price_per_gram": 60.00
            }
        }
        
        response = requests.post(f"{self.base_url}/api/inventory/items", json=gold_item_data)
        if response.status_code == 201:
            self.gold_item = response.json()
            self.test_items.append(self.gold_item['id'])
    
    def _cleanup_test_data(self):
        """Clean up test data from database"""
        with self.SessionLocal() as db:
            # Delete test invoices
            for invoice_id in self.test_invoices:
                db.execute(text("DELETE FROM invoices WHERE id = :id"), {"id": invoice_id})
            
            # Delete test items
            for item_id in self.test_items:
                db.execute(text("DELETE FROM inventory_items WHERE id = :id"), {"id": item_id})
            
            # Delete test categories
            for category_id in self.test_categories:
                db.execute(text("DELETE FROM categories WHERE id = :id"), {"id": category_id})
            
            # Delete test customers
            for customer_id in self.test_customers:
                db.execute(text("DELETE FROM customers WHERE id = :id"), {"id": customer_id})
            
            # Delete test images
            for image_id in self.test_images:
                db.execute(text("DELETE FROM images WHERE id = :id"), {"id": image_id})
            
            db.commit()
    
    def test_general_invoice_complete_workflow(self):
        """Test complete General invoice workflow"""
        
        # Step 1: Create draft General invoice
        invoice_data = {
            "type": "general",
            "customer_id": self.test_customer['id'],
            "items": [
                {
                    "inventory_item_id": self.general_item['id'],
                    "quantity": 2,
                    "unit_price": 75.00,
                    "total_price": 150.00
                }
            ],
            "subtotal": 150.00,
            "tax_amount": 15.00,
            "discount_amount": 0.00,
            "total": 165.00,
            "notes": "Test general invoice"
        }
        
        invoice = self._create_invoice(invoice_data)
        assert invoice['type'] == 'general'
        assert invoice['status'] == 'draft'
        
        # Step 2: Verify inventory not affected in draft state
        initial_stock = self._get_item_stock(self.general_item['id'])
        assert initial_stock == 100  # Should be unchanged
        
        # Step 3: Add item image to invoice
        item_image = self._upload_test_image("invoice_item.jpg")
        self._attach_image_to_invoice_item(invoice['id'], invoice['items'][0]['id'], item_image['id'])
        
        # Step 4: Apply manual price override
        override_data = {
            "item_id": invoice['items'][0]['id'],
            "override_price": 80.00,
            "override_reason": "Customer discount"
        }
        
        self._apply_price_override(invoice['id'], override_data)
        
        # Step 5: Approve invoice
        self._approve_invoice(invoice['id'])
        
        # Step 6: Verify inventory deduction
        final_stock = self._get_item_stock(self.general_item['id'])
        assert final_stock == 98  # Should be reduced by 2
        
        # Step 7: Generate and test QR card
        qr_card = self._generate_qr_card(invoice['id'])
        self._test_qr_card_access(qr_card)
        
        # Step 8: Test invoice printing
        self._test_invoice_printing(invoice['id'])
        
        # Step 9: Test invoice void (should restore inventory)
        self._void_invoice(invoice['id'])
        restored_stock = self._get_item_stock(self.general_item['id'])
        assert restored_stock == 100  # Should be restored
    
    def test_gold_invoice_complete_workflow(self):
        """Test complete Gold invoice workflow with specialized fields"""
        
        # Step 1: Create draft Gold invoice with specialized fields
        invoice_data = {
            "type": "gold",
            "customer_id": self.test_customer['id'],
            "items": [
                {
                    "inventory_item_id": self.gold_item['id'],
                    "quantity": 1,
                    "unit_price": 1200.00,
                    "total_price": 1200.00,
                    "gold_specific": {
                        "weight": 5.5,
                        "purity": 18,
                        "labor_cost": 200.00,
                        "profit_margin": 100.00
                    }
                }
            ],
            "subtotal": 1200.00,
            "tax_amount": 120.00,
            "discount_amount": 50.00,
            "total": 1270.00,
            
            # Gold-specific invoice fields
            "gold_sood": 100.00,      # سود (profit)
            "gold_ojrat": 200.00,     # اجرت (wage/labor fee)
            "gold_maliyat": 120.00,   # مالیات (tax)
            "gold_price": 60.00,      # Gold price per gram
            "gold_total_weight": 5.5,
            
            "notes": "Test gold invoice with specialized fields"
        }
        
        invoice = self._create_invoice(invoice_data)
        assert invoice['type'] == 'gold'
        assert invoice['gold_sood'] == 100.00
        assert invoice['gold_ojrat'] == 200.00
        assert invoice['gold_maliyat'] == 120.00
        
        # Step 2: Verify Gold-specific fields are stored correctly
        self._verify_gold_fields_storage(invoice['id'])
        
        # Step 3: Test Gold invoice approval workflow
        self._approve_invoice(invoice['id'])
        
        # Step 4: Verify inventory deduction for gold item
        final_stock = self._get_item_stock(self.gold_item['id'])
        assert final_stock == 9  # Should be reduced by 1
        
        # Step 5: Generate QR card with Gold-specific fields
        qr_card = self._generate_qr_card(invoice['id'])
        self._test_gold_qr_card_display(qr_card)
        
        # Step 6: Test Gold invoice accounting integration
        self._verify_gold_accounting_entries(invoice['id'])
    
    def test_invoice_workflow_states(self):
        """Test invoice workflow state transitions"""
        
        # Create draft invoice
        invoice_data = {
            "type": "general",
            "customer_id": self.test_customer['id'],
            "items": [
                {
                    "inventory_item_id": self.general_item['id'],
                    "quantity": 1,
                    "unit_price": 75.00,
                    "total_price": 75.00
                }
            ],
            "subtotal": 75.00,
            "total": 75.00
        }
        
        invoice = self._create_invoice(invoice_data)
        
        # Test state transitions
        states = ['draft', 'approved', 'paid', 'completed']
        
        for i, state in enumerate(states[1:], 1):  # Skip draft as it's initial state
            self._transition_invoice_state(invoice['id'], state)
            
            # Verify state change
            updated_invoice = self._get_invoice(invoice['id'])
            assert updated_invoice['status'] == state
            
            # Verify inventory is only affected on approval
            if state == 'approved':
                stock = self._get_item_stock(self.general_item['id'])
                assert stock == 99  # Should be reduced
    
    def test_bulk_invoice_operations(self):
        """Test bulk invoice operations"""
        
        # Create multiple invoices
        invoices_data = []
        for i in range(5):
            invoice_data = {
                "type": "general",
                "customer_id": self.test_customer['id'],
                "items": [
                    {
                        "inventory_item_id": self.general_item['id'],
                        "quantity": 1,
                        "unit_price": 75.00,
                        "total_price": 75.00
                    }
                ],
                "subtotal": 75.00,
                "total": 75.00,
                "notes": f"Bulk invoice {i}"
            }
            invoices_data.append(invoice_data)
        
        # Bulk create invoices
        response = requests.post(f"{self.base_url}/api/invoices/bulk", json={"invoices": invoices_data})
        assert response.status_code == 201
        created_invoices = response.json()
        assert len(created_invoices) == 5
        
        # Add to cleanup list
        for invoice in created_invoices:
            self.test_invoices.append(invoice['id'])
        
        # Bulk approve invoices
        invoice_ids = [invoice['id'] for invoice in created_invoices]
        response = requests.post(f"{self.base_url}/api/invoices/bulk-approve", json={"invoice_ids": invoice_ids})
        assert response.status_code == 200
        
        # Verify all invoices are approved
        for invoice_id in invoice_ids:
            invoice = self._get_invoice(invoice_id)
            assert invoice['status'] == 'approved'
        
        # Verify inventory deduction
        final_stock = self._get_item_stock(self.general_item['id'])
        assert final_stock <= 95  # Should be reduced by at least 5
    
    def test_invoice_validation_rules(self):
        """Test invoice validation and business rules"""
        
        # Test insufficient inventory
        insufficient_invoice_data = {
            "type": "general",
            "customer_id": self.test_customer['id'],
            "items": [
                {
                    "inventory_item_id": self.general_item['id'],
                    "quantity": 1000,  # More than available stock
                    "unit_price": 75.00,
                    "total_price": 75000.00
                }
            ],
            "subtotal": 75000.00,
            "total": 75000.00
        }
        
        response = requests.post(f"{self.base_url}/api/invoices", json=insufficient_invoice_data)
        assert response.status_code == 400
        assert "insufficient inventory" in response.json()['detail'].lower()
        
        # Test invalid Gold invoice (missing required Gold fields)
        invalid_gold_data = {
            "type": "gold",
            "customer_id": self.test_customer['id'],
            "items": [
                {
                    "inventory_item_id": self.gold_item['id'],
                    "quantity": 1,
                    "unit_price": 1200.00,
                    "total_price": 1200.00
                }
            ],
            "subtotal": 1200.00,
            "total": 1200.00
            # Missing gold_sood, gold_ojrat, gold_maliyat
        }
        
        response = requests.post(f"{self.base_url}/api/invoices", json=invalid_gold_data)
        assert response.status_code == 400
        assert "gold" in response.json()['detail'].lower()
        
        # Test negative quantities
        negative_quantity_data = {
            "type": "general",
            "customer_id": self.test_customer['id'],
            "items": [
                {
                    "inventory_item_id": self.general_item['id'],
                    "quantity": -1,  # Negative quantity
                    "unit_price": 75.00,
                    "total_price": -75.00
                }
            ],
            "subtotal": -75.00,
            "total": -75.00
        }
        
        response = requests.post(f"{self.base_url}/api/invoices", json=negative_quantity_data)
        assert response.status_code == 400
        assert "quantity" in response.json()['detail'].lower()
    
    def test_invoice_search_and_filtering(self):
        """Test invoice search and filtering capabilities"""
        
        # Create invoices with different characteristics
        test_invoices = []
        
        # General invoice
        general_invoice = self._create_invoice({
            "type": "general",
            "customer_id": self.test_customer['id'],
            "items": [{"inventory_item_id": self.general_item['id'], "quantity": 1, "unit_price": 75.00, "total_price": 75.00}],
            "subtotal": 75.00,
            "total": 75.00,
            "notes": "Search test general"
        })
        test_invoices.append(general_invoice)
        
        # Gold invoice
        gold_invoice = self._create_invoice({
            "type": "gold",
            "customer_id": self.test_customer['id'],
            "items": [{"inventory_item_id": self.gold_item['id'], "quantity": 1, "unit_price": 1200.00, "total_price": 1200.00}],
            "subtotal": 1200.00,
            "total": 1200.00,
            "gold_sood": 100.00,
            "gold_ojrat": 200.00,
            "gold_maliyat": 120.00,
            "notes": "Search test gold"
        })
        test_invoices.append(gold_invoice)
        
        # Test search by type
        response = requests.get(f"{self.base_url}/api/invoices/search", params={"type": "general"})
        assert response.status_code == 200
        results = response.json()
        assert any(invoice['id'] == general_invoice['id'] for invoice in results['invoices'])
        
        response = requests.get(f"{self.base_url}/api/invoices/search", params={"type": "gold"})
        assert response.status_code == 200
        results = response.json()
        assert any(invoice['id'] == gold_invoice['id'] for invoice in results['invoices'])
        
        # Test search by customer
        response = requests.get(f"{self.base_url}/api/invoices/search", params={"customer_id": self.test_customer['id']})
        assert response.status_code == 200
        results = response.json()
        assert len(results['invoices']) >= 2
        
        # Test search by date range
        today = datetime.now().date()
        yesterday = today - timedelta(days=1)
        tomorrow = today + timedelta(days=1)
        
        response = requests.get(
            f"{self.base_url}/api/invoices/search",
            params={
                "date_from": yesterday.isoformat(),
                "date_to": tomorrow.isoformat()
            }
        )
        assert response.status_code == 200
        results = response.json()
        assert len(results['invoices']) >= 2
        
        # Test search by amount range
        response = requests.get(
            f"{self.base_url}/api/invoices/search",
            params={"min_amount": 1000.00, "max_amount": 2000.00}
        )
        assert response.status_code == 200
        results = response.json()
        assert any(invoice['id'] == gold_invoice['id'] for invoice in results['invoices'])
        
        # Test search by Gold-specific fields
        response = requests.get(
            f"{self.base_url}/api/invoices/search",
            params={"gold_sood_min": 50.00, "gold_sood_max": 150.00}
        )
        assert response.status_code == 200
        results = response.json()
        assert any(invoice['id'] == gold_invoice['id'] for invoice in results['invoices'])
    
    def _create_invoice(self, invoice_data: dict) -> dict:
        """Create an invoice"""
        response = requests.post(f"{self.base_url}/api/invoices", json=invoice_data)
        assert response.status_code == 201
        
        invoice = response.json()
        self.test_invoices.append(invoice['id'])
        return invoice
    
    def _get_invoice(self, invoice_id: str) -> dict:
        """Get invoice by ID"""
        response = requests.get(f"{self.base_url}/api/invoices/{invoice_id}")
        assert response.status_code == 200
        return response.json()
    
    def _get_item_stock(self, item_id: str) -> int:
        """Get current stock quantity for item"""
        response = requests.get(f"{self.base_url}/api/inventory/items/{item_id}")
        assert response.status_code == 200
        return response.json()['stock_quantity']
    
    def _upload_test_image(self, filename: str) -> dict:
        """Upload a test image"""
        image = Image.new('RGB', (400, 300), color='green')
        image_buffer = BytesIO()
        image.save(image_buffer, format='JPEG')
        image_buffer.seek(0)
        
        files = {'file': (filename, image_buffer, 'image/jpeg')}
        response = requests.post(f"{self.base_url}/api/images/upload", files=files)
        assert response.status_code == 201
        
        image_data = response.json()
        self.test_images.append(image_data['id'])
        return image_data
    
    def _attach_image_to_invoice_item(self, invoice_id: str, item_id: str, image_id: str):
        """Attach image to invoice item"""
        data = {"image_id": image_id}
        response = requests.post(f"{self.base_url}/api/invoices/{invoice_id}/items/{item_id}/images", json=data)
        assert response.status_code == 200
    
    def _apply_price_override(self, invoice_id: str, override_data: dict):
        """Apply manual price override"""
        response = requests.post(f"{self.base_url}/api/invoices/{invoice_id}/price-override", json=override_data)
        assert response.status_code == 200
    
    def _approve_invoice(self, invoice_id: str):
        """Approve invoice"""
        data = {"status": "approved", "approval_notes": "Test approval"}
        response = requests.patch(f"{self.base_url}/api/invoices/{invoice_id}/status", json=data)
        assert response.status_code == 200
    
    def _void_invoice(self, invoice_id: str):
        """Void invoice"""
        data = {"status": "voided", "void_reason": "Test void"}
        response = requests.patch(f"{self.base_url}/api/invoices/{invoice_id}/status", json=data)
        assert response.status_code == 200
    
    def _transition_invoice_state(self, invoice_id: str, new_state: str):
        """Transition invoice to new state"""
        data = {"status": new_state}
        response = requests.patch(f"{self.base_url}/api/invoices/{invoice_id}/status", json=data)
        assert response.status_code == 200
    
    def _generate_qr_card(self, invoice_id: str) -> dict:
        """Generate QR card for invoice"""
        response = requests.post(f"{self.base_url}/api/invoices/{invoice_id}/qr-card")
        assert response.status_code == 201
        return response.json()
    
    def _test_qr_card_access(self, qr_card: dict):
        """Test QR card public access"""
        # Test public access without authentication
        response = requests.get(f"{self.base_url}/public/qr-cards/{qr_card['id']}")
        assert response.status_code == 200
        
        card_data = response.json()
        assert 'invoice_number' in card_data
        assert 'customer_name' in card_data
        assert 'total' in card_data
        assert 'items' in card_data
    
    def _test_gold_qr_card_display(self, qr_card: dict):
        """Test Gold-specific QR card display"""
        response = requests.get(f"{self.base_url}/public/qr-cards/{qr_card['id']}")
        assert response.status_code == 200
        
        card_data = response.json()
        # Verify Gold-specific fields are displayed
        assert 'gold_details' in card_data
        assert 'sood' in card_data['gold_details']
        assert 'ojrat' in card_data['gold_details']
        assert 'maliyat' in card_data['gold_details']
    
    def _test_invoice_printing(self, invoice_id: str):
        """Test invoice printing with QR code"""
        response = requests.get(f"{self.base_url}/api/invoices/{invoice_id}/print")
        assert response.status_code == 200
        assert response.headers['content-type'] == 'application/pdf'
        
        # Verify PDF contains QR code
        pdf_content = response.content
        assert len(pdf_content) > 1000  # Should be a substantial PDF
    
    def _verify_gold_fields_storage(self, invoice_id: str):
        """Verify Gold-specific fields are stored correctly in database"""
        with self.SessionLocal() as db:
            result = db.execute(
                text("""
                    SELECT gold_sood, gold_ojrat, gold_maliyat, 
                           gold_price, gold_total_weight
                    FROM invoices 
                    WHERE id = :id
                """),
                {"id": invoice_id}
            ).fetchone()
            
            assert result is not None
            assert result.gold_sood == 100.00
            assert result.gold_ojrat == 200.00
            assert result.gold_maliyat == 120.00
            assert result.gold_price == 60.00
            assert result.gold_total_weight == 5.5
    
    def _verify_gold_accounting_entries(self, invoice_id: str):
        """Verify Gold invoice creates proper accounting entries"""
        with self.SessionLocal() as db:
            # Check if journal entries were created for Gold-specific fields
            result = db.execute(
                text("""
                    SELECT COUNT(*) as count
                    FROM journal_entries 
                    WHERE source = 'invoice' AND source_id = :id
                """),
                {"id": invoice_id}
            ).fetchone()
            
            assert result.count > 0  # Should have accounting entries
            
            # Check for Gold-specific account entries
            gold_entries = db.execute(
                text("""
                    SELECT description, debit_amount, credit_amount
                    FROM journal_entry_lines jel
                    JOIN journal_entries je ON jel.journal_entry_id = je.id
                    WHERE je.source = 'invoice' AND je.source_id = :id
                    AND (jel.description LIKE '%سود%' OR 
                         jel.description LIKE '%اجرت%' OR 
                         jel.description LIKE '%مالیات%')
                """),
                {"id": invoice_id}
            ).fetchall()
            
            assert len(gold_entries) >= 3  # Should have entries for سود, اجرت, مالیات


if __name__ == "__main__":
    pytest.main([__file__, "-v"])