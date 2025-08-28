from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, desc, func
from typing import List, Optional
from uuid import UUID
from datetime import datetime
import uuid

from database import get_db
from oauth2_middleware import get_current_user, require_permission
import models
import schemas

router = APIRouter(
    prefix="/invoices",
    tags=["invoices"],
    dependencies=[Depends(get_current_user)]
)

def generate_invoice_number(db: Session) -> str:
    """Generate unique invoice number"""
    # Get current year and month
    now = datetime.now()
    year_month = now.strftime("%Y%m")
    
    # Find the last invoice number for this month
    last_invoice = db.query(models.Invoice).filter(
        models.Invoice.invoice_number.like(f"INV-{year_month}-%")
    ).order_by(desc(models.Invoice.invoice_number)).first()
    
    if last_invoice:
        # Extract sequence number and increment
        last_seq = int(last_invoice.invoice_number.split("-")[-1])
        new_seq = last_seq + 1
    else:
        new_seq = 1
    
    return f"INV-{year_month}-{new_seq:04d}"

def calculate_invoice_totals(
    items: List[schemas.InvoiceItemCreate],
    gold_price_per_gram: float,
    labor_cost_percentage: float,
    profit_percentage: float,
    vat_percentage: float,
    db: Session
) -> schemas.InvoiceCalculationSummary:
    """Calculate invoice totals with gram-based pricing"""
    calculations = []
    subtotal = 0
    total_labor_cost = 0
    total_profit = 0
    total_vat = 0
    
    for item_data in items:
        # Get inventory item
        inventory_item = db.query(models.InventoryItem).filter(
            models.InventoryItem.id == item_data.inventory_item_id
        ).first()
        
        if not inventory_item:
            raise HTTPException(
                status_code=404,
                detail=f"Inventory item {item_data.inventory_item_id} not found"
            )
        
        # Check stock availability
        if inventory_item.stock_quantity < item_data.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for {inventory_item.name}. Available: {inventory_item.stock_quantity}, Requested: {item_data.quantity}"
            )
        
        # Calculate prices based on gram weight
        total_weight = item_data.weight_grams * item_data.quantity
        base_price = total_weight * gold_price_per_gram
        
        # Calculate additional costs
        labor_cost = base_price * (labor_cost_percentage / 100)
        profit_amount = (base_price + labor_cost) * (profit_percentage / 100)
        subtotal_with_profit = base_price + labor_cost + profit_amount
        vat_amount = subtotal_with_profit * (vat_percentage / 100)
        
        # Calculate unit and total prices
        unit_price = (subtotal_with_profit + vat_amount) / item_data.quantity
        total_price = unit_price * item_data.quantity
        
        calculation = schemas.InvoiceCalculation(
            item_id=inventory_item.id,
            item_name=inventory_item.name,
            quantity=item_data.quantity,
            weight_grams=item_data.weight_grams,
            base_price=base_price,
            labor_cost=labor_cost,
            profit_amount=profit_amount,
            vat_amount=vat_amount,
            unit_price=unit_price,
            total_price=total_price
        )
        
        calculations.append(calculation)
        subtotal += base_price
        total_labor_cost += labor_cost
        total_profit += profit_amount
        total_vat += vat_amount
    
    grand_total = subtotal + total_labor_cost + total_profit + total_vat
    
    return schemas.InvoiceCalculationSummary(
        items=calculations,
        subtotal=subtotal,
        total_labor_cost=total_labor_cost,
        total_profit=total_profit,
        total_vat=total_vat,
        grand_total=grand_total
    )

def update_inventory_stock(db: Session, items: List[schemas.InvoiceItemCreate]):
    """Update inventory stock levels after invoice creation"""
    for item_data in items:
        inventory_item = db.query(models.InventoryItem).filter(
            models.InventoryItem.id == item_data.inventory_item_id
        ).first()
        
        if inventory_item:
            inventory_item.stock_quantity -= item_data.quantity
            db.add(inventory_item)

