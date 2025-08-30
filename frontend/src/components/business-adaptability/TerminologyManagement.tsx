/**
 * Terminology Management Component
 * Interface for managing business-specific terminology and translations
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Languages, 
  Search, 
  Plus, 
  Edit, 
  Save, 
  X, 
  CheckCircle, 
  AlertCircle,
  Globe,
  BookOpen,
  Download,
  Upload
} from 'lucide-react';
import { useBusinessAdaptability } from '../../hooks/useBusinessAdaptability';

interface TerminologyEntry {
  key: string;
  defaultValue: string;
  customValue: string;
  category: string;
  description?: string;
  isModified: boolean;
}

export const TerminologyManagement: React.FC = () => {
  const {
    currentConfiguration,
    terminologyMapping,
    updateTerminology,
    isLoading,
    error
  } = useBusinessAdaptability();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingTerms, setEditingTerms] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newTermKey, setNewTermKey] = useState('');
  const [newTermValue, setNewTermValue] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Convert terminology mapping to structured entries
  const terminologyEntries: TerminologyEntry[] = React.useMemo(() => {
    if (!currentConfiguration?.business_type?.default_terminology || !terminologyMapping) {
      return [];
    }

    const defaultTerms = currentConfiguration.business_type.default_terminology;
    const customTerms = terminologyMapping as Record<string, string>;

    return Object.entries(defaultTerms).map(([key, defaultValue]) => ({
      key,
      defaultValue: defaultValue as string,
      customValue: customTerms[key] || defaultValue as string,
      category: getCategoryFromKey(key),
      isModified: customTerms[key] !== undefined && customTerms[key] !== defaultValue
    }));
  }, [currentConfiguration, terminologyMapping]);

  // Filter entries based on search and category
  const filteredEntries = React.useMemo(() => {
    return terminologyEntries.filter(entry => {
      const matchesSearch = entry.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           entry.defaultValue.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           entry.customValue.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || entry.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [terminologyEntries, searchTerm, selectedCategory]);

  // Get unique categories
  const categories = React.useMemo(() => {
    const cats = Array.from(new Set(terminologyEntries.map(entry => entry.category)));
    return cats.sort();
  }, [terminologyEntries]);

  const handleEditTerm = (key: string, value: string) => {
    setEditingTerms(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveChanges = async () => {
    if (!currentConfiguration) return;

    setIsSaving(true);
    try {
      await updateTerminology(currentConfiguration.id, editingTerms);
      setEditingTerms({});
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save terminology changes:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddNewTerm = async () => {
    if (!currentConfiguration || !newTermKey.trim() || !newTermValue.trim()) return;

    try {
      await updateTerminology(currentConfiguration.id, {
        [newTermKey.trim()]: newTermValue.trim()
      });
      setNewTermKey('');
      setNewTermValue('');
      setShowAddForm(false);
    } catch (error) {
      console.error('Failed to add new term:', error);
    }
  };

  const handleResetTerm = async (key: string) => {
    if (!currentConfiguration) return;

    const defaultValue = currentConfiguration.business_type?.default_terminology?.[key];
    if (defaultValue) {
      await updateTerminology(currentConfiguration.id, { [key]: defaultValue });
    }
  };

  const handleExportTerminology = () => {
    const exportData = {
      business_type: currentConfiguration?.business_type?.name,
      terminology: terminologyMapping,
      exported_at: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `terminology-${currentConfiguration?.business_name.replace(/\s+/g, '-').toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading terminology...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          Error loading terminology: {(error as Error)?.message || 'Unknown error'}
        </AlertDescription>
      </Alert>
    );
  }

  if (!currentConfiguration) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-12 text-center">
          <Languages className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Business Configuration</h3>
          <p className="text-gray-600">
            You need to set up a business configuration first to manage terminology.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Terminology Management</h2>
          <p className="text-gray-600">Customize business-specific terms and labels</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={handleExportTerminology}>
            <Download className="h-4 w-4 mr-2" />
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
                Edit Terms
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Terms</p>
                <p className="font-semibold">{terminologyEntries.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                <Edit className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Modified</p>
                <p className="font-semibold">
                  {terminologyEntries.filter(entry => entry.isModified).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                <Globe className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Categories</p>
                <p className="font-semibold">{categories.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                <Languages className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Language</p>
                <p className="font-semibold">{currentConfiguration.default_language.toUpperCase()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search terms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
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
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add New Term */}
      {showAddForm && (
        <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center text-green-800">
              <Plus className="h-5 w-5 mr-2" />
              Add New Term
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new_term_key">Term Key</Label>
                <Input
                  id="new_term_key"
                  value={newTermKey}
                  onChange={(e) => setNewTermKey(e.target.value)}
                  placeholder="e.g., product_name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new_term_value">Term Value</Label>
                <Input
                  id="new_term_value"
                  value={newTermValue}
                  onChange={(e) => setNewTermValue(e.target.value)}
                  placeholder="e.g., Product Name"
                />
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={handleAddNewTerm}
                disabled={!newTermKey.trim() || !newTermValue.trim()}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                Add Term
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Terminology List */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Languages className="h-5 w-5 mr-2" />
              Business Terms
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({filteredEntries.length} terms)
              </span>
            </CardTitle>
            {!showAddForm && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddForm(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Term
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {filteredEntries.length === 0 ? (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No terms found</h3>
              <p className="text-gray-600">
                Try adjusting your search terms or category filter.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEntries.map(entry => (
                <div
                  key={entry.key}
                  className={`p-4 border rounded-lg transition-all duration-200 ${
                    entry.isModified ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900">{entry.key}</h4>
                        <Badge variant="outline" className="text-xs">
                          {entry.category}
                        </Badge>
                        {entry.isModified && (
                          <Badge variant="default" className="text-xs bg-blue-100 text-blue-800">
                            Modified
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-gray-500">Default Value</Label>
                          <p className="text-sm text-gray-700">{entry.defaultValue}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Current Value</Label>
                          {isEditing ? (
                            <Input
                              value={editingTerms[entry.key] ?? entry.customValue}
                              onChange={(e) => handleEditTerm(entry.key, e.target.value)}
                              className="text-sm"
                            />
                          ) : (
                            <p className="text-sm font-medium text-gray-900">{entry.customValue}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {!isEditing && entry.isModified && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResetTerm(entry.key)}
                        className="ml-4"
                      >
                        Reset
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Changes */}
      {isEditing && Object.keys(editingTerms).length > 0 && (
        <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-blue-900">Unsaved Changes</h3>
                <p className="text-blue-800">
                  You have {Object.keys(editingTerms).length} unsaved changes.
                </p>
              </div>
              <Button
                onClick={handleSaveChanges}
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
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Helper function to categorize terms
const getCategoryFromKey = (key: string): string => {
  if (key.includes('product') || key.includes('item') || key.includes('inventory')) {
    return 'inventory';
  }
  if (key.includes('invoice') || key.includes('bill') || key.includes('payment')) {
    return 'invoicing';
  }
  if (key.includes('customer') || key.includes('client')) {
    return 'customer';
  }
  if (key.includes('report') || key.includes('analytics')) {
    return 'reporting';
  }
  if (key.includes('account') || key.includes('finance')) {
    return 'accounting';
  }
  return 'general';
};

export default TerminologyManagement;