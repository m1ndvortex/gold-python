"""
SMS Module Tests

Comprehensive tests for SMS functionality including:
- SMS template management
- Campaign creation and management
- Batch SMS sending
- Delivery status tracking
- SMS history and statistics
- Retry mechanism

🐳 DOCKER REQUIREMENT: All tests use real PostgreSQL database in Docker
"""

import pytest
import asyncio
from datetime import datetime, timedelta
from uuid import uuid4
from sqlalchemy.orm import Session
from fastapi.testclient import TestClient

from main import app
from database import get_db
from models import (
    User, Role, Customer, SMSTemplate, SMSCampaign, SMSMessage
)
from schemas import (
    SMSTemplateCreate, SMSTemplateUpdate, SMSCampaignCreate,
    SMSBatchRequest, SMSDeliveryStatusUpdate, SMSRetryRequest
)
from services.sms_service import SMSService, SMSGatewayError

client = TestClient(app)

class TestSMSTemplateManagement:
    """Test SMS template CRUD operations"""
    
    def test_create_sms_template(self, db_session: Session, test_user_with_sms_permission):
        """Test creating SMS template"""
        sms_service = SMSService(db_session)
        
        template_data = SMSTemplateCreate(
            name="Debt Reminder Template",
            template_type="debt_reminder",
            message_template="Dear {customer_name}, your current debt is {debt_amount}. Please contact us.",
            is_active=True
        )
        
        template = sms_service.create_template(template_data)
        
        assert template.id is not None
        assert template.name == "Debt Reminder Template"
        assert template.template_type == "debt_reminder"
        assert "{customer_name}" in template.message_template
        assert template.is_active is True
        
        # Verify in database
        db_template = db_session.query(SMSTemplate).filter(SMSTemplate.id == template.id).first()
        assert db_template is not None
        assert db_template.name == template_data.name
    
    def test_get_sms_templates(self, db_session: Session, test_user_with_sms_permission):
        """Test retrieving SMS templates"""
        sms_service = SMSService(db_session)
        
        # Create test templates
        promotional_template = SMSTemplateCreate(
            name="Promotional Template",
            template_type="promotional",
            message_template="Special offer for {customer_name}! Visit our store today.",
            is_active=True
        )
        
        debt_template = SMSTemplateCreate(
            name="Debt Template",
            template_type="debt_reminder",
            message_template="Dear {customer_name}, please pay {debt_amount}.",
            is_active=True
        )
        
        inactive_template = SMSTemplateCreate(
            name="Inactive Template",
            template_type="promotional",
            message_template="Old template",
            is_active=False
        )
        
        sms_service.create_template(promotional_template)
        sms_service.create_template(debt_template)
        sms_service.create_template(inactive_template)
        
        # Test get all active templates
        active_templates = sms_service.get_templates(active_only=True)
        assert len(active_templates) == 2
        
        # Test get all templates including inactive
        all_templates = sms_service.get_templates(active_only=False)
        assert len(all_templates) == 3
        
        # Test filter by type
        promotional_templates = sms_service.get_templates(template_type="promotional", active_only=True)
        assert len(promotional_templates) == 1
        assert promotional_templates[0].template_type == "promotional"
    
    def test_update_sms_template(self, db_session: Session, test_user_with_sms_permission):
        """Test updating SMS template"""
        sms_service = SMSService(db_session)
        
        # Create template
        template_data = SMSTemplateCreate(
            name="Original Template",
            template_type="promotional",
            message_template="Original message",
            is_active=True
        )
        
        template = sms_service.create_template(template_data)
        
        # Update template
        update_data = SMSTemplateUpdate(
            name="Updated Template",
            message_template="Updated message for {customer_name}",
            is_active=False
        )
        
        updated_template = sms_service.update_template(template.id, update_data)
        
        assert updated_template is not None
        assert updated_template.name == "Updated Template"
        assert updated_template.message_template == "Updated message for {customer_name}"
        assert updated_template.is_active is False
        assert updated_template.template_type == "promotional"  # Should remain unchanged
    
    def test_delete_sms_template(self, db_session: Session, test_user_with_sms_permission):
        """Test soft deleting SMS template"""
        sms_service = SMSService(db_session)
        
        # Create template
        template_data = SMSTemplateCreate(
            name="Template to Delete",
            template_type="promotional",
            message_template="Test message",
            is_active=True
        )
        
        template = sms_service.create_template(template_data)
        
        # Delete template
        success = sms_service.delete_template(template.id)
        assert success is True
        
        # Verify soft delete
        db_template = db_session.query(SMSTemplate).filter(SMSTemplate.id == template.id).first()
        assert db_template is not None
        assert db_template.is_active is False
    
    def test_template_processing(self, db_session: Session, test_customer, test_user_with_sms_permission):
        """Test SMS template variable processing"""
        sms_service = SMSService(db_session)
        
        # Create template with variables
        template_data = SMSTemplateCreate(
            name="Variable Template",
            template_type="debt_reminder",
            message_template="Dear {customer_name}, your debt is {debt_amount}. Contact us at {company_name}.",
            is_active=True
        )
        
        template = sms_service.create_template(template_data)
        
        # Test preview with customer data
        preview_message = sms_service.preview_template(template.id, test_customer.id)
        
        assert preview_message is not None
        assert test_customer.name in preview_message
        assert str(float(test_customer.current_debt)) in preview_message
        assert "{customer_name}" not in preview_message  # Should be replaced
        assert "{debt_amount}" not in preview_message  # Should be replaced

class TestSMSCampaignManagement:
    """Test SMS campaign operations"""
    
    def test_create_sms_campaign(self, db_session: Session, test_customers, test_user_with_sms_permission):
        """Test creating SMS campaign"""
        sms_service = SMSService(db_session)
        
        # Create template
        template_data = SMSTemplateCreate(
            name="Campaign Template",
            template_type="promotional",
            message_template="Hello {customer_name}! Special offer today.",
            is_active=True
        )
        template = sms_service.create_template(template_data)
        
        # Create campaign
        campaign_data = SMSCampaignCreate(
            name="Test Campaign",
            template_id=template.id,
            message_content="Hello! Special offer today.",
            customer_ids=[customer.id for customer in test_customers[:3]]
        )
        
        campaign = sms_service.create_campaign(campaign_data, test_user_with_sms_permission.id)
        
        assert campaign.id is not None
        assert campaign.name == "Test Campaign"
        assert campaign.total_recipients == 3
        assert campaign.status == "pending"
        assert campaign.created_by == test_user_with_sms_permission.id
        
        # Verify SMS messages were created
        messages = db_session.query(SMSMessage).filter(SMSMessage.campaign_id == campaign.id).all()
        assert len(messages) == 3
        
        for message in messages:
            assert message.status == "pending"
            assert message.phone_number is not None
            assert "Hello" in message.message_content
    
    def test_campaign_batch_size_limit(self, db_session: Session, test_user_with_sms_permission):
        """Test campaign batch size validation"""
        sms_service = SMSService(db_session)
        
        # Create too many customer IDs
        customer_ids = [uuid4() for _ in range(101)]
        
        campaign_data = SMSCampaignCreate(
            name="Large Campaign",
            message_content="Test message",
            customer_ids=customer_ids
        )
        
        with pytest.raises(ValueError, match="Batch size cannot exceed 100"):
            sms_service.create_campaign(campaign_data, test_user_with_sms_permission.id)
    
    def test_get_campaigns(self, db_session: Session, test_customers, test_user_with_sms_permission):
        """Test retrieving campaigns"""
        sms_service = SMSService(db_session)
        
        # Create multiple campaigns
        for i in range(3):
            campaign_data = SMSCampaignCreate(
                name=f"Campaign {i}",
                message_content=f"Message {i}",
                customer_ids=[test_customers[0].id]
            )
            campaign = sms_service.create_campaign(campaign_data, test_user_with_sms_permission.id)
            
            if i == 1:  # Set one campaign to completed
                campaign.status = "completed"
                db_session.commit()
        
        # Test get all campaigns
        all_campaigns = sms_service.get_campaigns(created_by=test_user_with_sms_permission.id)
        assert len(all_campaigns) == 3
        
        # Test filter by status
        pending_campaigns = sms_service.get_campaigns(
            created_by=test_user_with_sms_permission.id, 
            status="pending"
        )
        assert len(pending_campaigns) == 2
        
        completed_campaigns = sms_service.get_campaigns(
            created_by=test_user_with_sms_permission.id, 
            status="completed"
        )
        assert len(completed_campaigns) == 1

