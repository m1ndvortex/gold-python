import React, { useState } from 'react';
import { Plus, Edit, Trash2, FolderTree, Folder, FolderOpen } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '../ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../ui/select';
import { 
  useCategories, 
  useCreateCategory, 
  useUpdateCategory, 
  useDeleteCategory 
} from '../../hooks/useInventory';
import type { Category } from '../../types';

interface CategoryManagerProps {
  onCategorySelect?: (category: Category) => void;
}

interface CategoryFormData {
  name: string;
  parent_id?: string;
  description?: string;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({ 
  onCategorySelect 
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    parent_id: '',
    description: '',
  });
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const { data: categories = [], isLoading } = useCategories();
  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();
  const deleteCategoryMutation = useDeleteCategory();

  // Build hierarchical category structure
  const buildCategoryTree = (categories: Category[]): (Category & { children: Category[] })[] => {
    const categoryMap = new Map<string, Category & { children: Category[] }>();
    const rootCategories: (Category & { children: Category[] })[] = [];

    // Initialize all categories with empty children array
    categories.forEach(category => {
      categoryMap.set(category.id, { ...category, children: [] });
    });

    // Build the tree structure
    categories.forEach(category => {
      const categoryWithChildren = categoryMap.get(category.id)!;
      
      if (category.parent_id) {
        const parent = categoryMap.get(category.parent_id);
        if (parent) {
          parent.children.push(categoryWithChildren);
        } else {
          // Parent not found, treat as root
          rootCategories.push(categoryWithChildren);
        }
      } else {
        rootCategories.push(categoryWithChildren);
      }
    });

    return rootCategories;
  };

  const categoryTree = buildCategoryTree(categories);

  const handleCreateCategory = () => {
    setEditingCategory(null);
    setFormData({ name: '', parent_id: '', description: '' });
    setShowForm(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      parent_id: category.parent_id || '',
      description: category.description || '',
    });
    setShowForm(true);
  };

  const handleDeleteCategory = async (category: Category) => {
    if (window.confirm(`Are you sure you want to delete "${category.name}"? This action cannot be undone.`)) {
      try {
        await deleteCategoryMutation.mutateAsync(category.id);
      } catch (error) {
        console.error('Failed to delete category:', error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const data = {
        name: formData.name,
        parent_id: formData.parent_id || undefined,
        description: formData.description || undefined,
      };

      if (editingCategory) {
        await updateCategoryMutation.mutateAsync({
          id: editingCategory.id,
          data,
        });
      } else {
        await createCategoryMutation.mutateAsync(data);
      }

      setShowForm(false);
      setFormData({ name: '', parent_id: '', description: '' });
      setEditingCategory(null);
    } catch (error) {
      console.error('Failed to save category:', error);
    }
  };

  const toggleExpanded = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const renderCategoryTree = (
    categories: (Category & { children: Category[] })[], 
    level = 0
  ) => {
    return categories.map(category => {
      const hasChildren = category.children.length > 0;
      const isExpanded = expandedCategories.has(category.id);
      const indent = level * 24;

      return (
        <div key={category.id} className="space-y-1">
          <div 
            className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 cursor-pointer"
            style={{ paddingLeft: `${12 + indent}px` }}
            onClick={() => onCategorySelect?.(category)}
          >
            <div className="flex items-center gap-2 flex-1">
              {hasChildren ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpanded(category.id);
                  }}
                >
                  {isExpanded ? (
                    <FolderOpen className="h-4 w-4" />
                  ) : (
                    <Folder className="h-4 w-4" />
                  )}
                </Button>
              ) : (
                <div className="w-6 h-6 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                </div>
              )}
              
              <span className="font-medium">{category.name}</span>
              
              {category.description && (
                <span className="text-sm text-muted-foreground truncate">
                  - {category.description}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleEditCategory(category)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-600 hover:text-red-700"
                onClick={() => handleDeleteCategory(category)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {hasChildren && isExpanded && (
            <div>
              {renderCategoryTree(category.children as (Category & { children: Category[] })[], level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading categories...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FolderTree className="h-5 w-5" />
              Category Management
              <Badge variant="secondary">{categories.length} categories</Badge>
            </CardTitle>
            <Button onClick={handleCreateCategory} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Category
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {categoryTree.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No categories found. Create your first category to get started.
            </div>
          ) : (
            <div className="space-y-1">
              {renderCategoryTree(categoryTree)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edit Category' : 'Create New Category'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">Category Name *</Label>
              <Input
                id="category-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Rings, Necklaces, Bracelets"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parent-category">Parent Category</Label>
              <Select
                value={formData.parent_id}
                onValueChange={(value) => 
                  setFormData(prev => ({ ...prev, parent_id: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parent category (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No parent (root category)</SelectItem>
                  {categories
                    .filter(cat => cat.id !== editingCategory?.id) // Don't allow self as parent
                    .map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-description">Description</Label>
              <textarea
                id="category-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Optional description of the category..."
              />
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={
                  createCategoryMutation.isPending || 
                  updateCategoryMutation.isPending
                }
              >
                {createCategoryMutation.isPending || updateCategoryMutation.isPending
                  ? 'Saving...'
                  : editingCategory 
                    ? 'Update Category' 
                    : 'Create Category'
                }
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};