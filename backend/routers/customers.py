from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, desc, func
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from database import get_db
from models import Customer, Payment, Invoice
from schemas import (
    Customer as CustomerSchema,
    CustomerCreate,
    CustomerUpdate,
    CustomerWithPayments,
    Payment as PaymentSchema,
    PaymentCreate,
    PaymentWithCustomer,
    CustomerDebtSummary,
    CustomerSearchFilters
)
from auth import get_current_user, require_permission

router = APIRouter(prefix="/customers", tags=["customers"])

@router.post("/", response_model=CustomerSchema)
async def create_customer(
    customer: CustomerCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("manage_customers"))
):
    """Create a new customer"""
    # Check if customer with same phone already exists
    if customer.phone:
        existing_customer = db.query(Customer).filter(Customer.phone == customer.phone).first()
        if existing_customer:
            raise HTTPException(status_code=400, detail="Customer with this phone number already exists")
    
    # Check if customer with same email already exists
    if customer.email:
        existing_customer = db.query(Customer).filter(Customer.email == customer.email).first()
        if existing_customer:
            raise HTTPException(status_code=400, detail="Customer with this email already exists")
    
    # Check if customer with same national ID already exists
    if customer.national_id:
        existing_customer = db.query(Customer).filter(Customer.national_id == customer.national_id).first()
        if existing_customer:
            raise HTTPException(status_code=400, detail="Customer with this national ID already exists")
    
    db_customer = Customer(**customer.model_dump())
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

@router.get("/", response_model=List[CustomerSchema])
async def get_customers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    
    # Basic filters
    name: Optional[str] = Query(None, description="Filter by customer name"),
    phone: Optional[str] = Query(None, description="Filter by phone number"),
    email: Optional[str] = Query(None, description="Filter by email"),
    
    # Address filters
    city: Optional[str] = Query(None, description="Filter by city"),
    state: Optional[str] = Query(None, description="Filter by state"),
    country: Optional[str] = Query(None, description="Filter by country"),
    
    # Personal information filters
    national_id: Optional[str] = Query(None, description="Filter by national ID"),
    gender: Optional[str] = Query(None, description="Filter by gender"),
    nationality: Optional[str] = Query(None, description="Filter by nationality"),
    occupation: Optional[str] = Query(None, description="Filter by occupation"),
    
    # Business filters
    customer_type: Optional[str] = Query(None, description="Filter by customer type"),
    
    # Status filters
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    blacklisted: Optional[bool] = Query(None, description="Filter blacklisted customers"),
    
    # Financial filters
    has_debt: Optional[bool] = Query(None, description="Filter customers with debt"),
    min_debt: Optional[float] = Query(None, ge=0, description="Minimum debt amount"),
    max_debt: Optional[float] = Query(None, ge=0, description="Maximum debt amount"),
    min_credit_limit: Optional[float] = Query(None, ge=0, description="Minimum credit limit"),
    tax_exempt: Optional[bool] = Query(None, description="Filter tax exempt customers"),
    
    # Age filters
    min_age: Optional[int] = Query(None, ge=0, description="Minimum age"),
    max_age: Optional[int] = Query(None, ge=0, le=150, description="Maximum age"),
    
    # Sorting
    sort_by: str = Query("created_at", description="Sort field"),
    sort_order: str = Query("desc", description="Sort order (asc/desc)"),
    
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("view_customers"))
):
    """Get customers with comprehensive filtering and pagination"""
    query = db.query(Customer)
    
    # Apply basic filters
    if name:
        query = query.filter(Customer.name.ilike(f"%{name}%"))
    
    if phone:
        query = query.filter(Customer.phone.ilike(f"%{phone}%"))
    
    if email:
        query = query.filter(Customer.email.ilike(f"%{email}%"))
    
    # Apply address filters
    if city:
        query = query.filter(Customer.city.ilike(f"%{city}%"))
        
    if state:
        query = query.filter(Customer.state.ilike(f"%{state}%"))
        
    if country:
        query = query.filter(Customer.country.ilike(f"%{country}%"))
    
    # Apply personal information filters
    if national_id:
        query = query.filter(Customer.national_id.ilike(f"%{national_id}%"))
        
    if gender:
        query = query.filter(Customer.gender == gender)
        
    if nationality:
        query = query.filter(Customer.nationality.ilike(f"%{nationality}%"))
        
    if occupation:
        query = query.filter(Customer.occupation.ilike(f"%{occupation}%"))
    
    # Apply business filters
    if customer_type:
        query = query.filter(Customer.customer_type == customer_type)
    
    # Apply status filters
    if is_active is not None:
        query = query.filter(Customer.is_active == is_active)
        
    if blacklisted is not None:
        query = query.filter(Customer.blacklisted == blacklisted)
    
    # Apply financial filters
    if has_debt is not None:
        if has_debt:
            query = query.filter(Customer.current_debt > 0)
        else:
            query = query.filter(Customer.current_debt == 0)
    
    if min_debt is not None:
        query = query.filter(Customer.current_debt >= min_debt)
    
    if max_debt is not None:
        query = query.filter(Customer.current_debt <= max_debt)
        
    if min_credit_limit is not None:
        query = query.filter(Customer.credit_limit >= min_credit_limit)
        
    if tax_exempt is not None:
        query = query.filter(Customer.tax_exempt == tax_exempt)
    
    # Apply age filters
    if min_age is not None:
        query = query.filter(Customer.age >= min_age)
        
    if max_age is not None:
        query = query.filter(Customer.age <= max_age)
    
    # Apply sorting
    if hasattr(Customer, sort_by):
        sort_column = getattr(Customer, sort_by)
        if sort_order.lower() == "desc":
            query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(sort_column)
    
    return query.offset(skip).limit(limit).all()

