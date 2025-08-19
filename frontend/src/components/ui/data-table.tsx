import * as React from "react"
import { 
  ChevronDown, 
  ChevronUp, 
  ChevronsUpDown, 
  Search, 
  Filter, 
  MoreHorizontal,
  Check,
  X,
  ArrowUpDown,
  Eye,
  Edit,
  Trash2
} from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"
import { Button } from "./button"
import { Input } from "./input"
import { SearchableSelect } from "./searchable-select"

// Types
export interface DataTableColumn<T = any> {
  id: string
  header: string | React.ReactNode
  accessorKey?: keyof T
  accessorFn?: (row: T) => any
  cell?: (props: { row: T; value: any }) => React.ReactNode
  sortable?: boolean
  filterable?: boolean
  filterType?: 'text' | 'select' | 'date' | 'number'
  filterOptions?: Array<{ label: string; value: string }>
  width?: string | number
  minWidth?: string | number
  maxWidth?: string | number
  align?: 'left' | 'center' | 'right'
  sticky?: 'left' | 'right'
  hidden?: boolean
}

export interface DataTableFilter {
  id: string
  value: any
  type: 'text' | 'select' | 'date' | 'number'
}

export interface DataTableSort {
  id: string
  desc: boolean
}

export interface DataTableSelection {
  selectedRows: string[]
  onSelectionChange: (selectedRows: string[]) => void
}

export interface DataTableAction<T = any> {
  id: string
  label: string
  icon?: React.ReactNode
  onClick: (row: T) => void
  variant?: 'default' | 'destructive' | 'outline' | 'ghost'
  disabled?: (row: T) => boolean
  hidden?: (row: T) => boolean
}

export interface DataTableProps<T = any> extends VariantProps<typeof dataTableVariants> {
  data: T[]
  columns: DataTableColumn<T>[]
  getRowId?: (row: T, index: number) => string
  
  // Sorting
  sorting?: DataTableSort[]
  onSortingChange?: (sorting: DataTableSort[]) => void
  
  // Filtering
  filters?: DataTableFilter[]
  onFiltersChange?: (filters: DataTableFilter[]) => void
  globalFilter?: string
  onGlobalFilterChange?: (filter: string) => void
  
  // Selection
  selection?: DataTableSelection
  
  // Actions
  actions?: DataTableAction<T>[]
  
  // Pagination
  pagination?: {
    pageIndex: number
    pageSize: number
    pageCount: number
    onPageChange: (pageIndex: number) => void
    onPageSizeChange: (pageSize: number) => void
  }
  
  // Loading & Empty states
  loading?: boolean
  loadingRows?: number
  emptyMessage?: string
  
  // Responsive
  mobileBreakpoint?: number
  showMobileCards?: boolean
  
  // Styling
  className?: string
  striped?: boolean
  bordered?: boolean
  compact?: boolean
  
  // Callbacks
  onRowClick?: (row: T) => void
  onRowDoubleClick?: (row: T) => void
}

