#!/usr/bin/env python3
"""Check RBAC database tables"""

from database import engine
from sqlalchemy import text

def check_rbac_tables():
    with engine.connect() as conn:
        result = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'rbac_%' ORDER BY table_name"))
        tables = result.fetchall()
        print('RBAC tables:')
        for table in tables:
            print(f'  - {table[0]}')
        
        # Also check association tables
        result = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('role_permissions', 'user_roles', 'permission_group_permissions') ORDER BY table_name"))
        assoc_tables = result.fetchall()
        print('Association tables:')
        for table in assoc_tables:
            print(f'  - {table[0]}')

if __name__ == "__main__":
    check_rbac_tables()