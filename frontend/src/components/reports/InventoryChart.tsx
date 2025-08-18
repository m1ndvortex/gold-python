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
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { InventoryValuationData } from '../../services/reportsApi';
import { formatCurrency, formatWeight, formatPercentage } from '../../utils/formatters';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface InventoryChartProps {
  data: InventoryValuationData;
}

const InventoryChart: React.FC<InventoryChartProps> = ({ data }) => {
  // Prepare data for category valuation chart
  const categories = data.category_breakdown.map(cat => cat.category_name);
  const purchaseValues = data.category_breakdown.map(cat => cat.purchase_value);
  const sellValues = data.category_breakdown.map(cat => cat.sell_value);
  const profitMargins = data.category_breakdown.map(cat => cat.profit_margin);

  // Colors for charts
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

  // Category Valuation Bar Chart
  const valuationChartData = {
    labels: categories,
    datasets: [
      {
        label: 'ارزش خرید',
        data: purchaseValues,
        backgroundColor: 'rgba(239, 68, 68, 0.6)',
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 1,
      },
      {
        label: 'ارزش فروش',
        data: sellValues,
        backgroundColor: 'rgba(34, 197, 94, 0.6)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1,
      },
    ],
  };

  const valuationChartOptions = {
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
            return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
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

  // Profit Margin Distribution Doughnut Chart
  const profitChartData = {
    labels: categories,
    datasets: [
      {
        label: 'حاشیه سود',
        data: profitMargins,
        backgroundColor: colors.slice(0, categories.length),
        borderColor: colors.slice(0, categories.length).map(color => color.replace('0.8', '1')),
        borderWidth: 2,
      },
    ],
  };

  const profitChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          font: {
            family: 'IRANSans, sans-serif',
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.label}: ${formatPercentage(context.parsed)}`;
          },
        },
      },
    },
  };

  // Top Items by Value
  const topItems = data.items
    .sort((a, b) => b.total_sell_value - a.total_sell_value)
    .slice(0, 10);

  const topItemsChartData = {
    labels: topItems.map(item => item.item_name.length > 20 ? 
      item.item_name.substring(0, 20) + '...' : item.item_name),
    datasets: [
      {
        label: 'ارزش فروش',
        data: topItems.map(item => item.total_sell_value),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
    ],
  };

  const topItemsChartOptions = {
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
            const item = topItems[context.dataIndex];
            return [
              `ارزش فروش: ${formatCurrency(context.parsed.x)}`,
              `موجودی: ${item.stock_quantity} عدد`,
              `وزن: ${formatWeight(item.total_weight_grams)}`,
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
      {/* Category Valuation Chart */}
      <div>
        <h4 className="text-lg font-semibold mb-4">ارزش موجودی بر اساس دسته‌بندی</h4>
        <div className="h-80">
          <Bar data={valuationChartData} options={valuationChartOptions} />
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profit Margin Distribution */}
        <div>
          <h4 className="text-lg font-semibold mb-4">توزیع حاشیه سود</h4>
          <div className="h-64">
            <Doughnut data={profitChartData} options={profitChartOptions} />
          </div>
        </div>

        {/* Top Items by Value */}
        <div>
          <h4 className="text-lg font-semibold mb-4">پرارزش‌ترین محصولات</h4>
          <div className="h-64">
            <Bar data={topItemsChartData} options={topItemsChartOptions} />
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
          <div className="text-sm text-blue-700 font-medium">میانگین حاشیه سود</div>
          <div className="text-2xl font-bold text-blue-900">
            {formatPercentage(data.summary.overall_profit_margin)}
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
          <div className="text-sm text-green-700 font-medium">نسبت ارزش فروش به خرید</div>
          <div className="text-2xl font-bold text-green-900">
            {(data.summary.total_sell_value / data.summary.total_purchase_value).toFixed(2)}x
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg">
          <div className="text-sm text-purple-700 font-medium">میانگین ارزش هر قطعه</div>
          <div className="text-2xl font-bold text-purple-900">
            {formatCurrency(data.summary.total_sell_value / data.summary.total_items)}
          </div>
        </div>
      </div>

      {/* Category Performance Table */}
      <div>
        <h4 className="text-lg font-semibold mb-4">عملکرد دسته‌بندی‌ها</h4>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="border border-gray-200 px-4 py-2 text-right">دسته‌بندی</th>
                <th className="border border-gray-200 px-4 py-2 text-right">تعداد اقلام</th>
                <th className="border border-gray-200 px-4 py-2 text-right">ارزش فروش</th>
                <th className="border border-gray-200 px-4 py-2 text-right">حاشیه سود</th>
                <th className="border border-gray-200 px-4 py-2 text-right">سهم از کل</th>
              </tr>
            </thead>
            <tbody>
              {data.category_breakdown
                .sort((a, b) => b.sell_value - a.sell_value)
                .map((category, index) => {
                  const sharePercentage = (category.sell_value / data.summary.total_sell_value) * 100;
                  return (
                    <tr key={category.category_name} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border border-gray-200 px-4 py-2 font-medium">
                        {category.category_name}
                      </td>
                      <td className="border border-gray-200 px-4 py-2">
                        {category.item_count} عدد
                      </td>
                      <td className="border border-gray-200 px-4 py-2">
                        {formatCurrency(category.sell_value)}
                      </td>
                      <td className="border border-gray-200 px-4 py-2">
                        <span className={`px-2 py-1 rounded text-sm ${
                          category.profit_margin > 30 ? 'bg-green-100 text-green-800' :
                          category.profit_margin > 15 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {formatPercentage(category.profit_margin)}
                        </span>
                      </td>
                      <td className="border border-gray-200 px-4 py-2">
                        {formatPercentage(sharePercentage)}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InventoryChart;