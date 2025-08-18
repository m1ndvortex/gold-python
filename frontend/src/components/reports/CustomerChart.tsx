import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Doughnut, Scatter } from 'react-chartjs-2';
import { CustomerAnalysisData } from '../../services/reportsApi';
import { formatCurrency, formatNumber, formatPercentage } from '../../utils/formatters';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface CustomerChartProps {
  data: CustomerAnalysisData;
}

const CustomerChart: React.FC<CustomerChartProps> = ({ data }) => {
  // Customer Segmentation Data
  const segmentCounts = {
    high_value: data.customers.filter(c => c.segment === 'high_value').length,
    medium_value: data.customers.filter(c => c.segment === 'medium_value').length,
    low_value: data.customers.filter(c => c.segment === 'low_value').length,
  };

  const segmentRevenue = {
    high_value: data.customers.filter(c => c.segment === 'high_value').reduce((sum, c) => sum + c.period_purchases, 0),
    medium_value: data.customers.filter(c => c.segment === 'medium_value').reduce((sum, c) => sum + c.period_purchases, 0),
    low_value: data.customers.filter(c => c.segment === 'low_value').reduce((sum, c) => sum + c.period_purchases, 0),
  };

  // Customer Segmentation Pie Chart
  const segmentChartData = {
    labels: ['مشتریان پرارزش', 'مشتریان متوسط', 'مشتریان کم‌ارزش'],
    datasets: [
      {
        label: 'تعداد مشتریان',
        data: [segmentCounts.high_value, segmentCounts.medium_value, segmentCounts.low_value],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(156, 163, 175, 0.8)',
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(59, 130, 246)',
          'rgb(156, 163, 175)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const segmentChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          font: {
            family: 'IRANSans, sans-serif',
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const total = segmentCounts.high_value + segmentCounts.medium_value + segmentCounts.low_value;
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ${formatNumber(context.parsed)} مشتری (${percentage}%)`;
          },
        },
      },
    },
  };

  // Revenue by Segment Bar Chart
  const revenueChartData = {
    labels: ['پرارزش', 'متوسط', 'کم‌ارزش'],
    datasets: [
      {
        label: 'درآمد',
        data: [segmentRevenue.high_value, segmentRevenue.medium_value, segmentRevenue.low_value],
        backgroundColor: [
          'rgba(34, 197, 94, 0.6)',
          'rgba(59, 130, 246, 0.6)',
          'rgba(156, 163, 175, 0.6)',
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(59, 130, 246)',
          'rgb(156, 163, 175)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const revenueChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `درآمد: ${formatCurrency(context.parsed.y)}`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          font: {
            family: 'IRANSans, sans-serif',
          },
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          font: {
            family: 'IRANSans, sans-serif',
          },
          callback: function(value: any) {
            return formatCurrency(value);
          },
        },
      },
    },
  };

  // Customer Purchase vs Debt Scatter Plot
  const scatterData = {
    datasets: [
      {
        label: 'مشتریان پرارزش',
        data: data.customers
          .filter(c => c.segment === 'high_value')
          .map(c => ({ x: c.period_purchases, y: c.current_debt })),
        backgroundColor: 'rgba(34, 197, 94, 0.6)',
        borderColor: 'rgb(34, 197, 94)',
      },
      {
        label: 'مشتریان متوسط',
        data: data.customers
          .filter(c => c.segment === 'medium_value')
          .map(c => ({ x: c.period_purchases, y: c.current_debt })),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgb(59, 130, 246)',
      },
      {
        label: 'مشتریان کم‌ارزش',
        data: data.customers
          .filter(c => c.segment === 'low_value')
          .map(c => ({ x: c.period_purchases, y: c.current_debt })),
        backgroundColor: 'rgba(156, 163, 175, 0.6)',
        borderColor: 'rgb(156, 163, 175)',
      },
    ],
  };

  const scatterOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            family: 'IRANSans, sans-serif',
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return [
              `خرید دوره: ${formatCurrency(context.parsed.x)}`,
              `بدهی فعلی: ${formatCurrency(context.parsed.y)}`,
            ];
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'خرید در دوره',
          font: {
            family: 'IRANSans, sans-serif',
          },
        },
        ticks: {
          font: {
            family: 'IRANSans, sans-serif',
          },
          callback: function(value: any) {
            return formatCurrency(value);
          },
        },
      },
      y: {
        title: {
          display: true,
          text: 'بدهی فعلی',
          font: {
            family: 'IRANSans, sans-serif',
          },
        },
        beginAtZero: true,
        ticks: {
          font: {
            family: 'IRANSans, sans-serif',
          },
          callback: function(value: any) {
            return formatCurrency(value);
          },
        },
      },
    },
  };

  // Top Customers by Purchase
  const topCustomers = data.customers
    .sort((a, b) => b.period_purchases - a.period_purchases)
    .slice(0, 10);

  const topCustomersChartData = {
    labels: topCustomers.map(c => 
      c.customer_name.length > 15 ? 
      c.customer_name.substring(0, 15) + '...' : 
      c.customer_name
    ),
    datasets: [
      {
        label: 'خرید دوره',
        data: topCustomers.map(c => c.period_purchases),
        backgroundColor: 'rgba(168, 85, 247, 0.6)',
        borderColor: 'rgb(168, 85, 247)',
        borderWidth: 1,
      },
    ],
  };

  const topCustomersChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const customer = topCustomers[context.dataIndex];
            return [
              `خرید دوره: ${formatCurrency(context.parsed.x)}`,
              `تعداد فاکتور: ${formatNumber(customer.invoice_count)}`,
              `بدهی: ${formatCurrency(customer.current_debt)}`,
            ];
          },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          font: {
            family: 'IRANSans, sans-serif',
          },
          callback: function(value: any) {
            return formatCurrency(value);
          },
        },
      },
      y: {
        ticks: {
          font: {
            family: 'IRANSans, sans-serif',
          },
        },
      },
    },
  };

  return (
    <div className="space-y-8">
      {/* Customer Segmentation Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h4 className="text-lg font-semibold mb-4">بخش‌بندی مشتریان (تعداد)</h4>
          <div className="h-64">
            <Doughnut data={segmentChartData} options={segmentChartOptions} />
          </div>
        </div>

        <div>
          <h4 className="text-lg font-semibold mb-4">درآمد بر اساس بخش</h4>
          <div className="h-64">
            <Bar data={revenueChartData} options={revenueChartOptions} />
          </div>
        </div>
      </div>

      {/* Purchase vs Debt Analysis */}
      <div>
        <h4 className="text-lg font-semibold mb-4">تحلیل خرید در مقابل بدهی</h4>
        <div className="h-80">
          <Scatter data={scatterData} options={scatterOptions} />
        </div>
      </div>

      {/* Top Customers */}
      <div>
        <h4 className="text-lg font-semibold mb-4">برترین مشتریان (خرید دوره)</h4>
        <div className="h-80">
          <Bar data={topCustomersChartData} options={topCustomersChartOptions} />
        </div>
      </div>

      {/* Customer Statistics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-lg">
          <h5 className="text-lg font-semibold text-green-800 mb-4">مشتریان پرارزش</h5>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-green-700">تعداد:</span>
              <span className="font-bold text-green-900">{formatNumber(segmentCounts.high_value)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-700">درآمد:</span>
              <span className="font-bold text-green-900">{formatCurrency(segmentRevenue.high_value)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-700">میانگین خرید:</span>
              <span className="font-bold text-green-900">
                {segmentCounts.high_value > 0 ? formatCurrency(segmentRevenue.high_value / segmentCounts.high_value) : '۰'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg">
          <h5 className="text-lg font-semibold text-blue-800 mb-4">مشتریان متوسط</h5>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-blue-700">تعداد:</span>
              <span className="font-bold text-blue-900">{formatNumber(segmentCounts.medium_value)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">درآمد:</span>
              <span className="font-bold text-blue-900">{formatCurrency(segmentRevenue.medium_value)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">میانگین خرید:</span>
              <span className="font-bold text-blue-900">
                {segmentCounts.medium_value > 0 ? formatCurrency(segmentRevenue.medium_value / segmentCounts.medium_value) : '۰'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-lg">
          <h5 className="text-lg font-semibold text-gray-800 mb-4">مشتریان کم‌ارزش</h5>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-700">تعداد:</span>
              <span className="font-bold text-gray-900">{formatNumber(segmentCounts.low_value)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">درآمد:</span>
              <span className="font-bold text-gray-900">{formatCurrency(segmentRevenue.low_value)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">میانگین خرید:</span>
              <span className="font-bold text-gray-900">
                {segmentCounts.low_value > 0 ? formatCurrency(segmentRevenue.low_value / segmentCounts.low_value) : '۰'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Behavior Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border rounded-lg p-6">
          <h5 className="text-lg font-semibold mb-4">تحلیل رفتار پرداخت</h5>
          <div className="space-y-3">
            {data.customers
              .filter(c => c.current_debt > 0)
              .sort((a, b) => b.current_debt - a.current_debt)
              .slice(0, 5)
              .map((customer, index) => (
                <div key={customer.customer_id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div>
                    <span className="font-medium">{customer.customer_name}</span>
                    <div className="text-sm text-gray-600">
                      نسبت پرداخت: {formatPercentage(customer.payment_ratio)}
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-red-600">
                      {formatCurrency(customer.current_debt)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatNumber(customer.invoice_count)} فاکتور
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <h5 className="text-lg font-semibold mb-4">آمار کلی</h5>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
              <span>میانگین درآمد هر مشتری</span>
              <span className="font-bold text-blue-600">
                {formatCurrency(data.summary.average_revenue_per_customer)}
              </span>
            </div>
            <div className="flex justify-between items-center p-2 bg-green-50 rounded">
              <span>درصد مشتریان پرارزش</span>
              <span className="font-bold text-green-600">
                {formatPercentage((segmentCounts.high_value / data.summary.total_active_customers) * 100)}
              </span>
            </div>
            <div className="flex justify-between items-center p-2 bg-orange-50 rounded">
              <span>درصد مشتریان بدهکار</span>
              <span className="font-bold text-orange-600">
                {formatPercentage(data.summary.debt_percentage)}
              </span>
            </div>
            <div className="flex justify-between items-center p-2 bg-purple-50 rounded">
              <span>سهم درآمد مشتریان پرارزش</span>
              <span className="font-bold text-purple-600">
                {formatPercentage((segmentRevenue.high_value / data.summary.total_revenue) * 100)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerChart;