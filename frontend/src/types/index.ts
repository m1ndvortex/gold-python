// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

// User and Authentication Types
export interface User {
  id: string;
  username: string;
  email: string;
  role_id: string;
  is_active: boolean;
  created_at: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: Record<string, boolean>;
  created_at: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user?: User;
}

// Language and RTL Types
export type Language = 'en' | 'ar' | 'fa';
export type Direction = 'ltr' | 'rtl';

export interface LanguageContextType {
  language: Language;
  direction: Direction;
  t: (key: string) => string;
  setLanguage: (lang: Language) => void;
}

// Inventory Types
export interface Category {
  id: string;
  name: string;
  parent_id?: string | null;
  description?: string;
  icon?: string;
  color?: string;
  attributes?: any[];
  category_metadata?: Record<string, any>;
  sort_order?: number;
  is_active?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category_id: string;
  weight_grams: number;
  purchase_price: number;
  sell_price: number;
  stock_quantity: number;
  min_stock_level: number;
  description?: string;
  // Backend can return null for image_url, so allow null explicitly
  image_url?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Inventory Filter Types
export interface InventoryFilters {
  search?: string;
  categories: string[];
  priceRange: {
    min?: number;
    max?: number;
  };
  stockRange: {
    min?: number;
    max?: number;
  };
  weightRange: {
    min?: number;
    max?: number;
  };
  dateRange: {
    from?: Date;
    to?: Date;
  };
  status: ('active' | 'inactive')[];
  stockStatus: ('in_stock' | 'low_stock' | 'out_of_stock')[];
  sortBy: 'name' | 'price' | 'stock' | 'created_at' | 'updated_at';
  sortOrder: 'asc' | 'desc';
}

export interface FilterPreset {
  id: string;
  name: string;
  filters: InventoryFilters;
  isDefault?: boolean;
  createdAt: string;
}

export interface CategoryNode extends Category {
  children: CategoryNode[];
  level: number;
  productCount?: number;
}

// Customer Types
export interface Customer {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  
  // Address fields (backward compatibility)
  address?: string | null;  // Deprecated, use structured address fields
  
  // Comprehensive address fields
  street_address?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
  
  // Personal information
  national_id?: string | null;
  date_of_birth?: string | null;
  age?: number | null;
  gender?: string | null;  // male, female, other, prefer_not_to_say
  nationality?: string | null;
  occupation?: string | null;
  
  // Emergency contact
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  emergency_contact_relationship?: string | null;
  
  // Additional information
  notes?: string | null;
  tags?: string[] | null;
  custom_fields?: Record<string, any> | null;
  preferences?: Record<string, any> | null;
  
  // Business-related fields
  customer_type?: string | null;  // retail, wholesale, corporate
  credit_limit?: number | null;
  payment_terms?: number | null;  // Days for payment
  discount_percentage?: number | null;
  tax_exempt?: boolean | null;
  tax_id?: string | null;
  
  // Existing fields
  total_purchases: number;
  current_debt: number;
  last_purchase_date?: string | null;
  
  // Status fields
  is_active?: boolean | null;
  blacklisted?: boolean | null;
  blacklist_reason?: string | null;
  
  created_at: string;
  updated_at: string;
}

export interface CustomerCreate {
  name: string;
  phone?: string;
  email?: string;
  
  // Address fields (backward compatibility)
  address?: string;  // Deprecated, use structured address fields
  
  // Comprehensive address fields
  street_address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  
  // Personal information
  national_id?: string;
  date_of_birth?: string;
  age?: number;
  gender?: string;  // male, female, other, prefer_not_to_say
  nationality?: string;
  occupation?: string;
  
  // Emergency contact
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  
  // Additional information
  notes?: string;
  tags?: string[];
  custom_fields?: Record<string, any>;
  preferences?: Record<string, any>;
  
  // Business-related fields
  customer_type?: string;  // retail, wholesale, corporate
  credit_limit?: number;
  payment_terms?: number;  // Days for payment
  discount_percentage?: number;
  tax_exempt?: boolean;
  tax_id?: string;
}

export interface CustomerUpdate {
  name?: string;
  phone?: string;
  email?: string;
  
  // Address fields (backward compatibility)
  address?: string;  // Deprecated, use structured address fields
  
