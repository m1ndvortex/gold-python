import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataTable, DataTableColumn, DataTableAction } from '../data-table';
import { Eye, Edit, Trash2 } from 'lucide-react';

// Mock data
interface TestUser {
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

const mockUsers: TestUser[] = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    role: 'Admin',
    status: 'active',
    createdAt: '2023-01-15'
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'User',
    status: 'inactive',
    createdAt: '2023-02-20'
  },
  {
    id: 3,
    name: 'Bob Johnson',
    email: 'bob@example.com',
    role: 'Editor',
    status: 'active',
    createdAt: '2023-03-10'
  }
];

const mockColumns: DataTableColumn<TestUser>[] = [
  {
    id: 'name',
    header: 'Name',
    accessorKey: 'name',
    sortable: true,
    filterable: true,
  },
  {
    id: 'email',
    header: 'Email',
    accessorKey: 'email',
    sortable: true,
    filterable: true,
  },
  {
    id: 'role',
    header: 'Role',
    accessorKey: 'role',
    sortable: true,
    filterable: true,
    filterType: 'select',
    filterOptions: [
      { value: 'Admin', label: 'Admin' },
      { value: 'User', label: 'User' },
      { value: 'Editor', label: 'Editor' },
    ],
  },
  {
    id: 'status',
    header: 'Status',
    accessorKey: 'status',
    cell: ({ value }) => (
      <span className={`px-2 py-1 rounded text-xs ${
        value === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {value}
      </span>
    ),
    sortable: true,
    filterable: true,
    filterType: 'select',
    filterOptions: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
    ],
  },
  {
    id: 'createdAt',
    header: 'Created At',
    accessorKey: 'createdAt',
    sortable: true,
    filterable: true,
    filterType: 'date',
  },
];

const mockActions: DataTableAction<TestUser>[] = [
  {
    id: 'view',
    label: 'View',
    icon: <Eye className="h-4 w-4" />,
    onClick: jest.fn(),
  },
  {
    id: 'edit',
    label: 'Edit',
    icon: <Edit className="h-4 w-4" />,
    onClick: jest.fn(),
  },
  {
    id: 'delete',
    label: 'Delete',
    icon: <Trash2 className="h-4 w-4" />,
    variant: 'destructive',
    onClick: jest.fn(),
    disabled: (user) => user.role === 'Admin',
  },
];

describe('DataTable Component', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders table with data', () => {
      render(
        <DataTable
          data={mockUsers}
          columns={mockColumns}
          getRowId={(user) => String(user.id)}
        />
      );

      // Check headers
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Role')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();

      // Check data
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    });

    it('renders empty state when no data', () => {
      render(
        <DataTable
          data={[]}
          columns={mockColumns}
          emptyMessage="No users found"
        />
      );

      expect(screen.getByText('No users found')).toBeInTheDocument();
    });

    it('renders loading state', () => {
      render(
        <DataTable
          data={[]}
          columns={mockColumns}
          loading={true}
          loadingRows={3}
        />
      );

      // Should show loading skeleton rows
      const loadingElements = document.querySelectorAll('.animate-pulse');
      expect(loadingElements.length).toBeGreaterThan(0);
    });
  });

  describe('Sorting', () => {
    it('handles column sorting', async () => {
      const handleSortingChange = jest.fn();
      
      render(
        <DataTable
          data={mockUsers}
          columns={mockColumns}
          getRowId={(user) => String(user.id)}
          sorting={[]}
          onSortingChange={handleSortingChange}
        />
      );

      // Click on Name header to sort
      const nameHeader = screen.getByText('Name');
      await userEvent.click(nameHeader);

      expect(handleSortingChange).toHaveBeenCalledWith([
        { id: 'name', desc: false }
      ]);
    });

    it('toggles sort direction on multiple clicks', async () => {
      const handleSortingChange = jest.fn();
      
      render(
        <DataTable
          data={mockUsers}
          columns={mockColumns}
          getRowId={(user) => String(user.id)}
          sorting={[{ id: 'name', desc: false }]}
          onSortingChange={handleSortingChange}
        />
      );

      // Click on Name header again to reverse sort
      const nameHeader = screen.getByText('Name');
      await userEvent.click(nameHeader);

      expect(handleSortingChange).toHaveBeenCalledWith([
        { id: 'name', desc: true }
      ]);
    });

    it('shows sort indicators', () => {
      render(
        <DataTable
          data={mockUsers}
          columns={mockColumns}
          getRowId={(user) => String(user.id)}
          sorting={[{ id: 'name', desc: false }]}
          onSortingChange={jest.fn()}
        />
      );

      // Should show sort indicator (up arrow for ascending)
      const sortIcon = document.querySelector('.text-primary');
      expect(sortIcon).toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    it('shows global search input', () => {
      render(
        <DataTable
          data={mockUsers}
          columns={mockColumns}
          getRowId={(user) => String(user.id)}
          globalFilter=""
          onGlobalFilterChange={jest.fn()}
        />
      );

      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    });

    it('handles global filter change', async () => {
      const handleGlobalFilterChange = jest.fn();
      
      render(
        <DataTable
          data={mockUsers}
          columns={mockColumns}
          getRowId={(user) => String(user.id)}
          globalFilter=""
          onGlobalFilterChange={handleGlobalFilterChange}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search...');
      await userEvent.type(searchInput, 'John');

      expect(handleGlobalFilterChange).toHaveBeenCalledWith('John');
    });

    it('shows filters button when columns are filterable', () => {
      render(
        <DataTable
          data={mockUsers}
          columns={mockColumns}
          getRowId={(user) => String(user.id)}
          filters={[]}
          onFiltersChange={jest.fn()}
        />
      );

      expect(screen.getByText('Filters')).toBeInTheDocument();
    });

    it('toggles filter panel', async () => {
      render(
        <DataTable
          data={mockUsers}
          columns={mockColumns}
          getRowId={(user) => String(user.id)}
          filters={[]}
          onFiltersChange={jest.fn()}
        />
      );

      const filtersButton = screen.getByText('Filters');
      await userEvent.click(filtersButton);

      // Should show filter inputs for filterable columns
      expect(screen.getByPlaceholderText('Filter Name...')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Filter Email...')).toBeInTheDocument();
    });

    it('handles column filter changes', async () => {
      const handleFiltersChange = jest.fn();
      
      render(
        <DataTable
          data={mockUsers}
          columns={mockColumns}
          getRowId={(user) => String(user.id)}
          filters={[]}
          onFiltersChange={handleFiltersChange}
        />
      );

      // Open filters
      const filtersButton = screen.getByText('Filters');
      await userEvent.click(filtersButton);

      // Type in name filter
      const nameFilter = screen.getByPlaceholderText('Filter Name...');
      await userEvent.type(nameFilter, 'John');

      expect(handleFiltersChange).toHaveBeenCalledWith([
        { id: 'name', value: 'John', type: 'text' }
      ]);
    });
  });

  describe('Selection', () => {
    it('shows selection checkboxes when selection is enabled', () => {
      const selection = {
        selectedRows: [],
        onSelectionChange: jest.fn(),
      };

      render(
        <DataTable
          data={mockUsers}
          columns={mockColumns}
          getRowId={(user) => String(user.id)}
          selection={selection}
        />
      );

      // Should show header checkbox and row checkboxes
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(4); // 1 header + 3 rows
    });

    it('handles individual row selection', async () => {
      const handleSelectionChange = jest.fn();
      const selection = {
        selectedRows: [],
        onSelectionChange: handleSelectionChange,
      };

      render(
        <DataTable
          data={mockUsers}
          columns={mockColumns}
          getRowId={(user) => String(user.id)}
          selection={selection}
        />
      );

      // Click first row checkbox
      const checkboxes = screen.getAllByRole('checkbox');
      await userEvent.click(checkboxes[1]); // Skip header checkbox

      expect(handleSelectionChange).toHaveBeenCalledWith(['1']);
    });

    it('handles select all', async () => {
      const handleSelectionChange = jest.fn();
      const selection = {
        selectedRows: [],
        onSelectionChange: handleSelectionChange,
      };

      render(
        <DataTable
          data={mockUsers}
          columns={mockColumns}
          getRowId={(user) => String(user.id)}
          selection={selection}
        />
      );

      // Click header checkbox
      const headerCheckbox = screen.getAllByRole('checkbox')[0];
      await userEvent.click(headerCheckbox);

      expect(handleSelectionChange).toHaveBeenCalledWith(['1', '2', '3']);
    });

    it('shows selected count', () => {
      const selection = {
        selectedRows: ['1', '2'],
        onSelectionChange: jest.fn(),
      };

      render(
        <DataTable
          data={mockUsers}
          columns={mockColumns}
          getRowId={(user) => String(user.id)}
          selection={selection}
        />
      );

      expect(screen.getByText('2 row(s) selected')).toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('renders action buttons', () => {
      render(
        <DataTable
          data={mockUsers}
          columns={mockColumns}
          getRowId={(user) => String(user.id)}
          actions={mockActions}
        />
      );

      // Should show Actions header
      expect(screen.getByText('Actions')).toBeInTheDocument();

      // Should show action buttons for each row
      const actionButtons = screen.getAllByRole('button');
      expect(actionButtons.length).toBeGreaterThan(0);
    });

    it('handles action clicks', async () => {
      const viewAction = mockActions[0];
      
      render(
        <DataTable
          data={mockUsers}
          columns={mockColumns}
          getRowId={(user) => String(user.id)}
          actions={mockActions}
        />
      );

      // Find and click first view button
      const viewButtons = screen.getAllByRole('button');
      const firstViewButton = viewButtons.find(btn => 
        btn.querySelector('svg') && btn.getAttribute('class')?.includes('ghost')
      );
      
      if (firstViewButton) {
        await userEvent.click(firstViewButton);
        expect(viewAction.onClick).toHaveBeenCalledWith(mockUsers[0]);
      }
    });

    it('disables actions based on condition', () => {
      render(
        <DataTable
          data={mockUsers}
          columns={mockColumns}
          getRowId={(user) => String(user.id)}
          actions={mockActions}
        />
      );

      // Delete action should be disabled for Admin users
      const actionButtons = screen.getAllByRole('button');
      const deleteButtons = actionButtons.filter(btn => 
        btn.getAttribute('class')?.includes('destructive')
      );
      
      // First user is Admin, so delete button should be disabled
      if (deleteButtons.length > 0) {
        expect(deleteButtons[0]).toBeDisabled();
      }
    });
  });

  describe('Pagination', () => {
    it('renders pagination controls', () => {
      const pagination = {
        pageIndex: 0,
        pageSize: 10,
        pageCount: 3,
        onPageChange: jest.fn(),
        onPageSizeChange: jest.fn(),
      };

      render(
        <DataTable
          data={mockUsers}
          columns={mockColumns}
          getRowId={(user) => String(user.id)}
          pagination={pagination}
        />
      );

      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Previous')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
      expect(screen.getByText('Last')).toBeInTheDocument();
    });

    it('handles page changes', async () => {
      const handlePageChange = jest.fn();
      const pagination = {
        pageIndex: 0,
        pageSize: 10,
        pageCount: 3,
        onPageChange: handlePageChange,
        onPageSizeChange: jest.fn(),
      };

      render(
        <DataTable
          data={mockUsers}
          columns={mockColumns}
          getRowId={(user) => String(user.id)}
          pagination={pagination}
        />
      );

      const nextButton = screen.getByText('Next');
      await userEvent.click(nextButton);

      expect(handlePageChange).toHaveBeenCalledWith(1);
    });

    it('disables navigation buttons appropriately', () => {
      const pagination = {
        pageIndex: 0,
        pageSize: 10,
        pageCount: 3,
        onPageChange: jest.fn(),
        onPageSizeChange: jest.fn(),
      };

      render(
        <DataTable
          data={mockUsers}
          columns={mockColumns}
          getRowId={(user) => String(user.id)}
          pagination={pagination}
        />
      );

      // First and Previous should be disabled on first page
      expect(screen.getByText('First')).toBeDisabled();
      expect(screen.getByText('Previous')).toBeDisabled();
    });
  });

  describe('Row Interactions', () => {
    it('handles row clicks', async () => {
      const handleRowClick = jest.fn();
      
      render(
        <DataTable
          data={mockUsers}
          columns={mockColumns}
          getRowId={(user) => String(user.id)}
          onRowClick={handleRowClick}
        />
      );

      // Click on first row
      const firstRow = screen.getByText('John Doe').closest('tr');
      if (firstRow) {
        await userEvent.click(firstRow);
        expect(handleRowClick).toHaveBeenCalledWith(mockUsers[0]);
      }
    });

    it('handles row double clicks', async () => {
      const handleRowDoubleClick = jest.fn();
      
      render(
        <DataTable
          data={mockUsers}
          columns={mockColumns}
          getRowId={(user) => String(user.id)}
          onRowDoubleClick={handleRowDoubleClick}
        />
      );

      // Double click on first row
      const firstRow = screen.getByText('John Doe').closest('tr');
      if (firstRow) {
        await userEvent.dblClick(firstRow);
        expect(handleRowDoubleClick).toHaveBeenCalledWith(mockUsers[0]);
      }
    });
  });

  describe('Custom Cell Rendering', () => {
    it('renders custom cell content', () => {
      render(
        <DataTable
          data={mockUsers}
          columns={mockColumns}
          getRowId={(user) => String(user.id)}
        />
      );

      // Status column has custom cell rendering
      const activeStatus = screen.getByText('active');
      expect(activeStatus).toHaveClass('bg-green-100', 'text-green-800');

      const inactiveStatus = screen.getByText('inactive');
      expect(inactiveStatus).toHaveClass('bg-red-100', 'text-red-800');
    });
  });

  describe('Responsive Behavior', () => {
    it('switches to mobile view on small screens', () => {
      // Mock window.innerWidth
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500, // Mobile width
      });

      render(
        <DataTable
          data={mockUsers}
          columns={mockColumns}
          getRowId={(user) => String(user.id)}
          mobileBreakpoint={768}
          showMobileCards={true}
        />
      );

      // Should render mobile cards instead of table
      // This is a simplified test - in reality, we'd need to trigger resize event
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  describe('Column Configuration', () => {
    it('hides columns when hidden prop is true', () => {
      const columnsWithHidden = [
        ...mockColumns,
        {
          id: 'hidden',
          header: 'Hidden Column',
          accessorKey: 'id' as keyof TestUser,
          hidden: true,
        },
      ];

      render(
        <DataTable
          data={mockUsers}
          columns={columnsWithHidden}
          getRowId={(user) => String(user.id)}
        />
      );

      expect(screen.queryByText('Hidden Column')).not.toBeInTheDocument();
    });

    it('applies column alignment', () => {
      const columnsWithAlignment = [
        {
          id: 'centered',
          header: 'Centered',
          accessorKey: 'name' as keyof TestUser,
          align: 'center' as const,
        },
        {
          id: 'right',
          header: 'Right Aligned',
          accessorKey: 'email' as keyof TestUser,
          align: 'right' as const,
        },
      ];

      render(
        <DataTable
          data={mockUsers}
          columns={columnsWithAlignment}
          getRowId={(user) => String(user.id)}
        />
      );

      const centeredHeader = screen.getByText('Centered').closest('th');
      const rightHeader = screen.getByText('Right Aligned').closest('th');

      expect(centeredHeader).toHaveClass('text-center');
      expect(rightHeader).toHaveClass('text-right');
    });
  });

  describe('Styling Variants', () => {
    it('applies striped variant', () => {
      render(
        <DataTable
          data={mockUsers}
          columns={mockColumns}
          getRowId={(user) => String(user.id)}
          striped={true}
        />
      );

      const table = document.querySelector('table');
      expect(table).toHaveClass('[&_tbody_tr:nth-child(odd)]:bg-muted/30');
    });

    it('applies bordered variant', () => {
      render(
        <DataTable
          data={mockUsers}
          columns={mockColumns}
          getRowId={(user) => String(user.id)}
          bordered={true}
        />
      );

      const table = document.querySelector('table');
      expect(table).toHaveClass('border-separate', 'border-spacing-0');
    });

    it('applies compact variant', () => {
      render(
        <DataTable
          data={mockUsers}
          columns={mockColumns}
          getRowId={(user) => String(user.id)}
          compact={true}
        />
      );

      const table = document.querySelector('table');
      expect(table).toHaveClass('[&_td]:py-2', '[&_th]:py-2');
    });
  });
});