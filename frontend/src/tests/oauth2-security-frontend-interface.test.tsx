import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@testing-library/jest-dom';

// Import components to test
import { OAuth2LoginInterface } from '../components/auth/OAuth2LoginInterface';
import { OAuth2CallbackHandler } from '../components/auth/OAuth2CallbackHandler';
import { TokenManagementInterface } from '../components/auth/TokenManagementInterface';
import { RoleBasedAccessInterface } from '../components/auth/RoleBasedAccessInterface';
import { AuditLoggingInterface } from '../components/auth/AuditLoggingInterface';
import { OAuth2ConsentInterface } from '../components/auth/OAuth2ConsentInterface';
import { SecuritySettingsInterface } from '../components/auth/SecuritySettingsInterface';
import { UserProfileSecurityInterface } from '../components/auth/UserProfileSecurityInterface';

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

describe('OAuth2 Security Frontend Interface', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('OAuth2LoginInterface', () => {
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
            },
            {
              id: 'keycloak',
              name: 'keycloak',
              displayName: 'Keycloak',
              description: 'Self-hosted identity management',
              authUrl: 'https://keycloak.example.com/auth',
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
        expect(screen.getByText('Keycloak')).toBeInTheDocument();
      });
    });

    it('should handle OAuth2 provider login', async () => {
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

      render(
        <TestWrapper>
          <OAuth2LoginInterface />
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
      });
    });

    it('should handle traditional login option', () => {
      const mockTraditionalLogin = jest.fn();

      render(
        <TestWrapper>
          <OAuth2LoginInterface onTraditionalLogin={mockTraditionalLogin} />
        </TestWrapper>
      );

      const traditionalButton = screen.getByText('Username & Password').closest('button');
      expect(traditionalButton).toBeInTheDocument();

      fireEvent.click(traditionalButton!);
      expect(mockTraditionalLogin).toHaveBeenCalled();
    });
  });

  describe('OAuth2CallbackHandler', () => {
    it('should handle successful OAuth2 callback', async () => {
      // Mock URL search params
      delete (window as any).location;
      (window as any).location = {
        search: '?code=test-code&state=test-state',
        origin: 'http://localhost:3000'
      };

      // Mock sessionStorage
      sessionStorage.setItem('oauth2_state', 'test-state');
      sessionStorage.setItem('oauth2_provider', 'auth0');

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: 'test-access-token',
            refresh_token: 'test-refresh-token',
            expires_in: 3600,
            token_type: 'Bearer'
          })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: '1',
            username: 'testuser',
            email: 'test@example.com'
          })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({})
        } as Response);

      render(
        <TestWrapper>
          <OAuth2CallbackHandler />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Secure Authentication')).toBeInTheDocument();
        expect(screen.getByText(/Validating authorization/)).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(localStorage.getItem('access_token')).toBe('test-access-token');
        expect(localStorage.getItem('refresh_token')).toBe('test-refresh-token');
      });
    });

    it('should handle OAuth2 callback errors', async () => {
      // Mock URL search params with error
      delete (window as any).location;
      (window as any).location = {
        search: '?error=access_denied&error_description=User denied access',
        origin: 'http://localhost:3000'
      };

      render(
        <TestWrapper>
          <OAuth2CallbackHandler />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Access was denied/)).toBeInTheDocument();
      });
    });
  });

  describe('TokenManagementInterface', () => {
    it('should render token management interface', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token_expires_at: new Date(Date.now() + 900000).toISOString(), // 15 minutes
            refresh_token_expires_at: new Date(Date.now() + 2592000000).toISOString(), // 30 days
            scopes: ['openid', 'profile', 'email'],
            created_at: new Date().toISOString(),
            refresh_count: 0
          })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            sessions: [
              {
                session_id: 'session-1',
                ip_address: '192.168.1.1',
                user_agent: 'Mozilla/5.0...',
                created_at: new Date().toISOString(),
                last_activity: new Date().toISOString(),
                is_current: true
              }
            ]
          })
        } as Response);

      render(
        <TestWrapper>
          <TokenManagementInterface />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Token Management')).toBeInTheDocument();
        expect(screen.getByText('Active Sessions')).toBeInTheDocument();
      });

      // Check token information display
      await waitFor(() => {
        expect(screen.getByText('Access Token')).toBeInTheDocument();
        expect(screen.getByText('Refresh Token')).toBeInTheDocument();
      });
    });

    it('should handle token refresh', async () => {
      localStorage.setItem('refresh_token', 'test-refresh-token');

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token_expires_at: new Date(Date.now() + 900000).toISOString(),
            refresh_token_expires_at: new Date(Date.now() + 2592000000).toISOString(),
            scopes: ['openid', 'profile', 'email'],
            created_at: new Date().toISOString(),
            refresh_count: 0
          })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ sessions: [] })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: 'new-access-token',
            refresh_token: 'new-refresh-token',
            expires_in: 3600
          })
        } as Response);

      render(
        <TestWrapper>
          <TokenManagementInterface />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Refresh Tokens')).toBeInTheDocument();
      });

      const refreshButton = screen.getByText('Refresh Tokens');
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/oauth2/refresh', expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ refresh_token: 'test-refresh-token' })
        }));
      });
    });
  });

  describe('RoleBasedAccessInterface', () => {
    it('should render role-based access control interface', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            roles: [
              {
                id: '1',
                name: 'Manager',
                description: 'System manager',
                permissions: ['view_inventory', 'edit_inventory'],
                user_count: 5,
                is_system: false,
                created_at: new Date().toISOString()
              }
            ]
          })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            permissions: [
              {
                id: '1',
                name: 'view_inventory',
                description: 'View inventory items',
                category: 'inventory',
                is_system: false
              }
            ]
          })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            user_roles: [
              {
                user_id: '1',
                username: 'testuser',
                email: 'test@example.com',
                role_id: '1',
                role_name: 'Manager',
                is_active: true
              }
            ]
          })
        } as Response);

      render(
        <TestWrapper>
          <RoleBasedAccessInterface />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Role-Based Access Control')).toBeInTheDocument();
        expect(screen.getByText('Roles')).toBeInTheDocument();
        expect(screen.getByText('Permissions')).toBeInTheDocument();
        expect(screen.getByText('User Assignments')).toBeInTheDocument();
      });

      // Check if roles are loaded
      await waitFor(() => {
        expect(screen.getByText('Manager')).toBeInTheDocument();
        expect(screen.getByText('System manager')).toBeInTheDocument();
      });
    });

    it('should handle role permission toggle', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            roles: [
              {
                id: '1',
                name: 'Manager',
                description: 'System manager',
                permissions: ['view_inventory'],
                user_count: 5,
                is_system: false,
                created_at: new Date().toISOString()
              }
            ]
          })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            permissions: [
              {
                id: '1',
                name: 'view_inventory',
                description: 'View inventory items',
                category: 'inventory',
                is_system: false
              },
              {
                id: '2',
                name: 'edit_inventory',
                description: 'Edit inventory items',
                category: 'inventory',
                is_system: false
              }
            ]
          })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user_roles: [] })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({})
        } as Response);

      render(
        <TestWrapper>
          <RoleBasedAccessInterface />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Manager')).toBeInTheDocument();
      });

      // Click on the Manager role to select it
      const managerRole = screen.getByText('Manager').closest('div');
      fireEvent.click(managerRole!);

      await waitFor(() => {
        expect(screen.getByText('Role Permissions')).toBeInTheDocument();
      });
    });
  });

  describe('AuditLoggingInterface', () => {
    it('should render audit logging interface', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            events: [
              {
                id: '1',
                event_type: 'oauth2_login_success',
                user_id: '1',
                username: 'testuser',
                ip_address: '192.168.1.1',
                user_agent: 'Mozilla/5.0...',
                action: 'User logged in successfully',
                details: {},
                severity: 'low',
                timestamp: new Date().toISOString()
              }
            ],
            total_pages: 1
          })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            total_events: 100,
            events_today: 10,
            failed_logins_today: 2,
            unique_users_today: 5,
            top_event_types: [
              { event_type: 'login_success', count: 50 }
            ],
            severity_breakdown: {
              low: 80,
              medium: 15,
              high: 4,
              critical: 1
            }
          })
        } as Response);

      render(
        <TestWrapper>
          <AuditLoggingInterface />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Security Audit Logs')).toBeInTheDocument();
        expect(screen.getByText('Recent Events')).toBeInTheDocument();
      });

      // Check statistics
      await waitFor(() => {
        expect(screen.getByText('Events Today')).toBeInTheDocument();
        expect(screen.getByText('Failed Logins')).toBeInTheDocument();
        expect(screen.getByText('Active Users')).toBeInTheDocument();
      });

      // Check audit events
      await waitFor(() => {
        expect(screen.getByText('OAuth2 Login Success')).toBeInTheDocument();
        expect(screen.getByText('User logged in successfully')).toBeInTheDocument();
      });
    });

    it('should handle audit log export', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ events: [], total_pages: 1 })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            total_events: 0,
            events_today: 0,
            failed_logins_today: 0,
            unique_users_today: 0,
            top_event_types: [],
            severity_breakdown: {}
          })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          blob: async () => new Blob(['csv,data'], { type: 'text/csv' })
        } as Response);

      // Mock URL.createObjectURL
      global.URL.createObjectURL = jest.fn(() => 'blob:url');
      global.URL.revokeObjectURL = jest.fn();

      render(
        <TestWrapper>
          <AuditLoggingInterface />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Export')).toBeInTheDocument();
      });

      const exportButton = screen.getByText('Export');
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/oauth2/audit/export'),
          expect.objectContaining({
            headers: expect.objectContaining({
              'Authorization': expect.stringContaining('Bearer')
            })
          })
        );
      });
    });
  });

  describe('OAuth2ConsentInterface', () => {
    it('should render OAuth2 consent interface', async () => {
      // Mock URL search params
      delete (window as any).location;
      (window as any).location = {
        search: '?client_id=test-client&state=test-state&response_type=code&redirect_uri=http://localhost:3000/callback&scope=openid profile'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          client_id: 'test-client',
          client_name: 'Test Application',
          client_description: 'A test OAuth2 application',
          redirect_uri: 'http://localhost:3000/callback',
          scopes: [
            {
              name: 'openid',
              display_name: 'OpenID Connect',
              description: 'Access to your identity',
              category: 'basic',
              required: true,
              sensitive: false
            },
            {
              name: 'profile',
              display_name: 'Profile Information',
              description: 'Access to your profile information',
              category: 'profile',
              required: false,
              sensitive: false
            }
          ],
          state: 'test-state',
          response_type: 'code',
          user_info: {
            username: 'testuser',
            email: 'test@example.com',
            role: 'Manager'
          }
        })
      } as Response);

      render(
        <TestWrapper>
          <OAuth2ConsentInterface />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Authorization Request')).toBeInTheDocument();
        expect(screen.getByText('Test Application')).toBeInTheDocument();
        expect(screen.getByText('Requested Permissions')).toBeInTheDocument();
      });

      // Check scopes
      await waitFor(() => {
        expect(screen.getByText('OpenID Connect')).toBeInTheDocument();
        expect(screen.getByText('Profile Information')).toBeInTheDocument();
      });

      // Check action buttons
      expect(screen.getByText('Approve')).toBeInTheDocument();
      expect(screen.getByText('Deny')).toBeInTheDocument();
    });

    it('should handle consent approval', async () => {
      // Mock URL search params
      delete (window as any).location;
      (window as any).location = {
        search: '?client_id=test-client&state=test-state&response_type=code&redirect_uri=http://localhost:3000/callback&scope=openid',
        href: ''
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            client_id: 'test-client',
            client_name: 'Test Application',
            client_description: 'A test OAuth2 application',
            redirect_uri: 'http://localhost:3000/callback',
            scopes: [
              {
                name: 'openid',
                display_name: 'OpenID Connect',
                description: 'Access to your identity',
                category: 'basic',
                required: true,
                sensitive: false
              }
            ],
            state: 'test-state',
            response_type: 'code',
            user_info: {
              username: 'testuser',
              email: 'test@example.com',
              role: 'Manager'
            }
          })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            authorization_code: 'test-auth-code'
          })
        } as Response);

      render(
        <TestWrapper>
          <OAuth2ConsentInterface />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Approve')).toBeInTheDocument();
      });

      const approveButton = screen.getByText('Approve');
      fireEvent.click(approveButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/oauth2/consent/approve', expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            client_id: 'test-client',
            state: 'test-state',
            scopes: ['openid'],
            redirect_uri: 'http://localhost:3000/callback'
          })
        }));
      });
    });
  });

  describe('SecuritySettingsInterface', () => {
    it('should render security settings interface', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            settings: {
              access_token_lifetime: 15,
              refresh_token_lifetime: 30,
              token_rotation_enabled: true,
              automatic_token_refresh: true,
              session_timeout: 60,
              concurrent_sessions_limit: 3,
              session_activity_tracking: true,
              force_logout_on_password_change: true,
              require_mfa: false,
              password_expiry_days: 90,
              login_attempt_limit: 5,
              account_lockout_duration: 30,
              audit_login_events: true,
              audit_permission_changes: true,
              audit_data_access: true,
              audit_retention_days: 365,
              remember_device_enabled: true,
              device_trust_duration: 30,
              max_trusted_devices: 5,
              api_rate_limiting: true,
              api_requests_per_minute: 100,
              api_key_rotation_days: 90
            }
          })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ devices: [] })
        } as Response);

      render(
        <TestWrapper>
          <SecuritySettingsInterface />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Security Settings')).toBeInTheDocument();
        expect(screen.getByText('Tokens')).toBeInTheDocument();
        expect(screen.getByText('Sessions')).toBeInTheDocument();
        expect(screen.getByText('Security')).toBeInTheDocument();
      });

      // Check token settings
      await waitFor(() => {
        expect(screen.getByText('Token Configuration')).toBeInTheDocument();
        expect(screen.getByText('Access Token Lifetime')).toBeInTheDocument();
        expect(screen.getByText('Refresh Token Lifetime')).toBeInTheDocument();
      });
    });

    it('should handle settings save', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            settings: {
              access_token_lifetime: 15,
              refresh_token_lifetime: 30,
              token_rotation_enabled: true,
              automatic_token_refresh: true,
              session_timeout: 60,
              concurrent_sessions_limit: 3,
              session_activity_tracking: true,
              force_logout_on_password_change: true,
              require_mfa: false,
              password_expiry_days: 90,
              login_attempt_limit: 5,
              account_lockout_duration: 30,
              audit_login_events: true,
              audit_permission_changes: true,
              audit_data_access: true,
              audit_retention_days: 365,
              remember_device_enabled: true,
              device_trust_duration: 30,
              max_trusted_devices: 5,
              api_rate_limiting: true,
              api_requests_per_minute: 100,
              api_key_rotation_days: 90
            }
          })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ devices: [] })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({})
        } as Response);

      render(
        <TestWrapper>
          <SecuritySettingsInterface />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Save Settings')).toBeInTheDocument();
      });

      const saveButton = screen.getByText('Save Settings');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/oauth2/security-settings', expect.objectContaining({
          method: 'PUT'
        }));
      });
    });
  });

  describe('UserProfileSecurityInterface', () => {
    it('should render user profile security interface', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            profile: {
              id: '1',
              username: 'testuser',
              email: 'test@example.com',
              full_name: 'Test User',
              role: {
                id: '1',
                name: 'Manager',
                permissions: {}
              },
              created_at: new Date().toISOString(),
              is_active: true
            }
          })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            mfa_settings: {
              enabled: false,
              methods: [],
              backup_codes: []
            }
          })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            events: [
              {
                id: '1',
                event_type: 'login_success',
                description: 'Successful login',
                ip_address: '192.168.1.1',
                user_agent: 'Mozilla/5.0...',
                timestamp: new Date().toISOString(),
                severity: 'low'
              }
            ]
          })
        } as Response);

      render(
        <TestWrapper>
          <UserProfileSecurityInterface />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument();
        expect(screen.getByText('test@example.com • Manager')).toBeInTheDocument();
        expect(screen.getByText('Profile')).toBeInTheDocument();
        expect(screen.getByText('Security')).toBeInTheDocument();
        expect(screen.getByText('Two-Factor Auth')).toBeInTheDocument();
      });
    });

    it('should handle password change', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            profile: {
              id: '1',
              username: 'testuser',
              email: 'test@example.com',
              role: {
                id: '1',
                name: 'Manager',
                permissions: {}
              },
              created_at: new Date().toISOString(),
              is_active: true
            }
          })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            mfa_settings: {
              enabled: false,
              methods: [],
              backup_codes: []
            }
          })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ events: [] })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({})
        } as Response);

      render(
        <TestWrapper>
          <UserProfileSecurityInterface />
        </TestWrapper>
      );

      // Navigate to security tab
      await waitFor(() => {
        expect(screen.getByText('Security')).toBeInTheDocument();
      });

      const securityTab = screen.getByText('Security');
      fireEvent.click(securityTab);

      await waitFor(() => {
        expect(screen.getByText('Change Password')).toBeInTheDocument();
      });

      // Fill password form
      const currentPasswordInput = screen.getByLabelText('Current Password');
      const newPasswordInput = screen.getByLabelText('New Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm New Password');

      fireEvent.change(currentPasswordInput, { target: { value: 'oldpassword' } });
      fireEvent.change(newPasswordInput, { target: { value: 'newpassword123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'newpassword123' } });

      const changePasswordButton = screen.getByText('Change Password');
      fireEvent.click(changePasswordButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/auth/change-password', expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            current_password: 'oldpassword',
            new_password: 'newpassword123'
          })
        }));
      });
    });

    it('should handle MFA setup', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            profile: {
              id: '1',
              username: 'testuser',
              email: 'test@example.com',
              role: {
                id: '1',
                name: 'Manager',
                permissions: {}
              },
              created_at: new Date().toISOString(),
              is_active: true
            }
          })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            mfa_settings: {
              enabled: false,
              methods: [],
              backup_codes: []
            }
          })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ events: [] })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            qr_code: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
            secret: 'JBSWY3DPEHPK3PXP'
          })
        } as Response);

      render(
        <TestWrapper>
          <UserProfileSecurityInterface />
        </TestWrapper>
      );

      // Navigate to MFA tab
      await waitFor(() => {
        expect(screen.getByText('Two-Factor Auth')).toBeInTheDocument();
      });

      const mfaTab = screen.getByText('Two-Factor Auth');
      fireEvent.click(mfaTab);

      await waitFor(() => {
        expect(screen.getByText('Add Authenticator App')).toBeInTheDocument();
      });

      const addAuthButton = screen.getByText('Add Authenticator App');
      fireEvent.click(addAuthButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/auth/mfa/totp/setup', expect.objectContaining({
          method: 'POST'
        }));
      });

      await waitFor(() => {
        expect(screen.getByText('Setup Authenticator App')).toBeInTheDocument();
        expect(screen.getByAltText('QR Code')).toBeInTheDocument();
      });
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete OAuth2 flow', async () => {
      // Test the complete OAuth2 authentication flow
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
    });

    it('should handle permission-based component rendering', async () => {
      // Test that components respect user permissions
      const mockAuthWithoutPermissions = {
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          role: {
            id: '1',
            name: 'User',
            permissions: {}
          }
        },
        isAuthenticated: true,
        isLoading: false,
        logout: jest.fn(),
        hasPermission: (permission: string) => false,
        hasRole: (role: string) => false,
        hasAnyRole: (roles: string[]) => false
      };

      // Mock useAuth to return user without permissions
      jest.doMock('../hooks/useAuth', () => ({
        useAuth: () => mockAuthWithoutPermissions
      }));

      const { AuditLoggingInterface: AuditWithoutPermissions } = await import('../components/auth/AuditLoggingInterface');

      render(
        <TestWrapper>
          <AuditWithoutPermissions />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
        expect(screen.getByText('You do not have permission to view audit logs.')).toBeInTheDocument();
      });
    });

    it('should handle error states gracefully', async () => {
      // Test error handling in components
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

    it('should handle loading states', async () => {
      // Test loading states
      mockFetch.mockImplementationOnce(() => new Promise(() => {})); // Never resolves

      render(
        <TestWrapper>
          <OAuth2LoginInterface />
        </TestWrapper>
      );

      expect(screen.getByText('Loading authentication options...')).toBeInTheDocument();
    });
  });

  describe('Accessibility Tests', () => {
    it('should have proper ARIA labels and roles', async () => {
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
        // Check for proper heading structure
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
        
        // Check for proper button roles
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);
      });
    });

    it('should support keyboard navigation', async () => {
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
        const auth0Button = screen.getByText('Auth0').closest('button');
        expect(auth0Button).toBeInTheDocument();
        
        // Test keyboard focus
        auth0Button!.focus();
        expect(document.activeElement).toBe(auth0Button);
      });
    });
  });
});