  // Comprehensive address fields
  street_address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  
  // Personal information
  national_id?: string;
  date_of_birth?: string;
  age?: number;
  gender?: string;  // male, female, other, prefer_not_to_say
  nationality?: string;
  occupation?: string;
  
  // Emergency contact
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  
  // Additional information
  notes?: string;
  tags?: string[];
  custom_fields?: Record<string, any>;
  preferences?: Record<string, any>;
  
  // Business-related fields
  customer_type?: string;  // retail, wholesale, corporate
  credit_limit?: number;
  payment_terms?: number;  // Days for payment
  discount_percentage?: number;
  tax_exempt?: boolean;
  tax_id?: string;
  
  // Status fields
  is_active?: boolean;
  blacklisted?: boolean;
  blacklist_reason?: string;
}

// Payment Types
export interface Payment {
  id: string;
  customer_id: string;
  invoice_id?: string;
  amount: number;
  payment_method: string;
  description?: string;
  payment_date: string;
  created_at: string;
}

export interface PaymentCreate {
  customer_id: string;
  invoice_id?: string;
  amount: number;
  payment_method: string;
  description?: string;
}

export interface CustomerWithPayments extends Customer {
  payments: Payment[];
}

export interface CustomerDebtSummary {
  customer_id: string;
  customer_name: string;
  total_debt: number;
  total_payments: number;
  last_payment_date?: string;
  payment_count: number;
}

export interface CustomerSearchFilters {
  name?: string;
  phone?: string;
  email?: string;
  has_debt?: boolean;
  min_debt?: number;
  max_debt?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface DebtHistoryEntry {
  type: 'invoice' | 'payment';
  id: string;
  date: string;
  amount: number;
  description: string;
  running_balance: number;
}

export interface CustomerDebtHistory {
  customer_id: string;
  current_debt: number;
  debt_history: DebtHistoryEntry[];
}

// Invoice Types
export interface InvoiceItem {
  id: string;
  invoice_id: string;
  inventory_item_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  weight_grams: number;
  inventory_item?: InventoryItem;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: string;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  gold_price_per_gram: number;
  labor_cost_percentage: number;
  profit_percentage: number;
  vat_percentage: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceWithDetails extends Invoice {
  customer?: Customer;
  invoice_items: InvoiceItem[];
  payments: Payment[];
}

// Accounting Types
export interface AccountingEntry {
  id: string;
  entry_type: 'income' | 'expense' | 'cash' | 'bank' | 'gold_weight';
  category: string;
  amount?: number;
  weight_grams?: number;
  description: string;
  reference_id?: string;
  reference_type?: string;
  transaction_date: string;
  created_at: string;
}

// Settings Types
export interface CompanySettings {
  id: string;
  company_name?: string;
  company_logo_url?: string;
  company_address?: string;
  default_gold_price: number;
  default_labor_percentage: number;
  default_profit_percentage: number;
  default_vat_percentage: number;
  invoice_template?: Record<string, any>;
  updated_at: string;
}

export interface CompanySettingsUpdate {
  company_name?: string;
  company_logo_url?: string;
  company_address?: string;
  default_gold_price?: number;
  default_labor_percentage?: number;
  default_profit_percentage?: number;
  default_vat_percentage?: number;
}

export interface GoldPriceConfig {
  current_price: number;
  auto_update_enabled: boolean;
  api_source?: string;
  last_updated?: string;
  update_frequency_hours?: number;
}

export interface GoldPriceUpdate {
  price: number;
}

export interface InvoiceTemplateField {
  name: string;
  label: string;
  type: string;
  position: { x: number; y: number };
  style: Record<string, any>;
}

export interface InvoiceTemplateSection {
  name: string;
  fields: InvoiceTemplateField[];
  position: { x: number; y: number };
  style: Record<string, any>;
}

export interface InvoiceTemplate {
  name: string;
  layout: string;
  page_size: string;
  margins: { top: number; right: number; bottom: number; left: number };
  header: InvoiceTemplateSection;
  body: InvoiceTemplateSection;
  footer: InvoiceTemplateSection;
  styles: Record<string, any>;
}

export interface InvoiceTemplateUpdate {
  template: InvoiceTemplate;
}

export interface UserUpdate {
  username?: string;
  email?: string;
  role_id?: string;
  is_active?: boolean;
}

export interface UserPasswordUpdate {
  current_password: string;
  new_password: string;
}

export interface UserManagement extends User {
  role?: Role;
}

export interface UserListResponse {
  users: UserManagement[];
  total: number;
  page: number;
  per_page: number;
}

export interface UserCreate {
  username: string;
  email: string;
  password: string;
  role_id: string;
}

export interface RoleUpdate {
  name?: string;
  description?: string;
  permissions?: Record<string, any>;
}

export interface PermissionCategory {
  name: string;
  label: string;
  permissions: Array<{ key: string; label: string }>;
}

export interface PermissionStructure {
  categories: PermissionCategory[];
}

export interface RoleWithUsers extends Role {
  users: User[];
}

export interface RoleAssignment {
  user_id: string;
  role_id: string;
}

export interface RoleCreate {
  name: string;
  description?: string;
  permissions: Record<string, any>;
}

export interface SystemSettings {
  company: CompanySettings;
  gold_price: GoldPriceConfig;
  invoice_template: InvoiceTemplate;
  permissions: PermissionStructure;
}

export interface SettingsUpdateResponse {
  success: boolean;
  message: string;
  updated_fields?: string[];
}

// Dashboard Types
export interface DashboardSummary {
  total_sales_today: number;
  total_sales_week: number;
  total_sales_month: number;
  total_inventory_value: number;
  total_customer_debt: number;
  current_gold_price: number;
  gold_price_change: number;
  low_stock_count: number;
  unpaid_invoices_count: number;
}

export interface SalesChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
  }[];
}

export interface CategorySalesData {
  category_name: string;
  total_sales: number;
  total_quantity: number;
  percentage: number;
}

export interface TopProduct {
  item_id: string;
  item_name: string;
  category_name: string;
  total_quantity: number;
  total_revenue: number;
  transaction_count: number;
  average_price: number;
}

export interface LowStockItem {
  item_id: string;
  item_name: string;
  category_name: string;
  current_stock: number;
  min_stock_level: number;
  shortage: number;
  unit_price: number;
  status: 'critical' | 'warning';
  urgency_score: number;
}

export interface UnpaidInvoice {
  invoice_id: string;
  invoice_number: string;
  customer_name: string;
  total_amount: number;
  remaining_amount: number;
  days_overdue: number;
  created_at: string;
}

export interface DashboardChartData {
  sales_overview: SalesChartData;
  category_sales: CategorySalesData[];
  top_products: TopProduct[];
}

export interface DashboardAlerts {
  low_stock_items: LowStockItem[];
  unpaid_invoices: UnpaidInvoice[];
}

// Accounting Ledger Types
export interface LedgerEntry {
  id: string;
  entry_type: string;
  category: string;
  amount?: number;
  weight_grams?: number;
  description: string;
  reference_id?: string;
  reference_type?: string;
  transaction_date: string;
  created_at: string;
}

export interface IncomeLedgerEntry {
  id: string;
  invoice_id: string;
  invoice_number: string;
  customer_name: string;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  payment_status: string;
  transaction_date: string;
  category: string;
}

export interface ExpenseLedgerEntry {
  id: string;
  category: string;
  amount: number;
  description: string;
  transaction_date: string;
  reference_type?: string;
}

export interface ExpenseEntryCreate {
  category: string;
  amount: number;
  description: string;
  transaction_date?: string;
}

export interface CashBankLedgerEntry {
  id: string;
  transaction_type: string; // 'cash_in', 'cash_out', 'bank_deposit', 'bank_withdrawal'
  amount: number;
  description: string;
  payment_method: string;
  reference_id?: string;
  reference_type?: string;
  transaction_date: string;
}

export interface GoldWeightLedgerEntry {
  id: string;
  transaction_type: string; // 'purchase', 'sale', 'adjustment'
  weight_grams: number;
  description: string;
  reference_id?: string;
  reference_type?: string;
  transaction_date: string;
  current_valuation?: number;
}

export interface ProfitLossAnalysis {
  period_start: string;
  period_end: string;
  total_revenue: number;
  total_expenses: number;
  gross_profit: number;
  net_profit: number;
  profit_margin: number;
  top_performing_categories: Array<{
    category: string;
    revenue: number;
  }>;
  revenue_breakdown: Record<string, number>;
  expense_breakdown: Record<string, number>;
}

export interface DebtTrackingEntry {
  customer_id: string;
  customer_name: string;
  customer_phone?: string;
  total_debt: number;
  total_invoices: number;
  last_purchase_date?: string;
  last_payment_date?: string;
  payment_history_count: number;
}

export interface LedgerSummary {
  total_income: number;
  total_expenses: number;
  total_cash_flow: number;
  total_gold_weight: number;
  total_customer_debt: number;
  net_profit: number;
}

export interface LedgerFilters {
  start_date?: string;
  end_date?: string;
  category?: string;
  customer_id?: string;
  payment_status?: string;
  transaction_type?: string;
  payment_method?: string;
  min_debt?: number;
  max_debt?: number;
  customer_name?: string;
}

// SMS Types
export interface SMSTemplate {
  id: string;
  name: string;
  template_type: 'promotional' | 'debt_reminder' | 'general';
  message_template: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SMSTemplateCreate {
  name: string;
  template_type: 'promotional' | 'debt_reminder' | 'general';
  message_template: string;
  is_active?: boolean;
}

export interface SMSTemplateUpdate {
  name?: string;
  template_type?: 'promotional' | 'debt_reminder' | 'general';
  message_template?: string;
  is_active?: boolean;
}

export interface SMSTemplatePreview {
  template_id: string;
  customer_id: string;
  preview_message: string;
}

export interface SMSCampaign {
  id: string;
  name: string;
  template_id?: string;
  message_content: string;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  status: 'pending' | 'sending' | 'completed' | 'failed';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface SMSCampaignCreate {
  name: string;
  template_id?: string;
  message_content: string;
  customer_ids: string[];
}

export interface SMSCampaignWithDetails extends SMSCampaign {
  template?: SMSTemplate;
  messages: SMSMessage[];
  creator?: User;
}

export interface SMSMessage {
  id: string;
  campaign_id: string;
  customer_id: string;
  phone_number: string;
  message_content: string;
  status: 'pending' | 'sent' | 'failed' | 'delivered';
  delivery_status?: 'pending' | 'delivered' | 'failed' | 'expired';
  gateway_message_id?: string;
  error_message?: string;
  retry_count: number;
  max_retries: number;
  sent_at?: string;
  delivered_at?: string;
  created_at: string;
}

export interface SMSMessageWithDetails extends SMSMessage {
  customer?: Customer;
  campaign?: SMSCampaign;
}

export interface SMSBatchRequest {
  campaign_name: string;
  template_id?: string;
  message_content: string;
  customer_ids: string[];
}

export interface SMSBatchResponse {
  campaign_id: string;
  total_recipients: number;
  status: string;
  message: string;
}

export interface SMSRetryRequest {
  message_ids: string[];
  max_retries?: number;
}

export interface SMSRetryResponse {
  total_messages: number;
  retried_messages: number;
  skipped_messages: number;
  message: string;
}

export interface SMSDeliveryStatusUpdate {
  gateway_message_id: string;
  delivery_status: string;
  delivered_at?: string;
  error_message?: string;
}

export interface SMSHistoryFilters {
  campaign_id?: string;
  customer_id?: string;
  status?: string;
  page?: number;
  per_page?: number;
}

export interface SMSHistoryResponse {
  messages: SMSMessageWithDetails[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface SMSCampaignStats {
  campaign_id: string;
  campaign_name: string;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  pending_count: number;
  delivered_count: number;
  success_rate: number;
  delivery_rate: number;
  created_at: string;
  status: string;
}

export interface SMSOverallStats {
  total_campaigns: number;
  total_messages_sent: number;
  total_messages_delivered: number;
  overall_success_rate: number;
  overall_delivery_rate: number;
  recent_campaigns: SMSCampaignStats[];
}

export interface SMSScheduleRequest {
  campaign_name: string;
  template_id?: string;
  message_content: string;
  customer_ids: string[];
  scheduled_at: string;
}

export interface SMSScheduledCampaign extends SMSCampaign {
  scheduled_at: string;
  is_scheduled: boolean;
}