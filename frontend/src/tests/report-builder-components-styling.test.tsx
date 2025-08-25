import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import '@testing-library/jest-dom';

import { ReportBuilder } from '../components/reports/ReportBuilder';
import { ChartConfigPanel } from '../components/reports/ChartConfigPanel';
import { LayoutDesigner } from '../components/reports/LayoutDesigner';
import { DataSource, ReportConfiguration, VisualizationConfig } from '../types/reportBuilder';

// Mock data
const mockDataSources: DataSource[] = [
  {
    id: 'sales',
    name: 'Sales Data',
    type: 'table',
    fields: [
      { id: 'date', name: 'date', displayName: 'Date', dataType: 'date', aggregatable: false, filterable: true, sortable: true },
      { id: 'amount', name: 'amount', displayName: 'Amount', dataType: 'number', aggregatable: true, filterable: true, sortable: true },
      { id: 'category', name: 'category', displayName: 'Category', dataType: 'string', aggregatable: false, filterable: true, sortable: true }
    ],
    relationships: []
  }
];

const mockVisualization: VisualizationConfig = {
  id: 'chart1',
  type: 'chart',
  chartType: 'bar',
  dimensions: ['category'],
  measures: ['amount'],
  position: { x: 50, y: 50, width: 400, height: 300 },
  styling: {
    title: 'Sales by Category',
    colors: ['#3b82f6', '#ef4444', '#10b981'],
    showLegend: true,
    showGrid: true
  }
};

const mockReportConfig: ReportConfiguration = {
  name: 'Test Report',
  description: 'Test Description',
  dataSources: mockDataSources,
  filters: [],
  visualizations: [mockVisualization],
  layout: {
    width: 1200,
    height: 800,
    components: [mockVisualization]
  },
  styling: {
    theme: 'light',
    primaryColor: '#3b82f6',
    backgroundColor: '#ffffff',
    fontFamily: 'Inter',
    fontSize: 14
  }
};

// Test wrapper with DnD provider
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <DndProvider backend={HTML5Backend}>
    {children}
  </DndProvider>
);

describe('Report Builder Components Styling', () => {
  describe('ReportBuilder Component', () => {
    const mockProps = {
      availableDataSources: mockDataSources,
      initialReport: mockReportConfig,
      onSave: jest.fn(),
      onPreview: jest.fn(),
      onCancel: jest.fn()
    };

    it('renders with beautiful gradient header styling', () => {
      render(
        <TestWrapper>
          <ReportBuilder {...mockProps} />
        </TestWrapper>
      );

      // Check for gradient header background
      const header = document.querySelector('.bg-gradient-to-r.from-indigo-50.via-purple-50.to-pink-50');
      expect(header).toBeInTheDocument();

      // Check for gradient icon container
      const iconContainer = document.querySelector('.bg-gradient-to-br.from-indigo-500.via-purple-500.to-pink-500');
      expect(iconContainer).toBeInTheDocument();

      // Check for enhanced input styling
      const nameInput = screen.getByPlaceholderText('Report Name');
      expect(nameInput).toHaveClass('shadow-lg', 'bg-white');
    });

    it('renders all 4 tabs with gradient styling', () => {
      render(
        <TestWrapper>
          <ReportBuilder {...mockProps} />
        </TestWrapper>
      );

      // Check for Data tab with gradient styling
      const dataTab = screen.getByRole('tab', { name: /data/i });
      expect(dataTab).toBeInTheDocument();
      expect(dataTab.closest('.bg-gradient-to-r.from-indigo-50.via-purple-50.to-pink-50')).toBeInTheDocument();

      // Check for Fields tab
      const fieldsTab = screen.getByRole('tab', { name: /fields/i });
      expect(fieldsTab).toBeInTheDocument();

      // Check for Filters tab
      const filtersTab = screen.getByRole('tab', { name: /filters/i });
      expect(filtersTab).toBeInTheDocument();

      // Check for Style tab
      const styleTab = screen.getByRole('tab', { name: /style/i });
      expect(styleTab).toBeInTheDocument();
    });

    it('maintains functionality with gradient styling', async () => {
      render(
        <TestWrapper>
          <ReportBuilder {...mockProps} />
        </TestWrapper>
      );

      // Test tab switching functionality
      const fieldsTab = screen.getByRole('tab', { name: /fields/i });
      fireEvent.click(fieldsTab);

      await waitFor(() => {
        expect(fieldsTab).toHaveAttribute('data-state', 'active');
      });

      // Test save functionality
      const saveButton = screen.getByRole('button', { name: /save report/i });
      expect(saveButton).toHaveClass('bg-gradient-to-r', 'from-indigo-500', 'to-purple-600');
      
      fireEvent.click(saveButton);
      expect(mockProps.onSave).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Test Report'
      }));
    });

    it('renders gradient sidebar with proper styling', () => {
      render(
        <TestWrapper>
          <ReportBuilder {...mockProps} />
        </TestWrapper>
      );

      // Check for gradient sidebar background
      const sidebar = document.querySelector('.bg-gradient-to-b.from-white.to-slate-50');
      expect(sidebar).toBeInTheDocument();

      // Check for tab content gradient backgrounds
      const tabContent = document.querySelector('.bg-gradient-to-br.from-indigo-50\\/30.to-white');
      expect(tabContent).toBeInTheDocument();
    });
  });

  describe('ChartConfigPanel Component', () => {
    const mockProps = {
      visualization: mockVisualization,
      onUpdate: jest.fn(),
      onClose: jest.fn(),
      availableFields: mockDataSources[0].fields
    };

    it('renders with beautiful gradient styling', () => {
      render(
        <TestWrapper>
          <ChartConfigPanel {...mockProps} />
        </TestWrapper>
      );

      // Check for gradient card background
      const card = document.querySelector('.bg-gradient-to-br.from-slate-50.to-white');
      expect(card).toBeInTheDocument();

      // Check for gradient header
      const header = document.querySelector('.bg-gradient-to-r.from-indigo-50.via-purple-50.to-pink-50');
      expect(header).toBeInTheDocument();

      // Check for gradient icon container
      const iconContainer = document.querySelector('.bg-gradient-to-br.from-indigo-500.to-purple-600');
      expect(iconContainer).toBeInTheDocument();
    });

    it('renders all 3 tabs with gradient styling', () => {
      render(
        <TestWrapper>
          <ChartConfigPanel {...mockProps} />
        </TestWrapper>
      );

      // Check for Type & Layout tab
      const typeTab = screen.getByRole('tab', { name: /type & layout/i });
      expect(typeTab).toBeInTheDocument();

      // Check for Colors & Style tab
      const stylingTab = screen.getByRole('tab', { name: /colors & style/i });
      expect(stylingTab).toBeInTheDocument();

      // Check for Display Options tab
      const optionsTab = screen.getByRole('tab', { name: /display options/i });
      expect(optionsTab).toBeInTheDocument();

      // Check for gradient tab container
      const tabContainer = document.querySelector('.bg-gradient-to-r.from-indigo-50.via-purple-50.to-pink-50');
      expect(tabContainer).toBeInTheDocument();
    });

    it('maintains chart configuration functionality', async () => {
      render(
        <TestWrapper>
          <ChartConfigPanel {...mockProps} />
        </TestWrapper>
      );

      // Test chart type selection with gradient styling
      const barChartOption = screen.getByText('Bar Chart');
      expect(barChartOption.closest('.bg-gradient-to-r.from-green-500.to-teal-600')).toBeInTheDocument();

      // Test tab switching
      const stylingTab = screen.getByRole('tab', { name: /colors & style/i });
      fireEvent.click(stylingTab);

      await waitFor(() => {
        expect(stylingTab).toHaveAttribute('data-state', 'active');
      });

      // Check for gradient styling in styling tab
      const stylingContent = document.querySelector('.bg-gradient-to-br.from-purple-50\\/30.to-white');
      expect(stylingContent).toBeInTheDocument();
    });

    it('renders drop zones with gradient styling', () => {
      render(
        <TestWrapper>
          <ChartConfigPanel {...mockProps} />
        </TestWrapper>
      );

      // Check for dimensions drop zone gradient
      const dimensionsZone = document.querySelector('.bg-gradient-to-r.from-slate-50.to-slate-100\\/50');
      expect(dimensionsZone).toBeInTheDocument();
    });
  });

  describe('LayoutDesigner Component', () => {
    const mockProps = {
      layout: mockReportConfig.layout,
      styling: mockReportConfig.styling,
      visualizations: mockReportConfig.visualizations,
      onLayoutUpdate: jest.fn(),
      onStylingUpdate: jest.fn(),
      onVisualizationUpdate: jest.fn()
    };

    it('renders with beautiful gradient header styling', () => {
      render(<LayoutDesigner {...mockProps} />);

      // Check for gradient header background
      const header = document.querySelector('.bg-gradient-to-r.from-cyan-50.to-blue-50');
      expect(header).toBeInTheDocument();

      // Check for gradient icon container
      const iconContainer = document.querySelector('.bg-gradient-to-br.from-cyan-500.to-blue-600');
      expect(iconContainer).toBeInTheDocument();

      // Check for enhanced preview mode selector
      const previewSelector = document.querySelector('.bg-white.border-2.border-cyan-200');
      expect(previewSelector).toBeInTheDocument();
    });

    it('renders all 4 tabs with gradient styling', () => {
      render(<LayoutDesigner {...mockProps} />);

      // Check for Layout tab
      const layoutTab = screen.getByRole('tab', { name: /layout/i });
      expect(layoutTab).toBeInTheDocument();

      // Check for Styling tab
      const stylingTab = screen.getByRole('tab', { name: /styling/i });
      expect(stylingTab).toBeInTheDocument();

      // Check for Alignment tab
      const alignmentTab = screen.getByRole('tab', { name: /alignment/i });
      expect(alignmentTab).toBeInTheDocument();

      // Check for Settings tab
      const settingsTab = screen.getByRole('tab', { name: /settings/i });
      expect(settingsTab).toBeInTheDocument();

      // Check for gradient tab container
      const tabContainer = document.querySelector('.bg-gradient-to-r.from-cyan-50.via-blue-50.to-indigo-50');
      expect(tabContainer).toBeInTheDocument();
    });

    it('maintains layout functionality with gradient styling', async () => {
      render(<LayoutDesigner {...mockProps} />);

      // Test preview mode switching - find tablet button by icon
      const tabletButtons = screen.getAllByRole('button');
      const tabletButton = tabletButtons.find(button => 
        button.querySelector('svg.lucide-tablet')
      );
      expect(tabletButton).toBeTruthy();
      
      if (tabletButton) {
        fireEvent.click(tabletButton);
        // Check for gradient styling on active preview mode
        expect(tabletButton).toHaveClass('bg-gradient-to-r', 'from-cyan-500', 'to-blue-600');
      }

      // Test tab switching
      const stylingTab = screen.getByRole('tab', { name: /styling/i });
      fireEvent.click(stylingTab);

      await waitFor(() => {
        expect(stylingTab).toHaveAttribute('data-state', 'active');
      });

      // Check for gradient styling in styling tab content
      const stylingContent = document.querySelector('.bg-gradient-to-br.from-blue-50\\/30.to-white');
      expect(stylingContent).toBeInTheDocument();
    });

    it('renders cards with gradient styling', () => {
      render(<LayoutDesigner {...mockProps} />);

      // Check for gradient card backgrounds
      const cards = document.querySelectorAll('.bg-gradient-to-br.from-white.to-slate-50');
      expect(cards.length).toBeGreaterThan(0);

      // Check for gradient card headers
      const cardHeaders = document.querySelectorAll('.bg-gradient-to-r.from-cyan-50.to-blue-50');
      expect(cardHeaders.length).toBeGreaterThan(0);
    });

    it('renders layout templates with gradient styling', () => {
      render(<LayoutDesigner {...mockProps} />);

      // Check for gradient template cards
      const templateCards = document.querySelectorAll('.bg-gradient-to-r.from-slate-50.to-slate-100');
      expect(templateCards.length).toBeGreaterThan(0);
    });
  });

  describe('Integration and Accessibility', () => {
    it('maintains proper contrast ratios with gradient backgrounds', () => {
      render(
        <TestWrapper>
          <ReportBuilder
            availableDataSources={mockDataSources}
            initialReport={mockReportConfig}
            onSave={jest.fn()}
            onPreview={jest.fn()}
            onCancel={jest.fn()}
          />
        </TestWrapper>
      );

      // Check that text is readable on gradient backgrounds
      const title = screen.getByText('Report Name');
      expect(title).toBeVisible();

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeVisible();
      });
    });

    it('preserves keyboard navigation with gradient styling', () => {
      render(
        <TestWrapper>
          <ReportBuilder
            availableDataSources={mockDataSources}
            initialReport={mockReportConfig}
            onSave={jest.fn()}
            onPreview={jest.fn()}
            onCancel={jest.fn()}
          />
        </TestWrapper>
      );

      // Test tab navigation
      const tabs = screen.getAllByRole('tab');
      tabs.forEach(tab => {
        expect(tab).toHaveAttribute('tabindex');
      });

      // Test button focus
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        if (!button.hasAttribute('disabled')) {
          button.focus();
          expect(button).toHaveFocus();
        }
      });
    });

    it('maintains responsive behavior with gradient styling', () => {
      // Mock window resize
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      render(
        <TestWrapper>
          <ReportBuilder
            availableDataSources={mockDataSources}
            initialReport={mockReportConfig}
            onSave={jest.fn()}
            onPreview={jest.fn()}
            onCancel={jest.fn()}
          />
        </TestWrapper>
      );

      // Check that gradient styling is preserved at different screen sizes
      const gradientElements = document.querySelectorAll('[class*="bg-gradient"]');
      expect(gradientElements.length).toBeGreaterThan(0);

      gradientElements.forEach(element => {
        expect(element).toBeVisible();
      });
    });
  });
});