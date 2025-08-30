import { api } from './api';
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

export const systemAdminApi = {
  // System Health
  getSystemHealth: async (): Promise<SystemHealth> => {
    const response = await api.get('/admin/system/health');
    return response.data;
  },

  // Service Management
  getServiceStatus: async (): Promise<ServiceHealth[]> => {
    const response = await api.get('/admin/services/status');
    return response.data;
  },

  manageService: async (action: ServiceManagementAction): Promise<void> => {
    await api.post('/admin/services/manage', action);
  },

  getServiceLogs: async (serviceName: string, lines: number = 100): Promise<LogEntry[]> => {
    const response = await api.get(`/admin/services/${serviceName}/logs`, {
      params: { lines }
    });
    return response.data;
  },

  // Log Management
  getLogs: async (filter: Partial<LogFilter>): Promise<LogEntry[]> => {
    const response = await api.post('/admin/logs/search', filter);
    return response.data;
  },

  exportLogs: async (filter: Partial<LogFilter>, format: 'csv' | 'json'): Promise<Blob> => {
    const response = await api.post('/admin/logs/export', 
      { ...filter, format }, 
      { responseType: 'blob' }
    );
    return response.data;
  },

  // Performance Metrics
  getPerformanceMetrics: async (timeRange: string = '1h'): Promise<PerformanceMetric[]> => {
    const response = await api.get('/admin/performance/metrics', {
      params: { timeRange }
    });
    return response.data;
  },

  // Database Administration
  getDatabaseStatus: async (): Promise<DatabaseStatus> => {
    const response = await api.get('/admin/database/status');
    return response.data;
  },

  runDatabaseHealthCheck: async (): Promise<{ status: string; issues: string[] }> => {
    const response = await api.post('/admin/database/health-check');
    return response.data;
  },

  optimizeDatabase: async (): Promise<{ message: string; tablesOptimized: number }> => {
    const response = await api.post('/admin/database/optimize');
    return response.data;
  },

  // Redis Cache Management
  getRedisStatus: async (): Promise<RedisStatus> => {
    const response = await api.get('/admin/redis/status');
    return response.data;
  },

  clearRedisCache: async (pattern?: string): Promise<{ keysDeleted: number }> => {
    const response = await api.post('/admin/redis/clear', { pattern });
    return response.data;
  },

  getRedisKeys: async (pattern: string = '*', limit: number = 100): Promise<string[]> => {
    const response = await api.get('/admin/redis/keys', {
      params: { pattern, limit }
    });
    return response.data;
  },

  // Backup Management
  getBackupStatus: async (): Promise<BackupFile[]> => {
    const response = await api.get('/admin/backups/status');
    return response.data;
  },

  createManualBackup: async (request: ManualBackupRequest): Promise<{ backupId: string; message: string }> => {
    const response = await api.post('/admin/backups/create', request);
    return response.data;
  },

  restoreFromBackup: async (request: RestoreRequest): Promise<{ message: string; restoredTables: string[] }> => {
    const response = await api.post('/admin/backups/restore', request);
    return response.data;
  },

  deleteBackup: async (filename: string): Promise<void> => {
    await api.delete(`/admin/backups/${filename}`);
  },

  downloadBackup: async (filename: string): Promise<Blob> => {
    const response = await api.get(`/admin/backups/${filename}/download`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // System Configuration
  getSystemConfiguration: async (): Promise<SystemConfiguration> => {
    const response = await api.get('/admin/config');
    return response.data;
  },

  updateEnvironmentVariable: async (key: string, value: string): Promise<void> => {
    await api.put('/admin/config/env', { key, value });
  },

  updateFeatureFlag: async (name: string, enabled: boolean, rolloutPercentage?: number): Promise<void> => {
    await api.put('/admin/config/feature-flags', { name, enabled, rolloutPercentage });
  },

  updateSystemSetting: async (key: string, value: any): Promise<void> => {
    await api.put('/admin/config/settings', { key, value });
  },

  // User Session Management
  getActiveSessions: async (): Promise<UserSession[]> => {
    const response = await api.get('/admin/sessions');
    return response.data;
  },

  terminateSession: async (sessionId: string): Promise<void> => {
    await api.delete(`/admin/sessions/${sessionId}`);
  },

  terminateUserSessions: async (userId: string): Promise<{ terminatedSessions: number }> => {
    const response = await api.delete(`/admin/sessions/user/${userId}`);
    return response.data;
  },

  // Alert Management
  getSystemAlerts: async (): Promise<SystemAlert[]> => {
    const response = await api.get('/admin/alerts');
    return response.data;
  },

  acknowledgeAlert: async (alertId: string): Promise<void> => {
    await api.put(`/admin/alerts/${alertId}/acknowledge`);
  },

  resolveAlert: async (alertId: string, resolution?: string): Promise<void> => {
    await api.put(`/admin/alerts/${alertId}/resolve`, { resolution });
  },

  createAlert: async (alert: Omit<SystemAlert, 'id' | 'timestamp' | 'acknowledged' | 'resolvedAt'>): Promise<SystemAlert> => {
    const response = await api.post('/admin/alerts', alert);
    return response.data;
  },

  // SSL Certificate Management
  getSSLCertificateStatus: async (): Promise<any> => {
    const response = await api.get('/admin/ssl/status');
    return response.data;
  },

  renewSSLCertificate: async (): Promise<{ message: string; newExpiry: Date }> => {
    const response = await api.post('/admin/ssl/renew');
    return response.data;
  },

  // Security Monitoring
  getSecurityStatus: async (): Promise<any> => {
    const response = await api.get('/admin/security/status');
    return response.data;
  },

  runSecurityScan: async (): Promise<{ vulnerabilities: any[]; score: number }> => {
    const response = await api.post('/admin/security/scan');
    return response.data;
  },

  // System Maintenance
  restartSystem: async (): Promise<void> => {
    await api.post('/admin/system/restart');
  },

  updateSystem: async (): Promise<{ message: string; version: string }> => {
    const response = await api.post('/admin/system/update');
    return response.data;
  },

  getSystemInfo: async (): Promise<any> => {
    const response = await api.get('/admin/system/info');
    return response.data;
  }
};