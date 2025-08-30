"""
Universal Business Adaptability Models
Enhanced models for business type configuration, workflow adaptation, terminology mapping,
custom field schemas, feature configuration, unit management, pricing models, and reporting templates.
"""

from sqlalchemy import Column, String, Integer, Boolean, DateTime, Date, Text, DECIMAL, ForeignKey, Index, ARRAY
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.sql import func
import uuid

Base = declarative_base()

class BusinessType(Base):
    """Business type definitions with configuration templates"""
    __tablename__ = "business_types"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type_code = Column(String(50), unique=True, nullable=False)  # retail, restaurant, pharmacy, etc.
    name = Column(String(100), nullable=False)
    name_persian = Column(String(100))
    description = Column(Text)
    icon = Column(String(50))
    color = Column(String(7), default='#3B82F6')
    
    # Default configuration template
    default_configuration = Column(JSONB, nullable=False, default={})
    default_terminology = Column(JSONB, nullable=False, default={})
    default_workflow_config = Column(JSONB, nullable=False, default={})
    default_feature_flags = Column(JSONB, nullable=False, default={})
    default_units = Column(JSONB, nullable=False, default=[])
    default_pricing_models = Column(JSONB, nullable=False, default=[])
    
    # Industry-specific settings
    industry_category = Column(String(50))  # retail, service, manufacturing, etc.
    regulatory_requirements = Column(JSONB, default={})
    compliance_features = Column(JSONB, default={})
    
    # Status
    is_active = Column(Boolean, default=True)
    is_template = Column(Boolean, default=True)  # Can be used as template for new businesses
    
    # Audit trail
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_by = Column(UUID(as_uuid=True))
    
    # Relationships
    business_configurations = relationship("EnhancedBusinessConfiguration", back_populates="business_type")
    
    __table_args__ = (
        Index('idx_business_types_code', 'type_code'),
        Index('idx_business_types_active', 'is_active'),
        Index('idx_business_types_industry', 'industry_category'),
    )

class EnhancedBusinessConfiguration(Base):
    """Enhanced business configuration with full adaptability support"""
    __tablename__ = "enhanced_business_configurations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_type_id = Column(UUID(as_uuid=True), ForeignKey("business_types.id"), nullable=False)
    business_name = Column(String(255), nullable=False)
    
    # Core configuration
    configuration = Column(JSONB, nullable=False, default={})
    terminology_mapping = Column(JSONB, default={})
    workflow_config = Column(JSONB, default={})
    feature_flags = Column(JSONB, default={})
    
    # Business-specific settings
    units_of_measure = Column(JSONB, default=[])
    pricing_models = Column(JSONB, default=[])
    custom_field_schemas = Column(JSONB, default={})
    reporting_templates = Column(JSONB, default={})
    
    # Localization
    default_language = Column(String(10), default='en')
    supported_languages = Column(ARRAY(String), default=['en'])
    currency = Column(String(3), default='USD')
    timezone = Column(String(50), default='UTC')
    date_format = Column(String(20), default='YYYY-MM-DD')
    number_format = Column(JSONB, default={})
    
    # Business information
    business_address = Column(Text)
    business_phone = Column(String(50))
    business_email = Column(String(100))
    business_website = Column(String(255))
    tax_id = Column(String(100))
    registration_number = Column(String(100))
    
    # Operational settings
    operating_hours = Column(JSONB, default={})
    business_locations = Column(JSONB, default=[])
    departments = Column(JSONB, default=[])
    
    # Migration tracking
    migrated_from_type = Column(String(50))
    migration_date = Column(DateTime(timezone=True))
    migration_notes = Column(Text)
    
    # Status
    is_active = Column(Boolean, default=True)
    setup_completed = Column(Boolean, default=False)
    
    # Audit trail
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_by = Column(UUID(as_uuid=True))
    updated_by = Column(UUID(as_uuid=True))
    
    # Relationships
    business_type = relationship("BusinessType", back_populates="business_configurations")
    workflow_rules = relationship("WorkflowRule", back_populates="business_configuration")
    custom_fields = relationship("CustomFieldDefinition", back_populates="business_configuration")
    pricing_rules = relationship("PricingRule", back_populates="business_configuration")
    
    __table_args__ = (
        Index('idx_enhanced_business_config_type', 'business_type_id'),
        Index('idx_enhanced_business_config_active', 'is_active'),
        Index('idx_enhanced_business_config_setup', 'setup_completed'),
    )

