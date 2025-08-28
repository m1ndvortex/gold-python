import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { 
  Plus, 
  Trash2, 
  Palette, 
  Smile, 
  Save, 
  X,
  Settings,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '../ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Separator } from '../ui/separator';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../ui/collapsible';
import type { Category } from '../../types';

interface CategoryAttribute {
  id: string;
  name: string;
  type: 'text' | 'number' | 'select' | 'boolean' | 'date';
  required: boolean;
  options?: string[];
  validation?: Record<string, any>;
}

interface CategoryFormData {
  name: string;
  parent_id?: string;
  description?: string;
  icon?: string;
  color?: string;
  attributes: CategoryAttribute[];
  category_metadata: Record<string, any>;
  sort_order: number;
  is_active: boolean;
}

interface CategoryFormProps {
  category?: Category;
  parentCategories: Category[];
  templates: any[];
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CategoryFormData) => Promise<void>;
  isLoading?: boolean;
}

const ATTRIBUTE_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'select', label: 'Select (Dropdown)' },
  { value: 'boolean', label: 'Yes/No' },
  { value: 'date', label: 'Date' }
];

const PREDEFINED_COLORS = [
  '#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6',
  '#f97316', '#06b6d4', '#84cc16', '#ec4899', '#6b7280'
];

const PREDEFINED_ICONS = [
  '💍', '📿', '⌚', '👑', '💎', '🔗', '🏆', '⭐', '💰', '🎯',
  '📦', '🏷️', '🔖', '📋', '📊', '🎨', '🔧', '⚙️', '🎪', '🎭'
];

export const CategoryForm: React.FC<CategoryFormProps> = ({
  category,
  parentCategories,
  templates,
  isOpen,
  onClose,
  onSubmit,
  isLoading = false
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);

  const { 
    register, 
    control, 
    handleSubmit, 
    watch, 
    setValue, 
    reset,
    formState: { errors } 
  } = useForm<CategoryFormData>({
    defaultValues: {
      name: '',
      parent_id: '',
      description: '',
      icon: '',
      color: '#f59e0b',
      attributes: [],
      category_metadata: {},
      sort_order: 0,
      is_active: true
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'attributes'
  });

  const watchedColor = watch('color');
  const watchedIcon = watch('icon');

  useEffect(() => {
    if (category) {
      reset({
        name: category.name,
        parent_id: category.parent_id || '',
        description: category.description || '',
        icon: category.icon || '',
        color: category.color || '#f59e0b',
        attributes: category.attributes || [],
        category_metadata: category.category_metadata || {},
        sort_order: category.sort_order || 0,
        is_active: category.is_active ?? true
      });
    } else {
      reset({
        name: '',
        parent_id: '',
        description: '',
        icon: '',
        color: '#f59e0b',
        attributes: [],
        category_metadata: {},
        sort_order: 0,
        is_active: true
      });
    }
  }, [category, reset]);

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template && template.template_data) {
      const data = template.template_data;
      
      if (data.attributes) {
        setValue('attributes', data.attributes);
      }
      if (data.icon) {
        setValue('icon', data.icon);
      }
      if (data.color) {
        setValue('color', data.color);
      }
      if (data.category_metadata) {
        setValue('category_metadata', data.category_metadata);
      }
    }
    setSelectedTemplate(templateId);
  };

  const addAttribute = () => {
    append({
      id: `attr_${Date.now()}`,
      name: '',
      type: 'text',
      required: false,
      options: [],
      validation: {}
    });
  };

  const addAttributeOption = (attributeIndex: number) => {
    const currentAttribute = fields[attributeIndex];
    const updatedOptions = [...(currentAttribute.options || []), ''];
    setValue(`attributes.${attributeIndex}.options`, updatedOptions);
  };

  const removeAttributeOption = (attributeIndex: number, optionIndex: number) => {
    const currentAttribute = fields[attributeIndex];
    const updatedOptions = currentAttribute.options?.filter((_, i) => i !== optionIndex) || [];
    setValue(`attributes.${attributeIndex}.options`, updatedOptions);
  };

  const onFormSubmit = async (data: CategoryFormData) => {
    try {
      await onSubmit(data);
      onClose();
    } catch (error) {
      console.error('Failed to save category:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {category ? 'Edit Category' : 'Create New Category'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          {/* Template Selection */}
          {!category && templates.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quick Start with Template</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a template (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Category Name *</Label>
              <Input
                id="name"
                {...register('name', { required: 'Category name is required' })}
                placeholder="e.g., Rings, Necklaces, Bracelets"
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="parent_id">Parent Category</Label>
              <Select
                value={watch('parent_id') || 'none'}
                onValueChange={(value) => 
                  setValue('parent_id', value === 'none' ? '' : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parent category (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No parent (root category)</SelectItem>
                  {parentCategories
                    .filter(cat => cat.id !== category?.id)
                    .map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Optional description of the category..."
              rows={3}
            />
          </div>

          {/* Visual Customization */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category Icon</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-12 h-12 p-0"
                  onClick={() => setShowIconPicker(!showIconPicker)}
                >
                  {watchedIcon || <Smile className="h-4 w-4" />}
                </Button>
                <Input
                  {...register('icon')}
                  placeholder="Enter emoji or leave empty"
                  className="flex-1"
                />
              </div>
              {showIconPicker && (
                <div className="grid grid-cols-10 gap-1 p-2 border rounded-md bg-muted/50">
                  {PREDEFINED_ICONS.map((icon) => (
                    <Button
                      key={icon}
                      type="button"
                      variant="ghost"
                      className="w-8 h-8 p-0"
                      onClick={() => {
                        setValue('icon', icon);
                        setShowIconPicker(false);
                      }}
                    >
                      {icon}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Category Color</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-12 h-12 p-0"
                  style={{ backgroundColor: watchedColor }}
                  onClick={() => setShowColorPicker(!showColorPicker)}
                >
                  <Palette className="h-4 w-4" />
                </Button>
                <Input
                  {...register('color')}
                  placeholder="#f59e0b"
                  className="flex-1"
                />
              </div>
              {showColorPicker && (
                <div className="grid grid-cols-5 gap-1 p-2 border rounded-md bg-muted/50">
                  {PREDEFINED_COLORS.map((color) => (
                    <Button
                      key={color}
                      type="button"
                      variant="ghost"
                      className="w-8 h-8 p-0 rounded-full"
                      style={{ backgroundColor: color }}
                      onClick={() => {
                        setValue('color', color);
                        setShowColorPicker(false);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Advanced Settings */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <Button type="button" variant="ghost" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Advanced Settings
                </span>
                {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4">
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sort_order">Sort Order</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    {...register('sort_order', { valueAsNumber: true })}
                    placeholder="0"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={watch('is_active')}
                    onCheckedChange={(checked) => setValue('is_active', checked)}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Custom Attributes */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Custom Attributes</CardTitle>
                <Button type="button" onClick={addAttribute} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Attribute
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No custom attributes defined. Add attributes to collect additional product information.
                </p>
              ) : (
                fields.map((field, index) => (
                  <Card key={field.id} className="p-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Attribute {index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Attribute Name</Label>
                          <Input
                            {...register(`attributes.${index}.name`, {
                              required: 'Attribute name is required'
                            })}
                            placeholder="e.g., Purity, Size, Style"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Type</Label>
                          <Select
                            value={watch(`attributes.${index}.type`)}
                            onValueChange={(value) => 
                              setValue(`attributes.${index}.type`, value as any)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ATTRIBUTE_TYPES.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center space-x-2 pt-6">
                          <Switch
                            checked={watch(`attributes.${index}.required`)}
                            onCheckedChange={(checked) => 
                              setValue(`attributes.${index}.required`, checked)
                            }
                          />
                          <Label>Required</Label>
                        </div>
                      </div>

                      {/* Options for select type */}
                      {watch(`attributes.${index}.type`) === 'select' && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Options</Label>
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => addAttributeOption(index)}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add Option
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {field.options?.map((option, optionIndex) => (
                              <div key={optionIndex} className="flex items-center gap-2">
                                <Input
                                  value={option}
                                  onChange={(e) => {
                                    const updatedOptions = [...(field.options || [])];
                                    updatedOptions[optionIndex] = e.target.value;
                                    setValue(`attributes.${index}.options`, updatedOptions);
                                  }}
                                  placeholder={`Option ${optionIndex + 1}`}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeAttributeOption(index, optionIndex)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                'Saving...'
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {category ? 'Update Category' : 'Create Category'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};