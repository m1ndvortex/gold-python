# Component Translation Audit Report

Generated on: 2025-08-30T10:43:15.178Z

## Summary

- **Total Components**: 234
- **Translation Keys Found**: 1106
- **Hardcoded Strings Found**: 1073
- **Translation Coverage**: 50.76%

## Components by Category

- **other**: 62 components
- **ui-component**: 44 components
- **settings**: 6 components
- **reports**: 14 components
- **layout**: 5 components
- **invoices**: 7 components
- **inventory**: 23 components
- **customers**: 5 components
- **auth**: 3 components
- **analytics**: 31 components
- **dashboard**: 5 components
- **page**: 29 components

## Components by Type

- **interactive**: 27 components
- **form**: 30 components
- **table**: 23 components
- **card**: 76 components
- **modal**: 20 components
- **utility**: 45 components
- **component**: 7 components
- **chart**: 6 components

## Most Problematic Components

1. **ComprehensiveCustomerForm** (components/customers/ComprehensiveCustomerForm.tsx)
   - Hardcoded strings: 59
   - Translation keys: 0

2. **CheckManager** (components/accounting/CheckManager.tsx)
   - Hardcoded strings: 40
   - Translation keys: 1

3. **InvoiceForm** (components/invoices/InvoiceForm.tsx)
   - Hardcoded strings: 30
   - Translation keys: 1

4. **CustomFieldConfiguration** (components/business-adaptability/CustomFieldConfiguration.tsx)
   - Hardcoded strings: 28
   - Translation keys: 1

5. **Register** (pages/Register.tsx)
   - Hardcoded strings: 28
   - Translation keys: 0

6. **UserManagement** (components/settings/UserManagement.tsx)
   - Hardcoded strings: 26
   - Translation keys: 31

7. **ProductManagement** (components/inventory/ProductManagement.tsx)
   - Hardcoded strings: 26
   - Translation keys: 0

8. **JournalEntryManager** (components/accounting/JournalEntryManager.tsx)
   - Hardcoded strings: 25
   - Translation keys: 2

9. **InvoiceTemplateDesigner** (components/settings/InvoiceTemplateDesigner.tsx)
   - Hardcoded strings: 24
   - Translation keys: 0

10. **InventoryItemForm** (components/inventory/InventoryItemForm.tsx)
   - Hardcoded strings: 24
   - Translation keys: 0

## Detailed Component Analysis

### ComprehensiveCustomerForm (customers)

- **Path**: components/customers/ComprehensiveCustomerForm.tsx
- **Type**: form
- **Translation Keys**: 0
- **Hardcoded Strings**: 59

**Hardcoded Strings by Type**:

*formLabels*:
- "Customer Name *"
- "Phone Number"
- "Email Address"
- "Customer Type"
- "Street Address"
- ... and 17 more

*buttonText*:
- "{isLoading ? ("

*errorMessages*:
- "Customer name is required"
- "Please enter a valid email address"
- "Please enter a valid phone number"
- "National ID must be at least 5 characters"
- "Date of birth cannot be in the future"
- ... and 20 more

*placeholders*:
- "Enter customer name"
- "Select customer type"
- "1234 Main Street, Apt 5B"
- "New York"
- "New York"
- ... and 6 more

**Recommendations**:
- [HIGH] Replace 59 hardcoded strings with translation keys
- [HIGH] Form labels should use translation keys for better accessibility
- [MEDIUM] Button text should be translatable for international users
- [HIGH] Error messages must be translated for user understanding
- [HIGH] Component has no translation keys but contains user-facing text

### CheckManager (other)

- **Path**: components/accounting/CheckManager.tsx
- **Type**: form
- **Translation Keys**: 1
- **Hardcoded Strings**: 40

**Translation Keys Used**:
- `T`

**Hardcoded Strings by Type**:

*formLabels*:
- "Amount Range"
- "Check Number *"
- "Check Type *"
- "Bank Name *"
- "Bank Name (Persian)"
- ... and 21 more

