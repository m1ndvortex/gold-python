/**
 * Custom Field Schema Manager
 * 
 * Drag-and-drop field builder for creating custom fields
 * with schema management and validation rules.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  GripVertical,
  Type,
  Hash,
  Calendar,
  ToggleLeft,
  List,
  FileText,
  Image,
  Settings
} from 'lucide-react';

import {
  ComprehensiveBusinessConfig,
  CustomFieldSchema,
  CustomFieldSchemaCreate,
  FieldType,
  FieldValidationRule,
  BusinessType
} from '../../types/businessConfig';
import { businessConfigApi } from '../../services/businessConfigApi';

interface CustomFieldSchemaManagerProps {
  businessConfig: ComprehensiveBusinessConfig;
  onUpdate: () => void;
}

interface CustomFieldFormData {
  field_name: string;
  field_label: string;
  field_type: FieldType;
  entity_type: string;
  field_options: Array<{ label: string; value: string }>;
  validation_rules: FieldValidationRule[];
  default_value: any;
  is_required: boolean;
  is_searchable: boolean;
  is_filterable: boolean;
  is_active: boolean;
  display_order: number;
  display_group: string;
}

const fieldTypeOptions = [
  { value: FieldType.TEXT, label: 'Text', icon: Type, description: 'Single line text input' },
  { value: FieldType.NUMBER, label: 'Number', icon: Hash, description: 'Numeric input with validation' },
  { value: FieldType.DATE, label: 'Date', icon: Calendar, description: 'Date picker input' },
  { value: FieldType.DATETIME, label: 'Date & Time', icon: Calendar, description: 'Date and time picker' },
  { value: FieldType.BOOLEAN, label: 'Yes/No', icon: ToggleLeft, description: 'Checkbox or toggle' },
  { value: FieldType.ENUM, label: 'Dropdown', icon: List, description: 'Single selection dropdown' },
  { value: FieldType.MULTI_SELECT, label: 'Multi-Select', icon: List, description: 'Multiple selection list' },
  { value: FieldType.FILE, label: 'File', icon: FileText, description: 'File upload field' },
  { value: FieldType.IMAGE, label: 'Image', icon: Image, description: 'Image upload field' }
];

const entityTypes = [
  'inventory_item',
  'customer',
  'invoice',
  'payment',
  'category',
  'supplier',
  'user',
  'order',
  'service',
  'product'
];

const defaultFieldTemplates: Record<BusinessType, Array<{
  field_name: string;
  field_label: string;
  field_type: FieldType;
  entity_type: string;
  is_required: boolean;
  field_options?: Array<{ label: string; value: string }>;
}>> = {
  [BusinessType.GOLD_SHOP]: [
    {
      field_name: 'purity',
      field_label: 'Gold Purity (Karat)',
      field_type: FieldType.ENUM,
      entity_type: 'inventory_item',
      is_required: true,
      field_options: [
        { label: '24K', value: '24' },
        { label: '22K', value: '22' },
        { label: '21K', value: '21' },
        { label: '18K', value: '18' },
        { label: '14K', value: '14' }
      ]
    },
    {
      field_name: 'weight_grams',
      field_label: 'Weight (Grams)',
      field_type: FieldType.NUMBER,
      entity_type: 'inventory_item',
      is_required: true
    },
    {
      field_name: 'making_charges',
      field_label: 'Making Charges',
      field_type: FieldType.NUMBER,
      entity_type: 'invoice',
      is_required: false
    }
  ],
  [BusinessType.RESTAURANT]: [
    {
      field_name: 'allergens',
      field_label: 'Allergens',
      field_type: FieldType.MULTI_SELECT,
      entity_type: 'inventory_item',
      is_required: false,
      field_options: [
        { label: 'Nuts', value: 'nuts' },
        { label: 'Dairy', value: 'dairy' },
        { label: 'Gluten', value: 'gluten' },
        { label: 'Seafood', value: 'seafood' }
      ]
    },
    {
      field_name: 'table_number',
      field_label: 'Table Number',
      field_type: FieldType.NUMBER,
      entity_type: 'invoice',
      is_required: true
    },
    {
      field_name: 'dietary_preferences',
      field_label: 'Dietary Preferences',
      field_type: FieldType.MULTI_SELECT,
      entity_type: 'customer',
      is_required: false,
      field_options: [
        { label: 'Vegetarian', value: 'vegetarian' },
        { label: 'Vegan', value: 'vegan' },
        { label: 'Halal', value: 'halal' },
        { label: 'Kosher', value: 'kosher' }
      ]
    }
  ],
  [BusinessType.SERVICE_BUSINESS]: [
    {
      field_name: 'service_duration',
      field_label: 'Service Duration (minutes)',
      field_type: FieldType.NUMBER,
      entity_type: 'service',
      is_required: true
    },
    {
      field_name: 'skill_level_required',
      field_label: 'Skill Level Required',
      field_type: FieldType.ENUM,
      entity_type: 'service',
      is_required: false,
      field_options: [
        { label: 'Beginner', value: 'beginner' },
        { label: 'Intermediate', value: 'intermediate' },
        { label: 'Advanced', value: 'advanced' },
        { label: 'Expert', value: 'expert' }
      ]
    }
  ],
  [BusinessType.MANUFACTURING]: [
    {
      field_name: 'material_type',
      field_label: 'Material Type',
      field_type: FieldType.ENUM,
      entity_type: 'inventory_item',
      is_required: true,
      field_options: [
        { label: 'Raw Material', value: 'raw_material' },
        { label: 'Component', value: 'component' },
        { label: 'Finished Product', value: 'finished_product' }
      ]
    },
    {
      field_name: 'production_time',
      field_label: 'Production Time (hours)',
      field_type: FieldType.NUMBER,
      entity_type: 'product',
      is_required: false
    }
  ],
  [BusinessType.RETAIL_STORE]: [
    {
      field_name: 'brand',
      field_label: 'Brand',
      field_type: FieldType.TEXT,
      entity_type: 'inventory_item',
      is_required: false
    },
    {
      field_name: 'size',
      field_label: 'Size',
      field_type: FieldType.ENUM,
      entity_type: 'inventory_item',
      is_required: false,
      field_options: [
        { label: 'XS', value: 'xs' },
        { label: 'S', value: 's' },
        { label: 'M', value: 'm' },
        { label: 'L', value: 'l' },
        { label: 'XL', value: 'xl' }
      ]
    }
  ],
  [BusinessType.WHOLESALE]: [
    {
      field_name: 'minimum_order_quantity',
      field_label: 'Minimum Order Quantity',
      field_type: FieldType.NUMBER,
      entity_type: 'inventory_item',
      is_required: true
    },
    {
      field_name: 'bulk_discount_tier',
      field_label: 'Bulk Discount Tier',
      field_type: FieldType.ENUM,
      entity_type: 'customer',
      is_required: false,
      field_options: [
        { label: 'Standard', value: 'standard' },
        { label: 'Silver', value: 'silver' },
        { label: 'Gold', value: 'gold' },
        { label: 'Platinum', value: 'platinum' }
      ]
    }
  ],
  [BusinessType.PHARMACY]: [
    {
      field_name: 'prescription_required',
      field_label: 'Prescription Required',
      field_type: FieldType.BOOLEAN,
      entity_type: 'inventory_item',
      is_required: true
    },
    {
      field_name: 'expiry_date',
      field_label: 'Expiry Date',
      field_type: FieldType.DATE,
      entity_type: 'inventory_item',
      is_required: true
    }
  ],
  [BusinessType.AUTOMOTIVE]: [
    {
      field_name: 'vehicle_make',
      field_label: 'Vehicle Make',
      field_type: FieldType.TEXT,
      entity_type: 'customer',
      is_required: false
    },
    {
      field_name: 'vehicle_model',
      field_label: 'Vehicle Model',
      field_type: FieldType.TEXT,
      entity_type: 'customer',
      is_required: false
    },
    {
      field_name: 'part_compatibility',
      field_label: 'Part Compatibility',
      field_type: FieldType.MULTI_SELECT,
      entity_type: 'inventory_item',
      is_required: false
    }
  ],
  [BusinessType.GROCERY_STORE]: [],
  [BusinessType.CLOTHING_STORE]: [],
  [BusinessType.ELECTRONICS_STORE]: [],
  [BusinessType.CUSTOM]: []
};

export const CustomFieldSchemaManager: React.FC<CustomFieldSchemaManagerProps> = ({
  businessConfig,
  onUpdate
}) => {
  const [customFields, setCustomFields] = useState<CustomFieldSchema[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntityType, setSelectedEntityType] = useState<string>('all');
  const [selectedFieldType, setSelectedFieldType] = useState<string>('all');

  const [formData, setFormData] = useState<CustomFieldFormData>({
    field_name: '',
    field_label: '',
    field_type: FieldType.TEXT,
    entity_type: 'inventory_item',
    field_options: [],
    validation_rules: [],
    default_value: '',
    is_required: false,
    is_searchable: false,
    is_filterable: false,
    is_active: true,
    display_order: 0,
    display_group: ''
  });

  useEffect(() => {
    loadCustomFieldSchemas();
  }, [businessConfig.id]);

  const loadCustomFieldSchemas = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await businessConfigApi.getCustomFieldSchemas(businessConfig.id);
      setCustomFields(data);
    } catch (err) {
      console.error('Failed to load custom field schemas:', err);
      setError('Failed to load custom field schemas. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveField = async () => {
    if (!formData.field_name.trim() || !formData.field_label.trim()) {
      setError('Field name and label are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const fieldData: CustomFieldSchemaCreate = {
        business_config_id: businessConfig.id,
        field_name: formData.field_name.trim(),
        field_label: formData.field_label.trim(),
        field_type: formData.field_type,
        entity_type: formData.entity_type,
        field_options: formData.field_options.length > 0 ? formData.field_options : undefined,
        validation_rules: formData.validation_rules.length > 0 ? formData.validation_rules : undefined,
        default_value: formData.default_value || undefined,
        is_required: formData.is_required,
        is_searchable: formData.is_searchable,
        is_filterable: formData.is_filterable,
        is_active: formData.is_active,
        display_order: formData.display_order,
        display_group: formData.display_group || undefined
      };

      if (editingField) {
        await businessConfigApi.updateCustomFieldSchema(editingField, fieldData);
      } else {
        await businessConfigApi.createCustomFieldSchema(fieldData);
      }

      await loadCustomFieldSchemas();
      resetForm();
      onUpdate();
    } catch (err) {
      console.error('Failed to save custom field schema:', err);
      setError('Failed to save custom field schema. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditField = (field: CustomFieldSchema) => {
    setFormData({
      field_name: field.field_name,
      field_label: field.field_label,
      field_type: field.field_type,
      entity_type: field.entity_type,
      field_options: field.field_options?.map(opt => ({ 
        label: opt.label || opt.value, 
        value: opt.value 
      })) || [],
      validation_rules: field.validation_rules || [],
      default_value: field.default_value || '',
      is_required: field.is_required,
      is_searchable: field.is_searchable,
      is_filterable: field.is_filterable,
      is_active: field.is_active,
      display_order: field.display_order,
      display_group: field.display_group || ''
    });
    setEditingField(field.id);
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({
      field_name: '',
      field_label: '',
      field_type: FieldType.TEXT,
      entity_type: 'inventory_item',
      field_options: [],
      validation_rules: [],
      default_value: '',
      is_required: false,
      is_searchable: false,
      is_filterable: false,
      is_active: true,
      display_order: customFields.length,
      display_group: ''
    });
    setEditingField(null);
    setShowAddForm(false);
  };

  const handleApplyTemplates = async () => {
    const templates = defaultFieldTemplates[businessConfig.business_type] || [];
    
    try {
      setLoading(true);
      setError(null);

      for (const template of templates) {
        const fieldData: CustomFieldSchemaCreate = {
          business_config_id: businessConfig.id,
          ...template,
          is_active: true,
          is_searchable: true,
          is_filterable: true,
          display_order: customFields.length
        };
        await businessConfigApi.createCustomFieldSchema(fieldData);
      }

      await loadCustomFieldSchemas();
      onUpdate();
    } catch (err) {
      console.error('Failed to apply field templates:', err);
      setError('Failed to apply field templates. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addFieldOption = () => {
    setFormData(prev => ({
      ...prev,
      field_options: [...prev.field_options, { label: '', value: '' }]
    }));
  };

  const updateFieldOption = (index: number, field: 'label' | 'value', value: string) => {
    setFormData(prev => ({
      ...prev,
      field_options: prev.field_options.map((option, i) => 
        i === index ? { ...option, [field]: value } : option
      )
    }));
  };

  const removeFieldOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      field_options: prev.field_options.filter((_, i) => i !== index)
    }));
  };

  const filteredFields = customFields.filter(field => {
    const matchesSearch = 
      field.field_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      field.field_label.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEntityType = selectedEntityType === 'all' || field.entity_type === selectedEntityType;
    const matchesFieldType = selectedFieldType === 'all' || field.field_type === selectedFieldType;
    
    return matchesSearch && matchesEntityType && matchesFieldType;
  });

  const getFieldTypeIcon = (fieldType: FieldType) => {
    const option = fieldTypeOptions.find(opt => opt.value === fieldType);
    return option?.icon || Type;
  };

  const getFieldTypeLabel = (fieldType: FieldType) => {
    const option = fieldTypeOptions.find(opt => opt.value === fieldType);
    return option?.label || fieldType;
  };

  const getBusinessTypeLabel = (businessType: BusinessType) => {
    return businessType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const requiresOptions = [FieldType.ENUM, FieldType.MULTI_SELECT].includes(formData.field_type);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Settings className="h-6 w-6 text-blue-600" />
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Custom Field Schema</h2>
            <p className="text-sm text-slate-600">
              Create custom fields for {getBusinessTypeLabel(businessConfig.business_type)}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={handleApplyTemplates}
            disabled={loading}
          >
            Apply Templates
          </Button>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Field
          </Button>
        </div>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-slate-50 to-slate-100">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search fields..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-slate-600" />
              <select
                value={selectedEntityType}
                onChange={(e) => setSelectedEntityType(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-md text-sm"
              >
                <option value="all">All Entities</option>
                {entityTypes.map(type => (
                  <option key={type} value={type}>
                    {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={selectedFieldType}
                onChange={(e) => setSelectedFieldType(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-md text-sm"
              >
                <option value="all">All Types</option>
                {fieldTypeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Form */}
      {showAddForm && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg">
              {editingField ? 'Edit Custom Field' : 'Add New Custom Field'}
            </CardTitle>
            <CardDescription>
              Create a custom field that will be available in your business forms
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="field-name">Field Name *</Label>
                <Input
                  id="field-name"
                  value={formData.field_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, field_name: e.target.value }))}
                  placeholder="e.g., purity, brand, size"
                />
              </div>
              <div>
                <Label htmlFor="field-label">Field Label *</Label>
                <Input
                  id="field-label"
                  value={formData.field_label}
                  onChange={(e) => setFormData(prev => ({ ...prev, field_label: e.target.value }))}
                  placeholder="e.g., Gold Purity, Brand Name, Size"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="field-type">Field Type *</Label>
                <select
                  id="field-type"
                  value={formData.field_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, field_type: e.target.value as FieldType }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                >
                  {fieldTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label} - {option.description}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="entity-type">Entity Type *</Label>
                <select
                  id="entity-type"
                  value={formData.entity_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, entity_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                >
                  {entityTypes.map(type => (
                    <option key={type} value={type}>
                      {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Field Options for Enum/Multi-Select */}
            {requiresOptions && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label>Field Options</Label>
                  <Button variant="outline" size="sm" onClick={addFieldOption}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Option
                  </Button>
                </div>
                <div className="space-y-3">
                  {formData.field_options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <Input
                        placeholder="Label"
                        value={option.label}
                        onChange={(e) => updateFieldOption(index, 'label', e.target.value)}
                      />
                      <Input
                        placeholder="Value"
                        value={option.value}
                        onChange={(e) => updateFieldOption(index, 'value', e.target.value)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFieldOption(index)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                  {formData.field_options.length === 0 && (
                    <div className="text-center py-4 text-slate-500">
                      No options defined. Click "Add Option" to get started.
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="display-group">Display Group</Label>
                <Input
                  id="display-group"
                  value={formData.display_group}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_group: e.target.value }))}
                  placeholder="e.g., Basic Info, Specifications"
                />
              </div>
              <div>
                <Label htmlFor="display-order">Display Order</Label>
                <Input
                  id="display-order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is-required"
                  checked={formData.is_required}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_required: !!checked }))}
                />
                <Label htmlFor="is-required">Required</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is-searchable"
                  checked={formData.is_searchable}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_searchable: !!checked }))}
                />
                <Label htmlFor="is-searchable">Searchable</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is-filterable"
                  checked={formData.is_filterable}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_filterable: !!checked }))}
                />
                <Label htmlFor="is-filterable">Filterable</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is-active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: !!checked }))}
                />
                <Label htmlFor="is-active">Active</Label>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={resetForm}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSaveField} disabled={loading}>
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {editingField ? 'Update' : 'Save'} Field
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fields List */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Custom Fields</span>
            <Badge variant="secondary">{filteredFields.length} fields</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && !showAddForm ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : filteredFields.length === 0 ? (
            <div className="text-center py-8">
              <Settings className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No Custom Fields</h3>
              <p className="text-slate-600 mb-4">
                {searchTerm || selectedEntityType !== 'all' || selectedFieldType !== 'all'
                  ? 'No fields match your current filters.'
                  : 'Start by adding custom fields for your business entities.'
                }
              </p>
              {!searchTerm && selectedEntityType === 'all' && selectedFieldType === 'all' && (
                <Button onClick={handleApplyTemplates} disabled={loading}>
                  Apply Default Templates
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFields
                .sort((a, b) => a.display_order - b.display_order)
                .map((field) => {
                  const FieldIcon = getFieldTypeIcon(field.field_type);
                  return (
                    <div
                      key={field.id}
                      className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <GripVertical className="h-4 w-4 text-slate-400" />
                          <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                            <FieldIcon className="h-4 w-4 text-blue-600" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h3 className="font-medium text-slate-900">{field.field_label}</h3>
                            <Badge variant="outline" className="text-xs">
                              {getFieldTypeLabel(field.field_type)}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {field.entity_type.replace(/_/g, ' ')}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-sm text-slate-600">
                              Field: <code className="text-xs bg-slate-100 px-1 rounded">{field.field_name}</code>
                            </span>
                            {field.display_group && (
                              <span className="text-xs text-slate-500">
                                Group: {field.display_group}
                              </span>
                            )}
                            <div className="flex items-center space-x-2">
                              {field.is_required && (
                                <Badge className="bg-red-100 text-red-800 text-xs">Required</Badge>
                              )}
                              {field.is_searchable && (
                                <Badge className="bg-green-100 text-green-800 text-xs">Searchable</Badge>
                              )}
                              {field.is_filterable && (
                                <Badge className="bg-blue-100 text-blue-800 text-xs">Filterable</Badge>
                              )}
                              {!field.is_active && (
                                <Badge variant="secondary" className="text-xs">Inactive</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditField(field)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomFieldSchemaManager;