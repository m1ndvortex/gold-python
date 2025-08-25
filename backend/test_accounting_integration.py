"""
Integration Tests for Double-Entry Accounting System
Tests integration with invoice system and automated journal entry creation
"""

import pytest
from decimal import Decimal
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from fastapi.testclient import TestClient

from main import app
from database import get_db, engine
from models_accounting import Base as AccountingBase
from models_universal import Base as UniversalBase
from services.accounting_service import AccountingService
from schemas_accounting import (
    ChartOfAccountsCreate, JournalEntryCreate, JournalEntryLineCreate,
    AccountType, JournalEntryStatus
)

# Test client
client = TestClient(app)

@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database session for each test"""
    # Create all tables
    AccountingBase.metadata.create_all(bind=engine)
    UniversalBase.metadata.create_all(bind=engine)
    
    # Get database session
    db = next(get_db())
    
    try:
        yield db
    finally:
        db.close()
        # Clean up tables after test
        AccountingBase.metadata.drop_all(bind=engine)
        UniversalBase.metadata.drop_all(bind=engine)

@pytest.fixture
def accounting_service(db_session):
    """Create accounting service instance"""
    return AccountingService(db_session)

@pytest.fixture
def complete_chart_of_accounts(accounting_service):
    """Create a complete chart of accounts for business operations"""
    accounts = {}
    
    # Assets
    accounts['cash'] = accounting_service.create_chart_account(
        ChartOfAccountsCreate(
            account_code="1100",
            account_name="Cash",
            account_type=AccountType.ASSET,
            description="Cash and cash equivalents"
        ),
        "system"
    )
    
    accounts['accounts_receivable'] = accounting_service.create_chart_account(
        ChartOfAccountsCreate(
            account_code="1200",
            account_name="Accounts Receivable",
            account_type=AccountType.ASSET,
            description="Customer receivables"
        ),
        "system"
    )
    
    accounts['inventory'] = accounting_service.create_chart_account(
        ChartOfAccountsCreate(
            account_code="1300",
            account_name="Inventory",
            account_type=AccountType.ASSET,
            description="Inventory assets"
        ),
        "system"
    )
    
    # Liabilities
    accounts['accounts_payable'] = accounting_service.create_chart_account(
        ChartOfAccountsCreate(
            account_code="2100",
            account_name="Accounts Payable",
            account_type=AccountType.LIABILITY,
            description="Vendor payables"
        ),
        "system"
    )
    
    accounts['sales_tax_payable'] = accounting_service.create_chart_account(
        ChartOfAccountsCreate(
            account_code="2200",
            account_name="Sales Tax Payable",
            account_type=AccountType.LIABILITY,
            description="Sales tax collected"
        ),
        "system"
    )
    
    # Revenue
    accounts['sales_revenue'] = accounting_service.create_chart_account(
        ChartOfAccountsCreate(
            account_code="4100",
            account_name="Sales Revenue",
            account_type=AccountType.REVENUE,
            description="Product sales revenue"
        ),
        "system"
    )
    
    accounts['service_revenue'] = accounting_service.create_chart_account(
        ChartOfAccountsCreate(
            account_code="4200",
            account_name="Service Revenue",
            account_type=AccountType.REVENUE,
            description="Service revenue"
        ),
        "system"
    )
    
    # Expenses
    accounts['cost_of_goods_sold'] = accounting_service.create_chart_account(
        ChartOfAccountsCreate(
            account_code="5100",
            account_name="Cost of Goods Sold",
            account_type=AccountType.EXPENSE,
            description="Direct cost of products sold"
        ),
        "system"
    )
    
    accounts['operating_expenses'] = accounting_service.create_chart_account(
        ChartOfAccountsCreate(
            account_code="5200",
            account_name="Operating Expenses",
            account_type=AccountType.EXPENSE,
            description="General operating expenses"
        ),
        "system"
    )
    
    return accounts

class TestInvoiceAccountingIntegration:
    """Test integration between invoice system and accounting"""
    
    def test_cash_sale_journal_entry_creation(self, accounting_service, complete_chart_of_accounts):
        """Test automatic journal entry creation for cash sales"""
        accounts = complete_chart_of_accounts
        
        # Simulate cash sale invoice data
        invoice_data = {
            "invoice_id": "INV-001",
            "customer_name": "John Doe",
            "total_amount": Decimal('1000.00'),
            "tax_amount": Decimal('80.00'),
            "subtotal": Decimal('920.00'),
            "payment_method": "cash",
            "items": [
                {
                    "product_name": "Product A",
                    "quantity": 2,
                    "unit_price": Decimal('400.00'),
                    "total": Decimal('800.00'),
                    "cost_price": Decimal('300.00')
                },
                {
                    "product_name": "Product B", 
                    "quantity": 1,
                    "unit_price": Decimal('120.00'),
                    "total": Decimal('120.00'),
                    "cost_price": Decimal('80.00')
                }
            ]
        }
        
        # Create journal entry for cash sale
        journal_lines = []
        
        # Debit Cash (total amount received)
        journal_lines.append(JournalEntryLineCreate(
            account_id=str(accounts['cash'].id),
            debit_amount=invoice_data['total_amount'],
            credit_amount=Decimal('0.00'),
            description=f"Cash sale - {invoice_data['invoice_id']}"
        ))
        
        # Credit Sales Revenue (subtotal)
        journal_lines.append(JournalEntryLineCreate(
            account_id=str(accounts['sales_revenue'].id),
            debit_amount=Decimal('0.00'),
            credit_amount=invoice_data['subtotal'],
            description=f"Sales revenue - {invoice_data['invoice_id']}"
        ))
        
        # Credit Sales Tax Payable (tax amount)
        journal_lines.append(JournalEntryLineCreate(
            account_id=str(accounts['sales_tax_payable'].id),
            debit_amount=Decimal('0.00'),
            credit_amount=invoice_data['tax_amount'],
            description=f"Sales tax - {invoice_data['invoice_id']}"
        ))
        
        # Debit Cost of Goods Sold
        total_cost = sum(item['cost_price'] * item['quantity'] for item in invoice_data['items'])
        journal_lines.append(JournalEntryLineCreate(
            account_id=str(accounts['cost_of_goods_sold'].id),
            debit_amount=total_cost,
            credit_amount=Decimal('0.00'),
            description=f"COGS - {invoice_data['invoice_id']}"
        ))
        
        # Credit Inventory
        journal_lines.append(JournalEntryLineCreate(
            account_id=str(accounts['inventory'].id),
            debit_amount=Decimal('0.00'),
            credit_amount=total_cost,
            description=f"Inventory reduction - {invoice_data['invoice_id']}"
        ))
        
        # Create the journal entry
        entry_data = JournalEntryCreate(
            entry_date=datetime.utcnow(),
            description=f"Cash sale - {invoice_data['invoice_id']}",
            reference=invoice_data['invoice_id'],
            source_type="invoice",
            source_id=invoice_data['invoice_id'],
            lines=journal_lines
        )
        
        entry = accounting_service.create_journal_entry(entry_data, "system")
        posted_entry = accounting_service.post_journal_entry(str(entry.id), "system")
        
        # Verify the entry
        assert posted_entry.status == JournalEntryStatus.POSTED
        assert posted_entry.total_debit == posted_entry.total_credit
        assert len(posted_entry.lines) == 5
        
        # Verify specific amounts
        cash_line = next(line for line in posted_entry.lines if line.account_id == str(accounts['cash'].id))
        assert cash_line.debit_amount == Decimal('1000.00')
        
        revenue_line = next(line for line in posted_entry.lines if line.account_id == str(accounts['sales_revenue'].id))
        assert revenue_line.credit_amount == Decimal('920.00')
        
        cogs_line = next(line for line in posted_entry.lines if line.account_id == str(accounts['cost_of_goods_sold'].id))
        assert cogs_line.debit_amount == Decimal('680.00')  # (300*2) + (80*1)
    
    def test_credit_sale_journal_entry_creation(self, accounting_service, complete_chart_of_accounts):
        """Test automatic journal entry creation for credit sales"""
        accounts = complete_chart_of_accounts
        
        # Simulate credit sale invoice data
        invoice_data = {
            "invoice_id": "INV-002",
            "customer_name": "ABC Company",
            "total_amount": Decimal('2500.00'),
            "tax_amount": Decimal('200.00'),
            "subtotal": Decimal('2300.00'),
            "payment_method": "credit",
            "payment_terms": "Net 30"
        }
        
        # Create journal entry for credit sale
        journal_lines = [
            # Debit Accounts Receivable
            JournalEntryLineCreate(
                account_id=str(accounts['accounts_receivable'].id),
                debit_amount=invoice_data['total_amount'],
                credit_amount=Decimal('0.00'),
                description=f"Credit sale - {invoice_data['customer_name']}",
                subsidiary_account=invoice_data['customer_name']
            ),
            
            # Credit Sales Revenue
            JournalEntryLineCreate(
                account_id=str(accounts['sales_revenue'].id),
                debit_amount=Decimal('0.00'),
                credit_amount=invoice_data['subtotal'],
                description=f"Sales revenue - {invoice_data['invoice_id']}"
            ),
            
            # Credit Sales Tax Payable
            JournalEntryLineCreate(
                account_id=str(accounts['sales_tax_payable'].id),
                debit_amount=Decimal('0.00'),
                credit_amount=invoice_data['tax_amount'],
                description=f"Sales tax - {invoice_data['invoice_id']}"
            )
        ]
        
        entry_data = JournalEntryCreate(
            entry_date=datetime.utcnow(),
            description=f"Credit sale - {invoice_data['invoice_id']}",
            reference=invoice_data['invoice_id'],
            source_type="invoice",
            source_id=invoice_data['invoice_id'],
            lines=journal_lines
        )
        
        entry = accounting_service.create_journal_entry(entry_data, "system")
        posted_entry = accounting_service.post_journal_entry(str(entry.id), "system")
        
        # Verify the entry
        assert posted_entry.status == JournalEntryStatus.POSTED
        assert posted_entry.total_debit == Decimal('2500.00')
        assert posted_entry.total_credit == Decimal('2500.00')
        
        # Verify subsidiary account tracking
        ar_line = next(line for line in posted_entry.lines if line.account_id == str(accounts['accounts_receivable'].id))
        assert ar_line.subsidiary_account == "ABC Company"
    
    def test_payment_receipt_journal_entry(self, accounting_service, complete_chart_of_accounts):
        """Test journal entry creation for payment receipts"""
        accounts = complete_chart_of_accounts
        
        # Simulate payment receipt data
        payment_data = {
            "payment_id": "PAY-001",
            "customer_name": "ABC Company",
            "amount": Decimal('2500.00'),
            "payment_method": "check",
            "check_number": "1234",
            "invoice_reference": "INV-002"
        }
        
        # Create journal entry for payment receipt
        journal_lines = [
            # Debit Cash
            JournalEntryLineCreate(
                account_id=str(accounts['cash'].id),
                debit_amount=payment_data['amount'],
                credit_amount=Decimal('0.00'),
                description=f"Payment received - Check #{payment_data['check_number']}",
                reference=payment_data['check_number']
            ),
            
            # Credit Accounts Receivable
            JournalEntryLineCreate(
                account_id=str(accounts['accounts_receivable'].id),
                debit_amount=Decimal('0.00'),
                credit_amount=payment_data['amount'],
                description=f"Payment from {payment_data['customer_name']}",
                subsidiary_account=payment_data['customer_name'],
                reference=payment_data['invoice_reference']
            )
        ]
        
        entry_data = JournalEntryCreate(
            entry_date=datetime.utcnow(),
            description=f"Payment receipt - {payment_data['payment_id']}",
            reference=payment_data['payment_id'],
            source_type="payment",
            source_id=payment_data['payment_id'],
            lines=journal_lines
        )
        
        entry = accounting_service.create_journal_entry(entry_data, "system")
        posted_entry = accounting_service.post_journal_entry(str(entry.id), "system")
        
        # Verify the entry
        assert posted_entry.status == JournalEntryStatus.POSTED
        assert posted_entry.total_debit == Decimal('2500.00')
        assert posted_entry.total_credit == Decimal('2500.00')

class TestGoldShopAccountingIntegration:
    """Test accounting integration for gold shop specific transactions"""
    
    def test_gold_sale_with_sood_and_ojrat(self, accounting_service, complete_chart_of_accounts):
        """Test journal entry for gold sale with سود (profit) and اجرت (labor)"""
        accounts = complete_chart_of_accounts
        
        # Create gold-specific accounts
        gold_inventory = accounting_service.create_chart_account(
            ChartOfAccountsCreate(
                account_code="1350",
                account_name="Gold Inventory",
                account_type=AccountType.ASSET,
                description="Gold inventory by weight"
            ),
            "system"
        )
        
        labor_revenue = accounting_service.create_chart_account(
            ChartOfAccountsCreate(
                account_code="4150",
                account_name="Labor Revenue (اجرت)",
                account_type=AccountType.REVENUE,
                description="Gold crafting labor revenue"
            ),
            "system"
        )
        
        # Simulate gold sale data
        gold_sale_data = {
            "invoice_id": "GOLD-001",
            "customer_name": "Gold Customer",
            "gold_weight": Decimal('10.5'),  # grams
            "gold_purity": Decimal('18'),     # karat
            "gold_price_per_gram": Decimal('60.00'),
            "sood": Decimal('50.00'),         # profit margin
            "ojrat": Decimal('150.00'),       # labor charge
            "total_amount": Decimal('780.00') # (10.5 * 60) + 50 + 150 = 830, but with discount = 780
        }
        
        gold_value = gold_sale_data['gold_weight'] * gold_sale_data['gold_price_per_gram']
        
        # Create journal entry for gold sale
        journal_lines = [
            # Debit Cash (total amount)
            JournalEntryLineCreate(
                account_id=str(accounts['cash'].id),
                debit_amount=gold_sale_data['total_amount'],
                credit_amount=Decimal('0.00'),
                description=f"Gold sale - {gold_sale_data['invoice_id']}"
            ),
            
            # Credit Gold Sales Revenue (gold value)
            JournalEntryLineCreate(
                account_id=str(accounts['sales_revenue'].id),
                debit_amount=Decimal('0.00'),
                credit_amount=gold_value,
                description=f"Gold sales - {gold_sale_data['gold_weight']}g @ {gold_sale_data['gold_purity']}K"
            ),
            
            # Credit Labor Revenue (اجرت)
            JournalEntryLineCreate(
                account_id=str(labor_revenue.id),
                debit_amount=Decimal('0.00'),
                credit_amount=gold_sale_data['ojrat'],
                description=f"Labor charges - {gold_sale_data['invoice_id']}"
            ),
            
            # Credit Additional Revenue for سود (if any difference)
            JournalEntryLineCreate(
                account_id=str(accounts['sales_revenue'].id),
                debit_amount=Decimal('0.00'),
                credit_amount=gold_sale_data['sood'],
                description=f"Profit margin - {gold_sale_data['invoice_id']}"
            ),
            
            # Debit Cost of Goods Sold (gold cost)
            JournalEntryLineCreate(
                account_id=str(accounts['cost_of_goods_sold'].id),
                debit_amount=gold_value - gold_sale_data['sood'],  # Cost without profit
                credit_amount=Decimal('0.00'),
                description=f"Gold COGS - {gold_sale_data['gold_weight']}g"
            ),
            
            # Credit Gold Inventory
            JournalEntryLineCreate(
                account_id=str(gold_inventory.id),
                debit_amount=Decimal('0.00'),
                credit_amount=gold_value - gold_sale_data['sood'],
                description=f"Gold inventory reduction - {gold_sale_data['gold_weight']}g"
            )
        ]
        
        entry_data = JournalEntryCreate(
            entry_date=datetime.utcnow(),
            description=f"Gold sale - {gold_sale_data['invoice_id']}",
            reference=gold_sale_data['invoice_id'],
            source_type="gold_invoice",
            source_id=gold_sale_data['invoice_id'],
            lines=journal_lines
        )
        
        entry = accounting_service.create_journal_entry(entry_data, "system")
        posted_entry = accounting_service.post_journal_entry(str(entry.id), "system")
        
        # Verify the entry
        assert posted_entry.status == JournalEntryStatus.POSTED
        assert posted_entry.is_balanced is True
        
        # Verify labor revenue is recorded separately
        labor_line = next(line for line in posted_entry.lines if line.account_id == str(labor_revenue.id))
        assert labor_line.credit_amount == Decimal('150.00')

class TestMultiCurrencyAccounting:
    """Test multi-currency accounting scenarios"""
    
    def test_foreign_currency_transaction(self, accounting_service, complete_chart_of_accounts):
        """Test journal entry for foreign currency transactions"""
        accounts = complete_chart_of_accounts
        
        # Create foreign currency accounts
        usd_cash = accounting_service.create_chart_account(
            ChartOfAccountsCreate(
                account_code="1110",
                account_name="Cash - USD",
                account_type=AccountType.ASSET,
                description="US Dollar cash account"
            ),
            "system"
        )
        
        exchange_gain_loss = accounting_service.create_chart_account(
            ChartOfAccountsCreate(
                account_code="4900",
                account_name="Foreign Exchange Gain/Loss",
                account_type=AccountType.REVENUE,
                description="Currency exchange differences"
            ),
            "system"
        )
        
        # Simulate foreign currency sale
        fx_transaction_data = {
            "invoice_id": "FX-001",
            "amount_usd": Decimal('1000.00'),
            "exchange_rate": Decimal('3.75'),  # USD to local currency
            "amount_local": Decimal('3750.00'),
            "bank_rate": Decimal('3.73'),      # Actual bank exchange rate
            "amount_received": Decimal('3730.00')  # What we actually received
        }
        
        exchange_loss = fx_transaction_data['amount_local'] - fx_transaction_data['amount_received']
        
        # Create journal entry
        journal_lines = [
            # Debit Local Cash (amount actually received)
            JournalEntryLineCreate(
                account_id=str(accounts['cash'].id),
                debit_amount=fx_transaction_data['amount_received'],
                credit_amount=Decimal('0.00'),
                description=f"USD sale converted at {fx_transaction_data['bank_rate']}"
            ),
            
            # Debit Exchange Loss
            JournalEntryLineCreate(
                account_id=str(exchange_gain_loss.id),
                debit_amount=exchange_loss,
                credit_amount=Decimal('0.00'),
                description=f"Exchange loss on USD conversion"
            ),
            
            # Credit USD Revenue (at official rate)
            JournalEntryLineCreate(
                account_id=str(accounts['sales_revenue'].id),
                debit_amount=Decimal('0.00'),
                credit_amount=fx_transaction_data['amount_local'],
                description=f"USD sale ${fx_transaction_data['amount_usd']} @ {fx_transaction_data['exchange_rate']}"
            )
        ]
        
        entry_data = JournalEntryCreate(
            entry_date=datetime.utcnow(),
            description=f"Foreign currency sale - {fx_transaction_data['invoice_id']}",
            reference=fx_transaction_data['invoice_id'],
            source_type="fx_transaction",
            lines=journal_lines
        )
        
        entry = accounting_service.create_journal_entry(entry_data, "system")
        posted_entry = accounting_service.post_journal_entry(str(entry.id), "system")
        
        # Verify the entry
        assert posted_entry.status == JournalEntryStatus.POSTED
        assert posted_entry.is_balanced is True
        
        # Verify exchange loss is recorded
        fx_line = next(line for line in posted_entry.lines if line.account_id == str(exchange_gain_loss.id))
        assert fx_line.debit_amount == Decimal('20.00')

class TestPeriodClosingIntegration:
    """Test period closing and financial statement integration"""
    
    def test_month_end_closing_process(self, accounting_service, complete_chart_of_accounts):
        """Test complete month-end closing process"""
        accounts = complete_chart_of_accounts
        
        # Create accounting period
        period_start = datetime(2024, 1, 1)
        period_end = datetime(2024, 1, 31)
        
        period = accounting_service.create_accounting_period(
            AccountingPeriodCreate(
                period_name="January 2024",
                start_date=period_start,
                end_date=period_end,
                period_type="monthly"
            )
        )
        
        # Create multiple transactions throughout the month
        transactions = [
            {
                "description": "Opening cash balance",
                "lines": [
                    (accounts['cash'].id, Decimal('10000.00'), Decimal('0.00')),
                    (accounts['accounts']['owner_equity'].id if 'owner_equity' in accounts else accounts['sales_revenue'].id, Decimal('0.00'), Decimal('10000.00'))
                ]
            },
            {
                "description": "Sales transaction 1",
                "lines": [
                    (accounts['cash'].id, Decimal('1500.00'), Decimal('0.00')),
                    (accounts['sales_revenue'].id, Decimal('0.00'), Decimal('1500.00'))
                ]
            },
            {
                "description": "Expense payment",
                "lines": [
                    (accounts['operating_expenses'].id, Decimal('500.00'), Decimal('0.00')),
                    (accounts['cash'].id, Decimal('0.00'), Decimal('500.00'))
                ]
            }
        ]
        
        # Create and post all transactions
        for i, transaction in enumerate(transactions):
            lines = []
            for account_id, debit, credit in transaction['lines']:
                lines.append(JournalEntryLineCreate(
                    account_id=str(account_id),
                    debit_amount=debit,
                    credit_amount=credit,
                    description=transaction['description']
                ))
            
            entry_data = JournalEntryCreate(
                entry_date=period_start + timedelta(days=i*5),
                description=transaction['description'],
                reference=f"TRANS-{i+1:03d}",
                period_id=str(period.id),
                lines=lines
            )
            
            entry = accounting_service.create_journal_entry(entry_data, "system")
            accounting_service.post_journal_entry(str(entry.id), "system")
        
        # Generate financial reports before closing
        trial_balance = accounting_service.generate_trial_balance(period_end)
        balance_sheet = accounting_service.generate_balance_sheet(period_end)
        income_statement = accounting_service.generate_income_statement(period_start, period_end)
        
        # Verify reports have data
        assert trial_balance.total_debits > Decimal('0')
        assert trial_balance.total_credits > Decimal('0')
        assert trial_balance.is_balanced is True
        
        assert balance_sheet.total_assets > Decimal('0')
        assert income_statement.total_revenue > Decimal('0')
        
        # Close the period
        closed_period = accounting_service.close_accounting_period(str(period.id), "system")
        
        assert closed_period.is_closed is True
        assert closed_period.closed_at is not None

class TestAccountingSystemPerformance:
    """Test accounting system performance with large datasets"""
    
    def test_large_volume_journal_entries(self, accounting_service, complete_chart_of_accounts):
        """Test system performance with many journal entries"""
        accounts = complete_chart_of_accounts
        
        # Create period
        period = accounting_service.create_accounting_period(
            AccountingPeriodCreate(
                period_name="Performance Test Period",
                start_date=datetime(2024, 1, 1),
                end_date=datetime(2024, 1, 31),
                period_type="monthly"
            )
        )
        
        # Create many journal entries
        num_entries = 50  # Reduced for test performance
        
        for i in range(num_entries):
            entry_data = JournalEntryCreate(
                entry_date=datetime(2024, 1, 1) + timedelta(hours=i),
                description=f"Performance test entry {i+1}",
                reference=f"PERF-{i+1:04d}",
                period_id=str(period.id),
                lines=[
                    JournalEntryLineCreate(
                        account_id=str(accounts['cash'].id),
                        debit_amount=Decimal(f'{(i+1)*10}.00'),
                        credit_amount=Decimal('0.00'),
                        description=f"Cash entry {i+1}"
                    ),
                    JournalEntryLineCreate(
                        account_id=str(accounts['sales_revenue'].id),
                        debit_amount=Decimal('0.00'),
                        credit_amount=Decimal(f'{(i+1)*10}.00'),
                        description=f"Revenue entry {i+1}"
                    )
                ]
            )
            
            entry = accounting_service.create_journal_entry(entry_data, "system")
            accounting_service.post_journal_entry(str(entry.id), "system")
        
        # Generate reports and measure performance
        start_time = datetime.utcnow()
        
        trial_balance = accounting_service.generate_trial_balance(datetime(2024, 1, 31))
        balance_sheet = accounting_service.generate_balance_sheet(datetime(2024, 1, 31))
        income_statement = accounting_service.generate_income_statement(
            datetime(2024, 1, 1), 
            datetime(2024, 1, 31)
        )
        
        end_time = datetime.utcnow()
        processing_time = (end_time - start_time).total_seconds()
        
        # Verify reports are generated correctly
        assert trial_balance.is_balanced is True
        assert len(trial_balance.accounts) >= 2
        assert balance_sheet.total_assets > Decimal('0')
        assert income_statement.total_revenue > Decimal('0')
        
        # Performance should be reasonable (less than 10 seconds for 50 entries)
        assert processing_time < 10.0, f"Report generation took {processing_time} seconds"

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])