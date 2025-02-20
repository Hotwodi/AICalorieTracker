import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

interface MacroChartProps {
  protein: number;
  carbs: number;
  fat: number;
}

// Primary colors matching the macro cards
const CHART_COLORS = {
  protein: {
    fill: 'rgba(220, 38, 38, 0.7)',    // red-600 with opacity
    border: 'rgb(220, 38, 38)',        // red-600
  },
  carbs: {
    fill: 'rgba(37, 99, 235, 0.7)',    // blue-600 with opacity
    border: 'rgb(37, 99, 235)',        // blue-600
  },
  fat: {
    fill: 'rgba(234, 179, 8, 0.7)',    // yellow-500 with opacity
    border: 'rgb(234, 179, 8)',        // yellow-500
  },
};

export const MacroChart = ({ protein, carbs, fat }: MacroChartProps) => {
  // Convert macros to calories
  const proteinCalories = protein * 4;  // 4 calories per gram of protein
  const carbsCalories = carbs * 4;      // 4 calories per gram of carbs
  const fatCalories = fat * 9;          // 9 calories per gram of fat

  const data = {
    labels: ['Protein', 'Carbs', 'Fat'],
    datasets: [
      {
        data: [proteinCalories, carbsCalories, fatCalories],
        backgroundColor: [
          CHART_COLORS.protein.fill,
          CHART_COLORS.carbs.fill,
          CHART_COLORS.fat.fill,
        ],
        borderColor: [
          CHART_COLORS.protein.border,
          CHART_COLORS.carbs.border,
          CHART_COLORS.fat.border,
        ],
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          font: {
            size: 14,
            weight: 'bold' as const,
          },
          padding: 20,
          usePointStyle: true,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.raw || 0;
            const percentage = ((value / (proteinCalories + carbsCalories + fatCalories)) * 100).toFixed(1);
            return `${label}: ${value.toLocaleString()} kcal (${percentage}%)`;
          },
        },
        titleFont: {
          size: 14,
          weight: 'bold' as const,
        },
        bodyFont: {
          size: 14,
        },
        padding: 12,
      },
    },
  };

  const totalCalories = proteinCalories + carbsCalories + fatCalories;

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-xl font-bold mb-1">Macro Distribution</h3>
        <p className="text-lg font-semibold">
          Total: {totalCalories.toLocaleString()} kcal
        </p>
      </div>
      <div className="w-full max-w-sm mx-auto">
        <Pie data={data} options={options} />
      </div>
      <div className="text-center text-sm text-muted-foreground">
        <p>Red: Protein • Blue: Carbs • Yellow: Fat</p>
      </div>
    </div>
  );
};
