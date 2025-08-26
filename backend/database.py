from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# Import Base from database_base to ensure single metadata instance
from database_base import Base

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://goldshop_user:goldshop_password@db:5432/goldshop")

# Create engine with analytics-optimized settings
engine = create_engine(
    DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    pool_recycle=3600,
    echo=False  # Set to True for SQL debugging
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_analytics_schema():
    """Create analytics schema if it doesn't exist"""
    try:
        with engine.connect() as conn:
            conn.execute(text("CREATE SCHEMA IF NOT EXISTS analytics"))
            conn.commit()
            print("✅ Analytics schema created successfully")
    except Exception as e:
        print(f"❌ Error creating analytics schema: {e}")

def refresh_materialized_views():
    """Refresh materialized views for analytics"""
    try:
        with engine.connect() as conn:
            conn.execute(text("REFRESH MATERIALIZED VIEW analytics.daily_sales_summary"))
            conn.execute(text("REFRESH MATERIALIZED VIEW analytics.inventory_turnover_summary"))
            conn.commit()
            print("✅ Materialized views refreshed successfully")
    except Exception as e:
        print(f"❌ Error refreshing materialized views: {e}")

def cleanup_expired_cache():
    """Clean up expired analytics cache entries"""
    try:
        with engine.connect() as conn:
            result = conn.execute(text("""
                DELETE FROM analytics.analytics_cache 
                WHERE expires_at < CURRENT_TIMESTAMP
            """))
            conn.commit()
            print(f"✅ Cleaned up {result.rowcount} expired cache entries")
    except Exception as e:
        print(f"❌ Error cleaning up cache: {e}")