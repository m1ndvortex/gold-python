import React, { useState } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  FileText, 
  Eye,
  Settings,
  Save,
  X
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '../ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { Switch } from '../ui/switch';
import { useForm } from 'react-hook-form';

interface CategoryTemplate {
  id: string;
  name: string;
  description?: string;
  template_data: {
    icon?: string;
    color?: string;
    attributes?: any[];
    metadata?: Record<string, any>;
  };
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  creator?: {
    username: string;
  };
}

interface CategoryTemplateFormData {
  name: string;
  description?: string;
  template_data: {
    icon?: string;
    color?: string;
    attributes?: any[];
    metadata?: Record<string, any>;
  };
  is_active: boolean;
}

interface CategoryTemplateManagerProps {
  templates: CategoryTemplate[];
  onCreateTemplate: (data: CategoryTemplateFormData) => Promise<void>;
  onUpdateTemplate: (id: string, data: Partial<CategoryTemplateFormData>) => Promise<void>;
  onDeleteTemplate: (id: string) => Promise<void>;
  onDuplicateTemplate: (template: CategoryTemplate) => Promise<void>;
  isLoading?: boolean;
}

export const CategoryTemplateManager: React.FC<CategoryTemplateManagerProps> = ({
  templates,
  onCreateTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
  onDuplicateTemplate,
  isLoading = false
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CategoryTemplate | null>(null);
  const [deleteTemplate, setDeleteTemplate] = useState<CategoryTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<CategoryTemplate | null>(null);

  const { 
    register, 
    handleSubmit, 
    reset, 
    watch,
    setValue,
    formState: { errors } 
  } = useForm<CategoryTemplateFormData>({
    defaultValues: {
      name: '',
      description: '',
      template_data: {
        icon: '',
        color: '#f59e0b',
        attributes: [],
        metadata: {}
      },
      is_active: true
    }
  });

  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    reset({
      name: '',
      description: '',
      template_data: {
        icon: '',
        color: '#f59e0b',
        attributes: [],
        metadata: {}
      },
      is_active: true
    });
    setShowForm(true);
  };

  const handleEditTemplate = (template: CategoryTemplate) => {
    setEditingTemplate(template);
    reset({
      name: template.name,
      description: template.description || '',
      template_data: template.template_data,
      is_active: template.is_active
    });
    setShowForm(true);
  };

  const handleDuplicateTemplate = async (template: CategoryTemplate) => {
    try {
      await onDuplicateTemplate(template);
    } catch (error) {
      console.error('Failed to duplicate template:', error);
    }
  };

  const handleDeleteTemplate = async () => {
    if (deleteTemplate) {
      try {
        await onDeleteTemplate(deleteTemplate.id);
        setDeleteTemplate(null);
      } catch (error) {
        console.error('Failed to delete template:', error);
      }
    }
  };

  const onFormSubmit = async (data: CategoryTemplateFormData) => {
    try {
      if (editingTemplate) {
        await onUpdateTemplate(editingTemplate.id, data);
      } else {
        await onCreateTemplate(data);
      }
      setShowForm(false);
      setEditingTemplate(null);
    } catch (error) {
      console.error('Failed to save template:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Category Templates
              <Badge variant="secondary">{templates.length} templates</Badge>
            </CardTitle>
            <Button onClick={handleCreateTemplate}>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No templates found</p>
              <p className="text-sm mb-4">Create templates to quickly set up categories with predefined attributes</p>
              <Button onClick={handleCreateTemplate}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Template
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <Card key={template.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {template.template_data.icon && (
                          <span className="text-lg">{template.template_data.icon}</span>
                        )}
                        <div>
                          <h3 className="font-medium truncate">{template.name}</h3>
                          {template.creator && (
                            <p className="text-xs text-muted-foreground">
                              by {template.creator.username}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {!template.is_active && (
                          <Badge variant="secondary" className="text-xs">
                            Inactive
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {template.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {template.description}
                      </p>
                    )}
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Attributes:</span>
                        <Badge variant="outline" className="text-xs">
                          {template.template_data.attributes?.length || 0}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Created:</span>
                        <span>{formatDate(template.created_at)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPreviewTemplate(template)}
                        title="Preview template"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditTemplate(template)}
                        title="Edit template"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDuplicateTemplate(template)}
                        title="Duplicate template"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteTemplate(template)}
                        className="text-red-600 hover:text-red-700"
                        title="Delete template"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Template Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Edit Template' : 'Create New Template'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template Name *</Label>
              <Input
                id="template-name"
                {...register('name', { required: 'Template name is required' })}
                placeholder="e.g., Jewelry Category, Electronics Category"
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-description">Description</Label>
              <Textarea
                id="template-description"
                {...register('description')}
                placeholder="Describe what this template is for..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="template-icon">Default Icon</Label>
                <Input
                  id="template-icon"
                  {...register('template_data.icon')}
                  placeholder="💍"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="template-color">Default Color</Label>
                <Input
                  id="template-color"
                  {...register('template_data.color')}
                  placeholder="#f59e0b"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="template-active"
                checked={watch('is_active')}
                onCheckedChange={(checked) => setValue('is_active', checked)}
              />
              <Label htmlFor="template-active">Active</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  'Saving...'
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {editingTemplate ? 'Update Template' : 'Create Template'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Template Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Template Preview: {previewTemplate?.name}</DialogTitle>
          </DialogHeader>

          {previewTemplate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Icon</Label>
                  <p className="text-2xl">{previewTemplate.template_data.icon || 'None'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Color</Label>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-6 h-6 rounded border"
                      style={{ backgroundColor: previewTemplate.template_data.color }}
                    />
                    <span className="text-sm">{previewTemplate.template_data.color}</span>
                  </div>
                </div>
              </div>

              {previewTemplate.description && (
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm text-muted-foreground">{previewTemplate.description}</p>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium">Attributes ({previewTemplate.template_data.attributes?.length || 0})</Label>
                {previewTemplate.template_data.attributes && previewTemplate.template_data.attributes.length > 0 ? (
                  <div className="space-y-2 mt-2">
                    {previewTemplate.template_data.attributes.map((attr: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <span className="font-medium">{attr.name}</span>
                          <Badge variant="outline" className="ml-2 text-xs">
                            {attr.type}
                          </Badge>
                          {attr.required && (
                            <Badge variant="secondary" className="ml-1 text-xs">
                              Required
                            </Badge>
                          )}
                        </div>
                        {attr.options && attr.options.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            {attr.options.length} options
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mt-2">No attributes defined</p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setPreviewTemplate(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTemplate} onOpenChange={() => setDeleteTemplate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the template "{deleteTemplate?.name}"? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTemplate}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Template
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};