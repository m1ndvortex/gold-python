from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import engine, get_db
import models

# Create database tables
models.Base.metadata.create_all(bind=engine)

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