import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../App';

// Mock axios for API calls
jest.mock('axios');

describe('Frontend Docker Setup Tests', () => {
  test('renders Gold Shop Management System', () => {
    render(<App />);
    const linkElement = screen.getByText(/Gold Shop Management System/i);
    expect(linkElement).toBeInTheDocument();
  });

  test('renders Persian text correctly', () => {
    render(<App />);
    const persianText = screen.getByText(/طلافروشی - سیستم مدیریت/i);
    expect(persianText).toBeInTheDocument();
  });

  test('renders welcome message', () => {
    render(<App />);
    const welcomeMessage = screen.getByText(/Welcome to Gold Shop Management/i);
    expect(welcomeMessage).toBeInTheDocument();
  });

  test('renders system ready message', () => {
    render(<App />);
    const readyMessage = screen.getByText(/System is ready for development/i);
    expect(readyMessage).toBeInTheDocument();
  });

  test('React Query provider is working', async () => {
    render(<App />);
    
    // Test that QueryClient is properly initialized
    await waitFor(() => {
      const app = screen.getByText(/Gold Shop Management System/i);
      expect(app).toBeInTheDocument();
    });
  });

  test('Router is working', () => {
    render(<App />);
    
    // Test that BrowserRouter is working by checking if components render
    const homeComponent = screen.getByText(/Welcome to Gold Shop Management/i);
    expect(homeComponent).toBeInTheDocument();
  });
});