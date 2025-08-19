"""
Update existing role permissions to fix Settings access
"""

from sqlalchemy.orm import Session
from database import SessionLocal
from models import Role

def update_permissions():
    """Update existing role permissions"""
    db = SessionLocal()
    
    try:
        print("Updating role permissions...")
        
        # Update Owner role permissions
        owner_role = db.query(Role).filter(Role.name == 'Owner').first()
        if owner_role:
            owner_role.permissions.update({
                "edit_settings": True,
                "manage_settings": True
            })
            print("Updated Owner role permissions")
        
        # Update Manager role permissions
        manager_role = db.query(Role).filter(Role.name == 'Manager').first()
        if manager_role:
            manager_role.permissions.update({
                "edit_settings": True
            })
            print("Updated Manager role permissions")
        
        db.commit()
        print("Permissions updated successfully!")
        
    except Exception as e:
        print(f"Error updating permissions: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    update_permissions()