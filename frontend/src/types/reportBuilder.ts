export interface DataSource {
  id: string;
  name: string;
  type: 'table' | 'view' | 'query';
  fields: FieldDefinition[];
  relationships: Relationship[];
}

export interface FieldDefinition {
  id: string;
  name: string;
  displayName: string;
  dataType: 'string' | 'number' | 'date' | 'boolean' | 'decimal';
  aggregatable: boolean;
  filterable: boolean;
  sortable: boolean;
  description?: string;
}

export interface Relationship {
  id: string;
  sourceTable: string;
  targetTable: string;
  sourceField: string;
  targetField: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
}

export interface FilterConfiguration {
  id: string;
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than' | 'between' | 'in' | 'not_in';
  value: any;
  dataType: string;
}

export interface VisualizationConfig {
  id: string;
  type: 'table' | 'chart' | 'metric' | 'text';
  chartType?: 'line' | 'bar' | 'pie' | 'scatter' | 'heatmap' | 'area';
  dimensions: string[];
  measures: string[];
  styling: ChartStyling;
  position: { x: number; y: number; width: number; height: number };
}

export interface ChartStyling {
  colors: string[];
  showLegend: boolean;
  showGrid: boolean;
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  showDataLabels?: boolean;
  smoothLines?: boolean;
  animationDuration?: number;
}

export interface ReportLayout {
  width: number;
  height: number;
  components: VisualizationConfig[];
}

export interface ReportConfiguration {
  id?: string;
  name: string;
  description?: string;
  dataSources: DataSource[];
  filters: FilterConfiguration[];
  visualizations: VisualizationConfig[];
  layout: ReportLayout;
  styling: ReportStyling;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReportStyling {
  theme: 'light' | 'dark';
  primaryColor: string;
  backgroundColor: string;
  fontFamily: string;
  fontSize: number;
}

export interface DragItem {
  id: string;
  type: 'field' | 'visualization';
  field?: FieldDefinition;
  visualization?: VisualizationConfig;
}

export interface DropResult {
  dropEffect: string;
  item: DragItem;
  targetType: 'dimensions' | 'measures' | 'filters' | 'canvas';
  position?: { x: number; y: number };
}