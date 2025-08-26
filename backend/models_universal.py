"""
Universal Business Platform Models
Enhanced models for universal business support while maintaining gold shop compatibility
"""

from sqlalchemy import Column, String, Integer, Boolean, DateTime, Date, Text, DECIMAL, ForeignKey, Index, ARRAY
from sqlalchemy.dialects.postgresql import UUID, JSONB, INET
try:
    from sqlalchemy.dialects.postgresql import LTREE
except ImportError:
    # Fallback for databases that don't support LTREE
    LTREE = String
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.sql import func
import uuid

# Import Base from database_base to ensure single metadata instance
from database_base import Base

# Business Configuration Models
class BusinessConfiguration(Base):
    __tablename__ = "business_configurations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_type = Column(String(50), nullable=False)  # gold_shop, retail, restaurant, service, etc.
    business_name = Column(String(200), nullable=False)
    industry = Column(String(100), nullable=True)
    configuration = Column(JSONB, nullable=False)  # Business-specific settings
    terminology_mapping = Column(JSONB, nullable=True)  # UI terminology customization
    workflow_settings = Column(JSONB, nullable=True)  # Workflow configurations
    feature_flags = Column(JSONB, nullable=True)  # Enabled/disabled features
    custom_fields_schema = Column(JSONB, nullable=True)  # Custom field definitions
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    __table_args__ = (
        Index('idx_business_configurations_type', 'business_type'),
        Index('idx_business_configurations_active', 'is_active'),
    )

class WorkflowDefinition(Base):
    __tablename__ = "workflow_definitions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    entity_type = Column(String(50), nullable=False)  # invoice, purchase_order, etc.
    business_type = Column(String(50), nullable=True)
    workflow_config = Column(JSONB, nullable=False)  # Workflow stages and rules
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    __table_args__ = (
        Index('idx_workflow_definitions_entity', 'entity_type'),
        Index('idx_workflow_definitions_business_type', 'business_type'),
        Index('idx_workflow_definitions_active', 'is_active'),
    )

# Enhanced User and Role Models (OAuth2 compatible)
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
    oauth2_tokens = relationship("OAuth2Token", back_populates="user")
    audit_logs = relationship("OAuth2AuditLog", back_populates="user")

class Role(Base):
    __tablename__ = "roles"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(Text)
    permissions = Column(JSONB)  # JSON for permissions
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    users = relationship("User", back_populates="role")

# OAuth2 Token Management
class OAuth2Token(Base):
    __tablename__ = "oauth2_tokens"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    access_token_hash = Column(String(255), nullable=False)
    refresh_token_hash = Column(String(255), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    refresh_expires_at = Column(DateTime(timezone=True), nullable=False)
    scopes = Column(JSONB, nullable=False, default=[])
    revoked = Column(Boolean, default=False)
    revoked_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="oauth2_tokens")
    
    __table_args__ = (
        Index('idx_oauth2_tokens_user', 'user_id'),
        Index('idx_oauth2_tokens_access_hash', 'access_token_hash'),
        Index('idx_oauth2_tokens_refresh_hash', 'refresh_token_hash'),
        Index('idx_oauth2_tokens_expires', 'expires_at'),
        Index('idx_oauth2_tokens_revoked', 'revoked'),
    )

class OAuth2AuditLog(Base):
    __tablename__ = "oauth2_audit_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    event_type = Column(String(50), nullable=False)
    event_category = Column(String(50), nullable=False)  # token, security, authentication
    details = Column(JSONB, default={})
    ip_address = Column(String(45))  # IPv6 compatible
    user_agent = Column(Text)
    severity = Column(String(20), default="info")  # info, warning, high, critical
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="audit_logs")
    
    __table_args__ = (
        Index('idx_oauth2_audit_user', 'user_id'),
        Index('idx_oauth2_audit_event_type', 'event_type'),
        Index('idx_oauth2_audit_category', 'event_category'),
        Index('idx_oauth2_audit_timestamp', 'timestamp'),
        Index('idx_oauth2_audit_severity', 'severity'),
        Index('idx_oauth2_audit_ip', 'ip_address'),
    )

# Enhanced Category Model with Hierarchical Structure
class Category(Base):
    __tablename__ = "categories"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"))
    path = Column(LTREE)  # Hierarchical path using LTREE
    level = Column(Integer, default=0)
    description = Column(Text)
    icon = Column(String(50))  # Icon name for UI
    color = Column(String(7))  # Hex color code
    attributes = Column(JSONB)  # Custom attributes definition
    attribute_schema = Column(JSONB)  # Schema for custom attributes
    business_type = Column(String(50))  # Business type this category belongs to
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
        Index('idx_categories_path', 'path'),
        Index('idx_categories_level', 'level'),
        Index('idx_categories_business_type', 'business_type'),
        Index('idx_categories_active', 'is_active'),
        Index('idx_categories_sort', 'sort_order'),
    )

# Enhanced Inventory Model with Universal Support
class InventoryItem(Base):
    __tablename__ = "inventory_items"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # Universal identifiers
    sku = Column(String(100), unique=True, nullable=True)
    barcode = Column(String(100), nullable=True)
    qr_code = Column(String(255), nullable=True)
    
    # Basic information
    name = Column(String(200), nullable=False)
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"))
    description = Column(Text)
    
    # Pricing (universal)
    cost_price = Column(DECIMAL(15, 2), nullable=True)
    sale_price = Column(DECIMAL(15, 2), nullable=True)
    currency = Column(String(3), default='USD')
    
    # Inventory tracking
    stock_quantity = Column(DECIMAL(15, 3), nullable=False, default=0)
    min_stock_level = Column(Integer, default=5)
    unit_of_measure = Column(String(50), nullable=True)
    conversion_factors = Column(JSONB)  # For multi-unit support
    
    # Universal attributes
    attributes = Column(JSONB)  # Custom attributes (Material, Size, Brand, etc.)
    tags = Column(ARRAY(String))  # Tags for categorization and search
    
    # Business type specific fields
    business_type_fields = Column(JSONB)  # Business-specific data
    
    # Gold shop compatibility (legacy fields)
    weight_grams = Column(DECIMAL(10, 3), nullable=True)  # For gold shop compatibility
    purchase_price = Column(DECIMAL(12, 2), nullable=True)  # Legacy field
    sell_price = Column(DECIMAL(12, 2), nullable=True)  # Legacy field
    gold_specific = Column(JSONB)  # Gold-specific attributes (purity, etc.)
    
    # Metadata
    image_url = Column(String(500))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    category = relationship("Category", back_populates="inventory_items")
    invoice_items = relationship("InvoiceItem", back_populates="inventory_item")
    inventory_movements = relationship("InventoryMovement", back_populates="inventory_item", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_inventory_items_sku', 'sku', unique=True),
        Index('idx_inventory_items_barcode', 'barcode'),
        Index('idx_inventory_items_category', 'category_id'),
        Index('idx_inventory_items_active', 'is_active'),
        Index('idx_inventory_items_stock', 'stock_quantity'),
        Index('idx_inventory_items_tags', 'tags', postgresql_using='gin'),
        Index('idx_inventory_items_attributes', 'attributes', postgresql_using='gin'),
    )

# Inventory Movement Tracking
class InventoryMovement(Base):
    __tablename__ = "inventory_movements"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    inventory_item_id = Column(UUID(as_uuid=True), ForeignKey("inventory_items.id"), nullable=False)
    movement_type = Column(String(50), nullable=False)  # in, out, adjustment, transfer
    quantity = Column(DECIMAL(15, 3), nullable=False)
    unit_cost = Column(DECIMAL(15, 2), nullable=True)
    total_cost = Column(DECIMAL(15, 2), nullable=True)
    reference_type = Column(String(50), nullable=True)  # invoice, purchase, adjustment
    reference_id = Column(UUID(as_uuid=True), nullable=True)
    notes = Column(Text, nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    inventory_item = relationship("InventoryItem", back_populates="inventory_movements")
    creator = relationship("User")
    
    __table_args__ = (
        Index('idx_inventory_movements_item', 'inventory_item_id'),
        Index('idx_inventory_movements_type', 'movement_type'),
        Index('idx_inventory_movements_reference', 'reference_type', 'reference_id'),
        Index('idx_inventory_movements_date', 'created_at'),
    )

# Enhanced Customer Model
class Customer(Base):
    __tablename__ = "customers"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(200), nullable=False)
    phone = Column(String(20))
    email = Column(String(100))
    
    # Address fields
    address = Column(Text)  # Legacy field for backward compatibility
    street_address = Column(String(255))
    city = Column(String(100))
    state = Column(String(100))
    postal_code = Column(String(20))
    country = Column(String(100), default='United States')
    
    # Personal information
    national_id = Column(String(50), unique=True)
    date_of_birth = Column(Date)
    age = Column(Integer)
    gender = Column(String(20))
    nationality = Column(String(100))
    occupation = Column(String(100))
    
    # Emergency contact
    emergency_contact_name = Column(String(200))
    emergency_contact_phone = Column(String(20))
    emergency_contact_relationship = Column(String(50))
    
    # Additional information
    notes = Column(Text)
    tags = Column(JSONB)
    custom_fields = Column(JSONB)
    preferences = Column(JSONB)
    
    # Business-related fields
    customer_type = Column(String(50), default='retail')
    credit_limit = Column(DECIMAL(12, 2), default=0)
    payment_terms = Column(Integer, default=0)
    discount_percentage = Column(DECIMAL(5, 2), default=0)
    tax_exempt = Column(Boolean, default=False)
    tax_id = Column(String(50))
    
    # Financial tracking
    total_purchases = Column(DECIMAL(12, 2), default=0)
    current_debt = Column(DECIMAL(12, 2), default=0)
    last_purchase_date = Column(DateTime(timezone=True))
    
    # Status
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

# Enhanced Invoice Model with Workflow Support
class Invoice(Base):
    __tablename__ = "invoices"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    invoice_number = Column(String(50), unique=True, nullable=False)
    invoice_type = Column(String(50), default='standard')  # standard, gold, service, etc.
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id"))
    
    # Workflow management
    workflow_stage = Column(String(50), default='draft')  # draft, pending_approval, approved, paid, cancelled
    approval_required = Column(Boolean, default=False)
    approved_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    approved_at = Column(DateTime(timezone=True))
    
    # Financial information
    subtotal = Column(DECIMAL(15, 2))
    tax_amount = Column(DECIMAL(15, 2))
    discount_amount = Column(DECIMAL(15, 2))
    total_amount = Column(DECIMAL(12, 2), nullable=False)
    paid_amount = Column(DECIMAL(12, 2), default=0)
    remaining_amount = Column(DECIMAL(12, 2), nullable=False)
    currency = Column(String(3), default='USD')
    
    # Payment terms
    payment_terms = Column(Integer, default=0)  # Days
    due_date = Column(DateTime(timezone=True))
    
    # Business type specific fields
    business_type_fields = Column(JSONB)
    
    # Gold shop compatibility (legacy fields)
    gold_price_per_gram = Column(DECIMAL(10, 2))
    labor_cost_percentage = Column(DECIMAL(5, 2), default=0)
    profit_percentage = Column(DECIMAL(5, 2), default=0)
    vat_percentage = Column(DECIMAL(5, 2), default=0)
    gold_specific = Column(JSONB)  # Gold-specific data (سود, اجرت)
    
    # Status and metadata
    status = Column(String(20), default='pending')
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    customer = relationship("Customer", back_populates="invoices")
    approver = relationship("User")
    invoice_items = relationship("InvoiceItem", back_populates="invoice")
    payments = relationship("Payment", back_populates="invoice")
    
    __table_args__ = (
        Index('idx_invoices_customer', 'customer_id'),
        Index('idx_invoices_date', 'created_at'),
        Index('idx_invoices_status', 'status'),
        Index('idx_invoices_workflow_stage', 'workflow_stage'),
        Index('idx_invoices_type', 'invoice_type'),
        Index('idx_invoices_approved_by', 'approved_by'),
        Index('idx_invoices_due_date', 'due_date'),
    )

