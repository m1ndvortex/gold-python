import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { 
  Eye, 
  Search, 
  Filter,
  Calendar,
  User,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { RBACAccessLog, AccessAuditFilters } from '../../types';
import { rbacApi } from '../../services/rbacApi';

export const AccessAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<RBACAccessLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AccessAuditFilters>({
    page: 1,
    per_page: 50
  });

  useEffect(() => {
    loadLogs();
  }, [filters]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const response = await rbacApi.getAccessLogs(filters);
      setLogs(response.logs);
    } catch (error) {
      console.error('Failed to load access logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (granted: boolean) => {
    return granted ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    );
  };

  const getStatusBadge = (granted: boolean) => {
    return granted ? (
      <Badge className="bg-green-100 text-green-800">Granted</Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">Denied</Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Access Audit Logs</h2>
          <p className="text-gray-600">Monitor user access attempts and security events</p>
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Recent Access Attempts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {logs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  {getStatusIcon(log.access_granted)}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{log.resource}:{log.action}</span>
                      {log.permission_name && (
                        <Badge variant="outline" className="text-xs">
                          {log.permission_name}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {log.endpoint} • {log.method} • {log.ip_address}
                    </div>
                    {log.reason && (
                      <div className="text-xs text-gray-400">{log.reason}</div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  {getStatusBadge(log.access_granted)}
                  <div className="text-sm text-gray-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </div>
                  {log.response_time_ms && (
                    <Badge variant="secondary" className="text-xs">
                      {log.response_time_ms}ms
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>

          {logs.length === 0 && (
            <div className="text-center py-12">
              <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No audit logs found</h3>
              <p className="text-gray-600">Access attempts will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};