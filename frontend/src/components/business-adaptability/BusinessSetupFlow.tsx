/**
 * Business Setup Flow
 * Multi-step wizard for setting up a new business configuration
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Progress } from '../ui/progress';
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  Building2, 
  Settings, 
  Languages, 
  DollarSign,
  Clock,
  MapPin,
  Users,
  Zap,
  Save,
  AlertCircle
} from 'lucide-react';
import { BusinessType, BusinessConfigurationCreateRequest, SetupStep } from '../../types/businessAdaptability';
import { useBusinessAdaptability } from '../../hooks/useBusinessAdaptability';

interface BusinessSetupFlowProps {
  businessType: BusinessType;
  currentStep: number;
  onComplete: () => void;
  onCancel: () => void;
}

const setupSteps: SetupStep[] = [
  {
    id: 'basic',
    title: 'Basic Information',
    description: 'Enter your business name and basic details',
    component: 'BasicInformation',
    isCompleted: false,
    isActive: true,
    isOptional: false,
    dependencies: []
  },
  {
    id: 'localization',
    title: 'Localization Settings',
    description: 'Configure language, currency, and regional settings',
    component: 'LocalizationSettings',
    isCompleted: false,
    isActive: false,
    isOptional: false,
    dependencies: ['basic']
  },
  {
    id: 'features',
    title: 'Feature Selection',
    description: 'Choose which features to enable for your business',
    component: 'FeatureSelection',
    isCompleted: false,
    isActive: false,
    isOptional: false,
    dependencies: ['basic', 'localization']
  },
  {
    id: 'terminology',
    title: 'Terminology Customization',
    description: 'Customize business-specific terms and labels',
    component: 'TerminologyCustomization',
    isCompleted: false,
    isActive: false,
    isOptional: true,
    dependencies: ['basic', 'localization', 'features']
  },
  {
    id: 'locations',
    title: 'Business Locations',
    description: 'Add your business locations and departments',
    component: 'BusinessLocations',
    isCompleted: false,
    isActive: false,
    isOptional: true,
    dependencies: ['basic']
  },
  {
    id: 'review',
    title: 'Review & Complete',
    description: 'Review your configuration and complete setup',
    component: 'ReviewAndComplete',
    isCompleted: false,
    isActive: false,
    isOptional: false,
    dependencies: ['basic', 'localization', 'features']
  }
];

export const BusinessSetupFlow: React.FC<BusinessSetupFlowProps> = ({
  businessType,
  currentStep,
  onComplete,
  onCancel
}) => {
  const { createBusinessConfiguration, nextSetupStep, previousSetupStep } = useBusinessAdaptability();
  
  const [formData, setFormData] = useState<BusinessConfigurationCreateRequest>({
    business_type_id: businessType.id,
    business_name: '',
    configuration: businessType.default_configuration || {},
    terminology_mapping: businessType.default_terminology || {},
    workflow_config: businessType.default_workflow_config || {},
    feature_flags: businessType.default_feature_flags || {},
    units_of_measure: businessType.default_units || [],
    pricing_models: businessType.default_pricing_models || [],
    default_language: 'en',
    supported_languages: ['en'],
    currency: 'USD',
    timezone: 'UTC',
    date_format: 'YYYY-MM-DD',
    business_locations: [],
    departments: []
  });

  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentStepData = setupSteps[currentStep];
  const progress = ((currentStep + 1) / setupSteps.length) * 100;

  const updateFormData = (updates: Partial<BusinessConfigurationCreateRequest>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const markStepCompleted = (stepId: string) => {
    setCompletedSteps(prev => new Set([...prev, stepId]));
  };

  const canProceedToNext = () => {
    const step = setupSteps[currentStep];
    if (step.isOptional) return true;
    
    switch (step.id) {
      case 'basic':
        return formData.business_name.trim().length > 0;
      case 'localization':
        return formData.currency && formData.timezone && formData.default_language;
      case 'features':
        return true; // Features are optional
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (canProceedToNext()) {
      markStepCompleted(currentStepData.id);
      if (currentStep < setupSteps.length - 1) {
        nextSetupStep();
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      previousSetupStep();
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const configuration = await createBusinessConfiguration(formData);
      markStepCompleted('review');
      onComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to create business configuration');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStepData.id) {
      case 'basic':
        return (
          <BasicInformationStep
            formData={formData}
            businessType={businessType}
            onUpdate={updateFormData}
          />
        );
      case 'localization':
        return (
          <LocalizationSettingsStep
            formData={formData}
            onUpdate={updateFormData}
          />
        );
      case 'features':
        return (
          <FeatureSelectionStep
            formData={formData}
            businessType={businessType}
            onUpdate={updateFormData}
          />
        );
      case 'terminology':
        return (
          <TerminologyCustomizationStep
            formData={formData}
            businessType={businessType}
            onUpdate={updateFormData}
          />
        );
      case 'locations':
        return (
          <BusinessLocationsStep
            formData={formData}
            onUpdate={updateFormData}
          />
        );
      case 'review':
        return (
          <ReviewAndCompleteStep
            formData={formData}
            businessType={businessType}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center mb-4">
          <div 
            className="h-16 w-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${businessType.color}20` }}
          >
            <Building2 className="h-8 w-8" style={{ color: businessType.color }} />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Setup {businessType.name}</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Let's configure your {businessType.name.toLowerCase()} business with the right settings and features.
        </p>
      </div>

      {/* Progress */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">
                Step {currentStep + 1} of {setupSteps.length}
              </span>
              <span className="text-sm font-medium text-gray-600">
                {Math.round(progress)}% Complete
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex items-center justify-between text-xs text-gray-500">
              {setupSteps.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex items-center space-x-1 ${
                    index === currentStep ? 'text-blue-600 font-medium' : 
                    completedSteps.has(step.id) ? 'text-green-600' : 'text-gray-400'
                  }`}
                >
                  {completedSteps.has(step.id) ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : index === currentStep ? (
                    <div className="h-3 w-3 rounded-full bg-blue-600"></div>
                  ) : (
                    <div className="h-3 w-3 rounded-full bg-gray-300"></div>
                  )}
                  <span className="hidden sm:inline">{step.title}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Step */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            {getStepIcon(currentStepData.id)}
            <span className="ml-2">{currentStepData.title}</span>
            {currentStepData.isOptional && (
              <Badge variant="secondary" className="ml-2">Optional</Badge>
            )}
          </CardTitle>
          <p className="text-gray-600">{currentStepData.description}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}
          
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={onCancel}>
            Cancel Setup
          </Button>
          {currentStep > 0 && (
            <Button variant="outline" onClick={handlePrevious}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          {currentStep < setupSteps.length - 1 ? (
            <Button
              onClick={handleNext}
              disabled={!canProceedToNext()}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
            >
              Next Step
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={!canProceedToNext() || isSubmitting}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Complete Setup
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper function to get step icons
const getStepIcon = (stepId: string) => {
  const iconMap: Record<string, React.ComponentType<any>> = {
    basic: Building2,
    localization: Languages,
    features: Zap,
    terminology: Settings,
    locations: MapPin,
    review: CheckCircle
  };
  
  const IconComponent = iconMap[stepId] || Settings;
  return <IconComponent className="h-5 w-5" />;
};

// Step Components
const BasicInformationStep: React.FC<{
  formData: BusinessConfigurationCreateRequest;
  businessType: BusinessType;
  onUpdate: (updates: Partial<BusinessConfigurationCreateRequest>) => void;
}> = ({ formData, businessType, onUpdate }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <Label htmlFor="business_name">Business Name *</Label>
        <Input
          id="business_name"
          value={formData.business_name}
          onChange={(e) => onUpdate({ business_name: e.target.value })}
          placeholder="Enter your business name"
          className="text-lg"
        />
      </div>
      <div className="space-y-2">
        <Label>Business Type</Label>
        <div className="flex items-center space-x-2 p-3 border rounded-lg bg-gray-50">
          <div 
            className="h-8 w-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${businessType.color}20` }}
          >
            <Building2 className="h-4 w-4" style={{ color: businessType.color }} />
          </div>
          <span className="font-medium">{businessType.name}</span>
        </div>
      </div>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <Label htmlFor="business_address">Business Address</Label>
        <Textarea
          id="business_address"
          value={formData.business_address || ''}
          onChange={(e) => onUpdate({ business_address: e.target.value })}
          placeholder="Enter your business address"
          rows={3}
        />
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="business_phone">Phone Number</Label>
          <Input
            id="business_phone"
            value={formData.business_phone || ''}
            onChange={(e) => onUpdate({ business_phone: e.target.value })}
            placeholder="Enter phone number"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="business_email">Email Address</Label>
          <Input
            id="business_email"
            type="email"
            value={formData.business_email || ''}
            onChange={(e) => onUpdate({ business_email: e.target.value })}
            placeholder="Enter email address"
          />
        </div>
      </div>
    </div>
  </div>
);

