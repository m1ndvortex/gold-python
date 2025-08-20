# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Overview

This is a **Gold Shop Management System** (طلافروشی) - a comprehensive, enterprise-grade web application for gold shop business management built with React TypeScript frontend and FastAPI backend, fully containerized with Docker. The system handles authentication, inventory management, customer management, invoicing, accounting, SMS notifications, and comprehensive reporting with Persian RTL support.

**Key Characteristics:**
- **Professional Enterprise UI**: Modern, sophisticated interface with gold-themed design suitable for luxury business
- **Advanced Category Management**: Hierarchical product categorization with unlimited nesting, custom attributes, and drag-and-drop reordering
- **Real Database Testing**: All development and testing occurs within Docker using real PostgreSQL (no mocking allowed)
- **Module Interconnectivity**: Seamless data flow between inventory → invoices → customers → accounting → dashboard
- **Gram-based Pricing**: Core business logic centered around weight-based gold pricing calculations

## Architecture

### Technology Stack
- **Backend**: FastAPI (Python 3.11+) with SQLAlchemy ORM, PostgreSQL 15
- **Frontend**: React 18 + TypeScript, shadcn/ui, Tailwind CSS with RTL support
- **Database**: PostgreSQL 15 with UUID primary keys, automatic timestamps
- **Infrastructure**: Docker & Docker Compose with persistent volumes
- **Authentication**: JWT-based with role-based permissions
- **Testing**: Real database integration testing (no mocking)

### Core Modules
1. **Authentication** (`/auth`) - JWT auth with role-based permissions and user management
2. **Dashboard** - Real-time metrics, professional charts, smart alerts with modern UI
3. **Inventory Management** - Advanced hierarchical categories, product variants, multi-category assignments
4. **Customer Management** - Customer profiles, debt tracking, purchase history with mobile-optimized interface
5. **Invoicing** - Gram-based invoice creation with drag-and-drop template designer
6. **Accounting** - Multi-ledger system (Income, Expense, Cash/Bank, Gold Weight) with automated entries
7. **Reports & Analytics** - Interactive charts, profitability analysis, customer intelligence with export capabilities
8. **SMS Notifications** - Batch SMS campaigns with templates and delivery tracking
9. **Settings** - Company configuration, role management, gold price updates, invoice customization
10. **Category Management** - Enterprise-grade category system with unlimited nesting, custom attributes, and templates

### Key Database Models
- **Users & Roles**: JWT authentication with granular permissions and role-based UI visibility
- **Categories**: Advanced hierarchical categorization with unlimited nesting, custom attributes, metadata
- **CategoryTemplates**: Reusable category structures with predefined attributes
- **InventoryItems**: Weight-based inventory with multiple category assignments, variants, tiered pricing
- **Customers**: Comprehensive profile management with debt tracking, payment history, SMS preferences
- **Invoices & InvoiceItems**: Gram-based pricing with customizable templates and partial payment support
- **AccountingEntries**: Multi-ledger system with automatic transaction recording
- **Payments**: Detailed payment history with multiple payment methods and invoice linking
- **CompanySettings**: System configuration including gold prices, invoice templates, business rules

## Development Commands

### Starting Development Environment
```bash
# Using development scripts (recommended)
.\scripts\dev.ps1 start     # Windows PowerShell
./scripts/dev.sh start      # Linux/Mac

# Manual Docker commands
docker-compose up --build -d

# Access points
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Documentation: http://localhost:8000/docs
```

### Testing Commands
```bash
# Run all tests (backend + frontend with real database)
.\scripts\dev.ps1 test                           # Windows
./scripts/dev.sh test                            # Linux/Mac
docker-compose -f docker-compose.test.yml up --build --abort-on-container-exit

# Run backend tests only (with main PostgreSQL database)
.\scripts\dev.ps1 test-backend                   # Windows
./scripts/dev.sh test-backend                    # Linux/Mac

# Run frontend tests only (with main backend)
.\scripts\dev.ps1 test-frontend                  # Windows
./scripts/dev.sh test-frontend                   # Linux/Mac

# Run specific test files
docker-compose exec backend python -m pytest tests/test_inventory.py -v
docker-compose exec frontend npm test -- --testPathPattern=inventory --watchAll=false
```

