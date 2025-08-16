# Requirements Document

## Introduction

This document outlines the requirements for a professional طلافروشی (gold shop) web application. The system will be a full-featured, modern web application built with React + TypeScript + shadcn/ui + Tailwind CSS frontend and FastAPI + PostgreSQL backend. The application will run fully in Docker environment and serve as a comprehensive business management solution for gold shops, supporting both Persian (RTL) and English languages.

**🐳 CRITICAL DOCKER ENVIRONMENT REMINDER:** 
- This entire application runs in Docker containers
- ALL development, testing, and deployment MUST assume Docker environment
- NO testing or execution should occur outside of Docker containers
- ALL unit tests MUST use real PostgreSQL database within Docker
- This is a production-ready application requiring real database testing

**⚠️ IMPORTANT FOR ALL TASKS:** Every task implementation must include unit tests using the real PostgreSQL database running in Docker. Never mock the database or test outside the Docker environment.

## Requirements

### Requirement 1

**User Story:** As a gold shop owner, I want a secure authentication system, so that I can control access to my business data and ensure only authorized users can perform operations.

#### Acceptance Criteria

1. WHEN a user attempts to log in THEN the system SHALL authenticate using JWT tokens only
2. WHEN authentication is successful THEN the system SHALL issue a JWT token containing user ID, role, and permissions
3. WHEN a user accesses protected resources THEN the system SHALL validate the JWT token
4. WHEN a user has insufficient permissions THEN the system SHALL deny access and display appropriate error message
5. IF a user is not authenticated THEN the system SHALL redirect to login page
6. WHEN JWT token expires THEN the system SHALL require re-authentication

### Requirement 2

**User Story:** As a gold shop manager, I want a comprehensive dashboard, so that I can quickly view key business metrics and navigate to detailed sections.

#### Acceptance Criteria

1. WHEN the dashboard loads THEN the system SHALL display summary cards for total sales (today, week, month), total inventory value, total customer debt, and current gold price trends
2. WHEN the dashboard loads THEN the system SHALL display interactive graphs for sales per category, best-selling items, and customer purchase history
3. WHEN inventory is low THEN the system SHALL display low stock alerts on the dashboard
4. WHEN invoices are unpaid THEN the system SHALL display unpaid invoice alerts on the dashboard
5. WHEN a user clicks on summary cards THEN the system SHALL navigate to the corresponding detailed tab (inventory, invoices, customers)
6. WHEN dashboard data changes THEN the system SHALL update summary cards and graphs in real-time

### Requirement 3

**User Story:** As a gold shop employee, I want to manage inventory efficiently, so that I can track stock levels, prices, and product information accurately.

#### Acceptance Criteria

1. WHEN managing inventory THEN the system SHALL support categories and subcategories for organization
2. WHEN adding items THEN the system SHALL require Name, Weight (grams), Purchase Price, Sell Price, Stock, Description, and optional Image
3. WHEN stock levels are low THEN the system SHALL generate and display low stock alerts
4. WHEN performing CRUD operations THEN the system SHALL allow Add, Edit, and Delete operations for inventory items
5. WHEN items are sold THEN the system SHALL automatically update inventory stock levels
6. WHEN inventory changes THEN the system SHALL automatically update accounting records and dashboard summaries

### Requirement 4

**User Story:** As a gold shop cashier, I want to manage customer information and track their purchase history, so that I can provide personalized service and manage credit sales.

#### Acceptance Criteria

1. WHEN viewing customers THEN the system SHALL display Name, Contact Info, Total Purchases, Debt, and Last Purchase date
2. WHEN accessing customer profiles THEN the system SHALL show Purchase history, Payment history, and Current debt
3. WHEN customers make partial payments THEN the system SHALL support and track partial payment records
4. WHEN customer data changes THEN the system SHALL automatically update invoice tab, accounting tab, and dashboard summary cards
5. WHEN adding new customers THEN the system SHALL validate required contact information
6. WHEN customers have outstanding debt THEN the system SHALL highlight debt status in customer list

### Requirement 5

**User Story:** As a gold shop cashier, I want to create and manage invoices, so that I can process sales transactions and generate professional receipts.

#### Acceptance Criteria

