import React, { useState, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Separator } from '../../ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../ui/tooltip';
import {
  Palette,
  Download,
  Maximize2,
  RotateCcw,
  Filter,
  TrendingUp,
  TrendingDown,
  Eye,
  EyeOff,
  Grid3X3,
  BarChart3
} from 'lucide-react';

export interface HeatmapDataPoint {
  x: string | number;
  y: string | number;
  value: number;
  label?: string;
  category?: string;
  metadata?: Record<string, any>;
}

export interface CorrelationData {
  variable1: string;
  variable2: string;
  correlation: number;
  pValue?: number;
  significance?: 'high' | 'medium' | 'low' | 'none';
}

export interface PatternAnalysis {
  clusters: Array<{
    id: string;
    points: HeatmapDataPoint[];
    centroid: { x: number; y: number };
    strength: number;
  }>;
  hotspots: Array<{
    x: string | number;
    y: string | number;
    intensity: number;
    radius: number;
  }>;
  trends: Array<{
    direction: 'horizontal' | 'vertical' | 'diagonal';
    strength: number;
    region: { x1: number; y1: number; x2: number; y2: number };
  }>;
}

export interface HeatmapChartProps {
  data: HeatmapDataPoint[];
  title?: string;
  description?: string;
  className?: string;
  width?: number;
  height?: number;
  
  // Data configuration
  xAxisLabel?: string;
  yAxisLabel?: string;
  valueLabel?: string;
  
  // Color configuration
  colorScheme?: 'viridis' | 'plasma' | 'inferno' | 'magma' | 'blues' | 'reds' | 'greens' | 'custom';
  customColors?: string[];
  colorSteps?: number;
  
  // Analysis configuration
  correlation?: {
    enabled: boolean;
    method?: 'pearson' | 'spearman' | 'kendall';
    showSignificance?: boolean;
    threshold?: number;
  };
  
  patterns?: {
    enabled: boolean;
    clusterAnalysis?: boolean;
    hotspotDetection?: boolean;
    trendAnalysis?: boolean;
  };
  
  // Visual configuration
  visual?: {
    showGrid?: boolean;
    showLabels?: boolean;
    showLegend?: boolean;
    cellBorder?: boolean;
    cellRadius?: number;
    fontSize?: number;
    opacity?: number;
  };
  
  // Interaction configuration
  interaction?: {
    hover?: boolean;
    click?: boolean;
    zoom?: boolean;
    selection?: boolean;
  };
  
  // Animation configuration
  animation?: {
    enabled: boolean;
    duration?: number;
    stagger?: number;
    type?: 'fade' | 'scale' | 'slide';
  };
  
  // Event handlers
  onCellClick?: (dataPoint: HeatmapDataPoint, position: { x: number; y: number }) => void;
  onCellHover?: (dataPoint: HeatmapDataPoint | null) => void;
  onPatternDetected?: (patterns: PatternAnalysis) => void;
  onCorrelationCalculated?: (correlations: CorrelationData[]) => void;
}

