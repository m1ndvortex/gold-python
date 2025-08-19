from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text, DECIMAL, ForeignKey, Index
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
    address = Column(Text)
    total_purchases = Column(DECIMAL(12, 2), default=0)
    current_debt = Column(DECIMAL(12, 2), default=0)
    last_purchase_date = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    invoices = relationship("Invoice", back_populates="customer")
    payments = relationship("Payment", back_populates="customer")
    
    __table_args__ = (
        Index('idx_customers_debt', 'current_debt'),
        Index('idx_customers_phone', 'phone'),
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