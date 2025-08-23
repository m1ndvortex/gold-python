import React from 'react';
import { useDrag, DragSourceMonitor } from 'react-dnd';
import { DataSource, FieldDefinition, DragItem } from '../../types/reportBuilder';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { 
  Type, 
  Hash, 
  Calendar, 
  ToggleLeft, 
  DollarSign,
  Database,
  GripVertical,
  Filter,
  BarChart3,
  ArrowUpDown
} from 'lucide-react';

interface FieldPaletteProps {
  dataSources: DataSource[];
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
}

export const FieldPalette: React.FC<FieldPaletteProps> = ({
  dataSources,
  searchTerm = '',
  onSearchChange
}) => {
  const filteredFields = dataSources.flatMap(dataSource =>
    dataSource.fields
      .filter(field => 
        field.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        field.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .map(field => ({ ...field, dataSourceName: dataSource.name }))
  );

  return (
    <Card className="w-full h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Database className="w-4 h-4" />
          Fields Palette
        </CardTitle>
        {onSearchChange && (
          <div className="relative">
            <input
              type="text"
              placeholder="Search fields..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full px-3 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="p-3 space-y-1">
            {filteredFields.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {searchTerm ? 'No fields match your search' : 'No fields available'}
              </p>
            ) : (
              filteredFields.map((field) => (
                <DraggableField
                  key={`${field.dataSourceName}_${field.id}`}
                  field={field}
                  dataSourceName={field.dataSourceName}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

interface DraggableFieldProps {
  field: FieldDefinition & { dataSourceName: string };
  dataSourceName: string;
}

const DraggableField: React.FC<DraggableFieldProps> = ({ field, dataSourceName }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'field',
    item: {
      id: field.id,
      type: 'field',
      field: field
    } as DragItem,
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const getFieldIcon = (dataType: string) => {
    switch (dataType) {
      case 'string':
        return <Type className="w-3 h-3" />;
      case 'number':
        return <Hash className="w-3 h-3" />;
      case 'date':
        return <Calendar className="w-3 h-3" />;
      case 'boolean':
        return <ToggleLeft className="w-3 h-3" />;
      case 'decimal':
        return <DollarSign className="w-3 h-3" />;
      default:
        return <Type className="w-3 h-3" />;
    }
  };

  const getDataTypeColor = (dataType: string) => {
    switch (dataType) {
      case 'string':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'number':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'date':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'boolean':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'decimal':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div
      ref={drag}
      className={`
        group flex items-center gap-2 p-2 rounded-md border cursor-move transition-all
        ${isDragging 
          ? 'opacity-50 bg-blue-50 border-blue-300' 
          : 'hover:bg-muted/50 hover:border-muted-foreground/20'
        }
      `}
      title={field.description || field.displayName}
    >
      <GripVertical className="w-3 h-3 text-muted-foreground group-hover:text-foreground" />
      
      <div className="flex items-center gap-1 flex-1 min-w-0">
        {getFieldIcon(field.dataType)}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{field.displayName}</div>
          <div className="text-xs text-muted-foreground truncate">
            {dataSourceName}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Badge 
          variant="outline" 
          className={`text-xs px-1 py-0 ${getDataTypeColor(field.dataType)}`}
        >
          {field.dataType}
        </Badge>
        
        <div className="flex gap-0.5">
          {field.aggregatable && (
            <div className="p-0.5 rounded bg-blue-100" title="Aggregatable">
              <BarChart3 className="w-2.5 h-2.5 text-blue-600" />
            </div>
          )}
          {field.filterable && (
            <div className="p-0.5 rounded bg-green-100" title="Filterable">
              <Filter className="w-2.5 h-2.5 text-green-600" />
            </div>
          )}
          {field.sortable && (
            <div className="p-0.5 rounded bg-purple-100" title="Sortable">
              <ArrowUpDown className="w-2.5 h-2.5 text-purple-600" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};