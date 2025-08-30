/**
 * Business Migration Wizard Component
 * Placeholder component for business type migration
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ArrowRight } from 'lucide-react';

export const BusinessMigrationWizard: React.FC = () => {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center">
          <ArrowRight className="h-5 w-5 mr-2" />
          Business Migration Wizard
        </CardTitle>
      </CardHeader>
      <CardContent className="p-12 text-center">
        <ArrowRight className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Business Migration</h3>
        <p className="text-gray-600">
          Business migration wizard will be implemented here.
        </p>
      </CardContent>
    </Card>
  );
};

export default BusinessMigrationWizard;