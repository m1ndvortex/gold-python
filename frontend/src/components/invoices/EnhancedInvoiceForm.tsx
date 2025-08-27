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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Separator } from '../ui/separator';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Trash2, 
  Plus, 
  Calculator, 
  Eye, 
  FileText, 
  Receipt,
  AlertTriangle,
  CheckCircle,
  Settings,
  BarChart3,
  Package,
  CreditCard
} from 'lucide-react';
import { useCustomers } from '../../hooks/useCustomers';
import { useInventoryItems } from '../../hooks/useInventory';
import { useCalculateInvoice, useCreateInvoice } from '../../hooks/useInvoices';
import { WorkflowIndicator, type WorkflowStage } from './WorkflowIndicator';
import { StockValidation } from './StockValidation';
import { PricingAnalytics } from './PricingAnalytics';
import { ApprovalSystem } from './ApprovalSystem';
import { cn } from '../../lib/utils';
import type { InvoiceCreate, InvoiceCalculationSummary } from '../../services/invoiceApi';
import type { Customer, InventoryItem } from '../../types';

// Enhanced form validation schema
const invoiceItemSchema = z.object({
  inventory_item_id: z.string().min(1, 'Please select an item'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  weight_grams: z.number().min(0.01, 'Weight must be greater than 0'),
  unit_price_override: z.number().optional(),
  discount_percentage: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
});

const invoiceFormSchema = z.object({
  customer_id: z.string().min(1, 'Please select a customer'),
  business_type: z.enum(['gold_shop', 'retail', 'service', 'manufacturing']).default('gold_shop'),
  invoice_type: z.enum(['standard', 'gold', 'service', 'return']).default('standard'),
  
  // Pricing configuration
  gold_price_per_gram: z.number().min(0.01, 'Gold price must be greater than 0'),
  labor_cost_percentage: z.number().min(0).max(100, 'Labor cost must be between 0-100%'),
  profit_percentage: z.number().min(0).max(100, 'Profit must be between 0-100%'),
  vat_percentage: z.number().min(0).max(100, 'VAT must be between 0-100%'),
  
  // Universal pricing fields
  discount_percentage: z.number().min(0).max(100).optional(),
  tax_rates: z.array(z.object({
    name: z.string(),
    rate: z.number(),
    applies_to: z.array(z.string())
  })).optional(),
  
  // Payment terms
  payment_terms: z.number().min(0).default(0),
  due_date: z.string().optional(),
  
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
  
  // Workflow settings
  require_approval: z.boolean().default(false),
  approval_threshold: z.number().optional(),
  
  // Notes and references
  notes: z.string().optional(),
  reference_number: z.string().optional(),
});

type InvoiceFormData = z.infer<typeof invoiceFormSchema>;

interface EnhancedInvoiceFormProps {
  onSuccess?: (invoice: any) => void;
  onCancel?: () => void;
  initialData?: Partial<InvoiceFormData>;
  mode?: 'create' | 'edit';
  currentUser?: {
    id: string;
    name: string;
    role: string;
  };
}

export const EnhancedInvoiceForm: React.FC<EnhancedInvoiceFormProps> = ({
  onSuccess,
  onCancel,
  initialData,
  mode = 'create',
  currentUser = { id: '1', name: 'Current User', role: 'manager' }
}) => {
  const [calculation, setCalculation] = useState<InvoiceCalculationSummary | null>(null);
  const [currentStage, setCurrentStage] = useState<WorkflowStage>('draft');
  const [activeTab, setActiveTab] = useState('basic');
  const [stockValidationResults, setStockValidationResults] = useState<any[]>([]);
  const [showAdvancedPricing, setShowAdvancedPricing] = useState(false);

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
      business_type: 'gold_shop',
      invoice_type: 'standard',
      gold_price_per_gram: 2500,
      labor_cost_percentage: 10,
      profit_percentage: 15,
      vat_percentage: 9,
      discount_percentage: 0,
      payment_terms: 0,
      require_approval: false,
      items: [{ 
        inventory_item_id: '', 
        quantity: 1, 
        weight_grams: 1, // Set to 1 instead of 0 to avoid validation issues
        unit_price_override: undefined,
        discount_percentage: 0,
        notes: ''
      }],
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
    
    // Debug logging
    console.log('Calculation check:', {
      customer_id: !!customer_id,
      items_length: items?.length || 0,
      items_valid: items?.every(item => item.inventory_item_id && item.quantity > 0 && item.weight_grams > 0),
      gold_price: calculationData.gold_price_per_gram,
      items: items
    });
    
    if (
      customer_id &&
      items?.length > 0 &&
      items.every(item => item.inventory_item_id && item.quantity > 0 && item.weight_grams > 0) &&
      calculationData.gold_price_per_gram > 0
    ) {
      const invoiceData: InvoiceCreate = {
        customer_id,
        gold_price_per_gram: calculationData.gold_price_per_gram,
        labor_cost_percentage: calculationData.labor_cost_percentage || 0,
        profit_percentage: calculationData.profit_percentage || 0,
        vat_percentage: calculationData.vat_percentage || 0,
        items: items.map(item => ({
          inventory_item_id: item.inventory_item_id,
          quantity: item.quantity,
          weight_grams: item.weight_grams,
          unit_price: item.unit_price_override || 0, // Backend will calculate actual price
        })),
      };

      console.log('Triggering calculation with:', invoiceData);

      calculateMutation.mutate(invoiceData, {
        onSuccess: (result) => {
          console.log('Calculation success:', result);
          setCalculation(result);
        },
        onError: (error) => {
          console.error('Calculation error:', error);
          setCalculation(null);
        },
      });
    } else {
      setCalculation(null);
    }
  }, [watchedValues, calculateMutation]);

  // Handle item selection
  const handleItemSelect = (index: number, itemId: string) => {
    const selectedItem = inventoryItems.find(item => item.id === itemId);
    if (selectedItem) {
      form.setValue(`items.${index}.inventory_item_id`, itemId);
      form.setValue(`items.${index}.weight_grams`, selectedItem.weight_grams);
    }
  };

  // Add new item row
  const addItem = () => {
    append({ 
      inventory_item_id: '', 
      quantity: 1, 
      weight_grams: 1, // Set to 1 instead of 0 to avoid validation issues
      unit_price_override: undefined,
      discount_percentage: 0,
      notes: ''
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
        unit_price: item.unit_price_override || 0, // Backend will calculate actual price
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

  // Prepare stock validation data
  const stockItems = watchedValues.items
    .filter(item => item.inventory_item_id)
    .map(item => {
      const inventoryItem = inventoryItems.find(inv => inv.id === item.inventory_item_id);
      return {
        inventoryItemId: item.inventory_item_id,
        itemName: inventoryItem?.name || 'Unknown Item',
        requestedQuantity: item.quantity,
        availableStock: inventoryItem?.stock_quantity || 0,
        category: inventoryItem?.category_id,
        lowStockThreshold: inventoryItem?.min_stock_level || 0
      };
    });

  // Prepare pricing analytics data
  const pricingItems = calculation?.items.map(item => ({
    itemId: item.item_id,
    itemName: item.item_name,
    quantity: item.quantity,
    costPrice: 0, // Would come from inventory item
    salePrice: item.unit_price,
    totalCost: 0,
    totalRevenue: item.total_price,
    margin: item.total_price, // Simplified
    marginPercentage: 20 // Simplified
  })) || [];

  const pricingBreakdown = calculation ? {
    subtotal: calculation.subtotal,
    totalCost: 0, // Would be calculated
    grossProfit: calculation.grand_total - calculation.subtotal,
    profitMargin: 20, // Simplified
    goldSpecific: watchedValues.business_type === 'gold_shop' ? {
      totalWeight: calculation.items.reduce((sum, item) => sum + item.weight_grams, 0),
      goldValue: calculation.subtotal,
      laborCost: calculation.total_labor_cost,
      profitAmount: calculation.total_profit
    } : undefined,
    taxAmount: calculation.total_vat,
    discountAmount: 0,
    finalTotal: calculation.grand_total
  } : {
    subtotal: 0,
    totalCost: 0,
    grossProfit: 0,
    profitMargin: 0,
    taxAmount: 0,
    discountAmount: 0,
    finalTotal: 0
  };

  const selectedCustomer = customers.find(c => c.id === watchedValues.customer_id);

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-gradient-to-r from-slate-50/80 to-slate-100/60 backdrop-blur-sm border border-slate-200/40 h-auto p-1 rounded-lg">
          <TabsTrigger 
            value="basic" 
            className="flex items-center gap-2 p-3 text-slate-700 hover:text-slate-900 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-blue-300 data-[state=active]:text-blue-900 rounded-lg m-1 transition-all duration-300"
          >
            <FileText className="h-4 w-4" />
            <span className="font-medium">Basic Info</span>
          </TabsTrigger>
          <TabsTrigger 
            value="items" 
            className="flex items-center gap-2 p-3 text-slate-700 hover:text-slate-900 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-purple-300 data-[state=active]:text-purple-900 rounded-lg m-1 transition-all duration-300"
          >
            <Receipt className="h-4 w-4" />
            <span className="font-medium">Items</span>
          </TabsTrigger>
          <TabsTrigger 
            value="validation" 
            className="flex items-center gap-2 p-3 text-slate-700 hover:text-slate-900 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-green-300 data-[state=active]:text-green-900 rounded-lg m-1 transition-all duration-300"
          >
            <Package className="h-4 w-4" />
            <span className="font-medium">Validation</span>
          </TabsTrigger>
          <TabsTrigger 
            value="analytics" 
            className="flex items-center gap-2 p-3 text-slate-700 hover:text-slate-900 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-emerald-300 data-[state=active]:text-emerald-900 rounded-lg m-1 transition-all duration-300"
          >
            <BarChart3 className="h-4 w-4" />
            <span className="font-medium">Analytics</span>
          </TabsTrigger>
          <TabsTrigger 
            value="workflow" 
            className="flex items-center gap-2 p-3 text-slate-700 hover:text-slate-900 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-indigo-300 data-[state=active]:text-indigo-900 rounded-lg m-1 transition-all duration-300"
          >
            <Settings className="h-4 w-4" />
            <span className="font-medium">Workflow</span>
          </TabsTrigger>
        </TabsList>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <TabsContent value="basic" className="space-y-6 mt-6">
            {/* Customer Selection */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50/80 to-indigo-100/60 backdrop-blur-sm border border-blue-200/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                    <FileText className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-blue-900 font-semibold">Customer & Business Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                  <div>
                    <Label htmlFor="business_type">Business Type</Label>
                    <Select
                      value={form.watch('business_type')}
                      onValueChange={(value: any) => form.setValue('business_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gold_shop">Gold Shop</SelectItem>
                        <SelectItem value="retail">Retail Store</SelectItem>
                        <SelectItem value="service">Service Business</SelectItem>
                        <SelectItem value="manufacturing">Manufacturing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {selectedCustomer && (
                  <div className="p-3 bg-white/60 backdrop-blur-sm rounded-lg border border-blue-200/40">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="block text-slate-700 font-medium">Current Debt</span>
                        <span className="font-semibold text-slate-900">${selectedCustomer.current_debt.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="block text-slate-700 font-medium">Total Purchases</span>
                        <span className="font-semibold text-slate-900">${selectedCustomer.total_purchases.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="block text-slate-700 font-medium">Customer Type</span>
                        <span className="font-semibold text-slate-900">{selectedCustomer.customer_type || 'Standard'}</span>
                      </div>
                      <div>
                        <span className="block text-slate-700 font-medium">Credit Limit</span>
                        <span className="font-semibold text-slate-900">
                          {selectedCustomer.credit_limit ? `$${selectedCustomer.credit_limit.toFixed(2)}` : 'No limit'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pricing Configuration */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50/80 to-teal-100/60 backdrop-blur-sm border border-emerald-200/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                      <Calculator className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-emerald-900 font-semibold">Pricing Configuration</span>
                  </CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAdvancedPricing(!showAdvancedPricing)}
                    className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                  >
                    {showAdvancedPricing ? 'Basic' : 'Advanced'} Pricing
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {watchedValues.business_type === 'gold_shop' && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                    </div>
                  </div>
                )}

                {showAdvancedPricing && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-white/60 backdrop-blur-sm border border-emerald-200/50 rounded-lg">
                    <div>
                      <Label htmlFor="discount_percentage">Global Discount (%)</Label>
                      <Input
                        id="discount_percentage"
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        {...form.register('discount_percentage', { valueAsNumber: true })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="payment_terms">Payment Terms (days)</Label>
                      <Input
                        id="payment_terms"
                        type="number"
                        min="0"
                        {...form.register('payment_terms', { valueAsNumber: true })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="reference_number">Reference Number</Label>
                      <Input
                        id="reference_number"
                        placeholder="PO#, Job#, etc."
                        {...form.register('reference_number')}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="items" className="space-y-6 mt-6">
            {/* Items Selection */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50/80 to-violet-100/60 backdrop-blur-sm border border-purple-200/30">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg">
                    <Receipt className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-purple-900 font-semibold">Invoice Items</span>
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
                  <div key={field.id} className="grid grid-cols-12 gap-4 items-end p-4 bg-white/60 backdrop-blur-sm border border-purple-200/40 rounded-lg">
                    <div className="col-span-4">
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
                      <Label>Price Override</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Auto"
                        {...form.register(`items.${index}.unit_price_override`, { valueAsNumber: true })}
                      />
                    </div>

                    <div className="col-span-1">
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
              <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50/80 to-emerald-100/60 backdrop-blur-sm border border-green-200/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                      <Calculator className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-green-900 font-semibold">Invoice Summary</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-slate-700 font-medium">Subtotal (Gold)</p>
                      <p className="font-semibold text-slate-900">${calculation.subtotal.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-slate-700 font-medium">Labor Cost</p>
                      <p className="font-semibold text-slate-900">${calculation.total_labor_cost.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-slate-700 font-medium">Profit</p>
                      <p className="font-semibold text-slate-900">${calculation.total_profit.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-slate-700 font-medium">VAT</p>
                      <p className="font-semibold text-slate-900">${calculation.total_vat.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-green-200">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-green-900">Grand Total:</span>
                      <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        ${calculation.grand_total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="validation" className="space-y-6 mt-6">
            <StockValidation
              items={stockItems}
              onValidationComplete={setStockValidationResults}
              realTimeValidation={true}
            />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6 mt-6">
            <PricingAnalytics
              items={pricingItems}
              breakdown={pricingBreakdown}
              businessType={watchedValues.business_type}
              targetMargin={20}
            />
          </TabsContent>

          <TabsContent value="workflow" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <WorkflowIndicator
                currentStage={currentStage}
                approvalRequired={watchedValues.require_approval}
                showProgress={true}
              />
              
              {watchedValues.require_approval && (
                <ApprovalSystem
                  invoiceId="new"
                  currentStage={currentStage}
                  totalAmount={calculation?.grand_total || 0}
                  approvalRequired={watchedValues.require_approval}
                  approvalRules={[
                    { role: 'manager', amountThreshold: 1000, required: true },
                    { role: 'admin', amountThreshold: 0, required: true }
                  ]}
                  approvalHistory={[]}
                  currentUser={currentUser}
                  onApprove={async () => setCurrentStage('approved')}
                  onReject={async () => setCurrentStage('draft')}
                  onRequestApproval={async () => setCurrentStage('pending_approval')}
                />
              )}
            </div>
          </TabsContent>

          {/* Form Actions */}
          <div className="flex justify-between sticky bottom-0 bg-white/95 backdrop-blur-sm p-4 border-t border-slate-200/50 shadow-lg">
            <div className="flex gap-2">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
            </div>
            
            <div className="flex flex-col gap-2">
              <Button
                type="submit"
                disabled={
                  createMutation.isPending ||
                  !watchedValues.customer_id ||
                  !watchedValues.items?.length ||
                  !watchedValues.items.every(item => item.inventory_item_id && item.quantity > 0 && item.weight_grams > 0) ||
                  !watchedValues.gold_price_per_gram
                }
                className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Invoice'}
              </Button>
              
              {/* Debug info - remove in production */}
              {(!watchedValues.customer_id ||
                !watchedValues.items?.length ||
                !watchedValues.items.every(item => item.inventory_item_id && item.quantity > 0 && item.weight_grams > 0) ||
                !watchedValues.gold_price_per_gram) && (
                <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                  Missing: {[
                    !watchedValues.customer_id && 'Customer',
                    !watchedValues.items?.length && 'Items',
                    watchedValues.items?.length && !watchedValues.items.every(item => item.inventory_item_id && item.quantity > 0 && item.weight_grams > 0) && 'Complete item details',
                    !watchedValues.gold_price_per_gram && 'Gold price'
                  ].filter(Boolean).join(', ')}
                </div>
              )}
            </div>
          </div>
        </form>
      </Tabs>
    </div>
  );
};