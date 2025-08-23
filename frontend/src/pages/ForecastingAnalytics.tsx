import React from 'react';
import { ForecastingDashboard } from '../components/analytics/ForecastingDashboard';

const ForecastingAnalyticsPage: React.FC = () => {
  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 via-violet-500 to-indigo-500 flex items-center justify-center shadow-lg">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground">Forecasting Analytics</h1>
              <p className="text-muted-foreground text-lg">
                Advanced demand forecasting and predictive analytics
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Forecasting Dashboard */}
      <ForecastingDashboard />
    </div>
  );
};

export default ForecastingAnalyticsPage;