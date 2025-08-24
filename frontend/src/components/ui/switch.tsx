import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const switchVariants = cva(
  "peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "focus-visible:ring-ring data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
        // Gradient variants matching reports/charts design
        "gradient-green": "focus-visible:ring-green-500/30 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-green-500 data-[state=checked]:to-green-600 data-[state=checked]:shadow-lg data-[state=checked]:shadow-green-500/20 data-[state=unchecked]:bg-input hover:data-[state=unchecked]:bg-green-100/50",
        "gradient-teal": "focus-visible:ring-teal-500/30 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-teal-500 data-[state=checked]:to-teal-600 data-[state=checked]:shadow-lg data-[state=checked]:shadow-teal-500/20 data-[state=unchecked]:bg-input hover:data-[state=unchecked]:bg-teal-100/50",
        "gradient-blue": "focus-visible:ring-blue-500/30 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-blue-600 data-[state=checked]:shadow-lg data-[state=checked]:shadow-blue-500/20 data-[state=unchecked]:bg-input hover:data-[state=unchecked]:bg-blue-100/50",
        "gradient-purple": "focus-visible:ring-purple-500/30 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-purple-500 data-[state=checked]:to-purple-600 data-[state=checked]:shadow-lg data-[state=checked]:shadow-purple-500/20 data-[state=unchecked]:bg-input hover:data-[state=unchecked]:bg-purple-100/50",
        "gradient-pink": "focus-visible:ring-pink-500/30 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-pink-500 data-[state=checked]:to-pink-600 data-[state=checked]:shadow-lg data-[state=checked]:shadow-pink-500/20 data-[state=unchecked]:bg-input hover:data-[state=unchecked]:bg-pink-100/50",
        "gradient-orange": "focus-visible:ring-orange-500/30 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-orange-500 data-[state=checked]:to-orange-600 data-[state=checked]:shadow-lg data-[state=checked]:shadow-orange-500/20 data-[state=unchecked]:bg-input hover:data-[state=unchecked]:bg-orange-100/50",
        // Professional variant
        professional: "focus-visible:ring-slate-500/20 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-slate-600 data-[state=checked]:to-slate-700 data-[state=checked]:shadow-lg data-[state=checked]:shadow-slate-500/10 data-[state=unchecked]:bg-input hover:data-[state=unchecked]:bg-slate-100/50",
      },
      size: {
        default: "h-6 w-11",
        sm: "h-5 w-9",
        lg: "h-7 w-13",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const switchThumbVariants = cva(
  "pointer-events-none block rounded-full bg-background shadow-lg ring-0 transition-transform duration-300",
  {
    variants: {
      size: {
        default: "h-5 w-5 data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
        sm: "h-4 w-4 data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0",
        lg: "h-6 w-6 data-[state=checked]:translate-x-6 data-[state=unchecked]:translate-x-0",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

export interface SwitchProps
  extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>,
    VariantProps<typeof switchVariants> {}

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  SwitchProps
>(({ className, variant, size, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(switchVariants({ variant, size, className }))}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(switchThumbVariants({ size }))}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch, switchVariants }