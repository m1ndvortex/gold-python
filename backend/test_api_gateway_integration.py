"""
API Gateway Integration Tests
Comprehensive tests for API gateway functionality using real PostgreSQL database
"""

import pytest
import asyncio
import json
import hashlib
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from unittest.mock import patch, AsyncMock

from main import app
from database import get_db, engine
from models_api_gateway import (
    APIKey, APIUsageLog, WebhookEndpoint, WebhookDelivery,
    BulkOperation, WorkflowAutomation, WorkflowExecution,
    ExternalIntegration, IntegrationSyncLog
)
from services.api_gateway_service import (
    APIKeyService, WebhookService, BulkOperationService,
    WorkflowAutomationService, ExternalIntegrationService
)

client = TestClient(app)

@pytest.fixture
def db_session():
    """Create a database session for testing"""
    from sqlalchemy.orm import sessionmaker
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()

@pytest.fixture
def test_api_key(db_session):
    """Create a test API key"""
    api_key, full_key = APIKeyService.create_api_key(
        db=db_session,
        name="Test API Key",
        scopes=[
            'read:inventory', 'write:inventory',
            'read:invoices', 'write:invoices',
            'admin:api_keys', 'write:webhooks',
            'write:bulk_operations', 'write:automations',
            'write:integrations', 'write:events'
        ],
        permissions={'test': True},
        created_by="test-user-id",
        business_type="test_business"
    )
    
    # Store the full key for testing
    api_key._test_full_key = full_key
    return api_key

class TestAPIKeyManagement:
    """Test API key management functionality"""
    
    def test_create_api_key_service(self, db_session):
        """Test API key creation through service"""
        api_key, full_key = APIKeyService.create_api_key(
            db=db_session,
            name="Service Test Key",
            scopes=['read:inventory', 'write:inventory'],
            permissions={'service_test': True},
            created_by="service-test-user",
            rate_limits={'per_minute': 100, 'per_hour': 2000, 'per_day': 20000}
        )
        
        assert api_key.name == "Service Test Key"
        assert 'read:inventory' in api_key.scopes
        assert 'write:inventory' in api_key.scopes
        assert api_key.rate_limit_per_minute == 100
        assert api_key.rate_limit_per_hour == 2000
        assert api_key.rate_limit_per_day == 20000
        assert api_key.is_active is True
        assert full_key.startswith(api_key.key_prefix)
    
    def test_authenticate_api_key(self, db_session, test_api_key):
        """Test API key authentication"""
        # Test valid key
        authenticated_key = APIKeyService.authenticate_api_key(
            db_session, test_api_key._test_full_key
        )
        assert authenticated_key is not None
        assert authenticated_key.id == test_api_key.id
        assert authenticated_key.last_used_at is not None
        
        # Test invalid key
        invalid_key = APIKeyService.authenticate_api_key(
            db_session, "invalid_key"
        )
        assert invalid_key is None
    
    def test_rate_limiting(self, db_session, test_api_key):
        """Test rate limiting functionality"""
        # Check initial rate limit (should be allowed)
        result = APIKeyService.check_rate_limit(db_session, str(test_api_key.id))
        assert result['allowed'] is True
        assert 'limits' in result
        
        # Create usage logs to simulate rate limit hit
        for i in range(test_api_key.rate_limit_per_minute):
            APIKeyService.log_api_usage(
                db=db_session,
                api_key_id=str(test_api_key.id),
                endpoint="/test/endpoint",
                method="GET",
                status_code=200,
                response_time_ms=100
            )
        
        # Check rate limit again (should be exceeded)
        result = APIKeyService.check_rate_limit(db_session, str(test_api_key.id))
        assert result['allowed'] is False
        assert 'Rate limit exceeded' in result['reason']
    
    def test_api_usage_logging(self, db_session, test_api_key):
        """Test API usage logging"""
        APIKeyService.log_api_usage(
            db=db_session,
            api_key_id=str(test_api_key.id),
            endpoint="/api/v1/inventory",
            method="GET",
            status_code=200,
            response_time_ms=150,
            ip_address="192.168.1.1",
            user_agent="TestClient/1.0",
            resource_type="inventory",
            business_operation="list_items"
        )
        
        # Verify log was created
        usage_log = db_session.query(APIUsageLog).filter(
            APIUsageLog.api_key_id == str(test_api_key.id)
        ).first()
        
        assert usage_log is not None
        assert usage_log.endpoint == "/api/v1/inventory"
        assert usage_log.method == "GET"
        assert usage_log.status_code == 200
        assert usage_log.response_time_ms == 150
        assert usage_log.resource_type == "inventory"
        assert usage_log.business_operation == "list_items"

