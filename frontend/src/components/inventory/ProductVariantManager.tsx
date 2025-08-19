import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Copy, 
  Edit, 
  Package, 
  DollarSign, 
  Weight, 
  Palette, 
  Ruler,
  Tag,
  BarChart3,
  AlertTriangle
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { Separator } from '../ui/separator';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '../ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { cn } from '../../lib/utils';

interface VariantAttribute {
  name: string;
  value: string;
  type: 'text' | 'number' | 'select' | 'color';
  options?: string[];
}

interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  attributes: VariantAttribute[];
  pricing: {
    purchase_price: number;
    sell_price: number;
    markup_percentage: number;
    cost_price?: number;
  };
  inventory: {
    stock_quantity: number;
    min_stock_level: number;
    weight_grams: number;
    reserved_quantity?: number;
  };
  images: string[];
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    unit: 'mm' | 'cm' | 'in';
  };
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface ProductVariantManagerProps {
  variants: ProductVariant[];
  onVariantsChange: (variants: ProductVariant[]) => void;
  baseProduct: {
    name: string;
    sku: string;
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
  };
  availableAttributes?: VariantAttribute[];
  className?: string;
}

interface VariantFormDialogProps {
  variant?: ProductVariant;
  isOpen: boolean;
  onClose: () => void;
  onSave: (variant: ProductVariant) => void;
  baseProduct: ProductVariantManagerProps['baseProduct'];
  availableAttributes?: VariantAttribute[];
}

