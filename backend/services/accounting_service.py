"""
Double-Entry Accounting Service
Comprehensive accounting operations and business logic
"""

from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func, text, desc, asc
from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime, date
from decimal import Decimal
import uuid

from models_accounting import (
    ChartOfAccounts, AccountingPeriod, JournalEntry, JournalEntryLine,
    BankAccount, BankTransaction, BankReconciliation, CheckRegister,
    AccountingAuditLog
)
from schemas_accounting import (
    ChartOfAccountsCreate, ChartOfAccountsUpdate, AccountingPeriodCreate,
    JournalEntryCreate, JournalEntryUpdate, BankAccountCreate, BankAccountUpdate,
    BankTransactionCreate, BankReconciliationCreate, BankReconciliationUpdate,
    CheckRegisterCreate, CheckRegisterUpdate, TrialBalanceResponse, TrialBalanceItem,
    BalanceSheetResponse, BalanceSheetItem, IncomeStatementResponse, IncomeStatementItem,
    CashFlowResponse, CashFlowItem, GeneralLedgerResponse, GeneralLedgerItem,
    SubsidiaryLedgerResponse, AccountType, JournalEntryStatus, ReconciliationStatus
)

class AccountingService:
    """Comprehensive accounting service for double-entry bookkeeping"""
    
    def __init__(self, db: Session):
        self.db = db
    
    # Chart of Accounts Management
    def create_chart_account(self, account_data: ChartOfAccountsCreate, user_id: str) -> ChartOfAccounts:
        """Create a new chart of accounts entry"""
        # Calculate level based on parent
        level = 0
        if account_data.parent_id:
            parent = self.get_chart_account(account_data.parent_id)
            if parent:
                level = parent.level + 1
        
        account = ChartOfAccounts(
            **account_data.dict(),
            level=level,
            created_by=user_id
        )
        
        self.db.add(account)
        self.db.commit()
        self.db.refresh(account)
        
        # Log audit trail
        self._log_audit_action("CREATE", "chart_of_accounts", account.id, None, account_data.dict(), user_id)
        
        return account
    
    def get_chart_account(self, account_id: str) -> Optional[ChartOfAccounts]:
        """Get chart of accounts by ID"""
        return self.db.query(ChartOfAccounts).filter(ChartOfAccounts.id == account_id).first()
    
    def get_chart_account_by_code(self, account_code: str) -> Optional[ChartOfAccounts]:
        """Get chart of accounts by code"""
        return self.db.query(ChartOfAccounts).filter(ChartOfAccounts.account_code == account_code).first()
    
    def get_chart_accounts_hierarchy(self, account_type: Optional[str] = None) -> List[ChartOfAccounts]:
        """Get chart of accounts in hierarchical order"""
        query = self.db.query(ChartOfAccounts).filter(ChartOfAccounts.is_active == True)
        
        if account_type:
            query = query.filter(ChartOfAccounts.account_type == account_type)
        
        return query.order_by(ChartOfAccounts.account_code).all()
    
    def update_chart_account(self, account_id: str, account_data: ChartOfAccountsUpdate, user_id: str) -> Optional[ChartOfAccounts]:
        """Update chart of accounts"""
        account = self.get_chart_account(account_id)
        if not account:
            return None
        
        old_values = {
            "account_name": account.account_name,
            "description": account.description,
            "is_active": account.is_active,
            "business_type_config": account.business_type_config
        }
        
        for field, value in account_data.dict(exclude_unset=True).items():
            setattr(account, field, value)
        
        account.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(account)
        
        # Log audit trail
        self._log_audit_action("UPDATE", "chart_of_accounts", account.id, old_values, account_data.dict(exclude_unset=True), user_id)
        
        return account
    
    # Accounting Period Management
    def create_accounting_period(self, period_data: AccountingPeriodCreate) -> AccountingPeriod:
        """Create a new accounting period"""
        period = AccountingPeriod(**period_data.dict())
        
        self.db.add(period)
        self.db.commit()
        self.db.refresh(period)
        
        return period
    
    def get_current_period(self) -> Optional[AccountingPeriod]:
        """Get the current open accounting period"""
        current_date = datetime.utcnow()
        return self.db.query(AccountingPeriod).filter(
            and_(
                AccountingPeriod.start_date <= current_date,
                AccountingPeriod.end_date >= current_date,
                AccountingPeriod.is_closed == False
            )
        ).first()
    
    def close_accounting_period(self, period_id: str, user_id: str) -> Optional[AccountingPeriod]:
        """Close an accounting period"""
        period = self.db.query(AccountingPeriod).filter(AccountingPeriod.id == period_id).first()
        if not period:
            return None
        
        # Verify all journal entries in period are posted
        unposted_entries = self.db.query(JournalEntry).filter(
            and_(
                JournalEntry.period_id == period_id,
                JournalEntry.status != JournalEntryStatus.POSTED
            )
        ).count()
        
        if unposted_entries > 0:
            raise ValueError(f"Cannot close period with {unposted_entries} unposted journal entries")
        
        period.is_closed = True
        period.closed_at = datetime.utcnow()
        period.closed_by = user_id
        
        self.db.commit()
        self.db.refresh(period)
        
        return period
    
    # Journal Entry Management
    def create_journal_entry(self, entry_data: JournalEntryCreate, user_id: str) -> JournalEntry:
        """Create a new journal entry with lines"""
        # Generate entry number
        entry_number = self._generate_entry_number()
        
        # Determine period if not specified
        period_id = entry_data.period_id
        if not period_id:
            current_period = self.get_current_period()
            if current_period:
                period_id = str(current_period.id)
        
        # Calculate totals
        total_debit = sum(line.debit_amount for line in entry_data.lines)
        total_credit = sum(line.credit_amount for line in entry_data.lines)
        
        # Create journal entry
        journal_entry = JournalEntry(
            entry_number=entry_number,
            entry_date=entry_data.entry_date,
            reference=entry_data.reference,
            description=entry_data.description,
            total_debit=total_debit,
            total_credit=total_credit,
            is_balanced=(total_debit == total_credit),
            source_type=entry_data.source_type,
            source_id=entry_data.source_id,
            period_id=period_id,
            requires_approval=entry_data.requires_approval,
            status=JournalEntryStatus.DRAFT,
            created_by=user_id
        )
        
        self.db.add(journal_entry)
        self.db.flush()  # Get the ID
        
        # Create journal entry lines
        for line_data in entry_data.lines:
            line = JournalEntryLine(
                journal_entry_id=journal_entry.id,
                **line_data.dict()
            )
            self.db.add(line)
        
        self.db.commit()
        self.db.refresh(journal_entry)
        
        # Log audit trail
        self._log_audit_action("CREATE", "journal_entries", journal_entry.id, None, entry_data.dict(), user_id)
        
        return journal_entry
    
    def post_journal_entry(self, entry_id: str, user_id: str) -> Optional[JournalEntry]:
        """Post a journal entry (make it affect the books)"""
        entry = self.db.query(JournalEntry).filter(JournalEntry.id == entry_id).first()
        if not entry:
            return None
        
        if entry.status != JournalEntryStatus.DRAFT:
            raise ValueError(f"Cannot post entry with status: {entry.status}")
        
        if not entry.is_balanced:
            raise ValueError("Cannot post unbalanced journal entry")
        
        # Check if period is closed
        if entry.period_id:
            period = self.db.query(AccountingPeriod).filter(AccountingPeriod.id == entry.period_id).first()
            if period and period.is_closed:
                raise ValueError("Cannot post entry to closed period")
        
        # Check approval requirement
        if entry.requires_approval and not entry.approved_by:
            raise ValueError("Entry requires approval before posting")
        
        entry.status = JournalEntryStatus.POSTED
        entry.updated_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(entry)
        
        # Log audit trail
        self._log_audit_action("POST", "journal_entries", entry.id, {"status": "draft"}, {"status": "posted"}, user_id)
        
        return entry
    
    def approve_journal_entry(self, entry_id: str, user_id: str) -> Optional[JournalEntry]:
        """Approve a journal entry"""
        entry = self.db.query(JournalEntry).filter(JournalEntry.id == entry_id).first()
        if not entry:
            return None
        
        if not entry.requires_approval:
            raise ValueError("Entry does not require approval")
        
        if entry.approved_by:
            raise ValueError("Entry is already approved")
        
        entry.approved_by = user_id
        entry.approved_at = datetime.utcnow()
        entry.updated_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(entry)
        
        # Log audit trail
        self._log_audit_action("APPROVE", "journal_entries", entry.id, None, {"approved_by": user_id}, user_id)
        
        return entry
    
    def reverse_journal_entry(self, entry_id: str, reversal_reason: str, user_id: str) -> Optional[JournalEntry]:
        """Reverse a posted journal entry"""
        original_entry = self.db.query(JournalEntry).options(joinedload(JournalEntry.lines)).filter(
            JournalEntry.id == entry_id
        ).first()
        
        if not original_entry:
            return None
        
        if original_entry.status != JournalEntryStatus.POSTED:
            raise ValueError("Can only reverse posted entries")
        
        # Create reversal entry
        reversal_entry_number = self._generate_entry_number()
        
        reversal_entry = JournalEntry(
            entry_number=reversal_entry_number,
            entry_date=datetime.utcnow(),
            reference=f"REV-{original_entry.entry_number}",
            description=f"Reversal of {original_entry.entry_number}: {reversal_reason}",
            total_debit=original_entry.total_credit,  # Swap debits and credits
            total_credit=original_entry.total_debit,
            is_balanced=True,
            source_type="reversal",
            source_id=str(original_entry.id),
            period_id=self.get_current_period().id if self.get_current_period() else None,
            status=JournalEntryStatus.POSTED,
            created_by=user_id
        )
        
        self.db.add(reversal_entry)
        self.db.flush()
        
        # Create reversal lines (swap debits and credits)
        for original_line in original_entry.lines:
            reversal_line = JournalEntryLine(
                journal_entry_id=reversal_entry.id,
                account_id=original_line.account_id,
                debit_amount=original_line.credit_amount,  # Swap
                credit_amount=original_line.debit_amount,  # Swap
                description=f"Reversal: {original_line.description}",
                reference=original_line.reference,
                subsidiary_account=original_line.subsidiary_account,
                cost_center=original_line.cost_center,
                project_code=original_line.project_code
            )
            self.db.add(reversal_line)
        
        # Update original entry
        original_entry.status = JournalEntryStatus.REVERSED
        original_entry.reversed_entry_id = reversal_entry.id
        original_entry.reversal_reason = reversal_reason
        original_entry.updated_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(reversal_entry)
        
        # Log audit trail
        self._log_audit_action("REVERSE", "journal_entries", original_entry.id, 
                             {"status": "posted"}, {"status": "reversed", "reversal_reason": reversal_reason}, user_id)
        
        return reversal_entry
    
    def get_journal_entries(self, 
                           start_date: Optional[datetime] = None,
                           end_date: Optional[datetime] = None,
                           account_id: Optional[str] = None,
                           status: Optional[JournalEntryStatus] = None,
                           limit: int = 100,
                           offset: int = 0) -> List[JournalEntry]:
        """Get journal entries with filters"""
        query = self.db.query(JournalEntry).options(joinedload(JournalEntry.lines))
        
        if start_date:
            query = query.filter(JournalEntry.entry_date >= start_date)
        if end_date:
            query = query.filter(JournalEntry.entry_date <= end_date)
        if status:
            query = query.filter(JournalEntry.status == status)
        if account_id:
            query = query.join(JournalEntryLine).filter(JournalEntryLine.account_id == account_id)
        
        return query.order_by(desc(JournalEntry.entry_date)).offset(offset).limit(limit).all()
    
    # Bank Account Management
    def create_bank_account(self, account_data: BankAccountCreate) -> BankAccount:
        """Create a new bank account"""
        bank_account = BankAccount(**account_data.dict())
        
        self.db.add(bank_account)
        self.db.commit()
        self.db.refresh(bank_account)
        
        return bank_account
    
    def update_bank_account(self, account_id: str, account_data: BankAccountUpdate) -> Optional[BankAccount]:
        """Update bank account"""
        account = self.db.query(BankAccount).filter(BankAccount.id == account_id).first()
        if not account:
            return None
        
        for field, value in account_data.dict(exclude_unset=True).items():
            setattr(account, field, value)
        
        account.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(account)
        
        return account
    
    def get_bank_accounts(self, active_only: bool = True) -> List[BankAccount]:
        """Get all bank accounts"""
        query = self.db.query(BankAccount)
        if active_only:
            query = query.filter(BankAccount.is_active == True)
        
        return query.all()
    
    # Bank Transaction Management
    def create_bank_transaction(self, transaction_data: BankTransactionCreate) -> BankTransaction:
        """Create a new bank transaction"""
        transaction = BankTransaction(**transaction_data.dict())
        
        self.db.add(transaction)
        self.db.commit()
        self.db.refresh(transaction)
        
        # Update bank account balance
        self._update_bank_balance(transaction_data.bank_account_id)
        
        return transaction
    
    def get_bank_transactions(self, 
                             bank_account_id: str,
                             start_date: Optional[datetime] = None,
                             end_date: Optional[datetime] = None,
                             reconciled_only: Optional[bool] = None) -> List[BankTransaction]:
        """Get bank transactions with filters"""
        query = self.db.query(BankTransaction).filter(BankTransaction.bank_account_id == bank_account_id)
        
        if start_date:
            query = query.filter(BankTransaction.transaction_date >= start_date)
        if end_date:
            query = query.filter(BankTransaction.transaction_date <= end_date)
        if reconciled_only is not None:
            query = query.filter(BankTransaction.is_reconciled == reconciled_only)
        
        return query.order_by(desc(BankTransaction.transaction_date)).all()
    
    # Bank Reconciliation
    def create_bank_reconciliation(self, reconciliation_data: BankReconciliationCreate, user_id: str) -> BankReconciliation:
        """Create a new bank reconciliation"""
        # Calculate adjusted balance
        adjusted_balance = (reconciliation_data.statement_balance + 
                          reconciliation_data.outstanding_deposits - 
                          reconciliation_data.outstanding_checks - 
                          reconciliation_data.bank_charges + 
                          reconciliation_data.interest_earned)
        
        reconciliation = BankReconciliation(
            **reconciliation_data.dict(),
            adjusted_balance=adjusted_balance,
            is_balanced=(adjusted_balance == reconciliation_data.book_balance),
            created_by=user_id
        )
        
        self.db.add(reconciliation)
        self.db.commit()
        self.db.refresh(reconciliation)
        
        return reconciliation
    
    def update_bank_reconciliation(self, reconciliation_id: str, 
                                 reconciliation_data: BankReconciliationUpdate) -> Optional[BankReconciliation]:
        """Update bank reconciliation"""
        reconciliation = self.db.query(BankReconciliation).filter(
            BankReconciliation.id == reconciliation_id
        ).first()
        
        if not reconciliation:
            return None
        
        for field, value in reconciliation_data.dict(exclude_unset=True).items():
            setattr(reconciliation, field, value)
        
        # Recalculate adjusted balance
        reconciliation.adjusted_balance = (reconciliation.statement_balance + 
                                         reconciliation.outstanding_deposits - 
                                         reconciliation.outstanding_checks - 
                                         reconciliation.bank_charges + 
                                         reconciliation.interest_earned)
        
        reconciliation.is_balanced = (reconciliation.adjusted_balance == reconciliation.book_balance)
        reconciliation.updated_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(reconciliation)
        
        return reconciliation
    
    def match_bank_transactions(self, reconciliation_id: str, transaction_ids: List[str]) -> BankReconciliation:
        """Match bank transactions to reconciliation"""
        reconciliation = self.db.query(BankReconciliation).filter(
            BankReconciliation.id == reconciliation_id
        ).first()
        
        if not reconciliation:
            raise ValueError("Reconciliation not found")
        
        # Update transactions
        self.db.query(BankTransaction).filter(
            BankTransaction.id.in_(transaction_ids)
        ).update({
            BankTransaction.is_reconciled: True,
            BankTransaction.reconciled_at: datetime.utcnow(),
            BankTransaction.reconciliation_id: reconciliation_id
        }, synchronize_session=False)
        
        self.db.commit()
        self.db.refresh(reconciliation)
        
        return reconciliation
    
    # Check Management
    def create_check(self, check_data: CheckRegisterCreate) -> CheckRegister:
        """Create a new check"""
        check = CheckRegister(**check_data.dict())
        
        self.db.add(check)
        self.db.commit()
        self.db.refresh(check)
        
        return check
    
    def update_check_status(self, check_id: str, check_data: CheckRegisterUpdate) -> Optional[CheckRegister]:
        """Update check status"""
        check = self.db.query(CheckRegister).filter(CheckRegister.id == check_id).first()
        if not check:
            return None
        
        for field, value in check_data.dict(exclude_unset=True).items():
            setattr(check, field, value)
        
        check.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(check)
        
        return check
    
    # Financial Reporting
    def generate_trial_balance(self, as_of_date: datetime) -> TrialBalanceResponse:
        """Generate trial balance report"""
        # Get all accounts with balances
        query = text("""
            SELECT 
                coa.account_code,
                coa.account_name,
                coa.account_type,
                COALESCE(SUM(jel.debit_amount), 0) as total_debits,
                COALESCE(SUM(jel.credit_amount), 0) as total_credits
            FROM chart_of_accounts coa
            LEFT JOIN journal_entry_lines jel ON coa.id = jel.account_id
            LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id
            WHERE coa.is_active = true
                AND (je.entry_date IS NULL OR je.entry_date <= :as_of_date)
                AND (je.status IS NULL OR je.status = 'posted')
            GROUP BY coa.id, coa.account_code, coa.account_name, coa.account_type
            ORDER BY coa.account_code
        """)
        
        result = self.db.execute(query, {"as_of_date": as_of_date})
        
        accounts = []
        total_debits = Decimal('0')
        total_credits = Decimal('0')
        
        for row in result:
            debit_balance = Decimal('0')
            credit_balance = Decimal('0')
            
            net_balance = row.total_debits - row.total_credits
            
            if net_balance > 0:
                debit_balance = net_balance
            elif net_balance < 0:
                credit_balance = abs(net_balance)
            
            accounts.append(TrialBalanceItem(
                account_code=row.account_code,
                account_name=row.account_name,
                account_type=row.account_type,
                debit_balance=debit_balance,
                credit_balance=credit_balance
            ))
            
            total_debits += debit_balance
            total_credits += credit_balance
        
        return TrialBalanceResponse(
            as_of_date=as_of_date,
            total_debits=total_debits,
            total_credits=total_credits,
            is_balanced=(total_debits == total_credits),
            accounts=accounts
        )
    
    def generate_balance_sheet(self, as_of_date: datetime) -> BalanceSheetResponse:
        """Generate balance sheet report"""
        # Get account balances by type
        query = text("""
            SELECT 
                coa.account_code,
                coa.account_name,
                coa.account_type,
                coa.level,
                COALESCE(SUM(jel.debit_amount) - SUM(jel.credit_amount), 0) as balance
            FROM chart_of_accounts coa
            LEFT JOIN journal_entry_lines jel ON coa.id = jel.account_id
            LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id
            WHERE coa.is_active = true
                AND coa.account_type IN ('Asset', 'Liability', 'Equity')
                AND (je.entry_date IS NULL OR je.entry_date <= :as_of_date)
                AND (je.status IS NULL OR je.status = 'posted')
            GROUP BY coa.id, coa.account_code, coa.account_name, coa.account_type, coa.level
            ORDER BY coa.account_type, coa.account_code
        """)
        
        result = self.db.execute(query, {"as_of_date": as_of_date})
        
        assets = []
        liabilities = []
        equity = []
        total_assets = Decimal('0')
        total_liabilities = Decimal('0')
        total_equity = Decimal('0')
        
        for row in result:
            balance = row.balance
            
            item = BalanceSheetItem(
                account_code=row.account_code,
                account_name=row.account_name,
                balance=balance,
                level=row.level
            )
            
            if row.account_type == 'Asset':
                assets.append(item)
                total_assets += balance
            elif row.account_type == 'Liability':
                liabilities.append(item)
                total_liabilities += abs(balance)  # Liabilities are typically credit balances
            elif row.account_type == 'Equity':
                equity.append(item)
                total_equity += abs(balance)  # Equity is typically credit balance
        
        return BalanceSheetResponse(
            as_of_date=as_of_date,
            assets=assets,
            liabilities=liabilities,
            equity=equity,
            total_assets=total_assets,
            total_liabilities=total_liabilities,
            total_equity=total_equity
        )
    
    def generate_income_statement(self, start_date: datetime, end_date: datetime) -> IncomeStatementResponse:
        """Generate income statement (P&L) report"""
        query = text("""
            SELECT 
                coa.account_code,
                coa.account_name,
                coa.account_type,
                coa.level,
                COALESCE(SUM(jel.credit_amount) - SUM(jel.debit_amount), 0) as amount
            FROM chart_of_accounts coa
            LEFT JOIN journal_entry_lines jel ON coa.id = jel.account_id
            LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id
            WHERE coa.is_active = true
                AND coa.account_type IN ('Revenue', 'Expense')
                AND je.entry_date BETWEEN :start_date AND :end_date
                AND je.status = 'posted'
            GROUP BY coa.id, coa.account_code, coa.account_name, coa.account_type, coa.level
            ORDER BY coa.account_type, coa.account_code
        """)
        
        result = self.db.execute(query, {"start_date": start_date, "end_date": end_date})
        
        revenue = []
        expenses = []
        total_revenue = Decimal('0')
        total_expenses = Decimal('0')
        
        for row in result:
            amount = row.amount
            
            item = IncomeStatementItem(
                account_code=row.account_code,
                account_name=row.account_name,
                amount=amount,
                level=row.level
            )
            
            if row.account_type == 'Revenue':
                revenue.append(item)
                total_revenue += amount
            elif row.account_type == 'Expense':
                expenses.append(item)
                total_expenses += abs(amount)  # Expenses are typically debit balances
        
        net_income = total_revenue - total_expenses
        
        return IncomeStatementResponse(
            start_date=start_date,
            end_date=end_date,
            revenue=revenue,
            expenses=expenses,
            total_revenue=total_revenue,
            total_expenses=total_expenses,
            net_income=net_income
        )
    
    def generate_general_ledger(self, account_id: str, start_date: datetime, end_date: datetime) -> GeneralLedgerResponse:
        """Generate general ledger for specific account"""
        account = self.get_chart_account(account_id)
        if not account:
            raise ValueError("Account not found")
        
        # Get opening balance
        opening_query = text("""
            SELECT COALESCE(SUM(jel.debit_amount) - SUM(jel.credit_amount), 0) as opening_balance
            FROM journal_entry_lines jel
            JOIN journal_entries je ON jel.journal_entry_id = je.id
            WHERE jel.account_id = :account_id
                AND je.entry_date < :start_date
                AND je.status = 'posted'
        """)
        
        opening_result = self.db.execute(opening_query, {"account_id": account_id, "start_date": start_date})
        opening_balance = opening_result.scalar() or Decimal('0')
        
        # Get transactions
        transactions_query = text("""
            SELECT 
                je.entry_date,
                je.entry_number,
                je.description,
                je.reference,
                jel.debit_amount,
                jel.credit_amount
            FROM journal_entry_lines jel
            JOIN journal_entries je ON jel.journal_entry_id = je.id
            WHERE jel.account_id = :account_id
                AND je.entry_date BETWEEN :start_date AND :end_date
                AND je.status = 'posted'
            ORDER BY je.entry_date, je.entry_number
        """)
        
        transactions_result = self.db.execute(transactions_query, {
            "account_id": account_id,
            "start_date": start_date,
            "end_date": end_date
        })
        
        transactions = []
        running_balance = opening_balance
        
        for row in transactions_result:
            running_balance += row.debit_amount - row.credit_amount
            
            transactions.append(GeneralLedgerItem(
                entry_date=row.entry_date,
                entry_number=row.entry_number,
                description=row.description,
                reference=row.reference,
                debit_amount=row.debit_amount,
                credit_amount=row.credit_amount,
                running_balance=running_balance
            ))
        
        return GeneralLedgerResponse(
            account_code=account.account_code,
            account_name=account.account_name,
            start_date=start_date,
            end_date=end_date,
            opening_balance=opening_balance,
            closing_balance=running_balance,
            transactions=transactions
        )
    
    # Helper Methods
    def _generate_entry_number(self) -> str:
        """Generate unique journal entry number"""
        current_date = datetime.utcnow()
        prefix = f"JE{current_date.strftime('%Y%m')}"
        
        # Get next sequence number for the month
        last_entry = self.db.query(JournalEntry).filter(
            JournalEntry.entry_number.like(f"{prefix}%")
        ).order_by(desc(JournalEntry.entry_number)).first()
        
        if last_entry:
            last_number = int(last_entry.entry_number[-4:])
            next_number = last_number + 1
        else:
            next_number = 1
        
        return f"{prefix}{next_number:04d}"
    
    def _update_bank_balance(self, bank_account_id: str):
        """Update bank account current balance"""
        balance_query = text("""
            SELECT COALESCE(SUM(
                CASE 
                    WHEN transaction_type = 'credit' THEN amount
                    WHEN transaction_type = 'debit' THEN -amount
                    ELSE 0
                END
            ), 0) as current_balance
            FROM bank_transactions
            WHERE bank_account_id = :bank_account_id
        """)
        
        result = self.db.execute(balance_query, {"bank_account_id": bank_account_id})
        current_balance = result.scalar() or Decimal('0')
        
        self.db.query(BankAccount).filter(BankAccount.id == bank_account_id).update({
            BankAccount.current_balance: current_balance
        })
        
        self.db.commit()
    
    def _log_audit_action(self, action: str, table_name: str, record_id: str, 
                         old_values: Optional[Dict], new_values: Optional[Dict], user_id: str):
        """Log audit trail for accounting operations"""
        audit_log = AccountingAuditLog(
            action=action,
            table_name=table_name,
            record_id=record_id,
            old_values=old_values,
            new_values=new_values,
            user_id=user_id,
            created_at=datetime.utcnow()
        )
        
        self.db.add(audit_log)
        # Don't commit here - let the calling method handle the transaction