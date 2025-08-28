from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from auth import get_current_active_user, require_permission

router = APIRouter(prefix="/roles", tags=["roles"])

@router.post("/", response_model=schemas.Role)
async def create_role(
    role: schemas.RoleCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("manage_roles"))
):
    """Create a new role"""
    # Check if role name already exists
    db_role = db.query(models.Role).filter(models.Role.name == role.name).first()
    if db_role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role name already exists"
        )
    
    db_role = models.Role(
        name=role.name,
        description=role.description,
        permissions=role.permissions
    )
    
    db.add(db_role)
    db.commit()
    db.refresh(db_role)
    
    return db_role

@router.get("/", response_model=List[schemas.Role])
async def get_roles(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get all roles"""
    roles = db.query(models.Role).offset(skip).limit(limit).all()
    return roles

@router.get("/{role_id}", response_model=schemas.Role)
async def get_role(
    role_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get a specific role by ID"""
    role = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )
    return role

@router.put("/{role_id}", response_model=schemas.Role)
async def update_role(
    role_id: str,
    role_update: schemas.RoleCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("manage_roles"))
):
    """Update a role"""
    role = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )
    
    # Check if new name conflicts with existing role (if name is being changed)
    if role_update.name != role.name:
        existing_role = db.query(models.Role).filter(models.Role.name == role_update.name).first()
        if existing_role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role name already exists"
            )
    
    role.name = role_update.name
    role.description = role_update.description
    role.permissions = role_update.permissions
    
    db.commit()
    db.refresh(role)
    
    return role

@router.delete("/{role_id}")
async def delete_role(
    role_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("manage_roles"))
):
    """Delete a role"""
    role = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )
    
    # Check if any users are assigned to this role
    users_with_role = db.query(models.User).filter(models.User.role_id == role_id).count()
    if users_with_role > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete role. {users_with_role} users are assigned to this role."
        )
    
    db.delete(role)
    db.commit()
    
    return {"message": "Role deleted successfully"}

@router.get("/permissions/available")
async def get_available_permissions(
    current_user: models.User = Depends(get_current_active_user)
):
    """Get list of available permissions"""
    permissions = {
        "view_dashboard": "View dashboard and summary information",
        "view_inventory": "View inventory items and categories",
        "edit_inventory": "Add, edit, and delete inventory items",
        "view_customers": "View customer information and history",
        "edit_customers": "Add, edit, and delete customers",
        "view_invoices": "View invoices and sales data",
        "create_invoices": "Create new invoices and process sales",
        "edit_invoices": "Edit and delete invoices",
        "view_accounting": "View accounting ledgers and financial data",
        "edit_accounting": "Add and edit accounting entries",
        "view_reports": "View reports and analytics",
        "send_sms": "Send SMS notifications to customers",
        "manage_settings": "Manage company settings and configuration",
        "manage_roles": "Create and manage user roles",
        "manage_users": "Create and manage user accounts"
    }
    
    return {"permissions": permissions}