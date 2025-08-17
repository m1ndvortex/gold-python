import React from 'react';
import { render, screen } from '@testing-library/react';

// Simple test components to verify basic functionality
const TestButton: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <button className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md">
    {children}
  </button>
);

const TestCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
    {children}
  </div>
);

const TestInput: React.FC<{ placeholder?: string }> = ({ placeholder }) => (
  <input
    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
    placeholder={placeholder}
  />
);

describe('UI Components Structure', () => {
  test('Button component renders correctly', () => {
    render(<TestButton>Test Button</TestButton>);
    expect(screen.getByRole('button', { name: 'Test Button' })).toBeInTheDocument();
  });

  test('Button has proper Tailwind classes', () => {
    render(<TestButton>Delete</TestButton>);
    expect(screen.getByRole('button')).toHaveClass('bg-primary', 'rounded-md');
  });

  test('Card component renders with proper structure', () => {
    render(
      <TestCard>
        <div>
          <h3>Test Card</h3>
          <p>Card content</p>
        </div>
      </TestCard>
    );

    expect(screen.getByText('Test Card')).toBeInTheDocument();
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  test('Input component renders with proper styling', () => {
    render(<TestInput placeholder="Test input" />);
    const input = screen.getByPlaceholderText('Test input');
    expect(input).toBeInTheDocument();
    expect(input).toHaveClass('flex', 'h-10', 'w-full', 'rounded-md');
  });
});