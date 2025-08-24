import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { 
  Package, 
  Plus, 
  X, 
  Upload, 
  Image as ImageIcon, 
  Trash2, 
  Edit, 
  Copy,
  Tag,
  Palette,
  Ruler,
  Weight
} from 'lucide-react';
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
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { 
  useCreateInventoryItem, 
  useUpdateInventoryItem, 
  useUploadInventoryImage,
  useCategories 
} from '../../hooks/useInventory';
import { useCategoryTree } from '../../hooks/useCategoryManagement';
import type { InventoryItem, Category } from '../../types';

interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  attributes: Record<string, any>;
  pricing: {
    purchase_price: number;
    sell_price: number;
    markup_percentage: number;
  };
  inventory: {
    stock_quantity: number;
    min_stock_level: number;
    weight_grams: number;
  };
  images: string[];
  is_active: boolean;
}

interface ProductImage {
  id: string;
  url: string;
  alt_text?: string;
  is_primary: boolean;
  sort_order: number;
}

interface EnhancedProductData {
  name: string;
  sku: string;
  categories: string[];
  description?: string;
  attributes: Record<string, any>;
  images: ProductImage[];
  variants: ProductVariant[];
  base_pricing: {
    purchase_price: number;
    sell_price: number;
    markup_percentage: number;
  };
  base_inventory: {
    stock_quantity: number;
    min_stock_level: number;
    weight_grams: number;
  };
  seo: {
    meta_title?: string;
    meta_description?: string;
    keywords?: string[];
  };
  is_active: boolean;
}

interface ProductManagementProps {
  product?: InventoryItem | null;
  onClose: () => void;
}

