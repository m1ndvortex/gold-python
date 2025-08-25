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
    <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-amber-50/30 hover:shadow-2xl transition-all duration-300">
      <CardHeader className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-b-2 border-amber-200/50">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-foreground">
              {t('settings.gold_price_config')}
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              {t('settings.gold_price_manage_desc')}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 bg-gradient-to-br from-amber-50/20 via-white to-orange-50/10">
        <div className="space-y-6">
          {/* Current Price Display */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200/50 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg shadow-md">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('settings.current_gold_price')}</p>
                <p className="text-2xl font-bold">${config?.current_price?.toFixed(2) || '0.00'}</p>
                <p className="text-xs text-muted-foreground">{t('settings.per_gram')}</p>
              </div>
            </div>
            <div className="text-right">
              <Badge variant="secondary" className="mb-2">
                {autoUpdate ? t('settings.auto_update_on') : t('settings.manual_update')}
              </Badge>
              {config?.last_updated && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {t('settings.last_updated')} {new Date(config.last_updated).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Manual Price Update */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="price">{t('settings.update_gold_price')}</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    {...register('price', {
                      required: t('settings.price_required'),
                      min: { value: 0.01, message: t('settings.price_greater_zero') },
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
                  className="min-w-32 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {updateGoldPrice.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      {t('settings.updating')}
                    </>
                  ) : (
                    t('settings.update_price')
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
                <Label htmlFor="auto-update">{t('settings.automatic_price_updates')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('settings.enable_auto_updates')}
                </p>
              </div>
              <Switch
                id="auto-update"
                checked={autoUpdate}
                onCheckedChange={handleAutoUpdateToggle}
              />
            </div>

            {autoUpdate && (
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200/50 shadow-sm">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      {t('settings.auto_update_config')}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">{t('settings.update_frequency')}</span>
                      <span className="ml-2 font-medium">{t('settings.every_24_hours')}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t('settings.api_source')}</span>
                      <span className="ml-2 font-medium">{t('settings.gold_api_service')}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t('settings.next_update')}</span>
                      <span className="ml-2 font-medium">
                        {new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t('common.status')}:</span>
                      <Badge variant="outline" className="ml-2">
                        {t('common.active')}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    {t('settings.auto_update_note')}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Price History Preview */}
          <div className="space-y-2">
            <Label>{t('settings.recent_price_changes')}</Label>
            <div className="space-y-2">
              {/* Mock price history - in real app, this would come from API */}
              <div className="flex items-center justify-between p-2 bg-gradient-to-r from-amber-50 to-orange-50 rounded border border-amber-200/30">
                <span className="text-sm">{t('settings.today')}</span>
                <span className="font-medium">${config?.current_price?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gradient-to-r from-amber-50/70 to-orange-50/70 rounded border border-amber-200/20">
                <span className="text-sm">{t('settings.yesterday')}</span>
                <span className="font-medium">${((config?.current_price || 50) - 0.25).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gradient-to-r from-amber-50/50 to-orange-50/50 rounded border border-amber-200/10">
                <span className="text-sm">{t('settings.days_ago_2')}</span>
                <span className="font-medium">${((config?.current_price || 50) - 0.50).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};