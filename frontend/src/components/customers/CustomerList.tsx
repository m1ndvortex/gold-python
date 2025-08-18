import React, { useState, useMemo } from 'react';
import { Search, Plus, Phone, Mail, AlertTriangle, DollarSign } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Customers</h2>
          <p className="text-muted-foreground">
            Manage customer information and track purchase history
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search customers by name, phone, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {searchQuery.length === 0 && (
              <>
                <Select
                  value={filters.has_debt?.toString() || 'all'}
                  onValueChange={(value) => 
                    setFilters(prev => ({
                      ...prev,
                      has_debt: value === 'all' ? undefined : value === 'true'
                    }))
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Debt Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Customers</SelectItem>
                    <SelectItem value="true">With Debt</SelectItem>
                    <SelectItem value="false">No Debt</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={`${filters.sort_by}-${filters.sort_order}`}
                  onValueChange={(value) => {
                    const [sort_by, sort_order] = value.split('-');
                    setFilters(prev => ({ ...prev, sort_by, sort_order: sort_order as 'asc' | 'desc' }));
                  }}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at-desc">Newest First</SelectItem>
                    <SelectItem value="created_at-asc">Oldest First</SelectItem>
                    <SelectItem value="name-asc">Name A-Z</SelectItem>
                    <SelectItem value="name-desc">Name Z-A</SelectItem>
                    <SelectItem value="current_debt-desc">Highest Debt</SelectItem>
                    <SelectItem value="total_purchases-desc">Highest Purchases</SelectItem>
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
        </CardContent>
      </Card>     
 {/* Customer Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {displayCustomers ? `${displayCustomers.length} Customers` : 'Customers'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : !displayCustomers || displayCustomers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchQuery ? 'No customers found matching your search.' : 'No customers found.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Total Purchases</TableHead>
                    <TableHead>Current Debt</TableHead>
                    <TableHead>Last Purchase</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayCustomers.map((customer) => (
                    <TableRow
                      key={customer.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleCustomerClick(customer)}
                    >
                      <TableCell>
                        <div>
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-sm text-muted-foreground">
                            ID: {customer.id.slice(0, 8)}...
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {customer.phone && (
                            <div className="flex items-center text-sm">
                              <Phone className="h-3 w-3 mr-1" />
                              {customer.phone}
                            </div>
                          )}
                          {customer.email && (
                            <div className="flex items-center text-sm">
                              <Mail className="h-3 w-3 mr-1" />
                              {customer.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1 text-green-600" />
                          {formatCurrency(customer.total_purchases)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getDebtBadgeVariant(customer.current_debt)}>
                          {customer.current_debt > 0 && (
                            <AlertTriangle className="h-3 w-3 mr-1" />
                          )}
                          {formatCurrency(customer.current_debt)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {customer.last_purchase_date 
                          ? formatDate(customer.last_purchase_date)
                          : 'Never'
                        }
                      </TableCell>
                      <TableCell>
                        <Badge variant={customer.current_debt > 0 ? 'destructive' : 'secondary'}>
                          {customer.current_debt > 0 ? 'Has Debt' : 'Clear'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Customer Form Dialog */}
      {showCreateForm && (
        <CustomerForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => setShowCreateForm(false)}
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