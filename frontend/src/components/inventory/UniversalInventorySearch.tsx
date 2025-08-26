import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  X, 
  Save, 
  RotateCcw,
  SlidersHorizontal,
  Package,
  DollarSign,
  Tag,
  Hash,
  Barcode,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Switch } from '../ui/switch';

import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../ui/collapsible';
import { useLanguage } from '../../hooks/useLanguage';
import { cn } from '../../lib/utils';
import type { 
  InventorySearchFilters,
  InventorySearchRequest,
  UniversalCategory
} from '../../types/universalInventory';

interface UniversalInventorySearchProps {
  categories: UniversalCategory[];
  filters: InventorySearchFilters;
  onFiltersChange: (filters: InventorySearchFilters) => void;
  onSearch: (request: InventorySearchRequest) => void;
  isLoading?: boolean;
  savedSearches?: SavedSearch[];
  onSaveSearch?: (name: string, filters: InventorySearchFilters) => void;
  onLoadSearch?: (search: SavedSearch) => void;
  onDeleteSearch?: (searchId: string) => void;
  className?: string;
}

interface SavedSearch {
  id: string;
  name: string;
  filters: InventorySearchFilters;
  created_at: string;
}

const SORT_OPTIONS = [
  { value: 'name', label: 'Name' },
  { value: 'sku', label: 'SKU' },
  { value: 'stock_quantity', label: 'Stock Quantity' },
  { value: 'cost_price', label: 'Cost Price' },
  { value: 'sale_price', label: 'Sale Price' },
  { value: 'created_at', label: 'Created Date' },
  { value: 'updated_at', label: 'Updated Date' },
];



