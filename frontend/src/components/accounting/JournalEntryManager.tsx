/**
 * Journal Entry Manager Component
 * Create, edit, and manage journal entries with automatic balancing validation
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { 
  FileText,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Check,
  X,
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  RefreshCw,
  Calculator,
  ArrowUpDown
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { accountingApi } from '../../services/accountingApi';
import { 
  JournalEntry, 
  JournalEntryForm, 
  JournalEntryLineForm, 
  JournalEntryFilters,
  ChartOfAccount 
} from '../../types/accounting';

interface JournalEntryManagerProps {
  className?: string;
}

interface JournalEntryFormProps {
  entry?: JournalEntry;
  accounts: ChartOfAccount[];
  onSave: (data: JournalEntryForm) => void;
  onCancel: () => void;
}

const JournalEntryFormComponent: React.FC<JournalEntryFormProps> = ({ 
  entry, 
  accounts, 
  onSave, 
  onCancel 
}) => {
  const [formData, setFormData] = useState<JournalEntryForm>({
    entry_date: entry?.entry_date ? entry.entry_date.split('T')[0] : new Date().toISOString().split('T')[0],
    reference: entry?.reference || '',
    description: entry?.description || '',
    source_type: entry?.source_type || '',
    source_id: entry?.source_id || '',
    requires_approval: entry?.requires_approval || false,
    period_id: entry?.period_id || undefined,
    lines: entry?.lines.map(line => ({
      account_id: line.account_id,
      debit_amount: line.debit_amount,
      credit_amount: line.credit_amount,
      description: line.description || '',
      reference: line.reference || '',
      subsidiary_account: line.subsidiary_account || '',
      cost_center: line.cost_center || '',
      project_code: line.project_code || ''
    })) || [
      { account_id: '', debit_amount: 0, credit_amount: 0, description: '', reference: '', subsidiary_account: '', cost_center: '', project_code: '' },
      { account_id: '', debit_amount: 0, credit_amount: 0, description: '', reference: '', subsidiary_account: '', cost_center: '', project_code: '' }
    ]
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const addLine = () => {
    setFormData({
      ...formData,
      lines: [
        ...formData.lines,
        { account_id: '', debit_amount: 0, credit_amount: 0, description: '', reference: '', subsidiary_account: '', cost_center: '', project_code: '' }
      ]
    });
  };

  const removeLine = (index: number) => {
    if (formData.lines.length > 2) {
      const newLines = formData.lines.filter((_, i) => i !== index);
      setFormData({ ...formData, lines: newLines });
    }
  };

  const updateLine = (index: number, field: keyof JournalEntryLineForm, value: any) => {
    const newLines = [...formData.lines];
    newLines[index] = { ...newLines[index], [field]: value };
    
    // Clear opposite amount when entering debit/credit
    if (field === 'debit_amount' && value > 0) {
      newLines[index].credit_amount = 0;
    } else if (field === 'credit_amount' && value > 0) {
      newLines[index].debit_amount = 0;
    }
    
    setFormData({ ...formData, lines: newLines });
  };

  const getTotalDebits = () => {
    return formData.lines.reduce((sum, line) => sum + (line.debit_amount || 0), 0);
  };

  const getTotalCredits = () => {
    return formData.lines.reduce((sum, line) => sum + (line.credit_amount || 0), 0);
  };

  const isBalanced = () => {
    const debits = getTotalDebits();
    const credits = getTotalCredits();
    return Math.abs(debits - credits) < 0.01 && debits > 0 && credits > 0;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!isBalanced()) {
      newErrors.balance = 'Journal entry must be balanced (debits = credits)';
    }

    formData.lines.forEach((line, index) => {
      if (!line.account_id) {
        newErrors[`line_${index}_account`] = 'Account is required';
      }
      if (line.debit_amount === 0 && line.credit_amount === 0) {
        newErrors[`line_${index}_amount`] = 'Either debit or credit amount is required';
      }
    });

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

  const getAccountName = (accountId: string) => {
    const account = accounts.find(acc => acc.id === accountId);
    return account ? `${account.account_code} - ${account.account_name}` : '';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Entry Header */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Entry Date *</label>
          <Input
            type="date"
            value={formData.entry_date}
            onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Reference</label>
          <Input
            value={formData.reference}
            onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
            placeholder="Reference number or document"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Description *</label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe the transaction"
          className={errors.description ? 'border-red-500' : ''}
        />
        {errors.description && (
          <p className="text-xs text-red-600">{errors.description}</p>
        )}
      </div>

      {/* Balance Summary */}
      <Card className={cn(
        "border-2",
        isBalanced() ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
      )}>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-sm font-medium text-green-700">Total Debits</p>
                <p className="text-lg font-bold text-green-900">
                  {formatCurrency(getTotalDebits())}
                </p>
              </div>
              <ArrowUpDown className="h-5 w-5 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm font-medium text-red-700">Total Credits</p>
                <p className="text-lg font-bold text-red-900">
                  {formatCurrency(getTotalCredits())}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isBalanced() ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-green-700">Balanced</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span className="text-sm font-medium text-red-700">
                    Difference: {formatCurrency(Math.abs(getTotalDebits() - getTotalCredits()))}
                  </span>
                </>
              )}
            </div>
          </div>
          {errors.balance && (
            <p className="text-xs text-red-600 mt-2">{errors.balance}</p>
          )}
        </CardContent>
      </Card>

      {/* Journal Entry Lines */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Journal Entry Lines</h3>
          <Button type="button" variant="outline" onClick={addLine}>
            <Plus className="h-4 w-4 mr-2" />
            Add Line
          </Button>
        </div>

        <div className="space-y-3">
          {formData.lines.map((line, index) => (
            <Card key={index} className="border-2 border-gray-200">
              <CardContent className="pt-4">
                <div className="grid grid-cols-12 gap-3 items-start">
                  {/* Account Selection */}
                  <div className="col-span-4">
                    <label className="text-xs font-medium text-muted-foreground">Account *</label>
                    <Select
                      value={line.account_id}
                      onValueChange={(value) => updateLine(index, 'account_id', value)}
                    >
                      <SelectTrigger className={errors[`line_${index}_account`] ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.account_code} - {account.account_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors[`line_${index}_account`] && (
                      <p className="text-xs text-red-600 mt-1">{errors[`line_${index}_account`]}</p>
                    )}
                  </div>

                  {/* Debit Amount */}
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-green-700">Debit</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={line.debit_amount || ''}
                      onChange={(e) => updateLine(index, 'debit_amount', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="text-right"
                    />
                  </div>

                  {/* Credit Amount */}
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-red-700">Credit</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={line.credit_amount || ''}
                      onChange={(e) => updateLine(index, 'credit_amount', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="text-right"
                    />
                  </div>

                  {/* Description */}
                  <div className="col-span-3">
                    <label className="text-xs font-medium text-muted-foreground">Description</label>
                    <Input
                      value={line.description}
                      onChange={(e) => updateLine(index, 'description', e.target.value)}
                      placeholder="Line description"
                    />
                  </div>

                  {/* Remove Button */}
                  <div className="col-span-1 flex justify-end pt-5">
                    {formData.lines.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLine(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Additional Fields */}
                <div className="grid grid-cols-3 gap-3 mt-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Reference</label>
                    <Input
                      value={line.reference}
                      onChange={(e) => updateLine(index, 'reference', e.target.value)}
                      placeholder="Line reference"
                      size="sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Cost Center</label>
                    <Input
                      value={line.cost_center}
                      onChange={(e) => updateLine(index, 'cost_center', e.target.value)}
                      placeholder="Cost center"
                      size="sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Project Code</label>
                    <Input
                      value={line.project_code}
                      onChange={(e) => updateLine(index, 'project_code', e.target.value)}
                      placeholder="Project code"
                      size="sm"
                    />
                  </div>
                </div>

                {errors[`line_${index}_amount`] && (
                  <p className="text-xs text-red-600 mt-2">{errors[`line_${index}_amount`]}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

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
          {entry ? 'Update Entry' : 'Create Entry'}
        </Button>
      </div>
    </form>
  );
};

export const JournalEntryManager: React.FC<JournalEntryManagerProps> = ({ className }) => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<JournalEntryFilters>({
    limit: 50,
    offset: 0
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [entriesData, accountsData] = await Promise.all([
        accountingApi.getJournalEntries(filters),
        accountingApi.getChartOfAccounts()
      ]);
      setEntries(entriesData);
      setAccounts(accountsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEntry = () => {
    setEditingEntry(null);
    setDialogOpen(true);
  };

  const handleEditEntry = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setDialogOpen(true);
  };

  const handleSaveEntry = async (data: JournalEntryForm) => {
    try {
      if (editingEntry) {
        // Update would need to be implemented in the backend
        console.log('Update entry:', editingEntry.id, data);
      } else {
        await accountingApi.createJournalEntry(data);
      }
      setDialogOpen(false);
      setEditingEntry(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save entry');
    }
  };

  const handlePostEntry = async (entryId: string) => {
    try {
      await accountingApi.postJournalEntry(entryId);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post entry');
    }
  };

  const handleApproveEntry = async (entryId: string) => {
    try {
      await accountingApi.approveJournalEntry(entryId);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve entry');
    }
  };

  const handleReverseEntry = async (entryId: string) => {
    const reason = prompt('Enter reversal reason:');
    if (reason) {
      try {
        await accountingApi.reverseJournalEntry(entryId, reason);
        await loadData();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to reverse entry');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'posted': return 'bg-green-100 text-green-700';
      case 'draft': return 'bg-yellow-100 text-yellow-700';
      case 'reversed': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
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
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center shadow-lg">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                Journal Entries
              </h2>
              <p className="text-muted-foreground">
                Create and manage double-entry journal entries
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline-gradient-green" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="gradient-green" onClick={handleCreateEntry}>
            <Plus className="h-4 w-4 mr-2" />
            New Entry
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
                onClick={loadData}
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
                  placeholder="Search entries..."
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) => setFilters({ ...filters, status: value === 'all' ? undefined : value as any })}
              >
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="posted">Posted</SelectItem>
                  <SelectItem value="reversed">Reversed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Entries List */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Journal Entries</span>
            <Badge variant="outline">
              {entries.length} entries
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {entries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No journal entries found</p>
              </div>
            ) : (
              entries.map((entry) => (
                <Card key={entry.id} className="border-2 border-gray-200 hover:border-gray-300 transition-colors">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-mono text-sm font-medium">
                            {entry.entry_number}
                          </span>
                          <Badge className={getStatusColor(entry.status)}>
                            {entry.status}
                          </Badge>
                          {entry.requires_approval && !entry.approved_by && (
                            <Badge variant="outline" className="text-orange-600">
                              <Clock className="h-3 w-3 mr-1" />
                              Pending Approval
                            </Badge>
                          )}
                          {entry.approved_by && (
                            <Badge variant="outline" className="text-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Approved
                            </Badge>
                          )}
                        </div>
                        <p className="font-medium mb-1">{entry.description}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{new Date(entry.entry_date).toLocaleDateString()}</span>
                          {entry.reference && <span>Ref: {entry.reference}</span>}
                          <span>{entry.lines.length} lines</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">
                          {formatCurrency(entry.total_debit)}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditEntry(entry)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {entry.status === 'draft' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditEntry(entry)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              {(!entry.requires_approval || entry.approved_by) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handlePostEntry(entry.id)}
                                  className="text-green-600"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              )}
                              {entry.requires_approval && !entry.approved_by && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleApproveEntry(entry.id)}
                                  className="text-blue-600"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}
                            </>
                          )}
                          {entry.status === 'posted' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReverseEntry(entry.id)}
                              className="text-red-600"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Entry Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEntry ? 'Edit Journal Entry' : 'Create New Journal Entry'}
            </DialogTitle>
          </DialogHeader>
          <JournalEntryFormComponent
            entry={editingEntry || undefined}
            accounts={accounts}
            onSave={handleSaveEntry}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};