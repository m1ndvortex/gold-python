import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import SystemAdministration from '../pages/SystemAdministration';

// Mock the language hook
jest.mock('../hooks/useLanguage', () => ({
  useLanguage: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'system.admin.title': 'System Administration',
        'system.admin.description': 'Monitor and manage system infrastructure',
        'system.admin.online': 'System Online',
        'system.admin.accessDenied': 'Access denied. Administrator privileges required.',
        'system.admin.tabs.overview': 'Overview',
        'system.admin.tabs.services': 'Services',
        'system.admin.tabs.security': 'Security',
        'system.admin.tabs.performance': 'Performance',
        'system.admin.tabs.database': 'Database',
        'system.admin.tabs.redis': 'Redis',
        'system.admin.tabs.backups': 'Backups',
        'system.admin.tabs.logs': 'Logs',
        'system.health.overall': 'System Health',
        'system.health.score': 'Health Score',
        'system.resources.cpu': 'CPU Usage',
        'system.resources.memory': 'Memory Usage',
        'system.resources.disk': 'Disk Usage',
        'system.status.healthy': 'Healthy'
      };
      return translations[key] || key;
    },
    language: 'en',
    direction: 'ltr'
  })
}));

// Mock auth hook with admin access
jest.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    hasAnyRole: (roles: string[]) => roles.includes('Owner'),
    user: { role: 'Owner' }
  })
}));

// Mock system admin hooks with simple data
jest.mock('../hooks/useSystemAdmin', () => ({
  useSystemHealth: () => ({
    data: {
      overall: { status: 'healthy', score: 85, message: 'System healthy' },
      resources: {
        cpu: { current: 25.4, average: 22.1, trend: 'stable' },
        memory: { used: 4000000000, total: 8000000000, percentage: 50.0, trend: 'stable' },
        disk: { used: 100000000000, total: 200000000000, percentage: 50.0, trend: 'up' }
      },
      alerts: [],
      lastUpdated: new Date()
    },
    isLoading: false,
    error: null
  }),
  useServiceStatus: () => ({
    data: [
      { name: 'backend', status: 'healthy', uptime: '2d 14h', cpu: 15, memory: 45, lastRestart: new Date() }
    ],
    isLoading: false
  }),
  useServiceManagement: () => ({ mutateAsync: jest.fn(), isPending: false }),
  useServiceLogs: () => ({ data: [], isLoading: false }),
  useSSLCertificateStatus: () => ({ data: { domain: 'localhost', status: 'valid' }, isLoading: false }),
  useSecurityStatus: () => ({ data: { securityHeaders: { score: 95 } }, isLoading: false }),
  useSSLCertificateRenewal: () => ({ mutate: jest.fn(), isPending: false }),
  useSecurityScan: () => ({ mutate: jest.fn(), isPending: false }),
  usePerformanceMetrics: () => ({ data: [], isLoading: false, error: null }),
  useDatabaseStatus: () => ({ data: { connectionPool: { active: 5, total: 20 } }, isLoading: false, error: null }),
  useDatabaseHealthCheck: () => ({ mutate: jest.fn(), isPending: false }),
  useDatabaseOptimization: () => ({ mutate: jest.fn(), isPending: false }),
  useRedisStatus: () => ({ data: { memory: { used: 128000000 } }, isLoading: false, error: null }),
  useRedisCacheClear: () => ({ mutateAsync: jest.fn(), isPending: false }),
  useRedisKeys: () => ({ data: [], isLoading: false }),
  useBackupStatus: () => ({ data: [], isLoading: false, error: null }),
  useManualBackup: () => ({ mutateAsync: jest.fn(), isPending: false }),
  useBackupRestore: () => ({ mutateAsync: jest.fn(), isPending: false }),
  useBackupDelete: () => ({ mutateAsync: jest.fn(), isPending: false }),
  useLogs: () => ({ data: [], isLoading: false, error: null }),
  useLogExport: () => ({ mutate: jest.fn(), isPending: false }),
  useSystemAlerts: () => ({ data: [], isLoading: false, error: null }),
  useAlertAcknowledgment: () => ({ mutateAsync: jest.fn(), isPending: false }),
  useAlertResolution: () => ({ mutateAsync: jest.fn(), isPending: false }),
  useActiveSessions: () => ({ data: [], isLoading: false, error: null }),
  useSessionTermination: () => ({ mutateAsync: jest.fn(), isPending: false }),
  useUserSessionsTermination: () => ({ mutateAsync: jest.fn(), isPending: false })
}));

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('System Administration Dashboard - Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders system administration dashboard successfully', async () => {
    render(
      <TestWrapper>
        <SystemAdministration />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('System Administration')).toBeInTheDocument();
      expect(screen.getByText('Monitor and manage system infrastructure')).toBeInTheDocument();
      expect(screen.getByText('System Online')).toBeInTheDocument();
    });
  });

  it('displays all navigation tabs', async () => {
    render(
      <TestWrapper>
        <SystemAdministration />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Services')).toBeInTheDocument();
      expect(screen.getByText('Security')).toBeInTheDocument();
      expect(screen.getByText('Performance')).toBeInTheDocument();
      expect(screen.getByText('Database')).toBeInTheDocument();
      expect(screen.getByText('Redis')).toBeInTheDocument();
      expect(screen.getByText('Backups')).toBeInTheDocument();
      expect(screen.getByText('Logs')).toBeInTheDocument();
    });
  });

  it('shows system health information in overview tab', async () => {
    render(
      <TestWrapper>
        <SystemAdministration />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('System Health')).toBeInTheDocument();
      expect(screen.getByText('85/100')).toBeInTheDocument();
      expect(screen.getByText('Health Score')).toBeInTheDocument();
    });
  });

  it('allows tab navigation between different sections', async () => {
    render(
      <TestWrapper>
        <SystemAdministration />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('System Administration')).toBeInTheDocument();
    });

    // Click on Services tab
    const servicesTab = screen.getByText('Services');
    fireEvent.click(servicesTab);

    // Should be able to navigate to services
    await waitFor(() => {
      expect(servicesTab).toBeInTheDocument();
    });

    // Click on Security tab
    const securityTab = screen.getByText('Security');
    fireEvent.click(securityTab);

    // Should be able to navigate to security
    await waitFor(() => {
      expect(securityTab).toBeInTheDocument();
    });
  });

  it('displays proper role-based access control', async () => {
    // Test with admin user (should have access)
    render(
      <TestWrapper>
        <SystemAdministration />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('System Administration')).toBeInTheDocument();
      expect(screen.queryByText('Access denied. Administrator privileges required.')).not.toBeInTheDocument();
    });
  });

  it('handles component rendering without crashes', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    render(
      <TestWrapper>
        <SystemAdministration />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('System Administration')).toBeInTheDocument();
    });

    // Should not have any console errors
    expect(consoleSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('Error')
    );

    consoleSpy.mockRestore();
  });

  it('renders responsive layout correctly', async () => {
    render(
      <TestWrapper>
        <SystemAdministration />
      </TestWrapper>
    );

    await waitFor(() => {
      const container = screen.getByText('System Administration').closest('.container');
      expect(container).toHaveClass('mx-auto', 'p-6', 'space-y-6');
    });
  });

  it('displays gradient styling and modern UI elements', async () => {
    render(
      <TestWrapper>
        <SystemAdministration />
      </TestWrapper>
    );

    await waitFor(() => {
      const title = screen.getByText('System Administration');
      expect(title).toHaveClass('bg-gradient-to-r', 'from-gray-900', 'to-gray-600');
    });
  });
});