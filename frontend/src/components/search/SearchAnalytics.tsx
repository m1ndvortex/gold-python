/**
 * Search Analytics Component
 * Display search performance metrics and analytics
 */

import React, { useState } from 'react';
import { BarChart3, TrendingUp, Clock, Users, Search, Filter, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { DatePicker } from '../ui/date-picker';
import { useSearchAnalytics } from '../../hooks/useAdvancedSearch';
import { useLanguage } from '../../hooks/useLanguage';

export const SearchAnalytics: React.FC = () => {
  const { t, formatNumber } = useLanguage();
  const [dateRange, setDateRange] = useState<{ start?: string; end?: string }>({});
  const [selectedPeriod, setSelectedPeriod] = useState('7d');

  // Calculate date range based on selected period
  const getDateRange = () => {
    const end = new Date();
    const start = new Date();
    
    switch (selectedPeriod) {
      case '1d':
        start.setDate(end.getDate() - 1);
        break;
      case '7d':
        start.setDate(end.getDate() - 7);
        break;
      case '30d':
        start.setDate(end.getDate() - 30);
        break;
      case '90d':
        start.setDate(end.getDate() - 90);
        break;
      case 'custom':
        return dateRange;
      default:
        start.setDate(end.getDate() - 7);
    }
    
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  };

  const { start, end } = getDateRange();
  const { analytics, isLoading, error } = useSearchAnalytics(start, end);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="text-gray-500">
            <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t('search.analytics.errorLoading')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{t('search.analytics.title')}</h3>
          <p className="text-sm text-gray-600">
            {t('search.analytics.description')}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">{t('search.analytics.periods.1d')}</SelectItem>
              <SelectItem value="7d">{t('search.analytics.periods.7d')}</SelectItem>
              <SelectItem value="30d">{t('search.analytics.periods.30d')}</SelectItem>
              <SelectItem value="90d">{t('search.analytics.periods.90d')}</SelectItem>
              <SelectItem value="custom">{t('search.analytics.periods.custom')}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            {t('search.analytics.export')}
          </Button>
        </div>
      </div>

      {/* Custom Date Range */}
      {selectedPeriod === 'custom' && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div>
                <label className="text-sm font-medium">{t('search.analytics.startDate')}</label>
                <DatePicker
                  selected={dateRange.start ? new Date(dateRange.start) : undefined}
                  onSelect={(date) => setDateRange(prev => ({ 
                    ...prev, 
                    start: date?.toISOString().split('T')[0] 
                  }))}
                  placeholder={t('search.analytics.selectStartDate')}
                />
              </div>
              <div>
                <label className="text-sm font-medium">{t('search.analytics.endDate')}</label>
                <DatePicker
                  selected={dateRange.end ? new Date(dateRange.end) : undefined}
                  onSelect={(date) => setDateRange(prev => ({ 
                    ...prev, 
                    end: date?.toISOString().split('T')[0] 
                  }))}
                  placeholder={t('search.analytics.selectEndDate')}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t('search.analytics.totalSearches')}
                </p>
                <p className="text-2xl font-bold">
                  {formatNumber(analytics.total_searches)}
                </p>
              </div>
              <Search className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t('search.analytics.uniqueUsers')}
                </p>
                <p className="text-2xl font-bold">
                  {formatNumber(analytics.unique_users)}
                </p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t('search.analytics.avgResults')}
                </p>
                <p className="text-2xl font-bold">
                  {analytics.average_results_per_search.toFixed(1)}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t('search.analytics.avgResponseTime')}
                </p>
                <p className="text-2xl font-bold">
                  {analytics.search_performance.average_response_time_ms}ms
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Most Searched Terms */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {t('search.analytics.mostSearchedTerms')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.most_searched_terms.slice(0, 10).map((term, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Badge variant="outline" className="w-8 h-6 flex items-center justify-center text-xs">
                    {index + 1}
                  </Badge>
                  <span className="font-medium">{term.term}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    {formatNumber(term.count)} {t('search.analytics.searches')}
                  </span>
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ 
                        width: `${(term.count / analytics.most_searched_terms[0].count) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Most Used Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {t('search.analytics.mostUsedFilters')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.most_used_filters.slice(0, 10).map((filter, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Badge variant="outline" className="w-8 h-6 flex items-center justify-center text-xs">
                    {index + 1}
                  </Badge>
                  <span className="font-medium">{filter.filter}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    {formatNumber(filter.count)} {t('search.analytics.uses')}
                  </span>
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ 
                        width: `${(filter.count / analytics.most_used_filters[0].count) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Entity Type Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>{t('search.analytics.entityDistribution')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(analytics.entity_type_distribution).map(([entityType, count]) => (
              <div key={entityType} className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {formatNumber(count)}
                </div>
                <div className="text-sm text-gray-600">
                  {t(`search.entityTypes.${entityType}`)}
                </div>
                <div className="text-xs text-gray-500">
                  {((count / analytics.total_searches) * 100).toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Search Performance */}
        <Card>
          <CardHeader>
            <CardTitle>{t('search.analytics.searchPerformance')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">
                  {t('search.analytics.averageResponseTime')}
                </span>
                <span className="font-medium">
                  {analytics.search_performance.average_response_time_ms}ms
                </span>
              </div>
              
              {analytics.search_performance.slow_queries.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">
                    {t('search.analytics.slowQueries')}
                  </h4>
                  <div className="space-y-2">
                    {analytics.search_performance.slow_queries.slice(0, 5).map((query, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="truncate flex-1 mr-2">{query.query}</span>
                        <Badge variant="outline" className="text-xs">
                          {query.time_ms}ms
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Conversion Rates */}
        <Card>
          <CardHeader>
            <CardTitle>{t('search.analytics.conversionRates')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  {t('search.analytics.searchToView')}
                </span>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">
                    {(analytics.conversion_rates.search_to_view * 100).toFixed(1)}%
                  </span>
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${analytics.conversion_rates.search_to_view * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  {t('search.analytics.searchToAction')}
                </span>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">
                    {(analytics.conversion_rates.search_to_action * 100).toFixed(1)}%
                  </span>
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${analytics.conversion_rates.search_to_action * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};