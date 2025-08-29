import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { 
  QrCode, 
  Eye, 
  Settings, 
  Share2, 
  Download,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useInvoiceQRCard, useCreateQRCard } from '../../hooks/useQRCards';
import { QRCardDisplay } from './QRCardDisplay';
import { QRCardCustomizer } from './QRCardCustomizer';
import type { InvoiceWithDetails } from '../../services/invoiceApi';

interface QRCardIntegrationProps {
  invoice?: InvoiceWithDetails;
  invoiceId?: string;
  showPreview?: boolean;
  className?: string;
}

export const QRCardIntegration: React.FC<QRCardIntegrationProps> = ({
  invoice,
  invoiceId,
  showPreview = false,
  className = ""
}) => {
  const [showCustomizer, setShowCustomizer] = useState(false);
  
  const actualInvoiceId = invoice?.id || invoiceId;
  const { data: qrCard, isLoading, error } = useInvoiceQRCard(actualInvoiceId || '');
  const createMutation = useCreateQRCard();

  const handleCreateCard = () => {
    if (actualInvoiceId) {
      createMutation.mutate({
        invoiceId: actualInvoiceId,
        cardData: {
          theme: 'glass',
          is_public: true,
          requires_password: false
        }
      });
    }
  };

  const handlePreviewCard = () => {
    if (qrCard) {
      const url = `/public/invoice-card/${qrCard.id}`;
      window.open(url, '_blank');
    }
  };

  const handleShareCard = () => {
    if (qrCard) {
      const url = `${window.location.origin}/public/invoice-card/${qrCard.id}`;
      if (navigator.share) {
        navigator.share({
          title: `Invoice ${qrCard.card_data.invoice_number}`,
          text: `View invoice details for ${qrCard.card_data.customer_info.name}`,
          url: url,
        });
      } else {
        navigator.clipboard.writeText(url);
      }
    }
  };

  const handleDownloadQR = async () => {
    if (qrCard) {
      try {
        const response = await fetch(`/api/qr-cards/${qrCard.id}/qr-image?size=400`);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `qr-${qrCard.card_data.invoice_number}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Failed to download QR code:', error);
      }
    }
  };

  // Preview mode (before invoice creation)
  if (showPreview && !actualInvoiceId) {
    return (
      <Card className={`border-0 shadow-lg ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <QrCode className="h-4 w-4 text-white" />
            </div>
            <span className="text-blue-800">QR Code & Card</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="w-32 h-32 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg mx-auto flex items-center justify-center border-2 border-dashed border-blue-300">
            <div className="text-center">
              <QrCode className="h-8 w-8 text-blue-400 mx-auto mb-2" />
              <span className="text-blue-600 text-sm font-medium">QR Code</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              A beautiful invoice card with QR code will be generated for customer access
            </p>
            
            <div className="flex items-center justify-center gap-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <Sparkles className="h-3 w-3 mr-1" />
                Glass Theme
              </Badge>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Public Access
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <Card className={`border-0 shadow-lg ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <QrCode className="h-4 w-4 text-white" />
            </div>
            <span className="text-blue-800">QR Code & Card</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <div className="w-32 h-32 bg-gray-100 rounded-lg mx-auto mb-3 flex items-center justify-center animate-pulse">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
          <p className="text-sm text-gray-600">Loading QR card...</p>
        </CardContent>
      </Card>
    );
  }

  // Error state or no card exists
  if (error || !qrCard) {
    return (
      <Card className={`border-0 shadow-lg ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg">
              <QrCode className="h-4 w-4 text-white" />
            </div>
            <span className="text-orange-800">QR Code & Card</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="w-32 h-32 bg-orange-50 rounded-lg mx-auto flex items-center justify-center border-2 border-dashed border-orange-300">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 text-orange-400 mx-auto mb-2" />
              <span className="text-orange-600 text-sm font-medium">No Card</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              {error ? 'Failed to load QR card' : 'No QR card found for this invoice'}
            </p>
            
            <Button
              onClick={handleCreateCard}
              disabled={createMutation.isPending || !actualInvoiceId}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {createMutation.isPending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <QrCode className="h-4 w-4 mr-2" />
              )}
              Create QR Card
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Card exists - show full interface
  return (
    <Card className={`border-0 shadow-lg ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
              <QrCode className="h-4 w-4 text-white" />
            </div>
            <span className="text-green-800">QR Invoice Card</span>
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Active
            </Badge>
            <Badge variant="outline" className={`capitalize ${
              qrCard.theme === 'glass' ? 'bg-blue-100 text-blue-800' :
              qrCard.theme === 'gold' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {qrCard.theme}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Card Preview */}
        <div className="text-center">
          <div className="w-40 h-40 bg-white p-2 rounded-lg border-2 border-gray-200 shadow-sm mx-auto mb-4">
            <div className="w-full h-full bg-gray-100 rounded flex items-center justify-center">
              <QrCode className="h-16 w-16 text-gray-400" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold">{qrCard.card_data.invoice_number}</h3>
            <p className="text-sm text-gray-600">{qrCard.card_data.customer_info.name}</p>
            <p className="text-lg font-bold text-green-600">
              ${qrCard.card_data.amounts.total_amount.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-xl font-bold text-blue-600">{qrCard.view_count}</div>
            <div className="text-sm text-blue-700">Views</div>
          </div>
          
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="text-xl font-bold text-green-600">
              {qrCard.is_public ? 'Public' : 'Private'}
            </div>
            <div className="text-sm text-green-700">Access</div>
          </div>
          
          <div className="p-3 bg-purple-50 rounded-lg">
            <div className="text-xl font-bold text-purple-600">
              {qrCard.card_data.items.length}
            </div>
            <div className="text-sm text-purple-700">Items</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={handlePreviewCard}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            Preview
          </Button>
          
          <Button
            variant="outline"
            onClick={handleShareCard}
            className="flex items-center gap-2"
          >
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          
          <Button
            variant="outline"
            onClick={handleDownloadQR}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            QR Code
          </Button>
          
          <Dialog open={showCustomizer} onOpenChange={setShowCustomizer}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Customize
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Customize QR Card</DialogTitle>
              </DialogHeader>
              <QRCardCustomizer
                existingCard={qrCard}
                onSuccess={() => setShowCustomizer(false)}
                onCancel={() => setShowCustomizer(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* URLs */}
        <div className="space-y-2 text-xs">
          <div>
            <div className="font-medium text-gray-700">Card URL:</div>
            <div className="bg-gray-50 p-2 rounded border font-mono break-all text-blue-600">
              {window.location.origin}/public/invoice-card/{qrCard.id}
            </div>
          </div>
          
          <div>
            <div className="font-medium text-gray-700">Short URL:</div>
            <div className="bg-gray-50 p-2 rounded border font-mono break-all text-blue-600">
              {window.location.origin}/public/card/{qrCard.short_url}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};