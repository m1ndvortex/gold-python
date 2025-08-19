import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProductManagement } from '../ProductManagement';
import { useCategories, useCreateInventoryItem, useUpdateInventoryItem, useUploadInventoryImage } from '../../../hooks/useInventory';
import { useCategoryTree } from '../../../hooks/useCategoryManagement';

// Mock the hooks
jest.mock('../../../hooks/useInventory');
jest.mock('../../../hooks/useCategoryManagement');

const mockUseCategories = useCategories as jest.MockedFunction<typeof useCategories>;
const mockUseCreateInventoryItem = useCreateInventoryItem as jest.MockedFunction<typeof useCreateInventoryItem>;
const mockUseUpdateInventoryItem = useUpdateInventoryItem as jest.MockedFunction<typeof useUpdateInventoryItem>;
const mockUseUploadInventoryImage = useUploadInventoryImage as jest.MockedFunction<typeof useUploadInventoryImage>;
const mockUseCategoryTree = useCategoryTree as jest.MockedFunction<typeof useCategoryTree>;

const mockCategories = [
  {
    id: '1',
    name: 'Rings',
    parent_id: null,
    description: 'Gold rings',
    created_at: '2024-01-01T00:00:00Z',
    attributes: {
      size: { label: 'Size', type: 'select', options: ['Small', 'Medium', 'Large'], required: true },
      material: { label: 'Material', type: 'text', required: true }
    }
  },
  {
    id: '2',
    name: 'Necklaces',
    parent_id: null,
    description: 'Gold necklaces',
    created_at: '2024-01-01T00:00:00Z',
    attributes: {
      length: { label: 'Length', type: 'number', required: true }
    }
  }
];

