/**
 * Business Adaptability Hook
 * Custom React hook for managing business type configuration, workflow adaptation,
 * terminology mapping, custom field schemas, feature configuration, and more.
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import businessAdaptabilityApi from '../services/businessAdaptabilityApi';
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
  WorkflowRuleFormData,
  CustomFieldFormData,
  PricingRuleFormData
} from '../types/businessAdaptability';

export const useBusinessAdaptability = () => {
  const queryClient = useQueryClient();
  const [selectedBusinessType, setSelectedBusinessType] = useState<BusinessType | null>(null);
  const [currentConfiguration, setCurrentConfiguration] = useState<BusinessConfiguration | null>(null);
  const [setupStep, setSetupStep] = useState<number>(0);
  const [isSetupMode, setIsSetupMode] = useState<boolean>(false);

  // Business Types
  const {
    data: businessTypes = [],
    isLoading: businessTypesLoading,
    error: businessTypesError,
    refetch: refetchBusinessTypes
  } = useQuery({
    queryKey: ['businessTypes'],
    queryFn: () => businessAdaptabilityApi.getBusinessTypes(true)
  });

  // Business Configurations
  const {
    data: businessConfigurations = [],
    isLoading: configurationsLoading,
    error: configurationsError,
    refetch: refetchConfigurations
  } = useQuery({
    queryKey: ['businessConfigurations'],
    queryFn: () => businessAdaptabilityApi.getBusinessConfigurations(true)
  });

  // Current Business Configuration
  const {
    data: businessConfiguration,
    isLoading: configurationLoading,
    error: configurationError,
    refetch: refetchConfiguration
  } = useQuery({
    queryKey: ['businessConfiguration', currentConfiguration?.id],
    queryFn: () => currentConfiguration ? businessAdaptabilityApi.getBusinessConfiguration(currentConfiguration.id) : null,
    enabled: !!currentConfiguration?.id
  });

  // Business Adaptability Status
  const {
    data: adaptabilityStatus,
    isLoading: statusLoading,
    error: statusError,
    refetch: refetchStatus
  } = useQuery({
    queryKey: ['businessAdaptabilityStatus', currentConfiguration?.id],
    queryFn: () => currentConfiguration ? businessAdaptabilityApi.getBusinessAdaptabilityStatus(currentConfiguration.id) : null,
    enabled: !!currentConfiguration?.id
  });

  // Workflow Rules
  const {
    data: workflowRules = [],
    isLoading: workflowRulesLoading,
    error: workflowRulesError,
    refetch: refetchWorkflowRules
  } = useQuery({
    queryKey: ['workflowRules', currentConfiguration?.id],
    queryFn: () => currentConfiguration ? businessAdaptabilityApi.getWorkflowRules(currentConfiguration.id) : [],
    enabled: !!currentConfiguration?.id
  });

  // Custom Fields
  const {
    data: customFields = [],
    isLoading: customFieldsLoading,
    error: customFieldsError,
    refetch: refetchCustomFields
  } = useQuery({
    queryKey: ['customFields', currentConfiguration?.id],
    queryFn: () => currentConfiguration ? businessAdaptabilityApi.getCustomFields(currentConfiguration.id) : [],
    enabled: !!currentConfiguration?.id
  });

  // Units of Measure
  const {
    data: unitsOfMeasure = [],
    isLoading: unitsLoading,
    error: unitsError,
    refetch: refetchUnits
  } = useQuery({
    queryKey: ['unitsOfMeasure', currentConfiguration?.id],
    queryFn: () => businessAdaptabilityApi.getUnitsOfMeasure(currentConfiguration?.id),
    enabled: !!currentConfiguration?.id
  });

  // Pricing Rules
  const {
    data: pricingRules = [],
    isLoading: pricingRulesLoading,
    error: pricingRulesError,
    refetch: refetchPricingRules
  } = useQuery({
    queryKey: ['pricingRules', currentConfiguration?.id],
    queryFn: () => currentConfiguration ? businessAdaptabilityApi.getPricingRules(currentConfiguration.id) : [],
    enabled: !!currentConfiguration?.id
  });

  // Feature Configurations
  const {
    data: featureConfigurations = [],
    isLoading: featuresLoading,
    error: featuresError,
    refetch: refetchFeatures
  } = useQuery({
    queryKey: ['featureConfigurations', currentConfiguration?.id],
    queryFn: () => businessAdaptabilityApi.getFeatureConfigurations(currentConfiguration?.id),
    enabled: !!currentConfiguration?.id
  });

  // Terminology Mapping
  const {
    data: terminologyMapping = {},
    isLoading: terminologyLoading,
    error: terminologyError,
    refetch: refetchTerminology
  } = useQuery({
    queryKey: ['terminologyMapping', currentConfiguration?.id],
    queryFn: () => currentConfiguration ? businessAdaptabilityApi.getTerminologyMapping(currentConfiguration.id) : {},
    enabled: !!currentConfiguration?.id
  });

  // Mutations
  const createBusinessTypeMutation = useMutation({
    mutationFn: (data: BusinessTypeCreateRequest) => businessAdaptabilityApi.createBusinessType(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businessTypes'] });
    }
  });

  const createBusinessConfigurationMutation = useMutation({
    mutationFn: (data: BusinessConfigurationCreateRequest) => businessAdaptabilityApi.createBusinessConfiguration(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['businessConfigurations'] });
      setCurrentConfiguration(data);
    }
  });

  const updateBusinessConfigurationMutation = useMutation({
    mutationFn: ({ configId, data }: { configId: string; data: Partial<BusinessConfigurationCreateRequest> }) =>
      businessAdaptabilityApi.updateBusinessConfiguration(configId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businessConfiguration'] });
      queryClient.invalidateQueries({ queryKey: ['businessConfigurations'] });
    }
  });

  const createWorkflowRuleMutation = useMutation({
    mutationFn: ({ configId, data }: { configId: string; data: WorkflowRuleFormData }) =>
      businessAdaptabilityApi.createWorkflowRule(configId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflowRules'] });
    }
  });

  const createCustomFieldMutation = useMutation({
    mutationFn: ({ configId, data }: { configId: string; data: CustomFieldFormData }) =>
      businessAdaptabilityApi.createCustomField(configId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customFields'] });
    }
  });

  const createPricingRuleMutation = useMutation({
    mutationFn: ({ configId, data }: { configId: string; data: PricingRuleFormData }) =>
      businessAdaptabilityApi.createPricingRule(configId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricingRules'] });
    }
  });

  const updateTerminologyMutation = useMutation({
    mutationFn: ({ configId, updates }: { configId: string; updates: TerminologyUpdateRequest }) =>
      businessAdaptabilityApi.updateTerminologyMapping(configId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['terminologyMapping'] });
    }
  });

  const toggleFeatureMutation = useMutation({
    mutationFn: ({ featureId, enabled }: { featureId: string; enabled: boolean }) =>
      businessAdaptabilityApi.toggleFeature(featureId, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featureConfigurations'] });
    }
  });

  const migrateBusinessTypeMutation = useMutation({
    mutationFn: ({ configId, request }: { configId: string; request: BusinessMigrationRequest }) =>
      businessAdaptabilityApi.migrateBusinessType(configId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businessConfiguration'] });
      queryClient.invalidateQueries({ queryKey: ['businessAdaptabilityStatus'] });
    }
  });

  const initializeDefaultsMutation = useMutation({
    mutationFn: (configId: string) => businessAdaptabilityApi.initializeBusinessDefaults(configId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflowRules'] });
      queryClient.invalidateQueries({ queryKey: ['customFields'] });
      queryClient.invalidateQueries({ queryKey: ['pricingRules'] });
      queryClient.invalidateQueries({ queryKey: ['featureConfigurations'] });
      queryClient.invalidateQueries({ queryKey: ['unitsOfMeasure'] });
    }
  });

  // Helper functions
  const selectBusinessType = useCallback((businessType: BusinessType) => {
    setSelectedBusinessType(businessType);
  }, []);

  const startSetup = useCallback((businessType: BusinessType) => {
    setSelectedBusinessType(businessType);
    setIsSetupMode(true);
    setSetupStep(0);
  }, []);

  const nextSetupStep = useCallback(() => {
    setSetupStep(prev => prev + 1);
  }, []);

  const previousSetupStep = useCallback(() => {
    setSetupStep(prev => Math.max(0, prev - 1));
  }, []);

  const completeSetup = useCallback(() => {
    setIsSetupMode(false);
    setSetupStep(0);
  }, []);

  const createBusinessType = useCallback(async (data: BusinessTypeCreateRequest) => {
    return createBusinessTypeMutation.mutateAsync(data);
  }, [createBusinessTypeMutation]);

  const createBusinessConfiguration = useCallback(async (data: BusinessConfigurationCreateRequest) => {
    return createBusinessConfigurationMutation.mutateAsync(data);
  }, [createBusinessConfigurationMutation]);

  const updateBusinessConfiguration = useCallback(async (configId: string, data: Partial<BusinessConfigurationCreateRequest>) => {
    return updateBusinessConfigurationMutation.mutateAsync({ configId, data });
  }, [updateBusinessConfigurationMutation]);

  const createWorkflowRule = useCallback(async (configId: string, data: WorkflowRuleFormData) => {
    return createWorkflowRuleMutation.mutateAsync({ configId, data });
  }, [createWorkflowRuleMutation]);

  const createCustomField = useCallback(async (configId: string, data: CustomFieldFormData) => {
    return createCustomFieldMutation.mutateAsync({ configId, data });
  }, [createCustomFieldMutation]);

  const createPricingRule = useCallback(async (configId: string, data: PricingRuleFormData) => {
    return createPricingRuleMutation.mutateAsync({ configId, data });
  }, [createPricingRuleMutation]);

  const updateTerminology = useCallback(async (configId: string, updates: TerminologyUpdateRequest) => {
    return updateTerminologyMutation.mutateAsync({ configId, updates });
  }, [updateTerminologyMutation]);

  const toggleFeature = useCallback(async (featureId: string, enabled: boolean) => {
    return toggleFeatureMutation.mutateAsync({ featureId, enabled });
  }, [toggleFeatureMutation]);

  const migrateBusinessType = useCallback(async (configId: string, request: BusinessMigrationRequest) => {
    return migrateBusinessTypeMutation.mutateAsync({ configId, request });
  }, [migrateBusinessTypeMutation]);

  const initializeDefaults = useCallback(async (configId: string) => {
    return initializeDefaultsMutation.mutateAsync(configId);
  }, [initializeDefaultsMutation]);

  const analyzeCompatibility = useCallback(async (sourceTypeId: string, targetTypeId: string) => {
    return businessAdaptabilityApi.analyzeBusinessTypeCompatibility(sourceTypeId, targetTypeId);
  }, []);

  const validateConfiguration = useCallback(async (configId: string) => {
    return businessAdaptabilityApi.validateBusinessConfiguration(configId);
  }, []);

  const exportConfiguration = useCallback(async (configId: string) => {
    return businessAdaptabilityApi.exportBusinessConfiguration(configId);
  }, []);

  const getBusinessAnalytics = useCallback(async (configId: string, period?: string) => {
    return businessAdaptabilityApi.getBusinessAnalytics(configId, period);
  }, []);

  // Loading states
  const isLoading = businessTypesLoading || configurationsLoading || configurationLoading;
  const isMutating = createBusinessTypeMutation.isPending ||
                    createBusinessConfigurationMutation.isPending ||
                    updateBusinessConfigurationMutation.isPending ||
                    createWorkflowRuleMutation.isPending ||
                    createCustomFieldMutation.isPending ||
                    createPricingRuleMutation.isPending ||
                    updateTerminologyMutation.isPending ||
                    toggleFeatureMutation.isPending ||
                    migrateBusinessTypeMutation.isPending ||
                    initializeDefaultsMutation.isPending;

  // Error states
  const error = businessTypesError || configurationsError || configurationError;

  return {
    // Data
    businessTypes,
    businessConfigurations,
    businessConfiguration,
    adaptabilityStatus,
    workflowRules,
    customFields,
    unitsOfMeasure,
    pricingRules,
    featureConfigurations,
    terminologyMapping,
    
    // State
    selectedBusinessType,
    currentConfiguration,
    setupStep,
    isSetupMode,
    
    // Loading states
    isLoading,
    isMutating,
    businessTypesLoading,
    configurationsLoading,
    configurationLoading,
    statusLoading,
    workflowRulesLoading,
    customFieldsLoading,
    unitsLoading,
    pricingRulesLoading,
    featuresLoading,
    terminologyLoading,
    
    // Error states
    error,
    businessTypesError,
    configurationsError,
    configurationError,
    statusError,
    workflowRulesError,
    customFieldsError,
    unitsError,
    pricingRulesError,
    featuresError,
    terminologyError,
    
    // Actions
    selectBusinessType,
    setCurrentConfiguration,
    startSetup,
    nextSetupStep,
    previousSetupStep,
    completeSetup,
    createBusinessType,
    createBusinessConfiguration,
    updateBusinessConfiguration,
    createWorkflowRule,
    createCustomField,
    createPricingRule,
    updateTerminology,
    toggleFeature,
    migrateBusinessType,
    initializeDefaults,
    analyzeCompatibility,
    validateConfiguration,
    exportConfiguration,
    getBusinessAnalytics,
    
    // Refetch functions
    refetchBusinessTypes,
    refetchConfigurations,
    refetchConfiguration,
    refetchStatus,
    refetchWorkflowRules,
    refetchCustomFields,
    refetchUnits,
    refetchPricingRules,
    refetchFeatures,
    refetchTerminology
  };
};

export default useBusinessAdaptability;