"""
Role-Based Access Control (RBAC) Models
Enhanced RBAC system for comprehensive permission management
"""

from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text, ForeignKey, Index, Table
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

# Import Base from database_base to ensure single metadata instance
from database_base import Base

# Association table for many-to-many relationship between roles and permissions
role_permissions = Table(
    'role_permissions',
    Base.metadata,
    Column('role_id', UUID(as_uuid=True), ForeignKey('rbac_roles.id', ondelete='CASCADE'), primary_key=True),
    Column('permission_id', UUID(as_uuid=True), ForeignKey('rbac_permissions.id', ondelete='CASCADE'), primary_key=True),
    Index('idx_role_permissions_role', 'role_id'),
    Index('idx_role_permissions_permission', 'permission_id')
)

# Association table for many-to-many relationship between users and roles
user_roles = Table(
    'user_roles',
    Base.metadata,
    Column('user_id', UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
    Column('role_id', UUID(as_uuid=True), ForeignKey('rbac_roles.id', ondelete='CASCADE'), primary_key=True),
    Column('assigned_at', DateTime(timezone=True), server_default=func.now()),
    Column('assigned_by', UUID(as_uuid=True), ForeignKey('users.id', ondelete='SET NULL')),
    Index('idx_user_roles_user', 'user_id'),
    Index('idx_user_roles_role', 'role_id'),
    Index('idx_user_roles_assigned_by', 'assigned_by')
)

class RBACRole(Base):
    """Enhanced Role model for comprehensive RBAC"""
    __tablename__ = "rbac_roles"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False)
    display_name = Column(String(200), nullable=False)
    description = Column(Text)
    
    # Role hierarchy
    parent_role_id = Column(UUID(as_uuid=True), ForeignKey("rbac_roles.id"), nullable=True)
    level = Column(Integer, default=0)  # Hierarchy level
    
    # Role properties
    is_system_role = Column(Boolean, default=False)  # System-defined roles
    is_active = Column(Boolean, default=True)
    priority = Column(Integer, default=0)  # Higher priority roles override lower ones
    
    # Role metadata
    color = Column(String(7), default='#3B82F6')  # Hex color for UI
    icon = Column(String(50))  # Icon name for UI
    role_metadata = Column(JSONB)  # Additional role metadata
    
    # Audit fields
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    parent_role = relationship("RBACRole", remote_side=[id], back_populates="child_roles")
    child_roles = relationship("RBACRole", back_populates="parent_role")
    permissions = relationship("RBACPermission", secondary=role_permissions, back_populates="roles")
    # users relationship will be handled via direct queries to avoid circular imports
    creator = relationship("User", foreign_keys=[created_by])
    
    __table_args__ = (
        Index('idx_rbac_roles_name', 'name'),
        Index('idx_rbac_roles_active', 'is_active'),
        Index('idx_rbac_roles_system', 'is_system_role'),
        Index('idx_rbac_roles_parent', 'parent_role_id'),
        Index('idx_rbac_roles_level', 'level'),
        Index('idx_rbac_roles_priority', 'priority'),
    )

class RBACPermission(Base):
    """Comprehensive Permission model"""
    __tablename__ = "rbac_permissions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False)  # e.g., 'inventory:read'
    display_name = Column(String(200), nullable=False)  # Human-readable name
    description = Column(Text)
    
    # Permission categorization
    resource = Column(String(50), nullable=False)  # e.g., 'inventory', 'customers', 'invoices'
    action = Column(String(50), nullable=False)  # e.g., 'read', 'write', 'delete', 'approve'
    scope = Column(String(50), default='all')  # e.g., 'all', 'own', 'department'
    
    # Permission properties
    is_system_permission = Column(Boolean, default=False)  # System-defined permissions
    is_active = Column(Boolean, default=True)
    requires_approval = Column(Boolean, default=False)  # Some permissions may require approval
    
    # Permission metadata
    category = Column(String(50))  # e.g., 'financial', 'operational', 'administrative'
    risk_level = Column(String(20), default='low')  # 'low', 'medium', 'high', 'critical'
    permission_metadata = Column(JSONB)  # Additional permission metadata
    
    # Audit fields
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    roles = relationship("RBACRole", secondary=role_permissions, back_populates="permissions")
    creator = relationship("User", foreign_keys=[created_by])
    
    __table_args__ = (
        Index('idx_rbac_permissions_name', 'name'),
        Index('idx_rbac_permissions_resource', 'resource'),
        Index('idx_rbac_permissions_action', 'action'),
        Index('idx_rbac_permissions_resource_action', 'resource', 'action'),
        Index('idx_rbac_permissions_category', 'category'),
        Index('idx_rbac_permissions_risk_level', 'risk_level'),
        Index('idx_rbac_permissions_active', 'is_active'),
        Index('idx_rbac_permissions_system', 'is_system_permission'),
    )

