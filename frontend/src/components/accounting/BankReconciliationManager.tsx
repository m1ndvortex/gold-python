export {};

import React, { useState, useEffect } from 'react';

/**
 * Bank Reconciliation Manager Component
 * Manage bank reconciliations with automatic matching capabilities
 */
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Checkbox } from '../ui/checkbox';
import { 
  Building2,
  Plus,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  Clock,
  Eye,
  RefreshCw,
  Calculator,
  ArrowUpDown,
  CreditCard,
  DollarSign,
  TrendingUp,
  TrendingDown,
  FileText,
  Edit,
  Trash2,
  X,
  Check
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { accountingApi } from '../../services/accountingApi';
import { 
  BankAccount, 
  BankTransaction, 
  BankReconciliation, 
  BankReconciliationForm,
  BankAccountForm 
} from '../../types/accounting';
import exp from 'constants';

interface BankReconciliationManagerProps {
  className?: string;
}

interface ReconciliationFormProps {
  bankAccount: BankAccount;
  transactions: BankTransaction[];
  onSave: (data: BankReconciliationForm) => void;
  onCancel: () => void;
}

const ReconciliationForm: React.FC<ReconciliationFormProps> = ({ 
  bankAccount, 
  transactions, 
  onSave, 
  onCancel 
}) => {
  const [formData, setFormData] = useState<BankReconciliationForm>({
    bank_account_id: bankAccount.id,
    reconciliation_date: new Date().toISOString().split('T')[0],
    statement_date: new Date().toISOString().split('T')[0],
    statement_balance: 0,
    book_balance: bankAccount.current_balance,
    outstanding_deposits: 0,
    outstanding_checks: 0,
    bank_charges: 0,
    interest_earned: 0
  });

  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const unreconciledTransactions = transactions.filter(t => !t.is_reconciled);

  const toggleTransaction = (transactionId: string) => {
    const newSelected = new Set(selectedTransactions);
    if (newSelected.has(transactionId)) {
      newSelected.delete(transactionId);
    } else {
      newSelected.add(transactionId);
    }
    setSelectedTransactions(newSelected);
  };

  const getSelectedTransactionsBalance = () => {
    return unreconciledTransactions
      .filter(t => selectedTransactions.has(t.id))
      .reduce((sum, t) => sum + (t.transaction_type === 'credit' ? t.amount : -t.amount), 0);
  };

  const getAdjustedBalance = () => {
    return formData.statement_balance + 
           formData.outstanding_deposits - 
           formData.outstanding_checks + 
           formData.interest_earned - 
           formData.bank_charges;
  };

  const isBalanced = () => {
    const adjustedBalance = getAdjustedBalance();
    const bookBalance = formData.book_balance + getSelectedTransactionsBalance();
    return Math.abs(adjustedBalance - bookBalance) < 0.01;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.statement_balance) {
      newErrors.statement_balance = 'Statement balance is required';
    }

    if (!isBalanced()) {
      newErrors.balance = 'Reconciliation must be balanced';
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Reconciliation Header */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Reconciliation Date *</label>
          <Input
            type="date"
            value={formData.reconciliation_date}
            onChange={(e) => setFormData({ ...formData, reconciliation_date: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Statement Date *</label>
          <Input
            type="date"
            value={formData.statement_date}
            onChange={(e) => setFormData({ ...formData, statement_date: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Statement Balance *</label>
          <Input
            type="number"
            step="0.01"
            value={formData.statement_balance}
            onChange={(e) => setFormData({ ...formData, statement_balance: parseFloat(e.target.value) || 0 })}
            className={errors.statement_balance ? 'border-red-500' : ''}
          />
          {errors.statement_balance && (
            <p className="text-xs text-red-600">{errors.statement_balance}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Book Balance</label>
          <Input
            type="number"
            step="0.01"
            value={formData.book_balance}
            onChange={(e) => setFormData({ ...formData, book_balance: parseFloat(e.target.value) || 0 })}
          />
        </div>
      </div>

      {/* Adjustments */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-blue-800">
            Reconciliation Adjustments
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-green-700">Outstanding Deposits</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.outstanding_deposits}
                onChange={(e) => setFormData({ ...formData, outstanding_deposits: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-red-700">Outstanding Checks</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.outstanding_checks}
                onChange={(e) => setFormData({ ...formData, outstanding_checks: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-green-700">Interest Earned</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.interest_earned}
                onChange={(e) => setFormData({ ...formData, interest_earned: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-red-700">Bank Charges</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.bank_charges}
                onChange={(e) => setFormData({ ...formData, bank_charges: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Balance Summary */}
      <Card className={cn(
        "border-2",
        isBalanced() ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
      )}>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="font-semibold text-blue-800">Statement Side</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Statement Balance:</span>
                  <span className="font-medium">{formatCurrency(formData.statement_balance)}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>+ Outstanding Deposits:</span>
                  <span className="font-medium">{formatCurrency(formData.outstanding_deposits)}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>- Outstanding Checks:</span>
                  <span className="font-medium">{formatCurrency(formData.outstanding_checks)}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>+ Interest Earned:</span>
                  <span className="font-medium">{formatCurrency(formData.interest_earned)}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>- Bank Charges:</span>
                  <span className="font-medium">{formatCurrency(formData.bank_charges)}</span>
                </div>
                <div className="flex justify-between border-t pt-1 font-bold">
                  <span>Adjusted Balance:</span>
                  <span>{formatCurrency(getAdjustedBalance())}</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-purple-800">Book Side</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Book Balance:</span>
                  <span className="font-medium">{formatCurrency(formData.book_balance)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Selected Transactions:</span>
                  <span className="font-medium">{formatCurrency(getSelectedTransactionsBalance())}</span>
                </div>
                <div className="flex justify-between border-t pt-1 font-bold">
                  <span>Adjusted Book Balance:</span>
                  <span>{formatCurrency(formData.book_balance + getSelectedTransactionsBalance())}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center mt-4 pt-4 border-t">
            {isBalanced() ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Reconciliation is balanced</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">
                  Difference: {formatCurrency(Math.abs(getAdjustedBalance() - (formData.book_balance + getSelectedTransactionsBalance())))}
                </span>
              </div>
            )}
          </div>
          {errors.balance && (
            <p className="text-xs text-red-600 mt-2 text-center">{errors.balance}</p>
          )}
        </CardContent>
      </Card>

      {/* Unreconciled Transactions */}
      <Card className="border-2 border-gray-200">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Unreconciled Transactions ({unreconciledTransactions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {unreconciledTransactions.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No unreconciled transactions
              </p>
            ) : (
              unreconciledTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center gap-3 p-2 rounded border hover:bg-gray-50">
                  <Checkbox
                    checked={selectedTransactions.has(transaction.id)}
                    onCheckedChange={() => toggleTransaction(transaction.id)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{transaction.description}</span>
                      <span className={cn(
                        "font-bold",
                        transaction.transaction_type === 'credit' ? 'text-green-600' : 'text-red-600'
                      )}>
                        {transaction.transaction_type === 'credit' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{new Date(transaction.transaction_date).toLocaleDateString()}</span>
                      {transaction.reference && <span>Ref: {transaction.reference}</span>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          variant="gradient-green"
          disabled={!isBalanced()}
        >
          <Calculator className="h-4 w-4 mr-2" />
          Complete Reconciliation
        </Button>
      </div>
    </form>
  );
};

export const BankReconciliationManager: React.FC<BankReconciliationManagerProps> = ({ className }) => {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [reconciliations, setReconciliations] = useState<BankReconciliation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadBankAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      loadTransactions(selectedAccount.id);
    }
  }, [selectedAccount]);

  const loadBankAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const accounts = await accountingApi.getBankAccounts();
      setBankAccounts(accounts);
      if (accounts.length > 0 && !selectedAccount) {
        setSelectedAccount(accounts[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bank accounts');
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async (bankAccountId: string) => {
    try {
      const transactions = await accountingApi.getBankTransactions(bankAccountId);
      setTransactions(transactions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transactions');
    }
  };

  const handleStartReconciliation = () => {
    if (selectedAccount) {
      setDialogOpen(true);
    }
  };

  const handleSaveReconciliation = async (data: BankReconciliationForm) => {
    try {
      await accountingApi.createBankReconciliation(data);
      setDialogOpen(false);
      if (selectedAccount) {
        await loadTransactions(selectedAccount.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save reconciliation');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getUnreconciledCount = () => {
    return transactions.filter(t => !t.is_reconciled).length;
  };

  const getUnreconciledAmount = () => {
    return transactions
      .filter(t => !t.is_reconciled)
      .reduce((sum, t) => sum + (t.transaction_type === 'credit' ? t.amount : -t.amount), 0);
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
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
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
                Bank Reconciliation
              </h2>
              <p className="text-muted-foreground">
                Reconcile bank statements with book records
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline-gradient-blue" onClick={loadBankAccounts}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            variant="gradient-blue" 
            onClick={handleStartReconciliation}
            disabled={!selectedAccount}
          >
            <Plus className="h-4 w-4 mr-2" />
            Start Reconciliation
          </Button>
        </div>
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
                onClick={loadBankAccounts}
                className="ml-auto"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bank Account Selection */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-slate-50 to-slate-100/80">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Select Bank Account</label>
              <Select
                value={selectedAccount?.id || ''}
                onValueChange={(value) => {
                  const account = bankAccounts.find(acc => acc.id === value);
                  setSelectedAccount(account || null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose bank account" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.account_name} - {account.account_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Summary */}
      {selectedAccount && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100/60">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-sm font-semibold text-blue-800">
                  Current Balance
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">
                {formatCurrency(selectedAccount.current_balance)}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100/60">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <CardTitle className="text-sm font-semibold text-green-800">
                  Reconciled Balance
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">
                {formatCurrency(selectedAccount.reconciled_balance)}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100/60">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <CardTitle className="text-sm font-semibold text-orange-800">
                  Unreconciled Items
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900">
                {getUnreconciledCount()}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100/60">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-purple-600" />
                <CardTitle className="text-sm font-semibold text-purple-800">
                  Unreconciled Amount
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className={cn(
                "text-2xl font-bold",
                getUnreconciledAmount() >= 0 ? 'text-green-900' : 'text-red-900'
              )}>
                {formatCurrency(getUnreconciledAmount())}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Transactions List */}
      {selectedAccount && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Bank Transactions</span>
              <Badge variant="outline">
                {transactions.length} transactions
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No transactions found for this account</p>
                </div>
              ) : (
                transactions.slice(0, 10).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium",
                        transaction.is_reconciled 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-orange-100 text-orange-700'
                      )}>
                        {transaction.is_reconciled ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <Clock className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{transaction.description}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{new Date(transaction.transaction_date).toLocaleDateString()}</span>
                          {transaction.reference && <span>Ref: {transaction.reference}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "font-bold",
                        transaction.transaction_type === 'credit' ? 'text-green-600' : 'text-red-600'
                      )}>
                        {transaction.transaction_type === 'credit' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                      </p>
                      <Badge 
                        variant={transaction.is_reconciled ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {transaction.is_reconciled ? 'Reconciled' : 'Pending'}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reconciliation Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Bank Reconciliation - {selectedAccount?.account_name}
            </DialogTitle>
          </DialogHeader>
          {selectedAccount && (
            <ReconciliationForm
              bankAccount={selectedAccount}
              transactions={transactions}
              onSave={handleSaveReconciliation}
              onCancel={() => setDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
expor
t { BankReconciliationManager };exp
ort default BankReconciliationManager;
export { Ba
nkReconciliationManager };