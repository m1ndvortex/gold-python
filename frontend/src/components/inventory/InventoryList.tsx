import React, { useState, useMemo } from 'react';
import { Plus, Search, Filter, Edit, Trash2, AlertTriangle, Package } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { useInventoryItems, useCategories, useDeleteInventoryItem } from '../../hooks/useInventory';
import { InventoryItemForm } from './InventoryItemForm';
import { BulkOperations } from './BulkOperations';
import type { InventoryItem } from '../../types';

interface InventoryListProps {
  onItemSelect?: (item: InventoryItem) => void;
}

export const InventoryList: React.FC<InventoryListProps> = ({ onItemSelect }) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const limit = 20;

  // Fetch data
  const { data: inventoryData, isLoading, error } = useInventoryItems({
    search: search || undefined,
    category_id: categoryFilter || undefined,
    low_stock: lowStockFilter || undefined,
    page,
    limit,
  });

  const { data: categories = [] } = useCategories();
  const deleteItemMutation = useDeleteInventoryItem();

  // Memoized category map for performance
  const categoryMap = useMemo(() => {
    return categories.reduce((acc, category) => {
      acc[category.id] = category;
      return acc;
    }, {} as Record<string, typeof categories[0]>);
  }, [categories]);

  const handleSelectAll = (checked: boolean) => {
    if (checked && inventoryData?.items) {
      setSelectedItems(inventoryData.items.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, itemId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId));
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = async (item: InventoryItem) => {
    if (window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
      try {
        await deleteItemMutation.mutateAsync(item.id);
      } catch (error) {
        console.error('Failed to delete item:', error);
      }
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.stock_quantity <= 0) {
      return { status: 'out-of-stock', label: 'Out of Stock', variant: 'destructive' as const };
    } else if (item.stock_quantity <= item.min_stock_level) {
      return { status: 'low-stock', label: 'Low Stock', variant: 'secondary' as const };
    }
    return { status: 'in-stock', label: 'In Stock', variant: 'default' as const };
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Failed to load inventory items. Please try again.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground">
            Manage your gold jewelry inventory, categories, and stock levels
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={categoryFilter || "all"} onValueChange={(value) => setCategoryFilter(value === "all" ? "" : value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="low-stock"
                checked={lowStockFilter}
                onCheckedChange={(checked) => setLowStockFilter(checked === true)}
              />
              <label htmlFor="low-stock" className="text-sm font-medium">
                Low Stock Only
              </label>
            </div>

            <Button
              variant="outline"
              onClick={() => {
                setSearch('');
                setCategoryFilter('');
                setLowStockFilter(false);
                setPage(1);
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Operations */}
      {selectedItems.length > 0 && (
        <BulkOperations
          selectedItems={selectedItems}
          onClearSelection={() => setSelectedItems([])}
        />
      )}

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Inventory Items
            {inventoryData && (
              <Badge variant="secondary">
                {inventoryData.total} items
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading inventory items...</div>
          ) : !inventoryData?.items.length ? (
            <div className="text-center py-8 text-muted-foreground">
              No inventory items found. Add your first item to get started.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedItems.length === inventoryData.items.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Weight (g)</TableHead>
                    <TableHead>Purchase Price</TableHead>
                    <TableHead>Sell Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventoryData.items.map((item) => {
                    const stockStatus = getStockStatus(item);
                    const category = categoryMap[item.category_id];
                    
                    return (
                      <TableRow 
                        key={item.id}
                        className={`cursor-pointer ${
                          selectedItems.includes(item.id) ? 'bg-muted/50' : ''
                        }`}
                        onClick={() => onItemSelect?.(item)}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedItems.includes(item.id)}
                            onCheckedChange={(checked) => 
                              handleSelectItem(item.id, checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {item.image_url ? (
                              <img
                                src={item.image_url}
                                alt={item.name}
                                className="w-10 h-10 rounded-md object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center">
                                <Package className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium">{item.name}</div>
                              {item.description && (
                                <div className="text-sm text-muted-foreground truncate max-w-48">
                                  {item.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {category?.name || 'Uncategorized'}
                        </TableCell>
                        <TableCell>{item.weight_grams}</TableCell>
                        <TableCell>${item.purchase_price.toFixed(2)}</TableCell>
                        <TableCell>${item.sell_price.toFixed(2)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {item.stock_quantity}
                            {stockStatus.status === 'low-stock' && (
                              <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            )}
                            {stockStatus.status === 'out-of-stock' && (
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={stockStatus.variant}>
                            {stockStatus.label}
                          </Badge>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(item)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(item)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Pagination */}
              {inventoryData.total_pages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, inventoryData.total)} of {inventoryData.total} items
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {page} of {inventoryData.total_pages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(inventoryData.total_pages, p + 1))}
                      disabled={page === inventoryData.total_pages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Item Form Dialog */}
      {showForm && (
        <InventoryItemForm
          item={editingItem}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
};