"""
Check table structure
"""

import os
from sqlalchemy import create_engine, inspect

def check_table_structure():
    database_url = os.getenv("DATABASE_URL", "postgresql://goldshop_user:goldshop_password@db:5432/goldshop")
    engine = create_engine(database_url)
    inspector = inspect(engine)
    
    if 'chart_of_accounts' in inspector.get_table_names():
        columns = inspector.get_columns('chart_of_accounts')
        print('Chart of Accounts columns:')
        for col in columns:
            print(f'  {col["name"]}: {str(col["type"])}')
    else:
        print('chart_of_accounts table does not exist')
        print('Available tables:', inspector.get_table_names())

if __name__ == "__main__":
    check_table_structure()