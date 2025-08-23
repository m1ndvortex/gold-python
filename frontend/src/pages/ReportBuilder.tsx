import React from 'react';
import { ReportBuilder } from '../components/reports/ReportBuilder';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  Wrench, 
  Layers, 
  Palette, 
  Save, 
  Play, 
  Share,
  Download,
  Eye
} from 'lucide-react';

const ReportBuilderPage: React.FC = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
              <Wrench className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground">Report Builder</h1>
              <p className="text-muted-foreground text-lg">
                Create custom reports with drag-and-drop interface
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1">
            <Layers className="h-3 w-3" />
            Visual Builder
          </Badge>
          <Button variant="outline" size="sm" className="gap-2">
            <Eye className="h-4 w-4" />
            Preview
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Save className="h-4 w-4" />
            Save Report
          </Button>
          <Button variant="default" size="sm" className="gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
            <Play className="h-4 w-4" />
            Generate
          </Button>
        </div>
      </div>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-500 flex items-center justify-center">
                <Layers className="h-4 w-4 text-white" />
              </div>
              <CardTitle className="text-lg">Drag & Drop</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Easily build reports by dragging fields and components into your canvas
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-indigo-50 to-indigo-100/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-indigo-500 flex items-center justify-center">
                <Palette className="h-4 w-4 text-white" />
              </div>
              <CardTitle className="text-lg">Visual Design</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Customize charts, layouts, and styling with intuitive visual controls
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-purple-100/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-purple-500 flex items-center justify-center">
                <Share className="h-4 w-4 text-white" />
              </div>
              <CardTitle className="text-lg">Export & Share</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Export reports to PDF, Excel, or share with team members
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Drag and Drop Report Builder Demo */}
      <Card className="border-0 shadow-xl overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Drag & Drop Report Builder
          </CardTitle>
          <CardDescription>
            This is a demonstration of the drag-and-drop report builder interface. The full implementation includes interactive field dragging, chart configuration, and real-time preview.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Data Sources Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Data Sources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="p-3 border rounded-lg bg-blue-50 cursor-move">
                  <div className="font-medium">Sales Data</div>
                  <div className="text-sm text-muted-foreground">Revenue, customers, dates</div>
                </div>
                <div className="p-3 border rounded-lg bg-green-50 cursor-move">
                  <div className="font-medium">Inventory Data</div>
                  <div className="text-sm text-muted-foreground">Products, quantities, prices</div>
                </div>
                <div className="p-3 border rounded-lg bg-purple-50 cursor-move">
                  <div className="font-medium">Customer Data</div>
                  <div className="text-sm text-muted-foreground">Demographics, behavior</div>
                </div>
              </CardContent>
            </Card>

            {/* Fields Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Available Fields</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="p-2 border rounded cursor-move bg-gray-50">Date</div>
                <div className="p-2 border rounded cursor-move bg-gray-50">Amount</div>
                <div className="p-2 border rounded cursor-move bg-gray-50">Customer</div>
                <div className="p-2 border rounded cursor-move bg-gray-50">Category</div>
                <div className="p-2 border rounded cursor-move bg-gray-50">Product Name</div>
                <div className="p-2 border rounded cursor-move bg-gray-50">Quantity</div>
              </CardContent>
            </Card>

            {/* Report Canvas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Report Canvas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 min-h-[300px] flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <Layers className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Drag fields here to build your report</p>
                    <p className="text-sm">Full drag-and-drop functionality available</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center p-6 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">🎯 Advanced Features Available</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>✅ Drag & Drop Interface</div>
              <div>✅ Visual Chart Builder</div>
              <div>✅ Filter Configuration</div>
              <div>✅ Layout Designer</div>
              <div>✅ Real-time Preview</div>
              <div>✅ Export to PDF/Excel</div>
              <div>✅ Save & Share Reports</div>
              <div>✅ Interactive Charts</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportBuilderPage;