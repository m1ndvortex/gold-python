/**
 * Image Management Page
 * 
 * Dedicated page for managing images across the application
 */

import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { 
  Image as ImageIcon, 
  Upload, 
  Grid3X3, 
  List, 
  Search, 
  Filter,
  FolderOpen,
  Package,
  Building,
  Users
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { ImageGallery, ImageUpload, CategoryImageManager } from '../components/image-management';
import { useCategories, useInventoryItems } from '../hooks/useInventory';
import { useCustomers } from '../hooks/useCustomers';
import { cn } from '../lib/utils';

type EntityType = 'product' | 'category' | 'company' | 'customer';
type ViewMode = 'grid' | 'list';

interface ImageManagementFilters {
  entityType?: EntityType;
  entityId?: string;
  search?: string;
  viewMode: ViewMode;
}

const defaultFilters: ImageManagementFilters = {
  search: '',
  viewMode: 'grid',
};

export const ImageManagement: React.FC = () => {
  const [filters, setFilters] = useState<ImageManagementFilters>(defaultFilters);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<{ type: EntityType; id: string; name: string } | null>(null);

  // Fetch data for entity selection
  const { data: categories = [] } = useCategories();
  const { data: inventoryData } = useInventoryItems({ limit: 100 });
  const { data: customers = [] } = useCustomers();

  const handleEntitySelect = (type: EntityType, id: string, name: string) => {
    setSelectedEntity({ type, id, name });
    setFilters(prev => ({ ...prev, entityType: type, entityId: id }));
  };

  const handleUploadComplete = () => {
    setShowUpload(false);
    // Refresh the gallery if an entity is selected
    if (selectedEntity) {
      // The ImageGallery component will automatically refresh
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Image Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage images for products, categories, and company assets
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowUpload(true)}
            disabled={!selectedEntity}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Upload Images
          </Button>
        </div>
      </motion.div>

      <Tabs defaultValue="gallery" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="gallery" className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Image Gallery
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            Category Images
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Product Images
          </TabsTrigger>
          <TabsTrigger value="customers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Customer Images
          </TabsTrigger>
        </TabsList>

        {/* Image Gallery Tab */}
        <TabsContent value="gallery" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Image Gallery
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Entity Selection */}
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Entity Type:</label>
                    <Select
                      value={filters.entityType || ''}
                      onValueChange={(value: EntityType) => {
                        setFilters(prev => ({ ...prev, entityType: value, entityId: undefined }));
                        setSelectedEntity(null);
                      }}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="product">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Products
                          </div>
                        </SelectItem>
                        <SelectItem value="category">
                          <div className="flex items-center gap-2">
                            <FolderOpen className="h-4 w-4" />
                            Categories
                          </div>
                        </SelectItem>
                        <SelectItem value="company">
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4" />
                            Company
                          </div>
                        </SelectItem>
                        <SelectItem value="customer">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Customers
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {filters.entityType && (
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">Entity:</label>
                      <Select
                        value={filters.entityId || ''}
                        onValueChange={(value) => {
                          const entity = filters.entityType === 'category' 
                            ? categories.find(c => c.id === value)
                            : filters.entityType === 'product'
                            ? inventoryData?.items.find(p => p.id === value)
                            : filters.entityType === 'customer'
                            ? customers.find(c => c.id === value)
                            : { id: 'company', name: 'Company Assets' };
                          
                          if (entity) {
                            handleEntitySelect(filters.entityType!, value, entity.name);
                          }
                        }}
                      >
                        <SelectTrigger className="w-60">
                          <SelectValue placeholder="Select entity" />
                        </SelectTrigger>
                        <SelectContent>
                          {filters.entityType === 'category' && categories.map(category => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                          {filters.entityType === 'product' && inventoryData?.items.map(product => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name}
                            </SelectItem>
                          ))}
                          {filters.entityType === 'customer' && customers.map(customer => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name}
                            </SelectItem>
                          ))}
                          {filters.entityType === 'company' && (
                            <SelectItem value="company">
                              Company Assets
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="flex items-center gap-2 ml-auto">
                    <div className="flex items-center border rounded-md">
                      <Button
                        variant={filters.viewMode === 'grid' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setFilters(prev => ({ ...prev, viewMode: 'grid' }))}
                      >
                        <Grid3X3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={filters.viewMode === 'list' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setFilters(prev => ({ ...prev, viewMode: 'list' }))}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Selected Entity Display */}
                {selectedEntity && (
                  <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      {selectedEntity.type === 'product' && <Package className="h-3 w-3" />}
                      {selectedEntity.type === 'category' && <FolderOpen className="h-3 w-3" />}
                      {selectedEntity.type === 'company' && <Building className="h-3 w-3" />}
                      {selectedEntity.type}
                    </Badge>
                    <span className="font-medium">{selectedEntity.name}</span>
                  </div>
                )}

                {/* Image Gallery */}
                {selectedEntity ? (
                  <ImageGallery
                    entityType={selectedEntity.type}
                    entityId={selectedEntity.id}
                    viewMode={filters.viewMode}
                    enableReorder={true}
                    enableZoom={true}
                    enableFullscreen={true}
                    className="mt-6"
                  />
                ) : (
                  <div className="text-center py-12">
                    <ImageIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Select an Entity</h3>
                    <p className="text-muted-foreground">
                      Choose an entity type and specific entity to view and manage its images.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Category Images Tab */}
        <TabsContent value="categories" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5" />
                  Category Image Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {categories.map((category) => (
                    <Card key={category.id} className="border-2 hover:border-primary/20 transition-colors">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">{category.name}</CardTitle>
                        {category.description && (
                          <p className="text-sm text-muted-foreground">{category.description}</p>
                        )}
                      </CardHeader>
                      <CardContent>
                        <CategoryImageManager
                          categoryId={category.id}
                          categoryName={category.name}
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {categories.length === 0 && (
                  <div className="text-center py-12">
                    <FolderOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Categories Found</h3>
                    <p className="text-muted-foreground">
                      Create categories first to manage their images.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Product Images Tab */}
        <TabsContent value="products" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Product Image Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Search */}
                  <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search products..."
                      value={filters.search || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="pl-10"
                    />
                  </div>

                  {/* Product List */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {inventoryData?.items
                      .filter(product => 
                        !filters.search || 
                        product.name.toLowerCase().includes(filters.search.toLowerCase())
                      )
                      .map((product) => (
                      <Card key={product.id} className="border-2 hover:border-primary/20 transition-colors">
                        <CardHeader className="pb-3">
                          <div className="flex items-center gap-3">
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-12 h-12 rounded-lg object-cover border"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center border">
                                <Package className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <CardTitle className="text-base">{product.name}</CardTitle>
                              {product.description && (
                                <p className="text-sm text-muted-foreground line-clamp-1">
                                  {product.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <ImageGallery
                            entityType="product"
                            entityId={product.id}
                            viewMode="grid"
                            enableReorder={true}
                            enableZoom={true}
                            enableFullscreen={true}
                            maxImages={10}
                          />
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {(!inventoryData?.items || inventoryData.items.length === 0) && (
                    <div className="text-center py-12">
                      <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Products Found</h3>
                      <p className="text-muted-foreground">
                        Create products first to manage their images.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Customer Images Tab */}
        <TabsContent value="customers" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Customer Image Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Search */}
                  <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search customers..."
                      value={filters.search || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="pl-10"
                    />
                  </div>

                  {/* Customer List */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {customers
                      .filter(customer => 
                        !filters.search || 
                        customer.name.toLowerCase().includes(filters.search.toLowerCase())
                      )
                      .map((customer) => (
                      <Card key={customer.id} className="border-2 hover:border-primary/20 transition-colors">
                        <CardHeader className="pb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                              <Users className="h-6 w-6 text-primary-600" />
                            </div>
                            <div>
                              <CardTitle className="text-base">{customer.name}</CardTitle>
                              <p className="text-sm text-muted-foreground">
                                {customer.phone || customer.email || 'No contact info'}
                              </p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <ImageGallery
                            entityType="customer"
                            entityId={customer.id}
                            viewMode="grid"
                            enableReorder={true}
                            enableZoom={true}
                            enableFullscreen={true}
                            maxImages={10}
                          />
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {customers.length === 0 && (
                    <div className="text-center py-12">
                      <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Customers Found</h3>
                      <p className="text-muted-foreground">
                        Create customers first to manage their images.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Upload Dialog */}
      {showUpload && selectedEntity && (
        <ImageUpload
          entityType={selectedEntity.type}
          entityId={selectedEntity.id}
          multiple={true}
          maxFiles={20}
          onUploadComplete={handleUploadComplete}
          onUploadError={(error) => {
            console.error('Upload error:', error);
            setShowUpload(false);
          }}
        />
      )}
    </div>
  );
};

export default ImageManagement;