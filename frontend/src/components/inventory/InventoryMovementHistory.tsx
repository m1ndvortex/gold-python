import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Package, 
  ShoppingCart,
  Truck,
  RotateCcw,
  AlertTriangle,
  Trash2,
  Calendar,
  Filter,
  Download,
  Eye,
  Search,
  RefreshCw,
  ArrowUpDown,
  Plus,
  Minus,
  Edit,
  User,
  Clock,
  Hash,
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../ui/select';
import { DataTable, type DataTableColumn, type DataTableAction } from '../ui/data-table';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '../ui/dialog';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { Alert, AlertDescription } from '../ui/alert';
import { useLanguage } from '../../hooks/useLanguage';
import { cn } from '../../lib/utils';
import { inventoryMovementsApi, universalInventoryApi } from '../../services/universalInventoryApi';
import type { 
  InventoryMovement,
  InventoryMovementWithDetails,
  InventoryMovementType,
  UniversalInventoryItem
} from '../../types/universalInventory';

interface InventoryMovementHistoryProps {
  itemId?: string;
  showFilters?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number; // in seconds
  className?: string;
}

interface MovementFilters {
  itemId?: string;
  movementTypes: InventoryMovementType[];
  dateFrom?: string;
  dateTo?: string;
  createdBy?: string;
  referenceType?: string;
  referenceId?: string;
  sortBy: 'created_at' | 'quantity' | 'total_cost' | 'movement_type';
  sortOrder: 'asc' | 'desc';
}

interface StockAdjustmentForm {
  itemId: string;
  movementType: InventoryMovementType;
  quantity: number;
  unitCost?: number;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
}

const defaultFilters: MovementFilters = {
  movementTypes: [],
  sortBy: 'created_at',
  sortOrder: 'desc',
};

const MOVEMENT_TYPE_CONFIG = {
  initial_stock: {
    label: 'Initial Stock',
    icon: Package,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    variant: 'default' as const,
  },
  purchase: {
    label: 'Purchase',
    icon: TrendingUp,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    variant: 'default' as const,
  },
  sale: {
    label: 'Sale',
    icon: ShoppingCart,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    variant: 'default' as const,
  },
  adjustment: {
    label: 'Adjustment',
    icon: Edit,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    variant: 'secondary' as const,
  },
  transfer: {
    label: 'Transfer',
    icon: Truck,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    variant: 'default' as const,
  },
  return: {
    label: 'Return',
    icon: RotateCcw,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
    variant: 'default' as const,
  },
  damage: {
    label: 'Damage',
    icon: AlertTriangle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    variant: 'destructive' as const,
  },
  theft: {
    label: 'Theft',
    icon: AlertTriangle,
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    variant: 'destructive' as const,
  },
  expiry: {
    label: 'Expiry',
    icon: Clock,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    variant: 'secondary' as const,
  },
};

