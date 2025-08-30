/**
 * Category Tree Filter Component
 * Hierarchical category selection with tree-style display
 */

import React, { useState, useCallback } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, Hash } from 'lucide-react';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { useLanguage } from '../../hooks/useLanguage';
import { CategoryTreeFilterProps } from '../../types/search';

interface CategoryNode {
  id: string;
  name: string;
  parent_id?: string;
  children: CategoryNode[];
  level: number;
  item_count?: number;
  path: string;
}

export const CategoryTreeFilter: React.FC<CategoryTreeFilterProps> = ({
  categories,
  selectedCategories,
  onCategorySelect,
  multiSelect = true,
  showItemCounts = true,
  expandedCategories = new Set(),
  onToggleExpanded
}) => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [localExpanded, setLocalExpanded] = useState<Set<string>>(new Set(['root']));

  // Use local expanded state if onToggleExpanded is not provided
  const expanded = onToggleExpanded ? expandedCategories : localExpanded;
  const toggleExpanded = onToggleExpanded || ((categoryId: string) => {
    setLocalExpanded(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  });

  // Build category tree from flat array
  const buildCategoryTree = useCallback((categories: any[]): CategoryNode[] => {
    const categoryMap = new Map<string, CategoryNode>();
    const rootCategories: CategoryNode[] = [];

    // First pass: create all nodes
    categories.forEach(category => {
      const node: CategoryNode = {
        id: category.id,
        name: category.name,
        parent_id: category.parent_id,
        children: [],
        level: category.level || 0,
        item_count: category.item_count,
        path: category.path || category.name
      };
      categoryMap.set(category.id, node);
    });

    // Second pass: build tree structure
    categories.forEach(category => {
      const node = categoryMap.get(category.id);
      if (!node) return;

      if (category.parent_id) {
        const parent = categoryMap.get(category.parent_id);
        if (parent) {
          parent.children.push(node);
        }
      } else {
        rootCategories.push(node);
      }
    });

    return rootCategories;
  }, []);

  // Filter categories based on search query
  const filterCategories = useCallback((categories: CategoryNode[], query: string): CategoryNode[] => {
    if (!query) return categories;

    const filtered: CategoryNode[] = [];
    
    const searchInTree = (nodes: CategoryNode[]): CategoryNode[] => {
      const result: CategoryNode[] = [];
      
      for (const node of nodes) {
        const matchesQuery = node.name.toLowerCase().includes(query.toLowerCase());
        const filteredChildren = searchInTree(node.children);
        
        if (matchesQuery || filteredChildren.length > 0) {
          result.push({
            ...node,
            children: filteredChildren
          });
        }
      }
      
      return result;
    };

    return searchInTree(categories);
  }, []);

  // Handle category selection
  const handleCategorySelect = useCallback((categoryId: string) => {
    if (multiSelect) {
      const newSelection = selectedCategories.includes(categoryId)
        ? selectedCategories.filter(id => id !== categoryId)
        : [...selectedCategories, categoryId];
      onCategorySelect(newSelection);
    } else {
      onCategorySelect([categoryId]);
    }
  }, [selectedCategories, onCategorySelect, multiSelect]);

  // Handle select all children
  const handleSelectAllChildren = useCallback((node: CategoryNode) => {
    const getAllChildIds = (node: CategoryNode): string[] => {
      const ids = [node.id];
      node.children.forEach(child => {
        ids.push(...getAllChildIds(child));
      });
      return ids;
    };

    const childIds = getAllChildIds(node);
    const newSelection = Array.from(new Set([...selectedCategories, ...childIds]));
    onCategorySelect(newSelection);
  }, [selectedCategories, onCategorySelect]);

  // Render category node
  const renderCategoryNode = useCallback((node: CategoryNode, depth = 0) => {
    const isSelected = selectedCategories.includes(node.id);
    const isExpanded = expanded.has(node.id);
    const hasChildren = node.children.length > 0;
    const indentLevel = depth * 20;

    return (
      <div key={node.id} className="select-none">
        <div 
          className={`flex items-center space-x-2 py-1 px-2 rounded hover:bg-gray-50 ${
            isSelected ? 'bg-blue-50' : ''
          }`}
          style={{ paddingLeft: `${8 + indentLevel}px` }}
        >
          {/* Expand/Collapse Button */}
          {hasChildren ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => toggleExpanded(node.id)}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          ) : (
            <div className="w-6" />
          )}

          {/* Checkbox */}
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => handleCategorySelect(node.id)}
            className="h-4 w-4"
          />

          {/* Category Icon */}
          <div className="text-gray-400">
            {hasChildren ? (
              isExpanded ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" />
            ) : (
              <Hash className="h-4 w-4" />
            )}
          </div>

          {/* Category Name */}
          <span 
            className={`text-sm flex-1 cursor-pointer ${
              isSelected ? 'font-medium text-blue-700' : 'text-gray-700'
            }`}
            onClick={() => handleCategorySelect(node.id)}
          >
            {node.name}
          </span>

          {/* Item Count */}
          {showItemCounts && node.item_count !== undefined && (
            <Badge variant="secondary" className="text-xs">
              {node.item_count}
            </Badge>
          )}

          {/* Select All Children Button */}
          {hasChildren && multiSelect && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => handleSelectAllChildren(node)}
            >
              {t('search.filters.selectAll')}
            </Button>
          )}
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="ml-2">
            {node.children.map(child => renderCategoryNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  }, [
    selectedCategories, 
    expanded, 
    toggleExpanded, 
    handleCategorySelect, 
    handleSelectAllChildren, 
    showItemCounts, 
    multiSelect,
    t
  ]);

  const categoryTree = buildCategoryTree(categories);
  const filteredTree = filterCategories(categoryTree, searchQuery);

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <Input
        type="text"
        placeholder={t('search.filters.searchCategories')}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="text-sm"
      />

      {/* Selected Categories Summary */}
      {selectedCategories.length > 0 && (
        <div className="text-xs text-gray-600">
          {t('search.filters.selectedCategories', { count: selectedCategories.length })}
          {multiSelect && (
            <Button
              variant="ghost"
              size="sm"
              className="h-5 px-2 ml-2 text-xs"
              onClick={() => onCategorySelect([])}
            >
              {t('search.filters.clearAll')}
            </Button>
          )}
        </div>
      )}

      {/* Category Tree */}
      <div className="max-h-64 overflow-y-auto border rounded-md bg-white">
        {filteredTree.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">
            {searchQuery ? t('search.filters.noCategoriesFound') : t('search.filters.noCategories')}
          </div>
        ) : (
          <div className="p-2">
            {filteredTree.map(node => renderCategoryNode(node))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      {multiSelect && categoryTree.length > 0 && (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => {
              const allIds = categories.map(cat => cat.id);
              onCategorySelect(allIds);
            }}
          >
            {t('search.filters.selectAll')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => onCategorySelect([])}
          >
            {t('search.filters.clearAll')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => {
              const rootIds = categoryTree.map(cat => cat.id);
              onCategorySelect(rootIds);
            }}
          >
            {t('search.filters.selectTopLevel')}
          </Button>
        </div>
      )}
    </div>
  );
};