*errorMessages*:
- "text-yellow-600"
- "Invalid check data for creation"
- "Failed to create check"
- "Failed to update check"
- "Failed to update check status"
- ... and 3 more

*placeholders*:
- "Check number"
- "Bank name"
- "Branch name"
- "Check writer"
- "Check recipient"
- ... and 1 more

**Recommendations**:
- [HIGH] Replace 40 hardcoded strings with translation keys
- [HIGH] Form labels should use translation keys for better accessibility
- [HIGH] Error messages must be translated for user understanding

### InvoiceForm (invoices)

- **Path**: components/invoices/InvoiceForm.tsx
- **Type**: form
- **Translation Keys**: 1
- **Hardcoded Strings**: 30

**Translation Keys Used**:
- `piece`

**Hardcoded Strings by Type**:

*formLabels*:
- "Choose Invoice Type *"
- "Gold Invoice"
- "General Invoice"
- "Customer *"
- "Gold Price (per gram) *"
- ... and 8 more

*errorMessages*:
- "Please select invoice type"
- "text-sm text-red-500 mt-1"
- "border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-100/50"
- "text-sm text-red-500 mt-1"
- "p-3 bg-green-100/50 rounded-lg border border-green-200"
- ... and 10 more

*placeholders*:
- "Select a customer"
- "Enter item name"

**Recommendations**:
- [HIGH] Replace 30 hardcoded strings with translation keys
- [HIGH] Form labels should use translation keys for better accessibility
- [HIGH] Error messages must be translated for user understanding

### CustomFieldConfiguration (other)

- **Path**: components/business-adaptability/CustomFieldConfiguration.tsx
- **Type**: card
- **Translation Keys**: 1
- **Hardcoded Strings**: 28

**Translation Keys Used**:
- `\n`

**Hardcoded Strings by Type**:

*formLabels*:
- "Options (one per line)"
- "Minimum Value"
- "Maximum Value"
- "Minimum Length"
- "Maximum Length"
- ... and 15 more

*errorMessages*:
- "Failed to create custom field:"
- "border-red-200 bg-red-50"
- "border-0 shadow-lg"

*placeholders*:
- "Option 1&#10;Option 2&#10;Option 3"
- "Describe what this field is used for"
- "Name shown to users"
- "Placeholder text for input"
- "Additional help for users"

**Recommendations**:
- [HIGH] Replace 28 hardcoded strings with translation keys
- [HIGH] Error messages must be translated for user understanding

### Register (page)

- **Path**: pages/Register.tsx
- **Type**: form
- **Translation Keys**: 0
- **Hardcoded Strings**: 28

**Hardcoded Strings by Type**:

*buttonText*:
- "{showPassword ? ("
- "{showConfirmPassword ? ("
- "{isRegistering ? ("

*errorMessages*:
- "text-red-600"
- "border-red-500 focus:border-red-500 focus:ring-red-500"
- "text-sm text-red-600 flex items-center gap-1"
- "space-y-2"
- "text-red-600"
- ... and 20 more

**Recommendations**:
- [HIGH] Replace 28 hardcoded strings with translation keys
- [MEDIUM] Button text should be translatable for international users
- [HIGH] Error messages must be translated for user understanding
- [HIGH] Component has no translation keys but contains user-facing text

### UserManagement (settings)

- **Path**: components/settings/UserManagement.tsx
- **Type**: form
- **Translation Keys**: 31
- **Hardcoded Strings**: 26

**Translation Keys Used**:
- `settings.user_management`
- `settings.user_management_desc`
- `settings.add_new_user`
- `settings.user`
- `settings.role`
- `common.status`
- `settings.created`
- `common.actions`
- `settings.no_role`
- `common.active`
- `common.inactive`
- `settings.you`
- `settings.previous`
- `settings.next`
- `settings.create_new_user`
- `settings.add_user_desc`
- `settings.username`
- `settings.username_required`
- `settings.enter_username`
- `settings.email`
- `settings.email_required`
- `settings.invalid_email`
- `settings.enter_email`
- `settings.password`
- `settings.password_required`
- `settings.password_min_length`
- `settings.enter_password`
- `settings.select_role`
- `common.cancel`
- `settings.creating`
- `settings.create_user`

