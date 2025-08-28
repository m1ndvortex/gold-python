"""
Universal Inventory Management Service
Comprehensive service for managing universal inventory with unlimited nested categories,
custom attributes, advanced search, SKU/barcode/QR management, and image support.
"""

import uuid
import qrcode
import barcode
from barcode.writer import ImageWriter
from typing import List, Optional, Dict, Any, Tuple
from decimal import Decimal
from datetime import datetime, date
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import and_, or_, func, text, desc, asc
from sqlalchemy.dialects.postgresql import insert
from fastapi import HTTPException, status
import io
import base64
from PIL import Image as PILImage

from models_universal import (
    UniversalCategory, UniversalInventoryItem, InventoryMovement, 
    Image, ImageVariant, BusinessConfiguration
)
from schemas_universal import (
    UniversalCategoryCreate, UniversalCategoryUpdate, UniversalInventoryItemCreate,
    UniversalInventoryItemUpdate, InventoryMovementCreate, InventorySearchFilters,
    CategorySearchFilters, StockUpdateRequest, StockAdjustmentRequest,
    BulkUpdateRequest, BulkDeleteRequest, BulkTagRequest, LowStockAlert
)

class UniversalInventoryService:
    """Service class for universal inventory management"""
    
    def __init__(self, db: Session):
        self.db = db
    
    # Category Management Methods
    
    def create_category(self, category_data: UniversalCategoryCreate, user_id: Optional[uuid.UUID] = None) -> UniversalCategory:
        """Create a new category with LTREE path management"""
        
        # Validate parent category if provided
        parent_path = ""
        level = 0
        
        if category_data.parent_id:
            parent = self.db.query(UniversalCategory).filter(
                UniversalCategory.id == category_data.parent_id,
                UniversalCategory.is_active == True
            ).first()
            
            if not parent:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Parent category not found"
                )
            
            parent_path = parent.path
            level = parent.level + 1
        
        # Check for duplicate names at the same level
        existing = self.db.query(UniversalCategory).filter(
            UniversalCategory.name == category_data.name,
            UniversalCategory.parent_id == category_data.parent_id,
            UniversalCategory.is_active == True
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Category with this name already exists at this level"
            )
        
        # Create category
        db_category = UniversalCategory(
            **category_data.model_dump(exclude={'parent_id'}),
            parent_id=category_data.parent_id,
            level=level,
            path="temp",  # Temporary path, will be updated after getting ID
            created_by=user_id,
            updated_by=user_id
        )
        
        self.db.add(db_category)
        self.db.flush()  # Get the ID
        
        # Generate LTREE path (replace hyphens with underscores for LTREE compatibility)
        category_id_str = str(db_category.id).replace('-', '_')
        if parent_path:
            db_category.path = f"{parent_path}.{category_id_str}"
        else:
            db_category.path = category_id_str
        
        self.db.commit()
        self.db.refresh(db_category)
        
        return db_category
    
    def get_categories_tree(self, filters: Optional[CategorySearchFilters] = None) -> List[UniversalCategory]:
        """Get categories in tree structure with optional filtering"""
        
        query = self.db.query(UniversalCategory).filter(UniversalCategory.is_active == True)
        
        if filters:
            if filters.search:
                search_term = f"%{filters.search}%"
                query = query.filter(
                    or_(
                        UniversalCategory.name.ilike(search_term),
                        UniversalCategory.description.ilike(search_term),
                        UniversalCategory.name_persian.ilike(search_term)
                    )
                )
            
            if filters.parent_id:
                query = query.filter(UniversalCategory.parent_id == filters.parent_id)
            
            if filters.level is not None:
                query = query.filter(UniversalCategory.level == filters.level)
            
            if filters.business_type:
                query = query.filter(UniversalCategory.business_type == filters.business_type)
        
        # Order by level and sort_order for proper tree structure
        categories = query.order_by(UniversalCategory.level, UniversalCategory.sort_order, UniversalCategory.name).all()
        
        return self._build_category_tree(categories)
    
    def _build_category_tree(self, categories: List[UniversalCategory]) -> List[UniversalCategory]:
        """Build hierarchical tree structure from flat category list"""
        
        category_dict = {str(cat.id): cat for cat in categories}
        root_categories = []
        
        for category in categories:
            if category.parent_id:
                parent = category_dict.get(str(category.parent_id))
                if parent:
                    if not hasattr(parent, 'children'):
                        parent.children = []
                    parent.children.append(category)
            else:
                root_categories.append(category)
        
        return root_categories
    
    def update_category(self, category_id: uuid.UUID, category_data: UniversalCategoryUpdate, 
                       user_id: Optional[uuid.UUID] = None) -> UniversalCategory:
        """Update category with path recalculation if parent changes"""
        
        db_category = self.db.query(UniversalCategory).filter(
            UniversalCategory.id == category_id,
            UniversalCategory.is_active == True
        ).first()
        
        if not db_category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found"
            )
        
        update_data = category_data.model_dump(exclude_unset=True)
        
        # Handle parent change
        if 'parent_id' in update_data:
            new_parent_id = update_data['parent_id']
            
            if new_parent_id and new_parent_id != db_category.parent_id:
                # Validate new parent
                new_parent = self.db.query(UniversalCategory).filter(
                    UniversalCategory.id == new_parent_id,
                    UniversalCategory.is_active == True
                ).first()
                
                if not new_parent:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="New parent category not found"
                    )
                
                # Prevent circular reference
                if self._would_create_circular_reference(category_id, new_parent_id):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Cannot create circular reference"
                    )
                
                # Update level and path
                db_category.level = new_parent.level + 1
                db_category.path = f"{new_parent.path}.{category_id}"
                
            elif not new_parent_id:
                # Moving to root level
                db_category.level = 0
                db_category.path = str(category_id)
        
        # Update other fields
        for field, value in update_data.items():
            if field != 'parent_id':
                setattr(db_category, field, value)
        
        db_category.updated_by = user_id
        
        self.db.commit()
        self.db.refresh(db_category)
        
        return db_category
    
    def _would_create_circular_reference(self, category_id: uuid.UUID, new_parent_id: uuid.UUID) -> bool:
        """Check if moving category would create circular reference"""
        
        # Get all descendants of the category being moved
        descendants = self.db.query(UniversalCategory).filter(
            UniversalCategory.path.op('<@')(text(f"'{category_id}'"))
        ).all()
        
        descendant_ids = {cat.id for cat in descendants}
        return new_parent_id in descendant_ids
    
    def delete_category(self, category_id: uuid.UUID, force: bool = False) -> bool:
        """Delete category (soft delete if has items, hard delete if empty)"""
        
        db_category = self.db.query(UniversalCategory).filter(
            UniversalCategory.id == category_id
        ).first()
        
        if not db_category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found"
            )
        
        # Check for items in this category or subcategories
        items_count = self.db.query(UniversalInventoryItem).filter(
            UniversalInventoryItem.category_id == category_id,
            UniversalInventoryItem.is_active == True
        ).count()
        
        # Check for subcategories
        subcategories_count = self.db.query(UniversalCategory).filter(
            UniversalCategory.parent_id == category_id,
            UniversalCategory.is_active == True
        ).count()
        
        if items_count > 0 or subcategories_count > 0:
            if not force:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Cannot delete category with {items_count} items and {subcategories_count} subcategories"
                )
            else:
                # Soft delete
                db_category.is_active = False
                self.db.commit()
                return True
        
        # Hard delete if empty
        self.db.delete(db_category)
        self.db.commit()
        return True
    
    # Inventory Item Management Methods
    
    def create_inventory_item(self, item_data: UniversalInventoryItemCreate, 
                            user_id: Optional[uuid.UUID] = None) -> UniversalInventoryItem:
        """Create new inventory item with SKU generation and validation"""
        
        # Validate category if provided
        if item_data.category_id:
            category = self.db.query(UniversalCategory).filter(
                UniversalCategory.id == item_data.category_id,
                UniversalCategory.is_active == True
            ).first()
            
            if not category:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Category not found"
                )
        
        # Generate SKU if not provided
        if not item_data.sku:
            item_data.sku = self._generate_sku(item_data.category_id)
        
        # Validate unique identifiers
        self._validate_unique_identifiers(item_data.sku, item_data.barcode, item_data.qr_code)
        
        # Generate QR code if not provided
        if not item_data.qr_code:
            item_data.qr_code = self._generate_qr_code(item_data.sku)
        
        # Validate business rules
        self._validate_item_data(item_data)
        
        # Create item
        db_item = UniversalInventoryItem(
            **item_data.model_dump(),
            created_by=user_id,
            updated_by=user_id
        )
        
        self.db.add(db_item)
        self.db.commit()
        self.db.refresh(db_item)
        
        # Create initial stock movement if quantity > 0
        if db_item.stock_quantity > 0:
            self._create_stock_movement(
                item_id=db_item.id,
                movement_type='in',
                quantity_change=db_item.stock_quantity,
                quantity_before=0,
                quantity_after=db_item.stock_quantity,
                reason='Initial stock',
                user_id=user_id
            )
        
        return db_item
    
    def _generate_sku(self, category_id: Optional[uuid.UUID] = None) -> str:
        """Generate unique SKU"""
        
        prefix = "ITEM"
        if category_id:
            category = self.db.query(UniversalCategory).filter(
                UniversalCategory.id == category_id
            ).first()
            if category:
                prefix = category.name[:4].upper().replace(' ', '')
        
        # Get next sequence number
        last_item = self.db.query(UniversalInventoryItem).filter(
            UniversalInventoryItem.sku.like(f"{prefix}%")
        ).order_by(desc(UniversalInventoryItem.created_at)).first()
        
        sequence = 1
        if last_item:
            try:
                last_sequence = int(last_item.sku.split('-')[-1])
                sequence = last_sequence + 1
            except (ValueError, IndexError):
                pass
        
        return f"{prefix}-{sequence:06d}"
    
    def _generate_qr_code(self, sku: str) -> str:
        """Generate QR code data for item"""
        return f"ITEM:{sku}:{uuid.uuid4().hex[:8]}"
    
    def _validate_unique_identifiers(self, sku: str, barcode: Optional[str] = None, 
                                   qr_code: Optional[str] = None, exclude_id: Optional[uuid.UUID] = None):
        """Validate that SKU, barcode, and QR code are unique"""
        
        query = self.db.query(UniversalInventoryItem)
        if exclude_id:
            query = query.filter(UniversalInventoryItem.id != exclude_id)
        
        # Check SKU
        if query.filter(UniversalInventoryItem.sku == sku).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="SKU already exists"
            )
        
        # Check barcode
        if barcode and query.filter(UniversalInventoryItem.barcode == barcode).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Barcode already exists"
            )
        
        # Check QR code
        if qr_code and query.filter(UniversalInventoryItem.qr_code == qr_code).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="QR code already exists"
            )
    
    def _validate_item_data(self, item_data: UniversalInventoryItemCreate):
        """Validate item business rules"""
        
        if item_data.cost_price < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cost price cannot be negative"
            )
        
        if item_data.sale_price < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Sale price cannot be negative"
            )
        
        if item_data.stock_quantity < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Stock quantity cannot be negative"
            )
        
        if item_data.low_stock_threshold < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Low stock threshold cannot be negative"
            )
    
    def search_inventory_items(self, filters: InventorySearchFilters, 
                             skip: int = 0, limit: int = 100) -> Tuple[List[UniversalInventoryItem], int]:
        """Advanced search and filtering for inventory items"""
        
        query = self.db.query(UniversalInventoryItem).options(
            joinedload(UniversalInventoryItem.category)
        )
        
        # Apply filters
        if filters.is_active is not None:
            query = query.filter(UniversalInventoryItem.is_active == filters.is_active)
        
        if filters.search:
            search_term = f"%{filters.search}%"
            query = query.filter(
                or_(
                    UniversalInventoryItem.name.ilike(search_term),
                    UniversalInventoryItem.description.ilike(search_term),
                    UniversalInventoryItem.sku.ilike(search_term),
                    UniversalInventoryItem.barcode.ilike(search_term),
                    UniversalInventoryItem.name_persian.ilike(search_term)
                )
            )
        
        if filters.category_id:
            query = query.filter(UniversalInventoryItem.category_id == filters.category_id)
        
        if filters.category_path:
            # Search in category and all subcategories
            query = query.join(UniversalCategory).filter(
                UniversalCategory.path.op('<@')(text(f"'{filters.category_path}'"))
            )
        
        if filters.tags:
            for tag in filters.tags:
                query = query.filter(UniversalInventoryItem.tags.op('&&')(f'{{{tag}}}'))
        
        if filters.custom_attributes:
            for attr_name, attr_value in filters.custom_attributes.items():
                query = query.filter(
                    UniversalInventoryItem.custom_attributes[attr_name].astext == str(attr_value)
                )
        
        if filters.min_stock is not None:
            query = query.filter(UniversalInventoryItem.stock_quantity >= filters.min_stock)
        
        if filters.max_stock is not None:
            query = query.filter(UniversalInventoryItem.stock_quantity <= filters.max_stock)
        
        if filters.low_stock_only:
            query = query.filter(
                UniversalInventoryItem.stock_quantity <= UniversalInventoryItem.low_stock_threshold
            )
        
        if filters.out_of_stock_only:
            query = query.filter(UniversalInventoryItem.stock_quantity <= 0)
        
        if filters.min_price is not None:
            query = query.filter(UniversalInventoryItem.sale_price >= filters.min_price)
        
        if filters.max_price is not None:
            query = query.filter(UniversalInventoryItem.sale_price <= filters.max_price)
        
        if filters.business_type:
            query = query.filter(
                UniversalInventoryItem.business_type_fields['business_type'].astext == filters.business_type
            )
        
        if filters.has_images is not None:
            if filters.has_images:
                query = query.filter(UniversalInventoryItem.primary_image_id.isnot(None))
            else:
                query = query.filter(UniversalInventoryItem.primary_image_id.is_(None))
        
        if filters.created_after:
            query = query.filter(UniversalInventoryItem.created_at >= filters.created_after)
        
        if filters.created_before:
            query = query.filter(UniversalInventoryItem.created_at <= filters.created_before)
        
        # Get total count before pagination
        total = query.count()
        
        # Apply sorting
        sort_field = getattr(UniversalInventoryItem, filters.sort_by, UniversalInventoryItem.name)
        if filters.sort_order == 'desc':
            query = query.order_by(desc(sort_field))
        else:
            query = query.order_by(asc(sort_field))
        
        # Apply pagination
        items = query.offset(skip).limit(limit).all()
        
        return items, total
    
    def update_inventory_item(self, item_id: uuid.UUID, item_data: UniversalInventoryItemUpdate,
                            user_id: Optional[uuid.UUID] = None) -> UniversalInventoryItem:
        """Update inventory item with validation"""
        
        db_item = self.db.query(UniversalInventoryItem).filter(
            UniversalInventoryItem.id == item_id,
            UniversalInventoryItem.is_active == True
        ).first()
        
        if not db_item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Inventory item not found"
            )
        
        update_data = item_data.model_dump(exclude_unset=True)
        
        # Validate unique identifiers if being updated
        if 'sku' in update_data or 'barcode' in update_data or 'qr_code' in update_data:
            sku = update_data.get('sku', db_item.sku)
            barcode = update_data.get('barcode', db_item.barcode)
            qr_code = update_data.get('qr_code', db_item.qr_code)
            self._validate_unique_identifiers(sku, barcode, qr_code, exclude_id=item_id)
        
        # Validate category if being updated
        if 'category_id' in update_data and update_data['category_id']:
            category = self.db.query(UniversalCategory).filter(
                UniversalCategory.id == update_data['category_id'],
                UniversalCategory.is_active == True
            ).first()
            
            if not category:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Category not found"
                )
        
        # Handle stock quantity changes
        if 'stock_quantity' in update_data:
            old_quantity = db_item.stock_quantity
            new_quantity = update_data['stock_quantity']
            
            if new_quantity != old_quantity:
                self._create_stock_movement(
                    item_id=item_id,
                    movement_type='adjustment',
                    quantity_change=new_quantity - old_quantity,
                    quantity_before=old_quantity,
                    quantity_after=new_quantity,
                    reason='Manual adjustment',
                    user_id=user_id
                )
        
        # Update fields
        for field, value in update_data.items():
            setattr(db_item, field, value)
        
        db_item.updated_by = user_id
        
        self.db.commit()
        self.db.refresh(db_item)
        
        return db_item
    
    def update_stock(self, item_id: uuid.UUID, stock_update: StockUpdateRequest,
                    user_id: Optional[uuid.UUID] = None) -> UniversalInventoryItem:
        """Update item stock with movement tracking"""
        
        db_item = self.db.query(UniversalInventoryItem).filter(
            UniversalInventoryItem.id == item_id,
            UniversalInventoryItem.is_active == True
        ).first()
        
        if not db_item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Inventory item not found"
            )
        
        old_quantity = db_item.stock_quantity
        new_quantity = old_quantity + stock_update.quantity_change
        
        if new_quantity < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock. Current: {old_quantity}, Requested change: {stock_update.quantity_change}"
            )
        
        # Update stock
        db_item.stock_quantity = new_quantity
        
        # Create movement record
        movement_type = 'in' if stock_update.quantity_change > 0 else 'out'
        self._create_stock_movement(
            item_id=item_id,
            movement_type=movement_type,
            quantity_change=stock_update.quantity_change,
            quantity_before=old_quantity,
            quantity_after=new_quantity,
            reason=stock_update.reason or f"Stock {movement_type}",
            notes=stock_update.notes,
            reference_type=stock_update.reference_type,
            reference_id=stock_update.reference_id,
            user_id=user_id
        )
        
        self.db.commit()
        self.db.refresh(db_item)
        
        return db_item
    
    def _create_stock_movement(self, item_id: uuid.UUID, movement_type: str, quantity_change: Decimal,
                             quantity_before: Decimal, quantity_after: Decimal, reason: str,
                             notes: Optional[str] = None, reference_type: Optional[str] = None,
                             reference_id: Optional[uuid.UUID] = None, user_id: Optional[uuid.UUID] = None):
        """Create stock movement record"""
        
        db_item = self.db.query(UniversalInventoryItem).filter(
            UniversalInventoryItem.id == item_id
        ).first()
        
        movement = InventoryMovement(
            inventory_item_id=item_id,
            movement_type=movement_type,
            quantity_change=quantity_change,
            quantity_before=quantity_before,
            quantity_after=quantity_after,
            unit_of_measure=db_item.unit_of_measure,
            reason=reason,
            notes=notes,
            reference_type=reference_type,
            reference_id=reference_id,
            status='completed',
            created_by=user_id
        )
        
        self.db.add(movement)
    
    def get_low_stock_alerts(self, threshold_multiplier: float = 1.0) -> List[LowStockAlert]:
        """Get items with low stock levels"""
        
        items = self.db.query(UniversalInventoryItem).options(
            joinedload(UniversalInventoryItem.category)
        ).filter(
            UniversalInventoryItem.is_active == True,
            UniversalInventoryItem.stock_quantity <= (
                UniversalInventoryItem.low_stock_threshold * threshold_multiplier
            )
        ).all()
        
        alerts = []
        for item in items:
            # Determine urgency level
            if item.stock_quantity <= 0:
                urgency = 'critical'
            elif item.stock_quantity <= (item.low_stock_threshold * Decimal('0.5')):
                urgency = 'high'
            elif item.stock_quantity <= (item.low_stock_threshold * Decimal('0.8')):
                urgency = 'medium'
            else:
                urgency = 'low'
            
            # Get last movement date
            last_movement = self.db.query(InventoryMovement).filter(
                InventoryMovement.inventory_item_id == item.id
            ).order_by(desc(InventoryMovement.movement_date)).first()
            
            alert = LowStockAlert(
                item_id=item.id,
                item_name=item.name,
                item_sku=item.sku,
                category_name=item.category.name if item.category else None,
                current_stock=item.stock_quantity,
                low_stock_threshold=item.low_stock_threshold,
                shortage=item.low_stock_threshold - item.stock_quantity,
                unit_of_measure=item.unit_of_measure,
                last_movement_date=last_movement.movement_date if last_movement else None,
                urgency_level=urgency
            )
            alerts.append(alert)
        
        return alerts
    
    # Bulk Operations
    
    def bulk_update_items(self, request: BulkUpdateRequest, user_id: Optional[uuid.UUID] = None) -> int:
        """Bulk update multiple items"""
        
        items = self.db.query(UniversalInventoryItem).filter(
            UniversalInventoryItem.id.in_(request.item_ids),
            UniversalInventoryItem.is_active == True
        ).all()
        
        if len(items) != len(request.item_ids):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Some items not found"
            )
        
        updated_count = 0
        for item in items:
            for field, value in request.updates.items():
                if hasattr(item, field):
                    setattr(item, field, value)
                    updated_count += 1
            
            item.updated_by = user_id
        
        self.db.commit()
        return updated_count
    
    def bulk_tag_items(self, request: BulkTagRequest, user_id: Optional[uuid.UUID] = None) -> int:
        """Bulk add/remove/replace tags for multiple items"""
        
        items = self.db.query(UniversalInventoryItem).filter(
            UniversalInventoryItem.id.in_(request.item_ids),
            UniversalInventoryItem.is_active == True
        ).all()
        
        if len(items) != len(request.item_ids):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Some items not found"
            )
        
        updated_count = 0
        for item in items:
            current_tags = set(item.tags or [])
            new_tags = set(request.tags)
            
            if request.operation == 'add':
                item.tags = list(current_tags.union(new_tags))
            elif request.operation == 'remove':
                item.tags = list(current_tags.difference(new_tags))
            elif request.operation == 'replace':
                item.tags = request.tags
            
            item.updated_by = user_id
            updated_count += 1
        
        self.db.commit()
        return updated_count
    
    # Barcode and QR Code Generation
    
    def generate_barcode_image(self, item_id: uuid.UUID) -> bytes:
        """Generate barcode image for item"""
        
        db_item = self.db.query(UniversalInventoryItem).filter(
            UniversalInventoryItem.id == item_id,
            UniversalInventoryItem.is_active == True
        ).first()
        
        if not db_item or not db_item.barcode:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Item or barcode not found"
            )
        
        # Generate barcode
        code128 = barcode.get_barcode_class('code128')
        barcode_instance = code128(db_item.barcode, writer=ImageWriter())
        
        # Save to bytes
        buffer = io.BytesIO()
        barcode_instance.write(buffer)
        buffer.seek(0)
        
        return buffer.getvalue()
    
    def generate_qr_code_image(self, item_id: uuid.UUID) -> bytes:
        """Generate QR code image for item"""
        
        db_item = self.db.query(UniversalInventoryItem).filter(
            UniversalInventoryItem.id == item_id,
            UniversalInventoryItem.is_active == True
        ).first()
        
        if not db_item or not db_item.qr_code:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Item or QR code not found"
            )
        
        # Generate QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(db_item.qr_code)
        qr.make(fit=True)
        
        # Create image
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Save to bytes
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        
        return buffer.getvalue()
    
    # Analytics and Reporting
    
    def get_inventory_analytics(self) -> Dict[str, Any]:
        """Get comprehensive inventory analytics"""
        
        # Basic counts
        total_items = self.db.query(UniversalInventoryItem).filter(
            UniversalInventoryItem.is_active == True
        ).count()
        
        total_categories = self.db.query(UniversalCategory).filter(
            UniversalCategory.is_active == True
        ).count()
        
        # Stock analysis
        low_stock_count = self.db.query(UniversalInventoryItem).filter(
            UniversalInventoryItem.is_active == True,
            UniversalInventoryItem.stock_quantity <= UniversalInventoryItem.low_stock_threshold
        ).count()
        
        out_of_stock_count = self.db.query(UniversalInventoryItem).filter(
            UniversalInventoryItem.is_active == True,
            UniversalInventoryItem.stock_quantity <= 0
        ).count()
        
        # Value analysis
        total_value = self.db.query(
            func.sum(UniversalInventoryItem.stock_quantity * UniversalInventoryItem.cost_price)
        ).filter(UniversalInventoryItem.is_active == True).scalar() or 0
        
        # Top categories by item count
        top_categories = self.db.query(
            UniversalCategory.name,
            func.count(UniversalInventoryItem.id).label('item_count')
        ).join(UniversalInventoryItem).filter(
            UniversalCategory.is_active == True,
            UniversalInventoryItem.is_active == True
        ).group_by(UniversalCategory.name).order_by(
            desc('item_count')
        ).limit(10).all()
        
        # Recent movements
        recent_movements = self.db.query(InventoryMovement).options(
            joinedload(InventoryMovement.inventory_item)
        ).order_by(desc(InventoryMovement.movement_date)).limit(10).all()
        
        return {
            'total_items': total_items,
            'total_categories': total_categories,
            'low_stock_items': low_stock_count,
            'out_of_stock_items': out_of_stock_count,
            'total_value': float(total_value),
            'top_categories': [
                {'name': cat.name, 'item_count': cat.item_count}
                for cat in top_categories
            ],
            'recent_movements': [
                {
                    'item_name': mov.inventory_item.name,
                    'movement_type': mov.movement_type,
                    'quantity_change': float(mov.quantity_change),
                    'movement_date': mov.movement_date.isoformat(),
                    'reason': mov.reason
                }
                for mov in recent_movements
            ]
        }