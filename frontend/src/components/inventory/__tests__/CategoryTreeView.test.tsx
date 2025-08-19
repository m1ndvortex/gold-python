import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CategoryTreeView } from '../CategoryTreeView';

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
    children: [
      {
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
        updated_at: '2024-01-01T00:00:00Z',
        children: [],
        product_count: 5
      }
    ],
    product_count: 10
  },
  {
    id: '3',
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
  selectedCategory: '',
  expandedCategories: new Set<string>(),
  onCategorySelect: jest.fn(),
  onCategoryEdit: jest.fn(),
  onCategoryDelete: jest.fn(),
  onCategoryAdd: jest.fn(),
  onToggleExpanded: jest.fn(),
  isDragMode: false
};

describe('CategoryTreeView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders category tree correctly', () => {
    render(<CategoryTreeView {...defaultProps} />);
    
    expect(screen.getByText('Jewelry')).toBeInTheDocument();
    expect(screen.getByText('Electronics')).toBeInTheDocument();
    expect(screen.getByText('💍')).toBeInTheDocument();
    expect(screen.getByText('📱')).toBeInTheDocument();
  });

  it('displays product counts as badges', () => {
    render(<CategoryTreeView {...defaultProps} />);
    
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('shows inactive categories with reduced opacity', () => {
    render(<CategoryTreeView {...defaultProps} />);
    
    const electronicsCategory = screen.getByText('Electronics').closest('div[class*="opacity-50"]');
    expect(electronicsCategory).toBeInTheDocument();
  });

  it('handles category selection', () => {
    const onCategorySelect = jest.fn();
    render(<CategoryTreeView {...defaultProps} onCategorySelect={onCategorySelect} />);
    
    fireEvent.click(screen.getByText('Jewelry'));
    expect(onCategorySelect).toHaveBeenCalledWith(mockCategories[0]);
  });

  it('handles category expansion', () => {
    const onToggleExpanded = jest.fn();
    render(<CategoryTreeView {...defaultProps} onToggleExpanded={onToggleExpanded} />);
    
    const expandButton = screen.getAllByRole('button')[0]; // First expand button
    fireEvent.click(expandButton);
    expect(onToggleExpanded).toHaveBeenCalledWith('1');
  });

  it('shows expanded children when category is expanded', () => {
    const expandedCategories = new Set(['1']);
    render(<CategoryTreeView {...defaultProps} expandedCategories={expandedCategories} />);
    
    expect(screen.getByText('Rings')).toBeInTheDocument();
  });

  it('handles edit button click', () => {
    const onCategoryEdit = jest.fn();
    render(<CategoryTreeView {...defaultProps} onCategoryEdit={onCategoryEdit} />);
    
    const editButtons = screen.getAllByTitle('Edit category');
    fireEvent.click(editButtons[0]);
    expect(onCategoryEdit).toHaveBeenCalledWith(mockCategories[0]);
  });

  it('handles delete button click', () => {
    const onCategoryDelete = jest.fn();
    render(<CategoryTreeView {...defaultProps} onCategoryDelete={onCategoryDelete} />);
    
    const deleteButtons = screen.getAllByTitle('Delete category');
    fireEvent.click(deleteButtons[0]);
    expect(onCategoryDelete).toHaveBeenCalledWith(mockCategories[0]);
  });

  it('handles add subcategory button click', () => {
    const onCategoryAdd = jest.fn();
    render(<CategoryTreeView {...defaultProps} onCategoryAdd={onCategoryAdd} />);
    
    const addButtons = screen.getAllByTitle('Add subcategory');
    fireEvent.click(addButtons[0]);
    expect(onCategoryAdd).toHaveBeenCalledWith('1');
  });

  it('shows drag handles in drag mode', () => {
    render(<CategoryTreeView {...defaultProps} isDragMode={true} />);
    
    const dragHandles = screen.getAllByTestId('drag-handle');
    expect(dragHandles.length).toBeGreaterThan(0);
  });

  it('handles drag and drop events', () => {
    const onDragStart = jest.fn();
    const onDrop = jest.fn();
    
    render(
      <CategoryTreeView 
        {...defaultProps} 
        isDragMode={true}
        onDragStart={onDragStart}
        onDrop={onDrop}
      />
    );
    
    const categoryElement = screen.getByText('Jewelry').closest('div[draggable="true"]');
    
    // Mock dataTransfer for testing
    Object.defineProperty(window, 'DataTransfer', {
      writable: true,
      value: jest.fn().mockImplementation(() => ({
        effectAllowed: '',
        setData: jest.fn(),
        getData: jest.fn().mockReturnValue('1')
      }))
    });
    
    // Test drag start
    fireEvent.dragStart(categoryElement!, {
      dataTransfer: {
        effectAllowed: '',
        setData: jest.fn()
      }
    });
    expect(onDragStart).toHaveBeenCalledWith(mockCategories[0]);
    
    // Test drop
    fireEvent.drop(categoryElement!, {
      dataTransfer: {
        getData: jest.fn().mockReturnValue('1')
      }
    });
    expect(onDrop).toHaveBeenCalled();
  });

  it('shows empty state when no categories', () => {
    render(<CategoryTreeView {...defaultProps} categories={[]} />);
    
    expect(screen.getByText('No categories found')).toBeInTheDocument();
    expect(screen.getByText('Create your first category to organize your inventory')).toBeInTheDocument();
    expect(screen.getByText('Create Category')).toBeInTheDocument();
  });

  it('handles empty state create button click', () => {
    const onCategoryAdd = jest.fn();
    render(<CategoryTreeView {...defaultProps} categories={[]} onCategoryAdd={onCategoryAdd} />);
    
    fireEvent.click(screen.getByText('Create Category'));
    expect(onCategoryAdd).toHaveBeenCalledWith();
  });

  it('highlights selected category', () => {
    render(<CategoryTreeView {...defaultProps} selectedCategory="1" />);
    
    const selectedCategory = screen.getByText('Jewelry').closest('div[class*="bg-primary"]');
    expect(selectedCategory).toBeInTheDocument();
  });

  it('prevents event propagation on action buttons', () => {
    const onCategorySelect = jest.fn();
    const onCategoryEdit = jest.fn();
    
    render(
      <CategoryTreeView 
        {...defaultProps} 
        onCategorySelect={onCategorySelect}
        onCategoryEdit={onCategoryEdit}
      />
    );
    
    const editButton = screen.getAllByTitle('Edit category')[0];
    fireEvent.click(editButton);
    
    expect(onCategoryEdit).toHaveBeenCalled();
    expect(onCategorySelect).not.toHaveBeenCalled();
  });
});