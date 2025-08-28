#!/usr/bin/env python3
"""Check User table columns"""

from database import engine
from sqlalchemy import text

def check_user_columns():
    with engine.connect() as conn:
        result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position"))
        columns = result.fetchall()
        print('Users table columns:')
        for col in columns:
            print(f'  - {col[0]}')

if __name__ == "__main__":
    check_user_columns()