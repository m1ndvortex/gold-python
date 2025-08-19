import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../input';
import { SearchableSelect } from '../searchable-select';
import { FileUpload } from '../file-upload';
import { Mail, User, Search } from 'lucide-react';

describe('Enhanced Form Components', () => {
  describe('Input Component', () => {
    describe('Basic Functionality', () => {
      it('renders with default props', () => {
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
        
        expect(handleChange).toHaveBeenCalledTimes(4); // Once for each character
      });
    });

    describe('Floating Label', () => {
      it('renders floating label correctly', () => {
        render(<Input floating label="Username" />);
        
        const label = screen.getByText('Username');
        expect(label).toHaveClass('absolute', 'left-3', 'transition-all');
      });

      it('animates label on focus', async () => {
        render(<Input floating label="Email" />);
        
        const input = screen.getByRole('textbox');
        const label = screen.getByText('Email');
        
        await userEvent.click(input);
        
        // Label should move up when focused
        expect(label).toHaveClass('top-0', 'text-xs', 'text-primary-600');
      });

      it('keeps label up when input has value', async () => {
        render(<Input floating label="Name" defaultValue="John" />);
        
        const label = screen.getByText('Name');
        expect(label).toHaveClass('top-0', 'text-xs');
      });
    });

    describe('Validation States', () => {
      it('renders error state correctly', () => {
        render(<Input error="This field is required" />);
        
        const input = screen.getByRole('textbox');
        const errorMessage = screen.getByText('This field is required');
        
        expect(input).toHaveClass('border-error-500');
        expect(errorMessage).toHaveClass('text-error-600');
        expect(screen.getByTestId('lucide-alert-circle')).toBeInTheDocument();
      });

      it('renders success state correctly', () => {
        render(<Input success="Valid input" />);
        
        const input = screen.getByRole('textbox');
        const successMessage = screen.getByText('Valid input');
        
        expect(input).toHaveClass('border-success-500');
        expect(successMessage).toHaveClass('text-success-600');
        expect(screen.getByTestId('lucide-check-circle-2')).toBeInTheDocument();
      });

      it('renders warning state correctly', () => {
        render(<Input warning="Check this input" />);
        
        const input = screen.getByRole('textbox');
        const warningMessage = screen.getByText('Check this input');
        
        expect(input).toHaveClass('border-warning-500');
        expect(warningMessage).toHaveClass('text-warning-600');
      });
    });

    describe('Icons and Password Toggle', () => {
      it('renders left icon correctly', () => {
        render(<Input leftIcon={<User data-testid="user-icon" />} />);
        
        expect(screen.getByTestId('user-icon')).toBeInTheDocument();
        const input = screen.getByRole('textbox');
        expect(input).toHaveClass('pl-10');
      });

      it('renders right icon correctly', () => {
        render(<Input rightIcon={<Mail data-testid="mail-icon" />} />);
        
        expect(screen.getByTestId('mail-icon')).toBeInTheDocument();
        const input = screen.getByRole('textbox');
        expect(input).toHaveClass('pr-10');
      });

      it('shows password toggle for password input', () => {
        render(<Input type="password" showPasswordToggle />);
        
        const toggleButton = screen.getByRole('button');
        expect(toggleButton).toBeInTheDocument();
        expect(screen.getByTestId('lucide-eye')).toBeInTheDocument();
      });

      it('toggles password visibility', async () => {
        render(<Input type="password" showPasswordToggle />);
        
        const input = screen.getByRole('textbox') as HTMLInputElement;
        const toggleButton = screen.getByRole('button');
        
        expect(input.type).toBe('password');
        
        await userEvent.click(toggleButton);
        expect(input.type).toBe('text');
        expect(screen.getByTestId('lucide-eye-off')).toBeInTheDocument();
        
        await userEvent.click(toggleButton);
        expect(input.type).toBe('password');
        expect(screen.getByTestId('lucide-eye')).toBeInTheDocument();
      });
    });

    describe('Sizes', () => {
      it('renders small size correctly', () => {
        render(<Input size="sm" />);
        const input = screen.getByRole('textbox');
        expect(input).toHaveClass('h-8', 'px-2', 'py-1', 'text-xs');
      });

      it('renders large size correctly', () => {
        render(<Input size="lg" />);
        const input = screen.getByRole('textbox');
        expect(input).toHaveClass('h-12', 'px-4', 'py-3', 'text-base');
      });
    });

    describe('Help Text', () => {
      it('renders help text when no validation state', () => {
        render(<Input helpText="Enter your email address" />);
        
        const helpText = screen.getByText('Enter your email address');
        expect(helpText).toHaveClass('text-muted-foreground');
      });

      it('prioritizes error over help text', () => {
        render(<Input error="Invalid email" helpText="Enter your email" />);
        
        expect(screen.getByText('Invalid email')).toBeInTheDocument();
        expect(screen.queryByText('Enter your email')).not.toBeInTheDocument();
      });
    });
  });

  describe('SearchableSelect Component', () => {
    const mockOptions = [
      { value: '1', label: 'Option 1', description: 'First option' },
      { value: '2', label: 'Option 2', description: 'Second option' },
      { value: '3', label: 'Option 3', disabled: true },
    ];

    describe('Basic Functionality', () => {
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
        expect(screen.getByText('Option 1')).toBeInTheDocument(); // Should show selected value
      });
    });

    describe('Search Functionality', () => {
      it('filters options based on search term', async () => {
        render(<SearchableSelect options={mockOptions} searchable />);
        
        const trigger = screen.getByRole('button');
        await userEvent.click(trigger);
        
        const searchInput = screen.getByPlaceholderText('Search options...');
        await userEvent.type(searchInput, 'Option 1');
        
        expect(screen.getByText('Option 1')).toBeInTheDocument();
        expect(screen.queryByText('Option 2')).not.toBeInTheDocument();
      });

      it('shows empty message when no options match', async () => {
        render(<SearchableSelect options={mockOptions} searchable emptyMessage="No matches" />);
        
        const trigger = screen.getByRole('button');
        await userEvent.click(trigger);
        
        const searchInput = screen.getByPlaceholderText('Search options...');
        await userEvent.type(searchInput, 'nonexistent');
        
        expect(screen.getByText('No matches')).toBeInTheDocument();
      });
    });

    describe('Multiple Selection', () => {
      it('allows multiple selections', async () => {
        const handleChange = jest.fn();
        render(<SearchableSelect options={mockOptions} multiple onValueChange={handleChange} />);
        
        const trigger = screen.getByRole('button');
        await userEvent.click(trigger);
        
        const option1 = screen.getByText('Option 1');
        const option2 = screen.getByText('Option 2');
        
        await userEvent.click(option1);
        await userEvent.click(option2);
        
        expect(handleChange).toHaveBeenCalledWith('1,2');
      });

      it('shows count for multiple selections', async () => {
        render(<SearchableSelect options={mockOptions} multiple value="1,2" />);
        
        expect(screen.getByText('2 selected')).toBeInTheDocument();
      });
    });

    describe('Clearable', () => {
      it('shows clear button when clearable and has value', () => {
        render(<SearchableSelect options={mockOptions} clearable value="1" />);
        
        const clearButton = screen.getByRole('button', { name: '' }); // Clear button has no text
        expect(clearButton).toBeInTheDocument();
      });

      it('clears selection when clear button clicked', async () => {
        const handleChange = jest.fn();
        render(<SearchableSelect options={mockOptions} clearable value="1" onValueChange={handleChange} />);
        
        const clearButton = screen.getByTestId('lucide-x');
        await userEvent.click(clearButton.closest('button')!);
        
        expect(handleChange).toHaveBeenCalledWith('');
      });
    });

    describe('Validation States', () => {
      it('renders error state correctly', () => {
        render(<SearchableSelect options={mockOptions} error="Selection required" />);
        
        const trigger = screen.getByRole('button');
        expect(trigger).toHaveClass('border-error-500');
        expect(screen.getByText('Selection required')).toBeInTheDocument();
      });
    });

    describe('Loading State', () => {
      it('shows loading indicator', async () => {
        render(<SearchableSelect options={[]} loading />);
        
        const trigger = screen.getByRole('button');
        await userEvent.click(trigger);
        
        expect(screen.getByText('Loading...')).toBeInTheDocument();
      });
    });
  });

  describe('FileUpload Component', () => {
    // Mock File constructor
    const createMockFile = (name: string, size: number, type: string) => {
      const file = new File([''], name, { type });
      Object.defineProperty(file, 'size', { value: size });
      return file;
    };

    describe('Basic Functionality', () => {
      it('renders upload zone', () => {
        render(<FileUpload />);
        
        expect(screen.getByText('Click to upload or drag and drop')).toBeInTheDocument();
        expect(screen.getByTestId('lucide-upload')).toBeInTheDocument();
      });

      it('renders with label and description', () => {
        render(<FileUpload label="Upload Files" description="Select files to upload" />);
        
        expect(screen.getByText('Upload Files')).toBeInTheDocument();
        expect(screen.getByText('Select files to upload')).toBeInTheDocument();
      });

      it('opens file dialog on click', async () => {
        const mockClick = jest.fn();
        const mockInput = { click: mockClick };
        
        jest.spyOn(React, 'useRef').mockReturnValueOnce({ current: mockInput });
        
        render(<FileUpload />);
        
        const uploadZone = screen.getByText('Click to upload or drag and drop').closest('div');
        await userEvent.click(uploadZone!);
        
        expect(mockClick).toHaveBeenCalled();
      });
    });

    describe('File Selection', () => {
      it('handles file selection', async () => {
        const handleFilesChange = jest.fn();
        render(<FileUpload onFilesChange={handleFilesChange} />);
        
        const fileInput = screen.getByRole('button').querySelector('input[type="file"]') as HTMLInputElement;
        const file = createMockFile('test.txt', 1024, 'text/plain');
        
        Object.defineProperty(fileInput, 'files', {
          value: [file],
          writable: false,
        });
        
        fireEvent.change(fileInput);
        
        await waitFor(() => {
          expect(handleFilesChange).toHaveBeenCalled();
        });
      });

      it('validates file size', async () => {
        const handleFilesChange = jest.fn();
        render(<FileUpload onFilesChange={handleFilesChange} maxSize={1024} />);
        
        const fileInput = screen.getByRole('button').querySelector('input[type="file"]') as HTMLInputElement;
        const file = createMockFile('large.txt', 2048, 'text/plain');
        
        Object.defineProperty(fileInput, 'files', {
          value: [file],
          writable: false,
        });
        
        fireEvent.change(fileInput);
        
        await waitFor(() => {
          expect(screen.getByText(/File size must be less than/)).toBeInTheDocument();
        });
      });

      it('validates file types', async () => {
        render(<FileUpload allowedTypes={['image']} />);
        
        const fileInput = screen.getByRole('button').querySelector('input[type="file"]') as HTMLInputElement;
        const file = createMockFile('document.pdf', 1024, 'application/pdf');
        
        Object.defineProperty(fileInput, 'files', {
          value: [file],
          writable: false,
        });
        
        fireEvent.change(fileInput);
        
        await waitFor(() => {
          expect(screen.getByText(/File type not allowed/)).toBeInTheDocument();
        });
      });
    });

    describe('Multiple Files', () => {
      it('handles multiple file selection', async () => {
        const handleFilesChange = jest.fn();
        render(<FileUpload multiple onFilesChange={handleFilesChange} />);
        
        const fileInput = screen.getByRole('button').querySelector('input[type="file"]') as HTMLInputElement;
        const files = [
          createMockFile('file1.txt', 1024, 'text/plain'),
          createMockFile('file2.txt', 1024, 'text/plain'),
        ];
        
        Object.defineProperty(fileInput, 'files', {
          value: files,
          writable: false,
        });
        
        fireEvent.change(fileInput);
        
        await waitFor(() => {
          expect(handleFilesChange).toHaveBeenCalledWith(
            expect.arrayContaining([
              expect.objectContaining({ file: files[0] }),
              expect.objectContaining({ file: files[1] }),
            ])
          );
        });
      });

      it('respects max files limit', async () => {
        render(<FileUpload multiple maxFiles={1} />);
        
        const fileInput = screen.getByRole('button').querySelector('input[type="file"]') as HTMLInputElement;
        const files = [
          createMockFile('file1.txt', 1024, 'text/plain'),
          createMockFile('file2.txt', 1024, 'text/plain'),
        ];
        
        Object.defineProperty(fileInput, 'files', {
          value: files,
          writable: false,
        });
        
        fireEvent.change(fileInput);
        
        await waitFor(() => {
          // Should only show one file
          expect(screen.getAllByText(/file\d\.txt/)).toHaveLength(1);
        });
      });
    });

    describe('File Removal', () => {
      it('removes files when remove button clicked', async () => {
        const handleFilesChange = jest.fn();
        const handleFileRemove = jest.fn();
        
        render(
          <FileUpload 
            onFilesChange={handleFilesChange} 
            onFileRemove={handleFileRemove}
          />
        );
        
        const fileInput = screen.getByRole('button').querySelector('input[type="file"]') as HTMLInputElement;
        const file = createMockFile('test.txt', 1024, 'text/plain');
        
        Object.defineProperty(fileInput, 'files', {
          value: [file],
          writable: false,
        });
        
        fireEvent.change(fileInput);
        
        await waitFor(() => {
          expect(screen.getByText('test.txt')).toBeInTheDocument();
        });
        
        const removeButton = screen.getByTestId('lucide-x').closest('button');
        await userEvent.click(removeButton!);
        
        expect(handleFileRemove).toHaveBeenCalled();
      });
    });

    describe('Drag and Drop', () => {
      it('handles drag over state', () => {
        render(<FileUpload />);
        
        const dropZone = screen.getByText('Click to upload or drag and drop').closest('div');
        
        fireEvent.dragOver(dropZone!, {
          dataTransfer: { files: [] }
        });
        
        expect(screen.getByText('Drop files here')).toBeInTheDocument();
      });

      it('handles file drop', async () => {
        const handleFilesChange = jest.fn();
        render(<FileUpload onFilesChange={handleFilesChange} />);
        
        const dropZone = screen.getByText('Click to upload or drag and drop').closest('div');
        const file = createMockFile('dropped.txt', 1024, 'text/plain');
        
        fireEvent.drop(dropZone!, {
          dataTransfer: { files: [file] }
        });
        
        await waitFor(() => {
          expect(handleFilesChange).toHaveBeenCalled();
        });
      });
    });

    describe('Progress and Status', () => {
      it('shows upload progress', async () => {
        const uploadProgress = { 'file-1': 50 };
        
        render(<FileUpload uploadProgress={uploadProgress} />);
        
        const fileInput = screen.getByRole('button').querySelector('input[type="file"]') as HTMLInputElement;
        const file = createMockFile('test.txt', 1024, 'text/plain');
        
        // Mock the file ID generation
        jest.spyOn(Date, 'now').mockReturnValue(1);
        
        Object.defineProperty(fileInput, 'files', {
          value: [file],
          writable: false,
        });
        
        fireEvent.change(fileInput);
        
        await waitFor(() => {
          const progressBar = screen.getByRole('progressbar', { hidden: true });
          expect(progressBar).toHaveStyle('width: 50%');
        });
      });

      it('shows completion status', async () => {
        const uploadProgress = { 'file-1': 100 };
        
        render(<FileUpload uploadProgress={uploadProgress} />);
        
        const fileInput = screen.getByRole('button').querySelector('input[type="file"]') as HTMLInputElement;
        const file = createMockFile('test.txt', 1024, 'text/plain');
        
        jest.spyOn(Date, 'now').mockReturnValue(1);
        
        Object.defineProperty(fileInput, 'files', {
          value: [file],
          writable: false,
        });
        
        fireEvent.change(fileInput);
        
        await waitFor(() => {
          expect(screen.getByTestId('lucide-check-circle-2')).toBeInTheDocument();
        });
      });
    });

    describe('Validation States', () => {
      it('renders error state correctly', () => {
        render(<FileUpload error="Upload failed" />);
        
        const dropZone = screen.getByText('Click to upload or drag and drop').closest('div');
        expect(dropZone).toHaveClass('border-error-300');
        expect(screen.getByText('Upload failed')).toBeInTheDocument();
      });

      it('renders success state correctly', () => {
        render(<FileUpload success="Upload completed" />);
        
        const dropZone = screen.getByText('Click to upload or drag and drop').closest('div');
        expect(dropZone).toHaveClass('border-success-300');
        expect(screen.getByText('Upload completed')).toBeInTheDocument();
      });
    });

    describe('Disabled State', () => {
      it('disables upload when disabled prop is true', () => {
        render(<FileUpload disabled />);
        
        const dropZone = screen.getByText('Click to upload or drag and drop').closest('div');
        expect(dropZone).toHaveClass('opacity-50', 'cursor-not-allowed');
        
        const fileInput = screen.getByRole('button').querySelector('input[type="file"]') as HTMLInputElement;
        expect(fileInput).toBeDisabled();
      });
    });
  });
});