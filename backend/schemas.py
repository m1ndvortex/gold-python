from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID

# Authentication Schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str
    role_id: Optional[UUID] = None

class UserLogin(BaseModel):
    username: str
    password: str

class User(UserBase):
    id: UUID
    role_id: Optional[UUID] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class UserWithRole(User):
    role: Optional['Role'] = None

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    expires_in: int

class TokenData(BaseModel):
    user_id: Optional[UUID] = None
    username: Optional[str] = None
    permissions: Optional[List[str]] = None

# Role Schemas
class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None
    permissions: Dict[str, Any]

class RoleCreate(RoleBase):
    pass

class Role(RoleBase):
    id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True

# Category Schemas
class CategoryAttribute(BaseModel):
    id: str
    name: str
    type: str  # 'text', 'number', 'select', 'boolean', 'date'
    required: bool = False
    options: Optional[List[str]] = None  # For select type
    validation: Optional[Dict[str, Any]] = None

class CategoryBase(BaseModel):
    name: str
    parent_id: Optional[UUID] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    attributes: Optional[List[CategoryAttribute]] = []
    category_metadata: Optional[Dict[str, Any]] = {}
    sort_order: Optional[int] = 0

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    parent_id: Optional[UUID] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    attributes: Optional[List[CategoryAttribute]] = None
    category_metadata: Optional[Dict[str, Any]] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None

class Category(CategoryBase):
    id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class CategoryWithChildren(Category):
    children: List['CategoryWithChildren'] = []
    parent: Optional['Category'] = None

class CategoryWithStats(Category):
    product_count: int = 0
    children: List['CategoryWithStats'] = []

# Category Template Schemas
class CategoryTemplateBase(BaseModel):
    name: str
    description: Optional[str] = None
    template_data: Dict[str, Any]

class CategoryTemplateCreate(CategoryTemplateBase):
    pass

class CategoryTemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    template_data: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None

class CategoryTemplate(CategoryTemplateBase):
    id: UUID
    is_active: bool
    created_by: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class CategoryTemplateWithCreator(CategoryTemplate):
    creator: Optional[User] = None

# Category Bulk Operations
class CategoryBulkUpdateRequest(BaseModel):
    category_ids: List[UUID]
    updates: Dict[str, Any]

class CategoryBulkDeleteRequest(BaseModel):
    category_ids: List[UUID]
    force: bool = False  # Force delete even if has products

class CategoryReorderRequest(BaseModel):
    category_id: UUID
    new_parent_id: Optional[UUID] = None
    new_sort_order: int

# Inventory Item Schemas
class InventoryItemBase(BaseModel):
    name: str
    category_id: Optional[UUID] = None
    weight_grams: float
    purchase_price: float
    sell_price: float
    stock_quantity: int
    min_stock_level: int = 5
    description: Optional[str] = None
    image_url: Optional[str] = None

class InventoryItemCreate(InventoryItemBase):
    pass

class InventoryItemUpdate(BaseModel):
    name: Optional[str] = None
    category_id: Optional[UUID] = None
    weight_grams: Optional[float] = None
    purchase_price: Optional[float] = None
    sell_price: Optional[float] = None
    stock_quantity: Optional[int] = None
    min_stock_level: Optional[int] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None

class InventoryItem(InventoryItemBase):
    id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class InventoryItemWithCategory(InventoryItem):
    category: Optional[Category] = None

class LowStockAlert(BaseModel):
    item_id: UUID
    item_name: str
    current_stock: int
    min_stock_level: int
    category_name: Optional[str] = None

class StockUpdateRequest(BaseModel):
    quantity_change: int  # Positive for increase, negative for decrease
    reason: Optional[str] = None

