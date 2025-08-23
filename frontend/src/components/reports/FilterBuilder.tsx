import React, { useState, useCallback } from 'react';
import { useDrop } from 'react-dnd';
import { 
  DataSource, 
  FieldDefinition, 
  FilterConfiguration,
  DragItem
} from '../../types/reportBuilder';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { 
  Plus, 
  Trash2, 
  Filter,
  Calendar,
  Hash,
  Type,
  ToggleLeft,
  Search,
  X,
  ChevronDown,
  ChevronRight,
  Move
} from 'lucide-react';

interface FilterBuilderProps {
  dataSources: DataSource[];
  filters: FilterConfiguration[];
  onFilterAdd: (filter: FilterConfiguration) => void;
  onFilterUpdate: (id: string, updates: Partial<FilterConfiguration>) => void;
  onFilterRemove: (id: string) => void;
}

interface FilterGroup {
  id: string;
  name: string;
  operator: 'AND' | 'OR';
  filters: FilterConfiguration[];
}

const FILTER_OPERATORS = {
  string: [
    { value: 'equals', label: 'Equals', symbol: '=' },
    { value: 'not_equals', label: 'Not Equals', symbol: '≠' },
    { value: 'contains', label: 'Contains', symbol: '⊃' },
    { value: 'not_contains', label: 'Does Not Contain', symbol: '⊅' },
    { value: 'starts_with', label: 'Starts With', symbol: '⌐' },
    { value: 'ends_with', label: 'Ends With', symbol: '¬' },
    { value: 'in', label: 'In List', symbol: '∈' },
    { value: 'not_in', label: 'Not In List', symbol: '∉' },
    { value: 'is_empty', label: 'Is Empty', symbol: '∅' },
    { value: 'is_not_empty', label: 'Is Not Empty', symbol: '≠∅' }
  ],
  number: [
    { value: 'equals', label: 'Equals', symbol: '=' },
    { value: 'not_equals', label: 'Not Equals', symbol: '≠' },
    { value: 'greater_than', label: 'Greater Than', symbol: '>' },
    { value: 'greater_than_or_equal', label: 'Greater Than or Equal', symbol: '≥' },
    { value: 'less_than', label: 'Less Than', symbol: '<' },
    { value: 'less_than_or_equal', label: 'Less Than or Equal', symbol: '≤' },
    { value: 'between', label: 'Between', symbol: '⟷' },
    { value: 'not_between', label: 'Not Between', symbol: '⟷̸' },
    { value: 'in', label: 'In List', symbol: '∈' },
    { value: 'not_in', label: 'Not In List', symbol: '∉' }
  ],
  date: [
    { value: 'equals', label: 'On Date', symbol: '=' },
    { value: 'not_equals', label: 'Not On Date', symbol: '≠' },
    { value: 'greater_than', label: 'After', symbol: '>' },
    { value: 'greater_than_or_equal', label: 'On or After', symbol: '≥' },
    { value: 'less_than', label: 'Before', symbol: '<' },
    { value: 'less_than_or_equal', label: 'On or Before', symbol: '≤' },
    { value: 'between', label: 'Between Dates', symbol: '⟷' },
    { value: 'last_n_days', label: 'Last N Days', symbol: '📅' },
    { value: 'next_n_days', label: 'Next N Days', symbol: '📅' },
    { value: 'this_week', label: 'This Week', symbol: '📅' },
    { value: 'this_month', label: 'This Month', symbol: '📅' },
    { value: 'this_year', label: 'This Year', symbol: '📅' }
  ],
  boolean: [
    { value: 'equals', label: 'Is', symbol: '=' },
    { value: 'not_equals', label: 'Is Not', symbol: '≠' }
  ]
};

const PREDEFINED_DATE_RANGES = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'this_week', label: 'This Week' },
  { value: 'last_week', label: 'Last Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'this_quarter', label: 'This Quarter' },
  { value: 'last_quarter', label: 'Last Quarter' },
  { value: 'this_year', label: 'This Year' },
  { value: 'last_year', label: 'Last Year' }
];

export const FilterBuilder: React.FC<FilterBuilderProps> = ({
  dataSources,
  filters,
  onFilterAdd,
  onFilterUpdate,
  onFilterRemove
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['default']));
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>([
    {
      id: 'default',
      name: 'Default Group',
      operator: 'AND',
      filters: filters
    }
  ]);

  // Drag and drop for filter creation
  const [{ isOverFilterZone }, dropFilterZone] = useDrop(() => ({
    accept: 'field',
    drop: (item: DragItem) => {
      if (item.field && item.field.filterable) {
        createNewFilter(item.field as FieldDefinition & { dataSourceName: string });
      }
    },
    collect: (monitor) => ({
      isOverFilterZone: monitor.isOver(),
    }),
  }));

  // Get all available fields from data sources
  const availableFields = dataSources.flatMap(ds => 
    ds.fields.filter(field => field.filterable).map(field => ({
      ...field,
      dataSourceName: ds.name,
      fullId: `${ds.id}.${field.id}`
    }))
  );

  const filteredFields = availableFields.filter(field =>
    field.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    field.dataSourceName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFieldIcon = (dataType: string) => {
    switch (dataType) {
      case 'string':
        return <Type className="w-4 h-4" />;
      case 'number':
      case 'decimal':
        return <Hash className="w-4 h-4" />;
      case 'date':
        return <Calendar className="w-4 h-4" />;
      case 'boolean':
        return <ToggleLeft className="w-4 h-4" />;
      default:
        return <Type className="w-4 h-4" />;
    }
  };

  const getOperatorsForField = (field: FieldDefinition) => {
    const dataType = field.dataType === 'decimal' ? 'number' : field.dataType;
    return FILTER_OPERATORS[dataType as keyof typeof FILTER_OPERATORS] || FILTER_OPERATORS.string;
  };

  const createNewFilter = useCallback((field: FieldDefinition & { dataSourceName: string }) => {
    const operators = getOperatorsForField(field);
    const newFilter: FilterConfiguration = {
      id: `filter_${Date.now()}`,
      field: `${field.dataSourceName}.${field.id}`,
      operator: operators[0].value as any,
      value: getDefaultValueForField(field),
      dataType: field.dataType
    };
    
    onFilterAdd(newFilter);
  }, [onFilterAdd]);

  const getDefaultValueForField = (field: FieldDefinition) => {
    switch (field.dataType) {
      case 'string':
        return '';
      case 'number':
      case 'decimal':
        return 0;
      case 'date':
        return new Date().toISOString().split('T')[0];
      case 'boolean':
        return true;
      default:
        return '';
    }
  };

  const renderFilterValue = (filter: FilterConfiguration) => {
    const field = availableFields.find(f => `${f.dataSourceName}.${f.id}` === filter.field);
    if (!field) return null;

    const operators = getOperatorsForField(field);
    const operator = operators.find(op => op.value === filter.operator);

    // Handle operators that don't need values
    if (['is_empty', 'is_not_empty', 'this_week', 'this_month', 'this_year'].includes(filter.operator)) {
      return (
        <div className="text-sm text-muted-foreground italic">
          No value required
        </div>
      );
    }

    // Handle between operators
    if (['between', 'not_between'].includes(filter.operator)) {
      const values = Array.isArray(filter.value) ? filter.value : [filter.value, filter.value];
      return (
        <div className="flex items-center gap-2">
          <Input
            type={field.dataType === 'date' ? 'date' : field.dataType === 'number' || field.dataType === 'decimal' ? 'number' : 'text'}
            value={values[0] || ''}
            onChange={(e) => onFilterUpdate(filter.id, { 
              value: [e.target.value, values[1] || ''] 
            })}
            className="flex-1"
            placeholder="From"
          />
          <span className="text-muted-foreground">to</span>
          <Input
            type={field.dataType === 'date' ? 'date' : field.dataType === 'number' || field.dataType === 'decimal' ? 'number' : 'text'}
            value={values[1] || ''}
            onChange={(e) => onFilterUpdate(filter.id, { 
              value: [values[0] || '', e.target.value] 
            })}
            className="flex-1"
            placeholder="To"
          />
        </div>
      );
    }

    // Handle list operators
    if (['in', 'not_in'].includes(filter.operator)) {
      const values = Array.isArray(filter.value) ? filter.value : [filter.value].filter(Boolean);
      return (
        <div className="space-y-2">
          <Textarea
            value={values.join('\n')}
            onChange={(e) => onFilterUpdate(filter.id, { 
              value: e.target.value.split('\n').filter(v => v.trim()) 
            })}
            placeholder="Enter values (one per line)"
            rows={3}
          />
          <div className="text-xs text-muted-foreground">
            {values.length} value{values.length !== 1 ? 's' : ''}
          </div>
        </div>
      );
    }

    // Handle date range operators
    if (['last_n_days', 'next_n_days'].includes(filter.operator)) {
      return (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={filter.value || 7}
            onChange={(e) => onFilterUpdate(filter.id, { value: parseInt(e.target.value) || 7 })}
            min="1"
            className="w-20"
          />
          <span className="text-sm text-muted-foreground">days</span>
        </div>
      );
    }

    // Handle predefined date ranges
    if (field.dataType === 'date' && ['equals', 'not_equals'].includes(filter.operator)) {
      return (
        <div className="space-y-2">
          <Select
            value={typeof filter.value === 'string' && PREDEFINED_DATE_RANGES.find(r => r.value === filter.value) ? filter.value : 'custom'}
            onValueChange={(value) => {
              if (value === 'custom') {
                onFilterUpdate(filter.id, { value: new Date().toISOString().split('T')[0] });
              } else {
                onFilterUpdate(filter.id, { value });
              }
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="custom">Custom Date</SelectItem>
              {PREDEFINED_DATE_RANGES.map(range => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {(!PREDEFINED_DATE_RANGES.find(r => r.value === filter.value)) && (
            <Input
              type="date"
              value={filter.value || ''}
              onChange={(e) => onFilterUpdate(filter.id, { value: e.target.value })}
            />
          )}
        </div>
      );
    }

    // Handle boolean values
    if (field.dataType === 'boolean') {
      return (
        <Select
          value={filter.value?.toString() || 'true'}
          onValueChange={(value) => onFilterUpdate(filter.id, { value: value === 'true' })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">True</SelectItem>
            <SelectItem value="false">False</SelectItem>
          </SelectContent>
        </Select>
      );
    }

    // Default input for other types
    return (
      <Input
        type={field.dataType === 'date' ? 'date' : field.dataType === 'number' || field.dataType === 'decimal' ? 'number' : 'text'}
        value={filter.value || ''}
        onChange={(e) => onFilterUpdate(filter.id, { value: e.target.value })}
        placeholder={`Enter ${field.dataType} value`}
      />
    );
  };

  const toggleGroupExpansion = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          <h3 className="font-medium">Filters</h3>
          <Badge variant="outline" className="text-xs">
            {filters.length}
          </Badge>
        </div>
      </div>

      {/* Field Search */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search fields to filter..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              onClick={() => setSearchTerm('')}
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>

        {/* Available Fields */}
        {searchTerm && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Available Fields</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-40 overflow-y-auto">
              {filteredFields.length === 0 ? (
                <p className="text-sm text-muted-foreground">No filterable fields found</p>
              ) : (
                filteredFields.map((field) => (
                  <div
                    key={field.fullId}
                    className="flex items-center justify-between p-2 border rounded hover:bg-muted/50 cursor-pointer"
                    onClick={() => createNewFilter(field)}
                  >
                    <div className="flex items-center gap-2">
                      {getFieldIcon(field.dataType)}
                      <div>
                        <div className="text-sm font-medium">{field.displayName}</div>
                        <div className="text-xs text-muted-foreground">
                          {field.dataSourceName} • {field.dataType}
                        </div>
                      </div>
                    </div>
                    <Plus className="w-4 h-4 text-muted-foreground" />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Filter Drop Zone */}
      <div
        ref={dropFilterZone}
        className={`
          p-4 border-2 border-dashed rounded-lg transition-colors mb-4
          ${isOverFilterZone 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-muted-foreground/25 bg-muted/20'
          }
        `}
      >
        <div className="flex items-center justify-center text-sm text-muted-foreground">
          <Move className="w-4 h-4 mr-2" />
          Drop filterable fields here to create filters
        </div>
      </div>

      {/* Active Filters */}
      <div className="space-y-3">
        {filterGroups.map((group) => (
          <Card key={group.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => toggleGroupExpansion(group.id)}
                  >
                    {expandedGroups.has(group.id) ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </Button>
                  <CardTitle className="text-sm">{group.name}</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {group.filters.length} filters
                  </Badge>
                </div>
                
                <Select
                  value={group.operator}
                  onValueChange={(value: 'AND' | 'OR') => {
                    setFilterGroups(groups => 
                      groups.map(g => 
                        g.id === group.id ? { ...g, operator: value } : g
                      )
                    );
                  }}
                >
                  <SelectTrigger className="w-20 h-6">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AND">AND</SelectItem>
                    <SelectItem value="OR">OR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>

            {expandedGroups.has(group.id) && (
              <CardContent className="space-y-3">
                {filters.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Filter className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No filters applied</p>
                    <p className="text-xs">Search for fields above to add filters</p>
                  </div>
                ) : (
                  filters.map((filter, index) => {
                    const field = availableFields.find(f => `${f.dataSourceName}.${f.id}` === filter.field);
                    const operators = field ? getOperatorsForField(field) : [];
                    const operator = operators.find(op => op.value === filter.operator);

                    return (
                      <div key={filter.id} className="space-y-3 p-3 border rounded-lg bg-muted/20">
                        {/* Filter Logic Connector */}
                        {index > 0 && (
                          <div className="flex justify-center -mt-6 -mb-1">
                            <Badge variant="secondary" className="text-xs px-2 py-1">
                              {group.operator}
                            </Badge>
                          </div>
                        )}

                        {/* Filter Configuration */}
                        <div className="grid grid-cols-12 gap-3 items-start">
                          {/* Field Selection */}
                          <div className="col-span-4">
                            <Label className="text-xs font-medium">Field</Label>
                            <Select
                              value={filter.field}
                              onValueChange={(value) => {
                                const newField = availableFields.find(f => `${f.dataSourceName}.${f.id}` === value);
                                if (newField) {
                                  const newOperators = getOperatorsForField(newField);
                                  onFilterUpdate(filter.id, {
                                    field: value,
                                    operator: newOperators[0].value as any,
                                    value: getDefaultValueForField(newField),
                                    dataType: newField.dataType
                                  });
                                }
                              }}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {availableFields.map((field) => (
                                  <SelectItem key={field.fullId} value={field.fullId}>
                                    <div className="flex items-center gap-2">
                                      {getFieldIcon(field.dataType)}
                                      <span>{field.displayName}</span>
                                      <Badge variant="outline" className="text-xs">
                                        {field.dataSourceName}
                                      </Badge>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Operator Selection */}
                          <div className="col-span-3">
                            <Label className="text-xs font-medium">Operator</Label>
                            <Select
                              value={filter.operator}
                              onValueChange={(value) => onFilterUpdate(filter.id, { 
                                operator: value as any,
                                value: getDefaultValueForField(field!)
                              })}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {operators.map((op) => (
                                  <SelectItem key={op.value} value={op.value}>
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono text-xs">{op.symbol}</span>
                                      <span>{op.label}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Value Input */}
                          <div className="col-span-4">
                            <Label className="text-xs font-medium">Value</Label>
                            {renderFilterValue(filter)}
                          </div>

                          {/* Actions */}
                          <div className="col-span-1 flex justify-end pt-5">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              onClick={() => onFilterRemove(filter.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Filter Summary */}
                        <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                          <strong>{field?.displayName || 'Unknown Field'}</strong>
                          {' '}
                          <span className="font-mono">{operator?.symbol}</span>
                          {' '}
                          <strong>
                            {Array.isArray(filter.value) 
                              ? filter.value.join(', ')
                              : filter.value?.toString() || 'No value'
                            }
                          </strong>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Filter Summary */}
      {filters.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Filter Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              <p className="mb-2">
                <strong>{filters.length}</strong> filter{filters.length !== 1 ? 's' : ''} applied
              </p>
              <div className="space-y-1 text-xs text-muted-foreground">
                {filters.map((filter, index) => {
                  const field = availableFields.find(f => `${f.dataSourceName}.${f.id}` === filter.field);
                  const operators = field ? getOperatorsForField(field) : [];
                  const operator = operators.find(op => op.value === filter.operator);
                  
                  return (
                    <div key={filter.id}>
                      {index > 0 && <span className="font-medium">AND </span>}
                      <span>{field?.displayName || 'Unknown'} {operator?.symbol} {
                        Array.isArray(filter.value) 
                          ? `[${filter.value.join(', ')}]`
                          : filter.value?.toString() || 'No value'
                      }</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};