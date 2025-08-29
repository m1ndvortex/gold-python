import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { DollarSign, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useOverrideItemPrice } from '../../hooks/useInvoices';
import type { InvoiceItem } from '../../types';

const priceOverrideSchema = z.object({
  override_price: z.number().min(0.01, 'Price must be greater than 0'),
  reason: z.string().min(1, 'Reason is required'),
});

type PriceOverrideFormData = z.infer<typeof priceOverrideSchema>;

interface PriceOverrideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  item: InvoiceItem;
  onSuccess?: () => void;
}

export const PriceOverrideDialog: React.FC<PriceOverrideDialogProps> = ({
  open,
  onOpenChange,
  invoiceId,
  item,
  onSuccess
}) => {
  const overrideMutation = useOverrideItemPrice();

  const form = useForm<PriceOverrideFormData>({
    resolver: zodResolver(priceOverrideSchema),
    defaultValues: {
      override_price: Number(item.unit_price),
      reason: '',
    },
  });

  const watchedPrice = form.watch('override_price');
  const priceDifference = watchedPrice - Number(item.unit_price);
  const newTotal = watchedPrice * Number(item.quantity);
  const originalTotal = Number(item.total_price);
  const totalDifference = newTotal - originalTotal;

  const onSubmit = (data: PriceOverrideFormData) => {
    overrideMutation.mutate({
      invoiceId,
      itemId: item.id,
      overridePrice: data.override_price,
      reason: data.reason
    }, {
      onSuccess: () => {
        onSuccess?.();
        onOpenChange(false);
        form.reset();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-0 shadow-xl">
        <DialogHeader className="space-y-3 pb-6 border-b">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-foreground">Override Item Price</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Manually set the final price for this item
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="pt-6 space-y-6">
          {/* Item Information */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-100/50">
            <CardHeader>
              <CardTitle className="text-blue-800">Item Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Item Name:</span>
                <span className="font-medium">{item.inventory_item?.name || 'Custom Item'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Quantity:</span>
                <span className="font-medium">{item.quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Current Unit Price:</span>
                <span className="font-medium">${Number(item.unit_price).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Current Total:</span>
                <span className="font-medium">${Number(item.total_price).toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Price Override Input */}
            <div>
              <Label htmlFor="override_price">New Unit Price *</Label>
              <Input
                id="override_price"
                type="number"
                step="0.01"
                min="0.01"
                {...form.register('override_price', { valueAsNumber: true })}
              />
              {form.formState.errors.override_price && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.override_price.message}
                </p>
              )}
            </div>

            {/* Reason Input */}
            <div>
              <Label htmlFor="reason">Reason for Override *</Label>
              <Input
                id="reason"
                placeholder="e.g., Customer discount, Special pricing, etc."
                {...form.register('reason')}
              />
              {form.formState.errors.reason && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.reason.message}
                </p>
              )}
            </div>

            {/* Price Impact Summary */}
            {watchedPrice && watchedPrice !== Number(item.unit_price) && (
              <Card className={`border-0 shadow-lg ${
                priceDifference > 0 
                  ? 'bg-gradient-to-br from-green-50 to-emerald-100/50' 
                  : 'bg-gradient-to-br from-red-50 to-rose-100/50'
              }`}>
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${
                    priceDifference > 0 ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {priceDifference > 0 ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <AlertTriangle className="h-5 w-5" />
                    )}
                    Price Impact
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Unit Price Change:</span>
                    <Badge className={priceDifference > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {priceDifference > 0 ? '+' : ''}${priceDifference.toFixed(2)}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">New Total Price:</span>
                    <span className="font-medium">${newTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Total Change:</span>
                    <Badge className={totalDifference > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {totalDifference > 0 ? '+' : ''}${totalDifference.toFixed(2)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Warning for significant price changes */}
            {Math.abs(priceDifference) > Number(item.unit_price) * 0.5 && (
              <Alert className="border-amber-200 bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-700">
                  This is a significant price change (&gt;50%). Please ensure this is intentional.
                </AlertDescription>
              </Alert>
            )}

            {/* Form Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={overrideMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={overrideMutation.isPending || !form.formState.isValid}
                className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {overrideMutation.isPending ? 'Applying...' : 'Apply Override'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};