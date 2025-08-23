from database import SessionLocal
from sqlalchemy import text

db = SessionLocal()
result = db.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'categories' ORDER BY ordinal_position"))
print("Categories table columns:", [row[0] for row in result])

result = db.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'inventory_items' ORDER BY ordinal_position"))
print("Inventory items table columns:", [row[0] for row in result])

result = db.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'customers' ORDER BY ordinal_position"))
print("Customers table columns:", [row[0] for row in result])

db.close()