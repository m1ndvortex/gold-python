import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import SystemAdministration from '../pages/SystemAdministration';

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

// Mock all system admin hooks
jest.mock('../hooks/useSystemAdmin', () => ({
  useSystemHealth: () => ({
    data: {
      overall: { status: 'healthy', score: 85, message: 'System healthy' },
      resources: {
        cpu: { current: 25, average: 22, trend: 'stable' },
        memory: { used: 4000000000, total: 8000000000, percentage: 50, trend: 'stable' },
        disk: { used: 100000000000, total: 200000000000, percentage: 50, trend: 'up' }
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

describe('System Administration Dashboard', () => {
  it('renders system administration page', async () => {
    render(
      <TestWrapper>
        <SystemAdministration />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('system.admin.title')).toBeInTheDocument();
    });
  });
});