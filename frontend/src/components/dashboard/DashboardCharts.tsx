import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { SalesChartData, CategorySalesData, TopProduct } from '../../types';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface DashboardChartsProps {
  salesData: SalesChartData | null;
  categoryData: CategorySalesData[] | null;
  topProducts: TopProduct[] | null;
  isLoading: boolean;
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({
  salesData,
  categoryData,
  topProducts,
  isLoading
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Sales trend chart options
  const salesChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return formatCurrency(value);
          }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  };

  // Category sales doughnut chart
  const categoryChartData = categoryData ? {
    labels: categoryData.map(cat => cat.category_name),
    datasets: [
      {
        data: categoryData.map(cat => cat.total_sales),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40',
          '#FF6384',
          '#C9CBCF'
        ],
        borderWidth: 2,
        borderColor: '#fff',
      },
    ],
  } : null;

  const categoryChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const value = context.parsed;
            const total = categoryData?.reduce((sum, cat) => sum + cat.total_sales, 0) || 0;
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
            return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
          }
        }
      }
    },
  };

  // Top products bar chart
  const topProductsChartData = topProducts ? {
    labels: topProducts.map(product => product.item_name.length > 15 
      ? product.item_name.substring(0, 15) + '...' 
      : product.item_name
    ),
    datasets: [
      {
        label: 'Revenue',
        data: topProducts.map(product => product.total_revenue),
        backgroundColor: 'rgba(54, 162, 235, 0.8)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  } : null;

  const topProductsChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return formatCurrency(value);
          }
        }
      }
    },
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
              <div className="h-3 bg-gray-200 rounded w-48"></div>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Sales Trend Chart */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Sales Trends</CardTitle>
          <CardDescription>
            Daily sales performance over the last 30 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          {salesData ? (
            <div className="h-80">
              <Line data={salesData} options={salesChartOptions} />
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              No sales data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Sales Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Sales by Category</CardTitle>
          <CardDescription>
            Revenue distribution across product categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          {categoryChartData ? (
            <div className="h-80">
              <Doughnut data={categoryChartData} options={categoryChartOptions} />
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              No category data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Products Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Top Products</CardTitle>
          <CardDescription>
            Best performing products by revenue
          </CardDescription>
        </CardHeader>
        <CardContent>
          {topProductsChartData ? (
            <div className="h-80">
              <Bar data={topProductsChartData} options={topProductsChartOptions} />
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              No product data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};