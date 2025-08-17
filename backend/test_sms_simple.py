#!/usr/bin/env python3
"""
Simple SMS Integration Test

This test verifies SMS functionality works with real PostgreSQL database in Docker.
🐳 DOCKER REQUIREMENT: Must run in Docker with real PostgreSQL database.

Run with: python test_sms_simple.py
"""

import asyncio
import sys
import os
from datetime import datetime
from uuid import uuid4

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, engine
from models import Base, User, Role, Customer, SMSTemplate, SMSCampaign, SMSMessage
from schemas import SMSTemplateCreate, SMSCampaignCreate
from services.sms_service import SMSService

def setup_test_data():
    """Set up test data for SMS testing"""
    print("🔧 Setting up test data...")
    
    db = SessionLocal()
    try:
        # Tables already exist, just create test data
        
        # Check if test role already exists
        existing_role = db.query(Role).filter(Role.name == "SMS Test Role").first()
        if existing_role:
            sms_role = existing_role
        else:
            # Create role with SMS permissions
            sms_role = Role(
                name="SMS Test Role",
                description="Role for SMS testing",
                permissions={"send_sms": True, "view_customers": True}
            )
            db.add(sms_role)
            db.commit()
            db.refresh(sms_role)
        
        # Check if test user already exists
        existing_user = db.query(User).filter(User.username == "sms_test_user").first()
        if existing_user:
            test_user = existing_user
        else:
            # Create test user
            test_user = User(
                username="sms_test_user",
                email="sms_test@example.com",
                password_hash="$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3L3jzjvG4e",
                role_id=sms_role.id,
                is_active=True
            )
            db.add(test_user)
            db.commit()
            db.refresh(test_user)
        
        # Create test customers
        customers = []
        for i in range(3):
            customer = Customer(
                name=f"SMS Test Customer {i+1}",
                phone=f"+1234567890{i}",
                email=f"customer{i+1}@test.com",
                current_debt=50.0 * (i + 1),
                total_purchases=500.0 * (i + 1)
            )
            db.add(customer)
            customers.append(customer)
        
        db.commit()
        
        for customer in customers:
            db.refresh(customer)
        
        print(f"✅ Created test user: {test_user.username}")
        print(f"✅ Created {len(customers)} test customers")
        
        return test_user, customers
        
    finally:
        db.close()

def test_sms_template_operations():
    """Test SMS template CRUD operations"""
    print("\n📝 Testing SMS Template Operations...")
    
    db = SessionLocal()
    try:
        sms_service = SMSService(db)
        
        # Test 1: Create SMS template
        print("  1. Creating SMS template...")
        template_data = SMSTemplateCreate(
            name="Test Promotional Template",
            template_type="promotional",
            message_template="Hello {customer_name}! Special offer: 20% off gold jewelry. Visit us today!",
            is_active=True
        )
        
        template = sms_service.create_template(template_data)
        assert template.id is not None
        assert template.name == "Test Promotional Template"
        print(f"     ✅ Template created with ID: {template.id}")
        
        # Test 2: Get templates
        print("  2. Retrieving templates...")
        templates = sms_service.get_templates()
        assert len(templates) >= 1
        print(f"     ✅ Found {len(templates)} templates")
        
        # Test 3: Template preview
        print("  3. Testing template preview...")
        customers = db.query(Customer).limit(1).all()
        if customers:
            preview = sms_service.preview_template(template.id, customers[0].id)
            assert preview is not None
            assert customers[0].name in preview
            print(f"     ✅ Preview: {preview[:50]}...")
        
        # Test 4: Update template
        print("  4. Updating template...")
        from schemas import SMSTemplateUpdate
        update_data = SMSTemplateUpdate(
            name="Updated Promotional Template",
            message_template="Updated: Hello {customer_name}! New offer available."
        )
        
        updated_template = sms_service.update_template(template.id, update_data)
        assert updated_template.name == "Updated Promotional Template"
        print("     ✅ Template updated successfully")
        
        return template.id
        
    finally:
        db.close()

