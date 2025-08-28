import React, { useState, useMemo } from 'react';
import { Search, Plus, Phone, Mail, AlertTriangle, DollarSign, Filter, Users, Eye, Edit, Trash2, Lock, Shield } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { useAuth } from '../../hooks/useAuth';
import { WithPermissions } from '../auth/WithPermissions';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { DataTable, DataTableColumn, DataTableAction } from '../ui/data-table';
import { SearchableSelect } from '../ui/searchable-select';
import { useCustomers, useCustomerSearch } from '../../hooks/useCustomers';
import { ComprehensiveCustomerForm } from './ComprehensiveCustomerForm';
import { CustomerProfile } from './CustomerProfile';
import type { Customer, CustomerSearchFilters } from '../../types';

interface CustomerListProps {
  onCustomerSelect?: (customer: Customer) => void;
}

export const CustomerList: React.FC<CustomerListProps> = ({ onCustomerSelect }) => {
  const { t } = useLanguage();
  const { user, hasPermission, isAuthenticated } = useAuth();

  // Check authentication
  if (!isAuthenticated) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
              <Lock className="h-8 w-8 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Authentication Required</h3>
              <p className="text-muted-foreground">Please log in to access customer management.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Check permissions
  const canViewCustomers = hasPermission('view_customers');
  const canCreateCustomers = hasPermission('create_customers');
  const canEditCustomers = hasPermission('edit_customers');
  const canDeleteCustomers = hasPermission('delete_customers');

  if (!canViewCustomers) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center">
              <Shield className="h-8 w-8 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Access Denied</h3>
              <p className="text-muted-foreground">You don't have permission to view customers.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<CustomerSearchFilters>({
    sort_by: 'created_at',
    sort_order: 'desc'
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  // Use search when query is provided, otherwise use filtered list
  const { data: searchResults, isLoading: isSearching } = useCustomerSearch(
    searchQuery,
    searchQuery.length > 0
  );
  
  const { data: customers, isLoading: isLoadingCustomers } = useCustomers(
    searchQuery.length === 0 ? filters : undefined
  );

  const displayCustomers = useMemo(() => {
    return searchQuery.length > 0 ? searchResults : customers;
  }, [searchQuery, searchResults, customers]);

  const isLoading = searchQuery.length > 0 ? isSearching : isLoadingCustomers;

  const handleCustomerClick = (customer: Customer) => {
    if (onCustomerSelect) {
      onCustomerSelect(customer);
    } else {
      setSelectedCustomer(customer);
      setShowProfile(true);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getDebtBadgeVariant = (debt: number) => {
    if (debt === 0) return 'secondary';
    if (debt > 1000) return 'destructive';
    if (debt > 500) return 'default';
    return 'outline';
  };

  // Define table columns with modern styling
  const columns: DataTableColumn<Customer>[] = [
    {
      id: 'name',
      header: t('customers.customer'),
      accessorKey: 'name',
      sortable: true,
      filterable: true,
      filterType: 'text',
      cell: ({ row }) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center shadow-sm">
            <Users className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <div className="font-semibold text-foreground">{row.name}</div>
            <div className="text-sm text-muted-foreground">
              ID: {row.id.slice(0, 8)}...
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'contact',
      header: t('customers.contact_information'),
      cell: ({ row }) => (
        <div className="space-y-1">
          {row.phone && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Phone className="h-3 w-3 mr-2 text-green-500" />
              <span className="font-medium">{row.phone}</span>
            </div>
          )}
          {row.email && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Mail className="h-3 w-3 mr-2 text-blue-500" />
              <span className="font-medium">{row.email}</span>
            </div>
          )}
          {!row.phone && !row.email && (
            <span className="text-sm text-muted-foreground">{t('customers.no_contact_info')}</span>
          )}
        </div>
      )
    },
    {
      id: 'total_purchases',
      header: t('customers.total_purchases'),
      accessorKey: 'total_purchases',
      sortable: true,
      filterable: true,
      filterType: 'number',
      align: 'right',
      cell: ({ row }) => (
        <div className="flex items-center justify-end space-x-2">
          <div className="w-6 h-6 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center">
            <DollarSign className="h-3 w-3 text-green-600" />
          </div>
          <span className="font-semibold text-green-700">
            {formatCurrency(row.total_purchases)}
          </span>
        </div>
      )
    },
    {
      id: 'current_debt',
      header: t('customers.current_debt'),
      accessorKey: 'current_debt',
      sortable: true,
      filterable: true,
      filterType: 'number',
      align: 'right',
      cell: ({ row }) => (
        <Badge 
          variant={getDebtBadgeVariant(row.current_debt)}
          className="justify-center min-w-[100px]"
        >
          {row.current_debt > 0 && (
            <AlertTriangle className="h-3 w-3 mr-1" />
          )}
          {formatCurrency(row.current_debt)}
        </Badge>
      )
    },
    {
      id: 'last_purchase_date',
      header: t('customers.last_purchase'),
      accessorKey: 'last_purchase_date',
      sortable: true,
      cell: ({ row }) => (
        <div className="text-sm">
          {row.last_purchase_date 
            ? formatDate(row.last_purchase_date)
            : <span className="text-muted-foreground">{t('customers.never')}</span>
          }
        </div>
      )
    },
    {
      id: 'status',
      header: t('customers.status'),
      cell: ({ row }) => (
        <Badge 
          variant={row.current_debt > 0 ? 'destructive' : 'default'}
          className="font-medium"
        >
          {row.current_debt > 0 ? t('customers.with_debt') : t('customers.clear')}
        </Badge>
      ),
      filterable: true,
      filterType: 'select',
      filterOptions: [
        { label: 'All Customers', value: '' },
        { label: 'Has Debt', value: 'debt' },
        { label: 'Clear', value: 'clear' }
      ]
    }
  ];

  // Define table actions with permission checking
  const actions: DataTableAction<Customer>[] = [
    {
      id: 'view',
      label: t('customers.view_profile'),
      icon: <Eye className="h-4 w-4" />,
      onClick: (customer) => {
        setSelectedCustomer(customer);
        setShowProfile(true);
      },
      variant: 'ghost'
    },
    ...(canEditCustomers ? [{
      id: 'edit',
      label: t('customers.edit'),
      icon: <Edit className="h-4 w-4" />,
      onClick: (customer) => {
        setSelectedCustomer(customer);
        setShowCreateForm(true);
      },
      variant: 'ghost' as const
    }] : [])
  ];

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Gradient Styling */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 via-teal-500 to-blue-500 flex items-center justify-center shadow-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground">
                {t('customers.title')}
              </h1>
              <p className="text-muted-foreground text-lg">
                {t('customers.description')}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {selectedRows.length > 0 && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1 px-3 py-1">
              <Users className="h-3 w-3" />
              {selectedRows.length} selected
            </Badge>
          )}
          <WithPermissions permissions={['create_customers']}>
            <Button 
              onClick={() => setShowCreateForm(true)}
              className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('customers.add_customer')}
            </Button>
          </WithPermissions>
        </div>
      </div>

      {/* Enhanced Stats Cards with Gradient Styling */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-teal-100/50 hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">{t('customers.total_customers')}</p>
                <p className="text-3xl font-bold text-green-700">
                  {displayCustomers?.length || 0}
                </p>
                <p className="text-xs text-green-600 flex items-center">
                  <Users className="h-3 w-3 mr-1" />
                  Active customers
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-100/50 hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">{t('customers.clear_status')}</p>
                <p className="text-3xl font-bold text-blue-700">
                  {displayCustomers?.filter(c => c.current_debt === 0).length || 0}
                </p>
                <p className="text-xs text-blue-600 flex items-center">
                  <DollarSign className="h-3 w-3 mr-1" />
                  No outstanding debt
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-violet-100/50 hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">{t('customers.with_debt')}</p>
                <p className="text-3xl font-bold text-purple-700">
                  {displayCustomers?.filter(c => c.current_debt > 0).length || 0}
                </p>
                <p className="text-xs text-purple-600 flex items-center">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Requires attention
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg bg-gradient-to-br from-pink-50 to-rose-100/50 hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">{t('customers.total_purchases')}</p>
                <p className="text-3xl font-bold text-pink-700">
                  {formatCurrency(displayCustomers?.reduce((sum, c) => sum + c.total_purchases, 0) || 0)}
                </p>
                <p className="text-xs text-pink-600 flex items-center">
                  <DollarSign className="h-3 w-3 mr-1" />
                  Lifetime value
                </p>
              </div>
              <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-pink-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Data Table with Gradient Styling */}
      <Card className="border-0 shadow-xl overflow-hidden">
        <CardContent className="p-0">
          {/* Modern Table Header */}
          <div className="bg-gradient-to-r from-green-50 via-teal-50 to-blue-50 border-b-2 border-green-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">{t('customers.directory')}</h3>
                  <p className="text-sm text-muted-foreground">Manage and view customer information</p>
                </div>
              </div>
              {selectedRows.length > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <Users className="h-3 w-3 mr-1" />
                    {selectedRows.length} selected
                  </Badge>
                  <Button variant="outline" size="sm" className="bg-white hover:bg-green-50 border-green-200">
                    <Mail className="h-4 w-4 mr-2" />
                    Send Email
                  </Button>
                  <Button variant="outline" size="sm" className="bg-white hover:bg-green-50 border-green-200">
                    Export Selected
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          {/* Table Content */}
          <div className="bg-gradient-to-br from-green-50/30 to-white">
            <DataTable
              data={displayCustomers || []}
              columns={columns}
              actions={actions}
              loading={isLoading}
              emptyMessage={searchQuery ? t('customers.no_customers_found_search') : t('customers.no_customers_found')}
              searchPlaceholder={t('common.search_placeholder')}
              globalFilter={searchQuery}
              onGlobalFilterChange={setSearchQuery}
              selection={{
                selectedRows,
                onSelectionChange: setSelectedRows
              }}
              onRowClick={(customer) => {
                if (onCustomerSelect) {
                  onCustomerSelect(customer);
                } else {
                  setSelectedCustomer(customer);
                  setShowProfile(true);
                }
              }}
              striped
              className="border-0"
            />
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Customer Form Dialog */}
      {showCreateForm && (
        <ComprehensiveCustomerForm
          customer={selectedCustomer || undefined}
          onClose={() => {
            setShowCreateForm(false);
            setSelectedCustomer(null);
          }}
          onSuccess={() => {
            setShowCreateForm(false);
            setSelectedCustomer(null);
          }}
        />
      )}

      {/* Customer Profile Dialog */}
      {showProfile && selectedCustomer && (
        <CustomerProfile
          customer={selectedCustomer}
          onClose={() => {
            setShowProfile(false);
            setSelectedCustomer(null);
          }}
        />
      )}
    </div>
  );
};