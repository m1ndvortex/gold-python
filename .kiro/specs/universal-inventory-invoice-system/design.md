# Design Document

## Overview

This design document outlines the comprehensive transformation of the existing gold shop management system into a Universal Inventory and Invoice Management System. The design maintains full backward compatibility with existing gold shop functionality while adding enterprise-grade features that make the system suitable for any type of business.

The platform architecture follows a modular approach with clear separation between universal business logic and business-type specific customizations, enabling easy feature addition and business type adaptation while maintaining system performance and data integrity.

## Architecture

### System Architecture Overview

```
Universal Inventory & Invoice Management System
├── Frontend Layer (React + TypeScript)
│   ├── Universal Inventory Management Interface
│   ├── Dual Invoice System Interface (Gold/General)
│   ├── Beautiful QR Invoice Cards Interface
│   ├── Enhanced Accounting Interface
│   ├── Image Management Interface
│   └── Responsive Navigation System
├── Backend Layer (FastAPI + Python)
│   ├── Universal Inventory Service
│   ├── Dual Invoice Processing Engine
│   ├── QR Card Generation Service
│   ├── Double-Entry Accounting Engine
│   ├── Image Management Service
│   └── Business Type Configuration Service
├── Database Layer (PostgreSQL)
│   ├── Universal Inventory Schema
│   ├── Hierarchical Categories (LTREE)
│   ├── Dual Invoice Tables
│   ├── Double-Entry Accounting Tables
│   ├── Image Storage References
│   └── Audit Trail Tables
├── Infrastructure Layer (Docker + Nginx)
│   ├── Nginx Reverse Proxy with SSL
│   ├── Redis Caching Layer
│   ├── Image Storage Service
│   ├── Backup & Recovery System
│   └── Monitoring & Logging
└── Integration Layer
    ├── QR Code Generation Service
    ├── Image Processing Pipeline
    ├── PDF Generation Service
    └── Testing Framework
```

### Technology Stack

**Frontend Enhancement:**
- React 18+ with TypeScript for type safety
- Enhanced UI component library with business-specific themes
- Tailwind CSS for responsive design
- React Query for efficient data fetching
- React Hook Form for complex form management
- QR code generation libraries
- Image upload and preview components

**Backend Enhancement:**
- FastAPI with async/await for high performance
- SQLAlchemy with PostgreSQL for robust data management
- LTREE extension for hierarchical categories
- Pillow for image processing
- QR code generation libraries
- PDF generation for invoices
- Comprehensive validation with Pydantic

**Database Design:**
- PostgreSQL with LTREE for unlimited category nesting
- JSONB for flexible custom attributes
- Proper indexing for performance
- Foreign key constraints for data integrity
- Audit trail tables for all changes

**Infrastructure:**
- Docker Compose for multi-service orchestration
- Nginx with SSL termination and security headers
- Redis for caching and session management
- Automated backup procedures
- Comprehensive logging and monitoring## Co
mponents and Interfaces

### 1. Universal Inventory Management System

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
  customAttributes: CustomAttribute[];
  tags: string[];
  
  // Pricing & Cost
  costPrice: number;
  salePrice: number;
  currency: string;
  
  // Inventory Tracking
  stockQuantity: number;
  unitOfMeasure: string;
  lowStockThreshold: number;
  
  // Image Management
  images: ItemImage[];
  primaryImageId?: string;
  
  // Business Type Specific
  businessTypeFields: Record<string, any>;
  
  // Gold Shop Compatibility
  goldSpecific?: GoldItemDetails;
  
  // Audit Trail
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

interface CategoryHierarchy {
  id: string;
  name: string;
  parent?: CategoryHierarchy;
  children: CategoryHierarchy[];
  level: number;
  path: string; // LTREE path
  attributeSchema: AttributeSchema[];
  image?: CategoryImage;
  businessType?: string;
}

interface CustomAttribute {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'enum' | 'boolean';
  value: any;
  required: boolean;
  searchable: boolean;
  displayOrder: number;
}

interface ItemImage {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl: string;
  uploadedAt: Date;
}
```

**Key Features:**
- Unlimited nested category hierarchy using PostgreSQL LTREE
- Schema-driven custom attributes with validation
- Advanced search and filtering capabilities
- Comprehensive image management with thumbnails
- Real-time stock level monitoring
- Barcode/QR code integration

### 2. Dual Invoice System (Gold vs General)

**Flexible Invoice Architecture:**
```typescript
interface UniversalInvoice {
  id: string;
  invoiceNumber: string;
  type: 'gold' | 'general';
  status: InvoiceStatus;
  
