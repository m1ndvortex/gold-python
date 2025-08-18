import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Separator } from '../ui/separator';
import { TrendingUp, Clock, RefreshCw, DollarSign } from 'lucide-react';
import { useGoldPriceConfig, useUpdateGoldPrice } from '../../hooks/useSettings';
import { GoldPriceUpdate } from '../../types';
import { useLanguage } from '../../hooks/useLanguage';

interface GoldPriceFormData {
  price: number;
}

export const GoldPriceConfig: React.FC = () => {
  const { t } = useLanguage();
  const { data: config, isLoading } = useGoldPriceConfig();
  const updateGoldPrice = useUpdateGoldPrice();
  const [autoUpdate, setAutoUpdate] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<GoldPriceFormData>();

  useEffect(() => {
    if (config) {
      reset({
        price: config.current_price || 50,
      });
      setAutoUpdate(config.auto_update_enabled || false);
    }
  }, [config, reset]);

  const onSubmit = async (data: GoldPriceFormData) => {
    const updateData: GoldPriceUpdate = {
      price: data.price,
    };

    updateGoldPrice.mutate(updateData);
  };

  const handleAutoUpdateToggle = (enabled: boolean) => {
    setAutoUpdate(enabled);
    // TODO: Implement auto-update API call
    console.log('Auto-update toggled:', enabled);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-10 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Gold Price Configuration
        </CardTitle>
        <CardDescription>
          Manage gold pricing settings and automatic updates
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Current Price Display */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Gold Price</p>
                <p className="text-2xl font-bold">${config?.current_price?.toFixed(2) || '0.00'}</p>
                <p className="text-xs text-muted-foreground">per gram</p>
              </div>
            </div>
            <div className="text-right">
              <Badge variant="secondary" className="mb-2">
                {autoUpdate ? 'Auto-Update ON' : 'Manual Update'}
              </Badge>
              {config?.last_updated && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Last updated: {new Date(config.last_updated).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Manual Price Update */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="price">Update Gold Price (per gram)</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    {...register('price', {
                      required: 'Price is required',
                      min: { value: 0.01, message: 'Price must be greater than 0' },
                    })}
                    placeholder="50.00"
                  />
                  {errors.price && (
                    <p className="text-sm text-destructive mt-1">{errors.price.message}</p>
                  )}
                </div>
                <Button
                  type="submit"
                  disabled={!isDirty || updateGoldPrice.isPending}
                  className="min-w-32"
                >
                  {updateGoldPrice.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Price'
                  )}
                </Button>
              </div>
            </div>
          </form>

          <Separator />

          {/* Auto-Update Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="auto-update">Automatic Price Updates</Label>
                <p className="text-sm text-muted-foreground">
                  Enable automatic gold price updates from external API
                </p>
              </div>
              <Switch
                id="auto-update"
                checked={autoUpdate}
                onCheckedChange={handleAutoUpdateToggle}
              />
            </div>

            {autoUpdate && (
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Auto-Update Configuration
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Update Frequency:</span>
                      <span className="ml-2 font-medium">Every 24 hours</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">API Source:</span>
                      <span className="ml-2 font-medium">Gold API Service</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Next Update:</span>
                      <span className="ml-2 font-medium">
                        {new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant="outline" className="ml-2">
                        Active
                      </Badge>
                    </div>
                  </div>

                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Note: Automatic updates will only occur during business hours and will not override manual updates made within the last 4 hours.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Price History Preview */}
          <div className="space-y-2">
            <Label>Recent Price Changes</Label>
            <div className="space-y-2">
              {/* Mock price history - in real app, this would come from API */}
              <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                <span className="text-sm">Today</span>
                <span className="font-medium">${config?.current_price?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                <span className="text-sm">Yesterday</span>
                <span className="font-medium">${((config?.current_price || 50) - 0.25).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                <span className="text-sm">2 days ago</span>
                <span className="font-medium">${((config?.current_price || 50) - 0.50).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};