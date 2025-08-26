import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Percent, 
  Calculator,
  BarChart3,
  PieChart,
  Target,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface PricingItem {
  itemId: string;
  itemName: string;
  quantity: number;
  costPrice: number;
  salePrice: number;
  totalCost: number;
  totalRevenue: number;
  margin: number;
  marginPercentage: number;
  category?: string;
}

interface PricingBreakdown {
  subtotal: number;
  totalCost: number;
  grossProfit: number;
  profitMargin: number;
  
  // Business type specific
  goldSpecific?: {
    totalWeight: number;
    goldValue: number;
    laborCost: number;
    profitAmount: number;
  };
  
  // Tax and discounts
  taxAmount: number;
  discountAmount: number;
  finalTotal: number;
}

interface PricingAnalyticsProps {
  items: PricingItem[];
  breakdown: PricingBreakdown;
  businessType?: 'gold_shop' | 'retail' | 'service' | 'manufacturing';
  targetMargin?: number;
  onOptimizePricing?: () => void;
  className?: string;
}

export const PricingAnalytics: React.FC<PricingAnalyticsProps> = ({
  items,
  breakdown,
  businessType = 'gold_shop',
  targetMargin = 20,
  onOptimizePricing,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  // Calculate analytics
  const averageMargin = items.length > 0 
    ? items.reduce((sum, item) => sum + item.marginPercentage, 0) / items.length 
    : 0;

  const highMarginItems = items.filter(item => item.marginPercentage > targetMargin);
  const lowMarginItems = items.filter(item => item.marginPercentage < targetMargin);
  const negativeMarginItems = items.filter(item => item.marginPercentage < 0);

  const getMarginStatus = (margin: number) => {
    if (margin < 0) return { status: 'negative', color: 'red', label: 'Loss' };
    if (margin < targetMargin * 0.5) return { status: 'low', color: 'red', label: 'Low' };
    if (margin < targetMargin) return { status: 'below_target', color: 'amber', label: 'Below Target' };
    if (margin < targetMargin * 1.5) return { status: 'good', color: 'green', label: 'Good' };
    return { status: 'excellent', color: 'emerald', label: 'Excellent' };
  };

  const overallMarginStatus = getMarginStatus(breakdown.profitMargin);

  return (
    <Card className={cn("border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-teal-100/50", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
            <BarChart3 className="h-4 w-4 text-white" />
          </div>
          <span className="text-emerald-800">Pricing Analytics</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-transparent h-auto p-1">
            <TabsTrigger 
              value="overview" 
              className="flex items-center gap-2 p-3 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-emerald-300 rounded-lg m-1 transition-all duration-300"
            >
              <Calculator className="h-4 w-4" />
              <span className="font-medium">Overview</span>
            </TabsTrigger>
            <TabsTrigger 
              value="items" 
              className="flex items-center gap-2 p-3 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-teal-300 rounded-lg m-1 transition-all duration-300"
            >
              <PieChart className="h-4 w-4" />
              <span className="font-medium">Item Analysis</span>
            </TabsTrigger>
            <TabsTrigger 
              value="optimization" 
              className="flex items-center gap-2 p-3 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-blue-300 rounded-lg m-1 transition-all duration-300"
            >
              <Target className="h-4 w-4" />
              <span className="font-medium">Optimization</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Overall Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-white/50 border border-emerald-200/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-medium">Total Revenue</span>
                </div>
                <p className="text-2xl font-bold text-emerald-700">
                  ${breakdown.finalTotal.toFixed(2)}
                </p>
              </div>

              <div className="p-4 bg-white/50 border border-teal-200/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calculator className="h-4 w-4 text-teal-600" />
                  <span className="text-sm font-medium">Total Cost</span>
                </div>
                <p className="text-2xl font-bold text-teal-700">
                  ${breakdown.totalCost.toFixed(2)}
                </p>
              </div>

              <div className="p-4 bg-white/50 border border-green-200/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Gross Profit</span>
                </div>
                <p className="text-2xl font-bold text-green-700">
                  ${breakdown.grossProfit.toFixed(2)}
                </p>
              </div>

              <div className="p-4 bg-white/50 border border-blue-200/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Percent className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Profit Margin</span>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-blue-700">
                    {breakdown.profitMargin.toFixed(1)}%
                  </p>
                  <Badge className={cn(
                    "border-0 shadow-sm text-xs",
                    overallMarginStatus.color === 'green' && "bg-gradient-to-r from-green-100 to-emerald-100 text-green-700",
                    overallMarginStatus.color === 'amber' && "bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700",
                    overallMarginStatus.color === 'red' && "bg-gradient-to-r from-red-100 to-rose-100 text-red-700",
                    overallMarginStatus.color === 'emerald' && "bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700"
                  )}>
                    {overallMarginStatus.label}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Margin Progress */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Margin vs Target</span>
                <span className="text-sm text-muted-foreground">
                  Target: {targetMargin}%
                </span>
              </div>
              <Progress 
                value={Math.min(100, (breakdown.profitMargin / targetMargin) * 100)}
                className="h-3"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Current: {breakdown.profitMargin.toFixed(1)}%</span>
                <span>
                  {breakdown.profitMargin >= targetMargin 
                    ? `+${(breakdown.profitMargin - targetMargin).toFixed(1)}% above target`
                    : `${(targetMargin - breakdown.profitMargin).toFixed(1)}% below target`
                  }
                </span>
              </div>
            </div>

            {/* Gold Shop Specific Metrics */}
            {businessType === 'gold_shop' && breakdown.goldSpecific && (
              <div className="p-4 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg">
                <h4 className="font-medium text-amber-800 mb-3">Gold Shop Metrics</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="block text-amber-600">Total Weight</span>
                    <span className="font-medium text-amber-800">
                      {breakdown.goldSpecific.totalWeight.toFixed(3)}g
                    </span>
                  </div>
                  <div>
                    <span className="block text-amber-600">Gold Value</span>
                    <span className="font-medium text-amber-800">
                      ${breakdown.goldSpecific.goldValue.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-amber-600">Labor Cost (اجرت)</span>
                    <span className="font-medium text-amber-800">
                      ${breakdown.goldSpecific.laborCost.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-amber-600">Profit (سود)</span>
                    <span className="font-medium text-amber-800">
                      ${breakdown.goldSpecific.profitAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="items" className="space-y-6 mt-6">
            {/* Item Performance Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-green-50/50 border border-green-200/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">High Margin</span>
                </div>
                <p className="text-xl font-bold text-green-700">{highMarginItems.length}</p>
                <p className="text-xs text-green-600">Above target margin</p>
              </div>

              <div className="p-4 bg-amber-50/50 border border-amber-200/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-medium">Low Margin</span>
                </div>
                <p className="text-xl font-bold text-amber-700">{lowMarginItems.length}</p>
                <p className="text-xs text-amber-600">Below target margin</p>
              </div>

              <div className="p-4 bg-red-50/50 border border-red-200/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium">Negative Margin</span>
                </div>
                <p className="text-xl font-bold text-red-700">{negativeMarginItems.length}</p>
                <p className="text-xs text-red-600">Selling at loss</p>
              </div>
            </div>

            {/* Item Details */}
            <div className="space-y-3">
              <h4 className="font-medium text-emerald-800">Item Margin Analysis</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {items.map((item) => {
                  const marginStatus = getMarginStatus(item.marginPercentage);
                  return (
                    <div key={item.itemId} className="p-3 bg-white/50 border border-emerald-200/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{item.itemName}</span>
                        <Badge className={cn(
                          "border-0 shadow-sm text-xs",
                          marginStatus.color === 'green' && "bg-gradient-to-r from-green-100 to-emerald-100 text-green-700",
                          marginStatus.color === 'amber' && "bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700",
                          marginStatus.color === 'red' && "bg-gradient-to-r from-red-100 to-rose-100 text-red-700",
                          marginStatus.color === 'emerald' && "bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700"
                        )}>
                          {item.marginPercentage.toFixed(1)}% {marginStatus.label}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground">
                        <div>
                          <span className="block">Cost</span>
                          <span className="font-medium text-foreground">${item.totalCost.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="block">Revenue</span>
                          <span className="font-medium text-foreground">${item.totalRevenue.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="block">Profit</span>
                          <span className={cn(
                            "font-medium",
                            item.margin >= 0 ? "text-green-600" : "text-red-600"
                          )}>
                            ${item.margin.toFixed(2)}
                          </span>
                        </div>
                        <div>
                          <span className="block">Qty</span>
                          <span className="font-medium text-foreground">{item.quantity}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="optimization" className="space-y-6 mt-6">
            {/* Optimization Suggestions */}
            <div className="space-y-4">
              <h4 className="font-medium text-emerald-800">Optimization Recommendations</h4>
              
              {negativeMarginItems.length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="font-medium text-red-800">Critical: Negative Margin Items</span>
                  </div>
                  <p className="text-sm text-red-700 mb-3">
                    {negativeMarginItems.length} items are selling at a loss. Consider:
                  </p>
                  <ul className="text-sm text-red-700 space-y-1">
                    <li>• Increase selling prices</li>
                    <li>• Negotiate better supplier costs</li>
                    <li>• Remove unprofitable items</li>
                  </ul>
                </div>
              )}

              {lowMarginItems.length > 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="h-4 w-4 text-amber-600" />
                    <span className="font-medium text-amber-800">Low Margin Items</span>
                  </div>
                  <p className="text-sm text-amber-700 mb-3">
                    {lowMarginItems.length} items are below target margin. Consider:
                  </p>
                  <ul className="text-sm text-amber-700 space-y-1">
                    <li>• Adjust pricing strategy</li>
                    <li>• Bundle with high-margin items</li>
                    <li>• Review cost structure</li>
                  </ul>
                </div>
              )}

              {breakdown.profitMargin >= targetMargin && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-800">Good Margin Performance</span>
                  </div>
                  <p className="text-sm text-green-700">
                    Overall margin is above target. Consider opportunities to:
                  </p>
                  <ul className="text-sm text-green-700 space-y-1 mt-2">
                    <li>• Maintain competitive pricing</li>
                    <li>• Invest in higher-margin products</li>
                    <li>• Expand successful product lines</li>
                  </ul>
                </div>
              )}
            </div>

            {/* Optimization Actions */}
            {onOptimizePricing && (
              <div className="flex justify-center">
                <Button
                  onClick={onOptimizePricing}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Target className="h-4 w-4 mr-2" />
                  Optimize Pricing
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};