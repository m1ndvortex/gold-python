import React, { useState } from 'react';
import { X, User, Phone, Mail, MapPin, Save, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useCreateCustomer, useUpdateCustomer } from '../../hooks/useCustomers';
import { useToast } from '../ui/use-toast';
import type { Customer, CustomerCreate, CustomerUpdate } from '../../types';

interface CustomerFormProps {
  customer?: Customer;
  onClose: () => void;
  onSuccess: () => void;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({
  customer,
  onClose,
  onSuccess
}) => {
  const { toast } = useToast();
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    phone: customer?.phone || '',
    email: customer?.email || '',
    address: customer?.address || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Customer name is required';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const customerData = {
        name: formData.name.trim(),
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        address: formData.address.trim() || undefined
      };

      if (customer) {
        // Update existing customer
        await updateCustomer.mutateAsync({
          id: customer.id,
          customer: customerData as CustomerUpdate
        });
        toast({
          title: 'Success',
          description: 'Customer updated successfully',
        });
      } else {
        // Create new customer
        await createCustomer.mutateAsync(customerData as CustomerCreate);
        toast({
          title: 'Success',
          description: 'Customer created successfully',
        });
      }

      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to save customer',
        variant: 'destructive',
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const isLoading = createCustomer.isPending || updateCustomer.isPending;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg mx-auto shadow-2xl border-0">
        <CardHeader className="bg-gradient-to-r from-primary-50 to-primary-100 border-b border-primary-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold text-primary-900">
                  {customer ? 'Edit Customer' : 'Add New Customer'}
                </CardTitle>
                <p className="text-sm text-primary-700">
                  {customer ? 'Update customer information' : 'Create a new customer profile'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={isLoading}
              className="text-primary-600 hover:text-primary-800 hover:bg-primary-200"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Name - Floating Label */}
            <div className="space-y-2">
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter customer name"
                disabled={isLoading}
                floating
                label="Customer Name *"
                leftIcon={<User className="h-4 w-4" />}
                error={errors.name}
                className="text-base"
              />
            </div>

            {/* Phone Number - Floating Label */}
            <div className="space-y-2">
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Enter phone number"
                disabled={isLoading}
                floating
                label="Phone Number"
                leftIcon={<Phone className="h-4 w-4" />}
                error={errors.phone}
                className="text-base"
              />
            </div>

            {/* Email Address - Floating Label */}
            <div className="space-y-2">
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter email address"
                disabled={isLoading}
                floating
                label="Email Address"
                leftIcon={<Mail className="h-4 w-4" />}
                error={errors.email}
                className="text-base"
              />
            </div>

            {/* Address - Floating Label */}
            <div className="space-y-2">
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Enter full address"
                disabled={isLoading}
                floating
                label="Address"
                leftIcon={<MapPin className="h-4 w-4" />}
                className="text-base"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                className="px-6"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="px-6 bg-primary-600 hover:bg-primary-700 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {customer ? 'Update Customer' : 'Create Customer'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};