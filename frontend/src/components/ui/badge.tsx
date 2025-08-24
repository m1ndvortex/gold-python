import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        // Gradient badge variants matching reports/charts design
        "gradient-green": "border-transparent bg-gradient-to-r from-green-500 to-teal-600 text-white hover:from-green-600 hover:to-teal-700 shadow-sm hover:shadow-md",
        "gradient-teal": "border-transparent bg-gradient-to-r from-teal-500 to-blue-600 text-white hover:from-teal-600 hover:to-blue-700 shadow-sm hover:shadow-md",
        "gradient-blue": "border-transparent bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-sm hover:shadow-md",
        "gradient-purple": "border-transparent bg-gradient-to-r from-purple-500 to-violet-600 text-white hover:from-purple-600 hover:to-violet-700 shadow-sm hover:shadow-md",
        "gradient-pink": "border-transparent bg-gradient-to-r from-pink-500 to-rose-600 text-white hover:from-pink-600 hover:to-rose-700 shadow-sm hover:shadow-md",
        "gradient-orange": "border-transparent bg-gradient-to-r from-orange-500 to-red-600 text-white hover:from-orange-600 hover:to-red-700 shadow-sm hover:shadow-md",
        // Light gradient variants
        "gradient-green-light": "border-green-200 bg-green-50 text-green-700 hover:bg-green-100",
        "gradient-teal-light": "border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100",
        "gradient-blue-light": "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100",
        "gradient-purple-light": "border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100",
        // Status badges with gradients
        success: "border-transparent bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-sm",
        warning: "border-transparent bg-gradient-to-r from-yellow-500 to-orange-600 text-white shadow-sm",
        error: "border-transparent bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-sm",
        info: "border-transparent bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-sm",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }