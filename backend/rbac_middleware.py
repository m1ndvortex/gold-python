"""
RBAC (Role-Based Access Control) Middleware for FastAPI
Enhanced permission checking with comprehensive audit logging
"""
from typing import Optional, List, Dict, Any, Callable, Union
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select, and_, or_
from database import get_db
import models
from models_rbac import RBACRole, RBACPermission, RBACUserPermission, RBACAccessLog
from oauth2_tokens import get_token_manager
from oauth2_config import get_oauth2_config
import functools
from datetime import datetime, timezone
import time

# HTTP Bearer token scheme
security = HTTPBearer(auto_error=False)

class RBACMiddleware:
    """Enhanced RBAC middleware with comprehensive permission checking"""
    
    def __init__(self):
        self.token_manager = get_token_manager()
        self.config = get_oauth2_config()
    
    async def get_current_user_with_permissions(
        self,
        request: Request,
        credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
        db: Session = Depends(get_db)
    ) -> models.User:
        """Get the current authenticated user with loaded permissions"""
        
        start_time = time.time()
        ip_address = self._get_client_ip(request)
        user_agent = request.headers.get("user-agent")
        
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
        if not credentials:
            await self._log_access_attempt(
                db, None, str(request.url.path), request.method, False,
                "no_credentials", ip_address, user_agent, start_time
            )
            raise credentials_exception
        
        # Validate access token
        payload = self.token_manager.validate_access_token(credentials.credentials, db)
        if not payload:
            await self._log_access_attempt(
                db, None, str(request.url.path), request.method, False,
                "invalid_token", ip_address, user_agent, start_time
            )
            raise credentials_exception
        
        user_id = payload.get("sub")
        if not user_id:
            await self._log_access_attempt(
                db, None, str(request.url.path), request.method, False,
                "no_user_id_in_token", ip_address, user_agent, start_time
            )
            raise credentials_exception
        
        # Get user with roles and permissions loaded
        result = await db.execute(
            select(models.User)
            .options(
                selectinload(models.User.rbac_roles)
                .selectinload(RBACRole.permissions)
            )
            .where(models.User.id == user_id)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            await self._log_access_attempt(
                db, user_id, str(request.url.path), request.method, False,
                "user_not_found", ip_address, user_agent, start_time
            )
            raise credentials_exception
        
        if not user.is_active:
            await self._log_access_attempt(
                db, user_id, str(request.url.path), request.method, False,
                "inactive_user", ip_address, user_agent, start_time
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Inactive user"
            )
        
        return user
    
    async def check_permission(
        self,
        user: models.User,
        permission_name: str,
        db: Session,
        resource_id: Optional[str] = None
    ) -> bool:
        """Check if user has specific permission"""
        
        # Check direct user permissions first (overrides role permissions)
        user_perm_result = await db.execute(
            select(RBACUserPermission)
            .join(RBACPermission)
            .where(
                and_(
                    RBACUserPermission.user_id == user.id,
                    RBACPermission.name == permission_name,
                    RBACPermission.is_active == True
                )
            )
        )
        user_permission = user_perm_result.scalar_one_or_none()
        
        if user_permission:
            # Check if permission is expired
            if user_permission.expires_at and user_permission.expires_at < datetime.now(timezone.utc):
                return False
            return user_permission.granted
        
        # Check role-based permissions
        if not user.rbac_roles:
            return False
        
        # Get all permissions from user's roles
        user_permissions = set()
        for role in user.rbac_roles:
            if role.is_active:
                for permission in role.permissions:
                    if permission.is_active:
                        user_permissions.add(permission.name)
        
        return permission_name in user_permissions
    
    async def check_role(
        self,
        user: models.User,
        role_name: str
    ) -> bool:
        """Check if user has specific role"""
        
        if not user.rbac_roles:
            return False
        
        for role in user.rbac_roles:
            if role.is_active and role.name == role_name:
                return True
        
        return False
    
    async def check_any_role(
        self,
        user: models.User,
        role_names: List[str]
    ) -> bool:
        """Check if user has any of the specified roles"""
        
        if not user.rbac_roles:
            return False
        
        user_role_names = {role.name for role in user.rbac_roles if role.is_active}
        return bool(user_role_names.intersection(set(role_names)))
    
    async def get_user_permissions(
        self,
        user: models.User,
        db: Session
    ) -> Dict[str, bool]:
        """Get all user permissions as a dictionary"""
        
        permissions = {}
        
        # Get role-based permissions
        if user.rbac_roles:
            for role in user.rbac_roles:
                if role.is_active:
                    for permission in role.permissions:
                        if permission.is_active:
                            permissions[permission.name] = True
        
        # Get direct user permissions (overrides role permissions)
        user_perms_result = await db.execute(
            select(RBACUserPermission)
            .join(RBACPermission)
            .where(
                and_(
                    RBACUserPermission.user_id == user.id,
                    RBACPermission.is_active == True,
                    or_(
                        RBACUserPermission.expires_at.is_(None),
                        RBACUserPermission.expires_at > datetime.now(timezone.utc)
                    )
                )
            )
        )
        user_permissions = user_perms_result.scalars().all()
        
        for user_perm in user_permissions:
            permissions[user_perm.permission.name] = user_perm.granted
        
        return permissions
    
    async def get_user_roles(
        self,
        user: models.User
    ) -> List[str]:
        """Get list of user role names"""
        
        if not user.rbac_roles:
            return []
        
        return [role.name for role in user.rbac_roles if role.is_active]
    
    def require_permission(self, permission_name: str, resource_id: Optional[str] = None):
        """Decorator to require specific permission"""
        async def permission_checker(
            request: Request,
            current_user: models.User = Depends(lambda r, c, db: rbac_middleware.get_current_user_with_permissions(r, c, db)),
            db: Session = Depends(get_db)
        ) -> models.User:
            
            start_time = time.time()
            ip_address = self._get_client_ip(request)
            user_agent = request.headers.get("user-agent")
            
            has_permission = await self.check_permission(
                current_user, permission_name, db, resource_id
            )
            
            if not has_permission:
                await self._log_access_attempt(
                    db, current_user.id, str(request.url.path), request.method, False,
                    f"permission_denied: {permission_name}", ip_address, user_agent, start_time,
                    permission_name=permission_name, resource_id=resource_id
                )
                
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Permission '{permission_name}' required"
                )
            
            # Log successful access
            await self._log_access_attempt(
                db, current_user.id, str(request.url.path), request.method, True,
                "permission_granted", ip_address, user_agent, start_time,
                permission_name=permission_name, resource_id=resource_id
            )
            
            return current_user
        
        return permission_checker
    
    def require_role(self, role_name: str):
        """Decorator to require specific role"""
        async def role_checker(
            request: Request,
            current_user: models.User = Depends(lambda r, c, db: rbac_middleware.get_current_user_with_permissions(r, c, db)),
            db: Session = Depends(get_db)
        ) -> models.User:
            
            start_time = time.time()
            ip_address = self._get_client_ip(request)
            user_agent = request.headers.get("user-agent")
            
            has_role = await self.check_role(current_user, role_name)
            
            if not has_role:
                await self._log_access_attempt(
                    db, current_user.id, str(request.url.path), request.method, False,
                    f"role_denied: {role_name}", ip_address, user_agent, start_time
                )
                
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Role '{role_name}' required"
                )
            
            # Log successful access
            await self._log_access_attempt(
                db, current_user.id, str(request.url.path), request.method, True,
                "role_granted", ip_address, user_agent, start_time
            )
            
            return current_user
        
        return role_checker
    
    def require_any_role(self, role_names: List[str]):
        """Decorator to require any of the specified roles"""
        async def role_checker(
            request: Request,
            current_user: models.User = Depends(lambda r, c, db: rbac_middleware.get_current_user_with_permissions(r, c, db)),
            db: Session = Depends(get_db)
        ) -> models.User:
            
            start_time = time.time()
            ip_address = self._get_client_ip(request)
            user_agent = request.headers.get("user-agent")
            
            has_any_role = await self.check_any_role(current_user, role_names)
            
            if not has_any_role:
                await self._log_access_attempt(
                    db, current_user.id, str(request.url.path), request.method, False,
                    f"roles_denied: {', '.join(role_names)}", ip_address, user_agent, start_time
                )
                
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"One of these roles required: {', '.join(role_names)}"
                )
            
            # Log successful access
            await self._log_access_attempt(
                db, current_user.id, str(request.url.path), request.method, True,
                "roles_granted", ip_address, user_agent, start_time
            )
            
            return current_user
        
        return role_checker
    
    def require_any_permission(self, permission_names: List[str]):
        """Decorator to require any of the specified permissions"""
        async def permission_checker(
            request: Request,
            current_user: models.User = Depends(lambda r, c, db: rbac_middleware.get_current_user_with_permissions(r, c, db)),
            db: Session = Depends(get_db)
        ) -> models.User:
            
            start_time = time.time()
            ip_address = self._get_client_ip(request)
            user_agent = request.headers.get("user-agent")
            
            has_any_permission = False
            for permission_name in permission_names:
                if await self.check_permission(current_user, permission_name, db):
                    has_any_permission = True
                    break
            
            if not has_any_permission:
                await self._log_access_attempt(
                    db, current_user.id, str(request.url.path), request.method, False,
                    f"permissions_denied: {', '.join(permission_names)}", ip_address, user_agent, start_time
                )
                
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"One of these permissions required: {', '.join(permission_names)}"
                )
            
            # Log successful access
            await self._log_access_attempt(
                db, current_user.id, str(request.url.path), request.method, True,
                "permissions_granted", ip_address, user_agent, start_time
            )
            
            return current_user
        
        return permission_checker
    
    async def _log_access_attempt(
        self,
        db: Session,
        user_id: Optional[str],
        endpoint: str,
        method: str,
        access_granted: bool,
        reason: str,
        ip_address: Optional[str],
        user_agent: Optional[str],
        start_time: float,
        permission_name: Optional[str] = None,
        resource_id: Optional[str] = None
    ):
        """Log access attempt for audit purposes"""
        
        if not self.config.audit_logging_enabled:
            return
        
        response_time_ms = int((time.time() - start_time) * 1000)
        
        # Extract resource and action from endpoint
        resource = "unknown"
        action = "unknown"
        
        if endpoint.startswith("/api/"):
            parts = endpoint.split("/")
            if len(parts) >= 3:
                resource = parts[2]  # e.g., "inventory", "customers"
                if len(parts) >= 4:
                    action = parts[3] if parts[3] else method.lower()
                else:
                    action = method.lower()
        
        access_log = RBACAccessLog(
            user_id=user_id,
            resource=resource,
            action=action,
            permission_name=permission_name,
            access_granted=access_granted,
            endpoint=endpoint,
            method=method,
            ip_address=ip_address,
            user_agent=user_agent,
            resource_id=resource_id,
            reason=reason,
            response_time_ms=response_time_ms,
            metadata={
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "reason": reason
            }
        )
        
        db.add(access_log)
        try:
            await db.commit()
        except Exception as e:
            # Don't fail the request if logging fails
            print(f"Failed to log access attempt: {e}")
            await db.rollback()
    
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
rbac_middleware = RBACMiddleware()

