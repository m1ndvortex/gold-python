import React from 'react';
import { StockOptimizationDashboard } from '../components/analytics/StockOptimizationDashboard';

const StockOptimizationPage: React.FC = () => {
  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 flex items-center justify-center shadow-lg">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground">Stock Optimization</h1>
              <p className="text-muted-foreground text-lg">
                AI-powered inventory optimization and reorder recommendations
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stock Optimization Dashboard */}
      <StockOptimizationDashboard />
    </div>
  );
};

export default StockOptimizationPage;