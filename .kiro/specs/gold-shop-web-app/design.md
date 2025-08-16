# Design Document

## Overview

The طلافروشی (Gold Shop) web application is a comprehensive business management system designed for gold jewelry retailers. The system follows a modern microservices-inspired architecture with a React TypeScript frontend and FastAPI backend, all containerized using Docker. The application emphasizes real-time data synchronization between modules, professional UI/UX with RTL support, and production-ready testing with real PostgreSQL databases.

**🐳 DOCKER ENVIRONMENT DESIGN:** All components are designed to run within Docker containers. The architecture assumes Docker networking, volume persistence, and container-based service discovery.

## Architecture

### System Architecture

```mermaid
graph TB
    subgraph "Docker Environment"
        subgraph "Frontend Container"
            React[React + TypeScript]
            ShadcnUI[shadcn/ui Components]
            Tailwind[Tailwind CSS + RTL]
        end
        
        subgraph "Backend Container"
            FastAPI[FastAPI Server]
            JWT[JWT Authentication]
            BusinessLogic[Business Logic Layer]
        end
        
        subgraph "Database Container"
            PostgreSQL[(PostgreSQL Database)]
        end
        
        subgraph "External Services"
            SMS[SMS Gateway API]
            GoldPrice[Gold Price API]
        end
    end
    
    React --> FastAPI
    FastAPI --> PostgreSQL
    FastAPI --> SMS
    FastAPI --> GoldPrice
```

### Technology Stack

**Frontend:**
- React 18+ with TypeScript
- shadcn/ui component library
- Tailwind CSS with RTL plugin
- React Router for navigation
- React Query for API state management
- Chart.js for data visualization
- jsPDF for PDF generation

**Backend:**
- FastAPI with Python 3.11+
- SQLAlchemy ORM with PostgreSQL
- Pydantic for data validation
- JWT for authentication
- Alembic for database migrations
- Pytest for testing

**Infrastructure:**
- Docker & Docker Compose
- PostgreSQL 15+
- Nginx (optional reverse proxy)

## Components and Interfaces

### Frontend Components Architecture

```mermaid
graph TD
    App[App Component]
    
    subgraph "Authentication"
        Login[Login Component]
        AuthGuard[Auth Guard HOC]
    end
    
    subgraph "Layout"
        Sidebar[Sidebar Navigation]
        Header[Header Component]
        MainLayout[Main Layout]
    end
    
    subgraph "Dashboard"
        DashboardCards[Summary Cards]
        DashboardCharts[Interactive Charts]
        AlertsPanel[Alerts Panel]
    end
    
    subgraph "Inventory"
        InventoryList[Inventory List]
        InventoryForm[Add/Edit Form]
        CategoryManager[Category Manager]
        StockAlerts[Stock Alerts]
    end
    
    subgraph "Customers"
        CustomerList[Customer List]
        CustomerProfile[Customer Profile]
        PaymentHistory[Payment History]
        DebtTracker[Debt Tracker]
    end
    
    subgraph "Invoices"
        InvoiceList[Invoice List]
        InvoiceForm[Invoice Creator]
        InvoicePreview[Invoice Preview]
        PDFExporter[PDF Exporter]
    end
    
    subgraph "Accounting"
        IncomeLedger[Income Ledger]
        ExpenseLedger[Expense Ledger]
        CashBankLedger[Cash & Bank Ledger]
        GoldWeightLedger[Gold Weight Ledger]
        ProfitAnalysis[Profit Analysis]
        DebtTracking[Debt Tracking]
    end
    
    subgraph "Reports"
        SalesCharts[Sales Charts]
        InventoryCharts[Inventory Charts]
        CustomerCharts[Customer Charts]
        ReportFilters[Report Filters]
    end
    
    subgraph "Settings"
        CompanySettings[Company Settings]
        GoldPriceConfig[Gold Price Config]
        InvoiceDesigner[Invoice Designer]
        RoleManager[Role Manager]
        UserManager[User Manager]
    end
    
    App --> AuthGuard
    AuthGuard --> MainLayout
    MainLayout --> Sidebar
    MainLayout --> Header
```

