import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { systemAdminApi } from '../services/systemAdminApi';
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
import { toast } from 'sonner';

// System Health Hooks
export const useSystemHealth = () => {
  return useQuery<SystemHealth>({
    queryKey: ['systemHealth'],
    queryFn: systemAdminApi.getSystemHealth,
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 15000, // Consider data stale after 15 seconds
  });
};

// Service Management Hooks
export const useServiceStatus = () => {
  return useQuery<ServiceHealth[]>({
    queryKey: ['serviceStatus'],
    queryFn: systemAdminApi.getServiceStatus,
    refetchInterval: 15000, // Refresh every 15 seconds
    staleTime: 10000,
  });
};

export const useServiceManagement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: systemAdminApi.manageService,
    onSuccess: (_, variables) => {
      toast.success(`Service ${variables.service} ${variables.action} completed successfully`);
      queryClient.invalidateQueries({ queryKey: ['serviceStatus'] });
      queryClient.invalidateQueries({ queryKey: ['systemHealth'] });
    },
    onError: (error: any) => {
      toast.error(`Service management failed: ${error.message}`);
    },
  });
};

export const useServiceLogs = (serviceName: string, lines: number = 100) => {
  return useQuery<LogEntry[]>({
    queryKey: ['serviceLogs', serviceName, lines],
    queryFn: () => systemAdminApi.getServiceLogs(serviceName, lines),
    enabled: !!serviceName,
    refetchInterval: 10000, // Refresh every 10 seconds
  });
};

// Log Management Hooks
export const useLogs = (filter: Partial<LogFilter>) => {
  return useQuery<LogEntry[]>({
    queryKey: ['logs', filter],
    queryFn: () => systemAdminApi.getLogs(filter),
    enabled: Object.keys(filter).length > 0,
    staleTime: 30000,
  });
};

