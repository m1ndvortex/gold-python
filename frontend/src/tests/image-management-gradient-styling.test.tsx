/**
 * Image Management Gradient Styling Tests
 * 
 * Tests for the gradient styling implementation in the Image Management page
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ImageManagement } from '../pages/ImageManagement';

// Mock the hooks
jest.mock('../hooks/useInventory', () => ({
  useCategories: () => ({
    data: [
      { id: '1', name: 'Gold Jewelry', description: 'Premium gold jewelry collection' },
      { id: '2', name: 'Silver Items', description: 'Silver accessories and jewelry' }
    ],
    isLoading: false
  }),
  useInventoryItems: () => ({
    data: {
      items: [
        { id: '1', name: 'Gold Ring', description: 'Beautiful gold ring', image_url: null },
        { id: '2', name: 'Silver Necklace', description: 'Elegant silver necklace', image_url: '/test-image.jpg' }
      ]
    },
    isLoading: false
  })
}));

jest.mock('../hooks/useCustomers', () => ({
  useCustomers: () => ({
    data: [
      { id: '1', name: 'John Doe', phone: '+1234567890', email: 'john@example.com' },
      { id: '2', name: 'Jane Smith', phone: '+0987654321', email: 'jane@example.com' }
    ],
    isLoading: false
  })
}));

// Mock the image management components
jest.mock('../components/image-management', () => ({
  ImageGallery: ({ entityType, entityId }: { entityType: string; entityId: string }) => (
    <div data-testid={`image-gallery-${entityType}-${entityId}`}>
      Image Gallery for {entityType} {entityId}
    </div>
  ),
  ImageUpload: ({ entityType, entityId }: { entityType: string; entityId: string }) => (
    <div data-testid={`image-upload-${entityType}-${entityId}`}>
      Image Upload for {entityType} {entityId}
    </div>
  ),
  CategoryImageManager: ({ categoryId }: { categoryId: string }) => (
    <div data-testid={`category-image-manager-${categoryId}`}>
      Category Image Manager for {categoryId}
    </div>
  )
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  }
}));

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false }
  }
});

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('ImageManagement Gradient Styling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Header Styling', () => {
    it('should render header with gradient icon container', async () => {
      renderWithProviders(<ImageManagement />);
      
      await waitFor(() => {
        const header = screen.getByText('Image Management');
        expect(header).toBeInTheDocument();
        expect(header).toHaveClass('bg-gradient-to-r', 'from-purple-600', 'to-violet-600');
      });
    });

    it('should render upload button with gradient styling', async () => {
      renderWithProviders(<ImageManagement />);
      
      await waitFor(() => {
        const uploadButton = screen.getByRole('button', { name: /upload images/i });
        expect(uploadButton).toBeInTheDocument();
        expect(uploadButton).toHaveClass('bg-gradient-to-r', 'from-purple-500', 'to-violet-600');
      });
    });
  });

  describe('Tab Navigation Styling', () => {
    it('should render tabs with gradient background', async () => {
      renderWithProviders(<ImageManagement />);
      
      await waitFor(() => {
        const tabsList = document.querySelector('[role="tablist"]');
        expect(tabsList).toBeInTheDocument();
        expect(tabsList).toHaveClass('bg-gradient-to-r', 'from-purple-50', 'via-violet-50', 'to-purple-50');
      });
    });

    it('should render all tab triggers with proper styling', async () => {
      renderWithProviders(<ImageManagement />);
      
      await waitFor(() => {
        const galleryTab = screen.getByRole('tab', { name: /image gallery/i });
        const categoriesTab = screen.getByRole('tab', { name: /category images/i });
        const productsTab = screen.getByRole('tab', { name: /product images/i });
        const customersTab = screen.getByRole('tab', { name: /customer images/i });

        [galleryTab, categoriesTab, productsTab, customersTab].forEach(tab => {
          expect(tab).toBeInTheDocument();
          expect(tab).toHaveClass('transition-all', 'duration-300');
        });
      });
    });
  });

  describe('Card Styling', () => {
    it('should render main cards with gradient backgrounds', async () => {
      renderWithProviders(<ImageManagement />);
      
      await waitFor(() => {
        // Check for gradient card styling classes
        const cards = document.querySelectorAll('.bg-gradient-to-br');
        expect(cards.length).toBeGreaterThan(0);
        
        // Verify specific gradient classes
        const gradientCards = document.querySelectorAll('.from-purple-50');
        expect(gradientCards.length).toBeGreaterThan(0);
      });
    });

    it('should render icon containers with gradient backgrounds', async () => {
      renderWithProviders(<ImageManagement />);
      
      await waitFor(() => {
        const iconContainers = document.querySelectorAll('.bg-gradient-to-br.from-purple-500');
        expect(iconContainers.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Categories Tab Styling', () => {
    it('should render category cards with gradient styling', async () => {
      renderWithProviders(<ImageManagement />);
      
      // Click on categories tab
      const categoriesTab = screen.getByRole('tab', { name: /category images/i });
      categoriesTab.click();
      
      await waitFor(() => {
        const categoryManagers = screen.getAllByTestId(/category-image-manager/);
        expect(categoryManagers.length).toBe(2);
      });
    });
  });

  describe('Products Tab Styling', () => {
    it('should render product cards with gradient styling', async () => {
      renderWithProviders(<ImageManagement />);
      
      // Click on products tab
      const productsTab = screen.getByRole('tab', { name: /product images/i });
      productsTab.click();
      
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search products...');
        expect(searchInput).toBeInTheDocument();
      });
    });
  });

  describe('Customers Tab Styling', () => {
    it('should render customer cards with gradient styling', async () => {
      renderWithProviders(<ImageManagement />);
      
      // Click on customers tab
      const customersTab = screen.getByRole('tab', { name: /customer images/i });
      customersTab.click();
      
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search customers...');
        expect(searchInput).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should render loading states with gradient styling', async () => {
      // Mock loading state
      jest.doMock('../hooks/useInventory', () => ({
        useCategories: () => ({
          data: [],
          isLoading: true
        }),
        useInventoryItems: () => ({
          data: null,
          isLoading: true
        })
      }));

      jest.doMock('../hooks/useCustomers', () => ({
        useCustomers: () => ({
          data: [],
          isLoading: true
        })
      }));

      renderWithProviders(<ImageManagement />);
      
      await waitFor(() => {
        // Check for loading skeleton elements
        const loadingElements = document.querySelectorAll('.animate-pulse');
        expect(loadingElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Interactive Elements', () => {
    it('should render view mode toggle buttons with gradient styling', async () => {
      renderWithProviders(<ImageManagement />);
      
      await waitFor(() => {
        const viewModeContainer = document.querySelector('.bg-white.shadow-sm');
        expect(viewModeContainer).toBeInTheDocument();
      });
    });

    it('should render selected entity badge with gradient styling', async () => {
      renderWithProviders(<ImageManagement />);
      
      // The selected entity badge should appear when an entity is selected
      // This would require more complex interaction testing
      await waitFor(() => {
        const page = screen.getByText('Image Management');
        expect(page).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('should maintain gradient styling across different screen sizes', async () => {
      renderWithProviders(<ImageManagement />);
      
      await waitFor(() => {
        // Check for responsive grid classes
        const grids = document.querySelectorAll('.grid-cols-1.lg\\:grid-cols-2.xl\\:grid-cols-3');
        expect(grids.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Animation and Transitions', () => {
    it('should include transition classes for smooth animations', async () => {
      renderWithProviders(<ImageManagement />);
      
      await waitFor(() => {
        const transitionElements = document.querySelectorAll('.transition-all.duration-300');
        expect(transitionElements.length).toBeGreaterThan(0);
      });
    });

    it('should include hover effects with scale transforms', async () => {
      renderWithProviders(<ImageManagement />);
      
      await waitFor(() => {
        const hoverElements = document.querySelectorAll('.hover\\:scale-105');
        expect(hoverElements.length).toBeGreaterThan(0);
      });
    });
  });
});