import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { 
  Palette, 
  Eye, 
  Save, 
  RotateCcw, 
  Lock, 
  Unlock,
  Calendar,
  Sparkles,
  Settings
} from 'lucide-react';
import { format } from 'date-fns';
import { useQRCardThemes, useUpdateQRCard, useCreateQRCard } from '../../hooks/useQRCards';
import type { QRInvoiceCard, QRCardCreate, QRCardUpdate } from '../../services/qrCardApi';

const qrCardSchema = z.object({
  theme: z.string().min(1, 'Theme is required'),
  background_color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
  text_color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
  accent_color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
  is_public: z.boolean(),
  requires_password: z.boolean(),
  access_password: z.string().optional(),
  expires_at: z.string().optional(),
}).refine((data) => {
  if (data.requires_password && !data.access_password) {
    return false;
  }
  return true;
}, {
  message: 'Password is required when password protection is enabled',
  path: ['access_password']
});

type QRCardFormData = z.infer<typeof qrCardSchema>;

interface QRCardCustomizerProps {
  invoiceId?: string;
  existingCard?: QRInvoiceCard;
  onSuccess?: (card: QRInvoiceCard) => void;
  onCancel?: () => void;
  className?: string;
}

export const QRCardCustomizer: React.FC<QRCardCustomizerProps> = ({
  invoiceId,
  existingCard,
  onSuccess,
  onCancel,
  className = ""
}) => {
  const [previewMode, setPreviewMode] = useState(false);
  
  const { data: themes = [], isLoading: themesLoading } = useQRCardThemes();
  const createMutation = useCreateQRCard();
  const updateMutation = useUpdateQRCard();

  const form = useForm<QRCardFormData>({
    resolver: zodResolver(qrCardSchema),
    defaultValues: {
      theme: 'glass',
      background_color: '#ffffff',
      text_color: '#000000',
      accent_color: '#3B82F6',
      is_public: true,
      requires_password: false,
      access_password: '',
      expires_at: '',
    },
  });

  // Load existing card data
  useEffect(() => {
    if (existingCard) {
      form.reset({
        theme: existingCard.theme,
        background_color: existingCard.background_color,
        text_color: existingCard.text_color,
        accent_color: existingCard.accent_color,
        is_public: existingCard.is_public,
        requires_password: existingCard.requires_password,
        access_password: '',
        expires_at: existingCard.expires_at ? format(new Date(existingCard.expires_at), 'yyyy-MM-dd') : '',
      });
    }
  }, [existingCard, form]);

  // Watch form values for preview
  const watchedValues = form.watch();
  const selectedTheme = themes.find(t => t.name === watchedValues.theme);

  const handleThemeSelect = (themeName: string) => {
    const theme = themes.find(t => t.name === themeName);
    if (theme) {
      form.setValue('theme', themeName);
      form.setValue('background_color', theme.preview_colors.background);
      form.setValue('text_color', theme.preview_colors.text);
      form.setValue('accent_color', theme.preview_colors.accent);
    }
  };

  const onSubmit = (data: QRCardFormData) => {
    const cardData: QRCardCreate | QRCardUpdate = {
      theme: data.theme,
      background_color: data.background_color,
      text_color: data.text_color,
      accent_color: data.accent_color,
      is_public: data.is_public,
      requires_password: data.requires_password,
      access_password: data.requires_password ? data.access_password : undefined,
      expires_at: data.expires_at || undefined,
    };

    if (existingCard) {
      // Update existing card
      updateMutation.mutate(
        { cardId: existingCard.id, updates: cardData },
        {
          onSuccess: (updatedCard) => {
            onSuccess?.(updatedCard);
          },
        }
      );
    } else if (invoiceId) {
      // Create new card
      createMutation.mutate(
        { invoiceId, cardData },
        {
          onSuccess: (newCard) => {
            onSuccess?.(newCard);
          },
        }
      );
    }
  };

  const getThemePreviewClasses = (theme: string) => {
    switch (theme) {
      case 'glass':
        return 'bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg border-white/20';
      case 'modern':
        return 'bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200';
      case 'classic':
        return 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200';
      case 'gold':
        return 'bg-gradient-to-br from-amber-50 to-yellow-100 border-amber-200';
      case 'dark':
        return 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 text-white';
      default:
        return 'bg-gradient-to-br from-white to-gray-50 border-gray-200';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg">
              <Palette className="h-4 w-4 text-white" />
            </div>
            <span className="text-purple-800">
              {existingCard ? 'Customize QR Card' : 'Create QR Card'}
            </span>
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Theme Selection */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Card Theme</Label>
              
              {themesLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {themes.map((theme) => (
                    <div
                      key={theme.name}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                        watchedValues.theme === theme.name
                          ? 'border-purple-400 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleThemeSelect(theme.name)}
                    >
                      <div className={`h-12 rounded mb-2 ${getThemePreviewClasses(theme.name)}`} />
                      <div className="text-sm font-medium">{theme.display_name}</div>
                      <div className="text-xs text-gray-500">{theme.description}</div>
                    </div>
                  ))}
                </div>
              )}
              
              {form.formState.errors.theme && (
                <p className="text-sm text-red-500">{form.formState.errors.theme.message}</p>
              )}
            </div>

            <Separator />

            {/* Color Customization */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Color Customization</Label>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="background_color">Background Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="background_color"
                      type="color"
                      {...form.register('background_color')}
                      className="w-16 h-10 p-1 border rounded"
                    />
                    <Input
                      type="text"
                      {...form.register('background_color')}
                      placeholder="#ffffff"
                      className="flex-1"
                    />
                  </div>
                  {form.formState.errors.background_color && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.background_color.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="text_color">Text Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="text_color"
                      type="color"
                      {...form.register('text_color')}
                      className="w-16 h-10 p-1 border rounded"
                    />
                    <Input
                      type="text"
                      {...form.register('text_color')}
                      placeholder="#000000"
                      className="flex-1"
                    />
                  </div>
                  {form.formState.errors.text_color && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.text_color.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="accent_color">Accent Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="accent_color"
                      type="color"
                      {...form.register('accent_color')}
                      className="w-16 h-10 p-1 border rounded"
                    />
                    <Input
                      type="text"
                      {...form.register('accent_color')}
                      placeholder="#3B82F6"
                      className="flex-1"
                    />
                  </div>
                  {form.formState.errors.accent_color && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.accent_color.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Access Control */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Access Control</Label>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="is_public">Public Access</Label>
                    <p className="text-sm text-gray-500">
                      Allow anyone with the link to view the card
                    </p>
                  </div>
                  <Switch
                    id="is_public"
                    checked={form.watch('is_public')}
                    onCheckedChange={(checked) => form.setValue('is_public', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="requires_password">Password Protection</Label>
                    <p className="text-sm text-gray-500">
                      Require a password to view the card
                    </p>
                  </div>
                  <Switch
                    id="requires_password"
                    checked={form.watch('requires_password')}
                    onCheckedChange={(checked) => form.setValue('requires_password', checked)}
                  />
                </div>

                {form.watch('requires_password') && (
                  <div>
                    <Label htmlFor="access_password">Access Password</Label>
                    <Input
                      id="access_password"
                      type="password"
                      {...form.register('access_password')}
                      placeholder="Enter password"
                    />
                    {form.formState.errors.access_password && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.access_password.message}
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <Label htmlFor="expires_at">Expiration Date (Optional)</Label>
                  <Input
                    id="expires_at"
                    type="date"
                    {...form.register('expires_at')}
                    min={format(new Date(), 'yyyy-MM-dd')}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Leave empty for no expiration
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Preview */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Preview</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewMode(!previewMode)}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  {previewMode ? 'Hide Preview' : 'Show Preview'}
                </Button>
              </div>

              {previewMode && (
                <div className={`p-6 rounded-lg border-2 ${getThemePreviewClasses(watchedValues.theme)}`}>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold" style={{ color: watchedValues.text_color }}>
                          SAMPLE-2024-0001
                        </h3>
                        <div className="text-sm opacity-75" style={{ color: watchedValues.text_color }}>
                          Sample Invoice Preview
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold" style={{ color: watchedValues.accent_color }}>
                          $1,234.56
                        </div>
                        <div className="text-sm opacity-75" style={{ color: watchedValues.text_color }}>
                          USD
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2" style={{ color: watchedValues.text_color }}>
                      <div className="font-medium">Sample Customer</div>
                      <div className="text-sm opacity-75">+1 (555) 123-4567</div>
                    </div>

                    <div className="text-sm opacity-75" style={{ color: watchedValues.text_color }}>
                      This is how your card will appear to customers
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                Cancel
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => form.reset()}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>

                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {existingCard ? 'Update Card' : 'Create Card'}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};