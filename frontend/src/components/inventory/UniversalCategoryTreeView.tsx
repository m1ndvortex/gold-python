/**
 * Universal Category Tree View Component
 * Tree-style display with drag-and-drop organization for unlimited nested categories
 */

import React, { useState, useCallback, useMemo } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  Folder, 
  FolderOpen, 
  Plus, 
  Edit, 
  Trash2, 
  Move, 
  Image as ImageIcon,
  Tag,
  MoreHorizontal,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '../ui/dropdown-menu';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../hooks/useLanguage';
import type { 
  UniversalCategoryWithChildren,
  CategoryTreeProps 
} from '../../types/universalInventory';

interface UniversalCategoryTreeViewProps {
  categories: UniversalCategoryWithChildren[];
  selectedCategory?: string;
  expandedCategories?: Set<string>;
  onCategorySelect?: (category: UniversalCategoryWithChildren) => void;
  onCategoryEdit?: (category: UniversalCategoryWithChildren) => void;
  onCategoryDelete?: (category: UniversalCategoryWithChildren) => void;
  onCategoryAdd?: (parentId?: string) => void;
  onToggleExpanded?: (categoryId: string) => void;
  onDragStart?: (category: UniversalCategoryWithChildren) => void;
  onDragOver?: (e: React.DragEvent, category: UniversalCategoryWithChildren) => void;
  onDrop?: (e: React.DragEvent, targetCategory: UniversalCategoryWithChildren) => void;
  dragEnabled?: boolean;
  showStats?: boolean;
  showImages?: boolean;
  maxDepth?: number;
  className?: string;
}

interface CategoryNodeProps {
  category: UniversalCategoryWithChildren;
  level: number;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: (category: UniversalCategoryWithChildren) => void;
  onEdit: (category: UniversalCategoryWithChildren) => void;
  onDelete: (category: UniversalCategoryWithChildren) => void;
  onAdd: (parentId: string) => void;
  onToggleExpanded: (categoryId: string) => void;
  onDragStart?: (category: UniversalCategoryWithChildren) => void;
  onDragOver?: (e: React.DragEvent, category: UniversalCategoryWithChildren) => void;
  onDrop?: (e: React.DragEvent, category: UniversalCategoryWithChildren) => void;
  dragEnabled: boolean;
  showStats: boolean;
  showImages: boolean;
  maxDepth?: number;
}

