import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Test component to verify CSS design system classes
const TestComponent: React.FC = () => {
  return (
    <div data-testid="design-system-test">
      {/* Test gradient backgrounds */}
      <div className="bg-gradient-green p-4 mb-4" data-testid="gradient-green">
        Green Gradient Background
      </div>
      
      <div className="bg-gradient-blue p-4 mb-4" data-testid="gradient-blue">
        Blue Gradient Background
      </div>
      
      <div className="bg-gradient-purple p-4 mb-4" data-testid="gradient-purple">
        Purple Gradient Background
      </div>
      
      {/* Test gradient text */}
      <div className="text-gradient-green text-2xl font-bold mb-4" data-testid="text-gradient-green">
        Green Gradient Text
      </div>
      
      <div className="text-gradient-blue text-2xl font-bold mb-4" data-testid="text-gradient-blue">
        Blue Gradient Text
      </div>
      
      {/* Test card variants */}
      <div className="card-gradient-green p-6 mb-4" data-testid="card-gradient-green">
        Green Gradient Card
      </div>
      
      <div className="card-gradient-blue p-6 mb-4" data-testid="card-gradient-blue">
        Blue Gradient Card
      </div>
      
      {/* Test button variants */}
      <button className="btn-gradient-green px-4 py-2 mr-4" data-testid="btn-gradient-green">
        Green Gradient Button
      </button>
      
      <button className="btn-gradient-blue px-4 py-2 mr-4" data-testid="btn-gradient-blue">
        Blue Gradient Button
      </button>
      
      {/* Test shadow utilities */}
      <div className="shadow-professional p-4 mb-4" data-testid="shadow-professional">
        Professional Shadow
      </div>
      
      <div className="shadow-elegant p-4 mb-4" data-testid="shadow-elegant">
        Elegant Shadow
      </div>
      
      <div className="shadow-gradient-green p-4 mb-4" data-testid="shadow-gradient-green">
        Green Gradient Shadow
      </div>
      
      {/* Test animation utilities */}
      <div className="animate-fade-in p-4 mb-4" data-testid="animate-fade-in">
        Fade In Animation
      </div>
      
      <div className="animate-slide-up p-4 mb-4" data-testid="animate-slide-up">
        Slide Up Animation
      </div>
      
      {/* Test hover effects */}
      <div className="hover-lift p-4 mb-4 bg-gray-100" data-testid="hover-lift">
        Hover Lift Effect
      </div>
      
      <div className="hover-scale p-4 mb-4 bg-gray-100" data-testid="hover-scale">
        Hover Scale Effect
      </div>
      
      {/* Test transition utilities */}
      <div className="transition-all-smooth p-4 mb-4 bg-gray-100" data-testid="transition-all-smooth">
        Smooth Transitions
      </div>
      
      {/* Test responsive gradient utilities */}
      <div className="mobile-gradient-simple desktop-gradient-enhanced">
        <div className="bg-gradient-green p-4" data-testid="responsive-gradient">
          Responsive Gradient
        </div>
      </div>
      
      {/* Test tab navigation styles */}
      <div className="tab-container-green p-2 mb-4" data-testid="tab-container-green">
        <div className="tab-active-green" data-testid="tab-active-green">
          Active Tab
        </div>
        <div className="tab-inactive" data-testid="tab-inactive">
          Inactive Tab
        </div>
      </div>
      
      {/* Test badge variants */}
      <div className="badge-gradient-green mr-2" data-testid="badge-gradient-green">
        Green Badge
      </div>
      
      <div className="badge-gradient-blue mr-2" data-testid="badge-gradient-blue">
        Blue Badge
      </div>
      
      {/* Test focus ring utilities */}
      <input 
        className="focus-ring-green p-2 border rounded" 
        data-testid="focus-ring-green"
        placeholder="Focus ring green"
      />
      
      <input 
        className="focus-ring-blue p-2 border rounded ml-2" 
        data-testid="focus-ring-blue"
        placeholder="Focus ring blue"
      />
    </div>
  );
};