**Hardcoded Strings by Type**:

*formLabels*:
- "Active Status"
- "Current Password"
- "New Password"
- "Confirm New Password"

*errorMessages*:
- "text-sm text-destructive"
- "space-y-2"
- "text-sm text-destructive"
- "space-y-2"
- "text-sm text-destructive"
- ... and 11 more

*placeholders*:
- "Enter username"
- "Enter email"
- "Select a role"
- "Enter current password"
- "Enter new password"
- ... and 1 more

**Recommendations**:
- [HIGH] Replace 26 hardcoded strings with translation keys
- [HIGH] Form labels should use translation keys for better accessibility
- [HIGH] Error messages must be translated for user understanding

### ProductManagement (inventory)

- **Path**: components/inventory/ProductManagement.tsx
- **Type**: form
- **Translation Keys**: 0
- **Hardcoded Strings**: 26

**Hardcoded Strings by Type**:

*formLabels*:
- "Product Name *"
- "SKU *"
- "Purchase Price ($) *"
- "Sell Price ($) *"
- "Markup (%)"
- ... and 12 more

*errorMessages*:
- "Failed to upload images:"
- "Failed to save product:"
- "max-w-6xl max-h-[90vh] overflow-hidden"
- "text-sm text-red-600"
- "space-y-2"
- ... and 2 more

*placeholders*:
- "SEO-friendly title for search engines"
- "Brief description for search engine results"

**Recommendations**:
- [HIGH] Replace 26 hardcoded strings with translation keys
- [HIGH] Form labels should use translation keys for better accessibility
- [HIGH] Error messages must be translated for user understanding
- [HIGH] Component has no translation keys but contains user-facing text

### JournalEntryManager (other)

- **Path**: components/accounting/JournalEntryManager.tsx
- **Type**: form
- **Translation Keys**: 2
- **Hardcoded Strings**: 25

**Translation Keys Used**:
- `Enter reversal reason:`
- `T`

**Hardcoded Strings by Type**:

*formLabels*:
- "Source Type"
- "Date Range"
- "Entry Date *"
- "Source Type *"
- "Description *"
- ... and 6 more

*errorMessages*:
- "Journal entry created successfully"
- "Failed to create journal entry"
- "Failed to update journal entry"
- "Failed to post journal entry"
- "Please provide a reversal reason"
- ... and 5 more

*placeholders*:
- "Journal entry description"
- "Reference number"
- "Select account"
- "Line description"

**Recommendations**:
- [HIGH] Replace 25 hardcoded strings with translation keys
- [HIGH] Form labels should use translation keys for better accessibility
- [HIGH] Error messages must be translated for user understanding

### InvoiceTemplateDesigner (settings)

- **Path**: components/settings/InvoiceTemplateDesigner.tsx
- **Type**: form
- **Translation Keys**: 0
- **Hardcoded Strings**: 24

**Hardcoded Strings by Type**:

*formLabels*:
- "Template Name"
- "Page Layout"
- "Page Size"
- "Font Family"
- "Top (px)"
- ... and 5 more

*errorMessages*:
- "Default Template"
- "text-sm text-destructive"
- "space-y-2"
- "text-sm text-destructive"
- "space-y-2"
- ... and 5 more

*placeholders*:
- "Enter template name"
- "Select layout"
- "Select page size"
- "Select font"

**Recommendations**:
- [HIGH] Replace 24 hardcoded strings with translation keys
- [HIGH] Form labels should use translation keys for better accessibility
- [HIGH] Error messages must be translated for user understanding
- [HIGH] Component has no translation keys but contains user-facing text

### InventoryItemForm (inventory)

- **Path**: components/inventory/InventoryItemForm.tsx
- **Type**: form
- **Translation Keys**: 0
- **Hardcoded Strings**: 24

**Hardcoded Strings by Type**:

*formLabels*:
- "Product Image"
- "Item Name *"
- "Category *"
- "Weight (grams) *"
- "Purchase Price ($) *"
- ... and 3 more

*errorMessages*:
- "Failed to save item:"
- "text-sm text-red-600"
- "space-y-2"
- "text-sm text-red-600"
- "grid grid-cols-1 md:grid-cols-3 gap-4"
- ... and 10 more

*placeholders*:
- "Select category"

**Recommendations**:
- [HIGH] Replace 24 hardcoded strings with translation keys
- [HIGH] Form labels should use translation keys for better accessibility
- [HIGH] Error messages must be translated for user understanding
- [HIGH] Component has no translation keys but contains user-facing text

### SMSHistoryTracker (other)

- **Path**: components/sms/SMSHistoryTracker.tsx
- **Type**: table
- **Translation Keys**: 0
- **Hardcoded Strings**: 23

**Hardcoded Strings by Type**:

*formLabels*:
- "Message ID"
- "Campaign ID"
- "Phone Number"
- "Customer ID"
- "Message Content"
- ... and 9 more

*buttonText*:
- "Select All"
- "Deselect All"

*errorMessages*:
- "text-sm font-medium"
- "flex justify-end"
- "text-red-600 text-xs"
- "flex justify-end space-x-2"

*placeholders*:
- "All campaigns"
- "All customers"
- "All statuses"

**Recommendations**:
- [HIGH] Replace 23 hardcoded strings with translation keys
- [MEDIUM] Button text should be translatable for international users
- [HIGH] Error messages must be translated for user understanding
- [HIGH] Component has no translation keys but contains user-facing text

### CacheManagementDashboard (analytics)

- **Path**: components/analytics/CacheManagementDashboard.tsx
- **Type**: card
- **Translation Keys**: 0
- **Hardcoded Strings**: 23

**Hardcoded Strings by Type**:

*errorMessages*:
- "Failed to fetch cache stats"
- "Failed to fetch cache stats"
- "Failed to fetch cache health"
- "Failed to fetch cache health"
- "Failed to fetch performance history"
- ... and 18 more

**Recommendations**:
- [HIGH] Replace 23 hardcoded strings with translation keys
- [HIGH] Error messages must be translated for user understanding
- [HIGH] Component has no translation keys but contains user-facing text

### BusinessSetupFlow (other)

- **Path**: components/business-adaptability/BusinessSetupFlow.tsx
- **Type**: card
- **Translation Keys**: 0
- **Hardcoded Strings**: 23

**Hardcoded Strings by Type**:

*formLabels*:
- "Business Name *"
- "Business Type"
- "Business Address"
- "Phone Number"
- "Email Address"
- ... and 4 more

*buttonText*:
- "Cancel Setup"
- "Next Step"
- "{isSubmitting ? ("

*errorMessages*:
- "Failed to create business configuration"
- "border-red-200 bg-red-50"
- "flex items-center justify-between"

*placeholders*:
- "Enter your business name"
- "Enter your business address"
- "Enter phone number"
- "Enter email address"
- "Select currency"
- ... and 3 more

**Recommendations**:
- [HIGH] Replace 23 hardcoded strings with translation keys
- [MEDIUM] Button text should be translatable for international users
- [HIGH] Error messages must be translated for user understanding
- [HIGH] Component has no translation keys but contains user-facing text

### ModalPopupDemo (page)

- **Path**: pages/ModalPopupDemo.tsx
- **Type**: modal
- **Translation Keys**: 5
- **Hardcoded Strings**: 21

**Translation Keys Used**:
- `default`
- `success`
- `warning`
- `destructive`
- `info`

**Hardcoded Strings by Type**:

*formLabels*:
- "Full Name"
- "Email Address"

*buttonText*:
- "Save Changes"
- "Create Item"
- "Right Sheet"
- "Save Changes"
- "Left Sheet"
- ... and 2 more

*errorMessages*:
- ", description:"
- "border-0 shadow-xl bg-gradient-to-br from-white via-yellow-50/30 to-orange-50/30"

*placeholders*:
- "Enter your name"
- "Enter your email"
- "Enter title"
- "Enter description"
- "Enter name"
- ... and 5 more