class RBACUserPermission(Base):
    """Direct user permissions (overrides role permissions)"""
    __tablename__ = "rbac_user_permissions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    permission_id = Column(UUID(as_uuid=True), ForeignKey("rbac_permissions.id", ondelete="CASCADE"), nullable=False)
    
    # Permission override
    granted = Column(Boolean, nullable=False)  # True = grant, False = deny
    scope_override = Column(String(50))  # Override permission scope
    
    # Metadata
    reason = Column(Text)  # Reason for direct permission assignment
    expires_at = Column(DateTime(timezone=True))  # Temporary permissions
    
    # Audit fields
    assigned_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    permission = relationship("RBACPermission")
    assigner = relationship("User", foreign_keys=[assigned_by])
    
    __table_args__ = (
        Index('idx_rbac_user_permissions_user', 'user_id'),
        Index('idx_rbac_user_permissions_permission', 'permission_id'),
        Index('idx_rbac_user_permissions_user_permission', 'user_id', 'permission_id', unique=True),
        Index('idx_rbac_user_permissions_granted', 'granted'),
        Index('idx_rbac_user_permissions_expires', 'expires_at'),
    )

class RBACPermissionGroup(Base):
    """Permission groups for easier management"""
    __tablename__ = "rbac_permission_groups"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False)
    display_name = Column(String(200), nullable=False)
    description = Column(Text)
    
    # Group properties
    color = Column(String(7), default='#6B7280')  # Hex color for UI
    icon = Column(String(50))  # Icon name for UI
    is_active = Column(Boolean, default=True)
    
    # Audit fields
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    creator = relationship("User")
    
    __table_args__ = (
        Index('idx_rbac_permission_groups_name', 'name'),
        Index('idx_rbac_permission_groups_active', 'is_active'),
    )

# Association table for permission groups and permissions
permission_group_permissions = Table(
    'permission_group_permissions',
    Base.metadata,
    Column('group_id', UUID(as_uuid=True), ForeignKey('rbac_permission_groups.id', ondelete='CASCADE'), primary_key=True),
    Column('permission_id', UUID(as_uuid=True), ForeignKey('rbac_permissions.id', ondelete='CASCADE'), primary_key=True),
    Index('idx_permission_group_permissions_group', 'group_id'),
    Index('idx_permission_group_permissions_permission', 'permission_id')
)

# Add the relationship to RBACPermissionGroup
RBACPermissionGroup.permissions = relationship("RBACPermission", secondary=permission_group_permissions)

class RBACAccessLog(Base):
    """Access control audit logging"""
    __tablename__ = "rbac_access_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    # Access details
    resource = Column(String(50), nullable=False)
    action = Column(String(50), nullable=False)
    permission_name = Column(String(100))
    access_granted = Column(Boolean, nullable=False)
    
    # Request context
    endpoint = Column(String(200))  # API endpoint or page accessed
    method = Column(String(10))  # HTTP method
    ip_address = Column(String(45))  # IPv6 compatible
    user_agent = Column(Text)
    
    # Additional context
    resource_id = Column(UUID(as_uuid=True))  # ID of accessed resource
    reason = Column(Text)  # Reason for access denial
    log_metadata = Column(JSONB)  # Additional context data
    
    # Timing
    response_time_ms = Column(Integer)  # Response time in milliseconds
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User")
    
    __table_args__ = (
        Index('idx_rbac_access_logs_user', 'user_id'),
        Index('idx_rbac_access_logs_resource_action', 'resource', 'action'),
        Index('idx_rbac_access_logs_granted', 'access_granted'),
        Index('idx_rbac_access_logs_timestamp', 'timestamp'),
        Index('idx_rbac_access_logs_ip', 'ip_address'),
        Index('idx_rbac_access_logs_endpoint', 'endpoint'),
    )

class RBACSession(Base):
    """User session tracking for RBAC"""
    __tablename__ = "rbac_sessions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    session_token = Column(String(255), unique=True, nullable=False)
    
    # Session details
    ip_address = Column(String(45))  # IPv6 compatible
    user_agent = Column(Text)
    device_fingerprint = Column(String(255))
    
    # Session state
    is_active = Column(Boolean, default=True)
    last_activity = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)
    
    # Cached permissions for performance
    cached_permissions = Column(JSONB)  # Cached user permissions
    permissions_cached_at = Column(DateTime(timezone=True))
    
    # Audit fields
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    terminated_at = Column(DateTime(timezone=True))
    termination_reason = Column(String(50))  # 'logout', 'timeout', 'admin', 'security'
    
    # Relationships
    user = relationship("User")
    
    __table_args__ = (
        Index('idx_rbac_sessions_user', 'user_id'),
        Index('idx_rbac_sessions_token', 'session_token'),
        Index('idx_rbac_sessions_active', 'is_active'),
        Index('idx_rbac_sessions_expires', 'expires_at'),
        Index('idx_rbac_sessions_last_activity', 'last_activity'),
    )