import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface DateRangePickerProps {
  startDate?: Date;
  endDate?: Date;
  onDateRangeChange: (startDate?: Date, endDate?: Date) => void;
  className?: string;
}

const quickRanges = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Last 7 days', value: 'last7days' },
  { label: 'Last 30 days', value: 'last30days' },
  { label: 'Last 90 days', value: 'last90days' },
  { label: 'This month', value: 'thismonth' },
  { label: 'Last month', value: 'lastmonth' },
  { label: 'This year', value: 'thisyear' },
  { label: 'Custom', value: 'custom' }
];

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onDateRangeChange,
  className
}) => {
  const [selectedRange, setSelectedRange] = useState<string>('last30days');
  const [isCustom, setIsCustom] = useState(false);

  const handleQuickRangeSelect = (value: string) => {
    setSelectedRange(value);
    
    const now = new Date();
    let start: Date | undefined;
    let end: Date | undefined = now;

    switch (value) {
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        break;
      case 'yesterday':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59);
        break;
      case 'last7days':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        break;
      case 'last30days':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
        break;
      case 'last90days':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 90);
        break;
      case 'thismonth':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'lastmonth':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        break;
      case 'thisyear':
        start = new Date(now.getFullYear(), 0, 1);
        break;
      case 'custom':
        setIsCustom(true);
        return;
      default:
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
    }

    setIsCustom(false);
    onDateRangeChange(start, end);
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value ? new Date(e.target.value) : undefined;
    onDateRangeChange(date, endDate);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value ? new Date(e.target.value) : undefined;
    onDateRangeChange(startDate, date);
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Select value={selectedRange} onValueChange={handleQuickRangeSelect}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Select range" />
        </SelectTrigger>
        <SelectContent>
          {quickRanges.map((range) => (
            <SelectItem key={range.value} value={range.value}>
              {range.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isCustom && (
        <>
          <Input
            type="date"
            value={startDate ? startDate.toISOString().split('T')[0] : ''}
            onChange={handleStartDateChange}
            className="w-[140px]"
            placeholder="Start date"
          />
          
          <Input
            type="date"
            value={endDate ? endDate.toISOString().split('T')[0] : ''}
            onChange={handleEndDateChange}
            className="w-[140px]"
            placeholder="End date"
          />
        </>
      )}

      {!isCustom && startDate && endDate && (
        <div className="text-sm text-muted-foreground">
          {formatDate(startDate)} - {formatDate(endDate)}
        </div>
      )}
    </div>
  );
};
