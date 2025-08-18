import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { InventoryList } from '../components/inventory/InventoryList';
import { CategoryManager } from '../components/inventory/CategoryManager';
import type { InventoryItem, Category } from '../types';

export const Inventory: React.FC = () => {
  const handleItemSelect = (item: InventoryItem) => {
    // Handle item selection if needed
    console.log('Selected item:', item);
  };

  const handleCategorySelect = (category: Category) => {
    // Handle category selection if needed
    console.log('Selected category:', category);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Tabs defaultValue="inventory" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="inventory">Inventory Items</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>
        
        <TabsContent value="inventory" className="space-y-6">
          <InventoryList onItemSelect={handleItemSelect} />
        </TabsContent>
        
        <TabsContent value="categories" className="space-y-6">
          <CategoryManager onCategorySelect={handleCategorySelect} />
        </TabsContent>
      </Tabs>
    </div>
  );
};