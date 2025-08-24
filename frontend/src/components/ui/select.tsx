import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "../../lib/utils"

const Select = SelectPrimitive.Root

const SelectGroup = SelectPrimitive.Group

const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & {
    variant?: 'default' | 'gradient-green' | 'gradient-teal' | 'gradient-blue' | 'gradient-purple' | 'gradient-pink' | 'gradient-orange' | 'professional'
  }
>(({ className, children, variant = 'default', ...props }, ref) => {
  const variantStyles = {
    default: "focus:ring-ring",
    'gradient-green': "focus:ring-green-500/30 focus:border-green-500 hover:border-green-400 focus:shadow-lg focus:shadow-green-500/10",
    'gradient-teal': "focus:ring-teal-500/30 focus:border-teal-500 hover:border-teal-400 focus:shadow-lg focus:shadow-teal-500/10",
    'gradient-blue': "focus:ring-blue-500/30 focus:border-blue-500 hover:border-blue-400 focus:shadow-lg focus:shadow-blue-500/10",
    'gradient-purple': "focus:ring-purple-500/30 focus:border-purple-500 hover:border-purple-400 focus:shadow-lg focus:shadow-purple-500/10",
    'gradient-pink': "focus:ring-pink-500/30 focus:border-pink-500 hover:border-pink-400 focus:shadow-lg focus:shadow-pink-500/10",
    'gradient-orange': "focus:ring-orange-500/30 focus:border-orange-500 hover:border-orange-400 focus:shadow-lg focus:shadow-orange-500/10",
    professional: "focus:ring-slate-500/20 focus:border-slate-500 hover:border-slate-400 focus:shadow-lg focus:shadow-slate-500/5",
  }

  return (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 transition-all duration-300",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="h-4 w-4 opacity-50 transition-transform duration-200 group-data-[state=open]:rotate-180" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
})
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content> & {
    variant?: 'default' | 'gradient-green' | 'gradient-teal' | 'gradient-blue' | 'gradient-purple' | 'gradient-pink' | 'gradient-orange' | 'professional'
  }
>(({ className, children, position = "popper", variant = 'default', ...props }, ref) => {
  const variantStyles = {
    default: "bg-popover border shadow-md",
    'gradient-green': "bg-gradient-to-br from-green-50/80 to-white border-green-200 shadow-lg shadow-green-500/10",
    'gradient-teal': "bg-gradient-to-br from-teal-50/80 to-white border-teal-200 shadow-lg shadow-teal-500/10",
    'gradient-blue': "bg-gradient-to-br from-blue-50/80 to-white border-blue-200 shadow-lg shadow-blue-500/10",
    'gradient-purple': "bg-gradient-to-br from-purple-50/80 to-white border-purple-200 shadow-lg shadow-purple-500/10",
    'gradient-pink': "bg-gradient-to-br from-pink-50/80 to-white border-pink-200 shadow-lg shadow-pink-500/10",
    'gradient-orange': "bg-gradient-to-br from-orange-50/80 to-white border-orange-200 shadow-lg shadow-orange-500/10",
    professional: "bg-gradient-to-br from-slate-50/80 to-white border-slate-200 shadow-lg shadow-slate-500/5",
  }

  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        className={cn(
          "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          variantStyles[variant],
          className
        )}
        position={position}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            "p-1",
            position === "popper" &&
              "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
})
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
    {...props}
  />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item> & {
    variant?: 'default' | 'gradient-green' | 'gradient-teal' | 'gradient-blue' | 'gradient-purple' | 'gradient-pink' | 'gradient-orange' | 'professional'
  }
>(({ className, children, variant = 'default', ...props }, ref) => {
  const variantStyles = {
    default: "focus:bg-accent focus:text-accent-foreground",
    'gradient-green': "focus:bg-green-100/50 focus:text-green-700 data-[state=checked]:bg-green-100 data-[state=checked]:text-green-700",
    'gradient-teal': "focus:bg-teal-100/50 focus:text-teal-700 data-[state=checked]:bg-teal-100 data-[state=checked]:text-teal-700",
    'gradient-blue': "focus:bg-blue-100/50 focus:text-blue-700 data-[state=checked]:bg-blue-100 data-[state=checked]:text-blue-700",
    'gradient-purple': "focus:bg-purple-100/50 focus:text-purple-700 data-[state=checked]:bg-purple-100 data-[state=checked]:text-purple-700",
    'gradient-pink': "focus:bg-pink-100/50 focus:text-pink-700 data-[state=checked]:bg-pink-100 data-[state=checked]:text-pink-700",
    'gradient-orange': "focus:bg-orange-100/50 focus:text-orange-700 data-[state=checked]:bg-orange-100 data-[state=checked]:text-orange-700",
    professional: "focus:bg-slate-100/50 focus:text-slate-700 data-[state=checked]:bg-slate-100 data-[state=checked]:text-slate-700",
  }

  return (
    <SelectPrimitive.Item
      ref={ref}
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors duration-200 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check className="h-4 w-4" />
        </SelectPrimitive.ItemIndicator>
      </span>

      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
})
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}