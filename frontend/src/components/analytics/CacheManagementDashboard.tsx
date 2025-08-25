import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { 
  RefreshCw, 
  Trash2, 
  Zap, 
  Activity, 
  Database, 
  Clock, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Settings,
  Play,
  BarChart3,
  Key,
  Timer,
  Gauge
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface CacheStats {
  hit_rate: number;
  miss_rate: number;
  total_hits: number;
  total_misses: number;
  total_keys: number;
  memory_usage: number;
  evicted_keys: number;
  expired_keys: number;
}

interface CacheHealth {
  status: 'healthy' | 'warning' | 'critical';
  redis_connected: boolean;
  memory_usage_percent: number;
  response_time_ms: number;
  last_check: string;
}

interface PerformanceTest {
  test_id: string;
  timestamp: string;
  cache_hit_rate: number;
  average_response_time: number;
  total_operations: number;
  success_rate: number;
}

interface CacheKey {
  key: string;
  ttl_seconds: number;
  type: string;
  expires_at?: string;
}

interface CacheConfiguration {
  ttl_strategies: Record<string, number>;
  default_ttl: number;
  cache_types: string[];
}

export const CacheManagementDashboard: React.FC = () => {
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [cacheHealth, setCacheHealth] = useState<CacheHealth | null>(null);
  const [performanceHistory, setPerformanceHistory] = useState<PerformanceTest[]>([]);
  const [cacheKeys, setCacheKeys] = useState<CacheKey[]>([]);
  const [cacheConfig, setCacheConfig] = useState<CacheConfiguration | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [keyPattern, setKeyPattern] = useState('analytics:*');
  const [stressTestRunning, setStressTestRunning] = useState(false);

  // Fetch cache statistics
  const fetchCacheStats = async () => {
    try {
      const response = await fetch('/api/cache/stats');
      if (!response.ok) throw new Error('Failed to fetch cache stats');
      const data = await response.json();
      setCacheStats(data.cache_statistics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cache stats');
    }
  };

  // Fetch cache health
  const fetchCacheHealth = async () => {
    try {
      const response = await fetch('/api/cache/health');
      if (!response.ok) throw new Error('Failed to fetch cache health');
      const data = await response.json();
      setCacheHealth(data.health_status);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cache health');
    }
  };

  // Fetch performance history
  const fetchPerformanceHistory = async () => {
    try {
      const response = await fetch('/api/cache/performance/history');
      if (!response.ok) throw new Error('Failed to fetch performance history');
      const data = await response.json();
      setPerformanceHistory(data.performance_history);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch performance history');
    }
  };

  // Fetch cache keys
  const fetchCacheKeys = async () => {
    try {
      const response = await fetch(`/api/cache/keys?pattern=${encodeURIComponent(keyPattern)}&limit=50`);
      if (!response.ok) throw new Error('Failed to fetch cache keys');
      const data = await response.json();
      setCacheKeys(data.keys);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cache keys');
    }
  };

  // Fetch cache configuration
  const fetchCacheConfig = async () => {
    try {
      const response = await fetch('/api/cache/configuration');
      if (!response.ok) throw new Error('Failed to fetch cache configuration');
      const data = await response.json();
      setCacheConfig(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cache configuration');
    }
  };

  // Load all data
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchCacheStats(),
        fetchCacheHealth(),
        fetchPerformanceHistory(),
        fetchCacheConfig()
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Cache operations
  const invalidateCache = async (pattern: string) => {
    try {
      const response = await fetch('/api/cache/invalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pattern })
      });
      if (!response.ok) throw new Error('Failed to invalidate cache');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invalidate cache');
    }
  };

  const warmCache = async () => {
    try {
      const response = await fetch('/api/cache/warm', { method: 'POST' });
      if (!response.ok) throw new Error('Failed to warm cache');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to warm cache');
    }
  };

  const cleanupCache = async () => {
    try {
      const response = await fetch('/api/cache/cleanup', { method: 'POST' });
      if (!response.ok) throw new Error('Failed to cleanup cache');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cleanup cache');
    }
  };

  const runPerformanceTest = async () => {
    try {
      const response = await fetch('/api/cache/performance/test');
      if (!response.ok) throw new Error('Failed to run performance test');
      await fetchPerformanceHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run performance test');
    }
  };

  const runStressTest = async () => {
    setStressTestRunning(true);
    try {
      const response = await fetch('/api/cache/performance/stress-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration_seconds: 60, concurrent_users: 10 })
      });
      if (!response.ok) throw new Error('Failed to run stress test');
      await fetchPerformanceHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run stress test');
    } finally {
      setStressTestRunning(false);
    }
  };

  const deleteKey = async (key: string) => {
    try {
      const response = await fetch(`/api/cache/keys/${encodeURIComponent(key)}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete key');
      await fetchCacheKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete key');
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Health status styling
  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'critical': return <XCircle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 via-violet-500 to-indigo-500 flex items-center justify-center shadow-lg">
              <Database className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground">Cache Management</h1>
              <p className="text-muted-foreground text-lg">
                Monitor and manage analytics caching system performance
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 gap-1">
            <Activity className="h-3 w-3" />
            Real-time Monitoring
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button variant="default" size="sm" className="gap-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700">
            <Settings className="h-4 w-4" />
            Configure
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Health Status */}
      {cacheHealth && (
        <Card className="border-0 shadow-lg bg-gradient-to-r from-slate-50 to-slate-100/80">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold text-foreground">Cache Health Status</CardTitle>
                  <p className="text-muted-foreground">Real-time system monitoring</p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="bg-white rounded-lg shadow-sm border">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg border", getHealthStatusColor(cacheHealth.status))}>
                  {getHealthIcon(cacheHealth.status)}
                </div>
                <div>
                  <p className="text-sm font-medium">Overall Status</p>
                  <p className="text-xs text-muted-foreground capitalize">{cacheHealth.status}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg border", cacheHealth.redis_connected ? "text-green-600 bg-green-50 border-green-200" : "text-red-600 bg-red-50 border-red-200")}>
                  <Database className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Redis Connection</p>
                  <p className="text-xs text-muted-foreground">
                    {cacheHealth.redis_connected ? 'Connected' : 'Disconnected'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg border text-blue-600 bg-blue-50 border-blue-200">
                  <Gauge className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Memory Usage</p>
                  <p className="text-xs text-muted-foreground">{cacheHealth.memory_usage_percent}%</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg border text-purple-600 bg-purple-50 border-purple-200">
                  <Timer className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Response Time</p>
                  <p className="text-xs text-muted-foreground">{cacheHealth.response_time_ms}ms</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Card className="border-0 shadow-xl overflow-hidden">
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Tab Navigation */}
            <div className="bg-gradient-to-r from-purple-50 via-violet-50 to-indigo-50 border-b-2 border-purple-200">
              <TabsList className="grid w-full grid-cols-4 bg-transparent h-auto p-1 gap-1">
                <TabsTrigger 
                  value="overview" 
                  className="flex items-center gap-3 p-4 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-purple-300"
                >
                  <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <BarChart3 className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm">Overview</div>
                    <div className="text-xs text-muted-foreground">Statistics</div>
                  </div>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="performance" 
                  className="flex items-center gap-3 p-4 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-violet-300"
                >
                  <div className="h-8 w-8 rounded-full bg-violet-100 flex items-center justify-center">
                    <Gauge className="h-4 w-4 text-violet-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm">Performance</div>
                    <div className="text-xs text-muted-foreground">Testing</div>
                  </div>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="keys" 
                  className="flex items-center gap-3 p-4 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-indigo-300"
                >
                  <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                    <Key className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm">Keys</div>
                    <div className="text-xs text-muted-foreground">Management</div>
                  </div>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="config" 
                  className="flex items-center gap-3 p-4 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-blue-300"
                >
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <Settings className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm">Configuration</div>
                    <div className="text-xs text-muted-foreground">Settings</div>
                  </div>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Overview Tab */}
            <TabsContent value="overview" className="p-6 space-y-6 bg-gradient-to-br from-purple-50/30 to-white">
              {cacheStats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Hit Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        {(cacheStats.hit_rate * 100).toFixed(1)}%
                      </div>
                      <Progress value={cacheStats.hit_rate * 100} className="mt-2" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {cacheStats.total_hits.toLocaleString()} hits
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Keys</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {cacheStats.total_keys.toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Active cache entries
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-purple-100/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {(cacheStats.memory_usage / 1024 / 1024).toFixed(1)} MB
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Cache memory consumption
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-md bg-gradient-to-br from-orange-50 to-orange-100/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Evicted Keys</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-orange-600">
                        {cacheStats.evicted_keys.toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Keys removed by LRU
                      </p>
                    </CardContent>
                  </Card>
            </div>
          )}

              {/* Cache Operations */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-violet-50 to-indigo-100/50 hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <CardTitle>Cache Operations</CardTitle>
                  <CardDescription>
                    Manage cache lifecycle and performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button
                      onClick={() => invalidateCache('analytics:*')}
                      variant="outline"
                      className="gap-2 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl"
                    >
                      <Trash2 className="h-4 w-4" />
                      Clear Analytics Cache
                    </Button>
                    
                    <Button
                      onClick={warmCache}
                      variant="outline"
                      className="gap-2 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl"
                    >
                      <Zap className="h-4 w-4" />
                      Warm Cache
                    </Button>
                    
                    <Button
                      onClick={cleanupCache}
                      variant="outline"
                      className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Cleanup Expired
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance" className="p-6 space-y-6 bg-gradient-to-br from-violet-50/30 to-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-0 shadow-lg bg-gradient-to-br from-violet-50 to-purple-100/50 hover:shadow-xl transition-all duration-300">
                  <CardHeader>
                    <CardTitle>Performance Testing</CardTitle>
                    <CardDescription>
                      Run cache performance and stress tests
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button
                      onClick={runPerformanceTest}
                      variant="outline"
                      className="w-full gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl"
                    >
                      <BarChart3 className="h-4 w-4" />
                      Run Performance Test
                    </Button>
                    
                    <Button
                      onClick={runStressTest}
                      disabled={stressTestRunning}
                      variant="outline"
                      className="w-full gap-2 bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white shadow-lg hover:shadow-xl"
                    >
                      <Play className={cn("h-4 w-4", stressTestRunning && "animate-spin")} />
                      {stressTestRunning ? 'Running Stress Test...' : 'Run Stress Test'}
                    </Button>
                  </CardContent>
                </Card>

                {/* Performance History */}
                <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-blue-100/50 hover:shadow-xl transition-all duration-300">
                  <CardHeader>
                    <CardTitle>Recent Performance Tests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {performanceHistory?.slice(0, 5).map((test) => (
                        <div key={test.test_id} className="flex items-center justify-between p-3 border rounded-lg bg-white/70 hover:bg-white transition-colors">
                          <div>
                            <p className="text-sm font-medium">
                              Hit Rate: {(test.cache_hit_rate * 100).toFixed(1)}%
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(test.timestamp).toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {test.average_response_time.toFixed(1)}ms
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {test.total_operations} ops
                            </p>
                          </div>
                        </div>
                      ))}
                      {(!performanceHistory || performanceHistory.length === 0) && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No performance tests run yet
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Keys Tab */}
            <TabsContent value="keys" className="p-6 space-y-6 bg-gradient-to-br from-indigo-50/30 to-white">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-blue-100/50 hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Cache Keys
                  </CardTitle>
                  <CardDescription>
                    Browse and manage individual cache keys
                  </CardDescription>
                </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={keyPattern}
                  onChange={(e) => setKeyPattern(e.target.value)}
                  placeholder="Key pattern (e.g., analytics:*)"
                  className="flex-1 px-3 py-2 border rounded-md"
                />
                <Button onClick={fetchCacheKeys} variant="outline">
                  Search
                </Button>
              </div>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {cacheKeys.map((key, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{key.key}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-xs text-muted-foreground">
                          TTL: {key.ttl_seconds > 0 ? `${key.ttl_seconds}s` : 'No expiry'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Type: {key.type}
                        </span>
                        {key.expires_at && (
                          <span className="text-xs text-muted-foreground">
                            Expires: {new Date(key.expires_at).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => deleteKey(key.key)}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {cacheKeys.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No keys found matching pattern
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

            {/* Configuration Tab */}
            <TabsContent value="config" className="p-6 space-y-6 bg-gradient-to-br from-blue-50/30 to-white">
              {cacheConfig && (
                <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-100/50 hover:shadow-xl transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Cache Configuration
                    </CardTitle>
                    <CardDescription>
                      TTL strategies and cache type settings
                    </CardDescription>
                  </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Default TTL</h4>
                    <p className="text-2xl font-bold">{cacheConfig.default_ttl} seconds</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">TTL Strategies by Cache Type</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(cacheConfig.ttl_strategies).map(([type, ttl]) => (
                        <div key={type} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{type}</span>
                            <Badge variant="outline">{ttl}s</Badge>
                          </div>
                          <div className="mt-1">
                            <Progress 
                              value={(ttl / Math.max(...Object.values(cacheConfig.ttl_strategies))) * 100} 
                              className="h-2"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};