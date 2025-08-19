import React, { useState } from 'react';
import { 
  CheckSquare, 
  Square, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Move, 
  Palette,
  Settings,
  AlertTriangle,
  Check
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../ui/select';
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
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Separator } from '../ui/separator';
import { Checkbox } from '../ui/checkbox';
import type { Category } from '../../types';

interface CategoryNode extends Category {
  children: CategoryNode[];
  product_count?: number;
  icon?: string;
  color?: string;
}

interface BulkOperation {
  type: 'update' | 'delete' | 'move';
  data?: any;
}

interface CategoryBulkOperationsProps {
  categories: CategoryNode[];
  selectedCategories: Set<string>;
  onSelectionChange: (categoryIds: Set<string>) => void;
  onBulkUpdate: (categoryIds: string[], updates: Record<string, any>) => Promise<void>;
  onBulkDelete: (categoryIds: string[], force?: boolean) => Promise<void>;
  onBulkMove: (categoryIds: string[], newParentId?: string) => Promise<void>;
  isLoading?: boolean;
}

export const CategoryBulkOperations: React.FC<CategoryBulkOperationsProps> = ({
  categories,
  selectedCategories,
  onSelectionChange,
  onBulkUpdate,
  onBulkDelete,
  onBulkMove,
  isLoading = false
}) => {
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [bulkOperation, setBulkOperation] = useState<BulkOperation | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteForce, setDeleteForce] = useState(false);

  // Bulk update form state
  const [bulkUpdates, setBulkUpdates] = useState({
    is_active: undefined as boolean | undefined,
    color: '',
    icon: '',
    parent_id: ''
  });

  const flattenCategories = (cats: CategoryNode[]): CategoryNode[] => {
    const result: CategoryNode[] = [];
    const flatten = (categories: CategoryNode[]) => {
      categories.forEach(cat => {
        result.push(cat);
        if (cat.children && cat.children.length > 0) {
          flatten(cat.children);
        }
      });
    };
    flatten(cats);
    return result;
  };

  const allCategories = flattenCategories(categories);
  const selectedCount = selectedCategories.size;
  const totalCount = allCategories.length;

  const handleSelectAll = () => {
    if (selectedCategories.size === totalCount) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(allCategories.map(cat => cat.id)));
    }
  };

  const handleSelectCategory = (categoryId: string) => {
    const newSelection = new Set(selectedCategories);
    if (newSelection.has(categoryId)) {
      newSelection.delete(categoryId);
    } else {
      newSelection.add(categoryId);
    }
    onSelectionChange(newSelection);
  };

  const handleBulkUpdate = () => {
    setBulkOperation({ type: 'update' });
    setShowBulkDialog(true);
  };

  const handleBulkMove = () => {
    setBulkOperation({ type: 'move' });
    setShowBulkDialog(true);
  };

  const handleBulkDelete = () => {
    setBulkOperation({ type: 'delete' });
    setShowDeleteConfirm(true);
  };

  const executeBulkUpdate = async () => {
    if (selectedCategories.size === 0) return;

    const updates: Record<string, any> = {};
    
    if (bulkUpdates.is_active !== undefined) {
      updates.is_active = bulkUpdates.is_active;
    }
    if (bulkUpdates.color) {
      updates.color = bulkUpdates.color;
    }
    if (bulkUpdates.icon) {
      updates.icon = bulkUpdates.icon;
    }
    if (bulkUpdates.parent_id && bulkUpdates.parent_id !== 'no-change') {
      updates.parent_id = bulkUpdates.parent_id === 'none' ? null : bulkUpdates.parent_id;
    }

    if (Object.keys(updates).length === 0) {
      return;
    }

    try {
      await onBulkUpdate(Array.from(selectedCategories), updates);
      setShowBulkDialog(false);
      setBulkUpdates({
        is_active: undefined,
        color: '',
        icon: '',
        parent_id: ''
      });
    } catch (error) {
      console.error('Bulk update failed:', error);
    }
  };

  const executeBulkMove = async () => {
    if (selectedCategories.size === 0 || !bulkUpdates.parent_id) return;

    const newParentId = bulkUpdates.parent_id === 'none' ? undefined : bulkUpdates.parent_id;

    try {
      await onBulkMove(Array.from(selectedCategories), newParentId);
      setShowBulkDialog(false);
      setBulkUpdates({
        is_active: undefined,
        color: '',
        icon: '',
        parent_id: ''
      });
    } catch (error) {
      console.error('Bulk move failed:', error);
    }
  };

  const executeBulkDelete = async () => {
    if (selectedCategories.size === 0) return;

    try {
      await onBulkDelete(Array.from(selectedCategories), deleteForce);
      setShowDeleteConfirm(false);
      setDeleteForce(false);
    } catch (error) {
      console.error('Bulk delete failed:', error);
    }
  };

  const getSelectedCategoriesWithProducts = () => {
    return allCategories.filter(cat => 
      selectedCategories.has(cat.id) && (cat.product_count || 0) > 0
    );
  };

  const categoriesWithProducts = getSelectedCategoriesWithProducts();

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Bulk Operations
              {selectedCount > 0 && (
                <Badge variant="secondary">
                  {selectedCount} selected
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="flex items-center gap-2"
              >
                {selectedCategories.size === totalCount ? (
                  <CheckSquare className="h-4 w-4" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
                {selectedCategories.size === totalCount ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Selection List */}
          <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
            {allCategories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-2 rounded border hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selectedCategories.has(category.id)}
                    onCheckedChange={() => handleSelectCategory(category.id)}
                  />
                  <div className="flex items-center gap-2">
                    {category.icon && <span>{category.icon}</span>}
                    <span className="font-medium">{category.name}</span>
                    {category.product_count !== undefined && (
                      <Badge variant="outline" className="text-xs">
                        {category.product_count} products
                      </Badge>
                    )}
                    {!category.is_active && (
                      <Badge variant="secondary" className="text-xs">
                        Inactive
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Separator className="my-4" />

          {/* Bulk Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              onClick={handleBulkUpdate}
              disabled={selectedCount === 0 || isLoading}
              size="sm"
            >
              <Edit className="h-4 w-4 mr-2" />
              Update Selected ({selectedCount})
            </Button>
            <Button
              onClick={handleBulkMove}
              disabled={selectedCount === 0 || isLoading}
              size="sm"
              variant="outline"
            >
              <Move className="h-4 w-4 mr-2" />
              Move Selected
            </Button>
            <Button
              onClick={handleBulkDelete}
              disabled={selectedCount === 0 || isLoading}
              size="sm"
              variant="destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Operations Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {bulkOperation?.type === 'update' && 'Bulk Update Categories'}
              {bulkOperation?.type === 'move' && 'Move Categories'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This will affect {selectedCount} selected categories.
            </p>

            {bulkOperation?.type === 'update' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={
                      bulkUpdates.is_active === undefined 
                        ? 'no-change' 
                        : bulkUpdates.is_active 
                          ? 'active' 
                          : 'inactive'
                    }
                    onValueChange={(value) => 
                      setBulkUpdates(prev => ({
                        ...prev,
                        is_active: value === 'no-change' 
                          ? undefined 
                          : value === 'active'
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-change">No change</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Color</Label>
                  <Input
                    value={bulkUpdates.color}
                    onChange={(e) => setBulkUpdates(prev => ({ ...prev, color: e.target.value }))}
                    placeholder="Leave empty for no change"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Icon</Label>
                  <Input
                    value={bulkUpdates.icon}
                    onChange={(e) => setBulkUpdates(prev => ({ ...prev, icon: e.target.value }))}
                    placeholder="Leave empty for no change"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Parent Category</Label>
                  <Select
                    value={bulkUpdates.parent_id || 'no-change'}
                    onValueChange={(value) => 
                      setBulkUpdates(prev => ({ ...prev, parent_id: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-change">No change</SelectItem>
                      <SelectItem value="none">No parent (root)</SelectItem>
                      {allCategories
                        .filter(cat => !selectedCategories.has(cat.id))
                        .map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {bulkOperation?.type === 'move' && (
              <div className="space-y-2">
                <Label>New Parent Category</Label>
                <Select
                  value={bulkUpdates.parent_id || ''}
                  onValueChange={(value) => 
                    setBulkUpdates(prev => ({ ...prev, parent_id: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select new parent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No parent (root level)</SelectItem>
                    {allCategories
                      .filter(cat => !selectedCategories.has(cat.id))
                      .map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={bulkOperation?.type === 'update' ? executeBulkUpdate : executeBulkMove}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Apply Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Delete Categories
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                You are about to delete {selectedCount} categories. This action cannot be undone.
              </p>
              
              {categoriesWithProducts.length > 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="font-medium text-yellow-800 mb-2">
                    Warning: Categories with products
                  </p>
                  <div className="space-y-1">
                    {categoriesWithProducts.map(cat => (
                      <div key={cat.id} className="text-sm text-yellow-700">
                        • {cat.name} ({cat.product_count} products)
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center space-x-2">
                    <Checkbox
                      id="force-delete"
                      checked={deleteForce}
                      onCheckedChange={(checked) => setDeleteForce(checked === true)}
                    />
                    <Label htmlFor="force-delete" className="text-sm text-yellow-800">
                      Force delete (products will be moved to uncategorized)
                    </Label>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeBulkDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={categoriesWithProducts.length > 0 && !deleteForce}
            >
              Delete Categories
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};