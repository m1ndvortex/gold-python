import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { AlertCircle, CheckCircle2 } from "lucide-react"

import { cn } from "../../lib/utils"

const textareaVariants = cva(
  "flex min-h-[80px] w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 resize-vertical",
  {
    variants: {
      variant: {
        default: "border-input focus-visible:ring-ring hover:border-ring/50",
        success: "border-success-500 focus-visible:ring-success-500 text-success-700 hover:border-success-600",
        error: "border-error-500 focus-visible:ring-error-500 text-error-700 hover:border-error-600",
        warning: "border-warning-500 focus-visible:ring-warning-500 text-warning-700 hover:border-warning-600",
        // Enhanced gradient focus variants matching reports/charts design
        "gradient-green": "border-input focus-visible:ring-green-500/30 focus-visible:border-green-500 hover:border-green-400 focus-visible:shadow-lg focus-visible:shadow-green-500/10",
        "gradient-teal": "border-input focus-visible:ring-teal-500/30 focus-visible:border-teal-500 hover:border-teal-400 focus-visible:shadow-lg focus-visible:shadow-teal-500/10",
        "gradient-blue": "border-input focus-visible:ring-blue-500/30 focus-visible:border-blue-500 hover:border-blue-400 focus-visible:shadow-lg focus-visible:shadow-blue-500/10",
        "gradient-purple": "border-input focus-visible:ring-purple-500/30 focus-visible:border-purple-500 hover:border-purple-400 focus-visible:shadow-lg focus-visible:shadow-purple-500/10",
        "gradient-pink": "border-input focus-visible:ring-pink-500/30 focus-visible:border-pink-500 hover:border-pink-400 focus-visible:shadow-lg focus-visible:shadow-pink-500/10",
        "gradient-orange": "border-input focus-visible:ring-orange-500/30 focus-visible:border-orange-500 hover:border-orange-400 focus-visible:shadow-lg focus-visible:shadow-orange-500/10",
        // Professional variant with subtle gradient effect
        professional: "border-input focus-visible:ring-slate-500/20 focus-visible:border-slate-500 hover:border-slate-400 focus-visible:shadow-lg focus-visible:shadow-slate-500/5",
      },
      size: {
        default: "min-h-[80px]",
        sm: "min-h-[60px] text-xs",
        lg: "min-h-[120px] text-base",
        xl: "min-h-[160px] text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'>,
    VariantProps<typeof textareaVariants> {
  label?: string
  error?: string
  success?: string
  warning?: string
  helpText?: string
  maxLength?: number
  showCharCount?: boolean
  autoResize?: boolean
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ 
    className, 
    variant,
    size,
    label,
    error,
    success,
    warning,
    helpText,
    maxLength,
    showCharCount = false,
    autoResize = false,
    ...props 
  }, ref) => {
    const [charCount, setCharCount] = React.useState(0)
    const textareaRef = React.useRef<HTMLTextAreaElement>(null)
    
    React.useImperativeHandle(ref, () => textareaRef.current!)
    
    // Determine variant based on validation state
    const actualVariant = error ? "error" : success ? "success" : warning ? "warning" : variant
    
    // Handle input changes for character counting and auto-resize
    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value
      setCharCount(value.length)
      
      // Auto-resize functionality
      if (autoResize && textareaRef.current) {
        textareaRef.current.style.height = 'auto'
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
      }
      
      props.onChange?.(e)
    }
    
    // Initialize character count
    React.useEffect(() => {
      if (textareaRef.current) {
        setCharCount(textareaRef.current.value.length)
        
        // Initialize auto-resize
        if (autoResize) {
          textareaRef.current.style.height = 'auto'
          textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
        }
      }
    }, [props.value, props.defaultValue, autoResize])
    
    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
          </label>
        )}
        
        <div className="relative">
          <textarea
            ref={textareaRef}
            className={cn(textareaVariants({ variant: actualVariant, size, className }))}
            maxLength={maxLength}
            onChange={handleInputChange}
            {...props}
          />
          
          {/* Validation Icons */}
          <div className="absolute top-3 right-3 flex items-center space-x-1">
            {error && <AlertCircle className="h-4 w-4 text-error-500" />}
            {success && <CheckCircle2 className="h-4 w-4 text-success-500" />}
            {warning && <AlertCircle className="h-4 w-4 text-warning-500" />}
          </div>
        </div>
        
        {/* Character count and help text */}
        <div className="flex justify-between items-center text-xs">
          <div>
            {error && <p className="text-error-600">{error}</p>}
            {success && <p className="text-success-600">{success}</p>}
            {warning && <p className="text-warning-600">{warning}</p>}
            {helpText && !error && !success && !warning && (
              <p className="text-muted-foreground">{helpText}</p>
            )}
          </div>
          
          {(showCharCount || maxLength) && (
            <div className={cn(
              "text-muted-foreground",
              maxLength && charCount > maxLength * 0.9 && "text-warning-600",
              maxLength && charCount >= maxLength && "text-error-600"
            )}>
              {charCount}{maxLength && `/${maxLength}`}
            </div>
          )}
        </div>
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea, textareaVariants }