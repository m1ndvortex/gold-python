/**
 * Category Button Fix Verification Test
 * Tests that the "Create Category" button is properly enabled and functional
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CategoryForm } from '../components/inventory/CategoryForm';
import { LanguageContext, useLanguageProvider } from '../hooks/useLanguage';

// Mock the API services
jest.mock('../services/universalInventoryApi', () => ({
  universalCategoriesApi: {
    createCategory: jest.fn().mockResolvedValue({ id: '1', name: 'Test Category' }),
    updateCategory: jest.fn().mockResolvedValue({ id: '1', name: 'Updated Category' }),
  },
}));

// Test Language Provider
const TestLanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const languageValue = useLanguageProvider();
  return (
    <LanguageContext.Provider value={languageValue}>
      {children}
    </LanguageContext.Provider>
  );
};

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TestLanguageProvider>
          {children}
        </TestLanguageProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Category Button Fix Verification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Create Category button should be enabled when category name is provided', async () => {
    const user = userEvent.setup();
    const mockOnSubmit = jest.fn().mockResolvedValue(undefined);
    const mockOnClose = jest.fn();

    render(
      <TestWrapper>
        <CategoryForm
          parentCategories={[]}
          templates={[]}
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      </TestWrapper>
    );

    // Initially, the button should be disabled (no name provided)
    const createButton = screen.getByRole('button', { name: /create category/i });
    expect(createButton).toBeDisabled();

    // Fill in the category name
    const nameInput = screen.getByLabelText(/category name/i);
    await user.type(nameInput, 'Test Category');

    // Now the button should be enabled
    await waitFor(() => {
      expect(createButton).not.toBeDisabled();
    });
  });

  test('Create Category button should be disabled when loading', async () => {
    const mockOnSubmit = jest.fn().mockResolvedValue(undefined);
    const mockOnClose = jest.fn();

    render(
      <TestWrapper>
        <CategoryForm
          parentCategories={[]}
          templates={[]}
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isLoading={true}
        />
      </TestWrapper>
    );

    const createButton = screen.getByRole('button', { name: /saving/i });
    expect(createButton).toBeDisabled();
  });

  test('Create Category button should submit form when clicked', async () => {
    const user = userEvent.setup();
    const mockOnSubmit = jest.fn().mockResolvedValue(undefined);
    const mockOnClose = jest.fn();

    render(
      <TestWrapper>
        <CategoryForm
          parentCategories={[]}
          templates={[]}
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      </TestWrapper>
    );

    // Fill in the category name
    const nameInput = screen.getByLabelText(/category name/i);
    await user.type(nameInput, 'Test Category');

    // Click the create button
    const createButton = screen.getByRole('button', { name: /create category/i });
    await waitFor(() => {
      expect(createButton).not.toBeDisabled();
    });
    
    fireEvent.click(createButton);

    // Verify the form was submitted
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Category',
          is_active: true,
        })
      );
    });
  });

  test('Update Category button should work for editing existing category', async () => {
    const user = userEvent.setup();
    const mockOnSubmit = jest.fn().mockResolvedValue(undefined);
    const mockOnClose = jest.fn();
    
    const existingCategory = {
      id: '1',
      name: 'Existing Category',
      description: 'Test description',
      parent_id: null,
      icon: '💍',
      color: '#f59e0b',
      attributes: [],
      category_metadata: {},
      sort_order: 0,
      is_active: true,
    };

    render(
      <TestWrapper>
        <CategoryForm
          category={existingCategory}
          parentCategories={[]}
          templates={[]}
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      </TestWrapper>
    );

    // The button should show "Update Category" and be enabled
    const updateButton = screen.getByRole('button', { name: /update category/i });
    expect(updateButton).not.toBeDisabled();

    // Modify the category name
    const nameInput = screen.getByDisplayValue('Existing Category');
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Category');

    // Click the update button
    fireEvent.click(updateButton);

    // Verify the form was submitted
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Updated Category',
          is_active: true,
        })
      );
    });
  });

  test('Form should handle all field types correctly', async () => {
    const user = userEvent.setup();
    const mockOnSubmit = jest.fn().mockResolvedValue(undefined);
    const mockOnClose = jest.fn();

    render(
      <TestWrapper>
        <CategoryForm
          parentCategories={[
            { id: '1', name: 'Parent Category', parent_id: null }
          ]}
          templates={[]}
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          isLoading={false}
        />
      </TestWrapper>
    );

    // Fill in all fields
    const nameInput = screen.getByLabelText(/category name/i);
    await user.type(nameInput, 'Complete Category');

    const descriptionInput = screen.getByLabelText(/description/i);
    await user.type(descriptionInput, 'A complete test category');

    // Select parent category
    const parentSelect = screen.getByRole('combobox');
    fireEvent.click(parentSelect);
    const parentOption = await screen.findByText('Parent Category');
    fireEvent.click(parentOption);

    // Submit the form
    const createButton = screen.getByRole('button', { name: /create category/i });
    await waitFor(() => {
      expect(createButton).not.toBeDisabled();
    });
    
    fireEvent.click(createButton);

    // Verify all data was submitted
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Complete Category',
          description: 'A complete test category',
          parent_id: '1',
          is_active: true,
        })
      );
    });
  });
});