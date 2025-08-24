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
  Filter,
  BarChart3
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
      <div className="h-full flex flex-col bg-gradient-to-br from-slate-50/30 to-white">
        {/* Enhanced Header */}
        <div className="border-b-2 border-indigo-200 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                <Settings className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 max-w-md space-y-2">
                <Input
                  placeholder="Report Name"
                  value={reportConfig.name}
                  onChange={(e) => setReportConfig(prev => ({ ...prev, name: e.target.value }))}
                  className="font-medium border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-300"
                />
                <Textarea
                  placeholder="Report Description (optional)"
                  value={reportConfig.description}
                  onChange={(e) => setReportConfig(prev => ({ ...prev, description: e.target.value }))}
                  className="text-sm resize-none border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-300"
                  rows={2}
                />
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs">
                <Database className="w-3 h-3 mr-1" />
                {reportConfig.dataSources.length} data sources
              </Badge>
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
                <BarChart3 className="w-3 h-3 mr-1" />
                {reportConfig.visualizations.length} visualizations
              </Badge>
              <Button variant="outline" onClick={onCancel} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                Cancel
              </Button>
              <Button 
                variant="outline" 
                onClick={handlePreview}
                disabled={!isReportValid}
                className="border-0 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Play className="w-4 h-4 mr-1" />
                Preview
              </Button>
              <Button 
                onClick={handleSave}
                disabled={!isReportValid}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Save className="w-4 h-4 mr-1" />
                Save Report
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Enhanced Left Sidebar */}
          <div className="w-80 border-r-2 border-indigo-200 bg-gradient-to-b from-white to-slate-50 flex flex-col shadow-lg">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-b-2 border-indigo-200 p-2">
                <TabsList className="grid w-full grid-cols-4 bg-transparent h-auto p-1 gap-1">
                  <TabsTrigger 
                    value="data" 
                    className="flex items-center gap-2 p-3 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-indigo-300 text-xs"
                  >
                    <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center">
                      <Database className="w-3 h-3 text-indigo-600" />
                    </div>
                    <span className="font-medium">Data</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="fields" 
                    className="flex items-center gap-2 p-3 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-purple-300 text-xs"
                  >
                    <div className="h-6 w-6 rounded-full bg-purple-100 flex items-center justify-center">
                      <Palette className="w-3 h-3 text-purple-600" />
                    </div>
                    <span className="font-medium">Fields</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="filters" 
                    className="flex items-center gap-2 p-3 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-pink-300 text-xs"
                  >
                    <div className="h-6 w-6 rounded-full bg-pink-100 flex items-center justify-center">
                      <Filter className="w-3 h-3 text-pink-600" />
                    </div>
                    <span className="font-medium">Filters</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="settings" 
                    className="flex items-center gap-2 p-3 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-cyan-300 text-xs"
                  >
                    <div className="h-6 w-6 rounded-full bg-cyan-100 flex items-center justify-center">
                      <Settings className="w-3 h-3 text-cyan-600" />
                    </div>
                    <span className="font-medium">Style</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-hidden">
                <TabsContent value="data" className="h-full m-0 p-0">
                  <div className="p-4 bg-gradient-to-br from-indigo-50/30 to-white h-full">
                    <DataSourceSelector
                      availableDataSources={availableDataSources}
                      selectedDataSources={reportConfig.dataSources}
                      onDataSourceSelect={handleDataSourceSelect}
                      onDataSourceRemove={handleDataSourceRemove}
                      onRelationshipAdd={handleRelationshipAdd}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="fields" className="h-full m-0 p-0">
                  <div className="p-4 bg-gradient-to-br from-purple-50/30 to-white h-full">
                    <FieldPalette
                      dataSources={reportConfig.dataSources}
                      searchTerm={fieldSearchTerm}
                      onSearchChange={setFieldSearchTerm}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="filters" className="h-full m-0 p-0">
                  <div className="p-4 bg-gradient-to-br from-pink-50/30 to-white h-full">
                    <FilterBuilder
                      dataSources={reportConfig.dataSources}
                      filters={reportConfig.filters}
                      onFilterAdd={handleFilterAdd}
                      onFilterUpdate={handleFilterUpdate}
                      onFilterRemove={handleFilterRemove}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="settings" className="h-full m-0 p-0">
                  <div className="p-4 bg-gradient-to-br from-cyan-50/30 to-white h-full">
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
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* Enhanced Main Canvas */}
          <div className="flex-1 overflow-hidden bg-gradient-to-br from-slate-50/50 to-white">
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