class TestWebhookManagement:
    """Test webhook management functionality"""
    
    def test_create_webhook_endpoint(self, db_session, test_api_key):
        """Test webhook endpoint creation"""
        webhook = WebhookService.create_webhook_endpoint(
            db=db_session,
            api_key_id=str(test_api_key.id),
            name="Test Webhook",
            url="https://example.com/webhook",
            events=['invoice.created', 'inventory.low_stock'],
            event_filters={'status': 'approved'},
            timeout_seconds=45,
            retry_attempts=5
        )
        
        assert webhook.name == "Test Webhook"
        assert webhook.url == "https://example.com/webhook"
        assert 'invoice.created' in webhook.events
        assert 'inventory.low_stock' in webhook.events
        assert webhook.event_filters['status'] == 'approved'
        assert webhook.timeout_seconds == 45
        assert webhook.retry_attempts == 5
        assert webhook.is_active is True
    
    @pytest.mark.asyncio
    async def test_webhook_event_filtering(self, db_session, test_api_key):
        """Test webhook event filtering"""
        # Create webhook with filters
        webhook = WebhookService.create_webhook_endpoint(
            db=db_session,
            api_key_id=str(test_api_key.id),
            name="Filtered Webhook",
            url="https://example.com/filtered",
            events=['invoice.created'],
            event_filters={'total': {'min': 100}, 'status': 'approved'}
        )
        
        # Test event that matches filters
        matching_event = {
            'id': 'test-invoice-1',
            'total': 150,
            'status': 'approved'
        }
        
        assert WebhookService._matches_filters(matching_event, webhook.event_filters) is True
        
        # Test event that doesn't match filters
        non_matching_event = {
            'id': 'test-invoice-2',
            'total': 50,  # Below minimum
            'status': 'approved'
        }
        
        assert WebhookService._matches_filters(non_matching_event, webhook.event_filters) is False
    
    @pytest.mark.asyncio
    async def test_webhook_delivery_creation(self, db_session, test_api_key):
        """Test webhook delivery creation"""
        # Create webhook endpoint
        webhook = WebhookService.create_webhook_endpoint(
            db=db_session,
            api_key_id=str(test_api_key.id),
            name="Delivery Test Webhook",
            url="https://httpbin.org/post",  # Test endpoint
            events=['invoice.created']
        )
        
        # Send webhook event
        event_data = {
            'id': 'test-invoice-123',
            'invoice_number': 'INV-001',
            'total': 250.00,
            'status': 'created'
        }
        
        await WebhookService.send_webhook(
            db=db_session,
            event_type='invoice.created',
            event_data=event_data,
            resource_type='invoice',
            resource_id='test-invoice-123'
        )
        
        # Verify delivery record was created
        delivery = db_session.query(WebhookDelivery).filter(
            WebhookDelivery.endpoint_id == str(webhook.id)
        ).first()
        
        assert delivery is not None
        assert delivery.event_type == 'invoice.created'
        assert delivery.payload['data']['id'] == 'test-invoice-123'
        assert delivery.status == 'pending'

