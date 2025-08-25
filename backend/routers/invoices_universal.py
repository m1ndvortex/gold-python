"""
Enhanced Invoice Router with Flexible Workflows
Supports universal business types, approval workflows, and comprehensive invoice management
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, desc, func, text
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime, timedelta
import uuid

from database import get_db
from auth import get_current_user
from models_universal import (
    Invoice, InvoiceItem, Customer, InventoryItem, User, 
    Payment, PaymentMethod, AuditLog, BusinessConfiguration
)
from schemas_invoice_universal import (
    InvoiceCreate, InvoiceUpdate, Invoice as InvoiceSchema, InvoiceWithDetails,
    InvoiceCalculationRequest, InvoicePreview, InvoicePricingCalculation,
    PaymentCreate, Payment as PaymentSchema, PaymentWithDetails,
    WorkflowTransition, ApprovalRequest, InvoiceSearchFilters, InvoiceListResponse,
    InvoiceSummaryStats, InvoiceAnalytics, BulkInvoiceAction, BulkInvoiceResult,
    WorkflowStage, InvoiceType, BusinessType
)
from services.invoice_service import InvoiceService

router = APIRouter(
    prefix="/invoices",
    tags=["invoices"],
    dependencies=[Depends(get_current_user)]
)

def get_invoice_service(db: Session = Depends(get_db)) -> InvoiceService:
    """Get invoice service instance"""
    return InvoiceService(db)

@router.post("/calculate", response_model=InvoicePreview)
def calculate_invoice_preview(
    calculation_request: InvoiceCalculationRequest,
    invoice_service: InvoiceService = Depends(get_invoice_service),
    current_user: User = Depends(get_current_user)
):
    """Calculate invoice totals and preview without creating the invoice"""
    try:
        # Convert request to dict for service
        invoice_data = calculation_request.dict()
        
        # Calculate totals
        calculation_summary = invoice_service.calculate_invoice_totals(invoice_data)
        
        # Get workflow information
        workflow_def = invoice_service.workflow_engine.get_workflow_definition(
            calculation_request.business_type.value,
            "standard"
        )
        
        # Get business type information
        business_config = invoice_service._get_business_configuration(calculation_request.business_type.value)
        
        # Check for validation warnings
        warnings = []
        for item_calc in calculation_summary["items"]:
            if item_calc.get("margin", 0) < 0:
                warnings.append(f"Negative margin for item: {item_calc['item_name']}")
        
        return InvoicePreview(
            calculation=InvoicePricingCalculation(**calculation_summary),
            workflow_info={
                "stages": workflow_def["stages"],
                "requires_approval": invoice_service._requires_approval(
                    calculation_summary["grand_total"], 
                    calculation_request.business_type.value
                )
            },
            business_type_info=business_config,
            validation_warnings=warnings
        )
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Error calculating invoice: {str(e)}")

@router.post("/", response_model=InvoiceWithDetails)
def create_invoice(
    invoice_data: InvoiceCreate,
    invoice_service: InvoiceService = Depends(get_invoice_service),
    current_user: User = Depends(get_current_user)
):
    """Create a new invoice with workflow support"""
    try:
        # Convert to dict and add user context
        invoice_dict = invoice_data.dict()
        
        # Create invoice
        invoice = invoice_service.create_invoice(invoice_dict, current_user)
        
        # Return with details
        return invoice_service._get_invoice_with_details(invoice.id)
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Error creating invoice: {str(e)}")

@router.get("/{invoice_id}", response_model=InvoiceWithDetails)
def get_invoice(
    invoice_id: UUID,
    invoice_service: InvoiceService = Depends(get_invoice_service),
    current_user: User = Depends(get_current_user)
):
    """Get invoice by ID with all details"""
    return invoice_service._get_invoice_with_details(invoice_id)

@router.put("/{invoice_id}", response_model=InvoiceWithDetails)
def update_invoice(
    invoice_id: UUID,
    invoice_update: InvoiceUpdate,
    invoice_service: InvoiceService = Depends(get_invoice_service),
    current_user: User = Depends(get_current_user)
):
    """Update invoice (only allowed in draft stage)"""
    try:
        invoice = invoice_service._get_invoice_with_details(invoice_id)
        
        # Check if invoice can be edited
        if invoice.workflow_stage != WorkflowStage.DRAFT:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot edit invoice in {invoice.workflow_stage} stage"
            )
        
        # Update allowed fields
        update_data = invoice_update.dict(exclude_unset=True)
        
        for field, value in update_data.items():
            if field != "items":  # Handle items separately
                setattr(invoice, field, value)
        
        # Handle item updates if provided
        if invoice_update.items is not None:
            # This would require more complex logic to update items
            # For now, we'll require recreation of the invoice for item changes
            raise HTTPException(
                status_code=400,
                detail="Item updates not supported. Please create a new invoice."
            )
        
        invoice_service.db.add(invoice)
        invoice_service._log_invoice_action(invoice, "updated", current_user)
        invoice_service.db.commit()
        
        return invoice_service._get_invoice_with_details(invoice_id)
        
    except Exception as e:
        invoice_service.db.rollback()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Error updating invoice: {str(e)}")

@router.post("/{invoice_id}/workflow/transition", response_model=InvoiceWithDetails)
def transition_invoice_workflow(
    invoice_id: UUID,
    transition: WorkflowTransition,
    invoice_service: InvoiceService = Depends(get_invoice_service),
    current_user: User = Depends(get_current_user)
):
    """Transition invoice to different workflow stage"""
    try:
        invoice = invoice_service._get_invoice_with_details(invoice_id)
        
        # Execute transition
        invoice_service.workflow_engine.transition_invoice(
            invoice, 
            transition.target_stage.value, 
            current_user, 
            transition.notes
        )
        
        # Handle stage-specific actions
        if transition.target_stage == WorkflowStage.APPROVED:
            # Apply stock impact and create accounting entries
            invoice_service._apply_stock_impact(invoice, "deduct")
            invoice_service._create_accounting_entries(invoice)
            invoice_service._update_customer_debt(invoice.customer_id, invoice.total_amount)
        
        elif transition.target_stage == WorkflowStage.CANCELLED:
            # Restore stock if it was impacted
            if invoice.workflow_stage in [WorkflowStage.APPROVED, WorkflowStage.PAID]:
                invoice_service._apply_stock_impact(invoice, "restore")
                invoice_service._update_customer_debt(invoice.customer_id, -invoice.total_amount)
        
        invoice_service.db.commit()
        return invoice_service._get_invoice_with_details(invoice_id)
        
    except Exception as e:
        invoice_service.db.rollback()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Error transitioning invoice: {str(e)}")

@router.post("/{invoice_id}/approve", response_model=InvoiceWithDetails)
def approve_invoice(
    invoice_id: UUID,
    approval: ApprovalRequest,
    invoice_service: InvoiceService = Depends(get_invoice_service),
    current_user: User = Depends(get_current_user)
):
    """Approve invoice (convenience endpoint)"""
    if approval.approved:
        return invoice_service.approve_invoice(invoice_id, current_user, approval.notes)
    else:
        # Reject - transition back to draft
        transition = WorkflowTransition(target_stage=WorkflowStage.DRAFT, notes=approval.notes)
        return transition_invoice_workflow(invoice_id, transition, invoice_service, current_user)

@router.post("/{invoice_id}/void", response_model=InvoiceWithDetails)
def void_invoice(
    invoice_id: UUID,
    reason: str = Query(..., description="Reason for voiding"),
    invoice_service: InvoiceService = Depends(get_invoice_service),
    current_user: User = Depends(get_current_user)
):
    """Void invoice and restore stock"""
    return invoice_service.void_invoice(invoice_id, current_user, reason)

@router.post("/{invoice_id}/payments", response_model=PaymentWithDetails)
def add_invoice_payment(
    invoice_id: UUID,
    payment_data: PaymentCreate,
    invoice_service: InvoiceService = Depends(get_invoice_service),
    current_user: User = Depends(get_current_user)
):
    """Add payment to invoice"""
    payment_dict = payment_data.dict()
    return invoice_service.add_payment(invoice_id, payment_dict, current_user)

@router.get("/{invoice_id}/payments", response_model=List[PaymentWithDetails])
def get_invoice_payments(
    invoice_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all payments for an invoice"""
    payments = db.query(Payment).options(
        joinedload(Payment.customer),
        joinedload(Payment.payment_method_rel)
    ).filter(Payment.invoice_id == invoice_id).all()
    
    return payments

@router.get("/", response_model=InvoiceListResponse)
def list_invoices(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    filters: InvoiceSearchFilters = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List invoices with comprehensive filtering"""
    query = db.query(Invoice).options(
        joinedload(Invoice.customer)
    )
    
    # Apply filters
    if filters.customer_id:
        query = query.filter(Invoice.customer_id == filters.customer_id)
    
    if filters.invoice_type:
        query = query.filter(Invoice.invoice_type == filters.invoice_type.value)
    
    if filters.workflow_stage:
        query = query.filter(Invoice.workflow_stage == filters.workflow_stage.value)
    
    if filters.business_type:
        query = query.filter(
            Invoice.business_type_fields['business_type'].astext == filters.business_type.value
        )
    
    if filters.status:  # Legacy status field
        query = query.filter(Invoice.status == filters.status)
    
    if filters.invoice_number:
        query = query.filter(Invoice.invoice_number.ilike(f"%{filters.invoice_number}%"))
    
    if filters.created_after:
        query = query.filter(Invoice.created_at >= filters.created_after)
    
    if filters.created_before:
        query = query.filter(Invoice.created_at <= filters.created_before)
    
    if filters.due_after:
        query = query.filter(Invoice.due_date >= filters.due_after)
    
    if filters.due_before:
        query = query.filter(Invoice.due_date <= filters.due_before)
    
    if filters.min_amount is not None:
        query = query.filter(Invoice.total_amount >= filters.min_amount)
    
    if filters.max_amount is not None:
        query = query.filter(Invoice.total_amount <= filters.max_amount)
    
    if filters.has_remaining_amount is not None:
        if filters.has_remaining_amount:
            query = query.filter(Invoice.remaining_amount > 0)
        else:
            query = query.filter(Invoice.remaining_amount == 0)
    
    if filters.approval_required is not None:
        query = query.filter(Invoice.approval_required == filters.approval_required)
    
    if filters.approved_by:
        query = query.filter(Invoice.approved_by == filters.approved_by)
    
    # Get total count
    total = query.count()
    
    # Apply pagination and ordering
    invoices = query.order_by(desc(Invoice.created_at)).offset(skip).limit(limit).all()
    
    # Calculate pagination info
    total_pages = (total + limit - 1) // limit
    page = (skip // limit) + 1
    
    return InvoiceListResponse(
        invoices=invoices,
        total=total,
        page=page,
        per_page=limit,
        total_pages=total_pages,
        filters_applied=filters
    )

@router.get("/reports/summary", response_model=InvoiceSummaryStats)
def get_invoice_summary(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    business_type: Optional[BusinessType] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get invoice summary statistics"""
    query = db.query(Invoice)
    
    # Apply date filters
    if start_date:
        query = query.filter(Invoice.created_at >= start_date)
    if end_date:
        query = query.filter(Invoice.created_at <= end_date)
    
    # Apply business type filter
    if business_type:
        query = query.filter(
            Invoice.business_type_fields['business_type'].astext == business_type.value
        )
    
    invoices = query.all()
    
    # Calculate summary statistics
    total_invoices = len(invoices)
    total_amount = sum(inv.total_amount for inv in invoices)
    total_paid = sum(inv.paid_amount for inv in invoices)
    total_remaining = sum(inv.remaining_amount for inv in invoices)
    average_invoice_amount = total_amount / total_invoices if total_invoices > 0 else 0
    
    # Workflow breakdown
    workflow_breakdown = {}
    for stage in WorkflowStage:
        workflow_breakdown[stage] = len([inv for inv in invoices if inv.workflow_stage == stage.value])
    
    # Business type breakdown
    business_type_breakdown = {}
    for inv in invoices:
        bt = inv.business_type_fields.get('business_type', 'unknown') if inv.business_type_fields else 'unknown'
        if bt not in business_type_breakdown:
            business_type_breakdown[bt] = {
                'count': 0,
                'total_amount': 0,
                'avg_amount': 0
            }
        business_type_breakdown[bt]['count'] += 1
        business_type_breakdown[bt]['total_amount'] += float(inv.total_amount)
    
    # Calculate averages
    for bt_data in business_type_breakdown.values():
        if bt_data['count'] > 0:
            bt_data['avg_amount'] = bt_data['total_amount'] / bt_data['count']
    
    return InvoiceSummaryStats(
        total_invoices=total_invoices,
        total_amount=total_amount,
        total_paid=total_paid,
        total_remaining=total_remaining,
        average_invoice_amount=average_invoice_amount,
        workflow_breakdown=workflow_breakdown,
        business_type_breakdown=business_type_breakdown,
        period_start=start_date,
        period_end=end_date
    )

@router.get("/reports/analytics", response_model=InvoiceAnalytics)
def get_invoice_analytics(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    business_type: Optional[BusinessType] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get comprehensive invoice analytics"""
    # Get summary stats
    summary = get_invoice_summary(start_date, end_date, business_type, db, current_user)
    
    # Get additional analytics
    query = db.query(Invoice).options(joinedload(Invoice.customer))
    
    if start_date:
        query = query.filter(Invoice.created_at >= start_date)
    if end_date:
        query = query.filter(Invoice.created_at <= end_date)
    if business_type:
        query = query.filter(
            Invoice.business_type_fields['business_type'].astext == business_type.value
        )
    
    invoices = query.all()
    
    # Calculate trends (simplified)
    trends = {
        "daily_average": float(summary.total_amount) / 30 if summary.total_amount > 0 else 0,
        "growth_rate": 0,  # Would need historical data
        "seasonal_patterns": {}
    }
    
    # Top customers by invoice value
    customer_totals = {}
    for inv in invoices:
        customer_id = str(inv.customer_id)
        if customer_id not in customer_totals:
            customer_totals[customer_id] = {
                'customer_name': inv.customer.name if inv.customer else 'Unknown',
                'total_amount': 0,
                'invoice_count': 0
            }
        customer_totals[customer_id]['total_amount'] += float(inv.total_amount)
        customer_totals[customer_id]['invoice_count'] += 1
    
    top_customers = sorted(
        customer_totals.values(),
        key=lambda x: x['total_amount'],
        reverse=True
    )[:10]
    
    # Payment method breakdown
    payment_query = db.query(Payment).join(Invoice)
    if start_date:
        payment_query = payment_query.filter(Invoice.created_at >= start_date)
    if end_date:
        payment_query = payment_query.filter(Invoice.created_at <= end_date)
    
    payments = payment_query.all()
    payment_method_breakdown = {}
    for payment in payments:
        method = payment.payment_method
        if method not in payment_method_breakdown:
            payment_method_breakdown[method] = {'count': 0, 'total_amount': 0}
        payment_method_breakdown[method]['count'] += 1
        payment_method_breakdown[method]['total_amount'] += float(payment.amount)
    
    # Profitability analysis (simplified)
    total_cost = 0
    total_revenue = float(summary.total_amount)
    
    for inv in invoices:
        for item in inv.invoice_items:
            if item.inventory_item and item.inventory_item.cost_price:
                total_cost += float(item.inventory_item.cost_price * item.quantity)
    
    gross_profit = total_revenue - total_cost
    profit_margin = (gross_profit / total_revenue * 100) if total_revenue > 0 else 0
    
    profitability_analysis = {
        "total_revenue": total_revenue,
        "total_cost": total_cost,
        "gross_profit": gross_profit,
        "profit_margin": profit_margin
    }
    
    return InvoiceAnalytics(
        summary=summary,
        trends=trends,
        top_customers=top_customers,
        payment_method_breakdown=payment_method_breakdown,
        profitability_analysis=profitability_analysis
    )

@router.post("/bulk-actions", response_model=BulkInvoiceResult)
def execute_bulk_invoice_action(
    bulk_action: BulkInvoiceAction,
    invoice_service: InvoiceService = Depends(get_invoice_service),
    current_user: User = Depends(get_current_user)
):
    """Execute bulk actions on multiple invoices"""
    results = []
    errors = []
    successful = 0
    
    for invoice_id in bulk_action.invoice_ids:
        try:
            if bulk_action.action == "approve":
                invoice_service.approve_invoice(invoice_id, current_user)
                results.append({"invoice_id": invoice_id, "status": "approved"})
                successful += 1
                
            elif bulk_action.action == "void":
                reason = bulk_action.parameters.get("reason", "Bulk void operation")
                invoice_service.void_invoice(invoice_id, current_user, reason)
                results.append({"invoice_id": invoice_id, "status": "voided"})
                successful += 1
                
            else:
                errors.append({
                    "invoice_id": invoice_id,
                    "error": f"Unknown action: {bulk_action.action}"
                })
                
        except Exception as e:
            errors.append({
                "invoice_id": invoice_id,
                "error": str(e)
            })
    
    return BulkInvoiceResult(
        total_requested=len(bulk_action.invoice_ids),
        successful=successful,
        failed=len(errors),
        results=results,
        errors=errors
    )

@router.get("/{invoice_id}/audit-log", response_model=List[Dict[str, Any]])
def get_invoice_audit_log(
    invoice_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get audit log for invoice"""
    audit_logs = db.query(AuditLog).filter(
        AuditLog.resource_type == "invoice",
        AuditLog.resource_id == invoice_id
    ).order_by(desc(AuditLog.created_at)).all()
    
    return [
        {
            "id": log.id,
            "action": log.action,
            "user_id": log.user_id,
            "old_values": log.old_values,
            "new_values": log.new_values,
            "timestamp": log.created_at,
            "ip_address": str(log.ip_address) if log.ip_address else None
        }
        for log in audit_logs
    ]

@router.get("/{invoice_id}/pdf")
def generate_invoice_pdf(
    invoice_id: UUID,
    template: str = Query("default", description="PDF template to use"),
    invoice_service: InvoiceService = Depends(get_invoice_service),
    current_user: User = Depends(get_current_user)
):
    """Generate PDF for invoice"""
    invoice = invoice_service._get_invoice_with_details(invoice_id)
    
    # This would integrate with a PDF generation service
    # For now, return invoice data for frontend PDF generation
    return {
        "message": "PDF generation endpoint",
        "invoice_data": {
            "id": str(invoice.id),
            "invoice_number": invoice.invoice_number,
            "customer": {
                "name": invoice.customer.name if invoice.customer else "Unknown",
                "phone": invoice.customer.phone if invoice.customer else None,
                "address": invoice.customer.address if invoice.customer else None
            },
            "items": [
                {
                    "name": item.inventory_item.name if item.inventory_item else "Unknown",
                    "quantity": float(item.quantity),
                    "unit_price": float(item.unit_price),
                    "total_price": float(item.total_price),
                    "weight_grams": float(item.weight_grams) if item.weight_grams else None
                }
                for item in invoice.invoice_items
            ],
            "totals": {
                "subtotal": float(invoice.subtotal) if invoice.subtotal else 0,
                "tax_amount": float(invoice.tax_amount) if invoice.tax_amount else 0,
                "total_amount": float(invoice.total_amount),
                "paid_amount": float(invoice.paid_amount),
                "remaining_amount": float(invoice.remaining_amount)
            },
            "gold_specific": invoice.gold_specific if invoice.gold_specific else None,
            "business_type": invoice.business_type_fields.get("business_type") if invoice.business_type_fields else "gold_shop",
            "created_at": invoice.created_at.isoformat(),
            "workflow_stage": invoice.workflow_stage
        },
        "template": template,
        "note": "Frontend should handle PDF generation using libraries like jsPDF or react-pdf"
    }

# Legacy endpoints for backward compatibility
@router.post("/calculate-legacy", response_model=Dict[str, Any])
def calculate_invoice_legacy(
    invoice_data: Dict[str, Any],
    invoice_service: InvoiceService = Depends(get_invoice_service)
):
    """Legacy calculation endpoint for backward compatibility"""
    calculation_summary = invoice_service.calculate_invoice_totals(invoice_data)
    
    # Convert to legacy format
    return {
        "items": [
            {
                "item_id": str(item["inventory_item_id"]),
                "item_name": item["item_name"],
                "quantity": item["quantity"],
                "weight_grams": item.get("weight_grams", 0),
                "base_price": item.get("base_price", 0),
                "labor_cost": item.get("labor_cost", 0),
                "profit_amount": item.get("profit_amount", 0),
                "vat_amount": item.get("tax_amount", 0),
                "unit_price": item["unit_price"],
                "total_price": item["total_price"]
            }
            for item in calculation_summary["items"]
        ],
        "subtotal": calculation_summary["subtotal"],
        "total_labor_cost": sum(item.get("labor_cost", 0) for item in calculation_summary["items"]),
        "total_profit": sum(item.get("profit_amount", 0) for item in calculation_summary["items"]),
        "total_vat": calculation_summary["total_tax"],
        "grand_total": calculation_summary["grand_total"]
    }