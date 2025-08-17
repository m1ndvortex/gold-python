"""
SMS Router

This module provides API endpoints for SMS functionality including:
- SMS template management
- Campaign creation and management
- Batch SMS sending
- Delivery status tracking
- SMS history and statistics
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
import asyncio

from database import get_db
from auth import get_current_user, require_permission
from schemas import (
    SMSTemplate, SMSTemplateCreate, SMSTemplateUpdate,
    SMSCampaign, SMSCampaignCreate, SMSCampaignUpdate, SMSCampaignWithDetails,
    SMSMessage, SMSMessageWithDetails,
    SMSBatchRequest, SMSBatchResponse,
    SMSTemplatePreview, SMSDeliveryStatusUpdate,
    SMSRetryRequest, SMSRetryResponse,
    SMSHistoryFilters, SMSHistoryResponse,
    SMSCampaignStats, SMSOverallStats,
    User
)
from services.sms_service import SMSService, SMSGatewayError

router = APIRouter(prefix="/api/sms", tags=["SMS"])

# Template Management Endpoints

@router.post("/templates", response_model=SMSTemplate)
async def create_sms_template(
    template_data: SMSTemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("send_sms"))
):
    """Create a new SMS template"""
    try:
        sms_service = SMSService(db)
        template = sms_service.create_template(template_data)
        return template
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/templates", response_model=List[SMSTemplate])
async def get_sms_templates(
    template_type: Optional[str] = Query(None, description="Filter by template type"),
    active_only: bool = Query(True, description="Show only active templates"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("send_sms"))
):
    """Get all SMS templates"""
    sms_service = SMSService(db)
    templates = sms_service.get_templates(template_type=template_type, active_only=active_only)
    return templates

@router.get("/templates/{template_id}", response_model=SMSTemplate)
async def get_sms_template(
    template_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("send_sms"))
):
    """Get SMS template by ID"""
    sms_service = SMSService(db)
    template = sms_service.get_template(template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template

@router.put("/templates/{template_id}", response_model=SMSTemplate)
async def update_sms_template(
    template_id: UUID,
    template_data: SMSTemplateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("send_sms"))
):
    """Update SMS template"""
    sms_service = SMSService(db)
    template = sms_service.update_template(template_id, template_data)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template

@router.delete("/templates/{template_id}")
async def delete_sms_template(
    template_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("send_sms"))
):
    """Delete SMS template (soft delete)"""
    sms_service = SMSService(db)
    success = sms_service.delete_template(template_id)
    if not success:
        raise HTTPException(status_code=404, detail="Template not found")
    return {"message": "Template deleted successfully"}

@router.post("/templates/{template_id}/preview", response_model=SMSTemplatePreview)
async def preview_sms_template(
    template_id: UUID,
    customer_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("send_sms"))
):
    """Preview SMS template with customer data"""
    sms_service = SMSService(db)
    preview_message = sms_service.preview_template(template_id, customer_id)
    if preview_message is None:
        raise HTTPException(status_code=404, detail="Template or customer not found")
    
    return SMSTemplatePreview(
        template_id=template_id,
        customer_id=customer_id,
        preview_message=preview_message
    )

# Campaign Management Endpoints

@router.post("/campaigns", response_model=SMSCampaign)
async def create_sms_campaign(
    campaign_data: SMSCampaignCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("send_sms"))
):
    """Create SMS campaign"""
    try:
        sms_service = SMSService(db)
        campaign = sms_service.create_campaign(campaign_data, current_user.id)
        return campaign
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/campaigns", response_model=List[SMSCampaign])
async def get_sms_campaigns(
    status: Optional[str] = Query(None, description="Filter by campaign status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("send_sms"))
):
    """Get SMS campaigns"""
    sms_service = SMSService(db)
    campaigns = sms_service.get_campaigns(created_by=current_user.id, status=status)
    return campaigns

@router.get("/campaigns/{campaign_id}", response_model=SMSCampaignWithDetails)
async def get_sms_campaign(
    campaign_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("send_sms"))
):
    """Get SMS campaign by ID"""
    sms_service = SMSService(db)
    campaign = sms_service.get_campaign(campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign

@router.post("/campaigns/{campaign_id}/send")
async def send_sms_campaign(
    campaign_id: UUID,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("send_sms"))
):
    """Send SMS campaign asynchronously"""
    sms_service = SMSService(db)
    
    # Verify campaign exists and belongs to user
    campaign = sms_service.get_campaign(campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    if campaign.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to send this campaign")
    
    # Add to background tasks
    background_tasks.add_task(send_campaign_task, campaign_id, db)
    
    return {"message": "Campaign sending started", "campaign_id": campaign_id}

async def send_campaign_task(campaign_id: UUID, db: Session):
    """Background task to send SMS campaign"""
    try:
        sms_service = SMSService(db)
        await sms_service.send_campaign(campaign_id)
    except Exception as e:
        # Log error - in production, you might want to update campaign status
        print(f"Campaign {campaign_id} failed: {str(e)}")

# Batch SMS Endpoints

@router.post("/send-batch", response_model=SMSBatchResponse)
async def send_batch_sms(
    batch_request: SMSBatchRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("send_sms"))
):
    """Send batch SMS messages"""
    try:
        # Validate batch size
        if len(batch_request.customer_ids) > 100:
            raise HTTPException(status_code=400, detail="Batch size cannot exceed 100 recipients")
        
        # Create campaign
        campaign_data = SMSCampaignCreate(
            name=batch_request.campaign_name,
            template_id=batch_request.template_id,
            message_content=batch_request.message_content,
            customer_ids=batch_request.customer_ids
        )
        
        sms_service = SMSService(db)
        campaign = sms_service.create_campaign(campaign_data, current_user.id)
        
        # Start sending in background
        background_tasks.add_task(send_campaign_task, campaign.id, db)
        
        return SMSBatchResponse(
            campaign_id=campaign.id,
            total_recipients=campaign.total_recipients,
            status="sending",
            message="Batch SMS sending started"
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Retry Mechanism Endpoints

@router.post("/retry", response_model=SMSRetryResponse)
async def retry_failed_sms(
    retry_request: SMSRetryRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("send_sms"))
):
    """Retry failed SMS messages"""
    try:
        sms_service = SMSService(db)
        
        # Add retry task to background
        background_tasks.add_task(
            retry_messages_task, 
            retry_request.message_ids, 
            retry_request.max_retries,
            db
        )
        
        return SMSRetryResponse(
            total_messages=len(retry_request.message_ids),
            retried_messages=0,  # Will be updated by background task
            skipped_messages=0,
            message="Retry process started"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def retry_messages_task(message_ids: List[UUID], max_retries: Optional[int], db: Session):
    """Background task to retry failed messages"""
    try:
        sms_service = SMSService(db)
        await sms_service.retry_failed_messages(message_ids=message_ids)
    except Exception as e:
        print(f"Retry task failed: {str(e)}")

@router.post("/campaigns/{campaign_id}/retry")
async def retry_campaign_failed_sms(
    campaign_id: UUID,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("send_sms"))
):
    """Retry all failed messages in a campaign"""
    sms_service = SMSService(db)
    
    # Verify campaign exists and belongs to user
    campaign = sms_service.get_campaign(campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    if campaign.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to retry this campaign")
    
    # Add retry task to background
    background_tasks.add_task(retry_campaign_task, campaign_id, db)
    
    return {"message": "Campaign retry started", "campaign_id": campaign_id}

async def retry_campaign_task(campaign_id: UUID, db: Session):
    """Background task to retry failed campaign messages"""
    try:
        sms_service = SMSService(db)
        await sms_service.retry_failed_messages(campaign_id=campaign_id)
    except Exception as e:
        print(f"Campaign retry {campaign_id} failed: {str(e)}")

# Delivery Status Endpoints

@router.post("/delivery-status")
async def update_delivery_status(
    status_update: SMSDeliveryStatusUpdate,
    db: Session = Depends(get_db)
):
    """Update SMS delivery status (webhook endpoint for SMS gateway)"""
    try:
        sms_service = SMSService(db)
        success = sms_service.update_delivery_status(status_update)
        
        if not success:
            raise HTTPException(status_code=404, detail="Message not found")
        
        return {"message": "Delivery status updated successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# History and Statistics Endpoints

@router.get("/history", response_model=SMSHistoryResponse)
async def get_sms_history(
    campaign_id: Optional[UUID] = Query(None, description="Filter by campaign ID"),
    customer_id: Optional[UUID] = Query(None, description="Filter by customer ID"),
    status: Optional[str] = Query(None, description="Filter by message status"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(50, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("send_sms"))
):
    """Get SMS message history"""
    sms_service = SMSService(db)
    history = sms_service.get_sms_history(
        campaign_id=campaign_id,
        customer_id=customer_id,
        status=status,
        page=page,
        per_page=per_page
    )
    
    return SMSHistoryResponse(**history)

@router.get("/campaigns/{campaign_id}/statistics", response_model=SMSCampaignStats)
async def get_campaign_statistics(
    campaign_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("send_sms"))
):
    """Get detailed statistics for a campaign"""
    sms_service = SMSService(db)
    
    # Verify campaign exists and belongs to user
    campaign = sms_service.get_campaign(campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    if campaign.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this campaign")
    
    stats = sms_service.get_campaign_statistics(campaign_id)
    if not stats:
        raise HTTPException(status_code=404, detail="Campaign statistics not found")
    
    return SMSCampaignStats(**stats)

@router.get("/statistics", response_model=SMSOverallStats)
async def get_overall_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("send_sms"))
):
    """Get overall SMS statistics"""
    sms_service = SMSService(db)
    stats = sms_service.get_overall_statistics()
    return SMSOverallStats(**stats)

# Message Management Endpoints

@router.get("/messages/{message_id}", response_model=SMSMessageWithDetails)
async def get_sms_message(
    message_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("send_sms"))
):
    """Get SMS message by ID"""
    from models import SMSMessage
    
    message = db.query(SMSMessage).filter(SMSMessage.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    # Check if user has access to this message
    campaign = db.query(SMSCampaign).filter(SMSCampaign.id == message.campaign_id).first()
    if campaign and campaign.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this message")
    
    return message

@router.get("/messages", response_model=List[SMSMessageWithDetails])
async def get_sms_messages(
    campaign_id: Optional[UUID] = Query(None, description="Filter by campaign ID"),
    customer_id: Optional[UUID] = Query(None, description="Filter by customer ID"),
    status: Optional[str] = Query(None, description="Filter by message status"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of messages"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("send_sms"))
):
    """Get SMS messages with filtering"""
    from models import SMSMessage
    
    query = db.query(SMSMessage)
    
    if campaign_id:
        query = query.filter(SMSMessage.campaign_id == campaign_id)
    
    if customer_id:
        query = query.filter(SMSMessage.customer_id == customer_id)
    
    if status:
        query = query.filter(SMSMessage.status == status)
    
    messages = query.order_by(SMSMessage.created_at.desc()).limit(limit).all()
    
    # Filter messages by user access (only show messages from user's campaigns)
    user_campaigns = db.query(SMSCampaign).filter(SMSCampaign.created_by == current_user.id).all()
    user_campaign_ids = [c.id for c in user_campaigns]
    
    filtered_messages = [m for m in messages if m.campaign_id in user_campaign_ids]
    
    return filtered_messages