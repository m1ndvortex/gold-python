import React from 'react';
import { CacheManagementDashboard } from '../components/analytics/CacheManagementDashboard';

const CacheManagementPage: React.FC = () => {
  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 flex items-center justify-center shadow-lg">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 1.79 4 4 4h8c2.21 0 4-1.79 4-4V7M4 7l2-3h12l2 3M4 7h16M9 11v4m6-4v4" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground">Cache Management</h1>
              <p className="text-muted-foreground text-lg">
                Monitor and optimize Redis cache performance
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cache Management Dashboard */}
      <CacheManagementDashboard />
    </div>
  );
};

export default CacheManagementPage;