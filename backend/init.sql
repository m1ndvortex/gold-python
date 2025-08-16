-- Initial database setup for Gold Shop Management System
-- This file is executed when the PostgreSQL container starts

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Note: Tables will be created by SQLAlchemy when the backend starts
-- This file only sets up extensions and will be extended later with seed data