import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { InventoryItemForm } from '../components/inventory/InventoryItemForm';
import { CategoryManager } from '../components/inventory/CategoryManager';

// 🐳 PRODUCTION-READY COMPONENT TESTS
// These tests verify the UI components work correctly without network dependencies

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { 
      retry: false,
      staleTime: 0,
      cacheTime: 0,
    },
    mutations: { retry: false },
  },
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('✅ Inventory Components - Production Ready Tests', () => {
  test('✅ InventoryItemForm renders correctly for new item', () => {
    const mockOnClose = jest.fn();

    render(
      <TestWrapper>
        <InventoryItemForm onClose={mockOnClose} />
      </TestWrapper>
    );

    // Check form title
    expect(screen.getByText('Add New Inventory Item')).toBeInTheDocument();

    // Check required form fields
    expect(screen.getByLabelText('Item Name *')).toBeInTheDocument();
    expect(screen.getByLabelText('Weight (grams) *')).toBeInTheDocument();
    expect(screen.getByLabelText('Purchase Price ($) *')).toBeInTheDocument();
    expect(screen.getByLabelText('Sell Price ($) *')).toBeInTheDocument();
    expect(screen.getByLabelText('Current Stock *')).toBeInTheDocument();
    expect(screen.getByLabelText('Minimum Stock Level')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();

    // Check buttons
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Create Item')).toBeInTheDocument();

    // Check image upload section
    expect(screen.getByText('Upload a product image')).toBeInTheDocument();
    expect(screen.getByText('Choose File')).toBeInTheDocument();
  });

  test('✅ InventoryItemForm renders correctly for editing item', () => {
    const mockOnClose = jest.fn();
    const mockItem = {
      id: 'test-id',
      name: 'Test Gold Ring',
      category_id: 'test-category',
      weight_grams: 5.5,
      purchase_price: 100,
      sell_price: 150,
      stock_quantity: 10,
      min_stock_level: 2,
      description: 'Test description',
      image_url: 'test-image.jpg',
      is_active: true,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    };

    render(
      <TestWrapper>
        <InventoryItemForm item={mockItem} onClose={mockOnClose} />
      </TestWrapper>
    );

    // Check form title for editing
    expect(screen.getByText('Edit Inventory Item')).toBeInTheDocument();

    // Check that form is populated with item data
    expect(screen.getByDisplayValue('Test Gold Ring')).toBeInTheDocument();
    expect(screen.getByDisplayValue('5.5')).toBeInTheDocument();
    expect(screen.getByDisplayValue('100')).toBeInTheDocument();
    expect(screen.getByDisplayValue('150')).toBeInTheDocument();
    expect(screen.getByDisplayValue('10')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test description')).toBeInTheDocument();

    // Check update button
    expect(screen.getByText('Update Item')).toBeInTheDocument();
  });

  test('✅ InventoryItemForm form validation works', () => {
    const mockOnClose = jest.fn();

    render(
      <TestWrapper>
        <InventoryItemForm onClose={mockOnClose} />
      </TestWrapper>
    );

    // Try to submit empty form
    const createButton = screen.getByText('Create Item');
    fireEvent.click(createButton);

    // Should show validation error for required name field
    expect(screen.getByText('Item name is required')).toBeInTheDocument();
  });

  test('✅ InventoryItemForm cancel button works', () => {
    const mockOnClose = jest.fn();

    render(
      <TestWrapper>
        <InventoryItemForm onClose={mockOnClose} />
      </TestWrapper>
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  test('✅ InventoryItemForm handles form input changes', () => {
    const mockOnClose = jest.fn();

    render(
      <TestWrapper>
        <InventoryItemForm onClose={mockOnClose} />
      </TestWrapper>
    );

    // Test name input
    const nameInput = screen.getByLabelText('Item Name *');
    fireEvent.change(nameInput, { target: { value: 'New Gold Ring' } });
    expect(nameInput).toHaveValue('New Gold Ring');

    // Test weight input
    const weightInput = screen.getByLabelText('Weight (grams) *');
    fireEvent.change(weightInput, { target: { value: '3.5' } });
    expect(weightInput).toHaveValue(3.5);

    // Test price inputs
    const purchasePriceInput = screen.getByLabelText('Purchase Price ($) *');
    fireEvent.change(purchasePriceInput, { target: { value: '80' } });
    expect(purchasePriceInput).toHaveValue(80);

    const sellPriceInput = screen.getByLabelText('Sell Price ($) *');
    fireEvent.change(sellPriceInput, { target: { value: '120' } });
    expect(sellPriceInput).toHaveValue(120);

    // Test stock input
    const stockInput = screen.getByLabelText('Current Stock *');
    fireEvent.change(stockInput, { target: { value: '5' } });
    expect(stockInput).toHaveValue(5);

    // Test description
    const descriptionInput = screen.getByLabelText('Description');
    fireEvent.change(descriptionInput, { target: { value: 'Test description' } });
    expect(descriptionInput).toHaveValue('Test description');
  });

  test('✅ CategoryManager renders correctly', () => {
    render(
      <TestWrapper>
        <CategoryManager />
      </TestWrapper>
    );

    // Check main title
    expect(screen.getByText('Category Management')).toBeInTheDocument();

    // Check add category button
    expect(screen.getByText('Add Category')).toBeInTheDocument();

    // Should show loading or empty state initially
    expect(
      screen.getByText('Loading categories...') ||
      screen.getByText('No categories found. Create your first category to get started.')
    ).toBeInTheDocument();
  });

  test('✅ CategoryManager add category dialog opens', () => {
    render(
      <TestWrapper>
        <CategoryManager />
      </TestWrapper>
    );

    // Click add category button
    const addButton = screen.getByText('Add Category');
    fireEvent.click(addButton);

    // Dialog should open
    expect(screen.getByText('Create New Category')).toBeInTheDocument();
    expect(screen.getByLabelText('Category Name *')).toBeInTheDocument();
    expect(screen.getByLabelText('Parent Category')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByText('Create Category')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  test('✅ CategoryManager form validation works', () => {
    render(
      <TestWrapper>
        <CategoryManager />
      </TestWrapper>
    );

    // Open add category dialog
    const addButton = screen.getByText('Add Category');
    fireEvent.click(addButton);

    // Try to submit empty form
    const createButton = screen.getByText('Create Category');
    fireEvent.click(createButton);

    // Should show validation error (HTML5 validation for required field)
    const nameInput = screen.getByLabelText('Category Name *');
    expect(nameInput).toBeRequired();
  });

  test('✅ CategoryManager form input handling', () => {
    render(
      <TestWrapper>
        <CategoryManager />
      </TestWrapper>
    );

    // Open add category dialog
    const addButton = screen.getByText('Add Category');
    fireEvent.click(addButton);

    // Test form inputs
    const nameInput = screen.getByLabelText('Category Name *');
    fireEvent.change(nameInput, { target: { value: 'Test Category' } });
    expect(nameInput).toHaveValue('Test Category');

    const descriptionInput = screen.getByLabelText('Description');
    fireEvent.change(descriptionInput, { target: { value: 'Test description' } });
    expect(descriptionInput).toHaveValue('Test description');
  });

  test('✅ All required UI components are properly imported', () => {
    // This test ensures all UI components are available
    const mockOnClose = jest.fn();

    render(
      <TestWrapper>
        <InventoryItemForm onClose={mockOnClose} />
      </TestWrapper>
    );

    // Check that all UI components render without errors
    expect(screen.getByRole('dialog')).toBeInTheDocument(); // Dialog component
    expect(screen.getAllByRole('button')).toHaveLength(3); // Cancel, Create, Choose File buttons
    expect(screen.getAllByRole('textbox')).toHaveLength(6); // All text inputs
    expect(screen.getAllByRole('spinbutton')).toHaveLength(4); // All number inputs
  });

  test('✅ Components handle props correctly', () => {
    const mockOnClose = jest.fn();
    const mockOnCategorySelect = jest.fn();

    // Test InventoryItemForm with different props
    const { rerender } = render(
      <TestWrapper>
        <InventoryItemForm onClose={mockOnClose} />
      </TestWrapper>
    );

    expect(screen.getByText('Add New Inventory Item')).toBeInTheDocument();

    // Test with item prop
    const mockItem = {
      id: 'test-id',
      name: 'Test Item',
      category_id: 'test-category',
      weight_grams: 1.0,
      purchase_price: 50,
      sell_price: 75,
      stock_quantity: 5,
      min_stock_level: 1,
      description: '',
      image_url: '',
      is_active: true,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    };

    rerender(
      <TestWrapper>
        <InventoryItemForm item={mockItem} onClose={mockOnClose} />
      </TestWrapper>
    );

    expect(screen.getByText('Edit Inventory Item')).toBeInTheDocument();

    // Test CategoryManager with callback
    rerender(
      <TestWrapper>
        <CategoryManager onCategorySelect={mockOnCategorySelect} />
      </TestWrapper>
    );

    expect(screen.getByText('Category Management')).toBeInTheDocument();
  });
});