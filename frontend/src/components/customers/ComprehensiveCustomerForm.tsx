import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, MapPin, Save, Loader2, Building, Heart, CreditCard, Star, Tags, FileText } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import { useCreateCustomer, useUpdateCustomer } from '../../hooks/useCustomers';
import { useToast } from '../ui/use-toast';
import type { Customer, CustomerCreate, CustomerUpdate } from '../../types';

interface ComprehensiveCustomerFormProps {
  customer?: Customer;
  onClose: () => void;
  onSuccess: () => void;
}

export const ComprehensiveCustomerForm: React.FC<ComprehensiveCustomerFormProps> = ({
  customer,
  onClose,
  onSuccess
}) => {
  const { toast } = useToast();
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  
  const [formData, setFormData] = useState({
    // Basic Information
    name: customer?.name || '',
    phone: customer?.phone || '',
    email: customer?.email || '',
    
    // Address Information
    street_address: customer?.street_address || '',
    city: customer?.city || '',
    state: customer?.state || '',
    postal_code: customer?.postal_code || '',
    country: customer?.country || 'United States',
    
    // Personal Information
    national_id: customer?.national_id || '',
    date_of_birth: customer?.date_of_birth || '',
    age: customer?.age || '',
    gender: customer?.gender || '',
    nationality: customer?.nationality || '',
    occupation: customer?.occupation || '',
    
    // Emergency Contact
    emergency_contact_name: customer?.emergency_contact_name || '',
    emergency_contact_phone: customer?.emergency_contact_phone || '',
    emergency_contact_relationship: customer?.emergency_contact_relationship || '',
    
    // Additional Information
    notes: customer?.notes || '',
    tags: customer?.tags || [],
    
    // Business Information
    customer_type: customer?.customer_type || 'retail',
    credit_limit: customer?.credit_limit || 0,
    payment_terms: customer?.payment_terms || 0,
    discount_percentage: customer?.discount_percentage || 0,
    tax_exempt: customer?.tax_exempt || false,
    tax_id: customer?.tax_id || '',
    
    // Preferences
    preferred_contact_method: customer?.preferences?.contact_method || 'phone',
    marketing_emails: customer?.preferences?.marketing_emails || false,
    newsletter: customer?.preferences?.newsletter || false,
    
    // Custom Fields
    preferred_metal: customer?.custom_fields?.preferred_metal || '',
    jewelry_style: customer?.custom_fields?.jewelry_style || '',
    anniversary_date: customer?.custom_fields?.anniversary_date || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tagInput, setTagInput] = useState('');

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.name.trim()) {
      newErrors.name = 'Customer name is required';
    }

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation
    if (formData.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    // National ID validation (basic format)
    if (formData.national_id && formData.national_id.length < 5) {
      newErrors.national_id = 'National ID must be at least 5 characters';
    }

    // Date of birth validation
    if (formData.date_of_birth) {
      const dob = new Date(formData.date_of_birth);
      const today = new Date();
      if (dob > today) {
        newErrors.date_of_birth = 'Date of birth cannot be in the future';
      }
    }

    // Credit limit validation
    if (formData.credit_limit < 0) {
      newErrors.credit_limit = 'Credit limit cannot be negative';
    }

    // Payment terms validation
    if (formData.payment_terms < 0 || formData.payment_terms > 365) {
      newErrors.payment_terms = 'Payment terms must be between 0 and 365 days';
    }

    // Discount percentage validation
    if (formData.discount_percentage < 0 || formData.discount_percentage > 100) {
      newErrors.discount_percentage = 'Discount percentage must be between 0 and 100';
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
      // Prepare customer data
      const customerData = {
        name: formData.name.trim(),
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        
        // Address
        street_address: formData.street_address.trim() || undefined,
        city: formData.city.trim() || undefined,
        state: formData.state.trim() || undefined,
        postal_code: formData.postal_code.trim() || undefined,
        country: formData.country.trim() || undefined,
        
        // Personal information
        national_id: formData.national_id.trim() || undefined,
        date_of_birth: formData.date_of_birth || undefined,
        age: formData.age ? parseInt(formData.age.toString()) : undefined,
        gender: formData.gender || undefined,
        nationality: formData.nationality.trim() || undefined,
        occupation: formData.occupation.trim() || undefined,
        
        // Emergency contact
        emergency_contact_name: formData.emergency_contact_name.trim() || undefined,
        emergency_contact_phone: formData.emergency_contact_phone.trim() || undefined,
        emergency_contact_relationship: formData.emergency_contact_relationship || undefined,
        
        // Additional information
        notes: formData.notes.trim() || undefined,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
        
        // Business information
        customer_type: formData.customer_type,
        credit_limit: formData.credit_limit,
        payment_terms: formData.payment_terms,
        discount_percentage: formData.discount_percentage,
        tax_exempt: formData.tax_exempt,
        tax_id: formData.tax_id.trim() || undefined,
        
        // Preferences
        preferences: {
          contact_method: formData.preferred_contact_method,
          marketing_emails: formData.marketing_emails,
          newsletter: formData.newsletter,
        },
        
        // Custom fields
        custom_fields: {
          preferred_metal: formData.preferred_metal.trim() || undefined,
          jewelry_style: formData.jewelry_style.trim() || undefined,
          anniversary_date: formData.anniversary_date || undefined,
        },
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

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      handleInputChange('tags', [...formData.tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    handleInputChange('tags', formData.tags.filter(tag => tag !== tagToRemove));
  };

  const isLoading = createCustomer.isPending || updateCustomer.isPending;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            {customer ? 'Edit Customer' : 'Add New Customer'}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid grid-cols-5 w-full">
                <TabsTrigger value="basic" className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  Basic
                </TabsTrigger>
                <TabsTrigger value="address" className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  Address
                </TabsTrigger>
                <TabsTrigger value="personal" className="flex items-center gap-1">
                  <Heart className="h-4 w-4" />
                  Personal
                </TabsTrigger>
                <TabsTrigger value="business" className="flex items-center gap-1">
                  <Building className="h-4 w-4" />
                  Business
                </TabsTrigger>
                <TabsTrigger value="preferences" className="flex items-center gap-1">
                  <Star className="h-4 w-4" />
                  Preferences
                </TabsTrigger>
              </TabsList>

              {/* Basic Information Tab */}
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Customer Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter customer name"
                      className={errors.name ? 'border-red-500' : ''}
                    />
                    {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+1-555-0123"
                      className={errors.phone ? 'border-red-500' : ''}
                    />
                    {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="customer@email.com"
                      className={errors.email ? 'border-red-500' : ''}
                    />
                    {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <Label htmlFor="customer_type">Customer Type</Label>
                    <Select
                      value={formData.customer_type}
                      onValueChange={(value) => handleInputChange('customer_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="retail">Retail Customer</SelectItem>
                        <SelectItem value="wholesale">Wholesale Customer</SelectItem>
                        <SelectItem value="corporate">Corporate Customer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Additional notes about the customer..."
                    rows={3}
                  />
                </div>

                {/* Tags */}
                <div>
                  <Label htmlFor="tags">Tags</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="Add a tag..."
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    />
                    <Button type="button" onClick={addTag} variant="outline">
                      <Tags className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {formData.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                        {tag} <X className="h-3 w-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Address Information Tab */}
              <TabsContent value="address" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="street_address">Street Address</Label>
                    <Input
                      id="street_address"
                      value={formData.street_address}
                      onChange={(e) => handleInputChange('street_address', e.target.value)}
                      placeholder="1234 Main Street, Apt 5B"
                    />
                  </div>

                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="New York"
                    />
                  </div>

                  <div>
                    <Label htmlFor="state">State/Province</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      placeholder="New York"
                    />
                  </div>

                  <div>
                    <Label htmlFor="postal_code">Postal Code</Label>
                    <Input
                      id="postal_code"
                      value={formData.postal_code}
                      onChange={(e) => handleInputChange('postal_code', e.target.value)}
                      placeholder="10001"
                    />
                  </div>

                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      placeholder="United States"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Personal Information Tab */}
              <TabsContent value="personal" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="national_id">National ID / SSN</Label>
                    <Input
                      id="national_id"
                      value={formData.national_id}
                      onChange={(e) => handleInputChange('national_id', e.target.value)}
                      placeholder="123-45-6789"
                      className={errors.national_id ? 'border-red-500' : ''}
                    />
                    {errors.national_id && <p className="text-sm text-red-500 mt-1">{errors.national_id}</p>}
                  </div>

                  <div>
                    <Label htmlFor="date_of_birth">Date of Birth</Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                      className={errors.date_of_birth ? 'border-red-500' : ''}
                    />
                    {errors.date_of_birth && <p className="text-sm text-red-500 mt-1">{errors.date_of_birth}</p>}
                  </div>

                  <div>
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      value={formData.age}
                      onChange={(e) => handleInputChange('age', e.target.value)}
                      placeholder="39"
                      min="0"
                      max="120"
                    />
                  </div>

                  <div>
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) => handleInputChange('gender', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="nationality">Nationality</Label>
                    <Input
                      id="nationality"
                      value={formData.nationality}
                      onChange={(e) => handleInputChange('nationality', e.target.value)}
                      placeholder="American"
                    />
                  </div>

                  <div>
                    <Label htmlFor="occupation">Occupation</Label>
                    <Input
                      id="occupation"
                      value={formData.occupation}
                      onChange={(e) => handleInputChange('occupation', e.target.value)}
                      placeholder="Software Engineer"
                    />
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-4">Emergency Contact</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="emergency_contact_name">Contact Name</Label>
                      <Input
                        id="emergency_contact_name"
                        value={formData.emergency_contact_name}
                        onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
                        placeholder="Jane Doe Smith"
                      />
                    </div>

                    <div>
                      <Label htmlFor="emergency_contact_phone">Contact Phone</Label>
                      <Input
                        id="emergency_contact_phone"
                        value={formData.emergency_contact_phone}
                        onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
                        placeholder="+1-555-0124"
                      />
                    </div>

                    <div>
                      <Label htmlFor="emergency_contact_relationship">Relationship</Label>
                      <Select
                        value={formData.emergency_contact_relationship}
                        onValueChange={(value) => handleInputChange('emergency_contact_relationship', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select relationship" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="spouse">Spouse</SelectItem>
                          <SelectItem value="parent">Parent</SelectItem>
                          <SelectItem value="child">Child</SelectItem>
                          <SelectItem value="sibling">Sibling</SelectItem>
                          <SelectItem value="friend">Friend</SelectItem>
                          <SelectItem value="business_partner">Business Partner</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Business Information Tab */}
              <TabsContent value="business" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="credit_limit">Credit Limit ($)</Label>
                    <Input
                      id="credit_limit"
                      type="number"
                      value={formData.credit_limit}
                      onChange={(e) => handleInputChange('credit_limit', parseFloat(e.target.value) || 0)}
                      placeholder="5000"
                      min="0"
                      step="0.01"
                      className={errors.credit_limit ? 'border-red-500' : ''}
                    />
                    {errors.credit_limit && <p className="text-sm text-red-500 mt-1">{errors.credit_limit}</p>}
                  </div>

                  <div>
                    <Label htmlFor="payment_terms">Payment Terms (Days)</Label>
                    <Input
                      id="payment_terms"
                      type="number"
                      value={formData.payment_terms}
                      onChange={(e) => handleInputChange('payment_terms', parseInt(e.target.value) || 0)}
                      placeholder="30"
                      min="0"
                      max="365"
                      className={errors.payment_terms ? 'border-red-500' : ''}
                    />
                    {errors.payment_terms && <p className="text-sm text-red-500 mt-1">{errors.payment_terms}</p>}
                  </div>

                  <div>
                    <Label htmlFor="discount_percentage">Default Discount (%)</Label>
                    <Input
                      id="discount_percentage"
                      type="number"
                      value={formData.discount_percentage}
                      onChange={(e) => handleInputChange('discount_percentage', parseFloat(e.target.value) || 0)}
                      placeholder="5"
                      min="0"
                      max="100"
                      step="0.01"
                      className={errors.discount_percentage ? 'border-red-500' : ''}
                    />
                    {errors.discount_percentage && <p className="text-sm text-red-500 mt-1">{errors.discount_percentage}</p>}
                  </div>

                  <div>
                    <Label htmlFor="tax_id">Tax ID</Label>
                    <Input
                      id="tax_id"
                      value={formData.tax_id}
                      onChange={(e) => handleInputChange('tax_id', e.target.value)}
                      placeholder="98-7654321"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="tax_exempt"
                    checked={formData.tax_exempt}
                    onCheckedChange={(checked) => handleInputChange('tax_exempt', checked)}
                  />
                  <Label htmlFor="tax_exempt">Tax Exempt</Label>
                </div>
              </TabsContent>

              {/* Preferences Tab */}
              <TabsContent value="preferences" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="preferred_contact_method">Preferred Contact Method</Label>
                    <Select
                      value={formData.preferred_contact_method}
                      onValueChange={(value) => handleInputChange('preferred_contact_method', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select contact method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="mail">Mail</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="preferred_metal">Preferred Metal</Label>
                    <Input
                      id="preferred_metal"
                      value={formData.preferred_metal}
                      onChange={(e) => handleInputChange('preferred_metal', e.target.value)}
                      placeholder="Gold, Silver, Platinum..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="jewelry_style">Jewelry Style Preference</Label>
                    <Input
                      id="jewelry_style"
                      value={formData.jewelry_style}
                      onChange={(e) => handleInputChange('jewelry_style', e.target.value)}
                      placeholder="Classic, Modern, Vintage..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="anniversary_date">Anniversary Date</Label>
                    <Input
                      id="anniversary_date"
                      type="date"
                      value={formData.anniversary_date}
                      onChange={(e) => handleInputChange('anniversary_date', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="marketing_emails"
                      checked={formData.marketing_emails}
                      onCheckedChange={(checked) => handleInputChange('marketing_emails', checked)}
                    />
                    <Label htmlFor="marketing_emails">Receive Marketing Emails</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="newsletter"
                      checked={formData.newsletter}
                      onCheckedChange={(checked) => handleInputChange('newsletter', checked)}
                    />
                    <Label htmlFor="newsletter">Subscribe to Newsletter</Label>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {customer ? 'Updating...' : 'Creating...'}
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
