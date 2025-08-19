import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdvancedFilterPanel } from '../AdvancedFilterPanel';

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
  },
  {
    id: '3',
    name: 'Necklaces',
    parent_id: '1',
    description: 'Gold necklaces',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '4',
    name: 'Bracelets',
    parent_id: null,
    description: 'All bracelets',
    created_at: '2024-01-01T00:00:00Z'
  }
];

const defaultFilters = {
  search: '',
  categories: [],
  priceRange: {},
  stockRange: {},
  weightRange: {},
  dateRange: {},
  status: ['active' as const],
  stockStatus: ['in_stock' as const, 'low_stock' as const],
  sortBy: 'name' as const,
  sortOrder: 'asc' as const,
};

const mockPresets = [
  {
    id: '1',
    name: 'Low Stock Items',
    filters: {
      ...defaultFilters,
      stockStatus: ['low_stock' as const, 'out_of_stock' as const]
    },
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'High Value Items',
    filters: {
      ...defaultFilters,
      priceRange: { min: 500 }
    },
    createdAt: '2024-01-01T00:00:00Z'
  }
];

describe('AdvancedFilterPanel', () => {
  const mockOnFiltersChange = jest.fn();
  const mockOnSavePreset = jest.fn();
  const mockOnDeletePreset = jest.fn();
  const mockOnToggle = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders collapsed state correctly', () => {
    render(
      <AdvancedFilterPanel
        categories={mockCategories}
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
        isOpen={false}
        onToggle={mockOnToggle}
      />
    );

    expect(screen.getByText('Filters')).toBeInTheDocument();
    expect(screen.queryByText('Advanced Filters')).not.toBeInTheDocument();
  });

  it('shows active filters count in collapsed state', () => {
    const filtersWithActive = {
      ...defaultFilters,
      search: 'test',
      categories: ['1', '2']
    };

    render(
      <AdvancedFilterPanel
        categories={mockCategories}
        filters={filtersWithActive}
        onFiltersChange={mockOnFiltersChange}
        isOpen={false}
        onToggle={mockOnToggle}
      />
    );

    expect(screen.getByText('2')).toBeInTheDocument(); // Badge showing active filters count
  });

  it('renders expanded state correctly', () => {
    render(
      <AdvancedFilterPanel
        categories={mockCategories}
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
        isOpen={true}
        onToggle={mockOnToggle}
      />
    );

    expect(screen.getByText('Advanced Filters')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search products...')).toBeInTheDocument();
    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(screen.getByText('Price Range')).toBeInTheDocument();
    expect(screen.getByText('Stock Range')).toBeInTheDocument();
  });

  it('displays filter presets', () => {
    render(
      <AdvancedFilterPanel
        categories={mockCategories}
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
        presets={mockPresets}
        isOpen={true}
        onToggle={mockOnToggle}
      />
    );

    expect(screen.getByText('Quick Filters')).toBeInTheDocument();
    expect(screen.getByText('Low Stock Items')).toBeInTheDocument();
    expect(screen.getByText('High Value Items')).toBeInTheDocument();
  });

  it('handles search input changes', async () => {
    const user = userEvent.setup();
    
    render(
      <AdvancedFilterPanel
        categories={mockCategories}
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
        isOpen={true}
        onToggle={mockOnToggle}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search products...');
    await user.type(searchInput, 'gold ring');

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...defaultFilters,
      search: 'gold ring'
    });
  });

  it('displays category hierarchy', () => {
    render(
      <AdvancedFilterPanel
        categories={mockCategories}
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
        isOpen={true}
        onToggle={mockOnToggle}
      />
    );

    expect(screen.getByText('Jewelry')).toBeInTheDocument();
    expect(screen.getByText('Bracelets')).toBeInTheDocument();
  });

  it('handles category selection', async () => {
    const user = userEvent.setup();
    
    render(
      <AdvancedFilterPanel
        categories={mockCategories}
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
        isOpen={true}
        onToggle={mockOnToggle}
      />
    );

    // Find and click the checkbox for Jewelry category
    const jewelryCheckbox = screen.getByRole('checkbox', { name: /jewelry/i });
    await user.click(jewelryCheckbox);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...defaultFilters,
      categories: ['1']
    });
  });

  it('handles price range inputs', async () => {
    const user = userEvent.setup();
    
    render(
      <AdvancedFilterPanel
        categories={mockCategories}
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
        isOpen={true}
        onToggle={mockOnToggle}
      />
    );

    const minPriceInput = screen.getByLabelText('Min ($)');
    const maxPriceInput = screen.getByLabelText('Max ($)');

    await user.type(minPriceInput, '100');
    await user.type(maxPriceInput, '500');

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...defaultFilters,
      priceRange: { min: 100, max: 500 }
    });
  });

  it('handles stock range inputs', async () => {
    const user = userEvent.setup();
    
    render(
      <AdvancedFilterPanel
        categories={mockCategories}
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
        isOpen={true}
        onToggle={mockOnToggle}
      />
    );

    const minStockInput = screen.getByLabelText('Min', { selector: 'input[type="number"]' });
    await user.type(minStockInput, '5');

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...defaultFilters,
      stockRange: { min: 5 }
    });
  });

  it('handles status filter changes', async () => {
    const user = userEvent.setup();
    
    render(
      <AdvancedFilterPanel
        categories={mockCategories}
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
        isOpen={true}
        onToggle={mockOnToggle}
      />
    );

    const inactiveCheckbox = screen.getByRole('checkbox', { name: /inactive/i });
    await user.click(inactiveCheckbox);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...defaultFilters,
      status: ['active' as const, 'inactive' as const]
    });
  });

  it('handles sort options', async () => {
    const user = userEvent.setup();
    
    render(
      <AdvancedFilterPanel
        categories={mockCategories}
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
        isOpen={true}
        onToggle={mockOnToggle}
      />
    );

    // Find sort by select
    const sortBySelect = screen.getByDisplayValue('Name');
    await user.click(sortBySelect);
    await user.click(screen.getByText('Price'));

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...defaultFilters,
      sortBy: 'price'
    });
  });

  it('applies preset filters', async () => {
    const user = userEvent.setup();
    
    render(
      <AdvancedFilterPanel
        categories={mockCategories}
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
        presets={mockPresets}
        isOpen={true}
        onToggle={mockOnToggle}
      />
    );

    const lowStockPreset = screen.getByText('Low Stock Items');
    await user.click(lowStockPreset);

    expect(mockOnFiltersChange).toHaveBeenCalledWith(mockPresets[0].filters);
  });

  it('clears all filters', async () => {
    const user = userEvent.setup();
    const filtersWithData = {
      ...defaultFilters,
      search: 'test',
      categories: ['1'],
      priceRange: { min: 100 }
    };
    
    render(
      <AdvancedFilterPanel
        categories={mockCategories}
        filters={filtersWithData}
        onFiltersChange={mockOnFiltersChange}
        isOpen={true}
        onToggle={mockOnToggle}
      />
    );

    const clearButton = screen.getByRole('button', { name: /clear/i });
    await user.click(clearButton);

    expect(mockOnFiltersChange).toHaveBeenCalledWith(defaultFilters);
  });

  it('saves current filters as preset', async () => {
    const user = userEvent.setup();
    const filtersWithData = {
      ...defaultFilters,
      search: 'test',
      categories: ['1']
    };
    
    render(
      <AdvancedFilterPanel
        categories={mockCategories}
        filters={filtersWithData}
        onFiltersChange={mockOnFiltersChange}
        onSavePreset={mockOnSavePreset}
        isOpen={true}
        onToggle={mockOnToggle}
      />
    );

    // Click save preset button
    const saveButton = screen.getByText('Save Current Filters');
    await user.click(saveButton);

    // Enter preset name
    const nameInput = screen.getByPlaceholderText('Preset name...');
    await user.type(nameInput, 'My Custom Filter');

    // Save the preset
    const confirmSaveButton = screen.getByRole('button', { name: /save/i });
    await user.click(confirmSaveButton);

    expect(mockOnSavePreset).toHaveBeenCalledWith('My Custom Filter', filtersWithData);
  });

  it('toggles panel visibility', async () => {
    const user = userEvent.setup();
    
    render(
      <AdvancedFilterPanel
        categories={mockCategories}
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
        isOpen={true}
        onToggle={mockOnToggle}
      />
    );

    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    expect(mockOnToggle).toHaveBeenCalled();
  });

  it('expands and collapses sections', async () => {
    const user = userEvent.setup();
    
    render(
      <AdvancedFilterPanel
        categories={mockCategories}
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
        isOpen={true}
        onToggle={mockOnToggle}
      />
    );

    // Categories section should be expanded by default
    expect(screen.getByText('Jewelry')).toBeInTheDocument();

    // Click to collapse categories section
    const categoriesToggle = screen.getByRole('button', { name: /categories/i });
    await user.click(categoriesToggle);

    // Categories should be hidden
    expect(screen.queryByText('Jewelry')).not.toBeInTheDocument();
  });

  it('shows selected categories count', () => {
    const filtersWithCategories = {
      ...defaultFilters,
      categories: ['1', '2']
    };
    
    render(
      <AdvancedFilterPanel
        categories={mockCategories}
        filters={filtersWithCategories}
        onFiltersChange={mockOnFiltersChange}
        isOpen={true}
        onToggle={mockOnToggle}
      />
    );

    expect(screen.getByText('2')).toBeInTheDocument(); // Badge showing selected categories count
  });

  it('disables save preset when no filters are active', () => {
    render(
      <AdvancedFilterPanel
        categories={mockCategories}
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
        onSavePreset={mockOnSavePreset}
        isOpen={true}
        onToggle={mockOnToggle}
      />
    );

    const saveButton = screen.getByText('Save Current Filters');
    expect(saveButton).toBeDisabled();
  });

  it('handles weight range inputs', async () => {
    const user = userEvent.setup();
    
    render(
      <AdvancedFilterPanel
        categories={mockCategories}
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
        isOpen={true}
        onToggle={mockOnToggle}
      />
    );

    const minWeightInput = screen.getByLabelText('Min (g)');
    const maxWeightInput = screen.getByLabelText('Max (g)');

    await user.type(minWeightInput, '1.5');
    await user.type(maxWeightInput, '10.0');

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...defaultFilters,
      weightRange: { min: 1.5, max: 10.0 }
    });
  });
});