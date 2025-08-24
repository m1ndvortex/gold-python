import React, { useState, useCallback } from 'react';
import { useDrop, useDrag } from 'react-dnd';
import { ReportLayout, VisualizationConfig, ReportStyling } from '../../types/reportBuilder';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Slider } from '../ui/slider';
import { 
  Layout,
  Grid,
  Maximize2,
  Minimize2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Palette,
  Type,
  Monitor,
  Tablet,
  Smartphone,
  Printer,
  Download,
  Eye,
  RotateCcw,
  Settings,
  Move,
  Copy,
  Trash2
} from 'lucide-react';

interface LayoutDesignerProps {
  layout: ReportLayout;
  styling: ReportStyling;
  visualizations: VisualizationConfig[];
  onLayoutUpdate: (updates: Partial<ReportLayout>) => void;
  onStylingUpdate: (updates: Partial<ReportStyling>) => void;
  onVisualizationUpdate: (id: string, updates: Partial<VisualizationConfig>) => void;
}

interface LayoutTemplate {
  id: string;
  name: string;
  description: string;
  layout: {
    width: number;
    height: number;
    grid: { rows: number; cols: number };
  };
  positions: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
}

const LAYOUT_TEMPLATES: LayoutTemplate[] = [
  {
    id: 'single',
    name: 'Single View',
    description: 'One large visualization',
    layout: { width: 1200, height: 800, grid: { rows: 1, cols: 1 } },
    positions: [{ x: 50, y: 50, width: 1100, height: 700 }]
  },
  {
    id: 'dashboard',
    name: 'Dashboard',
    description: '2x2 grid layout',
    layout: { width: 1200, height: 800, grid: { rows: 2, cols: 2 } },
    positions: [
      { x: 25, y: 25, width: 575, height: 375 },
      { x: 625, y: 25, width: 575, height: 375 },
      { x: 25, y: 425, width: 575, height: 375 },
      { x: 625, y: 425, width: 575, height: 375 }
    ]
  },
  {
    id: 'sidebar',
    name: 'Sidebar Layout',
    description: 'Main content with sidebar',
    layout: { width: 1200, height: 800, grid: { rows: 1, cols: 2 } },
    positions: [
      { x: 25, y: 25, width: 350, height: 750 },
      { x: 400, y: 25, width: 775, height: 750 }
    ]
  },
  {
    id: 'header_content',
    name: 'Header + Content',
    description: 'Header with main content below',
    layout: { width: 1200, height: 800, grid: { rows: 2, cols: 1 } },
    positions: [
      { x: 25, y: 25, width: 1150, height: 200 },
      { x: 25, y: 250, width: 1150, height: 525 }
    ]
  },
  {
    id: 'three_column',
    name: 'Three Columns',
    description: 'Equal width columns',
    layout: { width: 1200, height: 800, grid: { rows: 1, cols: 3 } },
    positions: [
      { x: 25, y: 25, width: 375, height: 750 },
      { x: 425, y: 25, width: 375, height: 750 },
      { x: 825, y: 25, width: 375, height: 750 }
    ]
  }
];

const PAGE_SIZES = [
  { value: 'a4', label: 'A4 (210 × 297mm)', width: 794, height: 1123 },
  { value: 'letter', label: 'Letter (8.5 × 11in)', width: 816, height: 1056 },
  { value: 'legal', label: 'Legal (8.5 × 14in)', width: 816, height: 1344 },
  { value: 'tabloid', label: 'Tabloid (11 × 17in)', width: 1056, height: 1632 },
  { value: 'custom', label: 'Custom Size', width: 1200, height: 800 }
];

const FONT_FAMILIES = [
  'Inter',
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Georgia',
  'Verdana',
  'Tahoma',
  'Trebuchet MS',
  'Courier New',
  'Lucida Console'
];

