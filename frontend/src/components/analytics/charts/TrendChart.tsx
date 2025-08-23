import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ReferenceArea,
  Brush
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Play,
  Pause,
  RotateCcw,
  Zap,
  AlertTriangle,
  CheckCircle,
  Activity,
  MessageSquare
} from 'lucide-react';
import { ChartExportMenu } from './ChartExportMenu';
import { ChartAnnotations } from './ChartAnnotations';

export interface TrendDataPoint {
  timestamp: string;
  value: number;
  target?: number;
  prediction?: number;
  confidence?: number;
  anomaly?: boolean;
  category?: string;
  metadata?: Record<string, any>;
}

export interface TrendAnalysis {
  direction: 'up' | 'down' | 'stable';
  strength: 'weak' | 'moderate' | 'strong';
  confidence: number;
  changeRate: number;
  volatility: number;
  seasonality?: {
    detected: boolean;
    period?: number;
    strength?: number;
  };
}

export interface TrendChartProps {
  data: TrendDataPoint[];
  title?: string;
  description?: string;
  className?: string;
  height?: number;
  
  // Real-time configuration
  realTime?: {
    enabled: boolean;
    interval?: number; // milliseconds
    maxDataPoints?: number;
    onDataUpdate?: (newData: TrendDataPoint[]) => void;
  };
  
  // Animation configuration
  animation?: {
    enabled: boolean;
    duration?: number;
    easing?: string;
    staggerDelay?: number;
  };
  
  // Trend analysis
  analysis?: {
    enabled: boolean;
    windowSize?: number; // number of data points for analysis
    showPrediction?: boolean;
    showConfidenceBands?: boolean;
    anomalyDetection?: boolean;
  };
  
  // Visual configuration
  visual?: {
    showTarget?: boolean;
    showGrid?: boolean;
    showBrush?: boolean;
    gradientFill?: boolean;
    sparkline?: boolean;
  };
  
  // Styling
  colors?: {
    primary: string;
    secondary: string;
    target: string;
    prediction: string;
    anomaly: string;
    confidence: string;
  };
  
  // Event handlers
  onTrendChange?: (analysis: TrendAnalysis) => void;
  onAnomalyDetected?: (dataPoint: TrendDataPoint, index: number) => void;
  onDataPointClick?: (dataPoint: TrendDataPoint, index: number) => void;
  
  // Export and sharing
  enableExport?: boolean;
  enableAnnotations?: boolean;
  chartId?: string;
  currentUser?: {
    name: string;
    avatar?: string;
  };
}