class TestSMSSending:
    """Test SMS sending functionality"""
    
    @pytest.mark.asyncio
    async def test_send_campaign_success(self, db_session: Session, test_customers, test_user_with_sms_permission):
        """Test successful SMS campaign sending"""
        sms_service = SMSService(db_session)
        
        # Create campaign
        campaign_data = SMSCampaignCreate(
            name="Send Test Campaign",
            message_content="Test SMS message",
            customer_ids=[customer.id for customer in test_customers[:2]]
        )
        
        campaign = sms_service.create_campaign(campaign_data, test_user_with_sms_permission.id)
        
        # Send campaign (will simulate sending since no real SMS API key)
        result = await sms_service.send_campaign(campaign.id)
        
        assert result["campaign_id"] == campaign.id
        assert result["total_recipients"] == 2
        assert result["sent_count"] == 2
        assert result["failed_count"] == 0
        assert result["status"] == "completed"
        
        # Verify campaign status updated
        db_session.refresh(campaign)
        assert campaign.status == "completed"
        assert campaign.sent_count == 2
        assert campaign.failed_count == 0
        
        # Verify message statuses
        messages = db_session.query(SMSMessage).filter(SMSMessage.campaign_id == campaign.id).all()
        for message in messages:
            assert message.status == "sent"
            assert message.sent_at is not None
            assert message.gateway_message_id is not None
    
    @pytest.mark.asyncio
    async def test_send_campaign_invalid_status(self, db_session: Session, test_customers, test_user_with_sms_permission):
        """Test sending campaign with invalid status"""
        sms_service = SMSService(db_session)
        
        # Create and mark campaign as completed
        campaign_data = SMSCampaignCreate(
            name="Completed Campaign",
            message_content="Test message",
            customer_ids=[test_customers[0].id]
        )
        
        campaign = sms_service.create_campaign(campaign_data, test_user_with_sms_permission.id)
        campaign.status = "completed"
        db_session.commit()
        
        # Try to send completed campaign
        with pytest.raises(ValueError, match="Campaign is not in pending status"):
            await sms_service.send_campaign(campaign.id)
    
    @pytest.mark.asyncio
    async def test_retry_failed_messages(self, db_session: Session, test_customers, test_user_with_sms_permission):
        """Test retrying failed SMS messages"""
        sms_service = SMSService(db_session)
        
        # Create campaign
        campaign_data = SMSCampaignCreate(
            name="Retry Test Campaign",
            message_content="Test message",
            customer_ids=[customer.id for customer in test_customers[:2]]
        )
        
        campaign = sms_service.create_campaign(campaign_data, test_user_with_sms_permission.id)
        
        # Mark some messages as failed
        messages = db_session.query(SMSMessage).filter(SMSMessage.campaign_id == campaign.id).all()
        messages[0].status = "failed"
        messages[0].error_message = "Network error"
        messages[1].status = "sent"  # This should not be retried
        db_session.commit()
        
        # Retry failed messages
        result = await sms_service.retry_failed_messages(campaign_id=campaign.id)
        
        assert result["retried_messages"] == 1
        assert result["skipped_messages"] == 0
        
        # Verify retry count updated
        db_session.refresh(messages[0])
        assert messages[0].retry_count == 1
        assert messages[0].status == "sent"  # Should be sent after retry

class TestSMSDeliveryTracking:
    """Test SMS delivery status tracking"""
    
    def test_update_delivery_status(self, db_session: Session, test_customers, test_user_with_sms_permission):
        """Test updating SMS delivery status"""
        sms_service = SMSService(db_session)
        
        # Create campaign and message
        campaign_data = SMSCampaignCreate(
            name="Delivery Test Campaign",
            message_content="Test message",
            customer_ids=[test_customers[0].id]
        )
        
        campaign = sms_service.create_campaign(campaign_data, test_user_with_sms_permission.id)
        message = db_session.query(SMSMessage).filter(SMSMessage.campaign_id == campaign.id).first()
        
        # Set gateway message ID
        message.gateway_message_id = "gw_msg_123"
        message.status = "sent"
        db_session.commit()
        
        # Update delivery status
        status_update = SMSDeliveryStatusUpdate(
            gateway_message_id="gw_msg_123",
            delivery_status="delivered",
            delivered_at=datetime.utcnow()
        )
        
        success = sms_service.update_delivery_status(status_update)
        assert success is True
        
        # Verify status updated
        db_session.refresh(message)
        assert message.delivery_status == "delivered"
        assert message.delivered_at is not None
    
    def test_update_delivery_status_not_found(self, db_session: Session):
        """Test updating delivery status for non-existent message"""
        sms_service = SMSService(db_session)
        
        status_update = SMSDeliveryStatusUpdate(
            gateway_message_id="non_existent_id",
            delivery_status="delivered"
        )
        
        success = sms_service.update_delivery_status(status_update)
        assert success is False

