#!/usr/bin/env python3
"""Check RBAC data"""

from database import SessionLocal
from models_rbac import RBACRole, RBACPermission

def check_rbac_data():
    with SessionLocal() as db:
        roles = db.query(RBACRole).count()
        perms = db.query(RBACPermission).count()
        print(f'Roles: {roles}, Permissions: {perms}')
        
        # List roles
        role_list = db.query(RBACRole).all()
        print('\nRoles:')
        for role in role_list:
            print(f'  - {role.name}: {role.display_name}')
        
        # List some permissions
        perm_list = db.query(RBACPermission).limit(10).all()
        print('\nFirst 10 Permissions:')
        for perm in perm_list:
            print(f'  - {perm.name}: {perm.display_name}')

if __name__ == "__main__":
    check_rbac_data()