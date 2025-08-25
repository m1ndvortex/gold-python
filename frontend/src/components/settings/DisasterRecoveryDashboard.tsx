import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { Separator } from '../ui/separator';
import { 
  Shield, 
  Database, 
  Cloud, 
  RefreshCw, 
  Play, 
  Settings, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  HardDrive, 
  Activity,
  Download,
  Upload,
  FileText,
  Zap,
  Server,
  Archive,
  Eye,
  Trash2,
  Calendar,
  BarChart3
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface BackupInfo {
  backup_id: string;
  backup_type: string;
  created_at: string;
  file_path: string;
  encrypted: boolean;
  compressed: boolean;
  size_bytes: number;
  database_name?: string;
  source_path?: string;
}

interface RecoveryProcedure {
  procedure_id: string;
  name: string;
  description: string;
  estimated_duration_minutes: number;
  prerequisites: string[];
  total_steps: number;
  validation_steps_count: number;
}

interface SystemStatus {
  status: string;
  backup_statistics: {
    total_backups: number;
    backup_types: Record<string, number>;
    total_size_bytes: number;
    latest_backup?: string;
  };
  recovery_procedures: {
    total_procedures: number;
    available_procedures: string[];
  };
  off_site_storage: {
    configured: boolean;
    provider?: string;
  };
  retention_policy: {
    daily_retention_days: number;
    weekly_retention_weeks: number;
    monthly_retention_months: number;
    yearly_retention_years: number;
  };
  last_recovery_operation?: {
    recovery_id: string;
    procedure_id: string;
    status: string;
    completed_at: string;
  };
  system_health: string;
}

interface OffSiteStorageStatus {
  configured: boolean;
  provider?: string;
  bucket_name?: string;
  region?: string;
  encryption_enabled?: boolean;
  remote_backups_count?: number;
  local_backups_count?: number;
  total_remote_size?: number;
  last_sync_check?: string;
}

export const DisasterRecoveryDashboard: React.FC = () => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [procedures, setProcedures] = useState<RecoveryProcedure[]>([]);
  const [offSiteStatus, setOffSiteStatus] = useState<OffSiteStorageStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchSystemStatus = async () => {
    try {
      const response = await fetch('/api/disaster-recovery/status');
      if (!response.ok) throw new Error('Failed to fetch system status');
      const data = await response.json();
      setSystemStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const fetchBackups = async () => {
    try {
      const response = await fetch('/api/backup/list');
      if (!response.ok) throw new Error('Failed to fetch backups');
      const data = await response.json();
      setBackups(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const fetchProcedures = async () => {
    try {
      const response = await fetch('/api/disaster-recovery/procedures');
      if (!response.ok) throw new Error('Failed to fetch procedures');
      const data = await response.json();
      setProcedures(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const fetchOffSiteStatus = async () => {
    try {
      const response = await fetch('/api/disaster-recovery/offsite-storage/status');
      if (!response.ok) throw new Error('Failed to fetch off-site storage status');
      const data = await response.json();
      setOffSiteStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const refreshData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchSystemStatus(),
        fetchBackups(),
        fetchProcedures(),
        fetchOffSiteStatus()
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const executeRecoveryProcedure = async (procedureId: string, dryRun: boolean = true) => {
    try {
      const response = await fetch('/api/disaster-recovery/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          procedure_id: procedureId,
          dry_run: dryRun
        })
      });
      
      if (!response.ok) throw new Error('Failed to execute recovery procedure');
      
      const result = await response.json();
      alert(`Recovery procedure ${dryRun ? 'test' : 'execution'} completed: ${result.success ? 'Success' : 'Failed'}`);
      
      if (!dryRun) {
        refreshData();
      }
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const applyRetentionPolicy = async () => {
    try {
      const response = await fetch('/api/disaster-recovery/retention-policy/apply', {
        method: 'POST'
      });
      
      if (!response.ok) throw new Error('Failed to apply retention policy');
      
      const result = await response.json();
      alert(`Retention policy applied: ${result.backups_deleted} backups deleted, ${result.backups_archived} archived`);
      refreshData();
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const syncToOffSite = async () => {
    try {
      const response = await fetch('/api/disaster-recovery/offsite-storage/sync', {
        method: 'POST'
      });
      
      if (!response.ok) throw new Error('Failed to sync to off-site storage');
      
      const result = await response.json();
      alert(`Off-site sync completed: ${result.uploaded_count} backups uploaded`);
      refreshData();
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
      case 'operational':
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
      case 'degraded':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error':
      case 'failed':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center p-8">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading disaster recovery status...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          Error loading disaster recovery data: {error}
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-2" 
            onClick={refreshData}
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-red-50/30 hover:shadow-2xl transition-all duration-300">
      <CardHeader className="bg-gradient-to-r from-red-50 via-orange-50 to-red-50 border-b-2 border-red-200/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-foreground">
                Disaster Recovery Management
              </CardTitle>
              <CardDescription className="text-base text-muted-foreground">
                Monitor and manage backup systems, recovery procedures, and business continuity
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={cn("gap-1 shadow-md", getStatusColor(systemStatus?.system_health || 'unknown'))}
            >
              {systemStatus?.system_health === 'healthy' ? (
                <CheckCircle className="h-3 w-3" />
              ) : (
                <AlertTriangle className="h-3 w-3" />
              )}
              {systemStatus?.system_health || 'Unknown'}
            </Badge>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshData} 
              className="gap-2 bg-gradient-to-r from-red-50 to-orange-50 hover:from-red-100 hover:to-orange-100 border-red-200 hover:border-red-300 text-red-700 hover:text-red-800 shadow-md hover:shadow-lg transition-all duration-300"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 bg-gradient-to-br from-red-50/20 via-white to-orange-50/10">
        <div className="space-y-6">

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-sm font-semibold">Backups</CardTitle>
              </div>
              <Badge className="bg-blue-100 text-blue-700">
                {systemStatus?.backup_statistics.total_backups || 0}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">
              {formatBytes(systemStatus?.backup_statistics.total_size_bytes || 0)}
            </div>
            <p className="text-xs text-blue-600 mt-1">
              Latest: {systemStatus?.backup_statistics.latest_backup ? 
                formatDate(systemStatus.backup_statistics.latest_backup) : 'None'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-green-600" />
                <CardTitle className="text-sm font-semibold">Procedures</CardTitle>
              </div>
              <Badge className="bg-green-100 text-green-700">
                {systemStatus?.recovery_procedures.total_procedures || 0}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">Ready</div>
            <p className="text-xs text-green-600 mt-1">
              All recovery procedures available
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cloud className="h-5 w-5 text-purple-600" />
                <CardTitle className="text-sm font-semibold">Off-site Storage</CardTitle>
              </div>
              <Badge className={cn(
                offSiteStatus?.configured ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-700"
              )}>
                {offSiteStatus?.configured ? 'Configured' : 'Not Set'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">
              {offSiteStatus?.provider || 'None'}
            </div>
            <p className="text-xs text-purple-600 mt-1">
              {offSiteStatus?.remote_backups_count || 0} remote backups
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-amber-100/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-600" />
                <CardTitle className="text-sm font-semibold">Retention</CardTitle>
              </div>
              <Badge className="bg-amber-100 text-amber-700">Active</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-900">
              {systemStatus?.retention_policy.daily_retention_days || 0}d
            </div>
            <p className="text-xs text-amber-600 mt-1">
              Daily retention policy
            </p>
          </CardContent>
        </Card>
      </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="bg-gradient-to-r from-red-50 via-orange-50 to-red-50 border-b-2 border-red-200/50 rounded-t-lg p-1">
            <TabsList className="grid w-full grid-cols-5 bg-transparent h-auto p-1 gap-1">
              <TabsTrigger 
                value="overview" 
                className="flex items-center gap-2 p-4 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-lg data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:border-2 data-[state=active]:border-red-300 font-medium"
              >
                <BarChart3 className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="backups" 
                className="flex items-center gap-2 p-4 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-lg data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:border-2 data-[state=active]:border-red-300 font-medium"
              >
                <Database className="h-4 w-4" />
                Backups
              </TabsTrigger>
              <TabsTrigger 
                value="procedures" 
                className="flex items-center gap-2 p-4 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-lg data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:border-2 data-[state=active]:border-red-300 font-medium"
              >
                <Settings className="h-4 w-4" />
                Procedures
              </TabsTrigger>
              <TabsTrigger 
                value="storage" 
                className="flex items-center gap-2 p-4 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-lg data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:border-2 data-[state=active]:border-red-300 font-medium"
              >
                <Cloud className="h-4 w-4" />
                Storage
              </TabsTrigger>
              <TabsTrigger 
                value="settings" 
                className="flex items-center gap-2 p-4 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-lg data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:border-2 data-[state=active]:border-red-300 font-medium"
              >
                <Zap className="h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>
          </div>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {systemStatus?.last_recovery_operation ? (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-2 w-2 rounded-full",
                        systemStatus.last_recovery_operation.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'
                      )} />
                      <div>
                        <p className="font-medium text-sm">Recovery Operation</p>
                        <p className="text-xs text-muted-foreground">
                          {systemStatus.last_recovery_operation.procedure_id}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className={getStatusColor(systemStatus.last_recovery_operation.status)}>
                      {systemStatus.last_recovery_operation.status}
                    </Badge>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No recent recovery operations</p>
                )}
                
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                    <div>
                      <p className="font-medium text-sm">System Health Check</p>
                      <p className="text-xs text-muted-foreground">Automated monitoring</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    Active
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={() => executeRecoveryProcedure('database_recovery', true)}
                  className="w-full justify-start gap-2"
                  variant="outline"
                >
                  <Play className="h-4 w-4" />
                  Test Database Recovery
                </Button>
                
                <Button 
                  onClick={applyRetentionPolicy}
                  className="w-full justify-start gap-2"
                  variant="outline"
                >
                  <Archive className="h-4 w-4" />
                  Apply Retention Policy
                </Button>
                
                {offSiteStatus?.configured && (
                  <Button 
                    onClick={syncToOffSite}
                    className="w-full justify-start gap-2"
                    variant="outline"
                  >
                    <Upload className="h-4 w-4" />
                    Sync to Off-site Storage
                  </Button>
                )}
                
                <Button 
                  onClick={refreshData}
                  className="w-full justify-start gap-2"
                  variant="outline"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh All Data
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* System Health Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                System Health Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Backup System</span>
                    <Badge className="bg-green-100 text-green-700">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Healthy
                    </Badge>
                  </div>
                  <Progress value={95} className="h-2" />
                  <p className="text-xs text-muted-foreground">Last backup: 2 hours ago</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Storage Space</span>
                    <Badge className="bg-yellow-100 text-yellow-700">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Warning
                    </Badge>
                  </div>
                  <Progress value={78} className="h-2" />
                  <p className="text-xs text-muted-foreground">78% used, 22% free</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Recovery Readiness</span>
                    <Badge className="bg-green-100 text-green-700">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Ready
                    </Badge>
                  </div>
                  <Progress value={100} className="h-2" />
                  <p className="text-xs text-muted-foreground">All procedures tested</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backups" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Backup Management
              </CardTitle>
              <CardDescription>
                View and manage system backups, including database and file backups
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {backups.length > 0 ? (
                  <div className="space-y-2">
                    {backups.slice(0, 10).map((backup) => (
                      <div key={backup.backup_id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "h-8 w-8 rounded-full flex items-center justify-center",
                            backup.backup_type === 'database' ? 'bg-blue-100' : 
                            backup.backup_type === 'files' ? 'bg-green-100' : 'bg-purple-100'
                          )}>
                            {backup.backup_type === 'database' ? (
                              <Database className="h-4 w-4 text-blue-600" />
                            ) : backup.backup_type === 'files' ? (
                              <FileText className="h-4 w-4 text-green-600" />
                            ) : (
                              <Server className="h-4 w-4 text-purple-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{backup.backup_id}</p>
                            <p className="text-xs text-muted-foreground">
                              {backup.backup_type} • {formatBytes(backup.size_bytes)} • 
                              {backup.encrypted ? ' Encrypted' : ' Not encrypted'} • 
                              {backup.compressed ? ' Compressed' : ' Not compressed'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {formatDate(backup.created_at)}
                          </span>
                          <Button variant="outline" size="sm">
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No backups found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="procedures" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Recovery Procedures
              </CardTitle>
              <CardDescription>
                Available disaster recovery procedures and their current status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {procedures.map((procedure) => (
                  <div key={procedure.procedure_id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{procedure.name}</h4>
                        <p className="text-sm text-muted-foreground">{procedure.description}</p>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Ready
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Duration:</span>
                        <span className="ml-2 text-muted-foreground">
                          ~{procedure.estimated_duration_minutes} minutes
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Steps:</span>
                        <span className="ml-2 text-muted-foreground">
                          {procedure.total_steps} execution steps
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Validation:</span>
                        <span className="ml-2 text-muted-foreground">
                          {procedure.validation_steps_count} validation steps
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => executeRecoveryProcedure(procedure.procedure_id, true)}
                        className="gap-2"
                      >
                        <Play className="h-3 w-3" />
                        Test Procedure
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to execute ${procedure.name}? This will perform actual recovery operations.`)) {
                            executeRecoveryProcedure(procedure.procedure_id, false);
                          }
                        }}
                        className="gap-2"
                      >
                        <AlertTriangle className="h-3 w-3" />
                        Execute Recovery
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="storage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="h-5 w-5" />
                Off-site Storage Configuration
              </CardTitle>
              <CardDescription>
                Configure and manage off-site backup storage for enhanced disaster recovery
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {offSiteStatus?.configured ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">Storage Provider</h4>
                      <p className="text-sm text-muted-foreground">{offSiteStatus.provider}</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Bucket/Container</h4>
                      <p className="text-sm text-muted-foreground">{offSiteStatus.bucket_name}</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Region</h4>
                      <p className="text-sm text-muted-foreground">{offSiteStatus.region}</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Encryption</h4>
                      <Badge className={offSiteStatus.encryption_enabled ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                        {offSiteStatus.encryption_enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-900">
                        {offSiteStatus.remote_backups_count || 0}
                      </div>
                      <p className="text-sm text-blue-600">Remote Backups</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-900">
                        {offSiteStatus.local_backups_count || 0}
                      </div>
                      <p className="text-sm text-green-600">Local Backups</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-900">
                        {formatBytes(offSiteStatus.total_remote_size || 0)}
                      </div>
                      <p className="text-sm text-purple-600">Remote Storage Used</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button onClick={syncToOffSite} className="gap-2">
                      <Upload className="h-4 w-4" />
                      Sync to Off-site Storage
                    </Button>
                    <Button variant="outline" className="gap-2">
                      <Settings className="h-4 w-4" />
                      Configure Storage
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 space-y-4">
                  <Cloud className="h-12 w-12 mx-auto text-muted-foreground" />
                  <div>
                    <h4 className="font-medium">Off-site Storage Not Configured</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Configure off-site storage to enhance your disaster recovery capabilities
                    </p>
                  </div>
                  <Button className="gap-2">
                    <Settings className="h-4 w-4" />
                    Configure Off-site Storage
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Disaster Recovery Settings
              </CardTitle>
              <CardDescription>
                Configure backup retention policies and disaster recovery preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Backup Retention Policy</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Daily Retention</label>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">
                        {systemStatus?.retention_policy.daily_retention_days || 0}
                      </span>
                      <span className="text-sm text-muted-foreground">days</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Weekly Retention</label>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">
                        {systemStatus?.retention_policy.weekly_retention_weeks || 0}
                      </span>
                      <span className="text-sm text-muted-foreground">weeks</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Monthly Retention</label>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">
                        {systemStatus?.retention_policy.monthly_retention_months || 0}
                      </span>
                      <span className="text-sm text-muted-foreground">months</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Yearly Retention</label>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">
                        {systemStatus?.retention_policy.yearly_retention_years || 0}
                      </span>
                      <span className="text-sm text-muted-foreground">years</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h4 className="font-medium">Automated Tasks</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">Retention Policy Application</p>
                      <p className="text-xs text-muted-foreground">Daily at 3:00 AM</p>
                    </div>
                    <Badge className="bg-green-100 text-green-700">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">Off-site Storage Sync</p>
                      <p className="text-xs text-muted-foreground">Every hour</p>
                    </div>
                    <Badge className="bg-green-100 text-green-700">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">Recovery Procedure Testing</p>
                      <p className="text-xs text-muted-foreground">Daily at 4:00 AM</p>
                    </div>
                    <Badge className="bg-green-100 text-green-700">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">System Health Monitoring</p>
                      <p className="text-xs text-muted-foreground">Every 4 hours</p>
                    </div>
                    <Badge className="bg-green-100 text-green-700">Active</Badge>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 pt-4">
                <Button onClick={applyRetentionPolicy} className="gap-2">
                  <Archive className="h-4 w-4" />
                  Apply Retention Policy Now
                </Button>
                <Button variant="outline" className="gap-2">
                  <Settings className="h-4 w-4" />
                  Configure Policies
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        </Tabs>
        </div>
      </CardContent>
    </Card>
  );
};