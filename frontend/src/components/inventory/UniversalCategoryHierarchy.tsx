import React, { useState, useMemo } from 'react';
import { 
  FolderTree, 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Edit, 
  Trash2, 
  Move, 
  Eye,
  EyeOff,
  MoreHorizontal,
  Package,
  Tag,
  Palette,
  Settings,
  Copy,
  Archive
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { 
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '../ui/context-menu';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../hooks/useLanguage';
import type { CategoryWithStats } from '../../types/universalInventory';

interface UniversalCategoryHierarchyProps {
  categories: CategoryWithStats[];
  selectedCategories?: string[];
  expandedCategories?: Set<string>;
  onCategorySelect?: (category: CategoryWithStats) => void;
  onCategoryEdit?: (category: CategoryWithStats) => void;
  onCategoryDelete?: (category: CategoryWithStats) => void;
  onCategoryAdd?: (parentId?: string) => void;
  onCategoryMove?: (categoryId: string, newParentId?: string) => void;
  onCategoryToggleActive?: (category: CategoryWithStats) => void;
  onToggleExpanded?: (categoryId: string) => void;
  onSelectionChange?: (selectedIds: string[]) => void;
  isDragMode?: boolean;
  showStats?: boolean;
  showActions?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  className?: string;
}

interface CategoryNodeProps {
  category: CategoryWithStats;
  level: number;
  isSelected: boolean;
  isExpanded: boolean;
  isSelectable: boolean;
  showStats: boolean;
  showActions: boolean;
  isDragMode: boolean;
  onSelect: (category: CategoryWithStats) => void;
  onEdit: (category: CategoryWithStats) => void;
  onDelete: (category: CategoryWithStats) => void;
  onAdd: (parentId: string) => void;
  onMove: (categoryId: string, newParentId?: string) => void;
  onToggleActive: (category: CategoryWithStats) => void;
  onToggleExpanded: (categoryId: string) => void;
  onSelectionToggle: (categoryId: string) => void;
  onDragStart: (e: React.DragEvent, category: CategoryWithStats) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetCategory: CategoryWithStats) => void;
}

const CategoryNode: React.FC<CategoryNodeProps> = ({
  category,
  level,
  isSelected,
  isExpanded,
  isSelectable,
  showStats,
  showActions,
  isDragMode,
  onSelect,
  onEdit,
  onDelete,
  onAdd,
  onMove,
  onToggleActive,
  onToggleExpanded,
  onSelectionToggle,
  onDragStart,
  onDragOver,
  onDrop,
}) => {
  const { t } = useLanguage();
  const [isDragOver, setIsDragOver] = useState(false);
  
  const hasChildren = category.children && category.children.length > 0;
  const indent = level * 20;

  const handleDragStart = (e: React.DragEvent) => {
    if (isDragMode) {
      onDragStart(e, category);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (isDragMode) {
      e.preventDefault();
      setIsDragOver(true);
      onDragOver(e);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (isDragMode) {
      e.preventDefault();
      setIsDragOver(false);
      onDrop(e, category);
    }
  };

  const getStockStatusColor = (category: CategoryWithStats) => {
    if (category.product_count === 0) return 'text-muted-foreground';
    const lowStockRatio = 0.2; // 20% threshold
    const avgStock = category.total_stock / category.product_count;
    if (avgStock < lowStockRatio) return 'text-red-600';
    if (avgStock < 0.5) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="space-y-1">
      <ContextMenu>
        <ContextMenuTrigger>
          <div
            className={cn(
              "group flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-all duration-200",
              isSelected && "bg-primary/10 border border-primary/20",
              isDragOver && "bg-blue-50 border-2 border-blue-300",
              !category.is_active && "opacity-60"
            )}
            style={{ paddingLeft: `${8 + indent}px` }}
            draggable={isDragMode}
            onDragStart={isDragMode ? handleDragStart : undefined}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => onSelect(category)}
          >
            {/* Expand/Collapse Button */}
            {hasChildren ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 p-0 hover:bg-muted"
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
              <div className="w-5 h-5" />
            )}

            {/* Selection Checkbox */}
            {isSelectable && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onSelectionToggle(category.id)}
                onClick={(e) => e.stopPropagation()}
              />
            )}

            {/* Category Icon */}
            <div 
              className={cn(
                "h-6 w-6 rounded-md flex items-center justify-center text-white text-xs font-medium shadow-sm",
                category.color ? `bg-[${category.color}]` : "bg-gradient-to-br from-blue-500 to-blue-600"
              )}
              style={{ backgroundColor: category.color || undefined }}
            >
              {category.icon ? (
                <span>{category.icon}</span>
              ) : (
                <FolderTree className="h-3 w-3" />
              )}
            </div>

            {/* Category Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "font-medium truncate",
                  !category.is_active && "line-through"
                )}>
                  {category.name}
                </span>
                
                {!category.is_active && (
                  <Badge variant="secondary" className="text-xs">
                    Inactive
                  </Badge>
                )}

                {category.business_type && (
                  <Badge variant="outline" className="text-xs">
                    {category.business_type}
                  </Badge>
                )}
              </div>

              {category.description && (
                <p className="text-xs text-muted-foreground truncate mt-1">
                  {category.description}
                </p>
              )}
            </div>

            {/* Stats */}
            {showStats && (
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1">
                  <Package className="h-3 w-3 text-muted-foreground" />
                  <span className="font-mono">{category.product_count}</span>
                </div>
                
                {category.total_stock > 0 && (
                  <div className={cn("flex items-center gap-1", getStockStatusColor(category))}>
                    <span className="font-mono">{category.total_stock.toFixed(0)}</span>
                  </div>
                )}

                {category.total_value > 0 && (
                  <div className="flex items-center gap-1 text-green-600">
                    <span className="font-mono">${category.total_value.toFixed(0)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            {showActions && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAdd(category.id);
                  }}
                >
                  <Plus className="h-3 w-3" />
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(category)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onAdd(category.id)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Subcategory
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onToggleActive(category)}>
                      {category.is_active ? (
                        <>
                          <EyeOff className="h-4 w-4 mr-2" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-2" />
                          Activate
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => onDelete(category)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </ContextMenuTrigger>
        
        <ContextMenuContent>
          <ContextMenuItem onClick={() => onEdit(category)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Category
          </ContextMenuItem>
          <ContextMenuItem onClick={() => onAdd(category.id)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Subcategory
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem>
            <Copy className="h-4 w-4 mr-2" />
            Duplicate
          </ContextMenuItem>
          <ContextMenuItem>
            <Move className="h-4 w-4 mr-2" />
            Move
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => onToggleActive(category)}>
            {category.is_active ? (
              <>
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Restore
              </>
            )}
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem 
            onClick={() => onDelete(category)}
            className="text-red-600"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {/* Children */}
      <AnimatePresence>
        {hasChildren && isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-1"
          >
            {category.children.map((child) => (
              <CategoryNode
                key={child.id}
                category={child}
                level={level + 1}
                isSelected={false} // This would come from props
                isExpanded={false} // This would come from props
                isSelectable={isSelectable}
                showStats={showStats}
                showActions={showActions}
                isDragMode={isDragMode}
                onSelect={onSelect}
                onEdit={onEdit}
                onDelete={onDelete}
                onAdd={onAdd}
                onMove={onMove}
                onToggleActive={onToggleActive}
                onToggleExpanded={onToggleExpanded}
                onSelectionToggle={onSelectionToggle}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDrop={onDrop}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const UniversalCategoryHierarchy: React.FC<UniversalCategoryHierarchyProps> = ({
  categories,
  selectedCategories = [],
  expandedCategories = new Set(),
  onCategorySelect,
  onCategoryEdit,
  onCategoryDelete,
  onCategoryAdd,
  onCategoryMove,
  onCategoryToggleActive,
  onToggleExpanded,
  onSelectionChange,
  isDragMode = false,
  showStats = true,
  showActions = true,
  searchQuery = '',
  onSearchChange,
  className
}) => {
  const { t } = useLanguage();
  const [draggedCategory, setDraggedCategory] = useState<CategoryWithStats | null>(null);

  // Filter categories based on search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;

    const filterRecursive = (cats: CategoryWithStats[]): CategoryWithStats[] => {
      return cats.reduce((acc, category) => {
        const matchesSearch = category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            category.description?.toLowerCase().includes(searchQuery.toLowerCase());
        
        const filteredChildren = filterRecursive(category.children);
        
        if (matchesSearch || filteredChildren.length > 0) {
          acc.push({
            ...category,
            children: filteredChildren
          });
        }
        
        return acc;
      }, [] as CategoryWithStats[]);
    };

    return filterRecursive(categories);
  }, [categories, searchQuery]);

  // Calculate total stats
  const totalStats = useMemo(() => {
    const calculateStats = (cats: CategoryWithStats[]): { products: number; value: number; stock: number } => {
      return cats.reduce((acc, cat) => {
        acc.products += cat.product_count;
        acc.value += cat.total_value;
        acc.stock += cat.total_stock;
        
        const childStats = calculateStats(cat.children);
        acc.products += childStats.products;
        acc.value += childStats.value;
        acc.stock += childStats.stock;
        
        return acc;
      }, { products: 0, value: 0, stock: 0 });
    };

    return calculateStats(categories);
  }, [categories]);

  const handleDragStart = (e: React.DragEvent, category: CategoryWithStats) => {
    setDraggedCategory(category);
    e.dataTransfer.setData('text/plain', category.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetCategory: CategoryWithStats) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    
    if (draggedId && draggedId !== targetCategory.id && onCategoryMove) {
      // Prevent dropping a category into its own descendant
      const isDescendant = (parent: CategoryWithStats, childId: string): boolean => {
        return parent.children.some(child => 
          child.id === childId || isDescendant(child, childId)
        );
      };

      if (!isDescendant(targetCategory, draggedId)) {
        onCategoryMove(draggedId, targetCategory.id);
      }
    }
    
    setDraggedCategory(null);
  };

  const handleSelectionToggle = (categoryId: string) => {
    if (!onSelectionChange) return;

    const newSelection = selectedCategories.includes(categoryId)
      ? selectedCategories.filter(id => id !== categoryId)
      : [...selectedCategories, categoryId];
    
    onSelectionChange(newSelection);
  };

  const isSelectable = !!onSelectionChange;

  if (filteredCategories.length === 0) {
    return (
      <Card variant="professional" className={className}>
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg mx-auto">
              <FolderTree className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">
                {searchQuery ? 'No categories found' : 'No categories yet'}
              </h3>
              <p className="text-muted-foreground">
                {searchQuery 
                  ? `No categories match "${searchQuery}"`
                  : 'Create your first category to organize your inventory'
                }
              </p>
            </div>
            {!searchQuery && onCategoryAdd && (
              <Button variant="gradient-blue" onClick={() => onCategoryAdd()}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Category
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="gradient-blue" className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
              <FolderTree className="h-4 w-4 text-white" />
            </div>
            Category Hierarchy
            <Badge variant="secondary">{categories.length} categories</Badge>
          </CardTitle>

          {showStats && (
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono">{totalStats.products}</span>
                <span className="text-muted-foreground">products</span>
              </div>
              <div className="flex items-center gap-1 text-green-600">
                <span className="font-mono">${totalStats.value.toFixed(0)}</span>
                <span className="text-muted-foreground">value</span>
              </div>
            </div>
          )}
        </div>

        {onSearchChange && (
          <div className="relative">
            <Input
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
            <FolderTree className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div className="space-y-1 max-h-[600px] overflow-y-auto">
          {filteredCategories.map((category) => (
            <CategoryNode
              key={category.id}
              category={category}
              level={0}
              isSelected={selectedCategories.includes(category.id)}
              isExpanded={expandedCategories.has(category.id)}
              isSelectable={isSelectable}
              showStats={showStats}
              showActions={showActions}
              isDragMode={isDragMode}
              onSelect={onCategorySelect || (() => {})}
              onEdit={onCategoryEdit || (() => {})}
              onDelete={onCategoryDelete || (() => {})}
              onAdd={onCategoryAdd || (() => {})}
              onMove={onCategoryMove || (() => {})}
              onToggleActive={onCategoryToggleActive || (() => {})}
              onToggleExpanded={onToggleExpanded || (() => {})}
              onSelectionToggle={handleSelectionToggle}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};