  // Customer Information
  customer: Customer;
  
  // Items and Pricing
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  currency: string;
  
  // Workflow Management
  workflow: InvoiceWorkflow;
  
  // Gold-Specific Fields (conditional)
  goldSpecific?: {
    sood: number; // سود (profit)
    ojrat: number; // اجرت (wage/labor fee)
    maliyat: number; // مالیات (tax)
    goldPrice: number;
    totalWeight: number;
  };
  
  // QR Card Information
  qrCode: string;
  cardUrl: string;
  
  // Images from items
  itemImages: ItemImage[];
  
  // Audit Trail
  createdAt: Date;
  updatedAt: Date;
  approvedAt?: Date;
  approvedBy?: string;
}

interface InvoiceWorkflow {
  currentStage: 'draft' | 'approved' | 'paid' | 'cancelled';
  stockAffected: boolean;
  requiresApproval: boolean;
  approvalNotes?: string;
}

interface InvoiceItem {
  id: string;
  inventoryItemId: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  images: ItemImage[];
  
  // Gold-specific item fields
  goldSpecific?: {
    weight: number;
    purity: number;
    laborCost: number;
    profitMargin: number;
  };
}
```

**Workflow Engine:**
- Invoice type selection at creation (Gold/General)
- Conditional field display based on invoice type
- Draft → Approved workflow with inventory impact
- Automatic stock deduction on approval
- Manual price override capability
- Comprehensive audit trail### 3
. Beautiful QR Invoice Cards System

**QR Card Architecture:**
```typescript
interface InvoiceCard {
  id: string;
  invoiceId: string;
  qrCode: string;
  cardUrl: string;
  
  // Card Display Data
  cardData: {
    invoiceNumber: string;
    customerName: string;
    date: Date;
    total: number;
    currency: string;
    
    // Items with images
    items: CardItem[];
    
    // Gold-specific display (conditional)
    goldDetails?: {
      sood: number;
      ojrat: number;
      maliyat: number;
      totalWeight: number;
    };
    
    // Payment information
    paymentStatus: string;
    paymentMethod?: string;
  };
  
  // Card styling
  theme: 'glass' | 'modern' | 'classic';
  backgroundColor: string;
  textColor: string;
  
  // Access control
  isPublic: boolean;
  expiresAt?: Date;
  
  createdAt: Date;
}

interface CardItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  image?: string;
  thumbnailUrl?: string;
}
```

**QR Card Features:**
- Beautiful glass-style UI cards
- QR code generation linking to card
- Public access without authentication
- Responsive design for mobile scanning
- Item images displayed in cards
- Gold-specific field display
- Professional presentation

### 4. Enhanced Double-Entry Accounting System

**Comprehensive Accounting Architecture:**
```typescript
interface AccountingSystem {
  chartOfAccounts: ChartOfAccounts;
  journalEntries: JournalEntry[];
  
  // Persian accounting terminology
  subsidiaryAccounts: SubsidiaryAccount[]; // حساب‌های تفصیلی
  generalLedger: GeneralLedger; // دفتر معین
  
  // Check and account management
  checkManagement: CheckManagement; // مدیریت چک‌ها
  accountManagement: AccountManagement; // مدیریت حساب‌ها
  transactionDates: TransactionDateTracking; // تاریخ معاملات
  
  // Installment improvements
  installmentAccounts: InstallmentAccount[]; // حساب‌های اقساطی
  
  // Reconciliation features
  reconciliation: ReconciliationSystem;
  
  // Period management
  periodClosing: PeriodClosing;
  auditTrail: AuditTrail;
}

interface JournalEntry {
  id: string;
  entryNumber: string;
  date: Date;
  reference: string;
  description: string;
  
  // Double-entry lines
  debits: AccountEntry[];
  credits: AccountEntry[];
  totalDebit: number;
  totalCredit: number;
  balanced: boolean;
  
  // Source tracking
  source: 'invoice' | 'payment' | 'adjustment' | 'manual';
  sourceId?: string;
  
  // Gold-specific entries
  goldSpecific?: {
    soodEntry?: AccountEntry;
    ojratEntry?: AccountEntry;
    maliyatEntry?: AccountEntry;
  };
  