def create_accounting_entries(db: Session, invoice: models.Invoice):
    """Create accounting entries for invoice"""
    from decimal import Decimal
    # Income entry
    income_entry = models.AccountingEntry(
        entry_type="income",
        category="sales",
        amount=invoice.total_amount,
        description=f"Invoice {invoice.invoice_number} - Sales Revenue",
        reference_id=invoice.id,
        reference_type="invoice"
    )
    db.add(income_entry)
    
    # Gold weight entry (outgoing)
    total_weight = sum(Decimal(str(item.weight_grams)) * item.quantity for item in invoice.invoice_items)
    gold_weight_entry = models.AccountingEntry(
        entry_type="gold_weight",
        category="outgoing",
        weight_grams=total_weight,
        description=f"Invoice {invoice.invoice_number} - Gold Weight Sold",
        reference_id=invoice.id,
        reference_type="invoice"
    )
    db.add(gold_weight_entry)

def update_customer_debt(db: Session, customer_id: UUID, amount_change: float):
    """Update customer debt and purchase totals"""
    from decimal import Decimal
    customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if customer:
        customer.current_debt += Decimal(str(amount_change))
        customer.total_purchases += Decimal(str(amount_change)) if amount_change > 0 else 0
        customer.last_purchase_date = datetime.now()
        db.add(customer)

@router.post("/calculate", response_model=schemas.InvoiceCalculationSummary)
def calculate_invoice_preview(
    invoice_data: schemas.InvoiceCreate,
    db: Session = Depends(get_db)
):
    """Calculate invoice totals without creating the invoice"""
    return calculate_invoice_totals(
        invoice_data.items,
        invoice_data.gold_price_per_gram,
        invoice_data.labor_cost_percentage,
        invoice_data.profit_percentage,
        invoice_data.vat_percentage,
        db
    )

@router.post("/", response_model=schemas.InvoiceWithDetails)
def create_invoice(
    invoice_data: schemas.InvoiceCreate,
    db: Session = Depends(get_db)
):
    """Create a new invoice with automatic calculations and inventory updates"""
    try:
        # Verify customer exists
        customer = db.query(models.Customer).filter(
            models.Customer.id == invoice_data.customer_id
        ).first()
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        # Calculate totals
        calculation_summary = calculate_invoice_totals(
            invoice_data.items,
            invoice_data.gold_price_per_gram,
            invoice_data.labor_cost_percentage,
            invoice_data.profit_percentage,
            invoice_data.vat_percentage,
            db
        )
        
        # Create invoice
        from decimal import Decimal
        invoice = models.Invoice(
            invoice_number=generate_invoice_number(db),
            customer_id=invoice_data.customer_id,
            total_amount=Decimal(str(calculation_summary.grand_total)),
            paid_amount=Decimal('0'),
            remaining_amount=Decimal(str(calculation_summary.grand_total)),
            gold_price_per_gram=Decimal(str(invoice_data.gold_price_per_gram)),
            labor_cost_percentage=Decimal(str(invoice_data.labor_cost_percentage)),
            profit_percentage=Decimal(str(invoice_data.profit_percentage)),
            vat_percentage=Decimal(str(invoice_data.vat_percentage)),
            status="pending"
        )
        
        db.add(invoice)
        db.flush()  # Get invoice ID
        
        # Create invoice items
        for i, item_data in enumerate(invoice_data.items):
            calculation = calculation_summary.items[i]
            
            invoice_item = models.InvoiceItem(
                invoice_id=invoice.id,
                inventory_item_id=item_data.inventory_item_id,
                quantity=item_data.quantity,
                unit_price=Decimal(str(calculation.unit_price)),
                total_price=Decimal(str(calculation.total_price)),
                weight_grams=Decimal(str(item_data.weight_grams))
            )
            db.add(invoice_item)
        
        # Update inventory stock
        update_inventory_stock(db, invoice_data.items)
        
        # Update customer debt
        update_customer_debt(db, invoice_data.customer_id, calculation_summary.grand_total)
        
        # Create accounting entries
        db.flush()  # Ensure invoice_items are available
        create_accounting_entries(db, invoice)
        
        db.commit()
        
        # Return invoice with details
        return get_invoice_with_details(invoice.id, db)
        
    except Exception as e:
        db.rollback()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Error creating invoice: {str(e)}")

