/**
 * Business Adaptability Page
 * Main page for business type configuration, workflow adaptation, terminology mapping,
 * custom field schemas, feature configuration, and business management.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { 
  Settings, 
  Building2, 
  Workflow, 
  Languages, 
  Sliders, 
  Calculator, 
  BarChart3, 
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Info,
  Zap
} from 'lucide-react';
import { useBusinessAdaptability } from '../hooks/useBusinessAdaptability';
import { BusinessTypeSelectionWizard } from '../components/business-adaptability/BusinessTypeSelectionWizard';
import { BusinessConfigurationDashboard } from '../components/business-adaptability/BusinessConfigurationDashboard';
import { BusinessSetupFlow } from '../components/business-adaptability/BusinessSetupFlow';
import { TerminologyManagement } from '../components/business-adaptability/TerminologyManagement';
import { CustomFieldConfiguration } from '../components/business-adaptability/CustomFieldConfiguration';
import { FeatureToggleDashboard } from '../components/business-adaptability/FeatureToggleDashboard';
import { UnitOfMeasureManagement } from '../components/business-adaptability/UnitOfMeasureManagement';
import { PricingModelConfiguration } from '../components/business-adaptability/PricingModelConfiguration';
import { BusinessMigrationWizard } from '../components/business-adaptability/BusinessMigrationWizard';
import { BusinessAnalyticsDashboard } from '../components/business-adaptability/BusinessAnalyticsDashboard';
import { WorkflowConfiguration } from '../components/business-adaptability/WorkflowConfiguration';
import { BusinessTemplateGallery } from '../components/business-adaptability/BusinessTemplateGallery';
import { MultiLanguageSupport } from '../components/business-adaptability/MultiLanguageSupport';

const BusinessAdaptability: React.FC = () => {
  const {
    businessTypes,
    businessConfigurations,
    currentConfiguration,
    adaptabilityStatus,
    selectedBusinessType,
    isSetupMode,
    setupStep,
    isLoading,
    error,
    setCurrentConfiguration,
    startSetup,
    completeSetup
  } = useBusinessAdaptability();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [showWizard, setShowWizard] = useState(false);

  // Auto-select first configuration if available
  useEffect(() => {
    if (!currentConfiguration && businessConfigurations.length > 0) {
      setCurrentConfiguration(businessConfigurations[0]);
    }
  }, [businessConfigurations, currentConfiguration, setCurrentConfiguration]);

  // Show setup wizard if no configurations exist
  useEffect(() => {
    if (!isLoading && businessConfigurations.length === 0 && !isSetupMode) {
      setShowWizard(true);
    }
  }, [isLoading, businessConfigurations.length, isSetupMode]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading business adaptability settings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Error loading business adaptability settings: {(error as Error)?.message || 'Unknown error'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show setup wizard for new businesses
  if (showWizard || isSetupMode) {
    return (
      <div className="container mx-auto px-4 py-8">
        {!selectedBusinessType ? (
          <BusinessTypeSelectionWizard
            businessTypes={businessTypes}
            onSelect={(businessType) => {
              startSetup(businessType);
              setShowWizard(false);
            }}
            onCancel={() => setShowWizard(false)}
          />
        ) : (
          <BusinessSetupFlow
            businessType={selectedBusinessType}
            currentStep={setupStep}
            onComplete={() => {
              completeSetup();
              setShowWizard(false);
            }}
            onCancel={() => {
              completeSetup();
              setShowWizard(false);
            }}
          />
        )}
      </div>
    );
  }

  // Main business adaptability interface
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Business Adaptability</h1>
          <p className="text-gray-600">
            Configure your business type, customize workflows, and adapt the system to your specific needs
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {currentConfiguration && (
            <Badge variant="outline" className="px-3 py-1">
              <Building2 className="h-4 w-4 mr-2" />
              {currentConfiguration.business_type?.name || 'Unknown Type'}
            </Badge>
          )}
          <Button
            onClick={() => setShowWizard(true)}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
          >
            <Settings className="h-4 w-4 mr-2" />
            Setup New Business
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      {adaptabilityStatus && (
        <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-blue-50">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  {adaptabilityStatus.setup_completed ? (
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  ) : (
                    <AlertCircle className="h-8 w-8 text-yellow-600" />
                  )}
                </div>
                <p className="text-sm text-gray-600">Setup Status</p>
                <p className="font-semibold">
                  {adaptabilityStatus.setup_completed ? 'Complete' : 'In Progress'}
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Zap className="h-8 w-8 text-blue-600" />
                </div>
                <p className="text-sm text-gray-600">Active Features</p>
                <p className="font-semibold">{adaptabilityStatus.active_features.length}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Sliders className="h-8 w-8 text-purple-600" />
                </div>
                <p className="text-sm text-gray-600">Custom Fields</p>
                <p className="font-semibold">{adaptabilityStatus.custom_fields}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Calculator className="h-8 w-8 text-orange-600" />
                </div>
                <p className="text-sm text-gray-600">Pricing Rules</p>
                <p className="font-semibold">{adaptabilityStatus.pricing_rules}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 lg:grid-cols-12 bg-gradient-to-r from-slate-50 to-slate-100">
          <TabsTrigger value="dashboard" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="configuration" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Config</span>
          </TabsTrigger>
          <TabsTrigger value="terminology" className="flex items-center space-x-2">
            <Languages className="h-4 w-4" />
            <span className="hidden sm:inline">Terms</span>
          </TabsTrigger>
          <TabsTrigger value="fields" className="flex items-center space-x-2">
            <Sliders className="h-4 w-4" />
            <span className="hidden sm:inline">Fields</span>
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center space-x-2">
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">Features</span>
          </TabsTrigger>
          <TabsTrigger value="units" className="flex items-center space-x-2">
            <Calculator className="h-4 w-4" />
            <span className="hidden sm:inline">Units</span>
          </TabsTrigger>
          <TabsTrigger value="pricing" className="flex items-center space-x-2">
            <Calculator className="h-4 w-4" />
            <span className="hidden sm:inline">Pricing</span>
          </TabsTrigger>
          <TabsTrigger value="workflows" className="flex items-center space-x-2">
            <Workflow className="h-4 w-4" />
            <span className="hidden sm:inline">Workflows</span>
          </TabsTrigger>
          <TabsTrigger value="migration" className="flex items-center space-x-2">
            <ArrowRight className="h-4 w-4" />
            <span className="hidden sm:inline">Migration</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center space-x-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Templates</span>
          </TabsTrigger>
          <TabsTrigger value="languages" className="flex items-center space-x-2">
            <Languages className="h-4 w-4" />
            <span className="hidden sm:inline">Languages</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab Contents */}
        <TabsContent value="dashboard" className="space-y-6">
          <BusinessConfigurationDashboard />
        </TabsContent>

        <TabsContent value="configuration" className="space-y-6">
          <BusinessConfigurationDashboard />
        </TabsContent>

        <TabsContent value="terminology" className="space-y-6">
          <TerminologyManagement />
        </TabsContent>

        <TabsContent value="fields" className="space-y-6">
          <CustomFieldConfiguration />
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <FeatureToggleDashboard />
        </TabsContent>

        <TabsContent value="units" className="space-y-6">
          <UnitOfMeasureManagement />
        </TabsContent>

        <TabsContent value="pricing" className="space-y-6">
          <PricingModelConfiguration />
        </TabsContent>

        <TabsContent value="workflows" className="space-y-6">
          <WorkflowConfiguration />
        </TabsContent>

        <TabsContent value="migration" className="space-y-6">
          <BusinessMigrationWizard />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <BusinessAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <BusinessTemplateGallery />
        </TabsContent>

        <TabsContent value="languages" className="space-y-6">
          <MultiLanguageSupport />
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      {currentConfiguration && !adaptabilityStatus?.setup_completed && (
        <Card className="border-0 shadow-lg bg-gradient-to-r from-yellow-50 to-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-800">
              <Info className="h-5 w-5 mr-2" />
              Complete Your Setup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-700 mb-4">
              Your business configuration is not complete. Complete the setup to unlock all features.
            </p>
            <Button
              onClick={() => startSetup(currentConfiguration.business_type!)}
              className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white"
            >
              Complete Setup
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BusinessAdaptability;