"""
Enhanced Double-Entry Accounting System Models
Comprehensive accounting models for the universal inventory and invoice management system
"""

from sqlalchemy import Column, String, Integer, Boolean, DateTime, Date, Text, DECIMAL, ForeignKey, Index, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.sql import func
from sqlalchemy.types import TypeDecorator, String as SQLString
import uuid

Base = declarative_base()

# Chart of Accounts
class ChartOfAccounts(Base):
    __tablename__ = "chart_of_accounts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    account_code = Column(String(20), unique=True, nullable=False)
    account_name = Column(String(255), nullable=False)
    account_name_persian = Column(String(255))
    parent_account_id = Column(UUID(as_uuid=True), ForeignKey("chart_of_accounts.id"))
    account_type = Column(String(50), nullable=False)  # asset, liability, equity, revenue, expense
    account_category = Column(String(100), nullable=False)  # current_asset, fixed_asset, etc.
    
    # Account properties
    is_active = Column(Boolean, default=True)
    is_system_account = Column(Boolean, default=False)
    allow_manual_entries = Column(Boolean, default=True)
    requires_subsidiary = Column(Boolean, default=False)
    
    # Balance tracking
    current_balance = Column(DECIMAL(15,2), default=0)
    debit_balance = Column(DECIMAL(15,2), default=0)
    credit_balance = Column(DECIMAL(15,2), default=0)
    
    # Persian terminology
    account_description = Column(Text)
    account_description_persian = Column(Text)
    
    # Metadata
    account_metadata = Column(JSONB, default={})
    
    # Audit trail
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_by = Column(UUID(as_uuid=True))
    updated_by = Column(UUID(as_uuid=True))
    
    # Relationships
    parent_account = relationship("ChartOfAccounts", remote_side=[id], back_populates="child_accounts")
    child_accounts = relationship("ChartOfAccounts", back_populates="parent_account", cascade="all, delete-orphan")
    journal_entries = relationship("JournalEntryLine", back_populates="account")
    subsidiary_accounts = relationship("SubsidiaryAccount", back_populates="main_account")
    
    __table_args__ = (
        Index('idx_chart_accounts_code', 'account_code'),
        Index('idx_chart_accounts_type', 'account_type'),
        Index('idx_chart_accounts_category', 'account_category'),
        Index('idx_chart_accounts_parent', 'parent_account_id'),
        Index('idx_chart_accounts_active', 'is_active'),
        CheckConstraint('account_type IN (\'asset\', \'liability\', \'equity\', \'revenue\', \'expense\')', name='check_account_type'),
    )

# Subsidiary Accounts (حساب‌های تفصیلی)
class SubsidiaryAccount(Base):
    __tablename__ = "subsidiary_accounts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    subsidiary_code = Column(String(50), unique=True, nullable=False)
    subsidiary_name = Column(String(255), nullable=False)
    subsidiary_name_persian = Column(String(255))
    main_account_id = Column(UUID(as_uuid=True), ForeignKey("chart_of_accounts.id"), nullable=False)
    
    # Subsidiary properties
    subsidiary_type = Column(String(50), nullable=False)  # customer, vendor, employee, asset, etc.
    reference_id = Column(UUID(as_uuid=True))  # Links to customer, vendor, etc.
    reference_type = Column(String(50))  # 'customer', 'vendor', 'employee', etc.
    
    # Balance tracking
    current_balance = Column(DECIMAL(15,2), default=0)
    debit_balance = Column(DECIMAL(15,2), default=0)
    credit_balance = Column(DECIMAL(15,2), default=0)
    
    # Credit management
    credit_limit = Column(DECIMAL(15,2), default=0)
    payment_terms_days = Column(Integer, default=0)
    
    # Status
    is_active = Column(Boolean, default=True)
    is_blocked = Column(Boolean, default=False)
    block_reason = Column(Text)
    
    # Persian terminology and descriptions
    description = Column(Text)
    description_persian = Column(Text)
    
    # Contact information
    contact_info = Column(JSONB, default={})
    
    # Metadata
    subsidiary_metadata = Column(JSONB, default={})
    
    # Audit trail
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_by = Column(UUID(as_uuid=True))
    updated_by = Column(UUID(as_uuid=True))
    
    # Relationships
    main_account = relationship("ChartOfAccounts", back_populates="subsidiary_accounts")
    journal_entries = relationship("JournalEntryLine", back_populates="subsidiary_account")
    
    __table_args__ = (
        Index('idx_subsidiary_accounts_code', 'subsidiary_code'),
        Index('idx_subsidiary_accounts_main', 'main_account_id'),
        Index('idx_subsidiary_accounts_type', 'subsidiary_type'),
        Index('idx_subsidiary_accounts_reference', 'reference_type', 'reference_id'),
        Index('idx_subsidiary_accounts_active', 'is_active'),
    )

