/**
 * Business Information Form Component
 * Form for editing business information
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Building2, Save } from 'lucide-react';
import { BusinessConfiguration, BusinessConfigurationCreateRequest } from '../../types/businessAdaptability';

interface BusinessInformationFormProps {
  configuration: BusinessConfiguration;
  isEditing: boolean;
  onSave: (data: Partial<BusinessConfigurationCreateRequest>) => Promise<void>;
}

export const BusinessInformationForm: React.FC<BusinessInformationFormProps> = ({
  configuration,
  isEditing,
  onSave
}) => {
  const [formData, setFormData] = useState({
    business_name: configuration.business_name,
    business_address: configuration.business_address || '',
    business_phone: configuration.business_phone || '',
    business_email: configuration.business_email || '',
    business_website: configuration.business_website || '',
    tax_id: configuration.tax_id || '',
    registration_number: configuration.registration_number || ''
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(formData);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Building2 className="h-5 w-5 mr-2" />
          Business Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="business_name">Business Name *</Label>
              {isEditing ? (
                <Input
                  id="business_name"
                  value={formData.business_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
                  required
                />
              ) : (
                <p className="text-gray-900 p-2">{formData.business_name}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="business_email">Email Address</Label>
              {isEditing ? (
                <Input
                  id="business_email"
                  type="email"
                  value={formData.business_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, business_email: e.target.value }))}
                />
              ) : (
                <p className="text-gray-900 p-2">{formData.business_email || 'Not provided'}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="business_address">Business Address</Label>
            {isEditing ? (
              <Textarea
                id="business_address"
                value={formData.business_address}
                onChange={(e) => setFormData(prev => ({ ...prev, business_address: e.target.value }))}
                rows={3}
              />
            ) : (
              <p className="text-gray-900 p-2">{formData.business_address || 'Not provided'}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="business_phone">Phone Number</Label>
              {isEditing ? (
                <Input
                  id="business_phone"
                  value={formData.business_phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, business_phone: e.target.value }))}
                />
              ) : (
                <p className="text-gray-900 p-2">{formData.business_phone || 'Not provided'}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="business_website">Website</Label>
              {isEditing ? (
                <Input
                  id="business_website"
                  type="url"
                  value={formData.business_website}
                  onChange={(e) => setFormData(prev => ({ ...prev, business_website: e.target.value }))}
                />
              ) : (
                <p className="text-gray-900 p-2">{formData.business_website || 'Not provided'}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="tax_id">Tax ID</Label>
              {isEditing ? (
                <Input
                  id="tax_id"
                  value={formData.tax_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, tax_id: e.target.value }))}
                />
              ) : (
                <p className="text-gray-900 p-2">{formData.tax_id || 'Not provided'}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="registration_number">Registration Number</Label>
              {isEditing ? (
                <Input
                  id="registration_number"
                  value={formData.registration_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, registration_number: e.target.value }))}
                />
              ) : (
                <p className="text-gray-900 p-2">{formData.registration_number || 'Not provided'}</p>
              )}
            </div>
          </div>

          {isEditing && (
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
};

export default BusinessInformationForm;