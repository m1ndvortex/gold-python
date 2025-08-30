/**
 * Universal Advanced Search and Filter Component
 * Advanced search interface using attributes, tags, SKU, barcode, and category hierarchy
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Search,
    Filter,
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
    Plus,
    TrendingDown,
    Eye,
    EyeOff,
    Barcode,
    QrCode,
    Hash
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
import { Switch } from '../ui/switch';
import { Slider } from '../ui/slider';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../hooks/useLanguage';
import { useSearchSuggestions } from '../../hooks/useUniversalInventory';
import type {
    UniversalInventorySearchFilters,
    UniversalCategory,
    UniversalFilterPreset,
    AttributeDefinition
} from '../../types/universalInventory';

interface UniversalAdvancedSearchProps {
    categories: UniversalCategory[];
    filters: UniversalInventorySearchFilters;
    onFiltersChange: (filters: UniversalInventorySearchFilters) => void;
    presets?: UniversalFilterPreset[];
    onSavePreset?: (name: string, filters: UniversalInventorySearchFilters) => void;
    onDeletePreset?: (presetId: string) => void;
    isOpen: boolean;
    onToggle: () => void;
    className?: string;
}

interface CategoryFilterNode extends UniversalCategory {
    children: CategoryFilterNode[];
    itemCount?: number;
}

const defaultFilters: UniversalInventorySearchFilters = {
    search: '',
    category_id: undefined,
    category_path: undefined,
    tags: [],
    custom_attributes: {},
    min_stock: undefined,
    max_stock: undefined,
    low_stock_only: false,
    out_of_stock_only: false,
    min_price: undefined,
    max_price: undefined,
    business_type: undefined,
    has_images: undefined,
    is_active: true,
    created_after: undefined,
    created_before: undefined,
    sort_by: 'name',
    sort_order: 'asc',
};

export const UniversalAdvancedSearch: React.FC<UniversalAdvancedSearchProps> = ({
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
    const { t } = useLanguage();
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
    const [expandedSections, setExpandedSections] = useState<Set<string>>(
        new Set(['search', 'categories', 'stock', 'price', 'general'])
    );
    const [presetName, setPresetName] = useState('');
    const [showSavePreset, setShowSavePreset] = useState(false);
    const [selectedTags, setSelectedTags] = useState<string[]>(filters.tags || []);
    const [tagInput, setTagInput] = useState('');
    const [priceRange, setPriceRange] = useState<[number, number]>([
        filters.min_price || 0,
        filters.max_price || 1000
    ]);
    const [stockRange, setStockRange] = useState<[number, number]>([
        filters.min_stock || 0,
        filters.max_stock || 100
    ]);

    // Search suggestions
    const { data: suggestions } = useSearchSuggestions(searchQuery, 10);

    // Build category tree
    const categoryTree = useMemo(() => {
        const buildTree = (parentId: string | null = null): CategoryFilterNode[] => {
            return categories
                .filter(cat => cat.parent_id === parentId)
                .map(cat => ({
                    ...cat,
                    children: buildTree(cat.id),
                    itemCount: Math.floor(Math.random() * 50) // Mock data - would come from API
                }))
                .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
        };
        return buildTree();
    }, [categories]);

    // Get all available attributes from categories
    const availableAttributes = useMemo(() => {
        const attributeMap = new Map<string, AttributeDefinition>();

        categories.forEach(category => {
            category.attribute_schema.forEach(attr => {
                if (!attributeMap.has(attr.name)) {
                    attributeMap.set(attr.name, attr);
                }
            });
        });

        return Array.from(attributeMap.values());
    }, [categories]);

    // Get unique tags from all categories (mock data - would come from API)
    const availableTags = useMemo(() => {
        return ['electronics', 'jewelry', 'gold', 'silver', 'premium', 'sale', 'new', 'featured'];
    }, []);

    useEffect(() => {
        setSearchQuery(filters.search || '');
        setSelectedTags(filters.tags || []);
        setPriceRange([filters.min_price || 0, filters.max_price || 1000]);
        setStockRange([filters.min_stock || 0, filters.max_stock || 100]);
    }, [filters]);

    const handleFilterChange = useCallback((key: keyof UniversalInventorySearchFilters, value: any) => {
        onFiltersChange({
            ...filters,
            [key]: value
        });
    }, [filters, onFiltersChange]);

    const handleSearchChange = useCallback((value: string) => {
        setSearchQuery(value);
        handleFilterChange('search', value);
    }, [handleFilterChange]);

    const handleCategoryToggle = useCallback((categoryId: string) => {
        const isSelected = filters.category_id === categoryId;
        handleFilterChange('category_id', isSelected ? undefined : categoryId);
    }, [filters.category_id, handleFilterChange]);

    const handleTagAdd = useCallback((tag: string) => {
        if (tag && !selectedTags.includes(tag)) {
            const newTags = [...selectedTags, tag];
            setSelectedTags(newTags);
            handleFilterChange('tags', newTags);
        }
        setTagInput('');
    }, [selectedTags, handleFilterChange]);

    const handleTagRemove = useCallback((tag: string) => {
        const newTags = selectedTags.filter(t => t !== tag);
        setSelectedTags(newTags);
        handleFilterChange('tags', newTags);
    }, [selectedTags, handleFilterChange]);

    const handlePriceRangeChange = useCallback((range: number[]) => {
        const tupleRange: [number, number] = [range[0] || 0, range[1] || 1000];
        setPriceRange(tupleRange);
        handleFilterChange('min_price', tupleRange[0] > 0 ? tupleRange[0] : undefined);
        handleFilterChange('max_price', tupleRange[1] < 1000 ? tupleRange[1] : undefined);
    }, [handleFilterChange]);

    const handleStockRangeChange = useCallback((range: number[]) => {
        const tupleRange: [number, number] = [range[0] || 0, range[1] || 100];
        setStockRange(tupleRange);
        handleFilterChange('min_stock', tupleRange[0] > 0 ? tupleRange[0] : undefined);
        handleFilterChange('max_stock', tupleRange[1] < 100 ? tupleRange[1] : undefined);
    }, [handleFilterChange]);

    const handleClearFilters = useCallback(() => {
        onFiltersChange(defaultFilters);
        setSearchQuery('');
        setSelectedTags([]);
        setPriceRange([0, 1000]);
        setStockRange([0, 100]);
    }, [onFiltersChange]);

    const handleApplyPreset = useCallback((preset: UniversalFilterPreset) => {
        onFiltersChange(preset.filters);
    }, [onFiltersChange]);

    const handleSaveCurrentPreset = useCallback(() => {
        if (presetName.trim() && onSavePreset) {
            onSavePreset(presetName.trim(), filters);
            setPresetName('');
            setShowSavePreset(false);
        }
    }, [presetName, filters, onSavePreset]);

    const toggleCategoryExpansion = useCallback((categoryId: string) => {
        const newExpanded = new Set(expandedCategories);
        if (newExpanded.has(categoryId)) {
            newExpanded.delete(categoryId);
        } else {
            newExpanded.add(categoryId);
        }
        setExpandedCategories(newExpanded);
    }, [expandedCategories]);

    const toggleSection = useCallback((sectionId: string) => {
        const newExpanded = new Set(expandedSections);
        if (newExpanded.has(sectionId)) {
            newExpanded.delete(sectionId);
        } else {
            newExpanded.add(sectionId);
        }
        setExpandedSections(newExpanded);
    }, [expandedSections]);

    const renderCategoryNode = useCallback((node: CategoryFilterNode) => {
        const isSelected = filters.category_id === node.id;
        const isExpanded = expandedCategories.has(node.id);
        const hasChildren = node.children.length > 0;

        return (
            <div key={node.id} className="space-y-1">
                <div
                    className={cn(
                        "flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer",
                        isSelected && "bg-primary/10"
                    )}
                    style={{ paddingLeft: `${8 + node.level * 16}px` }}
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
                        {node.itemCount !== undefined && (
                            <Badge variant="secondary" className="text-xs">
                                {node.itemCount}
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
    }, [filters.category_id, expandedCategories, handleCategoryToggle, toggleCategoryExpansion]);

    const getActiveFiltersCount = useCallback(() => {
        let count = 0;
        if (filters.search) count++;
        if (filters.category_id) count++;
        if (filters.tags && filters.tags.length > 0) count++;
        if (filters.min_price !== undefined || filters.max_price !== undefined) count++;
        if (filters.min_stock !== undefined || filters.max_stock !== undefined) count++;
        if (filters.low_stock_only) count++;
        if (filters.out_of_stock_only) count++;
        if (filters.has_images !== undefined) count++;
        if (filters.business_type) count++;
        if (!filters.is_active) count++;
        return count;
    }, [filters]);

    if (!isOpen) {
        return (
            <Button
                variant="outline"
                onClick={onToggle}
                className={cn("flex items-center gap-2", className)}
            >
                <SlidersHorizontal className="h-4 w-4" />
                {t('inventory.advanced_search')}
                {getActiveFiltersCount() > 0 && (
                    <Badge variant="secondary" className="ml-1">
                        {getActiveFiltersCount()}
                    </Badge>
                )}
            </Button>
        );
    }

    return (
        <Card className={cn("w-96", className)}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        {t('inventory.advanced_search')}
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
                        <Label className="text-sm font-medium">{t('inventory.quick_filters')}</Label>
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
                        <Collapsible
                            open={expandedSections.has('search')}
                            onOpenChange={() => toggleSection('search')}
                        >
                            <CollapsibleTrigger asChild>
                                <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                                    <Label className="text-sm font-medium cursor-pointer flex items-center gap-2">
                                        <Search className="h-4 w-4" />
                                        {t('inventory.search')}
                                    </Label>
                                    <ChevronDown className="h-4 w-4" />
                                </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="space-y-2 mt-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder={t('inventory.search_items')}
                                        value={searchQuery}
                                        onChange={(e) => handleSearchChange(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>

                                {/* Search suggestions */}
                                {suggestions && suggestions.suggestions.length > 0 && searchQuery.length >= 2 && (
                                    <div className="border rounded-md p-2 bg-muted/50">
                                        <Label className="text-xs text-muted-foreground">
                                            {t('inventory.suggestions')}
                                        </Label>
                                        <div className="space-y-1 mt-1">
                                            {suggestions.suggestions.slice(0, 5).map((suggestion) => (
                                                <Button
                                                    key={suggestion.id}
                                                    variant="ghost"
                                                    size="sm"
                                                    className="w-full justify-start text-xs h-auto p-1"
                                                    onClick={() => handleSearchChange(suggestion.name)}
                                                >
                                                    {suggestion.type === 'item' ? (
                                                        <Package className="h-3 w-3 mr-2" />
                                                    ) : (
                                                        <Tag className="h-3 w-3 mr-2" />
                                                    )}
                                                    {suggestion.name}
                                                    {suggestion.sku && (
                                                        <span className="text-muted-foreground ml-2">
                                                            ({suggestion.sku})
                                                        </span>
                                                    )}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Search by identifiers */}
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <Label className="text-xs flex items-center gap-1">
                                            <Hash className="h-3 w-3" />
                                            {t('inventory.sku')}
                                        </Label>
                                        <Input
                                            placeholder={t('inventory.search_by_sku')}
                                            value={filters.search?.startsWith('SKU:') ? filters.search.substring(4) : ''}
                                            onChange={(e) => handleSearchChange(e.target.value ? `SKU:${e.target.value}` : '')}
                                            className="text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs flex items-center gap-1">
                                            <Barcode className="h-3 w-3" />
                                            {t('inventory.barcode')}
                                        </Label>
                                        <Input
                                            placeholder={t('inventory.search_by_barcode')}
                                            value={filters.search?.startsWith('BARCODE:') ? filters.search.substring(8) : ''}
                                            onChange={(e) => handleSearchChange(e.target.value ? `BARCODE:${e.target.value}` : '')}
                                            className="text-xs"
                                        />
                                    </div>
                                </div>
                            </CollapsibleContent>
                        </Collapsible>

                        <Separator />

                        {/* Categories */}
                        <Collapsible
                            open={expandedSections.has('categories')}
                            onOpenChange={() => toggleSection('categories')}
                        >
                            <CollapsibleTrigger asChild>
                                <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                                    <Label className="text-sm font-medium cursor-pointer">
                                        {t('inventory.categories')}
                                        {filters.category_id && (
                                            <Badge variant="secondary" className="ml-2">1</Badge>
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
                                            {t('inventory.no_categories')}
                                        </p>
                                    )}
                                </div>
                            </CollapsibleContent>
                        </Collapsible>

                        <Separator />

                        {/* Tags */}
                        <Collapsible
                            open={expandedSections.has('tags')}
                            onOpenChange={() => toggleSection('tags')}
                        >
                            <CollapsibleTrigger asChild>
                                <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                                    <Label className="text-sm font-medium cursor-pointer flex items-center gap-2">
                                        <Tag className="h-4 w-4" />
                                        {t('inventory.tags')}
                                        {selectedTags.length > 0 && (
                                            <Badge variant="secondary" className="ml-2">
                                                {selectedTags.length}
                                            </Badge>
                                        )}
                                    </Label>
                                    <ChevronDown className="h-4 w-4" />
                                </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="space-y-2 mt-2">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder={t('inventory.add_tag')}
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleTagAdd(tagInput);
                                            }
                                        }}
                                        className="text-xs"
                                    />
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => handleTagAdd(tagInput)}
                                        disabled={!tagInput.trim()}
                                    >
                                        <Plus className="h-3 w-3" />
                                    </Button>
                                </div>

                                {/* Selected tags */}
                                {selectedTags.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {selectedTags.map((tag) => (
                                            <Badge
                                                key={tag}
                                                variant="secondary"
                                                className="text-xs cursor-pointer"
                                                onClick={() => handleTagRemove(tag)}
                                            >
                                                {tag}
                                                <X className="h-3 w-3 ml-1" />
                                            </Badge>
                                        ))}
                                    </div>
                                )}

                                {/* Available tags */}
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">
                                        {t('inventory.available_tags')}
                                    </Label>
                                    <div className="flex flex-wrap gap-1">
                                        {availableTags
                                            .filter(tag => !selectedTags.includes(tag))
                                            .map((tag) => (
                                                <Badge
                                                    key={tag}
                                                    variant="outline"
                                                    className="text-xs cursor-pointer hover:bg-muted"
                                                    onClick={() => handleTagAdd(tag)}
                                                >
                                                    {tag}
                                                </Badge>
                                            ))}
                                    </div>
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
                                        {t('inventory.price_range')}
                                    </Label>
                                    <ChevronDown className="h-4 w-4" />
                                </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="space-y-4 mt-2">
                                <div className="px-2">
                                    <Slider
                                        value={priceRange}
                                        onValueChange={handlePriceRangeChange}
                                        max={1000}
                                        min={0}
                                        step={10}
                                        className="w-full"
                                    />
                                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                        <span>${priceRange[0]}</span>
                                        <span>${priceRange[1]}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <Label className="text-xs">{t('inventory.min_price')}</Label>
                                        <Input
                                            type="number"
                                            placeholder="0"
                                            value={priceRange[0]}
                                            onChange={(e) => handlePriceRangeChange([parseFloat(e.target.value) || 0, priceRange[1]])}
                                            className="text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">{t('inventory.max_price')}</Label>
                                        <Input
                                            type="number"
                                            placeholder="1000"
                                            value={priceRange[1]}
                                            onChange={(e) => handlePriceRangeChange([priceRange[0], parseFloat(e.target.value) || 1000])}
                                            className="text-xs"
                                        />
                                    </div>
                                </div>
                            </CollapsibleContent>
                        </Collapsible>

                        <Separator />

                        {/* Stock Range */}
                        <Collapsible
                            open={expandedSections.has('stock')}
                            onOpenChange={() => toggleSection('stock')}
                        >
                            <CollapsibleTrigger asChild>
                                <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                                    <Label className="text-sm font-medium cursor-pointer flex items-center gap-2">
                                        <Package className="h-4 w-4" />
                                        {t('inventory.stock_filters')}
                                    </Label>
                                    <ChevronDown className="h-4 w-4" />
                                </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="space-y-4 mt-2">
                                {/* Stock status checkboxes */}
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            checked={filters.low_stock_only}
                                            onCheckedChange={(checked) => handleFilterChange('low_stock_only', checked)}
                                        />
                                        <Label className="text-xs flex items-center gap-1">
                                            <TrendingDown className="h-3 w-3" />
                                            {t('inventory.low_stock_only')}
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            checked={filters.out_of_stock_only}
                                            onCheckedChange={(checked) => handleFilterChange('out_of_stock_only', checked)}
                                        />
                                        <Label className="text-xs">
                                            {t('inventory.out_of_stock_only')}
                                        </Label>
                                    </div>
                                </div>

                                {/* Stock range slider */}
                                <div className="px-2">
                                    <Slider
                                        value={stockRange}
                                        onValueChange={handleStockRangeChange}
                                        max={100}
                                        min={0}
                                        step={1}
                                        className="w-full"
                                    />
                                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                        <span>{stockRange[0]}</span>
                                        <span>{stockRange[1]}</span>
                                    </div>
                                </div>
                            </CollapsibleContent>
                        </Collapsible>

                        <Separator />

                        {/* General Filters */}
                        <Collapsible
                            open={expandedSections.has('general')}
                            onOpenChange={() => toggleSection('general')}
                        >
                            <CollapsibleTrigger asChild>
                                <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                                    <Label className="text-sm font-medium cursor-pointer">
                                        {t('inventory.general_filters')}
                                    </Label>
                                    <ChevronDown className="h-4 w-4" />
                                </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="space-y-4 mt-2">
                                {/* Has images filter */}
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs">{t('inventory.has_images')}</Label>
                                    <Switch
                                        checked={filters.has_images === true}
                                        onCheckedChange={(checked) =>
                                            handleFilterChange('has_images', checked ? true : undefined)
                                        }
                                    />
                                </div>

                                {/* Active status filter */}
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs">{t('inventory.show_inactive')}</Label>
                                    <Switch
                                        checked={!filters.is_active}
                                        onCheckedChange={(checked) =>
                                            handleFilterChange('is_active', !checked)
                                        }
                                    />
                                </div>

                                {/* Sort options */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-medium">{t('inventory.sort_by')}</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Select
                                            value={filters.sort_by}
                                            onValueChange={(value) => handleFilterChange('sort_by', value)}
                                        >
                                            <SelectTrigger className="text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="name">{t('inventory.name')}</SelectItem>
                                                <SelectItem value="sale_price">{t('inventory.price')}</SelectItem>
                                                <SelectItem value="stock_quantity">{t('inventory.stock')}</SelectItem>
                                                <SelectItem value="created_at">{t('inventory.created')}</SelectItem>
                                                <SelectItem value="updated_at">{t('inventory.updated')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Select
                                            value={filters.sort_order}
                                            onValueChange={(value) => handleFilterChange('sort_order', value)}
                                        >
                                            <SelectTrigger className="text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="asc">{t('inventory.ascending')}</SelectItem>
                                                <SelectItem value="desc">{t('inventory.descending')}</SelectItem>
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
                                    placeholder={t('inventory.preset_name')}
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
                                    className="text-xs"
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
                                {t('inventory.save_filters')}
                            </Button>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};