const VariantFormDialog: React.FC<VariantFormDialogProps> = ({
  variant,
  isOpen,
  onClose,
  onSave,
  baseProduct,
  availableAttributes = []
}) => {
  const [formData, setFormData] = useState<ProductVariant>(
    variant || {
      id: `variant_${Date.now()}`,
      name: `${baseProduct.name} - Variant`,
      sku: `${baseProduct.sku}-V${Date.now()}`,
      attributes: [],
      pricing: {
        purchase_price: baseProduct.base_pricing.purchase_price,
        sell_price: baseProduct.base_pricing.sell_price,
        markup_percentage: baseProduct.base_pricing.markup_percentage,
      },
      inventory: {
        stock_quantity: 0,
        min_stock_level: baseProduct.base_inventory.min_stock_level,
        weight_grams: baseProduct.base_inventory.weight_grams,
      },
      images: [],
      is_active: true,
    }
  );

  const [newAttribute, setNewAttribute] = useState<VariantAttribute>({
    name: '',
    value: '',
    type: 'text'
  });

  const handleSave = () => {
    // Calculate markup percentage if prices changed
    const updatedFormData = {
      ...formData,
      pricing: {
        ...formData.pricing,
        markup_percentage: formData.pricing.purchase_price > 0 
          ? ((formData.pricing.sell_price - formData.pricing.purchase_price) / formData.pricing.purchase_price) * 100
          : 0
      },
      updated_at: new Date().toISOString()
    };
    
    onSave(updatedFormData);
    onClose();
  };

  const addAttribute = () => {
    if (newAttribute.name && newAttribute.value) {
      setFormData(prev => ({
        ...prev,
        attributes: [...prev.attributes, { ...newAttribute }]
      }));
      setNewAttribute({ name: '', value: '', type: 'text' });
    }
  };

  const removeAttribute = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attributes: prev.attributes.filter((_, i) => i !== index)
    }));
  };

  const updateAttribute = (index: number, field: keyof VariantAttribute, value: any) => {
    setFormData(prev => ({
      ...prev,
      attributes: prev.attributes.map((attr, i) => 
        i === index ? { ...attr, [field]: value } : attr
      )
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {variant ? 'Edit Variant' : 'Create New Variant'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="variant-name">Variant Name *</Label>
                <Input
                  id="variant-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Gold Ring 18K - Small"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="variant-sku">SKU *</Label>
                <Input
                  id="variant-sku"
                  value={formData.sku}
                  onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                  placeholder="e.g., GR-18K-001-S"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Variant Attributes */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Variant Attributes</h3>
            
            {/* Existing Attributes */}
            {formData.attributes.length > 0 && (
              <div className="space-y-2">
                {formData.attributes.map((attr, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                    <div className="flex-1 grid grid-cols-3 gap-2">
                      <Input
                        value={attr.name}
                        onChange={(e) => updateAttribute(index, 'name', e.target.value)}
                        placeholder="Attribute name"
                      />
                      <Input
                        value={attr.value}
                        onChange={(e) => updateAttribute(index, 'value', e.target.value)}
                        placeholder="Value"
                      />
                      <Select
                        value={attr.type}
                        onValueChange={(value) => updateAttribute(index, 'type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="select">Select</SelectItem>
                          <SelectItem value="color">Color</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeAttribute(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add New Attribute */}
            <div className="flex items-center gap-2 p-3 border-2 border-dashed rounded-lg">
              <div className="flex-1 grid grid-cols-3 gap-2">
                <Input
                  value={newAttribute.name}
                  onChange={(e) => setNewAttribute(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Attribute name (e.g., Size, Color)"
                />
                <Input
                  value={newAttribute.value}
                  onChange={(e) => setNewAttribute(prev => ({ ...prev, value: e.target.value }))}
                  placeholder="Value (e.g., Small, Red)"
                />
                <Select
                  value={newAttribute.type}
                  onValueChange={(value) => setNewAttribute(prev => ({ ...prev, type: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="select">Select</SelectItem>
                    <SelectItem value="color">Color</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={addAttribute} disabled={!newAttribute.name || !newAttribute.value}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Separator />

          {/* Pricing */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Pricing</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchase-price">Purchase Price ($) *</Label>
                <Input
                  id="purchase-price"
                  type="number"
                  step="0.01"
                  value={formData.pricing.purchase_price}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    pricing: { ...prev.pricing, purchase_price: parseFloat(e.target.value) || 0 }
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sell-price">Sell Price ($) *</Label>
                <Input
                  id="sell-price"
                  type="number"
                  step="0.01"
                  value={formData.pricing.sell_price}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    pricing: { ...prev.pricing, sell_price: parseFloat(e.target.value) || 0 }
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Markup Percentage</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.pricing.markup_percentage.toFixed(1)}
                    readOnly
                    className="bg-muted"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Inventory */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Inventory</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stock-quantity">Stock Quantity *</Label>
                <Input
                  id="stock-quantity"
                  type="number"
                  value={formData.inventory.stock_quantity}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    inventory: { ...prev.inventory, stock_quantity: parseInt(e.target.value) || 0 }
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="min-stock">Min Stock Level</Label>
                <Input
                  id="min-stock"
                  type="number"
                  value={formData.inventory.min_stock_level}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    inventory: { ...prev.inventory, min_stock_level: parseInt(e.target.value) || 0 }
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (grams) *</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.001"
                  value={formData.inventory.weight_grams}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    inventory: { ...prev.inventory, weight_grams: parseFloat(e.target.value) || 0 }
                  }))}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Status */}
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: !!checked }))}
            />
            <Label>Variant is active and available for sale</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {variant ? 'Update Variant' : 'Create Variant'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const ProductVariantManager: React.FC<ProductVariantManagerProps> = ({
  variants,
  onVariantsChange,
  baseProduct,
  availableAttributes = [],
  className
}) => {
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [deletingVariant, setDeletingVariant] = useState<ProductVariant | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');

  const handleCreateVariant = () => {
    setEditingVariant(null);
    setShowCreateDialog(true);
  };

  const handleEditVariant = (variant: ProductVariant) => {
    setEditingVariant(variant);
    setShowCreateDialog(true);
  };

  const handleSaveVariant = (variant: ProductVariant) => {
    if (editingVariant) {
      // Update existing variant
      const updatedVariants = variants.map(v => 
        v.id === variant.id ? variant : v
      );
      onVariantsChange(updatedVariants);
    } else {
      // Add new variant
      onVariantsChange([...variants, variant]);
    }
    setShowCreateDialog(false);
    setEditingVariant(null);
  };

  const handleDeleteVariant = (variantId: string) => {
    const updatedVariants = variants.filter(v => v.id !== variantId);
    onVariantsChange(updatedVariants);
    setDeletingVariant(null);
  };

  const handleDuplicateVariant = (variant: ProductVariant) => {
    const duplicatedVariant: ProductVariant = {
      ...variant,
      id: `variant_${Date.now()}`,
      name: `${variant.name} (Copy)`,
      sku: `${variant.sku}-COPY`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    onVariantsChange([...variants, duplicatedVariant]);
  };

  const getTotalStock = () => {
    return variants.reduce((total, variant) => total + variant.inventory.stock_quantity, 0);
  };

  const getTotalValue = () => {
    return variants.reduce((total, variant) => 
      total + (variant.inventory.stock_quantity * variant.pricing.sell_price), 0
    );
  };

  const getLowStockVariants = () => {
    return variants.filter(variant => 
      variant.inventory.stock_quantity <= variant.inventory.min_stock_level
    );
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Product Variants</h3>
          <p className="text-sm text-muted-foreground">
            Manage different variations of your product
          </p>
        </div>
        <Button onClick={handleCreateVariant}>
          <Plus className="h-4 w-4 mr-2" />
          Add Variant
        </Button>
      </div>

      {/* Summary Cards */}
      {variants.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Variants</p>
                  <p className="text-2xl font-bold">{variants.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Stock</p>
                  <p className="text-2xl font-bold">{getTotalStock()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-amber-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-bold">${getTotalValue().toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Low Stock</p>
                  <p className="text-2xl font-bold">{getLowStockVariants().length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Variants Display */}
      {variants.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No variants created</p>
            <p className="text-sm text-muted-foreground mb-4">
              Create variants to offer different options for this product
            </p>
            <Button onClick={handleCreateVariant}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Variant
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {variants.map((variant) => (
            <Card key={variant.id} className={cn(
              "relative",
              !variant.is_active && "opacity-60",
              variant.inventory.stock_quantity <= variant.inventory.min_stock_level && "border-red-200"
            )}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">{variant.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{variant.sku}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {!variant.is_active && (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                    {variant.inventory.stock_quantity <= variant.inventory.min_stock_level && (
                      <Badge variant="destructive">Low Stock</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Attributes */}
                {variant.attributes.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">ATTRIBUTES</Label>
                    <div className="flex flex-wrap gap-1">
                      {variant.attributes.map((attr, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {attr.name}: {attr.value}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pricing */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">SELL PRICE</Label>
                    <p className="text-lg font-semibold">${variant.pricing.sell_price.toFixed(2)}</p>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">MARKUP</Label>
                    <p className="text-lg font-semibold">{variant.pricing.markup_percentage.toFixed(1)}%</p>
                  </div>
                </div>

                {/* Inventory */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">STOCK</Label>
                    <p className="text-lg font-semibold">{variant.inventory.stock_quantity}</p>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">WEIGHT</Label>
                    <p className="text-lg font-semibold">{variant.inventory.weight_grams}g</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditVariant(variant)}
                    className="flex-1"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDuplicateVariant(variant)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeletingVariant(variant)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Attributes</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {variants.map((variant) => (
                  <TableRow key={variant.id}>
                    <TableCell className="font-medium">{variant.name}</TableCell>
                    <TableCell>{variant.sku}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {variant.attributes.slice(0, 2).map((attr, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {attr.name}: {attr.value}
                          </Badge>
                        ))}
                        {variant.attributes.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{variant.attributes.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>${variant.pricing.sell_price.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {variant.inventory.stock_quantity}
                        {variant.inventory.stock_quantity <= variant.inventory.min_stock_level && (
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={variant.is_active ? "default" : "secondary"}>
                        {variant.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditVariant(variant)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDuplicateVariant(variant)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingVariant(variant)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Variant Dialog */}
      <VariantFormDialog
        variant={editingVariant || undefined}
        isOpen={showCreateDialog}
        onClose={() => {
          setShowCreateDialog(false);
          setEditingVariant(null);
        }}
        onSave={handleSaveVariant}
        baseProduct={baseProduct}
        availableAttributes={availableAttributes}
      />

      {/* Delete Confirmation Dialog */}
      {deletingVariant && (
        <AlertDialog open={!!deletingVariant} onOpenChange={() => setDeletingVariant(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Variant</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the variant "{deletingVariant.name}"? 
                This action cannot be undone and will remove all associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleDeleteVariant(deletingVariant.id)}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete Variant
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};