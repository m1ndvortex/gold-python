import React, { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { 
  Upload, 
  X, 
  Package, 
  Scan, 
  QrCode, 
  Barcode,
  Plus,
  Minus,
  Save,
  AlertCircle,
  Info,
  Tag,
  Hash,
  DollarSign,
  Weight,
  Layers,
  Calendar,
  Type,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '../ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { Switch } from '../ui/switch';
import { Alert, AlertDescription } from '../ui/alert';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { useLanguage } from '../../hooks/useLanguage';
import { cn } from '../../lib/utils';
import type { 
  UniversalInventoryItem,
  UniversalInventoryItemCreate,
  UniversalInventoryItemUpdate,
  UniversalCategory,
  AttributeDefinition,
  AttributeType
} from '../../types/universalInventory';

interface UniversalInventoryItemFormProps {
  item?: UniversalInventoryItem | null;
  categories: UniversalCategory[];
  onClose: () => void;
  onSubmit: (data: UniversalInventoryItemCreate | UniversalInventoryItemUpdate) => Promise<void>;
  isLoading?: boolean;
}

interface FormData extends UniversalInventoryItemCreate {
  // Additional form-specific fields
  generate_sku?: boolean;
  generate_barcode?: boolean;
  enable_multi_unit?: boolean;
}

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'JPY', label: 'JPY (¥)' },
  { value: 'AED', label: 'AED (د.إ)' },
  { value: 'SAR', label: 'SAR (ر.س)' },
];

const UNIT_OF_MEASURE_OPTIONS = [
  { value: 'piece', label: 'Piece' },
  { value: 'gram', label: 'Gram' },
  { value: 'kilogram', label: 'Kilogram' },
  { value: 'liter', label: 'Liter' },
  { value: 'meter', label: 'Meter' },
  { value: 'box', label: 'Box' },
  { value: 'pack', label: 'Pack' },
  { value: 'bottle', label: 'Bottle' },
  { value: 'custom', label: 'Custom' },
];