class WorkflowRule(Base):
    """Workflow rules for business-specific process adaptation"""
    __tablename__ = "workflow_rules"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_configuration_id = Column(UUID(as_uuid=True), ForeignKey("enhanced_business_configurations.id"), nullable=False)
    
    # Rule identification
    rule_name = Column(String(100), nullable=False)
    rule_type = Column(String(50), nullable=False)  # inventory, invoice, accounting, etc.
    entity_type = Column(String(50), nullable=False)  # item, category, invoice, customer, etc.
    
    # Conditions and actions
    conditions = Column(JSONB, nullable=False, default={})
    actions = Column(JSONB, nullable=False, default={})
    
    # Rule configuration
    priority = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    applies_to = Column(JSONB, default={})  # Specific entities this rule applies to
    
    # Execution tracking
    execution_count = Column(Integer, default=0)
    last_executed = Column(DateTime(timezone=True))
    
    # Audit trail
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_by = Column(UUID(as_uuid=True))
    
    # Relationships
    business_configuration = relationship("EnhancedBusinessConfiguration", back_populates="workflow_rules")
    
    __table_args__ = (
        Index('idx_workflow_rules_config', 'business_configuration_id'),
        Index('idx_workflow_rules_type', 'rule_type', 'entity_type'),
        Index('idx_workflow_rules_active', 'is_active'),
        Index('idx_workflow_rules_priority', 'priority'),
    )

class CustomFieldDefinition(Base):
    """Custom field definitions per business type"""
    __tablename__ = "custom_field_definitions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_configuration_id = Column(UUID(as_uuid=True), ForeignKey("enhanced_business_configurations.id"), nullable=False)
    
    # Field identification
    field_name = Column(String(100), nullable=False)
    field_key = Column(String(100), nullable=False)  # Internal key for storage
    entity_type = Column(String(50), nullable=False)  # item, category, invoice, customer, etc.
    
    # Field configuration
    field_type = Column(String(50), nullable=False)  # text, number, date, enum, boolean, file, etc.
    field_config = Column(JSONB, nullable=False, default={})
    validation_rules = Column(JSONB, default={})
    
    # Display configuration
    display_name = Column(String(100), nullable=False)
    display_name_persian = Column(String(100))
    description = Column(Text)
    placeholder = Column(String(255))
    help_text = Column(Text)
    
    # Form configuration
    is_required = Column(Boolean, default=False)
    is_searchable = Column(Boolean, default=True)
    is_filterable = Column(Boolean, default=True)
    is_sortable = Column(Boolean, default=False)
    show_in_list = Column(Boolean, default=False)
    show_in_detail = Column(Boolean, default=True)
    
    # Layout configuration
    display_order = Column(Integer, default=0)
    field_group = Column(String(100))
    column_span = Column(Integer, default=1)
    
    # Business rules
    business_rules = Column(JSONB, default={})
    conditional_logic = Column(JSONB, default={})
    
    # Status
    is_active = Column(Boolean, default=True)
    
    # Audit trail
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_by = Column(UUID(as_uuid=True))
    
    # Relationships
    business_configuration = relationship("EnhancedBusinessConfiguration", back_populates="custom_fields")
    
    __table_args__ = (
        Index('idx_custom_field_definitions_config', 'business_configuration_id'),
        Index('idx_custom_field_definitions_entity', 'entity_type'),
        Index('idx_custom_field_definitions_key', 'field_key'),
        Index('idx_custom_field_definitions_active', 'is_active'),
    )

