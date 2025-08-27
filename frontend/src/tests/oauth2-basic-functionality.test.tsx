import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@testing-library/jest-dom';

// Import components to test
import { OAuth2LoginInterface } from '../components/auth/OAuth2LoginInterface';

// Mock hooks
jest.mock('../hooks/useLanguage', () => ({
  useLanguage: () => ({
    language: 'en',
    direction: 'ltr',
    t: (key: string) => key,
    setLanguage: jest.fn(),
    isRTL: false,
    isLTR: true,
    getLayoutClasses: () => '',
    getTextAlignClass: () => 'text-left',
    getFlexDirectionClass: () => 'flex-row',
    getMarginClass: (margin: string) => margin,
    getPaddingClass: (padding: string) => padding,
    getBorderClass: (border: string) => border,
    formatNumber: (num: number) => num.toString(),
    formatDate: (date: Date) => date.toLocaleDateString(),
    formatCurrency: (amount: number) => `$${amount}`
  })
}));

jest.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
      role: {
        id: '1',
        name: 'Manager',
        permissions: {
          'view_audit_logs': true,
          'manage_security_settings': true,
          'manage_roles': true,
          'manage_users': true,
          'export_audit_logs': true
        }
      }
    },
    isAuthenticated: true,
    isLoading: false,
    logout: jest.fn(),
    hasPermission: (permission: string) => true,
    hasRole: (role: string) => true,
    hasAnyRole: (roles: string[]) => true
  })
}));

