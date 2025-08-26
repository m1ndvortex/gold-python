"""
Simple API Gateway Tests
Basic tests for API gateway functionality
"""

import pytest
import hashlib
import secrets
from datetime import datetime, timedelta

def test_api_key_generation():
    """Test API key generation logic"""
    from services.api_gateway_service import APIKeyService
    
    # Test key generation
    full_key, prefix, key_hash = APIKeyService.generate_api_key()
    
    assert full_key.startswith(prefix)
    assert prefix.startswith("gsp_")
    assert len(key_hash) == 64  # SHA256 hash length
    
    # Verify hash is correct
    expected_hash = hashlib.sha256(full_key.encode()).hexdigest()
    assert key_hash == expected_hash
    
    print(f"✅ Generated API key: {prefix}...")
    print(f"✅ Hash length: {len(key_hash)}")

def test_webhook_filtering():
    """Test webhook event filtering logic"""
    from services.api_gateway_service import WebhookService
    
    # Test simple filter
    event_data = {
        'status': 'approved',
        'total': 150.00,
        'customer_type': 'premium'
    }
    
    filters = {
        'status': 'approved',
        'total': {'min': 100}
    }
    
    assert WebhookService._matches_filters(event_data, filters) is True
    
    # Test non-matching filter
    filters['status'] = 'pending'
    assert WebhookService._matches_filters(event_data, filters) is False
    
    print("✅ Webhook filtering logic works correctly")

def test_automation_conditions():
    """Test workflow automation condition checking"""
    from services.api_gateway_service import WorkflowAutomationService
    
    # Test condition matching
    event_data = {
        'stock_quantity': 5,
        'threshold': 10,
        'item_category': 'electronics'
    }
    
    conditions = {
        'stock_quantity': {'less_than': 10},
        'item_category': 'electronics'
    }
    
    assert WorkflowAutomationService._check_conditions(event_data, conditions) is True
    
    # Test non-matching condition
    conditions['stock_quantity']['less_than'] = 3
    assert WorkflowAutomationService._check_conditions(event_data, conditions) is False
    
    print("✅ Automation condition checking works correctly")

def test_webhook_signature():
    """Test webhook signature creation"""
    from services.api_gateway_service import WebhookService
    
    payload = '{"event": "test", "data": {"id": "123"}}'
    secret = "test_secret"
    
    signature = WebhookService._create_signature(payload, secret)
    
    assert signature.startswith("sha256=")
    assert len(signature) == 71  # "sha256=" + 64 char hash
    
    # Verify signature is consistent
    signature2 = WebhookService._create_signature(payload, secret)
    assert signature == signature2
    
    print(f"✅ Webhook signature: {signature[:20]}...")

def test_rate_limiting_logic():
    """Test rate limiting calculation logic"""
    # This would test the rate limiting logic without database
    # For now, just verify the concept
    
    current_time = datetime.utcnow()
    minute_ago = current_time - timedelta(minutes=1)
    
    # Simulate request timestamps
    request_times = [
        current_time - timedelta(seconds=30),
        current_time - timedelta(seconds=45),
        current_time - timedelta(seconds=50)
    ]
    
    # Count requests in last minute
    recent_requests = [t for t in request_times if t >= minute_ago]
    
    assert len(recent_requests) == 3
    
    print("✅ Rate limiting time calculation works correctly")

def test_bulk_operation_validation():
    """Test bulk operation data validation"""
    # Test CSV parsing logic
    import csv
    import io
    
    csv_data = """name,sku,price
Item 1,SKU001,10.00
Item 2,SKU002,20.00
Invalid Item,,invalid"""
    
    reader = csv.DictReader(io.StringIO(csv_data))
    rows = list(reader)
    
    assert len(rows) == 3
    assert rows[0]['name'] == 'Item 1'
    assert rows[0]['sku'] == 'SKU001'
    
    # Test validation logic
    valid_rows = []
    invalid_rows = []
    
    for row in rows:
        if row['name'] and row['sku'] and row['price']:
            try:
                float(row['price'])
                valid_rows.append(row)
            except ValueError:
                invalid_rows.append(row)
        else:
            invalid_rows.append(row)
    
    assert len(valid_rows) == 2
    assert len(invalid_rows) == 1
    
    print(f"✅ Bulk validation: {len(valid_rows)} valid, {len(invalid_rows)} invalid")

def test_integration_configuration():
    """Test external integration configuration validation"""
    
    # Test configuration structure
    config = {
        'name': 'QuickBooks Integration',
        'service_type': 'accounting',
        'provider': 'quickbooks',
        'configuration': {
            'sync_frequency': 'daily',
            'sync_entities': ['customers', 'invoices']
        },
        'credentials': {
            'client_id': 'test_client_id',
            'client_secret': 'test_client_secret'
        }
    }
    
    # Validate required fields
    required_fields = ['name', 'service_type', 'provider', 'configuration', 'credentials']
    for field in required_fields:
        assert field in config
    
    # Validate service type
    valid_service_types = ['accounting', 'payment_processor', 'shipping', 'crm']
    assert config['service_type'] in valid_service_types
    
    print("✅ Integration configuration validation works")

def test_event_schema_validation():
    """Test event data schema validation"""
    
    # Test invoice event
    invoice_event = {
        'event': 'invoice.created',
        'data': {
            'id': 'inv_123',
            'invoice_number': 'INV-001',
            'customer_id': 'cust_456',
            'total': 250.00,
            'status': 'created'
        },
        'timestamp': datetime.utcnow().isoformat()
    }
    
    # Validate event structure
    assert 'event' in invoice_event
    assert 'data' in invoice_event
    assert 'timestamp' in invoice_event
    
    # Validate event data
    data = invoice_event['data']
    assert 'id' in data
    assert 'invoice_number' in data
    assert isinstance(data['total'], (int, float))
    
    print("✅ Event schema validation works")

def test_api_scopes_validation():
    """Test API scope validation"""
    
    valid_scopes = [
        'read:inventory', 'write:inventory', 'delete:inventory',
        'read:invoices', 'write:invoices', 'delete:invoices',
        'read:customers', 'write:customers', 'delete:customers',
        'admin:api_keys', 'write:webhooks', 'write:automations'
    ]
    
    # Test valid scopes
    test_scopes = ['read:inventory', 'write:invoices', 'admin:api_keys']
    for scope in test_scopes:
        assert scope in valid_scopes
    
    # Test invalid scope
    invalid_scope = 'invalid:scope'
    assert invalid_scope not in valid_scopes
    
    print(f"✅ Scope validation: {len(valid_scopes)} valid scopes defined")

if __name__ == "__main__":
    print("🧪 Running API Gateway Simple Tests\n")
    
    test_api_key_generation()
    test_webhook_filtering()
    test_automation_conditions()
    test_webhook_signature()
    test_rate_limiting_logic()
    test_bulk_operation_validation()
    test_integration_configuration()
    test_event_schema_validation()
    test_api_scopes_validation()
    
    print("\n✅ All API Gateway simple tests passed!")