/**
 * Search Results Component
 * Display search results with pagination, sorting, and different view modes
 */

import React, { useState, useCallback } from 'react';
import { 
  Grid, 
  List, 
  Table, 
  ChevronLeft, 
  ChevronRight, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  Eye,
  Edit,
  Download,
  Share,
  MoreHorizontal,
  Package,
  FileText,
  Users,
  Calculator
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Skeleton } from '../ui/skeleton';
import { useLanguage } from '../../hooks/useLanguage';
import {
  SearchResults as SearchResultsType,
  SearchResultItem,
  SearchResultsProps,
  SearchEntityType
} from '../../types/search';

export const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  loading,
  onResultClick,
  onPageChange,
  onSortChange,
  viewMode,
  onViewModeChange
}) => {
  const { t, isRTL, formatCurrency, formatDate } = useLanguage();
  const [sortBy, setSortBy] = useState('relevance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Handle sort change
  const handleSortChange = useCallback((newSortBy: string) => {
    let newSortOrder: 'asc' | 'desc' = 'desc';
    
    if (newSortBy === sortBy) {
      newSortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    }
    
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    onSortChange(newSortBy, newSortOrder);
  }, [sortBy, sortOrder, onSortChange]);

  // Entity type icons and colors
  const entityConfig: Record<SearchEntityType, { icon: React.ReactNode; color: string; bgColor: string }> = {
    inventory: {
      icon: <Package className="h-4 w-4" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    invoices: {
      icon: <FileText className="h-4 w-4" />,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    customers: {
      icon: <Users className="h-4 w-4" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    accounting: {
      icon: <Calculator className="h-4 w-4" />,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  };

  // Format metadata for display
  const formatMetadata = (item: SearchResultItem) => {
    const metadata = item.metadata;
    const formatted: Array<{ label: string; value: string }> = [];

    switch (item.entity_type) {
      case 'inventory':
        if (metadata.sku) formatted.push({ label: t('search.results.sku'), value: metadata.sku });
        if (metadata.stock_quantity !== undefined) {
          formatted.push({ 
            label: t('search.results.stock'), 
            value: `${metadata.stock_quantity} ${metadata.unit_of_measure || ''}` 
          });
        }
        if (metadata.sale_price) {
          formatted.push({ 
            label: t('search.results.price'), 
            value: formatCurrency(metadata.sale_price) 
          });
        }
        break;
      
      case 'invoices':
        if (metadata.invoice_number) {
          formatted.push({ label: t('search.results.invoiceNumber'), value: metadata.invoice_number });
        }
        if (metadata.total_amount) {
          formatted.push({ 
            label: t('search.results.amount'), 
            value: formatCurrency(metadata.total_amount) 
          });
        }
        if (metadata.status) {
          formatted.push({ label: t('search.results.status'), value: metadata.status });
        }
        break;
      
      case 'customers':
        if (metadata.phone) formatted.push({ label: t('search.results.phone'), value: metadata.phone });
        if (metadata.email) formatted.push({ label: t('search.results.email'), value: metadata.email });
        if (metadata.total_debt) {
          formatted.push({ 
            label: t('search.results.debt'), 
            value: formatCurrency(metadata.total_debt) 
          });
        }
        break;
      
      case 'accounting':
        if (metadata.account_code) {
          formatted.push({ label: t('search.results.accountCode'), value: metadata.account_code });
        }
        if (metadata.amount) {
          formatted.push({ 
            label: t('search.results.amount'), 
            value: formatCurrency(metadata.amount) 
          });
        }
        if (metadata.entry_type) {
          formatted.push({ label: t('search.results.entryType'), value: metadata.entry_type });
        }
        break;
    }

    return formatted;
  };

  // Render loading skeleton
  const renderSkeleton = () => (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <Card key={index}>
          <CardContent className="p-4">
            <div className="flex items-start space-x-4">
              <Skeleton className="h-12 w-12 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <div className="flex space-x-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Render result item in list view
  const renderListItem = (item: SearchResultItem) => {
    const config = entityConfig[item.entity_type];
    const metadata = formatMetadata(item);

    return (
      <Card 
        key={item.id} 
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => onResultClick(item)}
      >
        <CardContent className="p-4">
          <div className="flex items-start space-x-4">
            {/* Entity Icon */}
            <div className={`p-2 rounded-lg ${config.bgColor}`}>
              <div className={config.color}>
                {config.icon}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {item.title}
                  </h3>
                  {item.subtitle && (
                    <p className="text-sm text-gray-600 truncate">
                      {item.subtitle}
                    </p>
                  )}
                  {item.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                </div>

                {/* Image */}
                {item.image_url && (
                  <Avatar className="h-16 w-16 ml-4">
                    <AvatarImage src={item.image_url} alt={item.title} />
                    <AvatarFallback>
                      {config.icon}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>

              {/* Metadata */}
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="secondary" className="text-xs">
                  {t(`search.entityTypes.${item.entity_type}`)}
                </Badge>
                {metadata.slice(0, 3).map((meta, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {meta.label}: {meta.value}
                  </Badge>
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                <span>
                  {t('search.results.updated')}: {formatDate(new Date(item.updated_at))}
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-yellow-500">
                    ★ {item.relevance_score.toFixed(1)}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onResultClick(item)}>
                        <Eye className="h-4 w-4 mr-2" />
                        {t('search.results.view')}
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="h-4 w-4 mr-2" />
                        {t('search.results.edit')}
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Share className="h-4 w-4 mr-2" />
                        {t('search.results.share')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render result item in grid view
  const renderGridItem = (item: SearchResultItem) => {
    const config = entityConfig[item.entity_type];
    const metadata = formatMetadata(item);

    return (
      <Card 
        key={item.id} 
        className="cursor-pointer hover:shadow-md transition-shadow h-full"
        onClick={() => onResultClick(item)}
      >
        <CardContent className="p-4 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className={`p-2 rounded-lg ${config.bgColor}`}>
              <div className={config.color}>
                {config.icon}
              </div>
            </div>
            <Badge variant="secondary" className="text-xs">
              {t(`search.entityTypes.${item.entity_type}`)}
            </Badge>
          </div>

          {/* Image */}
          {item.image_url && (
            <div className="mb-3">
              <Avatar className="h-20 w-20 mx-auto">
                <AvatarImage src={item.image_url} alt={item.title} />
                <AvatarFallback>
                  {config.icon}
                </AvatarFallback>
              </Avatar>
            </div>
          )}

          {/* Content */}
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 truncate mb-1">
              {item.title}
            </h3>
            {item.subtitle && (
              <p className="text-sm text-gray-600 truncate mb-2">
                {item.subtitle}
              </p>
            )}
            {item.description && (
              <p className="text-sm text-gray-500 line-clamp-3 mb-3">
                {item.description}
              </p>
            )}

            {/* Metadata */}
            <div className="space-y-1">
              {metadata.slice(0, 2).map((meta, index) => (
                <div key={index} className="text-xs text-gray-600">
                  <span className="font-medium">{meta.label}:</span> {meta.value}
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t text-xs text-gray-500">
            <span className="text-yellow-500">
              ★ {item.relevance_score.toFixed(1)}
            </span>
            <span>
              {formatDate(new Date(item.updated_at))}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render table view
  const renderTable = () => {
    if (!results?.items.length) return null;

    return (
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('search.results.item')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('search.results.type')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('search.results.details')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('search.results.updated')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('search.results.relevance')}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('search.results.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.items.map((item) => {
                  const config = entityConfig[item.entity_type];
                  const metadata = formatMetadata(item);

                  return (
                    <tr 
                      key={item.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => onResultClick(item)}
                    >
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {item.image_url && (
                            <Avatar className="h-8 w-8 mr-3">
                              <AvatarImage src={item.image_url} alt={item.title} />
                              <AvatarFallback className="text-xs">
                                {config.icon}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {item.title}
                            </div>
                            {item.subtitle && (
                              <div className="text-sm text-gray-500">
                                {item.subtitle}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <Badge variant="secondary" className="text-xs">
                          {t(`search.entityTypes.${item.entity_type}`)}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          {metadata.slice(0, 2).map((meta, index) => (
                            <div key={index} className="text-xs text-gray-600">
                              <span className="font-medium">{meta.label}:</span> {meta.value}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(new Date(item.updated_at))}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="text-yellow-500 text-sm">
                          ★ {item.relevance_score.toFixed(1)}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onResultClick(item)}>
                              <Eye className="h-4 w-4 mr-2" />
                              {t('search.results.view')}
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              {t('search.results.edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Share className="h-4 w-4 mr-2" />
                              {t('search.results.share')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return renderSkeleton();
  }

  if (!results || results.items.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">
              {t('search.results.noResults')}
            </h3>
            <p className="text-sm">
              {t('search.results.noResultsDescription')}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Results Header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {t('search.results.showing', {
                  start: ((results.page - 1) * results.per_page) + 1,
                  end: Math.min(results.page * results.per_page, results.total),
                  total: results.total
                })}
              </span>
              <span className="text-xs text-gray-500">
                ({results.search_time_ms}ms)
              </span>
            </div>

            <div className="flex items-center space-x-2">
              {/* Sort Options */}
              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">{t('search.sort.relevance')}</SelectItem>
                  <SelectItem value="created_at">{t('search.sort.date')}</SelectItem>
                  <SelectItem value="title">{t('search.sort.name')}</SelectItem>
                  <SelectItem value="updated_at">{t('search.sort.updated')}</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSortChange(sortBy)}
              >
                {sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
              </Button>

              {/* View Mode Toggle */}
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onViewModeChange('list')}
                  className="rounded-r-none"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onViewModeChange('grid')}
                  className="rounded-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onViewModeChange('table')}
                  className="rounded-l-none"
                >
                  <Table className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Content */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {results.items.map(renderListItem)}
        </div>
      )}

      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {results.items.map(renderGridItem)}
        </div>
      )}

      {viewMode === 'table' && renderTable()}

      {/* Pagination */}
      {results.total_pages > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => onPageChange(results.page - 1)}
                disabled={!results.has_prev}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                {t('search.pagination.previous')}
              </Button>

              <div className="flex items-center space-x-2">
                {Array.from({ length: Math.min(5, results.total_pages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      variant={page === results.page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onPageChange(page)}
                    >
                      {page}
                    </Button>
                  );
                })}
                {results.total_pages > 5 && (
                  <>
                    <span className="text-gray-500">...</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPageChange(results.total_pages)}
                    >
                      {results.total_pages}
                    </Button>
                  </>
                )}
              </div>

              <Button
                variant="outline"
                onClick={() => onPageChange(results.page + 1)}
                disabled={!results.has_next}
              >
                {t('search.pagination.next')}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};