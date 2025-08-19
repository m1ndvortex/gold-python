import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ImageGalleryManager } from '../ImageGalleryManager';
import { useUploadInventoryImage } from '../../../hooks/useInventory';

// Mock the hooks
jest.mock('../../../hooks/useInventory');

const mockUseUploadInventoryImage = useUploadInventoryImage as jest.MockedFunction<typeof useUploadInventoryImage>;

const mockImages = [
  {
    id: '1',
    url: 'https://example.com/image1.jpg',
    alt_text: 'Product image 1',
    is_primary: true,
    sort_order: 0,
    file_size: 1024000,
    dimensions: { width: 800, height: 600 },
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    url: 'https://example.com/image2.jpg',
    alt_text: 'Product image 2',
    is_primary: false,
    sort_order: 1,
    file_size: 2048000,
    dimensions: { width: 1200, height: 900 },
    created_at: '2024-01-01T00:00:00Z'
  }
];

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mocked-url');
global.URL.revokeObjectURL = jest.fn();

describe('ImageGalleryManager', () => {
  const mockOnImagesChange = jest.fn();
  const mockMutateAsync = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseUploadInventoryImage.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    } as any);

    mockMutateAsync.mockResolvedValue({
      image_url: 'https://example.com/uploaded.jpg'
    });
  });

  it('renders empty state correctly', () => {
    render(
      <ImageGalleryManager
        images={[]}
        onImagesChange={mockOnImagesChange}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Product Images')).toBeInTheDocument();
    expect(screen.getByText('0 / 10')).toBeInTheDocument();
    expect(screen.getByText('No images uploaded')).toBeInTheDocument();
    expect(screen.getByText('Upload product images to showcase your item')).toBeInTheDocument();
  });

  it('renders images in grid view', () => {
    render(
      <ImageGalleryManager
        images={mockImages}
        onImagesChange={mockOnImagesChange}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('2 / 10')).toBeInTheDocument();
    expect(screen.getByAltText('Product image 1')).toBeInTheDocument();
    expect(screen.getByAltText('Product image 2')).toBeInTheDocument();
    expect(screen.getByText('Primary')).toBeInTheDocument();
  });

  it('switches between grid and list view', async () => {
    const user = userEvent.setup();
    
    render(
      <ImageGalleryManager
        images={mockImages}
        onImagesChange={mockOnImagesChange}
      />,
      { wrapper: createWrapper() }
    );

    // Switch to list view
    const listViewButton = screen.getByRole('button', { name: /list/i });
    await user.click(listViewButton);

    // Check if list view is active
    expect(screen.getByText('Product Image 1')).toBeInTheDocument();
    expect(screen.getByText('800 × 600 • 1.00 MB')).toBeInTheDocument();
  });

  it('handles file upload via input', async () => {
    const user = userEvent.setup();
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    render(
      <ImageGalleryManager
        images={[]}
        onImagesChange={mockOnImagesChange}
      />,
      { wrapper: createWrapper() }
    );

    const fileInput = screen.getByRole('button', { name: /add images/i });
    await user.click(fileInput);

    // Simulate file selection
    const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(hiddenInput, 'files', {
      value: [mockFile],
      writable: false,
    });

    fireEvent.change(hiddenInput);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(mockFile);
    });
  });

  it('handles drag and drop upload', async () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    render(
      <ImageGalleryManager
        images={[]}
        onImagesChange={mockOnImagesChange}
      />,
      { wrapper: createWrapper() }
    );

    const dropZone = screen.getByText(/drag and drop images here/i).closest('div');
    
    // Simulate drag and drop
    const dropEvent = new Event('drop', { bubbles: true });
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: {
        files: [mockFile]
      }
    });

    fireEvent(dropZone!, dropEvent);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(mockFile);
    });
  });

  it('validates file types', async () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation();
    const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' });
    
    render(
      <ImageGalleryManager
        images={[]}
        onImagesChange={mockOnImagesChange}
        acceptedFormats={['image/jpeg', 'image/png']}
      />,
      { wrapper: createWrapper() }
    );

    const dropZone = screen.getByText(/drag and drop images here/i).closest('div');
    
    const dropEvent = new Event('drop', { bubbles: true });
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: {
        files: [mockFile]
      }
    });

    fireEvent(dropZone!, dropEvent);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Invalid file format: test.txt');
    });

    alertSpy.mockRestore();
  });

  it('validates file size', async () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation();
    const mockFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
    
    render(
      <ImageGalleryManager
        images={[]}
        onImagesChange={mockOnImagesChange}
        maxFileSize={5}
      />,
      { wrapper: createWrapper() }
    );

    const dropZone = screen.getByText(/drag and drop images here/i).closest('div');
    
    const dropEvent = new Event('drop', { bubbles: true });
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: {
        files: [mockFile]
      }
    });

    fireEvent(dropZone!, dropEvent);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('File too large: large.jpg (max 5MB)');
    });

    alertSpy.mockRestore();
  });

  it('enforces maximum image limit', async () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation();
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    render(
      <ImageGalleryManager
        images={mockImages}
        onImagesChange={mockOnImagesChange}
        maxImages={2}
      />,
      { wrapper: createWrapper() }
    );

    const dropZone = screen.getByText(/drag and drop images here/i).closest('div');
    
    const dropEvent = new Event('drop', { bubbles: true });
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: {
        files: [mockFile]
      }
    });

    fireEvent(dropZone!, dropEvent);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Maximum 2 images allowed');
    });

    alertSpy.mockRestore();
  });

  it('handles setting primary image', async () => {
    const user = userEvent.setup();
    
    render(
      <ImageGalleryManager
        images={mockImages}
        onImagesChange={mockOnImagesChange}
      />,
      { wrapper: createWrapper() }
    );

    // Click on the second image's dropdown menu
    const dropdownTriggers = screen.getAllByRole('button');
    const secondImageDropdown = dropdownTriggers.find(button => 
      button.closest('[data-testid="image-card-2"]') !== null
    );
    
    if (secondImageDropdown) {
      await user.click(secondImageDropdown);
      
      const setPrimaryButton = screen.getByText('Set as Primary');
      await user.click(setPrimaryButton);

      expect(mockOnImagesChange).toHaveBeenCalledWith([
        { ...mockImages[0], is_primary: false },
        { ...mockImages[1], is_primary: true }
      ]);
    }
  });

  it('handles image deletion', async () => {
    const user = userEvent.setup();
    
    render(
      <ImageGalleryManager
        images={mockImages}
        onImagesChange={mockOnImagesChange}
      />,
      { wrapper: createWrapper() }
    );

    // Click on the first image's dropdown menu
    const dropdownTriggers = screen.getAllByRole('button');
    const firstImageDropdown = dropdownTriggers[0];
    await user.click(firstImageDropdown);
    
    const deleteButton = screen.getByText('Delete');
    await user.click(deleteButton);

    // Confirm deletion
    const confirmButton = screen.getByText('Delete', { selector: 'button' });
    await user.click(confirmButton);

    expect(mockOnImagesChange).toHaveBeenCalledWith([
      { ...mockImages[1], is_primary: true } // Second image becomes primary
    ]);
  });

  it('handles image editing', async () => {
    const user = userEvent.setup();
    
    render(
      <ImageGalleryManager
        images={mockImages}
        onImagesChange={mockOnImagesChange}
      />,
      { wrapper: createWrapper() }
    );

    // Click on the first image's dropdown menu
    const dropdownTriggers = screen.getAllByRole('button');
    const firstImageDropdown = dropdownTriggers[0];
    await user.click(firstImageDropdown);
    
    const editButton = screen.getByText('Edit Details');
    await user.click(editButton);

    // Edit dialog should open
    expect(screen.getByText('Edit Image')).toBeInTheDocument();
    
    // Update alt text
    const altTextInput = screen.getByLabelText(/alt text/i);
    await user.clear(altTextInput);
    await user.type(altTextInput, 'Updated alt text');

    // Save changes
    const saveButton = screen.getByText('Save Changes');
    await user.click(saveButton);

    expect(mockOnImagesChange).toHaveBeenCalledWith([
      { ...mockImages[0], alt_text: 'Updated alt text' },
      mockImages[1]
    ]);
  });

  it('handles image reordering via drag and drop', async () => {
    render(
      <ImageGalleryManager
        images={mockImages}
        onImagesChange={mockOnImagesChange}
      />,
      { wrapper: createWrapper() }
    );

    const firstImage = screen.getByAltText('Product image 1').closest('[draggable="true"]');
    const secondImage = screen.getByAltText('Product image 2').closest('[draggable="true"]');

    // Simulate drag and drop
    fireEvent.dragStart(firstImage!);
    fireEvent.dragOver(secondImage!);
    fireEvent.drop(secondImage!);

    expect(mockOnImagesChange).toHaveBeenCalledWith([
      { ...mockImages[1], sort_order: 0 },
      { ...mockImages[0], sort_order: 1 }
    ]);
  });

  it('opens full size image dialog', async () => {
    const user = userEvent.setup();
    
    render(
      <ImageGalleryManager
        images={mockImages}
        onImagesChange={mockOnImagesChange}
      />,
      { wrapper: createWrapper() }
    );

    // Click on image to view full size
    const firstImage = screen.getByAltText('Product image 1');
    await user.click(firstImage);

    expect(screen.getByText('Product image 1')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('handles upload errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation();
    mockMutateAsync.mockRejectedValue(new Error('Upload failed'));
    
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    render(
      <ImageGalleryManager
        images={[]}
        onImagesChange={mockOnImagesChange}
      />,
      { wrapper: createWrapper() }
    );

    const dropZone = screen.getByText(/drag and drop images here/i).closest('div');
    
    const dropEvent = new Event('drop', { bubbles: true });
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: {
        files: [mockFile]
      }
    });

    fireEvent(dropZone!, dropEvent);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to upload images:', expect.any(Error));
      expect(alertSpy).toHaveBeenCalledWith('Upload failed');
    });

    consoleSpy.mockRestore();
    alertSpy.mockRestore();
  });

  it('shows loading state during upload', async () => {
    mockUseUploadInventoryImage.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: true,
    } as any);

    render(
      <ImageGalleryManager
        images={[]}
        onImagesChange={mockOnImagesChange}
      />,
      { wrapper: createWrapper() }
    );

    const addButton = screen.getByText('Uploading...');
    expect(addButton).toBeDisabled();
  });

  it('displays image dimensions and file size', () => {
    render(
      <ImageGalleryManager
        images={mockImages}
        onImagesChange={mockOnImagesChange}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('800 × 600')).toBeInTheDocument();
    expect(screen.getByText('1.00 MB')).toBeInTheDocument();
    expect(screen.getByText('1200 × 900')).toBeInTheDocument();
    expect(screen.getByText('2.00 MB')).toBeInTheDocument();
  });
});