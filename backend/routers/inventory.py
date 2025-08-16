from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_
from database import get_db
import models
import schemas
from auth import get_current_active_user
import os
import uuid
from pathlib import Path

router = APIRouter(prefix="/inventory", tags=["inventory"])

# File upload configuration
UPLOAD_DIR = Path("uploads/inventory")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

def save_uploaded_file(file: UploadFile) -> str:
    """Save uploaded file and return the file path"""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
    
    # Check file extension
    file_extension = Path(file.filename).suffix.lower()
    if file_extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400, 
            detail=f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Generate unique filename
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = UPLOAD_DIR / unique_filename
    
    # Save file
    with open(file_path, "wb") as buffer:
        content = file.file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File too large")
        buffer.write(content)
    
    return f"/uploads/inventory/{unique_filename}"

# Category Management Endpoints

@router.post("/categories", response_model=schemas.Category)
async def create_category(
    category: schemas.CategoryCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Create a new category"""
    # Check if parent category exists if parent_id is provided
    if category.parent_id:
        parent = db.query(models.Category).filter(models.Category.id == category.parent_id).first()
        if not parent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent category not found"
            )
    
    # Check if category name already exists at the same level
    existing_category = db.query(models.Category).filter(
        and_(
            models.Category.name == category.name,
            models.Category.parent_id == category.parent_id
        )
    ).first()
    
    if existing_category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category with this name already exists at this level"
        )
    
    db_category = models.Category(**category.model_dump())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    
    return db_category

@router.get("/categories", response_model=List[schemas.CategoryWithChildren])
async def get_categories(
    parent_id: Optional[str] = None,
    include_children: bool = True,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get categories with optional hierarchical structure"""
    query = db.query(models.Category)
    
    if parent_id:
        query = query.filter(models.Category.parent_id == parent_id)
    else:
        # Get root categories (no parent)
        query = query.filter(models.Category.parent_id.is_(None))
    
    if include_children:
        query = query.options(joinedload(models.Category.children))
    
    categories = query.all()
    return categories

@router.get("/categories/{category_id}", response_model=schemas.CategoryWithChildren)
async def get_category(
    category_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get a specific category with its children"""
    category = db.query(models.Category).options(
        joinedload(models.Category.children),
        joinedload(models.Category.parent)
    ).filter(models.Category.id == category_id).first()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    return category

@router.put("/categories/{category_id}", response_model=schemas.Category)
async def update_category(
    category_id: str,
    category_update: schemas.CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Update a category"""
    db_category = db.query(models.Category).filter(models.Category.id == category_id).first()
    
    if not db_category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    # Check if parent category exists if parent_id is being updated
    if category_update.parent_id:
        parent = db.query(models.Category).filter(models.Category.id == category_update.parent_id).first()
        if not parent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent category not found"
            )
        
        # Prevent circular reference
        if str(category_update.parent_id) == category_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Category cannot be its own parent"
            )
    
    # Update fields
    update_data = category_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_category, field, value)
    
    db.commit()
    db.refresh(db_category)
    
    return db_category

@router.delete("/categories/{category_id}")
async def delete_category(
    category_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Delete a category (only if no inventory items are associated)"""
    db_category = db.query(models.Category).filter(models.Category.id == category_id).first()
    
    if not db_category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    # Check if category has inventory items
    items_count = db.query(models.InventoryItem).filter(
        models.InventoryItem.category_id == category_id
    ).count()
    
    if items_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete category with {items_count} inventory items"
        )
    
    # Check if category has children
    children_count = db.query(models.Category).filter(
        models.Category.parent_id == category_id
    ).count()
    
    if children_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete category with {children_count} subcategories"
        )
    
    db.delete(db_category)
    db.commit()
    
    return {"message": "Category deleted successfully"}

# Inventory Item Management Endpoints

@router.post("/items", response_model=schemas.InventoryItemWithCategory)
async def create_inventory_item(
    item: schemas.InventoryItemCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Create a new inventory item"""
    # Validate category exists if provided
    if item.category_id:
        category = db.query(models.Category).filter(models.Category.id == item.category_id).first()
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found"
            )
    
    # Validate business rules
    if item.weight_grams <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Weight must be greater than 0"
        )
    
    if item.purchase_price < 0 or item.sell_price < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Prices cannot be negative"
        )
    
    if item.stock_quantity < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Stock quantity cannot be negative"
        )
    
    db_item = models.InventoryItem(**item.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    
    # Load with category for response
    db_item = db.query(models.InventoryItem).options(
        joinedload(models.InventoryItem.category)
    ).filter(models.InventoryItem.id == db_item.id).first()
    
    return db_item

@router.post("/items/upload-image")
async def upload_item_image(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_active_user)
):
    """Upload an image for inventory item"""
    try:
        image_url = save_uploaded_file(file)
        return {"image_url": image_url, "message": "Image uploaded successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/items", response_model=List[schemas.InventoryItemWithCategory])
