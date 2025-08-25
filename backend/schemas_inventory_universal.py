"""
Universal Inventory Management Schemas
Enhanced schemas for universal inventory system with custom attributes,
advanced search, SKU/barcode management, and comprehensive audit trails.
"""

from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Optional, List, Dict, Any, Union
from datetime import datetime, date
from uuid import UUID
from enum import Enum


# Attribute Type Definitions
class AttributeType(str, Enum):
    TEXT = "text"
    NUMBER = "number"
    DATE = "date"
    ENUM = "enum"
    BOOLEAN = "boolean"
    MULTI_SELECT = "multi_select"
    URL = "url"
    EMAIL = "email"


# Custom Attribute Schemas
class AttributeDefinition(BaseModel):
    """Schema for defining custom attributes in categories"""
    name: str = Field(..., min_length=1, max_length=100)
    label: str = Field(..., min_length=1, max_length=200)
    type: AttributeType
    required: bool = False
    searchable: bool = True
    options: Optional[List[str]] = None  # For enum and multi_select types
    validation: Optional[Dict[str, Any]] = None  # Additional validation rules
    default_value: Optional[Union[str, int, float, bool, List[str]]] = None
    help_text: Optional[str] = None
    display_order: int = 0
    
    @field_validator('options')
    @classmethod
    def validate_options(cls, v, info):
        attr_type = info.data.get('type')
        if attr_type in [AttributeType.ENUM, AttributeType.MULTI_SELECT] and not v:
            raise ValueError(f"Options are required for {attr_type} attributes")
        return v


class AttributeValue(BaseModel):
    """Schema for attribute values on inventory items"""
    name: str
    value: Union[str, int, float, bool, List[str]]
    type: AttributeType


# Enhanced Category Schemas
class UniversalCategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    parent_id: Optional[UUID] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')  # Hex color
    business_type: Optional[str] = None
    attribute_schema: List[AttributeDefinition] = []
    category_metadata: Dict[str, Any] = {}
    sort_order: int = 0


class UniversalCategoryCreate(UniversalCategoryBase):
    pass


class UniversalCategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    parent_id: Optional[UUID] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    business_type: Optional[str] = None
    attribute_schema: Optional[List[AttributeDefinition]] = None
    category_metadata: Optional[Dict[str, Any]] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None


class UniversalCategory(UniversalCategoryBase):
    id: UUID
    path: Optional[str] = None  # LTREE path
    level: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class CategoryWithStats(UniversalCategory):
    """Category with statistics"""
    children: List['CategoryWithStats'] = []
    product_count: int = 0
    total_stock: float = 0
    total_value: float = 0


class CategoryHierarchyMove(BaseModel):
    """Schema for moving categories in hierarchy"""
    category_id: UUID
    new_parent_id: Optional[UUID] = None
    new_sort_order: Optional[int] = None


# Enhanced Inventory Item Schemas
class UniversalInventoryItemBase(BaseModel):
    # Universal identifiers
    sku: Optional[str] = Field(None, max_length=100)
    barcode: Optional[str] = Field(None, max_length=100)
    qr_code: Optional[str] = Field(None, max_length=255)
    
    # Basic information
    name: str = Field(..., min_length=1, max_length=200)
    category_id: Optional[UUID] = None
    description: Optional[str] = None
    
    # Pricing (universal)
    cost_price: Optional[float] = Field(None, ge=0)
    sale_price: Optional[float] = Field(None, ge=0)
    currency: str = Field(default="USD", max_length=3)
    
    # Inventory tracking
    stock_quantity: float = Field(default=0, ge=0)
    min_stock_level: int = Field(default=5, ge=0)
    unit_of_measure: Optional[str] = Field(None, max_length=50)
    conversion_factors: Optional[Dict[str, float]] = None
    
    # Universal attributes
    attributes: Dict[str, Any] = {}
    tags: List[str] = []
    
    # Business type specific fields
    business_type_fields: Dict[str, Any] = {}
    
    # Gold shop compatibility (legacy fields)
    weight_grams: Optional[float] = Field(None, gt=0)  # For gold shop compatibility
    purchase_price: Optional[float] = Field(None, ge=0)  # Legacy field
    sell_price: Optional[float] = Field(None, ge=0)  # Legacy field
    gold_specific: Optional[Dict[str, Any]] = None
    
    # Metadata
    image_url: Optional[str] = Field(None, max_length=500)


class UniversalInventoryItemCreate(UniversalInventoryItemBase):
    pass


