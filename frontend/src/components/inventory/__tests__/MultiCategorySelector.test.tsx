import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MultiCategorySelector } from '../MultiCategorySelector';

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
    name: 'Wedding Rings',
    parent_id: '2',
    description: 'Wedding rings',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '4',
    name: 'Necklaces',
    parent_id: '1',
    description: 'Gold necklaces',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '5',
    name: 'Bracelets',
    parent_id: null,
    description: 'All bracelets',
    created_at: '2024-01-01T00:00:00Z'
  }
];

describe('MultiCategorySelector', () => {
  const mockOnSelectionChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with placeholder text', () => {
    render(
      <MultiCategorySelector
        categories={mockCategories}
        selectedCategories={[]}
        onSelectionChange={mockOnSelectionChange}
        placeholder="Select categories..."
      />
    );

    expect(screen.getByText('Select categories...')).toBeInTheDocument();
  });

  it('displays selected categories count', () => {
    render(
      <MultiCategorySelector
        categories={mockCategories}
        selectedCategories={['1', '2']}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    expect(screen.getByText('2 categories selected')).toBeInTheDocument();
  });

  it('opens category tree when clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <MultiCategorySelector
        categories={mockCategories}
        selectedCategories={[]}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    const trigger = screen.getByRole('combobox');
    await user.click(trigger);

    expect(screen.getByText('Jewelry')).toBeInTheDocument();
    expect(screen.getByText('Bracelets')).toBeInTheDocument();
  });

  it('shows hierarchical category structure', async () => {
    const user = userEvent.setup();
    
    render(
      <MultiCategorySelector
        categories={mockCategories}
        selectedCategories={[]}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    const trigger = screen.getByRole('combobox');
    await user.click(trigger);

    // Expand Jewelry category
    const jewelryExpander = screen.getByRole('button', { name: /expand/i });
    await user.click(jewelryExpander);

    expect(screen.getByText('Rings')).toBeInTheDocument();
    expect(screen.getByText('Necklaces')).toBeInTheDocument();
  });

  it('handles category selection', async () => {
    const user = userEvent.setup();
    
    render(
      <MultiCategorySelector
        categories={mockCategories}
        selectedCategories={[]}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    const trigger = screen.getByRole('combobox');
    await user.click(trigger);

    // Select Jewelry category
    const jewelryCheckbox = screen.getByLabelText('Jewelry');
    await user.click(jewelryCheckbox);

    expect(mockOnSelectionChange).toHaveBeenCalledWith(['1']);
  });

  it('handles multiple category selection', async () => {
    const user = userEvent.setup();
    
    render(
      <MultiCategorySelector
        categories={mockCategories}
        selectedCategories={['1']}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    const trigger = screen.getByRole('combobox');
    await user.click(trigger);

    // Select Bracelets category
    const braceletsCheckbox = screen.getByLabelText('Bracelets');
    await user.click(braceletsCheckbox);

    expect(mockOnSelectionChange).toHaveBeenCalledWith(['1', '5']);
  });

  it('handles category deselection', async () => {
    const user = userEvent.setup();
    
    render(
      <MultiCategorySelector
        categories={mockCategories}
        selectedCategories={['1', '5']}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    const trigger = screen.getByRole('combobox');
    await user.click(trigger);

    // Deselect Jewelry category
    const jewelryCheckbox = screen.getByLabelText('Jewelry');
    await user.click(jewelryCheckbox);

    expect(mockOnSelectionChange).toHaveBeenCalledWith(['5']);
  });

  it('respects maximum selection limit', async () => {
    const user = userEvent.setup();
    
    render(
      <MultiCategorySelector
        categories={mockCategories}
        selectedCategories={['1', '5']}
        onSelectionChange={mockOnSelectionChange}
        maxSelections={2}
      />
    );

    const trigger = screen.getByRole('combobox');
    await user.click(trigger);

    // Try to select a third category
    const braceletsCheckbox = screen.getByLabelText('Bracelets');
    expect(braceletsCheckbox).toBeDisabled();
  });

  it('shows selected categories with badges', () => {
    render(
      <MultiCategorySelector
        categories={mockCategories}
        selectedCategories={['1', '2']}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    expect(screen.getByText('Jewelry (Primary)')).toBeInTheDocument();
    expect(screen.getByText('Jewelry > Rings')).toBeInTheDocument();
  });

  it('handles category removal from badges', async () => {
    const user = userEvent.setup();
    
    render(
      <MultiCategorySelector
        categories={mockCategories}
        selectedCategories={['1', '2']}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    // Remove the second category
    const removeButtons = screen.getAllByRole('button', { name: /remove/i });
    await user.click(removeButtons[1]);

    expect(mockOnSelectionChange).toHaveBeenCalledWith(['1']);
  });

  it('filters categories based on search', async () => {
    const user = userEvent.setup();
    
    render(
      <MultiCategorySelector
        categories={mockCategories}
        selectedCategories={[]}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    const trigger = screen.getByRole('combobox');
    await user.click(trigger);

    // Search for "ring"
    const searchInput = screen.getByPlaceholderText('Search categories...');
    await user.type(searchInput, 'ring');

    // Should show Rings and Wedding Rings
    expect(screen.getByText('Rings')).toBeInTheDocument();
    expect(screen.getByText('Wedding Rings')).toBeInTheDocument();
    // Should not show Necklaces or Bracelets
    expect(screen.queryByText('Necklaces')).not.toBeInTheDocument();
    expect(screen.queryByText('Bracelets')).not.toBeInTheDocument();
  });

  it('shows category descriptions', async () => {
    const user = userEvent.setup();
    
    render(
      <MultiCategorySelector
        categories={mockCategories}
        selectedCategories={[]}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    const trigger = screen.getByRole('combobox');
    await user.click(trigger);

    expect(screen.getByText('All jewelry items')).toBeInTheDocument();
    expect(screen.getByText('All bracelets')).toBeInTheDocument();
  });

  it('handles disabled state', () => {
    render(
      <MultiCategorySelector
        categories={mockCategories}
        selectedCategories={[]}
        onSelectionChange={mockOnSelectionChange}
        disabled={true}
      />
    );

    const trigger = screen.getByRole('combobox');
    expect(trigger).toBeDisabled();
  });

  it('shows selection limit indicator', async () => {
    const user = userEvent.setup();
    
    render(
      <MultiCategorySelector
        categories={mockCategories}
        selectedCategories={['1']}
        onSelectionChange={mockOnSelectionChange}
        maxSelections={3}
      />
    );

    const trigger = screen.getByRole('combobox');
    await user.click(trigger);

    expect(screen.getByText('1 of 3 categories selected')).toBeInTheDocument();
  });

  it('handles empty categories list', () => {
    render(
      <MultiCategorySelector
        categories={[]}
        selectedCategories={[]}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    const trigger = screen.getByRole('combobox');
    expect(trigger).toBeInTheDocument();
    expect(screen.getByText('Select categories...')).toBeInTheDocument();
  });

  it('shows no categories found message', async () => {
    const user = userEvent.setup();
    
    render(
      <MultiCategorySelector
        categories={mockCategories}
        selectedCategories={[]}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    const trigger = screen.getByRole('combobox');
    await user.click(trigger);

    // Search for something that doesn't exist
    const searchInput = screen.getByPlaceholderText('Search categories...');
    await user.type(searchInput, 'nonexistent');

    expect(screen.getByText('No categories found.')).toBeInTheDocument();
  });

  it('maintains expanded state during search', async () => {
    const user = userEvent.setup();
    
    render(
      <MultiCategorySelector
        categories={mockCategories}
        selectedCategories={[]}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    const trigger = screen.getByRole('combobox');
    await user.click(trigger);

    // Expand Jewelry category
    const jewelryExpander = screen.getByRole('button', { name: /expand/i });
    await user.click(jewelryExpander);

    // Search should still show expanded structure
    const searchInput = screen.getByPlaceholderText('Search categories...');
    await user.type(searchInput, 'jewelry');

    expect(screen.getByText('Rings')).toBeInTheDocument();
    expect(screen.getByText('Necklaces')).toBeInTheDocument();
  });
});