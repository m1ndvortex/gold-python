from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from uuid import UUID
import bcrypt
from datetime import datetime

from database import get_db
from oauth2_middleware import get_current_user, require_permission
import models
import schemas

router = APIRouter(prefix="/settings", tags=["settings"])

# Company Settings Endpoints
@router.get("/company", response_model=schemas.CompanySettings)
async def get_company_settings(
    db: Session = Depends(get_db),
    current_user: UUID = Depends(require_permission("view_settings"))
):
    """Get company settings"""
    settings = db.query(models.CompanySettings).first()
    if not settings:
        # Create default settings if none exist
        settings = models.CompanySettings(
            company_name="Gold Shop",
            default_gold_price=50.0,
            default_labor_percentage=10.0,
            default_profit_percentage=15.0,
            default_vat_percentage=5.0,
            invoice_template={}
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

@router.put("/company", response_model=schemas.SettingsUpdateResponse)
async def update_company_settings(
    settings_update: schemas.CompanySettingsUpdate,
    db: Session = Depends(get_db),
    current_user: UUID = Depends(require_permission("edit_settings"))
):
    """Update company settings"""
    settings = db.query(models.CompanySettings).first()
    if not settings:
        # Create new settings if none exist
        settings = models.CompanySettings()
        db.add(settings)
    
    updated_fields = []
    update_data = settings_update.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        if hasattr(settings, field):
            setattr(settings, field, value)
            updated_fields.append(field)
    
    settings.updated_at = datetime.utcnow()
    db.commit()
    
    return schemas.SettingsUpdateResponse(
        success=True,
        message="Company settings updated successfully",
        updated_fields=updated_fields
    )

# Gold Price Configuration Endpoints
@router.get("/gold-price", response_model=schemas.GoldPriceConfig)
async def get_gold_price_config(
    db: Session = Depends(get_db),
    current_user: UUID = Depends(require_permission("view_settings"))
):
    """Get current gold price configuration"""
    settings = db.query(models.CompanySettings).first()
    if not settings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company settings not found"
        )
    
    return schemas.GoldPriceConfig(
        current_price=settings.default_gold_price or 50.0,
        auto_update_enabled=False,  # TODO: Implement auto-update feature
        api_source=None,
        last_updated=settings.updated_at,
        update_frequency_hours=24
    )

@router.put("/gold-price", response_model=schemas.SettingsUpdateResponse)
async def update_gold_price(
    price_update: schemas.GoldPriceUpdate,
    db: Session = Depends(get_db),
    current_user: UUID = Depends(require_permission("edit_settings"))
):
    """Update gold price manually"""
    settings = db.query(models.CompanySettings).first()
    if not settings:
        settings = models.CompanySettings()
        db.add(settings)
    
    settings.default_gold_price = price_update.price
    settings.updated_at = datetime.utcnow()
    db.commit()
    
    return schemas.SettingsUpdateResponse(
        success=True,
        message=f"Gold price updated to {price_update.price} per gram",
        updated_fields=["default_gold_price"]
    )

# Invoice Template Endpoints
@router.get("/invoice-template", response_model=schemas.InvoiceTemplate)
async def get_invoice_template(
    db: Session = Depends(get_db),
    current_user: UUID = Depends(require_permission("view_settings"))
):
    """Get current invoice template"""
    settings = db.query(models.CompanySettings).first()
    if not settings or not settings.invoice_template:
        # Return default template
        return schemas.InvoiceTemplate(
            name="Default Template",
            layout="portrait",
            page_size="A4",
            margins={"top": 20, "right": 20, "bottom": 20, "left": 20},
            header=schemas.InvoiceTemplateSection(
                name="header",
                fields=[
                    schemas.InvoiceTemplateField(
                        name="company_logo",
                        label="Company Logo",
                        type="image",
                        position={"x": 20, "y": 20},
                        style={"width": 100, "height": 50}
                    ),
                    schemas.InvoiceTemplateField(
                        name="company_name",
                        label="Company Name",
                        type="text",
                        position={"x": 140, "y": 30},
                        style={"font_size": 18, "font_weight": "bold"}
                    )
                ],
                position={"x": 0, "y": 0},
                style={"background_color": "#f8f9fa"}
            ),
            body=schemas.InvoiceTemplateSection(
                name="body",
                fields=[
                    schemas.InvoiceTemplateField(
                        name="invoice_number",
                        label="Invoice Number",
                        type="text",
                        position={"x": 20, "y": 100},
                        style={"font_size": 12}
                    ),
                    schemas.InvoiceTemplateField(
                        name="customer_name",
                        label="Customer Name",
                        type="text",
                        position={"x": 20, "y": 120},
                        style={"font_size": 12}
                    ),
                    schemas.InvoiceTemplateField(
                        name="items_table",
                        label="Items Table",
                        type="table",
                        position={"x": 20, "y": 160},
                        style={"width": 550, "font_size": 10}
                    )
                ],
                position={"x": 0, "y": 80},
                style={}
            ),
            footer=schemas.InvoiceTemplateSection(
                name="footer",
                fields=[
                    schemas.InvoiceTemplateField(
                        name="total_amount",
                        label="Total Amount",
                        type="text",
                        position={"x": 400, "y": 20},
                        style={"font_size": 14, "font_weight": "bold"}
                    )
                ],
                position={"x": 0, "y": 700},
                style={"border_top": "1px solid #ccc"}
            ),
            styles={
                "font_family": "Arial",
                "primary_color": "#333333",
                "secondary_color": "#666666"
            }
        )
    
    return schemas.InvoiceTemplate(**settings.invoice_template)