### Backend API Architecture

```mermaid
graph TD
    subgraph "API Layer"
        AuthAPI[Authentication API]
        InventoryAPI[Inventory API]
        CustomerAPI[Customer API]
        InvoiceAPI[Invoice API]
        AccountingAPI[Accounting API]
        ReportsAPI[Reports API]
        SettingsAPI[Settings API]
        SMSAPI[SMS API]
    end
    
    subgraph "Business Logic Layer"
        AuthService[Auth Service]
        InventoryService[Inventory Service]
        CustomerService[Customer Service]
        InvoiceService[Invoice Service]
        AccountingService[Accounting Service]
        ReportsService[Reports Service]
        SettingsService[Settings Service]
        SMSService[SMS Service]
        GoldPriceService[Gold Price Service]
    end
    
    subgraph "Data Access Layer"
        UserRepo[User Repository]
        InventoryRepo[Inventory Repository]
        CustomerRepo[Customer Repository]
        InvoiceRepo[Invoice Repository]
        AccountingRepo[Accounting Repository]
        SettingsRepo[Settings Repository]
    end
    
    subgraph "Database Layer"
        PostgreSQL[(PostgreSQL)]
    end
    
    AuthAPI --> AuthService
    InventoryAPI --> InventoryService
    CustomerAPI --> CustomerService
    InvoiceAPI --> InvoiceService
    AccountingAPI --> AccountingService
    ReportsAPI --> ReportsService
    SettingsAPI --> SettingsService
    SMSAPI --> SMSService
    
    AuthService --> UserRepo
    InventoryService --> InventoryRepo
    CustomerService --> CustomerRepo
    InvoiceService --> InvoiceRepo
    AccountingService --> AccountingRepo
    SettingsService --> SettingsRepo
    
    UserRepo --> PostgreSQL
    InventoryRepo --> PostgreSQL
    CustomerRepo --> PostgreSQL
    InvoiceRepo --> PostgreSQL
    AccountingRepo --> PostgreSQL
    SettingsRepo --> PostgreSQL
```

## Data Models

### Core Database Schema

```sql
-- Users and Authentication
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id UUID REFERENCES roles(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory Management
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    parent_id UUID REFERENCES categories(id),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    category_id UUID REFERENCES categories(id),
    weight_grams DECIMAL(10,3) NOT NULL,
    purchase_price DECIMAL(12,2) NOT NULL,
    sell_price DECIMAL(12,2) NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    min_stock_level INTEGER DEFAULT 5,
    description TEXT,
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customer Management
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    total_purchases DECIMAL(12,2) DEFAULT 0,
    current_debt DECIMAL(12,2) DEFAULT 0,
    last_purchase_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoice Management
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id),
    total_amount DECIMAL(12,2) NOT NULL,
    paid_amount DECIMAL(12,2) DEFAULT 0,
    remaining_amount DECIMAL(12,2) NOT NULL,
    gold_price_per_gram DECIMAL(10,2) NOT NULL,
    labor_cost_percentage DECIMAL(5,2) DEFAULT 0,
    profit_percentage DECIMAL(5,2) DEFAULT 0,
    vat_percentage DECIMAL(5,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES invoices(id),
    inventory_item_id UUID REFERENCES inventory_items(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    weight_grams DECIMAL(10,3) NOT NULL
);

-- Accounting System
CREATE TABLE accounting_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_type VARCHAR(20) NOT NULL, -- 'income', 'expense', 'cash', 'bank', 'gold_weight'
    category VARCHAR(50) NOT NULL,
    amount DECIMAL(12,2),
    weight_grams DECIMAL(10,3),
    description TEXT NOT NULL,
    reference_id UUID, -- Links to invoice, customer, etc.
    reference_type VARCHAR(50),
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Settings and Configuration
CREATE TABLE company_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(200),
    company_logo_url VARCHAR(500),
    company_address TEXT,
    default_gold_price DECIMAL(10,2),
    default_labor_percentage DECIMAL(5,2),
    default_profit_percentage DECIMAL(5,2),
    default_vat_percentage DECIMAL(5,2),
    invoice_template JSONB,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Pydantic Models (Backend)

```python
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from uuid import UUID

