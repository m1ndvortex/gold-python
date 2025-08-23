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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cache Management</h1>
          <p className="text-muted-foreground">
            Monitor and manage analytics caching system performance
          </p>
        </div>
        <div className="flex items-center gap-2">
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Cache Health Status
            </CardTitle>
          </CardHeader>
          <CardContent>
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
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="keys">Keys</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {cacheStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
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

              <Card>
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

              <Card>
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

              <Card>
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
          <Card>
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
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear Analytics Cache
                </Button>
                
                <Button
                  onClick={warmCache}
                  variant="outline"
                  className="gap-2"
                >
                  <Zap className="h-4 w-4" />
                  Warm Cache
                </Button>
                
                <Button
                  onClick={cleanupCache}
                  variant="outline"
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Cleanup Expired
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
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
                  className="w-full gap-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  Run Performance Test
                </Button>
                
                <Button
                  onClick={runStressTest}
                  disabled={stressTestRunning}
                  variant="outline"
                  className="w-full gap-2"
                >
                  <Play className={cn("h-4 w-4", stressTestRunning && "animate-spin")} />
                  {stressTestRunning ? 'Running Stress Test...' : 'Run Stress Test'}
                </Button>
              </CardContent>
            </Card>

            {/* Performance History */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Performance Tests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {performanceHistory.slice(0, 5).map((test) => (
                    <div key={test.test_id} className="flex items-center justify-between p-3 border rounded-lg">
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
                  {performanceHistory.length === 0 && (
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
        <TabsContent value="keys" className="space-y-6">
          <Card>
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
        <TabsContent value="config" className="space-y-6">
          {cacheConfig && (
            <Card>
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
    </div>
  );
};