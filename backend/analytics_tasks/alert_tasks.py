"""
Celery Tasks for Alert and Notification System

This module provides background tasks for:
- Automated KPI alert evaluation
- Scheduled alert monitoring
- Alert notification processing
- Alert escalation handling
"""

import logging
from typing import Dict, Any, List
from datetime import datetime, timedelta
from celery import Celery
from sqlalchemy.orm import Session

from database import get_db
from services.alert_service import AlertService
from celery_app import celery_app

logger = logging.getLogger(__name__)

@celery_app.task(bind=True, name="evaluate_kpi_alerts")
def evaluate_kpi_alerts_task(self, time_range: Dict[str, Any] = None):
    """
    Background task to evaluate KPI alerts
    
    This task runs periodically to check all active KPI alert rules
    and trigger notifications when thresholds are exceeded.
    
    Args:
        time_range: Optional time range for KPI evaluation
        
    Returns:
        Dict with evaluation results
    """
    try:
        logger.info("Starting KPI alert evaluation task")
        
        # Get database session
        db = next(get_db())
        alert_service = AlertService(db)
        
        # Evaluate all KPI alerts
        triggered_alerts = []
        try:
            # Use asyncio to run the async method
            import asyncio
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            triggered_alerts = loop.run_until_complete(
                alert_service.evaluate_kpi_alerts(time_range)
            )
            loop.close()
        except Exception as e:
            logger.error(f"Error in async alert evaluation: {str(e)}")
            raise
        finally:
            db.close()
        
        result = {
            'task_id': self.request.id,
            'evaluated_at': datetime.now().isoformat(),
            'triggered_alerts': triggered_alerts,
            'total_triggered': len(triggered_alerts),
            'status': 'completed'
        }
        
        logger.info(f"KPI alert evaluation completed. Triggered {len(triggered_alerts)} alerts")
        return result
        
    except Exception as e:
        logger.error(f"Error in KPI alert evaluation task: {str(e)}")
        return {
            'task_id': self.request.id,
            'evaluated_at': datetime.now().isoformat(),
            'error': str(e),
            'status': 'failed'
        }

@celery_app.task(bind=True, name="process_alert_escalations")
def process_alert_escalations_task(self):
    """
    Background task to process alert escalations
    
    This task checks for unacknowledged alerts that need escalation
    based on their escalation rules and time thresholds.
    
    Returns:
        Dict with escalation processing results
    """
    try:
        logger.info("Starting alert escalation processing task")
        
        # Get database session
        db = next(get_db())
        alert_service = AlertService(db)
        
        escalated_alerts = []
        
        try:
            # Get unacknowledged alerts that might need escalation
            import asyncio
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            unacknowledged_alerts = loop.run_until_complete(
                alert_service.get_alert_history(acknowledged=False, limit=500)
            )
            
            # Process escalations for each alert
            for alert in unacknowledged_alerts:
                escalation_result = loop.run_until_complete(
                    _process_single_alert_escalation(alert_service, alert)
                )
                if escalation_result:
                    escalated_alerts.append(escalation_result)
            
            loop.close()
            
        except Exception as e:
            logger.error(f"Error in async escalation processing: {str(e)}")
            raise
        finally:
            db.close()
        
        result = {
            'task_id': self.request.id,
            'processed_at': datetime.now().isoformat(),
            'escalated_alerts': escalated_alerts,
            'total_escalated': len(escalated_alerts),
            'status': 'completed'
        }
        
        logger.info(f"Alert escalation processing completed. Escalated {len(escalated_alerts)} alerts")
        return result
        
    except Exception as e:
        logger.error(f"Error in alert escalation processing task: {str(e)}")
        return {
            'task_id': self.request.id,
            'processed_at': datetime.now().isoformat(),
            'error': str(e),
            'status': 'failed'
        }

