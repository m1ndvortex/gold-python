/**
 * Business Adaptability API Service
 * Service for managing business type configuration, workflow adaptation,
 * terminology mapping, custom field schemas, feature configuration, and more.
 */

import { apiGet, apiPost, apiPut, apiDelete } from './api';
import {
  BusinessType,
  BusinessConfiguration,
  WorkflowRule,
  CustomFieldDefinition,
  UnitOfMeasure,
  PricingRule,
  BusinessMigrationLog,
  FeatureConfiguration,
  BusinessAdaptabilityStatus,
  BusinessTypeCompatibility,
  BusinessTypeCreateRequest,
  BusinessConfigurationCreateRequest,
  BusinessMigrationRequest,
  TerminologyUpdateRequest,
  UnitConversionRequest,
  UnitConversionResponse,
  PriceCalculationRequest,
  PriceCalculationResponse,
  WorkflowRuleFormData,
  CustomFieldFormData,
  PricingRuleFormData
} from '../types/businessAdaptability';

// Helper function to build query parameters
function buildQueryParams(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  }
  return searchParams.toString();
}

class BusinessAdaptabilityApiService {
  private baseUrl = '/api/business-adaptability';

  // Business Type Management
  async getBusinessTypes(activeOnly: boolean = true): Promise<BusinessType[]> {
    const url = `${this.baseUrl}/business-types?active_only=${activeOnly}`;
    const response = await apiGet(url);
    return response.data;
  }

  async getBusinessType(typeId: string): Promise<BusinessType> {
    const response = await apiGet(`${this.baseUrl}/business-types/${typeId}`);
    return response.data;
  }

  async getBusinessTypeByCode(typeCode: string): Promise<BusinessType> {
    const response = await apiGet(`${this.baseUrl}/business-types/code/${typeCode}`);
    return response.data;
  }

  async createBusinessType(data: BusinessTypeCreateRequest): Promise<BusinessType> {
    const response = await apiPost(`${this.baseUrl}/business-types`, data);
    return response.data;
  }

  async updateBusinessType(typeId: string, data: Partial<BusinessTypeCreateRequest>): Promise<BusinessType> {
    const response = await apiPut(`${this.baseUrl}/business-types/${typeId}`, data);
    return response.data;
  }

  // Business Configuration Management
  async getBusinessConfigurations(activeOnly: boolean = true): Promise<BusinessConfiguration[]> {
    const url = `${this.baseUrl}/configurations?active_only=${activeOnly}`;
    const response = await apiGet(url);
    return response.data;
  }

  async getBusinessConfiguration(configId: string): Promise<BusinessConfiguration> {
    const response = await apiGet(`${this.baseUrl}/configurations/${configId}`);
    return response.data;
  }

  async createBusinessConfiguration(data: BusinessConfigurationCreateRequest): Promise<BusinessConfiguration> {
    const response = await apiPost(`${this.baseUrl}/configurations`, data);
    return response.data;
  }

  async updateBusinessConfiguration(configId: string, data: Partial<BusinessConfigurationCreateRequest>): Promise<BusinessConfiguration> {
    const response = await apiPut(`${this.baseUrl}/configurations/${configId}`, data);
    return response.data;
  }

  // Workflow Rule Management
  async getWorkflowRules(
    configId: string,
    ruleType?: string,
    entityType?: string,
    activeOnly: boolean = true
  ): Promise<WorkflowRule[]> {
    const params = new URLSearchParams();
    if (ruleType) params.append('rule_type', ruleType);
    if (entityType) params.append('entity_type', entityType);
    params.append('active_only', activeOnly.toString());
    
    const url = `${this.baseUrl}/configurations/${configId}/workflow-rules?${params.toString()}`;
    const response = await apiGet(url);
    return response.data;
  }

  async createWorkflowRule(configId: string, data: WorkflowRuleFormData): Promise<WorkflowRule> {
    const response = await apiPost(`${this.baseUrl}/configurations/${configId}/workflow-rules`, data);
    return response.data;
  }

  async updateWorkflowRule(ruleId: string, data: Partial<WorkflowRuleFormData>): Promise<WorkflowRule> {
    const response = await apiPut(`${this.baseUrl}/workflow-rules/${ruleId}`, data);
    return response.data;
  }

  async executeWorkflowRules(
    configId: string,
    ruleType: string,
    entityType: string,
    entityData: Record<string, any>
  ): Promise<any> {
    const params = new URLSearchParams({
      rule_type: ruleType,
      entity_type: entityType
    });
    const response = await apiPost(`${this.baseUrl}/configurations/${configId}/workflow-rules/execute?${params.toString()}`, entityData);
    return response.data;
  }

