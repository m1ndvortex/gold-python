import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Sidebar } from '../Sidebar';

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  })),
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock the hooks
jest.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: '1', username: 'test', role: 'Owner' },
    hasPermission: jest.fn(() => true),
    hasAnyRole: jest.fn(() => true),
    login: jest.fn(),
    logout: jest.fn(),
    isLoading: false,
    error: null,
  }),
}));

jest.mock('../../../hooks/useLanguage', () => ({
  useLanguage: () => ({
    language: 'en',
    direction: 'ltr' as const,
    t: (key: string) => {
      const translations: Record<string, string> = {
        'app.title': 'Gold Shop Management',
        'nav.dashboard': 'Dashboard',
        'nav.inventory': 'Inventory',
        'nav.customers': 'Customers',
        'nav.invoices': 'Invoices',
        'nav.accounting': 'Accounting',
        'nav.reports': 'Reports',
        'nav.sms': 'SMS',
        'nav.settings': 'Settings',
      };
      return translations[key] || key;
    },
    setLanguage: jest.fn(),
  }),
}));

describe('Sidebar Basic Test', () => {
  it('renders without crashing', () => {
    render(
      <BrowserRouter>
        <Sidebar isCollapsed={false} onToggle={jest.fn()} />
      </BrowserRouter>
    );
    
    // Just check that something renders
    expect(document.body).toBeInTheDocument();
  });

  it('shows basic navigation items', () => {
    render(
      <BrowserRouter>
        <Sidebar isCollapsed={false} onToggle={jest.fn()} />
      </BrowserRouter>
    );
    
    // Check for basic navigation items
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Professional Edition v2.0')).toBeInTheDocument();
  });
});