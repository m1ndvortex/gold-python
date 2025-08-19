import * as React from "react"
import { Check, ChevronDown, Search, X, AlertCircle, CheckCircle2 } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const selectVariants = cva(
  "flex h-10 w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300",
  {
    variants: {
      variant: {
        default: "border-input focus:ring-ring",
        success: "border-success-500 focus:ring-success-500",
        error: "border-error-500 focus:ring-error-500",
        warning: "border-warning-500 focus:ring-warning-500",
      },
      size: {
        default: "h-10",
        sm: "h-8 text-xs",
        lg: "h-12 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
  description?: string
  icon?: React.ReactNode
}

export interface SearchableSelectProps extends VariantProps<typeof selectVariants> {
  options: SelectOption[]
  value?: string
  defaultValue?: string
  placeholder?: string
  searchPlaceholder?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  clearable?: boolean
  searchable?: boolean
  multiple?: boolean
  className?: string
  label?: string
  error?: string
  success?: string
  warning?: string
  helpText?: string
  emptyMessage?: string
  loading?: boolean
  maxHeight?: string
}

const SearchableSelect = React.forwardRef<HTMLDivElement, SearchableSelectProps>(
  ({
    options,
    value,
    defaultValue,
    placeholder = "Select an option...",
    searchPlaceholder = "Search options...",
    onValueChange,
    disabled = false,
    clearable = false,
    searchable = true,
    multiple = false,
    className,
    variant,
    size,
    label,
    error,
    success,
    warning,
    helpText,
    emptyMessage = "No options found",
    loading = false,
    maxHeight = "300px",
    ...props
  }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false)
    const [searchTerm, setSearchTerm] = React.useState("")
    const [selectedValues, setSelectedValues] = React.useState<string[]>(
      multiple 
        ? (Array.isArray(value) ? value : value ? [value] : [])
        : value ? [value] : defaultValue ? [defaultValue] : []
    )
    
    const containerRef = React.useRef<HTMLDivElement>(null)
    const searchInputRef = React.useRef<HTMLInputElement>(null)
    
    React.useImperativeHandle(ref, () => containerRef.current!)
    
    // Determine variant based on validation state
    const actualVariant = error ? "error" : success ? "success" : warning ? "warning" : variant
    
    // Filter options based on search term
    const filteredOptions = React.useMemo(() => {
      if (!searchTerm) return options
      return options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        option.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }, [options, searchTerm])
    
    // Get selected option(s) for display
    const selectedOptions = React.useMemo(() => {
      return options.filter(option => selectedValues.includes(option.value))
    }, [options, selectedValues])
    
    // Handle option selection
    const handleSelect = (optionValue: string) => {
      if (multiple) {
        const newValues = selectedValues.includes(optionValue)
          ? selectedValues.filter(v => v !== optionValue)
          : [...selectedValues, optionValue]
        setSelectedValues(newValues)
        onValueChange?.(newValues.join(','))
      } else {
        setSelectedValues([optionValue])
        onValueChange?.(optionValue)
        setIsOpen(false)
      }
    }
    
    // Handle clear
    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation()
      setSelectedValues([])
      onValueChange?.(multiple ? '' : '')
    }
    
    // Close dropdown when clicking outside
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false)
          setSearchTerm("")
        }
      }
      
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])
    
    // Focus search input when dropdown opens
    React.useEffect(() => {
      if (isOpen && searchable && searchInputRef.current) {
        searchInputRef.current.focus()
      }
    }, [isOpen, searchable])
    
    // Display value
    const displayValue = React.useMemo(() => {
      if (selectedOptions.length === 0) return placeholder
      if (multiple) {
        return selectedOptions.length === 1 
          ? selectedOptions[0].label
          : `${selectedOptions.length} selected`
      }
      return selectedOptions[0]?.label || placeholder
    }, [selectedOptions, placeholder, multiple])
    
    const selectElement = (
      <div className="relative" ref={containerRef}>
        {/* Trigger */}
        <div
          className={cn(selectVariants({ variant: actualVariant, size, className }))}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          {...props}
        >
          <span className={cn(
            "block truncate",
            selectedOptions.length === 0 && "text-muted-foreground"
          )}>
            {displayValue}
          </span>
          
          <div className="flex items-center space-x-1">
            {/* Validation Icons */}
            {error && <AlertCircle className="h-4 w-4 text-error-500" />}
            {success && <CheckCircle2 className="h-4 w-4 text-success-500" />}
            {warning && <AlertCircle className="h-4 w-4 text-warning-500" />}
            
            {/* Clear Button */}
            {clearable && selectedValues.length > 0 && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            
            {/* Dropdown Arrow */}
            <ChevronDown className={cn(
              "h-4 w-4 transition-transform duration-200",
              isOpen && "rotate-180"
            )} />
          </div>
        </div>
        
        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg">
            {/* Search Input */}
            {searchable && (
              <div className="p-2 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder={searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm bg-background border border-input rounded focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
            )}
            
            {/* Options */}
            <div 
              className="max-h-60 overflow-auto p-1"
              style={{ maxHeight }}
            >
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
                </div>
              ) : filteredOptions.length === 0 ? (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  {emptyMessage}
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <div
                    key={option.value}
                    className={cn(
                      "relative flex items-center px-2 py-2 text-sm cursor-pointer rounded hover:bg-accent hover:text-accent-foreground",
                      option.disabled && "opacity-50 cursor-not-allowed",
                      selectedValues.includes(option.value) && "bg-accent text-accent-foreground"
                    )}
                    onClick={() => !option.disabled && handleSelect(option.value)}
                  >
                    {/* Selection Indicator */}
                    <div className="flex items-center justify-center w-4 h-4 mr-2">
                      {selectedValues.includes(option.value) && (
                        <Check className="h-3 w-3" />
                      )}
                    </div>
                    
                    {/* Option Icon */}
                    {option.icon && (
                      <div className="mr-2 text-muted-foreground">
                        {option.icon}
                      </div>
                    )}
                    
                    {/* Option Content */}
                    <div className="flex-1 min-w-0">
                      <div className="truncate">{option.label}</div>
                      {option.description && (
                        <div className="text-xs text-muted-foreground truncate">
                          {option.description}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    )
    
    // Wrap with label and validation messages if needed
    if (label || error || success || warning || helpText) {
      return (
        <div className="space-y-2">
          {label && (
            <label className="text-sm font-medium leading-none">
              {label}
            </label>
          )}
          
          {selectElement}
          
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
    
    return selectElement
  }
)

SearchableSelect.displayName = "SearchableSelect"

export { SearchableSelect, selectVariants }