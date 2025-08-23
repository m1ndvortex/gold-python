import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  Package, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  BarChart3,
  Target,
  Zap,
  RefreshCw,
  Download,
  Filter,
  ShoppingCart,
  Truck,
  Warehouse
} from 'lucide-react';
import { useStockOptimizationRecommendations } from '../../hooks/useInventoryIntelligence';
import { InteractiveChart } from './charts/InteractiveChart';
import { cn } from '../../lib/utils';

interface StockOptimizationDashboardProps {
  className?: string;
}

export const StockOptimizationDashboard: React.FC<StockOptimizationDashboardProps> = ({ className }) => {
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [activeTab, setActiveTab] = useState('recommendations');

  // Fetch stock optimization recommendations
  const { data: recommendations, isLoading, refetch } = useStockOptimizationRecommendations();

  // Sample data for demonstration
  const optimizationMetrics = useMemo(() => ({
    totalRecommendations: 24,
    highPriority: 8,
    potentialSavings: 15420,
    implementedCount: 12,
    avgImplementationTime: 3.2
  }), []);

  const reorderRecommendations = useMemo(() => [
    {
      id: '1',
      item: 'Gold Chain 18K',
      category: 'Necklaces',
      currentStock: 5,
      reorderPoint: 15,
      recommendedOrder: 25,
      leadTime: 7,
      priority: 'high',
      status: 'pending',
      potentialSavings: 2400,
      reason: 'Below safety stock level'
    },
    {
      id: '2',
      item: 'Diamond Earrings',
      category: 'Earrings',
      currentStock: 12,
      reorderPoint: 20,
      recommendedOrder: 30,
      leadTime: 14,
      priority: 'medium',
      status: 'pending',
      potentialSavings: 1800,
      reason: 'Approaching reorder point'
    },
    {
      id: '3',
      item: 'Silver Bracelet',
      category: 'Bracelets',
      currentStock: 45,
      reorderPoint: 25,
      recommendedOrder: 0,
      leadTime: 5,
      priority: 'low',
      status: 'implemented',
      potentialSavings: 800,
      reason: 'Overstock - reduce orders'
    },
    {
      id: '4',
      item: 'Wedding Ring Set',
      category: 'Rings',
      currentStock: 8,
      reorderPoint: 18,
      recommendedOrder: 35,
      leadTime: 10,
      priority: 'high',
      status: 'pending',
      potentialSavings: 3200,
      reason: 'High demand forecast'
    },
  ], []);

  const categoryOptimization = useMemo(() => [
    { name: 'Necklaces', currentValue: 45000, optimizedValue: 38000, savings: 7000 },
    { name: 'Rings', currentValue: 62000, optimizedValue: 58000, savings: 4000 },
    { name: 'Bracelets', currentValue: 28000, optimizedValue: 25000, savings: 3000 },
    { name: 'Earrings', currentValue: 35000, optimizedValue: 33500, savings: 1500 },
  ], []);

  const stockLevels = useMemo(() => [
    { name: 'Optimal', value: 65, color: '#10b981' },
    { name: 'Overstock', value: 20, color: '#f59e0b' },
    { name: 'Understock', value: 15, color: '#ef4444' },
  ], []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'implemented': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground">Stock Optimization</h1>
              <p className="text-muted-foreground text-lg">
                Intelligent inventory management and cost optimization
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
            <Target className="h-3 w-3" />
            AI Optimized
          </Badge>
          <Button onClick={() => refetch()} variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button variant="default" size="sm" className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
            <Zap className="h-4 w-4" />
            Optimize All
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-lg bg-blue-500 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">Total</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-blue-700">{optimizationMetrics.totalRecommendations}</div>
              <p className="text-sm text-muted-foreground">Recommendations</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-red-50 to-red-100/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-lg bg-red-500 flex items-center justify-center">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <Badge variant="secondary" className="bg-red-100 text-red-700">Urgent</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-red-700">{optimizationMetrics.highPriority}</div>
              <p className="text-sm text-muted-foreground">High Priority</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-lg bg-green-500 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-700">Savings</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-green-700">${optimizationMetrics.potentialSavings.toLocaleString()}</div>
              <p className="text-sm text-muted-foreground">Potential Savings</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-purple-100/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-lg bg-purple-500 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <Badge variant="secondary" className="bg-purple-100 text-purple-700">Done</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-purple-700">{optimizationMetrics.implementedCount}</div>
              <p className="text-sm text-muted-foreground">Implemented</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-orange-50 to-orange-100/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-lg bg-orange-500 flex items-center justify-center">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <Badge variant="secondary" className="bg-orange-100 text-orange-700">Avg Time</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-orange-700">{optimizationMetrics.avgImplementationTime}</div>
              <p className="text-sm text-muted-foreground">Days to Implement</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-slate-50 to-slate-100/80">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                <Filter className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold text-foreground">Optimization Filters</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Filter recommendations by priority and status
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="bg-white rounded-lg shadow-sm border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Priority Level</label>
              <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                  <SelectItem value="medium">Medium Priority</SelectItem>
                  <SelectItem value="low">Low Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Implementation Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="implemented">Implemented</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Card className="border-0 shadow-xl overflow-hidden">
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Tab Navigation */}
            <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 border-b-2 border-green-200">
              <TabsList className="grid w-full grid-cols-3 bg-transparent h-auto p-1 gap-1">
                <TabsTrigger 
                  value="recommendations" 
                  className="flex items-center gap-3 p-4 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-green-300"
                >
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                    <AlertTriangle className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm">Recommendations</div>
                    <div className="text-xs text-muted-foreground">Action Items</div>
                  </div>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="analytics" 
                  className="flex items-center gap-3 p-4 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-emerald-300"
                >
                  <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                    <BarChart3 className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm">Analytics</div>
                    <div className="text-xs text-muted-foreground">Performance Metrics</div>
                  </div>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="savings" 
                  className="flex items-center gap-3 p-4 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-teal-300"
                >
                  <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-teal-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm">Cost Savings</div>
                    <div className="text-xs text-muted-foreground">Financial Impact</div>
                  </div>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Recommendations Tab */}
            <TabsContent value="recommendations" className="p-6 space-y-6 bg-gradient-to-br from-green-50/30 to-white">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Reorder Recommendations
                  </CardTitle>
                  <CardDescription>Items requiring immediate attention for optimal stock levels</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reorderRecommendations.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-gray-500" />
                            <div>
                              <div className="font-medium">{item.item}</div>
                              <div className="text-sm text-muted-foreground">{item.category}</div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <div className="text-sm font-medium">Current: {item.currentStock}</div>
                            <div className="text-sm text-muted-foreground">Reorder: {item.recommendedOrder}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">${item.potentialSavings}</div>
                            <div className="text-sm text-muted-foreground">Savings</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={getPriorityColor(item.priority)}>
                              {item.priority}
                            </Badge>
                            <Badge className={getStatusColor(item.status)}>
                              {item.status}
                            </Badge>
                          </div>
                          <Button size="sm" variant="outline">
                            {item.status === 'pending' ? 'Implement' : 'View'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="p-6 space-y-6 bg-gradient-to-br from-emerald-50/30 to-white">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Stock Level Distribution
                    </CardTitle>
                    <CardDescription>Current inventory status across all items</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <InteractiveChart 
                      data={stockLevels}
                      type="pie"
                      height={300}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Warehouse className="h-5 w-5" />
                      Category Optimization
                    </CardTitle>
                    <CardDescription>Potential savings by product category</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <InteractiveChart 
                      data={categoryOptimization.map(cat => ({ 
                        name: cat.name, 
                        value: cat.savings 
                      }))}
                      type="bar"
                      height={300}
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Cost Savings Tab */}
            <TabsContent value="savings" className="p-6 space-y-6 bg-gradient-to-br from-teal-50/30 to-white">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Optimization Impact</CardTitle>
                    <CardDescription>Financial benefits of implementing recommendations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {categoryOptimization.map((category, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">{category.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Current: ${category.currentValue.toLocaleString()}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-green-600">
                              ${category.savings.toLocaleString()}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {((category.savings / category.currentValue) * 100).toFixed(1)}% savings
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Implementation Timeline</CardTitle>
                    <CardDescription>Expected savings realization over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <InteractiveChart 
                      data={[
                        { name: 'Month 1', value: 3200 },
                        { name: 'Month 2', value: 6800 },
                        { name: 'Month 3', value: 11500 },
                        { name: 'Month 4', value: 15420 },
                      ]}
                      type="area"
                      height={300}
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default StockOptimizationDashboard;