"""
Enhanced OAuth2 Authentication Router
Comprehensive OAuth2 implementation with provider integration
"""
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
import secrets
import models
from database import get_db
from oauth2_config import get_oauth2_config, validate_oauth2_config
from oauth2_tokens import get_token_manager
from oauth2_middleware import get_current_user, require_permission, require_role
from oauth2_providers import get_oauth2_provider_service, OAuth2ProviderError
from oauth2_audit import (
    log_authentication_event, log_token_event, log_security_event,
    TokenEvent, SecurityEvent, analyze_failed_login_attempts, detect_suspicious_activity
)
from auth import verify_password, get_password_hash  # Import existing password functions

router = APIRouter(prefix="/api/oauth2", tags=["OAuth2 Authentication"])

# Pydantic models
class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: Dict[str, Any]

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class OAuth2AuthorizeRequest(BaseModel):
    redirect_uri: str
    scopes: Optional[List[str]] = None

class OAuth2AuthorizeResponse(BaseModel):
    authorization_url: str
    state: str

class OAuth2CallbackRequest(BaseModel):
    code: str
    state: str
    redirect_uri: str

class TokenRevocationRequest(BaseModel):
    token: str

class UserInfoResponse(BaseModel):
    id: str
    username: str
    email: str
    role: Optional[str]
    permissions: List[str]
    is_active: bool

class AuditLogResponse(BaseModel):
    id: str
    event_type: str
    event_category: str
    details: Dict[str, Any]
    timestamp: datetime
    ip_address: Optional[str]
    severity: str

# Initialize services
token_manager = get_token_manager()
provider_service = get_oauth2_provider_service()
config = get_oauth2_config()

def _get_client_info(request: Request) -> tuple[Optional[str], Optional[str]]:
    """Extract client IP and user agent from request"""
    ip_address = request.headers.get("x-forwarded-for", "").split(",")[0].strip()
    if not ip_address:
        ip_address = request.headers.get("x-real-ip")
    if not ip_address and hasattr(request, "client"):
        ip_address = request.client.host
    
    user_agent = request.headers.get("user-agent")
    return ip_address, user_agent

def _serialize_user(user: models.User) -> Dict[str, Any]:
    """Serialize user object for API response"""
    return {
        "id": str(user.id),
        "username": user.username,
        "email": user.email,
        "role": user.role.name if user.role else None,
        "is_active": user.is_active,
        "created_at": user.created_at.isoformat() if user.created_at else None
    }

def _get_user_permissions(user: models.User) -> List[str]:
    """Get user permissions from role"""
    if not user.role or not user.role.permissions:
        return []
    
    return [perm for perm, granted in user.role.permissions.items() if granted]

@router.post("/login", response_model=LoginResponse)
async def login(
    request: Request,
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    """Traditional username/password login with OAuth2 token generation"""
    
    ip_address, user_agent = _get_client_info(request)
    
    # Authenticate user
    user = db.query(models.User).filter(models.User.username == login_data.username).first()
    
    if not user or not verify_password(login_data.password, user.password_hash):
        # Log failed login attempt
        log_authentication_event(
            db, user.id if user else None, TokenEvent.LOGIN_FAILED, False,
            {"username": login_data.username, "reason": "invalid_credentials"},
            ip_address, user_agent
        )
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    if not user.is_active:
        log_authentication_event(
            db, user.id, TokenEvent.LOGIN_FAILED, False,
            {"username": login_data.username, "reason": "inactive_user"},
            ip_address, user_agent
        )
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive"
        )
    
    # Get user permissions as scopes
    scopes = _get_user_permissions(user)
    if not scopes:
        scopes = config.default_scopes
    
    # Create token pair
    access_token, refresh_token, access_expires_at, refresh_expires_at = token_manager.create_token_pair(
        str(user.id), scopes, db,
        additional_claims={
            "username": user.username,
            "email": user.email,
            "role": user.role.name if user.role else None
        }
    )
    
    # Log successful login
    log_authentication_event(
        db, user.id, TokenEvent.LOGIN_SUCCESS, True,
        {"username": login_data.username, "scopes": scopes},
        ip_address, user_agent
    )
    
    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=config.access_token_expire_minutes * 60,
        user=_serialize_user(user)
    )