class UserBase(BaseModel):
    username: str
    email: EmailStr
    role_id: UUID

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: UUID
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class InventoryItemBase(BaseModel):
    name: str
    category_id: UUID
    weight_grams: Decimal
    purchase_price: Decimal
    sell_price: Decimal
    stock_quantity: int
    min_stock_level: int = 5
    description: Optional[str] = None
    image_url: Optional[str] = None

class InventoryItemCreate(InventoryItemBase):
    pass

class InventoryItem(InventoryItemBase):
    id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class InvoiceItemBase(BaseModel):
    inventory_item_id: UUID
    quantity: int
    unit_price: Decimal
    weight_grams: Decimal

class InvoiceBase(BaseModel):
    customer_id: UUID
    gold_price_per_gram: Decimal
    labor_cost_percentage: Decimal = 0
    profit_percentage: Decimal = 0
    vat_percentage: Decimal = 0
    items: List[InvoiceItemBase]

class InvoiceCreate(InvoiceBase):
    pass

class Invoice(InvoiceBase):
    id: UUID
    invoice_number: str
    total_amount: Decimal
    paid_amount: Decimal
    remaining_amount: Decimal
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True
```

## Error Handling

### Frontend Error Handling Strategy

1. **API Error Interceptor**: Global axios interceptor to handle common HTTP errors
2. **Error Boundary Components**: React error boundaries for component-level error handling
3. **Toast Notifications**: User-friendly error messages using shadcn/ui toast components
4. **Form Validation**: Real-time form validation with clear error messages
5. **Loading States**: Proper loading indicators during API calls

### Backend Error Handling Strategy

1. **Custom Exception Classes**: Specific exceptions for business logic errors
2. **Global Exception Handler**: FastAPI exception handler for consistent error responses
3. **Validation Errors**: Pydantic validation with detailed error messages
4. **Database Error Handling**: SQLAlchemy error handling with rollback mechanisms
5. **Logging**: Comprehensive logging for debugging and monitoring

```python
from fastapi import HTTPException, status
from typing import Any, Dict

class GoldShopException(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code

class InsufficientStockException(GoldShopException):
    def __init__(self, item_name: str, available: int, requested: int):
        message = f"Insufficient stock for {item_name}. Available: {available}, Requested: {requested}"
        super().__init__(message, status.HTTP_400_BAD_REQUEST)

class CustomerDebtLimitException(GoldShopException):
    def __init__(self, customer_name: str, current_debt: float, limit: float):
        message = f"Customer {customer_name} debt limit exceeded. Current: {current_debt}, Limit: {limit}"
        super().__init__(message, status.HTTP_400_BAD_REQUEST)

@app.exception_handler(GoldShopException)
async def gold_shop_exception_handler(request, exc: GoldShopException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.message, "type": "business_error"}
    )
```

## Testing Strategy

### Backend Testing (Docker + Real PostgreSQL)

**🐳 CRITICAL: All backend tests run in Docker with real PostgreSQL database**

1. **Unit Tests**: Test individual functions and methods with real database connections
2. **Integration Tests**: Test API endpoints with actual database operations
3. **Database Tests**: Test repository layer with real PostgreSQL transactions
4. **Business Logic Tests**: Test complex business rules with real data scenarios

```python
# pytest configuration for Docker testing
import pytest
import asyncio
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from testcontainers.postgres import PostgresContainer
from app.database import get_db
from app.main import app

@pytest.fixture(scope="session")
def postgres_container():
    with PostgresContainer("postgres:15") as postgres:
        yield postgres

@pytest.fixture(scope="session")
def test_db_engine(postgres_container):
    engine = create_engine(postgres_container.get_connection_url())
    return engine

