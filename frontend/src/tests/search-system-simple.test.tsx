/**
 * Simple Search System Test
 * Basic test to verify search system functionality
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { UniversalSearch } from '../components/search/UniversalSearch';
import { SearchFilters } from '../components/search/SearchFilters';
import { SearchResults } from '../components/search/SearchResults';
import { LanguageProvider } from '../contexts/LanguageContext';

// Mock the search API
jest.mock('../services/searchApi', () => ({
  searchApi: {
    search: jest.fn(),
    getSuggestions: jest.fn(),
    getAvailableTags: jest.fn(),
    getFilterPresets: jest.fn(),
  }
}));

// Mock the search hook
jest.mock('../hooks/useAdvancedSearch', () => ({
  useAdvancedSearch: jest.fn(() => ({
    filters: {},
    entityTypes: ['inventory', 'invoices'],
    searchResults: {
      items: [],
      total: 0,
      page: 1,
      per_page: 20,
      total_pages: 0,
      has_next: false,
      has_prev: false,
      facets: {
        entity_types: { name: 'entity_types', label: 'Entity Types', type: 'checkbox' as const },
        categories: { name: 'categories', label: 'Categories', type: 'checkbox' as const },
        tags: { name: 'tags', label: 'Tags', type: 'checkbox' as const },
        price_range: { name: 'price_range', label: 'Price Range', type: 'range' as const },
        date_range: { name: 'date_range', label: 'Date Range', type: 'date_range' as const },
        status: { name: 'status', label: 'Status', type: 'select' as const },
        custom_attributes: []
      },
      suggestions: [],
      search_time_ms: 0
    },
    isSearching: false,
    updateFilters: jest.fn(),
    updateEntityTypes: jest.fn(),
    clearFilters: jest.fn(),
    clearSearch: jest.fn(),
    goToPage: jest.fn(),
    changePerPage: jest.fn(),
    refetchSearch: jest.fn(),
    addToHistory: jest.fn(),
    hasActiveFilters: false,
    totalResults: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
    suggestions: null,
    isLoadingSuggestions: false,
    availableTags: [],
    isLoadingTags: false,
    facets: null,
    isLoadingFacets: false,
    searchHistory: [],
    currentPage: 1,
    perPage: 20,
    searchError: null
  })),
  useSearchPresets: jest.fn(() => ({
    presets: [],
    isLoading: false,
    createPreset: jest.fn(),
    updatePreset: jest.fn(),
    deletePreset: jest.fn(),
    isCreating: false,
    isUpdating: false,
    isDeleting: false
  }))
}));

// Test wrapper
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

describe('Search System - Basic Tests', () => {
  describe('UniversalSearch Component', () => {
    it('renders without crashing', () => {
      render(
        <TestWrapper>
          <UniversalSearch />
        </TestWrapper>
      );

      // Should render search input
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('displays entity type buttons', () => {
      render(
        <TestWrapper>
          <UniversalSearch enabledEntities={['inventory', 'invoices']} />
        </TestWrapper>
      );

      // Should show entity type buttons
      expect(screen.getByText(/inventory/i)).toBeInTheDocument();
      expect(screen.getByText(/invoices/i)).toBeInTheDocument();
    });

    it('shows filters button', () => {
      render(
        <TestWrapper>
          <UniversalSearch />
        </TestWrapper>
      );

      // Should show filters button
      expect(screen.getByRole('button', { name: /filters/i })).toBeInTheDocument();
    });
  });

  describe('SearchFilters Component', () => {
    const mockProps = {
      filters: {},
      facets: {
        entity_types: {
          name: 'entity_types',
          label: 'Entity Types',
          type: 'checkbox' as const,
          options: []
        },
        categories: {
          name: 'categories',
          label: 'Categories',
          type: 'checkbox' as const,
          options: []
        },
        tags: {
          name: 'tags',
          label: 'Tags',
          type: 'checkbox' as const,
          options: []
        },
        price_range: {
          name: 'price_range',
          label: 'Price Range',
          type: 'range' as const,
          range: { min: 0, max: 1000 }
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
          options: []
        },
        custom_attributes: []
      },
      onFiltersChange: jest.fn(),
      enabledEntities: ['inventory' as const],
      categories: [],
      availableTags: [],
      customAttributes: []
    };

    it('renders filter sections', () => {
      render(
        <TestWrapper>
          <SearchFilters {...mockProps} />
        </TestWrapper>
      );

      // Should show filter sections
      expect(screen.getByText(/categories/i)).toBeInTheDocument();
      expect(screen.getByText(/tags/i)).toBeInTheDocument();
      expect(screen.getByText(/price range/i)).toBeInTheDocument();
    });
  });

  describe('SearchResults Component', () => {
    const mockResults = {
      items: [
        {
          id: '1',
          entity_type: 'inventory' as const,
          title: 'Test Item',
          subtitle: 'Test Category',
          description: 'Test description',
          metadata: {},
          relevance_score: 0.9,
          highlighted_fields: {},
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ],
      total: 1,
      page: 1,
      per_page: 20,
      total_pages: 1,
      has_next: false,
      has_prev: false,
      facets: {
        entity_types: { name: 'entity_types', label: 'Entity Types', type: 'checkbox' as const },
        categories: { name: 'categories', label: 'Categories', type: 'checkbox' as const },
        tags: { name: 'tags', label: 'Tags', type: 'checkbox' as const },
        price_range: { name: 'price_range', label: 'Price Range', type: 'range' as const },
        date_range: { name: 'date_range', label: 'Date Range', type: 'date_range' as const },
        status: { name: 'status', label: 'Status', type: 'select' as const },
        custom_attributes: []
      },
      suggestions: [],
      search_time_ms: 50
    };

    const mockProps = {
      results: mockResults,
      loading: false,
      onResultClick: jest.fn(),
      onPageChange: jest.fn(),
      onSortChange: jest.fn(),
      viewMode: 'list' as const,
      onViewModeChange: jest.fn()
    };

    it('renders search results', () => {
      render(
        <TestWrapper>
          <SearchResults {...mockProps} />
        </TestWrapper>
      );

      // Should show result item
      expect(screen.getByText('Test Item')).toBeInTheDocument();
      expect(screen.getByText('Test Category')).toBeInTheDocument();
    });

    it('shows results count', () => {
      render(
        <TestWrapper>
          <SearchResults {...mockProps} />
        </TestWrapper>
      );

      // Should show results count
      expect(screen.getByText(/showing 1 to 1 of 1/i)).toBeInTheDocument();
    });

    it('shows loading state', () => {
      render(
        <TestWrapper>
          <SearchResults {...mockProps} loading={true} />
        </TestWrapper>
      );

      // Should show loading skeletons
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('shows empty state when no results', () => {
      const emptyResults = {
        ...mockResults,
        items: [],
        total: 0
      };

      render(
        <TestWrapper>
          <SearchResults {...mockProps} results={emptyResults} />
        </TestWrapper>
      );

      // Should show no results message
      expect(screen.getByText(/no results/i)).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('renders complete search interface', () => {
      render(
        <TestWrapper>
          <UniversalSearch />
        </TestWrapper>
      );

      // Should render main search components
      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /filters/i })).toBeInTheDocument();
      expect(screen.getByText(/inventory/i)).toBeInTheDocument();
    });
  });
});