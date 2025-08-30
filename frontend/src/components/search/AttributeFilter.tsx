/**
 * Attribute Filter Component
 * Dynamic filtering based on custom attribute schemas
 */

import React, { useState, useCallback } from 'react';
import { Plus, X, Calendar, Hash, Type, ToggleLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { DatePicker } from '../ui/date-picker';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { useLanguage } from '../../hooks/useLanguage';
import { AttributeFilterProps } from '../../types/search';

interface AttributeDefinition {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'enum' | 'boolean';
  options?: string[];
  required?: boolean;
  searchable?: boolean;
  filterable?: boolean;
}

interface AttributeFilterRule {
  id: string;
  attribute_name: string;
  attribute_type: string;
  operator: string;
  value: any;
  values?: any[];
}

export const AttributeFilter: React.FC<AttributeFilterProps> = ({
  attributes,
  selectedAttributes,
  onAttributesChange,
  showAdvancedOperators = false
}) => {
  const { t } = useLanguage();
  const [activeFilters, setActiveFilters] = useState<AttributeFilterRule[]>([]);
  const [showAddFilter, setShowAddFilter] = useState(false);

  // Convert selectedAttributes to filter rules
  React.useEffect(() => {
    const filters: AttributeFilterRule[] = [];
    Object.entries(selectedAttributes).forEach(([attrName, value]) => {
      const attribute = attributes.find(attr => attr.name === attrName);
      if (attribute && value !== undefined && value !== null && value !== '') {
        filters.push({
          id: `${attrName}-${Date.now()}`,
          attribute_name: attrName,
          attribute_type: attribute.type,
          operator: getDefaultOperator(attribute.type),
          value: value
        });
      }
    });
    setActiveFilters(filters);
  }, [selectedAttributes, attributes]);

  // Get default operator for attribute type
  const getDefaultOperator = (type: string): string => {
    switch (type) {
      case 'text':
        return 'contains';
      case 'number':
        return 'equals';
      case 'date':
        return 'equals';
      case 'enum':
        return 'in';
      case 'boolean':
        return 'equals';
      default:
        return 'equals';
    }
  };

  // Get available operators for attribute type
  const getOperators = (type: string): Array<{ value: string; label: string }> => {
    const baseOperators = [
      { value: 'equals', label: t('search.filters.operators.equals') },
      { value: 'not_equals', label: t('search.filters.operators.notEquals') }
    ];

    switch (type) {
      case 'text':
        return [
          { value: 'contains', label: t('search.filters.operators.contains') },
          { value: 'not_contains', label: t('search.filters.operators.notContains') },
          { value: 'starts_with', label: t('search.filters.operators.startsWith') },
          { value: 'ends_with', label: t('search.filters.operators.endsWith') },
          ...baseOperators
        ];
      case 'number':
        return [
          ...baseOperators,
          { value: 'greater_than', label: t('search.filters.operators.greaterThan') },
          { value: 'less_than', label: t('search.filters.operators.lessThan') },
          { value: 'greater_equal', label: t('search.filters.operators.greaterEqual') },
          { value: 'less_equal', label: t('search.filters.operators.lessEqual') },
          { value: 'between', label: t('search.filters.operators.between') }
        ];
      case 'date':
        return [
          ...baseOperators,
          { value: 'after', label: t('search.filters.operators.after') },
          { value: 'before', label: t('search.filters.operators.before') },
          { value: 'between', label: t('search.filters.operators.between') }
        ];
      case 'enum':
        return [
          { value: 'in', label: t('search.filters.operators.in') },
          { value: 'not_in', label: t('search.filters.operators.notIn') }
        ];
      case 'boolean':
        return baseOperators;
      default:
        return baseOperators;
    }
  };

  // Add new filter
  const addFilter = useCallback((attributeName: string) => {
    const attribute = attributes.find(attr => attr.name === attributeName);
    if (!attribute) return;

    const newFilter: AttributeFilterRule = {
      id: `${attributeName}-${Date.now()}`,
      attribute_name: attributeName,
      attribute_type: attribute.type,
      operator: getDefaultOperator(attribute.type),
      value: attribute.type === 'boolean' ? false : ''
    };

    setActiveFilters(prev => [...prev, newFilter]);
    setShowAddFilter(false);
  }, [attributes]);

  // Update filter
  const updateFilter = useCallback((filterId: string, updates: Partial<AttributeFilterRule>) => {
    setActiveFilters(prev => prev.map(filter => 
      filter.id === filterId ? { ...filter, ...updates } : filter
    ));
  }, []);

  // Remove filter
  const removeFilter = useCallback((filterId: string) => {
    setActiveFilters(prev => prev.filter(filter => filter.id !== filterId));
  }, []);

  // Apply filters
  const applyFilters = useCallback(() => {
    const newAttributes: Record<string, any> = {};
    
    activeFilters.forEach(filter => {
      if (filter.value !== undefined && filter.value !== null && filter.value !== '') {
        newAttributes[filter.attribute_name] = {
          operator: filter.operator,
          value: filter.value,
          values: filter.values
        };
      }
    });

    onAttributesChange(newAttributes);
  }, [activeFilters, onAttributesChange]);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setActiveFilters([]);
    onAttributesChange({});
  }, [onAttributesChange]);

  // Apply filters when activeFilters change
  React.useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Render value input based on attribute type and operator
  const renderValueInput = (filter: AttributeFilterRule) => {
    const attribute = attributes.find(attr => attr.name === filter.attribute_name);
    if (!attribute) return null;

    switch (attribute.type) {
      case 'text':
        return (
          <Input
            type="text"
            placeholder={t('search.filters.enterValue')}
            value={filter.value || ''}
            onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
            className="text-sm"
          />
        );

      case 'number':
        if (filter.operator === 'between') {
          return (
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder={t('search.filters.min')}
                value={filter.values?.[0] || ''}
                onChange={(e) => {
                  const values = filter.values || [];
                  values[0] = e.target.value ? parseFloat(e.target.value) : undefined;
                  updateFilter(filter.id, { values });
                }}
                className="text-sm"
              />
              <Input
                type="number"
                placeholder={t('search.filters.max')}
                value={filter.values?.[1] || ''}
                onChange={(e) => {
                  const values = filter.values || [];
                  values[1] = e.target.value ? parseFloat(e.target.value) : undefined;
                  updateFilter(filter.id, { values });
                }}
                className="text-sm"
              />
            </div>
          );
        }
        return (
          <Input
            type="number"
            placeholder={t('search.filters.enterNumber')}
            value={filter.value || ''}
            onChange={(e) => updateFilter(filter.id, { 
              value: e.target.value ? parseFloat(e.target.value) : undefined 
            })}
            className="text-sm"
          />
        );

      case 'date':
        if (filter.operator === 'between') {
          return (
            <div className="grid grid-cols-1 gap-2">
              <DatePicker
                selected={filter.values?.[0] ? new Date(filter.values[0]) : undefined}
                onSelect={(date) => {
                  const values = filter.values || [];
                  values[0] = date?.toISOString();
                  updateFilter(filter.id, { values });
                }}
                placeholder={t('search.filters.fromDate')}
              />
              <DatePicker
                selected={filter.values?.[1] ? new Date(filter.values[1]) : undefined}
                onSelect={(date) => {
                  const values = filter.values || [];
                  values[1] = date?.toISOString();
                  updateFilter(filter.id, { values });
                }}
                placeholder={t('search.filters.toDate')}
              />
            </div>
          );
        }
        return (
          <DatePicker
            selected={filter.value ? new Date(filter.value) : undefined}
            onSelect={(date) => updateFilter(filter.id, { value: date?.toISOString() })}
            placeholder={t('search.filters.selectDate')}
          />
        );

      case 'enum':
        if (!attribute.options) return null;
        
        if (filter.operator === 'in' || filter.operator === 'not_in') {
          return (
            <div className="space-y-2">
              {attribute.options.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${filter.id}-${option}`}
                    checked={filter.values?.includes(option) || false}
                    onCheckedChange={(checked) => {
                      const values = filter.values || [];
                      if (checked) {
                        updateFilter(filter.id, { values: [...values, option] });
                      } else {
                        updateFilter(filter.id, { values: values.filter(v => v !== option) });
                      }
                    }}
                  />
                  <Label htmlFor={`${filter.id}-${option}`} className="text-sm">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          );
        }
        
        return (
          <Select
            value={filter.value || ''}
            onValueChange={(value) => updateFilter(filter.id, { value })}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('search.filters.selectOption')} />
            </SelectTrigger>
            <SelectContent>
              {attribute.options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'boolean':
        return (
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`${filter.id}-true`}
                checked={filter.value === true}
                onCheckedChange={(checked) => updateFilter(filter.id, { value: checked ? true : false })}
              />
              <Label htmlFor={`${filter.id}-true`} className="text-sm">
                {t('search.filters.true')}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`${filter.id}-false`}
                checked={filter.value === false}
                onCheckedChange={(checked) => updateFilter(filter.id, { value: checked ? false : true })}
              />
              <Label htmlFor={`${filter.id}-false`} className="text-sm">
                {t('search.filters.false')}
              </Label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Get attribute type icon
  const getAttributeIcon = (type: string) => {
    switch (type) {
      case 'text':
        return <Type className="h-4 w-4" />;
      case 'number':
        return <Hash className="h-4 w-4" />;
      case 'date':
        return <Calendar className="h-4 w-4" />;
      case 'boolean':
        return <ToggleLeft className="h-4 w-4" />;
      default:
        return <Hash className="h-4 w-4" />;
    }
  };

  // Get available attributes for adding
  const getAvailableAttributes = () => {
    const usedAttributes = new Set(activeFilters.map(f => f.attribute_name));
    return attributes.filter(attr => 
      attr.filterable !== false && !usedAttributes.has(attr.name)
    );
  };

  return (
    <div className="space-y-4">
      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="space-y-3">
          {activeFilters.map((filter) => {
            const attribute = attributes.find(attr => attr.name === filter.attribute_name);
            if (!attribute) return null;

            return (
              <Card key={filter.id}>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Filter Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getAttributeIcon(attribute.type)}
                        <span className="font-medium text-sm">{attribute.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {t(`search.filters.attributeTypes.${attribute.type}`)}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFilter(filter.id)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Operator Selection */}
                    {showAdvancedOperators && (
                      <div>
                        <Label className="text-xs">{t('search.filters.operator')}</Label>
                        <Select
                          value={filter.operator}
                          onValueChange={(operator) => updateFilter(filter.id, { operator })}
                        >
                          <SelectTrigger className="text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {getOperators(attribute.type).map((op) => (
                              <SelectItem key={op.value} value={op.value}>
                                {op.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Value Input */}
                    <div>
                      <Label className="text-xs">{t('search.filters.value')}</Label>
                      {renderValueInput(filter)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Filter */}
      {getAvailableAttributes().length > 0 && (
        <div>
          {!showAddFilter ? (
            <Button
              variant="outline"
              onClick={() => setShowAddFilter(true)}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('search.filters.addAttributeFilter')}
            </Button>
          ) : (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">
                  {t('search.filters.selectAttribute')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-2">
                  {getAvailableAttributes().map((attribute) => (
                    <Button
                      key={attribute.id}
                      variant="ghost"
                      className="justify-start h-auto p-3"
                      onClick={() => addFilter(attribute.name)}
                    >
                      <div className="flex items-center space-x-3 w-full">
                        {getAttributeIcon(attribute.type)}
                        <div className="flex-1 text-left">
                          <div className="font-medium text-sm">{attribute.name}</div>
                          <div className="text-xs text-gray-500">
                            {t(`search.filters.attributeTypes.${attribute.type}`)}
                          </div>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddFilter(false)}
                  >
                    {t('common.cancel')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Actions */}
      {activeFilters.length > 0 && (
        <div className="flex justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllFilters}
          >
            {t('search.filters.clearAllFilters')}
          </Button>
          <div className="text-xs text-gray-500">
            {t('search.filters.activeFilters', { count: activeFilters.length })}
          </div>
        </div>
      )}

      {/* No Attributes Message */}
      {attributes.length === 0 && (
        <div className="text-center py-6 text-gray-500">
          <Hash className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">{t('search.filters.noAttributesAvailable')}</p>
        </div>
      )}
    </div>
  );
};