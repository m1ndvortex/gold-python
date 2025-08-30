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

class BusinessAdaptabilityApiService {
  private baseUrl = '/api/business-adaptability';

  // Business Type Management
  async getBusinessTypes(activeOnly: boolean = true): Promise<BusinessType[]> {
    const response = await api.get(`${this.baseUrl}/business-types`, {
      params: { active_only: activeOnly }
    });
    return response.data;
  }

  async getBusinessType(typeId: string): Promise<BusinessType> {
    const response = await api.get(`${this.baseUrl}/business-types/${typeId}`);
    return response.data;
  }

  async getBusinessTypeByCode(typeCode: string): Promise<BusinessType> {
    const response = await api.get(`${this.baseUrl}/business-types/code/${typeCode}`);
    return response.data;
  }

  async createBusinessType(data: BusinessTypeCreateRequest): Promise<BusinessType> {
    const response = await api.post(`${this.baseUrl}/business-types`, data);
    return response.data;
  }

  async updateBusinessType(typeId: string, data: Partial<BusinessTypeCreateRequest>): Promise<BusinessType> {
    const response = await api.put(`${this.baseUrl}/business-types/${typeId}`, data);
    return response.data;
  }

  // Business Configuration Management
  async getBusinessConfigurations(activeOnly: boolean = true): Promise<BusinessConfiguration[]> {
    const response = await api.get(`${this.baseUrl}/configurations`, {
      params: { active_only: activeOnly }
    });
    return response.data;
  }

  async getBusinessConfiguration(configId: string): Promise<BusinessConfiguration> {
    const response = await api.get(`${this.baseUrl}/configurations/${configId}`);
    return response.data;
  }

  async createBusinessConfiguration(data: BusinessConfigurationCreateRequest): Promise<BusinessConfiguration> {
    const response = await api.post(`${this.baseUrl}/configurations`, data);
    return response.data;
  }

  async updateBusinessConfiguration(configId: string, data: Partial<BusinessConfigurationCreateRequest>): Promise<BusinessConfiguration> {
    const response = await api.put(`${this.baseUrl}/configurations/${configId}`, data);
    return response.data;
  }

  // Workflow Rule Management
  async getWorkflowRules(
    configId: string,
    ruleType?: string,
    entityType?: string,
    activeOnly: boolean = true
  ): Promise<WorkflowRule[]> {
    const response = await api.get(`${this.baseUrl}/configurations/${configId}/workflow-rules`, {
      params: {
        rule_type: ruleType,
        entity_type: entityType,
        active_only: activeOnly
      }
    });
    return response.data;
  }

  async createWorkflowRule(configId: string, data: WorkflowRuleFormData): Promise<WorkflowRule> {
    const response = await api.post(`${this.baseUrl}/configurations/${configId}/workflow-rules`, data);
    return response.data;
  }

  async updateWorkflowRule(ruleId: string, data: Partial<WorkflowRuleFormData>): Promise<WorkflowRule> {
    const response = await api.put(`${this.baseUrl}/workflow-rules/${ruleId}`, data);
    return response.data;
  }

  async executeWorkflowRules(
    configId: string,
    ruleType: string,
    entityType: string,
    entityData: Record<string, any>
  ): Promise<any> {
    const response = await api.post(`${this.baseUrl}/configurations/${configId}/workflow-rules/execute`, entityData, {
      params: {
        rule_type: ruleType,
        entity_type: entityType
      }
    });
    return response.data;
  }

  // Custom Field Management
  async getCustomFields(
    configId: string,
    entityType?: string,
    activeOnly: boolean = true
  ): Promise<CustomFieldDefinition[]> {
    const response = await api.get(`${this.baseUrl}/configurations/${configId}/custom-fields`, {
      params: {
        entity_type: entityType,
        active_only: activeOnly
      }
    });
    return response.data;
  }

  async createCustomField(configId: string, data: CustomFieldFormData): Promise<CustomFieldDefinition> {
    const response = await api.post(`${this.baseUrl}/configurations/${configId}/custom-fields`, data);
    return response.data;
  }

