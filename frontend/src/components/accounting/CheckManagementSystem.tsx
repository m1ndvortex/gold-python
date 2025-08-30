import React, { useState } from 'react';
import { useEnhancedAccounting } from '../../hooks/useEnhancedAccounting';
import { useLanguage } from '../../hooks/useLanguage';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

import { 
  PlusIcon, 
  EditIcon, 
  TrashIcon, 
  SearchIcon,
  RefreshCwIcon,
  CreditCardIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertTriangleIcon,
  ClockIcon,
  BanknoteIcon,

  TrendingUpIcon,
  TrendingDownIcon,
  FilterIcon,
  DownloadIcon
} from 'lucide-react';
import { CheckManagement, CheckManagementCreate, CheckFilters } from '../../types/accounting';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { DatePicker } from '../ui/date-picker';

export const CheckManagementSystem: React.FC = () => {
  const { t } = useLanguage();
  const { 
    useChecks, 
    useCreateCheck, 
    useUpdateCheck, 
    useUpdateCheckStatus,
    useDeleteCheck,
    useSubsidiaryAccounts
  } = useEnhancedAccounting();

  const [filters, setFilters] = useState<CheckFilters>({});
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [selectedCheck, setSelectedCheck] = useState<CheckManagement | null>(null);
  const [newCheck, setNewCheck] = useState<CheckManagementCreate>({
    check_number: '',
    bank_name: '',
    check_amount: 0,
    check_date: new Date().toISOString().split('T')[0],
    due_date: new Date().toISOString().split('T')[0],
    check_type: 'received'
  });

  // Fetch data
  const { data: checks, isLoading, refetch } = useChecks(filters);
  const createCheckMutation = useCreateCheck();
  const updateStatusMutation = useUpdateCheckStatus();
  const deleteCheckMutation = useDeleteCheck();

  const handleCreateCheck = async () => {
    try {
      await createCheckMutation.mutateAsync(newCheck);
      toast.success(t('check_created_successfully'));
      setIsCreateDialogOpen(false);
      setNewCheck({
        check_number: '',
        bank_name: '',
        check_amount: 0,
        check_date: new Date().toISOString().split('T')[0],
        due_date: new Date().toISOString().split('T')[0],
        check_type: 'received'
      });
      refetch();
    } catch (error) {
      toast.error(t('error_creating_check'));
    }
  };

  const handleUpdateStatus = async (checkId: string, status: string) => {
    try {
      await updateStatusMutation.mutateAsync({ checkId, status });
      toast.success(t('check_status_updated'));
      setIsStatusDialogOpen(false);
      refetch();
    } catch (error) {
      toast.error(t('error_updating_check_status'));
    }
  };

  const handleDeleteCheck = async (checkId: string) => {
    if (window.confirm(t('confirm_delete_check'))) {
      try {
        await deleteCheckMutation.mutateAsync(checkId);
        toast.success(t('check_deleted_successfully'));
        refetch();
      } catch (error) {
        toast.error(t('error_deleting_check'));
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-gradient-to-r from-yellow-500 to-orange-500', icon: ClockIcon, text: t('pending') },
      deposited: { color: 'bg-gradient-to-r from-blue-500 to-indigo-500', icon: BanknoteIcon, text: t('deposited') },
      cleared: { color: 'bg-gradient-to-r from-green-500 to-teal-500', icon: CheckCircleIcon, text: t('cleared') },
      bounced: { color: 'bg-gradient-to-r from-red-500 to-pink-500', icon: XCircleIcon, text: t('bounced') },
      cancelled: { color: 'bg-gradient-to-r from-gray-500 to-slate-500', icon: AlertTriangleIcon, text: t('cancelled') }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} text-white shadow-lg hover:shadow-xl transition-all duration-300`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    return type === 'received' ? (
      <Badge className="bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-lg">
        <TrendingUpIcon className="w-3 h-3 mr-1" />
        {t('received')}
      </Badge>
    ) : (
      <Badge className="bg-gradient-to-r from-purple-500 to-violet-500 text-white shadow-lg">
        <TrendingDownIcon className="w-3 h-3 mr-1" />
        {t('issued')}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-white/20 to-white/10 flex items-center justify-center">
              <CreditCardIcon className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{t('check_management')}</h1>
              <p className="text-blue-100">{t('manage_received_issued_checks')}</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              {t('add_check')}
            </Button>
            <Button
              onClick={() => refetch()}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10 shadow-lg"
            >
              <RefreshCwIcon className="w-4 h-4 mr-2" />
              {t('refresh')}
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-slate-50 to-slate-100/80">
        <CardHeader>
          <CardTitle className="flex items-center text-slate-700">
            <FilterIcon className="w-5 h-5 mr-2" />
            {t('filters')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label>{t('check_type')}</Label>
              <Select
                value={filters.check_type || ''}
                onValueChange={(value) => setFilters({ ...filters, check_type: value as 'received' | 'issued' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('select_type')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="received">{t('received')}</SelectItem>
                  <SelectItem value="issued">{t('issued')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('status')}</Label>
              <Select
                value={filters.check_status || ''}
                onValueChange={(value) => setFilters({ ...filters, check_status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('select_status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">{t('pending')}</SelectItem>
                  <SelectItem value="deposited">{t('deposited')}</SelectItem>
                  <SelectItem value="cleared">{t('cleared')}</SelectItem>
                  <SelectItem value="bounced">{t('bounced')}</SelectItem>
                  <SelectItem value="cancelled">{t('cancelled')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('bank_name')}</Label>
              <Input
                placeholder={t('enter_bank_name')}
                value={filters.bank_name || ''}
                onChange={(e) => setFilters({ ...filters, bank_name: e.target.value })}
              />
            </div>
            <div>
              <Label>{t('search')}</Label>
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder={t('search_checks')}
                  value={filters.search_term || ''}
                  onChange={(e) => setFilters({ ...filters, search_term: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checks Table */}
      <Card className="border-0 shadow-xl bg-white hover:shadow-2xl transition-all duration-300">
        <CardHeader className="bg-gradient-to-r from-slate-50 via-slate-50 to-slate-100 rounded-t-lg">
          <div className="flex items-center justify-between">
            <CardTitle className="text-slate-700">{t('checks_list')}</CardTitle>
            <Button variant="outline" size="sm">
              <DownloadIcon className="w-4 h-4 mr-2" />
              {t('export')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <RefreshCwIcon className="w-8 h-8 animate-spin mx-auto text-blue-500" />
              <p className="mt-2 text-gray-500">{t('loading_checks')}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100">
                  <TableHead>{t('check_number')}</TableHead>
                  <TableHead>{t('bank_name')}</TableHead>
                  <TableHead>{t('amount')}</TableHead>
                  <TableHead>{t('check_date')}</TableHead>
                  <TableHead>{t('due_date')}</TableHead>
                  <TableHead>{t('type')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                  <TableHead>{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {checks?.map((check) => (
                  <TableRow key={check.id} className="hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-indigo-50/30 transition-all duration-200">
                    <TableCell className="font-medium">{check.check_number}</TableCell>
                    <TableCell>{check.bank_name}</TableCell>
                    <TableCell className="font-semibold text-green-600">
                      {check.check_amount.toLocaleString()} {t('currency')}
                    </TableCell>
                    <TableCell>{format(new Date(check.check_date), 'yyyy-MM-dd')}</TableCell>
                    <TableCell>{format(new Date(check.due_date), 'yyyy-MM-dd')}</TableCell>
                    <TableCell>{getTypeBadge(check.check_type)}</TableCell>
                    <TableCell>{getStatusBadge(check.check_status)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedCheck(check);
                            setIsStatusDialogOpen(true);
                          }}
                          className="hover:bg-blue-50 hover:border-blue-300"
                        >
                          <EditIcon className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteCheck(check.id)}
                          className="hover:bg-red-50 hover:border-red-300 text-red-600"
                        >
                          <TrashIcon className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Check Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center text-blue-700">
              <PlusIcon className="w-5 h-5 mr-2" />
              {t('add_new_check')}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div>
              <Label>{t('check_number')}</Label>
              <Input
                value={newCheck.check_number}
                onChange={(e) => setNewCheck({ ...newCheck, check_number: e.target.value })}
                placeholder={t('enter_check_number')}
              />
            </div>
            <div>
              <Label>{t('bank_name')}</Label>
              <Input
                value={newCheck.bank_name}
                onChange={(e) => setNewCheck({ ...newCheck, bank_name: e.target.value })}
                placeholder={t('enter_bank_name')}
              />
            </div>
            <div>
              <Label>{t('check_amount')}</Label>
              <Input
                type="number"
                value={newCheck.check_amount}
                onChange={(e) => setNewCheck({ ...newCheck, check_amount: parseFloat(e.target.value) || 0 })}
                placeholder={t('enter_amount')}
              />
            </div>
            <div>
              <Label>{t('check_type')}</Label>
              <Select
                value={newCheck.check_type}
                onValueChange={(value) => setNewCheck({ ...newCheck, check_type: value as 'received' | 'issued' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="received">{t('received')}</SelectItem>
                  <SelectItem value="issued">{t('issued')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('check_date')}</Label>
              <DatePicker
                selected={new Date(newCheck.check_date)}
                onSelect={(date) => setNewCheck({ ...newCheck, check_date: date?.toISOString().split('T')[0] || '' })}
              />
            </div>
            <div>
              <Label>{t('due_date')}</Label>
              <DatePicker
                selected={new Date(newCheck.due_date)}
                onSelect={(date) => setNewCheck({ ...newCheck, due_date: date?.toISOString().split('T')[0] || '' })}
              />
            </div>
            <div className="md:col-span-2">
              <Label>{t('notes')}</Label>
              <Textarea
                value={newCheck.notes || ''}
                onChange={(e) => setNewCheck({ ...newCheck, notes: e.target.value })}
                placeholder={t('enter_notes')}
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              {t('cancel')}
            </Button>
            <Button
              onClick={handleCreateCheck}
              disabled={createCheckMutation.isPending}
              className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl"
            >
              {createCheckMutation.isPending ? (
                <RefreshCwIcon className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <PlusIcon className="w-4 h-4 mr-2" />
              )}
              {t('create_check')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center text-blue-700">
              <EditIcon className="w-5 h-5 mr-2" />
              {t('update_check_status')}
            </DialogTitle>
          </DialogHeader>
          {selectedCheck && (
            <div className="py-4">
              <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                <p className="font-medium">{t('check_number')}: {selectedCheck.check_number}</p>
                <p className="text-sm text-gray-600">{t('bank')}: {selectedCheck.bank_name}</p>
                <p className="text-sm text-gray-600">{t('amount')}: {selectedCheck.check_amount.toLocaleString()} {t('currency')}</p>
              </div>
              <div>
                <Label>{t('new_status')}</Label>
                <Select onValueChange={(value) => handleUpdateStatus(selectedCheck.id, value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('select_new_status')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">{t('pending')}</SelectItem>
                    <SelectItem value="deposited">{t('deposited')}</SelectItem>
                    <SelectItem value="cleared">{t('cleared')}</SelectItem>
                    <SelectItem value="bounced">{t('bounced')}</SelectItem>
                    <SelectItem value="cancelled">{t('cancelled')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};