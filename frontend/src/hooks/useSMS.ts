import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { smsApi } from '../services/smsApi';
import { useToast } from '../components/ui/use-toast';
import type {
  SMSTemplate,
  SMSTemplateCreate,
  SMSTemplateUpdate,
  SMSCampaign,
  SMSCampaignCreate,
  SMSBatchRequest,
  SMSRetryRequest,
  SMSHistoryFilters,
  SMSCampaignStats,
  SMSOverallStats
} from '../types';

// SMS Template Hooks
export const useSMSTemplates = (params?: { template_type?: string; active_only?: boolean }) => {
  return useQuery({
    queryKey: ['sms-templates', params],
    queryFn: () => smsApi.templates.getTemplates(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useSMSTemplate = (id: string) => {
  return useQuery({
    queryKey: ['sms-template', id],
    queryFn: () => smsApi.templates.getTemplate(id),
    enabled: !!id,
  });
};

export const useCreateSMSTemplate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (template: SMSTemplateCreate) => smsApi.templates.createTemplate(template),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-templates'] });
      toast({
        title: "Success",
        description: "SMS template created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to create SMS template",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateSMSTemplate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, template }: { id: string; template: SMSTemplateUpdate }) =>
      smsApi.templates.updateTemplate(id, template),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['sms-templates'] });
      queryClient.invalidateQueries({ queryKey: ['sms-template', id] });
      toast({
        title: "Success",
        description: "SMS template updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to update SMS template",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteSMSTemplate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => smsApi.templates.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-templates'] });
      toast({
        title: "Success",
        description: "SMS template deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to delete SMS template",
        variant: "destructive",
      });
    },
  });
};

export const usePreviewSMSTemplate = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ templateId, customerId }: { templateId: string; customerId: string }) =>
      smsApi.templates.previewTemplate(templateId, customerId),
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to preview SMS template",
        variant: "destructive",
      });
    },
  });
};

// SMS Campaign Hooks
export const useSMSCampaigns = (params?: { status?: string }) => {
  return useQuery({
    queryKey: ['sms-campaigns', params],
    queryFn: () => smsApi.campaigns.getCampaigns(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useSMSCampaign = (id: string) => {
  return useQuery({
    queryKey: ['sms-campaign', id],
    queryFn: () => smsApi.campaigns.getCampaign(id),
    enabled: !!id,
  });
};

export const useCreateSMSCampaign = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (campaign: SMSCampaignCreate) => smsApi.campaigns.createCampaign(campaign),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-campaigns'] });
      toast({
        title: "Success",
        description: "SMS campaign created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to create SMS campaign",
        variant: "destructive",
      });
    },
  });
};

export const useSendSMSCampaign = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => smsApi.campaigns.sendCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['sms-history'] });
      queryClient.invalidateQueries({ queryKey: ['sms-stats'] });
      toast({
        title: "Success",
        description: "SMS campaign sending started",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to send SMS campaign",
        variant: "destructive",
      });
    },
  });
};

export const useRetrySMSCampaign = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => smsApi.campaigns.retryCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['sms-history'] });
      toast({
        title: "Success",
        description: "SMS campaign retry started",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to retry SMS campaign",
        variant: "destructive",
      });
    },
  });
};

export const useSMSCampaignStats = (id: string) => {
  return useQuery({
    queryKey: ['sms-campaign-stats', id],
    queryFn: () => smsApi.campaigns.getCampaignStats(id),
    enabled: !!id,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });
};

// SMS Batch Operations Hooks
export const useSendBatchSMS = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (batch: SMSBatchRequest) => smsApi.batch.sendBatch(batch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['sms-history'] });
      toast({
        title: "Success",
        description: "Batch SMS sending started",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to send batch SMS",
        variant: "destructive",
      });
    },
  });
};

export const useRetryFailedSMS = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (retry: SMSRetryRequest) => smsApi.batch.retryMessages(retry),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-history'] });
      queryClient.invalidateQueries({ queryKey: ['sms-campaigns'] });
      toast({
        title: "Success",
        description: "SMS retry process started",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to retry SMS messages",
        variant: "destructive",
      });
    },
  });
};

// SMS History and Statistics Hooks
export const useSMSHistory = (filters?: SMSHistoryFilters) => {
  return useQuery({
    queryKey: ['sms-history', filters],
    queryFn: () => smsApi.history.getHistory(filters),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useSMSOverallStats = () => {
  return useQuery({
    queryKey: ['sms-overall-stats'],
    queryFn: () => smsApi.history.getOverallStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 60000, // Refetch every minute for dashboard updates
  });
};

export const useSMSMessages = (params?: {
  campaign_id?: string;
  customer_id?: string;
  status?: string;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ['sms-messages', params],
    queryFn: () => smsApi.history.getMessages(params),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useSMSMessage = (id: string) => {
  return useQuery({
    queryKey: ['sms-message', id],
    queryFn: () => smsApi.history.getMessage(id),
    enabled: !!id,
  });
};

// Combined hook for SMS dashboard data
export const useSMSDashboardData = () => {
  const overallStats = useSMSOverallStats();
  const recentCampaigns = useSMSCampaigns({ status: undefined });
  const recentHistory = useSMSHistory({ page: 1, per_page: 10 });

  return {
    overallStats: overallStats.data,
    recentCampaigns: recentCampaigns.data?.slice(0, 5) || [],
    recentHistory: recentHistory.data?.messages || [],
    isLoading: overallStats.isLoading || recentCampaigns.isLoading || recentHistory.isLoading,
    error: overallStats.error || recentCampaigns.error || recentHistory.error,
  };
};