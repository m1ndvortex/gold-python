"""
Alert and Notification API Endpoints

Provides comprehensive alert management with:
- KPI threshold monitoring and alert generation
- Email notification system for analytics alerts
- Real-time alert updates via WebSocket
- Alert rule management and escalation
"""

import logging
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from datetime import datetime
from pydantic import BaseModel, Field

from database import get_db
from oauth2_middleware import get_current_user
from models import User
from services.alert_service import AlertService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/alerts", tags=["alerts"])

# Pydantic models for request/response
class AlertRuleCreate(BaseModel):
    rule_name: str = Field(..., description="Name of the alert rule")
    rule_type: str = Field(..., description="Type of alert (kpi_threshold, performance, system)")
    conditions: Dict[str, Any] = Field(..., description="Alert conditions and thresholds")
    severity: str = Field(default="medium", description="Alert severity level")
    notification_channels: Optional[Dict[str, Any]] = Field(default=None, description="Notification configurations")
    cooldown_minutes: int = Field(default=60, description="Minimum time between alerts")
    escalation_rules: Optional[Dict[str, Any]] = Field(default=None, description="Escalation configuration")

class AlertRuleResponse(BaseModel):
    id: str
    rule_name: str
    rule_type: str
    conditions: Dict[str, Any]
    severity: str
    notification_channels: Dict[str, Any]
    cooldown_minutes: int
    escalation_rules: Dict[str, Any]
    created_by: Optional[str]
    created_at: Optional[str]
    updated_at: Optional[str]

class AlertHistoryResponse(BaseModel):
    id: str
    rule_id: str
    rule_name: str
    alert_level: str
    message: str
    triggered_value: Optional[float]
    entity_type: Optional[str]
    notification_sent: bool
    acknowledged: bool
    acknowledged_by: Optional[str]
    triggered_at: Optional[str]
    acknowledged_at: Optional[str]

class AlertAcknowledge(BaseModel):
    alert_id: str = Field(..., description="ID of the alert to acknowledge")

# WebSocket connection manager for real-time alert updates
class AlertConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"Alert WebSocket connected. Total connections: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"Alert WebSocket disconnected. Total connections: {len(self.active_connections)}")
    
    async def broadcast_alert(self, alert_data: dict):
        """Broadcast alert to all connected clients"""
        if not self.active_connections:
            return
        
        message = {
            "type": "alert",
            "data": alert_data,
            "timestamp": datetime.now().isoformat()
        }
        
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error sending alert WebSocket message: {e}")
                disconnected.append(connection)
        
        # Remove disconnected connections
        for connection in disconnected:
            self.disconnect(connection)

alert_manager = AlertConnectionManager()

@router.websocket("/ws")
async def alert_websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time alert updates"""
    await alert_manager.connect(websocket)
    try:
        while True:
            # Keep connection alive and listen for client messages
            data = await websocket.receive_text()
            # Echo back for connection testing
            await websocket.send_text(f"Alert WebSocket connected: {data}")
    except WebSocketDisconnect:
        alert_manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"Alert WebSocket error: {e}")
        alert_manager.disconnect(websocket)

@router.post("/rules", response_model=AlertRuleResponse)
async def create_alert_rule(
    rule_data: AlertRuleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new alert rule
    
    Creates a new alert rule with specified conditions and notification settings.
    Supports KPI threshold monitoring, performance alerts, and system alerts.
    """
    try:
        alert_service = AlertService(db)
        
        alert_rule = await alert_service.create_alert_rule(
            rule_name=rule_data.rule_name,
            rule_type=rule_data.rule_type,
            conditions=rule_data.conditions,
            severity=rule_data.severity,
            notification_channels=rule_data.notification_channels,
            cooldown_minutes=rule_data.cooldown_minutes,
            escalation_rules=rule_data.escalation_rules,
            created_by=str(current_user.id)
        )
        
        return AlertRuleResponse(
            id=str(alert_rule.id),
            rule_name=alert_rule.rule_name,
            rule_type=alert_rule.rule_type,
            conditions=alert_rule.conditions,
            severity=alert_rule.severity,
            notification_channels=alert_rule.notification_channels or {},
            cooldown_minutes=alert_rule.cooldown_minutes,
            escalation_rules=alert_rule.escalation_rules or {},
            created_by=str(alert_rule.created_by) if alert_rule.created_by else None,
            created_at=alert_rule.created_at.isoformat() if alert_rule.created_at else None,
            updated_at=alert_rule.updated_at.isoformat() if alert_rule.updated_at else None
        )
        
    except Exception as e:
        logger.error(f"Error creating alert rule: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating alert rule: {str(e)}"
        )