**Recommendations**:
- [HIGH] Replace 21 hardcoded strings with translation keys
- [MEDIUM] Button text should be translatable for international users
- [HIGH] Error messages must be translated for user understanding

### FormComponentsDemo (page)

- **Path**: pages/FormComponentsDemo.tsx
- **Type**: form
- **Translation Keys**: 0
- **Hardcoded Strings**: 21

**Hardcoded Strings by Type**:

*buttonText*:
- "Submit Form"

*errorMessages*:
- "space-y-8"
- "label="
- "error="
- "This field is required"

*placeholders*:
- "Password with toggle"
- "Floating input"
- "Small input"
- "Default input"
- "Large input"
- ... and 11 more

**Recommendations**:
- [HIGH] Replace 21 hardcoded strings with translation keys
- [MEDIUM] Button text should be translatable for international users
- [HIGH] Error messages must be translated for user understanding
- [HIGH] Component has no translation keys but contains user-facing text

### ChartConfigPanel (reports)

- **Path**: components/reports/ChartConfigPanel.tsx
- **Type**: chart
- **Translation Keys**: 0
- **Hardcoded Strings**: 20

**Hardcoded Strings by Type**:

*formLabels*:
- "Data Fields"
- "Dimensions (Categories)"
- "Measures (Values)"
- "Visualization Type"
- "Chart Type"
- ... and 11 more

*buttonText*:
- "Add Color"

*placeholders*:
- "Enter chart title"
- "X-axis label"
- "Y-axis label"

**Recommendations**:
- [HIGH] Replace 20 hardcoded strings with translation keys
- [MEDIUM] Button text should be translatable for international users
- [HIGH] Component has no translation keys but contains user-facing text

### ChartOfAccountsManager (other)

- **Path**: components/accounting/ChartOfAccountsManager.tsx
- **Type**: form
- **Translation Keys**: 0
- **Hardcoded Strings**: 19

**Hardcoded Strings by Type**:

*formLabels*:
- "Include Inactive"
- "Account Code *"
- "Account Type *"
- "Account Name *"
- "Account Name (Persian)"
- ... and 5 more

*errorMessages*:
- "text-green-600"
- "Invalid account data for creation"
- "Failed to create account"
- "Failed to update account"
- "Failed to delete account"
- ... and 2 more

*placeholders*:
- "Filter by type"
- "Select parent account"

**Recommendations**:
- [HIGH] Replace 19 hardcoded strings with translation keys
- [HIGH] Form labels should use translation keys for better accessibility
- [HIGH] Error messages must be translated for user understanding
- [HIGH] Component has no translation keys but contains user-facing text

### QRCardCustomizer (other)

- **Path**: components/qr-cards/QRCardCustomizer.tsx
- **Type**: form
- **Translation Keys**: 0
- **Hardcoded Strings**: 18

**Hardcoded Strings by Type**:

*formLabels*:
- "Card Theme"
- "Color Customization"
- "Background Color"
- "Text Color"
- "Accent Color"
- ... and 5 more

*errorMessages*:
- "text-sm text-red-500"
- "space-y-4"
- "text-sm text-red-500 mt-1"
- "text-sm text-red-500 mt-1"
- "text-sm text-red-500 mt-1"
- ... and 2 more

*placeholders*:
- "Enter password"

**Recommendations**:
- [HIGH] Replace 18 hardcoded strings with translation keys
- [HIGH] Form labels should use translation keys for better accessibility
- [HIGH] Error messages must be translated for user understanding
- [HIGH] Component has no translation keys but contains user-facing text

### ChartExportMenu (analytics)

- **Path**: components/analytics/charts/ChartExportMenu.tsx
- **Type**: modal
- **Translation Keys**: 4
- **Hardcoded Strings**: 18

**Translation Keys Used**:
- `png`
- `svg`
- `pdf`
- `csv`

**Hardcoded Strings by Type**:

*formLabels*:
- "Public Access"
- "Allow Comments"
- "Share URL"
- "Width (px)"
- "Height (px)"
- ... and 2 more

