"""
API Gateway and Integration Layer Models
Provides comprehensive API management, webhooks, and integration capabilities
"""

from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text, DECIMAL, ForeignKey, Index, JSON
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from database_base import Base

class APIKey(Base):
    """API Key management for external integrations"""
    __tablename__ = "api_keys"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(200), nullable=False)  # Human-readable name
    key_hash = Column(String(255), nullable=False, unique=True)  # Hashed API key
    key_prefix = Column(String(20), nullable=False)  # First few chars for identification
    
    # Permissions and scopes
    scopes = Column(ARRAY(String), nullable=False, default=[])  # ['read:inventory', 'write:invoices']
    permissions = Column(JSONB, nullable=False, default={})  # Detailed permissions
    
    # Usage tracking
    rate_limit_per_minute = Column(Integer, default=60)
    rate_limit_per_hour = Column(Integer, default=1000)
    rate_limit_per_day = Column(Integer, default=10000)
    
    # Status and metadata
    is_active = Column(Boolean, default=True)
    expires_at = Column(DateTime(timezone=True))
    last_used_at = Column(DateTime(timezone=True))
    
    # Ownership
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    business_type = Column(String(50))  # Business type this key is for
    
    # Audit
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    usage_logs = relationship("APIUsageLog", back_populates="api_key")
    webhook_endpoints = relationship("WebhookEndpoint", back_populates="api_key")

class APIUsageLog(Base):
    """Track API usage for rate limiting and analytics"""
    __tablename__ = "api_usage_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    api_key_id = Column(UUID(as_uuid=True), ForeignKey("api_keys.id"))
    
    # Request details
    endpoint = Column(String(500), nullable=False)
    method = Column(String(10), nullable=False)  # GET, POST, PUT, DELETE
    status_code = Column(Integer, nullable=False)
    response_time_ms = Column(Integer)
    
    # Request metadata
    ip_address = Column(String(45))  # IPv6 compatible
    user_agent = Column(Text)
    request_size_bytes = Column(Integer)
    response_size_bytes = Column(Integer)
    
    # Business context
    resource_type = Column(String(100))  # 'inventory', 'invoice', 'customer'
    resource_id = Column(UUID(as_uuid=True))
    business_operation = Column(String(100))  # 'create_invoice', 'update_inventory'
    
    # Timestamp
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    api_key = relationship("APIKey", back_populates="usage_logs")

class WebhookEndpoint(Base):
    """Webhook endpoints for real-time event notifications"""
    __tablename__ = "webhook_endpoints"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    api_key_id = Column(UUID(as_uuid=True), ForeignKey("api_keys.id"))
    
    # Endpoint configuration
    name = Column(String(200), nullable=False)
    url = Column(String(2000), nullable=False)
    secret = Column(String(255))  # For webhook signature verification
    
    # Event configuration
    events = Column(ARRAY(String), nullable=False)  # ['invoice.created', 'inventory.updated']
    event_filters = Column(JSONB, default={})  # Additional filtering criteria
    
    # Delivery configuration
    timeout_seconds = Column(Integer, default=30)
    retry_attempts = Column(Integer, default=3)
    retry_backoff_seconds = Column(Integer, default=60)
    
    # Status
    is_active = Column(Boolean, default=True)
    last_success_at = Column(DateTime(timezone=True))
    last_failure_at = Column(DateTime(timezone=True))
    consecutive_failures = Column(Integer, default=0)
    
    # Audit
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    api_key = relationship("APIKey", back_populates="webhook_endpoints")
    deliveries = relationship("WebhookDelivery", back_populates="endpoint")

class WebhookDelivery(Base):
    """Track webhook delivery attempts and results"""
    __tablename__ = "webhook_deliveries"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    endpoint_id = Column(UUID(as_uuid=True), ForeignKey("webhook_endpoints.id"))
    
    # Event details
    event_type = Column(String(100), nullable=False)
    event_id = Column(UUID(as_uuid=True), nullable=False)
    payload = Column(JSONB, nullable=False)
    
    # Delivery details
    attempt_number = Column(Integer, default=1)
    status_code = Column(Integer)
    response_body = Column(Text)
    response_time_ms = Column(Integer)
    
    # Status
    status = Column(String(20), default='pending')  # 'pending', 'success', 'failed', 'cancelled'
    error_message = Column(Text)
    
    # Timing
    scheduled_at = Column(DateTime(timezone=True), server_default=func.now())
    delivered_at = Column(DateTime(timezone=True))
    
    # Relationships
    endpoint = relationship("WebhookEndpoint", back_populates="deliveries")