@router.get("/rules", response_model=List[AlertRuleResponse])
async def get_alert_rules(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all active alert rules
    
    Returns a list of all active alert rules with their configurations.
    """
    try:
        alert_service = AlertService(db)
        rules = await alert_service.get_active_alert_rules()
        
        return [
            AlertRuleResponse(
                id=rule['id'],
                rule_name=rule['rule_name'],
                rule_type=rule['rule_type'],
                conditions=rule['conditions'],
                severity=rule['severity'],
                notification_channels=rule['notification_channels'],
                cooldown_minutes=rule['cooldown_minutes'],
                escalation_rules=rule['escalation_rules'],
                created_by=rule['created_by'],
                created_at=rule['created_at'],
                updated_at=rule['updated_at']
            )
            for rule in rules
        ]
        
    except Exception as e:
        logger.error(f"Error getting alert rules: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting alert rules: {str(e)}"
        )

@router.post("/evaluate")
async def evaluate_alerts(
    time_range: Optional[Dict[str, Any]] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Manually trigger alert evaluation
    
    Evaluates all active alert rules and triggers notifications for any alerts.
    Useful for testing or manual alert checking.
    """
    try:
        alert_service = AlertService(db)
        triggered_alerts = await alert_service.evaluate_kpi_alerts(time_range)
        
        # Broadcast alerts via WebSocket
        for alert in triggered_alerts:
            await alert_manager.broadcast_alert(alert)
        
        return {
            "evaluated_at": datetime.now().isoformat(),
            "triggered_alerts": triggered_alerts,
            "total_triggered": len(triggered_alerts)
        }
        
    except Exception as e:
        logger.error(f"Error evaluating alerts: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error evaluating alerts: {str(e)}"
        )

@router.get("/history", response_model=List[AlertHistoryResponse])
async def get_alert_history(
    rule_id: Optional[str] = Query(None, description="Filter by rule ID"),
    severity: Optional[str] = Query(None, description="Filter by severity level"),
    acknowledged: Optional[bool] = Query(None, description="Filter by acknowledgment status"),
    limit: int = Query(100, description="Maximum number of results"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get alert history with optional filtering
    
    Returns historical alert data with optional filtering by rule, severity, or acknowledgment status.
    """
    try:
        alert_service = AlertService(db)
        history = await alert_service.get_alert_history(
            rule_id=rule_id,
            severity=severity,
            acknowledged=acknowledged,
            limit=limit
        )
        
        return [
            AlertHistoryResponse(
                id=alert['id'],
                rule_id=alert['rule_id'],
                rule_name=alert['rule_name'],
                alert_level=alert['alert_level'],
                message=alert['message'],
                triggered_value=alert['triggered_value'],
                entity_type=alert['entity_type'],
                notification_sent=alert['notification_sent'],
                acknowledged=alert['acknowledged'],
                acknowledged_by=alert['acknowledged_by'],
                triggered_at=alert['triggered_at'],
                acknowledged_at=alert['acknowledged_at']
            )
            for alert in history
        ]
        
    except Exception as e:
        logger.error(f"Error getting alert history: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting alert history: {str(e)}"
        )

@router.post("/acknowledge")
async def acknowledge_alert(
    acknowledge_data: AlertAcknowledge,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Acknowledge an alert
    
    Marks an alert as acknowledged by the current user.
    """
    try:
        alert_service = AlertService(db)
        success = await alert_service.acknowledge_alert(
            alert_id=acknowledge_data.alert_id,
            acknowledged_by=str(current_user.id)
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Alert not found"
            )
        
        # Broadcast acknowledgment via WebSocket
        await alert_manager.broadcast_alert({
            "type": "acknowledgment",
            "alert_id": acknowledge_data.alert_id,
            "acknowledged_by": current_user.username,
            "acknowledged_at": datetime.now().isoformat()
        })
        
        return {
            "acknowledged": True,
            "alert_id": acknowledge_data.alert_id,
            "acknowledged_by": current_user.username,
            "acknowledged_at": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error acknowledging alert: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error acknowledging alert: {str(e)}"
        )

@router.get("/summary")
async def get_alert_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get alert summary statistics
    
    Returns summary statistics about alerts including counts by severity and acknowledgment status.
    """
    try:
        alert_service = AlertService(db)
        
        # Get recent alerts (last 24 hours)
        recent_alerts = await alert_service.get_alert_history(limit=1000)
        
        # Calculate summary statistics
        total_alerts = len(recent_alerts)
        acknowledged_alerts = len([a for a in recent_alerts if a['acknowledged']])
        unacknowledged_alerts = total_alerts - acknowledged_alerts
        
        # Count by severity
        severity_counts = {}
        for alert in recent_alerts:
            severity = alert['alert_level']
            severity_counts[severity] = severity_counts.get(severity, 0) + 1
        
        # Get active rules count
        active_rules = await alert_service.get_active_alert_rules()
        
        return {
            "total_alerts": total_alerts,
            "acknowledged_alerts": acknowledged_alerts,
            "unacknowledged_alerts": unacknowledged_alerts,
            "severity_breakdown": severity_counts,
            "active_rules": len(active_rules),
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting alert summary: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting alert summary: {str(e)}"
        )