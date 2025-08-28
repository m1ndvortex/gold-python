from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import engine, get_db
import models
from routers import auth, roles, inventory, customers, invoices, accounting, reports, settings, sms, analytics, profitability, customer_intelligence, inventory_intelligence, custom_reports, kpi_dashboard, analytics_data, chart_sharing, cost_analysis, category_intelligence, alerts, cache_management, backup_management, disaster_recovery, image_management, universal_inventory

# Create database tables safely
try:
    models.Base.metadata.create_all(bind=engine)
    print("Database tables created/verified successfully")
except Exception as e:
    print(f"Warning: Could not create tables: {e}")

# Seed database with initial data
try:
    from seed_data import seed_database
    seed_database()
except Exception as e:
    print(f"Warning: Could not seed database: {e}")

app = FastAPI(
    title="Gold Shop Management API",
    description="A comprehensive API for gold shop business management",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(roles.router)
app.include_router(inventory.router)
app.include_router(customers.router)
app.include_router(invoices.router)
app.include_router(accounting.router)
app.include_router(reports.router)
app.include_router(settings.router)
app.include_router(sms.router)
app.include_router(analytics.router)
app.include_router(profitability.router)
app.include_router(customer_intelligence.router)
app.include_router(inventory_intelligence.router)
app.include_router(custom_reports.router)
app.include_router(kpi_dashboard.router)
app.include_router(analytics_data.router)
app.include_router(chart_sharing.router)
app.include_router(cost_analysis.router)
app.include_router(category_intelligence.router)
app.include_router(alerts.router)
app.include_router(cache_management.router)
app.include_router(backup_management.router)
app.include_router(disaster_recovery.router)
app.include_router(image_management.router)
app.include_router(universal_inventory.router)

@app.get("/")
async def root():
    return {"message": "Gold Shop Management API", "status": "running"}

@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    """Health check endpoint to verify database connectivity"""
    try:
        # Test database connection
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "database": "connected",
            "message": "All systems operational"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)