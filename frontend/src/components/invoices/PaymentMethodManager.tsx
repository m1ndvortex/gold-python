import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Progress } from '../ui/progress';
import { Separator } from '../ui/separator';
import { 
  CreditCard, 
  Banknote, 
  Building2, 
  Smartphone,
  Plus,
  Trash2,
  Edit,
  CheckCircle,
  Clock,
  AlertCircle,
  DollarSign
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';

interface PaymentMethod {
  id: string;
  type: 'cash' | 'card' | 'bank_transfer' | 'check' | 'digital' | 'installment';
  name: string;
  accountId?: string;
  configuration?: Record<string, any>;
  isActive: boolean;
}

interface PaymentEntry {
  id: string;
  amount: number;
  paymentMethodId: string;
  paymentMethod: PaymentMethod;
  reference?: string;
  notes?: string;
  status: 'pending' | 'completed' | 'failed';
  fees?: number;
  netAmount?: number;
  processedAt?: string;
}

interface PaymentSchedule {
  installmentNumber: number;
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue';
  paidDate?: string;
  paidAmount?: number;
}

interface PaymentMethodManagerProps {
  invoiceId: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentMethods: PaymentMethod[];
  paymentHistory: PaymentEntry[];
  paymentSchedule?: PaymentSchedule[];
  onAddPayment: (payment: Omit<PaymentEntry, 'id' | 'status' | 'processedAt'>) => Promise<void>;
  onUpdatePayment: (paymentId: string, updates: Partial<PaymentEntry>) => Promise<void>;
  onDeletePayment: (paymentId: string) => Promise<void>;
  onCreateInstallmentPlan: (plan: { installments: number; frequency: 'weekly' | 'monthly'; startDate: string }) => Promise<void>;
  className?: string;
}

export const PaymentMethodManager: React.FC<PaymentMethodManagerProps> = ({
  invoiceId,
  totalAmount,
  paidAmount,
  remainingAmount,
  paymentMethods,
  paymentHistory,
  paymentSchedule,
  onAddPayment,
  onUpdatePayment,
  onDeletePayment,
  onCreateInstallmentPlan,
  className = ''
}) => {
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [newPayment, setNewPayment] = useState({
    amount: remainingAmount,
    paymentMethodId: '',
    reference: '',
    notes: ''
  });
  const [isCreatingInstallments, setIsCreatingInstallments] = useState(false);
  const [installmentPlan, setInstallmentPlan] = useState({
    installments: 3,
    frequency: 'monthly' as 'weekly' | 'monthly',
    startDate: new Date().toISOString().split('T')[0]
  });

  const getPaymentMethodIcon = (type: string) => {
    switch (type) {
      case 'cash': return <Banknote className="h-4 w-4" />;
      case 'card': return <CreditCard className="h-4 w-4" />;
      case 'bank_transfer': return <Building2 className="h-4 w-4" />;
      case 'digital': return <Smartphone className="h-4 w-4" />;
      default: return <DollarSign className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-0 shadow-sm">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 border-0 shadow-sm">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border-0 shadow-sm">Failed</Badge>;
      case 'paid':
        return <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-0 shadow-sm">Paid</Badge>;
      case 'overdue':
        return <Badge className="bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border-0 shadow-sm">Overdue</Badge>;
      default:
        return <Badge className="bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 border-0 shadow-sm">{status}</Badge>;
    }
  };

  const handleAddPayment = async () => {
    if (!newPayment.paymentMethodId || newPayment.amount <= 0) {
      alert('Please select a payment method and enter a valid amount');
      return;
    }

    if (newPayment.amount > remainingAmount) {
      alert('Payment amount cannot exceed remaining amount');
      return;
    }

    try {
      await onAddPayment({
        amount: newPayment.amount,
        paymentMethodId: newPayment.paymentMethodId,
        paymentMethod: paymentMethods.find(pm => pm.id === newPayment.paymentMethodId)!,
        reference: newPayment.reference || undefined,
        notes: newPayment.notes || undefined
      });

      setNewPayment({
        amount: remainingAmount - newPayment.amount,
        paymentMethodId: '',
        reference: '',
        notes: ''
      });
      setIsAddingPayment(false);
    } catch (error) {
      console.error('Failed to add payment:', error);
    }
  };

  const handleCreateInstallments = async () => {
    try {
      await onCreateInstallmentPlan(installmentPlan);
      setIsCreatingInstallments(false);
    } catch (error) {
      console.error('Failed to create installment plan:', error);
    }
  };

  const paymentProgress = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;

  return (
    <Card className={cn("border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-purple-100/50", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
            <CreditCard className="h-4 w-4 text-white" />
          </div>
          <span className="text-indigo-800">Payment Management</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Payment Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Payment Progress</span>
            <span className="text-sm text-muted-foreground">
              ${paidAmount.toFixed(2)} of ${totalAmount.toFixed(2)}
            </span>
          </div>
          <Progress value={paymentProgress} className="h-3" />
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <p className="text-muted-foreground">Total</p>
              <p className="font-medium">${totalAmount.toFixed(2)}</p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground">Paid</p>
              <p className="font-medium text-green-600">${paidAmount.toFixed(2)}</p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground">Remaining</p>
              <p className="font-medium text-red-600">${remainingAmount.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Add Payment Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-indigo-800">Add Payment</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddingPayment(!isAddingPayment)}
              className="border-indigo-300 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-400 transition-all duration-300"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Payment
            </Button>
          </div>

          {isAddingPayment && (
            <div className="p-4 bg-white/50 border border-indigo-200/50 rounded-lg space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="payment-amount">Amount *</Label>
                  <Input
                    id="payment-amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={remainingAmount}
                    value={newPayment.amount}
                    onChange={(e) => setNewPayment(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Label htmlFor="payment-method">Payment Method *</Label>
                  <Select
                    value={newPayment.paymentMethodId}
                    onValueChange={(value) => setNewPayment(prev => ({ ...prev, paymentMethodId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.filter(pm => pm.isActive).map((method) => (
                        <SelectItem key={method.id} value={method.id}>
                          <div className="flex items-center gap-2">
                            {getPaymentMethodIcon(method.type)}
                            {method.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="payment-reference">Reference Number</Label>
                <Input
                  id="payment-reference"
                  placeholder="Transaction ID, check number, etc."
                  value={newPayment.reference}
                  onChange={(e) => setNewPayment(prev => ({ ...prev, reference: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="payment-notes">Notes</Label>
                <Textarea
                  id="payment-notes"
                  placeholder="Additional payment notes..."
                  rows={2}
                  value={newPayment.notes}
                  onChange={(e) => setNewPayment(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleAddPayment}
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Add Payment
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsAddingPayment(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Installment Plan Section */}
        {remainingAmount > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-indigo-800">Installment Plan</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCreatingInstallments(!isCreatingInstallments)}
                className="border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-400 transition-all duration-300"
              >
                <Plus className="h-3 w-3 mr-1" />
                Create Plan
              </Button>
            </div>

            {isCreatingInstallments && (
              <div className="p-4 bg-white/50 border border-purple-200/50 rounded-lg space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="installments">Number of Installments</Label>
                    <Input
                      id="installments"
                      type="number"
                      min="2"
                      max="12"
                      value={installmentPlan.installments}
                      onChange={(e) => setInstallmentPlan(prev => ({ ...prev, installments: parseInt(e.target.value) || 2 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="frequency">Frequency</Label>
                    <Select
                      value={installmentPlan.frequency}
                      onValueChange={(value: 'weekly' | 'monthly') => setInstallmentPlan(prev => ({ ...prev, frequency: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="start-date">Start Date</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={installmentPlan.startDate}
                      onChange={(e) => setInstallmentPlan(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="p-3 bg-purple-50/50 border border-purple-200/50 rounded-lg">
                  <p className="text-sm text-purple-700">
                    <strong>Installment Amount:</strong> ${(remainingAmount / installmentPlan.installments).toFixed(2)} per {installmentPlan.frequency.slice(0, -2)}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleCreateInstallments}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    Create Installment Plan
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreatingInstallments(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Existing Installment Schedule */}
            {paymentSchedule && paymentSchedule.length > 0 && (
              <div className="space-y-3">
                <h5 className="font-medium text-sm text-purple-800">Payment Schedule</h5>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {paymentSchedule.map((installment, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white/50 border border-purple-200/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium",
                          installment.status === 'paid' && "bg-green-100 text-green-700",
                          installment.status === 'pending' && "bg-amber-100 text-amber-700",
                          installment.status === 'overdue' && "bg-red-100 text-red-700"
                        )}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium">${installment.amount.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">
                            Due: {format(new Date(installment.dueDate), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(installment.status)}
                        {installment.status === 'paid' && installment.paidDate && (
                          <span className="text-xs text-green-600">
                            Paid: {format(new Date(installment.paidDate), 'MMM dd')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <Separator />

        {/* Payment History */}
        <div className="space-y-4">
          <h4 className="font-medium text-indigo-800">Payment History</h4>
          {paymentHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No payments recorded yet</p>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {paymentHistory.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-white/50 border border-indigo-200/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
                      {getPaymentMethodIcon(payment.paymentMethod.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">${payment.amount.toFixed(2)}</span>
                        {getStatusBadge(payment.status)}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{payment.paymentMethod.name}</span>
                        {payment.reference && (
                          <>
                            <span>•</span>
                            <span>Ref: {payment.reference}</span>
                          </>
                        )}
                      </div>
                      {payment.processedAt && (
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(payment.processedAt), 'MMM dd, yyyy HH:mm')}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {payment.fees && payment.fees > 0 && (
                      <Badge variant="outline" className="text-xs">
                        Fee: ${payment.fees.toFixed(2)}
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeletePayment(payment.id)}
                      className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};