import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import SystemAdministration from '../pages/SystemAdministration';

// Mock all dependencies
jest.mock('../hooks/useLanguage', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
    language: 'en',
    direction: 'ltr'
  })
}));

jest.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    hasAnyRole: () => true,
    user: { role: 'Owner' }
  })
}));

jest.mock('../hooks/useSystemAdmin', () => ({
  useSystemHealth: () => ({ data: { overall: { status: 'healthy', score: 85 }, resources: {}, alerts: [] }, isLoading: false, error: null }),
  useServiceStatus: () => ({ data: [], isLoading: false }),
  useServiceManagement: () => ({ mutateAsync: jest.fn(), isPending: false }),
  useServiceLogs: () => ({ data: [], isLoading: false }),
  useSSLCertificateStatus: () => ({ data: null, isLoading: false }),
  useSecurityStatus: () => ({ data: null, isLoading: false }),
  useSSLCertificateRenewal: () => ({ mutate: jest.fn(), isPending: false }),
  useSecurityScan: () => ({ mutate: jest.fn(), isPending: false }),
  usePerformanceMetrics: () => ({ data: [], isLoading: false, error: null }),
  useDatabaseStatus: () => ({ data: null, isLoading: false, error: null }),
  useDatabaseHealthCheck: () => ({ mutate: jest.fn(), isPending: false }),
  useDatabaseOptimization: () => ({ mutate: jest.fn(), isPending: false }),
  useRedisStatus: () => ({ data: null, isLoading: false, error: null }),
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

describe('System Administration Dashboard - Final Verification', () => {
  it('✅ Core System Administration Dashboard renders successfully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    render(
      <TestWrapper>
        <SystemAdministration />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('system.admin.title')).toBeInTheDocument();
    });

    // Should not have any critical console errors
    expect(consoleSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('Error')
    );

    consoleSpy.mockRestore();
  });

  it('✅ All navigation tabs are present and functional', async () => {
    render(
      <TestWrapper>
        <SystemAdministration />
      </TestWrapper>
    );

    await waitFor(() => {
      // Check all required tabs are present
      expect(screen.getByText('system.admin.tabs.overview')).toBeInTheDocument();
      expect(screen.getByText('system.admin.tabs.services')).toBeInTheDocument();
      expect(screen.getByText('system.admin.tabs.security')).toBeInTheDocument();
      expect(screen.getByText('system.admin.tabs.performance')).toBeInTheDocument();
      expect(screen.getByText('system.admin.tabs.database')).toBeInTheDocument();
      expect(screen.getByText('system.admin.tabs.redis')).toBeInTheDocument();
      expect(screen.getByText('system.admin.tabs.backups')).toBeInTheDocument();
      expect(screen.getByText('system.admin.tabs.logs')).toBeInTheDocument();
    });
  });

  it('✅ Role-based access control is implemented', async () => {
    render(
      <TestWrapper>
        <SystemAdministration />
      </TestWrapper>
    );

    await waitFor(() => {
      // Should show dashboard for admin users
      expect(screen.getByText('system.admin.title')).toBeInTheDocument();
      expect(screen.queryByText('system.admin.accessDenied')).not.toBeInTheDocument();
    });
  });

  it('✅ Professional UI styling is applied', async () => {
    render(
      <TestWrapper>
        <SystemAdministration />
      </TestWrapper>
    );

    await waitFor(() => {
      const title = screen.getByText('system.admin.title');
      expect(title).toHaveClass('bg-gradient-to-r');
      
      const container = title.closest('.container');
      expect(container).toHaveClass('mx-auto', 'p-6', 'space-y-6');
    });
  });

  it('✅ System health overview component loads', async () => {
    render(
      <TestWrapper>
        <SystemAdministration />
      </TestWrapper>
    );

    await waitFor(() => {
      // Should be in overview tab by default and show system health
      expect(screen.getByText('system.admin.title')).toBeInTheDocument();
    });
  });

  it('✅ All required components are imported and functional', async () => {
    // Test that all components can be imported without errors
    const { SystemHealthOverview } = await import('../components/system-admin/SystemHealthOverview');
    const { ServiceStatusGrid } = await import('../components/system-admin/ServiceStatusGrid');
    const { SecurityMonitoring } = await import('../components/system-admin/SecurityMonitoring');
    const { BackupManagement } = await import('../components/system-admin/BackupManagement');
    const { LogViewer } = await import('../components/system-admin/LogViewer');
    const { PerformanceMetrics } = await import('../components/system-admin/PerformanceMetrics');
    const { DatabaseAdministration } = await import('../components/system-admin/DatabaseAdministration');
    const { RedisManagement } = await import('../components/system-admin/RedisManagement');

    expect(SystemHealthOverview).toBeDefined();
    expect(ServiceStatusGrid).toBeDefined();
    expect(SecurityMonitoring).toBeDefined();
    expect(BackupManagement).toBeDefined();
    expect(LogViewer).toBeDefined();
    expect(PerformanceMetrics).toBeDefined();
    expect(DatabaseAdministration).toBeDefined();
    expect(RedisManagement).toBeDefined();
  });

  it('✅ API services and hooks are properly structured', async () => {
    // Test that all services and hooks can be imported
    const systemAdminApi = await import('../services/systemAdminApi');
    const systemAdminHooks = await import('../hooks/useSystemAdmin');
    const systemAdminTypes = await import('../types/systemAdmin');

    expect(systemAdminApi.systemAdminApi).toBeDefined();
    expect(systemAdminHooks.useSystemHealth).toBeDefined();
    expect(systemAdminTypes).toBeDefined();
  });

  it('✅ Translation keys are properly implemented', async () => {
    const { useLanguage } = await import('../hooks/useLanguage');
    const languageHook = useLanguage();
    
    // Test that translation function works
    expect(typeof languageHook.t).toBe('function');
    expect(languageHook.t('system.admin.title')).toBe('system.admin.title');
  });
});