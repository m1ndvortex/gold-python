from sqlalchemy import Column, String, Integer, Boolean, DateTime, Date, Text, DECIMAL, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.sql import func
import uuid

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role_id = Column(UUID(as_uuid=True), ForeignKey("roles.id"))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    role = relationship("Role", back_populates="users")

class Role(Base):
    __tablename__ = "roles"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(Text)
    permissions = Column(JSONB)  # JSON for permissions
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    users = relationship("User", back_populates="role")

class Category(Base):
    __tablename__ = "categories"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"))
    description = Column(Text)
    icon = Column(String(50))  # Icon name for UI
    color = Column(String(7))  # Hex color code
    attributes = Column(JSONB)  # Custom attributes definition
    category_metadata = Column(JSONB)  # Additional metadata
    sort_order = Column(Integer, default=0)  # For drag-and-drop ordering
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    parent = relationship("Category", remote_side=[id], back_populates="children")
    children = relationship("Category", back_populates="parent")
    inventory_items = relationship("InventoryItem", back_populates="category")
    
    __table_args__ = (
        Index('idx_categories_parent', 'parent_id'),
        Index('idx_categories_active', 'is_active'),
        Index('idx_categories_sort', 'sort_order'),
    )

class CategoryTemplate(Base):
    __tablename__ = "category_templates"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    template_data = Column(JSONB, nullable=False)  # Template structure with attributes
    is_active = Column(Boolean, default=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    creator = relationship("User")

class InventoryItem(Base):
    __tablename__ = "inventory_items"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(200), nullable=False)
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"))
    weight_grams = Column(DECIMAL(10, 3), nullable=False)
    purchase_price = Column(DECIMAL(12, 2), nullable=False)
    sell_price = Column(DECIMAL(12, 2), nullable=False)
    stock_quantity = Column(Integer, nullable=False, default=0)
    min_stock_level = Column(Integer, default=5)
    description = Column(Text)
    image_url = Column(String(500))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    category = relationship("Category", back_populates="inventory_items")
    invoice_items = relationship("InvoiceItem", back_populates="inventory_item")
    
    __table_args__ = (
        Index('idx_inventory_items_category', 'category_id'),
        Index('idx_inventory_items_active', 'is_active'),
        Index('idx_inventory_items_stock', 'stock_quantity'),
    )

class Customer(Base):
    __tablename__ = "customers"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(200), nullable=False)
    phone = Column(String(20))
    email = Column(String(100))
    
    # Old address field (deprecated - kept for backward compatibility)
    address = Column(Text)  # Will be removed in future migration
    
    # Comprehensive address fields
    street_address = Column(String(255))
    city = Column(String(100))
    state = Column(String(100))
    postal_code = Column(String(20))
    country = Column(String(100), default='United States')
    
    # Personal information
    national_id = Column(String(50), unique=True)  # SSN, National ID, etc.
    date_of_birth = Column(Date)
    age = Column(Integer)  # Calculated field, can be updated periodically
    gender = Column(String(20))  # male, female, other, prefer_not_to_say
    nationality = Column(String(100))
    occupation = Column(String(100))
    
    # Emergency contact information
    emergency_contact_name = Column(String(200))
    emergency_contact_phone = Column(String(20))
    emergency_contact_relationship = Column(String(50))
    
    # Additional information
    notes = Column(Text)  # General notes about the customer
    tags = Column(JSONB)  # Tags for categorization ["VIP", "Wholesale", etc.]
    custom_fields = Column(JSONB)  # Flexible custom fields {"field_name": "value"}
    preferences = Column(JSONB)  # Customer preferences {"contact_method": "phone", etc.}
    
    # Business-related fields
    customer_type = Column(String(50), default='retail')  # retail, wholesale, corporate
    credit_limit = Column(DECIMAL(12, 2), default=0)
    payment_terms = Column(Integer, default=0)  # Days for payment (0 = immediate)
    discount_percentage = Column(DECIMAL(5, 2), default=0)  # Default discount for this customer
    tax_exempt = Column(Boolean, default=False)
    tax_id = Column(String(50))  # Tax identification number for businesses
    
    # Existing fields
    total_purchases = Column(DECIMAL(12, 2), default=0)
    current_debt = Column(DECIMAL(12, 2), default=0)
    last_purchase_date = Column(DateTime(timezone=True))
    
    # Status and metadata
    is_active = Column(Boolean, default=True)
    blacklisted = Column(Boolean, default=False)
    blacklist_reason = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    invoices = relationship("Invoice", back_populates="customer")
    payments = relationship("Payment", back_populates="customer")
    
    __table_args__ = (
        Index('idx_customers_debt', 'current_debt'),
        Index('idx_customers_phone', 'phone'),
        Index('idx_customers_email', 'email'),
        Index('idx_customers_national_id', 'national_id'),
        Index('idx_customers_type', 'customer_type'),
        Index('idx_customers_active', 'is_active'),
        Index('idx_customers_city', 'city'),
        Index('idx_customers_dob', 'date_of_birth'),
    )

class Invoice(Base):
    __tablename__ = "invoices"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    invoice_number = Column(String(50), unique=True, nullable=False)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id"))
    total_amount = Column(DECIMAL(12, 2), nullable=False)
    paid_amount = Column(DECIMAL(12, 2), default=0)
    remaining_amount = Column(DECIMAL(12, 2), nullable=False)
    gold_price_per_gram = Column(DECIMAL(10, 2), nullable=False)
    labor_cost_percentage = Column(DECIMAL(5, 2), default=0)
    profit_percentage = Column(DECIMAL(5, 2), default=0)
    vat_percentage = Column(DECIMAL(5, 2), default=0)
    status = Column(String(20), default='pending')
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    customer = relationship("Customer", back_populates="invoices")
    invoice_items = relationship("InvoiceItem", back_populates="invoice")
    payments = relationship("Payment", back_populates="invoice")
    
    __table_args__ = (
        Index('idx_invoices_customer', 'customer_id'),
        Index('idx_invoices_date', 'created_at'),
        Index('idx_invoices_status', 'status'),
    )

class InvoiceItem(Base):
    __tablename__ = "invoice_items"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    invoice_id = Column(UUID(as_uuid=True), ForeignKey("invoices.id"))
    inventory_item_id = Column(UUID(as_uuid=True), ForeignKey("inventory_items.id"))
    quantity = Column(Integer, nullable=False)
    unit_price = Column(DECIMAL(12, 2), nullable=False)
    total_price = Column(DECIMAL(12, 2), nullable=False)
    weight_grams = Column(DECIMAL(10, 3), nullable=False)
    
    invoice = relationship("Invoice", back_populates="invoice_items")
    inventory_item = relationship("InventoryItem", back_populates="invoice_items")

class AccountingEntry(Base):
    __tablename__ = "accounting_entries"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entry_type = Column(String(20), nullable=False)  # 'income', 'expense', 'cash', 'bank', 'gold_weight'
    category = Column(String(50), nullable=False)
    amount = Column(DECIMAL(12, 2))
    weight_grams = Column(DECIMAL(10, 3))
    description = Column(Text, nullable=False)
    reference_id = Column(UUID(as_uuid=True))  # Links to invoice, customer, etc.
    reference_type = Column(String(50))
    transaction_date = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        Index('idx_accounting_entries_type_date', 'entry_type', 'transaction_date'),
        Index('idx_accounting_entries_reference', 'reference_id', 'reference_type'),
    )

class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id"), nullable=False)
    invoice_id = Column(UUID(as_uuid=True), ForeignKey("invoices.id"))  # Optional, can be general payment
    amount = Column(DECIMAL(12, 2), nullable=False)
    payment_method = Column(String(20), default='cash')  # 'cash', 'bank', 'card'
    description = Column(Text)
    payment_date = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    customer = relationship("Customer", back_populates="payments")
    invoice = relationship("Invoice", back_populates="payments")
    
    __table_args__ = (
        Index('idx_payments_customer', 'customer_id'),
        Index('idx_payments_date', 'payment_date'),
        Index('idx_payments_invoice', 'invoice_id'),
    )

class CompanySettings(Base):
    __tablename__ = "company_settings"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_name = Column(String(200))
    company_logo_url = Column(String(500))
    company_address = Column(Text)
    default_gold_price = Column(DECIMAL(10, 2))
    default_labor_percentage = Column(DECIMAL(5, 2))
    default_profit_percentage = Column(DECIMAL(5, 2))
    default_vat_percentage = Column(DECIMAL(5, 2))
    invoice_template = Column(JSONB)  # JSON for template
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class SMSTemplate(Base):
    __tablename__ = "sms_templates"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    template_type = Column(String(20), nullable=False)  # 'promotional', 'debt_reminder'
    message_template = Column(Text, nullable=False)  # Template with placeholders like {customer_name}, {debt_amount}
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    sms_campaigns = relationship("SMSCampaign", back_populates="template")

class SMSCampaign(Base):
    __tablename__ = "sms_campaigns"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(200), nullable=False)
    template_id = Column(UUID(as_uuid=True), ForeignKey("sms_templates.id"))
    message_content = Column(Text, nullable=False)  # Final message after template processing
    total_recipients = Column(Integer, default=0)
    sent_count = Column(Integer, default=0)
    failed_count = Column(Integer, default=0)
    status = Column(String(20), default='pending')  # 'pending', 'sending', 'completed', 'failed'
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    template = relationship("SMSTemplate", back_populates="sms_campaigns")
    creator = relationship("User")
    sms_messages = relationship("SMSMessage", back_populates="campaign")
    
    __table_args__ = (
        Index('idx_sms_campaigns_status', 'status'),
        Index('idx_sms_campaigns_created_by', 'created_by'),
    )

class SMSMessage(Base):
    __tablename__ = "sms_messages"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    campaign_id = Column(UUID(as_uuid=True), ForeignKey("sms_campaigns.id"))
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id"))
    phone_number = Column(String(20), nullable=False)
    message_content = Column(Text, nullable=False)
    status = Column(String(20), default='pending')  # 'pending', 'sent', 'failed', 'delivered'
    delivery_status = Column(String(20))  # 'delivered', 'failed', 'unknown'
    gateway_message_id = Column(String(100))  # SMS gateway's message ID
    error_message = Column(Text)
    retry_count = Column(Integer, default=0)
    max_retries = Column(Integer, default=3)
    sent_at = Column(DateTime(timezone=True))
    delivered_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    campaign = relationship("SMSCampaign", back_populates="sms_messages")
    customer = relationship("Customer")
    
    __table_args__ = (
        Index('idx_sms_messages_campaign', 'campaign_id'),
        Index('idx_sms_messages_customer', 'customer_id'),
        Index('idx_sms_messages_status', 'status'),
        Index('idx_sms_messages_phone', 'phone_number'),
    )

# Analytics and KPI Models
class AnalyticsData(Base):
    __tablename__ = "analytics_data"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    data_type = Column(String(50), nullable=False)  # 'sales_trend', 'inventory_turnover', 'customer_behavior'
    entity_type = Column(String(50))  # 'product', 'category', 'customer', 'global'
    entity_id = Column(UUID(as_uuid=True))
    metric_name = Column(String(100), nullable=False)
    metric_value = Column(DECIMAL(15, 4), nullable=False)
    additional_data = Column(JSONB)
    calculation_date = Column(DateTime(timezone=True), nullable=False)
    calculated_at = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        Index('idx_analytics_data_type_date', 'data_type', 'calculation_date'),
        Index('idx_analytics_data_entity', 'entity_type', 'entity_id'),
        Index('idx_analytics_data_metric', 'metric_name', 'calculation_date'),
    )

class KPITarget(Base):
    __tablename__ = "kpi_targets"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    kpi_type = Column(String(50), nullable=False)  # 'financial', 'operational', 'customer'
    kpi_name = Column(String(100), nullable=False)  # 'daily_sales', 'inventory_turnover', 'customer_acquisition'
    target_period = Column(String(20), nullable=False)  # 'daily', 'weekly', 'monthly', 'yearly'
    target_value = Column(DECIMAL(15, 2), nullable=False)
    current_value = Column(DECIMAL(15, 2), default=0)
    achievement_rate = Column(DECIMAL(5, 2), default=0)  # Percentage
    trend_direction = Column(String(10))  # 'up', 'down', 'stable'
    period_start = Column(DateTime(timezone=True), nullable=False)
    period_end = Column(DateTime(timezone=True), nullable=False)
    is_active = Column(Boolean, default=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    creator = relationship("User")
    
    __table_args__ = (
        Index('idx_kpi_targets_type_period', 'kpi_type', 'target_period'),
        Index('idx_kpi_targets_active', 'is_active', 'period_start', 'period_end'),
    )

# Profitability Analysis Models
class ProfitabilityAnalysis(Base):
    __tablename__ = "profitability_analysis"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_type = Column(String(50), nullable=False)  # 'item', 'category', 'customer', 'global'
    entity_id = Column(UUID(as_uuid=True))
    analysis_period_start = Column(DateTime(timezone=True), nullable=False)
    analysis_period_end = Column(DateTime(timezone=True), nullable=False)
    total_revenue = Column(DECIMAL(15, 2), nullable=False, default=0)
    total_cost = Column(DECIMAL(15, 2), nullable=False, default=0)
    gross_profit = Column(DECIMAL(15, 2), nullable=False, default=0)
    profit_margin = Column(DECIMAL(5, 2), nullable=False, default=0)
    markup_percentage = Column(DECIMAL(5, 2), nullable=False, default=0)
    units_sold = Column(Integer, default=0)
    average_selling_price = Column(DECIMAL(12, 2), default=0)
    average_cost_price = Column(DECIMAL(12, 2), default=0)
    profit_per_unit = Column(DECIMAL(12, 2), default=0)
    additional_metrics = Column(JSONB)
    calculated_at = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        Index('idx_profitability_analysis_entity', 'entity_type', 'entity_id'),
        Index('idx_profitability_analysis_period', 'analysis_period_start', 'analysis_period_end'),
        Index('idx_profitability_analysis_margin', 'profit_margin'),
    )

class MarginAnalysis(Base):
    __tablename__ = "margin_analysis"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_type = Column(String(50), nullable=False)  # 'item', 'category', 'global'
    entity_id = Column(UUID(as_uuid=True))
    analysis_date = Column(DateTime(timezone=True).with_variant(DateTime(), "postgresql"), nullable=False)
    target_margin = Column(DECIMAL(5, 2), default=0)
    actual_margin = Column(DECIMAL(5, 2), default=0)
    margin_variance = Column(DECIMAL(5, 2), default=0)
    revenue_impact = Column(DECIMAL(12, 2), default=0)
    cost_factors = Column(JSONB)  # Breakdown of cost components
    margin_trend = Column(String(20), default='stable')  # 'increasing', 'decreasing', 'stable'
    recommendations = Column(JSONB)  # Margin improvement recommendations
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        Index('idx_margin_analysis_entity_date', 'entity_type', 'entity_id', 'analysis_date'),
        Index('idx_margin_analysis_variance', 'margin_variance'),
    )

# Customer Intelligence Models
class CustomerSegment(Base):
    __tablename__ = "customer_segments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    segment_name = Column(String(100), nullable=False, unique=True)
    segment_description = Column(Text)
    segment_criteria = Column(JSONB, nullable=False)
    segment_color = Column(String(7), default='#3B82F6')
    is_active = Column(Boolean, default=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    creator = relationship("User")
    segment_assignments = relationship("CustomerSegmentAssignment", back_populates="segment")
    
    __table_args__ = (
        Index('idx_customer_segments_active', 'is_active'),
    )

class CustomerSegmentAssignment(Base):
    __tablename__ = "customer_segment_assignments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    segment_id = Column(UUID(as_uuid=True), ForeignKey("customer_segments.id", ondelete="CASCADE"), nullable=False)
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())
    assignment_score = Column(DECIMAL(5, 2))  # How well customer fits segment (0-100)
    is_primary = Column(Boolean, default=False)  # Is this the customer's primary segment
    
    customer = relationship("Customer")
    segment = relationship("CustomerSegment", back_populates="segment_assignments")
    
    __table_args__ = (
        Index('idx_customer_segment_assignments_customer', 'customer_id'),
        Index('idx_customer_segment_assignments_segment', 'segment_id'),
        # Unique constraint on customer_id and segment_id combination
    )

class CustomerBehaviorAnalysis(Base):
    __tablename__ = "customer_behavior_analysis"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    analysis_period_start = Column(DateTime(timezone=True), nullable=False)
    analysis_period_end = Column(DateTime(timezone=True), nullable=False)
    purchase_frequency = Column(DECIMAL(5, 2), default=0)  # Purchases per month
    average_order_value = Column(DECIMAL(12, 2), default=0)
    total_spent = Column(DECIMAL(15, 2), default=0)
    customer_lifetime_value = Column(DECIMAL(15, 2), default=0)
    last_purchase_date = Column(DateTime(timezone=True))
    days_since_last_purchase = Column(Integer)
    preferred_categories = Column(JSONB)  # Top 3 categories by spending
    preferred_payment_method = Column(String(50))
    risk_score = Column(DECIMAL(3, 2), default=0)  # Credit risk (0-1)
    loyalty_score = Column(DECIMAL(3, 2), default=0)  # Loyalty score (0-1)
    engagement_score = Column(DECIMAL(3, 2), default=0)  # Engagement score (0-1)
    churn_probability = Column(DECIMAL(3, 2), default=0)  # Probability of churn (0-1)
    predicted_next_purchase = Column(DateTime(timezone=True).with_variant(DateTime(), "postgresql"))
    seasonal_patterns = Column(JSONB)
    calculated_at = Column(DateTime(timezone=True), server_default=func.now())
    
    customer = relationship("Customer")
    
    __table_args__ = (
        Index('idx_customer_behavior_customer', 'customer_id'),
        Index('idx_customer_behavior_period', 'analysis_period_start', 'analysis_period_end'),
        Index('idx_customer_behavior_ltv', 'customer_lifetime_value'),
        Index('idx_customer_behavior_churn', 'churn_probability'),
    )

# Report Scheduling Models
class ScheduledReport(Base):
    __tablename__ = "scheduled_reports"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    report_config = Column(JSONB, nullable=False)  # Report configuration
    schedule_config = Column(JSONB, nullable=False)  # Schedule configuration
    recipients = Column(JSONB, nullable=False)  # List of email addresses
    export_formats = Column(JSONB, default=['pdf'])  # List of export formats
    is_active = Column(Boolean, default=True)
    
    # Execution tracking
    next_run_at = Column(DateTime(timezone=True))
    last_run_at = Column(DateTime(timezone=True))
    last_success_at = Column(DateTime(timezone=True))
    run_count = Column(Integer, default=0)
    error_count = Column(Integer, default=0)
    last_error = Column(Text)
    
    # Metadata
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    creator = relationship("User")
    
    __table_args__ = (
        Index('idx_scheduled_reports_active', 'is_active'),
        Index('idx_scheduled_reports_next_run', 'next_run_at'),
        Index('idx_scheduled_reports_created_by', 'created_by'),
    )

