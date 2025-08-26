import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  History, 
  User, 
  Calendar, 
  FileText, 
  Edit, 
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Package,
  Filter,
  Download,
  Eye,
  MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';

interface AuditEntry {
  id: string;
  action: string;
  userId: string;
  userName: string;
  userRole: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  description?: string;
  category: 'invoice' | 'payment' | 'workflow' | 'stock' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface WorkflowTransition {
  id: string;
  fromStage: string;
  toStage: string;
  userId: string;
  userName: string;
  timestamp: string;
  notes?: string;
  automatic: boolean;
}

interface ChangeHistory {
  field: string;
  oldValue: any;
  newValue: any;
  timestamp: string;
  userId: string;
  userName: string;
}

interface AuditTrailProps {
  invoiceId: string;
  auditEntries: AuditEntry[];
  workflowHistory: WorkflowTransition[];
  changeHistory: ChangeHistory[];
  onExportAuditLog?: () => Promise<void>;
  className?: string;
}

export const AuditTrail: React.FC<AuditTrailProps> = ({
  invoiceId,
  auditEntries,
  workflowHistory,
  changeHistory,
  onExportAuditLog,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<string>('all');

  // Filter audit entries
  const filteredEntries = auditEntries.filter(entry => {
    const matchesCategory = filterCategory === 'all' || entry.category === filterCategory;
    const matchesSeverity = filterSeverity === 'all' || entry.severity === filterSeverity;
    const matchesSearch = searchTerm === '' || 
      entry.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesDate = true;
    if (dateRange !== 'all') {
      const entryDate = new Date(entry.timestamp);
      const now = new Date();
      switch (dateRange) {
        case 'today':
          matchesDate = entryDate.toDateString() === now.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = entryDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = entryDate >= monthAgo;
          break;
      }
    }

    return matchesCategory && matchesSeverity && matchesSearch && matchesDate;
  });

  const getActionIcon = (action: string, category: string) => {
    switch (category) {
      case 'invoice':
        if (action.includes('create')) return <FileText className="h-4 w-4" />;
        if (action.includes('edit') || action.includes('update')) return <Edit className="h-4 w-4" />;
        if (action.includes('delete')) return <Trash2 className="h-4 w-4" />;
        return <FileText className="h-4 w-4" />;
      case 'payment':
        return <DollarSign className="h-4 w-4" />;
      case 'workflow':
        if (action.includes('approve')) return <CheckCircle className="h-4 w-4" />;
        if (action.includes('reject')) return <XCircle className="h-4 w-4" />;
        return <Clock className="h-4 w-4" />;
      case 'stock':
        return <Package className="h-4 w-4" />;
      default:
        return <History className="h-4 w-4" />;
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'invoice':
        return <Badge className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border-0 shadow-sm">Invoice</Badge>;
      case 'payment':
        return <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-0 shadow-sm">Payment</Badge>;
      case 'workflow':
        return <Badge className="bg-gradient-to-r from-purple-100 to-violet-100 text-purple-700 border-0 shadow-sm">Workflow</Badge>;
      case 'stock':
        return <Badge className="bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 border-0 shadow-sm">Stock</Badge>;
      case 'system':
        return <Badge className="bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 border-0 shadow-sm">System</Badge>;
      default:
        return <Badge className="bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 border-0 shadow-sm">{category}</Badge>;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge className="bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border-0 shadow-sm">Critical</Badge>;
      case 'high':
        return <Badge className="bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 border-0 shadow-sm">High</Badge>;
      case 'medium':
        return <Badge className="bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 border-0 shadow-sm">Medium</Badge>;
      case 'low':
        return <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-0 shadow-sm">Low</Badge>;
      default:
        return <Badge className="bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 border-0 shadow-sm">{severity}</Badge>;
    }
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (typeof value === 'number') return value.toString();
    return String(value);
  };

  return (
    <Card className={cn("border-0 shadow-lg bg-gradient-to-br from-slate-50 to-gray-100/50", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-slate-500 to-gray-600 flex items-center justify-center shadow-lg">
              <History className="h-4 w-4 text-white" />
            </div>
            <span className="text-slate-800">Audit Trail</span>
          </CardTitle>
          
          {onExportAuditLog && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExportAuditLog}
              className="border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all duration-300"
            >
              <Download className="h-3 w-3 mr-1" />
              Export
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-transparent h-auto p-1">
            <TabsTrigger 
              value="all" 
              className="flex items-center gap-2 p-3 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-slate-300 rounded-lg m-1 transition-all duration-300"
            >
              <History className="h-4 w-4" />
              <span className="font-medium">All Events</span>
            </TabsTrigger>
            <TabsTrigger 
              value="workflow" 
              className="flex items-center gap-2 p-3 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-purple-300 rounded-lg m-1 transition-all duration-300"
            >
              <Clock className="h-4 w-4" />
              <span className="font-medium">Workflow</span>
            </TabsTrigger>
            <TabsTrigger 
              value="changes" 
              className="flex items-center gap-2 p-3 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-blue-300 rounded-lg m-1 transition-all duration-300"
            >
              <Edit className="h-4 w-4" />
              <span className="font-medium">Changes</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6 mt-6">
            {/* Filters */}
            <div className="p-4 bg-white/50 border border-slate-200/50 rounded-lg">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="h-4 w-4 text-slate-600" />
                <span className="font-medium text-slate-800">Filters</span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <Input
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="text-sm"
                  />
                </div>
                
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="invoice">Invoice</SelectItem>
                    <SelectItem value="payment">Payment</SelectItem>
                    <SelectItem value="workflow">Workflow</SelectItem>
                    <SelectItem value="stock">Stock</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Date Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">Last 30 Days</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {filteredEntries.length} events
                  </Badge>
                </div>
              </div>
            </div>

            {/* Audit Entries */}
            <div className="space-y-3">
              {filteredEntries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No audit entries found matching the current filters
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredEntries.map((entry) => (
                    <div key={entry.id} className="p-4 bg-white/50 border border-slate-200/50 rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-slate-500 to-gray-600 flex items-center justify-center shadow-sm">
                            {getActionIcon(entry.action, entry.category)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">{entry.action}</span>
                              {getCategoryBadge(entry.category)}
                              {getSeverityBadge(entry.severity)}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span>{entry.userName} ({entry.userRole})</span>
                              <Calendar className="h-3 w-3 ml-2" />
                              <span>{format(new Date(entry.timestamp), 'MMM dd, yyyy HH:mm:ss')}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {entry.description && (
                        <div className="mb-3">
                          <div className="flex items-center gap-2 mb-1">
                            <MessageSquare className="h-3 w-3 text-slate-500" />
                            <span className="text-xs font-medium text-slate-600">Description</span>
                          </div>
                          <p className="text-sm text-slate-700 pl-5">{entry.description}</p>
                        </div>
                      )}

                      {(entry.oldValues || entry.newValues) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 pt-3 border-t border-slate-200">
                          {entry.oldValues && (
                            <div>
                              <span className="text-xs font-medium text-red-600 block mb-1">Before</span>
                              <pre className="text-xs bg-red-50 p-2 rounded border text-red-700 overflow-x-auto">
                                {formatValue(entry.oldValues)}
                              </pre>
                            </div>
                          )}
                          {entry.newValues && (
                            <div>
                              <span className="text-xs font-medium text-green-600 block mb-1">After</span>
                              <pre className="text-xs bg-green-50 p-2 rounded border text-green-700 overflow-x-auto">
                                {formatValue(entry.newValues)}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}

                      {entry.ipAddress && (
                        <div className="mt-2 pt-2 border-t border-slate-200">
                          <span className="text-xs text-muted-foreground">
                            IP: {entry.ipAddress}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="workflow" className="space-y-6 mt-6">
            <div className="space-y-3">
              <h4 className="font-medium text-slate-800">Workflow Transitions</h4>
              {workflowHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No workflow transitions recorded
                </div>
              ) : (
                <div className="space-y-2">
                  {workflowHistory.map((transition) => (
                    <div key={transition.id} className="p-4 bg-white/50 border border-purple-200/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-sm">
                            <Clock className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                {transition.fromStage} → {transition.toStage}
                              </span>
                              {transition.automatic && (
                                <Badge className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border-0 shadow-sm text-xs">
                                  Automatic
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span>{transition.userName}</span>
                              <Calendar className="h-3 w-3 ml-2" />
                              <span>{format(new Date(transition.timestamp), 'MMM dd, yyyy HH:mm')}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {transition.notes && (
                        <div className="mt-2 pl-11">
                          <div className="flex items-center gap-2 mb-1">
                            <MessageSquare className="h-3 w-3 text-purple-500" />
                            <span className="text-xs font-medium text-purple-600">Notes</span>
                          </div>
                          <p className="text-sm text-purple-700 bg-purple-50 p-2 rounded">
                            {transition.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="changes" className="space-y-6 mt-6">
            <div className="space-y-3">
              <h4 className="font-medium text-slate-800">Field Changes</h4>
              {changeHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No field changes recorded
                </div>
              ) : (
                <div className="space-y-2">
                  {changeHistory.map((change, index) => (
                    <div key={index} className="p-4 bg-white/50 border border-blue-200/50 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                            <Edit className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <span className="font-medium text-sm">{change.field}</span>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span>{change.userName}</span>
                              <Calendar className="h-3 w-3 ml-2" />
                              <span>{format(new Date(change.timestamp), 'MMM dd, yyyy HH:mm')}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-11">
                        <div>
                          <span className="text-xs font-medium text-red-600 block mb-1">Old Value</span>
                          <div className="text-sm bg-red-50 p-2 rounded border text-red-700">
                            {formatValue(change.oldValue)}
                          </div>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-green-600 block mb-1">New Value</span>
                          <div className="text-sm bg-green-50 p-2 rounded border text-green-700">
                            {formatValue(change.newValue)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};