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
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { SalesTrendData } from '../../services/reportsApi';
import { formatCurrency, formatNumber } from '../../utils/formatters';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface SalesChartProps {
  data: SalesTrendData;
  period: 'daily' | 'weekly' | 'monthly';
}

const SalesChart: React.FC<SalesChartProps> = ({ data, period }) => {
  // Prepare chart data
  const labels = data.trends.map(trend => {
    const date = new Date(trend.period);
    if (period === 'daily') {
      return date.toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' });
    } else if (period === 'weekly') {
      return `هفته ${date.toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' })}`;
    } else {
      return date.toLocaleDateString('fa-IR', { year: 'numeric', month: 'long' });
    }
  });

  const salesData = data.trends.map(trend => trend.total_amount);
  const paidData = data.trends.map(trend => trend.paid_amount);
  const itemsData = data.trends.map(trend => trend.items_sold);

  // Chart configuration for line chart
  const lineChartOptions = {
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
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${formatCurrency(value)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
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

  // Chart configuration for bar chart
  const barChartOptions = {
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
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${formatNumber(value)} عدد`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
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
            return formatNumber(value);
          },
        },
      },
    },
  };

  const chartData = {
    labels,
    datasets: [
      {
        label: 'کل فروش',
        data: salesData,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y',
      },
      {
        label: 'مبلغ دریافتی',
        data: paidData,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y',
      },
    ],
  };

  const barChartData = {
    labels,
    datasets: [
      {
        label: 'تعداد اقلام',
        data: itemsData,
        backgroundColor: 'rgba(168, 85, 247, 0.6)',
        borderColor: 'rgb(168, 85, 247)',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Main Sales Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-80">
          <h4 className="text-lg font-semibold mb-4">روند فروش و پرداخت</h4>
          <Line data={chartData} options={lineChartOptions} />
        </div>
        <div className="h-80">
          <h4 className="text-lg font-semibold mb-4">تعداد اقلام فروخته شده</h4>
          <Bar data={barChartData} options={barChartOptions} />
        </div>
      </div>

      {/* Category Breakdown Chart */}
      {data.trends.length > 0 && data.trends[0].categories && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="text-lg font-semibold mb-4">فروش بر اساس دسته‌بندی</h4>
            <div className="h-64">
              <CategorySalesChart trends={data.trends} />
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">آمار کلی دوره</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="font-medium">میانگین فروش روزانه</span>
                <span className="font-bold text-blue-600">
                  {formatCurrency(data.summary.average_daily_sales)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="font-medium">درصد پرداخت</span>
                <span className="font-bold text-green-600">
                  {((data.summary.total_paid / data.summary.total_sales) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span className="font-medium">کل اقلام فروخته شده</span>
                <span className="font-bold text-purple-600">
                  {formatNumber(data.summary.total_items_sold)} عدد
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                <span className="font-medium">مانده بدهی</span>
                <span className="font-bold text-orange-600">
                  {formatCurrency(data.summary.total_outstanding)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Category Sales Chart Component
const CategorySalesChart: React.FC<{ trends: any[] }> = ({ trends }) => {
  // Aggregate category sales across all periods
  const categoryTotals: Record<string, number> = {};
  
  trends.forEach(trend => {
    Object.entries(trend.categories || {}).forEach(([category, amount]) => {
      categoryTotals[category] = (categoryTotals[category] || 0) + (amount as number);
    });
  });

  const categories = Object.keys(categoryTotals);
  const amounts = Object.values(categoryTotals);

  const colors = [
    'rgba(59, 130, 246, 0.8)',
    'rgba(34, 197, 94, 0.8)',
    'rgba(168, 85, 247, 0.8)',
    'rgba(251, 146, 60, 0.8)',
    'rgba(239, 68, 68, 0.8)',
    'rgba(14, 165, 233, 0.8)',
    'rgba(139, 92, 246, 0.8)',
    'rgba(34, 197, 94, 0.8)',
  ];

  const chartData = {
    labels: categories,
    datasets: [
      {
        label: 'فروش دسته‌بندی',
        data: amounts,
        backgroundColor: colors.slice(0, categories.length),
        borderColor: colors.slice(0, categories.length).map(color => color.replace('0.8', '1')),
        borderWidth: 1,
      },
    ],
  };

  const options = {
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
            return `${context.label}: ${formatCurrency(context.parsed)}`;
          },
        },
      },
    },
    scales: {
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
      x: {
        ticks: {
          font: {
            family: 'IRANSans, sans-serif',
          },
        },
      },
    },
  };

  return <Bar data={chartData} options={options} />;
};

export default SalesChart;