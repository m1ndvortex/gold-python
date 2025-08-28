import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdvancedAnalyticsDashboard } from '../components/analytics/AdvancedAnalyticsDashboard';
import { PredictiveAnalyticsDashboard } from '../components/analytics/PredictiveAnalyticsDashboard';
import { KPIDashboard } from '../components/analytics/KPIDashboard';
import { CustomerSegmentationDashboard } from '../components/analytics/CustomerSegmentationDashboard';
import { TrendAnalysisDashboard } from '../components/analytics/TrendAnalysisDashboard';
import { DataExportInterface } from '../components/analytics/DataExportInterface';

export const AnalyticsWithRouting: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/analytics/dashboard" replace />} />
      <Route path="/dashboard" element={<AdvancedAnalyticsDashboard />} />
      <Route path="/kpi" element={<KPIDashboard />} />
      <Route path="/predictive" element={<PredictiveAnalyticsDashboard />} />
      <Route path="/segmentation" element={<CustomerSegmentationDashboard />} />
      <Route path="/trends" element={<TrendAnalysisDashboard />} />
      <Route path="/export" element={<DataExportInterface />} />
      <Route path="*" element={<Navigate to="/analytics/dashboard" replace />} />
    </Routes>
  );
};

export default AnalyticsWithRouting;