@router.post("/refresh", response_model=LoginResponse)
async def refresh_token(
    request: Request,
    refresh_data: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """Refresh access token using refresh token"""
    
    ip_address, user_agent = _get_client_info(request)
    
    result = token_manager.refresh_tokens(refresh_data.refresh_token, db)
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    new_access_token, new_refresh_token, access_expires_at, refresh_expires_at = result
    
    # Get user info from new token
    payload = token_manager.validate_access_token(new_access_token, db)
    user = db.query(models.User).filter(models.User.id == payload["sub"]).first()
    
    return LoginResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        expires_in=config.access_token_expire_minutes * 60,
        user=_serialize_user(user)
    )

@router.post("/oauth2/authorize", response_model=OAuth2AuthorizeResponse)
async def oauth2_authorize(
    request: Request,
    auth_request: OAuth2AuthorizeRequest,
    db: Session = Depends(get_db)
):
    """Initiate OAuth2 authorization flow with external provider"""
    
    if not validate_oauth2_config():
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="OAuth2 provider not configured"
        )
    
    # Generate state parameter for CSRF protection
    state = secrets.token_urlsafe(32)
    
    # Store state in session or database for validation
    # For simplicity, we'll include it in the response
    
    authorization_url = await provider_service.get_authorization_url(
        auth_request.redirect_uri,
        state,
        auth_request.scopes
    )
    
    ip_address, user_agent = _get_client_info(request)
    log_authentication_event(
        db, None, TokenEvent.LOGIN_SUCCESS, True,
        {"flow": "oauth2_authorize", "redirect_uri": auth_request.redirect_uri},
        ip_address, user_agent
    )
    
    return OAuth2AuthorizeResponse(
        authorization_url=authorization_url,
        state=state
    )

@router.post("/oauth2/callback", response_model=LoginResponse)
async def oauth2_callback(
    request: Request,
    callback_data: OAuth2CallbackRequest,
    db: Session = Depends(get_db)
):
    """Handle OAuth2 callback and exchange code for tokens"""
    
    ip_address, user_agent = _get_client_info(request)
    
    try:
        # Exchange code for tokens
        provider_access_token, provider_refresh_token, user_info = await provider_service.exchange_code_for_tokens(
            callback_data.code,
            callback_data.redirect_uri,
            db
        )
        
        # Find or create user based on provider user info
        email = user_info.get("email")
        username = user_info.get("preferred_username") or user_info.get("username") or email
        
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email not provided by OAuth2 provider"
            )
        
        user = db.query(models.User).filter(models.User.email == email).first()
        
        if not user:
            # Create new user
            user = models.User(
                username=username,
                email=email,
                password_hash=get_password_hash(secrets.token_urlsafe(32)),  # Random password
                is_active=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        
        # Get user permissions as scopes
        scopes = _get_user_permissions(user)
        if not scopes:
            scopes = config.default_scopes
        
        # Create our internal token pair
        access_token, refresh_token, access_expires_at, refresh_expires_at = token_manager.create_token_pair(
            str(user.id), scopes, db,
            additional_claims={
                "username": user.username,
                "email": user.email,
                "role": user.role.name if user.role else None,
                "provider": config.provider.value
            }
        )
        
        log_authentication_event(
            db, user.id, TokenEvent.LOGIN_SUCCESS, True,
            {"flow": "oauth2_callback", "provider": config.provider.value},
            ip_address, user_agent
        )
        
        return LoginResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=config.access_token_expire_minutes * 60,
            user=_serialize_user(user)
        )
        
    except OAuth2ProviderError as e:
        log_authentication_event(
            db, None, TokenEvent.LOGIN_FAILED, False,
            {"flow": "oauth2_callback", "error": str(e)},
            ip_address, user_agent
        )
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"OAuth2 provider error: {str(e)}"
        )

