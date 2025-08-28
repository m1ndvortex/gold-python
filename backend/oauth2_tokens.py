"""
OAuth2 Token Management System
Enhanced with Redis caching and comprehensive security features
Handles JWT token creation, validation, rotation, and revocation
"""
import hashlib
import secrets
import json
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List, Tuple
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from sqlalchemy import and_
import models
from oauth2_config import get_oauth2_config
from oauth2_audit import log_token_event, TokenEvent
from redis_config import get_redis_client

class TokenManager:
    """Enhanced OAuth2 token manager with Redis caching and security features"""
    
    def __init__(self):
        self.config = get_oauth2_config()
        self.redis_client = get_redis_client()
        self.token_blacklist_prefix = "oauth2:blacklist:"
        self.token_cache_prefix = "oauth2:token:"
        self.user_tokens_prefix = "oauth2:user_tokens:"
    
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
        """Validate access token with Redis caching for performance"""
        # Check cache first
        cached_info = self._get_cached_token_info(token)
        if cached_info and cached_info.get("valid"):
            payload = cached_info.get("payload")
            if payload and payload.get("exp", 0) > datetime.utcnow().timestamp():
                return payload
        
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
            
            # Cache valid token info
            ttl_seconds = int(payload.get("exp", 0) - datetime.utcnow().timestamp())
            if ttl_seconds > 0:
                self._cache_token_info(token, payload, min(ttl_seconds, 900))  # Max 15 min cache
            
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
        """Revoke a specific token with Redis blacklisting"""
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
            
            # Add to Redis blacklist for immediate effect
            self._add_to_blacklist(token, stored_token.expires_at)
            
            # Remove from user's active tokens
            self._remove_user_token(stored_token.user_id, token_hash)
            
            # Log revocation
            if self.config.audit_logging_enabled:
                log_token_event(
                    db, stored_token.user_id, TokenEvent.REVOKED,
                    {"token_type": "manual_revocation"}
                )
            
            return True
        
        return False
    
    def revoke_user_tokens(self, user_id: str, db: Session) -> int:
        """Revoke all tokens for a user with Redis cleanup"""
        # Get tokens to revoke for blacklisting
        tokens_to_revoke = db.query(models.OAuth2Token).filter(
            and_(
                models.OAuth2Token.user_id == user_id,
                models.OAuth2Token.revoked == False
            )
        ).all()
        
        # Update database
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
        
        # Add all tokens to Redis blacklist
        for token_record in tokens_to_revoke:
            # We need to reconstruct the token to blacklist it
            # Since we only store hashes, we'll blacklist by hash
            if self.redis_client:
                try:
                    blacklist_key = f"{self.token_blacklist_prefix}{token_record.access_token_hash}"
                    ttl_seconds = int((token_record.expires_at - datetime.utcnow()).total_seconds())
                    if ttl_seconds > 0:
                        self.redis_client.setex(blacklist_key, ttl_seconds, "revoked")
                    
                    # Also blacklist refresh token if exists
                    if token_record.refresh_token_hash:
                        refresh_blacklist_key = f"{self.token_blacklist_prefix}{token_record.refresh_token_hash}"
                        refresh_ttl = int((token_record.refresh_expires_at - datetime.utcnow()).total_seconds())
                        if refresh_ttl > 0:
                            self.redis_client.setex(refresh_blacklist_key, refresh_ttl, "revoked")
                except Exception as e:
                    print(f"Failed to blacklist token: {e}")
        
        # Clear user's token tracking
        if self.redis_client:
            try:
                user_tokens_key = f"{self.user_tokens_prefix}{user_id}"
                self.redis_client.delete(user_tokens_key)
            except Exception as e:
                print(f"Failed to clear user tokens: {e}")
        
        # Log bulk revocation
        if self.config.audit_logging_enabled and count > 0:
            log_token_event(
                db, user_id, TokenEvent.REVOKED,
                {"token_type": "bulk_revocation", "count": count}
            )
        
        return count
    
    def cleanup_expired_tokens(self, db: Session) -> int:
        """Clean up expired tokens from database and Redis"""
        from datetime import timezone
        now = datetime.now(timezone.utc)
        
        # Get expired tokens first
        expired_tokens = db.query(models.OAuth2Token).filter(
            models.OAuth2Token.refresh_expires_at < now
        ).all()
        
        # Delete them one by one to avoid timezone comparison issues
        count = 0
        for token in expired_tokens:
            # Clean up Redis entries for this token
            if self.redis_client:
                try:
                    # Remove from blacklist (if present)
                    blacklist_key = f"{self.token_blacklist_prefix}{token.access_token_hash}"
                    self.redis_client.delete(blacklist_key)
                    
                    if token.refresh_token_hash:
                        refresh_blacklist_key = f"{self.token_blacklist_prefix}{token.refresh_token_hash}"
                        self.redis_client.delete(refresh_blacklist_key)
                    
                    # Remove from token cache
                    cache_key = f"{self.token_cache_prefix}{token.access_token_hash}"
                    self.redis_client.delete(cache_key)
                    
                    # Remove from user tokens tracking
                    self._remove_user_token(token.user_id, token.access_token_hash)
                    if token.refresh_token_hash:
                        self._remove_user_token(token.user_id, token.refresh_token_hash)
                        
                except Exception as e:
                    print(f"Failed to cleanup Redis entries for expired token: {e}")
            
            db.delete(token)
            count += 1
        
        db.commit()
        
        # Also cleanup any orphaned Redis keys
        self._cleanup_redis_orphans()
        
        return count
    
    def _cleanup_redis_orphans(self):
        """Clean up orphaned Redis keys"""
        if not self.redis_client:
            return
        
        try:
            # Clean up expired blacklist entries (Redis handles this automatically with TTL)
            # Clean up expired cache entries (Redis handles this automatically with TTL)
            
            # Clean up empty user token sets
            user_token_keys = self.redis_client.keys(f"{self.user_tokens_prefix}*")
            for key in user_token_keys:
                if self.redis_client.scard(key) == 0:
                    self.redis_client.delete(key)
                    
        except Exception as e:
            print(f"Failed to cleanup Redis orphans: {e}")
    
    def get_token_stats(self, db: Session) -> Dict[str, Any]:
        """Get comprehensive token statistics"""
        try:
            # Database stats
            total_tokens = db.query(models.OAuth2Token).count()
            active_tokens = db.query(models.OAuth2Token).filter(
                models.OAuth2Token.revoked == False
            ).count()
            revoked_tokens = total_tokens - active_tokens
            
            # Redis stats
            redis_stats = {}
            if self.redis_client:
                try:
                    blacklist_keys = len(self.redis_client.keys(f"{self.token_blacklist_prefix}*"))
                    cache_keys = len(self.redis_client.keys(f"{self.token_cache_prefix}*"))
                    user_token_keys = len(self.redis_client.keys(f"{self.user_tokens_prefix}*"))
                    
                    redis_stats = {
                        "blacklisted_tokens": blacklist_keys,
                        "cached_tokens": cache_keys,
                        "tracked_user_sessions": user_token_keys,
                        "redis_connected": True
                    }
                except Exception as e:
                    redis_stats = {
                        "redis_connected": False,
                        "error": str(e)
                    }
            else:
                redis_stats = {"redis_connected": False}
            
            return {
                "database": {
                    "total_tokens": total_tokens,
                    "active_tokens": active_tokens,
                    "revoked_tokens": revoked_tokens
                },
                "redis": redis_stats,
                "config": {
                    "access_token_expire_minutes": self.config.access_token_expire_minutes,
                    "refresh_token_expire_days": self.config.refresh_token_expire_days,
                    "token_rotation_enabled": self.config.token_rotation_enabled,
                    "audit_logging_enabled": self.config.audit_logging_enabled
                }
            }
        except Exception as e:
            return {"error": str(e)}
    
    def invalidate_token_cache(self, token: str):
        """Invalidate cached token info"""
        if not self.redis_client:
            return
        
        try:
            token_hash = self._hash_token(token)
            cache_key = f"{self.token_cache_prefix}{token_hash}"
            self.redis_client.delete(cache_key)
        except Exception as e:
            print(f"Failed to invalidate token cache: {e}")
    
    def get_user_session_info(self, user_id: str) -> Dict[str, Any]:
        """Get detailed session information for a user"""
        active_tokens = self.get_user_active_tokens(user_id)
        
        return {
            "user_id": user_id,
            "active_sessions": len(active_tokens),
            "tokens": [
                {
                    "token_hash": token["token_hash"][:16] + "...",  # Partial hash for security
                    "created_at": token["created_at"],
                    "expires_at": token["expires_at"]
                }
                for token in active_tokens
            ]
        }
    
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
        """Store token information in database and Redis"""
        access_token_hash = self._hash_token(access_token)
        refresh_token_hash = self._hash_token(refresh_token)
        
        token_record = models.OAuth2Token(
            user_id=user_id,
            access_token_hash=access_token_hash,
            refresh_token_hash=refresh_token_hash,
            expires_at=access_expires_at,
            refresh_expires_at=refresh_expires_at,
            scopes=scopes,
            revoked=False
        )
        
        db.add(token_record)
        db.commit()
        
        # Track tokens in Redis for user
        self._track_user_token(user_id, access_token_hash, access_expires_at)
        self._track_user_token(user_id, refresh_token_hash, refresh_expires_at)
    
    def _hash_token(self, token: str) -> str:
        """Hash token for secure storage"""
        return hashlib.sha256(token.encode()).hexdigest()
    
    def _is_token_revoked(self, db: Session, token: str) -> bool:
        """Check if token is revoked using Redis cache first, then database"""
        token_hash = self._hash_token(token)
        
        # Check Redis blacklist first for performance
        if self.redis_client:
            try:
                blacklist_key = f"{self.token_blacklist_prefix}{token_hash}"
                if self.redis_client.exists(blacklist_key):
                    return True
            except Exception as e:
                print(f"Redis blacklist check failed: {e}")
        
        # Fallback to database check
        revoked_token = db.query(models.OAuth2Token).filter(
            and_(
                models.OAuth2Token.access_token_hash == token_hash,
                models.OAuth2Token.revoked == True
            )
        ).first()
        
        return revoked_token is not None
    
    def _add_to_blacklist(self, token: str, expires_at: datetime):
        """Add token to Redis blacklist"""
        if not self.redis_client:
            return
        
        try:
            token_hash = self._hash_token(token)
            blacklist_key = f"{self.token_blacklist_prefix}{token_hash}"
            
            # Calculate TTL based on token expiration
            ttl_seconds = int((expires_at - datetime.utcnow()).total_seconds())
            if ttl_seconds > 0:
                self.redis_client.setex(blacklist_key, ttl_seconds, "revoked")
        except Exception as e:
            print(f"Failed to add token to blacklist: {e}")
    
    def _cache_token_info(self, token: str, payload: Dict[str, Any], ttl_seconds: int):
        """Cache token validation info in Redis"""
        if not self.redis_client:
            return
        
        try:
            token_hash = self._hash_token(token)
            cache_key = f"{self.token_cache_prefix}{token_hash}"
            
            cache_data = {
                "payload": payload,
                "cached_at": datetime.utcnow().isoformat(),
                "valid": True
            }
            
            self.redis_client.setex(cache_key, ttl_seconds, json.dumps(cache_data, default=str))
        except Exception as e:
            print(f"Failed to cache token info: {e}")
    
    def _get_cached_token_info(self, token: str) -> Optional[Dict[str, Any]]:
        """Get cached token validation info from Redis"""
        if not self.redis_client:
            return None
        
        try:
            token_hash = self._hash_token(token)
            cache_key = f"{self.token_cache_prefix}{token_hash}"
            
            cached_data = self.redis_client.get(cache_key)
            if cached_data:
                return json.loads(cached_data)
        except Exception as e:
            print(f"Failed to get cached token info: {e}")
        
        return None
    
    def _track_user_token(self, user_id: str, token_hash: str, expires_at: datetime):
        """Track user tokens in Redis for bulk operations"""
        if not self.redis_client:
            return
        
        try:
            user_tokens_key = f"{self.user_tokens_prefix}{user_id}"
            token_info = {
                "token_hash": token_hash,
                "expires_at": expires_at.isoformat(),
                "created_at": datetime.utcnow().isoformat()
            }
            
            # Add to user's token set
            self.redis_client.sadd(user_tokens_key, json.dumps(token_info, default=str))
            
            # Set expiration for the user tokens set
            ttl_seconds = int((expires_at - datetime.utcnow()).total_seconds())
            if ttl_seconds > 0:
                self.redis_client.expire(user_tokens_key, ttl_seconds + 3600)  # Extra hour buffer
        except Exception as e:
            print(f"Failed to track user token: {e}")
    
    def _remove_user_token(self, user_id: str, token_hash: str):
        """Remove token from user's tracked tokens"""
        if not self.redis_client:
            return
        
        try:
            user_tokens_key = f"{self.user_tokens_prefix}{user_id}"
            
            # Get all tokens for user and remove the matching one
            tokens = self.redis_client.smembers(user_tokens_key)
            for token_data in tokens:
                try:
                    token_info = json.loads(token_data)
                    if token_info.get("token_hash") == token_hash:
                        self.redis_client.srem(user_tokens_key, token_data)
                        break
                except json.JSONDecodeError:
                    continue
        except Exception as e:
            print(f"Failed to remove user token: {e}")
    
    def get_user_active_tokens(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all active tokens for a user from Redis"""
        if not self.redis_client:
            return []
        
        try:
            user_tokens_key = f"{self.user_tokens_prefix}{user_id}"
            tokens = self.redis_client.smembers(user_tokens_key)
            
            active_tokens = []
            for token_data in tokens:
                try:
                    token_info = json.loads(token_data)
                    expires_at = datetime.fromisoformat(token_info["expires_at"])
                    
                    # Only include non-expired tokens
                    if expires_at > datetime.utcnow():
                        active_tokens.append(token_info)
                    else:
                        # Remove expired token from set
                        self.redis_client.srem(user_tokens_key, token_data)
                except (json.JSONDecodeError, KeyError, ValueError):
                    # Remove invalid token data
                    self.redis_client.srem(user_tokens_key, token_data)
            
            return active_tokens
        except Exception as e:
            print(f"Failed to get user active tokens: {e}")
            return []

# Global token manager instance
token_manager = TokenManager()

def get_token_manager() -> TokenManager:
    """Get token manager instance"""
    return token_manager