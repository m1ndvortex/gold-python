import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  BarChart,
  AreaChart,
  PieChart,
  ScatterChart,
  Line,
  Bar,
  Area,
  Pie,
  Cell,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Brush,
  ReferenceLine,
  ReferenceArea,

} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Filter,
  Download,
  Maximize2,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Minus,
  MessageSquare
} from 'lucide-react';
import { ChartExportMenu } from './ChartExportMenu';
import { ChartAnnotations } from './ChartAnnotations';

export interface ChartDataPoint {
  name: string;
  value: number;
  category?: string;
  date?: string;
  [key: string]: any;
}

export interface DrillDownLevel {
  key: string;
  label: string;
  dataKey: string;
  color?: string;
}

export interface ChartFilter {
  key: string;
  label: string;
  type: 'select' | 'range' | 'date';
  options?: Array<{ label: string; value: any }>;
  value?: any;
}

export interface InteractiveChartProps {
  data: ChartDataPoint[];
  type: 'line' | 'bar' | 'area' | 'pie' | 'scatter';
  title?: string;
  description?: string;
  className?: string;
  height?: number;
  
  // Drill-down configuration
  drillDown?: {
    enabled: boolean;
    levels: DrillDownLevel[];
    onDrillDown?: (level: DrillDownLevel, dataPoint: ChartDataPoint) => void;
    breadcrumbs?: boolean;
  };
  
  // Zoom configuration
  zoom?: {
    enabled: boolean;
    type: 'x' | 'y' | 'xy';
    onZoomChange?: (domain: { x?: [number, number]; y?: [number, number] }) => void;
  };
  
  // Filter configuration
  filters?: {
    enabled: boolean;
    filters: ChartFilter[];
    onFilterChange?: (filters: Record<string, any>) => void;
  };
  
  // Animation configuration
  animation?: {
    enabled: boolean;
    duration?: number;
    delay?: number;
  };
  
  // Export configuration
  export?: {
    enabled: boolean;
    formats: Array<'png' | 'svg' | 'pdf' | 'csv'>;
    onExport?: (format: string, data: ChartDataPoint[]) => void;
  };
  
  // Styling
  colors?: string[];
  theme?: 'light' | 'dark';
  
  // Event handlers
  onDataPointClick?: (dataPoint: ChartDataPoint, index: number) => void;
  onDataPointHover?: (dataPoint: ChartDataPoint | null) => void;
  
  // Export and sharing
  enableExport?: boolean;
  enableAnnotations?: boolean;
  chartId?: string;
  currentUser?: {
    name: string;
    avatar?: string;
  };
}

