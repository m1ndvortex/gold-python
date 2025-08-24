import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Import components
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from '../components/ui/table';
import { DataTable } from '../components/ui/data-table';
import { Badge } from '../components/ui/badge';
import { 
  List, 
  ListItem, 
  ListItemContent, 
  ListItemTitle, 
  ListItemDescription,
  ListItemActions,
  ListItemIcon
} from '../components/ui/list';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '../components/ui/pagination';
import { Button } from '../components/ui/button';

describe('Data Display Components with Gradient Styling', () => {
  describe('Table Component', () => {
    it('renders table with gradient header styling', () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>John Doe</TableCell>
              <TableCell>john@example.com</TableCell>
              <TableCell>Active</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      const header = screen.getByRole('columnheader', { name: 'Name' });
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass('font-semibold', 'text-slate-700');
    });

    it('applies hover effects on table rows', () => {
      render(
        <Table>
          <TableBody>
            <TableRow data-testid="table-row">
              <TableCell>Test Cell</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      const row = screen.getByTestId('table-row');
      expect(row).toHaveClass('transition-all', 'duration-300');
    });
  });

  describe('Badge Component', () => {
    it('renders gradient badge variants', () => {
      render(
        <div>
          <Badge variant="gradient-green" data-testid="green-badge">Green</Badge>
          <Badge variant="gradient-blue" data-testid="blue-badge">Blue</Badge>
          <Badge variant="gradient-purple" data-testid="purple-badge">Purple</Badge>
          <Badge variant="success" data-testid="success-badge">Success</Badge>
        </div>
      );

      const greenBadge = screen.getByTestId('green-badge');
      const blueBadge = screen.getByTestId('blue-badge');
      const purpleBadge = screen.getByTestId('purple-badge');
      const successBadge = screen.getByTestId('success-badge');

      expect(greenBadge).toHaveClass('bg-gradient-to-r', 'from-green-500', 'to-teal-600');
      expect(blueBadge).toHaveClass('bg-gradient-to-r', 'from-blue-500', 'to-indigo-600');
      expect(purpleBadge).toHaveClass('bg-gradient-to-r', 'from-purple-500', 'to-violet-600');
      expect(successBadge).toHaveClass('bg-gradient-to-r', 'from-green-500', 'to-emerald-600');
    });

    it('applies hover effects on gradient badges', () => {
      render(<Badge variant="gradient-green" data-testid="hover-badge">Hover Test</Badge>);
      
      const badge = screen.getByTestId('hover-badge');
      expect(badge).toHaveClass('transition-all', 'duration-300');
    });
  });

  describe('List Component', () => {
    it('renders list with gradient styling', () => {
      render(
        <List variant="gradient-card" data-testid="gradient-list">
          <ListItem>
            <ListItemIcon gradient>
              <span>📊</span>
            </ListItemIcon>
            <ListItemContent>
              <ListItemTitle>Dashboard</ListItemTitle>
              <ListItemDescription>View analytics and reports</ListItemDescription>
            </ListItemContent>
            <ListItemActions>
              <Button size="sm">View</Button>
            </ListItemActions>
          </ListItem>
        </List>
      );

      const list = screen.getByTestId('gradient-list');
      expect(list).toHaveClass('bg-gradient-to-br', 'from-white', 'to-slate-50/50');
      
      const title = screen.getByText('Dashboard');
      expect(title).toHaveClass('font-semibold');
    });

    it('applies interactive hover effects on list items', () => {
      render(
        <List>
          <ListItem variant="interactive" data-testid="interactive-item">
            <ListItemContent>
              <ListItemTitle>Interactive Item</ListItemTitle>
            </ListItemContent>
          </ListItem>
        </List>
      );

      const item = screen.getByTestId('interactive-item');
      expect(item).toHaveClass('cursor-pointer', 'transition-all', 'duration-300');
    });

    it('shows selected state with gradient styling', () => {
      render(
        <List>
          <ListItem selected data-testid="selected-item">
            <ListItemContent>
              <ListItemTitle>Selected Item</ListItemTitle>
            </ListItemContent>
          </ListItem>
        </List>
      );

      const item = screen.getByTestId('selected-item');
      expect(item).toHaveClass('bg-gradient-to-r', 'from-green-100/50', 'to-teal-100/50');
    });
  });

  describe('Pagination Component', () => {
    it('renders pagination with gradient styling', () => {
      render(
        <Pagination variant="gradient">
          <PaginationContent variant="gradient">
            <PaginationItem>
              <PaginationPrevious onClick={() => {}} />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink onClick={() => {}} isActive>1</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink onClick={() => {}}>2</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext onClick={() => {}} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      );

      const activeLink = screen.getByRole('button', { name: '1' });
      expect(activeLink).toHaveClass('bg-gradient-to-r', 'from-green-500', 'to-teal-600');
    });

    it('handles pagination navigation', () => {
      const mockOnClick = jest.fn();
      
      render(
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationNext onClick={mockOnClick} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      );

      const nextButton = screen.getByRole('button', { name: /next/i });
      fireEvent.click(nextButton);
      expect(mockOnClick).toHaveBeenCalled();
    });
  });

  describe('DataTable Component', () => {
    const mockData = [
      { id: 1, name: 'John Doe', email: 'john@example.com', status: 'active' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'inactive' },
    ];

    const mockColumns = [
      { id: 'name', header: 'Name', accessorKey: 'name' as keyof typeof mockData[0] },
      { id: 'email', header: 'Email', accessorKey: 'email' as keyof typeof mockData[0] },
      { 
        id: 'status', 
        header: 'Status', 
        accessorKey: 'status' as keyof typeof mockData[0],
        cell: ({ value }: { value: string }) => (
          <Badge variant={value === 'active' ? 'gradient-green' : 'gradient-blue'}>
            {value}
          </Badge>
        )
      },
    ];

    it('renders data table with gradient header styling', () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
        />
      );

      const nameHeader = screen.getByText('Name');
      expect(nameHeader.closest('th')).toHaveClass('font-semibold', 'text-slate-700');
    });

    it('applies gradient hover effects on table rows', () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          onRowClick={() => {}}
        />
      );

      const rows = screen.getAllByRole('row');
      const dataRow = rows[1]; // First data row (header is row 0)
      expect(dataRow).toHaveClass('transition-all', 'duration-300');
    });

    it('renders pagination with gradient styling when provided', () => {
      const mockPagination = {
        pageIndex: 0,
        pageSize: 10,
        pageCount: 5,
        onPageChange: jest.fn(),
        onPageSizeChange: jest.fn(),
      };

      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          pagination={mockPagination}
        />
      );

      const paginationContainer = screen.getByText('Page 1 of 5').closest('div')?.parentElement;
      expect(paginationContainer).toHaveClass('bg-gradient-to-r', 'from-slate-50/50');
    });

    it('handles sorting with gradient visual feedback', async () => {
      const mockOnSortingChange = jest.fn();
      const sortableColumns = mockColumns.map(col => ({ ...col, sortable: true }));

      render(
        <DataTable
          data={mockData}
          columns={sortableColumns}
          sorting={[]}
          onSortingChange={mockOnSortingChange}
        />
      );

      const nameHeader = screen.getByText('Name').closest('th');
      expect(nameHeader).toHaveClass('cursor-pointer');
      
      fireEvent.click(nameHeader!);
      expect(mockOnSortingChange).toHaveBeenCalled();
    });

    it('renders badge components with gradient styling in cells', () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
        />
      );

      const activeBadge = screen.getByText('active');
      expect(activeBadge).toHaveClass('bg-gradient-to-r', 'from-green-500', 'to-teal-600');
      
      const inactiveBadge = screen.getByText('inactive');
      expect(inactiveBadge).toHaveClass('bg-gradient-to-r', 'from-blue-500', 'to-indigo-600');
    });

    it('handles loading state with proper styling', () => {
      render(
        <DataTable
          data={[]}
          columns={mockColumns}
          loading={true}
          loadingRows={3}
        />
      );

      const loadingElements = screen.getAllByRole('cell');
      expect(loadingElements.length).toBeGreaterThan(0);
      
      // Check for loading animation classes
      const firstLoadingCell = loadingElements[0].querySelector('div');
      expect(firstLoadingCell).toHaveClass('animate-pulse');
    });

    it('displays empty state with proper styling', () => {
      render(
        <DataTable
          data={[]}
          columns={mockColumns}
          emptyMessage="No data found"
        />
      );

      const emptyMessage = screen.getByText('No data found');
      expect(emptyMessage).toBeInTheDocument();
      expect(emptyMessage.closest('td')).toHaveClass('text-center');
    });
  });

  describe('Integration Tests', () => {
    it('all components work together with consistent gradient theming', () => {
      const testData = [
        { id: 1, name: 'Test Item 1', category: 'Category A', status: 'active' },
        { id: 2, name: 'Test Item 2', category: 'Category B', status: 'inactive' },
      ];

      const columns = [
        { id: 'name', header: 'Name', accessorKey: 'name' as keyof typeof testData[0] },
        { 
          id: 'status', 
          header: 'Status', 
          accessorKey: 'status' as keyof typeof testData[0],
          cell: ({ value }: { value: string }) => (
            <Badge variant={value === 'active' ? 'gradient-green' : 'gradient-blue'}>
              {value}
            </Badge>
          )
        },
      ];

      render(
        <div className="space-y-6">
          {/* Data Table */}
          <DataTable
            data={testData}
            columns={columns}
            pagination={{
              pageIndex: 0,
              pageSize: 10,
              pageCount: 1,
              onPageChange: () => {},
              onPageSizeChange: () => {},
            }}
          />
          
          {/* List Component */}
          <List variant="gradient-card">
            <ListItem variant="interactive">
              <ListItemIcon gradient>
                <span>📊</span>
              </ListItemIcon>
              <ListItemContent>
                <ListItemTitle>Analytics Dashboard</ListItemTitle>
                <ListItemDescription>View comprehensive analytics</ListItemDescription>
              </ListItemContent>
              <ListItemActions>
                <Badge variant="gradient-green">New</Badge>
              </ListItemActions>
            </ListItem>
          </List>

          {/* Standalone Pagination */}
          <Pagination variant="gradient">
            <PaginationContent variant="gradient">
              <PaginationItem>
                <PaginationLink onClick={() => {}} isActive>1</PaginationLink>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      );

      // Verify all components render with gradient styling
      expect(screen.getByText('Name').closest('th')).toHaveClass('font-semibold');
      expect(screen.getByText('active')).toHaveClass('bg-gradient-to-r');
      expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
      expect(screen.getByText('New')).toHaveClass('bg-gradient-to-r');
    });
  });
});