class UnitOfMeasure(Base):
    """Units of measure management for different business types"""
    __tablename__ = "units_of_measure"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_configuration_id = Column(UUID(as_uuid=True), ForeignKey("enhanced_business_configurations.id"))
    
    # Unit identification
    unit_code = Column(String(20), nullable=False)
    unit_name = Column(String(100), nullable=False)
    unit_name_persian = Column(String(100))
    unit_symbol = Column(String(10))
    
    # Unit classification
    unit_type = Column(String(50), nullable=False)  # weight, volume, length, area, count, time, etc.
    base_unit = Column(String(20))  # Base unit for conversion
    conversion_factor = Column(DECIMAL(20, 8), default=1)  # Factor to convert to base unit
    
    # Display configuration
    decimal_places = Column(Integer, default=2)
    display_format = Column(String(50))  # How to display the unit
    
    # Business type applicability
    applicable_business_types = Column(ARRAY(String), default=[])
    industry_standard = Column(Boolean, default=False)
    
    # Usage tracking
    usage_count = Column(Integer, default=0)
    last_used = Column(DateTime(timezone=True))
    
    # Status
    is_active = Column(Boolean, default=True)
    is_default = Column(Boolean, default=False)
    
    # Audit trail
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    business_configuration = relationship("EnhancedBusinessConfiguration")
    
    __table_args__ = (
        Index('idx_units_of_measure_config', 'business_configuration_id'),
        Index('idx_units_of_measure_code', 'unit_code'),
        Index('idx_units_of_measure_type', 'unit_type'),
        Index('idx_units_of_measure_active', 'is_active'),
    )

class PricingRule(Base):
    """Pricing rules and models for different business types"""
    __tablename__ = "pricing_rules"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_configuration_id = Column(UUID(as_uuid=True), ForeignKey("enhanced_business_configurations.id"), nullable=False)
    
    # Rule identification
    rule_name = Column(String(100), nullable=False)
    rule_type = Column(String(50), nullable=False)  # fixed, weight_based, time_based, formula, tiered, etc.
    
    # Applicability
    applies_to = Column(String(50), nullable=False)  # all, category, item, customer_type, etc.
    entity_ids = Column(ARRAY(UUID), default=[])  # Specific entities this rule applies to
    
    # Pricing configuration
    pricing_model = Column(JSONB, nullable=False, default={})
    formula = Column(Text)  # Custom pricing formula
    parameters = Column(JSONB, default={})
    
    # Conditions
    conditions = Column(JSONB, default={})
    date_range = Column(JSONB, default={})  # Valid date range
    quantity_breaks = Column(JSONB, default=[])  # Quantity-based pricing
    
    # Priority and execution
    priority = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    
    # Usage tracking
    usage_count = Column(Integer, default=0)
    last_used = Column(DateTime(timezone=True))
    
    # Audit trail
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_by = Column(UUID(as_uuid=True))
    
    # Relationships
    business_configuration = relationship("EnhancedBusinessConfiguration", back_populates="pricing_rules")
    
    __table_args__ = (
        Index('idx_pricing_rules_config', 'business_configuration_id'),
        Index('idx_pricing_rules_type', 'rule_type'),
        Index('idx_pricing_rules_applies_to', 'applies_to'),
        Index('idx_pricing_rules_active', 'is_active'),
        Index('idx_pricing_rules_priority', 'priority'),
    )

