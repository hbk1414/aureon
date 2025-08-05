import React, { useState, useRef, useEffect } from "react";
import ReactECharts from "echarts-for-react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, CreditCard, TrendingUp, ArrowLeft } from "lucide-react";
import { graphic } from "echarts/core";
import MetaballPath from "./metaball-path";

// Register the metaball shape
graphic.registerShape("metaball", MetaballPath as any);

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
  bubbleColors?: string[]; // Optional custom color palette
}

const SpendingPieChart: React.FC<SpendingPieChartProps> = ({
  data,
  className = "",
  bubbleColors,
}) => {
  const [selectedCategory, setSelectedCategory] =
    useState<SpendingCategory | null>(null);
  const [showMetaballs, setShowMetaballs] = useState(false);
  const [metaballData, setMetaballData] = useState<any[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [frozenData, setFrozenData] = useState<SpendingCategory[]>([]);
  const [hoveredTransaction, setHoveredTransaction] =
    useState<Transaction | null>(null);
  const chartRef = useRef<any>(null);

  console.log("SpendingPieChart received data:", data);

  // Freeze data when showing metaballs to prevent re-renders
  const currentData = showMetaballs ? frozenData : data;

  // Ensure we have valid data
  if (!currentData || currentData.length === 0) {
    return (
      <div className={`relative ${className}`}>
        <div className="h-96 flex items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400">
            No spending data available
          </p>
        </div>
      </div>
    );
  }

  const pieChartOptions = {
    tooltip: {
      trigger: "item",
      formatter: "{a} <br/>{b}: £{c} ({d}%)",
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      borderColor: "transparent",
      textStyle: {
        color: "#fff",
        fontSize: 12,
      },
    },
    legend: {
      show: false,
    },
    series: [
      {
        name: "Spending",
        type: "pie",
        radius: ["40%", "70%"],
        center: ["50%", "50%"],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: "#fff",
          borderWidth: 2,
        },
        label: {
          show: true,
          position: "outside",
          formatter: "{b}\n£{c}",
          fontSize: 11,
          color: "#374151",
          fontWeight: "500",
        },
        emphasis: {
          scale: true,
          scaleSize: 10,
          itemStyle: {
            shadowBlur: 20,
            shadowOffsetX: 0,
            shadowColor: "rgba(0, 0, 0, 0.3)",
          },
        },
        data: currentData.map((item) => ({
          value: item.value,
          name: item.name,
          itemStyle: {
            color: item.color,
          },
          category: item,
        })),
      },
    ],
  };

  const createMetaballData = (transactions: Transaction[]) => {
    if (!transactions || transactions.length === 0) return [];

    const centerX = 50;
    const centerY = 50;
    const maxAmount = Math.max(...transactions.map((t) => t.amount));
    const minAmount = Math.min(...transactions.map((t) => t.amount));

    // Professional fintech color palette - clean and trustworthy
    const colors = bubbleColors || [
      "#7C3AED", // Violet
      "#6366F1", // Indigo
      "#06B6D4", // Cyan
      "#10B981", // Emerald
      "#F59E0B", // Amber
      "#EF4444", // Red
      "#8B5CF6", // Purple
      "#3B82F6", // Blue
    ];

    // Sort transactions by amount (largest first) for better visual hierarchy
    const sortedTransactions = [...transactions].sort(
      (a, b) => b.amount - a.amount,
    );

    return sortedTransactions.map((transaction, index) => {
      // Get the label text - be more generous with character limit
      const name = transaction.merchant || transaction.description;
      const labelText = name.length > 20 ? name.substring(0, 18) + "..." : name;

      // Calculate label-based size modifier - more aggressive sizing for long text
      const labelLength = labelText.replace("...", "").length;
      const labelSizeModifier = Math.max(1.2, labelLength / 6); // More size boost for longer text

      // Create concentric circles for better visibility with more spacing
      const itemsPerRing = 5; // Reduced from 6 to give more space for larger bubbles
      const ring = Math.floor(index / itemsPerRing);
      const positionInRing = index % itemsPerRing;
      const angle = (positionInRing / itemsPerRing) * Math.PI * 2;
      const ringRadius = 20 + ring * 30; // Increased spacing for larger bubbles

      // Enhanced size calculation with better text accommodation
      const normalizedAmount =
        (transaction.amount - minAmount) / (maxAmount - minAmount || 1);
      const baseMinSize = 80; // Larger base for better text fit
      const baseMaxSize = 220; // Larger max size
      const amountBasedSize =
        baseMinSize + normalizedAmount * (baseMaxSize - baseMinSize);

      // Apply label size modifier (minimum 1.2x, maximum 2.0x multiplier for long text)
      const labelMultiplier = Math.min(2.0, labelSizeModifier);
      const finalRadius = amountBasedSize * labelMultiplier;

      return {
        value: [
          centerX + Math.cos(angle) * ringRadius,
          centerY + Math.sin(angle) * ringRadius,
          finalRadius,
        ],
        symbolSize: finalRadius,
        itemStyle: {
          color: colors[index % colors.length],
          shadowBlur: 15, // Reduced for professional look
          shadowColor: "rgba(0, 0, 0, 0.15)", // Subtle shadow
          opacity: 0.95,
          borderColor: "rgba(255, 255, 255, 0.8)", // Softer border
          borderWidth: 2, // Thinner, cleaner border
        },
        transaction: transaction,
        label: {
          show: true,
          formatter: () => labelText,
          position: "inside",
          fontSize: Math.max(Math.min(finalRadius / 12, 16), 10), // Better font scaling
          fontWeight: "600", // Semi-bold for professionalism
          color: "#ffffff",
          textShadowColor: "rgba(0,0,0,0.6)",
          textShadowBlur: 2, // Subtle text shadow
          lineHeight: Math.max(Math.min(finalRadius / 10, 18), 12),
          width: finalRadius * 0.9, // More generous text width
          overflow: "break",
          padding: [4, 8], // Internal padding for better text spacing
          textAlign: "center",
        },
      };
    });
  };

  const metaballOptions = {
    backgroundColor: "rgba(30, 41, 59, 0.95)", // Dark semi-transparent background
    tooltip: {
      trigger: "item",
      formatter: (params: any) => {
        if (params.data && params.data.transaction) {
          const transaction = params.data.transaction;
          const date = new Date(transaction.date).toLocaleDateString("en-GB", {
            weekday: "short",
            day: "numeric",
            month: "short",
          });
          return `
            <div style="font-size: 13px; line-height: 1.4;">
              <div style="font-weight: bold; margin-bottom: 4px; color: #fff;">
                ${transaction.merchant || transaction.description}
              </div>
              <div style="color: #4ECDC4; font-size: 16px; font-weight: bold; margin-bottom: 4px;">
                £${transaction.amount.toFixed(2)}
              </div>
              <div style="color: #ccc; font-size: 11px;">
                ${date}
              </div>
            </div>
          `;
        }
        return "Transaction";
      },
      backgroundColor: "rgba(15, 23, 42, 0.95)",
      borderColor: "rgba(255, 255, 255, 0.1)",
      borderWidth: 1,
      textStyle: {
        color: "#fff",
      },
      extraCssText:
        "backdrop-filter: blur(10px); border-radius: 8px; box-shadow: 0 8px 32px rgba(0,0,0,0.3);",
    },
    animation: true,
    animationDuration: 1200,
    animationEasing: "elasticOut",
    grid: {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
    },
    xAxis: {
      type: "value",
      show: false,
      min: 0,
      max: 100,
    },
    yAxis: {
      type: "value",
      show: false,
      min: 0,
      max: 100,
    },
    series: [
      {
        type: "scatter",
        coordinateSystem: "cartesian2d",
        data: metaballData,
        emphasis: {
          scale: true,
          scaleSize: 5, // Subtle hover effect
          itemStyle: {
            shadowBlur: 20,
            opacity: 1,
            shadowColor: "rgba(0, 0, 0, 0.25)",
          },
        },
      },
    ],
  };

  const chartOptions = showMetaballs ? metaballOptions : pieChartOptions;

  const handleChartClick = (params: any) => {
    console.log("Chart clicked:", params);
    if (
      params.componentType === "series" &&
      params.data &&
      !showMetaballs &&
      !isTransitioning
    ) {
      const category = params.data.category;
      console.log("Selected category:", category);

      if (category && category.transactions) {
        setIsTransitioning(true);
        setFrozenData([...data]);

        const metaballs = createMetaballData(category.transactions);
        console.log("Created metaballs:", metaballs);

        setSelectedCategory(category);
        setMetaballData(metaballs);

        setTimeout(() => {
          setShowMetaballs(true);
          setIsTransitioning(false);
        }, 100);
      }
    }
  };

  const hideMetaballs = () => {
    setShowMetaballs(false);
    setTimeout(() => {
      setSelectedCategory(null);
      setMetaballData([]);
      setFrozenData([]);
      setHoveredTransaction(null);
    }, 300);
  };

  const onChartReady = (chartInstance: any) => {
    chartInstance.on("click", handleChartClick);
    console.log("Chart ready, data:", data);
  };

  const formatAmount = (amount: number) => {
    return `£${Math.abs(amount).toFixed(2)}`;
  };

  const getTransactionStats = (transactions: Transaction[]) => {
    if (!transactions || transactions.length === 0)
      return { avg: 0, highest: 0, mostRecent: null };

    const amounts = transactions.map((t) => t.amount);
    const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const highest = Math.max(...amounts);
    const mostRecent = transactions.reduce((a, b) =>
      new Date(a.date) > new Date(b.date) ? a : b,
    );

    return { avg, highest, mostRecent };
  };

  return (
    <div className={`relative ${className} overflow-hidden rounded-xl`}>
      {/* Professional dark overlay */}
      <AnimatePresence>
        {showMetaballs && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-750 to-slate-900 z-10"
          />
        )}
      </AnimatePresence>

      {/* Chart container with enhanced transition effects */}
      <motion.div
        animate={{
          scale: showMetaballs ? 1.05 : 1,
          rotateX: showMetaballs ? 2 : 0,
        }}
        transition={{ duration: 1, ease: "easeInOut" }}
        className="relative z-20"
      >
        <ReactECharts
          ref={chartRef}
          option={chartOptions}
          style={{ height: "500px", width: "100%" }}
          onChartReady={onChartReady}
          notMerge={true}
          lazyUpdate={false}
          key={showMetaballs ? `metaballs-${metaballData.length}` : "pie"}
        />
      </motion.div>

      {/* Enhanced Controls */}
      <AnimatePresence>
        {showMetaballs && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="absolute top-6 right-6 z-30"
          >
            <button
              onClick={hideMetaballs}
              className="bg-white/10 backdrop-blur-xl hover:bg-white/20 border border-white/20 rounded-xl px-6 py-3 text-sm font-medium text-white shadow-2xl transition-all duration-300 hover:scale-105 flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              Back to Chart
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compact Category header */}
      <AnimatePresence>
        {showMetaballs && selectedCategory && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: 0.8, duration: 0.4 }}
            className="absolute top-6 left-6 bg-white/10 backdrop-blur-xl rounded-xl p-4 shadow-xl border border-white/20 z-30"
          >
            <div className="flex items-center space-x-3">
              <div
                className="w-4 h-4 rounded-full shadow-lg"
                style={{ backgroundColor: selectedCategory.color }}
              />
              <div>
                <span className="font-bold text-white text-lg">
                  {selectedCategory.name}
                </span>
                <div className="text-sm text-white/80">
                  {selectedCategory.transactions?.length || 0} transactions •{" "}
                  {formatAmount(selectedCategory.value)}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced instruction overlay */}
      {!showMetaballs && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute top-6 right-6 text-sm text-gray-500 dark:text-gray-400 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl px-4 py-2 z-20 shadow-lg"
        >
          <span className="font-medium">💡 Click segments for details</span>
        </motion.div>
      )}

      {/* Animated particles background for metaballs */}
      <AnimatePresence>
        {showMetaballs && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 1, duration: 2 }}
            className="absolute inset-0 z-0 pointer-events-none"
          >
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white/20 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -20, 0],
                  opacity: [0.2, 0.8, 0.2],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SpendingPieChart;
