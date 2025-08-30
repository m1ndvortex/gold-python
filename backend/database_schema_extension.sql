-- Database Schema Extension for Universal Inventory and Invoice Management System
-- This file extends the existing database schema with all new features

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "ltree";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Enhanced Double-Entry Accounting Tables
CREATE TABLE IF NOT EXISTS chart_of_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_code VARCHAR(20) UNIQUE NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    account_name_persian VARCHAR(255),
    account_type VARCHAR(50) NOT NULL, -- asset, liability, equity, revenue, expense
    parent_account_id UUID REFERENCES chart_of_accounts(id),
    account_level INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    normal_balance VARCHAR(10) NOT NULL, -- debit, credit
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_number VARCHAR(50) UNIQUE NOT NULL,
    entry_date DATE NOT NULL,
    reference VARCHAR(255),
    description TEXT NOT NULL,
    total_debit DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_credit DECIMAL(15,2) NOT NULL DEFAULT 0,
    is_balanced BOOLEAN DEFAULT FALSE,
    source_type VARCHAR(50), -- invoice, payment, adjustment, manual
    source_id UUID,
    status VARCHAR(20) DEFAULT 'draft', -- draft, posted, reversed
    posted_by UUID,
    posted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS journal_entry_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES chart_of_accounts(id),
    debit_amount DECIMAL(15,2) DEFAULT 0,
    credit_amount DECIMAL(15,2) DEFAULT 0,
    description TEXT,
    line_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subsidiary Accounts (حساب‌های تفصیلی)