const dataTableVariants = cva(
  "w-full border-collapse bg-background text-sm",
  {
    variants: {
      variant: {
        default: "",
        striped: "[&_tbody_tr:nth-child(odd)]:bg-muted/30",
        bordered: "border border-border",
        compact: "[&_td]:py-2 [&_th]:py-2",
      },
      size: {
        default: "",
        sm: "text-xs [&_td]:px-2 [&_th]:px-2",
        lg: "text-base [&_td]:px-6 [&_th]:px-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

// Helper function to get nested value
const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

// Sort function
const sortData = <T,>(data: T[], sorting: DataTableSort[], columns: DataTableColumn<T>[]): T[] => {
  if (!sorting.length) return data
  
  return [...data].sort((a, b) => {
    for (const sort of sorting) {
      const column = columns.find(col => col.id === sort.id)
      if (!column) continue
      
      let aValue: any
      let bValue: any
      
      if (column.accessorFn) {
        aValue = column.accessorFn(a)
        bValue = column.accessorFn(b)
      } else if (column.accessorKey) {
        aValue = getNestedValue(a, column.accessorKey as string)
        bValue = getNestedValue(b, column.accessorKey as string)
      }
      
      // Handle null/undefined values
      if (aValue == null && bValue == null) continue
      if (aValue == null) return sort.desc ? 1 : -1
      if (bValue == null) return sort.desc ? -1 : 1
      
      // Compare values
      let comparison = 0
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue)
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue
      } else {
        comparison = String(aValue).localeCompare(String(bValue))
      }
      
      if (comparison !== 0) {
        return sort.desc ? -comparison : comparison
      }
    }
    return 0
  })
}

// Filter function
const filterData = <T,>(data: T[], filters: DataTableFilter[], globalFilter: string, columns: DataTableColumn<T>[]): T[] => {
  let filteredData = data
  
  // Apply column filters
  if (filters.length > 0) {
    filteredData = filteredData.filter(row => {
      return filters.every(filter => {
        const column = columns.find(col => col.id === filter.id)
        if (!column || !filter.value) return true
        
        let cellValue: any
        if (column.accessorFn) {
          cellValue = column.accessorFn(row)
        } else if (column.accessorKey) {
          cellValue = getNestedValue(row, column.accessorKey as string)
        }
        
        if (cellValue == null) return false
        
        const stringValue = String(cellValue).toLowerCase()
        const filterValue = String(filter.value).toLowerCase()
        
        switch (filter.type) {
          case 'text':
            return stringValue.includes(filterValue)
          case 'select':
            return stringValue === filterValue
          case 'number':
            return parseFloat(stringValue) === parseFloat(filterValue)
          default:
            return stringValue.includes(filterValue)
        }
      })
    })
  }
  
  // Apply global filter
  if (globalFilter) {
    const searchTerm = globalFilter.toLowerCase()
    filteredData = filteredData.filter(row => {
      return columns.some(column => {
        let cellValue: any
        if (column.accessorFn) {
          cellValue = column.accessorFn(row)
        } else if (column.accessorKey) {
          cellValue = getNestedValue(row, column.accessorKey as string)
        }
        
        return cellValue != null && String(cellValue).toLowerCase().includes(searchTerm)
      })
    })
  }
  
  return filteredData
}

// Loading skeleton row
const LoadingRow: React.FC<{ columns: DataTableColumn[] }> = ({ columns }) => (
  <tr className="border-b">
    {columns.map((column, index) => (
      <td key={index} className="p-4">
        <div className="h-4 bg-muted animate-pulse rounded" />
      </td>
    ))}
  </tr>
)

// Mobile card component
const MobileCard: React.FC<{ 
  row: any
  columns: DataTableColumn[]
  actions?: DataTableAction[]
  selection?: DataTableSelection
  rowId: string
  onRowClick?: (row: any) => void
}> = ({ row, columns, actions, selection, rowId, onRowClick }) => {
  const isSelected = selection?.selectedRows.includes(rowId) || false
  
  const handleSelectionChange = (checked: boolean) => {
    if (!selection) return
    
    const newSelection = checked
      ? [...selection.selectedRows, rowId]
      : selection.selectedRows.filter(id => id !== rowId)
    
    selection.onSelectionChange(newSelection)
  }
  
  return (
    <div 
      className={cn(
        "border rounded-lg p-4 space-y-3 bg-background",
        isSelected && "ring-2 ring-primary",
        onRowClick && "cursor-pointer hover:bg-muted/50"
      )}
      onClick={() => onRowClick?.(row)}
    >
      {/* Selection checkbox */}
      {selection && (
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => handleSelectionChange(e.target.checked)}
            className="rounded border-border"
            onClick={(e) => e.stopPropagation()}
          />
          <span className="text-sm text-muted-foreground">Select</span>
        </div>
      )}
      
      {/* Data fields */}
      {columns.filter(col => !col.hidden).map((column) => {
        let cellValue: any
        if (column.accessorFn) {
          cellValue = column.accessorFn(row)
        } else if (column.accessorKey) {
          cellValue = getNestedValue(row, column.accessorKey as string)
        }
        
        const displayValue = column.cell 
          ? column.cell({ row, value: cellValue })
          : cellValue
        
        return (
          <div key={column.id} className="flex justify-between items-start">
            <span className="text-sm font-medium text-muted-foreground min-w-0 flex-shrink-0 mr-2">
              {typeof column.header === 'string' ? column.header : column.id}:
            </span>
            <span className="text-sm text-right min-w-0 flex-1">
              {displayValue}
            </span>
          </div>
        )
      })}
      
      {/* Actions */}
      {actions && actions.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          {actions
            .filter(action => !action.hidden?.(row))
            .map((action) => (
              <Button
                key={action.id}
                variant={action.variant || "outline"}
                size="sm"
                disabled={action.disabled?.(row)}
                onClick={(e) => {
                  e.stopPropagation()
                  action.onClick(row)
                }}
                className="flex items-center space-x-1"
              >
                {action.icon}
                <span>{action.label}</span>
              </Button>
            ))}
        </div>
      )}
    </div>
  )
}

