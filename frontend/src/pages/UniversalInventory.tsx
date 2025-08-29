/**
 * Universal Inventory Management Page
 * Main page for the universal inventory system with unlimited nested categories,
 * advanced search, custom attributes, image management, and real-time monitoring
 */

import React, { useState, useMemo, useCallback } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { 
  Package, 
  Plus, 
  Grid3X3, 
  List, 
  Search, 
  SlidersHorizontal,
  Eye,
  Edit,
  Trash2,
  AlertTriangle,
  DollarSign,
  Weight,
  Layers,
  FolderTree,
  BarChart3,
  Download,
  Upload,
  QrCode,
  Barcode,
  Image as ImageIcon,
  TrendingUp,
  TrendingDown,
  RefreshCw
} from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { DataTable, type DataTableColumn, type DataTableAction } from '../components/ui/data-table';
import { Alert, AlertDescription } from '../components/ui/alert';
import { ScrollArea } from '../components/ui/scroll-area';
import { Separator } from '../components/ui/separator';
import { UniversalAdvancedSearch } from '../components/inventory/UniversalAdvancedSearch';
import { UniversalInventoryItemForm } from '../components/inventory/UniversalInventoryItemForm';
import { UniversalCategoryTreeView } from '../components/inventory/UniversalCategoryTreeView';
import { 
  useUniversalInventoryItems,
  useUniversalCategoriesTree,
  useDeleteUniversalInventoryItem,
  useLowStockAlerts,
  useInventorySummary,
  useInventoryActions,
  useCategoryActions
} from '../hooks/useUniversalInventory';
import { cn } from '../lib/utils';
import type { 
  UniversalInventorySearchFilters,
  UniversalInventoryItem,
  UniversalCategory,
  UniversalInventoryItemWithCategory
} from '../types/universalInventory';

type ViewMode = 'grid' | 'list';

const defaultFilters: UniversalInventorySearchFilters = {
  search: '',
  category_id: undefined,
  tags: [],
  min_stock: undefined,
  max_stock: undefined,
  low_stock_only: false,
  out_of_stock_only: false,
  min_price: undefined,
  max_price: undefined,
  has_images: undefined,
  is_active: true,
  sort_by: 'name',
  sort_order: 'asc',
};

