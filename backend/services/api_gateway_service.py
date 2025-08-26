"""
API Gateway Service
Comprehensive API management, rate limiting, and integration capabilities
"""

import hashlib
import secrets
import json
import asyncio
import aiohttp
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc
from fastapi import HTTPException, status
import logging

from models_api_gateway import (
    APIKey, APIUsageLog, WebhookEndpoint, WebhookDelivery,
    BulkOperation, WorkflowAutomation, WorkflowExecution,
    ExternalIntegration, IntegrationSyncLog
)

logger = logging.getLogger(__name__)

class APIKeyService:
    """Service for managing API keys and authentication"""
    
    @staticmethod
    def generate_api_key() -> Tuple[str, str, str]:
        """Generate a new API key with prefix and hash"""
        # Generate random key
        key = secrets.token_urlsafe(32)
        
        # Create prefix for identification
        prefix = f"gsp_{secrets.token_hex(4)}"
        full_key = f"{prefix}_{key}"
        
        # Hash for storage
        key_hash = hashlib.sha256(full_key.encode()).hexdigest()
        
        return full_key, prefix, key_hash
    
    @staticmethod
    def create_api_key(
        db: Session,
        name: str,
        scopes: List[str],
        permissions: Dict[str, Any],
        created_by: str,
        business_type: str = None,
        rate_limits: Dict[str, int] = None,
        expires_at: datetime = None
    ) -> Tuple[APIKey, str]:
        """Create a new API key"""
        
        # Generate key
        full_key, prefix, key_hash = APIKeyService.generate_api_key()
        
        # Set default rate limits
        if not rate_limits:
            rate_limits = {
                'per_minute': 60,
                'per_hour': 1000,
                'per_day': 10000
            }
        
        # Create API key record
        api_key = APIKey(
            name=name,
            key_hash=key_hash,
            key_prefix=prefix,
            scopes=scopes,
            permissions=permissions,
            rate_limit_per_minute=rate_limits.get('per_minute', 60),
            rate_limit_per_hour=rate_limits.get('per_hour', 1000),
            rate_limit_per_day=rate_limits.get('per_day', 10000),
            created_by=created_by,
            business_type=business_type,
            expires_at=expires_at
        )
        
        db.add(api_key)
        db.commit()
        db.refresh(api_key)
        
        logger.info(f"Created API key: {name} with prefix {prefix}")
        return api_key, full_key
    
    @staticmethod
    def authenticate_api_key(db: Session, api_key: str) -> Optional[APIKey]:
        """Authenticate and validate API key"""
        if not api_key:
            return None
        
        # Hash the provided key
        key_hash = hashlib.sha256(api_key.encode()).hexdigest()
        
        # Find the API key
        db_key = db.query(APIKey).filter(
            and_(
                APIKey.key_hash == key_hash,
                APIKey.is_active == True,
                or_(
                    APIKey.expires_at.is_(None),
                    APIKey.expires_at > datetime.utcnow()
                )
            )
        ).first()
        
        if db_key:
            # Update last used timestamp
            db_key.last_used_at = datetime.utcnow()
            db.commit()
            
        return db_key
    
    @staticmethod
    def check_rate_limit(db: Session, api_key_id: str) -> Dict[str, Any]:
        """Check if API key has exceeded rate limits"""
        now = datetime.utcnow()
        
        # Get API key
        api_key = db.query(APIKey).filter(APIKey.id == api_key_id).first()
        if not api_key:
            return {'allowed': False, 'reason': 'Invalid API key'}
        
        # Check minute limit
        minute_ago = now - timedelta(minutes=1)
        minute_count = db.query(APIUsageLog).filter(
            and_(
                APIUsageLog.api_key_id == api_key_id,
                APIUsageLog.timestamp >= minute_ago
            )
        ).count()
        
        if minute_count >= api_key.rate_limit_per_minute:
            return {
                'allowed': False,
                'reason': 'Rate limit exceeded (per minute)',
                'limit': api_key.rate_limit_per_minute,
                'current': minute_count,
                'reset_at': minute_ago + timedelta(minutes=1)
            }
        
        # Check hour limit
        hour_ago = now - timedelta(hours=1)
        hour_count = db.query(APIUsageLog).filter(
            and_(
                APIUsageLog.api_key_id == api_key_id,
                APIUsageLog.timestamp >= hour_ago
            )
        ).count()
        
        if hour_count >= api_key.rate_limit_per_hour:
            return {
                'allowed': False,
                'reason': 'Rate limit exceeded (per hour)',
                'limit': api_key.rate_limit_per_hour,
                'current': hour_count,
                'reset_at': hour_ago + timedelta(hours=1)
            }
        
        # Check day limit
        day_ago = now - timedelta(days=1)
        day_count = db.query(APIUsageLog).filter(
            and_(
                APIUsageLog.api_key_id == api_key_id,
                APIUsageLog.timestamp >= day_ago
            )
        ).count()
        
        if day_count >= api_key.rate_limit_per_day:
            return {
                'allowed': False,
                'reason': 'Rate limit exceeded (per day)',
                'limit': api_key.rate_limit_per_day,
                'current': day_count,
                'reset_at': day_ago + timedelta(days=1)
            }
        
        return {
            'allowed': True,
            'limits': {
                'minute': {'current': minute_count, 'limit': api_key.rate_limit_per_minute},
                'hour': {'current': hour_count, 'limit': api_key.rate_limit_per_hour},
                'day': {'current': day_count, 'limit': api_key.rate_limit_per_day}
            }
        }
    
    @staticmethod
    def log_api_usage(
        db: Session,
        api_key_id: str,
        endpoint: str,
        method: str,
        status_code: int,
        response_time_ms: int = None,
        ip_address: str = None,
        user_agent: str = None,
        request_size: int = None,
        response_size: int = None,
        resource_type: str = None,
        resource_id: str = None,
        business_operation: str = None
    ):
        """Log API usage for analytics and rate limiting"""
        
        usage_log = APIUsageLog(
            api_key_id=api_key_id,
            endpoint=endpoint,
            method=method,
            status_code=status_code,
            response_time_ms=response_time_ms,
            ip_address=ip_address,
            user_agent=user_agent,
            request_size_bytes=request_size,
            response_size_bytes=response_size,
            resource_type=resource_type,
            resource_id=resource_id,
            business_operation=business_operation
        )
        
        db.add(usage_log)
        db.commit()

class WebhookService:
    """Service for managing webhooks and event notifications"""
    
    @staticmethod
    def create_webhook_endpoint(
        db: Session,
        api_key_id: str,
        name: str,
        url: str,
        events: List[str],
        secret: str = None,
        event_filters: Dict[str, Any] = None,
        timeout_seconds: int = 30,
        retry_attempts: int = 3
    ) -> WebhookEndpoint:
        """Create a new webhook endpoint"""
        
        if not secret:
            secret = secrets.token_urlsafe(32)
        
        webhook = WebhookEndpoint(
            api_key_id=api_key_id,
            name=name,
            url=url,
            secret=secret,
            events=events,
            event_filters=event_filters or {},
            timeout_seconds=timeout_seconds,
            retry_attempts=retry_attempts
        )
        
        db.add(webhook)
        db.commit()
        db.refresh(webhook)
        
        logger.info(f"Created webhook endpoint: {name} for events: {events}")
        return webhook
    
    @staticmethod
    async def send_webhook(
        db: Session,
        event_type: str,
        event_data: Dict[str, Any],
        resource_type: str = None,
        resource_id: str = None
    ):
        """Send webhook notifications for an event"""
        
        # Find all active webhook endpoints for this event
        webhooks = db.query(WebhookEndpoint).filter(
            and_(
                WebhookEndpoint.is_active == True,
                WebhookEndpoint.events.contains([event_type])
            )
        ).all()
        
        if not webhooks:
            logger.debug(f"No webhooks configured for event: {event_type}")
            return
        
        # Create delivery records and send webhooks
        for webhook in webhooks:
            # Check event filters
            if not WebhookService._matches_filters(event_data, webhook.event_filters):
                continue
            
            # Create delivery record
            delivery = WebhookDelivery(
                endpoint_id=webhook.id,
                event_type=event_type,
                event_id=event_data.get('id', str(secrets.token_hex(16))),
                payload={
                    'event': event_type,
                    'data': event_data,
                    'timestamp': datetime.utcnow().isoformat(),
                    'resource_type': resource_type,
                    'resource_id': resource_id
                }
            )
            
            db.add(delivery)
            db.commit()
            db.refresh(delivery)
            
            # Send webhook asynchronously
            asyncio.create_task(
                WebhookService._deliver_webhook(db, delivery.id)
            )
    
    @staticmethod
    def _matches_filters(event_data: Dict[str, Any], filters: Dict[str, Any]) -> bool:
        """Check if event data matches webhook filters"""
        if not filters:
            return True
        
        for key, expected_value in filters.items():
            if key not in event_data:
                return False
            
            actual_value = event_data[key]
            
            # Handle different filter types
            if isinstance(expected_value, list):
                if actual_value not in expected_value:
                    return False
            elif isinstance(expected_value, dict):
                # Range filters, etc.
                if 'min' in expected_value and actual_value < expected_value['min']:
                    return False
                if 'max' in expected_value and actual_value > expected_value['max']:
                    return False
            else:
                if actual_value != expected_value:
                    return False
        
        return True
    
    @staticmethod
    async def _deliver_webhook(db: Session, delivery_id: str):
        """Deliver a webhook with retry logic"""
        delivery = db.query(WebhookDelivery).filter(
            WebhookDelivery.id == delivery_id
        ).first()
        
        if not delivery:
            return
        
        webhook = delivery.endpoint
        max_attempts = webhook.retry_attempts
        
        for attempt in range(1, max_attempts + 1):
            try:
                delivery.attempt_number = attempt
                delivery.status = 'pending'
                db.commit()
                
                # Prepare webhook payload
                payload = delivery.payload.copy()
                payload['delivery_id'] = str(delivery.id)
                payload['attempt'] = attempt
                
                # Create signature for verification
                signature = WebhookService._create_signature(
                    json.dumps(payload, sort_keys=True),
                    webhook.secret
                )
                
                headers = {
                    'Content-Type': 'application/json',
                    'X-Webhook-Signature': signature,
                    'X-Webhook-Event': delivery.event_type,
                    'X-Webhook-Delivery': str(delivery.id)
                }
                
                # Send webhook
                start_time = datetime.utcnow()
                
                async with aiohttp.ClientSession(
                    timeout=aiohttp.ClientTimeout(total=webhook.timeout_seconds)
                ) as session:
                    async with session.post(
                        webhook.url,
                        json=payload,
                        headers=headers
                    ) as response:
                        end_time = datetime.utcnow()
                        response_time = int((end_time - start_time).total_seconds() * 1000)
                        
                        delivery.status_code = response.status
                        delivery.response_time_ms = response_time
                        delivery.response_body = await response.text()
                        delivery.delivered_at = end_time
                        
                        if response.status < 400:
                            # Success
                            delivery.status = 'success'
                            webhook.last_success_at = end_time
                            webhook.consecutive_failures = 0
                            
                            db.commit()
                            logger.info(f"Webhook delivered successfully: {webhook.name}")
                            return
                        else:
                            # HTTP error
                            delivery.status = 'failed'
                            delivery.error_message = f"HTTP {response.status}: {response.reason}"
                            
            except Exception as e:
                # Network or other error
                delivery.status = 'failed'
                delivery.error_message = str(e)
                delivery.delivered_at = datetime.utcnow()
                
                logger.error(f"Webhook delivery failed: {webhook.name}, attempt {attempt}, error: {e}")
            
            db.commit()
            
            # If not the last attempt, wait before retrying
            if attempt < max_attempts:
                backoff_seconds = webhook.retry_backoff_seconds * (2 ** (attempt - 1))
                await asyncio.sleep(backoff_seconds)
        
        # All attempts failed
        webhook.last_failure_at = datetime.utcnow()
        webhook.consecutive_failures += 1
        
        # Disable webhook if too many consecutive failures
        if webhook.consecutive_failures >= 10:
            webhook.is_active = False
            logger.warning(f"Disabled webhook due to consecutive failures: {webhook.name}")
        
        db.commit()
    
    @staticmethod
    def _create_signature(payload: str, secret: str) -> str:
        """Create HMAC signature for webhook verification"""
        import hmac
        
        signature = hmac.new(
            secret.encode(),
            payload.encode(),
            hashlib.sha256
        ).hexdigest()
        
        return f"sha256={signature}"