const mockProduct = {
  id: 'prod-1',
  name: 'Gold Ring 18K',
  category_id: '1',
  weight_grams: 5.5,
  purchase_price: 100,
  sell_price: 130,
  stock_quantity: 10,
  min_stock_level: 5,
  description: 'Beautiful gold ring',
  image_url: 'https://example.com/ring.jpg',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('ProductManagement', () => {
  const mockOnClose = jest.fn();
  const mockMutateAsync = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseCategories.mockReturnValue({
      data: mockCategories,
      isLoading: false,
      error: null,
    } as any);

    mockUseCategoryTree.mockReturnValue({
      data: mockCategories,
      isLoading: false,
      error: null,
    } as any);

    mockUseCreateInventoryItem.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    } as any);

    mockUseUpdateInventoryItem.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    } as any);

    mockUseUploadInventoryImage.mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue({ image_url: 'https://example.com/uploaded.jpg' }),
      isPending: false,
    } as any);
  });

  it('renders create product dialog correctly', () => {
    render(
      <ProductManagement product={null} onClose={mockOnClose} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Create New Product')).toBeInTheDocument();
    expect(screen.getByText('Basic Info')).toBeInTheDocument();
    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(screen.getByText('Images')).toBeInTheDocument();
    expect(screen.getByText('Variants')).toBeInTheDocument();
    expect(screen.getByText('SEO & Meta')).toBeInTheDocument();
  });

  it('renders edit product dialog with existing data', () => {
    render(
      <ProductManagement product={mockProduct} onClose={mockOnClose} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Edit Product')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Gold Ring 18K')).toBeInTheDocument();
    expect(screen.getByDisplayValue('100')).toBeInTheDocument();
    expect(screen.getByDisplayValue('130')).toBeInTheDocument();
  });

  it('handles basic product information input', async () => {
    const user = userEvent.setup();
    
    render(
      <ProductManagement product={null} onClose={mockOnClose} />,
      { wrapper: createWrapper() }
    );

    const nameInput = screen.getByLabelText(/product name/i);
    const skuInput = screen.getByLabelText(/sku/i);
    const descriptionInput = screen.getByLabelText(/description/i);

    await user.type(nameInput, 'Test Product');
    await user.type(skuInput, 'TEST-001');
    await user.type(descriptionInput, 'Test description');

    expect(nameInput).toHaveValue('Test Product');
    expect(skuInput).toHaveValue('TEST-001');
    expect(descriptionInput).toHaveValue('Test description');
  });

  it('handles pricing calculations', async () => {
    const user = userEvent.setup();
    
    render(
      <ProductManagement product={null} onClose={mockOnClose} />,
      { wrapper: createWrapper() }
    );

    const purchasePriceInput = screen.getByLabelText(/purchase price/i);
    const sellPriceInput = screen.getByLabelText(/sell price/i);

    await user.type(purchasePriceInput, '100');
    await user.type(sellPriceInput, '150');

    // Check if markup percentage is calculated
    const markupInput = screen.getByLabelText(/markup/i);
    expect(markupInput).toHaveValue('50.0');
  });

  it('handles category selection', async () => {
    const user = userEvent.setup();
    
    render(
      <ProductManagement product={null} onClose={mockOnClose} />,
      { wrapper: createWrapper() }
    );

    // Navigate to categories tab
    const categoriesTab = screen.getByText('Categories');
    await user.click(categoriesTab);

    // Select a category
    const ringCategory = screen.getByText('Rings');
    await user.click(ringCategory);

    // Check if category is selected
    expect(screen.getByText('Rings (Primary)')).toBeInTheDocument();
  });

  it('shows category attributes when categories are selected', async () => {
    const user = userEvent.setup();
    
    render(
      <ProductManagement product={null} onClose={mockOnClose} />,
      { wrapper: createWrapper() }
    );

    // Navigate to categories tab
    const categoriesTab = screen.getByText('Categories');
    await user.click(categoriesTab);

    // Select a category with attributes
    const ringCategory = screen.getByText('Rings');
    await user.click(ringCategory);

    // Check if category attributes are shown
    await waitFor(() => {
      expect(screen.getByText('Category Attributes')).toBeInTheDocument();
      expect(screen.getByLabelText(/size/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/material/i)).toBeInTheDocument();
    });
  });

  it('handles image upload', async () => {
    const user = userEvent.setup();
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    render(
      <ProductManagement product={null} onClose={mockOnClose} />,
      { wrapper: createWrapper() }
    );

    // Navigate to images tab
    const imagesTab = screen.getByText('Images');
    await user.click(imagesTab);

    // Upload an image
    const fileInput = screen.getByLabelText(/upload images/i);
    await user.upload(fileInput, mockFile);

    // Check if upload was triggered
    await waitFor(() => {
      expect(mockUseUploadInventoryImage().mutateAsync).toHaveBeenCalledWith(mockFile);
    });
  });

  it('handles variant creation', async () => {
    const user = userEvent.setup();
    
    render(
      <ProductManagement product={null} onClose={mockOnClose} />,
      { wrapper: createWrapper() }
    );

    // Navigate to variants tab
    const variantsTab = screen.getByText('Variants');
    await user.click(variantsTab);

    // Add a variant
    const addVariantButton = screen.getByText('Add Variant');
    await user.click(addVariantButton);

    // Check if variant form appears
    expect(screen.getByText('Variant 1')).toBeInTheDocument();
  });

  it('handles form submission for new product', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue({ id: 'new-product' });
    
    render(
      <ProductManagement product={null} onClose={mockOnClose} />,
      { wrapper: createWrapper() }
    );

    // Fill in required fields
    await user.type(screen.getByLabelText(/product name/i), 'Test Product');
    await user.type(screen.getByLabelText(/sku/i), 'TEST-001');
    await user.type(screen.getByLabelText(/purchase price/i), '100');
    await user.type(screen.getByLabelText(/sell price/i), '130');
    await user.type(screen.getByLabelText(/weight.*grams/i), '5.5');
    await user.type(screen.getByLabelText(/current stock/i), '10');

    // Submit form
    const submitButton = screen.getByText('Create Product');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        name: 'Test Product',
        category_id: '',
        weight_grams: 5.5,
        purchase_price: 100,
        sell_price: 130,
        stock_quantity: 10,
        min_stock_level: 5,
        description: '',
        image_url: '',
      });
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('handles form submission for product update', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue({ id: 'prod-1' });
    
    render(
      <ProductManagement product={mockProduct} onClose={mockOnClose} />,
      { wrapper: createWrapper() }
    );

    // Update product name
    const nameInput = screen.getByDisplayValue('Gold Ring 18K');
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Gold Ring');

    // Submit form
    const submitButton = screen.getByText('Update Product');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        id: 'prod-1',
        data: expect.objectContaining({
          name: 'Updated Gold Ring',
        }),
      });
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('handles SEO metadata input', async () => {
    const user = userEvent.setup();
    
    render(
      <ProductManagement product={null} onClose={mockOnClose} />,
      { wrapper: createWrapper() }
    );

    // Navigate to SEO tab
    const seoTab = screen.getByText('SEO & Meta');
    await user.click(seoTab);

    // Fill in SEO fields
    const metaTitleInput = screen.getByLabelText(/meta title/i);
    const metaDescriptionInput = screen.getByLabelText(/meta description/i);
    const keywordsInput = screen.getByLabelText(/keywords/i);

    await user.type(metaTitleInput, 'SEO Title');
    await user.type(metaDescriptionInput, 'SEO Description');
    await user.type(keywordsInput, 'gold, ring, jewelry');

    expect(metaTitleInput).toHaveValue('SEO Title');
    expect(metaDescriptionInput).toHaveValue('SEO Description');
    expect(keywordsInput).toHaveValue('gold, ring, jewelry');
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    
    render(
      <ProductManagement product={null} onClose={mockOnClose} />,
      { wrapper: createWrapper() }
    );

    // Try to submit without required fields
    const submitButton = screen.getByText('Create Product');
    await user.click(submitButton);

    // Check for validation errors
    await waitFor(() => {
      expect(screen.getByText(/product name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/sku is required/i)).toBeInTheDocument();
    });

    // Ensure form was not submitted
    expect(mockMutateAsync).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('handles dialog close', async () => {
    const user = userEvent.setup();
    
    render(
      <ProductManagement product={null} onClose={mockOnClose} />,
      { wrapper: createWrapper() }
    );

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('handles loading states', () => {
    mockUseCreateInventoryItem.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: true,
    } as any);

    render(
      <ProductManagement product={null} onClose={mockOnClose} />,
      { wrapper: createWrapper() }
    );

    const submitButton = screen.getByText('Saving...');
    expect(submitButton).toBeDisabled();
  });

  it('handles error states gracefully', async () => {
    const user = userEvent.setup();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    mockMutateAsync.mockRejectedValue(new Error('Save failed'));
    
    render(
      <ProductManagement product={null} onClose={mockOnClose} />,
      { wrapper: createWrapper() }
    );

    // Fill in required fields and submit
    await user.type(screen.getByLabelText(/product name/i), 'Test Product');
    await user.type(screen.getByLabelText(/sku/i), 'TEST-001');
    await user.type(screen.getByLabelText(/purchase price/i), '100');
    await user.type(screen.getByLabelText(/sell price/i), '130');
    await user.type(screen.getByLabelText(/weight.*grams/i), '5.5');
    await user.type(screen.getByLabelText(/current stock/i), '10');

    const submitButton = screen.getByText('Create Product');
    await user.click(submitButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to save product:', expect.any(Error));
    });

    // Dialog should not close on error
    expect(mockOnClose).not.toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });
});