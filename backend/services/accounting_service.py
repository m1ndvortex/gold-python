"""
Enhanced Double-Entry Accounting Service
Comprehensive service for managing double-entry accounting system
"""

from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, desc, asc, text
from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime, date, timedelta
from uuid import UUID, uuid4
from decimal import Decimal
import calendar

from models_accounting import (
    ChartOfAccounts, SubsidiaryAccount, JournalEntry, JournalEntryLine,
    CheckManagement, InstallmentAccount, InstallmentPayment,
    BankReconciliation, BankReconciliationItem, AccountingPeriod,
    AccountingAuditTrail
)
from schemas_accounting import (
    ChartOfAccountsCreate, ChartOfAccountsUpdate,
    SubsidiaryAccountCreate, SubsidiaryAccountUpdate,
    JournalEntryCreate, JournalEntryUpdate,
    CheckManagementCreate, CheckManagementUpdate,
    InstallmentAccountCreate, InstallmentAccountUpdate,
    BankReconciliationCreate, BankReconciliationUpdate,
    AccountingPeriodCreate, AccountingPeriodUpdate,
    TrialBalance, BalanceSheet, ProfitLossStatement, CashFlowStatement
)

class AccountingService:
    """Comprehensive accounting service with double-entry bookkeeping"""
    
    def __init__(self, db: Session):
        self.db = db
    
    # Chart of Accounts Management
    async def create_chart_of_account(self, account_data: ChartOfAccountsCreate, user_id: UUID) -> ChartOfAccounts:
        """Create a new chart of accounts entry"""
        # Check for duplicate account code
        existing = self.db.query(ChartOfAccounts).filter(
            ChartOfAccounts.account_code == account_data.account_code
        ).first()
        if existing:
            raise ValueError(f"Account code {account_data.account_code} already exists")
        
        account = ChartOfAccounts(
            **account_data.model_dump(),
            created_by=user_id,
            updated_by=user_id
        )
        
        self.db.add(account)
        self.db.commit()
        self.db.refresh(account)
        
        # Log audit trail
        await self._log_audit_trail(
            table_name="chart_of_accounts",
            record_id=account.id,
            operation="insert",
            new_values=account_data.model_dump(),
            user_id=user_id,
            change_description=f"Created account: {account.account_name}"
        )
        
        return account
    
    async def update_chart_of_account(self, account_id: UUID, account_data: ChartOfAccountsUpdate, user_id: UUID) -> ChartOfAccounts:
        """Update chart of accounts entry"""
        account = self.db.query(ChartOfAccounts).filter(ChartOfAccounts.id == account_id).first()
        if not account:
            raise ValueError("Account not found")
        
        # Store old values for audit
        old_values = {
            "account_name": account.account_name,
            "account_name_persian": account.account_name_persian,
            "account_category": account.account_category,
            "is_active": account.is_active
        }
        
        # Update fields
        update_data = account_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(account, field, value)
        
        account.updated_by = user_id
        
        self.db.commit()
        self.db.refresh(account)
        
        # Log audit trail
        await self._log_audit_trail(
            table_name="chart_of_accounts",
            record_id=account.id,
            operation="update",
            old_values=old_values,
            new_values=update_data,
            user_id=user_id,
            change_description=f"Updated account: {account.account_name}"
        )
        
        return account
    
    async def get_chart_of_accounts(self, include_inactive: bool = False) -> List[ChartOfAccounts]:
        """Get chart of accounts with hierarchical structure"""
        query = self.db.query(ChartOfAccounts)
        
        if not include_inactive:
            query = query.filter(ChartOfAccounts.is_active == True)
        
        accounts = query.order_by(ChartOfAccounts.account_code).all()
        return accounts
    
    # Subsidiary Accounts Management
    async def create_subsidiary_account(self, subsidiary_data: SubsidiaryAccountCreate, user_id: UUID) -> SubsidiaryAccount:
        """Create subsidiary account (حساب تفصیلی)"""
        # Verify main account exists and allows subsidiaries
        main_account = self.db.query(ChartOfAccounts).filter(
            ChartOfAccounts.id == subsidiary_data.main_account_id
        ).first()
        if not main_account:
            raise ValueError("Main account not found")
        
        # Generate subsidiary code if not provided
        if not subsidiary_data.subsidiary_code:
            subsidiary_data.subsidiary_code = await self._generate_subsidiary_code(
                main_account.account_code, subsidiary_data.subsidiary_type
            )
        
        subsidiary = SubsidiaryAccount(
            **subsidiary_data.model_dump(),
            created_by=user_id,
            updated_by=user_id
        )
        
        self.db.add(subsidiary)
        self.db.commit()
        self.db.refresh(subsidiary)
        
        # Log audit trail
        await self._log_audit_trail(
            table_name="subsidiary_accounts",
            record_id=subsidiary.id,
            operation="insert",
            new_values=subsidiary_data.model_dump(),
            user_id=user_id,
            change_description=f"Created subsidiary account: {subsidiary.subsidiary_name}"
        )
        
        return subsidiary
    
    async def get_subsidiary_accounts(self, main_account_id: Optional[UUID] = None, 
                                   subsidiary_type: Optional[str] = None) -> List[SubsidiaryAccount]:
        """Get subsidiary accounts with filtering"""
        query = self.db.query(SubsidiaryAccount).filter(SubsidiaryAccount.is_active == True)
        
        if main_account_id:
            query = query.filter(SubsidiaryAccount.main_account_id == main_account_id)
        
        if subsidiary_type:
            query = query.filter(SubsidiaryAccount.subsidiary_type == subsidiary_type)
        
        return query.order_by(SubsidiaryAccount.subsidiary_code).all()
    
    # Journal Entry Management (Double-Entry System)
    async def create_journal_entry(self, entry_data: JournalEntryCreate, user_id: UUID) -> JournalEntry:
        """Create double-entry journal entry"""
        # Validate entry is balanced
        total_debit = sum(line.debit_amount for line in entry_data.journal_lines)
        total_credit = sum(line.credit_amount for line in entry_data.journal_lines)
        
        if abs(total_debit - total_credit) > 0.01:
            raise ValueError(f"Journal entry must be balanced. Debit: {total_debit}, Credit: {total_credit}")
        
        # Generate entry number
        entry_number = await self._generate_journal_entry_number()
        
        # Determine accounting period if not provided
        accounting_period = entry_data.accounting_period or entry_data.entry_date.strftime("%Y-%m")
        fiscal_year = entry_data.fiscal_year or entry_data.entry_date.year
        
        # Create journal entry
        journal_entry = JournalEntry(
            entry_number=entry_number,
            entry_date=entry_data.entry_date,
            description=entry_data.description,
            description_persian=entry_data.description_persian,
            reference_number=entry_data.reference_number,
            source_type=entry_data.source_type,
            source_id=entry_data.source_id,
            total_debit=total_debit,
            total_credit=total_credit,
            is_balanced=True,
            accounting_period=accounting_period,
            fiscal_year=fiscal_year,
            gold_sood_amount=entry_data.gold_sood_amount,
            gold_ojrat_amount=entry_data.gold_ojrat_amount,
            gold_maliyat_amount=entry_data.gold_maliyat_amount,
            entry_metadata=entry_data.entry_metadata,
            created_by=user_id,
            updated_by=user_id
        )
        
        self.db.add(journal_entry)
        self.db.flush()  # Get the ID
        
        # Create journal entry lines
        for line_data in entry_data.journal_lines:
            # Validate account exists
            account = self.db.query(ChartOfAccounts).filter(
                ChartOfAccounts.id == line_data.account_id
            ).first()
            if not account:
                raise ValueError(f"Account {line_data.account_id} not found")
            
            # Validate subsidiary account if provided
            if line_data.subsidiary_account_id:
                subsidiary = self.db.query(SubsidiaryAccount).filter(
                    SubsidiaryAccount.id == line_data.subsidiary_account_id
                ).first()
                if not subsidiary:
                    raise ValueError(f"Subsidiary account {line_data.subsidiary_account_id} not found")
                if subsidiary.main_account_id != line_data.account_id:
                    raise ValueError("Subsidiary account must belong to the specified main account")
            
            journal_line = JournalEntryLine(
                journal_entry_id=journal_entry.id,
                line_number=line_data.line_number,
                account_id=line_data.account_id,
                subsidiary_account_id=line_data.subsidiary_account_id,
                debit_amount=line_data.debit_amount,
                credit_amount=line_data.credit_amount,
                description=line_data.description,
                description_persian=line_data.description_persian,
                quantity=line_data.quantity,
                unit_price=line_data.unit_price,
                reference_type=line_data.reference_type,
                reference_id=line_data.reference_id,
                reference_number=line_data.reference_number,
                line_metadata=line_data.line_metadata
            )
            
            self.db.add(journal_line)
        
        self.db.commit()
        self.db.refresh(journal_entry)
        
        # Update account balances
        await self._update_account_balances(journal_entry.id)
        
        # Log audit trail
        await self._log_audit_trail(
            table_name="journal_entries",
            record_id=journal_entry.id,
            operation="insert",
            new_values=entry_data.model_dump(),
            user_id=user_id,
            change_description=f"Created journal entry: {entry_number}"
        )
        
        return journal_entry
    
    async def post_journal_entry(self, entry_id: UUID, user_id: UUID) -> JournalEntry:
        """Post journal entry (make it final)"""
        entry = self.db.query(JournalEntry).filter(JournalEntry.id == entry_id).first()
        if not entry:
            raise ValueError("Journal entry not found")
        
        if entry.status != 'draft':
            raise ValueError("Only draft entries can be posted")
        
        # Check if period is locked
        period = self.db.query(AccountingPeriod).filter(
            AccountingPeriod.period_code == entry.accounting_period
        ).first()
        if period and period.is_locked:
            raise ValueError("Cannot post entry in locked period")
        
        entry.status = 'posted'
        entry.posted_at = datetime.utcnow()
        entry.posted_by = user_id
        
        self.db.commit()
        
        # Log audit trail
        await self._log_audit_trail(
            table_name="journal_entries",
            record_id=entry.id,
            operation="update",
            old_values={"status": "draft"},
            new_values={"status": "posted"},
            user_id=user_id,
            change_description=f"Posted journal entry: {entry.entry_number}"
        )
        
        return entry
    
    async def reverse_journal_entry(self, entry_id: UUID, reversal_reason: str, user_id: UUID) -> JournalEntry:
        """Reverse journal entry"""
        original_entry = self.db.query(JournalEntry).filter(JournalEntry.id == entry_id).first()
        if not original_entry:
            raise ValueError("Journal entry not found")
        
        if original_entry.status != 'posted':
            raise ValueError("Only posted entries can be reversed")
        
        # Create reversal entry
        reversal_data = JournalEntryCreate(
            entry_date=date.today(),
            description=f"Reversal of {original_entry.entry_number}: {reversal_reason}",
            description_persian=f"برگشت {original_entry.entry_number}: {reversal_reason}",
            reference_number=original_entry.entry_number,
            source_type="adjustment",
            source_id=original_entry.id,
            journal_lines=[
                {
                    "line_number": line.line_number,
                    "account_id": line.account_id,
                    "subsidiary_account_id": line.subsidiary_account_id,
                    "debit_amount": line.credit_amount,  # Reverse amounts
                    "credit_amount": line.debit_amount,
                    "description": f"Reversal: {line.description}",
                    "reference_type": "reversal",
                    "reference_id": line.id
                }
                for line in original_entry.journal_lines
            ]
        )
        
        reversal_entry = await self.create_journal_entry(reversal_data, user_id)
        await self.post_journal_entry(reversal_entry.id, user_id)
        
        # Update original entry
        original_entry.status = 'reversed'
        original_entry.reversed_entry_id = reversal_entry.id
        original_entry.reversal_reason = reversal_reason
        original_entry.reversed_at = datetime.utcnow()
        original_entry.reversed_by = user_id
        
        self.db.commit()
        
        return reversal_entry
    
    # Check Management System
    async def create_check(self, check_data: CheckManagementCreate, user_id: UUID) -> CheckManagement:
        """Create check record"""
        check = CheckManagement(
            **check_data.dict(),
            check_status='pending',
            created_by=user_id,
            updated_by=user_id
        )
        
        self.db.add(check)
        self.db.commit()
        self.db.refresh(check)
        
        # Create journal entry for check
        await self._create_check_journal_entry(check, user_id)
        
        return check
    
    async def update_check_status(self, check_id: UUID, status: str, user_id: UUID, 
                                notes: Optional[str] = None) -> CheckManagement:
        """Update check status with automatic journal entries"""
        check = self.db.query(CheckManagement).filter(CheckManagement.id == check_id).first()
        if not check:
            raise ValueError("Check not found")
        
        old_status = check.check_status
        check.check_status = status
        check.updated_by = user_id
        
        # Update status-specific fields
        if status == 'deposited':
            check.deposit_date = date.today()
        elif status == 'cleared':
            check.clear_date = date.today()
        elif status == 'bounced':
            check.bounce_date = date.today()
            if notes:
                check.bounce_reason = notes
        
        if notes:
            check.notes = notes
        
        self.db.commit()
        
        # Create status change journal entry
        await self._create_check_status_journal_entry(check, old_status, status, user_id)
        
        return check
    
    # Installment Account Management
    async def create_installment_account(self, installment_data: InstallmentAccountCreate, user_id: UUID) -> InstallmentAccount:
        """Create installment account (حساب اقساطی)"""
        installment = InstallmentAccount(
            **installment_data.dict(),
            remaining_installments=installment_data.number_of_installments,
            remaining_balance=installment_data.total_amount - installment_data.down_payment,
            next_due_date=self._calculate_next_due_date(
                installment_data.start_date, 
                installment_data.installment_frequency
            ),
            created_by=user_id,
            updated_by=user_id
        )
        
        self.db.add(installment)
        self.db.flush()
        
        # Generate installment payment schedule
        await self._generate_installment_schedule(installment)
        
        self.db.commit()
        self.db.refresh(installment)
        
        return installment
    
    async def process_installment_payment(self, installment_id: UUID, payment_amount: Decimal, 
                                        payment_method: str, user_id: UUID) -> InstallmentPayment:
        """Process installment payment"""
        installment = self.db.query(InstallmentAccount).filter(
            InstallmentAccount.id == installment_id
        ).first()
        if not installment:
            raise ValueError("Installment account not found")
        
        # Find next due payment
        next_payment = self.db.query(InstallmentPayment).filter(
            and_(
                InstallmentPayment.installment_account_id == installment_id,
                InstallmentPayment.status == 'pending'
            )
        ).order_by(InstallmentPayment.due_date).first()
        
        if not next_payment:
            raise ValueError("No pending payments found")
        
        # Update payment
        next_payment.payment_date = date.today()
        next_payment.paid_amount = payment_amount
        next_payment.remaining_amount = max(0, next_payment.total_amount_due - payment_amount)
        next_payment.payment_method = payment_method
        next_payment.status = 'paid' if next_payment.remaining_amount == 0 else 'partial'
        
        # Update installment account
        installment.total_paid += payment_amount
        installment.remaining_balance -= payment_amount
        installment.last_payment_date = date.today()
        
        if next_payment.status == 'paid':
            installment.paid_installments += 1
            installment.remaining_installments -= 1
            
            # Update next due date
            if installment.remaining_installments > 0:
                installment.next_due_date = self._calculate_next_due_date(
                    next_payment.due_date, 
                    installment.installment_frequency
                )
            else:
                installment.status = 'completed'
                installment.next_due_date = None
        
        # Create journal entry for payment
        journal_entry = await self._create_installment_payment_journal_entry(
            installment, next_payment, payment_amount, user_id
        )
        next_payment.journal_entry_id = journal_entry.id
        
        self.db.commit()
        
        return next_payment
    
    # Bank Reconciliation
    async def create_bank_reconciliation(self, reconciliation_data: BankReconciliationCreate, user_id: UUID) -> BankReconciliation:
        """Create bank reconciliation"""
        reconciliation = BankReconciliation(
            reconciliation_date=reconciliation_data.reconciliation_date,
            bank_account_id=reconciliation_data.bank_account_id,
            book_balance=reconciliation_data.book_balance,
            bank_statement_balance=reconciliation_data.bank_statement_balance,
            period_start=reconciliation_data.period_start,
            period_end=reconciliation_data.period_end,
            notes=reconciliation_data.notes,
            reconciliation_metadata=reconciliation_data.reconciliation_metadata,
            status='in_progress',
            created_by=user_id
        )
        
        self.db.add(reconciliation)
        self.db.flush()
        
        # Add reconciliation items
        for item_data in reconciliation_data.reconciliation_items:
            item = BankReconciliationItem(
                reconciliation_id=reconciliation.id,
                **item_data.dict()
            )
            self.db.add(item)
        
        # Calculate reconciled balance
        total_adjustments = sum(
            item.amount for item in reconciliation_data.reconciliation_items
        )
        reconciliation.reconciled_balance = reconciliation.book_balance + total_adjustments
        reconciliation.difference = reconciliation.reconciled_balance - reconciliation.bank_statement_balance
        
        self.db.commit()
        self.db.refresh(reconciliation)
        
        return reconciliation
    
    # Financial Reports
    async def generate_trial_balance(self, as_of_date: date) -> TrialBalance:
        """Generate trial balance report"""
        # Get all accounts with balances
        accounts_query = self.db.query(ChartOfAccounts).filter(
            ChartOfAccounts.is_active == True
        ).order_by(ChartOfAccounts.account_code)
        
        accounts = accounts_query.all()
        trial_balance_items = []
        total_debits = Decimal('0')
        total_credits = Decimal('0')
        
        for account in accounts:
            # Calculate balance as of date
            debit_balance, credit_balance = await self._calculate_account_balance(account.id, as_of_date)
            net_balance = debit_balance - credit_balance
            
            if debit_balance != 0 or credit_balance != 0:
                trial_balance_items.append({
                    "account_code": account.account_code,
                    "account_name": account.account_name,
                    "account_name_persian": account.account_name_persian,
                    "account_type": account.account_type,
                    "debit_balance": debit_balance,
                    "credit_balance": credit_balance,
                    "net_balance": net_balance
                })
                
                total_debits += debit_balance
                total_credits += credit_balance
        
        return TrialBalance(
            as_of_date=as_of_date,
            total_debits=total_debits,
            total_credits=total_credits,
            is_balanced=abs(total_debits - total_credits) < 0.01,
            accounts=trial_balance_items
        )
    
    async def generate_balance_sheet(self, as_of_date: date) -> BalanceSheet:
        """Generate balance sheet report"""
        # Get assets
        assets = await self._get_balance_sheet_section('asset', as_of_date)
        
        # Get liabilities
        liabilities = await self._get_balance_sheet_section('liability', as_of_date)
        
        # Get equity
        equity = await self._get_balance_sheet_section('equity', as_of_date)
        
        total_assets = sum(item['amount'] for item in assets['items'])
        total_liabilities_equity = sum(item['amount'] for item in liabilities['items']) + sum(item['amount'] for item in equity['items'])
        
        return BalanceSheet(
            as_of_date=as_of_date,
            assets=assets,
            liabilities=liabilities,
            equity=equity,
            total_assets=total_assets,
            total_liabilities_equity=total_liabilities_equity,
            is_balanced=abs(total_assets - total_liabilities_equity) < 0.01
        )
    
    async def generate_profit_loss_statement(self, period_start: date, period_end: date) -> ProfitLossStatement:
        """Generate profit and loss statement"""
        # Get revenue
        revenue = await self._get_profit_loss_section('revenue', period_start, period_end)
        
        # Get expenses
        expenses = await self._get_profit_loss_section('expense', period_start, period_end)
        
        total_revenue = sum(item['amount'] for item in revenue['items'])
        total_expenses = sum(item['amount'] for item in expenses['items'])
        
        gross_profit = total_revenue - total_expenses
        net_profit = gross_profit  # Simplified for now
        profit_margin = (net_profit / total_revenue * 100) if total_revenue > 0 else 0
        
        return ProfitLossStatement(
            period_start=period_start,
            period_end=period_end,
            revenue=revenue,
            expenses=expenses,
            gross_profit=gross_profit,
            net_profit=net_profit,
            profit_margin=profit_margin
        )
    
    # Gold-specific Accounting
    async def create_gold_invoice_journal_entry(self, invoice_id: UUID, invoice_data: Dict[str, Any], user_id: UUID) -> JournalEntry:
        """Create journal entry for Gold invoice with سود, اجرت, مالیات"""
        # Get Gold-specific accounts
        sales_account = await self._get_or_create_account("4000", "Sales Revenue", "revenue")
        sood_account = await self._get_or_create_account("4100", "سود (Profit)", "revenue")
        ojrat_account = await self._get_or_create_account("4200", "اجرت (Labor Fee)", "revenue")
        maliyat_account = await self._get_or_create_account("2300", "مالیات (Tax Payable)", "liability")
        receivable_account = await self._get_or_create_account("1200", "Accounts Receivable", "asset")
        
        # Create journal entry lines
        journal_lines = []
        line_number = 1
        
        # Debit: Accounts Receivable (total amount)
        journal_lines.append({
            "line_number": line_number,
            "account_id": receivable_account.id,
            "debit_amount": invoice_data['total_amount'],
            "credit_amount": Decimal('0'),
            "description": f"Invoice {invoice_data['invoice_number']} - Customer receivable",
            "reference_type": "invoice",
            "reference_id": invoice_id
        })
        line_number += 1
        
        # Credit: Sales Revenue (base amount)
        base_amount = invoice_data['total_amount'] - (invoice_data.get('gold_sood', 0) + 
                                                     invoice_data.get('gold_ojrat', 0) + 
                                                     invoice_data.get('gold_maliyat', 0))
        if base_amount > 0:
            journal_lines.append({
                "line_number": line_number,
                "account_id": sales_account.id,
                "debit_amount": Decimal('0'),
                "credit_amount": base_amount,
                "description": f"Invoice {invoice_data['invoice_number']} - Sales revenue",
                "reference_type": "invoice",
                "reference_id": invoice_id
            })
            line_number += 1
        
        # Credit: سود (Profit)
        if invoice_data.get('gold_sood', 0) > 0:
            journal_lines.append({
                "line_number": line_number,
                "account_id": sood_account.id,
                "debit_amount": Decimal('0'),
                "credit_amount": invoice_data['gold_sood'],
                "description": f"Invoice {invoice_data['invoice_number']} - سود",
                "reference_type": "invoice",
                "reference_id": invoice_id
            })
            line_number += 1
        
        # Credit: اجرت (Labor Fee)
        if invoice_data.get('gold_ojrat', 0) > 0:
            journal_lines.append({
                "line_number": line_number,
                "account_id": ojrat_account.id,
                "debit_amount": Decimal('0'),
                "credit_amount": invoice_data['gold_ojrat'],
                "description": f"Invoice {invoice_data['invoice_number']} - اجرت",
                "reference_type": "invoice",
                "reference_id": invoice_id
            })
            line_number += 1
        
        # Credit: مالیات (Tax)
        if invoice_data.get('gold_maliyat', 0) > 0:
            journal_lines.append({
                "line_number": line_number,
                "account_id": maliyat_account.id,
                "debit_amount": Decimal('0'),
                "credit_amount": invoice_data['gold_maliyat'],
                "description": f"Invoice {invoice_data['invoice_number']} - مالیات",
                "reference_type": "invoice",
                "reference_id": invoice_id
            })
        
        # Create journal entry
        entry_data = JournalEntryCreate(
            entry_date=date.today(),
            description=f"Gold Invoice {invoice_data['invoice_number']}",
            description_persian=f"فاکتور طلا {invoice_data['invoice_number']}",
            reference_number=invoice_data['invoice_number'],
            source_type="invoice",
            source_id=invoice_id,
            gold_sood_amount=invoice_data.get('gold_sood'),
            gold_ojrat_amount=invoice_data.get('gold_ojrat'),
            gold_maliyat_amount=invoice_data.get('gold_maliyat'),
            journal_lines=journal_lines
        )
        
        journal_entry = await self.create_journal_entry(entry_data, user_id)
        await self.post_journal_entry(journal_entry.id, user_id)
        
        return journal_entry
    
    # Helper Methods
    async def _generate_account_code(self, account_type: str) -> str:
        """Generate account code based on type"""
        type_prefixes = {
            'asset': '1',
            'liability': '2',
            'equity': '3',
            'revenue': '4',
            'expense': '5'
        }
        
        prefix = type_prefixes.get(account_type, '9')
        
        # Find next available code
        last_account = self.db.query(ChartOfAccounts).filter(
            ChartOfAccounts.account_code.like(f"{prefix}%")
        ).order_by(desc(ChartOfAccounts.account_code)).first()
        
        if last_account:
            last_number = int(last_account.account_code[1:])
            next_number = last_number + 1
        else:
            next_number = 1000
        
        return f"{prefix}{next_number:03d}"
    
    async def _generate_subsidiary_code(self, main_account_code: str, subsidiary_type: str) -> str:
        """Generate subsidiary account code"""
        # Find next available subsidiary code for this main account
        last_subsidiary = self.db.query(SubsidiaryAccount).filter(
            SubsidiaryAccount.subsidiary_code.like(f"{main_account_code}-%")
        ).order_by(desc(SubsidiaryAccount.subsidiary_code)).first()
        
        if last_subsidiary:
            last_number = int(last_subsidiary.subsidiary_code.split('-')[-1])
            next_number = last_number + 1
        else:
            next_number = 1
        
        return f"{main_account_code}-{next_number:03d}"
    
    async def _generate_journal_entry_number(self) -> str:
        """Generate journal entry number"""
        today = date.today()
        prefix = f"JE{today.strftime('%Y%m')}"
        
        last_entry = self.db.query(JournalEntry).filter(
            JournalEntry.entry_number.like(f"{prefix}%")
        ).order_by(desc(JournalEntry.entry_number)).first()
        
        if last_entry:
            last_number = int(last_entry.entry_number[8:])
            next_number = last_number + 1
        else:
            next_number = 1
        
        return f"{prefix}{next_number:04d}"
    
    async def _update_account_balances(self, journal_entry_id: UUID):
        """Update account balances after journal entry"""
        lines = self.db.query(JournalEntryLine).filter(
            JournalEntryLine.journal_entry_id == journal_entry_id
        ).all()
        
        for line in lines:
            # Update main account balance
            account = self.db.query(ChartOfAccounts).filter(
                ChartOfAccounts.id == line.account_id
            ).first()
            
            if account:
                account.debit_balance += line.debit_amount
                account.credit_balance += line.credit_amount
                
                # Calculate current balance based on account type
                if account.account_type in ['asset', 'expense']:
                    account.current_balance = account.debit_balance - account.credit_balance
                else:
                    account.current_balance = account.credit_balance - account.debit_balance
            
            # Update subsidiary account balance if applicable
            if line.subsidiary_account_id:
                subsidiary = self.db.query(SubsidiaryAccount).filter(
                    SubsidiaryAccount.id == line.subsidiary_account_id
                ).first()
                
                if subsidiary:
                    subsidiary.debit_balance += line.debit_amount
                    subsidiary.credit_balance += line.credit_amount
                    
                    # Calculate current balance based on main account type
                    main_account = self.db.query(ChartOfAccounts).filter(
                        ChartOfAccounts.id == subsidiary.main_account_id
                    ).first()
                    
                    if main_account and main_account.account_type in ['asset', 'expense']:
                        subsidiary.current_balance = subsidiary.debit_balance - subsidiary.credit_balance
                    else:
                        subsidiary.current_balance = subsidiary.credit_balance - subsidiary.debit_balance
        
        self.db.commit()
    
    async def _log_audit_trail(self, table_name: str, record_id: UUID, operation: str,
                             old_values: Optional[Dict] = None, new_values: Optional[Dict] = None,
                             user_id: Optional[UUID] = None, change_description: Optional[str] = None):
        """Log audit trail for accounting changes"""
        # Convert date objects to strings for JSON serialization
        def serialize_values(values):
            if not values:
                return values
            serialized = {}
            for key, value in values.items():
                if isinstance(value, (date, datetime)):
                    serialized[key] = value.isoformat()
                elif isinstance(value, Decimal):
                    serialized[key] = float(value)
                elif isinstance(value, UUID):
                    serialized[key] = str(value)
                elif isinstance(value, list):
                    serialized[key] = [serialize_single_value(v) for v in value]
                elif isinstance(value, dict):
                    serialized[key] = serialize_values(value)
                else:
                    serialized[key] = value
            return serialized
        
        def serialize_single_value(value):
            if isinstance(value, (date, datetime)):
                return value.isoformat()
            elif isinstance(value, Decimal):
                return float(value)
            elif isinstance(value, UUID):
                return str(value)
            elif isinstance(value, dict):
                return serialize_values(value)
            else:
                return value
        
        audit_entry = AccountingAuditTrail(
            table_name=table_name,
            record_id=record_id,
            operation=operation,
            old_values=serialize_values(old_values),
            new_values=serialize_values(new_values),
            changed_fields=list(new_values.keys()) if new_values else None,
            change_description=change_description,
            user_id=user_id
        )
        
        self.db.add(audit_entry)
        self.db.commit()
    
    async def _get_or_create_account(self, account_code: str, account_name: str, account_type: str) -> ChartOfAccounts:
        """Get or create chart of accounts entry"""
        account = self.db.query(ChartOfAccounts).filter(
            ChartOfAccounts.account_code == account_code
        ).first()
        
        if not account:
            account = ChartOfAccounts(
                account_code=account_code,
                account_name=account_name,
                account_type=account_type,
                account_category=f"system_{account_type}",
                is_system_account=True
            )
            self.db.add(account)
            self.db.commit()
            self.db.refresh(account)
        
        return account
    
    async def _calculate_account_balance(self, account_id: UUID, as_of_date: date) -> Tuple[Decimal, Decimal]:
        """Calculate account balance as of specific date"""
        result = self.db.query(
            func.sum(JournalEntryLine.debit_amount).label('total_debit'),
            func.sum(JournalEntryLine.credit_amount).label('total_credit')
        ).join(JournalEntry).filter(
            and_(
                JournalEntryLine.account_id == account_id,
                JournalEntry.entry_date <= as_of_date,
                JournalEntry.status == 'posted'
            )
        ).first()
        
        total_debit = result.total_debit or Decimal('0')
        total_credit = result.total_credit or Decimal('0')
        
        return total_debit, total_credit
    
    async def _get_balance_sheet_section(self, account_type: str, as_of_date: date) -> Dict[str, Any]:
        """Get balance sheet section data"""
        accounts = self.db.query(ChartOfAccounts).filter(
            and_(
                ChartOfAccounts.account_type == account_type,
                ChartOfAccounts.is_active == True
            )
        ).order_by(ChartOfAccounts.account_code).all()
        
        items = []
        total = Decimal('0')
        
        for account in accounts:
            debit_balance, credit_balance = await self._calculate_account_balance(account.id, as_of_date)
            
            if account_type in ['asset', 'expense']:
                amount = debit_balance - credit_balance
            else:
                amount = credit_balance - debit_balance
            
            if amount != 0:
                items.append({
                    "account_code": account.account_code,
                    "account_name": account.account_name,
                    "account_name_persian": account.account_name_persian,
                    "amount": amount
                })
                total += amount
        
        section_names = {
            'asset': ('Assets', 'دارایی‌ها'),
            'liability': ('Liabilities', 'بدهی‌ها'),
            'equity': ('Equity', 'حقوق صاحبان سهام')
        }
        
        section_name, section_name_persian = section_names.get(account_type, (account_type.title(), account_type))
        
        return {
            "section_name": section_name,
            "section_name_persian": section_name_persian,
            "items": items,
            "total": total
        }
    
    async def _get_profit_loss_section(self, account_type: str, period_start: date, period_end: date) -> Dict[str, Any]:
        """Get profit and loss section data"""
        accounts = self.db.query(ChartOfAccounts).filter(
            and_(
                ChartOfAccounts.account_type == account_type,
                ChartOfAccounts.is_active == True
            )
        ).order_by(ChartOfAccounts.account_code).all()
        
        items = []
        total = Decimal('0')
        
        for account in accounts:
            result = self.db.query(
                func.sum(JournalEntryLine.debit_amount).label('total_debit'),
                func.sum(JournalEntryLine.credit_amount).label('total_credit')
            ).join(JournalEntry).filter(
                and_(
                    JournalEntryLine.account_id == account.id,
                    JournalEntry.entry_date >= period_start,
                    JournalEntry.entry_date <= period_end,
                    JournalEntry.status == 'posted'
                )
            ).first()
            
            total_debit = result.total_debit or Decimal('0')
            total_credit = result.total_credit or Decimal('0')
            
            if account_type == 'revenue':
                amount = total_credit - total_debit
            else:  # expense
                amount = total_debit - total_credit
            
            if amount != 0:
                items.append({
                    "account_code": account.account_code,
                    "account_name": account.account_name,
                    "account_name_persian": account.account_name_persian,
                    "amount": amount
                })
                total += amount
        
        section_names = {
            'revenue': ('Revenue', 'درآمد'),
            'expense': ('Expenses', 'هزینه‌ها')
        }
        
        section_name, section_name_persian = section_names.get(account_type, (account_type.title(), account_type))
        
        return {
            "section_name": section_name,
            "section_name_persian": section_name_persian,
            "items": items,
            "total": total
        }
    
    async def _create_check_journal_entry(self, check: CheckManagement, user_id: UUID) -> JournalEntry:
        """Create journal entry for check"""
        # Implementation for check journal entries
        pass
    
    async def _create_check_status_journal_entry(self, check: CheckManagement, old_status: str, new_status: str, user_id: UUID):
        """Create journal entry for check status change"""
        # Implementation for check status change journal entries
        pass
    
    def _calculate_next_due_date(self, start_date: date, frequency: str) -> date:
        """Calculate next due date based on frequency"""
        if frequency == 'monthly':
            if start_date.month == 12:
                return start_date.replace(year=start_date.year + 1, month=1)
            else:
                return start_date.replace(month=start_date.month + 1)
        elif frequency == 'weekly':
            return start_date + timedelta(weeks=1)
        elif frequency == 'quarterly':
            return start_date + timedelta(days=90)
        else:
            return start_date + timedelta(days=365)
    
    async def _generate_installment_schedule(self, installment: InstallmentAccount):
        """Generate installment payment schedule"""
        current_date = installment.start_date
        
        for i in range(installment.number_of_installments):
            payment = InstallmentPayment(
                installment_account_id=installment.id,
                payment_number=i + 1,
                due_date=current_date,
                due_amount=installment.installment_amount,
                remaining_amount=installment.installment_amount,
                interest_amount=installment.installment_amount * installment.interest_rate / 100,
                total_amount_due=installment.installment_amount + (installment.installment_amount * installment.interest_rate / 100),
                status='pending'
            )
            
            self.db.add(payment)
            current_date = self._calculate_next_due_date(current_date, installment.installment_frequency)
    
    async def _create_installment_payment_journal_entry(self, installment: InstallmentAccount, 
                                                      payment: InstallmentPayment, 
                                                      payment_amount: Decimal, user_id: UUID) -> JournalEntry:
        """Create journal entry for installment payment"""
        # Implementation for installment payment journal entries
        pass