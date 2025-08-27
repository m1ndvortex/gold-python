import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { 
  Package, 
  FolderTree,
  BarChart3,
  Zap
} from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { motion } from 'framer-motion';
import { Card, CardContent } from '../components/ui/card';
import ImageManagement from './ImageManagement';

// Import Enhanced Universal Inventory System
import { UniversalInventoryManagement } from '../components/inventory/UniversalInventoryManagement';
import { UniversalCategoryHierarchy } from '../components/inventory/UniversalCategoryHierarchy';

// Enhanced Professional Inventory Management System
// This system completely replaces the old inventory system with enterprise-grade features

export const Inventory: React.FC = () => {
  const { t } = useLanguage();

  // Use the Enhanced Universal Inventory Management System
  return (
    <div className="min-h-screen">
      <UniversalInventoryManagement />
    </div>
  );
};

// Enhanced Professional Category Management Route
const EnhancedCategoriesRoute: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header with gradient styling */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 mb-6"
      >
        <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center shadow-lg">
          <FolderTree className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
            {t('inventory.professional_category_management')}
          </h1>
          <p className="text-muted-foreground mt-1">
            Enterprise-level category hierarchy with infinite nesting capabilities
          </p>
        </div>
      </motion.div>
    
      {/* Enhanced Category Management with Infinite Nesting */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card variant="gradient-green" className="border-0 shadow-lg">
          <CardContent className="p-6">
            <UniversalCategoryHierarchy 
              categories={[]}
              showStats={true}
              showActions={true}
              isDragMode={false}
              onCategorySelect={(category) => console.log('Selected category:', category)}
              onCategoryEdit={(category) => console.log('Edit category:', category)}
              onCategoryDelete={(category) => console.log('Delete category:', category)}
              onCategoryAdd={(parentId) => console.log('Add category with parent:', parentId)}
              onCategoryMove={(categoryId, newParentId) => console.log('Move category:', categoryId, 'to:', newParentId)}
            />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

// Enhanced Products Route with Universal System
const EnhancedProductsRoute: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header with gradient styling */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 mb-6"
      >
        <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
          <Package className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {t('inventory.enhanced_product_management')}
          </h1>
          <p className="text-muted-foreground mt-1">
            Professional inventory management with advanced features
          </p>
        </div>
      </motion.div>
    
      {/* Enhanced Universal Inventory System */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card variant="gradient-blue" className="border-0 shadow-lg">
          <CardContent className="p-6">
            <UniversalInventoryManagement />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

// Enhanced Analytics Route
const EnhancedAnalyticsRoute: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header with gradient styling */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 mb-6"
      >
        <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
          <BarChart3 className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-600 bg-clip-text text-transparent">
            {t('inventory.inventory_analytics')}
          </h1>
          <p className="text-muted-foreground mt-1">
            Advanced inventory analytics and business intelligence
          </p>
        </div>
      </motion.div>
    
      {/* Analytics Dashboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card variant="gradient-purple" className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="text-center py-12">
              <BarChart3 className="h-16 w-16 text-purple-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Advanced Analytics Dashboard</h3>
              <p className="text-muted-foreground">
                Comprehensive inventory analytics with real-time insights
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

// Enhanced Bulk Operations Route
const EnhancedBulkOperationsRoute: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header with gradient styling */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 mb-6"
      >
        <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
          <Zap className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-600 bg-clip-text text-transparent">
            {t('inventory.bulk_operations')}
          </h1>
          <p className="text-muted-foreground mt-1">
            Efficient bulk operations for inventory management
          </p>
        </div>
      </motion.div>
    
      {/* Bulk Operations Interface */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card variant="gradient-orange" className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="text-center py-12">
              <Zap className="h-16 w-16 text-orange-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Bulk Operations Center</h3>
              <p className="text-muted-foreground">
                Perform bulk updates, imports, and exports efficiently
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

// Enhanced Image Management Route
const EnhancedImagesRoute: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header with gradient styling */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 mb-6"
      >
        <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg">
          <Package className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
            {t('inventory.enhanced_image_management')}
          </h1>
          <p className="text-muted-foreground mt-1">
            Professional image management with advanced features
          </p>
        </div>
      </motion.div>
    
      {/* Enhanced Image Management */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card variant="gradient-pink" className="border-0 shadow-lg">
          <CardContent className="p-6">
            <ImageManagement />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

// Enhanced Wrapper component to handle sub-routes with Universal Inventory System
export const InventoryWithRouting: React.FC = () => {
  return (
    <Routes>
      <Route path="/products" element={<EnhancedProductsRoute />} />
      <Route path="/categories" element={<EnhancedCategoriesRoute />} />
      <Route path="/analytics" element={<EnhancedAnalyticsRoute />} />
      <Route path="/bulk" element={<EnhancedBulkOperationsRoute />} />
      <Route path="/images" element={<EnhancedImagesRoute />} />
      <Route path="/" element={<Inventory />} />
      <Route path="/*" element={<Inventory />} />
    </Routes>
  );
};