  // Custom Field Management
  async getCustomFields(
    configId: string,
    entityType?: string,
    activeOnly: boolean = true
  ): Promise<CustomFieldDefinition[]> {
    const params = new URLSearchParams({
      entity_type: entityType || '',
      active_only: activeOnly.toString()
    });
    const response = await apiGet(`${this.baseUrl}/configurations/${configId}/custom-fields?${params.toString()}`);
    return response.data;
  }

  async createCustomField(configId: string, data: CustomFieldFormData): Promise<CustomFieldDefinition> {
    const response = await apiPost(`${this.baseUrl}/configurations/${configId}/custom-fields`, data);
    return response.data;
  }

  async updateCustomField(fieldId: string, data: Partial<CustomFieldFormData>): Promise<CustomFieldDefinition> {
    const response = await apiPut(`${this.baseUrl}/custom-fields/${fieldId}`, data);
    return response.data;
  }

  async validateCustomFieldData(
    configId: string,
    entityType: string,
    fieldData: Record<string, any>
  ): Promise<any> {
    const params = new URLSearchParams({ entity_type: entityType });
    const response = await apiPost(`${this.baseUrl}/configurations/${configId}/custom-fields/validate?${params.toString()}`, fieldData);
    return response.data;
  }

  // Unit of Measure Management
  async getUnitsOfMeasure(
    businessConfigId?: string,
    unitType?: string,
    activeOnly: boolean = true
  ): Promise<UnitOfMeasure[]> {
    const params: Record<string, string> = {};
    if (businessConfigId) params.business_config_id = businessConfigId;
    if (unitType) params.unit_type = unitType;
    params.active_only = activeOnly.toString();
    
    const queryParams = new URLSearchParams(params);
    const response = await apiGet(`${this.baseUrl}/units-of-measure?${queryParams.toString()}`);
    return response.data;
  }

  async createUnitOfMeasure(data: Partial<UnitOfMeasure>): Promise<UnitOfMeasure> {
    const response = await apiPost(`${this.baseUrl}/units-of-measure`, data);
    return response.data;
  }

  async updateUnitOfMeasure(unitId: string, data: Partial<UnitOfMeasure>): Promise<UnitOfMeasure> {
    const response = await apiPut(`${this.baseUrl}/units-of-measure/${unitId}`, data);
    return response.data;
  }

  async convertUnits(request: UnitConversionRequest): Promise<UnitConversionResponse> {
    const queryString = buildQueryParams(request);
    const response = await apiPost(`${this.baseUrl}/units-of-measure/convert?${queryString}`, null);
    return response.data;
  }

  // Pricing Rule Management
  async getPricingRules(
    configId: string,
    ruleType?: string,
    appliesTo?: string,
    activeOnly: boolean = true
  ): Promise<PricingRule[]> {
    const queryParams = new URLSearchParams({
        rule_type: ruleType || '',
        applies_to: appliesTo || '',
        active_only: activeOnly.toString()
      }); const response = await apiGet(`${this.baseUrl}/configurations/${configId}/pricing-rules?${queryParams.toString()}`);
    return response.data;
  }

  async createPricingRule(configId: string, data: PricingRuleFormData): Promise<PricingRule> {
    const response = await apiPost(`${this.baseUrl}/configurations/${configId}/pricing-rules`, data);
    return response.data;
  }

  async updatePricingRule(ruleId: string, data: Partial<PricingRuleFormData>): Promise<PricingRule> {
    const response = await apiPut(`${this.baseUrl}/pricing-rules/${ruleId}`, data);
    return response.data;
  }

  async calculatePrice(configId: string, request: PriceCalculationRequest): Promise<PriceCalculationResponse> {
    const queryString = buildQueryParams(request);
    const response = await apiPost(`${this.baseUrl}/configurations/${configId}/pricing-rules/calculate?${queryString}`, null);
    return response.data;
  }

  // Business Migration
  async migrateBusinessType(configId: string, request: BusinessMigrationRequest): Promise<BusinessMigrationLog> {
    const response = await apiPost(`${this.baseUrl}/configurations/${configId}/migrate`, request);
    return response.data;
  }

  async getMigrationHistory(configId: string): Promise<BusinessMigrationLog[]> {
    const response = await apiGet(`${this.baseUrl}/configurations/${configId}/migration-history`);
    return response.data;
  }

  async rollbackMigration(migrationId: string): Promise<BusinessMigrationLog> {
    const response = await apiPost(`${this.baseUrl}/migrations/${migrationId}/rollback`);
    return response.data;
  }

  // Terminology and Localization
  async getTerminologyMapping(configId: string): Promise<Record<string, string>> {
    const response = await apiGet(`${this.baseUrl}/configurations/${configId}/terminology`);
    return response.data;
  }

  async updateTerminologyMapping(configId: string, updates: TerminologyUpdateRequest): Promise<Record<string, string>> {
    const response = await apiPut(`${this.baseUrl}/configurations/${configId}/terminology`, updates);
    return response.data;
  }