### Development Workflow Commands
```bash
# View logs
.\scripts\dev.ps1 logs      # Windows
./scripts/dev.sh logs       # Linux/Mac
docker-compose logs -f [service-name]

# Execute commands in containers
docker-compose exec backend python -m pytest
docker-compose exec frontend npm install @types/new-package

# Database operations
docker-compose exec db psql -U goldshop_user -d goldshop
docker-compose exec backend python -m alembic upgrade head
docker-compose exec backend python seed_data.py

# Stop services
.\scripts\dev.ps1 stop      # Windows
./scripts/dev.sh stop       # Linux/Mac
docker-compose down

# Clean up (removes volumes and cached data)
.\scripts\dev.ps1 clean     # Windows
./scripts/dev.sh clean      # Linux/Mac
```

## Development Standards

### Docker-First Development (CRITICAL)
- **Everything runs in Docker** - No local Node.js, Python, or database installations
- **Real database testing** - ALL tests use the main PostgreSQL database (no mocking allowed)
- **Integration testing** - Frontend tests hit real backend APIs running in containers
- **Persistent volumes** - Data survives container restarts via Docker volumes
- **Production-ready approach** - All development mimics production environment

### Testing Philosophy (MANDATORY)
- **Real integrations only** - No mocking of database connections or API calls
- **Docker environment** - All tests run in containerized environment
- **Persistent data** - Tests use main database with real data persistence
- **Full stack testing** - Frontend tests interact with real backend services
- **Comprehensive coverage** - Every feature must include unit tests with real database operations

### UI/UX Standards
- **Enterprise-grade design** - Professional, modern interface suitable for luxury gold business
- **ShadCN UI components** - Consistent component library with custom theming
- **Gold-themed design** - Sophisticated color palette with gold accents and premium aesthetics
- **Responsive design** - Mobile-first approach with touch-friendly interactions
- **Accessibility compliance** - WCAG 2.1 AA standards with keyboard navigation and screen reader support

### Key Environment Variables
```bash
DATABASE_URL=postgresql://goldshop_user:goldshop_password@db:5432/goldshop
JWT_SECRET=your-super-secret-jwt-key-change-in-production
SMS_API_KEY=your-sms-api-key
REACT_APP_API_URL=http://localhost:8000
```

## Architecture Patterns

### Backend Structure
```
backend/
├── main.py                 # FastAPI app with all router inclusions
├── models.py               # SQLAlchemy models with UUID PKs and relationships
├── schemas.py              # Pydantic models for API validation
├── auth.py                 # JWT authentication utilities
├── database.py             # Database connection and session management
├── routers/                # API endpoints organized by domain
│   ├── auth.py            # Authentication endpoints
│   ├── inventory.py       # Inventory management
│   ├── customers.py       # Customer management
│   ├── invoices.py        # Invoice creation and management
│   ├── accounting.py      # Multi-ledger accounting system
│   ├── reports.py         # Comprehensive reporting
│   ├── analytics.py       # Business intelligence
│   ├── settings.py        # System configuration
│   └── sms.py             # SMS notifications
├── services/              # Business logic services
└── tests/                 # Integration tests with real database
```

### Frontend Structure
```
frontend/src/
├── components/
│   ├── auth/              # Authentication components
│   ├── dashboard/         # Dashboard with real-time metrics
│   ├── inventory/         # Inventory management with charts
│   ├── customers/         # Customer management
│   ├── invoices/          # Invoice creation and templates
│   ├── accounting/        # Multi-ledger accounting views
│   ├── reports/           # Interactive charts and analytics
│   ├── settings/          # System settings and role management
│   ├── sms/               # SMS campaign management
│   └── ui/                # shadcn/ui components
├── hooks/                 # Custom React hooks
├── services/              # API service functions
├── types/                 # TypeScript type definitions
├── pages/                 # Page-level components
└── utils/                 # Utility functions including RTL support
```

### Data Flow Patterns
1. **Authentication**: JWT tokens with role-based permissions stored in user context
2. **State Management**: React Query for server state, React hooks for local state
3. **API Integration**: Centralized API services with error handling
4. **Real-time Updates**: Dashboard metrics update on data changes
5. **Persian RTL Support**: Tailwind RTL plugin with Persian date handling