export const UniversalInventory: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  // State management
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filters, setFilters] = useState<UniversalInventorySearchFilters>(defaultFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<UniversalInventoryItemWithCategory | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [activeTab, setActiveTab] = useState('inventory');

  // Data fetching
  const { 
    data: inventoryData, 
    isLoading: isLoadingItems, 
    error: itemsError,
    refetch: refetchItems
  } = useUniversalInventoryItems(filters, page, pageSize);

  const { 
    data: categories = [], 
    isLoading: isLoadingCategories 
  } = useUniversalCategoriesTree();

  const { 
    data: lowStockAlerts = [], 
    isLoading: isLoadingAlerts 
  } = useLowStockAlerts();

  const { 
    data: inventorySummary,
    isLoading: isLoadingSummary 
  } = useInventorySummary();

  // Actions
  const { deleteItem } = useInventoryActions();
  const { createCategory, updateCategory, deleteCategory } = useCategoryActions();

  // Memoized category map for quick lookups
  const categoryMap = useMemo(() => {
    const flattenCategories = (cats: UniversalCategory[]): UniversalCategory[] => {
      return cats.reduce((acc, cat) => {
        acc.push(cat);
        if ('children' in cat && cat.children) {
          acc.push(...flattenCategories(cat.children as UniversalCategory[]));
        }
        return acc;
      }, [] as UniversalCategory[]);
    };

    const flatCategories = flattenCategories(categories);
    return flatCategories.reduce((acc, category) => {
      acc[category.id] = category;
      return acc;
    }, {} as Record<string, UniversalCategory>);
  }, [categories]);

  // Get stock status helper
  const getStockStatus = useCallback((item: UniversalInventoryItemWithCategory) => {
    if (item.stock_quantity <= 0) {
      return { 
        status: 'out-of-stock', 
        label: t('inventory.out_of_stock'), 
        variant: 'destructive' as const, 
        color: 'text-red-600',
        icon: <AlertTriangle className="h-4 w-4" />
      };
    } else if (item.stock_quantity <= item.low_stock_threshold) {
      return { 
        status: 'low-stock', 
        label: t('inventory.low_stock'), 
        variant: 'secondary' as const, 
        color: 'text-yellow-600',
        icon: <TrendingDown className="h-4 w-4" />
      };
    }
    return { 
      status: 'in-stock', 
      label: t('inventory.in_stock'), 
      variant: 'default' as const, 
      color: 'text-green-600',
      icon: <TrendingUp className="h-4 w-4" />
    };
  }, [t]);

  // Table columns configuration
  const columns: DataTableColumn<UniversalInventoryItemWithCategory>[] = [
    {
      id: 'item',
      header: t('inventory.item'),
      accessorKey: 'name',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          {row.primary_image_id ? (
            <img
              src={`/api/images/${row.primary_image_id}`}
              alt={row.name}
              className="w-12 h-12 rounded-lg object-cover border"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-muted to-muted-foreground/20 flex items-center justify-center border">
              <Package className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-foreground truncate">{row.name}</div>
            {row.name_persian && (
              <div className="text-sm text-muted-foreground truncate">
                {row.name_persian}
              </div>
            )}
            {row.description && (
              <div className="text-xs text-muted-foreground truncate max-w-48 mt-1">
                {row.description}
              </div>
            )}
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {row.sku}
              </Badge>
              {row.tags.length > 0 && (
                <div className="flex gap-1">
                  {row.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {row.tags.length > 2 && (
                    <Badge variant="secondary" className="text-xs">
                      +{row.tags.length - 2}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ),
      sortable: true,
      filterable: true,
      filterType: 'text',
    },
    {
      id: 'category',
      header: t('inventory.category'),
      accessorKey: 'category_id',
      cell: ({ row }) => {
        const category = row.category || categoryMap[row.category_id || ''];
        return (
          <div className="space-y-1">
            <Badge variant="outline" className="font-medium">
              {category?.name || t('inventory.uncategorized')}
            </Badge>
            {category?.name_persian && (
              <div className="text-xs text-muted-foreground">
                {category.name_persian}
              </div>
            )}
          </div>
        );
      },
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: Object.values(categoryMap).map(cat => ({ 
        label: cat.name, 
        value: cat.id 
      })),
    },
    {
      id: 'pricing',
      header: t('inventory.pricing'),
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-sm">
            <span className="text-muted-foreground">{t('inventory.cost')}:</span>
            <span className="font-mono">${row.cost_price.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-1 font-semibold text-primary">
            <DollarSign className="h-3 w-3" />
            <span className="font-mono">${row.sale_price.toFixed(2)}</span>
          </div>
          {row.weight_grams && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Weight className="h-3 w-3" />
              {row.weight_grams}g
            </div>
          )}
        </div>
      ),
      sortable: true,
      align: 'right',
    },
    {
      id: 'stock',
      header: t('inventory.stock'),
      accessorKey: 'stock_quantity',
      cell: ({ row }) => {
        const stockStatus = getStockStatus(row);
        return (
          <div className="flex items-center gap-2">
            <div className="text-center">
              <div className="font-mono font-semibold text-lg">
                {row.stock_quantity}
              </div>
              <div className="text-xs text-muted-foreground">
                {row.unit_of_measure}
              </div>
            </div>
            <div className="flex flex-col items-center">
              {stockStatus.icon}
              <Badge variant={stockStatus.variant} className="text-xs mt-1">
                {stockStatus.label}
              </Badge>
            </div>
          </div>
        );
      },
      sortable: true,
      filterable: true,
      filterType: 'number',
      align: 'center',
    },
    {
      id: 'actions',
      header: t('inventory.actions'),
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleViewItem(row)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleEditItem(row)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-600 hover:text-red-700"
            onClick={() => handleDeleteItem(row)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  // Event handlers
  const handleViewItem = useCallback((item: UniversalInventoryItemWithCategory) => {
    // Navigate to item detail view or open modal
    console.log('View item:', item);
  }, []);

  const handleEditItem = useCallback((item: UniversalInventoryItemWithCategory) => {
    setEditingItem(item);
    setShowItemForm(true);
  }, []);

  const handleDeleteItem = useCallback(async (item: UniversalInventoryItemWithCategory) => {
    if (window.confirm(t('inventory.delete_confirm', { name: item.name }))) {
      try {
        await deleteItem.mutateAsync({ id: item.id });
      } catch (error) {
        console.error('Failed to delete item:', error);
      }
    }
  }, [deleteItem, t]);

  const handleCreateItem = useCallback(() => {
    setEditingItem(null);
    setShowItemForm(true);
  }, []);

  const handleFormClose = useCallback(() => {
    setShowItemForm(false);
    setEditingItem(null);
  }, []);

  const handleCategorySelect = useCallback((category: UniversalCategory) => {
    setSelectedCategory(category.id);
    setFilters(prev => ({ ...prev, category_id: category.id }));
  }, []);

  const handleToggleExpanded = useCallback((categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  }, []);

  const handleRefresh = useCallback(() => {
    refetchItems();
  }, [refetchItems]);

  // Grid view component
  const GridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <AnimatePresence>
        {inventoryData?.items.map((item, index) => {
          const stockStatus = getStockStatus(item);
          const category = item.category || categoryMap[item.category_id || ''];
          
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
            >
              <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-primary/20">
                <CardHeader className="pb-3">
                  <div className="aspect-square relative overflow-hidden rounded-lg bg-gradient-to-br from-muted to-muted-foreground/20">
                    {item.primary_image_id ? (
                      <img
                        src={`/api/images/${item.primary_image_id}`}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <Badge variant={stockStatus.variant} className="text-xs">
                        {stockStatus.label}
                      </Badge>
                    </div>
                    {item.tags.length > 0 && (
                      <div className="absolute bottom-2 left-2">
                        <Badge variant="secondary" className="text-xs">
                          {item.tags[0]}
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-lg truncate">{item.name}</h3>
                    {item.name_persian && (
                      <p className="text-sm text-muted-foreground truncate">
                        {item.name_persian}
                      </p>
                    )}
                    {item.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {item.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <Badge variant="outline">
                      {category?.name || t('inventory.uncategorized')}
                    </Badge>
                    <Badge variant="secondary" className="font-mono">
                      {item.sku}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">{t('inventory.cost')}</div>
                      <div className="font-mono font-semibold">${item.cost_price.toFixed(2)}</div>
                    </div>
                    <div className="space-y-1 text-right">
                      <div className="text-sm text-muted-foreground">{t('inventory.sale')}</div>
                      <div className="font-mono font-bold text-primary">${item.sale_price.toFixed(2)}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{t('inventory.stock')}</span>
                      <span className="font-mono font-semibold">{item.stock_quantity}</span>
                      <span className="text-xs text-muted-foreground">{item.unit_of_measure}</span>
                      {stockStatus.status !== 'in-stock' && stockStatus.icon}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-primary/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditItem(item);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={async (e) => {
                          e.stopPropagation();
                          await handleDeleteItem(item);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );

  // Loading state
  if (isLoadingItems && page === 1) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <div className="relative mx-auto mb-4 w-8 h-8">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-transparent bg-gradient-to-r from-primary to-primary/60 bg-clip-border"></div>
                <div className="absolute inset-0 animate-spin rounded-full h-8 w-8 border-2 border-transparent border-t-primary"></div>
              </div>
              <p className="text-muted-foreground">{t('inventory.loading')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (itemsError) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {t('inventory.failed_to_load')}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
            <Package className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              {t('inventory.universal_management')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('inventory.universal_description')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoadingItems}
            className="flex items-center gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", isLoadingItems && "animate-spin")} />
            {t('common.refresh')}
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {t('inventory.filters')}
            {Object.values(filters).some(v => 
              Array.isArray(v) ? v.length > 0 : v !== undefined && v !== '' && v !== true
            ) && (
              <Badge variant="secondary" className="ml-1">
                {t('inventory.active')}
              </Badge>
            )}
          </Button>
          <Button 
            onClick={handleCreateItem} 
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {t('inventory.add_item')}
          </Button>
        </div>
      </motion.div>

      {/* Summary Cards */}
      {inventorySummary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <Package className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('inventory.total_items')}</p>
                  <p className="text-2xl font-bold">{inventorySummary.total_items}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('inventory.total_value')}</p>
                  <p className="text-2xl font-bold">${inventorySummary.total_value.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center">
                  <TrendingDown className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('inventory.low_stock')}</p>
                  <p className="text-2xl font-bold">{inventorySummary.low_stock_items}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                  <Layers className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('inventory.categories')}</p>
                  <p className="text-2xl font-bold">{inventorySummary.categories_count}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            {t('inventory.items')}
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <FolderTree className="h-4 w-4" />
            {t('inventory.categories')}
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {t('inventory.alerts')}
            {lowStockAlerts.length > 0 && (
              <Badge variant="destructive" className="ml-1">
                {lowStockAlerts.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="inventory" className="space-y-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Advanced Filter Panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, x: -300 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -300 }}
                  transition={{ duration: 0.3 }}
                >
                  <UniversalAdvancedSearch
                    categories={Object.values(categoryMap)}
                    filters={filters}
                    onFiltersChange={setFilters}
                    isOpen={showFilters}
                    onToggle={() => setShowFilters(!showFilters)}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Content */}
            <div className="flex-1 space-y-6">
              {/* Search and View Controls */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                      <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder={t('inventory.search_placeholder')}
                          value={filters.search || ''}
                          onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                          className="pl-10"
                        />
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="flex items-center bg-muted rounded-lg p-1">
                          <Button
                            variant={viewMode === 'list' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('list')}
                            className="h-8 w-8 p-0"
                          >
                            <List className="h-4 w-4" />
                          </Button>
                          <Button
                            variant={viewMode === 'grid' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('grid')}
                            className="h-8 w-8 p-0"
                          >
                            <Grid3X3 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {inventoryData && (
                          <Badge variant="secondary" className="font-mono">
                            {t('inventory.total_items_count', { count: inventoryData.total })}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Content */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {!inventoryData?.items.length ? (
                  <Card>
                    <CardContent className="p-8">
                      <div className="text-center space-y-4">
                        <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg mx-auto">
                          <Package className="h-8 w-8 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">{t('inventory.no_items_found')}</h3>
                          <p className="text-muted-foreground">
                            {t('inventory.add_first_message')}
                          </p>
                        </div>
                        <Button onClick={handleCreateItem} className="mt-4">
                          <Plus className="h-4 w-4 mr-2" />
                          {t('inventory.add_first_item')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : viewMode === 'grid' ? (
                  <GridView />
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                          <Package className="h-4 w-4 text-white" />
                        </div>
                        {t('inventory.items')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <DataTable
                        data={inventoryData.items}
                        columns={columns}
                        getRowId={(row) => row.id}
                        selection={{
                          selectedRows: selectedItems,
                          onSelectionChange: setSelectedItems,
                        }}
                        pagination={{
                          pageIndex: page - 1,
                          pageSize,
                          pageCount: inventoryData.total_pages,
                          onPageChange: (pageIndex) => setPage(pageIndex + 1),
                          onPageSizeChange: setPageSize,
                        }}
                        striped
                        className="border-0"
                      />
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                  <FolderTree className="h-4 w-4 text-white" />
                </div>
                {t('inventory.category_management')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <UniversalCategoryTreeView
                categories={categories}
                selectedCategory={selectedCategory}
                expandedCategories={expandedCategories}
                onCategorySelect={handleCategorySelect}
                onToggleExpanded={handleToggleExpanded}
                showStats={true}
                showImages={true}
                dragEnabled={true}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="alerts" className="space-y-6">
          {/* Low Stock Alerts */}
          {lowStockAlerts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-yellow-600">
                  <TrendingDown className="h-5 w-5" />
                  {t('inventory.low_stock_alerts')}
                  <Badge variant="secondary">{lowStockAlerts.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {lowStockAlerts.map((alert) => (
                    <Alert key={alert.item_id} className="border-yellow-200">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="flex items-center justify-between">
                        <div>
                          <span className="font-semibold">{alert.item_name}</span>
                          <span className="text-muted-foreground ml-2">({alert.item_sku})</span>
                          <div className="text-sm text-muted-foreground mt-1">
                            {t('inventory.current_stock')}: {alert.current_stock} {alert.unit_of_measure} | 
                            {t('inventory.threshold')}: {alert.low_stock_threshold} {alert.unit_of_measure}
                          </div>
                        </div>
                        <Badge variant={
                          alert.urgency_level === 'critical' ? 'destructive' :
                          alert.urgency_level === 'high' ? 'secondary' : 'outline'
                        }>
                          {alert.urgency_level}
                        </Badge>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {lowStockAlerts.length === 0 && (
            <Card>
              <CardContent className="p-8">
                <div className="text-center space-y-4">
                  <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg mx-auto">
                    <TrendingUp className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-green-600">
                      {t('inventory.no_alerts')}
                    </h3>
                    <p className="text-muted-foreground">
                      {t('inventory.all_items_stocked')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Item Form Dialog */}
      <AnimatePresence>
        {showItemForm && (
          <UniversalInventoryItemForm
            item={editingItem || undefined}
            categories={Object.values(categoryMap)}
            onSubmit={async (data) => {
              // Handle form submission
              console.log('Form submitted:', data);
              handleFormClose();
            }}
            onClose={handleFormClose}
            isLoading={false}
          />
        )}
      </AnimatePresence>
    </div>
  );
};