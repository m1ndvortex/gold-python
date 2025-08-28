"""
Universal Inventory Management System Schemas
Enhanced Pydantic schemas for the universal inventory and invoice management system
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any, Union
from datetime import datetime, date
from uuid import UUID
from decimal import Decimal

# Business Configuration Schemas
class BusinessConfigurationBase(BaseModel):
    business_type: str = Field(default='gold_shop', description="Type of business")
    business_name: str = Field(..., description="Name of the business")
    configuration: Dict[str, Any] = Field(default_factory=dict, description="Business configuration")
    terminology_mapping: Dict[str, str] = Field(default_factory=dict, description="Custom terminology mapping")
    workflow_config: Dict[str, Any] = Field(default_factory=dict, description="Workflow configuration")
    feature_flags: Dict[str, bool] = Field(default_factory=dict, description="Feature flags")

class BusinessConfigurationCreate(BusinessConfigurationBase):
    pass

class BusinessConfigurationUpdate(BaseModel):
    business_type: Optional[str] = None
    business_name: Optional[str] = None
    configuration: Optional[Dict[str, Any]] = None
    terminology_mapping: Optional[Dict[str, str]] = None
    workflow_config: Optional[Dict[str, Any]] = None
    feature_flags: Optional[Dict[str, bool]] = None

class BusinessConfiguration(BusinessConfigurationBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Universal Category Schemas
class AttributeDefinition(BaseModel):
    id: str = Field(..., description="Unique identifier for the attribute")
    name: str = Field(..., description="Display name of the attribute")
    type: str = Field(..., description="Data type: text, number, date, enum, boolean")
    required: bool = Field(default=False, description="Whether this attribute is required")
    searchable: bool = Field(default=True, description="Whether this attribute is searchable")
    filterable: bool = Field(default=True, description="Whether this attribute can be used for filtering")
    options: Optional[List[str]] = Field(None, description="Options for enum type attributes")
    validation: Optional[Dict[str, Any]] = Field(None, description="Validation rules")
    default_value: Optional[Any] = Field(None, description="Default value")
    display_order: int = Field(default=0, description="Display order in forms")
    
    @validator('type')
    def validate_type(cls, v):
        allowed_types = ['text', 'number', 'date', 'enum', 'boolean']
        if v not in allowed_types:
            raise ValueError(f'Type must be one of: {", ".join(allowed_types)}')
        return v

class UniversalCategoryBase(BaseModel):
    name: str = Field(..., description="Category name")
    name_persian: Optional[str] = Field(None, description="Persian name")
    parent_id: Optional[UUID] = Field(None, description="Parent category ID")
    description: Optional[str] = Field(None, description="Category description")
    icon: Optional[str] = Field(None, description="Icon name")
    color: str = Field(default='#3B82F6', description="Category color")
    sort_order: int = Field(default=0, description="Sort order")
    attribute_schema: List[AttributeDefinition] = Field(default_factory=list, description="Custom attribute definitions")
    image_id: Optional[UUID] = Field(None, description="Category image ID")
    business_type: str = Field(default='universal', description="Business type")
    category_metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")

class UniversalCategoryCreate(UniversalCategoryBase):
    pass

class UniversalCategoryUpdate(BaseModel):
    name: Optional[str] = None
    name_persian: Optional[str] = None
    parent_id: Optional[UUID] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    sort_order: Optional[int] = None
    attribute_schema: Optional[List[AttributeDefinition]] = None
    image_id: Optional[UUID] = None
    business_type: Optional[str] = None
    category_metadata: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None

class UniversalCategory(UniversalCategoryBase):
    id: UUID
    path: str
    level: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    created_by: Optional[UUID] = None
    updated_by: Optional[UUID] = None
    
    class Config:
        from_attributes = True

class UniversalCategoryWithChildren(UniversalCategory):
    children: List['UniversalCategoryWithChildren'] = Field(default_factory=list)
    parent: Optional['UniversalCategory'] = None

class UniversalCategoryWithStats(UniversalCategory):
    children: List['UniversalCategoryWithStats'] = Field(default_factory=list)
    item_count: int = Field(default=0, description="Number of items in this category")
    total_value: Decimal = Field(default=0, description="Total value of items in this category")

# Universal Inventory Item Schemas
class CustomAttribute(BaseModel):
    name: str = Field(..., description="Attribute name")
    value: Any = Field(..., description="Attribute value")
    type: str = Field(..., description="Attribute type")

class UniversalInventoryItemBase(BaseModel):
    sku: str = Field(..., description="Stock Keeping Unit")
    barcode: Optional[str] = Field(None, description="Barcode")
    qr_code: Optional[str] = Field(None, description="QR Code")
    name: str = Field(..., description="Item name")
    name_persian: Optional[str] = Field(None, description="Persian name")
    description: Optional[str] = Field(None, description="Item description")
    description_persian: Optional[str] = Field(None, description="Persian description")
    category_id: Optional[UUID] = Field(None, description="Category ID")
    
    # Pricing
    cost_price: Decimal = Field(default=0, description="Cost price")
    sale_price: Decimal = Field(default=0, description="Sale price")
    currency: str = Field(default='USD', description="Currency code")
    
    # Inventory tracking
    stock_quantity: Decimal = Field(default=0, description="Current stock quantity")
    unit_of_measure: str = Field(default='piece', description="Unit of measure")
    low_stock_threshold: Decimal = Field(default=0, description="Low stock threshold")
    reorder_point: Decimal = Field(default=0, description="Reorder point")
    max_stock_level: Optional[Decimal] = Field(None, description="Maximum stock level")
    
    # Universal attributes and tags
    custom_attributes: Dict[str, Any] = Field(default_factory=dict, description="Custom attributes")
    tags: List[str] = Field(default_factory=list, description="Tags")
    
    # Images
    primary_image_id: Optional[UUID] = Field(None, description="Primary image ID")
    image_ids: List[UUID] = Field(default_factory=list, description="Additional image IDs")
    
    # Business type specific fields
    business_type_fields: Dict[str, Any] = Field(default_factory=dict, description="Business-specific fields")
    
    # Gold shop compatibility
    weight_grams: Optional[Decimal] = Field(None, description="Weight in grams (for gold items)")
    gold_specific: Optional[Dict[str, Any]] = Field(None, description="Gold-specific data")
    
    # Metadata
    item_metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")

class UniversalInventoryItemCreate(UniversalInventoryItemBase):
    pass

class UniversalInventoryItemUpdate(BaseModel):
    sku: Optional[str] = None
    barcode: Optional[str] = None
    qr_code: Optional[str] = None
    name: Optional[str] = None
    name_persian: Optional[str] = None
    description: Optional[str] = None
    description_persian: Optional[str] = None
    category_id: Optional[UUID] = None
    cost_price: Optional[Decimal] = None
    sale_price: Optional[Decimal] = None
    currency: Optional[str] = None
    stock_quantity: Optional[Decimal] = None
    unit_of_measure: Optional[str] = None
    low_stock_threshold: Optional[Decimal] = None
    reorder_point: Optional[Decimal] = None
    max_stock_level: Optional[Decimal] = None
    custom_attributes: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None
    primary_image_id: Optional[UUID] = None
    image_ids: Optional[List[UUID]] = None
    business_type_fields: Optional[Dict[str, Any]] = None
    weight_grams: Optional[Decimal] = None
    gold_specific: Optional[Dict[str, Any]] = None
    item_metadata: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None

class UniversalInventoryItem(UniversalInventoryItemBase):
    id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime
    created_by: Optional[UUID] = None
    updated_by: Optional[UUID] = None
    
    class Config:
        from_attributes = True

class UniversalInventoryItemWithCategory(UniversalInventoryItem):
    category: Optional[UniversalCategory] = None

class UniversalInventoryItemWithImages(UniversalInventoryItem):
    category: Optional[UniversalCategory] = None
    primary_image: Optional['Image'] = None
    images: List['Image'] = Field(default_factory=list)

# Inventory Movement Schemas
class InventoryMovementBase(BaseModel):
    inventory_item_id: UUID = Field(..., description="Inventory item ID")
    movement_type: str = Field(..., description="Movement type: in, out, adjustment, transfer")
    quantity_change: Decimal = Field(..., description="Quantity change (positive or negative)")
    unit_of_measure: str = Field(..., description="Unit of measure")
    unit_cost: Optional[Decimal] = Field(None, description="Unit cost")
    reference_type: Optional[str] = Field(None, description="Reference type")
    reference_id: Optional[UUID] = Field(None, description="Reference ID")
    reference_number: Optional[str] = Field(None, description="Reference number")
    reason: Optional[str] = Field(None, description="Reason for movement")
    notes: Optional[str] = Field(None, description="Additional notes")
    location_from: Optional[str] = Field(None, description="Source location")
    location_to: Optional[str] = Field(None, description="Destination location")
    batch_number: Optional[str] = Field(None, description="Batch number")
    lot_number: Optional[str] = Field(None, description="Lot number")
    expiry_date: Optional[date] = Field(None, description="Expiry date")
    
    @validator('movement_type')
    def validate_movement_type(cls, v):
        allowed_types = ['in', 'out', 'adjustment', 'transfer']
        if v not in allowed_types:
            raise ValueError(f'Movement type must be one of: {", ".join(allowed_types)}')
        return v

class InventoryMovementCreate(InventoryMovementBase):
    pass

class InventoryMovement(InventoryMovementBase):
    id: UUID
    quantity_before: Decimal
    quantity_after: Decimal
    total_cost: Optional[Decimal] = None
    status: str
    movement_date: datetime
    created_at: datetime
    created_by: Optional[UUID] = None
    
    class Config:
        from_attributes = True

class InventoryMovementWithItem(InventoryMovement):
    inventory_item: Optional[UniversalInventoryItem] = None

# Search and Filter Schemas
class InventorySearchFilters(BaseModel):
    search: Optional[str] = Field(None, description="Search term for name, description, SKU, barcode")
    category_id: Optional[UUID] = Field(None, description="Filter by category")
    category_path: Optional[str] = Field(None, description="Filter by category path (includes subcategories)")
    tags: Optional[List[str]] = Field(None, description="Filter by tags")
    custom_attributes: Optional[Dict[str, Any]] = Field(None, description="Filter by custom attributes")
    min_stock: Optional[Decimal] = Field(None, description="Minimum stock quantity")
    max_stock: Optional[Decimal] = Field(None, description="Maximum stock quantity")
    low_stock_only: bool = Field(default=False, description="Show only low stock items")
    out_of_stock_only: bool = Field(default=False, description="Show only out of stock items")
    min_price: Optional[Decimal] = Field(None, description="Minimum price")
    max_price: Optional[Decimal] = Field(None, description="Maximum price")
    business_type: Optional[str] = Field(None, description="Filter by business type")
    has_images: Optional[bool] = Field(None, description="Filter items with/without images")
    is_active: bool = Field(default=True, description="Filter by active status")
    created_after: Optional[datetime] = Field(None, description="Created after date")
    created_before: Optional[datetime] = Field(None, description="Created before date")
    sort_by: str = Field(default='name', description="Sort field")
    sort_order: str = Field(default='asc', description="Sort order: asc, desc")

class CategorySearchFilters(BaseModel):
    search: Optional[str] = Field(None, description="Search term for name or description")
    parent_id: Optional[UUID] = Field(None, description="Filter by parent category")
    level: Optional[int] = Field(None, description="Filter by category level")
    business_type: Optional[str] = Field(None, description="Filter by business type")
    has_items: Optional[bool] = Field(None, description="Filter categories with/without items")
    is_active: bool = Field(default=True, description="Filter by active status")

# Stock Management Schemas
class StockUpdateRequest(BaseModel):
    quantity_change: Decimal = Field(..., description="Quantity change (positive or negative)")
    reason: Optional[str] = Field(None, description="Reason for stock update")
    notes: Optional[str] = Field(None, description="Additional notes")
    reference_type: Optional[str] = Field(None, description="Reference type")
    reference_id: Optional[UUID] = Field(None, description="Reference ID")

class StockAdjustmentRequest(BaseModel):
    new_quantity: Decimal = Field(..., description="New stock quantity")
    reason: str = Field(..., description="Reason for adjustment")
    notes: Optional[str] = Field(None, description="Additional notes")

class LowStockAlert(BaseModel):
    item_id: UUID
    item_name: str
    item_sku: str
    category_name: Optional[str] = None
    current_stock: Decimal
    low_stock_threshold: Decimal
    shortage: Decimal
    unit_of_measure: str
    last_movement_date: Optional[datetime] = None
    urgency_level: str  # low, medium, high, critical

class StockSummary(BaseModel):
    total_items: int
    total_value: Decimal
    low_stock_items: int
    out_of_stock_items: int
    categories_count: int
    recent_movements: int

# Bulk Operations Schemas
class BulkUpdateRequest(BaseModel):
    item_ids: List[UUID] = Field(..., description="List of item IDs to update")
    updates: Dict[str, Any] = Field(..., description="Fields to update")

class BulkDeleteRequest(BaseModel):
    item_ids: List[UUID] = Field(..., description="List of item IDs to delete")
    force: bool = Field(default=False, description="Force delete even if used in invoices")

class BulkTagRequest(BaseModel):
    item_ids: List[UUID] = Field(..., description="List of item IDs")
    tags: List[str] = Field(..., description="Tags to add or remove")
    operation: str = Field(..., description="Operation: add, remove, replace")
    
    @validator('operation')
    def validate_operation(cls, v):
        allowed_operations = ['add', 'remove', 'replace']
        if v not in allowed_operations:
            raise ValueError(f'Operation must be one of: {", ".join(allowed_operations)}')
        return v

# Image Management Schemas
class ImageBase(BaseModel):
    filename: str
    original_name: str
    mime_type: str
    file_size: int
    width: Optional[int] = None
    height: Optional[int] = None
    context_type: str  # 'category', 'item', 'invoice', 'user', 'company'
    context_id: Optional[UUID] = None
    alt_text: Optional[str] = None
    caption: Optional[str] = None
    image_metadata: Dict[str, Any] = Field(default_factory=dict)

class ImageCreate(ImageBase):
    file_path: str
    url: str

class ImageUpdate(BaseModel):
    alt_text: Optional[str] = None
    caption: Optional[str] = None
    image_metadata: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None

class Image(ImageBase):
    id: UUID
    file_path: str
    url: str
    thumbnail_url: Optional[str] = None
    medium_url: Optional[str] = None
    processing_status: str
    processing_error: Optional[str] = None
    storage_provider: str
    storage_path: Optional[str] = None
    storage_metadata: Dict[str, Any]
    is_active: bool
    uploaded_by: Optional[UUID] = None
    uploaded_at: datetime
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class ImageVariant(BaseModel):
    id: UUID
    parent_image_id: UUID
    variant_type: str
    width: int
    height: int
    filename: str
    file_path: str
    file_size: int
    url: str
    processing_status: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class ImageWithVariants(Image):
    variants: List[ImageVariant] = Field(default_factory=list)

# Response Schemas
class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    per_page: int
    total_pages: int
    has_next: bool
    has_prev: bool

class InventoryItemsResponse(PaginatedResponse):
    items: List[UniversalInventoryItemWithCategory]

class CategoriesResponse(PaginatedResponse):
    items: List[UniversalCategoryWithStats]

class MovementsResponse(PaginatedResponse):
    items: List[InventoryMovementWithItem]

# Analytics and Reporting Schemas
class InventoryAnalytics(BaseModel):
    total_items: int
    total_value: Decimal
    categories_count: int
    low_stock_items: int
    out_of_stock_items: int
    top_categories: List[Dict[str, Any]]
    recent_movements: List[Dict[str, Any]]
    stock_distribution: Dict[str, int]
    value_distribution: Dict[str, Decimal]

class CategoryAnalytics(BaseModel):
    category_id: UUID
    category_name: str
    items_count: int
    total_value: Decimal
    average_price: Decimal
    stock_turnover: Decimal
    low_stock_items: int
    subcategories_count: int

# Update forward references
UniversalCategoryWithChildren.model_rebuild()
UniversalCategoryWithStats.model_rebuild()
UniversalInventoryItemWithImages.model_rebuild()