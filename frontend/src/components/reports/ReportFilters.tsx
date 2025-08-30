import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Calendar, Filter, X } from 'lucide-react';
import { useCategories } from '../../hooks/useInventory';
import { DatePicker } from '../ui/date-picker';
import { JalaliUtils } from '../../utils/jalali';
import { useLanguage } from '../../hooks/useLanguage';

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
  const [startDate, setStartDate] = useState<Date | null>(
    filters.start_date ? new Date(filters.start_date) : null
  );
  const [endDate, setEndDate] = useState<Date | null>(
    filters.end_date ? new Date(filters.end_date) : null
  );
  const { data: categories } = useCategories();
  const { language } = useLanguage();

  // Get categories data
  const categoriesData = categories || [];

  useEffect(() => {
    setLocalFilters(filters);
    setStartDate(filters.start_date ? new Date(filters.start_date) : null);
    setEndDate(filters.end_date ? new Date(filters.end_date) : null);
  }, [filters]);

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
  };

  const handleStartDateChange = (date: Date | null) => {
    setStartDate(date);
    const dateString = date ? date.toISOString().split('T')[0] : '';
    handleFilterChange('start_date', dateString);
  };

  const handleEndDateChange = (date: Date | null) => {
    setEndDate(date);
    const dateString = date ? date.toISOString().split('T')[0] : '';
    handleFilterChange('end_date', dateString);
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
    const endDateObj = new Date();
    const startDateObj = new Date();
    startDateObj.setDate(endDateObj.getDate() - days);

    setStartDate(startDateObj);
    setEndDate(endDateObj);

    const newFilters = {
      ...localFilters,
      start_date: startDateObj.toISOString().split('T')[0],
      end_date: endDateObj.toISOString().split('T')[0],
    };
    setLocalFilters(newFilters);
  };

  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return '';
    if (language === 'fa') {
      return JalaliUtils.formatJalaliDate(new Date(dateString), 'jYYYY/jMM/jDD');
    }
    return dateString;
  };

  return (
    <div className="space-y-4">
      {/* Date Range Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_date" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {language === 'fa' ? 'تاریخ شروع' : 'Start Date'}
          </Label>
          <DatePicker
            id="start_date"
            value={startDate}
            onChange={handleStartDateChange}
            placeholder={language === 'fa' ? 'انتخاب تاریخ شروع' : 'Select start date'}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="end_date" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {language === 'fa' ? 'تاریخ پایان' : 'End Date'}
          </Label>
          <DatePicker
            id="end_date"
            value={endDate}
            onChange={handleEndDateChange}
            placeholder={language === 'fa' ? 'انتخاب تاریخ پایان' : 'Select end date'}
            className="w-full"
            minDate={startDate || undefined}
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
              <SelectItem value="all">همه دسته‌بندی‌ها</SelectItem>
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
              {language === 'fa' ? 'از: ' : 'From: '}{formatDateForDisplay(localFilters.start_date)}
            </span>
          )}
          {localFilters.end_date && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
              {language === 'fa' ? 'تا: ' : 'To: '}{formatDateForDisplay(localFilters.end_date)}
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