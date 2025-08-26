"""
API Gateway Schemas
Pydantic models for API gateway requests and responses
"""

from pydantic import BaseModel, Field, validator
from typing import List, Dict, Any, Optional
from datetime import datetime
from enum import Enum

# API Key Schemas
class APIKeyCreate(BaseModel):
    name: str = Field(..., description="Human-readable name for the API key")
    scopes: List[str] = Field(..., description="List of scopes/permissions")
    permissions: Dict[str, Any] = Field(default={}, description="Detailed permissions")
    business_type: Optional[str] = Field(None, description="Business type this key is for")
    rate_limits: Optional[Dict[str, int]] = Field(None, description="Custom rate limits")
    expires_at: Optional[datetime] = Field(None, description="Expiration date")
    
    @validator('scopes')
    def validate_scopes(cls, v):
        valid_scopes = [
            'read:inventory', 'write:inventory', 'delete:inventory',
            'read:invoices', 'write:invoices', 'delete:invoices',
            'read:customers', 'write:customers', 'delete:customers',
            'read:reports', 'write:reports',
            'read:api_keys', 'write:api_keys', 'delete:api_keys', 'admin:api_keys',
            'read:webhooks', 'write:webhooks', 'delete:webhooks',
            'read:bulk_operations', 'write:bulk_operations',
            'read:automations', 'write:automations', 'delete:automations',
            'read:integrations', 'write:integrations', 'delete:integrations',
            'write:events'
        ]
        
        for scope in v:
            if scope not in valid_scopes:
                raise ValueError(f"Invalid scope: {scope}")
        
        return v

class APIKeyUpdate(BaseModel):
    name: Optional[str] = None
    scopes: Optional[List[str]] = None
    permissions: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None
    rate_limit_per_minute: Optional[int] = None
    rate_limit_per_hour: Optional[int] = None
    rate_limit_per_day: Optional[int] = None
    expires_at: Optional[datetime] = None

class APIKeyResponse(BaseModel):
    id: str
    name: str
    key_prefix: str
    scopes: List[str]
    permissions: Dict[str, Any]
    rate_limit_per_minute: int
    rate_limit_per_hour: int
    rate_limit_per_day: int
    is_active: bool
    expires_at: Optional[datetime]
    last_used_at: Optional[datetime]
    business_type: Optional[str]
    created_at: datetime
    updated_at: datetime
    key: Optional[str] = Field(None, description="Full API key (only returned on creation)")
    
    class Config:
        from_attributes = True

class APIUsageStats(BaseModel):
    total_requests: int
    successful_requests: int
    failed_requests: int
    success_rate: float
    endpoint_stats: Dict[str, Dict[str, Any]]
    period_days: int

# Webhook Schemas
class WebhookEndpointCreate(BaseModel):
    name: str = Field(..., description="Human-readable name for the webhook")
    url: str = Field(..., description="URL to send webhook requests to")
    events: List[str] = Field(..., description="List of events to subscribe to")
    secret: Optional[str] = Field(None, description="Secret for webhook signature verification")
    event_filters: Optional[Dict[str, Any]] = Field(default={}, description="Additional event filtering")
    timeout_seconds: int = Field(default=30, description="Request timeout in seconds")
    retry_attempts: int = Field(default=3, description="Number of retry attempts")
    
    @validator('events')
    def validate_events(cls, v):
        valid_events = [
            'invoice.created', 'invoice.updated', 'invoice.deleted',
            'inventory.created', 'inventory.updated', 'inventory.low_stock',
            'customer.created', 'customer.updated',
            'payment.received', 'payment.failed'
        ]
        
        for event in v:
            if event not in valid_events:
                raise ValueError(f"Invalid event type: {event}")
        
        return v