class BulkOperationService:
    """Service for handling bulk import/export operations"""
    
    @staticmethod
    def create_bulk_operation(
        db: Session,
        operation_type: str,
        resource_type: str,
        format: str,
        filename: str,
        created_by: str,
        configuration: Dict[str, Any] = None
    ) -> BulkOperation:
        """Create a new bulk operation"""
        
        operation = BulkOperation(
            operation_type=operation_type,
            resource_type=resource_type,
            format=format,
            filename=filename,
            created_by=created_by,
            configuration=configuration or {}
        )
        
        db.add(operation)
        db.commit()
        db.refresh(operation)
        
        logger.info(f"Created bulk operation: {operation_type} {resource_type} ({format})")
        return operation
    
    @staticmethod
    async def process_bulk_import(
        db: Session,
        operation_id: str,
        file_data: bytes
    ):
        """Process bulk import operation"""
        operation = db.query(BulkOperation).filter(
            BulkOperation.id == operation_id
        ).first()
        
        if not operation:
            raise HTTPException(status_code=404, detail="Bulk operation not found")
        
        try:
            operation.status = 'processing'
            operation.started_at = datetime.utcnow()
            db.commit()
            
            # Process based on format and resource type
            if operation.format == 'csv':
                await BulkOperationService._process_csv_import(db, operation, file_data)
            elif operation.format == 'json':
                await BulkOperationService._process_json_import(db, operation, file_data)
            elif operation.format == 'xlsx':
                await BulkOperationService._process_xlsx_import(db, operation, file_data)
            else:
                raise ValueError(f"Unsupported format: {operation.format}")
            
            operation.status = 'completed'
            operation.completed_at = datetime.utcnow()
            
        except Exception as e:
            operation.status = 'failed'
            operation.processing_errors = [{'error': str(e), 'timestamp': datetime.utcnow().isoformat()}]
            operation.completed_at = datetime.utcnow()
            
            logger.error(f"Bulk import failed: {operation_id}, error: {e}")
        
        finally:
            db.commit()
    
    @staticmethod
    async def _process_csv_import(db: Session, operation: BulkOperation, file_data: bytes):
        """Process CSV import"""
        import csv
        import io
        
        # Parse CSV data
        csv_data = file_data.decode('utf-8')
        reader = csv.DictReader(io.StringIO(csv_data))
        
        rows = list(reader)
        operation.total_records = len(rows)
        db.commit()
        
        # Process each row
        for i, row in enumerate(rows):
            try:
                # Validate and process row based on resource type
                if operation.resource_type == 'inventory':
                    await BulkOperationService._import_inventory_item(db, row, operation.configuration)
                elif operation.resource_type == 'customers':
                    await BulkOperationService._import_customer(db, row, operation.configuration)
                elif operation.resource_type == 'invoices':
                    await BulkOperationService._import_invoice(db, row, operation.configuration)
                
                operation.successful_records += 1
                
            except Exception as e:
                operation.failed_records += 1
                if not operation.validation_errors:
                    operation.validation_errors = []
                
                operation.validation_errors.append({
                    'row': i + 1,
                    'error': str(e),
                    'data': row
                })
            
            operation.processed_records += 1
            operation.progress_percentage = (operation.processed_records / operation.total_records) * 100
            
            # Commit progress every 100 records
            if i % 100 == 0:
                db.commit()
        
        db.commit()
    
    @staticmethod
    async def _import_inventory_item(db: Session, row: Dict[str, Any], config: Dict[str, Any]):
        """Import a single inventory item"""
        from models_universal import InventoryItem, Category
        
        # Map CSV columns to model fields
        item_data = {
            'name': row.get('name') or row.get('item_name'),
            'description': row.get('description'),
            'sku': row.get('sku'),
            'barcode': row.get('barcode'),
            'cost_price': float(row.get('cost_price', 0)),
            'sale_price': float(row.get('sale_price', 0)),
            'stock_quantity': float(row.get('stock_quantity', 0)),
            'unit_of_measure': row.get('unit_of_measure', 'piece')
        }
        
        # Handle category
        if row.get('category'):
            category = db.query(Category).filter(
                Category.name == row['category']
            ).first()
            if category:
                item_data['category_id'] = category.id
        
        # Create inventory item
        item = InventoryItem(**item_data)
        db.add(item)
        db.flush()  # Get ID without committing
        
        return item
    
    @staticmethod
    async def _import_customer(db: Session, row: Dict[str, Any], config: Dict[str, Any]):
        """Import a single customer"""
        from models_universal import Customer
        
        customer_data = {
            'name': row.get('name') or row.get('customer_name'),
            'email': row.get('email'),
            'phone': row.get('phone'),
            'address': row.get('address'),
            'city': row.get('city'),
            'country': row.get('country')
        }
        
        customer = Customer(**customer_data)
        db.add(customer)
        db.flush()
        
        return customer
    
    @staticmethod
    async def _import_invoice(db: Session, row: Dict[str, Any], config: Dict[str, Any]):
        """Import a single invoice"""
        # This would be more complex, involving invoice items, etc.
        # Implementation depends on specific invoice structure
        pass

