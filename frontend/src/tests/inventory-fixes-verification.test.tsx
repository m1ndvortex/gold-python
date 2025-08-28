/**
 * Inventory System Fixes Verification Test
 * Tests all the critical fixes implemented for the inventory system:
 * 1. Create First Category button functionality
 * 2. Image upload functionality
 * 3. QR Code generation
 * 4. Advanced tab content
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UniversalInventoryManagement } from '../components/inventory/UniversalInventoryManagement';
import { UniversalInventoryItemForm } from '../components/inventory/UniversalInventoryItemForm';
import { CategoryForm } from '../components/inventory/CategoryForm';
import { LanguageContext, useLanguageProvider } from '../hooks/useLanguage';

// Mock the API services
jest.mock('../services/universalInventoryApi', () => ({
  universalInventoryApi: {
    searchItems: jest.fn().mockResolvedValue({
      items: [],
      total_count: 0,
      has_more: false
    }),
    createItem: jest.fn().mockResolvedValue({ id: '1', name: 'Test Item' }),
    updateItem: jest.fn().mockResolvedValue({ id: '1', name: 'Updated Item' }),
    deleteItem: jest.fn().mockResolvedValue(undefined),
  },
  universalCategoriesApi: {
    getCategoryTree: jest.fn().mockResolvedValue([]),
    createCategory: jest.fn().mockResolvedValue({ id: '1', name: 'Test Category' }),
    updateCategory: jest.fn().mockResolvedValue({ id: '1', name: 'Updated Category' }),
    deleteCategory: jest.fn().mockResolvedValue(undefined),
  },
  stockAlertsApi: {
    getLowStockAlerts: jest.fn().mockResolvedValue({ alerts: [] }),
  },
  inventoryAnalyticsApi: {
    getOverallAnalytics: jest.fn().mockResolvedValue({
      total_items: 0,
      total_inventory_value: 0,
      low_stock_items: 0,
      out_of_stock_items: 0
    }),
  },
  inventoryMovementsApi: {
    getMovements: jest.fn().mockResolvedValue({ movements: [], total_count: 0 }),
  },
}));

// Test Language Provider
const TestLanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const languageValue = useLanguageProvider();
  return (
    <LanguageContext.Provider value={languageValue}>
      {children}
    </LanguageContext.Provider>
  );
};

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TestLanguageProvider>
          {children}
        </TestLanguageProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Inventory System Fixes Verification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('1. Create First Category Button Functionality', () => {
    test('should show "Create First Category" button when no categories exist', async () => {
      render(
        <TestWrapper>
          <UniversalInventoryManagement />
        </TestWrapper>
      );

      // Wait for the component to load
      await waitFor(() => {
        expect(screen.getByText('Universal Inventory Management')).toBeInTheDocument();
      });

      // Click on Categories tab
      const categoriesTab = screen.getByRole('tab', { name: /categories/i });
      fireEvent.click(categoriesTab);

      // Should show the "Create First Category" button
      await waitFor(() => {
        expect(screen.getByText('Create First Category')).toBeInTheDocument();
      });
    });

    test('should open category form when "Create First Category" button is clicked', async () => {
      render(
        <TestWrapper>
          <UniversalInventoryManagement />
        </TestWrapper>
      );

      // Wait for the component to load
      await waitFor(() => {
        expect(screen.getByText('Universal Inventory Management')).toBeInTheDocument();
      });

      // Click on Categories tab
      const categoriesTab = screen.getByRole('tab', { name: /categories/i });
      fireEvent.click(categoriesTab);

      // Click the "Create First Category" button
      const createButton = await screen.findByText('Create First Category');
      fireEvent.click(createButton);

      // Should open the category form dialog
      await waitFor(() => {
        expect(screen.getByText('Category Management')).toBeInTheDocument();
      });
    });
  });

  describe('2. Image Upload Functionality', () => {
    test('should show image upload area in item form', async () => {
      const mockCategories = [
        { id: '1', name: 'Test Category', parent_id: null, attribute_schema: [] }
      ];

      render(
        <TestWrapper>
          <UniversalInventoryItemForm
            categories={mockCategories}
            onClose={() => {}}
            onSubmit={async () => {}}
          />
        </TestWrapper>
      );

      // Should show the image upload area
      expect(screen.getByText('Upload a product image')).toBeInTheDocument();
      expect(screen.getByText('Choose File')).toBeInTheDocument();
    });

    test('should handle image file selection', async () => {
      const user = userEvent.setup();
      const mockCategories = [
        { id: '1', name: 'Test Category', parent_id: null, attribute_schema: [] }
      ];

      render(
        <TestWrapper>
          <UniversalInventoryItemForm
            categories={mockCategories}
            onClose={() => {}}
            onSubmit={async () => {}}
          />
        </TestWrapper>
      );

      // Create a mock file
      const file = new File(['test image'], 'test.jpg', { type: 'image/jpeg' });

      // Find the hidden file input
      const fileInput = screen.getByLabelText(/choose file/i);
      
      // Upload the file
      await user.upload(fileInput, file);

      // The file should be selected (we can't easily test the preview without more complex mocking)
      expect(fileInput.files).toHaveLength(1);
      expect(fileInput.files?.[0]).toBe(file);
    });

    test('should make upload area clickable', async () => {
      const mockCategories = [
        { id: '1', name: 'Test Category', parent_id: null, attribute_schema: [] }
      ];

      render(
        <TestWrapper>
          <UniversalInventoryItemForm
            categories={mockCategories}
            onClose={() => {}}
            onSubmit={async () => {}}
          />
        </TestWrapper>
      );

      // The upload area should be clickable
      const uploadArea = screen.getByText('Upload a product image').closest('div');
      expect(uploadArea).toHaveClass('cursor-pointer');
    });
  });

  describe('3. QR Code Generation Functionality', () => {
    test('should show QR code generation button in item form', async () => {
      const mockCategories = [
        { id: '1', name: 'Test Category', parent_id: null, attribute_schema: [] }
      ];

      render(
        <TestWrapper>
          <UniversalInventoryItemForm
            categories={mockCategories}
            onClose={() => {}}
            onSubmit={async () => {}}
          />
        </TestWrapper>
      );

      // Should show QR code input and generation button
      expect(screen.getByLabelText('QR Code Data')).toBeInTheDocument();
      
      // Find the QR code generation button by its title
      const qrButton = screen.getByTitle('Generate QR Code');
      expect(qrButton).toBeInTheDocument();
    });

    test('should generate QR code data when button is clicked', async () => {
      const user = userEvent.setup();
      const mockCategories = [
        { id: '1', name: 'Test Category', parent_id: null, attribute_schema: [] }
      ];

      render(
        <TestWrapper>
          <UniversalInventoryItemForm
            categories={mockCategories}
            onClose={() => {}}
            onSubmit={async () => {}}
          />
        </TestWrapper>
      );

      // Fill in item name first
      const nameInput = screen.getByLabelText(/item name/i);
      await user.type(nameInput, 'Test Product');

      // Click the QR code generation button
      const qrButton = screen.getByTitle('Generate QR Code');
      fireEvent.click(qrButton);

      // Check if QR code data was generated
      const qrInput = screen.getByLabelText('QR Code Data') as HTMLInputElement;
      expect(qrInput.value).toBeTruthy();
      expect(qrInput.value).toContain('Test Product');
    });

    test('should show barcode generation button', async () => {
      const mockCategories = [
        { id: '1', name: 'Test Category', parent_id: null, attribute_schema: [] }
      ];

      render(
        <TestWrapper>
          <UniversalInventoryItemForm
            categories={mockCategories}
            onClose={() => {}}
            onSubmit={async () => {}}
          />
        </TestWrapper>
      );

      // Should show barcode generation button
      const barcodeButton = screen.getByTitle('Generate Barcode');
      expect(barcodeButton).toBeInTheDocument();
    });

    test('should generate barcode when button is clicked', async () => {
      const mockCategories = [
        { id: '1', name: 'Test Category', parent_id: null, attribute_schema: [] }
      ];

      render(
        <TestWrapper>
          <UniversalInventoryItemForm
            categories={mockCategories}
            onClose={() => {}}
            onSubmit={async () => {}}
          />
        </TestWrapper>
      );

      // Click the barcode generation button
      const barcodeButton = screen.getByTitle('Generate Barcode');
      fireEvent.click(barcodeButton);

      // Check if barcode was generated
      const barcodeInput = screen.getByLabelText('Barcode') as HTMLInputElement;
      expect(barcodeInput.value).toBeTruthy();
      expect(barcodeInput.value).toMatch(/^\d+$/); // Should be numeric
    });
  });

  describe('4. Advanced Tab Content', () => {
    test('should show Advanced tab in item form', async () => {
      const mockCategories = [
        { id: '1', name: 'Test Category', parent_id: null, attribute_schema: [] }
      ];

      render(
        <TestWrapper>
          <UniversalInventoryItemForm
            categories={mockCategories}
            onClose={() => {}}
            onSubmit={async () => {}}
          />
        </TestWrapper>
      );

      // Should show Advanced tab
      const advancedTab = screen.getByRole('tab', { name: /advanced/i });
      expect(advancedTab).toBeInTheDocument();
    });

    test('should show gold shop specific fields in Advanced tab', async () => {
      const mockCategories = [
        { id: '1', name: 'Test Category', parent_id: null, attribute_schema: [] }
      ];

      render(
        <TestWrapper>
          <UniversalInventoryItemForm
            categories={mockCategories}
            onClose={() => {}}
            onSubmit={async () => {}}
          />
        </TestWrapper>
      );

      // Click on Advanced tab
      const advancedTab = screen.getByRole('tab', { name: /advanced/i });
      fireEvent.click(advancedTab);

      // Should show gold shop specific fields
      await waitFor(() => {
        expect(screen.getByText('Gold Shop Specific Fields')).toBeInTheDocument();
        expect(screen.getByLabelText('Gold Purity (Karat)')).toBeInTheDocument();
        expect(screen.getByLabelText('Gold Type')).toBeInTheDocument();
        expect(screen.getByLabelText('Stone Type')).toBeInTheDocument();
        expect(screen.getByLabelText('Making Charges (%)')).toBeInTheDocument();
      });
    });

    test('should show supplier information fields in Advanced tab', async () => {
      const mockCategories = [
        { id: '1', name: 'Test Category', parent_id: null, attribute_schema: [] }
      ];

      render(
        <TestWrapper>
          <UniversalInventoryItemForm
            categories={mockCategories}
            onClose={() => {}}
            onSubmit={async () => {}}
          />
        </TestWrapper>
      );

      // Click on Advanced tab
      const advancedTab = screen.getByRole('tab', { name: /advanced/i });
      fireEvent.click(advancedTab);

      // Should show supplier information fields
      await waitFor(() => {
        expect(screen.getByText('Supplier Information')).toBeInTheDocument();
        expect(screen.getByLabelText('Supplier Name')).toBeInTheDocument();
        expect(screen.getByLabelText('Supplier Code')).toBeInTheDocument();
        expect(screen.getByLabelText('Purchase Date')).toBeInTheDocument();
        expect(screen.getByLabelText('Warranty Period (Months)')).toBeInTheDocument();
      });
    });

    test('should show location and storage fields in Advanced tab', async () => {
      const mockCategories = [
        { id: '1', name: 'Test Category', parent_id: null, attribute_schema: [] }
      ];

      render(
        <TestWrapper>
          <UniversalInventoryItemForm
            categories={mockCategories}
            onClose={() => {}}
            onSubmit={async () => {}}
          />
        </TestWrapper>
      );

      // Click on Advanced tab
      const advancedTab = screen.getByRole('tab', { name: /advanced/i });
      fireEvent.click(advancedTab);

      // Should show location and storage fields
      await waitFor(() => {
        expect(screen.getByText('Location & Storage')).toBeInTheDocument();
        expect(screen.getByLabelText('Storage Location')).toBeInTheDocument();
        expect(screen.getByLabelText('Display Location')).toBeInTheDocument();
        expect(screen.getByLabelText('Security Level')).toBeInTheDocument();
      });
    });

    test('should allow interaction with advanced fields', async () => {
      const user = userEvent.setup();
      const mockCategories = [
        { id: '1', name: 'Test Category', parent_id: null, attribute_schema: [] }
      ];

      render(
        <TestWrapper>
          <UniversalInventoryItemForm
            categories={mockCategories}
            onClose={() => {}}
            onSubmit={async () => {}}
          />
        </TestWrapper>
      );

      // Click on Advanced tab
      const advancedTab = screen.getByRole('tab', { name: /advanced/i });
      fireEvent.click(advancedTab);

      // Test interaction with stone type field
      const stoneTypeInput = await screen.findByLabelText('Stone Type');
      await user.type(stoneTypeInput, 'Diamond');
      expect(stoneTypeInput).toHaveValue('Diamond');

      // Test interaction with supplier name field
      const supplierNameInput = screen.getByLabelText('Supplier Name');
      await user.type(supplierNameInput, 'Test Supplier');
      expect(supplierNameInput).toHaveValue('Test Supplier');

      // Test interaction with storage location field
      const storageLocationInput = screen.getByLabelText('Storage Location');
      await user.type(storageLocationInput, 'Vault A');
      expect(storageLocationInput).toHaveValue('Vault A');
    });
  });

  describe('5. Integration Tests', () => {
    test('should handle complete item creation workflow', async () => {
      const user = userEvent.setup();
      const mockOnSubmit = jest.fn().mockResolvedValue(undefined);
      const mockCategories = [
        { id: '1', name: 'Test Category', parent_id: null, attribute_schema: [] }
      ];

      render(
        <TestWrapper>
          <UniversalInventoryItemForm
            categories={mockCategories}
            onClose={() => {}}
            onSubmit={mockOnSubmit}
          />
        </TestWrapper>
      );

      // Fill basic information
      const nameInput = screen.getByLabelText(/item name/i);
      await user.type(nameInput, 'Test Gold Ring');

      // Select category
      const categorySelect = screen.getByLabelText(/category/i);
      fireEvent.click(categorySelect);
      const categoryOption = await screen.findByText('Test Category');
      fireEvent.click(categoryOption);

      // Generate QR code
      const qrButton = screen.getByTitle('Generate QR Code');
      fireEvent.click(qrButton);

      // Generate barcode
      const barcodeButton = screen.getByTitle('Generate Barcode');
      fireEvent.click(barcodeButton);

      // Go to pricing tab
      const pricingTab = screen.getByRole('tab', { name: /pricing/i });
      fireEvent.click(pricingTab);

      // Fill pricing information
      const costPriceInput = await screen.findByLabelText(/cost price/i);
      await user.type(costPriceInput, '100');

      const salePriceInput = screen.getByLabelText(/sale price/i);
      await user.clear(salePriceInput);
      await user.type(salePriceInput, '150');

      // Go to advanced tab and fill some fields
      const advancedTab = screen.getByRole('tab', { name: /advanced/i });
      fireEvent.click(advancedTab);

      const stoneTypeInput = await screen.findByLabelText('Stone Type');
      await user.type(stoneTypeInput, 'Diamond');

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /create item/i });
      fireEvent.click(submitButton);

      // Verify submission
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Test Gold Ring',
            category_id: '1',
            cost_price: 100,
            sale_price: 150,
            attributes: expect.objectContaining({
              stone_type: 'Diamond'
            })
          })
        );
      });
    });
  });
});