class TestSMSHistoryAndStatistics:
    """Test SMS history and statistics functionality"""
    
    def test_get_sms_history(self, db_session: Session, test_customers, test_user_with_sms_permission):
        """Test retrieving SMS history"""
        sms_service = SMSService(db_session)
        
        # Create multiple campaigns
        campaign1_data = SMSCampaignCreate(
            name="Campaign 1",
            message_content="Message 1",
            customer_ids=[test_customers[0].id, test_customers[1].id]
        )
        
        campaign2_data = SMSCampaignCreate(
            name="Campaign 2",
            message_content="Message 2",
            customer_ids=[test_customers[0].id]
        )
        
        campaign1 = sms_service.create_campaign(campaign1_data, test_user_with_sms_permission.id)
        campaign2 = sms_service.create_campaign(campaign2_data, test_user_with_sms_permission.id)
        
        # Set different statuses
        messages1 = db_session.query(SMSMessage).filter(SMSMessage.campaign_id == campaign1.id).all()
        messages2 = db_session.query(SMSMessage).filter(SMSMessage.campaign_id == campaign2.id).all()
        
        messages1[0].status = "sent"
        messages1[1].status = "failed"
        messages2[0].status = "sent"
        db_session.commit()
        
        # Test get all history
        all_history = sms_service.get_sms_history()
        assert all_history["total"] == 3
        assert len(all_history["messages"]) == 3
        
        # Test filter by campaign
        campaign1_history = sms_service.get_sms_history(campaign_id=campaign1.id)
        assert campaign1_history["total"] == 2
        
        # Test filter by customer
        customer1_history = sms_service.get_sms_history(customer_id=test_customers[0].id)
        assert customer1_history["total"] == 2  # Customer 1 is in both campaigns
        
        # Test filter by status
        sent_history = sms_service.get_sms_history(status="sent")
        assert sent_history["total"] == 2
        
        failed_history = sms_service.get_sms_history(status="failed")
        assert failed_history["total"] == 1
        
        # Test pagination
        page1 = sms_service.get_sms_history(page=1, per_page=2)
        assert len(page1["messages"]) == 2
        assert page1["page"] == 1
        assert page1["total_pages"] == 2
        
        page2 = sms_service.get_sms_history(page=2, per_page=2)
        assert len(page2["messages"]) == 1
        assert page2["page"] == 2
    
    def test_get_campaign_statistics(self, db_session: Session, test_customers, test_user_with_sms_permission):
        """Test campaign statistics"""
        sms_service = SMSService(db_session)
        
        # Create campaign
        campaign_data = SMSCampaignCreate(
            name="Stats Test Campaign",
            message_content="Test message",
            customer_ids=[customer.id for customer in test_customers[:4]]
        )
        
        campaign = sms_service.create_campaign(campaign_data, test_user_with_sms_permission.id)
        
        # Set different message statuses
        messages = db_session.query(SMSMessage).filter(SMSMessage.campaign_id == campaign.id).all()
        messages[0].status = "sent"
        messages[0].delivery_status = "delivered"
        messages[1].status = "sent"
        messages[1].delivery_status = "delivered"
        messages[2].status = "failed"
        messages[3].status = "pending"
        db_session.commit()
        
        # Get statistics
        stats = sms_service.get_campaign_statistics(campaign.id)
        
        assert stats is not None
        assert stats["campaign_id"] == campaign.id
        assert stats["campaign_name"] == "Stats Test Campaign"
        assert stats["total_recipients"] == 4
        assert stats["sent_count"] == 2
        assert stats["failed_count"] == 1
        assert stats["pending_count"] == 1
        assert stats["delivered_count"] == 2
        assert stats["success_rate"] == 50.0  # 2/4 * 100
        assert stats["delivery_rate"] == 50.0  # 2/4 * 100
    
    def test_get_overall_statistics(self, db_session: Session, test_customers, test_user_with_sms_permission):
        """Test overall SMS statistics"""
        sms_service = SMSService(db_session)
        
        # Create multiple campaigns
        for i in range(3):
            campaign_data = SMSCampaignCreate(
                name=f"Overall Stats Campaign {i}",
                message_content=f"Message {i}",
                customer_ids=[test_customers[0].id, test_customers[1].id]
            )
            sms_service.create_campaign(campaign_data, test_user_with_sms_permission.id)
        
        # Set some messages as sent and delivered
        all_messages = db_session.query(SMSMessage).all()
        for i, message in enumerate(all_messages):
            if i % 2 == 0:
                message.status = "sent"
                message.delivery_status = "delivered"
            else:
                message.status = "failed"
        db_session.commit()
        
        # Get overall statistics
        stats = sms_service.get_overall_statistics()
        
        assert stats["total_campaigns"] == 3
        assert stats["total_messages_sent"] == 3  # Half of 6 messages
        assert stats["total_messages_delivered"] == 3
        assert stats["overall_success_rate"] == 50.0
        assert stats["overall_delivery_rate"] == 50.0
        assert len(stats["recent_campaigns"]) <= 5