class ReportTemplate(Base):
    """Business-specific reporting templates"""
    __tablename__ = "report_templates"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_configuration_id = Column(UUID(as_uuid=True), ForeignKey("enhanced_business_configurations.id"))
    
    # Template identification
    template_name = Column(String(100), nullable=False)
    template_code = Column(String(50), nullable=False)
    category = Column(String(50), nullable=False)  # financial, operational, inventory, customer, etc.
    
    # Template configuration
    template_config = Column(JSONB, nullable=False, default={})
    data_sources = Column(JSONB, nullable=False, default=[])
    calculations = Column(JSONB, default={})
    filters = Column(JSONB, default={})
    
    # Display configuration
    layout = Column(JSONB, default={})
    styling = Column(JSONB, default={})
    export_formats = Column(ARRAY(String), default=['pdf', 'excel'])
    
    # Business type applicability
    applicable_business_types = Column(ARRAY(String), default=[])
    industry_standard = Column(Boolean, default=False)
    
    # KPIs and metrics
    kpi_definitions = Column(JSONB, default=[])
    metric_calculations = Column(JSONB, default={})
    
    # Usage tracking
    usage_count = Column(Integer, default=0)
    last_generated = Column(DateTime(timezone=True))
    
    # Status
    is_active = Column(Boolean, default=True)
    is_default = Column(Boolean, default=False)
    
    # Audit trail
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_by = Column(UUID(as_uuid=True))
    
    # Relationships
    business_configuration = relationship("EnhancedBusinessConfiguration")
    
    __table_args__ = (
        Index('idx_report_templates_config', 'business_configuration_id'),
        Index('idx_report_templates_code', 'template_code'),
        Index('idx_report_templates_category', 'category'),
        Index('idx_report_templates_active', 'is_active'),
    )

class BusinessMigrationLog(Base):
    """Log of business type migrations"""
    __tablename__ = "business_migration_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_configuration_id = Column(UUID(as_uuid=True), ForeignKey("enhanced_business_configurations.id"), nullable=False)
    
    # Migration details
    from_business_type = Column(String(50), nullable=False)
    to_business_type = Column(String(50), nullable=False)
    migration_reason = Column(Text)
    
    # Migration process
    migration_steps = Column(JSONB, nullable=False, default=[])
    data_mapping = Column(JSONB, default={})
    preserved_data = Column(JSONB, default={})
    
    # Status tracking
    status = Column(String(50), default='pending')  # pending, in_progress, completed, failed, rolled_back
    progress_percentage = Column(Integer, default=0)
    current_step = Column(String(100))
    
    # Results
    migrated_records = Column(JSONB, default={})
    errors = Column(JSONB, default=[])
    warnings = Column(JSONB, default=[])
    
    # Timing
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    duration_seconds = Column(Integer)
    
    # Rollback information
    rollback_data = Column(JSONB, default={})
    can_rollback = Column(Boolean, default=True)
    rollback_deadline = Column(DateTime(timezone=True))
    
    # Audit trail
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(UUID(as_uuid=True))
    
    # Relationships
    business_configuration = relationship("EnhancedBusinessConfiguration")
    
    __table_args__ = (
        Index('idx_business_migration_logs_config', 'business_configuration_id'),
        Index('idx_business_migration_logs_status', 'status'),
        Index('idx_business_migration_logs_date', 'started_at'),
    )

class FeatureConfiguration(Base):
    """Feature configuration and toggles per business type"""
    __tablename__ = "feature_configurations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_configuration_id = Column(UUID(as_uuid=True), ForeignKey("enhanced_business_configurations.id"))
    
    # Feature identification
    feature_code = Column(String(100), nullable=False)
    feature_name = Column(String(100), nullable=False)
    feature_category = Column(String(50), nullable=False)  # inventory, invoice, accounting, etc.
    
    # Feature configuration
    is_enabled = Column(Boolean, default=True)
    configuration = Column(JSONB, default={})
    permissions = Column(JSONB, default={})
    
    # Business type applicability
    applicable_business_types = Column(ARRAY(String), default=[])
    required_for_types = Column(ARRAY(String), default=[])
    
    # Dependencies
    depends_on_features = Column(ARRAY(String), default=[])
    conflicts_with_features = Column(ARRAY(String), default=[])
    
    # Usage tracking
    usage_count = Column(Integer, default=0)
    last_used = Column(DateTime(timezone=True))
    
    # Status
    is_active = Column(Boolean, default=True)
    
    # Audit trail
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    business_configuration = relationship("EnhancedBusinessConfiguration")
    
    __table_args__ = (
        Index('idx_feature_configurations_config', 'business_configuration_id'),
        Index('idx_feature_configurations_code', 'feature_code'),
        Index('idx_feature_configurations_category', 'feature_category'),
        Index('idx_feature_configurations_enabled', 'is_enabled'),
    )