@router.put("/invoice-template", response_model=schemas.SettingsUpdateResponse)
async def update_invoice_template(
    template_update: schemas.InvoiceTemplateUpdate,
    db: Session = Depends(get_db),
    current_user: UUID = Depends(require_permission("edit_settings"))
):
    """Update invoice template"""
    settings = db.query(models.CompanySettings).first()
    if not settings:
        settings = models.CompanySettings()
        db.add(settings)
    
    settings.invoice_template = template_update.template.model_dump()
    settings.updated_at = datetime.utcnow()
    db.commit()
    
    return schemas.SettingsUpdateResponse(
        success=True,
        message="Invoice template updated successfully",
        updated_fields=["invoice_template"]
    )

# Role Management Endpoints
@router.get("/roles", response_model=List[schemas.RoleWithUsers])
async def get_all_roles(
    db: Session = Depends(get_db),
    current_user: UUID = Depends(require_permission("view_roles"))
):
    """Get all roles with their users"""
    roles = db.query(models.Role).all()
    result = []
    for role in roles:
        users = db.query(models.User).filter(models.User.role_id == role.id).all()
        role_data = schemas.RoleWithUsers(
            id=role.id,
            name=role.name,
            description=role.description,
            permissions=role.permissions,
            created_at=role.created_at,
            users=[schemas.User.from_orm(user) for user in users]
        )
        result.append(role_data)
    return result

@router.post("/roles", response_model=schemas.Role)
async def create_role(
    role_data: schemas.RoleCreate,
    db: Session = Depends(get_db),
    current_user: UUID = Depends(require_permission("manage_roles"))
):
    """Create a new role"""
    # Check if role name already exists
    existing_role = db.query(models.Role).filter(models.Role.name == role_data.name).first()
    if existing_role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role name already exists"
        )
    
    role = models.Role(**role_data.model_dump())
    db.add(role)
    db.commit()
    db.refresh(role)
    return role

@router.put("/roles/{role_id}", response_model=schemas.Role)
async def update_role(
    role_id: UUID,
    role_update: schemas.RoleUpdate,
    db: Session = Depends(get_db),
    current_user: UUID = Depends(require_permission("manage_roles"))
):
    """Update a role"""
    role = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )
    
    update_data = role_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(role, field, value)
    
    db.commit()
    db.refresh(role)
    return role

@router.delete("/roles/{role_id}")
async def delete_role(
    role_id: UUID,
    db: Session = Depends(get_db),
    current_user: UUID = Depends(require_permission("manage_roles"))
):
    """Delete a role"""
    role = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )
    
    # Check if role is assigned to any users
    users_with_role = db.query(models.User).filter(models.User.role_id == role_id).count()
    if users_with_role > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete role. {users_with_role} users are assigned to this role."
        )
    
    db.delete(role)
    db.commit()
    return {"message": "Role deleted successfully"}

