import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
// Mock dependencies
const mockToast = {
  success: jest.fn(),
  error: jest.fn()
};
import { ChartExportMenu } from '@/components/analytics/charts/ChartExportMenu';
import { ChartAnnotations } from '@/components/analytics/charts/ChartAnnotations';
import { InteractiveChart } from '@/components/analytics/charts/InteractiveChart';
import { chartExportService } from '@/services/chartExportService';
import { toast } from 'sonner';

jest.mock('sonner', () => ({
  toast: mockToast
}));

jest.mock('html2canvas', () => ({
  __esModule: true,
  default: jest.fn(() => Promise.resolve({
    toBlob: jest.fn((callback) => {
      const blob = new Blob(['fake-image'], { type: 'image/png' });
      callback(blob);
    }),
    toDataURL: jest.fn(() => 'data:image/png;base64,fake-data'),
    width: 800,
    height: 600
  }))
}));

jest.mock('jspdf', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    addImage: jest.fn(),
    save: jest.fn(),
    setProperties: jest.fn()
  }))
}));

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:fake-url');
global.URL.revokeObjectURL = jest.fn();

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(() => Promise.resolve())
  }
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
global.localStorage = localStorageMock as any;

describe('Chart Export and Sharing', () => {
  const mockChartData = [
    { name: 'Jan', value: 100 },
    { name: 'Feb', value: 150 },
    { name: 'Mar', value: 120 },
    { name: 'Apr', value: 180 }
  ];

  const mockChartConfig = {
    type: 'line',
    data: mockChartData,
    title: 'Test Chart',
    description: 'Test chart description'
  };

  let mockChartElement: HTMLDivElement;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
    // Create mock chart element
    mockChartElement = document.createElement('div');
    mockChartElement.innerHTML = '<svg><rect width="100" height="100" /></svg>';
    document.body.appendChild(mockChartElement);
  });

  afterEach(() => {
    document.body.removeChild(mockChartElement);
  });

  describe('ChartExportMenu', () => {
    it('renders export menu with all format options', () => {
      render(
        <ChartExportMenu
          chartElement={mockChartElement}
          chartData={mockChartData}
          chartConfig={mockChartConfig}
        />
      );

      const exportButton = screen.getByRole('button');
      fireEvent.click(exportButton);

      expect(screen.getByText('Export as PNG')).toBeInTheDocument();
      expect(screen.getByText('Export as SVG')).toBeInTheDocument();
      expect(screen.getByText('Export as PDF')).toBeInTheDocument();
      expect(screen.getByText('Export Data (CSV)')).toBeInTheDocument();
      expect(screen.getByText('Share & Embed')).toBeInTheDocument();
    });

    it('exports chart as PNG successfully', async () => {
      const user = userEvent.setup();
      const onExportComplete = jest.fn();

      render(
        <ChartExportMenu
          chartElement={mockChartElement}
          chartData={mockChartData}
          chartConfig={mockChartConfig}
          onExportComplete={onExportComplete}
        />
      );

      const exportButton = screen.getByRole('button');
      await user.click(exportButton);

      const pngOption = screen.getByText('Export as PNG');
      await user.click(pngOption);

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Chart exported as PNG');
        expect(onExportComplete).toHaveBeenCalled();
      });
    });

    it('exports chart as SVG successfully', async () => {
      const user = userEvent.setup();

      render(
        <ChartExportMenu
          chartElement={mockChartElement}
          chartData={mockChartData}
          chartConfig={mockChartConfig}
        />
      );

      const exportButton = screen.getByRole('button');
      await user.click(exportButton);

      const svgOption = screen.getByText('Export as SVG');
      await user.click(svgOption);

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Chart exported as SVG');
      });
    });

    it('exports chart data as CSV successfully', async () => {
      const user = userEvent.setup();

      render(
        <ChartExportMenu
          chartElement={mockChartElement}
          chartData={mockChartData}
          chartConfig={mockChartConfig}
        />
      );

      const exportButton = screen.getByRole('button');
      await user.click(exportButton);

      const csvOption = screen.getByText('Export Data (CSV)');
      await user.click(csvOption);

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Chart exported as CSV');
      });
    });

    it('shows error when export fails', async () => {
      const user = userEvent.setup();
      
      // Mock html2canvas to throw error
      const html2canvas = require('html2canvas');
      html2canvas.default.mockRejectedValueOnce(new Error('Export failed'));

      render(
        <ChartExportMenu
          chartElement={mockChartElement}
          chartData={mockChartData}
          chartConfig={mockChartConfig}
        />
      );

      const exportButton = screen.getByRole('button');
      await user.click(exportButton);

      const pngOption = screen.getByText('Export as PNG');
      await user.click(pngOption);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Export failed: Export failed');
      });
    });

    it('opens share dialog and generates share link', async () => {
      const user = userEvent.setup();
      const onShareComplete = jest.fn();

      render(
        <ChartExportMenu
          chartElement={mockChartElement}
          chartData={mockChartData}
          chartConfig={mockChartConfig}
          onShareComplete={onShareComplete}
        />
      );

      const exportButton = screen.getByRole('button');
      await user.click(exportButton);

      const shareOption = screen.getByText('Share & Embed');
      await user.click(shareOption);

      expect(screen.getByText('Share & Embed Chart')).toBeInTheDocument();

      // Fill in share options
      const titleInput = screen.getByLabelText('Title');
      await user.clear(titleInput);
      await user.type(titleInput, 'My Shared Chart');

      const descriptionInput = screen.getByLabelText('Description');
      await user.type(descriptionInput, 'This is a test chart');

      // Generate share link
      const generateButton = screen.getByText('Generate Share Link');
      await user.click(generateButton);

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Share link generated');
        expect(onShareComplete).toHaveBeenCalled();
      });
    });

    it('generates embed code with custom options', async () => {
      const user = userEvent.setup();

      render(
        <ChartExportMenu
          chartElement={mockChartElement}
          chartData={mockChartData}
          chartConfig={mockChartConfig}
        />
      );

      const exportButton = screen.getByRole('button');
      await user.click(exportButton);

      const shareOption = screen.getByText('Share & Embed');
      await user.click(shareOption);

      // Switch to embed tab
      const embedTab = screen.getByText('Embed Code');
      await user.click(embedTab);

      // Modify embed options
      const widthInput = screen.getByLabelText('Width (px)');
      await user.clear(widthInput);
      await user.type(widthInput, '1000');

      const heightInput = screen.getByLabelText('Height (px)');
      await user.clear(heightInput);
      await user.type(heightInput, '700');

      // Generate embed code
      const generateButton = screen.getByText('Generate Embed Code');
      await user.click(generateButton);

      expect(screen.getByDisplayValue(/width="1000"/)).toBeInTheDocument();
      expect(screen.getByDisplayValue(/height="700"/)).toBeInTheDocument();
    });

    it('copies share link to clipboard', async () => {
      const user = userEvent.setup();

      render(
        <ChartExportMenu
          chartElement={mockChartElement}
          chartData={mockChartData}
          chartConfig={mockChartConfig}
        />
      );

      const exportButton = screen.getByRole('button');
      await user.click(exportButton);

      const shareOption = screen.getByText('Share & Embed');
      await user.click(shareOption);

      // Generate share link first
      const generateButton = screen.getByText('Generate Share Link');
      await user.click(generateButton);

      await waitFor(async () => {
        const copyButton = screen.getByRole('button', { name: /copy/i });
        await user.click(copyButton);

        expect(navigator.clipboard.writeText).toHaveBeenCalled();
        expect(mockToast.success).toHaveBeenCalledWith('Share link copied to clipboard');
      });
    });
  });

  describe('ChartAnnotations', () => {
    const mockUser = {
      name: 'Test User',
      avatar: 'test-avatar.jpg'
    };

    beforeEach(() => {
      localStorageMock.getItem.mockReturnValue('[]');
    });

    it('renders annotation controls', () => {
      render(
        <ChartAnnotations
          chartId="test-chart"
          chartElement={mockChartElement}
          currentUser={mockUser}
        />
      );

      expect(screen.getByText('Add Annotation')).toBeInTheDocument();
      expect(screen.getByText('Show')).toBeInTheDocument();
      expect(screen.getByText('0 annotations')).toBeInTheDocument();
    });

    it('enters annotation mode when add button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <ChartAnnotations
          chartId="test-chart"
          chartElement={mockChartElement}
          currentUser={mockUser}
        />
      );

      const addButton = screen.getByText('Add Annotation');
      await user.click(addButton);

      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('creates annotation when chart is clicked in annotation mode', async () => {
      const user = userEvent.setup();
      const onAnnotationCreate = jest.fn();

      render(
        <ChartAnnotations
          chartId="test-chart"
          chartElement={mockChartElement}
          currentUser={mockUser}
          onAnnotationCreate={onAnnotationCreate}
        />
      );

      // Enter annotation mode
      const addButton = screen.getByText('Add Annotation');
      await user.click(addButton);

      // Simulate chart click
      const overlay = document.querySelector('.cursor-crosshair');
      expect(overlay).toBeInTheDocument();

      fireEvent.click(overlay!, { clientX: 100, clientY: 100 });

      // Fill annotation form
      await waitFor(() => {
        expect(screen.getByText('Add Annotation')).toBeInTheDocument();
      });

      const textInput = screen.getByLabelText('Text');
      await user.type(textInput, 'This is a test annotation');

      const createButton = screen.getByText('Create Annotation');
      await user.click(createButton);

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Annotation created');
        expect(onAnnotationCreate).toHaveBeenCalled();
      });
    });

    it('displays existing annotations', () => {
      const existingAnnotations = [
        {
          id: 'ann1',
          chartId: 'test-chart',
          x: 100,
          y: 100,
          text: 'Test annotation',
          author: 'Test User',
          type: 'note',
          createdAt: new Date().toISOString(),
          replies: []
        }
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingAnnotations));

      render(
        <ChartAnnotations
          chartId="test-chart"
          chartElement={mockChartElement}
          currentUser={mockUser}
        />
      );

      expect(screen.getByText('1 annotation')).toBeInTheDocument();
      expect(screen.getByText('Test annotation')).toBeInTheDocument();
    });

    it('opens annotation details when marker is clicked', async () => {
      const user = userEvent.setup();
      const existingAnnotations = [
        {
          id: 'ann1',
          chartId: 'test-chart',
          x: 100,
          y: 100,
          text: 'Test annotation',
          author: 'Test User',
          type: 'note',
          createdAt: new Date().toISOString(),
          replies: []
        }
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingAnnotations));

      render(
        <ChartAnnotations
          chartId="test-chart"
          chartElement={mockChartElement}
          currentUser={mockUser}
        />
      );

      // Click on annotation marker
      const annotationMarker = screen.getByRole('button');
      await user.click(annotationMarker);

      expect(screen.getByText('Annotation')).toBeInTheDocument();
      expect(screen.getByText('Test annotation')).toBeInTheDocument();
    });

    it('adds reply to annotation', async () => {
      const user = userEvent.setup();
      const existingAnnotations = [
        {
          id: 'ann1',
          chartId: 'test-chart',
          x: 100,
          y: 100,
          text: 'Test annotation',
          author: 'Test User',
          type: 'note',
          createdAt: new Date().toISOString(),
          replies: []
        }
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingAnnotations));

      render(
        <ChartAnnotations
          chartId="test-chart"
          chartElement={mockChartElement}
          currentUser={mockUser}
        />
      );

      // Open annotation details
      const annotationMarker = screen.getByRole('button');
      await user.click(annotationMarker);

      // Add reply
      const replyInput = screen.getByLabelText('Add Reply');
      await user.type(replyInput, 'This is a reply');

      const replyButton = screen.getByText('Reply');
      await user.click(replyButton);

      expect(mockToast.success).toHaveBeenCalledWith('Annotation updated');
    });

    it('deletes annotation', async () => {
      const user = userEvent.setup();
      const onAnnotationDelete = jest.fn();
      const existingAnnotations = [
        {
          id: 'ann1',
          chartId: 'test-chart',
          x: 100,
          y: 100,
          text: 'Test annotation',
          author: 'Test User',
          type: 'note',
          createdAt: new Date().toISOString(),
          replies: []
        }
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingAnnotations));

      render(
        <ChartAnnotations
          chartId="test-chart"
          chartElement={mockChartElement}
          currentUser={mockUser}
          onAnnotationDelete={onAnnotationDelete}
        />
      );

      // Open annotation details
      const annotationMarker = screen.getByRole('button');
      await user.click(annotationMarker);

      // Open menu and delete
      const menuButton = screen.getByRole('button', { name: /more/i });
      await user.click(menuButton);

      const deleteButton = screen.getByText('Delete');
      await user.click(deleteButton);

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Annotation deleted');
        expect(onAnnotationDelete).toHaveBeenCalledWith('ann1');
      });
    });

    it('toggles annotation visibility', async () => {
      const user = userEvent.setup();
      const existingAnnotations = [
        {
          id: 'ann1',
          chartId: 'test-chart',
          x: 100,
          y: 100,
          text: 'Test annotation',
          author: 'Test User',
          type: 'note',
          createdAt: new Date().toISOString(),
          replies: []
        }
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingAnnotations));

      render(
        <ChartAnnotations
          chartId="test-chart"
          chartElement={mockChartElement}
          currentUser={mockUser}
        />
      );

      // Initially showing annotations
      expect(screen.getByText('Hide')).toBeInTheDocument();

      // Hide annotations
      const toggleButton = screen.getByText('Hide');
      await user.click(toggleButton);

      expect(screen.getByText('Show')).toBeInTheDocument();
    });

    it('respects read-only mode', () => {
      render(
        <ChartAnnotations
          chartId="test-chart"
          chartElement={mockChartElement}
          currentUser={mockUser}
          readOnly={true}
        />
      );

      const addButton = screen.getByText('Add Annotation');
      expect(addButton).toBeDisabled();
    });
  });

  describe('InteractiveChart with Export and Annotations', () => {
    it('renders chart with export and annotation controls', () => {
      render(
        <InteractiveChart
          data={mockChartData}
          type="line"
          title="Test Chart"
          enableExport={true}
          enableAnnotations={true}
        />
      );

      expect(screen.getByText('Test Chart')).toBeInTheDocument();
      
      // Export button should be present
      const exportButtons = screen.getAllByRole('button');
      expect(exportButtons.length).toBeGreaterThan(0);
    });

    it('shows annotation overlay when annotations are enabled', async () => {
      const user = userEvent.setup();

      render(
        <InteractiveChart
          data={mockChartData}
          type="line"
          title="Test Chart"
          enableAnnotations={true}
        />
      );

      // Click annotation toggle button
      const annotationButton = screen.getByRole('button', { name: /message/i });
      await user.click(annotationButton);

      expect(screen.getByText('Add Annotation')).toBeInTheDocument();
    });

    it('integrates export functionality', async () => {
      const user = userEvent.setup();
      const onExportComplete = jest.fn();

      render(
        <InteractiveChart
          data={mockChartData}
          type="line"
          title="Test Chart"
          enableExport={true}
          export={{
            enabled: true,
            formats: ['png', 'svg', 'pdf', 'csv'],
            onExport: onExportComplete
          }}
        />
      );

      // Find and click export button
      const exportButton = screen.getByRole('button', { name: /download/i });
      await user.click(exportButton);

      expect(screen.getByText('Export as PNG')).toBeInTheDocument();
    });
  });

  describe('ChartExportService', () => {
    it('generates unique share IDs', () => {
      const id1 = chartExportService['generateShareId']();
      const id2 = chartExportService['generateShareId']();
      
      expect(id1).not.toBe(id2);
      expect(id1.length).toBeGreaterThan(0);
      expect(id2.length).toBeGreaterThan(0);
    });

    it('creates and retrieves annotations', () => {
      const chartId = 'test-chart';
      const annotation = {
        x: 100,
        y: 100,
        text: 'Test annotation',
        author: 'Test User',
        type: 'note' as const
      };

      const annotationId = chartExportService.createAnnotation(chartId, annotation);
      expect(annotationId).toBeTruthy();

      const annotations = chartExportService.getAnnotations(chartId);
      expect(annotations).toHaveLength(1);
      expect(annotations[0].text).toBe('Test annotation');
    });

    it('deletes annotations', () => {
      const chartId = 'test-chart';
      const annotation = {
        x: 100,
        y: 100,
        text: 'Test annotation',
        author: 'Test User',
        type: 'note' as const
      };

      const annotationId = chartExportService.createAnnotation(chartId, annotation);
      
      let annotations = chartExportService.getAnnotations(chartId);
      expect(annotations).toHaveLength(1);

      const deleted = chartExportService.deleteAnnotation(chartId, annotationId);
      expect(deleted).toBe(true);

      annotations = chartExportService.getAnnotations(chartId);
      expect(annotations).toHaveLength(0);
    });

    it('generates embed code with correct parameters', () => {
      const chartId = 'test-chart';
      const options = {
        width: 1000,
        height: 700,
        theme: 'dark' as const,
        interactive: false,
        showControls: false
      };

      const embedCode = chartExportService.generateEmbedCode(chartId, options);
      
      expect(embedCode).toContain('width="1000"');
      expect(embedCode).toContain('height="700"');
      expect(embedCode).toContain('theme=dark');
      expect(embedCode).toContain('interactive=false');
      expect(embedCode).toContain('controls=false');
    });

    it('handles batch export', async () => {
      const charts = [
        {
          element: mockChartElement,
          data: mockChartData,
          filename: 'chart1.png'
        },
        {
          element: mockChartElement,
          data: mockChartData,
          filename: 'chart2.png'
        }
      ];

      const results = await chartExportService.batchExport(charts, 'png');
      
      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
    });
  });
});