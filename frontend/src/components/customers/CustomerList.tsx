import React, { useState, useMemo } from 'react';
import { Search, Plus, Phone, Mail, AlertTriangle, DollarSign, Filter, Users, Eye, Edit, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { DataTable, DataTableColumn, DataTableAction } from '../ui/data-table';
import { SearchableSelect } from '../ui/searchable-select';
import { useCustomers, useCustomerSearch } from '../../hooks/useCustomers';
import { CustomerForm } from './CustomerForm';
import { CustomerProfile } from './CustomerProfile';
import type { Customer, CustomerSearchFilters } from '../../types';

interface CustomerListProps {
  onCustomerSelect?: (customer: Customer) => void;
}

export const CustomerList: React.FC<CustomerListProps> = ({ onCustomerSelect }) => {
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
      header: 'Customer',
      accessorKey: 'name',
      sortable: true,
      filterable: true,
      filterType: 'text',
      cell: ({ row }) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <Users className="h-5 w-5 text-primary-600" />
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
      header: 'Contact Information',
      cell: ({ row }) => (
        <div className="space-y-1">
          {row.phone && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Phone className="h-3 w-3 mr-2 text-primary-500" />
              <span className="font-medium">{row.phone}</span>
            </div>
          )}
          {row.email && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Mail className="h-3 w-3 mr-2 text-primary-500" />
              <span className="font-medium">{row.email}</span>
            </div>
          )}
          {!row.phone && !row.email && (
            <span className="text-sm text-muted-foreground">No contact info</span>
          )}
        </div>
      )
    },
    {
      id: 'total_purchases',
      header: 'Total Purchases',
      accessorKey: 'total_purchases',
      sortable: true,
      filterable: true,
      filterType: 'number',
      align: 'right',
      cell: ({ row }) => (
        <div className="flex items-center justify-end space-x-2">
          <DollarSign className="h-4 w-4 text-success-600" />
          <span className="font-semibold text-success-700">
            {formatCurrency(row.total_purchases)}
          </span>
        </div>
      )
    },
    {
      id: 'current_debt',
      header: 'Current Debt',
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
      header: 'Last Purchase',
      accessorKey: 'last_purchase_date',
      sortable: true,
      cell: ({ row }) => (
        <div className="text-sm">
          {row.last_purchase_date 
            ? formatDate(row.last_purchase_date)
            : <span className="text-muted-foreground">Never</span>
          }
        </div>
      )
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge 
          variant={row.current_debt > 0 ? 'destructive' : 'default'}
          className="font-medium"
        >
          {row.current_debt > 0 ? 'Has Debt' : 'Clear'}
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

  // Define table actions
  const actions: DataTableAction<Customer>[] = [
    {
      id: 'view',
      label: 'View Profile',
      icon: <Eye className="h-4 w-4" />,
      onClick: (customer) => {
        setSelectedCustomer(customer);
        setShowProfile(true);
      },
      variant: 'ghost'
    },
    {
      id: 'edit',
      label: 'Edit Customer',
      icon: <Edit className="h-4 w-4" />,
      onClick: (customer) => {
        setSelectedCustomer(customer);
        setShowCreateForm(true);
      },
      variant: 'ghost'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Modern Header with Professional Styling */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Customer Management
          </h1>
          <p className="text-muted-foreground">
            Manage customer relationships and track purchase history with professional tools
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {selectedRows.length > 0 && (
            <Badge variant="secondary" className="px-3 py-1">
              {selectedRows.length} selected
            </Badge>
          )}
          <Button 
            onClick={() => setShowCreateForm(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white shadow-sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Professional Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Customers</p>
                <p className="text-2xl font-bold text-foreground">
                  {displayCustomers?.length || 0}
                </p>
              </div>
              <Users className="h-8 w-8 text-primary-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-success-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Clear Status</p>
                <p className="text-2xl font-bold text-success-700">
                  {displayCustomers?.filter(c => c.current_debt === 0).length || 0}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-success-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-warning-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">With Debt</p>
                <p className="text-2xl font-bold text-warning-700">
                  {displayCustomers?.filter(c => c.current_debt > 0).length || 0}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-warning-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-info-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Purchases</p>
                <p className="text-2xl font-bold text-info-700">
                  {formatCurrency(displayCustomers?.reduce((sum, c) => sum + c.total_purchases, 0) || 0)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-info-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modern Data Table */}
      <Card className="shadow-sm">
        <CardHeader className="border-b border-border/50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold flex items-center space-x-2">
              <Users className="h-5 w-5 text-primary-600" />
              <span>Customer Directory</span>
            </CardTitle>
            {selectedRows.length > 0 && (
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </Button>
                <Button variant="outline" size="sm">
                  Export Selected
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            data={displayCustomers || []}
            columns={columns}
            actions={actions}
            loading={isLoading}
            emptyMessage={searchQuery ? 'No customers found matching your search criteria.' : 'No customers found. Add your first customer to get started.'}
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
        </CardContent>
      </Card>

      {/* Create/Edit Customer Form Dialog */}
      {showCreateForm && (
        <CustomerForm
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