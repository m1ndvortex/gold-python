import React, { useState, useCallback } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  Folder, 
  FolderOpen, 
  Plus, 
  Edit, 
  Trash2, 
  GripVertical,
  Package,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';
import type { Category } from '../../types';

interface CategoryNode extends Category {
  children: CategoryNode[];
  product_count?: number;
  icon?: string;
}

interface CategoryTreeViewProps {
  categories: CategoryNode[];
  selectedCategory?: string;
  expandedCategories: Set<string>;
  onCategorySelect: (category: CategoryNode) => void;
  onCategoryEdit: (category: CategoryNode) => void;
  onCategoryDelete: (category: CategoryNode) => void;
  onCategoryAdd: (parentId?: string) => void;
  onToggleExpanded: (categoryId: string) => void;
  onDragStart?: (category: CategoryNode) => void;
  onDragOver?: (e: React.DragEvent, category: CategoryNode) => void;
  onDrop?: (e: React.DragEvent, targetCategory: CategoryNode) => void;
  isDragMode?: boolean;
  className?: string;
}

interface CategoryItemProps {
  category: CategoryNode;
  level: number;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: (category: CategoryNode) => void;
  onEdit: (category: CategoryNode) => void;
  onDelete: (category: CategoryNode) => void;
  onAddChild: (parentId: string) => void;
  onToggleExpanded: (categoryId: string) => void;
  onDragStart?: (category: CategoryNode) => void;
  onDragOver?: (e: React.DragEvent, category: CategoryNode) => void;
  onDrop?: (e: React.DragEvent, targetCategory: CategoryNode) => void;
  isDragMode?: boolean;
}

const CategoryItem: React.FC<CategoryItemProps> = ({
  category,
  level,
  isSelected,
  isExpanded,
  onSelect,
  onEdit,
  onDelete,
  onAddChild,
  onToggleExpanded,
  onDragStart,
  onDragOver,
  onDrop,
  isDragMode = false
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const hasChildren = category.children && category.children.length > 0;
  const indent = level * 24;

  const handleDragStart = (e: React.DragEvent) => {
    if (onDragStart) {
      onDragStart(category);
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', category.id);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
    if (onDragOver) {
      onDragOver(e, category);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (onDrop) {
      onDrop(e, category);
    }
  };

  return (
    <div className="space-y-1">
      <div
        className={cn(
          "group flex items-center justify-between rounded-md transition-colors",
          "hover:bg-muted/50 cursor-pointer",
          isSelected && "bg-primary/10 border border-primary/20",
          isDragOver && "bg-primary/20 border-2 border-primary border-dashed",
          !category.is_active && "opacity-50"
        )}
        style={{ paddingLeft: `${12 + indent}px` }}
        onClick={() => onSelect(category)}
        draggable={isDragMode}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex items-center gap-2 flex-1 py-2 pr-2">
          {isDragMode && (
            <GripVertical 
              className="h-4 w-4 text-muted-foreground cursor-grab" 
              data-testid="drag-handle"
            />
          )}
          
          {hasChildren ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpanded(category.id);
              }}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          ) : (
            <div className="w-6 h-6 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
            </div>
          )}

          {/* Category Icon */}
          <div className="flex items-center justify-center w-6 h-6">
            {category.icon ? (
              <span className="text-sm">{category.icon}</span>
            ) : hasChildren ? (
              isExpanded ? (
                <FolderOpen className="h-4 w-4 text-amber-600" />
              ) : (
                <Folder className="h-4 w-4 text-amber-600" />
              )
            ) : (
              <Package className="h-4 w-4 text-blue-600" />
            )}
          </div>

          {/* Category Name */}
          <span 
            className="font-medium flex-1 truncate"
            style={{ color: category.color || 'inherit' }}
          >
            {category.name}
          </span>

          {/* Product Count Badge */}
          {typeof category.product_count === 'number' && (
            <Badge variant="secondary" className="text-xs">
              {category.product_count}
            </Badge>
          )}

          {/* Active Status */}
          {!category.is_active && (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          )}
        </div>

        {/* Action Buttons */}
        <div 
          className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onAddChild(category.id)}
            title="Add subcategory"
          >
            <Plus className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onEdit(category)}
            title="Edit category"
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-red-600 hover:text-red-700"
            onClick={() => onDelete(category)}
            title="Delete category"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="space-y-1">
          {category.children.map((child) => (
            <CategoryItem
              key={child.id}
              category={child}
              level={level + 1}
              isSelected={isSelected}
              isExpanded={isExpanded}
              onSelect={onSelect}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              onToggleExpanded={onToggleExpanded}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDrop={onDrop}
              isDragMode={isDragMode}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const CategoryTreeView: React.FC<CategoryTreeViewProps> = ({
  categories,
  selectedCategory,
  expandedCategories,
  onCategorySelect,
  onCategoryEdit,
  onCategoryDelete,
  onCategoryAdd,
  onToggleExpanded,
  onDragStart,
  onDragOver,
  onDrop,
  isDragMode = false,
  className
}) => {
  const renderCategory = useCallback((category: CategoryNode, level = 0) => {
    const isSelected = selectedCategory === category.id;
    const isExpanded = expandedCategories.has(category.id);

    return (
      <CategoryItem
        key={category.id}
        category={category}
        level={level}
        isSelected={isSelected}
        isExpanded={isExpanded}
        onSelect={onCategorySelect}
        onEdit={onCategoryEdit}
        onDelete={onCategoryDelete}
        onAddChild={onCategoryAdd}
        onToggleExpanded={onToggleExpanded}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
        isDragMode={isDragMode}
      />
    );
  }, [
    selectedCategory,
    expandedCategories,
    onCategorySelect,
    onCategoryEdit,
    onCategoryDelete,
    onCategoryAdd,
    onToggleExpanded,
    onDragStart,
    onDragOver,
    onDrop,
    isDragMode
  ]);

  if (categories.length === 0) {
    return (
      <div className={cn("text-center py-8 text-muted-foreground", className)}>
        <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium mb-2">No categories found</p>
        <p className="text-sm mb-4">Create your first category to organize your inventory</p>
        <Button onClick={() => onCategoryAdd()}>
          <Plus className="h-4 w-4 mr-2" />
          Create Category
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-1", className)}>
      {categories.map((category) => renderCategory(category))}
    </div>
  );
};