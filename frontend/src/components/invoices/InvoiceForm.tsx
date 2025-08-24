import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Trash2, Plus, Calculator, Eye, FileText, Receipt } from 'lucide-react';
import { useCustomers } from '../../hooks/useCustomers';
import { useInventoryItems } from '../../hooks/useInventory';
import { useCalculateInvoice, useCreateInvoice } from '../../hooks/useInvoices';
import type { InvoiceCreate, InvoiceCalculationSummary } from '../../services/invoiceApi';
import type { Customer, InventoryItem } from '../../types';

// Form validation schema
const invoiceItemSchema = z.object({
  inventory_item_id: z.string().min(1, 'Please select an item'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  weight_grams: z.number().min(0.01, 'Weight must be greater than 0'),
});

const invoiceFormSchema = z.object({
  customer_id: z.string().min(1, 'Please select a customer'),
  gold_price_per_gram: z.number().min(0.01, 'Gold price must be greater than 0'),
  labor_cost_percentage: z.number().min(0).max(100, 'Labor cost must be between 0-100%'),
  profit_percentage: z.number().min(0).max(100, 'Profit must be between 0-100%'),
  vat_percentage: z.number().min(0).max(100, 'VAT must be between 0-100%'),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
});

type InvoiceFormData = z.infer<typeof invoiceFormSchema>;

interface InvoiceFormProps {
  onSuccess?: (invoice: any) => void;
  onCancel?: () => void;
  initialData?: Partial<InvoiceFormData>;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({
  onSuccess,
  onCancel,
  initialData
}) => {
  const [calculation, setCalculation] = useState<InvoiceCalculationSummary | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // API hooks
  const { data: customers = [], isLoading: customersLoading } = useCustomers();
  const { data: inventoryData, isLoading: inventoryLoading } = useInventoryItems();
  const inventoryItems = inventoryData?.items || [];
  const calculateMutation = useCalculateInvoice();
  const createMutation = useCreateInvoice();

  // Form setup
  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      customer_id: '',
      gold_price_per_gram: 2500, // Default gold price
      labor_cost_percentage: 10,
      profit_percentage: 15,
      vat_percentage: 9,
      items: [{ inventory_item_id: '', quantity: 1, weight_grams: 0 }],
      ...initialData,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  // Watch form values for real-time calculation
  const watchedValues = form.watch();

  // Auto-calculate when form values change
  useEffect(() => {
    const { customer_id, items, ...calculationData } = watchedValues;
    
    // Only calculate if we have valid data
    if (
      customer_id &&
      items.length > 0 &&
      items.every(item => item.inventory_item_id && item.quantity > 0 && item.weight_grams > 0) &&
      calculationData.gold_price_per_gram > 0
    ) {
      const invoiceData: InvoiceCreate = {
        customer_id,
        ...calculationData,
        items: items.map(item => ({
          inventory_item_id: item.inventory_item_id,
          quantity: item.quantity,
          weight_grams: item.weight_grams,
        })),
      };

      calculateMutation.mutate(invoiceData, {
        onSuccess: (result) => {
          setCalculation(result);
        },
        onError: () => {
          setCalculation(null);
        },
      });
    } else {
      setCalculation(null);
    }
  }, [watchedValues, calculateMutation]);

  // Handle item selection - auto-fill weight
  const handleItemSelect = (index: number, itemId: string) => {
    const selectedItem = inventoryItems.find(item => item.id === itemId);
    if (selectedItem) {
      form.setValue(`items.${index}.inventory_item_id`, itemId);
      form.setValue(`items.${index}.weight_grams`, selectedItem.weight_grams);
    }
  };

  // Add new item row
  const addItem = () => {
    append({ inventory_item_id: '', quantity: 1, weight_grams: 0 });
  };

  // Remove item row
  const removeItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  // Submit form
  const onSubmit = (data: InvoiceFormData) => {
    const invoiceData: InvoiceCreate = {
      customer_id: data.customer_id,
      gold_price_per_gram: data.gold_price_per_gram,
      labor_cost_percentage: data.labor_cost_percentage,
      profit_percentage: data.profit_percentage,
      vat_percentage: data.vat_percentage,
      items: data.items.map(item => ({
        inventory_item_id: item.inventory_item_id,
        quantity: item.quantity,
        weight_grams: item.weight_grams,
      })),
    };

    createMutation.mutate(invoiceData, {
      onSuccess: (result) => {
        onSuccess?.(result);
        form.reset();
        setCalculation(null);
      },
    });
  };

  const selectedCustomer = customers.find(c => c.id === watchedValues.customer_id);

  return (
    <div className="space-y-6">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Customer Selection */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-100/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <FileText className="h-4 w-4 text-white" />
              </div>
              <span className="text-blue-800">Customer Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="customer_id">Customer *</Label>
              <Select
                value={form.watch('customer_id')}
                onValueChange={(value) => form.setValue('customer_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customersLoading ? (
                    <SelectItem value="loading" disabled>Loading customers...</SelectItem>
                  ) : (
                    customers.map((customer: Customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name} {customer.phone && `(${customer.phone})`}
                        {customer.current_debt > 0 && (
                          <Badge variant="destructive" className="ml-2">
                            Debt: ${customer.current_debt.toFixed(2)}
                          </Badge>
                        )}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {form.formState.errors.customer_id && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.customer_id.message}
                </p>
              )}
            </div>

            {selectedCustomer && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm">
                  <strong>Current Debt:</strong> ${selectedCustomer.current_debt.toFixed(2)}
                </p>
                <p className="text-sm">
                  <strong>Total Purchases:</strong> ${selectedCustomer.total_purchases.toFixed(2)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pricing Configuration */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-teal-100/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                <Calculator className="h-4 w-4 text-white" />
              </div>
              <span className="text-emerald-800">Pricing Configuration</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="gold_price_per_gram">Gold Price (per gram) *</Label>
              <Input
                id="gold_price_per_gram"
                type="number"
                step="0.01"
                {...form.register('gold_price_per_gram', { valueAsNumber: true })}
              />
              {form.formState.errors.gold_price_per_gram && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.gold_price_per_gram.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="labor_cost_percentage">Labor Cost (%)</Label>
              <Input
                id="labor_cost_percentage"
                type="number"
                step="0.1"
                min="0"
                max="100"
                {...form.register('labor_cost_percentage', { valueAsNumber: true })}
              />
              {form.formState.errors.labor_cost_percentage && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.labor_cost_percentage.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="profit_percentage">Profit (%)</Label>
              <Input
                id="profit_percentage"
                type="number"
                step="0.1"
                min="0"
                max="100"
                {...form.register('profit_percentage', { valueAsNumber: true })}
              />
              {form.formState.errors.profit_percentage && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.profit_percentage.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="vat_percentage">VAT (%)</Label>
              <Input
                id="vat_percentage"
                type="number"
                step="0.1"
                min="0"
                max="100"
                {...form.register('vat_percentage', { valueAsNumber: true })}
              />
              {form.formState.errors.vat_percentage && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.vat_percentage.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Items Selection */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-violet-100/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg">
                <Receipt className="h-4 w-4 text-white" />
              </div>
              <span className="text-purple-800">Invoice Items</span>
            </CardTitle>
            <Button 
              type="button" 
              onClick={addItem} 
              size="sm"
              className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-12 gap-4 items-end p-4 border rounded-lg">
                <div className="col-span-5">
                  <Label>Item *</Label>
                  <Select
                    value={form.watch(`items.${index}.inventory_item_id`)}
                    onValueChange={(value) => handleItemSelect(index, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an item" />
                    </SelectTrigger>
                    <SelectContent>
                      {inventoryLoading ? (
                        <SelectItem value="loading" disabled>Loading items...</SelectItem>
                      ) : (
                        inventoryItems
                          .filter((item: InventoryItem) => item.is_active && item.stock_quantity > 0)
                          .map((item: InventoryItem) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.name} - {item.weight_grams}g
                              <Badge variant="outline" className="ml-2">
                                Stock: {item.stock_quantity}
                              </Badge>
                            </SelectItem>
                          ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2">
                  <Label>Quantity *</Label>
                  <Input
                    type="number"
                    min="1"
                    {...form.register(`items.${index}.quantity`, { valueAsNumber: true })}
                  />
                </div>

                <div className="col-span-2">
                  <Label>Weight (g) *</Label>
                  <Input
                    type="number"
                    step="0.001"
                    min="0.001"
                    {...form.register(`items.${index}.weight_grams`, { valueAsNumber: true })}
                  />
                </div>

                <div className="col-span-2">
                  {calculation?.items[index] && (
                    <div className="text-sm">
                      <p className="font-medium">
                        ${calculation.items[index].total_price.toFixed(2)}
                      </p>
                      <p className="text-gray-500">
                        ${calculation.items[index].unit_price.toFixed(2)}/unit
                      </p>
                    </div>
                  )}
                </div>

                <div className="col-span-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeItem(index)}
                    disabled={fields.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {form.formState.errors.items && (
              <p className="text-sm text-red-500">
                {form.formState.errors.items.message}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Calculation Summary */}
        {calculation && (
          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-100/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                  <Calculator className="h-4 w-4 text-white" />
                </div>
                <span className="text-green-800">Invoice Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Subtotal (Gold)</p>
                  <p className="font-medium">${calculation.subtotal.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Labor Cost</p>
                  <p className="font-medium">${calculation.total_labor_cost.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Profit</p>
                  <p className="font-medium">${calculation.total_profit.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-600">VAT</p>
                  <p className="font-medium">${calculation.total_vat.toFixed(2)}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-green-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-green-800">Grand Total:</span>
                  <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    ${calculation.grand_total.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Form Actions */}
        <div className="flex justify-between">
          <div className="flex gap-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            {calculation && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {showPreview ? 'Hide' : 'Show'} Preview
              </Button>
            )}
          </div>
          
          <Button
            type="submit"
            disabled={!calculation || createMutation.isPending}
            className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {createMutation.isPending ? 'Creating...' : 'Create Invoice'}
          </Button>
        </div>
      </form>
    </div>
  );
};