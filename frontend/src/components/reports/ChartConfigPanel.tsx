import React, { useState } from 'react';
import { useDrop } from 'react-dnd';
import { VisualizationConfig, ChartStyling, DragItem, FieldDefinition } from '../../types/reportBuilder';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { 
  BarChart3, 
  LineChart, 
  PieChart, 
  ScatterChart,
  Activity,
  Table,
  Palette,
  Settings,
  Eye,
  Grid,
  Type,
  Hash,
  Plus,
  X,
  Move,
  Database
} from 'lucide-react';

interface ChartConfigPanelProps {
  visualization: VisualizationConfig;
  onUpdate: (updates: Partial<VisualizationConfig>) => void;
  onClose?: () => void;
  availableFields?: FieldDefinition[];
}

const CHART_TYPES = [
  { value: 'bar', label: 'Bar Chart', icon: BarChart3, description: 'Compare values across categories' },
  { value: 'line', label: 'Line Chart', icon: LineChart, description: 'Show trends over time' },
  { value: 'pie', label: 'Pie Chart', icon: PieChart, description: 'Show proportions of a whole' },
  { value: 'scatter', label: 'Scatter Plot', icon: ScatterChart, description: 'Show correlation between variables' },
  { value: 'area', label: 'Area Chart', icon: Activity, description: 'Show cumulative values over time' },
  { value: 'heatmap', label: 'Heatmap', icon: Grid, description: 'Show data density or correlation' }
];

const VISUALIZATION_TYPES = [
  { value: 'chart', label: 'Chart', icon: BarChart3, description: 'Visual data representation' },
  { value: 'table', label: 'Table', icon: Table, description: 'Tabular data display' },
  { value: 'metric', label: 'Metric', icon: Hash, description: 'Single value display' },
  { value: 'text', label: 'Text', icon: Type, description: 'Custom text content' }
];

const DEFAULT_COLOR_PALETTES = [
  {
    name: 'Default',
    colors: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#f97316']
  },
  {
    name: 'Professional',
    colors: ['#1f2937', '#374151', '#6b7280', '#9ca3af', '#d1d5db', '#e5e7eb', '#f3f4f6']
  },
  {
    name: 'Vibrant',
    colors: ['#ec4899', '#8b5cf6', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444']
  },
  {
    name: 'Earth',
    colors: ['#92400e', '#b45309', '#d97706', '#f59e0b', '#fbbf24', '#fcd34d', '#fde68a']
  },
  {
    name: 'Ocean',
    colors: ['#1e3a8a', '#1e40af', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe']
  }
];

export const ChartConfigPanel: React.FC<ChartConfigPanelProps> = ({
  visualization,
  onUpdate,
  onClose,
  availableFields = []
}) => {
  const [activeTab, setActiveTab] = useState('type');
  const [customColors, setCustomColors] = useState<string[]>(
    visualization.styling.colors || DEFAULT_COLOR_PALETTES[0].colors
  );

  // Drag and drop for dimensions
  const [{ isOverDimensions }, dropDimensions] = useDrop(() => ({
    accept: 'field',
    drop: (item: DragItem) => {
      if (item.field && !visualization.dimensions.includes(item.field.id)) {
        onUpdate({
          dimensions: [...visualization.dimensions, item.field.id]
        });
      }
    },
    collect: (monitor) => ({
      isOverDimensions: monitor.isOver(),
    }),
  }));

  // Drag and drop for measures
  const [{ isOverMeasures }, dropMeasures] = useDrop(() => ({
    accept: 'field',
    drop: (item: DragItem) => {
      if (item.field && item.field.aggregatable && !visualization.measures.includes(item.field.id)) {
        onUpdate({
          measures: [...visualization.measures, item.field.id]
        });
      }
    },
    collect: (monitor) => ({
      isOverMeasures: monitor.isOver(),
    }),
  }));

  const handleVisualizationTypeChange = (type: string) => {
    const updates: Partial<VisualizationConfig> = { type: type as any };
    
    // Reset chart type if switching away from chart
    if (type !== 'chart') {
      updates.chartType = undefined;
    } else if (!visualization.chartType) {
      updates.chartType = 'bar';
    }
    
    onUpdate(updates);
  };

  const handleChartTypeChange = (chartType: string) => {
    onUpdate({ chartType: chartType as any });
  };

  const handleStylingUpdate = (updates: Partial<ChartStyling>) => {
    onUpdate({
      styling: {
        ...visualization.styling,
        ...updates
      }
    });
  };

  const handleColorPaletteSelect = (palette: typeof DEFAULT_COLOR_PALETTES[0]) => {
    setCustomColors(palette.colors);
    handleStylingUpdate({ colors: palette.colors });
  };

  const handleCustomColorChange = (index: number, color: string) => {
    const newColors = [...customColors];
    newColors[index] = color;
    setCustomColors(newColors);
    handleStylingUpdate({ colors: newColors });
  };

  const addCustomColor = () => {
    const newColors = [...customColors, '#3b82f6'];
    setCustomColors(newColors);
    handleStylingUpdate({ colors: newColors });
  };

  const removeCustomColor = (index: number) => {
    if (customColors.length > 1) {
      const newColors = customColors.filter((_, i) => i !== index);
      setCustomColors(newColors);
      handleStylingUpdate({ colors: newColors });
    }
  };

  return (
    <Card className="w-full max-w-2xl border-0 shadow-xl bg-gradient-to-br from-slate-50 to-white">
      <CardHeader className="pb-4 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-b-2 border-indigo-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold text-foreground">Chart Configuration</CardTitle>
              <p className="text-sm text-muted-foreground">Customize your visualization settings</p>
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="hover:bg-white hover:shadow-md transition-all duration-300">
              ×
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-2 border-indigo-200 rounded-lg p-1 mb-6">
            <TabsList className="grid w-full grid-cols-3 bg-transparent h-auto p-1 gap-1">
              <TabsTrigger 
                value="type" 
                className="flex items-center gap-2 p-3 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-indigo-300"
              >
                <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center">
                  <BarChart3 className="w-3 h-3 text-indigo-600" />
                </div>
                <span className="font-medium text-sm">Type & Layout</span>
              </TabsTrigger>
              <TabsTrigger 
                value="styling" 
                className="flex items-center gap-2 p-3 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-purple-300"
              >
                <div className="h-6 w-6 rounded-full bg-purple-100 flex items-center justify-center">
                  <Palette className="w-3 h-3 text-purple-600" />
                </div>
                <span className="font-medium text-sm">Colors & Style</span>
              </TabsTrigger>
              <TabsTrigger 
                value="options" 
                className="flex items-center gap-2 p-3 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-pink-300"
              >
                <div className="h-6 w-6 rounded-full bg-pink-100 flex items-center justify-center">
                  <Eye className="w-3 h-3 text-pink-600" />
                </div>
                <span className="font-medium text-sm">Display Options</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="type" className="space-y-6 mt-0">
            <div className="bg-gradient-to-br from-indigo-50/30 to-white p-4 rounded-lg">
              {/* Field Configuration */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                    <Database className="h-4 w-4 text-white" />
                  </div>
                  <Label className="text-sm font-medium">Data Fields</Label>
                </div>
                
                {/* Dimensions Drop Zone */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">Dimensions (Categories)</Label>
                  <div
                    ref={dropDimensions}
                    className={`
                      min-h-[60px] p-3 border-2 border-dashed rounded-lg transition-all duration-300 shadow-sm
                      ${isOverDimensions 
                        ? 'border-blue-400 bg-gradient-to-r from-blue-50 to-blue-100 shadow-lg' 
                        : 'border-muted-foreground/25 bg-gradient-to-r from-slate-50 to-slate-100/50'
                      }
                    `}
                  >
                  {visualization.dimensions.length === 0 ? (
                    <div className="flex items-center justify-center h-12 text-sm text-muted-foreground">
                      <Move className="w-4 h-4 mr-2" />
                      Drop dimension fields here
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {visualization.dimensions.map((dimensionId) => {
                        const field = availableFields.find(f => f.id === dimensionId);
                        return (
                          <Badge key={dimensionId} variant="secondary" className="flex items-center gap-1">
                            <Type className="w-3 h-3" />
                            {field?.displayName || dimensionId}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 ml-1"
                              onClick={() => onUpdate({
                                dimensions: visualization.dimensions.filter(d => d !== dimensionId)
                              })}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

                {/* Measures Drop Zone */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">Measures (Values)</Label>
                  <div
                    ref={dropMeasures}
                    className={`
                      min-h-[60px] p-3 border-2 border-dashed rounded-lg transition-all duration-300 shadow-sm
                      ${isOverMeasures 
                        ? 'border-green-400 bg-gradient-to-r from-green-50 to-green-100 shadow-lg' 
                        : 'border-muted-foreground/25 bg-gradient-to-r from-slate-50 to-slate-100/50'
                      }
                    `}
                  >
                  {visualization.measures.length === 0 ? (
                    <div className="flex items-center justify-center h-12 text-sm text-muted-foreground">
                      <Hash className="w-4 h-4 mr-2" />
                      Drop measure fields here
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {visualization.measures.map((measureId) => {
                        const field = availableFields.find(f => f.id === measureId);
                        return (
                          <Badge key={measureId} variant="secondary" className="flex items-center gap-1">
                            <Hash className="w-3 h-3" />
                            {field?.displayName || measureId}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 ml-1"
                              onClick={() => onUpdate({
                                measures: visualization.measures.filter(m => m !== measureId)
                              })}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

              {/* Visualization Type Selection */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                    <Eye className="h-4 w-4 text-white" />
                  </div>
                  <Label className="text-sm font-medium">Visualization Type</Label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {VISUALIZATION_TYPES.map((type) => {
                    const Icon = type.icon;
                    return (
                      <div
                        key={type.value}
                        className={`
                          p-3 border-0 rounded-lg cursor-pointer transition-all duration-300 shadow-lg hover:shadow-xl
                          ${visualization.type === type.value 
                            ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-xl' 
                            : 'bg-gradient-to-r from-slate-50 to-slate-100 hover:from-indigo-50 hover:to-purple-50'
                          }
                        `}
                        onClick={() => handleVisualizationTypeChange(type.value)}
                      >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="w-4 h-4" />
                        <span className="font-medium text-sm">{type.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{type.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>

              {/* Chart Type Selection (only for chart visualizations) */}
              {visualization.type === 'chart' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center">
                      <BarChart3 className="h-4 w-4 text-white" />
                    </div>
                    <Label className="text-sm font-medium">Chart Type</Label>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {CHART_TYPES.map((chart) => {
                      const Icon = chart.icon;
                      return (
                        <div
                          key={chart.value}
                          className={`
                            p-3 border-0 rounded-lg cursor-pointer transition-all duration-300 shadow-lg hover:shadow-xl
                            ${visualization.chartType === chart.value 
                              ? 'bg-gradient-to-r from-green-500 to-teal-600 text-white shadow-xl' 
                              : 'bg-gradient-to-r from-slate-50 to-slate-100 hover:from-green-50 hover:to-teal-50'
                            }
                          `}
                          onClick={() => handleChartTypeChange(chart.value)}
                        >
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className="w-4 h-4" />
                          <span className="font-medium text-sm">{chart.label}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{chart.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Title and Labels */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="chart-title" className="text-sm font-medium">Chart Title</Label>
                <Input
                  id="chart-title"
                  value={visualization.styling.title || ''}
                  onChange={(e) => handleStylingUpdate({ title: e.target.value })}
                  placeholder="Enter chart title"
                />
              </div>

              {visualization.type === 'chart' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="x-axis-label" className="text-sm font-medium">X-Axis Label</Label>
                    <Input
                      id="x-axis-label"
                      value={visualization.styling.xAxisLabel || ''}
                      onChange={(e) => handleStylingUpdate({ xAxisLabel: e.target.value })}
                      placeholder="X-axis label"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="y-axis-label" className="text-sm font-medium">Y-Axis Label</Label>
                    <Input
                      id="y-axis-label"
                      value={visualization.styling.yAxisLabel || ''}
                      onChange={(e) => handleStylingUpdate({ yAxisLabel: e.target.value })}
                      placeholder="Y-axis label"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          </TabsContent>

          <TabsContent value="styling" className="space-y-6 mt-0">
            <div className="bg-gradient-to-br from-purple-50/30 to-white p-4 rounded-lg">
              {/* Color Palette Selection */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
                    <Palette className="h-4 w-4 text-white" />
                  </div>
                  <Label className="text-sm font-medium">Color Palette</Label>
                </div>
                <div className="space-y-3">
                  {DEFAULT_COLOR_PALETTES.map((palette) => (
                    <div
                      key={palette.name}
                      className={`
                        p-3 border-0 rounded-lg cursor-pointer transition-all duration-300 shadow-lg hover:shadow-xl
                        ${JSON.stringify(visualization.styling.colors) === JSON.stringify(palette.colors)
                          ? 'bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-xl'
                          : 'bg-gradient-to-r from-slate-50 to-slate-100 hover:from-purple-50 hover:to-violet-50'
                        }
                      `}
                      onClick={() => handleColorPaletteSelect(palette)}
                    >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{palette.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {palette.colors.length} colors
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      {palette.colors.map((color, index) => (
                        <div
                          key={index}
                          className="w-6 h-6 rounded border border-border"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Colors */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Custom Colors</Label>
                <Button variant="outline" size="sm" onClick={addCustomColor}>
                  Add Color
                </Button>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {customColors.map((color, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => handleCustomColorChange(index, e.target.value)}
                        className="w-8 h-8 rounded border border-border cursor-pointer"
                      />
                      <Input
                        value={color}
                        onChange={(e) => handleCustomColorChange(index, e.target.value)}
                        className="text-xs"
                        placeholder="#000000"
                      />
                      {customColors.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCustomColor(index)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          ×
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          </TabsContent>

          <TabsContent value="options" className="space-y-6 mt-0">
            <div className="bg-gradient-to-br from-pink-50/30 to-white p-4 rounded-lg">
              {/* Display Options */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                    <Eye className="h-4 w-4 text-white" />
                  </div>
                  <Label className="text-sm font-medium">Display Options</Label>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg shadow-sm">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Show Legend</Label>
                    <p className="text-xs text-muted-foreground">Display chart legend</p>
                  </div>
                  <Switch
                    checked={visualization.styling.showLegend}
                    onCheckedChange={(checked) => handleStylingUpdate({ showLegend: checked })}
                  />
                </div>

                {visualization.type === 'chart' && (
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg shadow-sm">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">Show Grid</Label>
                      <p className="text-xs text-muted-foreground">Display grid lines</p>
                    </div>
                    <Switch
                      checked={visualization.styling.showGrid}
                      onCheckedChange={(checked) => handleStylingUpdate({ showGrid: checked })}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg shadow-sm">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Show Data Labels</Label>
                    <p className="text-xs text-muted-foreground">Display values on chart</p>
                  </div>
                  <Switch
                    checked={visualization.styling.showDataLabels || false}
                    onCheckedChange={(checked) => handleStylingUpdate({ showDataLabels: checked })}
                  />
                </div>

              {visualization.type === 'chart' && visualization.chartType === 'line' && (
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Smooth Lines</Label>
                    <p className="text-xs text-muted-foreground">Use curved line interpolation</p>
                  </div>
                  <Switch
                    checked={visualization.styling.smoothLines || false}
                    onCheckedChange={(checked) => handleStylingUpdate({ smoothLines: checked })}
                  />
                </div>
              )}

              {visualization.type === 'chart' && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Animation Duration (ms)</Label>
                  <Input
                    type="number"
                    value={visualization.styling.animationDuration || 1000}
                    onChange={(e) => handleStylingUpdate({ 
                      animationDuration: parseInt(e.target.value) || 1000 
                    })}
                    min="0"
                    max="5000"
                    step="100"
                  />
                </div>
              )}
            </div>

              {/* Preview */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Preview
                </Label>
                <div className="p-4 border rounded-lg bg-muted/20">
                  <div className="text-center text-sm text-muted-foreground">
                    {visualization.styling.title && (
                      <div className="font-medium mb-2">{visualization.styling.title}</div>
                    )}
                    <div className="flex items-center justify-center gap-2 mb-2">
                      {visualization.type === 'chart' && visualization.chartType && (
                        <>
                          {CHART_TYPES.find(t => t.value === visualization.chartType)?.icon && 
                            React.createElement(
                              CHART_TYPES.find(t => t.value === visualization.chartType)!.icon,
                              { className: "w-8 h-8" }
                            )
                          }
                          <span>{CHART_TYPES.find(t => t.value === visualization.chartType)?.label}</span>
                        </>
                      )}
                    </div>
                    <div className="flex justify-center gap-1 mb-2">
                      {visualization.styling.colors?.slice(0, 5).map((color, index) => (
                        <div
                          key={index}
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <div className="text-xs space-y-1">
                      {visualization.styling.showLegend && <div>✓ Legend enabled</div>}
                      {visualization.styling.showGrid && <div>✓ Grid enabled</div>}
                      {visualization.styling.showDataLabels && <div>✓ Data labels enabled</div>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};