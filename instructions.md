
# Professional AI Prompt for طلافروشی Web App

**Task:**

Build a **full-featured, modern, professional طلافروشی (gold shop) web application** with **React + TypeScript + shadcn/ui + Tailwind CSS frontend** and **FastAPI + PostgreSQL backend**. The app will run on a single-user VPS and use **JWT authentication**. The interface must fully support **Persian (RTL) and English**.

The app should be modular, maintainable, and scalable, with a **professional enterprise-style dashboard**. Security should be simple and functional—**JWT only, no CSRF**.

---

## 1️⃣ Authentication

- JWT-based login and registration system
- Backend issues token with user ID, role, and permissions
- Frontend shows/hides features dynamically based on **role/permission**
- No session or CSRF complexity

---

## 2️⃣ Dashboard

- **Summary cards:** Total sales (today, week, month), total inventory value, total customer debt, current gold price trends
- **Interactive graphs:**
  - Sales per category
  - Best-selling items
  - Customer purchase history
- **Alerts:** Low stock, unpaid invoices
- **Interactions:** Clicking cards navigates to detailed tabs (inventory, invoices, customers)

---

## 3️⃣ Inventory Management

- Categories and subcategories
- Items: Name, Weight (grams), Purchase Price, Sell Price, Stock, Description, Image
- Low stock alerts
- CRUD operations (Add/Edit/Delete)
- **Integration:** Selling items updates **inventory**, **customer invoice**, **accounting** automatically

---

## 4️⃣ Customers Tab

- List of customers: Name, Contact Info, Total Purchases, Debt, Last Purchase
- Customer profile page: Purchase history, Payment history, Current debt
- Partial payments supported for credit sales
- **Integration:** Updates **invoice tab**, **accounting tab**, and **dashboard summary cards**

---

## 5️⃣ Invoice Tab (فاکتور)

- Create invoices (full or partial payment)
- Select customer and items from inventory
- **Gram-based calculation**:
  ```
  Final Price = Weight × (Gold Price + Labor + Profit + VAT)
  ```
- Customizable invoice layout: logo, fonts, colors, fields, printable/PDF-ready
- Invoice list with filters, search, edit, print, export PDF
- **Integration:**
  - Selling items reduces **inventory**
  - Partial payment updates **customer debt**
  - Dashboard summary updates dynamically

---

## 6️⃣ Accounting Tab (Detailed)

- **Purpose:** Full financial management for a gold shop
- **Modules & Features:**
  1. **Income Ledger:** Tracks all revenue from invoices; shows full payment vs partial payment; filter by date/customer/category
  2. **Expense Ledger:** Purchases, labor, store expenses, taxes; categorized for reporting
  3. **Cash & Bank Ledger:** Record cash, bank deposits, withdrawals; link invoice payments directly to ledger
  4. **Gold-weight Ledger:** Track incoming and outgoing gold; supports grams-based accounting for stock valuation
  5. **Profit & Loss Analysis:** Automatic profit calculation per item and overall; highlight top-performing products/categories
  6. **Debt Tracking:** Monitor outstanding debts per customer; partial payments update ledger automatically
  7. **Reports & Charts Integration:** Graphs for income/expense trends, customer debts, inventory valuation
- **Integration:** Ledger updates automatically from **invoices**, **inventory changes**, and **customer payments**

---

## 7️⃣ Reports & Graphs

- Interactive charts (Chart.js / ECharts) for:
  - Sales trends (daily, weekly, monthly)
  - Inventory valuation and low-stock items
  - Customer purchase trends and debts
- Filters: by date, category, customer

---

## 8️⃣ Settings Tab

- **Company Info:** Logo, name, address for invoices
- **Gold Price Configuration:** Manual or automatic update source
- **Invoice Template Designer:** Customize layout, fonts, colors, logo, fields
- **Default Values:** Labor cost, profit %, VAT rate
- **Role & Permission Management:**
  - Predefined roles (Owner, Manager, Accountant, Cashier)
  - Custom roles with tickable permissions (view/edit/delete inventory, create/edit invoices, manage customers, view reports, send SMS)
  - Assign users to roles
- **UI:** Table/list of roles with expandable checkboxes for permissions

---

## 9️⃣ SMS Notifications

- Optional batch SMS sending (max 100 at a time) for promotions or debt reminders
- Linked to customer accounts
- Async sending with retry on failure

---

## 10️⃣ Frontend (React + shadcn/ui + Tailwind)

- **Professional enterprise UI:** Clean, modern dashboard, responsive, RTL-ready
- **Components from shadcn/ui:** Buttons, tables, forms, modals, cards, tabs, notifications, dropdowns
- **Tailwind CSS:** For easy customization (colors, fonts, shadows, layout)
- **RTL Support:** Tailwind RTL plugin + `dir="rtl"` for Persian layout
- **Invoice component:** Fully customizable, dynamic preview, printable or export to PDF

---

## 11️⃣ Backend (FastAPI + PostgreSQL)

- JWT authentication with role/permission support
- PostgreSQL database stores: Users, Roles, Permissions, Inventory, Customers, Invoices, Accounting ledgers
- API endpoints for CRUD operations, reporting, and invoice generation
- Lightweight and suitable for single-user VPS

---

## 12️⃣ Docker Deployment

- Use **Docker Compose** to run:
  - FastAPI backend
  - PostgreSQL database
  - React frontend
- Data persistence for PostgreSQL
- Environment variables for configuration (DB connection, JWT secret, SMS API keys)

---

✅ **Key Notes**

- All tabs are interconnected: Inventory → Invoice → Customer → Accounting → Dashboard
- Gram-based system is **core accounting engine**
- UI stays **modern, professional, and RTL-ready**
- Roles & permissions ensure access control without overcomplicating security

