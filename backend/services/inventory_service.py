"""
Universal Inventory Management Service
Enhanced inventory service with support for unlimited nested categories,
custom attributes, advanced search, SKU/barcode management, and comprehensive audit trails.
"""

from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import and_, or_, func, text, desc, asc
from sqlalchemy.dialects.postgresql import ARRAY
from datetime import datetime, timedelta
import uuid
import re
import json

from models_universal import (
    InventoryItem, Category, InventoryMovement, User,
    BusinessConfiguration, AuditLog
)
from schemas_inventory_universal import (
    UniversalInventoryItemCreate, UniversalInventoryItemUpdate, 
    UniversalCategoryCreate, UniversalCategoryUpdate
)


class UniversalInventoryService:
    """
    Universal Inventory Management Service with enhanced features:
    - Unlimited nested categories with LTREE support
    - Custom attributes system with schema validation
    - Advanced search and filtering
    - SKU, barcode, and QR code management
    - Multi-unit inventory tracking
    - Real-time stock monitoring with alerts
    - Comprehensive audit trails
    """

    def __init__(self, db: Session):
        self.db = db

    # Category Management with Hierarchical Support
    
    def create_category(
        self, 
        category_data: UniversalCategoryCreate, 
        user_id: str,
        business_type: Optional[str] = None
    ) -> Category:
        """Create a new category with hierarchical path calculation"""
        
        # Validate parent category if provided
        parent_path = ""
        level = 0
        
        if category_data.parent_id:
            parent = self.db.query(Category).filter(
                Category.id == category_data.parent_id,
                Category.is_active == True
            ).first()
            
            if not parent:
                raise ValueError("Parent category not found")
            
            parent_path = str(parent.path) if parent.path else str(parent.id)
            level = parent.level + 1
        
        # Check for duplicate names at the same level
        existing = self.db.query(Category).filter(
            Category.name == category_data.name,
            Category.parent_id == category_data.parent_id,
            Category.is_active == True
        ).first()
        
        if existing:
            raise ValueError("Category with this name already exists at this level")
        
        # Create category
        category_dict = category_data.model_dump()
        
        # Generate LTREE-compatible path (alphanumeric only, no dashes)
        category_id = str(uuid.uuid4()).replace('-', '')
        ltree_path = f"{parent_path}.{category_id}" if parent_path else category_id
        
        category_dict.update({
            'level': level,
            'business_type': business_type,
            'path': ltree_path
        })
        
        category = Category(**category_dict)
        
        self.db.add(category)
        self.db.commit()
        self.db.refresh(category)
        
        # Log audit trail
        self._log_audit(
            user_id=user_id,
            action="CREATE_CATEGORY",
            resource_type="Category",
            resource_id=category.id,
            new_values=category_data.model_dump()
        )
        
        return category
    
    def get_category_tree(
        self, 
        business_type: Optional[str] = None,
        include_stats: bool = True,
        max_depth: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Get complete category tree with optional statistics"""
        
        query = self.db.query(Category).filter(Category.is_active == True)
        
        if business_type:
            query = query.filter(
                or_(
                    Category.business_type == business_type,
                    Category.business_type.is_(None)
                )
            )
        
        if max_depth:
            query = query.filter(Category.level <= max_depth)
        
        categories = query.order_by(Category.level, Category.sort_order, Category.name).all()
        
        # Get product counts if requested
        product_counts = {}
        if include_stats:
            counts = self.db.query(
                InventoryItem.category_id,
                func.count(InventoryItem.id).label('count'),
                func.sum(InventoryItem.stock_quantity).label('total_stock'),
                func.sum(InventoryItem.cost_price * InventoryItem.stock_quantity).label('total_value')
            ).filter(
                InventoryItem.is_active == True
            ).group_by(InventoryItem.category_id).all()
            
            product_counts = {
                str(cat_id): {
                    'count': count,
                    'total_stock': float(total_stock or 0),
                    'total_value': float(total_value or 0)
                }
                for cat_id, count, total_stock, total_value in counts
            }
        
        # Build tree structure
        category_dict = {}
        root_categories = []
        
        for category in categories:
            category_data = {
                'id': str(category.id),
                'name': category.name,
                'description': category.description,
                'parent_id': str(category.parent_id) if category.parent_id else None,
                'level': category.level,
                'icon': category.icon,
                'color': category.color,
                'attributes': category.attributes or {},
                'attribute_schema': category.attribute_schema or [],
                'business_type': category.business_type,
                'sort_order': category.sort_order,
                'is_active': category.is_active,
                'created_at': category.created_at.isoformat(),
                'updated_at': category.updated_at.isoformat(),
                'children': [],
                **product_counts.get(str(category.id), {'count': 0, 'total_stock': 0, 'total_value': 0})
            }
            
            category_dict[str(category.id)] = category_data
            
            if not category.parent_id:
                root_categories.append(category_data)
        
        # Build parent-child relationships
        for category in categories:
            if category.parent_id:
                parent = category_dict.get(str(category.parent_id))
                if parent:
                    parent['children'].append(category_dict[str(category.id)])
        
        return root_categories
    
    def update_category_hierarchy(
        self, 
        category_id: str, 
        new_parent_id: Optional[str],
        user_id: str
    ) -> Category:
        """Update category hierarchy and recalculate paths"""
        
        category = self.db.query(Category).filter(Category.id == category_id).first()
        if not category:
            raise ValueError("Category not found")
        
        old_parent_id = category.parent_id
        
        # Validate new parent
        if new_parent_id:
            new_parent = self.db.query(Category).filter(
                Category.id == new_parent_id,
                Category.is_active == True
            ).first()
            
            if not new_parent:
                raise ValueError("New parent category not found")
            
            # Prevent circular references
            if self._would_create_cycle(category_id, new_parent_id):
                raise ValueError("Moving category would create a circular reference")
        
        # Update category
        category.parent_id = new_parent_id
        
        # Recalculate path and level
        if new_parent_id:
            new_parent = self.db.query(Category).filter(Category.id == new_parent_id).first()
            category.level = new_parent.level + 1
            parent_path = str(new_parent.path) if new_parent.path else str(new_parent.id).replace('-', '')
            category_id = str(category.id).replace('-', '')
            category.path = f"{parent_path}.{category_id}"
        else:
            category.level = 0
            category.path = str(category.id).replace('-', '')
        
        self.db.commit()
        self.db.refresh(category)
        
        # Update all descendant paths
        self._update_descendant_paths(category)
        
        # Log audit trail
        self._log_audit(
            user_id=user_id,
            action="UPDATE_CATEGORY_HIERARCHY",
            resource_type="Category",
            resource_id=category.id,
            old_values={"parent_id": str(old_parent_id) if old_parent_id else None},
            new_values={"parent_id": str(new_parent_id) if new_parent_id else None}
        )
        
        return category
    
    def _would_create_cycle(self, category_id: str, new_parent_id: str) -> bool:
        """Check if moving category would create a circular reference"""
        
        current_id = new_parent_id
        visited = set()
        
        while current_id and current_id not in visited:
            if current_id == category_id:
                return True
            
            visited.add(current_id)
            parent = self.db.query(Category).filter(Category.id == current_id).first()
            current_id = str(parent.parent_id) if parent and parent.parent_id else None
        
        return False
    
    def _update_descendant_paths(self, category: Category):
        """Recursively update paths for all descendant categories"""
        
        children = self.db.query(Category).filter(
            Category.parent_id == category.id,
            Category.is_active == True
        ).all()
        
        for child in children:
            child.level = category.level + 1
            parent_path = str(category.path) if category.path else str(category.id).replace('-', '')
            child_id = str(child.id).replace('-', '')
            child.path = f"{parent_path}.{child_id}"
            self.db.commit()
            
            # Recursively update grandchildren
            self._update_descendant_paths(child)

    # Enhanced Inventory Item Management
    
    def create_inventory_item(
        self, 
        item_data: Dict[str, Any], 
        user_id: str,
        validate_attributes: bool = True
    ) -> InventoryItem:
        """Create inventory item with universal support and validation"""
        
        # Generate SKU if not provided
        if not item_data.get('sku'):
            item_data['sku'] = self._generate_sku(item_data.get('category_id'))
        
        # Validate SKU uniqueness
        if self._sku_exists(item_data['sku']):
            raise ValueError(f"SKU '{item_data['sku']}' already exists")
        
        # Validate barcode uniqueness if provided
        if item_data.get('barcode') and self._barcode_exists(item_data['barcode']):
            raise ValueError(f"Barcode '{item_data['barcode']}' already exists")
        
        # Validate category and attributes
        if item_data.get('category_id'):
            category = self.db.query(Category).filter(
                Category.id == item_data['category_id'],
                Category.is_active == True
            ).first()
            
            if not category:
                raise ValueError("Category not found")
            
            # Validate custom attributes against schema
            if validate_attributes and category.attribute_schema:
                self._validate_item_attributes(
                    item_data.get('attributes', {}),
                    category.attribute_schema
                )
        
        # Create inventory item
        item = InventoryItem(**item_data)
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        
        # Create initial inventory movement
        self._create_inventory_movement(
            inventory_item_id=item.id,
            movement_type="initial_stock",
            quantity=item.stock_quantity,
            user_id=user_id,
            unit_cost=item.cost_price,
            notes="Initial stock entry"
        )
        
        # Log audit trail
        self._log_audit(
            user_id=user_id,
            action="CREATE_INVENTORY_ITEM",
            resource_type="InventoryItem",
            resource_id=item.id,
            new_values=item_data
        )
        
        return item
    
    def update_inventory_item(
        self, 
        item_id: str, 
        update_data: Dict[str, Any], 
        user_id: str
    ) -> InventoryItem:
        """Update inventory item with validation and audit trail"""
        
        item = self.db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
        if not item:
            raise ValueError("Inventory item not found")
        
        old_values = {
            'name': item.name,
            'sku': item.sku,
            'barcode': item.barcode,
            'category_id': str(item.category_id) if item.category_id else None,
            'cost_price': float(item.cost_price) if item.cost_price else None,
            'sale_price': float(item.sale_price) if item.sale_price else None,
            'stock_quantity': float(item.stock_quantity),
            'attributes': item.attributes
        }
        
        # Validate SKU uniqueness if being updated
        if 'sku' in update_data and update_data['sku'] != item.sku:
            if self._sku_exists(update_data['sku'], exclude_id=item_id):
                raise ValueError(f"SKU '{update_data['sku']}' already exists")
        
        # Validate barcode uniqueness if being updated
        if 'barcode' in update_data and update_data['barcode'] != item.barcode:
            if self._barcode_exists(update_data['barcode'], exclude_id=item_id):
                raise ValueError(f"Barcode '{update_data['barcode']}' already exists")
        
        # Validate category and attributes if being updated
        if 'category_id' in update_data:
            category = self.db.query(Category).filter(
                Category.id == update_data['category_id'],
                Category.is_active == True
            ).first()
            
            if not category:
                raise ValueError("Category not found")
            
            # Validate attributes against new category schema
            if 'attributes' in update_data and category.attribute_schema:
                self._validate_item_attributes(
                    update_data['attributes'],
                    category.attribute_schema
                )
        
        # Handle stock quantity changes
        if 'stock_quantity' in update_data:
            old_quantity = item.stock_quantity
            new_quantity = update_data['stock_quantity']
            quantity_change = new_quantity - old_quantity
            
            if quantity_change != 0:
                self._create_inventory_movement(
                    inventory_item_id=item.id,
                    movement_type="adjustment",
                    quantity=quantity_change,
                    user_id=user_id,
                    notes=f"Stock adjustment: {old_quantity} → {new_quantity}"
                )
        
        # Update item
        for field, value in update_data.items():
            setattr(item, field, value)
        
        item.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(item)
        
        # Log audit trail
        self._log_audit(
            user_id=user_id,
            action="UPDATE_INVENTORY_ITEM",
            resource_type="InventoryItem",
            resource_id=item.id,
            old_values=old_values,
            new_values=update_data
        )
        
        return item
    
    def search_inventory_items(
        self,
        query: Optional[str] = None,
        category_ids: Optional[List[str]] = None,
        attributes_filter: Optional[Dict[str, Any]] = None,
        tags_filter: Optional[List[str]] = None,
        sku_filter: Optional[str] = None,
        barcode_filter: Optional[str] = None,
        stock_level_filter: Optional[Dict[str, Any]] = None,
        price_range: Optional[Dict[str, float]] = None,
        business_type: Optional[str] = None,
        include_inactive: bool = False,
        sort_by: str = "name",
        sort_order: str = "asc",
        limit: int = 100,
        offset: int = 0
    ) -> Tuple[List[InventoryItem], int]:
        """Advanced search and filtering for inventory items"""
        
        base_query = self.db.query(InventoryItem).options(
            joinedload(InventoryItem.category)
        )
        
        # Base filters
        if not include_inactive:
            base_query = base_query.filter(InventoryItem.is_active == True)
        
        # Text search
        if query:
            search_terms = query.split()
            for term in search_terms:
                base_query = base_query.filter(
                    or_(
                        InventoryItem.name.ilike(f"%{term}%"),
                        InventoryItem.description.ilike(f"%{term}%"),
                        InventoryItem.sku.ilike(f"%{term}%"),
                        InventoryItem.barcode.ilike(f"%{term}%")
                    )
                )
        
        # Category filter (including subcategories)
        if category_ids:
            category_filter = []
            for cat_id in category_ids:
                # Include the category itself
                category_filter.append(InventoryItem.category_id == cat_id)
                
                # Include all subcategories (simplified approach)
                subcategories = self._get_all_subcategories(cat_id)
                for subcat_id in subcategories:
                    category_filter.append(InventoryItem.category_id == subcat_id)
            
            base_query = base_query.filter(or_(*category_filter))
        
        # Attributes filter
        if attributes_filter:
            for attr_name, attr_value in attributes_filter.items():
                if isinstance(attr_value, list):
                    # Multiple values (OR condition)
                    attr_conditions = []
                    for value in attr_value:
                        attr_conditions.append(
                            InventoryItem.attributes[attr_name].astext == str(value)
                        )
                    base_query = base_query.filter(or_(*attr_conditions))
                else:
                    # Single value
                    base_query = base_query.filter(
                        InventoryItem.attributes[attr_name].astext == str(attr_value)
                    )
        
        # Tags filter
        if tags_filter:
            for tag in tags_filter:
                base_query = base_query.filter(
                    InventoryItem.tags.any(tag)
                )
        
        # SKU filter
        if sku_filter:
            base_query = base_query.filter(InventoryItem.sku.ilike(f"%{sku_filter}%"))
        
        # Barcode filter
        if barcode_filter:
            base_query = base_query.filter(InventoryItem.barcode.ilike(f"%{barcode_filter}%"))
        
        # Stock level filter
        if stock_level_filter:
            if 'min_stock' in stock_level_filter:
                base_query = base_query.filter(
                    InventoryItem.stock_quantity >= stock_level_filter['min_stock']
                )
            if 'max_stock' in stock_level_filter:
                base_query = base_query.filter(
                    InventoryItem.stock_quantity <= stock_level_filter['max_stock']
                )
            if 'low_stock_only' in stock_level_filter and stock_level_filter['low_stock_only']:
                base_query = base_query.filter(
                    InventoryItem.stock_quantity <= InventoryItem.min_stock_level
                )
        
        # Price range filter
        if price_range:
            if 'min_price' in price_range:
                base_query = base_query.filter(
                    or_(
                        InventoryItem.sale_price >= price_range['min_price'],
                        InventoryItem.cost_price >= price_range['min_price']
                    )
                )
            if 'max_price' in price_range:
                base_query = base_query.filter(
                    or_(
                        InventoryItem.sale_price <= price_range['max_price'],
                        InventoryItem.cost_price <= price_range['max_price']
                    )
                )
        
        # Business type filter
        if business_type:
            base_query = base_query.join(Category).filter(
                or_(
                    Category.business_type == business_type,
                    Category.business_type.is_(None)
                )
            )
        
        # Get total count
        total_count = base_query.count()
        
        # Apply sorting
        sort_column = getattr(InventoryItem, sort_by, InventoryItem.name)
        if sort_order.lower() == "desc":
            base_query = base_query.order_by(desc(sort_column))
        else:
            base_query = base_query.order_by(asc(sort_column))
        
        # Apply pagination
        items = base_query.offset(offset).limit(limit).all()
        
        return items, total_count
    
    def get_low_stock_alerts(
        self,
        threshold_multiplier: float = 1.0,
        category_ids: Optional[List[str]] = None,
        business_type: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get items with low stock levels"""
        
        query = self.db.query(InventoryItem).options(
            joinedload(InventoryItem.category)
        ).filter(
            InventoryItem.is_active == True,
            InventoryItem.stock_quantity <= (InventoryItem.min_stock_level * threshold_multiplier)
        )
        
        if category_ids:
            query = query.filter(InventoryItem.category_id.in_(category_ids))
        
        if business_type:
            query = query.join(Category).filter(
                or_(
                    Category.business_type == business_type,
                    Category.business_type.is_(None)
                )
            )
        
        items = query.order_by(
            (InventoryItem.stock_quantity / InventoryItem.min_stock_level).asc()
        ).all()
        
        alerts = []
        for item in items:
            shortage = max(0, item.min_stock_level - item.stock_quantity)
            urgency_score = (item.min_stock_level - item.stock_quantity) / item.min_stock_level
            
            alerts.append({
                'item_id': str(item.id),
                'item_name': item.name,
                'sku': item.sku,
                'category_name': item.category.name if item.category else None,
                'current_stock': float(item.stock_quantity),
                'min_stock_level': item.min_stock_level,
                'shortage': shortage,
                'urgency_score': urgency_score,
                'unit_cost': float(item.cost_price) if item.cost_price else 0,
                'potential_lost_sales': shortage * float(item.sale_price or 0),
                'last_movement_date': self._get_last_movement_date(item.id)
            })
        
        return alerts
    
    def _get_all_subcategories(self, category_id: str) -> List[str]:
        """Get all subcategory IDs recursively"""
        subcategories = []
        
        # Get direct children
        children = self.db.query(Category).filter(
            Category.parent_id == category_id,
            Category.is_active == True
        ).all()
        
        for child in children:
            subcategories.append(str(child.id))
            # Recursively get grandchildren
            subcategories.extend(self._get_all_subcategories(str(child.id)))
        
        return subcategories

    # Inventory Movement Tracking
    
    def _create_inventory_movement(
        self,
        inventory_item_id: str,
        movement_type: str,
        quantity: float,
        user_id: str,
        unit_cost: Optional[float] = None,
        total_cost: Optional[float] = None,
        reference_type: Optional[str] = None,
        reference_id: Optional[str] = None,
        notes: Optional[str] = None
    ) -> InventoryMovement:
        """Create inventory movement record"""
        
        movement = InventoryMovement(
            inventory_item_id=inventory_item_id,
            movement_type=movement_type,
            quantity=quantity,
            unit_cost=unit_cost,
            total_cost=total_cost or (unit_cost * quantity if unit_cost else None),
            reference_type=reference_type,
            reference_id=reference_id,
            notes=notes,
            created_by=user_id
        )
        
        self.db.add(movement)
        self.db.commit()
        self.db.refresh(movement)
        
        return movement
    
    def get_inventory_movements(
        self,
        item_id: Optional[str] = None,
        movement_types: Optional[List[str]] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        limit: int = 100,
        offset: int = 0
    ) -> Tuple[List[InventoryMovement], int]:
        """Get inventory movements with filtering"""
        
        query = self.db.query(InventoryMovement).options(
            joinedload(InventoryMovement.inventory_item),
            joinedload(InventoryMovement.creator)
        )
        
        if item_id:
            query = query.filter(InventoryMovement.inventory_item_id == item_id)
        
        if movement_types:
            query = query.filter(InventoryMovement.movement_type.in_(movement_types))
        
        if date_from:
            query = query.filter(InventoryMovement.created_at >= date_from)
        
        if date_to:
            query = query.filter(InventoryMovement.created_at <= date_to)
        
        total_count = query.count()
        
        movements = query.order_by(desc(InventoryMovement.created_at)).offset(offset).limit(limit).all()
        
        return movements, total_count
    
    def _get_last_movement_date(self, item_id: str) -> Optional[datetime]:
        """Get the date of the last inventory movement for an item"""
        
        last_movement = self.db.query(InventoryMovement).filter(
            InventoryMovement.inventory_item_id == item_id
        ).order_by(desc(InventoryMovement.created_at)).first()
        
        return last_movement.created_at if last_movement else None

    # Utility Methods
    
    def _generate_sku(self, category_id: Optional[str] = None) -> str:
        """Generate unique SKU"""
        
        prefix = "ITEM"
        
        if category_id:
            category = self.db.query(Category).filter(Category.id == category_id).first()
            if category and category.name:
                # Use first 3 letters of category name
                prefix = re.sub(r'[^A-Z0-9]', '', category.name.upper())[:3]
        
        # Get next sequence number
        last_item = self.db.query(InventoryItem).filter(
            InventoryItem.sku.like(f"{prefix}%")
        ).order_by(desc(InventoryItem.sku)).first()
        
        if last_item and last_item.sku:
            try:
                last_number = int(last_item.sku.replace(prefix, ""))
                next_number = last_number + 1
            except ValueError:
                next_number = 1
        else:
            next_number = 1
        
        return f"{prefix}{next_number:06d}"
    
    def _sku_exists(self, sku: str, exclude_id: Optional[str] = None) -> bool:
        """Check if SKU already exists"""
        
        query = self.db.query(InventoryItem).filter(InventoryItem.sku == sku)
        
        if exclude_id:
            query = query.filter(InventoryItem.id != exclude_id)
        
        return query.first() is not None
    
    def _barcode_exists(self, barcode: str, exclude_id: Optional[str] = None) -> bool:
        """Check if barcode already exists"""
        
        query = self.db.query(InventoryItem).filter(InventoryItem.barcode == barcode)
        
        if exclude_id:
            query = query.filter(InventoryItem.id != exclude_id)
        
        return query.first() is not None
    
    def _validate_item_attributes(
        self, 
        attributes: Dict[str, Any], 
        schema: List[Dict[str, Any]]
    ):
        """Validate item attributes against category schema"""
        
        schema_dict = {attr['name']: attr for attr in schema}
        
        # Check required attributes
        for attr_name, attr_def in schema_dict.items():
            if attr_def.get('required', False) and attr_name not in attributes:
                raise ValueError(f"Required attribute '{attr_name}' is missing")
        
        # Validate attribute values
        for attr_name, attr_value in attributes.items():
            if attr_name in schema_dict:
                attr_def = schema_dict[attr_name]
                attr_type = attr_def.get('type', 'text')
                
                # Type validation
                if attr_type == 'number' and not isinstance(attr_value, (int, float)):
                    try:
                        float(attr_value)
                    except (ValueError, TypeError):
                        raise ValueError(f"Attribute '{attr_name}' must be a number")
                
                elif attr_type == 'boolean' and not isinstance(attr_value, bool):
                    if str(attr_value).lower() not in ['true', 'false', '1', '0']:
                        raise ValueError(f"Attribute '{attr_name}' must be a boolean")
                
                elif attr_type == 'date':
                    try:
                        datetime.fromisoformat(str(attr_value))
                    except ValueError:
                        raise ValueError(f"Attribute '{attr_name}' must be a valid date")
                
                elif attr_type == 'enum':
                    valid_options = attr_def.get('options', [])
                    if attr_value not in valid_options:
                        raise ValueError(f"Attribute '{attr_name}' must be one of: {valid_options}")
    
    def _log_audit(
        self,
        user_id: str,
        action: str,
        resource_type: str,
        resource_id: str,
        old_values: Optional[Dict[str, Any]] = None,
        new_values: Optional[Dict[str, Any]] = None
    ):
        """Log audit trail for inventory operations"""
        
        # Convert UUID objects to strings for JSON serialization
        def convert_uuids(obj):
            if isinstance(obj, dict):
                return {k: convert_uuids(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [convert_uuids(item) for item in obj]
            elif hasattr(obj, '__class__') and obj.__class__.__name__ == 'UUID':
                return str(obj)
            else:
                return obj
        
        safe_old_values = convert_uuids(old_values) if old_values else None
        safe_new_values = convert_uuids(new_values) if new_values else None
        
        audit_log = AuditLog(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            old_values=safe_old_values,
            new_values=safe_new_values
        )
        
        self.db.add(audit_log)
        self.db.commit()

    # Multi-Unit Support
    
    def convert_units(
        self,
        item_id: str,
        from_unit: str,
        to_unit: str,
        quantity: float
    ) -> float:
        """Convert quantity between different units of measure"""
        
        item = self.db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
        if not item:
            raise ValueError("Inventory item not found")
        
        conversion_factors = item.conversion_factors or {}
        
        # If no conversion factors defined, assume 1:1
        if not conversion_factors:
            return quantity
        
        # Get conversion factor
        conversion_key = f"{from_unit}_to_{to_unit}"
        reverse_key = f"{to_unit}_to_{from_unit}"
        
        if conversion_key in conversion_factors:
            return quantity * conversion_factors[conversion_key]
        elif reverse_key in conversion_factors:
            return quantity / conversion_factors[reverse_key]
        else:
            # Try to find indirect conversion through base unit
            base_unit = item.unit_of_measure
            
            if from_unit != base_unit and to_unit != base_unit:
                # Convert from_unit to base_unit, then base_unit to to_unit
                to_base_key = f"{from_unit}_to_{base_unit}"
                from_base_key = f"{base_unit}_to_{to_unit}"
                
                if to_base_key in conversion_factors and from_base_key in conversion_factors:
                    base_quantity = quantity * conversion_factors[to_base_key]
                    return base_quantity * conversion_factors[from_base_key]
        
        # If no conversion found, return original quantity
        return quantity

    # Real-time Stock Monitoring
    
    def get_stock_alerts_summary(self, business_type: Optional[str] = None) -> Dict[str, Any]:
        """Get summary of stock alerts and monitoring data"""
        
        query = self.db.query(InventoryItem).filter(InventoryItem.is_active == True)
        
        if business_type:
            query = query.join(Category).filter(
                or_(
                    Category.business_type == business_type,
                    Category.business_type.is_(None)
                )
            )
        
        # Stock level categories
        out_of_stock = query.filter(InventoryItem.stock_quantity <= 0).count()
        low_stock = query.filter(
            and_(
                InventoryItem.stock_quantity > 0,
                InventoryItem.stock_quantity <= InventoryItem.min_stock_level
            )
        ).count()
        
        # Total inventory value
        total_value = self.db.query(
            func.sum(InventoryItem.stock_quantity * InventoryItem.cost_price)
        ).filter(InventoryItem.is_active == True).scalar() or 0
        
        # Recent movements (last 7 days)
        week_ago = datetime.utcnow() - timedelta(days=7)
        recent_movements = self.db.query(InventoryMovement).filter(
            InventoryMovement.created_at >= week_ago
        ).count()
        
        return {
            'out_of_stock_items': out_of_stock,
            'low_stock_items': low_stock,
            'total_inventory_value': float(total_value),
            'recent_movements_count': recent_movements,
            'last_updated': datetime.utcnow().isoformat()
        }