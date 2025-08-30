/**
 * Search Filters Component
 * Advanced filtering interface with dynamic filter generation
 */

import React, { useState, useCallback } from 'react';
import { ChevronDown, ChevronRight, Calendar, DollarSign, Hash, Tag, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Slider } from '../ui/slider';
import { DatePicker } from '../ui/date-picker';
import { Badge } from '../ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { CategoryTreeFilter } from './CategoryTreeFilter';
import { TagFilter } from './TagFilter';
import { AttributeFilter } from './AttributeFilter';
import { useLanguage } from '../../hooks/useLanguage';
import {
  UniversalSearchFilters,
  SearchFacets,
  SearchEntityType,
  SearchFiltersProps
} from '../../types/search';

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  filters,
  facets,
  onFiltersChange,
  enabledEntities,
  categories,
  availableTags,
  customAttributes
}) => {
  const { t, isRTL } = useLanguage();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['categories', 'price', 'date'])
  );

  // Toggle section expansion
  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  }, []);

  // Update filters helper
  const updateFilters = useCallback((updates: Partial<UniversalSearchFilters>) => {
    onFiltersChange({ ...filters, ...updates });
  }, [filters, onFiltersChange]);

  // Update entity-specific filters
  const updateEntityFilters = useCallback((
    entityType: SearchEntityType,
    updates: any
  ) => {
    const currentEntityFilters = filters[entityType] || {};
    updateFilters({
      [entityType]: { ...currentEntityFilters, ...updates }
    });
  }, [filters, updateFilters]);

  // Price range filter
  const PriceRangeFilter = ({ entityType }: { entityType: SearchEntityType }) => {
    const entityFilters = filters[entityType] || {};
    const priceRange = entityFilters.price_range || entityFilters.amount_range || {};

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">{t('search.filters.minPrice')}</Label>
            <Input
              type="number"
              placeholder="0"
              value={priceRange.min || ''}
              onChange={(e) => {
                const value = e.target.value ? parseFloat(e.target.value) : undefined;
                updateEntityFilters(entityType, {
                  [entityType === 'accounting' ? 'amount_range' : 'price_range']: {
                    ...priceRange,
                    min: value
                  }
                });
              }}
            />
          </div>
          <div>
            <Label className="text-xs">{t('search.filters.maxPrice')}</Label>
            <Input
              type="number"
              placeholder="∞"
              value={priceRange.max || ''}
              onChange={(e) => {
                const value = e.target.value ? parseFloat(e.target.value) : undefined;
                updateEntityFilters(entityType, {
                  [entityType === 'accounting' ? 'amount_range' : 'price_range']: {
                    ...priceRange,
                    max: value
                  }
                });
              }}
            />
          </div>
        </div>
      </div>
    );
  };

  // Date range filter
  const DateRangeFilter = () => {
    const dateRange = filters.date_range || {};

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-2">
          <div>
            <Label className="text-xs">{t('search.filters.fromDate')}</Label>
            <DatePicker
              selected={dateRange.from}
              onSelect={(date) => {
                updateFilters({
                  date_range: { ...dateRange, from: date }
                });
              }}
              placeholder={t('search.filters.selectDate')}
            />
          </div>
          <div>
            <Label className="text-xs">{t('search.filters.toDate')}</Label>
            <DatePicker
              selected={dateRange.to}
              onSelect={(date) => {
                updateFilters({
                  date_range: { ...dateRange, to: date }
                });
              }}
              placeholder={t('search.filters.selectDate')}
            />
          </div>
        </div>
      </div>
    );
  };

  // Status filter for different entity types
  const StatusFilter = ({ entityType }: { entityType: SearchEntityType }) => {
    const entityFilters = filters[entityType] || {};
    let statusOptions: string[] = [];
    let selectedStatuses: string[] = [];

    switch (entityType) {
      case 'inventory':
        statusOptions = ['active', 'inactive', 'low_stock', 'out_of_stock'];
        selectedStatuses = entityFilters.is_active !== undefined 
          ? [entityFilters.is_active ? 'active' : 'inactive']
          : [];
        break;
      case 'invoices':
        statusOptions = entityFilters.statuses || [];
        selectedStatuses = entityFilters.statuses || [];
        break;
      case 'customers':
        statusOptions = ['active', 'inactive', 'blacklisted'];
        selectedStatuses = [];
        if (entityFilters.is_active === true) selectedStatuses.push('active');
        if (entityFilters.is_active === false) selectedStatuses.push('inactive');
        if (entityFilters.blacklisted === true) selectedStatuses.push('blacklisted');
        break;
      case 'accounting':
        statusOptions = entityFilters.entry_types || [];
        selectedStatuses = entityFilters.entry_types || [];
        break;
    }

    return (
      <div className="space-y-2">
        {statusOptions.map((status) => (
          <div key={status} className="flex items-center space-x-2">
            <Checkbox
              id={`status-${status}`}
              checked={selectedStatuses.includes(status)}
              onCheckedChange={(checked) => {
                let newStatuses = [...selectedStatuses];
                if (checked) {
                  newStatuses.push(status);
                } else {
                  newStatuses = newStatuses.filter(s => s !== status);
                }

                // Update entity-specific filters based on type
                switch (entityType) {
                  case 'inventory':
                    updateEntityFilters(entityType, {
                      is_active: newStatuses.includes('active') ? true : 
                                newStatuses.includes('inactive') ? false : undefined
                    });
                    break;
                  case 'invoices':
                    updateEntityFilters(entityType, { statuses: newStatuses });
                    break;
                  case 'customers':
                    updateEntityFilters(entityType, {
                      is_active: newStatuses.includes('active') ? true :
                                newStatuses.includes('inactive') ? false : undefined,
                      blacklisted: newStatuses.includes('blacklisted') ? true : undefined
                    });
                    break;
                  case 'accounting':
                    updateEntityFilters(entityType, { entry_types: newStatuses });
                    break;
                }
              }}
            />
            <Label htmlFor={`status-${status}`} className="text-sm">
              {t(`search.filters.status.${status}`)}
            </Label>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-4 w-4" />
            {t('search.filters.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Categories Filter */}
          {(enabledEntities.includes('inventory') || enabledEntities.includes('customers')) && (
            <Collapsible
              open={expandedSections.has('categories')}
              onOpenChange={() => toggleSection('categories')}
            >
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                  <span className="font-medium">{t('search.filters.categories')}</span>
                  {expandedSections.has('categories') ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3">
                <CategoryTreeFilter
                  categories={categories}
                  selectedCategories={filters.inventory?.category_ids || []}
                  onCategorySelect={(categoryIds) => {
                    updateEntityFilters('inventory', { category_ids: categoryIds });
                  }}
                  multiSelect={true}
                  showItemCounts={true}
                />
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Tags Filter */}
          {enabledEntities.includes('inventory') && (
            <Collapsible
              open={expandedSections.has('tags')}
              onOpenChange={() => toggleSection('tags')}
            >
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                  <span className="font-medium flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    {t('search.filters.tags')}
                  </span>
                  {expandedSections.has('tags') ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3">
                <TagFilter
                  availableTags={availableTags}
                  selectedTags={filters.inventory?.tags || []}
                  onTagsChange={(tags) => {
                    updateEntityFilters('inventory', { tags });
                  }}
                  showSuggestions={true}
                  allowCustomTags={true}
                />
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Price/Amount Range Filter */}
          <Collapsible
            open={expandedSections.has('price')}
            onOpenChange={() => toggleSection('price')}
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                <span className="font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  {t('search.filters.priceRange')}
                </span>
                {expandedSections.has('price') ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              {enabledEntities.map((entityType) => (
                <div key={entityType} className="mb-4">
                  <Label className="text-sm font-medium mb-2 block">
                    {t(`search.entityTypes.${entityType}`)}
                  </Label>
                  <PriceRangeFilter entityType={entityType} />
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>

          {/* Date Range Filter */}
          <Collapsible
            open={expandedSections.has('date')}
            onOpenChange={() => toggleSection('date')}
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                <span className="font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {t('search.filters.dateRange')}
                </span>
                {expandedSections.has('date') ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              <DateRangeFilter />
            </CollapsibleContent>
          </Collapsible>

          {/* Status Filters */}
          <Collapsible
            open={expandedSections.has('status')}
            onOpenChange={() => toggleSection('status')}
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                <span className="font-medium flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  {t('search.filters.status.title')}
                </span>
                {expandedSections.has('status') ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              {enabledEntities.map((entityType) => (
                <div key={entityType} className="mb-4">
                  <Label className="text-sm font-medium mb-2 block">
                    {t(`search.entityTypes.${entityType}`)}
                  </Label>
                  <StatusFilter entityType={entityType} />
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>

          {/* Custom Attributes Filter */}
          {enabledEntities.includes('inventory') && customAttributes.length > 0 && (
            <Collapsible
              open={expandedSections.has('attributes')}
              onOpenChange={() => toggleSection('attributes')}
            >
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                  <span className="font-medium">{t('search.filters.customAttributes')}</span>
                  {expandedSections.has('attributes') ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3">
                <AttributeFilter
                  attributes={customAttributes}
                  selectedAttributes={filters.inventory?.custom_attributes || {}}
                  onAttributesChange={(attributes) => {
                    updateEntityFilters('inventory', { custom_attributes: attributes });
                  }}
                  showAdvancedOperators={true}
                />
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Invoice-specific filters */}
          {enabledEntities.includes('invoices') && (
            <Collapsible
              open={expandedSections.has('invoice-specific')}
              onOpenChange={() => toggleSection('invoice-specific')}
            >
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                  <span className="font-medium">{t('search.filters.invoiceSpecific')}</span>
                  {expandedSections.has('invoice-specific') ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 space-y-4">
                {/* Invoice Type */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    {t('search.filters.invoiceType')}
                  </Label>
                  <div className="space-y-2">
                    {['gold', 'general'].map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={`invoice-type-${type}`}
                          checked={filters.invoices?.types?.includes(type as 'gold' | 'general')}
                          onCheckedChange={(checked) => {
                            const currentTypes = filters.invoices?.types || [];
                            const newTypes = checked
                              ? [...currentTypes, type as 'gold' | 'general']
                              : currentTypes.filter(t => t !== type);
                            updateEntityFilters('invoices', { types: newTypes });
                          }}
                        />
                        <Label htmlFor={`invoice-type-${type}`} className="text-sm">
                          {t(`search.filters.invoiceType.${type}`)}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Status */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    {t('search.filters.paymentStatus')}
                  </Label>
                  <div className="space-y-2">
                    {['paid', 'unpaid', 'partially_paid', 'overdue'].map((status) => (
                      <div key={status} className="flex items-center space-x-2">
                        <Checkbox
                          id={`payment-status-${status}`}
                          checked={filters.invoices?.payment_statuses?.includes(status)}
                          onCheckedChange={(checked) => {
                            const currentStatuses = filters.invoices?.payment_statuses || [];
                            const newStatuses = checked
                              ? [...currentStatuses, status]
                              : currentStatuses.filter(s => s !== status);
                            updateEntityFilters('invoices', { payment_statuses: newStatuses });
                          }}
                        />
                        <Label htmlFor={`payment-status-${status}`} className="text-sm">
                          {t(`search.filters.paymentStatus.${status}`)}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Customer-specific filters */}
          {enabledEntities.includes('customers') && (
            <Collapsible
              open={expandedSections.has('customer-specific')}
              onOpenChange={() => toggleSection('customer-specific')}
            >
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                  <span className="font-medium">{t('search.filters.customerSpecific')}</span>
                  {expandedSections.has('customer-specific') ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 space-y-4">
                {/* Has Debt */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has-debt"
                    checked={filters.customers?.has_debt}
                    onCheckedChange={(checked) => {
                      updateEntityFilters('customers', { has_debt: checked });
                    }}
                  />
                  <Label htmlFor="has-debt" className="text-sm">
                    {t('search.filters.hasDebt')}
                  </Label>
                </div>

                {/* Debt Range */}
                {filters.customers?.has_debt && (
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      {t('search.filters.debtRange')}
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        placeholder={t('search.filters.minDebt')}
                        value={filters.customers?.debt_range?.min || ''}
                        onChange={(e) => {
                          const value = e.target.value ? parseFloat(e.target.value) : undefined;
                          const currentRange = filters.customers?.debt_range || {};
                          updateEntityFilters('customers', {
                            debt_range: { ...currentRange, min: value }
                          });
                        }}
                      />
                      <Input
                        type="number"
                        placeholder={t('search.filters.maxDebt')}
                        value={filters.customers?.debt_range?.max || ''}
                        onChange={(e) => {
                          const value = e.target.value ? parseFloat(e.target.value) : undefined;
                          const currentRange = filters.customers?.debt_range || {};
                          updateEntityFilters('customers', {
                            debt_range: { ...currentRange, max: value }
                          });
                        }}
                      />
                    </div>
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          )}
        </CardContent>
      </Card>
    </div>
  );
};