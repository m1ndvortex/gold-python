/**
 * Chart of Accounts Management Component
 * Hierarchical account structure management with Persian terminology
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
  FolderIcon,
  FolderOpenIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  BookOpenIcon,
  DollarSignIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ScaleIcon,
  CreditCardIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  FilterIcon
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { ChartOfAccount, ChartOfAccountCreate, ChartOfAccountUpdate } from '../../types/accounting';
import { toast } from 'sonner';

interface ChartOfAccountsManagerProps {
  className?: string;
}

export const ChartOfAccountsManager: React.FC<ChartOfAccountsManagerProps> = ({ className }) => {
  const { t } = useLanguage();
  const {
    useChartOfAccounts,
    useCreateChartOfAccount,
    useUpdateChartOfAccount,
    useDeleteChartOfAccount
  } = useEnhancedAccounting();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccountType, setSelectedAccountType] = useState<string>('all');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedAccount, setSelectedAccount] = useState<ChartOfAccount | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { data: accounts = [], isLoading, error } = useChartOfAccounts(includeInactive);
  const createAccountMutation = useCreateChartOfAccount();
  const updateAccountMutation = useUpdateChartOfAccount();
  const deleteAccountMutation = useDeleteChartOfAccount();

  // Account type icons and colors
  const accountTypeConfig = {
    asset: { icon: TrendingUpIcon, color: 'text-green-600', bgColor: 'bg-green-100', label: 'Assets' },
    liability: { icon: TrendingDownIcon, color: 'text-red-600', bgColor: 'bg-red-100', label: 'Liabilities' },
    equity: { icon: ScaleIcon, color: 'text-blue-600', bgColor: 'bg-blue-100', label: 'Equity' },
    revenue: { icon: DollarSignIcon, color: 'text-emerald-600', bgColor: 'bg-emerald-100', label: 'Revenue' },
    expense: { icon: CreditCardIcon, color: 'text-orange-600', bgColor: 'bg-orange-100', label: 'Expenses' }
  };

  // Filter and organize accounts
  const filteredAccounts = useMemo(() => {
    let filtered = accounts.filter(account => {
      const matchesSearch = searchTerm === '' || 
        account.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.account_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (account.account_name_persian && account.account_name_persian.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesType = selectedAccountType === 'all' || account.account_type === selectedAccountType;
      
      return matchesSearch && matchesType;
    });

    // Build hierarchical structure
    const accountMap = new Map<string, ChartOfAccount & { children: ChartOfAccount[] }>();
    const rootAccounts: (ChartOfAccount & { children: ChartOfAccount[] })[] = [];

    // Initialize all accounts with children array
    filtered.forEach(account => {
      accountMap.set(account.id, { ...account, children: [] });
    });

    // Build hierarchy
    filtered.forEach(account => {
      const accountWithChildren = accountMap.get(account.id)!;
      if (account.parent_account_id && accountMap.has(account.parent_account_id)) {
        accountMap.get(account.parent_account_id)!.children.push(accountWithChildren);
      } else {
        rootAccounts.push(accountWithChildren);
      }
    });

    return rootAccounts.sort((a, b) => a.account_code.localeCompare(b.account_code));
  }, [accounts, searchTerm, selectedAccountType]);

  const toggleExpanded = (accountId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(accountId)) {
      newExpanded.delete(accountId);
    } else {
      newExpanded.add(accountId);
    }
    setExpandedNodes(newExpanded);
  };

  const handleCreateAccount = async (accountData: ChartOfAccountCreate) => {
    try {
      await createAccountMutation.mutateAsync(accountData);
      toast.success('Account created successfully');
      setIsCreateDialogOpen(false);
    } catch (error) {
      toast.error('Failed to create account');
    }
  };

  const handleUpdateAccount = async (accountData: ChartOfAccountUpdate) => {
    if (!selectedAccount) return;
    
    try {
      await updateAccountMutation.mutateAsync({
        accountId: selectedAccount.id,
        accountData
      });
      toast.success('Account updated successfully');
      setIsEditDialogOpen(false);
      setSelectedAccount(null);
    } catch (error) {
      toast.error('Failed to update account');
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (!confirm('Are you sure you want to delete this account? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteAccountMutation.mutateAsync(accountId);
      toast.success('Account deleted successfully');
    } catch (error) {
      toast.error('Failed to delete account');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const renderAccountRow = (account: ChartOfAccount & { children: ChartOfAccount[] }, level = 0) => {
    const hasChildren = account.children.length > 0;
    const isExpanded = expandedNodes.has(account.id);
    const typeConfig = accountTypeConfig[account.account_type as keyof typeof accountTypeConfig];
    const TypeIcon = typeConfig.icon;

    return (
      <React.Fragment key={account.id}>
        <TableRow className="hover:bg-gray-50">
          <TableCell className="font-medium">
            <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 20}px` }}>
              {hasChildren ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => toggleExpanded(account.id)}
                >
                  {isExpanded ? (
                    <ChevronDownIcon className="h-4 w-4" />
                  ) : (
                    <ChevronRightIcon className="h-4 w-4" />
                  )}
                </Button>
              ) : (
                <div className="w-6" />
              )}
              <div className={cn("h-6 w-6 rounded-full flex items-center justify-center", typeConfig.bgColor)}>
                <TypeIcon className={cn("h-3 w-3", typeConfig.color)} />
              </div>
              <div>
                <div className="font-medium">{account.account_code}</div>
                <div className="text-sm text-muted-foreground">{account.account_name}</div>
                {account.account_name_persian && (
                  <div className="text-xs text-muted-foreground">{account.account_name_persian}</div>
                )}
              </div>
            </div>
          </TableCell>
          <TableCell>
            <Badge variant="outline" className={cn("text-xs", typeConfig.color)}>
              {typeConfig.label}
            </Badge>
          </TableCell>
          <TableCell>{account.account_category}</TableCell>
          <TableCell className="text-right">
            {formatCurrency(account.current_balance)}
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-2">
              {account.is_active ? (
                <Badge variant="default" className="bg-green-100 text-green-700">
                  <CheckCircleIcon className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                  <XCircleIcon className="h-3 w-3 mr-1" />
                  Inactive
                </Badge>
              )}
              {account.is_system_account && (
                <Badge variant="outline" className="text-xs">
                  System
                </Badge>
              )}
              {account.requires_subsidiary && (
                <Badge variant="outline" className="text-xs">
                  Subsidiary Required
                </Badge>
              )}
            </div>
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedAccount(account);
                  setIsEditDialogOpen(true);
                }}
              >
                <EditIcon className="h-4 w-4" />
              </Button>
              {!account.is_system_account && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteAccount(account.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              )}
            </div>
          </TableCell>
        </TableRow>
        {hasChildren && isExpanded && account.children.map(child => renderAccountRow(child, level + 1))}
      </React.Fragment>
    );
  };

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
            <AlertCircleIcon className="h-6 w-6 text-red-600" />
            <div>
              <h3 className="text-lg font-semibold text-red-800">Error Loading Chart of Accounts</h3>
              <p className="text-red-600">Unable to load account data. Please try again.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header and Controls */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50/30 to-white">
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center shadow-lg">
                <BookOpenIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold">Chart of Accounts</CardTitle>
                <p className="text-sm text-muted-foreground">Manage your account structure and hierarchy</p>
              </div>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="gradient-green" className="gap-2">
                  <PlusIcon className="h-4 w-4" />
                  New Account
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Account</DialogTitle>
                </DialogHeader>
                <AccountForm
                  onSubmit={handleCreateAccount}
                  onCancel={() => setIsCreateDialogOpen(false)}
                  accounts={accounts}
                  isLoading={createAccountMutation.isPending}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search accounts by name, code, or Persian name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Select value={selectedAccountType} onValueChange={setSelectedAccountType}>
                <SelectTrigger className="w-48">
                  <FilterIcon className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="asset">Assets</SelectItem>
                  <SelectItem value="liability">Liabilities</SelectItem>
                  <SelectItem value="equity">Equity</SelectItem>
                  <SelectItem value="revenue">Revenue</SelectItem>
                  <SelectItem value="expense">Expenses</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center space-x-2">
                <Switch
                  id="include-inactive"
                  checked={includeInactive}
                  onCheckedChange={setIncludeInactive}
                />
                <Label htmlFor="include-inactive" className="text-sm">Include Inactive</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accounts Table */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Account</TableHead>
                  <TableHead className="font-semibold">Type</TableHead>
                  <TableHead className="font-semibold">Category</TableHead>
                  <TableHead className="font-semibold text-right">Balance</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <BookOpenIcon className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No accounts found</p>
                        {searchTerm && (
                          <Button variant="outline" onClick={() => setSearchTerm('')}>
                            Clear Search
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAccounts.map(account => renderAccountRow(account))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Account Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Account</DialogTitle>
          </DialogHeader>
          {selectedAccount && (
            <AccountForm
              account={selectedAccount}
              onSubmit={handleUpdateAccount}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setSelectedAccount(null);
              }}
              accounts={accounts}
              isLoading={updateAccountMutation.isPending}
              isEdit
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Account Form Component
interface AccountFormProps {
  account?: ChartOfAccount;
  onSubmit: (data: ChartOfAccountCreate | ChartOfAccountUpdate) => void;
  onCancel: () => void;
  accounts: ChartOfAccount[];
  isLoading: boolean;
  isEdit?: boolean;
}

const AccountForm: React.FC<AccountFormProps> = ({
  account,
  onSubmit,
  onCancel,
  accounts,
  isLoading,
  isEdit = false
}) => {
  const [formData, setFormData] = useState({
    account_code: account?.account_code || '',
    account_name: account?.account_name || '',
    account_name_persian: account?.account_name_persian || '',
    parent_account_id: account?.parent_account_id || '',
    account_type: account?.account_type || 'asset',
    account_category: account?.account_category || '',
    account_description: account?.account_description || '',
    account_description_persian: account?.account_description_persian || '',
    allow_manual_entries: account?.allow_manual_entries ?? true,
    requires_subsidiary: account?.requires_subsidiary ?? false,
    is_active: account?.is_active ?? true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const parentAccounts = accounts.filter(acc => 
    acc.account_type === formData.account_type && 
    (!account || acc.id !== account.id)
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="account_code">Account Code *</Label>
          <Input
            id="account_code"
            value={formData.account_code}
            onChange={(e) => setFormData({ ...formData, account_code: e.target.value })}
            placeholder="e.g., 1000"
            required
            disabled={isEdit}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="account_type">Account Type *</Label>
          <Select
            value={formData.account_type}
            onValueChange={(value) => setFormData({ ...formData, account_type: value, parent_account_id: '' })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asset">Asset</SelectItem>
              <SelectItem value="liability">Liability</SelectItem>
              <SelectItem value="equity">Equity</SelectItem>
              <SelectItem value="revenue">Revenue</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="account_name">Account Name *</Label>
        <Input
          id="account_name"
          value={formData.account_name}
          onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
          placeholder="e.g., Cash in Bank"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="account_name_persian">Account Name (Persian)</Label>
        <Input
          id="account_name_persian"
          value={formData.account_name_persian}
          onChange={(e) => setFormData({ ...formData, account_name_persian: e.target.value })}
          placeholder="e.g., نقد در بانک"
          dir="rtl"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="parent_account_id">Parent Account</Label>
          <Select
            value={formData.parent_account_id}
            onValueChange={(value) => setFormData({ ...formData, parent_account_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select parent account" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No Parent</SelectItem>
              {parentAccounts.map(acc => (
                <SelectItem key={acc.id} value={acc.id}>
                  {acc.account_code} - {acc.account_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="account_category">Account Category *</Label>
          <Input
            id="account_category"
            value={formData.account_category}
            onChange={(e) => setFormData({ ...formData, account_category: e.target.value })}
            placeholder="e.g., current_asset"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="account_description">Description</Label>
        <Textarea
          id="account_description"
          value={formData.account_description}
          onChange={(e) => setFormData({ ...formData, account_description: e.target.value })}
          placeholder="Account description..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="account_description_persian">Description (Persian)</Label>
        <Textarea
          id="account_description_persian"
          value={formData.account_description_persian}
          onChange={(e) => setFormData({ ...formData, account_description_persian: e.target.value })}
          placeholder="توضیحات حساب..."
          rows={3}
          dir="rtl"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="allow_manual_entries"
            checked={formData.allow_manual_entries}
            onCheckedChange={(checked) => setFormData({ ...formData, allow_manual_entries: checked })}
          />
          <Label htmlFor="allow_manual_entries">Allow Manual Entries</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="requires_subsidiary"
            checked={formData.requires_subsidiary}
            onCheckedChange={(checked) => setFormData({ ...formData, requires_subsidiary: checked })}
          />
          <Label htmlFor="requires_subsidiary">Requires Subsidiary Account</Label>
        </div>
        {isEdit && (
          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="is_active">Active</Label>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="gradient-green" disabled={isLoading}>
          {isLoading ? 'Saving...' : (isEdit ? 'Update Account' : 'Create Account')}
        </Button>
      </div>
    </form>
  );
};