class TestSMSAPIEndpoints:
    """Test SMS API endpoints"""
    
    def test_create_template_endpoint(self, test_user_with_sms_permission):
        """Test SMS template creation endpoint"""
        # Login to get token
        login_response = client.post("/api/auth/login", json={
            "username": test_user_with_sms_permission.username,
            "password": "testpass123"
        })
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Create template
        template_data = {
            "name": "API Test Template",
            "template_type": "promotional",
            "message_template": "Hello {customer_name}!",
            "is_active": True
        }
        
        response = client.post("/api/sms/templates", json=template_data, headers=headers)
        assert response.status_code == 200
        
        result = response.json()
        assert result["name"] == "API Test Template"
        assert result["template_type"] == "promotional"
    
    def test_get_templates_endpoint(self, test_user_with_sms_permission):
        """Test get SMS templates endpoint"""
        # Login to get token
        login_response = client.post("/api/auth/login", json={
            "username": test_user_with_sms_permission.username,
            "password": "testpass123"
        })
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get templates
        response = client.get("/api/sms/templates", headers=headers)
        assert response.status_code == 200
        
        templates = response.json()
        assert isinstance(templates, list)
    
    def test_send_batch_sms_endpoint(self, test_user_with_sms_permission, test_customers):
        """Test batch SMS sending endpoint"""
        # Login to get token
        login_response = client.post("/api/auth/login", json={
            "username": test_user_with_sms_permission.username,
            "password": "testpass123"
        })
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Send batch SMS
        batch_data = {
            "campaign_name": "API Batch Test",
            "message_content": "Test batch message",
            "customer_ids": [str(customer.id) for customer in test_customers[:2]]
        }
        
        response = client.post("/api/sms/send-batch", json=batch_data, headers=headers)
        assert response.status_code == 200
        
        result = response.json()
        assert result["total_recipients"] == 2
        assert result["status"] == "sending"
    
    def test_unauthorized_access(self):
        """Test unauthorized access to SMS endpoints"""
        response = client.get("/api/sms/templates")
        assert response.status_code == 401
        
        response = client.post("/api/sms/templates", json={})
        assert response.status_code == 401

# Fixtures for SMS tests

@pytest.fixture
def test_user_with_sms_permission(db_session: Session):
    """Create test user with SMS permissions"""
    # Create role with SMS permission
    role = Role(
        name="SMS Manager",
        description="Can send SMS",
        permissions={"send_sms": True, "view_customers": True}
    )
    db_session.add(role)
    db_session.commit()
    
    # Create user
    user = User(
        username="sms_user",
        email="sms@test.com",
        password_hash="$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3L3jzjvG4e",  # testpass123
        role_id=role.id,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    
    return user

@pytest.fixture
def test_customers(db_session: Session):
    """Create test customers with phone numbers"""
    customers = []
    for i in range(5):
        customer = Customer(
            name=f"Test Customer {i+1}",
            phone=f"+1234567890{i}",
            email=f"customer{i+1}@test.com",
            current_debt=100.0 * (i + 1),
            total_purchases=1000.0 * (i + 1)
        )
        db_session.add(customer)
        customers.append(customer)
    
    db_session.commit()
    
    for customer in customers:
        db_session.refresh(customer)
    
    return customers

@pytest.fixture
def test_customer(test_customers):
    """Single test customer"""
    return test_customers[0]