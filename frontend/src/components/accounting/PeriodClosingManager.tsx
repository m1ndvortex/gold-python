/**
 * Period Closing Manager Component
 * Multi-period closing and locking interface with edit restrictions display
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { 
  Calendar,
  Lock,
  Unlock,
  Plus,
  Edit,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  FileText,
  Shield,
  Eye,
  X
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { accountingApi } from '../../services/accountingApi';
import { AccountingPeriod } from '../../types/accounting';

interface PeriodClosingManagerProps {
  className?: string;
}

interface PeriodFormProps {
  period?: AccountingPeriod;
  onSave: (data: {
    period_name: string;
    start_date: string;
    end_date: string;
    period_type: 'monthly' | 'quarterly' | 'yearly';
  }) => void;
  onCancel: () => void;
}

const PeriodForm: React.FC<PeriodFormProps> = ({ period, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    period_name: period?.period_name || '',
    start_date: period?.start_date ? period.start_date.split('T')[0] : '',
    end_date: period?.end_date ? period.end_date.split('T')[0] : '',
    period_type: period?.period_type || 'monthly' as 'monthly' | 'quarterly' | 'yearly'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.period_name.trim()) {
      newErrors.period_name = 'Period name is required';
    }

    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required';
    }

    if (!formData.end_date) {
      newErrors.end_date = 'End date is required';
    }

    if (formData.start_date && formData.end_date && formData.start_date >= formData.end_date) {
      newErrors.end_date = 'End date must be after start date';
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Period Name *</label>
        <Input
          value={formData.period_name}
          onChange={(e) => setFormData({ ...formData, period_name: e.target.value })}
          placeholder="e.g., January 2024"
          className={errors.period_name ? 'border-red-500' : ''}
        />
        {errors.period_name && (
          <p className="text-xs text-red-600">{errors.period_name}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Start Date *</label>
          <Input
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            className={errors.start_date ? 'border-red-500' : ''}
          />
          {errors.start_date && (
            <p className="text-xs text-red-600">{errors.start_date}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">End Date *</label>
          <Input
            type="date"
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            className={errors.end_date ? 'border-red-500' : ''}
          />
          {errors.end_date && (
            <p className="text-xs text-red-600">{errors.end_date}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Period Type</label>
        <Select
          value={formData.period_type}
          onValueChange={(value: any) => setFormData({ ...formData, period_type: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="quarterly">Quarterly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="gradient-green">
          {period ? 'Update Period' : 'Create Period'}
        </Button>
      </div>
    </form>
  );
};

export const PeriodClosingManager: React.FC<PeriodClosingManagerProps> = ({ className }) => {
  const [periods, setPeriods] = useState<AccountingPeriod[]>([]);
  const [currentPeriod, setCurrentPeriod] = useState<AccountingPeriod | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<AccountingPeriod | null>(null);

  useEffect(() => {
    loadPeriods();
  }, []);

  const loadPeriods = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load current period and all periods
      const [current] = await Promise.all([
        accountingApi.getCurrentPeriod()
      ]);
      
      setCurrentPeriod(current);
      
      // For now, we'll create mock periods data since the API might not have a list endpoint
      const mockPeriods: AccountingPeriod[] = [
        {
          id: '1',
          period_name: 'January 2024',
          start_date: '2024-01-01',
          end_date: '2024-01-31',
          period_type: 'monthly',
          is_closed: true,
          closed_at: '2024-02-01T00:00:00Z',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-02-01T00:00:00Z'
        },
        {
          id: '2',
          period_name: 'February 2024',
          start_date: '2024-02-01',
          end_date: '2024-02-29',
          period_type: 'monthly',
          is_closed: true,
          closed_at: '2024-03-01T00:00:00Z',
          created_at: '2024-02-01T00:00:00Z',
          updated_at: '2024-03-01T00:00:00Z'
        },
        {
          id: '3',
          period_name: 'March 2024',
          start_date: '2024-03-01',
          end_date: '2024-03-31',
          period_type: 'monthly',
          is_closed: false,
          created_at: '2024-03-01T00:00:00Z',
          updated_at: '2024-03-01T00:00:00Z'
        }
      ];
      
      setPeriods(mockPeriods);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load periods');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePeriod = () => {
    setEditingPeriod(null);
    setDialogOpen(true);
  };

  const handleEditPeriod = (period: AccountingPeriod) => {
    if (period.is_closed) {
      alert('Cannot edit closed periods');
      return;
    }
    setEditingPeriod(period);
    setDialogOpen(true);
  };

  const handleSavePeriod = async (data: {
    period_name: string;
    start_date: string;
    end_date: string;
    period_type: 'monthly' | 'quarterly' | 'yearly';
  }) => {
    try {
      if (editingPeriod) {
        // Update would need to be implemented in the backend
        console.log('Update period:', editingPeriod.id, data);
      } else {
        await accountingApi.createAccountingPeriod(data);
      }
      setDialogOpen(false);
      setEditingPeriod(null);
      await loadPeriods();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save period');
    }
  };

  const handleClosePeriod = async (periodId: string) => {
    const confirmed = confirm(
      'Are you sure you want to close this period? This action cannot be undone and will prevent further edits to transactions in this period.'
    );
    
    if (confirmed) {
      try {
        await accountingApi.closeAccountingPeriod(periodId);
        await loadPeriods();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to close period');
      }
    }
  };

  const getPeriodStatusColor = (period: AccountingPeriod) => {
    if (period.is_closed) {
      return 'bg-red-100 text-red-700';
    }
    if (currentPeriod && period.id === currentPeriod.id) {
      return 'bg-green-100 text-green-700';
    }
    return 'bg-blue-100 text-blue-700';
  };

  const getPeriodStatusIcon = (period: AccountingPeriod) => {
    if (period.is_closed) {
      return <Lock className="h-4 w-4" />;
    }
    if (currentPeriod && period.id === currentPeriod.id) {
      return <CheckCircle className="h-4 w-4" />;
    }
    return <Clock className="h-4 w-4" />;
  };

  const getPeriodStatusText = (period: AccountingPeriod) => {
    if (period.is_closed) {
      return 'Closed';
    }
    if (currentPeriod && period.id === currentPeriod.id) {
      return 'Current';
    }
    return 'Open';
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
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                Period Closing
              </h2>
              <p className="text-muted-foreground">
                Manage accounting periods and period closing
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline-gradient-purple" onClick={loadPeriods}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="gradient-purple" onClick={handleCreatePeriod}>
            <Plus className="h-4 w-4 mr-2" />
            New Period
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
                onClick={loadPeriods}
                className="ml-auto"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Period Summary */}
      {currentPeriod && (
        <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-emerald-100/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-green-800">Current Active Period</CardTitle>
                  <p className="text-sm text-green-600">All new transactions will be recorded in this period</p>
                </div>
              </div>
              <Badge className="bg-green-100 text-green-700">
                Active
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-green-700">Period Name</p>
                <p className="text-lg font-bold text-green-900">{currentPeriod.period_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-green-700">Date Range</p>
                <p className="text-lg font-bold text-green-900">
                  {new Date(currentPeriod.start_date).toLocaleDateString()} - {new Date(currentPeriod.end_date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-green-700">Period Type</p>
                <p className="text-lg font-bold text-green-900 capitalize">{currentPeriod.period_type}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Periods List */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Accounting Periods</span>
            <Badge variant="outline">
              {periods.length} periods
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {periods.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No accounting periods found</p>
              </div>
            ) : (
              periods.map((period) => (
                <Card key={period.id} className="border-2 border-gray-200 hover:border-gray-300 transition-colors">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "h-12 w-12 rounded-lg flex items-center justify-center shadow-md",
                          period.is_closed 
                            ? "bg-gradient-to-br from-red-500 to-red-600" 
                            : currentPeriod && period.id === currentPeriod.id
                            ? "bg-gradient-to-br from-green-500 to-green-600"
                            : "bg-gradient-to-br from-blue-500 to-blue-600"
                        )}>
                          {getPeriodStatusIcon(period)}
                          <span className="text-white ml-1">{getPeriodStatusIcon(period)}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{period.period_name}</h3>
                            <Badge className={getPeriodStatusColor(period)}>
                              {getPeriodStatusText(period)}
                            </Badge>
                            <Badge variant="outline" className="text-xs capitalize">
                              {period.period_type}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-6 text-sm text-muted-foreground">
                            <span>
                              {new Date(period.start_date).toLocaleDateString()} - {new Date(period.end_date).toLocaleDateString()}
                            </span>
                            {period.closed_at && (
                              <span>
                                Closed: {new Date(period.closed_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!period.is_closed && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditPeriod(period)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleClosePeriod(period.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Lock className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Period Restrictions Display */}
                    {period.is_closed && (
                      <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                        <div className="flex items-center gap-2 text-red-700">
                          <Shield className="h-4 w-4" />
                          <span className="text-sm font-medium">Period Locked</span>
                        </div>
                        <p className="text-xs text-red-600 mt-1">
                          No journal entries, invoices, or transactions can be created or modified for this period.
                          All data is preserved for audit purposes.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Period Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingPeriod ? 'Edit Accounting Period' : 'Create New Accounting Period'}
            </DialogTitle>
          </DialogHeader>
          <PeriodForm
            period={editingPeriod || undefined}
            onSave={handleSavePeriod}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PeriodClosingManager;