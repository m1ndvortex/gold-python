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
import * as api from '../services/api';

// Mock the API
jest.mock('../services/api');
const mockApi = api as jest.Mocked<typeof api>;

// Mock chart components
jest.mock('../components/analytics/charts/InteractiveChart', () => ({
  InteractiveChart: ({ data, type, height }: any) => (
    <div data-testid="interactive-chart" data-type={type} data-height={height}>
      Mock Interactive Chart: {JSON.stringify(data)}
    </div>
  )
}));

jest.mock('../components/analytics/charts/TrendChart', () => ({
  TrendChart: ({ data, height, analysis }: any) => (
    <div data-testid="trend-chart" data-height={height}>
      Mock Trend Chart: {JSON.stringify(data)} - Analysis: {JSON.stringify(analysis)}
    </div>
  )
}));

// Mock other components
jest.mock('../components/analytics/KPIDashboard', () => ({
  KPIDashboard: ({ businessType, timeRange }: any) => (
    <div data-testid="kpi-dashboard">
      Mock KPI Dashboard - Business: {businessType} - Range: {JSON.stringify(timeRange)}
    </div>
  )
}));

jest.mock('../components/analytics/TimeRangeSelector', () => ({
  TimeRangeSelector: ({ value, onChange, className }: any) => (
    <div data-testid="time-range-selector" className={className}>
      Mock Time Range Selector
      <button onClick={() => onChange({ start: new Date('2024-01-01'), end: new Date('2024-01-31') })}>
        Change Range
      </button>
    </div>
  )
}));

jest.mock('../components/analytics/AlertsPanel', () => ({
  AlertsPanel: ({ businessType }: any) => (
    <div data-testid="alerts-panel">
      Mock Alerts Panel - Business: {businessType}
    </div>
  )
}));

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
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

