/**
 * Universal Search Component
 * Main search interface supporting inventory, invoices, customers, and accounting
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Search, Filter, Settings, History, BarChart3, Download, X } from 'lucide-react';
import { useAdvancedSearch, useSearchPresets } from '../../hooks/useAdvancedSearch';
import { SearchFilters } from './SearchFilters';
import { SearchResults } from './SearchResults';
import { SearchPresets } from './SearchPresets';
import { SearchSuggestions } from './SearchSuggestions';
import { SearchAnalytics } from './SearchAnalytics';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { useLanguage } from '../../hooks/useLanguage';
import {
  UniversalSearchFilters,
  SearchEntityType,
  SearchResultItem,
  UniversalSearchProps
} from '../../types/search';

export const UniversalSearch: React.FC<UniversalSearchProps> = ({
  initialFilters = {},
  enabledEntities = ['inventory', 'invoices', 'customers', 'accounting'],
  onResultClick,
  onFiltersChange,
  showPresets = true,
  showAnalytics = false,
  mobileConfig = {
    compact_mode: false,
    show_entity_icons: true,
    show_thumbnails: true,
    max_description_length: 100,
    enable_voice_search: false,
    enable_barcode_scan: false,
    enable_qr_scan: false
  }
}) => {
  const { t, isRTL } = useLanguage();
  const [showFilters, setShowFilters] = useState(false);
  const [showPresetDialog, setShowPresetDialog] = useState(false);
  const [showAnalyticsDialog, setShowAnalyticsDialog] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'table'>('list');
  const [searchQuery, setSearchQuery] = useState(initialFilters.search || '');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Main search hook
  const {
    filters,
    entityTypes,
    currentPage,
    perPage,
    searchResults,
    isSearching,
    searchError,
    totalResults,
    totalPages,
    hasNextPage,
    hasPrevPage,
    suggestions,
    isLoadingSuggestions,
    availableTags,
    facets,
    hasActiveFilters,
    updateFilters,
    updateEntityTypes,
    clearFilters,
    clearSearch,
    goToPage,
    changePerPage,
    refetchSearch
  } = useAdvancedSearch(initialFilters, enabledEntities);

  // Search presets hook
  const {
    presets,
    createPreset,
    deletePreset,
    isCreating
  } = useSearchPresets(entityTypes);

  // Handle search input change
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setShowSuggestions(value.length >= 2);
    
    // Debounced search update
    const timeoutId = setTimeout(() => {
      updateFilters({ search: value });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [updateFilters]);

  // Handle search submit
  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: searchQuery });
    setShowSuggestions(false);
  }, [searchQuery, updateFilters]);

  // Handle result click
  const handleResultClick = useCallback((result: SearchResultItem) => {
    setShowSuggestions(false);
    onResultClick?.(result);
  }, [onResultClick]);

  // Handle filters change
  const handleFiltersChange = useCallback((newFilters: UniversalSearchFilters) => {
    updateFilters(newFilters);
    onFiltersChange?.(newFilters);
  }, [updateFilters, onFiltersChange]);

  // Handle entity type toggle
  const handleEntityTypeToggle = useCallback((entityType: SearchEntityType) => {
    const newEntityTypes = entityTypes.includes(entityType)
      ? entityTypes.filter(type => type !== entityType)
      : [...entityTypes, entityType];
    updateEntityTypes(newEntityTypes);
  }, [entityTypes, updateEntityTypes]);

  // Handle preset save
  const handlePresetSave = useCallback(async (name: string, description?: string) => {
    try {
      await createPreset({
        name,
        description,
        filters,
        entity_types: entityTypes,
        is_public: false
      });
      setShowPresetDialog(false);
    } catch (error) {
      console.error('Failed to save preset:', error);
    }
  }, [createPreset, filters, entityTypes]);

  // Entity type labels
  const entityTypeLabels: Record<SearchEntityType, string> = {
    inventory: t('search.entityTypes.inventory'),
    invoices: t('search.entityTypes.invoices'),
    customers: t('search.entityTypes.customers'),
    accounting: t('search.entityTypes.accounting')
  };

  // Entity type icons
  const entityTypeIcons: Record<SearchEntityType, string> = {
    inventory: '📦',
    invoices: '🧾',
    customers: '👥',
    accounting: '💰'
  };

  return (
    <div className={`universal-search ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Search Header */}
      <Card className="mb-6">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              {t('search.title')}
            </CardTitle>
            <div className="flex items-center gap-2">
              {showAnalytics && (
                <Dialog open={showAnalyticsDialog} onOpenChange={setShowAnalyticsDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      {t('search.analytics')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl">
                    <DialogHeader>
                      <DialogTitle>{t('search.analytics')}</DialogTitle>
                    </DialogHeader>
                    <SearchAnalytics />
                  </DialogContent>
                </Dialog>
              )}
              
              {showPresets && (
                <Dialog open={showPresetDialog} onOpenChange={setShowPresetDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      {t('search.presets')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{t('search.presets')}</DialogTitle>
                    </DialogHeader>
                    <SearchPresets
                      presets={presets}
                      currentFilters={filters}
                      onPresetSelect={(preset) => {
                        updateFilters(preset.filters);
                        updateEntityTypes(preset.entity_types);
                        setShowPresetDialog(false);
                      }}
                      onPresetSave={handlePresetSave}
                      onPresetDelete={deletePreset}
                    />
                  </DialogContent>
                </Dialog>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={showFilters ? 'bg-primary/10' : ''}
              >
                <Filter className="h-4 w-4 mr-2" />
                {t('search.filters')}
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                    !
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t('search.placeholder')}
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 pr-10"
                onFocus={() => setShowSuggestions(searchQuery.length >= 2)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              />
              {searchQuery && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => {
                    setSearchQuery('');
                    clearSearch();
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            {/* Search Suggestions */}
            {showSuggestions && suggestions && (
              <SearchSuggestions
                suggestions={suggestions}
                onSuggestionClick={(suggestion) => {
                  setSearchQuery(suggestion.text);
                  updateFilters({ search: suggestion.text });
                  setShowSuggestions(false);
                }}
                isLoading={isLoadingSuggestions}
              />
            )}
          </form>

          {/* Entity Type Filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            {enabledEntities.map((entityType) => (
              <Button
                key={entityType}
                variant={entityTypes.includes(entityType) ? "default" : "outline"}
                size="sm"
                onClick={() => handleEntityTypeToggle(entityType)}
                className="flex items-center gap-2"
              >
                {mobileConfig.show_entity_icons && (
                  <span>{entityTypeIcons[entityType]}</span>
                )}
                {entityTypeLabels[entityType]}
                {searchResults && (
                  <Badge variant="secondary" className="ml-1">
                    {searchResults.facets?.entity_types?.options?.find(
                      opt => opt.value === entityType
                    )?.count || 0}
                  </Badge>
                )}
              </Button>
            ))}
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-sm text-muted-foreground">
                {t('search.activeFilters')}:
              </span>
              {/* Add active filter badges here */}
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="h-6 px-2 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                {t('search.clearFilters')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        {showFilters && (
          <div className="lg:col-span-1">
            <SearchFilters
              filters={filters}
              facets={facets}
              onFiltersChange={handleFiltersChange}
              enabledEntities={entityTypes}
              categories={[]} // Will be populated from API
              availableTags={availableTags}
              customAttributes={[]} // Will be populated from API
            />
          </div>
        )}

        {/* Search Results */}
        <div className={showFilters ? "lg:col-span-3" : "lg:col-span-4"}>
          <SearchResults
            results={searchResults}
            loading={isSearching}
            onResultClick={handleResultClick}
            onPageChange={goToPage}
            onSortChange={(sortBy, sortOrder) => {
              updateFilters({ sort_by: sortBy, sort_order: sortOrder });
            }}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        </div>
      </div>
    </div>
  );
};