# Permission Structure Endpoint
@router.get("/permissions", response_model=schemas.PermissionStructure)
async def get_permission_structure(
    current_user: UUID = Depends(require_permission("view_roles"))
):
    """Get the available permission structure"""
    return schemas.PermissionStructure(
        categories=[
            schemas.PermissionCategory(
                name="inventory",
                label="Inventory Management",
                permissions=[
                    {"key": "view_inventory", "label": "View Inventory"},
                    {"key": "add_inventory", "label": "Add Inventory Items"},
                    {"key": "edit_inventory", "label": "Edit Inventory Items"},
                    {"key": "delete_inventory", "label": "Delete Inventory Items"},
                    {"key": "manage_categories", "label": "Manage Categories"}
                ]
            ),
            schemas.PermissionCategory(
                name="customers",
                label="Customer Management",
                permissions=[
                    {"key": "view_customers", "label": "View Customers"},
                    {"key": "add_customers", "label": "Add Customers"},
                    {"key": "edit_customers", "label": "Edit Customers"},
                    {"key": "delete_customers", "label": "Delete Customers"},
                    {"key": "manage_payments", "label": "Manage Customer Payments"}
                ]
            ),
            schemas.PermissionCategory(
                name="invoices",
                label="Invoice Management",
                permissions=[
                    {"key": "view_invoices", "label": "View Invoices"},
                    {"key": "create_invoices", "label": "Create Invoices"},
                    {"key": "edit_invoices", "label": "Edit Invoices"},
                    {"key": "delete_invoices", "label": "Delete Invoices"},
                    {"key": "process_payments", "label": "Process Invoice Payments"}
                ]
            ),
            schemas.PermissionCategory(
                name="accounting",
                label="Accounting & Finance",
                permissions=[
                    {"key": "view_accounting", "label": "View Accounting Records"},
                    {"key": "add_accounting", "label": "Add Accounting Entries"},
                    {"key": "edit_accounting", "label": "Edit Accounting Entries"},
                    {"key": "delete_accounting", "label": "Delete Accounting Entries"},
                    {"key": "view_financial_reports", "label": "View Financial Reports"}
                ]
            ),
            schemas.PermissionCategory(
                name="reports",
                label="Reports & Analytics",
                permissions=[
                    {"key": "view_reports", "label": "View Reports"},
                    {"key": "export_reports", "label": "Export Reports"},
                    {"key": "view_analytics", "label": "View Analytics Dashboard"}
                ]
            ),
            schemas.PermissionCategory(
                name="settings",
                label="System Settings",
                permissions=[
                    {"key": "view_settings", "label": "View Settings"},
                    {"key": "edit_settings", "label": "Edit Company Settings"},
                    {"key": "manage_users", "label": "Manage Users"},
                    {"key": "manage_roles", "label": "Manage Roles & Permissions"},
                    {"key": "view_roles", "label": "View Roles"}
                ]
            ),
            schemas.PermissionCategory(
                name="sms",
                label="SMS & Communications",
                permissions=[
                    {"key": "send_sms", "label": "Send SMS Messages"},
                    {"key": "view_sms_history", "label": "View SMS History"},
                    {"key": "manage_sms_templates", "label": "Manage SMS Templates"}
                ]
            )
        ]
    )

# User Management Endpoints
@router.get("/users", response_model=schemas.UserListResponse)
async def get_all_users(
    page: int = 1,
    per_page: int = 50,
    db: Session = Depends(get_db),
    current_user: UUID = Depends(require_permission("manage_users"))
):
    """Get all users with pagination"""
    offset = (page - 1) * per_page
    
    users_query = db.query(models.User).offset(offset).limit(per_page)
    users = users_query.all()
    total = db.query(models.User).count()
    
    user_list = []
    for user in users:
        role = db.query(models.Role).filter(models.Role.id == user.role_id).first()
        user_data = schemas.UserManagement(
            id=user.id,
            username=user.username,
            email=user.email,
            role_id=user.role_id,
            is_active=user.is_active,
            created_at=user.created_at,
            updated_at=user.updated_at,
            role=schemas.Role.from_orm(role) if role else None
        )
        user_list.append(user_data)
    
    return schemas.UserListResponse(
        users=user_list,
        total=total,
        page=page,
        per_page=per_page
    )

