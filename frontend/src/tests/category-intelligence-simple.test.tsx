import React from 'react';
import { render, screen } from '@testing-library/react';
import CategoryPerformanceAnalyzer from '../components/analytics/CategoryPerformanceAnalyzer';
import SeasonalAnalysis from '../components/analytics/SeasonalAnalysis';
import CrossSellingAnalyzer from '../components/analytics/CrossSellingAnalyzer';

// Mock fetch globally
global.fetch = jest.fn();

describe('Category Intelligence Components', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  describe('CategoryPerformanceAnalyzer', () => {
    test('renders loading state initially', () => {
      (fetch as jest.Mock).mockImplementation(() => 
        new Promise(() => {}) // Never resolves to keep loading state
      );

      render(<CategoryPerformanceAnalyzer />);
      
      expect(screen.getByText('Category Performance Analyzer')).toBeInTheDocument();
      expect(screen.getByText('Analyzing category performance...')).toBeInTheDocument();
    });

    test('renders error state when fetch fails', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<CategoryPerformanceAnalyzer />);
      
      // Wait for error state
      await screen.findByText('Network error');
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    test('renders with proper structure', () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([])
      });

      render(<CategoryPerformanceAnalyzer />);
      
      expect(screen.getByText('Category Performance Analyzer')).toBeInTheDocument();
    });
  });

  describe('SeasonalAnalysis', () => {
    test('renders loading state initially', () => {
      (fetch as jest.Mock).mockImplementation(() => 
        new Promise(() => {}) // Never resolves to keep loading state
      );

      render(<SeasonalAnalysis />);
      
      expect(screen.getByText('Seasonal Analysis')).toBeInTheDocument();
      expect(screen.getByText('Analyzing seasonal patterns...')).toBeInTheDocument();
    });

    test('renders error state when fetch fails', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<SeasonalAnalysis />);
      
      // Wait for error state
      await screen.findByText('Network error');
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    test('renders with proper controls', () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([])
      });

      render(<SeasonalAnalysis />);
      
      expect(screen.getByText('Seasonal Analysis')).toBeInTheDocument();
    });
  });

  describe('CrossSellingAnalyzer', () => {
    test('renders loading state initially', () => {
      (fetch as jest.Mock).mockImplementation(() => 
        new Promise(() => {}) // Never resolves to keep loading state
      );

      render(<CrossSellingAnalyzer />);
      
      expect(screen.getByText('Cross-Selling Analyzer')).toBeInTheDocument();
      expect(screen.getByText('Analyzing cross-selling opportunities...')).toBeInTheDocument();
    });

    test('renders error state when fetch fails', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<CrossSellingAnalyzer />);
      
      // Wait for error state
      await screen.findByText('Network error');
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    test('renders with proper controls', () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([])
      });

      render(<CrossSellingAnalyzer />);
      
      expect(screen.getByText('Cross-Selling Analyzer')).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    test('components can be rendered together', () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([])
      });

      const TestDashboard = () => (
        <div>
          <CategoryPerformanceAnalyzer />
          <SeasonalAnalysis />
          <CrossSellingAnalyzer />
        </div>
      );

      render(<TestDashboard />);
      
      expect(screen.getByText('Category Performance Analyzer')).toBeInTheDocument();
      expect(screen.getByText('Seasonal Analysis')).toBeInTheDocument();
      expect(screen.getByText('Cross-Selling Analyzer')).toBeInTheDocument();
    });

    test('components handle props correctly', () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([])
      });

      const mockCallback = jest.fn();
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      render(
        <div>
          <CategoryPerformanceAnalyzer 
            startDate={startDate}
            endDate={endDate}
            onCategorySelect={mockCallback}
          />
          <SeasonalAnalysis 
            categoryId="test-category"
            onCategorySelect={mockCallback}
          />
          <CrossSellingAnalyzer 
            startDate={startDate}
            endDate={endDate}
            onOpportunitySelect={mockCallback}
          />
        </div>
      );
      
      // Components should render without errors when props are provided
      expect(screen.getByText('Category Performance Analyzer')).toBeInTheDocument();
      expect(screen.getByText('Seasonal Analysis')).toBeInTheDocument();
      expect(screen.getByText('Cross-Selling Analyzer')).toBeInTheDocument();
    });
  });

  describe('API Integration', () => {
    test('CategoryPerformanceAnalyzer makes correct API calls', () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([])
      });

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      render(<CategoryPerformanceAnalyzer startDate={startDate} endDate={endDate} />);
      
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/category-intelligence/performance')
      );
    });

    test('SeasonalAnalysis makes correct API calls', () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([])
      });

      render(<SeasonalAnalysis categoryId="test-category" />);
      
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/category-intelligence/seasonal-patterns')
      );
    });

    test('CrossSellingAnalyzer makes correct API calls', () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([])
      });

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      render(<CrossSellingAnalyzer startDate={startDate} endDate={endDate} />);
      
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/category-intelligence/cross-selling')
      );
    });
  });
});