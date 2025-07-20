import { TrendingUp, PiggyBank, Calendar, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import CountUp from "react-countup";

interface QuickStatsProps {
  stats: {
    creditScore: number;
    savingsRate: number;
    debtFreeDays: number;
  };
}

// Progress Ring Component
const ProgressRing = ({ percentage, size = 60, strokeWidth = 4, color = "#3b82f6" }: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#e5e7eb"
        strokeWidth={strokeWidth}
        fill="transparent"
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="transparent"
        strokeDasharray={strokeDasharray}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        strokeLinecap="round"
      />
    </svg>
  );
};

export default function QuickStats({ stats }: QuickStatsProps) {
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Card className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] transition-all duration-300">
        <CardContent className="p-6">
          <motion.div 
            className="flex items-center gap-2 mb-6"
            variants={itemVariants}
          >
            <Star className="w-5 h-5 text-indigo-500" />
            <h3 className="text-xl font-bold text-gray-800">Quick Stats</h3>
          </motion.div>
          
          <div className="space-y-4">
            <motion.div 
              className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl border border-blue-100 shadow-[0_4px_12px_rgb(0,0,0,0.04)] hover:shadow-[0_6px_20px_rgb(0,0,0,0.08)] transition-all duration-300"
              variants={itemVariants}
              whileHover={{ scale: 1.02, y: -2 }}
            >
              <div className="flex items-center">
                <div className="relative mr-3">
                  <ProgressRing 
                    percentage={(stats.creditScore / 850) * 100} 
                    color="#3b82f6"
                    size={50}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <TrendingUp className="text-blue-600 w-4 h-4" />
                  </div>
                </div>
                <span className="text-sm uppercase tracking-wide text-gray-600 font-medium">Credit Score</span>
              </div>
              <motion.span 
                className="text-xl font-bold text-blue-600"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <CountUp end={stats.creditScore} duration={2} />
              </motion.span>
            </motion.div>

            <motion.div 
              className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100 shadow-[0_4px_12px_rgb(0,0,0,0.04)] hover:shadow-[0_6px_20px_rgb(0,0,0,0.08)] transition-all duration-300"
              variants={itemVariants}
              whileHover={{ scale: 1.02, y: -2 }}
            >
              <div className="flex items-center">
                <div className="relative mr-3">
                  <ProgressRing 
                    percentage={stats.savingsRate} 
                    color="#10b981"
                    size={50}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <PiggyBank className="text-emerald-600 w-4 h-4" />
                  </div>
                </div>
                <span className="text-sm uppercase tracking-wide text-gray-600 font-medium">Savings Rate</span>
              </div>
              <motion.span 
                className="text-xl font-bold text-emerald-600"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <CountUp end={stats.savingsRate} duration={2} />%
              </motion.span>
            </motion.div>

            {stats.debtFreeDays > 0 && (
              <motion.div 
                className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl border border-orange-100 shadow-[0_4px_12px_rgb(0,0,0,0.04)] hover:shadow-[0_6px_20px_rgb(0,0,0,0.08)] transition-all duration-300"
                variants={itemVariants}
                whileHover={{ scale: 1.02, y: -2 }}
              >
                <div className="flex items-center">
                  <div className="relative mr-3">
                    <ProgressRing 
                      percentage={Math.min((stats.debtFreeDays / 365) * 100, 100)} 
                      color="#f97316"
                      size={50}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Calendar className="text-orange-600 w-4 h-4" />
                    </div>
                  </div>
                  <span className="text-sm uppercase tracking-wide text-gray-600 font-medium">Days to Debt Free</span>
                </div>
                <motion.span 
                  className="text-xl font-bold text-orange-600"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  <CountUp end={stats.debtFreeDays} duration={2} />
                </motion.span>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
