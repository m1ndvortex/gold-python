/**
 * Universal Inventory Item Form Component
 * Form for creating and editing universal inventory items with custom attributes,
 * image management, SKU/barcode/QR code handling, and business rule validation
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { 
  Upload, 
  X, 
  Package, 
  Plus, 
  Minus, 
  QrCode, 
  Barcode,
  Tag,
  Image as ImageIcon,
  Save,
  AlertCircle,
  Info
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
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
import { Checkbox } from '../ui/checkbox';
import { Switch } from '../ui/switch';
import { Alert, AlertDescription } from '../ui/alert';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../hooks/useLanguage';
import type { 
  UniversalInventoryItem,
  UniversalInventoryItemCreate,
  UniversalInventoryItemUpdate,
  UniversalCategory,
  AttributeDefinition,
  ImageRecord
} from '../../types/universalInventory';

interface UniversalInventoryItemFormProps {
  item?: UniversalInventoryItem;
  categories: UniversalCategory[];
  onSubmit: (data: UniversalInventoryItemCreate | UniversalInventoryItemUpdate) => Promise<void>;
  onClose: () => void;
  isLoading?: boolean;
  businessType?: string;
}

interface FormData extends UniversalInventoryItemCreate {
  images?: File[];
  custom_attributes_array?: Array<{ name: string; value: any; type: string }>;
  tags_string?: string;
}

interface CustomAttributeFieldProps {
  attribute: AttributeDefinition;
  value: any;
  onChange: (value: any) => void;
  error?: string;
}

const CustomAttributeField: React.FC<CustomAttributeFieldProps> = ({
  attribute,
  value,
  onChange,
  error
}) => {
  const { t } = useLanguage();

  const renderField = () => {
    switch (attribute.type) {
      case 'text':
        return (
          <Input
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={attribute.default_value || ''}
          />
        );
      
      case 'number':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            placeholder={attribute.default_value?.toString() || '0'}
          />
        );
      
      case 'date':
        return (
          <Input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
          />
        );
      
      case 'boolean':
        return (
          <Switch
            checked={value || false}
            onCheckedChange={onChange}
          />
        );
      
      case 'enum':
        return (
          <Select value={value || ''} onValueChange={onChange}>
            <SelectTrigger>
              <SelectValue placeholder={t('inventory.select_option')} />
            </SelectTrigger>
            <SelectContent>
              {attribute.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      default:
        return (
          <Input
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        {attribute.name}
        {attribute.required && <span className="text-red-500">*</span>}
        {attribute.validation && (
          <Info className="h-3 w-3 text-muted-foreground" />
        )}
      </Label>
      {renderField()}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export const UniversalInventoryItemForm: React.FC<UniversalInventoryItemFormProps> = ({
  item,
  categories,
  onSubmit,
  onClose,
  isLoading = false,
  businessType = 'universal'
}) => {
  const { t } = useLanguage();
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<UniversalCategory | null>(null);
  const [generatedSKU, setGeneratedSKU] = useState<string>('');
  const [activeTab, setActiveTab] = useState('basic');

  const isEditing = !!item;

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    reset,
    trigger,
  } = useForm<FormData>({
    defaultValues: {
      name: '',
      name_persian: '',
      description: '',
      description_persian: '',
      category_id: '',
      sku: '',
      barcode: '',
      qr_code: '',
      cost_price: 0,
      sale_price: 0,
      currency: 'USD',
      stock_quantity: 0,
      unit_of_measure: 'piece',
      low_stock_threshold: 5,
      reorder_point: 10,
      max_stock_level: undefined,
      custom_attributes: {},
      tags: [],
      tags_string: '',
      weight_grams: undefined,
      business_type_fields: {},
      item_metadata: {},
    },
  });

  const { fields: customAttributeFields, append: appendCustomAttribute, remove: removeCustomAttribute } = useFieldArray({
    control,
    name: 'custom_attributes_array',
  });

  // Watch form values
  const watchedCategoryId = watch('category_id');
  const watchedName = watch('name');
  const watchedCostPrice = watch('cost_price');

  // Initialize form with item data if editing
  useEffect(() => {
    if (item) {
      reset({
        name: item.name,
        name_persian: item.name_persian,
        description: item.description,
        description_persian: item.description_persian,
        category_id: item.category_id,
        sku: item.sku,
        barcode: item.barcode,
        qr_code: item.qr_code,
        cost_price: item.cost_price,
        sale_price: item.sale_price,
        currency: item.currency,
        stock_quantity: item.stock_quantity,
        unit_of_measure: item.unit_of_measure,
        low_stock_threshold: item.low_stock_threshold,
        reorder_point: item.reorder_point,
        max_stock_level: item.max_stock_level,
        custom_attributes: item.custom_attributes,
        tags: item.tags,
        tags_string: item.tags.join(', '),
        weight_grams: item.weight_grams,
        business_type_fields: item.business_type_fields,
        item_metadata: item.item_metadata,
      });

      // Convert custom attributes to array format for form
      const attributesArray = Object.entries(item.custom_attributes || {}).map(([name, value]) => ({
        name,
        value,
        type: typeof value === 'number' ? 'number' : typeof value === 'boolean' ? 'boolean' : 'text'
      }));
      setValue('custom_attributes_array', attributesArray);
    }
  }, [item, reset, setValue]);

  // Update selected category when category_id changes
  useEffect(() => {
    if (watchedCategoryId) {
      const category = categories.find(cat => cat.id === watchedCategoryId);
      setSelectedCategory(category || null);
    } else {
      setSelectedCategory(null);
    }
  }, [watchedCategoryId, categories]);

  // Generate SKU when name or category changes
  useEffect(() => {
    if (!isEditing && watchedName && selectedCategory) {
      const prefix = selectedCategory.name.substring(0, 3).toUpperCase();
      const timestamp = Date.now().toString().slice(-6);
      const sku = `${prefix}-${timestamp}`;
      setGeneratedSKU(sku);
      setValue('sku', sku);
    }
  }, [watchedName, selectedCategory, isEditing, setValue]);

  // Auto-calculate sale price suggestion
  useEffect(() => {
    if (!isEditing && watchedCostPrice > 0) {
      const suggestedSalePrice = watchedCostPrice * 1.3; // 30% markup
      setValue('sale_price', Number(suggestedSalePrice.toFixed(2)));
    }
  }, [watchedCostPrice, isEditing, setValue]);

  const handleImageChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setSelectedImages(prev => [...prev, ...files]);

    // Create previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const removeImage = useCallback((index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleTagsChange = useCallback((tagsString: string) => {
    const tags = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    setValue('tags', tags);
  }, [setValue]);

  const addCustomAttribute = useCallback(() => {
    appendCustomAttribute({ name: '', value: '', type: 'text' });
  }, [appendCustomAttribute]);

  const generateBarcode = useCallback(() => {
    const barcode = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    setValue('barcode', barcode);
  }, [setValue]);

  const generateQRCode = useCallback(() => {
    const qrCode = `ITEM:${generatedSKU || watchedName}:${Date.now()}`;
    setValue('qr_code', qrCode);
  }, [setValue, generatedSKU, watchedName]);

  const onFormSubmit = async (data: FormData) => {
    try {
      // Convert custom attributes array back to object
      const customAttributes: Record<string, any> = {};
      data.custom_attributes_array?.forEach(attr => {
        if (attr.name && attr.value !== undefined) {
          customAttributes[attr.name] = attr.value;
        }
      });

      // Convert tags string to array
      const tags = data.tags_string ? 
        data.tags_string.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : 
        [];

      const formData: UniversalInventoryItemCreate | UniversalInventoryItemUpdate = {
        ...data,
        custom_attributes: customAttributes,
        tags,
        images: selectedImages,
      };

      // Remove form-specific fields
      delete (formData as any).custom_attributes_array;
      delete (formData as any).tags_string;
      delete (formData as any).images;

      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Failed to save item:', error);
    }
  };

  const getCategoryAttributes = (): AttributeDefinition[] => {
    return selectedCategory?.attribute_schema || [];
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {isEditing ? t('inventory.edit_item') : t('inventory.add_item')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">{t('inventory.basic_info')}</TabsTrigger>
              <TabsTrigger value="attributes">{t('inventory.attributes')}</TabsTrigger>
              <TabsTrigger value="images">{t('inventory.images')}</TabsTrigger>
              <TabsTrigger value="advanced">{t('inventory.advanced')}</TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[500px] pr-4">
              <TabsContent value="basic" className="space-y-4 mt-4">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('inventory.item_name')} *</Label>
                    <Input
                      id="name"
                      {...register('name', { required: t('inventory.name_required') })}
                      placeholder={t('inventory.enter_item_name')}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name_persian">{t('inventory.persian_name')}</Label>
                    <Input
                      id="name_persian"
                      {...register('name_persian')}
                      placeholder={t('inventory.enter_persian_name')}
                    />
                  </div>
                </div>

                {/* Category and Identifiers */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category_id">{t('inventory.category')} *</Label>
                    <Controller
                      name="category_id"
                      control={control}
                      rules={{ required: t('inventory.category_required') }}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder={t('inventory.select_category')} />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.category_id && (
                      <p className="text-sm text-red-600">{errors.category_id.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sku">{t('inventory.sku')} *</Label>
                    <Input
                      id="sku"
                      {...register('sku', { required: t('inventory.sku_required') })}
                      placeholder={generatedSKU || t('inventory.auto_generated')}
                    />
                    {errors.sku && (
                      <p className="text-sm text-red-600">{errors.sku.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unit_of_measure">{t('inventory.unit_of_measure')}</Label>
                    <Controller
                      name="unit_of_measure"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="piece">{t('inventory.piece')}</SelectItem>
                            <SelectItem value="kg">{t('inventory.kilogram')}</SelectItem>
                            <SelectItem value="gram">{t('inventory.gram')}</SelectItem>
                            <SelectItem value="liter">{t('inventory.liter')}</SelectItem>
                            <SelectItem value="meter">{t('inventory.meter')}</SelectItem>
                            <SelectItem value="box">{t('inventory.box')}</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>

                {/* Pricing */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cost_price">{t('inventory.cost_price')} *</Label>
                    <Input
                      id="cost_price"
                      type="number"
                      step="0.01"
                      {...register('cost_price', { 
                        required: t('inventory.cost_price_required'),
                        min: { value: 0, message: t('inventory.price_positive') }
                      })}
                      placeholder="0.00"
                    />
                    {errors.cost_price && (
                      <p className="text-sm text-red-600">{errors.cost_price.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sale_price">{t('inventory.sale_price')} *</Label>
                    <Input
                      id="sale_price"
                      type="number"
                      step="0.01"
                      {...register('sale_price', { 
                        required: t('inventory.sale_price_required'),
                        min: { value: 0, message: t('inventory.price_positive') }
                      })}
                      placeholder="0.00"
                    />
                    {errors.sale_price && (
                      <p className="text-sm text-red-600">{errors.sale_price.message}</p>
                    )}
                    {watchedCostPrice > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {t('inventory.suggested')}: ${(watchedCostPrice * 1.3).toFixed(2)}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency">{t('inventory.currency')}</Label>
                    <Controller
                      name="currency"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">USD ($)</SelectItem>
                            <SelectItem value="EUR">EUR (€)</SelectItem>
                            <SelectItem value="IRR">IRR (﷼)</SelectItem>
                            <SelectItem value="AED">AED (د.إ)</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>

                {/* Stock Information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stock_quantity">{t('inventory.current_stock')} *</Label>
                    <Input
                      id="stock_quantity"
                      type="number"
                      {...register('stock_quantity', { 
                        required: t('inventory.stock_required'),
                        min: { value: 0, message: t('inventory.stock_positive') }
                      })}
                      placeholder="0"
                    />
                    {errors.stock_quantity && (
                      <p className="text-sm text-red-600">{errors.stock_quantity.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="low_stock_threshold">{t('inventory.low_stock_threshold')}</Label>
                    <Input
                      id="low_stock_threshold"
                      type="number"
                      {...register('low_stock_threshold', { 
                        min: { value: 0, message: t('inventory.threshold_positive') }
                      })}
                      placeholder="5"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reorder_point">{t('inventory.reorder_point')}</Label>
                    <Input
                      id="reorder_point"
                      type="number"
                      {...register('reorder_point', { 
                        min: { value: 0, message: t('inventory.reorder_positive') }
                      })}
                      placeholder="10"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">{t('inventory.description')}</Label>
                  <Textarea
                    id="description"
                    {...register('description')}
                    placeholder={t('inventory.enter_description')}
                    rows={3}
                  />
                </div>
              </TabsContent>

              <TabsContent value="attributes" className="space-y-4 mt-4">
                {/* Category-specific attributes */}
                {getCategoryAttributes().length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">
                        {t('inventory.category_attributes')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {getCategoryAttributes().map((attribute) => (
                        <Controller
                          key={attribute.id}
                          name={`custom_attributes.${attribute.name}` as any}
                          control={control}
                          rules={{ required: attribute.required }}
                          render={({ field, fieldState }) => (
                            <CustomAttributeField
                              attribute={attribute}
                              value={field.value}
                              onChange={field.onChange}
                              error={fieldState.error?.message}
                            />
                          )}
                        />
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Custom attributes */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">
                        {t('inventory.custom_attributes')}
                      </CardTitle>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addCustomAttribute}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {t('inventory.add_attribute')}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {customAttributeFields.map((field, index) => (
                      <div key={field.id} className="flex items-end gap-2">
                        <div className="flex-1">
                          <Label>{t('inventory.attribute_name')}</Label>
                          <Input
                            {...register(`custom_attributes_array.${index}.name` as const)}
                            placeholder={t('inventory.enter_name')}
                          />
                        </div>
                        <div className="flex-1">
                          <Label>{t('inventory.attribute_value')}</Label>
                          <Input
                            {...register(`custom_attributes_array.${index}.value` as const)}
                            placeholder={t('inventory.enter_value')}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeCustomAttribute(index)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Tags */}
                <div className="space-y-2">
                  <Label htmlFor="tags_string">
                    <Tag className="h-4 w-4 inline mr-2" />
                    {t('inventory.tags')}
                  </Label>
                  <Input
                    id="tags_string"
                    {...register('tags_string')}
                    onChange={(e) => {
                      register('tags_string').onChange(e);
                      handleTagsChange(e.target.value);
                    }}
                    placeholder={t('inventory.enter_tags_comma_separated')}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('inventory.tags_help')}
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="images" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      {t('inventory.product_images')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Image Upload */}
                    <div className="space-y-4">
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-md p-6 text-center">
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            {t('inventory.upload_images')}
                          </p>
                          <Label htmlFor="image-upload" className="cursor-pointer">
                            <Button type="button" variant="outline" asChild>
                              <span className="flex items-center gap-2">
                                <Upload className="h-4 w-4" />
                                {t('inventory.choose_files')}
                              </span>
                            </Button>
                          </Label>
                        </div>
                      </div>
                      <Input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageChange}
                        className="hidden"
                      />

                      {/* Image Previews */}
                      {imagePreviews.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {imagePreviews.map((preview, index) => (
                            <div key={index} className="relative">
                              <img
                                src={preview}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-32 object-cover rounded-md border"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2 h-6 w-6"
                                onClick={() => removeImage(index)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4 mt-4">
                {/* Barcode and QR Code */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">
                      {t('inventory.identifiers')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="barcode">
                          <Barcode className="h-4 w-4 inline mr-2" />
                          {t('inventory.barcode')}
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            id="barcode"
                            {...register('barcode')}
                            placeholder={t('inventory.enter_barcode')}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={generateBarcode}
                          >
                            {t('inventory.generate')}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="qr_code">
                          <QrCode className="h-4 w-4 inline mr-2" />
                          {t('inventory.qr_code')}
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            id="qr_code"
                            {...register('qr_code')}
                            placeholder={t('inventory.enter_qr_code')}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={generateQRCode}
                          >
                            {t('inventory.generate')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Gold-specific fields */}
                {(businessType === 'gold_shop' || item?.weight_grams) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">
                        {t('inventory.gold_specific')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Label htmlFor="weight_grams">{t('inventory.weight_grams')}</Label>
                        <Input
                          id="weight_grams"
                          type="number"
                          step="0.001"
                          {...register('weight_grams')}
                          placeholder="0.000"
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Advanced Stock Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">
                      {t('inventory.advanced_stock')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Label htmlFor="max_stock_level">{t('inventory.max_stock_level')}</Label>
                      <Input
                        id="max_stock_level"
                        type="number"
                        {...register('max_stock_level')}
                        placeholder={t('inventory.optional')}
                      />
                      <p className="text-xs text-muted-foreground">
                        {t('inventory.max_stock_help')}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </ScrollArea>
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || isLoading}
              className="flex items-center gap-2"
            >
              {isSubmitting || isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-transparent border-t-current" />
                  {t('common.saving')}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {isEditing ? t('common.update') : t('common.create')}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};