# Journal Entries (Double-Entry System)
class JournalEntry(Base):
    __tablename__ = "journal_entries"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entry_number = Column(String(50), unique=True, nullable=False)
    entry_date = Column(Date, nullable=False)
    
    # Entry details
    description = Column(Text, nullable=False)
    description_persian = Column(Text)
    reference_number = Column(String(100))
    
    # Source tracking
    source_type = Column(String(50), nullable=False)  # 'invoice', 'payment', 'adjustment', 'manual'
    source_id = Column(UUID(as_uuid=True))
    
    # Totals (must balance)
    total_debit = Column(DECIMAL(15,2), nullable=False, default=0)
    total_credit = Column(DECIMAL(15,2), nullable=False, default=0)
    is_balanced = Column(Boolean, default=False)
    
    # Status and workflow
    status = Column(String(20), default='draft')  # draft, posted, reversed
    posted_at = Column(DateTime(timezone=True))
    posted_by = Column(UUID(as_uuid=True))
    
    # Period management
    accounting_period = Column(String(7))  # YYYY-MM format
    fiscal_year = Column(Integer)
    is_period_locked = Column(Boolean, default=False)
    
    # Reversal tracking
    reversed_entry_id = Column(UUID(as_uuid=True), ForeignKey("journal_entries.id"))
    reversal_reason = Column(Text)
    reversed_at = Column(DateTime(timezone=True))
    reversed_by = Column(UUID(as_uuid=True))
    
    # Gold-specific fields for automatic entries
    gold_sood_amount = Column(DECIMAL(15,2))  # سود
    gold_ojrat_amount = Column(DECIMAL(15,2))  # اجرت
    gold_maliyat_amount = Column(DECIMAL(15,2))  # مالیات
    
    # Metadata
    entry_metadata = Column(JSONB, default={})
    
    # Audit trail
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_by = Column(UUID(as_uuid=True))
    updated_by = Column(UUID(as_uuid=True))
    
    # Relationships
    journal_lines = relationship("JournalEntryLine", back_populates="journal_entry", cascade="all, delete-orphan")
    reversed_entry = relationship("JournalEntry", remote_side=[id])
    
    __table_args__ = (
        Index('idx_journal_entries_number', 'entry_number'),
        Index('idx_journal_entries_date', 'entry_date'),
        Index('idx_journal_entries_source', 'source_type', 'source_id'),
        Index('idx_journal_entries_period', 'accounting_period'),
        Index('idx_journal_entries_status', 'status'),
        Index('idx_journal_entries_posted', 'posted_at'),
        CheckConstraint('status IN (\'draft\', \'posted\', \'reversed\')', name='check_entry_status'),
        CheckConstraint('total_debit >= 0 AND total_credit >= 0', name='check_positive_amounts'),
    )

