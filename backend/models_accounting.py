"""
Double-Entry Accounting System Models
Comprehensive accounting models for universal business platform
"""

from sqlalchemy import Column, String, Integer, DateTime, Boolean, Text, ForeignKey, Index, CheckConstraint, Numeric
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

# Import the existing Base from models_universal to ensure compatibility
from models_universal import Base

class ChartOfAccounts(Base):
    """Chart of Accounts with hierarchical structure"""
    __tablename__ = "chart_of_accounts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    account_code = Column(String(20), unique=True, nullable=False, index=True)
    account_name = Column(String(255), nullable=False)
    account_type = Column(String(50), nullable=False)  # Asset, Liability, Equity, Revenue, Expense
    parent_id = Column(UUID(as_uuid=True), ForeignKey('chart_of_accounts.id'), nullable=True)
    level = Column(Integer, nullable=False, default=0)
    is_active = Column(Boolean, default=True)
    is_system_account = Column(Boolean, default=False)
    description = Column(Text)
    
    # Business type specific configurations
    business_type_config = Column(JSONB)
    
    # Relationships
    parent = relationship("ChartOfAccounts", remote_side=[id], backref="children")
    journal_entries = relationship("JournalEntryLine", back_populates="account")
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    
    __table_args__ = (
        Index('idx_account_code', 'account_code'),
        Index('idx_account_type', 'account_type'),
        Index('idx_account_parent', 'parent_id'),
        CheckConstraint('level >= 0', name='check_account_level'),
    )

class AccountingPeriod(Base):
    """Accounting periods for financial reporting and closing"""
    __tablename__ = "accounting_periods"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    period_name = Column(String(100), nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    is_closed = Column(Boolean, default=False)
    closed_at = Column(DateTime)
    closed_by = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    
    # Period type (monthly, quarterly, yearly)
    period_type = Column(String(20), nullable=False)
    
    # Relationships
    journal_entries = relationship("JournalEntry", back_populates="period")
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        Index('idx_period_dates', 'start_date', 'end_date'),
        CheckConstraint('end_date > start_date', name='check_period_dates'),
    )

class JournalEntry(Base):
    """Journal entries for double-entry bookkeeping"""
    __tablename__ = "journal_entries"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entry_number = Column(String(50), unique=True, nullable=False, index=True)
    entry_date = Column(DateTime, nullable=False, index=True)
    reference = Column(String(100))
    description = Column(Text, nullable=False)
    
    # Financial amounts
    total_debit = Column(Numeric(15, 2), nullable=False, default=0)
    total_credit = Column(Numeric(15, 2), nullable=False, default=0)
    is_balanced = Column(Boolean, default=False)
    
    # Source information
    source_type = Column(String(50))  # invoice, payment, adjustment, manual
    source_id = Column(UUID(as_uuid=True))
    
    # Period and status
    period_id = Column(UUID(as_uuid=True), ForeignKey('accounting_periods.id'))
    status = Column(String(20), default='draft')  # draft, posted, reversed
    
    # Approval workflow
    requires_approval = Column(Boolean, default=False)
    approved_by = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    approved_at = Column(DateTime)
    
    # Reversal information
    reversed_entry_id = Column(UUID(as_uuid=True), ForeignKey('journal_entries.id'))
    reversal_reason = Column(Text)
    
    # Relationships
    period = relationship("AccountingPeriod", back_populates="journal_entries")
    lines = relationship("JournalEntryLine", back_populates="journal_entry", cascade="all, delete-orphan")
    reversed_entry = relationship("JournalEntry", remote_side=[id])
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    
    __table_args__ = (
        Index('idx_entry_date', 'entry_date'),
        Index('idx_entry_source', 'source_type', 'source_id'),
        Index('idx_entry_period', 'period_id'),
        CheckConstraint('total_debit >= 0', name='check_total_debit'),
        CheckConstraint('total_credit >= 0', name='check_total_credit'),
    )

class JournalEntryLine(Base):
    """Individual lines within journal entries"""
    __tablename__ = "journal_entry_lines"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    journal_entry_id = Column(UUID(as_uuid=True), ForeignKey('journal_entries.id'), nullable=False)
    account_id = Column(UUID(as_uuid=True), ForeignKey('chart_of_accounts.id'), nullable=False)
    
    # Amounts
    debit_amount = Column(Numeric(15, 2), nullable=False, default=0)
    credit_amount = Column(Numeric(15, 2), nullable=False, default=0)
    
    # Line details
    description = Column(Text)
    reference = Column(String(100))
    
    # Additional tracking
    subsidiary_account = Column(String(255))  # For detailed tracking
    cost_center = Column(String(100))
    project_code = Column(String(100))
    
    # Relationships
    journal_entry = relationship("JournalEntry", back_populates="lines")
    account = relationship("ChartOfAccounts", back_populates="journal_entries")
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        Index('idx_line_journal_entry', 'journal_entry_id'),
        Index('idx_line_account', 'account_id'),
        CheckConstraint('debit_amount >= 0', name='check_debit_amount'),
        CheckConstraint('credit_amount >= 0', name='check_credit_amount'),
        CheckConstraint('(debit_amount > 0 AND credit_amount = 0) OR (debit_amount = 0 AND credit_amount > 0)', 
                       name='check_debit_or_credit'),
    )

