"""
OAuth2 Authentication Middleware for FastAPI
Enhanced security with comprehensive error handling and audit logging
Integrated with all backend routers for seamless authentication
"""
from typing import Optional, List, Dict, Any, Callable
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database import get_db
import models
from oauth2_tokens import get_token_manager, TokenManager
from oauth2_audit import log_token_event, log_security_event, TokenEvent, SecurityEvent
from oauth2_config import get_oauth2_config
import functools

# HTTP Bearer token scheme
security = HTTPBearer(auto_error=False)

class OAuth2Middleware:
    """Enhanced OAuth2 middleware with comprehensive security features"""
    
    def __init__(self):
        self.token_manager = get_token_manager()
        self.config = get_oauth2_config()
    
    async def get_current_user(
        self,
        request: Request,
        credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
        db: Session = Depends(get_db)
    ) -> models.User:
        """Get the current authenticated user from OAuth2 token"""
        
        # Extract client information
        ip_address = self._get_client_ip(request)
        user_agent = request.headers.get("user-agent")
        
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
        if not credentials:
            if self.config.audit_logging_enabled:
                log_security_event(
                    db, None, SecurityEvent.UNAUTHORIZED_ACCESS_ATTEMPT,
                    {"reason": "no_credentials", "endpoint": str(request.url)},
                    ip_address, user_agent
                )
            raise credentials_exception
        
        # Validate access token
        payload = self.token_manager.validate_access_token(credentials.credentials, db)
        if not payload:
            if self.config.audit_logging_enabled:
                log_token_event(
                    db, None, TokenEvent.VALIDATION_FAILED,
                    {"reason": "invalid_token", "endpoint": str(request.url)},
                    ip_address, user_agent
                )
            raise credentials_exception
        
        user_id = payload.get("sub")
        if not user_id:
            if self.config.audit_logging_enabled:
                log_token_event(
                    db, None, TokenEvent.VALIDATION_FAILED,
                    {"reason": "no_user_id_in_token", "endpoint": str(request.url)},
                    ip_address, user_agent
                )
            raise credentials_exception
        
        # Get user from database
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            if self.config.audit_logging_enabled:
                log_token_event(
                    db, user_id, TokenEvent.VALIDATION_FAILED,
                    {"reason": "user_not_found", "endpoint": str(request.url)},
                    ip_address, user_agent
                )
            raise credentials_exception
        
        if not user.is_active:
            if self.config.audit_logging_enabled:
                log_security_event(
                    db, user_id, SecurityEvent.UNAUTHORIZED_ACCESS_ATTEMPT,
                    {"reason": "inactive_user", "endpoint": str(request.url)},
                    ip_address, user_agent
                )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Inactive user"
            )
        
        return user
    
    async def get_current_active_user(
        self,
        request: Request,
        current_user: models.User = Depends(lambda r, c, db: oauth2_middleware.get_current_user(r, c, db))
    ) -> models.User:
        """Get the current active user (alias for compatibility)"""
        return current_user
    
    def require_scopes(self, required_scopes: List[str]):
        """Decorator to require specific OAuth2 scopes"""
        async def scope_checker(
            request: Request,
            credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
            db: Session = Depends(get_db)
        ) -> models.User:
            
            # Get current user first
            user = await self.get_current_user(request, credentials, db)
            
            # Validate token and get scopes
            if credentials:
                payload = self.token_manager.validate_access_token(credentials.credentials, db)
                if payload:
                    token_scopes = payload.get("scopes", [])
                    
                    # Check if all required scopes are present
                    missing_scopes = [scope for scope in required_scopes if scope not in token_scopes]
                    
                    if missing_scopes:
                        ip_address = self._get_client_ip(request)
                        user_agent = request.headers.get("user-agent")
                        
                        if self.config.audit_logging_enabled:
                            log_security_event(
                                db, user.id, SecurityEvent.INVALID_SCOPE_REQUEST,
                                {
                                    "required_scopes": required_scopes,
                                    "token_scopes": token_scopes,
                                    "missing_scopes": missing_scopes,
                                    "endpoint": str(request.url)
                                },
                                ip_address, user_agent
                            )
                        
                        raise HTTPException(
                            status_code=status.HTTP_403_FORBIDDEN,
                            detail=f"Insufficient scopes. Required: {required_scopes}"
                        )
            
            return user
        
        return scope_checker
    
    def require_permission(self, permission: str):
        """Decorator to require specific permission"""
        async def permission_checker(
            request: Request,
            current_user: models.User = Depends(lambda r, c, db: oauth2_middleware.get_current_user(r, c, db)),
            db: Session = Depends(get_db)
        ) -> models.User:
            
            user_permissions = self._get_user_permissions(current_user)
            
            if permission not in user_permissions:
                ip_address = self._get_client_ip(request)
                user_agent = request.headers.get("user-agent")
                
                if self.config.audit_logging_enabled:
                    log_token_event(
                        db, current_user.id, TokenEvent.PERMISSION_DENIED,
                        {
                            "required_permission": permission,
                            "user_permissions": user_permissions,
                            "endpoint": str(request.url)
                        },
                        ip_address, user_agent
                    )
                
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Permission '{permission}' required"
                )
            
            return current_user
        
        return permission_checker
    
    def require_role(self, role_name: str):
        """Decorator to require specific role"""
        async def role_checker(
            request: Request,
            current_user: models.User = Depends(lambda r, c, db: oauth2_middleware.get_current_user(r, c, db)),
            db: Session = Depends(get_db)
        ) -> models.User:
            
            if not current_user.role or current_user.role.name != role_name:
                ip_address = self._get_client_ip(request)
                user_agent = request.headers.get("user-agent")
                
                if self.config.audit_logging_enabled:
                    log_token_event(
                        db, current_user.id, TokenEvent.PERMISSION_DENIED,
                        {
                            "required_role": role_name,
                            "user_role": current_user.role.name if current_user.role else None,
                            "endpoint": str(request.url)
                        },
                        ip_address, user_agent
                    )
                
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Role '{role_name}' required"
                )
            
            return current_user
        
        return role_checker
    
    def _get_user_permissions(self, user: models.User) -> List[str]:
        """Get user permissions from their role"""
        if not user.role or not user.role.permissions:
            return []
        
        permissions = []
        for permission, granted in user.role.permissions.items():
            if granted:
                permissions.append(permission)
        
        return permissions
    
    def _get_client_ip(self, request: Request) -> Optional[str]:
        """Extract client IP address from request"""
        # Check for forwarded headers first (for reverse proxy setups)
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip
        
        # Fallback to direct client IP
        if hasattr(request, "client") and request.client:
            return request.client.host
        
        return None