const THEME_PRESETS = [
  {
    name: 'Light',
    theme: 'light' as const,
    primaryColor: '#3b82f6',
    backgroundColor: '#ffffff',
    textColor: '#1f2937',
    borderColor: '#e5e7eb'
  },
  {
    name: 'Dark',
    theme: 'dark' as const,
    primaryColor: '#60a5fa',
    backgroundColor: '#1f2937',
    textColor: '#f9fafb',
    borderColor: '#374151'
  },
  {
    name: 'Corporate',
    theme: 'light' as const,
    primaryColor: '#1e40af',
    backgroundColor: '#f8fafc',
    textColor: '#0f172a',
    borderColor: '#cbd5e1'
  },
  {
    name: 'Minimal',
    theme: 'light' as const,
    primaryColor: '#6b7280',
    backgroundColor: '#ffffff',
    textColor: '#374151',
    borderColor: '#d1d5db'
  }
];

export const LayoutDesigner: React.FC<LayoutDesignerProps> = ({
  layout,
  styling,
  visualizations,
  onLayoutUpdate,
  onStylingUpdate,
  onVisualizationUpdate
}) => {
  const [activeTab, setActiveTab] = useState('layout');
  const [selectedVisualization, setSelectedVisualization] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile' | 'print'>('desktop');
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize, setGridSize] = useState(20);

  const applyLayoutTemplate = useCallback((template: LayoutTemplate) => {
    onLayoutUpdate({
      width: template.layout.width,
      height: template.layout.height
    });

    // Apply positions to existing visualizations
    visualizations.slice(0, template.positions.length).forEach((viz, index) => {
      const position = template.positions[index];
      onVisualizationUpdate(viz.id, { position });
    });
  }, [visualizations, onLayoutUpdate, onVisualizationUpdate]);

  const applyThemePreset = useCallback((preset: typeof THEME_PRESETS[0]) => {
    onStylingUpdate({
      theme: preset.theme,
      primaryColor: preset.primaryColor,
      backgroundColor: preset.backgroundColor
    });
  }, [onStylingUpdate]);

  const handlePageSizeChange = useCallback((pageSize: string) => {
    const size = PAGE_SIZES.find(s => s.value === pageSize);
    if (size && size.value !== 'custom') {
      onLayoutUpdate({
        width: size.width,
        height: size.height
      });
    }
  }, [onLayoutUpdate]);

  const getPreviewDimensions = () => {
    const baseWidth = layout.width;
    const baseHeight = layout.height;
    
    switch (previewMode) {
      case 'tablet':
        return { width: Math.min(baseWidth, 768), height: baseHeight * (768 / baseWidth) };
      case 'mobile':
        return { width: Math.min(baseWidth, 375), height: baseHeight * (375 / baseWidth) };
      case 'print':
        return { width: baseWidth * 0.8, height: baseHeight * 0.8 };
      default:
        return { width: baseWidth, height: baseHeight };
    }
  };

  const duplicateVisualization = useCallback((viz: VisualizationConfig) => {
    const newViz: VisualizationConfig = {
      ...viz,
      id: `${viz.id}_copy_${Date.now()}`,
      position: {
        ...viz.position,
        x: viz.position.x + 20,
        y: viz.position.y + 20
      },
      styling: {
        ...viz.styling,
        title: `${viz.styling.title || 'Untitled'} (Copy)`
      }
    };
    
    // This would need to be handled by the parent component
    console.log('Duplicate visualization:', newViz);
  }, []);

  const alignVisualizations = useCallback((alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (visualizations.length < 2) return;

    const selectedVizs = visualizations.filter(v => selectedVisualization === v.id || visualizations.length === 2);
    if (selectedVizs.length < 2) return;

    const updates: Array<{ id: string; position: any }> = [];

    switch (alignment) {
      case 'left':
        const leftX = Math.min(...selectedVizs.map(v => v.position.x));
        selectedVizs.forEach(v => {
          updates.push({ id: v.id, position: { ...v.position, x: leftX } });
        });
        break;
      case 'center':
        const centerX = selectedVizs.reduce((sum, v) => sum + v.position.x + v.position.width / 2, 0) / selectedVizs.length;
        selectedVizs.forEach(v => {
          updates.push({ id: v.id, position: { ...v.position, x: centerX - v.position.width / 2 } });
        });
        break;
      case 'right':
        const rightX = Math.max(...selectedVizs.map(v => v.position.x + v.position.width));
        selectedVizs.forEach(v => {
          updates.push({ id: v.id, position: { ...v.position, x: rightX - v.position.width } });
        });
        break;
      case 'top':
        const topY = Math.min(...selectedVizs.map(v => v.position.y));
        selectedVizs.forEach(v => {
          updates.push({ id: v.id, position: { ...v.position, y: topY } });
        });
        break;
      case 'middle':
        const middleY = selectedVizs.reduce((sum, v) => sum + v.position.y + v.position.height / 2, 0) / selectedVizs.length;
        selectedVizs.forEach(v => {
          updates.push({ id: v.id, position: { ...v.position, y: middleY - v.position.height / 2 } });
        });
        break;
      case 'bottom':
        const bottomY = Math.max(...selectedVizs.map(v => v.position.y + v.position.height));
        selectedVizs.forEach(v => {
          updates.push({ id: v.id, position: { ...v.position, y: bottomY - v.position.height } });
        });
        break;
    }

    updates.forEach(update => {
      onVisualizationUpdate(update.id, { position: update.position });
    });
  }, [visualizations, selectedVisualization, onVisualizationUpdate]);

  const distributeVisualizations = useCallback((direction: 'horizontal' | 'vertical') => {
    if (visualizations.length < 3) return;

    const sortedVizs = [...visualizations].sort((a, b) => 
      direction === 'horizontal' 
        ? a.position.x - b.position.x 
        : a.position.y - b.position.y
    );

    const first = sortedVizs[0];
    const last = sortedVizs[sortedVizs.length - 1];
    
    if (direction === 'horizontal') {
      const totalSpace = (last.position.x + last.position.width) - first.position.x;
      const totalWidth = sortedVizs.reduce((sum, v) => sum + v.position.width, 0);
      const spacing = (totalSpace - totalWidth) / (sortedVizs.length - 1);
      
      let currentX = first.position.x;
      sortedVizs.forEach((viz, index) => {
        if (index > 0) {
          onVisualizationUpdate(viz.id, { 
            position: { ...viz.position, x: currentX } 
          });
        }
        currentX += viz.position.width + spacing;
      });
    } else {
      const totalSpace = (last.position.y + last.position.height) - first.position.y;
      const totalHeight = sortedVizs.reduce((sum, v) => sum + v.position.height, 0);
      const spacing = (totalSpace - totalHeight) / (sortedVizs.length - 1);
      
      let currentY = first.position.y;
      sortedVizs.forEach((viz, index) => {
        if (index > 0) {
          onVisualizationUpdate(viz.id, { 
            position: { ...viz.position, y: currentY } 
          });
        }
        currentY += viz.position.height + spacing;
      });
    }
  }, [visualizations, onVisualizationUpdate]);

  return (
    <div className="space-y-4">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg border-2 border-cyan-200">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg">
            <Layout className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-foreground">Layout Designer</h3>
            <p className="text-sm text-muted-foreground">Design and customize your report layout</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Enhanced Preview Mode Selector */}
          <div className="flex items-center bg-white border-2 border-cyan-200 rounded-lg p-1 shadow-lg">
            <Button
              variant={previewMode === 'desktop' ? 'default' : 'ghost'}
              size="sm"
              className={`h-8 px-3 transition-all duration-300 ${
                previewMode === 'desktop' 
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg' 
                  : 'hover:bg-cyan-50'
              }`}
              onClick={() => setPreviewMode('desktop')}
            >
              <Monitor className="w-4 h-4" />
            </Button>
            <Button
              variant={previewMode === 'tablet' ? 'default' : 'ghost'}
              size="sm"
              className={`h-8 px-3 transition-all duration-300 ${
                previewMode === 'tablet' 
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg' 
                  : 'hover:bg-cyan-50'
              }`}
              onClick={() => setPreviewMode('tablet')}
            >
              <Tablet className="w-4 h-4" />
            </Button>
            <Button
              variant={previewMode === 'mobile' ? 'default' : 'ghost'}
              size="sm"
              className={`h-8 px-3 transition-all duration-300 ${
                previewMode === 'mobile' 
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg' 
                  : 'hover:bg-cyan-50'
              }`}
              onClick={() => setPreviewMode('mobile')}
            >
              <Smartphone className="w-4 h-4" />
            </Button>
            <Button
              variant={previewMode === 'print' ? 'default' : 'ghost'}
              size="sm"
              className={`h-8 px-3 transition-all duration-300 ${
                previewMode === 'print' 
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg' 
                  : 'hover:bg-cyan-50'
              }`}
              onClick={() => setPreviewMode('print')}
            >
              <Printer className="w-4 h-4" />
            </Button>
          </div>

          <Button variant="outline" size="sm" className="border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-300">
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="bg-gradient-to-r from-cyan-50 via-blue-50 to-indigo-50 border-2 border-cyan-200 rounded-lg p-1 mb-6">
          <TabsList className="grid w-full grid-cols-4 bg-transparent h-auto p-1 gap-1">
            <TabsTrigger 
              value="layout" 
              className="flex items-center gap-2 p-3 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-cyan-300"
            >
              <div className="h-6 w-6 rounded-full bg-cyan-100 flex items-center justify-center">
                <Layout className="w-3 h-3 text-cyan-600" />
              </div>
              <span className="font-medium text-sm">Layout</span>
            </TabsTrigger>
            <TabsTrigger 
              value="styling" 
              className="flex items-center gap-2 p-3 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-blue-300"
            >
              <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                <Palette className="w-3 h-3 text-blue-600" />
              </div>
              <span className="font-medium text-sm">Styling</span>
            </TabsTrigger>
            <TabsTrigger 
              value="alignment" 
              className="flex items-center gap-2 p-3 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-indigo-300"
            >
              <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center">
                <AlignCenter className="w-3 h-3 text-indigo-600" />
              </div>
              <span className="font-medium text-sm">Alignment</span>
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="flex items-center gap-2 p-3 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-purple-300"
            >
              <div className="h-6 w-6 rounded-full bg-purple-100 flex items-center justify-center">
                <Settings className="w-3 h-3 text-purple-600" />
              </div>
              <span className="font-medium text-sm">Settings</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="layout" className="space-y-4 mt-0">
          <div className="bg-gradient-to-br from-cyan-50/30 to-white p-4 rounded-lg">
            {/* Layout Templates */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50">
              <CardHeader className="pb-4 bg-gradient-to-r from-cyan-50 to-blue-50 border-b-2 border-cyan-200">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                    <Grid className="h-4 w-4 text-white" />
                  </div>
                  <CardTitle className="text-lg font-semibold">Layout Templates</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-3">
                  {LAYOUT_TEMPLATES.map((template) => (
                    <div
                      key={template.id}
                      className="p-3 border-0 rounded-lg cursor-pointer transition-all duration-300 shadow-lg hover:shadow-xl bg-gradient-to-r from-slate-50 to-slate-100 hover:from-cyan-50 hover:to-blue-50"
                      onClick={() => applyLayoutTemplate(template)}
                    >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{template.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {template.positions.length}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{template.description}</p>
                    
                    {/* Template Preview */}
                    <div className="w-full h-12 border rounded bg-muted/20 relative overflow-hidden">
                      {template.positions.map((pos, index) => (
                        <div
                          key={index}
                          className="absolute bg-primary/20 border border-primary/40 rounded-sm"
                          style={{
                            left: `${(pos.x / template.layout.width) * 100}%`,
                            top: `${(pos.y / template.layout.height) * 100}%`,
                            width: `${(pos.width / template.layout.width) * 100}%`,
                            height: `${(pos.height / template.layout.height) * 100}%`
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

            {/* Page Size */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50">
              <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <Monitor className="h-4 w-4 text-white" />
                  </div>
                  <CardTitle className="text-lg font-semibold">Page Size</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Page Size</Label>
                  <Select onValueChange={handlePageSizeChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZES.map((size) => (
                        <SelectItem key={size.value} value={size.value}>
                          {size.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs">Orientation</Label>
                  <Select
                    value={layout.width > layout.height ? 'landscape' : 'portrait'}
                    onValueChange={(value) => {
                      if (value === 'landscape' && layout.width < layout.height) {
                        onLayoutUpdate({ width: layout.height, height: layout.width });
                      } else if (value === 'portrait' && layout.width > layout.height) {
                        onLayoutUpdate({ width: layout.height, height: layout.width });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="portrait">Portrait</SelectItem>
                      <SelectItem value="landscape">Landscape</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Width (px)</Label>
                  <Input
                    type="number"
                    value={layout.width}
                    onChange={(e) => onLayoutUpdate({ width: parseInt(e.target.value) || 1200 })}
                    min="200"
                    max="5000"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Height (px)</Label>
                  <Input
                    type="number"
                    value={layout.height}
                    onChange={(e) => onLayoutUpdate({ height: parseInt(e.target.value) || 800 })}
                    min="200"
                    max="5000"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          </div>
        </TabsContent>

        <TabsContent value="styling" className="space-y-4 mt-0">
          <div className="bg-gradient-to-br from-blue-50/30 to-white p-4 rounded-lg">
            {/* Theme Presets */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50">
              <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <Palette className="h-4 w-4 text-white" />
                  </div>
                  <CardTitle className="text-lg font-semibold">Theme Presets</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-3">
                  {THEME_PRESETS.map((preset) => (
                    <div
                      key={preset.name}
                      className={`
                        p-3 border-0 rounded-lg cursor-pointer transition-all duration-300 shadow-lg hover:shadow-xl
                        ${styling.theme === preset.theme && styling.primaryColor === preset.primaryColor
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-xl'
                          : 'bg-gradient-to-r from-slate-50 to-slate-100 hover:from-blue-50 hover:to-indigo-50'
                        }
                      `}
                      onClick={() => applyThemePreset(preset)}
                    >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{preset.name}</span>
                      <div className="flex gap-1">
                        <div 
                          className="w-3 h-3 rounded border"
                          style={{ backgroundColor: preset.primaryColor }}
                        />
                        <div 
                          className="w-3 h-3 rounded border"
                          style={{ backgroundColor: preset.backgroundColor }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

            {/* Custom Styling */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50">
              <CardHeader className="pb-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b-2 border-indigo-200">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <Type className="h-4 w-4 text-white" />
                  </div>
                  <CardTitle className="text-lg font-semibold">Custom Styling</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Primary Color</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={styling.primaryColor}
                      onChange={(e) => onStylingUpdate({ primaryColor: e.target.value })}
                      className="w-10 h-8 rounded border cursor-pointer"
                    />
                    <Input
                      value={styling.primaryColor}
                      onChange={(e) => onStylingUpdate({ primaryColor: e.target.value })}
                      placeholder="#3b82f6"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Background Color</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={styling.backgroundColor}
                      onChange={(e) => onStylingUpdate({ backgroundColor: e.target.value })}
                      className="w-10 h-8 rounded border cursor-pointer"
                    />
                    <Input
                      value={styling.backgroundColor}
                      onChange={(e) => onStylingUpdate({ backgroundColor: e.target.value })}
                      placeholder="#ffffff"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Font Family</Label>
                  <Select
                    value={styling.fontFamily}
                    onValueChange={(value) => onStylingUpdate({ fontFamily: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_FAMILIES.map((font) => (
                        <SelectItem key={font} value={font}>
                          <span style={{ fontFamily: font }}>{font}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Font Size</Label>
                  <div className="flex items-center gap-2">
                    <Slider
                      value={[styling.fontSize]}
                      onValueChange={([value]) => onStylingUpdate({ fontSize: value })}
                      min={8}
                      max={24}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-xs w-8">{styling.fontSize}px</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          </div>
        </TabsContent>

        <TabsContent value="alignment" className="space-y-4 mt-0">
          <div className="bg-gradient-to-br from-indigo-50/30 to-white p-4 rounded-lg">
            {/* Alignment Tools */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50">
              <CardHeader className="pb-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b-2 border-indigo-200">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <AlignCenter className="h-4 w-4 text-white" />
                  </div>
                  <CardTitle className="text-lg font-semibold">Alignment Tools</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
              <div className="space-y-3">
                <div>
                  <Label className="text-xs font-medium mb-2 block">Horizontal Alignment</Label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => alignVisualizations('left')}
                      disabled={visualizations.length < 2}
                    >
                      <AlignLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => alignVisualizations('center')}
                      disabled={visualizations.length < 2}
                    >
                      <AlignCenter className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => alignVisualizations('right')}
                      disabled={visualizations.length < 2}
                    >
                      <AlignRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-medium mb-2 block">Vertical Alignment</Label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => alignVisualizations('top')}
                      disabled={visualizations.length < 2}
                    >
                      <AlignLeft className="w-4 h-4 rotate-90" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => alignVisualizations('middle')}
                      disabled={visualizations.length < 2}
                    >
                      <AlignCenter className="w-4 h-4 rotate-90" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => alignVisualizations('bottom')}
                      disabled={visualizations.length < 2}
                    >
                      <AlignRight className="w-4 h-4 rotate-90" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-medium mb-2 block">Distribution</Label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => distributeVisualizations('horizontal')}
                      disabled={visualizations.length < 3}
                    >
                      <AlignJustify className="w-4 h-4" />
                      Horizontal
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => distributeVisualizations('vertical')}
                      disabled={visualizations.length < 3}
                    >
                      <AlignJustify className="w-4 h-4 rotate-90" />
                      Vertical
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

            {/* Grid Settings */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50">
              <CardHeader className="pb-4 bg-gradient-to-r from-purple-50 to-pink-50 border-b-2 border-purple-200">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                    <Grid className="h-4 w-4 text-white" />
                  </div>
                  <CardTitle className="text-lg font-semibold">Grid & Snapping</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm">Show Grid</Label>
                  <p className="text-xs text-muted-foreground">Display alignment grid</p>
                </div>
                <Switch
                  checked={showGrid}
                  onCheckedChange={setShowGrid}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm">Snap to Grid</Label>
                  <p className="text-xs text-muted-foreground">Automatically align to grid</p>
                </div>
                <Switch
                  checked={snapToGrid}
                  onCheckedChange={setSnapToGrid}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Grid Size</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[gridSize]}
                    onValueChange={([value]) => setGridSize(value)}
                    min={5}
                    max={50}
                    step={5}
                    className="flex-1"
                  />
                  <span className="text-xs w-8">{gridSize}px</span>
                </div>
              </div>
            </CardContent>
          </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4 mt-0">
          <div className="bg-gradient-to-br from-purple-50/30 to-white p-4 rounded-lg">
            {/* Export Settings */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50">
              <CardHeader className="pb-4 bg-gradient-to-r from-purple-50 to-pink-50 border-b-2 border-purple-200">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                    <Download className="h-4 w-4 text-white" />
                  </div>
                  <CardTitle className="text-lg font-semibold">Export Settings</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="h-auto p-3 flex flex-col items-center gap-2">
                  <Download className="w-5 h-5" />
                  <div className="text-center">
                    <div className="font-medium text-sm">Export PDF</div>
                    <div className="text-xs text-muted-foreground">Print-ready format</div>
                  </div>
                </Button>
                
                <Button variant="outline" className="h-auto p-3 flex flex-col items-center gap-2">
                  <Download className="w-5 h-5" />
                  <div className="text-center">
                    <div className="font-medium text-sm">Export PNG</div>
                    <div className="text-xs text-muted-foreground">High-quality image</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Advanced Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Advanced Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm">Auto-save Layout</Label>
                  <p className="text-xs text-muted-foreground">Automatically save changes</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm">Responsive Layout</Label>
                  <p className="text-xs text-muted-foreground">Adapt to different screen sizes</p>
                </div>
                <Switch />
              </div>

              <Button variant="outline" className="w-full">
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset to Default Layout
              </Button>
            </CardContent>
          </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Layout Preview */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Layout Preview</CardTitle>
            <Badge variant="outline" className="text-xs">
              {getPreviewDimensions().width} × {getPreviewDimensions().height}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div 
            className="border rounded-lg bg-muted/10 relative overflow-hidden mx-auto"
            style={{
              width: Math.min(400, getPreviewDimensions().width * 0.3),
              height: Math.min(300, getPreviewDimensions().height * 0.3),
              backgroundColor: styling.backgroundColor
            }}
          >
            {/* Grid */}
            {showGrid && (
              <div className="absolute inset-0 opacity-20">
                <svg width="100%" height="100%">
                  <defs>
                    <pattern
                      id="grid"
                      width={gridSize * 0.3}
                      height={gridSize * 0.3}
                      patternUnits="userSpaceOnUse"
                    >
                      <path
                        d={`M ${gridSize * 0.3} 0 L 0 0 0 ${gridSize * 0.3}`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="0.5"
                      />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
              </div>
            )}

            {/* Visualizations */}
            {visualizations.map((viz) => (
              <div
                key={viz.id}
                className={`
                  absolute border rounded bg-card shadow-sm
                  ${selectedVisualization === viz.id ? 'border-primary' : 'border-border'}
                `}
                style={{
                  left: viz.position.x * 0.3,
                  top: viz.position.y * 0.3,
                  width: viz.position.width * 0.3,
                  height: viz.position.height * 0.3
                }}
                onClick={() => setSelectedVisualization(viz.id)}
              >
                <div className="p-1 text-xs truncate">
                  {viz.styling.title || 'Untitled'}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Layout Preview Component with Drag and Drop
interface LayoutPreviewProps {
  layout: ReportLayout;
  visualizations: VisualizationConfig[];
  onVisualizationUpdate: (id: string, updates: Partial<VisualizationConfig>) => void;
  showGrid: boolean;
  gridSize: number;
  snapToGrid: boolean;
}

const LayoutPreview: React.FC<LayoutPreviewProps> = ({
  layout,
  visualizations,
  onVisualizationUpdate,
  showGrid,
  gridSize,
  snapToGrid
}) => {
  const [selectedViz, setSelectedViz] = useState<string | null>(null);

  const snapToGridValue = (value: number) => {
    if (!snapToGrid) return value;
    return Math.round(value / gridSize) * gridSize;
  };

  return (
    <div className="relative border rounded-lg overflow-hidden bg-background">
      <div
        className="relative"
        style={{
          width: Math.min(400, layout.width * 0.3),
          height: Math.min(300, layout.height * 0.3),
          backgroundImage: showGrid 
            ? `radial-gradient(circle, #e5e7eb 1px, transparent 1px)`
            : 'none',
          backgroundSize: showGrid 
            ? `${gridSize * 0.3}px ${gridSize * 0.3}px`
            : 'auto'
        }}
      >
        {visualizations.map((viz) => (
          <DraggableVisualizationPreview
            key={viz.id}
            visualization={viz}
            scale={0.3}
            isSelected={selectedViz === viz.id}
            onSelect={() => setSelectedViz(viz.id)}
            onUpdate={(updates) => {
              if (updates.position) {
                const scaledPosition = {
                  ...updates.position,
                  x: snapToGridValue(updates.position.x / 0.3),
                  y: snapToGridValue(updates.position.y / 0.3)
                };
                onVisualizationUpdate(viz.id, { position: scaledPosition });
              } else {
                onVisualizationUpdate(viz.id, updates);
              }
            }}
          />
        ))}
      </div>
    </div>
  );
};

// Draggable Visualization Preview
interface DraggableVisualizationPreviewProps {
  visualization: VisualizationConfig;
  scale: number;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<VisualizationConfig>) => void;
}

const DraggableVisualizationPreview: React.FC<DraggableVisualizationPreviewProps> = ({
  visualization,
  scale,
  isSelected,
  onSelect,
  onUpdate
}) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'visualization',
    item: { id: visualization.id, type: 'visualization' },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'visualization',
    drop: (item: any, monitor) => {
      const offset = monitor.getClientOffset();
      const containerRect = (monitor.getDropResult() as any)?.getBoundingClientRect?.();
      
      if (offset && containerRect) {
        const x = (offset.x - containerRect.left) / scale;
        const y = (offset.y - containerRect.top) / scale;
        
        onUpdate({
          position: {
            ...visualization.position,
            x: Math.max(0, x),
            y: Math.max(0, y)
          }
        });
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  return (
    <div
      ref={(node) => drag(drop(node))}
      className={`
        absolute border rounded cursor-move transition-all
        ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'}
        ${isDragging ? 'opacity-50' : ''}
        ${isOver ? 'ring-2 ring-blue-400' : ''}
      `}
      style={{
        left: visualization.position.x * scale,
        top: visualization.position.y * scale,
        width: visualization.position.width * scale,
        height: visualization.position.height * scale,
        minWidth: 40,
        minHeight: 30
      }}
      onClick={onSelect}
    >
      <div className="p-1 text-xs truncate bg-gray-100 border-b">
        {visualization.styling.title || 'Untitled'}
      </div>
      <div className="flex items-center justify-center h-full text-xs text-gray-500">
        {visualization.type === 'chart' ? visualization.chartType : visualization.type}
      </div>
    </div>
  );
};