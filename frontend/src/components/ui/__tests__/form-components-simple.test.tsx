import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../input';
import { SearchableSelect } from '../searchable-select';
import { FileUpload } from '../file-upload';
import { Mail, User } from 'lucide-react';

describe('Enhanced Form Components - Core Functionality', () => {
  describe('Input Component', () => {
    it('renders basic input correctly', () => {
      render(<Input placeholder="Enter text" />);
      const input = screen.getByPlaceholderText('Enter text');
      
      expect(input).toBeInTheDocument();
      expect(input).toHaveClass('flex', 'w-full', 'rounded-md');
    });

    it('renders with label', () => {
      render(<Input label="Email" placeholder="Enter email" />);
      
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument();
    });

    it('handles value changes', async () => {
      const handleChange = jest.fn();
      render(<Input onChange={handleChange} />);
      
      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'test');
      
      expect(handleChange).toHaveBeenCalled();
    });

    it('renders floating label correctly', () => {
      render(<Input floating label="Username" />);
      
      const label = screen.getByText('Username');
      expect(label).toHaveClass('absolute', 'left-3', 'transition-all');
    });

    it('renders error state correctly', () => {
      render(<Input error="This field is required" />);
      
      const input = screen.getByRole('textbox');
      const errorMessage = screen.getByText('This field is required');
      
      expect(input).toHaveClass('border-error-500');
      expect(errorMessage).toHaveClass('text-error-600');
    });

    it('renders success state correctly', () => {
      render(<Input success="Valid input" />);
      
      const input = screen.getByRole('textbox');
      const successMessage = screen.getByText('Valid input');
      
      expect(input).toHaveClass('border-success-500');
      expect(successMessage).toHaveClass('text-success-600');
    });

    it('renders with left icon', () => {
      render(<Input leftIcon={<User data-testid="user-icon" />} />);
      
      expect(screen.getByTestId('user-icon')).toBeInTheDocument();
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('pl-10');
    });

    it('shows password toggle for password input', () => {
      render(<Input type="password" showPasswordToggle />);
      
      const toggleButton = screen.getByRole('button');
      expect(toggleButton).toBeInTheDocument();
    });

    it('toggles password visibility', async () => {
      render(<Input type="password" showPasswordToggle />);
      
      // Password inputs don't have textbox role, so we need to query by type
      const input = document.querySelector('input[type="password"]') as HTMLInputElement;
      const toggleButton = screen.getByRole('button');
      
      expect(input).toBeInTheDocument();
      expect(input.type).toBe('password');
      
      await userEvent.click(toggleButton);
      expect(input.type).toBe('text');
      
      await userEvent.click(toggleButton);
      expect(input.type).toBe('password');
    });

    it('renders different sizes correctly', () => {
      const { rerender } = render(<Input size="sm" />);
      let input = screen.getByRole('textbox');
      expect(input).toHaveClass('h-8', 'px-2', 'py-1', 'text-xs');

      rerender(<Input size="lg" />);
      input = screen.getByRole('textbox');
      expect(input).toHaveClass('h-12', 'px-4', 'py-3', 'text-base');
    });
  });

  describe('SearchableSelect Component', () => {
    const mockOptions = [
      { value: '1', label: 'Option 1', description: 'First option' },
      { value: '2', label: 'Option 2', description: 'Second option' },
      { value: '3', label: 'Option 3', disabled: true },
    ];

    it('renders with placeholder', () => {
      render(<SearchableSelect options={mockOptions} placeholder="Choose option" />);
      
      expect(screen.getByText('Choose option')).toBeInTheDocument();
    });

    it('opens dropdown on click', async () => {
      render(<SearchableSelect options={mockOptions} />);
      
      const trigger = screen.getByText('Select an option...');
      await userEvent.click(trigger);
      
      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
      expect(screen.getByText('Option 3')).toBeInTheDocument();
    });

    it('selects option on click', async () => {
      const handleChange = jest.fn();
      render(<SearchableSelect options={mockOptions} onValueChange={handleChange} />);
      
      const trigger = screen.getByText('Select an option...');
      await userEvent.click(trigger);
      
      const option1 = screen.getByText('Option 1');
      await userEvent.click(option1);
      
      expect(handleChange).toHaveBeenCalledWith('1');
    });

    it('filters options based on search term', async () => {
      render(<SearchableSelect options={mockOptions} searchable />);
      
      const trigger = screen.getByText('Select an option...');
      await userEvent.click(trigger);
      
      const searchInput = screen.getByPlaceholderText('Search options...');
      await userEvent.type(searchInput, 'Option 1');
      
      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.queryByText('Option 2')).not.toBeInTheDocument();
    });

    it('shows empty message when no options match', async () => {
      render(<SearchableSelect options={mockOptions} searchable emptyMessage="No matches" />);
      
      const trigger = screen.getByText('Select an option...');
      await userEvent.click(trigger);
      
      const searchInput = screen.getByPlaceholderText('Search options...');
      await userEvent.type(searchInput, 'nonexistent');
      
      expect(screen.getByText('No matches')).toBeInTheDocument();
    });

    it('allows multiple selections', async () => {
      const handleChange = jest.fn();
      render(<SearchableSelect options={mockOptions} multiple onValueChange={handleChange} />);
      
      const trigger = screen.getByText('Select an option...');
      await userEvent.click(trigger);
      
      const option1 = screen.getByText('Option 1');
      const option2 = screen.getByText('Option 2');
      
      await userEvent.click(option1);
      await userEvent.click(option2);
      
      expect(handleChange).toHaveBeenCalledWith('1,2');
    });

    it('renders with label and error', () => {
      render(<SearchableSelect options={mockOptions} label="Select Option" error="Selection required" />);
      
      expect(screen.getByText('Select Option')).toBeInTheDocument();
      expect(screen.getByText('Selection required')).toBeInTheDocument();
    });

    it('shows loading indicator', async () => {
      render(<SearchableSelect options={[]} loading />);
      
      const trigger = screen.getByText('Select an option...');
      await userEvent.click(trigger);
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('FileUpload Component', () => {
    it('renders upload zone', () => {
      render(<FileUpload />);
      
      expect(screen.getByText('Click to upload or drag and drop')).toBeInTheDocument();
    });

    it('renders with label and description', () => {
      render(<FileUpload label="Upload Files" description="Select files to upload" />);
      
      expect(screen.getByText('Upload Files')).toBeInTheDocument();
      expect(screen.getByText('Select files to upload')).toBeInTheDocument();
    });

    it('handles drag over state', () => {
      render(<FileUpload />);
      
      const dropZone = screen.getByText('Click to upload or drag and drop').closest('div');
      
      fireEvent.dragOver(dropZone!, {
        dataTransfer: { files: [] }
      });
      
      expect(screen.getByText('Drop files here')).toBeInTheDocument();
    });

    it('renders error state correctly', () => {
      render(<FileUpload error="Upload failed" />);
      
      expect(screen.getByText('Upload failed')).toBeInTheDocument();
    });

    it('renders success state correctly', () => {
      render(<FileUpload success="Upload completed" />);
      
      expect(screen.getByText('Upload completed')).toBeInTheDocument();
    });

    it('shows max size information', () => {
      render(<FileUpload maxSize={1024} />);
      
      expect(screen.getByText(/Max size: 1 KB/)).toBeInTheDocument();
    });

    it('shows max files information for multiple uploads', () => {
      render(<FileUpload multiple maxFiles={5} />);
      
      expect(screen.getByText(/Max files: 5/)).toBeInTheDocument();
    });

    it('disables upload when disabled prop is true', () => {
      render(<FileUpload disabled />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toBeDisabled();
    });

    it('accepts specific file types', () => {
      render(<FileUpload accept=".jpg,.png" />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toHaveAttribute('accept', '.jpg,.png');
    });

    it('supports multiple file selection', () => {
      render(<FileUpload multiple />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toHaveAttribute('multiple');
    });
  });
});