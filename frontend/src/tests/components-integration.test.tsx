import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

// Test that all components can be imported and rendered without errors
describe('Component Integration Tests', () => {
  // Mock ResizeObserver for tests
  beforeAll(() => {
    global.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }));
  });

  test('ChartConfigPanel can be imported and rendered', async () => {
    const { ChartConfigPanel } = await import('../components/reports/ChartConfigPanel');
    
    const mockVisualization = {
      id: 'test',
      type: 'chart' as const,
      chartType: 'bar' as const,
      dimensions: [],
      measures: [],
      styling: {
        colors: ['#3b82f6'],
        showLegend: true,
        showGrid: true,
        title: 'Test Chart'
      },
      position: { x: 0, y: 0, width: 400, height: 300 }
    };

    expect(() => {
      render(
        <ChartConfigPanel
          visualization={mockVisualization}
          onUpdate={() => {}}
          onClose={() => {}}
        />
      );
    }).not.toThrow();
  });

  test('FilterBuilder can be imported and rendered', async () => {
    const { FilterBuilder } = await import('../components/reports/FilterBuilder');
    
    const mockDataSources = [{
      id: 'test',
      name: 'Test Data',
      type: 'table' as const,
      fields: [],
      relationships: []
    }];

    expect(() => {
      render(
        <FilterBuilder
          dataSources={mockDataSources}
          filters={[]}
          onFilterAdd={() => {}}
          onFilterUpdate={() => {}}
          onFilterRemove={() => {}}
        />
      );
    }).not.toThrow();
  });

  test('LayoutDesigner can be imported and rendered', async () => {
    const { LayoutDesigner } = await import('../components/reports/LayoutDesigner');
    
    const mockLayout = {
      width: 1200,
      height: 800,
      components: []
    };

    const mockStyling = {
      theme: 'light' as const,
      primaryColor: '#3b82f6',
      backgroundColor: '#ffffff',
      fontFamily: 'Inter',
      fontSize: 14
    };

    expect(() => {
      render(
        <LayoutDesigner
          layout={mockLayout}
          styling={mockStyling}
          visualizations={[]}
          onLayoutUpdate={() => {}}
          onStylingUpdate={() => {}}
          onVisualizationUpdate={() => {}}
        />
      );
    }).not.toThrow();
  });

  test('ReportBuilder can be imported and rendered', async () => {
    const { ReportBuilder } = await import('../components/reports/ReportBuilder');
    
    expect(() => {
      render(
        <ReportBuilder
          availableDataSources={[]}
          onSave={() => {}}
          onPreview={() => {}}
          onCancel={() => {}}
        />
      );
    }).not.toThrow();
  });
});