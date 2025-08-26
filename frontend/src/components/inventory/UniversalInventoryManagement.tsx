import React, { useState, useEffect, useMemo } from 'react';
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
  TrendingUp,
  TrendingDown,
  DollarSign,
  Weight,
  Layers,
  MoreHorizontal,
  Download,
  Upload,
  RefreshCw,
  Settings,
  BarChart3,
  Activity,
  Scan,
  QrCode,
  Hash,
  Tag,
  Calendar,
  Filter,
  X,
  CheckCircle,
  XCircle,
  Clock,
  Archive,
  Star,
  Copy,
  Move,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { DataTable, type DataTableColumn, type DataTableAction } from '../ui/data-table';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Alert, AlertDescription } from '../ui/alert';
import { Progress } from '../ui/progress';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { useLanguage } from '../../hooks/useLanguage';
import { cn } from '../../lib/utils';

// Import Universal Inventory Components
import { UniversalInventorySearch } from './UniversalInventorySearch';
import { UniversalCategoryHierarchy } from './UniversalCategoryHierarchy';
import { UniversalInventoryItemForm } from './UniversalInventoryItemForm';

// Import Universal Inventory API and Types
import { 
  universalInventoryApi,
  universalCategoriesApi,
  stockAlertsApi,
  inventoryAnalyticsApi,
  inventoryMovementsApi,
  barcodeApi
} from '../../services/universalInventoryApi';
import type {
  UniversalInventoryItem,
  UniversalInventoryItemWithCategory,
  CategoryWithStats,
  InventorySearchFilters,
  InventorySearchRequest,
  InventorySearchResponse,
  LowStockAlert,
  InventoryAnalytics,
  InventoryMovementWithDetails,
  StockAlertLevel
} from '../../types/universalInventory';

type ViewMode = 'grid' | 'list' | 'kanban';
type ActiveTab = 'inventory' | 'categories' | 'analytics' | 'movements' | 'alerts';

interface UniversalInventoryManagementProps {
  businessType?: string;
  className?: string;
}

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

