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
  ChartData,
  ChartOptions,
  ChartDataset,
  BarController,
  LineController,
  ScatterController,
  registerables as registerChartJS,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';

// Register all ChartJS components
ChartJS.register(
  ...registerChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  BarController,
  LineController,
  ScatterController
);

// Line Chart Component
export const LineChart = ({
  data,
  options,
  height = 300,
  width = '100%',
}: {
  data: ChartData<'line'>;
  options?: ChartOptions<'line'>;
  height?: number | string;
  width?: number | string;
}) => {
  return (
    <div style={{ width, height }}>
      <Chart
        type="line"
        data={data}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top' as const,
            },
          },
          ...options,
        }}
      />
    </div>
  );
};

// Bar Chart Component
export const BarChart = ({
  data,
  options,
  height = 300,
  width = '100%',
}: {
  data: ChartData<'bar'>;
  options?: ChartOptions<'bar'>;
  height?: number | string;
  width?: number | string;
}) => {
  return (
    <div style={{ width, height }}>
      <Chart
        type="bar"
        data={data}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top' as const,
            },
          },
          ...options,
        }}
      />
    </div>
  );
};

// Doughnut Chart Component
export const DoughnutChart = ({
  data,
  options,
  height = 300,
  width = '100%',
}: {
  data: ChartData<'doughnut'>;
  options?: ChartOptions<'doughnut'>;
  height?: number | string;
  width?: number | string;
}) => {
  return (
    <div style={{ height, width }}>
      <Chart 
        type="doughnut" 
        data={data} 
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const label = context.label || '';
                  const value = context.raw as number;
                  const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                  const percentage = Math.round((value / total) * 100);
                  return `${label}: ${value} (${percentage}%)`;
                },
              },
            },
          },
          ...options,
        }} 
      />
    </div>
  );
};

// Export all chart types for convenience
export const Charts = {
  Line: LineChart,
  Bar: BarChart,
  Doughnut: DoughnutChart,
};

export default Charts;