class CustomReport(Base):
    __tablename__ = "custom_reports"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    report_config = Column(JSONB, nullable=False)  # Report configuration
    is_template = Column(Boolean, default=False)  # Is this a reusable template
    is_public = Column(Boolean, default=False)  # Can other users see this report
    
    # Usage tracking
    last_generated_at = Column(DateTime(timezone=True))
    generation_count = Column(Integer, default=0)
    
    # Metadata
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    creator = relationship("User")
    
    __table_args__ = (
        Index('idx_custom_reports_template', 'is_template'),
        Index('idx_custom_reports_public', 'is_public'),
        Index('idx_custom_reports_created_by', 'created_by'),
    )

# Inventory Intelligence Models
class InventoryTurnoverAnalysis(Base):
    __tablename__ = "inventory_turnover_analysis"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    item_id = Column(UUID(as_uuid=True), ForeignKey("inventory_items.id", ondelete="CASCADE"), nullable=False)
    analysis_period_start = Column(DateTime(timezone=True), nullable=False)
    analysis_period_end = Column(DateTime(timezone=True), nullable=False)
    units_sold = Column(Integer, default=0)
    average_stock = Column(DECIMAL(10, 2), default=0)
    turnover_ratio = Column(DECIMAL(8, 4), default=0)
    velocity_score = Column(DECIMAL(3, 2), default=0)  # 0-1 scale
    movement_classification = Column(String(20), default='unknown')  # fast, normal, slow, dead
    days_to_stockout = Column(Integer)
    seasonal_factor = Column(DECIMAL(4, 2), default=1.0)
    trend_direction = Column(String(15), default='stable')  # increasing, decreasing, stable
    last_sale_date = Column(DateTime(timezone=True))
    calculated_at = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    item = relationship("InventoryItem")

    __table_args__ = (
        Index('idx_inventory_turnover_item_period', 'item_id', 'analysis_period_start', 'analysis_period_end'),
        Index('idx_inventory_turnover_classification', 'movement_classification'),
        Index('idx_inventory_turnover_velocity', 'velocity_score'),
    )

class StockOptimizationRecommendation(Base):
    __tablename__ = "stock_optimization_recommendations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    item_id = Column(UUID(as_uuid=True), ForeignKey("inventory_items.id", ondelete="CASCADE"), nullable=False)
    recommendation_type = Column(String(30), nullable=False)  # reorder, reduce, increase, discontinue
    current_stock = Column(Integer, nullable=False)
    recommended_stock = Column(Integer)
    reorder_point = Column(Integer)
    reorder_quantity = Column(Integer)
    safety_stock = Column(Integer)
    max_stock_level = Column(Integer)
    economic_order_quantity = Column(Integer)
    lead_time_days = Column(Integer, default=7)
    holding_cost_per_unit = Column(DECIMAL(10, 4), default=0)
    ordering_cost = Column(DECIMAL(10, 2), default=0)
    stockout_cost = Column(DECIMAL(10, 2), default=0)
    confidence_score = Column(DECIMAL(3, 2), default=0)  # 0-1 scale
    reasoning = Column(Text)
    priority_level = Column(String(10), default='medium')  # high, medium, low
    estimated_savings = Column(DECIMAL(12, 2), default=0)
    implementation_date = Column(Date)
    status = Column(String(20), default='pending')  # pending, approved, implemented, rejected
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True))

    # Relationships
    item = relationship("InventoryItem")

    __table_args__ = (
        Index('idx_stock_optimization_item', 'item_id'),
        Index('idx_stock_optimization_type', 'recommendation_type'),
        Index('idx_stock_optimization_priority', 'priority_level'),
        Index('idx_stock_optimization_status', 'status'),
    )

class DemandForecasting(Base):
    __tablename__ = "demand_forecasting"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    item_id = Column(UUID(as_uuid=True), ForeignKey("inventory_items.id", ondelete="CASCADE"), nullable=False)
    forecast_period_start = Column(Date, nullable=False)
    forecast_period_end = Column(Date, nullable=False)
    forecast_type = Column(String(20), nullable=False)  # daily, weekly, monthly, seasonal
    historical_data = Column(JSONB)  # Historical sales data used for forecast
    predicted_demand = Column(DECIMAL(10, 2), nullable=False)
    confidence_interval_lower = Column(DECIMAL(10, 2))
    confidence_interval_upper = Column(DECIMAL(10, 2))
    forecast_accuracy = Column(DECIMAL(5, 2))  # Accuracy of previous forecasts
    seasonal_patterns = Column(JSONB)  # Seasonal adjustment factors
    trend_component = Column(DECIMAL(8, 4), default=0)
    forecast_method = Column(String(30))  # moving_average, exponential_smoothing, linear_regression
    external_factors = Column(JSONB)  # Events, promotions that might affect demand
    generated_at = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    item = relationship("InventoryItem")

    __table_args__ = (
        Index('idx_demand_forecasting_item_period', 'item_id', 'forecast_period_start', 'forecast_period_end'),
        Index('idx_demand_forecasting_type', 'forecast_type'),
    )

class SeasonalAnalysis(Base):
    __tablename__ = "seasonal_analysis"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    item_id = Column(UUID(as_uuid=True), ForeignKey("inventory_items.id", ondelete="CASCADE"))
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id", ondelete="SET NULL"))
    analysis_type = Column(String(20), nullable=False)  # item, category, global
    season = Column(String(20), nullable=False)  # spring, summer, fall, winter, holiday, ramadan
    year = Column(Integer, nullable=False)
    baseline_demand = Column(DECIMAL(10, 2), default=0)
    seasonal_factor = Column(DECIMAL(6, 4), default=1.0)
    peak_period_start = Column(Date)
    peak_period_end = Column(Date)
    demand_variance = Column(DECIMAL(8, 4), default=0)
    confidence_level = Column(DECIMAL(3, 2), default=0)  # 0-1 scale
    recommendations = Column(JSONB)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    item = relationship("InventoryItem")
    category = relationship("Category")

    __table_args__ = (
        Index('idx_seasonal_analysis_item_season', 'item_id', 'season', 'year'),
        Index('idx_seasonal_analysis_category_season', 'category_id', 'season', 'year'),
    )

# Advanced Analytics Models for Business Intelligence

class KPISnapshot(Base):
    """Time-series KPI tracking table"""
    __tablename__ = "kpi_snapshots"
    __table_args__ = {'schema': 'analytics'}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    kpi_type = Column(String(50), nullable=False)  # 'financial', 'operational', 'customer'
    kpi_name = Column(String(100), nullable=False)  # 'daily_revenue', 'inventory_turnover'
    value = Column(DECIMAL(15, 4), nullable=False)
    target_value = Column(DECIMAL(15, 4))
    achievement_rate = Column(DECIMAL(5, 2))  # Percentage
    trend_direction = Column(String(10))  # 'up', 'down', 'stable'
    variance_percentage = Column(DECIMAL(8, 4))
    period_start = Column(DateTime(timezone=True), nullable=False)
    period_end = Column(DateTime(timezone=True), nullable=False)
    kpi_metadata = Column(JSONB)  # Additional KPI-specific data
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class DemandForecast(Base):
    """Demand forecasting table"""
    __tablename__ = "demand_forecasts"
    __table_args__ = {'schema': 'analytics'}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    item_id = Column(UUID(as_uuid=True), ForeignKey("inventory_items.id", ondelete="CASCADE"), nullable=False)
    forecast_date = Column(Date, nullable=False)
    forecast_period = Column(String(20), nullable=False)  # 'daily', 'weekly', 'monthly'
    predicted_demand = Column(DECIMAL(10, 2), nullable=False)
    confidence_interval_lower = Column(DECIMAL(10, 2))
    confidence_interval_upper = Column(DECIMAL(10, 2))
    confidence_score = Column(DECIMAL(5, 4))  # 0-1 scale
    model_used = Column(String(50), nullable=False)  # 'arima', 'linear_regression'
    accuracy_score = Column(DECIMAL(5, 4))  # Historical accuracy
    seasonal_factor = Column(DECIMAL(6, 4), default=1.0)
    trend_component = Column(DECIMAL(8, 4), default=0)
    historical_data = Column(JSONB)  # Historical sales data used
    external_factors = Column(JSONB)  # Events, promotions affecting demand
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    item = relationship("InventoryItem")

# Duplicate CustomReport removed - using the one defined earlier

class AnalyticsCache(Base):
    """Analytics cache table for performance optimization"""
    __tablename__ = "analytics_cache"
    __table_args__ = {'schema': 'analytics'}

    cache_key = Column(String(255), primary_key=True)
    data = Column(JSONB, nullable=False)
    ttl = Column(Integer, nullable=False)  # Time to live in seconds
    expires_at = Column(DateTime(timezone=True), nullable=False)
    cache_type = Column(String(50), nullable=False)  # 'kpi', 'report', 'forecast'
    entity_type = Column(String(50))  # 'global', 'customer', 'item', 'category'
    entity_id = Column(UUID(as_uuid=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class StockOptimizationRecommendation(Base):
    """Stock optimization recommendations table"""
    __tablename__ = "stock_optimization_recommendations"
    __table_args__ = {'schema': 'analytics'}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    item_id = Column(UUID(as_uuid=True), ForeignKey("inventory_items.id", ondelete="CASCADE"), nullable=False)
    recommendation_type = Column(String(30), nullable=False)  # 'reorder', 'reduce', 'increase'
    current_stock = Column(Integer, nullable=False)
    recommended_stock = Column(Integer)
    reorder_point = Column(Integer)
    reorder_quantity = Column(Integer)
    safety_stock = Column(Integer)
    max_stock_level = Column(Integer)
    economic_order_quantity = Column(Integer)
    lead_time_days = Column(Integer, default=7)
    holding_cost_per_unit = Column(DECIMAL(10, 4), default=0)
    ordering_cost = Column(DECIMAL(10, 2), default=0)
    stockout_cost = Column(DECIMAL(10, 2), default=0)
    confidence_score = Column(DECIMAL(3, 2), default=0)  # 0-1 scale
    reasoning = Column(Text)
    priority_level = Column(String(10), default='medium')  # 'high', 'medium', 'low'
    estimated_savings = Column(DECIMAL(12, 2), default=0)
    implementation_date = Column(Date)
    status = Column(String(20), default='pending')  # 'pending', 'approved', 'implemented'
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True))

    # Relationships
    item = relationship("InventoryItem")

class CostAnalysis(Base):
    """Cost analysis table for optimization insights"""
    __tablename__ = "cost_analysis"
    __table_args__ = {'schema': 'analytics'}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_type = Column(String(50), nullable=False)  # 'item', 'category', 'global'
    entity_id = Column(UUID(as_uuid=True))
    analysis_date = Column(Date, nullable=False)
    carrying_cost = Column(DECIMAL(12, 2), default=0)
    ordering_cost = Column(DECIMAL(12, 2), default=0)
    stockout_cost = Column(DECIMAL(12, 2), default=0)
    total_cost = Column(DECIMAL(12, 2), default=0)
    cost_per_unit = Column(DECIMAL(10, 4), default=0)
    cost_breakdown = Column(JSONB)  # Detailed cost components
    optimization_potential = Column(DECIMAL(12, 2), default=0)
    recommendations = Column(JSONB)  # Cost reduction recommendations
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class CategoryPerformance(Base):
    """Category performance analysis table"""
    __tablename__ = "category_performance"
    __table_args__ = {'schema': 'analytics'}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id", ondelete="CASCADE"), nullable=False)
    analysis_date = Column(Date, nullable=False)
    revenue = Column(DECIMAL(15, 2), default=0)
    units_sold = Column(Integer, default=0)
    profit_margin = Column(DECIMAL(5, 2), default=0)
    inventory_turnover = Column(DECIMAL(8, 4), default=0)
    velocity_score = Column(DECIMAL(3, 2), default=0)  # 0-1 scale
    movement_classification = Column(String(20), default='normal')  # 'fast', 'normal', 'slow'
    seasonal_factor = Column(DECIMAL(6, 4), default=1.0)
    cross_selling_score = Column(DECIMAL(3, 2), default=0)  # 0-1 scale
    performance_trend = Column(String(15), default='stable')  # 'improving', 'declining'
    recommendations = Column(JSONB)  # Performance improvement suggestions
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    category = relationship("Category")

class PerformanceMetric(Base):
    """System performance metrics table"""
    __tablename__ = "performance_metrics"
    __table_args__ = {'schema': 'analytics'}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    metric_type = Column(String(50), nullable=False)  # 'response_time', 'memory_usage'
    metric_name = Column(String(100), nullable=False)
    value = Column(DECIMAL(15, 4), nullable=False)
    unit = Column(String(20))  # 'ms', 'mb', 'percent', 'count'
    threshold_value = Column(DECIMAL(15, 4))
    status = Column(String(20), default='normal')  # 'normal', 'warning', 'critical'
    service_name = Column(String(50))  # 'backend', 'database', 'redis'
    endpoint = Column(String(200))  # For API performance metrics
    additional_data = Column(JSONB)
    recorded_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class BackupLog(Base):
    """Backup operations log table"""
    __tablename__ = "backup_logs"
    __table_args__ = {'schema': 'analytics'}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    backup_type = Column(String(30), nullable=False)  # 'database', 'files', 'full'
    backup_status = Column(String(20), nullable=False)  # 'started', 'completed', 'failed'
    backup_size_bytes = Column(Integer)
    backup_location = Column(String(500))
    encryption_used = Column(Boolean, default=False)
    compression_used = Column(Boolean, default=False)
    verification_status = Column(String(20))  # 'pending', 'passed', 'failed'
    error_message = Column(Text)
    started_at = Column(DateTime(timezone=True), nullable=False)
    completed_at = Column(DateTime(timezone=True))
    retention_until = Column(Date)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class AlertRule(Base):
    """Alert rules configuration table"""
    __tablename__ = "alert_rules"
    __table_args__ = {'schema': 'analytics'}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rule_name = Column(String(100), nullable=False)
    rule_type = Column(String(50), nullable=False)  # 'kpi_threshold', 'performance'
    conditions = Column(JSONB, nullable=False)  # Alert conditions and thresholds
    severity = Column(String(20), default='medium')  # 'low', 'medium', 'high', 'critical'
    notification_channels = Column(JSONB)  # Email, SMS, webhook configurations
    is_active = Column(Boolean, default=True)
    cooldown_minutes = Column(Integer, default=60)  # Minimum time between alerts
    escalation_rules = Column(JSONB)  # Escalation configuration
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    last_triggered = Column(DateTime(timezone=True))
    trigger_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    creator = relationship("User")

class AlertHistory(Base):
    """Alert history table"""
    __tablename__ = "alert_history"
    __table_args__ = {'schema': 'analytics'}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rule_id = Column(UUID(as_uuid=True), ForeignKey("analytics.alert_rules.id", ondelete="CASCADE"), nullable=False)
    alert_level = Column(String(20), nullable=False)
    message = Column(Text, nullable=False)
    triggered_value = Column(DECIMAL(15, 4))
    threshold_value = Column(DECIMAL(15, 4))
    entity_type = Column(String(50))
    entity_id = Column(UUID(as_uuid=True))
    notification_sent = Column(Boolean, default=False)
    acknowledged = Column(Boolean, default=False)
    acknowledged_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    acknowledged_at = Column(DateTime(timezone=True))
    resolved = Column(Boolean, default=False)
    resolved_at = Column(DateTime(timezone=True))
    additional_data = Column(JSONB)
    triggered_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    rule = relationship("AlertRule")
    acknowledger = relationship("User")

class ImageManagement(Base):
    """Enhanced image management table"""
    __tablename__ = "image_management"
    __table_args__ = {'schema': 'analytics'}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_type = Column(String(50), nullable=False)  # 'product', 'category', 'company'
    entity_id = Column(UUID(as_uuid=True), nullable=False)
    original_filename = Column(String(255), nullable=False)
    stored_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size_bytes = Column(Integer, nullable=False)
    mime_type = Column(String(100), nullable=False)
    image_width = Column(Integer)
    image_height = Column(Integer)
    thumbnails = Column(JSONB)  # Generated thumbnail information
    is_primary = Column(Boolean, default=False)
    alt_text = Column(String(255))
    caption = Column(Text)
    sort_order = Column(Integer, default=0)
    optimization_applied = Column(Boolean, default=False)
    compression_ratio = Column(DECIMAL(5, 4))
    upload_metadata = Column(JSONB)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        Index('idx_image_management_entity', 'entity_type', 'entity_id'),
        Index('idx_image_management_primary', 'is_primary'),
        Index('idx_image_management_sort', 'sort_order'),
        {'schema': 'analytics'}
    )

class InventoryPerformanceMetrics(Base):
    __tablename__ = "inventory_performance_metrics"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    metric_date = Column(Date, nullable=False)
    total_inventory_value = Column(DECIMAL(15, 2), default=0)
    total_items_count = Column(Integer, default=0)
    fast_moving_items_count = Column(Integer, default=0)
    slow_moving_items_count = Column(Integer, default=0)
    dead_stock_items_count = Column(Integer, default=0)
    average_turnover_ratio = Column(DECIMAL(8, 4), default=0)
    inventory_to_sales_ratio = Column(DECIMAL(6, 4), default=0)
    carrying_cost_percentage = Column(DECIMAL(5, 2), default=0)
    stockout_incidents = Column(Integer, default=0)
    overstock_incidents = Column(Integer, default=0)
    optimization_score = Column(DECIMAL(3, 2), default=0)  # 0-1 scale
    total_holding_cost = Column(DECIMAL(12, 2), default=0)
    total_ordering_cost = Column(DECIMAL(12, 2), default=0)
    total_stockout_cost = Column(DECIMAL(12, 2), default=0)
    efficiency_rating = Column(String(15), default='average')  # excellent, good, average, poor
    calculated_at = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index('idx_inventory_performance_date', 'metric_date'),
        Index('idx_inventory_performance_score', 'optimization_score'),
    )

# Additional models for background tasks
class ForecastModel(Base):
    __tablename__ = "forecast_models"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    item_id = Column(UUID(as_uuid=True), ForeignKey("inventory_items.id"), nullable=False)
    model_type = Column(String(50), nullable=False)  # 'arima', 'linear_regression', 'seasonal_decompose'
    confidence_score = Column(DECIMAL(5, 4), nullable=False)
    accuracy_metrics = Column(JSONB)
    training_date = Column(Date, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    item = relationship("InventoryItem")
    
    __table_args__ = (
        Index('idx_forecast_models_item', 'item_id'),
        Index('idx_forecast_models_active', 'is_active'),
        Index('idx_forecast_models_confidence', 'confidence_score'),
    )

class ReportExecution(Base):
    __tablename__ = "report_executions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    report_id = Column(UUID(as_uuid=True), ForeignKey("custom_reports.id"), nullable=False)
    execution_type = Column(String(20), nullable=False)  # 'manual', 'scheduled'
    status = Column(String(20), nullable=False)  # 'pending', 'running', 'completed', 'failed'
    export_format = Column(String(20))  # 'pdf', 'excel', 'csv'
    file_path = Column(String(500))
    file_size = Column(Integer, default=0)
    generation_time_seconds = Column(Integer, default=0)
    error_message = Column(Text)
    parameters = Column(JSONB)
    task_metadata = Column(JSONB)  # Renamed from metadata to avoid conflict
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True))
    
    report = relationship("CustomReport")
    
    __table_args__ = (
        Index('idx_report_executions_report', 'report_id'),
        Index('idx_report_executions_status', 'status'),
        Index('idx_report_executions_type', 'execution_type'),
        Index('idx_report_executions_created', 'created_at'),
    )