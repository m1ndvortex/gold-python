"""
SMS Service Module

This module handles SMS functionality including:
- SMS gateway integration
- Template processing
- Batch sending with retry mechanism
- Delivery status tracking
- Campaign management
"""

import asyncio
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
import httpx
import os
from uuid import UUID

from models import SMSTemplate, SMSCampaign, SMSMessage, Customer, User
from schemas import (
    SMSTemplateCreate, SMSTemplateUpdate, SMSCampaignCreate, SMSMessageCreate,
    SMSTemplateVariables, SMSBatchRequest, SMSDeliveryStatusUpdate
)

logger = logging.getLogger(__name__)

class SMSGatewayError(Exception):
    """Custom exception for SMS gateway errors"""
    pass

class SMSService:
    """Service class for SMS operations"""
    
    def __init__(self, db: Session):
        self.db = db
        self.sms_api_key = os.getenv("SMS_API_KEY")
        self.sms_gateway_url = os.getenv("SMS_GATEWAY_URL", "https://api.sms-gateway.com/v1")
        self.max_batch_size = 100
        self.max_retries = 3
        
    # Template Management
    def create_template(self, template_data: SMSTemplateCreate) -> SMSTemplate:
        """Create a new SMS template"""
        db_template = SMSTemplate(**template_data.model_dump())
        self.db.add(db_template)
        self.db.commit()
        self.db.refresh(db_template)
        return db_template
    
    def get_template(self, template_id: UUID) -> Optional[SMSTemplate]:
        """Get SMS template by ID"""
        return self.db.query(SMSTemplate).filter(SMSTemplate.id == template_id).first()
    
    def get_templates(self, template_type: Optional[str] = None, active_only: bool = True) -> List[SMSTemplate]:
        """Get all SMS templates with optional filtering"""
        query = self.db.query(SMSTemplate)
        
        if active_only:
            query = query.filter(SMSTemplate.is_active == True)
        
        if template_type:
            query = query.filter(SMSTemplate.template_type == template_type)
            
        return query.order_by(SMSTemplate.created_at.desc()).all()
    
    def update_template(self, template_id: UUID, template_data: SMSTemplateUpdate) -> Optional[SMSTemplate]:
        """Update SMS template"""
        db_template = self.get_template(template_id)
        if not db_template:
            return None
            
        update_data = template_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_template, field, value)
            
        self.db.commit()
        self.db.refresh(db_template)
        return db_template
    
    def delete_template(self, template_id: UUID) -> bool:
        """Delete SMS template (soft delete by setting is_active=False)"""
        db_template = self.get_template(template_id)
        if not db_template:
            return False
            
        db_template.is_active = False
        self.db.commit()
        return True
    
    # Template Processing
    def process_template(self, template: SMSTemplate, variables: SMSTemplateVariables) -> str:
        """Process SMS template with variables"""
        message = template.message_template
        
        # Replace template variables
        replacements = {
            '{customer_name}': variables.customer_name or '',
            '{debt_amount}': str(variables.debt_amount) if variables.debt_amount else '0',
            '{company_name}': variables.company_name or '',
            '{phone}': variables.phone or '',
            '{last_purchase_date}': variables.last_purchase_date or ''
        }
        
        for placeholder, value in replacements.items():
            message = message.replace(placeholder, value)
            
        return message
    
    def preview_template(self, template_id: UUID, customer_id: UUID) -> Optional[str]:
        """Preview template with customer data"""
        template = self.get_template(template_id)
        if not template:
            return None
            
        customer = self.db.query(Customer).filter(Customer.id == customer_id).first()
        if not customer:
            return None
            
        variables = SMSTemplateVariables(
            customer_name=customer.name,
            debt_amount=float(customer.current_debt) if customer.current_debt else 0,
            phone=customer.phone,
            last_purchase_date=customer.last_purchase_date.strftime('%Y-%m-%d') if customer.last_purchase_date else None
        )
        
        return self.process_template(template, variables)
    
    # Campaign Management
    def create_campaign(self, campaign_data: SMSCampaignCreate, created_by: UUID) -> SMSCampaign:
        """Create SMS campaign"""
        # Validate batch size
        if len(campaign_data.customer_ids) > self.max_batch_size:
            raise ValueError(f"Batch size cannot exceed {self.max_batch_size} recipients")
        
        # Create campaign
        db_campaign = SMSCampaign(
            name=campaign_data.name,
            template_id=campaign_data.template_id,
            message_content=campaign_data.message_content,
            total_recipients=len(campaign_data.customer_ids),
            created_by=created_by,
            status='pending'
        )
        
        self.db.add(db_campaign)
        self.db.commit()
        self.db.refresh(db_campaign)
        
        # Create individual SMS messages
        self._create_campaign_messages(db_campaign, campaign_data.customer_ids)
        
        return db_campaign
    
    def _create_campaign_messages(self, campaign: SMSCampaign, customer_ids: List[UUID]):
        """Create individual SMS messages for campaign"""
        template = None
        if campaign.template_id:
            template = self.get_template(campaign.template_id)
        
        for customer_id in customer_ids:
            customer = self.db.query(Customer).filter(Customer.id == customer_id).first()
            if not customer or not customer.phone:
                continue
                
            # Process message content
            message_content = campaign.message_content
            if template:
                variables = SMSTemplateVariables(
                    customer_name=customer.name,
                    debt_amount=float(customer.current_debt) if customer.current_debt else 0,
                    phone=customer.phone,
                    last_purchase_date=customer.last_purchase_date.strftime('%Y-%m-%d') if customer.last_purchase_date else None
                )
                message_content = self.process_template(template, variables)
            
            # Create SMS message
            sms_message = SMSMessage(
                campaign_id=campaign.id,
                customer_id=customer.id,
                phone_number=customer.phone,
                message_content=message_content,
                status='pending'
            )
            
            self.db.add(sms_message)
        
        self.db.commit()
    
    def get_campaign(self, campaign_id: UUID) -> Optional[SMSCampaign]:
        """Get SMS campaign by ID"""
        return self.db.query(SMSCampaign).filter(SMSCampaign.id == campaign_id).first()
    
    def get_campaigns(self, created_by: Optional[UUID] = None, status: Optional[str] = None) -> List[SMSCampaign]:
        """Get SMS campaigns with optional filtering"""
        query = self.db.query(SMSCampaign)
        
        if created_by:
            query = query.filter(SMSCampaign.created_by == created_by)
        
        if status:
            query = query.filter(SMSCampaign.status == status)
            
        return query.order_by(SMSCampaign.created_at.desc()).all()
    
    # SMS Sending
    async def send_campaign(self, campaign_id: UUID) -> Dict[str, Any]:
        """Send SMS campaign asynchronously"""
        campaign = self.get_campaign(campaign_id)
        if not campaign:
            raise ValueError("Campaign not found")
        
        if campaign.status != 'pending':
            raise ValueError("Campaign is not in pending status")
        
        # Update campaign status
        campaign.status = 'sending'
        self.db.commit()
        
        try:
            # Get pending messages
            messages = self.db.query(SMSMessage).filter(
                and_(
                    SMSMessage.campaign_id == campaign_id,
                    SMSMessage.status == 'pending'
                )
            ).all()
            
            # Send messages in batches
            sent_count = 0
            failed_count = 0
            
            for message in messages:
                try:
                    success = await self._send_single_sms(message)
                    if success:
                        sent_count += 1
                        message.status = 'sent'
                        message.sent_at = datetime.utcnow()
                    else:
                        failed_count += 1
                        message.status = 'failed'
                        
                except Exception as e:
                    logger.error(f"Failed to send SMS to {message.phone_number}: {str(e)}")
                    failed_count += 1
                    message.status = 'failed'
                    message.error_message = str(e)
                
                self.db.commit()
                
                # Small delay to avoid overwhelming the gateway
                await asyncio.sleep(0.1)
            
            # Update campaign statistics
            campaign.sent_count = sent_count
            campaign.failed_count = failed_count
            campaign.status = 'completed'
            self.db.commit()
            
            return {
                'campaign_id': campaign_id,
                'total_recipients': campaign.total_recipients,
                'sent_count': sent_count,
                'failed_count': failed_count,
                'status': 'completed'
            }
            
        except Exception as e:
            logger.error(f"Campaign {campaign_id} failed: {str(e)}")
            campaign.status = 'failed'
            self.db.commit()
            raise SMSGatewayError(f"Campaign failed: {str(e)}")
    
    async def _send_single_sms(self, message: SMSMessage) -> bool:
        """Send single SMS message via gateway"""
        # Check if SMS API key is configured (not placeholder or empty)
        if (not self.sms_api_key or 
            self.sms_api_key.strip() == "" or 
            self.sms_api_key == "your-sms-api-key"):
            # Simulate SMS sending for testing when no real API key is configured
            message.gateway_message_id = f"sim_{message.id}"
            return True
        
        try:
            async with httpx.AsyncClient() as client:
                payload = {
                    'to': message.phone_number,
                    'message': message.message_content,
                    'api_key': self.sms_api_key
                }
                
                response = await client.post(
                    f"{self.sms_gateway_url}/send",
                    json=payload,
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    message.gateway_message_id = result.get('message_id')
                    return True
                else:
                    message.error_message = f"Gateway error: {response.status_code} - {response.text}"
                    return False
                    
        except Exception as e:
            message.error_message = f"Network error: {str(e)}"
            return False
    
    # Retry Mechanism
    async def retry_failed_messages(self, campaign_id: Optional[UUID] = None, message_ids: Optional[List[UUID]] = None) -> Dict[str, Any]:
        """Retry failed SMS messages"""
        query = self.db.query(SMSMessage).filter(SMSMessage.status == 'failed')
        
        if campaign_id:
            query = query.filter(SMSMessage.campaign_id == campaign_id)
        
        if message_ids:
            query = query.filter(SMSMessage.id.in_(message_ids))
        
        # Only retry messages that haven't exceeded max retries
        messages = query.filter(SMSMessage.retry_count < SMSMessage.max_retries).all()
        
        retried_count = 0
        skipped_count = 0
        
        for message in messages:
            if message.retry_count >= message.max_retries:
                skipped_count += 1
                continue
            
            try:
                message.retry_count += 1
                message.status = 'pending'
                message.error_message = None
                
                success = await self._send_single_sms(message)
                if success:
                    message.status = 'sent'
                    message.sent_at = datetime.utcnow()
                    retried_count += 1
                else:
                    message.status = 'failed'
                    
            except Exception as e:
                message.status = 'failed'
                message.error_message = str(e)
            
            self.db.commit()
        
        return {
            'total_messages': len(messages) + skipped_count,
            'retried_messages': retried_count,
            'skipped_messages': skipped_count
        }
    
    # Delivery Status Tracking
    def update_delivery_status(self, status_update: SMSDeliveryStatusUpdate) -> bool:
        """Update SMS delivery status from gateway webhook"""
        message = self.db.query(SMSMessage).filter(
            SMSMessage.gateway_message_id == status_update.gateway_message_id
        ).first()
        
        if not message:
            return False
        
        message.delivery_status = status_update.delivery_status
        if status_update.delivered_at:
            message.delivered_at = status_update.delivered_at
        if status_update.error_message:
            message.error_message = status_update.error_message
            
        self.db.commit()
        return True
    
    # SMS History and Statistics
    def get_sms_history(self, 
                       campaign_id: Optional[UUID] = None,
                       customer_id: Optional[UUID] = None,
                       status: Optional[str] = None,
                       page: int = 1,
                       per_page: int = 50) -> Dict[str, Any]:
        """Get SMS message history with filtering"""
        query = self.db.query(SMSMessage)
        
        if campaign_id:
            query = query.filter(SMSMessage.campaign_id == campaign_id)
        
        if customer_id:
            query = query.filter(SMSMessage.customer_id == customer_id)
        
        if status:
            query = query.filter(SMSMessage.status == status)
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        offset = (page - 1) * per_page
        messages = query.order_by(SMSMessage.created_at.desc()).offset(offset).limit(per_page).all()
        
        return {
            'messages': messages,
            'total': total,
            'page': page,
            'per_page': per_page,
            'total_pages': (total + per_page - 1) // per_page
        }
    
    def get_campaign_statistics(self, campaign_id: UUID) -> Optional[Dict[str, Any]]:
        """Get detailed statistics for a campaign"""
        campaign = self.get_campaign(campaign_id)
        if not campaign:
            return None
        
        # Get message statistics
        messages = self.db.query(SMSMessage).filter(SMSMessage.campaign_id == campaign_id).all()
        
        stats = {
            'campaign_id': campaign_id,
            'campaign_name': campaign.name,
            'total_recipients': campaign.total_recipients,
            'sent_count': len([m for m in messages if m.status == 'sent']),
            'failed_count': len([m for m in messages if m.status == 'failed']),
            'pending_count': len([m for m in messages if m.status == 'pending']),
            'delivered_count': len([m for m in messages if m.delivery_status == 'delivered']),
            'created_at': campaign.created_at,
            'status': campaign.status
        }
        
        # Calculate rates
        if stats['total_recipients'] > 0:
            stats['success_rate'] = (stats['sent_count'] / stats['total_recipients']) * 100
            stats['delivery_rate'] = (stats['delivered_count'] / stats['total_recipients']) * 100
        else:
            stats['success_rate'] = 0
            stats['delivery_rate'] = 0
        
        return stats
    
    def get_overall_statistics(self) -> Dict[str, Any]:
        """Get overall SMS statistics"""
        campaigns = self.db.query(SMSCampaign).all()
        messages = self.db.query(SMSMessage).all()
        
        total_sent = len([m for m in messages if m.status == 'sent'])
        total_delivered = len([m for m in messages if m.delivery_status == 'delivered'])
        
        stats = {
            'total_campaigns': len(campaigns),
            'total_messages_sent': total_sent,
            'total_messages_delivered': total_delivered,
            'overall_success_rate': (total_sent / len(messages) * 100) if messages else 0,
            'overall_delivery_rate': (total_delivered / len(messages) * 100) if messages else 0,
            'recent_campaigns': []
        }
        
        # Get recent campaign stats
        recent_campaigns = sorted(campaigns, key=lambda c: c.created_at, reverse=True)[:5]
        for campaign in recent_campaigns:
            campaign_stats = self.get_campaign_statistics(campaign.id)
            if campaign_stats:
                stats['recent_campaigns'].append(campaign_stats)
        
        return stats