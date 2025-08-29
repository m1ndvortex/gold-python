/**
 * Universal Inventory Basic Tests
 * Basic tests for the universal inventory system components
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { UniversalInventory } from '../pages/UniversalInventory';
import { UniversalCategoryTreeView } from '../components/inventory/UniversalCategoryTreeView';
import { UniversalAdvancedSearch } from '../components/inventory/UniversalAdvancedSearch';
import type { UniversalCategory } from '../types/universalInventory';

// Mock the hooks
jest.mock('../hooks/useUniversalInventory', () => ({
  useUniversalInventoryItems: () => ({
    data: {
      items: [],
      total: 0,
      page: 1,
      per_page: 50,
      total_pages: 1,
      has_next: false,
      has_prev: false,
    },
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  }),
  useUniversalCategoriesTree: () => ({
    data: [],
    isLoading: false,
  }),
  useLowStockAlerts: () => ({
    data: [],
    isLoading: false,
  }),
  useInventorySummary: () => ({
    data: {
      total_items: 0,
      total_value: 0,
      low_stock_items: 0,
      categories_count: 0,
    },
    isLoading: false,
  }),
  useInventoryActions: () => ({
    deleteItem: { mutateAsync: jest.fn() },
  }),
  useCategoryActions: () => ({
    createCategory: { mutateAsync: jest.fn() },
    updateCategory: { mutateAsync: jest.fn() },
    deleteCategory: { mutateAsync: jest.fn() },
  }),
}));

// Mock language hook
jest.mock('../hooks/useLanguage', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
    language: 'en',
    direction: 'ltr',
  }),
}));

const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Universal Inventory System', () => {
  describe('UniversalInventory Page', () => {
    it('renders without crashing', () => {
      const Wrapper = createTestWrapper();
      render(
        <Wrapper>
          <UniversalInventory />
        </Wrapper>
      );

      expect(screen.getByText('inventory.universal_management')).toBeInTheDocument();
    });

    it('displays empty state when no items', () => {
      const Wrapper = createTestWrapper();
      render(
        <Wrapper>
          <UniversalInventory />
        </Wrapper>
      );

      expect(screen.getByText('inventory.no_items_found')).toBeInTheDocument();
      expect(screen.getByText('inventory.add_first_item')).toBeInTheDocument();
    });
  });
});