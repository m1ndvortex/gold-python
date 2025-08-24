import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check, Minus } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const checkboxVariants = cva(
  "peer h-4 w-4 shrink-0 rounded-sm border ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300",
  {
    variants: {
      variant: {
        default: "border-primary focus-visible:ring-ring data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground",
        // Gradient variants matching reports/charts design
        "gradient-green": "border-green-500 focus-visible:ring-green-500/30 data-[state=checked]:bg-gradient-to-br data-[state=checked]:from-green-500 data-[state=checked]:to-green-600 data-[state=checked]:text-white data-[state=checked]:shadow-lg data-[state=checked]:shadow-green-500/20 data-[state=indeterminate]:bg-gradient-to-br data-[state=indeterminate]:from-green-500 data-[state=indeterminate]:to-green-600 data-[state=indeterminate]:text-white",
        "gradient-teal": "border-teal-500 focus-visible:ring-teal-500/30 data-[state=checked]:bg-gradient-to-br data-[state=checked]:from-teal-500 data-[state=checked]:to-teal-600 data-[state=checked]:text-white data-[state=checked]:shadow-lg data-[state=checked]:shadow-teal-500/20 data-[state=indeterminate]:bg-gradient-to-br data-[state=indeterminate]:from-teal-500 data-[state=indeterminate]:to-teal-600 data-[state=indeterminate]:text-white",
        "gradient-blue": "border-blue-500 focus-visible:ring-blue-500/30 data-[state=checked]:bg-gradient-to-br data-[state=checked]:from-blue-500 data-[state=checked]:to-blue-600 data-[state=checked]:text-white data-[state=checked]:shadow-lg data-[state=checked]:shadow-blue-500/20 data-[state=indeterminate]:bg-gradient-to-br data-[state=indeterminate]:from-blue-500 data-[state=indeterminate]:to-blue-600 data-[state=indeterminate]:text-white",
        "gradient-purple": "border-purple-500 focus-visible:ring-purple-500/30 data-[state=checked]:bg-gradient-to-br data-[state=checked]:from-purple-500 data-[state=checked]:to-purple-600 data-[state=checked]:text-white data-[state=checked]:shadow-lg data-[state=checked]:shadow-purple-500/20 data-[state=indeterminate]:bg-gradient-to-br data-[state=indeterminate]:from-purple-500 data-[state=indeterminate]:to-purple-600 data-[state=indeterminate]:text-white",
        "gradient-pink": "border-pink-500 focus-visible:ring-pink-500/30 data-[state=checked]:bg-gradient-to-br data-[state=checked]:from-pink-500 data-[state=checked]:to-pink-600 data-[state=checked]:text-white data-[state=checked]:shadow-lg data-[state=checked]:shadow-pink-500/20 data-[state=indeterminate]:bg-gradient-to-br data-[state=indeterminate]:from-pink-500 data-[state=indeterminate]:to-pink-600 data-[state=indeterminate]:text-white",
        "gradient-orange": "border-orange-500 focus-visible:ring-orange-500/30 data-[state=checked]:bg-gradient-to-br data-[state=checked]:from-orange-500 data-[state=checked]:to-orange-600 data-[state=checked]:text-white data-[state=checked]:shadow-lg data-[state=checked]:shadow-orange-500/20 data-[state=indeterminate]:bg-gradient-to-br data-[state=indeterminate]:from-orange-500 data-[state=indeterminate]:to-orange-600 data-[state=indeterminate]:text-white",
        // Professional variant
        professional: "border-slate-500 focus-visible:ring-slate-500/20 data-[state=checked]:bg-gradient-to-br data-[state=checked]:from-slate-600 data-[state=checked]:to-slate-700 data-[state=checked]:text-white data-[state=checked]:shadow-lg data-[state=checked]:shadow-slate-500/10 data-[state=indeterminate]:bg-gradient-to-br data-[state=indeterminate]:from-slate-600 data-[state=indeterminate]:to-slate-700 data-[state=indeterminate]:text-white",
      },
      size: {
        default: "h-4 w-4",
        sm: "h-3 w-3",
        lg: "h-5 w-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface CheckboxProps
  extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>,
    VariantProps<typeof checkboxVariants> {
  indeterminate?: boolean
}

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, variant, size, indeterminate = false, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(checkboxVariants({ variant, size, className }))}
    {...props}
    data-state={indeterminate ? "indeterminate" : props.checked ? "checked" : "unchecked"}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      {indeterminate ? (
        <Minus className={cn(
          size === "sm" ? "h-2 w-2" : size === "lg" ? "h-4 w-4" : "h-3 w-3"
        )} />
      ) : (
        <Check className={cn(
          size === "sm" ? "h-2 w-2" : size === "lg" ? "h-4 w-4" : "h-3 w-3"
        )} />
      )}
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox, checkboxVariants }