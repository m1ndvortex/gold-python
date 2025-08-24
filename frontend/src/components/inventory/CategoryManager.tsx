import React, { useState } from 'react';
import { 
  Plus, 
  Settings, 
  FolderTree, 
  FileText,
  Move,
  ToggleLeft,
  ToggleRight,
  ImageIcon
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { CategoryTreeView } from './CategoryTreeView';
import { CategoryForm } from './CategoryForm';
import { CategoryTemplateManager } from './CategoryTemplateManager';
import { CategoryBulkOperations } from './CategoryBulkOperations';
import { CategoryImageManager } from '../image-management/CategoryImageManager';
import { 
  useCategoryTree,
  useCategoryTemplates,
  useEnhancedCreateCategory,
  useEnhancedUpdateCategory,
  useBulkUpdateCategories,
  useCreateCategoryTemplate,
  useCreateCategoryFromTemplate,
  useCategoryDragAndDrop,
  useCategorySelection
} from '../../hooks/useCategoryManagement';
import { useDeleteCategory } from '../../hooks/useInventory';
import type { Category } from '../../types';

interface CategoryManagerProps {
  onCategorySelect?: (category: Category) => void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({ 
  onCategorySelect 
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isDragMode, setIsDragMode] = useState(false);
  const [activeTab, setActiveTab] = useState('tree');

  // Data hooks
  const { data: categoryTree = [], isLoading: isLoadingTree } = useCategoryTree();
  const { data: templates = [], isLoading: isLoadingTemplates } = useCategoryTemplates();

  // Mutation hooks
  const createCategoryMutation = useEnhancedCreateCategory();
  const updateCategoryMutation = useEnhancedUpdateCategory();
  const deleteCategoryMutation = useDeleteCategory();
  const bulkUpdateMutation = useBulkUpdateCategories();
  const createTemplateMutation = useCreateCategoryTemplate();
  const createFromTemplateMutation = useCreateCategoryFromTemplate();

  // Utility hooks
  const { handleDragStart, handleDrop } = useCategoryDragAndDrop();
  const { 
    selectedCategories, 
    setSelectedCategories,
    toggleCategory,
    selectAll,
    clearSelection 
  } = useCategorySelection();

  const handleCreateCategory = (parentId?: string) => {
    setEditingCategory(null);
    setShowForm(true);
  };

  const handleEditCategory = (category: any) => {
    setEditingCategory(category);
    setShowForm(true);
  };

  const handleDeleteCategory = async (category: any) => {
    if (window.confirm(`Are you sure you want to delete "${category.name}"? This action cannot be undone.`)) {
      try {
        await deleteCategoryMutation.mutateAsync(category.id);
      } catch (error) {
        console.error('Failed to delete category:', error);
      }
    }
  };

  const handleCategorySelect = (category: any) => {
    setSelectedCategory(category.id);
    onCategorySelect?.(category);
  };

  const handleToggleExpanded = (categoryId: string) => {
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

  const handleFormSubmit = async (data: any) => {
    try {
      if (editingCategory) {
        await updateCategoryMutation.mutateAsync({
          id: editingCategory.id,
          data,
        });
      } else {
        await createCategoryMutation.mutateAsync(data);
      }
      setShowForm(false);
      setEditingCategory(null);
    } catch (error) {
      console.error('Failed to save category:', error);
      throw error;
    }
  };

  const handleBulkUpdate = async (categoryIds: string[], updates: Record<string, any>) => {
    try {
      await bulkUpdateMutation.mutateAsync({ categoryIds, updates });
      clearSelection();
    } catch (error) {
      console.error('Failed to bulk update categories:', error);
      throw error;
    }
  };

  const handleBulkDelete = async (categoryIds: string[], force?: boolean) => {
    try {
      // For now, delete one by one since we don't have bulk delete endpoint
      for (const categoryId of categoryIds) {
        await deleteCategoryMutation.mutateAsync(categoryId);
      }
      clearSelection();
    } catch (error) {
      console.error('Failed to bulk delete categories:', error);
      throw error;
    }
  };

  const handleBulkMove = async (categoryIds: string[], newParentId?: string) => {
    try {
      await bulkUpdateMutation.mutateAsync({ 
        categoryIds, 
        updates: { parent_id: newParentId } 
      });
      clearSelection();
    } catch (error) {
      console.error('Failed to bulk move categories:', error);
      throw error;
    }
  };

  const handleCreateTemplate = async (data: any) => {
    try {
      await createTemplateMutation.mutateAsync(data);
    } catch (error) {
      console.error('Failed to create template:', error);
      throw error;
    }
  };

  const handleDuplicateTemplate = async (template: any) => {
    try {
      const duplicateData = {
        name: `${template.name} (Copy)`,
        description: template.description,
        template_data: template.template_data
      };
      await createTemplateMutation.mutateAsync(duplicateData);
    } catch (error) {
      console.error('Failed to duplicate template:', error);
      throw error;
    }
  };

  const handleDragOver = (e: React.DragEvent, category: any) => {
    e.preventDefault();
  };

  const handleDropCategory = async (e: React.DragEvent, targetCategory: any) => {
    e.preventDefault();
    const draggedCategoryId = e.dataTransfer.getData('text/plain');
    
    if (draggedCategoryId && draggedCategoryId !== targetCategory.id) {
      try {
        const dragData = { categoryId: draggedCategoryId };
        await handleDrop(dragData, targetCategory);
      } catch (error) {
        console.error('Failed to drop category:', error);
      }
    }
  };

  const isLoading = isLoadingTree || isLoadingTemplates;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading category management...</div>
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
              Advanced Category Management
              <Badge variant="secondary">{categoryTree.length} categories</Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDragMode(!isDragMode)}
                className="flex items-center gap-2"
              >
                {isDragMode ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                {isDragMode ? 'Exit Drag Mode' : 'Drag Mode'}
              </Button>
              <Button onClick={() => handleCreateCategory()} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Category
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="tree" className="flex items-center gap-2">
                <FolderTree className="h-4 w-4" />
                Category Tree
              </TabsTrigger>
              <TabsTrigger value="images" className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Images
              </TabsTrigger>
              <TabsTrigger value="templates" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Templates
              </TabsTrigger>
              <TabsTrigger value="bulk" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Bulk Operations
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tree" className="mt-4">
              <CategoryTreeView
                categories={categoryTree}
                selectedCategory={selectedCategory}
                expandedCategories={expandedCategories}
                onCategorySelect={handleCategorySelect}
                onCategoryEdit={handleEditCategory}
                onCategoryDelete={handleDeleteCategory}
                onCategoryAdd={handleCreateCategory}
                onToggleExpanded={handleToggleExpanded}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDropCategory}
                isDragMode={isDragMode}
              />
            </TabsContent>

            <TabsContent value="images" className="mt-4">
              {selectedCategory ? (
                <CategoryImageManager
                  categoryId={selectedCategory}
                  categoryName={categoryTree.find(c => c.id === selectedCategory)?.name || 'Category'}
                />
              ) : (
                <div className="text-center py-12">
                  <ImageIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Select a Category</h3>
                  <p className="text-muted-foreground">
                    Choose a category from the tree to manage its images and icons.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="templates" className="mt-4">
              <CategoryTemplateManager
                templates={templates}
                onCreateTemplate={handleCreateTemplate}
                onUpdateTemplate={async (id, data) => {
                  // Template update would need its own endpoint
                  console.log('Update template:', id, data);
                }}
                onDeleteTemplate={async (id) => {
                  // Template delete would need its own endpoint
                  console.log('Delete template:', id);
                }}
                onDuplicateTemplate={handleDuplicateTemplate}
                isLoading={createTemplateMutation.isPending}
              />
            </TabsContent>

            <TabsContent value="bulk" className="mt-4">
              <CategoryBulkOperations
                categories={categoryTree}
                selectedCategories={selectedCategories}
                onSelectionChange={setSelectedCategories}
                onBulkUpdate={handleBulkUpdate}
                onBulkDelete={handleBulkDelete}
                onBulkMove={handleBulkMove}
                isLoading={bulkUpdateMutation.isPending}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Category Form Dialog */}
      <CategoryForm
        category={editingCategory || undefined}
        parentCategories={categoryTree}
        templates={templates}
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingCategory(null);
        }}
        onSubmit={handleFormSubmit}
        isLoading={createCategoryMutation.isPending || updateCategoryMutation.isPending}
      />
    </>
  );
};