@router.post("/revoke")
async def revoke_token(
    request: Request,
    revoke_data: TokenRevocationRequest,
    db: Session = Depends(get_db)
):
    """Revoke a token"""
    
    ip_address, user_agent = _get_client_info(request)
    
    success = token_manager.revoke_token(revoke_data.token, db)
    
    if success:
        # Also try to revoke with provider if applicable
        if validate_oauth2_config():
            await provider_service.revoke_provider_token(revoke_data.token, db)
    
    return {"revoked": success}

@router.post("/logout")
async def logout(
    request: Request,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Logout user and revoke all tokens"""
    
    ip_address, user_agent = _get_client_info(request)
    
    # Revoke all user tokens
    revoked_count = token_manager.revoke_user_tokens(str(current_user.id), db)
    
    log_authentication_event(
        db, current_user.id, TokenEvent.LOGOUT, True,
        {"revoked_tokens": revoked_count},
        ip_address, user_agent
    )
    
    return {"message": "Logged out successfully", "revoked_tokens": revoked_count}

@router.get("/me", response_model=UserInfoResponse)
async def get_current_user_info(
    current_user: models.User = Depends(get_current_user)
):
    """Get current user information"""
    
    return UserInfoResponse(
        id=str(current_user.id),
        username=current_user.username,
        email=current_user.email,
        role=current_user.role.name if current_user.role else None,
        permissions=_get_user_permissions(current_user),
        is_active=current_user.is_active
    )

@router.get("/audit-logs", response_model=List[AuditLogResponse])
async def get_audit_logs(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 100,
    event_category: Optional[str] = None
):
    """Get audit logs (requires permission)"""
    
    # Check if user has permission to view audit logs
    user_permissions = _get_user_permissions(current_user)
    if "view_audit_logs" not in user_permissions:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission 'view_audit_logs' required"
        )
    
    from oauth2_audit import get_user_audit_logs
    
    logs = get_user_audit_logs(db, str(current_user.id), limit, event_category)
    
    return [
        AuditLogResponse(
            id=str(log.id),
            event_type=log.event_type,
            event_category=log.event_category,
            details=log.details,
            timestamp=log.timestamp,
            ip_address=log.ip_address,
            severity=log.severity
        )
        for log in logs
    ]

@router.get("/security-analysis")
async def get_security_analysis(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
    hours: int = 24
):
    """Get security analysis for current user"""
    
    # Check if user has permission to view security analysis
    user_permissions = _get_user_permissions(current_user)
    if "view_security_analysis" not in user_permissions:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission 'view_security_analysis' required"
        )
    
    analysis = detect_suspicious_activity(db, str(current_user.id), hours)
    failed_logins = analyze_failed_login_attempts(db, str(current_user.id), hours=hours)
    
    return {
        "user_analysis": analysis,
        "failed_login_analysis": failed_logins
    }

@router.get("/config")
async def get_oauth2_config(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get OAuth2 configuration (admin only)"""
    
    # Check if user has admin role or admin permission
    user_permissions = _get_user_permissions(current_user)
    if not (current_user.role and current_user.role.name == "admin") and "admin" not in user_permissions:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin role required"
        )
    
    return {
        "provider": config.provider.value,
        "access_token_expire_minutes": config.access_token_expire_minutes,
        "refresh_token_expire_days": config.refresh_token_expire_days,
        "token_rotation_enabled": config.token_rotation_enabled,
        "audit_logging_enabled": config.audit_logging_enabled,
        "default_scopes": config.default_scopes,
        "provider_configured": validate_oauth2_config()
    }

@router.post("/cleanup-tokens")
async def cleanup_expired_tokens(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Clean up expired tokens (admin only)"""
    
    # Check if user has admin role or admin permission
    user_permissions = _get_user_permissions(current_user)
    if not (current_user.role and current_user.role.name == "admin") and "admin" not in user_permissions:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin role required"
        )
    
    cleaned_count = token_manager.cleanup_expired_tokens(db)
    
    return {"message": f"Cleaned up {cleaned_count} expired tokens"}

@router.get("/health")
async def oauth2_health_check():
    """OAuth2 system health check"""
    
    return {
        "status": "healthy",
        "provider": config.provider.value,
        "provider_configured": validate_oauth2_config(),
        "audit_logging": config.audit_logging_enabled,
        "token_rotation": config.token_rotation_enabled
    }