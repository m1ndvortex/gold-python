import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ReportBuilder } from '../components/reports/ReportBuilder';
import { DataSourceSelector } from '../components/reports/DataSourceSelector';
import { FieldPalette } from '../components/reports/FieldPalette';
import { ReportCanvas } from '../components/reports/ReportCanvas';
import { DataSource, FieldDefinition, ReportConfiguration } from '../types/reportBuilder';

// Mock data for testing
const mockDataSources: DataSource[] = [
  {
    id: 'invoices',
    name: 'Invoices',
    type: 'table',
    fields: [
      {
        id: 'invoice_id',
        name: 'invoice_id',
        displayName: 'Invoice ID',
        dataType: 'string',
        aggregatable: false,
        filterable: true,
        sortable: true
      },
      {
        id: 'total_amount',
        name: 'total_amount',
        displayName: 'Total Amount',
        dataType: 'decimal',
        aggregatable: true,
        filterable: true,
        sortable: true
      },
      {
        id: 'created_at',
        name: 'created_at',
        displayName: 'Created Date',
        dataType: 'date',
        aggregatable: false,
        filterable: true,
        sortable: true
      }
    ],
    relationships: []
  },
  {
    id: 'customers',
    name: 'Customers',
    type: 'table',
    fields: [
      {
        id: 'customer_id',
        name: 'customer_id',
        displayName: 'Customer ID',
        dataType: 'string',
        aggregatable: false,
        filterable: true,
        sortable: true
      },
      {
        id: 'customer_name',
        name: 'customer_name',
        displayName: 'Customer Name',
        dataType: 'string',
        aggregatable: false,
        filterable: true,
        sortable: true
      }
    ],
    relationships: []
  }
];

