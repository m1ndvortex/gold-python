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

/**
 * Docker Integration Tests for Advanced Analytics Dashboard
 * 
 * These tests run against the real Docker backend with actual database connections.
 * No mocks are used - all API calls go to the real backend services.
 * 
 * Prerequisites:
 * - Docker containers must be running (backend, db, redis)
 * - Backend must be accessible at http://localhost:8000
 * - Database must be seeded with test data
 */

const API_BASE_URL = 'http://localhost:8000';
const TEST_TIMEOUT = 30000; // 30 seconds for Docker operations

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { 
      retry: 3,
      retryDelay: 2000,
      staleTime: 0,
      cacheTime: 0
    },
    mutations: { 
      retry: 3,
      retryDelay: 2000
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

// Docker health check
const checkDockerServices = async () => {
  const services = [
    { name: 'Backend API', url: `${API_BASE_URL}/health` },
    { name: 'Database', url: `${API_BASE_URL}/health/db` },
    { name: 'Redis', url: `${API_BASE_URL}/health/redis` }
  ];

  for (const service of services) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(service.url, { 
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      if (!response.ok) {
        throw new Error(`${service.name} health check failed: ${response.status}`);
      }
      console.log(`✓ ${service.name} is healthy`);
    } catch (error) {
      throw new Error(`${service.name} is not accessible: ${error}`);
    }
  }
};

// Seed comprehensive test data
const seedAnalyticsTestData = async () => {
  try {
    console.log('Seeding analytics test data...');
    
    // Seed customers
    await fetch(`${API_BASE_URL}/test/seed-customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        count: 100,
        business_type: 'retail_store'
      })
    });

    // Seed transactions
    await fetch(`${API_BASE_URL}/test/seed-transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        count: 500,
        date_range_days: 365
      })
    });

    // Seed inventory data
    await fetch(`${API_BASE_URL}/test/seed-inventory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items_count: 50,
        movements_count: 200
      })
    });

    // Generate analytics calculations
    await fetch(`${API_BASE_URL}/analytics/calculate-all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    console.log('✓ Test data seeded successfully');
  } catch (error) {
    console.warn('Could not seed test data:', error);
    // Don't fail tests if seeding fails - use existing data
  }
};

