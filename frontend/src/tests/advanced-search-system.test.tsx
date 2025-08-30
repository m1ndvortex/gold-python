/**
 * Advanced Search System Tests
 * Comprehensive tests for the universal search and filtering system
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { UniversalSearch } from '../components/search/UniversalSearch';
import { SearchFilters } from '../components/search/SearchFilters';
import { SearchResults } from '../components/search/SearchResults';
import { SearchPresets } from '../components/search/SearchPresets';
import { CategoryTreeFilter } from '../components/search/CategoryTreeFilter';
import { TagFilter } from '../components/search/TagFilter';
import { AttributeFilter } from '../components/search/AttributeFilter';
import { AdvancedSearchPage } from '../pages/AdvancedSearch';
import { useAdvancedSearch } from '../hooks/useAdvancedSearch';
import { searchApi } from '../services/searchApi';
import { LanguageProvider } from '../contexts/LanguageContext';

// Mock the search API
jest.mock('../services/searchApi');
const mockSearchApi = searchApi as jest.Mocked<typeof searchApi>;

// Mock the search hook
jest.mock('../hooks/useAdvancedSearch');
const mockUseAdvancedSearch = useAdvancedSearch as jest.MockedFunction<typeof useAdvancedSearch>;

// Test data
const mockSearchResults = {
  items: [
    {
      id: '1',
      entity_type: 'inventory' as const,
      title: 'Gold Ring 18K',
      subtitle: 'Jewelry > Rings',
      description: 'Beautiful 18K gold ring with diamond',
      image_url: '/images/ring.jpg',
      metadata: {
        sku: 'RING-001',
        stock_quantity: 5,
        sale_price: 1200,
        category: 'Rings'
      },
      relevance_score: 0.95,
      highlighted_fields: {
        title: '<mark>Gold Ring</mark> 18K'
      },
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-15T00:00:00Z'
    },
    {
      id: '2',
      entity_type: 'invoices' as const,
      title: 'Invoice #INV-001',
      subtitle: 'John Doe',
      description: 'Gold jewelry purchase',
      metadata: {
        invoice_number: 'INV-001',
        total_amount: 2500,
        status: 'paid',
        type: 'gold'
      },
      relevance_score: 0.87,
      highlighted_fields: {
        title: 'Invoice #<mark>INV-001</mark>'
      },
      created_at: '2024-01-10T00:00:00Z',
      updated_at: '2024-01-10T00:00:00Z'
    }
  ],
  total: 2,
  page: 1,
  per_page: 20,
  total_pages: 1,
  has_next: false,
  has_prev: false,
  facets: {
    entity_types: {
      name: 'entity_types',
      label: 'Entity Types',
      type: 'checkbox' as const,
      options: [
        { value: 'inventory', label: 'Inventory', count: 1, selected: true },
        { value: 'invoices', label: 'Invoices', count: 1, selected: true }
      ]
    },
    categories: {
      name: 'categories',
      label: 'Categories',
      type: 'checkbox' as const,
      options: [
        { value: 'rings', label: 'Rings', count: 1 }
      ]
    },
    tags: {
      name: 'tags',
      label: 'Tags',
      type: 'checkbox' as const,
      options: [
        { value: 'gold', label: 'Gold', count: 2 }
      ]
    },
    price_range: {
      name: 'price_range',
      label: 'Price Range',
      type: 'range' as const,
      range: { min: 100, max: 5000 }
    },
    date_range: {
      name: 'date_range',
      label: 'Date Range',
      type: 'date_range' as const
    },
    status: {
      name: 'status',
      label: 'Status',
      type: 'checkbox' as const,
      options: [
        { value: 'active', label: 'Active', count: 1 },
        { value: 'paid', label: 'Paid', count: 1 }
      ]
    },
    custom_attributes: []
  },
  suggestions: ['gold ring', 'jewelry', 'diamond'],
  search_time_ms: 45
};

const mockCategories = [
  {
    id: '1',
    name: 'Jewelry',
    parent_id: null,
    children: [
      {
        id: '2',
        name: 'Rings',
        parent_id: '1',
        children: [],
        level: 1,
        item_count: 5,
        path: 'Jewelry.Rings'
      },
      {
        id: '3',
        name: 'Necklaces',
        parent_id: '1',
        children: [],
        level: 1,
        item_count: 3,
        path: 'Jewelry.Necklaces'
      }
    ],
    level: 0,
    item_count: 8,
    path: 'Jewelry'
  }
];

const mockPresets = [
  {
    id: '1',
    name: 'Gold Items',
    description: 'Search for gold jewelry items',
    filters: {
      search: 'gold',
      entity_types: ['inventory' as const],
      inventory: {
        tags: ['gold'],
        category_ids: ['1']
      }
    },
    entity_types: ['inventory' as const],
    is_default: false,
    is_public: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    usage_count: 15,
    last_used_at: '2024-01-15T00:00:00Z'
  }
];

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Advanced Search System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock search hook default return
    mockUseAdvancedSearch.mockReturnValue({
      filters: {},
      entityTypes: ['inventory', 'invoices', 'customers'],
      currentPage: 1,
      perPage: 20,
      searchHistory: [],
      searchResults: mockSearchResults,
      isSearching: false,
      searchError: null,
      totalResults: 2,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
      suggestions: {
        suggestions: [
          { text: 'gold ring', type: 'query' as const },
          { text: 'jewelry', type: 'query' as const }
        ],
        categories: ['Jewelry', 'Rings'],
        tags: ['gold', 'diamond'],
        recent_searches: ['gold', 'ring']
      },
      isLoadingSuggestions: false,
      availableTags: ['gold', 'silver', 'diamond', 'ruby'],
      isLoadingTags: false,
      facets: mockSearchResults.facets,
      isLoadingFacets: false,
      hasActiveFilters: false,
      updateFilters: jest.fn(),
      updateEntityTypes: jest.fn(),
      clearFilters: jest.fn(),
      clearSearch: jest.fn(),
      goToPage: jest.fn(),
      changePerPage: jest.fn(),
      refetchSearch: jest.fn(),
      addToHistory: jest.fn()
    });

    // Mock API responses
    mockSearchApi.search.mockResolvedValue(mockSearchResults);
    mockSearchApi.getSuggestions.mockResolvedValue({
      suggestions: [
        { text: 'gold ring', type: 'query' },
        { text: 'jewelry', type: 'query' }
      ],
      categories: ['Jewelry', 'Rings'],
      tags: ['gold', 'diamond'],
      recent_searches: ['gold', 'ring']
    });
    mockSearchApi.getAvailableTags.mockResolvedValue(['gold', 'silver', 'diamond']);
    mockSearchApi.getFilterPresets.mockResolvedValue(mockPresets);
  });

  describe('UniversalSearch Component', () => {
    it('renders search interface correctly', async () => {
      render(
        <TestWrapper>
          <UniversalSearch />
        </TestWrapper>
      );

      // Check main search elements
      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
      expect(screen.getByText(/inventory/i)).toBeInTheDocument();
      expect(screen.getByText(/invoices/i)).toBeInTheDocument();
      expect(screen.getByText(/customers/i)).toBeInTheDocument();
    });

    it('handles search input and suggestions', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <UniversalSearch />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText(/search/i);
      
      // Type in search input
      await user.type(searchInput, 'gold');
      
      // Wait for suggestions to appear
      await waitFor(() => {
        expect(screen.getByText('gold ring')).toBeInTheDocument();
      });
    });

    it('toggles entity type filters', async () => {
      const user = userEvent.setup();
      const mockUpdateEntityTypes = jest.fn();
      
      mockUseAdvancedSearch.mockReturnValue({
        ...mockUseAdvancedSearch(),
        updateEntityTypes: mockUpdateEntityTypes
      });

      render(
        <TestWrapper>
          <UniversalSearch />
        </TestWrapper>
      );

      const inventoryButton = screen.getByRole('button', { name: /inventory/i });
      await user.click(inventoryButton);

      expect(mockUpdateEntityTypes).toHaveBeenCalled();
    });

    it('shows and hides filters panel', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <UniversalSearch />
        </TestWrapper>
      );

      const filtersButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filtersButton);

      // Filters panel should be visible
      await waitFor(() => {
        expect(screen.getByText(/categories/i)).toBeInTheDocument();
      });
    });

    it('handles result clicks', async () => {
      const user = userEvent.setup();
      const mockOnResultClick = jest.fn();
      
      render(
        <TestWrapper>
          <UniversalSearch onResultClick={mockOnResultClick} />
        </TestWrapper>
      );

      // Wait for results to load
      await waitFor(() => {
        expect(screen.getByText('Gold Ring 18K')).toBeInTheDocument();
      });

      const resultItem = screen.getByText('Gold Ring 18K');
      await user.click(resultItem);

      expect(mockOnResultClick).toHaveBeenCalledWith(mockSearchResults.items[0]);
    });
  });

  describe('SearchFilters Component', () => {
    const mockProps = {
      filters: {},
      facets: mockSearchResults.facets,
      onFiltersChange: jest.fn(),
      enabledEntities: ['inventory' as const, 'invoices' as const],
      categories: mockCategories,
      availableTags: ['gold', 'silver', 'diamond'],
      customAttributes: []
    };

    it('renders filter sections', () => {
      render(
        <TestWrapper>
          <SearchFilters {...mockProps} />
        </TestWrapper>
      );

      expect(screen.getByText(/categories/i)).toBeInTheDocument();
      expect(screen.getByText(/tags/i)).toBeInTheDocument();
      expect(screen.getByText(/price range/i)).toBeInTheDocument();
      expect(screen.getByText(/date range/i)).toBeInTheDocument();
    });

    it('expands and collapses filter sections', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <SearchFilters {...mockProps} />
        </TestWrapper>
      );

      const categoriesButton = screen.getByRole('button', { name: /categories/i });
      await user.click(categoriesButton);

      // Should show category tree
      await waitFor(() => {
        expect(screen.getByText('Jewelry')).toBeInTheDocument();
      });
    });

    it('handles price range filters', async () => {
      const user = userEvent.setup();
      const mockOnFiltersChange = jest.fn();
      
      render(
        <TestWrapper>
          <SearchFilters {...mockProps} onFiltersChange={mockOnFiltersChange} />
        </TestWrapper>
      );

      // Expand price range section
      const priceButton = screen.getByRole('button', { name: /price range/i });
      await user.click(priceButton);

      // Find min price input
      const minPriceInput = screen.getByPlaceholderText(/min/i);
      await user.type(minPriceInput, '100');

      expect(mockOnFiltersChange).toHaveBeenCalled();
    });
  });

  describe('SearchResults Component', () => {
    const mockProps = {
      results: mockSearchResults,
      loading: false,
      onResultClick: jest.fn(),
      onPageChange: jest.fn(),
      onSortChange: jest.fn(),
      viewMode: 'list' as const,
      onViewModeChange: jest.fn()
    };

    it('renders search results in list view', () => {
      render(
        <TestWrapper>
          <SearchResults {...mockProps} />
        </TestWrapper>
      );

      expect(screen.getByText('Gold Ring 18K')).toBeInTheDocument();
      expect(screen.getByText('Invoice #INV-001')).toBeInTheDocument();
      expect(screen.getByText(/showing 1 to 2 of 2/i)).toBeInTheDocument();
    });

    it('switches between view modes', async () => {
      const user = userEvent.setup();
      const mockOnViewModeChange = jest.fn();
      
      render(
        <TestWrapper>
          <SearchResults {...mockProps} onViewModeChange={mockOnViewModeChange} />
        </TestWrapper>
      );

      // Find grid view button
      const gridButton = screen.getByRole('button', { name: /grid/i });
      await user.click(gridButton);

      expect(mockOnViewModeChange).toHaveBeenCalledWith('grid');
    });

    it('handles sorting changes', async () => {
      const user = userEvent.setup();
      const mockOnSortChange = jest.fn();
      
      render(
        <TestWrapper>
          <SearchResults {...mockProps} onSortChange={mockOnSortChange} />
        </TestWrapper>
      );

      // Find sort dropdown
      const sortSelect = screen.getByRole('combobox');
      await user.click(sortSelect);

      // Select date option
      const dateOption = screen.getByText(/date/i);
      await user.click(dateOption);

      expect(mockOnSortChange).toHaveBeenCalled();
    });

    it('shows loading state', () => {
      render(
        <TestWrapper>
          <SearchResults {...mockProps} loading={true} />
        </TestWrapper>
      );

      // Should show skeleton loaders
      expect(screen.getAllByTestId(/skeleton/i)).toHaveLength(5);
    });

    it('shows no results state', () => {
      const emptyResults = {
        ...mockSearchResults,
        items: [],
        total: 0
      };

      render(
        <TestWrapper>
          <SearchResults {...mockProps} results={emptyResults} />
        </TestWrapper>
      );

      expect(screen.getByText(/no results/i)).toBeInTheDocument();
    });
  });

  describe('CategoryTreeFilter Component', () => {
    const mockProps = {
      categories: mockCategories,
      selectedCategories: [],
      onCategorySelect: jest.fn(),
      multiSelect: true,
      showItemCounts: true
    };

    it('renders category tree', () => {
      render(
        <TestWrapper>
          <CategoryTreeFilter {...mockProps} />
        </TestWrapper>
      );

      expect(screen.getByText('Jewelry')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument(); // Item count
    });

    it('expands and collapses categories', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <CategoryTreeFilter {...mockProps} />
        </TestWrapper>
      );

      // Find expand button for Jewelry category
      const expandButton = screen.getByRole('button', { name: /expand/i });
      await user.click(expandButton);

      // Should show child categories
      await waitFor(() => {
        expect(screen.getByText('Rings')).toBeInTheDocument();
        expect(screen.getByText('Necklaces')).toBeInTheDocument();
      });
    });

    it('selects categories', async () => {
      const user = userEvent.setup();
      const mockOnCategorySelect = jest.fn();
      
      render(
        <TestWrapper>
          <CategoryTreeFilter {...mockProps} onCategorySelect={mockOnCategorySelect} />
        </TestWrapper>
      );

      // Find checkbox for Jewelry category
      const checkbox = screen.getByRole('checkbox', { name: /jewelry/i });
      await user.click(checkbox);

      expect(mockOnCategorySelect).toHaveBeenCalledWith(['1']);
    });

    it('filters categories by search', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <CategoryTreeFilter {...mockProps} />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText(/search categories/i);
      await user.type(searchInput, 'rings');

      // Should filter to show only matching categories
      await waitFor(() => {
        expect(screen.getByText('Rings')).toBeInTheDocument();
        expect(screen.queryByText('Necklaces')).not.toBeInTheDocument();
      });
    });
  });

  describe('TagFilter Component', () => {
    const mockProps = {
      availableTags: ['gold', 'silver', 'diamond', 'ruby'],
      selectedTags: [],
      onTagsChange: jest.fn(),
      showSuggestions: true,
      allowCustomTags: true
    };

    it('renders tag input', () => {
      render(
        <TestWrapper>
          <TagFilter {...mockProps} />
        </TestWrapper>
      );

      expect(screen.getByPlaceholderText(/add tag/i)).toBeInTheDocument();
    });

    it('shows tag suggestions', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <TagFilter {...mockProps} />
        </TestWrapper>
      );

      const input = screen.getByPlaceholderText(/add tag/i);
      await user.type(input, 'go');

      // Should show suggestions
      await waitFor(() => {
        expect(screen.getByText('gold')).toBeInTheDocument();
      });
    });

    it('adds tags from suggestions', async () => {
      const user = userEvent.setup();
      const mockOnTagsChange = jest.fn();
      
      render(
        <TestWrapper>
          <TagFilter {...mockProps} onTagsChange={mockOnTagsChange} />
        </TestWrapper>
      );

      const input = screen.getByPlaceholderText(/add tag/i);
      await user.type(input, 'gold');

      // Click on suggestion
      const suggestion = screen.getByText('gold');
      await user.click(suggestion);

      expect(mockOnTagsChange).toHaveBeenCalledWith(['gold']);
    });

    it('adds custom tags', async () => {
      const user = userEvent.setup();
      const mockOnTagsChange = jest.fn();
      
      render(
        <TestWrapper>
          <TagFilter {...mockProps} onTagsChange={mockOnTagsChange} />
        </TestWrapper>
      );

      const input = screen.getByPlaceholderText(/add tag/i);
      await user.type(input, 'custom-tag');
      await user.keyboard('{Enter}');

      expect(mockOnTagsChange).toHaveBeenCalledWith(['custom-tag']);
    });

    it('removes selected tags', async () => {
      const user = userEvent.setup();
      const mockOnTagsChange = jest.fn();
      
      render(
        <TestWrapper>
          <TagFilter {...mockProps} selectedTags={['gold']} onTagsChange={mockOnTagsChange} />
        </TestWrapper>
      );

      // Find remove button for gold tag
      const removeButton = screen.getByRole('button', { name: /remove gold/i });
      await user.click(removeButton);

      expect(mockOnTagsChange).toHaveBeenCalledWith([]);
    });
  });

  describe('SearchPresets Component', () => {
    const mockProps = {
      presets: mockPresets,
      currentFilters: {},
      onPresetSelect: jest.fn(),
      onPresetSave: jest.fn(),
      onPresetDelete: jest.fn(),
      onPresetUpdate: jest.fn()
    };

    it('renders preset list', () => {
      render(
        <TestWrapper>
          <SearchPresets {...mockProps} />
        </TestWrapper>
      );

      expect(screen.getByText('Gold Items')).toBeInTheDocument();
      expect(screen.getByText('Search for gold jewelry items')).toBeInTheDocument();
    });

    it('applies preset', async () => {
      const user = userEvent.setup();
      const mockOnPresetSelect = jest.fn();
      
      render(
        <TestWrapper>
          <SearchPresets {...mockProps} onPresetSelect={mockOnPresetSelect} />
        </TestWrapper>
      );

      const applyButton = screen.getByRole('button', { name: /apply/i });
      await user.click(applyButton);

      expect(mockOnPresetSelect).toHaveBeenCalledWith(mockPresets[0]);
    });

    it('creates new preset', async () => {
      const user = userEvent.setup();
      const mockOnPresetSave = jest.fn();
      
      render(
        <TestWrapper>
          <SearchPresets {...mockProps} onPresetSave={mockOnPresetSave} />
        </TestWrapper>
      );

      // Open create dialog
      const createButton = screen.getByRole('button', { name: /create/i });
      await user.click(createButton);

      // Fill form
      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'New Preset');

      const descriptionInput = screen.getByLabelText(/description/i);
      await user.type(descriptionInput, 'Test preset');

      // Save preset
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      expect(mockOnPresetSave).toHaveBeenCalledWith('New Preset', 'Test preset');
    });

    it('deletes preset', async () => {
      const user = userEvent.setup();
      const mockOnPresetDelete = jest.fn();
      
      render(
        <TestWrapper>
          <SearchPresets {...mockProps} onPresetDelete={mockOnPresetDelete} />
        </TestWrapper>
      );

      // Find delete button
      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /delete/i });
      await user.click(confirmButton);

      expect(mockOnPresetDelete).toHaveBeenCalledWith('1');
    });
  });

  describe('AdvancedSearchPage', () => {
    it('renders search page', () => {
      render(
        <TestWrapper>
          <AdvancedSearchPage />
        </TestWrapper>
      );

      expect(screen.getByText(/advanced search/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    });

    it('handles URL parameters', () => {
      // Mock URL with search parameters
      const mockLocation = {
        search: '?q=gold&entity=inventory&category=1'
      };
      
      Object.defineProperty(window, 'location', {
        value: mockLocation,
        writable: true
      });

      render(
        <TestWrapper>
          <AdvancedSearchPage />
        </TestWrapper>
      );

      // Should initialize with URL parameters
      expect(screen.getByDisplayValue('gold')).toBeInTheDocument();
    });

    it('shows search history', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <AdvancedSearchPage />
        </TestWrapper>
      );

      const historyButton = screen.getByRole('button', { name: /history/i });
      await user.click(historyButton);

      // Should show history dialog
      expect(screen.getByText(/search history/i)).toBeInTheDocument();
    });
  });

  describe('Integration Tests', () => {
    it('performs complete search workflow', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <UniversalSearch />
        </TestWrapper>
      );

      // Enter search query
      const searchInput = screen.getByPlaceholderText(/search/i);
      await user.type(searchInput, 'gold ring');
      await user.keyboard('{Enter}');

      // Wait for results
      await waitFor(() => {
        expect(screen.getByText('Gold Ring 18K')).toBeInTheDocument();
      });

      // Apply filters
      const filtersButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filtersButton);

      // Select category filter
      const categoriesButton = screen.getByRole('button', { name: /categories/i });
      await user.click(categoriesButton);

      // Should show filtered results
      await waitFor(() => {
        expect(mockSearchApi.search).toHaveBeenCalled();
      });
    });

    it('handles error states gracefully', async () => {
      // Mock API error
      mockSearchApi.search.mockRejectedValue(new Error('Search failed'));
      
      mockUseAdvancedSearch.mockReturnValue({
        ...mockUseAdvancedSearch(),
        searchError: new Error('Search failed'),
        isSearching: false,
        searchResults: null
      });

      render(
        <TestWrapper>
          <UniversalSearch />
        </TestWrapper>
      );

      // Should show error state
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });

    it('maintains search state across navigation', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <AdvancedSearchPage />
        </TestWrapper>
      );

      // Perform search
      const searchInput = screen.getByPlaceholderText(/search/i);
      await user.type(searchInput, 'gold');

      // URL should be updated
      expect(window.location.search).toContain('q=gold');
    });
  });

  describe('Performance Tests', () => {
    it('debounces search input', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <UniversalSearch />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText(/search/i);
      
      // Type quickly
      await user.type(searchInput, 'gold ring', { delay: 50 });

      // Should not call API for every keystroke
      await waitFor(() => {
        expect(mockSearchApi.search).toHaveBeenCalledTimes(1);
      });
    });

    it('handles large result sets efficiently', async () => {
      const largeResultSet = {
        ...mockSearchResults,
        items: Array.from({ length: 100 }, (_, i) => ({
          ...mockSearchResults.items[0],
          id: `item-${i}`,
          title: `Item ${i}`
        })),
        total: 1000
      };

      mockUseAdvancedSearch.mockReturnValue({
        ...mockUseAdvancedSearch(),
        searchResults: largeResultSet
      });

      const { container } = render(
        <TestWrapper>
          <UniversalSearch />
        </TestWrapper>
      );

      // Should render without performance issues
      expect(container.querySelectorAll('[data-testid="result-item"]')).toHaveLength(100);
    });
  });

  describe('Accessibility Tests', () => {
    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <UniversalSearch />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText(/search/i);
      
      // Focus search input
      await user.tab();
      expect(searchInput).toHaveFocus();

      // Navigate to entity type buttons
      await user.tab();
      expect(screen.getByRole('button', { name: /inventory/i })).toHaveFocus();
    });

    it('provides proper ARIA labels', () => {
      render(
        <TestWrapper>
          <UniversalSearch />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText(/search/i);
      expect(searchInput).toHaveAttribute('aria-label');

      const filtersButton = screen.getByRole('button', { name: /filters/i });
      expect(filtersButton).toHaveAttribute('aria-expanded');
    });

    it('announces search results to screen readers', async () => {
      render(
        <TestWrapper>
          <UniversalSearch />
        </TestWrapper>
      );

      // Should have live region for search results
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toBeInTheDocument();
    });
  });
});