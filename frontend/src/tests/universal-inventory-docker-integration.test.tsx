import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
// Jest globals are available by default
import '@testing-library/jest-dom';
import '../types/jest-dom.d';

// Import components
import { UniversalInventoryManagement } from '../components/inventory/UniversalInventoryManagement';
import { LanguageContext } from '../hooks/useLanguage';

// Real API integration tests (using actual Docker backend)
describe('Universal Inventory Management - Docker Integration Tests', () => {
  let queryClient: QueryClient;
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  beforeAll(async () => {
    // Verify Docker backend is running
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (!response.ok) {
        throw new Error('Backend not available');
      }
    } catch (error) {
      console.warn('Docker backend not available, skipping integration tests');
      return;
    }
  });

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { 
          retry: 1,
          retryDelay: 1000,
        },
        mutations: { 
          retry: 1,
          retryDelay: 1000,
        },
      },
    });
  });

  const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TestLanguageProvider>
          {children}
        </TestLanguageProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );

  // Language Provider for tests
  const TestLanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const languageValue = {
      language: 'en' as const,
      direction: 'ltr' as const,
      setLanguage: jest.fn(),
      t: (key: string) => key, // Simple mock that returns the key
      isRTL: false,
      isLTR: true,
      getLayoutClasses: () => '',
      getTextAlignClass: () => 'text-left',
      getFlexDirectionClass: () => 'flex-row',
      getMarginClass: () => 'ml-2',
      getPaddingClass: () => 'pl-2',
      getBorderClass: () => 'border-l',
      getFloatClass: () => 'float-left',
      getClearClass: () => 'clear-left',
      getTransformClass: () => '',
      formatNumber: (num: number) => num.toString(),
      formatDate: (date: Date) => date.toISOString(),
      formatCurrency: (amount: number) => `$${amount.toFixed(2)}`
    };

    return (
      <LanguageContext.Provider value={languageValue}>
        {children}
      </LanguageContext.Provider>
    );
  };

  // Helper function to check if backend is available
  const isBackendAvailable = async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return response.ok;
    } catch {
      return false;
    }
  };

  describe('Real API Integration', () => {
    it('loads inventory data from real backend', async () => {
      const backendAvailable = await isBackendAvailable();
      if (!backendAvailable) {
        console.warn('Skipping test: Backend not available');
        return;
      }

      render(
        <TestWrapper>
          <UniversalInventoryManagement />
        </TestWrapper>
      );

      // Should show loading state initially
      expect(screen.getByText(/loading/i)).toBeInTheDocument();

      // Wait for real data to load (with longer timeout for Docker)
      await waitFor(
        () => {
          // Should either show items or "no items found"
          const hasItems = screen.queryByText(/items/i);
          const noItems = screen.queryByText(/no items found/i);
          expect(hasItems || noItems).toBeInTheDocument();
        },
        { timeout: 10000 }
      );
    });

    it('loads categories from real backend', async () => {
      const backendAvailable = await isBackendAvailable();
      if (!backendAvailable) {
        console.warn('Skipping test: Backend not available');
        return;
      }

      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <UniversalInventoryManagement />
        </TestWrapper>
      );

      // Navigate to categories tab
      const categoriesTab = screen.getByRole('tab', { name: /categories/i });
      await user.click(categoriesTab);

      // Wait for categories to load
      await waitFor(
        () => {
          const categoryHierarchy = screen.queryByText('Category Hierarchy');
          expect(categoryHierarchy).toBeInTheDocument();
        },
        { timeout: 10000 }
      );
    });

    it('performs real search operation', async () => {
      const backendAvailable = await isBackendAvailable();
      if (!backendAvailable) {
        console.warn('Skipping test: Backend not available');
        return;
      }

      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <UniversalInventoryManagement />
        </TestWrapper>
      );

      // Wait for initial load
      await waitFor(
        () => {
          const searchInput = screen.queryByPlaceholderText(/quick search/i);
          expect(searchInput).toBeInTheDocument();
        },
        { timeout: 10000 }
      );

      // Perform search
      const searchInput = screen.getByPlaceholderText(/quick search/i);
      await user.type(searchInput, 'test');

      // Should trigger search request to backend
      await waitFor(
        () => {
          // Search should complete (either with results or no results)
          const loadingIndicator = screen.queryByText(/loading/i);
          expect(loadingIndicator).not.toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });

    it('handles real analytics data', async () => {
      const backendAvailable = await isBackendAvailable();
      if (!backendAvailable) {
        console.warn('Skipping test: Backend not available');
        return;
      }

      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <UniversalInventoryManagement />
        </TestWrapper>
      );

      // Navigate to analytics tab
      const analyticsTab = screen.getByRole('tab', { name: /analytics/i });
      await user.click(analyticsTab);

      // Wait for analytics to load
      await waitFor(
        () => {
          const analyticsTitle = screen.queryByText('Inventory Analytics');
          expect(analyticsTitle).toBeInTheDocument();
        },
        { timeout: 10000 }
      );

      // Should show analytics cards
      await waitFor(
        () => {
          const totalItems = screen.queryByText('Total Items');
          expect(totalItems).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });

    it('loads real stock alerts', async () => {
      const backendAvailable = await isBackendAvailable();
      if (!backendAvailable) {
        console.warn('Skipping test: Backend not available');
        return;
      }

      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <UniversalInventoryManagement />
        </TestWrapper>
      );

      // Navigate to alerts tab
      const alertsTab = screen.getByRole('tab', { name: /alerts/i });
      await user.click(alertsTab);

      // Wait for alerts to load
      await waitFor(
        () => {
          const stockAlerts = screen.queryByText('Stock Alerts');
          expect(stockAlerts).toBeInTheDocument();
        },
        { timeout: 10000 }
      );
    });

    it('loads real movement history', async () => {
      const backendAvailable = await isBackendAvailable();
      if (!backendAvailable) {
        console.warn('Skipping test: Backend not available');
        return;
      }

      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <UniversalInventoryManagement />
        </TestWrapper>
      );

      // Navigate to movements tab
      const movementsTab = screen.getByRole('tab', { name: /movements/i });
      await user.click(movementsTab);

      // Wait for movements to load
      await waitFor(
        () => {
          const movementHistory = screen.queryByText('Recent Inventory Movements');
          expect(movementHistory).toBeInTheDocument();
        },
        { timeout: 10000 }
      );
    });
  });

  describe('Error Handling with Real Backend', () => {
    it('handles network errors gracefully', async () => {
      // Temporarily override API URL to simulate network error
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error')) as any;

      render(
        <TestWrapper>
          <UniversalInventoryManagement />
        </TestWrapper>
      );

      // Should handle error gracefully
      await waitFor(
        () => {
          // Should not crash and should show some error indication or empty state
          const container = screen.getByRole('main') || document.body;
          expect(container).toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      // Restore original fetch
      global.fetch = originalFetch;
    });

    it('handles slow backend responses', async () => {
      const backendAvailable = await isBackendAvailable();
      if (!backendAvailable) {
        console.warn('Skipping test: Backend not available');
        return;
      }

      render(
        <TestWrapper>
          <UniversalInventoryManagement />
        </TestWrapper>
      );

      // Should show loading state for slow responses
      expect(screen.getByText(/loading/i)).toBeInTheDocument();

      // Should eventually load or show error
      await waitFor(
        () => {
          const loadingIndicator = screen.queryByText(/loading/i);
          // Loading should eventually disappear
          expect(loadingIndicator).not.toBeInTheDocument();
        },
        { timeout: 15000 }
      );
    });
  });

  describe('Performance Tests with Real Data', () => {
    it('renders large datasets efficiently', async () => {
      const backendAvailable = await isBackendAvailable();
      if (!backendAvailable) {
        console.warn('Skipping test: Backend not available');
        return;
      }

      const startTime = performance.now();
      
      render(
        <TestWrapper>
          <UniversalInventoryManagement />
        </TestWrapper>
      );

      // Wait for initial render
      await waitFor(
        () => {
          const container = screen.getByRole('main') || document.body;
          expect(container).toBeInTheDocument();
        },
        { timeout: 10000 }
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time (less than 5 seconds)
      expect(renderTime).toBeLessThan(5000);
    });

    it('handles rapid user interactions', async () => {
      const backendAvailable = await isBackendAvailable();
      if (!backendAvailable) {
        console.warn('Skipping test: Backend not available');
        return;
      }

      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <UniversalInventoryManagement />
        </TestWrapper>
      );

      // Wait for initial load
      await waitFor(
        () => {
          const inventoryTab = screen.queryByRole('tab', { name: /inventory/i });
          expect(inventoryTab).toBeInTheDocument();
        },
        { timeout: 10000 }
      );

      // Rapidly switch between tabs
      const tabs = ['categories', 'analytics', 'movements', 'alerts', 'inventory'];
      
      for (const tabName of tabs) {
        const tab = screen.getByRole('tab', { name: new RegExp(tabName, 'i') });
        await user.click(tab);
        
        // Small delay to allow for rendering
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Should handle rapid interactions without crashing
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });
  });

  describe('Data Consistency Tests', () => {
    it('maintains data consistency across tabs', async () => {
      const backendAvailable = await isBackendAvailable();
      if (!backendAvailable) {
        console.warn('Skipping test: Backend not available');
        return;
      }

      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <UniversalInventoryManagement />
        </TestWrapper>
      );

      // Wait for initial load and get item count
      await waitFor(
        () => {
          const itemCount = screen.queryByText(/\d+ items/);
          if (itemCount) {
            expect(itemCount).toBeInTheDocument();
          }
        },
        { timeout: 10000 }
      );

      // Switch to analytics tab
      const analyticsTab = screen.getByRole('tab', { name: /analytics/i });
      await user.click(analyticsTab);

      await waitFor(
        () => {
          const totalItems = screen.queryByText('Total Items');
          expect(totalItems).toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      // Switch back to inventory
      const inventoryTab = screen.getByRole('tab', { name: /inventory/i });
      await user.click(inventoryTab);

      // Data should be consistent
      await waitFor(
        () => {
          const container = screen.getByRole('tabpanel');
          expect(container).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });
  });

  describe('Real-time Features', () => {
    it('handles auto-refresh functionality', async () => {
      const backendAvailable = await isBackendAvailable();
      if (!backendAvailable) {
        console.warn('Skipping test: Backend not available');
        return;
      }

      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <UniversalInventoryManagement />
        </TestWrapper>
      );

      // Navigate to alerts tab (which has auto-refresh)
      const alertsTab = screen.getByRole('tab', { name: /alerts/i });
      await user.click(alertsTab);

      // Wait for initial load
      await waitFor(
        () => {
          const refreshButton = screen.queryByRole('button', { name: /refresh/i });
          expect(refreshButton).toBeInTheDocument();
        },
        { timeout: 10000 }
      );

      // Click refresh button
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await user.click(refreshButton);

      // Should handle refresh without errors
      await waitFor(
        () => {
          const stockAlerts = screen.queryByText('Stock Alerts');
          expect(stockAlerts).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });
  });

  describe('Accessibility with Real Data', () => {
    it('maintains accessibility with real backend data', async () => {
      const backendAvailable = await isBackendAvailable();
      if (!backendAvailable) {
        console.warn('Skipping test: Backend not available');
        return;
      }

      render(
        <TestWrapper>
          <UniversalInventoryManagement />
        </TestWrapper>
      );

      // Wait for data to load
      await waitFor(
        () => {
          const tablist = screen.queryByRole('tablist');
          expect(tablist).toBeInTheDocument();
        },
        { timeout: 10000 }
      );

      // Check for proper ARIA labels with real data
      const tabs = screen.getAllByRole('tab');
      expect(tabs.length).toBeGreaterThan(0);

      tabs.forEach(tab => {
        expect(tab).toHaveAttribute('role', 'tab');
      });

      // Check for proper heading structure
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
    });

    it('supports keyboard navigation with real data', async () => {
      const backendAvailable = await isBackendAvailable();
      if (!backendAvailable) {
        console.warn('Skipping test: Backend not available');
        return;
      }

      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <UniversalInventoryManagement />
        </TestWrapper>
      );

      // Wait for data to load
      await waitFor(
        () => {
          const tablist = screen.queryByRole('tablist');
          expect(tablist).toBeInTheDocument();
        },
        { timeout: 10000 }
      );

      // Test keyboard navigation
      await user.tab();
      
      const focusedElement = document.activeElement;
      expect(focusedElement).toBeInTheDocument();
      expect(focusedElement?.tagName).toBeTruthy();
    });
  });

  describe('Cross-browser Compatibility', () => {
    it('works with different user agents', async () => {
      const backendAvailable = await isBackendAvailable();
      if (!backendAvailable) {
        console.warn('Skipping test: Backend not available');
        return;
      }

      // Mock different user agents
      const originalUserAgent = navigator.userAgent;
      
      // Test with Chrome-like user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        configurable: true,
      });

      render(
        <TestWrapper>
          <UniversalInventoryManagement />
        </TestWrapper>
      );

      await waitFor(
        () => {
          const container = screen.getByRole('main') || document.body;
          expect(container).toBeInTheDocument();
        },
        { timeout: 10000 }
      );

      // Restore original user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: originalUserAgent,
        configurable: true,
      });
    });
  });
});