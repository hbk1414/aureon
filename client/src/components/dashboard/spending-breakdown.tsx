import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SpendingPieChart from '@/components/charts/spending-pie-chart';
import { useTrueLayerData } from '@/hooks/use-truelayer-data';

interface SpendingBreakdownProps {
  className?: string;
}

// Helper function to categorize transactions (matching the backend logic)
const categorizeTransaction = (transaction: any): string => {
  const description = transaction.description.toLowerCase();
  const merchantName = transaction.merchant_name?.toLowerCase() || '';

  if (description.includes('tesco') || description.includes('sainsbury') || description.includes('asda') || merchantName.includes('tesco') || merchantName.includes('sainsbury')) {
    return 'Groceries';
  }
  if (description.includes('shell') || description.includes('petrol') || description.includes('fuel') || merchantName.includes('shell')) {
    return 'Transport';
  }
  if (description.includes('netflix') || description.includes('spotify') || description.includes('disney') || merchantName.includes('netflix') || merchantName.includes('spotify')) {
    return 'Subscriptions';
  }
  if (description.includes('coffee') || description.includes('starbucks') || description.includes('costa') || merchantName.includes('starbucks') || merchantName.includes('costa')) {
    return 'Dining';
  }
  if (description.includes('amazon') || merchantName.includes('amazon')) {
    return 'Shopping';
  }
  if (description.includes('rent') || description.includes('council') || description.includes('gas') || description.includes('electric') || description.includes('internet')) {
    return 'Bills';
  }
  if (description.includes('bus') || description.includes('tfl') || merchantName.includes('tfl')) {
    return 'Transport';
  }
  
  return 'Other';
};

const SpendingBreakdown: React.FC<SpendingBreakdownProps> = ({ className = "" }) => {
  const { data, loading } = useTrueLayerData();

  console.log('Spending Breakdown Data:', data);

  // Create fallback demo data if no real data is available
  const demoChartData = [
    {
      name: 'Food & Dining',
      value: 450.50,
      color: '#FF6B6B',
      transactions: [
        { id: '1', description: 'Costa Coffee', amount: 4.50, date: '2025-08-05', merchant: 'Costa Coffee' },
        { id: '2', description: 'Tesco Express', amount: 25.60, date: '2025-08-04', merchant: 'Tesco Express' },
        { id: '3', description: 'Pizza Express', amount: 28.90, date: '2025-08-03', merchant: 'Pizza Express' }
      ]
    },
    {
      name: 'Transport',
      value: 120.75,
      color: '#45B7D1',
      transactions: [
        { id: '4', description: 'TfL Oyster', amount: 15.20, date: '2025-08-05', merchant: 'TfL Oyster' },
        { id: '5', description: 'Uber', amount: 12.50, date: '2025-08-04', merchant: 'Uber' }
      ]
    },
    {
      name: 'Shopping',
      value: 280.30,
      color: '#4ECDC4',
      transactions: [
        { id: '6', description: 'Amazon', amount: 45.99, date: '2025-08-03', merchant: 'Amazon' },
        { id: '7', description: 'Marks & Spencer', amount: 67.50, date: '2025-08-02', merchant: 'Marks & Spencer' }
      ]
    },
    {
      name: 'Bills & Utilities',
      value: 95.00,
      color: '#96CEB4',
      transactions: [
        { id: '8', description: 'British Gas', amount: 95.00, date: '2025-08-01', merchant: 'British Gas' }
      ]
    }
  ];

  if (loading) {
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

  // Transform spending data for the chart - use real data if available
  let chartData = demoChartData;
  
  if (data && data.spendingCategories && Array.isArray(data.spendingCategories) && data.spendingCategories.length > 0) {
    // Map real transactions by category
    const transactionsByCategory: Record<string, any[]> = {};
    
    // Process all transactions and group by category
    Object.values(data.transactions || {}).flat().forEach((transaction: any) => {
      if (transaction.transaction_type === 'DEBIT') {
        const category = categorizeTransaction(transaction);
        if (!transactionsByCategory[category]) {
          transactionsByCategory[category] = [];
        }
        transactionsByCategory[category].push({
          id: transaction.transaction_id,
          description: transaction.description,
          amount: Math.abs(transaction.amount),
          date: transaction.timestamp,
          merchant: transaction.merchant_name || transaction.description
        });
      }
    });

    chartData = data.spendingCategories.map((category: any) => ({
      name: category.name || 'Unknown',
      value: Math.abs(category.amount || 0),
      color: getCategoryColor(category.name || 'Unknown'),
      transactions: transactionsByCategory[category.name] || []
    }));
  }



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
    'Dining': '#FF6B6B',
    'Shopping': '#4ECDC4',
    'Transport': '#45B7D1',
    'Bills & Utilities': '#96CEB4',
    'Bills': '#96CEB4',
    'Entertainment': '#FECA57',
    'Health & Fitness': '#FF9FF3',
    'Travel': '#54A0FF',
    'Education': '#5F27CD',
    'Other': '#DDA0DD',
    'Groceries': '#98D8C8',
    'Gas & Fuel': '#F7DC6F',
    'ATM & Cash': '#BB8FCE',
    'Subscriptions': '#FECA57'
  };

  return colorMap[category] || '#A8A8A8';
};

export default SpendingBreakdown;