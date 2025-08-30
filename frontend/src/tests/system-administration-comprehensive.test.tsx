import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import SystemAdministration from '../pages/SystemAdministration';
import { SystemHealthOverview } from '../components/system-admin/SystemHealthOverview';
import { ServiceStatusGrid } from '../components/system-admin/ServiceStatusGrid';
import { SecurityMonitoring } from '../components/system-admin/SecurityMonitoring';

// Mock the hooks
jest.mock('../hooks/useLanguage', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
    language: 'en',
    direction: 'ltr'
  })
}));

jest.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    hasAnyRole: (roles: string[]) => true,
    user: { role: 'Owner' }
  })
}));

// Mock system admin hooks with realistic data
jest.mock('../hooks/useSystemAdmin', () => ({
  useSystemHealth: () => ({
    data: {
      overall: { 
        status: 'healthy', 
        score: 85, 
        message: 'System is operating normally' 
      },
      services: [
        {
          name: 'backend',
          status: 'healthy',
          uptime: '2d 14h 32m',
          cpu: 15.2,
          memory: 45.8,
          lastRestart: new Date('2024-01-13T10:00:00Z'),
          actions: []
        },
        {
          name: 'database',
          status: 'healthy',
          uptime: '7d 3h 15m',
          cpu: 8.5,
          memory: 62.3,
          lastRestart: new Date('2024-01-08T05:00:00Z'),
          actions: []
        }
      ],
      resources: {
        cpu: { current: 25.4, average: 22.1, trend: 'stable' },
        memory: { 
          used: 4294967296, 
          total: 8589934592, 
          percentage: 50.0, 
          trend: 'stable' 
        },
        disk: { 
          used: 107374182400, 
          total: 214748364800, 
          percentage: 50.0, 
          trend: 'up' 
        },
        network: { inbound: 1024000, outbound: 512000 }
      },
      security: {
        sslCertificate: {
          domain: 'localhost',
          issuer: 'Self-Signed',
          validFrom: new Date('2024-01-01T00:00:00Z'),
          validTo: new Date('2024-12-31T23:59:59Z'),
          daysUntilExpiry: 335,
          status: 'valid',
          autoRenewal: true
        },
        securityHeaders: {
          hsts: true,
          csp: true,
          xFrameOptions: true,
          xContentTypeOptions: true,
          referrerPolicy: true,
          score: 95
        },
        rateLimiting: {
          enabled: true,
          requestsPerMinute: 1000,
          blockedRequests: 12,
          topBlockedIPs: ['192.168.1.100', '10.0.0.50']
        },
        lastSecurityScan: new Date('2024-01-15T12:00:00Z'),
        vulnerabilities: []
      },
      backups: {
        lastBackup: new Date('2024-01-15T02:00:00Z'),
        nextScheduledBackup: new Date('2024-01-16T02:00:00Z'),
        backupSize: 1073741824,
        backupLocation: '/backups',
        status: 'success',
        retentionDays: 30,
        availableBackups: []
      },
      alerts: [],
      lastUpdated: new Date()
    },
    isLoading: false,
    error: null
  }),
  
  useServiceStatus: () => ({
    data: [
      {
        name: 'backend',
        status: 'healthy',
        uptime: '2d 14h 32m',
        cpu: 15.2,
        memory: 45.8,
        lastRestart: new Date('2024-01-13T10:00:00Z'),
        actions: [
          { label: 'Restart', action: 'restart', dangerous: false },
          { label: 'Stop', action: 'stop', dangerous: true }
        ]
      },
      {
        name: 'database',
        status: 'healthy',
        uptime: '7d 3h 15m',
        cpu: 8.5,
        memory: 62.3,
        lastRestart: new Date('2024-01-08T05:00:00Z'),
        actions: []
      },
      {
        name: 'redis',
        status: 'healthy',
        uptime: '5d 18h 42m',
        cpu: 3.2,
        memory: 28.7,
        lastRestart: new Date('2024-01-10T08:00:00Z'),
        actions: []
      }
    ],
    isLoading: false,
    error: null
  }),

  useServiceManagement: () => ({
    mutateAsync: jest.fn().mockResolvedValue({ message: 'Service restarted successfully' }),
    isPending: false
  }),

  useServiceLogs: () => ({
    data: [
      {
        timestamp: new Date('2024-01-15T14:30:00Z'),
        service: 'backend',
        level: 'info',
        message: 'Application started successfully',
        metadata: {},
        traceId: 'trace-001'
      },
      {
        timestamp: new Date('2024-01-15T14:29:00Z'),
        service: 'backend',
        level: 'warning',
        message: 'High memory usage detected',
        metadata: {},
        traceId: 'trace-002'
      }
    ],
    isLoading: false
  }),

  useSSLCertificateStatus: () => ({
    data: {
      domain: 'localhost',
      issuer: 'Self-Signed',
      validFrom: new Date('2024-01-01T00:00:00Z'),
      validTo: new Date('2024-12-31T23:59:59Z'),
      daysUntilExpiry: 335,
      status: 'valid',
      autoRenewal: true
    },
    isLoading: false
  }),

  useSecurityStatus: () => ({
    data: {
      securityHeaders: {
        hsts: true,
        csp: true,
        xFrameOptions: true,
        xContentTypeOptions: true,
        referrerPolicy: true,
        score: 95
      },
      rateLimiting: {
        enabled: true,
        requestsPerMinute: 1000,
        blockedRequests: 12,
        topBlockedIPs: ['192.168.1.100', '10.0.0.50']
      },
      lastSecurityScan: new Date('2024-01-15T12:00:00Z'),
      vulnerabilities: []
    },
    isLoading: false
  }),

  useSSLCertificateRenewal: () => ({
    mutate: jest.fn(),
    isPending: false
  }),

  useSecurityScan: () => ({
    mutate: jest.fn(),
    isPending: false
  }),

  usePerformanceMetrics: () => ({
    data: [
      {
        name: 'response_time',
        value: 125.5,
        unit: 'ms',
        trend: 'stable',
        threshold: 200,
        chartData: []
      },
      {
        name: 'throughput',
        value: 450.2,
        unit: 'req/s',
        trend: 'up',
        threshold: 500,
        chartData: []
      }
    ],
    isLoading: false,
    error: null
  }),

  useDatabaseStatus: () => ({
    data: {
      connectionPool: { active: 5, idle: 15, total: 20 },
      queryPerformance: { averageResponseTime: 45.2, slowQueries: 3, totalQueries: 15420 },
      storage: { size: 2147483648, freeSpace: 8589934592, tableCount: 25 },
      replication: { status: 'healthy', lag: 0 }
    },
    isLoading: false,
    error: null
  }),

  useDatabaseHealthCheck: () => ({
    mutate: jest.fn(),
    isPending: false
  }),

  useDatabaseOptimization: () => ({
    mutate: jest.fn(),
    isPending: false
  }),

  useRedisStatus: () => ({
    data: {
      memory: { used: 134217728, peak: 268435456, fragmentation: 15.2 },
      performance: { hitRate: 94.5, missRate: 5.5, operationsPerSecond: 1250 },
      connections: { connected: 8, blocked: 0, rejected: 0 },
      keyspace: { totalKeys: 1542, expiredKeys: 245, evictedKeys: 12 }
    },
    isLoading: false,
    error: null
  }),

  useRedisCacheClear: () => ({
    mutateAsync: jest.fn().mockResolvedValue({ keysDeleted: 100 }),
    isPending: false
  }),

  useRedisKeys: () => ({
    data: ['user:123', 'session:abc', 'cache:data'],
    isLoading: false
  }),

  useBackupStatus: () => ({
    data: [
      {
        filename: 'backup_2024_01_15_02_00.sql',
        date: new Date('2024-01-15T02:00:00Z'),
        size: 1073741824,
        type: 'full',
        verified: true
      }
    ],
    isLoading: false,
    error: null
  }),

  useManualBackup: () => ({
    mutateAsync: jest.fn().mockResolvedValue({ backupId: 'backup_123', message: 'Backup created' }),
    isPending: false
  }),

  useBackupRestore: () => ({
    mutateAsync: jest.fn().mockResolvedValue({ message: 'Restore completed', restoredTables: ['users', 'products'] }),
    isPending: false
  }),

  useBackupDelete: () => ({
    mutateAsync: jest.fn().mockResolvedValue({}),
    isPending: false
  }),

  useLogs: () => ({
    data: [
      {
        timestamp: new Date('2024-01-15T14:30:00Z'),
        service: 'backend',
        level: 'info',
        message: 'Application started successfully',
        metadata: {},
        traceId: 'trace-001'
      }
    ],
    isLoading: false,
    error: null
  }),

  useLogExport: () => ({
    mutate: jest.fn(),
    isPending: false
  }),

  useSystemAlerts: () => ({
    data: [],
    isLoading: false,
    error: null
  }),

  useAlertAcknowledgment: () => ({
    mutateAsync: jest.fn(),
    isPending: false
  }),

  useAlertResolution: () => ({
    mutateAsync: jest.fn(),
    isPending: false
  }),

  useActiveSessions: () => ({
    data: [
      {
        id: 'session-1',
        userId: 'user-1',
        username: 'admin',
        role: 'Owner',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0...',
        loginTime: new Date('2024-01-15T12:00:00Z'),
        lastActivity: new Date('2024-01-15T14:25:00Z'),
        isActive: true,
        location: 'Local Network'
      }
    ],
    isLoading: false,
    error: null
  }),

  useSessionTermination: () => ({
    mutateAsync: jest.fn(),
    isPending: false
  }),

  useUserSessionsTermination: () => ({
    mutateAsync: jest.fn().mockResolvedValue({ terminatedSessions: 2 }),
    isPending: false
  })
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

describe('System Administration Dashboard - Comprehensive Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders main system administration page with all tabs', async () => {
    render(
      <TestWrapper>
        <SystemAdministration />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('system.admin.title')).toBeInTheDocument();
      expect(screen.getByText('system.admin.description')).toBeInTheDocument();
    });

    // Check that all tabs are present
    expect(screen.getByText('system.admin.tabs.overview')).toBeInTheDocument();
    expect(screen.getByText('system.admin.tabs.services')).toBeInTheDocument();
    expect(screen.getByText('system.admin.tabs.security')).toBeInTheDocument();
    expect(screen.getByText('system.admin.tabs.performance')).toBeInTheDocument();
    expect(screen.getByText('system.admin.tabs.database')).toBeInTheDocument();
    expect(screen.getByText('system.admin.tabs.redis')).toBeInTheDocument();
    expect(screen.getByText('system.admin.tabs.backups')).toBeInTheDocument();
    expect(screen.getByText('system.admin.tabs.logs')).toBeInTheDocument();
  });

  it('displays system health overview with correct data', async () => {
    render(
      <TestWrapper>
        <SystemHealthOverview />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('system.health.overall')).toBeInTheDocument();
      expect(screen.getByText('85/100')).toBeInTheDocument();
      expect(screen.getByText('25.4%')).toBeInTheDocument(); // CPU usage
      expect(screen.getByText('50.0%')).toBeInTheDocument(); // Memory usage
    });
  });

  it('displays service status grid with service information', async () => {
    render(
      <TestWrapper>
        <ServiceStatusGrid />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('backend')).toBeInTheDocument();
      expect(screen.getByText('database')).toBeInTheDocument();
      expect(screen.getByText('redis')).toBeInTheDocument();
      expect(screen.getByText('2d 14h 32m')).toBeInTheDocument(); // Backend uptime
    });

    // Check for restart buttons
    const restartButtons = screen.getAllByText('system.actions.restart');
    expect(restartButtons.length).toBeGreaterThan(0);
  });

  it('displays security monitoring information', async () => {
    render(
      <TestWrapper>
        <SecurityMonitoring />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('security.ssl.title')).toBeInTheDocument();
      expect(screen.getByText('localhost')).toBeInTheDocument(); // SSL domain
      expect(screen.getByText('335 common.days')).toBeInTheDocument(); // Days until expiry
      expect(screen.getByText('95/100')).toBeInTheDocument(); // Security score
    });
  });

  it('handles tab navigation correctly', async () => {
    render(
      <TestWrapper>
        <SystemAdministration />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('system.admin.title')).toBeInTheDocument();
    });

    // Click on services tab
    const servicesTab = screen.getByText('system.admin.tabs.services');
    fireEvent.click(servicesTab);

    // Should show services content
    await waitFor(() => {
      expect(screen.getByText('backend')).toBeInTheDocument();
    });

    // Click on security tab
    const securityTab = screen.getByText('system.admin.tabs.security');
    fireEvent.click(securityTab);

    // Should show security content
    await waitFor(() => {
      expect(screen.getByText('security.ssl.title')).toBeInTheDocument();
    });
  });

  it('shows access denied for non-admin users', async () => {
    // Mock non-admin user
    const mockUseAuth = require('../hooks/useAuth');
    mockUseAuth.useAuth.mockReturnValue({
      hasAnyRole: () => false,
      user: { role: 'Employee' }
    });

    render(
      <TestWrapper>
        <SystemAdministration />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('system.admin.accessDenied')).toBeInTheDocument();
    });
  });

  it('handles loading states correctly', async () => {
    // Mock loading state
    const mockUseSystemAdmin = require('../hooks/useSystemAdmin');
    mockUseSystemAdmin.useSystemHealth.mockReturnValue({
      data: null,
      isLoading: true,
      error: null
    });

    render(
      <TestWrapper>
        <SystemHealthOverview />
      </TestWrapper>
    );

    // Should show loading skeleton
    const loadingElements = screen.getAllByRole('generic');
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it('handles error states correctly', async () => {
    // Mock error state
    const mockUseSystemAdmin = require('../hooks/useSystemAdmin');
    mockUseSystemAdmin.useSystemHealth.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Failed to load system health')
    });

    render(
      <TestWrapper>
        <SystemHealthOverview />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('system.health.error')).toBeInTheDocument();
    });
  });
});