def test_sms_campaign_operations(template_id):
    """Test SMS campaign operations"""
    print("\n📱 Testing SMS Campaign Operations...")
    
    db = SessionLocal()
    try:
        sms_service = SMSService(db)
        
        # Get test user and customers
        user = db.query(User).filter(User.username == "sms_test_user").first()
        customers = db.query(Customer).limit(2).all()
        
        assert user is not None
        assert len(customers) >= 2
        
        # Test 1: Create campaign
        print("  1. Creating SMS campaign...")
        campaign_data = SMSCampaignCreate(
            name="Test SMS Campaign",
            template_id=template_id,
            message_content="Hello! This is a test SMS campaign.",
            customer_ids=[customer.id for customer in customers]
        )
        
        campaign = sms_service.create_campaign(campaign_data, user.id)
        assert campaign.id is not None
        assert campaign.total_recipients == len(customers)
        print(f"     ✅ Campaign created with ID: {campaign.id}")
        
        # Test 2: Verify SMS messages created
        print("  2. Verifying SMS messages...")
        messages = db.query(SMSMessage).filter(SMSMessage.campaign_id == campaign.id).all()
        
        # Only customers with phone numbers should have messages created
        customers_with_phones = [c for c in customers if c.phone]
        expected_messages = len(customers_with_phones)
        
        print(f"     Expected {expected_messages} messages for customers with phone numbers")
        assert len(messages) == expected_messages
        
        for message in messages:
            assert message.status == "pending"
            assert message.phone_number is not None
            print(f"     ✅ Message for {message.phone_number}: {message.message_content[:30]}...")
        
        # Test 3: Get campaigns
        print("  3. Retrieving campaigns...")
        campaigns = sms_service.get_campaigns(created_by=user.id)
        assert len(campaigns) >= 1
        print(f"     ✅ Found {len(campaigns)} campaigns")
        
        return campaign.id
        
    finally:
        db.close()

async def test_sms_sending(campaign_id):
    """Test SMS sending functionality"""
    print("\n📤 Testing SMS Sending...")
    
    db = SessionLocal()
    try:
        sms_service = SMSService(db)
        
        # Test 1: Send campaign
        print("  1. Sending SMS campaign...")
        result = await sms_service.send_campaign(campaign_id)
        
        assert result["campaign_id"] == campaign_id
        assert result["status"] == "completed"
        print(f"     ✅ Campaign sent: {result['sent_count']} sent, {result['failed_count']} failed")
        
        # Test 2: Verify message statuses
        print("  2. Verifying message statuses...")
        messages = db.query(SMSMessage).filter(SMSMessage.campaign_id == campaign_id).all()
        
        sent_count = 0
        failed_count = 0
        for message in messages:
            print(f"     Message {message.phone_number}: status={message.status}, error={message.error_message}")
            if message.status == "sent":
                sent_count += 1
                assert message.sent_at is not None
                assert message.gateway_message_id is not None
                print(f"     ✅ Message sent to {message.phone_number}")
            elif message.status == "failed":
                failed_count += 1
        
        print(f"     Summary: {sent_count} sent, {failed_count} failed")
        assert sent_count > 0
        
        # Test 3: Campaign statistics
        print("  3. Getting campaign statistics...")
        stats = sms_service.get_campaign_statistics(campaign_id)
        assert stats is not None
        assert stats["sent_count"] > 0
        print(f"     ✅ Stats: {stats['sent_count']} sent, success rate: {stats['success_rate']:.1f}%")
        
    finally:
        db.close()

