export {};

import React from 'react';

/**
 * Terminology Mapping Manager
 * 
 * Interface for managing industry-specific language customization
 * and terminology mappings for different business contexts.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Textarea } from '../ui/textarea';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Languages, 
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  Globe
} from 'lucide-react';

import {
  ComprehensiveBusinessConfig,
  TerminologyMapping,
  TerminologyMappingCreate,
  BusinessType
} from '../../types/businessConfig';
import { businessConfigApi } from '../../services/businessConfigApi';
import exp from 'constants';

interface TerminologyMappingManagerProps {
  businessConfig: ComprehensiveBusinessConfig;
  onUpdate: () => void;
}

interface TerminologyFormData {
  standard_term: string;
  business_term: string;
  context?: string;
  category?: string;
  language_code: string;
}

const defaultTerminologyMappings: Record<BusinessType, Array<{ standard_term: string; suggested_term: string; category: string; context?: string }>> = {
  [BusinessType.GOLD_SHOP]: [
    { standard_term: 'inventory', suggested_term: 'Gold Items', category: 'general', context: 'Navigation and forms' },
    { standard_term: 'customer', suggested_term: 'Customer', category: 'general' },
    { standard_term: 'invoice', suggested_term: 'Gold Invoice', category: 'sales' },
    { standard_term: 'product', suggested_term: 'Gold Item', category: 'inventory' },
    { standard_term: 'price', suggested_term: 'Gold Price', category: 'pricing' },
    { standard_term: 'weight', suggested_term: 'Weight (grams)', category: 'measurement' },
    { standard_term: 'purity', suggested_term: 'Karat', category: 'measurement' }
  ],
  [BusinessType.RESTAURANT]: [
    { standard_term: 'inventory', suggested_term: 'Menu Items', category: 'general' },
    { standard_term: 'customer', suggested_term: 'Guest', category: 'general' },
    { standard_term: 'invoice', suggested_term: 'Order', category: 'sales' },
    { standard_term: 'product', suggested_term: 'Menu Item', category: 'inventory' },
    { standard_term: 'category', suggested_term: 'Menu Category', category: 'inventory' },
    { standard_term: 'stock', suggested_term: 'Ingredients', category: 'inventory' },
    { standard_term: 'table', suggested_term: 'Table', category: 'service' }
  ],
  [BusinessType.SERVICE_BUSINESS]: [
    { standard_term: 'inventory', suggested_term: 'Services', category: 'general' },
    { standard_term: 'customer', suggested_term: 'Client', category: 'general' },
    { standard_term: 'invoice', suggested_term: 'Service Invoice', category: 'sales' },
    { standard_term: 'product', suggested_term: 'Service', category: 'inventory' },
    { standard_term: 'appointment', suggested_term: 'Appointment', category: 'scheduling' },
    { standard_term: 'project', suggested_term: 'Project', category: 'management' },
    { standard_term: 'time_tracking', suggested_term: 'Time Tracking', category: 'billing' }
  ],
  [BusinessType.MANUFACTURING]: [
    { standard_term: 'inventory', suggested_term: 'Products & Components', category: 'general' },
    { standard_term: 'customer', suggested_term: 'Customer', category: 'general' },
    { standard_term: 'invoice', suggested_term: 'Production Order', category: 'sales' },
    { standard_term: 'product', suggested_term: 'Manufactured Product', category: 'inventory' },
    { standard_term: 'component', suggested_term: 'Component', category: 'inventory' },
    { standard_term: 'bom', suggested_term: 'Bill of Materials', category: 'production' },
    { standard_term: 'production', suggested_term: 'Production', category: 'operations' }
  ],
  [BusinessType.RETAIL_STORE]: [
    { standard_term: 'inventory', suggested_term: 'Products', category: 'general' },
    { standard_term: 'customer', suggested_term: 'Customer', category: 'general' },
    { standard_term: 'invoice', suggested_term: 'Receipt', category: 'sales' },
    { standard_term: 'product', suggested_term: 'Product', category: 'inventory' },
    { standard_term: 'barcode', suggested_term: 'Barcode', category: 'inventory' },
    { standard_term: 'pos', suggested_term: 'Point of Sale', category: 'sales' }
  ],
  [BusinessType.WHOLESALE]: [
    { standard_term: 'inventory', suggested_term: 'Products', category: 'general' },
    { standard_term: 'customer', suggested_term: 'Retailer', category: 'general' },
    { standard_term: 'invoice', suggested_term: 'Wholesale Invoice', category: 'sales' },
    { standard_term: 'product', suggested_term: 'Product', category: 'inventory' },
    { standard_term: 'bulk_pricing', suggested_term: 'Bulk Pricing', category: 'pricing' },
    { standard_term: 'distributor', suggested_term: 'Distributor', category: 'supply_chain' }
  ],
  [BusinessType.PHARMACY]: [
    { standard_term: 'inventory', suggested_term: 'Medications', category: 'general' },
    { standard_term: 'customer', suggested_term: 'Patient', category: 'general' },
    { standard_term: 'invoice', suggested_term: 'Prescription', category: 'sales' },
    { standard_term: 'product', suggested_term: 'Medication', category: 'inventory' },
    { standard_term: 'prescription', suggested_term: 'Prescription', category: 'medical' },
    { standard_term: 'expiry', suggested_term: 'Expiry Date', category: 'compliance' }
  ],
  [BusinessType.AUTOMOTIVE]: [
    { standard_term: 'inventory', suggested_term: 'Parts & Services', category: 'general' },
    { standard_term: 'customer', suggested_term: 'Vehicle Owner', category: 'general' },
    { standard_term: 'invoice', suggested_term: 'Service Invoice', category: 'sales' },
    { standard_term: 'product', suggested_term: 'Part/Service', category: 'inventory' },
    { standard_term: 'vehicle', suggested_term: 'Vehicle', category: 'service' },
    { standard_term: 'repair', suggested_term: 'Repair', category: 'service' }
  ],
  [BusinessType.GROCERY_STORE]: [
    { standard_term: 'inventory', suggested_term: 'Groceries', category: 'general' },
    { standard_term: 'customer', suggested_term: 'Shopper', category: 'general' },
    { standard_term: 'invoice', suggested_term: 'Receipt', category: 'sales' },
    { standard_term: 'product', suggested_term: 'Grocery Item', category: 'inventory' }
  ],
  [BusinessType.CLOTHING_STORE]: [
    { standard_term: 'inventory', suggested_term: 'Clothing', category: 'general' },
    { standard_term: 'customer', suggested_term: 'Customer', category: 'general' },
    { standard_term: 'invoice', suggested_term: 'Receipt', category: 'sales' },
    { standard_term: 'product', suggested_term: 'Clothing Item', category: 'inventory' }
  ],
  [BusinessType.ELECTRONICS_STORE]: [
    { standard_term: 'inventory', suggested_term: 'Electronics', category: 'general' },
    { standard_term: 'customer', suggested_term: 'Customer', category: 'general' },
    { standard_term: 'invoice', suggested_term: 'Receipt', category: 'sales' },
    { standard_term: 'product', suggested_term: 'Electronic Device', category: 'inventory' }
  ],
  [BusinessType.CUSTOM]: [
    { standard_term: 'inventory', suggested_term: 'Items', category: 'general' },
    { standard_term: 'customer', suggested_term: 'Customer', category: 'general' },
    { standard_term: 'invoice', suggested_term: 'Invoice', category: 'sales' },
    { standard_term: 'product', suggested_term: 'Item', category: 'inventory' }
  ]
};

export const TerminologyMappingManager: React.FC<TerminologyMappingManagerProps> = ({
  businessConfig,
  onUpdate
}) => {
  const [mappings, setMappings] = useState<TerminologyMapping[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingMapping, setEditingMapping] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  const [formData, setFormData] = useState<TerminologyFormData>({
    standard_term: '',
    business_term: '',
    context: '',
    category: '',
    language_code: 'en'
  });

  useEffect(() => {
    loadTerminologyMappings();
  }, [businessConfig.id, selectedLanguage]);

  const loadTerminologyMappings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await businessConfigApi.getTerminologyMappings(
        businessConfig.id,
        selectedLanguage
      );
      setMappings(data);
    } catch (err) {
      console.error('Failed to load terminology mappings:', err);
      setError('Failed to load terminology mappings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMapping = async () => {
    if (!formData.standard_term.trim() || !formData.business_term.trim()) {
      setError('Standard term and business term are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const mappingData: TerminologyMappingCreate = {
        business_config_id: businessConfig.id,
        standard_term: formData.standard_term.trim(),
        business_term: formData.business_term.trim(),
        context: formData.context?.trim() || undefined,
        category: formData.category?.trim() || undefined,
        language_code: formData.language_code
      };

      if (editingMapping) {
        await businessConfigApi.updateTerminologyMapping(editingMapping, mappingData);
      } else {
        await businessConfigApi.createTerminologyMapping(mappingData);
      }

      await loadTerminologyMappings();
      resetForm();
      onUpdate();
    } catch (err) {
      console.error('Failed to save terminology mapping:', err);
      setError('Failed to save terminology mapping. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditMapping = (mapping: TerminologyMapping) => {
    setFormData({
      standard_term: mapping.standard_term,
      business_term: mapping.business_term,
      context: mapping.context || '',
      category: mapping.category || '',
      language_code: mapping.language_code
    });
    setEditingMapping(mapping.id);
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({
      standard_term: '',
      business_term: '',
      context: '',
      category: '',
      language_code: selectedLanguage
    });
    setEditingMapping(null);
    setShowAddForm(false);
  };

  const handleApplySuggestions = async () => {
    const suggestions = defaultTerminologyMappings[businessConfig.business_type] || [];
    
    try {
      setLoading(true);
      setError(null);

      const mappingsToCreate = suggestions.map(suggestion => ({
        business_config_id: businessConfig.id,
        standard_term: suggestion.standard_term,
        business_term: suggestion.suggested_term,
        category: suggestion.category,
        context: suggestion.context,
        language_code: selectedLanguage
      }));

      await businessConfigApi.batchUpdateTerminology(businessConfig.id, mappingsToCreate);
      await loadTerminologyMappings();
      onUpdate();
    } catch (err) {
      console.error('Failed to apply suggestions:', err);
      setError('Failed to apply suggestions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredMappings = mappings.filter(mapping => {
    const matchesSearch = 
      mapping.standard_term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mapping.business_term.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || mapping.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(mappings.map(m => m.category).filter(Boolean)));

  const getBusinessTypeLabel = (businessType: BusinessType) => {
    return businessType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Languages className="h-6 w-6 text-blue-600" />
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Terminology Mapping</h2>
            <p className="text-sm text-slate-600">
              Customize how terms are displayed for {getBusinessTypeLabel(businessConfig.business_type)}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={handleApplySuggestions}
            disabled={loading}
          >
            Apply Suggestions
          </Button>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Mapping
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
                  placeholder="Search terminology..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-slate-600" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-md text-sm"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <Globe className="h-4 w-4 text-slate-600" />
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-md text-sm"
              >
                <option value="en">English</option>
                <option value="fa">Persian</option>
                <option value="ar">Arabic</option>
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
              {editingMapping ? 'Edit Terminology Mapping' : 'Add New Terminology Mapping'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="standard-term">Standard Term *</Label>
                <Input
                  id="standard-term"
                  value={formData.standard_term}
                  onChange={(e) => setFormData(prev => ({ ...prev, standard_term: e.target.value }))}
                  placeholder="e.g., inventory, customer, invoice"
                />
              </div>
              <div>
                <Label htmlFor="business-term">Business Term *</Label>
                <Input
                  id="business-term"
                  value={formData.business_term}
                  onChange={(e) => setFormData(prev => ({ ...prev, business_term: e.target.value }))}
                  placeholder="e.g., Menu Items, Clients, Orders"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="e.g., general, sales, inventory"
                />
              </div>
              <div>
                <Label htmlFor="language">Language</Label>
                <select
                  id="language"
                  value={formData.language_code}
                  onChange={(e) => setFormData(prev => ({ ...prev, language_code: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                >
                  <option value="en">English</option>
                  <option value="fa">Persian</option>
                  <option value="ar">Arabic</option>
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="context">Context</Label>
              <Textarea
                id="context"
                value={formData.context}
                onChange={(e) => setFormData(prev => ({ ...prev, context: e.target.value }))}
                placeholder="Where this term is used (optional)"
                rows={2}
              />
            </div>
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={resetForm}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSaveMapping} disabled={loading}>
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {editingMapping ? 'Update' : 'Save'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mappings List */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Current Terminology Mappings</span>
            <Badge variant="secondary">{filteredMappings.length} mappings</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && !showAddForm ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : filteredMappings.length === 0 ? (
            <div className="text-center py-8">
              <Languages className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No Terminology Mappings</h3>
              <p className="text-slate-600 mb-4">
                {searchTerm || selectedCategory !== 'all' 
                  ? 'No mappings match your current filters.'
                  : 'Start by adding terminology mappings for your business type.'
                }
              </p>
              {!searchTerm && selectedCategory === 'all' && (
                <Button onClick={handleApplySuggestions} disabled={loading}>
                  Apply Default Suggestions
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMappings.map((mapping) => (
                <div
                  key={mapping.id}
                  className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-slate-900">{mapping.standard_term}</span>
                          <span className="text-slate-400">→</span>
                          <span className="font-medium text-blue-600">{mapping.business_term}</span>
                        </div>
                        <div className="flex items-center space-x-4 mt-1">
                          {mapping.category && (
                            <Badge variant="secondary" className="text-xs">
                              {mapping.category}
                            </Badge>
                          )}
                          {mapping.language_code !== 'en' && (
                            <Badge variant="outline" className="text-xs">
                              {mapping.language_code.toUpperCase()}
                            </Badge>
                          )}
                          {mapping.context && (
                            <span className="text-xs text-slate-500">{mapping.context}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditMapping(mapping)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};expor
t { TerminologyMappingManager };expor
t default TerminologyMappingManager;exp
ort { TerminologyMappingManager };