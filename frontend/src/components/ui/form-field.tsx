import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react"

import { cn } from "../../lib/utils"

const formFieldVariants = cva(
  "space-y-2",
  {
    variants: {
      variant: {
        default: "",
        success: "",
        error: "",
        warning: "",
        info: "",
        // Gradient variants
        "gradient-green": "",
        "gradient-teal": "",
        "gradient-blue": "",
        "gradient-purple": "",
        "gradient-pink": "",
        "gradient-orange": "",
        professional: "",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const formLabelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 transition-colors duration-200",
  {
    variants: {
      variant: {
        default: "text-foreground",
        success: "text-green-700",
        error: "text-red-700",
        warning: "text-orange-700",
        info: "text-blue-700",
        // Gradient variants
        "gradient-green": "text-green-700",
        "gradient-teal": "text-teal-700",
        "gradient-blue": "text-blue-700",
        "gradient-purple": "text-purple-700",
        "gradient-pink": "text-pink-700",
        "gradient-orange": "text-orange-700",
        professional: "text-slate-700",
      },
      required: {
        true: "after:content-['*'] after:ml-1 after:text-red-500",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      required: false,
    },
  }
)

const formMessageVariants = cva(
  "text-xs flex items-center gap-1.5 transition-all duration-300",
  {
    variants: {
      variant: {
        default: "text-muted-foreground",
        success: "text-green-600 bg-green-50/50 border border-green-200 rounded-md px-2 py-1",
        error: "text-red-600 bg-red-50/50 border border-red-200 rounded-md px-2 py-1",
        warning: "text-orange-600 bg-orange-50/50 border border-orange-200 rounded-md px-2 py-1",
        info: "text-blue-600 bg-blue-50/50 border border-blue-200 rounded-md px-2 py-1",
        // Gradient variants with enhanced styling
        "gradient-green": "text-green-700 bg-gradient-to-r from-green-50 to-green-100/50 border border-green-200 rounded-md px-2 py-1 shadow-sm",
        "gradient-teal": "text-teal-700 bg-gradient-to-r from-teal-50 to-teal-100/50 border border-teal-200 rounded-md px-2 py-1 shadow-sm",
        "gradient-blue": "text-blue-700 bg-gradient-to-r from-blue-50 to-blue-100/50 border border-blue-200 rounded-md px-2 py-1 shadow-sm",
        "gradient-purple": "text-purple-700 bg-gradient-to-r from-purple-50 to-purple-100/50 border border-purple-200 rounded-md px-2 py-1 shadow-sm",
        "gradient-pink": "text-pink-700 bg-gradient-to-r from-pink-50 to-pink-100/50 border border-pink-200 rounded-md px-2 py-1 shadow-sm",
        "gradient-orange": "text-orange-700 bg-gradient-to-r from-orange-50 to-orange-100/50 border border-orange-200 rounded-md px-2 py-1 shadow-sm",
        professional: "text-slate-700 bg-gradient-to-r from-slate-50 to-slate-100/50 border border-slate-200 rounded-md px-2 py-1 shadow-sm",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const formDescriptionVariants = cva(
  "text-xs text-muted-foreground transition-colors duration-200",
  {
    variants: {
      variant: {
        default: "",
        success: "text-green-600",
        error: "text-red-600",
        warning: "text-orange-600",
        info: "text-blue-600",
        // Gradient variants
        "gradient-green": "text-green-600",
        "gradient-teal": "text-teal-600",
        "gradient-blue": "text-blue-600",
        "gradient-purple": "text-purple-600",
        "gradient-pink": "text-pink-600",
        "gradient-orange": "text-orange-600",
        professional: "text-slate-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface FormFieldProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof formFieldVariants> {
  label?: string
  description?: string
  error?: string
  success?: string
  warning?: string
  info?: string
  required?: boolean
  loading?: boolean
}

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ 
    className, 
    variant, 
    label, 
    description, 
    error, 
    success, 
    warning, 
    info, 
    required = false,
    loading = false,
    children, 
    ...props 
  }, ref) => {
    // Determine the actual variant based on validation state
    const actualVariant = error ? "error" : success ? "success" : warning ? "warning" : info ? "info" : variant

    // Get the appropriate icon for the message
    const getMessageIcon = () => {
      if (error) return <AlertCircle className="h-3 w-3 flex-shrink-0" />
      if (success) return <CheckCircle2 className="h-3 w-3 flex-shrink-0" />
      if (warning) return <AlertTriangle className="h-3 w-3 flex-shrink-0" />
      if (info) return <Info className="h-3 w-3 flex-shrink-0" />
      return null
    }

    // Get the message text
    const getMessage = () => {
      if (error) return error
      if (success) return success
      if (warning) return warning
      if (info) return info
      return null
    }

    return (
      <div
        ref={ref}
        className={cn(formFieldVariants({ variant: actualVariant, className }))}
        {...props}
      >
        {label && (
          <label className={cn(formLabelVariants({ variant: actualVariant, required }))}>
            {label}
            {loading && (
              <span className="ml-2 inline-block">
                <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </span>
            )}
          </label>
        )}
        
        {description && (
          <p className={cn(formDescriptionVariants({ variant: actualVariant }))}>
            {description}
          </p>
        )}
        
        <div className="relative">
          {children}
        </div>
        
        {getMessage() && (
          <div className={cn(formMessageVariants({ variant: actualVariant }))}>
            {getMessageIcon()}
            <span>{getMessage()}</span>
          </div>
        )}
      </div>
    )
  }
)
FormField.displayName = "FormField"

export { FormField, formFieldVariants, formLabelVariants, formMessageVariants, formDescriptionVariants }