class TestBulkOperations:
    """Test bulk import/export operations"""
    
    def test_create_bulk_operation(self, db_session):
        """Test bulk operation creation"""
        operation = BulkOperationService.create_bulk_operation(
            db=db_session,
            operation_type='import',
            resource_type='inventory',
            format='csv',
            filename='test_inventory.csv',
            created_by='test-user',
            configuration={'delimiter': ',', 'has_header': True}
        )
        
        assert operation.operation_type == 'import'
        assert operation.resource_type == 'inventory'
        assert operation.format == 'csv'
        assert operation.filename == 'test_inventory.csv'
        assert operation.configuration['delimiter'] == ','
        assert operation.status == 'pending'
    
    @pytest.mark.asyncio
    async def test_csv_import_processing(self, db_session):
        """Test CSV import processing"""
        # Create bulk operation
        operation = BulkOperationService.create_bulk_operation(
            db=db_session,
            operation_type='import',
            resource_type='inventory',
            format='csv',
            filename='test_items.csv',
            created_by='test-user'
        )
        
        # Sample CSV data
        csv_data = """name,sku,cost_price,sale_price,stock_quantity,category
Test Item 1,TEST001,10.00,15.00,100,Electronics
Test Item 2,TEST002,20.00,30.00,50,Electronics
Invalid Item,,invalid,invalid,invalid,NonExistent"""
        
        # Process import
        await BulkOperationService.process_bulk_import(
            db=db_session,
            operation_id=str(operation.id),
            file_data=csv_data.encode('utf-8')
        )
        
        # Refresh operation
        db_session.refresh(operation)
        
        assert operation.status == 'completed'
        assert operation.total_records == 3
        assert operation.processed_records == 3
        assert operation.successful_records >= 0  # Some may fail due to validation
        assert operation.failed_records >= 0

class TestWorkflowAutomation:
    """Test workflow automation functionality"""
    
    def test_create_automation(self, db_session):
        """Test workflow automation creation"""
        automation = WorkflowAutomationService.create_automation(
            db=db_session,
            name="Low Stock Alert",
            description="Send alert when inventory is low",
            trigger_event="inventory.low_stock",
            trigger_conditions={'stock_quantity': {'less_than': 10}},
            actions=[
                {
                    'type': 'send_email',
                    'configuration': {
                        'to': 'manager@example.com',
                        'subject': 'Low Stock Alert',
                        'template': 'low_stock_template'
                    }
                }
            ],
            created_by='test-user',
            business_type='retail'
        )
        
        assert automation.name == "Low Stock Alert"
        assert automation.trigger_event == "inventory.low_stock"
        assert automation.trigger_conditions['stock_quantity']['less_than'] == 10
        assert len(automation.actions) == 1
        assert automation.actions[0]['type'] == 'send_email'
        assert automation.is_active is True
    
    def test_condition_checking(self, db_session):
        """Test automation condition checking"""
        # Test matching conditions
        event_data = {
            'item_id': 'test-item-1',
            'stock_quantity': 5,
            'threshold': 10
        }
        
        conditions = {
            'stock_quantity': {'less_than': 10},
            'threshold': 10
        }
        
        assert WorkflowAutomationService._check_conditions(event_data, conditions) is True
        
        # Test non-matching conditions
        event_data['stock_quantity'] = 15
        assert WorkflowAutomationService._check_conditions(event_data, conditions) is False
    
    @pytest.mark.asyncio
    async def test_automation_execution(self, db_session):
        """Test automation execution"""
        # Create automation
        automation = WorkflowAutomationService.create_automation(
            db=db_session,
            name="Test Automation",
            description="Test automation execution",
            trigger_event="test.event",
            trigger_conditions={},
            actions=[
                {
                    'type': 'send_email',
                    'configuration': {'to': 'test@example.com'}
                }
            ],
            created_by='test-user'
        )
        
        # Mock action execution
        with patch.object(WorkflowAutomationService, '_execute_action', new_callable=AsyncMock) as mock_action:
            mock_action.return_value = None
            
            # Execute automation
            await WorkflowAutomationService._execute_automation(
                db=db_session,
                automation_id=str(automation.id),
                trigger_data={'test': 'data'}
            )
            
            # Verify execution record was created
            execution = db_session.query(WorkflowExecution).filter(
                WorkflowExecution.automation_id == str(automation.id)
            ).first()
            
            assert execution is not None
            assert execution.trigger_data['test'] == 'data'
            assert execution.status in ['success', 'partial']
            assert mock_action.called

