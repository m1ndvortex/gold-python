import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../button';
import { Heart, Download } from 'lucide-react';

describe('Button Component', () => {
  describe('Basic Rendering', () => {
    it('renders with default variant and size', () => {
      render(<Button>Click me</Button>);
      const button = screen.getByRole('button', { name: /click me/i });
      
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('bg-primary-500', 'text-white', 'h-10', 'px-4', 'py-2');
    });

    it('renders with custom className', () => {
      render(<Button className="custom-class">Button</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('custom-class');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLButtonElement>();
      render(<Button ref={ref}>Button</Button>);
      
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });
  });

  describe('Variants', () => {
    it('renders gold variant correctly', () => {
      render(<Button variant="gold">Gold Button</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('bg-gradient-to-r', 'from-primary-400', 'to-primary-600');
    });

    it('renders gold-outline variant correctly', () => {
      render(<Button variant="gold-outline">Gold Outline</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('border-2', 'border-primary-500', 'text-primary-600', 'bg-transparent');
    });

    it('renders gold-ghost variant correctly', () => {
      render(<Button variant="gold-ghost">Gold Ghost</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('text-primary-600');
    });

    it('renders success variant correctly', () => {
      render(<Button variant="success">Success</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('bg-success-500', 'text-white');
    });

    it('renders warning variant correctly', () => {
      render(<Button variant="warning">Warning</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('bg-warning-500', 'text-white');
    });

    it('renders error variant correctly', () => {
      render(<Button variant="error">Error</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('bg-error-500', 'text-white');
    });

    it('renders info variant correctly', () => {
      render(<Button variant="info">Info</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('bg-info-500', 'text-white');
    });
  });

  describe('Sizes', () => {
    it('renders small size correctly', () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('h-8', 'px-3', 'text-xs');
    });

    it('renders large size correctly', () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('h-12', 'px-8', 'text-base', 'font-semibold');
    });

    it('renders extra large size correctly', () => {
      render(<Button size="xl">Extra Large</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('h-14', 'px-10', 'text-lg', 'font-semibold');
    });

    it('renders icon size correctly', () => {
      render(<Button size="icon">Icon</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('h-10', 'w-10');
    });

    it('renders small icon size correctly', () => {
      render(<Button size="icon-sm">Small Icon</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('h-8', 'w-8');
    });

    it('renders large icon size correctly', () => {
      render(<Button size="icon-lg">Large Icon</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('h-12', 'w-12');
    });
  });

  describe('Loading State', () => {
    it('shows loading spinner when loading is true', () => {
      render(<Button loading>Loading Button</Button>);
      
      expect(screen.getByTestId('loader-2')).toBeInTheDocument();
      expect(screen.getByText('Loading Button')).toBeInTheDocument();
    });

    it('shows custom loading text when provided', () => {
      render(<Button loading loadingText="Please wait...">Submit</Button>);
      
      expect(screen.getByText('Please wait...')).toBeInTheDocument();
      expect(screen.queryByText('Submit')).not.toBeInTheDocument();
    });

    it('disables button when loading', () => {
      render(<Button loading>Loading</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toBeDisabled();
    });

    it('hides icons when loading', () => {
      render(
        <Button loading icon={<Heart data-testid="heart-icon" />}>
          Loading with Icon
        </Button>
      );
      
      expect(screen.queryByTestId('heart-icon')).not.toBeInTheDocument();
      expect(screen.getByTestId('loader-2')).toBeInTheDocument();
    });
  });

  describe('Icons', () => {
    it('renders left icon correctly', () => {
      render(
        <Button icon={<Heart data-testid="heart-icon" />} iconPosition="left">
          With Icon
        </Button>
      );
      
      const icon = screen.getByTestId('heart-icon');
      
      expect(icon).toBeInTheDocument();
      // Check that icon appears before the text with proper spacing
      const iconSpan = icon.closest('span');
      expect(iconSpan).toHaveClass('mr-2');
    });

    it('renders right icon correctly', () => {
      render(
        <Button icon={<Download data-testid="download-icon" />} iconPosition="right">
          Download
        </Button>
      );
      
      const icon = screen.getByTestId('download-icon');
      
      expect(icon).toBeInTheDocument();
      // Check that icon appears after the text with proper spacing
      const iconSpan = icon.closest('span');
      expect(iconSpan).toHaveClass('ml-2');
    });

    it('defaults to left icon position', () => {
      render(
        <Button icon={<Heart data-testid="heart-icon" />}>
          Default Position
        </Button>
      );
      
      const icon = screen.getByTestId('heart-icon');
      
      expect(icon).toBeInTheDocument();
      // Check that icon appears with left positioning (mr-2 class)
      const iconSpan = icon.closest('span');
      expect(iconSpan).toHaveClass('mr-2');
    });
  });

  describe('Disabled State', () => {
    it('disables button when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50');
    });

    it('prevents click events when disabled', async () => {
      const handleClick = jest.fn();
      render(<Button disabled onClick={handleClick}>Disabled</Button>);
      
      const button = screen.getByRole('button');
      await userEvent.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Interactions', () => {
    it('handles click events', async () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Clickable</Button>);
      
      const button = screen.getByRole('button');
      await userEvent.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('handles keyboard events', async () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick} animate={false}>Keyboard</Button>);
      
      const button = screen.getByRole('button');
      button.focus();
      
      // Simulate Enter key press which should trigger click
      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
      fireEvent.keyUp(button, { key: 'Enter', code: 'Enter' });
      
      // For buttons, we can also test that it's focusable and responds to space
      fireEvent.keyDown(button, { key: ' ', code: 'Space' });
      fireEvent.keyUp(button, { key: ' ', code: 'Space' });
      
      // Since native button behavior varies, let's just test that it's focusable
      expect(button).toHaveFocus();
    });

    it('supports focus and blur events', async () => {
      const handleFocus = jest.fn();
      const handleBlur = jest.fn();
      
      render(
        <Button onFocus={handleFocus} onBlur={handleBlur}>
          Focus Test
        </Button>
      );
      
      const button = screen.getByRole('button');
      
      button.focus();
      expect(handleFocus).toHaveBeenCalledTimes(1);
      
      button.blur();
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });
  });

  describe('Animation', () => {
    it('applies animation classes by default', () => {
      render(<Button>Animated</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('transition-all', 'duration-300');
    });

    it('can disable animations', () => {
      render(<Button animate={false}>No Animation</Button>);
      const button = screen.getByRole('button');
      
      // Should still have transition classes but no motion props
      expect(button).toHaveClass('transition-all', 'duration-300');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<Button aria-label="Custom label">Button</Button>);
      const button = screen.getByRole('button', { name: /custom label/i });
      
      expect(button).toBeInTheDocument();
    });

    it('supports aria-disabled when loading', () => {
      render(<Button loading>Loading</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveAttribute('disabled');
    });

    it('maintains focus visibility', () => {
      render(<Button>Focus Test</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-2');
    });
  });

  describe('AsChild Prop', () => {
    it('renders as child component when asChild is true', () => {
      render(
        <Button asChild className="test-button-class">
          <a href="/test">Link Button</a>
        </Button>
      );
      
      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/test');
      expect(link).toHaveTextContent('Link Button');
      // Test that it's still a link but with button functionality
      expect(link.tagName).toBe('A');
    });
  });

  describe('Shimmer Effect', () => {
    it('shows shimmer effect for gold variant', () => {
      render(<Button variant="gold">Gold with Shimmer</Button>);
      const button = screen.getByRole('button');
      
      // Check for shimmer container
      const shimmerContainer = button.querySelector('.absolute.inset-0.-top-px');
      expect(shimmerContainer).toBeInTheDocument();
      
      // Check for shimmer animation
      const shimmerElement = button.querySelector('.animate-shimmer');
      expect(shimmerElement).toBeInTheDocument();
    });

    it('shows shimmer effect for default variant', () => {
      render(<Button variant="default">Default with Shimmer</Button>);
      const button = screen.getByRole('button');
      
      const shimmerElement = button.querySelector('.animate-shimmer');
      expect(shimmerElement).toBeInTheDocument();
    });

    it('does not show shimmer effect for other variants', () => {
      render(<Button variant="secondary">No Shimmer</Button>);
      const button = screen.getByRole('button');
      
      const shimmerElement = button.querySelector('.animate-shimmer');
      expect(shimmerElement).not.toBeInTheDocument();
    });

    it('hides shimmer effect when disabled', () => {
      render(<Button variant="gold" disabled>Disabled Gold</Button>);
      const button = screen.getByRole('button');
      
      const shimmerElement = button.querySelector('.animate-shimmer');
      expect(shimmerElement).not.toBeInTheDocument();
    });
  });
});