import React, { useState } from 'react';
import { Search, Filter, Download, MessageSquare, Clock, CheckCircle, XCircle, AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Separator } from '../ui/separator';
import { Alert, AlertDescription } from '../ui/alert';
import { useToast } from '../ui/use-toast';
import {
  useSMSHistory,
  useSMSMessages,
  useSMSCampaigns,
  useRetryFailedSMS
} from '../../hooks/useSMS';
import { useCustomers } from '../../hooks/useCustomers';
import type { SMSMessage, SMSHistoryFilters, SMSRetryRequest } from '../../types';

interface SMSMessageDetailsProps {
  message: SMSMessage;
  onClose: () => void;
}

const SMSMessageDetails: React.FC<SMSMessageDetailsProps> = ({ message, onClose }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getDeliveryStatusIcon = (status?: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'expired':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium">Message ID</Label>
          <p className="text-sm text-muted-foreground font-mono">{message.id}</p>
        </div>
        <div>
          <Label className="text-sm font-medium">Campaign ID</Label>
          <p className="text-sm text-muted-foreground font-mono">{message.campaign_id}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium">Phone Number</Label>
          <p className="text-sm">{message.phone_number}</p>
        </div>
        <div>
          <Label className="text-sm font-medium">Customer ID</Label>
          <p className="text-sm text-muted-foreground font-mono">{message.customer_id}</p>
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium">Message Content</Label>
        <div className="mt-1 p-3 bg-muted rounded-md">
          <pre className="whitespace-pre-wrap text-sm">{message.message_content}</pre>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium">Status</Label>
          <div className="flex items-center space-x-2 mt-1">
            {getStatusIcon(message.status)}
            <Badge variant={message.status === 'sent' ? 'default' : message.status === 'failed' ? 'destructive' : 'secondary'}>
              {message.status.toUpperCase()}
            </Badge>
          </div>
        </div>
        <div>
          <Label className="text-sm font-medium">Delivery Status</Label>
          <div className="flex items-center space-x-2 mt-1">
            {getDeliveryStatusIcon(message.delivery_status)}
            <Badge variant={message.delivery_status === 'delivered' ? 'default' : 'secondary'}>
              {(message.delivery_status || 'pending').toUpperCase()}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium">Retry Count</Label>
          <p className="text-sm">{message.retry_count} / {message.max_retries}</p>
        </div>
        <div>
          <Label className="text-sm font-medium">Gateway Message ID</Label>
          <p className="text-sm text-muted-foreground font-mono">
            {message.gateway_message_id || 'N/A'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium">Created At</Label>
          <p className="text-sm">{new Date(message.created_at).toLocaleString()}</p>
        </div>
        <div>
          <Label className="text-sm font-medium">Sent At</Label>
          <p className="text-sm">
            {message.sent_at ? new Date(message.sent_at).toLocaleString() : 'Not sent'}
          </p>
        </div>
      </div>

      {message.delivered_at && (
        <div>
          <Label className="text-sm font-medium">Delivered At</Label>
          <p className="text-sm">{new Date(message.delivered_at).toLocaleString()}</p>
        </div>
      )}

      {message.error_message && (
        <div>
          <Label className="text-sm font-medium">Error Message</Label>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{message.error_message}</AlertDescription>
          </Alert>
        </div>
      )}

      <div className="flex justify-end">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
};

interface RetryMessagesDialogProps {
  selectedMessages: SMSMessage[];
  onClose: () => void;
  onRetry: () => void;
}

const RetryMessagesDialog: React.FC<RetryMessagesDialogProps> = ({ 
  selectedMessages, 
  onClose, 
  onRetry 
}) => {
  const retryMutation = useRetryFailedSMS();

  const handleRetry = async () => {
    const retryRequest: SMSRetryRequest = {
      message_ids: selectedMessages.map(m => m.id),
      max_retries: 3
    };

    try {
      await retryMutation.mutateAsync(retryRequest);
      onRetry();
      onClose();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const failedMessages = selectedMessages.filter(m => m.status === 'failed');

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">
          You have selected {selectedMessages.length} messages, of which {failedMessages.length} are failed and can be retried.
        </p>
      </div>

      {failedMessages.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Messages to Retry</Label>
          <div className="max-h-40 overflow-y-auto border rounded p-2">
            {failedMessages.map((message) => (
              <div key={message.id} className="text-xs p-1 border-b last:border-b-0">
                <div className="font-mono">{message.phone_number}</div>
                <div className="text-muted-foreground truncate">{message.message_content}</div>
                {message.error_message && (
                  <div className="text-red-600 text-xs">{message.error_message}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          onClick={handleRetry} 
          disabled={failedMessages.length === 0 || retryMutation.isPending}
        >
          {retryMutation.isPending ? 'Retrying...' : `Retry ${failedMessages.length} Messages`}
        </Button>
      </div>
    </div>
  );
};

export const SMSHistoryTracker: React.FC = () => {
  const [filters, setFilters] = useState<SMSHistoryFilters>({
    page: 1,
    per_page: 50
  });
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [viewingMessage, setViewingMessage] = useState<SMSMessage | null>(null);
  const [showRetryDialog, setShowRetryDialog] = useState(false);

  const { data: historyData, isLoading } = useSMSHistory(filters);
  const { data: campaigns } = useSMSCampaigns();
  const { data: customers } = useCustomers();

  const messages = historyData?.messages || [];
  const totalPages = historyData?.total_pages || 1;

  const handleFilterChange = (key: keyof SMSHistoryFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleSelectMessage = (messageId: string) => {
    setSelectedMessages(prev => 
      prev.includes(messageId)
        ? prev.filter(id => id !== messageId)
        : [...prev, messageId]
    );
  };

  const handleSelectAll = () => {
    const allMessageIds = messages.map(m => m.id);
    setSelectedMessages(allMessageIds);
  };

  const handleDeselectAll = () => {
    setSelectedMessages([]);
  };

  const getSelectedMessagesData = () => {
    return messages.filter(m => selectedMessages.includes(m.id));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-3 w-3 text-yellow-500" />;
      case 'sent':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'failed':
        return <XCircle className="h-3 w-3 text-red-500" />;
      case 'delivered':
        return <CheckCircle className="h-3 w-3 text-blue-500" />;
      default:
        return <AlertCircle className="h-3 w-3 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'sent':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'delivered':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading SMS history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">SMS History & Tracking</h2>
          <p className="text-muted-foreground">View and track SMS message delivery status</p>
        </div>
        <div className="flex space-x-2">
          {selectedMessages.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setShowRetryDialog(true)}
              disabled={getSelectedMessagesData().filter(m => m.status === 'failed').length === 0}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Retry Selected ({selectedMessages.length})
            </Button>
          )}
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="campaign-filter">Campaign</Label>
              <Select
                value={filters.campaign_id || 'all'}
                onValueChange={(value) => handleFilterChange('campaign_id', value === 'all' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All campaigns" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Campaigns</SelectItem>
                  {campaigns?.map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer-filter">Customer</Label>
              <Select
                value={filters.customer_id || 'all'}
                onValueChange={(value) => handleFilterChange('customer_id', value === 'all' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All customers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  {customers?.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name} - {customer.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status-filter">Status</Label>
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) => handleFilterChange('status', value === 'all' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="per-page">Per Page</Label>
              <Select
                value={filters.per_page?.toString() || '50'}
                onValueChange={(value) => handleFilterChange('per_page', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              SMS Messages ({historyData?.total || 0} total)
            </CardTitle>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={handleDeselectAll}>
                Deselect All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {messages.length > 0 ? (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Select</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Delivery</TableHead>
                    <TableHead>Retry</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {messages.map((message) => (
                    <TableRow key={message.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedMessages.includes(message.id)}
                          onChange={() => handleSelectMessage(message.id)}
                          className="rounded"
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {message.phone_number}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate text-sm">
                          {message.message_content}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(message.status)}
                          <Badge className={getStatusColor(message.status)}>
                            {message.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {message.delivery_status || 'pending'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {message.retry_count}/{message.max_retries}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(message.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewingMessage(message)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  Page {filters.page} of {totalPages}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange((filters.page || 1) - 1)}
                    disabled={(filters.page || 1) <= 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange((filters.page || 1) + 1)}
                    disabled={(filters.page || 1) >= totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No SMS Messages Found</h3>
              <p className="text-muted-foreground">
                No messages match your current filters. Try adjusting your search criteria.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Message Details Dialog */}
      <Dialog open={!!viewingMessage} onOpenChange={() => setViewingMessage(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>SMS Message Details</DialogTitle>
          </DialogHeader>
          {viewingMessage && (
            <SMSMessageDetails
              message={viewingMessage}
              onClose={() => setViewingMessage(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Retry Messages Dialog */}
      <Dialog open={showRetryDialog} onOpenChange={setShowRetryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Retry Failed Messages</DialogTitle>
          </DialogHeader>
          <RetryMessagesDialog
            selectedMessages={getSelectedMessagesData()}
            onClose={() => setShowRetryDialog(false)}
            onRetry={() => {
              setSelectedMessages([]);
              // Refresh data will happen automatically via React Query
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};