class InvoiceItem(Base):
    __tablename__ = "invoice_items"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    invoice_id = Column(UUID(as_uuid=True), ForeignKey("invoices.id"))
    inventory_item_id = Column(UUID(as_uuid=True), ForeignKey("inventory_items.id"))
    quantity = Column(DECIMAL(15, 3), nullable=False)
    unit_price = Column(DECIMAL(12, 2), nullable=False)
    total_price = Column(DECIMAL(12, 2), nullable=False)
    
    # Gold shop compatibility
    weight_grams = Column(DECIMAL(10, 3))
    
    invoice = relationship("Invoice", back_populates="invoice_items")
    inventory_item = relationship("InventoryItem", back_populates="invoice_items")

# Double-Entry Accounting System

# Chart of Accounts
class ChartOfAccounts(Base):
    __tablename__ = "chart_of_accounts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    account_code = Column(String(20), nullable=False, unique=True)
    account_name = Column(String(200), nullable=False)
    account_type = Column(String(50), nullable=False)  # asset, liability, equity, revenue, expense
    account_subtype = Column(String(50))  # current_asset, fixed_asset, etc.
    parent_account_id = Column(UUID(as_uuid=True), ForeignKey("chart_of_accounts.id"))
    path = Column(LTREE)  # Hierarchical path
    level = Column(Integer, default=0)
    normal_balance = Column(String(10), nullable=False)  # debit or credit
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    is_system_account = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    parent_account = relationship("ChartOfAccounts", remote_side=[id], back_populates="child_accounts")
    child_accounts = relationship("ChartOfAccounts", back_populates="parent_account")
    journal_entry_lines = relationship("JournalEntryLine", back_populates="account")
    payment_methods = relationship("PaymentMethod", back_populates="account")
    
    __table_args__ = (
        Index('idx_chart_of_accounts_code', 'account_code'),
        Index('idx_chart_of_accounts_type', 'account_type'),
        Index('idx_chart_of_accounts_path', 'path', postgresql_using='gist'),
        Index('idx_chart_of_accounts_active', 'is_active'),
    )

# Accounting Periods
class AccountingPeriod(Base):
    __tablename__ = "accounting_periods"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    period_name = Column(String(100), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    is_closed = Column(Boolean, default=False)
    closed_at = Column(DateTime(timezone=True))
    closed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    closer = relationship("User")
    journal_entries = relationship("JournalEntry", back_populates="period")
    
    __table_args__ = (
        Index('idx_accounting_periods_dates', 'start_date', 'end_date'),
        Index('idx_accounting_periods_closed', 'is_closed'),
    )

# Journal Entries
class JournalEntry(Base):
    __tablename__ = "journal_entries"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entry_number = Column(String(50), nullable=False, unique=True)
    entry_date = Column(Date, nullable=False)
    reference = Column(String(100))
    description = Column(Text, nullable=False)
    total_debit = Column(DECIMAL(15, 2), nullable=False)
    total_credit = Column(DECIMAL(15, 2), nullable=False)
    balanced = Column(Boolean, default=False)
    source = Column(String(50))  # invoice, payment, adjustment, manual
    source_id = Column(UUID(as_uuid=True))
    period_id = Column(UUID(as_uuid=True), ForeignKey("accounting_periods.id"))
    is_posted = Column(Boolean, default=False)
    posted_at = Column(DateTime(timezone=True))
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    period = relationship("AccountingPeriod", back_populates="journal_entries")
    creator = relationship("User")
    journal_entry_lines = relationship("JournalEntryLine", back_populates="journal_entry")
    
    __table_args__ = (
        Index('idx_journal_entries_date', 'entry_date'),
        Index('idx_journal_entries_source', 'source', 'source_id'),
        Index('idx_journal_entries_posted', 'is_posted'),
        Index('idx_journal_entries_period', 'period_id'),
    )

# Journal Entry Lines
class JournalEntryLine(Base):
    __tablename__ = "journal_entry_lines"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    journal_entry_id = Column(UUID(as_uuid=True), ForeignKey("journal_entries.id", ondelete="CASCADE"), nullable=False)
    account_id = Column(UUID(as_uuid=True), ForeignKey("chart_of_accounts.id"), nullable=False)
    debit_amount = Column(DECIMAL(15, 2), default=0)
    credit_amount = Column(DECIMAL(15, 2), default=0)
    description = Column(Text)
    reference = Column(String(100))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    journal_entry = relationship("JournalEntry", back_populates="journal_entry_lines")
    account = relationship("ChartOfAccounts", back_populates="journal_entry_lines")
    
    __table_args__ = (
        Index('idx_journal_entry_lines_entry', 'journal_entry_id'),
        Index('idx_journal_entry_lines_account', 'account_id'),
    )

# Payment Methods
class PaymentMethod(Base):
    __tablename__ = "payment_methods"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    type = Column(String(50), nullable=False)  # cash, bank_transfer, card, check, digital
    account_id = Column(UUID(as_uuid=True), ForeignKey("chart_of_accounts.id"))
    configuration = Column(JSONB)  # Method-specific configuration
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    account = relationship("ChartOfAccounts", back_populates="payment_methods")
    payments = relationship("Payment", back_populates="payment_method_rel")
    
    __table_args__ = (
        Index('idx_payment_methods_type', 'type'),
        Index('idx_payment_methods_active', 'is_active'),
    )

# Enhanced Payment Model
class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id"), nullable=False)
    invoice_id = Column(UUID(as_uuid=True), ForeignKey("invoices.id"))
    payment_method_id = Column(UUID(as_uuid=True), ForeignKey("payment_methods.id"))
    
    # Payment details
    amount = Column(DECIMAL(12, 2), nullable=False)
    currency = Column(String(3), default='USD')
    exchange_rate = Column(DECIMAL(10, 6), default=1.0)
    fees = Column(DECIMAL(15, 2), default=0)
    net_amount = Column(DECIMAL(15, 2))
    
    # Payment method (legacy)
    payment_method = Column(String(20), default='cash')  # For backward compatibility
    
    # Reference and status
    reference_number = Column(String(100))
    status = Column(String(50), default='completed')
    description = Column(Text)
    payment_date = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    customer = relationship("Customer", back_populates="payments")
    invoice = relationship("Invoice", back_populates="payments")
    payment_method_rel = relationship("PaymentMethod", back_populates="payments")
    
    __table_args__ = (
        Index('idx_payments_customer', 'customer_id'),
        Index('idx_payments_date', 'payment_date'),
        Index('idx_payments_invoice', 'invoice_id'),
        Index('idx_payments_method', 'payment_method_id'),
        Index('idx_payments_status', 'status'),
        Index('idx_payments_reference', 'reference_number'),
    )

# Comprehensive Audit Logging
class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    action = Column(String(100), nullable=False)
    resource_type = Column(String(100), nullable=False)
    resource_id = Column(UUID(as_uuid=True))
    old_values = Column(JSONB)
    new_values = Column(JSONB)
    ip_address = Column(INET)
    user_agent = Column(Text)
    session_id = Column(String(255))
    request_id = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User")
    
    __table_args__ = (
        Index('idx_audit_logs_user', 'user_id'),
        Index('idx_audit_logs_resource', 'resource_type', 'resource_id'),
        Index('idx_audit_logs_action', 'action'),
        Index('idx_audit_logs_timestamp', 'created_at'),
    )

# Legacy Models for Backward Compatibility
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