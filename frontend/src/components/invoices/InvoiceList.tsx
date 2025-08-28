import React, { useState } from 'react';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  FileText,
  DollarSign,
  Calendar,
  Plus,
} from 'lucide-react';
import { useInvoices, useDeleteInvoice } from '../../hooks/useInvoices';
import { useCustomers } from '../../hooks/useCustomers';
import { useAuth } from '../../hooks/useAuth';
import { WithPermissions } from '../auth/WithPermissions';
import type { Invoice } from '../../types';
import type { InvoiceSearchFilters } from '../../services/invoiceApi';

interface InvoiceListProps {
  onCreateNew?: () => void;
  onViewInvoice?: (invoice: Invoice) => void;
  onEditInvoice?: (invoice: Invoice) => void;
  onAddPayment?: (invoice: Invoice) => void;
}

export const InvoiceList: React.FC<InvoiceListProps> = ({
  onCreateNew,
  onViewInvoice,
  onEditInvoice,
  onAddPayment,
}) => {
  const [filters, setFilters] = useState<InvoiceSearchFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [customerFilter, setCustomerFilter] = useState<string>('');
  const [page, setPage] = useState(0);
  const limit = 50;
  const { user, hasPermission } = useAuth();

  // Check permissions
  const canCreateInvoices = hasPermission('create_invoices');
  const canEditInvoices = hasPermission('edit_invoices');
  const canDeleteInvoices = hasPermission('delete_invoices');
  const canManagePayments = hasPermission('manage_payments');

  // API hooks
  const { data: invoices = [], isLoading, error } = useInvoices(
    {
      ...filters,
      invoice_number: searchTerm || undefined,
      status: statusFilter || undefined,
      customer_id: customerFilter || undefined,
    },
    page * limit,
    limit
  );
  
  const { data: customers = [] } = useCustomers();
  const deleteMutation = useDeleteInvoice();

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPage(0);
  };

  // Handle status filter
  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setPage(0);
  };

  // Handle customer filter
  const handleCustomerFilter = (customerId: string) => {
    setCustomerFilter(customerId);
    setPage(0);
  };

  // Handle date filters
  const handleDateFilter = (type: 'today' | 'week' | 'month' | 'all') => {
    const now = new Date();
    let startDate: string | undefined;
    
    switch (type) {
      case 'today':
        startDate = format(now, 'yyyy-MM-dd');
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        startDate = format(weekAgo, 'yyyy-MM-dd');
        break;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        startDate = format(monthAgo, 'yyyy-MM-dd');
        break;
      case 'all':
      default:
        startDate = undefined;
        break;
    }
    
    setFilters(prev => ({ ...prev, created_after: startDate }));
    setPage(0);
  };

  // Handle delete
  const handleDelete = (invoice: Invoice) => {
    if (invoice.paid_amount > 0) {
      alert('Cannot delete invoice with payments. Please cancel instead.');
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete invoice ${invoice.invoice_number}?`)) {
      deleteMutation.mutate(invoice.id);
    }
  };

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 shadow-sm">Paid</Badge>;
      case 'partially_paid':
        return <Badge className="bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 border-0 shadow-sm">Partially Paid</Badge>;
      case 'pending':
        return <Badge className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border-0 shadow-sm">Pending</Badge>;
      case 'cancelled':
        return <Badge className="bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border-0 shadow-sm">Cancelled</Badge>;
      default:
        return <Badge className="bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 border-0 shadow-sm">{status}</Badge>;
    }
  };

  // Get customer name
  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.name || 'Unknown Customer';
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-500">Error loading invoices: {error instanceof Error ? error.message : 'Unknown error'}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Invoices</h2>
        {onCreateNew && canCreateInvoices && (
          <Button 
            onClick={onCreateNew}
            className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Invoice
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-slate-50 to-slate-100/80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center shadow-lg">
              <Filter className="h-4 w-4 text-white" />
            </div>
            <span className="text-slate-700">Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search invoice number..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter || "all"} onValueChange={(value) => handleStatusFilter(value === "all" ? "" : value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="partially_paid">Partially Paid</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            {/* Customer Filter */}
            <Select value={customerFilter || "all"} onValueChange={(value) => handleCustomerFilter(value === "all" ? "" : value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Customers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customers</SelectItem>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date Filter */}
            <Select onValueChange={handleDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Dates" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Table */}
      <Card className="border-0 shadow-lg bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Paid Amount</TableHead>
                <TableHead>Remaining</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Loading invoices...
                  </TableCell>
                </TableRow>
              ) : invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    No invoices found
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((invoice: Invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {invoice.invoice_number}
                    </TableCell>
                    <TableCell>{getCustomerName(invoice.customer_id)}</TableCell>
                    <TableCell>
                      {format(new Date(invoice.created_at), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>${invoice.total_amount.toFixed(2)}</TableCell>
                    <TableCell>${invoice.paid_amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <span className={invoice.remaining_amount > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                        ${invoice.remaining_amount.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {onViewInvoice && (
                            <DropdownMenuItem onClick={() => onViewInvoice(invoice)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                          )}
                          {onEditInvoice && canEditInvoices && invoice.status !== 'cancelled' && (
                            <DropdownMenuItem onClick={() => onEditInvoice(invoice)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {onAddPayment && canManagePayments && invoice.remaining_amount > 0 && (
                            <DropdownMenuItem onClick={() => onAddPayment(invoice)}>
                              <DollarSign className="mr-2 h-4 w-4" />
                              Add Payment
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem>
                            <FileText className="mr-2 h-4 w-4" />
                            Generate PDF
                          </DropdownMenuItem>
                          {canDeleteInvoices && invoice.paid_amount === 0 && (
                            <DropdownMenuItem
                              onClick={() => handleDelete(invoice)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {invoices.length === limit && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setPage(prev => prev + 1)}
            disabled={isLoading}
            className="border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400 transition-all duration-300"
          >
            Load More
          </Button>
        </div>
      )}
    </div>
  );
};