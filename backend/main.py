from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import engine, get_db
import models
from routers import auth, oauth2_auth, roles, inventory, customers, invoices, reports, settings, sms, analytics, profitability, customer_intelligence, inventory_intelligence, custom_reports, kpi_dashboard, analytics_data, chart_sharing, cost_analysis, category_intelligence, alerts, cache_management, backup_management, disaster_recovery, image_management, business_config, localization, advanced_analytics, api_gateway, api_documentation
try:
    from routers import accounting
    ACCOUNTING_AVAILABLE = True
except ImportError:
    ACCOUNTING_AVAILABLE = False

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
    title="Universal Business Management API",
    description="""
    A comprehensive API for universal business management with enterprise-grade features:
    
    ## Features
    - **Full CRUD Operations**: Complete REST API for all business entities
    - **API Key Management**: Secure API key authentication with rate limiting
    - **Webhook System**: Real-time event notifications with retry logic
    - **Bulk Operations**: Import/export capabilities with data validation
    - **Workflow Automation**: Trigger-based actions and business process automation
    - **External Integrations**: Connect with payment processors, shipping, and accounting services
    - **Rate Limiting**: Configurable rate limits per API key
    - **Usage Analytics**: Comprehensive API usage tracking and analytics
    - **Interactive Documentation**: Built-in API documentation with testing capabilities
    
    ## Authentication
    Use Bearer token authentication with your API key:
    ```
    Authorization: Bearer your_api_key_here
    ```
    
    ## Rate Limits
    - Default: 60 requests/minute, 1000 requests/hour, 10000 requests/day
    - Custom limits available per API key
    
    ## Webhooks
    Subscribe to real-time events:
    - invoice.created, invoice.updated
    - inventory.low_stock, inventory.updated
    - customer.created, customer.updated
    - payment.received, payment.failed
    
    ## Business Types Supported
    - Gold Shop, Retail Store, Restaurant, Service Business
    - Manufacturing, Wholesale, Pharmacy, Automotive
    - Custom business types with configurable workflows
    """,
    version="2.0.0",
    contact={
        "name": "API Support",
        "email": "api-support@universalbusiness.com"
    },
    license_info={
        "name": "MIT License",
        "url": "https://opensource.org/licenses/MIT"
    }
)

# Configure CORS for Docker networking
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://frontend:3000", 
        "http://127.0.0.1:3000",
        "http://0.0.0.0:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(oauth2_auth.router)
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
app.include_router(business_config.router)
app.include_router(localization.router)
app.include_router(advanced_analytics.router)
app.include_router(api_gateway.router)
app.include_router(api_documentation.router)

# Include accounting router if available
if ACCOUNTING_AVAILABLE:
    app.include_router(accounting.router)

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