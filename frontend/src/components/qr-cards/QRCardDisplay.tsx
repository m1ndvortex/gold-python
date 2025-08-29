import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { 
  QrCode, 
  Eye, 
  Download, 
  Share2, 
  Copy, 
  ExternalLink,
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  Package,
  Gem,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import type { QRInvoiceCard } from '../../services/qrCardApi';
import { useQRCodeImage } from '../../hooks/useQRCards';
import { toast } from '../ui/use-toast';

interface QRCardDisplayProps {
  card: QRInvoiceCard;
  showAnalytics?: boolean;
  onPreview?: () => void;
  onShare?: () => void;
  onDownload?: () => void;
  className?: string;
}

export const QRCardDisplay: React.FC<QRCardDisplayProps> = ({
  card,
  showAnalytics = true,
  onPreview,
  onShare,
  onDownload,
  className = ""
}) => {
  const [qrSize, setQrSize] = useState(200);
  const { data: qrImageBlob, isLoading: qrLoading } = useQRCodeImage(card.id, qrSize);

  const handleCopyUrl = async () => {
    try {
      const fullUrl = `${window.location.origin}/public/invoice-card/${card.id}`;
      await navigator.clipboard.writeText(fullUrl);
      toast({
        title: 'URL Copied',
        description: 'Card URL copied to clipboard',
      });
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy URL to clipboard',
        variant: 'destructive',
      });
    }
  };

  const handleCopyShortUrl = async () => {
    try {
      const shortUrl = `${window.location.origin}/public/card/${card.short_url}`;
      await navigator.clipboard.writeText(shortUrl);
      toast({
        title: 'Short URL Copied',
        description: 'Short URL copied to clipboard',
      });
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy short URL to clipboard',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadQR = async () => {
    if (qrImageBlob) {
      const url = URL.createObjectURL(qrImageBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qr-card-${card.card_data.invoice_number}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'QR Code Downloaded',
        description: 'QR code image saved successfully',
      });
    }
  };

  const getThemeClasses = (theme: string) => {
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'approved':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className={`border-0 shadow-lg hover:shadow-xl transition-all duration-300 ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <QrCode className="h-4 w-4 text-white" />
            </div>
            <span className="text-blue-800">QR Invoice Card</span>
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={`${getStatusColor(card.card_data.status.invoice_status)} border`}
            >
              {card.card_data.status.invoice_status}
            </Badge>
            
            {card.is_active ? (
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Active
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                <AlertCircle className="h-3 w-3 mr-1" />
                Inactive
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Card Preview */}
        <div className={`p-6 rounded-lg border-2 ${getThemeClasses(card.theme)}`}>
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{card.card_data.invoice_number}</h3>
                <div className="flex items-center gap-2 text-sm opacity-75">
                  {card.card_data.invoice_type === 'gold' ? (
                    <Gem className="h-4 w-4" />
                  ) : (
                    <Package className="h-4 w-4" />
                  )}
                  <span>{card.card_data.invoice_type === 'gold' ? 'Gold Invoice' : 'General Invoice'}</span>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-2xl font-bold">
                  ${card.card_data.amounts.total_amount.toFixed(2)}
                </div>
                <div className="text-sm opacity-75">
                  {card.card_data.amounts.currency}
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="font-medium">{card.card_data.customer_info.name}</span>
              </div>
              
              {card.card_data.customer_info.phone && (
                <div className="flex items-center gap-2 text-sm opacity-75">
                  <Phone className="h-4 w-4" />
                  <span>{card.card_data.customer_info.phone}</span>
                </div>
              )}
              
              {card.card_data.customer_info.email && (
                <div className="flex items-center gap-2 text-sm opacity-75">
                  <Mail className="h-4 w-4" />
                  <span>{card.card_data.customer_info.email}</span>
                </div>
              )}
            </div>

            {/* Gold Fields (if applicable) */}
            {card.card_data.invoice_type === 'gold' && card.card_data.gold_fields && (
              <div className="bg-amber-50/50 p-3 rounded-lg border border-amber-200/50">
                <div className="grid grid-cols-3 gap-3 text-sm">
                  {card.card_data.gold_fields.gold_sood && (
                    <div>
                      <div className="font-medium text-amber-800">سود (Profit)</div>
                      <div className="text-amber-700">${card.card_data.gold_fields.gold_sood.toFixed(2)}</div>
                    </div>
                  )}
                  
                  {card.card_data.gold_fields.gold_ojrat && (
                    <div>
                      <div className="font-medium text-amber-800">اجرت (Labor)</div>
                      <div className="text-amber-700">${card.card_data.gold_fields.gold_ojrat.toFixed(2)}</div>
                    </div>
                  )}
                  
                  {card.card_data.gold_fields.gold_maliyat && (
                    <div>
                      <div className="font-medium text-amber-800">مالیات (Tax)</div>
                      <div className="text-amber-700">${card.card_data.gold_fields.gold_maliyat.toFixed(2)}</div>
                    </div>
                  )}
                </div>
                
                {card.card_data.gold_fields.gold_total_weight && (
                  <div className="mt-2 pt-2 border-t border-amber-200/50">
                    <div className="text-sm">
                      <span className="font-medium text-amber-800">Total Weight: </span>
                      <span className="text-amber-700">{card.card_data.gold_fields.gold_total_weight.toFixed(3)}g</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Items Preview */}
            <div className="space-y-2">
              <div className="text-sm font-medium opacity-75">Items ({card.card_data.items.length})</div>
              <div className="space-y-1">
                {card.card_data.items.slice(0, 3).map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{item.name} × {item.quantity}</span>
                    <span>${item.total_price.toFixed(2)}</span>
                  </div>
                ))}
                {card.card_data.items.length > 3 && (
                  <div className="text-sm opacity-50">
                    +{card.card_data.items.length - 3} more items
                  </div>
                )}
              </div>
            </div>

            {/* Date */}
            <div className="flex items-center gap-2 text-sm opacity-75">
              <Calendar className="h-4 w-4" />
              <span>{format(new Date(card.card_data.dates.created_at), 'MMM dd, yyyy')}</span>
            </div>
          </div>
        </div>

        {/* QR Code */}
        <div className="flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg border-2 border-gray-200 shadow-sm">
            {qrLoading ? (
              <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : qrImageBlob ? (
              <img 
                src={URL.createObjectURL(qrImageBlob)} 
                alt="QR Code"
                className="w-48 h-48 rounded-lg"
              />
            ) : (
              <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                <QrCode className="h-12 w-12 text-gray-400" />
              </div>
            )}
          </div>
        </div>

        {/* Card Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-medium text-gray-700">Theme</div>
            <div className="capitalize">{card.theme}</div>
          </div>
          
          <div>
            <div className="font-medium text-gray-700">Views</div>
            <div>{card.view_count}</div>
          </div>
          
          <div>
            <div className="font-medium text-gray-700">Created</div>
            <div>{format(new Date(card.created_at), 'MMM dd, yyyy')}</div>
          </div>
          
          <div>
            <div className="font-medium text-gray-700">Last Viewed</div>
            <div>
              {card.last_viewed_at 
                ? format(new Date(card.last_viewed_at), 'MMM dd, yyyy')
                : 'Never'
              }
            </div>
          </div>
        </div>

        {showAnalytics && (
          <>
            <Separator />
            
            {/* Analytics Summary */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{card.view_count}</div>
                <div className="text-sm text-blue-700">Total Views</div>
              </div>
              
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {card.is_public ? 'Public' : 'Private'}
                </div>
                <div className="text-sm text-green-700">Access Level</div>
              </div>
              
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {card.expires_at ? 'Yes' : 'No'}
                </div>
                <div className="text-sm text-purple-700">Has Expiry</div>
              </div>
            </div>
          </>
        )}

        <Separator />

        {/* Action Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPreview}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            Preview
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadQR}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            QR Code
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyUrl}
            className="flex items-center gap-2"
          >
            <Copy className="h-4 w-4" />
            Copy URL
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onShare}
            className="flex items-center gap-2"
          >
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>

        {/* URLs */}
        <div className="space-y-2 text-xs">
          <div>
            <div className="font-medium text-gray-700">Full URL:</div>
            <div className="bg-gray-50 p-2 rounded border font-mono break-all">
              {window.location.origin}/public/invoice-card/{card.id}
            </div>
          </div>
          
          <div>
            <div className="font-medium text-gray-700">Short URL:</div>
            <div className="bg-gray-50 p-2 rounded border font-mono break-all">
              {window.location.origin}/public/card/{card.short_url}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};