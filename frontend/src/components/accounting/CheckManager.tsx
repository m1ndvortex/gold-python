/**
 * Check Management Component (مدیریت چک‌ها)
 * Complete check lifecycle and status tracking
 */

import React, { useState, useMemo } from 'react';
import { useEnhancedAccounting } from '../../hooks/useEnhancedAccounting';
import { useLanguage } from '../../hooks/useLanguage';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { 
  PlusIcon, 
  EditIcon, 
  TrashIcon, 
  SearchIcon,
  CreditCardIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  AlertTriangleIcon,
  DollarSignIcon,
  CalendarIcon,
  BanknoteIcon,
  UserIcon,
  BuildingIcon,
  FileTextIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  FilterIcon,
  EyeIcon,
  DownloadIcon,
  RefreshCwIcon
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { CheckManagement, CheckManagementCreate, CheckFilters } from '../../types/accounting';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface CheckManagerProps {
  className?: string;
}

export const CheckManager: React.FC<CheckManagerProps> = ({ className }) => {
  const { t } = useLanguage();
  const {
    useChecks,
    useCreateCheck,
    useUpdateCheck,
    useUpdateCheckStatus,
    useDeleteCheck,
    useSubsidiaryAccounts
  } = useEnhancedAccounting();

  const [filters, setFilters] = useState<CheckFilters>({
    page: 1,
    limit: 50
  });
  const [selectedCheck, setSelectedCheck] = useState<CheckManagement | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [statusUpdateDialog, setStatusUpdateDialog] = useState<{
    isOpen: boolean;
    checkId: string;
    currentStatus: string;
  }>({ isOpen: false, checkId: '', currentStatus: '' });

  const { data: checks = [], isLoading, error } = useChecks(filters);
  const { data: subsidiaryAccounts = [] } = useSubsidiaryAccounts();
  
  const createCheckMutation = useCreateCheck();
  const updateCheckMutation = useUpdateCheck();
  const updateCheckStatusMutation = useUpdateCheckStatus();
  const deleteCheckMutation = useDeleteCheck();

  // Check status configuration
  const statusConfig = {
    pending: { 
      icon: ClockIcon, 
      color: 'text-yellow-600', 
      bgColor: 'bg-yellow-100', 
      label: 'Pending',
      labelPersian: 'در انتظار'
    },
    deposited: { 
      icon: BanknoteIcon, 
      color: 'text-blue-600', 
      bgColor: 'bg-blue-100', 
      label: 'Deposited',
      labelPersian: 'واریز شده'
    },
    cleared: { 
      icon: CheckCircleIcon, 
      color: 'text-green-600', 
      bgColor: 'bg-green-100', 
      label: 'Cleared',
      labelPersian: 'تسویه شده'
    },
    bounced: { 
      icon: XCircleIcon, 
      color: 'text-red-600', 
      bgColor: 'bg-red-100', 
      label: 'Bounced',
      labelPersian: 'برگشتی'
    },
    cancelled: { 
      icon: AlertTriangleIcon, 
      color: 'text-gray-600', 
      bgColor: 'bg-gray-100', 
      label: 'Cancelled',
      labelPersian: 'لغو شده'
    }
  };

  const handleCreateCheck = async (checkData: CheckManagementCreate | Partial<CheckManagementCreate>) => {
    try {
      // Type guard to ensure we have the required fields for creation
      if (checkData.check_number && checkData.bank_name && checkData.check_amount !== undefined && checkData.check_date && checkData.due_date && checkData.check_type) {
        await createCheckMutation.mutateAsync(checkData as CheckManagementCreate);
        toast.success('Check created successfully');
        setIsCreateDialogOpen(false);
      } else {
        throw new Error('Invalid check data for creation');
      }
    } catch (error) {
      toast.error('Failed to create check');
    }
  };

  const handleUpdateCheck = async (checkData: Partial<CheckManagementCreate>) => {
    if (!selectedCheck) return;
    
    try {
      await updateCheckMutation.mutateAsync({
        checkId: selectedCheck.id,
        checkData
      });
      toast.success('Check updated successfully');
      setIsEditDialogOpen(false);
      setSelectedCheck(null);
    } catch (error) {
      toast.error('Failed to update check');
    }
  };

  const handleUpdateStatus = async (checkId: string, status: string, notes?: string) => {
    try {
      await updateCheckStatusMutation.mutateAsync({ checkId, status, notes });
      toast.success('Check status updated successfully');
      setStatusUpdateDialog({ isOpen: false, checkId: '', currentStatus: '' });
    } catch (error) {
      toast.error('Failed to update check status');
    }
  };

  const handleDeleteCheck = async (checkId: string) => {
    if (!window.confirm('Are you sure you want to delete this check? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteCheckMutation.mutateAsync(checkId);
      toast.success('Check deleted successfully');
    } catch (error) {
      toast.error('Failed to delete check');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getStatusBadge = (check: CheckManagement) => {
    const config = statusConfig[check.check_status as keyof typeof statusConfig];
    if (!config) return null;

    const StatusIcon = config.icon;
    return (
      <Badge variant="outline" className={cn("text-xs", config.color)}>
        <StatusIcon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getCheckTypeBadge = (checkType: string) => {
    return checkType === 'received' ? (
      <Badge variant="default" className="bg-green-100 text-green-700">
        <TrendingUpIcon className="h-3 w-3 mr-1" />
        Received
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-blue-100 text-blue-700">
        <TrendingDownIcon className="h-3 w-3 mr-1" />
        Issued
      </Badge>
    );
  };

  // Summary statistics
  const checkSummary = useMemo(() => {
    const summary = {
      total: checks.length,
      totalAmount: 0,
      pending: 0,
      deposited: 0,
      cleared: 0,
      bounced: 0,
      cancelled: 0,
      received: 0,
      issued: 0,
      overdueCount: 0
    };

    const today = new Date();
    
    checks.forEach(check => {
      summary.totalAmount += check.check_amount;
      summary[check.check_status as keyof typeof summary]++;
      summary[check.check_type as keyof typeof summary]++;
      
      if (check.check_status === 'pending' && new Date(check.due_date) < today) {
        summary.overdueCount++;
      }
    });

    return summary;
  }, [checks]);

  if (isLoading) {
    return (
      <Card className={cn("border-0 shadow-lg", className)}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn("border-0 shadow-lg border-red-200 bg-red-50", className)}>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <AlertTriangleIcon className="h-6 w-6 text-red-600" />
            <div>
              <h3 className="text-lg font-semibold text-red-800">Error Loading Checks</h3>
              <p className="text-red-600">Unable to load check data. Please try again.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">Total Checks</p>
                <p className="text-2xl font-bold text-blue-900">{checkSummary.total}</p>
              </div>
              <CreditCardIcon className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Total Amount</p>
                <p className="text-2xl font-bold text-green-900">{formatCurrency(checkSummary.totalAmount)}</p>
              </div>
              <DollarSignIcon className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-yellow-100/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-800">Pending</p>
                <p className="text-2xl font-bold text-yellow-900">{checkSummary.pending}</p>
              </div>
              <ClockIcon className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-800">Overdue</p>
                <p className="text-2xl font-bold text-red-900">{checkSummary.overdueCount}</p>
              </div>
              <AlertTriangleIcon className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header and Controls */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50/30 to-white">
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg">
                <CreditCardIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold">Check Management</CardTitle>
                <p className="text-sm text-muted-foreground">مدیریت چک‌ها - Complete check lifecycle tracking</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline-gradient-purple" size="sm" className="gap-2">
                <DownloadIcon className="h-4 w-4" />
                Export
              </Button>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="gradient-purple" className="gap-2">
                    <PlusIcon className="h-4 w-4" />
                    New Check
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Check</DialogTitle>
                  </DialogHeader>
                  <CheckForm
                    onSubmit={handleCreateCheck}
                    onCancel={() => setIsCreateDialogOpen(false)}
                    subsidiaryAccounts={subsidiaryAccounts}
                    isLoading={createCheckMutation.isPending}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search checks..."
                  value={filters.search_term || ''}
                  onChange={(e) => setFilters({ ...filters, search_term: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={filters.check_type || 'all'}
                onValueChange={(value) => setFilters({ ...filters, check_type: value === 'all' ? undefined : value as 'received' | 'issued' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="issued">Issued</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={filters.check_status || 'all'}
                onValueChange={(value) => setFilters({ ...filters, check_status: value === 'all' ? undefined : value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="deposited">Deposited</SelectItem>
                  <SelectItem value="cleared">Cleared</SelectItem>
                  <SelectItem value="bounced">Bounced</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Bank</Label>
              <Input
                placeholder="Bank name..."
                value={filters.bank_name || ''}
                onChange={(e) => setFilters({ ...filters, bank_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Amount Range</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.min_amount || ''}
                  onChange={(e) => setFilters({ ...filters, min_amount: parseFloat(e.target.value) || undefined })}
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.max_amount || ''}
                  onChange={(e) => setFilters({ ...filters, max_amount: parseFloat(e.target.value) || undefined })}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checks Table */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Check #</TableHead>
                  <TableHead className="font-semibold">Type</TableHead>
                  <TableHead className="font-semibold">Bank</TableHead>
                  <TableHead className="font-semibold">Amount</TableHead>
                  <TableHead className="font-semibold">Check Date</TableHead>
                  <TableHead className="font-semibold">Due Date</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Parties</TableHead>
                  <TableHead className="font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {checks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <CreditCardIcon className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No checks found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  checks.map((check) => {
                    const isOverdue = check.check_status === 'pending' && new Date(check.due_date) < new Date();
                    
                    return (
                      <TableRow key={check.id} className={cn("hover:bg-gray-50", isOverdue && "bg-red-50")}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {isOverdue && <AlertTriangleIcon className="h-4 w-4 text-red-500" />}
                            {check.check_number}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getCheckTypeBadge(check.check_type)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <BuildingIcon className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{check.bank_name}</div>
                              {check.bank_name_persian && (
                                <div className="text-xs text-muted-foreground" dir="rtl">
                                  {check.bank_name_persian}
                                </div>
                              )}
                              {check.branch_name && (
                                <div className="text-xs text-muted-foreground">{check.branch_name}</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(check.check_amount)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                            {format(new Date(check.check_date), 'MMM dd, yyyy')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                            <span className={cn(isOverdue && "text-red-600 font-medium")}>
                              {format(new Date(check.due_date), 'MMM dd, yyyy')}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {getStatusBadge(check)}
                            {check.is_post_dated && (
                              <Badge variant="outline" className="text-xs">
                                Post-dated
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {check.drawer_name && (
                              <div className="flex items-center gap-1 text-sm">
                                <UserIcon className="h-3 w-3 text-muted-foreground" />
                                <span>From: {check.drawer_name}</span>
                              </div>
                            )}
                            {check.payee_name && (
                              <div className="flex items-center gap-1 text-sm">
                                <UserIcon className="h-3 w-3 text-muted-foreground" />
                                <span>To: {check.payee_name}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedCheck(check);
                                setIsViewDialogOpen(true);
                              }}
                            >
                              <EyeIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedCheck(check);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <EditIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setStatusUpdateDialog({
                                isOpen: true,
                                checkId: check.id,
                                currentStatus: check.check_status
                              })}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <RefreshCwIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteCheck(check.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* View Check Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Check Details</DialogTitle>
          </DialogHeader>
          {selectedCheck && (
            <CheckView
              check={selectedCheck}
              onClose={() => {
                setIsViewDialogOpen(false);
                setSelectedCheck(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Check Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Check</DialogTitle>
          </DialogHeader>
          {selectedCheck && (
            <CheckForm
              check={selectedCheck}
              onSubmit={handleUpdateCheck}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setSelectedCheck(null);
              }}
              subsidiaryAccounts={subsidiaryAccounts}
              isLoading={updateCheckMutation.isPending}
              isEdit
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={statusUpdateDialog.isOpen} onOpenChange={(open) => 
        setStatusUpdateDialog({ ...statusUpdateDialog, isOpen: open })
      }>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Check Status</DialogTitle>
          </DialogHeader>
          <StatusUpdateForm
            checkId={statusUpdateDialog.checkId}
            currentStatus={statusUpdateDialog.currentStatus}
            onSubmit={handleUpdateStatus}
            onCancel={() => setStatusUpdateDialog({ isOpen: false, checkId: '', currentStatus: '' })}
            isLoading={updateCheckStatusMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Check Form Component
interface CheckFormProps {
  check?: CheckManagement;
  onSubmit: (data: CheckManagementCreate | Partial<CheckManagementCreate>) => void;
  onCancel: () => void;
  subsidiaryAccounts: any[];
  isLoading: boolean;
  isEdit?: boolean;
}

const CheckForm: React.FC<CheckFormProps> = ({
  check,
  onSubmit,
  onCancel,
  subsidiaryAccounts,
  isLoading,
  isEdit = false
}) => {
  const [formData, setFormData] = useState({
    check_number: check?.check_number || '',
    bank_name: check?.bank_name || '',
    bank_name_persian: check?.bank_name_persian || '',
    branch_name: check?.branch_name || '',
    check_amount: check?.check_amount || 0,
    check_date: check?.check_date || new Date().toISOString().split('T')[0],
    due_date: check?.due_date || new Date().toISOString().split('T')[0],
    check_type: check?.check_type || 'received',
    drawer_name: check?.drawer_name || '',
    drawer_account: check?.drawer_account || '',
    payee_name: check?.payee_name || '',
    subsidiary_account_id: check?.subsidiary_account_id || '',
    is_post_dated: check?.is_post_dated || false,
    notes: check?.notes || '',
    notes_persian: check?.notes_persian || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="check_number">Check Number *</Label>
          <Input
            id="check_number"
            value={formData.check_number}
            onChange={(e) => setFormData({ ...formData, check_number: e.target.value })}
            placeholder="Check number"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="check_type">Check Type *</Label>
          <Select
            value={formData.check_type}
            onValueChange={(value) => setFormData({ ...formData, check_type: value as 'received' | 'issued' })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="received">Received</SelectItem>
              <SelectItem value="issued">Issued</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="bank_name">Bank Name *</Label>
          <Input
            id="bank_name"
            value={formData.bank_name}
            onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
            placeholder="Bank name"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bank_name_persian">Bank Name (Persian)</Label>
          <Input
            id="bank_name_persian"
            value={formData.bank_name_persian}
            onChange={(e) => setFormData({ ...formData, bank_name_persian: e.target.value })}
            placeholder="نام بانک"
            dir="rtl"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="branch_name">Branch Name</Label>
          <Input
            id="branch_name"
            value={formData.branch_name}
            onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })}
            placeholder="Branch name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="check_amount">Check Amount *</Label>
          <Input
            id="check_amount"
            type="number"
            step="0.01"
            value={formData.check_amount}
            onChange={(e) => setFormData({ ...formData, check_amount: parseFloat(e.target.value) || 0 })}
            placeholder="0.00"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="check_date">Check Date *</Label>
          <Input
            id="check_date"
            type="date"
            value={formData.check_date}
            onChange={(e) => setFormData({ ...formData, check_date: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="due_date">Due Date *</Label>
          <Input
            id="due_date"
            type="date"
            value={formData.due_date}
            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="drawer_name">Drawer Name</Label>
          <Input
            id="drawer_name"
            value={formData.drawer_name}
            onChange={(e) => setFormData({ ...formData, drawer_name: e.target.value })}
            placeholder="Check writer"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="payee_name">Payee Name</Label>
          <Input
            id="payee_name"
            value={formData.payee_name}
            onChange={(e) => setFormData({ ...formData, payee_name: e.target.value })}
            placeholder="Check recipient"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="subsidiary_account_id">Subsidiary Account</Label>
        <Select
          value={formData.subsidiary_account_id}
          onValueChange={(value) => setFormData({ ...formData, subsidiary_account_id: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select subsidiary account" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">No Subsidiary Account</SelectItem>
            {subsidiaryAccounts.map(account => (
              <SelectItem key={account.id} value={account.id}>
                {account.subsidiary_code} - {account.subsidiary_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Additional notes..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes_persian">Notes (Persian)</Label>
        <Textarea
          id="notes_persian"
          value={formData.notes_persian}
          onChange={(e) => setFormData({ ...formData, notes_persian: e.target.value })}
          placeholder="یادداشت‌های اضافی..."
          rows={3}
          dir="rtl"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="is_post_dated"
          checked={formData.is_post_dated}
          onCheckedChange={(checked) => setFormData({ ...formData, is_post_dated: checked })}
        />
        <Label htmlFor="is_post_dated">Post-dated Check</Label>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="gradient-purple" disabled={isLoading}>
          {isLoading ? 'Saving...' : (isEdit ? 'Update Check' : 'Create Check')}
        </Button>
      </div>
    </form>
  );
};

// Check View Component
interface CheckViewProps {
  check: CheckManagement;
  onClose: () => void;
}

const CheckView: React.FC<CheckViewProps> = ({ check, onClose }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const statusConfig = {
    pending: { icon: ClockIcon, color: 'text-yellow-600', bgColor: 'bg-yellow-100', label: 'Pending' },
    deposited: { icon: BanknoteIcon, color: 'text-blue-600', bgColor: 'bg-blue-100', label: 'Deposited' },
    cleared: { icon: CheckCircleIcon, color: 'text-green-600', bgColor: 'bg-green-100', label: 'Cleared' },
    bounced: { icon: XCircleIcon, color: 'text-red-600', bgColor: 'bg-red-100', label: 'Bounced' },
    cancelled: { icon: AlertTriangleIcon, color: 'text-gray-600', bgColor: 'bg-gray-100', label: 'Cancelled' }
  };

  const config = statusConfig[check.check_status as keyof typeof statusConfig];
  const StatusIcon = config?.icon || ClockIcon;

  return (
    <div className="space-y-6">
      {/* Check Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Check Number</Label>
          <p className="font-semibold text-lg">{check.check_number}</p>
        </div>
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Amount</Label>
          <p className="font-semibold text-lg">{formatCurrency(check.check_amount)}</p>
        </div>
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Type</Label>
          <div className="mt-1">
            {check.check_type === 'received' ? (
              <Badge variant="default" className="bg-green-100 text-green-700">
                <TrendingUpIcon className="h-3 w-3 mr-1" />
                Received
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                <TrendingDownIcon className="h-3 w-3 mr-1" />
                Issued
              </Badge>
            )}
          </div>
        </div>
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Status</Label>
          <div className="mt-1">
            <Badge variant="outline" className={cn("text-xs", config?.color)}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {config?.label}
            </Badge>
          </div>
        </div>
      </div>

      {/* Bank Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Bank Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Bank Name</Label>
            <p className="font-medium">{check.bank_name}</p>
            {check.bank_name_persian && (
              <p className="text-sm text-muted-foreground" dir="rtl">{check.bank_name_persian}</p>
            )}
          </div>
          {check.branch_name && (
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Branch</Label>
              <p className="font-medium">{check.branch_name}</p>
            </div>
          )}
        </div>
      </div>

      {/* Dates */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Important Dates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Check Date</Label>
            <p className="font-medium">{format(new Date(check.check_date), 'MMM dd, yyyy')}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Due Date</Label>
            <p className="font-medium">{format(new Date(check.due_date), 'MMM dd, yyyy')}</p>
          </div>
          {check.deposit_date && (
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Deposit Date</Label>
              <p className="font-medium">{format(new Date(check.deposit_date), 'MMM dd, yyyy')}</p>
            </div>
          )}
          {check.clear_date && (
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Clear Date</Label>
              <p className="font-medium">{format(new Date(check.clear_date), 'MMM dd, yyyy')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Parties */}
      {(check.drawer_name || check.payee_name) && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Parties Involved</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {check.drawer_name && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Drawer (Check Writer)</Label>
                <p className="font-medium">{check.drawer_name}</p>
                {check.drawer_account && (
                  <p className="text-sm text-muted-foreground">Account: {check.drawer_account}</p>
                )}
              </div>
            )}
            {check.payee_name && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Payee (Recipient)</Label>
                <p className="font-medium">{check.payee_name}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notes */}
      {(check.notes || check.notes_persian) && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Notes</h3>
          {check.notes && (
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Notes</Label>
              <p className="text-sm">{check.notes}</p>
            </div>
          )}
          {check.notes_persian && (
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Notes (Persian)</Label>
              <p className="text-sm" dir="rtl">{check.notes_persian}</p>
            </div>
          )}
        </div>
      )}

      {/* Additional Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Additional Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Post-dated</Label>
            <p className="font-medium">{check.is_post_dated ? 'Yes' : 'No'}</p>
          </div>
          {check.bounce_fee > 0 && (
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Bounce Fee</Label>
              <p className="font-medium text-red-600">{formatCurrency(check.bounce_fee)}</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={onClose}>Close</Button>
      </div>
    </div>
  );
};

// Status Update Form Component
interface StatusUpdateFormProps {
  checkId: string;
  currentStatus: string;
  onSubmit: (checkId: string, status: string, notes?: string) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const StatusUpdateForm: React.FC<StatusUpdateFormProps> = ({
  checkId,
  currentStatus,
  onSubmit,
  onCancel,
  isLoading
}) => {
  const [newStatus, setNewStatus] = useState(currentStatus);
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(checkId, newStatus, notes);
  };

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'deposited', label: 'Deposited' },
    { value: 'cleared', label: 'Cleared' },
    { value: 'bounced', label: 'Bounced' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="status">New Status *</Label>
        <Select value={newStatus} onValueChange={setNewStatus}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Status change notes..."
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="gradient-purple" disabled={isLoading}>
          {isLoading ? 'Updating...' : 'Update Status'}
        </Button>
      </div>
    </form>
  );
};