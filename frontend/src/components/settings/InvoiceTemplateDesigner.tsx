import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  FileText, 
  Palette, 
  Layout, 
  Eye, 
  Save,
  RotateCcw
} from 'lucide-react';
import { useInvoiceTemplate, useUpdateInvoiceTemplate } from '../../hooks/useSettings';
import { InvoiceTemplate, InvoiceTemplateUpdate } from '../../types';
import { useLanguage } from '../../hooks/useLanguage';

interface TemplateFormData {
  name: string;
  layout: string;
  page_size: string;
  font_family: string;
  primary_color: string;
  secondary_color: string;
  margin_top: number;
  margin_right: number;
  margin_bottom: number;
  margin_left: number;
}

export const InvoiceTemplateDesigner: React.FC = () => {
  const { t } = useLanguage();
  const { data: template, isLoading } = useInvoiceTemplate();
  const updateTemplate = useUpdateInvoiceTemplate();
  const [previewMode, setPreviewMode] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<TemplateFormData>();

  const watchedValues = watch();

  useEffect(() => {
    if (template) {
      reset({
        name: template.name || 'Default Template',
        layout: template.layout || 'portrait',
        page_size: template.page_size || 'A4',
        font_family: template.styles?.font_family || 'Arial',
        primary_color: template.styles?.primary_color || '#333333',
        secondary_color: template.styles?.secondary_color || '#666666',
        margin_top: template.margins?.top || 20,
        margin_right: template.margins?.right || 20,
        margin_bottom: template.margins?.bottom || 20,
        margin_left: template.margins?.left || 20,
      });
    }
  }, [template, reset]);

  const onSubmit = async (data: TemplateFormData) => {
    if (!template) return;

    const updatedTemplate: InvoiceTemplate = {
      ...template,
      name: data.name,
      layout: data.layout,
      page_size: data.page_size,
      margins: {
        top: data.margin_top,
        right: data.margin_right,
        bottom: data.margin_bottom,
        left: data.margin_left,
      },
      styles: {
        ...template.styles,
        font_family: data.font_family,
        primary_color: data.primary_color,
        secondary_color: data.secondary_color,
      },
    };

    const templateUpdate: InvoiceTemplateUpdate = {
      template: updatedTemplate,
    };

    updateTemplate.mutate(templateUpdate);
  };

  const resetToDefault = () => {
    reset({
      name: 'Default Template',
      layout: 'portrait',
      page_size: 'A4',
      font_family: 'Arial',
      primary_color: '#333333',
      secondary_color: '#666666',
      margin_top: 20,
      margin_right: 20,
      margin_bottom: 20,
      margin_left: 20,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-10 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const InvoicePreview = () => (
    <div 
      className="bg-white border shadow-lg mx-auto"
      style={{
        width: watchedValues.page_size === 'A4' ? '210mm' : '216mm',
        minHeight: watchedValues.page_size === 'A4' ? '297mm' : '279mm',
        fontFamily: watchedValues.font_family,
        color: watchedValues.primary_color,
        padding: `${watchedValues.margin_top}px ${watchedValues.margin_right}px ${watchedValues.margin_bottom}px ${watchedValues.margin_left}px`,
        transform: 'scale(0.5)',
        transformOrigin: 'top center',
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-6 pb-4 border-b-2" style={{ borderColor: watchedValues.secondary_color }}>
        <div>
          <div className="w-20 h-10 bg-gray-200 rounded mb-2"></div>
          <h1 className="text-2xl font-bold">Gold Shop</h1>
          <p style={{ color: watchedValues.secondary_color }}>123 Main Street, City, Country</p>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-bold mb-2">INVOICE</h2>
          <p><strong>Invoice #:</strong> INV-001</p>
          <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {/* Customer Info */}
      <div className="mb-6">
        <h3 className="font-bold mb-2" style={{ color: watchedValues.secondary_color }}>Bill To:</h3>
        <p><strong>Customer Name</strong></p>
        <p>Customer Address</p>
        <p>Phone: +1234567890</p>
      </div>

      {/* Items Table */}
      <table className="w-full mb-6 border-collapse">
        <thead>
          <tr style={{ backgroundColor: `${watchedValues.primary_color}10` }}>
            <th className="border p-2 text-left">Item</th>
            <th className="border p-2 text-center">Weight (g)</th>
            <th className="border p-2 text-center">Qty</th>
            <th className="border p-2 text-right">Price</th>
            <th className="border p-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border p-2">Gold Ring</td>
            <td className="border p-2 text-center">5.2</td>
            <td className="border p-2 text-center">1</td>
            <td className="border p-2 text-right">$260.00</td>
            <td className="border p-2 text-right">$260.00</td>
          </tr>
          <tr>
            <td className="border p-2">Gold Necklace</td>
            <td className="border p-2 text-center">12.8</td>
            <td className="border p-2 text-center">1</td>
            <td className="border p-2 text-right">$640.00</td>
            <td className="border p-2 text-right">$640.00</td>
          </tr>
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-6">
        <div className="w-64">
          <div className="flex justify-between py-1">
            <span>Subtotal:</span>
            <span>$900.00</span>
          </div>
          <div className="flex justify-between py-1" style={{ color: watchedValues.secondary_color }}>
            <span>Labor (10%):</span>
            <span>$90.00</span>
          </div>
          <div className="flex justify-between py-1" style={{ color: watchedValues.secondary_color }}>
            <span>VAT (5%):</span>
            <span>$49.50</span>
          </div>
          <div className="flex justify-between py-2 border-t-2 font-bold text-lg" style={{ borderColor: watchedValues.secondary_color }}>
            <span>Total:</span>
            <span>$1,039.50</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pt-4 border-t" style={{ borderColor: watchedValues.secondary_color, color: watchedValues.secondary_color }}>
        <p>Thank you for your business!</p>
        <p className="text-sm">Terms: Payment due within 30 days</p>
      </div>
    </div>
  );

  return (
    <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-purple-50/30 hover:shadow-2xl transition-all duration-300">
      <CardHeader className="bg-gradient-to-r from-purple-50 via-violet-50 to-purple-50 border-b-2 border-purple-200/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-foreground">
                Invoice Template Designer
              </CardTitle>
              <CardDescription className="text-base text-muted-foreground">
                Customize your invoice template design and layout
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setPreviewMode(!previewMode)}
              className="bg-gradient-to-r from-purple-50 to-violet-50 hover:from-purple-100 hover:to-violet-100 border-purple-200 hover:border-purple-300 text-purple-700 hover:text-purple-800 shadow-md hover:shadow-lg transition-all duration-300"
            >
              <Eye className="h-4 w-4 mr-2" />
              {previewMode ? 'Edit' : 'Preview'}
            </Button>
            <Button
              variant="outline"
              onClick={resetToDefault}
              className="bg-gradient-to-r from-gray-50 to-slate-50 hover:from-gray-100 hover:to-slate-100 border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-800 shadow-md hover:shadow-lg transition-all duration-300"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 bg-gradient-to-br from-purple-50/20 via-white to-violet-50/10">
        {previewMode ? (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-4">Invoice Template Preview</h3>
              <div className="overflow-auto max-h-[600px] border rounded-lg p-4">
                <InvoicePreview />
              </div>
            </div>
            <div className="flex justify-center">
              <Button 
                onClick={handleSubmit(onSubmit)} 
                disabled={!isDirty || updateTemplate.isPending}
                className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Save className="h-4 w-4 mr-2" />
                {updateTemplate.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Saving...
                  </div>
                ) : (
                  'Save Template'
                )}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="general" className="w-full">
              <div className="bg-gradient-to-r from-purple-50 via-violet-50 to-purple-50 border-b-2 border-purple-200/50 rounded-t-lg p-1">
                <TabsList className="grid w-full grid-cols-3 bg-transparent h-auto p-1 gap-1">
                  <TabsTrigger 
                    value="general"
                    className="flex items-center gap-2 p-4 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-lg data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:border-2 data-[state=active]:border-purple-300 font-medium"
                  >
                    <FileText className="h-4 w-4" />
                    General
                  </TabsTrigger>
                  <TabsTrigger 
                    value="layout"
                    className="flex items-center gap-2 p-4 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-lg data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:border-2 data-[state=active]:border-purple-300 font-medium"
                  >
                    <Layout className="h-4 w-4" />
                    Layout
                  </TabsTrigger>
                  <TabsTrigger 
                    value="styling"
                    className="flex items-center gap-2 p-4 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-lg data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:border-2 data-[state=active]:border-purple-300 font-medium"
                  >
                    <Palette className="h-4 w-4" />
                    Styling
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="general" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Template Name</Label>
                    <Input
                      id="name"
                      {...register('name', { required: 'Template name is required' })}
                      placeholder="Enter template name"
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="layout">Page Layout</Label>
                    <Select value={watchedValues.layout} onValueChange={(value) => setValue('layout', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select layout" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="portrait">Portrait</SelectItem>
                        <SelectItem value="landscape">Landscape</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="page_size">Page Size</Label>
                    <Select value={watchedValues.page_size} onValueChange={(value) => setValue('page_size', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select page size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A4">A4 (210 × 297 mm)</SelectItem>
                        <SelectItem value="Letter">Letter (8.5 × 11 in)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="font_family">Font Family</Label>
                    <Select value={watchedValues.font_family} onValueChange={(value) => setValue('font_family', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select font" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Arial">Arial</SelectItem>
                        <SelectItem value="Helvetica">Helvetica</SelectItem>
                        <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                        <SelectItem value="Georgia">Georgia</SelectItem>
                        <SelectItem value="Verdana">Verdana</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="layout" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Layout className="h-4 w-4" />
                    <h3 className="text-lg font-medium">Page Margins</h3>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="margin_top">Top (px)</Label>
                      <Input
                        id="margin_top"
                        type="number"
                        {...register('margin_top', { 
                          required: 'Top margin is required',
                          min: { value: 0, message: 'Margin must be positive' }
                        })}
                        placeholder="20"
                      />
                      {errors.margin_top && (
                        <p className="text-sm text-destructive">{errors.margin_top.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="margin_right">Right (px)</Label>
                      <Input
                        id="margin_right"
                        type="number"
                        {...register('margin_right', { 
                          required: 'Right margin is required',
                          min: { value: 0, message: 'Margin must be positive' }
                        })}
                        placeholder="20"
                      />
                      {errors.margin_right && (
                        <p className="text-sm text-destructive">{errors.margin_right.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="margin_bottom">Bottom (px)</Label>
                      <Input
                        id="margin_bottom"
                        type="number"
                        {...register('margin_bottom', { 
                          required: 'Bottom margin is required',
                          min: { value: 0, message: 'Margin must be positive' }
                        })}
                        placeholder="20"
                      />
                      {errors.margin_bottom && (
                        <p className="text-sm text-destructive">{errors.margin_bottom.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="margin_left">Left (px)</Label>
                      <Input
                        id="margin_left"
                        type="number"
                        {...register('margin_left', { 
                          required: 'Left margin is required',
                          min: { value: 0, message: 'Margin must be positive' }
                        })}
                        placeholder="20"
                      />
                      {errors.margin_left && (
                        <p className="text-sm text-destructive">{errors.margin_left.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="styling" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    <h3 className="text-lg font-medium">Colors</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="primary_color">Primary Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="primary_color"
                          type="color"
                          {...register('primary_color')}
                          className="w-16 h-10 p-1 border rounded"
                        />
                        <Input
                          type="text"
                          {...register('primary_color')}
                          placeholder="#333333"
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="secondary_color">Secondary Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="secondary_color"
                          type="color"
                          {...register('secondary_color')}
                          className="w-16 h-10 p-1 border rounded"
                        />
                        <Input
                          type="text"
                          {...register('secondary_color')}
                          placeholder="#666666"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <Separator />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPreviewMode(true)}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button
                type="submit"
                disabled={!isDirty || updateTemplate.isPending}
                className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Save className="h-4 w-4 mr-2" />
                {updateTemplate.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Saving...
                  </div>
                ) : (
                  'Save Template'
                )}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
};