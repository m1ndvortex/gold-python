import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const listVariants = cva(
  "divide-y divide-border",
  {
    variants: {
      variant: {
        default: "bg-background",
        gradient: "bg-gradient-to-br from-white to-slate-50/50",
        card: "bg-white border rounded-lg shadow-sm",
        "gradient-card": "bg-gradient-to-br from-white to-slate-50/50 border rounded-lg shadow-lg hover:shadow-xl transition-all duration-300",
      },
      spacing: {
        none: "divide-y-0",
        sm: "[&>*]:py-2",
        default: "[&>*]:py-3",
        lg: "[&>*]:py-4",
        xl: "[&>*]:py-6",
      },
    },
    defaultVariants: {
      variant: "default",
      spacing: "default",
    },
  }
)

const listItemVariants = cva(
  "flex items-center justify-between transition-all duration-300",
  {
    variants: {
      variant: {
        default: "hover:bg-muted/50",
        gradient: "hover:bg-gradient-to-r hover:from-green-50/30 hover:to-teal-50/30",
        interactive: "cursor-pointer hover:bg-gradient-to-r hover:from-green-50/50 hover:to-teal-50/50 hover:shadow-sm",
        selected: "bg-gradient-to-r from-green-100/50 to-teal-100/50 border-l-4 border-green-500",
      },
      padding: {
        none: "p-0",
        sm: "px-3 py-2",
        default: "px-4 py-3",
        lg: "px-6 py-4",
      },
    },
    defaultVariants: {
      variant: "gradient",
      padding: "default",
    },
  }
)

export interface ListProps
  extends React.HTMLAttributes<HTMLUListElement>,
    VariantProps<typeof listVariants> {}

const List = React.forwardRef<HTMLUListElement, ListProps>(
  ({ className, variant, spacing, ...props }, ref) => (
    <ul
      ref={ref}
      className={cn(listVariants({ variant, spacing }), className)}
      {...props}
    />
  )
)
List.displayName = "List"

export interface ListItemProps
  extends React.HTMLAttributes<HTMLLIElement>,
    VariantProps<typeof listItemVariants> {
  selected?: boolean
}

const ListItem = React.forwardRef<HTMLLIElement, ListItemProps>(
  ({ className, variant, padding, selected, ...props }, ref) => (
    <li
      ref={ref}
      className={cn(
        listItemVariants({ 
          variant: selected ? "selected" : variant, 
          padding 
        }), 
        className
      )}
      {...props}
    />
  )
)
ListItem.displayName = "ListItem"

const ListItemContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex-1 min-w-0", className)}
    {...props}
  />
))
ListItemContent.displayName = "ListItemContent"

const ListItemTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-sm font-semibold text-foreground leading-none", className)}
    {...props}
  />
))
ListItemTitle.displayName = "ListItemTitle"

const ListItemDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground mt-1", className)}
    {...props}
  />
))
ListItemDescription.displayName = "ListItemDescription"

const ListItemActions = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center space-x-2 ml-4", className)}
    {...props}
  />
))
ListItemActions.displayName = "ListItemActions"

const ListItemIcon = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    gradient?: boolean
  }
>(({ className, gradient = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center justify-center rounded-lg mr-3",
      gradient 
        ? "h-10 w-10 bg-gradient-to-br from-green-500 to-green-600 text-white shadow-sm" 
        : "h-10 w-10 bg-muted text-muted-foreground",
      className
    )}
    {...props}
  />
))
ListItemIcon.displayName = "ListItemIcon"

export {
  List,
  ListItem,
  ListItemContent,
  ListItemTitle,
  ListItemDescription,
  ListItemActions,
  ListItemIcon,
}