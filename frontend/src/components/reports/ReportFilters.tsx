import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Calendar, Filter, X } from 'lucide-react';
import { useCategories } from '../../hooks/useInventory';

interface ReportFiltersProps {
  filters: {
    start_date: string;
    end_date: string;
    category_id: string;
  };
  onFiltersChange: (filters: any) => void;
}

const ReportFilters: React.FC<ReportFiltersProps> = ({ filters, onFiltersChange }) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const { data: categories } = useCategories();

  // Get categories data
  const categoriesData = categories || [];

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      start_date: '',
      end_date: '',
      category_id: '',
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const setQuickDateRange = (days: number) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const newFilters = {
      ...localFilters,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
    };
    setLocalFilters(newFilters);
  };

  return (
    <div className="space-y-4">
      {/* Date Range Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_date" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            تاریخ شروع
          </Label>
          <Input
            id="start_date"
            type="date"
            value={localFilters.start_date}
            onChange={(e) => handleFilterChange('start_date', e.target.value)}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="end_date" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            تاریخ پایان
          </Label>
          <Input
            id="end_date"
            type="date"
            value={localFilters.end_date}
            onChange={(e) => handleFilterChange('end_date', e.target.value)}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            دسته‌بندی
          </Label>
          <Select
            value={localFilters.category_id}
            onValueChange={(value) => handleFilterChange('category_id', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="انتخاب دسته‌بندی" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">همه دسته‌بندی‌ها</SelectItem>
              {categoriesData.map((category: any) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>اعمال فیلترها</Label>
          <div className="flex gap-2">
            <Button onClick={applyFilters} size="sm" className="flex-1">
              <Filter className="h-4 w-4 mr-2" />
              اعمال
            </Button>
            <Button onClick={clearFilters} variant="outline" size="sm">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Date Range Buttons */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm font-medium text-gray-700 self-center ml-4">
          بازه‌های سریع:
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setQuickDateRange(7)}
        >
          ۷ روز گذشته
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setQuickDateRange(30)}
        >
          ۳۰ روز گذشته
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setQuickDateRange(90)}
        >
          ۹۰ روز گذشته
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setQuickDateRange(365)}
        >
          یک سال گذشته
        </Button>
      </div>

      {/* Active Filters Display */}
      {(localFilters.start_date || localFilters.end_date || localFilters.category_id) && (
        <div className="flex flex-wrap gap-2 p-3 bg-blue-50 rounded-lg">
          <span className="text-sm font-medium text-blue-800">فیلترهای فعال:</span>
          {localFilters.start_date && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
              از: {localFilters.start_date}
            </span>
          )}
          {localFilters.end_date && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
              تا: {localFilters.end_date}
            </span>
          )}
          {localFilters.category_id && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
              دسته‌بندی: {categoriesData.find((c: any) => c.id === localFilters.category_id)?.name || 'نامشخص'}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportFilters;