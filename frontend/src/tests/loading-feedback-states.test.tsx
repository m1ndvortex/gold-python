import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Import all loading and feedback components
import {
  LoadingSpinner,
  GradientSpinner,
  PulseLoader,
  Progress,
  AnimatedProgress,
  CircularProgress,
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonTable,
  SkeletonChart,
  GradientSkeleton,
  LoadingOverlay,
  LoadingButton,
  LoadingCard,
  LoadingTable,
  LoadingChart,
  LoadingForm,
  LoadingList,
  StepProgress,
  LoadingText
} from '../components/ui/loading-states';

import {
  Alert,
  BannerAlert,
  InlineAlert,
  StatusIndicator,
  ProgressAlert,
  ActionFeedback
} from '../components/ui/alert-system';

import { ToastProvider, useToast } from '../components/ui/toast';

describe('Loading Components', () => {
  describe('LoadingSpinner', () => {
    it('renders with default props', () => {
      render(<LoadingSpinner />);
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('renders with different sizes', () => {
      const { rerender } = render(<LoadingSpinner size="sm" />);
      expect(document.querySelector('.h-4')).toBeInTheDocument();

      rerender(<LoadingSpinner size="lg" />);
      expect(document.querySelector('.h-8')).toBeInTheDocument();
    });

    it('renders with different variants', () => {
      const { rerender } = render(<LoadingSpinner variant="green" />);
      expect(document.querySelector('.border-green-200')).toBeInTheDocument();

      rerender(<LoadingSpinner variant="blue" />);
      expect(document.querySelector('.border-blue-200')).toBeInTheDocument();
    });
  });

  describe('GradientSpinner', () => {
    it('renders gradient spinner correctly', () => {
      render(<GradientSpinner variant="green" />);
      const spinner = document.querySelector('.bg-gradient-to-r');
      expect(spinner).toBeInTheDocument();
    });

    it('applies correct size classes', () => {
      render(<GradientSpinner size="xl" />);
      expect(document.querySelector('.h-12')).toBeInTheDocument();
    });
  });

  describe('PulseLoader', () => {
    it('renders three pulsing dots', () => {
      render(<PulseLoader />);
      const dots = document.querySelectorAll('.animate-pulse');
      expect(dots).toHaveLength(3);
    });

    it('applies correct variant styling', () => {
      render(<PulseLoader variant="purple" />);
      const dots = document.querySelectorAll('.bg-gradient-to-r');
      expect(dots.length).toBeGreaterThan(0);
    });
  });

  describe('Progress', () => {
    it('renders progress bar with correct percentage', () => {
      render(<Progress value={50} max={100} />);
      const progressBar = document.querySelector('[style*="width: 50%"]');
      expect(progressBar).toBeInTheDocument();
    });

    it('shows label when requested', () => {
      render(<Progress value={75} showLabel />);
      expect(screen.getByText('75%')).toBeInTheDocument();
      expect(screen.getByText('Progress')).toBeInTheDocument();
    });

    it('handles different variants', () => {
      render(<Progress value={30} variant="blue" />);
      const progressBar = document.querySelector('.from-blue-500');
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe('CircularProgress', () => {
    it('renders circular progress with correct percentage', () => {
      render(<CircularProgress value={60} showLabel />);
      expect(screen.getByText('60%')).toBeInTheDocument();
    });

    it('applies correct size', () => {
      render(<CircularProgress value={50} size={120} />);
      const svg = document.querySelector('svg');
      expect(svg).toHaveAttribute('width', '120');
      expect(svg).toHaveAttribute('height', '120');
    });
  });

  describe('Skeleton Components', () => {
    it('renders basic skeleton', () => {
      render(<Skeleton className="h-4 w-20" />);
      const skeleton = document.querySelector('.h-4.w-20');
      expect(skeleton).toBeInTheDocument();
    });

    it('renders skeleton text with multiple lines', () => {
      render(<SkeletonText lines={3} />);
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons).toHaveLength(3);
    });

    it('renders skeleton card', () => {
      render(<SkeletonCard />);
      const card = document.querySelector('.border.rounded-lg.shadow-lg');
      expect(card).toBeInTheDocument();
    });

    it('renders skeleton table with correct dimensions', () => {
      render(<SkeletonTable rows={3} columns={4} />);
      const rows = document.querySelectorAll('.flex.space-x-4');
      expect(rows).toHaveLength(4); // 3 data rows + 1 header
    });

    it('renders skeleton chart', () => {
      render(<SkeletonChart />);
      const chart = document.querySelector('.h-64');
      expect(chart).toBeInTheDocument();
    });

    it('renders gradient skeleton with variants', () => {
      render(<GradientSkeleton variant="purple" className="h-8 w-24" />);
      const skeleton = document.querySelector('.from-purple-100');
      expect(skeleton).toBeInTheDocument();
    });
  });

  describe('Loading State Components', () => {
    it('renders loading overlay when loading', () => {
      render(
        <LoadingOverlay isLoading={true} message="Loading data...">
          <div>Content</div>
        </LoadingOverlay>
      );
      expect(screen.getByText('Loading data...')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('hides loading overlay when not loading', () => {
      render(
        <LoadingOverlay isLoading={false}>
          <div>Content</div>
        </LoadingOverlay>
      );
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('renders loading button with spinner when loading', () => {
      render(
        <LoadingButton isLoading={true}>
          Save Changes
        </LoadingButton>
      );
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('renders loading card with skeleton when loading', () => {
      render(
        <LoadingCard isLoading={true}>
          <div>Card content</div>
        </LoadingCard>
      );
      expect(screen.queryByText('Card content')).not.toBeInTheDocument();
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('renders loading table with skeleton when loading', () => {
      render(
        <LoadingTable isLoading={true} rows={2} columns={3}>
          <table>Table content</table>
        </LoadingTable>
      );
      expect(screen.queryByText('Table content')).not.toBeInTheDocument();
      const skeletonRows = document.querySelectorAll('.flex.space-x-4');
      expect(skeletonRows).toHaveLength(3); // 2 data rows + 1 header
    });

    it('renders loading form with skeleton when loading', () => {
      render(
        <LoadingForm isLoading={true}>
          <form>Form content</form>
        </LoadingForm>
      );
      expect(screen.queryByText('Form content')).not.toBeInTheDocument();
      expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
    });

    it('renders loading list with skeleton when loading', () => {
      render(
        <LoadingList isLoading={true} items={3}>
          <div>List content</div>
        </LoadingList>
      );
      expect(screen.queryByText('List content')).not.toBeInTheDocument();
      const listItems = document.querySelectorAll('.flex.items-center.space-x-3');
      expect(listItems).toHaveLength(3);
    });
  });

  describe('StepProgress', () => {
    const steps = ['Step 1', 'Step 2', 'Step 3'];

    it('renders step progress correctly', () => {
      render(
        <StepProgress
          currentStep={2}
          totalSteps={3}
          steps={steps}
        />
      );
      expect(screen.getByText('Step 2 of 3')).toBeInTheDocument();
      expect(screen.getByText('67%')).toBeInTheDocument();
      steps.forEach(step => {
        expect(screen.getByText(step)).toBeInTheDocument();
      });
    });

    it('shows correct step states', () => {
      render(
        <StepProgress
          currentStep={2}
          totalSteps={3}
          steps={steps}
        />
      );
      const dots = document.querySelectorAll('.w-2.h-2.rounded-full');
      expect(dots[0]).toHaveClass('bg-green-500'); // completed
      expect(dots[1]).toHaveClass('bg-blue-500'); // current (index 1 = step 2)
      expect(dots[2]).toHaveClass('bg-gray-300'); // pending
    });
  });

  describe('LoadingText', () => {
    it('renders skeleton when loading', () => {
      render(
        <LoadingText isLoading={true} lines={2}>
          <p>Actual text</p>
        </LoadingText>
      );
      expect(screen.queryByText('Actual text')).not.toBeInTheDocument();
      expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
    });

    it('renders actual content when not loading', () => {
      render(
        <LoadingText isLoading={false}>
          <p>Actual text</p>
        </LoadingText>
      );
      expect(screen.getByText('Actual text')).toBeInTheDocument();
    });
  });
});

describe('Alert and Feedback Components', () => {
  describe('Alert', () => {
    it('renders success alert correctly', () => {
      render(
        <Alert
          type="success"
          title="Success!"
          message="Operation completed successfully"
        />
      );
      expect(screen.getByText('Success!')).toBeInTheDocument();
      expect(screen.getByText('Operation completed successfully')).toBeInTheDocument();
    });

    it('renders error alert correctly', () => {
      render(
        <Alert
          type="error"
          message="Something went wrong"
        />
      );
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('renders warning alert correctly', () => {
      render(
        <Alert
          type="warning"
          message="Please check your input"
        />
      );
      expect(screen.getByText('Please check your input')).toBeInTheDocument();
    });

    it('renders info alert correctly', () => {
      render(
        <Alert
          type="info"
          message="Here's some information"
        />
      );
      expect(screen.getByText("Here's some information")).toBeInTheDocument();
    });

    it('handles dismissible alerts', () => {
      const onDismiss = jest.fn();
      render(
        <Alert
          type="info"
          message="Dismissible alert"
          dismissible
          onDismiss={onDismiss}
        />
      );
      
      const dismissButton = document.querySelector('button');
      expect(dismissButton).toBeInTheDocument();
      
      fireEvent.click(dismissButton!);
      expect(onDismiss).toHaveBeenCalled();
    });

    it('renders with gradient variant', () => {
      render(
        <Alert
          type="success"
          message="Gradient alert"
          variant="gradient"
        />
      );
      expect(document.querySelector('.bg-gradient-to-r')).toBeInTheDocument();
    });
  });

  describe('BannerAlert', () => {
    it('renders banner alert with correct styling', () => {
      render(
        <BannerAlert
          type="warning"
          message="System maintenance scheduled"
        />
      );
      expect(screen.getByText('System maintenance scheduled')).toBeInTheDocument();
      expect(document.querySelector('.rounded-none')).toBeInTheDocument();
    });
  });

  describe('InlineAlert', () => {
    it('renders inline alert with small size', () => {
      render(
        <InlineAlert
          type="error"
          message="Field is required"
          size="sm"
        />
      );
      expect(screen.getByText('Field is required')).toBeInTheDocument();
      expect(document.querySelector('.p-2.text-xs')).toBeInTheDocument();
    });
  });

  describe('StatusIndicator', () => {
    it('renders status indicators for all types', () => {
      const statuses: Array<'success' | 'error' | 'warning' | 'info' | 'pending'> = 
        ['success', 'error', 'warning', 'info', 'pending'];
      
      statuses.forEach(status => {
        const { unmount } = render(
          <StatusIndicator status={status} label={`${status} status`} />
        );
        expect(screen.getByText(`${status} status`)).toBeInTheDocument();
        unmount();
      });
    });

    it('renders with different sizes', () => {
      const { rerender } = render(
        <StatusIndicator status="success" label="Small" size="sm" />
      );
      expect(document.querySelector('.text-xs')).toBeInTheDocument();

      rerender(<StatusIndicator status="success" label="Large" size="lg" />);
      expect(document.querySelector('.text-base')).toBeInTheDocument();
    });

    it('renders with gradient variant', () => {
      render(
        <StatusIndicator
          status="success"
          label="Gradient status"
          variant="gradient"
        />
      );
      expect(document.querySelector('.bg-gradient-to-r')).toBeInTheDocument();
    });

    it('shows pulsing animation for pending status', () => {
      render(
        <StatusIndicator status="pending" label="Processing..." />
      );
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
    });
  });

  describe('ProgressAlert', () => {
    it('renders progress alert correctly', () => {
      render(
        <ProgressAlert
          title="Upload Progress"
          currentStep={2}
          totalSteps={5}
          stepName="Processing files..."
          variant="blue"
        />
      );
      expect(screen.getByText('Upload Progress')).toBeInTheDocument();
      expect(screen.getByText('2/5')).toBeInTheDocument();
      expect(screen.getByText('Processing files...')).toBeInTheDocument();
    });

    it('calculates percentage correctly', () => {
      render(
        <ProgressAlert
          title="Progress"
          currentStep={3}
          totalSteps={4}
          stepName="Step 3"
        />
      );
      const progressBar = document.querySelector('[style*="width: 75%"]');
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe('ActionFeedback', () => {
    it('renders when visible', () => {
      render(
        <ActionFeedback
          type="success"
          message="Changes saved!"
          isVisible={true}
        />
      );
      expect(screen.getByText('Changes saved!')).toBeInTheDocument();
    });

    it('does not render when not visible', () => {
      render(
        <ActionFeedback
          type="success"
          message="Changes saved!"
          isVisible={false}
        />
      );
      expect(screen.queryByText('Changes saved!')).not.toBeInTheDocument();
    });

    it('shows loading spinner for loading type', () => {
      render(
        <ActionFeedback
          type="loading"
          message="Saving..."
          isVisible={true}
        />
      );
      expect(screen.getByText('Saving...')).toBeInTheDocument();
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });
});

describe('Toast System', () => {
  const TestToastComponent = () => {
    const { addToast } = useToast();
    
    return (
      <div>
        <button onClick={() => addToast({ type: 'success', message: 'Success toast!' })}>
          Show Success Toast
        </button>
        <button onClick={() => addToast({ type: 'error', message: 'Error toast!' })}>
          Show Error Toast
        </button>
      </div>
    );
  };

  it('provides toast context', () => {
    render(
      <ToastProvider>
        <TestToastComponent />
      </ToastProvider>
    );
    
    expect(screen.getByText('Show Success Toast')).toBeInTheDocument();
    expect(screen.getByText('Show Error Toast')).toBeInTheDocument();
  });

  it('shows toast when triggered', async () => {
    render(
      <ToastProvider>
        <TestToastComponent />
      </ToastProvider>
    );
    
    fireEvent.click(screen.getByText('Show Success Toast'));
    
    await waitFor(() => {
      expect(screen.getByText('Success toast!')).toBeInTheDocument();
    });
  });

  it('auto-removes toast after duration', async () => {
    render(
      <ToastProvider>
        <TestToastComponent />
      </ToastProvider>
    );
    
    fireEvent.click(screen.getByText('Show Success Toast'));
    
    await waitFor(() => {
      expect(screen.getByText('Success toast!')).toBeInTheDocument();
    });

    // Wait for auto-removal (default 1 second for testing)
    await waitFor(() => {
      expect(screen.queryByText('Success toast!')).not.toBeInTheDocument();
    }, { timeout: 2000 });
  });
});

describe('Integration Tests', () => {
  it('combines loading states with alerts', () => {
    const TestComponent = () => {
      const [isLoading, setIsLoading] = React.useState(true);
      
      React.useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 100);
        return () => clearTimeout(timer);
      }, []);

      return (
        <div>
          <LoadingOverlay isLoading={isLoading}>
            <Alert type="success" message="Data loaded successfully!" />
          </LoadingOverlay>
        </div>
      );
    };

    render(<TestComponent />);
    
    // Initially should show loading
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    
    // After loading completes, should show alert
    waitFor(() => {
      expect(screen.getByText('Data loaded successfully!')).toBeInTheDocument();
    });
  });

  it('handles multiple loading states simultaneously', () => {
    render(
      <div>
        <LoadingButton isLoading={true}>Save</LoadingButton>
        <LoadingCard isLoading={true}>
          <div>Card content</div>
        </LoadingCard>
        <StatusIndicator status="pending" label="Processing..." />
      </div>
    );

    expect(document.querySelectorAll('.animate-spin').length).toBeGreaterThan(0);
    expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
    expect(screen.getByText('Processing...')).toBeInTheDocument();
  });
});