class UniversalInventoryItemUpdate(BaseModel):
    # Universal identifiers
    sku: Optional[str] = Field(None, max_length=100)
    barcode: Optional[str] = Field(None, max_length=100)
    qr_code: Optional[str] = Field(None, max_length=255)
    
    # Basic information
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    category_id: Optional[UUID] = None
    description: Optional[str] = None
    
    # Pricing
    cost_price: Optional[float] = Field(None, ge=0)
    sale_price: Optional[float] = Field(None, ge=0)
    currency: Optional[str] = Field(None, max_length=3)
    
    # Inventory tracking
    stock_quantity: Optional[float] = Field(None, ge=0)
    min_stock_level: Optional[int] = Field(None, ge=0)
    unit_of_measure: Optional[str] = Field(None, max_length=50)
    conversion_factors: Optional[Dict[str, float]] = None
    
    # Universal attributes
    attributes: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None
    
    # Business type specific fields
    business_type_fields: Optional[Dict[str, Any]] = None
    
    # Gold shop compatibility
    weight_grams: Optional[float] = Field(None, gt=0)
    purchase_price: Optional[float] = Field(None, ge=0)
    sell_price: Optional[float] = Field(None, ge=0)
    gold_specific: Optional[Dict[str, Any]] = None
    
    # Metadata
    image_url: Optional[str] = Field(None, max_length=500)
    is_active: Optional[bool] = None


class UniversalInventoryItem(UniversalInventoryItemBase):
    id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class UniversalInventoryItemWithCategory(UniversalInventoryItem):
    category: Optional[UniversalCategory] = None


# Advanced Search Schemas
class InventorySearchFilters(BaseModel):
    """Advanced search filters for inventory items"""
    query: Optional[str] = None  # Text search
    category_ids: Optional[List[UUID]] = None
    attributes_filter: Optional[Dict[str, Any]] = None
    tags_filter: Optional[List[str]] = None
    sku_filter: Optional[str] = None
    barcode_filter: Optional[str] = None
    business_type: Optional[str] = None
    include_inactive: bool = False
    
    # Stock level filters
    min_stock: Optional[float] = None
    max_stock: Optional[float] = None
    low_stock_only: bool = False
    out_of_stock_only: bool = False
    
    # Price range filters
    min_cost_price: Optional[float] = None
    max_cost_price: Optional[float] = None
    min_sale_price: Optional[float] = None
    max_sale_price: Optional[float] = None
    
    # Date filters
    created_after: Optional[datetime] = None
    created_before: Optional[datetime] = None
    updated_after: Optional[datetime] = None
    updated_before: Optional[datetime] = None


class InventorySearchRequest(BaseModel):
    """Request schema for inventory search"""
    filters: InventorySearchFilters = InventorySearchFilters()
    sort_by: str = Field(default="name", pattern=r'^(name|sku|stock_quantity|cost_price|sale_price|created_at|updated_at)$')
    sort_order: str = Field(default="asc", pattern=r'^(asc|desc)$')
    limit: int = Field(default=100, ge=1, le=1000)
    offset: int = Field(default=0, ge=0)


class InventorySearchResponse(BaseModel):
    """Response schema for inventory search"""
    items: List[UniversalInventoryItemWithCategory]
    total_count: int
    page_info: Dict[str, Any]
    filters_applied: InventorySearchFilters


# Inventory Movement Schemas
class InventoryMovementType(str, Enum):
    INITIAL_STOCK = "initial_stock"
    PURCHASE = "purchase"
    SALE = "sale"
    ADJUSTMENT = "adjustment"
    TRANSFER = "transfer"
    RETURN = "return"
    DAMAGE = "damage"
    THEFT = "theft"
    EXPIRY = "expiry"


class InventoryMovementBase(BaseModel):
    inventory_item_id: UUID
    movement_type: InventoryMovementType
    quantity: float
    unit_cost: Optional[float] = Field(None, ge=0)
    total_cost: Optional[float] = Field(None, ge=0)
    reference_type: Optional[str] = None  # invoice, purchase_order, etc.
    reference_id: Optional[UUID] = None
    notes: Optional[str] = None


class InventoryMovementCreate(InventoryMovementBase):
    pass


class InventoryMovement(InventoryMovementBase):
    id: UUID
    created_by: UUID
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class InventoryMovementWithDetails(InventoryMovement):
    inventory_item: Optional[UniversalInventoryItem] = None
    creator: Optional[Dict[str, Any]] = None  # User info


# Stock Alert Schemas
class StockAlertLevel(str, Enum):
    OUT_OF_STOCK = "out_of_stock"
    CRITICAL = "critical"
    LOW = "low"
    WARNING = "warning"


