import React, { useState } from 'react';
import { 
  Package, 
  Edit, 
  Trash2, 
  Download, 
  Upload, 
  Tag, 
  DollarSign, 
  Eye, 
  EyeOff, 
  Copy,
  Archive,
  RotateCcw,
  CheckSquare,
  Square,
  AlertTriangle,
  Info
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
import { Textarea } from '../ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '../ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { Progress } from '../ui/progress';
import { cn } from '../../lib/utils';
import type { InventoryItem, Category } from '../../types';

interface BulkOperation {
  id: string;
  type: 'update' | 'delete' | 'archive' | 'activate' | 'deactivate' | 'category_change' | 'price_update' | 'stock_update';
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  requiresConfirmation: boolean;
  destructive?: boolean;
}

interface BulkUpdateData {
  category_id?: string;
  price_adjustment?: {
    type: 'percentage' | 'fixed';
    value: number;
    apply_to: 'purchase' | 'sell' | 'both';
  };
  stock_adjustment?: {
    type: 'set' | 'add' | 'subtract';
    value: number;
  };
  status_change?: 'active' | 'inactive';
  min_stock_level?: number;
  description?: string;
}

interface BulkOperationProgress {
  total: number;
  completed: number;
  failed: number;
  errors: string[];
}

interface BulkInventoryOperationsProps {
  selectedItems: string[];
  items?: InventoryItem[]; // Optional full items for display
  categories: Category[];
  onBulkUpdate: (itemIds: string[], updates: BulkUpdateData) => Promise<void>;
  onBulkDelete: (itemIds: string[]) => Promise<void>;
  onExport: (itemIds: string[], format: 'csv' | 'excel' | 'pdf') => Promise<void>;
  onSelectAll: () => void;
  onClearSelection: () => void;
  totalItems: number;
  className?: string;
}

const bulkOperations: BulkOperation[] = [
  {
    id: 'update_category',
    type: 'category_change',
    name: 'Change Category',
    description: 'Move selected items to a different category',
    icon: Tag,
    requiresConfirmation: false,
  },
  {
    id: 'update_prices',
    type: 'price_update',
    name: 'Update Prices',
    description: 'Adjust purchase or sell prices for selected items',
    icon: DollarSign,
    requiresConfirmation: false,
  },
  {
    id: 'update_stock',
    type: 'stock_update',
    name: 'Update Stock',
    description: 'Adjust stock quantities for selected items',
    icon: Package,
    requiresConfirmation: false,
  },
  {
    id: 'activate',
    type: 'activate',
    name: 'Activate Items',
    description: 'Make selected items active and visible',
    icon: Eye,
    requiresConfirmation: false,
  },
  {
    id: 'deactivate',
    type: 'deactivate',
    name: 'Deactivate Items',
    description: 'Make selected items inactive and hidden',
    icon: EyeOff,
    requiresConfirmation: true,
  },
  {
    id: 'duplicate',
    type: 'update',
    name: 'Duplicate Items',
    description: 'Create copies of selected items',
    icon: Copy,
    requiresConfirmation: false,
  },
  {
    id: 'archive',
    type: 'archive',
    name: 'Archive Items',
    description: 'Archive selected items (can be restored later)',
    icon: Archive,
    requiresConfirmation: true,
  },
  {
    id: 'delete',
    type: 'delete',
    name: 'Delete Items',
    description: 'Permanently delete selected items',
    icon: Trash2,
    requiresConfirmation: true,
    destructive: true,
  },
];

export const BulkInventoryOperations: React.FC<BulkInventoryOperationsProps> = ({
  selectedItems,
  items = [],
  categories,
  onBulkUpdate,
  onBulkDelete,
  onExport,
  onSelectAll,
  onClearSelection,
  totalItems,
  className
}) => {
  const [activeOperation, setActiveOperation] = useState<BulkOperation | null>(null);
  const [updateData, setUpdateData] = useState<BulkUpdateData>({});
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<BulkOperationProgress | null>(null);
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel' | 'pdf'>('csv');

  const selectedCount = selectedItems.length;
  const isAllSelected = selectedCount === totalItems && totalItems > 0;

  const handleOperationClick = (operation: BulkOperation) => {
    if (selectedCount === 0) return;
    
    setActiveOperation(operation);
    setUpdateData({});
    
    if (operation.requiresConfirmation) {
      setShowConfirmDialog(true);
    }
  };

  const handleConfirmOperation = async () => {
    if (!activeOperation) return;
    
    setIsProcessing(true);
    setProgress({
      total: selectedCount,
      completed: 0,
      failed: 0,
      errors: []
    });

    try {
      const itemIds = selectedItems;
      
      switch (activeOperation.type) {
        case 'delete':
          await onBulkDelete(itemIds);
          break;
        case 'activate':
          await onBulkUpdate(itemIds, { status_change: 'active' });
          break;
        case 'deactivate':
          await onBulkUpdate(itemIds, { status_change: 'inactive' });
          break;
        default:
          await onBulkUpdate(itemIds, updateData);
          break;
      }
      
      setProgress(prev => prev ? { ...prev, completed: prev.total } : null);
      
      // Close dialogs after successful operation
      setTimeout(() => {
        setActiveOperation(null);
        setShowConfirmDialog(false);
        setIsProcessing(false);
        setProgress(null);
        onClearSelection();
      }, 1000);
      
    } catch (error) {
      setProgress(prev => prev ? { 
        ...prev, 
        failed: prev.total - prev.completed,
        errors: [...prev.errors, error instanceof Error ? error.message : 'Unknown error']
      } : null);
    }
  };

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    if (selectedCount === 0) return;
    
    try {
      const itemIds = selectedItems;
      await onExport(itemIds, format);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const renderOperationDialog = () => {
    if (!activeOperation) return null;

    return (
      <Dialog open={!!activeOperation && !showConfirmDialog} onOpenChange={() => setActiveOperation(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <activeOperation.icon className="h-5 w-5" />
              {activeOperation.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <Info className="h-4 w-4 text-blue-600" />
              <span className="text-sm">
                This will affect {selectedCount} selected item{selectedCount !== 1 ? 's' : ''}
              </span>
            </div>

            {activeOperation.type === 'category_change' && (
              <div className="space-y-2">
                <Label>New Category</Label>
                <Select
                  value={updateData.category_id || ''}
                  onValueChange={(value) => setUpdateData({ ...updateData, category_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {activeOperation.type === 'price_update' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Price Adjustment Type</Label>
                  <Select
                    value={updateData.price_adjustment?.type || 'percentage'}
                    onValueChange={(value) => setUpdateData({
                      ...updateData,
                      price_adjustment: {
                        ...updateData.price_adjustment,
                        type: value as 'percentage' | 'fixed',
                        value: updateData.price_adjustment?.value || 0,
                        apply_to: updateData.price_adjustment?.apply_to || 'both'
                      }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>
                    {updateData.price_adjustment?.type === 'percentage' ? 'Percentage (%)' : 'Amount ($)'}
                  </Label>
                  <Input
                    type="number"
                    step={updateData.price_adjustment?.type === 'percentage' ? '0.1' : '0.01'}
                    value={updateData.price_adjustment?.value || ''}
                    onChange={(e) => setUpdateData({
                      ...updateData,
                      price_adjustment: {
                        ...updateData.price_adjustment,
                        type: updateData.price_adjustment?.type || 'percentage',
                        value: parseFloat(e.target.value) || 0,
                        apply_to: updateData.price_adjustment?.apply_to || 'both'
                      }
                    })}
                    placeholder={updateData.price_adjustment?.type === 'percentage' ? '10' : '5.00'}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Apply To</Label>
                  <Select
                    value={updateData.price_adjustment?.apply_to || 'both'}
                    onValueChange={(value) => setUpdateData({
                      ...updateData,
                      price_adjustment: {
                        ...updateData.price_adjustment,
                        type: updateData.price_adjustment?.type || 'percentage',
                        value: updateData.price_adjustment?.value || 0,
                        apply_to: value as 'purchase' | 'sell' | 'both'
                      }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="both">Both Prices</SelectItem>
                      <SelectItem value="purchase">Purchase Price Only</SelectItem>
                      <SelectItem value="sell">Sell Price Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {activeOperation.type === 'stock_update' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Stock Adjustment Type</Label>
                  <Select
                    value={updateData.stock_adjustment?.type || 'set'}
                    onValueChange={(value) => setUpdateData({
                      ...updateData,
                      stock_adjustment: {
                        ...updateData.stock_adjustment,
                        type: value as 'set' | 'add' | 'subtract',
                        value: updateData.stock_adjustment?.value || 0
                      }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="set">Set To</SelectItem>
                      <SelectItem value="add">Add</SelectItem>
                      <SelectItem value="subtract">Subtract</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    value={updateData.stock_adjustment?.value || ''}
                    onChange={(e) => setUpdateData({
                      ...updateData,
                      stock_adjustment: {
                        ...updateData.stock_adjustment,
                        type: updateData.stock_adjustment?.type || 'set',
                        value: parseInt(e.target.value) || 0
                      }
                    })}
                    placeholder="0"
                  />
                </div>
              </div>
            )}

            {isProcessing && progress && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{progress.completed} / {progress.total}</span>
                </div>
                <Progress value={(progress.completed / progress.total) * 100} />
                {progress.errors.length > 0 && (
                  <div className="text-sm text-red-600">
                    {progress.failed} items failed to update
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActiveOperation(null)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmOperation}
              disabled={isProcessing}
              className={cn(
                activeOperation.destructive && "bg-red-600 hover:bg-red-700"
              )}
            >
              {isProcessing ? 'Processing...' : `Apply to ${selectedCount} items`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  const renderConfirmDialog = () => {
    if (!activeOperation || !showConfirmDialog) return null;

    return (
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Confirm {activeOperation.name}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {activeOperation.description}
              <br />
              <br />
              This action will affect <strong>{selectedCount}</strong> selected item{selectedCount !== 1 ? 's' : ''}.
              {activeOperation.destructive && (
                <>
                  <br />
                  <span className="text-red-600 font-medium">
                    This action cannot be undone.
                  </span>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmOperation}
              className={cn(
                activeOperation.destructive && "bg-red-600 hover:bg-red-700"
              )}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  };

  if (selectedCount === 0) {
    return (
      <Card className={cn("border-dashed", className)}>
        <CardContent className="p-6 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">No items selected</p>
          <p className="text-sm text-muted-foreground mb-4">
            Select items to perform bulk operations
          </p>
          <Button onClick={onSelectAll} variant="outline">
            <CheckSquare className="h-4 w-4 mr-2" />
            Select All ({totalItems})
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckSquare className="h-5 w-5" />
              Bulk Operations
              <Badge variant="secondary">{selectedCount} selected</Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              {!isAllSelected && (
                <Button variant="outline" size="sm" onClick={onSelectAll}>
                  <CheckSquare className="h-4 w-4 mr-1" />
                  All ({totalItems})
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={onClearSelection}>
                <Square className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {bulkOperations.slice(0, 4).map((operation) => (
              <Button
                key={operation.id}
                variant="outline"
                size="sm"
                onClick={() => handleOperationClick(operation)}
                className={cn(
                  "flex flex-col items-center gap-1 h-auto py-3",
                  operation.destructive && "hover:bg-red-50 hover:border-red-200"
                )}
              >
                <operation.icon className="h-4 w-4" />
                <span className="text-xs">{operation.name}</span>
              </Button>
            ))}
          </div>

          {/* More Operations */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">More Operations</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {bulkOperations.slice(4).map((operation) => (
                <Button
                  key={operation.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleOperationClick(operation)}
                  className={cn(
                    "justify-start",
                    operation.destructive && "hover:bg-red-50 hover:border-red-200"
                  )}
                >
                  <operation.icon className="h-4 w-4 mr-2" />
                  {operation.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Export Options */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Export Selected</Label>
            <div className="flex gap-2">
              <Select value={exportFormat} onValueChange={(value) => setExportFormat(value as 'csv' | 'excel' | 'pdf')}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport(exportFormat)}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Export {exportFormat.toUpperCase()}
              </Button>
            </div>
          </div>

          {/* Selected Items Preview */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Selected Items</Label>
            <div className="max-h-32 overflow-y-auto border rounded-md p-2 space-y-1">
              {selectedItems.slice(0, 10).map((itemId) => {
                const item = items.find(i => i.id === itemId);
                return (
                  <div key={itemId} className="flex items-center justify-between text-sm">
                    <span className="truncate">
                      {item ? item.name : `Item ID: ${itemId.slice(0, 8)}...`}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      Selected
                    </Badge>
                  </div>
                );
              })}
              {selectedItems.length > 10 && (
                <div className="text-xs text-muted-foreground text-center py-1">
                  ... and {selectedItems.length - 10} more items
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {renderOperationDialog()}
      {renderConfirmDialog()}
    </>
  );
};