export const InteractiveChart: React.FC<InteractiveChartProps> = ({
  data,
  type,
  title,
  description,
  className,
  height = 400,
  drillDown,
  zoom,
  filters,
  animation = { enabled: true, duration: 1000 },
  export: exportConfig,
  colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'],
  theme = 'light',
  onDataPointClick,
  onDataPointHover,
  enableExport = true,
  enableAnnotations = false,
  chartId = 'chart-' + Date.now(),
  currentUser = { name: 'Anonymous User' }
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ level: number; label: string; data: ChartDataPoint[] }>>([]);
  const [zoomDomain, setZoomDomain] = useState<{ x?: [number, number]; y?: [number, number] }>({});
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoveredData, setHoveredData] = useState<ChartDataPoint | null>(null);
  const [selectedArea, setSelectedArea] = useState<{ x1?: number; x2?: number; y1?: number; y2?: number } | null>(null);
  const [showAnnotations, setShowAnnotations] = useState(false);

  // Filter data based on active filters
  const filteredData = useMemo(() => {
    let filtered = [...data];
    
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        const filter = filters?.filters.find(f => f.key === key);
        if (filter) {
          switch (filter.type) {
            case 'select':
              filtered = filtered.filter(item => item[key] === value);
              break;
            case 'range':
              if (Array.isArray(value) && value.length === 2) {
                filtered = filtered.filter(item => 
                  item[key] >= value[0] && item[key] <= value[1]
                );
              }
              break;
            case 'date':
              if (Array.isArray(value) && value.length === 2) {
                filtered = filtered.filter(item => {
                  const itemDate = new Date(item[key]);
                  return itemDate >= new Date(value[0]) && itemDate <= new Date(value[1]);
                });
              }
              break;
          }
        }
      }
    });
    
    return filtered;
  }, [data, activeFilters, filters]);

  // Handle drill down
  const handleDrillDown = useCallback((dataPoint: ChartDataPoint) => {
    if (!drillDown?.enabled || currentLevel >= (drillDown.levels.length - 1)) return;
    
    const nextLevel = currentLevel + 1;
    const levelConfig = drillDown.levels[nextLevel];
    
    // Add current state to breadcrumbs
    setBreadcrumbs(prev => [
      ...prev,
      {
        level: currentLevel,
        label: drillDown.levels[currentLevel]?.label || 'Overview',
        data: filteredData
      }
    ]);
    
    setCurrentLevel(nextLevel);
    
    if (drillDown.onDrillDown) {
      drillDown.onDrillDown(levelConfig, dataPoint);
    }
  }, [currentLevel, drillDown, filteredData]);

  // Handle breadcrumb navigation
  const handleBreadcrumbClick = useCallback((targetLevel: number) => {
    const targetBreadcrumb = breadcrumbs.find(b => b.level === targetLevel);
    if (targetBreadcrumb) {
      setCurrentLevel(targetLevel);
      setBreadcrumbs(prev => prev.filter(b => b.level < targetLevel));
    }
  }, [breadcrumbs]);

  // Handle zoom
  const handleZoomIn = useCallback(() => {
    if (!zoom?.enabled) return;
    
    const currentXDomain = zoomDomain.x || [0, filteredData.length - 1];
    const currentYDomain = zoomDomain.y || [0, Math.max(...filteredData.map(d => d.value))];
    
    const newXDomain: [number, number] = [
      currentXDomain[0] + (currentXDomain[1] - currentXDomain[0]) * 0.1,
      currentXDomain[1] - (currentXDomain[1] - currentXDomain[0]) * 0.1
    ];
    
    const newYDomain: [number, number] = [
      currentYDomain[0] + (currentYDomain[1] - currentYDomain[0]) * 0.1,
      currentYDomain[1] - (currentYDomain[1] - currentYDomain[0]) * 0.1
    ];
    
    const newDomain = {
      ...(zoom.type === 'x' || zoom.type === 'xy' ? { x: newXDomain } : {}),
      ...(zoom.type === 'y' || zoom.type === 'xy' ? { y: newYDomain } : {})
    };
    
    setZoomDomain(newDomain);
    zoom.onZoomChange?.(newDomain);
  }, [zoom, zoomDomain, filteredData]);

  const handleZoomOut = useCallback(() => {
    if (!zoom?.enabled) return;
    
    const newDomain = {};
    setZoomDomain(newDomain);
    zoom.onZoomChange?.(newDomain);
  }, [zoom]);

  // Handle filter changes
  const handleFilterChange = useCallback((filterKey: string, value: any) => {
    const newFilters = { ...activeFilters, [filterKey]: value };
    setActiveFilters(newFilters);
    filters?.onFilterChange?.(newFilters);
  }, [activeFilters, filters]);

  // Handle data point interactions
  const handleDataPointClick = useCallback((data: any, event?: any) => {
    if (data && data.activePayload && data.activePayload.length > 0) {
      const dataPoint = data.activePayload[0].payload;
      const index = data.activeTooltipIndex || 0;
      onDataPointClick?.(dataPoint, index);
      
      if (drillDown?.enabled) {
        handleDrillDown(dataPoint);
      }
    }
  }, [onDataPointClick, drillDown, handleDrillDown]);

  const handleDataPointHover = useCallback((data: any) => {
    const dataPoint = data?.payload || data;
    setHoveredData(dataPoint);
    onDataPointHover?.(dataPoint);
  }, [onDataPointHover]);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-background border border-border rounded-lg shadow-lg p-3 max-w-xs"
      >
        <p className="font-medium text-sm mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium">{entry.value.toLocaleString()}</span>
          </div>
        ))}
        {drillDown?.enabled && (
          <div className="mt-2 pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">Click to drill down</p>
          </div>
        )}
      </motion.div>
    );
  };

  // Render chart based on type
  const renderChart = () => {
    const commonProps = {
      data: filteredData,
      margin: { top: 20, right: 30, left: 20, bottom: 20 },
      onClick: handleDataPointClick,
      onMouseEnter: handleDataPointHover,
      onMouseLeave: () => handleDataPointHover(null)
    };

    switch (type) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
            <XAxis 
              dataKey="name" 
              stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
              domain={zoomDomain.x}
            />
            <YAxis 
              stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
              domain={zoomDomain.y}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {zoom?.enabled && <Brush dataKey="name" height={30} />}
            <Line
              type="monotone"
              dataKey="value"
              stroke={colors[0]}
              strokeWidth={2}
              dot={{ fill: colors[0], strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: colors[0], strokeWidth: 2 }}
              animationDuration={animation.enabled ? animation.duration : 0}
              animationBegin={animation.delay || 0}
            />
          </LineChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
            <XAxis 
              dataKey="name" 
              stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
            />
            <YAxis 
              stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
              domain={zoomDomain.y}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {zoom?.enabled && <Brush dataKey="name" height={30} />}
            <Bar
              dataKey="value"
              fill={colors[0]}
              animationDuration={animation.enabled ? animation.duration : 0}
              animationBegin={animation.delay || 0}
            />
          </BarChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
            <XAxis 
              dataKey="name" 
              stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
            />
            <YAxis 
              stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
              domain={zoomDomain.y}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {zoom?.enabled && <Brush dataKey="name" height={30} />}
            <Area
              type="monotone"
              dataKey="value"
              stroke={colors[0]}
              fill={colors[0]}
              fillOpacity={0.3}
              animationDuration={animation.enabled ? animation.duration : 0}
              animationBegin={animation.delay || 0}
            />
          </AreaChart>
        );

      case 'pie':
        return (
          <PieChart {...commonProps}>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Pie
              data={filteredData}
              cx="50%"
              cy="50%"
              outerRadius={120}
              fill={colors[0]}
              dataKey="value"
              label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
              animationDuration={animation.enabled ? animation.duration : 0}
              animationBegin={animation.delay || 0}
            >
              {filteredData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
          </PieChart>
        );

      case 'scatter':
        return (
          <ScatterChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
            <XAxis 
              dataKey="name" 
              stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
            />
            <YAxis 
              stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Scatter
              data={filteredData}
              fill={colors[0]}
              animationDuration={animation.enabled ? animation.duration : 0}
              animationBegin={animation.delay || 0}
            />
          </ScatterChart>
        );

      default:
        return <div>Unsupported chart type</div>;
    }
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {zoom?.enabled && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomIn}
                  className="h-8 w-8 p-0"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomOut}
                  className="h-8 w-8 p-0"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoomDomain({})}
                  className="h-8 w-8 p-0"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </>
            )}
            
            {enableExport && (
              <ChartExportMenu
                chartElement={chartRef.current}
                chartData={filteredData}
                chartConfig={{ type, data: filteredData, title, description }}
                chartId={chartId}
                onExportComplete={(result) => exportConfig?.onExport?.(result.filename.split('.').pop() || 'png', filteredData)}
              />
            )}
            
            {enableAnnotations && (
              <Button
                variant={showAnnotations ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowAnnotations(!showAnnotations)}
                className="h-8 w-8 p-0"
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="h-8 w-8 p-0"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Breadcrumbs */}
        {drillDown?.breadcrumbs && breadcrumbs.length > 0 && (
          <div className="flex items-center gap-2 mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleBreadcrumbClick(0)}
              className="h-6 px-2 text-xs"
            >
              Overview
            </Button>
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={index}>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleBreadcrumbClick(crumb.level + 1)}
                  className="h-6 px-2 text-xs"
                >
                  {crumb.label}
                </Button>
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Filters */}
        {filters?.enabled && filters.filters.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {filters.filters.map((filter) => (
              <div key={filter.key} className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {filter.label}
                </Badge>
                {filter.type === 'select' && filter.options && (
                  <select
                    value={activeFilters[filter.key] || ''}
                    onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                    className="text-xs border rounded px-2 py-1"
                  >
                    <option value="">All</option>
                    {filter.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div className="relative">
          <div 
            ref={chartRef}
            className={cn(
              'w-full transition-all duration-300',
              isFullscreen && 'fixed inset-0 z-50 bg-background p-6'
            )}
            style={{ height: isFullscreen ? '100vh' : height }}
          >
            <ResponsiveContainer width="100%" height="100%">
              {renderChart()}
            </ResponsiveContainer>
          </div>
          
          {/* Chart Annotations Overlay */}
          {enableAnnotations && showAnnotations && (
            <ChartAnnotations
              chartId={chartId}
              chartElement={chartRef.current}
              currentUser={currentUser}
              className="absolute inset-0"
            />
          )}
        </div>

        {/* Hovered data display */}
        <AnimatePresence>
          {hoveredData && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mt-4 p-3 bg-muted rounded-lg"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Selected: {hoveredData.name}</span>
                <span className="text-sm text-muted-foreground">
                  Value: {hoveredData.value.toLocaleString()}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};