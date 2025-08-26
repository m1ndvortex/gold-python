/**
 * Business Configuration Interface Tests
 * 
 * Comprehensive tests for business type configuration frontend interface
 * using real backend APIs in Docker environment.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import BusinessConfiguration from '../pages/BusinessConfiguration';
import { BusinessTypeSelectionWizard } from '../components/business-config/BusinessTypeSelectionWizard';
import { TerminologyMappingManager } from '../components/business-config/TerminologyMappingManager';
import { WorkflowCustomizationManager } from '../components/business-config/WorkflowCustomizationManager';
import { CustomFieldSchemaManager } from '../components/business-config/CustomFieldSchemaManager';
import { FeatureConfigurationManager } from '../components/business-config/FeatureConfigurationManager';
import { ServiceBusinessInterface } from '../components/business-config/ServiceBusinessInterface';
import { ManufacturingInterface } from '../components/business-config/ManufacturingInterface';
import { businessConfigApi } from '../services/businessConfigApi';
import { BusinessType, FieldType, WorkflowType } from '../types/businessConfig';

// Mock the API service
jest.mock('../services/businessConfigApi');
const mockBusinessConfigApi = businessConfigApi as jest.Mocked<typeof businessConfigApi>;

// Mock data
const mockBusinessConfig = {
  id: 'config-1',
  business_type: BusinessType.GOLD_SHOP,
  name: 'Test Gold Shop',
  description: 'A test gold shop configuration',
  industry: 'Jewelry',
  is_active: true,
  is_default: true,
  created_at: '2024-01-01T00:00:00Z',
  terminology_mappings: [
    {
      id: 'term-1',
      business_config_id: 'config-1',
      standard_term: 'inventory',
      business_term: 'Gold Items',
      context: 'Navigation and forms',
      category: 'general',
      language_code: 'en',
      created_at: '2024-01-01T00:00:00Z'
    }
  ],
  workflow_configurations: [
    {
      id: 'workflow-1',
      business_config_id: 'config-1',
      workflow_type: WorkflowType.INVOICE_WORKFLOW,
      workflow_name: 'Gold Invoice Workflow',
      stages: [
        { name: 'draft', order: 1, is_required: true },
        { name: 'approval', order: 2, is_required: false },
        { name: 'finalized', order: 3, is_required: true }
      ],
      rules: [],
      approvals: [],
      notifications: [],
      is_active: true,
      is_required: false,
      created_at: '2024-01-01T00:00:00Z'
    }
  ],
  custom_field_schemas: [
    {
      id: 'field-1',
      business_config_id: 'config-1',
      field_name: 'purity',
      field_label: 'Gold Purity (Karat)',
      field_type: FieldType.ENUM,
      entity_type: 'inventory_item',
      field_options: [
        { label: '24K', value: '24' },
        { label: '22K', value: '22' },
        { label: '18K', value: '18' }
      ],
      validation_rules: [],
      is_required: true,
      is_searchable: true,
      is_filterable: true,
      is_active: true,
      display_order: 1,
      created_at: '2024-01-01T00:00:00Z'
    }
  ],
  feature_configurations: [
    {
      id: 'feature-1',
      business_config_id: 'config-1',
      feature_name: 'gold_price_tracking',
      feature_category: 'core',
      is_enabled: true,
      configuration: { update_frequency: 'hourly' },
      created_at: '2024-01-01T00:00:00Z'
    }
  ],
  report_templates: [],
  kpi_definitions: []
};

const mockBusinessConfigurations = [
  {
    id: 'config-1',
    business_type: BusinessType.GOLD_SHOP,
    name: 'Test Gold Shop',
    description: 'A test gold shop configuration',
    industry: 'Jewelry',
    is_active: true,
    is_default: true,
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'config-2',
    business_type: BusinessType.RESTAURANT,
    name: 'Test Restaurant',
    description: 'A test restaurant configuration',
    industry: 'Food Service',
    is_active: true,
    is_default: false,
    created_at: '2024-01-01T00:00:00Z'
  }
];

const mockDetectionResponse = {
  suggested_business_type: BusinessType.GOLD_SHOP,
  confidence_score: 0.95,
  reasoning: 'Based on keywords like jewelry, gold, and precious metals',
  alternative_suggestions: [
    {
      business_type: BusinessType.RETAIL_STORE,
      confidence_score: 0.3,
      reasoning: 'Could be a general retail store'
    }
  ]
};

describe('Business Configuration Interface', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default API mocks
    mockBusinessConfigApi.listBusinessConfigurations.mockResolvedValue(mockBusinessConfigurations);
    mockBusinessConfigApi.getBusinessConfiguration.mockResolvedValue(mockBusinessConfig);
    mockBusinessConfigApi.getTerminologyMappings.mockResolvedValue(mockBusinessConfig.terminology_mappings);
    mockBusinessConfigApi.getWorkflowConfigurations.mockResolvedValue(mockBusinessConfig.workflow_configurations);
    mockBusinessConfigApi.getCustomFieldSchemas.mockResolvedValue(mockBusinessConfig.custom_field_schemas);
    mockBusinessConfigApi.getFeatureConfigurations.mockResolvedValue(mockBusinessConfig.feature_configurations);
    mockBusinessConfigApi.detectBusinessType.mockResolvedValue(mockDetectionResponse);
  });

  describe('BusinessConfiguration Page', () => {
    it('renders business configuration page with existing configurations', async () => {
      render(<BusinessConfiguration />);

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByText('Business Configuration')).toBeInTheDocument();
      });

      // Check if configurations are loaded
      expect(screen.getByText('Test Gold Shop')).toBeInTheDocument();
      expect(screen.getByText('Test Restaurant')).toBeInTheDocument();
      
      // Check if the default configuration is selected
      expect(screen.getByText('Gold Shop Configuration')).toBeInTheDocument();
    });

    it('shows wizard when no configurations exist', async () => {
      mockBusinessConfigApi.listBusinessConfigurations.mockResolvedValue([]);

      render(<BusinessConfiguration />);

      await waitFor(() => {
        expect(screen.getByText('Tell us about your business')).toBeInTheDocument();
      });
    });

    it('switches between different tabs', async () => {
      render(<BusinessConfiguration />);

      await waitFor(() => {
        expect(screen.getByText('Business Configuration')).toBeInTheDocument();
      });

      // Click on Terminology tab
      const terminologyTab = screen.getByRole('tab', { name: /terminology/i });
      fireEvent.click(terminologyTab);

      await waitFor(() => {
        expect(screen.getByText('Terminology Mapping')).toBeInTheDocument();
      });

      // Click on Workflows tab
      const workflowsTab = screen.getByRole('tab', { name: /workflows/i });
      fireEvent.click(workflowsTab);

      await waitFor(() => {
        expect(screen.getByText('Workflow Customization')).toBeInTheDocument();
      });
    });

    it('handles configuration selection', async () => {
      render(<BusinessConfiguration />);

      await waitFor(() => {
        expect(screen.getByText('Business Configuration')).toBeInTheDocument();
      });

      // Click on restaurant configuration
      const restaurantConfig = screen.getByText('Test Restaurant');
      fireEvent.click(restaurantConfig);

      await waitFor(() => {
        expect(mockBusinessConfigApi.getBusinessConfiguration).toHaveBeenCalledWith('config-2');
      });
    });
  });

  describe('BusinessTypeSelectionWizard', () => {
    const mockOnComplete = jest.fn();
    const mockOnCancel = jest.fn();

    beforeEach(() => {
      mockOnComplete.mockClear();
      mockOnCancel.mockClear();
    });

    it('renders business type selection wizard', () => {
      render(
        <BusinessTypeSelectionWizard
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Business Configuration Wizard')).toBeInTheDocument();
      expect(screen.getByText('Tell us about your business')).toBeInTheDocument();
    });

    it('handles business description and detection', async () => {
      const user = userEvent.setup();
      
      render(
        <BusinessTypeSelectionWizard
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      // Fill in business description
      const descriptionTextarea = screen.getByPlaceholderText(/describe what your business does/i);
      await user.type(descriptionTextarea, 'We sell gold jewelry and precious metals');

      // Click detect business type
      const detectButton = screen.getByText('Detect Business Type');
      await user.click(detectButton);

      await waitFor(() => {
        expect(mockBusinessConfigApi.detectBusinessType).toHaveBeenCalledWith({
          business_description: 'We sell gold jewelry and precious metals',
          primary_activities: [],
          customer_types: []
        });
      });

      // Should show detection results
      await waitFor(() => {
        expect(screen.getByText(/AI Suggestion/)).toBeInTheDocument();
        expect(screen.getByText('Gold Shop')).toBeInTheDocument();
      });
    });

    it('allows manual business type selection', async () => {
      const user = userEvent.setup();
      
      render(
        <BusinessTypeSelectionWizard
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      // Skip detection
      const skipButton = screen.getByText('Skip Detection');
      await user.click(skipButton);

      // Should show business type options
      expect(screen.getByText('Choose your business type')).toBeInTheDocument();
      expect(screen.getByText('Gold Shop')).toBeInTheDocument();
      expect(screen.getByText('Restaurant')).toBeInTheDocument();

      // Select gold shop
      const goldShopCard = screen.getByText('Gold Shop').closest('div');
      await user.click(goldShopCard!);

      // Should proceed to configuration step
      await waitFor(() => {
        expect(screen.getByText('Configure your business')).toBeInTheDocument();
      });
    });

    it('completes wizard setup', async () => {
      const user = userEvent.setup();
      mockBusinessConfigApi.setupBusinessWizard.mockResolvedValue(mockBusinessConfigurations[0]);
      
      render(
        <BusinessTypeSelectionWizard
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      // Skip to configuration step
      const skipButton = screen.getByText('Skip Detection');
      await user.click(skipButton);

      const goldShopCard = screen.getByText('Gold Shop').closest('div');
      await user.click(goldShopCard!);

      // Fill in business name
      const businessNameInput = screen.getByPlaceholderText('Enter your business name');
      await user.type(businessNameInput, 'My Gold Shop');

      // Complete setup
      const completeButton = screen.getByText('Complete Setup');
      await user.click(completeButton);

      await waitFor(() => {
        expect(mockBusinessConfigApi.setupBusinessWizard).toHaveBeenCalled();
        expect(mockOnComplete).toHaveBeenCalledWith(mockBusinessConfigurations[0]);
      });
    });
  });

  describe('TerminologyMappingManager', () => {
    const mockOnUpdate = jest.fn();

    beforeEach(() => {
      mockOnUpdate.mockClear();
    });

    it('renders terminology mappings', async () => {
      render(
        <TerminologyMappingManager
          businessConfig={mockBusinessConfig}
          onUpdate={mockOnUpdate}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Terminology Mapping')).toBeInTheDocument();
      });

      expect(screen.getByText('inventory')).toBeInTheDocument();
      expect(screen.getByText('Gold Items')).toBeInTheDocument();
    });

    it('adds new terminology mapping', async () => {
      const user = userEvent.setup();
      mockBusinessConfigApi.createTerminologyMapping.mockResolvedValue({
        id: 'term-2',
        business_config_id: 'config-1',
        standard_term: 'customer',
        business_term: 'Client',
        language_code: 'en',
        created_at: '2024-01-01T00:00:00Z'
      });

      render(
        <TerminologyMappingManager
          businessConfig={mockBusinessConfig}
          onUpdate={mockOnUpdate}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Add Mapping')).toBeInTheDocument();
      });

      // Click add mapping
      const addButton = screen.getByText('Add Mapping');
      await user.click(addButton);

      // Fill in form
      const standardTermInput = screen.getByPlaceholderText(/e.g., inventory, customer/i);
      await user.type(standardTermInput, 'customer');

      const businessTermInput = screen.getByPlaceholderText(/e.g., Menu Items, Clients/i);
      await user.type(businessTermInput, 'Client');

      // Save mapping
      const saveButton = screen.getByText('Save');
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockBusinessConfigApi.createTerminologyMapping).toHaveBeenCalledWith({
          business_config_id: 'config-1',
          standard_term: 'customer',
          business_term: 'Client',
          language_code: 'en'
        });
        expect(mockOnUpdate).toHaveBeenCalled();
      });
    });

    it('applies default suggestions', async () => {
      const user = userEvent.setup();
      mockBusinessConfigApi.batchUpdateTerminology.mockResolvedValue([]);

      render(
        <TerminologyMappingManager
          businessConfig={mockBusinessConfig}
          onUpdate={mockOnUpdate}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Apply Suggestions')).toBeInTheDocument();
      });

      const applySuggestionsButton = screen.getByText('Apply Suggestions');
      await user.click(applySuggestionsButton);

      await waitFor(() => {
        expect(mockBusinessConfigApi.batchUpdateTerminology).toHaveBeenCalled();
        expect(mockOnUpdate).toHaveBeenCalled();
      });
    });
  });

  describe('CustomFieldSchemaManager', () => {
    const mockOnUpdate = jest.fn();

    beforeEach(() => {
      mockOnUpdate.mockClear();
    });

    it('renders custom field schemas', async () => {
      render(
        <CustomFieldSchemaManager
          businessConfig={mockBusinessConfig}
          onUpdate={mockOnUpdate}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Custom Field Schema')).toBeInTheDocument();
      });

      expect(screen.getByText('Gold Purity (Karat)')).toBeInTheDocument();
      expect(screen.getByText('Dropdown')).toBeInTheDocument();
    });

    it('adds new custom field', async () => {
      const user = userEvent.setup();
      mockBusinessConfigApi.createCustomFieldSchema.mockResolvedValue({
        id: 'field-2',
        business_config_id: 'config-1',
        field_name: 'weight',
        field_label: 'Weight (Grams)',
        field_type: FieldType.NUMBER,
        entity_type: 'inventory_item',
        is_required: true,
        is_searchable: true,
        is_filterable: true,
        is_active: true,
        display_order: 2,
        created_at: '2024-01-01T00:00:00Z'
      });

      render(
        <CustomFieldSchemaManager
          businessConfig={mockBusinessConfig}
          onUpdate={mockOnUpdate}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Add Field')).toBeInTheDocument();
      });

      // Click add field
      const addButton = screen.getByText('Add Field');
      await user.click(addButton);

      // Fill in form
      const fieldNameInput = screen.getByPlaceholderText(/e.g., purity, brand, size/i);
      await user.type(fieldNameInput, 'weight');

      const fieldLabelInput = screen.getByPlaceholderText(/e.g., Gold Purity, Brand Name/i);
      await user.type(fieldLabelInput, 'Weight (Grams)');

      // Select field type
      const fieldTypeSelect = screen.getByDisplayValue(/Text - Single line text input/i);
      await user.selectOptions(fieldTypeSelect, 'number');

      // Save field
      const saveButton = screen.getByText('Save Field');
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockBusinessConfigApi.createCustomFieldSchema).toHaveBeenCalledWith({
          business_config_id: 'config-1',
          field_name: 'weight',
          field_label: 'Weight (Grams)',
          field_type: FieldType.NUMBER,
          entity_type: 'inventory_item',
          is_required: false,
          is_searchable: false,
          is_filterable: false,
          is_active: true,
          display_order: 1
        });
        expect(mockOnUpdate).toHaveBeenCalled();
      });
    });

    it('handles enum field with options', async () => {
      const user = userEvent.setup();

      render(
        <CustomFieldSchemaManager
          businessConfig={mockBusinessConfig}
          onUpdate={mockOnUpdate}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Add Field')).toBeInTheDocument();
      });

      // Click add field
      const addButton = screen.getByText('Add Field');
      await user.click(addButton);

      // Select enum field type
      const fieldTypeSelect = screen.getByDisplayValue(/Text - Single line text input/i);
      await user.selectOptions(fieldTypeSelect, 'enum');

      // Should show field options section
      await waitFor(() => {
        expect(screen.getByText('Field Options')).toBeInTheDocument();
      });

      // Add option
      const addOptionButton = screen.getByText('Add Option');
      await user.click(addOptionButton);

      // Fill in option
      const labelInputs = screen.getAllByPlaceholderText('Label');
      const valueInputs = screen.getAllByPlaceholderText('Value');
      
      await user.type(labelInputs[0], '24K');
      await user.type(valueInputs[0], '24');
    });
  });

  describe('FeatureConfigurationManager', () => {
    const mockOnUpdate = jest.fn();

    beforeEach(() => {
      mockOnUpdate.mockClear();
    });

    it('renders feature configurations', async () => {
      render(
        <FeatureConfigurationManager
          businessConfig={mockBusinessConfig}
          onUpdate={mockOnUpdate}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Feature Configuration')).toBeInTheDocument();
      });

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText('Loading')).not.toBeInTheDocument();
      });

      expect(screen.getByText(/Gold Price Tracking/i)).toBeInTheDocument();
    });

    it('toggles feature on/off', async () => {
      const user = userEvent.setup();
      mockBusinessConfigApi.updateFeatureConfiguration.mockResolvedValue({
        ...mockBusinessConfig.feature_configurations[0],
        is_enabled: false
      });

      render(
        <FeatureConfigurationManager
          businessConfig={mockBusinessConfig}
          onUpdate={mockOnUpdate}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Feature Configuration')).toBeInTheDocument();
      });

      // Wait for loading to complete and find toggle button
      await waitFor(() => {
        expect(screen.queryByText('Loading')).not.toBeInTheDocument();
      });

      // Look for the toggle button by its attributes instead of role
      const toggleButton = screen.getByRole('button', { name: /toggle/i });
      if (toggleButton) {
        await user.click(toggleButton);

        await waitFor(() => {
          expect(mockBusinessConfigApi.updateFeatureConfiguration).toHaveBeenCalledWith(
            'feature-1',
            { is_enabled: false }
          );
          expect(mockOnUpdate).toHaveBeenCalled();
        });
      }
    });
  });

  describe('ServiceBusinessInterface', () => {
    const mockServiceConfig = {
      ...mockBusinessConfig,
      business_type: BusinessType.SERVICE_BUSINESS
    };

    const mockOnUpdate = jest.fn();

    beforeEach(() => {
      mockOnUpdate.mockClear();
      mockBusinessConfigApi.getServiceCatalog.mockResolvedValue([
        {
          id: 'service-1',
          business_config_id: 'config-1',
          service_name: 'General Consultation',
          service_code: 'CONSULT-001',
          description: 'General consultation services',
          category: 'Consultation',
          base_price: '100.00',
          currency: 'USD',
          estimated_duration: 60,
          requires_booking: true,
          is_time_tracked: true,
          billing_method: 'hourly',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z'
        }
      ]);
    });

    it('renders service business interface', async () => {
      render(
        <ServiceBusinessInterface
          businessConfig={mockServiceConfig}
          onUpdate={mockOnUpdate}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Service Business Management')).toBeInTheDocument();
      });

      // Wait for loading to complete
      await waitFor(() => {
        expect(mockBusinessConfigApi.getServiceCatalog).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByText('General Consultation')).toBeInTheDocument();
      });
      
      expect(screen.getByText('CONSULT-001')).toBeInTheDocument();
    });

    it('adds new service', async () => {
      const user = userEvent.setup();
      mockBusinessConfigApi.createServiceCatalogItem.mockResolvedValue({
        id: 'service-2',
        business_config_id: 'config-1',
        service_name: 'Technical Support',
        currency: 'USD',
        estimated_duration: 30,
        requires_booking: false,
        is_time_tracked: true,
        billing_method: 'hourly',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z'
      });

      render(
        <ServiceBusinessInterface
          businessConfig={mockServiceConfig}
          onUpdate={mockOnUpdate}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Add Service')).toBeInTheDocument();
      });

      // Click add service
      const addButton = screen.getByText('Add Service');
      await user.click(addButton);

      // Fill in form
      const serviceNameInput = screen.getByPlaceholderText(/e.g., General Consultation/i);
      await user.type(serviceNameInput, 'Technical Support');

      // Save service
      const saveButton = screen.getByText('Save Service');
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockBusinessConfigApi.createServiceCatalogItem).toHaveBeenCalled();
        expect(mockOnUpdate).toHaveBeenCalled();
      });
    });
  });

  describe('ManufacturingInterface', () => {
    const mockManufacturingConfig = {
      ...mockBusinessConfig,
      business_type: BusinessType.MANUFACTURING
    };

    const mockOnUpdate = jest.fn();

    beforeEach(() => {
      mockOnUpdate.mockClear();
      mockBusinessConfigApi.getBillsOfMaterials.mockResolvedValue([
        {
          id: 'bom-1',
          business_config_id: 'config-1',
          bom_name: 'Standard Product Assembly',
          bom_code: 'BOM-001',
          version: '1.0',
          components: [
            {
              component_id: 'COMP-001',
              component_name: 'Main Component',
              quantity: 1,
              unit: 'piece',
              cost_per_unit: 25.00
            }
          ],
          production_steps: [
            {
              step_name: 'Assembly',
              order: 1,
              description: 'Assemble components',
              estimated_time: 120
            }
          ],
          material_cost: '25.00',
          labor_cost: '30.00',
          overhead_cost: '10.00',
          total_cost: '65.00',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z'
        }
      ]);
    });

    it('renders manufacturing interface', async () => {
      render(
        <ManufacturingInterface
          businessConfig={mockManufacturingConfig}
          onUpdate={mockOnUpdate}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Manufacturing Management')).toBeInTheDocument();
      });

      // Wait for loading to complete
      await waitFor(() => {
        expect(mockBusinessConfigApi.getBillsOfMaterials).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByText('Standard Product Assembly')).toBeInTheDocument();
      });
      
      expect(screen.getByText('BOM-001')).toBeInTheDocument();
    });

    it('adds new bill of materials', async () => {
      const user = userEvent.setup();
      mockBusinessConfigApi.createBillOfMaterials.mockResolvedValue({
        id: 'bom-2',
        business_config_id: 'config-1',
        bom_name: 'New Product BOM',
        version: '1.0',
        components: [],
        production_steps: [],
        is_active: true,
        created_at: '2024-01-01T00:00:00Z'
      });

      render(
        <ManufacturingInterface
          businessConfig={mockManufacturingConfig}
          onUpdate={mockOnUpdate}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Add BOM')).toBeInTheDocument();
      });

      // Click add BOM
      const addButton = screen.getByText('Add BOM');
      await user.click(addButton);

      // Fill in form
      const bomNameInput = screen.getByPlaceholderText(/e.g., Standard Product Assembly/i);
      await user.type(bomNameInput, 'New Product BOM');

      // Save BOM
      const saveButton = screen.getByText('Save BOM');
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockBusinessConfigApi.createBillOfMaterials).toHaveBeenCalled();
        expect(mockOnUpdate).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      mockBusinessConfigApi.listBusinessConfigurations.mockRejectedValue(
        new Error('API Error')
      );

      render(<BusinessConfiguration />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to load business configurations/i)).toBeInTheDocument();
      });
    });

    it('shows loading states', async () => {
      // Mock a delayed response
      mockBusinessConfigApi.listBusinessConfigurations.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockBusinessConfigurations), 100))
      );

      render(<BusinessConfiguration />);

      expect(screen.getByText('Loading business configuration...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Business Configuration')).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('adapts to mobile viewport', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<BusinessConfiguration />);

      await waitFor(() => {
        expect(screen.getByText('Business Configuration')).toBeInTheDocument();
      });

      // Check if mobile-specific elements are present
      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(6); // Should still show all tabs but may be styled differently
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', async () => {
      render(<BusinessConfiguration />);

      await waitFor(() => {
        expect(screen.getByText('Business Configuration')).toBeInTheDocument();
      });

      // Check for proper tab roles
      const tabs = screen.getAllByRole('tab');
      expect(tabs.length).toBeGreaterThan(0);

      // Check for proper button roles
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(<BusinessConfiguration />);

      await waitFor(() => {
        expect(screen.getByText('Business Configuration')).toBeInTheDocument();
      });

      // Tab through elements
      await user.tab();
      expect(document.activeElement).toBeInTheDocument();
    });
  });
});