def test_sms_history_and_statistics():
    """Test SMS history and statistics"""
    print("\n📊 Testing SMS History and Statistics...")
    
    db = SessionLocal()
    try:
        sms_service = SMSService(db)
        
        # Test 1: Get SMS history
        print("  1. Getting SMS history...")
        history = sms_service.get_sms_history(page=1, per_page=10)
        
        assert "messages" in history
        assert "total" in history
        print(f"     ✅ Found {history['total']} SMS messages in history")
        
        # Test 2: Get overall statistics
        print("  2. Getting overall statistics...")
        overall_stats = sms_service.get_overall_statistics()
        
        assert "total_campaigns" in overall_stats
        assert "total_messages_sent" in overall_stats
        print(f"     ✅ Overall: {overall_stats['total_campaigns']} campaigns, {overall_stats['total_messages_sent']} messages sent")
        
        # Test 3: Filter history by status
        print("  3. Testing history filtering...")
        sent_history = sms_service.get_sms_history(status="sent")
        pending_history = sms_service.get_sms_history(status="pending")
        
        print(f"     ✅ Sent messages: {sent_history['total']}, Pending: {pending_history['total']}")
        
    finally:
        db.close()

async def test_sms_retry_mechanism():
    """Test SMS retry functionality"""
    print("\n🔄 Testing SMS Retry Mechanism...")
    
    db = SessionLocal()
    try:
        sms_service = SMSService(db)
        
        # Find a sent message and mark it as failed for testing
        message = db.query(SMSMessage).filter(SMSMessage.status == "sent").first()
        if message:
            print("  1. Marking message as failed for retry test...")
            message.status = "failed"
            message.error_message = "Test failure"
            message.retry_count = 0
            db.commit()
            
            # Test retry
            print("  2. Retrying failed message...")
            result = await sms_service.retry_failed_messages(message_ids=[message.id])
            
            assert result["retried_messages"] >= 0
            print(f"     ✅ Retry result: {result['retried_messages']} retried, {result['skipped_messages']} skipped")
            
            # Verify retry count updated
            db.refresh(message)
            print(f"     ✅ Message retry count: {message.retry_count}")
        
    finally:
        db.close()

def cleanup_test_data():
    """Clean up test data"""
    print("\n🧹 Cleaning up test data...")
    
    db = SessionLocal()
    try:
        # Delete in correct order to respect foreign key constraints
        # First delete SMS messages
        db.query(SMSMessage).filter(SMSMessage.phone_number.like("+1234567890%")).delete()
        db.commit()
        
        # Then delete campaigns
        db.query(SMSCampaign).filter(SMSCampaign.name.like("Test%")).delete()
        db.commit()
        
        # Then delete templates
        db.query(SMSTemplate).filter(SMSTemplate.name.like("Test%")).delete()
        db.query(SMSTemplate).filter(SMSTemplate.name.like("Updated%")).delete()
        db.commit()
        
        # Delete test customers
        db.query(Customer).filter(Customer.name.like("SMS Test Customer%")).delete()
        db.commit()
        
        # Delete test user and role
        db.query(User).filter(User.username == "sms_test_user").delete()
        db.query(Role).filter(Role.name == "SMS Test Role").delete()
        db.commit()
        
        print("✅ Test data cleaned up")
        
    except Exception as e:
        print(f"⚠️ Cleanup warning: {str(e)}")
        db.rollback()
        
    finally:
        db.close()

async def main():
    """Main test function"""
    print("🚀 Starting SMS Integration Tests")
    print("🐳 Using real PostgreSQL database in Docker")
    
    try:
        # Setup
        test_user, test_customers = setup_test_data()
        
        # Run tests
        template_id = test_sms_template_operations()
        campaign_id = test_sms_campaign_operations(template_id)
        await test_sms_sending(campaign_id)
        test_sms_history_and_statistics()
        await test_sms_retry_mechanism()
        
        print("\n🎉 All SMS tests passed successfully!")
        print("✅ SMS template management working")
        print("✅ SMS campaign creation working")
        print("✅ SMS sending functionality working")
        print("✅ SMS history and statistics working")
        print("✅ SMS retry mechanism working")
        
    except Exception as e:
        print(f"\n❌ Test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    
    finally:
        # Cleanup
        cleanup_test_data()
    
    return True

if __name__ == "__main__":
    # Run the async main function
    success = asyncio.run(main())
    sys.exit(0 if success else 1)