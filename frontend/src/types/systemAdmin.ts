export interface SystemHealth {
  overall: HealthStatus;
  services: ServiceHealth[];
  resources: ResourceUsage;
  security: SecurityStatus;
  backups: BackupHealth;
  alerts: SystemAlert[];
  lastUpdated: Date;
}

export interface HealthStatus {
  status: 'healthy' | 'warning' | 'critical';
  score: number; // 0-100
  message: string;
}

export interface ServiceHealth {
  name: string;
  status: 'healthy' | 'unhealthy' | 'starting' | 'stopped';
  uptime: string;
  cpu: number;
  memory: number;
  lastRestart: Date;
  actions: ServiceAction[];
  logs?: LogEntry[];
}

export interface ServiceAction {
  label: string;
  action: 'restart' | 'stop' | 'logs' | 'config';
  dangerous: boolean;
}

export interface ResourceUsage {
  cpu: {
    current: number;
    average: number;
    trend: 'up' | 'down' | 'stable';
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
    trend: 'up' | 'down' | 'stable';
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
    trend: 'up' | 'down' | 'stable';
  };
  network: {
    inbound: number;
    outbound: number;
  };
}

export interface SecurityStatus {
  sslCertificate: SSLCertificate;
  securityHeaders: SecurityHeaders;
  rateLimiting: RateLimitingStats;
  lastSecurityScan: Date;
  vulnerabilities: SecurityVulnerability[];
}

export interface SSLCertificate {
  domain: string;
  issuer: string;
  validFrom: Date;
  validTo: Date;
  daysUntilExpiry: number;
  status: 'valid' | 'expiring' | 'expired' | 'invalid';
  autoRenewal: boolean;
}

export interface SecurityHeaders {
  hsts: boolean;
  csp: boolean;
  xFrameOptions: boolean;
  xContentTypeOptions: boolean;
  referrerPolicy: boolean;
  score: number;
}

export interface RateLimitingStats {
  enabled: boolean;
  requestsPerMinute: number;
  blockedRequests: number;
  topBlockedIPs: string[];
}

export interface SecurityVulnerability {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affectedService: string;
  discoveredAt: Date;
  status: 'open' | 'acknowledged' | 'fixed';
}

export interface BackupHealth {
  lastBackup: Date;
  nextScheduledBackup: Date;
  backupSize: number;
  backupLocation: string;
  status: 'success' | 'failed' | 'in_progress';
  retentionDays: number;
  availableBackups: BackupFile[];
}

export interface BackupFile {
  filename: string;
  date: Date;
  size: number;
  type: 'full' | 'incremental';
  verified: boolean;
}

export interface SystemAlert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  description: string;
  source: string;
  timestamp: Date;
  acknowledged: boolean;
  resolvedAt?: Date;
  actions: AlertAction[];
}

export interface AlertAction {
  label: string;
  action: string;
  dangerous: boolean;
}

export interface LogEntry {
  timestamp: Date;
  service: string;
  level: 'debug' | 'info' | 'warning' | 'error' | 'critical';
  message: string;
  metadata: Record<string, any>;
  traceId?: string;
}

export interface LogFilter {
  services: string[];
  levels: string[];
  dateRange: [Date, Date];
  searchQuery: string;
  limit: number;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  threshold: number;
  chartData: ChartDataPoint[];
}

export interface ChartDataPoint {
  timestamp: Date;
  value: number;
  label?: string;
}

export interface DatabaseStatus {
  connectionPool: {
    active: number;
    idle: number;
    total: number;
  };
  queryPerformance: {
    averageResponseTime: number;
    slowQueries: number;
    totalQueries: number;
  };
  storage: {
    size: number;
    freeSpace: number;
    tableCount: number;
  };
  replication: {
    status: 'healthy' | 'lagging' | 'failed';
    lag: number;
  };
}

export interface RedisStatus {
  memory: {
    used: number;
    peak: number;
    fragmentation: number;
  };
  performance: {
    hitRate: number;
    missRate: number;
    operationsPerSecond: number;
  };
  connections: {
    connected: number;
    blocked: number;
    rejected: number;
  };
  keyspace: {
    totalKeys: number;
    expiredKeys: number;
    evictedKeys: number;
  };
}

export interface FeatureFlag {
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  conditions: FeatureFlagCondition[];
  lastModified: Date;
  modifiedBy: string;
}

export interface FeatureFlagCondition {
  type: 'user_role' | 'user_id' | 'percentage' | 'date_range';
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
  value: string | number | Date;
}

export interface EnvironmentVariable {
  key: string;
  value: string;
  sensitive: boolean;
  description?: string;
  lastModified: Date;
  modifiedBy: string;
}

export interface UserSession {
  id: string;
  userId: string;
  username: string;
  role: string;
  ipAddress: string;
  userAgent: string;
  loginTime: Date;
  lastActivity: Date;
  isActive: boolean;
  location?: string;
}

export interface SystemConfiguration {
  environmentVariables: EnvironmentVariable[];
  featureFlags: FeatureFlag[];
  systemSettings: Record<string, any>;
}

export interface ManualBackupRequest {
  type: 'full' | 'incremental';
  includeImages: boolean;
  includeConfigs: boolean;
  description?: string;
}

export interface RestoreRequest {
  backupFile: string;
  restoreType: 'full' | 'selective';
  selectedTables?: string[];
  confirmDataLoss: boolean;
}

export interface ServiceManagementAction {
  service: string;
  action: 'restart' | 'stop' | 'start';
  force?: boolean;
}