export const TrendChart: React.FC<TrendChartProps> = ({
  data: initialData,
  title,
  description,
  className,
  height = 400,
  realTime = { enabled: false, interval: 5000, maxDataPoints: 100 },
  animation = { enabled: true, duration: 1000, easing: 'easeInOut', staggerDelay: 50 },
  analysis = { enabled: true, windowSize: 20, showPrediction: true, showConfidenceBands: true, anomalyDetection: true },
  visual = { showTarget: true, showGrid: true, showBrush: false, gradientFill: true, sparkline: false },
  colors = {
    primary: '#3b82f6',
    secondary: '#10b981',
    target: '#f59e0b',
    prediction: '#8b5cf6',
    anomaly: '#ef4444',
    confidence: '#6b7280'
  },
  onTrendChange,
  onAnomalyDetected,
  onDataPointClick,
  enableExport = true,
  enableAnnotations = false,
  chartId = 'trend-chart-' + Date.now(),
  currentUser = { name: 'Anonymous User' }
}) => {
  const [data, setData] = useState<TrendDataPoint[]>(initialData);
  const [isPlaying, setIsPlaying] = useState(realTime.enabled);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [trendAnalysis, setTrendAnalysis] = useState<TrendAnalysis | null>(null);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [showAnnotations, setShowAnnotations] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  // Calculate trend analysis
  const calculateTrendAnalysis = useCallback((dataPoints: TrendDataPoint[]): TrendAnalysis => {
    if (dataPoints.length < 2) {
      return {
        direction: 'stable',
        strength: 'weak',
        confidence: 0,
        changeRate: 0,
        volatility: 0
      };
    }

    const windowSize = Math.min(analysis.windowSize || 20, dataPoints.length);
    const recentData = dataPoints.slice(-windowSize);
    const values = recentData.map(d => d.value);
    
    // Calculate linear regression for trend direction
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, idx) => sum + val * idx, 0);
    const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate R-squared for confidence
    const yMean = sumY / n;
    const ssRes = values.reduce((sum, val, idx) => {
      const predicted = slope * idx + intercept;
      return sum + Math.pow(val - predicted, 2);
    }, 0);
    const ssTot = values.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0);
    const rSquared = 1 - (ssRes / ssTot);
    
    // Calculate volatility (standard deviation)
    const volatility = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0) / n);
    
    // Determine trend direction and strength
    const changeRate = (slope / yMean) * 100; // percentage change per period
    const absChangeRate = Math.abs(changeRate);
    
    let direction: 'up' | 'down' | 'stable' = 'stable';
    if (absChangeRate > 0.5) {
      direction = changeRate > 0 ? 'up' : 'down';
    }
    
    let strength: 'weak' | 'moderate' | 'strong' = 'weak';
    if (absChangeRate > 2) strength = 'moderate';
    if (absChangeRate > 5) strength = 'strong';
    
    // Detect seasonality (simplified)
    const seasonality = {
      detected: false,
      period: undefined as number | undefined,
      strength: undefined as number | undefined
    };
    
    if (dataPoints.length >= 24) { // Need at least 24 points for seasonality detection
      // Simple autocorrelation for common periods (7, 30, 365 days)
      const periods = [7, 30];
      let maxCorrelation = 0;
      let bestPeriod = 0;
      
      periods.forEach(period => {
        if (dataPoints.length >= period * 2) {
          const correlation = calculateAutocorrelation(values, period);
          if (correlation > maxCorrelation) {
            maxCorrelation = correlation;
            bestPeriod = period;
          }
        }
      });
      
      if (maxCorrelation > 0.3) {
        seasonality.detected = true;
        seasonality.period = bestPeriod;
        seasonality.strength = maxCorrelation;
      }
    }
    
    return {
      direction,
      strength,
      confidence: Math.max(0, Math.min(1, rSquared)),
      changeRate,
      volatility,
      seasonality
    };
  }, [analysis.windowSize]);

  // Helper function for autocorrelation
  const calculateAutocorrelation = (values: number[], lag: number): number => {
    if (values.length <= lag) return 0;
    
    const n = values.length - lag;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n; i++) {
      numerator += (values[i] - mean) * (values[i + lag] - mean);
    }
    
    for (let i = 0; i < values.length; i++) {
      denominator += Math.pow(values[i] - mean, 2);
    }
    
    return denominator === 0 ? 0 : numerator / denominator;
  };

  // Detect anomalies using z-score
  const detectAnomalies = useCallback((dataPoints: TrendDataPoint[]): TrendDataPoint[] => {
    if (!analysis.anomalyDetection || dataPoints.length < 10) return dataPoints;
    
    const values = dataPoints.map(d => d.value);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);
    
    return dataPoints.map((point, index) => {
      const zScore = Math.abs((point.value - mean) / stdDev);
      const isAnomaly = zScore > 2.5; // 2.5 standard deviations
      
      if (isAnomaly && !point.anomaly) {
        onAnomalyDetected?.(point, index);
      }
      
      return {
        ...point,
        anomaly: isAnomaly
      };
    });
  }, [analysis.anomalyDetection, onAnomalyDetected]);

  // Generate predictions using simple linear regression
  const generatePredictions = useCallback((dataPoints: TrendDataPoint[], steps: number = 5): TrendDataPoint[] => {
    if (!analysis.showPrediction || dataPoints.length < 5) return [];
    
    const values = dataPoints.map(d => d.value);
    const n = values.length;
    
    // Calculate linear regression
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, idx) => sum + val * idx, 0);
    const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate prediction confidence
    const yMean = sumY / n;
    const ssRes = values.reduce((sum, val, idx) => {
      const predicted = slope * idx + intercept;
      return sum + Math.pow(val - predicted, 2);
    }, 0);
    const mse = ssRes / (n - 2);
    const confidence = Math.max(0, Math.min(1, 1 - (mse / (yMean * yMean))));
    
    // Generate future predictions
    const lastTimestamp = new Date(dataPoints[dataPoints.length - 1].timestamp);
    const predictions: TrendDataPoint[] = [];
    
    for (let i = 1; i <= steps; i++) {
      const futureTimestamp = new Date(lastTimestamp.getTime() + i * 24 * 60 * 60 * 1000); // Assume daily data
      const predictedValue = slope * (n + i - 1) + intercept;
      
      predictions.push({
        timestamp: futureTimestamp.toISOString(),
        value: 0, // Not a real value
        prediction: Math.max(0, predictedValue),
        confidence: confidence * (1 - i * 0.1) // Decrease confidence over time
      });
    }
    
    return predictions;
  }, [analysis.showPrediction]);

  // Process data with analysis
  const processedData = useMemo(() => {
    let processed = detectAnomalies(data);
    
    if (analysis.showPrediction) {
      const predictions = generatePredictions(processed);
      processed = [...processed, ...predictions];
    }
    
    return processed;
  }, [data, detectAnomalies, generatePredictions, analysis.showPrediction]);

  // Update trend analysis when data changes
  useEffect(() => {
    const newAnalysis = calculateTrendAnalysis(data);
    setTrendAnalysis(newAnalysis);
    onTrendChange?.(newAnalysis);
  }, [data, calculateTrendAnalysis, onTrendChange]);

  // Real-time data simulation
  useEffect(() => {
    if (!realTime.enabled || !isPlaying) return;
    
    const interval = setInterval(() => {
      setData(prevData => {
        const newDataPoint: TrendDataPoint = {
          timestamp: new Date().toISOString(),
          value: Math.random() * 100 + 50, // Simulate new data
          target: 75
        };
        
        const updatedData = [...prevData, newDataPoint];
        const maxPoints = realTime.maxDataPoints || 100;
        
        if (updatedData.length > maxPoints) {
          updatedData.shift();
        }
        
        realTime.onDataUpdate?.(updatedData);
        return updatedData;
      });
    }, realTime.interval || 5000);
    
    return () => clearInterval(interval);
  }, [realTime, isPlaying]);

  // Animation progress tracking
  useEffect(() => {
    if (!animation.enabled) return;
    
    const duration = animation.duration || 1000;
    const steps = 60; // 60 FPS
    const stepDuration = duration / steps;
    let currentStep = 0;
    
    const animationInterval = setInterval(() => {
      currentStep++;
      const progress = Math.min(currentStep / steps, 1);
      setAnimationProgress(progress);
      
      if (progress >= 1) {
        clearInterval(animationInterval);
      }
    }, stepDuration);
    
    return () => clearInterval(animationInterval);
  }, [data, animation]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    
    const data = payload[0].payload;
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-background border border-border rounded-lg shadow-lg p-3 max-w-xs"
      >
        <p className="font-medium text-sm mb-2">
          {new Date(label).toLocaleDateString()}
        </p>
        
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm mb-1">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium">{entry.value?.toLocaleString()}</span>
          </div>
        ))}
        
        {data.anomaly && (
          <div className="mt-2 pt-2 border-t border-border">
            <div className="flex items-center gap-1 text-xs text-red-600">
              <AlertTriangle className="h-3 w-3" />
              <span>Anomaly detected</span>
            </div>
          </div>
        )}
        
        {data.confidence && (
          <div className="mt-1">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Confidence:</span>
              <span className="font-medium">{(data.confidence * 100).toFixed(0)}%</span>
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  // Trend indicator component
  const TrendIndicator = () => {
    if (!trendAnalysis) return null;
    
    const { direction, strength, confidence, changeRate } = trendAnalysis;
    
    const getIcon = () => {
      switch (direction) {
        case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
        case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
        default: return <Minus className="h-4 w-4 text-gray-600" />;
      }
    };
    
    const getColor = () => {
      switch (direction) {
        case 'up': return 'text-green-600';
        case 'down': return 'text-red-600';
        default: return 'text-gray-600';
      }
    };
    
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          {getIcon()}
          <span className={cn('text-sm font-medium', getColor())}>
            {direction.toUpperCase()}
          </span>
        </div>
        
        <Badge variant="outline" className="text-xs">
          {strength} ({(confidence * 100).toFixed(0)}%)
        </Badge>
        
        <span className={cn('text-sm', getColor())}>
          {changeRate > 0 ? '+' : ''}{changeRate.toFixed(1)}%
        </span>
        
        {trendAnalysis.seasonality?.detected && (
          <Badge variant="secondary" className="text-xs">
            Seasonal
          </Badge>
        )}
      </div>
    );
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Activity className="h-5 w-5" />
              {title}
            </CardTitle>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          
          {/* Controls */}
          <div className="flex items-center gap-2">
            {realTime.enabled && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="h-8 w-8 p-0"
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setData(initialData)}
                  className="h-8 w-8 p-0"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                
                {isPlaying && (
                  <div className="flex items-center gap-1">
                    <Zap className="h-3 w-3 text-green-600" />
                    <span className="text-xs text-green-600">Live</span>
                  </div>
                )}
              </>
            )}
            
            {enableExport && (
              <ChartExportMenu
                chartElement={chartRef.current}
                chartData={processedData}
                chartConfig={{ type: 'trend', data: processedData, title, description }}
                chartId={chartId}
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
          </div>
        </div>
        
        {/* Trend analysis display */}
        {analysis.enabled && trendAnalysis && (
          <div className="mt-3 p-3 bg-muted rounded-lg">
            <TrendIndicator />
            
            {animation.enabled && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Animation Progress</span>
                  <span>{(animationProgress * 100).toFixed(0)}%</span>
                </div>
                <Progress value={animationProgress * 100} className="h-1" />
              </div>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div className="relative">
          <div ref={chartRef} style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
              data={processedData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              onClick={(data) => {
                if (data && data.activePayload) {
                  const dataPoint = data.activePayload[0].payload;
                  onDataPointClick?.(dataPoint, data.activeTooltipIndex || 0);
                }
              }}
            >
              {visual.showGrid && (
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
              )}
              
              <XAxis 
                dataKey="timestamp"
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
                stroke="#6b7280"
              />
              <YAxis stroke="#6b7280" />
              
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {visual.showBrush && <Brush dataKey="timestamp" height={30} />}
              
              {/* Main trend line */}
              <Line
                type="monotone"
                dataKey="value"
                stroke={colors.primary}
                strokeWidth={2}
                dot={(props: any) => {
                  const { payload } = props;
                  if (payload?.anomaly) {
                    return (
                      <circle
                        {...props}
                        r={6}
                        fill={colors.anomaly}
                        stroke={colors.anomaly}
                        strokeWidth={2}
                      />
                    );
                  }
                  return <circle {...props} r={3} fill={colors.primary} />;
                }}
                activeDot={{ r: 6, stroke: colors.primary, strokeWidth: 2 }}
                animationDuration={animation.enabled ? animation.duration : 0}
                animationBegin={animation.enabled ? (animation.staggerDelay || 0) : 0}
              />
              
              {/* Target line */}
              {visual.showTarget && (
                <Line
                  type="monotone"
                  dataKey="target"
                  stroke={colors.target}
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Target"
                />
              )}
              
              {/* Prediction line */}
              {analysis.showPrediction && (
                <Line
                  type="monotone"
                  dataKey="prediction"
                  stroke={colors.prediction}
                  strokeWidth={2}
                  strokeDasharray="3 3"
                  dot={false}
                  name="Prediction"
                  animationDuration={animation.enabled ? animation.duration : 0}
                  animationBegin={animation.enabled ? (animation.staggerDelay || 0) + 500 : 0}
                />
              )}
            </LineChart>
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
        
        {/* Data summary */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-muted-foreground">Data Points</div>
            <div className="font-semibold">{data.length}</div>
          </div>
          
          <div className="text-center">
            <div className="text-muted-foreground">Anomalies</div>
            <div className="font-semibold text-red-600">
              {processedData.filter(d => d.anomaly).length}
            </div>
          </div>
          
          {trendAnalysis && (
            <>
              <div className="text-center">
                <div className="text-muted-foreground">Volatility</div>
                <div className="font-semibold">
                  {trendAnalysis.volatility.toFixed(1)}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-muted-foreground">Confidence</div>
                <div className="font-semibold">
                  {(trendAnalysis.confidence * 100).toFixed(0)}%
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};