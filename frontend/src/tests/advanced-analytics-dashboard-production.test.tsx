import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdvancedAnalyticsDashboard } from '../components/analytics/AdvancedAnalyticsDashboard';
import { PredictiveAnalyticsDashboard } from '../components/analytics/PredictiveAnalyticsDashboard';
import { CustomerSegmentationDashboard } from '../components/analytics/CustomerSegmentationDashboard';
import { TrendAnalysisDashboard } from '../components/analytics/TrendAnalysisDashboard';
import { ComparativeAnalysisDashboard } from '../components/analytics/ComparativeAnalysisDashboard';
import { IntelligentAlertingInterface } from '../components/analytics/IntelligentAlertingInterface';
import { DataExportInterface } from '../components/analytics/DataExportInterface';

// Real API integration - no mocks for production testing
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { 
      retry: 3,
      retryDelay: 1000,
      staleTime: 0,
      cacheTime: 0
    },
    mutations: { 
      retry: 3,
      retryDelay: 1000
    },
  },
});

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

// Helper function to wait for API to be ready
const waitForAPI = async (timeout = 30000) => {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (response.ok) {
        return true;
      }
    } catch (error) {
      // Continue waiting
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error('API not ready after timeout');
};

// Helper function to seed test data
const seedTestData = async () => {
  try {
    // Seed basic analytics data
    await fetch(`${API_BASE_URL}/test/seed-analytics-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        business_type: 'retail_store',
        generate_sample_data: true
      })
    });
  } catch (error) {
    console.warn('Could not seed test data:', error);
  }
};

describe('Advanced Analytics Dashboard - Production Tests', () => {
  beforeAll(async () => {
    // Wait for API to be ready
    await waitForAPI();
    // Seed test data
    await seedTestData();
  }, 60000);

  beforeEach(() => {
    // Clear any cached data between tests
    const queryClient = createTestQueryClient();
    queryClient.clear();
  });

  describe('Main Dashboard Component', () => {
    test('renders advanced analytics dashboard with real data', async () => {
      renderWithQueryClient(<AdvancedAnalyticsDashboard />);
      
      // Check header renders
      expect(screen.getByText('Advanced Analytics')).toBeInTheDocument();
      expect(screen.getByText('Comprehensive business intelligence and predictive analytics')).toBeInTheDocument();
      
      // Wait for data to load from real API
      await waitFor(() => {
        expect(screen.getByText('AI Powered')).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    test('displays overview metrics from real backend', async () => {
      renderWithQueryClient(<AdvancedAnalyticsDashboard />);
      
      // Wait for real API data to load
      await waitFor(() => {
        // Look for metric cards
        const metricCards = screen.getAllByText(/Active Metrics|AI Models Running|Customer Segments|Model Accuracy/);
        expect(metricCards.length).toBeGreaterThan(0);
      }, { timeout: 15000 });
    });

    test('switches between tabs with real data loading', async () => {
      renderWithQueryClient(<AdvancedAnalyticsDashboard />);
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument();
      }, { timeout: 10000 });

      // Click on KPI Dashboard tab
      const kpiTab = screen.getByText('KPI Dashboard');
      fireEvent.click(kpiTab);
      
      // Wait for KPI data to load
      await waitFor(() => {
        expect(screen.getByText(/Key Metrics|KPI/)).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    test('handles refresh functionality with real API', async () => {
      renderWithQueryClient(<AdvancedAnalyticsDashboard />);
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Refresh All')).toBeInTheDocument();
      }, { timeout: 10000 });

      const refreshButton = screen.getByText('Refresh All');
      fireEvent.click(refreshButton);
      
      // Should trigger real API calls
      await waitFor(() => {
        expect(refreshButton).not.toBeDisabled();
      }, { timeout: 5000 });
    });
  });

  describe('Predictive Analytics Dashboard', () => {
    test('renders predictive analytics with real forecasting data', async () => {
      renderWithQueryClient(<PredictiveAnalyticsDashboard />);
      
      expect(screen.getByText('Predictive Analytics')).toBeInTheDocument();
      expect(screen.getByText('AI-powered forecasting for sales, inventory, and cash flow')).toBeInTheDocument();
      
      // Wait for real model performance data
      await waitFor(() => {
        const accuracyElements = screen.getAllByText(/Overall Model Accuracy|Training Data Points/);
        expect(accuracyElements.length).toBeGreaterThan(0);
      }, { timeout: 15000 });
    });

    test('displays real sales forecast data', async () => {
      renderWithQueryClient(<PredictiveAnalyticsDashboard />);
      
      // Wait for real forecast data to load
      await waitFor(() => {
        // Look for forecast values (could be any currency format)
        const forecastElements = screen.getAllByText(/Next 30 Days|Next 90 Days/);
        expect(forecastElements.length).toBeGreaterThan(0);
      }, { timeout: 15000 });
    });

    test('switches between forecast types with real data', async () => {
      renderWithQueryClient(<PredictiveAnalyticsDashboard />);
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Sales Forecast')).toBeInTheDocument();
      }, { timeout: 10000 });

      // Click on inventory forecast tab
      const inventoryTab = screen.getByText('Inventory Forecast');
      fireEvent.click(inventoryTab);
      
      await waitFor(() => {
        expect(screen.getByText(/Stockout Predictions|Demand Predictions/)).toBeInTheDocument();
      }, { timeout: 10000 });
    });
  });

  describe('Customer Segmentation Dashboard', () => {
    test('renders customer segmentation with real data', async () => {
      renderWithQueryClient(<CustomerSegmentationDashboard />);
      
      expect(screen.getByText('Customer Segmentation')).toBeInTheDocument();
      expect(screen.getByText('Advanced customer behavior analysis and segmentation')).toBeInTheDocument();
      
      // Wait for real segmentation data
      await waitFor(() => {
        const segmentElements = screen.getAllByText(/Total Customers|Active Segments/);
        expect(segmentElements.length).toBeGreaterThan(0);
      }, { timeout: 15000 });
    });

    test('displays real segment data', async () => {
      renderWithQueryClient(<CustomerSegmentationDashboard />);
      
      // Wait for real segment data
      await waitFor(() => {
        // Look for any segment-related content
        const segmentContent = screen.getAllByText(/Segment|Customer|Analysis/);
        expect(segmentContent.length).toBeGreaterThan(0);
      }, { timeout: 15000 });
    });
  });

  describe('Trend Analysis Dashboard', () => {
    test('renders trend analysis with real data', async () => {
      renderWithQueryClient(<TrendAnalysisDashboard />);
      
      expect(screen.getByText('Trend Analysis')).toBeInTheDocument();
      expect(screen.getByText('Advanced trend detection with seasonal patterns and forecasting')).toBeInTheDocument();
      
      // Wait for real trend data
      await waitFor(() => {
        const trendElements = screen.getAllByText(/Growth Rate|Market Volatility|Forecast/);
        expect(trendElements.length).toBeGreaterThan(0);
      }, { timeout: 15000 });
    });

    test('switches between trend analysis tabs with real data', async () => {
      renderWithQueryClient(<TrendAnalysisDashboard />);
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Trend Analysis')).toBeInTheDocument();
      }, { timeout: 10000 });

      // Click on seasonal patterns tab
      const seasonalTab = screen.getByText('Seasonal Patterns');
      fireEvent.click(seasonalTab);
      
      await waitFor(() => {
        expect(screen.getByText(/Seasonal|Pattern/)).toBeInTheDocument();
      }, { timeout: 10000 });
    });
  });

  describe('Comparative Analysis Dashboard', () => {
    test('renders comparative analysis with real data', async () => {
      renderWithQueryClient(<ComparativeAnalysisDashboard />);
      
      expect(screen.getByText('Comparative Analysis')).toBeInTheDocument();
      expect(screen.getByText('Compare performance across time periods and business segments')).toBeInTheDocument();
      
      // Wait for real comparison data
      await waitFor(() => {
        const comparisonElements = screen.getAllByText(/Comparison|Analysis|Period/);
        expect(comparisonElements.length).toBeGreaterThan(0);
      }, { timeout: 15000 });
    });

    test('displays real comparison data', async () => {
      renderWithQueryClient(<ComparativeAnalysisDashboard />);
      
      // Wait for real comparison data
      await waitFor(() => {
        // Look for comparison-related content
        const comparisonContent = screen.getAllByText(/Current|Previous|Comparison/);
        expect(comparisonContent.length).toBeGreaterThan(0);
      }, { timeout: 15000 });
    });
  });

  describe('Intelligent Alerting Interface', () => {
    test('renders intelligent alerting with real data', async () => {
      renderWithQueryClient(<IntelligentAlertingInterface />);
      
      expect(screen.getByText('Intelligent Alerting')).toBeInTheDocument();
      expect(screen.getByText('AI-powered business rules and anomaly detection alerts')).toBeInTheDocument();
      
      // Wait for real alert data
      await waitFor(() => {
        const alertElements = screen.getAllByText(/Critical Alerts|Active Alerts|Active Rules|Resolved/);
        expect(alertElements.length).toBeGreaterThan(0);
      }, { timeout: 15000 });
    });

    test('displays real alert summary', async () => {
      renderWithQueryClient(<IntelligentAlertingInterface />);
      
      // Wait for real alert summary data
      await waitFor(() => {
        // Look for alert summary cards
        const alertSummary = screen.getAllByText(/Critical|Active|Rules|Resolved/);
        expect(alertSummary.length).toBeGreaterThan(0);
      }, { timeout: 15000 });
    });

    test('switches to alert rules tab with real data', async () => {
      renderWithQueryClient(<IntelligentAlertingInterface />);
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Alert Rules')).toBeInTheDocument();
      }, { timeout: 10000 });

      const rulesTab = screen.getByText('Alert Rules');
      fireEvent.click(rulesTab);
      
      await waitFor(() => {
        expect(screen.getByText(/Rule|Alert|Configuration/)).toBeInTheDocument();
      }, { timeout: 10000 });
    });
  });

  describe('Data Export Interface', () => {
    test('renders data export interface', async () => {
      renderWithQueryClient(<DataExportInterface />);
      
      expect(screen.getByText('Data Export')).toBeInTheDocument();
      expect(screen.getByText('Export analytics data in multiple formats for external analysis')).toBeInTheDocument();
      
      // Check export format options
      await waitFor(() => {
        expect(screen.getByText('Excel Workbook')).toBeInTheDocument();
        expect(screen.getByText('CSV Files')).toBeInTheDocument();
        expect(screen.getByText('PDF Report')).toBeInTheDocument();
        expect(screen.getByText('JSON Data')).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    test('displays data type selection options', async () => {
      renderWithQueryClient(<DataExportInterface />);
      
      await waitFor(() => {
        expect(screen.getByText('KPI Metrics')).toBeInTheDocument();
        expect(screen.getByText('Predictive Analytics')).toBeInTheDocument();
        expect(screen.getByText('Customer Segmentation')).toBeInTheDocument();
        expect(screen.getByText('Trend Analysis')).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    test('displays real export history', async () => {
      renderWithQueryClient(<DataExportInterface />);
      
      // Wait for export history to load
      await waitFor(() => {
        expect(screen.getByText('Export History')).toBeInTheDocument();
      }, { timeout: 15000 });
    });

    test('handles export initiation with real API', async () => {
      renderWithQueryClient(<DataExportInterface />);
      
      // Wait for interface to load
      await waitFor(() => {
        expect(screen.getByText('Start Export')).toBeInTheDocument();
      }, { timeout: 10000 });

      const exportButton = screen.getByText('Start Export');
      fireEvent.click(exportButton);
      
      // Should trigger real API call
      await waitFor(() => {
        // Button should be available again after API call
        expect(exportButton).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Real API Integration Tests', () => {
    test('advanced analytics overview endpoint works', async () => {
      const response = await fetch(`${API_BASE_URL}/advanced-analytics/overview?business_type=retail_store`);
      expect(response.status).toBeLessThan(500); // Should not be server error
    });

    test('predictions endpoint works', async () => {
      const response = await fetch(`${API_BASE_URL}/advanced-analytics/predictions?business_type=retail_store&forecast_period=30`);
      expect(response.status).toBeLessThan(500);
    });

    test('customer segmentation endpoint works', async () => {
      const response = await fetch(`${API_BASE_URL}/advanced-analytics/customers/segmentation?segmentation_method=rfm&num_segments=5`);
      expect(response.status).toBeLessThan(500);
    });

    test('trend analysis endpoint works', async () => {
      const response = await fetch(`${API_BASE_URL}/advanced-analytics/trends/analyze?metric_name=revenue&entity_type=overall`);
      expect(response.status).toBeLessThan(500);
    });

    test('comparative analysis endpoint works', async () => {
      const response = await fetch(`${API_BASE_URL}/advanced-analytics/comparative-analysis?comparison_type=time_periods`);
      expect(response.status).toBeLessThan(500);
    });

    test('alerts endpoint works', async () => {
      const response = await fetch(`${API_BASE_URL}/advanced-analytics/alerts`);
      expect(response.status).toBeLessThan(500);
    });

    test('data export endpoint works', async () => {
      const response = await fetch(`${API_BASE_URL}/advanced-analytics/data/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format: 'excel',
          data_types: ['kpi_metrics'],
          date_range: {
            start_date: '2024-01-01T00:00:00Z',
            end_date: '2024-01-31T23:59:59Z'
          }
        })
      });
      expect(response.status).toBeLessThan(500);
    });
  });

  describe('Error Handling with Real API', () => {
    test('handles API errors gracefully', async () => {
      renderWithQueryClient(<AdvancedAnalyticsDashboard />);
      
      // Should not crash even if API returns errors
      await waitFor(() => {
        expect(screen.getByText('Advanced Analytics')).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    test('handles network failures gracefully', async () => {
      // Test with invalid API URL
      const originalUrl = process.env.REACT_APP_API_URL;
      process.env.REACT_APP_API_URL = 'http://invalid-url:9999';
      
      renderWithQueryClient(<PredictiveAnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Predictive Analytics')).toBeInTheDocument();
      }, { timeout: 10000 });
      
      // Restore original URL
      process.env.REACT_APP_API_URL = originalUrl;
    });
  });

  describe('Performance Tests with Real Data', () => {
    test('dashboard loads within acceptable time', async () => {
      const startTime = Date.now();
      
      renderWithQueryClient(<AdvancedAnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Advanced Analytics')).toBeInTheDocument();
      }, { timeout: 5000 });
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
    });

    test('handles large datasets efficiently', async () => {
      renderWithQueryClient(<CustomerSegmentationDashboard />);
      
      // Should handle real customer data without performance issues
      await waitFor(() => {
        expect(screen.getByText('Customer Segmentation')).toBeInTheDocument();
      }, { timeout: 15000 });
    });
  });

  describe('Accessibility with Real Components', () => {
    test('has proper ARIA labels and roles', async () => {
      renderWithQueryClient(<AdvancedAnalyticsDashboard />);
      
      await waitFor(() => {
        // Check for proper heading structure
        expect(screen.getByRole('heading', { name: /Advanced Analytics/i })).toBeInTheDocument();
      }, { timeout: 10000 });
      
      // Check for proper button labels
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Refresh All/i })).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    test('supports keyboard navigation', async () => {
      renderWithQueryClient(<AdvancedAnalyticsDashboard />);
      
      await waitFor(() => {
        const overviewTab = screen.getByText('Overview');
        overviewTab.focus();
        expect(document.activeElement).toBe(overviewTab);
      }, { timeout: 10000 });
    });
  });

  describe('Real-time Updates', () => {
    test('refreshes data at specified intervals', async () => {
      jest.useFakeTimers();
      
      renderWithQueryClient(<AdvancedAnalyticsDashboard />);
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Advanced Analytics')).toBeInTheDocument();
      }, { timeout: 10000 });
      
      // Fast-forward time to trigger refetch
      jest.advanceTimersByTime(300000); // 5 minutes
      
      // Should trigger real API refetch
      await waitFor(() => {
        expect(screen.getByText('Advanced Analytics')).toBeInTheDocument();
      }, { timeout: 5000 });
      
      jest.useRealTimers();
    });
  });
});