### Business Logic Integration
- **Gram-based Pricing**: Core calculation engine - Final Price = Weight × (Gold Price + Labor + Profit + VAT)
- **Multi-ledger Accounting**: Income, Expense, Cash/Bank, Gold Weight ledgers with automatic transaction recording
- **Advanced Category System**: Hierarchical categorization with unlimited nesting, custom attributes, and drag-and-drop management
- **Role-based Permissions**: Dynamic UI showing/hiding features based on user roles and granular permissions
- **Customer Debt Tracking**: Partial payments and debt management integrated across all modules with automatic updates
- **SMS Notifications**: Batch SMS campaigns with templates, delivery tracking, and customer targeting
- **Module Interconnectivity**: Automatic data flow - inventory changes update invoices, customer records, accounting ledgers, and dashboard metrics
- **Invoice Customization**: Drag-and-drop template designer with logo, fonts, colors, and field customization

### Performance Considerations
- **Database Indexing**: Strategic indexes on frequently queried columns (customer_id, created_at, status)
- **Persistent Volumes**: Docker volumes for database, uploads, and node_modules
- **Hot Reloading**: Development containers with volume mounts for instant code changes
- **Connection Pooling**: SQLAlchemy connection pooling for database performance

### Persian/RTL Support
- **Tailwind RTL**: Full RTL layout support with Persian fonts and right-to-left text flow
- **Date Handling**: Persian calendar integration with moment-jalaali for Jalali date system
- **Bilingual Interface**: Seamless language switching between Persian and English with proper RTL layout
- **Cultural Adaptations**: Gold shop business practices adapted for Persian/Middle Eastern market
- **Typography**: Professional Persian font selection with appropriate line heights and spacing
- **Gold Business Context**: UI terminology and workflows adapted for traditional gold shop operations

## Common Development Tasks

### Adding New API Endpoints
1. Define Pydantic schemas in `schemas.py` with proper validation
2. Create router in `routers/[domain].py` with error handling
3. Include router in `main.py` with appropriate prefix and tags
4. Add comprehensive integration tests in `tests/test_[domain].py` using real PostgreSQL
5. Test with real database: `docker-compose exec backend python -m pytest tests/test_[domain].py -v`
6. **CRITICAL**: All tests must use real database operations, no mocking allowed

### Adding New Frontend Features
1. Create components in appropriate `components/[domain]/` directory using ShadCN UI
2. Add TypeScript types in `types/` directory with proper interface definitions
3. Create API service functions in `services/` with error handling
4. Implement responsive design with mobile-first approach
5. Add integration tests that hit real backend APIs running in Docker
6. Test with: `docker-compose exec frontend npm test -- --testPathPattern=[component] --watchAll=false`
7. **CRITICAL**: All frontend tests must interact with real backend services

### Advanced Category Management
1. Use `CategoryTemplate` model for reusable category structures
2. Implement drag-and-drop functionality for category reordering
3. Support unlimited nesting levels with proper tree traversal
4. Add custom attributes per category with validation rules
5. Test hierarchy operations with real database transactions

### Database Changes
1. Modify models in `models.py` with proper relationships and constraints
2. Generate migration: `docker-compose exec backend python -m alembic revision --autogenerate -m "description"`
3. Apply migration: `docker-compose exec backend python -m alembic upgrade head`
4. Update seed data if necessary: `docker-compose exec backend python seed_data.py`
5. Test migration with real PostgreSQL to ensure data integrity

### UI/UX Development
1. Follow gold-themed design system with professional color palette
2. Use ShadCN UI components as foundation with custom theming
3. Implement smooth animations using Framer Motion
4. Ensure WCAG 2.1 AA accessibility compliance
5. Test responsive design on multiple screen sizes
6. Implement proper loading states and error handling

### Troubleshooting
- **Database connection issues**: Check container health with `docker-compose ps`
- **Frontend API errors**: Verify backend is running and accessible at http://localhost:8000
- **Test failures**: Ensure all services are up before running tests; check for real database connectivity
- **Volume permission issues**: On Windows, ensure Docker has access to project directories
- **UI rendering issues**: Check ShadCN component imports and Tailwind CSS compilation
- **RTL layout problems**: Verify Tailwind RTL plugin configuration and dir attribute usage
- **Category hierarchy issues**: Check parent-child relationships and tree traversal logic
- **Performance issues**: Monitor large dataset rendering; implement virtual scrolling if needed
