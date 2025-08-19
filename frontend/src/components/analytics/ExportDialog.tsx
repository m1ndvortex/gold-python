import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Download, FileText, Table, Image } from 'lucide-react';

interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv' | 'png';
  includeCharts: boolean;
  includeData: boolean;
  dateRange: boolean;
  filename: string;
}

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => void;
  title?: string;
  availableFormats?: Array<'pdf' | 'excel' | 'csv' | 'png'>;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  onClose,
  onExport,
  title = 'Export Analytics',
  availableFormats = ['pdf', 'excel', 'csv', 'png']
}) => {
  const [options, setOptions] = useState<ExportOptions>({
    format: 'pdf',
    includeCharts: true,
    includeData: true,
    dateRange: true,
    filename: `analytics-${new Date().toISOString().split('T')[0]}`
  });

  const formatOptions = [
    { value: 'pdf', label: 'PDF Document', icon: FileText, description: 'Complete report with charts and data' },
    { value: 'excel', label: 'Excel Spreadsheet', icon: Table, description: 'Data tables with formatting' },
    { value: 'csv', label: 'CSV File', icon: Table, description: 'Raw data for analysis' },
    { value: 'png', label: 'PNG Image', icon: Image, description: 'Chart images only' }
  ];

  const handleExport = () => {
    onExport(options);
    onClose();
  };

  const updateOptions = (key: keyof ExportOptions, value: any) => {
    setOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const selectedFormat = formatOptions.find(f => f.value === options.format);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            Choose your export format and options to download the analytics report.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div className="space-y-2">
            <Label>Export Format</Label>
            <Select value={options.format} onValueChange={(value: any) => updateOptions('format', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {formatOptions
                  .filter(format => availableFormats.includes(format.value as any))
                  .map((format) => (
                    <SelectItem key={format.value} value={format.value}>
                      <div className="flex items-center gap-2">
                        <format.icon className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{format.label}</div>
                          <div className="text-xs text-muted-foreground">{format.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Export Options */}
          <div className="space-y-3">
            <Label>Include in Export</Label>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeCharts"
                  checked={options.includeCharts}
                  onCheckedChange={(checked) => updateOptions('includeCharts', checked)}
                  disabled={options.format === 'csv'}
                />
                <Label htmlFor="includeCharts" className="text-sm">
                  Charts and visualizations
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeData"
                  checked={options.includeData}
                  onCheckedChange={(checked) => updateOptions('includeData', checked)}
                  disabled={options.format === 'png'}
                />
                <Label htmlFor="includeData" className="text-sm">
                  Raw data tables
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="dateRange"
                  checked={options.dateRange}
                  onCheckedChange={(checked) => updateOptions('dateRange', checked)}
                />
                <Label htmlFor="dateRange" className="text-sm">
                  Date range information
                </Label>
              </div>
            </div>
          </div>

          {/* Filename */}
          <div className="space-y-2">
            <Label htmlFor="filename">File Name</Label>
            <Input
              id="filename"
              value={options.filename}
              onChange={(e) => updateOptions('filename', e.target.value)}
              placeholder="Enter filename"
            />
            <p className="text-xs text-muted-foreground">
              File extension will be added automatically
            </p>
          </div>

          {/* Preview */}
          {selectedFormat && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm font-medium mb-1">Export Preview</div>
              <div className="text-xs text-muted-foreground">
                Format: {selectedFormat.label}<br />
                Filename: {options.filename}.{options.format}<br />
                Content: {[
                  options.includeCharts && 'Charts',
                  options.includeData && 'Data',
                  options.dateRange && 'Date Range'
                ].filter(Boolean).join(', ') || 'None selected'}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleExport}
            disabled={!options.filename || (!options.includeCharts && !options.includeData)}
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
