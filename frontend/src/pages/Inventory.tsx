import React, { useState, useMemo } from 'react';
import { Routes, Route } from 'react-router-dom';
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
  FolderTree
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { DataTable, type DataTableColumn, type DataTableAction } from '../components/ui/data-table';
import { AdvancedFilterPanel } from '../components/inventory/AdvancedFilterPanel';
import { InventoryItemForm } from '../components/inventory/InventoryItemForm';
import { CategoryManager } from '../components/inventory/CategoryManager';
import { InventoryList } from '../components/inventory/InventoryList';
import { BulkInventoryOperations } from '../components/inventory/BulkInventoryOperations';
import { useInventoryItems, useCategories, useDeleteInventoryItem } from '../hooks/useInventory';
import { cn } from '../lib/utils';
import type { InventoryItem, Category } from '../types';

type ViewMode = 'grid' | 'list';

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

export const Inventory: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filters, setFilters] = useState<InventoryFilters>(defaultFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Fetch data
  const { data: inventoryData, isLoading, error } = useInventoryItems({
    search: filters.search || undefined,
    category_id: filters.categories.length > 0 ? filters.categories[0] : undefined,
    low_stock: filters.stockStatus.includes('low_stock') || undefined,
    page,
    limit: pageSize,
  });

  const { data: categories = [] } = useCategories();
  const deleteItemMutation = useDeleteInventoryItem();

  // Memoized category map
  const categoryMap = useMemo(() => {
    return categories.reduce((acc, category) => {
      acc[category.id] = category;
      return acc;
    }, {} as Record<string, Category>);
  }, [categories]);

  // Get stock status
  const getStockStatus = (item: InventoryItem) => {
    if (item.stock_quantity <= 0) {
      return { status: 'out-of-stock', label: 'Out of Stock', variant: 'destructive' as const, color: 'text-red-600' };
    } else if (item.stock_quantity <= item.min_stock_level) {
      return { status: 'low-stock', label: 'Low Stock', variant: 'secondary' as const, color: 'text-yellow-600' };
    }
    return { status: 'in-stock', label: 'In Stock', variant: 'default' as const, color: 'text-green-600' };
  };

  // Table columns
  const columns: DataTableColumn<InventoryItem>[] = [
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
              className="w-12 h-12 rounded-lg object-cover border"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center border">
              <Package className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-foreground truncate">{row.name}</div>
            {row.description && (
              <div className="text-sm text-muted-foreground truncate max-w-48">
                {row.description}
              </div>
            )}
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
        const category = categoryMap[row.category_id];
        return (
          <Badge variant="outline" className="font-medium">
            {category?.name || 'Uncategorized'}
          </Badge>
        );
      },
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: categories.map(cat => ({ label: cat.name, value: cat.id })),
    },
    {
      id: 'weight',
      header: 'Weight',
      accessorKey: 'weight_grams',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 font-mono">
          <Weight className="h-4 w-4 text-muted-foreground" />
          {row.weight_grams}g
        </div>
      ),
      sortable: true,
      filterable: true,
      filterType: 'number',
      align: 'right',
    },
    {
      id: 'purchase_price',
      header: 'Purchase Price',
      accessorKey: 'purchase_price',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 font-mono">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          {row.purchase_price.toFixed(2)}
        </div>
      ),
      sortable: true,
      filterable: true,
      filterType: 'number',
      align: 'right',
    },
    {
      id: 'sell_price',
      header: 'Sell Price',
      accessorKey: 'sell_price',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 font-mono font-semibold">
          <DollarSign className="h-4 w-4 text-primary" />
          {row.sell_price.toFixed(2)}
        </div>
      ),
      sortable: true,
      filterable: true,
      filterType: 'number',
      align: 'right',
    },
    {
      id: 'stock',
      header: 'Stock',
      accessorKey: 'stock_quantity',
      cell: ({ row }) => {
        const stockStatus = getStockStatus(row);
        return (
          <div className="flex items-center gap-2">
            <span className="font-mono font-semibold">{row.stock_quantity}</span>
            {stockStatus.status !== 'in-stock' && (
              <AlertTriangle className={cn("h-4 w-4", stockStatus.color)} />
            )}
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
  ];

  // Table actions
  const actions: DataTableAction<InventoryItem>[] = [
    {
      id: 'view',
      label: 'View',
      icon: <Eye className="h-4 w-4" />,
      onClick: (item) => {
        // Handle view action
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
      id: 'delete',
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      variant: 'destructive',
      onClick: async (item) => {
        if (window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
          try {
            await deleteItemMutation.mutateAsync(item.id);
          } catch (error) {
            console.error('Failed to delete item:', error);
          }
        }
      },
    },
  ];

  const handleFormClose = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  const handleItemSelect = (item: InventoryItem) => {
    // Handle item selection for details view
    console.log('Selected item:', item);
  };

  // Grid view component
  const GridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <AnimatePresence>
        {inventoryData?.items.map((item, index) => {
          const stockStatus = getStockStatus(item);
          const category = categoryMap[item.category_id];
          
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
            >
              <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-primary/20">
                <CardHeader className="pb-3">
                  <div className="aspect-square relative overflow-hidden rounded-lg bg-muted">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
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
                    <Badge variant="outline">{category?.name || 'Uncategorized'}</Badge>
                    <span className="font-mono text-muted-foreground">{item.weight_grams}g</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">Purchase</div>
                      <div className="font-mono font-semibold">${item.purchase_price.toFixed(2)}</div>
                    </div>
                    <div className="space-y-1 text-right">
                      <div className="text-sm text-muted-foreground">Sell</div>
                      <div className="font-mono font-bold text-primary">${item.sell_price.toFixed(2)}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Stock:</span>
                      <span className="font-mono font-semibold">{item.stock_quantity}</span>
                      {stockStatus.status !== 'in-stock' && (
                        <AlertTriangle className={cn("h-4 w-4", stockStatus.color)} />
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingItem(item);
                          setShowForm(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700"
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
                            try {
                              await deleteItemMutation.mutateAsync(item.id);
                            } catch (error) {
                              console.error('Failed to delete item:', error);
                            }
                          }
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

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              Failed to load inventory items. Please try again.
            </div>
          </CardContent>
        </Card>
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
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Inventory Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your gold jewelry inventory with modern tools and insights
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {Object.values(filters).some(v => 
              Array.isArray(v) ? v.length > 0 : v !== undefined && v !== ''
            ) && (
              <Badge variant="secondary" className="ml-1">
                Active
              </Badge>
            )}
          </Button>
          <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
        </div>
      </motion.div>

      <Tabs defaultValue="inventory" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Inventory Items
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Categories
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
                  <AdvancedFilterPanel
                    categories={categories}
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
                          placeholder="Search inventory items..."
                          value={filters.search || ''}
                          onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                          className="pl-10"
                        />
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="flex items-center border rounded-lg p-1">
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
                            {inventoryData.total} items
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Bulk Operations */}
              <AnimatePresence>
                {selectedItems.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <BulkInventoryOperations
                      selectedItems={selectedItems}
                      items={inventoryData?.items || []}
                      categories={categories || []}
                      onBulkUpdate={async () => {}}
                      onBulkDelete={async () => {}}
                      onExport={async () => {}}
                      onSelectAll={() => {}}
                      onClearSelection={() => setSelectedItems([])}
                      totalItems={inventoryData?.total || 0}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Content */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {isLoading ? (
                  <Card>
                    <CardContent className="p-8">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading inventory items...</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : !inventoryData?.items.length ? (
                  <Card>
                    <CardContent className="p-8">
                      <div className="text-center space-y-4">
                        <Package className="h-16 w-16 text-muted-foreground mx-auto" />
                        <div>
                          <h3 className="text-lg font-semibold">No inventory items found</h3>
                          <p className="text-muted-foreground">
                            Add your first item to get started with inventory management.
                          </p>
                        </div>
                        <Button onClick={() => setShowForm(true)} className="mt-4">
                          <Plus className="h-4 w-4 mr-2" />
                          Add First Item
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : viewMode === 'grid' ? (
                  <GridView />
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Inventory Items
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <DataTable
                        data={inventoryData.items}
                        columns={columns}
                        actions={actions}
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
                        onRowClick={handleItemSelect}
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
          <CategoryManager onCategorySelect={(category) => console.log('Selected category:', category)} />
        </TabsContent>
      </Tabs>

      {/* Item Form Dialog */}
      <AnimatePresence>
        {showForm && (
          <InventoryItemForm
            item={editingItem}
            onClose={handleFormClose}
          />
        )}
      </AnimatePresence>
    </div>
  );
};



// Individual route components
const ProductsRoute: React.FC = () => (
  <div className="container mx-auto p-6 space-y-6">
    <div className="flex items-center gap-3 mb-6">
      <Package className="h-8 w-8 text-blue-600" />
      <div>
        <h1 className="text-3xl font-bold">Product Management</h1>
        <p className="text-muted-foreground">Manage your inventory items and product details</p>
      </div>
    </div>
    <InventoryList />
  </div>
);

const CategoriesRoute: React.FC = () => (
  <div className="container mx-auto p-6 space-y-6">
    <div className="flex items-center gap-3 mb-6">
      <FolderTree className="h-8 w-8 text-green-600" />
      <div>
        <h1 className="text-3xl font-bold">Category Management</h1>
        <p className="text-muted-foreground">Organize products with categories and subcategories</p>
      </div>
    </div>
    <CategoryManager />
  </div>
);

const BulkOperationsRoute: React.FC = () => {
  const { data: categories = [] } = useCategories();
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Edit className="h-8 w-8 text-purple-600" />
        <div>
          <h1 className="text-3xl font-bold">Bulk Operations</h1>
          <p className="text-muted-foreground">Perform bulk operations on multiple inventory items</p>
        </div>
      </div>
      <BulkInventoryOperations 
        selectedItems={[]} 
        categories={categories}
        onBulkUpdate={async () => {}}
        onBulkDelete={async () => {}}
        onExport={async () => {}}
        onSelectAll={() => {}}
        onClearSelection={() => {}}
        totalItems={0}
      />
    </div>
  );
};

// Wrapper component to handle sub-routes
export const InventoryWithRouting: React.FC = () => {
  return (
    <Routes>
      <Route path="/products" element={<ProductsRoute />} />
      <Route path="/categories" element={<CategoriesRoute />} />
      <Route path="/bulk" element={<BulkOperationsRoute />} />
      <Route path="/*" element={<Inventory />} />
    </Routes>
  );
};