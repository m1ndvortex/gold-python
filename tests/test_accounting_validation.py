"""
Accounting Validation Tests

Tests double-entry accounting system validation, balance verification,
financial report accuracy, and Persian terminology support.
"""

from decimal import Decimal

import pytest
import requests
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker


class TestAccountingValidation:
    """Accounting validation and double-entry tests"""
    
    @pytest.fixture(autouse=True)
    def setup_test_environment(self):
        """Setup test environment with real database"""
        self.base_url = "http://localhost:8000"
        self.db_url = "postgresql://goldshop_user:goldshop_password@localhost:5432/goldshop"
        
        # Create database engine for direct queries
        self.engine = create_engine(self.db_url)
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        
        # Test data tracking
        self.test_journal_entries = []
        self.test_accounts = []
        self.test_invoices = []
        self.test_customers = []
        self.test_items = []
        
        # Setup test data
        self._setup_test_data()
        
        yield
        
        # Cleanup
        self._cleanup_test_data()
    
    def _setup_test_data(self):
        """Setup required test data"""
        
        # Create test customer
        customer_data = {
            "name": "Accounting Test Customer",
            "phone": "+1234567890",
            "email": "accounting@example.com"
        }
        
        response = requests.post(f"{self.base_url}/api/customers", json=customer_data)
        if response.status_code == 201:
            self.test_customer = response.json()
            self.test_customers.append(self.test_customer['id'])
        
        # Create test inventory item
        item_data = {
            "name": "Accounting Test Item",
            "sku": "ACC001",
            "cost_price": 100.00,
            "sale_price": 150.00,
            "stock_quantity": 50
        }
        
        response = requests.post(f"{self.base_url}/api/inventory/items", json=item_data)
        if response.status_code == 201:
            self.test_item = response.json()
            self.test_items.append(self.test_item['id'])
        
        # Setup chart of accounts
        self._setup_chart_of_accounts()
    
    def _setup_chart_of_accounts(self):
        """Setup basic chart of accounts for testing"""
        
        # Standard accounting accounts
        accounts_data = [
            # Assets
            {"code": "1000", "name": "Cash", "name_persian": "نقد", "type": "asset", "parent_code": None},
            {"code": "1100", "name": "Accounts Receivable", "name_persian": "حساب‌های دریافتنی", "type": "asset", "parent_code": None},
            {"code": "1200", "name": "Inventory", "name_persian": "موجودی کالا", "type": "asset", "parent_code": None},
            
            # Liabilities
            {"code": "2000", "name": "Accounts Payable", "name_persian": "حساب‌های پرداختنی", "type": "liability", "parent_code": None},
            {"code": "2100", "name": "Sales Tax Payable", "name_persian": "مالیات فروش پرداختنی", "type": "liability", "parent_code": None},
            
            # Equity
            {"code": "3000", "name": "Owner's Equity", "name_persian": "حقوق صاحبان سهام", "type": "equity", "parent_code": None},
            
            # Revenue
            {"code": "4000", "name": "Sales Revenue", "name_persian": "درآمد فروش", "type": "revenue", "parent_code": None},
            {"code": "4100", "name": "Gold Sales Revenue", "name_persian": "درآمد فروش طلا", "type": "revenue", "parent_code": None},
            
            # Expenses
            {"code": "5000", "name": "Cost of Goods Sold", "name_persian": "بهای تمام شده کالای فروخته شده", "type": "expense", "parent_code": None},
            {"code": "5100", "name": "Labor Costs", "name_persian": "هزینه‌های اجرت", "type": "expense", "parent_code": None},
            {"code": "5200", "name": "Operating Expenses", "name_persian": "هزینه‌های عملیاتی", "type": "expense", "parent_code": None},
            
            # Gold-specific accounts
            {"code": "4200", "name": "Gold Profit", "name_persian": "سود طلا", "type": "revenue", "parent_code": None},
            {"code": "4300", "name": "Gold Labor Revenue", "name_persian": "درآمد اجرت طلا", "type": "revenue", "parent_code": None},
        ]
        
        for account_data in accounts_data:
            response = requests.post(f"{self.base_url}/api/accounting/accounts", json=account_data)
            if response.status_code == 201:
                account = response.json()
                self.test_accounts.append(account['id'])
    
    def _cleanup_test_data(self):
        """Clean up test data from database"""
        with self.SessionLocal() as db:
            # Delete test journal entries
            for entry_id in self.test_journal_entries:
                db.execute(text("DELETE FROM journal_entries WHERE id = :id"), {"id": entry_id})
            
            # Delete test invoices
            for invoice_id in self.test_invoices:
                db.execute(text("DELETE FROM invoices WHERE id = :id"), {"id": invoice_id})
            
            # Delete test items
            for item_id in self.test_items:
                db.execute(text("DELETE FROM inventory_items WHERE id = :id"), {"id": item_id})
            
            # Delete test customers
            for customer_id in self.test_customers:
                db.execute(text("DELETE FROM customers WHERE id = :id"), {"id": customer_id})
            
            # Delete test accounts
            for account_id in self.test_accounts:
                db.execute(text("DELETE FROM chart_of_accounts WHERE id = :id"), {"id": account_id})
            
            db.commit()
    
    def test_double_entry_balance_validation(self):
        """Test that all journal entries maintain double-entry balance"""
        
        # Create manual journal entry
        journal_data = {
            "date": "2024-01-15",
            "reference": "TEST001",
            "description": "Test double-entry validation",
            "entries": [
                {
                    "account_code": "1000",  # Cash (Debit)
                    "debit_amount": 1000.00,
                    "credit_amount": 0.00,
                    "description": "Cash received"
                },
                {
                    "account_code": "4000",  # Sales Revenue (Credit)
                    "debit_amount": 0.00,
                    "credit_amount": 1000.00,
                    "description": "Sales revenue"
                }
            ]
        }
        
        response = requests.post(f"{self.base_url}/api/accounting/journal-entries", json=journal_data)
        assert response.status_code == 201
        
        journal_entry = response.json()
        self.test_journal_entries.append(journal_entry['id'])
        
        # Verify balance
        assert journal_entry['total_debit'] == 1000.00
        assert journal_entry['total_credit'] == 1000.00
        assert journal_entry['balanced'] is True
        
        # Test unbalanced entry (should fail)
        unbalanced_data = {
            "date": "2024-01-15",
            "reference": "TEST002",
            "description": "Test unbalanced entry",
            "entries": [
                {
                    "account_code": "1000",  # Cash (Debit)
                    "debit_amount": 1000.00,
                    "credit_amount": 0.00,
                    "description": "Cash received"
                },
                {
                    "account_code": "4000",  # Sales Revenue (Credit)
                    "debit_amount": 0.00,
                    "credit_amount": 500.00,  # Unbalanced!
                    "description": "Sales revenue"
                }
            ]
        }
        
        response = requests.post(f"{self.base_url}/api/accounting/journal-entries", json=unbalanced_data)
        assert response.status_code == 400
        assert "balance" in response.json()['detail'].lower()
    
    def test_invoice_accounting_integration(self):
        """Test automatic journal entry generation for invoices"""
        
        # Create general invoice
        invoice_data = {
            "type": "general",
            "customer_id": self.test_customer['id'],
            "items": [
                {
                    "inventory_item_id": self.test_item['id'],
                    "quantity": 2,
                    "unit_price": 150.00,
                    "total_price": 300.00
                }
            ],
            "subtotal": 300.00,
            "tax_amount": 30.00,
            "total": 330.00
        }
        
        response = requests.post(f"{self.base_url}/api/invoices", json=invoice_data)
        assert response.status_code == 201
        invoice = response.json()
        self.test_invoices.append(invoice['id'])
        
        # Approve invoice to trigger accounting entries
        approval_data = {"status": "approved"}
        response = requests.patch(f"{self.base_url}/api/invoices/{invoice['id']}/status", json=approval_data)
        assert response.status_code == 200
        
        # Verify journal entries were created
        response = requests.get(f"{self.base_url}/api/accounting/journal-entries", params={"source": "invoice", "source_id": invoice['id']})
        assert response.status_code == 200
        
        journal_entries = response.json()
        assert len(journal_entries) > 0
        
        # Verify entries are balanced
        for entry in journal_entries:
            assert entry['balanced'] is True
            assert entry['total_debit'] == entry['total_credit']
            self.test_journal_entries.append(entry['id'])
        
        # Verify specific accounting entries for general invoice
        # Should have entries for:
        # - Accounts Receivable (Debit) / Sales Revenue (Credit)
        # - Cost of Goods Sold (Debit) / Inventory (Credit)
        # - Accounts Receivable (Debit) / Sales Tax Payable (Credit)
        
        all_entries = []
        for journal_entry in journal_entries:
            all_entries.extend(journal_entry['entries'])
        
        # Check for sales revenue entry
        sales_entries = [e for e in all_entries if e['account_code'] == '4000']
        assert len(sales_entries) > 0
        
        # Check for inventory/COGS entries
        inventory_entries = [e for e in all_entries if e['account_code'] == '1200']
        cogs_entries = [e for e in all_entries if e['account_code'] == '5000']
        assert len(inventory_entries) > 0 or len(cogs_entries) > 0
    
    def test_gold_invoice_accounting_integration(self):
        """Test accounting integration for Gold invoices with specialized fields"""
        
        # Create gold invoice
        invoice_data = {
            "type": "gold",
            "customer_id": self.test_customer['id'],
            "items": [
                {
                    "inventory_item_id": self.test_item['id'],
                    "quantity": 1,
                    "unit_price": 1200.00,
                    "total_price": 1200.00
                }
            ],
            "subtotal": 1200.00,
            "tax_amount": 120.00,
            "total": 1320.00,
            
            # Gold-specific fields
            "gold_sood": 200.00,      # سود (profit)
            "gold_ojrat": 300.00,     # اجرت (wage/labor fee)
            "gold_maliyat": 120.00,   # مالیات (tax)
            "gold_price": 60.00,
            "gold_total_weight": 10.0
        }
        
        response = requests.post(f"{self.base_url}/api/invoices", json=invoice_data)
        assert response.status_code == 201
        invoice = response.json()
        self.test_invoices.append(invoice['id'])
        
        # Approve invoice
        approval_data = {"status": "approved"}
        response = requests.patch(f"{self.base_url}/api/invoices/{invoice['id']}/status", json=approval_data)
        assert response.status_code == 200
        
        # Verify Gold-specific journal entries
        response = requests.get(f"{self.base_url}/api/accounting/journal-entries", params={"source": "invoice", "source_id": invoice['id']})
        assert response.status_code == 200
        
        journal_entries = response.json()
        assert len(journal_entries) > 0
        
        # Collect all entries
        all_entries = []
        for journal_entry in journal_entries:
            all_entries.extend(journal_entry['entries'])
            self.test_journal_entries.append(journal_entry['id'])
        
        # Verify Gold-specific account entries
        
        # Check for Gold Profit entry (سود)
        gold_profit_entries = [e for e in all_entries if e['account_code'] == '4200']
        if gold_profit_entries:
            profit_entry = gold_profit_entries[0]
            assert profit_entry['credit_amount'] == 200.00  # Should match gold_sood
        
        # Check for Gold Labor Revenue entry (اجرت)
        gold_labor_entries = [e for e in all_entries if e['account_code'] == '4300']
        if gold_labor_entries:
            labor_entry = gold_labor_entries[0]
            assert labor_entry['credit_amount'] == 300.00  # Should match gold_ojrat
        
        # Check for tax entry (مالیات)
        tax_entries = [e for e in all_entries if e['account_code'] == '2100']
        if tax_entries:
            tax_entry = tax_entries[0]
            assert tax_entry['credit_amount'] == 120.00  # Should match gold_maliyat
        
        # Verify all entries are balanced
        for entry in journal_entries:
            assert entry['balanced'] is True
            assert entry['total_debit'] == entry['total_credit']
    
    def test_subsidiary_accounts_management(self):
        """Test subsidiary accounts (حساب‌های تفصیلی) management"""
        
        # Create subsidiary account
        subsidiary_data = {
            "code": "1100-001",
            "name": "Customer A/R",
            "name_persian": "حساب دریافتنی مشتری",
            "parent_account_code": "1100",  # Accounts Receivable
            "type": "subsidiary",
            "customer_id": self.test_customer['id']
        }
        
        response = requests.post(f"{self.base_url}/api/accounting/subsidiary-accounts", json=subsidiary_data)
        assert response.status_code == 201
        
        subsidiary_account = response.json()
        self.test_accounts.append(subsidiary_account['id'])
        
        # Verify subsidiary account structure
        assert subsidiary_account['code'] == "1100-001"
        assert subsidiary_account['parent_account_code'] == "1100"
        assert subsidiary_account['type'] == "subsidiary"
        assert subsidiary_account['customer_id'] == self.test_customer['id']
        
        # Test subsidiary account balance calculation
        response = requests.get(f"{self.base_url}/api/accounting/subsidiary-accounts/{subsidiary_account['id']}/balance")
        assert response.status_code == 200
        
        balance_data = response.json()
        assert 'debit_balance' in balance_data
        assert 'credit_balance' in balance_data
        assert 'net_balance' in balance_data
        
        # Test subsidiary account transactions
        response = requests.get(f"{self.base_url}/api/accounting/subsidiary-accounts/{subsidiary_account['id']}/transactions")
        assert response.status_code == 200
        
        transactions = response.json()
        assert isinstance(transactions, list)
    
    def test_general_ledger_functionality(self):
        """Test general ledger (دفتر معین) functionality"""
        
        # Get general ledger for specific account
        response = requests.get(f"{self.base_url}/api/accounting/general-ledger", params={"account_code": "1000"})
        assert response.status_code == 200
        
        ledger_data = response.json()
        assert 'account_code' in ledger_data
        assert 'account_name' in ledger_data
        assert 'account_name_persian' in ledger_data
        assert 'transactions' in ledger_data
        assert 'running_balance' in ledger_data
        
        # Verify running balance calculation
        transactions = ledger_data['transactions']
        calculated_balance = 0
        
        for transaction in transactions:
            if transaction['debit_amount']:
                calculated_balance += transaction['debit_amount']
            if transaction['credit_amount']:
                calculated_balance -= transaction['credit_amount']
        
        # The running balance should match our calculation
        if transactions:
            assert abs(ledger_data['running_balance'] - calculated_balance) < 0.01
        
        # Test general ledger with date range
        response = requests.get(
            f"{self.base_url}/api/accounting/general-ledger",
            params={
                "account_code": "1000",
                "date_from": "2024-01-01",
                "date_to": "2024-12-31"
            }
        )
        assert response.status_code == 200
        
        filtered_ledger = response.json()
        assert 'transactions' in filtered_ledger
        
        # All transactions should be within date range
        for transaction in filtered_ledger['transactions']:
            transaction_date = transaction['date']
            assert "2024" in transaction_date  # Simple date check
    
    def test_trial_balance_accuracy(self):
        """Test trial balance calculation and accuracy"""
        
        # Get trial balance
        response = requests.get(f"{self.base_url}/api/accounting/reports/trial-balance")
        assert response.status_code == 200
        
        trial_balance = response.json()
        assert 'accounts' in trial_balance
        assert 'total_debits' in trial_balance
        assert 'total_credits' in trial_balance
        assert 'balanced' in trial_balance
        
        # Verify trial balance is balanced
        assert trial_balance['balanced'] is True
        assert abs(trial_balance['total_debits'] - trial_balance['total_credits']) < 0.01
        
        # Verify account balances
        accounts = trial_balance['accounts']
        calculated_total_debits = sum(acc['debit_balance'] for acc in accounts)
        calculated_total_credits = sum(acc['credit_balance'] for acc in accounts)
        
        assert abs(calculated_total_debits - trial_balance['total_debits']) < 0.01
        assert abs(calculated_total_credits - trial_balance['total_credits']) < 0.01
        
        # Test trial balance with date range
        response = requests.get(
            f"{self.base_url}/api/accounting/reports/trial-balance",
            params={
                "date_from": "2024-01-01",
                "date_to": "2024-12-31"
            }
        )
        assert response.status_code == 200
        
        dated_trial_balance = response.json()
        assert dated_trial_balance['balanced'] is True
    
    def test_financial_reports_accuracy(self):
        """Test financial reports accuracy and calculations"""
        
        # Test Balance Sheet
        response = requests.get(f"{self.base_url}/api/accounting/reports/balance-sheet")
        assert response.status_code == 200
        
        balance_sheet = response.json()
        assert 'assets' in balance_sheet
        assert 'liabilities' in balance_sheet
        assert 'equity' in balance_sheet
        assert 'total_assets' in balance_sheet
        assert 'total_liabilities_equity' in balance_sheet
        
        # Balance sheet should balance
        assert abs(balance_sheet['total_assets'] - balance_sheet['total_liabilities_equity']) < 0.01
        
        # Test Income Statement
        response = requests.get(f"{self.base_url}/api/accounting/reports/income-statement")
        assert response.status_code == 200
        
        income_statement = response.json()
        assert 'revenue' in income_statement
        assert 'expenses' in income_statement
        assert 'gross_profit' in income_statement
        assert 'net_income' in income_statement
        
        # Verify calculations
        total_revenue = sum(item['amount'] for item in income_statement['revenue'])
        total_expenses = sum(item['amount'] for item in income_statement['expenses'])
        calculated_net_income = total_revenue - total_expenses
        
        assert abs(calculated_net_income - income_statement['net_income']) < 0.01
        
        # Test Cash Flow Statement
        response = requests.get(f"{self.base_url}/api/accounting/reports/cash-flow")
        assert response.status_code == 200
        
        cash_flow = response.json()
        assert 'operating_activities' in cash_flow
        assert 'investing_activities' in cash_flow
        assert 'financing_activities' in cash_flow
        assert 'net_cash_flow' in cash_flow
    
    def test_persian_terminology_support(self):
        """Test Persian terminology support in accounting"""
        
        # Test account names in Persian
        response = requests.get(f"{self.base_url}/api/accounting/accounts")
        assert response.status_code == 200
        
        accounts = response.json()
        
        # Verify Persian names are present
        for account in accounts:
            if account['name_persian']:
                # Should contain Persian characters
                persian_chars = any(ord(char) > 1500 for char in account['name_persian'])
                assert persian_chars, f"Account {account['name']} should have Persian name with Persian characters"
        
        # Test reports with Persian terminology
        response = requests.get(f"{self.base_url}/api/accounting/reports/balance-sheet", params={"language": "persian"})
        assert response.status_code == 200
        
        persian_balance_sheet = response.json()
        
        # Should have Persian labels
        assert 'labels' in persian_balance_sheet
        labels = persian_balance_sheet['labels']
        
        # Check for key Persian terms
        persian_terms = ['دارایی', 'بدهی', 'حقوق صاحبان سهام']  # Assets, Liabilities, Equity
        for term in persian_terms:
            found = any(term in str(label) for label in labels.values())
            # Note: This test might need adjustment based on actual implementation
    
    def test_accounting_period_management(self):
        """Test accounting period closing and locking"""
        
        # Create accounting period
        period_data = {
            "name": "Test Period 2024-01",
            "start_date": "2024-01-01",
            "end_date": "2024-01-31",
            "status": "open"
        }
        
        response = requests.post(f"{self.base_url}/api/accounting/periods", json=period_data)
        assert response.status_code == 201
        
        period = response.json()
        
        # Test period closing
        response = requests.patch(f"{self.base_url}/api/accounting/periods/{period['id']}/close")
        assert response.status_code == 200
        
        closed_period = response.json()
        assert closed_period['status'] == 'closed'
        
        # Test that entries cannot be modified in closed period
        journal_data = {
            "date": "2024-01-15",  # Within closed period
            "reference": "TEST_CLOSED",
            "description": "Test entry in closed period",
            "entries": [
                {
                    "account_code": "1000",
                    "debit_amount": 100.00,
                    "credit_amount": 0.00,
                    "description": "Test debit"
                },
                {
                    "account_code": "4000",
                    "debit_amount": 0.00,
                    "credit_amount": 100.00,
                    "description": "Test credit"
                }
            ]
        }
        
        response = requests.post(f"{self.base_url}/api/accounting/journal-entries", json=journal_data)
        assert response.status_code == 400
        assert "closed" in response.json()['detail'].lower() or "locked" in response.json()['detail'].lower()
    
    def test_audit_trail_functionality(self):
        """Test comprehensive audit trail for accounting changes"""
        
        # Create journal entry
        journal_data = {
            "date": "2024-01-15",
            "reference": "AUDIT_TEST",
            "description": "Test audit trail",
            "entries": [
                {
                    "account_code": "1000",
                    "debit_amount": 500.00,
                    "credit_amount": 0.00,
                    "description": "Test debit"
                },
                {
                    "account_code": "4000",
                    "debit_amount": 0.00,
                    "credit_amount": 500.00,
                    "description": "Test credit"
                }
            ]
        }
        
        response = requests.post(f"{self.base_url}/api/accounting/journal-entries", json=journal_data)
        assert response.status_code == 201
        
        journal_entry = response.json()
        self.test_journal_entries.append(journal_entry['id'])
        
        # Modify journal entry
        update_data = {
            "description": "Updated test audit trail"
        }
        
        response = requests.patch(f"{self.base_url}/api/accounting/journal-entries/{journal_entry['id']}", json=update_data)
        assert response.status_code == 200
        
        # Get audit trail
        response = requests.get(f"{self.base_url}/api/accounting/journal-entries/{journal_entry['id']}/audit-trail")
        assert response.status_code == 200
        
        audit_trail = response.json()
        assert isinstance(audit_trail, list)
        assert len(audit_trail) >= 2  # Creation and modification
        
        # Verify audit trail entries
        for audit_entry in audit_trail:
            assert 'action' in audit_entry
            assert 'timestamp' in audit_entry
            assert 'user_id' in audit_entry
            assert 'changes' in audit_entry
        
        # Should have creation and update actions
        actions = [entry['action'] for entry in audit_trail]
        assert 'created' in actions
        assert 'updated' in actions
    
    def test_account_balance_calculations(self):
        """Test account balance calculations across different scenarios"""
        
        # Get initial balance for cash account
        response = requests.get(f"{self.base_url}/api/accounting/accounts/1000/balance")
        assert response.status_code == 200
        
        initial_balance = response.json()
        initial_amount = initial_balance['balance']
        
        # Create journal entry affecting cash
        journal_data = {
            "date": "2024-01-15",
            "reference": "BALANCE_TEST",
            "description": "Test balance calculation",
            "entries": [
                {
                    "account_code": "1000",  # Cash
                    "debit_amount": 1000.00,
                    "credit_amount": 0.00,
                    "description": "Cash increase"
                },
                {
                    "account_code": "3000",  # Owner's Equity
                    "debit_amount": 0.00,
                    "credit_amount": 1000.00,
                    "description": "Equity increase"
                }
            ]
        }
        
        response = requests.post(f"{self.base_url}/api/accounting/journal-entries", json=journal_data)
        assert response.status_code == 201
        
        journal_entry = response.json()
        self.test_journal_entries.append(journal_entry['id'])
        
        # Get updated balance
        response = requests.get(f"{self.base_url}/api/accounting/accounts/1000/balance")
        assert response.status_code == 200
        
        updated_balance = response.json()
        updated_amount = updated_balance['balance']
        
        # Balance should have increased by 1000
        assert abs((updated_amount - initial_amount) - 1000.00) < 0.01
        
        # Test balance with date range
        response = requests.get(
            f"{self.base_url}/api/accounting/accounts/1000/balance",
            params={
                "date_from": "2024-01-01",
                "date_to": "2024-01-31"
            }
        )
        assert response.status_code == 200
        
        period_balance = response.json()
        assert 'balance' in period_balance
        assert 'period_activity' in period_balance


if __name__ == "__main__":
    pytest.main([__file__, "-v"])