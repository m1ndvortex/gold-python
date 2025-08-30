/**
 * Journal Entry Management Component
 * Double-entry bookkeeping system with Persian terminology
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { 
  PlusIcon, 
  EditIcon, 
  TrashIcon, 
  SearchIcon,
  BookOpenIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  AlertTriangleIcon,
  DollarSignIcon,
  CalendarIcon,
  FileTextIcon,
  RotateCcwIcon,
  SendIcon,
  FilterIcon,
  EyeIcon,
  DownloadIcon
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { JournalEntry, JournalEntryCreate, JournalEntryLine, JournalEntryFilters } from '../../types/accounting';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface JournalEntryManagerProps {
  className?: string;
}

export const JournalEntryManager: React.FC<JournalEntryManagerProps> = ({ className }) => {
  const { t } = useLanguage();
  const {
    useJournalEntries,
    useChartOfAccounts,
    useSubsidiaryAccounts,
    useCreateJournalEntry,
    useUpdateJournalEntry,
    usePostJournalEntry,
    useReverseJournalEntry,
    useDeleteJournalEntry
  } = useEnhancedAccounting();

  const [filters, setFilters] = useState<JournalEntryFilters>({
    page: 1,
    limit: 50
  });
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [reversalReason, setReversalReason] = useState('');

  const { data: entries = [], isLoading, error } = useJournalEntries(filters);
  const { data: accounts = [] } = useChartOfAccounts();
  const { data: subsidiaryAccounts = [] } = useSubsidiaryAccounts();
  
  const createEntryMutation = useCreateJournalEntry();
  const updateEntryMutation = useUpdateJournalEntry();
  const postEntryMutation = usePostJournalEntry();
  const reverseEntryMutation = useReverseJournalEntry();
  const deleteEntryMutation = useDeleteJournalEntry();

  const handleCreateEntry = async (entryData: JournalEntryCreate) => {
    try {
      await createEntryMutation.mutateAsync(entryData);
      toast.success('Journal entry created successfully');
      setIsCreateDialogOpen(false);
    } catch (error) {
      toast.error('Failed to create journal entry');
    }
  };

  const handleUpdateEntry = async (entryData: Partial<JournalEntryCreate>) => {
    if (!selectedEntry) return;
    
    try {
      await updateEntryMutation.mutateAsync({
        entryId: selectedEntry.id,
        entryData
      });
      toast.success('Journal entry updated successfully');
      setIsEditDialogOpen(false);
      setSelectedEntry(null);
    } catch (error) {
      toast.error('Failed to update journal entry');
    }
  };

  const handlePostEntry = async (entryId: string) => {
    try {
      await postEntryMutation.mutateAsync(entryId);
      toast.success('Journal entry posted successfully');
    } catch (error) {
      toast.error('Failed to post journal entry');
    }
  };

  const handleReverseEntry = async (entryId: string) => {
    if (!reversalReason.trim()) {
      toast.error('Please provide a reversal reason');
      return;
    }

    try {
      await reverseEntryMutation.mutateAsync({ entryId, reversalReason });
      toast.success('Journal entry reversed successfully');
      setReversalReason('');
    } catch (error) {
      toast.error('Failed to reverse journal entry');
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this journal entry? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteEntryMutation.mutateAsync(entryId);
      toast.success('Journal entry deleted successfully');
    } catch (error) {
      toast.error('Failed to delete journal entry');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getStatusBadge = (entry: JournalEntry) => {
    switch (entry.status) {
      case 'draft':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
            <ClockIcon className="h-3 w-3 mr-1" />
            Draft
          </Badge>
        );
      case 'posted':
        return (
          <Badge variant="default" className="bg-green-100 text-green-700">
            <CheckCircleIcon className="h-3 w-3 mr-1" />
            Posted
          </Badge>
        );
      case 'reversed':
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-700">
            <RotateCcwIcon className="h-3 w-3 mr-1" />
            Reversed
          </Badge>
        );
      default:
        return null;
    }
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
            <AlertTriangleIcon className="h-6 w-6 text-red-600" />
            <div>
              <h3 className="text-lg font-semibold text-red-800">Error Loading Journal Entries</h3>
              <p className="text-red-600">Unable to load journal entry data. Please try again.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header and Controls */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50/30 to-white">
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <BookOpenIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold">Journal Entries</CardTitle>
                <p className="text-sm text-muted-foreground">Double-entry bookkeeping system</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline-gradient-blue" size="sm" className="gap-2">
                <DownloadIcon className="h-4 w-4" />
                Export
              </Button>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="gradient-blue" className="gap-2">
                    <PlusIcon className="h-4 w-4" />
                    New Entry
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Journal Entry</DialogTitle>
                  </DialogHeader>
                  <JournalEntryForm
                    onSubmit={handleCreateEntry}
                    onCancel={() => setIsCreateDialogOpen(false)}
                    accounts={accounts}
                    subsidiaryAccounts={subsidiaryAccounts}
                    isLoading={createEntryMutation.isPending}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search entries..."
                  value={filters.search_term || ''}
                  onChange={(e) => setFilters({ ...filters, search_term: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) => setFilters({ ...filters, status: value === 'all' ? undefined : value })}
              >
                <SelectTrigger>
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
            <div className="space-y-2">
              <Label>Source Type</Label>
              <Select
                value={filters.source_type || 'all'}
                onValueChange={(value) => setFilters({ ...filters, source_type: value === 'all' ? undefined : value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="invoice">Invoice</SelectItem>
                  <SelectItem value="payment">Payment</SelectItem>
                  <SelectItem value="adjustment">Adjustment</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date Range</Label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={filters.start_date || ''}
                  onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                  className="text-sm"
                />
                <Input
                  type="date"
                  value={filters.end_date || ''}
                  onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                  className="text-sm"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Journal Entries Table */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Entry #</TableHead>
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="font-semibold">Description</TableHead>
                  <TableHead className="font-semibold">Source</TableHead>
                  <TableHead className="font-semibold text-right">Debit</TableHead>
                  <TableHead className="font-semibold text-right">Credit</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <BookOpenIcon className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No journal entries found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  entries.map((entry) => (
                    <TableRow key={entry.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "h-2 w-2 rounded-full",
                            entry.is_balanced ? "bg-green-500" : "bg-red-500"
                          )} />
                          {entry.entry_number}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                          {format(new Date(entry.entry_date), 'MMM dd, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{entry.description}</div>
                          {entry.description_persian && (
                            <div className="text-sm text-muted-foreground" dir="rtl">
                              {entry.description_persian}
                            </div>
                          )}
                          {entry.reference_number && (
                            <div className="text-xs text-muted-foreground">
                              Ref: {entry.reference_number}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {entry.source_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(entry.total_debit)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(entry.total_credit)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {getStatusBadge(entry)}
                          {!entry.is_balanced && (
                            <Badge variant="destructive" className="text-xs">
                              <AlertTriangleIcon className="h-3 w-3 mr-1" />
                              Unbalanced
                            </Badge>
                          )}
                          {entry.is_period_locked && (
                            <Badge variant="secondary" className="text-xs">
                              Period Locked
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
                              setSelectedEntry(entry);
                              setIsViewDialogOpen(true);
                            }}
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                          {entry.status === 'draft' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedEntry(entry);
                                  setIsEditDialogOpen(true);
                                }}
                              >
                                <EditIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePostEntry(entry.id)}
                                className="text-green-600 hover:text-green-700"
                                disabled={!entry.is_balanced}
                              >
                                <SendIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteEntry(entry.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {entry.status === 'posted' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const reason = prompt('Enter reversal reason:');
                                if (reason) {
                                  setReversalReason(reason);
                                  handleReverseEntry(entry.id);
                                }
                              }}
                              className="text-orange-600 hover:text-orange-700"
                            >
                              <RotateCcwIcon className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* View Entry Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Journal Entry Details</DialogTitle>
          </DialogHeader>
          {selectedEntry && (
            <JournalEntryView
              entry={selectedEntry}
              accounts={accounts}
              subsidiaryAccounts={subsidiaryAccounts}
              onClose={() => {
                setIsViewDialogOpen(false);
                setSelectedEntry(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Entry Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Journal Entry</DialogTitle>
          </DialogHeader>
          {selectedEntry && (
            <JournalEntryForm
              entry={selectedEntry}
              onSubmit={handleUpdateEntry}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setSelectedEntry(null);
              }}
              accounts={accounts}
              subsidiaryAccounts={subsidiaryAccounts}
              isLoading={updateEntryMutation.isPending}
              isEdit
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Journal Entry Form Component
interface JournalEntryFormProps {
  entry?: JournalEntry;
  onSubmit: (data: JournalEntryCreate | Partial<JournalEntryCreate>) => void;
  onCancel: () => void;
  accounts: any[];
  subsidiaryAccounts: any[];
  isLoading: boolean;
  isEdit?: boolean;
}

const JournalEntryForm: React.FC<JournalEntryFormProps> = ({
  entry,
  onSubmit,
  onCancel,
  accounts,
  subsidiaryAccounts,
  isLoading,
  isEdit = false
}) => {
  const [formData, setFormData] = useState({
    entry_date: entry?.entry_date || new Date().toISOString().split('T')[0],
    description: entry?.description || '',
    description_persian: entry?.description_persian || '',
    reference_number: entry?.reference_number || '',
    source_type: entry?.source_type || 'manual',
    journal_lines: entry?.journal_lines || [
      { line_number: 1, account_id: '', debit_amount: 0, credit_amount: 0, description: '' },
      { line_number: 2, account_id: '', debit_amount: 0, credit_amount: 0, description: '' }
    ]
  });

  const addLine = () => {
    setFormData({
      ...formData,
      journal_lines: [
        ...formData.journal_lines,
        {
          line_number: formData.journal_lines.length + 1,
          account_id: '',
          debit_amount: 0,
          credit_amount: 0,
          description: ''
        }
      ]
    });
  };

  const removeLine = (index: number) => {
    if (formData.journal_lines.length <= 2) return;
    
    const newLines = formData.journal_lines.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      journal_lines: newLines.map((line, i) => ({ ...line, line_number: i + 1 }))
    });
  };

  const updateLine = (index: number, field: string, value: any) => {
    const newLines = [...formData.journal_lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setFormData({ ...formData, journal_lines: newLines });
  };

  const totalDebits = formData.journal_lines.reduce((sum, line) => sum + (line.debit_amount || 0), 0);
  const totalCredits = formData.journal_lines.reduce((sum, line) => sum + (line.credit_amount || 0), 0);
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) {
      toast.error('Journal entry must be balanced (debits must equal credits)');
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Entry Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="entry_date">Entry Date *</Label>
          <Input
            id="entry_date"
            type="date"
            value={formData.entry_date}
            onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="source_type">Source Type *</Label>
          <Select
            value={formData.source_type}
            onValueChange={(value) => setFormData({ ...formData, source_type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Manual</SelectItem>
              <SelectItem value="invoice">Invoice</SelectItem>
              <SelectItem value="payment">Payment</SelectItem>
              <SelectItem value="adjustment">Adjustment</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Journal entry description"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description_persian">Description (Persian)</Label>
        <Input
          id="description_persian"
          value={formData.description_persian}
          onChange={(e) => setFormData({ ...formData, description_persian: e.target.value })}
          placeholder="توضیحات فارسی"
          dir="rtl"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reference_number">Reference Number</Label>
        <Input
          id="reference_number"
          value={formData.reference_number}
          onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
          placeholder="Reference number"
        />
      </div>

      {/* Journal Lines */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-lg font-semibold">Journal Lines</Label>
          <Button type="button" variant="outline" onClick={addLine}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Line
          </Button>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Account</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Debit</TableHead>
                <TableHead className="text-right">Credit</TableHead>
                <TableHead className="w-16">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {formData.journal_lines.map((line, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Select
                      value={line.account_id}
                      onValueChange={(value) => updateLine(index, 'account_id', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map(account => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.account_code} - {account.account_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      value={line.description || ''}
                      onChange={(e) => updateLine(index, 'description', e.target.value)}
                      placeholder="Line description"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      value={line.debit_amount || ''}
                      onChange={(e) => {
                        updateLine(index, 'debit_amount', parseFloat(e.target.value) || 0);
                        updateLine(index, 'credit_amount', 0);
                      }}
                      placeholder="0.00"
                      className="text-right"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      value={line.credit_amount || ''}
                      onChange={(e) => {
                        updateLine(index, 'credit_amount', parseFloat(e.target.value) || 0);
                        updateLine(index, 'debit_amount', 0);
                      }}
                      placeholder="0.00"
                      className="text-right"
                    />
                  </TableCell>
                  <TableCell>
                    {formData.journal_lines.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLine(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between items-center gap-8">
              <span className="font-medium">Total Debits:</span>
              <span className="font-bold">{totalDebits.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center gap-8">
              <span className="font-medium">Total Credits:</span>
              <span className="font-bold">{totalCredits.toFixed(2)}</span>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between items-center gap-8">
                <span className="font-medium">Difference:</span>
                <span className={cn(
                  "font-bold",
                  isBalanced ? "text-green-600" : "text-red-600"
                )}>
                  {Math.abs(totalDebits - totalCredits).toFixed(2)}
                </span>
              </div>
            </div>
            {isBalanced ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircleIcon className="h-4 w-4" />
                <span className="text-sm">Entry is balanced</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangleIcon className="h-4 w-4" />
                <span className="text-sm">Entry is not balanced</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="gradient-blue" disabled={isLoading || !isBalanced}>
          {isLoading ? 'Saving...' : (isEdit ? 'Update Entry' : 'Create Entry')}
        </Button>
      </div>
    </form>
  );
};

// Journal Entry View Component
interface JournalEntryViewProps {
  entry: JournalEntry;
  accounts: any[];
  subsidiaryAccounts: any[];
  onClose: () => void;
}

const JournalEntryView: React.FC<JournalEntryViewProps> = ({
  entry,
  accounts,
  subsidiaryAccounts,
  onClose
}) => {
  const getAccountName = (accountId: string) => {
    const account = accounts.find(acc => acc.id === accountId);
    return account ? `${account.account_code} - ${account.account_name}` : 'Unknown Account';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Entry Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Entry Number</Label>
          <p className="font-semibold">{entry.entry_number}</p>
        </div>
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Date</Label>
          <p className="font-semibold">{format(new Date(entry.entry_date), 'MMM dd, yyyy')}</p>
        </div>
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Status</Label>
          <div className="mt-1">
            {entry.status === 'draft' && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                <ClockIcon className="h-3 w-3 mr-1" />
                Draft
              </Badge>
            )}
            {entry.status === 'posted' && (
              <Badge variant="default" className="bg-green-100 text-green-700">
                <CheckCircleIcon className="h-3 w-3 mr-1" />
                Posted
              </Badge>
            )}
            {entry.status === 'reversed' && (
              <Badge variant="destructive" className="bg-red-100 text-red-700">
                <RotateCcwIcon className="h-3 w-3 mr-1" />
                Reversed
              </Badge>
            )}
          </div>
        </div>
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Source</Label>
          <p className="font-semibold">{entry.source_type}</p>
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium text-muted-foreground">Description</Label>
        <p className="font-medium">{entry.description}</p>
        {entry.description_persian && (
          <p className="text-sm text-muted-foreground" dir="rtl">{entry.description_persian}</p>
        )}
      </div>

      {entry.reference_number && (
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Reference Number</Label>
          <p className="font-medium">{entry.reference_number}</p>
        </div>
      )}

      {/* Journal Lines */}
      <div>
        <Label className="text-lg font-semibold mb-4 block">Journal Lines</Label>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Account</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Debit</TableHead>
                <TableHead className="text-right">Credit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entry.journal_lines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell>
                    <div className="font-medium">{getAccountName(line.account_id)}</div>
                  </TableCell>
                  <TableCell>
                    <div>{line.description}</div>
                    {line.description_persian && (
                      <div className="text-sm text-muted-foreground" dir="rtl">
                        {line.description_persian}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {line.debit_amount > 0 ? formatCurrency(line.debit_amount) : '-'}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {line.credit_amount > 0 ? formatCurrency(line.credit_amount) : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mt-4">
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between items-center gap-8">
              <span className="font-medium">Total Debits:</span>
              <span className="font-bold">{formatCurrency(entry.total_debit)}</span>
            </div>
            <div className="flex justify-between items-center gap-8">
              <span className="font-medium">Total Credits:</span>
              <span className="font-bold">{formatCurrency(entry.total_credit)}</span>
            </div>
            <div className="border-t pt-2">
              <div className="flex items-center gap-2">
                {entry.is_balanced ? (
                  <>
                    <CheckCircleIcon className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600">Entry is balanced</span>
                  </>
                ) : (
                  <>
                    <AlertTriangleIcon className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-red-600">Entry is not balanced</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={onClose}>Close</Button>
      </div>
    </div>
  );
};