# Journal Entry Lines (Individual Debit/Credit Lines)
class JournalEntryLine(Base):
    __tablename__ = "journal_entry_lines"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    journal_entry_id = Column(UUID(as_uuid=True), ForeignKey("journal_entries.id", ondelete="CASCADE"), nullable=False)
    line_number = Column(Integer, nullable=False)
    
    # Account information
    account_id = Column(UUID(as_uuid=True), ForeignKey("chart_of_accounts.id"), nullable=False)
    subsidiary_account_id = Column(UUID(as_uuid=True), ForeignKey("subsidiary_accounts.id"))
    
    # Amounts (one must be zero, the other positive)
    debit_amount = Column(DECIMAL(15,2), default=0)
    credit_amount = Column(DECIMAL(15,2), default=0)
    
    # Line details
    description = Column(Text)
    description_persian = Column(Text)
    
    # Additional tracking
    quantity = Column(DECIMAL(15,3))
    unit_price = Column(DECIMAL(15,2))
    
    # Reference information
    reference_type = Column(String(50))
    reference_id = Column(UUID(as_uuid=True))
    reference_number = Column(String(100))
    
    # Metadata
    line_metadata = Column(JSONB, default={})
    
    # Audit trail
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    journal_entry = relationship("JournalEntry", back_populates="journal_lines")
    account = relationship("ChartOfAccounts", back_populates="journal_entries")
    subsidiary_account = relationship("SubsidiaryAccount", back_populates="journal_entries")
    
    __table_args__ = (
        Index('idx_journal_lines_entry', 'journal_entry_id'),
        Index('idx_journal_lines_account', 'account_id'),
        Index('idx_journal_lines_subsidiary', 'subsidiary_account_id'),
        Index('idx_journal_lines_reference', 'reference_type', 'reference_id'),
        CheckConstraint('(debit_amount > 0 AND credit_amount = 0) OR (debit_amount = 0 AND credit_amount > 0)', name='check_debit_credit_exclusive'),
        CheckConstraint('debit_amount >= 0 AND credit_amount >= 0', name='check_positive_line_amounts'),
    )

# Check Management System (مدیریت چک‌ها)
class CheckManagement(Base):
    __tablename__ = "check_management"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    check_number = Column(String(50), nullable=False)
    bank_name = Column(String(255), nullable=False)
    bank_name_persian = Column(String(255))
    branch_name = Column(String(255))
    
    # Check details
    check_amount = Column(DECIMAL(15,2), nullable=False)
    check_date = Column(Date, nullable=False)
    due_date = Column(Date, nullable=False)
    
    # Check type and direction
    check_type = Column(String(20), nullable=False)  # 'received', 'issued'
    check_status = Column(String(20), default='pending')  # pending, deposited, cleared, bounced, cancelled
    
    # Parties involved
    drawer_name = Column(String(255))  # Check writer
    drawer_account = Column(String(100))
    payee_name = Column(String(255))  # Check recipient
    
    # Customer/Vendor relationship
    customer_id = Column(UUID(as_uuid=True))
    vendor_id = Column(UUID(as_uuid=True))
    subsidiary_account_id = Column(UUID(as_uuid=True), ForeignKey("subsidiary_accounts.id"))
    
    # Transaction tracking
    transaction_date = Column(Date)
    deposit_date = Column(Date)
    clear_date = Column(Date)
    bounce_date = Column(Date)
    
    # Reference information
    invoice_id = Column(UUID(as_uuid=True))
    payment_id = Column(UUID(as_uuid=True))
    journal_entry_id = Column(UUID(as_uuid=True), ForeignKey("journal_entries.id"))
    
    # Status tracking
    is_post_dated = Column(Boolean, default=False)
    bounce_reason = Column(Text)
    bounce_fee = Column(DECIMAL(10,2), default=0)
    
    # Notes and descriptions
    notes = Column(Text)
    notes_persian = Column(Text)
    
    # Metadata
    check_metadata = Column(JSONB, default={})
    
    # Audit trail
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_by = Column(UUID(as_uuid=True))
    updated_by = Column(UUID(as_uuid=True))
    
    # Relationships
    subsidiary_account = relationship("SubsidiaryAccount")
    journal_entry = relationship("JournalEntry")
    
    __table_args__ = (
        Index('idx_check_management_number', 'check_number', 'bank_name'),
        Index('idx_check_management_type', 'check_type'),
        Index('idx_check_management_status', 'check_status'),
        Index('idx_check_management_date', 'check_date'),
        Index('idx_check_management_due', 'due_date'),
        Index('idx_check_management_customer', 'customer_id'),
        Index('idx_check_management_subsidiary', 'subsidiary_account_id'),
        CheckConstraint('check_type IN (\'received\', \'issued\')', name='check_check_type'),
        CheckConstraint('check_status IN (\'pending\', \'deposited\', \'cleared\', \'bounced\', \'cancelled\')', name='check_check_status'),
        CheckConstraint('check_amount > 0', name='check_positive_amount'),
    )

