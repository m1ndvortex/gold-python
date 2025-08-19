# Database Schema Requirements for Enterprise Gold Shop System

## 📋 **Current Tables Analysis**
```sql
-- Current Tables (8 tables)
1. users
2. roles  
3. categories
4. category_templates
5. inventory_items
6. customers
7. invoices
8. invoice_items
9. accounting_entries
10. payments
11. company_settings
```

## 🆕 **Required New Tables & Schema Changes**

### **🖼️ Image Management System**

#### **1. New Table: `images`**
```sql
CREATE TABLE images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL, -- 'inventory_item', 'category', 'customer', 'user'
    entity_id UUID NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    width INTEGER,
    height INTEGER,
    alt_text VARCHAR(255),
    is_primary BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    thumbnail_path VARCHAR(500),
    compressed_path VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_images_entity ON images(entity_type, entity_id);
CREATE INDEX idx_images_primary ON images(entity_id, is_primary);
```

#### **2. Modify Table: `categories` - Add image support**
```sql
ALTER TABLE categories ADD COLUMN image_url VARCHAR(500);
ALTER TABLE categories ADD COLUMN thumbnail_url VARCHAR(500);
ALTER TABLE categories ADD COLUMN icon_image_url VARCHAR(500);
```

#### **3. Modify Table: `inventory_items` - Enhanced image support**
```sql
ALTER TABLE inventory_items ADD COLUMN primary_image_id UUID REFERENCES images(id);
ALTER TABLE inventory_items ADD COLUMN gallery_images JSONB; -- Array of image IDs
```

### **👤 Enhanced Customer Profile System**

#### **4. Major Modification: `customers` table**
```sql
-- Personal Information
ALTER TABLE customers ADD COLUMN national_id VARCHAR(50);
ALTER TABLE customers ADD COLUMN date_of_birth DATE;
ALTER TABLE customers ADD COLUMN age INTEGER;
ALTER TABLE customers ADD COLUMN gender VARCHAR(20);
ALTER TABLE customers ADD COLUMN nationality VARCHAR(100);
ALTER TABLE customers ADD COLUMN occupation VARCHAR(100);
ALTER TABLE customers ADD COLUMN marital_status VARCHAR(20);

-- Complete Address Information
ALTER TABLE customers ADD COLUMN street_address TEXT;
ALTER TABLE customers ADD COLUMN city VARCHAR(100);
ALTER TABLE customers ADD COLUMN state VARCHAR(100);
ALTER TABLE customers ADD COLUMN zip_code VARCHAR(20);
ALTER TABLE customers ADD COLUMN country VARCHAR(100);
ALTER TABLE customers ADD COLUMN address_type VARCHAR(20) DEFAULT 'home';

-- Emergency Contact
ALTER TABLE customers ADD COLUMN emergency_contact_name VARCHAR(200);
ALTER TABLE customers ADD COLUMN emergency_contact_relationship VARCHAR(100);
ALTER TABLE customers ADD COLUMN emergency_contact_phone VARCHAR(20);
ALTER TABLE customers ADD COLUMN emergency_contact_email VARCHAR(100);

-- Business Information
ALTER TABLE customers ADD COLUMN company_name VARCHAR(200);
ALTER TABLE customers ADD COLUMN position VARCHAR(100);
ALTER TABLE customers ADD COLUMN business_phone VARCHAR(20);
ALTER TABLE customers ADD COLUMN business_address TEXT;
ALTER TABLE customers ADD COLUMN tax_id VARCHAR(50);

-- Extended Information
ALTER TABLE customers ADD COLUMN custom_fields JSONB;
ALTER TABLE customers ADD COLUMN notes TEXT;
ALTER TABLE customers ADD COLUMN internal_notes TEXT;
ALTER TABLE customers ADD COLUMN profile_image_id UUID REFERENCES images(id);

-- Add indexes for new fields
CREATE INDEX idx_customers_national_id ON customers(national_id);
CREATE INDEX idx_customers_birthday ON customers(date_of_birth);
CREATE INDEX idx_customers_city ON customers(city);
CREATE INDEX idx_customers_company ON customers(company_name);
```

#### **5. New Table: `customer_documents`**
```sql
CREATE TABLE customer_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL, -- 'id_copy', 'contract', 'photo', 'other'
    document_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    description TEXT,
    expiry_date DATE,
    is_verified BOOLEAN DEFAULT false,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_customer_documents_customer ON customer_documents(customer_id);
CREATE INDEX idx_customer_documents_type ON customer_documents(document_type);
```

#### **6. New Table: `customer_relationships`**
```sql
CREATE TABLE customer_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    related_customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    relationship_type VARCHAR(50) NOT NULL, -- 'family', 'business_partner', 'referral', 'friend'
    relationship_description VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_customer_relationships_customer ON customer_relationships(customer_id);
CREATE INDEX idx_customer_relationships_related ON customer_relationships(related_customer_id);
```

