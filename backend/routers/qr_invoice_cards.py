"""
QR Invoice Cards Router
Comprehensive API endpoints for managing beautiful QR-enabled invoice cards
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, Request, Response
from fastapi.responses import HTMLResponse, StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import datetime
import io
import json

from database import get_db
from auth import get_current_user
import models_universal as models
import schemas_universal as schemas
from services.qr_invoice_card_service import QRInvoiceCardService

router = APIRouter(
    prefix="/qr-cards",
    tags=["qr-invoice-cards"]
)

# Public endpoints (no authentication required)
@router.get("/card/{card_id}", response_class=HTMLResponse)
async def get_public_invoice_card(
    card_id: UUID,
    password: Optional[str] = Query(None, description="Access password if required"),
    request: Request = None,
    db: Session = Depends(get_db)
):
    """Get public invoice card HTML (no authentication required)"""
    service = QRInvoiceCardService(db)
    
    # Get client info
    ip_address = request.client.host if request else None
    user_agent = request.headers.get("user-agent") if request else None
    
    # Verify access
    access_granted, error_message = service.verify_card_access(
        card_id, password, ip_address, user_agent
    )
    
    if not access_granted:
        if error_message == "Password required":
            # Return password prompt HTML
            return HTMLResponse(content=f"""
            <!DOCTYPE html>
            <html>
            <head>
                <title>Invoice Card - Password Required</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }}
                    .container {{ max-width: 400px; margin: 50px auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }}
                    .form-group {{ margin-bottom: 20px; }}
                    label {{ display: block; margin-bottom: 5px; font-weight: bold; }}
                    input {{ width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }}
                    button {{ width: 100%; padding: 12px; background: #3B82F6; color: white; border: none; border-radius: 5px; cursor: pointer; }}
                    button:hover {{ background: #2563EB; }}
                    .error {{ color: #dc2626; margin-top: 10px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <h2>Invoice Card Access</h2>
                    <p>This invoice card is password protected. Please enter the password to view.</p>
                    <form method="get">
                        <div class="form-group">
                            <label for="password">Password:</label>
                            <input type="password" id="password" name="password" required>
                        </div>
                        <button type="submit">Access Card</button>
                    </form>
                </div>
            </body>
            </html>
            """, status_code=200)
        else:
            raise HTTPException(status_code=403, detail=error_message)
    
    # Get card data
    qr_card = service.get_qr_card_by_id(card_id)
    if not qr_card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    # Generate beautiful HTML card
    html_content = generate_beautiful_card_html(qr_card)
    return HTMLResponse(content=html_content)

@router.get("/short/{short_url}", response_class=HTMLResponse)
async def get_card_by_short_url(
    short_url: str,
    password: Optional[str] = Query(None),
    request: Request = None,
    db: Session = Depends(get_db)
):
    """Access card via short URL"""
    service = QRInvoiceCardService(db)
    qr_card = service.get_qr_card_by_short_url(short_url)
    
    if not qr_card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    # Redirect to full card URL with password if provided
    if password:
        return await get_public_invoice_card(qr_card.id, password, request, db)
    else:
        return await get_public_invoice_card(qr_card.id, None, request, db)

# Authenticated endpoints
@router.post("/", response_model=schemas.QRInvoiceCard)
def create_qr_card(
    card_data: schemas.QRInvoiceCardCreate,
    invoice_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create QR card for invoice"""
    service = QRInvoiceCardService(db)
    
    try:
        qr_card = service.create_qr_card(
            invoice_id=invoice_id,
            theme=card_data.theme,
            background_color=card_data.background_color,
            text_color=card_data.text_color,
            accent_color=card_data.accent_color,
            is_public=card_data.is_public,
            expires_at=card_data.expires_at,
            requires_password=card_data.requires_password,
            access_password=card_data.access_password,
            created_by=current_user.id
        )
        
        db.commit()
        return qr_card
        
    except Exception as e:
        db.rollback()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Error creating QR card: {str(e)}")

@router.get("/{card_id}", response_model=schemas.QRInvoiceCardWithInvoice)
def get_qr_card(
    card_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get QR card details (authenticated)"""
    service = QRInvoiceCardService(db)
    qr_card = service.get_qr_card_by_id(card_id)
    
    if not qr_card:
        raise HTTPException(status_code=404, detail="QR card not found")
    
    # Load invoice details
    invoice = db.query(models.UniversalInvoice).filter(
        models.UniversalInvoice.id == qr_card.invoice_id
    ).first()
    
    # Convert to response schema
    response_data = schemas.QRInvoiceCardWithInvoice.from_orm(qr_card)
    response_data.invoice = invoice
    
    return response_data

@router.put("/{card_id}", response_model=schemas.QRInvoiceCard)
def update_qr_card(
    card_id: UUID,
    updates: schemas.QRInvoiceCardUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update QR card configuration"""
    service = QRInvoiceCardService(db)
    
    try:
        qr_card = service.update_qr_card(card_id, updates)
        db.commit()
        return qr_card
        
    except Exception as e:
        db.rollback()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Error updating QR card: {str(e)}")

@router.delete("/{card_id}")
def delete_qr_card(
    card_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete QR card"""
    service = QRInvoiceCardService(db)
    
    try:
        success = service.delete_qr_card(card_id)
        if not success:
            raise HTTPException(status_code=404, detail="QR card not found")
        
        db.commit()
        return {"message": "QR card deleted successfully"}
        
    except Exception as e:
        db.rollback()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Error deleting QR card: {str(e)}")

@router.post("/{card_id}/regenerate", response_model=schemas.QRInvoiceCard)
def regenerate_qr_card(
    card_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Regenerate QR card with new QR code and URL"""
    service = QRInvoiceCardService(db)
    
    try:
        qr_card = service.regenerate_qr_card(card_id)
        db.commit()
        return qr_card
        
    except Exception as e:
        db.rollback()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Error regenerating QR card: {str(e)}")

@router.get("/{card_id}/qr-image")
def get_qr_code_image(
    card_id: UUID,
    size: int = Query(200, ge=100, le=500, description="QR code size in pixels"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get QR code image for card"""
    service = QRInvoiceCardService(db)
    qr_card = service.get_qr_card_by_id(card_id)
    
    if not qr_card:
        raise HTTPException(status_code=404, detail="QR card not found")
    
    # Generate QR code image
    qr_image_bytes = service.create_qr_code_image(qr_card.card_url, size)
    
    return StreamingResponse(
        io.BytesIO(qr_image_bytes),
        media_type="image/png",
        headers={"Content-Disposition": f"inline; filename=qr_card_{card_id}.png"}
    )

@router.get("/{card_id}/analytics")
def get_card_analytics(
    card_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get analytics for QR card"""
    service = QRInvoiceCardService(db)
    
    try:
        analytics = service.get_card_analytics(card_id)
        return analytics
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Error getting analytics: {str(e)}")

@router.get("/", response_model=schemas.QRCardsResponse)
def list_qr_cards(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    invoice_type: Optional[str] = Query(None, description="Filter by invoice type"),
    theme: Optional[str] = Query(None, description="Filter by theme"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    is_public: Optional[bool] = Query(None, description="Filter by public status"),
    created_after: Optional[datetime] = Query(None, description="Created after date"),
    created_before: Optional[datetime] = Query(None, description="Created before date"),
    sort_by: str = Query("created_at", description="Sort field"),
    sort_order: str = Query("desc", description="Sort order"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """List QR cards with filtering and pagination"""
    service = QRInvoiceCardService(db)
    
    cards, total = service.list_qr_cards(
        skip=skip,
        limit=limit,
        invoice_type=invoice_type,
        theme=theme,
        is_active=is_active,
        is_public=is_public,
        created_after=created_after,
        created_before=created_before,
        sort_by=sort_by,
        sort_order=sort_order
    )
    
    return schemas.QRCardsResponse(
        items=cards,
        total=total,
        page=skip // limit + 1,
        per_page=limit,
        total_pages=(total + limit - 1) // limit,
        has_next=skip + limit < total,
        has_prev=skip > 0
    )

@router.get("/themes/available")
def get_available_themes(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get available card themes"""
    service = QRInvoiceCardService(db)
    return {"themes": service.get_card_themes()}

@router.get("/invoice/{invoice_id}/card", response_model=schemas.QRInvoiceCard)
def get_card_by_invoice(
    invoice_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get QR card for specific invoice"""
    service = QRInvoiceCardService(db)
    qr_card = service.get_qr_card_by_invoice(invoice_id)
    
    if not qr_card:
        raise HTTPException(status_code=404, detail="QR card not found for this invoice")
    
    return qr_card

def generate_beautiful_card_html(qr_card: models.QRInvoiceCard) -> str:
    """Generate beautiful HTML for invoice card based on theme"""
    card_data = qr_card.card_data
    theme = qr_card.theme
    
    # Base styles for different themes
    theme_styles = {
        "glass": {
            "background": f"linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.2))",
            "backdrop_filter": "blur(10px)",
            "border": "1px solid rgba(255,255,255,0.18)",
            "box_shadow": "0 8px 32px 0 rgba(31, 38, 135, 0.37)"
        },
        "modern": {
            "background": qr_card.background_color,
            "backdrop_filter": "none",
            "border": "1px solid #e5e7eb",
            "box_shadow": "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
        },
        "classic": {
            "background": qr_card.background_color,
            "backdrop_filter": "none", 
            "border": "2px solid #d1d5db",
            "box_shadow": "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
        },
        "gold": {
            "background": "linear-gradient(135deg, #fef3c7, #fde68a)",
            "backdrop_filter": "none",
            "border": "2px solid #d97706",
            "box_shadow": "0 10px 25px rgba(217, 119, 6, 0.3)"
        },
        "dark": {
            "background": "#1f2937",
            "backdrop_filter": "none",
            "border": "1px solid #374151",
            "box_shadow": "0 10px 15px -3px rgba(0, 0, 0, 0.5)"
        }
    }
    
    style = theme_styles.get(theme, theme_styles["glass"])
    
    # Generate items HTML
    items_html = ""
    for item in card_data.get("items", []):
        item_images = ""
        if item.get("images"):
            for img in item["images"][:3]:  # Show max 3 images
                if isinstance(img, dict) and img.get("url"):
                    item_images += f'<img src="{img["url"]}" alt="{item["name"]}" class="item-image">'
        
        items_html += f"""
        <div class="item">
            <div class="item-info">
                <div class="item-name">{item['name']}</div>
                <div class="item-details">
                    Qty: {item['quantity']} × ${item['unit_price']:.2f} = ${item['total_price']:.2f}
                </div>
                {f'<div class="item-weight">Weight: {item["weight_grams"]}g</div>' if item.get("weight_grams") else ''}
            </div>
            <div class="item-images">{item_images}</div>
        </div>
        """
    
    # Generate gold fields HTML if applicable
    gold_fields_html = ""
    if card_data.get("invoice_type") == "gold" and card_data.get("gold_fields"):
        gold_fields = card_data["gold_fields"]
        gold_fields_html = f"""
        <div class="gold-fields">
            <h3>Gold Details</h3>
            <div class="gold-grid">
                <div class="gold-item">
                    <span class="label">سود (Profit):</span>
                    <span class="value">${gold_fields.get('gold_sood', 0):.2f}</span>
                </div>
                <div class="gold-item">
                    <span class="label">اجرت (Labor):</span>
                    <span class="value">${gold_fields.get('gold_ojrat', 0):.2f}</span>
                </div>
                <div class="gold-item">
                    <span class="label">مالیات (Tax):</span>
                    <span class="value">${gold_fields.get('gold_maliyat', 0):.2f}</span>
                </div>
                <div class="gold-item">
                    <span class="label">Total Weight:</span>
                    <span class="value">{gold_fields.get('gold_total_weight', 0):.3f}g</span>
                </div>
            </div>
        </div>
        """
    
    # Generate complete HTML
    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice #{card_data['invoice_number']}</title>
        <style>
            * {{
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }}
            
            body {{
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                padding: 20px;
                color: {qr_card.text_color};
            }}
            
            .card {{
                max-width: 600px;
                margin: 0 auto;
                background: {style['background']};
                backdrop-filter: {style['backdrop_filter']};
                border: {style['border']};
                border-radius: 20px;
                box-shadow: {style['box_shadow']};
                padding: 30px;
                animation: slideIn 0.5s ease-out;
            }}
            
            @keyframes slideIn {{
                from {{
                    opacity: 0;
                    transform: translateY(30px);
                }}
                to {{
                    opacity: 1;
                    transform: translateY(0);
                }}
            }}
            
            .header {{
                text-align: center;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 2px solid {qr_card.accent_color};
            }}
            
            .invoice-number {{
                font-size: 2em;
                font-weight: bold;
                color: {qr_card.accent_color};
                margin-bottom: 10px;
            }}
            
            .invoice-type {{
                font-size: 1.2em;
                text-transform: uppercase;
                letter-spacing: 2px;
                opacity: 0.8;
            }}
            
            .customer-info {{
                background: rgba(255,255,255,0.1);
                padding: 20px;
                border-radius: 15px;
                margin-bottom: 25px;
            }}
            
            .customer-name {{
                font-size: 1.3em;
                font-weight: bold;
                margin-bottom: 10px;
            }}
            
            .customer-details {{
                opacity: 0.9;
                line-height: 1.6;
            }}
            
            .items-section {{
                margin-bottom: 25px;
            }}
            
            .section-title {{
                font-size: 1.4em;
                font-weight: bold;
                margin-bottom: 15px;
                color: {qr_card.accent_color};
            }}
            
            .item {{
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px;
                background: rgba(255,255,255,0.05);
                border-radius: 10px;
                margin-bottom: 10px;
                border-left: 4px solid {qr_card.accent_color};
            }}
            
            .item-info {{
                flex: 1;
            }}
            
            .item-name {{
                font-weight: bold;
                margin-bottom: 5px;
            }}
            
            .item-details {{
                opacity: 0.8;
                font-size: 0.9em;
            }}
            
            .item-weight {{
                opacity: 0.7;
                font-size: 0.8em;
                margin-top: 3px;
            }}
            
            .item-images {{
                display: flex;
                gap: 5px;
            }}
            
            .item-image {{
                width: 40px;
                height: 40px;
                border-radius: 8px;
                object-fit: cover;
                border: 2px solid rgba(255,255,255,0.3);
            }}
            
            .gold-fields {{
                background: rgba(255,215,0,0.1);
                padding: 20px;
                border-radius: 15px;
                margin-bottom: 25px;
                border: 2px solid rgba(255,215,0,0.3);
            }}
            
            .gold-grid {{
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                margin-top: 15px;
            }}
            
            .gold-item {{
                display: flex;
                justify-content: space-between;
                padding: 10px;
                background: rgba(255,255,255,0.1);
                border-radius: 8px;
            }}
            
            .label {{
                font-weight: bold;
            }}
            
            .value {{
                color: {qr_card.accent_color};
                font-weight: bold;
            }}
            
            .totals {{
                background: rgba(255,255,255,0.1);
                padding: 20px;
                border-radius: 15px;
                margin-bottom: 25px;
            }}
            
            .total-row {{
                display: flex;
                justify-content: space-between;
                margin-bottom: 10px;
                padding: 5px 0;
            }}
            
            .total-row.grand-total {{
                font-size: 1.3em;
                font-weight: bold;
                border-top: 2px solid {qr_card.accent_color};
                padding-top: 15px;
                margin-top: 15px;
                color: {qr_card.accent_color};
            }}
            
            .footer {{
                text-align: center;
                opacity: 0.7;
                font-size: 0.9em;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid rgba(255,255,255,0.2);
            }}
            
            .status-badge {{
                display: inline-block;
                padding: 5px 15px;
                border-radius: 20px;
                font-size: 0.8em;
                font-weight: bold;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin: 5px;
            }}
            
            .status-paid {{
                background: #10b981;
                color: white;
            }}
            
            .status-unpaid {{
                background: #ef4444;
                color: white;
            }}
            
            .status-partial {{
                background: #f59e0b;
                color: white;
            }}
            
            @media (max-width: 600px) {{
                .card {{
                    margin: 10px;
                    padding: 20px;
                }}
                
                .invoice-number {{
                    font-size: 1.5em;
                }}
                
                .gold-grid {{
                    grid-template-columns: 1fr;
                }}
                
                .item {{
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 10px;
                }}
                
                .item-images {{
                    align-self: flex-end;
                }}
            }}
        </style>
    </head>
    <body>
        <div class="card">
            <div class="header">
                <div class="invoice-number">#{card_data['invoice_number']}</div>
                <div class="invoice-type">{card_data['invoice_type']} Invoice</div>
            </div>
            
            <div class="customer-info">
                <div class="customer-name">{card_data['customer_info']['name'] or 'Walk-in Customer'}</div>
                <div class="customer-details">
                    {f"Phone: {card_data['customer_info']['phone']}<br>" if card_data['customer_info']['phone'] else ''}
                    {f"Email: {card_data['customer_info']['email']}<br>" if card_data['customer_info']['email'] else ''}
                    {f"Address: {card_data['customer_info']['address']}" if card_data['customer_info']['address'] else ''}
                </div>
            </div>
            
            <div class="items-section">
                <div class="section-title">Items</div>
                {items_html}
            </div>
            
            {gold_fields_html}
            
            <div class="totals">
                <div class="section-title">Summary</div>
                <div class="total-row">
                    <span>Subtotal:</span>
                    <span>${card_data['amounts']['subtotal']:.2f}</span>
                </div>
                {f'<div class="total-row"><span>Tax:</span><span>${card_data["amounts"]["tax_amount"]:.2f}</span></div>' if card_data['amounts']['tax_amount'] > 0 else ''}
                {f'<div class="total-row"><span>Discount:</span><span>-${card_data["amounts"]["discount_amount"]:.2f}</span></div>' if card_data['amounts']['discount_amount'] > 0 else ''}
                <div class="total-row grand-total">
                    <span>Total:</span>
                    <span>${card_data['amounts']['total_amount']:.2f}</span>
                </div>
                
                <div style="margin-top: 15px;">
                    <span class="status-badge status-{card_data['status']['payment_status'].replace('_', '-')}">{card_data['status']['payment_status'].replace('_', ' ').title()}</span>
                    <span class="status-badge" style="background: {qr_card.accent_color}; color: white;">{card_data['status']['invoice_status'].title()}</span>
                </div>
            </div>
            
            <div class="footer">
                <div>Invoice Date: {datetime.fromisoformat(card_data['dates']['created_at']).strftime('%B %d, %Y')}</div>
                <div style="margin-top: 10px; opacity: 0.5;">
                    Thank you for your business!
                </div>
            </div>
        </div>
    </body>
    </html>
    """
    
    return html_content