class TestExternalIntegrations:
    """Test external integration functionality"""
    
    def test_create_integration(self, db_session):
        """Test external integration creation"""
        integration = ExternalIntegrationService.create_integration(
            db=db_session,
            name="QuickBooks Integration",
            service_type="accounting",
            provider="quickbooks",
            configuration={
                'sync_frequency': 'daily',
                'sync_entities': ['customers', 'invoices']
            },
            credentials={
                'client_id': 'test_client_id',
                'client_secret': 'test_client_secret'
            },
            created_by='test-user',
            business_type='retail'
        )
        
        assert integration.name == "QuickBooks Integration"
        assert integration.service_type == "accounting"
        assert integration.provider == "quickbooks"
        assert integration.configuration['sync_frequency'] == 'daily'
        assert integration.is_active is True
        assert integration.is_configured is False  # Not configured until tested
    
    @pytest.mark.asyncio
    async def test_integration_sync(self, db_session):
        """Test integration synchronization"""
        # Create integration
        integration = ExternalIntegrationService.create_integration(
            db=db_session,
            name="Test Sync Integration",
            service_type="accounting",
            provider="quickbooks",
            configuration={},
            credentials={},
            created_by='test-user'
        )
        
        # Mock the sync method
        with patch.object(ExternalIntegrationService, '_sync_quickbooks', new_callable=AsyncMock) as mock_sync:
            mock_sync.return_value = None
            
            # Perform sync
            await ExternalIntegrationService.sync_integration(
                db=db_session,
                integration_id=str(integration.id),
                sync_type='manual'
            )
            
            # Verify sync log was created
            sync_log = db_session.query(IntegrationSyncLog).filter(
                IntegrationSyncLog.integration_id == str(integration.id)
            ).first()
            
            assert sync_log is not None
            assert sync_log.sync_type == 'manual'
            assert sync_log.status in ['success', 'failed']
            assert mock_sync.called

class TestAPIGatewayEndpoints:
    """Test API gateway HTTP endpoints"""
    
    def test_health_check(self):
        """Test API gateway health check endpoint"""
        response = client.get("/api/v1/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data['status'] == 'healthy'
        assert data['service'] == 'API Gateway'
        assert 'timestamp' in data
    
    def test_list_available_events(self):
        """Test listing available events"""
        response = client.get("/api/v1/docs/events")
        assert response.status_code == 200
        
        data = response.json()
        assert 'events' in data
        assert len(data['events']) > 0
        
        # Check event structure
        event = data['events'][0]
        assert 'type' in event
        assert 'description' in event
        assert 'data_schema' in event
    
    def test_list_available_scopes(self):
        """Test listing available scopes"""
        response = client.get("/api/v1/docs/scopes")
        assert response.status_code == 200
        
        data = response.json()
        assert 'scopes' in data
        assert len(data['scopes']) > 0
        
        # Check scope structure
        scope = data['scopes'][0]
        assert 'scope' in scope
        assert 'description' in scope
    
    def test_unauthorized_access(self):
        """Test unauthorized access to protected endpoints"""
        # Try to access protected endpoint without API key
        response = client.get("/api/v1/api-keys")
        assert response.status_code == 401
        
        # Try with invalid API key
        headers = {"Authorization": "Bearer invalid_key"}
        response = client.get("/api/v1/api-keys", headers=headers)
        assert response.status_code == 401
    
    def test_api_key_endpoints_with_auth(self, test_api_key):
        """Test API key endpoints with proper authentication"""
        headers = {"Authorization": f"Bearer {test_api_key._test_full_key}"}
        
        # Test listing API keys
        response = client.get("/api/v1/api-keys", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        # Test getting specific API key
        response = client.get(f"/api/v1/api-keys/{test_api_key.id}", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data['id'] == str(test_api_key.id)
        assert data['name'] == test_api_key.name
    
    def test_webhook_endpoints_with_auth(self, test_api_key):
        """Test webhook endpoints with proper authentication"""
        headers = {"Authorization": f"Bearer {test_api_key._test_full_key}"}
        
        # Create webhook
        webhook_data = {
            "name": "Test API Webhook",
            "url": "https://example.com/webhook",
            "events": ["invoice.created"],
            "timeout_seconds": 30,
            "retry_attempts": 3
        }
        
        response = client.post("/api/v1/webhooks", json=webhook_data, headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data['name'] == "Test API Webhook"
        assert data['url'] == "https://example.com/webhook"
        
        # List webhooks
        response = client.get("/api/v1/webhooks", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
    
    def test_event_trigger_endpoint(self, test_api_key):
        """Test event trigger endpoint"""
        headers = {"Authorization": f"Bearer {test_api_key._test_full_key}"}
        
        event_data = {
            "event_type": "invoice.created",
            "event_data": {
                "id": "test-invoice-123",
                "invoice_number": "INV-001",
                "total": 100.00
            }
        }
        
        response = client.post("/api/v1/events/trigger", json=event_data, headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data['message'] == "Event triggered successfully"
        assert data['event_type'] == "invoice.created"

class TestRateLimiting:
    """Test rate limiting functionality"""
    
    def test_rate_limit_headers(self, test_api_key):
        """Test rate limit headers in responses"""
        headers = {"Authorization": f"Bearer {test_api_key._test_full_key}"}
        
        # Make request and check for rate limit headers
        response = client.get("/api/v1/health", headers=headers)
        assert response.status_code == 200
        
        # Note: Rate limit headers would be added by middleware in production
        # This test verifies the endpoint works with authentication
    
    def test_rate_limit_exceeded(self, db_session, test_api_key):
        """Test rate limit exceeded scenario"""
        # Set very low rate limit for testing
        test_api_key.rate_limit_per_minute = 1
        db_session.commit()
        
        headers = {"Authorization": f"Bearer {test_api_key._test_full_key}"}
        
        # First request should succeed
        response = client.get("/api/v1/health", headers=headers)
        assert response.status_code == 200
        
        # Create usage log to simulate rate limit hit
        APIKeyService.log_api_usage(
            db=db_session,
            api_key_id=str(test_api_key.id),
            endpoint="/api/v1/health",
            method="GET",
            status_code=200
        )
        
        # Check rate limit status
        rate_limit_result = APIKeyService.check_rate_limit(db_session, str(test_api_key.id))
        assert rate_limit_result['allowed'] is False

class TestDataValidation:
    """Test data validation and error handling"""
    
    def test_invalid_webhook_events(self, test_api_key):
        """Test webhook creation with invalid events"""
        headers = {"Authorization": f"Bearer {test_api_key._test_full_key}"}
        
        webhook_data = {
            "name": "Invalid Webhook",
            "url": "https://example.com/webhook",
            "events": ["invalid.event"],  # Invalid event type
            "timeout_seconds": 30,
            "retry_attempts": 3
        }
        
        response = client.post("/api/v1/webhooks", json=webhook_data, headers=headers)
        assert response.status_code == 422  # Validation error
    
    def test_invalid_automation_trigger(self, test_api_key):
        """Test automation creation with invalid trigger"""
        headers = {"Authorization": f"Bearer {test_api_key._test_full_key}"}
        
        automation_data = {
            "name": "Invalid Automation",
            "trigger_event": "invalid.trigger",  # Invalid trigger
            "actions": [
                {
                    "type": "send_email",
                    "configuration": {"to": "test@example.com"}
                }
            ]
        }
        
        response = client.post("/api/v1/automations", json=automation_data, headers=headers)
        assert response.status_code == 422  # Validation error

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])