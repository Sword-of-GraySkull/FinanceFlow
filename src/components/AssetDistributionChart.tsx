import React from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title
} from 'chart.js';
import { formatINR } from '../utils/currency';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, Title);

interface AssetDistributionChartProps {
  assetDistribution: Array<{
    type: string;
    amount: number;
    percentage: number;
    count: number;
  }>;
}

export default function AssetDistributionChart({ assetDistribution }: AssetDistributionChartProps) {
  // Define colors for the chart
  const colors = [
    '#3B82F6', // blue-500
    '#10B981', // emerald-500
    '#8B5CF6', // violet-500
    '#F59E0B', // amber-500
    '#EF4444', // red-500
    '#F97316', // orange-500
    '#06B6D4', // cyan-500
    '#84CC16', // lime-500
    '#EC4899', // pink-500
    '#6366F1', // indigo-500
  ];

  const chartData = {
    labels: assetDistribution.map(asset => `${asset.type} (${asset.count} account${asset.count > 1 ? 's' : ''})`),
    datasets: [
      {
        data: assetDistribution.map(asset => asset.amount),
        backgroundColor: colors.slice(0, assetDistribution.length),
        borderColor: colors.slice(0, assetDistribution.length).map(color => color),
        borderWidth: 2,
        hoverBorderWidth: 3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: 'Asset Distribution by Account Type',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
        color: '#374151',
      },
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const asset = assetDistribution[context.dataIndex];
            return [
              `${asset.type}: ${asset.percentage.toFixed(1)}%`,
              `Amount: ${formatINR(asset.amount)}`,
              `Accounts: ${asset.count}`
            ];
          },
        },
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
      },
    },
    elements: {
      arc: {
        borderWidth: 2,
      },
    },
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="h-96">
        <Pie data={chartData} options={options} />
      </div>
      
      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {assetDistribution.map((asset, index) => (
          <div key={asset.type} className="text-center">
            <div 
              className="w-4 h-4 rounded-full mx-auto mb-2"
              style={{ backgroundColor: colors[index % colors.length] }}
            />
            <p className="text-sm font-medium text-gray-900">{asset.type}</p>
            <p className="text-lg font-bold" style={{ color: colors[index % colors.length] }}>
              {asset.percentage.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500">
              {formatINR(asset.amount)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
