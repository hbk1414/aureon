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

  const currentData = showMetaballs ? frozenData : data;

  const visionProColors = [
    "#007AFF",
    "#5856D6",
    "#AF52DE",
    "#FF2D92",
    "#FF3B30",
    "#FF9500",
    "#FFCC00",
    "#30D158",
    "#64D2FF",
    "#BF5AF2",
  ];

  const formatAmount = (amount: number) => `£${Math.abs(amount).toFixed(2)}`;

  const pieOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b} : £{c} ({d}%)'
    },
    series: [
      {
        name: 'Spending',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '50%'],
        data: currentData.map((item, index) => ({
          value: item.value,
          name: item.name,
          itemStyle: {
            color: item.color || visionProColors[index % visionProColors.length]
          }
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        label: {
          show: true,
          formatter: '{b}: £{c}'
        }
      }
    ]
  };

  const onChartClick = (params: any) => {
    const category = currentData[params.dataIndex];
    if (category && category.transactions?.length > 0) {
      setSelectedCategory(category);
      setFrozenData([...data]);
      setShowMetaballs(true);
    }
  };

  return (
    <div className="relative w-full h-[500px]">
      {!showMetaballs && (
        <ReactECharts
          ref={chartRef}
          option={pieOption}
          style={{ height: '500px', width: '100%' }}
          onEvents={{
            click: onChartClick,
          }}
        />
      )}
      
      {showMetaballs && (
        <div className="absolute top-4 left-4 z-10">
          <button
            onClick={() => setShowMetaballs(false)}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Chart
          </button>
        </div>
      )}
      
      <AnimatePresence>
        {showMetaballs && selectedCategory?.transactions?.map((transaction, index) => {
          const name = transaction.merchant || transaction.description;
          const labelText =
            name.length > 18 ? name.substring(0, 16) + "..." : name;

          const itemsPerRing = 4;
          const ring = Math.floor(index / itemsPerRing);
          const positionInRing = index % itemsPerRing;
          const angle = (positionInRing / itemsPerRing) * Math.PI * 2;
          const ringRadius = 15 + ring * 25;

          const centerX = 50;
          const centerY = 50;
          const x = centerX + Math.cos(angle) * ringRadius;
          const y = centerY + Math.sin(angle) * ringRadius;

          const maxAmount = Math.max(
            ...selectedCategory.transactions.map((t) => t.amount),
          );
          const minAmount = Math.min(
            ...selectedCategory.transactions.map((t) => t.amount),
          );
          const normalizedAmount =
            (transaction.amount - minAmount) / (maxAmount - minAmount || 1);
          const size = 80 + normalizedAmount * 80;

          const bubbleColor = visionProColors[index % visionProColors.length];

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
                boxShadow: `0 25px 50px ${bubbleColor}40`,
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
                boxShadow: `0 15px 35px ${bubbleColor}30, 0 5px 15px rgba(0, 0, 0, 0.12)`,
              }}
            >
              <div className="text-center px-3">
                <div className="text-white text-sm font-bold leading-tight mb-1 drop-shadow-lg">
                  {labelText}
                </div>
                <div className="text-white/90 text-xs font-semibold drop-shadow-md">
                  £{transaction.amount.toFixed(0)}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default SpendingPieChart;