  async translateTerm(configId: string, term: string, targetLanguage?: string): Promise<{ original_term: string; translated_term: string; target_language?: string }> {
    const params: Record<string, string> = { term };
    if (targetLanguage) params.target_language = targetLanguage;
    
    const queryParams = new URLSearchParams(params);
    const response = await apiGet(`${this.baseUrl}/configurations/${configId}/terminology/translate?${queryParams.toString()}`);
    return response.data;
  }

  // Feature Configuration
  async getFeatureConfigurations(businessConfigId?: string): Promise<FeatureConfiguration[]> {
    const params: Record<string, string> = {};
    if (businessConfigId) params.business_config_id = businessConfigId;
    
    const queryParams = new URLSearchParams(params);
    const response = await apiGet(`${this.baseUrl}/features?${queryParams.toString()}`);
    return response.data;
  }

  async updateFeatureConfiguration(featureId: string, data: Partial<FeatureConfiguration>): Promise<FeatureConfiguration> {
    const response = await apiPut(`${this.baseUrl}/features/${featureId}`, data);
    return response.data;
  }

  async toggleFeature(featureId: string, enabled: boolean): Promise<FeatureConfiguration> {
    const response = await apiPut(`${this.baseUrl}/features/${featureId}/toggle`, { is_enabled: enabled });
    return response.data;
  }

  // Business Adaptability Status and Analytics
  async getBusinessAdaptabilityStatus(configId: string): Promise<BusinessAdaptabilityStatus> {
    const response = await apiGet(`${this.baseUrl}/configurations/${configId}/status`);
    return response.data;
  }

  async analyzeBusinessTypeCompatibility(sourceTypeId: string, targetTypeId: string): Promise<BusinessTypeCompatibility> {
    const response = await apiGet(`${this.baseUrl}/business-types/${sourceTypeId}/compatibility/${targetTypeId}`);
    return response.data;
  }

  // Bulk Operations
  async initializeBusinessDefaults(configId: string): Promise<{ message: string }> {
    const response = await apiPost(`${this.baseUrl}/configurations/${configId}/bulk-operations/initialize-defaults`);
    return response.data;
  }

  async exportBusinessConfiguration(configId: string): Promise<any> {
    const response = await apiPost(`${this.baseUrl}/configurations/${configId}/bulk-operations/export-configuration`);
    return response.data;
  }

  async importBusinessConfiguration(configId: string, configData: any): Promise<BusinessConfiguration> {
    const response = await apiPost(`${this.baseUrl}/configurations/${configId}/bulk-operations/import-configuration`, configData);
    return response.data;
  }

  // Template Management
  async getBusinessTemplates(): Promise<BusinessType[]> {
    const queryParams = new URLSearchParams({ is_template: 'true' }); const response = await apiGet(`${this.baseUrl}/business-types?${queryParams.toString()}`);
    return response.data;
  }

  async applyBusinessTemplate(configId: string, templateId: string): Promise<BusinessConfiguration> {
    const response = await apiPost(`${this.baseUrl}/configurations/${configId}/apply-template/${templateId}`);
    return response.data;
  }

  // Analytics and Reporting
  async getBusinessAnalytics(configId: string, period?: string): Promise<any> {
    const params: Record<string, string> = {};
    if (period) params.period = period;
    
    const queryParams = new URLSearchParams(params);
    const response = await apiGet(`${this.baseUrl}/configurations/${configId}/analytics?${queryParams.toString()}`);
    return response.data;
  }

  async getBusinessKPIs(configId: string): Promise<any> {
    const response = await apiGet(`${this.baseUrl}/configurations/${configId}/kpis`);
    return response.data;
  }

  async getBusinessMetrics(configId: string, category?: string): Promise<any> {
    const params: Record<string, string> = {};
    if (category) params.category = category;
    
    const queryParams = new URLSearchParams(params);
    const response = await apiGet(`${this.baseUrl}/configurations/${configId}/metrics?${queryParams.toString()}`);
    return response.data;
  }

  // Validation and Testing
  async validateBusinessConfiguration(configId: string): Promise<{ is_valid: boolean; errors: string[]; warnings: string[] }> {
    const response = await apiPost(`${this.baseUrl}/configurations/${configId}/validate`);
    return response.data;
  }

  async testWorkflowRules(configId: string, testData: any): Promise<any> {
    const response = await apiPost(`${this.baseUrl}/configurations/${configId}/test-workflows`, testData);
    return response.data;
  }

  async testPricingRules(configId: string, testData: any): Promise<any> {
    const response = await apiPost(`${this.baseUrl}/configurations/${configId}/test-pricing`, testData);
    return response.data;
  }
}

export const businessAdaptabilityApi = new BusinessAdaptabilityApiService();
export default businessAdaptabilityApi;

