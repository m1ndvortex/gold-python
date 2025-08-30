/**
 * Localization Settings Form Component
 * Placeholder form for localization settings
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Languages } from 'lucide-react';
import { BusinessConfiguration, BusinessConfigurationCreateRequest } from '../../types/businessAdaptability';

interface LocalizationSettingsFormProps {
  configuration: BusinessConfiguration;
  isEditing: boolean;
  onSave: (data: Partial<BusinessConfigurationCreateRequest>) => Promise<void>;
}

export const LocalizationSettingsForm: React.FC<LocalizationSettingsFormProps> = ({
  configuration,
  isEditing,
  onSave
}) => {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Languages className="h-5 w-5 mr-2" />
          Localization Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="p-12 text-center">
        <Languages className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Localization Settings</h3>
        <p className="text-gray-600">
          Localization settings form will be implemented here.
        </p>
      </CardContent>
    </Card>
  );
};

export default LocalizationSettingsForm;