from sqlalchemy import create_engine, text

engine = create_engine('postgresql://goldshop_user:goldshop_password@goldshop_test_db:5432/goldshop')
with engine.connect() as conn:
    result = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"))
    tables = [row[0] for row in result]
    print("Available tables:")
    for table in tables:
        print(f"  - {table}")