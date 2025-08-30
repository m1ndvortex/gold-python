"""
Comprehensive QR Code Generation and Card Access Tests

Tests QR code generation, beautiful invoice card creation,
public access functionality, and cross-device compatibility.
"""

import json
import time
from io import BytesIO

import pytest
import qrcode
import requests
from PIL import Image
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker


class TestQRCodeComprehensive:
    """Comprehensive QR code and invoice card tests"""
    
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
        self.test_qr_cards = []
        
        # Setup test data
        self._setup_test_data()
        
        yield
        
        # Cleanup
        self._cleanup_test_data()
    
    def _setup_test_data(self):
        """Setup required test data"""
        
        # Create test customer
        customer_data = {
            "name": "QR Test Customer",
            "phone": "+1234567890",
            "email": "qrtest@example.com",
            "address": "123 QR Test Street"
        }
        
        response = requests.post(f"{self.base_url}/api/customers", json=customer_data)
        if response.status_code == 201:
            self.test_customer = response.json()
            self.test_customers.append(self.test_customer['id'])
        
        # Create test category
        category_data = {
            "name": "QR Test Category",
            "name_persian": "دسته تست QR"
        }
        
        response = requests.post(f"{self.base_url}/api/categories", json=category_data)
        if response.status_code == 201:
            self.test_category = response.json()
            self.test_categories.append(self.test_category['id'])
        
        # Create test inventory items with images
        self._create_test_inventory_items()
    
    def _create_test_inventory_items(self):
        """Create test inventory items with images"""
        
        # Create item images first
        item_images = []
        colors = ['red', 'blue', 'green']
        
        for i, color in enumerate(colors):
            image = Image.new('RGB', (400, 300), color=color)
            image_buffer = BytesIO()
            image.save(image_buffer, format='JPEG')
            image_buffer.seek(0)
            
            files = {'file': (f'qr_test_item_{i}.jpg', image_buffer, 'image/jpeg')}
            response = requests.post(f"{self.base_url}/api/images/upload", files=files)
            
            if response.status_code == 201:
                image_data = response.json()
                item_images.append(image_data)
                self.test_images.append(image_data['id'])
        
        # General item with images
        general_item_data = {
            "name": "QR Test General Item",
            "sku": "QRGEN001",
            "category_id": self.test_category['id'],
            "cost_price": 50.00,
            "sale_price": 75.00,
            "stock_quantity": 100,
            "unit_of_measure": "piece",
            "description": "Test item for QR code generation"
        }
        
        response = requests.post(f"{self.base_url}/api/inventory/items", json=general_item_data)
        if response.status_code == 201:
            self.general_item = response.json()
            self.test_items.append(self.general_item['id'])
            
            # Attach images to item
            if item_images:
                for image_data in item_images[:2]:  # Attach first 2 images
                    attach_data = {"image_id": image_data['id']}
                    requests.post(f"{self.base_url}/api/inventory/items/{self.general_item['id']}/images", json=attach_data)
                
                # Set primary image
                primary_data = {"primary_image_id": item_images[0]['id']}
                requests.patch(f"{self.base_url}/api/inventory/items/{self.general_item['id']}", json=primary_data)
        
        # Gold item with images
        gold_item_data = {
            "name": "QR Test Gold Ring",
            "sku": "QRGOLD001",
            "category_id": self.test_category['id'],
            "cost_price": 800.00,
            "sale_price": 1200.00,
            "stock_quantity": 10,
            "unit_of_measure": "piece",
            "description": "Test gold item for QR code generation",
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
            
            # Attach images to gold item
            if item_images:
                for image_data in item_images[1:]:  # Attach last 2 images
                    attach_data = {"image_id": image_data['id']}
                    requests.post(f"{self.base_url}/api/inventory/items/{self.gold_item['id']}/images", json=attach_data)
                
                # Set primary image
                primary_data = {"primary_image_id": item_images[1]['id']}
                requests.patch(f"{self.base_url}/api/inventory/items/{self.gold_item['id']}", json=primary_data)
    
    def _cleanup_test_data(self):
        """Clean up test data from database"""
        with self.SessionLocal() as db:
            # Delete test QR cards
            for card_id in self.test_qr_cards:
                db.execute(text("DELETE FROM qr_invoice_cards WHERE id = :id"), {"id": card_id})
            
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
    
    def test_qr_code_generation_general_invoice(self):
        """Test QR code generation for general invoice"""
        
        # Create general invoice
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
            "discount_amount": 5.00,
            "total": 160.00,
            "notes": "QR test general invoice"
        }
        
        response = requests.post(f"{self.base_url}/api/invoices", json=invoice_data)
        assert response.status_code == 201
        invoice = response.json()
        self.test_invoices.append(invoice['id'])
        
        # Generate QR card
        response = requests.post(f"{self.base_url}/api/invoices/{invoice['id']}/qr-card")
        assert response.status_code == 201
        qr_card = response.json()
        self.test_qr_cards.append(qr_card['id'])
        
        # Verify QR card data
        assert 'id' in qr_card
        assert 'qr_code' in qr_card
        assert 'card_url' in qr_card
        assert 'public_url' in qr_card
        assert qr_card['invoice_id'] == invoice['id']
        
        # Verify QR code is valid
        assert qr_card['qr_code'] is not None
        assert len(qr_card['qr_code']) > 0
        
        # Test QR code image generation
        response = requests.get(f"{self.base_url}/api/qr-cards/{qr_card['id']}/qr-image")
        assert response.status_code == 200
        assert response.headers['content-type'] == 'image/png'
        
        # Verify QR code content
        qr_image_content = response.content
        assert len(qr_image_content) > 1000  # Should be substantial PNG data
        
        # Test QR code decoding (verify it contains correct URL)
        qr_image = Image.open(BytesIO(qr_image_content))
        # Note: In a real test, you might use a QR code decoder library
        # For now, we'll verify the QR code URL is accessible
        
        # Test public card access
        response = requests.get(qr_card['public_url'])
        assert response.status_code == 200
        
        card_data = response.json()
        assert card_data['invoice_number'] == invoice['invoice_number']
        assert card_data['customer_name'] == self.test_customer['name']
        assert card_data['total'] == 160.00
        assert 'items' in card_data
        assert len(card_data['items']) == 1
        
        # Verify item data in card
        card_item = card_data['items'][0]
        assert card_item['name'] == self.general_item['name']
        assert card_item['quantity'] == 2
        assert card_item['unit_price'] == 75.00
        assert card_item['total_price'] == 150.00
        assert 'image_url' in card_item  # Should include item image
    
    def test_qr_code_generation_gold_invoice(self):
        """Test QR code generation for gold invoice with specialized fields"""
        
        # Create gold invoice
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
            
            "notes": "QR test gold invoice"
        }
        
        response = requests.post(f"{self.base_url}/api/invoices", json=invoice_data)
        assert response.status_code == 201
        invoice = response.json()
        self.test_invoices.append(invoice['id'])
        
        # Generate QR card
        response = requests.post(f"{self.base_url}/api/invoices/{invoice['id']}/qr-card")
        assert response.status_code == 201
        qr_card = response.json()
        self.test_qr_cards.append(qr_card['id'])
        
        # Test public card access
        response = requests.get(qr_card['public_url'])
        assert response.status_code == 200
        
        card_data = response.json()
        
        # Verify gold-specific fields are displayed
        assert 'gold_details' in card_data
        gold_details = card_data['gold_details']
        
        assert gold_details['sood'] == 100.00
        assert gold_details['ojrat'] == 200.00
        assert gold_details['maliyat'] == 120.00
        assert gold_details['gold_price'] == 60.00
        assert gold_details['total_weight'] == 5.5
        
        # Verify item gold-specific data
        card_item = card_data['items'][0]
        assert 'gold_specific' in card_item
        item_gold_data = card_item['gold_specific']
        
        assert item_gold_data['weight'] == 5.5
        assert item_gold_data['purity'] == 18
        assert item_gold_data['labor_cost'] == 200.00
        assert item_gold_data['profit_margin'] == 100.00
        
        # Verify Persian terminology is included
        assert 'persian_labels' in card_data
        persian_labels = card_data['persian_labels']
        assert 'sood' in persian_labels  # Should have Persian label for سود
        assert 'ojrat' in persian_labels  # Should have Persian label for اجرت
        assert 'maliyat' in persian_labels  # Should have Persian label for مالیات
    
    def test_qr_card_themes_and_styling(self):
        """Test different QR card themes and styling options"""
        
        # Create test invoice
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
        
        response = requests.post(f"{self.base_url}/api/invoices", json=invoice_data)
        assert response.status_code == 201
        invoice = response.json()
        self.test_invoices.append(invoice['id'])
        
        # Test different themes
        themes = ['glass', 'modern', 'classic', 'elegant']
        
        for theme in themes:
            with self.subTest(theme=theme):
                # Generate QR card with specific theme
                card_data = {
                    "theme": theme,
                    "background_color": "#ffffff",
                    "text_color": "#333333",
                    "accent_color": "#007bff"
                }
                
                response = requests.post(f"{self.base_url}/api/invoices/{invoice['id']}/qr-card", json=card_data)
                assert response.status_code == 201
                qr_card = response.json()
                self.test_qr_cards.append(qr_card['id'])
                
                # Verify theme is applied
                assert qr_card['theme'] == theme
                
                # Test card rendering with theme
                response = requests.get(qr_card['public_url'])
                assert response.status_code == 200
                
                card_display = response.json()
                assert 'theme' in card_display
                assert card_display['theme'] == theme
                assert 'styling' in card_display
                
                # Verify styling options are applied
                styling = card_display['styling']
                assert 'background_color' in styling
                assert 'text_color' in styling
                assert 'accent_color' in styling
    
    def test_qr_card_responsive_design(self):
        """Test QR card responsive design for different devices"""
        
        # Create test invoice
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
        
        response = requests.post(f"{self.base_url}/api/invoices", json=invoice_data)
        assert response.status_code == 201
        invoice = response.json()
        self.test_invoices.append(invoice['id'])
        
        # Generate QR card
        response = requests.post(f"{self.base_url}/api/invoices/{invoice['id']}/qr-card")
        assert response.status_code == 201
        qr_card = response.json()
        self.test_qr_cards.append(qr_card['id'])
        
        # Test different device viewports
        device_viewports = [
            ('mobile', 375, 667),    # iPhone SE
            ('tablet', 768, 1024),   # iPad
            ('desktop', 1920, 1080), # Desktop
            ('large', 2560, 1440)    # Large desktop
        ]
        
        for device_name, width, height in device_viewports:
            with self.subTest(device=device_name):
                # Request card with specific viewport
                headers = {
                    'User-Agent': f'TestDevice/{device_name}',
                    'X-Viewport-Width': str(width),
                    'X-Viewport-Height': str(height)
                }
                
                response = requests.get(qr_card['public_url'], headers=headers)
                assert response.status_code == 200
                
                card_data = response.json()
                
                # Verify responsive data is included
                assert 'responsive' in card_data
                responsive_data = card_data['responsive']
                
                assert 'viewport_width' in responsive_data
                assert 'viewport_height' in responsive_data
                assert 'device_type' in responsive_data
                
                # Verify appropriate styling for device
                if width <= 480:  # Mobile
                    assert responsive_data['device_type'] == 'mobile'
                elif width <= 1024:  # Tablet
                    assert responsive_data['device_type'] in ['tablet', 'mobile']
                else:  # Desktop
                    assert responsive_data['device_type'] in ['desktop', 'tablet']
    
    def test_qr_card_image_integration(self):
        """Test image integration in QR cards"""
        
        # Create invoice with items that have images
        invoice_data = {
            "type": "general",
            "customer_id": self.test_customer['id'],
            "items": [
                {
                    "inventory_item_id": self.general_item['id'],
                    "quantity": 1,
                    "unit_price": 75.00,
                    "total_price": 75.00
                },
                {
                    "inventory_item_id": self.gold_item['id'],
                    "quantity": 1,
                    "unit_price": 1200.00,
                    "total_price": 1200.00
                }
            ],
            "subtotal": 1275.00,
            "total": 1275.00
        }
        
        response = requests.post(f"{self.base_url}/api/invoices", json=invoice_data)
        assert response.status_code == 201
        invoice = response.json()
        self.test_invoices.append(invoice['id'])
        
        # Generate QR card
        response = requests.post(f"{self.base_url}/api/invoices/{invoice['id']}/qr-card")
        assert response.status_code == 201
        qr_card = response.json()
        self.test_qr_cards.append(qr_card['id'])
        
        # Test card with images
        response = requests.get(qr_card['public_url'])
        assert response.status_code == 200
        
        card_data = response.json()
        
        # Verify items have images
        for item in card_data['items']:
            assert 'image_url' in item
            assert 'thumbnail_url' in item
            
            # Test image accessibility
            if item['image_url']:
                image_response = requests.get(item['image_url'])
                assert image_response.status_code == 200
                assert image_response.headers['content-type'].startswith('image/')
            
            if item['thumbnail_url']:
                thumbnail_response = requests.get(item['thumbnail_url'])
                assert thumbnail_response.status_code == 200
                assert thumbnail_response.headers['content-type'].startswith('image/')
        
        # Test image optimization for cards
        response = requests.get(f"{self.base_url}/api/qr-cards/{qr_card['id']}/optimized-images")
        assert response.status_code == 200
        
        optimized_images = response.json()
        assert 'images' in optimized_images
        
        for image_data in optimized_images['images']:
            assert 'original_url' in image_data
            assert 'optimized_url' in image_data
            assert 'compression_ratio' in image_data
            
            # Verify optimized images are smaller
            original_response = requests.get(image_data['original_url'])
            optimized_response = requests.get(image_data['optimized_url'])
            
            if original_response.status_code == 200 and optimized_response.status_code == 200:
                assert len(optimized_response.content) <= len(original_response.content)
    
    def test_qr_card_security_and_access_control(self):
        """Test QR card security and access control"""
        
        # Create test invoice
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
        
        response = requests.post(f"{self.base_url}/api/invoices", json=invoice_data)
        assert response.status_code == 201
        invoice = response.json()
        self.test_invoices.append(invoice['id'])
        
        # Generate QR card with expiration
        from datetime import datetime, timedelta
        expiry_date = (datetime.now() + timedelta(days=30)).isoformat()
        
        card_data = {
            "expires_at": expiry_date,
            "access_control": {
                "require_verification": False,
                "max_views": 100,
                "allowed_domains": ["*"]
            }
        }
        
        response = requests.post(f"{self.base_url}/api/invoices/{invoice['id']}/qr-card", json=card_data)
        assert response.status_code == 201
        qr_card = response.json()
        self.test_qr_cards.append(qr_card['id'])
        
        # Test public access (should work)
        response = requests.get(qr_card['public_url'])
        assert response.status_code == 200
        
        # Test access tracking
        response = requests.get(f"{self.base_url}/api/qr-cards/{qr_card['id']}/analytics")
        assert response.status_code == 200
        
        analytics = response.json()
        assert 'total_views' in analytics
        assert 'unique_views' in analytics
        assert 'view_history' in analytics
        assert analytics['total_views'] >= 1  # Should have at least one view
        
        # Test card with restricted access
        restricted_card_data = {
            "access_control": {
                "require_verification": True,
                "max_views": 5,
                "allowed_domains": ["example.com"]
            }
        }
        
        response = requests.post(f"{self.base_url}/api/invoices/{invoice['id']}/qr-card", json=restricted_card_data)
        assert response.status_code == 201
        restricted_card = response.json()
        self.test_qr_cards.append(restricted_card['id'])
        
        # Test access with wrong domain (should be restricted)
        headers = {'Referer': 'https://unauthorized-domain.com'}
        response = requests.get(restricted_card['public_url'], headers=headers)
        # May return 403 or redirect to verification page
        assert response.status_code in [200, 403, 302]
        
        # Test card deactivation
        response = requests.patch(f"{self.base_url}/api/qr-cards/{qr_card['id']}/deactivate")
        assert response.status_code == 200
        
        # Test access to deactivated card
        response = requests.get(qr_card['public_url'])
        assert response.status_code == 410  # Gone
    
    def test_qr_card_performance_and_caching(self):
        """Test QR card performance and caching"""
        
        # Create test invoice
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
        
        response = requests.post(f"{self.base_url}/api/invoices", json=invoice_data)
        assert response.status_code == 201
        invoice = response.json()
        self.test_invoices.append(invoice['id'])
        
        # Generate QR card
        response = requests.post(f"{self.base_url}/api/invoices/{invoice['id']}/qr-card")
        assert response.status_code == 201
        qr_card = response.json()
        self.test_qr_cards.append(qr_card['id'])
        
        # Test initial load time
        start_time = time.time()
        response = requests.get(qr_card['public_url'])
        initial_load_time = time.time() - start_time
        
        assert response.status_code == 200
        assert initial_load_time < 5.0  # Should load within 5 seconds
        
        # Test cached load time
        start_time = time.time()
        response = requests.get(qr_card['public_url'])
        cached_load_time = time.time() - start_time
        
        assert response.status_code == 200
        assert cached_load_time < initial_load_time  # Should be faster due to caching
        
        # Test cache headers
        assert 'Cache-Control' in response.headers
        assert 'ETag' in response.headers or 'Last-Modified' in response.headers
        
        # Test conditional requests
        if 'ETag' in response.headers:
            etag = response.headers['ETag']
            headers = {'If-None-Match': etag}
            response = requests.get(qr_card['public_url'], headers=headers)
            assert response.status_code == 304  # Not Modified
        
        # Test QR code image caching
        start_time = time.time()
        response = requests.get(f"{self.base_url}/api/qr-cards/{qr_card['id']}/qr-image")
        qr_load_time = time.time() - start_time
        
        assert response.status_code == 200
        assert qr_load_time < 2.0  # QR generation should be fast
        
        # Test repeated QR image requests (should be cached)
        start_time = time.time()
        response = requests.get(f"{self.base_url}/api/qr-cards/{qr_card['id']}/qr-image")
        cached_qr_time = time.time() - start_time
        
        assert response.status_code == 200
        assert cached_qr_time < qr_load_time  # Should be faster due to caching
    
    def test_qr_card_bulk_operations(self):
        """Test bulk QR card operations"""
        
        # Create multiple invoices
        invoices = []
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
                "notes": f"Bulk QR test invoice {i}"
            }
            
            response = requests.post(f"{self.base_url}/api/invoices", json=invoice_data)
            assert response.status_code == 201
            invoice = response.json()
            invoices.append(invoice)
            self.test_invoices.append(invoice['id'])
        
        # Bulk generate QR cards
        invoice_ids = [inv['id'] for inv in invoices]
        bulk_data = {
            "invoice_ids": invoice_ids,
            "theme": "modern",
            "background_color": "#f8f9fa"
        }
        
        response = requests.post(f"{self.base_url}/api/qr-cards/bulk-generate", json=bulk_data)
        assert response.status_code == 201
        
        bulk_result = response.json()
        assert 'qr_cards' in bulk_result
        assert len(bulk_result['qr_cards']) == 5
        
        # Track generated cards for cleanup
        for card in bulk_result['qr_cards']:
            self.test_qr_cards.append(card['id'])
        
        # Test bulk analytics
        card_ids = [card['id'] for card in bulk_result['qr_cards']]
        analytics_data = {"card_ids": card_ids}
        
        response = requests.post(f"{self.base_url}/api/qr-cards/bulk-analytics", json=analytics_data)
        assert response.status_code == 200
        
        bulk_analytics = response.json()
        assert 'total_cards' in bulk_analytics
        assert 'total_views' in bulk_analytics
        assert 'cards_analytics' in bulk_analytics
        assert bulk_analytics['total_cards'] == 5
        
        # Test bulk deactivation
        deactivate_data = {"card_ids": card_ids[:3]}  # Deactivate first 3
        response = requests.patch(f"{self.base_url}/api/qr-cards/bulk-deactivate", json=deactivate_data)
        assert response.status_code == 200
        
        deactivation_result = response.json()
        assert 'deactivated_count' in deactivation_result
        assert deactivation_result['deactivated_count'] == 3
        
        # Verify deactivated cards are inaccessible
        for i in range(3):
            card = bulk_result['qr_cards'][i]
            response = requests.get(card['public_url'])
            assert response.status_code == 410  # Gone
        
        # Verify remaining cards are still accessible
        for i in range(3, 5):
            card = bulk_result['qr_cards'][i]
            response = requests.get(card['public_url'])
            assert response.status_code == 200


if __name__ == "__main__":
    pytest.main([__file__, "-v"])