export const ProductManagement: React.FC<ProductManagementProps> = ({ 
  product, 
  onClose 
}) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [categoryAttributes, setCategoryAttributes] = useState<Record<string, any>>({});
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const isEditing = !!product;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<EnhancedProductData>({
    defaultValues: {
      name: '',
      sku: '',
      categories: [],
      description: '',
      attributes: {},
      images: [],
      variants: [],
      base_pricing: {
        purchase_price: 0,
        sell_price: 0,
        markup_percentage: 30,
      },
      base_inventory: {
        stock_quantity: 0,
        min_stock_level: 5,
        weight_grams: 0,
      },
      seo: {
        meta_title: '',
        meta_description: '',
        keywords: [],
      },
      is_active: true,
    },
  });

  const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({
    control,
    name: 'variants',
  });

  const { data: categories = [] } = useCategories();
  const { data: categoryTree = [] } = useCategoryTree();
  const createItemMutation = useCreateInventoryItem();
  const updateItemMutation = useUpdateInventoryItem();
  const uploadImageMutation = useUploadInventoryImage();

  // Initialize form with product data if editing
  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        sku: product.id, // Using ID as SKU for now
        categories: [product.category_id],
        description: product.description || '',
        attributes: {},
        images: product.image_url ? [{
          id: '1',
          url: product.image_url,
          is_primary: true,
          sort_order: 0
        }] : [],
        variants: [],
        base_pricing: {
          purchase_price: product.purchase_price,
          sell_price: product.sell_price,
          markup_percentage: ((product.sell_price - product.purchase_price) / product.purchase_price) * 100,
        },
        base_inventory: {
          stock_quantity: product.stock_quantity,
          min_stock_level: product.min_stock_level,
          weight_grams: product.weight_grams,
        },
        seo: {
          meta_title: product.name,
          meta_description: product.description || '',
          keywords: [],
        },
        is_active: product.is_active,
      });
      
      setSelectedCategories(new Set([product.category_id]));
      setProductImages(product.image_url ? [{
        id: '1',
        url: product.image_url,
        is_primary: true,
        sort_order: 0
      }] : []);
    }
  }, [product, reset]);

  // Update category attributes when categories change
  useEffect(() => {
    const watchedCategories = watch('categories');
    if (watchedCategories && watchedCategories.length > 0) {
      // Fetch category attributes and update form
      const newAttributes: Record<string, any> = {};
      watchedCategories.forEach(categoryId => {
        const category = categories.find(c => c.id === categoryId);
        if (category && category.attributes) {
          Object.assign(newAttributes, category.attributes);
        }
      });
      setCategoryAttributes(newAttributes);
    }
  }, [watch('categories'), categories]);

  const handleCategoryToggle = (categoryId: string) => {
    const newSelection = new Set(selectedCategories);
    if (newSelection.has(categoryId)) {
      newSelection.delete(categoryId);
    } else {
      newSelection.add(categoryId);
    }
    setSelectedCategories(newSelection);
    setValue('categories', Array.from(newSelection));
  };

  const handleImageUpload = async (files: FileList) => {
    setIsUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file, index) => {
        const result = await uploadImageMutation.mutateAsync(file);
        return {
          id: `img_${Date.now()}_${index}`,
          url: result.image_url,
          alt_text: file.name,
          is_primary: productImages.length === 0 && index === 0,
          sort_order: productImages.length + index,
        };
      });

      const newImages = await Promise.all(uploadPromises);
      const updatedImages = [...productImages, ...newImages];
      setProductImages(updatedImages);
      setValue('images', updatedImages);
    } catch (error) {
      console.error('Failed to upload images:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageRemove = (imageId: string) => {
    const updatedImages = productImages.filter(img => img.id !== imageId);
    setProductImages(updatedImages);
    setValue('images', updatedImages);
  };

  const handleSetPrimaryImage = (imageId: string) => {
    const updatedImages = productImages.map(img => ({
      ...img,
      is_primary: img.id === imageId
    }));
    setProductImages(updatedImages);
    setValue('images', updatedImages);
  };

  const addVariant = () => {
    const newVariant: ProductVariant = {
      id: `variant_${Date.now()}`,
      name: `${watch('name')} - Variant ${variantFields.length + 1}`,
      sku: `${watch('sku')}-V${variantFields.length + 1}`,
      attributes: {},
      pricing: {
        purchase_price: watch('base_pricing.purchase_price'),
        sell_price: watch('base_pricing.sell_price'),
        markup_percentage: watch('base_pricing.markup_percentage'),
      },
      inventory: {
        stock_quantity: 0,
        min_stock_level: watch('base_inventory.min_stock_level'),
        weight_grams: watch('base_inventory.weight_grams'),
      },
      images: [],
      is_active: true,
    };
    appendVariant(newVariant);
  };

  const onSubmit = async (data: EnhancedProductData) => {
    try {
      // Convert enhanced product data to basic inventory item format
      const basicItemData = {
        name: data.name,
        category_id: data.categories[0] || '', // Use first category as primary
        weight_grams: data.base_inventory.weight_grams,
        purchase_price: data.base_pricing.purchase_price,
        sell_price: data.base_pricing.sell_price,
        stock_quantity: data.base_inventory.stock_quantity,
        min_stock_level: data.base_inventory.min_stock_level,
        description: data.description,
        image_url: data.images.find(img => img.is_primary)?.url || data.images[0]?.url || '',
      };

      if (isEditing && product) {
        await updateItemMutation.mutateAsync({
          id: product.id,
          data: basicItemData,
        });
      } else {
        await createItemMutation.mutateAsync(basicItemData);
      }

      onClose();
    } catch (error) {
      console.error('Failed to save product:', error);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
              <Package className="h-5 w-5 text-white" />
            </div>
            {isEditing ? 'Edit Product' : 'Create New Product'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
            <TabsList variant="gradient-green" className="grid w-full grid-cols-5">
              <TabsTrigger variant="gradient-green" value="basic">Basic Info</TabsTrigger>
              <TabsTrigger variant="gradient-green" value="categories">Categories</TabsTrigger>
              <TabsTrigger variant="gradient-green" value="images">Images</TabsTrigger>
              <TabsTrigger variant="gradient-green" value="variants">Variants</TabsTrigger>
              <TabsTrigger variant="gradient-green" value="seo">SEO & Meta</TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1 mt-4">
              <TabsContent variant="gradient-green" value="basic" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name *</Label>
                    <Input
                      id="name"
                      {...register('name', { required: 'Product name is required' })}
                      placeholder="e.g., Gold Ring 18K"
                    />
                    {errors.name && (
                      <p className="text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU *</Label>
                    <Input
                      id="sku"
                      {...register('sku', { required: 'SKU is required' })}
                      placeholder="e.g., GR-18K-001"
                    />
                    {errors.sku && (
                      <p className="text-sm text-red-600">{errors.sku.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    {...register('description')}
                    placeholder="Detailed product description..."
                    rows={4}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Base Pricing</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="purchase_price">Purchase Price ($) *</Label>
                      <Input
                        id="purchase_price"
                        type="number"
                        step="0.01"
                        {...register('base_pricing.purchase_price', { 
                          required: 'Purchase price is required',
                          min: { value: 0, message: 'Price must be positive' }
                        })}
                        placeholder="0.00"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sell_price">Sell Price ($) *</Label>
                      <Input
                        id="sell_price"
                        type="number"
                        step="0.01"
                        {...register('base_pricing.sell_price', { 
                          required: 'Sell price is required',
                          min: { value: 0, message: 'Price must be positive' }
                        })}
                        placeholder="0.00"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="markup_percentage">Markup (%)</Label>
                      <Input
                        id="markup_percentage"
                        type="number"
                        step="0.1"
                        {...register('base_pricing.markup_percentage')}
                        placeholder="30.0"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Base Inventory</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="weight_grams">Weight (grams) *</Label>
                      <Input
                        id="weight_grams"
                        type="number"
                        step="0.001"
                        {...register('base_inventory.weight_grams', { 
                          required: 'Weight is required',
                          min: { value: 0.001, message: 'Weight must be greater than 0' }
                        })}
                        placeholder="0.000"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="stock_quantity">Current Stock *</Label>
                      <Input
                        id="stock_quantity"
                        type="number"
                        {...register('base_inventory.stock_quantity', { 
                          required: 'Stock quantity is required',
                          min: { value: 0, message: 'Stock cannot be negative' }
                        })}
                        placeholder="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="min_stock_level">Minimum Stock Level</Label>
                      <Input
                        id="min_stock_level"
                        type="number"
                        {...register('base_inventory.min_stock_level', { 
                          min: { value: 0, message: 'Minimum stock cannot be negative' }
                        })}
                        placeholder="5"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent variant="gradient-green" value="categories" className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Category Assignment</h3>
                  <p className="text-sm text-muted-foreground">
                    Select multiple categories to organize your product. The first selected category will be the primary category.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {categories.map((category) => (
                      <div
                        key={category.id}
                        className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                        onClick={() => handleCategoryToggle(category.id)}
                      >
                        <Checkbox
                          checked={selectedCategories.has(category.id)}
                          onChange={() => handleCategoryToggle(category.id)}
                        />
                        <div className="flex-1">
                          <p className="font-medium">{category.name}</p>
                          {category.description && (
                            <p className="text-xs text-muted-foreground">{category.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedCategories.size > 0 && (
                    <div className="space-y-2">
                      <Label>Selected Categories</Label>
                      <div className="flex flex-wrap gap-2">
                        {Array.from(selectedCategories).map((categoryId, index) => {
                          const category = categories.find(c => c.id === categoryId);
                          return (
                            <Badge key={categoryId} variant={index === 0 ? "default" : "secondary"}>
                              {category?.name}
                              {index === 0 && " (Primary)"}
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4 ml-1 hover:bg-transparent"
                                onClick={() => handleCategoryToggle(categoryId)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {Object.keys(categoryAttributes).length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Category Attributes</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(categoryAttributes).map(([key, attribute]: [string, any]) => (
                          <div key={key} className="space-y-2">
                            <Label htmlFor={`attr_${key}`}>
                              {attribute.label || key}
                              {attribute.required && " *"}
                            </Label>
                            {attribute.type === 'select' ? (
                              <Select
                                value={watch(`attributes.${key}`) || ''}
                                onValueChange={(value) => setValue(`attributes.${key}`, value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder={`Select ${attribute.label || key}`} />
                                </SelectTrigger>
                                <SelectContent>
                                  {attribute.options?.map((option: string) => (
                                    <SelectItem key={option} value={option}>
                                      {option}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : attribute.type === 'boolean' ? (
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  checked={watch(`attributes.${key}`) || false}
                                  onCheckedChange={(checked) => setValue(`attributes.${key}`, checked)}
                                />
                                <Label htmlFor={`attr_${key}`}>Yes</Label>
                              </div>
                            ) : (
                              <Input
                                id={`attr_${key}`}
                                type={attribute.type === 'number' ? 'number' : 'text'}
                                {...register(`attributes.${key}`, {
                                  required: attribute.required ? `${attribute.label || key} is required` : false
                                })}
                                placeholder={attribute.placeholder || `Enter ${attribute.label || key}`}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent variant="gradient-green" value="images" className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Product Images</h3>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="image-upload" className="cursor-pointer">
                        <Button type="button" variant="outline-gradient-green" asChild disabled={isUploading}>
                          <span className="flex items-center gap-2">
                            <Upload className="h-4 w-4" />
                            {isUploading ? 'Uploading...' : 'Upload Images'}
                          </span>
                        </Button>
                      </Label>
                      <Input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                        className="hidden"
                      />
                    </div>
                  </div>

                  {productImages.length === 0 ? (
                    <Card variant="gradient-green">
                      <CardContent className="p-8 text-center">
                        <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-lg font-medium mb-2">No images uploaded</p>
                        <p className="text-sm text-muted-foreground mb-4">
                          Upload product images to showcase your item
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {productImages.map((image, index) => (
                        <Card key={image.id} variant="professional" className="relative group">
                          <CardContent className="p-2">
                            <div className="aspect-square relative">
                              <img
                                src={image.url}
                                alt={image.alt_text || `Product image ${index + 1}`}
                                className="w-full h-full object-cover rounded-md"
                              />
                              {image.is_primary && (
                                <Badge className="absolute top-2 left-2 text-xs">
                                  Primary
                                </Badge>
                              )}
                              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => handleImageRemove(image.id)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                              <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                {!image.is_primary && (
                                  <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    className="w-full text-xs"
                                    onClick={() => handleSetPrimaryImage(image.id)}
                                  >
                                    Set Primary
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent variant="gradient-green" value="variants" className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Product Variants</h3>
                      <p className="text-sm text-muted-foreground">
                        Create variants for different sizes, colors, or specifications
                      </p>
                    </div>
                    <Button type="button" variant="gradient-green" onClick={addVariant}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Variant
                    </Button>
                  </div>

                  {variantFields.length === 0 ? (
                    <Card variant="gradient-green">
                      <CardContent className="p-8 text-center">
                        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-lg font-medium mb-2">No variants created</p>
                        <p className="text-sm text-muted-foreground mb-4">
                          Add variants to offer different options for this product
                        </p>
                        <Button type="button" variant="gradient-green" onClick={addVariant}>
                          <Plus className="h-4 w-4 mr-2" />
                          Create First Variant
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {variantFields.map((variant, index) => (
                        <Card key={variant.id} variant="professional">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base">
                                Variant {index + 1}
                              </CardTitle>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeVariant(index)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Variant Name</Label>
                                <Input
                                  {...register(`variants.${index}.name`)}
                                  placeholder="e.g., Small Size"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Variant SKU</Label>
                                <Input
                                  {...register(`variants.${index}.sku`)}
                                  placeholder="e.g., GR-18K-001-S"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="space-y-2">
                                <Label>Purchase Price ($)</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  {...register(`variants.${index}.pricing.purchase_price`)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Sell Price ($)</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  {...register(`variants.${index}.pricing.sell_price`)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Stock Quantity</Label>
                                <Input
                                  type="number"
                                  {...register(`variants.${index}.inventory.stock_quantity`)}
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent variant="gradient-green" value="seo" className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">SEO & Metadata</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="meta_title">Meta Title</Label>
                    <Input
                      id="meta_title"
                      {...register('seo.meta_title')}
                      placeholder="SEO-friendly title for search engines"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="meta_description">Meta Description</Label>
                    <Textarea
                      id="meta_description"
                      {...register('seo.meta_description')}
                      placeholder="Brief description for search engine results"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="keywords">Keywords</Label>
                    <Input
                      id="keywords"
                      placeholder="Comma-separated keywords (e.g., gold, jewelry, ring)"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={watch('is_active')}
                      onCheckedChange={(checked) => setValue('is_active', !!checked)}
                    />
                    <Label>Product is active and visible</Label>
                  </div>
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline-gradient-green" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="gradient-green"
              disabled={isSubmitting || isUploading}
            >
              {isSubmitting ? 'Saving...' : (isEditing ? 'Update Product' : 'Create Product')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};