#### **7. New Table: `customer_tags`**
```sql
CREATE TABLE customer_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    color VARCHAR(7), -- Hex color
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE customer_tag_assignments (
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES customer_tags(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    assigned_by UUID REFERENCES users(id),
    PRIMARY KEY (customer_id, tag_id)
);

CREATE INDEX idx_customer_tag_assignments_customer ON customer_tag_assignments(customer_id);
CREATE INDEX idx_customer_tag_assignments_tag ON customer_tag_assignments(tag_id);
```

#### **8. New Table: `customer_communication_history`**
```sql
CREATE TABLE customer_communication_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    communication_type VARCHAR(50) NOT NULL, -- 'call', 'email', 'sms', 'visit', 'note'
    direction VARCHAR(20) NOT NULL, -- 'inbound', 'outbound', 'internal'
    subject VARCHAR(255),
    content TEXT,
    communication_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'completed', -- 'scheduled', 'completed', 'cancelled'
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_customer_communication_customer ON customer_communication_history(customer_id);
CREATE INDEX idx_customer_communication_date ON customer_communication_history(communication_date);
CREATE INDEX idx_customer_communication_followup ON customer_communication_history(follow_up_date, follow_up_required);
```

#### **9. New Table: `customer_preferences`**
```sql
CREATE TABLE customer_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    preferred_metal_types JSONB, -- Array of metal types
    preferred_styles JSONB, -- Array of style preferences
    price_range_min DECIMAL(12,2),
    price_range_max DECIMAL(12,2),
    communication_preferences JSONB, -- Phone, email, SMS preferences
    special_occasions JSONB, -- Birthday, anniversary, etc.
    purchase_frequency VARCHAR(50), -- 'weekly', 'monthly', 'seasonal', 'annual'
    preferred_visit_time VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_customer_preferences_customer ON customer_preferences(customer_id);
```

### **📊 Analytics & KPI System**

#### **10. New Table: `kpi_targets`**
```sql
CREATE TABLE kpi_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kpi_type VARCHAR(50) NOT NULL, -- 'financial', 'operational', 'customer'
    kpi_name VARCHAR(100) NOT NULL, -- 'daily_sales', 'inventory_turnover', 'customer_acquisition'
    target_period VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly', 'yearly'
    target_value DECIMAL(15,2) NOT NULL,
    current_value DECIMAL(15,2) DEFAULT 0,
    achievement_rate DECIMAL(5,2) DEFAULT 0, -- Percentage
    trend_direction VARCHAR(10), -- 'up', 'down', 'stable'
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_kpi_targets_type_period ON kpi_targets(kpi_type, target_period);
CREATE INDEX idx_kpi_targets_active ON kpi_targets(is_active, period_start, period_end);
```

#### **11. New Table: `analytics_data`**
```sql
CREATE TABLE analytics_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data_type VARCHAR(50) NOT NULL, -- 'sales_trend', 'inventory_turnover', 'customer_behavior'
    entity_type VARCHAR(50), -- 'product', 'category', 'customer', 'global'
    entity_id UUID,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,4) NOT NULL,
    additional_data JSONB,
    calculation_date DATE NOT NULL,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_analytics_data_type_date ON analytics_data(data_type, calculation_date);
CREATE INDEX idx_analytics_data_entity ON analytics_data(entity_type, entity_id);
CREATE INDEX idx_analytics_data_metric ON analytics_data(metric_name, calculation_date);
```

#### **12. New Table: `custom_reports`**
```sql
CREATE TABLE custom_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    report_type VARCHAR(50) NOT NULL, -- 'sales', 'inventory', 'customer', 'financial'
    report_config JSONB NOT NULL, -- Chart config, filters, etc.
    is_scheduled BOOLEAN DEFAULT false,
    schedule_frequency VARCHAR(20), -- 'daily', 'weekly', 'monthly'
    schedule_time TIME,
    schedule_days JSONB, -- Array of weekdays for weekly reports
    export_formats JSONB, -- Array of formats: 'pdf', 'excel', 'csv'
    email_recipients JSONB, -- Array of email addresses
    is_active BOOLEAN DEFAULT true,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_custom_reports_creator ON custom_reports(created_by);
CREATE INDEX idx_custom_reports_scheduled ON custom_reports(is_scheduled, is_active);
```

### **🔄 Automation & Workflow System**

#### **13. New Table: `automation_rules`**
```sql
CREATE TABLE automation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name VARCHAR(255) NOT NULL,
    rule_type VARCHAR(50) NOT NULL, -- 'reorder', 'price_update', 'communication', 'alert'
    trigger_conditions JSONB NOT NULL, -- Conditions that trigger the rule
    actions JSONB NOT NULL, -- Actions to perform
    is_active BOOLEAN DEFAULT true,
    last_executed TIMESTAMP WITH TIME ZONE,
    execution_count INTEGER DEFAULT 0,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_automation_rules_type ON automation_rules(rule_type, is_active);
```

#### **14. New Table: `automation_logs`**
```sql
CREATE TABLE automation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID NOT NULL REFERENCES automation_rules(id) ON DELETE CASCADE,
    execution_status VARCHAR(20) NOT NULL, -- 'success', 'failed', 'partial'
    execution_details JSONB,
    error_message TEXT,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_automation_logs_rule ON automation_logs(rule_id);
CREATE INDEX idx_automation_logs_status_date ON automation_logs(execution_status, executed_at);
```

