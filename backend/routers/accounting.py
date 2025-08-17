from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, desc, asc
from typing import List, Optional, Dict, Any
from datetime import datetime, date
from uuid import UUID
import uuid

from database import get_db
from models import (
    AccountingEntry, Invoice, InvoiceItem, Customer, Payment, 
    InventoryItem, Category
)
from schemas import (
    AccountingEntry as AccountingEntrySchema,
    AccountingEntryCreate
)
from auth import get_current_user

router = APIRouter(prefix="/accounting", tags=["accounting"])

# Pydantic models for accounting responses
from pydantic import BaseModel

class LedgerEntry(BaseModel):
    id: UUID
    entry_type: str
    category: str
    amount: Optional[float] = None
    weight_grams: Optional[float] = None
    description: str
    reference_id: Optional[UUID] = None
    reference_type: Optional[str] = None
    transaction_date: datetime
    created_at: datetime

class IncomeLedgerEntry(BaseModel):
    id: UUID
    invoice_id: UUID
    invoice_number: str
    customer_name: str
    total_amount: float
    paid_amount: float
    remaining_amount: float
    payment_status: str
    transaction_date: datetime
    category: str = "sales"

class ExpenseLedgerEntry(BaseModel):
    id: UUID
    category: str
    amount: float
    description: str
    transaction_date: datetime
    reference_type: Optional[str] = None

class CashBankLedgerEntry(BaseModel):
    id: UUID
    transaction_type: str  # 'cash_in', 'cash_out', 'bank_deposit', 'bank_withdrawal'
    amount: float
    description: str
    payment_method: str
    reference_id: Optional[UUID] = None
    reference_type: Optional[str] = None
    transaction_date: datetime

class GoldWeightLedgerEntry(BaseModel):
    id: UUID
    transaction_type: str  # 'purchase', 'sale', 'adjustment'
    weight_grams: float
    description: str
    reference_id: Optional[UUID] = None
    reference_type: Optional[str] = None
    transaction_date: datetime
    current_valuation: Optional[float] = None

class ProfitLossAnalysis(BaseModel):
    period_start: date
    period_end: date
    total_revenue: float
    total_expenses: float
    gross_profit: float
    net_profit: float
    profit_margin: float
    top_performing_categories: List[Dict[str, Any]]
    revenue_breakdown: Dict[str, float]
    expense_breakdown: Dict[str, float]

class DebtTrackingEntry(BaseModel):
    customer_id: UUID
    customer_name: str
    customer_phone: Optional[str]
    total_debt: float
    total_invoices: int
    last_purchase_date: Optional[datetime]
    last_payment_date: Optional[datetime]
    payment_history_count: int

class LedgerSummary(BaseModel):
    total_income: float
    total_expenses: float
    total_cash_flow: float
    total_gold_weight: float
    total_customer_debt: float
    net_profit: float

