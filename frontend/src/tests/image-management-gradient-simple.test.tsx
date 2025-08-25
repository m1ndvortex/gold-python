/**
 * Image Management Gradient Styling - Simple Tests
 * 
 * Focused tests for the gradient styling implementation in the Image Management page
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

describe('ImageManagement Gradient Styling - Core Features', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the page with gradient header styling', async () => {
    renderWithProviders(<ImageManagement />);
    
    await waitFor(() => {
      // Check for main title with gradient text
      const title = screen.getByText('Image Management');
      expect(title).toBeInTheDocument();
      expect(title).toHaveClass('bg-gradient-to-r', 'from-purple-600', 'to-violet-600', 'bg-clip-text', 'text-transparent');
    });
  });

  it('should render header icon container with gradient background', async () => {
    renderWithProviders(<ImageManagement />);
    
    await waitFor(() => {
      // Check for gradient icon container
      const iconContainer = document.querySelector('.h-12.w-12.rounded-xl.bg-gradient-to-br.from-purple-500.to-violet-600');
      expect(iconContainer).toBeInTheDocument();
      expect(iconContainer).toHaveClass('shadow-lg');
    });
  });

  it('should render upload button with gradient styling', async () => {
    renderWithProviders(<ImageManagement />);
    
    await waitFor(() => {
      const uploadButton = screen.getByRole('button', { name: /upload images/i });
      expect(uploadButton).toBeInTheDocument();
      expect(uploadButton).toHaveClass(
        'bg-gradient-to-r',
        'from-purple-500',
        'to-violet-600',
        'hover:from-purple-600',
        'hover:to-violet-700',
        'text-white',
        'shadow-lg',
        'hover:shadow-xl',
        'transition-all',
        'duration-300'
      );
    });
  });

  it('should render tab navigation with gradient background', async () => {
    renderWithProviders(<ImageManagement />);
    
    await waitFor(() => {
      const tabsList = document.querySelector('[role="tablist"]');
      expect(tabsList).toBeInTheDocument();
      expect(tabsList).toHaveClass(
        'bg-gradient-to-r',
        'from-purple-50',
        'via-violet-50',
        'to-purple-50',
        'shadow-lg',
        'border-0'
      );
    });
  });

  it('should render tab triggers with proper gradient styling', async () => {
    renderWithProviders(<ImageManagement />);
    
    await waitFor(() => {
      const tabs = document.querySelectorAll('[role="tab"]');
      expect(tabs.length).toBe(4);
      
      tabs.forEach(tab => {
        expect(tab).toHaveClass(
          'transition-all',
          'duration-300',
          'data-[state=active]:bg-white',
          'data-[state=active]:shadow-md',
          'data-[state=active]:border-2',
          'data-[state=active]:border-purple-300'
        );
      });
    });
  });

  it('should render all tab labels correctly', async () => {
    renderWithProviders(<ImageManagement />);
    
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /image gallery/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /category images/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /product images/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /customer images/i })).toBeInTheDocument();
    });
  });

  it('should have proper gradient classes in the DOM', async () => {
    renderWithProviders(<ImageManagement />);
    
    await waitFor(() => {
      // Check for various gradient classes
      const gradientElements = document.querySelectorAll('[class*="gradient"]');
      expect(gradientElements.length).toBeGreaterThan(0);
      
      // Check for specific gradient patterns
      const purpleGradients = document.querySelectorAll('[class*="from-purple"]');
      expect(purpleGradients.length).toBeGreaterThan(0);
      
      const violetGradients = document.querySelectorAll('[class*="to-violet"]');
      expect(violetGradients.length).toBeGreaterThan(0);
    });
  });

  it('should include transition and animation classes', async () => {
    renderWithProviders(<ImageManagement />);
    
    await waitFor(() => {
      const transitionElements = document.querySelectorAll('[class*="transition"]');
      expect(transitionElements.length).toBeGreaterThan(0);
      
      const durationElements = document.querySelectorAll('[class*="duration-300"]');
      expect(durationElements.length).toBeGreaterThan(0);
    });
  });

  it('should include shadow effects', async () => {
    renderWithProviders(<ImageManagement />);
    
    await waitFor(() => {
      const shadowElements = document.querySelectorAll('[class*="shadow"]');
      expect(shadowElements.length).toBeGreaterThan(0);
      
      // Check for specific shadow classes
      const shadowLgElements = document.querySelectorAll('[class*="shadow-lg"]');
      expect(shadowLgElements.length).toBeGreaterThan(0);
    });
  });

  it('should render with proper responsive classes', async () => {
    renderWithProviders(<ImageManagement />);
    
    await waitFor(() => {
      // Check for responsive layout classes
      const responsiveElements = document.querySelectorAll('[class*="lg:"]');
      expect(responsiveElements.length).toBeGreaterThan(0);
      
      const flexResponsive = document.querySelectorAll('[class*="flex-col"][class*="lg:flex-row"]');
      expect(flexResponsive.length).toBeGreaterThan(0);
    });
  });

  it('should maintain accessibility with proper ARIA attributes', async () => {
    renderWithProviders(<ImageManagement />);
    
    await waitFor(() => {
      // Check for proper tab accessibility
      const tablist = screen.getByRole('tablist');
      expect(tablist).toBeInTheDocument();
      
      const tabs = screen.getAllByRole('tab');
      expect(tabs.length).toBe(4);
      
      // Check that buttons have proper accessibility
      const uploadButton = screen.getByRole('button', { name: /upload images/i });
      expect(uploadButton).toBeInTheDocument();
    });
  });
});