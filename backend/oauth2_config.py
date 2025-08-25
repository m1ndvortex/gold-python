"""
OAuth2 Configuration and Provider Integration
Supports Auth0, Keycloak, and custom OAuth2 providers
"""
import os
from typing import Optional, Dict, Any, List
from pydantic import Field
from pydantic_settings import BaseSettings
from enum import Enum

class OAuth2Provider(str, Enum):
    AUTH0 = "auth0"
    KEYCLOAK = "keycloak"
    CUSTOM = "custom"

class OAuth2Config(BaseSettings):
    """OAuth2 configuration settings"""
    
    # Provider configuration
    provider: OAuth2Provider = Field(default=OAuth2Provider.CUSTOM, env="OAUTH2_PROVIDER")
    
    # Auth0 configuration
    auth0_domain: Optional[str] = Field(default=None, env="AUTH0_DOMAIN")
    auth0_client_id: Optional[str] = Field(default=None, env="AUTH0_CLIENT_ID")
    auth0_client_secret: Optional[str] = Field(default=None, env="AUTH0_CLIENT_SECRET")
    auth0_audience: Optional[str] = Field(default=None, env="AUTH0_AUDIENCE")
    
    # Keycloak configuration
    keycloak_server_url: Optional[str] = Field(default=None, env="KEYCLOAK_SERVER_URL")
    keycloak_realm: Optional[str] = Field(default=None, env="KEYCLOAK_REALM")
    keycloak_client_id: Optional[str] = Field(default=None, env="KEYCLOAK_CLIENT_ID")
    keycloak_client_secret: Optional[str] = Field(default=None, env="KEYCLOAK_CLIENT_SECRET")
    
    # Custom OAuth2 configuration
    custom_authorization_url: Optional[str] = Field(default=None, env="CUSTOM_AUTHORIZATION_URL")
    custom_token_url: Optional[str] = Field(default=None, env="CUSTOM_TOKEN_URL")
    custom_userinfo_url: Optional[str] = Field(default=None, env="CUSTOM_USERINFO_URL")
    custom_client_id: Optional[str] = Field(default=None, env="CUSTOM_CLIENT_ID")
    custom_client_secret: Optional[str] = Field(default=None, env="CUSTOM_CLIENT_SECRET")
    
    # JWT configuration
    jwt_secret_key: str = Field(default="your-secret-key-change-in-production", env="JWT_SECRET_KEY")
    jwt_algorithm: str = Field(default="HS256", env="JWT_ALGORITHM")
    
    # Token expiration settings (in minutes)
    access_token_expire_minutes: int = Field(default=15, env="ACCESS_TOKEN_EXPIRE_MINUTES")  # Short-lived
    refresh_token_expire_days: int = Field(default=30, env="REFRESH_TOKEN_EXPIRE_DAYS")  # Long-lived
    
    # Security settings
    token_rotation_enabled: bool = Field(default=True, env="TOKEN_ROTATION_ENABLED")
    audit_logging_enabled: bool = Field(default=True, env="AUDIT_LOGGING_ENABLED")
    
    # Scopes and permissions
    default_scopes: List[str] = Field(default=["read", "write"], env="DEFAULT_SCOPES")
    
    class Config:
        env_file = ".env"
        case_sensitive = False

# Global configuration instance
oauth2_config = OAuth2Config()

def get_oauth2_config() -> OAuth2Config:
    """Get OAuth2 configuration"""
    return oauth2_config

def get_provider_config() -> Dict[str, Any]:
    """Get provider-specific configuration"""
    config = get_oauth2_config()
    
    if config.provider == OAuth2Provider.AUTH0:
        return {
            "provider": "auth0",
            "domain": config.auth0_domain,
            "client_id": config.auth0_client_id,
            "client_secret": config.auth0_client_secret,
            "audience": config.auth0_audience,
            "authorization_url": f"https://{config.auth0_domain}/authorize",
            "token_url": f"https://{config.auth0_domain}/oauth/token",
            "userinfo_url": f"https://{config.auth0_domain}/userinfo",
        }
    elif config.provider == OAuth2Provider.KEYCLOAK:
        return {
            "provider": "keycloak",
            "server_url": config.keycloak_server_url,
            "realm": config.keycloak_realm,
            "client_id": config.keycloak_client_id,
            "client_secret": config.keycloak_client_secret,
            "authorization_url": f"{config.keycloak_server_url}/realms/{config.keycloak_realm}/protocol/openid-connect/auth",
            "token_url": f"{config.keycloak_server_url}/realms/{config.keycloak_realm}/protocol/openid-connect/token",
            "userinfo_url": f"{config.keycloak_server_url}/realms/{config.keycloak_realm}/protocol/openid-connect/userinfo",
        }
    else:  # Custom provider
        return {
            "provider": "custom",
            "authorization_url": config.custom_authorization_url,
            "token_url": config.custom_token_url,
            "userinfo_url": config.custom_userinfo_url,
            "client_id": config.custom_client_id,
            "client_secret": config.custom_client_secret,
        }

def validate_oauth2_config() -> bool:
    """Validate OAuth2 configuration based on selected provider"""
    config = get_oauth2_config()
    
    if config.provider == OAuth2Provider.AUTH0:
        required_fields = [config.auth0_domain, config.auth0_client_id, config.auth0_client_secret]
        return all(field is not None for field in required_fields)
    elif config.provider == OAuth2Provider.KEYCLOAK:
        required_fields = [
            config.keycloak_server_url, 
            config.keycloak_realm, 
            config.keycloak_client_id, 
            config.keycloak_client_secret
        ]
        return all(field is not None for field in required_fields)
    else:  # Custom provider
        required_fields = [
            config.custom_authorization_url,
            config.custom_token_url,
            config.custom_userinfo_url,
            config.custom_client_id,
            config.custom_client_secret
        ]
        return all(field is not None for field in required_fields)