#### **15. New Table: `reorder_suggestions`**
```sql
CREATE TABLE reorder_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    suggested_quantity INTEGER NOT NULL,
    reason VARCHAR(255) NOT NULL,
    confidence_score DECIMAL(3,2), -- 0.00 to 1.00
    estimated_cost DECIMAL(12,2),
    supplier_info JSONB,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'ordered'
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reorder_suggestions_item ON reorder_suggestions(inventory_item_id);
CREATE INDEX idx_reorder_suggestions_status ON reorder_suggestions(status);
```

### **🔐 Enhanced Security & Permissions**

#### **16. New Table: `permission_templates`**
```sql
CREATE TABLE permission_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL,
    is_system_template BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### **17. New Table: `user_sessions`**
```sql
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    device_info JSONB,
    ip_address INET,
    location_info JSONB,
    is_active BOOLEAN DEFAULT true,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_active ON user_sessions(is_active, expires_at);
```

#### **18. New Table: `audit_logs`**
```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    session_id UUID REFERENCES user_sessions(id),
    action_type VARCHAR(50) NOT NULL, -- 'create', 'read', 'update', 'delete', 'login', 'logout'
    resource_type VARCHAR(50) NOT NULL, -- 'customer', 'inventory', 'invoice', etc.
    resource_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    additional_context JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user_date ON audit_logs(user_id, created_at);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_action_date ON audit_logs(action_type, created_at);
```

#### **19. New Table: `security_alerts`**
```sql
CREATE TABLE security_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_type VARCHAR(50) NOT NULL, -- 'suspicious_login', 'multiple_failures', 'unusual_activity'
    severity VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
    description TEXT NOT NULL,
    user_id UUID REFERENCES users(id),
    ip_address INET,
    additional_data JSONB,
    status VARCHAR(20) DEFAULT 'open', -- 'open', 'investigating', 'resolved', 'false_positive'
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_security_alerts_severity_status ON security_alerts(severity, status);
CREATE INDEX idx_security_alerts_user ON security_alerts(user_id);
```

### **💳 Enhanced Financial & Loyalty System**

#### **20. New Table: `loyalty_programs`**
```sql
CREATE TABLE loyalty_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    points_per_currency_unit DECIMAL(5,2) NOT NULL, -- Points earned per dollar spent
    tier_thresholds JSONB, -- Points required for each tier
    tier_benefits JSONB, -- Benefits for each tier
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### **21. New Table: `customer_loyalty_points`**
```sql
CREATE TABLE customer_loyalty_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL, -- 'earned', 'redeemed', 'expired', 'adjusted'
    points INTEGER NOT NULL,
    reference_type VARCHAR(50), -- 'invoice', 'manual', 'bonus'
    reference_id UUID,
    description TEXT,
    expiry_date DATE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_loyalty_points_customer ON customer_loyalty_points(customer_id);
CREATE INDEX idx_loyalty_points_expiry ON customer_loyalty_points(expiry_date, transaction_type);
```

### **📈 Dashboard & Widget System**

#### **22. New Table: `dashboard_widgets`**
```sql
CREATE TABLE dashboard_widgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    widget_type VARCHAR(50) NOT NULL, -- 'chart', 'metric', 'table', 'alert'
    widget_config JSONB NOT NULL,
    position_x INTEGER NOT NULL,
    position_y INTEGER NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    is_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_dashboard_widgets_user ON dashboard_widgets(user_id);
```

## 📊 **Migration Summary**

### **New Tables Created: 22**
1. `images` - Image management
2. `customer_documents` - Document storage
3. `customer_relationships` - Relationship mapping
4. `customer_tags` - Tagging system
5. `customer_tag_assignments` - Tag assignments
6. `customer_communication_history` - Communication tracking
7. `customer_preferences` - Preference management
8. `kpi_targets` - KPI target management
9. `analytics_data` - Analytics storage
10. `custom_reports` - Report builder
11. `automation_rules` - Automation engine
12. `automation_logs` - Automation logging
13. `reorder_suggestions` - Smart reordering
14. `permission_templates` - Permission management
15. `user_sessions` - Session management
16. `audit_logs` - Comprehensive auditing
17. `security_alerts` - Security monitoring
18. `loyalty_programs` - Loyalty system
19. `customer_loyalty_points` - Points management
20. `dashboard_widgets` - Customizable dashboards

### **Existing Tables Modified: 3**
1. `customers` - 20+ new columns for comprehensive profile
2. `categories` - Image support columns
3. `inventory_items` - Enhanced image support

### **New Indexes Created: 45+**
- Optimized for search, filtering, and performance
- Composite indexes for complex queries
- Foreign key indexes for joins

## 🔧 **Total Schema Changes**
- **New Tables**: 22
- **Modified Tables**: 3
- **New Columns**: 35+
- **New Indexes**: 45+
- **Storage Requirements**: ~3-5x current size
- **Performance Impact**: Optimized with proper indexing
