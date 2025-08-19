import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoryForm } from '../CategoryForm';

const mockParentCategories = [
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
    updated_at: '2024-01-01T00:00:00Z'
  }
];

const mockTemplates = [
  {
    id: 'template1',
    name: 'Jewelry Template',
    description: 'Template for jewelry categories',
    template_data: {
      icon: '💍',
      color: '#f59e0b',
      attributes: [
        {
          id: 'attr1',
          name: 'Purity',
          type: 'select',
          required: true,
          options: ['14K', '18K', '22K', '24K']
        }
      ]
    },
    is_active: true,
    created_by: 'user1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

const defaultProps = {
  parentCategories: mockParentCategories,
  templates: mockTemplates,
  isOpen: true,
  onClose: jest.fn(),
  onSubmit: jest.fn(),
  isLoading: false
};

describe('CategoryForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders create form correctly', () => {
    render(<CategoryForm {...defaultProps} />);
    
    expect(screen.getByText('Create New Category')).toBeInTheDocument();
    expect(screen.getByLabelText('Category Name *')).toBeInTheDocument();
    expect(screen.getByLabelText('Parent Category')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
  });

  it('renders edit form correctly', () => {
    const category = {
      id: '2',
      name: 'Rings',
      parent_id: '1',
      description: 'Ring collection',
      icon: '💍',
      color: '#ef4444',
      attributes: [],
      metadata: {},
      sort_order: 0,
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    };

    render(<CategoryForm {...defaultProps} category={category} />);
    
    expect(screen.getByText('Edit Category')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Rings')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Ring collection')).toBeInTheDocument();
  });

  it('shows template selection for new categories', () => {
    render(<CategoryForm {...defaultProps} />);
    
    expect(screen.getByText('Quick Start with Template')).toBeInTheDocument();
    expect(screen.getByText('Choose a template (optional)')).toBeInTheDocument();
  });

  it('applies template when selected', async () => {
    const user = userEvent.setup();
    render(<CategoryForm {...defaultProps} />);
    
    // Select template
    const templateSelect = screen.getByRole('combobox');
    await user.click(templateSelect);
    await user.click(screen.getByText('Jewelry Template'));
    
    // Check if template data is applied
    expect(screen.getByDisplayValue('💍')).toBeInTheDocument();
    expect(screen.getByDisplayValue('#f59e0b')).toBeInTheDocument();
  });

  it('handles form submission', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    
    render(<CategoryForm {...defaultProps} onSubmit={onSubmit} />);
    
    // Fill form
    await user.type(screen.getByLabelText('Category Name *'), 'Test Category');
    await user.type(screen.getByLabelText('Description'), 'Test description');
    
    // Submit form
    await user.click(screen.getByText('Create Category'));
    
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'Test Category',
        parent_id: '',
        description: 'Test description',
        icon: '',
        color: '#f59e0b',
        attributes: [],
        metadata: {},
        sort_order: 0,
        is_active: true
      });
    });
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    render(<CategoryForm {...defaultProps} />);
    
    // Try to submit without required fields
    await user.click(screen.getByText('Create Category'));
    
    // Should show validation error
    expect(screen.getByText('Category name is required')).toBeInTheDocument();
  });

  it('handles custom attributes', async () => {
    const user = userEvent.setup();
    render(<CategoryForm {...defaultProps} />);
    
    // Add attribute
    await user.click(screen.getByText('Add Attribute'));
    
    // Fill attribute details
    const attributeNameInput = screen.getByPlaceholderText('e.g., Purity, Size, Style');
    await user.type(attributeNameInput, 'Test Attribute');
    
    // Change attribute type to select
    const typeSelect = screen.getByRole('combobox');
    await user.click(typeSelect);
    await user.click(screen.getByText('Select (Dropdown)'));
    
    // Add options
    await user.click(screen.getByText('Add Option'));
    const optionInput = screen.getByPlaceholderText('Option 1');
    await user.type(optionInput, 'Option A');
    
    expect(screen.getByDisplayValue('Test Attribute')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Option A')).toBeInTheDocument();
  });

  it('removes attributes correctly', async () => {
    const user = userEvent.setup();
    render(<CategoryForm {...defaultProps} />);
    
    // Add attribute
    await user.click(screen.getByText('Add Attribute'));
    
    // Remove attribute
    const removeButton = screen.getByRole('button', { name: /trash/i });
    await user.click(removeButton);
    
    expect(screen.queryByPlaceholderText('e.g., Purity, Size, Style')).not.toBeInTheDocument();
  });

  it('handles color picker', async () => {
    const user = userEvent.setup();
    render(<CategoryForm {...defaultProps} />);
    
    // Open color picker
    const colorButton = screen.getByRole('button', { name: /palette/i });
    await user.click(colorButton);
    
    // Select a color
    const colorOptions = screen.getAllByRole('button');
    const redColor = colorOptions.find(btn => 
      btn.style.backgroundColor === 'rgb(239, 68, 68)'
    );
    if (redColor) {
      await user.click(redColor);
    }
    
    expect(screen.getByDisplayValue('#ef4444')).toBeInTheDocument();
  });

  it('handles icon picker', async () => {
    const user = userEvent.setup();
    render(<CategoryForm {...defaultProps} />);
    
    // Open icon picker
    const iconButton = screen.getByRole('button', { name: /smile/i });
    await user.click(iconButton);
    
    // Select an icon
    await user.click(screen.getByText('📿'));
    
    expect(screen.getByDisplayValue('📿')).toBeInTheDocument();
  });

  it('shows advanced settings when expanded', async () => {
    const user = userEvent.setup();
    render(<CategoryForm {...defaultProps} />);
    
    // Expand advanced settings
    await user.click(screen.getByText('Advanced Settings'));
    
    expect(screen.getByLabelText('Sort Order')).toBeInTheDocument();
    expect(screen.getByLabelText('Active')).toBeInTheDocument();
  });

  it('handles parent category selection', async () => {
    const user = userEvent.setup();
    render(<CategoryForm {...defaultProps} />);
    
    // Select parent category
    const parentSelect = screen.getByRole('combobox');
    await user.click(parentSelect);
    await user.click(screen.getByText('Jewelry'));
    
    // Form should have parent_id set
    await user.type(screen.getByLabelText('Category Name *'), 'Test Category');
    await user.click(screen.getByText('Create Category'));
    
    await waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          parent_id: '1'
        })
      );
    });
  });

  it('handles form cancellation', async () => {
    const user = userEvent.setup();
    render(<CategoryForm {...defaultProps} />);
    
    await user.click(screen.getByText('Cancel'));
    
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('shows loading state', () => {
    render(<CategoryForm {...defaultProps} isLoading={true} />);
    
    expect(screen.getByText('Saving...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
  });

  it('handles attribute options for select type', async () => {
    const user = userEvent.setup();
    render(<CategoryForm {...defaultProps} />);
    
    // Add attribute
    await user.click(screen.getByText('Add Attribute'));
    
    // Set type to select
    const typeSelect = screen.getByRole('combobox');
    await user.click(typeSelect);
    await user.click(screen.getByText('Select (Dropdown)'));
    
    // Add multiple options
    await user.click(screen.getByText('Add Option'));
    await user.click(screen.getByText('Add Option'));
    
    const optionInputs = screen.getAllByPlaceholderText(/Option \d+/);
    expect(optionInputs).toHaveLength(2);
    
    // Fill options
    await user.type(optionInputs[0], 'Option 1');
    await user.type(optionInputs[1], 'Option 2');
    
    // Remove an option
    const removeButtons = screen.getAllByRole('button', { name: /x/i });
    await user.click(removeButtons[0]);
    
    expect(screen.queryByDisplayValue('Option 1')).not.toBeInTheDocument();
    expect(screen.getByDisplayValue('Option 2')).toBeInTheDocument();
  });
});