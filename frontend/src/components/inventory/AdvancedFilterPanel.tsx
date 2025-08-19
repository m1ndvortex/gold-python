import React, { useState, useEffect } from 'react';
import { 
  Filter, 
  Search, 
  X, 
  ChevronDown, 
  ChevronRight, 
  Save, 
  Bookmark, 
  RotateCcw,
  SlidersHorizontal,
  Package,
  DollarSign,
  Calendar,
  Tag,
  TrendingDown,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../ui/collapsible';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '../ui/popover';
import { Calendar as CalendarComponent } from '../ui/calendar';
import { cn } from '../../lib/utils';
import type { Category } from '../../types';

interface FilterPreset {
  id: string;
  name: string;
  filters: InventoryFilters;
  isDefault?: boolean;
  createdAt: string;
}

interface InventoryFilters {
  search?: string;
  categories: string[];
  priceRange: {
    min?: number;
    max?: number;
  };
  stockRange: {
    min?: number;
    max?: number;
  };
  weightRange: {
    min?: number;
    max?: number;
  };
  dateRange: {
    from?: Date;
    to?: Date;
  };
  status: ('active' | 'inactive')[];
  stockStatus: ('in_stock' | 'low_stock' | 'out_of_stock')[];
  sortBy: 'name' | 'price' | 'stock' | 'created_at' | 'updated_at';
  sortOrder: 'asc' | 'desc';
}

interface CategoryNode extends Category {
  children: CategoryNode[];
  level: number;
  productCount?: number;
}

interface AdvancedFilterPanelProps {
  categories: Category[];
  filters: InventoryFilters;
  onFiltersChange: (filters: InventoryFilters) => void;
  presets?: FilterPreset[];
  onSavePreset?: (name: string, filters: InventoryFilters) => void;
  onDeletePreset?: (presetId: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

const defaultFilters: InventoryFilters = {
  search: '',
  categories: [],
  priceRange: {},
  stockRange: {},
  weightRange: {},
  dateRange: {},
  status: ['active'],
  stockStatus: ['in_stock', 'low_stock'],
  sortBy: 'name',
  sortOrder: 'asc',
};

export const AdvancedFilterPanel: React.FC<AdvancedFilterPanelProps> = ({
  categories,
  filters,
  onFiltersChange,
  presets = [],
  onSavePreset,
  onDeletePreset,
  isOpen,
  onToggle,
  className
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [presetName, setPresetName] = useState('');
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['categories', 'price', 'stock', 'general'])
  );

  // Build category tree
  const categoryTree = React.useMemo(() => {
    const buildTree = (parentId: string | null = null, level = 0): CategoryNode[] => {
      return categories
        .filter(cat => cat.parent_id === parentId)
        .map(cat => ({
          ...cat,
          level,
          children: buildTree(cat.id, level + 1),
          productCount: Math.floor(Math.random() * 50) // Mock data
        }));
    };
    return buildTree();
  }, [categories]);

  const handleFilterChange = (key: keyof InventoryFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const handleCategoryToggle = (categoryId: string) => {
    const newCategories = filters.categories.includes(categoryId)
      ? filters.categories.filter(id => id !== categoryId)
      : [...filters.categories, categoryId];
    
    handleFilterChange('categories', newCategories);
  };

  const handleClearFilters = () => {
    onFiltersChange(defaultFilters);
  };

  const handleApplyPreset = (preset: FilterPreset) => {
    onFiltersChange(preset.filters);
  };

  const handleSaveCurrentPreset = () => {
    if (presetName.trim() && onSavePreset) {
      onSavePreset(presetName.trim(), filters);
      setPresetName('');
      setShowSavePreset(false);
    }
  };

  const toggleCategoryExpansion = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const renderCategoryNode = (node: CategoryNode) => {
    const isSelected = filters.categories.includes(node.id);
    const isExpanded = expandedCategories.has(node.id);
    const hasChildren = node.children.length > 0;
    const indent = node.level * 16;

    return (
      <div key={node.id} className="space-y-1">
        <div
          className={cn(
            "flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer",
            isSelected && "bg-primary/10"
          )}
          style={{ paddingLeft: `${8 + indent}px` }}
        >
          {hasChildren ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 p-0"
              onClick={() => toggleCategoryExpansion(node.id)}
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
          ) : (
            <div className="w-4 h-4" />
          )}

          <Checkbox
            checked={isSelected}
            onCheckedChange={() => handleCategoryToggle(node.id)}
          />
          
          <div className="flex-1 flex items-center justify-between">
            <span className="text-sm font-medium">{node.name}</span>
            {node.productCount !== undefined && (
              <Badge variant="secondary" className="text-xs">
                {node.productCount}
              </Badge>
            )}
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="space-y-1">
            {node.children.map(child => renderCategoryNode(child))}
          </div>
        )}
      </div>
    );
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.categories.length > 0) count++;
    if (filters.priceRange.min !== undefined || filters.priceRange.max !== undefined) count++;
    if (filters.stockRange.min !== undefined || filters.stockRange.max !== undefined) count++;
    if (filters.weightRange.min !== undefined || filters.weightRange.max !== undefined) count++;
    if (filters.dateRange.from || filters.dateRange.to) count++;
    if (filters.status.length !== 1 || !filters.status.includes('active')) count++;
    if (filters.stockStatus.length !== 2) count++;
    return count;
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        onClick={onToggle}
        className={cn("flex items-center gap-2", className)}
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filters
        {getActiveFiltersCount() > 0 && (
          <Badge variant="secondary" className="ml-1">
            {getActiveFiltersCount()}
          </Badge>
        )}
      </Button>
    );
  }

  return (
    <Card className={cn("w-80", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Advanced Filters
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              disabled={getActiveFiltersCount() === 0}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filter Presets */}
        {presets.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Quick Filters</Label>
            <div className="flex flex-wrap gap-2">
              {presets.map((preset) => (
                <Button
                  key={preset.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleApplyPreset(preset)}
                  className="text-xs"
                >
                  <Bookmark className="h-3 w-3 mr-1" />
                  {preset.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search products..."
                  value={filters.search || ''}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Categories */}
            <Collapsible
              open={expandedSections.has('categories')}
              onOpenChange={() => toggleSection('categories')}
            >
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                  <Label className="text-sm font-medium cursor-pointer">
                    Categories
                    {filters.categories.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {filters.categories.length}
                      </Badge>
                    )}
                  </Label>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 mt-2">
                <div className="max-h-48 overflow-y-auto border rounded-md p-2">
                  {categoryTree.length > 0 ? (
                    categoryTree.map(node => renderCategoryNode(node))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No categories available
                    </p>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Separator />

            {/* Price Range */}
            <Collapsible
              open={expandedSections.has('price')}
              onOpenChange={() => toggleSection('price')}
            >
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                  <Label className="text-sm font-medium cursor-pointer flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Price Range
                  </Label>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 mt-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="price-min" className="text-xs">Min ($)</Label>
                    <Input
                      id="price-min"
                      type="number"
                      placeholder="0"
                      value={filters.priceRange.min || ''}
                      onChange={(e) => handleFilterChange('priceRange', {
                        ...filters.priceRange,
                        min: e.target.value ? parseFloat(e.target.value) : undefined
                      })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="price-max" className="text-xs">Max ($)</Label>
                    <Input
                      id="price-max"
                      type="number"
                      placeholder="1000"
                      value={filters.priceRange.max || ''}
                      onChange={(e) => handleFilterChange('priceRange', {
                        ...filters.priceRange,
                        max: e.target.value ? parseFloat(e.target.value) : undefined
                      })}
                    />
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Stock Range */}
            <Collapsible
              open={expandedSections.has('stock')}
              onOpenChange={() => toggleSection('stock')}
            >
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                  <Label className="text-sm font-medium cursor-pointer flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Stock Range
                  </Label>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 mt-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="stock-min" className="text-xs">Min</Label>
                    <Input
                      id="stock-min"
                      type="number"
                      placeholder="0"
                      value={filters.stockRange.min || ''}
                      onChange={(e) => handleFilterChange('stockRange', {
                        ...filters.stockRange,
                        min: e.target.value ? parseInt(e.target.value) : undefined
                      })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="stock-max" className="text-xs">Max</Label>
                    <Input
                      id="stock-max"
                      type="number"
                      placeholder="100"
                      value={filters.stockRange.max || ''}
                      onChange={(e) => handleFilterChange('stockRange', {
                        ...filters.stockRange,
                        max: e.target.value ? parseInt(e.target.value) : undefined
                      })}
                    />
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Weight Range */}
            <Collapsible
              open={expandedSections.has('weight')}
              onOpenChange={() => toggleSection('weight')}
            >
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                  <Label className="text-sm font-medium cursor-pointer">
                    Weight Range (grams)
                  </Label>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 mt-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="weight-min" className="text-xs">Min (g)</Label>
                    <Input
                      id="weight-min"
                      type="number"
                      step="0.001"
                      placeholder="0"
                      value={filters.weightRange.min || ''}
                      onChange={(e) => handleFilterChange('weightRange', {
                        ...filters.weightRange,
                        min: e.target.value ? parseFloat(e.target.value) : undefined
                      })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="weight-max" className="text-xs">Max (g)</Label>
                    <Input
                      id="weight-max"
                      type="number"
                      step="0.001"
                      placeholder="100"
                      value={filters.weightRange.max || ''}
                      onChange={(e) => handleFilterChange('weightRange', {
                        ...filters.weightRange,
                        max: e.target.value ? parseFloat(e.target.value) : undefined
                      })}
                    />
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Separator />

            {/* Status Filters */}
            <Collapsible
              open={expandedSections.has('general')}
              onOpenChange={() => toggleSection('general')}
            >
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                  <Label className="text-sm font-medium cursor-pointer">
                    Status & General
                  </Label>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 mt-2">
                {/* Product Status */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Product Status</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={filters.status.includes('active')}
                        onCheckedChange={(checked) => {
                          const newStatus = checked
                            ? [...filters.status.filter(s => s !== 'active'), 'active']
                            : filters.status.filter(s => s !== 'active');
                          handleFilterChange('status', newStatus);
                        }}
                      />
                      <Label className="text-xs flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        Active
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={filters.status.includes('inactive')}
                        onCheckedChange={(checked) => {
                          const newStatus = checked
                            ? [...filters.status.filter(s => s !== 'inactive'), 'inactive']
                            : filters.status.filter(s => s !== 'inactive');
                          handleFilterChange('status', newStatus);
                        }}
                      />
                      <Label className="text-xs flex items-center gap-1">
                        <EyeOff className="h-3 w-3" />
                        Inactive
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Stock Status */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Stock Status</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={filters.stockStatus.includes('in_stock')}
                        onCheckedChange={(checked) => {
                          const newStatus = checked
                            ? [...filters.stockStatus.filter(s => s !== 'in_stock'), 'in_stock']
                            : filters.stockStatus.filter(s => s !== 'in_stock');
                          handleFilterChange('stockStatus', newStatus);
                        }}
                      />
                      <Label className="text-xs">In Stock</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={filters.stockStatus.includes('low_stock')}
                        onCheckedChange={(checked) => {
                          const newStatus = checked
                            ? [...filters.stockStatus.filter(s => s !== 'low_stock'), 'low_stock']
                            : filters.stockStatus.filter(s => s !== 'low_stock');
                          handleFilterChange('stockStatus', newStatus);
                        }}
                      />
                      <Label className="text-xs flex items-center gap-1">
                        <TrendingDown className="h-3 w-3" />
                        Low Stock
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={filters.stockStatus.includes('out_of_stock')}
                        onCheckedChange={(checked) => {
                          const newStatus = checked
                            ? [...filters.stockStatus.filter(s => s !== 'out_of_stock'), 'out_of_stock']
                            : filters.stockStatus.filter(s => s !== 'out_of_stock');
                          handleFilterChange('stockStatus', newStatus);
                        }}
                      />
                      <Label className="text-xs">Out of Stock</Label>
                    </div>
                  </div>
                </div>

                {/* Sort Options */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Sort By</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      value={filters.sortBy}
                      onValueChange={(value) => handleFilterChange('sortBy', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="price">Price</SelectItem>
                        <SelectItem value="stock">Stock</SelectItem>
                        <SelectItem value="created_at">Created</SelectItem>
                        <SelectItem value="updated_at">Updated</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={filters.sortOrder}
                      onValueChange={(value) => handleFilterChange('sortOrder', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asc">Ascending</SelectItem>
                        <SelectItem value="desc">Descending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </ScrollArea>

        <Separator />

        {/* Save Preset */}
        {onSavePreset && (
          <div className="space-y-2">
            {showSavePreset ? (
              <div className="flex gap-2">
                <Input
                  placeholder="Preset name..."
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveCurrentPreset();
                    } else if (e.key === 'Escape') {
                      setShowSavePreset(false);
                      setPresetName('');
                    }
                  }}
                />
                <Button
                  size="sm"
                  onClick={handleSaveCurrentPreset}
                  disabled={!presetName.trim()}
                >
                  <Save className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setShowSavePreset(false);
                    setPresetName('');
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSavePreset(true)}
                className="w-full"
                disabled={getActiveFiltersCount() === 0}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Current Filters
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};