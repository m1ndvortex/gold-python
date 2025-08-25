"""
Enhanced Invoice Schemas for Universal Business Platform
Supports flexible workflows, multiple payment methods, and business type specific features
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any, Union
from datetime import datetime, date
from uuid import UUID
from decimal import Decimal
from enum import Enum

# Enums for better type safety
class InvoiceType(str, Enum):
    STANDARD = "standard"
    GOLD = "gold"
    SERVICE = "service"
    SUBSCRIPTION = "subscription"
    RETURN = "return"

class WorkflowStage(str, Enum):
    DRAFT = "draft"
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    PAID = "paid"
    CANCELLED = "cancelled"

class PaymentStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"

class BusinessType(str, Enum):
    GOLD_SHOP = "gold_shop"
    RETAIL = "retail"
    RESTAURANT = "restaurant"
    SERVICE = "service"
    MANUFACTURING = "manufacturing"
    WHOLESALE = "wholesale"

# Base Invoice Item Schemas
class InvoiceItemBase(BaseModel):
    inventory_item_id: UUID
    quantity: Decimal = Field(..., gt=0, description="Item quantity")
    unit_price: Optional[Decimal] = Field(None, ge=0, description="Override unit price")
    weight_grams: Optional[Decimal] = Field(None, ge=0, description="Weight in grams (for gold items)")
    custom_attributes: Optional[Dict[str, Any]] = Field(default_factory=dict)
    notes: Optional[str] = None

class InvoiceItemCreate(InvoiceItemBase):
    pass

class InvoiceItemUpdate(BaseModel):
    quantity: Optional[Decimal] = Field(None, gt=0)
    unit_price: Optional[Decimal] = Field(None, ge=0)
    weight_grams: Optional[Decimal] = Field(None, ge=0)
    custom_attributes: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None

class InvoiceItem(InvoiceItemBase):
    id: UUID
    invoice_id: UUID
    total_price: Decimal
    cost_price: Optional[Decimal] = None
    margin: Optional[Decimal] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class InvoiceItemWithInventory(InvoiceItem):
    inventory_item: Optional['InventoryItem'] = None

# Pricing and Calculation Schemas
class ItemPricingCalculation(BaseModel):
    inventory_item_id: UUID
    item_name: str
    quantity: Decimal
    cost_price: Decimal
    base_unit_price: Decimal
    
    # Universal pricing fields
    discount_amount: Optional[Decimal] = Field(default=Decimal('0'))
    tax_amount: Optional[Decimal] = Field(default=Decimal('0'))
    
    # Gold-specific fields
    weight_grams: Optional[Decimal] = None
    base_price: Optional[Decimal] = None  # Gold price * weight
    labor_cost: Optional[Decimal] = None  # اجرت
    profit_amount: Optional[Decimal] = None  # سود
    
    # Final pricing
    unit_price: Decimal
    total_price: Decimal
    margin: Decimal
    
    # Additional metadata
    pricing_method: str = "standard"  # standard, gold, service, etc.
    business_type_data: Optional[Dict[str, Any]] = Field(default_factory=dict)

class InvoicePricingCalculation(BaseModel):
    items: List[ItemPricingCalculation]
    subtotal: Decimal
    total_tax: Decimal
    total_discount: Decimal
    total_cost: Decimal
    gross_profit: Decimal
    profit_margin: Decimal
    grand_total: Decimal
    
    # Business type specific totals
    business_type_totals: Optional[Dict[str, Any]] = Field(default_factory=dict)

# Tax and Discount Schemas
class TaxRate(BaseModel):
    name: str
    rate: Decimal = Field(..., ge=0, le=100)
    type: str = "percentage"  # percentage, fixed
    applies_to: List[str] = Field(default_factory=list)  # categories, items, all

class DiscountRule(BaseModel):
    name: str
    type: str = "percentage"  # percentage, fixed, buy_x_get_y
    value: Decimal
    conditions: Optional[Dict[str, Any]] = Field(default_factory=dict)
    applies_to: List[str] = Field(default_factory=list)

# Payment Method Schemas
class PaymentMethodBase(BaseModel):
    name: str
    type: str = Field(..., description="cash, bank_transfer, card, check, digital")
    account_id: Optional[UUID] = None
    configuration: Optional[Dict[str, Any]] = Field(default_factory=dict)
    is_active: bool = True

class PaymentMethodCreate(PaymentMethodBase):
    pass

class PaymentMethod(PaymentMethodBase):
    id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True

# Payment Schemas
class PaymentBase(BaseModel):
    amount: Decimal = Field(..., gt=0, description="Payment amount")
    currency: str = Field(default="USD", max_length=3)
    payment_method_id: Optional[UUID] = None
    payment_method: str = Field(default="cash", description="Legacy payment method")
    reference_number: Optional[str] = None
    description: Optional[str] = None
    payment_date: Optional[datetime] = None

class PaymentCreate(PaymentBase):
    pass

class PaymentUpdate(BaseModel):
    status: Optional[PaymentStatus] = None
    reference_number: Optional[str] = None
    description: Optional[str] = None

class Payment(PaymentBase):
    id: UUID
    customer_id: UUID
    invoice_id: Optional[UUID] = None
    status: PaymentStatus = PaymentStatus.COMPLETED
    fees: Decimal = Field(default=Decimal('0'))
    net_amount: Optional[Decimal] = None
    exchange_rate: Decimal = Field(default=Decimal('1.0'))
    created_at: datetime
    
    class Config:
        from_attributes = True

class PaymentWithDetails(Payment):
    customer: Optional['Customer'] = None
    invoice: Optional['Invoice'] = None
    payment_method_rel: Optional[PaymentMethod] = None

# Workflow Schemas
class WorkflowTransition(BaseModel):
    target_stage: WorkflowStage
    notes: Optional[str] = None
    force: bool = Field(default=False, description="Force transition ignoring rules")

class WorkflowDefinition(BaseModel):
    stages: List[Dict[str, Any]]
    transitions: Dict[str, List[str]]
    approval_rules: Dict[str, Any]

class ApprovalRequest(BaseModel):
    invoice_id: UUID
    notes: Optional[str] = None
    approved: bool

# Base Invoice Schemas
class InvoiceBase(BaseModel):
    customer_id: UUID
    invoice_type: InvoiceType = InvoiceType.STANDARD
    business_type: BusinessType = BusinessType.GOLD_SHOP
    currency: str = Field(default="USD", max_length=3)
    payment_terms: int = Field(default=0, ge=0, description="Payment terms in days")
    
    # Business type specific fields
    business_type_fields: Optional[Dict[str, Any]] = Field(default_factory=dict)
    
    # Gold shop specific fields (for backward compatibility)
    gold_price_per_gram: Optional[Decimal] = Field(None, ge=0)
    labor_cost_percentage: Optional[Decimal] = Field(None, ge=0, le=100)
    profit_percentage: Optional[Decimal] = Field(None, ge=0, le=100)
    vat_percentage: Optional[Decimal] = Field(None, ge=0, le=100)
    
    # Tax and discount configuration
    tax_rates: Optional[List[TaxRate]] = Field(default_factory=list)
    discount_rules: Optional[List[DiscountRule]] = Field(default_factory=list)

class InvoiceCreate(InvoiceBase):
    items: List[InvoiceItemCreate] = Field(..., min_items=1)
    
    @validator('items')
    def validate_items(cls, v):
        if not v:
            raise ValueError('Invoice must have at least one item')
        return v

class InvoiceUpdate(BaseModel):
    customer_id: Optional[UUID] = None
    invoice_type: Optional[InvoiceType] = None
    business_type_fields: Optional[Dict[str, Any]] = None
    payment_terms: Optional[int] = Field(None, ge=0)
    
    # Gold shop fields
    gold_price_per_gram: Optional[Decimal] = Field(None, ge=0)
    labor_cost_percentage: Optional[Decimal] = Field(None, ge=0, le=100)
    profit_percentage: Optional[Decimal] = Field(None, ge=0, le=100)
    vat_percentage: Optional[Decimal] = Field(None, ge=0, le=100)
    
    # Only allow updating items if invoice is in draft stage
    items: Optional[List[InvoiceItemUpdate]] = None

class Invoice(InvoiceBase):
    id: UUID
    invoice_number: str
    workflow_stage: WorkflowStage
    approval_required: bool
    approved_by: Optional[UUID] = None
    approved_at: Optional[datetime] = None
    
    # Financial fields
    subtotal: Optional[Decimal] = None
    tax_amount: Optional[Decimal] = None
    discount_amount: Optional[Decimal] = None
    total_amount: Decimal
    paid_amount: Decimal = Field(default=Decimal('0'))
    remaining_amount: Decimal
    
    # Legacy status field
    status: str = "pending"
    
    # Dates
    due_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class InvoiceWithDetails(Invoice):
    customer: Optional['Customer'] = None
    approver: Optional['User'] = None
    invoice_items: List[InvoiceItemWithInventory] = Field(default_factory=list)
    payments: List[Payment] = Field(default_factory=list)

# Invoice Calculation and Preview Schemas
class InvoiceCalculationRequest(BaseModel):
    customer_id: UUID
    business_type: BusinessType = BusinessType.GOLD_SHOP
    items: List[InvoiceItemCreate]
    
    # Pricing parameters
    gold_price_per_gram: Optional[Decimal] = None
    labor_cost_percentage: Optional[Decimal] = Field(default=Decimal('0'))
    profit_percentage: Optional[Decimal] = Field(default=Decimal('0'))
    tax_percentage: Optional[Decimal] = Field(default=Decimal('0'))
    discount_percentage: Optional[Decimal] = Field(default=Decimal('0'))
    
    # Additional configuration
    business_type_fields: Optional[Dict[str, Any]] = Field(default_factory=dict)

class InvoicePreview(BaseModel):
    calculation: InvoicePricingCalculation
    workflow_info: Dict[str, Any]
    business_type_info: Dict[str, Any]
    validation_warnings: List[str] = Field(default_factory=list)

# Search and Filter Schemas
class InvoiceSearchFilters(BaseModel):
    customer_id: Optional[UUID] = None
    invoice_type: Optional[InvoiceType] = None
    workflow_stage: Optional[WorkflowStage] = None
    business_type: Optional[BusinessType] = None
    status: Optional[str] = None  # Legacy status field
    invoice_number: Optional[str] = None
    
    # Date filters
    created_after: Optional[datetime] = None
    created_before: Optional[datetime] = None
    due_after: Optional[datetime] = None
    due_before: Optional[datetime] = None
    
    # Amount filters
    min_amount: Optional[Decimal] = Field(None, ge=0)
    max_amount: Optional[Decimal] = Field(None, ge=0)
    has_remaining_amount: Optional[bool] = None
    
    # Approval filters
    approval_required: Optional[bool] = None
    approved_by: Optional[UUID] = None

class InvoiceListResponse(BaseModel):
    invoices: List[Invoice]
    total: int
    page: int
    per_page: int
    total_pages: int
    filters_applied: InvoiceSearchFilters

# Audit and History Schemas
class InvoiceAuditLog(BaseModel):
    id: UUID
    action: str
    user_id: Optional[UUID] = None
    old_values: Optional[Dict[str, Any]] = None
    new_values: Optional[Dict[str, Any]] = None
    timestamp: datetime
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None

class InvoiceHistory(BaseModel):
    invoice_id: UUID
    audit_logs: List[InvoiceAuditLog]
    workflow_transitions: List[Dict[str, Any]]
    payment_history: List[Payment]

# Business Type Specific Schemas
class GoldInvoiceFields(BaseModel):
    """Gold shop specific invoice fields"""
    gold_price_per_gram: Decimal = Field(..., gt=0)
    labor_cost_percentage: Decimal = Field(default=Decimal('0'), ge=0, le=100)
    profit_percentage: Decimal = Field(default=Decimal('0'), ge=0, le=100)
    purity_standard: Optional[str] = Field(default="24K")
    total_sood: Optional[Decimal] = None  # سود
    total_ojrat: Optional[Decimal] = None  # اجرت

class ServiceInvoiceFields(BaseModel):
    """Service business specific invoice fields"""
    service_date: Optional[datetime] = None
    service_duration: Optional[int] = None  # minutes
    technician_id: Optional[UUID] = None
    service_location: Optional[str] = None
    warranty_period: Optional[int] = None  # days

class RestaurantInvoiceFields(BaseModel):
    """Restaurant specific invoice fields"""
    table_number: Optional[str] = None
    server_id: Optional[UUID] = None
    order_type: str = Field(default="dine_in")  # dine_in, takeout, delivery
    delivery_address: Optional[str] = None
    special_instructions: Optional[str] = None

# Report and Analytics Schemas
class InvoiceSummaryStats(BaseModel):
    total_invoices: int
    total_amount: Decimal
    total_paid: Decimal
    total_remaining: Decimal
    average_invoice_amount: Decimal
    
    # Workflow breakdown
    workflow_breakdown: Dict[WorkflowStage, int]
    
    # Business type breakdown
    business_type_breakdown: Dict[BusinessType, Dict[str, Any]]
    
    # Time period
    period_start: Optional[datetime] = None
    period_end: Optional[datetime] = None

class InvoiceAnalytics(BaseModel):
    summary: InvoiceSummaryStats
    trends: Dict[str, Any]
    top_customers: List[Dict[str, Any]]
    payment_method_breakdown: Dict[str, Any]
    profitability_analysis: Dict[str, Any]

# Bulk Operations Schemas
class BulkInvoiceAction(BaseModel):
    invoice_ids: List[UUID] = Field(..., min_items=1)
    action: str  # approve, void, send_reminder, etc.
    parameters: Optional[Dict[str, Any]] = Field(default_factory=dict)

class BulkInvoiceResult(BaseModel):
    total_requested: int
    successful: int
    failed: int
    results: List[Dict[str, Any]]
    errors: List[Dict[str, Any]]

# Integration Schemas
class InvoiceWebhookPayload(BaseModel):
    event_type: str  # created, approved, paid, voided
    invoice_id: UUID
    invoice_number: str
    customer_id: UUID
    total_amount: Decimal
    workflow_stage: WorkflowStage
    timestamp: datetime
    business_type: BusinessType

# Forward references for relationships
from schemas import Customer, User, InventoryItem

# Update forward references
InvoiceItemWithInventory.model_rebuild()
InvoiceWithDetails.model_rebuild()
PaymentWithDetails.model_rebuild()