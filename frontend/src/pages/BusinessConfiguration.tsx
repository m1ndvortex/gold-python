/**
 * Business Configuration Page
 * 
 * Main page for business type configuration management with
 * industry-specific setup wizards and adaptive UI.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { 
  Settings, 
  Building2, 
  Workflow, 
  FileText, 
  BarChart3, 
  Wrench,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';

import { BusinessTypeSelectionWizard } from '../components/business-config/BusinessTypeSelectionWizard';
import { TerminologyMappingManager } from '../components/business-config/TerminologyMappingManager';
import { WorkflowCustomizationManager } from '../components/business-config/WorkflowCustomizationManager';
import { CustomFieldSchemaManager } from '../components/business-config/CustomFieldSchemaManager';
import { FeatureConfigurationManager } from '../components/business-config/FeatureConfigurationManager';
import { ServiceBusinessInterface } from '../components/business-config/ServiceBusinessInterface';
import { ManufacturingInterface } from '../components/business-config/ManufacturingInterface';

import {
  BusinessType,
  ComprehensiveBusinessConfig,
  BusinessTypeConfiguration
} from '../types/businessConfig';
import { businessConfigApi } from '../services/businessConfigApi';

const BusinessConfiguration: React.FC = () => {
  const [currentConfig, setCurrentConfig] = useState<ComprehensiveBusinessConfig | null>(null);
  const [allConfigurations, setAllConfigurations] = useState<BusinessTypeConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showWizard, setShowWizard] = useState(false);

  useEffect(() => {
    loadConfigurations();
  }, []);

  const loadConfigurations = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all configurations
      const configs = await businessConfigApi.listBusinessConfigurations();
      setAllConfigurations(configs);

      // Load the default or first configuration with full details
      const defaultConfig = configs.find(c => c.is_default) || configs[0];
      if (defaultConfig) {
        const fullConfig = await businessConfigApi.getBusinessConfiguration(defaultConfig.id);
        setCurrentConfig(fullConfig);
      } else {
        // No configurations exist, show wizard
        setShowWizard(true);
      }
    } catch (err) {
      console.error('Failed to load business configurations:', err);
      setError('Failed to load business configurations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigurationSelect = async (configId: string) => {
    try {
      setLoading(true);
      const fullConfig = await businessConfigApi.getBusinessConfiguration(configId);
      setCurrentConfig(fullConfig);
    } catch (err) {
      console.error('Failed to load configuration:', err);
      setError('Failed to load configuration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleWizardComplete = async (newConfig: BusinessTypeConfiguration) => {
    setShowWizard(false);
    await loadConfigurations();
    
    // Load the new configuration
    const fullConfig = await businessConfigApi.getBusinessConfiguration(newConfig.id);
    setCurrentConfig(fullConfig);
  };

  const getBusinessTypeIcon = (businessType: BusinessType) => {
    const iconMap = {
      [BusinessType.GOLD_SHOP]: '💍',
      [BusinessType.RETAIL_STORE]: '🏪',
      [BusinessType.RESTAURANT]: '🍽️',
      [BusinessType.SERVICE_BUSINESS]: '🔧',
      [BusinessType.MANUFACTURING]: '🏭',
      [BusinessType.WHOLESALE]: '📦',
      [BusinessType.PHARMACY]: '💊',
      [BusinessType.AUTOMOTIVE]: '🚗',
      [BusinessType.GROCERY_STORE]: '🛒',
      [BusinessType.CLOTHING_STORE]: '👕',
      [BusinessType.ELECTRONICS_STORE]: '📱',
      [BusinessType.CUSTOM]: '⚙️'
    };
    return iconMap[businessType] || '🏢';
  };

  const getBusinessTypeLabel = (businessType: BusinessType) => {
    return businessType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading && !currentConfig) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-slate-600">Loading business configuration...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showWizard) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-4xl mx-auto">
          <BusinessTypeSelectionWizard
            onComplete={handleWizardComplete}
            onCancel={() => setShowWizard(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-lg bg-white/20 flex items-center justify-center">
                <Settings className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Business Configuration</h1>
                <p className="text-blue-100">
                  Configure your business type, workflows, and industry-specific features
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowWizard(true)}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Configuration
            </Button>
          </div>
        </div>

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {/* Configuration Selector */}
        {allConfigurations.length > 1 && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                <span>Business Configurations</span>
              </CardTitle>
              <CardDescription>
                Select a business configuration to manage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allConfigurations.map((config) => (
                  <Card
                    key={config.id}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                      currentConfig?.id === config.id
                        ? 'ring-2 ring-blue-500 bg-blue-50'
                        : 'hover:bg-slate-50'
                    }`}
                    onClick={() => handleConfigurationSelect(config.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">
                          {getBusinessTypeIcon(config.business_type)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900">{config.name}</h3>
                          <p className="text-sm text-slate-600">
                            {getBusinessTypeLabel(config.business_type)}
                          </p>
                          <div className="flex items-center space-x-2 mt-2">
                            {config.is_default && (
                              <Badge variant="secondary" className="text-xs">
                                Default
                              </Badge>
                            )}
                            {config.is_active ? (
                              <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                Inactive
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Configuration Interface */}
        {currentConfig && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-3xl">
                    {getBusinessTypeIcon(currentConfig.business_type)}
                  </div>
                  <div>
                    <CardTitle className="text-xl">{currentConfig.name}</CardTitle>
                    <CardDescription>
                      {getBusinessTypeLabel(currentConfig.business_type)} Configuration
                      {currentConfig.industry && ` • ${currentConfig.industry}`}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {currentConfig.is_default && (
                    <Badge className="bg-blue-100 text-blue-800">Default</Badge>
                  )}
                  <Badge 
                    className={currentConfig.is_active 
                      ? "bg-green-100 text-green-800" 
                      : "bg-gray-100 text-gray-800"
                    }
                  >
                    {currentConfig.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-6 lg:grid-cols-6">
                  <TabsTrigger value="overview" className="flex items-center space-x-2">
                    <Info className="h-4 w-4" />
                    <span className="hidden sm:inline">Overview</span>
                  </TabsTrigger>
                  <TabsTrigger value="terminology" className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span className="hidden sm:inline">Terminology</span>
                  </TabsTrigger>
                  <TabsTrigger value="workflows" className="flex items-center space-x-2">
                    <Workflow className="h-4 w-4" />
                    <span className="hidden sm:inline">Workflows</span>
                  </TabsTrigger>
                  <TabsTrigger value="fields" className="flex items-center space-x-2">
                    <Wrench className="h-4 w-4" />
                    <span className="hidden sm:inline">Fields</span>
                  </TabsTrigger>
                  <TabsTrigger value="features" className="flex items-center space-x-2">
                    <BarChart3 className="h-4 w-4" />
                    <span className="hidden sm:inline">Features</span>
                  </TabsTrigger>
                  <TabsTrigger value="business" className="flex items-center space-x-2">
                    <Building2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Business</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-8 w-8 text-blue-600" />
                          <div>
                            <p className="text-sm text-blue-600 font-medium">Terminology</p>
                            <p className="text-2xl font-bold text-blue-900">
                              {currentConfig.terminology_mappings.length}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <Workflow className="h-8 w-8 text-green-600" />
                          <div>
                            <p className="text-sm text-green-600 font-medium">Workflows</p>
                            <p className="text-2xl font-bold text-green-900">
                              {currentConfig.workflow_configurations.length}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <Wrench className="h-8 w-8 text-purple-600" />
                          <div>
                            <p className="text-sm text-purple-600 font-medium">Custom Fields</p>
                            <p className="text-2xl font-bold text-purple-900">
                              {currentConfig.custom_field_schemas.length}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <BarChart3 className="h-8 w-8 text-orange-600" />
                          <div>
                            <p className="text-sm text-orange-600 font-medium">Features</p>
                            <p className="text-2xl font-bold text-orange-900">
                              {currentConfig.feature_configurations.filter(f => f.is_enabled).length}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {currentConfig.description && (
                    <Card className="mt-6">
                      <CardHeader>
                        <CardTitle>Description</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-slate-600">{currentConfig.description}</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="terminology" className="mt-6">
                  <TerminologyMappingManager
                    businessConfig={currentConfig}
                    onUpdate={loadConfigurations}
                  />
                </TabsContent>

                <TabsContent value="workflows" className="mt-6">
                  <WorkflowCustomizationManager
                    businessConfig={currentConfig}
                    onUpdate={loadConfigurations}
                  />
                </TabsContent>

                <TabsContent value="fields" className="mt-6">
                  <CustomFieldSchemaManager
                    businessConfig={currentConfig}
                    onUpdate={loadConfigurations}
                  />
                </TabsContent>

                <TabsContent value="features" className="mt-6">
                  <FeatureConfigurationManager
                    businessConfig={currentConfig}
                    onUpdate={loadConfigurations}
                  />
                </TabsContent>

                <TabsContent value="business" className="mt-6">
                  {currentConfig.business_type === BusinessType.SERVICE_BUSINESS && (
                    <ServiceBusinessInterface
                      businessConfig={currentConfig}
                      onUpdate={loadConfigurations}
                    />
                  )}
                  {currentConfig.business_type === BusinessType.MANUFACTURING && (
                    <ManufacturingInterface
                      businessConfig={currentConfig}
                      onUpdate={loadConfigurations}
                    />
                  )}
                  {![BusinessType.SERVICE_BUSINESS, BusinessType.MANUFACTURING].includes(currentConfig.business_type) && (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <Building2 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">
                          Business-Specific Features
                        </h3>
                        <p className="text-slate-600">
                          No additional business-specific configuration is available for {getBusinessTypeLabel(currentConfig.business_type)}.
                          Use the other tabs to configure terminology, workflows, and features.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BusinessConfiguration;