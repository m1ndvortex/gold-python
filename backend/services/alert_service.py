"""
Alert Service for KPI Threshold Monitoring and Notifications

This service provides:
- KPI threshold monitoring and alert generation
- Email notification system for analytics alerts
- Integration with WebSocket service for real-time alerts
- Alert rule management and escalation
"""

import logging
import json
import asyncio
import smtplib
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from decimal import Decimal
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
import os

from models import AlertRule, AlertHistory, User
from database import get_db

logger = logging.getLogger(__name__)

class AlertService:
    """Service for managing alerts and notifications"""
    
    def __init__(self, db: Session):
        self.db = db
        
        # Email configuration
        self.smtp_server = os.getenv('SMTP_SERVER', 'localhost')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.smtp_username = os.getenv('SMTP_USERNAME', '')
        self.smtp_password = os.getenv('SMTP_PASSWORD', '')
        self.smtp_use_tls = os.getenv('SMTP_USE_TLS', 'true').lower() == 'true'
        self.from_email = os.getenv('FROM_EMAIL', self.smtp_username)
    
    async def create_alert_rule(
        self,
        rule_name: str,
        rule_type: str,
        conditions: Dict[str, Any],
        severity: str = 'medium',
        notification_channels: Dict[str, Any] = None,
        cooldown_minutes: int = 60,
        escalation_rules: Dict[str, Any] = None,
        created_by: str = None
    ) -> AlertRule:
        """
        Create a new alert rule
        
        Args:
            rule_name: Name of the alert rule
            rule_type: Type of alert ('kpi_threshold', 'performance', 'system')
            conditions: Alert conditions and thresholds
            severity: Alert severity level
            notification_channels: Email, SMS, webhook configurations
            cooldown_minutes: Minimum time between alerts
            escalation_rules: Escalation configuration
            created_by: User ID who created the rule
        """
        try:
            alert_rule = AlertRule(
                rule_name=rule_name,
                rule_type=rule_type,
                conditions=conditions,
                severity=severity,
                notification_channels=notification_channels or {},
                cooldown_minutes=cooldown_minutes,
                escalation_rules=escalation_rules or {},
                created_by=created_by,
                is_active=True
            )
            
            self.db.add(alert_rule)
            self.db.commit()
            self.db.refresh(alert_rule)
            
            logger.info(f"Created alert rule: {rule_name} (ID: {alert_rule.id})")
            return alert_rule
            
        except Exception as e:
            logger.error(f"Error creating alert rule: {str(e)}")
            self.db.rollback()
            raise
    
    async def evaluate_kpi_alerts(self, time_range: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """
        Evaluate all active KPI alert rules and trigger alerts if conditions are met
        
        Args:
            time_range: Optional time range for KPI evaluation
            
        Returns:
            List of triggered alerts
        """
        triggered_alerts = []
        
        try:
            # Get all active KPI alert rules
            alert_rules = self.db.query(AlertRule).filter(
                and_(
                    AlertRule.is_active == True,
                    AlertRule.rule_type == 'kpi_threshold'
                )
            ).all()
            
            logger.info(f"Evaluating {len(alert_rules)} KPI alert rules")
            
            for rule in alert_rules:
                try:
                    # Check cooldown period
                    if await self._is_in_cooldown(rule):
                        continue
                    
                    # Evaluate rule conditions
                    alert_triggered = await self._evaluate_kpi_rule(rule, time_range)
                    
                    if alert_triggered:
                        # Create alert history entry
                        alert_history = await self._create_alert_history(rule, alert_triggered)
                        
                        # Send notifications
                        await self._send_alert_notifications(rule, alert_triggered)
                        
                        triggered_alerts.append({
                            'rule_id': str(rule.id),
                            'rule_name': rule.rule_name,
                            'severity': rule.severity,
                            'message': alert_triggered['message'],
                            'triggered_value': alert_triggered.get('triggered_value'),
                            'timestamp': datetime.now().isoformat()
                        })
                        
                        logger.info(f"Alert triggered: {rule.rule_name}")
                    
                except Exception as e:
                    logger.error(f"Error evaluating alert rule {rule.rule_name}: {str(e)}")
                    continue
            
            return triggered_alerts
            
        except Exception as e:
            logger.error(f"Error evaluating KPI alerts: {str(e)}")
            return []
    
    async def _evaluate_kpi_rule(self, rule: AlertRule, time_range: Dict[str, Any] = None) -> Optional[Dict[str, Any]]:
        """
        Evaluate a specific KPI alert rule
        
        Args:
            rule: Alert rule to evaluate
            time_range: Time range for KPI calculation
            
        Returns:
            Alert data if triggered, None otherwise
        """
        try:
            conditions = rule.conditions
            kpi_type = conditions.get('kpi_type')  # 'financial', 'operational', 'customer'
            kpi_name = conditions.get('kpi_name')  # specific KPI name
            threshold_type = conditions.get('threshold_type')  # 'above', 'below', 'equals'
            threshold_value = Decimal(str(conditions.get('threshold_value', 0)))
            
            # Set default time range if not provided
            if not time_range:
                from datetime import date, timedelta
                end_date = date.today()
                start_date = end_date - timedelta(days=30)
                time_range = {
                    'start_date': start_date,
                    'end_date': end_date
                }
            
            # Get current KPI values using the proper calculator interface
            current_value = None
            
            if kpi_type == 'financial':
                from services.kpi_calculator_service import FinancialKPICalculator
                calculator = FinancialKPICalculator(self.db)
                
                if kpi_name == 'revenue_actual':
                    kpi_data = await calculator.calculate_revenue_kpis(
                        time_range.get('start_date'), 
                        time_range.get('end_date')
                    )
                    current_value = kpi_data.get('current_revenue', 0)
                elif kpi_name == 'profit_margin':
                    kpi_data = await calculator.calculate_profit_margin_kpis(
                        time_range.get('start_date'), 
                        time_range.get('end_date')
                    )
                    current_value = kpi_data.get('profit_margin_percentage', 0)
                    
            elif kpi_type == 'operational':
                from services.kpi_calculator_service import OperationalKPICalculator
                calculator = OperationalKPICalculator(self.db)
                
                if kpi_name == 'inventory_turnover':
                    kpi_data = await calculator.calculate_inventory_turnover_kpis(
                        time_range.get('start_date'), 
                        time_range.get('end_date')
                    )
                    current_value = kpi_data.get('turnover_rate', 0)
                elif kpi_name == 'stockout_frequency':
                    kpi_data = await calculator.calculate_stockout_frequency_kpis(
                        time_range.get('start_date'), 
                        time_range.get('end_date')
                    )
                    current_value = kpi_data.get('stockout_frequency', 0)
                    
            elif kpi_type == 'customer':
                from services.kpi_calculator_service import CustomerKPICalculator
                calculator = CustomerKPICalculator(self.db)
                
                if kpi_name == 'retention_rate':
                    kpi_data = await calculator.calculate_retention_rate_kpis(
                        time_range.get('start_date'), 
                        time_range.get('end_date')
                    )
                    current_value = kpi_data.get('retention_rate', 0)
                elif kpi_name == 'acquisition_rate':
                    kpi_data = await calculator.calculate_acquisition_rate_kpis(
                        time_range.get('start_date'), 
                        time_range.get('end_date')
                    )
                    current_value = kpi_data.get('acquisition_rate', 0)
            else:
                logger.warning(f"Unknown KPI type: {kpi_type}")
                return None
            
            if current_value is None:
                logger.warning(f"KPI value not found: {kpi_type}.{kpi_name}")
                return None
            
            # Convert to Decimal for comparison
            if isinstance(current_value, (int, float)):
                current_value = Decimal(str(current_value))
            
            # Evaluate threshold condition
            alert_triggered = False
            if threshold_type == 'above' and current_value > threshold_value:
                alert_triggered = True
            elif threshold_type == 'below' and current_value < threshold_value:
                alert_triggered = True
            elif threshold_type == 'equals' and current_value == threshold_value:
                alert_triggered = True
            
            if alert_triggered:
                return {
                    'message': f"{kpi_type.title()} KPI '{kpi_name}' is {threshold_type} threshold: {current_value} (threshold: {threshold_value})",
                    'triggered_value': current_value,
                    'threshold_value': threshold_value,
                    'kpi_type': kpi_type,
                    'kpi_name': kpi_name
                }
            
            return None
            
        except Exception as e:
            logger.error(f"Error evaluating KPI rule {rule.rule_name}: {str(e)}")
            return None
    
    async def _is_in_cooldown(self, rule: AlertRule) -> bool:
        """
        Check if alert rule is in cooldown period
        
        Args:
            rule: Alert rule to check
            
        Returns:
            True if in cooldown, False otherwise
        """
        try:
            cooldown_time = datetime.now() - timedelta(minutes=rule.cooldown_minutes)
            
            recent_alert = self.db.query(AlertHistory).filter(
                and_(
                    AlertHistory.rule_id == rule.id,
                    AlertHistory.triggered_at > cooldown_time
                )
            ).first()
            
            return recent_alert is not None
            
        except Exception as e:
            logger.error(f"Error checking cooldown for rule {rule.rule_name}: {str(e)}")
            return False
    
    async def _create_alert_history(self, rule: AlertRule, alert_data: Dict[str, Any]) -> AlertHistory:
        """
        Create alert history entry
        
        Args:
            rule: Alert rule that was triggered
            alert_data: Alert trigger data
            
        Returns:
            Created AlertHistory instance
        """
        try:
            alert_history = AlertHistory(
                rule_id=rule.id,
                alert_level=rule.severity,
                message=alert_data['message'],
                triggered_value=alert_data.get('triggered_value'),
                threshold_value=alert_data.get('threshold_value'),
                entity_type=alert_data.get('kpi_type'),
                entity_id=None,  # KPIs don't have specific entity IDs
                notification_sent=False,
                acknowledged=False,
                triggered_at=datetime.now()
            )
            
            self.db.add(alert_history)
            self.db.commit()
            self.db.refresh(alert_history)
            
            return alert_history
            
        except Exception as e:
            logger.error(f"Error creating alert history: {str(e)}")
            self.db.rollback()
            raise
    
    async def _send_alert_notifications(self, rule: AlertRule, alert_data: Dict[str, Any]) -> bool:
        """
        Send alert notifications via configured channels
        
        Args:
            rule: Alert rule configuration
            alert_data: Alert trigger data
            
        Returns:
            True if notifications sent successfully
        """
        try:
            notification_channels = rule.notification_channels or {}
            success = True
            
            # Send email notifications
            if notification_channels.get('email', {}).get('enabled', False):
                email_success = await self._send_email_alert(rule, alert_data, notification_channels['email'])
                success = success and email_success
            
            # TODO: Add SMS notifications if configured
            # TODO: Add webhook notifications if configured
            
            # Update alert history with notification status
            alert_history = self.db.query(AlertHistory).filter(
                AlertHistory.rule_id == rule.id
            ).order_by(AlertHistory.triggered_at.desc()).first()
            
            if alert_history:
                alert_history.notification_sent = success
                self.db.commit()
            
            return success
            
        except Exception as e:
            logger.error(f"Error sending alert notifications: {str(e)}")
            return False
    
    async def _send_email_alert(self, rule: AlertRule, alert_data: Dict[str, Any], email_config: Dict[str, Any]) -> bool:
        """
        Send email alert notification
        
        Args:
            rule: Alert rule configuration
            alert_data: Alert trigger data
            email_config: Email configuration
            
        Returns:
            True if email sent successfully
        """
        try:
            recipients = email_config.get('recipients', [])
            if not recipients:
                logger.warning(f"No email recipients configured for alert rule: {rule.rule_name}")
                return False
            
            # Create email message
            msg = MIMEMultipart()
            msg['From'] = self.from_email
            msg['To'] = ', '.join(recipients)
            msg['Subject'] = f"🚨 {rule.severity.upper()} Alert: {rule.rule_name}"
            
            # Email body
            body = f"""
            <html>
            <body>
                <h2>Analytics Alert Notification</h2>
                <p><strong>Alert Rule:</strong> {rule.rule_name}</p>
                <p><strong>Severity:</strong> {rule.severity.upper()}</p>
                <p><strong>Message:</strong> {alert_data['message']}</p>
                <p><strong>Triggered At:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
                
                <h3>Alert Details</h3>
                <ul>
                    <li><strong>KPI Type:</strong> {alert_data.get('kpi_type', 'N/A')}</li>
                    <li><strong>KPI Name:</strong> {alert_data.get('kpi_name', 'N/A')}</li>
                    <li><strong>Current Value:</strong> {alert_data.get('triggered_value', 'N/A')}</li>
                    <li><strong>Threshold:</strong> {alert_data.get('threshold_value', 'N/A')}</li>
                </ul>
                
                <p><em>This is an automated alert from the Gold Shop Analytics System.</em></p>
            </body>
            </html>
            """
            
            msg.attach(MIMEText(body, 'html'))
            
            # Send email
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            if self.smtp_use_tls:
                server.starttls()
            
            if self.smtp_username and self.smtp_password:
                server.login(self.smtp_username, self.smtp_password)
            
            server.sendmail(self.from_email, recipients, msg.as_string())
            server.quit()
            
            logger.info(f"Alert email sent to {len(recipients)} recipients for rule: {rule.rule_name}")
            return True
            
        except Exception as e:
            logger.error(f"Error sending alert email: {str(e)}")
            return False
    
    async def get_alert_history(
        self,
        rule_id: str = None,
        severity: str = None,
        acknowledged: bool = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Get alert history with optional filtering
        
        Args:
            rule_id: Filter by specific rule ID
            severity: Filter by severity level
            acknowledged: Filter by acknowledgment status
            limit: Maximum number of results
            
        Returns:
            List of alert history records
        """
        try:
            query = self.db.query(AlertHistory)
            
            if rule_id:
                query = query.filter(AlertHistory.rule_id == rule_id)
            
            if severity:
                query = query.join(AlertRule).filter(AlertRule.severity == severity)
            
            if acknowledged is not None:
                query = query.filter(AlertHistory.acknowledged == acknowledged)
            
            alerts = query.order_by(AlertHistory.triggered_at.desc()).limit(limit).all()
            
            return [
                {
                    'id': str(alert.id),
                    'rule_id': str(alert.rule_id),
                    'rule_name': alert.rule.rule_name if alert.rule else 'Unknown',
                    'alert_level': alert.alert_level,
                    'message': alert.message,
                    'triggered_value': float(alert.triggered_value) if alert.triggered_value else None,
                    'entity_type': alert.entity_type,
                    'notification_sent': alert.notification_sent,
                    'acknowledged': alert.acknowledged,
                    'acknowledged_by': str(alert.acknowledged_by) if alert.acknowledged_by else None,
                    'triggered_at': alert.triggered_at.isoformat() if alert.triggered_at else None,
                    'acknowledged_at': alert.acknowledged_at.isoformat() if alert.acknowledged_at else None
                }
                for alert in alerts
            ]
            
        except Exception as e:
            logger.error(f"Error getting alert history: {str(e)}")
            return []
    
    async def acknowledge_alert(self, alert_id: str, acknowledged_by: str) -> bool:
        """
        Acknowledge an alert
        
        Args:
            alert_id: ID of the alert to acknowledge
            acknowledged_by: User ID who acknowledged the alert
            
        Returns:
            True if acknowledged successfully
        """
        try:
            alert = self.db.query(AlertHistory).filter(AlertHistory.id == alert_id).first()
            
            if not alert:
                logger.warning(f"Alert not found: {alert_id}")
                return False
            
            alert.acknowledged = True
            alert.acknowledged_by = acknowledged_by
            alert.acknowledged_at = datetime.now()
            
            self.db.commit()
            
            logger.info(f"Alert acknowledged: {alert_id} by user {acknowledged_by}")
            return True
            
        except Exception as e:
            logger.error(f"Error acknowledging alert: {str(e)}")
            self.db.rollback()
            return False
    
    async def get_active_alert_rules(self) -> List[Dict[str, Any]]:
        """
        Get all active alert rules
        
        Returns:
            List of active alert rules
        """
        try:
            rules = self.db.query(AlertRule).filter(AlertRule.is_active == True).all()
            
            return [
                {
                    'id': str(rule.id),
                    'rule_name': rule.rule_name,
                    'rule_type': rule.rule_type,
                    'conditions': rule.conditions,
                    'severity': rule.severity,
                    'notification_channels': rule.notification_channels,
                    'cooldown_minutes': rule.cooldown_minutes,
                    'escalation_rules': rule.escalation_rules,
                    'created_by': str(rule.created_by) if rule.created_by else None,
                    'created_at': rule.created_at.isoformat() if rule.created_at else None,
                    'updated_at': rule.updated_at.isoformat() if rule.updated_at else None
                }
                for rule in rules
            ]
            
        except Exception as e:
            logger.error(f"Error getting active alert rules: {str(e)}")
            return []