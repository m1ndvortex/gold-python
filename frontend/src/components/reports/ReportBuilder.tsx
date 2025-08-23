import React, { useState, useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { 
  DataSource, 
  ReportConfiguration, 
  VisualizationConfig,
  FilterConfiguration,
  Relationship
} from '../../types/reportBuilder';
import { DataSourceSelector } from './DataSourceSelector';
import { FieldPalette } from './FieldPalette';
import { ReportCanvas } from './ReportCanvas';
import { FilterBuilder } from './FilterBuilder';
import { LayoutDesigner } from './LayoutDesigner';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { 
  Save, 
  Play, 
  Settings, 
  Database,
  Palette,
  Filter
} from 'lucide-react';

interface ReportBuilderProps {
  availableDataSources: DataSource[];
  initialReport?: ReportConfiguration;
  onSave: (report: ReportConfiguration) => void;
  onPreview: (report: ReportConfiguration) => void;
  onCancel: () => void;
}

export const ReportBuilder: React.FC<ReportBuilderProps> = ({
  availableDataSources,
  initialReport,
  onSave,
  onPreview,
  onCancel
}) => {
  const [reportConfig, setReportConfig] = useState<ReportConfiguration>(
    initialReport || {
      name: '',
      description: '',
      dataSources: [],
      filters: [],
      visualizations: [],
      layout: {
        width: 1200,
        height: 800,
        components: []
      },
      styling: {
        theme: 'light',
        primaryColor: '#3b82f6',
        backgroundColor: '#ffffff',
        fontFamily: 'Inter',
        fontSize: 14
      }
    }
  );

  const [activeTab, setActiveTab] = useState('data');
  const [fieldSearchTerm, setFieldSearchTerm] = useState('');

  // Data Source Management
  const handleDataSourceSelect = useCallback((dataSource: DataSource) => {
    setReportConfig(prev => ({
      ...prev,
      dataSources: [...prev.dataSources, dataSource]
    }));
  }, []);

  const handleDataSourceRemove = useCallback((dataSourceId: string) => {
    setReportConfig(prev => ({
      ...prev,
      dataSources: prev.dataSources.filter(ds => ds.id !== dataSourceId),
      // Also remove any visualizations that depend on this data source
      visualizations: prev.visualizations.filter(viz => 
        !viz.dimensions.some(dim => dim.startsWith(dataSourceId)) &&
        !viz.measures.some(measure => measure.startsWith(dataSourceId))
      )
    }));
  }, []);

  const handleRelationshipAdd = useCallback((relationship: Relationship) => {
    setReportConfig(prev => ({
      ...prev,
      dataSources: prev.dataSources.map(ds => 
        ds.id === relationship.sourceTable
          ? { ...ds, relationships: [...ds.relationships, relationship] }
          : ds
      )
    }));
  }, []);

  // Visualization Management
  const handleVisualizationAdd = useCallback((visualization: VisualizationConfig) => {
    setReportConfig(prev => ({
      ...prev,
      visualizations: [...prev.visualizations, visualization],
      layout: {
        ...prev.layout,
        components: [...prev.layout.components, visualization]
      }
    }));
  }, []);

  const handleVisualizationUpdate = useCallback((id: string, updates: Partial<VisualizationConfig>) => {
    setReportConfig(prev => ({
      ...prev,
      visualizations: prev.visualizations.map(viz => 
        viz.id === id ? { ...viz, ...updates } : viz
      ),
      layout: {
        ...prev.layout,
        components: prev.layout.components.map(comp => 
          comp.id === id ? { ...comp, ...updates } : comp
        )
      }
    }));
  }, []);

  const handleVisualizationRemove = useCallback((id: string) => {
    setReportConfig(prev => ({
      ...prev,
      visualizations: prev.visualizations.filter(viz => viz.id !== id),
      layout: {
        ...prev.layout,
        components: prev.layout.components.filter(comp => comp.id !== id)
      }
    }));
  }, []);

  // Filter Management
  const handleFilterAdd = useCallback((filter: FilterConfiguration) => {
    setReportConfig(prev => ({
      ...prev,
      filters: [...prev.filters, filter]
    }));
  }, []);

  const handleFilterUpdate = useCallback((id: string, updates: Partial<FilterConfiguration>) => {
    setReportConfig(prev => ({
      ...prev,
      filters: prev.filters.map(filter => 
        filter.id === id ? { ...filter, ...updates } : filter
      )
    }));
  }, []);

  const handleFilterRemove = useCallback((id: string) => {
    setReportConfig(prev => ({
      ...prev,
      filters: prev.filters.filter(filter => filter.id !== id)
    }));
  }, []);

  // Report Actions
  const handleSave = () => {
    if (!reportConfig.name.trim()) {
      alert('Please enter a report name');
      return;
    }
    onSave(reportConfig);
  };

  const handlePreview = () => {
    if (reportConfig.dataSources.length === 0) {
      alert('Please select at least one data source');
      return;
    }
    onPreview(reportConfig);
  };

  const isReportValid = reportConfig.name.trim() && reportConfig.dataSources.length > 0;

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-full flex flex-col bg-background">
        {/* Header */}
        <div className="border-b bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 max-w-md space-y-2">
              <Input
                placeholder="Report Name"
                value={reportConfig.name}
                onChange={(e) => setReportConfig(prev => ({ ...prev, name: e.target.value }))}
                className="font-medium"
              />
              <Textarea
                placeholder="Report Description (optional)"
                value={reportConfig.description}
                onChange={(e) => setReportConfig(prev => ({ ...prev, description: e.target.value }))}
                className="text-sm resize-none"
                rows={2}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {reportConfig.dataSources.length} data sources
              </Badge>
              <Badge variant="outline" className="text-xs">
                {reportConfig.visualizations.length} visualizations
              </Badge>
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button 
                variant="outline" 
                onClick={handlePreview}
                disabled={!isReportValid}
              >
                <Play className="w-4 h-4 mr-1" />
                Preview
              </Button>
              <Button 
                onClick={handleSave}
                disabled={!isReportValid}
              >
                <Save className="w-4 h-4 mr-1" />
                Save Report
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar */}
          <div className="w-80 border-r bg-card flex flex-col">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-4 m-2">
                <TabsTrigger value="data" className="text-xs">
                  <Database className="w-3 h-3 mr-1" />
                  Data
                </TabsTrigger>
                <TabsTrigger value="fields" className="text-xs">
                  <Palette className="w-3 h-3 mr-1" />
                  Fields
                </TabsTrigger>
                <TabsTrigger value="filters" className="text-xs">
                  <Filter className="w-3 h-3 mr-1" />
                  Filters
                </TabsTrigger>
                <TabsTrigger value="settings" className="text-xs">
                  <Settings className="w-3 h-3 mr-1" />
                  Style
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-hidden">
                <TabsContent value="data" className="h-full m-0 p-2">
                  <DataSourceSelector
                    availableDataSources={availableDataSources}
                    selectedDataSources={reportConfig.dataSources}
                    onDataSourceSelect={handleDataSourceSelect}
                    onDataSourceRemove={handleDataSourceRemove}
                    onRelationshipAdd={handleRelationshipAdd}
                  />
                </TabsContent>

                <TabsContent value="fields" className="h-full m-0 p-2">
                  <FieldPalette
                    dataSources={reportConfig.dataSources}
                    searchTerm={fieldSearchTerm}
                    onSearchChange={setFieldSearchTerm}
                  />
                </TabsContent>

                <TabsContent value="filters" className="h-full m-0 p-2">
                  <FilterBuilder
                    dataSources={reportConfig.dataSources}
                    filters={reportConfig.filters}
                    onFilterAdd={handleFilterAdd}
                    onFilterUpdate={handleFilterUpdate}
                    onFilterRemove={handleFilterRemove}
                  />
                </TabsContent>

                <TabsContent value="settings" className="h-full m-0 p-2">
                  <LayoutDesigner
                    layout={reportConfig.layout}
                    styling={reportConfig.styling}
                    visualizations={reportConfig.visualizations}
                    onLayoutUpdate={(updates) => 
                      setReportConfig(prev => ({ 
                        ...prev, 
                        layout: { ...prev.layout, ...updates } 
                      }))
                    }
                    onStylingUpdate={(updates) => 
                      setReportConfig(prev => ({ 
                        ...prev, 
                        styling: { ...prev.styling, ...updates } 
                      }))
                    }
                    onVisualizationUpdate={handleVisualizationUpdate}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* Main Canvas */}
          <div className="flex-1 overflow-hidden">
            <ReportCanvas
              reportConfig={reportConfig}
              onVisualizationAdd={handleVisualizationAdd}
              onVisualizationUpdate={handleVisualizationUpdate}
              onVisualizationRemove={handleVisualizationRemove}
            />
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

