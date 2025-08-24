import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const formLoadingVariants = cva(
  "relative overflow-hidden rounded-md animate-pulse",
  {
    variants: {
      variant: {
        default: "bg-muted",
        // Gradient loading variants
        "gradient-green": "bg-gradient-to-r from-green-100 to-green-200",
        "gradient-teal": "bg-gradient-to-r from-teal-100 to-teal-200",
        "gradient-blue": "bg-gradient-to-r from-blue-100 to-blue-200",
        "gradient-purple": "bg-gradient-to-r from-purple-100 to-purple-200",
        "gradient-pink": "bg-gradient-to-r from-pink-100 to-pink-200",
        "gradient-orange": "bg-gradient-to-r from-orange-100 to-orange-200",
        professional: "bg-gradient-to-r from-slate-100 to-slate-200",
      },
      size: {
        input: "h-10",
        textarea: "h-20",
        select: "h-10",
        checkbox: "h-4 w-4",
        switch: "h-6 w-11",
        radio: "h-4 w-4 rounded-full",
        button: "h-10 w-24",
        label: "h-4 w-16",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "input",
    },
  }
)

const shimmerVariants = cva(
  "absolute inset-0 -translate-x-full animate-shimmer",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-transparent via-white/60 to-transparent",
        "gradient-green": "bg-gradient-to-r from-transparent via-green-200/60 to-transparent",
        "gradient-teal": "bg-gradient-to-r from-transparent via-teal-200/60 to-transparent",
        "gradient-blue": "bg-gradient-to-r from-transparent via-blue-200/60 to-transparent",
        "gradient-purple": "bg-gradient-to-r from-transparent via-purple-200/60 to-transparent",
        "gradient-pink": "bg-gradient-to-r from-transparent via-pink-200/60 to-transparent",
        "gradient-orange": "bg-gradient-to-r from-transparent via-orange-200/60 to-transparent",
        professional: "bg-gradient-to-r from-transparent via-slate-200/60 to-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface FormLoadingProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof formLoadingVariants> {
  showShimmer?: boolean
}

const FormLoading = React.forwardRef<HTMLDivElement, FormLoadingProps>(
  ({ className, variant, size, showShimmer = true, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(formLoadingVariants({ variant, size, className }))}
        {...props}
      >
        {showShimmer && (
          <div className={cn(shimmerVariants({ variant }))} />
        )}
      </div>
    )
  }
)
FormLoading.displayName = "FormLoading"

// Specific loading components for different form elements
const InputLoading = React.forwardRef<HTMLDivElement, Omit<FormLoadingProps, 'size'>>(
  ({ variant = "professional", ...props }, ref) => (
    <FormLoading ref={ref} variant={variant} size="input" {...props} />
  )
)
InputLoading.displayName = "InputLoading"

const TextareaLoading = React.forwardRef<HTMLDivElement, Omit<FormLoadingProps, 'size'>>(
  ({ variant = "professional", ...props }, ref) => (
    <FormLoading ref={ref} variant={variant} size="textarea" {...props} />
  )
)
TextareaLoading.displayName = "TextareaLoading"

const SelectLoading = React.forwardRef<HTMLDivElement, Omit<FormLoadingProps, 'size'>>(
  ({ variant = "professional", ...props }, ref) => (
    <FormLoading ref={ref} variant={variant} size="select" {...props} />
  )
)
SelectLoading.displayName = "SelectLoading"

const CheckboxLoading = React.forwardRef<HTMLDivElement, Omit<FormLoadingProps, 'size'>>(
  ({ variant = "professional", ...props }, ref) => (
    <FormLoading ref={ref} variant={variant} size="checkbox" {...props} />
  )
)
CheckboxLoading.displayName = "CheckboxLoading"

const SwitchLoading = React.forwardRef<HTMLDivElement, Omit<FormLoadingProps, 'size'>>(
  ({ variant = "professional", ...props }, ref) => (
    <FormLoading ref={ref} variant={variant} size="switch" {...props} />
  )
)
SwitchLoading.displayName = "SwitchLoading"

const RadioLoading = React.forwardRef<HTMLDivElement, Omit<FormLoadingProps, 'size'>>(
  ({ variant = "professional", ...props }, ref) => (
    <FormLoading ref={ref} variant={variant} size="radio" {...props} />
  )
)
RadioLoading.displayName = "RadioLoading"

const ButtonLoading = React.forwardRef<HTMLDivElement, Omit<FormLoadingProps, 'size'>>(
  ({ variant = "professional", ...props }, ref) => (
    <FormLoading ref={ref} variant={variant} size="button" {...props} />
  )
)
ButtonLoading.displayName = "ButtonLoading"

const LabelLoading = React.forwardRef<HTMLDivElement, Omit<FormLoadingProps, 'size'>>(
  ({ variant = "professional", ...props }, ref) => (
    <FormLoading ref={ref} variant={variant} size="label" {...props} />
  )
)
LabelLoading.displayName = "LabelLoading"

// Form skeleton component for complete form loading states
export interface FormSkeletonProps {
  variant?: VariantProps<typeof formLoadingVariants>['variant']
  fields?: number
  showLabels?: boolean
  showButtons?: number
  className?: string
}

const FormSkeleton: React.FC<FormSkeletonProps> = ({
  variant = "professional",
  fields = 3,
  showLabels = true,
  showButtons = 1,
  className
}) => {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="space-y-2">
          {showLabels && <LabelLoading variant={variant} />}
          <InputLoading variant={variant} />
        </div>
      ))}
      
      {showButtons > 0 && (
        <div className="flex gap-2 pt-2">
          {Array.from({ length: showButtons }).map((_, index) => (
            <ButtonLoading key={index} variant={variant} />
          ))}
        </div>
      )}
    </div>
  )
}

export {
  FormLoading,
  InputLoading,
  TextareaLoading,
  SelectLoading,
  CheckboxLoading,
  SwitchLoading,
  RadioLoading,
  ButtonLoading,
  LabelLoading,
  FormSkeleton,
  formLoadingVariants
}