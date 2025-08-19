import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BulkInventoryOperations } from '../BulkInventoryOperations';

const mockCategories = [
  {
    id: '1',
    name: 'Jewelry',
    parent_id: null,
    description: 'All jewelry items',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Rings',
    parent_id: '1',
    description: 'Gold rings',
    created_at: '2024-01-01T00:00:00Z'
  }
];

const mockSelectedItems = [
  {
    id: '1',
    name: 'Gold Ring 18K',
    category_id: '2',
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
  },
  {
    id: '2',
    name: 'Gold Necklace 22K',
    category_id: '1',
    weight_grams: 15.2,
    purchase_price: 300,
    sell_price: 390,
    stock_quantity: 5,
    min_stock_level: 3,
    description: 'Elegant gold necklace',
    image_url: 'https://example.com/necklace.jpg',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

describe('BulkInventoryOperations', () => {
  const mockOnBulkUpdate = jest.fn();
  const mockOnBulkDelete = jest.fn();
  const mockOnExport = jest.fn();
  const mockOnSelectAll = jest.fn();
  const mockOnClearSelection = jest.fn();

  const mockSelectedItemIds = mockSelectedItems.map(item => item.id);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders empty state when no items selected', () => {
    render(
      <BulkInventoryOperations
        selectedItems={[]}
        categories={mockCategories}
        onBulkUpdate={mockOnBulkUpdate}
        onBulkDelete={mockOnBulkDelete}
        onExport={mockOnExport}
        onSelectAll={mockOnSelectAll}
        onClearSelection={mockOnClearSelection}
        totalItems={10}
      />
    );

    expect(screen.getByText('No items selected')).toBeInTheDocument();
    expect(screen.getByText('Select items to perform bulk operations')).toBeInTheDocument();
    expect(screen.getByText('Select All (10)')).toBeInTheDocument();
  });

  it('renders bulk operations when items are selected', () => {
    render(
      <BulkInventoryOperations
        selectedItems={mockSelectedItemIds}
        items={mockSelectedItems}
        categories={mockCategories}
        onBulkUpdate={mockOnBulkUpdate}
        onBulkDelete={mockOnBulkDelete}
        onExport={mockOnExport}
        onSelectAll={mockOnSelectAll}
        onClearSelection={mockOnClearSelection}
        totalItems={10}
      />
    );

    expect(screen.getByText('Bulk Operations')).toBeInTheDocument();
    expect(screen.getByText('2 selected')).toBeInTheDocument();
    expect(screen.getByText('Change Category')).toBeInTheDocument();
    expect(screen.getByText('Update Prices')).toBeInTheDocument();
    expect(screen.getByText('Update Stock')).toBeInTheDocument();
    expect(screen.getByText('Activate Items')).toBeInTheDocument();
  });

  it('shows selected items preview', () => {
    render(
      <BulkInventoryOperations
        selectedItems={mockSelectedItemIds} items={mockSelectedItems}
        categories={mockCategories}
        onBulkUpdate={mockOnBulkUpdate}
        onBulkDelete={mockOnBulkDelete}
        onExport={mockOnExport}
        onSelectAll={mockOnSelectAll}
        onClearSelection={mockOnClearSelection}
        totalItems={10}
      />
    );

    expect(screen.getByText('Selected Items')).toBeInTheDocument();
    expect(screen.getByText('Gold Ring 18K')).toBeInTheDocument();
    expect(screen.getByText('Gold Necklace 22K')).toBeInTheDocument();
    expect(screen.getByText('$130')).toBeInTheDocument();
    expect(screen.getByText('$390')).toBeInTheDocument();
  });

  it('handles select all action', async () => {
    const user = userEvent.setup();
    
    render(
      <BulkInventoryOperations
        selectedItems={[]}
        categories={mockCategories}
        onBulkUpdate={mockOnBulkUpdate}
        onBulkDelete={mockOnBulkDelete}
        onExport={mockOnExport}
        onSelectAll={mockOnSelectAll}
        onClearSelection={mockOnClearSelection}
        totalItems={10}
      />
    );

    const selectAllButton = screen.getByText('Select All (10)');
    await user.click(selectAllButton);

    expect(mockOnSelectAll).toHaveBeenCalled();
  });

  it('handles clear selection action', async () => {
    const user = userEvent.setup();
    
    render(
      <BulkInventoryOperations
        selectedItems={mockSelectedItemIds} items={mockSelectedItems}
        categories={mockCategories}
        onBulkUpdate={mockOnBulkUpdate}
        onBulkDelete={mockOnBulkDelete}
        onExport={mockOnExport}
        onSelectAll={mockOnSelectAll}
        onClearSelection={mockOnClearSelection}
        totalItems={10}
      />
    );

    const clearButton = screen.getByText('Clear');
    await user.click(clearButton);

    expect(mockOnClearSelection).toHaveBeenCalled();
  });

  it('opens category change dialog', async () => {
    const user = userEvent.setup();
    
    render(
      <BulkInventoryOperations
        selectedItems={mockSelectedItemIds} items={mockSelectedItems}
        categories={mockCategories}
        onBulkUpdate={mockOnBulkUpdate}
        onBulkDelete={mockOnBulkDelete}
        onExport={mockOnExport}
        onSelectAll={mockOnSelectAll}
        onClearSelection={mockOnClearSelection}
        totalItems={10}
      />
    );

    const changeCategoryButton = screen.getByText('Change Category');
    await user.click(changeCategoryButton);

    expect(screen.getByText('Change Category')).toBeInTheDocument();
    expect(screen.getByText('This will affect 2 selected items')).toBeInTheDocument();
    expect(screen.getByText('New Category')).toBeInTheDocument();
  });

  it('handles category change operation', async () => {
    const user = userEvent.setup();
    
    render(
      <BulkInventoryOperations
        selectedItems={mockSelectedItemIds} items={mockSelectedItems}
        categories={mockCategories}
        onBulkUpdate={mockOnBulkUpdate}
        onBulkDelete={mockOnBulkDelete}
        onExport={mockOnExport}
        onSelectAll={mockOnSelectAll}
        onClearSelection={mockOnClearSelection}
        totalItems={10}
      />
    );

    // Open category change dialog
    const changeCategoryButton = screen.getByText('Change Category');
    await user.click(changeCategoryButton);

    // Select new category
    const categorySelect = screen.getByRole('combobox');
    await user.click(categorySelect);
    await user.click(screen.getByText('Jewelry'));

    // Apply changes
    const applyButton = screen.getByText('Apply to 2 items');
    await user.click(applyButton);

    expect(mockOnBulkUpdate).toHaveBeenCalledWith(['1', '2'], {
      category_id: '1'
    });
  });

  it('opens price update dialog', async () => {
    const user = userEvent.setup();
    
    render(
      <BulkInventoryOperations
        selectedItems={mockSelectedItemIds} items={mockSelectedItems}
        categories={mockCategories}
        onBulkUpdate={mockOnBulkUpdate}
        onBulkDelete={mockOnBulkDelete}
        onExport={mockOnExport}
        onSelectAll={mockOnSelectAll}
        onClearSelection={mockOnClearSelection}
        totalItems={10}
      />
    );

    const updatePricesButton = screen.getByText('Update Prices');
    await user.click(updatePricesButton);

    expect(screen.getByText('Update Prices')).toBeInTheDocument();
    expect(screen.getByText('Price Adjustment Type')).toBeInTheDocument();
    expect(screen.getByText('Apply To')).toBeInTheDocument();
  });

  it('handles price update operation', async () => {
    const user = userEvent.setup();
    
    render(
      <BulkInventoryOperations
        selectedItems={mockSelectedItemIds} items={mockSelectedItems}
        categories={mockCategories}
        onBulkUpdate={mockOnBulkUpdate}
        onBulkDelete={mockOnBulkDelete}
        onExport={mockOnExport}
        onSelectAll={mockOnSelectAll}
        onClearSelection={mockOnClearSelection}
        totalItems={10}
      />
    );

    // Open price update dialog
    const updatePricesButton = screen.getByText('Update Prices');
    await user.click(updatePricesButton);

    // Set percentage increase
    const percentageInput = screen.getByPlaceholderText('10');
    await user.type(percentageInput, '15');

    // Apply changes
    const applyButton = screen.getByText('Apply to 2 items');
    await user.click(applyButton);

    expect(mockOnBulkUpdate).toHaveBeenCalledWith(['1', '2'], {
      price_adjustment: {
        type: 'percentage',
        value: 15,
        apply_to: 'both'
      }
    });
  });

  it('opens stock update dialog', async () => {
    const user = userEvent.setup();
    
    render(
      <BulkInventoryOperations
        selectedItems={mockSelectedItemIds} items={mockSelectedItems}
        categories={mockCategories}
        onBulkUpdate={mockOnBulkUpdate}
        onBulkDelete={mockOnBulkDelete}
        onExport={mockOnExport}
        onSelectAll={mockOnSelectAll}
        onClearSelection={mockOnClearSelection}
        totalItems={10}
      />
    );

    const updateStockButton = screen.getByText('Update Stock');
    await user.click(updateStockButton);

    expect(screen.getByText('Update Stock')).toBeInTheDocument();
    expect(screen.getByText('Stock Adjustment Type')).toBeInTheDocument();
    expect(screen.getByText('Quantity')).toBeInTheDocument();
  });

  it('handles stock update operation', async () => {
    const user = userEvent.setup();
    
    render(
      <BulkInventoryOperations
        selectedItems={mockSelectedItemIds} items={mockSelectedItems}
        categories={mockCategories}
        onBulkUpdate={mockOnBulkUpdate}
        onBulkDelete={mockOnBulkDelete}
        onExport={mockOnExport}
        onSelectAll={mockOnSelectAll}
        onClearSelection={mockOnClearSelection}
        totalItems={10}
      />
    );

    // Open stock update dialog
    const updateStockButton = screen.getByText('Update Stock');
    await user.click(updateStockButton);

    // Set quantity
    const quantityInput = screen.getByPlaceholderText('0');
    await user.type(quantityInput, '20');

    // Apply changes
    const applyButton = screen.getByText('Apply to 2 items');
    await user.click(applyButton);

    expect(mockOnBulkUpdate).toHaveBeenCalledWith(['1', '2'], {
      stock_adjustment: {
        type: 'set',
        value: 20
      }
    });
  });

  it('handles activate items operation', async () => {
    const user = userEvent.setup();
    
    render(
      <BulkInventoryOperations
        selectedItems={mockSelectedItemIds} items={mockSelectedItems}
        categories={mockCategories}
        onBulkUpdate={mockOnBulkUpdate}
        onBulkDelete={mockOnBulkDelete}
        onExport={mockOnExport}
        onSelectAll={mockOnSelectAll}
        onClearSelection={mockOnClearSelection}
        totalItems={10}
      />
    );

    const activateButton = screen.getByText('Activate Items');
    await user.click(activateButton);

    expect(mockOnBulkUpdate).toHaveBeenCalledWith(['1', '2'], {
      status_change: 'active'
    });
  });

  it('shows confirmation dialog for destructive operations', async () => {
    const user = userEvent.setup();
    
    render(
      <BulkInventoryOperations
        selectedItems={mockSelectedItemIds} items={mockSelectedItems}
        categories={mockCategories}
        onBulkUpdate={mockOnBulkUpdate}
        onBulkDelete={mockOnBulkDelete}
        onExport={mockOnExport}
        onSelectAll={mockOnSelectAll}
        onClearSelection={mockOnClearSelection}
        totalItems={10}
      />
    );

    const deleteButton = screen.getByText('Delete Items');
    await user.click(deleteButton);

    expect(screen.getByText('Confirm Delete Items')).toBeInTheDocument();
    expect(screen.getByText('This action will affect 2 selected items.')).toBeInTheDocument();
    expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();
  });

  it('handles delete operation with confirmation', async () => {
    const user = userEvent.setup();
    
    render(
      <BulkInventoryOperations
        selectedItems={mockSelectedItemIds} items={mockSelectedItems}
        categories={mockCategories}
        onBulkUpdate={mockOnBulkUpdate}
        onBulkDelete={mockOnBulkDelete}
        onExport={mockOnExport}
        onSelectAll={mockOnSelectAll}
        onClearSelection={mockOnClearSelection}
        totalItems={10}
      />
    );

    // Click delete button
    const deleteButton = screen.getByText('Delete Items');
    await user.click(deleteButton);

    // Confirm deletion
    const confirmButton = screen.getByText('Continue');
    await user.click(confirmButton);

    expect(mockOnBulkDelete).toHaveBeenCalledWith(['1', '2']);
  });

  it('handles export operations', async () => {
    const user = userEvent.setup();
    
    render(
      <BulkInventoryOperations
        selectedItems={mockSelectedItemIds} items={mockSelectedItems}
        categories={mockCategories}
        onBulkUpdate={mockOnBulkUpdate}
        onBulkDelete={mockOnBulkDelete}
        onExport={mockOnExport}
        onSelectAll={mockOnSelectAll}
        onClearSelection={mockOnClearSelection}
        totalItems={10}
      />
    );

    // Change export format
    const formatSelect = screen.getByDisplayValue('CSV');
    await user.click(formatSelect);
    await user.click(screen.getByText('Excel'));

    // Export
    const exportButton = screen.getByText('Export EXCEL');
    await user.click(exportButton);

    expect(mockOnExport).toHaveBeenCalledWith(['1', '2'], 'excel');
  });

  it('shows "Select All" button when not all items are selected', () => {
    render(
      <BulkInventoryOperations
        selectedItems={mockSelectedItemIds} items={mockSelectedItems}
        categories={mockCategories}
        onBulkUpdate={mockOnBulkUpdate}
        onBulkDelete={mockOnBulkDelete}
        onExport={mockOnExport}
        onSelectAll={mockOnSelectAll}
        onClearSelection={mockOnClearSelection}
        totalItems={10}
      />
    );

    expect(screen.getByText('All (10)')).toBeInTheDocument();
  });

  it('hides "Select All" button when all items are selected', () => {
    render(
      <BulkInventoryOperations
        selectedItems={Array(10).fill(mockSelectedItems[0]).map((item, index) => ({ ...item, id: index.toString() }))}
        categories={mockCategories}
        onBulkUpdate={mockOnBulkUpdate}
        onBulkDelete={mockOnBulkDelete}
        onExport={mockOnExport}
        onSelectAll={mockOnSelectAll}
        onClearSelection={mockOnClearSelection}
        totalItems={10}
      />
    );

    expect(screen.queryByText('All (10)')).not.toBeInTheDocument();
  });

  it('shows truncated list when more than 10 items selected', () => {
    const manyItems = Array(15).fill(mockSelectedItems[0]).map((item, index) => ({
      ...item,
      id: index.toString(),
      name: `Item ${index + 1}`
    }));

    render(
      <BulkInventoryOperations
        selectedItems={manyItems}
        categories={mockCategories}
        onBulkUpdate={mockOnBulkUpdate}
        onBulkDelete={mockOnBulkDelete}
        onExport={mockOnExport}
        onSelectAll={mockOnSelectAll}
        onClearSelection={mockOnClearSelection}
        totalItems={20}
      />
    );

    expect(screen.getByText('... and 5 more items')).toBeInTheDocument();
  });

  it('prevents operations when no items are selected', async () => {
    const user = userEvent.setup();
    
    render(
      <BulkInventoryOperations
        selectedItems={[]}
        categories={mockCategories}
        onBulkUpdate={mockOnBulkUpdate}
        onBulkDelete={mockOnBulkDelete}
        onExport={mockOnExport}
        onSelectAll={mockOnSelectAll}
        onClearSelection={mockOnClearSelection}
        totalItems={10}
      />
    );

    // Try to click an operation button (should not work)
    const changeCategoryButton = screen.queryByText('Change Category');
    expect(changeCategoryButton).not.toBeInTheDocument();
  });
});
