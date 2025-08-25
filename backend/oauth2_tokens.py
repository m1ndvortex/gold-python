"""
OAuth2 Token Management System
Handles JWT token creation, validation, rotation, and revocation
"""
import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List, Tuple
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from sqlalchemy import and_
import models
from oauth2_config import get_oauth2_config
from oauth2_audit import log_token_event, TokenEvent

class TokenManager:
    """Manages OAuth2 tokens with security best practices"""
    
    def __init__(self):
        self.config = get_oauth2_config()
    
    def create_token_pair(
        self, 
        user_id: str, 
        scopes: List[str], 
        db: Session,
        additional_claims: Optional[Dict[str, Any]] = None
    ) -> Tuple[str, str, datetime, datetime]:
        """
        Create access and refresh token pair
        Returns: (access_token, refresh_token, access_expires_at, refresh_expires_at)
        """
        now = datetime.utcnow()
        access_expires_at = now + timedelta(minutes=self.config.access_token_expire_minutes)
        refresh_expires_at = now + timedelta(days=self.config.refresh_token_expire_days)
        
        # Create access token
        access_payload = {
            "sub": user_id,
            "scopes": scopes,
            "type": "access",
            "iat": now,
            "exp": access_expires_at,
            "jti": secrets.token_urlsafe(32)  # JWT ID for tracking
        }
        
        if additional_claims:
            access_payload.update(additional_claims)
        
        access_token = jwt.encode(
            access_payload, 
            self.config.jwt_secret_key, 
            algorithm=self.config.jwt_algorithm
        )
        
        # Create refresh token
        refresh_payload = {
            "sub": user_id,
            "type": "refresh",
            "iat": now,
            "exp": refresh_expires_at,
            "jti": secrets.token_urlsafe(32)
        }
        
        refresh_token = jwt.encode(
            refresh_payload,
            self.config.jwt_secret_key,
            algorithm=self.config.jwt_algorithm
        )
        
        # Store token information in database
        self._store_token_info(
            db, user_id, access_token, refresh_token, 
            access_expires_at, refresh_expires_at, scopes
        )
        
        # Log token creation
        if self.config.audit_logging_enabled:
            log_token_event(
                db, user_id, TokenEvent.ISSUED, 
                {"access_jti": access_payload["jti"], "refresh_jti": refresh_payload["jti"]}
            )
        
        return access_token, refresh_token, access_expires_at, refresh_expires_at
    
    def validate_access_token(self, token: str, db: Session) -> Optional[Dict[str, Any]]:
        """Validate access token and return payload"""
        try:
            payload = jwt.decode(
                token, 
                self.config.jwt_secret_key, 
                algorithms=[self.config.jwt_algorithm]
            )
            
            # Check token type
            if payload.get("type") != "access":
                return None
            
            # Check if token is revoked
            if self._is_token_revoked(db, token):
                return None
            
            return payload
            
        except JWTError:
            return None
    
    def validate_refresh_token(self, token: str, db: Session) -> Optional[Dict[str, Any]]:
        """Validate refresh token and return payload"""
        try:
            payload = jwt.decode(
                token,
                self.config.jwt_secret_key,
                algorithms=[self.config.jwt_algorithm]
            )
            
            # Check token type
            if payload.get("type") != "refresh":
                return None
            
            # Check if token is revoked
            if self._is_token_revoked(db, token):
                return None
            
            return payload
            
        except JWTError:
            return None
    
    def refresh_tokens(
        self, 
        refresh_token: str, 
        db: Session
    ) -> Optional[Tuple[str, str, datetime, datetime]]:
        """
        Refresh access token using refresh token
        Returns new token pair if successful
        """
        # Validate refresh token
        payload = self.validate_refresh_token(refresh_token, db)
        if not payload:
            if self.config.audit_logging_enabled:
                log_token_event(
                    db, None, TokenEvent.REFRESH_FAILED,
                    {"reason": "invalid_refresh_token"}
                )
            return None
        
        user_id = payload["sub"]
        
        # Get user and their current scopes
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user or not user.is_active:
            if self.config.audit_logging_enabled:
                log_token_event(
                    db, user_id, TokenEvent.REFRESH_FAILED,
                    {"reason": "user_inactive_or_not_found"}
                )
            return None
        
        # Get current scopes from stored token info
        stored_token = db.query(models.OAuth2Token).filter(
            and_(
                models.OAuth2Token.user_id == user_id,
                models.OAuth2Token.refresh_token_hash == self._hash_token(refresh_token),
                models.OAuth2Token.revoked == False
            )
        ).first()
        
        if not stored_token:
            if self.config.audit_logging_enabled:
                log_token_event(
                    db, user_id, TokenEvent.REFRESH_FAILED,
                    {"reason": "token_not_found_in_db"}
                )
            return None
        
        # Revoke old tokens if rotation is enabled
        if self.config.token_rotation_enabled:
            self.revoke_user_tokens(user_id, db)
        
        # Create new token pair
        new_access_token, new_refresh_token, access_expires_at, refresh_expires_at = self.create_token_pair(
            user_id, stored_token.scopes, db
        )
        
        # Log successful refresh
        if self.config.audit_logging_enabled:
            log_token_event(
                db, user_id, TokenEvent.REFRESHED,
                {"old_refresh_jti": payload.get("jti")}
            )
        
        return new_access_token, new_refresh_token, access_expires_at, refresh_expires_at
    
    def revoke_token(self, token: str, db: Session) -> bool:
        """Revoke a specific token"""
        token_hash = self._hash_token(token)
        
        # Find and revoke token
        stored_token = db.query(models.OAuth2Token).filter(
            models.OAuth2Token.access_token_hash == token_hash
        ).first()
        
        if not stored_token:
            # Try refresh token
            stored_token = db.query(models.OAuth2Token).filter(
                models.OAuth2Token.refresh_token_hash == token_hash
            ).first()
        
        if stored_token:
            stored_token.revoked = True
            stored_token.revoked_at = datetime.utcnow()
            db.commit()
            
            # Log revocation
            if self.config.audit_logging_enabled:
                log_token_event(
                    db, stored_token.user_id, TokenEvent.REVOKED,
                    {"token_type": "manual_revocation"}
                )
            
            return True
        
        return False
    
    def revoke_user_tokens(self, user_id: str, db: Session) -> int:
        """Revoke all tokens for a user"""
        count = db.query(models.OAuth2Token).filter(
            and_(
                models.OAuth2Token.user_id == user_id,
                models.OAuth2Token.revoked == False
            )
        ).update({
            "revoked": True,
            "revoked_at": datetime.utcnow()
        })
        
        db.commit()
        
        # Log bulk revocation
        if self.config.audit_logging_enabled and count > 0:
            log_token_event(
                db, user_id, TokenEvent.REVOKED,
                {"token_type": "bulk_revocation", "count": count}
            )
        
        return count
    
    def cleanup_expired_tokens(self, db: Session) -> int:
        """Clean up expired tokens from database"""
        from datetime import timezone
        now = datetime.now(timezone.utc)
        
        # Get expired tokens first
        expired_tokens = db.query(models.OAuth2Token).filter(
            models.OAuth2Token.refresh_expires_at < now
        ).all()
        
        # Delete them one by one to avoid timezone comparison issues
        count = 0
        for token in expired_tokens:
            db.delete(token)
            count += 1
        
        db.commit()
        return count
    
    def _store_token_info(
        self, 
        db: Session, 
        user_id: str, 
        access_token: str, 
        refresh_token: str,
        access_expires_at: datetime,
        refresh_expires_at: datetime,
        scopes: List[str]
    ):
        """Store token information in database"""
        token_record = models.OAuth2Token(
            user_id=user_id,
            access_token_hash=self._hash_token(access_token),
            refresh_token_hash=self._hash_token(refresh_token),
            expires_at=access_expires_at,
            refresh_expires_at=refresh_expires_at,
            scopes=scopes,
            revoked=False
        )
        
        db.add(token_record)
        db.commit()
    
    def _hash_token(self, token: str) -> str:
        """Hash token for secure storage"""
        return hashlib.sha256(token.encode()).hexdigest()
    
    def _is_token_revoked(self, db: Session, token: str) -> bool:
        """Check if token is revoked"""
        token_hash = self._hash_token(token)
        
        revoked_token = db.query(models.OAuth2Token).filter(
            and_(
                models.OAuth2Token.access_token_hash == token_hash,
                models.OAuth2Token.revoked == True
            )
        ).first()
        
        return revoked_token is not None

# Global token manager instance
token_manager = TokenManager()

def get_token_manager() -> TokenManager:
    """Get token manager instance"""
    return token_manager