@router.post("/users", response_model=schemas.UserManagement)
async def create_user(
    user_data: schemas.UserCreate,
    db: Session = Depends(get_db),
    current_user: UUID = Depends(require_permission("manage_users"))
):
    """Create a new user"""
    # Check if username or email already exists
    existing_user = db.query(models.User).filter(
        (models.User.username == user_data.username) | 
        (models.User.email == user_data.email)
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already exists"
        )
    
    # Hash password
    password_hash = bcrypt.hashpw(user_data.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    user = models.User(
        username=user_data.username,
        email=user_data.email,
        password_hash=password_hash,
        role_id=user_data.role_id
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Get role information
    role = db.query(models.Role).filter(models.Role.id == user.role_id).first()
    
    return schemas.UserManagement(
        id=user.id,
        username=user.username,
        email=user.email,
        role_id=user.role_id,
        is_active=user.is_active,
        created_at=user.created_at,
        updated_at=user.updated_at,
        role=schemas.Role.from_orm(role) if role else None
    )

@router.put("/users/{user_id}", response_model=schemas.UserManagement)
async def update_user(
    user_id: UUID,
    user_update: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: UUID = Depends(require_permission("manage_users"))
):
    """Update a user"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    update_data = user_update.model_dump(exclude_unset=True)
    
    # Check for username/email conflicts
    if 'username' in update_data or 'email' in update_data:
        existing_user = db.query(models.User).filter(
            models.User.id != user_id,
            (models.User.username == update_data.get('username', user.username)) | 
            (models.User.email == update_data.get('email', user.email))
        ).first()
        
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username or email already exists"
            )
    
    for field, value in update_data.items():
        setattr(user, field, value)
    
    user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    
    # Get role information
    role = db.query(models.Role).filter(models.Role.id == user.role_id).first()
    
    return schemas.UserManagement(
        id=user.id,
        username=user.username,
        email=user.email,
        role_id=user.role_id,
        is_active=user.is_active,
        created_at=user.created_at,
        updated_at=user.updated_at,
        role=schemas.Role.from_orm(role) if role else None
    )

@router.put("/users/{user_id}/password", response_model=schemas.SettingsUpdateResponse)
async def update_user_password(
    user_id: UUID,
    password_update: schemas.UserPasswordUpdate,
    db: Session = Depends(get_db),
    current_user: UUID = Depends(require_permission("manage_users"))
):
    """Update user password"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Verify current password
    if not bcrypt.checkpw(password_update.current_password.encode('utf-8'), user.password_hash.encode('utf-8')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Hash new password
    new_password_hash = bcrypt.hashpw(password_update.new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    user.password_hash = new_password_hash
    user.updated_at = datetime.utcnow()
    
    db.commit()
    
    return schemas.SettingsUpdateResponse(
        success=True,
        message="Password updated successfully",
        updated_fields=["password"]
    )

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: UUID = Depends(require_permission("manage_users"))
):
    """Delete a user"""
    # Prevent self-deletion
    if user_id == current_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}

# Role Assignment Endpoint
@router.post("/users/{user_id}/assign-role")
async def assign_role_to_user(
    user_id: UUID,
    role_assignment: schemas.RoleAssignment,
    db: Session = Depends(get_db),
    current_user: UUID = Depends(require_permission("manage_users"))
):
    """Assign a role to a user"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    role = db.query(models.Role).filter(models.Role.id == role_assignment.role_id).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )
    
    user.role_id = role_assignment.role_id
    user.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": f"Role '{role.name}' assigned to user '{user.username}' successfully"}

# System Settings Overview
@router.get("/system", response_model=schemas.SystemSettings)
async def get_system_settings(
    db: Session = Depends(get_db),
    current_user: UUID = Depends(require_permission("view_settings"))
):
    """Get complete system settings overview"""
    # Get company settings
    company_settings = db.query(models.CompanySettings).first()
    if not company_settings:
        company_settings = models.CompanySettings(
            company_name="Gold Shop",
            default_gold_price=50.0,
            default_labor_percentage=10.0,
            default_profit_percentage=15.0,
            default_vat_percentage=5.0,
            invoice_template={}
        )
    
    # Get gold price config
    gold_price_config = schemas.GoldPriceConfig(
        current_price=company_settings.default_gold_price or 50.0,
        auto_update_enabled=False,
        last_updated=company_settings.updated_at
    )
    
    # Get invoice template
    if company_settings.invoice_template:
        invoice_template = schemas.InvoiceTemplate(**company_settings.invoice_template)
    else:
        # Default template (same as in get_invoice_template)
        invoice_template = schemas.InvoiceTemplate(
            name="Default Template",
            layout="portrait",
            page_size="A4",
            margins={"top": 20, "right": 20, "bottom": 20, "left": 20},
            header=schemas.InvoiceTemplateSection(
                name="header",
                fields=[],
                position={"x": 0, "y": 0},
                style={}
            ),
            body=schemas.InvoiceTemplateSection(
                name="body",
                fields=[],
                position={"x": 0, "y": 80},
                style={}
            ),
            footer=schemas.InvoiceTemplateSection(
                name="footer",
                fields=[],
                position={"x": 0, "y": 700},
                style={}
            ),
            styles={"font_family": "Arial"}
        )
    
    # Get permissions structure
    permissions = await get_permission_structure(current_user)
    
    return schemas.SystemSettings(
        company=schemas.CompanySettings.from_orm(company_settings),
        gold_price=gold_price_config,
        invoice_template=invoice_template,
        permissions=permissions
    )