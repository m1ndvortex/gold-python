import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "../../lib/utils"

// Dynamically import framer-motion to handle cases where it might not be available
let motion: any = null;
try {
  motion = require("framer-motion").motion;
} catch (error) {
  // Fallback for environments where framer-motion is not available
  motion = {
    button: React.forwardRef<HTMLButtonElement, any>(({ children, ...props }, ref) => (
      <button ref={ref} {...props}>
        {children}
      </button>
    )),
  };
}

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden",
  {
    variants: {
      variant: {
        // Gold theme variants
        default: "bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 shadow-md hover:shadow-lg hover:shadow-primary-500/25 transform hover:scale-[1.02] active:scale-[0.98]",
        gold: "bg-gradient-to-r from-primary-400 to-primary-600 text-white hover:from-primary-500 hover:to-primary-700 shadow-gold-md hover:shadow-gold-lg transform hover:scale-[1.02] active:scale-[0.98]",
        "gold-outline": "border-2 border-primary-500 text-primary-600 bg-transparent hover:bg-primary-50 hover:border-primary-600 hover:text-primary-700 shadow-sm hover:shadow-gold transform hover:scale-[1.02] active:scale-[0.98]",
        "gold-ghost": "text-primary-600 hover:bg-primary-50 hover:text-primary-700 transform hover:scale-[1.02] active:scale-[0.98]",
        
        // Professional variants
        primary: "bg-primary-500 text-white hover:bg-primary-600 shadow-professional hover:shadow-elegant transform hover:scale-[1.02] active:scale-[0.98]",
        secondary: "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 hover:text-neutral-800 shadow-sm hover:shadow-md transform hover:scale-[1.02] active:scale-[0.98]",
        
        // Semantic variants with enhanced styling
        success: "bg-success-500 text-white hover:bg-success-600 shadow-md hover:shadow-lg hover:shadow-success-500/25 transform hover:scale-[1.02] active:scale-[0.98]",
        warning: "bg-warning-500 text-white hover:bg-warning-600 shadow-md hover:shadow-lg hover:shadow-warning-500/25 transform hover:scale-[1.02] active:scale-[0.98]",
        error: "bg-error-500 text-white hover:bg-error-600 shadow-md hover:shadow-lg hover:shadow-error-500/25 transform hover:scale-[1.02] active:scale-[0.98]",
        info: "bg-info-500 text-white hover:bg-info-600 shadow-md hover:shadow-lg hover:shadow-info-500/25 transform hover:scale-[1.02] active:scale-[0.98]",
        
        // Original ShadCN variants for compatibility
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-sm hover:shadow-md transform hover:scale-[1.02] active:scale-[0.98]",
        ghost: "hover:bg-accent hover:text-accent-foreground transform hover:scale-[1.02] active:scale-[0.98]",
        link: "text-primary underline-offset-4 hover:underline transform hover:scale-[1.02] active:scale-[0.98]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-lg px-8 text-base font-semibold",
        xl: "h-14 rounded-xl px-10 text-lg font-semibold",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'disabled'>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  loadingText?: string
  icon?: React.ReactNode
  iconPosition?: "left" | "right"
  animate?: boolean
  disabled?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    asChild = false, 
    loading = false,
    loadingText,
    icon,
    iconPosition = "left",
    animate = true,
    disabled,
    children,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : (animate ? motion.button : "button")
    const isDisabled = disabled || loading

    const motionProps = animate ? {
      whileHover: { scale: 1.02 },
      whileTap: { scale: 0.98 },
      transition: { type: "spring", stiffness: 400, damping: 17 }
    } : {}

    const buttonContent = (
      <>
        {/* Shimmer effect for gold variants */}
        {(variant === "gold" || variant === "default") && !isDisabled && (
          <div className="absolute inset-0 -top-px overflow-hidden rounded-md">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-shimmer" />
          </div>
        )}
        
        {/* Loading spinner */}
        {loading && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" data-testid="loader-2" />
        )}
        
        {/* Left icon */}
        {icon && iconPosition === "left" && !loading && (
          <span className="mr-2 flex items-center">
            {icon}
          </span>
        )}
        
        {/* Button text */}
        <span className="relative z-10">
          {loading && loadingText ? loadingText : children}
        </span>
        
        {/* Right icon */}
        {icon && iconPosition === "right" && !loading && (
          <span className="ml-2 flex items-center">
            {icon}
          </span>
        )}
      </>
    )

    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        >
          {buttonContent}
        </Slot>
      )
    }

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isDisabled}
        {...(animate ? motionProps : {})}
        {...props}
      >
        {buttonContent}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }