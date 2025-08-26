import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { 
  Download, 
  FileText,
  FileSpreadsheet,
  FileImage,
  Database,
  Calendar,
  Filter,
  Settings,
  CheckCircle,
  AlertTriangle,
  Clock,
  Zap,
  Eye,
  Share2
} from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiPost, apiGet } from '@/services/api';
import { TimeRangeSelector, TimeRange } from './TimeRangeSelector';

interface ExportFormat {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  extensions: string[];
  supports_charts: boolean;
  supports_raw_data: boolean;
}

interface DataType {
  id: string;
  name: string;
  description: string;
  estimated_size: string;
  available: boolean;
}

interface ExportJob {
  id: string;
  format: string;
  data_types: string[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  created_at: string;
  completed_at?: string;
  download_url?: string;
  file_size?: number;
  error_message?: string;
}

interface DataExportInterfaceProps {
  className?: string;
}

export const DataExportInterface: React.FC<DataExportInterfaceProps> = ({
  className
}) => {
  const [selectedFormat, setSelectedFormat] = useState<string>('excel');
  const [selectedDataTypes, setSelectedDataTypes] = useState<string[]>(['kpi_metrics']);
  const [timeRange, setTimeRange] = useState<TimeRange>({ 
    period: 'month',
    label: 'Last 30 days',
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 
    endDate: new Date() 
  });
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeRawData, setIncludeRawData] = useState(true);
  const [customFilename, setCustomFilename] = useState('');
  const [compressionEnabled, setCompressionEnabled] = useState(false);

  // Available export formats
  const exportFormats: ExportFormat[] = [
    {
      id: 'excel',
      name: 'Excel Workbook',
      description: 'Multi-sheet Excel file with charts and formatting',
      icon: <FileSpreadsheet className="h-5 w-5 text-green-600" />,
      extensions: ['.xlsx'],
      supports_charts: true,
      supports_raw_data: true
    },
    {
      id: 'csv',
      name: 'CSV Files',
      description: 'Comma-separated values in ZIP archive',
      icon: <FileText className="h-5 w-5 text-blue-600" />,
      extensions: ['.csv', '.zip'],
      supports_charts: false,
      supports_raw_data: true
    },
    {
      id: 'pdf',
      name: 'PDF Report',
      description: 'Formatted report with charts and summaries',
      icon: <FileImage className="h-5 w-5 text-red-600" />,
      extensions: ['.pdf'],
      supports_charts: true,
      supports_raw_data: false
    },
    {
      id: 'json',
      name: 'JSON Data',
      description: 'Structured data in JSON format',
      icon: <Database className="h-5 w-5 text-purple-600" />,
      extensions: ['.json'],
      supports_charts: false,
      supports_raw_data: true
    }
  ];

  // Available data types
  const dataTypes: DataType[] = [
    {
      id: 'kpi_metrics',
      name: 'KPI Metrics',
      description: 'Key performance indicators and business metrics',
      estimated_size: '~2MB',
      available: true
    },
    {
      id: 'predictive_analytics',
      name: 'Predictive Analytics',
      description: 'Forecasts, predictions, and model outputs',
      estimated_size: '~5MB',
      available: true
    },
    {
      id: 'customer_segmentation',
      name: 'Customer Segmentation',
      description: 'Customer segments and behavioral analysis',
      estimated_size: '~3MB',
      available: true
    },
    {
      id: 'trend_analysis',
      name: 'Trend Analysis',
      description: 'Historical trends and seasonal patterns',
      estimated_size: '~4MB',
      available: true
    },
    {
      id: 'comparative_analysis',
      name: 'Comparative Analysis',
      description: 'Period comparisons and variance analysis',
      estimated_size: '~2MB',
      available: true
    },
    {
      id: 'alert_history',
      name: 'Alert History',
      description: 'Alert logs and notification history',
      estimated_size: '~1MB',
      available: true
    },
    {
      id: 'raw_transactions',
      name: 'Raw Transaction Data',
      description: 'Complete transaction and invoice data',
      estimated_size: '~50MB',
      available: true
    },
    {
      id: 'inventory_data',
      name: 'Inventory Data',
      description: 'Stock levels, movements, and valuations',
      estimated_size: '~10MB',
      available: true
    }
  ];

  // Fetch export history
  const { data: exportHistory } = useQuery({
    queryKey: ['export-history'],
    queryFn: async (): Promise<ExportJob[]> => {
      return apiGet<ExportJob[]>('/advanced-analytics/exports/history');
    },
    refetchInterval: 5000, // 5 seconds for active jobs
  });

  // Export mutation
  const exportMutation = useMutation({
    mutationFn: async (exportConfig: any) => {
      return apiPost('/advanced-analytics/data/export', exportConfig);
    },
    onSuccess: (data) => {
      console.log('Export job created:', data);
    },
    onError: (error) => {
      console.error('Export failed:', error);
    }
  });

  const handleExport = useCallback(() => {
    const selectedFormatObj = exportFormats.find(f => f.id === selectedFormat);
    
    const exportConfig = {
      format: selectedFormat,
      data_types: selectedDataTypes,
      date_range: {
        start_date: timeRange.startDate?.toISOString() || '',
        end_date: timeRange.endDate?.toISOString() || ''
      },
      options: {
        include_charts: includeCharts && selectedFormatObj?.supports_charts,
        include_raw_data: includeRawData && selectedFormatObj?.supports_raw_data,
        compression_enabled: compressionEnabled,
        custom_filename: customFilename || undefined
      }
    };

    exportMutation.mutate(exportConfig);
  }, [selectedFormat, selectedDataTypes, timeRange, includeCharts, includeRawData, compressionEnabled, customFilename, exportMutation, exportFormats]);

  const handleDataTypeToggle = useCallback((dataTypeId: string, checked: boolean) => {
    setSelectedDataTypes(prev => 
      checked 
        ? [...prev, dataTypeId]
        : prev.filter(id => id !== dataTypeId)
    );
  }, []);

  const getEstimatedSize = useCallback(() => {
    const selectedTypes = dataTypes.filter(dt => selectedDataTypes.includes(dt.id));
    const totalSizeMB = selectedTypes.reduce((total, type) => {
      const sizeStr = type.estimated_size.replace(/[^\d.]/g, '');
      return total + parseFloat(sizeStr);
    }, 0);
    
    if (compressionEnabled) {
      return `~${(totalSizeMB * 0.3).toFixed(1)}MB (compressed)`;
    }
    return `~${totalSizeMB.toFixed(1)}MB`;
  }, [selectedDataTypes, compressionEnabled, dataTypes]);