1. WHEN creating invoices THEN the system SHALL support both full and partial payment options
2. WHEN selecting items THEN the system SHALL allow selection of customers and items from inventory
3. WHEN calculating prices THEN the system SHALL use gram-based calculation: Final Price = Weight × (Gold Price + Labor + Profit + VAT)
4. WHEN customizing invoices THEN the system SHALL allow customization of logo, fonts, colors, fields, and support printable/PDF export
5. WHEN managing invoices THEN the system SHALL provide invoice list with filters, search, edit, print, and export PDF functionality
6. WHEN items are sold THEN the system SHALL automatically reduce inventory stock levels
7. WHEN partial payments are made THEN the system SHALL update customer debt records
8. WHEN invoices are created THEN the system SHALL automatically update dashboard summaries

### Requirement 6

**User Story:** As a gold shop accountant, I want comprehensive financial management tools, so that I can track all financial aspects of the business accurately.

#### Acceptance Criteria

1. WHEN tracking income THEN the system SHALL maintain an Income Ledger that tracks all revenue from invoices, shows full vs partial payments, and allows filtering by date/customer/category
2. WHEN recording expenses THEN the system SHALL maintain an Expense Ledger for purchases, labor, store expenses, and taxes with proper categorization
3. WHEN managing cash flow THEN the system SHALL maintain Cash & Bank Ledger to record cash, bank deposits, withdrawals, and link invoice payments directly
4. WHEN tracking gold inventory THEN the system SHALL maintain Gold-weight Ledger for incoming and outgoing gold with grams-based accounting for stock valuation
5. WHEN analyzing profitability THEN the system SHALL provide automatic profit calculation per item and overall, highlighting top-performing products/categories
6. WHEN monitoring debts THEN the system SHALL track outstanding debts per customer with automatic updates from partial payments
7. WHEN generating reports THEN the system SHALL provide charts integration for income/expense trends, customer debts, and inventory valuation
8. WHEN financial transactions occur THEN the system SHALL automatically update ledgers from invoices, inventory changes, and customer payments

### Requirement 7

**User Story:** As a gold shop manager, I want detailed reports and visual analytics, so that I can make informed business decisions based on data trends.

#### Acceptance Criteria

1. WHEN viewing reports THEN the system SHALL display interactive charts for sales trends (daily, weekly, monthly)
2. WHEN analyzing inventory THEN the system SHALL show charts for inventory valuation and low-stock items
3. WHEN reviewing customer data THEN the system SHALL display customer purchase trends and debt charts
4. WHEN filtering reports THEN the system SHALL allow filtering by date, category, and customer
5. WHEN charts are displayed THEN the system SHALL use professional charting libraries (Chart.js or ECharts)
6. WHEN data changes THEN the system SHALL update charts and reports in real-time

### Requirement 8

**User Story:** As a gold shop owner, I want comprehensive system settings, so that I can configure the application according to my business needs and manage user access.

#### Acceptance Criteria

1. WHEN configuring company info THEN the system SHALL allow setting logo, name, and address for invoices
2. WHEN managing gold prices THEN the system SHALL support manual or automatic gold price updates
3. WHEN customizing invoices THEN the system SHALL provide an invoice template designer for layout, fonts, colors, logo, and fields
4. WHEN setting defaults THEN the system SHALL allow configuration of labor cost, profit percentage, and VAT rate
5. WHEN managing access THEN the system SHALL provide predefined roles (Owner, Manager, Accountant, Cashier) and custom role creation
6. WHEN assigning permissions THEN the system SHALL allow tickable permissions (view/edit/delete inventory, create/edit invoices, manage customers, view reports, send SMS)
7. WHEN managing users THEN the system SHALL allow assignment of users to roles
8. WHEN viewing roles THEN the system SHALL display table/list of roles with expandable checkboxes for permissions

### Requirement 9

**User Story:** As a gold shop manager, I want SMS notification capabilities, so that I can send promotional messages and debt reminders to customers.

#### Acceptance Criteria

1. WHEN sending SMS THEN the system SHALL support batch SMS sending with maximum 100 messages at a time
2. WHEN selecting recipients THEN the system SHALL link SMS functionality to customer accounts
3. WHEN sending fails THEN the system SHALL implement async sending with retry mechanism on failure
4. WHEN sending promotions THEN the system SHALL allow promotional message templates
5. WHEN sending debt reminders THEN the system SHALL allow debt reminder message templates

### Requirement 10

