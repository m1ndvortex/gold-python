import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'

import { Input } from '../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Checkbox } from '../components/ui/checkbox'
// import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group' // Temporarily disabled
import { Switch } from '../components/ui/switch'

export {}; // Make this a module
import { Textarea } from '../components/ui/textarea'
import { FormField } from '../components/ui/form-field'
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

describe('Form Components with Gradient Styling', () => {
  describe('Input Component', () => {
    it('renders with default styling', () => {
      render(<Input placeholder="Test input" />)
      const input = screen.getByPlaceholderText('Test input')
      expect(input).toBeInTheDocument()
      expect(input).toHaveClass('transition-all', 'duration-300')
    })

    it('renders with gradient-green variant', () => {
      render(<Input variant="gradient-green" placeholder="Green input" />)
      const input = screen.getByPlaceholderText('Green input')
      expect(input).toHaveClass('focus-visible:ring-green-500/30')
      expect(input).toHaveClass('focus-visible:border-green-500')
    })

    it('renders with gradient-blue variant', () => {
      render(<Input variant="gradient-blue" placeholder="Blue input" />)
      const input = screen.getByPlaceholderText('Blue input')
      expect(input).toHaveClass('focus-visible:ring-blue-500/30')
      expect(input).toHaveClass('focus-visible:border-blue-500')
    })

    it('renders with gradient-purple variant', () => {
      render(<Input variant="gradient-purple" placeholder="Purple input" />)
      const input = screen.getByPlaceholderText('Purple input')
      expect(input).toHaveClass('focus-visible:ring-purple-500/30')
      expect(input).toHaveClass('focus-visible:border-purple-500')
    })

    it('renders with professional variant', () => {
      render(<Input variant="professional" placeholder="Professional input" />)
      const input = screen.getByPlaceholderText('Professional input')
      expect(input).toHaveClass('focus-visible:ring-slate-500/20')
      expect(input).toHaveClass('focus-visible:border-slate-500')
    })

    it('handles validation states with gradient styling', () => {
      render(
        <Input 
          variant="gradient-green" 
          error="Test error" 
          placeholder="Error input" 
        />
      )
      const input = screen.getByPlaceholderText('Error input')
      expect(input).toHaveClass('border-error-500')
      expect(screen.getByText('Test error')).toBeInTheDocument()
    })

    it('renders with floating label', () => {
      render(
        <Input 
          variant="gradient-blue" 
          floating 
          label="Floating Label" 
          placeholder="Floating input" 
        />
      )
      expect(screen.getByText('Floating Label')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Floating input')).toBeInTheDocument()
    })

    it('handles password toggle functionality', () => {
      render(
        <Input 
          type="password" 
          showPasswordToggle 
          placeholder="Password input" 
        />
      )
      const input = screen.getByPlaceholderText('Password input')
      const toggleButton = screen.getByRole('button')
      
      expect(input).toHaveAttribute('type', 'password')
      fireEvent.click(toggleButton)
      expect(input).toHaveAttribute('type', 'text')
    })

    it('renders with different sizes', () => {
      const { rerender } = render(<Input size="sm" placeholder="Small input" />)
      expect(screen.getByPlaceholderText('Small input')).toHaveClass('h-8')

      rerender(<Input size="lg" placeholder="Large input" />)
      expect(screen.getByPlaceholderText('Large input')).toHaveClass('h-12')

      rerender(<Input size="xl" placeholder="XL input" />)
      expect(screen.getByPlaceholderText('XL input')).toHaveClass('h-14')
    })
  })

  describe('Select Component', () => {
    it('renders with gradient-green variant', () => {
      render(
        <Select>
          <SelectTrigger variant="gradient-green">
            <SelectValue placeholder="Select option" />
          </SelectTrigger>
          <SelectContent variant="gradient-green">
            <SelectItem variant="gradient-green" value="option1">Option 1</SelectItem>
            <SelectItem variant="gradient-green" value="option2">Option 2</SelectItem>
          </SelectContent>
        </Select>
      )
      
      const trigger = screen.getByRole('combobox')
      expect(trigger).toHaveClass('focus:ring-green-500/30')
      expect(trigger).toHaveClass('focus:border-green-500')
    })

    it('renders with gradient-blue variant', () => {
      render(
        <Select>
          <SelectTrigger variant="gradient-blue">
            <SelectValue placeholder="Select option" />
          </SelectTrigger>
          <SelectContent variant="gradient-blue">
            <SelectItem variant="gradient-blue" value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      )
      
      const trigger = screen.getByRole('combobox')
      expect(trigger).toHaveClass('focus:ring-blue-500/30')
      expect(trigger).toHaveClass('focus:border-blue-500')
    })

    it('renders with professional variant', () => {
      render(
        <Select>
          <SelectTrigger variant="professional">
            <SelectValue placeholder="Select option" />
          </SelectTrigger>
          <SelectContent variant="professional">
            <SelectItem variant="professional" value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      )
      
      const trigger = screen.getByRole('combobox')
      expect(trigger).toHaveClass('focus:ring-slate-500/20')
      expect(trigger).toHaveClass('focus:border-slate-500')
    })
  })

  describe('Checkbox Component', () => {
    it('renders with gradient-green variant', () => {
      render(<Checkbox variant="gradient-green" />)
      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toHaveClass('border-green-500')
      expect(checkbox).toHaveClass('focus-visible:ring-green-500/30')
    })

    it('renders with gradient-blue variant', () => {
      render(<Checkbox variant="gradient-blue" />)
      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toHaveClass('border-blue-500')
      expect(checkbox).toHaveClass('focus-visible:ring-blue-500/30')
    })

    it('renders with professional variant', () => {
      render(<Checkbox variant="professional" />)
      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toHaveClass('border-slate-500')
      expect(checkbox).toHaveClass('focus-visible:ring-slate-500/20')
    })

    it('handles different sizes', () => {
      const { rerender } = render(<Checkbox size="sm" />)
      expect(screen.getByRole('checkbox')).toHaveClass('h-3', 'w-3')

      rerender(<Checkbox size="lg" />)
      expect(screen.getByRole('checkbox')).toHaveClass('h-5', 'w-5')
    })

    it('handles indeterminate state', () => {
      render(<Checkbox indeterminate />)
      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toHaveAttribute('data-state', 'indeterminate')
    })
  })

  // RadioGroup Component tests temporarily disabled until component is implemented
  // describe('RadioGroup Component', () => {
  //   it('renders radio group with gradient styling', () => {
  //     // Tests will be added when RadioGroup component is implemented
  //   })
  // })

  describe('Switch Component', () => {
    it('renders with gradient-green variant', () => {
      render(<Switch variant="gradient-green" />)
      const switchElement = screen.getByRole('switch')
      expect(switchElement).toHaveClass('focus-visible:ring-green-500/30')
    })

    it('renders with gradient-blue variant', () => {
      render(<Switch variant="gradient-blue" />)
      const switchElement = screen.getByRole('switch')
      expect(switchElement).toHaveClass('focus-visible:ring-blue-500/30')
    })

    it('renders with professional variant', () => {
      render(<Switch variant="professional" />)
      const switchElement = screen.getByRole('switch')
      expect(switchElement).toHaveClass('focus-visible:ring-slate-500/20')
    })

    it('handles different sizes', () => {
      const { rerender } = render(<Switch size="sm" />)
      expect(screen.getByRole('switch')).toHaveClass('h-5', 'w-9')

      rerender(<Switch size="lg" />)
      expect(screen.getByRole('switch')).toHaveClass('h-7', 'w-13')
    })

    it('toggles state correctly', async () => {
      const user = userEvent.setup()
      render(<Switch />)
      const switchElement = screen.getByRole('switch')
      
      expect(switchElement).toHaveAttribute('data-state', 'unchecked')
      await user.click(switchElement)
      expect(switchElement).toHaveAttribute('data-state', 'checked')
    })
  })

  describe('Textarea Component', () => {
    it('renders with gradient-green variant', () => {
      render(<Textarea variant="gradient-green" placeholder="Green textarea" />)
      const textarea = screen.getByPlaceholderText('Green textarea')
      expect(textarea).toHaveClass('focus-visible:ring-green-500/30')
      expect(textarea).toHaveClass('focus-visible:border-green-500')
    })

    it('renders with gradient-blue variant', () => {
      render(<Textarea variant="gradient-blue" placeholder="Blue textarea" />)
      const textarea = screen.getByPlaceholderText('Blue textarea')
      expect(textarea).toHaveClass('focus-visible:ring-blue-500/30')
      expect(textarea).toHaveClass('focus-visible:border-blue-500')
    })

    it('renders with professional variant', () => {
      render(<Textarea variant="professional" placeholder="Professional textarea" />)
      const textarea = screen.getByPlaceholderText('Professional textarea')
      expect(textarea).toHaveClass('focus-visible:ring-slate-500/20')
      expect(textarea).toHaveClass('focus-visible:border-slate-500')
    })

    it('handles validation states', () => {
      render(
        <Textarea 
          variant="gradient-green" 
          error="Test error" 
          placeholder="Error textarea" 
        />
      )
      const textarea = screen.getByPlaceholderText('Error textarea')
      expect(textarea).toHaveClass('border-error-500')
      expect(screen.getByText('Test error')).toBeInTheDocument()
    })

    it('shows character count when enabled', () => {
      render(
        <Textarea 
          showCharCount 
          maxLength={100} 
          placeholder="Counted textarea" 
        />
      )
      expect(screen.getByText('0/100')).toBeInTheDocument()
    })

    it('handles different sizes', () => {
      const { rerender } = render(<Textarea size="sm" placeholder="Small textarea" />)
      expect(screen.getByPlaceholderText('Small textarea')).toHaveClass('min-h-[60px]')

      rerender(<Textarea size="lg" placeholder="Large textarea" />)
      expect(screen.getByPlaceholderText('Large textarea')).toHaveClass('min-h-[120px]')
    })
  })

  describe('FormField Component', () => {
    it('renders with gradient-green variant', () => {
      render(
        <FormField variant="gradient-green" label="Test Label">
          <Input />
        </FormField>
      )
      expect(screen.getByText('Test Label')).toBeInTheDocument()
    })

    it('handles validation states with gradient styling', () => {
      render(
        <FormField 
          variant="gradient-blue" 
          label="Test Label" 
          error="Test error message"
        >
          <Input />
        </FormField>
      )
      
      expect(screen.getByText('Test error message')).toBeInTheDocument()
      const errorMessage = screen.getByText('Test error message').parentElement
      expect(errorMessage).toHaveClass('text-red-600')
    })

    it('shows loading state', () => {
      render(
        <FormField 
          variant="gradient-green" 
          label="Loading Field" 
          loading
        >
          <Input />
        </FormField>
      )
      
      const label = screen.getByText('Loading Field')
      expect(label.querySelector('svg')).toBeInTheDocument()
    })

    it('handles required fields', () => {
      render(
        <FormField 
          variant="gradient-purple" 
          label="Required Field" 
          required
        >
          <Input />
        </FormField>
      )
      
      const label = screen.getByText('Required Field')
      expect(label).toHaveClass('after:content-[\'*\']')
    })
  })

  describe('Form Loading Components', () => {
    it('renders InputLoading with gradient variant', () => {
      render(<InputLoading variant="gradient-green" />)
      const loading = document.querySelector('.bg-gradient-to-r.from-green-100.to-green-200')
      expect(loading).toBeInTheDocument()
    })

    it('renders TextareaLoading with gradient variant', () => {
      render(<TextareaLoading variant="gradient-blue" />)
      const loading = document.querySelector('.bg-gradient-to-r.from-blue-100.to-blue-200')
      expect(loading).toBeInTheDocument()
    })

    it('renders SelectLoading with gradient variant', () => {
      render(<SelectLoading variant="gradient-purple" />)
      const loading = document.querySelector('.bg-gradient-to-r.from-purple-100.to-purple-200')
      expect(loading).toBeInTheDocument()
    })

    it('renders CheckboxLoading with gradient variant', () => {
      render(<CheckboxLoading variant="gradient-pink" />)
      const loading = document.querySelector('.bg-gradient-to-r.from-pink-100.to-pink-200')
      expect(loading).toBeInTheDocument()
    })

    it('renders SwitchLoading with gradient variant', () => {
      render(<SwitchLoading variant="gradient-orange" />)
      const loading = document.querySelector('.bg-gradient-to-r.from-orange-100.to-orange-200')
      expect(loading).toBeInTheDocument()
    })

    it('renders RadioLoading with professional variant', () => {
      render(<RadioLoading variant="professional" />)
      const loading = document.querySelector('.bg-gradient-to-r.from-slate-100.to-slate-200')
      expect(loading).toBeInTheDocument()
    })

    it('renders FormSkeleton with multiple fields', () => {
      render(<FormSkeleton variant="gradient-green" fields={3} showButtons={2} />)
      
      // Should have 3 input loading components
      const inputLoadings = document.querySelectorAll('.bg-gradient-to-r.from-green-100.to-green-200')
      expect(inputLoadings.length).toBeGreaterThanOrEqual(3)
    })

    it('renders FormLoading with shimmer effect', () => {
      render(<FormLoading variant="gradient-teal" showShimmer />)
      const shimmer = document.querySelector('.bg-gradient-to-r.from-transparent.via-teal-200\\/60.to-transparent')
      expect(shimmer).toBeInTheDocument()
    })
  })

  describe('Form Component Integration', () => {
    it('renders complete form with gradient styling', () => {
      render(
        <form className="space-y-4">
          <FormField variant="gradient-green" label="Name" required>
            <Input variant="gradient-green" placeholder="Enter your name" />
          </FormField>
          
          <FormField variant="gradient-blue" label="Email">
            <Input variant="gradient-blue" type="email" placeholder="Enter your email" />
          </FormField>
          
          <FormField variant="gradient-purple" label="Category">
            <Select>
              <SelectTrigger variant="gradient-purple">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent variant="gradient-purple">
                <SelectItem variant="gradient-purple" value="cat1">Category 1</SelectItem>
                <SelectItem variant="gradient-purple" value="cat2">Category 2</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          
          <FormField variant="gradient-pink" label="Description">
            <Textarea variant="gradient-pink" placeholder="Enter description" />
          </FormField>
          
          <div className="flex items-center space-x-2">
            <Checkbox variant="gradient-green" id="terms" />
            <label htmlFor="terms">I agree to the terms</label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch variant="gradient-blue" id="notifications" />
            <label htmlFor="notifications">Enable notifications</label>
          </div>
          
          {/* RadioGroup temporarily disabled until component is implemented */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <input type="radio" name="options" value="option1" id="r1" className="text-purple-500" />
              <label htmlFor="r1">Option 1</label>
            </div>
            <div className="flex items-center space-x-2">
              <input type="radio" name="options" value="option2" id="r2" className="text-purple-500" />
              <label htmlFor="r2">Option 2</label>
            </div>
          </div>
        </form>
      )
      
      expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Select category')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter description')).toBeInTheDocument()
      expect(screen.getByText('I agree to the terms')).toBeInTheDocument()
      expect(screen.getByText('Enable notifications')).toBeInTheDocument()
      expect(screen.getByText('Option 1')).toBeInTheDocument()
      expect(screen.getByText('Option 2')).toBeInTheDocument()
    })

    it('handles form validation with gradient styling', async () => {
      const user = userEvent.setup()
      
      render(
        <form className="space-y-4">
          <FormField variant="gradient-green" label="Required Field" error="This field is required">
            <Input variant="gradient-green" placeholder="Required input" />
          </FormField>
          
          <FormField variant="gradient-blue" label="Valid Field" success="Field is valid">
            <Input variant="gradient-blue" placeholder="Valid input" />
          </FormField>
          
          <FormField variant="gradient-purple" label="Warning Field" warning="Please check this field">
            <Input variant="gradient-purple" placeholder="Warning input" />
          </FormField>
        </form>
      )
      
      expect(screen.getByText('This field is required')).toBeInTheDocument()
      expect(screen.getByText('Field is valid')).toBeInTheDocument()
      expect(screen.getByText('Please check this field')).toBeInTheDocument()
    })

    it('handles form loading states', () => {
      render(
        <div className="space-y-4">
          <FormSkeleton variant="gradient-green" fields={2} showButtons={1} />
          <div className="grid grid-cols-2 gap-4">
            <InputLoading variant="gradient-blue" />
            <SelectLoading variant="gradient-purple" />
          </div>
          <div className="flex space-x-4">
            <CheckboxLoading variant="gradient-pink" />
            <SwitchLoading variant="gradient-orange" />
            <RadioLoading variant="professional" />
          </div>
        </div>
      )
      
      // Verify loading components are rendered
      const loadingElements = document.querySelectorAll('[class*="bg-gradient-to-r"]')
      expect(loadingElements.length).toBeGreaterThan(0)
    })
  })

  describe('Accessibility', () => {
    it('maintains proper ARIA attributes with gradient styling', () => {
      render(
        <FormField variant="gradient-green" label="Accessible Field" error="Error message">
          <Input 
            variant="gradient-green" 
            placeholder="Accessible input"
            aria-describedby="error-message"
          />
        </FormField>
      )
      
      const input = screen.getByPlaceholderText('Accessible input')
      expect(input).toHaveAttribute('aria-describedby', 'error-message')
    })

    it('supports keyboard navigation with gradient styling', async () => {
      const user = userEvent.setup()
      
      render(
        <div className="space-y-4">
          <Input variant="gradient-green" placeholder="First input" />
          <Select>
            <SelectTrigger variant="gradient-blue">
              <SelectValue placeholder="Select option" />
            </SelectTrigger>
          </Select>
          <Checkbox variant="gradient-purple" />
          <Switch variant="gradient-pink" />
        </div>
      )
      
      // Tab through elements
      await user.tab()
      expect(screen.getByPlaceholderText('First input')).toHaveFocus()
      
      await user.tab()
      expect(screen.getByRole('combobox')).toHaveFocus()
      
      await user.tab()
      expect(screen.getByRole('checkbox')).toHaveFocus()
      
      await user.tab()
      expect(screen.getByRole('switch')).toHaveFocus()
    })
  })
})