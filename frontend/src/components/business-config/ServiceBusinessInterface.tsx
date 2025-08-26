/**
 * Service Business Interface
 * 
 * Specialized interface for service businesses with time tracking,
 * service catalog management, and appointment booking features.
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
  Clock,
  Calendar,
  DollarSign,
  Users,
  Settings,
  Play,
  Pause,
  Timer,
  BookOpen,
  Briefcase
} from 'lucide-react';

import {
  ComprehensiveBusinessConfig,
  ServiceCatalogItem
} from '../../types/businessConfig';
import { businessConfigApi } from '../../services/businessConfigApi';

interface ServiceBusinessInterfaceProps {
  businessConfig: ComprehensiveBusinessConfig;
  onUpdate: () => void;
}

interface ServiceFormData {
  service_name: string;
  service_code: string;
  description: string;
  category: string;
  base_price: string;
  currency: string;
  estimated_duration: number;
  requires_booking: boolean;
  is_time_tracked: boolean;
  billing_method: string;
  is_active: boolean;
}

const serviceCategories = [
  'Consultation',
  'Repair',
  'Maintenance',
  'Installation',
  'Training',
  'Support',
  'Design',
  'Development',
  'Analysis',
  'Other'
];

const billingMethods = [
  { value: 'hourly', label: 'Hourly Rate' },
  { value: 'fixed', label: 'Fixed Price' },
  { value: 'project', label: 'Project Based' },
  { value: 'subscription', label: 'Subscription' },
  { value: 'per_session', label: 'Per Session' }
];

const defaultServices = [
  {
    service_name: 'General Consultation',
    service_code: 'CONSULT-001',
    description: 'General consultation and advisory services',
    category: 'Consultation',
    base_price: '100.00',
    estimated_duration: 60,
    requires_booking: true,
    is_time_tracked: true,
    billing_method: 'hourly'
  },
  {
    service_name: 'Technical Support',
    service_code: 'SUPPORT-001',
    description: 'Technical support and troubleshooting',
    category: 'Support',
    base_price: '75.00',
    estimated_duration: 30,
    requires_booking: false,
    is_time_tracked: true,
    billing_method: 'hourly'
  },
  {
    service_name: 'Project Planning',
    service_code: 'PLAN-001',
    description: 'Project planning and strategy development',
    category: 'Consultation',
    base_price: '500.00',
    estimated_duration: 240,
    requires_booking: true,
    is_time_tracked: true,
    billing_method: 'project'
  }
];

export const ServiceBusinessInterface: React.FC<ServiceBusinessInterfaceProps> = ({
  businessConfig,
  onUpdate
}) => {
  const [services, setServices] = useState<ServiceCatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingService, setEditingService] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('catalog');

  const [formData, setFormData] = useState<ServiceFormData>({
    service_name: '',
    service_code: '',
    description: '',
    category: 'Consultation',
    base_price: '',
    currency: 'USD',
    estimated_duration: 60,
    requires_booking: true,
    is_time_tracked: true,
    billing_method: 'hourly',
    is_active: true
  });

  useEffect(() => {
    loadServiceCatalog();
  }, [businessConfig.id]);

  const loadServiceCatalog = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await businessConfigApi.getServiceCatalog(businessConfig.id);
      setServices(data);
    } catch (err) {
      console.error('Failed to load service catalog:', err);
      setError('Failed to load service catalog. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveService = async () => {
    if (!formData.service_name.trim()) {
      setError('Service name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const serviceData = {
        business_config_id: businessConfig.id,
        service_name: formData.service_name.trim(),
        service_code: formData.service_code.trim() || undefined,
        description: formData.description.trim() || undefined,
        category: formData.category,
        base_price: formData.base_price || undefined,
        currency: formData.currency,
        estimated_duration: formData.estimated_duration,
        requires_booking: formData.requires_booking,
        is_time_tracked: formData.is_time_tracked,
        billing_method: formData.billing_method,
        is_active: formData.is_active
      };

      await businessConfigApi.createServiceCatalogItem(serviceData);
      await loadServiceCatalog();
      resetForm();
      onUpdate();
    } catch (err) {
      console.error('Failed to save service:', err);
      setError('Failed to save service. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      service_name: '',
      service_code: '',
      description: '',
      category: 'Consultation',
      base_price: '',
      currency: 'USD',
      estimated_duration: 60,
      requires_booking: true,
      is_time_tracked: true,
      billing_method: 'hourly',
      is_active: true
    });
    setEditingService(null);
    setShowAddForm(false);
  };

  const handleApplyDefaults = async () => {
    try {
      setLoading(true);
      setError(null);

      for (const service of defaultServices) {
        const serviceData = {
          business_config_id: businessConfig.id,
          ...service,
          currency: (service as any).currency || 'USD',
          is_active: true
        } as any;
        await businessConfigApi.createServiceCatalogItem(serviceData);
      }

      await loadServiceCatalog();
      onUpdate();
    } catch (err) {
      console.error('Failed to apply default services:', err);
      setError('Failed to apply default services. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter(service => {
    const matchesSearch = 
      service.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (service.service_code && service.service_code.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(services.map(s => s.category).filter(Boolean)));

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  const getBillingMethodLabel = (method: string) => {
    const billingMethod = billingMethods.find(bm => bm.value === method);
    return billingMethod?.label || method;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Briefcase className="h-6 w-6 text-blue-600" />
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Service Business Management</h2>
            <p className="text-sm text-slate-600">
              Manage your service catalog, time tracking, and appointment booking
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={handleApplyDefaults}
            disabled={loading}
          >
            Add Default Services
          </Button>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Service
          </Button>
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
            onClick={() => setActiveTab('catalog')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'catalog'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <BookOpen className="h-4 w-4 inline mr-2" />
            Service Catalog
          </button>
          <button
            onClick={() => setActiveTab('time-tracking')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'time-tracking'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Timer className="h-4 w-4 inline mr-2" />
            Time Tracking
          </button>
          <button
            onClick={() => setActiveTab('booking')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'booking'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Calendar className="h-4 w-4 inline mr-2" />
            Appointment Booking
          </button>
        </nav>
      </div>

      {/* Service Catalog Tab */}
      {activeTab === 'catalog' && (
        <div className="space-y-6">
          {/* Filters */}
          <Card className="border-0 shadow-sm bg-gradient-to-r from-slate-50 to-slate-100">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search services..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-slate-600" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-md text-sm"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category}
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
                  {editingService ? 'Edit Service' : 'Add New Service'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="service-name">Service Name *</Label>
                    <Input
                      id="service-name"
                      value={formData.service_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, service_name: e.target.value }))}
                      placeholder="e.g., General Consultation"
                    />
                  </div>
                  <div>
                    <Label htmlFor="service-code">Service Code</Label>
                    <Input
                      id="service-code"
                      value={formData.service_code}
                      onChange={(e) => setFormData(prev => ({ ...prev, service_code: e.target.value }))}
                      placeholder="e.g., CONSULT-001"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the service..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <select
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md"
                    >
                      {serviceCategories.map(category => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="base-price">Base Price</Label>
                    <Input
                      id="base-price"
                      type="number"
                      step="0.01"
                      value={formData.base_price}
                      onChange={(e) => setFormData(prev => ({ ...prev, base_price: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="estimated-duration">Duration (minutes)</Label>
                    <Input
                      id="estimated-duration"
                      type="number"
                      value={formData.estimated_duration}
                      onChange={(e) => setFormData(prev => ({ ...prev, estimated_duration: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="billing-method">Billing Method</Label>
                  <select
                    id="billing-method"
                    value={formData.billing_method}
                    onChange={(e) => setFormData(prev => ({ ...prev, billing_method: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md"
                  >
                    {billingMethods.map(method => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="requires-booking"
                      checked={formData.requires_booking}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, requires_booking: !!checked }))}
                    />
                    <Label htmlFor="requires-booking">Requires Booking</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is-time-tracked"
                      checked={formData.is_time_tracked}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_time_tracked: !!checked }))}
                    />
                    <Label htmlFor="is-time-tracked">Time Tracked</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is-active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: !!checked }))}
                    />
                    <Label htmlFor="is-active">Active</Label>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <Button variant="outline" onClick={resetForm}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={handleSaveService} disabled={loading}>
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Service
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Services List */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Service Catalog</span>
                <Badge variant="secondary">{filteredServices.length} services</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading && !showAddForm ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
              ) : filteredServices.length === 0 ? (
                <div className="text-center py-8">
                  <Briefcase className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No Services</h3>
                  <p className="text-slate-600 mb-4">
                    {searchTerm || selectedCategory !== 'all' 
                      ? 'No services match your current filters.'
                      : 'Start by adding services to your catalog.'
                    }
                  </p>
                  {!searchTerm && selectedCategory === 'all' && (
                    <Button onClick={handleApplyDefaults} disabled={loading}>
                      Add Default Services
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredServices.map((service) => (
                    <div
                      key={service.id}
                      className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-medium text-slate-900">{service.service_name}</h3>
                          {service.service_code && (
                            <Badge variant="outline" className="text-xs">
                              {service.service_code}
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-xs">
                            {service.category}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-slate-600">
                          {service.base_price && (
                            <div className="flex items-center space-x-1">
                              <DollarSign className="h-4 w-4" />
                              <span>{service.base_price} {service.currency}</span>
                            </div>
                          )}
                          {service.estimated_duration && (
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>{formatDuration(service.estimated_duration)}</span>
                            </div>
                          )}
                          <span>{getBillingMethodLabel(service.billing_method || 'hourly')}</span>
                          {service.requires_booking && (
                            <Badge className="bg-blue-100 text-blue-800 text-xs">
                              <Calendar className="h-3 w-3 mr-1" />
                              Booking Required
                            </Badge>
                          )}
                          {service.is_time_tracked && (
                            <Badge className="bg-green-100 text-green-800 text-xs">
                              <Timer className="h-3 w-3 mr-1" />
                              Time Tracked
                            </Badge>
                          )}
                        </div>
                        {service.description && (
                          <p className="text-sm text-slate-600 mt-1">{service.description}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Time Tracking Tab */}
      {activeTab === 'time-tracking' && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-3">
              <Timer className="h-5 w-5 text-blue-600" />
              <span>Time Tracking Configuration</span>
            </CardTitle>
            <CardDescription>
              Configure time tracking settings for your service business
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Timer className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Time Tracking Settings</h3>
              <p className="text-slate-600 mb-4">
                Time tracking configuration will be available in a future update.
              </p>
              <p className="text-sm text-slate-500">
                This will include automatic time tracking, manual time entry, and billing integration.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Appointment Booking Tab */}
      {activeTab === 'booking' && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-blue-600" />
              <span>Appointment Booking Configuration</span>
            </CardTitle>
            <CardDescription>
              Configure appointment booking settings and availability
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Booking Settings</h3>
              <p className="text-slate-600 mb-4">
                Appointment booking configuration will be available in a future update.
              </p>
              <p className="text-sm text-slate-500">
                This will include availability management, booking rules, and customer self-service booking.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};