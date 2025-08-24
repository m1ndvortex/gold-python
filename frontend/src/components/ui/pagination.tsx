import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"
import { Button } from "./button"

const paginationVariants = cva(
  "mx-auto flex w-full justify-center",
  {
    variants: {
      variant: {
        default: "",
        gradient: "bg-gradient-to-r from-slate-50 via-slate-50 to-slate-50 rounded-lg p-2",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const paginationContentVariants = cva(
  "flex flex-row items-center gap-1",
  {
    variants: {
      variant: {
        default: "",
        gradient: "bg-white rounded-md shadow-sm p-1",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const paginationItemVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2",
        gradient: "hover:bg-gradient-to-r hover:from-green-50 hover:to-teal-50 hover:text-green-700 h-10 px-4 py-2",
        active: "bg-gradient-to-r from-green-500 to-teal-600 text-white shadow-md hover:from-green-600 hover:to-teal-700 h-10 px-4 py-2",
        ellipsis: "h-9 w-9 p-0",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface PaginationProps
  extends React.ComponentProps<"nav">,
    VariantProps<typeof paginationVariants> {}

const Pagination = ({ className, variant, ...props }: PaginationProps) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn(paginationVariants({ variant }), className)}
    {...props}
  />
)
Pagination.displayName = "Pagination"

export interface PaginationContentProps
  extends React.ComponentProps<"ul">,
    VariantProps<typeof paginationContentVariants> {}

const PaginationContent = React.forwardRef<
  HTMLUListElement,
  PaginationContentProps
>(({ className, variant, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn(paginationContentVariants({ variant }), className)}
    {...props}
  />
))
PaginationContent.displayName = "PaginationContent"

export interface PaginationItemProps
  extends React.ComponentProps<"li">,
    VariantProps<typeof paginationItemVariants> {}

const PaginationItem = React.forwardRef<HTMLLIElement, PaginationItemProps>(
  ({ className, ...props }, ref) => (
    <li ref={ref} className={cn("", className)} {...props} />
  )
)
PaginationItem.displayName = "PaginationItem"

type PaginationLinkProps = {
  isActive?: boolean
  disabled?: boolean
} & Pick<PaginationItemProps, "size"> &
  React.ComponentProps<typeof Button>

const PaginationLink = ({
  className,
  isActive,
  disabled,
  size = "icon",
  variant,
  ...props
}: PaginationLinkProps) => (
  <Button
    aria-current={isActive ? "page" : undefined}
    variant={isActive ? "default" : "ghost"}
    size={size}
    disabled={disabled}
    className={cn(
      paginationItemVariants({
        variant: isActive ? "active" : "gradient",
        size,
      }),
      className
    )}
    {...props}
  />
)
PaginationLink.displayName = "PaginationLink"

const PaginationPrevious = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to previous page"
    size="default"
    className={cn("gap-1 pl-2.5", className)}
    {...props}
  >
    <ChevronLeft className="h-4 w-4" />
    <span>Previous</span>
  </PaginationLink>
)
PaginationPrevious.displayName = "PaginationPrevious"

const PaginationNext = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to next page"
    size="default"
    className={cn("gap-1 pr-2.5", className)}
    {...props}
  >
    <span>Next</span>
    <ChevronRight className="h-4 w-4" />
  </PaginationLink>
)
PaginationNext.displayName = "PaginationNext"

const PaginationEllipsis = ({
  className,
  ...props
}: React.ComponentProps<"span">) => (
  <span
    aria-hidden
    className={cn(
      paginationItemVariants({ variant: "ellipsis" }),
      "flex items-center justify-center",
      className
    )}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More pages</span>
  </span>
)
PaginationEllipsis.displayName = "PaginationEllipsis"

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
}