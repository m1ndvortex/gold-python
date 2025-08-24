import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';

describe('UI Components with Gradient Styling', () => {
  describe('Button Component', () => {
    it('renders gradient button variants correctly', () => {
      render(
        <div>
          <Button variant="gradient-green" data-testid="gradient-green-btn">
            Green Gradient
          </Button>
          <Button variant="gradient-blue" data-testid="gradient-blue-btn">
            Blue Gradient
          </Button>
          <Button variant="icon-gradient-green" data-testid="icon-gradient-btn">
            Icon
          </Button>
        </div>
      );

      const greenBtn = screen.getByTestId('gradient-green-btn');
      const blueBtn = screen.getByTestId('gradient-blue-btn');
      const iconBtn = screen.getByTestId('icon-gradient-btn');

      expect(greenBtn).toBeInTheDocument();
      expect(blueBtn).toBeInTheDocument();
      expect(iconBtn).toBeInTheDocument();

      // Check if gradient classes are applied
      expect(greenBtn).toHaveClass('bg-gradient-to-r', 'from-green-500', 'to-teal-600');
      expect(blueBtn).toHaveClass('bg-gradient-to-r', 'from-blue-500', 'to-indigo-600');
      expect(iconBtn).toHaveClass('bg-gradient-to-br', 'from-green-500', 'to-green-600');
    });
  });

  describe('Card Component', () => {
    it('renders gradient card variants correctly', () => {
      render(
        <div>
          <Card variant="gradient-green" data-testid="gradient-green-card">
            <CardHeader>
              <CardTitle>Green Card</CardTitle>
            </CardHeader>
            <CardContent>Content</CardContent>
          </Card>
          <Card variant="professional" data-testid="professional-card">
            <CardHeader>
              <CardTitle>Professional Card</CardTitle>
            </CardHeader>
            <CardContent>Content</CardContent>
          </Card>
        </div>
      );

      const greenCard = screen.getByTestId('gradient-green-card');
      const professionalCard = screen.getByTestId('professional-card');

      expect(greenCard).toBeInTheDocument();
      expect(professionalCard).toBeInTheDocument();

      // Check if gradient classes are applied
      expect(greenCard).toHaveClass('bg-gradient-to-br', 'from-green-50', 'to-green-100/50');
      expect(professionalCard).toHaveClass('shadow-lg', 'bg-white');
    });
  });

  describe('Badge Component', () => {
    it('renders gradient badge variants correctly', () => {
      render(
        <div>
          <Badge variant="gradient-green" data-testid="gradient-green-badge">
            Green Badge
          </Badge>
          <Badge variant="gradient-blue-light" data-testid="gradient-blue-light-badge">
            Blue Light Badge
          </Badge>
          <Badge variant="success" data-testid="success-badge">
            Success
          </Badge>
        </div>
      );

      const greenBadge = screen.getByTestId('gradient-green-badge');
      const blueLightBadge = screen.getByTestId('gradient-blue-light-badge');
      const successBadge = screen.getByTestId('success-badge');

      expect(greenBadge).toBeInTheDocument();
      expect(blueLightBadge).toBeInTheDocument();
      expect(successBadge).toBeInTheDocument();

      // Check if gradient classes are applied
      expect(greenBadge).toHaveClass('bg-gradient-to-r', 'from-green-500', 'to-teal-600');
      expect(blueLightBadge).toHaveClass('bg-blue-50', 'text-blue-700');
      expect(successBadge).toHaveClass('bg-gradient-to-r', 'from-green-500', 'to-emerald-600');
    });
  });

  describe('Input Component', () => {
    it('renders gradient input variants correctly', () => {
      render(
        <div>
          <Input variant="gradient-green" placeholder="Green input" data-testid="gradient-green-input" />
          <Input variant="gradient-blue" placeholder="Blue input" data-testid="gradient-blue-input" />
          <Input variant="default" placeholder="Default input" data-testid="default-input" />
        </div>
      );

      const greenInput = screen.getByTestId('gradient-green-input');
      const blueInput = screen.getByTestId('gradient-blue-input');
      const defaultInput = screen.getByTestId('default-input');

      expect(greenInput).toBeInTheDocument();
      expect(blueInput).toBeInTheDocument();
      expect(defaultInput).toBeInTheDocument();

      // Check if gradient focus classes are applied
      expect(greenInput).toHaveClass('focus-visible:ring-green-500/30', 'focus-visible:border-green-500');
      expect(blueInput).toHaveClass('focus-visible:ring-blue-500/30', 'focus-visible:border-blue-500');
    });
  });

  describe('Tabs Component', () => {
    it('renders gradient tabs variants correctly', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList variant="gradient-green" data-testid="gradient-tabs-list">
            <TabsTrigger variant="gradient-green" value="tab1" data-testid="gradient-tab-trigger">
              Tab 1
            </TabsTrigger>
            <TabsTrigger variant="gradient-green" value="tab2">
              Tab 2
            </TabsTrigger>
          </TabsList>
          <TabsContent variant="gradient-green" value="tab1" data-testid="gradient-tab-content">
            Tab 1 Content
          </TabsContent>
          <TabsContent variant="gradient-green" value="tab2">
            Tab 2 Content
          </TabsContent>
        </Tabs>
      );

      const tabsList = screen.getByTestId('gradient-tabs-list');
      const tabTrigger = screen.getByTestId('gradient-tab-trigger');
      const tabContent = screen.getByTestId('gradient-tab-content');

      expect(tabsList).toBeInTheDocument();
      expect(tabTrigger).toBeInTheDocument();
      expect(tabContent).toBeInTheDocument();

      // Check if gradient classes are applied
      expect(tabsList).toHaveClass('bg-gradient-to-r', 'from-green-50', 'via-teal-50', 'to-blue-50');
      expect(tabContent).toHaveClass('bg-gradient-to-br', 'from-green-50/30', 'to-white');
    });
  });

  describe('Component Integration', () => {
    it('renders all gradient components together correctly', () => {
      render(
        <Card variant="gradient-green" data-testid="integration-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Gradient Components Demo</CardTitle>
              <Badge variant="gradient-green-light">Active</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input variant="gradient-green" placeholder="Enter text..." />
            <div className="flex gap-2">
              <Button variant="gradient-green">Primary Action</Button>
              <Button variant="outline-gradient-green">Secondary Action</Button>
            </div>
            <Tabs defaultValue="demo">
              <TabsList variant="gradient-green">
                <TabsTrigger variant="gradient-green" value="demo">Demo</TabsTrigger>
                <TabsTrigger variant="gradient-green" value="settings">Settings</TabsTrigger>
              </TabsList>
              <TabsContent variant="gradient-green" value="demo">
                Demo content with gradient styling
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      );

      const integrationCard = screen.getByTestId('integration-card');
      expect(integrationCard).toBeInTheDocument();
      
      // Verify all components are rendered
      expect(screen.getByText('Gradient Components Demo')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter text...')).toBeInTheDocument();
      expect(screen.getByText('Primary Action')).toBeInTheDocument();
      expect(screen.getByText('Secondary Action')).toBeInTheDocument();
      expect(screen.getByText('Demo')).toBeInTheDocument();
      expect(screen.getByText('Demo content with gradient styling')).toBeInTheDocument();
    });
  });
});