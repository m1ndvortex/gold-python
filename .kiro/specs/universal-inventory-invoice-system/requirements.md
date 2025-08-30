# Requirements Document

## Introduction

This document outlines the requirements for transforming the existing gold shop management system into a Universal Inventory and Invoice Management System. The system will evolve from a gold-specific application to a comprehensive, industry-agnostic business management solution that can handle any type of product or service while maintaining specialized gold shop functionality. The platform will feature unlimited nested categories, flexible inventory attributes, dual invoice types (Gold vs General), comprehensive image support, beautiful QR-enabled invoice cards, enhanced double-entry accounting, and complete Docker infrastructure with Nginx security.

The transformation maintains backward compatibility with existing gold shop features while adding universal business capabilities, making it suitable for retail stores, service businesses, restaurants, pharmacies, automotive shops, and any other business type.

## Requirements

### Requirement 1: Universal Inventory & Categories with Unlimited Nesting

**User Story:** As a business owner, I want a flexible inventory system with unlimited nested subcategories and custom attributes, so that I can organize any type of product or service in a hierarchical structure that matches my business needs.

#### Acceptance Criteria

1. WHEN organizing inventory THEN the system SHALL support unlimited nested subcategories in tree-style structure where each subcategory can have further subcategories without depth limitations
2. WHEN defining product structure THEN the system SHALL use flexible schema where one item may have a single subcategory while another may have multiple levels of categorization
3. WHEN adding product attributes THEN the system SHALL support custom attributes and tags (Material: Gold, Size: Large, Vendor: X, Brand: Y, Color: Blue) for advanced filtering and searching
4. WHEN identifying items THEN the system SHALL provide unique identifiers including SKU, Barcode, and QR codes for every inventory item
5. WHEN searching inventory THEN the system SHALL provide advanced filtering capabilities using all attributes, tags, SKU, barcode, and category hierarchy
6. WHEN managing categories THEN the system SHALL allow uploading images when creating categories for visual identification
7. WHEN adding inventory items THEN the system SHALL support attaching multiple images with proper image management and storage
8. WHEN displaying items THEN the system SHALL show item images in reasonable sizes automatically across all interfaces

### Requirement 2: Dual Invoice System - Gold vs General

**User Story:** As a business manager, I want to choose between Gold and General invoice types when creating invoices, so that I can handle both specialized gold transactions and universal business transactions with appropriate fields and calculations.

#### Acceptance Criteria

1. WHEN creating invoices THEN the system SHALL provide choice between Gold and General invoice types at invoice creation
2. WHEN creating General invoices THEN the system SHALL use standard universal invoice format suitable for any business type
3. WHEN creating Gold invoices THEN the system SHALL include specialized fields: اجرت (wage/labor fee), سود (profit), and مالیات (tax)
4. WHEN displaying Gold invoice fields THEN the system SHALL show اجرت, سود, and مالیات fields only when invoice type is Gold
5. WHEN storing Gold invoice data THEN the system SHALL store اجرت, سود, and مالیات values separately in accounting system for proper reporting
6. WHEN setting prices THEN the system SHALL allow manual final price entry that overrides automatic pricing for both invoice types
7. WHEN managing inventory THEN the system SHALL support automatic stock deduction when invoice is created and restore when deleted/voided for both invoice types
8. WHEN displaying items in invoices THEN the system SHALL show item images in reasonable sizes automatically for both invoice types

### Requirement 3: Invoice Workflow and Beautiful QR Cards

**User Story:** As a business owner, I want professional invoice workflow with beautiful digital cards and QR codes, so that my customers can easily access and verify their purchase information while maintaining professional presentation.

#### Acceptance Criteria

1. WHEN managing invoice workflow THEN the system SHALL support draft → approved workflow where only approved invoices affect inventory and accounting
2. WHEN invoice is created THEN the system SHALL generate a beautiful glass-style UI card displaying all invoice details
3. WHEN generating invoice cards THEN the system SHALL create QR code that links directly to the beautiful invoice card
4. WHEN printing invoices THEN the system SHALL show the QR code under the printed invoice for customer scanning
5. WHEN customers scan QR code THEN the system SHALL display the glass-style card with item details, images, totals, and Gold-specific fields (سود, اجرت, مالیات) if applicable
6. WHEN displaying invoice cards THEN the system SHALL show item images, customer information, payment details, and all relevant invoice data in professional format
7. WHEN accessing invoice cards THEN the system SHALL ensure cards are accessible without authentication for customer convenience
8. WHEN displaying Gold invoice cards THEN the system SHALL prominently show سود, اجرت, and مالیات values alongside standard invoice information

### Requirement 4: Enhanced Double-Entry Accounting System

**User Story:** As an accountant, I want comprehensive double-entry accounting with Persian business terminology and complete financial management, so that I can maintain accurate financial records with proper debit/credit balance for every transaction and full business financial control.

#### Acceptance Criteria

1. WHEN recording transactions THEN the system SHALL implement/ensure complete double-entry accounting with balanced debit/credit for every transaction
2. WHEN managing accounts THEN the system SHALL support حساب‌های تفصیلی (subsidiary accounts) and دفتر معین (general ledger) with full hierarchical structure
3. WHEN handling payments THEN the system SHALL provide مدیریت کامل چک‌ها و حساب‌ها و تاریخ معاملات (complete check and account management with transaction dates)
4. WHEN managing installments THEN the system SHALL implement بهبود حساب‌های اقساطی (improved installment accounts) with comprehensive payment tracking and scheduling
5. WHEN reconciling accounts THEN the system SHALL add reconciliation features to match invoices with bank deposits, checks, and other financial instruments
6. WHEN closing periods THEN the system SHALL support multi-period closing/locking with comprehensive audit trail for all edits and modifications
7. WHEN recording Gold transactions THEN the system SHALL properly account for اجرت, سود, and مالیات in separate accounting categories with proper journal entries
8. WHEN generating reports THEN the system SHALL produce standard financial reports (P&L, Balance Sheet, Cash Flow, Trial Balance) with Persian terminology support
9. WHEN expanding features THEN the system SHALL include all accounting expansion features as specified in change requirements
10. WHEN auditing THEN the system SHALL maintain complete audit trail for all financial transactions and account modifications

### Requirement 5: Comprehensive Testing Framework

**User Story:** As a system administrator, I want comprehensive automated testing coverage, so that I can ensure system reliability and catch issues before they affect business operations.

#### Acceptance Criteria

1. WHEN testing functionality THEN the system SHALL provide full end-to-end tests for all tabs, sub-tabs, and sections
2. WHEN verifying calculations THEN the system SHALL test calculations for invoices, accounting, and backend operations
3. WHEN measuring coverage THEN the system SHALL implement automated coverage reports using pytest + coverage with minimum 80% coverage
4. WHEN testing performance THEN the system SHALL include load tests for invoices and accounting supporting ≥100 concurrent users
5. WHEN testing regressions THEN the system SHALL maintain regression test suites for inventory movement, pricing overrides, and Gold-specific invoice logic
6. WHEN testing integrations THEN the system SHALL verify all module interconnections and data flow between components
7. WHEN running tests THEN the system SHALL execute all tests within Docker environment with real database connections
8. WHEN validating business logic THEN the system SHALL test both Gold and General invoice workflows with proper inventory and accounting integration

### Requirement 6: Docker Infrastructure with Nginx Security

**User Story:** As a system administrator, I want enterprise-grade Docker infrastructure with Nginx security, so that I can deploy and maintain the system securely in production environments.

#### Acceptance Criteria

1. WHEN modifying database THEN the system SHALL extend database schema inside Docker as needed for new inventory, invoice, and accounting features
2. WHEN updating UI THEN the system SHALL update UI and navigation menus so all new features are accessible and navigatable
3. WHEN configuring Nginx THEN the system SHALL install and configure Nginx in Docker as reverse proxy for the web app
4. WHEN securing communications THEN the system SHALL implement security best practices including SSL, security headers, and rate limits
5. WHEN integrating services THEN the system SHALL ensure Nginx integrates cleanly with backend and frontend containers
6. WHEN deploying THEN the system SHALL use Docker containerization with proper orchestration for all services
7. WHEN monitoring THEN the system SHALL provide comprehensive logging and monitoring capabilities
8. WHEN backing up THEN the system SHALL implement automated backup procedures for all data and configurations

### Requirement 7: Image Management and Display System

**User Story:** As a business user, I want comprehensive image support throughout the system, so that I can visually manage my inventory and provide professional presentation to customers.

#### Acceptance Criteria

1. WHEN creating categories THEN the system SHALL allow uploading images for visual category identification and organization
2. WHEN adding inventory items THEN the system SHALL support attaching multiple images with proper storage and management
3. WHEN displaying inventory THEN the system SHALL show item images in appropriate sizes across all inventory interfaces
4. WHEN creating invoices THEN the system SHALL automatically display item images in reasonable sizes for professional presentation
5. WHEN generating invoice cards THEN the system SHALL include item images in the beautiful glass-style QR-accessible cards
6. WHEN printing invoices THEN the system SHALL include item images in printed format with proper sizing and layout
7. WHEN managing images THEN the system SHALL provide image upload, resize, and optimization capabilities
8. WHEN storing images THEN the system SHALL implement secure image storage with proper access controls and backup

### Requirement 8: Data Migration and Fresh Test Data

**User Story:** As a system administrator, I want clean data migration with fresh test data, so that I can transition from the old system structure to the new universal system without data conflicts.

#### Acceptance Criteria

1. WHEN migrating data THEN the system SHALL delete old inventory and invoice data that doesn't match new universal structure
2. WHEN creating test data THEN the system SHALL add new comprehensive test data according to new universal inventory and invoice structure
3. WHEN preserving compatibility THEN the system SHALL maintain existing gold shop functionality while adding universal features
4. WHEN validating migration THEN the system SHALL provide data validation and integrity checks for new data structure
5. WHEN testing new features THEN the system SHALL include test data for unlimited nested categories, custom attributes, and both invoice types
6. WHEN demonstrating system THEN the system SHALL provide realistic test data showing Gold and General invoice workflows
7. WHEN verifying functionality THEN the system SHALL ensure all new features work with fresh test data including image attachments
8. WHEN maintaining audit trails THEN the system SHALL preserve audit capabilities while transitioning to new data structure

### Requirement 9: Universal Business Adaptability

**User Story:** As any business owner, I want the system to handle my specific business type while maintaining universal functionality, so that I can use one platform for all my business management needs regardless of my industry.

#### Acceptance Criteria

1. WHEN configuring business THEN the system SHALL support any business type (retail, restaurant, pharmacy, automotive, service, manufacturing, etc.)
2. WHEN managing inventory THEN the system SHALL adapt to different product types (physical goods, services, digital products, consumables)
3. WHEN processing transactions THEN the system SHALL handle various pricing models (fixed price, weight-based, time-based, custom formulas)
4. WHEN generating reports THEN the system SHALL provide business-type appropriate reports and analytics
5. WHEN customizing workflow THEN the system SHALL allow business-specific workflow customization while maintaining core functionality
6. WHEN handling units THEN the system SHALL support various units of measure appropriate for different business types
7. WHEN managing customers THEN the system SHALL adapt customer management to business type (clients, patients, customers, etc.)
8. WHEN processing payments THEN the system SHALL support multiple payment methods and currencies appropriate for different markets

### Requirement 10: Advanced Search and Filtering System

**User Story:** As a business user, I want powerful search and filtering capabilities, so that I can quickly find any inventory item or invoice using multiple criteria and attributes.

#### Acceptance Criteria

1. WHEN searching inventory THEN the system SHALL provide search by name, SKU, barcode, QR code, and description
2. WHEN filtering by attributes THEN the system SHALL allow filtering using any custom attribute (Material, Size, Vendor, Brand, Color, etc.)
3. WHEN filtering by categories THEN the system SHALL support filtering by any level of the unlimited nested category hierarchy
4. WHEN searching by tags THEN the system SHALL provide tag-based search and filtering with auto-complete
5. WHEN combining filters THEN the system SHALL support multiple simultaneous filters with AND/OR logic
6. WHEN searching invoices THEN the system SHALL provide search by customer, date range, invoice type, status, and amounts
7. WHEN filtering Gold invoices THEN the system SHALL allow filtering by اجرت, سود, and مالیات values
8. WHEN displaying results THEN the system SHALL show search results with images, key attributes, and relevant information
### 
Requirement 11: Frontend Modifications for Backend Integration

**User Story:** As a system user, I want the frontend interface to seamlessly integrate with all new backend changes, so that I can access and use all new universal inventory and invoice features through an intuitive and navigatable interface.

#### Acceptance Criteria

1. WHEN backend changes are made THEN the system SHALL modify frontend components to match new backend data structures and APIs
2. WHEN new inventory features are added THEN the system SHALL update inventory management interface to support unlimited nested categories, custom attributes, and image management
3. WHEN dual invoice system is implemented THEN the system SHALL create frontend interface for choosing between Gold and General invoice types with conditional field display
4. WHEN QR invoice cards are created THEN the system SHALL build frontend interface for generating, displaying, and managing beautiful glass-style invoice cards
5. WHEN accounting features are expanded THEN the system SHALL update accounting interface to support all new double-entry features, Persian terminology, and enhanced reporting
6. WHEN navigation is updated THEN the system SHALL ensure all new features are accessible through updated navigation menus and user interface
7. WHEN forms are modified THEN the system SHALL update all forms to handle new data fields, validation rules, and business logic
8. WHEN displaying data THEN the system SHALL modify all display components to show new fields, images, and enhanced information properly
9. WHEN user interactions change THEN the system SHALL update user workflows to match new backend processes and business rules
10. WHEN testing frontend THEN the system SHALL ensure all frontend modifications work seamlessly with new backend APIs and data structures

### Requirement 12: Complete System Navigation and Accessibility

**User Story:** As a business user, I want easy navigation to all system features, so that I can efficiently access and use all inventory, invoice, accounting, and administrative functions without confusion.

#### Acceptance Criteria

1. WHEN accessing features THEN the system SHALL ensure all new inventory, invoice, and accounting features are accessible through clear navigation paths
2. WHEN organizing menus THEN the system SHALL update navigation menus to include all new universal business management features
3. WHEN using interface THEN the system SHALL maintain consistent UI/UX design across all new and existing features
4. WHEN switching between features THEN the system SHALL provide smooth transitions and clear breadcrumb navigation
5. WHEN managing different business types THEN the system SHALL adapt navigation and terminology based on selected business type
6. WHEN accessing mobile THEN the system SHALL ensure all features are accessible and usable on mobile devices
7. WHEN using keyboard navigation THEN the system SHALL support full keyboard accessibility for all new features
8. WHEN providing help THEN the system SHALL include contextual help and tooltips for new features and workflows
###
 Requirement 13: Universal Business Adaptability Frontend Interface

**User Story:** As a business owner, I want an intuitive frontend interface to configure and manage my business type settings, so that I can easily customize the system to match my specific business needs without technical expertise.

#### Acceptance Criteria