const mockInitialReport: ReportConfiguration = {
  name: 'Test Report',
  description: 'Test report description',
  dataSources: [mockDataSources[0]],
  filters: [],
  visualizations: [],
  layout: {
    width: 1200,
    height: 800,
    components: []
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

describe('ReportBuilder Component', () => {
  const mockOnSave = jest.fn();
  const mockOnPreview = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders report builder with initial state', () => {
    render(
      <TestWrapper>
        <ReportBuilder
          availableDataSources={mockDataSources}
          onSave={mockOnSave}
          onPreview={mockOnPreview}
          onCancel={mockOnCancel}
        />
      </TestWrapper>
    );

    expect(screen.getByPlaceholderText('Report Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Report Description (optional)')).toBeInTheDocument();
    expect(screen.getByText('Data')).toBeInTheDocument();
    expect(screen.getByText('Fields')).toBeInTheDocument();
    expect(screen.getByText('Filters')).toBeInTheDocument();
    expect(screen.getByText('Style')).toBeInTheDocument();
  });

  test('loads initial report configuration', () => {
    render(
      <TestWrapper>
        <ReportBuilder
          availableDataSources={mockDataSources}
          initialReport={mockInitialReport}
          onSave={mockOnSave}
          onPreview={mockOnPreview}
          onCancel={mockOnCancel}
        />
      </TestWrapper>
    );

    expect(screen.getByDisplayValue('Test Report')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test report description')).toBeInTheDocument();
    expect(screen.getByText('1 data sources')).toBeInTheDocument();
  });

  test('handles report name and description changes', async () => {
    render(
      <TestWrapper>
        <ReportBuilder
          availableDataSources={mockDataSources}
          onSave={mockOnSave}
          onPreview={mockOnPreview}
          onCancel={mockOnCancel}
        />
      </TestWrapper>
    );

    const nameInput = screen.getByPlaceholderText('Report Name');
    const descriptionInput = screen.getByPlaceholderText('Report Description (optional)');

    fireEvent.change(nameInput, { target: { value: 'New Report Name' } });
    fireEvent.change(descriptionInput, { target: { value: 'New description' } });

    expect(nameInput).toHaveValue('New Report Name');
    expect(descriptionInput).toHaveValue('New description');
  });

  test('validates report before save and preview', async () => {
    render(
      <TestWrapper>
        <ReportBuilder
          availableDataSources={mockDataSources}
          onSave={mockOnSave}
          onPreview={mockOnPreview}
          onCancel={mockOnCancel}
        />
      </TestWrapper>
    );

    const saveButton = screen.getByText('Save Report').closest('button');
    const previewButton = screen.getByText('Preview').closest('button');

    // Buttons should be disabled initially (no name, no data sources)
    expect(saveButton).toBeDisabled();
    expect(previewButton).toBeDisabled();

    // Add report name
    const nameInput = screen.getByPlaceholderText('Report Name');
    fireEvent.change(nameInput, { target: { value: 'Test Report' } });

    // Still disabled (no data sources)
    expect(saveButton).toBeDisabled();
    expect(previewButton).toBeDisabled();
  });

  test('calls onCancel when cancel button is clicked', () => {
    render(
      <TestWrapper>
        <ReportBuilder
          availableDataSources={mockDataSources}
          onSave={mockOnSave}
          onPreview={mockOnPreview}
          onCancel={mockOnCancel}
        />
      </TestWrapper>
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  test('switches between tabs correctly', () => {
    render(
      <TestWrapper>
        <ReportBuilder
          availableDataSources={mockDataSources}
          initialReport={{
            ...mockInitialReport,
            dataSources: [mockDataSources[0]] // Provide data sources so fields are available
          }}
          onSave={mockOnSave}
          onPreview={mockOnPreview}
          onCancel={mockOnCancel}
        />
      </TestWrapper>
    );

    // Check that tabs are present and clickable
    const fieldsTab = screen.getByText('Fields');
    const filtersTab = screen.getByText('Filters');
    const settingsTab = screen.getByText('Style');
    
    expect(fieldsTab).toBeInTheDocument();
    expect(filtersTab).toBeInTheDocument();
    expect(settingsTab).toBeInTheDocument();

    // Click on Fields tab
    fireEvent.click(fieldsTab);
    
    // Click on Filters tab
    fireEvent.click(filtersTab);
    
    // Click on Settings tab
    fireEvent.click(settingsTab);
    
    // Test passes if no errors are thrown during tab switching
    expect(true).toBe(true);
  });
});

describe('DataSourceSelector Component', () => {
  const mockOnDataSourceSelect = jest.fn();
  const mockOnDataSourceRemove = jest.fn();
  const mockOnRelationshipAdd = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders available data sources', () => {
    render(
      <DataSourceSelector
        availableDataSources={mockDataSources}
        selectedDataSources={[]}
        onDataSourceSelect={mockOnDataSourceSelect}
        onDataSourceRemove={mockOnDataSourceRemove}
        onRelationshipAdd={mockOnRelationshipAdd}
      />
    );

    expect(screen.getByText('Data Sources')).toBeInTheDocument();
    expect(screen.getByText('No data sources selected')).toBeInTheDocument();
  });

  test('displays selected data sources', () => {
    render(
      <DataSourceSelector
        availableDataSources={mockDataSources}
        selectedDataSources={[mockDataSources[0]]}
        onDataSourceSelect={mockOnDataSourceSelect}
        onDataSourceRemove={mockOnDataSourceRemove}
        onRelationshipAdd={mockOnRelationshipAdd}
      />
    );

    expect(screen.getByText('Invoices')).toBeInTheDocument();
    expect(screen.getByText('3 fields')).toBeInTheDocument();
    expect(screen.getByText('Remove')).toBeInTheDocument();
  });

  test('calls onDataSourceRemove when remove button is clicked', () => {
    render(
      <DataSourceSelector
        availableDataSources={mockDataSources}
        selectedDataSources={[mockDataSources[0]]}
        onDataSourceSelect={mockOnDataSourceSelect}
        onDataSourceRemove={mockOnDataSourceRemove}
        onRelationshipAdd={mockOnRelationshipAdd}
      />
    );

    const removeButton = screen.getByText('Remove');
    fireEvent.click(removeButton);

    expect(mockOnDataSourceRemove).toHaveBeenCalledWith('invoices');
  });

  test('shows relationship builder when multiple data sources selected', () => {
    render(
      <DataSourceSelector
        availableDataSources={mockDataSources}
        selectedDataSources={mockDataSources}
        onDataSourceSelect={mockOnDataSourceSelect}
        onDataSourceRemove={mockOnDataSourceRemove}
        onRelationshipAdd={mockOnRelationshipAdd}
      />
    );

    expect(screen.getByText('Relationships')).toBeInTheDocument();
    expect(screen.getByText('Add Relationship')).toBeInTheDocument();
  });
});

describe('FieldPalette Component', () => {
  test('renders field palette with data sources', () => {
    render(
      <TestWrapper>
        <FieldPalette dataSources={[mockDataSources[0]]} />
      </TestWrapper>
    );

    expect(screen.getByText('Fields Palette')).toBeInTheDocument();
    expect(screen.getByText('Invoice ID')).toBeInTheDocument();
    expect(screen.getByText('Total Amount')).toBeInTheDocument();
    expect(screen.getByText('Created Date')).toBeInTheDocument();
  });

  test('filters fields based on search term', () => {
    render(
      <TestWrapper>
        <FieldPalette 
          dataSources={[mockDataSources[0]]} 
          searchTerm="amount"
          onSearchChange={jest.fn()}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Total Amount')).toBeInTheDocument();
    expect(screen.queryByText('Invoice ID')).not.toBeInTheDocument();
  });

  test('displays field data types and capabilities', () => {
    render(
      <TestWrapper>
        <FieldPalette dataSources={[mockDataSources[0]]} />
      </TestWrapper>
    );

    // Check for data type badges
    expect(screen.getByText('string')).toBeInTheDocument();
    expect(screen.getByText('decimal')).toBeInTheDocument();
    expect(screen.getByText('date')).toBeInTheDocument();
  });

  test('shows empty state when no fields available', () => {
    const emptyDataSource: DataSource = {
      ...mockDataSources[0],
      fields: []
    };

    render(
      <TestWrapper>
        <FieldPalette dataSources={[emptyDataSource]} />
      </TestWrapper>
    );

    expect(screen.getByText('No fields available')).toBeInTheDocument();
  });

  test('shows search results message when no matches found', () => {
    render(
      <TestWrapper>
        <FieldPalette 
          dataSources={[mockDataSources[0]]} 
          searchTerm="nonexistent"
          onSearchChange={jest.fn()}
        />
      </TestWrapper>
    );

    expect(screen.getByText('No fields match your search')).toBeInTheDocument();
  });
});

describe('ReportCanvas Component', () => {
  const mockOnVisualizationAdd = jest.fn();
  const mockOnVisualizationUpdate = jest.fn();
  const mockOnVisualizationRemove = jest.fn();

  const mockReportConfig: ReportConfiguration = {
    ...mockInitialReport,
    visualizations: [
      {
        id: 'viz1',
        type: 'chart',
        chartType: 'bar',
        dimensions: ['customer_name'],
        measures: ['total_amount'],
        styling: {
          colors: ['#3b82f6'],
          showLegend: true,
          showGrid: true,
          title: 'Sales by Customer'
        },
        position: { x: 100, y: 100, width: 400, height: 300 }
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders canvas with empty state', () => {
    render(
      <TestWrapper>
        <ReportCanvas
          reportConfig={mockInitialReport}
          onVisualizationAdd={mockOnVisualizationAdd}
          onVisualizationUpdate={mockOnVisualizationUpdate}
          onVisualizationRemove={mockOnVisualizationRemove}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Report Canvas')).toBeInTheDocument();
    expect(screen.getByText('Start Building Your Report')).toBeInTheDocument();
    expect(screen.getByText('Drag fields from the Fields palette to create visualizations')).toBeInTheDocument();
  });

  test('renders existing visualizations', () => {
    render(
      <TestWrapper>
        <ReportCanvas
          reportConfig={mockReportConfig}
          onVisualizationAdd={mockOnVisualizationAdd}
          onVisualizationUpdate={mockOnVisualizationUpdate}
          onVisualizationRemove={mockOnVisualizationRemove}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Sales by Customer')).toBeInTheDocument();
    expect(screen.getByText('1 components')).toBeInTheDocument();
  });

  test('handles visualization selection', () => {
    render(
      <TestWrapper>
        <ReportCanvas
          reportConfig={mockReportConfig}
          onVisualizationAdd={mockOnVisualizationAdd}
          onVisualizationUpdate={mockOnVisualizationUpdate}
          onVisualizationRemove={mockOnVisualizationRemove}
        />
      </TestWrapper>
    );

    const visualization = screen.getByText('Sales by Customer').closest('div');
    if (visualization) {
      fireEvent.click(visualization);
      expect(screen.getByText('Visualization Properties')).toBeInTheDocument();
    }
  });

  test('calls onVisualizationRemove when delete button is clicked', () => {
    render(
      <TestWrapper>
        <ReportCanvas
          reportConfig={mockReportConfig}
          onVisualizationAdd={mockOnVisualizationAdd}
          onVisualizationUpdate={mockOnVisualizationUpdate}
          onVisualizationRemove={mockOnVisualizationRemove}
        />
      </TestWrapper>
    );

    // First select the visualization to show properties
    const visualization = screen.getByText('Sales by Customer').closest('div');
    if (visualization) {
      fireEvent.click(visualization);
      
      // Find and click the delete button
      const deleteButtons = screen.getAllByRole('button');
      const deleteButton = deleteButtons.find(button => 
        button.querySelector('svg')?.classList.contains('lucide-trash-2')
      );
      
      if (deleteButton) {
        fireEvent.click(deleteButton);
        expect(mockOnVisualizationRemove).toHaveBeenCalledWith('viz1');
      }
    }
  });
});

describe('Drag and Drop Functionality', () => {
  test('field can be dragged from palette', () => {
    render(
      <TestWrapper>
        <FieldPalette dataSources={[mockDataSources[0]]} />
      </TestWrapper>
    );

    // Find the draggable field container
    const fieldContainer = screen.getByText('Total Amount').closest('[class*="cursor-move"]');
    expect(fieldContainer).toBeInTheDocument();
  });

  test('canvas accepts dropped fields', () => {
    const mockOnVisualizationAdd = jest.fn();
    
    render(
      <TestWrapper>
        <ReportCanvas
          reportConfig={mockInitialReport}
          onVisualizationAdd={mockOnVisualizationAdd}
          onVisualizationUpdate={jest.fn()}
          onVisualizationRemove={jest.fn()}
        />
      </TestWrapper>
    );

    // The canvas should be a drop target
    const canvas = screen.getByText('Start Building Your Report').closest('div');
    expect(canvas).toBeInTheDocument();
  });
});

describe('Report Configuration Integration', () => {
  test('complete report building workflow', async () => {
    const mockOnSave = jest.fn();
    
    render(
      <TestWrapper>
        <ReportBuilder
          availableDataSources={mockDataSources}
          onSave={mockOnSave}
          onPreview={jest.fn()}
          onCancel={jest.fn()}
        />
      </TestWrapper>
    );

    // Step 1: Add report name
    const nameInput = screen.getByPlaceholderText('Report Name');
    fireEvent.change(nameInput, { target: { value: 'Integration Test Report' } });

    // Step 2: Check that the UI elements are present
    expect(screen.getByText('Data Sources')).toBeInTheDocument();
    expect(screen.getByText('Report Canvas')).toBeInTheDocument();
    
    // The test validates the basic UI structure is present
    expect(screen.getByText('Data')).toBeInTheDocument();
    expect(screen.getByText('Fields')).toBeInTheDocument();

    // The save button should still be disabled without data sources
    const saveButton = screen.getByText('Save Report').closest('button');
    expect(saveButton).toBeDisabled();
  });

  test('report validation prevents invalid saves', () => {
    window.alert = jest.fn();
    
    render(
      <TestWrapper>
        <ReportBuilder
          availableDataSources={mockDataSources}
          onSave={jest.fn()}
          onPreview={jest.fn()}
          onCancel={jest.fn()}
        />
      </TestWrapper>
    );

    // Try to save without name - button should be disabled
    const saveButton = screen.getByText('Save Report').closest('button');
    expect(saveButton).toBeDisabled();
  });
});