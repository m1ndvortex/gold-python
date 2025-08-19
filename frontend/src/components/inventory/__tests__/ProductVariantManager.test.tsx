import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductVariantManager } from '../ProductVariantManager';

const mockBaseProduct = {
  name: 'Gold Ring 18K',
  sku: 'GR-18K-001',
  base_pricing: {
    purchase_price: 100,
    sell_price: 130,
    markup_percentage: 30,
  },
  base_inventory: {
    stock_quantity: 10,
    min_stock_level: 5,
    weight_grams: 5.5,
  },
};

const mockVariants = [
  {
    id: 'variant-1',
    name: 'Gold Ring 18K - Small',
    sku: 'GR-18K-001-S',
    attributes: [
      { name: 'Size', value: 'Small', type: 'text' as const },
      { name: 'Color', value: 'Gold', type: 'text' as const }
    ],
    pricing: {
      purchase_price: 95,
      sell_price: 125,
      markup_percentage: 31.6,
    },
    inventory: {
      stock_quantity: 5,
      min_stock_level: 2,
      weight_grams: 4.5,
    },
    images: [],
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'variant-2',
    name: 'Gold Ring 18K - Large',
    sku: 'GR-18K-001-L',
    attributes: [
      { name: 'Size', value: 'Large', type: 'text' as const },
      { name: 'Color', value: 'Gold', type: 'text' as const }
    ],
    pricing: {
      purchase_price: 110,
      sell_price: 145,
      markup_percentage: 31.8,
    },
    inventory: {
      stock_quantity: 1,
      min_stock_level: 2,
      weight_grams: 6.5,
    },
    images: [],
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
  }
];

