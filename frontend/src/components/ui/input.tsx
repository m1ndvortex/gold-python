import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react"

import { cn } from "../../lib/utils"

const inputVariants = cva(
  "flex w-full rounded-md border bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300",
  {
    variants: {
      variant: {
        default: "border-input focus-visible:ring-ring hover:border-ring/50",
        floating: "border-input focus-visible:ring-ring peer hover:border-ring/50",
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
        default: "h-10 px-3 py-2",
        sm: "h-8 px-2 py-1 text-xs",
        lg: "h-12 px-4 py-3 text-base",
        xl: "h-14 px-5 py-4 text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  label?: string
  error?: string
  success?: string
  warning?: string
  helpText?: string
  showPasswordToggle?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  floating?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    type, 
    variant,
    size,
    label,
    error,
    success,
    warning,
    helpText,
    showPasswordToggle = false,
    leftIcon,
    rightIcon,
    floating = false,
    ...props 
  }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)
    const [isFocused, setIsFocused] = React.useState(false)
    const [hasValue, setHasValue] = React.useState(false)
    
    const inputRef = React.useRef<HTMLInputElement>(null)
    
    React.useImperativeHandle(ref, () => inputRef.current!)
    
    // Determine the actual input type
    const inputType = showPasswordToggle && type === "password" 
      ? (showPassword ? "text" : "password")
      : type
    
    // Determine variant based on validation state
    const actualVariant = error ? "error" : success ? "success" : warning ? "warning" : variant
    
    // Handle input changes to track if it has value
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(e.target.value.length > 0)
      props.onChange?.(e)
    }
    
    // Check initial value
    React.useEffect(() => {
      if (inputRef.current) {
        setHasValue(inputRef.current.value.length > 0)
      }
    }, [props.value, props.defaultValue])
    
    const inputElement = (
      <input
        ref={inputRef}
        type={inputType}
        className={cn(
          inputVariants({ variant: floating ? "floating" : actualVariant, size, className }),
          leftIcon && "pl-10",
          (rightIcon || showPasswordToggle || error || success || warning) && "pr-10"
        )}
        onFocus={(e) => {
          setIsFocused(true)
          props.onFocus?.(e)
        }}
        onBlur={(e) => {
          setIsFocused(false)
          props.onBlur?.(e)
        }}
        onChange={handleInputChange}
        {...props}
      />
    )
    
    if (floating && label) {
      return (
        <div className="relative">
          {inputElement}
          <label
            className={cn(
              "absolute left-3 transition-all duration-300 pointer-events-none",
              "peer-placeholder-shown:text-muted-foreground peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-sm",
              "peer-focus:top-0 peer-focus:text-xs peer-focus:text-primary-600 peer-focus:bg-background peer-focus:px-1 peer-focus:-translate-y-1/2",
              (hasValue || isFocused) && "top-0 text-xs text-primary-600 bg-background px-1 -translate-y-1/2",
              error && "peer-focus:text-error-600",
              success && "peer-focus:text-success-600",
              warning && "peer-focus:text-warning-600"
            )}
          >
            {label}
          </label>
          
          {/* Left Icon */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {leftIcon}
            </div>
          )}
          
          {/* Right Icons */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1">
            {/* Validation Icons */}
            {error && <AlertCircle className="h-4 w-4 text-error-500" />}
            {success && <CheckCircle2 className="h-4 w-4 text-success-500" />}
            {warning && <AlertCircle className="h-4 w-4 text-warning-500" />}
            
            {/* Custom Right Icon */}
            {rightIcon && !showPasswordToggle && (
              <div className="text-muted-foreground">{rightIcon}</div>
            )}
            
            {/* Password Toggle */}
            {showPasswordToggle && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            )}
          </div>
          
          {/* Help Text and Validation Messages */}
          {(error || success || warning || helpText) && (
            <div className="mt-1 text-xs">
              {error && <p className="text-error-600">{error}</p>}
              {success && <p className="text-success-600">{success}</p>}
              {warning && <p className="text-warning-600">{warning}</p>}
              {helpText && !error && !success && !warning && (
                <p className="text-muted-foreground">{helpText}</p>
              )}
            </div>
          )}
        </div>
      )
    }
    
    // Non-floating input with traditional label
    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
          </label>
        )}
        
        <div className="relative">
          {/* Left Icon */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {leftIcon}
            </div>
          )}
          
          {inputElement}
          
          {/* Right Icons */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1">
            {/* Validation Icons */}
            {error && <AlertCircle className="h-4 w-4 text-error-500" />}
            {success && <CheckCircle2 className="h-4 w-4 text-success-500" />}
            {warning && <AlertCircle className="h-4 w-4 text-warning-500" />}
            
            {/* Custom Right Icon */}
            {rightIcon && !showPasswordToggle && (
              <div className="text-muted-foreground">{rightIcon}</div>
            )}
            
            {/* Password Toggle */}
            {showPasswordToggle && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            )}
          </div>
        </div>
        
        {/* Help Text and Validation Messages */}
        {(error || success || warning || helpText) && (
          <div className="text-xs">
            {error && <p className="text-error-600">{error}</p>}
            {success && <p className="text-success-600">{success}</p>}
            {warning && <p className="text-warning-600">{warning}</p>}
            {helpText && !error && !success && !warning && (
              <p className="text-muted-foreground">{helpText}</p>
            )}
          </div>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input, inputVariants }