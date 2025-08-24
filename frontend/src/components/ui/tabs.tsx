import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const Tabs = TabsPrimitive.Root

const tabsListVariants = cva(
  "inline-flex items-center justify-center text-muted-foreground transition-all duration-300",
  {
    variants: {
      variant: {
        default: "h-10 rounded-md bg-muted p-1",
        // Modern pill-style navigation matching reports/charts design
        pills: "h-auto p-1 gap-1 bg-transparent",
        "gradient-green": "h-auto p-1 gap-1 bg-gradient-to-r from-green-50 via-teal-50 to-blue-50 border-b-2 border-green-200",
        "gradient-teal": "h-auto p-1 gap-1 bg-gradient-to-r from-teal-50 via-blue-50 to-indigo-50 border-b-2 border-teal-200",
        "gradient-blue": "h-auto p-1 gap-1 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b-2 border-blue-200",
        "gradient-purple": "h-auto p-1 gap-1 bg-gradient-to-r from-purple-50 via-violet-50 to-pink-50 border-b-2 border-purple-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const tabsTriggerVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "rounded-sm px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
        // Modern pill-style triggers
        pills: "rounded-lg px-4 py-2 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-foreground",
        "gradient-green": "rounded-lg px-4 py-2 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-green-300",
        "gradient-teal": "rounded-lg px-4 py-2 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-teal-300",
        "gradient-blue": "rounded-lg px-4 py-2 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-blue-300",
        "gradient-purple": "rounded-lg px-4 py-2 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-purple-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface TabsListProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>,
    VariantProps<typeof tabsListVariants> {}

export interface TabsTriggerProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>,
    VariantProps<typeof tabsTriggerVariants> {}

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ className, variant, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(tabsListVariants({ variant, className }))}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({ className, variant, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(tabsTriggerVariants({ variant, className }))}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const tabsContentVariants = cva(
  "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all duration-300",
  {
    variants: {
      variant: {
        default: "mt-2",
        // Content variants with gradient backgrounds matching reports/charts design
        "gradient-green": "p-6 space-y-6 bg-gradient-to-br from-green-50/30 to-white",
        "gradient-teal": "p-6 space-y-6 bg-gradient-to-br from-teal-50/30 to-white",
        "gradient-blue": "p-6 space-y-6 bg-gradient-to-br from-blue-50/30 to-white",
        "gradient-purple": "p-6 space-y-6 bg-gradient-to-br from-purple-50/30 to-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface TabsContentProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>,
    VariantProps<typeof tabsContentVariants> {}

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  TabsContentProps
>(({ className, variant, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(tabsContentVariants({ variant, className }))}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }