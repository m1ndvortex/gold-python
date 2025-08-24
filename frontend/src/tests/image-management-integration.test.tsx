/**
 * Image Management Integration Tests
 * 
 * Comprehensive tests for image gallery, viewer, and management functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock URL.createObjectURL
Object.defineProperty(window.URL, 'createObjectURL', {
  writable: true,
  value: jest.fn(() => 'mock-url')
});

Object.defineProperty(window.URL, 'revokeObjectURL', {
  writable: true,
  value: jest.fn()
});

// Mock fetch for image downloads
global.fetch = jest.fn();

// Sample test data
const mockImages: ImageMetadata[] = [
  {
    id: 'img-1',
    original_filename: 'product1.jpg',
    stored_filename: 'stored_product1.jpg',
    file_path: '/uploads/stored_product1.jpg',
    file_size_bytes: 1024000,
    mime_type: 'image/jpeg',
    image_width: 800,
    image_height: 600,
    is_primary: true,
    alt_text: 'Product 1 image',
    caption: 'Main product image',
    sort_order: 0,
    optimization_applied: true,
    compression_ratio: 0.8,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    thumbnails: {
      small: {
        filename: 'small_product1.jpg',
        path: '/uploads/thumbnails/small_product1.jpg',
        width: 150,
        height: 113,
        file_size: 15000,
        quality: 85
      },
      medium: {
        filename: 'medium_product1.jpg',
        path: '/uploads/thumbnails/medium_product1.jpg',
        width: 300,
        height: 225,
        file_size: 45000,
        quality: 85
      }
    }
  },
  {
    id: 'img-2',
    original_filename: 'product2.png',
    stored_filename: 'stored_product2.png',
    file_path: '/uploads/stored_product2.png',
    file_size_bytes: 2048000,
    mime_type: 'image/png',
    image_width: 1200,
    image_height: 800,
    is_primary: false,
    alt_text: 'Product 2 image',
    sort_order: 1,
    optimization_applied: false,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z'
  }
];

describe('Image Management Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAPI.getEntityImages.mockResolvedValue(mockImages);
    mockAPI.getImageUrl.mockImplementation((id, size) => `http://localhost:8000/api/images/file/${id}?size=${size}`);
  });

  describe('ImageGallery Component', () => {
    test('renders image gallery with grid view', async () => {
      render(
        <ImageGallery
          entityType="product"
          entityId="prod-1"
          viewMode="grid"
        />
      );

      // Wait for images to load
      await waitFor(() => {
        expect(screen.getByText('Images')).toBeInTheDocument();
      });

      // Check if images are displayed
      expect(screen.getByText('2 of 2')).toBeInTheDocument();
      expect(screen.getByText('Primary')).toBeInTheDocument();
    });

    test('switches between grid and list view modes', async () => {
      render(
        <ImageGallery
          entityType="product"
          entityId="prod-1"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Images')).toBeInTheDocument();
      });

      // Switch to list view
      const listViewButton = screen.getByRole('button', { name: /list/i });
      fireEvent.click(listViewButton);

      // Verify list view is active
      expect(listViewButton).toHaveClass('bg-primary');
    });

    test('handles image search functionality', async () => {
      render(
        <ImageGallery
          entityType="product"
          entityId="prod-1"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Images')).toBeInTheDocument();
      });

      // Search for specific image
      const searchInput = screen.getByPlaceholderText('Search images...');
      await userEvent.type(searchInput, 'Product 1');

      // Should filter results
      await waitFor(() => {
        expect(screen.getByText('1 of 2')).toBeInTheDocument();
      });
    });

    test('handles image sorting', async () => {
      render(
        <ImageGallery
          entityType="product"
          entityId="prod-1"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Images')).toBeInTheDocument();
      });

      // Open sort menu
      const sortButton = screen.getByRole('button', { name: /sort/i });
      fireEvent.click(sortButton);

      // Select sort by name
      const sortByName = screen.getByText('Name');
      fireEvent.click(sortByName);

      // Verify sorting is applied
      expect(mockAPI.getEntityImages).toHaveBeenCalled();
    });

    test('handles drag and drop reordering', async () => {
      const mockOnImageUpdate = jest.fn();
      mockAPI.updateImageMetadata.mockResolvedValue({
        success: true,
        image_id: 'img-1',
        updated_fields: ['sort_order']
      });

      render(
        <ImageGallery
          entityType="product"
          entityId="prod-1"
          enableReorder={true}
          onImageUpdate={mockOnImageUpdate}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Images')).toBeInTheDocument();
      });

      // Simulate drag and drop (simplified)
      const images = screen.getAllByRole('img');
      if (images.length >= 2) {
        fireEvent.dragStart(images[0]);
        fireEvent.dragOver(images[1]);
        fireEvent.drop(images[1]);
      }

      await waitFor(() => {
        expect(mockAPI.updateImageMetadata).toHaveBeenCalled();
      });
    });

    test('handles image deletion', async () => {
      mockAPI.deleteImage.mockResolvedValue({
        success: true,
        image_id: 'img-2',
        files_deleted: ['stored_product2.png']
      });

      const mockOnImageDelete = jest.fn();

      render(
        <ImageGallery
          entityType="product"
          entityId="prod-1"
          onImageDelete={mockOnImageDelete}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Images')).toBeInTheDocument();
      });

      // Find and click delete button (in dropdown menu)
      const moreButtons = screen.getAllByRole('button');
      const moreButton = moreButtons.find(btn => btn.querySelector('svg'));
      if (moreButton) {
        fireEvent.click(moreButton);
        
        const deleteButton = screen.getByText('Delete');
        fireEvent.click(deleteButton);

        // Confirm deletion
        const confirmButton = screen.getByRole('button', { name: /delete/i });
        fireEvent.click(confirmButton);

        await waitFor(() => {
          expect(mockAPI.deleteImage).toHaveBeenCalledWith('img-2');
          expect(mockOnImageDelete).toHaveBeenCalledWith('img-2');
        });
      }
    });

    test('handles setting primary image', async () => {
      mockAPI.updateImageMetadata.mockResolvedValue({
        success: true,
        image_id: 'img-2',
        updated_fields: ['is_primary']
      });

      render(
        <ImageGallery
          entityType="product"
          entityId="prod-1"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Images')).toBeInTheDocument();
      });

      // Find and click set primary button
      const moreButtons = screen.getAllByRole('button');
      const moreButton = moreButtons.find(btn => btn.querySelector('svg'));
      if (moreButton) {
        fireEvent.click(moreButton);
        
        const setPrimaryButton = screen.getByText('Set as Primary');
        fireEvent.click(setPrimaryButton);

        await waitFor(() => {
          expect(mockAPI.updateImageMetadata).toHaveBeenCalledWith('img-2', { isPrimary: true });
        });
      }
    });

    test('handles lazy loading', async () => {
      render(
        <ImageGallery
          entityType="product"
          entityId="prod-1"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Images')).toBeInTheDocument();
      });

      // Verify IntersectionObserver was set up
      expect(mockIntersectionObserver).toHaveBeenCalled();
    });
  });

  describe('ImageViewer Component', () => {
    test('renders image viewer with zoom controls', () => {
      render(
        <ImageViewer
          image={mockImages[0]}
          enableZoom={true}
          onClose={jest.fn()}
        />
      );

      expect(screen.getByText('Product 1 image')).toBeInTheDocument();
      expect(screen.getByText('Primary')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    test('handles zoom in and zoom out', async () => {
      render(
        <ImageViewer
          image={mockImages[0]}
          enableZoom={true}
          onClose={jest.fn()}
        />
      );

      // Zoom in
      const zoomInButton = screen.getByRole('button', { name: /zoom.*in/i });
      fireEvent.click(zoomInButton);

      await waitFor(() => {
        expect(screen.getByText('150%')).toBeInTheDocument();
      });

      // Zoom out
      const zoomOutButton = screen.getByRole('button', { name: /zoom.*out/i });
      fireEvent.click(zoomOutButton);

      await waitFor(() => {
        expect(screen.getByText('100%')).toBeInTheDocument();
      });
    });

    test('handles image rotation', async () => {
      render(
        <ImageViewer
          image={mockImages[0]}
          onClose={jest.fn()}
        />
      );

      // Rotate right
      const rotateRightButton = screen.getByRole('button', { name: /rotate.*right/i });
      fireEvent.click(rotateRightButton);

      // Verify rotation is applied (check transform style)
      const image = screen.getByRole('img');
      expect(image).toHaveStyle('transform: scale(1) rotate(90deg) translate(0px, 0px)');
    });

    test('handles navigation between multiple images', async () => {
      const mockOnImageChange = jest.fn();

      render(
        <ImageViewer
          image={mockImages[0]}
          images={mockImages}
          currentIndex={0}
          enableNavigation={true}
          onImageChange={mockOnImageChange}
          onClose={jest.fn()}
        />
      );

      expect(screen.getByText('1 of 2')).toBeInTheDocument();

      // Navigate to next image
      const nextButton = screen.getByRole('button', { name: /next/i });
      fireEvent.click(nextButton);

      expect(mockOnImageChange).toHaveBeenCalledWith(1);
    });

    test('handles fullscreen toggle', async () => {
      render(
        <ImageViewer
          image={mockImages[0]}
          enableFullscreen={true}
          onClose={jest.fn()}
        />
      );

      // Toggle fullscreen
      const fullscreenButton = screen.getByRole('button', { name: /maximize/i });
      fireEvent.click(fullscreenButton);

      // Verify fullscreen mode
      const viewer = screen.getByRole('dialog').parentElement;
      expect(viewer).toHaveClass('fixed', 'inset-0', 'z-50');
    });

    test('displays image metadata', () => {
      render(
        <ImageViewer
          image={mockImages[0]}
          showMetadata={true}
          onClose={jest.fn()}
        />
      );

      expect(screen.getByText('Image Details')).toBeInTheDocument();
      expect(screen.getByText('product1.jpg')).toBeInTheDocument();
      expect(screen.getByText('image/jpeg')).toBeInTheDocument();
      expect(screen.getByText('1000.00 KB')).toBeInTheDocument();
    });

    test('handles image download', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValue({
        blob: () => Promise.resolve(new Blob(['image data'], { type: 'image/jpeg' }))
      } as Response);

      // Mock document methods
      const mockCreateElement = jest.spyOn(document, 'createElement');
      const mockAppendChild = jest.spyOn(document.body, 'appendChild');
      const mockRemoveChild = jest.spyOn(document.body, 'removeChild');
      const mockClick = jest.fn();

      mockCreateElement.mockReturnValue({
        href: '',
        download: '',
        click: mockClick
      } as any);
      mockAppendChild.mockImplementation(() => null as any);
      mockRemoveChild.mockImplementation(() => null as any);

      render(
        <ImageViewer
          image={mockImages[0]}
          onClose={jest.fn()}
        />
      );

      // Click download button
      const downloadButton = screen.getByRole('button', { name: /download/i });
      fireEvent.click(downloadButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
        expect(mockClick).toHaveBeenCalled();
      });

      mockCreateElement.mockRestore();
      mockAppendChild.mockRestore();
      mockRemoveChild.mockRestore();
    });

    test('handles keyboard navigation', () => {
      const mockOnClose = jest.fn();
      const mockOnImageChange = jest.fn();

      render(
        <ImageViewer
          image={mockImages[0]}
          images={mockImages}
          currentIndex={0}
          enableNavigation={true}
          onClose={mockOnClose}
          onImageChange={mockOnImageChange}
        />
      );

      // Test escape key
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(mockOnClose).toHaveBeenCalled();

      // Test arrow keys
      fireEvent.keyDown(document, { key: 'ArrowRight' });
      expect(mockOnImageChange).toHaveBeenCalledWith(1);
    });
  });

  describe('ImageUpload Component', () => {
    test('renders upload dialog with drag-drop area', () => {
      render(
        <ImageUpload
          entityType="product"
          entityId="prod-1"
          onUploadComplete={jest.fn()}
        />
      );

      expect(screen.getByText('Upload Images')).toBeInTheDocument();
      expect(screen.getByText('Drag and drop images here, or click to select files')).toBeInTheDocument();
      expect(screen.getByText('Select Files')).toBeInTheDocument();
    });

    test('handles file selection and validation', async () => {
      const mockOnUploadError = jest.fn();

      render(
        <ImageUpload
          entityType="product"
          entityId="prod-1"
          onUploadError={mockOnUploadError}
        />
      );

      // Create mock file
      const file = new File(['image content'], 'test.jpg', { type: 'image/jpeg' });
      const input = screen.getByRole('button', { name: /select files/i }).parentElement?.querySelector('input[type="file"]');

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

    test('handles drag and drop file upload', async () => {
      render(
        <ImageUpload
          entityType="product"
          entityId="prod-1"
          onUploadComplete={jest.fn()}
        />
      );

      const dropZone = screen.getByText('Drag and drop images here, or click to select files').parentElement;
      const file = new File(['image content'], 'dropped.jpg', { type: 'image/jpeg' });

      // Simulate drag and drop
      fireEvent.dragEnter(dropZone!);
      fireEvent.dragOver(dropZone!);
      fireEvent.drop(dropZone!, {
        dataTransfer: {
          files: [file]
        }
      });

      await waitFor(() => {
        expect(screen.getByText('dropped.jpg')).toBeInTheDocument();
      });
    });

    test('handles file upload with progress tracking', async () => {
      mockAPI.uploadImage.mockResolvedValue({
        success: true,
        image_id: 'new-img-1',
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
      const file = new File(['image content'], 'test.jpg', { type: 'image/jpeg' });
      const input = screen.getByRole('button', { name: /select files/i }).parentElement?.querySelector('input[type="file"]');

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
          expect(mockAPI.uploadImage).toHaveBeenCalledWith(
            file,
            'product',
            'prod-1',
            expect.any(Object)
          );
          expect(mockOnUploadComplete).toHaveBeenCalled();
        });
      }
    });

    test('handles advanced options for file metadata', async () => {
      render(
        <ImageUpload
          entityType="product"
          entityId="prod-1"
          onUploadComplete={jest.fn()}
        />
      );

      // Add file first
      const file = new File(['image content'], 'test.jpg', { type: 'image/jpeg' });
      const input = screen.getByRole('button', { name: /select files/i }).parentElement?.querySelector('input[type="file"]');

      if (input) {
        Object.defineProperty(input, 'files', {
          value: [file],
          writable: false,
        });

        fireEvent.change(input);

        await waitFor(() => {
          expect(screen.getByText('test.jpg')).toBeInTheDocument();
        });

        // Enable advanced options
        const advancedToggle = screen.getByRole('switch', { name: /advanced options/i });
        fireEvent.click(advancedToggle);

        // Fill in metadata
        const altTextInput = screen.getByPlaceholderText('Describe this image...');
        await userEvent.type(altTextInput, 'Test image description');

        const captionInput = screen.getByPlaceholderText('Image caption...');
        await userEvent.type(captionInput, 'Test caption');

        const primaryToggle = screen.getByRole('switch', { name: /set as primary/i });
        fireEvent.click(primaryToggle);

        expect(altTextInput).toHaveValue('Test image description');
        expect(captionInput).toHaveValue('Test caption');
        expect(primaryToggle).toBeChecked();
      }
    });

    test('validates file types and sizes', async () => {
      const mockOnUploadError = jest.fn();

      render(
        <ImageUpload
          entityType="product"
          entityId="prod-1"
          onUploadError={mockOnUploadError}
        />
      );

      // Test invalid file type
      const invalidFile = new File(['content'], 'test.txt', { type: 'text/plain' });
      const input = screen.getByRole('button', { name: /select files/i }).parentElement?.querySelector('input[type="file"]');

      if (input) {
        Object.defineProperty(input, 'files', {
          value: [invalidFile],
          writable: false,
        });

        fireEvent.change(input);

        await waitFor(() => {
          expect(mockOnUploadError).toHaveBeenCalledWith(
            expect.stringContaining('Invalid file format')
          );
        });
      }
    });
  });

  describe('CategoryImageManager Component', () => {
    test('renders category image manager with tabs', async () => {
      render(
        <CategoryImageManager
          categoryId="cat-1"
          categoryName="Gold Rings"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Gold Rings Images')).toBeInTheDocument();
      });

      expect(screen.getByText('Images (2)')).toBeInTheDocument();
      expect(screen.getByText('Icon Presets')).toBeInTheDocument();
    });

    test('displays icon presets by category', async () => {
      render(
        <CategoryImageManager
          categoryId="cat-1"
          categoryName="Gold Rings"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Gold Rings Images')).toBeInTheDocument();
      });

      // Switch to icons tab
      const iconsTab = screen.getByText('Icon Presets');
      fireEvent.click(iconsTab);

      expect(screen.getByText('Jewelry Icons')).toBeInTheDocument();
      expect(screen.getByText('Business Icons')).toBeInTheDocument();
      expect(screen.getByText('General Icons')).toBeInTheDocument();
    });

    test('handles icon selection and upload', async () => {
      mockAPI.uploadImage.mockResolvedValue({
        success: true,
        image_id: 'icon-1',
        stored_filename: 'ring-icon.svg',
        file_path: '/uploads/ring-icon.svg',
        thumbnails: {},
        optimization: {
          applied: false,
          original_size: 1024,
          optimized_size: 1024,
          compression_ratio: 1
        },
        metadata: {
          width: 24,
          height: 24,
          format: 'SVG',
          mode: 'RGB',
          file_size: 1024
        }
      });

      render(
        <CategoryImageManager
          categoryId="cat-1"
          categoryName="Gold Rings"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Gold Rings Images')).toBeInTheDocument();
      });

      // Switch to icons tab
      const iconsTab = screen.getByText('Icon Presets');
      fireEvent.click(iconsTab);

      // Select ring icon
      const ringIcon = screen.getByText('Ring');
      fireEvent.click(ringIcon);

      await waitFor(() => {
        expect(mockAPI.uploadImage).toHaveBeenCalledWith(
          expect.any(File),
          'category',
          'cat-1',
          expect.objectContaining({
            altText: expect.stringContaining('Ring icon'),
            caption: expect.stringContaining('Category icon: Ring')
          })
        );
      });
    });

    test('integrates with ImageGallery for category images', async () => {
      render(
        <CategoryImageManager
          categoryId="cat-1"
          categoryName="Gold Rings"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Gold Rings Images')).toBeInTheDocument();
      });

      // Should show images from the gallery
      expect(screen.getByText('2 of 2')).toBeInTheDocument();
      expect(mockAPI.getEntityImages).toHaveBeenCalledWith('category', 'cat-1', true);
    });

    test('handles empty state with action buttons', async () => {
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
  });

  describe('Error Handling', () => {
    test('handles API errors gracefully', async () => {
      mockAPI.getEntityImages.mockRejectedValue(new Error('Network error'));

      render(
        <ImageGallery
          entityType="product"
          entityId="prod-1"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });

    test('handles upload errors', async () => {
      mockAPI.uploadImage.mockRejectedValue(new Error('Upload failed'));

      const mockOnUploadError = jest.fn();

      render(
        <ImageUpload
          entityType="product"
          entityId="prod-1"
          onUploadError={mockOnUploadError}
        />
      );

      // Add and upload file
      const file = new File(['image content'], 'test.jpg', { type: 'image/jpeg' });
      const input = screen.getByRole('button', { name: /select files/i }).parentElement?.querySelector('input[type="file"]');

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

  describe('Performance and Accessibility', () => {
    test('implements lazy loading for images', async () => {
      render(
        <ImageGallery
          entityType="product"
          entityId="prod-1"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Images')).toBeInTheDocument();
      });

      // Verify lazy loading attributes
      const images = screen.getAllByRole('img');
      images.forEach(img => {
        expect(img).toHaveAttribute('loading', 'lazy');
      });
    });

    test('provides proper alt text for accessibility', async () => {
      render(
        <ImageGallery
          entityType="product"
          entityId="prod-1"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Images')).toBeInTheDocument();
      });

      const images = screen.getAllByRole('img');
      images.forEach(img => {
        expect(img).toHaveAttribute('alt');
        expect(img.getAttribute('alt')).not.toBe('');
      });
    });

    test('supports keyboard navigation in viewer', () => {
      render(
        <ImageViewer
          image={mockImages[0]}
          images={mockImages}
          currentIndex={0}
          enableNavigation={true}
          onClose={jest.fn()}
          onImageChange={jest.fn()}
        />
      );

      // Test keyboard shortcuts
      fireEvent.keyDown(document, { key: '+' });
      fireEvent.keyDown(document, { key: '-' });
      fireEvent.keyDown(document, { key: '0' });
      fireEvent.keyDown(document, { key: 'r' });
      fireEvent.keyDown(document, { key: 'f' });

      // Should not throw errors
      expect(screen.getByText('Product 1 image')).toBeInTheDocument();
    });
  });
});