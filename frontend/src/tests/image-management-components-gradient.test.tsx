/**
 * Image Management Components Gradient Styling Tests
 * 
 * Tests for gradient styling implementation in individual image management components
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { CategoryImageManager } from '../components/image-management/CategoryImageManager';
import { ImageUpload } from '../components/image-management/ImageUpload';
import { ImageViewer } from '../components/image-management/ImageViewer';
import { ImageGallery } from '../components/image-management/ImageGallery';
import { ImageMetadata } from '../types/imageManagement';

// Mock the API
jest.mock('../services/imageManagementApi', () => ({
  default: {
    getEntityImages: jest.fn().mockResolvedValue([]),
    uploadImage: jest.fn().mockResolvedValue({ id: 'test-id', url: 'test-url' }),
    deleteImage: jest.fn().mockResolvedValue({}),
    updateImageMetadata: jest.fn().mockResolvedValue({}),
    getImageUrl: jest.fn().mockReturnValue('test-image-url'),
  },
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock IntersectionObserver
(global as any).IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
      },
    },
  });
};

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

const mockImageMetadata: ImageMetadata = {
  id: 'test-image-1',
  original_filename: 'test-image.jpg',
  stored_filename: 'stored-test-image.jpg',
  file_path: '/images/stored-test-image.jpg',
  mime_type: 'image/jpeg',
  file_size_bytes: 1024000,
  image_width: 800,
  image_height: 600,
  alt_text: 'Test image',
  caption: 'Test caption',
  is_primary: true,
  sort_order: 0,
  optimization_applied: true,
  compression_ratio: 0.8,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  thumbnails: {
    small: { 
      filename: 'small.jpg',
      path: '/thumbnails/small.jpg',
      width: 150, 
      height: 150,
      file_size: 5000,
      quality: 80
    },
    medium: { 
      filename: 'medium.jpg',
      path: '/thumbnails/medium.jpg',
      width: 300, 
      height: 300,
      file_size: 15000,
      quality: 85
    },
  }
};

describe('Image Management Components Gradient Styling', () => {
  describe('CategoryImageManager Component', () => {
    it('should render with gradient styling', async () => {
      renderWithProviders(
        <CategoryImageManager 
          categoryId="test-category" 
          categoryName="Test Category"
        />
      );

      await waitFor(() => {
        // Check for gradient tab styling
        const tabsList = document.querySelector('[role="tablist"]');
        expect(tabsList).toHaveClass('bg-gradient-to-r', 'from-green-50', 'via-teal-50', 'to-blue-50');

        // Check for gradient loading state
        const loadingElements = document.querySelectorAll('.bg-gradient-to-r.from-blue-50.to-indigo-50');
        expect(loadingElements.length).toBeGreaterThan(0);
      });
    });

    it('should render tab triggers with gradient active states', async () => {
      renderWithProviders(
        <CategoryImageManager 
          categoryId="test-category" 
          categoryName="Test Category"
        />
      );

      await waitFor(() => {
        const tabTriggers = document.querySelectorAll('[role="tab"]');
        expect(tabTriggers.length).toBeGreaterThan(0);
        
        // Check for gradient active state classes
        const activeTab = document.querySelector('[data-state="active"]');
        expect(activeTab).toHaveClass('data-[state=active]:border-green-300');
      });
    });

    it('should render icon preset cards with gradient backgrounds', async () => {
      renderWithProviders(
        <CategoryImageManager 
          categoryId="test-category" 
          categoryName="Test Category"
        />
      );

      // Click on icons tab
      const iconsTab = screen.getByText(/Icon Presets/);
      fireEvent.click(iconsTab);

      await waitFor(() => {
        // Check for gradient card backgrounds
        const cards = document.querySelectorAll('.bg-gradient-to-br.from-purple-50.to-violet-100\\/50');
        expect(cards.length).toBeGreaterThan(0);
      });
    });
  });

  describe('ImageUpload Component', () => {
    it('should render dialog with gradient background', () => {
      renderWithProviders(
        <ImageUpload
          entityType="category"
          entityId="test-category"
          onUploadComplete={() => {}}
          onUploadError={() => {}}
        />
      );

      // Check for gradient dialog background
      const dialogContent = document.querySelector('[role="dialog"]');
      expect(dialogContent).toHaveClass('bg-gradient-to-br', 'from-green-50/30', 'to-white');
    });

    it('should render upload area with gradient styling', () => {
      renderWithProviders(
        <ImageUpload
          entityType="category"
          entityId="test-category"
          onUploadComplete={() => {}}
          onUploadError={() => {}}
        />
      );

      // Check for gradient upload area
      const uploadArea = document.querySelector('.bg-gradient-to-br.from-green-50\\/50.to-teal-50\\/30');
      expect(uploadArea).toBeInTheDocument();
    });

    it('should render buttons with gradient styling', () => {
      renderWithProviders(
        <ImageUpload
          entityType="category"
          entityId="test-category"
          onUploadComplete={() => {}}
          onUploadError={() => {}}
        />
      );

      // Check for gradient buttons
      const gradientButtons = document.querySelectorAll('.bg-gradient-to-r.from-green-500.to-teal-600');
      expect(gradientButtons.length).toBeGreaterThan(0);
    });
  });

  describe('ImageViewer Component', () => {
    it('should render with gradient metadata panel', () => {
      renderWithProviders(
        <ImageViewer
          image={mockImageMetadata}
          onClose={() => {}}
        />
      );

      // Check for gradient metadata panel
      const metadataPanel = document.querySelector('.bg-gradient-to-b.from-gray-900.to-gray-800');
      expect(metadataPanel).toBeInTheDocument();
    });

    it('should render badges with gradient styling', () => {
      renderWithProviders(
        <ImageViewer
          image={mockImageMetadata}
          onClose={() => {}}
        />
      );

      // Check for gradient badges
      const primaryBadge = document.querySelector('.bg-gradient-to-r.from-yellow-500.to-amber-600');
      expect(primaryBadge).toBeInTheDocument();
    });

    it('should render metadata cards with gradient backgrounds', () => {
      renderWithProviders(
        <ImageViewer
          image={mockImageMetadata}
          showMetadata={true}
          onClose={() => {}}
        />
      );

      // Check for gradient metadata cards
      const metadataCards = document.querySelectorAll('.bg-gradient-to-br.from-gray-800.to-gray-700');
      expect(metadataCards.length).toBeGreaterThan(0);
    });
  });

  describe('ImageGallery Component', () => {
    it('should render with gradient loading state', async () => {
      renderWithProviders(
        <ImageGallery
          entityType="category"
          entityId="test-category"
        />
      );

      await waitFor(() => {
        // Check for gradient loading state
        const loadingElements = document.querySelectorAll('.bg-gradient-to-r.from-blue-50.to-indigo-50');
        expect(loadingElements.length).toBeGreaterThan(0);
      });
    });

    it('should render view mode toggle with gradient styling', async () => {
      renderWithProviders(
        <ImageGallery
          entityType="category"
          entityId="test-category"
        />
      );

      await waitFor(() => {
        // Check for gradient view mode toggle
        const viewModeToggle = document.querySelector('.bg-gradient-to-r.from-slate-50.to-slate-100');
        expect(viewModeToggle).toBeInTheDocument();
      });
    });

    it('should render sort button with gradient styling', async () => {
      renderWithProviders(
        <ImageGallery
          entityType="category"
          entityId="test-category"
        />
      );

      await waitFor(() => {
        // Check for gradient sort button
        const sortButton = document.querySelector('.bg-gradient-to-r.from-purple-500.to-violet-600');
        expect(sortButton).toBeInTheDocument();
      });
    });

    it('should render upload button with gradient styling', async () => {
      renderWithProviders(
        <ImageGallery
          entityType="category"
          entityId="test-category"
        />
      );

      await waitFor(() => {
        // Check for gradient upload button
        const uploadButton = document.querySelector('.bg-gradient-to-r.from-green-500.to-teal-600');
        expect(uploadButton).toBeInTheDocument();
      });
    });

    it('should render empty state card with gradient background', async () => {
      renderWithProviders(
        <ImageGallery
          entityType="category"
          entityId="test-category"
        />
      );

      await waitFor(() => {
        // Check for gradient empty state card
        const emptyStateCard = document.querySelector('.bg-gradient-to-br.from-gray-50.to-slate-100\\/50');
        expect(emptyStateCard).toBeInTheDocument();
      });
    });
  });

  describe('Gradient Design System Consistency', () => {
    it('should use consistent gradient color schemes across components', () => {
      // Test CategoryImageManager
      renderWithProviders(
        <CategoryImageManager 
          categoryId="test-category" 
          categoryName="Test Category"
        />
      );

      // Check for consistent green-teal gradient usage
      const greenTealGradients = document.querySelectorAll('.from-green-500.to-teal-600');
      expect(greenTealGradients.length).toBeGreaterThan(0);

      // Check for consistent blue-indigo gradient usage
      const blueIndigoGradients = document.querySelectorAll('.from-blue-50.to-indigo-50');
      expect(blueIndigoGradients.length).toBeGreaterThan(0);
    });

    it('should include proper shadow effects', () => {
      renderWithProviders(
        <CategoryImageManager 
          categoryId="test-category" 
          categoryName="Test Category"
        />
      );

      // Check for shadow classes
      const shadowElements = document.querySelectorAll('.shadow-lg, .shadow-xl');
      expect(shadowElements.length).toBeGreaterThan(0);
    });

    it('should include transition animations', () => {
      renderWithProviders(
        <CategoryImageManager 
          categoryId="test-category" 
          categoryName="Test Category"
        />
      );

      // Check for transition classes
      const transitionElements = document.querySelectorAll('.transition-all.duration-300');
      expect(transitionElements.length).toBeGreaterThan(0);
    });

    it('should maintain hover effects', () => {
      renderWithProviders(
        <CategoryImageManager 
          categoryId="test-category" 
          categoryName="Test Category"
        />
      );

      // Check for hover effect classes
      const hoverElements = document.querySelectorAll('[class*="hover:"]');
      expect(hoverElements.length).toBeGreaterThan(0);
    });
  });
});