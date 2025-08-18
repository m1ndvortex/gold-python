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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Company Information
        </CardTitle>
        <CardDescription>
          Configure your company details and default business settings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Company Logo */}
          <div className="space-y-2">
            <Label htmlFor="logo">Company Logo</Label>
            <div className="flex items-center gap-4">
              {logoPreview && (
                <div className="w-20 h-20 border rounded-lg overflow-hidden bg-muted">
                  <img
                    src={logoPreview}
                    alt="Company Logo"
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
                  Upload a logo image (PNG, JPG, or SVG)
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Company Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name</Label>
              <Input
                id="company_name"
                {...register('company_name', {
                  required: 'Company name is required',
                })}
                placeholder="Enter company name"
              />
              {errors.company_name && (
                <p className="text-sm text-destructive">{errors.company_name.message}</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="company_address">Company Address</Label>
              <Textarea
                id="company_address"
                {...register('company_address')}
                placeholder="Enter company address"
                rows={3}
              />
            </div>
          </div>

          <Separator />

          {/* Default Pricing Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <h3 className="text-lg font-medium">Default Pricing Settings</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="default_gold_price">Gold Price (per gram)</Label>
                <Input
                  id="default_gold_price"
                  type="number"
                  step="0.01"
                  {...register('default_gold_price', {
                    required: 'Gold price is required',
                    min: { value: 0, message: 'Price must be positive' },
                  })}
                  placeholder="50.00"
                />
                {errors.default_gold_price && (
                  <p className="text-sm text-destructive">{errors.default_gold_price.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="default_labor_percentage">Labor Cost (%)</Label>
                <div className="relative">
                  <Input
                    id="default_labor_percentage"
                    type="number"
                    step="0.1"
                    {...register('default_labor_percentage', {
                      required: 'Labor percentage is required',
                      min: { value: 0, message: 'Percentage must be positive' },
                      max: { value: 100, message: 'Percentage cannot exceed 100' },
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
                <Label htmlFor="default_profit_percentage">Profit Margin (%)</Label>
                <div className="relative">
                  <Input
                    id="default_profit_percentage"
                    type="number"
                    step="0.1"
                    {...register('default_profit_percentage', {
                      required: 'Profit percentage is required',
                      min: { value: 0, message: 'Percentage must be positive' },
                      max: { value: 100, message: 'Percentage cannot exceed 100' },
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
                <Label htmlFor="default_vat_percentage">VAT Rate (%)</Label>
                <div className="relative">
                  <Input
                    id="default_vat_percentage"
                    type="number"
                    step="0.1"
                    {...register('default_vat_percentage', {
                      required: 'VAT percentage is required',
                      min: { value: 0, message: 'Percentage must be positive' },
                      max: { value: 100, message: 'Percentage cannot exceed 100' },
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
              className="min-w-32"
            >
              {updateSettings.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};