@router.get("/search", response_model=List[CustomerSchema])
async def search_customers(
    q: str = Query(..., min_length=1, description="Search query"),
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("view_customers"))
):
    """Search customers by name, phone, or email"""
    search_term = f"%{q}%"
    customers = db.query(Customer).filter(
        or_(
            Customer.name.ilike(search_term),
            Customer.phone.ilike(search_term),
            Customer.email.ilike(search_term)
        )
    ).limit(50).all()
    
    return customers

@router.get("/debt-summary", response_model=List[CustomerDebtSummary])
async def get_customers_debt_summary(
    only_with_debt: bool = Query(True, description="Only show customers with debt"),
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("view_customers"))
):
    """Get customer debt summary with payment statistics"""
    query = db.query(
        Customer.id.label('customer_id'),
        Customer.name.label('customer_name'),
        Customer.current_debt.label('total_debt'),
        func.coalesce(func.sum(Payment.amount), 0).label('total_payments'),
        func.max(Payment.payment_date).label('last_payment_date'),
        func.count(Payment.id).label('payment_count')
    ).outerjoin(Payment).group_by(Customer.id, Customer.name, Customer.current_debt)
    
    if only_with_debt:
        query = query.filter(Customer.current_debt > 0)
    
    results = query.order_by(desc(Customer.current_debt)).all()
    
    return [
        CustomerDebtSummary(
            customer_id=result.customer_id,
            customer_name=result.customer_name,
            total_debt=float(result.total_debt),
            total_payments=float(result.total_payments),
            last_payment_date=result.last_payment_date,
            payment_count=result.payment_count
        )
        for result in results
    ]

@router.get("/{customer_id}", response_model=CustomerWithPayments)
async def get_customer(
    customer_id: UUID,
    include_payments: bool = Query(True, description="Include payment history"),
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("view_customers"))
):
    """Get customer by ID with optional payment history"""
    query = db.query(Customer)
    
    if include_payments:
        query = query.options(joinedload(Customer.payments))
    
    customer = query.filter(Customer.id == customer_id).first()
    
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    return customer

