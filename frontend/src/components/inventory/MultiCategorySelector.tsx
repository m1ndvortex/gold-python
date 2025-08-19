import React, { useState, useMemo } from 'react';
import { 
  Check, 
  ChevronDown, 
  ChevronRight, 
  Search, 
  X, 
  Folder, 
  FolderOpen,
  Package,
  Tag
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { ScrollArea } from '../ui/scroll-area';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '../ui/popover';
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../ui/command';
import { cn } from '../../lib/utils';
import type { Category } from '../../types';

interface CategoryNode extends Category {
  children: CategoryNode[];
  level: number;
  path: string[];
}

interface MultiCategorySelectorProps {
  categories: Category[];
  selectedCategories: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  maxSelections?: number;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const MultiCategorySelector: React.FC<MultiCategorySelectorProps> = ({
  categories,
  selectedCategories,
  onSelectionChange,
  maxSelections,
  placeholder = "Select categories...",
  className,
  disabled = false
}) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Build category tree with hierarchy
  const categoryTree = useMemo(() => {
    const buildTree = (parentId: string | null = null, level = 0, path: string[] = []): CategoryNode[] => {
      return categories
        .filter(cat => cat.parent_id === parentId)
        .map(cat => ({
          ...cat,
          level,
          path: [...path, cat.name],
          children: buildTree(cat.id, level + 1, [...path, cat.name])
        }));
    };
    return buildTree();
  }, [categories]);

  // Flatten tree for search
  const flatCategories = useMemo(() => {
    const flatten = (nodes: CategoryNode[]): CategoryNode[] => {
      return nodes.reduce((acc, node) => {
        acc.push(node);
        if (node.children.length > 0) {
          acc.push(...flatten(node.children));
        }
        return acc;
      }, [] as CategoryNode[]);
    };
    return flatten(categoryTree);
  }, [categoryTree]);

  // Filter categories based on search term
  const filteredCategories = useMemo(() => {
    if (!searchTerm) return categoryTree;
    
    const matchingIds = new Set(
      flatCategories
        .filter(cat => 
          cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cat.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cat.path.some(p => p.toLowerCase().includes(searchTerm.toLowerCase()))
        )
        .map(cat => cat.id)
    );

    // Include parent categories of matching items
    const includeParents = (nodes: CategoryNode[]): CategoryNode[] => {
      return nodes.map(node => ({
        ...node,
        children: includeParents(node.children)
      })).filter(node => 
        matchingIds.has(node.id) || 
        node.children.length > 0
      );
    };

    return includeParents(categoryTree);
  }, [categoryTree, flatCategories, searchTerm]);

  const selectedCategoryObjects = useMemo(() => {
    return flatCategories.filter(cat => selectedCategories.includes(cat.id));
  }, [flatCategories, selectedCategories]);

  const handleCategoryToggle = (categoryId: string) => {
    const isSelected = selectedCategories.includes(categoryId);
    let newSelection: string[];

    if (isSelected) {
      newSelection = selectedCategories.filter(id => id !== categoryId);
    } else {
      if (maxSelections && selectedCategories.length >= maxSelections) {
        return; // Don't allow more selections
      }
      newSelection = [...selectedCategories, categoryId];
    }

    onSelectionChange(newSelection);
  };

  const handleRemoveCategory = (categoryId: string) => {
    const newSelection = selectedCategories.filter(id => id !== categoryId);
    onSelectionChange(newSelection);
  };

  const toggleExpanded = (categoryId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedNodes(newExpanded);
  };

  const renderCategoryNode = (node: CategoryNode) => {
    const isSelected = selectedCategories.includes(node.id);
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children.length > 0;
    const indent = node.level * 16;

    return (
      <div key={node.id} className="space-y-1">
        <div
          className={cn(
            "flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer",
            isSelected && "bg-primary/10"
          )}
          style={{ paddingLeft: `${8 + indent}px` }}
        >
          {hasChildren ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 p-0"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(node.id);
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

          <div className="flex items-center gap-2 flex-1" onClick={() => handleCategoryToggle(node.id)}>
            <Checkbox
              checked={isSelected}
              onChange={() => handleCategoryToggle(node.id)}
              disabled={!isSelected && !!maxSelections && selectedCategories.length >= maxSelections}
            />
            
            <div className="flex items-center gap-2">
              {hasChildren ? (
                isExpanded ? (
                  <FolderOpen className="h-4 w-4 text-amber-600" />
                ) : (
                  <Folder className="h-4 w-4 text-amber-600" />
                )
              ) : (
                <Package className="h-4 w-4 text-blue-600" />
              )}
              
              <div className="flex-1">
                <span className="font-medium">{node.name}</span>
                {node.description && (
                  <p className="text-xs text-muted-foreground">{node.description}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="space-y-1">
            {node.children.map(child => renderCategoryNode(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              {selectedCategories.length === 0 ? (
                placeholder
              ) : (
                `${selectedCategories.length} categor${selectedCategories.length === 1 ? 'y' : 'ies'} selected`
              )}
            </div>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search categories..."
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandList>
              <CommandEmpty>No categories found.</CommandEmpty>
              <CommandGroup>
                <ScrollArea className="h-[300px]">
                  <div className="p-2 space-y-1">
                    {filteredCategories.map(node => renderCategoryNode(node))}
                  </div>
                </ScrollArea>
              </CommandGroup>
            </CommandList>
          </Command>
          
          {maxSelections && (
            <div className="p-2 border-t text-xs text-muted-foreground">
              {selectedCategories.length} of {maxSelections} categories selected
            </div>
          )}
        </PopoverContent>
      </Popover>

      {/* Selected Categories Display */}
      {selectedCategories.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Selected Categories:</Label>
          <div className="flex flex-wrap gap-2">
            {selectedCategoryObjects.map((category, index) => (
              <Badge key={category.id} variant={index === 0 ? "default" : "secondary"}>
                <span className="flex items-center gap-1">
                  {category.path.join(' > ')}
                  {index === 0 && " (Primary)"}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-3 w-3 ml-1 hover:bg-transparent"
                    onClick={() => handleRemoveCategory(category.id)}
                  >
                    <X className="h-2 w-2" />
                  </Button>
                </span>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};