*errorMessages*:
- "Chart element not found"
- "No data available for CSV export"
- "Export failed"
- "Export failed:"
- "Unknown error"
- ... and 3 more

*placeholders*:
- "Enter chart title"
- "Enter chart description"
- "Add tag"

**Recommendations**:
- [HIGH] Replace 18 hardcoded strings with translation keys
- [HIGH] Error messages must be translated for user understanding

### UniversalInventoryItemForm (inventory)

- **Path**: components/inventory/UniversalInventoryItemForm.tsx
- **Type**: form
- **Translation Keys**: 71
- **Hardcoded Strings**: 17

**Translation Keys Used**:
- `inventory.select_option`
- `,`
- `inventory.edit_item`
- `inventory.add_item`
- `inventory.basic_info`
- `inventory.attributes`
- `inventory.images`
- `inventory.advanced`
- `inventory.item_name`
- `inventory.name_required`
- `inventory.enter_item_name`
- `inventory.persian_name`
- `inventory.enter_persian_name`
- `inventory.category`
- `inventory.category_required`
- `inventory.select_category`
- `inventory.sku`
- `inventory.sku_required`
- `inventory.auto_generated`
- `inventory.unit_of_measure`
- `inventory.piece`
- `inventory.kilogram`
- `inventory.gram`
- `inventory.liter`
- `inventory.meter`
- `inventory.box`
- `inventory.cost_price`
- `inventory.cost_price_required`
- `inventory.price_positive`
- `inventory.sale_price`
- `inventory.sale_price_required`
- `inventory.suggested`
- `inventory.currency`
- `inventory.current_stock`
- `inventory.stock_required`
- `inventory.stock_positive`
- `inventory.low_stock_threshold`
- `inventory.threshold_positive`
- `inventory.reorder_point`
- `inventory.reorder_positive`
- `inventory.description`
- `inventory.enter_description`
- `inventory.category_attributes`
- `inventory.custom_attributes`
- `inventory.add_attribute`
- `inventory.attribute_name`
- `inventory.enter_name`
- `inventory.attribute_value`
- `inventory.enter_value`
- `inventory.tags`
- `inventory.enter_tags_comma_separated`
- `inventory.tags_help`
- `inventory.product_images`
- `inventory.upload_images`
- `inventory.choose_files`
- `inventory.identifiers`
- `inventory.barcode`
- `inventory.enter_barcode`
- `inventory.generate`
- `inventory.qr_code`
- `inventory.enter_qr_code`
- `inventory.gold_specific`
- `inventory.weight_grams`
- `inventory.advanced_stock`
- `inventory.max_stock_level`
- `inventory.optional`
- `inventory.max_stock_help`
- `common.cancel`
- `common.saving`
- `common.update`
- `common.create`

**Hardcoded Strings by Type**:

*buttonText*:
- "{isSubmitting || isLoading ? ("

*errorMessages*:
- "text-sm text-red-600"
- "Failed to save item:"
- "max-w-4xl max-h-[90vh] overflow-hidden"
- "text-sm text-red-600"
- "space-y-2"
- ... and 11 more

**Recommendations**:
- [HIGH] Replace 17 hardcoded strings with translation keys
- [MEDIUM] Button text should be translatable for international users
- [HIGH] Error messages must be translated for user understanding

## Translation Recommendations

### High Priority Actions

1. **Form Components**: 30 form components need translation
2. **Error Messages**: 101 components have untranslated error messages
3. **Button Text**: 45 components have untranslated button text

### Translation Key Patterns

Based on the analysis, consider creating these translation key patterns:
- `forms.labels.*` for form labels
- `buttons.*` for button text
- `errors.*` for error messages
- `placeholders.*` for input placeholders
- `alerts.*` for alert messages

### Implementation Strategy

1. **Phase 1**: Focus on high-priority components (forms, error messages)
2. **Phase 2**: Address button text and placeholders
3. **Phase 3**: Handle remaining UI text and descriptions

---

*This report was generated automatically by the Component Translation Audit tool.*
