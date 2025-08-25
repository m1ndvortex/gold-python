"""
Double-Entry Accounting System Migration
Create comprehensive accounting tables and indexes

Revision ID: accounting_system
Revises: universal_schema
Create Date: 2024-01-15 10:00:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = 'accounting_system'
down_revision = 'universal_schema'
branch_labels = None
depends_on = None

def upgrade():
    """Create accounting system tables"""
    
    # Chart of Accounts
    op.create_table('chart_of_accounts',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('account_code', sa.String(length=20), nullable=False),
        sa.Column('account_name', sa.String(length=255), nullable=False),
        sa.Column('account_type', sa.String(length=50), nullable=False),
        sa.Column('parent_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('level', sa.Integer(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('is_system_account', sa.Boolean(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('business_type_config', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.CheckConstraint('level >= 0', name='check_account_level'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['parent_id'], ['chart_of_accounts.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('account_code')
    )
    
    # Create indexes for chart_of_accounts
    op.create_index('idx_account_code', 'chart_of_accounts', ['account_code'])
    op.create_index('idx_account_type', 'chart_of_accounts', ['account_type'])
    op.create_index('idx_account_parent', 'chart_of_accounts', ['parent_id'])
    
    # Accounting Periods
    op.create_table('accounting_periods',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('period_name', sa.String(length=100), nullable=False),
        sa.Column('start_date', sa.DateTime(), nullable=False),
        sa.Column('end_date', sa.DateTime(), nullable=False),
        sa.Column('is_closed', sa.Boolean(), nullable=True),
        sa.Column('closed_at', sa.DateTime(), nullable=True),
        sa.Column('closed_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('period_type', sa.String(length=20), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.CheckConstraint('end_date > start_date', name='check_period_dates'),
        sa.ForeignKeyConstraint(['closed_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for accounting_periods
    op.create_index('idx_period_dates', 'accounting_periods', ['start_date', 'end_date'])
    
    # Journal Entries
    op.create_table('journal_entries',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('entry_number', sa.String(length=50), nullable=False),
        sa.Column('entry_date', sa.DateTime(), nullable=False),
        sa.Column('reference', sa.String(length=100), nullable=True),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('total_debit', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('total_credit', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('is_balanced', sa.Boolean(), nullable=True),
        sa.Column('source_type', sa.String(length=50), nullable=True),
        sa.Column('source_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('period_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=True),
        sa.Column('requires_approval', sa.Boolean(), nullable=True),
        sa.Column('approved_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('approved_at', sa.DateTime(), nullable=True),
        sa.Column('reversed_entry_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('reversal_reason', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.CheckConstraint('total_debit >= 0', name='check_total_debit'),
        sa.CheckConstraint('total_credit >= 0', name='check_total_credit'),
        sa.ForeignKeyConstraint(['approved_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['period_id'], ['accounting_periods.id'], ),
        sa.ForeignKeyConstraint(['reversed_entry_id'], ['journal_entries.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('entry_number')
    )
    
    # Create indexes for journal_entries
    op.create_index('idx_entry_date', 'journal_entries', ['entry_date'])
    op.create_index('idx_entry_source', 'journal_entries', ['source_type', 'source_id'])
    op.create_index('idx_entry_period', 'journal_entries', ['period_id'])
    
    # Journal Entry Lines
    op.create_table('journal_entry_lines',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('journal_entry_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('account_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('debit_amount', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('credit_amount', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('reference', sa.String(length=100), nullable=True),
        sa.Column('subsidiary_account', sa.String(length=255), nullable=True),
        sa.Column('cost_center', sa.String(length=100), nullable=True),
        sa.Column('project_code', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.CheckConstraint('debit_amount >= 0', name='check_debit_amount'),
        sa.CheckConstraint('credit_amount >= 0', name='check_credit_amount'),
        sa.CheckConstraint('(debit_amount > 0 AND credit_amount = 0) OR (debit_amount = 0 AND credit_amount > 0)', name='check_debit_or_credit'),
        sa.ForeignKeyConstraint(['account_id'], ['chart_of_accounts.id'], ),
        sa.ForeignKeyConstraint(['journal_entry_id'], ['journal_entries.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for journal_entry_lines
    op.create_index('idx_line_journal_entry', 'journal_entry_lines', ['journal_entry_id'])
    op.create_index('idx_line_account', 'journal_entry_lines', ['account_id'])
    
    # Bank Accounts
    op.create_table('bank_accounts',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('account_name', sa.String(length=255), nullable=False),
        sa.Column('account_number', sa.String(length=50), nullable=False),
        sa.Column('bank_name', sa.String(length=255), nullable=False),
        sa.Column('account_type', sa.String(length=50), nullable=False),
        sa.Column('currency', sa.String(length=3), nullable=True),
        sa.Column('current_balance', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('reconciled_balance', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('chart_account_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['chart_account_id'], ['chart_of_accounts.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for bank_accounts
    op.create_index('idx_bank_account_number', 'bank_accounts', ['account_number'])
    
    # Bank Reconciliations
    op.create_table('bank_reconciliations',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('bank_account_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('reconciliation_date', sa.DateTime(), nullable=False),
        sa.Column('statement_date', sa.DateTime(), nullable=False),
        sa.Column('statement_balance', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('book_balance', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('adjusted_balance', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=True),
        sa.Column('is_balanced', sa.Boolean(), nullable=True),
        sa.Column('outstanding_deposits', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('outstanding_checks', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('bank_charges', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('interest_earned', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(['bank_account_id'], ['bank_accounts.id'], ),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for bank_reconciliations
    op.create_index('idx_reconciliation_date', 'bank_reconciliations', ['reconciliation_date'])
    op.create_index('idx_reconciliation_status', 'bank_reconciliations', ['status'])
    
    # Bank Transactions
    op.create_table('bank_transactions',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('bank_account_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('transaction_date', sa.DateTime(), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('reference', sa.String(length=100), nullable=True),
        sa.Column('amount', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('transaction_type', sa.String(length=20), nullable=False),
        sa.Column('is_reconciled', sa.Boolean(), nullable=True),
        sa.Column('reconciled_at', sa.DateTime(), nullable=True),
        sa.Column('reconciliation_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('journal_entry_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['bank_account_id'], ['bank_accounts.id'], ),
        sa.ForeignKeyConstraint(['journal_entry_id'], ['journal_entries.id'], ),
        sa.ForeignKeyConstraint(['reconciliation_id'], ['bank_reconciliations.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for bank_transactions
    op.create_index('idx_bank_transaction_date', 'bank_transactions', ['transaction_date'])
    op.create_index('idx_bank_transaction_reconciled', 'bank_transactions', ['is_reconciled'])
    
    # Check Register
    op.create_table('check_register',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('check_number', sa.String(length=20), nullable=False),
        sa.Column('bank_account_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('check_date', sa.DateTime(), nullable=False),
        sa.Column('payee', sa.String(length=255), nullable=False),
        sa.Column('amount', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('memo', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=True),
        sa.Column('cleared_date', sa.DateTime(), nullable=True),
        sa.Column('journal_entry_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['bank_account_id'], ['bank_accounts.id'], ),
        sa.ForeignKeyConstraint(['journal_entry_id'], ['journal_entries.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for check_register
    op.create_index('idx_check_number', 'check_register', ['check_number'])
    op.create_index('idx_check_date', 'check_register', ['check_date'])
    op.create_index('idx_check_status', 'check_register', ['status'])
    
    # Accounting Audit Log
    op.create_table('accounting_audit_log',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('action', sa.String(length=100), nullable=False),
        sa.Column('table_name', sa.String(length=100), nullable=False),
        sa.Column('record_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('old_values', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('new_values', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('changed_fields', postgresql.ARRAY(sa.String()), nullable=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.Column('session_id', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for accounting_audit_log
    op.create_index('idx_audit_table_record', 'accounting_audit_log', ['table_name', 'record_id'])
    op.create_index('idx_audit_user', 'accounting_audit_log', ['user_id'])
    op.create_index('idx_audit_created', 'accounting_audit_log', ['created_at'])
    
    # Insert default chart of accounts structure
    op.execute("""
        INSERT INTO chart_of_accounts (id, account_code, account_name, account_type, level, is_active, is_system_account, created_at) VALUES
        -- Assets
        (gen_random_uuid(), '1000', 'Assets', 'Asset', 0, true, true, NOW()),
        (gen_random_uuid(), '1100', 'Current Assets', 'Asset', 1, true, true, NOW()),
        (gen_random_uuid(), '1110', 'Cash and Cash Equivalents', 'Asset', 2, true, true, NOW()),
        (gen_random_uuid(), '1120', 'Accounts Receivable', 'Asset', 2, true, true, NOW()),
        (gen_random_uuid(), '1130', 'Inventory', 'Asset', 2, true, true, NOW()),
        (gen_random_uuid(), '1140', 'Prepaid Expenses', 'Asset', 2, true, true, NOW()),
        (gen_random_uuid(), '1200', 'Non-Current Assets', 'Asset', 1, true, true, NOW()),
        (gen_random_uuid(), '1210', 'Property, Plant & Equipment', 'Asset', 2, true, true, NOW()),
        (gen_random_uuid(), '1220', 'Accumulated Depreciation', 'Asset', 2, true, true, NOW()),
        
        -- Liabilities
        (gen_random_uuid(), '2000', 'Liabilities', 'Liability', 0, true, true, NOW()),
        (gen_random_uuid(), '2100', 'Current Liabilities', 'Liability', 1, true, true, NOW()),
        (gen_random_uuid(), '2110', 'Accounts Payable', 'Liability', 2, true, true, NOW()),
        (gen_random_uuid(), '2120', 'Accrued Expenses', 'Liability', 2, true, true, NOW()),
        (gen_random_uuid(), '2130', 'Short-term Debt', 'Liability', 2, true, true, NOW()),
        (gen_random_uuid(), '2200', 'Non-Current Liabilities', 'Liability', 1, true, true, NOW()),
        (gen_random_uuid(), '2210', 'Long-term Debt', 'Liability', 2, true, true, NOW()),
        
        -- Equity
        (gen_random_uuid(), '3000', 'Equity', 'Equity', 0, true, true, NOW()),
        (gen_random_uuid(), '3100', 'Owner''s Equity', 'Equity', 1, true, true, NOW()),
        (gen_random_uuid(), '3200', 'Retained Earnings', 'Equity', 1, true, true, NOW()),
        
        -- Revenue
        (gen_random_uuid(), '4000', 'Revenue', 'Revenue', 0, true, true, NOW()),
        (gen_random_uuid(), '4100', 'Sales Revenue', 'Revenue', 1, true, true, NOW()),
        (gen_random_uuid(), '4200', 'Service Revenue', 'Revenue', 1, true, true, NOW()),
        (gen_random_uuid(), '4300', 'Other Revenue', 'Revenue', 1, true, true, NOW()),
        
        -- Expenses
        (gen_random_uuid(), '5000', 'Expenses', 'Expense', 0, true, true, NOW()),
        (gen_random_uuid(), '5100', 'Cost of Goods Sold', 'Expense', 1, true, true, NOW()),
        (gen_random_uuid(), '5200', 'Operating Expenses', 'Expense', 1, true, true, NOW()),
        (gen_random_uuid(), '5210', 'Salaries and Wages', 'Expense', 2, true, true, NOW()),
        (gen_random_uuid(), '5220', 'Rent Expense', 'Expense', 2, true, true, NOW()),
        (gen_random_uuid(), '5230', 'Utilities Expense', 'Expense', 2, true, true, NOW()),
        (gen_random_uuid(), '5240', 'Depreciation Expense', 'Expense', 2, true, true, NOW()),
        (gen_random_uuid(), '5300', 'Administrative Expenses', 'Expense', 1, true, true, NOW()),
        (gen_random_uuid(), '5400', 'Financial Expenses', 'Expense', 1, true, true, NOW())
    """)
    
    # Update parent_id relationships for hierarchical structure
    op.execute("""
        UPDATE chart_of_accounts SET parent_id = (
            SELECT id FROM chart_of_accounts p WHERE p.account_code = '1000'
        ) WHERE account_code IN ('1100', '1200');
        
        UPDATE chart_of_accounts SET parent_id = (
            SELECT id FROM chart_of_accounts p WHERE p.account_code = '1100'
        ) WHERE account_code IN ('1110', '1120', '1130', '1140');
        
        UPDATE chart_of_accounts SET parent_id = (
            SELECT id FROM chart_of_accounts p WHERE p.account_code = '1200'
        ) WHERE account_code IN ('1210', '1220');
        
        UPDATE chart_of_accounts SET parent_id = (
            SELECT id FROM chart_of_accounts p WHERE p.account_code = '2000'
        ) WHERE account_code IN ('2100', '2200');
        
        UPDATE chart_of_accounts SET parent_id = (
            SELECT id FROM chart_of_accounts p WHERE p.account_code = '2100'
        ) WHERE account_code IN ('2110', '2120', '2130');
        
        UPDATE chart_of_accounts SET parent_id = (
            SELECT id FROM chart_of_accounts p WHERE p.account_code = '2200'
        ) WHERE account_code IN ('2210');
        
        UPDATE chart_of_accounts SET parent_id = (
            SELECT id FROM chart_of_accounts p WHERE p.account_code = '3000'
        ) WHERE account_code IN ('3100', '3200');
        
        UPDATE chart_of_accounts SET parent_id = (
            SELECT id FROM chart_of_accounts p WHERE p.account_code = '4000'
        ) WHERE account_code IN ('4100', '4200', '4300');
        
        UPDATE chart_of_accounts SET parent_id = (
            SELECT id FROM chart_of_accounts p WHERE p.account_code = '5000'
        ) WHERE account_code IN ('5100', '5200', '5300', '5400');
        
        UPDATE chart_of_accounts SET parent_id = (
            SELECT id FROM chart_of_accounts p WHERE p.account_code = '5200'
        ) WHERE account_code IN ('5210', '5220', '5230', '5240');
    """)

def downgrade():
    """Drop accounting system tables"""
    op.drop_table('accounting_audit_log')
    op.drop_table('check_register')
    op.drop_table('bank_transactions')
    op.drop_table('bank_reconciliations')
    op.drop_table('bank_accounts')
    op.drop_table('journal_entry_lines')
    op.drop_table('journal_entries')
    op.drop_table('accounting_periods')
    op.drop_table('chart_of_accounts')