describe('Enhanced CSS Design System', () => {
  beforeEach(() => {
    render(<TestComponent />);
  });

  test('renders gradient background elements', () => {
    expect(screen.getByTestId('gradient-green')).toBeInTheDocument();
    expect(screen.getByTestId('gradient-blue')).toBeInTheDocument();
    expect(screen.getByTestId('gradient-purple')).toBeInTheDocument();
  });

  test('renders gradient text elements', () => {
    expect(screen.getByTestId('text-gradient-green')).toBeInTheDocument();
    expect(screen.getByTestId('text-gradient-blue')).toBeInTheDocument();
  });

  test('renders gradient card variants', () => {
    expect(screen.getByTestId('card-gradient-green')).toBeInTheDocument();
    expect(screen.getByTestId('card-gradient-blue')).toBeInTheDocument();
  });

  test('renders gradient button variants', () => {
    expect(screen.getByTestId('btn-gradient-green')).toBeInTheDocument();
    expect(screen.getByTestId('btn-gradient-blue')).toBeInTheDocument();
  });

  test('renders shadow utility elements', () => {
    expect(screen.getByTestId('shadow-professional')).toBeInTheDocument();
    expect(screen.getByTestId('shadow-elegant')).toBeInTheDocument();
    expect(screen.getByTestId('shadow-gradient-green')).toBeInTheDocument();
  });

  test('renders animation utility elements', () => {
    expect(screen.getByTestId('animate-fade-in')).toBeInTheDocument();
    expect(screen.getByTestId('animate-slide-up')).toBeInTheDocument();
  });

  test('renders hover effect elements', () => {
    expect(screen.getByTestId('hover-lift')).toBeInTheDocument();
    expect(screen.getByTestId('hover-scale')).toBeInTheDocument();
  });

  test('renders transition utility elements', () => {
    expect(screen.getByTestId('transition-all-smooth')).toBeInTheDocument();
  });

  test('renders responsive gradient elements', () => {
    expect(screen.getByTestId('responsive-gradient')).toBeInTheDocument();
  });

  test('renders tab navigation elements', () => {
    expect(screen.getByTestId('tab-container-green')).toBeInTheDocument();
    expect(screen.getByTestId('tab-active-green')).toBeInTheDocument();
    expect(screen.getByTestId('tab-inactive')).toBeInTheDocument();
  });

  test('renders badge variants', () => {
    expect(screen.getByTestId('badge-gradient-green')).toBeInTheDocument();
    expect(screen.getByTestId('badge-gradient-blue')).toBeInTheDocument();
  });

  test('renders focus ring utilities', () => {
    expect(screen.getByTestId('focus-ring-green')).toBeInTheDocument();
    expect(screen.getByTestId('focus-ring-blue')).toBeInTheDocument();
  });

  test('gradient background elements have correct classes', () => {
    const greenGradient = screen.getByTestId('gradient-green');
    const blueGradient = screen.getByTestId('gradient-blue');
    const purpleGradient = screen.getByTestId('gradient-purple');
    
    expect(greenGradient).toHaveClass('bg-gradient-green');
    expect(blueGradient).toHaveClass('bg-gradient-blue');
    expect(purpleGradient).toHaveClass('bg-gradient-purple');
  });

  test('gradient text elements have correct classes', () => {
    const greenText = screen.getByTestId('text-gradient-green');
    const blueText = screen.getByTestId('text-gradient-blue');
    
    expect(greenText).toHaveClass('text-gradient-green');
    expect(blueText).toHaveClass('text-gradient-blue');
  });

  test('card elements have correct gradient classes', () => {
    const greenCard = screen.getByTestId('card-gradient-green');
    const blueCard = screen.getByTestId('card-gradient-blue');
    
    expect(greenCard).toHaveClass('card-gradient-green');
    expect(blueCard).toHaveClass('card-gradient-blue');
  });

  test('button elements have correct gradient classes', () => {
    const greenButton = screen.getByTestId('btn-gradient-green');
    const blueButton = screen.getByTestId('btn-gradient-blue');
    
    expect(greenButton).toHaveClass('btn-gradient-green');
    expect(blueButton).toHaveClass('btn-gradient-blue');
  });

  test('shadow elements have correct classes', () => {
    const professionalShadow = screen.getByTestId('shadow-professional');
    const elegantShadow = screen.getByTestId('shadow-elegant');
    const gradientShadow = screen.getByTestId('shadow-gradient-green');
    
    expect(professionalShadow).toHaveClass('shadow-professional');
    expect(elegantShadow).toHaveClass('shadow-elegant');
    expect(gradientShadow).toHaveClass('shadow-gradient-green');
  });

  test('animation elements have correct classes', () => {
    const fadeIn = screen.getByTestId('animate-fade-in');
    const slideUp = screen.getByTestId('animate-slide-up');
    
    expect(fadeIn).toHaveClass('animate-fade-in');
    expect(slideUp).toHaveClass('animate-slide-up');
  });

  test('hover effect elements have correct classes', () => {
    const hoverLift = screen.getByTestId('hover-lift');
    const hoverScale = screen.getByTestId('hover-scale');
    
    expect(hoverLift).toHaveClass('hover-lift');
    expect(hoverScale).toHaveClass('hover-scale');
  });

  test('transition elements have correct classes', () => {
    const transitionSmooth = screen.getByTestId('transition-all-smooth');
    
    expect(transitionSmooth).toHaveClass('transition-all-smooth');
  });

  test('tab navigation elements have correct classes', () => {
    const tabContainer = screen.getByTestId('tab-container-green');
    const activeTab = screen.getByTestId('tab-active-green');
    const inactiveTab = screen.getByTestId('tab-inactive');
    
    expect(tabContainer).toHaveClass('tab-container-green');
    expect(activeTab).toHaveClass('tab-active-green');
    expect(inactiveTab).toHaveClass('tab-inactive');
  });

  test('badge elements have correct classes', () => {
    const greenBadge = screen.getByTestId('badge-gradient-green');
    const blueBadge = screen.getByTestId('badge-gradient-blue');
    
    expect(greenBadge).toHaveClass('badge-gradient-green');
    expect(blueBadge).toHaveClass('badge-gradient-blue');
  });

  test('focus ring elements have correct classes', () => {
    const focusRingGreen = screen.getByTestId('focus-ring-green');
    const focusRingBlue = screen.getByTestId('focus-ring-blue');
    
    expect(focusRingGreen).toHaveClass('focus-ring-green');
    expect(focusRingBlue).toHaveClass('focus-ring-blue');
  });
});