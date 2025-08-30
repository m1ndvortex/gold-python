/**
 * Business Configuration Dashboard
 * Main dashboard for viewing and managing business configuration
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Settings, 
  Building2, 
  Users, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Calendar,
  Clock,
  DollarSign,
  Languages,
  Edit,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Info,
  Plus,
  Trash2
} from 'lucide-react';
import { useBusinessAdaptability } from '../../hooks/useBusinessAdaptability';
import { BusinessConfiguration, BusinessLocation, Department } from '../../types/businessAdaptability';
import { BusinessInformationForm } from './BusinessInformationForm';
import { OperationalSettingsForm } from './OperationalSettingsForm';
import { LocalizationSettingsForm } from './LocalizationSettingsForm';

export const BusinessConfigurationDashboard: React.FC = () => {
  const {
    currentConfiguration,
    adaptabilityStatus,
    isLoading,
    error,
    updateBusinessConfiguration,
    validateConfiguration,
    exportConfiguration
  } = useBusinessAdaptability();

  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [validationResult, setValidationResult] = useState<any>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading configuration...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          Error loading business configuration: {(error as Error)?.message || 'Unknown error'}
        </AlertDescription>
      </Alert>
    );
  }

  if (!currentConfiguration) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-12 text-center">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Business Configuration</h3>
          <p className="text-gray-600 mb-4">
            You need to set up a business configuration first.
          </p>
          <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Create Configuration
          </Button>
        </CardContent>
      </Card>
    );
  }

  const handleValidateConfiguration = async () => {
    try {
      const result = await validateConfiguration(currentConfiguration.id);
      setValidationResult(result);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleExportConfiguration = async () => {
    try {
      const exportData = await exportConfiguration(currentConfiguration.id);
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `business-config-${currentConfiguration.business_name.replace(/\s+/g, '-').toLowerCase()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Business Configuration</h2>
          <p className="text-gray-600">Manage your business settings and information</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={handleValidateConfiguration}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Validate
          </Button>
          <Button variant="outline" onClick={handleExportConfiguration}>
            <Settings className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            onClick={() => setIsEditing(!isEditing)}
            className={isEditing ? 'bg-red-500 hover:bg-red-600' : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700'}
          >
            {isEditing ? (
              <>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </>
            ) : (
              <>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Business Type</p>
                <p className="font-semibold">{currentConfiguration.business_type?.name || 'Unknown'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                {adaptabilityStatus?.setup_completed ? (
                  <CheckCircle className="h-5 w-5 text-white" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-white" />
                )}
              </div>
              <div>
                <p className="text-sm text-gray-600">Setup Status</p>
                <p className="font-semibold">
                  {adaptabilityStatus?.setup_completed ? 'Complete' : 'Incomplete'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                <Languages className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Languages</p>
                <p className="font-semibold">{currentConfiguration.supported_languages.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Locations</p>
                <p className="font-semibold">{currentConfiguration.business_locations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Validation Results */}
      {validationResult && (
        <Alert className={validationResult.is_valid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          {validationResult.is_valid ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={validationResult.is_valid ? 'text-green-800' : 'text-red-800'}>
            {validationResult.is_valid ? (
              'Configuration is valid and ready for use.'
            ) : (
              <>
                Configuration has issues:
                <ul className="list-disc list-inside mt-2">
                  {validationResult.errors.map((error: string, index: number) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Configuration Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-slate-50 to-slate-100">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <Info className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="business" className="flex items-center space-x-2">
            <Building2 className="h-4 w-4" />
            <span>Business Info</span>
          </TabsTrigger>
          <TabsTrigger value="operational" className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>Operations</span>
          </TabsTrigger>
          <TabsTrigger value="localization" className="flex items-center space-x-2">
            <Languages className="h-4 w-4" />
            <span>Localization</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building2 className="h-5 w-5 mr-2" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Business Name</label>
                  <p className="text-lg font-semibold">{currentConfiguration.business_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Business Type</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="outline">{currentConfiguration.business_type?.name}</Badge>
                    <Badge variant="secondary">{currentConfiguration.business_type?.industry_category}</Badge>
                  </div>
                </div>
                {currentConfiguration.business_address && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Address</label>
                    <p className="text-gray-900">{currentConfiguration.business_address}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  {currentConfiguration.business_phone && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Phone</label>
                      <p className="text-gray-900 flex items-center">
                        <Phone className="h-4 w-4 mr-1" />
                        {currentConfiguration.business_phone}
                      </p>
                    </div>
                  )}
                  {currentConfiguration.business_email && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Email</label>
                      <p className="text-gray-900 flex items-center">
                        <Mail className="h-4 w-4 mr-1" />
                        {currentConfiguration.business_email}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* System Settings */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  System Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Currency</label>
                    <p className="text-gray-900 flex items-center">
                      <DollarSign className="h-4 w-4 mr-1" />
                      {currentConfiguration.currency}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Timezone</label>
                    <p className="text-gray-900 flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {currentConfiguration.timezone}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Date Format</label>
                    <p className="text-gray-900 flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {currentConfiguration.date_format}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Default Language</label>
                    <p className="text-gray-900 flex items-center">
                      <Languages className="h-4 w-4 mr-1" />
                      {currentConfiguration.default_language.toUpperCase()}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Supported Languages</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {currentConfiguration.supported_languages.map(lang => (
                      <Badge key={lang} variant="outline" className="text-xs">
                        {lang.toUpperCase()}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Business Locations */}
          {currentConfiguration.business_locations.length > 0 && (
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Business Locations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentConfiguration.business_locations.map((location, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{location.name}</h4>
                        {location.is_primary && (
                          <Badge variant="default" className="text-xs">Primary</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{location.address}</p>
                      <div className="space-y-1">
                        {location.phone && (
                          <p className="text-sm text-gray-600 flex items-center">
                            <Phone className="h-3 w-3 mr-1" />
                            {location.phone}
                          </p>
                        )}
                        {location.email && (
                          <p className="text-sm text-gray-600 flex items-center">
                            <Mail className="h-3 w-3 mr-1" />
                            {location.email}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Departments */}
          {currentConfiguration.departments.length > 0 && (
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Departments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentConfiguration.departments.map((department, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{department.name}</h4>
                        <Badge variant={department.is_active ? 'default' : 'secondary'} className="text-xs">
                          {department.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      {department.description && (
                        <p className="text-sm text-gray-600 mb-2">{department.description}</p>
                      )}
                      {department.manager && (
                        <p className="text-sm text-gray-600">
                          Manager: {department.manager}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Business Information Tab */}
        <TabsContent value="business" className="space-y-6">
          <BusinessInformationForm
            configuration={currentConfiguration}
            isEditing={isEditing}
            onSave={async (data) => {
              await updateBusinessConfiguration(currentConfiguration.id, data);
              setIsEditing(false);
            }}
          />
        </TabsContent>

        {/* Operational Settings Tab */}
        <TabsContent value="operational" className="space-y-6">
          <OperationalSettingsForm
            configuration={currentConfiguration}
            isEditing={isEditing}
            onSave={async (data) => {
              await updateBusinessConfiguration(currentConfiguration.id, data);
              setIsEditing(false);
            }}
          />
        </TabsContent>

        {/* Localization Settings Tab */}
        <TabsContent value="localization" className="space-y-6">
          <LocalizationSettingsForm
            configuration={currentConfiguration}
            isEditing={isEditing}
            onSave={async (data) => {
              await updateBusinessConfiguration(currentConfiguration.id, data);
              setIsEditing(false);
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BusinessConfigurationDashboard;