export const UniversalInventorySearch: React.FC<UniversalInventorySearchProps> = ({
  categories,
  filters,
  onFiltersChange,
  onSearch,
  isLoading = false,
  savedSearches = [],
  onSaveSearch,
  onLoadSearch,
  className
}) => {
  const { } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['basic']));

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch();
    }, 300);

    return () => clearTimeout(timer);
  }, [filters]);

  const handleSearch = () => {
    const searchRequest: InventorySearchRequest = {
      filters,
      sort_by: filters.sort_by || 'name',
      sort_order: filters.sort_order || 'asc',
      limit: 50,
      offset: 0,
    };
    onSearch(searchRequest);
  };

  const updateFilters = (updates: Partial<InventorySearchFilters>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const resetFilters = () => {
    const defaultFilters: InventorySearchFilters = {
      query: '',
      category_ids: [],
      attributes_filter: {},
      tags_filter: [],
      sku_filter: '',
      barcode_filter: '',
      business_type: '',
      include_inactive: false,
      low_stock_only: false,
      out_of_stock_only: false,
      sort_by: 'name',
      sort_order: 'asc',
    };
    onFiltersChange(defaultFilters);
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleSaveSearch = () => {
    if (saveSearchName.trim() && onSaveSearch) {
      onSaveSearch(saveSearchName.trim(), filters);
      setSaveSearchName('');
      setShowSaveDialog(false);
    }
  };

  // Get active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.query) count++;
    if (filters.category_ids?.length) count++;
    if (filters.tags_filter?.length) count++;
    if (filters.sku_filter) count++;
    if (filters.barcode_filter) count++;
    if (filters.min_stock !== undefined || filters.max_stock !== undefined) count++;
    if (filters.min_cost_price !== undefined || filters.max_cost_price !== undefined) count++;
    if (filters.min_sale_price !== undefined || filters.max_sale_price !== undefined) count++;
    if (filters.low_stock_only) count++;
    if (filters.out_of_stock_only) count++;
    if (filters.include_inactive) count++;
    return count;
  }, [filters]);

  return (
    <Card variant="gradient-blue" className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
              <Search className="h-4 w-4 text-white" />
            </div>
            Advanced Search & Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">{activeFiltersCount} active</Badge>
            )}
          </CardTitle>

          <div className="flex items-center gap-2">
            {savedSearches.length > 0 && (
              <Select onValueChange={(value) => {
                const search = savedSearches.find(s => s.id === value);
                if (search && onLoadSearch) {
                  onLoadSearch(search);
                }
              }}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Saved searches" />
                </SelectTrigger>
                <SelectContent>
                  {savedSearches.map((search) => (
                    <SelectItem key={search.id} value={search.id}>
                      {search.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {onSaveSearch && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSaveDialog(true)}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Save
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Basic Search */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, description, SKU, or barcode..."
              value={filters.query || ''}
              onChange={(e) => updateFilters({ query: e.target.value })}
              className="pl-10 text-base"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>SKU</Label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Enter SKU..."
                  value={filters.sku_filter || ''}
                  onChange={(e) => updateFilters({ sku_filter: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Barcode</Label>
              <div className="relative">
                <Barcode className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Enter barcode..."
                  value={filters.barcode_filter || ''}
                  onChange={(e) => updateFilters({ barcode_filter: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Sort By</Label>
              <Select
                value={filters.sort_by || 'name'}
                onValueChange={(value) => updateFilters({ sort_by: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        {isExpanded && (
          <div className="space-y-6 animate-in slide-in-from-top-2 duration-300">
              <Separator />

              {/* Categories */}
              <Collapsible
                open={expandedSections.has('categories')}
                onOpenChange={() => toggleSection('categories')}
              >
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      <span className="font-medium">Categories</span>
                      {filters.category_ids?.length ? (
                        <Badge variant="secondary">{filters.category_ids.length}</Badge>
                      ) : null}
                    </div>
                    {expandedSections.has('categories') ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 mt-3">
                  <ScrollArea className="h-40">
                    <div className="space-y-2">
                      {categories.map((category) => (
                        <div key={category.id} className="flex items-center space-x-2">
                          <Checkbox
                            checked={filters.category_ids?.includes(category.id) || false}
                            onCheckedChange={(checked) => {
                              const currentIds = filters.category_ids || [];
                              const newIds = checked
                                ? [...currentIds, category.id]
                                : currentIds.filter(id => id !== category.id);
                              updateFilters({ category_ids: newIds });
                            }}
                          />
                          <Label className="text-sm font-normal">{category.name}</Label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CollapsibleContent>
              </Collapsible>

              {/* Stock Levels */}
              <Collapsible
                open={expandedSections.has('stock')}
                onOpenChange={() => toggleSection('stock')}
              >
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      <span className="font-medium">Stock Levels</span>
                    </div>
                    {expandedSections.has('stock') ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 mt-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Minimum Stock</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={filters.min_stock || ''}
                        onChange={(e) => updateFilters({ 
                          min_stock: e.target.value ? Number(e.target.value) : undefined 
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Maximum Stock</Label>
                      <Input
                        type="number"
                        placeholder="1000"
                        value={filters.max_stock || ''}
                        onChange={(e) => updateFilters({ 
                          max_stock: e.target.value ? Number(e.target.value) : undefined 
                        })}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={filters.low_stock_only || false}
                        onCheckedChange={(checked) => updateFilters({ low_stock_only: !!checked })}
                      />
                      <Label className="text-sm">Show only low stock items</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={filters.out_of_stock_only || false}
                        onCheckedChange={(checked) => updateFilters({ out_of_stock_only: !!checked })}
                      />
                      <Label className="text-sm">Show only out of stock items</Label>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Price Range */}
              <Collapsible
                open={expandedSections.has('pricing')}
                onOpenChange={() => toggleSection('pricing')}
              >
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      <span className="font-medium">Price Range</span>
                    </div>
                    {expandedSections.has('pricing') ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 mt-3">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Cost Price Range</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="number"
                          placeholder="Min"
                          value={filters.min_cost_price || ''}
                          onChange={(e) => updateFilters({ 
                            min_cost_price: e.target.value ? Number(e.target.value) : undefined 
                          })}
                        />
                        <Input
                          type="number"
                          placeholder="Max"
                          value={filters.max_cost_price || ''}
                          onChange={(e) => updateFilters({ 
                            max_cost_price: e.target.value ? Number(e.target.value) : undefined 
                          })}
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium mb-2 block">Sale Price Range</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="number"
                          placeholder="Min"
                          value={filters.min_sale_price || ''}
                          onChange={(e) => updateFilters({ 
                            min_sale_price: e.target.value ? Number(e.target.value) : undefined 
                          })}
                        />
                        <Input
                          type="number"
                          placeholder="Max"
                          value={filters.max_sale_price || ''}
                          onChange={(e) => updateFilters({ 
                            max_sale_price: e.target.value ? Number(e.target.value) : undefined 
                          })}
                        />
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Tags */}
              <Collapsible
                open={expandedSections.has('tags')}
                onOpenChange={() => toggleSection('tags')}
              >
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      <span className="font-medium">Tags</span>
                      {filters.tags_filter?.length ? (
                        <Badge variant="secondary">{filters.tags_filter.length}</Badge>
                      ) : null}
                    </div>
                    {expandedSections.has('tags') ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 mt-3">
                  <Input
                    placeholder="Enter tags separated by commas..."
                    value={filters.tags_filter?.join(', ') || ''}
                    onChange={(e) => {
                      const tags = e.target.value
                        .split(',')
                        .map(tag => tag.trim())
                        .filter(tag => tag.length > 0);
                      updateFilters({ tags_filter: tags });
                    }}
                  />
                  {filters.tags_filter?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {filters.tags_filter.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {tag}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => {
                              const newTags = filters.tags_filter?.filter((_, i) => i !== index) || [];
                              updateFilters({ tags_filter: newTags });
                            }}
                          />
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </CollapsibleContent>
              </Collapsible>

              {/* Other Options */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={filters.include_inactive || false}
                    onCheckedChange={(checked) => updateFilters({ include_inactive: checked })}
                  />
                  <Label>Include inactive items</Label>
                </div>

                <div className="flex items-center justify-between">
                  <Label>Sort Order</Label>
                  <Select
                    value={filters.sort_order || 'asc'}
                    onValueChange={(value) => updateFilters({ sort_order: value as 'asc' | 'desc' })}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Ascending
                        </div>
                      </SelectItem>
                      <SelectItem value="desc">
                        <div className="flex items-center gap-2">
                          <TrendingDown className="h-4 w-4" />
                          Descending
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

        {/* Search Button */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {activeFiltersCount > 0 && `${activeFiltersCount} filter${activeFiltersCount > 1 ? 's' : ''} applied`}
          </div>
          <Button 
            variant="gradient-blue" 
            onClick={handleSearch}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Search className="h-4 w-4" />
            {isLoading ? 'Searching...' : 'Search'}
          </Button>
        </div>
      </CardContent>

      {/* Save Search Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardHeader>
              <CardTitle>Save Search</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Search Name</Label>
                <Input
                  placeholder="Enter a name for this search..."
                  value={saveSearchName}
                  onChange={(e) => setSaveSearchName(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveSearch} disabled={!saveSearchName.trim()}>
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Card>
  );
};