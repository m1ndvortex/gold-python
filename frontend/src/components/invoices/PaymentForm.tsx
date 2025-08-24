import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { DollarSign } from 'lucide-react';
import { useAddPayment } from '../../hooks/useInvoices';
import type { InvoicePaymentRequest } from '../../services/invoiceApi';
import type { Invoice } from '../../types';

// Form validation schema
const paymentFormSchema = z.object({
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  payment_method: z.string().min(1, 'Please select a payment method'),
  description: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentFormSchema>;

interface PaymentFormProps {
  invoice: Invoice;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  invoice,
  onSuccess,
  onCancel,
}) => {
  const addPaymentMutation = useAddPayment();

  // Form setup
  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      amount: invoice.remaining_amount,
      payment_method: 'cash',
      description: '',
    },
  });

  // Submit form
  const onSubmit = (data: PaymentFormData) => {
    const paymentData: InvoicePaymentRequest = {
      amount: data.amount,
      payment_method: data.payment_method,
      description: data.description || undefined,
    };

    addPaymentMutation.mutate(
      { invoiceId: invoice.id, paymentData },
      {
        onSuccess: () => {
          onSuccess?.();
          form.reset();
        },
      }
    );
  };

  // Payment method options
  const paymentMethods = [
    { value: 'cash', label: 'Cash' },
    { value: 'card', label: 'Credit/Debit Card' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'check', label: 'Check' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <Card className="w-full max-w-md border-0 shadow-xl bg-gradient-to-br from-amber-50 to-orange-100/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
            <DollarSign className="h-4 w-4 text-white" />
          </div>
          <span className="text-amber-800">Add Payment</span>
        </CardTitle>
        <div className="text-sm text-amber-700">
          <p>Invoice: <span className="font-medium">{invoice.invoice_number}</span></p>
          <p>Remaining Amount: <span className="font-bold">${invoice.remaining_amount.toFixed(2)}</span></p>
        </div>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Amount */}
          <div>
            <Label htmlFor="amount">Payment Amount *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              max={invoice.remaining_amount}
              placeholder="0.00"
              {...form.register('amount', { valueAsNumber: true })}
            />
            {form.formState.errors.amount && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.amount.message}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Maximum: ${invoice.remaining_amount.toFixed(2)}
            </p>
          </div>

          {/* Payment Method */}
          <div>
            <Label htmlFor="payment_method">Payment Method *</Label>
            <Select
              value={form.watch('payment_method')}
              onValueChange={(value) => form.setValue('payment_method', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.payment_method && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.payment_method.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Payment notes or reference..."
              rows={3}
              {...form.register('description')}
            />
          </div>

          {/* Payment Summary */}
          <div className="p-3 bg-gradient-to-r from-amber-100/50 to-orange-100/50 rounded-lg space-y-2 text-sm border border-amber-200/50">
            <div className="flex justify-between">
              <span>Invoice Total:</span>
              <span>${invoice.total_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Already Paid:</span>
              <span className="text-green-600">${invoice.paid_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Current Payment:</span>
              <span className="font-medium">
                ${(form.watch('amount') || 0).toFixed(2)}
              </span>
            </div>
            <div className="border-t pt-2 flex justify-between font-semibold">
              <span>Remaining After Payment:</span>
              <span className={
                (invoice.remaining_amount - (form.watch('amount') || 0)) <= 0 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }>
                ${Math.max(0, invoice.remaining_amount - (form.watch('amount') || 0)).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-between gap-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={addPaymentMutation.isPending || !form.formState.isValid}
              className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {addPaymentMutation.isPending ? 'Processing...' : 'Add Payment'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};