**User Story:** As a user, I want a professional and intuitive interface, so that I can efficiently navigate and use all system features in both Persian and English.

#### Acceptance Criteria

1. WHEN using the interface THEN the system SHALL provide professional enterprise UI that is clean, modern, and responsive
2. WHEN displaying components THEN the system SHALL use shadcn/ui components (buttons, tables, forms, modals, cards, tabs, notifications, dropdowns)
3. WHEN styling the interface THEN the system SHALL use Tailwind CSS for customization (colors, fonts, shadows, layout)
4. WHEN using Persian language THEN the system SHALL provide full RTL support using Tailwind RTL plugin and dir="rtl"
5. WHEN working with invoices THEN the system SHALL provide fully customizable invoice component with dynamic preview and printable/PDF export
6. WHEN switching languages THEN the system SHALL maintain consistent functionality in both Persian and English

### Requirement 11

**User Story:** As a system administrator, I want a robust backend system, so that the application can handle all business operations securely and efficiently.

#### Acceptance Criteria

1. WHEN authenticating users THEN the backend SHALL implement JWT authentication with role/permission support
2. WHEN storing data THEN the backend SHALL use PostgreSQL database for Users, Roles, Permissions, Inventory, Customers, Invoices, and Accounting ledgers
3. WHEN providing API access THEN the backend SHALL offer endpoints for CRUD operations, reporting, and invoice generation
4. WHEN deploying THEN the backend SHALL be lightweight and suitable for single-user VPS deployment
5. WHEN handling requests THEN the backend SHALL implement proper error handling and data validation
6. WHEN processing transactions THEN the backend SHALL ensure data consistency across all interconnected modules

### Requirement 12

**User Story:** As a system administrator, I want containerized deployment, so that the application can be easily deployed and maintained in a Docker environment.

#### Acceptance Criteria

1. WHEN deploying THEN the system SHALL use Docker Compose to run FastAPI backend, PostgreSQL database, and React frontend
2. WHEN persisting data THEN the system SHALL ensure PostgreSQL data persistence across container restarts
3. WHEN configuring THEN the system SHALL use environment variables for DB connection, JWT secret, and SMS API keys
4. WHEN running THEN the system SHALL operate entirely within Docker containers with no external dependencies
5. WHEN testing THEN the system SHALL support unit testing within Docker environment using real PostgreSQL database (never mocked databases)
6. WHEN developing THEN the system SHALL support development workflow entirely within Docker containers
7. WHEN implementing any feature THEN the system SHALL include comprehensive unit tests using real PostgreSQL database in Docker
8. WHEN running tests THEN the system SHALL execute all tests within Docker containers with no external testing

### Requirement 13

**User Story:** As a developer/tester, I want all development and testing to occur within Docker environment with real databases, so that the application is production-ready and thoroughly tested.

#### Acceptance Criteria

1. WHEN developing any feature THEN all work SHALL be performed within Docker containers
2. WHEN writing unit tests THEN tests SHALL use real PostgreSQL database running in Docker (never mocked)
3. WHEN testing backend functionality THEN tests SHALL connect to actual PostgreSQL instance in Docker
4. WHEN testing frontend functionality THEN tests SHALL interact with real backend APIs in Docker
5. WHEN implementing any task THEN comprehensive unit tests with real database SHALL be included
6. WHEN running the application THEN it SHALL operate entirely within Docker environment
7. WHEN debugging issues THEN all debugging SHALL occur within Docker containers
8. WHEN validating functionality THEN validation SHALL use real database data and Docker environment

### Requirement 14

**User Story:** As a business owner, I want all system modules to be interconnected, so that data flows seamlessly between different parts of the application.

#### Acceptance Criteria

1. WHEN selling items THEN the system SHALL automatically update Inventory → Invoice → Customer → Accounting → Dashboard
2. WHEN processing payments THEN the system SHALL update customer debt, accounting ledgers, and dashboard summaries
3. WHEN managing inventory THEN the system SHALL reflect changes in invoice creation, accounting valuation, and dashboard metrics
4. WHEN creating invoices THEN the system SHALL update customer records, inventory levels, and accounting entries
5. WHEN using gram-based calculations THEN the system SHALL serve as the core accounting engine across all modules
6. WHEN data changes in any module THEN the system SHALL propagate updates to all related modules automatically