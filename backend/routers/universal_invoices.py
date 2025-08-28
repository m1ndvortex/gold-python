"""
Universal Dual Invoice System Router
Handles both Gold and General invoice types with comprehensive workflow management
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, desc, func, text
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from decimal import Decimal
import uuid
import qrcode
import io
import base64
import json

from database import get_db
from auth import get_current_user
import models_universal as models
import schemas_universal as schemas

router = APIRouter(
    prefix="/universal-invoices",
    tags=["universal-invoices"],
    dependencies=[Depends(get_current_user)]
)

def generate_invoice_number(db: Session, invoice_type: str) -> str:
    """Generate unique invoice number based on type"""
    now = datetime.now()
    year_month = now.strftime("%Y%m")
    
    # Different prefixes for different types
    prefix = "GOLD" if invoice_type == "gold" else "INV"
    
    # Find the last invoice number for this type and month
    last_invoice = db.query(models.UniversalInvoice).filter(
        and_(
            models.UniversalInvoice.invoice_number.like(f"{prefix}-{year_month}-%"),
            models.UniversalInvoice.type == invoice_type
        )
    ).order_by(desc(models.UniversalInvoice.invoice_number)).first()
    
    if last_invoice:
        # Extract sequence number and increment
        last_seq = int(last_invoice.invoice_number.split("-")[-1])
        new_seq = last_seq + 1
    else:
        new_seq = 1
    
    return f"{prefix}-{year_month}-{new_seq:04d}"

def generate_sku() -> str:
    """Generate unique SKU for items without inventory reference"""
    return f"ITEM-{uuid.uuid4().hex[:8].upper()}"

def calculate_gold_invoice_totals(
    items: List[schemas.UniversalInvoiceItemCreate],
    gold_fields: schemas.GoldInvoiceFields,
    db: Session
) -> schemas.InvoiceCalculationSummary:
    """Calculate totals for Gold invoice with specialized pricing"""
    calculations = []
    subtotal = Decimal('0')
    total_labor_cost = Decimal('0')
    total_profit = Decimal('0')
    total_vat = Decimal('0')
    
    for item_data in items:
        # Get inventory item if available
        inventory_item = None
        if item_data.inventory_item_id:
            inventory_item = db.query(models.UniversalInventoryItem).filter(
                models.UniversalInventoryItem.id == item_data.inventory_item_id
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
        
        # Calculate prices based on gold weight
        weight = item_data.weight_grams or Decimal('0')
        total_weight = weight * item_data.quantity
        base_price = total_weight * gold_fields.gold_price_per_gram
        
        # Calculate additional costs
        labor_cost = base_price * (gold_fields.labor_cost_percentage / 100)
        profit_amount = (base_price + labor_cost) * (gold_fields.profit_percentage / 100)
        subtotal_with_profit = base_price + labor_cost + profit_amount
        vat_amount = subtotal_with_profit * (gold_fields.vat_percentage / 100)
        
        # Calculate unit and total prices
        unit_price = (subtotal_with_profit + vat_amount) / item_data.quantity
        total_price = unit_price * item_data.quantity
        
        calculation = schemas.InvoiceItemCalculation(
            item_id=inventory_item.id if inventory_item else uuid.uuid4(),
            item_name=item_data.item_name,
            quantity=item_data.quantity,
            unit_price=unit_price,
            total_price=total_price,
            weight_grams=weight,
            base_price=base_price,
            labor_cost=labor_cost,
            profit_amount=profit_amount,
            vat_amount=vat_amount
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
        tax_amount=total_vat,
        discount_amount=Decimal('0'),
        grand_total=grand_total
    )

def calculate_general_invoice_totals(
    items: List[schemas.UniversalInvoiceItemCreate],
    db: Session
) -> schemas.InvoiceCalculationSummary:
    """Calculate totals for General invoice with standard pricing"""
    calculations = []
    subtotal = Decimal('0')
    
    for item_data in items:
        # Get inventory item if available
        inventory_item = None
        if item_data.inventory_item_id:
            inventory_item = db.query(models.UniversalInventoryItem).filter(
                models.UniversalInventoryItem.id == item_data.inventory_item_id
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
        
        # Use provided unit price or inventory item price
        unit_price = item_data.unit_price
        if unit_price == 0 and inventory_item:
            unit_price = inventory_item.sale_price
        
        total_price = unit_price * item_data.quantity
        
        calculation = schemas.InvoiceItemCalculation(
            item_id=inventory_item.id if inventory_item else uuid.uuid4(),
            item_name=item_data.item_name,
            quantity=item_data.quantity,
            unit_price=unit_price,
            total_price=total_price,
            weight_grams=item_data.weight_grams
        )
        
        calculations.append(calculation)
        subtotal += total_price
    
    return schemas.InvoiceCalculationSummary(
        items=calculations,
        subtotal=subtotal,
        total_labor_cost=Decimal('0'),
        total_profit=Decimal('0'),
        total_vat=Decimal('0'),
        tax_amount=Decimal('0'),
        discount_amount=Decimal('0'),
        grand_total=subtotal
    )

def update_inventory_stock(db: Session, items: List[schemas.UniversalInvoiceItemCreate], operation: str = "deduct"):
    """Update inventory stock levels (deduct or restore)"""
    for item_data in items:
        if item_data.inventory_item_id:
            inventory_item = db.query(models.UniversalInventoryItem).filter(
                models.UniversalInventoryItem.id == item_data.inventory_item_id
            ).first()
            
            if inventory_item:
                if operation == "deduct":
                    inventory_item.stock_quantity -= item_data.quantity
                elif operation == "restore":
                    inventory_item.stock_quantity += item_data.quantity
                
                db.add(inventory_item)
                
                # Create inventory movement record
                movement = models.InventoryMovement(
                    inventory_item_id=inventory_item.id,
                    movement_type="out" if operation == "deduct" else "in",
                    quantity_change=-item_data.quantity if operation == "deduct" else item_data.quantity,
                    quantity_before=inventory_item.stock_quantity + (item_data.quantity if operation == "deduct" else -item_data.quantity),
                    quantity_after=inventory_item.stock_quantity,
                    unit_of_measure=inventory_item.unit_of_measure,
                    reference_type="invoice",
                    reason=f"Invoice {'creation' if operation == 'deduct' else 'deletion/void'}",
                    status="completed"
                )
                db.add(movement)

def create_qr_code_and_card(invoice: models.UniversalInvoice, db: Session) -> models.QRInvoiceCard:
    """Create QR code and card for invoice"""
    # Generate unique QR code
    qr_code_data = f"invoice:{invoice.id}"
    card_url = f"/invoice-card/{invoice.id}"
    
    # Generate QR code image (base64)
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(card_url)
    qr.make(fit=True)
    
    # Create card data snapshot
    card_data = {
        "invoice_number": invoice.invoice_number,
        "invoice_type": invoice.type,
        "customer_name": invoice.customer_name,
        "total_amount": float(invoice.total_amount),
        "currency": invoice.currency,
        "created_at": invoice.created_at.isoformat(),
        "items": [],
        "gold_fields": {}
    }
    
    # Add gold-specific fields if applicable
    if invoice.type == "gold":
        card_data["gold_fields"] = {
            "gold_sood": float(invoice.gold_sood) if invoice.gold_sood else 0,
            "gold_ojrat": float(invoice.gold_ojrat) if invoice.gold_ojrat else 0,
            "gold_maliyat": float(invoice.gold_maliyat) if invoice.gold_maliyat else 0,
            "gold_total_weight": float(invoice.gold_total_weight) if invoice.gold_total_weight else 0
        }
    
    # Add items data
    for item in invoice.invoice_items:
        item_data = {
            "name": item.item_name,
            "quantity": float(item.quantity),
            "unit_price": float(item.unit_price),
            "total_price": float(item.total_price),
            "images": item.item_images or []
        }
        card_data["items"].append(item_data)
    
    # Create QR card record
    qr_card = models.QRInvoiceCard(
        invoice_id=invoice.id,
        qr_code=qr_code_data,
        card_url=card_url,
        theme=invoice.card_theme,
        card_data=card_data,
        is_public=True,
        is_active=True
    )
    
    db.add(qr_card)
    
    # Update invoice with QR information
    invoice.qr_code = qr_code_data
    invoice.card_url = card_url
    db.add(invoice)
    
    return qr_card

def validate_invoice_business_rules(invoice_data: schemas.UniversalInvoiceCreate) -> None:
    """Validate business rules for invoice creation"""
    # Validate invoice type and gold fields consistency
    if invoice_data.type == "gold" and not invoice_data.gold_fields:
        raise HTTPException(
            status_code=400,
            detail="Gold fields are required for gold invoices"
        )
    
    if invoice_data.type == "general" and invoice_data.gold_fields:
        raise HTTPException(
            status_code=400,
            detail="Gold fields should not be provided for general invoices"
        )
    
    # Validate items
    if not invoice_data.items:
        raise HTTPException(
            status_code=400,
            detail="Invoice must have at least one item"
        )
    
    # Validate gold invoice items have weight
    if invoice_data.type == "gold":
        for item in invoice_data.items:
            if not item.weight_grams or item.weight_grams <= 0:
                raise HTTPException(
                    status_code=400,
                    detail=f"Gold invoice items must have weight specified: {item.item_name}"
                )

@router.post("/calculate", response_model=schemas.InvoiceCalculationSummary)
def calculate_invoice_preview(
    invoice_data: schemas.UniversalInvoiceCreate,
    db: Session = Depends(get_db)
):
    """Calculate invoice totals without creating the invoice"""
    validate_invoice_business_rules(invoice_data)
    
    if invoice_data.type == "gold":
        return calculate_gold_invoice_totals(invoice_data.items, invoice_data.gold_fields, db)
    else:
        return calculate_general_invoice_totals(invoice_data.items, db)

@router.post("/", response_model=schemas.UniversalInvoiceWithDetails)
def create_invoice(
    invoice_data: schemas.UniversalInvoiceCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create a new universal invoice (Gold or General)"""
    try:
        # Validate business rules
        validate_invoice_business_rules(invoice_data)
        
        # Calculate totals
        if invoice_data.type == "gold":
            calculation_summary = calculate_gold_invoice_totals(invoice_data.items, invoice_data.gold_fields, db)
        else:
            calculation_summary = calculate_general_invoice_totals(invoice_data.items, db)
        
        # Create invoice
        invoice = models.UniversalInvoice(
            invoice_number=generate_invoice_number(db, invoice_data.type),
            type=invoice_data.type,
            status="draft",
            workflow_stage="draft",
            customer_id=invoice_data.customer_id,
            customer_name=invoice_data.customer_name,
            customer_phone=invoice_data.customer_phone,
            customer_address=invoice_data.customer_address,
            customer_email=invoice_data.customer_email,
            subtotal=calculation_summary.subtotal,
            tax_amount=calculation_summary.tax_amount,
            discount_amount=calculation_summary.discount_amount,
            total_amount=calculation_summary.grand_total,
            paid_amount=Decimal('0'),
            remaining_amount=calculation_summary.grand_total,
            currency=invoice_data.currency,
            payment_status="unpaid",
            stock_affected=False,
            requires_approval=invoice_data.requires_approval,
            approval_notes=invoice_data.approval_notes,
            notes=invoice_data.notes,
            invoice_metadata=invoice_data.invoice_metadata,
            card_theme=invoice_data.card_theme,
            card_config=invoice_data.card_config,
            created_by=current_user.id
        )
        
        # Add gold-specific fields if applicable
        if invoice_data.type == "gold" and invoice_data.gold_fields:
            invoice.gold_price_per_gram = invoice_data.gold_fields.gold_price_per_gram
            invoice.labor_cost_percentage = invoice_data.gold_fields.labor_cost_percentage
            invoice.profit_percentage = invoice_data.gold_fields.profit_percentage
            invoice.vat_percentage = invoice_data.gold_fields.vat_percentage
            invoice.gold_sood = invoice_data.gold_fields.gold_sood
            invoice.gold_ojrat = invoice_data.gold_fields.gold_ojrat
            invoice.gold_maliyat = invoice_data.gold_fields.gold_maliyat
            
            # Calculate total weight
            total_weight = sum(
                (item.weight_grams or Decimal('0')) * item.quantity 
                for item in invoice_data.items
            )
            invoice.gold_total_weight = total_weight
        
        db.add(invoice)
        db.flush()  # Get invoice ID
        
        # Create invoice items
        for i, item_data in enumerate(invoice_data.items):
            calculation = calculation_summary.items[i]
            
            # Get inventory item details for snapshot
            inventory_item = None
            if item_data.inventory_item_id:
                inventory_item = db.query(models.UniversalInventoryItem).filter(
                    models.UniversalInventoryItem.id == item_data.inventory_item_id
                ).first()
            
            invoice_item = models.UniversalInvoiceItem(
                invoice_id=invoice.id,
                inventory_item_id=item_data.inventory_item_id,
                item_name=item_data.item_name,
                item_sku=item_data.item_sku or (inventory_item.sku if inventory_item else generate_sku()),
                item_description=item_data.item_description or (inventory_item.description if inventory_item else ""),
                quantity=item_data.quantity,
                unit_price=calculation.unit_price,
                total_price=calculation.total_price,
                unit_of_measure=item_data.unit_of_measure,
                weight_grams=item_data.weight_grams,
                custom_attributes=item_data.custom_attributes,
                item_images=item_data.item_images,
                gold_specific=item_data.gold_specific
            )
            db.add(invoice_item)
        
        # If not requiring approval, automatically approve and affect stock
        if not invoice_data.requires_approval:
            invoice.status = "approved"
            invoice.workflow_stage = "approved"
            invoice.approved_by = current_user.id
            invoice.approved_at = datetime.now()
            invoice.stock_affected = True
            
            # Update inventory stock
            update_inventory_stock(db, invoice_data.items, "deduct")
        
        db.flush()  # Ensure invoice_items are available
        
        # Create QR code and card
        qr_card = create_qr_code_and_card(invoice, db)
        
        db.commit()
        
        # Return invoice with details
        return get_invoice_with_details(invoice.id, db)
        
    except Exception as e:
        db.rollback()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Error creating invoice: {str(e)}")

def get_invoice_with_details(invoice_id: UUID, db: Session) -> schemas.UniversalInvoiceWithDetails:
    """Get invoice with all related details"""
    invoice = db.query(models.UniversalInvoice).options(
        joinedload(models.UniversalInvoice.invoice_items),
        joinedload(models.UniversalInvoice.qr_card)
    ).filter(models.UniversalInvoice.id == invoice_id).first()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    return invoice

@router.get("/{invoice_id}", response_model=schemas.UniversalInvoiceWithDetails)
def get_invoice(invoice_id: UUID, db: Session = Depends(get_db)):
    """Get invoice by ID with all details"""
    return get_invoice_with_details(invoice_id, db)

@router.get("/", response_model=schemas.InvoicesResponse)
def list_invoices(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    filters: schemas.InvoiceSearchFilters = Depends(),
    db: Session = Depends(get_db)
):
    """List invoices with comprehensive filtering options"""
    query = db.query(models.UniversalInvoice)
    
    # Apply filters
    if filters.search:
        search_term = f"%{filters.search}%"
        query = query.filter(
            or_(
                models.UniversalInvoice.invoice_number.ilike(search_term),
                models.UniversalInvoice.customer_name.ilike(search_term),
                models.UniversalInvoice.customer_phone.ilike(search_term)
            )
        )
    
    if filters.type:
        query = query.filter(models.UniversalInvoice.type == filters.type)
    
    if filters.status:
        query = query.filter(models.UniversalInvoice.status == filters.status)
    
    if filters.workflow_stage:
        query = query.filter(models.UniversalInvoice.workflow_stage == filters.workflow_stage)
    
    if filters.payment_status:
        query = query.filter(models.UniversalInvoice.payment_status == filters.payment_status)
    
    if filters.customer_id:
        query = query.filter(models.UniversalInvoice.customer_id == filters.customer_id)
    
    if filters.created_after:
        query = query.filter(models.UniversalInvoice.created_at >= filters.created_after)
    
    if filters.created_before:
        query = query.filter(models.UniversalInvoice.created_at <= filters.created_before)
    
    if filters.min_amount:
        query = query.filter(models.UniversalInvoice.total_amount >= filters.min_amount)
    
    if filters.max_amount:
        query = query.filter(models.UniversalInvoice.total_amount <= filters.max_amount)
    
    if filters.has_remaining_amount is not None:
        if filters.has_remaining_amount:
            query = query.filter(models.UniversalInvoice.remaining_amount > 0)
        else:
            query = query.filter(models.UniversalInvoice.remaining_amount == 0)
    
    if filters.approved_by:
        query = query.filter(models.UniversalInvoice.approved_by == filters.approved_by)
    
    # Apply sorting
    if filters.sort_by == "created_at":
        sort_column = models.UniversalInvoice.created_at
    elif filters.sort_by == "total_amount":
        sort_column = models.UniversalInvoice.total_amount
    elif filters.sort_by == "invoice_number":
        sort_column = models.UniversalInvoice.invoice_number
    else:
        sort_column = models.UniversalInvoice.created_at
    
    if filters.sort_order == "desc":
        query = query.order_by(desc(sort_column))
    else:
        query = query.order_by(sort_column)
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    invoices = query.offset(skip).limit(limit).all()
    
    return schemas.InvoicesResponse(
        items=invoices,
        total=total,
        page=skip // limit + 1,
        per_page=limit,
        total_pages=(total + limit - 1) // limit,
        has_next=skip + limit < total,
        has_prev=skip > 0
    )

