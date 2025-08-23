import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import { Slider } from '../ui/slider';
import { ShoppingCart, TrendingUp, Target, DollarSign, ArrowRight, Lightbulb } from 'lucide-react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface CrossSellingOpportunity {
  primary_category_id: string;
  primary_category_name: string;
  recommended_category_id: string;
  recommended_category_name: string;
  confidence_score: number;
  lift_ratio: number;
  support: number;
  expected_revenue_increase: number;
}

interface CrossSellingAnalyzerProps {
  startDate?: Date;
  endDate?: Date;
  onOpportunitySelect?: (opportunity: CrossSellingOpportunity) => void;
}

const CrossSellingAnalyzer: React.FC<CrossSellingAnalyzerProps> = ({
  startDate,
  endDate,
  onOpportunitySelect
}) => {
  const [opportunities, setOpportunities] = useState<CrossSellingOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [minSupport, setMinSupport] = useState<number>(0.01);
  const [minConfidence, setMinConfidence] = useState<number>(0.1);
  const [sortBy, setSortBy] = useState<string>('confidence');

  useEffect(() => {
    fetchCrossSellingOpportunities();
  }, [startDate, endDate, minSupport, minConfidence]);

  const fetchCrossSellingOpportunities = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate.toISOString());
      if (endDate) params.append('end_date', endDate.toISOString());
      params.append('min_support', minSupport.toString());
      params.append('min_confidence', minConfidence.toString());

      const response = await fetch(`/api/category-intelligence/cross-selling?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch cross-selling opportunities');
      }

      const data = await response.json();
      setOpportunities(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence > 0.5) return 'bg-green-100 text-green-800 border-green-200';
    if (confidence > 0.3) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (confidence > 0.1) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence > 0.5) return 'High Confidence';
    if (confidence > 0.3) return 'Medium Confidence';
    if (confidence > 0.1) return 'Low Confidence';
    return 'Very Low';
  };

  const getLiftColor = (lift: number) => {
    if (lift > 2) return 'text-green-600';
    if (lift > 1.5) return 'text-yellow-600';
    if (lift > 1) return 'text-blue-600';
    return 'text-gray-600';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const sortedOpportunities = [...opportunities].sort((a, b) => {
    switch (sortBy) {
      case 'confidence':
        return b.confidence_score - a.confidence_score;
      case 'lift':
        return b.lift_ratio - a.lift_ratio;
      case 'support':
        return b.support - a.support;
      case 'revenue':
        return b.expected_revenue_increase - a.expected_revenue_increase;
      default:
        return 0;
    }
  });

  const prepareScatterData = () => {
    return opportunities.map((opp, index) => ({
      x: opp.confidence_score,
      y: opp.lift_ratio,
      z: opp.expected_revenue_increase,
      name: `${opp.primary_category_name} → ${opp.recommended_category_name}`,
      support: opp.support,
      index
    }));
  };

  const scatterData = prepareScatterData();

  const opportunitySummary = {
    totalOpportunities: opportunities.length,
    highConfidence: opportunities.filter(o => o.confidence_score > 0.3).length,
    highLift: opportunities.filter(o => o.lift_ratio > 1.5).length,
    totalPotentialRevenue: opportunities.reduce((sum, o) => sum + o.expected_revenue_increase, 0)
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cross-Selling Analyzer</CardTitle>
          <CardDescription>Analyzing cross-selling opportunities...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cross-Selling Analyzer</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={fetchCrossSellingOpportunities} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Lightbulb className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Opportunities</p>
                <p className="text-2xl font-bold">{opportunitySummary.totalOpportunities}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">High Confidence</p>
                <p className="text-2xl font-bold text-green-600">{opportunitySummary.highConfidence}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">High Lift</p>
                <p className="text-2xl font-bold text-purple-600">{opportunitySummary.highLift}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Potential Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(opportunitySummary.totalPotentialRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ShoppingCart className="h-5 w-5" />
            <span>Cross-Selling Analysis Controls</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Minimum Support: {formatPercentage(minSupport)}
              </label>
              <Slider
                value={[minSupport]}
                onValueChange={(value) => setMinSupport(value[0])}
                min={0.005}
                max={0.1}
                step={0.005}
                className="w-full"
              />
              <p className="text-xs text-gray-500">
                How often categories appear together
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Minimum Confidence: {formatPercentage(minConfidence)}
              </label>
              <Slider
                value={[minConfidence]}
                onValueChange={(value) => setMinConfidence(value[0])}
                min={0.05}
                max={0.8}
                step={0.05}
                className="w-full"
              />
              <p className="text-xs text-gray-500">
                Probability of recommendation given primary category
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Sort By</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="confidence">Confidence Score</SelectItem>
                  <SelectItem value="lift">Lift Ratio</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                  <SelectItem value="revenue">Expected Revenue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Opportunity Visualization</CardTitle>
          <CardDescription>
            Confidence vs Lift Ratio (bubble size = expected revenue)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart data={scatterData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="x" 
                name="Confidence Score"
                tickFormatter={(value) => formatPercentage(value)}
              />
              <YAxis 
                dataKey="y" 
                name="Lift Ratio"
                tickFormatter={(value) => value.toFixed(1)}
              />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'Confidence Score') return [formatPercentage(value as number), name];
                  if (name === 'Lift Ratio') return [(value as number).toFixed(2), name];
                  return [value, name];
                }}
                labelFormatter={(label, payload) => {
                  if (payload && payload[0]) {
                    const data = payload[0].payload;
                    return `${data.name} (Revenue: ${formatCurrency(data.z)})`;
                  }
                  return label;
                }}
              />
              <Scatter dataKey="y" fill="#3b82f6">
                {scatterData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.x > 0.3 ? '#10b981' : entry.x > 0.1 ? '#f59e0b' : '#3b82f6'}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Opportunities List */}
      <Card>
        <CardHeader>
          <CardTitle>Cross-Selling Opportunities</CardTitle>
          <CardDescription>
            Product bundle recommendations with market basket analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedOpportunities.map((opportunity, index) => (
              <div
                key={`${opportunity.primary_category_id}-${opportunity.recommended_category_id}`}
                className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onOpportunitySelect?.(opportunity)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-blue-600">
                        {opportunity.primary_category_name}
                      </span>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                      <span className="font-semibold text-green-600">
                        {opportunity.recommended_category_name}
                      </span>
                    </div>
                    <Badge className={getConfidenceColor(opportunity.confidence_score)}>
                      {getConfidenceLabel(opportunity.confidence_score)}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Expected Revenue</p>
                    <p className="font-semibold text-green-600">
                      {formatCurrency(opportunity.expected_revenue_increase)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Confidence Score</p>
                    <p className="font-semibold">{formatPercentage(opportunity.confidence_score)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Lift Ratio</p>
                    <p className={`font-semibold ${getLiftColor(opportunity.lift_ratio)}`}>
                      {opportunity.lift_ratio.toFixed(2)}x
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Support</p>
                    <p className="font-semibold">{formatPercentage(opportunity.support)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Recommendation</p>
                    <p className="font-semibold text-blue-600">
                      {opportunity.lift_ratio > 2 ? 'Strong' : 
                       opportunity.lift_ratio > 1.5 ? 'Good' : 
                       opportunity.lift_ratio > 1 ? 'Moderate' : 'Weak'}
                    </p>
                  </div>
                </div>

                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Insight:</strong> Customers who buy {opportunity.primary_category_name} are{' '}
                    <strong>{opportunity.lift_ratio.toFixed(1)}x more likely</strong> to also buy{' '}
                    {opportunity.recommended_category_name}. This combination appears in{' '}
                    <strong>{formatPercentage(opportunity.support)}</strong> of all transactions.
                  </p>
                </div>
              </div>
            ))}

            {sortedOpportunities.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Lightbulb className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No cross-selling opportunities found with current criteria.</p>
                <p className="text-sm mt-2">Try adjusting the support and confidence thresholds.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CrossSellingAnalyzer;