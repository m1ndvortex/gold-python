"""
OAuth2 Audit Logging System
Comprehensive logging for all token events and security activities
"""
from datetime import datetime
from typing import Optional, Dict, Any
from enum import Enum
from sqlalchemy.orm import Session
import models
import json

class TokenEvent(str, Enum):
    """Token event types for audit logging"""
    ISSUED = "issued"
    REFRESHED = "refreshed"
    REVOKED = "revoked"
    EXPIRED = "expired"
    REFRESH_FAILED = "refresh_failed"
    VALIDATION_FAILED = "validation_failed"
    LOGIN_SUCCESS = "login_success"
    LOGIN_FAILED = "login_failed"
    LOGOUT = "logout"
    PERMISSION_DENIED = "permission_denied"

class SecurityEvent(str, Enum):
    """Security event types for audit logging"""
    SUSPICIOUS_ACTIVITY = "suspicious_activity"
    MULTIPLE_FAILED_LOGINS = "multiple_failed_logins"
    TOKEN_REUSE_ATTEMPT = "token_reuse_attempt"
    INVALID_SCOPE_REQUEST = "invalid_scope_request"
    RATE_LIMIT_EXCEEDED = "rate_limit_exceeded"
    UNAUTHORIZED_ACCESS_ATTEMPT = "unauthorized_access_attempt"

def log_token_event(
    db: Session,
    user_id: Optional[str],
    event_type: TokenEvent,
    details: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
) -> models.OAuth2AuditLog:
    """Log a token-related event"""
    
    audit_entry = models.OAuth2AuditLog(
        user_id=user_id,
        event_type=event_type.value,
        event_category="token",
        details=details or {},
        ip_address=ip_address,
        user_agent=user_agent,
        timestamp=datetime.utcnow()
    )
    
    db.add(audit_entry)
    db.commit()
    db.refresh(audit_entry)
    
    return audit_entry

def log_security_event(
    db: Session,
    user_id: Optional[str],
    event_type: SecurityEvent,
    details: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    severity: str = "medium"
) -> models.OAuth2AuditLog:
    """Log a security-related event"""
    
    audit_entry = models.OAuth2AuditLog(
        user_id=user_id,
        event_type=event_type.value,
        event_category="security",
        details=details or {},
        ip_address=ip_address,
        user_agent=user_agent,
        severity=severity,
        timestamp=datetime.utcnow()
    )
    
    db.add(audit_entry)
    db.commit()
    db.refresh(audit_entry)
    
    return audit_entry

def log_authentication_event(
    db: Session,
    user_id: Optional[str],
    event_type: TokenEvent,
    success: bool,
    details: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
) -> models.OAuth2AuditLog:
    """Log an authentication event"""
    
    event_details = details or {}
    event_details.update({
        "success": success,
        "timestamp": datetime.utcnow().isoformat()
    })
    
    audit_entry = models.OAuth2AuditLog(
        user_id=user_id,
        event_type=event_type.value,
        event_category="authentication",
        details=event_details,
        ip_address=ip_address,
        user_agent=user_agent,
        severity="high" if not success else "info",
        timestamp=datetime.utcnow()
    )
    
    db.add(audit_entry)
    db.commit()
    db.refresh(audit_entry)
    
    return audit_entry

def get_user_audit_logs(
    db: Session,
    user_id: str,
    limit: int = 100,
    event_category: Optional[str] = None
) -> list[models.OAuth2AuditLog]:
    """Get audit logs for a specific user"""
    
    query = db.query(models.OAuth2AuditLog).filter(
        models.OAuth2AuditLog.user_id == user_id
    )
    
    if event_category:
        query = query.filter(models.OAuth2AuditLog.event_category == event_category)
    
    return query.order_by(models.OAuth2AuditLog.timestamp.desc()).limit(limit).all()

def get_security_alerts(
    db: Session,
    hours: int = 24,
    severity: Optional[str] = None
) -> list[models.OAuth2AuditLog]:
    """Get recent security alerts"""
    
    from_time = datetime.utcnow() - timedelta(hours=hours)
    
    query = db.query(models.OAuth2AuditLog).filter(
        models.OAuth2AuditLog.timestamp >= from_time,
        models.OAuth2AuditLog.event_category == "security"
    )
    
    if severity:
        query = query.filter(models.OAuth2AuditLog.severity == severity)
    
    return query.order_by(models.OAuth2AuditLog.timestamp.desc()).all()

