"""
OAuth2 Provider Integration
Supports Auth0, Keycloak, and custom OAuth2 providers
"""
import httpx
import json
from typing import Optional, Dict, Any, Tuple
from urllib.parse import urlencode
from jose import jwt, JWTError
from oauth2_config import get_oauth2_config, get_provider_config, OAuth2Provider
from oauth2_audit import log_authentication_event, TokenEvent
from sqlalchemy.orm import Session

class OAuth2ProviderError(Exception):
    """OAuth2 provider specific error"""
    pass

class OAuth2ProviderService:
    """Service for integrating with OAuth2 providers"""
    
    def __init__(self):
        self.config = get_oauth2_config()
        self.provider_config = get_provider_config()
    
    async def get_authorization_url(
        self, 
        redirect_uri: str, 
        state: str, 
        scopes: Optional[list] = None
    ) -> str:
        """Generate authorization URL for OAuth2 flow"""
        
        if not scopes:
            scopes = self.config.default_scopes
        
        params = {
            "response_type": "code",
            "client_id": self._get_client_id(),
            "redirect_uri": redirect_uri,
            "scope": " ".join(scopes),
            "state": state
        }
        
        # Add provider-specific parameters
        if self.config.provider == OAuth2Provider.AUTH0:
            params["audience"] = self.provider_config.get("audience")
        
        authorization_url = self.provider_config["authorization_url"]
        return f"{authorization_url}?{urlencode(params)}"
    
    async def exchange_code_for_tokens(
        self, 
        code: str, 
        redirect_uri: str,
        db: Session
    ) -> Tuple[str, str, Dict[str, Any]]:
        """
        Exchange authorization code for access and refresh tokens
        Returns: (access_token, refresh_token, user_info)
        """
        
        token_data = {
            "grant_type": "authorization_code",
            "client_id": self._get_client_id(),
            "client_secret": self._get_client_secret(),
            "code": code,
            "redirect_uri": redirect_uri
        }
        
        # Add provider-specific parameters
        if self.config.provider == OAuth2Provider.AUTH0:
            token_data["audience"] = self.provider_config.get("audience")
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.provider_config["token_url"],
                    data=token_data,
                    headers={"Content-Type": "application/x-www-form-urlencoded"}
                )
                
                if response.status_code != 200:
                    error_detail = response.text
                    log_authentication_event(
                        db, None, TokenEvent.LOGIN_FAILED, False,
                        {"error": "token_exchange_failed", "detail": error_detail}
                    )
                    raise OAuth2ProviderError(f"Token exchange failed: {error_detail}")
                
                token_response = response.json()
                access_token = token_response.get("access_token")
                refresh_token = token_response.get("refresh_token")
                
                if not access_token:
                    log_authentication_event(
                        db, None, TokenEvent.LOGIN_FAILED, False,
                        {"error": "no_access_token_in_response"}
                    )
                    raise OAuth2ProviderError("No access token in response")
                
                # Get user information
                user_info = await self._get_user_info(access_token)
                
                return access_token, refresh_token, user_info
                
        except httpx.RequestError as e:
            log_authentication_event(
                db, None, TokenEvent.LOGIN_FAILED, False,
                {"error": "network_error", "detail": str(e)}
            )
            raise OAuth2ProviderError(f"Network error during token exchange: {str(e)}")
    
    async def refresh_provider_token(
        self, 
        refresh_token: str,
        db: Session
    ) -> Tuple[str, Optional[str]]:
        """
        Refresh access token using provider's refresh token
        Returns: (new_access_token, new_refresh_token)
        """
        
        refresh_data = {
            "grant_type": "refresh_token",
            "client_id": self._get_client_id(),
            "client_secret": self._get_client_secret(),
            "refresh_token": refresh_token
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.provider_config["token_url"],
                    data=refresh_data,
                    headers={"Content-Type": "application/x-www-form-urlencoded"}
                )
                
                if response.status_code != 200:
                    error_detail = response.text
                    log_authentication_event(
                        db, None, TokenEvent.REFRESH_FAILED, False,
                        {"error": "provider_refresh_failed", "detail": error_detail}
                    )
                    raise OAuth2ProviderError(f"Token refresh failed: {error_detail}")
                
                token_response = response.json()
                new_access_token = token_response.get("access_token")
                new_refresh_token = token_response.get("refresh_token")  # May be None
                
                if not new_access_token:
                    log_authentication_event(
                        db, None, TokenEvent.REFRESH_FAILED, False,
                        {"error": "no_access_token_in_refresh_response"}
                    )
                    raise OAuth2ProviderError("No access token in refresh response")
                
                return new_access_token, new_refresh_token
                
        except httpx.RequestError as e:
            log_authentication_event(
                db, None, TokenEvent.REFRESH_FAILED, False,
                {"error": "network_error_refresh", "detail": str(e)}
            )
            raise OAuth2ProviderError(f"Network error during token refresh: {str(e)}")
    
    async def validate_provider_token(self, access_token: str) -> Optional[Dict[str, Any]]:
        """Validate access token with the provider"""
        
        try:
            # For JWT tokens, we can decode and validate locally
            if self.config.provider in [OAuth2Provider.AUTH0, OAuth2Provider.KEYCLOAK]:
                return await self._validate_jwt_token(access_token)
            else:
                # For custom providers, call userinfo endpoint
                return await self._validate_via_userinfo(access_token)
                
        except Exception as e:
            return None
    
    async def revoke_provider_token(self, token: str, db: Session) -> bool:
        """Revoke token with the provider"""
        
        # Not all providers support token revocation
        revoke_url = self._get_revoke_url()
        if not revoke_url:
            return True  # Assume success if no revoke endpoint
        
        revoke_data = {
            "token": token,
            "client_id": self._get_client_id(),
            "client_secret": self._get_client_secret()
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    revoke_url,
                    data=revoke_data,
                    headers={"Content-Type": "application/x-www-form-urlencoded"}
                )
                
                # Some providers return 200, others return 204
                return response.status_code in [200, 204]
                
        except httpx.RequestError:
            return False
    
    async def _get_user_info(self, access_token: str) -> Dict[str, Any]:
        """Get user information from provider"""
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    self.provider_config["userinfo_url"],
                    headers={"Authorization": f"Bearer {access_token}"}
                )
                
                if response.status_code != 200:
                    raise OAuth2ProviderError(f"Failed to get user info: {response.text}")
                
                return response.json()
                
        except httpx.RequestError as e:
            raise OAuth2ProviderError(f"Network error getting user info: {str(e)}")
    
    async def _validate_jwt_token(self, access_token: str) -> Optional[Dict[str, Any]]:
        """Validate JWT token (for Auth0/Keycloak)"""
        
        try:
            # For production, you should fetch and cache the public keys
            # This is a simplified version
            unverified_payload = jwt.get_unverified_claims(access_token)
            
            # Basic validation - in production, verify signature with public key
            if unverified_payload.get("exp", 0) < datetime.utcnow().timestamp():
                return None
            
            return unverified_payload
            
        except JWTError:
            return None
    
    async def _validate_via_userinfo(self, access_token: str) -> Optional[Dict[str, Any]]:
        """Validate token by calling userinfo endpoint"""
        
        try:
            user_info = await self._get_user_info(access_token)
            return user_info
        except OAuth2ProviderError:
            return None
    
    def _get_client_id(self) -> str:
        """Get client ID for current provider"""
        if self.config.provider == OAuth2Provider.AUTH0:
            return self.config.auth0_client_id
        elif self.config.provider == OAuth2Provider.KEYCLOAK:
            return self.config.keycloak_client_id
        else:
            return self.config.custom_client_id
    
    def _get_client_secret(self) -> str:
        """Get client secret for current provider"""
        if self.config.provider == OAuth2Provider.AUTH0:
            return self.config.auth0_client_secret
        elif self.config.provider == OAuth2Provider.KEYCLOAK:
            return self.config.keycloak_client_secret
        else:
            return self.config.custom_client_secret
    
    def _get_revoke_url(self) -> Optional[str]:
        """Get token revocation URL for current provider"""
        if self.config.provider == OAuth2Provider.AUTH0:
            return f"https://{self.config.auth0_domain}/oauth/revoke"
        elif self.config.provider == OAuth2Provider.KEYCLOAK:
            return f"{self.config.keycloak_server_url}/realms/{self.config.keycloak_realm}/protocol/openid-connect/revoke"
        else:
            # Custom providers may not support revocation
            return None

# Global provider service instance
oauth2_provider_service = OAuth2ProviderService()

def get_oauth2_provider_service() -> OAuth2ProviderService:
    """Get OAuth2 provider service instance"""
    return oauth2_provider_service

from datetime import datetime