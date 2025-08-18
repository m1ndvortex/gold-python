import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Upload, X, Package } from 'lucide-react';
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
import { Card, CardContent } from '../ui/card';
import { 
  useCreateInventoryItem, 
  useUpdateInventoryItem, 
  useUploadInventoryImage,
  useCategories 
} from '../../hooks/useInventory';
import type { InventoryItem } from '../../types';
import type { CreateInventoryItemData } from '../../services/inventoryApi';

interface InventoryItemFormProps {
  item?: InventoryItem | null;
  onClose: () => void;
}

interface FormData extends CreateInventoryItemData {}

export const InventoryItemForm: React.FC<InventoryItemFormProps> = ({ 
  item, 
  onClose 
}) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  const isEditing = !!item;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    defaultValues: {
      name: '',
      category_id: '',
      weight_grams: 0,
      purchase_price: 0,
      sell_price: 0,
      stock_quantity: 0,
      min_stock_level: 5,
      description: '',
      image_url: '',
    },
  });

  const { data: categories = [] } = useCategories();
  const createItemMutation = useCreateInventoryItem();
  const updateItemMutation = useUpdateInventoryItem();
  const uploadImageMutation = useUploadInventoryImage();

  // Initialize form with item data if editing
  useEffect(() => {
    if (item) {
      reset({
        name: item.name,
        category_id: item.category_id,
        weight_grams: item.weight_grams,
        purchase_price: item.purchase_price,
        sell_price: item.sell_price,
        stock_quantity: item.stock_quantity,
        min_stock_level: item.min_stock_level,
        description: item.description || '',
        image_url: item.image_url || '',
      });
      setImagePreview(item.image_url || '');
    }
  }, [item, reset]);

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

  const onSubmit = async (data: FormData) => {
    try {
      let imageUrl = data.image_url;

      // Upload image if a new file is selected
      if (imageFile) {
        setIsUploading(true);
        const uploadResult = await uploadImageMutation.mutateAsync(imageFile);
        imageUrl = uploadResult.image_url;
        setIsUploading(false);
      }

      const formData = {
        ...data,
        image_url: imageUrl,
      };

      if (isEditing && item) {
        await updateItemMutation.mutateAsync({
          id: item.id,
          data: formData,
        });
      } else {
        await createItemMutation.mutateAsync(formData);
      }

      onClose();
    } catch (error) {
      setIsUploading(false);
      console.error('Failed to save item:', error);
    }
  };

  const watchedPurchasePrice = watch('purchase_price');

  // Auto-calculate sell price suggestion (purchase price + 30% markup)
  useEffect(() => {
    if (watchedPurchasePrice > 0 && !isEditing) {
      const suggestedSellPrice = watchedPurchasePrice * 1.3;
      setValue('sell_price', Number(suggestedSellPrice.toFixed(2)));
    }
  }, [watchedPurchasePrice, setValue, isEditing]);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Inventory Item' : 'Add New Inventory Item'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Image Upload Section */}
          <div className="space-y-4">
            <Label>Product Image</Label>
            <Card>
              <CardContent className="p-4">
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
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Item Name *</Label>
              <Input
                id="name"
                {...register('name', { required: 'Item name is required' })}
                placeholder="e.g., Gold Ring 18K"
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

          {/* Weight and Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weight_grams">Weight (grams) *</Label>
              <Input
                id="weight_grams"
                type="number"
                step="0.001"
                {...register('weight_grams', { 
                  required: 'Weight is required',
                  min: { value: 0.001, message: 'Weight must be greater than 0' }
                })}
                placeholder="0.000"
              />
              {errors.weight_grams && (
                <p className="text-sm text-red-600">{errors.weight_grams.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchase_price">Purchase Price ($) *</Label>
              <Input
                id="purchase_price"
                type="number"
                step="0.01"
                {...register('purchase_price', { 
                  required: 'Purchase price is required',
                  min: { value: 0, message: 'Price must be positive' }
                })}
                placeholder="0.00"
              />
              {errors.purchase_price && (
                <p className="text-sm text-red-600">{errors.purchase_price.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sell_price">Sell Price ($) *</Label>
              <Input
                id="sell_price"
                type="number"
                step="0.01"
                {...register('sell_price', { 
                  required: 'Sell price is required',
                  min: { value: 0, message: 'Price must be positive' }
                })}
                placeholder="0.00"
              />
              {errors.sell_price && (
                <p className="text-sm text-red-600">{errors.sell_price.message}</p>
              )}
              {watchedPurchasePrice > 0 && (
                <p className="text-xs text-muted-foreground">
                  Suggested: ${(watchedPurchasePrice * 1.3).toFixed(2)} (30% markup)
                </p>
              )}
            </div>
          </div>

          {/* Stock Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              {...register('description')}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Optional description of the item..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || isUploading}
            >
              {isSubmitting || isUploading ? (
                isUploading ? 'Uploading...' : 'Saving...'
              ) : (
                isEditing ? 'Update Item' : 'Create Item'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};