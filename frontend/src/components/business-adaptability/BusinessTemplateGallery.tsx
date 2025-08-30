/**
 * Business Template Gallery Component
 * Placeholder component for business templates
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Building2 } from 'lucide-react';

export const BusinessTemplateGallery: React.FC = () => {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Building2 className="h-5 w-5 mr-2" />
          Business Template Gallery
        </CardTitle>
      </CardHeader>
      <CardContent className="p-12 text-center">
        <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Template Gallery</h3>
        <p className="text-gray-600">
          Business template gallery will be implemented here.
        </p>
      </CardContent>
    </Card>
  );
};

export default BusinessTemplateGallery;