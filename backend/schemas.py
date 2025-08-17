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
class CategoryBase(BaseModel):
    name: str
    parent_id: Optional[UUID] = None
    description: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    parent_id: Optional[UUID] = None
    description: Optional[str] = None

class Category(CategoryBase):
    id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True

class CategoryWithChildren(Category):
    children: List['CategoryWithChildren'] = []
    parent: Optional['Category'] = None

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

# Update forward references
CategoryWithChildren.model_rebuild()
UserWithRole.model_rebuild()
CustomerWithPayments.model_rebuild()
PaymentWithCustomer.model_rebuild()
InvoiceItemWithInventory.model_rebuild()
InvoiceWithDetails.model_rebuild()