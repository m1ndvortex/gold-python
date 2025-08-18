import { api } from '../utils/api';
import type {
  SMSTemplate,
  SMSTemplateCreate,
  SMSTemplateUpdate,
  SMSTemplatePreview,
  SMSCampaign,
  SMSCampaignCreate,
  SMSCampaignWithDetails,
  SMSMessage,
  SMSMessageWithDetails,
  SMSBatchRequest,
  SMSBatchResponse,
  SMSRetryRequest,
  SMSRetryResponse,
  SMSHistoryFilters,
  SMSHistoryResponse,
  SMSCampaignStats,
  SMSOverallStats,
  SMSScheduleRequest,
  SMSScheduledCampaign
} from '../types';

// SMS Template Management
export const smsTemplateApi = {
  // Create SMS template
  createTemplate: async (template: SMSTemplateCreate): Promise<SMSTemplate> => {
    const response = await api.post('/sms/templates', template);
    return response.data as SMSTemplate;
  },

  // Get all SMS templates
  getTemplates: async (params?: {
    template_type?: string;
    active_only?: boolean;
  }): Promise<SMSTemplate[]> => {
    const response = await api.get('/sms/templates', { params });
    return response.data as SMSTemplate[];
  },

  // Get SMS template by ID
  getTemplate: async (id: string): Promise<SMSTemplate> => {
    const response = await api.get(`/sms/templates/${id}`);
    return response.data as SMSTemplate;
  },

  // Update SMS template
  updateTemplate: async (id: string, template: SMSTemplateUpdate): Promise<SMSTemplate> => {
    const response = await api.put(`/sms/templates/${id}`, template);
    return response.data as SMSTemplate;
  },

  // Delete SMS template
  deleteTemplate: async (id: string): Promise<void> => {
    await api.delete(`/sms/templates/${id}`);
  },

  // Preview SMS template with customer data
  previewTemplate: async (templateId: string, customerId: string): Promise<SMSTemplatePreview> => {
    const response = await api.post(`/sms/templates/${templateId}/preview`, {
      customer_id: customerId
    });
    return response.data as SMSTemplatePreview;
  }
};

// SMS Campaign Management
export const smsCampaignApi = {
  // Create SMS campaign
  createCampaign: async (campaign: SMSCampaignCreate): Promise<SMSCampaign> => {
    const response = await api.post('/sms/campaigns', campaign);
    return response.data as SMSCampaign;
  },

  // Get SMS campaigns
  getCampaigns: async (params?: {
    status?: string;
  }): Promise<SMSCampaign[]> => {
    const response = await api.get('/sms/campaigns', { params });
    return response.data as SMSCampaign[];
  },

  // Get SMS campaign by ID
  getCampaign: async (id: string): Promise<SMSCampaignWithDetails> => {
    const response = await api.get(`/sms/campaigns/${id}`);
    return response.data as SMSCampaignWithDetails;
  },

  // Send SMS campaign
  sendCampaign: async (id: string): Promise<{ message: string; campaign_id: string }> => {
    const response = await api.post(`/sms/campaigns/${id}/send`);
    return response.data as { message: string; campaign_id: string };
  },

  // Retry failed messages in campaign
  retryCampaign: async (id: string): Promise<{ message: string; campaign_id: string }> => {
    const response = await api.post(`/sms/campaigns/${id}/retry`);
    return response.data as { message: string; campaign_id: string };
  },

  // Get campaign statistics
  getCampaignStats: async (id: string): Promise<SMSCampaignStats> => {
    const response = await api.get(`/sms/campaigns/${id}/statistics`);
    return response.data as SMSCampaignStats;
  }
};

// SMS Batch Operations
export const smsBatchApi = {
  // Send batch SMS
  sendBatch: async (batch: SMSBatchRequest): Promise<SMSBatchResponse> => {
    const response = await api.post('/sms/send-batch', batch);
    return response.data as SMSBatchResponse;
  },

  // Retry failed messages
  retryMessages: async (retry: SMSRetryRequest): Promise<SMSRetryResponse> => {
    const response = await api.post('/sms/retry', retry);
    return response.data as SMSRetryResponse;
  }
};

// SMS History and Statistics
export const smsHistoryApi = {
  // Get SMS history
  getHistory: async (filters?: SMSHistoryFilters): Promise<SMSHistoryResponse> => {
    const response = await api.get('/sms/history', { params: filters });
    return response.data as SMSHistoryResponse;
  },

  // Get overall statistics
  getOverallStats: async (): Promise<SMSOverallStats> => {
    const response = await api.get('/sms/statistics');
    return response.data as SMSOverallStats;
  },

  // Get SMS message by ID
  getMessage: async (id: string): Promise<SMSMessageWithDetails> => {
    const response = await api.get(`/sms/messages/${id}`);
    return response.data as SMSMessageWithDetails;
  },

  // Get SMS messages with filtering
  getMessages: async (params?: {
    campaign_id?: string;
    customer_id?: string;
    status?: string;
    limit?: number;
  }): Promise<SMSMessageWithDetails[]> => {
    const response = await api.get('/sms/messages', { params });
    return response.data as SMSMessageWithDetails[];
  }
};

// SMS Scheduling (Future enhancement)
export const smsScheduleApi = {
  // Schedule SMS campaign
  scheduleCampaign: async (schedule: SMSScheduleRequest): Promise<SMSScheduledCampaign> => {
    const response = await api.post('/sms/schedule', schedule);
    return response.data as SMSScheduledCampaign;
  },

  // Get scheduled campaigns
  getScheduledCampaigns: async (): Promise<SMSScheduledCampaign[]> => {
    const response = await api.get('/sms/scheduled');
    return response.data as SMSScheduledCampaign[];
  },

  // Cancel scheduled campaign
  cancelScheduledCampaign: async (id: string): Promise<void> => {
    await api.delete(`/sms/scheduled/${id}`);
  }
};

// Combined SMS API
export const smsApi = {
  templates: smsTemplateApi,
  campaigns: smsCampaignApi,
  batch: smsBatchApi,
  history: smsHistoryApi,
  schedule: smsScheduleApi
};