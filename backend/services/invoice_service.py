"""
Enhanced Invoice Service with Flexible Workflows
Implements comprehensive invoice management with workflow engine, approval system,
and business type specific features while maintaining gold shop compatibility.
"""

from typing import List, Optional, Dict, Any, Tuple
from uuid import UUID
from datetime import datetime, date
from decimal import Decimal
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, desc, func
from fastapi import HTTPException, status

from models import (
    Invoice, InvoiceItem, Customer, InventoryItem, User, 
    Payment, AccountingEntry
)
# Try to import universal models, fall back to existing ones
try:
    from models_universal import (
        JournalEntry, JournalEntryLine, ChartOfAccounts, 
        PaymentMethod, AuditLog, InventoryMovement,
        WorkflowDefinition, BusinessConfiguration
    )
except ImportError:
    # Fallback classes for compatibility
    class WorkflowDefinition:
        pass
    class BusinessConfiguration:
        pass
    class PaymentMethod:
        pass
    class AuditLog:
        pass
    class InventoryMovement:
        pass
import schemas

class InvoiceWorkflowEngine:
    """Handles invoice workflow transitions and business rules"""
    
    def __init__(self, db: Session):
        self.db = db
        
    def get_workflow_definition(self, business_type: str, invoice_type: str = "standard") -> Dict[str, Any]:
        """Get workflow definition for business type and invoice type"""
        try:
            workflow = self.db.query(WorkflowDefinition).filter(
                WorkflowDefinition.entity_type == "invoice",
                WorkflowDefinition.business_type == business_type,
                WorkflowDefinition.is_active == True
            ).first()
            
            if workflow:
                return workflow.workflow_config
        except:
            # Fallback if WorkflowDefinition table doesn't exist
            pass
        
        # Default workflow for all business types
        return {
            "stages": [
                {"name": "draft", "label": "Draft", "editable": True, "stock_impact": False},
                {"name": "pending_approval", "label": "Pending Approval", "editable": False, "stock_impact": False},
                {"name": "approved", "label": "Approved", "editable": False, "stock_impact": True},
                {"name": "paid", "label": "Paid", "editable": False, "stock_impact": True},
                {"name": "cancelled", "label": "Cancelled", "editable": False, "stock_impact": False}
            ],
            "transitions": {
                "draft": ["pending_approval", "approved", "cancelled"],
                "pending_approval": ["approved", "draft", "cancelled"],
                "approved": ["paid", "cancelled"],
                "paid": [],
                "cancelled": []
            },
            "approval_rules": {
                "required_for_stages": ["approved"],
                "roles": ["manager", "admin"],
                "amount_threshold": 1000.0
            }
        }
    
    def can_transition(self, invoice: Invoice, target_stage: str, user: User) -> Tuple[bool, str]:
        """Check if invoice can transition to target stage"""
        # Get business type from invoice or default to gold_shop
        business_type = "gold_shop"
        if hasattr(invoice, 'business_type_fields') and invoice.business_type_fields:
            business_type = invoice.business_type_fields.get("business_type", "gold_shop")
        
        # Get invoice type or default to standard
        invoice_type = "standard"
        if hasattr(invoice, 'invoice_type'):
            invoice_type = invoice.invoice_type
        
        workflow = self.get_workflow_definition(business_type, invoice_type)
        
        # Get current stage from invoice or default to draft
        current_stage = "draft"
        if hasattr(invoice, 'workflow_stage'):
            current_stage = invoice.workflow_stage
        elif invoice.status == "paid":
            current_stage = "paid"
        elif invoice.status == "pending":
            current_stage = "approved"
        allowed_transitions = workflow["transitions"].get(current_stage, [])
        
        if target_stage not in allowed_transitions:
            return False, f"Cannot transition from {current_stage} to {target_stage}"
        
        # Check approval requirements
        if target_stage == "approved":
            approval_rules = workflow.get("approval_rules", {})
            if approval_rules.get("required_for_stages") and "approved" in approval_rules["required_for_stages"]:
                if not user.role or user.role.name not in approval_rules.get("roles", []):
                    return False, "User does not have approval permissions"
                
                amount_threshold = approval_rules.get("amount_threshold", 0)
                if invoice.total_amount > amount_threshold and not invoice.approved_by:
                    return False, f"Invoice amount exceeds threshold ({amount_threshold}), approval required"
        
        return True, "Transition allowed"
    
    def transition_invoice(self, invoice: Invoice, target_stage: str, user: User, notes: str = None) -> bool:
        """Execute invoice workflow transition"""
        can_transition, message = self.can_transition(invoice, target_stage, user)
        if not can_transition:
            raise HTTPException(status_code=400, detail=message)
        
        # Get old stage
        old_stage = "draft"
        if hasattr(invoice, 'workflow_stage'):
            old_stage = invoice.workflow_stage
        elif invoice.status == "paid":
            old_stage = "paid"
        elif invoice.status == "pending":
            old_stage = "approved"
        
        # Set new stage
        if hasattr(invoice, 'workflow_stage'):
            invoice.workflow_stage = target_stage
        
        # Handle stage-specific logic
        if target_stage == "approved":
            if hasattr(invoice, 'approved_by'):
                invoice.approved_by = user.id
            if hasattr(invoice, 'approved_at'):
                invoice.approved_at = datetime.now()
            if hasattr(invoice, 'approval_required'):
                invoice.approval_required = False
            
        # Update invoice status for backward compatibility
        if target_stage == "paid":
            invoice.status = "paid"
        elif target_stage == "cancelled":
            invoice.status = "cancelled"
        elif target_stage == "approved":
            invoice.status = "pending" if invoice.remaining_amount > 0 else "paid"
        
        # Log the transition
        self._log_workflow_transition(invoice, old_stage, target_stage, user, notes)
        
        return True
    
    def _log_workflow_transition(self, invoice: Invoice, old_stage: str, new_stage: str, user: User, notes: str = None):
        """Log workflow transition in audit log"""
        try:
            audit_log = AuditLog(
                user_id=user.id,
                action="workflow_transition",
                resource_type="invoice",
                resource_id=invoice.id,
                old_values={"workflow_stage": old_stage},
                new_values={"workflow_stage": new_stage, "notes": notes}
            )
            self.db.add(audit_log)
        except:
            # Fallback if AuditLog table doesn't exist
            pass