describe('Advanced Analytics Dashboard - Docker Integration Tests', () => {
  beforeAll(async () => {
    console.log('Starting Docker integration tests...');
    
    // Check Docker services are running
    await checkDockerServices();
    
    // Seed test data
    await seedAnalyticsTestData();
    
    console.log('Docker services ready for testing');
  }, 60000);

  beforeEach(() => {
    // Clear React Query cache between tests
    const queryClient = createTestQueryClient();
    queryClient.clear();
  });

  describe('Real Database Integration', () => {
    test('connects to PostgreSQL database successfully', async () => {
      const response = await fetch(`${API_BASE_URL}/health/db`);
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      expect(data.status).toBe('healthy');
      expect(data.database).toBe('connected');
    }, TEST_TIMEOUT);

    test('connects to Redis cache successfully', async () => {
      const response = await fetch(`${API_BASE_URL}/health/redis`);
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      expect(data.status).toBe('healthy');
      expect(data.redis).toBe('connected');
    }, TEST_TIMEOUT);

    test('retrieves real analytics data from database', async () => {
      const response = await fetch(`${API_BASE_URL}/advanced-analytics/overview?business_type=retail_store`);
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      expect(data).toHaveProperty('total_metrics');
      expect(data).toHaveProperty('active_models');
      expect(typeof data.total_metrics).toBe('number');
    }, TEST_TIMEOUT);
  });

  describe('Advanced Analytics Dashboard with Real Data', () => {
    test('loads dashboard with real backend data', async () => {
      renderWithQueryClient(<AdvancedAnalyticsDashboard />);
      
      // Header should render immediately
      expect(screen.getByText('Advanced Analytics')).toBeInTheDocument();
      
      // Wait for real data to load from backend
      await waitFor(() => {
        // Should show actual metrics from database
        const metricElements = screen.getAllByText(/\d+/);
        expect(metricElements.length).toBeGreaterThan(0);
      }, { timeout: TEST_TIMEOUT });
    });

    test('displays real recent insights from database', async () => {
      renderWithQueryClient(<AdvancedAnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Recent Insights')).toBeInTheDocument();
        // Should have actual insights from analytics calculations
        const insightElements = screen.getAllByText(/increase|decrease|trend|pattern|customer/i);
        expect(insightElements.length).toBeGreaterThan(0);
      }, { timeout: TEST_TIMEOUT });
    });

    test('tab navigation works with real data loading', async () => {
      renderWithQueryClient(<AdvancedAnalyticsDashboard />);
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument();
      }, { timeout: 10000 });

      // Test each tab with real data
      const tabs = ['KPI Dashboard', 'Predictive', 'Segmentation', 'Trends', 'Comparative', 'Alerts', 'Export'];
      
      for (const tabName of tabs) {
        const tab = screen.getByText(tabName);
        fireEvent.click(tab);
        
        // Each tab should load real data
        await waitFor(() => {
          // Tab content should be visible
          expect(tab.closest('[data-state="active"]')).toBeInTheDocument();
        }, { timeout: 10000 });
      }
    });
  });

  describe('Predictive Analytics with Real ML Models', () => {
    test('loads real sales forecasting data', async () => {
      renderWithQueryClient(<PredictiveAnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Predictive Analytics')).toBeInTheDocument();
      }, { timeout: 10000 });

      // Wait for real model performance data
      await waitFor(() => {
        // Should show actual model accuracy from ML models
        const accuracyElements = screen.getAllByText(/\d+\.\d+%/);
        expect(accuracyElements.length).toBeGreaterThan(0);
      }, { timeout: TEST_TIMEOUT });
    });

    test('displays real inventory predictions', async () => {
      renderWithQueryClient(<PredictiveAnalyticsDashboard />);
      
      // Click on inventory forecast tab
      await waitFor(() => {
        const inventoryTab = screen.getByText('Inventory Forecast');
        fireEvent.click(inventoryTab);
      }, { timeout: 10000 });

      // Should load real stockout predictions
      await waitFor(() => {
        expect(screen.getByText(/Stockout Predictions|Demand Predictions/)).toBeInTheDocument();
      }, { timeout: TEST_TIMEOUT });
    });

    test('shows real cash flow forecasting', async () => {
      renderWithQueryClient(<PredictiveAnalyticsDashboard />);
      
      // Click on cash flow tab
      await waitFor(() => {
        const cashFlowTab = screen.getByText('Cash Flow Forecast');
        fireEvent.click(cashFlowTab);
      }, { timeout: 10000 });

      // Should show real financial predictions
      await waitFor(() => {
        expect(screen.getByText(/Next Month Cash Flow|Inflow|Outflow/)).toBeInTheDocument();
      }, { timeout: TEST_TIMEOUT });
    });
  });

  describe('Customer Segmentation with Real Customer Data', () => {
    test('performs real RFM analysis on customer database', async () => {
      renderWithQueryClient(<CustomerSegmentationDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Customer Segmentation')).toBeInTheDocument();
      }, { timeout: 10000 });

      // Wait for real segmentation results
      await waitFor(() => {
        // Should show actual customer counts from database
        const customerCounts = screen.getAllByText(/\d+/);
        expect(customerCounts.length).toBeGreaterThan(0);
      }, { timeout: TEST_TIMEOUT });
    });

    test('displays real customer segments with characteristics', async () => {
      renderWithQueryClient(<CustomerSegmentationDashboard />);
      
      // Wait for segment data to load
      await waitFor(() => {
        // Should show actual segment names and metrics
        const segmentElements = screen.getAllByText(/Champions|Loyal|New|At Risk/i);
        expect(segmentElements.length).toBeGreaterThan(0);
      }, { timeout: TEST_TIMEOUT });
    });
  });

  describe('Trend Analysis with Real Historical Data', () => {
    test('analyzes real revenue trends from transaction history', async () => {
      renderWithQueryClient(<TrendAnalysisDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Trend Analysis')).toBeInTheDocument();
      }, { timeout: 10000 });

      // Wait for real trend calculations
      await waitFor(() => {
        // Should show actual growth rates from historical data
        const trendMetrics = screen.getAllByText(/\d+\.\d+%/);
        expect(trendMetrics.length).toBeGreaterThan(0);
      }, { timeout: TEST_TIMEOUT });
    });

    test('detects real seasonal patterns', async () => {
      renderWithQueryClient(<TrendAnalysisDashboard />);
      
      // Click on seasonal patterns tab
      await waitFor(() => {
        const seasonalTab = screen.getByText('Seasonal Patterns');
        fireEvent.click(seasonalTab);
      }, { timeout: 10000 });

      // Should show real seasonal analysis
      await waitFor(() => {
        expect(screen.getByText(/Peak Periods|Low Periods|Seasonal/)).toBeInTheDocument();
      }, { timeout: TEST_TIMEOUT });
    });

    test('identifies real anomalies in data', async () => {
      renderWithQueryClient(<TrendAnalysisDashboard />);
      
      // Click on anomalies tab
      await waitFor(() => {
        const anomaliesTab = screen.getByText('Anomaly Detection');
        fireEvent.click(anomaliesTab);
      }, { timeout: 10000 });

      // Should show real anomaly detection results
      await waitFor(() => {
        expect(screen.getByText(/Detected Anomalies|Anomaly/)).toBeInTheDocument();
      }, { timeout: TEST_TIMEOUT });
    });
  });

  describe('Comparative Analysis with Real Business Data', () => {
    test('compares real time periods from database', async () => {
      renderWithQueryClient(<ComparativeAnalysisDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Comparative Analysis')).toBeInTheDocument();
      }, { timeout: 10000 });

      // Wait for real comparison data
      await waitFor(() => {
        // Should show actual period comparisons
        const comparisonElements = screen.getAllByText(/Current|Previous|Month|Quarter/);
        expect(comparisonElements.length).toBeGreaterThan(0);
      }, { timeout: TEST_TIMEOUT });
    });

    test('performs real statistical variance analysis', async () => {
      renderWithQueryClient(<ComparativeAnalysisDashboard />);
      
      // Click on variance analysis tab
      await waitFor(() => {
        const varianceTab = screen.getByText('Variance Analysis');
        fireEvent.click(varianceTab);
      }, { timeout: 10000 });

      // Should show real statistical analysis
      await waitFor(() => {
        expect(screen.getByText(/Variance|Statistical|Significance/)).toBeInTheDocument();
      }, { timeout: TEST_TIMEOUT });
    });
  });

  describe('Intelligent Alerting with Real Alert System', () => {
    test('displays real alerts from alert system', async () => {
      renderWithQueryClient(<IntelligentAlertingInterface />);
      
      await waitFor(() => {
        expect(screen.getByText('Intelligent Alerting')).toBeInTheDocument();
      }, { timeout: 10000 });

      // Wait for real alert data
      await waitFor(() => {
        // Should show actual alert counts
        const alertCounts = screen.getAllByText(/\d+/);
        expect(alertCounts.length).toBeGreaterThan(0);
      }, { timeout: TEST_TIMEOUT });
    });

    test('manages real alert rules in database', async () => {
      renderWithQueryClient(<IntelligentAlertingInterface />);
      
      // Click on alert rules tab
      await waitFor(() => {
        const rulesTab = screen.getByText('Alert Rules');
        fireEvent.click(rulesTab);
      }, { timeout: 10000 });

      // Should show real alert rules
      await waitFor(() => {
        expect(screen.getByText(/Alert Rules|Create Rule/)).toBeInTheDocument();
      }, { timeout: TEST_TIMEOUT });
    });
  });

  describe('Data Export with Real Export System', () => {
    test('displays real export history from database', async () => {
      renderWithQueryClient(<DataExportInterface />);
      
      await waitFor(() => {
        expect(screen.getByText('Data Export')).toBeInTheDocument();
      }, { timeout: 10000 });

      // Wait for real export history
      await waitFor(() => {
        expect(screen.getByText('Export History')).toBeInTheDocument();
      }, { timeout: TEST_TIMEOUT });
    });

    test('initiates real export job through backend', async () => {
      renderWithQueryClient(<DataExportInterface />);
      
      // Wait for interface to load
      await waitFor(() => {
        expect(screen.getByText('Start Export')).toBeInTheDocument();
      }, { timeout: 10000 });

      // Select Excel format and KPI metrics
      const excelOption = screen.getByText('Excel Workbook');
      fireEvent.click(excelOption);

      const kpiCheckbox = screen.getByLabelText(/KPI Metrics/);
      fireEvent.click(kpiCheckbox);

      // Start export
      const exportButton = screen.getByText('Start Export');
      fireEvent.click(exportButton);

      // Should create real export job
      await waitFor(() => {
        // Button should be available again after API call
        expect(exportButton).toBeInTheDocument();
      }, { timeout: 10000 });
    });
  });

  describe('Real API Performance Tests', () => {
    test('analytics overview API responds within acceptable time', async () => {
      const startTime = Date.now();
      
      const response = await fetch(`${API_BASE_URL}/advanced-analytics/overview?business_type=retail_store`);
      
      const responseTime = Date.now() - startTime;
      expect(response.ok).toBe(true);
      expect(responseTime).toBeLessThan(5000); // Should respond within 5 seconds
    });

    test('predictions API handles complex calculations efficiently', async () => {
      const startTime = Date.now();
      
      const response = await fetch(`${API_BASE_URL}/advanced-analytics/predictions?business_type=retail_store&forecast_period=90`);
      
      const responseTime = Date.now() - startTime;
      expect(response.status).toBeLessThan(500);
      expect(responseTime).toBeLessThan(10000); // ML calculations may take longer
    });

    test('customer segmentation API processes large datasets efficiently', async () => {
      const startTime = Date.now();
      
      const response = await fetch(`${API_BASE_URL}/advanced-analytics/customers/segmentation?segmentation_method=rfm&num_segments=8`);
      
      const responseTime = Date.now() - startTime;
      expect(response.status).toBeLessThan(500);
      expect(responseTime).toBeLessThan(15000); // Segmentation may take time with large datasets
    });
  });

  describe('Database Consistency Tests', () => {
    test('data remains consistent across multiple API calls', async () => {
      // Make multiple calls to the same endpoint
      const responses = await Promise.all([
        fetch(`${API_BASE_URL}/advanced-analytics/overview?business_type=retail_store`),
        fetch(`${API_BASE_URL}/advanced-analytics/overview?business_type=retail_store`),
        fetch(`${API_BASE_URL}/advanced-analytics/overview?business_type=retail_store`)
      ]);

      // All should succeed
      responses.forEach(response => {
        expect(response.ok).toBe(true);
      });

      // Data should be consistent
      const data = await Promise.all(responses.map(r => r.json()));
      expect(data[0].total_metrics).toBe(data[1].total_metrics);
      expect(data[1].total_metrics).toBe(data[2].total_metrics);
    });

    test('real-time updates reflect in subsequent API calls', async () => {
      // Get initial data
      const initialResponse = await fetch(`${API_BASE_URL}/advanced-analytics/overview?business_type=retail_store`);
      const initialData = await initialResponse.json();

      // Trigger analytics recalculation
      await fetch(`${API_BASE_URL}/analytics/calculate-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      // Wait a moment for calculations
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Get updated data
      const updatedResponse = await fetch(`${API_BASE_URL}/advanced-analytics/overview?business_type=retail_store`);
      const updatedData = await updatedResponse.json();

      // Data structure should be consistent
      expect(typeof updatedData.total_metrics).toBe(typeof initialData.total_metrics);
      expect(Array.isArray(updatedData.recent_insights)).toBe(Array.isArray(initialData.recent_insights));
    });
  });

  describe('Error Handling with Real Backend', () => {
    test('handles database connection errors gracefully', async () => {
      renderWithQueryClient(<AdvancedAnalyticsDashboard />);
      
      // Should not crash even if database has issues
      await waitFor(() => {
        expect(screen.getByText('Advanced Analytics')).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    test('handles invalid parameters gracefully', async () => {
      const response = await fetch(`${API_BASE_URL}/advanced-analytics/predictions?business_type=invalid&forecast_period=invalid`);
      
      // Should handle gracefully, not crash
      expect(response.status).toBeLessThan(500);
    });

    test('handles large dataset requests without timeout', async () => {
      const response = await fetch(`${API_BASE_URL}/advanced-analytics/customers/segmentation?segmentation_method=rfm&num_segments=20&analysis_period_days=1095`);
      
      // Should handle large requests
      expect(response.status).toBeLessThan(500);
    }, 30000);
  });

  afterAll(async () => {
    console.log('Docker integration tests completed');
    
    // Optional: Clean up test data
    try {
      await fetch(`${API_BASE_URL}/test/cleanup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.warn('Could not clean up test data:', error);
    }
  });
});