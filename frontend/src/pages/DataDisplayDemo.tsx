import React, { useState } from 'react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { 
  BarChart3, 
  Users, 
  ShoppingCart, 
  TrendingUp, 
  Star,
  Eye,
  Edit,
  Trash2,
  Settings,
  Download
} from 'lucide-react';

const DataDisplayDemo: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Sample data for demonstrations
  const sampleTableData = [
    { id: 1, name: 'John Doe', email: 'john@example.com', status: 'active', role: 'Admin', lastLogin: '2024-01-15' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'active', role: 'User', lastLogin: '2024-01-14' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', status: 'inactive', role: 'User', lastLogin: '2024-01-10' },
    { id: 4, name: 'Alice Brown', email: 'alice@example.com', status: 'active', role: 'Manager', lastLogin: '2024-01-16' },
    { id: 5, name: 'Charlie Wilson', email: 'charlie@example.com', status: 'pending', role: 'User', lastLogin: '2024-01-12' },
  ];

  const tableColumns = [
    { 
      id: 'name', 
      header: 'Name', 
      accessorKey: 'name' as keyof typeof sampleTableData[0],
      sortable: true 
    },
    { 
      id: 'email', 
      header: 'Email', 
      accessorKey: 'email' as keyof typeof sampleTableData[0],
      sortable: true 
    },
    { 
      id: 'role', 
      header: 'Role', 
      accessorKey: 'role' as keyof typeof sampleTableData[0],
      cell: ({ value }: { value: string }) => (
        <Badge variant={
          value === 'Admin' ? 'gradient-purple' : 
          value === 'Manager' ? 'gradient-blue' : 
          'gradient-green'
        }>
          {value}
        </Badge>
      )
    },
    { 
      id: 'status', 
      header: 'Status', 
      accessorKey: 'status' as keyof typeof sampleTableData[0],
      cell: ({ value }: { value: string }) => (
        <Badge variant={
          value === 'active' ? 'success' : 
          value === 'inactive' ? 'error' : 
          'warning'
        }>
          {value}
        </Badge>
      )
    },
    { 
      id: 'lastLogin', 
      header: 'Last Login', 
      accessorKey: 'lastLogin' as keyof typeof sampleTableData[0],
      sortable: true 
    },
  ];

  const tableActions = [
    {
      id: 'view',
      label: 'View',
      icon: <Eye className="h-4 w-4" />,
      onClick: (row: any) => console.log('View', row),
    },
    {
      id: 'edit',
      label: 'Edit',
      icon: <Edit className="h-4 w-4" />,
      onClick: (row: any) => console.log('Edit', row),
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (row: any) => console.log('Delete', row),
      variant: 'destructive' as const,
    },
  ];

  const listItems = [
    {
      id: 1,
      title: 'Sales Dashboard',
      description: 'View comprehensive sales analytics and performance metrics',
      icon: <BarChart3 className="h-5 w-5" />,
      badge: { text: 'Updated', variant: 'gradient-green' as const },
      actions: ['View', 'Configure']
    },
    {
      id: 2,
      title: 'Customer Management',
      description: 'Manage customer profiles, orders, and communication history',
      icon: <Users className="h-5 w-5" />,
      badge: { text: 'Active', variant: 'gradient-blue' as const },
      actions: ['View', 'Edit']
    },
    {
      id: 3,
      title: 'Inventory System',
      description: 'Track products, stock levels, and automated reorder points',
      icon: <ShoppingCart className="h-5 w-5" />,
      badge: { text: 'Low Stock', variant: 'warning' as const },
      actions: ['View', 'Restock']
    },
    {
      id: 4,
      title: 'Analytics Reports',
      description: 'Generate detailed reports and export data for analysis',
      icon: <TrendingUp className="h-5 w-5" />,
      badge: { text: 'Premium', variant: 'gradient-purple' as const },
      actions: ['Generate', 'Export']
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
          Data Display Components Demo
        </h1>
        <p className="text-muted-foreground">
          Showcasing redesigned data display components with gradient styling
        </p>
      </div>

      {/* Badge Variants Section */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Badge Variants with Gradient Styling
          </CardTitle>
          <CardDescription>
            Various badge styles with gradient backgrounds and hover effects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-slate-700">Primary Gradients</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="gradient-green">Green</Badge>
                <Badge variant="gradient-teal">Teal</Badge>
                <Badge variant="gradient-blue">Blue</Badge>
                <Badge variant="gradient-purple">Purple</Badge>
                <Badge variant="gradient-pink">Pink</Badge>
                <Badge variant="gradient-orange">Orange</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-slate-700">Status Badges</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="success">Success</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="error">Error</Badge>
                <Badge variant="info">Info</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-slate-700">Light Variants</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="gradient-green-light">Green Light</Badge>
                <Badge variant="gradient-blue-light">Blue Light</Badge>
                <Badge variant="gradient-purple-light">Purple Light</Badge>
                <Badge variant="gradient-teal-light">Teal Light</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-slate-700">Traditional</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="default">Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="destructive">Destructive</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Basic Table Section */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50/50">
        <CardHeader>
          <CardTitle>Basic Table with Gradient Headers</CardTitle>
          <CardDescription>
            Simple table component with gradient header styling and hover effects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Gold Ring</TableCell>
                  <TableCell>Jewelry</TableCell>
                  <TableCell>$299.99</TableCell>
                  <TableCell>15</TableCell>
                  <TableCell>
                    <Badge variant="gradient-green">In Stock</Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Silver Necklace</TableCell>
                  <TableCell>Jewelry</TableCell>
                  <TableCell>$149.99</TableCell>
                  <TableCell>8</TableCell>
                  <TableCell>
                    <Badge variant="warning">Low Stock</Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Diamond Earrings</TableCell>
                  <TableCell>Jewelry</TableCell>
                  <TableCell>$599.99</TableCell>
                  <TableCell>0</TableCell>
                  <TableCell>
                    <Badge variant="error">Out of Stock</Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Advanced DataTable Section */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50/50">
        <CardHeader>
          <CardTitle>Advanced DataTable with Features</CardTitle>
          <CardDescription>
            Full-featured data table with sorting, pagination, selection, and actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={sampleTableData}
            columns={tableColumns}
            actions={tableActions}
            selection={{
              selectedRows: selectedItems,
              onSelectionChange: setSelectedItems,
            }}
            pagination={{
              pageIndex: currentPage,
              pageSize: 3,
              pageCount: Math.ceil(sampleTableData.length / 3),
              onPageChange: setCurrentPage,
              onPageSizeChange: () => {},
            }}
            sorting={[]}
            onSortingChange={() => {}}
            globalFilter=""
            onGlobalFilterChange={() => {}}
            searchPlaceholder="Search users..."
          />
        </CardContent>
      </Card>

      {/* List Component Section */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50/50">
        <CardHeader>
          <CardTitle>List Component with Gradient Styling</CardTitle>
          <CardDescription>
            Modern list component with gradient backgrounds and interactive elements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <List variant="gradient-card" spacing="lg">
            {listItems.map((item, index) => (
              <ListItem 
                key={item.id} 
                variant="interactive"
                selected={index === 1} // Demo selected state
              >
                <ListItemIcon gradient>
                  {item.icon}
                </ListItemIcon>
                <ListItemContent>
                  <ListItemTitle>{item.title}</ListItemTitle>
                  <ListItemDescription>{item.description}</ListItemDescription>
                </ListItemContent>
                <ListItemActions>
                  <Badge variant={item.badge.variant}>{item.badge.text}</Badge>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-1" />
                    Configure
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                </ListItemActions>
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* Pagination Component Section */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50/50">
        <CardHeader>
          <CardTitle>Pagination Component</CardTitle>
          <CardDescription>
            Modern pagination with gradient styling and smooth transitions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Standard Pagination */}
          <div>
            <h4 className="text-sm font-medium text-slate-700 mb-3">Standard Pagination</h4>
            <Pagination>
              <PaginationContent>
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
                  <PaginationLink onClick={() => {}}>3</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink onClick={() => {}}>10</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext onClick={() => {}} />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>

          {/* Gradient Pagination */}
          <div>
            <h4 className="text-sm font-medium text-slate-700 mb-3">Gradient Pagination</h4>
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
                  <PaginationLink onClick={() => {}}>3</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink onClick={() => {}}>8</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext onClick={() => {}} />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </CardContent>
      </Card>

      {/* Integration Example */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50/50">
        <CardHeader>
          <CardTitle>Complete Integration Example</CardTitle>
          <CardDescription>
            All components working together with consistent gradient theming
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-green-50 to-teal-100/50 p-4 rounded-lg border shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Total Users</p>
                  <p className="text-2xl font-bold text-green-900">1,234</p>
                </div>
                <Badge variant="gradient-green">+12%</Badge>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100/50 p-4 rounded-lg border shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Active Sessions</p>
                  <p className="text-2xl font-bold text-blue-900">856</p>
                </div>
                <Badge variant="gradient-blue">Live</Badge>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-violet-100/50 p-4 rounded-lg border shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">Revenue</p>
                  <p className="text-2xl font-bold text-purple-900">$45,678</p>
                </div>
                <Badge variant="gradient-purple">+8%</Badge>
              </div>
            </div>
            <div className="bg-gradient-to-br from-pink-50 to-rose-100/50 p-4 rounded-lg border shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-pink-700">Orders</p>
                  <p className="text-2xl font-bold text-pink-900">2,345</p>
                </div>
                <Badge variant="gradient-pink">+15%</Badge>
              </div>
            </div>
          </div>

          {/* Combined Table and List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-semibold mb-3">Recent Activity</h4>
              <List variant="gradient-card">
                <ListItem variant="gradient">
                  <ListItemIcon>
                    <Users className="h-4 w-4" />
                  </ListItemIcon>
                  <ListItemContent>
                    <ListItemTitle>New user registered</ListItemTitle>
                    <ListItemDescription>john.doe@example.com</ListItemDescription>
                  </ListItemContent>
                  <ListItemActions>
                    <Badge variant="gradient-green-light">2m ago</Badge>
                  </ListItemActions>
                </ListItem>
                <ListItem variant="gradient">
                  <ListItemIcon>
                    <ShoppingCart className="h-4 w-4" />
                  </ListItemIcon>
                  <ListItemContent>
                    <ListItemTitle>Order completed</ListItemTitle>
                    <ListItemDescription>Order #12345 - $299.99</ListItemDescription>
                  </ListItemContent>
                  <ListItemActions>
                    <Badge variant="gradient-blue-light">5m ago</Badge>
                  </ListItemActions>
                </ListItem>
              </List>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-3">Top Products</h4>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Sales</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Gold Ring</TableCell>
                      <TableCell>45</TableCell>
                      <TableCell><Badge variant="gradient-green">Trending</Badge></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Silver Chain</TableCell>
                      <TableCell>32</TableCell>
                      <TableCell><Badge variant="gradient-blue">Popular</Badge></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataDisplayDemo;