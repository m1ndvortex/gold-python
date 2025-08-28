"""
Universal Inventory Management System Models
Enhanced models for the universal inventory and invoice management system
"""

from sqlalchemy import Column, String, Integer, Boolean, DateTime, Date, Text, DECIMAL, ForeignKey, Index, ARRAY
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.sql import func
from sqlalchemy.types import TypeDecorator, String as SQLString
import uuid

# Custom LTREE type for PostgreSQL
class LTREE(TypeDecorator):
    impl = SQLString
    cache_ok = True

Base = declarative_base()

class BusinessConfiguration(Base):
    __tablename__ = "business_configurations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_type = Column(String(50), nullable=False, default='gold_shop')
    business_name = Column(String(255), nullable=False)
    configuration = Column(JSONB, nullable=False, default={})
    terminology_mapping = Column(JSONB, default={})
    workflow_config = Column(JSONB, default={})
    feature_flags = Column(JSONB, default={})
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class UniversalCategory(Base):
    __tablename__ = "categories_new"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    name_persian = Column(String(255))
    parent_id = Column(UUID(as_uuid=True), ForeignKey("categories_new.id", ondelete="CASCADE"))
    path = Column(LTREE, nullable=False)
    level = Column(Integer, nullable=False, default=0)
    
    # Attribute schema for custom fields
    attribute_schema = Column(JSONB, default=[])
    
    # Visual and organizational
    description = Column(Text)
    icon = Column(String(50))
    color = Column(String(7), default='#3B82F6')
    sort_order = Column(Integer, default=0)
    
    # Image support
    image_id = Column(UUID(as_uuid=True))
    
    # Business type specific
    business_type = Column(String(50), default='universal')
    category_metadata = Column(JSONB, default={})
    
    # Status
    is_active = Column(Boolean, default=True)
    
    # Audit trail
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_by = Column(UUID(as_uuid=True))
    updated_by = Column(UUID(as_uuid=True))
    
    # Relationships
    parent = relationship("UniversalCategory", remote_side=[id], back_populates="children")
    children = relationship("UniversalCategory", back_populates="parent", cascade="all, delete-orphan")
    inventory_items = relationship("UniversalInventoryItem", back_populates="category")
    
    __table_args__ = (
        Index('idx_categories_new_path', 'path', postgresql_using='gist'),
        Index('idx_categories_new_parent', 'parent_id'),
        Index('idx_categories_new_level', 'level'),
        Index('idx_categories_new_business_type', 'business_type'),
        Index('idx_categories_new_active', 'is_active'),
    )

class UniversalInventoryItem(Base):
    __tablename__ = "inventory_items_new"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Identifiers
    sku = Column(String(100), unique=True, nullable=False)
    barcode = Column(String(100), unique=True)
    qr_code = Column(String(255), unique=True)
    
    # Basic information
    name = Column(String(255), nullable=False)
    name_persian = Column(String(255))
    description = Column(Text)
    description_persian = Column(Text)
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories_new.id"))
    
    # Pricing
    cost_price = Column(DECIMAL(15,2), nullable=False, default=0)
    sale_price = Column(DECIMAL(15,2), nullable=False, default=0)
    currency = Column(String(3), default='USD')
    
    # Inventory tracking
    stock_quantity = Column(DECIMAL(15,3), nullable=False, default=0)
    unit_of_measure = Column(String(50), nullable=False, default='piece')
    low_stock_threshold = Column(DECIMAL(15,3), default=0)
    reorder_point = Column(DECIMAL(15,3), default=0)
    max_stock_level = Column(DECIMAL(15,3))
    
    # Universal attributes and tags
    custom_attributes = Column(JSONB, default={})
    tags = Column(ARRAY(String), default=[])
    
    # Images
    primary_image_id = Column(UUID(as_uuid=True))
    image_ids = Column(ARRAY(UUID), default=[])
    
    # Business type specific fields
    business_type_fields = Column(JSONB, default={})
    
    # Gold shop compatibility (backward compatibility)
    weight_grams = Column(DECIMAL(10, 3))
    gold_specific = Column(JSONB)
    
    # Status and metadata
    is_active = Column(Boolean, default=True)
    item_metadata = Column(JSONB, default={})
    
    # Audit trail
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_by = Column(UUID(as_uuid=True))
    updated_by = Column(UUID(as_uuid=True))
    
    # Relationships
    category = relationship("UniversalCategory", back_populates="inventory_items")
    stock_movements = relationship("InventoryMovement", back_populates="inventory_item")
    
    __table_args__ = (
        Index('idx_inventory_items_new_sku', 'sku'),
        Index('idx_inventory_items_new_barcode', 'barcode'),
        Index('idx_inventory_items_new_qr_code', 'qr_code'),
        Index('idx_inventory_items_new_category', 'category_id'),
        Index('idx_inventory_items_new_active', 'is_active'),
        Index('idx_inventory_items_new_stock', 'stock_quantity'),
        Index('idx_inventory_items_new_tags', 'tags', postgresql_using='gin'),
        Index('idx_inventory_items_new_attributes', 'custom_attributes', postgresql_using='gin'),
        Index('idx_inventory_items_new_name_search', func.to_tsvector('english', 'name'), postgresql_using='gin'),
    )

class UniversalInvoice(Base):
    __tablename__ = "invoices_new"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    invoice_number = Column(String(100), unique=True, nullable=False)
    
    # Invoice type (Gold vs General)
    type = Column(String(20), nullable=False, default='general')
    status = Column(String(50), nullable=False, default='draft')
    
    # Customer information
    customer_id = Column(UUID(as_uuid=True))
    customer_name = Column(String(255))
    customer_phone = Column(String(50))
    customer_address = Column(Text)
    customer_email = Column(String(100))
    
    # Pricing
    subtotal = Column(DECIMAL(15,2), nullable=False, default=0)
    tax_amount = Column(DECIMAL(15,2), nullable=False, default=0)
    discount_amount = Column(DECIMAL(15,2), nullable=False, default=0)
    total_amount = Column(DECIMAL(15,2), nullable=False, default=0)
    currency = Column(String(3), default='USD')
    
    # Payment tracking
    paid_amount = Column(DECIMAL(15,2), default=0)
    remaining_amount = Column(DECIMAL(15,2), nullable=False, default=0)
    payment_status = Column(String(50), default='unpaid')
    payment_method = Column(String(100))
    payment_date = Column(DateTime(timezone=True))
    
    # Workflow management
    workflow_stage = Column(String(50), default='draft')
    stock_affected = Column(Boolean, default=False)
    requires_approval = Column(Boolean, default=False)
    approved_by = Column(UUID(as_uuid=True))
    approved_at = Column(DateTime(timezone=True))
    approval_notes = Column(Text)
    
    # Gold-specific fields (conditional)
    gold_price_per_gram = Column(DECIMAL(10, 2))
    labor_cost_percentage = Column(DECIMAL(5, 2))
    profit_percentage = Column(DECIMAL(5, 2))
    vat_percentage = Column(DECIMAL(5, 2))
    gold_sood = Column(DECIMAL(15,2))  # سود (profit)
    gold_ojrat = Column(DECIMAL(15,2))  # اجرت (wage/labor fee)
    gold_maliyat = Column(DECIMAL(15,2))  # مالیات (tax)
    gold_total_weight = Column(DECIMAL(10,3))
    
    # QR Card information
    qr_code = Column(String(255), unique=True)
    card_url = Column(String(500))
    card_theme = Column(String(50), default='glass')
    card_config = Column(JSONB, default={})
    
    # Additional metadata
    invoice_metadata = Column(JSONB, default={})
    notes = Column(Text)
    
    # Audit trail
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_by = Column(UUID(as_uuid=True))
    updated_by = Column(UUID(as_uuid=True))
    
    # Relationships
    invoice_items = relationship("UniversalInvoiceItem", back_populates="invoice", cascade="all, delete-orphan")
    qr_card = relationship("QRInvoiceCard", back_populates="invoice", uselist=False)
    
    __table_args__ = (
        Index('idx_invoices_new_type', 'type'),
        Index('idx_invoices_new_status', 'status'),
        Index('idx_invoices_new_customer', 'customer_id'),
        Index('idx_invoices_new_date', 'created_at'),
        Index('idx_invoices_new_workflow', 'workflow_stage'),
        Index('idx_invoices_new_payment_status', 'payment_status'),
        Index('idx_invoices_new_qr_code', 'qr_code'),
    )

class UniversalInvoiceItem(Base):
    __tablename__ = "invoice_items_new"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    invoice_id = Column(UUID(as_uuid=True), ForeignKey("invoices_new.id", ondelete="CASCADE"), nullable=False)
    inventory_item_id = Column(UUID(as_uuid=True))
    
    # Item snapshot (preserved at invoice time)
    item_name = Column(String(255), nullable=False)
    item_sku = Column(String(100))
    item_description = Column(Text)
    
    # Quantity and pricing
    quantity = Column(DECIMAL(15,3), nullable=False)
    unit_price = Column(DECIMAL(15,2), nullable=False)
    total_price = Column(DECIMAL(15,2), nullable=False)
    
    # Unit and weight information
    unit_of_measure = Column(String(50), default='piece')
    weight_grams = Column(DECIMAL(10, 3))
    
    # Images (snapshot at invoice time)
    item_images = Column(JSONB, default=[])
    
    # Gold-specific item fields
    gold_specific = Column(JSONB)
    
    # Custom attributes snapshot
    custom_attributes = Column(JSONB, default={})
    
    # Audit trail
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    invoice = relationship("UniversalInvoice", back_populates="invoice_items")
    
    __table_args__ = (
        Index('idx_invoice_items_new_invoice', 'invoice_id'),
        Index('idx_invoice_items_new_inventory_item', 'inventory_item_id'),
    )

class InventoryMovement(Base):
    __tablename__ = "inventory_movements"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    inventory_item_id = Column(UUID(as_uuid=True), ForeignKey("inventory_items_new.id"), nullable=False)
    
    # Movement details
    movement_type = Column(String(50), nullable=False)  # 'in', 'out', 'adjustment', 'transfer'
    quantity_change = Column(DECIMAL(15,3), nullable=False)
    quantity_before = Column(DECIMAL(15,3), nullable=False)
    quantity_after = Column(DECIMAL(15,3), nullable=False)
    
    # Unit information
    unit_of_measure = Column(String(50), nullable=False)
    unit_cost = Column(DECIMAL(15,2))
    total_cost = Column(DECIMAL(15,2))
    
    # Reference information
    reference_type = Column(String(50))  # 'invoice', 'purchase', 'adjustment', 'transfer'
    reference_id = Column(UUID(as_uuid=True))
    reference_number = Column(String(100))
    
    # Movement details
    reason = Column(String(255))
    notes = Column(Text)
    location_from = Column(String(100))
    location_to = Column(String(100))
    
    # Batch/lot tracking
    batch_number = Column(String(100))
    lot_number = Column(String(100))
    expiry_date = Column(Date)
    
    # Status
    status = Column(String(50), default='completed')  # pending, completed, cancelled
    
    # Audit trail
    movement_date = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(UUID(as_uuid=True))
    
    # Relationships
    inventory_item = relationship("UniversalInventoryItem", back_populates="stock_movements")
    
    __table_args__ = (
        Index('idx_inventory_movements_item', 'inventory_item_id'),
        Index('idx_inventory_movements_type', 'movement_type'),
        Index('idx_inventory_movements_date', 'movement_date'),
        Index('idx_inventory_movements_reference', 'reference_type', 'reference_id'),
        Index('idx_inventory_movements_status', 'status'),
    )

class QRInvoiceCard(Base):
    __tablename__ = "qr_invoice_cards"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    invoice_id = Column(UUID(as_uuid=True), ForeignKey("invoices_new.id", ondelete="CASCADE"), nullable=False)
    
    # QR Code information
    qr_code = Column(String(255), unique=True, nullable=False)
    card_url = Column(String(500), unique=True, nullable=False)
    short_url = Column(String(100), unique=True)
    
    # Card configuration
    theme = Column(String(50), default='glass')
    background_color = Column(String(7), default='#ffffff')
    text_color = Column(String(7), default='#000000')
    accent_color = Column(String(7), default='#3B82F6')
    
    # Card data (snapshot at creation)
    card_data = Column(JSONB, nullable=False)
    
    # Access control
    is_public = Column(Boolean, default=True)
    requires_password = Column(Boolean, default=False)
    access_password = Column(String(255))
    
    # Expiration
    expires_at = Column(DateTime(timezone=True))
    
    # Analytics
    view_count = Column(Integer, default=0)
    last_viewed_at = Column(DateTime(timezone=True))
    
    # Status
    is_active = Column(Boolean, default=True)
    
    # Audit trail
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_by = Column(UUID(as_uuid=True))
    
    # Relationships
    invoice = relationship("UniversalInvoice", back_populates="qr_card")
    access_logs = relationship("QRCardAccessLog", back_populates="card", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_qr_invoice_cards_invoice', 'invoice_id'),
        Index('idx_qr_invoice_cards_qr_code', 'qr_code'),
        Index('idx_qr_invoice_cards_url', 'card_url'),
        Index('idx_qr_invoice_cards_active', 'is_active'),
        Index('idx_qr_invoice_cards_expires', 'expires_at'),
    )

class QRCardAccessLog(Base):
    __tablename__ = "qr_card_access_log"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    card_id = Column(UUID(as_uuid=True), ForeignKey("qr_invoice_cards.id", ondelete="CASCADE"), nullable=False)
    
    # Access details
    ip_address = Column(String(45))  # IPv6 compatible
    user_agent = Column(Text)
    referer = Column(String(500))
    
    # Location (if available)
    country = Column(String(100))
    city = Column(String(100))
    
    # Device information
    device_type = Column(String(50))  # mobile, tablet, desktop
    browser = Column(String(100))
    os = Column(String(100))
    
    # Timestamp
    accessed_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    card = relationship("QRInvoiceCard", back_populates="access_logs")
    
    __table_args__ = (
        Index('idx_qr_card_access_log_card', 'card_id'),
        Index('idx_qr_card_access_log_accessed', 'accessed_at'),
        Index('idx_qr_card_access_log_ip', 'ip_address'),
    )

class Image(Base):
    __tablename__ = "images"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # File information
    filename = Column(String(255), nullable=False)
    original_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    mime_type = Column(String(100), nullable=False)
    file_size = Column(Integer, nullable=False)
    
    # Image dimensions
    width = Column(Integer)
    height = Column(Integer)
    
    # URLs
    url = Column(String(500), nullable=False)
    thumbnail_url = Column(String(500))
    medium_url = Column(String(500))
    
    # Context and usage
    context_type = Column(String(50), nullable=False)  # 'category', 'item', 'invoice', 'user', 'company'
    context_id = Column(UUID(as_uuid=True))
    
    # Image metadata
    alt_text = Column(String(255))
    caption = Column(Text)
    image_metadata = Column(JSONB, default={})
    
    # Processing status
    processing_status = Column(String(50), default='pending')  # pending, processing, completed, failed
    processing_error = Column(Text)
    
    # Storage information
    storage_provider = Column(String(50), default='local')  # local, s3, cloudinary, etc.
    storage_path = Column(String(500))
    storage_metadata = Column(JSONB, default={})
    
    # Status
    is_active = Column(Boolean, default=True)
    
    # Audit trail
    uploaded_by = Column(UUID(as_uuid=True))
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    variants = relationship("ImageVariant", back_populates="parent_image", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_images_context', 'context_type', 'context_id'),
        Index('idx_images_filename', 'filename'),
        Index('idx_images_uploaded_by', 'uploaded_by'),
        Index('idx_images_status', 'processing_status'),
        Index('idx_images_active', 'is_active'),
    )

class ImageVariant(Base):
    __tablename__ = "image_variants"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    parent_image_id = Column(UUID(as_uuid=True), ForeignKey("images.id", ondelete="CASCADE"), nullable=False)
    
    # Variant information
    variant_type = Column(String(50), nullable=False)  # 'thumbnail', 'small', 'medium', 'large'
    width = Column(Integer, nullable=False)
    height = Column(Integer, nullable=False)
    
    # File information
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=False)
    url = Column(String(500), nullable=False)
    
    # Processing
    processing_status = Column(String(50), default='pending')
    
    # Audit trail
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    parent_image = relationship("Image", back_populates="variants")
    
    __table_args__ = (
        Index('idx_image_variants_parent', 'parent_image_id'),
        Index('idx_image_variants_type', 'variant_type'),
    )