# Installment Account Management (حساب‌های اقساطی)
class InstallmentAccount(Base):
    __tablename__ = "installment_accounts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    installment_number = Column(String(50), unique=True, nullable=False)
    
    # Account details
    customer_id = Column(UUID(as_uuid=True), nullable=False)
    subsidiary_account_id = Column(UUID(as_uuid=True), ForeignKey("subsidiary_accounts.id"))
    
    # Installment terms
    total_amount = Column(DECIMAL(15,2), nullable=False)
    down_payment = Column(DECIMAL(15,2), default=0)
    installment_amount = Column(DECIMAL(15,2), nullable=False)
    number_of_installments = Column(Integer, nullable=False)
    installment_frequency = Column(String(20), default='monthly')  # monthly, weekly, quarterly
    
    # Interest and fees
    interest_rate = Column(DECIMAL(5,2), default=0)
    late_fee_rate = Column(DECIMAL(5,2), default=0)
    processing_fee = Column(DECIMAL(10,2), default=0)
    
    # Dates
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    next_due_date = Column(Date)
    
    # Status tracking
    status = Column(String(20), default='active')  # active, completed, defaulted, cancelled
    paid_installments = Column(Integer, default=0)
    remaining_installments = Column(Integer)
    total_paid = Column(DECIMAL(15,2), default=0)
    remaining_balance = Column(DECIMAL(15,2))
    
    # Default tracking
    days_overdue = Column(Integer, default=0)
    overdue_amount = Column(DECIMAL(15,2), default=0)
    last_payment_date = Column(Date)
    
    # Reference information
    invoice_id = Column(UUID(as_uuid=True))
    contract_number = Column(String(100))
    
    # Notes and terms
    terms_and_conditions = Column(Text)
    notes = Column(Text)
    notes_persian = Column(Text)
    
    # Metadata
    installment_metadata = Column(JSONB, default={})
    
    # Audit trail
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_by = Column(UUID(as_uuid=True))
    updated_by = Column(UUID(as_uuid=True))
    
    # Relationships
    subsidiary_account = relationship("SubsidiaryAccount")
    installment_payments = relationship("InstallmentPayment", back_populates="installment_account", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_installment_accounts_number', 'installment_number'),
        Index('idx_installment_accounts_customer', 'customer_id'),
        Index('idx_installment_accounts_status', 'status'),
        Index('idx_installment_accounts_due_date', 'next_due_date'),
        Index('idx_installment_accounts_subsidiary', 'subsidiary_account_id'),
        CheckConstraint('status IN (\'active\', \'completed\', \'defaulted\', \'cancelled\')', name='check_installment_status'),
        CheckConstraint('total_amount > 0 AND installment_amount > 0', name='check_positive_installment_amounts'),
        CheckConstraint('number_of_installments > 0', name='check_positive_installments'),
    )