def get_invoice_with_details(invoice_id: UUID, db: Session) -> schemas.InvoiceWithDetails:
    """Get invoice with all related details"""
    invoice = db.query(models.Invoice).options(
        joinedload(models.Invoice.customer),
        joinedload(models.Invoice.invoice_items).joinedload(models.InvoiceItem.inventory_item),
        joinedload(models.Invoice.payments)
    ).filter(models.Invoice.id == invoice_id).first()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    return invoice

@router.get("/{invoice_id}", response_model=schemas.InvoiceWithDetails)
def get_invoice(invoice_id: UUID, db: Session = Depends(get_db)):
    """Get invoice by ID with all details"""
    return get_invoice_with_details(invoice_id, db)

@router.get("/", response_model=List[schemas.Invoice])
def list_invoices(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    customer_id: Optional[UUID] = Query(None),
    status: Optional[str] = Query(None),
    invoice_number: Optional[str] = Query(None),
    created_after: Optional[datetime] = Query(None),
    created_before: Optional[datetime] = Query(None),
    has_remaining_amount: Optional[bool] = Query(None),
    db: Session = Depends(get_db)
):
    """List invoices with filtering options"""
    query = db.query(models.Invoice)
    
    # Apply filters
    if customer_id:
        query = query.filter(models.Invoice.customer_id == customer_id)
    
    if status:
        query = query.filter(models.Invoice.status == status)
    
    if invoice_number:
        query = query.filter(models.Invoice.invoice_number.ilike(f"%{invoice_number}%"))
    
    if created_after:
        query = query.filter(models.Invoice.created_at >= created_after)
    
    if created_before:
        query = query.filter(models.Invoice.created_at <= created_before)
    
    if has_remaining_amount is not None:
        if has_remaining_amount:
            query = query.filter(models.Invoice.remaining_amount > 0)
        else:
            query = query.filter(models.Invoice.remaining_amount == 0)
    
    # Order by creation date (newest first)
    query = query.order_by(desc(models.Invoice.created_at))
    
    return query.offset(skip).limit(limit).all()

@router.put("/{invoice_id}", response_model=schemas.InvoiceWithDetails)
def update_invoice(
    invoice_id: UUID,
    invoice_update: schemas.InvoiceUpdate,
    db: Session = Depends(get_db)
):
    """Update invoice details (limited fields only)"""
    invoice = db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Only allow updating certain fields
    update_data = invoice_update.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(invoice, field, value)
    
    db.add(invoice)
    db.commit()
    
    return get_invoice_with_details(invoice_id, db)

@router.post("/{invoice_id}/payments", response_model=schemas.Payment)
def add_invoice_payment(
    invoice_id: UUID,
    payment_data: schemas.InvoicePaymentRequest,
    db: Session = Depends(get_db)
):
    """Add payment to invoice and update debt"""
    try:
        invoice = db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        # Validate payment amount
        if payment_data.amount <= 0:
            raise HTTPException(status_code=400, detail="Payment amount must be positive")
        
        # Convert to Decimal for accurate comparison
        from decimal import Decimal
        payment_amount_decimal = Decimal(str(payment_data.amount))
        remaining_decimal = Decimal(str(invoice.remaining_amount))
        
        if payment_amount_decimal > remaining_decimal:
            raise HTTPException(
                status_code=400,
                detail=f"Payment amount ({payment_amount_decimal}) exceeds remaining amount ({remaining_decimal})"
            )
        
        # Create payment record (payment_amount_decimal already defined above)
        payment = models.Payment(
            customer_id=invoice.customer_id,
            invoice_id=invoice_id,
            amount=payment_amount_decimal,
            payment_method=payment_data.payment_method,
            description=payment_data.description or f"Payment for invoice {invoice.invoice_number}"
        )
        db.add(payment)
        
        # Update invoice amounts
        invoice.paid_amount += payment_amount_decimal
        invoice.remaining_amount -= payment_amount_decimal
        
        # Update invoice status
        if invoice.remaining_amount == 0:
            invoice.status = "paid"
        elif invoice.paid_amount > 0:
            invoice.status = "partially_paid"
        
        db.add(invoice)
        
        # Update customer debt
        update_customer_debt(db, invoice.customer_id, -payment_data.amount)
        
        # Create accounting entry for payment
        cash_entry = models.AccountingEntry(
            entry_type="cash",
            category="payment_received",
            amount=payment_amount_decimal,
            description=f"Payment received for invoice {invoice.invoice_number}",
            reference_id=payment.id,
            reference_type="payment"
        )
        db.add(cash_entry)
        
        db.commit()
        return payment
        
    except Exception as e:
        db.rollback()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Error processing payment: {str(e)}")

