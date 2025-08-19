import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, Filter } from 'lucide-react';

interface Filter {
  id: string;
  label: string;
  value: string;
  type: 'select' | 'input' | 'date';
}

interface AnalyticsFiltersProps {
  filters: Filter[];
  activeFilters: Record<string, string>;
  onFilterChange: (filterId: string, value: string) => void;
  onFilterRemove: (filterId: string) => void;
  onClearAll: () => void;
  className?: string;
}

const filterOptions = {
  dataType: [
    { value: 'sales_trend', label: 'Sales Trends' },
    { value: 'inventory_turnover', label: 'Inventory Turnover' },
    { value: 'customer_behavior', label: 'Customer Behavior' },
    { value: 'profitability', label: 'Profitability' }
  ],
  entityType: [
    { value: 'product', label: 'Product' },
    { value: 'category', label: 'Category' },
    { value: 'customer', label: 'Customer' },
    { value: 'global', label: 'Global' }
  ],
  period: [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' }
  ],
  kpiType: [
    { value: 'financial', label: 'Financial' },
    { value: 'operational', label: 'Operational' },
    { value: 'customer', label: 'Customer' }
  ]
};

export const AnalyticsFilters: React.FC<AnalyticsFiltersProps> = ({
  filters,
  activeFilters,
  onFilterChange,
  onFilterRemove,
  onClearAll,
  className
}) => {
  const activeFilterCount = Object.keys(activeFilters).length;

  const renderFilter = (filter: Filter) => {
    const value = activeFilters[filter.id] || '';

    switch (filter.type) {
      case 'select':
        const options = filterOptions[filter.id as keyof typeof filterOptions] || [];
        return (
          <Select
            key={filter.id}
            value={value}
            onValueChange={(newValue) => onFilterChange(filter.id, newValue)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={filter.label} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'input':
        return (
          <Input
            key={filter.id}
            placeholder={filter.label}
            value={value}
            onChange={(e) => onFilterChange(filter.id, e.target.value)}
            className="w-[180px]"
          />
        );

      case 'date':
        return (
          <Input
            key={filter.id}
            type="date"
            placeholder={filter.label}
            value={value}
            onChange={(e) => onFilterChange(filter.id, e.target.value)}
            className="w-[180px]"
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1 text-sm font-medium">
          <Filter className="h-4 w-4" />
          Filters:
        </div>
        
        {filters.map(renderFilter)}
        
        {activeFilterCount > 0 && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onClearAll}
            className="text-xs"
          >
            Clear All ({activeFilterCount})
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {Object.entries(activeFilters).map(([filterId, value]) => {
            const filter = filters.find(f => f.id === filterId);
            if (!filter || !value) return null;

            const displayValue = filter.type === 'select' 
              ? filterOptions[filterId as keyof typeof filterOptions]?.find(opt => opt.value === value)?.label || value
              : value;

            return (
              <Badge 
                key={filterId} 
                variant="secondary" 
                className="flex items-center gap-1 text-xs"
              >
                {filter.label}: {displayValue}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-3 w-3 p-0 hover:bg-transparent"
                  onClick={() => onFilterRemove(filterId)}
                >
                  <X className="h-2 w-2" />
                </Button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
};