class BankAccount(Base):
    """Bank accounts for reconciliation"""
    __tablename__ = "bank_accounts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    account_name = Column(String(255), nullable=False)
    account_number = Column(String(50), nullable=False)
    bank_name = Column(String(255), nullable=False)
    account_type = Column(String(50), nullable=False)  # checking, savings, credit
    currency = Column(String(3), default='USD')
    
    # Current balance
    current_balance = Column(Numeric(15, 2), default=0)
    reconciled_balance = Column(Numeric(15, 2), default=0)
    
    # Chart of accounts mapping
    chart_account_id = Column(UUID(as_uuid=True), ForeignKey('chart_of_accounts.id'))
    
    # Status
    is_active = Column(Boolean, default=True)
    
    # Relationships
    chart_account = relationship("ChartOfAccounts")
    transactions = relationship("BankTransaction", back_populates="bank_account")
    reconciliations = relationship("BankReconciliation", back_populates="bank_account")
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        Index('idx_bank_account_number', 'account_number'),
    )

class BankTransaction(Base):
    """Bank transactions for reconciliation"""
    __tablename__ = "bank_transactions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    bank_account_id = Column(UUID(as_uuid=True), ForeignKey('bank_accounts.id'), nullable=False)
    
    # Transaction details
    transaction_date = Column(DateTime, nullable=False)
    description = Column(Text, nullable=False)
    reference = Column(String(100))
    amount = Column(Numeric(15, 2), nullable=False)
    transaction_type = Column(String(20), nullable=False)  # debit, credit
    
    # Reconciliation status
    is_reconciled = Column(Boolean, default=False)
    reconciled_at = Column(DateTime)
    reconciliation_id = Column(UUID(as_uuid=True), ForeignKey('bank_reconciliations.id'))
    
    # Journal entry mapping
    journal_entry_id = Column(UUID(as_uuid=True), ForeignKey('journal_entries.id'))
    
    # Relationships
    bank_account = relationship("BankAccount", back_populates="transactions")
    reconciliation = relationship("BankReconciliation", back_populates="transactions")
    journal_entry = relationship("JournalEntry")
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        Index('idx_bank_transaction_date', 'transaction_date'),
        Index('idx_bank_transaction_reconciled', 'is_reconciled'),
    )

class BankReconciliation(Base):
    """Bank reconciliation records"""
    __tablename__ = "bank_reconciliations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    bank_account_id = Column(UUID(as_uuid=True), ForeignKey('bank_accounts.id'), nullable=False)
    
    # Reconciliation period
    reconciliation_date = Column(DateTime, nullable=False)
    statement_date = Column(DateTime, nullable=False)
    
    # Balances
    statement_balance = Column(Numeric(15, 2), nullable=False)
    book_balance = Column(Numeric(15, 2), nullable=False)
    adjusted_balance = Column(Numeric(15, 2), nullable=False)
    
    # Status
    status = Column(String(20), default='in_progress')  # in_progress, completed, approved
    is_balanced = Column(Boolean, default=False)
    
    # Adjustments
    outstanding_deposits = Column(Numeric(15, 2), default=0)
    outstanding_checks = Column(Numeric(15, 2), default=0)
    bank_charges = Column(Numeric(15, 2), default=0)
    interest_earned = Column(Numeric(15, 2), default=0)
    
    # Relationships
    bank_account = relationship("BankAccount", back_populates="reconciliations")
    transactions = relationship("BankTransaction", back_populates="reconciliation")
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    
    __table_args__ = (
        Index('idx_reconciliation_date', 'reconciliation_date'),
        Index('idx_reconciliation_status', 'status'),
    )

class CheckRegister(Base):
    """Check management and tracking"""
    __tablename__ = "check_register"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    check_number = Column(String(20), nullable=False)
    bank_account_id = Column(UUID(as_uuid=True), ForeignKey('bank_accounts.id'), nullable=False)
    
    # Check details
    check_date = Column(DateTime, nullable=False)
    payee = Column(String(255), nullable=False)
    amount = Column(Numeric(15, 2), nullable=False)
    memo = Column(Text)
    
    # Status tracking
    status = Column(String(20), default='issued')  # issued, cleared, voided, stopped
    cleared_date = Column(DateTime)
    
    # Journal entry mapping
    journal_entry_id = Column(UUID(as_uuid=True), ForeignKey('journal_entries.id'))
    
    # Relationships
    bank_account = relationship("BankAccount")
    journal_entry = relationship("JournalEntry")
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        Index('idx_check_number', 'check_number'),
        Index('idx_check_date', 'check_date'),
        Index('idx_check_status', 'status'),
    )

class AccountingAuditLog(Base):
    """Comprehensive audit logging for accounting operations"""
    __tablename__ = "accounting_audit_log"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Audit details
    action = Column(String(100), nullable=False)
    table_name = Column(String(100), nullable=False)
    record_id = Column(UUID(as_uuid=True), nullable=False)
    
    # Change tracking
    old_values = Column(JSONB)
    new_values = Column(JSONB)
    changed_fields = Column(ARRAY(String))
    
    # User and session info
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    ip_address = Column(String(45))
    user_agent = Column(Text)
    session_id = Column(String(255))
    
    # Timestamp
    created_at = Column(DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        Index('idx_audit_table_record', 'table_name', 'record_id'),
        Index('idx_audit_user', 'user_id'),
        Index('idx_audit_created', 'created_at'),
    )