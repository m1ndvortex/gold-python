import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { InvoiceList } from '../components/invoices/InvoiceList';
import { InvoiceForm } from '../components/invoices/InvoiceForm';
import { PaymentForm } from '../components/invoices/PaymentForm';
import { Invoices } from '../pages/Invoices';

// Production test configuration
const BACKEND_URL = process.env.REACT_APP_API_URL || 'http://backend:8000';
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

// Test wrapper with authentication context
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

// Authentication helper
class AuthHelper {
  private static token: string | null = null;

  static async getAuthToken(): Promise<string> {
    if (this.token) {
      return this.token;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ADMIN_CREDENTIALS),
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status}`);
      }

      const data = await response.json();
      this.token = data.access_token;
      
      // Store token in localStorage for components to use
      localStorage.setItem('access_token', this.token!);
      
      return this.token!;
    } catch (error) {
      throw new Error(`Failed to authenticate: ${error}`);
    }
  }

  static async makeAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const token = await this.getAuthToken();
    
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  }

  static clearToken(): void {
    this.token = null;
    localStorage.removeItem('access_token');
  }
}

// API helpers for testing
class TestDataHelper {
  static async createTestCustomer(): Promise<any> {
    const customerData = {
      name: `Test Customer ${Date.now()}`,
      phone: '+1234567890',
      email: `test${Date.now()}@example.com`,
      address: '123 Test Street, Test City'
    };

    const response = await AuthHelper.makeAuthenticatedRequest(
      `${BACKEND_URL}/customers/`,
      {
        method: 'POST',
        body: JSON.stringify(customerData),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to create test customer: ${response.status}`);
    }

    return response.json();
  }

  static async createTestInventoryItem(): Promise<any> {
    // First get or create a category
    const categoriesResponse = await AuthHelper.makeAuthenticatedRequest(
      `${BACKEND_URL}/inventory/categories/`
    );
    
    let categories = [];
    if (categoriesResponse.ok) {
      categories = await categoriesResponse.json();
    }

    let categoryId = null;
    if (categories.length > 0) {
      categoryId = categories[0].id;
    } else {
      // Create a test category
      const categoryData = {
        name: 'Test Category',
        description: 'Test category for testing'
      };
      
      const categoryResponse = await AuthHelper.makeAuthenticatedRequest(
        `${BACKEND_URL}/inventory/categories/`,
        {
          method: 'POST',
          body: JSON.stringify(categoryData),
        }
      );
      
      if (categoryResponse.ok) {
        const category = await categoryResponse.json();
        categoryId = category.id;
      }
    }

    const itemData = {
      name: `Test Gold Ring ${Date.now()}`,
      category_id: categoryId,
      weight_grams: 5.5,
      purchase_price: 1200,
      sell_price: 1500,
      stock_quantity: 10,
      min_stock_level: 2,
      description: 'Test gold ring for testing'
    };

    const response = await AuthHelper.makeAuthenticatedRequest(
      `${BACKEND_URL}/inventory/items/`,
      {
        method: 'POST',
        body: JSON.stringify(itemData),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to create test inventory item: ${response.status}`);
    }

    return response.json();
  }

  static async cleanupTestData(invoiceId?: string, customerId?: string, itemId?: string): Promise<void> {
    try {
      // Delete invoice if exists
      if (invoiceId) {
        await AuthHelper.makeAuthenticatedRequest(
          `${BACKEND_URL}/invoices/${invoiceId}`,
          { method: 'DELETE' }
        );
      }

      // Delete customer if exists
      if (customerId) {
        await AuthHelper.makeAuthenticatedRequest(
          `${BACKEND_URL}/customers/${customerId}`,
          { method: 'DELETE' }
        );
      }

      // Delete inventory item if exists
      if (itemId) {
        await AuthHelper.makeAuthenticatedRequest(
          `${BACKEND_URL}/inventory/items/${itemId}`,
          { method: 'DELETE' }
        );
      }
    } catch (error) {
      console.warn('Cleanup failed:', error);
    }
  }
}

describe('Invoice Production Tests - Authenticated', () => {
  // Increase timeout for production tests
  jest.setTimeout(60000);

  beforeAll(async () => {
    // Wait for backend to be ready
    let retries = 0;
    const maxRetries = 30;
    
    while (retries < maxRetries) {
      try {
        const response = await fetch(`${BACKEND_URL}/health`);
        if (response.ok) {
          console.log('✅ Backend is ready');
          break;
        }
      } catch (error) {
        retries++;
        if (retries === maxRetries) {
          throw new Error('❌ Backend not ready after 30 attempts');
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Authenticate and verify token
    try {
      const token = await AuthHelper.getAuthToken();
      expect(token).toBeDefined();
      console.log('✅ Authentication successful');
    } catch (error) {
      throw new Error(`❌ Authentication failed: ${error}`);
    }
  });

  afterAll(() => {
    AuthHelper.clearToken();
  });

  describe('Authentication and Authorization', () => {
    test('should authenticate with admin credentials', async () => {
      const token = await AuthHelper.getAuthToken();
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    test('should verify token with /auth/verify endpoint', async () => {
      const response = await AuthHelper.makeAuthenticatedRequest(`${BACKEND_URL}/auth/verify`);
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      expect(data.valid).toBe(true);
      expect(data.username).toBe('admin');
    });

    test('should get current user info', async () => {
      const response = await AuthHelper.makeAuthenticatedRequest(`${BACKEND_URL}/auth/me`);
      expect(response.ok).toBe(true);
      
      const user = await response.json();
      expect(user.username).toBe('admin');
      expect(user.is_active).toBe(true);
      expect(user.role).toBeDefined();
      expect(user.role.name).toBe('Owner');
    });
  });

  describe('Invoice API Integration', () => {
    let testCustomer: any;
    let testItem: any;
    let createdInvoice: any;

    beforeAll(async () => {
      // Create test data
      testCustomer = await TestDataHelper.createTestCustomer();
      testItem = await TestDataHelper.createTestInventoryItem();
      
      console.log('✅ Test data created:', {
        customer: testCustomer.name,
        item: testItem.name
      });
    });

    afterAll(async () => {
      // Cleanup test data
      await TestDataHelper.cleanupTestData(
        createdInvoice?.id,
        testCustomer?.id,
        testItem?.id
      );
      console.log('✅ Test data cleaned up');
    });

    test('should calculate invoice preview', async () => {
      const invoiceData = {
        customer_id: testCustomer.id,
        gold_price_per_gram: 2500,
        labor_cost_percentage: 10,
        profit_percentage: 15,
        vat_percentage: 9,
        items: [
          {
            inventory_item_id: testItem.id,
            quantity: 1,
            weight_grams: testItem.weight_grams,
          }
        ]
      };

      const response = await AuthHelper.makeAuthenticatedRequest(
        `${BACKEND_URL}/invoices/calculate`,
        {
          method: 'POST',
          body: JSON.stringify(invoiceData),
        }
      );

      expect(response.ok).toBe(true);
      
      const calculation = await response.json();
      expect(calculation).toHaveProperty('items');
      expect(calculation).toHaveProperty('subtotal');
      expect(calculation).toHaveProperty('grand_total');
      expect(calculation.grand_total).toBeGreaterThan(0);
      expect(calculation.items).toHaveLength(1);
      
      console.log('✅ Invoice calculation:', {
        subtotal: calculation.subtotal,
        grand_total: calculation.grand_total
      });
    });

    test('should create complete invoice', async () => {
      const invoiceData = {
        customer_id: testCustomer.id,
        gold_price_per_gram: 2500,
        labor_cost_percentage: 10,
        profit_percentage: 15,
        vat_percentage: 9,
        items: [
          {
            inventory_item_id: testItem.id,
            quantity: 1,
            weight_grams: testItem.weight_grams,
          }
        ]
      };

      const response = await AuthHelper.makeAuthenticatedRequest(
        `${BACKEND_URL}/invoices/`,
        {
          method: 'POST',
          body: JSON.stringify(invoiceData),
        }
      );

      expect(response.ok).toBe(true);
      
      createdInvoice = await response.json();
      expect(createdInvoice).toHaveProperty('id');
      expect(createdInvoice).toHaveProperty('invoice_number');
      expect(createdInvoice.invoice_number).toMatch(/^INV-\d{6}-\d{4}$/);
      expect(createdInvoice.status).toBe('pending');
      expect(createdInvoice.customer_id).toBe(testCustomer.id);
      expect(createdInvoice.total_amount).toBeGreaterThan(0);
      expect(createdInvoice.remaining_amount).toBe(createdInvoice.total_amount);
      
      console.log('✅ Invoice created:', {
        number: createdInvoice.invoice_number,
        total: createdInvoice.total_amount
      });
    });

    test('should retrieve invoice with details', async () => {
      expect(createdInvoice).toBeDefined();
      
      const response = await AuthHelper.makeAuthenticatedRequest(
        `${BACKEND_URL}/invoices/${createdInvoice.id}`
      );

      expect(response.ok).toBe(true);
      
      const invoice = await response.json();
      expect(invoice.id).toBe(createdInvoice.id);
      expect(invoice).toHaveProperty('customer');
      expect(invoice).toHaveProperty('invoice_items');
      expect(invoice).toHaveProperty('payments');
      expect(invoice.customer.id).toBe(testCustomer.id);
      expect(invoice.invoice_items).toHaveLength(1);
      expect(invoice.invoice_items[0].inventory_item.id).toBe(testItem.id);
    });

    test('should add payment to invoice', async () => {
      expect(createdInvoice).toBeDefined();
      
      const paymentAmount = Math.min(500, createdInvoice.total_amount);
      const paymentData = {
        amount: paymentAmount,
        payment_method: 'cash',
        description: 'Test payment'
      };

      const response = await AuthHelper.makeAuthenticatedRequest(
        `${BACKEND_URL}/invoices/${createdInvoice.id}/payments`,
        {
          method: 'POST',
          body: JSON.stringify(paymentData),
        }
      );

      expect(response.ok).toBe(true);
      
      const payment = await response.json();
      expect(payment.amount).toBe(paymentAmount);
      expect(payment.payment_method).toBe('cash');
      expect(payment.invoice_id).toBe(createdInvoice.id);
      
      // Verify invoice was updated
      const invoiceResponse = await AuthHelper.makeAuthenticatedRequest(
        `${BACKEND_URL}/invoices/${createdInvoice.id}`
      );
      const updatedInvoice = await invoiceResponse.json();
      expect(updatedInvoice.paid_amount).toBe(paymentAmount);
      expect(updatedInvoice.remaining_amount).toBe(createdInvoice.total_amount - paymentAmount);
      
      console.log('✅ Payment added:', {
        amount: paymentAmount,
        remaining: updatedInvoice.remaining_amount
      });
    });

    test('should list invoices with filters', async () => {
      const response = await AuthHelper.makeAuthenticatedRequest(
        `${BACKEND_URL}/invoices/?customer_id=${testCustomer.id}`
      );

      expect(response.ok).toBe(true);
      
      const invoices = await response.json();
      expect(Array.isArray(invoices)).toBe(true);
      expect(invoices.length).toBeGreaterThan(0);
      
      const ourInvoice = invoices.find((inv: any) => inv.id === createdInvoice.id);
      expect(ourInvoice).toBeDefined();
    });

    test('should get invoice summary statistics', async () => {
      const response = await AuthHelper.makeAuthenticatedRequest(
        `${BACKEND_URL}/invoices/reports/summary`
      );

      expect(response.ok).toBe(true);
      
      const summary = await response.json();
      expect(summary).toHaveProperty('total_invoices');
      expect(summary).toHaveProperty('total_amount');
      expect(summary).toHaveProperty('total_paid');
      expect(summary).toHaveProperty('total_remaining');
      expect(summary).toHaveProperty('status_breakdown');
      expect(typeof summary.total_invoices).toBe('number');
      expect(summary.total_invoices).toBeGreaterThan(0);
    });
  });

  describe('Frontend Components with Real Backend', () => {
    test('should render Invoices page and load data', async () => {
      render(
        <TestWrapper>
          <Invoices />
        </TestWrapper>
      );

      // Check page renders
      expect(screen.getByText('Invoice Management')).toBeInTheDocument();
      expect(screen.getByText('Create Invoice')).toBeInTheDocument();

      // Wait for data to load
      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      }, { timeout: 10000 });

      // Should show summary cards
      expect(screen.getByText('Total Invoices')).toBeInTheDocument();
      expect(screen.getByText('Total Amount')).toBeInTheDocument();
    });

    test('should render InvoiceList with real data', async () => {
      render(
        <TestWrapper>
          <InvoiceList />
        </TestWrapper>
      );

      // Wait for data to load
      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      }, { timeout: 10000 });

      // Check table headers
      expect(screen.getByText('Invoice #')).toBeInTheDocument();
      expect(screen.getByText('Customer')).toBeInTheDocument();
      expect(screen.getByText('Total Amount')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle invalid authentication', async () => {
      const response = await fetch(`${BACKEND_URL}/invoices/`, {
        headers: {
          'Authorization': 'Bearer invalid-token',
        },
      });

      expect(response.status).toBe(401);
    });

    test('should handle missing required fields in invoice creation', async () => {
      const invalidInvoiceData = {
        customer_id: 'invalid-id',
        items: []
      };

      const response = await AuthHelper.makeAuthenticatedRequest(
        `${BACKEND_URL}/invoices/`,
        {
          method: 'POST',
          body: JSON.stringify(invalidInvoiceData),
        }
      );

      expect(response.ok).toBe(false);
      expect([400, 422]).toContain(response.status);
    });

    test('should handle insufficient inventory stock', async () => {
      const customer = await TestDataHelper.createTestCustomer();
      const item = await TestDataHelper.createTestInventoryItem();

      const invoiceData = {
        customer_id: customer.id,
        gold_price_per_gram: 2500,
        labor_cost_percentage: 10,
        profit_percentage: 15,
        vat_percentage: 9,
        items: [
          {
            inventory_item_id: item.id,
            quantity: 999, // More than available stock
            weight_grams: item.weight_grams,
          }
        ]
      };

      const response = await AuthHelper.makeAuthenticatedRequest(
        `${BACKEND_URL}/invoices/`,
        {
          method: 'POST',
          body: JSON.stringify(invoiceData),
        }
      );

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);

      // Cleanup
      await TestDataHelper.cleanupTestData(undefined, customer.id, item.id);
    });
  });

  describe('Performance and Load Testing', () => {
    test('should handle multiple concurrent requests', async () => {
      const promises = Array.from({ length: 5 }, () =>
        AuthHelper.makeAuthenticatedRequest(`${BACKEND_URL}/invoices/reports/summary`)
      );

      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.ok).toBe(true);
      });
    });

    test('should respond within acceptable time limits', async () => {
      const startTime = Date.now();
      
      const response = await AuthHelper.makeAuthenticatedRequest(
        `${BACKEND_URL}/invoices/?limit=10`
      );
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      expect(response.ok).toBe(true);
      expect(responseTime).toBeLessThan(5000); // Should respond within 5 seconds
      
      console.log(`✅ Response time: ${responseTime}ms`);
    });
  });
});