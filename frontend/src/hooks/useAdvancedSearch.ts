/**
 * Advanced Search and Filtering Hook
 * Comprehensive hook for universal search functionality
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { searchApi } from '../services/searchApi';
import {
  UniversalSearchFilters,
  SearchResults,
  SearchFilterPreset,
  SearchFilterPresetCreate,
  SearchFilterPresetUpdate,
  SearchSuggestionsResponse,
  SearchEntityType,
  SearchResultItem,
  SearchAnalytics,
  SearchHistoryEntry
} from '../types/search';

// Query keys
export const searchKeys = {
  all: ['search'] as const,
  search: (filters: UniversalSearchFilters, page: number, perPage: number) => 
    [...searchKeys.all, 'results', filters, page, perPage] as const,
  quickSearch: (query: string, entityTypes: SearchEntityType[]) => 
    [...searchKeys.all, 'quick', query, entityTypes] as const,
  suggestions: (query: string, entityTypes?: SearchEntityType[]) => 
    [...searchKeys.all, 'suggestions', query, entityTypes] as const,
  presets: (entityTypes?: SearchEntityType[]) => 
    [...searchKeys.all, 'presets', entityTypes] as const,
  facets: (filters: UniversalSearchFilters, entityTypes: SearchEntityType[]) => 
    [...searchKeys.all, 'facets', filters, entityTypes] as const,
  tags: (entityTypes?: SearchEntityType[]) => 
    [...searchKeys.all, 'tags', entityTypes] as const,
  history: () => [...searchKeys.all, 'history'] as const,
  analytics: (startDate?: string, endDate?: string) => 
    [...searchKeys.all, 'analytics', startDate, endDate] as const,
};

// Main search hook
export const useAdvancedSearch = (
  initialFilters: UniversalSearchFilters = {},
  initialEntityTypes: SearchEntityType[] = ['inventory', 'invoices', 'customers']
) => {
  const [filters, setFilters] = useState<UniversalSearchFilters>(initialFilters);
  const [entityTypes, setEntityTypes] = useState<SearchEntityType[]>(initialEntityTypes);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // Main search query
  const {
    data: searchResults,
    isLoading: isSearching,
    error: searchError,
    refetch: refetchSearch
  } = useQuery({
    queryKey: searchKeys.search(filters, currentPage, perPage),
    queryFn: () => searchApi.search(filters, currentPage, perPage),
    enabled: !!(filters.search || Object.keys(filters).length > 2), // Only search if there's a query or filters
    staleTime: 30 * 1000, // 30 seconds
    keepPreviousData: true
  });

  // Search suggestions
  const {
    data: suggestions,
    isLoading: isLoadingSuggestions
  } = useQuery({
    queryKey: searchKeys.suggestions(filters.search || '', entityTypes),
    queryFn: () => searchApi.getSuggestions(filters.search || '', entityTypes),
    enabled: !!(filters.search && filters.search.length >= 2),
    staleTime: 60 * 1000 // 1 minute
  });

  // Available tags
  const {
    data: availableTags = [],
    isLoading: isLoadingTags
  } = useQuery({
    queryKey: searchKeys.tags(entityTypes),
    queryFn: () => searchApi.getAvailableTags(entityTypes),
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Search facets for dynamic filtering
  const {
    data: facets,
    isLoading: isLoadingFacets
  } = useQuery({
    queryKey: searchKeys.facets(filters, entityTypes),
    queryFn: () => searchApi.getFacets(filters, entityTypes),
    enabled: !!(filters.search || Object.keys(filters).length > 2),
    staleTime: 2 * 60 * 1000 // 2 minutes
  });

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<UniversalSearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1); // Reset to first page when filters change
  }, []);

  // Update entity types
  const updateEntityTypes = useCallback((newEntityTypes: SearchEntityType[]) => {
    setEntityTypes(newEntityTypes);
    setCurrentPage(1);
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({ search: filters.search }); // Keep search query, clear other filters
    setCurrentPage(1);
  }, [filters.search]);

  // Clear search query
  const clearSearch = useCallback(() => {
    setFilters({});
    setCurrentPage(1);
  }, []);

  // Pagination
  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const changePerPage = useCallback((newPerPage: number) => {
    setPerPage(newPerPage);
    setCurrentPage(1);
  }, []);

  // Search history management
  const addToHistory = useCallback((query: string) => {
    if (query && !searchHistory.includes(query)) {
      setSearchHistory(prev => [query, ...prev.slice(0, 9)]); // Keep last 10 searches
    }
  }, [searchHistory]);

  // Effect to add successful searches to history
  useEffect(() => {
    if (filters.search && searchResults && searchResults.items.length > 0) {
      addToHistory(filters.search);
    }
  }, [filters.search, searchResults, addToHistory]);

  // Computed values
  const hasActiveFilters = useMemo(() => {
    return Object.keys(filters).some(key => {
      if (key === 'search') return false;
      const value = filters[key as keyof UniversalSearchFilters];
      return value !== undefined && value !== null && 
             (Array.isArray(value) ? value.length > 0 : true);
    });
  }, [filters]);

  const totalResults = searchResults?.total || 0;
  const totalPages = searchResults?.total_pages || 0;
  const hasNextPage = searchResults?.has_next || false;
  const hasPrevPage = searchResults?.has_prev || false;

  return {
    // Search state
    filters,
    entityTypes,
    currentPage,
    perPage,
    searchHistory,
    
    // Search results
    searchResults,
    isSearching,
    searchError,
    totalResults,
    totalPages,
    hasNextPage,
    hasPrevPage,
    
    // Suggestions and facets
    suggestions,
    isLoadingSuggestions,
    availableTags,
    isLoadingTags,
    facets,
    isLoadingFacets,
    
    // Computed values
    hasActiveFilters,
    
    // Actions
    updateFilters,
    updateEntityTypes,
    clearFilters,
    clearSearch,
    goToPage,
    changePerPage,
    refetchSearch,
    addToHistory
  };
};

// Quick search hook for simple searches
export const useQuickSearch = (
  initialQuery = '',
  initialEntityTypes: SearchEntityType[] = ['inventory', 'invoices', 'customers']
) => {
  const [query, setQuery] = useState(initialQuery);
  const [entityTypes, setEntityTypes] = useState<SearchEntityType[]>(initialEntityTypes);

  const {
    data: results,
    isLoading,
    error
  } = useQuery({
    queryKey: searchKeys.quickSearch(query, entityTypes),
    queryFn: () => searchApi.quickSearch(query, entityTypes),
    enabled: query.length >= 2,
    staleTime: 30 * 1000
  });

  return {
    query,
    setQuery,
    entityTypes,
    setEntityTypes,
    results,
    isLoading,
    error
  };
};

// Search presets hook
export const useSearchPresets = (entityTypes?: SearchEntityType[]) => {
  const queryClient = useQueryClient();

  const {
    data: presets = [],
    isLoading,
    error
  } = useQuery({
    queryKey: searchKeys.presets(entityTypes),
    queryFn: () => searchApi.getFilterPresets(entityTypes),
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  const createPresetMutation = useMutation({
    mutationFn: (preset: SearchFilterPresetCreate) => searchApi.createFilterPreset(preset),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: searchKeys.presets(entityTypes) });
    }
  });

  const updatePresetMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: SearchFilterPresetUpdate }) =>
      searchApi.updateFilterPreset(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: searchKeys.presets(entityTypes) });
    }
  });

  const deletePresetMutation = useMutation({
    mutationFn: (id: string) => searchApi.deleteFilterPreset(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: searchKeys.presets(entityTypes) });
    }
  });

  return {
    presets,
    isLoading,
    error,
    createPreset: createPresetMutation.mutateAsync,
    updatePreset: updatePresetMutation.mutateAsync,
    deletePreset: deletePresetMutation.mutateAsync,
    isCreating: createPresetMutation.isPending,
    isUpdating: updatePresetMutation.isPending,
    isDeleting: deletePresetMutation.isPending
  };
};

// Search history hook
export const useSearchHistory = () => {
  const {
    data: history = [],
    isLoading,
    error
  } = useQuery({
    queryKey: searchKeys.history(),
    queryFn: () => searchApi.getSearchHistory(),
    staleTime: 2 * 60 * 1000 // 2 minutes
  });

  const clearHistoryMutation = useMutation({
    mutationFn: () => searchApi.clearSearchHistory(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: searchKeys.history() });
    }
  });

  const queryClient = useQueryClient();

  return {
    history,
    isLoading,
    error,
    clearHistory: clearHistoryMutation.mutateAsync,
    isClearing: clearHistoryMutation.isPending
  };
};

// Search analytics hook
export const useSearchAnalytics = (startDate?: string, endDate?: string) => {
  const {
    data: analytics,
    isLoading,
    error
  } = useQuery({
    queryKey: searchKeys.analytics(startDate, endDate),
    queryFn: () => searchApi.getSearchAnalytics(startDate, endDate),
    staleTime: 10 * 60 * 1000 // 10 minutes
  });

  return {
    analytics,
    isLoading,
    error
  };
};

// Entity-specific search hooks
export const useInventorySearch = (initialFilters = {}) => {
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);

  const {
    data: results,
    isLoading,
    error
  } = useQuery({
    queryKey: ['search', 'inventory', filters, page],
    queryFn: () => searchApi.inventory.search(filters, page),
    enabled: !!(filters.search || Object.keys(filters).length > 0),
    keepPreviousData: true
  });

  const {
    data: categories = []
  } = useQuery({
    queryKey: ['search', 'inventory', 'categories'],
    queryFn: () => searchApi.inventory.getCategories(),
    staleTime: 10 * 60 * 1000
  });

  const {
    data: customAttributes = []
  } = useQuery({
    queryKey: ['search', 'inventory', 'attributes'],
    queryFn: () => searchApi.inventory.getCustomAttributes(),
    staleTime: 10 * 60 * 1000
  });

  return {
    filters,
    setFilters,
    page,
    setPage,
    results,
    isLoading,
    error,
    categories,
    customAttributes
  };
};

export const useInvoiceSearch = (initialFilters = {}) => {
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);

  const {
    data: results,
    isLoading,
    error
  } = useQuery({
    queryKey: ['search', 'invoices', filters, page],
    queryFn: () => searchApi.invoices.search(filters, page),
    enabled: !!(filters.search || Object.keys(filters).length > 0),
    keepPreviousData: true
  });

  const {
    data: statuses = []
  } = useQuery({
    queryKey: ['search', 'invoices', 'statuses'],
    queryFn: () => searchApi.invoices.getStatuses(),
    staleTime: 10 * 60 * 1000
  });

  const {
    data: workflowStages = []
  } = useQuery({
    queryKey: ['search', 'invoices', 'workflow-stages'],
    queryFn: () => searchApi.invoices.getWorkflowStages(),
    staleTime: 10 * 60 * 1000
  });

  return {
    filters,
    setFilters,
    page,
    setPage,
    results,
    isLoading,
    error,
    statuses,
    workflowStages
  };
};

export const useCustomerSearch = (initialFilters = {}) => {
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);

  const {
    data: results,
    isLoading,
    error
  } = useQuery({
    queryKey: ['search', 'customers', filters, page],
    queryFn: () => searchApi.customers.search(filters, page),
    enabled: !!(filters.search || Object.keys(filters).length > 0),
    keepPreviousData: true
  });

  const {
    data: customerTypes = []
  } = useQuery({
    queryKey: ['search', 'customers', 'types'],
    queryFn: () => searchApi.customers.getCustomerTypes(),
    staleTime: 10 * 60 * 1000
  });

  const {
    data: cities = []
  } = useQuery({
    queryKey: ['search', 'customers', 'cities'],
    queryFn: () => searchApi.customers.getCities(),
    staleTime: 10 * 60 * 1000
  });

  return {
    filters,
    setFilters,
    page,
    setPage,
    results,
    isLoading,
    error,
    customerTypes,
    cities
  };
};

export const useAccountingSearch = (initialFilters = {}) => {
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);

  const {
    data: results,
    isLoading,
    error
  } = useQuery({
    queryKey: ['search', 'accounting', filters, page],
    queryFn: () => searchApi.accounting.search(filters, page),
    enabled: !!(filters.search || Object.keys(filters).length > 0),
    keepPreviousData: true
  });

  const {
    data: entryTypes = []
  } = useQuery({
    queryKey: ['search', 'accounting', 'entry-types'],
    queryFn: () => searchApi.accounting.getEntryTypes(),
    staleTime: 10 * 60 * 1000
  });

  const {
    data: accountTypes = []
  } = useQuery({
    queryKey: ['search', 'accounting', 'account-types'],
    queryFn: () => searchApi.accounting.getAccountTypes(),
    staleTime: 10 * 60 * 1000
  });

  return {
    filters,
    setFilters,
    page,
    setPage,
    results,
    isLoading,
    error,
    entryTypes,
    accountTypes
  };
};