class WorkflowAutomationService:
    """Service for workflow automation and triggers"""
    
    @staticmethod
    def create_automation(
        db: Session,
        name: str,
        description: str,
        trigger_event: str,
        trigger_conditions: Dict[str, Any],
        actions: List[Dict[str, Any]],
        created_by: str,
        business_type: str = None,
        action_delay_seconds: int = 0
    ) -> WorkflowAutomation:
        """Create a new workflow automation"""
        
        automation = WorkflowAutomation(
            name=name,
            description=description,
            trigger_event=trigger_event,
            trigger_conditions=trigger_conditions,
            actions=actions,
            action_delay_seconds=action_delay_seconds,
            business_type=business_type,
            created_by=created_by
        )
        
        db.add(automation)
        db.commit()
        db.refresh(automation)
        
        logger.info(f"Created workflow automation: {name}")
        return automation
    
    @staticmethod
    async def trigger_automations(
        db: Session,
        event_type: str,
        event_data: Dict[str, Any]
    ):
        """Trigger workflow automations for an event"""
        
        # Find matching automations
        automations = db.query(WorkflowAutomation).filter(
            and_(
                WorkflowAutomation.is_active == True,
                WorkflowAutomation.trigger_event == event_type
            )
        ).all()
        
        for automation in automations:
            # Check if conditions are met
            if WorkflowAutomationService._check_conditions(event_data, automation.trigger_conditions):
                # Execute automation
                asyncio.create_task(
                    WorkflowAutomationService._execute_automation(db, automation.id, event_data)
                )
    
    @staticmethod
    def _check_conditions(event_data: Dict[str, Any], conditions: Dict[str, Any]) -> bool:
        """Check if event data meets automation conditions"""
        if not conditions:
            return True
        
        # Similar to webhook filters but more complex logic
        for condition_key, condition_value in conditions.items():
            if condition_key not in event_data:
                return False
            
            actual_value = event_data[condition_key]
            
            # Handle different condition types
            if isinstance(condition_value, dict):
                if 'equals' in condition_value and actual_value != condition_value['equals']:
                    return False
                if 'greater_than' in condition_value and actual_value <= condition_value['greater_than']:
                    return False
                if 'less_than' in condition_value and actual_value >= condition_value['less_than']:
                    return False
                if 'contains' in condition_value and condition_value['contains'] not in str(actual_value):
                    return False
            else:
                if actual_value != condition_value:
                    return False
        
        return True
    
    @staticmethod
    async def _execute_automation(db: Session, automation_id: str, trigger_data: Dict[str, Any]):
        """Execute a workflow automation"""
        automation = db.query(WorkflowAutomation).filter(
            WorkflowAutomation.id == automation_id
        ).first()
        
        if not automation:
            return
        
        # Create execution record
        execution = WorkflowExecution(
            automation_id=automation_id,
            trigger_data=trigger_data,
            status='running'
        )
        
        db.add(execution)
        db.commit()
        db.refresh(execution)
        
        try:
            # Wait for delay if specified
            if automation.action_delay_seconds > 0:
                await asyncio.sleep(automation.action_delay_seconds)
            
            # Execute each action
            for action in automation.actions:
                try:
                    await WorkflowAutomationService._execute_action(db, action, trigger_data)
                    execution.actions_successful += 1
                except Exception as e:
                    execution.actions_failed += 1
                    logger.error(f"Action failed in automation {automation.name}: {e}")
                
                execution.actions_executed += 1
            
            execution.status = 'success' if execution.actions_failed == 0 else 'partial'
            
            # Update automation stats
            automation.execution_count += 1
            automation.last_executed_at = datetime.utcnow()
            automation.last_execution_status = execution.status
            
        except Exception as e:
            execution.status = 'failed'
            execution.error_message = str(e)
            
            automation.last_execution_status = 'failed'
            
            logger.error(f"Automation execution failed: {automation.name}, error: {e}")
        
        finally:
            execution.completed_at = datetime.utcnow()
            db.commit()
    
    @staticmethod
    async def _execute_action(db: Session, action: Dict[str, Any], trigger_data: Dict[str, Any]):
        """Execute a single automation action"""
        action_type = action.get('type')
        
        if action_type == 'send_email':
            await WorkflowAutomationService._send_email_action(action, trigger_data)
        elif action_type == 'send_sms':
            await WorkflowAutomationService._send_sms_action(action, trigger_data)
        elif action_type == 'create_task':
            await WorkflowAutomationService._create_task_action(db, action, trigger_data)
        elif action_type == 'update_record':
            await WorkflowAutomationService._update_record_action(db, action, trigger_data)
        elif action_type == 'webhook':
            await WorkflowAutomationService._webhook_action(action, trigger_data)
        else:
            raise ValueError(f"Unknown action type: {action_type}")
    
    @staticmethod
    async def _send_email_action(action: Dict[str, Any], trigger_data: Dict[str, Any]):
        """Execute send email action"""
        # Implementation would integrate with email service
        logger.info(f"Would send email: {action.get('subject')} to {action.get('to')}")
    
    @staticmethod
    async def _send_sms_action(action: Dict[str, Any], trigger_data: Dict[str, Any]):
        """Execute send SMS action"""
        # Implementation would integrate with SMS service
        logger.info(f"Would send SMS: {action.get('message')} to {action.get('phone')}")
    
    @staticmethod
    async def _create_task_action(db: Session, action: Dict[str, Any], trigger_data: Dict[str, Any]):
        """Execute create task action"""
        # Implementation would create a task/reminder record
        logger.info(f"Would create task: {action.get('title')}")
    
    @staticmethod
    async def _update_record_action(db: Session, action: Dict[str, Any], trigger_data: Dict[str, Any]):
        """Execute update record action"""
        # Implementation would update specified database record
        logger.info(f"Would update {action.get('table')} record {action.get('id')}")
    
    @staticmethod
    async def _webhook_action(action: Dict[str, Any], trigger_data: Dict[str, Any]):
        """Execute webhook action"""
        # Implementation would send HTTP request to specified URL
        logger.info(f"Would send webhook to: {action.get('url')}")

