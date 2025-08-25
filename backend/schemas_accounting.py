"""
Double-Entry Accounting System Schemas
Pydantic schemas for accounting API interactions
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal
from enum import Enum

# Enums for accounting system
class AccountType(str, Enum):
    ASSET = "Asset"
    LIABILITY = "Liability"
    EQUITY = "Equity"
    REVENUE = "Revenue"
    EXPENSE = "Expense"

class JournalEntryStatus(str, Enum):
    DRAFT = "draft"
    POSTED = "posted"
    REVERSED = "reversed"

class PeriodType(str, Enum):
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"

class TransactionType(str, Enum):
    DEBIT = "debit"
    CREDIT = "credit"

class ReconciliationStatus(str, Enum):
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    APPROVED = "approved"

class CheckStatus(str, Enum):
    ISSUED = "issued"
    CLEARED = "cleared"
    VOIDED = "voided"
    STOPPED = "stopped"

# Chart of Accounts Schemas
class ChartOfAccountsBase(BaseModel):
    account_code: str = Field(..., max_length=20, description="Unique account code")
    account_name: str = Field(..., max_length=255, description="Account name")
    account_type: AccountType = Field(..., description="Account type")
    parent_id: Optional[str] = Field(None, description="Parent account ID")
    description: Optional[str] = Field(None, description="Account description")
    business_type_config: Optional[Dict[str, Any]] = Field(None, description="Business type specific configuration")

class ChartOfAccountsCreate(ChartOfAccountsBase):
    pass

class ChartOfAccountsUpdate(BaseModel):
    account_name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    is_active: Optional[bool] = None
    business_type_config: Optional[Dict[str, Any]] = None

class ChartOfAccountsResponse(ChartOfAccountsBase):
    id: str
    level: int
    is_active: bool
    is_system_account: bool
    created_at: datetime
    updated_at: datetime
    children: Optional[List['ChartOfAccountsResponse']] = []

    class Config:
        from_attributes = True

# Accounting Period Schemas
class AccountingPeriodBase(BaseModel):
    period_name: str = Field(..., max_length=100, description="Period name")
    start_date: datetime = Field(..., description="Period start date")
    end_date: datetime = Field(..., description="Period end date")
    period_type: PeriodType = Field(..., description="Period type")

    @field_validator('end_date')
    @classmethod
    def validate_end_date(cls, v, info):
        if hasattr(info, 'data') and 'start_date' in info.data and v <= info.data['start_date']:
            raise ValueError('End date must be after start date')
        return v

class AccountingPeriodCreate(AccountingPeriodBase):
    pass

class AccountingPeriodResponse(AccountingPeriodBase):
    id: str
    is_closed: bool
    closed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Journal Entry Line Schemas
class JournalEntryLineBase(BaseModel):
    account_id: str = Field(..., description="Account ID")
    debit_amount: Decimal = Field(default=Decimal('0'), ge=0, description="Debit amount")
    credit_amount: Decimal = Field(default=Decimal('0'), ge=0, description="Credit amount")
    description: Optional[str] = Field(None, description="Line description")
    reference: Optional[str] = Field(None, max_length=100, description="Reference")
    subsidiary_account: Optional[str] = Field(None, max_length=255, description="Subsidiary account")
    cost_center: Optional[str] = Field(None, max_length=100, description="Cost center")
    project_code: Optional[str] = Field(None, max_length=100, description="Project code")

    @field_validator('credit_amount')
    @classmethod
    def validate_amounts(cls, v, info):
        if hasattr(info, 'data') and 'debit_amount' in info.data:
            debit = info.data['debit_amount']
            if debit > 0 and v > 0:
                raise ValueError('Cannot have both debit and credit amounts')
            if debit == 0 and v == 0:
                raise ValueError('Must have either debit or credit amount')
        return v

class JournalEntryLineCreate(JournalEntryLineBase):
    pass

class JournalEntryLineResponse(JournalEntryLineBase):
    id: str
    journal_entry_id: str
    account_name: Optional[str] = None
    account_code: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Journal Entry Schemas
class JournalEntryBase(BaseModel):
    entry_date: datetime = Field(..., description="Entry date")
    reference: Optional[str] = Field(None, max_length=100, description="Reference")
    description: str = Field(..., description="Entry description")
    source_type: Optional[str] = Field(None, max_length=50, description="Source type")
    source_id: Optional[str] = Field(None, description="Source ID")
    requires_approval: bool = Field(default=False, description="Requires approval")

class JournalEntryCreate(JournalEntryBase):
    lines: List[JournalEntryLineCreate] = Field(..., min_items=2, description="Journal entry lines")
    period_id: Optional[str] = Field(None, description="Accounting period ID")

    @field_validator('lines')
    @classmethod
    def validate_balanced_entry(cls, v):
        total_debits = sum(line.debit_amount for line in v)
        total_credits = sum(line.credit_amount for line in v)
        if total_debits != total_credits:
            raise ValueError(f'Entry must be balanced: debits={total_debits}, credits={total_credits}')
        return v

class JournalEntryUpdate(BaseModel):
    entry_date: Optional[datetime] = None
    reference: Optional[str] = None
    description: Optional[str] = None
    status: Optional[JournalEntryStatus] = None

class JournalEntryResponse(JournalEntryBase):
    id: str
    entry_number: str
    total_debit: Decimal
    total_credit: Decimal
    is_balanced: bool
    status: JournalEntryStatus
    period_id: Optional[str]
    approved_by: Optional[str]
    approved_at: Optional[datetime]
    lines: List[JournalEntryLineResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Bank Account Schemas
class BankAccountBase(BaseModel):
    account_name: str = Field(..., max_length=255, description="Account name")
    account_number: str = Field(..., max_length=50, description="Account number")
    bank_name: str = Field(..., max_length=255, description="Bank name")
    account_type: str = Field(..., max_length=50, description="Account type")
    currency: str = Field(default="USD", max_length=3, description="Currency code")
    chart_account_id: Optional[str] = Field(None, description="Chart of accounts mapping")

class BankAccountCreate(BankAccountBase):
    pass

class BankAccountUpdate(BaseModel):
    account_name: Optional[str] = None
    bank_name: Optional[str] = None
    account_type: Optional[str] = None
    currency: Optional[str] = None
    is_active: Optional[bool] = None
    chart_account_id: Optional[str] = None

class BankAccountResponse(BankAccountBase):
    id: str
    current_balance: Decimal
    reconciled_balance: Decimal
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Bank Transaction Schemas
class BankTransactionBase(BaseModel):
    transaction_date: datetime = Field(..., description="Transaction date")
    description: str = Field(..., description="Transaction description")
    reference: Optional[str] = Field(None, max_length=100, description="Reference")
    amount: Decimal = Field(..., description="Transaction amount")
    transaction_type: TransactionType = Field(..., description="Transaction type")

class BankTransactionCreate(BankTransactionBase):
    bank_account_id: str = Field(..., description="Bank account ID")

class BankTransactionResponse(BankTransactionBase):
    id: str
    bank_account_id: str
    is_reconciled: bool
    reconciled_at: Optional[datetime]
    journal_entry_id: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

# Bank Reconciliation Schemas
class BankReconciliationBase(BaseModel):
    reconciliation_date: datetime = Field(..., description="Reconciliation date")
    statement_date: datetime = Field(..., description="Statement date")
    statement_balance: Decimal = Field(..., description="Statement balance")
    book_balance: Decimal = Field(..., description="Book balance")
    outstanding_deposits: Decimal = Field(default=Decimal('0'), description="Outstanding deposits")
    outstanding_checks: Decimal = Field(default=Decimal('0'), description="Outstanding checks")
    bank_charges: Decimal = Field(default=Decimal('0'), description="Bank charges")
    interest_earned: Decimal = Field(default=Decimal('0'), description="Interest earned")

class BankReconciliationCreate(BankReconciliationBase):
    bank_account_id: str = Field(..., description="Bank account ID")

class BankReconciliationUpdate(BaseModel):
    statement_balance: Optional[Decimal] = None
    outstanding_deposits: Optional[Decimal] = None
    outstanding_checks: Optional[Decimal] = None
    bank_charges: Optional[Decimal] = None
    interest_earned: Optional[Decimal] = None
    status: Optional[ReconciliationStatus] = None

class BankReconciliationResponse(BankReconciliationBase):
    id: str
    bank_account_id: str
    adjusted_balance: Decimal
    status: ReconciliationStatus
    is_balanced: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Check Register Schemas
class CheckRegisterBase(BaseModel):
    check_number: str = Field(..., max_length=20, description="Check number")
    check_date: datetime = Field(..., description="Check date")
    payee: str = Field(..., max_length=255, description="Payee")
    amount: Decimal = Field(..., gt=0, description="Check amount")
    memo: Optional[str] = Field(None, description="Memo")

class CheckRegisterCreate(CheckRegisterBase):
    bank_account_id: str = Field(..., description="Bank account ID")

class CheckRegisterUpdate(BaseModel):
    payee: Optional[str] = None
    amount: Optional[Decimal] = None
    memo: Optional[str] = None
    status: Optional[CheckStatus] = None
    cleared_date: Optional[datetime] = None

class CheckRegisterResponse(CheckRegisterBase):
    id: str
    bank_account_id: str
    status: CheckStatus
    cleared_date: Optional[datetime]
    journal_entry_id: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Financial Report Schemas
class TrialBalanceItem(BaseModel):
    account_code: str
    account_name: str
    account_type: str
    debit_balance: Decimal
    credit_balance: Decimal

class TrialBalanceResponse(BaseModel):
    as_of_date: datetime
    total_debits: Decimal
    total_credits: Decimal
    is_balanced: bool
    accounts: List[TrialBalanceItem]

class BalanceSheetItem(BaseModel):
    account_code: str
    account_name: str
    balance: Decimal
    level: int

class BalanceSheetResponse(BaseModel):
    as_of_date: datetime
    assets: List[BalanceSheetItem]
    liabilities: List[BalanceSheetItem]
    equity: List[BalanceSheetItem]
    total_assets: Decimal
    total_liabilities: Decimal
    total_equity: Decimal

class IncomeStatementItem(BaseModel):
    account_code: str
    account_name: str
    amount: Decimal
    level: int

class IncomeStatementResponse(BaseModel):
    start_date: datetime
    end_date: datetime
    revenue: List[IncomeStatementItem]
    expenses: List[IncomeStatementItem]
    total_revenue: Decimal
    total_expenses: Decimal
    net_income: Decimal

class CashFlowItem(BaseModel):
    description: str
    amount: Decimal
    category: str  # operating, investing, financing

class CashFlowResponse(BaseModel):
    start_date: datetime
    end_date: datetime
    operating_activities: List[CashFlowItem]
    investing_activities: List[CashFlowItem]
    financing_activities: List[CashFlowItem]
    net_operating_cash: Decimal
    net_investing_cash: Decimal
    net_financing_cash: Decimal
    net_cash_flow: Decimal

# Ledger Schemas
class GeneralLedgerItem(BaseModel):
    entry_date: datetime
    entry_number: str
    description: str
    reference: Optional[str]
    debit_amount: Decimal
    credit_amount: Decimal
    running_balance: Decimal

class GeneralLedgerResponse(BaseModel):
    account_code: str
    account_name: str
    start_date: datetime
    end_date: datetime
    opening_balance: Decimal
    closing_balance: Decimal
    transactions: List[GeneralLedgerItem]

class SubsidiaryLedgerResponse(BaseModel):
    subsidiary_account: str
    account_code: str
    account_name: str
    start_date: datetime
    end_date: datetime
    opening_balance: Decimal
    closing_balance: Decimal
    transactions: List[GeneralLedgerItem]

# Update forward references
ChartOfAccountsResponse.model_rebuild()