"""
Comprehensive Authentication Service
Integrates OAuth2, token management, and user authentication
"""
from typing import Optional, Dict, Any, List, Tuple
from datetime import datetime, timedelta
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_
import models
from oauth2_config import get_oauth2_config
from oauth2_tokens import get_token_manager
from oauth2_audit import log_authentication_event, log_security_event, TokenEvent, SecurityEvent
from auth import verify_password, get_password_hash
import secrets

class AuthenticationService:
    """Comprehensive authentication service with OAuth2 integration"""
    
    def __init__(self):
        self.config = get_oauth2_config()
        self.token_manager = get_token_manager()
    
    async def authenticate_user(
        self, 
        db: Session, 
        username: str, 
        password: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Tuple[models.User, str, str]:
        """
        Authenticate user and return user object with tokens
        Returns: (user, access_token, refresh_token)
        """
        
        # Find user by username or email
        user = db.query(models.User).filter(
            (models.User.username == username) | (models.User.email == username)
        ).first()
        
        if not user:
            log_authentication_event(
                db, None, TokenEvent.LOGIN_FAILED, False,
                {"username": username, "reason": "user_not_found"},
                ip_address, user_agent
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        # Verify password
        if not verify_password(password, user.password_hash):
            log_authentication_event(
                db, user.id, TokenEvent.LOGIN_FAILED, False,
                {"username": username, "reason": "invalid_password"},
                ip_address, user_agent
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        # Check if user is active
        if not user.is_active:
            log_authentication_event(
                db, user.id, TokenEvent.LOGIN_FAILED, False,
                {"username": username, "reason": "inactive_user"},
                ip_address, user_agent
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account is inactive"
            )
        
        # Get user permissions as scopes
        scopes = self._get_user_scopes(user)
        
        # Create token pair
        access_token, refresh_token, access_expires_at, refresh_expires_at = self.token_manager.create_token_pair(
            str(user.id), scopes, db,
            additional_claims={
                "username": user.username,
                "email": user.email,
                "role": user.role.name if user.role else None
            }
        )
        
        # Update user's last login
        user.last_login = datetime.utcnow()
        db.commit()
        
        # Log successful authentication
        log_authentication_event(
            db, user.id, TokenEvent.LOGIN_SUCCESS, True,
            {"username": username, "scopes": scopes},
            ip_address, user_agent
        )
        
        return user, access_token, refresh_token
    
    async def refresh_user_tokens(
        self,
        db: Session,
        refresh_token: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Tuple[str, str]:
        """
        Refresh user tokens
        Returns: (new_access_token, new_refresh_token)
        """
        
        result = self.token_manager.refresh_tokens(refresh_token, db)
        
        if not result:
            log_authentication_event(
                db, None, TokenEvent.REFRESH_FAILED, False,
                {"reason": "invalid_refresh_token"},
                ip_address, user_agent
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        new_access_token, new_refresh_token, access_expires_at, refresh_expires_at = result
        
        # Get user info from new token
        payload = self.token_manager.validate_access_token(new_access_token, db)
        if payload:
            log_authentication_event(
                db, payload["sub"], TokenEvent.REFRESHED, True,
                {"token_refreshed": True},
                ip_address, user_agent
            )
        
        return new_access_token, new_refresh_token
    
    async def logout_user(
        self,
        db: Session,
        user: models.User,
        revoke_all_tokens: bool = False,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> int:
        """
        Logout user and revoke tokens
        Returns: number of tokens revoked
        """
        
        if revoke_all_tokens:
            revoked_count = self.token_manager.revoke_user_tokens(str(user.id), db)
        else:
            # For single session logout, we'd need the specific token
            # For now, revoke all tokens
            revoked_count = self.token_manager.revoke_user_tokens(str(user.id), db)
        
        log_authentication_event(
            db, user.id, TokenEvent.LOGOUT, True,
            {"revoked_tokens": revoked_count, "revoke_all": revoke_all_tokens},
            ip_address, user_agent
        )
        
        return revoked_count
    
    async def create_user(
        self,
        db: Session,
        username: str,
        email: str,
        password: str,
        role_name: Optional[str] = None,
        is_active: bool = True
    ) -> models.User:
        """Create a new user with proper validation"""
        
        # Check if username already exists
        existing_user = db.query(models.User).filter(
            (models.User.username == username) | (models.User.email == email)
        ).first()
        
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username or email already exists"
            )
        
        # Get role if specified
        role = None
        if role_name:
            role = db.query(models.Role).filter(models.Role.name == role_name).first()
            if not role:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Role '{role_name}' not found"
                )
        
        # Create user
        user = models.User(
            username=username,
            email=email,
            password_hash=get_password_hash(password),
            role=role,
            is_active=is_active,
            created_at=datetime.utcnow()
        )
        
        db.add(user)
        db.commit()
        db.refresh(user)
        
        return user
    
    async def change_password(
        self,
        db: Session,
        user: models.User,
        current_password: str,
        new_password: str,
        revoke_all_tokens: bool = True
    ) -> bool:
        """Change user password and optionally revoke all tokens"""
        
        # Verify current password
        if not verify_password(current_password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect"
            )
        
        # Update password
        user.password_hash = get_password_hash(new_password)
        user.updated_at = datetime.utcnow()
        db.commit()
        
        # Revoke all tokens for security
        if revoke_all_tokens:
            self.token_manager.revoke_user_tokens(str(user.id), db)
        
        return True
    
    async def reset_password(
        self,
        db: Session,
        user: models.User,
        new_password: str
    ) -> bool:
        """Reset user password (admin function)"""
        
        user.password_hash = get_password_hash(new_password)
        user.updated_at = datetime.utcnow()
        db.commit()
        
        # Revoke all tokens for security
        self.token_manager.revoke_user_tokens(str(user.id), db)
        
        return True
    
    async def activate_user(self, db: Session, user: models.User) -> bool:
        """Activate user account"""
        user.is_active = True
        user.updated_at = datetime.utcnow()
        db.commit()
        return True
    
    async def deactivate_user(self, db: Session, user: models.User) -> bool:
        """Deactivate user account and revoke all tokens"""
        user.is_active = False
        user.updated_at = datetime.utcnow()
        db.commit()
        
        # Revoke all tokens
        self.token_manager.revoke_user_tokens(str(user.id), db)
        
        return True
    
    async def get_user_sessions(self, user_id: str) -> Dict[str, Any]:
        """Get active sessions for a user"""
        return self.token_manager.get_user_session_info(user_id)
    
    async def revoke_user_session(
        self,
        db: Session,
        user_id: str,
        token_hash: str
    ) -> bool:
        """Revoke a specific user session"""
        
        # Find token by hash
        token_record = db.query(models.OAuth2Token).filter(
            and_(
                models.OAuth2Token.user_id == user_id,
                (models.OAuth2Token.access_token_hash == token_hash) |
                (models.OAuth2Token.refresh_token_hash == token_hash),
                models.OAuth2Token.revoked == False
            )
        ).first()
        
        if token_record:
            token_record.revoked = True
            token_record.revoked_at = datetime.utcnow()
            db.commit()
            
            # Add to blacklist
            self.token_manager._add_to_blacklist("", token_record.expires_at)  # We don't have the actual token
            
            return True
        
        return False
    
    def _get_user_scopes(self, user: models.User) -> List[str]:
        """Get user scopes based on role and permissions"""
        if not user.role or not user.role.permissions:
            return self.config.default_scopes
        
        scopes = []
        for permission, granted in user.role.permissions.items():
            if granted:
                scopes.append(permission)
        
        # Always include default scopes
        for scope in self.config.default_scopes:
            if scope not in scopes:
                scopes.append(scope)
        
        return scopes
    
    async def validate_token_and_get_user(
        self,
        db: Session,
        token: str
    ) -> Optional[models.User]:
        """Validate token and return user"""
        
        payload = self.token_manager.validate_access_token(token, db)
        if not payload:
            return None
        
        user_id = payload.get("sub")
        if not user_id:
            return None
        
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user or not user.is_active:
            return None
        
        return user
    
    async def get_authentication_stats(self, db: Session) -> Dict[str, Any]:
        """Get comprehensive authentication statistics"""
        
        # Token stats
        token_stats = self.token_manager.get_token_stats(db)
        
        # User stats
        total_users = db.query(models.User).count()
        active_users = db.query(models.User).filter(models.User.is_active == True).count()
        inactive_users = total_users - active_users
        
        # Recent login stats (last 24 hours)
        from oauth2_audit import analyze_failed_login_attempts
        failed_login_stats = analyze_failed_login_attempts(db, hours=24)
        
        return {
            "users": {
                "total": total_users,
                "active": active_users,
                "inactive": inactive_users
            },
            "tokens": token_stats,
            "security": {
                "failed_logins_24h": failed_login_stats
            }
        }

# Global authentication service instance
authentication_service = AuthenticationService()

def get_authentication_service() -> AuthenticationService:
    """Get authentication service instance"""
    return authentication_service