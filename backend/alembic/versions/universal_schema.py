"""Universal Business Schema Enhancement

Revision ID: universal_schema
Revises: add_analytics_tables
Create Date: 2025-01-25 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy import text

# revision identifiers, used by Alembic.
revision: str = 'universal_schema'
down_revision: Union[str, None] = 'add_analytics_tables'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enable LTREE extension for hierarchical categories
    op.execute('CREATE EXTENSION IF NOT EXISTS ltree')
    
    # 1. Create business_configurations table for adaptive business type settings
    op.create_table(
        'business_configurations',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('business_type', sa.String(50), nullable=False),
        sa.Column('business_name', sa.String(200), nullable=False),
        sa.Column('industry', sa.String(100), nullable=True),
        sa.Column('configuration', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('terminology_mapping', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('workflow_settings', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('feature_flags', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('custom_fields_schema', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('is_active', sa.Boolean, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('idx_business_configurations_type', 'business_configurations', ['business_type'])
    op.create_index('idx_business_configurations_active', 'business_configurations', ['is_active'])
    
    # 2. Enhance inventory_items table with universal attributes
    # Add new columns to existing inventory_items table
    op.add_column('inventory_items', sa.Column('sku', sa.String(100), nullable=True))
    op.add_column('inventory_items', sa.Column('barcode', sa.String(100), nullable=True))
    op.add_column('inventory_items', sa.Column('qr_code', sa.String(255), nullable=True))
    op.add_column('inventory_items', sa.Column('cost_price', sa.DECIMAL(15, 2), nullable=True))
    op.add_column('inventory_items', sa.Column('sale_price', sa.DECIMAL(15, 2), nullable=True))
    op.add_column('inventory_items', sa.Column('currency', sa.String(3), server_default='USD'))
    op.add_column('inventory_items', sa.Column('attributes', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column('inventory_items', sa.Column('tags', postgresql.ARRAY(sa.String), nullable=True))
    op.add_column('inventory_items', sa.Column('unit_of_measure', sa.String(50), nullable=True))
    op.add_column('inventory_items', sa.Column('conversion_factors', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column('inventory_items', sa.Column('business_type_fields', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column('inventory_items', sa.Column('gold_specific', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    
    # Create indexes for new inventory columns
    op.create_index('idx_inventory_items_sku', 'inventory_items', ['sku'], unique=True)
    op.create_index('idx_inventory_items_barcode', 'inventory_items', ['barcode'])
    op.create_index('idx_inventory_items_tags', 'inventory_items', ['tags'], postgresql_using='gin')
    op.create_index('idx_inventory_items_attributes', 'inventory_items', ['attributes'], postgresql_using='gin')
    
    # 3. Enhance categories table with hierarchical structure using LTREE
    op.execute('ALTER TABLE categories ADD COLUMN path ltree')
    op.add_column('categories', sa.Column('level', sa.Integer, server_default='0'))
    op.add_column('categories', sa.Column('attribute_schema', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column('categories', sa.Column('business_type', sa.String(50), nullable=True))
    
    # Create indexes for hierarchical categories
    op.create_index('idx_categories_path', 'categories', ['path'], postgresql_using='gist')
    op.create_index('idx_categories_level', 'categories', ['level'])
    op.create_index('idx_categories_business_type', 'categories', ['business_type'])
    
    # 4. Enhance invoices table with workflow management and business-type specific fields
    op.add_column('invoices', sa.Column('invoice_type', sa.String(50), server_default='standard'))
    op.add_column('invoices', sa.Column('workflow_stage', sa.String(50), server_default='draft'))
    op.add_column('invoices', sa.Column('approval_required', sa.Boolean, server_default=sa.text('false')))
    op.add_column('invoices', sa.Column('approved_by', postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column('invoices', sa.Column('approved_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('invoices', sa.Column('currency', sa.String(3), server_default='USD'))
    op.add_column('invoices', sa.Column('subtotal', sa.DECIMAL(15, 2), nullable=True))
    op.add_column('invoices', sa.Column('tax_amount', sa.DECIMAL(15, 2), nullable=True))
    op.add_column('invoices', sa.Column('discount_amount', sa.DECIMAL(15, 2), nullable=True))
    op.add_column('invoices', sa.Column('business_type_fields', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column('invoices', sa.Column('gold_specific', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column('invoices', sa.Column('payment_terms', sa.Integer, server_default='0'))
    op.add_column('invoices', sa.Column('due_date', sa.DateTime(timezone=True), nullable=True))
    
    # Add foreign key for approved_by
    op.create_foreign_key('fk_invoices_approved_by', 'invoices', 'users', ['approved_by'], ['id'])
    
    # Create indexes for enhanced invoices
    op.create_index('idx_invoices_workflow_stage', 'invoices', ['workflow_stage'])
    op.create_index('idx_invoices_type', 'invoices', ['invoice_type'])
    op.create_index('idx_invoices_approved_by', 'invoices', ['approved_by'])
    op.create_index('idx_invoices_due_date', 'invoices', ['due_date'])
    
    # 5. Create double-entry accounting tables
    
    # Chart of Accounts
    op.create_table(
        'chart_of_accounts',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('account_code', sa.String(20), nullable=False, unique=True),
        sa.Column('account_name', sa.String(200), nullable=False),
        sa.Column('account_type', sa.String(50), nullable=False),  # asset, liability, equity, revenue, expense
        sa.Column('account_subtype', sa.String(50), nullable=True),  # current_asset, fixed_asset, etc.
        sa.Column('parent_account_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('path', sa.Text, nullable=True),
        sa.Column('level', sa.Integer, server_default='0'),
        sa.Column('normal_balance', sa.String(10), nullable=False),  # debit or credit
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('is_active', sa.Boolean, server_default=sa.text('true')),
        sa.Column('is_system_account', sa.Boolean, server_default=sa.text('false')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    # Add LTREE column after table creation
    op.execute('ALTER TABLE chart_of_accounts ALTER COLUMN path TYPE ltree USING path::ltree')
    op.create_foreign_key('fk_chart_of_accounts_parent', 'chart_of_accounts', 'chart_of_accounts', ['parent_account_id'], ['id'])
    op.create_index('idx_chart_of_accounts_code', 'chart_of_accounts', ['account_code'])
    op.create_index('idx_chart_of_accounts_type', 'chart_of_accounts', ['account_type'])
    op.create_index('idx_chart_of_accounts_path', 'chart_of_accounts', ['path'], postgresql_using='gist')
    op.create_index('idx_chart_of_accounts_active', 'chart_of_accounts', ['is_active'])
    
    # Accounting Periods
    op.create_table(
        'accounting_periods',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('period_name', sa.String(100), nullable=False),
        sa.Column('start_date', sa.Date, nullable=False),
        sa.Column('end_date', sa.Date, nullable=False),
        sa.Column('is_closed', sa.Boolean, server_default=sa.text('false')),
        sa.Column('closed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('closed_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_foreign_key('fk_accounting_periods_closed_by', 'accounting_periods', 'users', ['closed_by'], ['id'])
    op.create_index('idx_accounting_periods_dates', 'accounting_periods', ['start_date', 'end_date'])
    op.create_index('idx_accounting_periods_closed', 'accounting_periods', ['is_closed'])
    
    # Journal Entries
    op.create_table(
        'journal_entries',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('entry_number', sa.String(50), nullable=False, unique=True),
        sa.Column('entry_date', sa.Date, nullable=False),
        sa.Column('reference', sa.String(100), nullable=True),
        sa.Column('description', sa.Text, nullable=False),
        sa.Column('total_debit', sa.DECIMAL(15, 2), nullable=False),
        sa.Column('total_credit', sa.DECIMAL(15, 2), nullable=False),
        sa.Column('balanced', sa.Boolean, server_default=sa.text('false')),
        sa.Column('source', sa.String(50), nullable=True),  # invoice, payment, adjustment, manual
        sa.Column('source_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('period_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('is_posted', sa.Boolean, server_default=sa.text('false')),
        sa.Column('posted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_foreign_key('fk_journal_entries_period', 'journal_entries', 'accounting_periods', ['period_id'], ['id'])
    op.create_foreign_key('fk_journal_entries_created_by', 'journal_entries', 'users', ['created_by'], ['id'])
    op.create_index('idx_journal_entries_date', 'journal_entries', ['entry_date'])
    op.create_index('idx_journal_entries_source', 'journal_entries', ['source', 'source_id'])
    op.create_index('idx_journal_entries_posted', 'journal_entries', ['is_posted'])
    op.create_index('idx_journal_entries_period', 'journal_entries', ['period_id'])
    
    # Journal Entry Lines
    op.create_table(
        'journal_entry_lines',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('journal_entry_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('account_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('debit_amount', sa.DECIMAL(15, 2), server_default='0'),
        sa.Column('credit_amount', sa.DECIMAL(15, 2), server_default='0'),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('reference', sa.String(100), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_foreign_key('fk_journal_entry_lines_entry', 'journal_entry_lines', 'journal_entries', ['journal_entry_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key('fk_journal_entry_lines_account', 'journal_entry_lines', 'chart_of_accounts', ['account_id'], ['id'])
    op.create_index('idx_journal_entry_lines_entry', 'journal_entry_lines', ['journal_entry_id'])
    op.create_index('idx_journal_entry_lines_account', 'journal_entry_lines', ['account_id'])
    
    # 6. Create comprehensive audit logging tables
    op.create_table(
        'audit_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('action', sa.String(100), nullable=False),
        sa.Column('resource_type', sa.String(100), nullable=False),
        sa.Column('resource_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('old_values', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('new_values', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('ip_address', postgresql.INET, nullable=True),
        sa.Column('user_agent', sa.Text, nullable=True),
        sa.Column('session_id', sa.String(255), nullable=True),
        sa.Column('request_id', sa.String(255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_foreign_key('fk_audit_logs_user', 'audit_logs', 'users', ['user_id'], ['id'], ondelete='SET NULL')
    op.create_index('idx_audit_logs_user', 'audit_logs', ['user_id'])
    op.create_index('idx_audit_logs_resource', 'audit_logs', ['resource_type', 'resource_id'])
    op.create_index('idx_audit_logs_action', 'audit_logs', ['action'])
    op.create_index('idx_audit_logs_timestamp', 'audit_logs', ['created_at'])
    
    # 7. Create inventory movement tracking table
    op.create_table(
        'inventory_movements',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('inventory_item_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('movement_type', sa.String(50), nullable=False),  # in, out, adjustment, transfer
        sa.Column('quantity', sa.DECIMAL(15, 3), nullable=False),
        sa.Column('unit_cost', sa.DECIMAL(15, 2), nullable=True),
        sa.Column('total_cost', sa.DECIMAL(15, 2), nullable=True),
        sa.Column('reference_type', sa.String(50), nullable=True),  # invoice, purchase, adjustment
        sa.Column('reference_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('notes', sa.Text, nullable=True),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_foreign_key('fk_inventory_movements_item', 'inventory_movements', 'inventory_items', ['inventory_item_id'], ['id'])
    op.create_foreign_key('fk_inventory_movements_created_by', 'inventory_movements', 'users', ['created_by'], ['id'])
    op.create_index('idx_inventory_movements_item', 'inventory_movements', ['inventory_item_id'])
    op.create_index('idx_inventory_movements_type', 'inventory_movements', ['movement_type'])
    op.create_index('idx_inventory_movements_reference', 'inventory_movements', ['reference_type', 'reference_id'])
    op.create_index('idx_inventory_movements_date', 'inventory_movements', ['created_at'])
    
    # 8. Create enhanced payment methods table
    op.create_table(
        'payment_methods',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('type', sa.String(50), nullable=False),  # cash, bank_transfer, card, check, digital
        sa.Column('account_id', postgresql.UUID(as_uuid=True), nullable=True),  # Link to chart of accounts
        sa.Column('configuration', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('is_active', sa.Boolean, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_foreign_key('fk_payment_methods_account', 'payment_methods', 'chart_of_accounts', ['account_id'], ['id'])
    op.create_index('idx_payment_methods_type', 'payment_methods', ['type'])
    op.create_index('idx_payment_methods_active', 'payment_methods', ['is_active'])
    
    # 9. Enhance payments table with multiple payment methods support
    op.add_column('payments', sa.Column('payment_method_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column('payments', sa.Column('reference_number', sa.String(100), nullable=True))
    op.add_column('payments', sa.Column('status', sa.String(50), server_default='completed'))
    op.add_column('payments', sa.Column('currency', sa.String(3), server_default='USD'))
    op.add_column('payments', sa.Column('exchange_rate', sa.DECIMAL(10, 6), server_default='1.0'))
    op.add_column('payments', sa.Column('fees', sa.DECIMAL(15, 2), server_default='0'))
    op.add_column('payments', sa.Column('net_amount', sa.DECIMAL(15, 2), nullable=True))
    
    op.create_foreign_key('fk_payments_method', 'payments', 'payment_methods', ['payment_method_id'], ['id'])
    op.create_index('idx_payments_method', 'payments', ['payment_method_id'])
    op.create_index('idx_payments_status', 'payments', ['status'])
    op.create_index('idx_payments_reference', 'payments', ['reference_number'])
    
    # 10. Create workflow definitions table
    op.create_table(
        'workflow_definitions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('entity_type', sa.String(50), nullable=False),  # invoice, purchase_order, etc.
        sa.Column('business_type', sa.String(50), nullable=True),
        sa.Column('workflow_config', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('is_active', sa.Boolean, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('idx_workflow_definitions_entity', 'workflow_definitions', ['entity_type'])
    op.create_index('idx_workflow_definitions_business_type', 'workflow_definitions', ['business_type'])
    op.create_index('idx_workflow_definitions_active', 'workflow_definitions', ['is_active'])


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_table('workflow_definitions')
    op.drop_table('payment_methods')
    op.drop_table('inventory_movements')
    op.drop_table('audit_logs')
    op.drop_table('journal_entry_lines')
    op.drop_table('journal_entries')
    op.drop_table('accounting_periods')
    op.drop_table('chart_of_accounts')
    op.drop_table('business_configurations')
    
    # Remove enhanced columns from existing tables
    op.drop_column('payments', 'net_amount')
    op.drop_column('payments', 'fees')
    op.drop_column('payments', 'exchange_rate')
    op.drop_column('payments', 'currency')
    op.drop_column('payments', 'status')
    op.drop_column('payments', 'reference_number')
    op.drop_column('payments', 'payment_method_id')
    
    op.drop_column('invoices', 'due_date')
    op.drop_column('invoices', 'payment_terms')
    op.drop_column('invoices', 'gold_specific')
    op.drop_column('invoices', 'business_type_fields')
    op.drop_column('invoices', 'discount_amount')
    op.drop_column('invoices', 'tax_amount')
    op.drop_column('invoices', 'subtotal')
    op.drop_column('invoices', 'currency')
    op.drop_column('invoices', 'approved_at')
    op.drop_column('invoices', 'approved_by')
    op.drop_column('invoices', 'approval_required')
    op.drop_column('invoices', 'workflow_stage')
    op.drop_column('invoices', 'invoice_type')
    
    op.drop_column('categories', 'business_type')
    op.drop_column('categories', 'attribute_schema')
    op.drop_column('categories', 'level')
    op.drop_column('categories', 'path')
    
    op.drop_column('inventory_items', 'gold_specific')
    op.drop_column('inventory_items', 'business_type_fields')
    op.drop_column('inventory_items', 'conversion_factors')
    op.drop_column('inventory_items', 'unit_of_measure')
    op.drop_column('inventory_items', 'tags')
    op.drop_column('inventory_items', 'attributes')
    op.drop_column('inventory_items', 'currency')
    op.drop_column('inventory_items', 'sale_price')
    op.drop_column('inventory_items', 'cost_price')
    op.drop_column('inventory_items', 'qr_code')
    op.drop_column('inventory_items', 'barcode')
    op.drop_column('inventory_items', 'sku')
    
    # Drop LTREE extension
    op.execute('DROP EXTENSION IF EXISTS ltree')