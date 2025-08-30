/**
 * Feature Toggle Dashboard
 * Interface for managing feature flags and business-type specific recommendations
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Input } from '../ui/input';
import { 
  Zap, 
  Search, 
  Filter, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  Star,
  Settings,
  Shield,
  Users,
  BarChart3,
  Package,
  FileText,
  CreditCard,
  Smartphone,
  Globe,
  Lock,
  Unlock
} from 'lucide-react';
import { useBusinessAdaptability } from '../../hooks/useBusinessAdaptability';
import { FeatureConfiguration } from '../../types/businessAdaptability';

const featureIcons: Record<string, React.ComponentType<any>> = {
  inventory: Package,
  invoice: FileText,
  customer: Users,
  reporting: BarChart3,
  analytics: BarChart3,
  accounting: CreditCard,
  mobile: Smartphone,
  security: Shield,
  integration: Globe,
  workflow: Settings,
  notification: Info
};

const featureCategories = [
  { value: 'all', label: 'All Features' },
  { value: 'inventory', label: 'Inventory Management' },
  { value: 'invoice', label: 'Invoicing' },
  { value: 'customer', label: 'Customer Management' },
  { value: 'reporting', label: 'Reporting & Analytics' },
  { value: 'accounting', label: 'Accounting' },
  { value: 'integration', label: 'Integrations' },
  { value: 'security', label: 'Security' },
  { value: 'workflow', label: 'Workflow' }
];

export const FeatureToggleDashboard: React.FC = () => {
  const {
    currentConfiguration,
    featureConfigurations,
    toggleFeature,
    isLoading,
    error
  } = useBusinessAdaptability();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showOnlyEnabled, setShowOnlyEnabled] = useState(false);
  const [showOnlyRecommended, setShowOnlyRecommended] = useState(false);

  // Filter features based on search, category, and other filters
  const filteredFeatures = React.useMemo(() => {
    return featureConfigurations.filter(feature => {
      const matchesSearch = feature.feature_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           feature.feature_code.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || feature.feature_category === selectedCategory;
      
      const matchesEnabled = !showOnlyEnabled || feature.is_enabled;
      
      const matchesRecommended = !showOnlyRecommended || 
        (currentConfiguration?.business_type?.type_code && 
         feature.applicable_business_types.includes(currentConfiguration.business_type.type_code));
      
      return matchesSearch && matchesCategory && matchesEnabled && matchesRecommended;
    });
  }, [featureConfigurations, searchTerm, selectedCategory, showOnlyEnabled, showOnlyRecommended, currentConfiguration]);

  // Group features by category
  const groupedFeatures = React.useMemo(() => {
    const groups: Record<string, FeatureConfiguration[]> = {};
    
    filteredFeatures.forEach(feature => {
      const category = feature.feature_category || 'other';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(feature);
    });

    return groups;
  }, [filteredFeatures]);

  // Get feature statistics
  const featureStats = React.useMemo(() => {
    const total = featureConfigurations.length;
    const enabled = featureConfigurations.filter(f => f.is_enabled).length;
    const recommended = featureConfigurations.filter(f => 
      currentConfiguration?.business_type?.type_code && 
      f.applicable_business_types.includes(currentConfiguration.business_type.type_code)
    ).length;
    const required = featureConfigurations.filter(f => 
      currentConfiguration?.business_type?.type_code && 
      f.required_for_types.includes(currentConfiguration.business_type.type_code)
    ).length;

    return { total, enabled, recommended, required };
  }, [featureConfigurations, currentConfiguration]);

  const handleToggleFeature = async (feature: FeatureConfiguration) => {
    try {
      await toggleFeature(feature.id, !feature.is_enabled);
    } catch (error) {
      console.error('Failed to toggle feature:', error);
    }
  };

  const getFeatureIcon = (feature: FeatureConfiguration) => {
    const IconComponent = featureIcons[feature.feature_category] || featureIcons.workflow || Settings;
    return IconComponent;
  };

  const isFeatureRecommended = (feature: FeatureConfiguration) => {
    return currentConfiguration?.business_type?.type_code && 
           feature.applicable_business_types.includes(currentConfiguration.business_type.type_code);
  };

  const isFeatureRequired = (feature: FeatureConfiguration) => {
    return currentConfiguration?.business_type?.type_code && 
           feature.required_for_types.includes(currentConfiguration.business_type.type_code);
  };

  const hasConflicts = (feature: FeatureConfiguration) => {
    return feature.conflicts_with_features.some(conflictFeature => 
      featureConfigurations.find(f => f.feature_code === conflictFeature && f.is_enabled)
    );
  };

  const getMissingDependencies = (feature: FeatureConfiguration) => {
    return feature.depends_on_features.filter(depFeature => 
      !featureConfigurations.find(f => f.feature_code === depFeature && f.is_enabled)
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading features...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          Error loading features: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  if (!currentConfiguration) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-12 text-center">
          <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Business Configuration</h3>
          <p className="text-gray-600">
            You need to set up a business configuration first to manage features.
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
          <h2 className="text-2xl font-bold text-gray-900">Feature Management</h2>
          <p className="text-gray-600">Enable and configure features for your business</p>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Features</p>
                <p className="font-semibold">{featureStats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Enabled</p>
                <p className="font-semibold">{featureStats.enabled}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center">
                <Star className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Recommended</p>
                <p className="font-semibold">{featureStats.recommended}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Required</p>
                <p className="font-semibold">{featureStats.required}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search features..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              {featureCategories.map(category => (
                <Button
                  key={category.value}
                  variant={selectedCategory === category.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category.value)}
                  className={selectedCategory === category.value ? 'bg-gradient-to-r from-blue-500 to-indigo-600' : ''}
                >
                  {category.label}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center space-x-6 mt-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="show_enabled"
                checked={showOnlyEnabled}
                onCheckedChange={setShowOnlyEnabled}
              />
              <label htmlFor="show_enabled" className="text-sm text-gray-600">
                Show only enabled
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="show_recommended"
                checked={showOnlyRecommended}
                onCheckedChange={setShowOnlyRecommended}
              />
              <label htmlFor="show_recommended" className="text-sm text-gray-600">
                Show only recommended
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features List */}
      {filteredFeatures.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No features found</h3>
            <p className="text-gray-600">
              Try adjusting your search terms or filters.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedFeatures).map(([category, features]) => (
            <Card key={category} className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  {React.createElement(featureIcons[category] || Settings, { className: "h-5 w-5 mr-2" })}
                  {featureCategories.find(c => c.value === category)?.label || category.charAt(0).toUpperCase() + category.slice(1)}
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    ({features.length} features)
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {features.map(feature => {
                    const IconComponent = getFeatureIcon(feature);
                    const isRecommended = isFeatureRecommended(feature);
                    const isRequired = isFeatureRequired(feature);
                    const conflicts = hasConflicts(feature);
                    const missingDeps = getMissingDependencies(feature);

                    return (
                      <div
                        key={feature.id}
                        className={`p-4 border-2 rounded-lg transition-all duration-200 ${
                          feature.is_enabled 
                            ? 'border-green-200 bg-green-50' 
                            : conflicts || missingDeps.length > 0
                            ? 'border-red-200 bg-red-50'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start space-x-3 flex-1">
                            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                              <IconComponent className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <h4 className="font-semibold text-gray-900 truncate">
                                  {feature.feature_name}
                                </h4>
                                {isRequired && (
                                  <Badge variant="destructive" className="text-xs">Required</Badge>
                                )}
                                {isRecommended && !isRequired && (
                                  <Badge variant="default" className="text-xs bg-yellow-100 text-yellow-800">
                                    <Star className="h-3 w-3 mr-1" />
                                    Recommended
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mb-2">
                                {feature.feature_code}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2 flex-shrink-0">
                            {feature.is_enabled ? (
                              <Unlock className="h-4 w-4 text-green-600" />
                            ) : (
                              <Lock className="h-4 w-4 text-gray-400" />
                            )}
                            <Switch
                              checked={feature.is_enabled}
                              onCheckedChange={() => handleToggleFeature(feature)}
                              disabled={isRequired || conflicts || missingDeps.length > 0}
                            />
                          </div>
                        </div>

                        {/* Conflicts and Dependencies */}
                        {(conflicts || missingDeps.length > 0) && (
                          <div className="mb-3 space-y-2">
                            {conflicts && (
                              <Alert className="border-red-200 bg-red-50 p-2">
                                <AlertCircle className="h-3 w-3 text-red-600" />
                                <AlertDescription className="text-xs text-red-800">
                                  Conflicts with enabled features: {feature.conflicts_with_features.join(', ')}
                                </AlertDescription>
                              </Alert>
                            )}
                            {missingDeps.length > 0 && (
                              <Alert className="border-yellow-200 bg-yellow-50 p-2">
                                <Info className="h-3 w-3 text-yellow-600" />
                                <AlertDescription className="text-xs text-yellow-800">
                                  Requires: {missingDeps.join(', ')}
                                </AlertDescription>
                              </Alert>
                            )}
                          </div>
                        )}

                        {/* Feature Details */}
                        <div className="space-y-2">
                          {feature.applicable_business_types.length > 0 && (
                            <div>
                              <span className="text-xs text-gray-500">Applicable to:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {feature.applicable_business_types.map(type => (
                                  <Badge key={type} variant="outline" className="text-xs">
                                    {type}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {feature.usage_count > 0 && (
                            <div className="text-xs text-gray-500">
                              Used {feature.usage_count} times
                              {feature.last_used && (
                                <span> • Last used: {new Date(feature.last_used).toLocaleDateString()}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default FeatureToggleDashboard;