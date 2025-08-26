/**
 * Feature Configuration Manager
 * 
 * Interface for managing industry-specific feature configuration
 * with toggle controls and feature-specific settings.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { 
  Plus, 
  Edit, 
  Save, 
  X, 
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  Settings,
  ToggleLeft,
  Shield,
  Users,
  Zap,
  Database,
  BarChart3,
  FileText,
  Globe,
  Smartphone
} from 'lucide-react';

import {
  ComprehensiveBusinessConfig,
  FeatureConfiguration,
  FeatureConfigurationCreate,
  BusinessType
} from '../../types/businessConfig';
import { businessConfigApi } from '../../services/businessConfigApi';

interface FeatureConfigurationManagerProps {
  businessConfig: ComprehensiveBusinessConfig;
  onUpdate: () => void;
}

interface FeatureFormData {
  feature_name: string;
  feature_category: string;
  is_enabled: boolean;
  configuration: Record<string, any>;
  required_roles: string[];
}

const featureCategories = [
  { value: 'core', label: 'Core Features', icon: Database },
  { value: 'analytics', label: 'Analytics & Reporting', icon: BarChart3 },
  { value: 'security', label: 'Security & Access', icon: Shield },
  { value: 'integration', label: 'Integrations', icon: Globe },
  { value: 'mobile', label: 'Mobile Features', icon: Smartphone },
  { value: 'automation', label: 'Automation', icon: Zap },
  { value: 'collaboration', label: 'Collaboration', icon: Users },
  { value: 'documentation', label: 'Documentation', icon: FileText }
];

const defaultFeatures: Record<BusinessType, Array<{
  feature_name: string;
  feature_category: string;
  description: string;
  is_enabled: boolean;
  configuration?: Record<string, any>;
  required_roles?: string[];
}>> = {
  [BusinessType.GOLD_SHOP]: [
    {
      feature_name: 'gold_price_tracking',
      feature_category: 'core',
      description: 'Real-time gold price tracking and automatic price updates',
      is_enabled: true,
      configuration: { update_frequency: 'hourly', price_source: 'api' }
    },
    {
      feature_name: 'weight_based_calculations',
      feature_category: 'core',
      description: 'Automatic weight-based pricing and calculations',
      is_enabled: true
    },
    {
      feature_name: 'purity_management',
      feature_category: 'core',
      description: 'Gold purity tracking and karat management',
      is_enabled: true
    },
    {
      feature_name: 'making_charges',
      feature_category: 'core',
      description: 'Labor and making charges calculation',
      is_enabled: true
    }
  ],
  [BusinessType.RESTAURANT]: [
    {
      feature_name: 'table_management',
      feature_category: 'core',
      description: 'Table reservation and management system',
      is_enabled: true,
      configuration: { max_tables: 50, reservation_window: 30 }
    },
    {
      feature_name: 'kitchen_display',
      feature_category: 'core',
      description: 'Kitchen display system for order management',
      is_enabled: true
    },
    {
      feature_name: 'menu_engineering',
      feature_category: 'analytics',
      description: 'Menu performance analytics and optimization',
      is_enabled: false
    },
    {
      feature_name: 'allergen_tracking',
      feature_category: 'core',
      description: 'Allergen information and dietary restrictions',
      is_enabled: true
    }
  ],
  [BusinessType.SERVICE_BUSINESS]: [
    {
      feature_name: 'appointment_booking',
      feature_category: 'core',
      description: 'Online appointment booking and scheduling',
      is_enabled: true,
      configuration: { booking_window: 60, auto_confirm: false }
    },
    {
      feature_name: 'time_tracking',
      feature_category: 'core',
      description: 'Employee time tracking and billing',
      is_enabled: true
    },
    {
      feature_name: 'project_management',
      feature_category: 'collaboration',
      description: 'Project tracking and milestone management',
      is_enabled: false
    },
    {
      feature_name: 'client_portal',
      feature_category: 'collaboration',
      description: 'Client self-service portal',
      is_enabled: false
    }
  ],
  [BusinessType.MANUFACTURING]: [
    {
      feature_name: 'bill_of_materials',
      feature_category: 'core',
      description: 'Bill of materials management and tracking',
      is_enabled: true
    },
    {
      feature_name: 'production_scheduling',
      feature_category: 'core',
      description: 'Production planning and scheduling',
      is_enabled: true
    },
    {
      feature_name: 'quality_control',
      feature_category: 'core',
      description: 'Quality control and inspection tracking',
      is_enabled: true
    },
    {
      feature_name: 'shop_floor_control',
      feature_category: 'automation',
      description: 'Real-time shop floor monitoring',
      is_enabled: false
    }
  ],
  [BusinessType.RETAIL_STORE]: [
    {
      feature_name: 'barcode_scanning',
      feature_category: 'core',
      description: 'Barcode scanning for inventory and POS',
      is_enabled: true
    },
    {
      feature_name: 'loyalty_program',
      feature_category: 'core',
      description: 'Customer loyalty and rewards program',
      is_enabled: false,
      configuration: { points_per_dollar: 1, redemption_rate: 0.01 }
    },
    {
      feature_name: 'price_management',
      feature_category: 'core',
      description: 'Dynamic pricing and promotion management',
      is_enabled: true
    }
  ],
  [BusinessType.WHOLESALE]: [
    {
      feature_name: 'bulk_pricing',
      feature_category: 'core',
      description: 'Tiered bulk pricing and volume discounts',
      is_enabled: true
    },
    {
      feature_name: 'credit_management',
      feature_category: 'core',
      description: 'Customer credit limits and terms',
      is_enabled: true
    },
    {
      feature_name: 'drop_shipping',
      feature_category: 'integration',
      description: 'Drop shipping integration and management',
      is_enabled: false
    }
  ],
  [BusinessType.PHARMACY]: [
    {
      feature_name: 'prescription_management',
      feature_category: 'core',
      description: 'Prescription tracking and validation',
      is_enabled: true,
      required_roles: ['pharmacist']
    },
    {
      feature_name: 'drug_interaction_check',
      feature_category: 'security',
      description: 'Automatic drug interaction checking',
      is_enabled: true
    },
    {
      feature_name: 'expiry_tracking',
      feature_category: 'core',
      description: 'Medication expiry date tracking and alerts',
      is_enabled: true
    }
  ],
  [BusinessType.AUTOMOTIVE]: [
    {
      feature_name: 'vehicle_history',
      feature_category: 'core',
      description: 'Vehicle service history tracking',
      is_enabled: true
    },
    {
      feature_name: 'parts_compatibility',
      feature_category: 'core',
      description: 'Auto parts compatibility checking',
      is_enabled: true
    },
    {
      feature_name: 'service_reminders',
      feature_category: 'automation',
      description: 'Automatic service reminder notifications',
      is_enabled: false
    }
  ],
  [BusinessType.GROCERY_STORE]: [],
  [BusinessType.CLOTHING_STORE]: [],
  [BusinessType.ELECTRONICS_STORE]: [],
  [BusinessType.CUSTOM]: []
};

const commonFeatures = [
  {
    feature_name: 'inventory_management',
    feature_category: 'core',
    description: 'Complete inventory tracking and management',
    is_enabled: true
  },
  {
    feature_name: 'customer_management',
    feature_category: 'core',
    description: 'Customer database and relationship management',
    is_enabled: true
  },
  {
    feature_name: 'invoice_management',
    feature_category: 'core',
    description: 'Invoice creation and payment tracking',
    is_enabled: true
  },
  {
    feature_name: 'basic_reporting',
    feature_category: 'analytics',
    description: 'Standard business reports and analytics',
    is_enabled: true
  },
  {
    feature_name: 'user_management',
    feature_category: 'security',
    description: 'User accounts and role-based access control',
    is_enabled: true
  },
  {
    feature_name: 'backup_restore',
    feature_category: 'security',
    description: 'Automated backup and restore functionality',
    is_enabled: true
  },
  {
    feature_name: 'multi_language',
    feature_category: 'core',
    description: 'Multi-language interface support',
    is_enabled: false
  },
  {
    feature_name: 'api_access',
    feature_category: 'integration',
    description: 'REST API access for third-party integrations',
    is_enabled: false,
    required_roles: ['admin']
  }
];

export const FeatureConfigurationManager: React.FC<FeatureConfigurationManagerProps> = ({
  businessConfig,
  onUpdate
}) => {
  const [features, setFeatures] = useState<FeatureConfiguration[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingFeature, setEditingFeature] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const [formData, setFormData] = useState<FeatureFormData>({
    feature_name: '',
    feature_category: 'core',
    is_enabled: true,
    configuration: {},
    required_roles: []
  });

  useEffect(() => {
    loadFeatureConfigurations();
  }, [businessConfig.id]);

  const loadFeatureConfigurations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await businessConfigApi.getFeatureConfigurations(businessConfig.id);
      setFeatures(data);
    } catch (err) {
      console.error('Failed to load feature configurations:', err);
      setError('Failed to load feature configurations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFeature = async (featureId: string, isEnabled: boolean) => {
    try {
      setError(null);
      await businessConfigApi.updateFeatureConfiguration(featureId, { is_enabled: isEnabled });
      await loadFeatureConfigurations();
      onUpdate();
    } catch (err) {
      console.error('Failed to toggle feature:', err);
      setError('Failed to update feature. Please try again.');
    }
  };

  const handleSaveFeature = async () => {
    if (!formData.feature_name.trim()) {
      setError('Feature name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const featureData: FeatureConfigurationCreate = {
        business_config_id: businessConfig.id,
        feature_name: formData.feature_name.trim(),
        feature_category: formData.feature_category,
        is_enabled: formData.is_enabled,
        configuration: Object.keys(formData.configuration).length > 0 ? formData.configuration : undefined,
        required_roles: formData.required_roles.length > 0 ? formData.required_roles : undefined
      };

      if (editingFeature) {
        await businessConfigApi.updateFeatureConfiguration(editingFeature, featureData);
      } else {
        await businessConfigApi.createFeatureConfiguration(featureData);
      }

      await loadFeatureConfigurations();
      resetForm();
      onUpdate();
    } catch (err) {
      console.error('Failed to save feature configuration:', err);
      setError('Failed to save feature configuration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      feature_name: '',
      feature_category: 'core',
      is_enabled: true,
      configuration: {},
      required_roles: []
    });
    setEditingFeature(null);
    setShowAddForm(false);
  };

  const handleApplyDefaults = async () => {
    const businessFeatures = defaultFeatures[businessConfig.business_type] || [];
    const allFeatures = [...commonFeatures, ...businessFeatures];
    
    try {
      setLoading(true);
      setError(null);

      for (const feature of allFeatures) {
        const featureData: FeatureConfigurationCreate = {
          business_config_id: businessConfig.id,
          ...feature
        };
        await businessConfigApi.createFeatureConfiguration(featureData);
      }

      await loadFeatureConfigurations();
      onUpdate();
    } catch (err) {
      console.error('Failed to apply default features:', err);
      setError('Failed to apply default features. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredFeatures = features.filter(feature => {
    const matchesSearch = feature.feature_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || feature.feature_category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (category: string) => {
    const categoryInfo = featureCategories.find(cat => cat.value === category);
    return categoryInfo?.icon || Settings;
  };

  const getCategoryLabel = (category: string) => {
    const categoryInfo = featureCategories.find(cat => cat.value === category);
    return categoryInfo?.label || category;
  };

  const getBusinessTypeLabel = (businessType: BusinessType) => {
    return businessType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const groupedFeatures = filteredFeatures.reduce((groups, feature) => {
    const category = feature.feature_category || 'other';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(feature);
    return groups;
  }, {} as Record<string, FeatureConfiguration[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <ToggleLeft className="h-6 w-6 text-blue-600" />
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Feature Configuration</h2>
            <p className="text-sm text-slate-600">
              Enable and configure features for {getBusinessTypeLabel(businessConfig.business_type)}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={handleApplyDefaults}
            disabled={loading}
          >
            Apply Defaults
          </Button>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Feature
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
                  placeholder="Search features..."
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
                {featureCategories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
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
              {editingFeature ? 'Edit Feature' : 'Add New Feature'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="feature-name">Feature Name *</Label>
                <Input
                  id="feature-name"
                  value={formData.feature_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, feature_name: e.target.value }))}
                  placeholder="e.g., loyalty_program, time_tracking"
                />
              </div>
              <div>
                <Label htmlFor="feature-category">Category *</Label>
                <select
                  id="feature-category"
                  value={formData.feature_category}
                  onChange={(e) => setFormData(prev => ({ ...prev, feature_category: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                >
                  {featureCategories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is-enabled"
                checked={formData.is_enabled}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_enabled: checked }))}
              />
              <Label htmlFor="is-enabled">Enabled by default</Label>
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={resetForm}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSaveFeature} disabled={loading}>
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Feature
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Features List */}
      <div className="space-y-6">
        {loading && !showAddForm ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : Object.keys(groupedFeatures).length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="text-center py-8">
              <ToggleLeft className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No Features Configured</h3>
              <p className="text-slate-600 mb-4">
                {searchTerm || selectedCategory !== 'all' 
                  ? 'No features match your current filters.'
                  : 'Start by adding feature configurations for your business.'
                }
              </p>
              {!searchTerm && selectedCategory === 'all' && (
                <Button onClick={handleApplyDefaults} disabled={loading}>
                  Apply Default Features
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          Object.entries(groupedFeatures).map(([category, categoryFeatures]) => {
            const CategoryIcon = getCategoryIcon(category);
            return (
              <Card key={category} className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3">
                    <CategoryIcon className="h-5 w-5 text-blue-600" />
                    <span>{getCategoryLabel(category)}</span>
                    <Badge variant="secondary">{categoryFeatures.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {categoryFeatures.map((feature) => (
                      <div
                        key={feature.id}
                        className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h3 className="font-medium text-slate-900">
                              {feature.feature_name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </h3>
                            {feature.required_roles && feature.required_roles.length > 0 && (
                              <Badge className="bg-orange-100 text-orange-800 text-xs">
                                <Shield className="h-3 w-3 mr-1" />
                                Role Required
                              </Badge>
                            )}
                          </div>
                          {feature.required_roles && feature.required_roles.length > 0 && (
                            <p className="text-sm text-slate-600 mt-1">
                              Required roles: {feature.required_roles.join(', ')}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-3">
                          <Switch
                            checked={feature.is_enabled}
                            onCheckedChange={(checked) => handleToggleFeature(feature.id, checked)}
                          />
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};