1. WHEN selecting business type THEN the system SHALL provide a visual Business Type Selection Wizard with cards showing different business types (jewelry, restaurant, pharmacy, automotive, etc.) with descriptions and feature previews
2. WHEN configuring business THEN the system SHALL provide a comprehensive Business Configuration Dashboard allowing users to manage all business-specific settings in one centralized location
3. WHEN setting up initially THEN the system SHALL guide users through a Business Setup Flow covering terminology customization, unit selection, feature configuration, and workflow preferences
4. WHEN managing terminology THEN the system SHALL provide a Dynamic Terminology Management Interface allowing real-time customization of business-specific terms and labels with live preview
5. WHEN defining custom fields THEN the system SHALL provide a Custom Field Configuration Interface enabling users to create, modify, and manage custom fields per entity type with drag-and-drop field builders
6. WHEN configuring features THEN the system SHALL provide a Feature Toggle Dashboard showing available features with business-type specific recommendations, dependencies, and impact explanations
7. WHEN managing units THEN the system SHALL provide a Unit of Measure Management Interface with conversion tools, business-type appropriate suggestions, and custom unit creation capabilities
8. WHEN setting pricing THEN the system SHALL provide a Pricing Model Configuration Interface supporting setup of complex pricing rules with visual formula builders and testing tools
9. WHEN migrating business types THEN the system SHALL provide a Business Migration Wizard allowing safe migration between business types with data preservation preview and rollback options
10. WHEN analyzing performance THEN the system SHALL provide a Business Analytics Dashboard showing business-type specific KPIs, metrics, and performance indicators with customizable widgets
11. WHEN customizing workflows THEN the system SHALL provide a Workflow Configuration Interface allowing users to customize business processes, approval workflows, and automation rules
12. WHEN managing languages THEN the system SHALL provide a Multi-language Support Interface for terminology translation, localization management, and regional customization
13. WHEN browsing templates THEN the system SHALL provide a Business Template Gallery allowing users to browse, preview, and apply pre-configured business type templates with one-click setup
14. WHEN testing configuration THEN the system SHALL provide real-time preview and testing capabilities for all business adaptability settings before applying changes
15. WHEN accessing help THEN the system SHALL provide contextual help, guided tours, and documentation for all business adaptability features with business-type specific examples
16. WHEN navigating to business adaptability THEN the system SHALL provide clear navigation paths from main menu, dashboard, and settings areas to access all business adaptability features through intuitive UI elements including dedicated menu items, quick access buttons, and contextual links

### Requirement 14: System Administration Dashboard Interface

**User Story:** As a system administrator, I want a comprehensive web-based dashboard to monitor and manage the Docker infrastructure, so that I can ensure system health, security, and performance without needing command-line access.

#### Acceptance Criteria

1. WHEN accessing administration THEN the system SHALL provide a System Administration Dashboard accessible through main navigation menu under "System" or "Admin" section with proper role-based access control
2. WHEN monitoring infrastructure THEN the system SHALL display real-time status of all Docker services (Database, Redis, Backend, Frontend, Nginx) with visual health indicators
3. WHEN checking system health THEN the system SHALL show comprehensive system health overview with color-coded status badges for CPU, memory, disk usage, and service availability
4. WHEN monitoring security THEN the system SHALL display SSL certificate status, security headers validation, rate limiting statistics, and security monitoring alerts
5. WHEN managing backups THEN the system SHALL provide backup management interface allowing administrators to view backup status, trigger manual backups, and restore from backups
6. WHEN analyzing logs THEN the system SHALL provide log viewer and analysis panel for viewing and filtering system logs from all services with search capabilities
7. WHEN monitoring performance THEN the system SHALL display performance metrics dashboard showing response times, throughput, error rates, and system performance trends with interactive charts
8. WHEN managing services THEN the system SHALL provide service management panel allowing administrators to restart services, view service logs, and manage configurations
9. WHEN handling alerts THEN the system SHALL provide alert management system for configuring and viewing system alerts, notifications, and health monitoring thresholds
10. WHEN administering database THEN the system SHALL provide database administration interface for viewing database status, connection pools, and running basic health queries
11. WHEN managing cache THEN the system SHALL provide Redis cache management panel for monitoring cache performance, clearing cache, and viewing statistics
12. WHEN managing certificates THEN the system SHALL provide SSL certificate management interface for viewing certificate status, expiration dates, and health monitoring
13. WHEN configuring system THEN the system SHALL provide system configuration panel for managing environment variables, feature flags, and system settings through web interface
14. WHEN managing sessions THEN the system SHALL provide user session management interface for viewing active sessions, managing user access, and security monitoring
15. WHEN navigating administration THEN the system SHALL ensure all administration features are accessible through intuitive navigation with proper breadcrumbs and contextual help
16. WHEN using mobile devices THEN the system SHALL provide responsive administration dashboard that works effectively on tablets and mobile devices for emergency system management