"""
Business Type Configuration Models

This module defines the database models for business type configuration,
including business types, terminology mappings, workflow configurations,
and custom field schemas.
"""

from sqlalchemy import Column, String, Text, Boolean, Integer, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from enum import Enum
from typing import Dict, List, Any, Optional
from pydantic import BaseModel

from database import Base

class BusinessTypeEnum(str, Enum):
    """Supported business types"""
    GOLD_SHOP = "gold_shop"
    RETAIL_STORE = "retail_store"
    RESTAURANT = "restaurant"
    SERVICE_BUSINESS = "service_business"
    MANUFACTURING = "manufacturing"
    WHOLESALE = "wholesale"
    PHARMACY = "pharmacy"
    AUTOMOTIVE = "automotive"
    GROCERY_STORE = "grocery_store"
    CLOTHING_STORE = "clothing_store"
    ELECTRONICS_STORE = "electronics_store"
    CUSTOM = "custom"

class WorkflowTypeEnum(str, Enum):
    """Workflow types for different business operations"""
    INVOICE_WORKFLOW = "invoice_workflow"
    INVENTORY_WORKFLOW = "inventory_workflow"
    CUSTOMER_WORKFLOW = "customer_workflow"
    PAYMENT_WORKFLOW = "payment_workflow"
    REPORTING_WORKFLOW = "reporting_workflow"

class FieldTypeEnum(str, Enum):
    """Custom field types"""
    TEXT = "text"
    NUMBER = "number"
    DATE = "date"
    DATETIME = "datetime"
    BOOLEAN = "boolean"
    ENUM = "enum"
    MULTI_SELECT = "multi_select"
    FILE = "file"
    IMAGE = "image"

class BusinessTypeConfiguration(Base):
    """Main business type configuration table"""
    __tablename__ = "business_type_configurations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_type = Column(String(50), nullable=False, unique=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    industry = Column(String(100))
    
    # Configuration settings
    is_active = Column(Boolean, default=True)
    is_default = Column(Boolean, default=False)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    terminology_mappings = relationship("TerminologyMapping", back_populates="business_config")
    workflow_configurations = relationship("WorkflowConfiguration", back_populates="business_config")
    custom_field_schemas = relationship("CustomFieldSchema", back_populates="business_config")
    feature_configurations = relationship("FeatureConfiguration", back_populates="business_config")
    report_templates = relationship("ReportTemplate", back_populates="business_config")
    kpi_definitions = relationship("KPIDefinition", back_populates="business_config")

class TerminologyMapping(Base):
    """Terminology mappings for different business types"""
    __tablename__ = "terminology_mappings"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_config_id = Column(UUID(as_uuid=True), ForeignKey("business_type_configurations.id"), nullable=False)
    
    # Standard term and business-specific term
    standard_term = Column(String(100), nullable=False)
    business_term = Column(String(100), nullable=False)
    
    # Context and category
    context = Column(String(100))  # e.g., "inventory", "invoice", "customer"
    category = Column(String(50))  # e.g., "field_label", "menu_item", "button_text"
    
    # Language support
    language_code = Column(String(10), default="en")
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    business_config = relationship("BusinessTypeConfiguration", back_populates="terminology_mappings")

class WorkflowConfiguration(Base):
    """Workflow configurations for different business types"""
    __tablename__ = "workflow_configurations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_config_id = Column(UUID(as_uuid=True), ForeignKey("business_type_configurations.id"), nullable=False)
    
    # Workflow details
    workflow_type = Column(String(50), nullable=False)
    workflow_name = Column(String(255), nullable=False)
    
    # Workflow configuration
    stages = Column(JSONB)  # List of workflow stages
    rules = Column(JSONB)   # Business rules and conditions
    approvals = Column(JSONB)  # Approval requirements
    notifications = Column(JSONB)  # Notification settings
    
    # Settings
    is_active = Column(Boolean, default=True)
    is_required = Column(Boolean, default=False)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    business_config = relationship("BusinessTypeConfiguration", back_populates="workflow_configurations")

class CustomFieldSchema(Base):
    """Custom field schemas for different business types"""
    __tablename__ = "custom_field_schemas"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_config_id = Column(UUID(as_uuid=True), ForeignKey("business_type_configurations.id"), nullable=False)
    
    # Field details
    field_name = Column(String(100), nullable=False)
    field_label = Column(String(255), nullable=False)
    field_type = Column(String(50), nullable=False)
    
    # Field configuration
    entity_type = Column(String(50), nullable=False)  # e.g., "inventory", "invoice", "customer"
    field_options = Column(JSONB)  # Options for enum/multi-select fields
    validation_rules = Column(JSONB)  # Validation rules
    default_value = Column(JSONB)  # Default value
    
    # Settings
    is_required = Column(Boolean, default=False)
    is_searchable = Column(Boolean, default=False)
    is_filterable = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    
    # Display settings
    display_order = Column(Integer, default=0)
    display_group = Column(String(100))
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    business_config = relationship("BusinessTypeConfiguration", back_populates="custom_field_schemas")

class FeatureConfiguration(Base):
    """Feature configurations for different business types"""
    __tablename__ = "feature_configurations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_config_id = Column(UUID(as_uuid=True), ForeignKey("business_type_configurations.id"), nullable=False)
    
    # Feature details
    feature_name = Column(String(100), nullable=False)
    feature_category = Column(String(50))  # e.g., "inventory", "accounting", "reporting"
    
    # Configuration
    is_enabled = Column(Boolean, default=True)
    configuration = Column(JSONB)  # Feature-specific configuration
    
    # Access control
    required_roles = Column(JSONB)  # Required roles to access feature
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    business_config = relationship("BusinessTypeConfiguration", back_populates="feature_configurations")

class ReportTemplate(Base):
    """Report templates for different business types"""
    __tablename__ = "report_templates"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_config_id = Column(UUID(as_uuid=True), ForeignKey("business_type_configurations.id"), nullable=False)
    
    # Template details
    template_name = Column(String(255), nullable=False)
    template_category = Column(String(100))
    description = Column(Text)
    
    # Template configuration
    report_type = Column(String(50))  # e.g., "financial", "inventory", "sales"
    template_config = Column(JSONB)  # Report configuration
    chart_config = Column(JSONB)  # Chart configuration
    
    # Settings
    is_default = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    business_config = relationship("BusinessTypeConfiguration", back_populates="report_templates")

class KPIDefinition(Base):
    """KPI definitions for different business types"""
    __tablename__ = "kpi_definitions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_config_id = Column(UUID(as_uuid=True), ForeignKey("business_type_configurations.id"), nullable=False)
    
    # KPI details
    kpi_name = Column(String(255), nullable=False)
    kpi_category = Column(String(100))
    description = Column(Text)
    
    # Calculation configuration
    calculation_method = Column(String(100))  # e.g., "sum", "average", "ratio"
    calculation_config = Column(JSONB)  # Calculation parameters
    
    # Display configuration
    display_format = Column(String(50))  # e.g., "currency", "percentage", "number"
    target_value = Column(JSONB)  # Target values for different periods
    
    # Settings
    is_default = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    business_config = relationship("BusinessTypeConfiguration", back_populates="kpi_definitions")

class ServiceCatalog(Base):
    """Service catalog for service-based businesses"""
    __tablename__ = "service_catalog"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_config_id = Column(UUID(as_uuid=True), ForeignKey("business_type_configurations.id"), nullable=False)
    
    # Service details
    service_name = Column(String(255), nullable=False)
    service_code = Column(String(50))
    description = Column(Text)
    category = Column(String(100))
    
    # Pricing and time
    base_price = Column(String(20))  # Using string to handle different currencies
    currency = Column(String(3), default="USD")
    estimated_duration = Column(Integer)  # Duration in minutes
    
    # Configuration
    requires_booking = Column(Boolean, default=False)
    is_time_tracked = Column(Boolean, default=False)
    billing_method = Column(String(50))  # e.g., "fixed", "hourly", "per_unit"
    
    # Settings
    is_active = Column(Boolean, default=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    business_config = relationship("BusinessTypeConfiguration")

class BillOfMaterials(Base):
    """Bill of Materials for manufacturing businesses"""
    __tablename__ = "bill_of_materials"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_config_id = Column(UUID(as_uuid=True), ForeignKey("business_type_configurations.id"), nullable=False)
    
    # BOM details
    bom_name = Column(String(255), nullable=False)
    bom_code = Column(String(50))
    product_id = Column(UUID(as_uuid=True))  # Reference to inventory item
    version = Column(String(20), default="1.0")
    
    # Configuration
    components = Column(JSONB)  # List of components with quantities
    production_steps = Column(JSONB)  # Production process steps
    
    # Costing
    material_cost = Column(String(20))
    labor_cost = Column(String(20))
    overhead_cost = Column(String(20))
    total_cost = Column(String(20))
    
    # Settings
    is_active = Column(Boolean, default=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    business_config = relationship("BusinessTypeConfiguration")

class ProductionTracking(Base):
    """Production tracking for manufacturing businesses"""
    __tablename__ = "production_tracking"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_config_id = Column(UUID(as_uuid=True), ForeignKey("business_type_configurations.id"), nullable=False)
    
    # Production details
    production_order = Column(String(100), nullable=False)
    bom_id = Column(UUID(as_uuid=True), ForeignKey("bill_of_materials.id"))
    product_id = Column(UUID(as_uuid=True))  # Reference to inventory item
    
    # Quantities
    planned_quantity = Column(Integer, nullable=False)
    produced_quantity = Column(Integer, default=0)
    rejected_quantity = Column(Integer, default=0)
    
    # Status and timing
    status = Column(String(50), default="planned")  # planned, in_progress, completed, cancelled
    start_date = Column(DateTime(timezone=True))
    end_date = Column(DateTime(timezone=True))
    
    # Tracking data
    production_steps = Column(JSONB)  # Step completion tracking
    quality_checks = Column(JSONB)  # Quality control data
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    business_config = relationship("BusinessTypeConfiguration")
    bom = relationship("BillOfMaterials")