  const getJobStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const selectedFormatObj = exportFormats.find(f => f.id === selectedFormat);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
              <Download className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground">Data Export</h1>
              <p className="text-muted-foreground text-lg">
                Export analytics data in multiple formats for external analysis
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1">
            <Zap className="h-3 w-3" />
            Multiple Formats
          </Badge>
          <Button variant="outline" size="sm" className="gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export Configuration */}
        <div className="space-y-6">
          {/* Format Selection */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Export Format
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                {exportFormats.map((format) => (
                  <div
                    key={format.id}
                    className={cn(
                      "flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all duration-200",
                      selectedFormat === format.id 
                        ? "border-blue-500 bg-blue-50 shadow-md" 
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    )}
                    onClick={() => setSelectedFormat(format.id)}
                  >
                    <div className="flex-shrink-0">
                      {format.icon}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{format.name}</div>
                      <div className="text-sm text-muted-foreground">{format.description}</div>
                      <div className="flex items-center gap-2 mt-1">
                        {format.supports_charts && (
                          <Badge variant="secondary" className="text-xs">Charts</Badge>
                        )}
                        {format.supports_raw_data && (
                          <Badge variant="secondary" className="text-xs">Raw Data</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Data Selection */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data Selection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {dataTypes.map((dataType) => (
                  <div key={dataType.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id={dataType.id}
                        checked={selectedDataTypes.includes(dataType.id)}
                        onCheckedChange={(checked) => handleDataTypeToggle(dataType.id, checked as boolean)}
                        disabled={!dataType.available}
                      />
                      <div>
                        <Label htmlFor={dataType.id} className="font-medium cursor-pointer">
                          {dataType.name}
                        </Label>
                        <div className="text-sm text-muted-foreground">{dataType.description}</div>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {dataType.estimated_size}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Export Options */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Export Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Time Range</Label>
                  <TimeRangeSelector 
                    value={timeRange} 
                    onChange={setTimeRange}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="custom-filename">Custom Filename (optional)</Label>
                  <Input
                    id="custom-filename"
                    placeholder="analytics-export"
                    value={customFilename}
                    onChange={(e) => setCustomFilename(e.target.value)}
                  />
                </div>

                {selectedFormatObj?.supports_charts && (
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="include-charts"
                      checked={includeCharts}
                      onCheckedChange={setIncludeCharts}
                    />
                    <Label htmlFor="include-charts">Include charts and visualizations</Label>
                  </div>
                )}

                {selectedFormatObj?.supports_raw_data && (
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="include-raw-data"
                      checked={includeRawData}
                      onCheckedChange={setIncludeRawData}
                    />
                    <Label htmlFor="include-raw-data">Include raw data tables</Label>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Switch
                    id="compression"
                    checked={compressionEnabled}
                    onCheckedChange={setCompressionEnabled}
                  />
                  <Label htmlFor="compression">Enable compression</Label>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium">Estimated file size:</span>
                  <span className="text-sm text-muted-foreground">{getEstimatedSize()}</span>
                </div>
                <Button 
                  onClick={handleExport} 
                  disabled={selectedDataTypes.length === 0 || exportMutation.isPending}
                  className="w-full gap-2"
                >
                  <Download className="h-4 w-4" />
                  {exportMutation.isPending ? 'Creating Export...' : 'Start Export'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Export History */}
        <div className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Export History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {exportHistory && exportHistory.length > 0 ? (
                  exportHistory.slice(0, 10).map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getJobStatusIcon(job.status)}
                        <div>
                          <div className="font-medium">
                            {job.format.toUpperCase()} Export
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(job.created_at).toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {job.data_types.join(', ')}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {job.status === 'processing' && (
                          <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">{job.progress}%</div>
                            <Progress value={job.progress} className="w-20 h-2" />
                          </div>
                        )}
                        {job.status === 'completed' && job.download_url && (
                          <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">
                              {job.file_size ? `${(job.file_size / 1024 / 1024).toFixed(1)}MB` : 'Ready'}
                            </div>
                            <Button size="sm" variant="outline" asChild>
                              <a href={job.download_url} download>
                                <Download className="h-3 w-3 mr-1" />
                                Download
                              </a>
                            </Button>
                          </div>
                        )}
                        {job.status === 'failed' && (
                          <div className="text-sm text-red-600">
                            Failed
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Download className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No export history</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Export Templates */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Quick Export Templates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    setSelectedFormat('excel');
                    setSelectedDataTypes(['kpi_metrics', 'trend_analysis']);
                    setIncludeCharts(true);
                  }}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Executive Dashboard Report
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    setSelectedFormat('csv');
                    setSelectedDataTypes(['raw_transactions', 'inventory_data']);
                    setIncludeRawData(true);
                  }}
                >
                  <Database className="h-4 w-4" />
                  Raw Data Analysis
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    setSelectedFormat('pdf');
                    setSelectedDataTypes(['predictive_analytics', 'customer_segmentation']);
                    setIncludeCharts(true);
                  }}
                >
                  <FileImage className="h-4 w-4" />
                  AI Insights Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DataExportInterface;