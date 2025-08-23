import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Target, 
  Settings,
  ChevronDown,
  X
} from 'lucide-react';
import { format, subDays, subWeeks, subMonths, subYears, startOfDay, endOfDay } from 'date-fns';

export interface TimeRange {
  period: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
  label: string;
  startDate?: Date;
  endDate?: Date;
  targets?: Record<string, number>;
}

export interface TimeRangePreset {
  period: TimeRange['period'];
  label: string;
  getValue: () => { startDate: Date; endDate: Date };
}

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (timeRange: TimeRange) => void;
  showTargets?: boolean;
  showPresets?: boolean;
  className?: string;
  compactMode?: boolean;
}

const DEFAULT_PRESETS: TimeRangePreset[] = [
  {
    period: 'today',
    label: 'Today',
    getValue: () => ({
      startDate: startOfDay(new Date()),
      endDate: endOfDay(new Date())
    })
  },
  {
    period: 'week',
    label: 'Last 7 Days',
    getValue: () => ({
      startDate: startOfDay(subDays(new Date(), 6)),
      endDate: endOfDay(new Date())
    })
  },
  {
    period: 'month',
    label: 'Last 30 Days',
    getValue: () => ({
      startDate: startOfDay(subDays(new Date(), 29)),
      endDate: endOfDay(new Date())
    })
  },
  {
    period: 'quarter',
    label: 'Last 90 Days',
    getValue: () => ({
      startDate: startOfDay(subDays(new Date(), 89)),
      endDate: endOfDay(new Date())
    })
  },
  {
    period: 'year',
    label: 'Last 365 Days',
    getValue: () => ({
      startDate: startOfDay(subDays(new Date(), 364)),
      endDate: endOfDay(new Date())
    })
  }
];

const DEFAULT_TARGETS = {
  revenue: 100000,
  profit_margin: 25,
  inventory_turnover: 8,
  customer_acquisition: 50,
  retention_rate: 85
};

