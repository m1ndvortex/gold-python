import React, { useState } from 'react';
import { Plus, Edit, Trash2, Eye, MessageSquare } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Separator } from '../ui/separator';
import { Alert, AlertDescription } from '../ui/alert';
import { useToast } from '../ui/use-toast';
import {
  useSMSTemplates,
  useCreateSMSTemplate,
  useUpdateSMSTemplate,
  useDeleteSMSTemplate,
  usePreviewSMSTemplate
} from '../../hooks/useSMS';
import { useCustomers } from '../../hooks/useCustomers';
import type { SMSTemplate, SMSTemplateCreate, SMSTemplateUpdate, Customer } from '../../types';

interface SMSTemplateFormProps {
  template?: SMSTemplate;
  onClose: () => void;
}

const SMSTemplateForm: React.FC<SMSTemplateFormProps> = ({ template, onClose }) => {
  const [formData, setFormData] = useState<SMSTemplateCreate>({
    name: template?.name || '',
    template_type: template?.template_type || 'promotional',
    message_template: template?.message_template || '',
    is_active: template?.is_active ?? true,
  });

  const createMutation = useCreateSMSTemplate();
  const updateMutation = useUpdateSMSTemplate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (template) {
        await updateMutation.mutateAsync({ id: template.id, template: formData });
      } else {
        await createMutation.mutateAsync(formData);
      }
      onClose();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const templateVariables = [
    { key: '{customer_name}', description: 'Customer name' },
    { key: '{debt_amount}', description: 'Customer debt amount' },
    { key: '{company_name}', description: 'Company name' },
    { key: '{phone}', description: 'Customer phone number' },
    { key: '{last_purchase_date}', description: 'Last purchase date' },
  ];

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('message_template') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = formData.message_template;
      const newText = text.substring(0, start) + variable + text.substring(end);
      
      setFormData(prev => ({ ...prev, message_template: newText }));
      
      // Set cursor position after inserted variable
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Template Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter template name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="template_type">Template Type</Label>
          <Select
            value={formData.template_type}
            onValueChange={(value: 'promotional' | 'debt_reminder' | 'general') =>
              setFormData(prev => ({ ...prev, template_type: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="promotional">Promotional</SelectItem>
              <SelectItem value="debt_reminder">Debt Reminder</SelectItem>
              <SelectItem value="general">General</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message_template">Message Template</Label>
        <Textarea
          id="message_template"
          value={formData.message_template}
          onChange={(e) => setFormData(prev => ({ ...prev, message_template: e.target.value }))}
          placeholder="Enter your SMS message template..."
          rows={4}
          required
        />
        <div className="text-sm text-muted-foreground">
          Character count: {formData.message_template.length}/160
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium">Available Variables</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {templateVariables.map((variable) => (
            <Button
              key={variable.key}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => insertVariable(variable.key)}
              className="text-xs"
            >
              {variable.key}
            </Button>
          ))}
        </div>
        <div className="mt-2 space-y-1">
          {templateVariables.map((variable) => (
            <div key={variable.key} className="text-xs text-muted-foreground">
              <code className="bg-muted px-1 rounded">{variable.key}</code> - {variable.description}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
        />
        <Label htmlFor="is_active">Active Template</Label>
      </div>

      <Separator />

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : template ? 'Update Template' : 'Create Template'}
        </Button>
      </div>
    </form>
  );
};

interface SMSTemplatePreviewProps {
  template: SMSTemplate;
  onClose: () => void;
}

const SMSTemplatePreview: React.FC<SMSTemplatePreviewProps> = ({ template, onClose }) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const { data: customers } = useCustomers();
  const previewMutation = usePreviewSMSTemplate();

  const handlePreview = async () => {
    if (!selectedCustomerId) return;
    
    try {
      await previewMutation.mutateAsync({
        templateId: template.id,
        customerId: selectedCustomerId
      });
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">{template.name}</h3>
        <Badge variant={template.template_type === 'promotional' ? 'default' : 'secondary'}>
          {template.template_type.replace('_', ' ').toUpperCase()}
        </Badge>
      </div>

      <div className="space-y-2">
        <Label>Original Template</Label>
        <div className="p-3 bg-muted rounded-md">
          <pre className="whitespace-pre-wrap text-sm">{template.message_template}</pre>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="customer_select">Select Customer for Preview</Label>
        <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a customer..." />
          </SelectTrigger>
          <SelectContent>
            {customers?.map((customer) => (
              <SelectItem key={customer.id} value={customer.id}>
                {customer.name} - {customer.phone}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button 
        onClick={handlePreview} 
        disabled={!selectedCustomerId || previewMutation.isPending}
        className="w-full"
      >
        {previewMutation.isPending ? 'Generating Preview...' : 'Generate Preview'}
      </Button>

      {previewMutation.data && (
        <div className="space-y-2">
          <Label>Preview Message</Label>
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <pre className="whitespace-pre-wrap text-sm">{previewMutation.data.preview_message}</pre>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
};

export const SMSTemplateManager: React.FC = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SMSTemplate | null>(null);
  const [previewingTemplate, setPreviewingTemplate] = useState<SMSTemplate | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [showActiveOnly, setShowActiveOnly] = useState(true);

  const { data: templates, isLoading } = useSMSTemplates({
    template_type: filterType === 'all' ? undefined : filterType,
    active_only: showActiveOnly
  });
  const deleteMutation = useDeleteSMSTemplate();
  const { toast } = useToast();

  const handleDelete = async (template: SMSTemplate) => {
    if (window.confirm(`Are you sure you want to delete "${template.name}"?`)) {
      try {
        await deleteMutation.mutateAsync(template.id);
      } catch (error) {
        // Error handled by mutation
      }
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'promotional':
        return 'bg-blue-100 text-blue-800';
      case 'debt_reminder':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">SMS Templates</h2>
          <p className="text-muted-foreground">Manage your SMS message templates</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create SMS Template</DialogTitle>
            </DialogHeader>
            <SMSTemplateForm onClose={() => setIsCreateDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Label htmlFor="type-filter">Filter by Type:</Label>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="promotional">Promotional</SelectItem>
              <SelectItem value="debt_reminder">Debt Reminder</SelectItem>
              <SelectItem value="general">General</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="active-only"
            checked={showActiveOnly}
            onCheckedChange={setShowActiveOnly}
          />
          <Label htmlFor="active-only">Active Only</Label>
        </div>
      </div>

      {/* Templates Grid */}
      {templates && templates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card key={template.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription className="mt-1">
                      <Badge className={getTypeColor(template.template_type)}>
                        {template.template_type.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-1">
                    {template.is_active ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Message Preview</Label>
                  <div className="mt-1 p-2 bg-muted rounded text-sm">
                    <pre className="whitespace-pre-wrap line-clamp-3">
                      {template.message_template}
                    </pre>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>Length: {template.message_template.length} chars</span>
                  <span>Created: {new Date(template.created_at).toLocaleDateString()}</span>
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewingTemplate(template)}
                    className="flex-1"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Preview
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingTemplate(template)}
                    className="flex-1"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(template)}
                    disabled={deleteMutation.isPending}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No SMS Templates Found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {showActiveOnly 
                ? "No active templates found. Try adjusting your filters or create a new template."
                : "No templates found. Create your first SMS template to get started."
              }
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Template
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit SMS Template</DialogTitle>
          </DialogHeader>
          {editingTemplate && (
            <SMSTemplateForm
              template={editingTemplate}
              onClose={() => setEditingTemplate(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewingTemplate} onOpenChange={() => setPreviewingTemplate(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Preview SMS Template</DialogTitle>
          </DialogHeader>
          {previewingTemplate && (
            <SMSTemplatePreview
              template={previewingTemplate}
              onClose={() => setPreviewingTemplate(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};