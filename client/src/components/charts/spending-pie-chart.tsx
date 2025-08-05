import React, { useState, useRef, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

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
  const [bubblePosition, setBubblePosition] = useState({ x: 0, y: 0 });
  const chartRef = useRef<any>(null);

  const chartOptions = {
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
          show: true,
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

  const handleChartClick = (params: any, event: any) => {
    if (params.componentType === 'series' && params.data) {
      const category = params.data.category;
      setSelectedCategory(category);
      
      // Get click position relative to viewport
      const rect = event.event.target.getBoundingClientRect();
      setBubblePosition({
        x: event.event.clientX,
        y: event.event.clientY
      });
    }
  };

  const onChartReady = (chartInstance: any) => {
    chartInstance.on('click', handleChartClick);
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

      {/* Transaction Bubble Modal */}
      <AnimatePresence>
        {selectedCategory && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
              onClick={() => setSelectedCategory(null)}
            />
            
            {/* Bubble */}
            <motion.div
              initial={{ 
                opacity: 0, 
                scale: 0,
                x: bubblePosition.x - 200,
                y: bubblePosition.y - 200
              }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                x: bubblePosition.x - 200,
                y: bubblePosition.y - 150
              }}
              exit={{ 
                opacity: 0, 
                scale: 0.8,
                transition: { duration: 0.2 }
              }}
              transition={{
                type: "spring",
                damping: 20,
                stiffness: 300,
                duration: 0.4
              }}
              className="fixed z-50 w-96 max-h-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
              style={{
                left: 0,
                top: 0,
                transform: `translate(${bubblePosition.x - 200}px, ${bubblePosition.y - 150}px)`
              }}
            >
              {/* Header */}
              <div 
                className="p-4 border-b border-gray-200 dark:border-gray-700"
                style={{ backgroundColor: `${selectedCategory.color}15` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: selectedCategory.color }}
                    />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {selectedCategory.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {formatAmount(selectedCategory.value)} total
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Transactions List */}
              <div className="p-4 max-h-64 overflow-y-auto">
                <div className="space-y-3">
                  {selectedCategory.transactions.slice(0, 10).map((transaction) => (
                    <motion.div
                      key={transaction.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {transaction.merchant || transaction.description}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(transaction.date)}
                        </p>
                      </div>
                      <div className="flex-shrink-0 ml-3">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {formatAmount(transaction.amount)}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                  
                  {selectedCategory.transactions.length > 10 && (
                    <div className="text-center py-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        +{selectedCategory.transactions.length - 10} more transactions
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SpendingPieChart;