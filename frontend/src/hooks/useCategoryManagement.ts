import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { categoriesApi } from '../services/inventoryApi';
import type { Category } from '../types';

// Enhanced category API functions
const enhancedCategoriesApi = {
  ...categoriesApi,
  
  getCategoryTree: async (): Promise<any[]> => {
    const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/inventory/categories/tree`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch category tree');
    }
    
    return response.json();
  },

  bulkUpdateCategories: async (categoryIds: string[], updates: Record<string, any>) => {
    const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/inventory/categories/bulk-update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
      body: JSON.stringify({
        category_ids: categoryIds,
        updates
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to bulk update categories');
    }
    
    return response.json();
  },

  reorderCategory: async (categoryId: string, newParentId?: string, newSortOrder?: number) => {
    const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/inventory/categories/reorder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
      body: JSON.stringify({
        category_id: categoryId,
        new_parent_id: newParentId,
        new_sort_order: newSortOrder
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to reorder category');
    }
    
    return response.json();
  },

  // Category Templates
  getCategoryTemplates: async () => {
    const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/inventory/category-templates`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch category templates');
    }
    
    return response.json();
  },

  createCategoryTemplate: async (data: any) => {
    const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/inventory/category-templates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create category template');
    }
    
    return response.json();
  },

  createCategoryFromTemplate: async (templateId: string, categoryData: any) => {
    const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/inventory/categories/from-template/${templateId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
      body: JSON.stringify(categoryData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create category from template');
    }
    
    return response.json();
  }
};

// Enhanced category management hooks
export const useCategoryTree = () => {
  return useQuery({
    queryKey: ['categories', 'tree'],
    queryFn: enhancedCategoriesApi.getCategoryTree,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCategoryTemplates = () => {
  return useQuery({
    queryKey: ['category-templates'],
    queryFn: enhancedCategoriesApi.getCategoryTemplates,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useCreateCategoryTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: enhancedCategoriesApi.createCategoryTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-templates'] });
    },
  });
};

export const useCreateCategoryFromTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ templateId, categoryData }: { templateId: string; categoryData: any }) =>
      enhancedCategoriesApi.createCategoryFromTemplate(templateId, categoryData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories', 'tree'] });
    },
  });
};

export const useBulkUpdateCategories = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ categoryIds, updates }: { categoryIds: string[]; updates: Record<string, any> }) =>
      enhancedCategoriesApi.bulkUpdateCategories(categoryIds, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories', 'tree'] });
    },
  });
};

export const useReorderCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ categoryId, newParentId, newSortOrder }: { 
      categoryId: string; 
      newParentId?: string; 
      newSortOrder?: number; 
    }) => enhancedCategoriesApi.reorderCategory(categoryId, newParentId, newSortOrder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories', 'tree'] });
    },
  });
};

// Enhanced category CRUD hooks with new features
export const useEnhancedCreateCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => {
      // Convert attributes array to proper format if needed
      if (data.attributes && Array.isArray(data.attributes)) {
        data.attributes = data.attributes.map((attr: any) => ({
          ...attr,
          id: attr.id || `attr_${Date.now()}_${Math.random()}`
        }));
      }
      
      return categoriesApi.createCategory(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories', 'tree'] });
    },
  });
};

export const useEnhancedUpdateCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => {
      // Convert attributes array to proper format if needed
      if (data.attributes && Array.isArray(data.attributes)) {
        data.attributes = data.attributes.map((attr: any) => ({
          ...attr,
          id: attr.id || `attr_${Date.now()}_${Math.random()}`
        }));
      }
      
      return categoriesApi.updateCategory(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories', 'tree'] });
    },
  });
};

// Utility hooks for category management
export const useCategoryDragAndDrop = () => {
  const reorderMutation = useReorderCategory();
  
  const handleDragStart = (category: any) => {
    // Store drag data
    return {
      categoryId: category.id,
      originalParentId: category.parent_id,
      originalSortOrder: category.sort_order
    };
  };

  const handleDrop = async (
    dragData: any, 
    targetCategory: any, 
    position: 'before' | 'after' | 'inside' = 'inside'
  ) => {
    let newParentId = targetCategory.parent_id;
    let newSortOrder = targetCategory.sort_order;

    if (position === 'inside') {
      newParentId = targetCategory.id;
      newSortOrder = 0; // First child
    } else if (position === 'after') {
      newSortOrder = targetCategory.sort_order + 1;
    } else if (position === 'before') {
      newSortOrder = Math.max(0, targetCategory.sort_order - 1);
    }

    try {
      await reorderMutation.mutateAsync({
        categoryId: dragData.categoryId,
        newParentId,
        newSortOrder
      });
    } catch (error) {
      console.error('Failed to reorder category:', error);
      throw error;
    }
  };

  return {
    handleDragStart,
    handleDrop,
    isLoading: reorderMutation.isPending
  };
};

export const useCategorySelection = (initialSelection: Set<string> = new Set()) => {
  const [selectedCategories, setSelectedCategories] = React.useState<Set<string>>(initialSelection);

  const selectCategory = (categoryId: string) => {
    setSelectedCategories(prev => new Set(Array.from(prev).concat(categoryId)));
  };

  const deselectCategory = (categoryId: string) => {
    setSelectedCategories(prev => {
      const newSet = new Set(prev);
      newSet.delete(categoryId);
      return newSet;
    });
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const selectAll = (categoryIds: string[]) => {
    setSelectedCategories(new Set(categoryIds));
  };

  const clearSelection = () => {
    setSelectedCategories(new Set());
  };

  return {
    selectedCategories,
    selectCategory,
    deselectCategory,
    toggleCategory,
    selectAll,
    clearSelection,
    setSelectedCategories
  };
};