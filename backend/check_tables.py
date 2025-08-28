#!/usr/bin/env python3
"""Check existing database tables"""

from database import engine
from sqlalchemy import text

def check_tables():
    with engine.connect() as conn:
        result = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"))
        tables = result.fetchall()
        print('Existing tables:')
        for table in tables:
            print(f'  - {table[0]}')

if __name__ == "__main__":
    check_tables()