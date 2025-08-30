/**
 * Business Type Selection Wizard
 * Visual wizard for selecting business type with cards showing different business types
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Search, 
  Building2, 
  Store, 
  Utensils, 
  Car, 
  Heart, 
  GraduationCap, 
  Home, 
  Wrench,
  ShoppingCart,
  Stethoscope,
  Briefcase,
  ArrowRight,
  Star,
  CheckCircle,
  Info
} from 'lucide-react';
import { BusinessType, BusinessTypeCategory } from '../../types/businessAdaptability';

interface BusinessTypeSelectionWizardProps {
  businessTypes: BusinessType[];
  onSelect: (businessType: BusinessType) => void;
  onCancel: () => void;
}

const businessTypeIcons: Record<BusinessTypeCategory, React.ComponentType<any>> = {
  [BusinessTypeCategory.RETAIL]: Store,
  [BusinessTypeCategory.RESTAURANT]: Utensils,
  [BusinessTypeCategory.AUTOMOTIVE]: Car,
  [BusinessTypeCategory.HEALTHCARE]: Heart,
  [BusinessTypeCategory.EDUCATION]: GraduationCap,
  [BusinessTypeCategory.REAL_ESTATE]: Home,
  [BusinessTypeCategory.SERVICE]: Wrench,
  [BusinessTypeCategory.MANUFACTURING]: Building2,
  [BusinessTypeCategory.OTHER]: Briefcase
};

export const BusinessTypeSelectionWizard: React.FC<BusinessTypeSelectionWizardProps> = ({
  businessTypes,
  onSelect,
  onCancel
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<BusinessTypeCategory | 'all'>('all');
  const [selectedType, setSelectedType] = useState<BusinessType | null>(null);

  // Filter business types based on search and category
  const filteredBusinessTypes = useMemo(() => {
    return businessTypes.filter(type => {
      const matchesSearch = type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           type.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           type.type_code.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || type.industry_category === selectedCategory;
      
      return matchesSearch && matchesCategory && type.is_active;
    });
  }, [businessTypes, searchTerm, selectedCategory]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = Array.from(new Set(businessTypes.map(type => type.industry_category).filter(Boolean)));
    return cats as BusinessTypeCategory[];
  }, [businessTypes]);

  // Get recommended business types (popular ones)
  const recommendedTypes = useMemo(() => {
    return filteredBusinessTypes.filter(type => 
      ['jewelry', 'retail', 'restaurant', 'pharmacy', 'automotive'].includes(type.type_code)
    ).slice(0, 3);
  }, [filteredBusinessTypes]);

  const handleSelectType = (businessType: BusinessType) => {
    setSelectedType(businessType);
  };

  const handleConfirmSelection = () => {
    if (selectedType) {
      onSelect(selectedType);
    }
  };

  const getBusinessTypeIcon = (type: BusinessType) => {
    const IconComponent = type.industry_category ? 
      businessTypeIcons[type.industry_category] : 
      businessTypeIcons[BusinessTypeCategory.OTHER];
    return IconComponent;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center mb-4">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Building2 className="h-8 w-8 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Choose Your Business Type</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Select the business type that best matches your industry. This will configure the system 
          with appropriate features, terminology, and workflows for your business.
        </p>
      </div>

      {/* Search and Filters */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search business types..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('all')}
                className={selectedCategory === 'all' ? 'bg-gradient-to-r from-blue-500 to-indigo-600' : ''}
              >
                All Categories
              </Button>
              {categories.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={selectedCategory === category ? 'bg-gradient-to-r from-blue-500 to-indigo-600' : ''}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommended Business Types */}
      {recommendedTypes.length > 0 && searchTerm === '' && selectedCategory === 'all' && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Star className="h-5 w-5 text-yellow-500" />
            <h2 className="text-xl font-semibold text-gray-900">Recommended for You</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendedTypes.map(type => {
              const IconComponent = getBusinessTypeIcon(type);
              return (
                <Card
                  key={type.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
                    selectedType?.id === type.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => handleSelectType(type)}
                >
                  <CardContent className="p-6 text-center">
                    <div className="flex items-center justify-center mb-4">
                      <div 
                        className="h-12 w-12 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${type.color}20` }}
                      >
                        <IconComponent className="h-6 w-6" style={{ color: type.color }} />
                      </div>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{type.name}</h3>
                    <p className="text-sm text-gray-600 mb-3">{type.description}</p>
                    <Badge variant="secondary" className="mb-2">
                      {type.industry_category?.replace('_', ' ')}
                    </Badge>
                    {selectedType?.id === type.id && (
                      <div className="flex items-center justify-center mt-3">
                        <CheckCircle className="h-5 w-5 text-blue-600" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* All Business Types */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">
          {searchTerm || selectedCategory !== 'all' ? 'Search Results' : 'All Business Types'}
          <span className="text-sm font-normal text-gray-500 ml-2">
            ({filteredBusinessTypes.length} types)
          </span>
        </h2>
        
        {filteredBusinessTypes.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <div className="text-gray-400 mb-4">
                <Search className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No business types found</h3>
              <p className="text-gray-600">
                Try adjusting your search terms or category filter.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredBusinessTypes.map(type => {
              const IconComponent = getBusinessTypeIcon(type);
              return (
                <Card
                  key={type.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
                    selectedType?.id === type.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => handleSelectType(type)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div 
                        className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${type.color}20` }}
                      >
                        <IconComponent className="h-5 w-5" style={{ color: type.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{type.name}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">{type.description}</p>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            {type.industry_category?.replace('_', ' ')}
                          </Badge>
                          {selectedType?.id === type.id && (
                            <CheckCircle className="h-4 w-4 text-blue-600" />
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Selection Info */}
      {selectedType && (
        <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <Info className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-2">Selected: {selectedType.name}</h3>
                <p className="text-blue-800 mb-4">{selectedType.description}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge className="bg-blue-100 text-blue-800">
                    {selectedType.industry_category?.replace('_', ' ')}
                  </Badge>
                  {selectedType.default_feature_flags && Object.keys(selectedType.default_feature_flags).length > 0 && (
                    <Badge className="bg-green-100 text-green-800">
                      {Object.keys(selectedType.default_feature_flags).length} Default Features
                    </Badge>
                  )}
                  {selectedType.default_units && selectedType.default_units.length > 0 && (
                    <Badge className="bg-purple-100 text-purple-800">
                      {selectedType.default_units.length} Units of Measure
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-blue-700">
                  This will configure the system with appropriate terminology, features, and workflows for your business type.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirmSelection}
          disabled={!selectedType}
          className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
        >
          Continue with {selectedType?.name || 'Selected Type'}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default BusinessTypeSelectionWizard;