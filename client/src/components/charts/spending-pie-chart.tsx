import React, { useState, useRef } from "react";
import ReactECharts from "echarts-for-react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, X, Circle } from "lucide-react";

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

const SpendingPieChart: React.FC<SpendingPieChartProps> = ({
  data,
  className = "",
}) => {
  const [selectedCategory, setSelectedCategory] =
    useState<SpendingCategory | null>(null);
  const [showModal, setShowModal] = useState(false);
  const chartRef = useRef<any>(null);

  // Ensure we have valid data
  if (!data || data.length === 0) {
    return (
      <div className={`relative ${className}`}>
        <div className="h-96 flex items-center justify-center">
          <p className="text-gray-500 font-light text-sm">
            No spending data available
          </p>
        </div>
      </div>
    );
  }

  // Apple Vision Pro color palette
  const visionProColors = [
    "#007AFF", // Apple blue
    "#5856D6", // Purple
    "#AF52DE", // Violet
    "#FF2D92", // Pink
    "#FF3B30", // Red
    "#FF9500", // Orange
    "#FFCC00", // Yellow
    "#30D158", // Green
    "#64D2FF", // Light blue
    "#BF5AF2", // Magenta
  ];

  const pieChartOptions = {
    tooltip: {
      trigger: "item",
      formatter: (params: any) => {
        return `
          <div style="
            background: rgba(255, 255, 255, 0.95); 
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 16px;
            padding: 12px 16px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          ">
            <div style="
              font-size: 14px; 
              font-weight: 600; 
              color: #1d1d1f; 
              margin-bottom: 4px;
            ">${params.name}</div>
            <div style="
              font-size: 16px; 
              font-weight: 700; 
              color: ${params.color};
              margin-bottom: 2px;
            ">£${params.value}</div>
            <div style="
              font-size: 12px; 
              color: #86868b; 
              font-weight: 500;
            ">${params.percent}% of total</div>
          </div>
        `;
      },
      borderWidth: 0,
      backgroundColor: "transparent",
      extraCssText: "box-shadow: none;",
    },
    legend: {
      show: false,
    },
    series: [
      {
        name: "Spending",
        type: "pie",
        radius: ["50%", "85%"],
        center: ["50%", "50%"],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: "rgba(255, 255, 255, 0.8)",
          borderWidth: 3,
          shadowBlur: 15,
          shadowColor: "rgba(0, 0, 0, 0.1)",
        },
        label: {
          show: true,
          position: "outside",
          formatter: (params: any) => {
            return `{name|${params.name}}\n{value|£${params.value}}`;
          },
          rich: {
            name: {
              fontSize: 13,
              fontWeight: 600,
              color: "#1d1d1f",
              lineHeight: 18,
            },
            value: {
              fontSize: 11,
              fontWeight: 500,
              color: "#86868b",
              lineHeight: 16,
            },
          },
          distance: 25,
        },
        labelLine: {
          show: true,
          length: 15,
          length2: 10,
          lineStyle: {
            color: "#d2d2d7",
            width: 2,
          },
        },
        emphasis: {
          scale: true,
          scaleSize: 15,
          itemStyle: {
            shadowBlur: 25,
            shadowColor: "rgba(0, 0, 0, 0.2)",
            borderWidth: 4,
            borderColor: "rgba(255, 255, 255, 0.9)",
          },
          label: {
            fontSize: 14,
            fontWeight: 700,
          },
        },
        animationType: "scale",
        animationEasing: "elasticOut",
        animationDelay: (idx: number) => idx * 100,
        data: data.map((item, index) => ({
          value: item.value,
          name: item.name,
          itemStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 1,
              y2: 1,
              colorStops: [
                {
                  offset: 0,
                  color: visionProColors[index % visionProColors.length],
                },
                {
                  offset: 1,
                  color: `${visionProColors[index % visionProColors.length]}CC`,
                },
              ],
            },
            borderRadius: 8,
            borderColor: "rgba(255, 255, 255, 0.8)",
            borderWidth: 3,
            shadowBlur: 15,
            shadowColor: `${visionProColors[index % visionProColors.length]}40`,
          },
          category: item,
        })),
      },
    ],
  };

  const handleChartClick = (params: any) => {
    if (params.componentType === "series" && params.data) {
      const category = params.data.category;
      if (category) {
        setSelectedCategory(category);
        setShowModal(true);
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setTimeout(() => {
      setSelectedCategory(null);
    }, 300);
  };

  const onChartReady = (chartInstance: any) => {
    chartInstance.on("click", handleChartClick);
  };

  const formatAmount = (amount: number) => {
    return `£${Math.abs(amount).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  return (
    <div className={`relative ${className} overflow-hidden`}>
      {/* Clean light background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-100" />
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/20 to-white/10" />

      {/* Pie Chart */}
      <div className="relative z-20">
        <ReactECharts
          ref={chartRef}
          option={pieChartOptions}
          style={{ height: "500px", width: "100%" }}
          onChartReady={onChartReady}
          notMerge={true}
          lazyUpdate={false}
        />
      </div>

      {/* Instruction overlay */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="absolute top-6 right-6 text-sm text-gray-600 font-medium bg-white/60 backdrop-blur-md rounded-2xl px-4 py-2 z-20 border border-gray-200/40 shadow-lg"
      >
        ✨ Click segments for details
      </motion.div>

      {/* Modal Window */}
      <AnimatePresence>
        {showModal && selectedCategory && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
              onClick={closeModal}
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
              className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:transform md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl md:max-h-[80vh] bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 z-50 overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200/50">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-5 h-5 rounded-full shadow-md"
                    style={{ backgroundColor: selectedCategory.color }}
                  />
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">
                      {selectedCategory.name}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {selectedCategory.transactions?.length || 0} transactions
                      • {formatAmount(selectedCategory.value)} total
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>

              {/* Modal Body - Transaction List */}
              <div className="p-6 overflow-y-auto max-h-96">
                {selectedCategory.transactions &&
                selectedCategory.transactions.length > 0 ? (
                  <div className="space-y-3">
                    {selectedCategory.transactions.map((transaction, index) => (
                      <motion.div
                        key={transaction.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-4 bg-gray-50/50 rounded-xl hover:bg-gray-100/50 transition-colors"
                      >
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800">
                            {transaction.merchant || transaction.description}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {formatDate(transaction.date)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className="font-bold text-lg"
                            style={{ color: selectedCategory.color }}
                          >
                            {formatAmount(transaction.amount)}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    No transactions found for this category.
                  </p>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SpendingPieChart;
