import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoryBulkOperations } from '../CategoryBulkOperations';

const mockCategories = [
  {
    id: '1',
    name: 'Jewelry',
    parent_id: null,
    description: 'All jewelry items',
    icon: '💍',
    color: '#f59e0b',
    attributes: [],
    metadata: {},
    sort_order: 0,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    children: [],
    product_count: 10
  },
  {
    id: '2',
    name: 'Electronics',
    parent_id: null,
    description: 'Electronic items',
    icon: '📱',
    color: '#3b82f6',
    attributes: [],
    metadata: {},
    sort_order: 1,
    is_active: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    children: [],
    product_count: 0
  }
];

const defaultProps = {
  categories: mockCategories,
  selectedCategories: new Set<string>(),
  onSelectionChange: jest.fn(),
  onBulkUpdate: jest.fn(),
  onBulkDelete: jest.fn(),
  onBulkMove: jest.fn(),
  isLoading: false
};

describe('CategoryBulkOperations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders bulk operations interface', () => {
    render(<CategoryBulkOperations {...defaultProps} />);
    
    expect(screen.getByText('Bulk Operations')).toBeInTheDocument();
    expect(screen.getByText('Select All')).toBeInTheDocument();
    expect(screen.getByText('Jewelry')).toBeInTheDocument();
    expect(screen.getByText('Electronics')).toBeInTheDocument();
  });

  it('shows selected count in badge', () => {
    const selectedCategories = new Set(['1']);
    render(<CategoryBulkOperations {...defaultProps} selectedCategories={selectedCategories} />);
    
    expect(screen.getByText('1 selected')).toBeInTheDocument();
  });

  it('handles select all functionality', async () => {
    const onSelectionChange = jest.fn();
    const user = userEvent.setup();
    
    render(<CategoryBulkOperations {...defaultProps} onSelectionChange={onSelectionChange} />);
    
    await user.click(screen.getByText('Select All'));
    
    expect(onSelectionChange).toHaveBeenCalledWith(new Set(['1', '2']));
  });

  it('handles deselect all when all are selected', async () => {
    const onSelectionChange = jest.fn();
    const selectedCategories = new Set(['1', '2']);
    const user = userEvent.setup();
    
    render(
      <CategoryBulkOperations 
        {...defaultProps} 
        selectedCategories={selectedCategories}
        onSelectionChange={onSelectionChange} 
      />
    );
    
    await user.click(screen.getByText('Deselect All'));
    
    expect(onSelectionChange).toHaveBeenCalledWith(new Set());
  });

  it('handles individual category selection', async () => {
    const onSelectionChange = jest.fn();
    const user = userEvent.setup();
    
    render(<CategoryBulkOperations {...defaultProps} onSelectionChange={onSelectionChange} />);
    
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]); // First category checkbox
    
    expect(onSelectionChange).toHaveBeenCalled();
  });

  it('shows product count badges', () => {
    render(<CategoryBulkOperations {...defaultProps} />);
    
    expect(screen.getByText('10 products')).toBeInTheDocument();
    expect(screen.getByText('0 products')).toBeInTheDocument();
  });

  it('shows inactive badge for inactive categories', () => {
    render(<CategoryBulkOperations {...defaultProps} />);
    
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('disables action buttons when no categories selected', () => {
    render(<CategoryBulkOperations {...defaultProps} />);
    
    expect(screen.getByText('Update Selected (0)')).toBeDisabled();
    expect(screen.getByText('Move Selected')).toBeDisabled();
    expect(screen.getByText('Delete Selected')).toBeDisabled();
  });

  it('enables action buttons when categories selected', () => {
    const selectedCategories = new Set(['1']);
    render(<CategoryBulkOperations {...defaultProps} selectedCategories={selectedCategories} />);
    
    expect(screen.getByText('Update Selected (1)')).not.toBeDisabled();
    expect(screen.getByText('Move Selected')).not.toBeDisabled();
    expect(screen.getByText('Delete Selected')).not.toBeDisabled();
  });

  it('opens bulk update dialog', async () => {
    const selectedCategories = new Set(['1']);
    const user = userEvent.setup();
    
    render(<CategoryBulkOperations {...defaultProps} selectedCategories={selectedCategories} />);
    
    await user.click(screen.getByText('Update Selected (1)'));
    
    expect(screen.getByText('Bulk Update Categories')).toBeInTheDocument();
    expect(screen.getByText('This will affect 1 selected categories.')).toBeInTheDocument();
  });

  it('opens bulk move dialog', async () => {
    const selectedCategories = new Set(['1']);
    const user = userEvent.setup();
    
    render(<CategoryBulkOperations {...defaultProps} selectedCategories={selectedCategories} />);
    
    await user.click(screen.getByText('Move Selected'));
    
    expect(screen.getByText('Move Categories')).toBeInTheDocument();
  });

  it('opens delete confirmation dialog', async () => {
    const selectedCategories = new Set(['1']);
    const user = userEvent.setup();
    
    render(<CategoryBulkOperations {...defaultProps} selectedCategories={selectedCategories} />);
    
    await user.click(screen.getByText('Delete Selected'));
    
    expect(screen.getByText('Delete Categories')).toBeInTheDocument();
    expect(screen.getByText('You are about to delete 1 categories. This action cannot be undone.')).toBeInTheDocument();
  });

  it('handles bulk update form submission', async () => {
    const selectedCategories = new Set(['1']);
    const onBulkUpdate = jest.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    
    render(
      <CategoryBulkOperations 
        {...defaultProps} 
        selectedCategories={selectedCategories}
        onBulkUpdate={onBulkUpdate}
      />
    );
    
    // Open update dialog
    await user.click(screen.getByText('Update Selected (1)'));
    
    // Change status
    const statusSelect = screen.getByRole('combobox');
    await user.click(statusSelect);
    await user.click(screen.getByText('Inactive'));
    
    // Submit
    await user.click(screen.getByText('Apply Changes'));
    
    await waitFor(() => {
      expect(onBulkUpdate).toHaveBeenCalledWith(['1'], { is_active: false });
    });
  });

  it('handles bulk move form submission', async () => {
    const selectedCategories = new Set(['2']);
    const onBulkMove = jest.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    
    render(
      <CategoryBulkOperations 
        {...defaultProps} 
        selectedCategories={selectedCategories}
        onBulkMove={onBulkMove}
      />
    );
    
    // Open move dialog
    await user.click(screen.getByText('Move Selected'));
    
    // Select new parent
    const parentSelect = screen.getByRole('combobox');
    await user.click(parentSelect);
    await user.click(screen.getByText('Jewelry'));
    
    // Submit
    await user.click(screen.getByText('Apply Changes'));
    
    await waitFor(() => {
      expect(onBulkMove).toHaveBeenCalledWith(['2'], '1');
    });
  });

  it('handles bulk delete confirmation', async () => {
    const selectedCategories = new Set(['2']); // Electronics with 0 products
    const onBulkDelete = jest.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    
    render(
      <CategoryBulkOperations 
        {...defaultProps} 
        selectedCategories={selectedCategories}
        onBulkDelete={onBulkDelete}
      />
    );
    
    // Open delete dialog
    await user.click(screen.getByText('Delete Selected'));
    
    // Confirm delete
    await user.click(screen.getByText('Delete Categories'));
    
    await waitFor(() => {
      expect(onBulkDelete).toHaveBeenCalledWith(['2'], false);
    });
  });

  it('shows warning for categories with products', async () => {
    const selectedCategories = new Set(['1']); // Jewelry with 10 products
    const user = userEvent.setup();
    
    render(<CategoryBulkOperations {...defaultProps} selectedCategories={selectedCategories} />);
    
    // Open delete dialog
    await user.click(screen.getByText('Delete Selected'));
    
    expect(screen.getByText('Warning: Categories with products')).toBeInTheDocument();
    expect(screen.getByText('• Jewelry (10 products)')).toBeInTheDocument();
    expect(screen.getByText('Force delete (products will be moved to uncategorized)')).toBeInTheDocument();
  });

  it('requires force delete for categories with products', async () => {
    const selectedCategories = new Set(['1']); // Jewelry with 10 products
    const user = userEvent.setup();
    
    render(<CategoryBulkOperations {...defaultProps} selectedCategories={selectedCategories} />);
    
    // Open delete dialog
    await user.click(screen.getByText('Delete Selected'));
    
    // Delete button should be disabled initially
    const deleteButton = screen.getByText('Delete Categories');
    expect(deleteButton).toBeDisabled();
    
    // Enable force delete
    await user.click(screen.getByLabelText('Force delete (products will be moved to uncategorized)'));
    
    expect(deleteButton).not.toBeDisabled();
  });

  it('handles dialog cancellation', async () => {
    const selectedCategories = new Set(['1']);
    const user = userEvent.setup();
    
    render(<CategoryBulkOperations {...defaultProps} selectedCategories={selectedCategories} />);
    
    // Open update dialog
    await user.click(screen.getByText('Update Selected (1)'));
    
    // Cancel
    await user.click(screen.getByText('Cancel'));
    
    expect(screen.queryByText('Bulk Update Categories')).not.toBeInTheDocument();
  });

  it('shows loading state', () => {
    const selectedCategories = new Set(['1']);
    render(
      <CategoryBulkOperations 
        {...defaultProps} 
        selectedCategories={selectedCategories}
        isLoading={true}
      />
    );
    
    expect(screen.getByText('Update Selected (1)')).toBeDisabled();
    expect(screen.getByText('Move Selected')).toBeDisabled();
    expect(screen.getByText('Delete Selected')).toBeDisabled();
  });

  it('handles bulk update with multiple fields', async () => {
    const selectedCategories = new Set(['1', '2']);
    const onBulkUpdate = jest.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    
    render(
      <CategoryBulkOperations 
        {...defaultProps} 
        selectedCategories={selectedCategories}
        onBulkUpdate={onBulkUpdate}
      />
    );
    
    // Open update dialog
    await user.click(screen.getByText('Update Selected (2)'));
    
    // Update multiple fields
    await user.type(screen.getByLabelText('Color'), '#ff0000');
    await user.type(screen.getByLabelText('Icon'), '🔥');
    
    // Submit
    await user.click(screen.getByText('Apply Changes'));
    
    await waitFor(() => {
      expect(onBulkUpdate).toHaveBeenCalledWith(['1', '2'], {
        color: '#ff0000',
        icon: '🔥'
      });
    });
  });
});