export const useLogExport = () => {
  return useMutation({
    mutationFn: ({ filter, format }: { filter: Partial<LogFilter>; format: 'csv' | 'json' }) =>
      systemAdminApi.exportLogs(filter, format),
    onSuccess: (blob, variables) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `system-logs.${variables.format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Logs exported successfully');
    },
    onError: (error: any) => {
      toast.error(`Log export failed: ${error.message}`);
    },
  });
};

// Performance Metrics Hooks
export const usePerformanceMetrics = (timeRange: string = '1h') => {
  return useQuery<PerformanceMetric[]>({
    queryKey: ['performanceMetrics', timeRange],
    queryFn: () => systemAdminApi.getPerformanceMetrics(timeRange),
    refetchInterval: 60000, // Refresh every minute
    staleTime: 30000,
  });
};

// Database Administration Hooks
export const useDatabaseStatus = () => {
  return useQuery<DatabaseStatus>({
    queryKey: ['databaseStatus'],
    queryFn: systemAdminApi.getDatabaseStatus,
    refetchInterval: 30000,
    staleTime: 15000,
  });
};

export const useDatabaseHealthCheck = () => {
  return useMutation({
    mutationFn: systemAdminApi.runDatabaseHealthCheck,
    onSuccess: (data) => {
      if (data.issues.length === 0) {
        toast.success('Database health check completed - no issues found');
      } else {
        toast.warning(`Database health check completed - ${data.issues.length} issues found`);
      }
    },
    onError: (error: any) => {
      toast.error(`Database health check failed: ${error.message}`);
    },
  });
};

export const useDatabaseOptimization = () => {
  return useMutation({
    mutationFn: systemAdminApi.optimizeDatabase,
    onSuccess: (data) => {
      toast.success(`Database optimization completed - ${data.tablesOptimized} tables optimized`);
    },
    onError: (error: any) => {
      toast.error(`Database optimization failed: ${error.message}`);
    },
  });
};

// Redis Cache Management Hooks
export const useRedisStatus = () => {
  return useQuery<RedisStatus>({
    queryKey: ['redisStatus'],
    queryFn: systemAdminApi.getRedisStatus,
    refetchInterval: 30000,
    staleTime: 15000,
  });
};

export const useRedisCacheClear = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: systemAdminApi.clearRedisCache,
    onSuccess: (data) => {
      toast.success(`Cache cleared - ${data.keysDeleted} keys deleted`);
      queryClient.invalidateQueries({ queryKey: ['redisStatus'] });
    },
    onError: (error: any) => {
      toast.error(`Cache clear failed: ${error.message}`);
    },
  });
};

export const useRedisKeys = (pattern: string = '*', limit: number = 100) => {
  return useQuery<string[]>({
    queryKey: ['redisKeys', pattern, limit],
    queryFn: () => systemAdminApi.getRedisKeys(pattern, limit),
    enabled: !!pattern,
    staleTime: 60000,
  });
};

// Backup Management Hooks
export const useBackupStatus = () => {
  return useQuery<BackupFile[]>({
    queryKey: ['backupStatus'],
    queryFn: systemAdminApi.getBackupStatus,
    refetchInterval: 60000, // Refresh every minute
    staleTime: 30000,
  });
};

export const useManualBackup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: systemAdminApi.createManualBackup,
    onSuccess: (data) => {
      toast.success(`Backup created successfully: ${data.backupId}`);
      queryClient.invalidateQueries({ queryKey: ['backupStatus'] });
    },
    onError: (error: any) => {
      toast.error(`Backup creation failed: ${error.message}`);
    },
  });
};

export const useBackupRestore = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: systemAdminApi.restoreFromBackup,
    onSuccess: (data) => {
      toast.success(`Restore completed - ${data.restoredTables.length} tables restored`);
      queryClient.invalidateQueries(); // Invalidate all queries after restore
    },
    onError: (error: any) => {
      toast.error(`Restore failed: ${error.message}`);
    },
  });
};

export const useBackupDelete = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: systemAdminApi.deleteBackup,
    onSuccess: () => {
      toast.success('Backup deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['backupStatus'] });
    },
    onError: (error: any) => {
      toast.error(`Backup deletion failed: ${error.message}`);
    },
  });
};

// System Configuration Hooks
export const useSystemConfiguration = () => {
  return useQuery<SystemConfiguration>({
    queryKey: ['systemConfiguration'],
    queryFn: systemAdminApi.getSystemConfiguration,
    staleTime: 300000, // 5 minutes
  });
};

export const useEnvironmentVariableUpdate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      systemAdminApi.updateEnvironmentVariable(key, value),
    onSuccess: () => {
      toast.success('Environment variable updated successfully');
      queryClient.invalidateQueries({ queryKey: ['systemConfiguration'] });
    },
    onError: (error: any) => {
      toast.error(`Environment variable update failed: ${error.message}`);
    },
  });
};

export const useFeatureFlagUpdate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, enabled, rolloutPercentage }: { name: string; enabled: boolean; rolloutPercentage?: number }) =>
      systemAdminApi.updateFeatureFlag(name, enabled, rolloutPercentage),
    onSuccess: () => {
      toast.success('Feature flag updated successfully');
      queryClient.invalidateQueries({ queryKey: ['systemConfiguration'] });
    },
    onError: (error: any) => {
      toast.error(`Feature flag update failed: ${error.message}`);
    },
  });
};

// User Session Management Hooks
export const useActiveSessions = () => {
  return useQuery<UserSession[]>({
    queryKey: ['activeSessions'],
    queryFn: systemAdminApi.getActiveSessions,
    refetchInterval: 30000,
    staleTime: 15000,
  });
};

export const useSessionTermination = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: systemAdminApi.terminateSession,
    onSuccess: () => {
      toast.success('Session terminated successfully');
      queryClient.invalidateQueries({ queryKey: ['activeSessions'] });
    },
    onError: (error: any) => {
      toast.error(`Session termination failed: ${error.message}`);
    },
  });
};

export const useUserSessionsTermination = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: systemAdminApi.terminateUserSessions,
    onSuccess: (data) => {
      toast.success(`${data.terminatedSessions} sessions terminated successfully`);
      queryClient.invalidateQueries({ queryKey: ['activeSessions'] });
    },
    onError: (error: any) => {
      toast.error(`User sessions termination failed: ${error.message}`);
    },
  });
};

// Alert Management Hooks
export const useSystemAlerts = () => {
  return useQuery<SystemAlert[]>({
    queryKey: ['systemAlerts'],
    queryFn: systemAdminApi.getSystemAlerts,
    refetchInterval: 30000,
    staleTime: 15000,
  });
};

export const useAlertAcknowledgment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: systemAdminApi.acknowledgeAlert,
    onSuccess: () => {
      toast.success('Alert acknowledged');
      queryClient.invalidateQueries({ queryKey: ['systemAlerts'] });
    },
    onError: (error: any) => {
      toast.error(`Alert acknowledgment failed: ${error.message}`);
    },
  });
};

export const useAlertResolution = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ alertId, resolution }: { alertId: string; resolution?: string }) =>
      systemAdminApi.resolveAlert(alertId, resolution),
    onSuccess: () => {
      toast.success('Alert resolved');
      queryClient.invalidateQueries({ queryKey: ['systemAlerts'] });
    },
    onError: (error: any) => {
      toast.error(`Alert resolution failed: ${error.message}`);
    },
  });
};

// SSL Certificate Management Hooks
export const useSSLCertificateStatus = () => {
  return useQuery({
    queryKey: ['sslCertificateStatus'],
    queryFn: systemAdminApi.getSSLCertificateStatus,
    refetchInterval: 3600000, // Refresh every hour
    staleTime: 1800000, // 30 minutes
  });
};

export const useSSLCertificateRenewal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: systemAdminApi.renewSSLCertificate,
    onSuccess: (data) => {
      toast.success(`SSL certificate renewed successfully. New expiry: ${data.newExpiry}`);
      queryClient.invalidateQueries({ queryKey: ['sslCertificateStatus'] });
      queryClient.invalidateQueries({ queryKey: ['systemHealth'] });
    },
    onError: (error: any) => {
      toast.error(`SSL certificate renewal failed: ${error.message}`);
    },
  });
};

// Security Monitoring Hooks
export const useSecurityStatus = () => {
  return useQuery({
    queryKey: ['securityStatus'],
    queryFn: systemAdminApi.getSecurityStatus,
    refetchInterval: 300000, // Refresh every 5 minutes
    staleTime: 120000, // 2 minutes
  });
};

export const useSecurityScan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: systemAdminApi.runSecurityScan,
    onSuccess: (data) => {
      toast.success(`Security scan completed. Found ${data.vulnerabilities.length} vulnerabilities. Score: ${data.score}/100`);
      queryClient.invalidateQueries({ queryKey: ['securityStatus'] });
    },
    onError: (error: any) => {
      toast.error(`Security scan failed: ${error.message}`);
    },
  });
};