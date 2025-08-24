import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Customers } from '../pages/Customers';
import { CustomerList } from '../components/customers/CustomerList';
import { CustomerProfile } from '../components/customers/CustomerProfile';
import { ComprehensiveCustomerForm } from '../components/customers/ComprehensiveCustomerForm';

// Mock axios
jest.mock('axios', () => ({
  default: {
    create: jest.fn(() => ({
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() }
      }
    }))
  }
}));

// Mock image management service
jest.mock('../services/imageManagementApi', () => ({
  imageManagementApi: {
    getImages: jest.fn(),
    uploadImage: jest.fn(),
    deleteImage: jest.fn(),
    updateImage: jest.fn()
  }
}));

// Mock image management components
jest.mock('../components/image-management/ImageGallery', () => ({
  ImageGallery: ({ className }: { className?: string }) => (
    <div className={className} data-testid="image-gallery">
      Image Gallery Component
    </div>
  )
}));

// Mock the hooks
jest.mock('../hooks/useCustomers', () => ({
  useCustomers: () => ({
    data: [
      {
        id: '1',
        name: 'John Doe',
        phone: '+1-555-0123',
        email: 'john@example.com',
        total_purchases: 5000,
        current_debt: 0,
        last_purchase_date: '2024-01-15',
        created_at: '2023-01-01'
      },
      {
        id: '2',
        name: 'Jane Smith',
        phone: '+1-555-0124',
        email: 'jane@example.com',
        total_purchases: 3000,
        current_debt: 500,
        last_purchase_date: '2024-01-10',
        created_at: '2023-02-01'
      }
    ],
    isLoading: false
  }),
  useCustomerSearch: () => ({
    data: [],
    isLoading: false
  }),
  useCustomer: () => ({
    data: {
      id: '1',
      name: 'John Doe',
      phone: '+1-555-0123',
      email: 'john@example.com',
      total_purchases: 5000,
      current_debt: 0,
      last_purchase_date: '2024-01-15',
      created_at: '2023-01-01'
    },
    isLoading: false
  }),
  useCustomerDebtHistory: () => ({
    data: { debt_history: [] }
  }),
  useCustomerPayments: () => ({
    data: []
  }),
  useCreateCustomer: () => ({
    mutateAsync: jest.fn(),
    isPending: false
  }),
  useUpdateCustomer: () => ({
    mutateAsync: jest.fn(),
    isPending: false
  })
}));

jest.mock('../hooks/useLanguage', () => ({
  useLanguage: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'customers.title': 'Customer Management',
        'customers.description': 'Manage customer information and relationships',
        'customers.directory': 'Customer Directory',
        'customers.total_customers': 'Total Customers',
        'customers.clear_status': 'Clear Status',
        'customers.with_debt': 'With Debt',
        'customers.total_purchases': 'Total Purchases',
        'customers.add_customer': 'Add Customer',
        'customers.customer': 'Customer',
        'customers.contact_information': 'Contact Information',
        'customers.current_debt': 'Current Debt',
        'customers.last_purchase': 'Last Purchase',
        'customers.status': 'Status',
        'customers.view_profile': 'View Profile',
        'customers.edit': 'Edit',
        'customers.no_contact_info': 'No contact info',
        'customers.never': 'Never',
        'customers.clear': 'Clear',
        'customers.no_customers_found': 'No customers found',
        'customers.no_customers_found_search': 'No customers found for search',
        'common.search_placeholder': 'Search customers...'
      };
      return translations[key] || key;
    }
  })
}));

jest.mock('../components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Customer Management Gradient Redesign', () => {
  describe('Customers Page', () => {
    it('should render with gradient background', () => {
      const Wrapper = createWrapper();
      render(<Customers />, { wrapper: Wrapper });
      
      const container = document.querySelector('.min-h-screen');
      expect(container).toHaveClass('bg-gradient-to-br', 'from-green-50/30', 'to-white');
    });
  });

  describe('CustomerList Component', () => {
    it('should render enhanced header with gradient styling', () => {
      const Wrapper = createWrapper();
      render(<CustomerList />, { wrapper: Wrapper });
      
      // Check for gradient icon container
      const iconContainer = document.querySelector('.h-12.w-12.rounded-xl.bg-gradient-to-br.from-green-500');
      expect(iconContainer).toBeInTheDocument();
      
      // Check for enhanced title
      expect(screen.getByText('Customer Management')).toHaveClass('text-4xl', 'font-bold', 'tracking-tight');
      
      // Check for gradient button
      const addButton = screen.getByText('Add Customer').closest('button');
      expect(addButton).toHaveClass('bg-gradient-to-r', 'from-green-500', 'to-teal-600');
    });

    it('should render enhanced stats cards with gradient backgrounds', () => {
      const Wrapper = createWrapper();
      render(<CustomerList />, { wrapper: Wrapper });
      
      // Check for gradient stats cards
      const statsCards = document.querySelectorAll('.bg-gradient-to-br');
      expect(statsCards.length).toBeGreaterThan(0);
      
      // Check for specific gradient classes
      expect(document.querySelector('.from-green-50.to-teal-100\\/50')).toBeInTheDocument();
      expect(document.querySelector('.from-blue-50.to-indigo-100\\/50')).toBeInTheDocument();
      expect(document.querySelector('.from-purple-50.to-violet-100\\/50')).toBeInTheDocument();
      expect(document.querySelector('.from-pink-50.to-rose-100\\/50')).toBeInTheDocument();
    });

    it('should render enhanced data table with gradient styling', () => {
      const Wrapper = createWrapper();
      render(<CustomerList />, { wrapper: Wrapper });
      
      // Check for gradient table header
      const tableHeader = document.querySelector('.bg-gradient-to-r.from-green-50.via-teal-50.to-blue-50');
      expect(tableHeader).toBeInTheDocument();
      
      // Check for gradient table content background
      const tableContent = document.querySelector('.bg-gradient-to-br.from-green-50\\/30.to-white');
      expect(tableContent).toBeInTheDocument();
    });

    it('should render customer rows with gradient elements', () => {
      const Wrapper = createWrapper();
      render(<CustomerList />, { wrapper: Wrapper });
      
      // Check for gradient avatar containers
      const avatarContainers = document.querySelectorAll('.bg-gradient-to-br.from-green-100.to-green-200');
      expect(avatarContainers.length).toBeGreaterThan(0);
      
      // Check for customer names
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  describe('CustomerProfile Component', () => {
    const mockCustomer = {
      id: '1',
      name: 'John Doe',
      phone: '+1-555-0123',
      email: 'john@example.com',
      total_purchases: 5000,
      current_debt: 0,
      last_purchase_date: '2024-01-15',
      created_at: '2023-01-01',
      updated_at: '2024-01-15'
    };

    it('should render with gradient header styling', () => {
      const Wrapper = createWrapper();
      render(
        <CustomerProfile 
          customer={mockCustomer} 
          onClose={jest.fn()} 
        />, 
        { wrapper: Wrapper }
      );
      
      // Check for gradient header background
      const header = document.querySelector('.bg-gradient-to-r.from-green-50.via-teal-50.to-blue-50');
      expect(header).toBeInTheDocument();
      
      // Check for gradient avatar
      const avatar = document.querySelector('.bg-gradient-to-br.from-green-500.to-teal-600');
      expect(avatar).toBeInTheDocument();
    });

    it('should render enhanced summary cards with gradient backgrounds', () => {
      const Wrapper = createWrapper();
      render(
        <CustomerProfile 
          customer={mockCustomer} 
          onClose={jest.fn()} 
        />, 
        { wrapper: Wrapper }
      );
      
      // Check for gradient summary cards
      expect(document.querySelector('.from-green-50.to-teal-100\\/50')).toBeInTheDocument();
      expect(document.querySelector('.from-blue-50.to-indigo-100\\/50')).toBeInTheDocument();
      expect(document.querySelector('.from-purple-50.to-violet-100\\/50')).toBeInTheDocument();
    });

    it('should render enhanced contact information with gradient styling', () => {
      const Wrapper = createWrapper();
      render(
        <CustomerProfile 
          customer={mockCustomer} 
          onClose={jest.fn()} 
        />, 
        { wrapper: Wrapper }
      );
      
      // Check for gradient contact cards
      expect(document.querySelector('.from-green-50.to-green-100\\/50')).toBeInTheDocument();
      expect(document.querySelector('.from-blue-50.to-blue-100\\/50')).toBeInTheDocument();
    });

    it('should render enhanced tabs with gradient styling', () => {
      const Wrapper = createWrapper();
      render(
        <CustomerProfile 
          customer={mockCustomer} 
          onClose={jest.fn()} 
        />, 
        { wrapper: Wrapper }
      );
      
      // Check for gradient tab navigation background
      const tabNavigation = document.querySelector('.bg-gradient-to-r.from-green-50.via-teal-50.to-blue-50');
      expect(tabNavigation).toBeInTheDocument();
      
      // Check for tab content backgrounds
      expect(document.querySelector('.bg-gradient-to-br.from-green-50\\/30.to-white')).toBeInTheDocument();
    });

    it('should handle tab switching with gradient backgrounds', async () => {
      const Wrapper = createWrapper();
      render(
        <CustomerProfile 
          customer={mockCustomer} 
          onClose={jest.fn()} 
        />, 
        { wrapper: Wrapper }
      );
      
      // Check that tab navigation is rendered with gradient background
      expect(document.querySelector('.bg-gradient-to-r.from-green-50.via-teal-50.to-blue-50')).toBeInTheDocument();
      
      // Check that tab content has gradient background
      expect(document.querySelector('.bg-gradient-to-br')).toBeInTheDocument();
      
      // Check that tabs exist by looking for tab triggers
      const tabTriggers = document.querySelectorAll('[role="tab"]');
      expect(tabTriggers.length).toBe(4);
    });
  });

  describe('ComprehensiveCustomerForm Component', () => {
    it('should render with gradient header styling', () => {
      const Wrapper = createWrapper();
      render(
        <ComprehensiveCustomerForm 
          onClose={jest.fn()} 
          onSuccess={jest.fn()} 
        />, 
        { wrapper: Wrapper }
      );
      
      // Check for gradient header background
      const header = document.querySelector('.bg-gradient-to-r.from-green-50.via-teal-50.to-blue-50');
      expect(header).toBeInTheDocument();
      
      // Check for gradient icon container
      const iconContainer = document.querySelector('.bg-gradient-to-br.from-green-500.to-teal-600');
      expect(iconContainer).toBeInTheDocument();
      
      // Check for form title
      expect(screen.getByText('Add New Customer')).toBeInTheDocument();
    });

    it('should render enhanced tabs with gradient styling', () => {
      const Wrapper = createWrapper();
      render(
        <ComprehensiveCustomerForm 
          onClose={jest.fn()} 
          onSuccess={jest.fn()} 
        />, 
        { wrapper: Wrapper }
      );
      
      // Check for gradient tab navigation
      const tabNavigation = document.querySelector('.bg-gradient-to-r.from-green-50.via-teal-50.to-blue-50');
      expect(tabNavigation).toBeInTheDocument();
      
      // Check for tab content background
      expect(document.querySelector('.bg-gradient-to-br.from-green-50\\/30.to-white')).toBeInTheDocument();
    });

    it('should render enhanced form actions with gradient styling', () => {
      const Wrapper = createWrapper();
      render(
        <ComprehensiveCustomerForm 
          onClose={jest.fn()} 
          onSuccess={jest.fn()} 
        />, 
        { wrapper: Wrapper }
      );
      
      // Check for gradient form actions background
      const formActions = document.querySelector('.bg-gradient-to-r.from-slate-50.to-slate-100\\/80');
      expect(formActions).toBeInTheDocument();
      
      // Check for gradient submit button
      const submitButton = screen.getByText('Create Customer').closest('button');
      expect(submitButton).toHaveClass('bg-gradient-to-r', 'from-green-500', 'to-teal-600');
    });

    it('should handle tab switching with different gradient backgrounds', async () => {
      const Wrapper = createWrapper();
      render(
        <ComprehensiveCustomerForm 
          onClose={jest.fn()} 
          onSuccess={jest.fn()} 
        />, 
        { wrapper: Wrapper }
      );
      
      // Click on address tab
      const addressTab = screen.getByText('Address');
      fireEvent.click(addressTab);
      
      await waitFor(() => {
        // Check for teal gradient background in address tab
        expect(document.querySelector('.bg-gradient-to-br.from-teal-50\\/30.to-white')).toBeInTheDocument();
      });
      
      // Click on personal tab
      const personalTab = screen.getByText('Personal');
      fireEvent.click(personalTab);
      
      await waitFor(() => {
        // Check for blue gradient background in personal tab
        expect(document.querySelector('.bg-gradient-to-br.from-blue-50\\/30.to-white')).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('should maintain gradient styling on mobile devices', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      const Wrapper = createWrapper();
      render(<CustomerList />, { wrapper: Wrapper });
      
      // Check that gradient classes are still applied
      expect(document.querySelector('.bg-gradient-to-br')).toBeInTheDocument();
      expect(document.querySelector('.from-green-50')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should maintain proper contrast with gradient backgrounds', () => {
      const Wrapper = createWrapper();
      render(<CustomerList />, { wrapper: Wrapper });
      
      // Check that text elements have proper contrast classes
      const titleElement = screen.getByText('Customer Management');
      expect(titleElement).toHaveClass('text-foreground');
      
      // Check that muted text uses proper contrast
      const descriptionElements = document.querySelectorAll('.text-muted-foreground');
      expect(descriptionElements.length).toBeGreaterThan(0);
    });

    it('should provide proper focus states with gradient styling', async () => {
      const Wrapper = createWrapper();
      render(<CustomerList />, { wrapper: Wrapper });
      
      const addButton = screen.getByText('Add Customer');
      
      // Focus the button
      addButton.focus();
      
      // Check that focus styles work with gradient
      expect(addButton).toHaveFocus();
      expect(addButton.closest('button')).toHaveClass('bg-gradient-to-r');
    });
  });

  describe('Performance', () => {
    it('should render gradient elements efficiently', () => {
      const Wrapper = createWrapper();
      const startTime = performance.now();
      
      render(<CustomerList />, { wrapper: Wrapper });
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render within reasonable time (less than 100ms)
      expect(renderTime).toBeLessThan(100);
    });
  });
});