class InvoicePricingEngine:
    """Handles complex pricing calculations and business rules"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def calculate_item_pricing(self, item_data: Dict[str, Any], business_config: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate pricing for individual invoice item"""
        inventory_item = self.db.query(InventoryItem).filter(
            InventoryItem.id == item_data["inventory_item_id"]
        ).first()
        
        if not inventory_item:
            raise HTTPException(status_code=404, detail="Inventory item not found")
        
        quantity = Decimal(str(item_data["quantity"]))
        
        # Get base price (cost vs sale price) - handle both naming conventions
        cost_price = getattr(inventory_item, 'cost_price', None) or getattr(inventory_item, 'purchase_price', None) or Decimal('0')
        sale_price = getattr(inventory_item, 'sale_price', None) or getattr(inventory_item, 'sell_price', None) or Decimal('0')
        
        # Business type specific pricing
        business_type = business_config.get("business_type", "gold_shop")
        
        if business_type == "gold_shop":
            return self._calculate_gold_pricing(item_data, inventory_item, business_config)
        else:
            return self._calculate_standard_pricing(item_data, inventory_item, business_config)
    
    def _calculate_gold_pricing(self, item_data: Dict[str, Any], inventory_item: InventoryItem, config: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate gold-specific pricing with سود and اجرت"""
        quantity = Decimal(str(item_data["quantity"]))
        weight_grams = Decimal(str(item_data.get("weight_grams", inventory_item.weight_grams or 0)))
        gold_price_per_gram = Decimal(str(config.get("gold_price_per_gram", 0)))
        
        # Get cost price for margin calculation
        cost_price = getattr(inventory_item, 'cost_price', None) or getattr(inventory_item, 'purchase_price', None) or Decimal('0')
        
        # Base calculations
        total_weight = weight_grams * quantity
        base_price = total_weight * gold_price_per_gram
        
        # Gold-specific calculations
        labor_percentage = Decimal(str(config.get("labor_cost_percentage", 0)))
        profit_percentage = Decimal(str(config.get("profit_percentage", 0)))
        
        labor_cost = base_price * (labor_percentage / 100)  # اجرت
        profit_amount = (base_price + labor_cost) * (profit_percentage / 100)  # سود
        
        subtotal = base_price + labor_cost + profit_amount
        
        # Tax calculation
        tax_percentage = Decimal(str(config.get("tax_percentage", 0)))
        tax_amount = subtotal * (tax_percentage / 100)
        
        unit_price = (subtotal + tax_amount) / quantity
        total_price = unit_price * quantity
        
        return {
            "inventory_item_id": inventory_item.id,
            "item_name": inventory_item.name,
            "quantity": quantity,
            "weight_grams": weight_grams,
            "cost_price": cost_price,
            "base_price": base_price,
            "labor_cost": labor_cost,  # اجرت
            "profit_amount": profit_amount,  # سود
            "tax_amount": tax_amount,
            "unit_price": unit_price,
            "total_price": total_price,
            "margin": ((unit_price - cost_price) / unit_price * 100) if unit_price > 0 else Decimal('0')
        }
    
    def _calculate_standard_pricing(self, item_data: Dict[str, Any], inventory_item: InventoryItem, config: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate standard business pricing"""
        quantity = Decimal(str(item_data["quantity"]))
        
        # Get cost and sale prices - handle both naming conventions
        cost_price = getattr(inventory_item, 'cost_price', None) or getattr(inventory_item, 'purchase_price', None) or Decimal('0')
        sale_price = getattr(inventory_item, 'sale_price', None) or getattr(inventory_item, 'sell_price', None) or Decimal('0')
        
        # Use sale price or cost price with markup
        base_unit_price = sale_price or cost_price
        
        # Ensure we have a positive price
        if base_unit_price <= 0:
            base_unit_price = Decimal('100.00')  # Default price if none available
        
        # Apply customer-specific discount if any
        discount_percentage = Decimal(str(config.get("discount_percentage", 0)))
        discounted_price = base_unit_price * (1 - discount_percentage / 100)
        
        # Tax calculation
        tax_percentage = Decimal(str(config.get("tax_percentage", 0)))
        tax_amount = discounted_price * quantity * (tax_percentage / 100)
        
        subtotal = discounted_price * quantity
        total_price = subtotal + tax_amount
        
        return {
            "inventory_item_id": inventory_item.id,
            "item_name": inventory_item.name,
            "quantity": quantity,
            "cost_price": cost_price,
            "base_unit_price": base_unit_price,
            "discount_amount": (base_unit_price - discounted_price) * quantity,
            "tax_amount": tax_amount,
            "unit_price": discounted_price,
            "total_price": total_price,
            "margin": ((discounted_price - cost_price) / discounted_price * 100) if discounted_price > 0 else Decimal('0')
        }

class InvoiceService:
    """Enhanced Invoice Service with flexible workflows and business type support"""
    
    def __init__(self, db: Session):
        self.db = db
        self.workflow_engine = InvoiceWorkflowEngine(db)
        self.pricing_engine = InvoicePricingEngine(db)
    
    def generate_invoice_number(self, business_type: str = "gold_shop") -> str:
        """Generate unique invoice number based on business type"""
        now = datetime.now()
        
        # Business type specific prefixes
        prefixes = {
            "gold_shop": "GLD",
            "retail": "RTL", 
            "restaurant": "RST",
            "service": "SRV",
            "manufacturing": "MFG"
        }
        
        prefix = prefixes.get(business_type, "INV")
        year_month = now.strftime("%Y%m")
        
        # Find the last invoice number for this business type and month
        pattern = f"{prefix}-{year_month}-%"
        last_invoice = self.db.query(Invoice).filter(
            Invoice.invoice_number.like(pattern)
        ).order_by(desc(Invoice.invoice_number)).first()
        
        if last_invoice:
            last_seq = int(last_invoice.invoice_number.split("-")[-1])
            new_seq = last_seq + 1
        else:
            new_seq = 1
        
        return f"{prefix}-{year_month}-{new_seq:04d}"
    
    def calculate_invoice_totals(self, invoice_data: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate comprehensive invoice totals with business type support"""
        business_type = invoice_data.get("business_type", "gold_shop")
        
        # Get business configuration
        business_config = self._get_business_configuration(business_type)
        business_config.update(invoice_data)  # Override with invoice-specific values
        
        calculations = []
        subtotal = Decimal('0')
        total_tax = Decimal('0')
        total_discount = Decimal('0')
        total_cost = Decimal('0')
        
        for item_data in invoice_data["items"]:
            # Validate stock availability
            self._validate_stock_availability(item_data)
            
            # Calculate item pricing
            item_calc = self.pricing_engine.calculate_item_pricing(item_data, business_config)
            calculations.append(item_calc)
            
            subtotal += item_calc["total_price"]
            total_tax += item_calc.get("tax_amount", Decimal('0'))
            total_discount += item_calc.get("discount_amount", Decimal('0'))
            total_cost += item_calc["cost_price"] * item_calc["quantity"]
        
        # Calculate overall margins and profits
        gross_profit = subtotal - total_cost
        profit_margin = (gross_profit / subtotal * 100) if subtotal > 0 else Decimal('0')
        
        return {
            "items": calculations,
            "subtotal": subtotal,
            "total_tax": total_tax,
            "total_discount": total_discount,
            "total_cost": total_cost,
            "gross_profit": gross_profit,
            "profit_margin": profit_margin,
            "grand_total": subtotal
        }
    
    def create_invoice(self, invoice_data: Dict[str, Any], user: User) -> Invoice:
        """Create new invoice with workflow support"""
        try:
            # Validate customer
            customer = self._validate_customer(invoice_data["customer_id"])
            
            # Calculate totals
            calculation_summary = self.calculate_invoice_totals(invoice_data)
            
            # Determine business type
            business_type = invoice_data.get("business_type", "gold_shop")
            
            # Create invoice using existing model structure
            invoice = Invoice(
                invoice_number=self.generate_invoice_number(business_type),
                customer_id=invoice_data["customer_id"],
                total_amount=calculation_summary["grand_total"],
                paid_amount=Decimal('0'),
                remaining_amount=calculation_summary["grand_total"],
                gold_price_per_gram=Decimal(str(invoice_data.get("gold_price_per_gram", 0))),
                labor_cost_percentage=Decimal(str(invoice_data.get("labor_cost_percentage", 0))),
                profit_percentage=Decimal(str(invoice_data.get("profit_percentage", 0))),
                vat_percentage=Decimal(str(invoice_data.get("vat_percentage", 0))),
                status="pending"
            )
            
            # Add universal fields if they exist in the model
            if hasattr(invoice, 'invoice_type'):
                invoice.invoice_type = invoice_data.get("invoice_type", "standard")
            if hasattr(invoice, 'workflow_stage'):
                invoice.workflow_stage = "draft"
            if hasattr(invoice, 'approval_required'):
                invoice.approval_required = self._requires_approval(calculation_summary["grand_total"], business_type)
            if hasattr(invoice, 'subtotal'):
                invoice.subtotal = calculation_summary["subtotal"]
            if hasattr(invoice, 'tax_amount'):
                invoice.tax_amount = calculation_summary["total_tax"]
            if hasattr(invoice, 'discount_amount'):
                invoice.discount_amount = calculation_summary["total_discount"]
            if hasattr(invoice, 'currency'):
                invoice.currency = invoice_data.get("currency", "USD")
            if hasattr(invoice, 'business_type_fields'):
                # Convert UUIDs to strings for JSON serialization
                serializable_summary = self._make_json_serializable({
                    "business_type": business_type,
                    "calculation_summary": calculation_summary
                })
                invoice.business_type_fields = serializable_summary
            
            # Add gold-specific fields if they exist in the model
            if business_type == "gold_shop" and hasattr(invoice, 'gold_specific'):
                # Store سود and اجرت in gold_specific field
                total_sood = sum(item.get("profit_amount", 0) for item in calculation_summary["items"])
                total_ojrat = sum(item.get("labor_cost", 0) for item in calculation_summary["items"])
                invoice.gold_specific = {
                    "sood": float(total_sood),  # سود
                    "ojrat": float(total_ojrat)  # اجرت
                }
            
            self.db.add(invoice)
            self.db.flush()  # Get invoice ID
            
            # Create invoice items
            for i, item_data in enumerate(invoice_data["items"]):
                calculation = calculation_summary["items"][i]
                
                invoice_item = InvoiceItem(
                    invoice_id=invoice.id,
                    inventory_item_id=item_data["inventory_item_id"],
                    quantity=calculation["quantity"],
                    unit_price=calculation["unit_price"],
                    total_price=calculation["total_price"],
                    weight_grams=calculation.get("weight_grams") or Decimal('0')  # Default to 0 if None
                )
                self.db.add(invoice_item)
            
            # Log creation
            self._log_invoice_action(invoice, "created", user)
            
            self.db.commit()
            return invoice
            
        except Exception as e:
            self.db.rollback()
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(status_code=500, detail=f"Error creating invoice: {str(e)}")
    
    def approve_invoice(self, invoice_id: UUID, user: User, notes: str = None) -> Invoice:
        """Approve invoice and trigger stock impact"""
        invoice = self._get_invoice_with_details(invoice_id)
        
        # Transition to approved stage
        self.workflow_engine.transition_invoice(invoice, "approved", user, notes)
        
        # Apply stock impact
        self._apply_stock_impact(invoice, "deduct")
        
        # Create accounting entries
        self._create_accounting_entries(invoice)
        
        # Update customer debt
        self._update_customer_debt(invoice.customer_id, invoice.total_amount)
        
        self.db.commit()
        return invoice
    
    def void_invoice(self, invoice_id: UUID, user: User, reason: str = None) -> Invoice:
        """Void invoice and restore stock"""
        invoice = self._get_invoice_with_details(invoice_id)
        
        if invoice.paid_amount > 0:
            raise HTTPException(
                status_code=400,
                detail="Cannot void invoice with payments. Cancel payments first."
            )
        
        # Restore stock if it was impacted
        if invoice.workflow_stage in ["approved", "paid"]:
            self._apply_stock_impact(invoice, "restore")
        
        # Transition to cancelled
        self.workflow_engine.transition_invoice(invoice, "cancelled", user, reason)
        
        # Reverse customer debt
        self._update_customer_debt(invoice.customer_id, -invoice.total_amount)
        
        # Reverse accounting entries
        self._reverse_accounting_entries(invoice)
        
        self.db.commit()
        return invoice
    
    def add_payment(self, invoice_id: UUID, payment_data: Dict[str, Any], user: User) -> Payment:
        """Add payment to invoice with multiple payment method support"""
        invoice = self._get_invoice_with_details(invoice_id)
        
        payment_amount = Decimal(str(payment_data["amount"]))
        
        # Validate payment amount
        if payment_amount <= 0:
            raise HTTPException(status_code=400, detail="Payment amount must be positive")
        
        if payment_amount > invoice.remaining_amount:
            raise HTTPException(
                status_code=400,
                detail=f"Payment amount exceeds remaining amount ({invoice.remaining_amount})"
            )
        
        # Get payment method if the table exists
        payment_method = None
        try:
            if payment_data.get("payment_method_id"):
                payment_method = self.db.query(PaymentMethod).filter(
                    PaymentMethod.id == payment_data["payment_method_id"]
                ).first()
        except:
            # Fallback if PaymentMethod table doesn't exist
            pass
        
        # Create payment using existing model structure
        payment = Payment(
            customer_id=invoice.customer_id,
            invoice_id=invoice_id,
            amount=payment_amount,
            payment_method=payment_data.get("payment_method", "cash"),  # Legacy field
            description=payment_data.get("description", f"Payment for invoice {invoice.invoice_number}")
        )
        
        # Add universal fields if they exist in the model
        if hasattr(payment, 'payment_method_id'):
            payment.payment_method_id = payment_method.id if payment_method else None
        if hasattr(payment, 'currency'):
            payment.currency = payment_data.get("currency", getattr(invoice, 'currency', 'USD'))
        if hasattr(payment, 'reference_number'):
            payment.reference_number = payment_data.get("reference_number")
        self.db.add(payment)
        
        # Update invoice amounts
        invoice.paid_amount += payment_amount
        invoice.remaining_amount -= payment_amount
        
        # Update invoice status and workflow
        if invoice.remaining_amount == 0:
            self.workflow_engine.transition_invoice(invoice, "paid", user)
        elif invoice.paid_amount > 0:
            # Get current workflow stage
            current_stage = "draft"
            if hasattr(invoice, 'workflow_stage'):
                current_stage = invoice.workflow_stage
            elif invoice.status == "paid":
                current_stage = "paid"
            elif invoice.status == "pending":
                current_stage = "approved"
            
            if current_stage == "draft":
                # Auto-approve if payment is made on draft invoice
                self.workflow_engine.transition_invoice(invoice, "approved", user, "Auto-approved due to payment")
        
        # Update customer debt
        self._update_customer_debt(invoice.customer_id, -payment_amount)
        
        # Create accounting entries for payment
        self._create_payment_accounting_entries(payment, payment_method)
        
        # Log payment
        self._log_invoice_action(invoice, "payment_added", user, {"amount": float(payment_amount)})
        
        self.db.commit()
        return payment
    
    def _get_business_configuration(self, business_type: str) -> Dict[str, Any]:
        """Get business configuration for pricing and workflow"""
        try:
            config = self.db.query(BusinessConfiguration).filter(
                BusinessConfiguration.business_type == business_type,
                BusinessConfiguration.is_active == True
            ).first()
            
            if config:
                return config.configuration
        except:
            # Fallback if BusinessConfiguration table doesn't exist
            pass
        
        # Default configuration
        default_config = {
            "business_type": business_type,
            "tax_percentage": 0,
            "discount_percentage": 0,
            "approval_threshold": 1000.0
        }
        
        # Add business type specific defaults
        if business_type == "gold_shop":
            default_config.update({
                "default_settings": {
                    "currency": "USD",
                    "gold_purity_default": 18.0,
                    "labor_percentage_default": 10.0,
                    "profit_percentage_default": 15.0
                },
                "features": {
                    "gold_price_tracking": True,
                    "labor_cost_calculation": True,
                    "profit_margin_tracking": True,
                    "sood_ojrat_fields": True
                }
            })
        
        return default_config
    
    def _validate_customer(self, customer_id: UUID) -> Customer:
        """Validate customer exists and is active"""
        customer = self.db.query(Customer).filter(
            Customer.id == customer_id,
            Customer.is_active == True
        ).first()
        
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found or inactive")
        
        return customer
    
    def _validate_stock_availability(self, item_data: Dict[str, Any]):
        """Validate inventory stock availability"""
        inventory_item = self.db.query(InventoryItem).filter(
            InventoryItem.id == item_data["inventory_item_id"]
        ).first()
        
        if not inventory_item:
            raise HTTPException(status_code=404, detail="Inventory item not found")
        
        if inventory_item.stock_quantity < Decimal(str(item_data["quantity"])):
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for {inventory_item.name}. Available: {inventory_item.stock_quantity}, Requested: {item_data['quantity']}"
            )
    
    def _requires_approval(self, amount: Decimal, business_type: str) -> bool:
        """Check if invoice requires approval based on business rules"""
        workflow = self.workflow_engine.get_workflow_definition(business_type)
        approval_rules = workflow.get("approval_rules", {})
        threshold = Decimal(str(approval_rules.get("amount_threshold", 0)))
        
        return amount > threshold
    
    def _apply_stock_impact(self, invoice: Invoice, action: str):
        """Apply or restore stock impact for invoice items"""
        for item in invoice.invoice_items:
            inventory_item = item.inventory_item
            
            if action == "deduct":
                inventory_item.stock_quantity -= item.quantity
                movement_type = "out"
                notes = f"Stock deducted for invoice {invoice.invoice_number}"
            else:  # restore
                inventory_item.stock_quantity += item.quantity
                movement_type = "in"
                notes = f"Stock restored from voided invoice {invoice.invoice_number}"
            
            # Create inventory movement record if the table exists
            try:
                unit_cost = getattr(inventory_item, 'cost_price', None) or getattr(inventory_item, 'purchase_price', None)
                movement = InventoryMovement(
                    inventory_item_id=inventory_item.id,
                    movement_type=movement_type,
                    quantity=item.quantity if action == "restore" else -item.quantity,
                    unit_cost=unit_cost,
                    total_cost=unit_cost * item.quantity if unit_cost else None,
                    reference_type="invoice",
                    reference_id=invoice.id,
                    notes=notes,
                    created_by=getattr(invoice, 'approved_by', None) or invoice.customer_id
                )
                self.db.add(movement)
            except:
                # Fallback if InventoryMovement table doesn't exist
                pass
            self.db.add(inventory_item)
    
    def _create_accounting_entries(self, invoice: Invoice):
        """Create double-entry accounting entries for invoice"""
        # This would integrate with the full accounting system
        # For now, create basic entries for backward compatibility
        
        # Income entry
        income_entry = AccountingEntry(
            entry_type="income",
            category="sales",
            amount=invoice.total_amount,
            description=f"Invoice {invoice.invoice_number} - Sales Revenue",
            reference_id=invoice.id,
            reference_type="invoice"
        )
        self.db.add(income_entry)
        
        # Gold weight entry for gold shop
        if invoice.invoice_type == "gold" or (invoice.business_type_fields and invoice.business_type_fields.get("business_type") == "gold_shop"):
            total_weight = sum(Decimal(str(item.weight_grams or 0)) * item.quantity for item in invoice.invoice_items)
            if total_weight > 0:
                gold_weight_entry = AccountingEntry(
                    entry_type="gold_weight",
                    category="outgoing",
                    weight_grams=total_weight,
                    description=f"Invoice {invoice.invoice_number} - Gold Weight Sold",
                    reference_id=invoice.id,
                    reference_type="invoice"
                )
                self.db.add(gold_weight_entry)
    
    def _create_payment_accounting_entries(self, payment: Payment, payment_method: PaymentMethod = None):
        """Create accounting entries for payment"""
        # Cash/Bank entry
        entry_type = "cash" if not payment_method or (hasattr(payment_method, 'type') and payment_method.type == "cash") else "bank"
        
        # Get invoice number for description
        invoice_number = "Unknown"
        if hasattr(payment, 'invoice') and payment.invoice:
            invoice_number = payment.invoice.invoice_number
        elif payment.invoice_id:
            # Try to get invoice from database
            invoice = self.db.query(Invoice).filter(Invoice.id == payment.invoice_id).first()
            if invoice:
                invoice_number = invoice.invoice_number
        
        cash_entry = AccountingEntry(
            entry_type=entry_type,
            category="payment_received",
            amount=payment.amount,
            description=f"Payment received for invoice {invoice_number}",
            reference_id=payment.id,
            reference_type="payment"
        )
        self.db.add(cash_entry)
    
    def _reverse_accounting_entries(self, invoice: Invoice):
        """Reverse accounting entries for voided invoice"""
        # Mark existing entries as reversed (simplified approach)
        # In a full system, this would create reversing entries
        pass
    
    def _update_customer_debt(self, customer_id: UUID, amount_change: Decimal):
        """Update customer debt and purchase totals"""
        customer = self.db.query(Customer).filter(Customer.id == customer_id).first()
        if customer:
            customer.current_debt += amount_change
            if amount_change > 0:
                customer.total_purchases += amount_change
                customer.last_purchase_date = datetime.now()
            self.db.add(customer)
    
    def _get_invoice_with_details(self, invoice_id: UUID) -> Invoice:
        """Get invoice with all related details"""
        invoice = self.db.query(Invoice).options(
            joinedload(Invoice.customer),
            joinedload(Invoice.invoice_items).joinedload(InvoiceItem.inventory_item),
            joinedload(Invoice.payments)
        ).filter(Invoice.id == invoice_id).first()
        
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        return invoice
    
    def _make_json_serializable(self, obj):
        """Convert objects to JSON serializable format"""
        import json
        from uuid import UUID
        from decimal import Decimal
        
        def convert_value(value):
            if isinstance(value, UUID):
                return str(value)
            elif isinstance(value, Decimal):
                return float(value)
            elif isinstance(value, dict):
                return {k: convert_value(v) for k, v in value.items()}
            elif isinstance(value, list):
                return [convert_value(item) for item in value]
            else:
                return value
        
        return convert_value(obj)
    
    def _log_invoice_action(self, invoice: Invoice, action: str, user: User, additional_data: Dict[str, Any] = None):
        """Log invoice action in audit log"""
        try:
            workflow_stage = "draft"
            if hasattr(invoice, 'workflow_stage'):
                workflow_stage = invoice.workflow_stage
            elif invoice.status == "paid":
                workflow_stage = "paid"
            elif invoice.status == "pending":
                workflow_stage = "approved"
            
            audit_log = AuditLog(
                user_id=user.id,
                action=action,
                resource_type="invoice",
                resource_id=invoice.id,
                new_values={
                    "invoice_number": invoice.invoice_number,
                    "workflow_stage": workflow_stage,
                    "total_amount": float(invoice.total_amount),
                    **(additional_data or {})
                }
            )
            self.db.add(audit_log)
        except:
            # Fallback if AuditLog table doesn't exist
            pass

# Legacy AccountingEntry model for backward compatibility
from models import AccountingEntry