export const HeatmapChart: React.FC<HeatmapChartProps> = ({
  data,
  title,
  description,
  className,
  width = 600,
  height = 400,
  xAxisLabel = 'X Axis',
  yAxisLabel = 'Y Axis',
  valueLabel = 'Value',
  colorScheme = 'viridis',
  customColors,
  colorSteps = 10,
  correlation = { enabled: false, method: 'pearson', showSignificance: true, threshold: 0.5 },
  patterns = { enabled: false, clusterAnalysis: true, hotspotDetection: true, trendAnalysis: true },
  visual = { 
    showGrid: true, 
    showLabels: true, 
    showLegend: true, 
    cellBorder: true, 
    cellRadius: 2,
    fontSize: 12,
    opacity: 1
  },
  interaction = { hover: true, click: true, zoom: false, selection: false },
  animation = { enabled: true, duration: 1000, stagger: 50, type: 'scale' },
  onCellClick,
  onCellHover,
  onPatternDetected,
  onCorrelationCalculated
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredCell, setHoveredCell] = useState<HeatmapDataPoint | null>(null);
  const [selectedCells, setSelectedCells] = useState<HeatmapDataPoint[]>([]);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [showPatterns, setShowPatterns] = useState(false);
  const [calculatedPatterns, setCalculatedPatterns] = useState<PatternAnalysis | null>(null);
  const [correlationMatrix, setCorrelationMatrix] = useState<CorrelationData[]>([]);

  // Color schemes
  const colorSchemes = {
    viridis: ['#440154', '#482777', '#3f4a8a', '#31678e', '#26838f', '#1f9d8a', '#6cce5a', '#b6de2b', '#fee825'],
    plasma: ['#0d0887', '#5302a3', '#8b0aa5', '#b83289', '#db5c68', '#f48849', '#febd2a', '#f0f921'],
    inferno: ['#000004', '#1b0c41', '#4a0c6b', '#781c6d', '#a52c60', '#cf4446', '#ed6925', '#fb9b06', '#fcffa4'],
    magma: ['#000004', '#1c1044', '#4f127b', '#812581', '#b5367a', '#e55964', '#fb8761', '#fec287', '#fcfdbf'],
    blues: ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#08519c', '#08306b'],
    reds: ['#fff5f0', '#fee0d2', '#fcbba1', '#fc9272', '#fb6a4a', '#ef3b2c', '#cb181d', '#a50f15', '#67000d'],
    greens: ['#f7fcf5', '#e5f5e0', '#c7e9c0', '#a1d99b', '#74c476', '#41ab5d', '#238b45', '#006d2c', '#00441b']
  };

  // Get unique x and y values
  const { xValues, yValues } = useMemo(() => {
    const xSet = new Set(data.map(d => d.x));
    const ySet = new Set(data.map(d => d.y));
    return {
      xValues: Array.from(xSet).sort(),
      yValues: Array.from(ySet).sort()
    };
  }, [data]);

  // Calculate value range
  const { minValue, maxValue } = useMemo(() => {
    const values = data.map(d => d.value);
    return {
      minValue: Math.min(...values),
      maxValue: Math.max(...values)
    };
  }, [data]);

  // Generate color scale
  const colorScale = useMemo(() => {
    const colors = customColors || (colorScheme !== 'custom' ? colorSchemes[colorScheme as keyof typeof colorSchemes] : undefined) || colorSchemes.viridis;
    const steps = colorSteps;
    const range = maxValue - minValue;
    
    return (value: number) => {
      if (range === 0) return colors[0];
      
      const normalized = (value - minValue) / range;
      const index = Math.min(Math.floor(normalized * (colors.length - 1)), colors.length - 1);
      
      // Interpolate between colors for smoother gradients
      if (index < colors.length - 1) {
        const t = (normalized * (colors.length - 1)) - index;
        return interpolateColor(colors[index], colors[index + 1], t);
      }
      
      return colors[index];
    };
  }, [customColors, colorScheme, colorSteps, minValue, maxValue]);

  // Color interpolation helper
  const interpolateColor = (color1: string, color2: string, t: number): string => {
    const hex1 = color1.replace('#', '');
    const hex2 = color2.replace('#', '');
    
    const r1 = parseInt(hex1.substr(0, 2), 16);
    const g1 = parseInt(hex1.substr(2, 2), 16);
    const b1 = parseInt(hex1.substr(4, 2), 16);
    
    const r2 = parseInt(hex2.substr(0, 2), 16);
    const g2 = parseInt(hex2.substr(2, 2), 16);
    const b2 = parseInt(hex2.substr(4, 2), 16);
    
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  // Calculate cell dimensions
  const cellWidth = (width - 100) / xValues.length;
  const cellHeight = (height - 100) / yValues.length;

  // Calculate correlations
  const calculateCorrelations = useCallback(() => {
    if (!correlation.enabled) return;
    
    const correlations: CorrelationData[] = [];
    
    // Group data by variables (assuming x and y are variables)
    const variableData: Record<string, number[]> = {};
    
    data.forEach(point => {
      const xKey = String(point.x);
      const yKey = String(point.y);
      
      if (!variableData[xKey]) variableData[xKey] = [];
      if (!variableData[yKey]) variableData[yKey] = [];
      
      variableData[xKey].push(point.value);
      variableData[yKey].push(point.value);
    });
    
    const variables = Object.keys(variableData);
    
    for (let i = 0; i < variables.length; i++) {
      for (let j = i + 1; j < variables.length; j++) {
        const var1 = variables[i];
        const var2 = variables[j];
        const values1 = variableData[var1];
        const values2 = variableData[var2];
        
        if (values1.length === values2.length && values1.length > 1) {
          const corr = calculatePearsonCorrelation(values1, values2);
          const significance = Math.abs(corr) >= (correlation.threshold || 0.5) ? 'high' : 'low';
          
          correlations.push({
            variable1: var1,
            variable2: var2,
            correlation: corr,
            significance
          });
        }
      }
    }
    
    setCorrelationMatrix(correlations);
    onCorrelationCalculated?.(correlations);
  }, [data, correlation.enabled, correlation.threshold]);

  // Pearson correlation calculation
  const calculatePearsonCorrelation = (x: number[], y: number[]): number => {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  };

  // Pattern analysis
  const analyzePatterns = useCallback(() => {
    if (!patterns.enabled) return;
    
    const analysis: PatternAnalysis = {
      clusters: [],
      hotspots: [],
      trends: []
    };
    
    // Simple hotspot detection (high value areas)
    if (patterns.hotspotDetection) {
      const threshold = minValue + (maxValue - minValue) * 0.8; // Top 20% values
      
      data.forEach(point => {
        if (point.value >= threshold) {
          analysis.hotspots.push({
            x: point.x,
            y: point.y,
            intensity: (point.value - minValue) / (maxValue - minValue),
            radius: 20
          });
        }
      });
    }
    
    // Simple trend analysis (look for patterns in rows/columns)
    if (patterns.trendAnalysis) {
      // Analyze horizontal trends
      yValues.forEach(y => {
        const rowData = data.filter(d => d.y === y).sort((a, b) => Number(a.x) - Number(b.x));
        if (rowData.length > 2) {
          const values = rowData.map(d => d.value);
          const trend = calculateTrend(values);
          
          if (Math.abs(trend) > 0.3) {
            analysis.trends.push({
              direction: 'horizontal',
              strength: Math.abs(trend),
              region: {
                x1: 0,
                y1: yValues.indexOf(y),
                x2: xValues.length - 1,
                y2: yValues.indexOf(y)
              }
            });
          }
        }
      });
      
      // Analyze vertical trends
      xValues.forEach(x => {
        const colData = data.filter(d => d.x === x).sort((a, b) => Number(a.y) - Number(b.y));
        if (colData.length > 2) {
          const values = colData.map(d => d.value);
          const trend = calculateTrend(values);
          
          if (Math.abs(trend) > 0.3) {
            analysis.trends.push({
              direction: 'vertical',
              strength: Math.abs(trend),
              region: {
                x1: xValues.indexOf(x),
                y1: 0,
                x2: xValues.indexOf(x),
                y2: yValues.length - 1
              }
            });
          }
        }
      });
    }
    
    setCalculatedPatterns(analysis);
    onPatternDetected?.(analysis);
  }, [data, patterns.enabled, patterns.hotspotDetection, patterns.trendAnalysis, minValue, maxValue, xValues, yValues]);

  // Calculate trend (simple linear regression slope)
  const calculateTrend = (values: number[]): number => {
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, idx) => sum + val * idx, 0);
    const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;
    
    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  };

  // Run analysis when data changes
  React.useEffect(() => {
    if (correlation.enabled) {
      calculateCorrelations();
    }
    if (patterns.enabled) {
      analyzePatterns();
    }
  }, [data, correlation.enabled, patterns.enabled]);

  // Handle cell interactions
  const handleCellClick = useCallback((dataPoint: HeatmapDataPoint, event: React.MouseEvent) => {
    if (!interaction.click) return;
    
    const rect = svgRef.current?.getBoundingClientRect();
    if (rect) {
      const position = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
      
      onCellClick?.(dataPoint, position);
      
      if (interaction.selection) {
        setSelectedCells(prev => {
          const isSelected = prev.some(cell => cell.x === dataPoint.x && cell.y === dataPoint.y);
          if (isSelected) {
            return prev.filter(cell => !(cell.x === dataPoint.x && cell.y === dataPoint.y));
          } else {
            return [...prev, dataPoint];
          }
        });
      }
    }
  }, [interaction, onCellClick]);

  const handleCellHover = useCallback((dataPoint: HeatmapDataPoint | null) => {
    if (!interaction.hover) return;
    
    setHoveredCell(dataPoint);
    onCellHover?.(dataPoint);
  }, [interaction, onCellHover]);

  // Create data lookup for efficient access
  const dataLookup = useMemo(() => {
    const lookup: Record<string, HeatmapDataPoint> = {};
    data.forEach(point => {
      lookup[`${point.x}-${point.y}`] = point;
    });
    return lookup;
  }, [data]);

  // Generate legend
  const legendSteps = useMemo(() => {
    const steps = [];
    const stepSize = (maxValue - minValue) / (colorSteps - 1);
    
    for (let i = 0; i < colorSteps; i++) {
      const value = minValue + i * stepSize;
      steps.push({
        value,
        color: colorScale(value),
        label: value.toFixed(1)
      });
    }
    
    return steps;
  }, [minValue, maxValue, colorSteps, colorScale]);

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Grid3X3 className="h-5 w-5" />
              {title}
            </CardTitle>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {patterns.enabled && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPatterns(!showPatterns)}
                className="h-8 px-3"
              >
                {showPatterns ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span className="ml-1 text-xs">Patterns</span>
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setZoomLevel(1);
                setPanOffset({ x: 0, y: 0 });
                setSelectedCells([]);
              }}
              className="h-8 w-8 p-0"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Statistics */}
        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-muted-foreground">Data Points</div>
            <div className="font-semibold">{data.length}</div>
          </div>
          
          <div className="text-center">
            <div className="text-muted-foreground">Min Value</div>
            <div className="font-semibold">{minValue.toFixed(2)}</div>
          </div>
          
          <div className="text-center">
            <div className="text-muted-foreground">Max Value</div>
            <div className="font-semibold">{maxValue.toFixed(2)}</div>
          </div>
          
          <div className="text-center">
            <div className="text-muted-foreground">Range</div>
            <div className="font-semibold">{(maxValue - minValue).toFixed(2)}</div>
          </div>
        </div>
        
        {/* Correlation results */}
        {correlation.enabled && correlationMatrix.length > 0 && (
          <div className="mt-3 p-3 bg-muted rounded-lg">
            <h4 className="text-sm font-medium mb-2">Strong Correlations</h4>
            <div className="flex flex-wrap gap-2">
              {correlationMatrix
                .filter(corr => corr.significance === 'high')
                .slice(0, 3)
                .map((corr, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {corr.variable1} ↔ {corr.variable2}: {corr.correlation.toFixed(2)}
                  </Badge>
                ))}
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div className="flex gap-4">
          {/* Main heatmap */}
          <div className="flex-1">
            <TooltipProvider>
              <svg
                ref={svgRef}
                width={width}
                height={height}
                className="border rounded-lg"
                style={{ background: '#fafafa' }}
              >
                {/* Grid lines */}
                {visual.showGrid && (
                  <g className="grid-lines">
                    {xValues.map((_, i) => (
                      <line
                        key={`grid-x-${i}`}
                        x1={50 + i * cellWidth}
                        y1={50}
                        x2={50 + i * cellWidth}
                        y2={height - 50}
                        stroke="#e5e7eb"
                        strokeWidth={0.5}
                      />
                    ))}
                    {yValues.map((_, i) => (
                      <line
                        key={`grid-y-${i}`}
                        x1={50}
                        y1={50 + i * cellHeight}
                        x2={width - 50}
                        y2={50 + i * cellHeight}
                        stroke="#e5e7eb"
                        strokeWidth={0.5}
                      />
                    ))}
                  </g>
                )}
                
                {/* Heatmap cells */}
                <g className="heatmap-cells">
                  {yValues.map((y, yIndex) =>
                    xValues.map((x, xIndex) => {
                      const dataPoint = dataLookup[`${x}-${y}`];
                      if (!dataPoint) return null;
                      
                      const cellX = 50 + xIndex * cellWidth;
                      const cellY = 50 + yIndex * cellHeight;
                      const isHovered = hoveredCell?.x === x && hoveredCell?.y === y;
                      const isSelected = selectedCells.some(cell => cell.x === x && cell.y === y);
                      
                      return (
                        <Tooltip key={`${x}-${y}`}>
                          <TooltipTrigger asChild>
                            <motion.rect
                              x={cellX}
                              y={cellY}
                              width={cellWidth - (visual.cellBorder ? 1 : 0)}
                              height={cellHeight - (visual.cellBorder ? 1 : 0)}
                              rx={visual.cellRadius}
                              fill={colorScale(dataPoint.value)}
                              stroke={isSelected ? '#3b82f6' : isHovered ? '#6b7280' : 'transparent'}
                              strokeWidth={isSelected ? 2 : isHovered ? 1 : 0}
                              opacity={visual.opacity}
                              className="cursor-pointer transition-all duration-200"
                              initial={animation.enabled ? { scale: 0, opacity: 0 } : {}}
                              animate={{ scale: 1, opacity: visual.opacity }}
                              transition={{
                                duration: animation.duration ? animation.duration / 1000 : 0.5,
                                delay: animation.stagger ? (xIndex + yIndex) * (animation.stagger / 1000) : 0,
                                type: animation.type === 'scale' ? 'spring' : 'tween'
                              }}
                              whileHover={{ scale: 1.05 }}
                              onClick={(e) => handleCellClick(dataPoint, e)}
                              onMouseEnter={() => handleCellHover(dataPoint)}
                              onMouseLeave={() => handleCellHover(null)}
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-sm">
                              <div className="font-medium">{dataPoint.label || `${x}, ${y}`}</div>
                              <div className="text-muted-foreground">
                                {valueLabel}: {dataPoint.value.toFixed(2)}
                              </div>
                              {dataPoint.category && (
                                <div className="text-muted-foreground">
                                  Category: {dataPoint.category}
                                </div>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })
                  )}
                </g>
                
                {/* Pattern overlays */}
                {showPatterns && calculatedPatterns && (
                  <g className="pattern-overlays">
                    {/* Hotspots */}
                    {calculatedPatterns.hotspots.map((hotspot, index) => {
                      const xIndex = xValues.indexOf(hotspot.x);
                      const yIndex = yValues.indexOf(hotspot.y);
                      if (xIndex === -1 || yIndex === -1) return null;
                      
                      const centerX = 50 + xIndex * cellWidth + cellWidth / 2;
                      const centerY = 50 + yIndex * cellHeight + cellHeight / 2;
                      
                      return (
                        <motion.circle
                          key={`hotspot-${index}`}
                          cx={centerX}
                          cy={centerY}
                          r={hotspot.radius}
                          fill="rgba(239, 68, 68, 0.2)"
                          stroke="#ef4444"
                          strokeWidth={2}
                          strokeDasharray="5,5"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: index * 0.1 }}
                        />
                      );
                    })}
                    
                    {/* Trend lines */}
                    {calculatedPatterns.trends.map((trend, index) => {
                      const x1 = 50 + trend.region.x1 * cellWidth;
                      const y1 = 50 + trend.region.y1 * cellHeight;
                      const x2 = 50 + trend.region.x2 * cellWidth + cellWidth;
                      const y2 = 50 + trend.region.y2 * cellHeight + cellHeight;
                      
                      return (
                        <motion.line
                          key={`trend-${index}`}
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke="#8b5cf6"
                          strokeWidth={3}
                          strokeOpacity={trend.strength}
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ delay: index * 0.2, duration: 1 }}
                        />
                      );
                    })}
                  </g>
                )}
                
                {/* Axis labels */}
                {visual.showLabels && (
                  <g className="axis-labels">
                    {/* X-axis labels */}
                    {xValues.map((x, index) => (
                      <text
                        key={`x-label-${index}`}
                        x={50 + index * cellWidth + cellWidth / 2}
                        y={height - 20}
                        textAnchor="middle"
                        fontSize={visual.fontSize}
                        fill="#6b7280"
                      >
                        {String(x)}
                      </text>
                    ))}
                    
                    {/* Y-axis labels */}
                    {yValues.map((y, index) => (
                      <text
                        key={`y-label-${index}`}
                        x={30}
                        y={50 + index * cellHeight + cellHeight / 2}
                        textAnchor="middle"
                        fontSize={visual.fontSize}
                        fill="#6b7280"
                        dominantBaseline="middle"
                      >
                        {String(y)}
                      </text>
                    ))}
                    
                    {/* Axis titles */}
                    <text
                      x={width / 2}
                      y={height - 5}
                      textAnchor="middle"
                      fontSize={(visual.fontSize || 12) + 2}
                      fill="#374151"
                      fontWeight="500"
                    >
                      {xAxisLabel}
                    </text>
                    
                    <text
                      x={15}
                      y={height / 2}
                      textAnchor="middle"
                      fontSize={(visual.fontSize || 12) + 2}
                      fill="#374151"
                      fontWeight="500"
                      transform={`rotate(-90, 15, ${height / 2})`}
                    >
                      {yAxisLabel}
                    </text>
                  </g>
                )}
              </svg>
            </TooltipProvider>
          </div>
          
          {/* Legend */}
          {visual.showLegend && (
            <div className="w-20 flex flex-col">
              <div className="text-xs font-medium text-center mb-2">{valueLabel}</div>
              <div className="flex-1 flex flex-col justify-between">
                {legendSteps.reverse().map((step, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded border"
                      style={{ backgroundColor: step.color }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Pattern analysis results */}
        {showPatterns && calculatedPatterns && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <h4 className="text-sm font-medium mb-2">Pattern Analysis</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-muted-foreground">Hotspots</div>
                <div className="font-semibold text-red-600">
                  {calculatedPatterns.hotspots.length}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-muted-foreground">Trends</div>
                <div className="font-semibold text-purple-600">
                  {calculatedPatterns.trends.length}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-muted-foreground">Clusters</div>
                <div className="font-semibold text-blue-600">
                  {calculatedPatterns.clusters.length}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Selected cells info */}
        <AnimatePresence>
          {selectedCells.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {selectedCells.length} cell{selectedCells.length > 1 ? 's' : ''} selected
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCells([])}
                  className="h-6 px-2 text-xs"
                >
                  Clear
                </Button>
              </div>
              
              {selectedCells.length === 1 && (
                <div className="mt-2 text-sm text-muted-foreground">
                  Value: {selectedCells[0].value.toFixed(2)}
                </div>
              )}
              
              {selectedCells.length > 1 && (
                <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Avg:</span>
                    <span className="ml-1 font-medium">
                      {(selectedCells.reduce((sum, cell) => sum + cell.value, 0) / selectedCells.length).toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Min:</span>
                    <span className="ml-1 font-medium">
                      {Math.min(...selectedCells.map(cell => cell.value)).toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Max:</span>
                    <span className="ml-1 font-medium">
                      {Math.max(...selectedCells.map(cell => cell.value)).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};