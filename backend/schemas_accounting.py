"""
Enhanced Double-Entry Accounting System Schemas
Comprehensive Pydantic schemas for the accounting system
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any, Union
from datetime import datetime, date
from uuid import UUID
from decimal import Decimal

# Chart of Accounts Schemas
class ChartOfAccountsBase(BaseModel):
    account_code: str = Field(..., description="Unique account code")
    account_name: str = Field(..., description="Account name")
    account_name_persian: Optional[str] = Field(None, description="Persian account name")
    parent_account_id: Optional[UUID] = Field(None, description="Parent account ID")
    account_type: str = Field(..., description="Account type: asset, liability, equity, revenue, expense")
    account_category: str = Field(..., description="Account category")
    allow_manual_entries: bool = Field(default=True, description="Allow manual journal entries")
    requires_subsidiary: bool = Field(default=False, description="Requires subsidiary accounts")
    account_description: Optional[str] = Field(None, description="Account description")
    account_description_persian: Optional[str] = Field(None, description="Persian description")
    account_metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")
    
    @validator('account_type')
    def validate_account_type(cls, v):
        allowed_types = ['asset', 'liability', 'equity', 'revenue', 'expense']
        if v not in allowed_types:
            raise ValueError(f'Account type must be one of: {", ".join(allowed_types)}')
        return v

class ChartOfAccountsCreate(ChartOfAccountsBase):
    pass

class ChartOfAccountsUpdate(BaseModel):
    account_name: Optional[str] = None
    account_name_persian: Optional[str] = None
    parent_account_id: Optional[UUID] = None
    account_category: Optional[str] = None
    allow_manual_entries: Optional[bool] = None
    requires_subsidiary: Optional[bool] = None
    account_description: Optional[str] = None
    account_description_persian: Optional[str] = None
    account_metadata: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None

class ChartOfAccounts(ChartOfAccountsBase):
    id: UUID
    current_balance: Decimal
    debit_balance: Decimal
    credit_balance: Decimal
    is_active: bool
    is_system_account: bool
    created_at: datetime
    updated_at: datetime
    created_by: Optional[UUID] = None
    updated_by: Optional[UUID] = None
    
    class Config:
        from_attributes = True

class ChartOfAccountsWithChildren(ChartOfAccounts):
    child_accounts: List['ChartOfAccountsWithChildren'] = Field(default_factory=list)
    parent_account: Optional['ChartOfAccounts'] = None

# Subsidiary Accounts Schemas
class SubsidiaryAccountBase(BaseModel):
    subsidiary_code: str = Field(..., description="Unique subsidiary code")
    subsidiary_name: str = Field(..., description="Subsidiary name")
    subsidiary_name_persian: Optional[str] = Field(None, description="Persian subsidiary name")
    main_account_id: UUID = Field(..., description="Main account ID")
    subsidiary_type: str = Field(..., description="Subsidiary type")
    reference_id: Optional[UUID] = Field(None, description="Reference ID (customer, vendor, etc.)")
    reference_type: Optional[str] = Field(None, description="Reference type")
    credit_limit: Decimal = Field(default=0, description="Credit limit")
    payment_terms_days: int = Field(default=0, description="Payment terms in days")
    description: Optional[str] = Field(None, description="Description")
    description_persian: Optional[str] = Field(None, description="Persian description")
    contact_info: Dict[str, Any] = Field(default_factory=dict, description="Contact information")
    subsidiary_metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")

class SubsidiaryAccountCreate(SubsidiaryAccountBase):
    pass

class SubsidiaryAccountUpdate(BaseModel):
    subsidiary_name: Optional[str] = None
    subsidiary_name_persian: Optional[str] = None
    subsidiary_type: Optional[str] = None
    reference_id: Optional[UUID] = None
    reference_type: Optional[str] = None
    credit_limit: Optional[Decimal] = None
    payment_terms_days: Optional[int] = None
    description: Optional[str] = None
    description_persian: Optional[str] = None
    contact_info: Optional[Dict[str, Any]] = None
    subsidiary_metadata: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None
    is_blocked: Optional[bool] = None
    block_reason: Optional[str] = None

class SubsidiaryAccount(SubsidiaryAccountBase):
    id: UUID
    current_balance: Decimal
    debit_balance: Decimal
    credit_balance: Decimal
    is_active: bool
    is_blocked: bool
    block_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    created_by: Optional[UUID] = None
    updated_by: Optional[UUID] = None
    
    class Config:
        from_attributes = True

class SubsidiaryAccountWithMainAccount(SubsidiaryAccount):
    main_account: Optional[ChartOfAccounts] = None

# Journal Entry Schemas
class JournalEntryLineBase(BaseModel):
    line_number: int = Field(..., description="Line number within the entry")
    account_id: UUID = Field(..., description="Account ID")
    subsidiary_account_id: Optional[UUID] = Field(None, description="Subsidiary account ID")
    debit_amount: Decimal = Field(default=0, description="Debit amount")
    credit_amount: Decimal = Field(default=0, description="Credit amount")
    description: Optional[str] = Field(None, description="Line description")
    description_persian: Optional[str] = Field(None, description="Persian description")
    quantity: Optional[Decimal] = Field(None, description="Quantity")
    unit_price: Optional[Decimal] = Field(None, description="Unit price")
    reference_type: Optional[str] = Field(None, description="Reference type")
    reference_id: Optional[UUID] = Field(None, description="Reference ID")
    reference_number: Optional[str] = Field(None, description="Reference number")
    line_metadata: Dict[str, Any] = Field(default_factory=dict, description="Line metadata")
    
    @validator('debit_amount', 'credit_amount')
    def validate_amounts(cls, v):
        if v < 0:
            raise ValueError('Amounts must be non-negative')
        return v
    
    @validator('credit_amount')
    def validate_debit_credit_exclusive(cls, v, values):
        debit = values.get('debit_amount', 0)
        if debit > 0 and v > 0:
            raise ValueError('A line cannot have both debit and credit amounts')
        if debit == 0 and v == 0:
            raise ValueError('A line must have either debit or credit amount')
        return v

class JournalEntryLineCreate(JournalEntryLineBase):
    pass

class JournalEntryLineUpdate(BaseModel):
    account_id: Optional[UUID] = None
    subsidiary_account_id: Optional[UUID] = None
    debit_amount: Optional[Decimal] = None
    credit_amount: Optional[Decimal] = None
    description: Optional[str] = None
    description_persian: Optional[str] = None
    quantity: Optional[Decimal] = None
    unit_price: Optional[Decimal] = None
    reference_type: Optional[str] = None
    reference_id: Optional[UUID] = None
    reference_number: Optional[str] = None
    line_metadata: Optional[Dict[str, Any]] = None

class JournalEntryLine(JournalEntryLineBase):
    id: UUID
    journal_entry_id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True

class JournalEntryLineWithAccount(JournalEntryLine):
    account: Optional[ChartOfAccounts] = None
    subsidiary_account: Optional[SubsidiaryAccount] = None

class JournalEntryBase(BaseModel):
    entry_date: date = Field(..., description="Entry date")
    description: str = Field(..., description="Entry description")
    description_persian: Optional[str] = Field(None, description="Persian description")
    reference_number: Optional[str] = Field(None, description="Reference number")
    source_type: str = Field(..., description="Source type")
    source_id: Optional[UUID] = Field(None, description="Source ID")
    accounting_period: Optional[str] = Field(None, description="Accounting period (YYYY-MM)")
    fiscal_year: Optional[int] = Field(None, description="Fiscal year")
    gold_sood_amount: Optional[Decimal] = Field(None, description="سود amount")
    gold_ojrat_amount: Optional[Decimal] = Field(None, description="اجرت amount")
    gold_maliyat_amount: Optional[Decimal] = Field(None, description="مالیات amount")
    entry_metadata: Dict[str, Any] = Field(default_factory=dict, description="Entry metadata")
    
    @validator('source_type')
    def validate_source_type(cls, v):
        allowed_types = ['invoice', 'payment', 'adjustment', 'manual', 'closing', 'opening']
        if v not in allowed_types:
            raise ValueError(f'Source type must be one of: {", ".join(allowed_types)}')
        return v

class JournalEntryCreate(JournalEntryBase):
    journal_lines: List[JournalEntryLineCreate] = Field(..., description="Journal entry lines")
    
    @validator('journal_lines')
    def validate_balanced_entry(cls, v):
        if len(v) < 2:
            raise ValueError('Journal entry must have at least 2 lines')
        
        total_debit = sum(line.debit_amount for line in v)
        total_credit = sum(line.credit_amount for line in v)
        
        if abs(total_debit - total_credit) > 0.01:  # Allow for small rounding differences
            raise ValueError(f'Journal entry must be balanced. Debit: {total_debit}, Credit: {total_credit}')
        
        return v

class JournalEntryUpdate(BaseModel):
    entry_date: Optional[date] = None
    description: Optional[str] = None
    description_persian: Optional[str] = None
    reference_number: Optional[str] = None
    accounting_period: Optional[str] = None
    fiscal_year: Optional[int] = None
    gold_sood_amount: Optional[Decimal] = None
    gold_ojrat_amount: Optional[Decimal] = None
    gold_maliyat_amount: Optional[Decimal] = None
    entry_metadata: Optional[Dict[str, Any]] = None

class JournalEntry(JournalEntryBase):
    id: UUID
    entry_number: str
    total_debit: Decimal
    total_credit: Decimal
    is_balanced: bool
    status: str
    posted_at: Optional[datetime] = None
    posted_by: Optional[UUID] = None
    is_period_locked: bool
    reversed_entry_id: Optional[UUID] = None
    reversal_reason: Optional[str] = None
    reversed_at: Optional[datetime] = None
    reversed_by: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
    created_by: Optional[UUID] = None
    updated_by: Optional[UUID] = None
    
    class Config:
        from_attributes = True

class JournalEntryWithLines(JournalEntry):
    journal_lines: List[JournalEntryLineWithAccount] = Field(default_factory=list)

# Check Management Schemas
class CheckManagementBase(BaseModel):
    check_number: str = Field(..., description="Check number")
    bank_name: str = Field(..., description="Bank name")
    bank_name_persian: Optional[str] = Field(None, description="Persian bank name")
    branch_name: Optional[str] = Field(None, description="Branch name")
    check_amount: Decimal = Field(..., description="Check amount")
    check_date: date = Field(..., description="Check date")
    due_date: date = Field(..., description="Due date")
    check_type: str = Field(..., description="Check type: received or issued")
    drawer_name: Optional[str] = Field(None, description="Check writer name")
    drawer_account: Optional[str] = Field(None, description="Drawer account")
    payee_name: Optional[str] = Field(None, description="Payee name")
    customer_id: Optional[UUID] = Field(None, description="Customer ID")
    vendor_id: Optional[UUID] = Field(None, description="Vendor ID")
    subsidiary_account_id: Optional[UUID] = Field(None, description="Subsidiary account ID")
    invoice_id: Optional[UUID] = Field(None, description="Related invoice ID")
    payment_id: Optional[UUID] = Field(None, description="Related payment ID")
    is_post_dated: bool = Field(default=False, description="Is post-dated check")
    notes: Optional[str] = Field(None, description="Notes")
    notes_persian: Optional[str] = Field(None, description="Persian notes")
    check_metadata: Dict[str, Any] = Field(default_factory=dict, description="Check metadata")
    
    @validator('check_type')
    def validate_check_type(cls, v):
        if v not in ['received', 'issued']:
            raise ValueError('Check type must be either "received" or "issued"')
        return v
    
    @validator('check_amount')
    def validate_positive_amount(cls, v):
        if v <= 0:
            raise ValueError('Check amount must be positive')
        return v

class CheckManagementCreate(CheckManagementBase):
    pass

class CheckManagementUpdate(BaseModel):
    check_status: Optional[str] = Field(None, description="Check status")
    transaction_date: Optional[date] = None
    deposit_date: Optional[date] = None
    clear_date: Optional[date] = None
    bounce_date: Optional[date] = None
    bounce_reason: Optional[str] = None
    bounce_fee: Optional[Decimal] = None
    notes: Optional[str] = None
    notes_persian: Optional[str] = None
    check_metadata: Optional[Dict[str, Any]] = None

class CheckManagement(CheckManagementBase):
    id: UUID
    check_status: str
    transaction_date: Optional[date] = None
    deposit_date: Optional[date] = None
    clear_date: Optional[date] = None
    bounce_date: Optional[date] = None
    bounce_reason: Optional[str] = None
    bounce_fee: Decimal
    journal_entry_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
    created_by: Optional[UUID] = None
    updated_by: Optional[UUID] = None
    
    class Config:
        from_attributes = True

class CheckManagementWithDetails(CheckManagement):
    subsidiary_account: Optional[SubsidiaryAccount] = None
    journal_entry: Optional[JournalEntry] = None

# Installment Account Schemas
class InstallmentAccountBase(BaseModel):
    installment_number: str = Field(..., description="Installment number")
    customer_id: UUID = Field(..., description="Customer ID")
    subsidiary_account_id: Optional[UUID] = Field(None, description="Subsidiary account ID")
    total_amount: Decimal = Field(..., description="Total amount")
    down_payment: Decimal = Field(default=0, description="Down payment")
    installment_amount: Decimal = Field(..., description="Installment amount")
    number_of_installments: int = Field(..., description="Number of installments")
    installment_frequency: str = Field(default='monthly', description="Installment frequency")
    interest_rate: Decimal = Field(default=0, description="Interest rate")
    late_fee_rate: Decimal = Field(default=0, description="Late fee rate")
    processing_fee: Decimal = Field(default=0, description="Processing fee")
    start_date: date = Field(..., description="Start date")
    end_date: date = Field(..., description="End date")
    invoice_id: Optional[UUID] = Field(None, description="Related invoice ID")
    contract_number: Optional[str] = Field(None, description="Contract number")
    terms_and_conditions: Optional[str] = Field(None, description="Terms and conditions")
    notes: Optional[str] = Field(None, description="Notes")
    notes_persian: Optional[str] = Field(None, description="Persian notes")
    installment_metadata: Dict[str, Any] = Field(default_factory=dict, description="Installment metadata")
    
    @validator('installment_frequency')
    def validate_frequency(cls, v):
        allowed_frequencies = ['weekly', 'monthly', 'quarterly', 'yearly']
        if v not in allowed_frequencies:
            raise ValueError(f'Installment frequency must be one of: {", ".join(allowed_frequencies)}')
        return v
    
    @validator('total_amount', 'installment_amount')
    def validate_positive_amounts(cls, v):
        if v <= 0:
            raise ValueError('Amounts must be positive')
        return v
    
    @validator('number_of_installments')
    def validate_positive_installments(cls, v):
        if v <= 0:
            raise ValueError('Number of installments must be positive')
        return v

class InstallmentAccountCreate(InstallmentAccountBase):
    pass

class InstallmentAccountUpdate(BaseModel):
    status: Optional[str] = None
    next_due_date: Optional[date] = None
    paid_installments: Optional[int] = None
    total_paid: Optional[Decimal] = None
    remaining_balance: Optional[Decimal] = None
    days_overdue: Optional[int] = None
    overdue_amount: Optional[Decimal] = None
    last_payment_date: Optional[date] = None
    notes: Optional[str] = None
    notes_persian: Optional[str] = None
    installment_metadata: Optional[Dict[str, Any]] = None

class InstallmentAccount(InstallmentAccountBase):
    id: UUID
    status: str
    next_due_date: Optional[date] = None
    paid_installments: int
    remaining_installments: Optional[int] = None
    total_paid: Decimal
    remaining_balance: Optional[Decimal] = None
    days_overdue: int
    overdue_amount: Decimal
    last_payment_date: Optional[date] = None
    created_at: datetime
    updated_at: datetime
    created_by: Optional[UUID] = None
    updated_by: Optional[UUID] = None
    
    class Config:
        from_attributes = True

class InstallmentPaymentBase(BaseModel):
    payment_number: int = Field(..., description="Payment number")
    due_date: date = Field(..., description="Due date")
    due_amount: Decimal = Field(..., description="Due amount")
    interest_amount: Decimal = Field(default=0, description="Interest amount")
    late_fee: Decimal = Field(default=0, description="Late fee")
    payment_method: Optional[str] = Field(None, description="Payment method")
    payment_reference: Optional[str] = Field(None, description="Payment reference")
    notes: Optional[str] = Field(None, description="Notes")

class InstallmentPaymentCreate(InstallmentPaymentBase):
    installment_account_id: UUID = Field(..., description="Installment account ID")

class InstallmentPaymentUpdate(BaseModel):
    payment_date: Optional[date] = None
    paid_amount: Optional[Decimal] = None
    status: Optional[str] = None
    payment_method: Optional[str] = None
    payment_reference: Optional[str] = None
    notes: Optional[str] = None

class InstallmentPayment(InstallmentPaymentBase):
    id: UUID
    installment_account_id: UUID
    payment_date: Optional[date] = None
    paid_amount: Decimal
    remaining_amount: Optional[Decimal] = None
    total_amount_due: Optional[Decimal] = None
    status: str
    days_overdue: int
    journal_entry_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class InstallmentAccountWithPayments(InstallmentAccount):
    installment_payments: List[InstallmentPayment] = Field(default_factory=list)
    subsidiary_account: Optional[SubsidiaryAccount] = None

# Bank Reconciliation Schemas
class BankReconciliationItemBase(BaseModel):
    item_type: str = Field(..., description="Item type")
    description: str = Field(..., description="Description")
    amount: Decimal = Field(..., description="Amount")
    reference_type: Optional[str] = Field(None, description="Reference type")
    reference_id: Optional[UUID] = Field(None, description="Reference ID")
    reference_number: Optional[str] = Field(None, description="Reference number")
    
    @validator('item_type')
    def validate_item_type(cls, v):
        allowed_types = ['deposit_in_transit', 'outstanding_check', 'bank_error', 'book_error']
        if v not in allowed_types:
            raise ValueError(f'Item type must be one of: {", ".join(allowed_types)}')
        return v

class BankReconciliationItemCreate(BankReconciliationItemBase):
    pass

class BankReconciliationItem(BankReconciliationItemBase):
    id: UUID
    reconciliation_id: UUID
    is_reconciled: bool
    reconciled_date: Optional[date] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class BankReconciliationBase(BaseModel):
    reconciliation_date: date = Field(..., description="Reconciliation date")
    bank_account_id: UUID = Field(..., description="Bank account ID")
    book_balance: Decimal = Field(..., description="Book balance")
    bank_statement_balance: Decimal = Field(..., description="Bank statement balance")
    period_start: date = Field(..., description="Period start date")
    period_end: date = Field(..., description="Period end date")
    notes: Optional[str] = Field(None, description="Notes")
    reconciliation_metadata: Dict[str, Any] = Field(default_factory=dict, description="Reconciliation metadata")

class BankReconciliationCreate(BankReconciliationBase):
    reconciliation_items: List[BankReconciliationItemCreate] = Field(default_factory=list, description="Reconciliation items")

class BankReconciliationUpdate(BaseModel):
    reconciled_balance: Optional[Decimal] = None
    difference: Optional[Decimal] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    reconciliation_metadata: Optional[Dict[str, Any]] = None

class BankReconciliation(BankReconciliationBase):
    id: UUID
    reconciled_balance: Optional[Decimal] = None
    difference: Optional[Decimal] = None
    status: str
    reconciled_by: Optional[UUID] = None
    reconciled_at: Optional[datetime] = None
    reviewed_by: Optional[UUID] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    created_by: Optional[UUID] = None
    
    class Config:
        from_attributes = True

class BankReconciliationWithItems(BankReconciliation):
    bank_account: Optional[ChartOfAccounts] = None
    reconciliation_items: List[BankReconciliationItem] = Field(default_factory=list)

# Accounting Period Schemas
class AccountingPeriodBase(BaseModel):
    period_code: str = Field(..., description="Period code (YYYY-MM)")
    period_name: str = Field(..., description="Period name")
    period_name_persian: Optional[str] = Field(None, description="Persian period name")
    start_date: date = Field(..., description="Start date")
    end_date: date = Field(..., description="End date")
    fiscal_year: int = Field(..., description="Fiscal year")
    is_year_end: bool = Field(default=False, description="Is year end period")
    period_metadata: Dict[str, Any] = Field(default_factory=dict, description="Period metadata")
    
    @validator('period_code')
    def validate_period_code(cls, v):
        import re
        if not re.match(r'^\d{4}-\d{2}$', v):
            raise ValueError('Period code must be in YYYY-MM format')
        return v
    
    @validator('end_date')
    def validate_date_order(cls, v, values):
        start_date = values.get('start_date')
        if start_date and v <= start_date:
            raise ValueError('End date must be after start date')
        return v

class AccountingPeriodCreate(AccountingPeriodBase):
    pass

class AccountingPeriodUpdate(BaseModel):
    period_name: Optional[str] = None
    period_name_persian: Optional[str] = None
    status: Optional[str] = None
    is_locked: Optional[bool] = None
    lock_reason: Optional[str] = None
    period_metadata: Optional[Dict[str, Any]] = None

class AccountingPeriod(AccountingPeriodBase):
    id: UUID
    status: str
    is_locked: bool
    locked_by: Optional[UUID] = None
    locked_at: Optional[datetime] = None
    lock_reason: Optional[str] = None
    closed_by: Optional[UUID] = None
    closed_at: Optional[datetime] = None
    closing_entries_generated: bool
    created_at: datetime
    updated_at: datetime
    created_by: Optional[UUID] = None
    
    class Config:
        from_attributes = True

# Financial Reports Schemas
class TrialBalanceItem(BaseModel):
    account_code: str
    account_name: str
    account_name_persian: Optional[str] = None
    account_type: str
    debit_balance: Decimal
    credit_balance: Decimal
    net_balance: Decimal

class TrialBalance(BaseModel):
    as_of_date: date
    total_debits: Decimal
    total_credits: Decimal
    is_balanced: bool
    accounts: List[TrialBalanceItem]

class BalanceSheetItem(BaseModel):
    account_code: str
    account_name: str
    account_name_persian: Optional[str] = None
    amount: Decimal
    percentage: Optional[Decimal] = None

class BalanceSheetSection(BaseModel):
    section_name: str
    section_name_persian: Optional[str] = None
    items: List[BalanceSheetItem]
    total: Decimal

class BalanceSheet(BaseModel):
    as_of_date: date
    assets: BalanceSheetSection
    liabilities: BalanceSheetSection
    equity: BalanceSheetSection
    total_assets: Decimal
    total_liabilities_equity: Decimal
    is_balanced: bool

class ProfitLossItem(BaseModel):
    account_code: str
    account_name: str
    account_name_persian: Optional[str] = None
    amount: Decimal
    percentage: Optional[Decimal] = None

class ProfitLossSection(BaseModel):
    section_name: str
    section_name_persian: Optional[str] = None
    items: List[ProfitLossItem]
    total: Decimal

class ProfitLossStatement(BaseModel):
    period_start: date
    period_end: date
    revenue: ProfitLossSection
    expenses: ProfitLossSection
    gross_profit: Decimal
    net_profit: Decimal
    profit_margin: Optional[Decimal] = None

class CashFlowItem(BaseModel):
    description: str
    description_persian: Optional[str] = None
    amount: Decimal

class CashFlowSection(BaseModel):
    section_name: str
    section_name_persian: Optional[str] = None
    items: List[CashFlowItem]
    total: Decimal

class CashFlowStatement(BaseModel):
    period_start: date
    period_end: date
    operating_activities: CashFlowSection
    investing_activities: CashFlowSection
    financing_activities: CashFlowSection
    net_cash_flow: Decimal
    beginning_cash: Decimal
    ending_cash: Decimal

# Audit Trail Schemas
class AccountingAuditTrailBase(BaseModel):
    table_name: str = Field(..., description="Table name")
    record_id: UUID = Field(..., description="Record ID")
    operation: str = Field(..., description="Operation type")
    old_values: Optional[Dict[str, Any]] = Field(None, description="Old values")
    new_values: Optional[Dict[str, Any]] = Field(None, description="New values")
    changed_fields: Optional[List[str]] = Field(None, description="Changed fields")
    change_reason: Optional[str] = Field(None, description="Change reason")
    change_description: Optional[str] = Field(None, description="Change description")
    business_context: Dict[str, Any] = Field(default_factory=dict, description="Business context")
    
    @validator('operation')
    def validate_operation(cls, v):
        if v not in ['insert', 'update', 'delete']:
            raise ValueError('Operation must be one of: insert, update, delete')
        return v

class AccountingAuditTrail(AccountingAuditTrailBase):
    id: UUID
    user_id: Optional[UUID] = None
    session_id: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    changed_at: datetime
    
    class Config:
        from_attributes = True

# Search and Filter Schemas
class JournalEntryFilters(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    account_id: Optional[UUID] = None
    subsidiary_account_id: Optional[UUID] = None
    source_type: Optional[str] = None
    status: Optional[str] = None
    entry_number: Optional[str] = None
    description: Optional[str] = None
    accounting_period: Optional[str] = None
    fiscal_year: Optional[int] = None
    min_amount: Optional[Decimal] = None
    max_amount: Optional[Decimal] = None

class CheckFilters(BaseModel):
    check_type: Optional[str] = None
    check_status: Optional[str] = None
    bank_name: Optional[str] = None
    customer_id: Optional[UUID] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    min_amount: Optional[Decimal] = None
    max_amount: Optional[Decimal] = None

class InstallmentFilters(BaseModel):
    customer_id: Optional[UUID] = None
    status: Optional[str] = None
    overdue_only: bool = Field(default=False)
    due_date_from: Optional[date] = None
    due_date_to: Optional[date] = None

# Response Schemas
class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    per_page: int
    total_pages: int
    has_next: bool
    has_prev: bool

class AccountingDashboard(BaseModel):
    total_assets: Decimal
    total_liabilities: Decimal
    total_equity: Decimal
    monthly_revenue: Decimal
    monthly_expenses: Decimal
    net_profit: Decimal
    cash_balance: Decimal
    accounts_receivable: Decimal
    accounts_payable: Decimal
    pending_checks: int
    overdue_installments: int
    recent_transactions: List[JournalEntry]

# Gold-specific Accounting Schemas
class GoldAccountingEntry(BaseModel):
    invoice_id: UUID
    invoice_number: str
    sood_amount: Decimal  # سود
    ojrat_amount: Decimal  # اجرت
    maliyat_amount: Decimal  # مالیات
    total_amount: Decimal
    journal_entry_id: UUID
    created_at: datetime

class GoldAccountingSummary(BaseModel):
    period_start: date
    period_end: date
    total_sood: Decimal
    total_ojrat: Decimal
    total_maliyat: Decimal
    total_gold_sales: Decimal
    average_sood_percentage: Decimal
    average_ojrat_percentage: Decimal
    average_maliyat_percentage: Decimal