const LocalizationSettingsStep: React.FC<{
  formData: BusinessConfigurationCreateRequest;
  onUpdate: (updates: Partial<BusinessConfigurationCreateRequest>) => void;
}> = ({ formData, onUpdate }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <Label htmlFor="currency">Currency *</Label>
        <Select value={formData.currency} onValueChange={(value) => onUpdate({ currency: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select currency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="USD">USD - US Dollar</SelectItem>
            <SelectItem value="EUR">EUR - Euro</SelectItem>
            <SelectItem value="GBP">GBP - British Pound</SelectItem>
            <SelectItem value="IRR">IRR - Iranian Rial</SelectItem>
            <SelectItem value="AED">AED - UAE Dirham</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="timezone">Timezone *</Label>
        <Select value={formData.timezone} onValueChange={(value) => onUpdate({ timezone: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select timezone" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="UTC">UTC - Coordinated Universal Time</SelectItem>
            <SelectItem value="America/New_York">Eastern Time (US)</SelectItem>
            <SelectItem value="Europe/London">London Time</SelectItem>
            <SelectItem value="Asia/Tehran">Tehran Time</SelectItem>
            <SelectItem value="Asia/Dubai">Dubai Time</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <Label htmlFor="default_language">Default Language *</Label>
        <Select value={formData.default_language} onValueChange={(value) => onUpdate({ default_language: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="fa">Persian (Farsi)</SelectItem>
            <SelectItem value="ar">Arabic</SelectItem>
            <SelectItem value="es">Spanish</SelectItem>
            <SelectItem value="fr">French</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="date_format">Date Format</Label>
        <Select value={formData.date_format} onValueChange={(value) => onUpdate({ date_format: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select date format" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (2024-01-15)</SelectItem>
            <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (01/15/2024)</SelectItem>
            <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (15/01/2024)</SelectItem>
            <SelectItem value="DD-MM-YYYY">DD-MM-YYYY (15-01-2024)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  </div>
);

const FeatureSelectionStep: React.FC<{
  formData: BusinessConfigurationCreateRequest;
  businessType: BusinessType;
  onUpdate: (updates: Partial<BusinessConfigurationCreateRequest>) => void;
}> = ({ formData, businessType, onUpdate }) => {
  const availableFeatures = [
    { key: 'inventory_management', name: 'Inventory Management', description: 'Track stock levels and manage products' },
    { key: 'invoice_generation', name: 'Invoice Generation', description: 'Create and manage invoices' },
    { key: 'customer_management', name: 'Customer Management', description: 'Manage customer information and relationships' },
    { key: 'reporting_analytics', name: 'Reporting & Analytics', description: 'Generate reports and analyze business data' },
    { key: 'multi_location', name: 'Multi-Location Support', description: 'Manage multiple business locations' },
    { key: 'barcode_scanning', name: 'Barcode Scanning', description: 'Scan barcodes for inventory management' },
    { key: 'qr_codes', name: 'QR Code Generation', description: 'Generate QR codes for products and invoices' },
    { key: 'accounting_integration', name: 'Accounting Integration', description: 'Double-entry accounting system' }
  ];

  const toggleFeature = (featureKey: string, enabled: boolean) => {
    onUpdate({
      feature_flags: {
        ...formData.feature_flags,
        [featureKey]: enabled
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-gray-600">
          Select the features you want to enable for your {businessType.name.toLowerCase()} business.
          You can always change these settings later.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {availableFeatures.map(feature => (
          <Card
            key={feature.key}
            className={`cursor-pointer transition-all duration-200 border-2 ${
              formData.feature_flags?.[feature.key]
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300'
            }`}
            onClick={() => toggleFeature(feature.key, !formData.feature_flags?.[feature.key])}
          >
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  {formData.feature_flags?.[feature.key] ? (
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-gray-300"></div>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{feature.name}</h4>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

const TerminologyCustomizationStep: React.FC<{
  formData: BusinessConfigurationCreateRequest;
  businessType: BusinessType;
  onUpdate: (updates: Partial<BusinessConfigurationCreateRequest>) => void;
}> = ({ formData, businessType, onUpdate }) => (
  <div className="space-y-6">
    <div className="text-center">
      <p className="text-gray-600">
        Customize the terminology used throughout the system to match your business language.
        This step is optional - you can use the default terms.
      </p>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {Object.entries(businessType.default_terminology || {}).map(([key, defaultValue]) => (
        <div key={key} className="space-y-2">
          <Label htmlFor={key}>
            {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </Label>
          <Input
            id={key}
            value={formData.terminology_mapping?.[key] || defaultValue}
            onChange={(e) => onUpdate({
              terminology_mapping: {
                ...formData.terminology_mapping,
                [key]: e.target.value
              }
            })}
            placeholder={defaultValue}
          />
        </div>
      ))}
    </div>
  </div>
);

const BusinessLocationsStep: React.FC<{
  formData: BusinessConfigurationCreateRequest;
  onUpdate: (updates: Partial<BusinessConfigurationCreateRequest>) => void;
}> = ({ formData, onUpdate }) => (
  <div className="space-y-6">
    <div className="text-center">
      <p className="text-gray-600">
        Add your business locations and departments. This step is optional but helps organize your business structure.
      </p>
    </div>
    
    <div className="text-center text-gray-500">
      <MapPin className="h-12 w-12 mx-auto mb-4" />
      <p>Location and department management will be available after setup completion.</p>
    </div>
  </div>
);

const ReviewAndCompleteStep: React.FC<{
  formData: BusinessConfigurationCreateRequest;
  businessType: BusinessType;
}> = ({ formData, businessType }) => (
  <div className="space-y-6">
    <div className="text-center">
      <p className="text-gray-600">
        Review your configuration before completing the setup.
      </p>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Business Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <span className="text-sm text-gray-600">Name:</span>
            <p className="font-medium">{formData.business_name}</p>
          </div>
          <div>
            <span className="text-sm text-gray-600">Type:</span>
            <p className="font-medium">{businessType.name}</p>
          </div>
          {formData.business_address && (
            <div>
              <span className="text-sm text-gray-600">Address:</span>
              <p className="font-medium">{formData.business_address}</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">System Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <span className="text-sm text-gray-600">Currency:</span>
            <p className="font-medium">{formData.currency}</p>
          </div>
          <div>
            <span className="text-sm text-gray-600">Language:</span>
            <p className="font-medium">{formData.default_language.toUpperCase()}</p>
          </div>
          <div>
            <span className="text-sm text-gray-600">Timezone:</span>
            <p className="font-medium">{formData.timezone}</p>
          </div>
        </CardContent>
      </Card>
    </div>
    
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Enabled Features</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {Object.entries(formData.feature_flags || {})
            .filter(([_, enabled]) => enabled)
            .map(([feature, _]) => (
              <Badge key={feature} variant="default">
                {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
            ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

export default BusinessSetupFlow;