export const UniversalInventoryItemForm: React.FC<UniversalInventoryItemFormProps> = ({ 
  item, 
  categories,
  onClose,
  onSubmit,
  isLoading = false
}) => {
  const { t } = useLanguage();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<UniversalCategory | null>(null);
  const [customAttributes, setCustomAttributes] = useState<Record<string, any>>({});
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [activeTab, setActiveTab] = useState('basic');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const isEditing = !!item;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors, isSubmitting },
    reset,
    trigger,
  } = useForm<FormData>({
    defaultValues: {
      name: '',
      sku: '',
      barcode: '',
      qr_code: '',
      category_id: '',
      description: '',
      cost_price: 0,
      sale_price: 0,
      currency: 'USD',
      stock_quantity: 0,
      min_stock_level: 5,
      unit_of_measure: 'piece',
      conversion_factors: {},
      attributes: {},
      tags: [],
      business_type_fields: {},
      weight_grams: 0,
      purchase_price: 0,
      sell_price: 0,
      gold_specific: {},
      image_url: '',
      generate_sku: true,
      generate_barcode: false,
      enable_multi_unit: false,
    },
  });

  // Watch form values
  const watchedCategoryId = watch('category_id');
  const watchedCostPrice = watch('cost_price');
  const watchedGenerateSku = watch('generate_sku');
  const watchedGenerateBarcode = watch('generate_barcode');
  const watchedEnableMultiUnit = watch('enable_multi_unit');

  // Find selected category and its attribute schema
  const categoryWithSchema = useMemo(() => {
    if (!watchedCategoryId) return null;
    return categories.find(cat => cat.id === watchedCategoryId) || null;
  }, [watchedCategoryId, categories]);

  // Initialize form with item data if editing
  useEffect(() => {
    if (item) {
      reset({
        name: item.name,
        sku: item.sku || '',
        barcode: item.barcode || '',
        qr_code: item.qr_code || '',
        category_id: item.category_id || '',
        description: item.description || '',
        cost_price: item.cost_price || 0,
        sale_price: item.sale_price || 0,
        currency: item.currency || 'USD',
        stock_quantity: item.stock_quantity,
        min_stock_level: item.min_stock_level,
        unit_of_measure: item.unit_of_measure || 'piece',
        conversion_factors: item.conversion_factors || {},
        attributes: item.attributes || {},
        tags: item.tags || [],
        business_type_fields: item.business_type_fields || {},
        weight_grams: item.weight_grams || 0,
        purchase_price: item.purchase_price || 0,
        sell_price: item.sell_price || 0,
        gold_specific: item.gold_specific || {},
        image_url: item.image_url || '',
        generate_sku: false,
        generate_barcode: false,
        enable_multi_unit: !!item.conversion_factors && Object.keys(item.conversion_factors).length > 0,
      });
      setImagePreview(item.image_url || '');
      setCustomAttributes(item.attributes || {});
      setTags(item.tags || []);
    }
  }, [item, reset]);

  // Auto-calculate sell price suggestion (cost price + 30% markup)
  useEffect(() => {
    if (watchedCostPrice && watchedCostPrice > 0 && !isEditing) {
      const suggestedSellPrice = watchedCostPrice * 1.3;
      setValue('sale_price', Number(suggestedSellPrice.toFixed(2)));
    }
  }, [watchedCostPrice, setValue, isEditing]);

  // Handle image upload
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
    setValue('image_url', '');
  };

  // Handle tags
  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      const updatedTags = [...tags, newTag.trim()];
      setTags(updatedTags);
      setValue('tags', updatedTags);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const updatedTags = tags.filter(tag => tag !== tagToRemove);
    setTags(updatedTags);
    setValue('tags', updatedTags);
  };

  // Handle custom attributes
  const updateCustomAttribute = (name: string, value: any, type: AttributeType) => {
    const updatedAttributes = {
      ...customAttributes,
      [name]: value
    };
    setCustomAttributes(updatedAttributes);
    setValue('attributes', updatedAttributes);
  };

  // Render custom attribute input based on type
  const renderAttributeInput = (attr: AttributeDefinition) => {
    const value = customAttributes[attr.name] || attr.default_value;

    switch (attr.type) {
      case 'text':
      case 'url':
      case 'email':
        return (
          <Input
            value={value || ''}
            onChange={(e) => updateCustomAttribute(attr.name, e.target.value, attr.type)}
            placeholder={attr.help_text || `Enter ${attr.label.toLowerCase()}`}
            type={attr.type === 'email' ? 'email' : attr.type === 'url' ? 'url' : 'text'}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => updateCustomAttribute(attr.name, parseFloat(e.target.value) || 0, attr.type)}
            placeholder={attr.help_text || `Enter ${attr.label.toLowerCase()}`}
          />
        );

      case 'date':
        return (
          <Input
            type="date"
            value={value || ''}
            onChange={(e) => updateCustomAttribute(attr.name, e.target.value, attr.type)}
          />
        );

      case 'boolean':
        return (
          <Switch
            checked={!!value}
            onCheckedChange={(checked) => updateCustomAttribute(attr.name, checked, attr.type)}
          />
        );

      case 'enum':
        return (
          <Select
            value={value || ''}
            onValueChange={(selectedValue) => updateCustomAttribute(attr.name, selectedValue, attr.type)}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${attr.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {attr.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'multi_select':
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-2">
            {attr.options?.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  checked={selectedValues.includes(option)}
                  onCheckedChange={(checked) => {
                    const newValues = checked
                      ? [...selectedValues, option]
                      : selectedValues.filter(v => v !== option);
                    updateCustomAttribute(attr.name, newValues, attr.type);
                  }}
                />
                <Label className="text-sm">{option}</Label>
              </div>
            ))}
          </div>
        );

      default:
        return (
          <Input
            value={value || ''}
            onChange={(e) => updateCustomAttribute(attr.name, e.target.value, 'text')}
            placeholder={attr.help_text || `Enter ${attr.label.toLowerCase()}`}
          />
        );
    }
  };

  // Form submission
  const onFormSubmit = async (data: FormData) => {
    try {
      let imageUrl = data.image_url;

      // Upload image if a new file is selected
      if (imageFile) {
        setIsUploading(true);
        // TODO: Implement image upload
        // const uploadResult = await inventoryImageApi.uploadImage(imageFile);
        // imageUrl = uploadResult.image_url;
        setIsUploading(false);
      }

      const formData = {
        ...data,
        image_url: imageUrl,
        attributes: customAttributes,
        tags: tags,
      };

      // Remove form-specific fields
      delete formData.generate_sku;
      delete formData.generate_barcode;
      delete formData.enable_multi_unit;

      await onSubmit(formData);
      onClose();
    } catch (error) {
      setIsUploading(false);
      console.error('Failed to save item:', error);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center shadow-lg">
              <Package className="h-4 w-4 text-white" />
            </div>
            {isEditing ? 'Edit Universal Inventory Item' : 'Add New Universal Inventory Item'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList variant="gradient-green" className="grid w-full grid-cols-4">
              <TabsTrigger variant="gradient-green" value="basic" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Basic Info
              </TabsTrigger>
              <TabsTrigger variant="gradient-green" value="pricing" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Pricing & Stock
              </TabsTrigger>
              <TabsTrigger variant="gradient-green" value="attributes" className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Attributes
              </TabsTrigger>
              <TabsTrigger variant="gradient-green" value="advanced" className="flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Advanced
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[500px] mt-4">
              <TabsContent variant="gradient-green" value="basic" className="space-y-6">
                {/* Image Upload Section */}
                <Card variant="gradient-green">
                  <CardHeader>
                    <CardTitle className="text-lg">Product Image</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {imagePreview ? (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-48 object-cover rounded-md"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={removeImage}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-md p-8 text-center">
                        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            Upload a product image
                          </p>
                          <Label htmlFor="image-upload" className="cursor-pointer">
                            <Button type="button" variant="outline" asChild>
                              <span className="flex items-center gap-2">
                                <Upload className="h-4 w-4" />
                                Choose File
                              </span>
                            </Button>
                          </Label>
                        </div>
                      </div>
                    )}
                    <Input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </CardContent>
                </Card>

                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Item Name *</Label>
                    <Input
                      id="name"
                      {...register('name', { required: 'Item name is required' })}
                      placeholder="e.g., Premium Gold Ring"
                    />
                    {errors.name && (
                      <p className="text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category_id">Category *</Label>
                    <Select
                      value={watch('category_id')}
                      onValueChange={(value) => setValue('category_id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.category_id && (
                      <p className="text-sm text-red-600">{errors.category_id.message}</p>
                    )}
                  </div>
                </div>

                {/* Identifiers */}
                <Card variant="gradient-blue">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Hash className="h-5 w-5" />
                      Product Identifiers
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="sku">SKU</Label>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={watchedGenerateSku}
                              onCheckedChange={(checked) => setValue('generate_sku', checked)}
                            />
                            <Label className="text-xs">Auto-generate</Label>
                          </div>
                        </div>
                        <Input
                          id="sku"
                          {...register('sku')}
                          placeholder="e.g., GLD-RNG-001"
                          disabled={watchedGenerateSku}
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="barcode">Barcode</Label>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={watchedGenerateBarcode}
                              onCheckedChange={(checked) => setValue('generate_barcode', checked)}
                            />
                            <Label className="text-xs">Auto-generate</Label>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Input
                            id="barcode"
                            {...register('barcode')}
                            placeholder="e.g., 1234567890123"
                            disabled={watchedGenerateBarcode}
                          />
                          <Button type="button" variant="outline" size="icon">
                            <Scan className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="qr_code">QR Code Data</Label>
                      <div className="flex gap-2">
                        <Input
                          id="qr_code"
                          {...register('qr_code')}
                          placeholder="Optional QR code data"
                        />
                        <Button type="button" variant="outline" size="icon">
                          <QrCode className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    {...register('description')}
                    placeholder="Optional description of the item..."
                    rows={3}
                  />
                </div>
              </TabsContent>

              <TabsContent variant="gradient-green" value="pricing" className="space-y-6">
                {/* Pricing */}
                <Card variant="gradient-purple">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Pricing Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="cost_price">Cost Price *</Label>
                        <Input
                          id="cost_price"
                          type="number"
                          step="0.01"
                          {...register('cost_price', { 
                            required: 'Cost price is required',
                            min: { value: 0, message: 'Price must be positive' }
                          })}
                          placeholder="0.00"
                        />
                        {errors.cost_price && (
                          <p className="text-sm text-red-600">{errors.cost_price.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="sale_price">Sale Price *</Label>
                        <Input
                          id="sale_price"
                          type="number"
                          step="0.01"
                          {...register('sale_price', { 
                            required: 'Sale price is required',
                            min: { value: 0, message: 'Price must be positive' }
                          })}
                          placeholder="0.00"
                        />
                        {errors.sale_price && (
                          <p className="text-sm text-red-600">{errors.sale_price.message}</p>
                        )}
                        {watchedCostPrice && watchedCostPrice > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Suggested: ${(watchedCostPrice * 1.3).toFixed(2)} (30% markup)
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="currency">Currency</Label>
                        <Select
                          value={watch('currency')}
                          onValueChange={(value) => setValue('currency', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CURRENCY_OPTIONS.map((currency) => (
                              <SelectItem key={currency.value} value={currency.value}>
                                {currency.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Gold Shop Compatibility */}
                    <Separator />
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-muted-foreground">Gold Shop Compatibility</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="weight_grams">Weight (grams)</Label>
                          <Input
                            id="weight_grams"
                            type="number"
                            step="0.001"
                            {...register('weight_grams')}
                            placeholder="0.000"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="purchase_price">Purchase Price (Legacy)</Label>
                          <Input
                            id="purchase_price"
                            type="number"
                            step="0.01"
                            {...register('purchase_price')}
                            placeholder="0.00"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="sell_price">Sell Price (Legacy)</Label>
                          <Input
                            id="sell_price"
                            type="number"
                            step="0.01"
                            {...register('sell_price')}
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Stock Information */}
                <Card variant="gradient-teal">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Stock Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="stock_quantity">Current Stock *</Label>
                        <Input
                          id="stock_quantity"
                          type="number"
                          {...register('stock_quantity', { 
                            required: 'Stock quantity is required',
                            min: { value: 0, message: 'Stock cannot be negative' }
                          })}
                          placeholder="0"
                        />
                        {errors.stock_quantity && (
                          <p className="text-sm text-red-600">{errors.stock_quantity.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="min_stock_level">Minimum Stock Level</Label>
                        <Input
                          id="min_stock_level"
                          type="number"
                          {...register('min_stock_level', { 
                            min: { value: 0, message: 'Minimum stock cannot be negative' }
                          })}
                          placeholder="5"
                        />
                        {errors.min_stock_level && (
                          <p className="text-sm text-red-600">{errors.min_stock_level.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="unit_of_measure">Unit of Measure</Label>
                        <Select
                          value={watch('unit_of_measure')}
                          onValueChange={(value) => setValue('unit_of_measure', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {UNIT_OF_MEASURE_OPTIONS.map((unit) => (
                              <SelectItem key={unit.value} value={unit.value}>
                                {unit.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Multi-Unit Support */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={watchedEnableMultiUnit}
                          onCheckedChange={(checked) => setValue('enable_multi_unit', checked)}
                        />
                        <Label>Enable Multi-Unit Tracking</Label>
                      </div>

                      {watchedEnableMultiUnit && (
                        <Alert>
                          <Info className="h-4 w-4" />
                          <AlertDescription>
                            Multi-unit tracking allows you to define conversion factors between different units of measure.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent variant="gradient-green" value="attributes" className="space-y-6">
                {/* Tags */}
                <Card variant="gradient-pink">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Tag className="h-5 w-5" />
                      Tags
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                          {tag}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 p-0 hover:bg-transparent"
                            onClick={() => removeTag(tag)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="Add a tag..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addTag();
                          }
                        }}
                      />
                      <Button type="button" onClick={addTag} variant="outline">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Custom Attributes */}
                {categoryWithSchema && categoryWithSchema.attribute_schema.length > 0 && (
                  <Card variant="gradient-indigo">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Layers className="h-5 w-5" />
                        Custom Attributes
                        <Badge variant="secondary">{categoryWithSchema.name}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {categoryWithSchema.attribute_schema
                        .sort((a, b) => a.display_order - b.display_order)
                        .map((attr) => (
                          <div key={attr.name} className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Label htmlFor={`attr-${attr.name}`}>
                                {attr.label}
                                {attr.required && <span className="text-red-500">*</span>}
                              </Label>
                              {attr.help_text && (
                                <div className="group relative">
                                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                    {attr.help_text}
                                  </div>
                                </div>
                              )}
                            </div>
                            {renderAttributeInput(attr)}
                          </div>
                        ))}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent variant="gradient-green" value="advanced" className="space-y-6">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Advanced settings for business-specific configurations and integrations.
                  </AlertDescription>
                </Alert>

                {/* Business Type Fields */}
                <Card variant="gradient-orange">
                  <CardHeader>
                    <CardTitle className="text-lg">Business Type Specific Fields</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Additional fields will be available based on your business type configuration.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </ScrollArea>
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="gradient-green"
              disabled={isSubmitting || isUploading || isLoading}
            >
              {isSubmitting || isUploading || isLoading ? (
                isUploading ? 'Uploading...' : 'Saving...'
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEditing ? 'Update Item' : 'Create Item'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};