class WebhookEndpointResponse(BaseModel):
    id: str
    name: str
    url: str
    events: List[str]
    event_filters: Dict[str, Any]
    timeout_seconds: int
    retry_attempts: int
    retry_backoff_seconds: int
    is_active: bool
    last_success_at: Optional[datetime]
    last_failure_at: Optional[datetime]
    consecutive_failures: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class WebhookDeliveryResponse(BaseModel):
    id: str
    event_type: str
    event_id: str
    attempt_number: int
    status: str
    status_code: Optional[int]
    response_time_ms: Optional[int]
    error_message: Optional[str]
    scheduled_at: datetime
    delivered_at: Optional[datetime]
    
    class Config:
        from_attributes = True

# Bulk Operation Schemas
class BulkOperationCreate(BaseModel):
    resource_type: str = Field(..., description="Type of resource to import/export")
    format: str = Field(..., description="File format (csv, json, xlsx)")
    configuration: Optional[Dict[str, Any]] = Field(default={}, description="Operation configuration")
    
    @validator('resource_type')
    def validate_resource_type(cls, v):
        valid_types = ['inventory', 'customers', 'invoices', 'categories']
        if v not in valid_types:
            raise ValueError(f"Invalid resource type: {v}")
        return v
    
    @validator('format')
    def validate_format(cls, v):
        valid_formats = ['csv', 'json', 'xlsx']
        if v not in valid_formats:
            raise ValueError(f"Invalid format: {v}")
        return v

class BulkOperationResponse(BaseModel):
    id: str
    operation_type: str
    resource_type: str
    format: str
    filename: Optional[str]
    file_size_bytes: Optional[int]
    total_records: int
    processed_records: int
    successful_records: int
    failed_records: int
    status: str
    progress_percentage: Optional[float]
    validation_errors: List[Dict[str, Any]]
    processing_errors: List[Dict[str, Any]]
    summary: Dict[str, Any]
    configuration: Dict[str, Any]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True

# Workflow Automation Schemas
class WorkflowActionSchema(BaseModel):
    type: str = Field(..., description="Action type")
    configuration: Dict[str, Any] = Field(..., description="Action configuration")
    
    @validator('type')
    def validate_action_type(cls, v):
        valid_types = [
            'send_email', 'send_sms', 'create_task', 'update_record',
            'webhook', 'create_invoice', 'update_inventory'
        ]
        if v not in valid_types:
            raise ValueError(f"Invalid action type: {v}")
        return v

class WorkflowAutomationCreate(BaseModel):
    name: str = Field(..., description="Human-readable name for the automation")
    description: Optional[str] = Field(None, description="Description of the automation")
    trigger_event: str = Field(..., description="Event that triggers the automation")
    trigger_conditions: Dict[str, Any] = Field(default={}, description="Conditions for triggering")
    actions: List[WorkflowActionSchema] = Field(..., description="Actions to execute")
    business_type: Optional[str] = Field(None, description="Business type this automation is for")
    action_delay_seconds: int = Field(default=0, description="Delay before executing actions")
    
    @validator('trigger_event')
    def validate_trigger_event(cls, v):
        valid_events = [
            'invoice.created', 'invoice.updated', 'invoice.approved',
            'inventory.low_stock', 'inventory.out_of_stock',
            'customer.created', 'customer.updated',
            'payment.received', 'payment.overdue'
        ]
        if v not in valid_events:
            raise ValueError(f"Invalid trigger event: {v}")
        return v

class WorkflowAutomationResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    is_active: bool
    trigger_event: str
    trigger_conditions: Dict[str, Any]
    actions: List[Dict[str, Any]]
    action_delay_seconds: int
    execution_count: int
    last_executed_at: Optional[datetime]
    last_execution_status: Optional[str]
    business_type: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class WorkflowExecutionResponse(BaseModel):
    id: str
    automation_id: str
    trigger_data: Dict[str, Any]
    execution_context: Dict[str, Any]
    status: str
    actions_executed: int
    actions_successful: int
    actions_failed: int
    error_message: Optional[str]
    started_at: datetime
    completed_at: Optional[datetime]
    
    class Config:
        from_attributes = True