# Installment Payments
class InstallmentPayment(Base):
    __tablename__ = "installment_payments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    installment_account_id = Column(UUID(as_uuid=True), ForeignKey("installment_accounts.id", ondelete="CASCADE"), nullable=False)
    payment_number = Column(Integer, nullable=False)
    
    # Payment details
    due_date = Column(Date, nullable=False)
    payment_date = Column(Date)
    due_amount = Column(DECIMAL(15,2), nullable=False)
    paid_amount = Column(DECIMAL(15,2), default=0)
    remaining_amount = Column(DECIMAL(15,2))
    
    # Fees and interest
    interest_amount = Column(DECIMAL(15,2), default=0)
    late_fee = Column(DECIMAL(15,2), default=0)
    total_amount_due = Column(DECIMAL(15,2))
    
    # Status
    status = Column(String(20), default='pending')  # pending, paid, partial, overdue
    days_overdue = Column(Integer, default=0)
    
    # Payment method
    payment_method = Column(String(50))
    payment_reference = Column(String(100))
    journal_entry_id = Column(UUID(as_uuid=True), ForeignKey("journal_entries.id"))
    
    # Notes
    notes = Column(Text)
    
    # Audit trail
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    installment_account = relationship("InstallmentAccount", back_populates="installment_payments")
    journal_entry = relationship("JournalEntry")
    
    __table_args__ = (
        Index('idx_installment_payments_account', 'installment_account_id'),
        Index('idx_installment_payments_due_date', 'due_date'),
        Index('idx_installment_payments_status', 'status'),
        Index('idx_installment_payments_overdue', 'days_overdue'),
        CheckConstraint('status IN (\'pending\', \'paid\', \'partial\', \'overdue\')', name='check_payment_status'),
        CheckConstraint('due_amount > 0', name='check_positive_due_amount'),
    )

# Bank Reconciliation
class BankReconciliation(Base):
    __tablename__ = "bank_reconciliation"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    reconciliation_date = Column(Date, nullable=False)
    bank_account_id = Column(UUID(as_uuid=True), ForeignKey("chart_of_accounts.id"), nullable=False)
    
    # Balances
    book_balance = Column(DECIMAL(15,2), nullable=False)
    bank_statement_balance = Column(DECIMAL(15,2), nullable=False)
    reconciled_balance = Column(DECIMAL(15,2))
    difference = Column(DECIMAL(15,2))
    
    # Status
    status = Column(String(20), default='in_progress')  # in_progress, completed, reviewed
    reconciled_by = Column(UUID(as_uuid=True))
    reconciled_at = Column(DateTime(timezone=True))
    reviewed_by = Column(UUID(as_uuid=True))
    reviewed_at = Column(DateTime(timezone=True))
    
    # Period
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)
    
    # Notes
    notes = Column(Text)
    
    # Metadata
    reconciliation_metadata = Column(JSONB, default={})
    
    # Audit trail
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_by = Column(UUID(as_uuid=True))
    
    # Relationships
    bank_account = relationship("ChartOfAccounts")
    reconciliation_items = relationship("BankReconciliationItem", back_populates="reconciliation", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_bank_reconciliation_date', 'reconciliation_date'),
        Index('idx_bank_reconciliation_account', 'bank_account_id'),
        Index('idx_bank_reconciliation_status', 'status'),
        Index('idx_bank_reconciliation_period', 'period_start', 'period_end'),
        CheckConstraint('status IN (\'in_progress\', \'completed\', \'reviewed\')', name='check_reconciliation_status'),
    )

