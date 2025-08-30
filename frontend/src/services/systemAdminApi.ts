import { apiGet, apiPost, apiPut, apiDelete } from './api';
import {
  SystemHealth,
  ServiceHealth,
  LogEntry,
  LogFilter,
  PerformanceMetric,
  DatabaseStatus,
  RedisStatus,
  SystemConfiguration,
  ManualBackupRequest,
  RestoreRequest,
  ServiceManagementAction,
  UserSession,
  BackupFile,
  SystemAlert
} from '../types/systemAdmin';

// Helper function to build query parameter strings
const buildQueryParams = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });
  return searchParams.toString();
};

export const systemAdminApi = {
  // System Health
  getSystemHealth: async (): Promise<SystemHealth> => {
    const response = await apiGet('/admin/system/health');
    return response.data;
  },

  // Service Management
  getServiceStatus: async (): Promise<ServiceHealth[]> => {
    const response = await apiGet('/admin/services/status');
    return response.data;
  },

  manageService: async (action: ServiceManagementAction): Promise<void> => {
    await apiPost('/admin/services/manage', action);
  },

  getServiceLogs: async (serviceName: string, lines: number = 100): Promise<LogEntry[]> => {
    const queryString = buildQueryParams({ lines });
    const response = await apiGet(`/admin/services/${serviceName}/logs?${queryString}`);
    return response.data;
  },

  // Log Management
  getLogs: async (filter: Partial<LogFilter>): Promise<LogEntry[]> => {
    const response = await apiPost('/admin/logs/search', filter);
    return response.data;
  },

  exportLogs: async (filter: Partial<LogFilter>, format: 'csv' | 'json'): Promise<Blob> => {
    const response = await apiPost('/admin/logs/export', 
      { ...filter, format }
    );
    return response.data;
  },

  // Performance Metrics
  getPerformanceMetrics: async (timeRange: string = '1h'): Promise<PerformanceMetric[]> => {
    const queryString = buildQueryParams({ timeRange });
    const response = await apiGet(`/admin/performance/metrics?${queryString}`);
    return response.data;
  },

  // Database Administration
  getDatabaseStatus: async (): Promise<DatabaseStatus> => {
    const response = await apiGet('/admin/database/status');
    return response.data;
  },

  runDatabaseHealthCheck: async (): Promise<{ status: string; issues: string[] }> => {
    const response = await apiPost('/admin/database/health-check');
    return response.data;
  },

  optimizeDatabase: async (): Promise<{ message: string; tablesOptimized: number }> => {
    const response = await apiPost('/admin/database/optimize');
    return response.data;
  },

  // Redis Cache Management
  getRedisStatus: async (): Promise<RedisStatus> => {
    const response = await apiGet('/admin/redis/status');
    return response.data;
  },

  clearRedisCache: async (pattern?: string): Promise<{ keysDeleted: number }> => {
    const response = await apiPost('/admin/redis/clear', { pattern });
    return response.data;
  },

  getRedisKeys: async (pattern: string = '*', limit: number = 100): Promise<string[]> => {
    const queryString = buildQueryParams({ pattern, limit });
    const response = await apiGet(`/admin/redis/keys?${queryString}`);
    return response.data;
  },

  // Backup Management
  getBackupStatus: async (): Promise<BackupFile[]> => {
    const response = await apiGet('/admin/backups/status');
    return response.data;
  },

  createManualBackup: async (request: ManualBackupRequest): Promise<{ backupId: string; message: string }> => {
    const response = await apiPost('/admin/backups/create', request);
    return response.data;
  },

  restoreFromBackup: async (request: RestoreRequest): Promise<{ message: string; restoredTables: string[] }> => {
    const response = await apiPost('/admin/backups/restore', request);
    return response.data;
  },

  deleteBackup: async (filename: string): Promise<void> => {
    await apiDelete(`/admin/backups/${filename}`);
  },

  downloadBackup: async (filename: string): Promise<Blob> => {
    const response = await apiGet(`/admin/backups/${filename}/download`);
    return response.data;
  },

  // System Configuration
  getSystemConfiguration: async (): Promise<SystemConfiguration> => {
    const response = await apiGet('/admin/config');
    return response.data;
  },

  updateEnvironmentVariable: async (key: string, value: string): Promise<void> => {
    await apiPut('/admin/config/env', { key, value });
  },

  updateFeatureFlag: async (name: string, enabled: boolean, rolloutPercentage?: number): Promise<void> => {
    await apiPut('/admin/config/feature-flags', { name, enabled, rolloutPercentage });
  },

  updateSystemSetting: async (key: string, value: any): Promise<void> => {
    await apiPut('/admin/config/settings', { key, value });
  },

  // User Session Management
  getActiveSessions: async (): Promise<UserSession[]> => {
    const response = await apiGet('/admin/sessions');
    return response.data;
  },

  terminateSession: async (sessionId: string): Promise<void> => {
    await apiDelete(`/admin/sessions/${sessionId}`);
  },

  terminateUserSessions: async (userId: string): Promise<{ terminatedSessions: number }> => {
    const response = await apiDelete(`/admin/sessions/user/${userId}`);
    return response.data;
  },

  // Alert Management
  getSystemAlerts: async (): Promise<SystemAlert[]> => {
    const response = await apiGet('/admin/alerts');
    return response.data;
  },

  acknowledgeAlert: async (alertId: string): Promise<void> => {
    await apiPut(`/admin/alerts/${alertId}/acknowledge`);
  },

  resolveAlert: async (alertId: string, resolution?: string): Promise<void> => {
    await apiPut(`/admin/alerts/${alertId}/resolve`, { resolution });
  },

  createAlert: async (alert: Omit<SystemAlert, 'id' | 'timestamp' | 'acknowledged' | 'resolvedAt'>): Promise<SystemAlert> => {
    const response = await apiPost('/admin/alerts', alert);
    return response.data;
  },

  // SSL Certificate Management
  getSSLCertificateStatus: async (): Promise<any> => {
    const response = await apiGet('/admin/ssl/status');
    return response.data;
  },

  renewSSLCertificate: async (): Promise<{ message: string; newExpiry: Date }> => {
    const response = await apiPost('/admin/ssl/renew');
    return response.data;
  },

  // Security Monitoring
  getSecurityStatus: async (): Promise<any> => {
    const response = await apiGet('/admin/security/status');
    return response.data;
  },

  runSecurityScan: async (): Promise<{ vulnerabilities: any[]; score: number }> => {
    const response = await apiPost('/admin/security/scan');
    return response.data;
  },

  // System Maintenance
  restartSystem: async (): Promise<void> => {
    await apiPost('/admin/system/restart');
  },

  updateSystem: async (): Promise<{ message: string; version: string }> => {
    const response = await apiPost('/admin/system/update');
    return response.data;
  },

  getSystemInfo: async (): Promise<any> => {
    const response = await apiGet('/admin/system/info');
    return response.data;
  }
};
