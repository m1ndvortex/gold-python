# Design Document

## Overview

This design document outlines the comprehensive transformation of the existing gold shop management system into a Universal Business Management Platform. The design maintains full backward compatibility with existing gold shop functionality while adding enterprise-grade features that make the system suitable for any type of business.

The platform architecture follows a modular, microservices-inspired approach within a monolithic structure, enabling easy feature addition and business type customization while maintaining system coherence and performance.

## Architecture

### System Architecture Overview

```
Universal Business Platform
├── Authentication & Security Layer (OAuth2)
│   ├── OAuth2 Provider Integration (Auth0/Keycloak)
│   ├── JWT Token Management (Access + Refresh)
│   ├── Role-Based Access Control (RBAC)
│   └── Audit Logging System
├── Business Configuration Layer
│   ├── Business Type Detection & Configuration
│   ├── Industry-Specific Workflows
│   ├── Custom Field Management
│   └── Localization & Multi-Language Support
├── Core Business Modules
│   ├── Universal Inventory Management
│   ├── Enhanced Invoice System
│   ├── Customer Relationship Management
│   ├── Double-Entry Accounting System
│   └── Analytics & Business Intelligence
├── Legacy Compatibility Layer
│   ├── Gold Shop Feature Preservation
│   ├── Data Migration Services
│   └── Backward Compatibility APIs
├── Infrastructure & DevOps
│   ├── Docker Containerization
│   ├── Nginx Reverse Proxy
│   ├── Redis Caching Layer
│   └── Comprehensive Testing Framework
└── Integration & API Layer
    ├── REST API Gateway
    ├── Webhook System
    ├── Third-Party Integrations
    └── Mobile & Cross-Platform Support
```

### Technology Stack Evolution

**Frontend Enhancement:**
- React 18+ with TypeScript
- Enhanced shadcn/ui component library
- Tailwind CSS with business-specific themes
- Progressive Web App (PWA) capabilities
- Multi-language support with react-i18next

**Backend Enhancement:**
- FastAPI with async/await patterns
- OAuth2 integration (Auth0/Keycloak)
- Enhanced PostgreSQL schema with business flexibility
- Redis for caching and session management
- Celery for background task processing

**Infrastructure Enhancement:**
- Docker Compose with multi-environment support
- Nginx with SSL termination and load balancing
- Automated backup and disaster recovery
- Comprehensive monitoring and logging

## Components and Interfaces

### 1. OAuth2 Authentication System

**Architecture:**
```typescript
interface OAuth2Config {
  provider: 'auth0' | 'keycloak' | 'custom';
  clientId: string;
  clientSecret: string;
  domain: string;
  audience: string;
  scopes: string[];
}

interface TokenManagement {
  accessToken: {
    duration: number; // 5-15 minutes
    claims: UserClaims;
    permissions: Permission[];
  };
  refreshToken: {
    duration: number; // 30 days
    rotationEnabled: boolean;
  };
  revocation: {
    endpoint: string;
    auditLog: boolean;
  };
}
```

**Implementation Strategy:**
- Integrate with Auth0 for cloud-based OAuth2 or Keycloak for self-hosted
- Implement JWT token validation middleware
- Create token refresh mechanism with automatic rotation
- Build comprehensive audit logging for all token events

### 2. Universal Inventory Management System

**Enhanced Data Model:**
```typescript
interface UniversalInventoryItem {
  id: string;
  sku: string;
  barcode?: string;
  qrCode?: string;
  
  // Basic Information
  name: string;
  description: string;
  category: CategoryHierarchy;
  
  // Universal Attributes
  attributes: CustomAttribute[];
  tags: string[];
  
  // Pricing & Cost
  costPrice: number;
  salePrice: number;
  currency: string;
  
  // Inventory Tracking
  stock: StockInformation;
  unitOfMeasure: UnitOfMeasure;
  
  // Business Type Specific
  businessTypeFields: Record<string, any>;
  
  // Gold Shop Compatibility
  goldSpecific?: GoldItemDetails;
}

interface CategoryHierarchy {
  id: string;
  name: string;
  parent?: CategoryHierarchy;
  children: CategoryHierarchy[];
  level: number;
  attributeSchema: AttributeSchema[];
}

interface CustomAttribute {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'enum' | 'boolean';
  value: any;
  required: boolean;
  searchable: boolean;
}
```

**Key Features:**
- Unlimited nested category hierarchy
- Schema-driven custom attributes per category
- Multi-unit inventory tracking
- Advanced search and filtering capabilities
- Barcode/QR code integration
- Real-time stock level monitoring

### 3. Enhanced Invoice System

**Flexible Invoice Architecture:**
```typescript
interface UniversalInvoice {
  id: string;
  invoiceNumber: string;
  type: InvoiceType;
  status: InvoiceStatus;
  
  // Customer Information
  customer: Customer;
  
  // Items and Pricing
  items: InvoiceItem[];
  subtotal: number;
  taxes: TaxCalculation[];
  discounts: Discount[];
  total: number;
  
  // Payment Information
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod[];
  
  // Workflow Management
  workflow: InvoiceWorkflow;
  
  // Business Type Specific
  businessTypeFields: Record<string, any>;
  
  // Gold Shop Compatibility
  goldSpecific?: GoldInvoiceDetails;
}

interface InvoiceWorkflow {
  currentStage: 'draft' | 'pending_approval' | 'approved' | 'paid' | 'cancelled';
  approvalRequired: boolean;
  approver?: User;
  approvalDate?: Date;
  stockAffected: boolean;
}

interface GoldInvoiceDetails {
  sood: number; // سود
  ojrat: number; // اجرت
  goldPrice: number;
  weight: number;
  purity: number;
}
```

**Workflow Engine:**
- Draft → Approval → Stock Impact workflow
- Configurable approval rules per business type
- Automatic inventory deduction on approval
- Comprehensive audit trail for all changes

### 4. Double-Entry Accounting System

**Comprehensive Accounting Architecture:**
```typescript
interface AccountingSystem {
  chartOfAccounts: ChartOfAccounts;
  journalEntries: JournalEntry[];
  ledgers: {
    general: GeneralLedger;
    subsidiary: SubsidiaryLedger[];
    cash: CashLedger;
    bank: BankLedger;
  };
  reconciliation: ReconciliationSystem;
  reporting: FinancialReporting;
}

interface JournalEntry {
  id: string;
  date: Date;
  reference: string;
  description: string;
  debits: AccountEntry[];
  credits: AccountEntry[];
  totalDebit: number;
  totalCredit: number;
  balanced: boolean;
  source: 'invoice' | 'payment' | 'adjustment' | 'manual';
  auditTrail: AuditEntry[];
}

interface ReconciliationSystem {
  bankReconciliation: BankReconciliation[];
  invoiceMatching: InvoiceMatching[];
  paymentMatching: PaymentMatching[];
  automaticMatching: boolean;
}
```

**Key Features:**
- Complete double-entry bookkeeping
- Automated journal entry generation
- Multi-currency support
- Bank reconciliation automation
- Period closing and locking
- Comprehensive audit trails

### 5. Business Type Configuration System

**Adaptive Business Configuration:**
```typescript
interface BusinessTypeConfig {
  type: BusinessType;
  name: string;
  industry: string;
  
  // UI Customization
  terminology: TerminologyMapping;
  workflows: WorkflowConfiguration;
  features: FeatureConfiguration;
  
  // Data Schema
  customFields: CustomFieldSchema[];
  requiredFields: string[];
  
  // Reporting
  defaultReports: ReportTemplate[];
  kpis: KPIDefinition[];
}

enum BusinessType {
  GOLD_SHOP = 'gold_shop',
  RETAIL_STORE = 'retail_store',
  RESTAURANT = 'restaurant',
  SERVICE_BUSINESS = 'service_business',
  MANUFACTURING = 'manufacturing',
  WHOLESALE = 'wholesale',
  PHARMACY = 'pharmacy',
  AUTOMOTIVE = 'automotive',
  CUSTOM = 'custom'
}

interface TerminologyMapping {
  inventory: string; // "Products", "Menu Items", "Services", etc.
  customer: string; // "Customer", "Client", "Patient", etc.
  invoice: string; // "Invoice", "Receipt", "Bill", etc.
  // ... other terminology mappings
}
```