def analyze_failed_login_attempts(
    db: Session,
    user_id: Optional[str] = None,
    ip_address: Optional[str] = None,
    hours: int = 1
) -> Dict[str, Any]:
    """Analyze failed login attempts for suspicious activity"""
    
    from_time = datetime.utcnow() - timedelta(hours=hours)
    
    query = db.query(models.OAuth2AuditLog).filter(
        models.OAuth2AuditLog.timestamp >= from_time,
        models.OAuth2AuditLog.event_type == TokenEvent.LOGIN_FAILED.value
    )
    
    if user_id:
        query = query.filter(models.OAuth2AuditLog.user_id == user_id)
    
    if ip_address:
        query = query.filter(models.OAuth2AuditLog.ip_address == ip_address)
    
    failed_attempts = query.all()
    
    # Group by IP address and user
    ip_attempts = {}
    user_attempts = {}
    
    for attempt in failed_attempts:
        if attempt.ip_address:
            ip_attempts[attempt.ip_address] = ip_attempts.get(attempt.ip_address, 0) + 1
        
        if attempt.user_id:
            user_attempts[attempt.user_id] = user_attempts.get(attempt.user_id, 0) + 1
    
    return {
        "total_failed_attempts": len(failed_attempts),
        "unique_ips": len(ip_attempts),
        "unique_users": len(user_attempts),
        "top_failing_ips": sorted(ip_attempts.items(), key=lambda x: x[1], reverse=True)[:5],
        "top_failing_users": sorted(user_attempts.items(), key=lambda x: x[1], reverse=True)[:5],
        "time_range_hours": hours
    }

def detect_suspicious_activity(
    db: Session,
    user_id: str,
    hours: int = 24
) -> Dict[str, Any]:
    """Detect suspicious activity for a user"""
    
    from_time = datetime.utcnow() - timedelta(hours=hours)
    
    # Get all events for user in time range
    events = db.query(models.OAuth2AuditLog).filter(
        models.OAuth2AuditLog.user_id == user_id,
        models.OAuth2AuditLog.timestamp >= from_time
    ).all()
    
    # Analyze patterns
    ip_addresses = set()
    user_agents = set()
    failed_logins = 0
    successful_logins = 0
    token_refreshes = 0
    
    for event in events:
        if event.ip_address:
            ip_addresses.add(event.ip_address)
        if event.user_agent:
            user_agents.add(event.user_agent)
        
        if event.event_type == TokenEvent.LOGIN_FAILED.value:
            failed_logins += 1
        elif event.event_type == TokenEvent.LOGIN_SUCCESS.value:
            successful_logins += 1
        elif event.event_type == TokenEvent.REFRESHED.value:
            token_refreshes += 1
    
    # Determine suspicion level
    suspicion_score = 0
    alerts = []
    
    if len(ip_addresses) > 5:
        suspicion_score += 30
        alerts.append(f"Multiple IP addresses used: {len(ip_addresses)}")
    
    if len(user_agents) > 3:
        suspicion_score += 20
        alerts.append(f"Multiple user agents: {len(user_agents)}")
    
    if failed_logins > 10:
        suspicion_score += 40
        alerts.append(f"High number of failed logins: {failed_logins}")
    
    if token_refreshes > 100:
        suspicion_score += 25
        alerts.append(f"Excessive token refreshes: {token_refreshes}")
    
    return {
        "user_id": user_id,
        "time_range_hours": hours,
        "suspicion_score": suspicion_score,
        "risk_level": "high" if suspicion_score > 70 else "medium" if suspicion_score > 40 else "low",
        "alerts": alerts,
        "statistics": {
            "unique_ip_addresses": len(ip_addresses),
            "unique_user_agents": len(user_agents),
            "failed_logins": failed_logins,
            "successful_logins": successful_logins,
            "token_refreshes": token_refreshes,
            "total_events": len(events)
        }
    }

from datetime import timedelta