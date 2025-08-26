/**
 * Chart of Accounts Manager Component
 * Hierarchical account structure management with CRUD operations
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { 
  Building2,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  ChevronRight,
  ChevronDown,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { accountingApi } from '../../services/accountingApi';
import { ChartOfAccount, ChartOfAccountForm } from '../../types/accounting';

interface ChartOfAccountsManagerProps {
  className?: string;
}

interface AccountTreeNodeProps {
  account: ChartOfAccount;
  level: number;
  onEdit: (account: ChartOfAccount) => void;
  onDelete: (accountId: string) => void;
  onToggleActive: (accountId: string, isActive: boolean) => void;
}

const AccountTreeNode: React.FC<AccountTreeNodeProps> = ({ 
  account, 
  level, 
  onEdit, 
  onDelete, 
  onToggleActive 
}) => {
  const [expanded, setExpanded] = useState(level < 2);

  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case 'Asset': return 'bg-blue-100 text-blue-700';
      case 'Liability': return 'bg-orange-100 text-orange-700';
      case 'Equity': return 'bg-purple-100 text-purple-700';
      case 'Revenue': return 'bg-green-100 text-green-700';
      case 'Expense': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-1">
      <div 
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors",
          !account.is_active && "opacity-60"
        )}
        style={{ paddingLeft: `${level * 24 + 12}px` }}
      >
        {/* Expand/Collapse Button */}
        {account.children && account.children.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        )}

        {/* Account Code */}
        <div className="min-w-[80px]">
          <span className="font-mono text-sm font-medium">
            {account.account_code}
          </span>
        </div>

        {/* Account Name */}
        <div className="flex-1">
          <span className={cn(
            "font-medium",
            account.is_system_account && "text-blue-600"
          )}>
            {account.account_name}
          </span>
          {account.description && (
            <p className="text-xs text-muted-foreground mt-1">
              {account.description}
            </p>
          )}
        </div>

        {/* Account Type Badge */}
        <Badge className={getAccountTypeColor(account.account_type)}>
          {account.account_type}
        </Badge>

        {/* System Account Indicator */}
        {account.is_system_account && (
          <Badge variant="outline" className="text-xs">
            System
          </Badge>
        )}

        {/* Active Status */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => onToggleActive(account.id, !account.is_active)}
        >
          {account.is_active ? (
            <Eye className="h-4 w-4 text-green-600" />
          ) : (
            <EyeOff className="h-4 w-4 text-gray-400" />
          )}
        </Button>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onEdit(account)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          {!account.is_system_account && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
              onClick={() => onDelete(account.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Child Accounts */}
      {expanded && account.children && account.children.length > 0 && (
        <div className="space-y-1">
          {account.children.map((child) => (
            <AccountTreeNode
              key={child.id}
              account={child}
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleActive={onToggleActive}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const AccountForm: React.FC<{
  account?: ChartOfAccount;
  accounts: ChartOfAccount[];
  onSave: (data: ChartOfAccountForm) => void;
  onCancel: () => void;
}> = ({ account, accounts, onSave, onCancel }) => {
  const [formData, setFormData] = useState<ChartOfAccountForm>({
    account_code: account?.account_code || '',
    account_name: account?.account_name || '',
    account_type: account?.account_type || 'Asset',
    parent_id: account?.parent_id || undefined,
    description: account?.description || '',
    business_type_config: account?.business_type_config || {}
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.account_code.trim()) {
      newErrors.account_code = 'Account code is required';
    }

    if (!formData.account_name.trim()) {
      newErrors.account_name = 'Account name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  // Get potential parent accounts (same type, not self or descendants)
  const potentialParents = accounts.filter(acc => 
    acc.account_type === formData.account_type && 
    acc.id !== account?.id &&
    !acc.parent_id // Only top-level accounts can be parents for now
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Account Code *</label>
          <Input
            value={formData.account_code}
            onChange={(e) => setFormData({ ...formData, account_code: e.target.value })}
            placeholder="e.g., 1000"
            className={errors.account_code ? 'border-red-500' : ''}
          />
          {errors.account_code && (
            <p className="text-xs text-red-600">{errors.account_code}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Account Type *</label>
          <Select
            value={formData.account_type}
            onValueChange={(value: any) => setFormData({ ...formData, account_type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Asset">Asset</SelectItem>
              <SelectItem value="Liability">Liability</SelectItem>
              <SelectItem value="Equity">Equity</SelectItem>
              <SelectItem value="Revenue">Revenue</SelectItem>
              <SelectItem value="Expense">Expense</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Account Name *</label>
        <Input
          value={formData.account_name}
          onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
          placeholder="e.g., Cash in Bank"
          className={errors.account_name ? 'border-red-500' : ''}
        />
        {errors.account_name && (
          <p className="text-xs text-red-600">{errors.account_name}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Parent Account</label>
        <Select
          value={formData.parent_id || ''}
          onValueChange={(value) => setFormData({ ...formData, parent_id: value || undefined })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select parent account (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">No Parent</SelectItem>
            {potentialParents.map((parent) => (
              <SelectItem key={parent.id} value={parent.id}>
                {parent.account_code} - {parent.account_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <Input
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Optional description"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="gradient-green">
          {account ? 'Update Account' : 'Create Account'}
        </Button>
      </div>
    </form>
  );
};

export const ChartOfAccountsManager: React.FC<ChartOfAccountsManagerProps> = ({ className }) => {
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<ChartOfAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showInactive, setShowInactive] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<ChartOfAccount | null>(null);

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    filterAccounts();
  }, [accounts, searchTerm, filterType, showInactive]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await accountingApi.getChartOfAccounts();
      
      // Build hierarchy
      const accountMap = new Map(data.map(acc => [acc.id, { ...acc, children: [] as ChartOfAccount[] }]));
      const rootAccounts: ChartOfAccount[] = [];

      data.forEach(account => {
        const acc = accountMap.get(account.id)!;
        if (account.parent_id) {
          const parent = accountMap.get(account.parent_id);
          if (parent && parent.children) {
            parent.children.push(acc);
          }
        } else {
          rootAccounts.push(acc);
        }
      });

      // Sort accounts by code
      const sortAccounts = (accounts: ChartOfAccount[]) => {
        accounts.sort((a, b) => a.account_code.localeCompare(b.account_code));
        accounts.forEach(acc => {
          if (acc.children) {
            sortAccounts(acc.children);
          }
        });
      };

      sortAccounts(rootAccounts);
      setAccounts(rootAccounts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const filterAccounts = () => {
    let filtered = [...accounts];

    // Filter by search term
    if (searchTerm) {
      const filterBySearch = (accounts: ChartOfAccount[]): ChartOfAccount[] => {
        return accounts.filter(account => {
          const matchesSearch = 
            account.account_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            account.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (account.description && account.description.toLowerCase().includes(searchTerm.toLowerCase()));

          if (matchesSearch) return true;

          // Check if any children match
          if (account.children) {
            const filteredChildren = filterBySearch(account.children);
            if (filteredChildren.length > 0) {
              account.children = filteredChildren;
              return true;
            }
          }

          return false;
        });
      };

      filtered = filterBySearch(filtered);
    }

    // Filter by account type
    if (filterType !== 'all') {
      const filterByType = (accounts: ChartOfAccount[]): ChartOfAccount[] => {
        return accounts.filter(account => {
          if (account.account_type === filterType) return true;

          if (account.children) {
            const filteredChildren = filterByType(account.children);
            if (filteredChildren.length > 0) {
              account.children = filteredChildren;
              return true;
            }
          }

          return false;
        });
      };

      filtered = filterByType(filtered);
    }

    // Filter by active status
    if (!showInactive) {
      const filterByActive = (accounts: ChartOfAccount[]): ChartOfAccount[] => {
        return accounts.filter(account => {
          if (account.is_active) {
            if (account.children) {
              account.children = filterByActive(account.children);
            }
            return true;
          }
          return false;
        });
      };

      filtered = filterByActive(filtered);
    }

    setFilteredAccounts(filtered);
  };

  const handleCreateAccount = () => {
    setEditingAccount(null);
    setDialogOpen(true);
  };

  const handleEditAccount = (account: ChartOfAccount) => {
    setEditingAccount(account);
    setDialogOpen(true);
  };

  const handleSaveAccount = async (data: ChartOfAccountForm) => {
    try {
      if (editingAccount) {
        await accountingApi.updateChartOfAccount(editingAccount.id, data);
      } else {
        await accountingApi.createChartOfAccount(data);
      }
      setDialogOpen(false);
      setEditingAccount(null);
      await loadAccounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save account');
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (confirm('Are you sure you want to delete this account?')) {
      try {
        // Note: Delete endpoint would need to be implemented in the backend
        console.log('Delete account:', accountId);
        await loadAccounts();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete account');
      }
    }
  };

  const handleToggleActive = async (accountId: string, isActive: boolean) => {
    try {
      await accountingApi.updateChartOfAccount(accountId, { is_active: isActive });
      await loadAccounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update account status');
    }
  };

  const flattenAccounts = (accounts: ChartOfAccount[]): ChartOfAccount[] => {
    const result: ChartOfAccount[] = [];
    const flatten = (accs: ChartOfAccount[]) => {
      accs.forEach(acc => {
        result.push(acc);
        if (acc.children) {
          flatten(acc.children);
        }
      });
    };
    flatten(accounts);
    return result;
  };

  if (loading) {
    return (
      <div className={cn("space-y-6", className)}>
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                Chart of Accounts
              </h2>
              <p className="text-muted-foreground">
                Manage your hierarchical account structure
              </p>
            </div>
          </div>
        </div>
        <Button variant="gradient-green" onClick={handleCreateAccount}>
          <Plus className="h-4 w-4 mr-2" />
          Add Account
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadAccounts}
                className="ml-auto"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-slate-50 to-slate-100/80">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search accounts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Asset">Assets</SelectItem>
                  <SelectItem value="Liability">Liabilities</SelectItem>
                  <SelectItem value="Equity">Equity</SelectItem>
                  <SelectItem value="Revenue">Revenue</SelectItem>
                  <SelectItem value="Expense">Expenses</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant={showInactive ? "default" : "outline"}
                onClick={() => setShowInactive(!showInactive)}
                className="whitespace-nowrap"
              >
                {showInactive ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
                {showInactive ? 'Hide Inactive' : 'Show Inactive'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accounts Tree */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Account Hierarchy</span>
            <Badge variant="outline">
              {flattenAccounts(filteredAccounts).length} accounts
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {filteredAccounts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No accounts found matching your criteria</p>
              </div>
            ) : (
              filteredAccounts.map((account) => (
                <AccountTreeNode
                  key={account.id}
                  account={account}
                  level={0}
                  onEdit={handleEditAccount}
                  onDelete={handleDeleteAccount}
                  onToggleActive={handleToggleActive}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Account Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingAccount ? 'Edit Account' : 'Create New Account'}
            </DialogTitle>
          </DialogHeader>
          <AccountForm
            account={editingAccount || undefined}
            accounts={flattenAccounts(accounts)}
            onSave={handleSaveAccount}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};