  // Audit information
  createdBy: string;
  createdAt: Date;
  modifiedBy?: string;
  modifiedAt?: Date;
  locked: boolean;
}
```

### 5. Image Management System

**Comprehensive Image Architecture:**
```typescript
interface ImageManagementSystem {
  storage: ImageStorage;
  processing: ImageProcessing;
  optimization: ImageOptimization;
  security: ImageSecurity;
}

interface ImageStorage {
  uploadImage(file: File, context: 'category' | 'item' | 'invoice'): Promise<ImageRecord>;
  getImage(id: string): Promise<ImageRecord>;
  deleteImage(id: string): Promise<boolean>;
  generateThumbnail(imageId: string, size: ImageSize): Promise<string>;
}

interface ImageRecord {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  dimensions: Dimensions;
  url: string;
  thumbnailUrls: Record<string, string>;
  context: 'category' | 'item' | 'invoice';
  contextId: string;
  uploadedAt: Date;
  uploadedBy: string;
}
```##
 Data Models

### Enhanced Database Schema

**Core Tables for Universal System:**
```sql
-- Business Configuration
CREATE TABLE business_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_type VARCHAR(50) NOT NULL,
    business_name VARCHAR(255) NOT NULL,
    configuration JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Hierarchical Categories with LTREE
CREATE EXTENSION IF NOT EXISTS ltree;

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    name_persian VARCHAR(255),
    parent_id UUID REFERENCES categories(id),
    path LTREE NOT NULL,
    level INTEGER NOT NULL DEFAULT 0,
    attribute_schema JSONB DEFAULT '[]',
    image_id UUID REFERENCES images(id),
    business_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX categories_path_idx ON categories USING GIST (path);
CREATE INDEX categories_parent_idx ON categories(parent_id);

-- Universal Inventory Items
CREATE TABLE inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(100) UNIQUE NOT NULL,
    barcode VARCHAR(100) UNIQUE,
    qr_code VARCHAR(255) UNIQUE,
    name VARCHAR(255) NOT NULL,
    name_persian VARCHAR(255),
    description TEXT,
    description_persian TEXT,
    category_id UUID REFERENCES categories(id),
    
    -- Pricing
    cost_price DECIMAL(15,2) NOT NULL DEFAULT 0,
    sale_price DECIMAL(15,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Inventory
    stock_quantity DECIMAL(15,3) NOT NULL DEFAULT 0,
    unit_of_measure VARCHAR(50) NOT NULL DEFAULT 'piece',
    low_stock_threshold DECIMAL(15,3) DEFAULT 0,
    
    -- Custom attributes and tags
    custom_attributes JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    
    -- Images
    primary_image_id UUID REFERENCES images(id),
    
    -- Business type specific fields
    business_type_fields JSONB DEFAULT '{}',
    
    -- Gold shop compatibility
    gold_specific JSONB,
    
    -- Audit trail
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Enhanced Invoices with Dual Type Support
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('gold', 'general')),
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    
    -- Customer information
    customer_id UUID REFERENCES customers(id),
    customer_name VARCHAR(255),
    customer_phone VARCHAR(50),
    customer_address TEXT,
    
    -- Pricing
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    total DECIMAL(15,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Workflow
    workflow_stage VARCHAR(50) DEFAULT 'draft',
    stock_affected BOOLEAN DEFAULT FALSE,
    requires_approval BOOLEAN DEFAULT FALSE,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    approval_notes TEXT,
    
    -- Gold-specific fields (conditional)
    gold_sood DECIMAL(15,2), -- سود
    gold_ojrat DECIMAL(15,2), -- اجرت
    gold_maliyat DECIMAL(15,2), -- مالیات
    gold_price DECIMAL(15,2),
    gold_total_weight DECIMAL(10,3),
    
    -- QR Card information
    qr_code VARCHAR(255) UNIQUE,
    card_url VARCHAR(500),
    card_theme VARCHAR(50) DEFAULT 'glass',
    
    -- Payment information
    payment_status VARCHAR(50) DEFAULT 'unpaid',
    payment_method VARCHAR(100),
    payment_date TIMESTAMP,
    
    -- Audit trail
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);
```## Err
or Handling

### Comprehensive Error Management Strategy

**Error Categories:**
1. **Business Logic Errors**: Inventory insufficient, invoice workflow violations, accounting balance errors
2. **Data Validation Errors**: Schema validation, business rule violations, duplicate constraints
3. **Image Processing Errors**: Upload failures, format issues, storage problems
4. **Accounting Errors**: Unbalanced entries, period locked, reconciliation failures
5. **Integration Errors**: QR generation failures, PDF creation issues, external service timeouts
6. **System Errors**: Database connectivity, cache failures, file system issues

**Error Response Structure:**
```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    messageInPersian?: string;
    details?: any;
    timestamp: string;
    requestId: string;
    context: {
      businessType?: string;
      invoiceType?: 'gold' | 'general';
      affectedResources: string[];
      userAction?: string;
    };
    suggestions?: string[];
  };
}
```

## Testing Strategy

### Comprehensive Testing Framework

**Testing Architecture:**
```
Testing Framework
├── Unit Tests (60%)
│   ├── Inventory Service Tests
│   ├── Invoice Processing Tests
│   ├── Accounting Engine Tests
│   ├── Image Management Tests
│   └── QR Card Generation Tests
├── Integration Tests (30%)
│   ├── API Integration Tests
│   ├── Database Integration Tests
│   ├── Frontend-Backend Integration
│   ├── Image Processing Pipeline Tests
│   └── Accounting Workflow Tests
└── End-to-End Tests (10%)
    ├── Complete Business Workflows
    ├── Gold vs General Invoice Flows
    ├── Multi-User Concurrent Testing
    └── Cross-Browser Compatibility
