/**
 * Image Management Simple Tests
 * 
 * Basic unit tests for image management components
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ImageGallery, ImageViewer, ImageUpload, CategoryImageManager } from '../components/image-management';
import { ImageMetadata } from '../types/imageManagement';
import ImageManagementAPI from '../services/imageManagementApi';

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    }
  }))
}));

// Mock the API
jest.mock('../services/imageManagementApi');
const mockAPI = ImageManagementAPI as jest.Mocked<typeof ImageManagementAPI>;

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock URL methods
Object.defineProperty(window.URL, 'createObjectURL', {
  writable: true,
  value: jest.fn(() => 'mock-url')
});

Object.defineProperty(window.URL, 'revokeObjectURL', {
  writable: true,
  value: jest.fn()
});

// Sample test data
const mockImage: ImageMetadata = {
  id: 'img-1',
  original_filename: 'test.jpg',
  stored_filename: 'stored_test.jpg',
  file_path: '/uploads/stored_test.jpg',
  file_size_bytes: 1024000,
  mime_type: 'image/jpeg',
  image_width: 800,
  image_height: 600,
  is_primary: true,
  alt_text: 'Test image',
  sort_order: 0,
  optimization_applied: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

describe('Image Management Simple Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAPI.getEntityImages.mockResolvedValue([mockImage]);
    mockAPI.getImageUrl.mockReturnValue('http://localhost:8000/api/images/file/img-1');
  });

  describe('ImageGallery', () => {
    test('renders loading state initially', () => {
      render(
        <ImageGallery
          entityType="product"
          entityId="prod-1"
        />
      );

      expect(screen.getByText('Loading images...')).toBeInTheDocument();
    });

    test('renders images after loading', async () => {
      render(
        <ImageGallery
          entityType="product"
          entityId="prod-1"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Images')).toBeInTheDocument();
      });

      expect(screen.getByText('1 of 1')).toBeInTheDocument();
      expect(mockAPI.getEntityImages).toHaveBeenCalledWith('product', 'prod-1', true);
    });

    test('handles empty state', async () => {
      mockAPI.getEntityImages.mockResolvedValue([]);

      render(
        <ImageGallery
          entityType="product"
          entityId="prod-1"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('No images uploaded')).toBeInTheDocument();
      });

      expect(screen.getByText('Upload Images')).toBeInTheDocument();
    });

    test('switches view modes', async () => {
      render(
        <ImageGallery
          entityType="product"
          entityId="prod-1"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Images')).toBeInTheDocument();
      });

      // Test grid/list toggle
      const listButton = screen.getByRole('button', { name: /list/i });
      fireEvent.click(listButton);

      expect(listButton).toHaveClass('bg-primary');
    });

    test('handles search input', async () => {
      render(
        <ImageGallery
          entityType="product"
          entityId="prod-1"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Images')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search images...');
      fireEvent.change(searchInput, { target: { value: 'test' } });

      expect(searchInput).toHaveValue('test');
    });

    test('calls onImageSelect when image is clicked', async () => {
      const mockOnImageSelect = jest.fn();

      render(
        <ImageGallery
          entityType="product"
          entityId="prod-1"
          onImageSelect={mockOnImageSelect}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Images')).toBeInTheDocument();
      });

      const imageCard = screen.getByRole('img').closest('[role="img"]')?.parentElement;
      if (imageCard) {
        fireEvent.click(imageCard);
        expect(mockOnImageSelect).toHaveBeenCalledWith(mockImage);
      }
    });
  });

  describe('ImageViewer', () => {
    test('renders image viewer with basic controls', () => {
      render(
        <ImageViewer
          image={mockImage}
          onClose={jest.fn()}
        />
      );

      expect(screen.getByText('Test image')).toBeInTheDocument();
      expect(screen.getByText('Primary')).toBeInTheDocument();
      expect(screen.getByRole('img')).toHaveAttribute('alt', 'Test image');
    });

    test('displays zoom controls when enabled', () => {
      render(
        <ImageViewer
          image={mockImage}
          enableZoom={true}
          onClose={jest.fn()}
        />
      );

      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /zoom.*in/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /zoom.*out/i })).toBeInTheDocument();
    });

    test('handles zoom functionality', () => {
      render(
        <ImageViewer
          image={mockImage}
          enableZoom={true}
          onClose={jest.fn()}
        />
      );

      const zoomInButton = screen.getByRole('button', { name: /zoom.*in/i });
      fireEvent.click(zoomInButton);

      expect(screen.getByText('150%')).toBeInTheDocument();
    });

    test('shows navigation controls for multiple images', () => {
      const images = [mockImage, { ...mockImage, id: 'img-2' }];

      render(
        <ImageViewer
          image={mockImage}
          images={images}
          currentIndex={0}
          enableNavigation={true}
          onClose={jest.fn()}
        />
      );

      expect(screen.getByText('1 of 2')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
    });

    test('displays metadata when enabled', () => {
      render(
        <ImageViewer
          image={mockImage}
          showMetadata={true}
          onClose={jest.fn()}
        />
      );

      expect(screen.getByText('Image Details')).toBeInTheDocument();
      expect(screen.getByText('test.jpg')).toBeInTheDocument();
      expect(screen.getByText('image/jpeg')).toBeInTheDocument();
    });

    test('calls onClose when close button is clicked', () => {
      const mockOnClose = jest.fn();

      render(
        <ImageViewer
          image={mockImage}
          onClose={mockOnClose}
        />
      );

      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('ImageUpload', () => {
    test('renders upload dialog', () => {
      render(
        <ImageUpload
          entityType="product"
          entityId="prod-1"
          onUploadComplete={jest.fn()}
        />
      );

      expect(screen.getByText('Upload Images')).toBeInTheDocument();
      expect(screen.getByText('Drag and drop images here, or click to select files')).toBeInTheDocument();
    });

    test('shows file format and size limits', () => {
      render(
        <ImageUpload
          entityType="product"
          entityId="prod-1"
          onUploadComplete={jest.fn()}
        />
      );

      expect(screen.getByText(/Supported formats:/)).toBeInTheDocument();
      expect(screen.getByText(/Maximum file size:/)).toBeInTheDocument();
      expect(screen.getByText(/Maximum files:/)).toBeInTheDocument();
    });

    test('handles file selection', async () => {
      render(
        <ImageUpload
          entityType="product"
          entityId="prod-1"
          onUploadComplete={jest.fn()}
        />
      );

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const input = screen.getByRole('button', { name: /select files/i })
        .parentElement?.querySelector('input[type="file"]');

      if (input) {
        Object.defineProperty(input, 'files', {
          value: [file],
          writable: false,
        });

        fireEvent.change(input);

        await waitFor(() => {
          expect(screen.getByText('test.jpg')).toBeInTheDocument();
        });
      }
    });

    test('shows advanced options when toggled', async () => {
      render(
        <ImageUpload
          entityType="product"
          entityId="prod-1"
          onUploadComplete={jest.fn()}
        />
      );

      // Add a file first
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const input = screen.getByRole('button', { name: /select files/i })
        .parentElement?.querySelector('input[type="file"]');

      if (input) {
        Object.defineProperty(input, 'files', {
          value: [file],
          writable: false,
        });

        fireEvent.change(input);

        await waitFor(() => {
          expect(screen.getByText('test.jpg')).toBeInTheDocument();
        });

        // Toggle advanced options
        const advancedToggle = screen.getByRole('switch', { name: /advanced options/i });
        fireEvent.click(advancedToggle);

        expect(screen.getByPlaceholderText('Describe this image...')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Image caption...')).toBeInTheDocument();
      }
    });

    test('handles upload process', async () => {
      mockAPI.uploadImage.mockResolvedValue({
        success: true,
        image_id: 'new-img',
        stored_filename: 'stored_test.jpg',
        file_path: '/uploads/stored_test.jpg',
        thumbnails: {},
        optimization: {
          applied: true,
          original_size: 1024,
          optimized_size: 800,
          compression_ratio: 0.78
        },
        metadata: {
          width: 800,
          height: 600,
          format: 'JPEG',
          mode: 'RGB',
          file_size: 1024
        }
      });

      const mockOnUploadComplete = jest.fn();

      render(
        <ImageUpload
          entityType="product"
          entityId="prod-1"
          onUploadComplete={mockOnUploadComplete}
        />
      );

      // Add file
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const input = screen.getByRole('button', { name: /select files/i })
        .parentElement?.querySelector('input[type="file"]');

      if (input) {
        Object.defineProperty(input, 'files', {
          value: [file],
          writable: false,
        });

        fireEvent.change(input);

        await waitFor(() => {
          expect(screen.getByText('test.jpg')).toBeInTheDocument();
        });

        // Start upload
        const uploadButton = screen.getByRole('button', { name: /upload.*files/i });
        fireEvent.click(uploadButton);

        await waitFor(() => {
          expect(mockAPI.uploadImage).toHaveBeenCalled();
          expect(mockOnUploadComplete).toHaveBeenCalled();
        });
      }
    });
  });

  describe('CategoryImageManager', () => {
    test('renders category image manager', async () => {
      render(
        <CategoryImageManager
          categoryId="cat-1"
          categoryName="Test Category"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Category Images')).toBeInTheDocument();
      });

      expect(screen.getByText('Images (1)')).toBeInTheDocument();
      expect(screen.getByText('Icon Presets')).toBeInTheDocument();
    });

    test('switches between images and icons tabs', async () => {
      render(
        <CategoryImageManager
          categoryId="cat-1"
          categoryName="Test Category"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Category Images')).toBeInTheDocument();
      });

      // Switch to icons tab
      const iconsTab = screen.getByText('Icon Presets');
      fireEvent.click(iconsTab);

      expect(screen.getByText('Jewelry Icons')).toBeInTheDocument();
      expect(screen.getByText('Business Icons')).toBeInTheDocument();
    });

    test('displays primary image in header', async () => {
      render(
        <CategoryImageManager
          categoryId="cat-1"
          categoryName="Test Category"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Category Images')).toBeInTheDocument();
      });

      // Should show primary image thumbnail
      const images = screen.getAllByRole('img');
      expect(images.length).toBeGreaterThan(0);
    });

    test('handles empty state', async () => {
      mockAPI.getEntityImages.mockResolvedValue([]);

      render(
        <CategoryImageManager
          categoryId="cat-1"
          categoryName="Empty Category"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Empty Category Images')).toBeInTheDocument();
      });

      expect(screen.getByText('No images uploaded')).toBeInTheDocument();
      expect(screen.getByText('Upload Images')).toBeInTheDocument();
      expect(screen.getByText('Choose Icon')).toBeInTheDocument();
    });

    test('shows icon presets organized by category', async () => {
      render(
        <CategoryImageManager
          categoryId="cat-1"
          categoryName="Test Category"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Category Images')).toBeInTheDocument();
      });

      // Switch to icons tab
      const iconsTab = screen.getByText('Icon Presets');
      fireEvent.click(iconsTab);

      expect(screen.getByText('Jewelry Icons')).toBeInTheDocument();
      expect(screen.getByText('Business Icons')).toBeInTheDocument();
      expect(screen.getByText('General Icons')).toBeInTheDocument();

      // Check for specific icons
      expect(screen.getByText('Ring')).toBeInTheDocument();
      expect(screen.getByText('Store')).toBeInTheDocument();
      expect(screen.getByText('Category')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('displays error message when API fails', async () => {
      mockAPI.getEntityImages.mockRejectedValue(new Error('API Error'));

      render(
        <ImageGallery
          entityType="product"
          entityId="prod-1"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('API Error')).toBeInTheDocument();
      });

      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    test('handles upload errors gracefully', async () => {
      mockAPI.uploadImage.mockRejectedValue(new Error('Upload failed'));

      render(
        <ImageUpload
          entityType="product"
          entityId="prod-1"
          onUploadComplete={jest.fn()}
          onUploadError={jest.fn()}
        />
      );

      // Add and upload file
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const input = screen.getByRole('button', { name: /select files/i })
        .parentElement?.querySelector('input[type="file"]');

      if (input) {
        Object.defineProperty(input, 'files', {
          value: [file],
          writable: false,
        });

        fireEvent.change(input);

        await waitFor(() => {
          expect(screen.getByText('test.jpg')).toBeInTheDocument();
        });

        const uploadButton = screen.getByRole('button', { name: /upload.*files/i });
        fireEvent.click(uploadButton);

        await waitFor(() => {
          expect(screen.getByText('Upload failed')).toBeInTheDocument();
        });
      }
    });
  });

  describe('Accessibility', () => {
    test('provides proper ARIA labels and roles', async () => {
      render(
        <ImageGallery
          entityType="product"
          entityId="prod-1"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Images')).toBeInTheDocument();
      });

      // Check for proper roles and labels
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);

      const images = screen.getAllByRole('img');
      images.forEach(img => {
        expect(img).toHaveAttribute('alt');
      });
    });

    test('supports keyboard navigation', () => {
      render(
        <ImageViewer
          image={mockImage}
          onClose={jest.fn()}
        />
      );

      // Test that keyboard events don't throw errors
      fireEvent.keyDown(document, { key: 'Escape' });
      fireEvent.keyDown(document, { key: 'ArrowLeft' });
      fireEvent.keyDown(document, { key: 'ArrowRight' });

      expect(screen.getByText('Test image')).toBeInTheDocument();
    });
  });
});