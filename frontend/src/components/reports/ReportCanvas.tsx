import React, { useCallback, useState } from 'react';
import { useDrop, DropTargetMonitor } from 'react-dnd';
import { 
  ReportConfiguration, 
  VisualizationConfig, 
  DragItem, 
  FieldDefinition 
} from '../../types/reportBuilder';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { 
  Trash2, 
  Settings, 
  BarChart3, 
  LineChart, 
  PieChart, 
  Table
} from 'lucide-react';
import { ChartConfigPanel } from './ChartConfigPanel';

interface ReportCanvasProps {
  reportConfig: ReportConfiguration;
  onVisualizationAdd: (visualization: VisualizationConfig) => void;
  onVisualizationUpdate: (id: string, updates: Partial<VisualizationConfig>) => void;
  onVisualizationRemove: (id: string) => void;
}

export const ReportCanvas: React.FC<ReportCanvasProps> = ({
  reportConfig,
  onVisualizationAdd,
  onVisualizationUpdate,
  onVisualizationRemove
}) => {
  const [selectedVisualization, setSelectedVisualization] = useState<string | null>(null);
  const [showConfigPanel, setShowConfigPanel] = useState(false);

  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: ['field', 'visualization'],
    drop: (item: DragItem, monitor: DropTargetMonitor) => {
      const offset = monitor.getClientOffset();
      const canvasRect = monitor.getDropResult() as any;
      
      if (offset && item.field) {
        // Calculate position relative to canvas
        const canvasElement = document.querySelector('[data-canvas="true"]') as HTMLElement;
        if (canvasElement) {
          const rect = canvasElement.getBoundingClientRect();
          const x = Math.max(0, offset.x - rect.left);
          const y = Math.max(0, offset.y - rect.top);
          handleFieldDrop(item.field, { x, y });
        }
      }
    },
    collect: (monitor: DropTargetMonitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }));

  const handleFieldDrop = useCallback((field: FieldDefinition, position: { x: number; y: number }) => {
    // Create a new visualization based on the field type
    const visualizationType = field.aggregatable ? 'chart' : 'table';
    const chartType = field.dataType === 'number' || field.dataType === 'decimal' ? 'bar' : 'line';

    const newVisualization: VisualizationConfig = {
      id: `viz_${Date.now()}`,
      type: visualizationType,
      chartType: visualizationType === 'chart' ? chartType : undefined,
      dimensions: field.aggregatable ? [] : [field.id],
      measures: field.aggregatable ? [field.id] : [],
      styling: {
        colors: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'],
        showLegend: true,
        showGrid: true,
        title: `${field.displayName} Analysis`
      },
      position: {
        x: Math.max(0, position.x - 200),
        y: Math.max(0, position.y - 100),
        width: 400,
        height: 300
      }
    };

    onVisualizationAdd(newVisualization);
  }, [onVisualizationAdd]);

  const getVisualizationIcon = (type: string, chartType?: string) => {
    if (type === 'table') return <Table className="w-4 h-4" />;
    
    switch (chartType) {
      case 'line':
        return <LineChart className="w-4 h-4" />;
      case 'pie':
        return <PieChart className="w-4 h-4" />;
      default:
        return <BarChart3 className="w-4 h-4" />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-muted/20">
      {/* Canvas Header */}
      <div className="border-b bg-card p-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Report Canvas</h3>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {reportConfig.visualizations.length} components
            </Badge>
            {selectedVisualization && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedVisualization(null)}
              >
                Deselect
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 relative overflow-auto">
        <div
          ref={drop}
          data-canvas="true"
          className={`
            min-h-full w-full relative
            ${isOver && canDrop ? 'bg-blue-50 border-2 border-dashed border-blue-300' : ''}
            ${canDrop ? 'border-2 border-dashed border-blue-200' : ''}
          `}
          style={{ 
            minWidth: reportConfig.layout.width,
            minHeight: reportConfig.layout.height 
          }}
        >
          {/* Drop Zone Message */}
          {reportConfig.visualizations.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center p-8 border-2 border-dashed border-muted-foreground/25 rounded-lg bg-card/50">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h4 className="text-lg font-medium mb-2">Start Building Your Report</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Drag fields from the Fields palette to create visualizations
                </p>
                <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
                    <span>Drag fields here</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Visualizations */}
          {reportConfig.visualizations.map((visualization) => (
            <VisualizationComponent
              key={visualization.id}
              visualization={visualization}
              isSelected={selectedVisualization === visualization.id}
              onSelect={() => setSelectedVisualization(visualization.id)}
              onUpdate={(updates) => onVisualizationUpdate(visualization.id, updates)}
              onRemove={() => onVisualizationRemove(visualization.id)}
              dataSources={reportConfig.dataSources}
            />
          ))}
        </div>
      </div>

      {/* Properties Panel */}
      {selectedVisualization && (
        <div className="border-t bg-card p-3">
          <VisualizationProperties
            visualization={reportConfig.visualizations.find(v => v.id === selectedVisualization)!}
            dataSources={reportConfig.dataSources}
            onUpdate={(updates) => onVisualizationUpdate(selectedVisualization, updates)}
          />
        </div>
      )}

      {/* Chart Configuration Modal */}
      {showConfigPanel && selectedVisualization && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <ChartConfigPanel
              visualization={reportConfig.visualizations.find(v => v.id === selectedVisualization)!}
              onUpdate={(updates) => onVisualizationUpdate(selectedVisualization, updates)}
              onClose={() => setShowConfigPanel(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

interface VisualizationComponentProps {
  visualization: VisualizationConfig;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<VisualizationConfig>) => void;
  onRemove: () => void;
  dataSources: any[];
}

const VisualizationComponent: React.FC<VisualizationComponentProps> = ({
  visualization,
  isSelected,
  onSelect,
  onUpdate,
  onRemove,
  dataSources
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('drag-handle')) {
      e.preventDefault();
      onSelect();
      setIsDragging(true);
      
      const startX = e.clientX - visualization.position.x;
      const startY = e.clientY - visualization.position.y;

      const handleMouseMove = (e: MouseEvent) => {
        const newX = Math.max(0, e.clientX - startX);
        const newY = Math.max(0, e.clientY - startY);
        
        onUpdate({
          position: {
            ...visualization.position,
            x: newX,
            y: newY
          }
        });
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    
    const startWidth = visualization.position.width;
    const startHeight = visualization.position.height;
    const startX = e.clientX;
    const startY = e.clientY;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(200, startWidth + (e.clientX - startX));
      const newHeight = Math.max(150, startHeight + (e.clientY - startY));
      
      onUpdate({
        position: {
          ...visualization.position,
          width: newWidth,
          height: newHeight
        }
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      className={`
        absolute border rounded-lg bg-card shadow-sm cursor-move
        ${isSelected ? 'border-blue-500 shadow-md' : 'border-border'}
        ${isDragging ? 'opacity-75' : ''}
      `}
      style={{
        left: visualization.position.x,
        top: visualization.position.y,
        width: visualization.position.width,
        height: visualization.position.height
      }}
      onMouseDown={handleMouseDown}
      onClick={onSelect}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b bg-muted/50 drag-handle">
        <div className="flex items-center gap-2">
          {getVisualizationIcon(visualization.type, visualization.chartType)}
          <span className="text-sm font-medium truncate">
            {visualization.styling.title || 'Untitled Visualization'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Implement config panel
              console.log('Config panel clicked');
            }}
          >
            <Settings className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 h-full">
        <div className="h-full flex items-center justify-center bg-muted/20 rounded border-2 border-dashed">
          <div className="text-center">
            {getVisualizationIcon(visualization.type, visualization.chartType)}
            <p className="text-xs text-muted-foreground mt-1">
              {visualization.type === 'table' ? 'Data Table' : `${visualization.chartType} Chart`}
            </p>
            <div className="mt-2 space-y-1">
              {visualization.dimensions.length > 0 && (
                <div className="text-xs">
                  <span className="font-medium">Dimensions: </span>
                  <span className="text-muted-foreground">{visualization.dimensions.length}</span>
                </div>
              )}
              {visualization.measures.length > 0 && (
                <div className="text-xs">
                  <span className="font-medium">Measures: </span>
                  <span className="text-muted-foreground">{visualization.measures.length}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Resize Handles */}
      {isSelected && (
        <>
          {/* Corner resize handle */}
          <div
            className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 cursor-se-resize hover:bg-blue-600 transition-colors"
            onMouseDown={handleResizeMouseDown}
          />
          
          {/* Edge resize handles */}
          <div
            className="absolute top-0 right-0 w-2 h-full cursor-e-resize hover:bg-blue-200 transition-colors"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const startWidth = visualization.position.width;
              const startX = e.clientX;

              const handleMouseMove = (e: MouseEvent) => {
                const newWidth = Math.max(200, startWidth + (e.clientX - startX));
                onUpdate({
                  position: { ...visualization.position, width: newWidth }
                });
              };

              const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
              };

              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
            }}
          />
          
          <div
            className="absolute bottom-0 left-0 w-full h-2 cursor-s-resize hover:bg-blue-200 transition-colors"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const startHeight = visualization.position.height;
              const startY = e.clientY;

              const handleMouseMove = (e: MouseEvent) => {
                const newHeight = Math.max(150, startHeight + (e.clientY - startY));
                onUpdate({
                  position: { ...visualization.position, height: newHeight }
                });
              };

              const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
              };

              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
            }}
          />
        </>
      )}
    </div>
  );
};

const VisualizationProperties: React.FC<{
  visualization: VisualizationConfig;
  dataSources: any[];
  onUpdate: (updates: Partial<VisualizationConfig>) => void;
}> = ({ visualization, dataSources, onUpdate }) => {
  return (
    <div className="space-y-3">
      <h4 className="font-medium text-sm">Visualization Properties</h4>
      
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-medium">Type</label>
          <Select 
            value={visualization.type} 
            onValueChange={(value: any) => onUpdate({ type: value })}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="table">Table</SelectItem>
              <SelectItem value="chart">Chart</SelectItem>
              <SelectItem value="metric">Metric</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {visualization.type === 'chart' && (
          <div>
            <label className="text-xs font-medium">Chart Type</label>
            <Select 
              value={visualization.chartType} 
              onValueChange={(value: any) => onUpdate({ chartType: value })}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bar">Bar Chart</SelectItem>
                <SelectItem value="line">Line Chart</SelectItem>
                <SelectItem value="pie">Pie Chart</SelectItem>
                <SelectItem value="area">Area Chart</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <label className="text-xs font-medium">Title</label>
          <input
            type="text"
            value={visualization.styling.title || ''}
            onChange={(e) => onUpdate({
              styling: { ...visualization.styling, title: e.target.value }
            })}
            className="w-full h-8 px-2 text-xs border rounded"
            placeholder="Visualization title"
          />
        </div>
      </div>
    </div>
  );
};

const getVisualizationIcon = (type: string, chartType?: string) => {
  if (type === 'table') return <Table className="w-4 h-4" />;
  
  switch (chartType) {
    case 'line':
      return <LineChart className="w-4 h-4" />;
    case 'pie':
      return <PieChart className="w-4 h-4" />;
    default:
      return <BarChart3 className="w-4 h-4" />;
  }
};