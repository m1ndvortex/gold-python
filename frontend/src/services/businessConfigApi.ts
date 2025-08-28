/**
 * Business Configuration API Service
 * 
 * API service for managing business type configurations,
 * terminology mappings, workflows, and custom fields.
 */

import { AuthenticatedApiClient } from './AuthenticatedApiClient';
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

class BusinessConfigApiService extends AuthenticatedApiClient {
  constructor() {
    super({
      baseURL: '/api/business-config',
      timeout: 30000, // 30 second timeout for business config operations
      retryAttempts: 2,
    });
  }

  // Business Type Configuration methods
  async createBusinessConfiguration(
    data: BusinessTypeConfigurationCreate
  ): Promise<BusinessTypeConfiguration> {
    return this.post<BusinessTypeConfiguration>('/configurations', data);
  }

  async listBusinessConfigurations(
    skip: number = 0,
    limit: number = 100
  ): Promise<BusinessTypeConfiguration[]> {
    return this.get<BusinessTypeConfiguration[]>(`/configurations?skip=${skip}&limit=${limit}`);
  }

  async getBusinessConfiguration(
    configId: string
  ): Promise<ComprehensiveBusinessConfig> {
    return this.get<ComprehensiveBusinessConfig>(`/configurations/${configId}`);
  }

  async getBusinessConfigurationByType(
    businessType: BusinessType
  ): Promise<ComprehensiveBusinessConfig> {
    return this.get<ComprehensiveBusinessConfig>(`/configurations/by-type/${businessType}`);
  }

  async updateBusinessConfiguration(
    configId: string,
    data: BusinessTypeConfigurationUpdate
  ): Promise<BusinessTypeConfiguration> {
    return this.put<BusinessTypeConfiguration>(`/configurations/${configId}`, data);
  }

  async deleteBusinessConfiguration(configId: string): Promise<{ message: string }> {
    return this.delete<{ message: string }>(`/configurations/${configId}`);
  }

  // Terminology Mapping methods
  async createTerminologyMapping(
    data: TerminologyMappingCreate
  ): Promise<TerminologyMapping> {
    return this.post<TerminologyMapping>('/terminology', data);
  }

  async getTerminologyMappings(
    businessConfigId: string,
    languageCode: string = 'en'
  ): Promise<TerminologyMapping[]> {
    return this.get<TerminologyMapping[]>(`/terminology/${businessConfigId}?language_code=${languageCode}`);
  }

  async updateTerminologyMapping(
    mappingId: string,
    data: Partial<TerminologyMappingCreate>
  ): Promise<TerminologyMapping> {
    return this.put<TerminologyMapping>(`/terminology/${mappingId}`, data);
  }

  // Workflow Configuration methods
  async createWorkflowConfiguration(
    data: WorkflowConfigurationCreate
  ): Promise<WorkflowConfiguration> {
    return this.post<WorkflowConfiguration>('/workflows', data);
  }

  async getWorkflowConfigurations(
    businessConfigId: string,
    workflowType?: WorkflowType
  ): Promise<WorkflowConfiguration[]> {
    const params = workflowType ? `?workflow_type=${workflowType}` : '';
    return this.get<WorkflowConfiguration[]>(`/workflows/${businessConfigId}${params}`);
  }

  // Custom Field Schema methods
  async createCustomFieldSchema(
    data: CustomFieldSchemaCreate
  ): Promise<CustomFieldSchema> {
    return this.post<CustomFieldSchema>('/custom-fields', data);
  }

  async getCustomFieldSchemas(
    businessConfigId: string,
    entityType?: string
  ): Promise<CustomFieldSchema[]> {
    const params = entityType ? `?entity_type=${entityType}` : '';
    return this.get<CustomFieldSchema[]>(`/custom-fields/${businessConfigId}${params}`);
  }

  async updateCustomFieldSchema(
    fieldId: string,
    data: Partial<CustomFieldSchemaCreate>
  ): Promise<CustomFieldSchema> {
    return this.put<CustomFieldSchema>(`/custom-fields/${fieldId}`, data);
  }

  async deleteCustomFieldSchema(fieldId: string): Promise<{ message: string }> {
    return this.delete<{ message: string }>(`/custom-fields/${fieldId}`);
  }

  // Feature Configuration methods
  async createFeatureConfiguration(
    data: FeatureConfigurationCreate
  ): Promise<FeatureConfiguration> {
    return this.post<FeatureConfiguration>('/features', data);
  }

  async getFeatureConfigurations(
    businessConfigId: string
  ): Promise<FeatureConfiguration[]> {
    return this.get<FeatureConfiguration[]>(`/features/${businessConfigId}`);
  }

  async isFeatureEnabled(
    businessConfigId: string,
    featureName: string
  ): Promise<{ feature_name: string; is_enabled: boolean }> {
    return this.get<{ feature_name: string; is_enabled: boolean }>(
      `/features/${businessConfigId}/${featureName}/enabled`
    );
  }

