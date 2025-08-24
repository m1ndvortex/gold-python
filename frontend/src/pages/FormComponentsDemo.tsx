import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Checkbox } from '../components/ui/checkbox'
// import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group' // Temporarily disabled
import { Switch } from '../components/ui/switch'
import { Textarea } from '../components/ui/textarea'
import { FormField } from '../components/ui/form-field'
import { Button } from '../components/ui/button'
import { 
  FormLoading, 
  InputLoading, 
  TextareaLoading, 
  SelectLoading, 
  CheckboxLoading, 
  SwitchLoading, 
  RadioLoading,
  FormSkeleton 
} from '../components/ui/form-loading'
import { Badge } from '../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'

const FormComponentsDemo: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: '',
    description: '',
    terms: false,
    notifications: false,
    preference: '',
    size: 'default'
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // Simulate form submission
    setTimeout(() => {
      setLoading(false)
      console.log('Form submitted:', formData)
    }, 2000)
  }

  const gradientVariants = [
    'gradient-green',
    'gradient-teal', 
    'gradient-blue',
    'gradient-purple',
    'gradient-pink',
    'gradient-orange',
    'professional'
  ] as const

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gradient-blue">
            Enhanced Form Components
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Comprehensive form components with gradient styling, validation states, and loading animations
          </p>
        </div>

        <Tabs defaultValue="components" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gradient-tab-blue">
            <TabsTrigger value="components" className="tab-active-blue">Components</TabsTrigger>
            <TabsTrigger value="validation" className="tab-active-blue">Validation</TabsTrigger>
            <TabsTrigger value="loading" className="tab-active-blue">Loading States</TabsTrigger>
            <TabsTrigger value="form" className="tab-active-blue">Complete Form</TabsTrigger>
          </TabsList>

          {/* Components Tab */}
          <TabsContent value="components" className="space-y-8">
            {/* Input Components */}
            <Card className="card-gradient-green">
              <CardHeader>
                <CardTitle className="text-green-700">Input Components</CardTitle>
                <CardDescription>Enhanced input fields with gradient focus rings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {gradientVariants.map((variant) => (
                    <div key={variant} className="space-y-2">
                      <Badge variant="outline" className="mb-2">{variant}</Badge>
                      <Input 
                        variant={variant}
                        placeholder={`${variant} input`}
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input 
                    variant="gradient-green"
                    type="password"
                    showPasswordToggle
                    placeholder="Password with toggle"
                  />
                  <Input 
                    variant="gradient-blue"
                    floating
                    label="Floating Label"
                    placeholder="Floating input"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input variant="gradient-purple" size="sm" placeholder="Small input" />
                  <Input variant="gradient-purple" size="default" placeholder="Default input" />
                  <Input variant="gradient-purple" size="lg" placeholder="Large input" />
                </div>
              </CardContent>
            </Card>

            {/* Select Components */}
            <Card className="card-gradient-teal">
              <CardHeader>
                <CardTitle className="text-teal-700">Select Components</CardTitle>
                <CardDescription>Modern dropdown styling with gradient accents</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {gradientVariants.slice(0, 6).map((variant) => (
                    <div key={variant} className="space-y-2">
                      <Badge variant="outline" className="mb-2">{variant}</Badge>
                      <Select>
                        <SelectTrigger variant={variant}>
                          <SelectValue placeholder={`Select ${variant}`} />
                        </SelectTrigger>
                        <SelectContent variant={variant}>
                          <SelectItem variant={variant} value="option1">Option 1</SelectItem>
                          <SelectItem variant={variant} value="option2">Option 2</SelectItem>
                          <SelectItem variant={variant} value="option3">Option 3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Checkbox Components */}
            <Card className="card-gradient-blue">
              <CardHeader>
                <CardTitle className="text-blue-700">Checkbox Components</CardTitle>
                <CardDescription>Enhanced checkboxes with gradient backgrounds</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6">
                  {gradientVariants.map((variant) => (
                    <div key={variant} className="flex items-center space-x-2">
                      <Checkbox variant={variant} id={`checkbox-${variant}`} />
                      <label htmlFor={`checkbox-${variant}`} className="text-sm font-medium">
                        {variant.replace('gradient-', '').replace('professional', 'pro')}
                      </label>
                    </div>
                  ))}
                </div>

                <div className="flex items-center space-x-8">
                  <div className="flex items-center space-x-2">
                    <Checkbox variant="gradient-green" size="sm" id="small" />
                    <label htmlFor="small" className="text-sm">Small</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox variant="gradient-blue" size="default" id="default" />
                    <label htmlFor="default" className="text-sm">Default</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox variant="gradient-purple" size="lg" id="large" />
                    <label htmlFor="large" className="text-sm">Large</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox variant="gradient-pink" indeterminate id="indeterminate" />
                    <label htmlFor="indeterminate" className="text-sm">Indeterminate</label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Radio Group Components */}
            <Card className="card-gradient-purple">
              <CardHeader>
                <CardTitle className="text-purple-700">Radio Group Components</CardTitle>
                <CardDescription>Radio buttons with gradient styling</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* RadioGroup components temporarily disabled
                  <div className="space-y-4">
                    <h4 className="font-medium">Vertical Layout</h4>
                    <RadioGroup orientation="vertical">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem variant="gradient-purple" value="option1" id="r1" />
                        <label htmlFor="r1">Option 1</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem variant="gradient-purple" value="option2" id="r2" />
                        <label htmlFor="r2">Option 2</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem variant="gradient-purple" value="option3" id="r3" />
                        <label htmlFor="r3">Option 3</label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Horizontal Layout</h4>
                    <RadioGroup orientation="horizontal">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem variant="gradient-blue" value="small" id="size-sm" />
                        <label htmlFor="size-sm">Small</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem variant="gradient-blue" value="medium" id="size-md" />
                        <label htmlFor="size-md">Medium</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem variant="gradient-blue" value="large" id="size-lg" />
                        <label htmlFor="size-lg">Large</label>
                      </div>
                    </RadioGroup>
                  </div>
                  */}
                </div>
              </CardContent>
            </Card>

            {/* Switch Components */}
            <Card className="card-gradient-pink">
              <CardHeader>
                <CardTitle className="text-pink-700">Switch Components</CardTitle>
                <CardDescription>Toggle switches with gradient styling</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6">
                  {gradientVariants.map((variant) => (
                    <div key={variant} className="flex items-center space-x-2">
                      <Switch variant={variant} id={`switch-${variant}`} />
                      <label htmlFor={`switch-${variant}`} className="text-sm font-medium">
                        {variant.replace('gradient-', '').replace('professional', 'pro')}
                      </label>
                    </div>
                  ))}
                </div>

                <div className="flex items-center space-x-8">
                  <div className="flex items-center space-x-2">
                    <Switch variant="gradient-green" size="sm" id="switch-sm" />
                    <label htmlFor="switch-sm" className="text-sm">Small</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch variant="gradient-blue" size="default" id="switch-default" />
                    <label htmlFor="switch-default" className="text-sm">Default</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch variant="gradient-purple" size="lg" id="switch-lg" />
                    <label htmlFor="switch-lg" className="text-sm">Large</label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Textarea Components */}
            <Card className="card-gradient-orange">
              <CardHeader>
                <CardTitle className="text-orange-700">Textarea Components</CardTitle>
                <CardDescription>Enhanced textarea with gradient focus rings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {gradientVariants.slice(0, 6).map((variant) => (
                    <div key={variant} className="space-y-2">
                      <Badge variant="outline" className="mb-2">{variant}</Badge>
                      <Textarea 
                        variant={variant}
                        placeholder={`${variant} textarea`}
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Textarea 
                    variant="gradient-green"
                    showCharCount
                    maxLength={200}
                    placeholder="Textarea with character count"
                  />
                  <Textarea 
                    variant="gradient-blue"
                    autoResize
                    placeholder="Auto-resizing textarea"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Validation Tab */}
          <TabsContent value="validation" className="space-y-8">
            <Card className="card-gradient-green">
              <CardHeader>
                <CardTitle className="text-green-700">Form Validation States</CardTitle>
                <CardDescription>Components with error, success, and warning states</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <FormField variant="gradient-green" label="Success Field" success="Field is valid">
                    <Input variant="gradient-green" placeholder="Valid input" />
                  </FormField>
                  
                  <FormField variant="error" label="Error Field" error="This field is required">
                    <Input error="This field is required" placeholder="Invalid input" />
                  </FormField>
                  
                  <FormField variant="gradient-orange" label="Warning Field" warning="Please check this field">
                    <Input warning="Please check this field" placeholder="Warning input" />
                  </FormField>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField variant="gradient-blue" label="Required Field" required>
                    <Select>
                      <SelectTrigger variant="gradient-blue">
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                      <SelectContent variant="gradient-blue">
                        <SelectItem variant="gradient-blue" value="option1">Option 1</SelectItem>
                        <SelectItem variant="gradient-blue" value="option2">Option 2</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>

                  <FormField 
                    variant="gradient-purple" 
                    label="Description" 
                    description="Please provide a detailed description"
                  >
                    <Textarea variant="gradient-purple" placeholder="Enter description" />
                  </FormField>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Loading States Tab */}
          <TabsContent value="loading" className="space-y-8">
            <Card className="card-gradient-blue">
              <CardHeader>
                <CardTitle className="text-blue-700">Loading States</CardTitle>
                <CardDescription>Gradient loading animations and skeleton screens</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Input Loading</h4>
                    <InputLoading variant="gradient-green" />
                    <InputLoading variant="gradient-blue" />
                    <InputLoading variant="gradient-purple" />
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Select Loading</h4>
                    <SelectLoading variant="gradient-teal" />
                    <SelectLoading variant="gradient-pink" />
                    <SelectLoading variant="gradient-orange" />
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Textarea Loading</h4>
                    <TextareaLoading variant="gradient-green" />
                    <TextareaLoading variant="gradient-blue" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Form Controls</h4>
                    <div className="flex items-center space-x-4">
                      <CheckboxLoading variant="gradient-green" />
                      <SwitchLoading variant="gradient-blue" />
                      <RadioLoading variant="gradient-purple" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Form Skeleton</h4>
                    <FormSkeleton variant="gradient-teal" fields={3} showButtons={2} />
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Loading with Shimmer</h4>
                    <FormLoading variant="gradient-pink" showShimmer />
                    <FormLoading variant="gradient-orange" showShimmer />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Complete Form Tab */}
          <TabsContent value="form" className="space-y-8">
            <Card className="card-gradient-purple">
              <CardHeader>
                <CardTitle className="text-purple-700">Complete Form Example</CardTitle>
                <CardDescription>A comprehensive form using all gradient components</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <FormSkeleton variant="gradient-purple" fields={6} showButtons={2} />
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField variant="gradient-green" label="Full Name" required>
                        <Input 
                          variant="gradient-green"
                          placeholder="Enter your full name"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                      </FormField>

                      <FormField variant="gradient-blue" label="Email Address" required>
                        <Input 
                          variant="gradient-blue"
                          type="email"
                          placeholder="Enter your email"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                        />
                      </FormField>
                    </div>

                    <FormField variant="gradient-purple" label="Category">
                      <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                        <SelectTrigger variant="gradient-purple">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent variant="gradient-purple">
                          <SelectItem variant="gradient-purple" value="general">General</SelectItem>
                          <SelectItem variant="gradient-purple" value="support">Support</SelectItem>
                          <SelectItem variant="gradient-purple" value="feedback">Feedback</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormField>

                    <FormField variant="gradient-pink" label="Description">
                      <Textarea 
                        variant="gradient-pink"
                        placeholder="Enter your message"
                        showCharCount
                        maxLength={500}
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                      />
                    </FormField>

                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          variant="gradient-green" 
                          id="terms"
                          checked={formData.terms}
                          onCheckedChange={(checked) => setFormData({...formData, terms: !!checked})}
                        />
                        <label htmlFor="terms" className="text-sm font-medium">
                          I agree to the terms and conditions
                        </label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch 
                          variant="gradient-blue" 
                          id="notifications"
                          checked={formData.notifications}
                          onCheckedChange={(checked) => setFormData({...formData, notifications: checked})}
                        />
                        <label htmlFor="notifications" className="text-sm font-medium">
                          Enable email notifications
                        </label>
                      </div>

                      {/* RadioGroup temporarily disabled
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Preferred Contact Method</label>
                        <RadioGroup 
                          orientation="horizontal"
                          value={formData.preference}
                          onValueChange={(value) => setFormData({...formData, preference: value})}
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem variant="gradient-purple" value="email" id="contact-email" />
                            <label htmlFor="contact-email">Email</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem variant="gradient-purple" value="phone" id="contact-phone" />
                            <label htmlFor="contact-phone">Phone</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem variant="gradient-purple" value="sms" id="contact-sms" />
                            <label htmlFor="contact-sms">SMS</label>
                          </div>
                        </RadioGroup>
                      </div>
                      */}
                    </div>

                    <div className="flex space-x-4 pt-4">
                      <Button type="submit" variant="gradient-green" disabled={loading}>
                        Submit Form
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setFormData({
                        name: '', email: '', category: '', description: '', 
                        terms: false, notifications: false, preference: '', size: 'default'
                      })}>
                        Reset
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default FormComponentsDemo