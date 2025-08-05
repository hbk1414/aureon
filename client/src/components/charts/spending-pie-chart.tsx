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
    backgroundColor: 'rgba(20, 20, 30, 0.95)',
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
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      borderColor: 'transparent',
      textStyle: {
        color: '#fff',
        fontSize: 12
      }
    },
    animation: true,
    animationDuration: 1200,
    animationEasing: 'elasticOut',
    animationDelay: (idx: number) => idx * 100,
    series: [
      {
        type: 'scatter',
        coordinateSystem: 'cartesian2d',
        data: metaballData.map((item, index) => [
          item.value[0], // x percentage
          item.value[1], // y percentage  
          item.value[2], // size for symbolSize
          item.value[3], // amount for tooltip
          item.value[4]  // label for tooltip
        ]),
        symbolSize: (value: number[]) => Math.max(value[2] * 3, 15),
        symbol: 'circle',
        itemStyle: {
          color: (params: any) => {
            // Use the category color with variations
            const baseColor = selectedCategory?.color || '#4ECDC4';
            const hue = parseInt(baseColor.slice(1), 16);
            const variation = params.dataIndex * 20;
            return `hsl(${(hue + variation) % 360}, 70%, 60%)`;
          },
          shadowBlur: 15,
          shadowColor: 'rgba(255, 255, 255, 0.3)',
          opacity: 0.9
        },
        emphasis: {
          scale: true,
          scaleSize: 20,
          itemStyle: {
            shadowBlur: 25,
            opacity: 1,
            shadowColor: 'rgba(255, 255, 255, 0.5)'
          }
        },
        animationType: 'expansion'
      }
    ],
    xAxis: {
      type: 'value',
      show: false,
      min: 0,
      max: 100,
      splitLine: { show: false },
      axisLine: { show: false },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value', 
      show: false,
      min: 0,
      max: 100,
      splitLine: { show: false },
      axisLine: { show: false },
      axisTick: { show: false }
    },
    grid: {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      containLabel: false
    }
  };

  const chartOptions = showMetaballs ? metaballOptions : pieChartOptions;

  const createMetaballData = (transactions: Transaction[]) => {
    if (!transactions || transactions.length === 0) return [];
    
    const centerX = 50; // Percentage of chart width
    const centerY = 50; // Percentage of chart height
    const maxAmount = Math.max(...transactions.map(t => t.amount));
    
    return transactions.map((transaction, index) => {
      const angle = (index / transactions.length) * Math.PI * 2;
      const ringIndex = Math.floor(index / 6); // Create rings of 6 bubbles each
      const distance = 15 + ringIndex * 12; // Rings at different distances (percentage)
      const radius = Math.max((transaction.amount / maxAmount) * 8 + 3, 4); // Size based on relative amount
      
      return {
        value: [
          centerX + Math.cos(angle) * distance, // x position (percentage)
          centerY + Math.sin(angle) * distance, // y position (percentage)
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
      
      if (category && category.transactions) {
        setSelectedCategory(category);
        
        // Create metaball data from transactions
        const metaballs = createMetaballData(category.transactions);
        console.log('Created metaballs:', metaballs);
        setMetaballData(metaballs);
        setShowMetaballs(true);
      }
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
    <div className={`relative ${className} overflow-hidden rounded-lg`}>
      {/* Dark overlay animation */}
      <AnimatePresence>
        {showMetaballs && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 z-10"
          />
        )}
      </AnimatePresence>

      {/* Chart container with transition effects */}
      <motion.div
        animate={{
          scale: showMetaballs ? 1.1 : 1,
          rotateY: showMetaballs ? 5 : 0,
        }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        className="relative"
      >
        <ReactECharts
          ref={chartRef}
          option={chartOptions}
          style={{ height: '400px', width: '100%' }}
          onChartReady={onChartReady}
          notMerge={true}
          lazyUpdate={true}
        />
      </motion.div>

      {/* Controls */}
      <AnimatePresence>
        {showMetaballs && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="absolute top-4 right-4 z-20"
          >
            <button
              onClick={hideMetaballs}
              className="bg-white/10 backdrop-blur-md hover:bg-white/20 border border-white/20 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-lg transition-all duration-300 hover:scale-105"
            >
              ← Back to Chart
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category info overlay for metaballs */}
      <AnimatePresence>
        {showMetaballs && selectedCategory && (
          <motion.div
            initial={{ opacity: 0, x: -30, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -30, scale: 0.9 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="absolute bottom-4 left-4 bg-white/10 backdrop-blur-md rounded-xl p-4 shadow-xl border border-white/20 z-20"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div 
                className="w-4 h-4 rounded-full shadow-lg"
                style={{ backgroundColor: selectedCategory.color }}
              />
              <span className="font-semibold text-white text-base">
                {selectedCategory.name}
              </span>
            </div>
            <p className="text-sm text-white/80 mb-1">
              {selectedCategory.transactions?.length || 0} transactions • {formatAmount(selectedCategory.value)} total
            </p>
            <p className="text-xs text-white/60">
              Each bubble is a transaction. Larger bubbles = higher amounts.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subtle instruction overlay */}
      {!showMetaballs && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute top-4 right-4 text-xs text-gray-500 dark:text-gray-400 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg px-3 py-1"
        >
          Click segment for details
        </motion.div>
      )}
    </div>
  );
};

export default SpendingPieChart;