@router.put("/{customer_id}", response_model=CustomerSchema)
async def update_customer(
    customer_id: UUID,
    customer_update: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("manage_customers"))
):
    """Update customer information"""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Check for duplicate phone/email/national_id if being updated
    update_data = customer_update.model_dump(exclude_unset=True)
    
    if "phone" in update_data and update_data["phone"]:
        existing = db.query(Customer).filter(
            and_(Customer.phone == update_data["phone"], Customer.id != customer_id)
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Customer with this phone number already exists")
    
    if "email" in update_data and update_data["email"]:
        existing = db.query(Customer).filter(
            and_(Customer.email == update_data["email"], Customer.id != customer_id)
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Customer with this email already exists")
            
    if "national_id" in update_data and update_data["national_id"]:
        existing = db.query(Customer).filter(
            and_(Customer.national_id == update_data["national_id"], Customer.id != customer_id)
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Customer with this national ID already exists")
    
    # Update customer fields
    for field, value in update_data.items():
        setattr(customer, field, value)
    
    db.commit()
    db.refresh(customer)
    return customer

@router.delete("/{customer_id}")
async def delete_customer(
    customer_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("manage_customers"))
):
    """Delete customer (only if no invoices or payments exist)"""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Check if customer has invoices
    invoice_count = db.query(Invoice).filter(Invoice.customer_id == customer_id).count()
    if invoice_count > 0:
        raise HTTPException(
            status_code=400, 
            detail="Cannot delete customer with existing invoices"
        )
    
    # Check if customer has payments
    payment_count = db.query(Payment).filter(Payment.customer_id == customer_id).count()
    if payment_count > 0:
        raise HTTPException(
            status_code=400, 
            detail="Cannot delete customer with existing payments"
        )
    
    db.delete(customer)
    db.commit()
    return {"message": "Customer deleted successfully"}

# Payment endpoints
@router.post("/{customer_id}/payments", response_model=PaymentSchema)
async def create_payment(
    customer_id: UUID,
    payment: PaymentCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("manage_payments"))
):
    """Record a payment for a customer"""
    # Verify customer exists
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Ensure payment customer_id matches URL parameter
    if payment.customer_id != customer_id:
        raise HTTPException(status_code=400, detail="Customer ID mismatch")
    
    # Verify invoice exists if specified
    if payment.invoice_id:
        invoice = db.query(Invoice).filter(
            and_(Invoice.id == payment.invoice_id, Invoice.customer_id == customer_id)
        ).first()
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found for this customer")
    
    # Create payment record
    db_payment = Payment(**payment.model_dump())
    db.add(db_payment)
    
    # Update customer debt
    from decimal import Decimal
    payment_amount = Decimal(str(payment.amount))
    customer.current_debt = max(Decimal("0"), customer.current_debt - payment_amount)
    
    # Update invoice if specified
    if payment.invoice_id:
        invoice = db.query(Invoice).filter(Invoice.id == payment.invoice_id).first()
        if invoice:
            invoice.paid_amount += payment_amount
            invoice.remaining_amount = max(Decimal("0"), invoice.remaining_amount - payment_amount)
            if invoice.remaining_amount == 0:
                invoice.status = 'paid'
            elif invoice.paid_amount > 0:
                invoice.status = 'partial'
    
    db.commit()
    db.refresh(db_payment)
    return db_payment

@router.get("/{customer_id}/payments", response_model=List[PaymentSchema])
async def get_customer_payments(
    customer_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("view_customers"))
):
    """Get payment history for a customer"""
    # Verify customer exists
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    payments = db.query(Payment).filter(Payment.customer_id == customer_id)\
        .order_by(desc(Payment.payment_date))\
        .offset(skip).limit(limit).all()
    
    return payments

@router.get("/{customer_id}/debt-history")
async def get_customer_debt_history(
    customer_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("view_customers"))
):
    """Get customer debt history including invoices and payments"""
    # Verify customer exists
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Get invoices that added to debt
    invoices = db.query(Invoice).filter(Invoice.customer_id == customer_id)\
        .order_by(desc(Invoice.created_at)).all()
    
    # Get payments that reduced debt
    payments = db.query(Payment).filter(Payment.customer_id == customer_id)\
        .order_by(desc(Payment.payment_date)).all()
    
    # Combine and sort by date
    debt_history = []
    
    for invoice in invoices:
        debt_history.append({
            "type": "invoice",
            "id": invoice.id,
            "date": invoice.created_at,
            "amount": float(invoice.remaining_amount),
            "description": f"Invoice #{invoice.invoice_number}",
            "running_balance": None  # Will be calculated
        })
    
    for payment in payments:
        debt_history.append({
            "type": "payment",
            "id": payment.id,
            "date": payment.payment_date,
            "amount": -float(payment.amount),  # Negative because it reduces debt
            "description": payment.description or f"Payment - {payment.payment_method}",
            "running_balance": None  # Will be calculated
        })
    
    # Sort by date (oldest first) and calculate running balance
    debt_history.sort(key=lambda x: x["date"])
    running_balance = 0
    
    for entry in debt_history:
        running_balance += entry["amount"]
        entry["running_balance"] = running_balance
    
    # Return in reverse order (newest first)
    debt_history.reverse()
    
    return {
        "customer_id": customer_id,
        "current_debt": float(customer.current_debt),
        "debt_history": debt_history
    }