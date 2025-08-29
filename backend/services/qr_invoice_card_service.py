"""
QR Invoice Card Service
Comprehensive service for managing beautiful QR-enabled invoice cards
"""

from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, desc, func, text
from typing import List, Optional, Dict, Any, Tuple
from uuid import UUID
from datetime import datetime, timedelta, timezone
from decimal import Decimal
import uuid
import qrcode
import io
import base64
import json
import hashlib
import secrets
from PIL import Image, ImageDraw, ImageFont
from fastapi import HTTPException

import models_universal as models
import schemas_universal as schemas

class QRInvoiceCardService:
    """Service for managing QR invoice cards with beautiful styling and comprehensive features"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def generate_unique_qr_code(self, invoice_id: UUID) -> str:
        """Generate unique QR code data for invoice"""
        import time
        timestamp = int(time.time() * 1000000)  # Microsecond precision
        random_part = secrets.token_hex(8)
        unique_data = f"invoice:{invoice_id}:{timestamp}:{random_part}"
        return hashlib.sha256(unique_data.encode()).hexdigest()[:16]
    
    def generate_short_url(self, card_id: UUID) -> str:
        """Generate short URL for card access"""
        return f"card/{str(card_id)[:8]}"
    
    def create_qr_code_image(self, data: str, size: int = 200) -> bytes:
        """Create QR code image as bytes"""
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=10,
            border=4,
        )
        qr.add_data(data)
        qr.make(fit=True)
        
        # Create QR code image
        qr_img = qr.make_image(fill_color="black", back_color="white")
        qr_img = qr_img.resize((size, size), Image.Resampling.LANCZOS)
        
        # Convert to bytes
        img_buffer = io.BytesIO()
        qr_img.save(img_buffer, format='PNG')
        return img_buffer.getvalue()
    
    def prepare_card_data(self, invoice: models.UniversalInvoice) -> Dict[str, Any]:
        """Prepare comprehensive card data snapshot"""
        card_data = {
            "invoice_number": invoice.invoice_number,
            "invoice_type": invoice.type,
            "customer_info": {
                "name": invoice.customer_name,
                "phone": invoice.customer_phone,
                "email": invoice.customer_email,
                "address": invoice.customer_address
            },
            "amounts": {
                "subtotal": float(invoice.subtotal),
                "tax_amount": float(invoice.tax_amount),
                "discount_amount": float(invoice.discount_amount),
                "total_amount": float(invoice.total_amount),
                "paid_amount": float(invoice.paid_amount),
                "remaining_amount": float(invoice.remaining_amount),
                "currency": invoice.currency
            },
            "status": {
                "invoice_status": invoice.status,
                "workflow_stage": invoice.workflow_stage,
                "payment_status": invoice.payment_status
            },
            "dates": {
                "created_at": invoice.created_at.isoformat(),
                "approved_at": invoice.approved_at.isoformat() if invoice.approved_at else None,
                "payment_date": invoice.payment_date.isoformat() if invoice.payment_date else None
            },
            "items": [],
            "gold_fields": {},
            "metadata": {
                "notes": invoice.notes,
                "payment_method": invoice.payment_method,
                "invoice_metadata": invoice.invoice_metadata or {}
            }
        }
        
        # Add gold-specific fields if applicable
        if invoice.type == "gold":
            card_data["gold_fields"] = {
                "gold_price_per_gram": float(invoice.gold_price_per_gram) if invoice.gold_price_per_gram else 0,
                "labor_cost_percentage": float(invoice.labor_cost_percentage) if invoice.labor_cost_percentage else 0,
                "profit_percentage": float(invoice.profit_percentage) if invoice.profit_percentage else 0,
                "vat_percentage": float(invoice.vat_percentage) if invoice.vat_percentage else 0,
                "gold_sood": float(invoice.gold_sood) if invoice.gold_sood else 0,
                "gold_ojrat": float(invoice.gold_ojrat) if invoice.gold_ojrat else 0,
                "gold_maliyat": float(invoice.gold_maliyat) if invoice.gold_maliyat else 0,
                "gold_total_weight": float(invoice.gold_total_weight) if invoice.gold_total_weight else 0
            }
        
        # Add items data with images
        for item in invoice.invoice_items:
            item_data = {
                "name": item.item_name,
                "sku": item.item_sku,
                "description": item.item_description,
                "quantity": float(item.quantity),
                "unit_price": float(item.unit_price),
                "total_price": float(item.total_price),
                "unit_of_measure": item.unit_of_measure,
                "weight_grams": float(item.weight_grams) if item.weight_grams else None,
                "images": item.item_images or [],
                "custom_attributes": item.custom_attributes or {},
                "gold_specific": item.gold_specific or {}
            }
            card_data["items"].append(item_data)
        
        return card_data
    
    def create_qr_card(
        self, 
        invoice_id: UUID, 
        theme: str = "glass",
        background_color: str = "#ffffff",
        text_color: str = "#000000",
        accent_color: str = "#3B82F6",
        is_public: bool = True,
        expires_at: Optional[datetime] = None,
        requires_password: bool = False,
        access_password: Optional[str] = None,
        created_by: Optional[UUID] = None
    ) -> models.QRInvoiceCard:
        """Create comprehensive QR card for invoice"""
        
        # Get invoice with all details
        invoice = self.db.query(models.UniversalInvoice).options(
            joinedload(models.UniversalInvoice.invoice_items)
        ).filter(models.UniversalInvoice.id == invoice_id).first()
        
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        # Check if card already exists
        existing_card = self.db.query(models.QRInvoiceCard).filter(
            models.QRInvoiceCard.invoice_id == invoice_id
        ).first()
        
        if existing_card:
            return existing_card
        
        # Generate unique identifiers
        qr_code_data = self.generate_unique_qr_code(invoice_id)
        card_id = uuid.uuid4()
        card_url = f"/invoice-card/{card_id}"
        short_url = self.generate_short_url(card_id)
        
        # Prepare card data
        card_data = self.prepare_card_data(invoice)
        
        # Hash password if provided
        hashed_password = None
        if requires_password and access_password:
            hashed_password = hashlib.sha256(access_password.encode()).hexdigest()
        
        # Create QR card record
        qr_card = models.QRInvoiceCard(
            id=card_id,
            invoice_id=invoice_id,
            qr_code=qr_code_data,
            card_url=card_url,
            short_url=short_url,
            theme=theme,
            background_color=background_color,
            text_color=text_color,
            accent_color=accent_color,
            card_data=card_data,
            is_public=is_public,
            requires_password=requires_password,
            access_password=hashed_password,
            expires_at=expires_at,
            is_active=True,
            created_by=created_by
        )
        
        self.db.add(qr_card)
        
        # Update invoice with QR information
        invoice.qr_code = qr_code_data
        invoice.card_url = card_url
        self.db.add(invoice)
        
        self.db.flush()
        return qr_card
    
    def get_qr_card_by_id(self, card_id: UUID) -> Optional[models.QRInvoiceCard]:
        """Get QR card by ID"""
        return self.db.query(models.QRInvoiceCard).filter(
            models.QRInvoiceCard.id == card_id
        ).first()
    
    def get_qr_card_by_invoice(self, invoice_id: UUID) -> Optional[models.QRInvoiceCard]:
        """Get QR card by invoice ID"""
        return self.db.query(models.QRInvoiceCard).filter(
            models.QRInvoiceCard.invoice_id == invoice_id
        ).first()
    
    def get_qr_card_by_url(self, card_url: str) -> Optional[models.QRInvoiceCard]:
        """Get QR card by card URL"""
        return self.db.query(models.QRInvoiceCard).filter(
            models.QRInvoiceCard.card_url == card_url
        ).first()
    
    def get_qr_card_by_short_url(self, short_url: str) -> Optional[models.QRInvoiceCard]:
        """Get QR card by short URL"""
        return self.db.query(models.QRInvoiceCard).filter(
            models.QRInvoiceCard.short_url == short_url
        ).first()
    
    def update_qr_card(
        self, 
        card_id: UUID, 
        updates: schemas.QRInvoiceCardUpdate
    ) -> models.QRInvoiceCard:
        """Update QR card configuration"""
        qr_card = self.get_qr_card_by_id(card_id)
        if not qr_card:
            raise HTTPException(status_code=404, detail="QR card not found")
        
        # Update fields
        update_data = updates.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if field == "access_password" and value:
                # Hash password
                setattr(qr_card, field, hashlib.sha256(value.encode()).hexdigest())
            else:
                setattr(qr_card, field, value)
        
        self.db.add(qr_card)
        self.db.flush()
        return qr_card
    
    def verify_card_access(
        self, 
        card_id: UUID, 
        password: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Tuple[bool, Optional[str]]:
        """Verify access to QR card and log access attempt"""
        qr_card = self.get_qr_card_by_id(card_id)
        
        if not qr_card:
            return False, "Card not found"
        
        if not qr_card.is_active:
            return False, "Card is inactive"
        
        if qr_card.expires_at and qr_card.expires_at < datetime.now():
            return False, "Card has expired"
        
        if not qr_card.is_public:
            return False, "Card is not publicly accessible"
        
        if qr_card.requires_password:
            if not password:
                return False, "Password required"
            
            hashed_password = hashlib.sha256(password.encode()).hexdigest()
            if hashed_password != qr_card.access_password:
                # Log failed access attempt
                self.log_card_access(
                    card_id, ip_address, user_agent, success=False, 
                    failure_reason="Invalid password"
                )
                return False, "Invalid password"
        
        # Log successful access
        self.log_card_access(card_id, ip_address, user_agent, success=True)
        
        # Update view count and last viewed
        qr_card.view_count += 1
        qr_card.last_viewed_at = datetime.now(timezone.utc)
        self.db.add(qr_card)
        self.db.flush()  # Ensure changes are persisted
        
        return True, None
    
    def log_card_access(
        self,
        card_id: UUID,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        referer: Optional[str] = None,
        success: bool = True,
        failure_reason: Optional[str] = None
    ) -> models.QRCardAccessLog:
        """Log card access attempt"""
        
        # Validate IP address format
        if ip_address and ip_address in ["testclient", "localhost"]:
            ip_address = "127.0.0.1"  # Use localhost IP for test clients
        
        # Parse user agent for device info (simplified)
        device_type = "unknown"
        browser = "unknown"
        os = "unknown"
        
        if user_agent:
            user_agent_lower = user_agent.lower()
            if "mobile" in user_agent_lower or "android" in user_agent_lower or "iphone" in user_agent_lower:
                device_type = "mobile"
            elif "tablet" in user_agent_lower or "ipad" in user_agent_lower:
                device_type = "tablet"
            else:
                device_type = "desktop"
            
            if "chrome" in user_agent_lower:
                browser = "Chrome"
            elif "firefox" in user_agent_lower:
                browser = "Firefox"
            elif "safari" in user_agent_lower:
                browser = "Safari"
            elif "edge" in user_agent_lower:
                browser = "Edge"
            
            if "windows" in user_agent_lower:
                os = "Windows"
            elif "mac" in user_agent_lower:
                os = "macOS"
            elif "linux" in user_agent_lower:
                os = "Linux"
            elif "android" in user_agent_lower:
                os = "Android"
            elif "ios" in user_agent_lower:
                os = "iOS"
        
        access_log = models.QRCardAccessLog(
            card_id=card_id,
            ip_address=ip_address,
            user_agent=user_agent,
            referer=referer,
            device_type=device_type,
            browser=browser,
            os=os
        )
        
        self.db.add(access_log)
        return access_log
    
    def get_card_analytics(self, card_id: UUID) -> Dict[str, Any]:
        """Get analytics for QR card"""
        qr_card = self.get_qr_card_by_id(card_id)
        if not qr_card:
            raise HTTPException(status_code=404, detail="QR card not found")
        
        # Get access logs
        access_logs = self.db.query(models.QRCardAccessLog).filter(
            models.QRCardAccessLog.card_id == card_id
        ).all()
        
        # Calculate analytics
        total_views = len(access_logs)
        unique_ips = len(set(log.ip_address for log in access_logs if log.ip_address))
        
        # Device breakdown
        device_breakdown = {}
        browser_breakdown = {}
        os_breakdown = {}
        
        for log in access_logs:
            device_breakdown[log.device_type] = device_breakdown.get(log.device_type, 0) + 1
            browser_breakdown[log.browser] = browser_breakdown.get(log.browser, 0) + 1
            os_breakdown[log.os] = os_breakdown.get(log.os, 0) + 1
        
        # Recent activity (last 7 days)
        from datetime import timezone
        week_ago = datetime.now(timezone.utc) - timedelta(days=7)
        recent_views = len([log for log in access_logs if log.accessed_at >= week_ago])
        
        return {
            "card_id": str(card_id),
            "total_views": total_views,
            "unique_visitors": unique_ips,
            "recent_views_7d": recent_views,
            "first_viewed": min(log.accessed_at for log in access_logs) if access_logs else None,
            "last_viewed": qr_card.last_viewed_at,
            "device_breakdown": device_breakdown,
            "browser_breakdown": browser_breakdown,
            "os_breakdown": os_breakdown,
            "is_active": qr_card.is_active,
            "expires_at": qr_card.expires_at,
            "theme": qr_card.theme
        }
    
    def list_qr_cards(
        self,
        skip: int = 0,
        limit: int = 100,
        invoice_type: Optional[str] = None,
        theme: Optional[str] = None,
        is_active: Optional[bool] = None,
        is_public: Optional[bool] = None,
        created_after: Optional[datetime] = None,
        created_before: Optional[datetime] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc"
    ) -> Tuple[List[models.QRInvoiceCard], int]:
        """List QR cards with filtering and pagination"""
        
        query = self.db.query(models.QRInvoiceCard).join(
            models.UniversalInvoice,
            models.QRInvoiceCard.invoice_id == models.UniversalInvoice.id
        )
        
        # Apply filters
        if invoice_type:
            query = query.filter(models.UniversalInvoice.type == invoice_type)
        
        if theme:
            query = query.filter(models.QRInvoiceCard.theme == theme)
        
        if is_active is not None:
            query = query.filter(models.QRInvoiceCard.is_active == is_active)
        
        if is_public is not None:
            query = query.filter(models.QRInvoiceCard.is_public == is_public)
        
        if created_after:
            query = query.filter(models.QRInvoiceCard.created_at >= created_after)
        
        if created_before:
            query = query.filter(models.QRInvoiceCard.created_at <= created_before)
        
        # Apply sorting
        if sort_by == "created_at":
            sort_column = models.QRInvoiceCard.created_at
        elif sort_by == "view_count":
            sort_column = models.QRInvoiceCard.view_count
        elif sort_by == "last_viewed_at":
            sort_column = models.QRInvoiceCard.last_viewed_at
        else:
            sort_column = models.QRInvoiceCard.created_at
        
        if sort_order == "desc":
            query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(sort_column)
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        cards = query.offset(skip).limit(limit).all()
        
        return cards, total
    
    def delete_qr_card(self, card_id: UUID) -> bool:
        """Delete QR card and related access logs"""
        qr_card = self.get_qr_card_by_id(card_id)
        if not qr_card:
            return False
        
        # Delete access logs first
        self.db.query(models.QRCardAccessLog).filter(
            models.QRCardAccessLog.card_id == card_id
        ).delete()
        
        # Delete QR card
        self.db.delete(qr_card)
        
        # Clear QR info from invoice
        invoice = self.db.query(models.UniversalInvoice).filter(
            models.UniversalInvoice.id == qr_card.invoice_id
        ).first()
        
        if invoice:
            invoice.qr_code = None
            invoice.card_url = None
            self.db.add(invoice)
        
        return True
    
    def regenerate_qr_card(self, card_id: UUID) -> models.QRInvoiceCard:
        """Regenerate QR card with new QR code and URL"""
        qr_card = self.get_qr_card_by_id(card_id)
        if not qr_card:
            raise HTTPException(status_code=404, detail="QR card not found")
        
        # Generate new identifiers
        new_qr_code = self.generate_unique_qr_code(qr_card.invoice_id)
        new_card_id = uuid.uuid4()
        new_card_url = f"/invoice-card/{new_card_id}"
        new_short_url = self.generate_short_url(new_card_id)
        
        # Update QR card
        qr_card.id = new_card_id
        qr_card.qr_code = new_qr_code
        qr_card.card_url = new_card_url
        qr_card.short_url = new_short_url
        qr_card.view_count = 0
        qr_card.last_viewed_at = None
        
        # Clear access logs for old card
        self.db.query(models.QRCardAccessLog).filter(
            models.QRCardAccessLog.card_id == card_id
        ).delete()
        
        self.db.add(qr_card)
        
        # Update invoice
        invoice = self.db.query(models.UniversalInvoice).filter(
            models.UniversalInvoice.id == qr_card.invoice_id
        ).first()
        
        if invoice:
            invoice.qr_code = new_qr_code
            invoice.card_url = new_card_url
            self.db.add(invoice)
        
        return qr_card
    
    def get_card_themes(self) -> List[Dict[str, Any]]:
        """Get available card themes"""
        return [
            {
                "name": "glass",
                "display_name": "Glass Style",
                "description": "Modern glass-morphism design with transparency effects",
                "preview_colors": {
                    "background": "rgba(255, 255, 255, 0.1)",
                    "text": "#000000",
                    "accent": "#3B82F6"
                }
            },
            {
                "name": "modern",
                "display_name": "Modern",
                "description": "Clean modern design with sharp edges and bold colors",
                "preview_colors": {
                    "background": "#ffffff",
                    "text": "#1f2937",
                    "accent": "#059669"
                }
            },
            {
                "name": "classic",
                "display_name": "Classic",
                "description": "Traditional business card style with professional appearance",
                "preview_colors": {
                    "background": "#f9fafb",
                    "text": "#374151",
                    "accent": "#6366f1"
                }
            },
            {
                "name": "gold",
                "display_name": "Gold Luxury",
                "description": "Elegant gold theme perfect for jewelry and luxury items",
                "preview_colors": {
                    "background": "#fef3c7",
                    "text": "#92400e",
                    "accent": "#d97706"
                }
            },
            {
                "name": "dark",
                "display_name": "Dark Mode",
                "description": "Sleek dark theme with high contrast",
                "preview_colors": {
                    "background": "#1f2937",
                    "text": "#f9fafb",
                    "accent": "#60a5fa"
                }
            }
        ]