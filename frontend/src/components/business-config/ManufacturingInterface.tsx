/**
 * Manufacturing Interface
 * 
 * Specialized interface for manufacturing businesses with bill of materials,
 * production tracking, and quality control features.
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
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  Factory,
  Package,
  Cog,
  ClipboardList,
  BarChart3,
  Users,
  Settings,
  Play,
  Pause,
  Timer,
  Wrench,
  Target,
  TrendingUp
} from 'lucide-react';

import {
  ComprehensiveBusinessConfig,
  BillOfMaterials,
  ProductionTracking,
  BOMComponent,
  ProductionStep
} from '../../types/businessConfig';
import { businessConfigApi } from '../../services/businessConfigApi';

interface ManufacturingInterfaceProps {
  businessConfig: ComprehensiveBusinessConfig;
  onUpdate: () => void;
}

interface BOMFormData {
  bom_name: string;
  bom_code: string;
  product_id: string;
  version: string;
  components: BOMComponent[];
  production_steps: ProductionStep[];
  material_cost: string;
  labor_cost: string;
  overhead_cost: string;
  is_active: boolean;
}

interface ProductionFormData {
  production_order: string;
  bom_id: string;
  product_id: string;
  planned_quantity: number;
  status: string;
  start_date: string;
  end_date: string;
}

const productionStatuses = [
  { value: 'planned', label: 'Planned', color: 'bg-blue-100 text-blue-800' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'quality_check', label: 'Quality Check', color: 'bg-purple-100 text-purple-800' },
  { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
  { value: 'on_hold', label: 'On Hold', color: 'bg-orange-100 text-orange-800' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' }
];

const defaultBOMs = [
  {
    bom_name: 'Standard Product Assembly',
    bom_code: 'BOM-001',
    product_id: 'PROD-001',
    version: '1.0',
    components: [
      {
        component_id: 'COMP-001',
        component_name: 'Main Component',
        quantity: 1,
        unit: 'piece',
        cost_per_unit: 25.00
      },
      {
        component_id: 'COMP-002',
        component_name: 'Secondary Component',
        quantity: 2,
        unit: 'piece',
        cost_per_unit: 10.00
      }
    ],
    production_steps: [
      {
        step_name: 'Preparation',
        order: 1,
        description: 'Prepare materials and workspace',
        estimated_time: 30,
        required_skills: ['basic_assembly']
      },
      {
        step_name: 'Assembly',
        order: 2,
        description: 'Assemble main components',
        estimated_time: 120,
        required_skills: ['assembly', 'quality_control']
      },
      {
        step_name: 'Quality Check',
        order: 3,
        description: 'Final quality inspection',
        estimated_time: 15,
        required_skills: ['quality_control']
      }
    ],
    material_cost: '45.00',
    labor_cost: '30.00',
    overhead_cost: '10.00'
  }
];

export const ManufacturingInterface: React.FC<ManufacturingInterfaceProps> = ({
  businessConfig,
  onUpdate
}) => {
  const [boms, setBOMs] = useState<BillOfMaterials[]>([]);
  const [productions, setProductions] = useState<ProductionTracking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingBOM, setEditingBOM] = useState<string | null>(null);
  const [showAddBOMForm, setShowAddBOMForm] = useState(false);
  const [showAddProductionForm, setShowAddProductionForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('bom');

  const [bomFormData, setBOMFormData] = useState<BOMFormData>({
    bom_name: '',
    bom_code: '',
    product_id: '',
    version: '1.0',
    components: [],
    production_steps: [],
    material_cost: '',
    labor_cost: '',
    overhead_cost: '',
    is_active: true
  });

  const [productionFormData, setProductionFormData] = useState<ProductionFormData>({
    production_order: '',
    bom_id: '',
    product_id: '',
    planned_quantity: 1,
    status: 'planned',
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    if (activeTab === 'bom') {
      loadBillsOfMaterials();
    } else if (activeTab === 'production') {
      loadProductionTracking();
    }
  }, [businessConfig.id, activeTab]);

  const loadBillsOfMaterials = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await businessConfigApi.getBillsOfMaterials(businessConfig.id);
      setBOMs(data);
    } catch (err) {
      console.error('Failed to load bills of materials:', err);
      setError('Failed to load bills of materials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadProductionTracking = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await businessConfigApi.getProductionTracking(businessConfig.id);
      setProductions(data);
    } catch (err) {
      console.error('Failed to load production tracking:', err);
      setError('Failed to load production tracking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBOM = async () => {
    if (!bomFormData.bom_name.trim()) {
      setError('BOM name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const bomData = {
        business_config_id: businessConfig.id,
        bom_name: bomFormData.bom_name.trim(),
        bom_code: bomFormData.bom_code.trim() || undefined,
        product_id: bomFormData.product_id.trim() || undefined,
        version: bomFormData.version,
        components: bomFormData.components,
        production_steps: bomFormData.production_steps,
        material_cost: bomFormData.material_cost || undefined,
        labor_cost: bomFormData.labor_cost || undefined,
        overhead_cost: bomFormData.overhead_cost || undefined,
        total_cost: calculateTotalCost(),
        is_active: bomFormData.is_active
      };

      await businessConfigApi.createBillOfMaterials(bomData);
      await loadBillsOfMaterials();
      resetBOMForm();
      onUpdate();
    } catch (err) {
      console.error('Failed to save BOM:', err);
      setError('Failed to save bill of materials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalCost = () => {
    const materialCost = parseFloat(bomFormData.material_cost) || 0;
    const laborCost = parseFloat(bomFormData.labor_cost) || 0;
    const overheadCost = parseFloat(bomFormData.overhead_cost) || 0;
    const componentsCost = bomFormData.components.reduce((total, comp) => 
      total + (comp.quantity * (comp.cost_per_unit || 0)), 0
    );
    return (materialCost + laborCost + overheadCost + componentsCost).toFixed(2);
  };

  const resetBOMForm = () => {
    setBOMFormData({
      bom_name: '',
      bom_code: '',
      product_id: '',
      version: '1.0',
      components: [],
      production_steps: [],
      material_cost: '',
      labor_cost: '',
      overhead_cost: '',
      is_active: true
    });
    setEditingBOM(null);
    setShowAddBOMForm(false);
  };

  const handleApplyDefaultBOMs = async () => {
    try {
      setLoading(true);
      setError(null);

      for (const bom of defaultBOMs) {
        const bomData = {
          business_config_id: businessConfig.id,
          ...bom,
          total_cost: '85.00',
          is_active: true
        };
        await businessConfigApi.createBillOfMaterials(bomData);
      }

      await loadBillsOfMaterials();
      onUpdate();
    } catch (err) {
      console.error('Failed to apply default BOMs:', err);
      setError('Failed to apply default BOMs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addComponent = () => {
    setBOMFormData(prev => ({
      ...prev,
      components: [...prev.components, {
        component_id: '',
        component_name: '',
        quantity: 1,
        unit: 'piece',
        cost_per_unit: 0
      }]
    }));
  };

  const updateComponent = (index: number, field: keyof BOMComponent, value: any) => {
    setBOMFormData(prev => ({
      ...prev,
      components: prev.components.map((comp, i) => 
        i === index ? { ...comp, [field]: value } : comp
      )
    }));
  };

  const removeComponent = (index: number) => {
    setBOMFormData(prev => ({
      ...prev,
      components: prev.components.filter((_, i) => i !== index)
    }));
  };

  const addProductionStep = () => {
    setBOMFormData(prev => ({
      ...prev,
      production_steps: [...prev.production_steps, {
        step_name: '',
        order: prev.production_steps.length + 1,
        description: '',
        estimated_time: 0,
        required_skills: []
      }]
    }));
  };

  const updateProductionStep = (index: number, field: keyof ProductionStep, value: any) => {
    setBOMFormData(prev => ({
      ...prev,
      production_steps: prev.production_steps.map((step, i) => 
        i === index ? { ...step, [field]: value } : step
      )
    }));
  };

  const removeProductionStep = (index: number) => {
    setBOMFormData(prev => ({
      ...prev,
      production_steps: prev.production_steps.filter((_, i) => i !== index)
    }));
  };

  const getStatusColor = (status: string) => {
    const statusInfo = productionStatuses.find(s => s.value === status);
    return statusInfo?.color || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const statusInfo = productionStatuses.find(s => s.value === status);
    return statusInfo?.label || status;
  };

  const filteredBOMs = boms.filter(bom => 
    bom.bom_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (bom.bom_code && bom.bom_code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredProductions = productions.filter(production => 
    production.production_order.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Factory className="h-6 w-6 text-blue-600" />
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Manufacturing Management</h2>
            <p className="text-sm text-slate-600">
              Manage bill of materials, production tracking, and quality control
            </p>
          </div>
        </div>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('bom')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'bom'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <ClipboardList className="h-4 w-4 inline mr-2" />
            Bill of Materials
          </button>
          <button
            onClick={() => setActiveTab('production')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'production'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Cog className="h-4 w-4 inline mr-2" />
            Production Tracking
          </button>
          <button
            onClick={() => setActiveTab('quality')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'quality'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Target className="h-4 w-4 inline mr-2" />
            Quality Control
          </button>
        </nav>
      </div>

      {/* Bill of Materials Tab */}
      {activeTab === 'bom' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search BOMs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={handleApplyDefaultBOMs}
                disabled={loading}
              >
                Add Default BOMs
              </Button>
              <Button onClick={() => setShowAddBOMForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add BOM
              </Button>
            </div>
          </div>

          {/* Add/Edit BOM Form */}
          {showAddBOMForm && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-lg">
                  {editingBOM ? 'Edit Bill of Materials' : 'Add New Bill of Materials'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bom-name">BOM Name *</Label>
                    <Input
                      id="bom-name"
                      value={bomFormData.bom_name}
                      onChange={(e) => setBOMFormData(prev => ({ ...prev, bom_name: e.target.value }))}
                      placeholder="e.g., Standard Product Assembly"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bom-code">BOM Code</Label>
                    <Input
                      id="bom-code"
                      value={bomFormData.bom_code}
                      onChange={(e) => setBOMFormData(prev => ({ ...prev, bom_code: e.target.value }))}
                      placeholder="e.g., BOM-001"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="product-id">Product ID</Label>
                    <Input
                      id="product-id"
                      value={bomFormData.product_id}
                      onChange={(e) => setBOMFormData(prev => ({ ...prev, product_id: e.target.value }))}
                      placeholder="e.g., PROD-001"
                    />
                  </div>
                  <div>
                    <Label htmlFor="version">Version</Label>
                    <Input
                      id="version"
                      value={bomFormData.version}
                      onChange={(e) => setBOMFormData(prev => ({ ...prev, version: e.target.value }))}
                      placeholder="e.g., 1.0"
                    />
                  </div>
                </div>

                {/* Components */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label>Components</Label>
                    <Button variant="outline" size="sm" onClick={addComponent}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Component
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {bomFormData.components.map((component, index) => (
                      <div key={index} className="grid grid-cols-5 gap-3 p-3 border border-slate-200 rounded-lg">
                        <Input
                          placeholder="Component ID"
                          value={component.component_id}
                          onChange={(e) => updateComponent(index, 'component_id', e.target.value)}
                        />
                        <Input
                          placeholder="Component Name"
                          value={component.component_name}
                          onChange={(e) => updateComponent(index, 'component_name', e.target.value)}
                        />
                        <Input
                          type="number"
                          placeholder="Quantity"
                          value={component.quantity}
                          onChange={(e) => updateComponent(index, 'quantity', parseInt(e.target.value) || 0)}
                        />
                        <Input
                          placeholder="Unit"
                          value={component.unit}
                          onChange={(e) => updateComponent(index, 'unit', e.target.value)}
                        />
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Cost"
                            value={component.cost_per_unit || ''}
                            onChange={(e) => updateComponent(index, 'cost_per_unit', parseFloat(e.target.value) || 0)}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeComponent(index)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Production Steps */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label>Production Steps</Label>
                    <Button variant="outline" size="sm" onClick={addProductionStep}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Step
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {bomFormData.production_steps.map((step, index) => (
                      <div key={index} className="p-3 border border-slate-200 rounded-lg space-y-3">
                        <div className="grid grid-cols-3 gap-3">
                          <Input
                            placeholder="Step Name"
                            value={step.step_name}
                            onChange={(e) => updateProductionStep(index, 'step_name', e.target.value)}
                          />
                          <Input
                            type="number"
                            placeholder="Order"
                            value={step.order}
                            onChange={(e) => updateProductionStep(index, 'order', parseInt(e.target.value) || 0)}
                          />
                          <div className="flex items-center space-x-2">
                            <Input
                              type="number"
                              placeholder="Time (min)"
                              value={step.estimated_time || ''}
                              onChange={(e) => updateProductionStep(index, 'estimated_time', parseInt(e.target.value) || 0)}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeProductionStep(index)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                        <Textarea
                          placeholder="Step Description"
                          value={step.description || ''}
                          onChange={(e) => updateProductionStep(index, 'description', e.target.value)}
                          rows={2}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cost Information */}
                <div>
                  <Label>Cost Breakdown</Label>
                  <div className="grid grid-cols-3 gap-4 mt-2">
                    <div>
                      <Label htmlFor="material-cost" className="text-sm">Material Cost</Label>
                      <Input
                        id="material-cost"
                        type="number"
                        step="0.01"
                        value={bomFormData.material_cost}
                        onChange={(e) => setBOMFormData(prev => ({ ...prev, material_cost: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="labor-cost" className="text-sm">Labor Cost</Label>
                      <Input
                        id="labor-cost"
                        type="number"
                        step="0.01"
                        value={bomFormData.labor_cost}
                        onChange={(e) => setBOMFormData(prev => ({ ...prev, labor_cost: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="overhead-cost" className="text-sm">Overhead Cost</Label>
                      <Input
                        id="overhead-cost"
                        type="number"
                        step="0.01"
                        value={bomFormData.overhead_cost}
                        onChange={(e) => setBOMFormData(prev => ({ ...prev, overhead_cost: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="mt-2 p-2 bg-slate-100 rounded">
                    <span className="text-sm font-medium">Total Estimated Cost: ${calculateTotalCost()}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is-active"
                    checked={bomFormData.is_active}
                    onCheckedChange={(checked) => setBOMFormData(prev => ({ ...prev, is_active: !!checked }))}
                  />
                  <Label htmlFor="is-active">Active</Label>
                </div>

                <div className="flex justify-end space-x-3">
                  <Button variant="outline" onClick={resetBOMForm}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={handleSaveBOM} disabled={loading}>
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save BOM
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* BOMs List */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Bills of Materials</span>
                <Badge variant="secondary">{filteredBOMs.length} BOMs</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading && !showAddBOMForm ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
              ) : filteredBOMs.length === 0 ? (
                <div className="text-center py-8">
                  <ClipboardList className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No Bills of Materials</h3>
                  <p className="text-slate-600 mb-4">
                    {searchTerm 
                      ? 'No BOMs match your search.'
                      : 'Start by creating bills of materials for your products.'
                    }
                  </p>
                  {!searchTerm && (
                    <Button onClick={handleApplyDefaultBOMs} disabled={loading}>
                      Add Default BOMs
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredBOMs.map((bom) => (
                    <Card key={bom.id} className="border border-slate-200">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="font-semibold text-slate-900">{bom.bom_name}</h3>
                              {bom.bom_code && (
                                <Badge variant="outline">{bom.bom_code}</Badge>
                              )}
                              <Badge variant="secondary">v{bom.version}</Badge>
                              {bom.is_active ? (
                                <Badge className="bg-green-100 text-green-800">Active</Badge>
                              ) : (
                                <Badge variant="secondary">Inactive</Badge>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                              <div>
                                <p className="text-sm font-medium text-slate-700">Components</p>
                                <p className="text-sm text-slate-600">{bom.components.length} items</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-700">Production Steps</p>
                                <p className="text-sm text-slate-600">{bom.production_steps.length} steps</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-700">Total Cost</p>
                                <p className="text-sm text-slate-600">${bom.total_cost || '0.00'}</p>
                              </div>
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
      )}

      {/* Production Tracking Tab */}
      {activeTab === 'production' && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-3">
              <Cog className="h-5 w-5 text-blue-600" />
              <span>Production Tracking</span>
            </CardTitle>
            <CardDescription>
              Track production orders and monitor manufacturing progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Cog className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Production Tracking</h3>
              <p className="text-slate-600 mb-4">
                Production tracking features will be available in a future update.
              </p>
              <p className="text-sm text-slate-500">
                This will include real-time production monitoring, progress tracking, and quality control integration.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quality Control Tab */}
      {activeTab === 'quality' && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-3">
              <Target className="h-5 w-5 text-blue-600" />
              <span>Quality Control</span>
            </CardTitle>
            <CardDescription>
              Manage quality control processes and inspection procedures
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Quality Control</h3>
              <p className="text-slate-600 mb-4">
                Quality control features will be available in a future update.
              </p>
              <p className="text-sm text-slate-500">
                This will include inspection checklists, quality metrics tracking, and defect management.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};