# Helper functions for automatic ledger updates
async def create_accounting_entry(
    db: Session,
    entry_type: str,
    category: str,
    description: str,
    amount: Optional[float] = None,
    weight_grams: Optional[float] = None,
    reference_id: Optional[UUID] = None,
    reference_type: Optional[str] = None,
    transaction_date: Optional[datetime] = None
) -> AccountingEntry:
    """Create an accounting entry with automatic timestamp"""
    entry = AccountingEntry(
        id=uuid.uuid4(),
        entry_type=entry_type,
        category=category,
        amount=amount,
        weight_grams=weight_grams,
        description=description,
        reference_id=reference_id,
        reference_type=reference_type,
        transaction_date=transaction_date or datetime.utcnow()
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry

# Income Ledger Endpoints
@router.get("/income-ledger", response_model=List[IncomeLedgerEntry])
async def get_income_ledger(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    customer_id: Optional[UUID] = Query(None),
    category: Optional[str] = Query(None),
    payment_status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get income ledger with automatic invoice integration"""
    query = db.query(Invoice).join(Customer)
    
    if start_date:
        query = query.filter(Invoice.created_at >= start_date)
    if end_date:
        query = query.filter(Invoice.created_at <= end_date)
    if customer_id:
        query = query.filter(Invoice.customer_id == customer_id)
    if payment_status:
        if payment_status == "paid":
            query = query.filter(Invoice.remaining_amount == 0)
        elif payment_status == "partial":
            query = query.filter(and_(Invoice.paid_amount > 0, Invoice.remaining_amount > 0))
        elif payment_status == "unpaid":
            query = query.filter(Invoice.paid_amount == 0)
    
    invoices = query.order_by(desc(Invoice.created_at)).all()
    
    income_entries = []
    for invoice in invoices:
        # Determine payment status
        if invoice.remaining_amount == 0:
            status = "paid"
        elif invoice.paid_amount > 0:
            status = "partial"
        else:
            status = "unpaid"
            
        income_entries.append(IncomeLedgerEntry(
            id=invoice.id,
            invoice_id=invoice.id,
            invoice_number=invoice.invoice_number,
            customer_name=invoice.customer.name,
            total_amount=float(invoice.total_amount),
            paid_amount=float(invoice.paid_amount),
            remaining_amount=float(invoice.remaining_amount),
            payment_status=status,
            transaction_date=invoice.created_at,
            category="sales"
        ))
    
    return income_entries

# Expense Ledger Endpoints
@router.get("/expense-ledger", response_model=List[ExpenseLedgerEntry])
async def get_expense_ledger(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get expense ledger with categorization"""
    query = db.query(AccountingEntry).filter(AccountingEntry.entry_type == "expense")
    
    if start_date:
        query = query.filter(AccountingEntry.transaction_date >= start_date)
    if end_date:
        query = query.filter(AccountingEntry.transaction_date <= end_date)
    if category:
        query = query.filter(AccountingEntry.category == category)
    
    entries = query.order_by(desc(AccountingEntry.transaction_date)).all()
    
    expense_entries = []
    for entry in entries:
        expense_entries.append(ExpenseLedgerEntry(
            id=entry.id,
            category=entry.category,
            amount=float(entry.amount) if entry.amount else 0.0,
            description=entry.description,
            transaction_date=entry.transaction_date,
            reference_type=entry.reference_type
        ))
    
    return expense_entries

class ExpenseEntryCreate(BaseModel):
    category: str
    amount: float
    description: str
    transaction_date: Optional[datetime] = None

@router.post("/expense-ledger", response_model=ExpenseLedgerEntry)
async def create_expense_entry(
    expense_data: ExpenseEntryCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new expense entry"""
    entry = await create_accounting_entry(
        db=db,
        entry_type="expense",
        category=expense_data.category,
        description=expense_data.description,
        amount=expense_data.amount,
        transaction_date=expense_data.transaction_date
    )
    
    return ExpenseLedgerEntry(
        id=entry.id,
        category=entry.category,
        amount=float(entry.amount),
        description=entry.description,
        transaction_date=entry.transaction_date,
        reference_type=entry.reference_type
    )

# Cash & Bank Ledger Endpoints
@router.get("/cash-bank-ledger", response_model=List[CashBankLedgerEntry])
async def get_cash_bank_ledger(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    transaction_type: Optional[str] = Query(None),
    payment_method: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get cash and bank ledger with payment linking"""
    # Get payments (cash inflows)
    payment_query = db.query(Payment).join(Customer)
    
    if start_date:
        payment_query = payment_query.filter(Payment.payment_date >= start_date)
    if end_date:
        payment_query = payment_query.filter(Payment.payment_date <= end_date)
    if payment_method:
        payment_query = payment_query.filter(Payment.payment_method == payment_method)
    
    payments = payment_query.order_by(desc(Payment.payment_date)).all()
    
    # Get cash/bank accounting entries (outflows)
    entry_query = db.query(AccountingEntry).filter(
        or_(AccountingEntry.entry_type == "cash", AccountingEntry.entry_type == "bank")
    )
    
    if start_date:
        entry_query = entry_query.filter(AccountingEntry.transaction_date >= start_date)
    if end_date:
        entry_query = entry_query.filter(AccountingEntry.transaction_date <= end_date)
    
    entries = entry_query.order_by(desc(AccountingEntry.transaction_date)).all()
    
    cash_bank_entries = []
    
    # Add payment entries (inflows)
    for payment in payments:
        if not transaction_type or transaction_type in ["cash_in", "bank_deposit"]:
            trans_type = "cash_in" if payment.payment_method == "cash" else "bank_deposit"
            if not transaction_type or transaction_type == trans_type:
                cash_bank_entries.append(CashBankLedgerEntry(
                    id=payment.id,
                    transaction_type=trans_type,
                    amount=float(payment.amount),
                    description=f"Payment from {payment.customer.name}: {payment.description or 'Invoice payment'}",
                    payment_method=payment.payment_method,
                    reference_id=payment.invoice_id,
                    reference_type="invoice" if payment.invoice_id else "general_payment",
                    transaction_date=payment.payment_date
                ))
    
    # Add accounting entries (outflows)
    for entry in entries:
        trans_type = "cash_out" if entry.entry_type == "cash" else "bank_withdrawal"
        if not transaction_type or transaction_type == trans_type:
            cash_bank_entries.append(CashBankLedgerEntry(
                id=entry.id,
                transaction_type=trans_type,
                amount=float(entry.amount) if entry.amount else 0.0,
                description=entry.description,
                payment_method=entry.entry_type,
                reference_id=entry.reference_id,
                reference_type=entry.reference_type,
                transaction_date=entry.transaction_date
            ))
    
    # Sort by transaction date
    cash_bank_entries.sort(key=lambda x: x.transaction_date, reverse=True)
    
    return cash_bank_entries

# Gold Weight Ledger Endpoints
@router.get("/gold-weight-ledger", response_model=List[GoldWeightLedgerEntry])
async def get_gold_weight_ledger(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    transaction_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get gold weight ledger for inventory valuation"""
    query = db.query(AccountingEntry).filter(AccountingEntry.entry_type == "gold_weight")
    
    if start_date:
        query = query.filter(AccountingEntry.transaction_date >= start_date)
    if end_date:
        query = query.filter(AccountingEntry.transaction_date <= end_date)
    
    entries = query.order_by(desc(AccountingEntry.transaction_date)).all()
    
    # Get current gold price for valuation
    from models import CompanySettings
    settings = db.query(CompanySettings).first()
    current_gold_price = float(settings.default_gold_price) if settings and settings.default_gold_price else 0.0
    
    gold_entries = []
    for entry in entries:
        # Determine transaction type from description or reference
        trans_type = "adjustment"
        if entry.reference_type == "invoice":
            trans_type = "sale"
        elif entry.reference_type == "inventory_purchase":
            trans_type = "purchase"
        
        if not transaction_type or transaction_type == trans_type:
            current_valuation = float(entry.weight_grams) * current_gold_price if entry.weight_grams else 0.0
            
            gold_entries.append(GoldWeightLedgerEntry(
                id=entry.id,
                transaction_type=trans_type,
                weight_grams=float(entry.weight_grams) if entry.weight_grams else 0.0,
                description=entry.description,
                reference_id=entry.reference_id,
                reference_type=entry.reference_type,
                transaction_date=entry.transaction_date,
                current_valuation=current_valuation
            ))
    
    return gold_entries

# Profit & Loss Analysis
@router.get("/profit-loss-analysis", response_model=ProfitLossAnalysis)
async def get_profit_loss_analysis(
    start_date: date = Query(...),
    end_date: date = Query(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get comprehensive profit and loss analysis"""
    
    # Calculate total revenue from invoices
    revenue_query = db.query(func.sum(Invoice.paid_amount)).filter(
        and_(Invoice.created_at >= start_date, Invoice.created_at <= end_date)
    )
    total_revenue = float(revenue_query.scalar() or 0)
    
    # Calculate total expenses
    expense_query = db.query(func.sum(AccountingEntry.amount)).filter(
        and_(
            AccountingEntry.entry_type == "expense",
            AccountingEntry.transaction_date >= start_date,
            AccountingEntry.transaction_date <= end_date
        )
    )
    total_expenses = float(expense_query.scalar() or 0)
    
    # Calculate profit metrics
    gross_profit = total_revenue - total_expenses
    net_profit = gross_profit  # Simplified for now
    profit_margin = (net_profit / total_revenue * 100) if total_revenue > 0 else 0
    
    # Get top performing categories
    category_revenue = db.query(
        Category.name,
        func.sum(InvoiceItem.total_price).label('revenue')
    ).select_from(Category).join(InventoryItem, Category.id == InventoryItem.category_id)\
    .join(InvoiceItem, InventoryItem.id == InvoiceItem.inventory_item_id)\
    .join(Invoice, InvoiceItem.invoice_id == Invoice.id).filter(
        and_(Invoice.created_at >= start_date, Invoice.created_at <= end_date)
    ).group_by(Category.name).order_by(desc('revenue')).limit(5).all()
    
    top_categories = [
        {"category": cat.name, "revenue": float(cat.revenue)}
        for cat in category_revenue
    ]
    
    # Revenue breakdown by category
    revenue_breakdown = {cat["category"]: cat["revenue"] for cat in top_categories}
    
    # Expense breakdown by category
    expense_categories = db.query(
        AccountingEntry.category,
        func.sum(AccountingEntry.amount).label('amount')
    ).filter(
        and_(
            AccountingEntry.entry_type == "expense",
            AccountingEntry.transaction_date >= start_date,
            AccountingEntry.transaction_date <= end_date
        )
    ).group_by(AccountingEntry.category).all()
    
    expense_breakdown = {
        exp.category: float(exp.amount) for exp in expense_categories
    }
    
    return ProfitLossAnalysis(
        period_start=start_date,
        period_end=end_date,
        total_revenue=total_revenue,
        total_expenses=total_expenses,
        gross_profit=gross_profit,
        net_profit=net_profit,
        profit_margin=profit_margin,
        top_performing_categories=top_categories,
        revenue_breakdown=revenue_breakdown,
        expense_breakdown=expense_breakdown
    )

# Debt Tracking System
@router.get("/debt-tracking", response_model=List[DebtTrackingEntry])
async def get_debt_tracking(
    min_debt: Optional[float] = Query(None),
    max_debt: Optional[float] = Query(None),
    customer_name: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get comprehensive debt tracking with customer integration"""
    query = db.query(Customer).filter(Customer.current_debt > 0)
    
    if min_debt:
        query = query.filter(Customer.current_debt >= min_debt)
    if max_debt:
        query = query.filter(Customer.current_debt <= max_debt)
    if customer_name:
        query = query.filter(Customer.name.ilike(f"%{customer_name}%"))
    
    customers = query.order_by(desc(Customer.current_debt)).all()
    
    debt_entries = []
    for customer in customers:
        # Get invoice count
        invoice_count = db.query(func.count(Invoice.id)).filter(
            Invoice.customer_id == customer.id
        ).scalar()
        
        # Get payment history count
        payment_count = db.query(func.count(Payment.id)).filter(
            Payment.customer_id == customer.id
        ).scalar()
        
        # Get last payment date
        last_payment = db.query(func.max(Payment.payment_date)).filter(
            Payment.customer_id == customer.id
        ).scalar()
        
        debt_entries.append(DebtTrackingEntry(
            customer_id=customer.id,
            customer_name=customer.name,
            customer_phone=customer.phone,
            total_debt=float(customer.current_debt),
            total_invoices=invoice_count or 0,
            last_purchase_date=customer.last_purchase_date,
            last_payment_date=last_payment,
            payment_history_count=payment_count or 0
        ))
    
    return debt_entries

# Ledger Summary Dashboard
@router.get("/ledger-summary", response_model=LedgerSummary)
async def get_ledger_summary(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get comprehensive ledger summary for dashboard"""
    
    # Base date filters
    date_filter = []
    if start_date:
        date_filter.append(Invoice.created_at >= start_date)
    if end_date:
        date_filter.append(Invoice.created_at <= end_date)
    
    # Total income (from paid invoices)
    income_query = db.query(func.sum(Invoice.paid_amount))
    if date_filter:
        income_query = income_query.filter(and_(*date_filter))
    total_income = float(income_query.scalar() or 0)
    
    # Total expenses
    expense_filter = [AccountingEntry.entry_type == "expense"]
    if start_date:
        expense_filter.append(AccountingEntry.transaction_date >= start_date)
    if end_date:
        expense_filter.append(AccountingEntry.transaction_date <= end_date)
    
    expense_query = db.query(func.sum(AccountingEntry.amount)).filter(and_(*expense_filter))
    total_expenses = float(expense_query.scalar() or 0)
    
    # Total cash flow (income - expenses)
    total_cash_flow = total_income - total_expenses
    
    # Total gold weight in inventory
    gold_weight_query = db.query(func.sum(InventoryItem.weight_grams * InventoryItem.stock_quantity)).filter(
        InventoryItem.is_active == True
    )
    total_gold_weight = float(gold_weight_query.scalar() or 0)
    
    # Total customer debt
    debt_query = db.query(func.sum(Customer.current_debt))
    total_customer_debt = float(debt_query.scalar() or 0)
    
    # Net profit
    net_profit = total_cash_flow
    
    return LedgerSummary(
        total_income=total_income,
        total_expenses=total_expenses,
        total_cash_flow=total_cash_flow,
        total_gold_weight=total_gold_weight,
        total_customer_debt=total_customer_debt,
        net_profit=net_profit
    )

# Automatic ledger update functions (called by other modules)
@router.post("/auto-update/invoice-created")
async def auto_update_invoice_created(
    invoice_id: UUID,
    db: Session = Depends(get_db)
):
    """Automatically update ledgers when invoice is created"""
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Create income ledger entry (automatic from invoice)
    # This is handled by the income ledger endpoint automatically
    
    # Create gold weight ledger entries for sold items
    for item in invoice.invoice_items:
        await create_accounting_entry(
            db=db,
            entry_type="gold_weight",
            category="sale",
            description=f"Gold sold via invoice {invoice.invoice_number}: {item.inventory_item.name}",
            weight_grams=-float(item.weight_grams * item.quantity),  # Negative for outgoing
            reference_id=invoice.id,
            reference_type="invoice",
            transaction_date=invoice.created_at
        )
    
    return {"message": "Ledgers updated for invoice creation"}

@router.post("/auto-update/payment-received")
async def auto_update_payment_received(
    payment_id: UUID,
    db: Session = Depends(get_db)
):
    """Automatically update ledgers when payment is received"""
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    # Cash/Bank ledger entry is automatically handled by the cash-bank-ledger endpoint
    # which reads from the payments table
    
    return {"message": "Ledgers updated for payment"}

@router.post("/auto-update/inventory-purchased")
async def auto_update_inventory_purchased(
    item_id: UUID,
    weight_grams: float,
    purchase_cost: float,
    db: Session = Depends(get_db)
):
    """Automatically update ledgers when inventory is purchased"""
    item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    
    # Create expense entry for purchase
    await create_accounting_entry(
        db=db,
        entry_type="expense",
        category="inventory_purchase",
        description=f"Purchased inventory: {item.name}",
        amount=purchase_cost,
        reference_id=item_id,
        reference_type="inventory_item"
    )
    
    # Create gold weight entry for incoming gold
    await create_accounting_entry(
        db=db,
        entry_type="gold_weight",
        category="purchase",
        description=f"Gold purchased: {item.name}",
        weight_grams=weight_grams,
        reference_id=item_id,
        reference_type="inventory_purchase"
    )
    
    return {"message": "Ledgers updated for inventory purchase"}