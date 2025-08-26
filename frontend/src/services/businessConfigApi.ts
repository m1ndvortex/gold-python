/**
 * Business Configuration API Service
 * 
 * API service for managing business type configurations,
 * terminology mappings, workflows, and custom fields.
 */

import {
  BusinessTypeConfiguration,
  BusinessTypeConfigurationCreate,
  BusinessTypeConfigurationUpdate,
  ComprehensiveBusinessConfig,
  TerminologyMapping,
  TerminologyMappingCreate,
  WorkflowConfiguration,
  WorkflowConfigurationCreate,
  CustomFieldSchema,
  CustomFieldSchemaCreate,
  FeatureConfiguration,
  FeatureConfigurationCreate,
  ReportTemplate,
  KPIDefinition,
  ServiceCatalogItem,
  BillOfMaterials,
  ProductionTracking,
  BusinessTypeDetectionRequest,
  BusinessTypeDetectionResponse,
  BusinessSetupWizardRequest,
  BusinessType,
  WorkflowType,
  FieldType,
  BusinessConfigApiResponse,
  BusinessConfigListResponse
} from '../types/businessConfig';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

class BusinessConfigApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}/api/business-config${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Business Type Configuration methods
  async createBusinessConfiguration(
    data: BusinessTypeConfigurationCreate
  ): Promise<BusinessTypeConfiguration> {
    return this.request<BusinessTypeConfiguration>('/configurations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async listBusinessConfigurations(
    skip: number = 0,
    limit: number = 100
  ): Promise<BusinessTypeConfiguration[]> {
    return this.request<BusinessTypeConfiguration[]>(
      `/configurations?skip=${skip}&limit=${limit}`
    );
  }

  async getBusinessConfiguration(
    configId: string
  ): Promise<ComprehensiveBusinessConfig> {
    return this.request<ComprehensiveBusinessConfig>(`/configurations/${configId}`);
  }

  async getBusinessConfigurationByType(
    businessType: BusinessType
  ): Promise<ComprehensiveBusinessConfig> {
    return this.request<ComprehensiveBusinessConfig>(
      `/configurations/by-type/${businessType}`
    );
  }

  async updateBusinessConfiguration(
    configId: string,
    data: BusinessTypeConfigurationUpdate
  ): Promise<BusinessTypeConfiguration> {
    return this.request<BusinessTypeConfiguration>(`/configurations/${configId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteBusinessConfiguration(configId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/configurations/${configId}`, {
      method: 'DELETE',
    });
  }

  // Terminology Mapping methods
  async createTerminologyMapping(
    data: TerminologyMappingCreate
  ): Promise<TerminologyMapping> {
    return this.request<TerminologyMapping>('/terminology', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getTerminologyMappings(
    businessConfigId: string,
    languageCode: string = 'en'
  ): Promise<TerminologyMapping[]> {
    return this.request<TerminologyMapping[]>(
      `/terminology/${businessConfigId}?language_code=${languageCode}`
    );
  }

  async updateTerminologyMapping(
    mappingId: string,
    data: Partial<TerminologyMappingCreate>
  ): Promise<TerminologyMapping> {
    return this.request<TerminologyMapping>(`/terminology/${mappingId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Workflow Configuration methods
  async createWorkflowConfiguration(
    data: WorkflowConfigurationCreate
  ): Promise<WorkflowConfiguration> {
    return this.request<WorkflowConfiguration>('/workflows', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getWorkflowConfigurations(
    businessConfigId: string,
    workflowType?: WorkflowType
  ): Promise<WorkflowConfiguration[]> {
    const params = workflowType ? `?workflow_type=${workflowType}` : '';
    return this.request<WorkflowConfiguration[]>(
      `/workflows/${businessConfigId}${params}`
    );
  }

  // Custom Field Schema methods
  async createCustomFieldSchema(
    data: CustomFieldSchemaCreate
  ): Promise<CustomFieldSchema> {
    return this.request<CustomFieldSchema>('/custom-fields', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCustomFieldSchemas(
    businessConfigId: string,
    entityType?: string
  ): Promise<CustomFieldSchema[]> {
    const params = entityType ? `?entity_type=${entityType}` : '';
    return this.request<CustomFieldSchema[]>(
      `/custom-fields/${businessConfigId}${params}`
    );
  }

  async updateCustomFieldSchema(
    fieldId: string,
    data: Partial<CustomFieldSchemaCreate>
  ): Promise<CustomFieldSchema> {
    return this.request<CustomFieldSchema>(`/custom-fields/${fieldId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCustomFieldSchema(fieldId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/custom-fields/${fieldId}`, {
      method: 'DELETE',
    });
  }

  // Feature Configuration methods
  async createFeatureConfiguration(
    data: FeatureConfigurationCreate
  ): Promise<FeatureConfiguration> {
    return this.request<FeatureConfiguration>('/features', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getFeatureConfigurations(
    businessConfigId: string
  ): Promise<FeatureConfiguration[]> {
    return this.request<FeatureConfiguration[]>(`/features/${businessConfigId}`);
  }

  async isFeatureEnabled(
    businessConfigId: string,
    featureName: string
  ): Promise<{ feature_name: string; is_enabled: boolean }> {
    return this.request<{ feature_name: string; is_enabled: boolean }>(
      `/features/${businessConfigId}/${featureName}/enabled`
    );
  }

  async updateFeatureConfiguration(
    featureId: string,
    data: Partial<FeatureConfigurationCreate>
  ): Promise<FeatureConfiguration> {
    return this.request<FeatureConfiguration>(`/features/${featureId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Report Template methods
  async getReportTemplates(
    businessConfigId: string,
    reportType?: string
  ): Promise<ReportTemplate[]> {
    const params = reportType ? `?report_type=${reportType}` : '';
    return this.request<ReportTemplate[]>(
      `/report-templates/${businessConfigId}${params}`
    );
  }

  // KPI Definition methods
  async getKPIDefinitions(
    businessConfigId: string,
    kpiCategory?: string
  ): Promise<KPIDefinition[]> {
    const params = kpiCategory ? `?kpi_category=${kpiCategory}` : '';
    return this.request<KPIDefinition[]>(`/kpis/${businessConfigId}${params}`);
  }

  // Service Catalog methods (for service businesses)
  async createServiceCatalogItem(
    data: Omit<ServiceCatalogItem, 'id' | 'created_at' | 'updated_at'>
  ): Promise<ServiceCatalogItem> {
    return this.request<ServiceCatalogItem>('/service-catalog', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getServiceCatalog(
    businessConfigId: string,
    category?: string
  ): Promise<ServiceCatalogItem[]> {
    const params = category ? `?category=${category}` : '';
    return this.request<ServiceCatalogItem[]>(
      `/service-catalog/${businessConfigId}${params}`
    );
  }

  // Bill of Materials methods (for manufacturing businesses)
  async createBillOfMaterials(
    data: Omit<BillOfMaterials, 'id' | 'created_at' | 'updated_at'>
  ): Promise<BillOfMaterials> {
    return this.request<BillOfMaterials>('/bill-of-materials', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getBillsOfMaterials(
    businessConfigId: string,
    productId?: string
  ): Promise<BillOfMaterials[]> {
    const params = productId ? `?product_id=${productId}` : '';
    return this.request<BillOfMaterials[]>(
      `/bill-of-materials/${businessConfigId}${params}`
    );
  }

  // Production Tracking methods (for manufacturing businesses)
  async createProductionTracking(
    data: Omit<ProductionTracking, 'id' | 'created_at' | 'updated_at'>
  ): Promise<ProductionTracking> {
    return this.request<ProductionTracking>('/production-tracking', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getProductionTracking(
    businessConfigId: string,
    status?: string
  ): Promise<ProductionTracking[]> {
    const params = status ? `?status=${status}` : '';
    return this.request<ProductionTracking[]>(
      `/production-tracking/${businessConfigId}${params}`
    );
  }

  // Business Type Detection and Setup methods
  async detectBusinessType(
    data: BusinessTypeDetectionRequest
  ): Promise<BusinessTypeDetectionResponse> {
    return this.request<BusinessTypeDetectionResponse>('/detect-business-type', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async setupBusinessWizard(
    data: BusinessSetupWizardRequest
  ): Promise<BusinessTypeConfiguration> {
    return this.request<BusinessTypeConfiguration>('/setup-wizard', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Utility methods
  async getSupportedBusinessTypes(): Promise<{
    business_types: Array<{ value: string; label: string }>;
  }> {
    return this.request<{
      business_types: Array<{ value: string; label: string }>;
    }>('/business-types');
  }

  async getSupportedWorkflowTypes(): Promise<{
    workflow_types: Array<{ value: string; label: string }>;
  }> {
    return this.request<{
      workflow_types: Array<{ value: string; label: string }>;
    }>('/workflow-types');
  }

  async getSupportedFieldTypes(): Promise<{
    field_types: Array<{ value: string; label: string }>;
  }> {
    return this.request<{
      field_types: Array<{ value: string; label: string }>;
    }>('/field-types');
  }

  // Batch operations
  async batchUpdateTerminology(
    businessConfigId: string,
    mappings: Array<{
      standard_term: string;
      business_term: string;
      context?: string;
      category?: string;
    }>
  ): Promise<TerminologyMapping[]> {
    const results: TerminologyMapping[] = [];
    
    for (const mapping of mappings) {
      try {
        const result = await this.createTerminologyMapping({
          business_config_id: businessConfigId,
          ...mapping,
        });
        results.push(result);
      } catch (error) {
        console.error('Failed to create terminology mapping:', error);
      }
    }
    
    return results;
  }

  async batchUpdateFeatures(
    businessConfigId: string,
    features: Array<{
      feature_name: string;
      is_enabled: boolean;
      configuration?: Record<string, any>;
    }>
  ): Promise<FeatureConfiguration[]> {
    const results: FeatureConfiguration[] = [];
    
    for (const feature of features) {
      try {
        const result = await this.createFeatureConfiguration({
          business_config_id: businessConfigId,
          ...feature,
        });
        results.push(result);
      } catch (error) {
        console.error('Failed to create feature configuration:', error);
      }
    }
    
    return results;
  }
}

export const businessConfigApi = new BusinessConfigApiService();
export default businessConfigApi;