@router.put("/{invoice_id}/status", response_model=schemas.Invoice)
def update_invoice_status(
    invoice_id: UUID,
    status_update: schemas.InvoiceStatusUpdate,
    db: Session = Depends(get_db)
):
    """Update invoice status"""
    invoice = db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Validate status
    valid_statuses = ["pending", "paid", "partially_paid", "cancelled"]
    if status_update.status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )
    
    invoice.status = status_update.status
    db.add(invoice)
    db.commit()
    
    return invoice

@router.delete("/{invoice_id}")
def delete_invoice(invoice_id: UUID, db: Session = Depends(get_db)):
    """Delete invoice (only if no payments made)"""
    invoice = db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Check if invoice has payments
    if invoice.paid_amount > 0:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete invoice with payments. Cancel instead."
        )
    
    try:
        # Restore inventory stock
        for item in invoice.invoice_items:
            inventory_item = db.query(models.InventoryItem).filter(
                models.InventoryItem.id == item.inventory_item_id
            ).first()
            if inventory_item:
                inventory_item.stock_quantity += item.quantity
                db.add(inventory_item)
        
        # Update customer debt
        update_customer_debt(db, invoice.customer_id, -invoice.total_amount)
        
        # Delete related records
        db.query(models.InvoiceItem).filter(models.InvoiceItem.invoice_id == invoice_id).delete()
        db.query(models.AccountingEntry).filter(
            and_(
                models.AccountingEntry.reference_id == invoice_id,
                models.AccountingEntry.reference_type == "invoice"
            )
        ).delete()
        
        # Delete invoice
        db.delete(invoice)
        db.commit()
        
        return {"message": "Invoice deleted successfully"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting invoice: {str(e)}")

@router.get("/{invoice_id}/pdf")
def generate_invoice_pdf(invoice_id: UUID, db: Session = Depends(get_db)):
    """Generate PDF for invoice (placeholder - would integrate with PDF library)"""
    invoice = get_invoice_with_details(invoice_id, db)
    
    # This would integrate with a PDF generation library like ReportLab or WeasyPrint
    # For now, return invoice data that frontend can use to generate PDF
    return {
        "message": "PDF generation endpoint",
        "invoice_data": invoice,
        "note": "Frontend should handle PDF generation using libraries like jsPDF or react-pdf"
    }

@router.get("/reports/summary")
def get_invoice_summary(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    db: Session = Depends(get_db)
):
    """Get invoice summary statistics"""
    query = db.query(models.Invoice)
    
    if start_date:
        query = query.filter(models.Invoice.created_at >= start_date)
    if end_date:
        query = query.filter(models.Invoice.created_at <= end_date)
    
    invoices = query.all()
    
    total_invoices = len(invoices)
    total_amount = sum(inv.total_amount for inv in invoices)
    total_paid = sum(inv.paid_amount for inv in invoices)
    total_remaining = sum(inv.remaining_amount for inv in invoices)
    
    status_counts = {}
    for invoice in invoices:
        status_counts[invoice.status] = status_counts.get(invoice.status, 0) + 1
    
    return {
        "total_invoices": total_invoices,
        "total_amount": total_amount,
        "total_paid": total_paid,
        "total_remaining": total_remaining,
        "status_breakdown": status_counts,
        "average_invoice_amount": total_amount / total_invoices if total_invoices > 0 else 0
    }