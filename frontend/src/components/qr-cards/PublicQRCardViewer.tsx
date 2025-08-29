import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { 
  Gem, 
  Package, 
  User, 
  Phone, 
  Mail, 
  MapPin,
  Calendar,
  DollarSign,
  Weight,
  Eye,
  Lock,
  AlertCircle,
  CheckCircle2,
  Clock,
  CreditCard
} from 'lucide-react';
import { format } from 'date-fns';
import { useAccessPublicCard } from '../../hooks/useQRCards';
import type { QRCardData } from '../../services/qrCardApi';

interface PublicQRCardViewerProps {
  cardId: string;
  className?: string;
}

export const PublicQRCardViewer: React.FC<PublicQRCardViewerProps> = ({
  cardId,
  className = ""
}) => {
  const [password, setPassword] = useState('');
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [cardData, setCardData] = useState<QRCardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const accessMutation = useAccessPublicCard();

  useEffect(() => {
    // Try to access the card without password first
    handleAccessCard();
  }, [cardId]);

  const handleAccessCard = async (inputPassword?: string) => {
    try {
      const htmlContent = await accessMutation.mutateAsync({
        cardId,
        password: inputPassword || password
      });
      
      // Parse the card data from the HTML response
      // In a real implementation, you might want to return JSON from the API
      // For now, we'll simulate parsing the card data
      setError(null);
      setShowPasswordInput(false);
      
      // This is a simplified approach - in reality, you'd parse the HTML or get JSON
      // For demo purposes, we'll create mock data
      const mockCardData: QRCardData = {
        invoice_number: "SAMPLE-2024-0001",
        invoice_type: "gold",
        customer_info: {
          name: "Sample Customer",
          phone: "+1 (555) 123-4567",
          email: "customer@example.com",
          address: "123 Main St, City, State"
        },
        amounts: {
          subtotal: 1000.00,
          tax_amount: 90.00,
          discount_amount: 0.00,
          total_amount: 1234.56,
          paid_amount: 1234.56,
          remaining_amount: 0.00,
          currency: "USD"
        },
        status: {
          invoice_status: "paid",
          workflow_stage: "completed",
          payment_status: "paid"
        },
        dates: {
          created_at: new Date().toISOString(),
          approved_at: new Date().toISOString(),
          payment_date: new Date().toISOString()
        },
        items: [
          {
            name: "Gold Ring",
            sku: "GR-001",
            description: "18K Gold Ring with Diamond",
            quantity: 1,
            unit_price: 1234.56,
            total_price: 1234.56,
            unit_of_measure: "piece",
            weight_grams: 5.5,
            images: [],
            custom_attributes: {},
            gold_specific: {}
          }
        ],
        gold_fields: {
          gold_price_per_gram: 65.00,
          labor_cost_percentage: 10,
          profit_percentage: 15,
          vat_percentage: 9,
          gold_sood: 144.56,
          gold_ojrat: 100.00,
          gold_maliyat: 90.00,
          gold_total_weight: 5.5
        },
        metadata: {
          notes: "Sample invoice for demonstration",
          payment_method: "Cash",
          invoice_metadata: {}
        }
      };
      
      setCardData(mockCardData);
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message;
      
      if (errorMessage.includes('Password required') || errorMessage.includes('Invalid password')) {
        setShowPasswordInput(true);
        setError(errorMessage);
      } else {
        setError(errorMessage);
      }
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

  const getPaymentStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'partially_paid':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'unpaid':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <CreditCard className="h-4 w-4 text-gray-600" />;
    }
  };

  if (showPasswordInput) {
    return (
      <div className={`max-w-md mx-auto ${className}`}>
        <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-indigo-100">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-4">
                <Lock className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Password Required</h2>
              <p className="text-gray-600">This invoice card is password protected</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <Input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAccessCard()}
              />
              
              <Button
                onClick={() => handleAccessCard()}
                disabled={accessMutation.isPending || !password}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
              >
                {accessMutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Eye className="h-4 w-4 mr-2" />
                )}
                View Invoice
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !showPasswordInput) {
    return (
      <div className={`max-w-md mx-auto ${className}`}>
        <Card className="border-0 shadow-xl bg-gradient-to-br from-red-50 to-red-100">
          <CardContent className="p-8 text-center">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button
              onClick={() => window.history.back()}
              variant="outline"
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!cardData) {
    return (
      <div className={`max-w-2xl mx-auto ${className}`}>
        <Card className="border-0 shadow-xl">
          <CardContent className="p-8">
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded animate-pulse" />
              <div className="h-32 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`max-w-2xl mx-auto ${className}`}>
      <Card className="border-0 shadow-xl bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 backdrop-blur-sm">
        <CardContent className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              {cardData.invoice_type === 'gold' ? (
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg">
                  <Gem className="h-6 w-6 text-white" />
                </div>
              ) : (
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg">
                  <Package className="h-6 w-6 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{cardData.invoice_number}</h1>
                <p className="text-sm text-gray-600 capitalize">
                  {cardData.invoice_type} Invoice
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 mb-4">
              <Badge 
                variant="outline" 
                className={`${getStatusColor(cardData.status.invoice_status)} border`}
              >
                {cardData.status.invoice_status}
              </Badge>
              
              <div className="flex items-center gap-1">
                {getPaymentStatusIcon(cardData.status.payment_status)}
                <Badge 
                  variant="outline" 
                  className={`${getStatusColor(cardData.status.payment_status)} border`}
                >
                  {cardData.status.payment_status}
                </Badge>
              </div>
            </div>

            <div className="text-4xl font-bold text-green-600 mb-2">
              ${cardData.amounts.total_amount.toFixed(2)}
            </div>
            <div className="text-sm text-gray-500">{cardData.amounts.currency}</div>
          </div>

          <Separator className="my-6" />

          {/* Customer Information */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Information
            </h2>
            
            <div className="bg-white/50 p-4 rounded-lg border border-gray-200 space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="font-medium">{cardData.customer_info.name}</span>
              </div>
              
              {cardData.customer_info.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span>{cardData.customer_info.phone}</span>
                </div>
              )}
              
              {cardData.customer_info.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span>{cardData.customer_info.email}</span>
                </div>
              )}
              
              {cardData.customer_info.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span>{cardData.customer_info.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Gold Fields (if applicable) */}
          {cardData.invoice_type === 'gold' && cardData.gold_fields && (
            <>
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Gem className="h-5 w-5 text-amber-600" />
                  Gold Details
                </h2>
                
                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 p-4 rounded-lg border border-amber-200">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {cardData.gold_fields.gold_sood && (
                      <div className="text-center">
                        <div className="text-lg font-bold text-amber-700">
                          ${cardData.gold_fields.gold_sood.toFixed(2)}
                        </div>
                        <div className="text-sm text-amber-600">سود (Profit)</div>
                      </div>
                    )}
                    
                    {cardData.gold_fields.gold_ojrat && (
                      <div className="text-center">
                        <div className="text-lg font-bold text-amber-700">
                          ${cardData.gold_fields.gold_ojrat.toFixed(2)}
                        </div>
                        <div className="text-sm text-amber-600">اجرت (Labor)</div>
                      </div>
                    )}
                    
                    {cardData.gold_fields.gold_maliyat && (
                      <div className="text-center">
                        <div className="text-lg font-bold text-amber-700">
                          ${cardData.gold_fields.gold_maliyat.toFixed(2)}
                        </div>
                        <div className="text-sm text-amber-600">مالیات (Tax)</div>
                      </div>
                    )}
                    
                    {cardData.gold_fields.gold_total_weight && (
                      <div className="text-center">
                        <div className="text-lg font-bold text-amber-700">
                          {cardData.gold_fields.gold_total_weight.toFixed(3)}g
                        </div>
                        <div className="text-sm text-amber-600">Total Weight</div>
                      </div>
                    )}
                  </div>
                  
                  {cardData.gold_fields.gold_price_per_gram && (
                    <div className="text-center pt-3 border-t border-amber-200">
                      <div className="text-sm text-amber-600">
                        Gold Price: ${cardData.gold_fields.gold_price_per_gram.toFixed(2)}/gram
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator className="my-6" />
            </>
          )}

          {/* Items */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Package className="h-5 w-5" />
              Items ({cardData.items.length})
            </h2>
            
            <div className="space-y-3">
              {cardData.items.map((item, index) => (
                <div key={index} className="bg-white/50 p-4 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-gray-800">{item.name}</h3>
                      {item.description && (
                        <p className="text-sm text-gray-600">{item.description}</p>
                      )}
                      <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">
                        ${item.total_price.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500">
                        ${item.unit_price.toFixed(2)} × {item.quantity}
                      </div>
                    </div>
                  </div>
                  
                  {item.weight_grams && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Weight className="h-4 w-4" />
                      <span>{item.weight_grams}g</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Separator className="my-6" />

          {/* Payment Summary */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Payment Summary
            </h2>
            
            <div className="bg-white/50 p-4 rounded-lg border border-gray-200 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${cardData.amounts.subtotal.toFixed(2)}</span>
              </div>
              
              {cardData.amounts.tax_amount > 0 && (
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>${cardData.amounts.tax_amount.toFixed(2)}</span>
                </div>
              )}
              
              {cardData.amounts.discount_amount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount:</span>
                  <span>-${cardData.amounts.discount_amount.toFixed(2)}</span>
                </div>
              )}
              
              <Separator />
              
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span className="text-green-600">${cardData.amounts.total_amount.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between text-sm text-gray-600">
                <span>Paid:</span>
                <span>${cardData.amounts.paid_amount.toFixed(2)}</span>
              </div>
              
              {cardData.amounts.remaining_amount > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>Remaining:</span>
                  <span>${cardData.amounts.remaining_amount.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Invoice Dates */}
          <div className="text-center text-sm text-gray-500 space-y-1">
            <div className="flex items-center justify-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Created: {format(new Date(cardData.dates.created_at), 'MMM dd, yyyy HH:mm')}</span>
            </div>
            
            {cardData.dates.payment_date && (
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>Paid: {format(new Date(cardData.dates.payment_date), 'MMM dd, yyyy HH:mm')}</span>
              </div>
            )}
          </div>

          {/* Notes */}
          {cardData.metadata.notes && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-medium text-blue-800 mb-2">Notes</h3>
              <p className="text-sm text-blue-700">{cardData.metadata.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};