## Data Models

### Enhanced Database Schema

**Core Tables Enhancement:**
```sql
-- Business Configuration
CREATE TABLE business_configurations (
    id UUID PRIMARY KEY,
    business_type VARCHAR(50) NOT NULL,
    configuration JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Enhanced Inventory with Universal Support
CREATE TABLE inventory_items (
    id UUID PRIMARY KEY,
    sku VARCHAR(100) UNIQUE NOT NULL,
    barcode VARCHAR(100),
    qr_code VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES categories(id),
    cost_price DECIMAL(15,2),
    sale_price DECIMAL(15,2),
    currency VARCHAR(3) DEFAULT 'USD',
    stock_quantity DECIMAL(15,3),
    unit_of_measure VARCHAR(50),
    attributes JSONB,
    tags TEXT[],
    business_type_fields JSONB,
    gold_specific JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Hierarchical Categories
CREATE TABLE categories (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    parent_id UUID REFERENCES categories(id),
    level INTEGER NOT NULL DEFAULT 0,
    path LTREE,
    attribute_schema JSONB,
    business_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Enhanced Invoices
CREATE TABLE invoices (
    id UUID PRIMARY KEY,
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    customer_id UUID REFERENCES customers(id),
    subtotal DECIMAL(15,2),
    tax_amount DECIMAL(15,2),
    discount_amount DECIMAL(15,2),
    total DECIMAL(15,2),
    currency VARCHAR(3) DEFAULT 'USD',
    workflow_stage VARCHAR(50) DEFAULT 'draft',
    approval_required BOOLEAN DEFAULT FALSE,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    business_type_fields JSONB,
    gold_specific JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Double-Entry Accounting
CREATE TABLE journal_entries (
    id UUID PRIMARY KEY,
    entry_date DATE NOT NULL,
    reference VARCHAR(100),
    description TEXT,
    total_debit DECIMAL(15,2),
    total_credit DECIMAL(15,2),
    balanced BOOLEAN DEFAULT FALSE,
    source VARCHAR(50),
    source_id UUID,
    period_id UUID REFERENCES accounting_periods(id),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE journal_entry_lines (
    id UUID PRIMARY KEY,
    journal_entry_id UUID REFERENCES journal_entries(id),
    account_id UUID REFERENCES chart_of_accounts(id),
    debit_amount DECIMAL(15,2) DEFAULT 0,
    credit_amount DECIMAL(15,2) DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- OAuth2 Token Management
CREATE TABLE oauth_tokens (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    access_token_hash VARCHAR(255),
    refresh_token_hash VARCHAR(255),
    expires_at TIMESTAMP,
    refresh_expires_at TIMESTAMP,
    scopes TEXT[],
    revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Audit Logging
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## Error Handling

### Comprehensive Error Management

**Error Categories:**
1. **Authentication Errors**: OAuth2 token validation, refresh failures
2. **Authorization Errors**: Permission denied, role-based access violations
3. **Business Logic Errors**: Inventory insufficient, invoice workflow violations
4. **Data Validation Errors**: Schema validation, business rule violations
5. **Integration Errors**: Third-party service failures, API timeouts
6. **System Errors**: Database connectivity, cache failures

**Error Response Structure:**
```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    requestId: string;
    businessContext?: {
      businessType: string;
      affectedResources: string[];
    };
  };
}
```

### Migration and Compatibility Handling

**Data Migration Strategy:**
1. **Schema Evolution**: Gradual schema updates with backward compatibility
2. **Data Transformation**: Automated conversion of gold-specific data to universal format
3. **Feature Flagging**: Gradual rollout of new features with fallback mechanisms
4. **Validation**: Comprehensive data integrity checks during migration

## Testing Strategy

### Comprehensive Testing Framework

**Testing Pyramid:**
```
E2E Tests (10%)
├── Business Workflow Tests
├── Cross-Module Integration Tests
└── User Journey Tests