class LowStockAlert(BaseModel):
    item_id: UUID
    item_name: str
    sku: Optional[str] = None
    category_name: Optional[str] = None
    current_stock: float
    min_stock_level: int
    shortage: float
    urgency_score: float
    alert_level: StockAlertLevel
    unit_cost: float
    potential_lost_sales: float
    last_movement_date: Optional[datetime] = None


class StockAlertsResponse(BaseModel):
    alerts: List[LowStockAlert]
    summary: Dict[str, Any]
    threshold_multiplier: float


# Unit Conversion Schemas
class UnitConversionRequest(BaseModel):
    item_id: UUID
    from_unit: str
    to_unit: str
    quantity: float


class UnitConversionResponse(BaseModel):
    original_quantity: float
    original_unit: str
    converted_quantity: float
    converted_unit: str
    conversion_factor: float


# Bulk Operations Schemas
class BulkInventoryUpdate(BaseModel):
    item_ids: List[UUID]
    updates: Dict[str, Any]


class BulkInventoryResponse(BaseModel):
    success_count: int
    error_count: int
    errors: List[Dict[str, Any]]
    message: str


class BulkStockAdjustment(BaseModel):
    adjustments: List[Dict[str, Any]]  # [{"item_id": UUID, "quantity_change": float, "reason": str}]


# Inventory Analytics Schemas
class InventoryAnalytics(BaseModel):
    total_items: int
    total_categories: int
    total_inventory_value: float
    low_stock_items: int
    out_of_stock_items: int
    top_categories_by_value: List[Dict[str, Any]]
    top_items_by_value: List[Dict[str, Any]]
    inventory_turnover: Optional[float] = None
    last_updated: datetime


class CategoryAnalytics(BaseModel):
    category_id: UUID
    category_name: str
    item_count: int
    total_stock: float
    total_value: float
    average_item_value: float
    low_stock_items: int
    subcategories_count: int


# Import/Export Schemas
class InventoryImportRequest(BaseModel):
    file_format: str = Field(..., pattern=r'^(csv|xlsx|json)$')
    mapping: Dict[str, str]  # Field mapping
    options: Dict[str, Any] = {}


class InventoryImportResponse(BaseModel):
    total_rows: int
    success_count: int
    error_count: int
    errors: List[Dict[str, Any]]
    import_id: UUID


class InventoryExportRequest(BaseModel):
    filters: Optional[InventorySearchFilters] = None
    fields: List[str]  # Fields to export
    format: str = Field(..., pattern=r'^(csv|xlsx|json)$')
    include_categories: bool = True
    include_movements: bool = False


# Barcode/QR Code Schemas
class BarcodeGenerationRequest(BaseModel):
    item_ids: List[UUID]
    barcode_type: str = Field(default="CODE128", pattern=r'^(CODE128|EAN13|QR)$')
    include_text: bool = True
    size: str = Field(default="medium", pattern=r'^(small|medium|large)$')


class BarcodeGenerationResponse(BaseModel):
    barcodes: List[Dict[str, Any]]  # [{"item_id": UUID, "barcode_url": str, "barcode_data": str}]
    generation_id: UUID


# Audit Trail Schemas
class InventoryAuditLog(BaseModel):
    id: UUID
    user_id: UUID
    action: str
    resource_type: str
    resource_id: UUID
    old_values: Optional[Dict[str, Any]] = None
    new_values: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class InventoryAuditLogWithUser(InventoryAuditLog):
    user: Optional[Dict[str, Any]] = None  # User info


# Business Configuration Schemas
class BusinessInventoryConfig(BaseModel):
    business_type: str
    default_unit_of_measure: str = "piece"
    enable_multi_unit: bool = False
    enable_barcode_scanning: bool = True
    enable_qr_codes: bool = False
    auto_generate_sku: bool = True
    sku_prefix: Optional[str] = None
    low_stock_threshold_multiplier: float = 1.0
    enable_batch_tracking: bool = False
    enable_expiry_tracking: bool = False
    custom_fields: List[AttributeDefinition] = []


# Validation Schemas
class SKUValidationRequest(BaseModel):
    sku: str
    exclude_item_id: Optional[UUID] = None


class SKUValidationResponse(BaseModel):
    is_valid: bool
    is_unique: bool
    suggested_sku: Optional[str] = None
    errors: List[str] = []


class BarcodeValidationRequest(BaseModel):
    barcode: str
    exclude_item_id: Optional[UUID] = None


class BarcodeValidationResponse(BaseModel):
    is_valid: bool
    is_unique: bool
    format_detected: Optional[str] = None
    errors: List[str] = []


# Update forward references
CategoryWithStats.model_rebuild()