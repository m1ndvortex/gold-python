import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Minus
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface StockItem {
  inventoryItemId: string;
  itemName: string;
  requestedQuantity: number;
  availableStock: number;
  reservedStock?: number;
  unitOfMeasure?: string;
  category?: string;
  lowStockThreshold?: number;
}

interface StockValidationResult {
  itemId: string;
  itemName: string;
  status: 'available' | 'insufficient' | 'out_of_stock' | 'low_stock_warning';
  requestedQuantity: number;
  availableQuantity: number;
  shortfall?: number;
  impactLevel: 'none' | 'low' | 'medium' | 'high';
  suggestions?: string[];
}

interface StockValidationProps {
  items: StockItem[];
  onValidationComplete?: (results: StockValidationResult[]) => void;
  onRefreshStock?: () => Promise<void>;
  realTimeValidation?: boolean;
  className?: string;
}

export const StockValidation: React.FC<StockValidationProps> = ({
  items,
  onValidationComplete,
  onRefreshStock,
  realTimeValidation = true,
  className = ''
}) => {
  const [validationResults, setValidationResults] = useState<StockValidationResult[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [lastValidated, setLastValidated] = useState<Date | null>(null);

  // Validate stock levels
  const validateStock = async () => {
    setIsValidating(true);
    
    try {
      const results: StockValidationResult[] = items.map(item => {
        const availableQuantity = item.availableStock - (item.reservedStock || 0);
        const shortfall = Math.max(0, item.requestedQuantity - availableQuantity);
        
        let status: StockValidationResult['status'] = 'available';
        let impactLevel: StockValidationResult['impactLevel'] = 'none';
        const suggestions: string[] = [];

        if (availableQuantity <= 0) {
          status = 'out_of_stock';
          impactLevel = 'high';
          suggestions.push('Item is out of stock');
          suggestions.push('Consider removing this item or finding alternatives');
        } else if (shortfall > 0) {
          status = 'insufficient';
          impactLevel = shortfall > availableQuantity * 0.5 ? 'high' : 'medium';
          suggestions.push(`Only ${availableQuantity} units available`);
          suggestions.push(`Reduce quantity by ${shortfall} units`);
        } else if (item.lowStockThreshold && availableQuantity <= item.lowStockThreshold) {
          status = 'low_stock_warning';
          impactLevel = 'low';
          suggestions.push('Stock level is below minimum threshold');
          suggestions.push('Consider restocking soon');
        }

        return {
          itemId: item.inventoryItemId,
          itemName: item.itemName,
          status,
          requestedQuantity: item.requestedQuantity,
          availableQuantity,
          shortfall: shortfall > 0 ? shortfall : undefined,
          impactLevel,
          suggestions: suggestions.length > 0 ? suggestions : undefined
        };
      });

      setValidationResults(results);
      setLastValidated(new Date());
      onValidationComplete?.(results);
    } finally {
      setIsValidating(false);
    }
  };

  // Auto-validate when items change
  useEffect(() => {
    if (realTimeValidation && items.length > 0) {
      validateStock();
    }
  }, [items, realTimeValidation]);

  // Get overall validation status
  const overallStatus = validationResults.length === 0 ? 'pending' :
    validationResults.some(r => r.status === 'out_of_stock') ? 'blocked' :
    validationResults.some(r => r.status === 'insufficient') ? 'warning' :
    validationResults.some(r => r.status === 'low_stock_warning') ? 'caution' : 'valid';

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'insufficient': return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      case 'out_of_stock': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'low_stock_warning': return <TrendingDown className="h-4 w-4 text-orange-600" />;
      default: return <Minus className="h-4 w-4 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-0 shadow-sm">Available</Badge>;
      case 'insufficient':
        return <Badge className="bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 border-0 shadow-sm">Insufficient</Badge>;
      case 'out_of_stock':
        return <Badge className="bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border-0 shadow-sm">Out of Stock</Badge>;
      case 'low_stock_warning':
        return <Badge className="bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 border-0 shadow-sm">Low Stock</Badge>;
      default:
        return <Badge className="bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 border-0 shadow-sm">Unknown</Badge>;
    }
  };

  const getOverallStatusColor = () => {
    switch (overallStatus) {
      case 'valid': return 'green';
      case 'caution': return 'orange';
      case 'warning': return 'amber';
      case 'blocked': return 'red';
      default: return 'slate';
    }
  };

  return (
    <Card className={cn("border-0 shadow-lg bg-gradient-to-br from-purple-50 to-violet-100/50", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg">
              <Package className="h-4 w-4 text-white" />
            </div>
            <span className="text-purple-800">Stock Validation</span>
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {lastValidated && (
              <span className="text-xs text-muted-foreground">
                Last checked: {lastValidated.toLocaleTimeString()}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={onRefreshStock || validateStock}
              disabled={isValidating}
              className="border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-400 transition-all duration-300"
            >
              <RefreshCw className={cn("h-3 w-3 mr-1", isValidating && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Overall Status */}
        <div className="flex items-center justify-between p-3 bg-white/50 border border-purple-200/50 rounded-lg">
          <div className="flex items-center gap-2">
            <div className={cn(
              "h-6 w-6 rounded-full flex items-center justify-center shadow-sm",
              overallStatus === 'valid' && "bg-gradient-to-br from-green-500 to-emerald-600",
              overallStatus === 'caution' && "bg-gradient-to-br from-orange-500 to-red-600",
              overallStatus === 'warning' && "bg-gradient-to-br from-amber-500 to-orange-600",
              overallStatus === 'blocked' && "bg-gradient-to-br from-red-500 to-rose-600",
              overallStatus === 'pending' && "bg-gradient-to-br from-slate-500 to-slate-600"
            )}>
              {overallStatus === 'valid' && <CheckCircle className="h-3 w-3 text-white" />}
              {overallStatus === 'caution' && <TrendingDown className="h-3 w-3 text-white" />}
              {overallStatus === 'warning' && <AlertTriangle className="h-3 w-3 text-white" />}
              {overallStatus === 'blocked' && <XCircle className="h-3 w-3 text-white" />}
              {overallStatus === 'pending' && <RefreshCw className="h-3 w-3 text-white" />}
            </div>
            <span className="font-medium">
              {overallStatus === 'valid' && 'All items available'}
              {overallStatus === 'caution' && 'Low stock warnings'}
              {overallStatus === 'warning' && 'Insufficient stock'}
              {overallStatus === 'blocked' && 'Items out of stock'}
              {overallStatus === 'pending' && 'Validating stock...'}
            </span>
          </div>
          
          <Badge className={cn(
            "border-0 shadow-sm",
            overallStatus === 'valid' && "bg-gradient-to-r from-green-100 to-emerald-100 text-green-700",
            overallStatus === 'caution' && "bg-gradient-to-r from-orange-100 to-red-100 text-orange-700",
            overallStatus === 'warning' && "bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700",
            overallStatus === 'blocked' && "bg-gradient-to-r from-red-100 to-rose-100 text-red-700",
            overallStatus === 'pending' && "bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700"
          )}>
            {validationResults.length} items checked
          </Badge>
        </div>

        {/* Critical Alerts */}
        {overallStatus === 'blocked' && (
          <Alert className="border-red-200 bg-red-50">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              Some items are out of stock. This invoice cannot be processed until stock issues are resolved.
            </AlertDescription>
          </Alert>
        )}

        {overallStatus === 'warning' && (
          <Alert className="border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-700">
              Insufficient stock for some items. Please review quantities or remove items.
            </AlertDescription>
          </Alert>
        )}

        {/* Item Details */}
        <div className="space-y-3">
          <h4 className="font-medium text-purple-800">Item Stock Status</h4>
          {validationResults.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              {isValidating ? 'Validating stock levels...' : 'No items to validate'}
            </div>
          ) : (
            <div className="space-y-2">
              {validationResults.map((result) => (
                <div key={result.itemId} className="p-3 bg-white/50 border border-purple-200/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(result.status)}
                      <span className="font-medium text-sm">{result.itemName}</span>
                    </div>
                    {getStatusBadge(result.status)}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-xs text-muted-foreground mb-2">
                    <div>
                      <span className="block">Requested</span>
                      <span className="font-medium text-foreground">{result.requestedQuantity}</span>
                    </div>
                    <div>
                      <span className="block">Available</span>
                      <span className={cn(
                        "font-medium",
                        result.availableQuantity >= result.requestedQuantity ? "text-green-600" : "text-red-600"
                      )}>
                        {result.availableQuantity}
                      </span>
                    </div>
                    {result.shortfall && (
                      <div>
                        <span className="block">Shortfall</span>
                        <span className="font-medium text-red-600">{result.shortfall}</span>
                      </div>
                    )}
                  </div>

                  {/* Stock Level Progress */}
                  <div className="mb-2">
                    <Progress 
                      value={Math.min(100, (result.availableQuantity / result.requestedQuantity) * 100)}
                      className="h-2"
                    />
                  </div>

                  {/* Suggestions */}
                  {result.suggestions && result.suggestions.length > 0 && (
                    <div className="space-y-1">
                      {result.suggestions.map((suggestion, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs">
                          <div className="h-1 w-1 rounded-full bg-purple-400" />
                          <span className="text-purple-700">{suggestion}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Real-time Validation Toggle */}
        <div className="flex items-center justify-between p-3 bg-purple-50/50 border border-purple-200/50 rounded-lg">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-800">Real-time Validation</span>
          </div>
          <Badge className={cn(
            "border-0 shadow-sm",
            realTimeValidation 
              ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-700"
              : "bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700"
          )}>
            {realTimeValidation ? 'Enabled' : 'Disabled'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};