describe('Advanced Analytics Dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock API responses
    mockApi.apiGet.mockImplementation((url: string) => {
      if (url.includes('/advanced-analytics/overview')) {
        return Promise.resolve({
          total_metrics: 24,
          active_models: 8,
          customer_segments: 6,
          model_accuracy: 94.2,
          recent_insights: [
            "Sales trend shows 15% increase over last month",
            "Customer segmentation reveals 3 high-value segments",
            "Inventory turnover improved by 8%",
            "Predictive model accuracy increased to 94.2%"
          ]
        });
      }
      return Promise.resolve({});
    });

    mockApi.apiPost.mockResolvedValue({ success: true });
  });

  describe('Main Dashboard', () => {
    test('renders advanced analytics dashboard with header', async () => {
      renderWithQueryClient(<AdvancedAnalyticsDashboard />);
      
      expect(screen.getByText('Advanced Analytics')).toBeInTheDocument();
      expect(screen.getByText('Comprehensive business intelligence and predictive analytics')).toBeInTheDocument();
      expect(screen.getByText('AI Powered')).toBeInTheDocument();
    });

    test('displays overview metrics correctly', async () => {
      renderWithQueryClient(<AdvancedAnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('24')).toBeInTheDocument();
        expect(screen.getByText('Active Metrics')).toBeInTheDocument();
        expect(screen.getByText('8')).toBeInTheDocument();
        expect(screen.getByText('AI Models Running')).toBeInTheDocument();
        expect(screen.getByText('6')).toBeInTheDocument();
        expect(screen.getByText('Customer Segments')).toBeInTheDocument();
        expect(screen.getByText('94.2%')).toBeInTheDocument();
        expect(screen.getByText('Model Accuracy')).toBeInTheDocument();
      });
    });

    test('displays recent insights', async () => {
      renderWithQueryClient(<AdvancedAnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Recent Insights')).toBeInTheDocument();
        expect(screen.getByText(/Sales trend shows 15% increase/)).toBeInTheDocument();
        expect(screen.getByText(/Customer segmentation reveals 3 high-value segments/)).toBeInTheDocument();
      });
    });

    test('switches between tabs correctly', async () => {
      renderWithQueryClient(<AdvancedAnalyticsDashboard />);
      
      // Click on KPI Dashboard tab
      fireEvent.click(screen.getByText('KPI Dashboard'));
      await waitFor(() => {
        expect(screen.getByTestId('kpi-dashboard')).toBeInTheDocument();
      });

      // Click on Predictive tab
      fireEvent.click(screen.getByText('Predictive'));
      await waitFor(() => {
        expect(screen.getByText('Predictive Analytics')).toBeInTheDocument();
      });
    });

    test('handles refresh all functionality', async () => {
      renderWithQueryClient(<AdvancedAnalyticsDashboard />);
      
      const refreshButton = screen.getByText('Refresh All');
      fireEvent.click(refreshButton);
      
      // Should trigger API calls for refreshing data
      await waitFor(() => {
        expect(mockApi.apiGet).toHaveBeenCalled();
      });
    });

    test('handles export functionality', async () => {
      renderWithQueryClient(<AdvancedAnalyticsDashboard />);
      
      const exportButton = screen.getByText('Export');
      fireEvent.click(exportButton);
      
      // Should trigger export API call
      await waitFor(() => {
        expect(mockApi.apiPost).toHaveBeenCalled();
      });
    });
  });

  describe('Predictive Analytics Dashboard', () => {
    beforeEach(() => {
      mockApi.apiGet.mockImplementation((url: string) => {
        if (url.includes('/advanced-analytics/predictions')) {
          return Promise.resolve({
            sales_forecast: {
              next_30_days: 125000,
              next_90_days: 380000,
              confidence_score: 0.87,
              trend_direction: 'up',
              seasonal_factors: {
                'January': 1.2,
                'February': 0.9,
                'March': 1.1
              }
            },
            inventory_forecast: {
              stockout_predictions: [
                {
                  item_id: '1',
                  item_name: 'Gold Ring 18K',
                  predicted_stockout_date: '2024-02-15',
                  confidence: 0.85,
                  recommended_reorder_quantity: 50
                }
              ],
              demand_predictions: [
                {
                  item_id: '1',
                  item_name: 'Gold Ring 18K',
                  predicted_demand: 25,
                  confidence_interval: [20, 30]
                }
              ]
            },
            cash_flow_forecast: {
              next_month_inflow: 150000,
              next_month_outflow: 120000,
              net_cash_flow: 30000,
              cash_position_forecast: [
                {
                  date: '2024-02-01',
                  predicted_balance: 50000,
                  confidence: 0.9
                }
              ]
            },
            model_performance: {
              accuracy_metrics: { overall: 0.94 },
              last_updated: '2024-01-15T10:00:00Z',
              training_data_points: 10000
            }
          });
        }
        return Promise.resolve({});
      });
    });

    test('renders predictive analytics dashboard', async () => {
      renderWithQueryClient(<PredictiveAnalyticsDashboard />);
      
      expect(screen.getByText('Predictive Analytics')).toBeInTheDocument();
      expect(screen.getByText('AI-powered forecasting for sales, inventory, and cash flow')).toBeInTheDocument();
    });

    test('displays model performance metrics', async () => {
      renderWithQueryClient(<PredictiveAnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('94.0%')).toBeInTheDocument();
        expect(screen.getByText('Overall Model Accuracy')).toBeInTheDocument();
        expect(screen.getByText('10,000')).toBeInTheDocument();
        expect(screen.getByText('Training Data Points')).toBeInTheDocument();
      });
    });

    test('displays sales forecast data', async () => {
      renderWithQueryClient(<PredictiveAnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('$125,000')).toBeInTheDocument();
        expect(screen.getByText('Next 30 Days')).toBeInTheDocument();
        expect(screen.getByText('$380,000')).toBeInTheDocument();
        expect(screen.getByText('Next 90 Days')).toBeInTheDocument();
      });
    });

    test('switches between forecast types', async () => {
      renderWithQueryClient(<PredictiveAnalyticsDashboard />);
      
      // Click on inventory forecast tab
      fireEvent.click(screen.getByText('Inventory Forecast'));
      await waitFor(() => {
        expect(screen.getByText('Stockout Predictions')).toBeInTheDocument();
        expect(screen.getByText('Gold Ring 18K')).toBeInTheDocument();
      });

      // Click on cash flow forecast tab
      fireEvent.click(screen.getByText('Cash Flow Forecast'));
      await waitFor(() => {
        expect(screen.getByText('Next Month Cash Flow')).toBeInTheDocument();
        expect(screen.getByText('$150,000')).toBeInTheDocument();
        expect(screen.getByText('Inflow')).toBeInTheDocument();
      });
    });
  });

  describe('Customer Segmentation Dashboard', () => {
    beforeEach(() => {
      mockApi.apiGet.mockImplementation((url: string) => {
        if (url.includes('/advanced-analytics/customers/segmentation')) {
          return Promise.resolve({
            segments: [
              {
                segment_id: '1',
                segment_name: 'Champions',
                customer_count: 150,
                characteristics: {
                  avg_recency: 15,
                  avg_frequency: 8,
                  avg_monetary: 2500,
                  avg_transaction_value: 312,
                  retention_rate: 0.95,
                  churn_risk: 0.05
                },
                lifetime_value: 12500,
                recommended_actions: ['Maintain engagement', 'Offer premium services'],
                segment_color: '#10B981',
                growth_trend: 'up',
                percentage_of_total: 25.5
              }
            ],
            segmentation_method: 'rfm',
            analysis_period: {
              start_date: '2023-01-01',
              end_date: '2024-01-01',
              days: 365
            },
            total_customers: 588,
            segmentation_quality: {
              silhouette_score: 0.78,
              segment_separation: 0.85,
              within_cluster_variance: 0.15
            },
            insights: ['High-value customers show strong loyalty patterns'],
            recommendations: ['Focus retention efforts on Champions segment']
          });
        }
        return Promise.resolve({});
      });
    });

    test('renders customer segmentation dashboard', async () => {
      renderWithQueryClient(<CustomerSegmentationDashboard />);
      
      expect(screen.getByText('Customer Segmentation')).toBeInTheDocument();
      expect(screen.getByText('Advanced customer behavior analysis and segmentation')).toBeInTheDocument();
    });

    test('displays segmentation overview metrics', async () => {
      renderWithQueryClient(<CustomerSegmentationDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('588')).toBeInTheDocument();
        expect(screen.getByText('Total Customers')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('Active Segments')).toBeInTheDocument();
      });
    });

    test('displays segment cards with details', async () => {
      renderWithQueryClient(<CustomerSegmentationDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Champions')).toBeInTheDocument();
        expect(screen.getByText('150')).toBeInTheDocument();
        expect(screen.getByText('$312')).toBeInTheDocument();
        expect(screen.getByText('$12,500')).toBeInTheDocument();
        expect(screen.getByText('5.0%')).toBeInTheDocument(); // Churn risk
      });
    });

    test('switches between analysis tabs', async () => {
      renderWithQueryClient(<CustomerSegmentationDashboard />);
      
      // Click on detailed analysis tab
      fireEvent.click(screen.getByText('Detailed Analysis'));
      await waitFor(() => {
        expect(screen.getByText('RFM Analysis')).toBeInTheDocument();
        expect(screen.getByText('Segment Characteristics')).toBeInTheDocument();
      });

      // Click on recommendations tab
      fireEvent.click(screen.getByText('Recommendations'));
      await waitFor(() => {
        expect(screen.getByText('Key Insights')).toBeInTheDocument();
        expect(screen.getByText(/High-value customers show strong loyalty patterns/)).toBeInTheDocument();
      });
    });
  });

  describe('Trend Analysis Dashboard', () => {
    beforeEach(() => {
      mockApi.apiGet.mockImplementation((url: string) => {
        if (url.includes('/advanced-analytics/trends/analyze')) {
          return Promise.resolve({
            metric_name: 'revenue',
            trend_direction: 'increasing',
            trend_strength: 0.85,
            seasonal_component: {
              has_seasonality: true,
              seasonal_strength: 0.65,
              peak_periods: ['December', 'February'],
              low_periods: ['August', 'September'],
              seasonal_pattern: [
                { period: 'January', factor: 1.1 },
                { period: 'February', factor: 1.3 }
              ]
            },
            growth_rate: 0.15,
            volatility: 0.12,
            forecast_next_period: 125000,
            confidence_interval: [115000, 135000],
            anomalies_detected: [
              {
                date: '2024-01-15',
                value: 95000,
                anomaly_score: 0.85,
                type: 'spike',
                description: 'Unusual sales spike detected'
              }
            ],
            historical_data: [
              {
                date: '2024-01-01',
                value: 100000,
                trend_component: 98000,
                seasonal_component: 2000,
                residual: 0
              }
            ],
            insights: ['Revenue shows strong upward trend with seasonal patterns'],
            recommendations: ['Capitalize on peak periods with targeted campaigns']
          });
        }
        return Promise.resolve({});
      });
    });

    test('renders trend analysis dashboard', async () => {
      renderWithQueryClient(<TrendAnalysisDashboard />);
      
      expect(screen.getByText('Trend Analysis')).toBeInTheDocument();
      expect(screen.getByText('Advanced trend detection with seasonal patterns and forecasting')).toBeInTheDocument();
    });

    test('displays trend overview metrics', async () => {
      renderWithQueryClient(<TrendAnalysisDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('15.0%')).toBeInTheDocument(); // Growth rate
        expect(screen.getByText('Growth Rate')).toBeInTheDocument();
        expect(screen.getByText('12.0%')).toBeInTheDocument(); // Volatility
        expect(screen.getByText('Market Volatility')).toBeInTheDocument();
        expect(screen.getByText('125,000')).toBeInTheDocument(); // Forecast
        expect(screen.getByText('Next Period Forecast')).toBeInTheDocument();
      });
    });

    test('switches between trend analysis tabs', async () => {
      renderWithQueryClient(<TrendAnalysisDashboard />);
      
      // Click on seasonal patterns tab
      fireEvent.click(screen.getByText('Seasonal Patterns'));
      await waitFor(() => {
        expect(screen.getByText('Seasonal Pattern Analysis')).toBeInTheDocument();
        expect(screen.getByText('Peak Periods')).toBeInTheDocument();
        expect(screen.getByText('December')).toBeInTheDocument();
      });

      // Click on anomalies tab
      fireEvent.click(screen.getByText('Anomaly Detection'));
      await waitFor(() => {
        expect(screen.getByText('Detected Anomalies')).toBeInTheDocument();
        expect(screen.getByText('Unusual sales spike detected')).toBeInTheDocument();
      });
    });
  });

  describe('Comparative Analysis Dashboard', () => {
    beforeEach(() => {
      mockApi.apiGet.mockImplementation((url: string) => {
        if (url.includes('/advanced-analytics/comparative-analysis')) {
          return Promise.resolve({
            comparison_type: 'time_periods',
            periods: [
              {
                id: '1',
                name: 'Current Month',
                start_date: '2024-01-01',
                end_date: '2024-01-31',
                metrics: {
                  revenue: 125000,
                  profit_margin: 0.25,
                  customer_count: 150
                }
              },
              {
                id: '2',
                name: 'Previous Month',
                start_date: '2023-12-01',
                end_date: '2023-12-31',
                metrics: {
                  revenue: 110000,
                  profit_margin: 0.22,
                  customer_count: 140
                }
              }
            ],
            metrics_analyzed: ['revenue', 'profit_margin', 'customer_count'],
            variance_analysis: [
              {
                metric_name: 'revenue',
                variance_percentage: 13.6,
                significance_level: 0.95,
                trend_direction: 'up',
                statistical_significance: true
              }
            ],
            insights: ['Revenue increased significantly compared to previous period'],
            recommendations: ['Continue current growth strategies']
          });
        }
        return Promise.resolve({});
      });
    });

    test('renders comparative analysis dashboard', async () => {
      renderWithQueryClient(<ComparativeAnalysisDashboard />);
      
      expect(screen.getByText('Comparative Analysis')).toBeInTheDocument();
      expect(screen.getByText('Compare performance across time periods and business segments')).toBeInTheDocument();
    });

    test('displays comparison periods', async () => {
      renderWithQueryClient(<ComparativeAnalysisDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Current Month')).toBeInTheDocument();
        expect(screen.getByText('Previous Month')).toBeInTheDocument();
        expect(screen.getByText('125,000')).toBeInTheDocument();
        expect(screen.getByText('110,000')).toBeInTheDocument();
      });
    });

    test('displays variance analysis', async () => {
      renderWithQueryClient(<ComparativeAnalysisDashboard />);
      
      // Click on variance analysis tab
      fireEvent.click(screen.getByText('Variance Analysis'));
      
      await waitFor(() => {
        expect(screen.getByText('Statistical Variance Analysis')).toBeInTheDocument();
        expect(screen.getByText('+13.6%')).toBeInTheDocument();
        expect(screen.getByText('Significant')).toBeInTheDocument();
      });
    });
  });

  describe('Intelligent Alerting Interface', () => {
    beforeEach(() => {
      mockApi.apiGet.mockImplementation((url: string) => {
        if (url.includes('/advanced-analytics/alerts')) {
          return Promise.resolve([
            {
              id: '1',
              rule_id: 'rule1',
              rule_name: 'Low Stock Alert',
              metric_name: 'inventory_level',
              current_value: 5,
              threshold_value: 10,
              severity: 'high',
              message: 'Gold Ring 18K stock is below threshold',
              status: 'active',
              created_at: '2024-01-15T10:00:00Z'
            }
          ]);
        }
        if (url.includes('/advanced-analytics/alert-rules')) {
          return Promise.resolve([
            {
              id: 'rule1',
              name: 'Low Stock Alert',
              description: 'Alert when inventory falls below threshold',
              metric_name: 'inventory_level',
              condition_type: 'threshold',
              threshold_value: 10,
              comparison_operator: 'less_than',
              time_window: 60,
              severity: 'high',
              enabled: true,
              notification_channels: ['email'],
              business_rules: {
                business_hours_only: false,
                exclude_weekends: false,
                minimum_interval: 30
              },
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
              trigger_count: 5
            }
          ]);
        }
        return Promise.resolve({});
      });
    });

    test('renders intelligent alerting interface', async () => {
      renderWithQueryClient(<IntelligentAlertingInterface />);
      
      expect(screen.getByText('Intelligent Alerting')).toBeInTheDocument();
      expect(screen.getByText('AI-powered business rules and anomaly detection alerts')).toBeInTheDocument();
    });

    test('displays alert summary cards', async () => {
      renderWithQueryClient(<IntelligentAlertingInterface />);
      
      await waitFor(() => {
        expect(screen.getByText('Critical Alerts')).toBeInTheDocument();
        expect(screen.getByText('Active Alerts')).toBeInTheDocument();
        expect(screen.getByText('Active Rules')).toBeInTheDocument();
        expect(screen.getByText('Resolved Today')).toBeInTheDocument();
      });
    });

    test('displays active alerts', async () => {
      renderWithQueryClient(<IntelligentAlertingInterface />);
      
      await waitFor(() => {
        expect(screen.getByText('Low Stock Alert')).toBeInTheDocument();
        expect(screen.getByText('Gold Ring 18K stock is below threshold')).toBeInTheDocument();
        expect(screen.getByText('high')).toBeInTheDocument();
        expect(screen.getByText('active')).toBeInTheDocument();
      });
    });

    test('switches to alert rules tab', async () => {
      renderWithQueryClient(<IntelligentAlertingInterface />);
      
      fireEvent.click(screen.getByText('Alert Rules'));
      
      await waitFor(() => {
        expect(screen.getByText('Alert when inventory falls below threshold')).toBeInTheDocument();
        expect(screen.getByText('Enabled')).toBeInTheDocument();
        expect(screen.getByText('Triggers: 5')).toBeInTheDocument();
      });
    });
  });

  describe('Data Export Interface', () => {
    beforeEach(() => {
      mockApi.apiGet.mockImplementation((url: string) => {
        if (url.includes('/advanced-analytics/exports/history')) {
          return Promise.resolve([
            {
              id: '1',
              format: 'excel',
              data_types: ['kpi_metrics', 'trend_analysis'],
              status: 'completed',
              progress: 100,
              created_at: '2024-01-15T10:00:00Z',
              completed_at: '2024-01-15T10:05:00Z',
              download_url: '/downloads/export-1.xlsx',
              file_size: 2048000
            }
          ]);
        }
        return Promise.resolve({});
      });
    });

    test('renders data export interface', async () => {
      renderWithQueryClient(<DataExportInterface />);
      
      expect(screen.getByText('Data Export')).toBeInTheDocument();
      expect(screen.getByText('Export analytics data in multiple formats for external analysis')).toBeInTheDocument();
    });

    test('displays export format options', async () => {
      renderWithQueryClient(<DataExportInterface />);
      
      expect(screen.getByText('Excel Workbook')).toBeInTheDocument();
      expect(screen.getByText('CSV Files')).toBeInTheDocument();
      expect(screen.getByText('PDF Report')).toBeInTheDocument();
      expect(screen.getByText('JSON Data')).toBeInTheDocument();
    });

    test('displays data type selection', async () => {
      renderWithQueryClient(<DataExportInterface />);
      
      expect(screen.getByText('KPI Metrics')).toBeInTheDocument();
      expect(screen.getByText('Predictive Analytics')).toBeInTheDocument();
      expect(screen.getByText('Customer Segmentation')).toBeInTheDocument();
      expect(screen.getByText('Trend Analysis')).toBeInTheDocument();
    });

    test('displays export history', async () => {
      renderWithQueryClient(<DataExportInterface />);
      
      await waitFor(() => {
        expect(screen.getByText('Export History')).toBeInTheDocument();
        expect(screen.getByText('EXCEL Export')).toBeInTheDocument();
        expect(screen.getByText('2.0MB')).toBeInTheDocument();
        expect(screen.getByText('Download')).toBeInTheDocument();
      });
    });

    test('handles export initiation', async () => {
      renderWithQueryClient(<DataExportInterface />);
      
      const exportButton = screen.getByText('Start Export');
      fireEvent.click(exportButton);
      
      await waitFor(() => {
        expect(mockApi.apiPost).toHaveBeenCalledWith('/advanced-analytics/data/export', expect.any(Object));
      });
    });
  });

  describe('Error Handling', () => {
    test('handles API errors gracefully', async () => {
      mockApi.apiGet.mockRejectedValue(new Error('API Error'));
      
      renderWithQueryClient(<AdvancedAnalyticsDashboard />);
      
      // Should not crash and should show error states
      expect(screen.getByText('Advanced Analytics')).toBeInTheDocument();
    });

    test('handles network failures', async () => {
      mockApi.apiGet.mockRejectedValue(new Error('Network Error'));
      
      renderWithQueryClient(<PredictiveAnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to Load Predictive Analytics')).toBeInTheDocument();
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Updates', () => {
    test('refreshes data at specified intervals', async () => {
      jest.useFakeTimers();
      
      renderWithQueryClient(<AdvancedAnalyticsDashboard />);
      
      // Fast-forward time to trigger refetch
      jest.advanceTimersByTime(300000); // 5 minutes
      
      await waitFor(() => {
        expect(mockApi.apiGet).toHaveBeenCalledTimes(2); // Initial + refetch
      });
      
      jest.useRealTimers();
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels and roles', async () => {
      renderWithQueryClient(<AdvancedAnalyticsDashboard />);
      
      // Check for proper heading structure
      expect(screen.getByRole('heading', { name: /Advanced Analytics/i })).toBeInTheDocument();
      
      // Check for proper button labels
      expect(screen.getByRole('button', { name: /Refresh All/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Export/i })).toBeInTheDocument();
    });

    test('supports keyboard navigation', async () => {
      renderWithQueryClient(<AdvancedAnalyticsDashboard />);
      
      const firstTab = screen.getByText('Overview');
      firstTab.focus();
      
      expect(document.activeElement).toBe(firstTab);
    });
  });
});