# Bank Reconciliation Items
class BankReconciliationItem(Base):
    __tablename__ = "bank_reconciliation_items"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    reconciliation_id = Column(UUID(as_uuid=True), ForeignKey("bank_reconciliation.id", ondelete="CASCADE"), nullable=False)
    
    # Item details
    item_type = Column(String(50), nullable=False)  # 'deposit_in_transit', 'outstanding_check', 'bank_error', 'book_error'
    description = Column(Text, nullable=False)
    amount = Column(DECIMAL(15,2), nullable=False)
    
    # Reference information
    reference_type = Column(String(50))  # 'check', 'deposit', 'journal_entry'
    reference_id = Column(UUID(as_uuid=True))
    reference_number = Column(String(100))
    
    # Status
    is_reconciled = Column(Boolean, default=False)
    reconciled_date = Column(Date)
    
    # Audit trail
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    reconciliation = relationship("BankReconciliation", back_populates="reconciliation_items")
    
    __table_args__ = (
        Index('idx_bank_reconciliation_items_reconciliation', 'reconciliation_id'),
        Index('idx_bank_reconciliation_items_type', 'item_type'),
        Index('idx_bank_reconciliation_items_reference', 'reference_type', 'reference_id'),
        CheckConstraint('item_type IN (\'deposit_in_transit\', \'outstanding_check\', \'bank_error\', \'book_error\')', name='check_reconciliation_item_type'),
    )

# Accounting Periods and Closing
class AccountingPeriod(Base):
    __tablename__ = "accounting_periods"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    period_code = Column(String(7), unique=True, nullable=False)  # YYYY-MM
    period_name = Column(String(100), nullable=False)
    period_name_persian = Column(String(100))
    
    # Period dates
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    
    # Status
    status = Column(String(20), default='open')  # open, closed, locked
    is_locked = Column(Boolean, default=False)
    locked_by = Column(UUID(as_uuid=True))
    locked_at = Column(DateTime(timezone=True))
    lock_reason = Column(Text)
    
    # Fiscal year
    fiscal_year = Column(Integer, nullable=False)
    is_year_end = Column(Boolean, default=False)
    
    # Closing information
    closed_by = Column(UUID(as_uuid=True))
    closed_at = Column(DateTime(timezone=True))
    closing_entries_generated = Column(Boolean, default=False)
    
    # Metadata
    period_metadata = Column(JSONB, default={})
    
    # Audit trail
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_by = Column(UUID(as_uuid=True))
    
    __table_args__ = (
        Index('idx_accounting_periods_code', 'period_code'),
        Index('idx_accounting_periods_dates', 'start_date', 'end_date'),
        Index('idx_accounting_periods_status', 'status'),
        Index('idx_accounting_periods_fiscal_year', 'fiscal_year'),
        CheckConstraint('status IN (\'open\', \'closed\', \'locked\')', name='check_period_status'),
        CheckConstraint('start_date < end_date', name='check_period_date_order'),
    )

# Audit Trail for all accounting changes
class AccountingAuditTrail(Base):
    __tablename__ = "accounting_audit_trail"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # What was changed
    table_name = Column(String(100), nullable=False)
    record_id = Column(UUID(as_uuid=True), nullable=False)
    operation = Column(String(20), nullable=False)  # insert, update, delete
    
    # Change details
    old_values = Column(JSONB)
    new_values = Column(JSONB)
    changed_fields = Column(ARRAY(String))
    
    # Context
    change_reason = Column(Text)
    change_description = Column(Text)
    
    # User and session
    user_id = Column(UUID(as_uuid=True))
    session_id = Column(String(100))
    ip_address = Column(String(45))
    user_agent = Column(Text)
    
    # Timestamp
    changed_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Additional context
    business_context = Column(JSONB, default={})
    
    __table_args__ = (
        Index('idx_accounting_audit_trail_table', 'table_name'),
        Index('idx_accounting_audit_trail_record', 'record_id'),
        Index('idx_accounting_audit_trail_operation', 'operation'),
        Index('idx_accounting_audit_trail_user', 'user_id'),
        Index('idx_accounting_audit_trail_timestamp', 'changed_at'),
        CheckConstraint('operation IN (\'insert\', \'update\', \'delete\')', name='check_audit_operation'),
    )