Integration Tests (30%)
├── API Integration Tests
├── Database Integration Tests
├── OAuth2 Flow Tests
└── Business Logic Integration Tests

Unit Tests (60%)
├── Service Layer Tests
├── Repository Layer Tests
├── Utility Function Tests
└── Component Tests
```

**Testing Infrastructure:**
- **Docker-based Testing**: All tests run in containerized environment
- **Real Database Testing**: No mocking of database operations
- **Load Testing**: Simulate 100+ concurrent users
- **Security Testing**: OAuth2 flow validation, permission testing
- **Regression Testing**: Automated testing of existing gold shop functionality

**Test Coverage Requirements:**
- Minimum 80% code coverage
- 100% coverage for critical business logic
- Comprehensive API endpoint testing
- Cross-browser compatibility testing

### Performance Testing Strategy

**Load Testing Scenarios:**
1. **Concurrent Invoice Creation**: 100+ users creating invoices simultaneously
2. **Inventory Updates**: High-frequency stock level updates
3. **Report Generation**: Complex analytical queries under load
4. **Authentication Load**: OAuth2 token validation under stress
5. **Database Performance**: Complex queries with large datasets

## Implementation Phases

### Phase 1: OAuth2 Security Foundation (Weeks 1-2)
- Implement OAuth2 provider integration
- Create JWT token management system
- Build audit logging infrastructure
- Establish security middleware

### Phase 2: Universal Inventory System (Weeks 3-4)
- Extend inventory schema for universal support
- Implement custom attributes system
- Build category hierarchy management
- Create advanced search and filtering

### Phase 3: Enhanced Invoice System (Weeks 5-6)
- Implement flexible invoice workflows
- Build approval system
- Create business type specific fields
- Maintain gold shop compatibility

### Phase 4: Double-Entry Accounting (Weeks 7-8)
- Implement complete accounting system
- Build reconciliation features
- Create financial reporting
- Establish audit trails

### Phase 5: Business Type Configuration (Weeks 9-10)
- Build business type detection system
- Implement adaptive UI/terminology
- Create workflow customization
- Build industry-specific features

### Phase 6: Testing and Infrastructure (Weeks 11-12)
- Implement comprehensive testing suite
- Set up Nginx and infrastructure
- Build monitoring and logging
- Create deployment automation

### Phase 7: Migration and Compatibility (Weeks 13-14)
- Build data migration tools
- Implement backward compatibility
- Create user training materials
- Conduct user acceptance testing

## Security Considerations

### OAuth2 Security Implementation

**Token Security:**
- Short-lived access tokens (5-15 minutes)
- Secure refresh token rotation
- Comprehensive token revocation
- Audit logging for all token events

**API Security:**
- Rate limiting per user and endpoint
- Request/response validation
- CORS configuration
- Security headers implementation

**Data Protection:**
- Encryption at rest and in transit
- PII data anonymization
- Secure backup procedures
- GDPR compliance features

### Infrastructure Security

**Network Security:**
- Nginx reverse proxy with SSL termination
- Firewall configuration
- VPN access for administration
- DDoS protection

**Container Security:**
- Minimal base images
- Regular security updates
- Non-root container execution
- Secret management

## Monitoring and Observability

### Comprehensive Monitoring Strategy

**Application Monitoring:**
- Performance metrics collection
- Error rate monitoring
- User activity tracking
- Business KPI monitoring

**Infrastructure Monitoring:**
- Container health monitoring
- Database performance tracking
- Cache hit rate monitoring
- Network latency tracking

**Security Monitoring:**
- Authentication failure tracking
- Suspicious activity detection
- Access pattern analysis
- Audit log monitoring

This design provides a comprehensive foundation for transforming the gold shop system into a universal business platform while maintaining all existing functionality and ensuring enterprise-grade security, performance, and scalability.