class BulkOperation(Base):
    """Track bulk import/export operations"""
    __tablename__ = "bulk_operations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Operation details
    operation_type = Column(String(50), nullable=False)  # 'import', 'export'
    resource_type = Column(String(100), nullable=False)  # 'inventory', 'customers', 'invoices'
    format = Column(String(20), nullable=False)  # 'csv', 'json', 'xlsx'
    
    # File details
    filename = Column(String(500))
    file_size_bytes = Column(Integer)
    file_path = Column(String(1000))  # Storage path
    
    # Processing details
    total_records = Column(Integer, default=0)
    processed_records = Column(Integer, default=0)
    successful_records = Column(Integer, default=0)
    failed_records = Column(Integer, default=0)
    
    # Status and progress
    status = Column(String(20), default='pending')  # 'pending', 'processing', 'completed', 'failed'
    progress_percentage = Column(DECIMAL(5, 2), default=0)
    
    # Results
    validation_errors = Column(JSONB, default=[])
    processing_errors = Column(JSONB, default=[])
    summary = Column(JSONB, default={})
    
    # Metadata
    configuration = Column(JSONB, default={})  # Import/export configuration
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    
    # Timing
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class WorkflowAutomation(Base):
    """Workflow automation rules and triggers"""
    __tablename__ = "workflow_automations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Rule configuration
    name = Column(String(200), nullable=False)
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    
    # Trigger configuration
    trigger_event = Column(String(100), nullable=False)  # 'invoice.created', 'inventory.low_stock'
    trigger_conditions = Column(JSONB, default={})  # Conditions that must be met
    
    # Action configuration
    actions = Column(JSONB, nullable=False)  # List of actions to execute
    action_delay_seconds = Column(Integer, default=0)  # Delay before executing actions
    
    # Execution tracking
    execution_count = Column(Integer, default=0)
    last_executed_at = Column(DateTime(timezone=True))
    last_execution_status = Column(String(20))  # 'success', 'failed', 'partial'
    
    # Business context
    business_type = Column(String(50))
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    
    # Audit
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    executions = relationship("WorkflowExecution", back_populates="automation")

class WorkflowExecution(Base):
    """Track individual workflow automation executions"""
    __tablename__ = "workflow_executions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    automation_id = Column(UUID(as_uuid=True), ForeignKey("workflow_automations.id"))
    
    # Execution details
    trigger_data = Column(JSONB, nullable=False)  # Data that triggered the workflow
    execution_context = Column(JSONB, default={})  # Additional context
    
    # Results
    status = Column(String(20), default='pending')  # 'pending', 'running', 'success', 'failed'
    actions_executed = Column(Integer, default=0)
    actions_successful = Column(Integer, default=0)
    actions_failed = Column(Integer, default=0)
    
    # Error handling
    error_message = Column(Text)
    error_details = Column(JSONB)
    
    # Timing
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True))
    
    # Relationships
    automation = relationship("WorkflowAutomation", back_populates="executions")

class ExternalIntegration(Base):
    """Configuration for external service integrations"""
    __tablename__ = "external_integrations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Integration details
    name = Column(String(200), nullable=False)
    service_type = Column(String(100), nullable=False)  # 'payment_processor', 'shipping', 'accounting'
    provider = Column(String(100), nullable=False)  # 'stripe', 'paypal', 'fedex', 'quickbooks'
    
    # Configuration
    configuration = Column(JSONB, nullable=False)  # Service-specific configuration
    credentials = Column(JSONB, nullable=False)  # Encrypted credentials
    
    # Status
    is_active = Column(Boolean, default=True)
    is_configured = Column(Boolean, default=False)
    last_sync_at = Column(DateTime(timezone=True))
    last_error_at = Column(DateTime(timezone=True))
    last_error_message = Column(Text)
    
    # Business context
    business_type = Column(String(50))
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    
    # Audit
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    sync_logs = relationship("IntegrationSyncLog", back_populates="integration")

class IntegrationSyncLog(Base):
    """Track data synchronization with external systems"""
    __tablename__ = "integration_sync_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    integration_id = Column(UUID(as_uuid=True), ForeignKey("external_integrations.id"))
    
    # Sync details
    sync_type = Column(String(50), nullable=False)  # 'full', 'incremental', 'manual'
    direction = Column(String(20), nullable=False)  # 'inbound', 'outbound', 'bidirectional'
    resource_type = Column(String(100))  # 'customers', 'products', 'orders'
    
    # Results
    status = Column(String(20), default='pending')  # 'pending', 'running', 'success', 'failed'
    records_processed = Column(Integer, default=0)
    records_successful = Column(Integer, default=0)
    records_failed = Column(Integer, default=0)
    
    # Error handling
    error_message = Column(Text)
    error_details = Column(JSONB)
    
    # Timing
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True))
    
    # Relationships
    integration = relationship("ExternalIntegration", back_populates="sync_logs")

# Create indexes for performance
Index('idx_api_keys_key_hash', APIKey.key_hash)
Index('idx_api_keys_active', APIKey.is_active)
Index('idx_api_usage_logs_api_key_timestamp', APIUsageLog.api_key_id, APIUsageLog.timestamp)
Index('idx_webhook_endpoints_active', WebhookEndpoint.is_active)
Index('idx_webhook_deliveries_status', WebhookDelivery.status)
Index('idx_bulk_operations_status', BulkOperation.status)
Index('idx_workflow_automations_active', WorkflowAutomation.is_active)
Index('idx_workflow_executions_status', WorkflowExecution.status)
Index('idx_external_integrations_active', ExternalIntegration.is_active)
Index('idx_integration_sync_logs_status', IntegrationSyncLog.status)