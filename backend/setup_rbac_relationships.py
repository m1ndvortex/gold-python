"""
Set up RBAC relationships after all models are defined
This avoids circular import issues
"""

from sqlalchemy.orm import relationship
from models_universal import User
from models_rbac import RBACRole, user_roles

def setup_rbac_relationships():
    """Set up the many-to-many relationship between User and RBACRole"""
    
    # Set up the relationship on User model
    User.rbac_roles = relationship(
        "RBACRole", 
        secondary=user_roles, 
        back_populates="users",
        primaryjoin="User.id == user_roles.c.user_id",
        secondaryjoin="RBACRole.id == user_roles.c.role_id"
    )
    
    # The relationship on RBACRole is already defined in models_rbac.py
    print("✅ RBAC relationships set up successfully")

if __name__ == "__main__":
    setup_rbac_relationships()