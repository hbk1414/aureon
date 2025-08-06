import React, { useState, useRef, useEffect } from "react";
import ReactECharts from "echarts-for-react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Play, Circle } from "lucide-react";
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
  bubbleColors?: string[];
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
  const chartRef = useRef<any>(null);

  // Freeze data when showing metaballs to prevent re-renders
  const currentData = showMetaballs ? frozenData : data;

  // Ensure we have valid data
  if (!currentData || currentData.length === 0) {
    return (
      <div className={`relative ${className}`}>
        <div className="h-96 flex items-center justify-center">
          <p className="text-white/60 font-light text-sm">
            No spending data available
          </p>
        </div>
      </div>
    );
  }

  // Vision Pro futuristic color palette - vibrant and high-contrast
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
        radius: ["50%", "85%"], // Larger donut for more impact
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
        data: currentData.map((item, index) => ({
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

  const createMetaballData = (transactions: Transaction[]) => {
    if (!transactions || transactions.length === 0) return [];

    const centerX = 50;
    const centerY = 50;
    const maxAmount = Math.max(...transactions.map((t) => t.amount));
    const minAmount = Math.min(...transactions.map((t) => t.amount));

    const sortedTransactions = [...transactions].sort(
      (a, b) => b.amount - a.amount,
    );

    return sortedTransactions.map((transaction, index) => {
      const name = transaction.merchant || transaction.description;
      const labelText = name.length > 18 ? name.substring(0, 16) + "..." : name;

      const labelLength = labelText.replace("...", "").length;
      const labelSizeModifier = Math.max(1.2, labelLength / 6);

      const itemsPerRing = 4;
      const ring = Math.floor(index / itemsPerRing);
      const positionInRing = index % itemsPerRing;
      const angle = (positionInRing / itemsPerRing) * Math.PI * 2;
      const ringRadius = 20 + ring * 28;

      const normalizedAmount =
        (transaction.amount - minAmount) / (maxAmount - minAmount || 1);
      const baseMinSize = 80;
      const baseMaxSize = 160;
      const amountBasedSize =
        baseMinSize + normalizedAmount * (baseMaxSize - baseMinSize);

      const labelMultiplier = Math.min(1.8, labelSizeModifier);
      const finalRadius = amountBasedSize * labelMultiplier;

      // Assign vibrant color to each bubble
      const bubbleColor = visionProColors[index % visionProColors.length];

      return {
        value: [
          centerX + Math.cos(angle) * ringRadius,
          centerY + Math.sin(angle) * ringRadius,
          finalRadius,
        ],
        symbolSize: finalRadius,
        itemStyle: {
          color: bubbleColor,
          borderColor: "rgba(255, 255, 255, 0.4)",
          borderWidth: 3,
          shadowBlur: 0,
          shadowColor: "transparent",
          opacity: 1,
        },
        transaction: transaction,
        labelText: labelText,
        amount: transaction.amount,
        bubbleColor: bubbleColor,
      };
    });
  };

  const metaballOptions = {
    backgroundColor: "transparent",
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
            <div style="font-size: 11px; line-height: 1.5; font-weight: 300;">
              <div style="color: rgba(255, 255, 255, 0.9); margin-bottom: 3px;">
                ${transaction.merchant || transaction.description}
              </div>
              <div style="color: rgba(255, 255, 255, 0.7); font-size: 13px; margin-bottom: 2px;">
                £${transaction.amount.toFixed(2)}
              </div>
              <div style="color: rgba(255, 255, 255, 0.5); font-size: 10px;">
                ${date}
              </div>
            </div>
          `;
        }
        return "Transaction";
      },
      backgroundColor: "rgba(255, 255, 255, 0.08)",
      borderColor: "rgba(255, 255, 255, 0.1)",
      borderWidth: 1,
      textStyle: {
        color: "rgba(255, 255, 255, 0.8)",
        fontWeight: 300,
      },
      extraCssText:
        "border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.1);",
    },
    animation: true,
    animationDuration: 800,
    animationEasing: "cubicOut",
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
          scaleSize: 8,
          itemStyle: {
            shadowBlur: 0,
            shadowColor: "transparent",
            opacity: 1,
          },
        },
      },
    ],
  };

  const chartOptions = showMetaballs ? metaballOptions : pieChartOptions;

  const handleChartClick = (params: any) => {
    if (
      params.componentType === "series" &&
      params.data &&
      !showMetaballs &&
      !isTransitioning
    ) {
      const category = params.data.category;

      if (category && category.transactions) {
        setIsTransitioning(true);
        setFrozenData([...data]);

        const metaballs = createMetaballData(category.transactions);

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
    setIsTransitioning(true);
    setShowMetaballs(false);
    setTimeout(() => {
      setSelectedCategory(null);
      setMetaballData([]);
      setFrozenData([]);
      setIsTransitioning(false);
    }, 400);
  };

  const onChartReady = (chartInstance: any) => {
    chartInstance.on("click", handleChartClick);
  };

  const formatAmount = (amount: number) => {
    return `£${Math.abs(amount).toFixed(2)}`;
  };

  return (
    <div className={`relative ${className} overflow-hidden`}>
      {/* Clean light background with subtle gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-100" />

      {/* Clean overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/20 to-white/10" />

      {/* Light metaball overlay */}
      <AnimatePresence>
        {showMetaballs && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="absolute inset-0 bg-gradient-to-br from-gray-100 via-gray-50 to-white z-10 rounded-3xl"
          />
        )}
      </AnimatePresence>

      {/* Light floating particles for depth */}
      <AnimatePresence>
        {showMetaballs && (
          <div className="absolute inset-0 z-5 pointer-events-none">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-gray-300/40 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -20, 0],
                  opacity: [0.2, 0.6, 0.2],
                  scale: [1, 1.3, 1],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Chart container with futuristic transitions */}
      <motion.div
        animate={{
          scale: showMetaballs ? 0.95 : 1,
          opacity: showMetaballs ? 0.3 : 1,
          filter: "blur(0px)",
        }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        className="relative z-20"
      >
        {showMetaballs ? (
          // Custom vibrant bubble visualization - completely bypassing ECharts
          <div className="h-[500px] relative overflow-hidden">
            {/* Generate bubbles directly in JSX */}
            <AnimatePresence>
              {selectedCategory?.transactions?.map((transaction, index) => {
                const name = transaction.merchant || transaction.description;
                const labelText =
                  name.length > 18 ? name.substring(0, 16) + "..." : name;

                // Position calculation
                const itemsPerRing = 4;
                const ring = Math.floor(index / itemsPerRing);
                const positionInRing = index % itemsPerRing;
                const angle = (positionInRing / itemsPerRing) * Math.PI * 2;
                const ringRadius = 15 + ring * 25; // percentage from center

                const centerX = 50; // center of container
                const centerY = 50;
                const x = centerX + Math.cos(angle) * ringRadius;
                const y = centerY + Math.sin(angle) * ringRadius;

                // Size calculation
                const maxAmount = Math.max(
                  ...selectedCategory.transactions.map((t) => t.amount),
                );
                const minAmount = Math.min(
                  ...selectedCategory.transactions.map((t) => t.amount),
                );
                const normalizedAmount =
                  (transaction.amount - minAmount) /
                  (maxAmount - minAmount || 1);
                const size = 80 + normalizedAmount * 80; // 80px to 160px

                // Color from palette
                const bubbleColor =
                  visionProColors[index % visionProColors.length];

                return (
                  <motion.div
                    key={`bubble-${transaction.id}-${index}`}
                    initial={{ scale: 0, opacity: 0, y: 30 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0, opacity: 0, y: -30 }}
                    transition={{
                      duration: 0.8,
                      delay: index * 0.15,
                      type: "spring",
                      stiffness: 120,
                    }}
                    whileHover={{
                      scale: 1.15,
                      boxShadow: "none",
                      filter: "brightness(1.2)",
                    }}
                    className="absolute rounded-full flex items-center justify-center cursor-pointer group transition-all duration-300"
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      width: `${size}px`,
                      height: `${size}px`,
                      transform: "translate(-50%, -50%)",
                      background: `linear-gradient(135deg, ${bubbleColor} 0%, ${bubbleColor}CC 100%)`,
                      border: `3px solid rgba(255, 255, 255, 0.4)`,
                      boxShadow: "none",
                    }}
                  >
                    <div className="text-center px-3">
                      <div className="text-white text-sm font-bold leading-tight mb-1">
                        {labelText}
                      </div>
                      <div className="text-white/90 text-xs font-semibold">
                        £{transaction.amount.toFixed(0)}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <ReactECharts
            ref={chartRef}
            option={chartOptions}
            style={{ height: "500px", width: "100%" }}
            onChartReady={onChartReady}
            notMerge={true}
            lazyUpdate={false}
          />
        )}
      </motion.div>

      {/* Vision Pro center control button - redesigned for light theme */}
      {!showMetaballs && (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30"
        >
          <div className="w-20 h-20 bg-white/80 backdrop-blur-xl border border-gray-200/60 rounded-full flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer group">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
              <Circle className="w-5 h-5 text-white" fill="currentColor" />
            </div>
          </div>
        </motion.div>
      )}

      {/* Apple-style back button */}
      <AnimatePresence>
        {showMetaballs && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -10 }}
            transition={{ delay: 0.4, duration: 0.4, type: "spring" }}
            className="absolute top-6 right-6 z-30"
          >
            <button
              onClick={hideMetaballs}
              className="bg-white/95 backdrop-blur-md hover:bg-white border border-gray-200/60 rounded-2xl px-5 py-3 text-sm font-semibold text-gray-700 shadow-lg transition-all duration-300 hover:scale-105 flex items-center gap-2"
            >
              <ArrowLeft size={14} />
              Back
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compact category header */}
      <AnimatePresence>
        {showMetaballs && selectedCategory && (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="absolute top-6 left-6 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-gray-200/60 z-30"
          >
            <div className="flex items-center space-x-3">
              <div
                className="w-4 h-4 rounded-full shadow-md"
                style={{ backgroundColor: selectedCategory.color }}
              />
              <div>
                <span className="font-semibold text-gray-800 text-base">
                  {selectedCategory.name}
                </span>
                <div className="text-sm text-gray-600 font-medium">
                  {selectedCategory.transactions?.length || 0} transactions •{" "}
                  {formatAmount(selectedCategory.value)}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modern instruction overlay */}
      {!showMetaballs && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="absolute top-6 right-6 text-sm text-gray-600 font-medium bg-white/60 backdrop-blur-md rounded-2xl px-4 py-2 z-20 border border-gray-200/40 shadow-lg"
        >
          ✨ Tap segments for details
        </motion.div>
      )}
    </div>
  );
};

export default SpendingPieChart;
