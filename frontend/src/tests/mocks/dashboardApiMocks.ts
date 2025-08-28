export const mockDashboardApi = {
  getDailySalesSummary: jest.fn().mockResolvedValue({
    date: '2024-01-15',
    today: { total_sales: 5000, total_paid: 4500, invoice_count: 12 },
    week: { total_sales: 25000, total_paid: 22000, invoice_count: 65 },
    month: { total_sales: 95000, total_paid: 88000, invoice_count: 245 },
  }),

  getInventoryValuation: jest.fn().mockResolvedValue({
    summary: {
      total_sell_value: 150000,
      total_cost_value: 120000,
      total_items: 450,
    },
  }),

  getCustomerDebtSummary: jest.fn().mockResolvedValue({
    summary: {
      total_outstanding_debt: 15000,
      overdue_debt: 8000,
      customer_count: 25,
    },
  }),

  getCurrentGoldPrice: jest.fn().mockResolvedValue({
    price_per_gram: 65.40,
    change_percentage: 2.5,
    last_updated: '2024-01-15T10:30:00Z',
  }),

  getLowStockItems: jest.fn().mockResolvedValue([
    {
      item_id: '1',
      item_name: 'Gold Ring 18K',
      current_stock: 2,
      min_stock_level: 5,
      category_name: 'Rings',
      status: 'critical',
    },
    {
      item_id: '2',
      item_name: 'Silver Necklace',
      current_stock: 3,
      min_stock_level: 8,
      category_name: 'Necklaces',
      status: 'low',
    },
  ]),

  getUnpaidInvoices: jest.fn().mockResolvedValue([
    {
      invoice_id: 'INV-001',
      invoice_number: 'INV-2024-001',
      customer_name: 'John Smith',
      total_amount: 2500,
      remaining_amount: 2500,
      days_overdue: 15,
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      invoice_id: 'INV-002',
      invoice_number: 'INV-2024-002',
      customer_name: 'Jane Doe',
      total_amount: 1800,
      remaining_amount: 900,
      days_overdue: 5,
      created_at: '2024-01-10T00:00:00Z',
    },
  ]),

  getSalesChartData: jest.fn().mockResolvedValue({
    labels: ['Jan 1', 'Jan 2', 'Jan 3', 'Jan 4', 'Jan 5'],
    datasets: [
      {
        label: 'Daily Sales',
        data: [1200, 1500, 1800, 1300, 2100],
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2,
      },
    ],
  }),

  getCategorySalesData: jest.fn().mockResolvedValue([
    {
      category_name: 'Rings',
      total_sales: 15000,
      total_quantity: 25,
      percentage: 35.5,
    },
    {
      category_name: 'Necklaces',
      total_sales: 12000,
      total_quantity: 18,
      percentage: 28.4,
    },
    {
      category_name: 'Bracelets',
      total_sales: 8000,
      total_quantity: 15,
      percentage: 18.9,
    },
  ]),

  getTopProducts: jest.fn().mockResolvedValue([
    {
      item_name: 'Diamond Ring 2ct',
      total_revenue: 8500,
      quantity_sold: 3,
      avg_price: 2833.33,
    },
    {
      item_name: 'Gold Chain 22K',
      total_revenue: 6200,
      quantity_sold: 8,
      avg_price: 775,
    },
    {
      item_name: 'Pearl Earrings',
      total_revenue: 4800,
      quantity_sold: 12,
      avg_price: 400,
    },
  ]),

  getSummary: jest.fn().mockResolvedValue({
    total_sales_today: 5000,
    total_sales_week: 25000,
    total_sales_month: 95000,
    total_inventory_value: 150000,
    total_customer_debt: 15000,
    current_gold_price: 65.40,
    gold_price_change: 2.5,
    low_stock_count: 2,
    unpaid_invoices_count: 2,
  }),

  refreshAll: jest.fn().mockResolvedValue({
    summary: {},
    salesChart: {},
    categorySales: [],
    topProducts: [],
    lowStock: [],
    unpaidInvoices: [],
  }),
};