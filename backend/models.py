from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text, DECIMAL, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
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
    permissions = Column(Text)  # JSON string for permissions
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    users = relationship("User", back_populates="role")

class Category(Base):
    __tablename__ = "categories"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"))
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    parent = relationship("Category", remote_side=[id])
    inventory_items = relationship("InventoryItem", back_populates="category")

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

class InvoiceItem(Base):
    __tablename__ = "invoice_items"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    invoice_id = Column(UUID(as_uuid=True), ForeignKey("invoices.id"))
    inventory_item_id = Column(UUID(as_uuid=True), ForeignKey("inventory_items.id"))
    quantity = Column(Integer, nullable=False)
    unit_price = Column(DECIMAL(12, 2), nullable=False)
    total_price = Column(DECIMAL(12, 2), nullable=False)
    weight_grams = Column(DECIMAL(10, 3), nullable=False)

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
    invoice_template = Column(Text)  # JSON string for template
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())