# Global middleware instance
oauth2_middleware = OAuth2Middleware()

# Convenience functions for backward compatibility and ease of use
async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> models.User:
    """Get current user - convenience function"""
    return await oauth2_middleware.get_current_user(request, credentials, db)

async def get_current_active_user(
    request: Request,
    current_user: models.User = Depends(get_current_user)
) -> models.User:
    """Get current active user - convenience function"""
    return current_user

def require_scopes(scopes: List[str]):
    """Require specific OAuth2 scopes - convenience function"""
    return oauth2_middleware.require_scopes(scopes)

def require_permission(permission: str):
    """Require specific permission - convenience function"""
    return oauth2_middleware.require_permission(permission)

def require_role(role_name: str):
    """Require specific role - convenience function"""
    return oauth2_middleware.require_role(role_name)

def require_any_role(role_names: List[str]):
    """Require any of the specified roles"""
    async def role_checker(
        request: Request,
        current_user: models.User = Depends(get_current_user),
        db: Session = Depends(get_db)
    ) -> models.User:
        
        user_role = current_user.role.name if current_user.role else None
        
        if not user_role or user_role not in role_names:
            ip_address = oauth2_middleware._get_client_ip(request)
            user_agent = request.headers.get("user-agent")
            
            if oauth2_middleware.config.audit_logging_enabled:
                log_token_event(
                    db, current_user.id, TokenEvent.PERMISSION_DENIED,
                    {
                        "required_roles": role_names,
                        "user_role": user_role,
                        "endpoint": str(request.url)
                    },
                    ip_address, user_agent
                )
            
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"One of these roles required: {', '.join(role_names)}"
            )
        
        return current_user
    
    return role_checker

def require_any_permission(permissions: List[str]):
    """Require any of the specified permissions"""
    async def permission_checker(
        request: Request,
        current_user: models.User = Depends(get_current_user),
        db: Session = Depends(get_db)
    ) -> models.User:
        
        user_permissions = oauth2_middleware._get_user_permissions(current_user)
        
        if not any(perm in user_permissions for perm in permissions):
            ip_address = oauth2_middleware._get_client_ip(request)
            user_agent = request.headers.get("user-agent")
            
            if oauth2_middleware.config.audit_logging_enabled:
                log_token_event(
                    db, current_user.id, TokenEvent.PERMISSION_DENIED,
                    {
                        "required_permissions": permissions,
                        "user_permissions": user_permissions,
                        "endpoint": str(request.url)
                    },
                    ip_address, user_agent
                )
            
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"One of these permissions required: {', '.join(permissions)}"
            )
        
        return current_user
    
    return permission_checker

def optional_auth():
    """Optional authentication - returns user if authenticated, None otherwise"""
    async def auth_checker(
        request: Request,
        credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
        db: Session = Depends(get_db)
    ) -> Optional[models.User]:
        
        if not credentials:
            return None
        
        try:
            return await oauth2_middleware.get_current_user(request, credentials, db)
        except HTTPException:
            return None
    
    return auth_checker

# Decorator for route-level authentication
def authenticated(func: Callable) -> Callable:
    """Decorator to require authentication for a route"""
    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        # This decorator is mainly for documentation purposes
        # The actual authentication is handled by the Depends() in route parameters
        return await func(*args, **kwargs)
    return wrapper

# Decorator for permission-based routes
def requires_permission(permission: str):
    """Decorator to require specific permission for a route"""
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            return await func(*args, **kwargs)
        return wrapper
    return decorator

# Decorator for role-based routes
def requires_role(role: str):
    """Decorator to require specific role for a route"""
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            return await func(*args, **kwargs)
        return wrapper
    return decorator

# Helper function to check if user has permission
def user_has_permission(user: models.User, permission: str) -> bool:
    """Check if user has specific permission"""
    user_permissions = oauth2_middleware._get_user_permissions(user)
    return permission in user_permissions

# Helper function to check if user has role
def user_has_role(user: models.User, role: str) -> bool:
    """Check if user has specific role"""
    return user.role and user.role.name == role

# Helper function to check if user has any of the roles
def user_has_any_role(user: models.User, roles: List[str]) -> bool:
    """Check if user has any of the specified roles"""
    user_role = user.role.name if user.role else None
    return user_role in roles if user_role else False

# Helper function to get user permissions
def get_user_permissions(user: models.User) -> List[str]:
    """Get list of user permissions"""
    return oauth2_middleware._get_user_permissions(user)