```

**Testing Infrastructure:**
- **Docker-based Testing**: All tests run in containerized environment with real PostgreSQL
- **Load Testing**: Simulate 100+ concurrent users for invoice creation and accounting operations
- **Regression Testing**: Automated testing of existing gold shop functionality
- **Image Testing**: Upload, processing, and display testing for all image workflows
- **QR Code Testing**: Generation, scanning, and card display testing
- **Accounting Testing**: Double-entry validation, balance verification, and report accuracy

**Test Coverage Requirements:**
- Minimum 80% overall code coverage
- 100% coverage for critical business logic (accounting, inventory, invoice workflows)
- Comprehensive API endpoint testing
- Cross-browser compatibility testing
- Mobile responsiveness testing

## Implementation Phases

### Phase 1: Database Schema and Backend Foundation (Weeks 1-2)
- Implement enhanced PostgreSQL schema with LTREE for categories
- Create universal inventory and dual invoice tables
- Build double-entry accounting table structure
- Implement image management tables
- Create comprehensive audit trail system

### Phase 2: Universal Inventory System (Weeks 3-4)
- Build unlimited nested category management
- Implement custom attributes system with validation
- Create advanced search and filtering capabilities
- Build image upload and management for categories and items
- Implement SKU, barcode, and QR code management

### Phase 3: Dual Invoice System (Weeks 5-6)
- Implement Gold vs General invoice type selection
- Build conditional field display for Gold invoices
- Create invoice workflow engine (draft → approved)
- Implement automatic inventory deduction/restoration
- Build manual price override functionality

### Phase 4: QR Invoice Cards System (Weeks 7-8)
- Implement beautiful glass-style invoice card generation
- Build QR code generation and linking system
- Create public card access without authentication
- Implement responsive card design for mobile scanning
- Build image display in invoice cards

### Phase 5: Enhanced Accounting System (Weeks 9-10)
- Implement complete double-entry accounting engine
- Build subsidiary accounts and general ledger management
- Create check and installment account management
- Implement bank reconciliation features
- Build period closing and locking system

### Phase 6: Frontend Integration (Weeks 11-12)
- Update all frontend components for new backend APIs
- Implement dual invoice type interface
- Build category and inventory management interface
- Create QR card display and management interface
- Update accounting interface with Persian terminology

### Phase 7: Testing and Infrastructure (Weeks 13-14)
- Implement comprehensive testing suite
- Set up Nginx with SSL and security headers
- Build monitoring and logging system
- Create automated backup procedures
- Conduct load testing and performance optimization

### Phase 8: Data Migration and Deployment (Weeks 15-16)
- Build data migration tools for existing data
- Create fresh test data for new system structure
- Implement backward compatibility layer
- Conduct user acceptance testing
- Deploy production system with monitoring

This comprehensive design provides a solid foundation for transforming the gold shop system into a universal inventory and invoice management platform while maintaining all existing functionality and ensuring enterprise-grade performance, security, and scalability.