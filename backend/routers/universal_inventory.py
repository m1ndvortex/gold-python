"""
Universal Inventory Management Router
Comprehensive API endpoints for universal inventory management with unlimited nested categories,
custom attributes, advanced search, SKU/barcode/QR management, and image support.
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Response
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_active_user
from models import User
from models_universal import UniversalCategory, UniversalInventoryItem, InventoryMovement
from schemas_universal import (
    UniversalCategoryCreate, UniversalCategoryUpdate, UniversalCategory as CategorySchema,
    UniversalCategoryWithChildren, UniversalCategoryWithStats,
    UniversalInventoryItemCreate, UniversalInventoryItemUpdate, 
    UniversalInventoryItem as ItemSchema, UniversalInventoryItemWithCategory,
    UniversalInventoryItemWithImages, InventoryMovementCreate, InventoryMovement as MovementSchema,
    InventorySearchFilters, CategorySearchFilters, StockUpdateRequest, StockAdjustmentRequest,
    BulkUpdateRequest, BulkDeleteRequest, BulkTagRequest, LowStockAlert,
    InventoryItemsResponse, CategoriesResponse, MovementsResponse,
    InventoryAnalytics, StockSummary
)
from services.universal_inventory_service import UniversalInventoryService
import uuid

router = APIRouter(prefix="/universal-inventory", tags=["Universal Inventory"])

# Category Management Endpoints

@router.post("/categories", response_model=CategorySchema, status_code=status.HTTP_201_CREATED)
async def create_category(
    category: UniversalCategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new category with LTREE path management"""
    service = UniversalInventoryService(db)
    return service.create_category(category, current_user.id)