// Main DataTable component
export const DataTable = <T,>({
  data,
  columns,
  getRowId = (row: T, index: number) => String(index),
  sorting = [],
  onSortingChange,
  filters = [],
  onFiltersChange,
  globalFilter = "",
  onGlobalFilterChange,
  selection,
  actions,
  pagination,
  loading = false,
  loadingRows = 5,
  emptyMessage = "No data available",
  mobileBreakpoint = 768,
  showMobileCards = true,
  className,
  variant,
  size,
  striped,
  bordered,
  compact,
  onRowClick,
  onRowDoubleClick,
  ...props
}: DataTableProps<T>) => {
  const [isMobile, setIsMobile] = React.useState(false)
  const [showFilters, setShowFilters] = React.useState(false)
  
  // Check for mobile viewport
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < mobileBreakpoint)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [mobileBreakpoint])
  
  // Process data
  const processedData = React.useMemo(() => {
    let result = filterData(data, filters, globalFilter, columns)
    result = sortData(result, sorting, columns)
    return result
  }, [data, filters, globalFilter, sorting, columns])
  
  // Handle sorting
  const handleSort = (columnId: string) => {
    if (!onSortingChange) return
    
    const existingSort = sorting.find(s => s.id === columnId)
    let newSorting: DataTableSort[]
    
    if (!existingSort) {
      newSorting = [{ id: columnId, desc: false }]
    } else if (!existingSort.desc) {
      newSorting = [{ id: columnId, desc: true }]
    } else {
      newSorting = sorting.filter(s => s.id !== columnId)
    }
    
    onSortingChange(newSorting)
  }
  
  // Handle filter change
  const handleFilterChange = (columnId: string, value: any, type: DataTableFilter['type']) => {
    if (!onFiltersChange) return
    
    const newFilters = filters.filter(f => f.id !== columnId)
    if (value) {
      newFilters.push({ id: columnId, value, type })
    }
    
    onFiltersChange(newFilters)
  }
  
  // Handle selection
  const handleSelectAll = (checked: boolean) => {
    if (!selection) return
    
    const allRowIds = processedData.map((row, index) => getRowId(row, index))
    const newSelection = checked ? allRowIds : []
    selection.onSelectionChange(newSelection)
  }
  
  const isAllSelected = selection && processedData.length > 0 && 
    processedData.every((row, index) => selection.selectedRows.includes(getRowId(row, index)))
  
  const isSomeSelected = selection && selection.selectedRows.length > 0 && !isAllSelected
  
  // Render mobile cards
  if (isMobile && showMobileCards) {
    return (
      <div className="space-y-4">
        {/* Header with search and filters */}
        <div className="flex flex-col space-y-4">
          {onGlobalFilterChange && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={globalFilter}
                onChange={(e) => onGlobalFilterChange(e.target.value)}
                className="pl-10"
              />
            </div>
          )}
          
          {columns.some(col => col.filterable) && (
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2"
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
            </Button>
          )}
        </div>
        
        {/* Filter panel */}
        {showFilters && (
          <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
            {columns
              .filter(col => col.filterable)
              .map((column) => {
                const currentFilter = filters.find(f => f.id === column.id)
                
                return (
                  <div key={column.id}>
                    <label className="text-sm font-medium mb-2 block">
                      {typeof column.header === 'string' ? column.header : column.id}
                    </label>
                    
                    {column.filterType === 'select' && column.filterOptions ? (
                      <SearchableSelect
                        options={column.filterOptions}
                        value={currentFilter?.value || ''}
                        onValueChange={(value) => handleFilterChange(column.id, value, 'select')}
                        placeholder="Select..."
                        clearable
                      />
                    ) : (
                      <Input
                        type={column.filterType === 'number' ? 'number' : 'text'}
                        value={currentFilter?.value || ''}
                        onChange={(e) => handleFilterChange(column.id, e.target.value, column.filterType || 'text')}
                        placeholder={`Filter ${typeof column.header === 'string' ? column.header : column.id}...`}
                      />
                    )}
                  </div>
                )
              })}
          </div>
        )}
        
        {/* Loading state */}
        {loading && (
          <div className="space-y-4">
            {Array.from({ length: loadingRows }).map((_, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
                <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
              </div>
            ))}
          </div>
        )}
        
        {/* Data cards */}
        {!loading && processedData.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {emptyMessage}
          </div>
        )}
        
        {!loading && processedData.map((row, index) => {
          const rowId = getRowId(row, index)
          return (
            <MobileCard
              key={rowId}
              row={row}
              columns={columns}
              actions={actions}
              selection={selection}
              rowId={rowId}
              onRowClick={onRowClick}
            />
          )
        })}
        
        {/* Pagination */}
        {pagination && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Page {pagination.pageIndex + 1} of {pagination.pageCount}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.pageIndex === 0}
                onClick={() => pagination.onPageChange(pagination.pageIndex - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.pageIndex >= pagination.pageCount - 1}
                onClick={() => pagination.onPageChange(pagination.pageIndex + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  }
  
  // Render desktop table
  return (
    <div className="space-y-4">
      {/* Header with search and filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {onGlobalFilterChange && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={globalFilter}
                onChange={(e) => onGlobalFilterChange(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          )}
          
          {columns.some(col => col.filterable) && (
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2"
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
            </Button>
          )}
        </div>
        
        {selection && selection.selectedRows.length > 0 && (
          <div className="text-sm text-muted-foreground">
            {selection.selectedRows.length} row(s) selected
          </div>
        )}
      </div>
      
      {/* Filter panel */}
      {showFilters && (
        <div className="border rounded-lg p-4 bg-muted/30">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {columns
              .filter(col => col.filterable)
              .map((column) => {
                const currentFilter = filters.find(f => f.id === column.id)
                
                return (
                  <div key={column.id}>
                    <label className="text-sm font-medium mb-2 block">
                      {typeof column.header === 'string' ? column.header : column.id}
                    </label>
                    
                    {column.filterType === 'select' && column.filterOptions ? (
                      <SearchableSelect
                        options={column.filterOptions}
                        value={currentFilter?.value || ''}
                        onValueChange={(value) => handleFilterChange(column.id, value, 'select')}
                        placeholder="Select..."
                        clearable
                      />
                    ) : (
                      <Input
                        type={column.filterType === 'number' ? 'number' : 'text'}
                        value={currentFilter?.value || ''}
                        onChange={(e) => handleFilterChange(column.id, e.target.value, column.filterType || 'text')}
                        placeholder={`Filter ${typeof column.header === 'string' ? column.header : column.id}...`}
                      />
                    )}
                  </div>
                )
              })}
          </div>
        </div>
      )}
      
      {/* Table */}
      <div className="relative w-full overflow-auto border rounded-lg">
        <table
          className={cn(
            dataTableVariants({ variant, size }),
            striped && "[&_tbody_tr:nth-child(odd)]:bg-muted/30",
            bordered && "border-separate border-spacing-0",
            compact && "[&_td]:py-2 [&_th]:py-2",
            className
          )}
          {...props}
        >
          <thead className="bg-muted/50">
            <tr className="border-b">
              {/* Selection header */}
              {selection && (
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = !!isSomeSelected
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-border"
                  />
                </th>
              )}
              
              {/* Column headers */}
              {columns
                .filter(col => !col.hidden)
                .map((column) => (
                  <th
                    key={column.id}
                    className={cn(
                      "px-4 py-3 text-left font-medium text-muted-foreground",
                      column.align === 'center' && "text-center",
                      column.align === 'right' && "text-right",
                      column.sortable && "cursor-pointer hover:bg-muted/70 select-none",
                      column.sticky === 'left' && "sticky left-0 bg-muted/50 z-10",
                      column.sticky === 'right' && "sticky right-0 bg-muted/50 z-10"
                    )}
                    style={{
                      width: column.width,
                      minWidth: column.minWidth,
                      maxWidth: column.maxWidth,
                    }}
                    onClick={() => column.sortable && handleSort(column.id)}
                  >
                    <div className="flex items-center space-x-2">
                      <span>{column.header}</span>
                      {column.sortable && (
                        <div className="flex flex-col">
                          {(() => {
                            const sort = sorting.find(s => s.id === column.id)
                            if (!sort) {
                              return <ChevronsUpDown className="h-4 w-4 text-muted-foreground/50" />
                            }
                            return sort.desc 
                              ? <ChevronDown className="h-4 w-4 text-primary" />
                              : <ChevronUp className="h-4 w-4 text-primary" />
                          })()}
                        </div>
                      )}
                    </div>
                  </th>
                ))}
              
              {/* Actions header */}
              {actions && actions.length > 0 && (
                <th className="w-20 px-4 py-3 text-center">Actions</th>
              )}
            </tr>
          </thead>
          
          <tbody>
            {/* Loading rows */}
            {loading && Array.from({ length: loadingRows }).map((_, index) => (
              <LoadingRow key={index} columns={columns.filter(col => !col.hidden)} />
            ))}
            
            {/* Data rows */}
            {!loading && processedData.map((row, index) => {
              const rowId = getRowId(row, index)
              const isSelected = selection?.selectedRows.includes(rowId) || false
              
              return (
                <tr
                  key={rowId}
                  className={cn(
                    "border-b transition-colors hover:bg-muted/50",
                    isSelected && "bg-muted",
                    onRowClick && "cursor-pointer"
                  )}
                  onClick={() => onRowClick?.(row)}
                  onDoubleClick={() => onRowDoubleClick?.(row)}
                >
                  {/* Selection cell */}
                  {selection && (
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          const newSelection = e.target.checked
                            ? [...selection.selectedRows, rowId]
                            : selection.selectedRows.filter(id => id !== rowId)
                          selection.onSelectionChange(newSelection)
                        }}
                        className="rounded border-border"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                  )}
                  
                  {/* Data cells */}
                  {columns
                    .filter(col => !col.hidden)
                    .map((column) => {
                      let cellValue: any
                      if (column.accessorFn) {
                        cellValue = column.accessorFn(row)
                      } else if (column.accessorKey) {
                        cellValue = getNestedValue(row, column.accessorKey as string)
                      }
                      
                      const displayValue = column.cell 
                        ? column.cell({ row, value: cellValue })
                        : cellValue
                      
                      return (
                        <td
                          key={column.id}
                          className={cn(
                            "px-4 py-3",
                            column.align === 'center' && "text-center",
                            column.align === 'right' && "text-right",
                            column.sticky === 'left' && "sticky left-0 bg-background z-10",
                            column.sticky === 'right' && "sticky right-0 bg-background z-10"
                          )}
                        >
                          {displayValue}
                        </td>
                      )
                    })}
                  
                  {/* Actions cell */}
                  {actions && actions.length > 0 && (
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center space-x-1">
                        {actions
                          .filter(action => !action.hidden?.(row))
                          .map((action) => (
                            <Button
                              key={action.id}
                              variant={action.variant || "ghost"}
                              size="sm"
                              disabled={action.disabled?.(row)}
                              onClick={(e) => {
                                e.stopPropagation()
                                action.onClick(row)
                              }}
                              className="h-8 w-8 p-0"
                            >
                              {action.icon}
                            </Button>
                          ))}
                      </div>
                    </td>
                  )}
                </tr>
              )
            })}
            
            {/* Empty state */}
            {!loading && processedData.length === 0 && (
              <tr>
                <td 
                  colSpan={
                    columns.filter(col => !col.hidden).length + 
                    (selection ? 1 : 0) + 
                    (actions && actions.length > 0 ? 1 : 0)
                  }
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Rows per page:</span>
            <SearchableSelect
              options={[
                { value: '10', label: '10' },
                { value: '25', label: '25' },
                { value: '50', label: '50' },
                { value: '100', label: '100' },
              ]}
              value={String(pagination.pageSize)}
              onValueChange={(value) => pagination.onPageSizeChange(Number(value))}
              className="w-20"
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              Page {pagination.pageIndex + 1} of {pagination.pageCount}
            </span>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.pageIndex === 0}
                onClick={() => pagination.onPageChange(0)}
              >
                First
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.pageIndex === 0}
                onClick={() => pagination.onPageChange(pagination.pageIndex - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.pageIndex >= pagination.pageCount - 1}
                onClick={() => pagination.onPageChange(pagination.pageIndex + 1)}
              >
                Next
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.pageIndex >= pagination.pageCount - 1}
                onClick={() => pagination.onPageChange(pagination.pageCount - 1)}
              >
                Last
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export { dataTableVariants }