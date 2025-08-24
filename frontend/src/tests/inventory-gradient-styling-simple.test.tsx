import React from 'react';
import { render, screen } from '@testing-library/react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Package, Plus, SlidersHorizontal, Layers } from 'lucide-react';

describe('Inventory Gradient Styling Components', () => {
  test('Card component renders with gradient variants', () => {
    const { rerender } = render(<Card variant="gradient-green" data-testid="gradient-card" />);
    
    const card = screen.getByTestId('gradient-card');
    expect(card).toHaveClass('bg-gradient-to-br', 'from-green-50', 'to-green-100/50', 'shadow-lg', 'hover:shadow-xl');

    rerender(<Card variant="professional" data-testid="professional-card" />);
    const professionalCard = screen.getByTestId('professional-card');
    expect(professionalCard).toHaveClass('shadow-lg', 'bg-white', 'hover:shadow-xl');

    rerender(<Card variant="filter" data-testid="filter-card" />);
    const filterCard = screen.getByTestId('filter-card');
    expect(filterCard).toHaveClass('bg-gradient-to-r', 'from-slate-50', 'to-slate-100/80');
  });

  test('Button component renders with gradient variants', () => {
    const { rerender } = render(
      <Button variant="gradient-green" data-testid="gradient-button">
        Test Button
      </Button>
    );
    
    const button = screen.getByTestId('gradient-button');
    expect(button).toHaveClass('bg-gradient-to-r', 'from-green-500', 'to-teal-600', 'shadow-lg', 'hover:shadow-xl');

    rerender(
      <Button variant="outline-gradient-green" data-testid="outline-gradient-button">
        Outline Button
      </Button>
    );
    const outlineButton = screen.getByTestId('outline-gradient-button');
    expect(outlineButton).toHaveClass('border-2', 'border-transparent', 'bg-gradient-to-r');

    rerender(
      <Button variant="icon-gradient-green" data-testid="icon-gradient-button">
        <Plus className="h-4 w-4" />
      </Button>
    );
    const iconButton = screen.getByTestId('icon-gradient-button');
    expect(iconButton).toHaveClass('bg-gradient-to-br', 'from-green-500', 'to-green-600', 'shadow-lg');
  });

  test('Tabs component renders with gradient variants', () => {
    render(
      <Tabs defaultValue="inventory">
        <TabsList variant="gradient-green" data-testid="gradient-tabs-list">
          <TabsTrigger variant="gradient-green" value="inventory" data-testid="gradient-tab-trigger">
            <Package className="h-4 w-4" />
            Inventory Items
          </TabsTrigger>
          <TabsTrigger variant="gradient-green" value="categories">
            <Layers className="h-4 w-4" />
            Categories
          </TabsTrigger>
        </TabsList>
        <TabsContent variant="gradient-green" value="inventory" data-testid="gradient-tab-content">
          Content
        </TabsContent>
      </Tabs>
    );

    const tabsList = screen.getByTestId('gradient-tabs-list');
    expect(tabsList).toHaveClass('bg-gradient-to-r', 'from-green-50', 'via-teal-50', 'to-blue-50');

    const tabTrigger = screen.getByTestId('gradient-tab-trigger');
    expect(tabTrigger).toHaveClass('data-[state=active]:border-2', 'data-[state=active]:border-green-300');

    const tabContent = screen.getByTestId('gradient-tab-content');
    expect(tabContent).toHaveClass('bg-gradient-to-br', 'from-green-50/30', 'to-white');
  });

  test('renders inventory header structure with gradient elements', () => {
    render(
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center shadow-lg" data-testid="header-icon">
          <Package className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent" data-testid="header-title">
            Inventory Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your gold jewelry inventory with modern tools and insights
          </p>
        </div>
      </div>
    );

    const headerIcon = screen.getByTestId('header-icon');
    expect(headerIcon).toHaveClass('bg-gradient-to-br', 'from-green-500', 'to-teal-600', 'shadow-lg');

    const headerTitle = screen.getByTestId('header-title');
    expect(headerTitle).toHaveClass('bg-gradient-to-r', 'from-green-600', 'to-teal-600', 'bg-clip-text', 'text-transparent');
  });

  test('renders loading state with gradient spinner', () => {
    render(
      <div className="relative mx-auto mb-4" data-testid="loading-container">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-transparent bg-gradient-to-r from-green-500 to-teal-600 bg-clip-border" data-testid="gradient-spinner"></div>
        <div className="absolute inset-0 animate-spin rounded-full h-8 w-8 border-2 border-transparent border-t-green-500"></div>
      </div>
    );

    const spinner = screen.getByTestId('gradient-spinner');
    expect(spinner).toHaveClass('animate-spin', 'bg-gradient-to-r', 'from-green-500', 'to-teal-600');
  });

  test('renders error state with gradient icon', () => {
    render(
      <div className="text-center space-y-4">
        <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg mx-auto" data-testid="error-icon">
          <Package className="h-6 w-6 text-white" />
        </div>
        <div className="text-red-600 font-medium">
          Failed to load inventory items. Please try again.
        </div>
      </div>
    );

    const errorIcon = screen.getByTestId('error-icon');
    expect(errorIcon).toHaveClass('bg-gradient-to-br', 'from-red-500', 'to-red-600', 'shadow-lg');
  });

  test('renders empty state with gradient elements', () => {
    render(
      <div className="text-center space-y-4">
        <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center shadow-lg mx-auto" data-testid="empty-icon">
          <Package className="h-8 w-8 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">No inventory items found</h3>
          <p className="text-muted-foreground">
            Add your first item to get started with inventory management.
          </p>
        </div>
        <Button variant="gradient-green" data-testid="add-first-button">
          <Plus className="h-4 w-4 mr-2" />
          Add First Item
        </Button>
      </div>
    );

    const emptyIcon = screen.getByTestId('empty-icon');
    expect(emptyIcon).toHaveClass('bg-gradient-to-br', 'from-green-500', 'to-teal-600', 'shadow-lg');

    const addFirstButton = screen.getByTestId('add-first-button');
    expect(addFirstButton).toHaveClass('bg-gradient-to-r', 'from-green-500', 'to-teal-600');
  });

  test('renders enhanced input styling', () => {
    render(
      <input
        className="pl-10 border-0 bg-white/80 shadow-sm focus:shadow-md transition-all duration-300"
        placeholder="Search inventory items..."
        data-testid="enhanced-input"
      />
    );

    const input = screen.getByTestId('enhanced-input');
    expect(input).toHaveClass('border-0', 'bg-white/80', 'shadow-sm', 'focus:shadow-md', 'transition-all', 'duration-300');
  });

  test('renders enhanced badge styling', () => {
    render(
      <span className="font-mono bg-white/80 shadow-sm" data-testid="enhanced-badge">
        10 items
      </span>
    );

    const badge = screen.getByTestId('enhanced-badge');
    expect(badge).toHaveClass('bg-white/80', 'shadow-sm');
  });
});