@pytest.fixture
def test_db_session(test_db_engine):
    TestingSessionLocal = sessionmaker(bind=test_db_engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()

@pytest.fixture
def override_get_db(test_db_session):
    def _override_get_db():
        try:
            yield test_db_session
        finally:
            test_db_session.close()
    
    app.dependency_overrides[get_db] = _override_get_db
    yield
    app.dependency_overrides.clear()
```

### Frontend Testing (Docker Environment)

1. **Component Tests**: Test React components with real API interactions
2. **Integration Tests**: Test complete user workflows
3. **E2E Tests**: Test full application flow in Docker environment
4. **RTL Testing**: Specific tests for Persian/RTL functionality

```typescript
// Jest configuration for Docker testing
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { InventoryList } from '../components/InventoryList';

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('InventoryList Component', () => {
  test('displays inventory items from real API', async () => {
    render(
      <TestWrapper>
        <InventoryList />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Gold Ring')).toBeInTheDocument();
    });
  });
});
```

### Docker Testing Environment

```yaml
# docker-compose.test.yml
version: '3.8'
services:
  test-db:
    image: postgres:15
    environment:
      POSTGRES_DB: goldshop_test
      POSTGRES_USER: test_user
      POSTGRES_PASSWORD: test_password
    ports:
      - "5433:5432"
    volumes:
      - test_db_data:/var/lib/postgresql/data

  test-backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://test_user:test_password@test-db:5432/goldshop_test
      JWT_SECRET: test_secret
    depends_on:
      - test-db
    command: pytest -v

  test-frontend:
    build: ./frontend
    environment:
      REACT_APP_API_URL: http://test-backend:8000
    depends_on:
      - test-backend
    command: npm test

volumes:
  test_db_data:
```

## Security Considerations

### JWT Authentication Flow

1. **Login Process**: User credentials validated against database
2. **Token Generation**: JWT token with user ID, role, and permissions
3. **Token Validation**: Middleware validates token on protected routes
4. **Role-Based Access**: Frontend components show/hide based on permissions
5. **Token Refresh**: Automatic token refresh before expiration

### Data Security

1. **Password Hashing**: bcrypt for password storage
2. **SQL Injection Prevention**: SQLAlchemy ORM with parameterized queries
3. **Input Validation**: Pydantic models for all API inputs
4. **CORS Configuration**: Proper CORS settings for frontend-backend communication
5. **Environment Variables**: Sensitive data in environment variables

### API Security

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=["HS256"])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def require_permission(permission: str):
    def permission_checker(current_user = Depends(get_current_user)):
        # Check user permissions from database
        if not user_has_permission(current_user, permission):
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return current_user
    return permission_checker
```

## Performance Optimization

### Frontend Performance

1. **Code Splitting**: React lazy loading for route-based code splitting
2. **Memoization**: React.memo and useMemo for expensive calculations
3. **Virtual Scrolling**: For large inventory and customer lists
4. **Image Optimization**: Lazy loading and compression for product images
5. **Caching**: React Query for API response caching

### Backend Performance

1. **Database Indexing**: Strategic indexes on frequently queried columns
2. **Connection Pooling**: SQLAlchemy connection pool configuration
3. **Query Optimization**: Efficient queries with proper joins and filtering
4. **Caching**: Redis for frequently accessed data (optional)
5. **Async Operations**: FastAPI async endpoints for I/O operations

### Database Optimization

```sql
-- Strategic indexes for performance
CREATE INDEX idx_inventory_items_category ON inventory_items(category_id);
CREATE INDEX idx_inventory_items_active ON inventory_items(is_active);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_date ON invoices(created_at);
CREATE INDEX idx_accounting_entries_type_date ON accounting_entries(entry_type, transaction_date);
CREATE INDEX idx_customers_debt ON customers(current_debt) WHERE current_debt > 0;
```

## Deployment Architecture

### Docker Compose Production Setup

```yaml
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://backend:8000
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://goldshop_user:${DB_PASSWORD}@db:5432/goldshop
      - JWT_SECRET=${JWT_SECRET}
      - SMS_API_KEY=${SMS_API_KEY}
    depends_on:
      - db
    volumes:
      - ./uploads:/app/uploads

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=goldshop
      - POSTGRES_USER=goldshop_user
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

This design provides a comprehensive foundation for building a production-ready gold shop management system with emphasis on Docker containerization, real database testing, and professional UI/UX standards.