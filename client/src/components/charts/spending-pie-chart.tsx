import React, { useState, useRef, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { graphic } from 'echarts/core';
import MetaballPath from './metaball-path';

// Register the metaball shape
graphic.registerShape('metaball', MetaballPath as any);

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  merchant?: string;
}

interface SpendingCategory {
  name: string;
  value: number;
  color: string;
  transactions: Transaction[];
}

interface SpendingPieChartProps {
  data: SpendingCategory[];
  className?: string;
}

const SpendingPieChart: React.FC<SpendingPieChartProps> = ({ data, className = "" }) => {
  const [selectedCategory, setSelectedCategory] = useState<SpendingCategory | null>(null);
  const [showMetaballs, setShowMetaballs] = useState(false);
  const [metaballData, setMetaballData] = useState<any[]>([]);
  const chartRef = useRef<any>(null);

  console.log('SpendingPieChart received data:', data);

  // Ensure we have valid data
  if (!data || data.length === 0) {
    return (
      <div className={`relative ${className}`}>
        <div className="h-96 flex items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400">No spending data available</p>
        </div>
      </div>
    );
  }

  const pieChartOptions = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: £{c} ({d}%)',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderColor: 'transparent',
      textStyle: {
        color: '#fff',
        fontSize: 12
      }
    },
    legend: {
      show: false
    },
    series: [
      {
        name: 'Spending',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: !showMetaballs,
          position: 'outside',
          formatter: '{b}\n£{c}',
          fontSize: 11,
          color: '#374151',
          fontWeight: '500'
        },
        emphasis: {
          scale: true,
          scaleSize: 10,
          itemStyle: {
            shadowBlur: 20,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.3)'
          }
        },
        data: data.map(item => ({
          value: item.value,
          name: item.name,
          itemStyle: {
            color: item.color
          },
          category: item
        }))
      }
    ]
  };

  const metaballOptions = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        if (params.value && params.value.length >= 5) {
          const amount = params.value[3];
          const label = params.value[4];
          return `${label}<br/>£${amount.toFixed(2)}`;
        }
        return 'Transaction';
      },
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderColor: 'transparent',
      textStyle: {
        color: '#fff',
        fontSize: 12
      }
    },
    animation: true,
    animationDuration: 800,
    animationEasing: 'bounceOut',
    series: [
      {
        type: 'scatter',
        coordinateSystem: 'cartesian2d',
        data: metaballData.map((item, index) => [
          item.value[0], // x
          item.value[1], // y
          item.value[2], // size for symbolSize
          item.value[3], // amount for tooltip
          item.value[4]  // label for tooltip
        ]),
        symbolSize: (value: number[]) => Math.max(value[2], 10),
        itemStyle: {
          color: (params: any) => {
            const colors = [
              '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
              '#FECA57', '#FF9FF3', '#54A0FF', '#5F27CD'
            ];
            return colors[params.dataIndex % colors.length];
          },
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.3)',
          opacity: 0.8
        },
        emphasis: {
          scale: true,
          scaleSize: 15,
          itemStyle: {
            shadowBlur: 20,
            opacity: 1
          }
        }
      }
    ],
    xAxis: {
      type: 'value',
      show: false,
      min: 0,
      max: 400,
      splitLine: { show: false }
    },
    yAxis: {
      type: 'value', 
      show: false,
      min: 0,
      max: 400,
      splitLine: { show: false }
    },
    grid: {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0
    }
  };

  const chartOptions = showMetaballs ? metaballOptions : pieChartOptions;

  const createMetaballData = (transactions: Transaction[]) => {
    const centerX = 200; // Chart center
    const centerY = 200;
    const maxAmount = Math.max(...transactions.map(t => t.amount));
    
    return transactions.map((transaction, index) => {
      const angle = (index / transactions.length) * Math.PI * 2;
      const ringIndex = index % 3; // Create 3 rings
      const distance = 50 + ringIndex * 40; // Rings at different distances
      const radius = Math.max((transaction.amount / maxAmount) * 30, 10); // Size based on relative amount
      
      return {
        value: [
          centerX + Math.cos(angle) * distance, // x position
          centerY + Math.sin(angle) * distance, // y position
          radius, // radius for bubble size
          transaction.amount, // amount for tooltip
          transaction.merchant || transaction.description, // label
          transaction.id // unique id
        ]
      };
    });
  };

  const handleChartClick = (params: any) => {
    console.log('Chart clicked:', params);
    if (params.componentType === 'series' && params.data && !showMetaballs) {
      const category = params.data.category;
      console.log('Selected category:', category);
      setSelectedCategory(category);
      
      // Create metaball data from transactions
      const metaballs = createMetaballData(category.transactions);
      console.log('Created metaballs:', metaballs);
      setMetaballData(metaballs);
      setShowMetaballs(true);
    }
  };

  const hideMetaballs = () => {
    setShowMetaballs(false);
    setSelectedCategory(null);
    setMetaballData([]);
  };

  const onChartReady = (chartInstance: any) => {
    chartInstance.on('click', handleChartClick);
    console.log('Chart ready, data:', data);
    console.log('Show metaballs:', showMetaballs);
    console.log('Metaball data:', metaballData);
  };

  const formatAmount = (amount: number) => {
    return `£${Math.abs(amount).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short'
    });
  };

  return (
    <div className={`relative ${className}`}>
      <ReactECharts
        ref={chartRef}
        option={chartOptions}
        style={{ height: '400px', width: '100%' }}
        onChartReady={onChartReady}
        notMerge={true}
        lazyUpdate={true}
      />

      {/* Controls */}
      <AnimatePresence>
        {showMetaballs && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute top-4 right-4 z-10"
          >
            <button
              onClick={hideMetaballs}
              className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm transition-colors"
            >
              Back to Chart
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info overlay for metaballs */}
      <AnimatePresence>
        {showMetaballs && selectedCategory && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 rounded-lg p-3 shadow-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center space-x-2 mb-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: selectedCategory.color }}
              />
              <span className="font-medium text-gray-900 dark:text-white text-sm">
                {selectedCategory.name}
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {selectedCategory.transactions.length} transactions • {formatAmount(selectedCategory.value)} total
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Each bubble represents a transaction. Size indicates amount.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SpendingPieChart;