@router.put("/{invoice_id}/approve", response_model=schemas.UniversalInvoiceWithDetails)
def approve_invoice(
    invoice_id: UUID,
    approval_request: schemas.InvoiceApprovalRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Approve invoice and affect inventory stock"""
    try:
        invoice = db.query(models.UniversalInvoice).filter(
            models.UniversalInvoice.id == invoice_id
        ).first()
        
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        if invoice.status != "draft":
            raise HTTPException(
                status_code=400,
                detail="Only draft invoices can be approved"
            )
        
        # Update invoice status
        invoice.status = "approved"
        invoice.workflow_stage = "approved"
        invoice.approved_by = current_user.id
        invoice.approved_at = datetime.now()
        invoice.approval_notes = approval_request.approval_notes
        
        # Affect inventory stock if not already affected
        if not invoice.stock_affected:
            # Reconstruct items for stock update
            items_for_stock = []
            for item in invoice.invoice_items:
                if item.inventory_item_id:
                    item_data = schemas.UniversalInvoiceItemCreate(
                        inventory_item_id=item.inventory_item_id,
                        item_name=item.item_name,
                        quantity=item.quantity,
                        unit_price=item.unit_price,
                        weight_grams=item.weight_grams
                    )
                    items_for_stock.append(item_data)
            
            update_inventory_stock(db, items_for_stock, "deduct")
            invoice.stock_affected = True
        
        db.add(invoice)
        db.commit()
        
        return get_invoice_with_details(invoice_id, db)
        
    except Exception as e:
        db.rollback()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Error approving invoice: {str(e)}")

@router.put("/{invoice_id}/status", response_model=schemas.UniversalInvoice)
def update_invoice_status(
    invoice_id: UUID,
    status_update: schemas.InvoiceStatusUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update invoice status"""
    invoice = db.query(models.UniversalInvoice).filter(
        models.UniversalInvoice.id == invoice_id
    ).first()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Validate status transition
    if status_update.status == "cancelled" and invoice.stock_affected:
        # Restore inventory stock
        items_for_stock = []
        for item in invoice.invoice_items:
            if item.inventory_item_id:
                item_data = schemas.UniversalInvoiceItemCreate(
                    inventory_item_id=item.inventory_item_id,
                    item_name=item.item_name,
                    quantity=item.quantity,
                    unit_price=item.unit_price,
                    weight_grams=item.weight_grams
                )
                items_for_stock.append(item_data)
        
        update_inventory_stock(db, items_for_stock, "restore")
        invoice.stock_affected = False
    
    invoice.status = status_update.status
    invoice.updated_by = current_user.id
    
    if status_update.notes:
        invoice.notes = (invoice.notes or "") + f"\nStatus update: {status_update.notes}"
    
    db.add(invoice)
    db.commit()
    
    return invoice

@router.post("/{invoice_id}/payments", response_model=schemas.InvoicePayment)
def add_invoice_payment(
    invoice_id: UUID,
    payment_data: schemas.InvoicePaymentRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Add payment to invoice and update payment status"""
    try:
        invoice = db.query(models.UniversalInvoice).filter(
            models.UniversalInvoice.id == invoice_id
        ).first()
        
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        # Validate payment amount
        if payment_data.amount <= 0:
            raise HTTPException(status_code=400, detail="Payment amount must be positive")
        
        if payment_data.amount > invoice.remaining_amount:
            raise HTTPException(
                status_code=400,
                detail=f"Payment amount ({payment_data.amount}) exceeds remaining amount ({invoice.remaining_amount})"
            )
        
        # Update invoice amounts
        invoice.paid_amount += payment_data.amount
        invoice.remaining_amount -= payment_data.amount
        
        # Update payment status
        if invoice.remaining_amount == 0:
            invoice.payment_status = "paid"
            invoice.status = "paid"
        elif invoice.paid_amount > 0:
            invoice.payment_status = "partially_paid"
            invoice.status = "partially_paid"
        
        invoice.payment_method = payment_data.payment_method
        invoice.payment_date = payment_data.payment_date or datetime.now()
        
        db.add(invoice)
        db.commit()
        
        # Return payment record (simplified for this implementation)
        return schemas.InvoicePayment(
            id=uuid.uuid4(),
            invoice_id=invoice_id,
            customer_id=invoice.customer_id,
            amount=payment_data.amount,
            payment_method=payment_data.payment_method,
            description=payment_data.description,
            payment_date=invoice.payment_date,
            created_at=datetime.now()
        )
        
    except Exception as e:
        db.rollback()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Error processing payment: {str(e)}")

@router.put("/{invoice_id}/items/{item_id}/price-override", response_model=schemas.PriceOverrideResponse)
def override_item_price(
    invoice_id: UUID,
    item_id: UUID,
    price_override: schemas.PriceOverrideRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Override unit price for specific invoice item"""
    try:
        invoice = db.query(models.UniversalInvoice).filter(
            models.UniversalInvoice.id == invoice_id
        ).first()
        
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        if invoice.status != "draft":
            raise HTTPException(
                status_code=400,
                detail="Can only override prices for draft invoices"
            )
        
        invoice_item = db.query(models.UniversalInvoiceItem).filter(
            and_(
                models.UniversalInvoiceItem.invoice_id == invoice_id,
                models.UniversalInvoiceItem.id == item_id
            )
        ).first()
        
        if not invoice_item:
            raise HTTPException(status_code=404, detail="Invoice item not found")
        
        # Store original price
        original_price = invoice_item.unit_price
        
        # Update item price
        invoice_item.unit_price = price_override.override_price
        invoice_item.total_price = price_override.override_price * invoice_item.quantity
        
        # Recalculate invoice totals
        total_amount = sum(item.total_price for item in invoice.invoice_items)
        invoice.subtotal = total_amount
        invoice.total_amount = total_amount
        invoice.remaining_amount = total_amount - invoice.paid_amount
        
        db.add(invoice_item)
        db.add(invoice)
        db.commit()
        
        return schemas.PriceOverrideResponse(
            item_id=item_id,
            original_price=original_price,
            override_price=price_override.override_price,
            price_difference=price_override.override_price - original_price,
            reason=price_override.reason,
            applied_at=datetime.now()
        )
        
    except Exception as e:
        db.rollback()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Error overriding price: {str(e)}")

@router.delete("/{invoice_id}")
def delete_invoice(
    invoice_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete invoice and restore inventory stock if affected"""
    try:
        invoice = db.query(models.UniversalInvoice).filter(
            models.UniversalInvoice.id == invoice_id
        ).first()
        
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        # Check if invoice has payments
        if invoice.paid_amount > 0:
            raise HTTPException(
                status_code=400,
                detail="Cannot delete invoice with payments. Cancel or void instead."
            )
        
        # Restore inventory stock if affected
        if invoice.stock_affected:
            items_for_stock = []
            for item in invoice.invoice_items:
                if item.inventory_item_id:
                    item_data = schemas.UniversalInvoiceItemCreate(
                        inventory_item_id=item.inventory_item_id,
                        item_name=item.item_name,
                        quantity=item.quantity,
                        unit_price=item.unit_price,
                        weight_grams=item.weight_grams
                    )
                    items_for_stock.append(item_data)
            
            update_inventory_stock(db, items_for_stock, "restore")
        
        # Delete related records (cascade should handle this, but being explicit)
        db.query(models.UniversalInvoiceItem).filter(
            models.UniversalInvoiceItem.invoice_id == invoice_id
        ).delete()
        
        db.query(models.QRInvoiceCard).filter(
            models.QRInvoiceCard.invoice_id == invoice_id
        ).delete()
        
        # Delete invoice
        db.delete(invoice)
        db.commit()
        
        return {"message": "Invoice deleted successfully"}
        
    except Exception as e:
        db.rollback()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Error deleting invoice: {str(e)}")

@router.get("/analytics/summary", response_model=schemas.InvoiceAnalytics)
def get_invoice_analytics(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    db: Session = Depends(get_db)
):
    """Get comprehensive invoice analytics"""
    query = db.query(models.UniversalInvoice)
    
    if start_date:
        query = query.filter(models.UniversalInvoice.created_at >= start_date)
    if end_date:
        query = query.filter(models.UniversalInvoice.created_at <= end_date)
    
    invoices = query.all()
    
    total_invoices = len(invoices)
    total_amount = sum(inv.total_amount for inv in invoices)
    total_paid = sum(inv.paid_amount for inv in invoices)
    total_outstanding = sum(inv.remaining_amount for inv in invoices)
    
    gold_invoices = [inv for inv in invoices if inv.type == "gold"]
    general_invoices = [inv for inv in invoices if inv.type == "general"]
    
    status_breakdown = {}
    payment_status_breakdown = {}
    
    for invoice in invoices:
        status_breakdown[invoice.status] = status_breakdown.get(invoice.status, 0) + 1
        payment_status_breakdown[invoice.payment_status] = payment_status_breakdown.get(invoice.payment_status, 0) + 1
    
    return schemas.InvoiceAnalytics(
        total_invoices=total_invoices,
        total_amount=total_amount,
        total_paid=total_paid,
        total_outstanding=total_outstanding,
        gold_invoices_count=len(gold_invoices),
        general_invoices_count=len(general_invoices),
        average_invoice_amount=total_amount / total_invoices if total_invoices > 0 else Decimal('0'),
        status_breakdown=status_breakdown,
        payment_status_breakdown=payment_status_breakdown,
        monthly_trends=[]  # Could be implemented with more complex query
    )

@router.get("/{invoice_id}/qr-card", response_model=schemas.QRInvoiceCard)
def get_invoice_qr_card(invoice_id: UUID, db: Session = Depends(get_db)):
    """Get QR card for invoice"""
    qr_card = db.query(models.QRInvoiceCard).filter(
        models.QRInvoiceCard.invoice_id == invoice_id
    ).first()
    
    if not qr_card:
        raise HTTPException(status_code=404, detail="QR card not found for this invoice")
    
    return qr_card

@router.post("/bulk/approve", response_model=List[schemas.UniversalInvoice])
def bulk_approve_invoices(
    bulk_approval: schemas.BulkInvoiceApproval,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Bulk approve multiple invoices"""
    try:
        invoices = db.query(models.UniversalInvoice).filter(
            models.UniversalInvoice.id.in_(bulk_approval.invoice_ids)
        ).all()
        
        if len(invoices) != len(bulk_approval.invoice_ids):
            raise HTTPException(status_code=404, detail="Some invoices not found")
        
        approved_invoices = []
        
        for invoice in invoices:
            if invoice.status == "draft":
                invoice.status = "approved"
                invoice.workflow_stage = "approved"
                invoice.approved_by = current_user.id
                invoice.approved_at = datetime.now()
                invoice.approval_notes = bulk_approval.approval_notes
                
                # Affect inventory stock if not already affected
                if not invoice.stock_affected:
                    items_for_stock = []
                    for item in invoice.invoice_items:
                        if item.inventory_item_id:
                            item_data = schemas.UniversalInvoiceItemCreate(
                                inventory_item_id=item.inventory_item_id,
                                item_name=item.item_name,
                                quantity=item.quantity,
                                unit_price=item.unit_price,
                                weight_grams=item.weight_grams
                            )
                            items_for_stock.append(item_data)
                    
                    update_inventory_stock(db, items_for_stock, "deduct")
                    invoice.stock_affected = True
                
                db.add(invoice)
                approved_invoices.append(invoice)
        
        db.commit()
        return approved_invoices
        
    except Exception as e:
        db.rollback()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Error bulk approving invoices: {str(e)}")