export const UniversalInventoryManagement: React.FC<UniversalInventoryManagementProps> = ({
  businessType,
  className
}) => {
  const { t } = useLanguage();
  
  // State Management
  const [activeTab, setActiveTab] = useState<ActiveTab>('inventory');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filters, setFilters] = useState<InventorySearchFilters>(defaultFilters);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<UniversalInventoryItem | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  // Data State
  const [inventoryData, setInventoryData] = useState<InventorySearchResponse | null>(null);
  const [categories, setCategories] = useState<CategoryWithStats[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<LowStockAlert[]>([]);
  const [analytics, setAnalytics] = useState<InventoryAnalytics | null>(null);
  const [recentMovements, setRecentMovements] = useState<InventoryMovementWithDetails[]>([]);
  
  // Loading States
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(false);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  // Load initial data
  useEffect(() => {
    loadCategories();
    loadAnalytics();
    loadLowStockAlerts();
    loadRecentMovements();
    handleSearch({ filters: defaultFilters, sort_by: 'name', sort_order: 'asc', limit: 50, offset: 0 });
  }, [businessType]);

  const loadCategories = async () => {
    setIsLoadingCategories(true);
    try {
      const data = await universalCategoriesApi.getCategoryTree(businessType, true);
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const loadAnalytics = async () => {
    setIsLoadingAnalytics(true);
    try {
      const data = await inventoryAnalyticsApi.getOverallAnalytics(businessType);
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  const loadLowStockAlerts = async () => {
    setIsLoadingAlerts(true);
    try {
      const response = await stockAlertsApi.getLowStockAlerts(1.0, undefined, businessType);
      setLowStockAlerts(response.alerts);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setIsLoadingAlerts(false);
    }
  };

  const loadRecentMovements = async () => {
    try {
      const response = await inventoryMovementsApi.getMovements(
        undefined, // item_id
        undefined, // movement_types
        undefined, // date_from
        undefined, // date_to
        10, // limit
        0 // offset
      );
      setRecentMovements(response.movements);
    } catch (error) {
      console.error('Failed to load recent movements:', error);
    }
  };

  const handleSearch = async (request: InventorySearchRequest) => {
    setIsLoading(true);
    try {
      const data = await universalInventoryApi.searchItems(request);
      setInventoryData(data);
    } catch (error) {
      console.error('Failed to search inventory:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleItemCreate = async (data: any) => {
    try {
      await universalInventoryApi.createItem(data);
      // Refresh data
      handleSearch({ filters, sort_by: filters.sort_by || 'name', sort_order: filters.sort_order || 'asc', limit: 50, offset: 0 });
      loadAnalytics();
      loadLowStockAlerts();
    } catch (error) {
      console.error('Failed to create item:', error);
      throw error;
    }
  };

  const handleItemUpdate = async (id: string, data: any) => {
    try {
      await universalInventoryApi.updateItem(id, data);
      // Refresh data
      handleSearch({ filters, sort_by: filters.sort_by || 'name', sort_order: filters.sort_order || 'asc', limit: 50, offset: 0 });
      loadAnalytics();
      loadLowStockAlerts();
    } catch (error) {
      console.error('Failed to update item:', error);
      throw error;
    }
  };

  const handleItemDelete = async (id: string) => {
    try {
      await universalInventoryApi.deleteItem(id);
      // Refresh data
      handleSearch({ filters, sort_by: filters.sort_by || 'name', sort_order: filters.sort_order || 'asc', limit: 50, offset: 0 });
      loadAnalytics();
      loadLowStockAlerts();
    } catch (error) {
      console.error('Failed to delete item:', error);
      throw error;
    }
  };

  // Get stock status
  const getStockStatus = (item: UniversalInventoryItem) => {
    if (item.stock_quantity <= 0) {
      return { 
        status: 'out-of-stock', 
        label: 'Out of Stock', 
        variant: 'destructive' as const, 
        color: 'text-red-600',
        icon: XCircle
      };
    } else if (item.stock_quantity <= item.min_stock_level) {
      return { 
        status: 'low-stock', 
        label: 'Low Stock', 
        variant: 'secondary' as const, 
        color: 'text-yellow-600',
        icon: AlertTriangle
      };
    }
    return { 
      status: 'in-stock', 
      label: 'In Stock', 
      variant: 'default' as const, 
      color: 'text-green-600',
      icon: CheckCircle
    };
  };

  // Table columns for inventory items
  const inventoryColumns: DataTableColumn<UniversalInventoryItemWithCategory>[] = [
    {
      id: 'item',
      header: 'Item',
      accessorKey: 'name',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          {row.image_url ? (
            <img
              src={row.image_url}
              alt={row.name}
              className="w-12 h-12 rounded-lg object-cover border shadow-sm"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center border shadow-sm">
              <Package className="h-6 w-6 text-white" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-foreground truncate">{row.name}</div>
            {row.description && (
              <div className="text-sm text-muted-foreground truncate max-w-48">
                {row.description}
              </div>
            )}
            <div className="flex items-center gap-2 mt-1">
              {row.sku && (
                <Badge variant="outline" className="text-xs">
                  <Hash className="h-3 w-3 mr-1" />
                  {row.sku}
                </Badge>
              )}
              {row.barcode && (
                <Badge variant="outline" className="text-xs">
                  <Scan className="h-3 w-3 mr-1" />
                  {row.barcode}
                </Badge>
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
      header: 'Category',
      accessorKey: 'category_id',
      cell: ({ row }) => {
        const category = row.category;
        return category ? (
          <Badge variant="outline" className="font-medium">
            {category.name}
          </Badge>
        ) : (
          <Badge variant="secondary" className="font-medium">
            Uncategorized
          </Badge>
        );
      },
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: categories.map(cat => ({ label: cat.name, value: cat.id })),
    },
    {
      id: 'pricing',
      header: 'Pricing',
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-sm">
            <span className="text-muted-foreground">Cost:</span>
            <span className="font-mono">${row.cost_price?.toFixed(2) || '0.00'}</span>
          </div>
          <div className="flex items-center gap-1 text-sm font-semibold">
            <span className="text-muted-foreground">Sale:</span>
            <span className="font-mono text-primary">${row.sale_price?.toFixed(2) || '0.00'}</span>
          </div>
        </div>
      ),
      sortable: true,
      align: 'right',
    },
    {
      id: 'stock',
      header: 'Stock',
      accessorKey: 'stock_quantity',
      cell: ({ row }) => {
        const stockStatus = getStockStatus(row);
        const StatusIcon = stockStatus.icon;
        return (
          <div className="flex items-center gap-2">
            <span className="font-mono font-semibold">{row.stock_quantity}</span>
            <StatusIcon className={cn("h-4 w-4", stockStatus.color)} />
            <div className="text-xs text-muted-foreground">
              Min: {row.min_stock_level}
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
      id: 'status',
      header: 'Status',
      accessorFn: (row) => getStockStatus(row).status,
      cell: ({ row }) => {
        const stockStatus = getStockStatus(row);
        return (
          <Badge variant={stockStatus.variant} className="font-medium">
            {stockStatus.label}
          </Badge>
        );
      },
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: [
        { label: 'In Stock', value: 'in-stock' },
        { label: 'Low Stock', value: 'low-stock' },
        { label: 'Out of Stock', value: 'out-of-stock' },
      ],
    },
    {
      id: 'tags',
      header: 'Tags',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1 max-w-32">
          {row.tags?.slice(0, 2).map((tag, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {row.tags && row.tags.length > 2 && (
            <Badge variant="secondary" className="text-xs">
              +{row.tags.length - 2}
            </Badge>
          )}
        </div>
      ),
    },
  ];

  // Table actions
  const inventoryActions: DataTableAction<UniversalInventoryItemWithCategory>[] = [
    {
      id: 'view',
      label: 'View Details',
      icon: <Eye className="h-4 w-4" />,
      onClick: (item) => {
        // Handle view action - could open a detailed view modal
        console.log('View item:', item);
      },
    },
    {
      id: 'edit',
      label: 'Edit',
      icon: <Edit className="h-4 w-4" />,
      onClick: (item) => {
        setEditingItem(item);
        setShowForm(true);
      },
    },
    {
      id: 'duplicate',
      label: 'Duplicate',
      icon: <Copy className="h-4 w-4" />,
      onClick: async (item) => {
        const duplicateData = {
          ...item,
          name: `${item.name} (Copy)`,
          sku: undefined, // Let system generate new SKU
          barcode: undefined, // Let system generate new barcode
        };
        const { id, created_at, updated_at, ...cleanData } = duplicateData;
        const duplicatePayload = cleanData;
        
        try {
          await handleItemCreate(duplicatePayload);
        } catch (error) {
          console.error('Failed to duplicate item:', error);
        }
      },
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      variant: 'destructive',
      onClick: async (item) => {
        if (window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
          try {
            await handleItemDelete(item.id);
          } catch (error) {
            console.error('Failed to delete item:', error);
          }
        }
      },
    },
  ];

  // Grid view component
  const GridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <AnimatePresence>
        {inventoryData?.items.map((item, index) => {
          const stockStatus = getStockStatus(item);
          const StatusIcon = stockStatus.icon;
          
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
            >
              <Card variant="gradient-green" className="group cursor-pointer hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-green-300/50">
                <CardHeader className="pb-3">
                  <div className="aspect-square relative overflow-hidden rounded-lg bg-muted">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600">
                        <Package className="h-12 w-12 text-white" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <Badge variant={stockStatus.variant} className="text-xs shadow-lg">
                        {stockStatus.label}
                      </Badge>
                    </div>
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {item.sku && (
                        <Badge variant="outline" className="text-xs bg-white/90">
                          <Hash className="h-3 w-3 mr-1" />
                          {item.sku}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-lg truncate">{item.name}</h3>
                    {item.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <Badge variant="outline">
                      {item.category?.name || 'Uncategorized'}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <StatusIcon className={cn("h-4 w-4", stockStatus.color)} />
                      <span className="font-mono">{item.stock_quantity}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">Cost</div>
                      <div className="font-mono font-semibold">${item.cost_price?.toFixed(2) || '0.00'}</div>
                    </div>
                    <div className="space-y-1 text-right">
                      <div className="text-sm text-muted-foreground">Sale</div>
                      <div className="font-mono font-bold text-primary">${item.sale_price?.toFixed(2) || '0.00'}</div>
                    </div>
                  </div>

                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {item.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {item.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{item.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="text-xs text-muted-foreground">
                      Min: {item.min_stock_level}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-green-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingItem(item);
                          setShowForm(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-green-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => console.log('View item:', item)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => console.log('Duplicate item:', item)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleItemDelete(item.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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

  // Analytics Dashboard Component
  const AnalyticsDashboard = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card variant="gradient-blue">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Items</p>
                <p className="text-3xl font-bold">{analytics?.total_items || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <Package className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="gradient-green">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                <p className="text-3xl font-bold">${analytics?.total_inventory_value?.toFixed(0) || '0'}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="gradient-yellow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Low Stock</p>
                <p className="text-3xl font-bold">{analytics?.low_stock_items || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center shadow-lg">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="gradient-red">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Out of Stock</p>
                <p className="text-3xl font-bold">{analytics?.out_of_stock_items || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                <XCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and detailed analytics would go here */}
      <Card variant="professional">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            Inventory Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            Advanced analytics charts and insights will be displayed here
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Stock Alerts Component
  const StockAlertsPanel = () => (
    <div className="space-y-6">
      <Card variant="gradient-red">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
              <AlertTriangle className="h-4 w-4 text-white" />
            </div>
            Stock Alerts
            <Badge variant="secondary">{lowStockAlerts.length} alerts</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lowStockAlerts.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <p className="text-lg font-semibold">All items are well stocked!</p>
              <p className="text-muted-foreground">No low stock alerts at this time.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {lowStockAlerts.map((alert) => (
                <Alert key={alert.item_id} className="border-l-4 border-l-red-500">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{alert.item_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Current stock: {alert.current_stock} | Minimum: {alert.min_stock_level}
                        </p>
                      </div>
                      <Badge variant="destructive">{alert.alert_level}</Badge>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className={cn("container mx-auto p-6 space-y-6", className)}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center shadow-lg">
            <Package className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
              Universal Inventory Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Comprehensive inventory management with advanced features
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline-gradient-blue"
            onClick={() => setShowSearch(!showSearch)}
            className="flex items-center gap-2"
          >
            <Search className="h-4 w-4" />
            Advanced Search
          </Button>
          <Button 
            variant="gradient-green" 
            onClick={() => setShowForm(true)} 
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
        </div>
      </motion.div>

      {/* Advanced Search Panel */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <UniversalInventorySearch
              categories={categories}
              filters={filters}
              onFiltersChange={setFilters}
              onSearch={handleSearch}
              isLoading={isLoading}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ActiveTab)} className="w-full">
        <TabsList variant="gradient-green" className="grid w-full grid-cols-5">
          <TabsTrigger variant="gradient-green" value="inventory" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Inventory
            {inventoryData && (
              <Badge variant="secondary" className="ml-1">
                {inventoryData.total_count}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger variant="gradient-green" value="categories" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Categories
            <Badge variant="secondary" className="ml-1">
              {categories.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger variant="gradient-green" value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger variant="gradient-green" value="movements" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Movements
          </TabsTrigger>
          <TabsTrigger variant="gradient-green" value="alerts" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Alerts
            {lowStockAlerts.length > 0 && (
              <Badge variant="destructive" className="ml-1">
                {lowStockAlerts.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Inventory Tab */}
        <TabsContent variant="gradient-green" value="inventory" className="space-y-6">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 space-y-6">
              {/* View Controls */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card variant="filter">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                      <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Quick search..."
                          value={filters.query || ''}
                          onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
                          className="pl-10 border-0 bg-white/80 shadow-sm focus:shadow-md transition-all duration-300"
                        />
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="flex items-center bg-white/80 rounded-lg p-1 shadow-sm">
                          <Button
                            variant={viewMode === 'list' ? 'gradient-green' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('list')}
                            className="h-8 w-8 p-0"
                          >
                            <List className="h-4 w-4" />
                          </Button>
                          <Button
                            variant={viewMode === 'grid' ? 'gradient-green' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('grid')}
                            className="h-8 w-8 p-0"
                          >
                            <Grid3X3 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {inventoryData && (
                          <Badge variant="secondary" className="font-mono bg-white/80 shadow-sm">
                            {inventoryData.total_count} items
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
                {isLoading ? (
                  <Card variant="professional">
                    <CardContent className="p-8">
                      <div className="text-center">
                        <div className="relative mx-auto mb-4">
                          <div className="animate-spin rounded-full h-8 w-8 border-2 border-transparent bg-gradient-to-r from-green-500 to-teal-600 bg-clip-border"></div>
                          <div className="absolute inset-0 animate-spin rounded-full h-8 w-8 border-2 border-transparent border-t-green-500"></div>
                        </div>
                        <p className="text-muted-foreground">Loading inventory...</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : !inventoryData?.items.length ? (
                  <Card variant="professional">
                    <CardContent className="p-8">
                      <div className="text-center space-y-4">
                        <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center shadow-lg mx-auto">
                          <Package className="h-8 w-8 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">No items found</h3>
                          <p className="text-muted-foreground">
                            {filters.query ? 'Try adjusting your search criteria' : 'Add your first inventory item to get started'}
                          </p>
                        </div>
                        <Button variant="gradient-green" onClick={() => setShowForm(true)} className="mt-4">
                          <Plus className="h-4 w-4 mr-2" />
                          Add First Item
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : viewMode === 'grid' ? (
                  <GridView />
                ) : (
                  <Card variant="professional">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center shadow-lg">
                          <Package className="h-4 w-4 text-white" />
                        </div>
                        Inventory Items
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <DataTable
                        data={inventoryData.items}
                        columns={inventoryColumns}
                        actions={inventoryActions}
                        getRowId={(row) => row.id}
                        selection={{
                          selectedRows: selectedItems,
                          onSelectionChange: setSelectedItems,
                        }}
                        onRowClick={(item) => console.log('Selected item:', item)}
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

        {/* Categories Tab */}
        <TabsContent variant="gradient-green" value="categories" className="space-y-6">
          <UniversalCategoryHierarchy
            categories={categories}
            expandedCategories={expandedCategories}
            onToggleExpanded={(categoryId) => {
              const newExpanded = new Set(expandedCategories);
              if (newExpanded.has(categoryId)) {
                newExpanded.delete(categoryId);
              } else {
                newExpanded.add(categoryId);
              }
              setExpandedCategories(newExpanded);
            }}
            onCategorySelect={(category) => console.log('Selected category:', category)}
            onCategoryEdit={(category) => console.log('Edit category:', category)}
            onCategoryDelete={(category) => console.log('Delete category:', category)}
            onCategoryAdd={(parentId) => console.log('Add category with parent:', parentId)}
            showStats={true}
            showActions={true}
          />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent variant="gradient-green" value="analytics" className="space-y-6">
          <AnalyticsDashboard />
        </TabsContent>

        {/* Movements Tab */}
        <TabsContent variant="gradient-green" value="movements" className="space-y-6">
          <Card variant="professional">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <Activity className="h-4 w-4 text-white" />
                </div>
                Recent Inventory Movements
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentMovements.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No recent inventory movements
                </div>
              ) : (
                <div className="space-y-4">
                  {recentMovements.map((movement) => (
                    <div key={movement.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                          <Activity className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold">{movement.inventory_item?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {movement.movement_type} • {movement.quantity} units
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          {new Date(movement.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent variant="gradient-green" value="alerts" className="space-y-6">
          <StockAlertsPanel />
        </TabsContent>
      </Tabs>

      {/* Item Form Dialog */}
      <AnimatePresence>
        {showForm && (
          <UniversalInventoryItemForm
            item={editingItem}
            categories={categories}
            onClose={() => {
              setShowForm(false);
              setEditingItem(null);
            }}
            onSubmit={async (data) => {
              if (editingItem) {
                await handleItemUpdate(editingItem.id, data);
              } else {
                await handleItemCreate(data);
              }
            }}
            isLoading={isLoading}
          />
        )}
      </AnimatePresence>
    </div>
  );
};