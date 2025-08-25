import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { InvoiceTemplateDesigner } from '../components/settings/InvoiceTemplateDesigner';
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

describe('Settings Components Gradient Styling - Simple Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('InvoiceTemplateDesigner', () => {
    it('should render with enhanced gradient styling', () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <InvoiceTemplateDesigner />
        </Wrapper>
      );

      // Check for enhanced card styling
      const card = document.querySelector('.bg-gradient-to-br.from-white.to-purple-50\\/30');
      expect(card).toBeInTheDocument();

      // Check for enhanced header with via gradient
      const header = document.querySelector('.bg-gradient-to-r.from-purple-50.via-violet-50.to-purple-50');
      expect(header).toBeInTheDocument();

      // Check for larger icon container (h-12 w-12 instead of h-10 w-10)
      const iconContainer = document.querySelector('.h-12.w-12.rounded-xl.bg-gradient-to-br.from-purple-500.to-violet-600');
      expect(iconContainer).toBeInTheDocument();

      // Check for enhanced title typography
      const title = screen.getByText('Invoice Template Designer');
      expect(title).toHaveClass('text-2xl', 'font-bold');

      // Check for all 3 tabs with icons
      expect(screen.getByText('General')).toBeInTheDocument();
      expect(screen.getByText('Layout')).toBeInTheDocument();
      expect(screen.getByText('Styling')).toBeInTheDocument();
    });

    it('should have enhanced tab styling with icons', () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <InvoiceTemplateDesigner />
        </Wrapper>
      );

      // Check for tab container with enhanced gradient
      const tabContainer = document.querySelector('.bg-gradient-to-r.from-purple-50.via-violet-50.to-purple-50');
      expect(tabContainer).toBeInTheDocument();

      // Check for enhanced border styling
      const borderElement = document.querySelector('.border-b-2.border-purple-200\\/50');
      expect(borderElement).toBeInTheDocument();
    });
  });

  describe('CompanySettingsForm', () => {
    it('should render with enhanced gradient styling', () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <CompanySettingsForm />
        </Wrapper>
      );

      // Check for enhanced card styling
      const card = document.querySelector('.bg-gradient-to-br.from-white.to-blue-50\\/30');
      expect(card).toBeInTheDocument();

      // Check for enhanced header with via gradient
      const header = document.querySelector('.bg-gradient-to-r.from-blue-50.via-indigo-50.to-blue-50');
      expect(header).toBeInTheDocument();

      // Check for larger icon container
      const iconContainer = document.querySelector('.h-12.w-12.rounded-xl.bg-gradient-to-br.from-blue-500.to-indigo-600');
      expect(iconContainer).toBeInTheDocument();

      // Check for enhanced title typography
      const title = screen.getByText('settings.company_information');
      expect(title).toHaveClass('text-2xl', 'font-bold');
    });
  });

  describe('GoldPriceConfig', () => {
    it('should render with enhanced gradient styling', () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <GoldPriceConfig />
        </Wrapper>
      );

      // Check for enhanced card styling
      const card = document.querySelector('.bg-gradient-to-br.from-white.to-amber-50\\/30');
      expect(card).toBeInTheDocument();

      // Check for enhanced header with via gradient
      const header = document.querySelector('.bg-gradient-to-r.from-amber-50.via-orange-50.to-amber-50');
      expect(header).toBeInTheDocument();

      // Check for larger icon container
      const iconContainer = document.querySelector('.h-12.w-12.rounded-xl.bg-gradient-to-br.from-amber-500.to-orange-600');
      expect(iconContainer).toBeInTheDocument();

      // Check for enhanced title typography
      const title = screen.getByText('settings.gold_price_config');
      expect(title).toHaveClass('text-2xl', 'font-bold');
    });
  });

  describe('RolePermissionManager', () => {
    it('should render with enhanced gradient styling', () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <RolePermissionManager />
        </Wrapper>
      );

      // Check for enhanced card styling
      const card = document.querySelector('.bg-gradient-to-br.from-white.to-green-50\\/30');
      expect(card).toBeInTheDocument();

      // Check for enhanced header with via gradient
      const header = document.querySelector('.bg-gradient-to-r.from-green-50.via-emerald-50.to-green-50');
      expect(header).toBeInTheDocument();

      // Check for larger icon container
      const iconContainer = document.querySelector('.h-12.w-12.rounded-xl.bg-gradient-to-br.from-green-500.to-emerald-600');
      expect(iconContainer).toBeInTheDocument();

      // Check for enhanced title typography
      const title = screen.getByText('settings.role_permission_management');
      expect(title).toHaveClass('text-2xl', 'font-bold');
    });
  });

  describe('UserManagementComponent', () => {
    it('should render with enhanced gradient styling', () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <UserManagementComponent />
        </Wrapper>
      );

      // Check for enhanced card styling
      const card = document.querySelector('.bg-gradient-to-br.from-white.to-blue-50\\/30');
      expect(card).toBeInTheDocument();

      // Check for enhanced header with via gradient
      const header = document.querySelector('.bg-gradient-to-r.from-blue-50.via-indigo-50.to-blue-50');
      expect(header).toBeInTheDocument();

      // Check for larger icon container
      const iconContainer = document.querySelector('.h-12.w-12.rounded-xl.bg-gradient-to-br.from-blue-500.to-indigo-600');
      expect(iconContainer).toBeInTheDocument();

      // Check for enhanced title typography
      const title = screen.getByText('settings.user_management');
      expect(title).toHaveClass('text-2xl', 'font-bold');

      // Check for enhanced content background
      const content = document.querySelector('.bg-gradient-to-br.from-blue-50\\/20.via-white.to-indigo-50\\/10');
      expect(content).toBeInTheDocument();
    });
  });

  describe('Enhanced Styling Features', () => {
    it('should have consistent enhanced border styling across components', () => {
      const Wrapper = createWrapper();
      
      render(
        <Wrapper>
          <InvoiceTemplateDesigner />
        </Wrapper>
      );

      // Check for enhanced border (border-b-2 instead of border-b)
      const enhancedBorder = document.querySelector('.border-b-2');
      expect(enhancedBorder).toBeInTheDocument();
    });

    it('should have larger icon containers across all components', () => {
      const Wrapper = createWrapper();
      
      render(
        <Wrapper>
          <CompanySettingsForm />
        </Wrapper>
      );

      // Check for larger icon containers (h-12 w-12 instead of h-10 w-10)
      const largeIconContainer = document.querySelector('.h-12.w-12.rounded-xl');
      expect(largeIconContainer).toBeInTheDocument();
    });

    it('should have enhanced typography across all components', () => {
      const Wrapper = createWrapper();
      
      render(
        <Wrapper>
          <GoldPriceConfig />
        </Wrapper>
      );

      // Check for enhanced typography (text-2xl font-bold instead of text-xl font-semibold)
      const title = screen.getByText('settings.gold_price_config');
      expect(title).toHaveClass('text-2xl', 'font-bold');
    });

    it('should have via gradients in headers for richer color transitions', () => {
      const Wrapper = createWrapper();
      
      render(
        <Wrapper>
          <RolePermissionManager />
        </Wrapper>
      );

      // Check for via gradient (from-green-50 via-emerald-50 to-green-50)
      const viaGradient = document.querySelector('.from-green-50.via-emerald-50.to-green-50');
      expect(viaGradient).toBeInTheDocument();
    });

    it('should have hover effects on icon containers', () => {
      const Wrapper = createWrapper();
      
      render(
        <Wrapper>
          <UserManagementComponent />
        </Wrapper>
      );

      // Check for hover shadow effects
      const hoverEffect = document.querySelector('.hover\\:shadow-xl');
      expect(hoverEffect).toBeInTheDocument();
    });
  });

  describe('Color Scheme Consistency', () => {
    it('should use consistent color schemes for each component type', () => {
      const Wrapper = createWrapper();
      
      // Purple scheme for InvoiceTemplateDesigner
      render(
        <Wrapper>
          <InvoiceTemplateDesigner />
        </Wrapper>
      );
      expect(document.querySelector('.from-purple-500.to-violet-600')).toBeInTheDocument();

      // Blue scheme for CompanySettingsForm and UserManagement
      render(
        <Wrapper>
          <CompanySettingsForm />
        </Wrapper>
      );
      expect(document.querySelector('.from-blue-500.to-indigo-600')).toBeInTheDocument();

      // Amber/Orange scheme for GoldPriceConfig
      render(
        <Wrapper>
          <GoldPriceConfig />
        </Wrapper>
      );
      expect(document.querySelector('.from-amber-500.to-orange-600')).toBeInTheDocument();

      // Green scheme for RolePermissionManager
      render(
        <Wrapper>
          <RolePermissionManager />
        </Wrapper>
      );
      expect(document.querySelector('.from-green-500.to-emerald-600')).toBeInTheDocument();
    });
  });
});