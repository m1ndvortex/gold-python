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
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Separator } from '../ui/separator';
import { Alert, AlertDescription } from '../ui/alert';
import { Trash2, Plus, Calculator, Eye, FileText, Receipt, Gem, Package, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useCustomers } from '../../hooks/useCustomers';
import { useInventoryItems } from '../../hooks/useInventory';
import { useCalculateInvoice, useCreateInvoice } from '../../hooks/useInvoices';
import { QRCardIntegration } from '../qr-cards/QRCardIntegration';
import type { InvoiceCreate, InvoiceCalculationSummary } from '../../services/invoiceApi';
import type { Customer, InventoryItem } from '../../types';

// Form validation schema with dual invoice type support
const invoiceItemSchema = z.object({
  inventory_item_id: z.string().optional(),
  item_name: z.string().min(1, 'Item name is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unit_price: z.number().min(0, 'Unit price must be non-negative'),
  weight_grams: z.number().optional(),
  unit_of_measure: z.string().default('piece'),
});

const goldFieldsSchema = z.object({
  gold_price_per_gram: z.number().min(0.01, 'Gold price must be greater than 0'),
  labor_cost_percentage: z.number().min(0).max(100, 'Labor cost must be between 0-100%'),
  profit_percentage: z.number().min(0).max(100, 'Profit must be between 0-100%'),
  vat_percentage: z.number().min(0).max(100, 'VAT must be between 0-100%'),
});

const invoiceFormSchema = z.object({
  type: z.enum(['gold', 'general'], { required_error: 'Please select invoice type' }),
  customer_id: z.string().min(1, 'Please select a customer'),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
  gold_fields: goldFieldsSchema.optional(),
  requires_approval: z.boolean().default(false),
  notes: z.string().optional(),
}).refine((data) => {
  // Gold invoices must have gold fields
  if (data.type === 'gold' && !data.gold_fields) {
    return false;
  }
  // Gold invoice items must have weight
  if (data.type === 'gold') {
    return data.items.every(item => item.weight_grams && item.weight_grams > 0);
  }
  return true;
}, {
  message: 'Gold invoices require gold fields and all items must have weight specified',
  path: ['gold_fields']
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

  // Form setup with dual invoice type support
  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      type: 'general',
      customer_id: '',
      items: [{ 
        inventory_item_id: '', 
        item_name: '', 
        quantity: 1, 
        unit_price: 0,
        weight_grams: 0,
        unit_of_measure: 'piece'
      }],
      gold_fields: {
        gold_price_per_gram: 2500, // Default gold price
        labor_cost_percentage: 10,
        profit_percentage: 15,
        vat_percentage: 9,
      },
      requires_approval: false,
      notes: '',
      ...initialData,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  // Watch form values for real-time calculation
  const watchedValues = form.watch();
  const invoiceType = form.watch('type');

  // Auto-calculate when form values change
  useEffect(() => {
    const { customer_id, type, items, gold_fields, ...otherData } = watchedValues;
    
    // Only calculate if we have valid data
    const hasValidItems = items.length > 0 && items.every(item => 
      item.item_name && 
      item.quantity > 0 && 
      (type === 'general' || (type === 'gold' && item.weight_grams && item.weight_grams > 0))
    );
    
    const hasValidGoldFields = type === 'general' || (
      type === 'gold' && 
      gold_fields && 
      gold_fields.gold_price_per_gram > 0
    );
    
    if (customer_id && hasValidItems && hasValidGoldFields) {
      const invoiceData = {
        type,
        customer_id,
        items: items.map(item => ({
          inventory_item_id: item.inventory_item_id || undefined,
          item_name: item.item_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          weight_grams: item.weight_grams || undefined,
          unit_of_measure: item.unit_of_measure,
        })),
        gold_fields: type === 'gold' ? gold_fields : undefined,
        requires_approval: otherData.requires_approval,
        notes: otherData.notes,
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

  // Handle item selection - auto-fill details
  const handleItemSelect = (index: number, itemId: string) => {
    const selectedItem = inventoryItems.find(item => item.id === itemId);
    if (selectedItem) {
      form.setValue(`items.${index}.inventory_item_id`, itemId);
      form.setValue(`items.${index}.item_name`, selectedItem.name);
      form.setValue(`items.${index}.unit_price`, Number(selectedItem.sell_price));
      form.setValue(`items.${index}.weight_grams`, selectedItem.weight_grams || 0);
      form.setValue(`items.${index}.unit_of_measure`, 'piece');
    }
  };

  // Add new item row
  const addItem = () => {
    append({ 
      inventory_item_id: '', 
      item_name: '', 
      quantity: 1, 
      unit_price: 0,
      weight_grams: 0,
      unit_of_measure: 'piece'
    });
  };

  // Remove item row
  const removeItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  // Submit form
  const onSubmit = (data: InvoiceFormData) => {
    const invoiceData = {
      type: data.type,
      customer_id: data.customer_id,
      items: data.items.map(item => ({
        inventory_item_id: item.inventory_item_id || undefined,
        item_name: item.item_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        weight_grams: item.weight_grams || undefined,
        unit_of_measure: item.unit_of_measure,
      })),
      gold_fields: data.type === 'gold' ? data.gold_fields : undefined,
      requires_approval: data.requires_approval,
      notes: data.notes,
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
        {/* Invoice Type Selection */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-slate-100/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center shadow-lg">
                <FileText className="h-4 w-4 text-white" />
              </div>
              <span className="text-slate-800">Invoice Type Selection</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Label className="text-base font-medium">Choose Invoice Type *</Label>
              <RadioGroup
                value={form.watch('type')}
                onValueChange={(value) => form.setValue('type', value as 'gold' | 'general')}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <div className="flex items-center space-x-3 p-4 border-2 rounded-lg hover:bg-amber-50 transition-colors duration-200 data-[state=checked]:border-amber-400 data-[state=checked]:bg-amber-50">
                  <RadioGroupItem value="gold" id="gold" />
                  <div className="flex items-center gap-3 flex-1">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shadow-lg">
                      <Gem className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <Label htmlFor="gold" className="text-base font-medium text-amber-800 cursor-pointer">
                        Gold Invoice
                      </Label>
                      <p className="text-sm text-amber-600">
                        Specialized for gold jewelry with سود, اجرت, مالیات calculations
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-4 border-2 rounded-lg hover:bg-blue-50 transition-colors duration-200 data-[state=checked]:border-blue-400 data-[state=checked]:bg-blue-50">
                  <RadioGroupItem value="general" id="general" />
                  <div className="flex items-center gap-3 flex-1">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                      <Package className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <Label htmlFor="general" className="text-base font-medium text-blue-800 cursor-pointer">
                        General Invoice
                      </Label>
                      <p className="text-sm text-blue-600">
                        Standard invoice for any type of product or service
                      </p>
                    </div>
                  </div>
                </div>
              </RadioGroup>
              
              {form.formState.errors.type && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.type.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Customer Selection */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-100/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                <FileText className="h-4 w-4 text-white" />
              </div>
              <span className="text-green-800">Customer Information</span>
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
              <div className="p-3 bg-green-100/50 rounded-lg border border-green-200">
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

        {/* Gold-Specific Pricing Configuration (Conditional) */}
        {invoiceType === 'gold' && (
          <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-yellow-100/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shadow-lg">
                  <Gem className="h-4 w-4 text-white" />
                </div>
                <span className="text-amber-800">Gold Pricing Configuration</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="gold_price_per_gram">Gold Price (per gram) *</Label>
                <Input
                  id="gold_price_per_gram"
                  type="number"
                  step="0.01"
                  {...form.register('gold_fields.gold_price_per_gram', { valueAsNumber: true })}
                />
                {form.formState.errors.gold_fields?.gold_price_per_gram && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.gold_fields.gold_price_per_gram.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="labor_cost_percentage">اجرت - Labor Cost (%)</Label>
                <Input
                  id="labor_cost_percentage"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  {...form.register('gold_fields.labor_cost_percentage', { valueAsNumber: true })}
                />
                {form.formState.errors.gold_fields?.labor_cost_percentage && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.gold_fields.labor_cost_percentage.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="profit_percentage">سود - Profit (%)</Label>
                <Input
                  id="profit_percentage"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  {...form.register('gold_fields.profit_percentage', { valueAsNumber: true })}
                />
                {form.formState.errors.gold_fields?.profit_percentage && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.gold_fields.profit_percentage.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="vat_percentage">مالیات - VAT (%)</Label>
                <Input
                  id="vat_percentage"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  {...form.register('gold_fields.vat_percentage', { valueAsNumber: true })}
                />
                {form.formState.errors.gold_fields?.vat_percentage && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.gold_fields.vat_percentage.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

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
              <div key={field.id} className="p-4 border rounded-lg bg-white/50">
                <div className="grid grid-cols-12 gap-4 items-end">
                  {/* Item Selection */}
                  <div className="col-span-12 md:col-span-4">
                    <Label>Select from Inventory (Optional)</Label>
                    <Select
                      value={form.watch(`items.${index}.inventory_item_id`) || ''}
                      onValueChange={(value) => value && value !== "manual" ? handleItemSelect(index, value) : null}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select from inventory..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual Entry</SelectItem>
                        {inventoryLoading ? (
                          <SelectItem value="loading" disabled>Loading items...</SelectItem>
                        ) : (
                          inventoryItems
                            .filter((item: InventoryItem) => item.is_active && item.stock_quantity > 0)
                            .map((item: InventoryItem) => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.name} - ${item.sell_price}
                                <Badge variant="outline" className="ml-2">
                                  Stock: {item.stock_quantity}
                                </Badge>
                              </SelectItem>
                            ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Item Name */}
                  <div className="col-span-12 md:col-span-3">
                    <Label>Item Name *</Label>
                    <Input
                      placeholder="Enter item name"
                      {...form.register(`items.${index}.item_name`)}
                    />
                    {form.formState.errors.items?.[index]?.item_name && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.items[index]?.item_name?.message}
                      </p>
                    )}
                  </div>

                  {/* Quantity */}
                  <div className="col-span-6 md:col-span-2">
                    <Label>Quantity *</Label>
                    <Input
                      type="number"
                      min="1"
                      step="0.001"
                      {...form.register(`items.${index}.quantity`, { valueAsNumber: true })}
                    />
                  </div>

                  {/* Unit Price (for General invoices) */}
                  {invoiceType === 'general' && (
                    <div className="col-span-6 md:col-span-2">
                      <Label>Unit Price *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        {...form.register(`items.${index}.unit_price`, { valueAsNumber: true })}
                      />
                    </div>
                  )}

                  {/* Weight (for Gold invoices) */}
                  {invoiceType === 'gold' && (
                    <div className="col-span-6 md:col-span-2">
                      <Label>Weight (grams) *</Label>
                      <Input
                        type="number"
                        step="0.001"
                        min="0.001"
                        {...form.register(`items.${index}.weight_grams`, { valueAsNumber: true })}
                      />
                      {form.formState.errors.items?.[index]?.weight_grams && (
                        <p className="text-sm text-red-500 mt-1">
                          Weight required for gold items
                        </p>
                      )}
                    </div>
                  )}

                  {/* Calculated Price Display */}
                  <div className="col-span-6 md:col-span-2">
                    {calculation?.items[index] && (
                      <div className="text-sm">
                        <Label>Total Price</Label>
                        <p className="font-medium text-lg">
                          ${calculation.items[index].total_price.toFixed(2)}
                        </p>
                        <p className="text-gray-500">
                          ${calculation.items[index].unit_price.toFixed(2)}/unit
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Remove Button */}
                  <div className="col-span-12 md:col-span-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(index)}
                      disabled={fields.length === 1}
                      className="w-full md:w-auto"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Stock Validation Alert */}
                {form.watch(`items.${index}.inventory_item_id`) && (
                  (() => {
                    const selectedItem = inventoryItems.find(item => 
                      item.id === form.watch(`items.${index}.inventory_item_id`)
                    );
                    const requestedQty = form.watch(`items.${index}.quantity`) || 0;
                    
                    if (selectedItem && requestedQty > selectedItem.stock_quantity) {
                      return (
                        <Alert className="mt-2 border-red-200 bg-red-50">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <AlertDescription className="text-red-700">
                            Insufficient stock! Available: {selectedItem.stock_quantity}, Requested: {requestedQty}
                          </AlertDescription>
                        </Alert>
                      );
                    } else if (selectedItem && requestedQty <= selectedItem.stock_quantity) {
                      return (
                        <Alert className="mt-2 border-green-200 bg-green-50">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <AlertDescription className="text-green-700">
                            Stock available: {selectedItem.stock_quantity} units
                          </AlertDescription>
                        </Alert>
                      );
                    }
                    return null;
                  })()
                )}
              </div>
            ))}

            {form.formState.errors.items && (
              <p className="text-sm text-red-500">
                {form.formState.errors.items.message}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Workflow Configuration */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-blue-100/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg">
                <CheckCircle2 className="h-4 w-4 text-white" />
              </div>
              <span className="text-indigo-800">Invoice Workflow</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="requires_approval"
                {...form.register('requires_approval')}
                className="rounded border-gray-300"
              />
              <Label htmlFor="requires_approval" className="text-sm font-medium">
                Require approval before affecting inventory stock
              </Label>
            </div>
            
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <textarea
                id="notes"
                {...form.register('notes')}
                className="w-full p-2 border rounded-md resize-none"
                rows={3}
                placeholder="Add any additional notes for this invoice..."
              />
            </div>
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
                  <p className="text-gray-600">Subtotal</p>
                  <p className="font-medium">${calculation.subtotal.toFixed(2)}</p>
                </div>
                
                {invoiceType === 'gold' && (
                  <>
                    <div>
                      <p className="text-gray-600">اجرت - Labor Cost</p>
                      <p className="font-medium">${calculation.total_labor_cost.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">سود - Profit</p>
                      <p className="font-medium">${calculation.total_profit.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">مالیات - VAT</p>
                      <p className="font-medium">${calculation.total_vat.toFixed(2)}</p>
                    </div>
                  </>
                )}
              </div>
              
              <Separator className="my-4" />
              
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-green-800">Grand Total:</span>
                <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  ${calculation.grand_total.toFixed(2)}
                </span>
              </div>
              
              {invoiceType === 'gold' && (
                <div className="mt-2 text-sm text-green-700">
                  <p>Total Weight: {calculation.items.reduce((sum, item) => sum + (item.weight_grams || 0), 0).toFixed(3)}g</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Workflow Status Indicators */}
        {calculation && (
          <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-purple-100/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <CheckCircle2 className="h-4 w-4 text-white" />
                </div>
                <span className="text-indigo-800">Workflow Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <span className="text-white text-sm font-bold">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-blue-800">Draft Stage</p>
                    <p className="text-sm text-blue-600">Invoice will be created as draft</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    form.watch('requires_approval') 
                      ? 'bg-gradient-to-br from-amber-500 to-orange-600' 
                      : 'bg-gradient-to-br from-green-500 to-green-600'
                  }`}>
                    <span className="text-white text-sm font-bold">2</span>
                  </div>
                  <div>
                    <p className={`font-medium ${
                      form.watch('requires_approval') ? 'text-amber-800' : 'text-green-800'
                    }`}>
                      {form.watch('requires_approval') ? 'Approval Required' : 'Auto-Approved'}
                    </p>
                    <p className={`text-sm ${
                      form.watch('requires_approval') ? 'text-amber-600' : 'text-green-600'
                    }`}>
                      {form.watch('requires_approval') 
                        ? 'Manual approval needed' 
                        : 'Stock will be affected immediately'
                      }
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white text-sm font-bold">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-purple-800">Stock Impact</p>
                    <p className="text-sm text-purple-600">
                      {form.watch('requires_approval') 
                        ? 'After approval' 
                        : 'Immediate deduction'
                      }
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Stock Impact Summary */}
              <div className="mt-4 p-3 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg">
                <h4 className="font-medium text-slate-800 mb-2">Stock Impact Summary</h4>
                <div className="space-y-1">
                  {form.watch('items').map((item, index) => {
                    const inventoryItem = inventoryItems.find(inv => inv.id === item.inventory_item_id);
                    if (!inventoryItem) return null;
                    
                    const requestedQty = item.quantity || 0;
                    const availableStock = inventoryItem.stock_quantity;
                    const afterDeduction = availableStock - requestedQty;
                    
                    return (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{inventoryItem.name}:</span>
                        <span className={afterDeduction < 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                          {availableStock} → {afterDeduction} units
                        </span>
                      </div>
                    );
                  })}
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
            {createMutation.isPending ? 'Creating...' : `Create ${invoiceType === 'gold' ? 'Gold' : 'General'} Invoice`}
          </Button>
        </div>
      </form>

      {/* Enhanced Preview Modal */}
      {showPreview && calculation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <Eye className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Invoice Preview</h3>
                  <p className="text-sm text-gray-600">Review before creating</p>
                </div>
              </div>
              <Button variant="ghost" onClick={() => setShowPreview(false)}>
                ×
              </Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Invoice Details */}
              <div className="space-y-4">
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {invoiceType === 'gold' ? (
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center">
                          <Gem className="h-4 w-4 text-white" />
                        </div>
                      ) : (
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                          <Package className="h-4 w-4 text-white" />
                        </div>
                      )}
                      {invoiceType === 'gold' ? 'Gold Invoice' : 'General Invoice'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Customer:</span>
                      <span className="font-medium">{selectedCustomer?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span>{selectedCustomer?.phone || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Current Debt:</span>
                      <span className={selectedCustomer?.current_debt && selectedCustomer.current_debt > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                        ${selectedCustomer?.current_debt?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Workflow:</span>
                      <Badge className={form.watch('requires_approval') ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}>
                        {form.watch('requires_approval') ? 'Requires Approval' : 'Auto-Approved'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Items List */}
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle>Invoice Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {calculation.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{item.item_name}</p>
                            <p className="text-sm text-gray-600">
                              Qty: {item.quantity} × ${item.unit_price.toFixed(2)}
                              {invoiceType === 'gold' && item.weight_grams && (
                                <span className="ml-2">({item.weight_grams}g)</span>
                              )}
                            </p>
                          </div>
                          <span className="font-bold">${item.total_price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Right Column - Calculation Summary */}
              <div className="space-y-4">
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle>Calculation Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="font-medium">${calculation.subtotal.toFixed(2)}</span>
                    </div>
                    
                    {invoiceType === 'gold' && (
                      <>
                        <div className="flex justify-between">
                          <span>اجرت - Labor Cost:</span>
                          <span className="font-medium">${calculation.total_labor_cost.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>سود - Profit:</span>
                          <span className="font-medium">${calculation.total_profit.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>مالیات - VAT:</span>
                          <span className="font-medium">${calculation.total_vat.toFixed(2)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Total Weight:</span>
                          <span>{calculation.items.reduce((sum, item) => sum + (item.weight_grams || 0), 0).toFixed(3)}g</span>
                        </div>
                      </>
                    )}
                    
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Grand Total:</span>
                      <span className="text-green-600">${calculation.grand_total.toFixed(2)}</span>
                    </div>
                  </CardContent>
                </Card>
                
                {/* QR Code Preview */}
                <QRCardIntegration showPreview={true} />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Close Preview
              </Button>
              <Button 
                onClick={() => {
                  setShowPreview(false);
                  form.handleSubmit(onSubmit)();
                }}
                className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Confirm & Create Invoice
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};