async def get_inventory_items(
    skip: int = 0,
    limit: int = 100,
    category_id: Optional[str] = None,
    search: Optional[str] = None,
    low_stock_only: bool = False,
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get inventory items with filtering and pagination"""
    query = db.query(models.InventoryItem).options(
        joinedload(models.InventoryItem.category)
    )
    
    # Apply filters
    if active_only:
        query = query.filter(models.InventoryItem.is_active == True)
    
    if category_id:
        query = query.filter(models.InventoryItem.category_id == category_id)
    
    if search:
        query = query.filter(
            or_(
                models.InventoryItem.name.ilike(f"%{search}%"),
                models.InventoryItem.description.ilike(f"%{search}%")
            )
        )
    
    if low_stock_only:
        query = query.filter(
            models.InventoryItem.stock_quantity <= models.InventoryItem.min_stock_level
        )
    
    # Apply pagination
    items = query.offset(skip).limit(limit).all()
    return items

@router.get("/items/{item_id}", response_model=schemas.InventoryItemWithCategory)
async def get_inventory_item(
    item_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get a specific inventory item"""
    item = db.query(models.InventoryItem).options(
        joinedload(models.InventoryItem.category)
    ).filter(models.InventoryItem.id == item_id).first()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory item not found"
        )
    
    return item

@router.put("/items/{item_id}", response_model=schemas.InventoryItemWithCategory)
async def update_inventory_item(
    item_id: str,
    item_update: schemas.InventoryItemUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Update an inventory item"""
    db_item = db.query(models.InventoryItem).filter(models.InventoryItem.id == item_id).first()
    
    if not db_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory item not found"
        )
    
    # Validate category exists if being updated
    if item_update.category_id:
        category = db.query(models.Category).filter(models.Category.id == item_update.category_id).first()
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found"
            )
    
    # Validate business rules
    update_data = item_update.model_dump(exclude_unset=True)
    
    if 'weight_grams' in update_data and update_data['weight_grams'] <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Weight must be greater than 0"
        )
    
    if 'purchase_price' in update_data and update_data['purchase_price'] < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Purchase price cannot be negative"
        )
    
    if 'sell_price' in update_data and update_data['sell_price'] < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sell price cannot be negative"
        )
    
    if 'stock_quantity' in update_data and update_data['stock_quantity'] < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Stock quantity cannot be negative"
        )
    
    # Update fields
    for field, value in update_data.items():
        setattr(db_item, field, value)
    
    db.commit()
    db.refresh(db_item)
    
    # Load with category for response
    db_item = db.query(models.InventoryItem).options(
        joinedload(models.InventoryItem.category)
    ).filter(models.InventoryItem.id == item_id).first()
    
    return db_item

@router.patch("/items/{item_id}/stock", response_model=schemas.InventoryItemWithCategory)
async def update_item_stock(
    item_id: str,
    stock_update: schemas.StockUpdateRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Update inventory item stock level"""
    db_item = db.query(models.InventoryItem).filter(models.InventoryItem.id == item_id).first()
    
    if not db_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory item not found"
        )
    
    new_stock = db_item.stock_quantity + stock_update.quantity_change
    
    if new_stock < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient stock. Current: {db_item.stock_quantity}, Requested change: {stock_update.quantity_change}"
        )
    
    db_item.stock_quantity = new_stock
    db.commit()
    db.refresh(db_item)
    
    # Load with category for response
    db_item = db.query(models.InventoryItem).options(
        joinedload(models.InventoryItem.category)
    ).filter(models.InventoryItem.id == item_id).first()
    
    return db_item

@router.delete("/items/{item_id}")
async def delete_inventory_item(
    item_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Soft delete an inventory item (set is_active to False)"""
    db_item = db.query(models.InventoryItem).filter(models.InventoryItem.id == item_id).first()
    
    if not db_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory item not found"
        )
    
    # Check if item is used in any invoices
    invoice_items_count = db.query(models.InvoiceItem).filter(
        models.InvoiceItem.inventory_item_id == item_id
    ).count()
    
    if invoice_items_count > 0:
        # Soft delete - set is_active to False
        db_item.is_active = False
        db.commit()
        return {"message": "Inventory item deactivated (used in invoices)"}
    else:
        # Hard delete if not used in any invoices
        db.delete(db_item)
        db.commit()
        return {"message": "Inventory item deleted successfully"}

# Stock Alert Endpoints

@router.get("/alerts/low-stock", response_model=List[schemas.LowStockAlert])
async def get_low_stock_alerts(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get all items with low stock levels"""
    low_stock_items = db.query(models.InventoryItem).options(
        joinedload(models.InventoryItem.category)
    ).filter(
        and_(
            models.InventoryItem.is_active == True,
            models.InventoryItem.stock_quantity <= models.InventoryItem.min_stock_level
        )
    ).all()
    
    alerts = []
    for item in low_stock_items:
        alert = schemas.LowStockAlert(
            item_id=item.id,
            item_name=item.name,
            current_stock=item.stock_quantity,
            min_stock_level=item.min_stock_level,
            category_name=item.category.name if item.category else None
        )
        alerts.append(alert)
    
    return alerts

@router.get("/stats")
async def get_inventory_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get inventory statistics"""
    from sqlalchemy import func
    
    # Total items
    total_items = db.query(models.InventoryItem).filter(
        models.InventoryItem.is_active == True
    ).count()
    
    # Low stock items count
    low_stock_count = db.query(models.InventoryItem).filter(
        and_(
            models.InventoryItem.is_active == True,
            models.InventoryItem.stock_quantity <= models.InventoryItem.min_stock_level
        )
    ).count()
    
    # Total inventory value
    inventory_value = db.query(
        func.sum(models.InventoryItem.stock_quantity * models.InventoryItem.purchase_price)
    ).filter(models.InventoryItem.is_active == True).scalar() or 0
    
    # Total categories
    total_categories = db.query(models.Category).count()
    
    return {
        "total_items": total_items,
        "low_stock_items": low_stock_count,
        "total_inventory_value": float(inventory_value),
        "total_categories": total_categories
    }