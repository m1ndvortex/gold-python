"""
API Gateway Router
Comprehensive REST API with CRUD operations, rate limiting, and integration capabilities
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request, UploadFile, File, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import json
import logging

from database import get_db
from models_api_gateway import (
    APIKey, APIUsageLog, WebhookEndpoint, WebhookDelivery,
    BulkOperation, WorkflowAutomation, WorkflowExecution,
    ExternalIntegration, IntegrationSyncLog
)
from services.api_gateway_service import (
    APIKeyService, WebhookService, BulkOperationService,
    WorkflowAutomationService, ExternalIntegrationService
)
from schemas_api_gateway import (
    APIKeyCreate, APIKeyResponse, APIKeyUpdate,
    WebhookEndpointCreate, WebhookEndpointResponse,
    BulkOperationCreate, BulkOperationResponse,
    WorkflowAutomationCreate, WorkflowAutomationResponse,
    ExternalIntegrationCreate, ExternalIntegrationResponse,
    APIUsageStats, WebhookDeliveryResponse
)

router = APIRouter(prefix="/api/v1", tags=["API Gateway"])
security = HTTPBearer()
logger = logging.getLogger(__name__)

# Dependency for API key authentication
async def get_api_key(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> APIKey:
    """Authenticate API key and check rate limits"""
    
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key required"
        )
    
    # Authenticate API key
    api_key = APIKeyService.authenticate_api_key(db, credentials.credentials)
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key"
        )
    
    # Check rate limits
    rate_limit_result = APIKeyService.check_rate_limit(db, str(api_key.id))
    if not rate_limit_result['allowed']:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=rate_limit_result['reason'],
            headers={
                'X-RateLimit-Limit': str(rate_limit_result.get('limit', 0)),
                'X-RateLimit-Remaining': str(max(0, rate_limit_result.get('limit', 0) - rate_limit_result.get('current', 0))),
                'X-RateLimit-Reset': rate_limit_result.get('reset_at', '').isoformat() if rate_limit_result.get('reset_at') else ''
            }
        )
    
    return api_key

# Middleware to log API usage
async def log_api_usage_middleware(
    request: Request,
    api_key: APIKey,
    db: Session,
    response_status: int,
    response_time_ms: int = None
):
    """Log API usage for analytics and rate limiting"""
    
    APIKeyService.log_api_usage(
        db=db,
        api_key_id=str(api_key.id),
        endpoint=str(request.url.path),
        method=request.method,
        status_code=response_status,
        response_time_ms=response_time_ms,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get('user-agent'),
        business_operation=request.headers.get('x-business-operation')
    )

# API Key Management Endpoints
@router.post("/api-keys", response_model=APIKeyResponse)
async def create_api_key(
    api_key_data: APIKeyCreate,
    db: Session = Depends(get_db),
    current_api_key: APIKey = Depends(get_api_key)
):
    """Create a new API key"""
    
    # Check permissions
    if 'admin:api_keys' not in current_api_key.scopes:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to create API keys"
        )
    
    api_key, full_key = APIKeyService.create_api_key(
        db=db,
        name=api_key_data.name,
        scopes=api_key_data.scopes,
        permissions=api_key_data.permissions,
        created_by=str(current_api_key.created_by),
        business_type=api_key_data.business_type,
        rate_limits=api_key_data.rate_limits,
        expires_at=api_key_data.expires_at
    )
    
    response = APIKeyResponse.from_orm(api_key)
    response.key = full_key  # Only return the full key on creation
    
    return response

@router.get("/api-keys", response_model=List[APIKeyResponse])
async def list_api_keys(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_api_key: APIKey = Depends(get_api_key)
):
    """List API keys"""
    
    if 'read:api_keys' not in current_api_key.scopes:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to list API keys"
        )
    
    api_keys = db.query(APIKey).offset(skip).limit(limit).all()
    return [APIKeyResponse.from_orm(key) for key in api_keys]

@router.get("/api-keys/{api_key_id}", response_model=APIKeyResponse)
async def get_api_key(
    api_key_id: str,
    db: Session = Depends(get_db),
    current_api_key: APIKey = Depends(get_api_key)
):
    """Get API key details"""
    
    if 'read:api_keys' not in current_api_key.scopes:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to read API keys"
        )
    
    api_key = db.query(APIKey).filter(APIKey.id == api_key_id).first()
    if not api_key:
        raise HTTPException(status_code=404, detail="API key not found")
    
    return APIKeyResponse.from_orm(api_key)

@router.put("/api-keys/{api_key_id}", response_model=APIKeyResponse)
async def update_api_key(
    api_key_id: str,
    api_key_data: APIKeyUpdate,
    db: Session = Depends(get_db),
    current_api_key: APIKey = Depends(get_api_key)
):
    """Update API key"""
    
    if 'write:api_keys' not in current_api_key.scopes:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to update API keys"
        )
    
    api_key = db.query(APIKey).filter(APIKey.id == api_key_id).first()
    if not api_key:
        raise HTTPException(status_code=404, detail="API key not found")
    
    # Update fields
    for field, value in api_key_data.dict(exclude_unset=True).items():
        setattr(api_key, field, value)
    
    api_key.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(api_key)
    
    return APIKeyResponse.from_orm(api_key)

@router.delete("/api-keys/{api_key_id}")
async def delete_api_key(
    api_key_id: str,
    db: Session = Depends(get_db),
    current_api_key: APIKey = Depends(get_api_key)
):
    """Delete API key"""
    
    if 'delete:api_keys' not in current_api_key.scopes:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to delete API keys"
        )
    
    api_key = db.query(APIKey).filter(APIKey.id == api_key_id).first()
    if not api_key:
        raise HTTPException(status_code=404, detail="API key not found")
    
    db.delete(api_key)
    db.commit()
    
    return {"message": "API key deleted successfully"}

@router.get("/api-keys/{api_key_id}/usage", response_model=APIUsageStats)
async def get_api_key_usage(
    api_key_id: str,
    days: int = 30,
    db: Session = Depends(get_db),
    current_api_key: APIKey = Depends(get_api_key)
):
    """Get API key usage statistics"""
    
    if 'read:api_keys' not in current_api_key.scopes:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to read API key usage"
        )
    
    # Get usage data for the specified period
    start_date = datetime.utcnow() - timedelta(days=days)
    
    usage_logs = db.query(APIUsageLog).filter(
        APIUsageLog.api_key_id == api_key_id,
        APIUsageLog.timestamp >= start_date
    ).all()
    
    # Calculate statistics
    total_requests = len(usage_logs)
    successful_requests = len([log for log in usage_logs if log.status_code < 400])
    failed_requests = total_requests - successful_requests
    
    # Group by endpoint
    endpoint_stats = {}
    for log in usage_logs:
        if log.endpoint not in endpoint_stats:
            endpoint_stats[log.endpoint] = {'count': 0, 'avg_response_time': 0}
        endpoint_stats[log.endpoint]['count'] += 1
    
    # Calculate average response times
    for endpoint in endpoint_stats:
        endpoint_logs = [log for log in usage_logs if log.endpoint == endpoint and log.response_time_ms]
        if endpoint_logs:
            avg_time = sum(log.response_time_ms for log in endpoint_logs) / len(endpoint_logs)
            endpoint_stats[endpoint]['avg_response_time'] = avg_time
    
    return APIUsageStats(
        total_requests=total_requests,
        successful_requests=successful_requests,
        failed_requests=failed_requests,
        success_rate=successful_requests / total_requests if total_requests > 0 else 0,
        endpoint_stats=endpoint_stats,
        period_days=days
    )

# Webhook Management Endpoints
@router.post("/webhooks", response_model=WebhookEndpointResponse)
async def create_webhook_endpoint(
    webhook_data: WebhookEndpointCreate,
    db: Session = Depends(get_db),
    current_api_key: APIKey = Depends(get_api_key)
):
    """Create a new webhook endpoint"""
    
    if 'write:webhooks' not in current_api_key.scopes:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to create webhooks"
        )
    
    webhook = WebhookService.create_webhook_endpoint(
        db=db,
        api_key_id=str(current_api_key.id),
        name=webhook_data.name,
        url=webhook_data.url,
        events=webhook_data.events,
        secret=webhook_data.secret,
        event_filters=webhook_data.event_filters,
        timeout_seconds=webhook_data.timeout_seconds,
        retry_attempts=webhook_data.retry_attempts
    )
    
    return WebhookEndpointResponse.from_orm(webhook)

@router.get("/webhooks", response_model=List[WebhookEndpointResponse])
async def list_webhook_endpoints(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_api_key: APIKey = Depends(get_api_key)
):
    """List webhook endpoints"""
    
    if 'read:webhooks' not in current_api_key.scopes:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to list webhooks"
        )
    
    webhooks = db.query(WebhookEndpoint).filter(
        WebhookEndpoint.api_key_id == str(current_api_key.id)
    ).offset(skip).limit(limit).all()
    
    return [WebhookEndpointResponse.from_orm(webhook) for webhook in webhooks]

@router.get("/webhooks/{webhook_id}/deliveries", response_model=List[WebhookDeliveryResponse])
async def list_webhook_deliveries(
    webhook_id: str,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_api_key: APIKey = Depends(get_api_key)
):
    """List webhook deliveries"""
    
    if 'read:webhooks' not in current_api_key.scopes:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to read webhook deliveries"
        )
    
    # Verify webhook belongs to current API key
    webhook = db.query(WebhookEndpoint).filter(
        WebhookEndpoint.id == webhook_id,
        WebhookEndpoint.api_key_id == str(current_api_key.id)
    ).first()
    
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")
    
    deliveries = db.query(WebhookDelivery).filter(
        WebhookDelivery.endpoint_id == webhook_id
    ).order_by(WebhookDelivery.scheduled_at.desc()).offset(skip).limit(limit).all()
    
    return [WebhookDeliveryResponse.from_orm(delivery) for delivery in deliveries]

# Bulk Operations Endpoints
@router.post("/bulk/import", response_model=BulkOperationResponse)
async def create_bulk_import(
    operation_data: BulkOperationCreate,
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db),
    current_api_key: APIKey = Depends(get_api_key)
):
    """Create bulk import operation"""
    
    if 'write:bulk_operations' not in current_api_key.scopes:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions for bulk operations"
        )
    
    # Validate file format
    if not file.filename.endswith(('.csv', '.json', '.xlsx')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Use CSV, JSON, or XLSX."
        )
    
    # Create bulk operation
    operation = BulkOperationService.create_bulk_operation(
        db=db,
        operation_type='import',
        resource_type=operation_data.resource_type,
        format=operation_data.format,
        filename=file.filename,
        created_by=str(current_api_key.created_by),
        configuration=operation_data.configuration
    )
    
    # Read file data
    file_data = await file.read()
    operation.file_size_bytes = len(file_data)
    db.commit()
    
    # Process import in background
    background_tasks.add_task(
        BulkOperationService.process_bulk_import,
        db, str(operation.id), file_data
    )
    
    return BulkOperationResponse.from_orm(operation)

@router.get("/bulk/operations", response_model=List[BulkOperationResponse])
async def list_bulk_operations(
    skip: int = 0,
    limit: int = 100,
    operation_type: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_api_key: APIKey = Depends(get_api_key)
):
    """List bulk operations"""
    
    if 'read:bulk_operations' not in current_api_key.scopes:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to read bulk operations"
        )
    
    query = db.query(BulkOperation).filter(
        BulkOperation.created_by == str(current_api_key.created_by)
    )
    
    if operation_type:
        query = query.filter(BulkOperation.operation_type == operation_type)
    
    if status:
        query = query.filter(BulkOperation.status == status)
    
    operations = query.order_by(BulkOperation.created_at.desc()).offset(skip).limit(limit).all()
    
    return [BulkOperationResponse.from_orm(op) for op in operations]

@router.get("/bulk/operations/{operation_id}", response_model=BulkOperationResponse)
async def get_bulk_operation(
    operation_id: str,
    db: Session = Depends(get_db),
    current_api_key: APIKey = Depends(get_api_key)
):
    """Get bulk operation details"""
    
    if 'read:bulk_operations' not in current_api_key.scopes:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to read bulk operations"
        )
    
    operation = db.query(BulkOperation).filter(
        BulkOperation.id == operation_id,
        BulkOperation.created_by == str(current_api_key.created_by)
    ).first()
    
    if not operation:
        raise HTTPException(status_code=404, detail="Bulk operation not found")
    
    return BulkOperationResponse.from_orm(operation)

# Workflow Automation Endpoints
@router.post("/automations", response_model=WorkflowAutomationResponse)
async def create_workflow_automation(
    automation_data: WorkflowAutomationCreate,
    db: Session = Depends(get_db),
    current_api_key: APIKey = Depends(get_api_key)
):
    """Create workflow automation"""
    
    if 'write:automations' not in current_api_key.scopes:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to create automations"
        )
    
    automation = WorkflowAutomationService.create_automation(
        db=db,
        name=automation_data.name,
        description=automation_data.description,
        trigger_event=automation_data.trigger_event,
        trigger_conditions=automation_data.trigger_conditions,
        actions=automation_data.actions,
        created_by=str(current_api_key.created_by),
        business_type=automation_data.business_type,
        action_delay_seconds=automation_data.action_delay_seconds
    )
    
    return WorkflowAutomationResponse.from_orm(automation)

@router.get("/automations", response_model=List[WorkflowAutomationResponse])
async def list_workflow_automations(
    skip: int = 0,
    limit: int = 100,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_api_key: APIKey = Depends(get_api_key)
):
    """List workflow automations"""
    
    if 'read:automations' not in current_api_key.scopes:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to read automations"
        )
    
    query = db.query(WorkflowAutomation).filter(
        WorkflowAutomation.created_by == str(current_api_key.created_by)
    )
    
    if is_active is not None:
        query = query.filter(WorkflowAutomation.is_active == is_active)
    
    automations = query.order_by(WorkflowAutomation.created_at.desc()).offset(skip).limit(limit).all()
    
    return [WorkflowAutomationResponse.from_orm(automation) for automation in automations]

# External Integration Endpoints
@router.post("/integrations", response_model=ExternalIntegrationResponse)
async def create_external_integration(
    integration_data: ExternalIntegrationCreate,
    db: Session = Depends(get_db),
    current_api_key: APIKey = Depends(get_api_key)
):
    """Create external integration"""
    
    if 'write:integrations' not in current_api_key.scopes:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to create integrations"
        )
    
    integration = ExternalIntegrationService.create_integration(
        db=db,
        name=integration_data.name,
        service_type=integration_data.service_type,
        provider=integration_data.provider,
        configuration=integration_data.configuration,
        credentials=integration_data.credentials,
        created_by=str(current_api_key.created_by),
        business_type=integration_data.business_type
    )
    
    return ExternalIntegrationResponse.from_orm(integration)

@router.post("/integrations/{integration_id}/sync")
async def sync_external_integration(
    integration_id: str,
    sync_type: str = 'incremental',
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db),
    current_api_key: APIKey = Depends(get_api_key)
):
    """Trigger integration synchronization"""
    
    if 'write:integrations' not in current_api_key.scopes:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to sync integrations"
        )
    
    # Verify integration exists and belongs to user
    integration = db.query(ExternalIntegration).filter(
        ExternalIntegration.id == integration_id,
        ExternalIntegration.created_by == str(current_api_key.created_by)
    ).first()
    
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")
    
    # Start sync in background
    background_tasks.add_task(
        ExternalIntegrationService.sync_integration,
        db, integration_id, sync_type
    )
    
    return {"message": "Integration sync started", "sync_type": sync_type}

# Event Trigger Endpoint (for testing webhooks and automations)
@router.post("/events/trigger")
async def trigger_event(
    event_type: str,
    event_data: Dict[str, Any],
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db),
    current_api_key: APIKey = Depends(get_api_key)
):
    """Trigger an event for testing webhooks and automations"""
    
    if 'write:events' not in current_api_key.scopes:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to trigger events"
        )
    
    # Send webhooks
    background_tasks.add_task(
        WebhookService.send_webhook,
        db, event_type, event_data
    )
    
    # Trigger automations
    background_tasks.add_task(
        WorkflowAutomationService.trigger_automations,
        db, event_type, event_data
    )
    
    return {
        "message": "Event triggered successfully",
        "event_type": event_type,
        "timestamp": datetime.utcnow().isoformat()
    }

# Health Check and Documentation
@router.get("/health")
async def api_gateway_health():
    """API Gateway health check"""
    return {
        "status": "healthy",
        "service": "API Gateway",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }

@router.get("/docs/events")
async def list_available_events():
    """List available event types for webhooks and automations"""
    return {
        "events": [
            {
                "type": "invoice.created",
                "description": "Triggered when a new invoice is created",
                "data_schema": {
                    "id": "string",
                    "invoice_number": "string",
                    "customer_id": "string",
                    "total": "number",
                    "status": "string"
                }
            },
            {
                "type": "invoice.updated",
                "description": "Triggered when an invoice is updated",
                "data_schema": {
                    "id": "string",
                    "invoice_number": "string",
                    "changes": "object"
                }
            },
            {
                "type": "inventory.low_stock",
                "description": "Triggered when inventory falls below threshold",
                "data_schema": {
                    "item_id": "string",
                    "sku": "string",
                    "current_stock": "number",
                    "threshold": "number"
                }
            },
            {
                "type": "customer.created",
                "description": "Triggered when a new customer is created",
                "data_schema": {
                    "id": "string",
                    "name": "string",
                    "email": "string"
                }
            },
            {
                "type": "payment.received",
                "description": "Triggered when a payment is received",
                "data_schema": {
                    "id": "string",
                    "invoice_id": "string",
                    "amount": "number",
                    "method": "string"
                }
            }
        ]
    }

@router.get("/docs/scopes")
async def list_available_scopes():
    """List available API scopes and permissions"""
    return {
        "scopes": [
            {
                "scope": "read:inventory",
                "description": "Read inventory items and categories"
            },
            {
                "scope": "write:inventory",
                "description": "Create and update inventory items"
            },
            {
                "scope": "delete:inventory",
                "description": "Delete inventory items"
            },
            {
                "scope": "read:invoices",
                "description": "Read invoices and invoice items"
            },
            {
                "scope": "write:invoices",
                "description": "Create and update invoices"
            },
            {
                "scope": "read:customers",
                "description": "Read customer information"
            },
            {
                "scope": "write:customers",
                "description": "Create and update customers"
            },
            {
                "scope": "read:reports",
                "description": "Access reports and analytics"
            },
            {
                "scope": "admin:api_keys",
                "description": "Manage API keys"
            },
            {
                "scope": "write:webhooks",
                "description": "Create and manage webhooks"
            },
            {
                "scope": "write:automations",
                "description": "Create and manage workflow automations"
            },
            {
                "scope": "write:integrations",
                "description": "Create and manage external integrations"
            }
        ]
    }