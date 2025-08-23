import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Switch } from '../../ui/switch';
import { Separator } from '../../ui/separator';
import { Progress } from '../../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel
} from '../../ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '../../ui/dialog';
import {
  Download,
  Share2,
  Copy,
  FileImage,
  FileText,
  Database,
  Code,
  Link,
  MessageSquare,
  Eye,
  EyeOff,
  Calendar,
  Tag,
  CheckCircle,
  AlertCircle,
  Loader2,
  X
} from 'lucide-react';
import { chartExportService, ExportOptions, ShareOptions, EmbedOptions } from '../../../services/chartExportService';
import { toast } from 'sonner';

export interface ChartExportMenuProps {
  chartElement: HTMLElement | null;
  chartData?: any[];
  chartConfig?: any;
  chartId?: string;
  className?: string;
  onExportComplete?: (result: any) => void;
  onShareComplete?: (shareUrl: string) => void;
}

export const ChartExportMenu: React.FC<ChartExportMenuProps> = ({
  chartElement,
  chartData = [],
  chartConfig,
  chartId = 'chart-' + Date.now(),
  className,
  onExportComplete,
  onShareComplete
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'png',
    quality: 1,
    backgroundColor: '#ffffff',
    includeMetadata: true
  });
  const [shareOptions, setShareOptions] = useState<ShareOptions>({
    title: 'Analytics Chart',
    description: '',
    tags: [],
    isPublic: true,
    allowComments: false
  });
  const [embedOptions, setEmbedOptions] = useState<EmbedOptions>({
    width: 800,
    height: 600,
    theme: 'light',
    interactive: true,
    showControls: true
  });
  const [shareUrl, setShareUrl] = useState<string>('');
  const [embedCode, setEmbedCode] = useState<string>('');
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [newTag, setNewTag] = useState('');

  // Handle export
  const handleExport = async (format: 'png' | 'svg' | 'pdf' | 'csv') => {
    if (!chartElement && format !== 'csv') {
      toast.error('Chart element not found');
      return;
    }

    if (format === 'csv' && (!chartData || chartData.length === 0)) {
      toast.error('No data available for CSV export');
      return;
    }

    setIsExporting(true);
    setExportProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setExportProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      let result;
      const options = { ...exportOptions, format };

      switch (format) {
        case 'png':
          result = await chartExportService.exportToPNG(chartElement!, options);
          break;
        case 'svg':
          result = await chartExportService.exportToSVG(chartElement!, options);
          break;
        case 'pdf':
          result = await chartExportService.exportToPDF(chartElement!, options);
          break;
        case 'csv':
          result = await chartExportService.exportToCSV(chartData, options);
          break;
      }

      clearInterval(progressInterval);
      setExportProgress(100);

      if (result.success) {
        toast.success(`Chart exported as ${format.toUpperCase()}`);
        onExportComplete?.(result);
      } else {
        toast.error(result.error || 'Export failed');
      }
    } catch (error) {
      toast.error('Export failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsExporting(false);
      setTimeout(() => setExportProgress(0), 1000);
    }
  };

  // Handle share
  const handleShare = async () => {
    if (!chartConfig) {
      toast.error('Chart configuration not available');
      return;
    }

    try {
      const url = await chartExportService.generateShareLink(chartConfig, shareOptions);
      setShareUrl(url);
      onShareComplete?.(url);
      toast.success('Share link generated');
    } catch (error) {
      toast.error('Failed to generate share link');
    }
  };

  // Generate embed code
  const generateEmbedCode = () => {
    const code = chartExportService.generateEmbedCode(chartId, embedOptions);
    setEmbedCode(code);
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  // Add tag
  const addTag = () => {
    if (newTag.trim() && !shareOptions.tags?.includes(newTag.trim())) {
      setShareOptions(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }));
      setNewTag('');
    }
  };

  // Remove tag
  const removeTag = (tagToRemove: string) => {
    setShareOptions(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  return (
    <div className={cn('relative', className)}>
      {/* Export Progress Overlay */}
      <AnimatePresence>
        {isExporting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <Card className="w-80">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Exporting Chart
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={exportProgress} className="mb-2" />
                <p className="text-sm text-muted-foreground text-center">
                  {exportProgress}% complete
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Export Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0">
            <Download className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Export Options</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => handleExport('png')}>
            <FileImage className="h-4 w-4 mr-2" />
            Export as PNG
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => handleExport('svg')}>
            <Code className="h-4 w-4 mr-2" />
            Export as SVG
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => handleExport('pdf')}>
            <FileText className="h-4 w-4 mr-2" />
            Export as PDF
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => handleExport('csv')}>
            <Database className="h-4 w-4 mr-2" />
            Export Data (CSV)
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
            <DialogTrigger asChild>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Share2 className="h-4 w-4 mr-2" />
                Share & Embed
              </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Share & Embed Chart</DialogTitle>
                <DialogDescription>
                  Share your chart with others or embed it in websites and applications.
                </DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="share" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="share">Share Link</TabsTrigger>
                  <TabsTrigger value="embed">Embed Code</TabsTrigger>
                </TabsList>

                <TabsContent value="share" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="share-title">Title</Label>
                      <Input
                        id="share-title"
                        value={shareOptions.title}
                        onChange={(e) => setShareOptions(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter chart title"
                      />
                    </div>

                    <div>
                      <Label htmlFor="share-description">Description</Label>
                      <Textarea
                        id="share-description"
                        value={shareOptions.description}
                        onChange={(e) => setShareOptions(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Enter chart description"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label>Tags</Label>
                      <div className="flex gap-2 mb-2">
                        <Input
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          placeholder="Add tag"
                          onKeyPress={(e) => e.key === 'Enter' && addTag()}
                        />
                        <Button onClick={addTag} size="sm">
                          <Tag className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {shareOptions.tags?.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 ml-1"
                              onClick={() => removeTag(tag)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Public Access</Label>
                        <p className="text-sm text-muted-foreground">
                          Allow anyone with the link to view this chart
                        </p>
                      </div>
                      <Switch
                        checked={shareOptions.isPublic}
                        onCheckedChange={(checked) => setShareOptions(prev => ({ ...prev, isPublic: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Allow Comments</Label>
                        <p className="text-sm text-muted-foreground">
                          Let viewers add comments and annotations
                        </p>
                      </div>
                      <Switch
                        checked={shareOptions.allowComments}
                        onCheckedChange={(checked) => setShareOptions(prev => ({ ...prev, allowComments: checked }))}
                      />
                    </div>

                    <Button onClick={handleShare} className="w-full">
                      <Link className="h-4 w-4 mr-2" />
                      Generate Share Link
                    </Button>

                    {shareUrl && (
                      <div className="p-3 bg-muted rounded-lg">
                        <Label className="text-sm font-medium">Share URL</Label>
                        <div className="flex gap-2 mt-1">
                          <Input value={shareUrl} readOnly className="text-sm" />
                          <Button
                            size="sm"
                            onClick={() => copyToClipboard(shareUrl, 'Share link')}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="embed" className="space-y-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="embed-width">Width (px)</Label>
                        <Input
                          id="embed-width"
                          type="number"
                          value={embedOptions.width}
                          onChange={(e) => setEmbedOptions(prev => ({ ...prev, width: parseInt(e.target.value) || 800 }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="embed-height">Height (px)</Label>
                        <Input
                          id="embed-height"
                          type="number"
                          value={embedOptions.height}
                          onChange={(e) => setEmbedOptions(prev => ({ ...prev, height: parseInt(e.target.value) || 600 }))}
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Theme</Label>
                      <div className="flex gap-2 mt-1">
                        <Button
                          variant={embedOptions.theme === 'light' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setEmbedOptions(prev => ({ ...prev, theme: 'light' }))}
                        >
                          Light
                        </Button>
                        <Button
                          variant={embedOptions.theme === 'dark' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setEmbedOptions(prev => ({ ...prev, theme: 'dark' }))}
                        >
                          Dark
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Interactive</Label>
                        <p className="text-sm text-muted-foreground">
                          Enable chart interactions (zoom, hover, etc.)
                        </p>
                      </div>
                      <Switch
                        checked={embedOptions.interactive}
                        onCheckedChange={(checked) => setEmbedOptions(prev => ({ ...prev, interactive: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Show Controls</Label>
                        <p className="text-sm text-muted-foreground">
                          Display export and sharing controls
                        </p>
                      </div>
                      <Switch
                        checked={embedOptions.showControls}
                        onCheckedChange={(checked) => setEmbedOptions(prev => ({ ...prev, showControls: checked }))}
                      />
                    </div>

                    <Button onClick={generateEmbedCode} className="w-full">
                      <Code className="h-4 w-4 mr-2" />
                      Generate Embed Code
                    </Button>

                    {embedCode && (
                      <div className="p-3 bg-muted rounded-lg">
                        <Label className="text-sm font-medium">Embed Code</Label>
                        <div className="mt-1">
                          <Textarea
                            value={embedCode}
                            readOnly
                            rows={6}
                            className="text-xs font-mono"
                          />
                          <Button
                            size="sm"
                            className="mt-2 w-full"
                            onClick={() => copyToClipboard(embedCode, 'Embed code')}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy Embed Code
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsShareDialogOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};