from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func
from database import get_db
import models
import schemas
from schemas_inventory_universal import *
from oauth2_middleware import get_current_user, require_permission, require_any_permission
from services.inventory_service import UniversalInventoryService
import os
import uuid
from pathlib import Path
import json
from datetime import datetime

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
    current_user: models.User = Depends(require_any_permission(["manage_inventory", "manage_categories"]))
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
    current_user: models.User = Depends(get_current_user)
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

@router.get("/categories/tree", response_model=List[schemas.CategoryWithStats])
async def get_category_tree(
    include_stats: bool = True,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get complete category tree with statistics - optimized version"""
    from sqlalchemy.orm import selectinload
    
    # Optimized query with eager loading and limited data
    query = db.query(models.Category).filter(
        models.Category.is_active == True
    ).order_by(models.Category.sort_order, models.Category.name)
    
    # Use selectinload for better performance if there are relationships
    categories = query.all()
    
    # Early return for empty categories
    if not categories:
        return []
    
    count_dict = {}
    if include_stats:
        # Single optimized query for product counts
        product_counts = db.query(
            models.InventoryItem.category_id,
            func.count(models.InventoryItem.id).label('count')
        ).filter(
            models.InventoryItem.is_active == True,
            models.InventoryItem.category_id.in_([c.id for c in categories])
        ).group_by(models.InventoryItem.category_id).all()
        
        count_dict = {str(cat_id): count for cat_id, count in product_counts}
    
    # Build tree structure with optimized approach
    category_dict = {}
    root_categories = []
    
    # First pass: create all category objects
    for category in categories:
        category_data = {
            'id': category.id,
            'name': category.name,
            'description': category.description,
            'parent_id': category.parent_id,
            'sort_order': category.sort_order,
            'is_active': category.is_active,
            'created_at': category.created_at,
            'updated_at': category.updated_at,
            'children': [],
            'product_count': count_dict.get(str(category.id), 0)
        }
        category_dict[str(category.id)] = category_data
        
        # Add to root if no parent
        if not category.parent_id:
            root_categories.append(category_data)
    
    # Second pass: build parent-child relationships
    for category in categories:
        if category.parent_id:
            parent = category_dict.get(str(category.parent_id))
            if parent:
                parent['children'].append(category_dict[str(category.id)])
    
    return root_categories

@router.get("/categories/{category_id}", response_model=schemas.CategoryWithChildren)
async def get_category(
    category_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
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
    current_user: models.User = Depends(get_current_user)
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
    current_user: models.User = Depends(get_current_user)
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

# Enhanced Category Management Endpoints

@router.post("/categories/bulk-update")
async def bulk_update_categories(
    request: schemas.CategoryBulkUpdateRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Bulk update multiple categories"""
    categories = db.query(models.Category).filter(
        models.Category.id.in_(request.category_ids)
    ).all()
    
    if len(categories) != len(request.category_ids):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Some categories not found"
        )
    
    updated_count = 0
    for category in categories:
        for field, value in request.updates.items():
            if hasattr(category, field):
                setattr(category, field, value)
                updated_count += 1
    
    db.commit()
    
    return {"message": f"Updated {updated_count} categories", "updated_count": updated_count}