  async updateFeatureConfiguration(
    featureId: string,
    data: Partial<FeatureConfigurationCreate>
  ): Promise<FeatureConfiguration> {
    return this.put<FeatureConfiguration>(`/features/${featureId}`, data);
  }

  // Report Template methods
  async getReportTemplates(
    businessConfigId: string,
    reportType?: string
  ): Promise<ReportTemplate[]> {
    const params = reportType ? `?report_type=${reportType}` : '';
    return this.get<ReportTemplate[]>(`/report-templates/${businessConfigId}${params}`);
  }

  // KPI Definition methods
  async getKPIDefinitions(
    businessConfigId: string,
    kpiCategory?: string
  ): Promise<KPIDefinition[]> {
    const params = kpiCategory ? `?kpi_category=${kpiCategory}` : '';
    return this.get<KPIDefinition[]>(`/kpis/${businessConfigId}${params}`);
  }

  // Service Catalog methods (for service businesses)
  async createServiceCatalogItem(
    data: Omit<ServiceCatalogItem, 'id' | 'created_at' | 'updated_at'>
  ): Promise<ServiceCatalogItem> {
    return this.post<ServiceCatalogItem>('/service-catalog', data);
  }

  async getServiceCatalog(
    businessConfigId: string,
    category?: string
  ): Promise<ServiceCatalogItem[]> {
    const params = category ? `?category=${category}` : '';
    return this.get<ServiceCatalogItem[]>(`/service-catalog/${businessConfigId}${params}`);
  }

  // Bill of Materials methods (for manufacturing businesses)
  async createBillOfMaterials(
    data: Omit<BillOfMaterials, 'id' | 'created_at' | 'updated_at'>
  ): Promise<BillOfMaterials> {
    return this.post<BillOfMaterials>('/bill-of-materials', data);
  }

  async getBillsOfMaterials(
    businessConfigId: string,
    productId?: string
  ): Promise<BillOfMaterials[]> {
    const params = productId ? `?product_id=${productId}` : '';
    return this.get<BillOfMaterials[]>(`/bill-of-materials/${businessConfigId}${params}`);
  }

  // Production Tracking methods (for manufacturing businesses)
  async createProductionTracking(
    data: Omit<ProductionTracking, 'id' | 'created_at' | 'updated_at'>
  ): Promise<ProductionTracking> {
    return this.post<ProductionTracking>('/production-tracking', data);
  }

  async getProductionTracking(
    businessConfigId: string,
    status?: string
  ): Promise<ProductionTracking[]> {
    const params = status ? `?status=${status}` : '';
    return this.get<ProductionTracking[]>(`/production-tracking/${businessConfigId}${params}`);
  }

  // Business Type Detection and Setup methods
  async detectBusinessType(
    data: BusinessTypeDetectionRequest
  ): Promise<BusinessTypeDetectionResponse> {
    return this.post<BusinessTypeDetectionResponse>('/detect-business-type', data);
  }

  async setupBusinessWizard(
    data: BusinessSetupWizardRequest
  ): Promise<BusinessTypeConfiguration> {
    return this.post<BusinessTypeConfiguration>('/setup-wizard', data);
  }

  // Utility methods
  async getSupportedBusinessTypes(): Promise<{
    business_types: Array<{ value: string; label: string }>;
  }> {
    return this.get<{
      business_types: Array<{ value: string; label: string }>;
    }>('/business-types');
  }

  async getSupportedWorkflowTypes(): Promise<{
    workflow_types: Array<{ value: string; label: string }>;
  }> {
    return this.get<{
      workflow_types: Array<{ value: string; label: string }>;
    }>('/workflow-types');
  }

  async getSupportedFieldTypes(): Promise<{
    field_types: Array<{ value: string; label: string }>;
  }> {
    return this.get<{
      field_types: Array<{ value: string; label: string }>;
    }>('/field-types');
  }

  // Batch operations using enhanced batch request functionality
  async batchUpdateTerminology(
    businessConfigId: string,
    mappings: Array<{
      standard_term: string;
      business_term: string;
      context?: string;
      category?: string;
    }>
  ): Promise<TerminologyMapping[]> {
    const requests = mappings.map(mapping => 
      () => this.createTerminologyMapping({
        business_config_id: businessConfigId,
        ...mapping,
      })
    );
    
    const results = await this.batchRequests(requests, { concurrency: 3, failFast: false });
    return results
      .filter(result => result.success && result.data)
      .map(result => result.data!);
  }

  async batchUpdateFeatures(
    businessConfigId: string,
    features: Array<{
      feature_name: string;
      is_enabled: boolean;
      configuration?: Record<string, any>;
    }>
  ): Promise<FeatureConfiguration[]> {
    const requests = features.map(feature => 
      () => this.createFeatureConfiguration({
        business_config_id: businessConfigId,
        ...feature,
      })
    );
    
    const results = await this.batchRequests(requests, { concurrency: 3, failFast: false });
    return results
      .filter(result => result.success && result.data)
      .map(result => result.data!);
  }
}

export const businessConfigApi = new BusinessConfigApiService();
export default businessConfigApi;