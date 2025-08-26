"""
Specialized Accounting System Models
Additional accounting models that extend the core models in models_universal.py
"""

from sqlalchemy import Column, String, Integer, DateTime, Boolean, Text, ForeignKey, Index, CheckConstraint, Numeric
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

# Import Base from database_base to ensure single metadata instance
from database_base import Base

# Import core accounting models from models_universal.py
from models_universal import ChartOfAccounts, AccountingPeriod, JournalEntry, JournalEntryLine

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