  async updateCustomField(fieldId: string, data: Partial<CustomFieldFormData>): Promise<CustomFieldDefinition> {
    const response = await api.put(`${this.baseUrl}/custom-fields/${fieldId}`, data);
    return response.data;
  }

  async validateCustomFieldData(
    configId: string,
    entityType: string,
    fieldData: Record<string, any>
  ): Promise<any> {
    const response = await api.post(`${this.baseUrl}/configurations/${configId}/custom-fields/validate`, fieldData, {
      params: { entity_type: entityType }
    });
    return response.data;
  }

  // Unit of Measure Management
  async getUnitsOfMeasure(
    businessConfigId?: string,
    unitType?: string,
    activeOnly: boolean = true
  ): Promise<UnitOfMeasure[]> {
    const response = await api.get(`${this.baseUrl}/units-of-measure`, {
      params: {
        business_config_id: businessConfigId,
        unit_type: unitType,
        active_only: activeOnly
      }
    });
    return response.data;
  }

  async createUnitOfMeasure(data: Partial<UnitOfMeasure>): Promise<UnitOfMeasure> {
    const response = await api.post(`${this.baseUrl}/units-of-measure`, data);
    return response.data;
  }

  async updateUnitOfMeasure(unitId: string, data: Partial<UnitOfMeasure>): Promise<UnitOfMeasure> {
    const response = await api.put(`${this.baseUrl}/units-of-measure/${unitId}`, data);
    return response.data;
  }

  async convertUnits(request: UnitConversionRequest): Promise<UnitConversionResponse> {
    const response = await api.post(`${this.baseUrl}/units-of-measure/convert`, null, {
      params: request
    });
    return response.data;
  }

  // Pricing Rule Management
  async getPricingRules(
    configId: string,
    ruleType?: string,
    appliesTo?: string,
    activeOnly: boolean = true
  ): Promise<PricingRule[]> {
    const response = await api.get(`${this.baseUrl}/configurations/${configId}/pricing-rules`, {
      params: {
        rule_type: ruleType,
        applies_to: appliesTo,
        active_only: activeOnly
      }
    });
    return response.data;
  }

  async createPricingRule(configId: string, data: PricingRuleFormData): Promise<PricingRule> {
    const response = await api.post(`${this.baseUrl}/configurations/${configId}/pricing-rules`, data);
    return response.data;
  }

  async updatePricingRule(ruleId: string, data: Partial<PricingRuleFormData>): Promise<PricingRule> {
    const response = await api.put(`${this.baseUrl}/pricing-rules/${ruleId}`, data);
    return response.data;
  }

  async calculatePrice(configId: string, request: PriceCalculationRequest): Promise<PriceCalculationResponse> {
    const response = await api.post(`${this.baseUrl}/configurations/${configId}/pricing-rules/calculate`, null, {
      params: request
    });
    return response.data;
  }

  // Business Migration
  async migrateBusinessType(configId: string, request: BusinessMigrationRequest): Promise<BusinessMigrationLog> {
    const response = await api.post(`${this.baseUrl}/configurations/${configId}/migrate`, request);
    return response.data;
  }

  async getMigrationHistory(configId: string): Promise<BusinessMigrationLog[]> {
    const response = await api.get(`${this.baseUrl}/configurations/${configId}/migration-history`);
    return response.data;
  }

  async rollbackMigration(migrationId: string): Promise<BusinessMigrationLog> {
    const response = await api.post(`${this.baseUrl}/migrations/${migrationId}/rollback`);
    return response.data;
  }

  // Terminology and Localization
  async getTerminologyMapping(configId: string): Promise<Record<string, string>> {
    const response = await api.get(`${this.baseUrl}/configurations/${configId}/terminology`);
    return response.data;
  }

  async updateTerminologyMapping(configId: string, updates: TerminologyUpdateRequest): Promise<Record<string, string>> {
    const response = await api.put(`${this.baseUrl}/configurations/${configId}/terminology`, updates);
    return response.data;
  }

  async translateTerm(configId: string, term: string, targetLanguage?: string): Promise<{ original_term: string; translated_term: string; target_language?: string }> {
    const response = await api.get(`${this.baseUrl}/configurations/${configId}/terminology/translate`, {
      params: {
        term,
        target_language: targetLanguage
      }
    });
    return response.data;
  }

  // Feature Configuration
  async getFeatureConfigurations(businessConfigId?: string): Promise<FeatureConfiguration[]> {
    const response = await api.get(`${this.baseUrl}/features`, {
      params: { business_config_id: businessConfigId }
    });
    return response.data;
  }

  async updateFeatureConfiguration(featureId: string, data: Partial<FeatureConfiguration>): Promise<FeatureConfiguration> {
    const response = await api.put(`${this.baseUrl}/features/${featureId}`, data);
    return response.data;
  }

  async toggleFeature(featureId: string, enabled: boolean): Promise<FeatureConfiguration> {
    const response = await api.patch(`${this.baseUrl}/features/${featureId}/toggle`, { is_enabled: enabled });
    return response.data;
  }

  // Business Adaptability Status and Analytics
  async getBusinessAdaptabilityStatus(configId: string): Promise<BusinessAdaptabilityStatus> {
    const response = await api.get(`${this.baseUrl}/configurations/${configId}/status`);
    return response.data;
  }

  async analyzeBusinessTypeCompatibility(sourceTypeId: string, targetTypeId: string): Promise<BusinessTypeCompatibility> {
    const response = await api.get(`${this.baseUrl}/business-types/${sourceTypeId}/compatibility/${targetTypeId}`);
    return response.data;
  }

  // Bulk Operations
  async initializeBusinessDefaults(configId: string): Promise<{ message: string }> {
    const response = await api.post(`${this.baseUrl}/configurations/${configId}/bulk-operations/initialize-defaults`);
    return response.data;
  }

  async exportBusinessConfiguration(configId: string): Promise<any> {
    const response = await api.post(`${this.baseUrl}/configurations/${configId}/bulk-operations/export-configuration`);
    return response.data;
  }

  async importBusinessConfiguration(configId: string, configData: any): Promise<BusinessConfiguration> {
    const response = await api.post(`${this.baseUrl}/configurations/${configId}/bulk-operations/import-configuration`, configData);
    return response.data;
  }

  // Template Management
  async getBusinessTemplates(): Promise<BusinessType[]> {
    const response = await api.get(`${this.baseUrl}/business-types`, {
      params: { is_template: true }
    });
    return response.data;
  }

  async applyBusinessTemplate(configId: string, templateId: string): Promise<BusinessConfiguration> {
    const response = await api.post(`${this.baseUrl}/configurations/${configId}/apply-template/${templateId}`);
    return response.data;
  }

  // Analytics and Reporting
  async getBusinessAnalytics(configId: string, period?: string): Promise<any> {
    const response = await api.get(`${this.baseUrl}/configurations/${configId}/analytics`, {
      params: { period }
    });
    return response.data;
  }

  async getBusinessKPIs(configId: string): Promise<any> {
    const response = await api.get(`${this.baseUrl}/configurations/${configId}/kpis`);
    return response.data;
  }

  async getBusinessMetrics(configId: string, category?: string): Promise<any> {
    const response = await api.get(`${this.baseUrl}/configurations/${configId}/metrics`, {
      params: { category }
    });
    return response.data;
  }

  // Validation and Testing
  async validateBusinessConfiguration(configId: string): Promise<{ is_valid: boolean; errors: string[]; warnings: string[] }> {
    const response = await api.post(`${this.baseUrl}/configurations/${configId}/validate`);
    return response.data;
  }

  async testWorkflowRules(configId: string, testData: any): Promise<any> {
    const response = await api.post(`${this.baseUrl}/configurations/${configId}/test-workflows`, testData);
    return response.data;
  }

  async testPricingRules(configId: string, testData: any): Promise<any> {
    const response = await api.post(`${this.baseUrl}/configurations/${configId}/test-pricing`, testData);
    return response.data;
  }
}

export const businessAdaptabilityApi = new BusinessAdaptabilityApiService();
export default businessAdaptabilityApi;