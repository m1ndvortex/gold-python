import React, { useState } from 'react';
import { Plus, Send, RotateCcw, Users, MessageSquare, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Progress } from '../ui/progress';
import { Checkbox } from '../ui/checkbox';
import { Alert, AlertDescription } from '../ui/alert';
import { useToast } from '../ui/use-toast';
import {
  useSMSCampaigns,
  useSMSCampaign,
  useCreateSMSCampaign,
  useSendSMSCampaign,
  useRetrySMSCampaign,
  useSMSCampaignStats,
  useSMSTemplates,
  useSendBatchSMS
} from '../../hooks/useSMS';
import { useCustomers } from '../../hooks/useCustomers';
import type { SMSCampaign, SMSCampaignCreate, SMSBatchRequest, Customer } from '../../types';

interface SMSCampaignFormProps {
  onClose: () => void;
}

const SMSCampaignForm: React.FC<SMSCampaignFormProps> = ({ onClose }) => {
  const [formData, setFormData] = useState<SMSCampaignCreate>({
    name: '',
    template_id: undefined,
    message_content: '',
    customer_ids: [],
  });
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [useTemplate, setUseTemplate] = useState(false);
  const [customerFilter, setCustomerFilter] = useState('');

  const { data: templates } = useSMSTemplates({ active_only: true });
  const { data: customers } = useCustomers();
  const createCampaignMutation = useCreateSMSCampaign();
  const sendBatchMutation = useSendBatchSMS();

  const filteredCustomers = customers?.filter(customer =>
    customer.name.toLowerCase().includes(customerFilter.toLowerCase()) ||
    customer.phone?.toLowerCase().includes(customerFilter.toLowerCase())
  ) || [];

  const handleTemplateChange = (templateId: string) => {
    const template = templates?.find(t => t.id === templateId);
    if (template) {
      setFormData(prev => ({
        ...prev,
        template_id: templateId,
        message_content: template.message_template
      }));
    }
  };

  const handleCustomerToggle = (customerId: string) => {
    setSelectedCustomers(prev => {
      const newSelection = prev.includes(customerId)
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId];
      
      setFormData(prevForm => ({
        ...prevForm,
        customer_ids: newSelection
      }));
      
      return newSelection;
    });
  };

  const handleSelectAll = () => {
    const allCustomerIds = filteredCustomers.map(c => c.id);
    setSelectedCustomers(allCustomerIds);
    setFormData(prev => ({ ...prev, customer_ids: allCustomerIds }));
  };

  const handleDeselectAll = () => {
    setSelectedCustomers([]);
    setFormData(prev => ({ ...prev, customer_ids: [] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.customer_ids.length === 0) {
      return;
    }

    if (formData.customer_ids.length > 100) {
      return;
    }

    try {
      const batchRequest: SMSBatchRequest = {
        campaign_name: formData.name,
        template_id: formData.template_id,
        message_content: formData.message_content,
        customer_ids: formData.customer_ids
      };

      await sendBatchMutation.mutateAsync(batchRequest);
      onClose();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const isLoading = createCampaignMutation.isPending || sendBatchMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="campaign_name">Campaign Name</Label>
        <Input
          id="campaign_name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Enter campaign name"
          required
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="use_template"
            checked={useTemplate}
            onCheckedChange={(checked) => setUseTemplate(checked === true)}
          />
          <Label htmlFor="use_template">Use SMS Template</Label>
        </div>

        {useTemplate && (
          <div className="space-y-2">
            <Label htmlFor="template_select">Select Template</Label>
            <Select onValueChange={handleTemplateChange}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a template..." />
              </SelectTrigger>
              <SelectContent>
                {templates?.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name} ({template.template_type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="message_content">Message Content</Label>
          <Textarea
            id="message_content"
            value={formData.message_content}
            onChange={(e) => setFormData(prev => ({ ...prev, message_content: e.target.value }))}
            placeholder="Enter your SMS message..."
            rows={4}
            required
          />
          <div className="text-sm text-muted-foreground">
            Character count: {formData.message_content.length}/160
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label>Select Recipients ({selectedCustomers.length} selected)</Label>
          <div className="space-x-2">
            <Button type="button" variant="outline" size="sm" onClick={handleSelectAll}>
              Select All
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={handleDeselectAll}>
              Deselect All
            </Button>
          </div>
        </div>

        <Input
          placeholder="Search customers..."
          value={customerFilter}
          onChange={(e) => setCustomerFilter(e.target.value)}
        />

        <div className="max-h-64 overflow-y-auto border rounded-md p-2 space-y-2">
          {filteredCustomers.map((customer) => (
            <div key={customer.id} className="flex items-center space-x-2 p-2 hover:bg-muted rounded">
              <Checkbox
                id={`customer_${customer.id}`}
                checked={selectedCustomers.includes(customer.id)}
                onCheckedChange={() => handleCustomerToggle(customer.id)}
              />
              <Label htmlFor={`customer_${customer.id}`} className="flex-1 cursor-pointer">
                <div className="flex justify-between">
                  <span>{customer.name}</span>
                  <span className="text-muted-foreground">{customer.phone}</span>
                </div>
                {customer.current_debt > 0 && (
                  <div className="text-xs text-red-600">
                    Debt: ${customer.current_debt.toFixed(2)}
                  </div>
                )}
              </Label>
            </div>
          ))}
        </div>

        {formData.customer_ids.length > 100 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Maximum 100 recipients allowed per campaign. Please reduce your selection.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <Separator />

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading || formData.customer_ids.length === 0 || formData.customer_ids.length > 100}
        >
          {isLoading ? 'Creating & Sending...' : 'Create & Send Campaign'}
        </Button>
      </div>
    </form>
  );
};

interface CampaignStatsProps {
  campaign: SMSCampaign;
}

const CampaignStats: React.FC<CampaignStatsProps> = ({ campaign }) => {
  const { data: stats } = useSMSCampaignStats(campaign.id);

  if (!stats) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-muted rounded w-1/2"></div>
      </div>
    );
  }

  const successRate = stats.success_rate || 0;
  const deliveryRate = stats.delivery_rate || 0;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-muted-foreground">Sent</div>
          <div className="font-semibold text-green-600">{stats.sent_count}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Failed</div>
          <div className="font-semibold text-red-600">{stats.failed_count}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Pending</div>
          <div className="font-semibold text-yellow-600">{stats.pending_count}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Delivered</div>
          <div className="font-semibold text-blue-600">{stats.delivered_count}</div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Success Rate</span>
          <span>{successRate.toFixed(1)}%</span>
        </div>
        <Progress value={successRate} className="h-2" />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Delivery Rate</span>
          <span>{deliveryRate.toFixed(1)}%</span>
        </div>
        <Progress value={deliveryRate} className="h-2" />
      </div>
    </div>
  );
};

export const SMSCampaignManager: React.FC = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: campaigns, isLoading } = useSMSCampaigns({
    status: statusFilter === 'all' ? undefined : statusFilter
  });
  const sendCampaignMutation = useSendSMSCampaign();
  const retryCampaignMutation = useRetrySMSCampaign();

  const handleSendCampaign = async (campaignId: string) => {
    if (window.confirm('Are you sure you want to send this campaign?')) {
      try {
        await sendCampaignMutation.mutateAsync(campaignId);
      } catch (error) {
        // Error handled by mutation
      }
    }
  };

  const handleRetryCampaign = async (campaignId: string) => {
    if (window.confirm('Are you sure you want to retry failed messages in this campaign?')) {
      try {
        await retryCampaignMutation.mutateAsync(campaignId);
      } catch (error) {
        // Error handled by mutation
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'sending':
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'sending':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading campaigns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">SMS Campaigns</h2>
          <p className="text-muted-foreground">Create and manage SMS campaigns</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create SMS Campaign</DialogTitle>
            </DialogHeader>
            <SMSCampaignForm onClose={() => setIsCreateDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Label htmlFor="status-filter">Filter by Status:</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="sending">Sending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Campaigns List */}
      {campaigns && campaigns.length > 0 ? (
        <div className="space-y-4">
          {campaigns.map((campaign) => (
            <Card key={campaign.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      {getStatusIcon(campaign.status)}
                      <span>{campaign.name}</span>
                    </CardTitle>
                    <CardDescription className="mt-1">
                      <div className="flex items-center space-x-4">
                        <Badge className={getStatusColor(campaign.status)}>
                          {campaign.status.toUpperCase()}
                        </Badge>
                        <span className="flex items-center space-x-1">
                          <Users className="h-3 w-3" />
                          <span>{campaign.total_recipients} recipients</span>
                        </span>
                        <span>Created: {new Date(campaign.created_at).toLocaleDateString()}</span>
                      </div>
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    {campaign.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => handleSendCampaign(campaign.id)}
                        disabled={sendCampaignMutation.isPending}
                      >
                        <Send className="h-3 w-3 mr-1" />
                        Send
                      </Button>
                    )}
                    {(campaign.status === 'completed' || campaign.status === 'failed') && campaign.failed_count > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRetryCampaign(campaign.id)}
                        disabled={retryCampaignMutation.isPending}
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Retry Failed
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Message Content</Label>
                    <div className="p-3 bg-muted rounded text-sm">
                      <pre className="whitespace-pre-wrap">{campaign.message_content}</pre>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Campaign Statistics</Label>
                    <CampaignStats campaign={campaign} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No SMS Campaigns Found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {statusFilter === 'all' 
                ? "No campaigns found. Create your first SMS campaign to get started."
                : `No campaigns found with status "${statusFilter}". Try adjusting your filters.`
              }
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Campaign
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};