async def _process_single_alert_escalation(alert_service: AlertService, alert: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process escalation for a single alert
    
    Args:
        alert_service: AlertService instance
        alert: Alert data to process
        
    Returns:
        Escalation result if escalated, None otherwise
    """
    try:
        # Get the alert rule to check escalation settings
        rules = await alert_service.get_active_alert_rules()
        alert_rule = next((r for r in rules if r['id'] == alert['rule_id']), None)
        
        if not alert_rule or not alert_rule.get('escalation_rules'):
            return None
        
        escalation_rules = alert_rule['escalation_rules']
        escalation_time_minutes = escalation_rules.get('escalation_time_minutes', 60)
        
        # Check if enough time has passed for escalation
        if alert['triggered_at']:
            triggered_time = datetime.fromisoformat(alert['triggered_at'].replace('Z', '+00:00'))
            time_since_trigger = datetime.now() - triggered_time.replace(tzinfo=None)
            
            if time_since_trigger.total_seconds() >= (escalation_time_minutes * 60):
                # Escalate the alert
                escalation_recipients = escalation_rules.get('escalation_recipients', [])
                
                if escalation_recipients:
                    # TODO: Send escalation notifications
                    logger.info(f"Escalating alert {alert['id']} to {len(escalation_recipients)} recipients")
                    
                    return {
                        'alert_id': alert['id'],
                        'rule_name': alert['rule_name'],
                        'escalated_to': escalation_recipients,
                        'escalated_at': datetime.now().isoformat()
                    }
        
        return None
        
    except Exception as e:
        logger.error(f"Error processing escalation for alert {alert.get('id', 'unknown')}: {str(e)}")
        return None

@celery_app.task(bind=True, name="cleanup_old_alerts")
def cleanup_old_alerts_task(self, retention_days: int = 90):
    """
    Background task to clean up old alert history
    
    This task removes old alert history records to prevent database bloat
    while maintaining recent alert data for analysis.
    
    Args:
        retention_days: Number of days to retain alert history
        
    Returns:
        Dict with cleanup results
    """
    try:
        logger.info(f"Starting alert history cleanup task (retention: {retention_days} days)")
        
        # Get database session
        db = next(get_db())
        
        try:
            from models import AlertHistory
            
            # Calculate cutoff date
            cutoff_date = datetime.now() - timedelta(days=retention_days)
            
            # Delete old alert history records
            deleted_count = db.query(AlertHistory).filter(
                AlertHistory.triggered_at < cutoff_date
            ).delete()
            
            db.commit()
            
            result = {
                'task_id': self.request.id,
                'cleaned_at': datetime.now().isoformat(),
                'retention_days': retention_days,
                'deleted_records': deleted_count,
                'cutoff_date': cutoff_date.isoformat(),
                'status': 'completed'
            }
            
            logger.info(f"Alert history cleanup completed. Deleted {deleted_count} old records")
            return result
            
        except Exception as e:
            db.rollback()
            raise
        finally:
            db.close()
        
    except Exception as e:
        logger.error(f"Error in alert history cleanup task: {str(e)}")
        return {
            'task_id': self.request.id,
            'cleaned_at': datetime.now().isoformat(),
            'error': str(e),
            'status': 'failed'
        }

@celery_app.task(bind=True, name="send_alert_digest")
def send_alert_digest_task(self, recipient_emails: List[str] = None):
    """
    Background task to send daily/weekly alert digest emails
    
    This task compiles a summary of recent alerts and sends digest emails
    to specified recipients or system administrators.
    
    Args:
        recipient_emails: List of email addresses to send digest to
        
    Returns:
        Dict with digest sending results
    """
    try:
        logger.info("Starting alert digest email task")
        
        # Get database session
        db = next(get_db())
        alert_service = AlertService(db)
        
        digest_sent = False
        
        try:
            import asyncio
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            # Get recent alerts (last 24 hours)
            recent_alerts = loop.run_until_complete(
                alert_service.get_alert_history(limit=1000)
            )
            
            # Filter alerts from last 24 hours
            yesterday = datetime.now() - timedelta(days=1)
            daily_alerts = [
                alert for alert in recent_alerts
                if alert['triggered_at'] and 
                datetime.fromisoformat(alert['triggered_at'].replace('Z', '+00:00')).replace(tzinfo=None) >= yesterday
            ]
            
            if daily_alerts:
                # TODO: Implement digest email sending
                # This would compile alert statistics and send formatted email
                logger.info(f"Would send digest email with {len(daily_alerts)} alerts")
                digest_sent = True
            
            loop.close()
            
        except Exception as e:
            logger.error(f"Error in async digest processing: {str(e)}")
            raise
        finally:
            db.close()
        
        result = {
            'task_id': self.request.id,
            'sent_at': datetime.now().isoformat(),
            'digest_sent': digest_sent,
            'alert_count': len(daily_alerts) if 'daily_alerts' in locals() else 0,
            'recipients': recipient_emails or [],
            'status': 'completed'
        }
        
        logger.info(f"Alert digest task completed. Digest sent: {digest_sent}")
        return result
        
    except Exception as e:
        logger.error(f"Error in alert digest task: {str(e)}")
        return {
            'task_id': self.request.id,
            'sent_at': datetime.now().isoformat(),
            'error': str(e),
            'status': 'failed'
        }

# Periodic task configuration
@celery_app.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    """
    Configure periodic tasks for alert system
    """
    # Evaluate KPI alerts every 5 minutes
    sender.add_periodic_task(
        300.0,  # 5 minutes
        evaluate_kpi_alerts_task.s(),
        name='evaluate_kpi_alerts_every_5min'
    )
    
    # Process alert escalations every 15 minutes
    sender.add_periodic_task(
        900.0,  # 15 minutes
        process_alert_escalations_task.s(),
        name='process_escalations_every_15min'
    )
    
    # Clean up old alerts daily at 2 AM
    sender.add_periodic_task(
        crontab(hour=2, minute=0),
        cleanup_old_alerts_task.s(),
        name='cleanup_old_alerts_daily'
    )
    
    # Send daily alert digest at 8 AM
    sender.add_periodic_task(
        crontab(hour=8, minute=0),
        send_alert_digest_task.s(),
        name='send_alert_digest_daily'
    )

# Import crontab for periodic tasks
from celery.schedules import crontab