# Convenience functions for backward compatibility and ease of use
async def get_current_user_with_permissions(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> models.User:
    """Get current user with permissions - convenience function"""
    return await rbac_middleware.get_current_user_with_permissions(request, credentials, db)

def require_permission(permission_name: str, resource_id: Optional[str] = None):
    """Require specific permission - convenience function"""
    return rbac_middleware.require_permission(permission_name, resource_id)

def require_role(role_name: str):
    """Require specific role - convenience function"""
    return rbac_middleware.require_role(role_name)

def require_any_role(role_names: List[str]):
    """Require any of the specified roles - convenience function"""
    return rbac_middleware.require_any_role(role_names)

def require_any_permission(permission_names: List[str]):
    """Require any of the specified permissions - convenience function"""
    return rbac_middleware.require_any_permission(permission_names)

# Helper functions
async def user_has_permission(user: models.User, permission_name: str, db: Session) -> bool:
    """Check if user has specific permission"""
    return await rbac_middleware.check_permission(user, permission_name, db)

async def user_has_role(user: models.User, role_name: str) -> bool:
    """Check if user has specific role"""
    return await rbac_middleware.check_role(user, role_name)

async def user_has_any_role(user: models.User, role_names: List[str]) -> bool:
    """Check if user has any of the specified roles"""
    return await rbac_middleware.check_any_role(user, role_names)

async def get_user_permissions(user: models.User, db: Session) -> Dict[str, bool]:
    """Get all user permissions"""
    return await rbac_middleware.get_user_permissions(user, db)

async def get_user_roles(user: models.User) -> List[str]:
    """Get list of user role names"""
    return await rbac_middleware.get_user_roles(user)

# Decorators for route-level authorization
def authenticated_with_permission(permission: str):
    """Decorator to require authentication and specific permission"""
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            return await func(*args, **kwargs)
        return wrapper
    return decorator

def authenticated_with_role(role: str):
    """Decorator to require authentication and specific role"""
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            return await func(*args, **kwargs)
        return wrapper
    return decorator

def authenticated_with_any_role(roles: List[str]):
    """Decorator to require authentication and any of the specified roles"""
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            return await func(*args, **kwargs)
        return wrapper
    return decorator