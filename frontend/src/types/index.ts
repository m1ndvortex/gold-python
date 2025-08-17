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
  user: User;
}

// Inventory Types
export interface Category {
  id: string;
  name: string;
  parent_id?: string;
  description?: string;
  created_at: string;
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
  image_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Customer Types
export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  total_purchases: number;
  current_debt: number;
  last_purchase_date?: string;
  created_at: string;
  updated_at: string;
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
  items: InvoiceItem[];
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

// Language and RTL Types
export type Language = 'en' | 'fa';
export type Direction = 'ltr' | 'rtl';

export interface LanguageContextType {
  language: Language;
  direction: Direction;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}