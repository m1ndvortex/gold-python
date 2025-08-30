/**
 * Advanced Search and Filtering API Service
 * Comprehensive API service for universal search across all entities
 */

import { apiGet, apiPost, apiPut, apiDelete } from '../utils/api';
import {
  UniversalSearchFilters,
  SearchResults,
  SearchFilterPreset,
  SearchFilterPresetCreate,
  SearchFilterPresetUpdate,
  SearchSuggestionsResponse,
  SearchAnalytics,
  SearchConfiguration,
  SearchHistoryEntry,
  SearchExportRequest,
  SearchExportResponse,
  SearchEntityType
} from '../types/search';

export const searchApi = {
  // Universal Search
  search: async (
    filters: UniversalSearchFilters,
    page = 1,
    perPage = 20
  ): Promise<SearchResults> => {
    const searchParams = {
      ...filters,
      page,
      per_page: perPage
    };

    return apiPost<SearchResults, typeof searchParams>('/search/universal', searchParams);
  },

  // Quick search with minimal filters
  quickSearch: async (
    query: string,
    entityTypes: SearchEntityType[] = ['inventory', 'invoices', 'customers'],
    limit = 10
  ): Promise<SearchResults> => {
    const params = new URLSearchParams();
    params.append('q', query);
    params.append('limit', limit.toString());
    entityTypes.forEach(type => params.append('entity_types', type));

    return apiGet<SearchResults>(`/search/quick?${params.toString()}`);
  },

  // Search suggestions and autocomplete
  getSuggestions: async (
    query: string,
    entityTypes?: SearchEntityType[],
    limit = 10
  ): Promise<SearchSuggestionsResponse> => {
    const params = new URLSearchParams();
    params.append('q', query);
    params.append('limit', limit.toString());
    if (entityTypes) {
      entityTypes.forEach(type => params.append('entity_types', type));
    }

    return apiGet<SearchSuggestionsResponse>(`/search/suggestions?${params.toString()}`);
  },

  // Get available tags for filtering
  getAvailableTags: async (entityTypes?: SearchEntityType[]): Promise<string[]> => {
    const params = new URLSearchParams();
    if (entityTypes) {
      entityTypes.forEach(type => params.append('entity_types', type));
    }

    const response = await apiGet<{ tags: string[] }>(`/search/tags?${params.toString()}`);
    return response.tags;
  },

  // Get search facets for dynamic filtering
  getFacets: async (
    filters: UniversalSearchFilters,
    entityTypes: SearchEntityType[]
  ): Promise<any> => {
    const requestData = {
      filters,
      entity_types: entityTypes
    };

    return apiPost<any, typeof requestData>('/search/facets', requestData);
  },

  // Filter Presets Management
  getFilterPresets: async (
    entityTypes?: SearchEntityType[],
    includePublic = true
  ): Promise<SearchFilterPreset[]> => {
    const params = new URLSearchParams();
    if (entityTypes) {
      entityTypes.forEach(type => params.append('entity_types', type));
    }
    if (includePublic) {
      params.append('include_public', 'true');
    }

    return apiGet<SearchFilterPreset[]>(`/search/presets?${params.toString()}`);
  },

  createFilterPreset: async (preset: SearchFilterPresetCreate): Promise<SearchFilterPreset> => {
    return apiPost<SearchFilterPreset, SearchFilterPresetCreate>('/search/presets', preset);
  },

  updateFilterPreset: async (
    presetId: string,
    updates: SearchFilterPresetUpdate
  ): Promise<SearchFilterPreset> => {
    return apiPut<SearchFilterPreset, SearchFilterPresetUpdate>(`/search/presets/${presetId}`, updates);
  },

  deleteFilterPreset: async (presetId: string): Promise<{ message: string }> => {
    return apiDelete<{ message: string }>(`/search/presets/${presetId}`);
  },

  // Search History
  getSearchHistory: async (limit = 50): Promise<SearchHistoryEntry[]> => {
    return apiGet<SearchHistoryEntry[]>(`/search/history?limit=${limit}`);
  },

  clearSearchHistory: async (): Promise<{ message: string }> => {
    return apiDelete<{ message: string }>('/search/history');
  },

  // Search Analytics
  getSearchAnalytics: async (
    startDate?: string,
    endDate?: string
  ): Promise<SearchAnalytics> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    return apiGet<SearchAnalytics>(`/search/analytics?${params.toString()}`);
  },

  // Search Configuration
  getSearchConfiguration: async (): Promise<SearchConfiguration> => {
    return apiGet<SearchConfiguration>('/search/config');
  },

  updateSearchConfiguration: async (
    config: Partial<SearchConfiguration>
  ): Promise<SearchConfiguration> => {
    return apiPut<SearchConfiguration, Partial<SearchConfiguration>>('/search/config', config);
  },

  // Export Search Results
  exportSearchResults: async (
    exportRequest: SearchExportRequest
  ): Promise<SearchExportResponse> => {
    return apiPost<SearchExportResponse, SearchExportRequest>('/search/export', exportRequest);
  },

  getExportStatus: async (exportId: string): Promise<SearchExportResponse> => {
    return apiGet<SearchExportResponse>(`/search/export/${exportId}`);
  },

  downloadExport: async (exportId: string): Promise<Blob> => {
    const response = await fetch(
      `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/search/export/${exportId}/download`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to download export');
    }

    return response.blob();
  },

  // Entity-specific search functions
  inventory: {
    search: async (
      filters: UniversalSearchFilters['inventory'] & { search?: string },
      page = 1,
      perPage = 20
    ): Promise<SearchResults> => {
      const searchFilters: UniversalSearchFilters = {
        search: filters.search,
        entity_types: ['inventory'],
        inventory: filters,
        page,
        per_page: perPage
      };

      return searchApi.search(searchFilters, page, perPage);
    },

    getCategories: async (): Promise<any[]> => {
      return apiGet<any[]>('/search/inventory/categories');
    },

    getCustomAttributes: async (): Promise<any[]> => {
      return apiGet<any[]>('/search/inventory/attributes');
    }
  },

  invoices: {
    search: async (
      filters: UniversalSearchFilters['invoices'] & { search?: string },
      page = 1,
      perPage = 20
    ): Promise<SearchResults> => {
      const searchFilters: UniversalSearchFilters = {
        search: filters.search,
        entity_types: ['invoices'],
        invoices: filters,
        page,
        per_page: perPage
      };

      return searchApi.search(searchFilters, page, perPage);
    },

    getStatuses: async (): Promise<string[]> => {
      const response = await apiGet<{ statuses: string[] }>('/search/invoices/statuses');
      return response.statuses;
    },

    getWorkflowStages: async (): Promise<string[]> => {
      const response = await apiGet<{ stages: string[] }>('/search/invoices/workflow-stages');
      return response.stages;
    }
  },

  customers: {
    search: async (
      filters: UniversalSearchFilters['customers'] & { search?: string },
      page = 1,
      perPage = 20
    ): Promise<SearchResults> => {
      const searchFilters: UniversalSearchFilters = {
        search: filters.search,
        entity_types: ['customers'],
        customers: filters,
        page,
        per_page: perPage
      };

      return searchApi.search(searchFilters, page, perPage);
    },

    getCustomerTypes: async (): Promise<string[]> => {
      const response = await apiGet<{ types: string[] }>('/search/customers/types');
      return response.types;
    },

    getCities: async (): Promise<string[]> => {
      const response = await apiGet<{ cities: string[] }>('/search/customers/cities');
      return response.cities;
    },

    getCountries: async (): Promise<string[]> => {
      const response = await apiGet<{ countries: string[] }>('/search/customers/countries');
      return response.countries;
    }
  },

  accounting: {
    search: async (
      filters: UniversalSearchFilters['accounting'] & { search?: string },
      page = 1,
      perPage = 20
    ): Promise<SearchResults> => {
      const searchFilters: UniversalSearchFilters = {
        search: filters.search,
        entity_types: ['accounting'],
        accounting: filters,
        page,
        per_page: perPage
      };

      return searchApi.search(searchFilters, page, perPage);
    },

    getEntryTypes: async (): Promise<string[]> => {
      const response = await apiGet<{ types: string[] }>('/search/accounting/entry-types');
      return response.types;
    },

    getAccountTypes: async (): Promise<string[]> => {
      const response = await apiGet<{ types: string[] }>('/search/accounting/account-types');
      return response.types;
    },

    getSubsidiaryTypes: async (): Promise<string[]> => {
      const response = await apiGet<{ types: string[] }>('/search/accounting/subsidiary-types');
      return response.types;
    },

    getFiscalYears: async (): Promise<number[]> => {
      const response = await apiGet<{ years: number[] }>('/search/accounting/fiscal-years');
      return response.years;
    },

    getAccountingPeriods: async (): Promise<string[]> => {
      const response = await apiGet<{ periods: string[] }>('/search/accounting/periods');
      return response.periods;
    }
  },

  // Advanced search with complex filters
  advancedSearch: async (
    query: string,
    entityTypes: SearchEntityType[],
    complexFilters: any,
    page = 1,
    perPage = 20
  ): Promise<SearchResults> => {
    const searchData = {
      search: query,
      entity_types: entityTypes,
      complex_filters: complexFilters,
      page,
      per_page: perPage
    };

    return apiPost<SearchResults, typeof searchData>('/search/advanced', searchData);
  },

  // Batch operations
  batchSearch: async (
    queries: Array<{
      filters: UniversalSearchFilters;
      entity_types: SearchEntityType[];
    }>
  ): Promise<SearchResults[]> => {
    return apiPost<SearchResults[], typeof queries>('/search/batch', { queries });
  },

  // Search optimization
  optimizeSearch: async (
    filters: UniversalSearchFilters,
    entityTypes: SearchEntityType[]
  ): Promise<{
    optimized_filters: UniversalSearchFilters;
    performance_hints: string[];
    estimated_results: number;
  }> => {
    const requestData = {
      filters,
      entity_types: entityTypes
    };

    return apiPost<any, typeof requestData>('/search/optimize', requestData);
  },

  // Search validation
  validateSearch: async (
    filters: UniversalSearchFilters,
    entityTypes: SearchEntityType[]
  ): Promise<{
    is_valid: boolean;
    errors: string[];
    warnings: string[];
    suggestions: string[];
  }> => {
    const requestData = {
      filters,
      entity_types: entityTypes
    };

    return apiPost<any, typeof requestData>('/search/validate', requestData);
  }
};