@router.post("/categories/reorder")
async def reorder_category(
    request: schemas.CategoryReorderRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Reorder category (drag and drop support)"""
    category = db.query(models.Category).filter(
        models.Category.id == request.category_id
    ).first()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    # Update parent if changed
    if request.new_parent_id != category.parent_id:
        if request.new_parent_id:
            parent = db.query(models.Category).filter(
                models.Category.id == request.new_parent_id
            ).first()
            if not parent:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Parent category not found"
                )
        
        category.parent_id = request.new_parent_id
    
    # Update sort order
    category.sort_order = request.new_sort_order
    
    db.commit()
    db.refresh(category)
    
    return {"message": "Category reordered successfully", "category": category}

# Category Template Management

@router.post("/category-templates", response_model=schemas.CategoryTemplate)
async def create_category_template(
    template: schemas.CategoryTemplateCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Create a new category template"""
    db_template = models.CategoryTemplate(
        **template.model_dump(),
        created_by=current_user.id
    )
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    
    return db_template

@router.get("/category-templates", response_model=List[schemas.CategoryTemplateWithCreator])
async def get_category_templates(
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get all category templates"""
    query = db.query(models.CategoryTemplate).options(
        joinedload(models.CategoryTemplate.creator)
    )
    
    if active_only:
        query = query.filter(models.CategoryTemplate.is_active == True)
    
    templates = query.order_by(models.CategoryTemplate.name).all()
    return templates

@router.post("/categories/from-template/{template_id}", response_model=schemas.Category)
async def create_category_from_template(
    template_id: str,
    category_data: schemas.CategoryCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Create a category from a template"""
    template = db.query(models.CategoryTemplate).filter(
        models.CategoryTemplate.id == template_id,
        models.CategoryTemplate.is_active == True
    ).first()
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    # Merge template data with provided data
    template_data = template.template_data
    category_dict = category_data.model_dump()
    
    # Apply template defaults
    if 'attributes' in template_data:
        category_dict['attributes'] = template_data['attributes']
    if 'icon' in template_data:
        category_dict.setdefault('icon', template_data['icon'])
    if 'color' in template_data:
        category_dict.setdefault('color', template_data['color'])
    
    db_category = models.Category(**category_dict)
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    
    return db_category

# Universal Inventory Management Endpoints

@router.post("/universal/items", response_model=UniversalInventoryItemWithCategory)
async def create_universal_inventory_item(
    item: UniversalInventoryItemCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("manage_inventory"))
):
    """Create a new universal inventory item with enhanced features"""
    service = UniversalInventoryService(db)
    
    try:
        db_item = service.create_inventory_item(
            item_data=item.model_dump(),
            user_id=str(current_user.id)
        )
        
        # Load with category for response
        from models_universal import InventoryItem as UniversalInventoryItemModel, Category as UniversalCategoryModel
        db_item = db.query(UniversalInventoryItemModel).options(
            joinedload(UniversalInventoryItemModel.category)
        ).filter(UniversalInventoryItemModel.id == db_item.id).first()
        
        return db_item
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.put("/universal/items/{item_id}", response_model=UniversalInventoryItemWithCategory)
async def update_universal_inventory_item(
    item_id: str,
    item_update: UniversalInventoryItemUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Update a universal inventory item"""
    service = UniversalInventoryService(db)
    
    try:
        db_item = service.update_inventory_item(
            item_id=item_id,
            update_data=item_update.model_dump(exclude_unset=True),
            user_id=str(current_user.id)
        )
        
        # Load with category for response
        from models_universal import InventoryItem as UniversalInventoryItemModel
        db_item = db.query(UniversalInventoryItemModel).options(
            joinedload(UniversalInventoryItemModel.category)
        ).filter(UniversalInventoryItemModel.id == item_id).first()
        
        return db_item
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/universal/search", response_model=InventorySearchResponse)
async def search_universal_inventory(
    search_request: InventorySearchRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("view_inventory"))
):
    """Advanced search for inventory items with filtering and pagination"""
    service = UniversalInventoryService(db)
    
    try:
        items, total_count = service.search_inventory_items(
            query=search_request.filters.query,
            category_ids=[str(cid) for cid in search_request.filters.category_ids] if search_request.filters.category_ids else None,
            attributes_filter=search_request.filters.attributes_filter,
            tags_filter=search_request.filters.tags_filter,
            sku_filter=search_request.filters.sku_filter,
            barcode_filter=search_request.filters.barcode_filter,
            stock_level_filter={
                "min_stock": search_request.filters.min_stock,
                "max_stock": search_request.filters.max_stock,
                "low_stock_only": search_request.filters.low_stock_only
            },
            price_range={
                "min_price": search_request.filters.min_cost_price,
                "max_price": search_request.filters.max_cost_price
            },
            business_type=search_request.filters.business_type,
            include_inactive=search_request.filters.include_inactive,
            sort_by=search_request.sort_by,
            sort_order=search_request.sort_order,
            limit=search_request.limit,
            offset=search_request.offset
        )
        
        return InventorySearchResponse(
            items=items,
            total_count=total_count,
            page_info={
                "page": (search_request.offset // search_request.limit) + 1,
                "per_page": search_request.limit,
                "total_pages": (total_count + search_request.limit - 1) // search_request.limit,
                "has_next": search_request.offset + search_request.limit < total_count,
                "has_prev": search_request.offset > 0
            },
            filters_applied=search_request.filters
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/universal/alerts/low-stock", response_model=StockAlertsResponse)
async def get_universal_low_stock_alerts(
    threshold_multiplier: float = Query(default=1.0, ge=0.1, le=5.0),
    category_ids: Optional[List[str]] = Query(default=None),
    business_type: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get low stock alerts with enhanced filtering"""
    service = UniversalInventoryService(db)
    
    try:
        alerts = service.get_low_stock_alerts(
            threshold_multiplier=threshold_multiplier,
            category_ids=category_ids,
            business_type=business_type
        )
        
        # Calculate summary
        total_alerts = len(alerts)
        critical_alerts = len([a for a in alerts if a['urgency_score'] >= 0.8])
        warning_alerts = len([a for a in alerts if 0.5 <= a['urgency_score'] < 0.8])
        total_potential_loss = sum(a['potential_lost_sales'] for a in alerts)
        
        return StockAlertsResponse(
            alerts=[LowStockAlert(**alert) for alert in alerts],
            summary={
                "total_alerts": total_alerts,
                "critical_alerts": critical_alerts,
                "warning_alerts": warning_alerts,
                "total_potential_loss": total_potential_loss,
                "threshold_multiplier": threshold_multiplier
            },
            threshold_multiplier=threshold_multiplier
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/universal/categories/tree", response_model=List[CategoryWithStats])
async def get_universal_category_tree(
    business_type: Optional[str] = Query(default=None),
    include_stats: bool = Query(default=True),
    max_depth: Optional[int] = Query(default=None, ge=1, le=10),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get category tree with universal business support"""
    service = UniversalInventoryService(db)
    
    try:
        tree = service.get_category_tree(
            business_type=business_type,
            include_stats=include_stats,
            max_depth=max_depth
        )
        
        return tree
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/universal/categories", response_model=UniversalCategory)
async def create_universal_category(
    category: UniversalCategoryCreate,
    business_type: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Create a new universal category with hierarchical support"""
    service = UniversalInventoryService(db)
    
    try:
        db_category = service.create_category(
            category_data=category,
            user_id=str(current_user.id),
            business_type=business_type
        )
        
        return db_category
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.put("/universal/categories/{category_id}/hierarchy")
async def update_category_hierarchy(
    category_id: str,
    hierarchy_update: CategoryHierarchyMove,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Update category hierarchy (move category to different parent)"""
    service = UniversalInventoryService(db)
    
    try:
        updated_category = service.update_category_hierarchy(
            category_id=category_id,
            new_parent_id=str(hierarchy_update.new_parent_id) if hierarchy_update.new_parent_id else None,
            user_id=str(current_user.id)
        )
        
        return {"message": "Category hierarchy updated successfully", "category": updated_category}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/universal/movements", response_model=List[InventoryMovementWithDetails])
async def get_inventory_movements(
    item_id: Optional[str] = Query(default=None),
    movement_types: Optional[List[str]] = Query(default=None),
    date_from: Optional[datetime] = Query(default=None),
    date_to: Optional[datetime] = Query(default=None),
    limit: int = Query(default=100, ge=1, le=1000),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get inventory movements with filtering"""
    service = UniversalInventoryService(db)
    
    try:
        movements, total_count = service.get_inventory_movements(
            item_id=item_id,
            movement_types=movement_types,
            date_from=date_from,
            date_to=date_to,
            limit=limit,
            offset=offset
        )
        
        return movements
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/universal/units/convert", response_model=UnitConversionResponse)
async def convert_units(
    conversion_request: UnitConversionRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Convert quantity between different units of measure"""
    service = UniversalInventoryService(db)
    
    try:
        converted_quantity = service.convert_units(
            item_id=str(conversion_request.item_id),
            from_unit=conversion_request.from_unit,
            to_unit=conversion_request.to_unit,
            quantity=conversion_request.quantity
        )
        
        conversion_factor = converted_quantity / conversion_request.quantity if conversion_request.quantity != 0 else 1
        
        return UnitConversionResponse(
            original_quantity=conversion_request.quantity,
            original_unit=conversion_request.from_unit,
            converted_quantity=converted_quantity,
            converted_unit=conversion_request.to_unit,
            conversion_factor=conversion_factor
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/universal/analytics", response_model=InventoryAnalytics)
async def get_inventory_analytics(
    business_type: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get comprehensive inventory analytics"""
    service = UniversalInventoryService(db)
    
    try:
        summary = service.get_stock_alerts_summary(business_type=business_type)
        
        # Get additional analytics
        from models_universal import InventoryItem as UniversalInventoryItemModel, Category as UniversalCategoryModel
        total_items = db.query(UniversalInventoryItemModel).filter(
            UniversalInventoryItemModel.is_active == True
        ).count()
        
        total_categories = db.query(UniversalCategoryModel).filter(
            UniversalCategoryModel.is_active == True
        ).count()
        
        return InventoryAnalytics(
            total_items=total_items,
            total_categories=total_categories,
            total_inventory_value=summary['total_inventory_value'],
            low_stock_items=summary['low_stock_items'],
            out_of_stock_items=summary['out_of_stock_items'],
            top_categories_by_value=[],  # TODO: Implement
            top_items_by_value=[],  # TODO: Implement
            last_updated=datetime.utcnow()
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/universal/validate/sku", response_model=SKUValidationResponse)
async def validate_sku(
    validation_request: SKUValidationRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Validate SKU uniqueness and format"""
    service = UniversalInventoryService(db)
    
    try:
        is_unique = not service._sku_exists(
            validation_request.sku,
            exclude_id=str(validation_request.exclude_item_id) if validation_request.exclude_item_id else None
        )
        
        errors = []
        if not validation_request.sku:
            errors.append("SKU cannot be empty")
        elif len(validation_request.sku) > 100:
            errors.append("SKU cannot exceed 100 characters")
        
        if not is_unique:
            errors.append("SKU already exists")
        
        return SKUValidationResponse(
            is_valid=len(errors) == 0,
            is_unique=is_unique,
            suggested_sku=service._generate_sku() if not is_unique else None,
            errors=errors
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/universal/validate/barcode", response_model=BarcodeValidationResponse)
async def validate_barcode(
    validation_request: BarcodeValidationRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Validate barcode uniqueness and format"""
    service = UniversalInventoryService(db)
    
    try:
        is_unique = not service._barcode_exists(
            validation_request.barcode,
            exclude_id=str(validation_request.exclude_item_id) if validation_request.exclude_item_id else None
        )
        
        errors = []
        if not validation_request.barcode:
            errors.append("Barcode cannot be empty")
        elif len(validation_request.barcode) > 100:
            errors.append("Barcode cannot exceed 100 characters")
        
        if not is_unique:
            errors.append("Barcode already exists")
        
        # Basic format detection
        format_detected = None
        if validation_request.barcode.isdigit():
            if len(validation_request.barcode) == 13:
                format_detected = "EAN13"
            elif len(validation_request.barcode) == 12:
                format_detected = "UPC"
        
        return BarcodeValidationResponse(
            is_valid=len(errors) == 0,
            is_unique=is_unique,
            format_detected=format_detected,
            errors=errors
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# Legacy Inventory Item Management Endpoints (for backward compatibility)

@router.post("/items", response_model=schemas.InventoryItemWithCategory)
async def create_inventory_item(
    item: schemas.InventoryItemCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
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
    current_user: models.User = Depends(get_current_user)
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
    current_user: models.User = Depends(get_current_user)
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
    current_user: models.User = Depends(get_current_user)
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
    current_user: models.User = Depends(get_current_user)
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
    current_user: models.User = Depends(get_current_user)
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
    current_user: models.User = Depends(get_current_user)
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
    current_user: models.User = Depends(get_current_user)
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
    current_user: models.User = Depends(get_current_user)
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