class ExternalIntegrationService:
    """Service for managing external service integrations"""
    
    @staticmethod
    def create_integration(
        db: Session,
        name: str,
        service_type: str,
        provider: str,
        configuration: Dict[str, Any],
        credentials: Dict[str, Any],
        created_by: str,
        business_type: str = None
    ) -> ExternalIntegration:
        """Create a new external integration"""
        
        # Encrypt credentials (in production, use proper encryption)
        encrypted_credentials = credentials  # TODO: Implement encryption
        
        integration = ExternalIntegration(
            name=name,
            service_type=service_type,
            provider=provider,
            configuration=configuration,
            credentials=encrypted_credentials,
            business_type=business_type,
            created_by=created_by
        )
        
        db.add(integration)
        db.commit()
        db.refresh(integration)
        
        logger.info(f"Created external integration: {name} ({provider})")
        return integration
    
    @staticmethod
    async def sync_integration(
        db: Session,
        integration_id: str,
        sync_type: str = 'incremental',
        resource_types: List[str] = None
    ):
        """Synchronize data with external integration"""
        
        integration = db.query(ExternalIntegration).filter(
            ExternalIntegration.id == integration_id
        ).first()
        
        if not integration or not integration.is_active:
            raise HTTPException(status_code=404, detail="Integration not found or inactive")
        
        # Create sync log
        sync_log = IntegrationSyncLog(
            integration_id=integration_id,
            sync_type=sync_type,
            direction='bidirectional',
            status='running'
        )
        
        db.add(sync_log)
        db.commit()
        db.refresh(sync_log)
        
        try:
            # Perform sync based on provider
            if integration.provider == 'quickbooks':
                await ExternalIntegrationService._sync_quickbooks(db, integration, sync_log)
            elif integration.provider == 'stripe':
                await ExternalIntegrationService._sync_stripe(db, integration, sync_log)
            elif integration.provider == 'shopify':
                await ExternalIntegrationService._sync_shopify(db, integration, sync_log)
            else:
                raise ValueError(f"Unsupported provider: {integration.provider}")
            
            sync_log.status = 'success'
            integration.last_sync_at = datetime.utcnow()
            
        except Exception as e:
            sync_log.status = 'failed'
            sync_log.error_message = str(e)
            integration.last_error_at = datetime.utcnow()
            integration.last_error_message = str(e)
            
            logger.error(f"Integration sync failed: {integration.name}, error: {e}")
        
        finally:
            sync_log.completed_at = datetime.utcnow()
            db.commit()
    
    @staticmethod
    async def _sync_quickbooks(db: Session, integration: ExternalIntegration, sync_log: IntegrationSyncLog):
        """Sync with QuickBooks integration"""
        # Implementation would use QuickBooks API
        logger.info(f"Syncing with QuickBooks: {integration.name}")
        
        # Mock sync process
        sync_log.records_processed = 100
        sync_log.records_successful = 95
        sync_log.records_failed = 5
    
    @staticmethod
    async def _sync_stripe(db: Session, integration: ExternalIntegration, sync_log: IntegrationSyncLog):
        """Sync with Stripe integration"""
        # Implementation would use Stripe API
        logger.info(f"Syncing with Stripe: {integration.name}")
        
        # Mock sync process
        sync_log.records_processed = 50
        sync_log.records_successful = 50
        sync_log.records_failed = 0
    
    @staticmethod
    async def _sync_shopify(db: Session, integration: ExternalIntegration, sync_log: IntegrationSyncLog):
        """Sync with Shopify integration"""
        # Implementation would use Shopify API
        logger.info(f"Syncing with Shopify: {integration.name}")
        
        # Mock sync process
        sync_log.records_processed = 200
        sync_log.records_successful = 190
        sync_log.records_failed = 10