CREATE TABLE IF NOT EXISTS subsidiary_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_code VARCHAR(20) UNIQUE NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    account_name_persian VARCHAR(255),
    main_account_id UUID NOT NULL REFERENCES chart_of_accounts(id),
    customer_id UUID,
    supplier_id UUID,
    current_balance DECIMAL(15,2) DEFAULT 0,
    balance_type VARCHAR(10) NOT NULL, -- debit, credit
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Check Management (مدیریت چک‌ها)
CREATE TABLE IF NOT EXISTS checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    check_number VARCHAR(50) NOT NULL,
    bank_name VARCHAR(255) NOT NULL,
    branch_name VARCHAR(255),
    account_number VARCHAR(50),
    check_date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    payee_name VARCHAR(255),
    drawer_name VARCHAR(255),
    status VARCHAR(20) DEFAULT 'issued', -- issued, deposited, cleared, bounced, cancelled
    transaction_date DATE,
    clearing_date DATE,
    notes TEXT,
    customer_id UUID,
    invoice_id UUID,
    journal_entry_id UUID REFERENCES journal_entries(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Installment Accounts (حساب‌های اقساطی)
CREATE TABLE IF NOT EXISTS installment_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    paid_amount DECIMAL(15,2) DEFAULT 0,
    remaining_amount DECIMAL(15,2) NOT NULL,
    installment_count INTEGER NOT NULL,
    installment_amount DECIMAL(15,2) NOT NULL,
    start_date DATE NOT NULL,
    next_payment_date DATE,
    status VARCHAR(20) DEFAULT 'active', -- active, completed, defaulted, cancelled
    interest_rate DECIMAL(5,2) DEFAULT 0,
    late_fee_amount DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS installment_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    installment_account_id UUID NOT NULL REFERENCES installment_accounts(id) ON DELETE CASCADE,
    payment_number INTEGER NOT NULL,
    due_date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    paid_amount DECIMAL(15,2) DEFAULT 0,
    payment_date DATE,
    status VARCHAR(20) DEFAULT 'pending', -- pending, paid, overdue, partial
    late_fee DECIMAL(10,2) DEFAULT 0,
    journal_entry_id UUID REFERENCES journal_entries(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bank Reconciliation
CREATE TABLE IF NOT EXISTS bank_reconciliations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_account_id UUID NOT NULL REFERENCES chart_of_accounts(id),
    statement_date DATE NOT NULL,
    statement_balance DECIMAL(15,2) NOT NULL,
    book_balance DECIMAL(15,2) NOT NULL,
    reconciled_balance DECIMAL(15,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, reconciled, reviewed
    reconciled_by UUID,
    reconciled_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bank_reconciliation_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reconciliation_id UUID NOT NULL REFERENCES bank_reconciliations(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL, -- deposit, withdrawal, fee, interest
    transaction_date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    description TEXT,
    journal_entry_id UUID REFERENCES journal_entries(id),
    is_reconciled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Period Management
CREATE TABLE IF NOT EXISTS accounting_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'open', -- open, closed, locked
    closed_by UUID,
    closed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit Trail Enhancement
CREATE TABLE IF NOT EXISTS audit_trail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL, -- insert, update, delete
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    user_id UUID,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_parent ON chart_of_accounts(parent_account_id);
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_type ON chart_of_accounts(account_type);
CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_journal_entries_source ON journal_entries(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_entry ON journal_entry_lines(journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_account ON journal_entry_lines(account_id);
CREATE INDEX IF NOT EXISTS idx_subsidiary_accounts_main ON subsidiary_accounts(main_account_id);
CREATE INDEX IF NOT EXISTS idx_checks_status ON checks(status);
CREATE INDEX IF NOT EXISTS idx_checks_date ON checks(check_date);
CREATE INDEX IF NOT EXISTS idx_installment_accounts_customer ON installment_accounts(customer_id);
CREATE INDEX IF NOT EXISTS idx_installment_payments_account ON installment_payments(installment_account_id);
CREATE INDEX IF NOT EXISTS idx_bank_reconciliations_account ON bank_reconciliations(bank_account_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_table_record ON audit_trail(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_timestamp ON audit_trail(timestamp);

-- Insert default chart of accounts for Gold Shop
INSERT INTO chart_of_accounts (account_code, account_name, account_name_persian, account_type, normal_balance) VALUES
('1000', 'Assets', 'دارایی‌ها', 'asset', 'debit'),
('1100', 'Current Assets', 'دارایی‌های جاری', 'asset', 'debit'),
('1110', 'Cash', 'نقد', 'asset', 'debit'),
('1120', 'Bank Accounts', 'حساب‌های بانکی', 'asset', 'debit'),
('1130', 'Accounts Receivable', 'حساب‌های دریافتنی', 'asset', 'debit'),
('1140', 'Inventory', 'موجودی کالا', 'asset', 'debit'),
('2000', 'Liabilities', 'بدهی‌ها', 'liability', 'credit'),
('2100', 'Current Liabilities', 'بدهی‌های جاری', 'liability', 'credit'),
('2110', 'Accounts Payable', 'حساب‌های پرداختنی', 'liability', 'credit'),
('2120', 'Accrued Expenses', 'هزینه‌های تعهدی', 'liability', 'credit'),
('3000', 'Equity', 'حقوق صاحبان سهام', 'equity', 'credit'),
('3100', 'Owner Equity', 'حقوق مالک', 'equity', 'credit'),
('4000', 'Revenue', 'درآمدها', 'revenue', 'credit'),
('4100', 'Sales Revenue', 'درآمد فروش', 'revenue', 'credit'),
('4110', 'Gold Sales', 'فروش طلا', 'revenue', 'credit'),
('4120', 'Labor Revenue', 'درآمد اجرت', 'revenue', 'credit'),
('4130', 'Profit Revenue', 'درآمد سود', 'revenue', 'credit'),
('5000', 'Expenses', 'هزینه‌ها', 'expense', 'debit'),
('5100', 'Cost of Goods Sold', 'بهای تمام شده کالای فروخته شده', 'expense', 'debit'),
('5200', 'Operating Expenses', 'هزینه‌های عملیاتی', 'expense', 'debit'),
('5210', 'Rent Expense', 'هزینه اجاره', 'expense', 'debit'),
('5220', 'Utilities Expense', 'هزینه آب و برق', 'expense', 'debit'),
('5230', 'Tax Expense', 'هزینه مالیات', 'expense', 'debit')
ON CONFLICT (account_code) DO NOTHING;

-- Update parent relationships
UPDATE chart_of_accounts SET parent_account_id = (SELECT id FROM chart_of_accounts WHERE account_code = '1000'), account_level = 1 WHERE account_code = '1100';
UPDATE chart_of_accounts SET parent_account_id = (SELECT id FROM chart_of_accounts WHERE account_code = '1100'), account_level = 2 WHERE account_code IN ('1110', '1120', '1130', '1140');
UPDATE chart_of_accounts SET parent_account_id = (SELECT id FROM chart_of_accounts WHERE account_code = '2000'), account_level = 1 WHERE account_code = '2100';
UPDATE chart_of_accounts SET parent_account_id = (SELECT id FROM chart_of_accounts WHERE account_code = '2100'), account_level = 2 WHERE account_code IN ('2110', '2120');
UPDATE chart_of_accounts SET parent_account_id = (SELECT id FROM chart_of_accounts WHERE account_code = '3000'), account_level = 1 WHERE account_code = '3100';
UPDATE chart_of_accounts SET parent_account_id = (SELECT id FROM chart_of_accounts WHERE account_code = '4000'), account_level = 1 WHERE account_code = '4100';
UPDATE chart_of_accounts SET parent_account_id = (SELECT id FROM chart_of_accounts WHERE account_code = '4100'), account_level = 2 WHERE account_code IN ('4110', '4120', '4130');
UPDATE chart_of_accounts SET parent_account_id = (SELECT id FROM chart_of_accounts WHERE account_code = '5000'), account_level = 1 WHERE account_code IN ('5100', '5200');
UPDATE chart_of_accounts SET parent_account_id = (SELECT id FROM chart_of_accounts WHERE account_code = '5200'), account_level = 2 WHERE account_code IN ('5210', '5220', '5230');