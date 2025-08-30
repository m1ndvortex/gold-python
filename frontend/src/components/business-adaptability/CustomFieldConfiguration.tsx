/**
 * Custom Field Configuration Component
 * Interface for defining, modifying, and managing custom fields per entity type
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Sliders, 
  Plus, 
  Edit, 
  Save, 
  X, 
  Trash2,
  Search,
  Settings,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Filter,
  SortAsc,
  List,
  Grid
} from 'lucide-react';
import { useBusinessAdaptability } from '../../hooks/useBusinessAdaptability';
import { CustomFieldDefinition, FieldType, CustomFieldFormData } from '../../types/businessAdaptability';

const entityTypes = [
  { value: 'item', label: 'Inventory Items' },
  { value: 'category', label: 'Categories' },
  { value: 'invoice', label: 'Invoices' },
  { value: 'customer', label: 'Customers' },
  { value: 'supplier', label: 'Suppliers' },
  { value: 'transaction', label: 'Transactions' }
];

const fieldTypes = [
  { value: FieldType.TEXT, label: 'Text', description: 'Single line text input' },
  { value: FieldType.NUMBER, label: 'Number', description: 'Numeric input with validation' },
  { value: FieldType.DATE, label: 'Date', description: 'Date picker' },
  { value: FieldType.DATETIME, label: 'Date & Time', description: 'Date and time picker' },
  { value: FieldType.BOOLEAN, label: 'Yes/No', description: 'Checkbox or toggle' },
  { value: FieldType.ENUM, label: 'Dropdown', description: 'Select from predefined options' },
  { value: FieldType.EMAIL, label: 'Email', description: 'Email address with validation' },
  { value: FieldType.PHONE, label: 'Phone', description: 'Phone number with formatting' },
  { value: FieldType.URL, label: 'URL', description: 'Website URL with validation' },
  { value: FieldType.CURRENCY, label: 'Currency', description: 'Monetary value' },
  { value: FieldType.PERCENTAGE, label: 'Percentage', description: 'Percentage value' }
];

export const CustomFieldConfiguration: React.FC = () => {
  const {
    currentConfiguration,
    customFields,
    createCustomField,
    isLoading,
    error
  } = useBusinessAdaptability();

  const [selectedEntityType, setSelectedEntityType] = useState<string>('item');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingField, setEditingField] = useState<CustomFieldDefinition | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [formData, setFormData] = useState<CustomFieldFormData>({
    field_name: '',
    field_key: '',
    entity_type: 'item',
    field_type: FieldType.TEXT,
    field_config: {},
    validation_rules: {},
    display_name: '',
    display_name_persian: '',
    description: '',
    placeholder: '',
    help_text: '',
    is_required: false,
    is_searchable: true,
    is_filterable: true,
    is_sortable: false,
    show_in_list: false,
    show_in_detail: true,
    display_order: 0,
    field_group: '',
    column_span: 1,
    business_rules: {},
    conditional_logic: {}
  });

  // Filter custom fields by entity type and search term
  const filteredFields = React.useMemo(() => {
    return customFields.filter(field => {
      const matchesEntity = field.entity_type === selectedEntityType;
      const matchesSearch = field.field_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           field.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           field.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesEntity && matchesSearch;
    });
  }, [customFields, selectedEntityType, searchTerm]);

  // Group fields by field group
  const groupedFields = React.useMemo(() => {
    const groups: Record<string, CustomFieldDefinition[]> = {};
    
    filteredFields.forEach(field => {
      const group = field.field_group || 'General';
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(field);
    });

    // Sort fields within each group by display_order
    Object.keys(groups).forEach(group => {
      groups[group].sort((a, b) => a.display_order - b.display_order);
    });

    return groups;
  }, [filteredFields]);

  const resetForm = () => {
    setFormData({
      field_name: '',
      field_key: '',
      entity_type: selectedEntityType,
      field_type: FieldType.TEXT,
      field_config: {},
      validation_rules: {},
      display_name: '',
      display_name_persian: '',
      description: '',
      placeholder: '',
      help_text: '',
      is_required: false,
      is_searchable: true,
      is_filterable: true,
      is_sortable: false,
      show_in_list: false,
      show_in_detail: true,
      display_order: 0,
      field_group: '',
      column_span: 1,
      business_rules: {},
      conditional_logic: {}
    });
    setEditingField(null);
    setShowAddForm(false);
  };

  const handleSubmit = async () => {
    if (!currentConfiguration) return;

    try {
      // Generate field_key from field_name if not provided
      if (!formData.field_key) {
        formData.field_key = formData.field_name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      }

      await createCustomField(currentConfiguration.id, formData);
      resetForm();
    } catch (error) {
      console.error('Failed to create custom field:', error);
    }
  };

  const handleEditField = (field: CustomFieldDefinition) => {
    setFormData({
      field_name: field.field_name,
      field_key: field.field_key,
      entity_type: field.entity_type,
      field_type: field.field_type,
      field_config: field.field_config,
      validation_rules: field.validation_rules,
      display_name: field.display_name,
      display_name_persian: field.display_name_persian || '',
      description: field.description || '',
      placeholder: field.placeholder || '',
      help_text: field.help_text || '',
      is_required: field.is_required,
      is_searchable: field.is_searchable,
      is_filterable: field.is_filterable,
      is_sortable: field.is_sortable,
      show_in_list: field.show_in_list,
      show_in_detail: field.show_in_detail,
      display_order: field.display_order,
      field_group: field.field_group || '',
      column_span: field.column_span,
      business_rules: field.business_rules,
      conditional_logic: field.conditional_logic
    });
    setEditingField(field);
    setShowAddForm(true);
  };

  const renderFieldTypeConfig = () => {
    switch (formData.field_type) {
      case FieldType.ENUM:
        return (
          <div className="space-y-2">
            <Label>Options (one per line)</Label>
            <Textarea
              value={formData.field_config.options?.join('\n') || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                field_config: {
                  ...prev.field_config,
                  options: e.target.value.split('\n').filter(opt => opt.trim())
                }
              }))}
              placeholder="Option 1&#10;Option 2&#10;Option 3"
              rows={4}
            />
          </div>
        );
      case FieldType.NUMBER:
      case FieldType.CURRENCY:
      case FieldType.PERCENTAGE:
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Minimum Value</Label>
              <Input
                type="number"
                value={formData.validation_rules.min || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  validation_rules: {
                    ...prev.validation_rules,
                    min: e.target.value ? parseFloat(e.target.value) : undefined
                  }
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Maximum Value</Label>
              <Input
                type="number"
                value={formData.validation_rules.max || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  validation_rules: {
                    ...prev.validation_rules,
                    max: e.target.value ? parseFloat(e.target.value) : undefined
                  }
                }))}
              />
            </div>
          </div>
        );
      case FieldType.TEXT:
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Minimum Length</Label>
              <Input
                type="number"
                value={formData.validation_rules.minLength || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  validation_rules: {
                    ...prev.validation_rules,
                    minLength: e.target.value ? parseInt(e.target.value) : undefined
                  }
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Maximum Length</Label>
              <Input
                type="number"
                value={formData.validation_rules.maxLength || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  validation_rules: {
                    ...prev.validation_rules,
                    maxLength: e.target.value ? parseInt(e.target.value) : undefined
                  }
                }))}
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading custom fields...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          Error loading custom fields: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  if (!currentConfiguration) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-12 text-center">
          <Sliders className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Business Configuration</h3>
          <p className="text-gray-600">
            You need to set up a business configuration first to manage custom fields.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Custom Field Configuration</h2>
          <p className="text-gray-600">Define and manage custom fields for different entity types</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
          </Button>
          <Button
            onClick={() => setShowAddForm(true)}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Field
          </Button>
        </div>
      </div>

      {/* Entity Type Selector and Search */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label className="text-sm font-medium text-gray-600 mb-2 block">Entity Type</Label>
              <Select value={selectedEntityType} onValueChange={setSelectedEntityType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {entityTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1 relative">
              <Label className="text-sm font-medium text-gray-600 mb-2 block">Search Fields</Label>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search custom fields..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Field Form */}
      {showAddForm && (
        <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-900">
              {editingField ? <Edit className="h-5 w-5 mr-2" /> : <Plus className="h-5 w-5 mr-2" />}
              {editingField ? 'Edit Custom Field' : 'Add Custom Field'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs defaultValue="basic" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="display">Display Options</TabsTrigger>
                <TabsTrigger value="validation">Validation</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="field_name">Field Name *</Label>
                    <Input
                      id="field_name"
                      value={formData.field_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, field_name: e.target.value }))}
                      placeholder="e.g., Brand Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="field_key">Field Key</Label>
                    <Input
                      id="field_key"
                      value={formData.field_key}
                      onChange={(e) => setFormData(prev => ({ ...prev, field_key: e.target.value }))}
                      placeholder="e.g., brand_name (auto-generated)"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="field_type">Field Type *</Label>
                    <Select value={formData.field_type} onValueChange={(value) => setFormData(prev => ({ ...prev, field_type: value as FieldType }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {fieldTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            <div>
                              <div className="font-medium">{type.label}</div>
                              <div className="text-xs text-gray-500">{type.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="field_group">Field Group</Label>
                    <Input
                      id="field_group"
                      value={formData.field_group}
                      onChange={(e) => setFormData(prev => ({ ...prev, field_group: e.target.value }))}
                      placeholder="e.g., Product Details"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what this field is used for"
                    rows={2}
                  />
                </div>

                {renderFieldTypeConfig()}
              </TabsContent>

              <TabsContent value="display" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="display_name">Display Name *</Label>
                    <Input
                      id="display_name"
                      value={formData.display_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                      placeholder="Name shown to users"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="display_name_persian">Persian Display Name</Label>
                    <Input
                      id="display_name_persian"
                      value={formData.display_name_persian}
                      onChange={(e) => setFormData(prev => ({ ...prev, display_name_persian: e.target.value }))}
                      placeholder="نام فارسی"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="placeholder">Placeholder Text</Label>
                    <Input
                      id="placeholder"
                      value={formData.placeholder}
                      onChange={(e) => setFormData(prev => ({ ...prev, placeholder: e.target.value }))}
                      placeholder="Placeholder text for input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="help_text">Help Text</Label>
                    <Input
                      id="help_text"
                      value={formData.help_text}
                      onChange={(e) => setFormData(prev => ({ ...prev, help_text: e.target.value }))}
                      placeholder="Additional help for users"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="display_order">Display Order</Label>
                    <Input
                      id="display_order"
                      type="number"
                      value={formData.display_order}
                      onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="column_span">Column Span</Label>
                    <Select value={formData.column_span.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, column_span: parseInt(value) }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Column</SelectItem>
                        <SelectItem value="2">2 Columns</SelectItem>
                        <SelectItem value="3">3 Columns</SelectItem>
                        <SelectItem value="4">4 Columns</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Display Options</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="show_in_list"
                        checked={formData.show_in_list}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, show_in_list: checked }))}
                      />
                      <Label htmlFor="show_in_list">Show in List</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="show_in_detail"
                        checked={formData.show_in_detail}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, show_in_detail: checked }))}
                      />
                      <Label htmlFor="show_in_detail">Show in Detail</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_searchable"
                        checked={formData.is_searchable}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_searchable: checked }))}
                      />
                      <Label htmlFor="is_searchable">Searchable</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_filterable"
                        checked={formData.is_filterable}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_filterable: checked }))}
                      />
                      <Label htmlFor="is_filterable">Filterable</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_sortable"
                        checked={formData.is_sortable}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_sortable: checked }))}
                      />
                      <Label htmlFor="is_sortable">Sortable</Label>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="validation" className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Switch
                    id="is_required"
                    checked={formData.is_required}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_required: checked }))}
                  />
                  <Label htmlFor="is_required">Required Field</Label>
                </div>

                {renderFieldTypeConfig()}
              </TabsContent>
            </Tabs>

            <div className="flex items-center space-x-3 pt-4 border-t">
              <Button
                onClick={handleSubmit}
                disabled={!formData.field_name || !formData.display_name}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                {editingField ? 'Update Field' : 'Create Field'}
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Custom Fields List */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Sliders className="h-5 w-5 mr-2" />
            Custom Fields for {entityTypes.find(t => t.value === selectedEntityType)?.label}
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({filteredFields.length} fields)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredFields.length === 0 ? (
            <div className="text-center py-12">
              <Sliders className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No custom fields</h3>
              <p className="text-gray-600 mb-4">
                Create custom fields to capture additional information for {entityTypes.find(t => t.value === selectedEntityType)?.label.toLowerCase()}.
              </p>
              <Button
                onClick={() => setShowAddForm(true)}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Field
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedFields).map(([group, fields]) => (
                <div key={group} className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                    {group}
                  </h3>
                  <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
                    {fields.map(field => (
                      <Card
                        key={field.id}
                        className="border-2 border-gray-200 hover:border-blue-300 transition-all duration-200"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">{field.display_name}</h4>
                              <p className="text-sm text-gray-600">{field.field_key}</p>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Badge variant="outline" className="text-xs">
                                {field.field_type}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditField(field)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          
                          {field.description && (
                            <p className="text-sm text-gray-600 mb-3">{field.description}</p>
                          )}
                          
                          <div className="flex flex-wrap gap-1 mb-3">
                            {field.is_required && (
                              <Badge variant="destructive" className="text-xs">Required</Badge>
                            )}
                            {field.is_searchable && (
                              <Badge variant="secondary" className="text-xs">Searchable</Badge>
                            )}
                            {field.is_filterable && (
                              <Badge variant="secondary" className="text-xs">Filterable</Badge>
                            )}
                            {field.show_in_list && (
                              <Badge variant="secondary" className="text-xs">List View</Badge>
                            )}
                          </div>
                          
                          <div className="text-xs text-gray-500">
                            Order: {field.display_order} | Span: {field.column_span}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomFieldConfiguration;