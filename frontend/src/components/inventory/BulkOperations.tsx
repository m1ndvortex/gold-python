import React, { useState } from 'react';
import { Trash2, Edit, Package, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../ui/select';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '../ui/dialog';
import { useBulkUpdateInventoryItems, useCategories } from '../../hooks/useInventory';

interface BulkOperationsProps {
  selectedItems: string[];
  onClearSelection: () => void;
}

interface BulkUpdateForm {
  category_id?: string;
  min_stock_level?: number;
  is_active?: boolean;
}

export const BulkOperations: React.FC<BulkOperationsProps> = ({
  selectedItems,
  onClearSelection,
}) => {
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [bulkForm, setBulkForm] = useState<BulkUpdateForm>({});

  const { data: categories = [] } = useCategories();
  const bulkUpdateMutation = useBulkUpdateInventoryItems();

  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedItems.length} items? This action cannot be undone.`)) {
      try {
        // Note: This would need a bulk delete API endpoint
        // For now, we'll show the confirmation but not implement the actual deletion
        console.log('Bulk delete not implemented yet');
        onClearSelection();
      } catch (error) {
        console.error('Failed to delete items:', error);
      }
    }
  };

  const handleBulkUpdate = async () => {
    try {
      const updates: any = {};
      
      if (bulkForm.category_id) {
        updates.category_id = bulkForm.category_id;
      }
      
      if (bulkForm.min_stock_level !== undefined) {
        updates.min_stock_level = bulkForm.min_stock_level;
      }
      
      if (bulkForm.is_active !== undefined) {
        updates.is_active = bulkForm.is_active;
      }

      if (Object.keys(updates).length === 0) {
        alert('Please select at least one field to update');
        return;
      }

      await bulkUpdateMutation.mutateAsync({
        item_ids: selectedItems,
        updates,
      });

      setShowBulkEdit(false);
      setBulkForm({});
      onClearSelection();
    } catch (error) {
      console.error('Failed to update items:', error);
    }
  };

  const resetBulkForm = () => {
    setBulkForm({});
    setShowBulkEdit(false);
  };

  return (
    <>
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5 text-blue-600" />
              <span className="font-medium">
                <Badge variant="secondary" className="mr-2">
                  {selectedItems.length}
                </Badge>
                items selected
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBulkEdit(true)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Bulk Edit
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkDelete}
                className="flex items-center gap-2 text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
                Delete Selected
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearSelection}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Clear Selection
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Edit Dialog */}
      <Dialog open={showBulkEdit} onOpenChange={setShowBulkEdit}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Bulk Edit {selectedItems.length} Items
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select the fields you want to update for all selected items. 
              Leave fields empty to keep their current values.
            </p>

            <div className="space-y-4">
              {/* Category Update */}
              <div className="space-y-2">
                <Label>Change Category</Label>
                <Select
                  value={bulkForm.category_id || 'no-change'}
                  onValueChange={(value) => 
                    setBulkForm(prev => ({ 
                      ...prev, 
                      category_id: value === 'no-change' ? undefined : value 
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select new category (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-change">No change</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Minimum Stock Level Update */}
              <div className="space-y-2">
                <Label htmlFor="bulk-min-stock">Minimum Stock Level</Label>
                <Input
                  id="bulk-min-stock"
                  type="number"
                  placeholder="Leave empty for no change"
                  value={bulkForm.min_stock_level || ''}
                  onChange={(e) => 
                    setBulkForm(prev => ({ 
                      ...prev, 
                      min_stock_level: e.target.value ? Number(e.target.value) : undefined 
                    }))
                  }
                />
              </div>

              {/* Active Status Update */}
              <div className="space-y-2">
                <Label>Item Status</Label>
                <Select
                  value={bulkForm.is_active !== undefined ? bulkForm.is_active.toString() : 'no-change'}
                  onValueChange={(value) => 
                    setBulkForm(prev => ({ 
                      ...prev, 
                      is_active: value === 'no-change' ? undefined : value === 'true'
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-change">No change</SelectItem>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetBulkForm}>
              Cancel
            </Button>
            <Button 
              onClick={handleBulkUpdate}
              disabled={bulkUpdateMutation.isPending}
            >
              {bulkUpdateMutation.isPending ? 'Updating...' : 'Update Items'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};