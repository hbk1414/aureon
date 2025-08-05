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
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const amount = params.value[3];
        const label = params.value[4];
        return `${label}<br/>£${amount.toFixed(2)}`;
      },
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderColor: 'transparent',
      textStyle: {
        color: '#fff',
        fontSize: 12
      }
    },
    series: [
      {
        type: 'custom',
        coordinateSystem: 'cartesian2d',
        data: metaballData,
        animationDuration: 1000,
        animationEasing: 'elasticOut',
        renderItem: (params: any, api: any) => {
          const value = api.value();
          const coord = api.coord([value[0], value[1]]);
          const radius = value[2];
          
          return {
            type: 'circle',
            shape: {
              cx: coord[0],
              cy: coord[1],
              r: radius
            },
            style: {
              fill: params.color,
              stroke: '#fff',
              lineWidth: 2,
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.3)'
            }
          };
        }
      }
    ],
    xAxis: {
      type: 'value',
      show: false,
      min: 0,
      max: 400
    },
    yAxis: {
      type: 'value',
      show: false,
      min: 0,
      max: 400
    }
  };

  const chartOptions = showMetaballs ? metaballOptions : pieChartOptions;

  const createMetaballData = (transactions: Transaction[]) => {
    const centerX = 200; // Chart center
    const centerY = 200;
    const baseRadius = 20;
    
    return transactions.map((transaction, index) => {
      const angle = (index / transactions.length) * Math.PI * 2;
      const distance = 60 + (index % 3) * 30; // Varied distances for organic look
      const radius = Math.max(baseRadius * (transaction.amount / 100), 8); // Size based on amount
      
      return {
        value: [
          centerX + Math.cos(angle) * distance, // x position
          centerY + Math.sin(angle) * distance, // y position
          radius, // radius
          transaction.amount, // amount for tooltip
          transaction.merchant || transaction.description, // label
          transaction.id // unique id
        ],
        itemStyle: {
          color: `hsl(${(index * 137.5) % 360}, 70%, 60%)` // Generate varied colors
        }
      };
    });
  };

  const handleChartClick = (params: any) => {
    if (params.componentType === 'series' && params.data && !showMetaballs) {
      const category = params.data.category;
      setSelectedCategory(category);
      
      // Create metaball data from transactions
      const metaballs = createMetaballData(category.transactions);
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