/**
 * Business Type Selection Wizard
 * 
 * Industry-specific setup wizard for business type configuration
 * with intelligent business type detection and guided setup.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Checkbox } from '../ui/checkbox';
import { 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle, 
  Sparkles, 
  Building2,
  Lightbulb,
  Target,
  Settings,
  Wand2
} from 'lucide-react';

import {
  BusinessType,
  BusinessTypeConfiguration,
  BusinessTypeDetectionRequest,
  BusinessTypeDetectionResponse,
  BusinessSetupWizardRequest
} from '../../types/businessConfig';
import { businessConfigApi } from '../../services/businessConfigApi';

interface BusinessTypeSelectionWizardProps {
  onComplete: (config: BusinessTypeConfiguration) => void;
  onCancel: () => void;
}

interface BusinessTypeOption {
  type: BusinessType;
  label: string;
  description: string;
  icon: string;
  features: string[];
  industries: string[];
}

const businessTypeOptions: BusinessTypeOption[] = [
  {
    type: BusinessType.GOLD_SHOP,
    label: 'Gold Shop',
    description: 'Jewelry and precious metals business with weight-based calculations',
    icon: '💍',
    features: ['Weight tracking', 'Purity management', 'Gold price calculations', 'Specialized invoicing'],
    industries: ['Jewelry', 'Precious Metals', 'Gold Trading']
  },
  {
    type: BusinessType.RETAIL_STORE,
    label: 'Retail Store',
    description: 'General retail business selling products to consumers',
    icon: '🏪',
    features: ['Product catalog', 'Point of sale', 'Customer management', 'Inventory tracking'],
    industries: ['General Retail', 'Fashion', 'Electronics', 'Home & Garden']
  },
  {
    type: BusinessType.RESTAURANT,
    label: 'Restaurant',
    description: 'Food service business with menu management and table service',
    icon: '🍽️',
    features: ['Menu management', 'Table service', 'Kitchen orders', 'Food cost tracking'],
    industries: ['Food Service', 'Restaurants', 'Cafes', 'Fast Food']
  },
  {
    type: BusinessType.SERVICE_BUSINESS,
    label: 'Service Business',
    description: 'Professional services with time tracking and project management',
    icon: '🔧',
    features: ['Time tracking', 'Service catalog', 'Appointment booking', 'Project management'],
    industries: ['Consulting', 'Repair Services', 'Professional Services', 'Healthcare']
  },
  {
    type: BusinessType.MANUFACTURING,
    label: 'Manufacturing',
    description: 'Production business with bill of materials and production tracking',
    icon: '🏭',
    features: ['Bill of materials', 'Production tracking', 'Component management', 'Quality control'],
    industries: ['Manufacturing', 'Assembly', 'Production', 'Industrial']
  },
  {
    type: BusinessType.WHOLESALE,
    label: 'Wholesale',
    description: 'B2B distribution business with bulk pricing and supplier management',
    icon: '📦',
    features: ['Bulk pricing', 'Supplier management', 'B2B invoicing', 'Distribution tracking'],
    industries: ['Distribution', 'Wholesale', 'Supply Chain', 'B2B Sales']
  },
  {
    type: BusinessType.PHARMACY,
    label: 'Pharmacy',
    description: 'Medical pharmacy with prescription management and drug inventory',
    icon: '💊',
    features: ['Prescription tracking', 'Drug inventory', 'Expiry management', 'Medical compliance'],
    industries: ['Pharmacy', 'Medical', 'Healthcare', 'Pharmaceuticals']
  },
  {
    type: BusinessType.AUTOMOTIVE,
    label: 'Automotive',
    description: 'Auto repair and parts business with vehicle service tracking',
    icon: '🚗',
    features: ['Vehicle tracking', 'Parts inventory', 'Service history', 'Repair management'],
    industries: ['Auto Repair', 'Car Sales', 'Parts Distribution', 'Automotive Services']
  }
];

const commonFeatures = [
  'inventory_management',
  'invoice_management', 
  'customer_management',
  'basic_reporting',
  'multi_language_support',
  'user_management',
  'backup_restore',
  'data_export'
];

export const BusinessTypeSelectionWizard: React.FC<BusinessTypeSelectionWizardProps> = ({
  onComplete,
  onCancel
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Business Description
  const [businessDescription, setBusinessDescription] = useState('');
  const [industry, setIndustry] = useState('');
  const [primaryActivities, setPrimaryActivities] = useState<string[]>([]);
  const [customerTypes, setCustomerTypes] = useState<string[]>([]);

  // Step 2: Detection Results
  const [detectionResult, setDetectionResult] = useState<BusinessTypeDetectionResponse | null>(null);
  const [selectedBusinessType, setSelectedBusinessType] = useState<BusinessType | null>(null);

  // Step 3: Configuration
  const [businessName, setBusinessName] = useState('');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [customTerminology, setCustomTerminology] = useState<Record<string, string>>({});

  const handleDetectBusinessType = async () => {
    if (!businessDescription.trim()) {
      setError('Please provide a business description');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const request: BusinessTypeDetectionRequest = {
        business_description: businessDescription,
        industry: industry || undefined,
        primary_activities: primaryActivities,
        customer_types: customerTypes
      };

      const result = await businessConfigApi.detectBusinessType(request);
      setDetectionResult(result);
      setSelectedBusinessType(result.suggested_business_type);
      setCurrentStep(2);
    } catch (err) {
      console.error('Business type detection failed:', err);
      setError('Failed to detect business type. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSelection = () => {
    setCurrentStep(2);
  };

  const handleBusinessTypeSelect = (businessType: BusinessType) => {
    setSelectedBusinessType(businessType);
    
    // Set default features based on business type
    const businessOption = businessTypeOptions.find(opt => opt.type === businessType);
    if (businessOption) {
      const defaultFeatures = [...commonFeatures];
      setSelectedFeatures(defaultFeatures);
      
      // Set default terminology
      const defaultTerminology: Record<string, string> = {};
      if (businessType === BusinessType.RESTAURANT) {
        defaultTerminology['inventory'] = 'Menu Items';
        defaultTerminology['customer'] = 'Guest';
        defaultTerminology['invoice'] = 'Order';
      } else if (businessType === BusinessType.SERVICE_BUSINESS) {
        defaultTerminology['inventory'] = 'Services';
        defaultTerminology['customer'] = 'Client';
        defaultTerminology['invoice'] = 'Service Invoice';
      } else if (businessType === BusinessType.MANUFACTURING) {
        defaultTerminology['inventory'] = 'Products & Components';
        defaultTerminology['invoice'] = 'Production Order';
      }
      setCustomTerminology(defaultTerminology);
    }
    
    setCurrentStep(3);
  };

  const handleFeatureToggle = (feature: string) => {
    setSelectedFeatures(prev => 
      prev.includes(feature)
        ? prev.filter(f => f !== feature)
        : [...prev, feature]
    );
  };

  const handleTerminologyChange = (standardTerm: string, businessTerm: string) => {
    setCustomTerminology(prev => ({
      ...prev,
      [standardTerm]: businessTerm
    }));
  };

  const handleComplete = async () => {
    if (!selectedBusinessType || !businessName.trim()) {
      setError('Please provide a business name and select a business type');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const setupRequest: BusinessSetupWizardRequest = {
        business_type: selectedBusinessType,
        business_name: businessName,
        industry: industry || undefined,
        features_to_enable: selectedFeatures,
        custom_terminology: Object.keys(customTerminology).length > 0 ? customTerminology : undefined
      };

      const result = await businessConfigApi.setupBusinessWizard(setupRequest);
      onComplete(result);
    } catch (err) {
      console.error('Business setup failed:', err);
      setError('Failed to create business configuration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getSelectedBusinessOption = () => {
    return businessTypeOptions.find(opt => opt.type === selectedBusinessType);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="border-0 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-t-lg">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
              <Wand2 className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl">Business Configuration Wizard</CardTitle>
              <CardDescription className="text-blue-100">
                Set up your business type and configure industry-specific features
              </CardDescription>
            </div>
          </div>
          
          {/* Progress indicator */}
          <div className="flex items-center space-x-2 mt-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep 
                    ? 'bg-white text-blue-600' 
                    : 'bg-white/20 text-white/60'
                }`}>
                  {step < currentStep ? <CheckCircle className="h-4 w-4" /> : step}
                </div>
                {step < 3 && (
                  <div className={`h-1 w-8 mx-2 ${
                    step < currentStep ? 'bg-white' : 'bg-white/20'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {/* Step 1: Business Description */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Lightbulb className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  Tell us about your business
                </h2>
                <p className="text-slate-600">
                  We'll help you choose the best configuration for your business type
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="business-description">Business Description *</Label>
                  <Textarea
                    id="business-description"
                    placeholder="Describe what your business does, what products or services you offer, and who your customers are..."
                    value={businessDescription}
                    onChange={(e) => setBusinessDescription(e.target.value)}
                    rows={4}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="industry">Industry (Optional)</Label>
                  <Input
                    id="industry"
                    placeholder="e.g., Retail, Food Service, Manufacturing"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Primary Activities (Optional)</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {['Sales', 'Services', 'Manufacturing', 'Repair', 'Consulting', 'Food Service', 'Retail'].map((activity) => (
                      <Badge
                        key={activity}
                        variant={primaryActivities.includes(activity) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          setPrimaryActivities(prev =>
                            prev.includes(activity)
                              ? prev.filter(a => a !== activity)
                              : [...prev, activity]
                          );
                        }}
                      >
                        {activity}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Customer Types (Optional)</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {['Individual Consumers', 'Businesses', 'Restaurants', 'Retailers', 'Manufacturers'].map((type) => (
                      <Badge
                        key={type}
                        variant={customerTypes.includes(type) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          setCustomerTypes(prev =>
                            prev.includes(type)
                              ? prev.filter(t => t !== type)
                              : [...prev, type]
                          );
                        }}
                      >
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-6">
                <Button variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
                <div className="space-x-3">
                  <Button variant="outline" onClick={handleManualSelection}>
                    Skip Detection
                  </Button>
                  <Button 
                    onClick={handleDetectBusinessType}
                    disabled={loading || !businessDescription.trim()}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Detecting...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Detect Business Type
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Business Type Selection */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Target className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  Choose your business type
                </h2>
                <p className="text-slate-600">
                  Select the business type that best matches your operations
                </p>
              </div>

              {detectionResult && (
                <Alert className="border-blue-200 bg-blue-50 mb-6">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>AI Suggestion:</strong> Based on your description, we recommend{' '}
                    <strong>{businessTypeOptions.find(opt => opt.type === detectionResult.suggested_business_type)?.label}</strong>{' '}
                    (Confidence: {Math.round(detectionResult.confidence_score * 100)}%)
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {businessTypeOptions.map((option) => (
                  <Card
                    key={option.type}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                      selectedBusinessType === option.type
                        ? 'ring-2 ring-blue-500 bg-blue-50'
                        : 'hover:bg-slate-50'
                    } ${
                      detectionResult?.suggested_business_type === option.type
                        ? 'border-blue-300 shadow-md'
                        : ''
                    }`}
                    onClick={() => setSelectedBusinessType(option.type)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className="text-2xl">{option.icon}</div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-slate-900">{option.label}</h3>
                            {detectionResult?.suggested_business_type === option.type && (
                              <Badge className="bg-blue-100 text-blue-800 text-xs">
                                Recommended
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 mt-1">{option.description}</p>
                          <div className="mt-3">
                            <p className="text-xs font-medium text-slate-700 mb-1">Key Features:</p>
                            <div className="flex flex-wrap gap-1">
                              {option.features.slice(0, 3).map((feature) => (
                                <Badge key={feature} variant="secondary" className="text-xs">
                                  {feature}
                                </Badge>
                              ))}
                              {option.features.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{option.features.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex justify-between pt-6">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button 
                  onClick={() => selectedBusinessType && handleBusinessTypeSelect(selectedBusinessType)}
                  disabled={!selectedBusinessType}
                >
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Configuration */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Settings className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  Configure your business
                </h2>
                <p className="text-slate-600">
                  Customize features and terminology for your {getSelectedBusinessOption()?.label}
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <Label htmlFor="business-name">Business Name *</Label>
                  <Input
                    id="business-name"
                    placeholder="Enter your business name"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Features to Enable</Label>
                  <div className="mt-3 space-y-3">
                    {commonFeatures.map((feature) => (
                      <div key={feature} className="flex items-center space-x-2">
                        <Checkbox
                          id={feature}
                          checked={selectedFeatures.includes(feature)}
                          onCheckedChange={() => handleFeatureToggle(feature)}
                        />
                        <Label htmlFor={feature} className="text-sm">
                          {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {Object.keys(customTerminology).length > 0 && (
                  <div>
                    <Label>Custom Terminology</Label>
                    <p className="text-sm text-slate-600 mb-3">
                      Customize how terms are displayed in your business
                    </p>
                    <div className="space-y-3">
                      {Object.entries(customTerminology).map(([standardTerm, businessTerm]) => (
                        <div key={standardTerm} className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs text-slate-500">Standard Term</Label>
                            <Input value={standardTerm} disabled className="text-sm" />
                          </div>
                          <div>
                            <Label className="text-xs text-slate-500">Your Term</Label>
                            <Input
                              value={businessTerm}
                              onChange={(e) => handleTerminologyChange(standardTerm, e.target.value)}
                              placeholder={`Your term for ${standardTerm}`}
                              className="text-sm"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between pt-6">
                <Button variant="outline" onClick={() => setCurrentStep(2)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button 
                  onClick={handleComplete}
                  disabled={loading || !businessName.trim()}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Complete Setup
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};