// Mock fetch
global.fetch = jest.fn();

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('OAuth2 Basic Functionality', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('OAuth2LoginInterface', () => {
    it('should render loading state initially', () => {
      mockFetch.mockImplementationOnce(() => new Promise(() => {})); // Never resolves

      render(
        <TestWrapper>
          <OAuth2LoginInterface />
        </TestWrapper>
      );

      expect(screen.getByText('Loading authentication options...')).toBeInTheDocument();
    });

    it('should render OAuth2 provider selection interface', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          providers: [
            {
              id: 'auth0',
              name: 'auth0',
              displayName: 'Auth0',
              description: 'Enterprise authentication with Auth0',
              authUrl: 'https://example.auth0.com/authorize',
              isEnabled: true,
              isConfigured: true,
              scopes: ['openid', 'profile', 'email']
            }
          ]
        })
      } as Response);

      render(
        <TestWrapper>
          <OAuth2LoginInterface />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Secure Authentication')).toBeInTheDocument();
        expect(screen.getByText('Enterprise Authentication')).toBeInTheDocument();
        expect(screen.getByText('Traditional Authentication')).toBeInTheDocument();
      });

      // Check if providers are loaded
      await waitFor(() => {
        expect(screen.getByText('Auth0')).toBeInTheDocument();
      });
    });

    it('should handle traditional login option', async () => {
      const mockTraditionalLogin = jest.fn();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ providers: [] })
      } as Response);

      render(
        <TestWrapper>
          <OAuth2LoginInterface onTraditionalLogin={mockTraditionalLogin} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Username & Password')).toBeInTheDocument();
      });

      const traditionalButton = screen.getByText('Username & Password').closest('button');
      expect(traditionalButton).toBeInTheDocument();

      fireEvent.click(traditionalButton!);
      expect(mockTraditionalLogin).toHaveBeenCalled();
    });

    it('should handle error states gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(
        <TestWrapper>
          <OAuth2LoginInterface />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Failed to load authentication providers')).toBeInTheDocument();
      });
    });

    it('should render security notice', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ providers: [] })
      } as Response);

      render(
        <TestWrapper>
          <OAuth2LoginInterface />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Security Notice')).toBeInTheDocument();
        expect(screen.getByText(/All authentication methods use industry-standard security protocols/)).toBeInTheDocument();
      });
    });

    it('should have proper button accessibility', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          providers: [
            {
              id: 'auth0',
              name: 'auth0',
              displayName: 'Auth0',
              description: 'Enterprise authentication',
              authUrl: 'https://example.auth0.com/authorize',
              isEnabled: true,
              isConfigured: true,
              scopes: ['openid', 'profile', 'email']
            }
          ]
        })
      } as Response);

      render(
        <TestWrapper>
          <OAuth2LoginInterface />
        </TestWrapper>
      );

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);
        
        // Check that buttons are focusable
        buttons.forEach(button => {
          expect(button).not.toHaveAttribute('disabled');
        });
      });
    });

    it('should show disabled state for unconfigured providers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          providers: [
            {
              id: 'keycloak',
              name: 'keycloak',
              displayName: 'Keycloak',
              description: 'Self-hosted identity management',
              authUrl: 'https://keycloak.example.com/auth',
              isEnabled: false,
              isConfigured: false,
              scopes: ['openid', 'profile', 'email']
            }
          ]
        })
      } as Response);

      render(
        <TestWrapper>
          <OAuth2LoginInterface />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Keycloak')).toBeInTheDocument();
        expect(screen.getByText('Not Configured')).toBeInTheDocument();
        expect(screen.getByText('Disabled')).toBeInTheDocument();
      });
    });

    it('should handle OAuth2 provider selection', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            providers: [
              {
                id: 'auth0',
                name: 'auth0',
                displayName: 'Auth0',
                description: 'Enterprise authentication with Auth0',
                authUrl: 'https://example.auth0.com/authorize',
                isEnabled: true,
                isConfigured: true,
                scopes: ['openid', 'profile', 'email']
              }
            ]
          })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ client_id: 'test-client-id' })
        } as Response);

      // Mock window.location.href
      delete (window as any).location;
      (window as any).location = { href: '', origin: 'http://localhost:3000' };

      const mockProviderSelect = jest.fn();

      render(
        <TestWrapper>
          <OAuth2LoginInterface onProviderSelect={mockProviderSelect} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Auth0')).toBeInTheDocument();
      });

      const auth0Button = screen.getByText('Auth0').closest('button');
      expect(auth0Button).toBeInTheDocument();

      fireEvent.click(auth0Button!);

      await waitFor(() => {
        expect(sessionStorage.getItem('oauth2_provider')).toBe('auth0');
        expect(sessionStorage.getItem('oauth2_state')).toBeTruthy();
      });
    });
  });

  describe('Component Integration', () => {
    it('should handle complete OAuth2 flow setup', async () => {
      const mockProviders = [
        {
          id: 'auth0',
          name: 'auth0',
          displayName: 'Auth0',
          description: 'Enterprise authentication',
          authUrl: 'https://example.auth0.com/authorize',
          isEnabled: true,
          isConfigured: true,
          scopes: ['openid', 'profile', 'email']
        }
      ];

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ providers: mockProviders })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ client_id: 'test-client-id' })
        } as Response);

      // Mock window.location
      delete (window as any).location;
      (window as any).location = { href: '', origin: 'http://localhost:3000' };

      render(
        <TestWrapper>
          <OAuth2LoginInterface />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Auth0')).toBeInTheDocument();
      });

      // Click OAuth2 provider
      const auth0Button = screen.getByText('Auth0').closest('button');
      fireEvent.click(auth0Button!);

      await waitFor(() => {
        expect(sessionStorage.getItem('oauth2_provider')).toBe('auth0');
        expect(sessionStorage.getItem('oauth2_state')).toBeTruthy();
      });

      // Verify state parameter is properly formatted
      const storedState = sessionStorage.getItem('oauth2_state');
      expect(storedState).toBeTruthy();
      
      // Decode and verify state structure
      const decodedState = JSON.parse(atob(storedState!));
      expect(decodedState).toHaveProperty('timestamp');
      expect(decodedState).toHaveProperty('provider', 'auth0');
      expect(decodedState).toHaveProperty('redirect');
    });

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network connection failed'));

      render(
        <TestWrapper>
          <OAuth2LoginInterface />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Failed to load authentication providers')).toBeInTheDocument();
      });

      // Should still show traditional login option
      expect(screen.getByText('Traditional Authentication')).toBeInTheDocument();
      expect(screen.getByText('Username & Password')).toBeInTheDocument();
    });

    it('should handle empty provider list', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ providers: [] })
      } as Response);

      render(
        <TestWrapper>
          <OAuth2LoginInterface />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Secure Authentication')).toBeInTheDocument();
        expect(screen.getByText('Traditional Authentication')).toBeInTheDocument();
      });

      // Should not show Enterprise Authentication section when no providers
      expect(screen.queryByText('Enterprise Authentication')).not.toBeInTheDocument();
    });
  });

  describe('Security Features', () => {
    it('should generate secure state parameter', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            providers: [
              {
                id: 'auth0',
                name: 'auth0',
                displayName: 'Auth0',
                description: 'Enterprise authentication',
                authUrl: 'https://example.auth0.com/authorize',
                isEnabled: true,
                isConfigured: true,
                scopes: ['openid', 'profile', 'email']
              }
            ]
          })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ client_id: 'test-client-id' })
        } as Response);

      // Mock window.location
      delete (window as any).location;
      (window as any).location = { href: '', origin: 'http://localhost:3000' };

      render(
        <TestWrapper>
          <OAuth2LoginInterface />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Auth0')).toBeInTheDocument();
      });

      const auth0Button = screen.getByText('Auth0').closest('button');
      fireEvent.click(auth0Button!);

      await waitFor(() => {
        const storedState = sessionStorage.getItem('oauth2_state');
        expect(storedState).toBeTruthy();
        
        // Verify state is base64 encoded JSON
        expect(() => JSON.parse(atob(storedState!))).not.toThrow();
        
        const decodedState = JSON.parse(atob(storedState!));
        expect(typeof decodedState.timestamp).toBe('number');
        expect(decodedState.timestamp).toBeGreaterThan(Date.now() - 1000); // Within last second
      });
    });

    it('should show security notice with proper information', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ providers: [] })
      } as Response);

      render(
        <TestWrapper>
          <OAuth2LoginInterface />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Security Notice')).toBeInTheDocument();
        expect(screen.getByText(/OAuth2, JWT tokens, and encrypted connections/)).toBeInTheDocument();
      });
    });
  });
});