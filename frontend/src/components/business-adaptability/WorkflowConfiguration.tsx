/**
 * Workflow Configuration Component
 * Placeholder component for workflow configuration
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Workflow } from 'lucide-react';

export const WorkflowConfiguration: React.FC = () => {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Workflow className="h-5 w-5 mr-2" />
          Workflow Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="p-12 text-center">
        <Workflow className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Workflow Configuration</h3>
        <p className="text-gray-600">
          Workflow configuration interface will be implemented here.
        </p>
      </CardContent>
    </Card>
  );
};

export default WorkflowConfiguration;