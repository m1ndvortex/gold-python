/**
 * Business Analytics Dashboard Component
 * Placeholder component for business analytics
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { BarChart3 } from 'lucide-react';

export const BusinessAnalyticsDashboard: React.FC = () => {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center">
          <BarChart3 className="h-5 w-5 mr-2" />
          Business Analytics Dashboard
        </CardTitle>
      </CardHeader>
      <CardContent className="p-12 text-center">
        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics Dashboard</h3>
        <p className="text-gray-600">
          Business analytics dashboard will be implemented here.
        </p>
      </CardContent>
    </Card>
  );
};

export default BusinessAnalyticsDashboard;