import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { InvoiceTemplateDesigner } from '../components/settings/InvoiceTemplateDesigner';
import { DisasterRecoveryDashboard } from '../components/settings/DisasterRecoveryDashboard';
import { CompanySettingsForm } from '../components/settings/CompanySettingsForm';
import { GoldPriceConfig } from '../components/settings/GoldPriceConfig';
import { RolePermissionManager } from '../components/settings/RolePermissionManager';
import { UserManagementComponent } from '../components/settings/UserManagement';

// Mock the hooks
jest.mock('../hooks/useSettings', () => ({
  useInvoiceTemplate: () => ({ data: null, isLoading: false }),
  useUpdateInvoiceTemplate: () => ({ mutate: jest.fn(), isPending: false }),
  useCompanySettings: () => ({ data: null, isLoading: false }),
  useUpdateCompanySettings: () => ({ mutate: jest.fn(), isPending: false }),
  useGoldPriceConfig: () => ({ data: null, isLoading: false }),
  useUpdateGoldPrice: () => ({ mutate: jest.fn(), isPending: false }),
  useRoles: () => ({ data: [], isLoading: false }),
  useCreateRole: () => ({ mutate: jest.fn(), isPending: false }),
  useUpdateRole: () => ({ mutate: jest.fn(), isPending: false }),
  useDeleteRole: () => ({ mutate: jest.fn(), isPending: false }),
  usePermissionStructure: () => ({ data: { categories: [] }, isLoading: false }),
  useUsers: () => ({ data: { users: [], total: 0 }, isLoading: false }),
  useCreateUser: () => ({ mutate: jest.fn(), isPending: false }),
  useUpdateUser: () => ({ mutate: jest.fn(), isPending: false }),
  useUpdateUserPassword: () => ({ mutate: jest.fn(), isPending: false }),
  useDeleteUser: () => ({ mutate: jest.fn(), isPending: false }),
}));

jest.mock('../hooks/useLanguage', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
    language: 'en',
    setLanguage: jest.fn(),
  }),
}));

jest.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: '1', username: 'testuser' },
  }),
}));

jest.mock('../components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock fetch for DisasterRecoveryDashboard
global.fetch = jest.fn((url) => {
  const mockData = {
    '/api/disaster-recovery/status': {
      status: 'healthy',
      backup_statistics: { total_backups: 0, total_size_bytes: 0 },
      recovery_procedures: { total_procedures: 0 },
      retention_policy: { daily_retention_days: 7 },
      system_health: 'healthy'
    },
    '/api/backup/list': [],
    '/api/disaster-recovery/procedures': [],
    '/api/disaster-recovery/offsite-storage/status': {
      configured: false
    }
  };
  
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(mockData[url as keyof typeof mockData] || {}),
  });
}) as jest.Mock;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Settings Components Gradient Styling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('InvoiceTemplateDesigner', () => {
    it('should render with gradient styling', () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <InvoiceTemplateDesigner />
        </Wrapper>
      );

      // Check for gradient card styling
      const card = document.querySelector('.bg-gradient-to-br.from-white.to-purple-50\\/30');
      expect(card).toBeInTheDocument();

      // Check for gradient header styling
      const header = document.querySelector('.bg-gradient-to-r.from-purple-50.via-violet-50.to-purple-50');
      expect(header).toBeInTheDocument();

      // Check for gradient icon container
      const iconContainer = document.querySelector('.bg-gradient-to-br.from-purple-500.to-violet-600');
      expect(iconContainer).toBeInTheDocument();

      // Check for enhanced tab styling with icons
      expect(screen.getByText('General')).toBeInTheDocument();
      expect(screen.getByText('Layout')).toBeInTheDocument();
      expect(screen.getByText('Styling')).toBeInTheDocument();
    });

    it('should have proper tab navigation with gradient styling', () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <InvoiceTemplateDesigner />
        </Wrapper>
      );

      // Check for tab container gradient
      const tabContainer = document.querySelector('.bg-gradient-to-r.from-purple-50.via-violet-50.to-purple-50');
      expect(tabContainer).toBeInTheDocument();
    });
  });

  describe('DisasterRecoveryDashboard', () => {
    it('should render with gradient styling', async () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <DisasterRecoveryDashboard />
        </Wrapper>
      );

      // Wait for component to load
      await screen.findByText('Disaster Recovery Management');

      // Check for gradient card styling
      const card = document.querySelector('.bg-gradient-to-br.from-white.to-red-50\\/30');
      expect(card).toBeInTheDocument();

      // Check for gradient header styling
      const header = document.querySelector('.bg-gradient-to-r.from-red-50.via-orange-50.to-red-50');
      expect(header).toBeInTheDocument();

      // Check for gradient icon container
      const iconContainer = document.querySelector('.bg-gradient-to-br.from-red-500.to-orange-600');
      expect(iconContainer).toBeInTheDocument();
    });

    it('should have proper tab navigation with gradient styling', async () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <DisasterRecoveryDashboard />
        </Wrapper>
      );

      // Wait for component to load
      await screen.findByText('Overview');

      // Check for tab container gradient
      const tabContainer = document.querySelector('.bg-gradient-to-r.from-red-50.via-orange-50.to-red-50');
      expect(tabContainer).toBeInTheDocument();

      // Check for all 5 tabs
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Backups')).toBeInTheDocument();
      expect(screen.getByText('Procedures')).toBeInTheDocument();
      expect(screen.getByText('Storage')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });
  });

  describe('CompanySettingsForm', () => {
    it('should render with gradient styling', () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <CompanySettingsForm />
        </Wrapper>
      );

      // Check for gradient card styling
      const card = document.querySelector('.bg-gradient-to-br.from-white.to-blue-50\\/30');
      expect(card).toBeInTheDocument();

      // Check for gradient header styling
      const header = document.querySelector('.bg-gradient-to-r.from-blue-50.via-indigo-50.to-blue-50');
      expect(header).toBeInTheDocument();

      // Check for gradient icon container
      const iconContainer = document.querySelector('.bg-gradient-to-br.from-blue-500.to-indigo-600');
      expect(iconContainer).toBeInTheDocument();
    });
  });

  describe('GoldPriceConfig', () => {
    it('should render with gradient styling', () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <GoldPriceConfig />
        </Wrapper>
      );

      // Check for gradient card styling
      const card = document.querySelector('.bg-gradient-to-br.from-white.to-amber-50\\/30');
      expect(card).toBeInTheDocument();

      // Check for gradient header styling
      const header = document.querySelector('.bg-gradient-to-r.from-amber-50.via-orange-50.to-amber-50');
      expect(header).toBeInTheDocument();

      // Check for gradient icon container
      const iconContainer = document.querySelector('.bg-gradient-to-br.from-amber-500.to-orange-600');
      expect(iconContainer).toBeInTheDocument();
    });
  });

  describe('RolePermissionManager', () => {
    it('should render with gradient styling', () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <RolePermissionManager />
        </Wrapper>
      );

      // Check for gradient card styling
      const card = document.querySelector('.bg-gradient-to-br.from-white.to-green-50\\/30');
      expect(card).toBeInTheDocument();

      // Check for gradient header styling
      const header = document.querySelector('.bg-gradient-to-r.from-green-50.via-emerald-50.to-green-50');
      expect(header).toBeInTheDocument();

      // Check for gradient icon container
      const iconContainer = document.querySelector('.bg-gradient-to-br.from-green-500.to-emerald-600');
      expect(iconContainer).toBeInTheDocument();
    });
  });

  describe('UserManagementComponent', () => {
    it('should render with gradient styling', () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <UserManagementComponent />
        </Wrapper>
      );

      // Check for gradient card styling
      const card = document.querySelector('.bg-gradient-to-br.from-white.to-blue-50\\/30');
      expect(card).toBeInTheDocument();

      // Check for gradient header styling
      const header = document.querySelector('.bg-gradient-to-r.from-blue-50.via-indigo-50.to-blue-50');
      expect(header).toBeInTheDocument();

      // Check for gradient icon container
      const iconContainer = document.querySelector('.bg-gradient-to-br.from-blue-500.to-indigo-600');
      expect(iconContainer).toBeInTheDocument();
    });
  });

  describe('Gradient Button Styling', () => {
    it('should have consistent gradient button styling across components', () => {
      const Wrapper = createWrapper();
      
      // Test InvoiceTemplateDesigner buttons
      render(
        <Wrapper>
          <InvoiceTemplateDesigner />
        </Wrapper>
      );

      const purpleButton = document.querySelector('.bg-gradient-to-r.from-purple-500.to-violet-600');
      expect(purpleButton).toBeInTheDocument();

      // Test CompanySettingsForm buttons
      render(
        <Wrapper>
          <CompanySettingsForm />
        </Wrapper>
      );

      const blueButton = document.querySelector('.bg-gradient-to-r.from-blue-500.to-indigo-600');
      expect(blueButton).toBeInTheDocument();

      // Test GoldPriceConfig buttons
      render(
        <Wrapper>
          <GoldPriceConfig />
        </Wrapper>
      );

      const amberButton = document.querySelector('.bg-gradient-to-r.from-amber-500.to-orange-600');
      expect(amberButton).toBeInTheDocument();
    });
  });

  describe('Enhanced Icon Containers', () => {
    it('should have larger, more prominent icon containers', () => {
      const Wrapper = createWrapper();
      
      render(
        <Wrapper>
          <InvoiceTemplateDesigner />
        </Wrapper>
      );

      // Check for enhanced icon container size (h-12 w-12 instead of h-10 w-10)
      const iconContainer = document.querySelector('.h-12.w-12.rounded-xl');
      expect(iconContainer).toBeInTheDocument();
    });
  });

  describe('Typography Enhancements', () => {
    it('should have enhanced typography with larger, bolder titles', () => {
      const Wrapper = createWrapper();
      
      render(
        <Wrapper>
          <InvoiceTemplateDesigner />
        </Wrapper>
      );

      // Check for enhanced title styling (text-2xl font-bold instead of text-xl font-semibold)
      const title = screen.getByText('Invoice Template Designer');
      expect(title).toHaveClass('text-2xl', 'font-bold');
    });
  });
});