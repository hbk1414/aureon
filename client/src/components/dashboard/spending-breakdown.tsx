import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SpendingPieChart from '@/components/charts/spending-pie-chart';
import { useTrueLayerData } from '@/hooks/use-truelayer-data';

interface SpendingBreakdownProps {
  className?: string;
}

const SpendingBreakdown: React.FC<SpendingBreakdownProps> = ({ className = "" }) => {
  const { data, loading } = useTrueLayerData();

  if (loading || !data) {
    return (
      <Card className={`w-full ${className}`}>
        <CardHeader>
          <CardTitle>Spending Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Transform spending data for the chart
  const chartData = Object.entries(data.spendingByCategory || {}).map(([category, categoryData]: [string, any]) => ({
    name: category,
    value: Math.abs(categoryData.total || 0),
    color: getCategoryColor(category),
    transactions: categoryData.transactions || []
  }));

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Spending Breakdown</span>
          <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
            Click segments for details
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <SpendingPieChart data={chartData} />
        ) : (
          <div className="h-96 flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">No spending data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Helper function to assign colors to categories
const getCategoryColor = (category: string): string => {
  const colorMap: { [key: string]: string } = {
    'Food & Dining': '#FF6B6B',
    'Shopping': '#4ECDC4',
    'Transport': '#45B7D1',
    'Bills & Utilities': '#96CEB4',
    'Entertainment': '#FECA57',
    'Health & Fitness': '#FF9FF3',
    'Travel': '#54A0FF',
    'Education': '#5F27CD',
    'Other': '#DDA0DD',
    'Groceries': '#98D8C8',
    'Gas & Fuel': '#F7DC6F',
    'ATM & Cash': '#BB8FCE'
  };

  return colorMap[category] || '#A8A8A8';
};

export default SpendingBreakdown;