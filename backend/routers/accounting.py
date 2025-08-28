"""
Double-Entry Accounting System Router
Comprehensive API endpoints for accounting operations
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date

from database import get_db
from services.accounting_service import AccountingService
from oauth2_middleware import get_current_user, require_permission, require_any_permission
import models
from schemas_accounting import (
    ChartOfAccountsCreate, ChartOfAccountsUpdate, ChartOfAccountsResponse,
    AccountingPeriodCreate, AccountingPeriodResponse,
    JournalEntryCreate, JournalEntryUpdate, JournalEntryResponse,
    BankAccountCreate, BankAccountUpdate, BankAccountResponse,
    BankTransactionCreate, BankTransactionResponse,
    BankReconciliationCreate, BankReconciliationUpdate, BankReconciliationResponse,
    CheckRegisterCreate, CheckRegisterUpdate, CheckRegisterResponse,
    TrialBalanceResponse, BalanceSheetResponse, IncomeStatementResponse,
    GeneralLedgerResponse, SubsidiaryLedgerResponse,
    AccountType, JournalEntryStatus, ReconciliationStatus
)

router = APIRouter(prefix="/api/accounting", tags=["accounting"])

# Chart of Accounts Endpoints
@router.post("/chart-of-accounts", response_model=ChartOfAccountsResponse)
async def create_chart_account(
    account_data: ChartOfAccountsCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("manage_accounting"))
):
    """Create a new chart of accounts entry"""
    try:
        service = AccountingService(db)
        
        # Check if account code already exists
        existing = service.get_chart_account_by_code(account_data.account_code)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Account code {account_data.account_code} already exists"
            )
        
        account = service.create_chart_account(account_data, current_user_id)
        return account
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/chart-of-accounts", response_model=List[ChartOfAccountsResponse])
async def get_chart_accounts(
    account_type: Optional[AccountType] = None,
    db: Session = Depends(get_db)
):
    """Get chart of accounts hierarchy"""
    service = AccountingService(db)
    accounts = service.get_chart_accounts_hierarchy(account_type.value if account_type else None)
    return accounts

@router.get("/chart-of-accounts/{account_id}", response_model=ChartOfAccountsResponse)
async def get_chart_account(
    account_id: str,
    db: Session = Depends(get_db)
):
    """Get specific chart of accounts entry"""
    service = AccountingService(db)
    account = service.get_chart_account(account_id)
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")
    return account

@router.put("/chart-of-accounts/{account_id}", response_model=ChartOfAccountsResponse)
async def update_chart_account(
    account_id: str,
    account_data: ChartOfAccountsUpdate,
    db: Session = Depends(get_db),
    current_user_id: str = "system"  # TODO: Get from auth
):
    """Update chart of accounts entry"""
    service = AccountingService(db)
    account = service.update_chart_account(account_id, account_data, current_user_id)
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")
    return account

# Accounting Period Endpoints
@router.post("/periods", response_model=AccountingPeriodResponse)
async def create_accounting_period(
    period_data: AccountingPeriodCreate,
    db: Session = Depends(get_db)
):
    """Create a new accounting period"""
    try:
        service = AccountingService(db)
        period = service.create_accounting_period(period_data)
        return period
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/periods/current", response_model=Optional[AccountingPeriodResponse])
async def get_current_period(db: Session = Depends(get_db)):
    """Get current open accounting period"""
    service = AccountingService(db)
    period = service.get_current_period()
    return period

@router.post("/periods/{period_id}/close", response_model=AccountingPeriodResponse)
async def close_accounting_period(
    period_id: str,
    db: Session = Depends(get_db),
    current_user_id: str = "system"  # TODO: Get from auth
):
    """Close an accounting period"""
    try:
        service = AccountingService(db)
        period = service.close_accounting_period(period_id, current_user_id)
        if not period:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Period not found")
        return period
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

# Journal Entry Endpoints
@router.post("/journal-entries", response_model=JournalEntryResponse)
async def create_journal_entry(
    entry_data: JournalEntryCreate,
    db: Session = Depends(get_db),
    current_user_id: str = "system"  # TODO: Get from auth
):
    """Create a new journal entry"""
    try:
        service = AccountingService(db)
        entry = service.create_journal_entry(entry_data, current_user_id)
        return entry
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/journal-entries", response_model=List[JournalEntryResponse])
async def get_journal_entries(
    start_date: Optional[datetime] = Query(None, description="Start date filter"),
    end_date: Optional[datetime] = Query(None, description="End date filter"),
    account_id: Optional[str] = Query(None, description="Account ID filter"),
    status: Optional[JournalEntryStatus] = Query(None, description="Status filter"),
    limit: int = Query(100, ge=1, le=1000, description="Limit results"),
    offset: int = Query(0, ge=0, description="Offset results"),
    db: Session = Depends(get_db)
):
    """Get journal entries with filters"""
    service = AccountingService(db)
    entries = service.get_journal_entries(start_date, end_date, account_id, status, limit, offset)
    return entries

@router.post("/journal-entries/{entry_id}/post", response_model=JournalEntryResponse)
async def post_journal_entry(
    entry_id: str,
    db: Session = Depends(get_db),
    current_user_id: str = "system"  # TODO: Get from auth
):
    """Post a journal entry"""
    try:
        service = AccountingService(db)
        entry = service.post_journal_entry(entry_id, current_user_id)
        if not entry:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found")
        return entry
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/journal-entries/{entry_id}/approve", response_model=JournalEntryResponse)
async def approve_journal_entry(
    entry_id: str,
    db: Session = Depends(get_db),
    current_user_id: str = "system"  # TODO: Get from auth
):
    """Approve a journal entry"""
    try:
        service = AccountingService(db)
        entry = service.approve_journal_entry(entry_id, current_user_id)
        if not entry:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found")
        return entry
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/journal-entries/{entry_id}/reverse", response_model=JournalEntryResponse)
async def reverse_journal_entry(
    entry_id: str,
    reversal_reason: str,
    db: Session = Depends(get_db),
    current_user_id: str = "system"  # TODO: Get from auth
):
    """Reverse a journal entry"""
    try:
        service = AccountingService(db)
        entry = service.reverse_journal_entry(entry_id, reversal_reason, current_user_id)
        if not entry:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found")
        return entry
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

# Bank Account Endpoints
@router.post("/bank-accounts", response_model=BankAccountResponse)
async def create_bank_account(
    account_data: BankAccountCreate,
    db: Session = Depends(get_db)
):
    """Create a new bank account"""
    service = AccountingService(db)
    account = service.create_bank_account(account_data)
    return account

@router.get("/bank-accounts", response_model=List[BankAccountResponse])
async def get_bank_accounts(
    active_only: bool = Query(True, description="Get only active accounts"),
    db: Session = Depends(get_db)
):
    """Get all bank accounts"""
    service = AccountingService(db)
    accounts = service.get_bank_accounts(active_only)
    return accounts

@router.put("/bank-accounts/{account_id}", response_model=BankAccountResponse)
async def update_bank_account(
    account_id: str,
    account_data: BankAccountUpdate,
    db: Session = Depends(get_db)
):
    """Update bank account"""
    service = AccountingService(db)
    account = service.update_bank_account(account_id, account_data)
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")
    return account

# Bank Transaction Endpoints
@router.post("/bank-transactions", response_model=BankTransactionResponse)
async def create_bank_transaction(
    transaction_data: BankTransactionCreate,
    db: Session = Depends(get_db)
):
    """Create a new bank transaction"""
    service = AccountingService(db)
    transaction = service.create_bank_transaction(transaction_data)
    return transaction

@router.get("/bank-accounts/{bank_account_id}/transactions", response_model=List[BankTransactionResponse])
async def get_bank_transactions(
    bank_account_id: str,
    start_date: Optional[datetime] = Query(None, description="Start date filter"),
    end_date: Optional[datetime] = Query(None, description="End date filter"),
    reconciled_only: Optional[bool] = Query(None, description="Filter by reconciliation status"),
    db: Session = Depends(get_db)
):
    """Get bank transactions for an account"""
    service = AccountingService(db)
    transactions = service.get_bank_transactions(bank_account_id, start_date, end_date, reconciled_only)
    return transactions

# Bank Reconciliation Endpoints
@router.post("/bank-reconciliations", response_model=BankReconciliationResponse)
async def create_bank_reconciliation(
    reconciliation_data: BankReconciliationCreate,
    db: Session = Depends(get_db),
    current_user_id: str = "system"  # TODO: Get from auth
):
    """Create a new bank reconciliation"""
    service = AccountingService(db)
    reconciliation = service.create_bank_reconciliation(reconciliation_data, current_user_id)
    return reconciliation

@router.put("/bank-reconciliations/{reconciliation_id}", response_model=BankReconciliationResponse)
async def update_bank_reconciliation(
    reconciliation_id: str,
    reconciliation_data: BankReconciliationUpdate,
    db: Session = Depends(get_db)
):
    """Update bank reconciliation"""
    service = AccountingService(db)
    reconciliation = service.update_bank_reconciliation(reconciliation_id, reconciliation_data)
    if not reconciliation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reconciliation not found")
    return reconciliation

@router.post("/bank-reconciliations/{reconciliation_id}/match-transactions")
async def match_bank_transactions(
    reconciliation_id: str,
    transaction_ids: List[str],
    db: Session = Depends(get_db)
):
    """Match bank transactions to reconciliation"""
    try:
        service = AccountingService(db)
        reconciliation = service.match_bank_transactions(reconciliation_id, transaction_ids)
        return {"message": "Transactions matched successfully", "reconciliation_id": reconciliation_id}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

# Check Management Endpoints
@router.post("/checks", response_model=CheckRegisterResponse)
async def create_check(
    check_data: CheckRegisterCreate,
    db: Session = Depends(get_db)
):
    """Create a new check"""
    service = AccountingService(db)
    check = service.create_check(check_data)
    return check

@router.put("/checks/{check_id}", response_model=CheckRegisterResponse)
async def update_check_status(
    check_id: str,
    check_data: CheckRegisterUpdate,
    db: Session = Depends(get_db)
):
    """Update check status"""
    service = AccountingService(db)
    check = service.update_check_status(check_id, check_data)
    if not check:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Check not found")
    return check

# Financial Reports Endpoints
@router.get("/reports/trial-balance", response_model=TrialBalanceResponse)
async def get_trial_balance(
    as_of_date: datetime = Query(..., description="As of date for trial balance"),
    db: Session = Depends(get_db)
):
    """Generate trial balance report"""
    service = AccountingService(db)
    trial_balance = service.generate_trial_balance(as_of_date)
    return trial_balance

@router.get("/reports/balance-sheet", response_model=BalanceSheetResponse)
async def get_balance_sheet(
    as_of_date: datetime = Query(..., description="As of date for balance sheet"),
    db: Session = Depends(get_db)
):
    """Generate balance sheet report"""
    service = AccountingService(db)
    balance_sheet = service.generate_balance_sheet(as_of_date)
    return balance_sheet

@router.get("/reports/income-statement", response_model=IncomeStatementResponse)
async def get_income_statement(
    start_date: datetime = Query(..., description="Start date for income statement"),
    end_date: datetime = Query(..., description="End date for income statement"),
    db: Session = Depends(get_db)
):
    """Generate income statement (P&L) report"""
    service = AccountingService(db)
    income_statement = service.generate_income_statement(start_date, end_date)
    return income_statement

@router.get("/reports/general-ledger/{account_id}", response_model=GeneralLedgerResponse)
async def get_general_ledger(
    account_id: str,
    start_date: datetime = Query(..., description="Start date for ledger"),
    end_date: datetime = Query(..., description="End date for ledger"),
    db: Session = Depends(get_db)
):
    """Generate general ledger for specific account"""
    try:
        service = AccountingService(db)
        ledger = service.generate_general_ledger(account_id, start_date, end_date)
        return ledger
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

# Automated Journal Entry Creation
@router.post("/journal-entries/from-invoice/{invoice_id}", response_model=JournalEntryResponse)
async def create_journal_entry_from_invoice(
    invoice_id: str,
    db: Session = Depends(get_db),
    current_user_id: str = "system"  # TODO: Get from auth
):
    """Create journal entry from invoice (automated)"""
    try:
        service = AccountingService(db)
        
        # TODO: Implement invoice-to-journal-entry logic
        # This would integrate with the invoice system to automatically
        # create appropriate journal entries when invoices are posted
        
        # For now, return a placeholder response
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Automated journal entry creation from invoices not yet implemented"
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/journal-entries/from-payment/{payment_id}", response_model=JournalEntryResponse)
async def create_journal_entry_from_payment(
    payment_id: str,
    db: Session = Depends(get_db),
    current_user_id: str = "system"  # TODO: Get from auth
):
    """Create journal entry from payment (automated)"""
    try:
        service = AccountingService(db)
        
        # TODO: Implement payment-to-journal-entry logic
        # This would integrate with the payment system to automatically
        # create appropriate journal entries when payments are processed
        
        # For now, return a placeholder response
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Automated journal entry creation from payments not yet implemented"
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

# Bulk Operations
@router.post("/journal-entries/bulk-post")
async def bulk_post_journal_entries(
    entry_ids: List[str],
    db: Session = Depends(get_db),
    current_user_id: str = "system"  # TODO: Get from auth
):
    """Bulk post multiple journal entries"""
    try:
        service = AccountingService(db)
        results = []
        errors = []
        
        for entry_id in entry_ids:
            try:
                entry = service.post_journal_entry(entry_id, current_user_id)
                if entry:
                    results.append({"entry_id": entry_id, "status": "posted"})
                else:
                    errors.append({"entry_id": entry_id, "error": "Entry not found"})
            except ValueError as e:
                errors.append({"entry_id": entry_id, "error": str(e)})
        
        return {
            "posted": len(results),
            "errors": len(errors),
            "results": results,
            "error_details": errors
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# Account Balance Inquiry
@router.get("/accounts/{account_id}/balance")
async def get_account_balance(
    account_id: str,
    as_of_date: Optional[datetime] = Query(None, description="As of date (defaults to current date)"),
    db: Session = Depends(get_db)
):
    """Get current balance for specific account"""
    service = AccountingService(db)
    account = service.get_chart_account(account_id)
    
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")
    
    if not as_of_date:
        as_of_date = datetime.utcnow()
    
    # Generate a mini general ledger to get the balance
    ledger = service.generate_general_ledger(account_id, datetime.min, as_of_date)
    
    return {
        "account_id": account_id,
        "account_code": account.account_code,
        "account_name": account.account_name,
        "balance": ledger.closing_balance,
        "as_of_date": as_of_date
    }