@router.get("/categories", response_model=List[UniversalCategoryWithChildren])
async def get_categories(
    parent_id: Optional[str] = Query(None, description="Filter by parent category ID"),
    search: Optional[str] = Query(None, description="Search term"),
    level: Optional[int] = Query(None, description="Filter by category level"),
    business_type: Optional[str] = Query(None, description="Filter by business type"),
    include_stats: bool = Query(False, description="Include item statistics"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get categories in tree structure with optional filtering"""
    service = UniversalInventoryService(db)
    
    filters = CategorySearchFilters(
        parent_id=uuid.UUID(parent_id) if parent_id else None,
        search=search,
        level=level,
        business_type=business_type
    )
    
    return service.get_categories_tree(filters)

@router.get("/categories/tree", response_model=List[UniversalCategoryWithStats])
async def get_categories_tree(
    include_stats: bool = Query(True, description="Include item statistics"),
    business_type: Optional[str] = Query(None, description="Filter by business type"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get complete category tree with statistics"""
    service = UniversalInventoryService(db)
    
    filters = CategorySearchFilters(business_type=business_type) if business_type else None
    return service.get_categories_tree(filters)

@router.get("/categories/{category_id}", response_model=UniversalCategoryWithChildren)
async def get_category(
    category_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific category with its children"""
    category = db.query(UniversalCategory).filter(
        UniversalCategory.id == uuid.UUID(category_id),
        UniversalCategory.is_active == True
    ).first()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    return category

@router.put("/categories/{category_id}", response_model=CategorySchema)
async def update_category(
    category_id: str,
    category_update: UniversalCategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update a category"""
    service = UniversalInventoryService(db)
    return service.update_category(uuid.UUID(category_id), category_update, current_user.id)

@router.delete("/categories/{category_id}")
async def delete_category(
    category_id: str,
    force: bool = Query(False, description="Force delete even if has items"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete a category"""
    service = UniversalInventoryService(db)
    success = service.delete_category(uuid.UUID(category_id), force)
    
    if success:
        return {"message": "Category deleted successfully"}
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete category"
        )

# Inventory Item Management Endpoints

@router.post("/items", response_model=UniversalInventoryItemWithCategory, status_code=status.HTTP_201_CREATED)
async def create_inventory_item(
    item: UniversalInventoryItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new inventory item"""
    service = UniversalInventoryService(db)
    return service.create_inventory_item(item, current_user.id)

@router.get("/items", response_model=InventoryItemsResponse)
async def search_inventory_items(
    # Search parameters
    search: Optional[str] = Query(None, description="Search term for name, description, SKU, barcode"),
    category_id: Optional[str] = Query(None, description="Filter by category ID"),
    category_path: Optional[str] = Query(None, description="Filter by category path (includes subcategories)"),
    tags: Optional[List[str]] = Query(None, description="Filter by tags"),
    
    # Stock filters
    min_stock: Optional[float] = Query(None, description="Minimum stock quantity"),
    max_stock: Optional[float] = Query(None, description="Maximum stock quantity"),
    low_stock_only: bool = Query(False, description="Show only low stock items"),
    out_of_stock_only: bool = Query(False, description="Show only out of stock items"),
    
    # Price filters
    min_price: Optional[float] = Query(None, description="Minimum price"),
    max_price: Optional[float] = Query(None, description="Maximum price"),
    
    # Other filters
    business_type: Optional[str] = Query(None, description="Filter by business type"),
    has_images: Optional[bool] = Query(None, description="Filter items with/without images"),
    is_active: bool = Query(True, description="Filter by active status"),
    
    # Sorting and pagination
    sort_by: str = Query("name", description="Sort field"),
    sort_order: str = Query("asc", description="Sort order: asc, desc"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(50, ge=1, le=100, description="Items per page"),
    
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Search and filter inventory items with advanced options"""
    service = UniversalInventoryService(db)
    
    filters = InventorySearchFilters(
        search=search,
        category_id=uuid.UUID(category_id) if category_id else None,
        category_path=category_path,
        tags=tags,
        min_stock=min_stock,
        max_stock=max_stock,
        low_stock_only=low_stock_only,
        out_of_stock_only=out_of_stock_only,
        min_price=min_price,
        max_price=max_price,
        business_type=business_type,
        has_images=has_images,
        is_active=is_active,
        sort_by=sort_by,
        sort_order=sort_order
    )
    
    skip = (page - 1) * per_page
    items, total = service.search_inventory_items(filters, skip, per_page)
    
    return InventoryItemsResponse(
        items=items,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=(total + per_page - 1) // per_page,
        has_next=page * per_page < total,
        has_prev=page > 1
    )

@router.get("/items/{item_id}", response_model=UniversalInventoryItemWithCategory)
async def get_inventory_item(
    item_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific inventory item"""
    item = db.query(UniversalInventoryItem).filter(
        UniversalInventoryItem.id == uuid.UUID(item_id),
        UniversalInventoryItem.is_active == True
    ).first()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory item not found"
        )
    
    return item

@router.put("/items/{item_id}", response_model=UniversalInventoryItemWithCategory)
async def update_inventory_item(
    item_id: str,
    item_update: UniversalInventoryItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update an inventory item"""
    service = UniversalInventoryService(db)
    return service.update_inventory_item(uuid.UUID(item_id), item_update, current_user.id)

@router.patch("/items/{item_id}/stock", response_model=UniversalInventoryItemWithCategory)
async def update_item_stock(
    item_id: str,
    stock_update: StockUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update inventory item stock level with movement tracking"""
    service = UniversalInventoryService(db)
    return service.update_stock(uuid.UUID(item_id), stock_update, current_user.id)

@router.patch("/items/{item_id}/stock/adjust", response_model=UniversalInventoryItemWithCategory)
async def adjust_item_stock(
    item_id: str,
    adjustment: StockAdjustmentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Adjust inventory item stock to specific quantity"""
    # Get current stock
    item = db.query(UniversalInventoryItem).filter(
        UniversalInventoryItem.id == uuid.UUID(item_id),
        UniversalInventoryItem.is_active == True
    ).first()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory item not found"
        )
    
    # Calculate change needed
    quantity_change = adjustment.new_quantity - item.stock_quantity
    
    stock_update = StockUpdateRequest(
        quantity_change=quantity_change,
        reason=adjustment.reason,
        notes=adjustment.notes,
        reference_type='adjustment'
    )
    
    service = UniversalInventoryService(db)
    return service.update_stock(uuid.UUID(item_id), stock_update, current_user.id)

@router.delete("/items/{item_id}")
async def delete_inventory_item(
    item_id: str,
    force: bool = Query(False, description="Force delete even if used in invoices"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete an inventory item (soft delete if used in invoices)"""
    item = db.query(UniversalInventoryItem).filter(
        UniversalInventoryItem.id == uuid.UUID(item_id)
    ).first()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory item not found"
        )
    
    # Check if item is used in invoices (would need to check invoice_items_new table)
    # For now, just do soft delete
    item.is_active = False
    db.commit()
    
    return {"message": "Inventory item deactivated successfully"}

# Stock Movement Endpoints

@router.get("/items/{item_id}/movements", response_model=List[MovementSchema])
async def get_item_movements(
    item_id: str,
    limit: int = Query(50, ge=1, le=100, description="Number of movements to return"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get stock movements for a specific item"""
    movements = db.query(InventoryMovement).filter(
        InventoryMovement.inventory_item_id == uuid.UUID(item_id)
    ).order_by(InventoryMovement.movement_date.desc()).limit(limit).all()
    
    return movements

@router.get("/movements", response_model=MovementsResponse)
async def get_all_movements(
    movement_type: Optional[str] = Query(None, description="Filter by movement type"),
    item_id: Optional[str] = Query(None, description="Filter by item ID"),
    reference_type: Optional[str] = Query(None, description="Filter by reference type"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(50, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all stock movements with filtering"""
    query = db.query(InventoryMovement)
    
    if movement_type:
        query = query.filter(InventoryMovement.movement_type == movement_type)
    
    if item_id:
        query = query.filter(InventoryMovement.inventory_item_id == uuid.UUID(item_id))
    
    if reference_type:
        query = query.filter(InventoryMovement.reference_type == reference_type)
    
    total = query.count()
    skip = (page - 1) * per_page
    movements = query.order_by(InventoryMovement.movement_date.desc()).offset(skip).limit(per_page).all()
    
    return MovementsResponse(
        items=movements,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=(total + per_page - 1) // per_page,
        has_next=page * per_page < total,
        has_prev=page > 1
    )

# Stock Alerts and Monitoring

@router.get("/alerts/low-stock", response_model=List[LowStockAlert])
async def get_low_stock_alerts(
    threshold_multiplier: float = Query(1.0, ge=0.1, le=5.0, description="Threshold multiplier"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get items with low stock levels"""
    service = UniversalInventoryService(db)
    return service.get_low_stock_alerts(threshold_multiplier)

@router.get("/alerts/out-of-stock", response_model=List[UniversalInventoryItemWithCategory])
async def get_out_of_stock_items(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get items that are out of stock"""
    items = db.query(UniversalInventoryItem).filter(
        UniversalInventoryItem.is_active == True,
        UniversalInventoryItem.stock_quantity <= 0
    ).all()
    
    return items

# Bulk Operations

@router.post("/items/bulk-update")
async def bulk_update_items(
    request: BulkUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Bulk update multiple items"""
    service = UniversalInventoryService(db)
    updated_count = service.bulk_update_items(request, current_user.id)
    
    return {
        "message": f"Updated {updated_count} field(s) across {len(request.item_ids)} items",
        "updated_count": updated_count
    }

@router.post("/items/bulk-tag")
async def bulk_tag_items(
    request: BulkTagRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Bulk add/remove/replace tags for multiple items"""
    service = UniversalInventoryService(db)
    updated_count = service.bulk_tag_items(request, current_user.id)
    
    return {
        "message": f"Updated tags for {updated_count} items",
        "updated_count": updated_count
    }

@router.delete("/items/bulk-delete")
async def bulk_delete_items(
    request: BulkDeleteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Bulk delete multiple items"""
    items = db.query(UniversalInventoryItem).filter(
        UniversalInventoryItem.id.in_(request.item_ids)
    ).all()
    
    if len(items) != len(request.item_ids):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Some items not found"
        )
    
    # Soft delete all items
    for item in items:
        item.is_active = False
    
    db.commit()
    
    return {
        "message": f"Deactivated {len(items)} items",
        "deactivated_count": len(items)
    }

# Barcode and QR Code Generation

@router.get("/items/{item_id}/barcode", response_class=Response)
async def get_item_barcode(
    item_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Generate and return barcode image for item"""
    service = UniversalInventoryService(db)
    barcode_bytes = service.generate_barcode_image(uuid.UUID(item_id))
    
    return Response(
        content=barcode_bytes,
        media_type="image/png",
        headers={"Content-Disposition": f"inline; filename=barcode_{item_id}.png"}
    )

@router.get("/items/{item_id}/qrcode", response_class=Response)
async def get_item_qr_code(
    item_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Generate and return QR code image for item"""
    service = UniversalInventoryService(db)
    qr_code_bytes = service.generate_qr_code_image(uuid.UUID(item_id))
    
    return Response(
        content=qr_code_bytes,
        media_type="image/png",
        headers={"Content-Disposition": f"inline; filename=qrcode_{item_id}.png"}
    )

# Analytics and Reporting

@router.get("/analytics", response_model=InventoryAnalytics)
async def get_inventory_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get comprehensive inventory analytics"""
    service = UniversalInventoryService(db)
    analytics_data = service.get_inventory_analytics()
    
    return InventoryAnalytics(**analytics_data)

@router.get("/summary", response_model=StockSummary)
async def get_inventory_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get inventory summary statistics"""
    from sqlalchemy import func
    
    # Basic counts
    total_items = db.query(UniversalInventoryItem).filter(
        UniversalInventoryItem.is_active == True
    ).count()
    
    categories_count = db.query(UniversalCategory).filter(
        UniversalCategory.is_active == True
    ).count()
    
    # Stock analysis
    low_stock_items = db.query(UniversalInventoryItem).filter(
        UniversalInventoryItem.is_active == True,
        UniversalInventoryItem.stock_quantity <= UniversalInventoryItem.low_stock_threshold
    ).count()
    
    out_of_stock_items = db.query(UniversalInventoryItem).filter(
        UniversalInventoryItem.is_active == True,
        UniversalInventoryItem.stock_quantity <= 0
    ).count()
    
    # Value calculation
    total_value = db.query(
        func.sum(UniversalInventoryItem.stock_quantity * UniversalInventoryItem.cost_price)
    ).filter(UniversalInventoryItem.is_active == True).scalar() or 0
    
    # Recent movements count
    from datetime import datetime, timedelta
    recent_date = datetime.now() - timedelta(days=7)
    recent_movements = db.query(InventoryMovement).filter(
        InventoryMovement.movement_date >= recent_date
    ).count()
    
    return StockSummary(
        total_items=total_items,
        total_value=total_value,
        low_stock_items=low_stock_items,
        out_of_stock_items=out_of_stock_items,
        categories_count=categories_count,
        recent_movements=recent_movements
    )

# Search Suggestions

@router.get("/search/suggestions")
async def get_search_suggestions(
    query: str = Query(..., min_length=2, description="Search query"),
    limit: int = Query(10, ge=1, le=20, description="Number of suggestions"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get search suggestions for inventory items"""
    search_term = f"%{query}%"
    
    # Search in names, SKUs, and tags
    items = db.query(UniversalInventoryItem).filter(
        UniversalInventoryItem.is_active == True,
        or_(
            UniversalInventoryItem.name.ilike(search_term),
            UniversalInventoryItem.sku.ilike(search_term),
            UniversalInventoryItem.tags.op('&&')(f'{{{query}}}')
        )
    ).limit(limit).all()
    
    suggestions = []
    for item in items:
        suggestions.append({
            'id': str(item.id),
            'name': item.name,
            'sku': item.sku,
            'type': 'item'
        })
    
    # Also search categories
    categories = db.query(UniversalCategory).filter(
        UniversalCategory.is_active == True,
        UniversalCategory.name.ilike(search_term)
    ).limit(limit // 2).all()
    
    for category in categories:
        suggestions.append({
            'id': str(category.id),
            'name': category.name,
            'type': 'category'
        })
    
    return {'suggestions': suggestions[:limit]}