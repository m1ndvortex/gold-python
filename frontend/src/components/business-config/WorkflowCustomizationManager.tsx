/**
 * Workflow Customization Manager
 * 
 * Interface for customizing business workflows for different business types
 * including invoice workflows, inventory workflows, and approval processes.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Workflow, 
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Settings,
  Users,
  Bell,
  Play,
  Pause
} from 'lucide-react';

import {
  ComprehensiveBusinessConfig,
  WorkflowConfiguration,
  WorkflowConfigurationCreate,
  WorkflowType,
  WorkflowStage,
  WorkflowRule,
  ApprovalRequirement,
  NotificationSetting,
  BusinessType
} from '../../types/businessConfig';
import { businessConfigApi } from '../../services/businessConfigApi';

interface WorkflowCustomizationManagerProps {
  businessConfig: ComprehensiveBusinessConfig;
  onUpdate: () => void;
}

interface WorkflowFormData {
  workflow_type: WorkflowType;
  workflow_name: string;
  stages: WorkflowStage[];
  rules: WorkflowRule[];
  approvals: ApprovalRequirement[];
  notifications: NotificationSetting[];
  is_active: boolean;
  is_required: boolean;
}

const defaultWorkflowTemplates: Record<BusinessType, Array<{
  workflow_type: WorkflowType;
  workflow_name: string;
  stages: WorkflowStage[];
  rules: WorkflowRule[];
  approvals: ApprovalRequirement[];
}>> = {
  [BusinessType.GOLD_SHOP]: [
    {
      workflow_type: WorkflowType.INVOICE_WORKFLOW,
      workflow_name: 'Gold Invoice Workflow',
      stages: [
        { name: 'draft', order: 1, is_required: true },
        { name: 'price_calculation', order: 2, is_required: true },
        { name: 'approval', order: 3, is_required: false },
        { name: 'finalized', order: 4, is_required: true }
      ],
      rules: [
        {
          name: 'require_weight_and_purity',
          condition: { field: 'invoice_type', operator: 'equals', value: 'gold' },
          action: { type: 'validate_fields', fields: ['weight', 'purity'] },
          is_active: true
        }
      ],
      approvals: [
        {
          stage: 'approval',
          required_role: 'manager',
          is_required: false,
          conditions: { amount_threshold: 10000 }
        }
      ]
    }
  ],
  [BusinessType.RESTAURANT]: [
    {
      workflow_type: WorkflowType.INVOICE_WORKFLOW,
      workflow_name: 'Order Processing Workflow',
      stages: [
        { name: 'order_taken', order: 1, is_required: true },
        { name: 'kitchen_preparation', order: 2, is_required: true },
        { name: 'ready_for_service', order: 3, is_required: true },
        { name: 'served', order: 4, is_required: true },
        { name: 'payment', order: 5, is_required: true }
      ],
      rules: [
        {
          name: 'notify_kitchen',
          condition: { stage: 'order_taken' },
          action: { type: 'send_notification', target: 'kitchen' },
          is_active: true
        }
      ],
      approvals: []
    }
  ],
  [BusinessType.SERVICE_BUSINESS]: [
    {
      workflow_type: WorkflowType.INVOICE_WORKFLOW,
      workflow_name: 'Service Invoice Workflow',
      stages: [
        { name: 'service_request', order: 1, is_required: true },
        { name: 'time_tracking', order: 2, is_required: true },
        { name: 'service_completion', order: 3, is_required: true },
        { name: 'invoice_generation', order: 4, is_required: true },
        { name: 'payment', order: 5, is_required: true }
      ],
      rules: [
        {
          name: 'require_time_tracking',
          condition: { service_type: 'hourly' },
          action: { type: 'validate_time_entries' },
          is_active: true
        }
      ],
      approvals: [
        {
          stage: 'service_completion',
          required_role: 'supervisor',
          is_required: true
        }
      ]
    }
  ],
  [BusinessType.MANUFACTURING]: [
    {
      workflow_type: WorkflowType.INVOICE_WORKFLOW,
      workflow_name: 'Production Order Workflow',
      stages: [
        { name: 'order_received', order: 1, is_required: true },
        { name: 'material_allocation', order: 2, is_required: true },
        { name: 'production_planning', order: 3, is_required: true },
        { name: 'production', order: 4, is_required: true },
        { name: 'quality_control', order: 5, is_required: true },
        { name: 'shipping', order: 6, is_required: true }
      ],
      rules: [
        {
          name: 'check_material_availability',
          condition: { stage: 'material_allocation' },
          action: { type: 'validate_inventory' },
          is_active: true
        }
      ],
      approvals: [
        {
          stage: 'production_planning',
          required_role: 'production_manager',
          is_required: true
        }
      ]
    }
  ],
  [BusinessType.RETAIL_STORE]: [
    {
      workflow_type: WorkflowType.INVOICE_WORKFLOW,
      workflow_name: 'Point of Sale Workflow',
      stages: [
        { name: 'item_scanning', order: 1, is_required: true },
        { name: 'discount_application', order: 2, is_required: false },
        { name: 'payment_processing', order: 3, is_required: true },
        { name: 'receipt_generation', order: 4, is_required: true }
      ],
      rules: [
        {
          name: 'inventory_deduction',
          condition: { stage: 'payment_processing', status: 'completed' },
          action: { type: 'update_inventory' },
          is_active: true
        }
      ],
      approvals: []
    }
  ],
  [BusinessType.WHOLESALE]: [
    {
      workflow_type: WorkflowType.INVOICE_WORKFLOW,
      workflow_name: 'Wholesale Order Workflow',
      stages: [
        { name: 'order_received', order: 1, is_required: true },
        { name: 'credit_check', order: 2, is_required: true },
        { name: 'inventory_allocation', order: 3, is_required: true },
        { name: 'picking_packing', order: 4, is_required: true },
        { name: 'shipping', order: 5, is_required: true },
        { name: 'invoicing', order: 6, is_required: true }
      ],
      rules: [
        {
          name: 'bulk_pricing',
          condition: { quantity_threshold: 100 },
          action: { type: 'apply_bulk_discount' },
          is_active: true
        }
      ],
      approvals: [
        {
          stage: 'credit_check',
          required_role: 'credit_manager',
          is_required: true,
          conditions: { credit_limit_exceeded: true }
        }
      ]
    }
  ],
  [BusinessType.PHARMACY]: [
    {
      workflow_type: WorkflowType.INVOICE_WORKFLOW,
      workflow_name: 'Prescription Processing Workflow',
      stages: [
        { name: 'prescription_received', order: 1, is_required: true },
        { name: 'pharmacist_review', order: 2, is_required: true },
        { name: 'medication_dispensing', order: 3, is_required: true },
        { name: 'patient_counseling', order: 4, is_required: true },
        { name: 'payment', order: 5, is_required: true }
      ],
      rules: [
        {
          name: 'verify_prescription',
          condition: { stage: 'prescription_received' },
          action: { type: 'validate_prescription' },
          is_active: true
        }
      ],
      approvals: [
        {
          stage: 'pharmacist_review',
          required_role: 'pharmacist',
          is_required: true
        }
      ]
    }
  ],
  [BusinessType.AUTOMOTIVE]: [
    {
      workflow_type: WorkflowType.INVOICE_WORKFLOW,
      workflow_name: 'Auto Service Workflow',
      stages: [
        { name: 'vehicle_inspection', order: 1, is_required: true },
        { name: 'estimate_approval', order: 2, is_required: true },
        { name: 'parts_ordering', order: 3, is_required: false },
        { name: 'repair_work', order: 4, is_required: true },
        { name: 'quality_check', order: 5, is_required: true },
        { name: 'customer_pickup', order: 6, is_required: true }
      ],
      rules: [
        {
          name: 'estimate_approval_required',
          condition: { estimate_amount: { greater_than: 500 } },
          action: { type: 'require_customer_approval' },
          is_active: true
        }
      ],
      approvals: [
        {
          stage: 'estimate_approval',
          required_role: 'customer',
          is_required: true
        }
      ]
    }
  ],
  [BusinessType.GROCERY_STORE]: [],
  [BusinessType.CLOTHING_STORE]: [],
  [BusinessType.ELECTRONICS_STORE]: [],
  [BusinessType.CUSTOM]: []
};

export const WorkflowCustomizationManager: React.FC<WorkflowCustomizationManagerProps> = ({
  businessConfig,
  onUpdate
}) => {
  const [workflows, setWorkflows] = useState<WorkflowConfiguration[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingWorkflow, setEditingWorkflow] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  const [formData, setFormData] = useState<WorkflowFormData>({
    workflow_type: WorkflowType.INVOICE_WORKFLOW,
    workflow_name: '',
    stages: [],
    rules: [],
    approvals: [],
    notifications: [],
    is_active: true,
    is_required: false
  });

  useEffect(() => {
    loadWorkflowConfigurations();
  }, [businessConfig.id]);

  const loadWorkflowConfigurations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await businessConfigApi.getWorkflowConfigurations(businessConfig.id);
      setWorkflows(data);
    } catch (err) {
      console.error('Failed to load workflow configurations:', err);
      setError('Failed to load workflow configurations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWorkflow = async () => {
    if (!formData.workflow_name.trim()) {
      setError('Workflow name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const workflowData: WorkflowConfigurationCreate = {
        business_config_id: businessConfig.id,
        workflow_type: formData.workflow_type,
        workflow_name: formData.workflow_name.trim(),
        stages: formData.stages,
        rules: formData.rules,
        approvals: formData.approvals,
        notifications: formData.notifications,
        is_active: formData.is_active,
        is_required: formData.is_required
      };

      await businessConfigApi.createWorkflowConfiguration(workflowData);
      await loadWorkflowConfigurations();
      resetForm();
      onUpdate();
    } catch (err) {
      console.error('Failed to save workflow configuration:', err);
      setError('Failed to save workflow configuration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      workflow_type: WorkflowType.INVOICE_WORKFLOW,
      workflow_name: '',
      stages: [],
      rules: [],
      approvals: [],
      notifications: [],
      is_active: true,
      is_required: false
    });
    setEditingWorkflow(null);
    setShowAddForm(false);
  };

  const handleApplyTemplates = async () => {
    const templates = defaultWorkflowTemplates[businessConfig.business_type] || [];
    
    try {
      setLoading(true);
      setError(null);

      for (const template of templates) {
        const workflowData: WorkflowConfigurationCreate = {
          business_config_id: businessConfig.id,
          ...template,
          is_active: true,
          is_required: false
        };
        await businessConfigApi.createWorkflowConfiguration(workflowData);
      }

      await loadWorkflowConfigurations();
      onUpdate();
    } catch (err) {
      console.error('Failed to apply workflow templates:', err);
      setError('Failed to apply workflow templates. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addStage = () => {
    const newStage: WorkflowStage = {
      name: '',
      order: formData.stages.length + 1,
      is_required: true,
      conditions: {}
    };
    setFormData(prev => ({
      ...prev,
      stages: [...prev.stages, newStage]
    }));
  };

  const updateStage = (index: number, field: keyof WorkflowStage, value: any) => {
    setFormData(prev => ({
      ...prev,
      stages: prev.stages.map((stage, i) => 
        i === index ? { ...stage, [field]: value } : stage
      )
    }));
  };

  const removeStage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      stages: prev.stages.filter((_, i) => i !== index)
    }));
  };

  const filteredWorkflows = workflows.filter(workflow => {
    const matchesSearch = workflow.workflow_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || workflow.workflow_type === selectedType;
    return matchesSearch && matchesType;
  });

  const workflowTypes = Object.values(WorkflowType);

  const getWorkflowTypeLabel = (type: WorkflowType) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getBusinessTypeLabel = (businessType: BusinessType) => {
    return businessType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Workflow className="h-6 w-6 text-blue-600" />
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Workflow Customization</h2>
            <p className="text-sm text-slate-600">
              Configure business workflows for {getBusinessTypeLabel(businessConfig.business_type)}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={handleApplyTemplates}
            disabled={loading}
          >
            Apply Templates
          </Button>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Workflow
          </Button>
        </div>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-slate-50 to-slate-100">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search workflows..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-slate-600" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-md text-sm"
              >
                <option value="all">All Types</option>
                {workflowTypes.map(type => (
                  <option key={type} value={type}>
                    {getWorkflowTypeLabel(type)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Form */}
      {showAddForm && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg">
              {editingWorkflow ? 'Edit Workflow' : 'Add New Workflow'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="workflow-name">Workflow Name *</Label>
                <Input
                  id="workflow-name"
                  value={formData.workflow_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, workflow_name: e.target.value }))}
                  placeholder="e.g., Invoice Processing Workflow"
                />
              </div>
              <div>
                <Label htmlFor="workflow-type">Workflow Type *</Label>
                <select
                  id="workflow-type"
                  value={formData.workflow_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, workflow_type: e.target.value as WorkflowType }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                >
                  {workflowTypes.map(type => (
                    <option key={type} value={type}>
                      {getWorkflowTypeLabel(type)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is-active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: !!checked }))}
                />
                <Label htmlFor="is-active">Active</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is-required"
                  checked={formData.is_required}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_required: !!checked }))}
                />
                <Label htmlFor="is-required">Required</Label>
              </div>
            </div>

            {/* Workflow Stages */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label>Workflow Stages</Label>
                <Button variant="outline" size="sm" onClick={addStage}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Stage
                </Button>
              </div>
              <div className="space-y-3">
                {formData.stages.map((stage, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg">
                    <div className="flex-1 grid grid-cols-3 gap-3">
                      <Input
                        placeholder="Stage name"
                        value={stage.name}
                        onChange={(e) => updateStage(index, 'name', e.target.value)}
                      />
                      <Input
                        type="number"
                        placeholder="Order"
                        value={stage.order}
                        onChange={(e) => updateStage(index, 'order', parseInt(e.target.value))}
                      />
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={stage.is_required}
                          onCheckedChange={(checked) => updateStage(index, 'is_required', !!checked)}
                        />
                        <Label className="text-sm">Required</Label>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeStage(index)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
                {formData.stages.length === 0 && (
                  <div className="text-center py-4 text-slate-500">
                    No stages defined. Click "Add Stage" to get started.
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={resetForm}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSaveWorkflow} disabled={loading}>
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Workflow
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workflows List */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Workflow Configurations</span>
            <Badge variant="secondary">{filteredWorkflows.length} workflows</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && !showAddForm ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : filteredWorkflows.length === 0 ? (
            <div className="text-center py-8">
              <Workflow className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No Workflows Configured</h3>
              <p className="text-slate-600 mb-4">
                {searchTerm || selectedType !== 'all' 
                  ? 'No workflows match your current filters.'
                  : 'Start by adding workflow configurations for your business processes.'
                }
              </p>
              {!searchTerm && selectedType === 'all' && (
                <Button onClick={handleApplyTemplates} disabled={loading}>
                  Apply Default Templates
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredWorkflows.map((workflow) => (
                <Card key={workflow.id} className="border border-slate-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-slate-900">{workflow.workflow_name}</h3>
                          <Badge variant="outline">
                            {getWorkflowTypeLabel(workflow.workflow_type)}
                          </Badge>
                          {workflow.is_active ? (
                            <Badge className="bg-green-100 text-green-800">
                              <Play className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <Pause className="h-3 w-3 mr-1" />
                              Inactive
                            </Badge>
                          )}
                          {workflow.is_required && (
                            <Badge className="bg-orange-100 text-orange-800">Required</Badge>
                          )}
                        </div>
                        
                        {/* Workflow Stages */}
                        {workflow.stages.length > 0 && (
                          <div className="mb-3">
                            <p className="text-sm font-medium text-slate-700 mb-2">Stages:</p>
                            <div className="flex items-center space-x-2 flex-wrap">
                              {workflow.stages
                                .sort((a, b) => a.order - b.order)
                                .map((stage, index) => (
                                  <React.Fragment key={stage.name}>
                                    <Badge 
                                      variant={stage.is_required ? "default" : "secondary"}
                                      className="text-xs"
                                    >
                                      {stage.name}
                                    </Badge>
                                    {index < workflow.stages.length - 1 && (
                                      <ArrowRight className="h-3 w-3 text-slate-400" />
                                    )}
                                  </React.Fragment>
                                ))}
                            </div>
                          </div>
                        )}

                        {/* Additional Info */}
                        <div className="flex items-center space-x-4 text-sm text-slate-600">
                          {workflow.rules.length > 0 && (
                            <div className="flex items-center space-x-1">
                              <Settings className="h-4 w-4" />
                              <span>{workflow.rules.length} rules</span>
                            </div>
                          )}
                          {workflow.approvals.length > 0 && (
                            <div className="flex items-center space-x-1">
                              <Users className="h-4 w-4" />
                              <span>{workflow.approvals.length} approvals</span>
                            </div>
                          )}
                          {workflow.notifications.length > 0 && (
                            <div className="flex items-center space-x-1">
                              <Bell className="h-4 w-4" />
                              <span>{workflow.notifications.length} notifications</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};