# External Integration Schemas
class ExternalIntegrationCreate(BaseModel):
    name: str = Field(..., description="Human-readable name for the integration")
    service_type: str = Field(..., description="Type of service")
    provider: str = Field(..., description="Service provider")
    configuration: Dict[str, Any] = Field(..., description="Integration configuration")
    credentials: Dict[str, Any] = Field(..., description="Service credentials")
    business_type: Optional[str] = Field(None, description="Business type this integration is for")
    
    @validator('service_type')
    def validate_service_type(cls, v):
        valid_types = [
            'payment_processor', 'shipping', 'accounting', 'crm',
            'email_marketing', 'inventory_management', 'pos_system'
        ]
        if v not in valid_types:
            raise ValueError(f"Invalid service type: {v}")
        return v
    
    @validator('provider')
    def validate_provider(cls, v):
        valid_providers = [
            'stripe', 'paypal', 'square',  # Payment processors
            'fedex', 'ups', 'dhl',  # Shipping
            'quickbooks', 'xero',  # Accounting
            'salesforce', 'hubspot',  # CRM
            'mailchimp', 'sendgrid',  # Email marketing
            'shopify', 'woocommerce'  # E-commerce
        ]
        if v not in valid_providers:
            raise ValueError(f"Invalid provider: {v}")
        return v

class ExternalIntegrationResponse(BaseModel):
    id: str
    name: str
    service_type: str
    provider: str
    configuration: Dict[str, Any]
    is_active: bool
    is_configured: bool
    last_sync_at: Optional[datetime]
    last_error_at: Optional[datetime]
    last_error_message: Optional[str]
    business_type: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class IntegrationSyncLogResponse(BaseModel):
    id: str
    integration_id: str
    sync_type: str
    direction: str
    resource_type: Optional[str]
    status: str
    records_processed: int
    records_successful: int
    records_failed: int
    error_message: Optional[str]
    started_at: datetime
    completed_at: Optional[datetime]
    
    class Config:
        from_attributes = True

# Event Schemas
class EventTriggerRequest(BaseModel):
    event_type: str = Field(..., description="Type of event to trigger")
    event_data: Dict[str, Any] = Field(..., description="Event data payload")
    
    @validator('event_type')
    def validate_event_type(cls, v):
        valid_events = [
            'invoice.created', 'invoice.updated', 'invoice.deleted',
            'inventory.created', 'inventory.updated', 'inventory.low_stock',
            'customer.created', 'customer.updated',
            'payment.received', 'payment.failed'
        ]
        if v not in valid_events:
            raise ValueError(f"Invalid event type: {v}")
        return v

# Rate Limiting Schemas
class RateLimitInfo(BaseModel):
    limit: int
    remaining: int
    reset_at: datetime
    window: str  # 'minute', 'hour', 'day'

class RateLimitResponse(BaseModel):
    allowed: bool
    reason: Optional[str] = None
    limits: Dict[str, RateLimitInfo] = {}

# Error Schemas
class APIError(BaseModel):
    error: str
    message: str
    details: Optional[Dict[str, Any]] = None
    timestamp: datetime
    request_id: Optional[str] = None

class ValidationError(BaseModel):
    field: str
    message: str
    invalid_value: Any

class BulkValidationError(BaseModel):
    row: int
    errors: List[ValidationError]
    data: Dict[str, Any]

# Health Check Schema
class HealthCheckResponse(BaseModel):
    status: str
    service: str
    timestamp: datetime
    version: str
    dependencies: Optional[Dict[str, str]] = None

# Documentation Schemas
class EventDocumentation(BaseModel):
    type: str
    description: str
    data_schema: Dict[str, str]

class ScopeDocumentation(BaseModel):
    scope: str
    description: str

class APIDocumentationResponse(BaseModel):
    events: List[EventDocumentation]
    scopes: List[ScopeDocumentation]
    version: str
    last_updated: datetime