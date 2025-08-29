# Manual Test Plan for Dual Invoice System Frontend Interface

## Test Checklist for Task 8 Implementation

### ✅ 1. Invoice Type Selection Interface
- [ ] Navigate to Invoices page
- [ ] Click "Create New Invoice" button
- [ ] Verify invoice type selection shows two options:
  - [ ] Gold Invoice with Gem icon and Persian text description
  - [ ] General Invoice with Package icon and description
- [ ] Verify default selection is "General"
- [ ] Test switching between Gold and General types
- [ ] Verify visual feedback when selecting each type

### ✅ 2. Conditional Field Display
- [ ] Select "Gold" invoice type
- [ ] Verify Gold-specific fields appear:
  - [ ] Gold Price (per gram) field
  - [ ] اجرت - Labor Cost (%) field
  - [ ] سود - Profit (%) field  
  - [ ] مالیات - VAT (%) field
- [ ] Switch to "General" invoice type
- [ ] Verify Gold-specific fields are hidden
- [ ] Verify item fields show:
  - [ ] Unit Price field for General invoices
  - [ ] Weight (grams) field for Gold invoices

### ✅ 3. Invoice Workflow Interface
- [ ] Verify "Invoice Workflow" section exists
- [ ] Check "Require approval before affecting inventory stock" checkbox
- [ ] Verify Notes field is available
- [ ] Test workflow configuration options

### ✅ 4. Automatic Inventory Integration
- [ ] In item selection, choose "Select from Inventory"
- [ ] Verify inventory items show with stock quantities
- [ ] Select an item and verify auto-fill of:
  - [ ] Item name
  - [ ] Unit price (for General)
  - [ ] Weight (for Gold items)
- [ ] Test stock validation:
  - [ ] Enter quantity within stock - should show green "Stock available" alert
  - [ ] Enter quantity exceeding stock - should show red "Insufficient stock" alert

### ✅ 5. Manual Price Override Interface
- [ ] Select "Manual Entry" from item dropdown
- [ ] Verify ability to manually enter:
  - [ ] Item name
  - [ ] Unit price (General invoices)
  - [ ] Weight (Gold invoices)
  - [ ] Quantity
- [ ] Test manual entry without inventory selection

### ✅ 6. Comprehensive Invoice Item Management
- [ ] Add multiple items to invoice
- [ ] Test "Add Item" button functionality
- [ ] Test "Remove Item" button (should be disabled when only 1 item)
- [ ] Verify item images display (if available)
- [ ] Test proper item selection from inventory

### ✅ 7. Invoice Validation and Error Handling
- [ ] Try to submit without customer - should show validation error
- [ ] Try to submit Gold invoice without weight - should show validation error
- [ ] Try to submit without item name - should show validation error
- [ ] Verify clear error messages for all validation rules

### ✅ 8. Real-time Calculation and Summary
- [ ] Fill out a Gold invoice with valid data
- [ ] Verify calculation summary shows:
  - [ ] Subtotal
  - [ ] اجرت - Labor Cost
  - [ ] سود - Profit
  - [ ] مالیات - VAT
  - [ ] Grand Total
  - [ ] Total Weight (for Gold invoices)
- [ ] Fill out a General invoice
- [ ] Verify calculation summary shows:
  - [ ] Subtotal
  - [ ] Grand Total (no Gold-specific fields)

### ✅ 9. Invoice List with Type Filtering
- [ ] Navigate to invoice list
- [ ] Verify "All Types" filter dropdown exists
- [ ] Test filtering by:
  - [ ] Gold Invoices
  - [ ] General Invoices
- [ ] Verify invoice type badges show in list:
  - [ ] Gold badge (amber/yellow)
  - [ ] General badge (blue)

### ✅ 10. Navigation and User Workflows
- [ ] Verify button text updates based on invoice type:
  - [ ] "Create Gold Invoice" for Gold type
  - [ ] "Create General Invoice" for General type
- [ ] Test complete invoice creation workflow
- [ ] Verify proper navigation between pages

### ✅ 11. Backend Integration Testing
- [ ] Create a Gold invoice and submit
- [ ] Verify successful creation with proper API call
- [ ] Create a General invoice and submit
- [ ] Verify successful creation with proper API call
- [ ] Check that inventory stock is properly affected
- [ ] Test approval workflow if enabled

### ✅ 12. Error Handling and User Feedback
- [ ] Test network error scenarios
- [ ] Verify proper error messages display
- [ ] Test loading states during API calls
- [ ] Verify success messages after invoice creation

### ✅ 13. Responsive Design
- [ ] Test on desktop (1920x1080)
- [ ] Test on tablet (768x1024)
- [ ] Test on mobile (375x667)
- [ ] Verify all elements are properly responsive

### ✅ 14. Accessibility
- [ ] Test keyboard navigation
- [ ] Verify proper labels and ARIA attributes
- [ ] Test with screen reader (if available)
- [ ] Check color contrast ratios

## Expected Results

### Gold Invoice Creation:
1. User selects Gold invoice type
2. Gold-specific fields appear with Persian labels
3. Items require weight input
4. Calculation shows labor cost, profit, VAT breakdown
5. Total weight is displayed
6. Invoice is created with type "gold"

### General Invoice Creation:
1. User selects General invoice type
2. Standard fields appear
3. Items require unit price input
4. Simple calculation shows subtotal and total
5. Invoice is created with type "general"

### Stock Integration:
1. Real-time stock validation
2. Visual alerts for stock status
3. Automatic inventory deduction on approval
4. Stock restoration on cancellation

### User Experience:
1. Smooth transitions between invoice types
2. Clear visual indicators and feedback
3. Intuitive workflow with proper validation
4. Professional appearance matching design system

## Test Environment Setup

1. Ensure Docker containers are running:
   ```bash
   docker-compose up -d
   ```

2. Access frontend at: http://localhost:3000

3. Ensure backend is accessible at: http://localhost:8000

4. Have test data available:
   - At least 2 customers
   - At least 5 inventory items with stock
   - Mix of gold and general items

## Pass Criteria

- All checklist items must pass
- No console errors during normal operation
- Proper API integration with backend
- Responsive design works on all screen sizes
- Accessibility standards are met
- User experience is smooth and intuitive

## Notes

- Test both happy path and error scenarios
- Pay attention to Persian text rendering
- Verify gradient design system consistency
- Check that all animations and transitions work smoothly
- Ensure proper form validation and error handling