export const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  value,
  onChange,
  showTargets = false,
  showPresets = true,
  className,
  compactMode = false
}) => {
  const [isCustomDateOpen, setIsCustomDateOpen] = useState(false);
  const [isTargetsOpen, setIsTargetsOpen] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(value.startDate);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(value.endDate);
  const [targets, setTargets] = useState<Record<string, number>>(value.targets || DEFAULT_TARGETS);

  // Update local state when value changes
  useEffect(() => {
    setCustomStartDate(value.startDate);
    setCustomEndDate(value.endDate);
    setTargets(value.targets || DEFAULT_TARGETS);
  }, [value]);

  // Handle preset selection
  const handlePresetSelect = (preset: TimeRangePreset) => {
    const { startDate, endDate } = preset.getValue();
    onChange({
      period: preset.period,
      label: preset.label,
      startDate,
      endDate,
      targets: value.targets
    });
  };

  // Handle custom date range
  const handleCustomDateApply = () => {
    if (customStartDate && customEndDate) {
      onChange({
        period: 'custom',
        label: `${format(customStartDate, 'MMM dd')} - ${format(customEndDate, 'MMM dd')}`,
        startDate: customStartDate,
        endDate: customEndDate,
        targets: value.targets
      });
      setIsCustomDateOpen(false);
    }
  };

  // Handle targets update
  const handleTargetsUpdate = () => {
    onChange({
      ...value,
      targets
    });
    setIsTargetsOpen(false);
  };

  // Handle target value change
  const handleTargetChange = (key: string, newValue: string) => {
    const numValue = parseFloat(newValue);
    if (!isNaN(numValue)) {
      setTargets(prev => ({
        ...prev,
        [key]: numValue
      }));
    }
  };

  // Remove target
  const handleRemoveTarget = (key: string) => {
    setTargets(prev => {
      const newTargets = { ...prev };
      delete newTargets[key];
      return newTargets;
    });
  };

  // Add new target
  const handleAddTarget = (key: string, value: number) => {
    setTargets(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const formatDateRange = () => {
    if (value.period === 'custom' && value.startDate && value.endDate) {
      return `${format(value.startDate, 'MMM dd, yyyy')} - ${format(value.endDate, 'MMM dd, yyyy')}`;
    }
    return value.label;
  };

  if (compactMode) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {/* Preset Selector */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="justify-between min-w-[150px]">
              <Clock className="h-4 w-4 mr-2" />
              {value.label}
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2">
            <div className="space-y-1">
              {DEFAULT_PRESETS.map((preset) => (
                <Button
                  key={preset.period}
                  variant={value.period === preset.period ? "default" : "ghost"}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => handlePresetSelect(preset)}
                >
                  {preset.label}
                </Button>
              ))}
              <Button
                variant={value.period === 'custom' ? "default" : "ghost"}
                size="sm"
                className="w-full justify-start"
                onClick={() => setIsCustomDateOpen(true)}
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                Custom Range
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Targets Button */}
        {showTargets && (
          <Popover open={isTargetsOpen} onOpenChange={setIsTargetsOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Target className="h-4 w-4 mr-2" />
                Targets
                {Object.keys(targets).length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {Object.keys(targets).length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">KPI Targets</h4>
                  <Button size="sm" onClick={handleTargetsUpdate}>
                    Apply
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {Object.entries(targets).map(([key, targetValue]) => (
                    <div key={key} className="flex items-center gap-2">
                      <Label className="text-xs capitalize min-w-[80px]">
                        {key.replace('_', ' ')}
                      </Label>
                      <Input
                        type="number"
                        value={targetValue}
                        onChange={(e) => handleTargetChange(key, e.target.value)}
                        className="h-8"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveTarget(key)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Time Range Selection */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Time Range:</span>
            </div>
            
            {showPresets && (
              <div className="flex flex-wrap gap-2">
                {DEFAULT_PRESETS.map((preset) => (
                  <Button
                    key={preset.period}
                    variant={value.period === preset.period ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePresetSelect(preset)}
                  >
                    {preset.label}
                  </Button>
                ))}
                
                {/* Custom Date Range */}
                <Popover open={isCustomDateOpen} onOpenChange={setIsCustomDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant={value.period === 'custom' ? "default" : "outline"}
                      size="sm"
                    >
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      Custom
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-4" align="start">
                    <div className="space-y-4">
                      <div className="text-sm font-medium">Select Date Range</div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs">Start Date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-start text-left">
                                <CalendarIcon className="h-4 w-4 mr-2" />
                                {customStartDate ? format(customStartDate, 'MMM dd, yyyy') : 'Select date'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={customStartDate}
                                onSelect={setCustomStartDate}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        
                        <div>
                          <Label className="text-xs">End Date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-start text-left">
                                <CalendarIcon className="h-4 w-4 mr-2" />
                                {customEndDate ? format(customEndDate, 'MMM dd, yyyy') : 'Select date'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={customEndDate}
                                onSelect={setCustomEndDate}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                      
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsCustomDateOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleCustomDateApply}
                          disabled={!customStartDate || !customEndDate}
                        >
                          Apply
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>

          {/* Current Selection Display */}
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-sm">
              {formatDateRange()}
            </Badge>
            
            {/* Targets Configuration */}
            {showTargets && (
              <Popover open={isTargetsOpen} onOpenChange={setIsTargetsOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Target className="h-4 w-4 mr-2" />
                    Targets
                    {Object.keys(targets).length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {Object.keys(targets).length}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-96 p-4" align="end">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">KPI Targets</h4>
                      <Button size="sm" onClick={handleTargetsUpdate}>
                        Apply Changes
                      </Button>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      Set target values for KPI comparison and achievement tracking.
                    </div>
                    
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {Object.entries(targets).map(([key, targetValue]) => (
                        <div key={key} className="flex items-center gap-3 p-2 border rounded">
                          <div className="flex-1">
                            <Label className="text-sm font-medium capitalize">
                              {key.replace('_', ' ')}
                            </Label>
                            <Input
                              type="number"
                              value={targetValue}
                              onChange={(e) => handleTargetChange(key, e.target.value)}
                              className="mt-1"
                              placeholder="Enter target value"
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveTarget(key)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    
                    {/* Quick Add Common Targets */}
                    <div className="border-t pt-3">
                      <div className="text-sm font-medium mb-2">Quick Add:</div>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { key: 'revenue', label: 'Revenue', value: 100000 },
                          { key: 'profit_margin', label: 'Profit Margin', value: 25 },
                          { key: 'inventory_turnover', label: 'Inventory Turnover', value: 8 },
                          { key: 'customer_acquisition', label: 'Customer Acquisition', value: 50 },
                          { key: 'retention_rate', label: 'Retention Rate', value: 85 }
                        ].filter(target => !targets[target.key]).map((target) => (
                          <Button
                            key={target.key}
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddTarget(target.key, target.value)}
                          >
                            + {target.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};