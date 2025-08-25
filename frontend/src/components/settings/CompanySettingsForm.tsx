import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Separator } from '../ui/separator';
import { Upload, Building2, DollarSign, Percent } from 'lucide-react';
import { useCompanySettings, useUpdateCompanySettings } from '../../hooks/useSettings';
import { CompanySettingsUpdate } from '../../types';
import { useLanguage } from '../../hooks/useLanguage';

interface CompanySettingsFormData {
  company_name: string;
  company_address: string;
  default_gold_price: number;
  default_labor_percentage: number;
  default_profit_percentage: number;
  default_vat_percentage: number;
}

export const CompanySettingsForm: React.FC = () => {
  const { t } = useLanguage();
  const { data: settings, isLoading } = useCompanySettings();
  const updateSettings = useUpdateCompanySettings();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<CompanySettingsFormData>();

  useEffect(() => {
    if (settings) {
      reset({
        company_name: settings.company_name || '',
        company_address: settings.company_address || '',
        default_gold_price: settings.default_gold_price || 50,
        default_labor_percentage: settings.default_labor_percentage || 10,
        default_profit_percentage: settings.default_profit_percentage || 15,
        default_vat_percentage: settings.default_vat_percentage || 5,
      });
      
      if (settings.company_logo_url) {
        setLogoPreview(settings.company_logo_url);
      }
    }
  }, [settings, reset]);

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: CompanySettingsFormData) => {
    const updateData: CompanySettingsUpdate = {
      ...data,
    };

    // TODO: Handle logo upload to server and get URL
    if (logoFile) {
      // In a real implementation, you would upload the file to a server
      // and get back a URL to store in company_logo_url
      console.log('Logo file to upload:', logoFile);
    }

    updateSettings.mutate(updateData);
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
    <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-blue-50/30 hover:shadow-2xl transition-all duration-300">
      <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border-b-2 border-blue-200/50">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-foreground">
              {t('settings.company_information')}
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              {t('settings.company_details_desc')}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 bg-gradient-to-br from-blue-50/20 via-white to-indigo-50/10">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Company Logo */}
          <div className="space-y-2">
            <Label htmlFor="logo">{t('settings.company_logo')}</Label>
            <div className="flex items-center gap-4">
              {logoPreview && (
                <div className="w-20 h-20 border rounded-lg overflow-hidden bg-muted">
                  <img
                    src={logoPreview}
                    alt={t('settings.company_logo')}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1">
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="cursor-pointer"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  {t('settings.upload_logo_desc')}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Company Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">{t('settings.company_name')}</Label>
              <Input
                id="company_name"
                {...register('company_name', {
                  required: t('settings.company_name_required'),
                })}
                placeholder={t('settings.enter_company_name')}
              />
              {errors.company_name && (
                <p className="text-sm text-destructive">{errors.company_name.message}</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="company_address">{t('settings.company_address')}</Label>
              <Textarea
                id="company_address"
                {...register('company_address')}
                placeholder={t('settings.enter_company_address')}
                rows={3}
              />
            </div>
          </div>

          <Separator />

          {/* Default Pricing Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <h3 className="text-lg font-medium">{t('settings.default_pricing_settings')}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="default_gold_price">{t('settings.gold_price_per_gram')}</Label>
                <Input
                  id="default_gold_price"
                  type="number"
                  step="0.01"
                  {...register('default_gold_price', {
                    required: t('settings.gold_price_required'),
                    min: { value: 0, message: t('settings.price_positive') },
                  })}
                  placeholder="50.00"
                />
                {errors.default_gold_price && (
                  <p className="text-sm text-destructive">{errors.default_gold_price.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="default_labor_percentage">{t('settings.labor_cost_percent')}</Label>
                <div className="relative">
                  <Input
                    id="default_labor_percentage"
                    type="number"
                    step="0.1"
                    {...register('default_labor_percentage', {
                      required: t('settings.labor_required'),
                      min: { value: 0, message: t('settings.percentage_positive') },
                      max: { value: 100, message: t('settings.percentage_max') },
                    })}
                    placeholder="10.0"
                  />
                  <Percent className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
                {errors.default_labor_percentage && (
                  <p className="text-sm text-destructive">{errors.default_labor_percentage.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="default_profit_percentage">{t('settings.profit_margin_percent')}</Label>
                <div className="relative">
                  <Input
                    id="default_profit_percentage"
                    type="number"
                    step="0.1"
                    {...register('default_profit_percentage', {
                      required: t('settings.profit_required'),
                      min: { value: 0, message: t('settings.percentage_positive') },
                      max: { value: 100, message: t('settings.percentage_max') },
                    })}
                    placeholder="15.0"
                  />
                  <Percent className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
                {errors.default_profit_percentage && (
                  <p className="text-sm text-destructive">{errors.default_profit_percentage.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="default_vat_percentage">{t('settings.vat_rate_percent')}</Label>
                <div className="relative">
                  <Input
                    id="default_vat_percentage"
                    type="number"
                    step="0.1"
                    {...register('default_vat_percentage', {
                      required: t('settings.vat_required'),
                      min: { value: 0, message: t('settings.percentage_positive') },
                      max: { value: 100, message: t('settings.percentage_max') },
                    })}
                    placeholder="5.0"
                  />
                  <Percent className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
                {errors.default_vat_percentage && (
                  <p className="text-sm text-destructive">{errors.default_vat_percentage.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={!isDirty || updateSettings.isPending}
              className="min-w-32 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {updateSettings.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  {t('settings.saving')}
                </div>
              ) : (
                t('settings.save_changes')
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};