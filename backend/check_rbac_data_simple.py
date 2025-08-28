#!/usr/bin/env python3
"""Check RBAC data with simple queries"""

from database import engine
from sqlalchemy import text

def check_rbac_data():
    with engine.connect() as conn:
        # Count roles and permissions
        roles_result = conn.execute(text("SELECT COUNT(*) FROM rbac_roles"))
        roles_count = roles_result.scalar()
        
        perms_result = conn.execute(text("SELECT COUNT(*) FROM rbac_permissions"))
        perms_count = perms_result.scalar()
        
        print(f'Roles: {roles_count}, Permissions: {perms_count}')
        
        # List roles
        roles_result = conn.execute(text("SELECT name, display_name FROM rbac_roles ORDER BY priority DESC"))
        roles = roles_result.fetchall()
        print('\nRoles:')
        for role in roles:
            print(f'  - {role[0]}: {role[1]}')
        
        # List some permissions by category
        perms_result = conn.execute(text("SELECT name, display_name, category FROM rbac_permissions ORDER BY category, name LIMIT 15"))
        perms = perms_result.fetchall()
        print('\nFirst 15 Permissions:')
        for perm in perms:
            print(f'  - {perm[0]} ({perm[2]}): {perm[1]}')
        
        # Check user role assignments
        user_roles_result = conn.execute(text("SELECT COUNT(*) FROM user_roles"))
        user_roles_count = user_roles_result.scalar()
        print(f'\nUser role assignments: {user_roles_count}')

if __name__ == "__main__":
    check_rbac_data()