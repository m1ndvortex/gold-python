/**
 * Multi-Language Support Component
 * Placeholder component for multi-language support
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Languages } from 'lucide-react';

export const MultiLanguageSupport: React.FC = () => {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Languages className="h-5 w-5 mr-2" />
          Multi-Language Support
        </CardTitle>
      </CardHeader>
      <CardContent className="p-12 text-center">
        <Languages className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Language Support</h3>
        <p className="text-gray-600">
          Multi-language support interface will be implemented here.
        </p>
      </CardContent>
    </Card>
  );
};

export default MultiLanguageSupport;