# Customer Schemas
class CustomerBase(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None

class Customer(CustomerBase):
    id: UUID
    total_purchases: float
    current_debt: float
    last_purchase_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Payment Schemas
class PaymentBase(BaseModel):
    customer_id: UUID
    invoice_id: Optional[UUID] = None
    amount: float
    payment_method: str = 'cash'
    description: Optional[str] = None

class PaymentCreate(PaymentBase):
    pass

class Payment(PaymentBase):
    id: UUID
    payment_date: datetime
    created_at: datetime
    
    class Config:
        from_attributes = True

class PaymentWithCustomer(Payment):
    customer: Optional[Customer] = None

class CustomerWithPayments(Customer):
    payments: List[Payment] = []

class CustomerDebtSummary(BaseModel):
    customer_id: UUID
    customer_name: str
    total_debt: float
    total_payments: float
    last_payment_date: Optional[datetime] = None
    payment_count: int

class CustomerSearchFilters(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    has_debt: Optional[bool] = None
    min_debt: Optional[float] = None
    max_debt: Optional[float] = None
    created_after: Optional[datetime] = None
    created_before: Optional[datetime] = None

# Invoice Item Schemas
class InvoiceItemBase(BaseModel):
    inventory_item_id: UUID
    quantity: int
    unit_price: float
    weight_grams: float

class InvoiceItemCreate(InvoiceItemBase):
    pass

class InvoiceItem(InvoiceItemBase):
    id: UUID
    invoice_id: UUID
    total_price: float
    
    class Config:
        from_attributes = True

class InvoiceItemWithInventory(InvoiceItem):
    inventory_item: Optional[InventoryItem] = None

# Invoice Schemas
class InvoiceBase(BaseModel):
    customer_id: UUID
    gold_price_per_gram: float
    labor_cost_percentage: float = 0
    profit_percentage: float = 0
    vat_percentage: float = 0

class InvoiceCreate(InvoiceBase):
    items: List[InvoiceItemCreate]

class InvoiceUpdate(BaseModel):
    customer_id: Optional[UUID] = None
    gold_price_per_gram: Optional[float] = None
    labor_cost_percentage: Optional[float] = None
    profit_percentage: Optional[float] = None
    vat_percentage: Optional[float] = None
    status: Optional[str] = None

class Invoice(InvoiceBase):
    id: UUID
    invoice_number: str
    total_amount: float
    paid_amount: float
    remaining_amount: float
    status: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class InvoiceWithDetails(Invoice):
    customer: Optional[Customer] = None
    invoice_items: List[InvoiceItemWithInventory] = []
    payments: List[Payment] = []

class InvoiceCalculation(BaseModel):
    item_id: UUID
    item_name: str
    quantity: int
    weight_grams: float
    base_price: float  # Gold price * weight
    labor_cost: float
    profit_amount: float
    vat_amount: float
    unit_price: float
    total_price: float

class InvoiceCalculationSummary(BaseModel):
    items: List[InvoiceCalculation]
    subtotal: float
    total_labor_cost: float
    total_profit: float
    total_vat: float
    grand_total: float

class InvoiceSearchFilters(BaseModel):
    customer_id: Optional[UUID] = None
    status: Optional[str] = None
    invoice_number: Optional[str] = None
    created_after: Optional[datetime] = None
    created_before: Optional[datetime] = None
    min_amount: Optional[float] = None
    max_amount: Optional[float] = None
    has_remaining_amount: Optional[bool] = None

class InvoicePaymentRequest(BaseModel):
    amount: float
    payment_method: str = 'cash'
    description: Optional[str] = None

class InvoiceStatusUpdate(BaseModel):
    status: str  # 'pending', 'paid', 'partially_paid', 'cancelled'

# Accounting Entry Schemas
class AccountingEntryBase(BaseModel):
    entry_type: str
    category: str
    amount: Optional[float] = None
    weight_grams: Optional[float] = None
    description: str
    reference_id: Optional[UUID] = None
    reference_type: Optional[str] = None

class AccountingEntryCreate(AccountingEntryBase):
    pass

class AccountingEntry(AccountingEntryBase):
    id: UUID
    transaction_date: datetime
    created_at: datetime
    
    class Config:
        from_attributes = True

# Report Schemas
class SalesTrendSummary(BaseModel):
    total_sales: float
    total_paid: float
    total_outstanding: float
    total_items_sold: int
    average_daily_sales: float

class SalesTrendPeriod(BaseModel):
    period: str
    total_amount: float
    paid_amount: float
    items_sold: int
    categories: Dict[str, float]

class SalesTrendsResponse(BaseModel):
    period: str
    start_date: str
    end_date: str
    summary: SalesTrendSummary
    trends: List[SalesTrendPeriod]

class TopProductItem(BaseModel):
    item_id: str
    item_name: str
    category_name: str
    total_quantity: int
    total_revenue: float
    transaction_count: int
    average_price: float

class TopProductsResponse(BaseModel):
    period: Dict[str, str]
    top_by_quantity: List[TopProductItem]
    top_by_revenue: List[TopProductItem]

class InventoryValuationSummary(BaseModel):
    total_purchase_value: float
    total_sell_value: float
    total_potential_profit: float
    overall_profit_margin: float
    total_weight_grams: float
    total_items: int
    unique_products: int

class CategoryBreakdown(BaseModel):
    category_name: str
    purchase_value: float
    sell_value: float
    potential_profit: float
    profit_margin: float
    weight_grams: float
    item_count: int

class ItemValuation(BaseModel):
    item_id: str
    item_name: str
    category_name: str
    stock_quantity: int
    unit_purchase_price: float
    unit_sell_price: float
    unit_weight_grams: float
    total_purchase_value: float
    total_sell_value: float
    total_weight_grams: float
    potential_profit: float
    profit_margin: float
    is_active: bool

class InventoryValuationResponse(BaseModel):
    summary: InventoryValuationSummary
    category_breakdown: List[CategoryBreakdown]
    items: List[ItemValuation]

class LowStockItem(BaseModel):
    item_id: str
    item_name: str
    category_name: str
    current_stock: int
    min_stock_level: int
    shortage: int
    unit_price: float
    unit_weight_grams: float
    potential_lost_sales: float
    status: str
    urgency_score: float

class LowStockSummary(BaseModel):
    total_low_stock_items: int
    critical_items: int
    warning_items: int
    total_potential_lost_sales: float
    threshold_multiplier: float

class LowStockResponse(BaseModel):
    summary: LowStockSummary
    items: List[LowStockItem]

class CustomerAnalysisItem(BaseModel):
    customer_id: str
    customer_name: str
    phone: Optional[str]
    current_debt: float
    total_lifetime_purchases: float
    period_purchases: float
    period_payments: float
    invoice_count: int
    average_invoice: float
    last_purchase_date: Optional[str]
    last_invoice_date: Optional[str]
    segment: str
    payment_ratio: float

class CustomerAnalysisSummary(BaseModel):
    total_active_customers: int
    total_revenue: float
    average_revenue_per_customer: float
    high_value_customers: int
    customers_with_debt: int
    debt_percentage: float

class CustomerAnalysisResponse(BaseModel):
    period: Dict[str, str]
    summary: CustomerAnalysisSummary
    customers: List[CustomerAnalysisItem]

class DebtReportItem(BaseModel):
    customer_id: str
    customer_name: str
    phone: Optional[str]
    email: Optional[str]
    current_debt: float
    total_lifetime_purchases: float
    total_payments: float
    payment_count: int
    last_payment_date: Optional[str]
    days_since_last_payment: Optional[int]
    unpaid_invoice_count: int
    debt_to_purchases_ratio: float
    payment_history_score: float

class DebtAging(BaseModel):
    current: float
    thirty_days: float = 0  # Changed from 30_days to thirty_days
    sixty_days: float = 0   # Changed from 60_days to sixty_days
    ninety_days_plus: float = 0  # Changed from 90_days_plus to ninety_days_plus

class DebtReportSummary(BaseModel):
    total_customers_with_debt: int
    total_outstanding_debt: float
    average_debt_per_customer: float
    min_debt_filter: float

class DebtReportResponse(BaseModel):
    summary: DebtReportSummary
    debt_aging: DebtAging
    customers: List[DebtReportItem]

class DailySalesData(BaseModel):
    date: str
    total_sales: float
    total_paid: float
    invoice_count: int

class CategorySalesData(BaseModel):
    category: str
    total_sales: float
    total_quantity: int
    percentage: float

class SalesOverviewResponse(BaseModel):
    period: Dict[str, Any]
    daily_sales: List[DailySalesData]
    category_sales: List[CategorySalesData]

class CategoryInventoryData(BaseModel):
    category: str
    item_count: int
    total_stock: int
    total_value: float
    low_stock_items: int

class StockStatusData(BaseModel):
    out_of_stock: int
    low_stock: int
    in_stock: int

class InventoryOverviewResponse(BaseModel):
    category_breakdown: List[CategoryInventoryData]
    stock_status: StockStatusData

class CustomerActivityData(BaseModel):
    date: str
    active_customers: int
    total_sales: float

class TopCustomerData(BaseModel):
    customer_name: str
    recent_purchases: float
    recent_invoices: int

class CustomerDebtDistribution(BaseModel):
    no_debt: int
    low_debt: int
    medium_debt: int
    high_debt: int

class CustomerOverviewResponse(BaseModel):
    period: Dict[str, Any]
    debt_distribution: CustomerDebtDistribution
    recent_activity: List[CustomerActivityData]
    top_customers: List[TopCustomerData]

# Company Settings Schemas
class CompanySettingsBase(BaseModel):
    company_name: Optional[str] = None
    company_logo_url: Optional[str] = None
    company_address: Optional[str] = None
    default_gold_price: Optional[float] = None
    default_labor_percentage: Optional[float] = None
    default_profit_percentage: Optional[float] = None
    default_vat_percentage: Optional[float] = None
    invoice_template: Optional[Dict[str, Any]] = None

class CompanySettingsCreate(CompanySettingsBase):
    pass

class CompanySettingsUpdate(CompanySettingsBase):
    pass

class CompanySettings(CompanySettingsBase):
    id: UUID
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Gold Price Configuration Schemas
class GoldPriceConfig(BaseModel):
    current_price: float
    auto_update_enabled: bool = False
    api_source: Optional[str] = None
    last_updated: Optional[datetime] = None
    update_frequency_hours: int = 24

class GoldPriceUpdate(BaseModel):
    price: float
    source: str = "manual"

# Invoice Template Schemas
class InvoiceTemplateField(BaseModel):
    name: str
    label: str
    type: str  # 'text', 'number', 'date', 'boolean'
    required: bool = False
    position: Dict[str, float]  # x, y coordinates
    style: Dict[str, Any]  # font, size, color, etc.

class InvoiceTemplateSection(BaseModel):
    name: str
    fields: List[InvoiceTemplateField]
    position: Dict[str, float]
    style: Dict[str, Any]

class InvoiceTemplate(BaseModel):
    name: str
    layout: str  # 'portrait', 'landscape'
    page_size: str  # 'A4', 'Letter', etc.
    margins: Dict[str, float]  # top, right, bottom, left
    header: InvoiceTemplateSection
    body: InvoiceTemplateSection
    footer: InvoiceTemplateSection
    styles: Dict[str, Any]  # Global styles

class InvoiceTemplateCreate(BaseModel):
    template: InvoiceTemplate

class InvoiceTemplateUpdate(BaseModel):
    template: InvoiceTemplate

# User Management Schemas (extending existing)
class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    role_id: Optional[UUID] = None
    is_active: Optional[bool] = None

class UserPasswordUpdate(BaseModel):
    current_password: str
    new_password: str

class UserManagement(User):
    role: Optional[Role] = None

class UserListResponse(BaseModel):
    users: List[UserManagement]
    total: int
    page: int
    per_page: int

# Role Management Schemas (extending existing)
class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    permissions: Optional[Dict[str, Any]] = None

class PermissionCategory(BaseModel):
    name: str
    label: str
    permissions: List[Dict[str, str]]  # [{"key": "view_inventory", "label": "View Inventory"}]

class PermissionStructure(BaseModel):
    categories: List[PermissionCategory]

class RoleWithUsers(Role):
    users: List[User] = []

class RoleAssignment(BaseModel):
    user_id: UUID
    role_id: UUID

# Settings Response Schemas
class SystemSettings(BaseModel):
    company: CompanySettings
    gold_price: GoldPriceConfig
    invoice_template: InvoiceTemplate
    permissions: PermissionStructure

class SettingsUpdateResponse(BaseModel):
    success: bool
    message: str
    updated_fields: List[str]

# SMS Template Schemas
class SMSTemplateBase(BaseModel):
    name: str
    template_type: str  # 'promotional', 'debt_reminder'
    message_template: str
    is_active: bool = True

class SMSTemplateCreate(SMSTemplateBase):
    pass

class SMSTemplateUpdate(BaseModel):
    name: Optional[str] = None
    template_type: Optional[str] = None
    message_template: Optional[str] = None
    is_active: Optional[bool] = None

class SMSTemplate(SMSTemplateBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# SMS Campaign Schemas
class SMSCampaignBase(BaseModel):
    name: str
    template_id: Optional[UUID] = None
    message_content: str

class SMSCampaignCreate(SMSCampaignBase):
    customer_ids: List[UUID]  # List of customer IDs to send to

class SMSCampaignUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None

class SMSCampaign(SMSCampaignBase):
    id: UUID
    total_recipients: int
    sent_count: int
    failed_count: int
    status: str
    created_by: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class SMSCampaignWithDetails(SMSCampaign):
    template: Optional[SMSTemplate] = None
    creator: Optional[User] = None

# SMS Message Schemas
class SMSMessageBase(BaseModel):
    campaign_id: UUID
    customer_id: UUID
    phone_number: str
    message_content: str

class SMSMessageCreate(SMSMessageBase):
    pass

class SMSMessageUpdate(BaseModel):
    status: Optional[str] = None
    delivery_status: Optional[str] = None
    gateway_message_id: Optional[str] = None
    error_message: Optional[str] = None
    retry_count: Optional[int] = None
    sent_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None

class SMSMessage(SMSMessageBase):
    id: UUID
    status: str
    delivery_status: Optional[str] = None
    gateway_message_id: Optional[str] = None
    error_message: Optional[str] = None
    retry_count: int
    max_retries: int
    sent_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class SMSMessageWithDetails(SMSMessage):
    customer: Optional[Customer] = None
    campaign: Optional[SMSCampaign] = None

# SMS Batch Sending Schemas
class SMSBatchRequest(BaseModel):
    template_id: Optional[UUID] = None
    message_content: str
    customer_ids: List[UUID]
    campaign_name: str

class SMSBatchResponse(BaseModel):
    campaign_id: UUID
    total_recipients: int
    status: str
    message: str

# SMS Template Processing Schemas
class SMSTemplateVariables(BaseModel):
    customer_name: Optional[str] = None
    debt_amount: Optional[float] = None
    company_name: Optional[str] = None
    phone: Optional[str] = None
    last_purchase_date: Optional[str] = None

class SMSTemplatePreview(BaseModel):
    template_id: UUID
    customer_id: UUID
    preview_message: str

# SMS Statistics Schemas
class SMSCampaignStats(BaseModel):
    campaign_id: UUID
    campaign_name: str
    total_recipients: int
    sent_count: int
    failed_count: int
    delivered_count: int
    pending_count: int
    success_rate: float
    delivery_rate: float
    created_at: datetime
    status: str

class SMSOverallStats(BaseModel):
    total_campaigns: int
    total_messages_sent: int
    total_messages_delivered: int
    overall_success_rate: float
    overall_delivery_rate: float
    recent_campaigns: List[SMSCampaignStats]

# SMS Delivery Status Schemas
class SMSDeliveryStatusUpdate(BaseModel):
    gateway_message_id: str
    delivery_status: str  # 'delivered', 'failed', 'unknown'
    delivered_at: Optional[datetime] = None
    error_message: Optional[str] = None

class SMSRetryRequest(BaseModel):
    message_ids: List[UUID]
    max_retries: Optional[int] = 3

class SMSRetryResponse(BaseModel):
    total_messages: int
    retried_messages: int
    skipped_messages: int
    message: str

# SMS History and Filtering Schemas
class SMSHistoryFilters(BaseModel):
    campaign_id: Optional[UUID] = None
    customer_id: Optional[UUID] = None
    status: Optional[str] = None
    delivery_status: Optional[str] = None
    phone_number: Optional[str] = None
    created_after: Optional[datetime] = None
    created_before: Optional[datetime] = None
    sent_after: Optional[datetime] = None
    sent_before: Optional[datetime] = None

class SMSHistoryResponse(BaseModel):
    messages: List[SMSMessageWithDetails]
    total: int
    page: int
    per_page: int
    total_pages: int

# Analytics Schemas
class AnalyticsDataBase(BaseModel):
    data_type: str
    entity_type: Optional[str] = None
    entity_id: Optional[UUID] = None
    metric_name: str
    metric_value: float
    additional_data: Optional[Dict[str, Any]] = None
    calculation_date: datetime

class AnalyticsDataCreate(AnalyticsDataBase):
    pass

class AnalyticsData(AnalyticsDataBase):
    id: UUID
    calculated_at: datetime
    
    class Config:
        from_attributes = True

# KPI Target Schemas
class KPITargetBase(BaseModel):
    kpi_type: str
    kpi_name: str
    target_period: str
    target_value: float
    period_start: datetime
    period_end: datetime
    is_active: bool = True

class KPITargetCreate(KPITargetBase):
    pass

class KPITargetUpdate(BaseModel):
    target_value: Optional[float] = None
    current_value: Optional[float] = None
    achievement_rate: Optional[float] = None
    trend_direction: Optional[str] = None
    is_active: Optional[bool] = None

class KPITarget(KPITargetBase):
    id: UUID
    current_value: float
    achievement_rate: float
    trend_direction: Optional[str] = None
    created_by: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class KPITargetWithCreator(KPITarget):
    creator: Optional[User] = None

# Advanced Analytics Schemas
class TimeBasedAnalytics(BaseModel):
    daily_patterns: Dict[str, Any]
    weekly_patterns: Dict[str, Any] 
    monthly_trends: Dict[str, Any]
    year_over_year: Dict[str, Any]

class SalesAnalytics(BaseModel):
    total_sales: float
    sales_by_period: Dict[str, float]
    top_selling_items: List[Dict[str, Any]]
    sales_by_category: Dict[str, float]
    growth_rate: float
    trend_direction: str

class InventoryAnalytics(BaseModel):
    total_value: float
    turnover_rate: float
    fast_moving_items: List[Dict[str, Any]]
    slow_moving_items: List[Dict[str, Any]]
    dead_stock_count: int
    stock_optimization_suggestions: List[Dict[str, Any]]

class CustomerAnalytics(BaseModel):
    total_customers: int
    new_customers: int
    retention_rate: float
    average_order_value: float
    customer_lifetime_value: float
    top_customers: List[Dict[str, Any]]

class DashboardAnalytics(BaseModel):
    time_based: TimeBasedAnalytics
    sales: SalesAnalytics
    inventory: InventoryAnalytics
    customers: CustomerAnalytics
    last_updated: datetime

# Analytics Request Schemas
class AnalyticsRequest(BaseModel):
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    data_types: Optional[List[str]] = None
    entity_types: Optional[List[str]] = None
    entity_ids: Optional[List[UUID]] = None

class AnalyticsResponse(BaseModel):
    data: List[AnalyticsData]
    summary: Dict[str, Any]
    total_records: int

# Update forward references
CategoryWithChildren.model_rebuild()
UserWithRole.model_rebuild()
CustomerWithPayments.model_rebuild()
PaymentWithCustomer.model_rebuild()
InvoiceItemWithInventory.model_rebuild()
InvoiceWithDetails.model_rebuild()
UserManagement.model_rebuild()
RoleWithUsers.model_rebuild()
SMSCampaignWithDetails.model_rebuild()
SMSMessageWithDetails.model_rebuild()
KPITargetWithCreator.model_rebuild()