export const InventoryMovementHistory: React.FC<InventoryMovementHistoryProps> = ({
  itemId,
  showFilters = true,
  autoRefresh = false,
  refreshInterval = 30,
  className
}) => {
  const { t } = useLanguage();
  const [movements, setMovements] = useState<InventoryMovementWithDetails[]>([]);
  const [filters, setFilters] = useState<MovementFilters>({
    ...defaultFilters,
    itemId,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [showAdjustmentForm, setShowAdjustmentForm] = useState(false);
  const [adjustmentForm, setAdjustmentForm] = useState<StockAdjustmentForm>({
    itemId: itemId || '',
    movementType: 'adjustment',
    quantity: 0,
  });
  const [selectedMovement, setSelectedMovement] = useState<InventoryMovementWithDetails | null>(null);
  const [showMovementDetails, setShowMovementDetails] = useState(false);

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(() => {
        loadMovements();
      }, refreshInterval * 1000);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, filters, page, pageSize]);

  // Initial load
  useEffect(() => {
    loadMovements();
  }, [filters, page, pageSize]);

  const loadMovements = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await inventoryMovementsApi.getMovements(
        filters.itemId,
        filters.movementTypes.length > 0 ? filters.movementTypes : undefined,
        filters.dateFrom,
        filters.dateTo,
        pageSize,
        (page - 1) * pageSize
      );

      setMovements(response.movements);
      setTotalCount(response.total_count);
    } catch (error) {
      console.error('Failed to load movements:', error);
      setError('Failed to load inventory movements. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStockAdjustment = async () => {
    if (!adjustmentForm.itemId || adjustmentForm.quantity === 0) return;

    try {
      await universalInventoryApi.adjustStock(
        adjustmentForm.itemId,
        adjustmentForm.quantity,
        adjustmentForm.notes
      );

      setShowAdjustmentForm(false);
      setAdjustmentForm({
        itemId: itemId || '',
        movementType: 'adjustment',
        quantity: 0,
      });
      
      // Refresh movements
      loadMovements();
    } catch (error) {
      console.error('Failed to adjust stock:', error);
      setError('Failed to adjust stock. Please try again.');
    }
  };

  const updateFilters = (updates: Partial<MovementFilters>) => {
    setFilters(prev => ({ ...prev, ...updates }));
    setPage(1); // Reset to first page when filters change
  };

  // Calculate movement statistics
  const movementStats = useMemo(() => {
    const stats = {
      totalIn: 0,
      totalOut: 0,
      totalValue: 0,
      byType: {} as Record<InventoryMovementType, number>,
    };

    movements.forEach(movement => {
      const isInbound = ['purchase', 'return', 'initial_stock', 'adjustment'].includes(movement.movement_type) && movement.quantity > 0;
      const isOutbound = ['sale', 'damage', 'theft', 'expiry'].includes(movement.movement_type) || 
                        (movement.movement_type === 'adjustment' && movement.quantity < 0);

      if (isInbound) {
        stats.totalIn += Math.abs(movement.quantity);
      } else if (isOutbound) {
        stats.totalOut += Math.abs(movement.quantity);
      }

      if (movement.total_cost) {
        stats.totalValue += movement.total_cost;
      }

      stats.byType[movement.movement_type] = (stats.byType[movement.movement_type] || 0) + Math.abs(movement.quantity);
    });

    return stats;
  }, [movements]);

  // Table columns
  const columns: DataTableColumn<InventoryMovementWithDetails>[] = [
    {
      id: 'movement',
      header: 'Movement',
      cell: ({ row }) => {
        const config = MOVEMENT_TYPE_CONFIG[row.movement_type];
        const Icon = config.icon;
        const isInbound = row.quantity > 0;
        
        return (
          <div className="flex items-center gap-3">
            <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", config.bgColor)}>
              <Icon className={cn("h-5 w-5", config.color)} />
            </div>
            <div>
              <div className="font-semibold">{config.label}</div>
              <div className="text-sm text-muted-foreground">
                {new Date(row.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        );
      },
      sortable: true,
    },
    {
      id: 'item',
      header: 'Item',
      cell: ({ row }) => (
        <div className="min-w-0">
          <div className="font-semibold truncate">
            {row.inventory_item?.name || 'Unknown Item'}
          </div>
          {row.inventory_item?.sku && (
            <div className="text-sm text-muted-foreground">
              SKU: {row.inventory_item.sku}
            </div>
          )}
        </div>
      ),
      sortable: true,
    },
    {
      id: 'quantity',
      header: 'Quantity',
      cell: ({ row }) => {
        const isInbound = row.quantity > 0;
        return (
          <div className="flex items-center gap-2">
            {isInbound ? (
              <Plus className="h-4 w-4 text-green-600" />
            ) : (
              <Minus className="h-4 w-4 text-red-600" />
            )}
            <span className={cn(
              "font-mono font-semibold",
              isInbound ? "text-green-600" : "text-red-600"
            )}>
              {Math.abs(row.quantity)}
            </span>
          </div>
        );
      },
      sortable: true,
      align: 'center',
    },
    {
      id: 'cost',
      header: 'Cost',
      cell: ({ row }) => (
        <div className="text-right">
          {row.unit_cost && (
            <div className="text-sm text-muted-foreground">
              Unit: ${row.unit_cost.toFixed(2)}
            </div>
          )}
          {row.total_cost && (
            <div className="font-mono font-semibold">
              ${row.total_cost.toFixed(2)}
            </div>
          )}
        </div>
      ),
      sortable: true,
      align: 'right',
    },
    {
      id: 'reference',
      header: 'Reference',
      cell: ({ row }) => (
        <div className="text-sm">
          {row.reference_type && row.reference_id ? (
            <div>
              <div className="font-medium">{row.reference_type}</div>
              <div className="text-muted-foreground font-mono">
                {row.reference_id}
              </div>
            </div>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </div>
      ),
    },
    {
      id: 'creator',
      header: 'Created By',
      cell: ({ row }) => (
        <div className="text-sm">
          {row.creator ? (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{row.creator.name || row.creator.email || 'Unknown'}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">System</span>
          )}
        </div>
      ),
    },
    {
      id: 'timestamp',
      header: 'Date & Time',
      cell: ({ row }) => (
        <div className="text-sm">
          <div>{new Date(row.created_at).toLocaleDateString()}</div>
          <div className="text-muted-foreground">
            {new Date(row.created_at).toLocaleTimeString()}
          </div>
        </div>
      ),
      sortable: true,
    },
  ];

  // Table actions
  const actions: DataTableAction<InventoryMovementWithDetails>[] = [
    {
      id: 'view',
      label: 'View Details',
      icon: <Eye className="h-4 w-4" />,
      onClick: (movement) => {
        setSelectedMovement(movement);
        setShowMovementDetails(true);
      },
    },
  ];

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <Card variant="gradient-blue">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <Activity className="h-4 w-4 text-white" />
              </div>
              Inventory Movement History
              <Badge variant="secondary">{totalCount} movements</Badge>
            </CardTitle>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdjustmentForm(true)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Stock Adjustment
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={loadMovements}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Filters */}
        {showFilters && (
          <CardContent className="border-t bg-muted/30">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Movement Types</Label>
                <Select
                  value={filters.movementTypes.join(',')}
                  onValueChange={(value) => {
                    const types = value ? value.split(',') as InventoryMovementType[] : [];
                    updateFilters({ movementTypes: types });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Types</SelectItem>
                    {Object.entries(MOVEMENT_TYPE_CONFIG).map(([type, config]) => (
                      <SelectItem key={type} value={type}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Date From</Label>
                <Input
                  type="date"
                  value={filters.dateFrom || ''}
                  onChange={(e) => updateFilters({ dateFrom: e.target.value || undefined })}
                />
              </div>

              <div className="space-y-2">
                <Label>Date To</Label>
                <Input
                  type="date"
                  value={filters.dateTo || ''}
                  onChange={(e) => updateFilters({ dateTo: e.target.value || undefined })}
                />
              </div>

              <div className="space-y-2">
                <Label>Sort By</Label>
                <Select
                  value={filters.sortBy}
                  onValueChange={(value) => updateFilters({ sortBy: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">Date</SelectItem>
                    <SelectItem value="quantity">Quantity</SelectItem>
                    <SelectItem value="total_cost">Total Cost</SelectItem>
                    <SelectItem value="movement_type">Type</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="gradient-green">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total In</p>
                <p className="text-2xl font-bold">{movementStats.totalIn}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card variant="gradient-red">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Out</p>
                <p className="text-2xl font-bold">{movementStats.totalOut}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card variant="gradient-blue">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Net Change</p>
                <p className="text-2xl font-bold">
                  {movementStats.totalIn - movementStats.totalOut}
                </p>
              </div>
              <ArrowUpDown className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card variant="gradient-purple">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">${movementStats.totalValue.toFixed(0)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Movements Table */}
      <Card variant="professional">
        <CardHeader>
          <CardTitle>Movement History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading movements...</p>
            </div>
          ) : movements.length === 0 ? (
            <div className="text-center py-8 space-y-4">
              <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg mx-auto">
                <Activity className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">No movements found</h3>
                <p className="text-muted-foreground">
                  No inventory movements match your current filters.
                </p>
              </div>
            </div>
          ) : (
            <DataTable
              data={movements}
              columns={columns}
              actions={actions}
              getRowId={(row) => row.id}
              pagination={{
                pageIndex: page - 1,
                pageSize,
                pageCount: Math.ceil(totalCount / pageSize),
                onPageChange: (pageIndex) => setPage(pageIndex + 1),
                onPageSizeChange: setPageSize,
              }}
              striped
              className="border-0"
            />
          )}
        </CardContent>
      </Card>

      {/* Stock Adjustment Dialog */}
      <Dialog open={showAdjustmentForm} onOpenChange={setShowAdjustmentForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stock Adjustment</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Movement Type</Label>
              <Select
                value={adjustmentForm.movementType}
                onValueChange={(value) => 
                  setAdjustmentForm(prev => ({ ...prev, movementType: value as InventoryMovementType }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="adjustment">Adjustment</SelectItem>
                  <SelectItem value="damage">Damage</SelectItem>
                  <SelectItem value="theft">Theft</SelectItem>
                  <SelectItem value="expiry">Expiry</SelectItem>
                  <SelectItem value="return">Return</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Quantity Change</Label>
              <Input
                type="number"
                placeholder="Enter quantity (positive for increase, negative for decrease)"
                value={adjustmentForm.quantity || ''}
                onChange={(e) => 
                  setAdjustmentForm(prev => ({ ...prev, quantity: Number(e.target.value) }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Unit Cost (optional)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="Enter unit cost"
                value={adjustmentForm.unitCost || ''}
                onChange={(e) => 
                  setAdjustmentForm(prev => ({ ...prev, unitCost: Number(e.target.value) || undefined }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Enter reason for adjustment..."
                value={adjustmentForm.notes || ''}
                onChange={(e) => 
                  setAdjustmentForm(prev => ({ ...prev, notes: e.target.value }))
                }
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdjustmentForm(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleStockAdjustment}
              disabled={!adjustmentForm.itemId || adjustmentForm.quantity === 0}
            >
              Apply Adjustment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Movement Details Dialog */}
      <Dialog open={showMovementDetails} onOpenChange={setShowMovementDetails}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Movement Details</DialogTitle>
          </DialogHeader>
          
          {selectedMovement && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Type</Label>
                  <p className="font-semibold">
                    {MOVEMENT_TYPE_CONFIG[selectedMovement.movement_type].label}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Quantity</Label>
                  <p className="font-semibold">{selectedMovement.quantity}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Unit Cost</Label>
                  <p className="font-semibold">
                    {selectedMovement.unit_cost ? `$${selectedMovement.unit_cost.toFixed(2)}` : '-'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Total Cost</Label>
                  <p className="font-semibold">
                    {selectedMovement.total_cost ? `$${selectedMovement.total_cost.toFixed(2)}` : '-'}
                  </p>
                </div>
              </div>

              {selectedMovement.reference_type && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Reference</Label>
                  <p className="font-semibold">
                    {selectedMovement.reference_type}: {selectedMovement.reference_id}
                  </p>
                </div>
              )}

              {selectedMovement.notes && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Notes</Label>
                  <p>{selectedMovement.notes}</p>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium text-muted-foreground">Created</Label>
                <p>{new Date(selectedMovement.created_at).toLocaleString()}</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMovementDetails(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};