const CategoryNode: React.FC<CategoryNodeProps> = ({
  category,
  level,
  isSelected,
  isExpanded,
  onSelect,
  onEdit,
  onDelete,
  onAdd,
  onToggleExpanded,
  onDragStart,
  onDragOver,
  onDrop,
  dragEnabled,
  showStats,
  showImages,
  maxDepth
}) => {
  const { t } = useLanguage();
  const [isDragOver, setIsDragOver] = useState(false);
  const hasChildren = category.children && category.children.length > 0;
  const canExpand = hasChildren && (!maxDepth || level < maxDepth);
  const indent = level * 20;

  const handleDragStart = useCallback((e: React.DragEvent) => {
    if (!dragEnabled || !onDragStart) return;
    
    e.dataTransfer.setData('text/plain', category.id);
    e.dataTransfer.effectAllowed = 'move';
    onDragStart(category);
  }, [dragEnabled, onDragStart, category]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (!dragEnabled || !onDragOver) return;
    
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
    onDragOver(e, category);
  }, [dragEnabled, onDragOver, category]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!dragEnabled) return;
    
    // Only set isDragOver to false if we're actually leaving the element
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragOver(false);
    }
  }, [dragEnabled]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    if (!dragEnabled || !onDrop) return;
    
    e.preventDefault();
    setIsDragOver(false);
    onDrop(e, category);
  }, [dragEnabled, onDrop, category]);

  const getCategoryIcon = () => {
    if (category.icon) {
      return <span className="text-sm">{category.icon}</span>;
    }
    
    if (hasChildren) {
      return isExpanded ? (
        <FolderOpen className="h-4 w-4" style={{ color: category.color }} />
      ) : (
        <Folder className="h-4 w-4" style={{ color: category.color }} />
      );
    }
    
    return <Folder className="h-4 w-4" style={{ color: category.color }} />;
  };

  const getStatsDisplay = () => {
    if (!showStats) return null;
    
    const stats = [];
    
    if ('item_count' in category && category.item_count !== undefined) {
      stats.push(
        <Badge key="items" variant="secondary" className="text-xs">
          {category.item_count} {t('inventory.items')}
        </Badge>
      );
    }
    
    if ('total_value' in category && category.total_value !== undefined) {
      stats.push(
        <Badge key="value" variant="outline" className="text-xs">
          ${category.total_value.toFixed(2)}
        </Badge>
      );
    }
    
    return stats.length > 0 ? <div className="flex gap-1">{stats}</div> : null;
  };

  return (
    <div className="select-none">
      <div
        className={cn(
          "flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors",
          isSelected && "bg-primary/10 border border-primary/20",
          isDragOver && "bg-blue-50 border-2 border-blue-300",
          !category.is_active && "opacity-50"
        )}
        style={{ paddingLeft: `${8 + indent}px` }}
        draggable={dragEnabled}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => onSelect(category)}
      >
        {/* Expand/Collapse Button */}
        <div className="flex-shrink-0 w-4 h-4">
          {canExpand ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 p-0 hover:bg-transparent"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpanded(category.id);
              }}
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
          ) : (
            <div className="w-4 h-4" />
          )}
        </div>

        {/* Category Icon */}
        <div className="flex-shrink-0">
          {getCategoryIcon()}
        </div>

        {/* Category Image */}
        {showImages && category.image_id && (
          <div className="flex-shrink-0">
            <img
              src={`/api/images/${category.image_id}`}
              alt={category.name}
              className="w-6 h-6 rounded object-cover"
            />
          </div>
        )}

        {/* Category Name and Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">
              {category.name}
            </span>
            {category.name_persian && (
              <span className="text-xs text-muted-foreground truncate">
                ({category.name_persian})
              </span>
            )}
            {!category.is_active && (
              <EyeOff className="h-3 w-3 text-muted-foreground" />
            )}
          </div>
          
          {category.description && (
            <div className="text-xs text-muted-foreground truncate mt-1">
              {category.description}
            </div>
          )}
        </div>

        {/* Stats */}
        {getStatsDisplay()}

        {/* Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => onAdd(category.id)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('inventory.add_subcategory')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(category)}>
              <Edit className="h-4 w-4 mr-2" />
              {t('inventory.edit_category')}
            </DropdownMenuItem>
            {showImages && (
              <DropdownMenuItem>
                <ImageIcon className="h-4 w-4 mr-2" />
                {t('inventory.manage_images')}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => onDelete(category)}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t('inventory.delete_category')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Children */}
      {canExpand && isExpanded && hasChildren && (
        <div className="ml-2">
          {category.children.map((child) => (
            <CategoryNode
              key={child.id}
              category={child}
              level={level + 1}
              isSelected={child.id === category.id}
              isExpanded={false} // This would need to be managed by parent
              onSelect={onSelect}
              onEdit={onEdit}
              onDelete={onDelete}
              onAdd={onAdd}
              onToggleExpanded={onToggleExpanded}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDrop={onDrop}
              dragEnabled={dragEnabled}
              showStats={showStats}
              showImages={showImages}
              maxDepth={maxDepth}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const UniversalCategoryTreeView: React.FC<UniversalCategoryTreeViewProps> = ({
  categories,
  selectedCategory,
  expandedCategories = new Set(),
  onCategorySelect,
  onCategoryEdit,
  onCategoryDelete,
  onCategoryAdd,
  onToggleExpanded,
  onDragStart,
  onDragOver,
  onDrop,
  dragEnabled = false,
  showStats = true,
  showImages = false,
  maxDepth,
  className
}) => {
  const { t } = useLanguage();

  const handleSelect = useCallback((category: UniversalCategoryWithChildren) => {
    onCategorySelect?.(category);
  }, [onCategorySelect]);

  const handleEdit = useCallback((category: UniversalCategoryWithChildren) => {
    onCategoryEdit?.(category);
  }, [onCategoryEdit]);

  const handleDelete = useCallback((category: UniversalCategoryWithChildren) => {
    onCategoryDelete?.(category);
  }, [onCategoryDelete]);

  const handleAdd = useCallback((parentId?: string) => {
    onCategoryAdd?.(parentId);
  }, [onCategoryAdd]);

  const handleToggleExpanded = useCallback((categoryId: string) => {
    onToggleExpanded?.(categoryId);
  }, [onToggleExpanded]);

  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => {
      // Sort by sort_order first, then by name
      if (a.sort_order !== b.sort_order) {
        return a.sort_order - b.sort_order;
      }
      return a.name.localeCompare(b.name);
    });
  }, [categories]);

  if (categories.length === 0) {
    return (
      <div className={cn("text-center py-12", className)}>
        <Folder className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">
          {t('inventory.no_categories')}
        </h3>
        <p className="text-muted-foreground mb-4">
          {t('inventory.create_first_category')}
        </p>
        <Button onClick={() => handleAdd()} variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          {t('inventory.add_category')}
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-1", className)}>
      {sortedCategories.map((category) => (
        <CategoryNode
          key={category.id}
          category={category}
          level={0}
          isSelected={category.id === selectedCategory}
          isExpanded={expandedCategories.has(category.id)}
          onSelect={handleSelect}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAdd={handleAdd}
          onToggleExpanded={handleToggleExpanded}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDrop={onDrop}
          dragEnabled={dragEnabled}
          showStats={showStats}
          showImages={showImages}
          maxDepth={maxDepth}
        />
      ))}
    </div>
  );
};