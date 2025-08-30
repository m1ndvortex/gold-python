/**
 * Operational Settings Form Component
 * Placeholder form for operational settings
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Clock } from 'lucide-react';
import { BusinessConfiguration, BusinessConfigurationCreateRequest } from '../../types/businessAdaptability';

interface OperationalSettingsFormProps {
  configuration: BusinessConfiguration;
  isEditing: boolean;
  onSave: (data: Partial<BusinessConfigurationCreateRequest>) => Promise<void>;
}

export const OperationalSettingsForm: React.FC<OperationalSettingsFormProps> = ({
  configuration,
  isEditing,
  onSave
}) => {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="h-5 w-5 mr-2" />
          Operational Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="p-12 text-center">
        <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Operational Settings</h3>
        <p className="text-gray-600">
          Operational settings form will be implemented here.
        </p>
      </CardContent>
    </Card>
  );
};

export default OperationalSettingsForm;