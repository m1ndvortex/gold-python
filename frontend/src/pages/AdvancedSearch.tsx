/**
 * Advanced Search Page
 * Main page for universal search functionality
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Settings, History, Download, Share } from 'lucide-react';
import { UniversalSearch } from '../components/search/UniversalSearch';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { useLanguage } from '../hooks/useLanguage';
import { useSearchHistory } from '../hooks/useAdvancedSearch';
import {
  UniversalSearchFilters,
  SearchEntityType,
  SearchResultItem
} from '../types/search';

export const AdvancedSearchPage: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Parse initial filters from URL params
  const getInitialFilters = (): UniversalSearchFilters => {
    const filters: UniversalSearchFilters = {};
    
    // Basic search query
    const query = searchParams.get('q');
    if (query) {
      filters.search = query;
    }

    // Entity types
    const entityTypes = searchParams.getAll('entity');
    if (entityTypes.length > 0) {
      filters.entity_types = entityTypes as SearchEntityType[];
    }

    // Date range
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    if (dateFrom || dateTo) {
      filters.date_range = {};
      if (dateFrom) filters.date_range.from = new Date(dateFrom);
      if (dateTo) filters.date_range.to = new Date(dateTo);
    }

    // Inventory filters
    const categories = searchParams.getAll('category');
    const tags = searchParams.getAll('tag');
    const minPrice = searchParams.get('min_price');
    const maxPrice = searchParams.get('max_price');
    
    if (categories.length > 0 || tags.length > 0 || minPrice || maxPrice) {
      filters.inventory = {};
      if (categories.length > 0) filters.inventory.category_ids = categories;
      if (tags.length > 0) filters.inventory.tags = tags;
      if (minPrice || maxPrice) {
        filters.inventory.price_range = {};
        if (minPrice) filters.inventory.price_range.min = parseFloat(minPrice);
        if (maxPrice) filters.inventory.price_range.max = parseFloat(maxPrice);
      }
    }

    // Invoice filters
    const invoiceTypes = searchParams.getAll('invoice_type');
    const statuses = searchParams.getAll('status');
    
    if (invoiceTypes.length > 0 || statuses.length > 0) {
      filters.invoices = {};
      if (invoiceTypes.length > 0) {
        filters.invoices.types = invoiceTypes as ('gold' | 'general')[];
      }
      if (statuses.length > 0) filters.invoices.statuses = statuses;
    }

    // Customer filters
    const hasDebt = searchParams.get('has_debt');
    if (hasDebt) {
      filters.customers = {
        has_debt: hasDebt === 'true'
      };
    }

    return filters;
  };

  const [initialFilters] = useState<UniversalSearchFilters>(getInitialFilters());
  const [enabledEntities] = useState<SearchEntityType[]>(
    searchParams.getAll('entity') as SearchEntityType[] || 
    ['inventory', 'invoices', 'customers', 'accounting']
  );

  // Search history hook
  const { history, clearHistory, isClearing } = useSearchHistory();

  // Update URL when filters change
  const handleFiltersChange = (filters: UniversalSearchFilters) => {
    const newParams = new URLSearchParams();

    // Basic search query
    if (filters.search) {
      newParams.set('q', filters.search);
    }

    // Entity types
    if (filters.entity_types) {
      filters.entity_types.forEach(type => newParams.append('entity', type));
    }

    // Date range
    if (filters.date_range) {
      if (filters.date_range.from) {
        newParams.set('date_from', filters.date_range.from.toISOString().split('T')[0]);
      }
      if (filters.date_range.to) {
        newParams.set('date_to', filters.date_range.to.toISOString().split('T')[0]);
      }
    }

    // Inventory filters
    if (filters.inventory) {
      if (filters.inventory.category_ids) {
        filters.inventory.category_ids.forEach(id => newParams.append('category', id));
      }
      if (filters.inventory.tags) {
        filters.inventory.tags.forEach(tag => newParams.append('tag', tag));
      }
      if (filters.inventory.price_range) {
        if (filters.inventory.price_range.min) {
          newParams.set('min_price', filters.inventory.price_range.min.toString());
        }
        if (filters.inventory.price_range.max) {
          newParams.set('max_price', filters.inventory.price_range.max.toString());
        }
      }
    }

    // Invoice filters
    if (filters.invoices) {
      if (filters.invoices.types) {
        filters.invoices.types.forEach(type => newParams.append('invoice_type', type));
      }
      if (filters.invoices.statuses) {
        filters.invoices.statuses.forEach(status => newParams.append('status', status));
      }
    }

    // Customer filters
    if (filters.customers?.has_debt !== undefined) {
      newParams.set('has_debt', filters.customers.has_debt.toString());
    }

    setSearchParams(newParams);
  };

  // Handle result click
  const handleResultClick = (result: SearchResultItem) => {
    // Navigate to the appropriate page based on entity type
    switch (result.entity_type) {
      case 'inventory':
        navigate(`/inventory/items/${result.id}`);
        break;
      case 'invoices':
        navigate(`/invoices/${result.id}`);
        break;
      case 'customers':
        navigate(`/customers/${result.id}`);
        break;
      case 'accounting':
        navigate(`/accounting/entries/${result.id}`);
        break;
      default:
        console.log('Clicked result:', result);
    }
  };

  // Handle export search results
  const handleExportResults = () => {
    // TODO: Implement export functionality
    console.log('Export search results');
  };

  // Handle share search
  const handleShareSearch = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: t('search.shareTitle'),
        url: url
      });
    } else {
      navigator.clipboard.writeText(url);
      // TODO: Show toast notification
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Search className="h-8 w-8" />
              {t('search.pageTitle')}
            </h1>
            <p className="text-gray-600 mt-2">
              {t('search.pageDescription')}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Search History */}
            <Dialog open={showHistory} onOpenChange={setShowHistory}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <History className="h-4 w-4 mr-2" />
                  {t('search.history')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{t('search.history')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {history.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">{t('search.noHistory')}</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {history.map((entry) => (
                        <Card key={entry.id} className="cursor-pointer hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate">
                                  {entry.query}
                                </p>
                                <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                                  <span>
                                    {entry.results_count} {t('search.results')}
                                  </span>
                                  <span>
                                    {entry.search_time_ms}ms
                                  </span>
                                  <span>
                                    {new Date(entry.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSearchParams(new URLSearchParams({ q: entry.query }));
                                  setShowHistory(false);
                                }}
                              >
                                {t('search.useQuery')}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                  
                  {history.length > 0 && (
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        onClick={() => clearHistory()}
                        disabled={isClearing}
                      >
                        {t('search.clearHistory')}
                      </Button>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            {/* Export Results */}
            <Button variant="outline" onClick={handleExportResults}>
              <Download className="h-4 w-4 mr-2" />
              {t('search.export')}
            </Button>

            {/* Share Search */}
            <Button variant="outline" onClick={handleShareSearch}>
              <Share className="h-4 w-4 mr-2" />
              {t('search.share')}
            </Button>

            {/* Settings */}
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  {t('search.settings')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('search.settings')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    {t('search.settingsDescription')}
                  </p>
                  {/* TODO: Add search settings form */}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Universal Search Component */}
      <UniversalSearch
        initialFilters={initialFilters}
        enabledEntities={enabledEntities}
        onResultClick={handleResultClick}
        onFiltersChange={handleFiltersChange}
        showPresets={true}
        showAnalytics={true}
        mobileConfig={{
          compact_mode: false,
          show_entity_icons: true,
          show_thumbnails: true,
          max_description_length: 150,
          enable_voice_search: false,
          enable_barcode_scan: false,
          enable_qr_scan: false
        }}
      />
    </div>
  );
};