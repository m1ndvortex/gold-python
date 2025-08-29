import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { 
  QrCode, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  RotateCcw,
  Download,
  Share2,
  BarChart3,
  Calendar,
  Users,
  TrendingUp,
  Settings,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { useQRCards, useDeleteQRCard, useRegenerateQRCard } from '../../hooks/useQRCards';
import { QRCardDisplay } from './QRCardDisplay';
import { QRCardCustomizer } from './QRCardCustomizer';
import { QRCardAnalytics } from './QRCardAnalytics';
import type { QRInvoiceCard, QRCardFilters } from '../../services/qrCardApi';

interface QRCardManagerProps {
  className?: string;
}

export const QRCardManager: React.FC<QRCardManagerProps> = ({
  className = ""
}) => {
  const [filters, setFilters] = useState<QRCardFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCard, setSelectedCard] = useState<QRInvoiceCard | null>(null);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [page, setPage] = useState(0);
  const limit = 12;

  const { data: cardsResponse, isLoading, error } = useQRCards(filters, page * limit, limit);
  const deleteMutation = useDeleteQRCard();
  const regenerateMutation = useRegenerateQRCard();

  const cards = cardsResponse?.items || [];
  const totalCards = cardsResponse?.total || 0;
  const totalPages = Math.ceil(totalCards / limit);

  const handleFilterChange = (key: keyof QRCardFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
    setPage(0); // Reset to first page
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    // In a real implementation, you might want to add search to the API
    setPage(0);
  };

  const handleDeleteCard = async (cardId: string) => {
    if (window.confirm('Are you sure you want to delete this QR card? This action cannot be undone.')) {
      await deleteMutation.mutateAsync(cardId);
    }
  };

  const handleRegenerateCard = async (cardId: string) => {
    if (window.confirm('Are you sure you want to regenerate this QR card? The old QR code and URL will no longer work.')) {
      await regenerateMutation.mutateAsync(cardId);
    }
  };

  const handlePreviewCard = (card: QRInvoiceCard) => {
    const url = `/public/invoice-card/${card.id}`;
    window.open(url, '_blank');
  };

  const handleShareCard = (card: QRInvoiceCard) => {
    const url = `${window.location.origin}/public/invoice-card/${card.id}`;
    if (navigator.share) {
      navigator.share({
        title: `Invoice ${card.card_data.invoice_number}`,
        text: `View invoice details for ${card.card_data.customer_info.name}`,
        url: url,
      });
    } else {
      navigator.clipboard.writeText(url);
      // Toast notification would be handled by the hook
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

  const getThemeColor = (theme: string) => {
    switch (theme) {
      case 'glass':
        return 'bg-blue-100 text-blue-800';
      case 'modern':
        return 'bg-green-100 text-green-800';
      case 'classic':
        return 'bg-gray-100 text-gray-800';
      case 'gold':
        return 'bg-yellow-100 text-yellow-800';
      case 'dark':
        return 'bg-slate-100 text-slate-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-blue-100/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg">
              <QrCode className="h-4 w-4 text-white" />
            </div>
            <span className="text-indigo-800">QR Card Manager</span>
          </CardTitle>
        </CardHeader>

        <CardContent>
          {/* Filters and Search */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search cards..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="invoice_type">Invoice Type</Label>
              <Select
                value={filters.invoice_type || ''}
                onValueChange={(value) => handleFilterChange('invoice_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="theme">Theme</Label>
              <Select
                value={filters.theme || ''}
                onValueChange={(value) => handleFilterChange('theme', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All themes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All themes</SelectItem>
                  <SelectItem value="glass">Glass</SelectItem>
                  <SelectItem value="modern">Modern</SelectItem>
                  <SelectItem value="classic">Classic</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="is_active">Status</Label>
              <Select
                value={filters.is_active?.toString() || ''}
                onValueChange={(value) => handleFilterChange('is_active', value === '' ? undefined : value === 'true')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Summary Stats */}
          {cardsResponse && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-white/50 rounded-lg border border-indigo-200">
                <div className="text-2xl font-bold text-indigo-600">{totalCards}</div>
                <div className="text-sm text-indigo-700">Total Cards</div>
              </div>
              
              <div className="p-3 bg-white/50 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-600">
                  {cards.filter(c => c.is_active).length}
                </div>
                <div className="text-sm text-green-700">Active Cards</div>
              </div>
              
              <div className="p-3 bg-white/50 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">
                  {cards.reduce((sum, c) => sum + c.view_count, 0)}
                </div>
                <div className="text-sm text-blue-700">Total Views</div>
              </div>
              
              <div className="p-3 bg-white/50 rounded-lg border border-purple-200">
                <div className="text-2xl font-bold text-purple-600">
                  {cards.filter(c => c.card_data.invoice_type === 'gold').length}
                </div>
                <div className="text-sm text-purple-700">Gold Cards</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="h-6 bg-gray-200 rounded animate-pulse" />
                  <div className="h-32 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6 text-center">
            <p className="text-red-500">Failed to load QR cards</p>
          </CardContent>
        </Card>
      ) : cards.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6 text-center">
            <QrCode className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No QR cards found</p>
            <p className="text-sm text-gray-400">
              QR cards are automatically created when invoices are generated
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => (
            <Card key={card.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={getThemeColor(card.theme)}
                    >
                      {card.theme}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={getStatusColor(card.card_data.status.invoice_status)}
                    >
                      {card.card_data.status.invoice_status}
                    </Badge>
                  </div>
                  
                  {card.is_active ? (
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                      Inactive
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Card Info */}
                <div>
                  <h3 className="font-semibold text-lg">{card.card_data.invoice_number}</h3>
                  <p className="text-sm text-gray-600">{card.card_data.customer_info.name}</p>
                  <p className="text-lg font-bold text-green-600">
                    ${card.card_data.amounts.total_amount.toFixed(2)}
                  </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div>
                    <div className="font-semibold">{card.view_count}</div>
                    <div className="text-gray-500">Views</div>
                  </div>
                  <div>
                    <div className="font-semibold">{card.card_data.items.length}</div>
                    <div className="text-gray-500">Items</div>
                  </div>
                  <div>
                    <div className="font-semibold">
                      {format(new Date(card.created_at), 'MMM dd')}
                    </div>
                    <div className="text-gray-500">Created</div>
                  </div>
                </div>

                <Separator />

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePreviewCard(card)}
                    className="flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Preview
                  </Button>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <BarChart3 className="h-4 w-4" />
                        Analytics
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Card Analytics - {card.card_data.invoice_number}</DialogTitle>
                      </DialogHeader>
                      <QRCardAnalytics card={card} />
                    </DialogContent>
                  </Dialog>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Edit QR Card - {card.card_data.invoice_number}</DialogTitle>
                      </DialogHeader>
                      <QRCardCustomizer
                        existingCard={card}
                        onSuccess={() => {
                          // Dialog will close automatically
                        }}
                      />
                    </DialogContent>
                  </Dialog>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShareCard(card)}
                    className="flex items-center gap-2"
                  >
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>
                </div>

                {/* Advanced Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRegenerateCard(card.id)}
                    disabled={regenerateMutation.isPending}
                    className="flex items-center gap-2 text-orange-600 hover:text-orange-700"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Regenerate
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteCard(card.id)}
                    disabled={deleteMutation.isPending}
                    className="flex items-center gap-2 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
          >
            Previous
          </Button>
          
          <div className="flex items-center gap-1">
            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              const pageNum = Math.max(0, Math.min(totalPages - 5, page - 2)) + i;
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPage(pageNum)}
                  className="w-10"
                >
                  {pageNum + 1}
                </Button>
              );
            })}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};