describe('ProductVariantManager', () => {
  const mockOnVariantsChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders empty state correctly', () => {
    render(
      <ProductVariantManager
        variants={[]}
        onVariantsChange={mockOnVariantsChange}
        baseProduct={mockBaseProduct}
      />
    );

    expect(screen.getByText('Product Variants')).toBeInTheDocument();
    expect(screen.getByText('No variants created')).toBeInTheDocument();
    expect(screen.getByText('Create variants to offer different options for this product')).toBeInTheDocument();
  });

  it('renders variants in card view', () => {
    render(
      <ProductVariantManager
        variants={mockVariants}
        onVariantsChange={mockOnVariantsChange}
        baseProduct={mockBaseProduct}
      />
    );

    expect(screen.getByText('Gold Ring 18K - Small')).toBeInTheDocument();
    expect(screen.getByText('Gold Ring 18K - Large')).toBeInTheDocument();
    expect(screen.getByText('GR-18K-001-S')).toBeInTheDocument();
    expect(screen.getByText('GR-18K-001-L')).toBeInTheDocument();
  });

  it('displays summary statistics', () => {
    render(
      <ProductVariantManager
        variants={mockVariants}
        onVariantsChange={mockOnVariantsChange}
        baseProduct={mockBaseProduct}
      />
    );

    expect(screen.getByText('Total Variants')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Total Stock')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument(); // 5 + 1
    expect(screen.getByText('Total Value')).toBeInTheDocument();
    expect(screen.getByText('$770.00')).toBeInTheDocument(); // (5 * 125) + (1 * 145)
    expect(screen.getByText('Low Stock')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument(); // Large variant has 1 stock, min is 2
  });

  it('shows variant attributes as badges', () => {
    render(
      <ProductVariantManager
        variants={mockVariants}
        onVariantsChange={mockOnVariantsChange}
        baseProduct={mockBaseProduct}
      />
    );

    expect(screen.getByText('Size: Small')).toBeInTheDocument();
    expect(screen.getByText('Color: Gold')).toBeInTheDocument();
    expect(screen.getByText('Size: Large')).toBeInTheDocument();
  });

  it('highlights low stock variants', () => {
    render(
      <ProductVariantManager
        variants={mockVariants}
        onVariantsChange={mockOnVariantsChange}
        baseProduct={mockBaseProduct}
      />
    );

    expect(screen.getByText('Low Stock')).toBeInTheDocument();
  });

  it('opens create variant dialog', async () => {
    const user = userEvent.setup();
    
    render(
      <ProductVariantManager
        variants={[]}
        onVariantsChange={mockOnVariantsChange}
        baseProduct={mockBaseProduct}
      />
    );

    const addButton = screen.getByText('Add Variant');
    await user.click(addButton);

    expect(screen.getByText('Create New Variant')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Gold Ring 18K - Variant')).toBeInTheDocument();
  });

  it('opens edit variant dialog', async () => {
    const user = userEvent.setup();
    
    render(
      <ProductVariantManager
        variants={mockVariants}
        onVariantsChange={mockOnVariantsChange}
        baseProduct={mockBaseProduct}
      />
    );

    const editButtons = screen.getAllByText('Edit');
    await user.click(editButtons[0]);

    expect(screen.getByText('Edit Variant')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Gold Ring 18K - Small')).toBeInTheDocument();
  });

  it('handles variant creation', async () => {
    const user = userEvent.setup();
    
    render(
      <ProductVariantManager
        variants={[]}
        onVariantsChange={mockOnVariantsChange}
        baseProduct={mockBaseProduct}
      />
    );

    // Open create dialog
    const addButton = screen.getByText('Add Variant');
    await user.click(addButton);

    // Fill in variant details
    const nameInput = screen.getByDisplayValue('Gold Ring 18K - Variant');
    await user.clear(nameInput);
    await user.type(nameInput, 'Gold Ring 18K - Medium');

    const skuInput = screen.getByLabelText(/variant sku/i);
    await user.clear(skuInput);
    await user.type(skuInput, 'GR-18K-001-M');

    // Add an attribute
    const attrNameInput = screen.getByPlaceholderText('Attribute name (e.g., Size, Color)');
    const attrValueInput = screen.getByPlaceholderText('Value (e.g., Small, Red)');
    
    await user.type(attrNameInput, 'Size');
    await user.type(attrValueInput, 'Medium');
    
    const addAttrButton = screen.getByRole('button', { name: /add attribute/i });
    await user.click(addAttrButton);

    // Update pricing
    const purchasePriceInput = screen.getByLabelText(/purchase price/i);
    await user.clear(purchasePriceInput);
    await user.type(purchasePriceInput, '105');

    const sellPriceInput = screen.getByLabelText(/sell price/i);
    await user.clear(sellPriceInput);
    await user.type(sellPriceInput, '140');

    // Update inventory
    const stockInput = screen.getByLabelText(/stock quantity/i);
    await user.clear(stockInput);
    await user.type(stockInput, '8');

    // Save variant
    const saveButton = screen.getByText('Create Variant');
    await user.click(saveButton);

    expect(mockOnVariantsChange).toHaveBeenCalledWith([
      expect.objectContaining({
        name: 'Gold Ring 18K - Medium',
        sku: 'GR-18K-001-M',
        attributes: [{ name: 'Size', value: 'Medium', type: 'text' }],
        pricing: expect.objectContaining({
          purchase_price: 105,
          sell_price: 140,
        }),
        inventory: expect.objectContaining({
          stock_quantity: 8,
        }),
      })
    ]);
  });

  it('handles variant editing', async () => {
    const user = userEvent.setup();
    
    render(
      <ProductVariantManager
        variants={mockVariants}
        onVariantsChange={mockOnVariantsChange}
        baseProduct={mockBaseProduct}
      />
    );

    // Open edit dialog for first variant
    const editButtons = screen.getAllByText('Edit');
    await user.click(editButtons[0]);

    // Update variant name
    const nameInput = screen.getByDisplayValue('Gold Ring 18K - Small');
    await user.clear(nameInput);
    await user.type(nameInput, 'Gold Ring 18K - Extra Small');

    // Save changes
    const saveButton = screen.getByText('Update Variant');
    await user.click(saveButton);

    expect(mockOnVariantsChange).toHaveBeenCalledWith([
      expect.objectContaining({
        ...mockVariants[0],
        name: 'Gold Ring 18K - Extra Small',
      }),
      mockVariants[1]
    ]);
  });

  it('handles variant duplication', async () => {
    const user = userEvent.setup();
    
    render(
      <ProductVariantManager
        variants={mockVariants}
        onVariantsChange={mockOnVariantsChange}
        baseProduct={mockBaseProduct}
      />
    );

    // Click duplicate button for first variant
    const duplicateButtons = screen.getAllByRole('button', { name: /duplicate/i });
    await user.click(duplicateButtons[0]);

    expect(mockOnVariantsChange).toHaveBeenCalledWith([
      ...mockVariants,
      expect.objectContaining({
        name: 'Gold Ring 18K - Small (Copy)',
        sku: 'GR-18K-001-S-COPY',
        attributes: mockVariants[0].attributes,
        pricing: mockVariants[0].pricing,
        inventory: mockVariants[0].inventory,
      })
    ]);
  });

  it('handles variant deletion', async () => {
    const user = userEvent.setup();
    
    render(
      <ProductVariantManager
        variants={mockVariants}
        onVariantsChange={mockOnVariantsChange}
        baseProduct={mockBaseProduct}
      />
    );

    // Click delete button for first variant
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[0]);

    // Confirm deletion
    const confirmButton = screen.getByText('Delete Variant');
    await user.click(confirmButton);

    expect(mockOnVariantsChange).toHaveBeenCalledWith([mockVariants[1]]);
  });

  it('calculates markup percentage automatically', async () => {
    const user = userEvent.setup();
    
    render(
      <ProductVariantManager
        variants={[]}
        onVariantsChange={mockOnVariantsChange}
        baseProduct={mockBaseProduct}
      />
    );

    // Open create dialog
    const addButton = screen.getByText('Add Variant');
    await user.click(addButton);

    // Update pricing
    const purchasePriceInput = screen.getByLabelText(/purchase price/i);
    await user.clear(purchasePriceInput);
    await user.type(purchasePriceInput, '100');

    const sellPriceInput = screen.getByLabelText(/sell price/i);
    await user.clear(sellPriceInput);
    await user.type(sellPriceInput, '150');

    // Check if markup is calculated correctly
    const markupInput = screen.getByDisplayValue('50.0');
    expect(markupInput).toBeInTheDocument();
  });

  it('handles attribute management', async () => {
    const user = userEvent.setup();
    
    render(
      <ProductVariantManager
        variants={[]}
        onVariantsChange={mockOnVariantsChange}
        baseProduct={mockBaseProduct}
      />
    );

    // Open create dialog
    const addButton = screen.getByText('Add Variant');
    await user.click(addButton);

    // Add first attribute
    const attrNameInput = screen.getByPlaceholderText('Attribute name (e.g., Size, Color)');
    const attrValueInput = screen.getByPlaceholderText('Value (e.g., Small, Red)');
    
    await user.type(attrNameInput, 'Size');
    await user.type(attrValueInput, 'Medium');
    
    const addAttrButton = screen.getByRole('button', { name: /add attribute/i });
    await user.click(addAttrButton);

    // Verify attribute was added
    expect(screen.getByDisplayValue('Size')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Medium')).toBeInTheDocument();

    // Add second attribute
    await user.type(attrNameInput, 'Material');
    await user.type(attrValueInput, '18K Gold');
    await user.click(addAttrButton);

    // Remove first attribute
    const removeButtons = screen.getAllByRole('button', { name: /remove attribute/i });
    await user.click(removeButtons[0]);

    // Verify first attribute was removed
    expect(screen.queryByDisplayValue('Size')).not.toBeInTheDocument();
    expect(screen.getByDisplayValue('Material')).toBeInTheDocument();
  });

  it('handles different attribute types', async () => {
    const user = userEvent.setup();
    
    render(
      <ProductVariantManager
        variants={[]}
        onVariantsChange={mockOnVariantsChange}
        baseProduct={mockBaseProduct}
      />
    );

    // Open create dialog
    const addButton = screen.getByText('Add Variant');
    await user.click(addButton);

    // Add attribute with select type
    const attrNameInput = screen.getByPlaceholderText('Attribute name (e.g., Size, Color)');
    const attrValueInput = screen.getByPlaceholderText('Value (e.g., Small, Red)');
    const attrTypeSelect = screen.getByDisplayValue('Text');
    
    await user.type(attrNameInput, 'Quality');
    await user.type(attrValueInput, 'Premium');
    await user.click(attrTypeSelect);
    await user.click(screen.getByText('Select'));
    
    const addAttrButton = screen.getByRole('button', { name: /add attribute/i });
    await user.click(addAttrButton);

    // Verify attribute type was set
    expect(screen.getByDisplayValue('Select')).toBeInTheDocument();
  });

  it('shows inactive variants with reduced opacity', () => {
    const inactiveVariants = [
      { ...mockVariants[0], is_active: false }
    ];

    render(
      <ProductVariantManager
        variants={inactiveVariants}
        onVariantsChange={mockOnVariantsChange}
        baseProduct={mockBaseProduct}
      />
    );

    const variantCard = screen.getByText('Gold Ring 18K - Small').closest('.opacity-60');
    expect(variantCard).toBeInTheDocument();
  });

  it('handles variant status toggle', async () => {
    const user = userEvent.setup();
    
    render(
      <ProductVariantManager
        variants={mockVariants}
        onVariantsChange={mockOnVariantsChange}
        baseProduct={mockBaseProduct}
      />
    );

    // Open edit dialog
    const editButtons = screen.getAllByText('Edit');
    await user.click(editButtons[0]);

    // Toggle active status
    const activeCheckbox = screen.getByLabelText(/variant is active/i);
    await user.click(activeCheckbox);

    // Save changes
    const saveButton = screen.getByText('Update Variant');
    await user.click(saveButton);

    expect(mockOnVariantsChange).toHaveBeenCalledWith([
      expect.objectContaining({
        ...mockVariants[0],
        is_active: false,
      }),
      mockVariants[1]
    ]);
  });

  it('validates required fields in variant form', async () => {
    const user = userEvent.setup();
    
    render(
      <ProductVariantManager
        variants={[]}
        onVariantsChange={mockOnVariantsChange}
        baseProduct={mockBaseProduct}
      />
    );

    // Open create dialog
    const addButton = screen.getByText('Add Variant');
    await user.click(addButton);

    // Clear required fields
    const nameInput = screen.getByDisplayValue('Gold Ring 18K - Variant');
    await user.clear(nameInput);

    // Try to save
    const saveButton = screen.getByText('Create Variant');
    await user.click(saveButton);

    // Form should still be open (validation failed)
    expect(screen.getByText('Create New Variant')).toBeInTheDocument();
  });
});